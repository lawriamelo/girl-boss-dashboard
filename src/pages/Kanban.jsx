import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const COLS = [
  { key: 'todo', label: 'A Fazer', dot: '#B09080' },
  { key: 'doing', label: 'Em Andamento', dot: '#C9A96E' },
  { key: 'done', label: 'Concluído', dot: '#7D8C75' },
]

export default function Kanban() {
  const { user } = useAuth()
  const [cards, setCards] = useState([])
  const [inputs, setInputs] = useState({ todo: { text: '', tag: '' }, doing: { text: '', tag: '' }, done: { text: '', tag: '' } })
  const [showing, setShowing] = useState({ todo: false, doing: false, done: false })
  const [menuOpen, setMenuOpen] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [loading, setLoading] = useState(true)
  const dragCard = useRef(null)

  useEffect(() => { if (user) load() }, [user])
  useEffect(() => {
    function handleClick() { setMenuOpen(null) }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  async function load() {
    const { data } = await supabase.from('kanban_cards').select('*').eq('user_id', user.id).order('sort_order')
    if (data && data.length > 0) {
      setCards(data)
    } else {
      const defaults = [
        { user_id: user.id, column_key: 'todo', text: 'Gravar vídeo de depoimento', tag: 'Conteúdo', sort_order: 0 },
        { user_id: user.id, column_key: 'todo', text: 'Definir oferta da semana', tag: 'Vendas', sort_order: 1 },
        { user_id: user.id, column_key: 'doing', text: 'Responder DMs pendentes', tag: 'Relacionamento', sort_order: 0 },
        { user_id: user.id, column_key: 'done', text: 'Criar stories de bastidor', tag: 'Conteúdo', sort_order: 0 },
      ]
      const { data: inserted } = await supabase.from('kanban_cards').insert(defaults).select()
      setCards(inserted || [])
    }
    setLoading(false)
  }

  async function addCard(col) {
    const text = inputs[col].text.trim()
    if (!text) return
    const tag = inputs[col].tag.trim()
    const colCards = cards.filter(c => c.column_key === col)
    const { data } = await supabase.from('kanban_cards').insert({ user_id: user.id, column_key: col, text, tag, sort_order: colCards.length }).select().single()
    if (data) setCards(prev => [...prev, data])
    setInputs(prev => ({ ...prev, [col]: { text: '', tag: '' } }))
    setShowing(prev => ({ ...prev, [col]: false }))
  }

  async function deleteCard(id) {
    await supabase.from('kanban_cards').delete().eq('id', id)
    setCards(prev => prev.filter(c => c.id !== id))
    setMenuOpen(null)
  }

  async function moveCard(card, newCol) {
    const { data } = await supabase.from('kanban_cards').update({ column_key: newCol }).eq('id', card.id).select().single()
    if (data) setCards(prev => prev.map(c => c.id === card.id ? data : c))
    setMenuOpen(null)
  }

  async function updateTag(card, newTag) {
    const { data } = await supabase.from('kanban_cards').update({ tag: newTag }).eq('id', card.id).select().single()
    if (data) setCards(prev => prev.map(c => c.id === card.id ? data : c))
  }

  // DRAG AND DROP
  function onDragStart(e, card) {
    dragCard.current = card
    e.dataTransfer.effectAllowed = 'move'
    e.currentTarget.style.opacity = '0.4'
  }

  function onDragEnd(e) {
    e.currentTarget.style.opacity = '1'
    dragCard.current = null
    setDragOver(null)
  }

  function onDragOver(e, colKey) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(colKey)
  }

  function onDrop(e, colKey) {
    e.preventDefault()
    setDragOver(null)
    if (!dragCard.current) return
    if (dragCard.current.column_key === colKey) return
    moveCard(dragCard.current, colKey)
  }

  // TOUCH (mobile)
  const touchCard = useRef(null)
  const touchClone = useRef(null)

  function onTouchStart(e, card) {
    touchCard.current = card
    const el = e.currentTarget
    const clone = el.cloneNode(true)
    clone.style.position = 'fixed'
    clone.style.opacity = '0.7'
    clone.style.pointerEvents = 'none'
    clone.style.width = el.offsetWidth + 'px'
    clone.style.zIndex = 1000
    clone.style.boxShadow = '0 8px 24px rgba(44,31,20,.2)'
    document.body.appendChild(clone)
    touchClone.current = clone
    el.style.opacity = '0.3'
  }

  function onTouchMove(e) {
    if (!touchClone.current) return
    const touch = e.touches[0]
    touchClone.current.style.left = (touch.clientX - 60) + 'px'
    touchClone.current.style.top = (touch.clientY - 30) + 'px'
    // highlight column under finger
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const col = el?.closest('[data-col]')?.getAttribute('data-col')
    setDragOver(col || null)
  }

  function onTouchEnd(e) {
    if (touchClone.current) { document.body.removeChild(touchClone.current); touchClone.current = null }
    document.querySelectorAll('[data-card-id]').forEach(el => el.style.opacity = '1')
    if (touchCard.current && dragOver && dragOver !== touchCard.current.column_key) {
      moveCard(touchCard.current, dragOver)
    }
    touchCard.current = null
    setDragOver(null)
  }

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Carregando...</div>

  return (
    <div>
      <div style={{ marginBottom: '22px', paddingBottom: '18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '8.5px', letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '3px' }}>Quadro de Tarefas</div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '26px', fontWeight: 700, color: 'var(--mocha)' }}>Kanban</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
        {COLS.map(col => {
          const colCards = cards.filter(c => c.column_key === col.key)
          const isOver = dragOver === col.key
          return (
            <div
              key={col.key}
              data-col={col.key}
              onDragOver={e => onDragOver(e, col.key)}
              onDrop={e => onDrop(e, col.key)}
              onDragLeave={() => setDragOver(null)}
              style={{
                background: isOver ? 'rgba(201,169,110,.08)' : 'var(--warm)',
                border: `1px solid ${isOver ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: '4px', padding: '14px', minHeight: '220px',
                transition: 'all .15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '8.5px', letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: col.dot, flexShrink: 0 }} />
                {col.label}
                <span style={{ marginLeft: 'auto', opacity: .5 }}>{colCards.length}</span>
              </div>

              {colCards.map(card => (
                <div
                  key={card.id}
                  data-card-id={card.id}
                  draggable
                  onDragStart={e => onDragStart(e, card)}
                  onDragEnd={onDragEnd}
                  onTouchStart={e => onTouchStart(e, card)}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '3px', padding: '10px 12px', fontSize: '11px', color: 'var(--mocha)', marginBottom: '7px', lineHeight: 1.5, position: 'relative', cursor: 'grab', userSelect: 'none' }}
                >
                  <div style={{ paddingRight: '20px' }}>{card.text}</div>
                  <input
                    defaultValue={card.tag || ''}
                    onBlur={e => updateTag(card, e.target.value)}
                    placeholder="+ tag"
                    style={{ marginTop: '6px', border: 'none', background: 'transparent', fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', outline: 'none', width: '100%', cursor: 'text' }}
                  />
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === card.id ? null : card.id) }}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '13px', lineHeight: 1, padding: '0 2px' }}
                  >⋯</button>

                  {menuOpen === card.id && (
                    <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '28px', right: '8px', background: '#fff', border: '1px solid var(--border)', borderRadius: '3px', boxShadow: '0 4px 16px rgba(44,31,20,.12)', zIndex: 10, minWidth: '140px', overflow: 'hidden' }}>
                      <div style={{ fontSize: '8px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', padding: '8px 12px 4px' }}>Mover para</div>
                      {COLS.filter(c => c.key !== col.key).map(target => (
                        <div key={target.key} onClick={() => moveCard(card, target.key)}
                          style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--mocha)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--warm)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: target.dot, flexShrink: 0 }} />
                          {target.label}
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid var(--border)' }}>
                        <div onClick={() => deleteCard(card.id)}
                          style={{ padding: '8px 12px', fontSize: '11px', color: '#b07070', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--warm)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >Excluir</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {showing[col.key] ? (
                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <input
                    value={inputs[col.key].text}
                    onChange={e => setInputs(prev => ({ ...prev, [col.key]: { ...prev[col.key], text: e.target.value } }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addCard(col.key)
                      if (e.key === 'Escape') setShowing(prev => ({ ...prev, [col.key]: false }))
                    }}
                    placeholder="Nova tarefa..."
                    autoFocus
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--gold)', borderRadius: '3px', background: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--mocha)', outline: 'none' }}
                  />
                  <input
                    value={inputs[col.key].tag}
                    onChange={e => setInputs(prev => ({ ...prev, [col.key]: { ...prev[col.key], tag: e.target.value } }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addCard(col.key)
                      if (e.key === 'Escape') setShowing(prev => ({ ...prev, [col.key]: false }))
                    }}
                    placeholder="Tag (opcional)..."
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '3px', background: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', outline: 'none', textTransform: 'uppercase', letterSpacing: '.08em' }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => addCard(col.key)} style={{ flex: 1, padding: '7px', background: 'var(--mocha)', color: 'var(--gold)', border: 'none', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.1em', cursor: 'pointer' }}>Adicionar</button>
                    <button onClick={() => setShowing(prev => ({ ...prev, [col.key]: false }))} style={{ padding: '7px 12px', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '9px', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowing(prev => ({ ...prev, [col.key]: true }))} style={{ width: '100%', padding: '9px 12px', border: '1px dashed var(--border)', borderRadius: '3px', background: 'transparent', fontSize: '10px', color: 'var(--muted)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--mono)', marginTop: '6px' }}>+ Adicionar</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}