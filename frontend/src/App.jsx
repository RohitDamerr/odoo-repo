import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedLayout from './components/layout/ProtectedLayout';
import VehicleListPage from './pages/VehicleListPage';
import VehicleFormPage from './pages/VehicleFormPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import TripListPage from './pages/TripListPage';
import TripFormPage from './pages/TripFormPage';
import TripDetailPage from './pages/TripDetailPage';
import DriverListPage from './pages/DriverListPage';
import DriverFormPage from './pages/DriverFormPage';
import DriverDetailPage from './pages/DriverDetailPage';
import FuelListPage from './pages/FuelListPage';
import FuelFormPage from './pages/FuelFormPage';
import FuelDetailPage from './pages/FuelDetailPage';
import ExpenseListPage from './pages/ExpenseListPage';
import ExpenseFormPage from './pages/ExpenseFormPage';
import ExpenseDetailPage from './pages/ExpenseDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Placeholder title="Dashboard" />} />
        <Route path="/vehicles" element={<VehicleListPage />} />
        <Route path="/vehicles/new" element={<VehicleFormPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="/vehicles/:id/edit" element={<VehicleFormPage />} />
        <Route path="/drivers" element={<DriverListPage />} />
        <Route path="/drivers/new" element={<DriverFormPage />} />
        <Route path="/drivers/:id" element={<DriverDetailPage />} />
        <Route path="/drivers/:id/edit" element={<DriverFormPage />} />
        <Route path="/trips" element={<TripListPage />} />
        <Route path="/trips/new" element={<TripFormPage />} />
        <Route path="/trips/:id" element={<TripDetailPage />} />
        <Route path="/maintenance" element={<Placeholder title="Maintenance" />} />
        <Route path="/reports" element={<Placeholder title="Reports" />} />
        <Route path="/fuel" element={<FuelListPage />} />
        <Route path="/fuel/new" element={<FuelFormPage />} />
        <Route path="/fuel/:id" element={<FuelDetailPage />} />
        <Route path="/fuel/:id/edit" element={<FuelFormPage />} />
        <Route path="/expenses" element={<ExpenseListPage />} />
        <Route path="/expenses/new" element={<ExpenseFormPage />} />
        <Route path="/expenses/:id" element={<ExpenseDetailPage />} />
        <Route path="/expenses/:id/edit" element={<ExpenseFormPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

function Placeholder({ title }) {
  return (
    <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
      <div className="text-center">
        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">construction</span>
        <p className="text-muted text-sm">{title} — Coming in next phase</p>
      </div>
    </div>
  );
}
