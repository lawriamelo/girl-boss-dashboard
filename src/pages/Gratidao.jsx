import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const AFFIRMATIONS = [
  '"Eu mereço receber abundância com leveza."',
  '"Meu trabalho tem valor e impacto real."',
  '"O dinheiro flui para mim de formas inesperadas."',
  '"Eu estou no lugar certo, na hora certa."',
  '"Eu sou o ímã da minha própria prosperidade."',
  '"O universo conspira a meu favor todos os dias."',
]

export default function Gratidao() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [g1, setG1] = useState('')
  const [g2, setG2] = useState('')
  const [g3, setG3] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data } = await supabase.from('gratidao').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  async function add() {
    const items = [g1, g2, g3].map(v => v.trim()).filter(Boolean)
    if (!items.length) return
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    const { data } = await supabase.from('gratidao').insert({ user_id: user.id, date: today, items }).select().single()
    if (data) setEntries(prev => [data, ...prev])
    setG1(''); setG2(''); setG3('')
  }

  async function remove(id) {
    await supabase.from('gratidao').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Carregando...</div>

  return (
    <div>
      <div className="page-hdr">
        <div><div className="eyebrow">Quadro de</div><div className="page-title">Gratidão</div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#fff', border: '1px solid var(--border)', borderRadius: '3px', boxShadow: 'var(--shadow)' }}>
          <span style={{ fontSize: '16px' }}>🔥</span>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700, color: 'var(--bronze)', lineHeight: 1 }}>{Math.min(entries.length, 30)}</div>
            <div style={{ fontSize: '8px', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>dias seguidos</div>
          </div>
        </div>
      </div>

      <div className="grat-layout">
        <div>
          <div style={{ background: 'linear-gradient(135deg,var(--mocha),#3A2518)', borderRadius: '4px', border: '1px solid rgba(201,169,110,.1)', marginBottom: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '13px 17px 11px', borderBottom: '1px solid rgba(201,169,110,.12)' }}>
              <span style={{ fontSize: '9px', letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(201,169,110,.65)' }}>✦ Gratidões de Hoje</span>
            </div>
            <div style={{ padding: '17px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[{val:g1,set:setG1,ph:'Sou grata por...'},{val:g2,set:setG2,ph:'Me sinto abençoada com...'},{val:g3,set:setG3,ph:'Hoje escolho celebrar...'}].map((f,i) => (
                <input key={i} value={f.val} onChange={e => f.set(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} placeholder={f.ph}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid rgba(201,169,110,.2)', borderRadius: '3px', background: 'rgba(255,255,255,.06)', fontFamily: 'var(--prose)', fontSize: '14px', color: 'var(--cream)', outline: 'none' }} />
              ))}
              <button onClick={add} style={{ alignSelf: 'flex-end', padding: '9px 20px', background: 'rgba(201,169,110,.14)', border: '1px solid rgba(201,169,110,.25)', borderRadius: '3px', color: 'var(--gold)', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer' }}>✦ Registrar</button>
            </div>
          </div>
          {entries.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', fontStyle: 'italic' }}>Nenhuma gratidão registrada ainda. Comece hoje! ✦</div>
          ) : (
            <div className="grat-grid">
              {entries.map(e => (
                <div key={e.id} style={{ background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: '4px', padding: '16px', position: 'relative', transition: 'all .2s' }}
                  onMouseEnter={el => { el.currentTarget.style.borderColor = 'var(--gold)'; el.currentTarget.querySelector('.del').style.opacity = '1' }}
                  onMouseLeave={el => { el.currentTarget.style.borderColor = 'var(--border)'; el.currentTarget.querySelector('.del').style.opacity = '0' }}
                >
                  <div style={{ fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>{e.date}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {e.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'var(--prose)', fontSize: '14px', lineHeight: 1.5, color: 'var(--mocha)' }}>
                        <span style={{ color: 'var(--gold)', fontSize: '10px', marginTop: '3px', flexShrink: 0 }}>✦</span>{item}
                      </div>
                    ))}
                  </div>
                  <button className="del" onClick={() => remove(e.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'var(--dusty)', cursor: 'pointer', fontSize: '11px', opacity: 0, transition: 'opacity .2s' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ position: 'sticky', top: '20px' }}>
          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">✦ Afirmações</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {AFFIRMATIONS.map((a, i) => (
                <div key={i} style={{ padding: '10px', background: 'var(--warm)', borderRadius: '3px', borderLeft: '2px solid var(--gold)', fontFamily: 'var(--prose)', fontSize: '13px', fontStyle: 'italic', color: 'var(--mocha)', lineHeight: 1.6 }}>{a}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}