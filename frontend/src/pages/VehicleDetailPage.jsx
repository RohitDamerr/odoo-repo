import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get(`/vehicles/${id}`).then(({ data }) => {
      setVehicle(data.data.vehicle);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/vehicles/${id}`);
      navigate('/vehicles');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!vehicle) return <p className="text-muted">Vehicle not found.</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/vehicles')} className="text-sm text-muted hover:text-primary flex items-center gap-1 mb-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Fleet
          </button>
          <h1 className="text-2xl font-bold text-primary">{vehicle.name}</h1>
          <p className="text-sm text-muted">{vehicle.registrationNumber}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(`/vehicles/${id}/edit`)}>Edit</Button>
          <Button variant="danger" onClick={() => setShowDelete(true)}>Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Vehicle Info</h3>
          <div className="space-y-3">
            <Field label="Type" value={vehicle.type} />
            <Field label="Status" value={<Badge label={vehicle.status} />} />
            <Field label="Odometer" value={vehicle.odometer?.toLocaleString()} />
            <Field label="Max Load" value={`${vehicle.maxLoadCapacity?.toLocaleString()} kg`} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Financial</h3>
          <div className="space-y-3">
            <Field label="Acquisition Cost" value={`₹${vehicle.acquisitionCost?.toLocaleString()}`} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Dates</h3>
          <div className="space-y-3">
            <Field label="Registered" value={new Date(vehicle.createdAt).toLocaleDateString()} />
            <Field label="Last Updated" value={new Date(vehicle.updatedAt).toLocaleDateString()} />
          </div>
        </div>
      </div>

      <Modal
        open={showDelete}
        title="Delete Vehicle"
        message={`Are you sure you want to delete ${vehicle.name} (${vehicle.registrationNumber})?`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="text-sm text-on-surface font-medium mt-0.5">{value ?? '—'}</div>
    </div>
  );
}
