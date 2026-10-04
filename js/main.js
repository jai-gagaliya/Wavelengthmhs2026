/**
 * WAVELENGTH — Edition 47
 * Editorial Systems & Interactive Elements
 *
 * Implements:
 * 1. Metadata synchronization from WAVELENGTH_CONFIG
 * 2. Interactive Tactile Monochrome-to-Colour Specimen Split Slider
 *    - Mouse Drag & Direct Click Jump
 *    - Touch Drag with passive listeners
 *    - Full Keyboard Accessibility (Arrow Keys, Home, End)
 *    - Subtle initial motion preview (respects prefers-reduced-motion)
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
  // 2. TACTILE MONOCHROME-TO-COLOUR SPECIMEN SPLIT SLIDER
  // ==========================================================================
  const splitContainer = document.getElementById("landingSplitBox");
  if (splitContainer) {
    const colorLayer = splitContainer.querySelector(".split-layer-color");
    const dividerLine = splitContainer.querySelector(".split-divider-line");
    const handleThumb = splitContainer.querySelector(".split-handle-thumb");

    let isDragging = false;
    let currentPercentage = 50;
    let userHasInteracted = false;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function applyPercentage(percentage) {
      currentPercentage = Math.max(0, Math.min(100, percentage));

      if (colorLayer) {
        colorLayer.style.clipPath = `polygon(0 0, ${currentPercentage}% 0, ${currentPercentage}% 100%, 0 100%)`;
      }
      if (dividerLine) {
        dividerLine.style.left = `${currentPercentage}%`;
      }
      if (handleThumb) {
        handleThumb.style.left = `${currentPercentage}%`;
      }

      splitContainer.setAttribute("aria-valuenow", Math.round(currentPercentage));
    }

    function handlePointerMove(clientX) {
      userHasInteracted = true;
      const rect = splitContainer.getBoundingClientRect();
      const offsetX = clientX - rect.left;
      const pct = (offsetX / rect.width) * 100;
      applyPercentage(pct);
    }

    // Mouse Interaction
    splitContainer.addEventListener("mousedown", (e) => {
      isDragging = true;
      splitContainer.focus();
      handlePointerMove(e.clientX);
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      handlePointerMove(e.clientX);
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
    });

    // Touch Interaction
    splitContainer.addEventListener("touchstart", (e) => {
      if (e.touches.length > 0) {
        isDragging = true;
        handlePointerMove(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (!isDragging || e.touches.length === 0) return;
      handlePointerMove(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener("touchend", () => {
      isDragging = false;
    });

    // Keyboard Accessibility (Arrow Left/Down to decrease, Arrow Right/Up to increase)
    splitContainer.addEventListener("keydown", (e) => {
      userHasInteracted = true;
      let step = 5;
      if (e.shiftKey) step = 15;

      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        applyPercentage(currentPercentage - step);
      } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        applyPercentage(currentPercentage + step);
      } else if (e.key === "Home") {
        e.preventDefault();
        applyPercentage(0);
      } else if (e.key === "End") {
        e.preventDefault();
        applyPercentage(100);
      }
    });

    // Initial state set to 50%
    applyPercentage(50);

    // Subtle introductory hint animation after 700ms if user hasn't touched it yet
    if (!prefersReducedMotion) {
      setTimeout(() => {
        if (userHasInteracted) return;
        let start = null;
        const duration = 1200; // ms

        function stepDemo(timestamp) {
          if (userHasInteracted) return;
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          // Ease in-out sine oscillation: 50 -> 36 -> 50
          const oscillation = Math.sin(progress * Math.PI) * 14;
          applyPercentage(50 - oscillation);

          if (progress < 1 && !userHasInteracted) {
            requestAnimationFrame(stepDemo);
          } else if (!userHasInteracted) {
            applyPercentage(50);
          }
        }

        requestAnimationFrame(stepDemo);
      }, 700);
    }
  }
});
