import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <main className="page">
      <h1>AI Capsule</h1>
      <p>
        A private prompt library. Save the prompts you use with ChatGPT, Copilot, Gemini or
        Claude, note how useful the answers were, and improve them over time.
      </p>
      <Link className="btn" to="/login">Get started</Link>
    </main>
  );
}