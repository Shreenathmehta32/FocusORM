import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const location = useLocation()

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        position: 'relative',
      }}
    >
      {/* Background ambient blobs */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '15%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '5%',
          left: '20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 65%)',
        }} />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <main
          style={{
            flex: 1,
            padding: '32px',
            maxWidth: '1440px',
            width: '100%',
            margin: '0 auto',
          }}
          key={location.pathname}
          className="page-enter"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
