import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const DEFAULT_TASKS = [
  'Fazer 1 movimento de visibilidade',
  'Postar um story com posicionamento',
  'Visualizar sua versão milionária por 5 minutos',
  'EFT para regulação emocional e expansão',
  'Registrar uma venda ou oportunidade recebida',
  'Fazer uma ação fora da zona de conforto',
  'Anotar uma crença limitante percebida no dia',
  'Escutar a ativação do protocolo',
  'Escrever 1 evidência de crescimento',
  'Compartilhar uma opinião verdadeira no conteúdo',
  'Celebrar pequenas conquistas',
  'Fazer uma pergunta aclaradora para si mesma',
  'Registrar insights intuitivos do dia',
  'Conectar-se com a energia da cliente ideal',
  'Declarar em voz alta o que está pronta para viver',
]

const MOODS = ['🔥','⚡','🌿','🌙','💔']

function Card({ children, style = {} }) {
  return (
    <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden', ...style }}>
      {children}
    </div>
  )
}

function CardHeader({ title }) {
  return (
    <div style={{ padding: '13px 17px 11px', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '9px', letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>{title}</span>
    </div>
  )
}

function CardBody({ children, style = {} }) {
  return <div style={{ padding: '17px', ...style }}>{children}</div>
}

function GhostBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ width: '100%', padding: '9px 12px', border: '1px dashed var(--border)', borderRadius: '3px', background: 'transparent', fontSize: '10px', color: 'var(--muted)', cursor: 'pointer', textAlign: 'left', letterSpacing: '.04em', fontFamily: 'var(--mono)' }}>{children}</button>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [notes, setNotes] = useState('')
  const [intention, setIntention] = useState('')
  const [mood, setMood] = useState('')
  const [habits, setHabits] = useState([])
  const [habitLogs, setHabitLogs] = useState([])
  const [habitWkOffset, setHabitWkOffset] = useState(0)
  const [checkins, setCheckins] = useState({})
  const [checkinWkOffset, setCheckinWkOffset] = useState(0)
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().slice(0, 10)

  function wkKey(off) {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + off * 7)
    return d.toISOString().slice(0, 10)
  }

  function wkLabel(off) {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + off * 7)
    const e = new Date(d)
    e.setDate(d.getDate() + 6)
    return `${d.getDate()} ${MONTHS[d.getMonth()]} — ${e.getDate()} ${MONTHS[e.getMonth()]}`
  }

  useEffect(() => { if (user) loadAll() }, [user])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadTasks(), loadNotes(), loadHabits(), loadCheckins()])
    setLoading(false)
  }

  async function loadTasks() {
    const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id).eq('date', today).order('sort_order')
    if (data && data.length > 0) {
      setTasks(data)
    } else {
      const toInsert = DEFAULT_TASKS.map((text, i) => ({ user_id: user.id, text, done: false, date: today, sort_order: i }))
      const { data: inserted } = await supabase.from('tasks').insert(toInsert).select()
      setTasks(inserted || [])
    }
  }

  async function loadNotes() {
    const { data } = await supabase.from('notes').select('*').eq('user_id', user.id).single()
    if (data) setNotes(data.content || '')
  }

  async function loadHabits() {
    const { data } = await supabase.from('habits').select('*').eq('user_id', user.id).order('created_at')
    if (data && data.length > 0) {
      setHabits(data)
      const wk = wkKey(0)
      const { data: logs } = await supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('week_start', wk)
      setHabitLogs(logs || [])
    } else {
      const defaults = ['Meditação', 'Gratidão', 'Movimento', 'Leitura']
      const toInsert = defaults.map(name => ({ user_id: user.id, name }))
      const { data: inserted } = await supabase.from('habits').insert(toInsert).select()
      setHabits(inserted || [])
    }
  }

  async function loadCheckins() {
    const { data } = await supabase.from('checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(14)
    if (data) {
      const map = {}
      data.forEach(c => { map[c.date] = c })
      setCheckins(map)
      const todayCI = map[today]
      if (todayCI) { setMood(todayCI.mood || ''); setIntention(todayCI.intention || '') }
    }
  }

  async function toggleTask(task) {
    const { data } = await supabase.from('tasks').update({ done: !task.done }).eq('id', task.id).select().single()
    if (data) setTasks(prev => prev.map(t => t.id === task.id ? data : t))
  }

  async function addTask() {
    if (!newTask.trim()) return
    const { data } = await supabase.from('tasks').insert({ user_id: user.id, text: newTask.trim(), done: false, date: today, sort_order: tasks.length }).select().single()
    if (data) setTasks(prev => [...prev, data])
    setNewTask(''); setShowInput(false)
  }

  async function saveNotes(val) {
    setNotes(val)
    await supabase.from('notes').upsert({ user_id: user.id, content: val, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  }

  async function saveCheckin() {
    await supabase.from('checkins').upsert({ user_id: user.id, date: today, mood, intention }, { onConflict: 'user_id,date' })
    setCheckins(prev => ({ ...prev, [today]: { mood, intention, date: today } }))
  }

  async function toggleHabit(habitId, dayIndex) {
    const wk = wkKey(habitWkOffset)
    const existing = habitLogs.find(l => l.habit_id === habitId && l.day_index === dayIndex)
    if (existing) {
      await supabase.from('habit_logs').delete().eq('id', existing.id)
      setHabitLogs(prev => prev.filter(l => l.id !== existing.id))
    } else {
      const { data } = await supabase.from('habit_logs').insert({ habit_id: habitId, user_id: user.id, week_start: wk, day_index: dayIndex }).select().single()
      if (data) setHabitLogs(prev => [...prev, data])
    }
  }

  async function changeHabitWk(dir) {
    const newOff = habitWkOffset + dir
    setHabitWkOffset(newOff)
    const wk = wkKey(newOff)
    const { data } = await supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('week_start', wk)
    setHabitLogs(data || [])
  }

  const done = tasks.filter(t => t.done).length
  const total = tasks.length
  const pct = total ? Math.round(done / total * 100) : 0
  const now = new Date()

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '20px' }}>Carregando...</div>

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '22px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingBottom: '18px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontSize: '8.5px', letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '3px' }}>Visão Geral</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '26px', fontWeight: 700, color: 'var(--mocha)' }}>Dashboard</div>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{DAYS[now.getDay()]}, {now.getDate()} de {MONTHS[now.getMonth()]}</div>
      </div>

      {/* Welcome strip — texto em cima, setas embaixo, assinatura no fim */}
      <div style={{ background: 'linear-gradient(135deg,var(--mocha),#3A2518)', borderRadius: '4px', border: '1px solid rgba(201,169,110,.1)', padding: '20px 24px', marginBottom: '20px' }}>
        <div style={{ fontFamily: 'var(--prose)', fontSize: '14px', lineHeight: 1.85, color: 'rgba(245,240,232,.75)', fontWeight: 300 }}>
          Esse espaço foi criado pra te ajudar a integrar o protocolo com mais{' '}
          <strong style={{ color: 'var(--gold)' }}>clareza, foco e organização</strong>. Tudo aqui é seu.
          <br /><br />
          A proposta é simples: trabalhar os bloqueios que travam sua relação com o dinheiro e abrir espaço pra um fluxo mais leve, consciente e possível.
        </div>
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {[
            'Protocolo · 6 cadernos de identidade',
            'Kanban, CRM e conteúdo',
            'Análise semanal do Instagram',
            'Gratidão e manifestação',
            'Área de membros',
          ].map(a => (
            <div key={a} style={{ fontSize: '10.5px', color: 'var(--blush)', display: 'flex', alignItems: 'center', gap: '7px', opacity: .82 }}>
              <span style={{ color: 'var(--gold)', flexShrink: 0 }}>⭢</span>{a}
            </div>
          ))}
        </div>
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '14px', color: 'var(--gold)', opacity: .58, marginTop: '16px' }}>Com carinho, Cami 🤎</div>
      </div>

      {/* 3-col grid */}
      <div className="dash-grid">

        {/* COL 1 — Tasks + Notes */}
        <div className="dash-col">
          <Card>
            <div style={{ padding: '13px 17px 11px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '9px', letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>⭐ Tarefas Diárias</span>
              <span style={{ fontSize: '9px', color: 'var(--muted)' }}>{done}/{total}</span>
            </div>
            <CardBody>
              {tasks.map(t => (
                <div key={t.id} onClick={() => toggleTask(t)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '3px', background: 'var(--warm)', border: '1px solid var(--border)', cursor: 'pointer', marginBottom: '7px', opacity: t.done ? .42 : 1 }}>
                  <div style={{ width: '17px', height: '17px', border: '1.5px solid var(--bronze)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: t.done ? 'var(--bronze)' : 'transparent', transition: 'all .2s' }}>
                    {t.done && <span style={{ fontSize: '9px', color: '#fff' }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--mocha)', flex: 1, lineHeight: 1.4, textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
                </div>
              ))}
              {showInput ? (
                <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setShowInput(false) }} placeholder="Nova tarefa..." autoFocus style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gold)', borderRadius: '3px', background: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', outline: 'none', marginBottom: '6px' }} />
              ) : (
                <GhostBtn onClick={() => setShowInput(true)}>+ Adicionar tarefa</GhostBtn>
              )}
              <div style={{ marginTop: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--muted)', marginBottom: '5px' }}>
                  <span>Progresso do dia</span><span>{pct}%</span>
                </div>
                <div style={{ width: '100%', height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,var(--bronze),var(--gold))', borderRadius: '2px', transition: 'width .5s ease' }} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="📝 Anotações" />
            <CardBody>
              <textarea value={notes} onChange={e => saveNotes(e.target.value)} placeholder="Ideias, lembretes, insights..." style={{ width: '100%', minHeight: '110px', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: '3px', background: 'var(--warm)', fontFamily: 'var(--prose)', fontSize: '15px', lineHeight: 1.8, color: 'var(--mocha)', resize: 'vertical', outline: 'none' }} />
            </CardBody>
          </Card>
        </div>

        {/* COL 2 — Check-in */}
        <div className="dash-col">
          <Card>
            <CardHeader title="✨ Check-in do Dia" />
            <CardBody>
              <div style={{ fontSize: '9px', color: 'var(--muted)', letterSpacing: '.1em', marginBottom: '8px' }}>Como você está hoje?</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {MOODS.map(m => (
                  <button key={m} onClick={() => setMood(m)} style={{ padding: '7px 12px', border: `1px solid ${mood === m ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '3px', background: mood === m ? 'rgba(201,169,110,.18)' : 'var(--warm)', cursor: 'pointer', fontSize: '14px', transition: 'all .15s' }}>{m}</button>
                ))}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--muted)', letterSpacing: '.1em', marginBottom: '6px' }}>Intenção do dia</div>
              <textarea value={intention} onChange={e => setIntention(e.target.value)} placeholder="O que você quer manifestar hoje..." style={{ width: '100%', height: '60px', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '3px', background: 'var(--warm)', fontFamily: 'var(--prose)', fontSize: '15px', color: 'var(--mocha)', resize: 'none', outline: 'none', marginBottom: '12px' }} />
              <button onClick={saveCheckin} style={{ width: '100%', padding: '10px', background: 'var(--mocha)', color: 'var(--gold)', border: 'none', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: '14px' }}>Salvar Check-in de Hoje</button>
              <div style={{ fontSize: '9px', color: 'var(--muted)', letterSpacing: '.1em', marginBottom: '8px' }}>Histórico da Semana</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '7px 12px', background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: '3px' }}>
                <span style={{ fontSize: '9px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>{wkLabel(checkinWkOffset)}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setCheckinWkOffset(p => p - 1)} style={{ background: 'transparent', border: 'none', color: 'var(--bronze)', cursor: 'pointer', fontSize: '15px' }}>‹</button>
                  <button onClick={() => setCheckinWkOffset(p => p + 1)} style={{ background: 'transparent', border: 'none', color: 'var(--bronze)', cursor: 'pointer', fontSize: '15px' }}>›</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '3px' }}>
                {['D','S','T','Q','Q','S','S'].map((lbl, i) => {
                  const d = new Date()
                  d.setDate(d.getDate() - d.getDay() + checkinWkOffset * 7 + i)
                  const key = d.toISOString().slice(0, 10)
                  const ci = checkins[key]
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ fontSize: '8px', color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{lbl}</div>
                      <div title={ci ? ci.intention || ci.mood : 'Sem registro'} style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1.5px solid ${ci ? 'var(--gold)' : 'var(--border)'}`, background: ci ? 'rgba(201,169,110,.2)' : 'var(--warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>{ci ? ci.mood || '·' : '·'}</div>
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* COL 3 — Habits */}
        <div className="dash-col">
          <Card>
            <CardHeader title="📅 Hábitos da Semana" />
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '7px 12px', background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: '3px' }}>
                <span style={{ fontSize: '9px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>{wkLabel(habitWkOffset)}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => changeHabitWk(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--bronze)', cursor: 'pointer', fontSize: '15px' }}>‹</button>
                  <button onClick={() => changeHabitWk(1)} style={{ background: 'transparent', border: 'none', color: 'var(--bronze)', cursor: 'pointer', fontSize: '15px' }}>›</button>
                </div>
              </div>
              {habits.map(h => {
                const logs = habitLogs.filter(l => l.habit_id === h.id)
                return (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--mocha)', width: '110px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</div>
                    <div style={{ display: 'flex', gap: '3px', flex: 1 }}>
                      {['D','S','T','Q','Q','S','S'].map((lbl, i) => {
                        const checked = logs.some(l => l.day_index === i)
                        return (
                          <div key={i} onClick={() => toggleHabit(h.id, i)} style={{ width: '22px', height: '22px', borderRadius: '2px', border: `1.5px solid ${checked ? 'var(--bronze)' : 'var(--border)'}`, background: checked ? 'var(--bronze)' : 'var(--warm)', cursor: 'pointer', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: checked ? '#fff' : 'var(--muted)', transition: 'all .15s' }}>{lbl}</div>
                        )
                      })}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--muted)', width: '22px', textAlign: 'right' }}>{logs.length}/7</div>
                  </div>
                )
              })}
              <GhostBtn onClick={async () => {
                const name = prompt('Nome do hábito:')
                if (!name) return
                const { data } = await supabase.from('habits').insert({ user_id: user.id, name }).select().single()
                if (data) setHabits(prev => [...prev, data])
              }}>+ Novo hábito</GhostBtn>
            </CardBody>
          </Card>
        </div>

      </div>
    </div>
  )
}