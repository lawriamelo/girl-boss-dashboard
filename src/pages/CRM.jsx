import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const STATUS = {
  lead: { label: 'Lead', bg: 'rgba(201,169,110,.12)', color: '#8B6347' },
  proposta: { label: 'Proposta', bg: 'rgba(44,31,20,.06)', color: '#2C1F14' },
  cliente: { label: 'Cliente', bg: 'rgba(125,140,117,.15)', color: '#7D8C75' },
  inativa: { label: 'Inativa', bg: 'rgba(176,144,128,.15)', color: '#B09080' },
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const EMPTY = { name: '', contact: '', service: '', value: '', status: 'lead', next_action: '' }

function parseValue(v) {
  if (!v) return 0
  return parseFloat(v.toString().replace(/[^0-9,.]/g, '').replace(',', '.')) || 0
}

function formatCurrency(n) {
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CRM() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [view, setView] = useState('semana') // 'semana' | 'mes'
  const [loading, setLoading] = useState(true)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data } = await supabase.from('crm').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.name.trim()) return
    if (editId) {
      const { data } = await supabase.from('crm').update({ ...form }).eq('id', editId).select().single()
      if (data) setClients(prev => prev.map(c => c.id === editId ? data : c))
    } else {
      const { data } = await supabase.from('crm').insert({ user_id: user.id, ...form }).select().single()
      if (data) setClients(prev => [data, ...prev])
    }
    setModal(false); setForm(EMPTY); setEditId(null)
  }

  async function remove(id) {
    await supabase.from('crm').delete().eq('id', id)
    setClients(prev => prev.filter(c => c.id !== id))
  }

  async function clearAll() {
    await supabase.from('crm').delete().eq('user_id', user.id)
    setClients([])
    setConfirmClear(false)
  }

  function openEdit(client) {
    setForm({ name: client.name, contact: client.contact || '', service: client.service || '', value: client.value || '', status: client.status, next_action: client.next_action || '' })
    setEditId(client.id)
    setModal(true)
  }

  function openNew() { setForm(EMPTY); setEditId(null); setModal(true) }

  // ── FILTER BY PERIOD ──
  const now = new Date()

  function getWeekClients() {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0,0,0,0)
    return clients.filter(c => new Date(c.created_at) >= start)
  }

  function getMonthClients() {
    return clients.filter(c => {
      const d = new Date(c.created_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
  }

  const filteredClients = view === 'semana' ? getWeekClients() : getMonthClients()
  const totalFiltered = filteredClients.filter(c => c.status === 'cliente').reduce((sum, c) => sum + parseValue(c.value), 0)

  // ── MONTHLY CHART DATA ──
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthClients = clients.filter(c => {
      const d = new Date(c.created_at)
      return d.getMonth() === i && d.getFullYear() === now.getFullYear()
    })
    const total = monthClients.filter(c => c.status === 'cliente').reduce((sum, c) => sum + parseValue(c.value), 0)
    const count = monthClients.length
    return { month: MONTHS[i], total, count }
  })

  const maxMonthTotal = Math.max(...monthlyData.map(m => m.total), 1)

  // ── WEEKLY CHART DATA (last 8 weeks) ──
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const wStart = new Date(now)
    wStart.setDate(now.getDate() - now.getDay() - (7 * (7 - i)))
    wStart.setHours(0,0,0,0)
    const wEnd = new Date(wStart)
    wEnd.setDate(wStart.getDate() + 7)
    const wClients = clients.filter(c => {
      const d = new Date(c.created_at)
      return d >= wStart && d < wEnd
    })
    const total = wClients.filter(c => c.status === 'cliente').reduce((sum, c) => sum + parseValue(c.value), 0)
    const count = wClients.length
    const label = `${wStart.getDate()}/${wStart.getMonth() + 1}`
    return { label, total, count }
  })

  const maxWeekTotal = Math.max(...weeklyData.map(w => w.total), 1)

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Carregando...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '22px', paddingBottom: '18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '8.5px', letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '3px' }}>Gestão de Clientes</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '26px', fontWeight: 700, color: 'var(--mocha)' }}>CRM de Vendas</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={openNew} style={{ padding: '8px 20px', background: 'var(--mocha)', color: 'var(--gold)', border: 'none', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer' }}>+ Nova Cliente</button>
        </div>
      </div>

      {/* View toggle + total */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['semana', 'mes'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '7px 16px', background: view === v ? 'var(--mocha)' : 'transparent', color: view === v ? 'var(--gold)' : 'var(--muted)', border: `1px solid ${view === v ? 'var(--mocha)' : 'var(--border)'}`, borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .2s' }}>
              {v === 'semana' ? 'Esta Semana' : 'Este Mês'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ padding: '8px 16px', background: '#fff', border: '1px solid var(--border)', borderRadius: '3px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '3px' }}>{view === 'semana' ? 'Semana' : 'Mês'} · Clientes</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: 700, color: 'var(--mocha)' }}>{filteredClients.filter(c => c.status === 'cliente').length}</div>
          </div>
          <div style={{ padding: '8px 16px', background: 'var(--mocha)', border: '1px solid var(--mocha)', borderRadius: '3px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(201,169,110,.6)', marginBottom: '3px' }}>{view === 'semana' ? 'Semana' : 'Mês'} · Faturamento</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: 700, color: 'var(--gold)' }}>{formatCurrency(totalFiltered)}</div>
          </div>
        </div>
      </div>

      {/* Status badges */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {Object.entries(STATUS).map(([key, s]) => {
          const count = clients.filter(c => c.status === key).length
          return (
            <div key={key} style={{ padding: '5px 12px', background: s.bg, borderRadius: '2px', fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase', color: s.color, fontFamily: 'var(--mono)' }}>
              {s.label}: {count}
            </div>
          )
        })}
        <div style={{ padding: '5px 12px', background: 'rgba(44,31,20,.04)', borderRadius: '2px', fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Total: {clients.length}</div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* Monthly chart */}
        <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div style={{ padding: '13px 17px 11px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '9px', letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>📊 Faturamento Mensal · {now.getFullYear()}</span>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px', marginBottom: '6px' }}>
              {monthlyData.map((m, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '100%', justifyContent: 'flex-end' }}>
                  <div title={`${m.month}: ${formatCurrency(m.total)} (${m.count} clientes)`}
                    style={{ width: '100%', background: i === now.getMonth() ? 'var(--gold)' : 'var(--bronze)', borderRadius: '2px 2px 0 0', height: `${Math.max((m.total / maxMonthTotal) * 100, m.total > 0 ? 8 : 2)}%`, transition: 'height .4s ease', opacity: m.total === 0 ? .2 : 1, cursor: 'pointer' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {monthlyData.map((m, i) => (
                <div key={i} style={{ flex: 1, fontSize: '7px', color: i === now.getMonth() ? 'var(--bronze)' : 'var(--muted)', textAlign: 'center', fontFamily: 'var(--mono)' }}>{m.month}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly chart */}
        <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div style={{ padding: '13px 17px 11px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '9px', letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>📊 Faturamento Semanal · Últimas 8 Semanas</span>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px', marginBottom: '6px' }}>
              {weeklyData.map((w, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '100%', justifyContent: 'flex-end' }}>
                  <div title={`Semana ${w.label}: ${formatCurrency(w.total)} (${w.count} leads)`}
                    style={{ width: '100%', background: i === 7 ? 'var(--gold)' : 'var(--bronze)', borderRadius: '2px 2px 0 0', height: `${Math.max((w.total / maxWeekTotal) * 100, w.total > 0 ? 8 : 2)}%`, transition: 'height .4s ease', opacity: w.total === 0 ? .2 : 1, cursor: 'pointer' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {weeklyData.map((w, i) => (
                <div key={i} style={{ flex: 1, fontSize: '7px', color: i === 7 ? 'var(--bronze)' : 'var(--muted)', textAlign: 'center', fontFamily: 'var(--mono)' }}>{w.label}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 17px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '9px', letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            {view === 'semana' ? 'Esta Semana' : 'Este Mês'} · {filteredClients.length} registros
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Nome','Contato','Serviço','Valor','Status','Próx. Ação',''].map(h => (
                  <th key={h} style={{ fontSize: '8px', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--muted)', padding: '8px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px', fontStyle: 'italic' }}>Nenhum registro neste período.</td></tr>
              ) : filteredClients.map(c => (
                <tr key={c.id} style={{ transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--warm)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '11px 14px', fontSize: '11px', color: 'var(--mocha)', borderBottom: '1px solid var(--border)' }}><strong>{c.name}</strong></td>
                  <td style={{ padding: '11px 14px', fontSize: '11px', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{c.contact}</td>
                  <td style={{ padding: '11px 14px', fontSize: '11px', color: 'var(--mocha)', borderBottom: '1px solid var(--border)' }}>{c.service}</td>
                  <td style={{ padding: '11px 14px', fontSize: '11px', fontWeight: 500, color: 'var(--mocha)', borderBottom: '1px solid var(--border)' }}>{c.value}</td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: '2px', fontSize: '8px', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 500, background: STATUS[c.status]?.bg, color: STATUS[c.status]?.color }}>
                      {STATUS[c.status]?.label}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '10px', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{c.next_action}</td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(c)} style={{ background: 'transparent', border: 'none', color: 'var(--bronze)', cursor: 'pointer', fontSize: '11px', marginRight: '8px' }}>✏️</button>
                    <button onClick={() => { if (window.confirm('Remover esta cliente?')) remove(c.id) }} style={{ background: 'transparent', border: 'none', color: 'var(--dusty)', cursor: 'pointer', fontSize: '11px' }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredClients.filter(c => c.status === 'cliente').length > 0 && (
          <div style={{ padding: '12px 17px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '20px' }}>
            <span style={{ fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Total faturado no período</span>
            <span style={{ fontFamily: 'var(--serif)', fontSize: '16px', fontWeight: 700, color: 'var(--bronze)' }}>{formatCurrency(totalFiltered)}</span>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {modal && (
        <div onClick={() => { setModal(false); setForm(EMPTY); setEditId(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(44,31,20,.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '6px', padding: '30px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 60px rgba(44,31,20,.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700, color: 'var(--mocha)', marginBottom: '18px' }}>{editId ? 'Editar Cliente' : 'Nova Cliente'}</div>
            {[
              { key: 'name', label: 'Nome', placeholder: 'Nome da cliente' },
              { key: 'contact', label: 'Contato', placeholder: '@instagram ou whatsapp' },
              { key: 'service', label: 'Serviço', placeholder: 'Ex: Mentoria individual' },
              { key: 'value', label: 'Valor', placeholder: 'R$ 0,00' },
              { key: 'next_action', label: 'Próxima Ação', placeholder: 'Ex: Enviar proposta amanhã' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '5px' }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', background: 'var(--warm)', outline: 'none' }} />
              </div>
            ))}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '5px' }}>Status</label>
              <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', background: 'var(--warm)', outline: 'none' }}>
                <option value="lead">Lead</option>
                <option value="proposta">Proposta Enviada</option>
                <option value="cliente">Cliente</option>
                <option value="inativa">Inativa</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => { setModal(false); setForm(EMPTY); setEditId(null) }} style={{ padding: '8px 18px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={save} style={{ padding: '8px 22px', background: 'var(--mocha)', color: 'var(--gold)', border: 'none', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}