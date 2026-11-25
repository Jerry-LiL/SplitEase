import { NavLink } from 'react-router-dom';

export default function GroupTabs({ groupId }) {
  return (
    <nav className="tabs">
      <NavLink to={'/groups/' + groupId} end>
        Expenses
      </NavLink>
      <NavLink to={'/groups/' + groupId + '/settlements'}>Settlements</NavLink>
    </nav>
  );
}
