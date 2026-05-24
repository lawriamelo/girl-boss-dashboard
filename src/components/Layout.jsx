import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children, activePage, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Fecha sidebar ao navegar no mobile
  useEffect(() => {
    setMobileOpen(false)
  }, [activePage])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(44,31,20,.45)',
          zIndex: 40, backdropFilter: 'blur(2px)'
        }} />
      )}

      {/* Mobile toggle button */}
      <button onClick={() => setMobileOpen(!mobileOpen)} style={{
        display: 'none',
        position: 'fixed', top: '14px', left: '14px',
        zIndex: 100, width: '40px', height: '40px',
        background: 'var(--mocha)', border: 'none',
        borderRadius: '3px', color: 'var(--gold)',
        fontSize: '18px', cursor: 'pointer',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(44,31,20,.3)',
      }} className="mobile-menu-btn">☰</button>

      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        mobileOpen={mobileOpen}
      />

      <div style={{
        marginLeft: collapsed ? '64px' : '240px',
        flex: 1, minHeight: '100vh',
        transition: 'margin-left .3s ease',
      }} className="main-wrap">
        <div style={{ padding: '32px 40px', maxWidth: '1200px' }} className="main-content">
          {children}
        </div>
      </div>
    </div>
  )
}