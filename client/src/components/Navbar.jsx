import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="nav">
      <Link to="/" className="brand">
        SplitEase
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <span>{user.name}</span>
            <button type="button" className="linkish" onClick={logout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </header>
  );
}
