// ================================================
// Custom Cursor
// ================================================

class CustomCursor {
  constructor() {
    this.dot = null;
    this.outline = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.dotX = 0;
    this.dotY = 0;
    this.outlineX = 0;
    this.outlineY = 0;
    this.init();
  }

  init() {
    // Check if on mobile or prefers reduced motion
    if (
      window.innerWidth <= 768 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // Create cursor elements
    this.dot = document.createElement("div");
    this.dot.className = "cursor-dot";
    document.body.appendChild(this.dot);

    this.outline = document.createElement("div");
    this.outline.className = "cursor-outline";
    document.body.appendChild(this.outline);

    // Track mouse movement
    document.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    // Hover effects on interactive elements
    const interactiveElements =
      "a, button, .icon, .skill-tag, .tech-tag, .project-card, .cert-card, input, select, .btn-primary, .btn-toggle, .title-bar-controls button";

    document.addEventListener("mouseover", (e) => {
      if (
        e.target.matches(interactiveElements) ||
        e.target.closest(interactiveElements)
      ) {
        document.body.classList.add("cursor-hover");
      }
    });

    document.addEventListener("mouseout", (e) => {
      if (
        e.target.matches(interactiveElements) ||
        e.target.closest(interactiveElements)
      ) {
        document.body.classList.remove("cursor-hover");
      }
    });

    // Click effect
    document.addEventListener("mousedown", () => {
      document.body.classList.add("cursor-click");
    });

    document.addEventListener("mouseup", () => {
      document.body.classList.remove("cursor-click");
    });

    // Animate cursor
    this.animate();
  }

  animate() {
    // Smooth follow for dot (faster)
    this.dotX += (this.mouseX - this.dotX) * 0.25;
    this.dotY += (this.mouseY - this.dotY) * 0.25;

    // Smooth follow for outline (slower)
    this.outlineX += (this.mouseX - this.outlineX) * 0.15;
    this.outlineY += (this.mouseY - this.outlineY) * 0.15;

    if (this.dot) {
      this.dot.style.left = this.dotX + "px";
      this.dot.style.top = this.dotY + "px";
    }

    if (this.outline) {
      this.outline.style.left = this.outlineX + "px";
      this.outline.style.top = this.outlineY + "px";
    }

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize custom cursor
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    new CustomCursor();
  });
}
