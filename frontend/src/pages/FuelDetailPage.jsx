import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

export default function FuelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { api.get(`/fuel/${id}`).then(({ data }) => setLog(data.data.fuelLog)).finally(() => setLoading(false)); }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try { await api.delete(`/fuel/${id}`); navigate('/fuel'); } finally { setDeleting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!log) return <p className="text-muted text-center py-10">Fuel log not found.</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/fuel')} className="text-sm text-muted hover:text-primary flex items-center gap-1 mb-1"><span className="material-symbols-outlined text-sm">arrow_back</span>Back to Fuel Logs</button>
          <h1 className="text-2xl font-bold text-primary">{log.vehicle?.registrationNumber} — {log.liters} L</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(`/fuel/${id}/edit`)}>Edit</Button>
          <Button variant="danger" onClick={() => setShowDelete(true)}>Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Vehicle</h3>
          <Field label="Vehicle" value={log.vehicle ? `${log.vehicle.registrationNumber} — ${log.vehicle.name}` : '—'} />
          <Field label="Type" value={log.vehicle?.type} />
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Fuel Details</h3>
          <Field label="Liters" value={`${log.liters} L`} />
          <Field label="Cost" value={`₹${log.cost?.toLocaleString()}`} />
          <Field label="Odometer" value={log.odometer?.toLocaleString() || '—'} />
          <Field label="Date" value={log.date ? new Date(log.date).toLocaleDateString() : '—'} />
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Trip</h3>
          <Field label="Trip" value={log.trip ? `${log.trip.source} → ${log.trip.destination}` : '—'} />
          <Field label="Created" value={new Date(log.createdAt).toLocaleDateString()} />
        </div>
      </div>

      <Modal open={showDelete} title="Delete Fuel Log" message="Permanently delete this fuel transaction?" confirmLabel="Delete" variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
    </div>
  );
}

function Field({ label, value }) { return <div><div className="text-xs text-muted">{label}</div><div className="text-sm text-on-surface font-medium mt-0.5">{value ?? '—'}</div></div>; }
