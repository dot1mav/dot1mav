// ================================================
// Particle Effects & Cursor Trail (client-only)
// ================================================

// Pause all animation loops when the tab is hidden to save CPU/GPU.
let animationsPaused = false
let resumeCallbacks = []
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    animationsPaused = true
  } else {
    animationsPaused = false
    resumeCallbacks.forEach((cb) => cb())
    resumeCallbacks = []
  }
})

// Reduce particle count on low-end devices (detected via
// navigator.hardwareConcurrency or low memory).
function getParticleScale() {
  if (typeof navigator === 'undefined') return 1
  const cores = navigator.hardwareConcurrency || 4
  if (cores <= 2) return 0.3
  if (cores <= 4) return 0.5
  return 1
}

const PARTICLE_SCALE = getParticleScale()

class ParticleEffect {
  constructor() {
    this.particles = []
    this.canvas = null
    this.ctx = null
    this.init()
  }

  init() {
    this.canvas = document.createElement('canvas')
    this.canvas.id = 'particle-canvas'
    this.canvas.style.position = 'fixed'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.pointerEvents = 'none'
    this.canvas.style.zIndex = '9999'
    document.body.appendChild(this.canvas)

    this.ctx = this.canvas.getContext('2d')
    this.resize()
    window.addEventListener('resize', () => this.resize())
    this.animate()
  }

  resize() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  createParticle(x, y, color = null) {
    const colors = color
      ? [color]
      : [
          '#00ff00',
          '#00ffff',
          '#ff00ff',
          '#ffff00',
          '#ff6b6b',
          '#4ecdc4',
          '#45b7d1',
        ]
    const count = Math.max(1, Math.floor((Math.random() * 5 + 3) * PARTICLE_SCALE))

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        decay: Math.random() * 0.015 + 0.01,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }
  }

  createBurst(x, y, count = 20) {
    const scaledCount = Math.max(3, Math.floor(count * PARTICLE_SCALE))
    for (let i = 0; i < scaledCount; i++) {
      const angle = (Math.PI * 2 * i) / scaledCount
      const speed = Math.random() * 3 + 2
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: Math.random() * 0.02 + 0.015,
        size: Math.random() * 5 + 3,
        color: `hsl(${Math.random() * 360}, 100%, 60%)`,
      })
    }
  }

  animate() {
    if (animationsPaused) {
      requestAnimationFrame(() => this.animate())
      return
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]

      p.x += p.vx
      p.y += p.vy
      p.vy += 0.1 // gravity
      p.life -= p.decay

      if (p.life <= 0) {
        this.particles.splice(i, 1)
        continue
      }

      this.ctx.save()
      this.ctx.globalAlpha = p.life
      this.ctx.fillStyle = p.color
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      this.ctx.fill()
      this.ctx.restore()
    }

    requestAnimationFrame(() => this.animate())
  }
}

class CursorTrail {
  constructor() {
    this.trails = []
    this.canvas = null
    this.ctx = null
    this.mouseX = 0
    this.mouseY = 0
    this.init()
  }

  init() {
    this.canvas = document.createElement('canvas')
    this.canvas.id = 'cursor-canvas'
    this.canvas.style.position = 'fixed'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.pointerEvents = 'none'
    this.canvas.style.zIndex = '9998'
    document.body.appendChild(this.canvas)

    this.ctx = this.canvas.getContext('2d')
    this.resize()
    window.addEventListener('resize', () => this.resize())

    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX
      this.mouseY = e.clientY
      this.addTrail(e.clientX, e.clientY)
    })

    this.animate()
  }

  resize() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  addTrail(x, y) {
    this.trails.push({
      x: x,
      y: y,
      life: 1,
      size: 8,
    })

    if (this.trails.length > 20) {
      this.trails.shift()
    }
  }

  animate() {
    if (animationsPaused) {
      requestAnimationFrame(() => this.animate())
      return
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    for (let i = 0; i < this.trails.length; i++) {
      const trail = this.trails[i]
      trail.life -= 0.05

      if (trail.life <= 0) {
        this.trails.splice(i, 1)
        i--
        continue
      }

      const gradient = this.ctx.createRadialGradient(
        trail.x,
        trail.y,
        0,
        trail.x,
        trail.y,
        trail.size
      )
      gradient.addColorStop(0, `rgba(0, 123, 255, ${trail.life * 0.5})`)
      gradient.addColorStop(1, 'rgba(0, 123, 255, 0)')

      this.ctx.fillStyle = gradient
      this.ctx.beginPath()
      this.ctx.arc(trail.x, trail.y, trail.size * trail.life, 0, Math.PI * 2)
      this.ctx.fill()
    }

    requestAnimationFrame(() => this.animate())
  }
}

// Ripple effect on click
class RippleEffect {
  constructor() {
    this.ripples = []
    this.canvas = null
    this.ctx = null
    this.init()
  }

  init() {
    this.canvas = document.createElement('canvas')
    this.canvas.id = 'ripple-canvas'
    this.canvas.style.position = 'fixed'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.pointerEvents = 'none'
    this.canvas.style.zIndex = '9997'
    document.body.appendChild(this.canvas)

    this.ctx = this.canvas.getContext('2d')
    this.resize()
    window.addEventListener('resize', () => this.resize())

    document.addEventListener('click', (e) => {
      this.createRipple(e.clientX, e.clientY)
    })

    this.animate()
  }

  resize() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  createRipple(x, y) {
    this.ripples.push({
      x: x,
      y: y,
      radius: 0,
      maxRadius: 100,
      alpha: 1,
    })
  }

  animate() {
    if (animationsPaused) {
      requestAnimationFrame(() => this.animate())
      return
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i]

      ripple.radius += 3
      ripple.alpha -= 0.02

      if (ripple.alpha <= 0 || ripple.radius >= ripple.maxRadius) {
        this.ripples.splice(i, 1)
        continue
      }

      this.ctx.save()
      this.ctx.globalAlpha = ripple.alpha
      this.ctx.strokeStyle = '#00aaff'
      this.ctx.lineWidth = 3
      this.ctx.beginPath()
      this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2)
      this.ctx.stroke()
      this.ctx.restore()
    }

    requestAnimationFrame(() => this.animate())
  }
}

export default defineNuxtPlugin(() => {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  if (prefersReducedMotion) return

  const particleEffect = new ParticleEffect()
  const cursorTrail = new CursorTrail()
  const rippleEffect = new RippleEffect()

  // Add particle burst on window open
  document.addEventListener('click', (e) => {
    const target = e.target

    // Check if clicked on icon
    if (target.closest('.icon')) {
      particleEffect.createBurst(e.clientX, e.clientY, 15)
    }

    // Check if clicked on button
    if (
      target.closest('button') ||
      target.closest('.btn-primary') ||
      target.closest('.btn-toggle')
    ) {
      particleEffect.createParticle(e.clientX, e.clientY)
    }

    // Check if clicked on skill tag
    if (target.closest('.skill-tag') || target.closest('.tech-tag')) {
      particleEffect.createParticle(e.clientX, e.clientY, '#00aaff')
    }

    // Check if clicked on cert card
    if (target.closest('.cert-card')) {
      particleEffect.createParticle(e.clientX, e.clientY, '#ffd700')
    }
  })

  // Add hover effects
  document.addEventListener('mouseover', (e) => {
    const target = e.target

    // Sparkle on icon hover
    if (target.closest('.icon')) {
      const rect = target.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      particleEffect.createParticle(x, y)
    }
  })

  // Expose to global scope for compatibility
  window.particleEffect = particleEffect
})
