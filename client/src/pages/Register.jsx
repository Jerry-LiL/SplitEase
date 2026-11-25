import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getErrorMessage } from '../api';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>Create an account</h1>
      <p className="hint">
        This login is yours. People you split with are just names inside a group.
      </p>
      <form className="card" onSubmit={handleSubmit}>
        {error ? <p className="error">{error}</p> : null}
        <label className="field">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            minLength={2}
            required
          />
        </label>
        <label className="field">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Register'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
