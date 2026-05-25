import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const AFFIRMATIONS = [
  'Eu estou em harmonia com o fluxo da abundância.',
  'O que é meu por direito divino sempre chega até mim.',
  'Eu recebo com gratidão e libero com leveza.',
  'Minha energia atrai oportunidades alinhadas com minha essência.',
  'Eu confio no timing perfeito da minha jornada.',
  'Sou digna de receber tudo o que desejo.',
  'Eu sou o ímã da minha própria prosperidade.',
  'O universo conspira a meu favor todos os dias.',
]

export default function Manifestacao() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const saveTimer = useRef(null)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data } = await supabase.from('manifest_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setEntries(data || [])
    if (data && data.length > 0) { setActiveId(data[0].id); setText(data[0].content || '') }
    setLoading(false)
  }

  async function newEntry() {
    const date = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    const { data } = await supabase.from('manifest_entries').insert({ user_id: user.id, date, content: '' }).select().single()
    if (data) { setEntries(prev => [data, ...prev]); setActiveId(data.id); setText('') }
  }

  async function deleteEntry() {
    if (!activeId || !window.confirm('Excluir esta entrada?')) return
    await supabase.from('manifest_entries').delete().eq('id', activeId)
    const remaining = entries.filter(e => e.id !== activeId)
    setEntries(remaining)
    if (remaining.length > 0) { setActiveId(remaining[0].id); setText(remaining[0].content || '') }
    else { setActiveId(null); setText('') }
  }

  function onType(val) {
    setText(val)
    setEntries(prev => prev.map(e => e.id === activeId ? { ...e, content: val } : e))
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving(true)
    saveTimer.current = setTimeout(async () => {
      await supabase.from('manifest_entries').update({ content: val }).eq('id', activeId)
      setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
    }, 800)
  }

  function insertAffirm(a) {
    if (!activeId) { newEntry().then(() => setTimeout(() => onType('\n' + a), 100)); return }
    onType(text ? text + '\n' + a : a)
  }

  const wc = text.trim() ? text.trim().split(/\s+/).length : 0
  const active = entries.find(e => e.id === activeId)

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Carregando...</div>

  return (
    <div>
      <div className="page-hdr">
        <div><div className="eyebrow">Caderno de</div><div className="page-title">Manifestação</div></div>
        <button onClick={newEntry} className="btn-primary">+ Nova Entrada</button>
      </div>

      <div className="manifest-layout">
        <div>
          <div style={{ fontSize: '8.5px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>Entradas</div>
          {entries.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', padding: '12px 0' }}>Nenhuma entrada ainda.</div>
          ) : entries.map(e => (
            <div key={e.id} onClick={() => { setActiveId(e.id); setText(e.content || '') }} style={{ padding: '10px 14px', borderRadius: '3px', border: `1px solid ${activeId === e.id ? 'var(--gold)' : 'var(--border)'}`, background: activeId === e.id ? '#fff' : 'var(--warm)', boxShadow: activeId === e.id ? 'var(--shadow)' : 'none', cursor: 'pointer', marginBottom: '7px', transition: 'all .2s' }}>
              <div style={{ fontSize: '8px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '3px' }}>{e.date}</div>
              <div style={{ fontFamily: 'var(--prose)', fontSize: '12px', color: 'var(--mocha)', lineHeight: 1.4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{e.content || 'Entrada vazia...'}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '9px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>{active ? active.date : 'Selecione ou crie uma entrada'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '9px', color: saving ? 'var(--bronze)' : saved ? 'var(--sage)' : 'var(--muted)', letterSpacing: '.1em', fontStyle: 'italic' }}>
                  {saving ? 'salvando...' : saved ? '✓ salvo' : `${wc} palavras`}
                </div>
                {activeId && <button onClick={deleteEntry} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '3px', padding: '4px 10px', fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--dusty)', cursor: 'pointer' }}>excluir</button>}
              </div>
            </div>
            <textarea value={text} onChange={e => activeId && onType(e.target.value)} readOnly={!activeId}
              placeholder={activeId ? 'Escreva livremente sobre o que você está manifestando...' : 'Clique em "+ Nova Entrada" para começar.'}
              style={{ width: '100%', minHeight: '320px', padding: '24px', border: 'none', background: 'transparent', fontFamily: 'var(--prose)', fontSize: '16px', lineHeight: 2, color: 'var(--mocha)', resize: 'none', outline: 'none' }} />
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '9px', color: 'var(--muted)' }}>{wc} palavras</div>
              <div style={{ fontSize: '9px', color: 'var(--muted)', fontStyle: 'italic' }}>salvo automaticamente</div>
            </div>
          </div>

          <div className="card">
            <div className="card-hdr"><span className="card-hdr-title">🌙 Clique para inserir no caderno</span></div>
            <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {AFFIRMATIONS.map((a, i) => (
                <span key={i} onClick={() => insertAffirm(a)} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: '20px', fontFamily: 'var(--prose)', fontSize: '13px', color: 'var(--mocha)', cursor: 'pointer', transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--bronze)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--mocha)' }}
                >{a}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}