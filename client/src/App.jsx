import { Navigate, Route, Routes } from 'react-router-dom';

import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import DocumentReview from './pages/DocumentReview';
import Documents from './pages/Documents';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';

export default function App() {
  return <Routes>
    <Route element={<Login />} path="/login" />
    <Route element={<Register />} path="/register" />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppShell />}>
        <Route element={<Dashboard />} path="/dashboard" />
        <Route element={<Upload />} path="/upload" />
        <Route element={<Documents />} path="/documents" />
        <Route element={<DocumentReview />} path="/documents/:id" />
      </Route>
    </Route>
    <Route element={<Navigate replace to="/dashboard" />} path="*" />
  </Routes>;
}
