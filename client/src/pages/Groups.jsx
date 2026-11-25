import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api';

function memberLine(group) {
  if (group.members.length === 0) return 'No members yet';
  const names = [];
  for (const member of group.members) {
    names.push(member.name);
  }
  return names.join(', ');
}

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/groups')
      .then((res) => setGroups(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.post('/groups', { name: name.trim() });
      navigate('/groups/' + res.data._id);
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h1>Groups</h1>
      <p className="hint">
        Create a group for a trip, a flat, or a dinner. Then add the people and the bills.
      </p>

      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Group name, e.g. Goa trip"
          maxLength={60}
          required
        />
        <button type="submit" disabled={saving || !name.trim()}>
          {saving ? 'Creating...' : 'Create group'}
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}

      {loading ? <p>Loading...</p> : null}

      {!loading && groups.length === 0 ? (
        <p className="hint">No groups yet. Create one above.</p>
      ) : null}

      {groups.map((group) => (
        <Link className="card group-card" key={group._id} to={'/groups/' + group._id}>
          <h2>{group.name}</h2>
          <p>{memberLine(group)}</p>
        </Link>
      ))}
    </div>
  );
}
