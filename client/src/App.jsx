import React, { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Setup from './pages/Setup';
import Lobby from './pages/Lobby';
import Meeting from './pages/Meeting';
import Report from './pages/Report';
import { useInterview } from './context/InterviewContext';
import { checkHealth } from './services/api';

function RequireSetup({ children }) {
  const { hasValidSetup } = useInterview();
  if (!hasValidSetup) {
    return <Navigate to="/setup" replace />;
  }
  return children;
}

export default function App() {
  // Wake the Render server silently on app load
  useEffect(() => {
    checkHealth().catch(() => {});
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/setup" element={<Setup />} />
      <Route
        path="/lobby"
        element={
          <RequireSetup>
            <Lobby />
          </RequireSetup>
        }
      />
      <Route
        path="/meeting"
        element={
          <RequireSetup>
            <Meeting />
          </RequireSetup>
        }
      />
      <Route path="/report/:id" element={<Report />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
