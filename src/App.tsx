import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import MobileBottomNav from './components/ui/MobileBottomNav';

// Import pages (your original structure)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Journal from './pages/journal/Journal';
import NewTrade from './pages/journal/NewTrade';
import EditTrade from './pages/journal/EditTrade';
import TradeDetail from './pages/journal/TradeDetail';
import Analysis from './pages/analysis/Analysis';
import Settings from './pages/settings/Settings';
import ReflectionPage from './pages/reflection/ReflectionPage';

// Protected route component
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { state } = useAuth();
  
  if (state.isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Loading...</p>
    </div>;
  }
  
  return state.isAuthenticated ? <Layout>{element}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Main Content with mobile padding only */}
          <div className="pb-20 lg:pb-0">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
              <Route path="/journal" element={<ProtectedRoute element={<Journal />} />} />
              <Route path="/journal/new" element={<ProtectedRoute element={<NewTrade />} />} />
              <Route path="/journal/:id/edit" element={<ProtectedRoute element={<EditTrade />} />} />
              <Route path="/journal/:id" element={<ProtectedRoute element={<TradeDetail />} />} />
              <Route path="/analysis" element={<ProtectedRoute element={<Analysis />} />} />
              <Route path="/reflection" element={<ProtectedRoute element={<ReflectionPage />} />} />
              <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
          
          {/* Mobile Bottom Navigation - Only on mobile */}
          <MobileBottomNav />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
