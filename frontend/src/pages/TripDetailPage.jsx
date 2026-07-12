import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completeForm, setCompleteForm] = useState({ actualOdometer: '', fuelConsumed: '' });
  const [error, setError] = useState(null);

  const fetchTrip = () => {
    api.get(`/trips/${id}`).then(({ data }) => {
      setTrip(data.data.trip);
    }).catch((err) => {
      setError(err.response?.data?.message || 'Failed to load trip');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTrip(); }, [id]);

  const handleDispatch = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/trips/${id}/dispatch`);
      fetchTrip();
      setActionLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Dispatch failed');
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!completeForm.actualOdometer || Number(completeForm.actualOdometer) <= 0) {
      setError('Actual odometer reading is required');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/trips/${id}/complete`, {
        actualOdometer: Number(completeForm.actualOdometer),
        fuelConsumed: completeForm.fuelConsumed ? Number(completeForm.fuelConsumed) : null,
      });
      setShowComplete(false);
      fetchTrip();
      setActionLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Complete failed');
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/trips/${id}/cancel`);
      setShowCancel(false);
      fetchTrip();
      setActionLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Cancel failed');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!trip) return <p className="text-muted text-center py-10">{error || 'Trip not found.'}</p>;

  const stripe = trip.status === 'Dispatched' ? 'border-l-blue-500' : trip.status === 'Completed' ? 'border-l-green-500' : trip.status === 'Cancelled' ? 'border-l-red-500' : 'border-l-gray-300';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/trips')} className="text-sm text-muted hover:text-primary flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Trips
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary">{trip.source} → {trip.destination}</h1>
            <Badge label={trip.status} />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-error text-sm flex items-start gap-2">
          <span className="material-symbols-outlined text-sm">warning</span>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
        </div>
      )}

      <div className={`bg-white p-6 rounded-xl border border-gray-200 border-l-4 ${stripe} grid grid-cols-1 md:grid-cols-2 gap-6`}>
        <div className="space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Trip Info</h3>
          <Field label="Source" value={trip.source} />
          <Field label="Destination" value={trip.destination} />
          <Field label="Cargo Weight" value={`${trip.cargoWeight} kg`} />
          <Field label="Planned Distance" value={`${trip.plannedDistance} km`} />
          <Field label="Revenue" value={trip.revenue ? `₹${trip.revenue.toLocaleString()}` : '—'} />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Assignment</h3>
          <Field label="Vehicle" value={trip.vehicle ? `${trip.vehicle.registrationNumber} — ${trip.vehicle.name}` : '—'} />
          <Field label="Driver" value={trip.driver ? trip.driver.name : 'Unassigned'} />
          {trip.driver && (
            <>
              <Field label="License" value={trip.driver.licenseNumber} />
              <Field label="Driver Status" value={<Badge label={trip.driver.status} />} />
            </>
          )}
        </div>
      </div>

      {trip.status === 'Completed' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Actual Odometer" value={trip.actualOdometer ? `${trip.actualOdometer} km` : '—'} />
          <Field label="Fuel Consumed" value={trip.fuelConsumed ? `${trip.fuelConsumed} L` : '—'} />
          <Field label="Completed At" value={trip.completedAt ? new Date(trip.completedAt).toLocaleString() : '—'} />
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
        <h3 className="text-lg font-semibold text-primary">Actions</h3>

        <div className="flex flex-wrap gap-3">
          {trip.status === 'Draft' && (
            <>
              <Button onClick={handleDispatch} loading={actionLoading}>
                <span className="material-symbols-outlined text-lg">send</span>
                Dispatch Trip
              </Button>
              <Button variant="danger" onClick={() => setShowCancel(true)}>
                <span className="material-symbols-outlined text-lg">cancel</span>
                Cancel Trip
              </Button>
            </>
          )}

          {trip.status === 'Dispatched' && (
            <>
              <Button onClick={() => setShowComplete(true)}>
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Complete Trip
              </Button>
              <Button variant="danger" onClick={() => setShowCancel(true)}>
                Cancel Trip
              </Button>
            </>
          )}

          {(trip.status === 'Completed' || trip.status === 'Cancelled') && (
            <p className="text-sm text-muted">This trip is {trip.status.toLowerCase()}. No further actions available.</p>
          )}
        </div>
      </div>

      <Modal
        open={showCancel}
        title="Cancel Trip"
        message={`Are you sure you want to cancel this trip from ${trip.source} to ${trip.destination}? ${trip.status === 'Dispatched' ? 'Vehicle and driver will be restored to Available.' : ''}`}
        confirmLabel="Yes, Cancel Trip"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleCancel}
        onCancel={() => setShowCancel(false)}
      />

      <Modal
        open={showComplete}
        title="Complete Trip"
        message="Record the final odometer reading and fuel consumed."
        confirmLabel="Complete Trip"
        loading={actionLoading}
        onConfirm={handleComplete}
        onCancel={() => setShowComplete(false)}
      >
        <div className="space-y-4 mb-4">
          <Input
            label="Actual Odometer Reading (km)"
            name="actualOdometer"
            type="number"
            value={completeForm.actualOdometer}
            onChange={(e) => setCompleteForm((p) => ({ ...p, actualOdometer: e.target.value }))}
            placeholder="e.g. 175"
            required
          />
          <Input
            label="Fuel Consumed (L) — optional"
            name="fuelConsumed"
            type="number"
            value={completeForm.fuelConsumed}
            onChange={(e) => setCompleteForm((p) => ({ ...p, fuelConsumed: e.target.value }))}
            placeholder="e.g. 14.5"
          />
        </div>
      </Modal>
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
