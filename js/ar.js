/**
 * WAVELENGTH — Edition 47
 * VFX / MindAR Image Tracking & Simulator Controller
 *
 * Handles camera lifecycle, target detection events, aspect ratio preservation,
 * graceful camera cleanup, and desktop/offline non-AR simulators.
 */

document.addEventListener("DOMContentLoaded", () => {
  const config = window.WAVELENGTH_CONFIG ? window.WAVELENGTH_CONFIG.vfx : null;

  // DOM Elements
  const arContainer = document.getElementById("arContainer");
  const aframeWrapper = document.getElementById("aframeWrapper");
  const btnExitAR = document.getElementById("btnExitAR");
  const liveStatusPill = document.getElementById("liveStatusPill");
  const liveStatusText = document.getElementById("liveStatusText");
  const liveInstructionText = document.getElementById("liveInstructionText");
  const scanningReticle = document.getElementById("scanningReticle");
  const toastAlert = document.getElementById("arToastAlert");
  const toastText = document.getElementById("arToastText");

  // Launch Buttons
  const btnLaunchColorAR = document.getElementById("btnLaunchColorAR");
  const btnLaunch3dAR = document.getElementById("btnLaunch3dAR");
  const btnSimColor = document.getElementById("btnSimColor");
  const btnSim3D = document.getElementById("btnSim3D");

  // Simulators & Modals
  const simColorModal = document.getElementById("simColorModal");
  const sim3DModal = document.getElementById("sim3DModal");
  const btnCloseColorModal = document.getElementById("btnCloseColorModal");
  const btnClose3DModal = document.getElementById("btnClose3DModal");

  // State
  let isARActive = false;
  let currentTargetIndex = 0;
  let activeSceneElement = null;
  let rotationAnimationId = null;

  // Show Toast Alert
  function showToast(message, duration = 4500) {
    if (!toastAlert || !toastText) return;
    toastText.textContent = message;
    toastAlert.classList.add("visible");
    setTimeout(() => {
      toastAlert.classList.remove("visible");
    }, duration);
  }

  // Pre-flight Environment Validation
  function checkEnvironmentSupport() {
    const isSecure =
      location.protocol === "https:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";

    if (!isSecure) {
      console.warn("Camera access requires HTTPS or localhost.");
      showToast("Notice: WebAR camera requires HTTPS or localhost.");
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast("Camera API not supported on this browser/device.");
      return false;
    }
    return true;
  }

  // Set HUD Status
  function setStatus(status, text, instruction = "") {
    if (!liveStatusPill || !liveStatusText) return;
    liveStatusText.textContent = text;
    if (instruction && liveInstructionText) {
      liveInstructionText.textContent = instruction;
    }

    if (status === "found") {
      liveStatusPill.className = "ar-live-status-pill target-found";
      if (scanningReticle) scanningReticle.classList.add("target-locked");
    } else {
      liveStatusPill.className = "ar-live-status-pill";
      if (scanningReticle) scanningReticle.classList.remove("target-locked");
    }
  }

  // ==========================================================================
  // LAUNCH AR SESSION
  // ==========================================================================

  function launchAR(targetIndex) {
    if (isARActive) return; // prevent duplicate sessions
    if (!checkEnvironmentSupport()) return;

    currentTargetIndex = targetIndex;
    isARActive = true;

    // Show Fullscreen Container
    arContainer.classList.add("active");
    document.body.style.overflow = "hidden";
    setStatus("scanning", "Starting Camera...", "Preparing WebAR tracking engine");

    // Construct or mount A-Frame Scene
    buildAFrameScene();
  }

  // Construct declarative A-Frame + MindAR scene
  function buildAFrameScene() {
    aframeWrapper.innerHTML = "";

    const targetsPath = (config && config.targetsFile) || "./assets/targets/targets.mind";
    const exp1 = config ? config.experience1_colorReveal : {};
    const exp2 = config ? config.experience2_3dModel : {};

    // Create A-Frame scene element
    const scene = document.createElement("a-scene");
    scene.id = "mindARScene";
    scene.setAttribute("mindar-image", `imageTargetSrc: ${targetsPath}; autoStart: true; uiLoading: no; uiScanning: no; filterMinCF: 0.001; filterBeta: 1000;`);
    scene.setAttribute("embedded", "");
    scene.setAttribute("color-space", "sRGB");
    scene.setAttribute("renderer", "colorManagement: true, physicallyCorrectLights: true");
    scene.setAttribute("vr-mode-ui", "enabled: false");
    scene.setAttribute("device-orientation-permission-ui", "enabled: false");

    // Camera
    const camera = document.createElement("a-camera");
    camera.setAttribute("position", "0 0 0");
    camera.setAttribute("look-controls", "enabled: false");
    scene.appendChild(camera);

    // ==========================================================================
    // TARGET 0: Experience 1 (Black & White to Colour Artwork Reveal)
    // ==========================================================================
    const target0 = document.createElement("a-entity");
    target0.id = "targetEntity0";
    target0.setAttribute("mindar-image-target", `targetIndex: ${exp1.targetIndex || 0}`);

    // Colour overlay plane
    const colorPlane = document.createElement("a-plane");
    colorPlane.id = "arColorPlane";
    colorPlane.setAttribute("src", exp1.colorImage || "./assets/images/color-overlay-sample.svg");
    colorPlane.setAttribute("width", exp1.targetWidth || "1.0");
    colorPlane.setAttribute("height", exp1.targetHeight || "1.0");
    colorPlane.setAttribute("position", `${exp1.position.x} ${exp1.position.y} ${exp1.position.z}`);
    colorPlane.setAttribute("rotation", `${exp1.rotation.x} ${exp1.rotation.y} ${exp1.rotation.z}`);
    colorPlane.setAttribute("material", "transparent: true; opacity: 0; roughness: 0.3; metalness: 0.1");

    target0.appendChild(colorPlane);
    scene.appendChild(target0);

    // ==========================================================================
    // TARGET 1: Experience 2 (Article with 3D Model)
    // ==========================================================================
    const target1 = document.createElement("a-entity");
    target1.id = "targetEntity1";
    target1.setAttribute("mindar-image-target", `targetIndex: ${exp2.targetIndex || 1}`);

    const modelContainer = document.createElement("a-entity");
    modelContainer.id = "arModelContainer";
    modelContainer.setAttribute("position", `${exp2.position.x} ${exp2.position.y} ${exp2.position.z}`);
    modelContainer.setAttribute("scale", `${exp2.scale.x} ${exp2.scale.y} ${exp2.scale.z}`);
    modelContainer.setAttribute("visible", "false");

    if (exp2.useDemoGeometry) {
      // High-tech procedural topological crystal structure
      const demoCore = document.createElement("a-dodecahedron");
      demoCore.setAttribute("radius", "0.8");
      demoCore.setAttribute("material", "color: #76b8d8; roughness: 0.1; metalness: 0.9; wireframe: false");

      const demoRing1 = document.createElement("a-torus");
      demoRing1.setAttribute("radius", "1.2");
      demoRing1.setAttribute("radius-tubular", "0.025");
      demoRing1.setAttribute("rotation", "45 0 0");
      demoRing1.setAttribute("material", "color: #d4b896; metalness: 0.8; roughness: 0.2");

      const demoRing2 = document.createElement("a-torus");
      demoRing2.setAttribute("radius", "1.4");
      demoRing2.setAttribute("radius-tubular", "0.02");
      demoRing2.setAttribute("rotation", "-45 45 0");
      demoRing2.setAttribute("material", "color: #bd8ce5; metalness: 0.9; roughness: 0.1");

      modelContainer.appendChild(demoCore);
      modelContainer.appendChild(demoRing1);
      modelContainer.appendChild(demoRing2);
    } else {
      // Real GLB model
      const gltfModel = document.createElement("a-gltf-model");
      gltfModel.setAttribute("src", exp2.modelPath || "./assets/models/article-model.glb");
      if (exp2.supportsAnimation) {
        gltfModel.setAttribute("animation-mixer", "");
      }
      modelContainer.appendChild(gltfModel);
    }

    target1.appendChild(modelContainer);
    scene.appendChild(target1);

    // Append scene to DOM
    aframeWrapper.appendChild(scene);
    activeSceneElement = scene;

    // Attach tracking listeners
    attachTrackingEvents(scene, target0, colorPlane, target1, modelContainer);
  }

  // Handle Target Events
  function attachTrackingEvents(scene, target0, colorPlane, target1, modelContainer) {
    const exp1 = config ? config.experience1_colorReveal : {};
    const exp2 = config ? config.experience2_3dModel : {};

    // Scene ready / loaded
    scene.addEventListener("loaded", () => {
      setStatus(
        "scanning",
        "Searching for Printed Page...",
        currentTargetIndex === 0
          ? "Point camera at the B&W illustration on Page 14"
          : "Point camera at the 3D marker on Page 28"
      );
    });

    // Scene error / targets error
    scene.addEventListener("arError", (err) => {
      console.warn("MindAR tracking error:", err);
      showToast("Tracking targets file pending compilation. Try Non-AR preview!");
      setStatus("scanning", "Target Pending Compilation", "Use interactive simulator below");
    });

    // ------------------------------------------------------------------------
    // Target 0: B&W to Colour Reveal
    // ------------------------------------------------------------------------
    target0.addEventListener("targetFound", () => {
      setStatus("found", "Target Found! Revealing Colour", "Artwork chromatic spectrum active");

      // Smooth opacity reveal
      let start = null;
      const duration = (exp1.revealDuration || 1.2) * 1000;

      function step(timestamp) {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        colorPlane.setAttribute("material", "opacity", progress);
        if (progress < 1 && isARActive) {
          requestAnimationFrame(step);
        }
      }
      requestAnimationFrame(step);
    });

    target0.addEventListener("targetLost", () => {
      setStatus("scanning", "Target Lost", "Re-align camera over Page 14");
      colorPlane.setAttribute("material", "opacity", 0);
    });

    // ------------------------------------------------------------------------
    // Target 1: 3D Model
    // ------------------------------------------------------------------------
    target1.addEventListener("targetFound", () => {
      setStatus("found", "Target Found! 3D Model Anchored", "Topological matter floating on page");
      modelContainer.setAttribute("visible", "true");

      if (exp2.slowRotate) {
        let rotY = 0;
        function rotateStep() {
          if (!isARActive) return;
          rotY += exp2.rotationSpeed || 0.4;
          modelContainer.setAttribute("rotation", `0 ${rotY} 0`);
          rotationAnimationId = requestAnimationFrame(rotateStep);
        }
        rotationAnimationId = requestAnimationFrame(rotateStep);
      }
    });

    target1.addEventListener("targetLost", () => {
      setStatus("scanning", "Target Lost", "Re-align camera over Page 28");
      modelContainer.setAttribute("visible", "false");
      if (rotationAnimationId) {
        cancelAnimationFrame(rotationAnimationId);
        rotationAnimationId = null;
      }
    });
  }

  // ==========================================================================
  // TEARDOWN & COMPLETE CAMERA CLEANUP
  // ==========================================================================

  function exitAR() {
    if (!isARActive) return;
    isARActive = false;

    if (rotationAnimationId) {
      cancelAnimationFrame(rotationAnimationId);
      rotationAnimationId = null;
    }

    // Stop MindAR system
    if (activeSceneElement && activeSceneElement.systems) {
      const mindSystem = activeSceneElement.systems["mindar-image-system"];
      if (mindSystem && typeof mindSystem.stop === "function") {
        try {
          mindSystem.stop();
        } catch (e) {
          console.warn("MindAR system stop warning:", e);
        }
      }
    }

    // Stop all MediaStream camera tracks
    const allVideos = document.querySelectorAll("video");
    allVideos.forEach((video) => {
      if (video.srcObject) {
        const stream = video.srcObject;
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        video.srcObject = null;
      }
      video.remove();
    });

    // Remove MindAR injected overlays
    const mindOverlays = document.querySelectorAll(".mindar-ui-overlay, .mindar-ui-loading");
    mindOverlays.forEach((el) => el.remove());

    // Clear A-Frame wrapper
    if (aframeWrapper) aframeWrapper.innerHTML = "";
    activeSceneElement = null;

    // Hide AR Viewport
    arContainer.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Exit Buttons & Keyboard Escape
  if (btnExitAR) btnExitAR.addEventListener("click", exitAR);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isARActive) exitAR();
  });

  // Launch Button Triggers
  if (btnLaunchColorAR) {
    btnLaunchColorAR.addEventListener("click", () => launchAR(0));
  }
  if (btnLaunch3dAR) {
    btnLaunch3dAR.addEventListener("click", () => launchAR(1));
  }

  // ==========================================================================
  // NON-AR SIMULATORS & INTERACTIVE PREVIEWS
  // ==========================================================================

  // Simulator 1: Black & White to Colour Split Slider
  if (btnSimColor && simColorModal) {
    btnSimColor.addEventListener("click", () => {
      simColorModal.classList.add("open");
      initSimColorSlider();
    });
  }
  if (btnCloseColorModal && simColorModal) {
    btnCloseColorModal.addEventListener("click", () => {
      simColorModal.classList.remove("open");
    });
  }

  function initSimColorSlider() {
    const box = document.getElementById("simColorBox");
    const range = document.getElementById("simColorRange");
    if (!box) return;

    const layerColor = box.querySelector(".sim-layer-color");
    const bar = box.querySelector(".sim-slider-bar");
    const knob = box.querySelector(".sim-slider-knob");

    function setPercent(pct) {
      pct = Math.max(0, Math.min(100, pct));
      if (layerColor) layerColor.style.clipPath = `polygon(0 0, ${pct}% 0, ${pct}% 100%, 0 100%)`;
      if (bar) bar.style.left = `${pct}%`;
      if (knob) knob.style.left = `${pct}%`;
      if (range) range.value = pct;
    }

    if (range) {
      range.addEventListener("input", (e) => {
        setPercent(e.target.value);
      });
    }

    // Direct drag on the box
    let isDragging = false;
    box.addEventListener("mousedown", (e) => {
      isDragging = true;
      const rect = box.getBoundingClientRect();
      setPercent(((e.clientX - rect.left) / rect.width) * 100);
    });
    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const rect = box.getBoundingClientRect();
      setPercent(((e.clientX - rect.left) / rect.width) * 100);
    });
    window.addEventListener("mouseup", () => {
      isDragging = false;
    });

    // Touch support
    box.addEventListener("touchstart", (e) => {
      isDragging = true;
      if (e.touches.length > 0) {
        const rect = box.getBoundingClientRect();
        setPercent(((e.touches[0].clientX - rect.left) / rect.width) * 100);
      }
    }, { passive: true });
    window.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      if (e.touches.length > 0) {
        const rect = box.getBoundingClientRect();
        setPercent(((e.touches[0].clientX - rect.left) / rect.width) * 100);
      }
    }, { passive: true });
    window.addEventListener("touchend", () => {
      isDragging = false;
    });
  }

  // Simulator 2: 3D Model Canvas Orbit Viewer
  if (btnSim3D && sim3DModal) {
    btnSim3D.addEventListener("click", () => {
      sim3DModal.classList.add("open");
      initSim3DViewer();
    });
  }
  if (btnClose3DModal && sim3DModal) {
    btnClose3DModal.addEventListener("click", () => {
      sim3DModal.classList.remove("open");
    });
  }

  // Pure Vanilla Canvas 3D Topological Crystal Rendering Engine
  let sim3DAnimId = null;
  function initSim3DViewer() {
    const canvas = document.getElementById("preview3DCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Match device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 3D Polyhedron Vertices (Icosahedron / Topological Crystal)
    const phi = (1 + Math.sqrt(5)) / 2;
    const vertices = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ].map(([x, y, z]) => {
      const mag = Math.hypot(x, y, z);
      return [x / mag, y / mag, z / mag];
    });

    const edges = [
      [0,11], [0,5], [0,1], [0,7], [0,10],
      [1,5], [5,11], [11,10], [10,7], [7,1],
      [3,9], [3,4], [3,2], [3,6], [3,8],
      [4,9], [9,8], [8,6], [6,2], [2,4],
      [4,5], [5,9], [9,1], [1,8], [8,7],
      [7,6], [6,10], [10,2], [2,11], [11,4]
    ];

    let rotX = 0.4, rotY = 0.6;
    let autoSpin = true;
    let wireframeOnly = false;
    let isMouseDown = false;
    let lastMouseX = 0, lastMouseY = 0;

    // Toolbar controls
    const btnSpin = document.getElementById("btnToggleSpin");
    const btnWire = document.getElementById("btnToggleWire");

    if (btnSpin) {
      btnSpin.onclick = () => {
        autoSpin = !autoSpin;
        btnSpin.classList.toggle("active", autoSpin);
      };
    }
    if (btnWire) {
      btnWire.onclick = () => {
        wireframeOnly = !wireframeOnly;
        btnWire.classList.toggle("active", wireframeOnly);
      };
    }

    // Drag interaction
    canvas.onmousedown = (e) => {
      isMouseDown = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };
    window.addEventListener("mousemove", (e) => {
      if (!isMouseDown) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      rotY += dx * 0.008;
      rotX += dy * 0.008;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });
    window.addEventListener("mouseup", () => {
      isMouseDown = false;
    });

    // Touch interaction
    canvas.ontouchstart = (e) => {
      if (e.touches.length > 0) {
        isMouseDown = true;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
      }
    };
    window.addEventListener("touchmove", (e) => {
      if (!isMouseDown || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - lastMouseX;
      const dy = e.touches[0].clientY - lastMouseY;
      rotY += dx * 0.008;
      rotX += dy * 0.008;
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
    });
    window.addEventListener("touchend", () => {
      isMouseDown = false;
    });

    // Render Loop
    function render3D() {
      if (!sim3DModal.classList.contains("open")) {
        cancelAnimationFrame(sim3DAnimId);
        return;
      }

      ctx.clearRect(0, 0, rect.width, rect.height);

      if (autoSpin && !isMouseDown) {
        rotY += 0.012;
        rotX += 0.006;
      }

      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const scale = Math.min(rect.width, rect.height) * 0.35;

      // Project vertices
      const projected = vertices.map(([x, y, z]) => {
        // Rotate Y
        let x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
        let z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);
        // Rotate X
        let y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);

        // Perspective
        const dist = 3.2;
        const pz = z2 + dist;
        const px = cx + (x1 / pz) * scale * 2.2;
        const py = cy - (y2 / pz) * scale * 2.2;
        return { px, py, pz, z2 };
      });

      // Draw Edges
      ctx.lineWidth = 1.8;
      edges.forEach(([i, j]) => {
        const p1 = projected[i];
        const p2 = projected[j];
        const avgZ = (p1.z2 + p2.z2) / 2;
        const alpha = Math.max(0.15, Math.min(0.9, (avgZ + 1.2) / 2.4));

        ctx.strokeStyle = `rgba(118, 184, 216, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      });

      // Draw Vertices
      projected.forEach((p) => {
        const radius = Math.max(2, (p.z2 + 1.5) * 2.8);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Concentric Gyro Rings
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = "rgba(212, 184, 150, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, scale * 1.35, scale * 0.45, rotY * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(189, 140, 229, 0.35)";
      ctx.beginPath();
      ctx.ellipse(0, 0, scale * 1.55, scale * 0.55, -rotY * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      sim3DAnimId = requestAnimationFrame(render3D);
    }

    render3D();
  }
});
