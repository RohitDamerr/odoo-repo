import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const PRESETS = [
  { label: 'This Month', get: () => { const d = new Date(); return { start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10), end: new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().slice(0,10) }; } },
  { label: 'Last Month', get: () => { const d = new Date(); d.setMonth(d.getMonth()-1); return { start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10), end: new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().slice(0,10) }; } },
  { label: 'This Quarter', get: () => { const d = new Date(); const q = Math.floor(d.getMonth() / 3); return { start: new Date(d.getFullYear(), q*3, 1).toISOString().slice(0,10), end: new Date(d.getFullYear(), q*3+3, 0).toISOString().slice(0,10) }; } },
  { label: 'This Year', get: () => { const d = new Date(); return { start: new Date(d.getFullYear(), 0, 1).toISOString().slice(0,10), end: new Date(d.getFullYear(), 11, 31).toISOString().slice(0,10) }; } },
  { label: 'Custom', get: null },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isFleetManager, isDispatcher, isSafetyOfficer, isFinancialAnalyst } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('This Month');
  const [startDate, setStartDate] = useState(() => PRESETS[0].get().start);
  const [endDate, setEndDate] = useState(() => PRESETS[0].get().end);

  const fetchData = useCallback((start, end) => {
    setLoading(true);
    api.get('/dashboard/kpis', { params: { startDate: start, endDate: end } })
      .then(({ data }) => setKpis(data.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(startDate, endDate); }, []);

  const handlePreset = (label) => {
    setPreset(label);
    const p = PRESETS.find(x => x.label === label);
    if (p && p.get) {
      const { start, end } = p.get();
      setStartDate(start);
      setEndDate(end);
      fetchData(start, end);
    }
  };

  const handleApply = () => { fetchData(startDate, endDate); };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!kpis) return <p className="text-muted">Failed to load dashboard.</p>;

  const isAdminOrFM = isAdmin || isFleetManager;
  const isDriver = user?.role === 'driver';

  return (
    <div className="space-y-6">
      {/* ── Date Filter ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Period</label>
          <select
            value={preset}
            onChange={(e) => handlePreset(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {PRESETS.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPreset('Custom'); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPreset('Custom'); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-light transition-colors"
        >
          Apply
        </button>
      </div>

      {/* ── Welcome Header ──────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-primary">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-sm text-muted mt-1">
          {kpis.period.startDate.slice(0, 10)} — {kpis.period.endDate.slice(0, 10)}
        </p>
      </div>

      {/* ── Admin / Fleet Manager ── */}
      {isAdminOrFM && <AdminDashboard kpis={kpis} navigate={navigate} />}

      {/* ── Dispatcher ── */}
      {isDispatcher && <DispatcherDashboard kpis={kpis} navigate={navigate} />}

      {/* ── Safety Officer ── */}
      {isSafetyOfficer && <SafetyDashboard kpis={kpis} navigate={navigate} />}

      {/* ── Financial Analyst ── */}
      {isFinancialAnalyst && <FinanceDashboard kpis={kpis} navigate={navigate} />}

      {/* ── Driver ── */}
      {isDriver && <DriverDashboard kpis={kpis} />}
    </div>
  );
}

function AdminDashboard({ kpis, navigate }) {
  const { fleet, drivers, trips, maintenance, fuel, expenses, operationalCostThisMonth } = kpis;

  return (
    <>
      <section>
        <h2 className="text-lg font-semibold text-primary mb-4">Fleet Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card title="Total Vehicles" value={fleet.totalVehicles} icon="local_shipping" color="blue" onClick={() => navigate('/vehicles')} />
          <Card title="Available" value={fleet.availableVehicles} icon="check_circle" color="green" />
          <Card title="On Trip" value={fleet.onTripVehicles} icon="route" color="blue" />
          <Card title="In Shop" value={fleet.inShopVehicles} icon="build" color="orange" />
          <Card title="Retired" value={fleet.retiredVehicles} icon="archive" color="gray" />
          <Card title="Utilization" value={`${fleet.fleetUtilization}%`} icon="speed" color="blue" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-primary mb-4">Driver Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card title="Total Drivers" value={drivers.totalDrivers} icon="group" color="blue" onClick={() => navigate('/drivers')} />
          <Card title="Available" value={drivers.availableDrivers} icon="person" color="green" />
          <Card title="On Trip" value={drivers.onTripDrivers} icon="directions_bus" color="blue" />
          <Card title="Off Duty" value={drivers.offDutyDrivers} icon="bedtime" color="gray" />
          <Card title="Suspended" value={drivers.suspendedDrivers} icon="block" color="red" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-primary mb-4">Trip Activity</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card title="Active Trips" value={trips.activeTrips} icon="local_shipping" color="blue" onClick={() => navigate('/trips')} />
          <Card title="Pending" value={trips.pendingTrips} icon="pending" color="gray" />
          <Card title="Completed (Month)" value={trips.completedThisMonth} icon="task_alt" color="green" />
          <Card title="Cancelled (Month)" value={trips.cancelledThisMonth} icon="cancel" color="red" />
          <Card title="Revenue (Month)" value={`₹${trips.revenueThisMonth.toLocaleString()}`} icon="payments" color="green" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg font-semibold text-primary mb-4">Financial Summary (Month)</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card title="Fuel Cost" value={`₹${fuel.costThisMonth.toLocaleString()}`} icon="local_gas_station" color="orange" onClick={() => navigate('/fuel')} />
            <Card title="Maintenance Cost" value={`₹${maintenance.costThisMonth.toLocaleString()}`} icon="build" color="orange" onClick={() => navigate('/maintenance')} />
            <Card title="Expenses" value={`₹${expenses.totalThisMonth.toLocaleString()}`} icon="receipt_long" color="orange" onClick={() => navigate('/expenses')} />
            <Card title="Operational Cost" value={`₹${operationalCostThisMonth.toLocaleString()}`} icon="account_balance" color="red" />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary mb-4">Expense Breakdown</h2>
          {expenses.byType.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              {expenses.byType.map((e) => (
                <div key={e.type} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{e.type}</span>
                  <span className="text-sm font-semibold">₹{e.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No expenses this month.</p>
          )}
        </section>
      </div>
    </>
  );
}

function DispatcherDashboard({ kpis, navigate }) {
  const { fleet, drivers, trips } = kpis;

  return (
    <>
      <section>
        <h2 className="text-lg font-semibold text-primary mb-4">Dispatch Readiness</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="Available Vehicles" value={fleet.availableVehicles} icon="local_shipping" color="green" onClick={() => navigate('/vehicles')} />
          <Card title="Available Drivers" value={drivers.availableDrivers} icon="person" color="green" onClick={() => navigate('/drivers')} />
          <Card title="Pending Dispatch" value={trips.pendingTrips} icon="pending" color="gray" onClick={() => navigate('/trips')} />
          <Card title="Active Trips" value={trips.activeTrips} icon="route" color="blue" onClick={() => navigate('/trips')} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-primary mb-4">Today's Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="Completed (Month)" value={trips.completedThisMonth} icon="task_alt" color="green" />
          <Card title="Cancelled (Month)" value={trips.cancelledThisMonth} icon="cancel" color="red" />
          <Card title="In Shop" value={fleet.inShopVehicles} icon="build" color="orange" />
          <Card title="Fleet Utilization" value={`${fleet.fleetUtilization}%`} icon="speed" color="blue" />
        </div>
      </section>
    </>
  );
}

function SafetyDashboard({ kpis, navigate }) {
  const { fleet, maintenance } = kpis;

  return (
    <>
      <section>
        <h2 className="text-lg font-semibold text-primary mb-4">Safety &amp; Maintenance Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="Vehicles In Shop" value={fleet.inShopVehicles} icon="build" color="orange" onClick={() => navigate('/vehicles')} />
          <Card title="Active Maintenance" value={maintenance.activeJobs} icon="engineering" color="orange" onClick={() => navigate('/maintenance')} />
          <Card title="Jobs This Month" value={maintenance.jobsThisMonth} icon="plumbing" color="blue" />
          <Card title="Maintenance Cost" value={`₹${maintenance.costThisMonth.toLocaleString()}`} icon="payments" color="orange" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-primary mb-4">Fleet Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="Total Vehicles" value={fleet.totalVehicles} icon="local_shipping" color="blue" />
          <Card title="Available" value={fleet.availableVehicles} icon="check_circle" color="green" />
          <Card title="On Trip" value={fleet.onTripVehicles} icon="route" color="blue" />
          <Card title="Retired" value={fleet.retiredVehicles} icon="archive" color="gray" />
        </div>
      </section>
    </>
  );
}

function FinanceDashboard({ kpis, navigate }) {
  const { fleet, trips, maintenance, fuel, expenses, operationalCostThisMonth } = kpis;

  return (
    <>
      <section>
        <h2 className="text-lg font-semibold text-primary mb-4">Fleet Value</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="Total Vehicles" value={fleet.totalVehicles} icon="local_shipping" color="blue" onClick={() => navigate('/vehicles')} />
          <Card title="Active Fleet" value={fleet.activeFleet} icon="check_circle" color="green" />
          <Card title="Fleet Utilization" value={`${fleet.fleetUtilization}%`} icon="speed" color="blue" />
          <Card title="Retired" value={fleet.retiredVehicles} icon="archive" color="gray" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-primary mb-4">Revenue &amp; Costs (Month)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="Trip Revenue" value={`₹${trips.revenueThisMonth.toLocaleString()}`} icon="payments" color="green" />
          <Card title="Fuel Cost" value={`₹${fuel.costThisMonth.toLocaleString()}`} icon="local_gas_station" color="orange" onClick={() => navigate('/fuel')} />
          <Card title="Maintenance Cost" value={`₹${maintenance.costThisMonth.toLocaleString()}`} icon="build" color="orange" />
          <Card title="Operational Cost" value={`₹${operationalCostThisMonth.toLocaleString()}`} icon="account_balance" color="red" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-primary mb-4">Expense Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="Total Expenses" value={`₹${expenses.totalThisMonth.toLocaleString()}`} icon="receipt_long" color="orange" onClick={() => navigate('/expenses')} />
          <Card title="Completed Trips" value={trips.completedThisMonth} icon="task_alt" color="blue" />
          <Card title="Avg Revenue/Trip" value={`₹${trips.avgRevenuePerTrip.toLocaleString()}`} icon="trending_up" color="green" />
          <Card title="Fuel Efficiency" value={`${fuel.litersThisMonth > 0 ? (trips.avgRevenuePerTrip > 0 ? '—' : '—') : '—'}`} icon="speed" color="blue" />
        </div>
      </section>

      {expenses.byType.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-primary mb-4">Expense by Type</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-md">
            {expenses.byType.map((e) => (
              <div key={e.type} className="flex justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                <span className="capitalize text-muted">{e.type}</span>
                <span className="font-semibold">₹{e.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function DriverDashboard({ kpis }) {
  const { drivers, trips } = kpis;

  return (
    <>
      <section>
        <h2 className="text-lg font-semibold text-primary mb-4">My Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="Active Trips" value={trips.activeTrips} icon="route" color="blue" />
          <Card title="Completed (Month)" value={trips.completedThisMonth} icon="task_alt" color="green" />
          <Card title="Drivers On Trip" value={drivers.onTripDrivers} icon="group" color="blue" />
          <Card title="Available Drivers" value={drivers.availableDrivers} icon="person" color="green" />
        </div>
      </section>
    </>
  );
}
