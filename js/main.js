/**
 * WAVELENGTH — Edition 47
 * Editorial Systems & Interactive Elements
 *
 * Implements:
 * 1. Metadata synchronization from WAVELENGTH_CONFIG
 * 2. High-Performance Tactile Specimen Split Slider:
 *    - Modern Pointer Events API with setPointerCapture (zero stutter, zero mouse drift)
 *    - requestAnimationFrame batched updates for silky 60fps/120fps display refresh
 *    - Touch-action: none to eliminate mobile scroll conflicts
 *    - Full Keyboard Accessibility (Arrow Keys, Home, End, PageUp, PageDown)
 *    - Smooth easing introductory preview
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================================
  // 1. METADATA SYNCHRONIZATION
  // ==========================================================================
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

  // ==========================================================================
  // 2. HIGH-PERFORMANCE TACTILE SPECIMEN SPLIT SLIDER
  // ==========================================================================
  const splitContainer = document.getElementById("landingSplitBox");
  if (splitContainer) {
    const colorLayer = splitContainer.querySelector(".split-layer-color");
    const dividerLine = splitContainer.querySelector(".split-divider-line");
    const handleThumb = splitContainer.querySelector(".split-handle-thumb");

    let isPointerDown = false;
    let currentPercentage = 50;
    let targetPercentage = 50;
    let rAFId = null;
    let userHasInteracted = false;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Render visual state directly without CSS transition lag
    function renderPosition(pct) {
      currentPercentage = Math.max(0, Math.min(100, pct));
      const rounded = Math.round(currentPercentage * 10) / 10;

      if (colorLayer) {
        colorLayer.style.clipPath = `polygon(0 0, ${rounded}% 0, ${rounded}% 100%, 0 100%)`;
      }
      if (dividerLine) {
        dividerLine.style.left = `${rounded}%`;
      }
      if (handleThumb) {
        handleThumb.style.left = `${rounded}%`;
      }

      splitContainer.setAttribute("aria-valuenow", Math.round(currentPercentage));
    }

    // Schedule render via requestAnimationFrame for perfect screen synchronization
    function queueRender(pct) {
      targetPercentage = Math.max(0, Math.min(100, pct));
      if (!rAFId) {
        rAFId = requestAnimationFrame(() => {
          renderPosition(targetPercentage);
          rAFId = null;
        });
      }
    }

    function calculatePercentFromPointer(clientX) {
      const rect = splitContainer.getBoundingClientRect();
      if (rect.width === 0) return 50;
      const offsetX = clientX - rect.left;
      return (offsetX / rect.width) * 100;
    }

    // Modern Pointer Events API (handles mouse, pen, and touch identically)
    splitContainer.addEventListener("pointerdown", (e) => {
      userHasInteracted = true;
      isPointerDown = true;
      splitContainer.classList.add("is-dragging");

      // Lock pointer capture to container so fast mouse gestures never drop
      try {
        splitContainer.setPointerCapture(e.pointerId);
      } catch (err) {
        // Fallback gracefully if setPointerCapture unsupported
      }

      const pct = calculatePercentFromPointer(e.clientX);
      renderPosition(pct);
    });

    splitContainer.addEventListener("pointermove", (e) => {
      if (!isPointerDown) return;
      userHasInteracted = true;
      const pct = calculatePercentFromPointer(e.clientX);
      queueRender(pct);
    });

    function endPointerDrag(e) {
      if (!isPointerDown) return;
      isPointerDown = false;
      splitContainer.classList.remove("is-dragging");

      try {
        if (e && e.pointerId && splitContainer.hasPointerCapture(e.pointerId)) {
          splitContainer.releasePointerCapture(e.pointerId);
        }
      } catch (err) {
        // Fallback
      }
    }

    splitContainer.addEventListener("pointerup", endPointerDrag);
    splitContainer.addEventListener("pointercancel", endPointerDrag);

    // Keyboard Accessibility (Arrow Keys, Home, End, PageUp, PageDown)
    splitContainer.addEventListener("keydown", (e) => {
      userHasInteracted = true;
      let step = 4;
      if (e.shiftKey) step = 12;

      let newPct = currentPercentage;

      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        newPct -= step;
      } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        newPct += step;
      } else if (e.key === "PageDown") {
        e.preventDefault();
        newPct -= 20;
      } else if (e.key === "PageUp") {
        e.preventDefault();
        newPct += 20;
      } else if (e.key === "Home") {
        e.preventDefault();
        newPct = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        newPct = 100;
      } else {
        return;
      }

      renderPosition(newPct);
    });

    // Set initial 50% state immediately
    renderPosition(50);

    // Subtle organic hint demonstration after 800ms (only if untouched & reduced-motion is false)
    if (!prefersReducedMotion) {
      setTimeout(() => {
        if (userHasInteracted) return;
        let startTime = null;
        const animDuration = 1400; // ms

        function runDemo(now) {
          if (userHasInteracted) return;
          if (!startTime) startTime = now;
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / animDuration, 1);

          // Smooth sine curve: 50% -> 38% -> 50%
          const offset = Math.sin(progress * Math.PI) * 12;
          renderPosition(50 - offset);

          if (progress < 1 && !userHasInteracted) {
            requestAnimationFrame(runDemo);
          } else if (!userHasInteracted) {
            renderPosition(50);
          }
        }

        requestAnimationFrame(runDemo);
      }, 800);
    }
  }

  // Smooth scroll links handler
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        // Update URL hash without jumping
        if (history.pushState) {
          history.pushState(null, null, targetId);
        }
      }
    });
  });
});
