import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RequestForm from './pages/RequestForm';
import RequestDetails from './pages/RequestDetails';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } 
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/requests/new" 
          element={
            <ProtectedRoute>
              <RequestForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/requests/:id" 
          element={
            <ProtectedRoute>
              <RequestDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/requests/:id/edit" 
          element={
            <ProtectedRoute>
              <RequestForm />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
