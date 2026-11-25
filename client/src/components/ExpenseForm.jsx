import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { rupees } from '../format';

export default function ExpenseForm({ groupId, members, onAdded }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(members[0] ? members[0]._id : '');
  const [splitType, setSplitType] = useState('equal');
  const [included, setIncluded] = useState(() => members.map((member) => member._id));
  const [customAmounts, setCustomAmounts] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIncluded(members.map((member) => member._id));
    setPaidBy((current) => {
      const stillThere = members.some((member) => member._id === current);
      if (stillThere) return current;
      return members[0] ? members[0]._id : '';
    });
  }, [members]);

  function toggleMember(memberId) {
    setIncluded((current) => {
      if (current.includes(memberId)) {
        return current.filter((id) => id !== memberId);
      }
      return current.concat(memberId);
    });
  }

  const customSum = members.reduce((sum, member) => {
    return sum + (Number(customAmounts[member._id]) || 0);
  }, 0);
  const customMatches = Math.abs(customSum - (Number(amount) || 0)) < 0.009;
  const canSave =
    description.trim() &&
    Number(amount) > 0 &&
    paidBy &&
    (splitType === 'equal' ? included.length > 0 : customMatches);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);

    const body = {
      description: description.trim(),
      amount: Number(amount),
      paidBy,
      splitType,
    };

    if (splitType === 'equal') {
      body.memberIds = included;
    } else {
      body.splits = members.map((member) => ({
        member: member._id,
        amount: Number(customAmounts[member._id] || 0),
      }));
    }

    try {
      await api.post('/groups/' + groupId + '/expenses', body);
      setDescription('');
      setAmount('');
      setSplitType('equal');
      setIncluded(members.map((member) => member._id));
      setCustomAmounts({});
      onAdded();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Add an expense</h2>
      {error ? <p className="error">{error}</p> : null}

      <label className="field">
        Description
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Dinner, cab, rent..."
          maxLength={80}
          required
        />
      </label>

      <label className="field">
        Amount
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
          required
        />
      </label>

      <label className="field">
        Paid by
        <select value={paidBy} onChange={(event) => setPaidBy(event.target.value)}>
          {members.map((member) => (
            <option key={member._id} value={member._id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="choices">
        <legend>How to split</legend>
        <label className="check">
          <input
            type="radio"
            name="splitType"
            value="equal"
            checked={splitType === 'equal'}
            onChange={() => setSplitType('equal')}
          />
          Equal
        </label>
        <label className="check">
          <input
            type="radio"
            name="splitType"
            value="custom"
            checked={splitType === 'custom'}
            onChange={() => setSplitType('custom')}
          />
          Custom
        </label>
      </fieldset>

      {splitType === 'equal' ? (
        <div>
          <p className="hint">
            Tick who shares this bill. The amount is divided equally. Any leftover
            paisa goes to the first people in the list.
          </p>
          {members.map((member) => (
            <label className="check" key={member._id}>
              <input
                type="checkbox"
                checked={included.includes(member._id)}
                onChange={() => toggleMember(member._id)}
              />
              {member.name}
            </label>
          ))}
        </div>
      ) : (
        <div>
          <p className="hint">
            Type each person's share. Leave a box blank for 0. The shares must add
            up to the total.
          </p>
          {members.map((member) => (
            <label className="field" key={member._id}>
              {member.name}
              <input
                type="number"
                min="0"
                step="0.01"
                value={customAmounts[member._id] ?? ''}
                onChange={(event) =>
                  setCustomAmounts((current) => ({
                    ...current,
                    [member._id]: event.target.value,
                  }))
                }
              />
            </label>
          ))}
          <p className={customMatches ? 'hint' : 'error'}>
            Shares add up to {rupees(customSum)} of {rupees(Number(amount) || 0)}.
          </p>
        </div>
      )}

      <button type="submit" disabled={!canSave || saving}>
        {saving ? 'Saving...' : 'Add expense'}
      </button>
    </form>
  );
}
