// ================================================
// Custom Cursor (client-only)
// Smooth dot + ring + trailing glow
// ================================================

class CustomCursor {
  constructor() {
    this.dot = null
    this.ring = null
    this.glow = null
    this.mouseX = 0
    this.mouseY = 0
    this.dotX = 0
    this.dotY = 0
    this.ringX = 0
    this.ringY = 0
    this.glowX = 0
    this.glowY = 0
    this.visible = false
    this.hovering = false
    this.clicking = false
    this.raf = null
    this.init()
  }

  init() {
    if (window.innerWidth <= 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    this.dot = document.createElement('div')
    this.dot.className = 'cursor-dot'
    document.body.appendChild(this.dot)

    this.ring = document.createElement('div')
    this.ring.className = 'cursor-ring'
    document.body.appendChild(this.ring)

    this.glow = document.createElement('div')
    this.glow.className = 'cursor-glow'
    document.body.appendChild(this.glow)

    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX
      this.mouseY = e.clientY
      if (!this.visible) {
        this.visible = true
        this.dotX = this.ringX = this.glowX = e.clientX
        this.dotY = this.ringY = this.glowY = e.clientY
        this.dot.classList.add('cursor-visible')
        this.ring.classList.add('cursor-visible')
        this.glow.classList.add('cursor-visible')
      }
    })

    document.addEventListener('mouseleave', () => {
      this.visible = false
      this.dot.classList.remove('cursor-visible')
      this.ring.classList.remove('cursor-visible')
      this.glow.classList.remove('cursor-visible')
    })

    document.addEventListener('mouseenter', () => {
      this.visible = true
      this.dot.classList.add('cursor-visible')
      this.ring.classList.add('cursor-visible')
      this.glow.classList.add('cursor-visible')
    })

    const interactive = 'a, button, .icon, .skill-tag, .tech-tag, .project-card, .cert-card, input, select, .btn-primary, .btn-toggle, .title-bar-controls button, .gallery-nav, .group-toggle'

    document.addEventListener('mouseover', (e) => {
      if (e.target.matches(interactive) || e.target.closest(interactive)) {
        this.hovering = true
        document.body.classList.add('cursor-hover')
      }
    })

    document.addEventListener('mouseout', (e) => {
      if (e.target.matches(interactive) || e.target.closest(interactive)) {
        this.hovering = false
        document.body.classList.remove('cursor-hover')
      }
    })

    document.addEventListener('mousedown', () => {
      this.clicking = true
      document.body.classList.add('cursor-click')
    })

    document.addEventListener('mouseup', () => {
      this.clicking = false
      document.body.classList.remove('cursor-click')
    })

    this.animate()
  }

  animate() {
    this.raf = requestAnimationFrame(() => this.animate())

    if (document.hidden) return

    const ease = (a, b, t) => a + (b - a) * t

    // Dot: snappy follow
    this.dotX = ease(this.dotX, this.mouseX, 0.35)
    this.dotY = ease(this.dotY, this.mouseY, 0.35)

    // Ring: smooth follow
    this.ringX = ease(this.ringX, this.mouseX, 0.18)
    this.ringY = ease(this.ringY, this.mouseY, 0.18)

    // Glow: slowest, ambient feel
    this.glowX = ease(this.glowX, this.mouseX, 0.08)
    this.glowY = ease(this.glowY, this.mouseY, 0.08)

    if (this.dot) {
      this.dot.style.left = this.dotX + 'px'
      this.dot.style.top = this.dotY + 'px'
    }
    if (this.ring) {
      this.ring.style.left = this.ringX + 'px'
      this.ring.style.top = this.ringY + 'px'
    }
    if (this.glow) {
      this.glow.style.left = this.glowX + 'px'
      this.glow.style.top = this.glowY + 'px'
    }
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.dot?.remove()
    this.ring?.remove()
    this.glow?.remove()
  }
}

export default defineNuxtPlugin(() => {
  new CustomCursor()
})
