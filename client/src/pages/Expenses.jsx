import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { rupees } from '../format';
import GroupTabs from '../components/GroupTabs';
import ExpenseForm from '../components/ExpenseForm';

function shareText(expense) {
  const parts = [];
  for (const split of expense.splits) {
    if (split.amount > 0) {
      parts.push(split.member.name + ' ' + rupees(split.amount));
    }
  }
  const label = expense.splitType === 'equal' ? 'Equal' : 'Custom';
  if (parts.length === 0) return label;
  return label + ' · ' + parts.join(', ');
}

export default function Expenses() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [memberName, setMemberName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);

  async function load() {
    try {
      const groupRes = await api.get('/groups/' + id);
      const expenseRes = await api.get('/groups/' + id + '/expenses');
      setGroup(groupRes.data);
      setExpenses(expenseRes.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function addMember(event) {
    event.preventDefault();
    setError('');
    setAddingMember(true);
    try {
      const res = await api.post('/groups/' + id + '/members', { name: memberName.trim() });
      setGroup(res.data);
      setMemberName('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAddingMember(false);
    }
  }

  if (loading) {
    return <p className="page">Loading...</p>;
  }

  if (!group) {
    return (
      <div className="page">
        <p className="error">{error || 'Group not found'}</p>
        <Link to="/">Back to groups</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <p className="back">
        <Link to="/">All groups</Link>
      </p>
      <h1>{group.name}</h1>
      <GroupTabs groupId={group._id} />
      {error ? <p className="error">{error}</p> : null}

      <section className="card">
        <h2>Members</h2>
        {group.members.length === 0 ? (
          <p className="hint">Add the people who will share bills in this group.</p>
        ) : (
          <ul className="member-list">
            {group.members.map((member) => (
              <li key={member._id}>{member.name}</li>
            ))}
          </ul>
        )}
        <form className="inline-form" onSubmit={addMember}>
          <input
            value={memberName}
            onChange={(event) => setMemberName(event.target.value)}
            placeholder="Name, e.g. Alice"
            maxLength={40}
            required
          />
          <button type="submit" disabled={addingMember || !memberName.trim()}>
            {addingMember ? 'Adding...' : 'Add member'}
          </button>
        </form>
      </section>

      {group.members.length === 0 ? (
        <p className="hint">Add at least one member, then you can record an expense.</p>
      ) : (
        <ExpenseForm groupId={group._id} members={group.members} onAdded={load} />
      )}

      <section>
        <h2>Expenses</h2>
        {expenses.length === 0 ? <p className="hint">No expenses yet.</p> : null}
        {expenses.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Paid by</th>
                  <th>Split</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td>{expense.description}</td>
                    <td>{rupees(expense.amount)}</td>
                    <td>{expense.paidBy.name}</td>
                    <td>{shareText(expense)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
