export default function Login() {
  return (
    <main className="page">
      <h1>Log in</h1>
      <p>Sign in with your GitHub account to open your capsules.</p>
      {/* plain link: this must be a full page navigation to the backend */}
      <a className="btn" href="/api/auth/github">Login with GitHub</a>
    </main>
  );
}