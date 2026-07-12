import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import SearchInput from '../components/ui/SearchInput';
import Button from '../components/ui/Button';

const STATUS_OPTS = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

const COLUMNS = [
  { key: 'source', label: 'Source' },
  { key: 'destination', label: 'Destination' },
  {
    key: 'vehicle',
    label: 'Vehicle',
    render: (v) => (v ? `${v.registrationNumber}` : '—'),
  },
  {
    key: 'driver',
    label: 'Driver',
    render: (v) => (v ? v.name : 'Unassigned'),
  },
  {
    key: 'cargoWeight',
    label: 'Cargo',
    render: (v) => (v != null ? `${v} kg` : '—'),
  },
  {
    key: 'revenue',
    label: 'Revenue',
    render: (v) => (v != null ? `₹${v.toLocaleString()}` : '—'),
  },
  {
    key: 'status',
    label: 'Status',
    render: (v) => <Badge label={v} />,
  },
];

export default function TripListPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sort: '-createdAt' };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/api/trips', { params });
      setTrips(data.data.trips);
      setTotalPages(data.data.pagination?.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const statusCounts = { Draft: 0, Dispatched: 0, Completed: 0, Cancelled: 0 };
  trips.forEach((t) => { if (statusCounts[t.status] !== undefined) statusCounts[t.status]++; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Trip Dispatcher</h1>
          <p className="text-sm text-muted mt-1">Create, dispatch, and monitor trips</p>
        </div>
        <Button onClick={() => navigate('/trips/new')}>
          <span className="material-symbols-outlined text-lg">add</span>
          Create Trip
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {STATUS_OPTS.map((s) => {
          const active = statusFilter === s;
          const colors = {
            Draft: active ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 border border-gray-300',
            Dispatched: active ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200',
            Completed: active ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 border border-green-200',
            Cancelled: active ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 border border-red-200',
          };
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(active ? '' : s); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors ${colors[s]}`}
            >
              <span className={`w-2 h-2 rounded-full ${active ? 'bg-white' : s === 'Draft' ? 'bg-gray-500' : s === 'Dispatched' ? 'bg-blue-500' : s === 'Completed' ? 'bg-green-500' : 'bg-red-500'}`} />
              {s} ({statusCounts[s] || 0})
            </button>
          );
        })}
      </div>

      <Table
        columns={COLUMNS}
        data={trips}
        loading={loading}
        onRowClick={(row) => navigate(`/trips/${row._id}`)}
        emptyMessage="No trips found. Create your first trip."
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <div className="flex items-start gap-2 text-sm text-muted bg-amber-50 border border-amber-200 rounded-lg p-4">
        <span className="material-symbols-outlined text-amber-600 mt-0.5">info</span>
        <p><strong className="text-amber-700">Rule:</strong> On Complete — odometer recorded → fuel log → expenses. Vehicle &amp; Driver are restored to Available automatically.</p>
      </div>
    </div>
  );
}
