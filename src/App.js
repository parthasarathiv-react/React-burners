import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import LoginScreen from './components/login/LoginScreen';
import Dashboard from './components/dashboard/Dashboard';
import CDDesignStudio from './components/cd-studio/CDDesignStudio';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import './App.css';

function App() {
  const [theme, setTheme] = useState('dark');

  return (
    <div className="app-root min-h-screen w-full overflow-x-hidden bg-transparent font-baijam text-white">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<LoginScreen theme={theme} onThemeChange={setTheme} />}
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard theme={theme} onThemeChange={setTheme} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cd-studio"
              element={
                <ProtectedRoute>
                  <CDStudioWrapper />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <Toaster />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { loading } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center text-white font-baijam">
        Initializing...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function CDStudioWrapper() {
  const navigate = useNavigate();
  return <CDDesignStudio onBack={() => navigate('/dashboard')} />;
}

export default App;
