/**
 * WAVELENGTH — Edition 47
 * Cinematic Experience & Interactive Systems
 *
 * Implements:
 * 1. Ambient Golden Stardust Particle Field (Canvas)
 * 2. Dynamic Radial Cursor Glow Spotlight
 * 3. 3D Perspective Card Tilt & Surface Lighting
 * 4. Interactive Monochrome-to-Colour Spectrum Slider
 */

document.addEventListener("DOMContentLoaded", () => {
  // Sync page metadata from WAVELENGTH_CONFIG if available
  if (window.WAVELENGTH_CONFIG) {
    const config = window.WAVELENGTH_CONFIG;
    
    // Update edition badges
    const editionEls = document.querySelectorAll(".dynamic-edition");
    editionEls.forEach((el) => {
      el.textContent = config.magazine.edition;
    });

    // Update magazine titles
    const magTitleEls = document.querySelectorAll(".dynamic-mag-title");
    magTitleEls.forEach((el) => {
      el.textContent = config.magazine.title;
    });
  }

  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ==========================================================================
  // 1. AMBIENT GOLDEN STARDUST PARTICLE FIELD (CANVAS)
  // ==========================================================================
  const stardustCanvas = document.getElementById("stardustCanvas");
  if (stardustCanvas && !prefersReducedMotion) {
    const ctx = stardustCanvas.getContext("2d");
    let particles = [];
    let animFrameId = null;

    const spawnParticle = (w, h) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -(0.06 + Math.random() * 0.22),
      r: Math.random() * 1.4 + 0.4,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.02 + Math.random() * 0.03
    });

    const resizeCanvas = () => {
      stardustCanvas.width = window.innerWidth;
      stardustCanvas.height = window.innerHeight;
      const count = isTouch ? 28 : 65;
      particles = Array.from({ length: count }, () => spawnParticle(stardustCanvas.width, stardustCanvas.height));
    };

    window.addEventListener("resize", resizeCanvas, { passive: true });
    resizeCanvas();

    const drawParticles = () => {
      ctx.clearRect(0, 0, stardustCanvas.width, stardustCanvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += p.phaseSpeed;

        const opacity = 0.2 + Math.sin(p.phase) * 0.18;

        ctx.beginPath();
        ctx.fillStyle = `rgba(212, 184, 150, ${Math.max(0, opacity).toFixed(3)})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        // Recycle particle when it floats off top of screen
        if (p.y < -10) {
          p.y = stardustCanvas.height + 10;
          p.x = Math.random() * stardustCanvas.width;
        }
        if (p.x < -10) p.x = stardustCanvas.width + 10;
        if (p.x > stardustCanvas.width + 10) p.x = -10;
      });

      animFrameId = requestAnimationFrame(drawParticles);
    };

    drawParticles();
  }

  // ==========================================================================
  // 2. DYNAMIC CURSOR GLOW SPOTLIGHT
  // ==========================================================================
  const cursorGlow = document.getElementById("cursorGlow");
  if (cursorGlow && !isTouch && !prefersReducedMotion) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX = mouseX;
    let glowY = mouseY;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorGlow.classList.add("active");
    }, { passive: true });

    window.addEventListener("mouseleave", () => {
      cursorGlow.classList.remove("active");
    });

    const loopGlow = () => {
      glowX += (mouseX - glowX) * 0.12;
      glowY += (mouseY - glowY) * 0.12;
      cursorGlow.style.left = `${glowX}px`;
      cursorGlow.style.top = `${glowY}px`;
      requestAnimationFrame(loopGlow);
    };
    loopGlow();

    // Enlarge glow when hovering interactive controls
    document.querySelectorAll("a, button, .portal-card, .audio-card, .vfx-card").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursorGlow.style.width = "520px";
        cursorGlow.style.height = "520px";
      });
      el.addEventListener("mouseleave", () => {
        cursorGlow.style.width = "420px";
        cursorGlow.style.height = "420px";
      });
    });
  }

  // ==========================================================================
  // 3. 3D PERSPECTIVE CARD TILT & SURFACE LIGHTING
  // ==========================================================================
  const portalCards = document.querySelectorAll(".portal-card");
  if (portalCards.length > 0 && !isTouch && !prefersReducedMotion) {
    const maxTilt = 7; // Max tilt in degrees

    portalCards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Set CSS variables for radial spotlight
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);

        // Compute 3D tilt
        const relX = x / rect.width;
        const relY = y / rect.height;
        const rotY = (relX - 0.5) * maxTilt * 2;
        const rotX = (0.5 - relY) * maxTilt * 2;

        card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-8px) translateZ(10px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) translateZ(0px)";
      });
    });
  }

  // ==========================================================================
  // 4. INTERACTIVE MONOCHROME-TO-COLOUR SPECTRUM SLIDER
  // ==========================================================================
  const splitContainer = document.getElementById("landingSplitBox");
  if (splitContainer) {
    const colorLayer = splitContainer.querySelector(".split-layer-color");
    const dividerLine = splitContainer.querySelector(".split-divider-line");
    const handleBadge = splitContainer.querySelector(".split-handle-badge");

    let isDragging = false;

    function updateSplitPosition(clientX) {
      const rect = splitContainer.getBoundingClientRect();
      let offsetX = clientX - rect.left;
      let percentage = (offsetX / rect.width) * 100;
      percentage = Math.max(0, Math.min(100, percentage));

      if (colorLayer) {
        colorLayer.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
      }
      if (dividerLine) {
        dividerLine.style.left = `${percentage}%`;
      }
      if (handleBadge) {
        handleBadge.style.left = `${percentage}%`;
        if (percentage < 20) {
          handleBadge.textContent = "Monochrome";
        } else if (percentage > 80) {
          handleBadge.textContent = "Spectrum";
        } else {
          handleBadge.textContent = "Drag ↔ Reveal";
        }
      }
    }

    splitContainer.addEventListener("mousedown", (e) => {
      isDragging = true;
      updateSplitPosition(e.clientX);
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      updateSplitPosition(e.clientX);
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
    });

    // Touch support for mobile devices
    splitContainer.addEventListener("touchstart", (e) => {
      isDragging = true;
      if (e.touches.length > 0) {
        updateSplitPosition(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      if (e.touches.length > 0) {
        updateSplitPosition(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener("touchend", () => {
      isDragging = false;
    });
  }
});
