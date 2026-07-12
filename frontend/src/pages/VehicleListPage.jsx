import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import SearchInput from '../components/ui/SearchInput';
import FilterBar from '../components/ui/FilterBar';
import Button from '../components/ui/Button';

const TYPE_OPTS = ['Truck', 'Van', 'Pickup', 'Trailer', 'Bus', 'Car', 'Other'].map((v) => ({ value: v, label: v }));
const STATUS_OPTS = ['Available', 'On Trip', 'In Shop', 'Retired'].map((v) => ({ value: v, label: v }));

const COLUMNS = [
  { key: 'registrationNumber', label: 'Plate No' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'maxLoadCapacity', label: 'Capacity (kg)' },
  { key: 'odometer', label: 'Odometer' },
  { key: 'acquisitionCost', label: 'Cost', render: (v) => v != null ? `₹${v.toLocaleString()}` : '—' },
  { key: 'status', label: 'Status', render: (v) => <Badge label={v} /> },
];

export default function VehicleListPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, sort: '-createdAt' };
      if (search) params.search = search;
      if (status) params.status = status;
      if (type) params.type = type;

      const { data } = await api.get('/vehicles', { params });
      setVehicles(data.data.vehicles);
      setTotalPages(data.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, type]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Fleet Registry</h1>
          <p className="text-sm text-muted mt-1">Manage your vehicle fleet</p>
        </div>
        <Button onClick={() => navigate('/vehicles/new')}>
          <span className="material-symbols-outlined text-lg">add</span>
          Add Vehicle
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search plate no or name..." />
        <FilterBar
          filters={[
            { key: 'status', label: 'Status', options: STATUS_OPTS, value: status, onChange: (v) => { setStatus(v); setPage(1); } },
            { key: 'type', label: 'Type', options: TYPE_OPTS, value: type, onChange: (v) => { setType(v); setPage(1); } },
          ]}
          onClear={() => { setStatus(''); setType(''); setPage(1); }}
        />
      </div>

      <Table
        columns={COLUMNS}
        data={vehicles}
        loading={loading}
        onRowClick={(row) => navigate(`/vehicles/${row._id}`)}
        emptyMessage="No vehicles found. Add your first vehicle."
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
