import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => setStatus(res.ok ? 'in' : 'out'))
      .catch(() => setStatus('out'));
  }, []);

  if (status === 'loading') return <p className="page">Loading…</p>;
  if (status === 'out') return <Navigate to="/login" replace />;
  return children;
}