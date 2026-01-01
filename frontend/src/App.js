import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Availability from './components/Availability';
import TopLinesByFault from './components/TopLinesByFault';


// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Main pages
import Dashboard from './pages/Dashboard';
import TrippingData from './pages/TrippingData';
import LineDetails from './pages/LineDetails';
import TowerLocations from './pages/TowerLocations';

// Dashboard sub-pages
import LineAsset from './pages/dashboards/LineAsset';
import TrippingGraph from './pages/dashboards/TrippingGraph';
import AvailabilityGraph from './pages/dashboards/AvailabilityGraph';
import GISMapping from './pages/dashboards/GISMapping';
import FaultTypes from './pages/dashboards/FaultTypes';
import TLPerformance from './pages/dashboards/TLPerformance';
import TowerLocator from './pages/dashboards/TowerLocator';
import OfficeLines from './pages/dashboards/OfficeLines';
import AIPredictiveMaintenance from './components/AIPredictiveMaintenance';
import AIChatbot from './components/AIChatbot';





function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} 
      />

      {/* Protected Main Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tripping-data"
        element={
          <ProtectedRoute>
            <Layout>
              <TrippingData />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/availability"
        element={
          <ProtectedRoute>
            <Layout>
              <Availability />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/top-lines/:faultType" element={
          <ProtectedRoute>
              <TopLinesByFault />
          </ProtectedRoute>
       } />
      <Route
        path="/line-details"
        element={
          <ProtectedRoute>
            <Layout>
              <LineDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tower-locations"
        element={
          <ProtectedRoute>
            <Layout>
              <TowerLocations />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Protected Dashboard Sub-Routes */}
      <Route
        path="/dashboard/line-asset"
        element={
          <ProtectedRoute>
            <Layout>
              <LineAsset />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/tripping-graph"
        element={
          <ProtectedRoute>
            <Layout>
              <TrippingGraph />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/availability-graph"
        element={
          <ProtectedRoute>
            <Layout>
              <AvailabilityGraph />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/gis-mapping"
        element={
          <ProtectedRoute>
            <Layout>
              <GISMapping />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/fault-types"
        element={
          <ProtectedRoute>
            <Layout>
              <FaultTypes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/tl-performance"
        element={
          <ProtectedRoute>
            <Layout>
              <TLPerformance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/tower-locator"
        element={
          <ProtectedRoute>
            <Layout>
              <TowerLocator />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/ai-maintenance" element={
  <ProtectedRoute>
    <Layout>
      <AIPredictiveMaintenance />
    </Layout>
  </ProtectedRoute>
} />
      <Route path="/ai-chatbot" element={
  <ProtectedRoute>
    <Layout>
      <AIChatbot />
    </Layout>
  </ProtectedRoute>
} />
      <Route
        path="/dashboard/office-lines"
        element={
          <ProtectedRoute>
            <Layout>
              <OfficeLines />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
