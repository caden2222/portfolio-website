"use client"

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { cn } from '@/lib/utils'

export interface ShaderAnimationProps {
  className?: string
  paused?: boolean
  /** RGB preserves the supplied demo; amber fits the portfolio console. */
  palette?: 'rgb' | 'amber'
  variant?: number
}

// Original full-screen plane and concentric shader from the supplied component.
const vertexShader = `
  void main() { gl_Position = vec4(position, 1.0); }
`
const fragmentShader = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform float amber;
  uniform float variant;
  void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    uv *= 1.0 + variant * 0.12;
    float t = time * 0.05;
    float lineWidth = 0.002;
    vec3 color = vec3(0.0);
    for (int j = 0; j < 3; j++) {
      for (int i = 0; i < 5; i++) {
        float distance = abs(fract(t - 0.01 * float(j) + float(i) * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));
        color[j] += lineWidth * float(i * i) / max(distance, 0.001);
      }
    }
    vec3 warm = vec3(1.0, 0.745, 0.439) * (1.0 - exp(-color.r * 0.5));
    gl_FragColor = vec4(mix(color, warm, amber), 1.0);
  }
`

export function ShaderAnimation({ className, paused = false, palette = 'rgb', variant = 0 }: ShaderAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef({ paused, palette, variant })
  const syncRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    optionsRef.current = { paused, palette, variant }
    syncRef.current?.()
  }, [paused, palette, variant])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    // Probe first so unsupported devices get a quiet CSS fallback.
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2', { antialias: false, alpha: false })
    if (!context) { container.dataset.status = 'fallback'; return }
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false }) }
    catch { container.dataset.status = 'fallback'; return }

    const camera = new THREE.Camera()
    camera.position.z = 1
    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)
    const uniforms = {
      time: { value: 1 },
      resolution: { value: new THREE.Vector2(1, 1) },
      amber: { value: palette === 'amber' ? 1 : 0 },
      variant: { value: variant },
    }
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
    scene.add(new THREE.Mesh(geometry, material))
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    container.appendChild(canvas)
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, last = 0, visible = false, lost = false, disposed = false
    let hasSize = false
    const canAnimate = () => visible && hasSize && !document.hidden && !lost && !disposed && !optionsRef.current.paused && !reduced.matches
    const draw = () => {
      if (!hasSize || lost || disposed || !visible || document.hidden) return
      uniforms.amber.value = optionsRef.current.palette === 'amber' ? 1 : 0
      uniforms.variant.value = optionsRef.current.variant
      renderer.render(scene, camera)
      container.dataset.status = 'ready'
    }
    const animate = (now: number) => {
      frame = 0
      if (!canAnimate()) return
      // Time-based motion avoids speed changes on high-refresh displays.
      if (last) uniforms.time.value += Math.min((now - last) / 1000, 0.05) * 3
      last = now
      draw()
      frame = requestAnimationFrame(animate)
    }
    const sync = () => {
      cancelAnimationFrame(frame)
      frame = 0
      last = 0
      draw()
      const running = canAnimate()
      container.dataset.running = String(running)
      if (running) frame = requestAnimationFrame(animate)
    }
    syncRef.current = sync
    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      hasSize = width > 0 && height > 0
      if (hasSize) {
        renderer.setSize(container.clientWidth, container.clientHeight, false)
        renderer.getDrawingBufferSize(uniforms.resolution.value)
      }
      sync()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
    intersection.observe(container)
    const onLost = (event: Event) => {
      event.preventDefault()
      lost = true
      canvas.style.visibility = 'hidden'
      container.dataset.status = 'fallback'
      sync()
    }
    const onRestored = () => { lost = false; canvas.style.visibility = ''; resize() }
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)
    document.addEventListener('visibilitychange', sync)
    reduced.addEventListener('change', sync)
    resize()
    return () => {
      disposed = true
      syncRef.current = null
      cancelAnimationFrame(frame)
      observer.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', sync)
      reduced.removeEventListener('change', sync)
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    }
  }, [])

  return <div ref={containerRef} aria-hidden="true" className={cn('shader-surface h-full w-full', className)} data-status="initializing" data-variant={variant} />
}
