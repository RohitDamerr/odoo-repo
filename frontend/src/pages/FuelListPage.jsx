import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Button from '../components/ui/Button';
import FilterBar from '../components/ui/FilterBar';

const COLUMNS = [
  { key: 'vehicle', label: 'Vehicle', render: (v) => v ? `${v.registrationNumber} — ${v.name}` : '—' },
  { key: 'date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
  { key: 'liters', label: 'Liters', render: (v) => v != null ? `${v} L` : '—' },
  { key: 'cost', label: 'Cost', render: (v) => v != null ? `₹${v.toLocaleString()}` : '—' },
  { key: 'odometer', label: 'Odometer', render: (v) => v != null ? v.toLocaleString() : '—' },
  { key: 'trip', label: 'Trip', render: (v) => v ? `${v.source || ''} → ${v.destination || ''}` : '—' },
];

export default function FuelListPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [vehicleId, setVehicleId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    api.get('/vehicles', { params: { limit: 200 } }).then(({ data }) => setVehicles(data.data.vehicles || [])).catch(() => {});
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sort: '-date' };
      if (vehicleId) params.vehicle = vehicleId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await api.get('/fuel', { params });
      setLogs(data.data.fuelLogs);
      setTotalPages(data.data.pagination?.totalPages || 1);
    } finally { setLoading(false); }
  }, [page, vehicleId, startDate, endDate]);

  useEffect(() => { fetch(); }, [fetch]);

  const hasFilters = startDate || endDate || vehicleId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Fuel Logs</h1>
          <p className="text-sm text-muted mt-1">Track fuel consumption across the fleet.</p>
        </div>
        <Button onClick={() => navigate('/fuel/new')}>
          <span className="material-symbols-outlined text-lg">add</span>Log Fuel
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">From</label>
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">To</label>
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Vehicle</label>
          <select value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary">
            <option value="">All Vehicles</option>
            {vehicles.map((v) => <option key={v._id} value={v._id}>{v.registrationNumber} — {v.name}</option>)}
          </select>
        </div>
        {hasFilters && (
          <button onClick={() => { setStartDate(''); setEndDate(''); setVehicleId(''); setPage(1); }}
            className="text-xs text-muted hover:text-primary underline">Clear filters</button>
        )}
      </div>

      <Table columns={COLUMNS} data={logs} loading={loading} onRowClick={(row) => navigate(`/fuel/${row._id}`)} emptyMessage="No fuel logs found." />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
