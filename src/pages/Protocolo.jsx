import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const CADERNOS = [
  {
    title: 'Quem eu era antes do Protocolo',
    intro: 'Antes deste portal, eu me via a partir das histórias que me contaram.\nEu acreditava que precisava me esforçar, provar, merecer.\nEu carregava crenças, identidades e expectativas que não eram minhas.\nMuitas vezes vivi mais como reação à escassez do que como expressão da abundância.\nMas tudo isso foi apenas o ponto de partida — o contraste que me trouxe até aqui.',
    prompts: ['Como você se via antes de entrar no Protocolo?', 'Quais padrões, emoções ou comportamentos você reconhece que vinham da sua antiga identidade?'],
    isQuestions: false,
  },
  {
    title: 'Quem eu estou me tornando',
    intro: 'Agora, estou me tornando uma mulher consciente do meu poder.\nUma mulher que não espera o momento perfeito — ela cria o momento.\nQue sabe que a prosperidade não é conquista, é consequência.\nEstou me tornando a mulher que confia na intuição, honra o corpo, lidera com alma e se posiciona com verdade.\nCada escolha me aproxima dela.',
    prompts: ['Quais aspectos da sua nova versão você já percebe emergindo?', 'Quais atitudes estão mudando?', 'Como você sente essa nova energia no seu corpo e nas suas ações?'],
    isQuestions: false,
  },
  {
    title: 'Como é a minha nova identidade',
    intro: 'A minha nova identidade é expansiva.\nEla é segura, próspera, magnética e coerente.\nEla não se compara, ela inspira.\nEla não corre atrás, ela atrai.\nEla tem clareza, fala com poder, vende com verdade e vive com prazer.\nEssa identidade carrega a frequência da mulher que decidiu ser milionária em consciência, energia e propósito.',
    prompts: ['Como ela pensa?', 'Como ela se veste, se expressa, se move?', 'Como ela lida com o dinheiro, com o tempo, com as pessoas?', 'Como ela se comporta quando algo dá errado?'],
    isQuestions: false,
  },
  {
    title: 'Quais comportamentos eu escolho abandonar',
    intro: 'Eu escolho abandonar o drama.\nEu escolho abandonar o medo do julgamento.\nEu escolho abandonar o perfeccionismo disfarçado de controle.\nEu escolho abandonar a necessidade de aprovação.\nEu escolho abandonar a pressa, a dúvida e o medo de ser grande demais.',
    prompts: ['Liste os comportamentos, atitudes ou pensamentos que você está pronta para deixar para trás.', 'Eles foram úteis no passado, mas não te servem mais agora. Agradeça e solte.'],
    isQuestions: false,
  },
  {
    title: 'Minhas novas escolhas energéticas',
    intro: 'Eu escolho a leveza.\nEu escolho ser guiada pela intuição.\nEu escolho ter prazer em receber.\nEu escolho criar a partir do meu centro, não da comparação.\nEu escolho o luxo da paz, a abundância do tempo e o poder da presença.\nEu escolho ser o canal da minha própria prosperidade.',
    prompts: ['Quais emoções você quer sentir com frequência?', 'Quais vibrações representam a sua nova versão?', 'Quais energias você quer ancorar diariamente?'],
    isQuestions: false,
  },
  {
    title: 'Minhas perguntas de poder',
    intro: 'Essas perguntas são chaves energéticas.\nElas não pedem respostas racionais — elas abrem portais.\nUse-as sempre que sentir que está voltando para o antigo padrão, ou quando quiser ativar a energia da sua nova identidade.\n\nRespira… e pergunta.',
    prompts: [
      'Quem eu posso ser agora que muda completamente a minha realidade financeira?',
      'Que energia, espaço e consciência eu posso ser para encarnar a minha versão milionária com total facilidade?',
      'O que eu sei sobre prosperidade que o mundo ainda não reconheceu?',
      'O que eu posso escolher hoje que cria mais expansão, prazer e riqueza na minha vida?',
      'Como seria a minha realidade se eu simplesmente permitisse que fosse fácil?',
      'O que o dinheiro está querendo me mostrar sobre mim mesma agora?',
      'Como posso me ver com os olhos da minha versão mais próspera?',
      'Que energia eu posso emanar hoje para que o dinheiro, as oportunidades e os clientes me encontrem com naturalidade?',
      'O que se requer para eu ser o campo que magnetiza tudo o que eu desejo — sem esforço?',
      'Quem eu sou quando me lembro de que eu sou a fonte de tudo?',
    ],
    isQuestions: true,
  },
]

export default function Protocolo() {
  const { user } = useAuth()
  const [active, setActive] = useState(0)
  const [texts, setTexts] = useState(Array(6).fill(''))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data } = await supabase.from('cadernos').select('*').eq('user_id', user.id)
    if (data && data.length > 0) {
      const arr = Array(6).fill('')
      data.forEach(d => { arr[d.index] = d.content || '' })
      setTexts(arr)
    }
    setLoading(false)
  }

  async function saveText(index, value) {
    const newTexts = [...texts]
    newTexts[index] = value
    setTexts(newTexts)
    setSaving(true)
    await supabase.from('cadernos').upsert(
      { user_id: user.id, index, content: value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,index' }
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const c = CADERNOS[active]
  const wc = texts[active].trim() ? texts[active].trim().split(/\s+/).length : 0

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Carregando...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '22px', paddingBottom: '18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '8.5px', letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '3px' }}>Jornada de Identidade</div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '26px', fontWeight: 700, color: 'var(--mocha)' }}>Protocolo</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {CADERNOS.map((cad, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: '7px 14px', border: `1px solid ${active === i ? 'var(--mocha)' : 'var(--border)'}`,
            borderRadius: '3px', background: active === i ? 'var(--mocha)' : 'transparent',
            color: active === i ? 'var(--gold)' : 'var(--muted)',
            fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '.1em', cursor: 'pointer',
            transition: 'all .2s',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {texts[i].trim().length > 0 && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: active === i ? 'var(--gold)' : 'var(--sage)', flexShrink: 0 }} />}
            {['Quem eu era', 'Quem me torno', 'Nova Identidade', 'Abandonar', 'Novas Escolhas', 'Perguntas de Poder'][i]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Left — intro card */}
        <div style={{ background: 'linear-gradient(135deg,var(--mocha),#3A2518)', borderRadius: '4px', border: '1px solid rgba(201,169,110,.1)', padding: '20px', position: 'sticky', top: '20px' }}>
          <div style={{ fontFamily: 'var(--prose)', fontSize: '13px', lineHeight: 1.9, color: 'rgba(245,240,232,.7)', fontStyle: 'italic', fontWeight: 300, whiteSpace: 'pre-line', marginBottom: '16px' }}>
            {c.intro}
          </div>
          <div style={{ borderTop: '1px solid rgba(201,169,110,.15)', paddingTop: '14px' }}>
            <div style={{ fontSize: '8.5px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(201,169,110,.5)', marginBottom: '10px' }}>
              {c.isQuestions ? '✨ Perguntas de Poder' : '✨ Escreva'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {c.prompts.map((p, i) => (
                <div key={i} style={{ fontFamily: 'var(--prose)', fontSize: '12px', color: 'rgba(245,240,232,.55)', lineHeight: 1.6, display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--gold)', flexShrink: 0, fontSize: '10px', marginTop: '2px' }}>✦</span>
                  <span style={{ fontStyle: c.isQuestions ? 'italic' : 'normal' }}>{p}</span>
                </div>
              ))}
            </div>
            {c.isQuestions && (
              <div style={{ marginTop: '14px', fontFamily: 'var(--prose)', fontSize: '11px', color: 'rgba(245,240,232,.35)', fontStyle: 'italic', lineHeight: 1.6 }}>
                Essas perguntas não são para responder — são para vibrar. Permita que elas ecoem no seu campo.
              </div>
            )}
          </div>
        </div>

        {/* Right — editor */}
        <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '15px', fontWeight: 700, color: 'var(--mocha)' }}>{c.title}</div>
            <div style={{ fontSize: '9px', color: saving ? 'var(--bronze)' : saved ? 'var(--sage)' : 'var(--muted)', letterSpacing: '.1em', fontStyle: 'italic' }}>
              {saving ? 'salvando...' : saved ? '✓ salvo' : `${wc} palavras`}
            </div>
          </div>
          <textarea
            value={texts[active]}
            onChange={e => saveText(active, e.target.value)}
            placeholder="Escreva livremente aqui..."
            style={{ width: '100%', minHeight: '400px', padding: '24px', border: 'none', background: 'transparent', fontFamily: 'var(--prose)', fontSize: '16px', lineHeight: 2, color: 'var(--mocha)', resize: 'none', outline: 'none' }}
          />
          {/* Progress indicator */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div style={{ fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '.1em', marginRight: '4px' }}>Progresso dos cadernos:</div>
            {CADERNOS.map((_, i) => (
              <div key={i} onClick={() => setActive(i)} title={['Quem eu era','Quem me torno','Nova Identidade','Abandonar','Novas Escolhas','Perguntas de Poder'][i]}
                style={{ width: '28px', height: '4px', borderRadius: '2px', background: texts[i].trim().length > 0 ? 'var(--bronze)' : 'var(--border)', cursor: 'pointer', transition: 'all .2s', opacity: active === i ? 1 : .7 }} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}