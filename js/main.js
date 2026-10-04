/**
 * WAVELENGTH — Edition 47
 * Editorial Systems & Interactive Elements
 *
 * Implements:
 * 1. Metadata synchronization from WAVELENGTH_CONFIG
 * 2. Interactive Tactile Monochrome-to-Colour Specimen Split Slider
 *    (Mouse, Touch, and Keyboard Accessible)
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
    const handleBadge = splitContainer.querySelector(".split-handle-badge");

    let isDragging = false;
    let currentPercentage = 50;

    function applyPercentage(percentage) {
      currentPercentage = Math.max(0, Math.min(100, percentage));

      if (colorLayer) {
        colorLayer.style.clipPath = `polygon(0 0, ${currentPercentage}% 0, ${currentPercentage}% 100%, 0 100%)`;
      }
      if (dividerLine) {
        dividerLine.style.left = `${currentPercentage}%`;
      }
      if (handleBadge) {
        handleBadge.style.left = `${currentPercentage}%`;
        if (currentPercentage < 15) {
          handleBadge.textContent = "Print Ink";
        } else if (currentPercentage > 85) {
          handleBadge.textContent = "AR Spectrum";
        } else {
          handleBadge.textContent = "Drag ↔ Reveal";
        }
      }

      splitContainer.setAttribute("aria-valuenow", Math.round(currentPercentage));
    }

    function handlePointerMove(clientX) {
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

    // Set initial percentage to 50%
    applyPercentage(50);
  }
});
