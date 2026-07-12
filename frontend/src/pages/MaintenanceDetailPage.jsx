import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

export default function MaintenanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showReopen, setShowReopen] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [closeForm, setCloseForm] = useState({ cost: '', notes: '' });
  const [error, setError] = useState(null);

  const fetchLog = () => {
    api.get(`/maintenance/${id}`).then(({ data }) => {
      setLog(data.data.maintenance);
      setCloseForm({ cost: data.data.maintenance.cost || '', notes: data.data.maintenance.notes || '' });
    }).catch((err) => setError(err.response?.data?.message)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchLog(); }, [id]);

  const handleClose = async () => {
    setActionLoading(true); setError(null);
    try {
      await api.patch(`/maintenance/${id}/close`, {
        cost: closeForm.cost ? Number(closeForm.cost) : undefined,
        notes: closeForm.notes || undefined,
      });
      setShowClose(false); fetchLog();
    } catch (err) { setError(err.response?.data?.message || 'Close failed'); }
    finally { setActionLoading(false); }
  };

  const handleReopen = async () => {
    setActionLoading(true); setError(null);
    try { await api.patch(`/maintenance/${id}/reopen`); setShowReopen(false); fetchLog(); }
    catch (err) { setError(err.response?.data?.message || 'Reopen failed'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try { await api.delete(`/maintenance/${id}`); navigate('/maintenance'); }
    catch (err) { setError(err.response?.data?.message || 'Delete failed'); setActionLoading(false); setShowDelete(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!log) return <p className="text-muted text-center py-10">{error || 'Maintenance log not found.'}</p>;

  const isActive = log.status === 'Active';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/maintenance')} className="text-sm text-muted hover:text-primary flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>Back to Maintenance
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary">{log.vehicle?.registrationNumber} — {log.type}</h1>
            <Badge label={log.status} />
          </div>
        </div>
        <div className="flex gap-3">
          {isActive && <Button variant="outline" onClick={() => setShowClose(true)}><span className="material-symbols-outlined text-lg">check</span>Close Job</Button>}
          {!isActive && <Button variant="outline" onClick={() => setShowReopen(true)}><span className="material-symbols-outlined text-lg">replay</span>Reopen</Button>}
          {!isActive && <Button variant="danger" onClick={() => setShowDelete(true)}>Delete</Button>}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-error text-sm flex items-start gap-2">
          <span className="material-symbols-outlined text-sm">warning</span>{error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
        </div>
      )}

      {isActive && (
        <div className="p-4 rounded-lg bg-amber-50 border-l-4 border-amber-500 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 mt-0.5">info</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Vehicle is In Shop</p>
            <p className="text-xs text-amber-700 mt-0.5">This vehicle is blocked from dispatch until maintenance is closed.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Vehicle</h3>
          <Field label="Vehicle" value={log.vehicle ? `${log.vehicle.registrationNumber} — ${log.vehicle.name}` : '—'} />
          <Field label="Type" value={log.vehicle?.type} />
          <Field label="Status" value={<Badge label={log.vehicle?.status} />} />
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Job Details</h3>
          <Field label="Service Type" value={log.type} />
          <Field label="Description" value={log.description} />
          <Field label="Status" value={<Badge label={log.status} />} />
          <Field label="Notes" value={log.notes || '—'} />
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Cost & Dates</h3>
          <Field label="Cost" value={`₹${log.cost?.toLocaleString() || '0'}`} />
          <Field label="Start Date" value={log.startDate ? new Date(log.startDate).toLocaleDateString() : '—'} />
          <Field label="End Date" value={log.endDate ? new Date(log.endDate).toLocaleDateString() : isActive ? 'Ongoing' : '—'} />
          <Field label="Created" value={new Date(log.createdAt).toLocaleDateString()} />
        </div>
      </div>

      <Modal open={showClose} title="Close Maintenance Job" message="Optionally update the final cost and notes." confirmLabel="Close Job" variant="primary" loading={actionLoading} onConfirm={handleClose} onCancel={() => setShowClose(false)}>
        <div className="space-y-4 mb-4">
          <Input label="Final Cost (₹)" name="cost" type="number" value={closeForm.cost} onChange={(e) => setCloseForm((p) => ({ ...p, cost: e.target.value }))} placeholder="e.g. 2500" />
          <Input label="Final Notes" name="notes" value={closeForm.notes} onChange={(e) => setCloseForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Work completed notes..." />
        </div>
      </Modal>

      <Modal open={showReopen} title="Reopen Maintenance" message="This will set the job back to Active and move the vehicle back to In Shop." confirmLabel="Reopen" variant="primary" loading={actionLoading} onConfirm={handleReopen} onCancel={() => setShowReopen(false)} />
      <Modal open={showDelete} title="Delete Maintenance Log" message="Permanently delete this maintenance record?" confirmLabel="Delete" variant="danger" loading={actionLoading} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
    </div>
  );
}

function Field({ label, value }) {
  return <div><div className="text-xs text-muted">{label}</div><div className="text-sm text-on-surface font-medium mt-0.5">{value ?? '—'}</div></div>;
}
