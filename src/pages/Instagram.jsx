import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const FORMATOS = ['Reels','Carrossel','Stories','Post Estático','Live']
const EMPTY_POST = { title: '', format: '', date: new Date().toISOString().slice(0,10), curtidas: '', comentarios: '', alcance: '', impressoes: '', salvamentos: '', seguidores_ganhos: '' }

function wkStart(offset = 0) { const d = new Date(); d.setDate(d.getDate() - d.getDay() + offset * 7); d.setHours(0,0,0,0); return d }
function wkKey(offset = 0) { return wkStart(offset).toISOString().slice(0,10) }
function wkLabel(offset = 0) { const s = wkStart(offset); const e = new Date(s); e.setDate(s.getDate() + 6); return `${s.getDate()} ${MONTHS[s.getMonth()]} — ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}` }
function num(v) { return parseInt(v) || 0 }

function MetricCard({ icon, label, value, sub }) {
  return (
    <div style={{ background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: '4px', padding: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '26px', fontWeight: 700, color: 'var(--mocha)', lineHeight: 1, marginBottom: '3px' }}>{value}</div>
      <div style={{ fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</div>
      {sub && <div style={{ fontSize: '9px', color: 'var(--sage)', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

export default function Instagram() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [wkOffset, setWkOffset] = useState(0)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_POST)
  const [editId, setEditId] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data } = await supabase.from('instagram_posts').select('*').eq('user_id', user.id).order('date', { ascending: false })
    setPosts(data || [])
    await loadNotes(0)
    setLoading(false)
  }

  async function loadNotes(offset) {
    const wk = wkKey(offset)
    const { data } = await supabase.from('instagram_weekly').select('notes').eq('user_id', user.id).eq('week_start', wk).single()
    setNotes(data?.notes || '')
  }

  async function saveNotes(val) {
    setNotes(val)
    const wk = wkKey(wkOffset)
    await supabase.from('instagram_weekly').upsert({ user_id: user.id, week_start: wk, notes: val, updated_at: new Date().toISOString() }, { onConflict: 'user_id,week_start' })
  }

  async function changeWk(dir) { const n = wkOffset + dir; setWkOffset(n); await loadNotes(n) }

  async function savePost() {
    if (!form.title.trim()) return
    const payload = { user_id: user.id, title: form.title, format: form.format, date: form.date, curtidas: num(form.curtidas), comentarios: num(form.comentarios), alcance: num(form.alcance), impressoes: num(form.impressoes), salvamentos: num(form.salvamentos), seguidores_ganhos: num(form.seguidores_ganhos) }
    if (editId) {
      const { data } = await supabase.from('instagram_posts').update(payload).eq('id', editId).select().single()
      if (data) setPosts(prev => prev.map(p => p.id === editId ? data : p))
    } else {
      const { data } = await supabase.from('instagram_posts').insert(payload).select().single()
      if (data) setPosts(prev => [data, ...prev])
    }
    setModal(false); setForm(EMPTY_POST); setEditId(null)
  }

  async function deletePost(id) {
    await supabase.from('instagram_posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  function openEdit(post) {
    setForm({ title: post.title, format: post.format || '', date: post.date, curtidas: post.curtidas || '', comentarios: post.comentarios || '', alcance: post.alcance || '', impressoes: post.impressoes || '', salvamentos: post.salvamentos || '', seguidores_ganhos: post.seguidores_ganhos || '' })
    setEditId(post.id); setModal(true)
  }

  const wkS = wkStart(wkOffset)
  const wkE = new Date(wkS); wkE.setDate(wkS.getDate() + 7)
  const wkPosts = posts.filter(p => { const d = new Date(p.date + 'T00:00:00'); return d >= wkS && d < wkE })

  const totalAlcance = wkPosts.reduce((s,p) => s + num(p.alcance), 0)
  const totalImpressoes = wkPosts.reduce((s,p) => s + num(p.impressoes), 0)
  const totalCurtidas = wkPosts.reduce((s,p) => s + num(p.curtidas), 0)
  const totalComentarios = wkPosts.reduce((s,p) => s + num(p.comentarios), 0)
  const totalSalvamentos = wkPosts.reduce((s,p) => s + num(p.salvamentos), 0)
  const totalSeguidores = wkPosts.reduce((s,p) => s + num(p.seguidores_ganhos), 0)
  const totalEngaj = totalCurtidas + totalComentarios + totalSalvamentos
  const taxaEngaj = totalAlcance > 0 ? ((totalEngaj / totalAlcance) * 100).toFixed(1) : '0.0'
  const mediaAlcance = wkPosts.length > 0 ? Math.round(totalAlcance / wkPosts.length) : 0
  const bestPost = wkPosts.length > 0 ? wkPosts.reduce((best, p) => { const e = num(p.curtidas)+num(p.comentarios)+num(p.salvamentos); const be = num(best.curtidas)+num(best.comentarios)+num(best.salvamentos); return e > be ? p : best }, wkPosts[0]) : null

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Carregando...</div>

  return (
    <div>
      <div className="page-hdr">
        <div><div className="eyebrow">Análise Semanal</div><div className="page-title">Instagram</div></div>
        <button onClick={() => { setForm(EMPTY_POST); setEditId(null); setModal(true) }} className="btn-primary">+ Adicionar Post</button>
      </div>

      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '10px 16px', background: '#fff', border: '1px solid var(--border)', borderRadius: '4px', boxShadow: 'var(--shadow)', flexWrap: 'wrap', gap: '10px' }}>
        <button onClick={() => changeWk(-1)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '3px', color: 'var(--bronze)', cursor: 'pointer', fontSize: '16px', padding: '4px 12px' }}>‹</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '16px', fontWeight: 700, color: 'var(--mocha)' }}>{wkLabel(wkOffset)}</div>
          <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>{wkPosts.length} post{wkPosts.length !== 1 ? 's' : ''} nesta semana</div>
        </div>
        <button onClick={() => changeWk(1)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '3px', color: 'var(--bronze)', cursor: 'pointer', fontSize: '16px', padding: '4px 12px' }}>›</button>
      </div>

      {/* Metrics */}
      <div className="insta-metrics">
        <MetricCard icon="👁" label="Alcance Total" value={totalAlcance.toLocaleString('pt-BR')} sub={`Média: ${mediaAlcance.toLocaleString('pt-BR')}/post`} />
        <MetricCard icon="✦" label="Impressões" value={totalImpressoes.toLocaleString('pt-BR')} />
        <MetricCard icon="❤️" label="Engajamento" value={totalEngaj.toLocaleString('pt-BR')} sub={`Taxa: ${taxaEngaj}%`} />
        <MetricCard icon="🌱" label="Novos Seguidores" value={`+${totalSeguidores}`} />
      </div>

      {/* Secondary */}
      <div className="insta-secondary">
        <div className="card">
          <div className="card-hdr"><span className="card-hdr-title">Detalhes de Engajamento</span></div>
          <div className="card-body">
            {[{label:'Curtidas',val:totalCurtidas,icon:'❤️'},{label:'Comentários',val:totalComentarios,icon:'💬'},{label:'Salvamentos',val:totalSalvamentos,icon:'🔖'}].map(m => (
              <div key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--mocha)' }}>{m.icon} {m.label}</span>
                <span style={{ fontFamily: 'var(--serif)', fontSize: '14px', fontWeight: 700, color: 'var(--bronze)' }}>{m.val.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--mocha)', border: '1px solid rgba(201,169,110,.12)', borderRadius: '4px', padding: '14px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '8.5px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(201,169,110,.6)', marginBottom: '10px' }}>🏆 Melhor Post da Semana</div>
          {bestPost ? (
            <>
              <div style={{ fontFamily: 'var(--prose)', fontSize: '14px', fontWeight: 600, color: 'var(--cream)', lineHeight: 1.4, marginBottom: '8px' }}>{bestPost.title}</div>
              <div style={{ fontSize: '9px', color: 'var(--blush)', marginBottom: '8px', opacity: .7 }}>{bestPost.format}</div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', color: 'rgba(232,196,160,.6)' }}>❤️ {num(bestPost.curtidas).toLocaleString('pt-BR')}</span>
                <span style={{ fontSize: '10px', color: 'rgba(232,196,160,.6)' }}>💬 {num(bestPost.comentarios).toLocaleString('pt-BR')}</span>
                <span style={{ fontSize: '10px', color: 'rgba(232,196,160,.6)' }}>🔖 {num(bestPost.salvamentos).toLocaleString('pt-BR')}</span>
              </div>
            </>
          ) : <div style={{ fontSize: '12px', color: 'rgba(176,144,128,.5)', fontStyle: 'italic' }}>Nenhum post nesta semana.</div>}
        </div>

        <div className="card">
          <div className="card-hdr"><span className="card-hdr-title">📝 Anotações da Semana</span></div>
          <div className="card-body">
            <textarea value={notes} onChange={e => saveNotes(e.target.value)} placeholder="O que funcionou? O que testar semana que vem?"
              style={{ width: '100%', height: '110px', border: 'none', background: 'transparent', fontFamily: 'var(--prose)', fontSize: '13px', lineHeight: 1.7, color: 'var(--mocha)', resize: 'none', outline: 'none' }} />
          </div>
        </div>
      </div>

      {/* Posts table */}
      <div className="card">
        <div className="card-hdr"><span className="card-hdr-title">Posts da Semana</span></div>
        {wkPosts.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', fontStyle: 'italic' }}>Nenhum post nesta semana. Clique em "+ Adicionar Post".</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Data','Título','Formato','Alcance','Impressões','❤️','💬','🔖','Seg.','Taxa',''].map(h => (
                  <th key={h} style={{ fontSize: '8px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {wkPosts.map(p => {
                  const engaj = num(p.curtidas)+num(p.comentarios)+num(p.salvamentos)
                  const taxa = num(p.alcance) > 0 ? ((engaj/num(p.alcance))*100).toFixed(1) : '—'
                  return (
                    <tr key={p.id} onMouseEnter={e => e.currentTarget.style.background='var(--warm)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '10px 12px', fontSize: '10px', color: 'var(--muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{new Date(p.date+'T00:00:00').toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--mocha)', borderBottom: '1px solid var(--border)', fontFamily: 'var(--prose)', fontWeight: 600, maxWidth: '160px' }}>{p.title}</td>
                      <td style={{ padding: '10px 12px', fontSize: '10px', color: 'var(--muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{p.format || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{num(p.alcance).toLocaleString('pt-BR')}</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', borderBottom: '1px solid var(--border)' }}>{num(p.impressoes).toLocaleString('pt-BR')}</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', borderBottom: '1px solid var(--border)' }}>{num(p.curtidas).toLocaleString('pt-BR')}</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', borderBottom: '1px solid var(--border)' }}>{num(p.comentarios).toLocaleString('pt-BR')}</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', borderBottom: '1px solid var(--border)' }}>{num(p.salvamentos).toLocaleString('pt-BR')}</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--sage)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>+{num(p.seguidores_ganhos)}</td>
                      <td style={{ padding: '10px 12px', fontSize: '10px', color: 'var(--bronze)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{taxa}%</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                        <button onClick={() => openEdit(p)} style={{ background: 'transparent', border: 'none', color: 'var(--bronze)', cursor: 'pointer', fontSize: '11px', marginRight: '6px' }}>✏️</button>
                        <button onClick={() => { if (window.confirm('Excluir?')) deletePost(p.id) }} style={{ background: 'transparent', border: 'none', color: 'var(--dusty)', cursor: 'pointer', fontSize: '11px' }}>✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {wkPosts.length > 1 && (
                <tfoot>
                  <tr style={{ background: 'var(--warm)' }}>
                    <td colSpan={3} style={{ padding: '10px 12px', fontSize: '8.5px', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>Total</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, borderTop: '1px solid var(--border)' }}>{totalAlcance.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, borderTop: '1px solid var(--border)' }}>{totalImpressoes.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, borderTop: '1px solid var(--border)' }}>{totalCurtidas.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, borderTop: '1px solid var(--border)' }}>{totalComentarios.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, borderTop: '1px solid var(--border)' }}>{totalSalvamentos.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--sage)', borderTop: '1px solid var(--border)' }}>+{totalSeguidores}</td>
                    <td style={{ padding: '10px 12px', fontSize: '10px', fontWeight: 700, color: 'var(--bronze)', borderTop: '1px solid var(--border)' }}>{taxaEngaj}%</td>
                    <td style={{ borderTop: '1px solid var(--border)' }} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div onClick={() => { setModal(false); setForm(EMPTY_POST); setEditId(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(44,31,20,.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '6px', padding: '30px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 60px rgba(44,31,20,.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 700, color: 'var(--mocha)', marginBottom: '18px' }}>{editId ? 'Editar Post' : 'Adicionar Post'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '5px' }}>Título</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: 5 erros que bloqueiam sua renda..."
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', background: 'var(--warm)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '5px' }}>Formato</label>
                <select value={form.format} onChange={e => setForm(p => ({ ...p, format: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', background: 'var(--warm)', outline: 'none' }}>
                  <option value="">Selecionar</option>
                  {FORMATOS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '5px' }}>Data</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', background: 'var(--warm)', outline: 'none' }} />
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '8.5px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>Métricas</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                {[{key:'alcance',label:'Alcance'},{key:'impressoes',label:'Impressões'},{key:'curtidas',label:'Curtidas ❤️'},{key:'comentarios',label:'Comentários 💬'},{key:'salvamentos',label:'Salvamentos 🔖'},{key:'seguidores_ganhos',label:'Seguidores 🌱'}].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '5px' }}>{f.label}</label>
                    <input type="number" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder="0" min="0"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', background: 'var(--warm)', outline: 'none' }} />
                  </div>
                ))}
              </div>
            </div>
            {(num(form.curtidas)+num(form.comentarios)+num(form.salvamentos) > 0 || num(form.alcance) > 0) && (
              <div style={{ padding: '10px 14px', background: 'var(--warm)', borderRadius: '3px', border: '1px solid var(--border)', display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div style={{ fontSize: '9px', color: 'var(--muted)' }}>Engajamento: <strong style={{ color: 'var(--bronze)' }}>{(num(form.curtidas)+num(form.comentarios)+num(form.salvamentos)).toLocaleString('pt-BR')}</strong></div>
                {num(form.alcance) > 0 && <div style={{ fontSize: '9px', color: 'var(--muted)' }}>Taxa: <strong style={{ color: 'var(--bronze)' }}>{(((num(form.curtidas)+num(form.comentarios)+num(form.salvamentos))/num(form.alcance))*100).toFixed(1)}%</strong></div>}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(false); setForm(EMPTY_POST); setEditId(null) }} style={{ padding: '8px 18px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={savePost} style={{ padding: '8px 22px', background: 'var(--mocha)', color: 'var(--gold)', border: 'none', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}