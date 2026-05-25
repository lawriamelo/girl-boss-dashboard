import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const STATUS = {
  'Ideia': { bg: 'rgba(176,144,128,.15)', color: '#B09080' },
  'Em Produção': { bg: 'rgba(201,169,110,.15)', color: '#8B6347' },
  'Publicado': { bg: 'rgba(125,140,117,.15)', color: '#7D8C75' },
}
const STATUS_COLORS = { 'Ideia': '#B09080', 'Em Produção': '#C9A96E', 'Publicado': '#7D8C75' }
const FORMATOS = ['Reels', 'Carrossel', 'Stories', 'Post Estático', 'Live']
const STATUS_LIST = ['Ideia', 'Em Produção', 'Publicado']
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DAYS_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const EMPTY = { title: '', type: '', status: 'Ideia', scheduled_date: '' }

export default function Conteudo() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [filter, setFilter] = useState('Todos')
  const [calView, setCalView] = useState('mes')
  const [calDate, setCalDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState('lista')
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data } = await supabase.from('content').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function add() {
    if (!form.title.trim()) return
    const { data } = await supabase.from('content').insert({ user_id: user.id, ...form }).select().single()
    if (data) setItems(prev => [data, ...prev])
    setForm(EMPTY)
  }

  async function updateStatus(item, newStatus) {
    const { data } = await supabase.from('content').update({ status: newStatus }).eq('id', item.id).select().single()
    if (data) setItems(prev => prev.map(i => i.id === item.id ? data : i))
  }

  async function updateDate(item, newDate) {
    const { data } = await supabase.from('content').update({ scheduled_date: newDate || null }).eq('id', item.id).select().single()
    if (data) setItems(prev => prev.map(i => i.id === item.id ? data : i))
  }

  async function remove(id) {
    await supabase.from('content').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const year = calDate.getFullYear()
  const month = calDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const today = new Date().toISOString().slice(0, 10)

  function formatDateKey(y, m, d) { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` }
  function getItemsForDate(dateStr) { return items.filter(i => i.scheduled_date === dateStr) }
  function getWeekDates() {
    const start = new Date(calDate)
    start.setDate(calDate.getDate() - calDate.getDay())
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  }

  const filtered = filter === 'Todos' ? items : items.filter(i => i.status === filter)
  const counts = { Todos: items.length, Ideia: items.filter(i => i.status === 'Ideia').length, 'Em Produção': items.filter(i => i.status === 'Em Produção').length, Publicado: items.filter(i => i.status === 'Publicado').length }

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Carregando...</div>

  return (
    <div>
      <div className="page-hdr">
        <div><div className="eyebrow">Planejamento</div><div className="page-title">Criação de Conteúdo</div></div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['lista','calendario'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '7px 16px', background: activeTab === t ? 'var(--mocha)' : 'transparent', color: activeTab === t ? 'var(--gold)' : 'var(--muted)', border: `1px solid ${activeTab === t ? 'var(--mocha)' : 'var(--border)'}`, borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
              {t === 'lista' ? '≡ Lista' : '📅 Calendário'}
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-hdr"><span className="card-hdr-title">+ Nova Ideia</span></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') add() }} placeholder="Título ou ideia..."
              style={{ flex: '1 1 200px', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '3px', background: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', outline: 'none' }} />
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              style={{ flex: '0 1 120px', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '3px', background: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', outline: 'none' }}>
              <option value="">Formato</option>
              {FORMATOS.map(f => <option key={f}>{f}</option>)}
            </select>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              style={{ flex: '0 1 130px', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '3px', background: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', outline: 'none' }}>
              {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
            </select>
            <input type="date" value={form.scheduled_date} onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))}
              style={{ flex: '0 1 140px', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '3px', background: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', outline: 'none' }} />
            <button onClick={add} className="btn-primary">+ Adicionar</button>
          </div>
        </div>
      </div>

      {/* LISTA */}
      {activeTab === 'lista' && (
        <>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {['Todos','Ideia','Em Produção','Publicado'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', border: `1px solid ${filter === f ? 'var(--mocha)' : 'var(--border)'}`, borderRadius: '3px', background: filter === f ? 'var(--mocha)' : 'transparent', color: filter === f ? 'var(--gold)' : 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                {f} <span style={{ opacity: .6 }}>({counts[f]})</span>
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', fontStyle: 'italic' }}>Nenhum conteúdo ainda.</div>
          ) : (
            <div className="cnt-grid">
              {filtered.map(item => (
                <div key={item.id} style={{ background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: '4px', padding: '14px', position: 'relative', transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.querySelector('.del').style.opacity = '1' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.querySelector('.del').style.opacity = '0' }}
                >
                  <div style={{ fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>{item.type || '—'}</div>
                  <div style={{ fontFamily: 'var(--prose)', fontSize: '14px', fontWeight: 600, color: 'var(--mocha)', lineHeight: 1.4, marginBottom: '10px', paddingRight: '20px' }}>{item.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <select value={item.status} onChange={e => updateStatus(item, e.target.value)}
                      style={{ padding: '3px 8px', borderRadius: '2px', fontSize: '8.5px', letterSpacing: '.1em', textTransform: 'uppercase', border: 'none', background: STATUS[item.status]?.bg, color: STATUS[item.status]?.color, fontFamily: 'var(--mono)', cursor: 'pointer', outline: 'none' }}>
                      {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <input type="date" value={item.scheduled_date || ''} onChange={e => updateDate(item, e.target.value)}
                      style={{ border: 'none', background: 'transparent', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', outline: 'none', cursor: 'pointer' }} />
                  </div>
                  <button className="del" onClick={() => remove(item.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'var(--dusty)', cursor: 'pointer', fontSize: '11px', opacity: 0, transition: 'opacity .2s' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CALENDÁRIO */}
      {activeTab === 'calendario' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => { const d = new Date(calDate); calView === 'mes' ? d.setMonth(d.getMonth()-1) : d.setDate(d.getDate()-7); setCalDate(d) }}
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '3px', color: 'var(--bronze)', cursor: 'pointer', fontSize: '16px', padding: '4px 10px' }}>‹</button>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '18px', fontWeight: 700, color: 'var(--mocha)', minWidth: '160px', textAlign: 'center' }}>
                {calView === 'mes' ? `${MONTHS[month]} ${year}` : `Semana de ${getWeekDates()[0].getDate()} ${MONTHS_SHORT[getWeekDates()[0].getMonth()]}`}
              </div>
              <button onClick={() => { const d = new Date(calDate); calView === 'mes' ? d.setMonth(d.getMonth()+1) : d.setDate(d.getDate()+7); setCalDate(d) }}
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '3px', color: 'var(--bronze)', cursor: 'pointer', fontSize: '16px', padding: '4px 10px' }}>›</button>
              <button onClick={() => setCalDate(new Date())} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', cursor: 'pointer' }}>Hoje</button>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['mes','semana'].map(v => (
                <button key={v} onClick={() => setCalView(v)} style={{ padding: '6px 14px', background: calView === v ? 'var(--mocha)' : 'transparent', color: calView === v ? 'var(--gold)' : 'var(--muted)', border: `1px solid ${calView === v ? 'var(--mocha)' : 'var(--border)'}`, borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  {v === 'mes' ? 'Mês' : 'Semana'}
                </button>
              ))}
            </div>
          </div>

          {calView === 'mes' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--border)' }}>
                {DAYS_SHORT.map(d => (
                  <div key={d} style={{ padding: '8px', textAlign: 'center', fontSize: '8.5px', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', borderRight: '1px solid var(--border)' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`e${i}`} style={{ minHeight: '70px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--warm)' }} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const dateKey = formatDateKey(year, month, day)
                  const dayItems = getItemsForDate(dateKey)
                  const isToday = dateKey === today
                  return (
                    <div key={day} style={{ minHeight: '70px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '5px', background: isToday ? 'rgba(201,169,110,.05)' : 'transparent' }}>
                      <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: isToday ? 'var(--gold)' : 'transparent', fontFamily: 'var(--mono)', fontSize: '10px', color: isToday ? 'var(--mocha)' : 'var(--muted)', marginBottom: '3px' }}>{day}</div>
                      {dayItems.slice(0, 2).map(item => (
                        <div key={item.id} title={item.title} style={{ fontSize: '8px', padding: '2px 4px', borderRadius: '2px', marginBottom: '2px', background: STATUS[item.status]?.bg, color: STATUS[item.status]?.color, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                      ))}
                      {dayItems.length > 2 && <div style={{ fontSize: '8px', color: 'var(--muted)' }}>+{dayItems.length - 2}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {calView === 'semana' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                {getWeekDates().map((d, i) => {
                  const dateKey = d.toISOString().slice(0, 10)
                  const dayItems = getItemsForDate(dateKey)
                  const isToday = dateKey === today
                  return (
                    <div key={i} style={{ borderRight: i < 6 ? '1px solid var(--border)' : 'none', minHeight: '250px' }}>
                      <div style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', textAlign: 'center', background: isToday ? 'rgba(201,169,110,.08)' : 'var(--warm)' }}>
                        <div style={{ fontSize: '8px', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '3px' }}>{DAYS_SHORT[d.getDay()]}</div>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700, color: isToday ? 'var(--bronze)' : 'var(--mocha)', lineHeight: 1 }}>{d.getDate()}</div>
                      </div>
                      <div style={{ padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {dayItems.map(item => (
                          <div key={item.id} style={{ fontSize: '10px', padding: '5px 7px', borderRadius: '3px', background: STATUS[item.status]?.bg, borderLeft: `3px solid ${STATUS_COLORS[item.status]}`, color: 'var(--mocha)', lineHeight: 1.4 }}>
                            {item.type && <div style={{ fontSize: '7.5px', color: STATUS_COLORS[item.status], textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '2px' }}>{item.type}</div>}
                            <div style={{ fontFamily: 'var(--prose)', fontWeight: 600 }}>{item.title}</div>
                          </div>
                        ))}
                        {dayItems.length === 0 && <div style={{ fontSize: '9px', color: 'rgba(155,136,120,.35)', textAlign: 'center', marginTop: '16px', fontStyle: 'italic' }}>—</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
            {Object.entries(STATUS).map(([key, s]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9px', color: 'var(--muted)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: s.bg, border: `1px solid ${s.color}` }} />{key}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}