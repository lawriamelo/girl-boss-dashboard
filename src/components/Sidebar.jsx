import { useAuth } from '../lib/AuthContext'
import { useState } from 'react'

const NAV = [
  { section: 'Principal' },
  { id: 'dashboard', icon: '⬡', label: 'Dashboard' },
  { id: 'kanban', icon: '📋', label: 'Kanban' },
  { id: 'crm', icon: '⭐', label: 'CRM de Vendas' },
  { id: 'conteudo', icon: '✍️', label: 'Conteúdo' },
  { section: 'Protocolo' },
  { id: 'protocolo', icon: '🌀', label: 'Protocolo' },
  { id: 'gratidao', icon: '✦', label: 'Gratidão' },
  { id: 'manifestacao', icon: '🌙', label: 'Manifestação' },
  { section: 'Visibilidade' },
  { id: 'instagram', icon: '📊', label: 'Instagram' },
  { section: 'Comunidade' },
  { id: 'membros', icon: '👥', label: 'Membros' },
]

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

export default function Sidebar({ activePage, onNavigate, collapsed, onCollapse, mobileOpen }) {  const { profile, signOut } = useAuth()
  const now = new Date()

  const sidebarStyle = {
    width: collapsed ? '64px' : '240px',
    minHeight: '100vh',
    background: 'var(--mocha)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    position: 'fixed',
    top: 0, left: 0, bottom: 0,
    zIndex: 50,
    overflow: 'hidden',
    transition: 'width .3s ease',
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(44,31,20,.4)', zIndex: 40
        }} />
      )}

      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(!mobileOpen)} style={{
        display: 'none',
        position: 'fixed', top: '14px', left: '14px', zIndex: 100,
        width: '40px', height: '40px',
        background: 'var(--mocha)', border: 'none', borderRadius: '3px',
        color: 'var(--gold)', fontSize: '18px',
        alignItems: 'center', justifyContent: 'center',
      }} className="mobile-toggle">☰</button>

      <aside style={{
            width: collapsed ? '64px' : '240px',
            minHeight: '100vh',
            background: 'var(--mocha)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            position: 'fixed',
            top: 0, left: 0, bottom: 0,
            zIndex: 50,
            overflow: 'hidden',
            transition: 'width .3s ease, transform .3s ease',
        }} className={mobileOpen ? 'sidebar mobile-open' : 'sidebar'}>

        {/* Toggle button */}
        <button onClick={() => onCollapse(!collapsed)} style={{
          position: 'absolute', top: '24px', right: '-12px',
          width: '24px', height: '24px',
          background: 'var(--bronze)', border: 'none', borderRadius: '50%',
          color: 'var(--cream)', fontSize: '11px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 60, boxShadow: '0 2px 8px rgba(44,31,20,.3)',
          cursor: 'pointer',
        }}>
          {collapsed ? '›' : '‹'}
        </button>

        {/* Brand */}
        <div style={{ padding: collapsed ? '20px 16px 18px' : '26px 22px 20px', borderBottom: '1px solid rgba(201,169,110,.1)', flexShrink: 0 }}>
          {!collapsed && <>
            <div style={{ fontSize: '8px', letterSpacing: '.3em', color: 'var(--gold)', textTransform: 'uppercase', opacity: .55, marginBottom: '5px' }}>Conexão Milu</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 900, color: 'var(--cream)', lineHeight: 1 }}>
              Girl <em style={{ color: 'var(--gold)' }}>Boss</em>
            </div>
            <div style={{ fontSize: '8px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--dusty)', marginTop: '5px', opacity: .65 }}>Protocolo · 5ª Edição</div>
          </>}
        </div>

        {/* Date */}
        <div style={{ padding: collapsed ? '12px 16px' : '13px 22px 11px', borderBottom: '1px solid rgba(201,169,110,.08)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '36px', fontWeight: 900, color: 'var(--gold)', opacity: .36, lineHeight: 1 }}>{now.getDate()}</div>
          {!collapsed && <div style={{ fontSize: '8px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--dusty)', marginTop: '2px', opacity: .65 }}>
            {DAYS[now.getDay()]} · {MONTHS[now.getMonth()]} {now.getFullYear()}
          </div>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 0', scrollbarWidth: 'none' }}>
          {NAV.map((item, i) => {
            if (item.section) return !collapsed ? (
              <div key={i} style={{ fontSize: '7.5px', letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(201,169,110,.28)', padding: '10px 22px 5px' }}>
                {item.section}
              </div>
            ) : <div key={i} style={{ height: '6px' }} />

            const isActive = activePage === item.id
            return (
              <div key={item.id} onClick={() => { onNavigate(item.id); setMobileOpen(false) }} style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : '12px',
                padding: collapsed ? '9px 20px' : '9px 22px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                cursor: 'pointer',
                borderLeft: `2px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
                background: isActive ? 'rgba(201,169,110,.12)' : 'transparent',
                transition: 'all .2s',
              }}>
                <span style={{ fontSize: '14px', flexShrink: 0, width: '20px', textAlign: 'center' }}>{item.icon}</span>
                {!collapsed && <span style={{ fontSize: '10px', letterSpacing: '.06em', color: isActive ? 'var(--gold)' : 'rgba(232,196,160,.6)' }}>{item.label}</span>}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: collapsed ? '14px 16px' : '14px 22px', borderTop: '1px solid rgba(201,169,110,.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {profile?.role === 'admin' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: collapsed ? '8px' : '8px 14px',
              background: 'rgba(201,169,110,.1)', border: '1px solid rgba(201,169,110,.2)',
              borderRadius: '3px', justifyContent: collapsed ? 'center' : 'flex-start'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--sage)', flexShrink: 0, animation: 'pulse 2s infinite' }} />
              {!collapsed && <span style={{ fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>Admin</span>}
            </div>
          )}
          <button onClick={signOut} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: collapsed ? '7px' : '7px 14px',
            background: 'transparent', border: '1px solid rgba(201,169,110,.1)',
            borderRadius: '3px', color: 'rgba(176,144,128,.45)',
            fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase',
            justifyContent: collapsed ? 'center' : 'flex-start',
            cursor: 'pointer', width: '100%',
          }}>
            ↩ {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>
    </>
  )
}