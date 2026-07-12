import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: null },
  { to: '/vehicles', label: 'Vehicles', icon: 'local_shipping', roles: null },
  { to: '/drivers', label: 'Drivers', icon: 'person', roles: null },
  { to: '/trips', label: 'Trips', icon: 'route', roles: null },
  { to: '/maintenance', label: 'Maintenance', icon: 'build', roles: null },
  { to: '/fuel', label: 'Fuel', icon: 'local_gas_station', roles: null },
  { to: '/expenses', label: 'Expenses', icon: 'receipt_long', roles: null },
  { to: '/reports', label: 'Reports', icon: 'bar_chart', roles: null },
];

const RESTRICTED_ROLES = {
  financial_analyst: ['/dashboard', '/fuel', '/expenses', '/reports'],
  safety_officer: ['/dashboard', '/vehicles', '/maintenance', '/reports'],
  dispatcher: ['/dashboard', '/vehicles', '/drivers', '/trips'],
};

export default function Sidebar() {
  const { user, logout, isFinancialAnalyst, isSafetyOfficer, isDispatcher } = useAuth();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles && !isFinancialAnalyst && !isSafetyOfficer && !isDispatcher) return true;
    if (isFinancialAnalyst) return RESTRICTED_ROLES.financial_analyst.includes(item.to);
    if (isSafetyOfficer) return RESTRICTED_ROLES.safety_officer.includes(item.to);
    if (isDispatcher) return RESTRICTED_ROLES.dispatcher.includes(item.to);
    return true;
  });

  return (
    <aside className="w-64 bg-primary flex flex-col flex-shrink-0">
      <div className="px-5 py-6 border-b border-primary-light">
        <span className="text-xl font-bold text-white tracking-tight">TransitOps</span>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
        {visibleItems.map((item) => {
          const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                active
                  ? 'bg-primary-light text-white'
                  : 'text-gray-400 hover:bg-primary-light hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-primary-light px-5 py-4">
        <div className="text-white text-sm font-medium truncate">{user?.name}</div>
        <div className="text-gray-400 text-xs capitalize mb-3">{user?.role?.replace(/_/g, ' ')}</div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
