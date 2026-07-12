import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import SearchInput from '../components/ui/SearchInput';
import FilterBar from '../components/ui/FilterBar';
import Button from '../components/ui/Button';

const COLUMNS = [
  {
    key: 'vehicle',
    label: 'Vehicle',
    render: (v) =>
      v ? `${v.registrationNumber} — ${v.name}` : '—',
  },
  {
    key: 'date',
    label: 'Date',
    render: (v) =>
      v ? new Date(v).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
  },
  {
    key: 'liters',
    label: 'Liters',
    render: (v) => (v != null ? `${v.toLocaleString()} L` : '—'),
  },
  {
    key: 'cost',
    label: 'Cost',
    render: (v) => (v != null ? `₹${v.toLocaleString()}` : '—'),
  },
  {
    key: 'odometer',
    label: 'Odometer',
    render: (v) => (v != null ? `${v.toLocaleString()} km` : '—'),
  },
  {
    key: 'trip',
    label: 'Trip',
    render: (v) =>
      v ? `${v.source} → ${v.destination}` : '—',
  },
];

export default function FuelListPage() {
  const navigate = useNavigate();
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState(null);

  const fetchFuelLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, sort: '-date' };
      if (vehicleFilter) params.vehicle = vehicleFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await api.get('/fuel', { params });
      setFuelLogs(data.data.fuelLogs);
      setTotalPages(data.data.pagination?.totalPages || 1);

      // Calculate summary from current data
      let totalLiters = 0;
      let totalCost = 0;
      (data.data.fuelLogs || []).forEach((f) => {
        totalLiters += f.liters || 0;
        totalCost += f.cost || 0;
      });
      setSummary({ totalLiters: +totalLiters.toFixed(2), totalCost: +totalCost.toFixed(2) });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, vehicleFilter, startDate, endDate]);

  useEffect(() => {
    fetchFuelLogs();
  }, [fetchFuelLogs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Fuel Logs</h1>
          <p className="text-sm text-muted mt-1">Track fuel consumption across the fleet.</p>
        </div>
        <Button onClick={() => navigate('/fuel/new')}>
          <span className="material-symbols-outlined text-lg">add</span>
          Log Fuel
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          value={vehicleFilter}
          onChange={(v) => {
            setVehicleFilter(v);
            setPage(1);
          }}
          placeholder="Filter by vehicle ID..."
        />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
            placeholder="Start Date"
          />
          <span className="text-muted text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
            placeholder="End Date"
          />
        </div>
        {(vehicleFilter || startDate || endDate) && (
          <button
            onClick={() => { setVehicleFilter(''); setStartDate(''); setEndDate(''); setPage(1); }}
            className="text-sm text-secondary hover:text-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            Clear Filters
          </button>
        )}
      </div>

      <Table
        columns={COLUMNS}
        data={fuelLogs}
        loading={loading}
        onRowClick={(row) => navigate(`/fuel/${row._id}`)}
        emptyMessage="No fuel logs found. Log your first fuel transaction."
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-4">
          <span className="material-symbols-outlined text-blue-600">local_gas_station</span>
          <div className="flex gap-8">
            <div>
              <span className="text-sm text-muted">Total Fuel (this page): </span>
              <span className="font-semibold text-on-surface">{summary.totalLiters} L</span>
            </div>
            <div>
              <span className="text-sm text-muted">Total Cost (this page): </span>
              <span className="font-semibold text-on-surface">₹{summary.totalCost.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
