import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const TYPE_BADGES = {
  fuel: 'bg-green-100 text-green-800 border border-green-200',
  toll: 'bg-orange-100 text-orange-800 border border-orange-200',
  maintenance: 'bg-gray-100 text-gray-800 border border-gray-300',
  parking: 'bg-blue-100 text-blue-800 border border-blue-200',
  repair: 'bg-red-100 text-red-800 border border-red-200',
  miscellaneous: 'bg-purple-100 text-purple-800 border border-purple-200',
};

export default function ExpenseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/expenses/${id}`)
      .then(({ data }) => {
        setExpense(data.data.expense);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load expense'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/expenses/${id}`);
      navigate('/expenses');
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

  if (!expense)
    return <p className="text-muted text-center py-10">{error || 'Expense not found.'}</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/expenses')}
            className="text-sm text-muted hover:text-primary flex items-center gap-1 mb-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Expenses
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary">Expense Record</h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                TYPE_BADGES[expense.type] || 'bg-gray-100 text-gray-800 border border-gray-300'
              }`}
            >
              {expense.type}
            </span>
          </div>
          <p className="text-sm text-muted">
            {expense.date
              ? new Date(expense.date).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(`/expenses/${id}/edit`)}>
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
                expense.vehicle
                  ? `${expense.vehicle.registrationNumber} — ${expense.vehicle.name}`
                  : '—'
              }
            />
            <Field label="Type" value={expense.vehicle?.type || '—'} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Expense Details</h3>
          <div className="space-y-3">
            <Field label="Type" value={expense.type} />
            <Field label="Amount" value={`₹${(expense.amount || 0).toLocaleString()}`} />
            <Field
              label="Date"
              value={
                expense.date
                  ? new Date(expense.date).toLocaleDateString('en-US', {
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
            {expense.trip ? (
              <>
                <Field
                  label="Route"
                  value={`${expense.trip.source} → ${expense.trip.destination}`}
                />
                <Field label="Status" value={expense.trip.status || '—'} />
              </>
            ) : (
              <p className="text-sm text-muted">No trip linked</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
        <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Description</h3>
        <p className="text-sm text-on-surface">{expense.description || 'No description provided.'}</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
        <h3 className="text-sm uppercase tracking-wider text-muted font-medium">Timestamps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Created"
            value={
              expense.createdAt
                ? new Date(expense.createdAt).toLocaleString()
                : '—'
            }
          />
          <Field
            label="Last Updated"
            value={
              expense.updatedAt
                ? new Date(expense.updatedAt).toLocaleString()
                : '—'
            }
          />
        </div>
      </div>

      <Modal
        open={showDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
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
