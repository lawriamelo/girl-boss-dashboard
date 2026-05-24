import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase sets session automatically from URL hash on invite/reset links
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // user is ready to set new password
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true)
    setTimeout(() => navigate('/dashboard'), 2500)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--mocha)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '380px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '42px', fontWeight: 900, color: 'var(--cream)', lineHeight: 1, marginBottom: '4px' }}>
          Girl <em style={{ color: 'var(--gold)' }}>Boss</em>
        </div>
        <div style={{ fontSize: '9px', letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--gold)', opacity: .6, marginBottom: '32px' }}>Conexão Milu · 5ª Edição</div>

        {success ? (
          <div style={{ background: 'rgba(125,140,117,.15)', border: '1px solid rgba(125,140,117,.3)', borderRadius: '6px', padding: '32px', color: 'var(--cream)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✓</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '18px', marginBottom: '8px' }}>Senha criada com sucesso!</div>
            <div style={{ fontSize: '11px', color: 'var(--dusty)' }}>Redirecionando para o dashboard...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(201,169,110,.15)', borderRadius: '6px', padding: '32px' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '18px', color: 'var(--cream)', marginBottom: '6px' }}>Criar sua senha</div>
            <div style={{ fontSize: '10px', color: 'var(--dusty)', letterSpacing: '.1em', marginBottom: '24px' }}>Escolha uma senha para acessar o protocolo</div>

            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '8.5px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(201,169,110,.5)', marginBottom: '6px' }}>Nova Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required
                style={{ width: '100%', padding: '11px 14px', border: '1px solid rgba(201,169,110,.18)', borderRadius: '3px', background: 'rgba(255,255,255,.05)', fontSize: '12px', color: 'var(--cream)', outline: 'none', fontFamily: 'var(--mono)' }} />
            </div>

            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '8.5px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(201,169,110,.5)', marginBottom: '6px' }}>Confirmar Senha</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repita a senha" required
                style={{ width: '100%', padding: '11px 14px', border: '1px solid rgba(201,169,110,.18)', borderRadius: '3px', background: 'rgba(255,255,255,.05)', fontSize: '12px', color: 'var(--cream)', outline: 'none', fontFamily: 'var(--mono)' }} />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', padding: '12px', background: loading ? 'rgba(201,169,110,.5)' : 'var(--gold)', border: 'none', borderRadius: '3px', fontSize: '10px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--mocha)', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--mono)' }}>
              {loading ? 'Salvando...' : 'Criar Senha e Entrar'}
            </button>

            {error && <div style={{ fontSize: '10px', color: '#c47070', marginTop: '10px' }}>{error}</div>}
          </form>
        )}
      </div>
    </div>
  )
}