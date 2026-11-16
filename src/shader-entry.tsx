import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ShaderAnimation } from '@/components/ui/shader-animation'
import './styles.css'

function ConsoleShader() {
  // Read-only projection of the showcase controller in script.js.
  const [view, setView] = useState({ paused: true, variant: 0 })
  useEffect(() => {
    const desk = document.querySelector<HTMLElement>('.workbench')
    if (!desk) return
    const update = () => setView({ paused: desk.dataset.running !== 'true', variant: ['models', 'data', 'software'].indexOf(desk.dataset.mode || 'models') })
    const observer = new MutationObserver(update)
    observer.observe(desk, { attributes: true, attributeFilter: ['data-mode', 'data-running'] })
    update()
    return () => observer.disconnect()
  }, [])
  return <div className="console-visual" aria-hidden="true">
    <ShaderAnimation className="console-shader" palette="amber" paused={view.paused} variant={view.variant} />
    <div className="console-diagram">
      {view.variant === 0 ? <><div className="classification-grid">{Array.from({ length: 24 }, (_, i) => <i key={i} className={i % 3 ? 'classified' : ''} />)}</div><span>TEXT<br />↓<br /><strong>RNN / BiGRU</strong><br />↓<br />SENTIMENT</span></> :
        view.variant === 1 ? <><div className="diagram-records"><i /><i /><i /><i /></div><span>→</span><div className="diagram-bars"><i /><i /><i /><i /></div></> :
          <><span className="diagram-node">REQUEST</span><span>→</span><span className="diagram-node">SERVER</span><span>→</span><span className="diagram-node">REPLY</span></>}
    </div>
  </div>
}

const mount = document.getElementById('shader-root')
if (mount) createRoot(mount).render(<ConsoleShader />)
