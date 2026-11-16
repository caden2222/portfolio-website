import { useState } from 'react'
import { ShaderAnimation } from '@/components/ui/shader-animation'

export default function DemoOne() {
  const [paused, setPaused] = useState(false)
  return (
    <div>
      <div className="relative flex h-[650px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border bg-blue-700">
        <ShaderAnimation paused={paused} />
        <span className="pointer-events-none absolute z-10 whitespace-pre-wrap text-center text-7xl font-semibold leading-none tracking-tighter text-white">
          Shader Animation
        </span>
      </div>
      <button onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? 'Resume motion' : 'Pause motion'}</button>
    </div>
  )
}
