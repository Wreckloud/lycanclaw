import { logError } from '../../utils/logger'

export interface ParticleBurstRequest {
  x: number
  y: number
  comboCount: number
  colors: readonly string[]
}

export interface EncourageParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  rotation: number
  rotationSpeed: number
  createdAt: number
  duration: number
}

const PARTICLE_CANVAS_CLASS = 'particle-canvas'
const MOBILE_BREAKPOINT = 768
const DESKTOP_MAX_PARTICLES = 360
const MOBILE_MAX_PARTICLES = 140
const MAX_BURST_QUEUE = 36
const DESKTOP_BURSTS_PER_FRAME = 3
const MOBILE_BURSTS_PER_FRAME = 2
const FRAME_BUDGET_MS = 16

let canvas: HTMLCanvasElement | null = null
let context: CanvasRenderingContext2D | null = null
let animationFrameId: number | null = null
let particles: EncourageParticle[] = []
let burstQueue: ParticleBurstRequest[] = []
let performanceScale = 1
let slowFrameStreak = 0

export function queueEncourageParticleBurst(request: ParticleBurstRequest): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (document.visibilityState === 'hidden') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  burstQueue.push(request)
  if (burstQueue.length > MAX_BURST_QUEUE) {
    burstQueue = burstQueue.slice(-MAX_BURST_QUEUE)
  }

  ensureCanvas()
  startAnimation()
}

export function disposeEncourageParticles(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  burstQueue = []
  particles = []
  context = null
  canvas?.remove()
  canvas = null
}

function ensureCanvas(): void {
  if (canvas && context) {
    resizeCanvasIfNeeded()
    return
  }

  canvas = document.createElement('canvas')
  context = canvas.getContext('2d')

  if (!context) {
    logError('EncourageParticles', '无法创建 Canvas 上下文')
    canvas = null
    return
  }

  canvas.className = PARTICLE_CANVAS_CLASS
  canvas.style.position = 'fixed'
  canvas.style.left = '0'
  canvas.style.top = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '9999'
  document.body.appendChild(canvas)
  resizeCanvasIfNeeded()
}

function startAnimation(): void {
  if (animationFrameId !== null || !canvas || !context) return
  animationFrameId = requestAnimationFrame(animate)
}

function animate(now: number): void {
  animationFrameId = null
  if (!canvas || !context) return

  const frameStart = performance.now()
  resizeCanvasIfNeeded()
  consumeBurstQueue(now)
  renderParticles(now)
  trimParticles()
  updatePerformanceScale(performance.now() - frameStart)

  if (particles.length > 0 || burstQueue.length > 0) {
    animationFrameId = requestAnimationFrame(animate)
    return
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
}

function consumeBurstQueue(now: number): void {
  const isMobile = isMobileViewport()
  const maxBursts = isMobile ? MOBILE_BURSTS_PER_FRAME : DESKTOP_BURSTS_PER_FRAME

  for (let i = 0; i < maxBursts && burstQueue.length > 0; i += 1) {
    const request = burstQueue.shift()
    if (request) addParticles(request, now)
  }
}

function addParticles(request: ParticleBurstRequest, now: number): void {
  const count = getParticleCount(request.comboCount, isMobileViewport())

  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2
    const velocity = Math.random() * 2.5 + 1.8

    particles.push({
      x: request.x,
      y: request.y,
      vx: Math.cos(angle) * velocity,
      vy: (Math.sin(angle) * velocity) - 2,
      size: Math.random() * 6 + 4,
      color: pickColor(request.colors),
      alpha: 1,
      rotation: 0,
      rotationSpeed: (Math.random() * 0.8 - 0.4) * Math.PI / 180 * 12,
      createdAt: now,
      duration: 1300
    })
  }
}

function renderParticles(now: number): void {
  if (!canvas || !context) return
  context.clearRect(0, 0, canvas.width, canvas.height)

  particles = particles.filter((particle) => {
    const elapsed = now - particle.createdAt
    if (elapsed >= particle.duration) return false

    particle.x += particle.vx
    particle.y += particle.vy
    particle.vy += 0.08
    particle.vx *= 0.99
    particle.rotation += particle.rotationSpeed

    const progress = elapsed / particle.duration
    particle.alpha = 1 - Math.pow(progress, 1.5)

    context!.globalAlpha = particle.alpha
    context!.save()
    context!.translate(particle.x, particle.y)
    context!.rotate(particle.rotation)
    drawStar(context!, 0, 0, particle.size, particle.color)
    context!.restore()
    context!.globalAlpha = 1

    return true
  })
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.save()
  ctx.beginPath()
  ctx.fillStyle = color

  const spikes = 5
  const outerRadius = size
  const innerRadius = size * 0.4

  for (let i = 0; i < spikes * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (Math.PI * i) / spikes - Math.PI / 2
    const pointX = x + Math.cos(angle) * radius
    const pointY = y + Math.sin(angle) * radius

    if (i === 0) {
      ctx.moveTo(pointX, pointY)
    } else {
      ctx.lineTo(pointX, pointY)
    }
  }

  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function getParticleCount(comboCount: number, isMobile: boolean): number {
  const min = isMobile ? 1 : 2
  const max = isMobile ? 24 : 36
  const growthProgress = Math.min(1, Math.pow(Math.max(1, comboCount) / 300, 0.72))
  const scaled = Math.floor((min + ((max - min) * growthProgress)) * performanceScale)

  return clamp(scaled, min, max)
}

function trimParticles(): void {
  const maxParticles = isMobileViewport() ? MOBILE_MAX_PARTICLES : DESKTOP_MAX_PARTICLES
  if (particles.length <= maxParticles) return

  particles.sort((left, right) => (left.alpha - right.alpha) || (left.createdAt - right.createdAt))
  particles = particles.slice(particles.length - maxParticles)
}

function resizeCanvasIfNeeded(): void {
  if (!canvas) return
  const width = window.innerWidth
  const height = window.innerHeight
  if (canvas.width === width && canvas.height === height) return

  canvas.width = width
  canvas.height = height
}

function updatePerformanceScale(frameCostMs: number): void {
  if (frameCostMs > FRAME_BUDGET_MS) {
    slowFrameStreak += 1
  } else {
    slowFrameStreak = Math.max(0, slowFrameStreak - 1)
  }

  if (slowFrameStreak >= 4) {
    performanceScale = Math.max(0.55, performanceScale - 0.1)
    slowFrameStreak = 0
  } else if (frameCostMs < FRAME_BUDGET_MS * 0.55) {
    performanceScale = Math.min(1, performanceScale + 0.02)
  }
}

function pickColor(colors: readonly string[]): string {
  return colors[Math.floor(Math.random() * colors.length)] ?? '#10b981'
}

function isMobileViewport(): boolean {
  return window.innerWidth <= MOBILE_BREAKPOINT
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
