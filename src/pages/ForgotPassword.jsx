import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--mocha)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '380px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '42px', fontWeight: 900, color: 'var(--cream)', lineHeight: 1, marginBottom: '4px' }}>
          Girl <em style={{ color: 'var(--gold)' }}>Boss</em>
        </div>
        <div style={{ fontSize: '9px', letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--gold)', opacity: .6, marginBottom: '32px' }}>Conexão Milu · 5ª Edição</div>

        {sent ? (
          <div style={{ background: 'rgba(201,169,110,.08)', border: '1px solid rgba(201,169,110,.2)', borderRadius: '6px', padding: '32px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📬</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '18px', color: 'var(--cream)', marginBottom: '8px' }}>Email enviado!</div>
            <div style={{ fontSize: '11px', color: 'var(--dusty)', lineHeight: 1.6 }}>Verifique sua caixa de entrada e clique no link para criar uma nova senha.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(201,169,110,.15)', borderRadius: '6px', padding: '32px' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '18px', color: 'var(--cream)', marginBottom: '6px' }}>Recuperar senha</div>
            <div style={{ fontSize: '10px', color: 'var(--dusty)', letterSpacing: '.1em', marginBottom: '24px' }}>Digite seu email para receber o link de recuperação</div>

            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '8.5px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(201,169,110,.5)', marginBottom: '6px' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
                style={{ width: '100%', padding: '11px 14px', border: '1px solid rgba(201,169,110,.18)', borderRadius: '3px', background: 'rgba(255,255,255,.05)', fontSize: '12px', color: 'var(--cream)', outline: 'none', fontFamily: 'var(--mono)' }} />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', padding: '12px', background: loading ? 'rgba(201,169,110,.5)' : 'var(--gold)', border: 'none', borderRadius: '3px', fontSize: '10px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--mocha)', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--mono)' }}>
              {loading ? 'Enviando...' : 'Enviar Link'}
            </button>

            {error && <div style={{ fontSize: '10px', color: '#c47070', marginTop: '10px' }}>{error}</div>}

            <div style={{ marginTop: '20px' }}>
              <a href="/login" style={{ fontSize: '10px', color: 'rgba(201,169,110,.5)', textDecoration: 'none', letterSpacing: '.05em' }}>← Voltar para o login</a>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}