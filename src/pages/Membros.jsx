import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const STATUS_MAP = {
  ativa: { label: 'Ativa', bg: 'rgba(125,140,117,.15)', color: '#7D8C75' },
  pendente: { label: 'Pendente', bg: 'rgba(201,169,110,.12)', color: '#8B6347' },
  inativa: { label: 'Inativa', bg: 'rgba(176,144,128,.15)', color: '#B09080' },
}

const EMPTY_UPDATE = { type: 'msg', text: '' }
const EMPTY_EDIT = { name: '', type: 'Aluna', contact: '', status: 'ativa', progress: '' }

export default function Membros() {
  const { user, profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [members, setMembers] = useState([])
  const [updates, setUpdates] = useState([])
  const [filter, setFilter] = useState('all')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState(EMPTY_EDIT)
  const [editId, setEditId] = useState(null)
  const [updateModal, setUpdateModal] = useState(false)
  const [updateForm, setUpdateForm] = useState(EMPTY_UPDATE)
  const [editUpdateId, setEditUpdateId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    await Promise.all([loadMembers(), loadUpdates()])
    setLoading(false)
  }

  async function loadMembers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setMembers(data || [])
  }

  async function loadUpdates() {
    const { data } = await supabase.from('admin_updates').select('*').order('created_at', { ascending: false })
    setUpdates(data || [])
  }

  // ── INVITE ──
  async function sendInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviteLoading(true)
    setInviteMsg('')
    const { error } = await supabase.auth.admin?.inviteUserByEmail?.(inviteEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      // Fallback via magic link
      const { error: err2 } = await supabase.auth.signInWithOtp({
        email: inviteEmail.trim(),
        options: { emailRedirectTo: `${window.location.origin}/reset-password` }
      })
      if (err2) { setInviteMsg('Erro ao enviar convite. Tente novamente.'); setInviteLoading(false); return }
    }
    setInviteMsg(`✓ Convite enviado para ${inviteEmail}`)
    setInviteEmail('')
    setInviteLoading(false)
    setTimeout(() => setInviteMsg(''), 4000)
  }

  // ── EDIT MEMBER ──
  function openEdit(member) {
    setEditForm({ name: member.name || '', type: member.type || 'Aluna', contact: member.contact || '', status: member.status || 'ativa', progress: member.progress || '' })
    setEditId(member.id)
    setEditModal(true)
  }

  async function saveEdit() {
    const { data } = await supabase.from('profiles').update({
      name: editForm.name, type: editForm.type,
      contact: editForm.contact, status: editForm.status,
      progress: editForm.progress,
    }).eq('id', editId).select().single()
    if (data) setMembers(prev => prev.map(m => m.id === editId ? data : m))
    setEditModal(false); setEditForm(EMPTY_EDIT); setEditId(null)
  }

  async function deleteMember(id) {
    if (!window.confirm('Remover esta membra?')) return
    await supabase.from('profiles').delete().eq('id', id)
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  async function updateStatus(id, status) {
    const { data } = await supabase.from('profiles').update({ status }).eq('id', id).select().single()
    if (data) setMembers(prev => prev.map(m => m.id === id ? data : m))
  }

  // ── UPDATES / MURAL ──
  async function saveUpdate() {
    if (!updateForm.text.trim()) return
    if (editUpdateId) {
      const { data } = await supabase.from('admin_updates').update({ type: updateForm.type, text: updateForm.text }).eq('id', editUpdateId).select().single()
      if (data) setUpdates(prev => prev.map(u => u.id === editUpdateId ? data : u))
    } else {
      const { data } = await supabase.from('admin_updates').insert({ created_by: user.id, type: updateForm.type, text: updateForm.text }).select().single()
      if (data) setUpdates(prev => [data, ...prev])
    }
    setUpdateModal(false); setUpdateForm(EMPTY_UPDATE); setEditUpdateId(null)
  }

  async function deleteUpdate(id) {
    if (!window.confirm('Excluir este recado?')) return
    await supabase.from('admin_updates').delete().eq('id', id)
    setUpdates(prev => prev.filter(u => u.id !== id))
  }

  function openEditUpdate(update) {
    setUpdateForm({ type: update.type, text: update.text })
    setEditUpdateId(update.id)
    setUpdateModal(true)
  }

  const filteredMembers = filter === 'all' ? members : members.filter(m => m.status === filter)
  const stats = { total: members.length, ativa: members.filter(m => m.status === 'ativa').length, pendente: members.filter(m => m.status === 'pendente').length, inativa: members.filter(m => m.status === 'inativa').length }

  const UPDATE_TYPES = {
    msg: { label: 'Aviso', dot: '#C9A96E' },
    in: { label: 'Entrada', dot: '#7D8C75' },
    out: { label: 'Saída', dot: '#b07070' },
  }

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Carregando...</div>

  // ── MEMBRA VIEW ──
  if (!isAdmin) {
    const myProfile = members.find(m => m.id === user.id)
    return (
      <div>
        <div style={{ marginBottom: '22px', paddingBottom: '18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '8.5px', letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '3px' }}>Área de</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '26px', fontWeight: 700, color: 'var(--mocha)' }}>Membros</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
          <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            <div style={{ padding: '13px 17px 11px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '9px', letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>👤 Meu Perfil</span>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--bronze),var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                {(myProfile?.name || user.email || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '18px', fontWeight: 700, color: 'var(--mocha)', marginBottom: '4px' }}>{myProfile?.name || user.email}</div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '12px' }}>{myProfile?.type || 'Membra'}</div>
              {myProfile?.status && (
                <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '2px', fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 500, background: STATUS_MAP[myProfile.status]?.bg, color: STATUS_MAP[myProfile.status]?.color, marginBottom: '12px' }}>
                  {STATUS_MAP[myProfile.status]?.label}
                </span>
              )}
              {myProfile?.progress && (
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', padding: '8px 14px', background: 'var(--warm)', borderRadius: '3px', border: '1px solid var(--border)', marginTop: '4px' }}>
                  {myProfile.progress}
                </div>
              )}
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            <div style={{ padding: '13px 17px 11px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '9px', letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>📌 Mural de Recados</span>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
              {updates.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Nenhum recado ainda.</div>
              ) : updates.map(u => (
                <div key={u.id} style={{ padding: '12px 14px', background: 'var(--warm)', borderRadius: '3px', borderLeft: `3px solid ${UPDATE_TYPES[u.type]?.dot}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: UPDATE_TYPES[u.type]?.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: '8.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>{UPDATE_TYPES[u.type]?.label}</span>
                    <span style={{ fontSize: '8px', color: 'var(--muted)', marginLeft: 'auto' }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--mocha)', lineHeight: 1.6 }}>{u.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── ADMIN VIEW ──
  return (
    <div>
      <div style={{ marginBottom: '22px', paddingBottom: '18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '8.5px', letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '3px' }}>Área de</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '26px', fontWeight: 700, color: 'var(--mocha)' }}>Membros</div>
        </div>
        <button onClick={() => { setUpdateForm(EMPTY_UPDATE); setEditUpdateId(null); setUpdateModal(true) }} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--bronze)', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}>📌 Novo Recado</button>
      </div>

      {/* Invite form */}
      <div style={{ background: 'var(--mocha)', borderRadius: '4px', border: '1px solid rgba(201,169,110,.12)', padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ fontSize: '9px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(201,169,110,.6)', marginBottom: '10px' }}>✉️ Convidar Nova Membra</div>
        <form onSubmit={sendInvite} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@exemplo.com" required
            style={{ flex: 1, minWidth: '220px', padding: '9px 14px', border: '1px solid rgba(201,169,110,.2)', borderRadius: '3px', background: 'rgba(255,255,255,.06)', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--cream)', outline: 'none' }} />
          <button type="submit" disabled={inviteLoading} style={{ padding: '9px 20px', background: inviteLoading ? 'rgba(201,169,110,.4)' : 'var(--gold)', border: 'none', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--mocha)', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {inviteLoading ? 'Enviando...' : 'Enviar Convite'}
          </button>
        </form>
        {inviteMsg && <div style={{ marginTop: '8px', fontSize: '10px', color: inviteMsg.startsWith('✓') ? 'var(--sage)' : '#c47070', letterSpacing: '.05em' }}>{inviteMsg}</div>}
        <div style={{ marginTop: '8px', fontSize: '9px', color: 'rgba(176,144,128,.45)', lineHeight: 1.6 }}>
          A membra receberá um email com link para criar a própria senha e acessar o protocolo.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
        <div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
            {[{ label: 'Total', val: stats.total, color: 'var(--mocha)' }, { label: 'Ativas', val: stats.ativa, color: 'var(--sage)' }, { label: 'Pendentes', val: stats.pendente, color: 'var(--bronze)' }, { label: 'Inativas', val: stats.inativa, color: 'var(--dusty)' }].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '4px', padding: '14px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '28px', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '3px' }}>{s.val}</div>
                <div style={{ fontSize: '8.5px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {[['all','Todas'],['ativa','Ativas'],['pendente','Pendentes'],['inativa','Inativas']].map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)} style={{ padding: '6px 14px', border: `1px solid ${filter === key ? 'var(--mocha)' : 'var(--border)'}`, borderRadius: '3px', background: filter === key ? 'var(--mocha)' : 'transparent', color: filter === key ? 'var(--gold)' : 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>{label}</button>
            ))}
          </div>

          {/* List */}
          {filteredMembers.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', fontStyle: 'italic' }}>Nenhuma membra encontrada.</div>
          ) : filteredMembers.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 17px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--warm)', marginBottom: '9px', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--warm)' }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--bronze),var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '15px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(m.name || m.email || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--mocha)', marginBottom: '2px' }}>{m.name || m.email}</div>
                <div style={{ fontSize: '9.5px', color: 'var(--muted)' }}>{m.type || 'Membra'} · {m.contact || m.email}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <select value={m.status || 'ativa'} onChange={e => updateStatus(m.id, e.target.value)}
                  style={{ padding: '3px 8px', borderRadius: '2px', fontSize: '8.5px', letterSpacing: '.1em', textTransform: 'uppercase', border: 'none', background: STATUS_MAP[m.status]?.bg || STATUS_MAP.ativa.bg, color: STATUS_MAP[m.status]?.color || STATUS_MAP.ativa.color, fontFamily: 'var(--mono)', cursor: 'pointer', outline: 'none', marginBottom: '4px', display: 'block' }}>
                  <option value="ativa">Ativa</option>
                  <option value="pendente">Pendente</option>
                  <option value="inativa">Inativa</option>
                </select>
                <div style={{ fontSize: '9px', color: 'var(--muted)' }}>{m.progress || '—'}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => openEdit(m)} style={{ background: 'transparent', border: 'none', color: 'var(--bronze)', cursor: 'pointer', fontSize: '13px' }}>✏️</button>
                <button onClick={() => deleteMember(m.id)} style={{ background: 'transparent', border: 'none', color: 'var(--dusty)', cursor: 'pointer', fontSize: '13px' }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Mural panel */}
        <div style={{ background: 'var(--mocha)', border: '1px solid rgba(201,169,110,.12)', borderRadius: '4px', overflow: 'hidden', position: 'sticky', top: '20px' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(201,169,110,.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--sage)', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '9px', letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(201,169,110,.7)' }}>Mural de Recados</span>
            </div>
            <button onClick={() => { setUpdateForm(EMPTY_UPDATE); setEditUpdateId(null); setUpdateModal(true) }} style={{ background: 'rgba(201,169,110,.1)', border: '1px solid rgba(201,169,110,.2)', borderRadius: '2px', color: 'var(--gold)', fontFamily: 'var(--mono)', fontSize: '8px', letterSpacing: '.1em', cursor: 'pointer', padding: '4px 8px' }}>+ Novo</button>
          </div>
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
            {updates.length === 0 ? (
              <div style={{ fontSize: '11px', color: 'rgba(176,144,128,.5)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Nenhum recado ainda.</div>
            ) : updates.map(u => (
              <div key={u.id} style={{ padding: '10px 12px', background: 'rgba(255,255,255,.05)', borderRadius: '3px', borderLeft: `2px solid ${UPDATE_TYPES[u.type]?.dot}`, position: 'relative' }}
                onMouseEnter={e => e.currentTarget.querySelector('.upd-act').style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.querySelector('.upd-act').style.opacity = '0'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: UPDATE_TYPES[u.type]?.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: '8px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(201,169,110,.45)' }}>{UPDATE_TYPES[u.type]?.label}</span>
                  <span style={{ fontSize: '8px', color: 'rgba(176,144,128,.4)', marginLeft: 'auto' }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(232,196,160,.65)', lineHeight: 1.55 }}>{u.text}</div>
                <div className="upd-act" style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', opacity: 0, transition: 'opacity .2s' }}>
                  <button onClick={() => openEditUpdate(u)} style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: '11px' }}>✏️</button>
                  <button onClick={() => deleteUpdate(u.id)} style={{ background: 'transparent', border: 'none', color: '#b07070', cursor: 'pointer', fontSize: '11px' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit member modal */}
      {editModal && (
        <div onClick={() => setEditModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(44,31,20,.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '6px', padding: '30px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 60px rgba(44,31,20,.2)' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700, color: 'var(--mocha)', marginBottom: '18px' }}>Editar Membra</div>
            {[{ key: 'name', label: 'Nome', ph: 'Nome completo' }, { key: 'contact', label: 'Contato', ph: '@instagram ou email' }, { key: 'progress', label: 'Progresso', ph: 'Ex: Dia 3 do protocolo' }].map(f => (
              <div key={f.key} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '5px' }}>{f.label}</label>
                <input value={editForm[f.key]} onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', background: 'var(--warm)', outline: 'none' }} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '5px' }}>Tipo</label>
                <select value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', background: 'var(--warm)', outline: 'none' }}>
                  <option value="Aluna">Aluna — Protocolo</option>
                  <option value="Membra">Membra — Comunidade</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '5px' }}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', background: 'var(--warm)', outline: 'none' }}>
                  <option value="ativa">Ativa</option>
                  <option value="pendente">Pendente</option>
                  <option value="inativa">Inativa</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setEditModal(false)} style={{ padding: '8px 18px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveEdit} style={{ padding: '8px 22px', background: 'var(--mocha)', color: 'var(--gold)', border: 'none', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Update modal */}
      {updateModal && (
        <div onClick={() => { setUpdateModal(false); setUpdateForm(EMPTY_UPDATE); setEditUpdateId(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(44,31,20,.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '6px', padding: '30px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 60px rgba(44,31,20,.2)' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700, color: 'var(--mocha)', marginBottom: '18px' }}>{editUpdateId ? 'Editar Recado' : 'Novo Recado'}</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '5px' }}>Tipo</label>
              <select value={updateForm.type} onChange={e => setUpdateForm(p => ({ ...p, type: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', background: 'var(--warm)', outline: 'none' }}>
                <option value="msg">Aviso</option>
                <option value="in">Entrada</option>
                <option value="out">Saída</option>
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '5px' }}>Mensagem</label>
              <textarea value={updateForm.text} onChange={e => setUpdateForm(p => ({ ...p, text: e.target.value }))} placeholder="Ex: Aula ao vivo esta quinta às 20h — link na bio" rows={4}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', background: 'var(--warm)', outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => { setUpdateModal(false); setUpdateForm(EMPTY_UPDATE); setEditUpdateId(null) }} style={{ padding: '8px 18px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveUpdate} style={{ padding: '8px 22px', background: 'var(--mocha)', color: 'var(--gold)', border: 'none', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer' }}>Publicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}