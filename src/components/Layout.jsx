import { useState } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children, activePage, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onCollapse={setCollapsed}
      />
      <div style={{
        marginLeft: collapsed ? '64px' : '240px',
        flex: 1,
        minHeight: '100vh',
        transition: 'margin-left .3s ease',
      }}>
        <div style={{ padding: '32px 40px', maxWidth: '1200px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}