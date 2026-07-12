import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

export default function ExpenseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { api.get(`/expenses/${id}`).then(({ data }) => setExpense(data.data.expense)).finally(() => setLoading(false)); }, [id]);

  const handleDelete = async () => { setDeleting(true); try { await api.delete(`/expenses/${id}`); navigate('/expenses'); } finally { setDeleting(false); } };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!expense) return <p className="text-muted text-center py-10">Expense not found.</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/expenses')} className="text-sm text-muted hover:text-primary flex items-center gap-1 mb-1"><span className="material-symbols-outlined text-sm">arrow_back</span>Back to Expenses</button>
          <h1 className="text-2xl font-bold text-primary">{expense.type} — ₹{expense.amount?.toLocaleString()}</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(`/expenses/${id}/edit`)}>Edit</Button>
          <Button variant="danger" onClick={() => setShowDelete(true)}>Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Vehicle & Trip</h3>
          <Field label="Vehicle" value={expense.vehicle ? `${expense.vehicle.registrationNumber} — ${expense.vehicle.name}` : '—'} />
          <Field label="Trip" value={expense.trip ? `${expense.trip.source} → ${expense.trip.destination}` : '—'} />
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Expense Details</h3>
          <Field label="Type" value={<Badge label={expense.type} />} />
          <Field label="Amount" value={`₹${expense.amount?.toLocaleString()}`} />
          <Field label="Date" value={expense.date ? new Date(expense.date).toLocaleDateString() : '—'} />
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Info</h3>
          <Field label="Description" value={expense.description || '—'} />
          <Field label="Created" value={new Date(expense.createdAt).toLocaleDateString()} />
        </div>
      </div>

      <Modal open={showDelete} title="Delete Expense" message="Permanently delete this expense?" confirmLabel="Delete" variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
    </div>
  );
}

function Field({ label, value }) { return <div><div className="text-xs text-muted">{label}</div><div className="text-sm text-on-surface font-medium mt-0.5">{value ?? '—'}</div></div>; }
