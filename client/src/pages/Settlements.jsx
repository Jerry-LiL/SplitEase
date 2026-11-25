import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { rupees, signedRupees } from '../format';
import GroupTabs from '../components/GroupTabs';

function balanceClass(balance) {
  if (balance > 0) return 'plus';
  if (balance < 0) return 'minus';
  return '';
}

function balanceWords(balance) {
  if (balance > 0) return 'gets back ' + rupees(balance);
  if (balance < 0) return 'owes ' + rupees(Math.abs(balance));
  return 'settled';
}

function PaymentList({ summary }) {
  if (summary.balances.length === 0) {
    return null;
  }
  if (summary.settlements.length === 0) {
    return <p className="hint">Everyone is settled. No one needs to pay anyone.</p>;
  }
  return (
    <>
      <ul className="pay-list">
        {summary.settlements.map((item) => (
          <li key={item.from.memberId + '-' + item.to.memberId + '-' + item.amount}>
            <strong>{item.from.name}</strong> pays <strong>{item.to.name}</strong>{' '}
            {rupees(item.amount)}
          </li>
        ))}
      </ul>
      <p className="hint">
        We match the person who owes the most with the person who is owed the most,
        and repeat until every balance is zero.
      </p>
    </>
  );
}

export default function Settlements() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const groupRes = await api.get('/groups/' + id);
        const summaryRes = await api.get('/groups/' + id + '/settlements');
        if (ignore) return;
        setGroup(groupRes.data);
        setSummary(summaryRes.data);
      } catch (err) {
        if (ignore) return;
        setError(getErrorMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return <p className="page">Loading...</p>;
  }

  if (!group || !summary) {
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

      <section>
        <h2>Running balances</h2>
        {summary.balances.length === 0 ? (
          <p className="hint">Add members on the Expenses page first.</p>
        ) : (
          <>
            <p className="hint">
              A positive balance means the group owes this person. A negative balance
              means they still owe money.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Balance</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {summary.balances.map((row) => (
                    <tr key={row.memberId} className={balanceClass(row.balance)}>
                      <td>{row.name}</td>
                      <td>{signedRupees(row.balance)}</td>
                      <td>{balanceWords(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section>
        <h2>Who pays whom</h2>
        <PaymentList summary={summary} />
      </section>
    </div>
  );
}
