
import React from 'react';
import { HashRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AddSubject from './pages/AddSubject';
import SubjectDetail from './pages/SubjectDetail';
import ScanAttendance from './pages/ScanAttendance';
import Layout from './components/Layout';
import Login from './pages/Login';
import MultiGradeScanner from './pages/MultiGradeScanner';
import RollCall from './pages/RollCall';

const ProtectedLayout = () => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Layout>
            <Outlet />
        </Layout>
    );
};


function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-subject" element={<AddSubject />} />
          <Route path="/subject/:subjectId" element={<SubjectDetail />} />
          <Route path="/subject/:subjectId/rollcall" element={<RollCall />} />
          <Route path="/scan/:sessionId" element={<ScanAttendance />} />
          <Route path="/subject/:subjectId/multi-grade" element={<MultiGradeScanner />} />
          {/* Redirige cualquier otra ruta al panel de control cuando se ha iniciado sesión */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
