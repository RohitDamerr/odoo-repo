import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

export default function FuelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fuelLog, setFuelLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/fuel/${id}`)
      .then(({ data }) => {
        setFuelLog(data.data.fuelLog);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load fuel log'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/fuel/${id}`);
      navigate('/fuel');
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
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

  if (!fuelLog) return <p className="text-muted text-center py-10">{error || 'Fuel log not found.'}</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/fuel')}
            className="text-sm text-muted hover:text-primary flex items-center gap-1 mb-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Fuel Logs
          </button>
          <h1 className="text-2xl font-bold text-primary">Fuel Transaction</h1>
          <p className="text-sm text-muted">
            {fuelLog.vehicle?.registrationNumber} —{' '}
            {fuelLog.date
              ? new Date(fuelLog.date).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(`/fuel/${id}/edit`)}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => setShowDelete(true)}>
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-error text-sm flex items-start gap-2">
          <span className="material-symbols-outlined text-sm">warning</span>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Vehicle</h3>
          <div className="space-y-3">
            <Field
              label="Vehicle"
              value={
                fuelLog.vehicle
                  ? `${fuelLog.vehicle.registrationNumber} — ${fuelLog.vehicle.name}`
                  : '—'
              }
            />
            <Field label="Type" value={fuelLog.vehicle?.type || '—'} />
            <Field label="Status" value={fuelLog.vehicle?.status || '—'} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Fuel Details</h3>
          <div className="space-y-3">
            <Field label="Liters" value={`${fuelLog.liters} L`} />
            <Field label="Cost" value={`₹${(fuelLog.cost || 0).toLocaleString()}`} />
            <Field
              label="Cost per Liter"
              value={
                fuelLog.liters && fuelLog.cost
                  ? `₹${(fuelLog.cost / fuelLog.liters).toFixed(2)} /L`
                  : '—'
              }
            />
            <Field
              label="Odometer"
              value={fuelLog.odometer != null ? `${fuelLog.odometer.toLocaleString()} km` : '—'}
            />
            <Field
              label="Date"
              value={
                fuelLog.date
                  ? new Date(fuelLog.date).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'
              }
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Trip</h3>
          <div className="space-y-3">
            {fuelLog.trip ? (
              <>
                <Field label="Route" value={`${fuelLog.trip.source} → ${fuelLog.trip.destination}`} />
                <Field label="Status" value={fuelLog.trip.status} />
              </>
            ) : (
              <p className="text-sm text-muted">No trip linked</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
        <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Timestamps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Created"
            value={
              fuelLog.createdAt
                ? new Date(fuelLog.createdAt).toLocaleString()
                : '—'
            }
          />
          <Field
            label="Last Updated"
            value={
              fuelLog.updatedAt
                ? new Date(fuelLog.updatedAt).toLocaleString()
                : '—'
            }
          />
        </div>
      </div>

      <Modal
        open={showDelete}
        title="Delete Fuel Log"
        message="Are you sure you want to delete this fuel log? This action cannot be undone."
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
