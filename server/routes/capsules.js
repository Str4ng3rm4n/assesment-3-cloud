const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth); // protects GET, POST, PUT and DELETE

function clean(body) {
  const text = (v) => (v === undefined || v === null ? '' : String(v).trim());
  return {
    project_name: text(body.project_name),
    prompt_title: text(body.prompt_title),
    prompt_version: text(body.prompt_version),
    prompt_text: text(body.prompt_text),
    response_summary: text(body.response_summary),
    category: text(body.category),
    usefulness: text(body.usefulness),
    reviewed: body.reviewed ? 1 : 0,
    improved: body.improved ? 1 : 0,
    screenshot_url: text(body.screenshot_url),
    notes: text(body.notes),
  };
}

function missingRequired(c) {
  return !c.project_name || !c.prompt_title || !c.prompt_text;
}

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM capsules WHERE user_id = ? ORDER BY id DESC')
    .all(req.user.user_id);
  res.json(rows);
});

router.post('/', (req, res) => {
  const c = clean(req.body);
  if (missingRequired(c)) {
    return res.status(400).json({ error: 'project_name, prompt_title and prompt_text are required' });
  }
  const info = db
    .prepare(
      `INSERT INTO capsules
       (user_id, project_name, prompt_title, prompt_version, prompt_text, response_summary,
        category, usefulness, reviewed, improved, screenshot_url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.user_id, c.project_name, c.prompt_title, c.prompt_version, c.prompt_text,
      c.response_summary, c.category, c.usefulness, c.reviewed, c.improved, c.screenshot_url, c.notes
    );
  const row = db.prepare('SELECT * FROM capsules WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  const c = clean(req.body);
  if (missingRequired(c)) {
    return res.status(400).json({ error: 'project_name, prompt_title and prompt_text are required' });
  }
  const info = db
    .prepare(
      `UPDATE capsules SET project_name = ?, prompt_title = ?, prompt_version = ?, prompt_text = ?,
        response_summary = ?, category = ?, usefulness = ?, reviewed = ?, improved = ?,
        screenshot_url = ?, notes = ?
       WHERE id = ? AND user_id = ?`
    )
    .run(
      c.project_name, c.prompt_title, c.prompt_version, c.prompt_text, c.response_summary,
      c.category, c.usefulness, c.reviewed, c.improved, c.screenshot_url, c.notes,
      id, req.user.user_id
    );
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json(db.prepare('SELECT * FROM capsules WHERE id = ?').get(id));
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  const info = db
    .prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?')
    .run(id, req.user.user_id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

module.exports = router;