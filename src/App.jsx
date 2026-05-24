import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Kanban from './pages/Kanban'
import CRM from './pages/CRM'
import Conteudo from './pages/Conteudo'
import Protocolo from './pages/Protocolo'
import Gratidao from './pages/Gratidao'
import Manifestacao from './pages/Manifestacao'
import Instagram from './pages/Instagram'
import Membros from './pages/Membros'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--mocha)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '24px', color: 'var(--gold)', opacity: .5 }}>
        Girl <em>Boss</em>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function DashboardWrapper() {
  const [activePage, setActivePage] = useState('dashboard')
  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      <div style={{ paddingBottom: '40px' }}>
        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'kanban' && <Kanban />}
        {activePage === 'crm' && <CRM />}
        {activePage === 'conteudo' && <Conteudo />}
        {activePage === 'protocolo' && <Protocolo />}
        {activePage === 'gratidao' && <Gratidao />}
        {activePage === 'manifestacao' && <Manifestacao />}
        {activePage === 'instagram' && <Instagram />}
        {activePage === 'membros' && <Membros />}
      </div>
    </Layout>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <DashboardWrapper />
        </PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  )
}