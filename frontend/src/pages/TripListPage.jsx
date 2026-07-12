import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const STATUS_OPTS = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

const COLUMNS = [
  { key: 'source', label: 'Source' },
  { key: 'destination', label: 'Destination' },
  { key: 'vehicle', label: 'Vehicle', render: (v) => v ? `${v.registrationNumber}` : '—' },
  { key: 'driver', label: 'Driver', render: (v) => v ? v.name : 'Unassigned' },
  { key: 'cargoWeight', label: 'Cargo', render: (v) => v != null ? `${v} kg` : '—' },
  { key: 'revenue', label: 'Revenue', render: (v) => v != null ? `₹${v.toLocaleString()}` : '—' },
  { key: 'status', label: 'Status', render: (v) => <Badge label={v} /> },
];

export default function TripListPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    api.get('/vehicles', { params: { limit: 200 } }).then(({ data }) => setVehicles(data.data.vehicles || []));
  }, []);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sort: '-createdAt' };
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (vehicleId) params.vehicle = vehicleId;
      const { data } = await api.get('/trips', { params });
      setTrips(data.data.trips);
      setTotalPages(data.data.pagination?.totalPages || 1);
    } finally { setLoading(false); }
  }, [page, statusFilter, startDate, endDate, vehicleId]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const clearAll = () => { setStatusFilter(''); setStartDate(''); setEndDate(''); setVehicleId(''); setPage(1); };
  const hasFilters = statusFilter || startDate || endDate || vehicleId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Trip Dispatcher</h1>
          <p className="text-sm text-muted mt-1">Create, dispatch, and monitor trips</p>
        </div>
        <Button onClick={() => navigate('/trips/new')}>
          <span className="material-symbols-outlined text-lg">add</span>Create Trip
        </Button>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTS.map((s) => {
          const active = statusFilter === s;
          const colors = {
            Draft: active ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 border border-gray-300',
            Dispatched: active ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200',
            Completed: active ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 border border-green-200',
            Cancelled: active ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 border border-red-200',
          };
          return (
            <button key={s} onClick={() => { setStatusFilter(active ? '' : s); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${colors[s]}`}>{s}</button>
          );
        })}
      </div>

      {/* Date + Vehicle filter bar */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">From</label>
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-on-surface focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">To</label>
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-on-surface focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Vehicle</label>
          <select value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-on-surface focus:outline-none focus:border-primary">
            <option value="">All Vehicles</option>
            {vehicles.map((v) => <option key={v._id} value={v._id}>{v.registrationNumber} — {v.name}</option>)}
          </select>
        </div>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-muted hover:text-primary underline">Clear filters</button>
        )}
      </div>

      <Table columns={COLUMNS} data={trips} loading={loading} onRowClick={(row) => navigate(`/trips/${row._id}`)} emptyMessage="No trips found." />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
