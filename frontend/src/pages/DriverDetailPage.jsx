import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';

const STATUS_OPTS = ['Available', 'Off Duty', 'Suspended'].map((v) => ({ value: v, label: v }));

export default function DriverDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const fetchDriver = () => {
    api.get(`/drivers/${id}`).then(({ data }) => {
      setDriver(data.data.driver);
      setNewStatus(data.data.driver.status);
    }).catch((err) => setError(err.response?.data?.message || 'Failed to load driver'))
    .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDriver(); }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === driver.status) return;
    setStatusLoading(true); setError(null);
    try { await api.patch(`/drivers/${id}/status`, { status: newStatus }); fetchDriver(); }
    catch (err) { setError(err.response?.data?.message || 'Status update failed'); }
    finally { setStatusLoading(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await api.delete(`/drivers/${id}`); navigate('/drivers'); }
    catch (err) { setError(err.response?.data?.message || 'Delete failed'); setDeleting(false); setShowDelete(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!driver) return <p className="text-muted text-center py-10">{error || 'Driver not found.'}</p>;

  const isExpired = driver.licenseExpiryDate && new Date(driver.licenseExpiryDate) < new Date();
  const initials = driver.name?.split(' ').map((n) => n[0]).join('').toUpperCase();
  const scoreColor = driver.safetyScore >= 80 ? 'text-green-600' : driver.safetyScore >= 60 ? 'text-yellow-600' : 'text-red-600';
  const barColor = driver.safetyScore >= 80 ? 'bg-green-500' : driver.safetyScore >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/drivers')} className="text-sm text-muted hover:text-primary flex items-center gap-1 mb-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span>Back to Drivers
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">{initials}</div>
            <div>
              <h1 className="text-2xl font-bold text-primary">{driver.name}</h1>
              <p className="text-sm text-muted">{driver.licenseNumber}</p>
            </div>
            <Badge label={driver.status} />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(`/drivers/${id}/edit`)}>Edit</Button>
          <Button variant="danger" onClick={() => setShowDelete(true)}>Delete</Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-error text-sm flex items-start gap-2">
          <span className="material-symbols-outlined text-sm">warning</span>{error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
        </div>
      )}

      {isExpired && (
        <div className="p-4 rounded-lg bg-red-50 border-l-4 border-red-500 flex items-start gap-3">
          <span className="material-symbols-outlined text-error mt-0.5">warning</span>
          <div>
            <p className="text-sm font-semibold text-red-800">License Expired on {new Date(driver.licenseExpiryDate).toLocaleDateString()}</p>
            <p className="text-xs text-red-700 mt-0.5">This driver cannot be assigned to any trip until license is renewed.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Personal Info</h3>
          <Field label="Full Name" value={driver.name} />
          <Field label="Contact" value={driver.contactNumber} />
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">License Info</h3>
          <Field label="License Number" value={driver.licenseNumber} />
          <Field label="Category" value={driver.licenseCategory} />
          <Field label="Expiry Date" value={
            <span className={isExpired ? 'text-error font-semibold' : ''}>
              {driver.licenseExpiryDate ? new Date(driver.licenseExpiryDate).toLocaleDateString() : '—'}
              {isExpired ? <span className="ml-2 text-xs bg-error text-white px-1 py-0.5 rounded font-bold">EXPIRED</span> : <span className="ml-2 text-xs text-green-600 font-medium">✓ Valid</span>}
            </span>
          } />
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Safety</h3>
          <div className={`text-3xl font-bold ${scoreColor}`}>{driver.safetyScore}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${driver.safetyScore}%` }} />
          </div>
          <Field label="Status" value={<Badge label={driver.status} />} />
          <Field label="Registered" value={new Date(driver.createdAt).toLocaleDateString()} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
        <h3 className="text-lg font-semibold text-primary">Change Status</h3>
        {driver.status === 'On Trip' ? (
          <p className="text-sm text-muted flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">info</span>
            Cannot change status while driver is on a trip. Complete or cancel the trip first.
          </p>
        ) : (
          <div className="flex items-end gap-4">
            <Select name="status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} options={STATUS_OPTS} className="w-48" />
            <Button onClick={handleStatusUpdate} loading={statusLoading} disabled={newStatus === driver.status}>Update Status</Button>
          </div>
        )}
      </div>

      <Modal open={showDelete} title="Delete Driver" message={`Are you sure you want to delete ${driver.name} (${driver.licenseNumber})?`} confirmLabel="Delete" variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
    </div>
  );
}

function Field({ label, value }) {
  return <div><div className="text-xs text-muted">{label}</div><div className="text-sm text-on-surface font-medium mt-0.5">{value ?? '—'}</div></div>;
}
