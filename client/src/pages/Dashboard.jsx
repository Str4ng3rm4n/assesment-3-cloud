import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const empty = {
  project_name: '', prompt_title: '', prompt_version: '', prompt_text: '',
  response_summary: '', category: 'Coding', usefulness: 'Good',
  reviewed: false, improved: false, screenshot_url: '', notes: '',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [capsules, setCapsules] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function api(url, options) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (res.status === 401) {
      navigate('/login');
      throw new Error('Not signed in');
    }
    return res;
  }

  async function load() {
    const res = await api('/api/capsules');
    setCapsules(await res.json());
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  function change(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    const url = editingId ? `/api/capsules/${editingId}` : '/api/capsules';
    const res = await api(url, {
      method: editingId ? 'PUT' : 'POST',
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Something went wrong');
      return;
    }
    setForm(empty);
    setEditingId(null);
    load();
  }

  function startEdit(c) {
    setEditingId(c.id);
    setForm({
      ...c,
      reviewed: !!c.reviewed,
      improved: !!c.improved,
      prompt_version: c.prompt_version || '',
      response_summary: c.response_summary || '',
      screenshot_url: c.screenshot_url || '',
      notes: c.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(id) {
    if (!window.confirm('Delete this capsule?')) return;
    await api(`/api/capsules/${id}`, { method: 'DELETE' });
    load();
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    navigate('/login');
  }

  return (
    <main className="page">
      <header className="bar">
        <h1>My capsules</h1>
        <button onClick={logout}>Log out</button>
      </header>

      <form onSubmit={submit} className="card">
        <h2>{editingId ? 'Edit capsule' : 'New capsule'}</h2>
        {error && <p className="error">{error}</p>}

        <label>Project name *
          <input name="project_name" value={form.project_name} onChange={change} required />
        </label>
        <label>Prompt title *
          <input name="prompt_title" value={form.prompt_title} onChange={change} required />
        </label>
        <label>Prompt version
          <input name="prompt_version" value={form.prompt_version} onChange={change} placeholder="v1" />
        </label>
        <label>Prompt text *
          <textarea name="prompt_text" value={form.prompt_text} onChange={change} rows="4" required />
        </label>
        <label>Response summary
          <textarea name="response_summary" value={form.response_summary} onChange={change} rows="3" />
        </label>
        <label>Category
          <select name="category" value={form.category} onChange={change}>
            <option>Coding</option>
            <option>Writing</option>
            <option>Research</option>
            <option>Other</option>
          </select>
        </label>
        <label>Usefulness
          <select name="usefulness" value={form.usefulness} onChange={change}>
            <option>Good</option>
            <option>Needs Improvement</option>
          </select>
        </label>
        <label className="check">
          <input type="checkbox" name="reviewed" checked={form.reviewed} onChange={change} /> Reviewed
        </label>
        <label className="check">
          <input type="checkbox" name="improved" checked={form.improved} onChange={change} /> Improved
        </label>
        <label>Screenshot URL
          <input name="screenshot_url" value={form.screenshot_url} onChange={change} placeholder="https://..." />
        </label>
        <label>Notes
          <textarea name="notes" value={form.notes} onChange={change} rows="2" />
        </label>

        <div className="row">
          <button type="submit" className="btn">{editingId ? 'Save changes' : 'Add capsule'}</button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(empty); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2>Saved capsules ({capsules.length})</h2>
      {capsules.length === 0 && <p>No capsules yet.</p>}
      {capsules.map((c) => (
        <article key={c.id} className="card">
          <h3>{c.prompt_title} <small>{c.prompt_version}</small></h3>
          <p><strong>{c.project_name}</strong> · {c.category} · {c.usefulness}</p>
          <p>{c.prompt_text}</p>
          {c.response_summary && <p><em>{c.response_summary}</em></p>}
          <p>Reviewed: {c.reviewed ? 'Yes' : 'No'} · Improved: {c.improved ? 'Yes' : 'No'}</p>
          {c.screenshot_url && <p><a href={c.screenshot_url} target="_blank" rel="noreferrer">Screenshot</a></p>}
          {c.notes && <p>Notes: {c.notes}</p>}
          <div className="row">
            <button onClick={() => startEdit(c)}>Edit</button>
            <button onClick={() => remove(c.id)}>Delete</button>
          </div>
        </article>
      ))}
    </main>
  );
}