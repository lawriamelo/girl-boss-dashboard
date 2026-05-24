import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1px solid rgba(201,169,110,.18)', borderRadius: '3px',
    background: 'rgba(255,255,255,.05)', fontSize: '12px',
    color: 'var(--cream)', outline: 'none', fontFamily: 'var(--mono)',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--mocha)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '380px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '42px', fontWeight: 900, color: 'var(--cream)', lineHeight: 1, marginBottom: '4px' }}>
          Girl <em style={{ color: 'var(--gold)' }}>Boss</em>
        </div>
        <div style={{ fontSize: '9px', letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--gold)', opacity: .6, marginBottom: '32px' }}>
          Conexão Milu · 5ª Edição
        </div>

        <form onSubmit={handleLogin} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(201,169,110,.15)', borderRadius: '6px', padding: '32px' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '18px', color: 'var(--cream)', marginBottom: '6px' }}>Acesso Restrito</div>
          <div style={{ fontSize: '10px', color: 'var(--dusty)', letterSpacing: '.1em', marginBottom: '24px' }}>Entre com suas credenciais</div>

          <div style={{ marginBottom: '14px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '8.5px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(201,169,110,.5)', marginBottom: '6px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required style={inputStyle} />
          </div>

          <div style={{ marginBottom: '6px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '8.5px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(201,169,110,.5)', marginBottom: '6px' }}>Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '16px' }}>
            <a href="/forgot-password" style={{ fontSize: '10px', color: 'rgba(201,169,110,.45)', textDecoration: 'none', letterSpacing: '.05em' }}>Esqueci minha senha</a>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? 'rgba(201,169,110,.5)' : 'var(--gold)', border: 'none', borderRadius: '3px', fontSize: '10px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--mocha)', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--mono)' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {error && <div style={{ fontSize: '10px', color: '#c47070', marginTop: '10px' }}>{error}</div>}

          <div style={{ fontSize: '9px', color: 'rgba(176,144,128,.4)', marginTop: '20px' }}>
            Acesso exclusivo para membras e admin
          </div>
        </form>
      </div>
    </div>
  )
}