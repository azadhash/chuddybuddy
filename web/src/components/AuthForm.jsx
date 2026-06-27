import { useId, useState } from 'react';
import { login, register } from '../lib/api.js';

// Email/password sign-in and registration. Real labels, a single live-region for
// errors, and a clear mode toggle. On success it hands the user up to App.
export default function AuthForm({ onAuthed }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailId = useId();
  const pwId = useId();
  const isRegister = mode === 'register';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = isRegister ? register : login;
      const user = await fn(email.trim(), password);
      onAuthed(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth card" aria-labelledby="auth-title">
      <h2 id="auth-title" className="card__title">
        {isRegister ? 'Create your account' : 'Welcome back'}
      </h2>
      <p className="auth__intro">
        Anchor keeps your conversations private to your account so it can notice your patterns
        over time.
      </p>

      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor={emailId}>Email</label>
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor={pwId}>Password</label>
          <input
            id={pwId}
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {isRegister && <p className="field__hint">At least 8 characters.</p>}
        </div>

        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>

        {error && (
          <p className="alert" role="alert">
            <span aria-hidden="true">⚠ </span>
            {error}
          </p>
        )}
      </form>

      <p className="auth__toggle">
        {isRegister ? 'Already have an account?' : 'New to Anchor?'}{' '}
        <button
          type="button"
          className="linkbutton"
          onClick={() => {
            setMode(isRegister ? 'login' : 'register');
            setError('');
          }}
        >
          {isRegister ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </section>
  );
}
