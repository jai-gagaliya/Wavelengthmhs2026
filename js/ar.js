/**
 * WAVELENGTH — Edition 47
 * Optical VFX & Augmented Reality Controller (MindAR + A-Frame)
 *
 * Implements full-edition AR tracking powered by MindAR 1.2.3 & A-Frame 1.2.0:
 * - Full-colour digital restorations for all 30 magazine pages (Pages 01–31, excluding 3 & 32)
 * - Motion video reveal on Pages 18 & 19 (wavy.mp4 video-overlay)
 * - Spatial 3D model anchor on Page 17
 * - Unmuted / muted audio toggle
 * - Offline / desktop interactive simulator modals
 */

document.addEventListener("DOMContentLoaded", () => {
  const arContainer = document.getElementById("arContainer");
  const mindarScene = document.getElementById("mindarScene");
  const btnExitAR = document.getElementById("btnExitAR");
  const btnFlipCamera = document.getElementById("btnFlipCamera");
  const arAudioLabel = document.getElementById("arAudioLabel");
  const liveStatusPill = document.getElementById("liveStatusPill");
  const liveStatusText = document.getElementById("liveStatusText");
  const liveInstructionText = document.getElementById("liveInstructionText");
  const scanningReticle = document.getElementById("scanningReticle");

  // Launch & Simulation Buttons
  const btnLaunchColorAR = document.getElementById("btnLaunchColorAR");
  const btnLaunch3dAR = document.getElementById("btnLaunch3dAR");
  const btnSimColor = document.getElementById("btnSimColor");
  const btnSim3D = document.getElementById("btnSim3D");

  // Non-AR Preview Modals
  const simColorModal = document.getElementById("simColorModal");
  const sim3DModal = document.getElementById("sim3DModal");
  const btnCloseColorModal = document.getElementById("btnCloseColorModal");
  const btnClose3DModal = document.getElementById("btnClose3DModal");

  let isARActive = false;
  let isMuted = true;

  // Set HUD Status
  function setStatus(title, instruction = "", isLocked = false) {
    if (liveStatusText) liveStatusText.textContent = title;
    if (instruction && liveInstructionText) {
      liveInstructionText.textContent = instruction;
    }
    if (liveStatusPill) {
      liveStatusPill.classList.toggle("target-found", isLocked);
    }
    if (scanningReticle) {
      scanningReticle.classList.toggle("target-locked", isLocked);
    }
  }

  // Preload and unlock wavyVideo on user gesture and scene loaded
  function unlockVideo() {
    const v = document.getElementById("wavyVideo");
    if (v) {
      v.muted = isMuted;
      v.load();
      v.play().then(() => {
        v.pause();
        v.currentTime = 0;
        console.log("✓ Video wavyVideo pre-unlocked successfully");
      }).catch(e => {
        console.warn("Silent unlock note:", e.message);
      });
    }
  }

  if (mindarScene) {
    mindarScene.addEventListener("loaded", () => {
      console.log("=== MINDAR SCENE LOADED ===");
      unlockVideo();
    });

    mindarScene.addEventListener("arReady", () => {
      console.log("=== MINDAR READY ===");
      setStatus("AR Scanner Ready", "Align camera over any physical magazine page", false);
    });

    mindarScene.addEventListener("arError", (ev) => {
      console.error("MindAR Error:", ev);
      setStatus("Camera Access Required", "Please allow camera permissions to scan magazine pages", false);
    });
  }

  // Target-to-page mapping matching compiled targets.mind (31 targets, indices 0-30)
  const TARGET_PAGE_MAP = [
    { targetIndex: 0, page: "01", name: "Cover Page 01", type: "color" },
    { targetIndex: 1, page: "02", name: "Page 02", type: "color" },
    { targetIndex: 2, page: "04", name: "Page 04", type: "color" },
    { targetIndex: 3, page: "05", name: "Page 05", type: "color" },
    { targetIndex: 4, page: "06", name: "Page 06", type: "color" },
    { targetIndex: 5, page: "07", name: "Page 07", type: "color" },
    { targetIndex: 6, page: "08", name: "Page 08", type: "color" },
    { targetIndex: 7, page: "09", name: "Page 09", type: "color" },
    { targetIndex: 8, page: "10", name: "Page 10", type: "color" },
    { targetIndex: 9, page: "11", name: "Page 11", type: "color" },
    { targetIndex: 10, page: "12", name: "Page 12", type: "color" },
    { targetIndex: 11, page: "13", name: "Page 13", type: "color" },
    { targetIndex: 12, page: "14", name: "Page 14", type: "color" },
    { targetIndex: 13, page: "15", name: "Page 15", type: "color" },
    { targetIndex: 14, page: "16", name: "Page 16", type: "color" },
    { targetIndex: 15, page: "17", name: "Page 17", type: "model" },
    { targetIndex: 16, page: "18", name: "Pages 18 & 19", type: "video" },
    { targetIndex: 17, page: "19", name: "Page 19", type: "color" },
    { targetIndex: 18, page: "20", name: "Page 20", type: "color" },
    { targetIndex: 19, page: "21", name: "Page 21", type: "color" },
    { targetIndex: 20, page: "22", name: "Page 22", type: "color" },
    { targetIndex: 21, page: "23", name: "Page 23", type: "color" },
    { targetIndex: 22, page: "24", name: "Page 24", type: "color" },
    { targetIndex: 23, page: "25", name: "Page 25", type: "color" },
    { targetIndex: 24, page: "26", name: "Page 26", type: "color" },
    { targetIndex: 25, page: "27", name: "Page 27", type: "color" },
    { targetIndex: 26, page: "28", name: "Page 28", type: "color" },
    { targetIndex: 27, page: "29", name: "Page 29", type: "color" },
    { targetIndex: 28, page: "30", name: "Page 30", type: "color" },
    { targetIndex: 29, page: "31", name: "Page 31", type: "color" },
    { targetIndex: 30, page: "32", name: "Page 32", type: "excluded" }
  ];

  // Attach event listeners to all targets
  TARGET_PAGE_MAP.forEach((item) => {
    const targetEntity = document.getElementById("target" + item.targetIndex);
    if (!targetEntity) return;

    targetEntity.addEventListener("targetFound", () => {
      console.log(`>>> TARGET ${item.targetIndex} FOUND: Page ${item.page} (${item.type}) <<<`);
      if (item.type === "model") {
        setStatus("✓ PAGE 17 DETECTED", "Projecting Interactive 3D Model Anchor Over Page 17", true);
      } else if (item.type === "video") {
        setStatus("✓ PAGES 18 & 19 DETECTED", "Playing Motion Video Reveal in AR", true);
      } else if (item.type !== "excluded") {
        setStatus(`✓ PAGE ${item.page} DETECTED`, "Full Chromatic Art Restored Over Monochrome Ink", true);
      }

      // Explicitly ensure all child planes and 3D models are visible
      targetEntity.object3D.visible = true;
      const planes = targetEntity.querySelectorAll("a-plane");
      planes.forEach((p) => {
        p.object3D.visible = true;
        if (p.getAttribute("material")) {
          p.setAttribute("material", "opacity", 1);
        }
      });
      const models = targetEntity.querySelectorAll("[gltf-model]");
      models.forEach((m) => {
        m.object3D.visible = true;
      });

      // If this target has a video-overlay component, call show()
      const overlay = targetEntity.querySelector("[video-overlay]");
      if (overlay && overlay.components && overlay.components["video-overlay"]) {
        overlay.components["video-overlay"].show();
      }
    });

    targetEntity.addEventListener("targetLost", () => {
      console.log(`>>> TARGET ${item.targetIndex} LOST <<<`);
      setStatus("Scanning Magazine...", "Point camera at any physical magazine page", false);

      const overlay = targetEntity.querySelector("[video-overlay]");
      if (overlay && overlay.components && overlay.components["video-overlay"]) {
        overlay.components["video-overlay"].hide();
      }
    });
  });

  // Launch MindAR Camera Session
  function launchAR() {
    if (isARActive) return;
    isARActive = true;

    // Gesture unlock video
    unlockVideo();

    if (arContainer) {
      arContainer.classList.add("active");
    }
    document.body.style.overflow = "hidden";
    setStatus("Starting AR Camera...", "Requesting camera stream and initializing tracking...", false);

    // Force Three.js and MindAR to sync canvas aspect ratio and viewport
    window.dispatchEvent(new Event("resize"));
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 150);

    if (mindarScene && mindarScene.systems && mindarScene.systems["mindar-image-system"]) {
      try {
        mindarScene.systems["mindar-image-system"].start();
        console.log("✓ MindAR system started");
      } catch (err) {
        console.error("Failed to start MindAR:", err);
      }
    }
  }

  // Exit MindAR Camera Session
  function exitAR() {
    if (!isARActive) return;
    isARActive = false;

    // Pause video
    const v = document.getElementById("wavyVideo");
    if (v) {
      v.pause();
      v.currentTime = 0;
    }

    // Stop MindAR system
    if (mindarScene && mindarScene.systems && mindarScene.systems["mindar-image-system"]) {
      try {
        mindarScene.systems["mindar-image-system"].stop();
        console.log("✓ MindAR system stopped");
      } catch (err) {
        console.warn("MindAR stop notice:", err);
      }
    }

    if (arContainer) {
      arContainer.classList.remove("active");
    }
    document.body.style.overflow = "";
    setStatus("Camera Closed", "Select an experience to launch AR camera", false);
  }

  // Toggle Audio in AR
  if (btnFlipCamera) {
    btnFlipCamera.addEventListener("click", () => {
      isMuted = !isMuted;
      const v = document.getElementById("wavyVideo");
      if (v) {
        v.muted = isMuted;
      }
      if (arAudioLabel) {
        arAudioLabel.textContent = isMuted ? "Sound: OFF" : "Sound: ON";
      }
      btnFlipCamera.classList.toggle("active", !isMuted);
    });
  }

  // Connect Launch and Exit buttons
  if (btnLaunchColorAR) btnLaunchColorAR.addEventListener("click", launchAR);
  if (btnLaunch3dAR) btnLaunch3dAR.addEventListener("click", launchAR);
  if (btnExitAR) btnExitAR.addEventListener("click", exitAR);

  // Esc key exits AR
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isARActive) {
      exitAR();
    }
  });

  // ==========================================================================
  // NON-AR SIMULATOR MODALS (Dual Showcase Split Slider & 3D Model Inspector)
  // ==========================================================================

  // Modal 1: Split Slider for Pages 18 & 19
  const modalSplitSlider = document.getElementById("modalSplitSlider");
  if (modalSplitSlider) {
    const modalColorLayer = document.getElementById("modalSplitColorLayer");
    const modalDivider = document.getElementById("modalSplitDivider");
    const modalThumb = document.getElementById("modalSplitThumb");

    function renderModalSlider(pct) {
      const clamped = Math.max(0, Math.min(100, pct));
      if (modalColorLayer) {
        modalColorLayer.style.clipPath = `polygon(0 0, ${clamped}% 0, ${clamped}% 100%, 0 100%)`;
      }
      if (modalDivider) modalDivider.style.left = `${clamped}%`;
      if (modalThumb) modalThumb.style.left = `${clamped}%`;
      modalSplitSlider.setAttribute("aria-valuenow", Math.round(clamped));
    }

    let isModalDragging = false;
    function calcModalPercent(clientX) {
      const rect = modalSplitSlider.getBoundingClientRect();
      if (rect.width === 0) return 50;
      return ((clientX - rect.left) / rect.width) * 100;
    }

    modalSplitSlider.addEventListener("pointerdown", (e) => {
      isModalDragging = true;
      try { modalSplitSlider.setPointerCapture(e.pointerId); } catch (err) {}
      renderModalSlider(calcModalPercent(e.clientX));
    });

    modalSplitSlider.addEventListener("pointermove", (e) => {
      if (!isModalDragging) return;
      renderModalSlider(calcModalPercent(e.clientX));
    });

    const stopModalDrag = () => { isModalDragging = false; };
    modalSplitSlider.addEventListener("pointerup", stopModalDrag);
    modalSplitSlider.addEventListener("pointercancel", stopModalDrag);
    modalSplitSlider.addEventListener("lostpointercapture", stopModalDrag);

    renderModalSlider(50);
  }

  // Modal 1 Video Controls (simVideoPlayer)
  const simVideoPlayer = document.getElementById("simVideoPlayer");
  const simVideoPlayOverlayBtn = document.getElementById("simVideoPlayOverlayBtn");
  const btnToggleVideoPlay = document.getElementById("btnToggleVideoPlay");
  const btnToggleVideoMute = document.getElementById("btnToggleVideoMute");
  const btnRestartVideo = document.getElementById("btnRestartVideo");
  const videoTimelineSlider = document.getElementById("videoTimelineSlider");
  const videoTimeDisplay = document.getElementById("videoTimeDisplay");
  const simVideoContainer = document.getElementById("simVideoContainer");
  const videoPlayIcon = document.getElementById("videoPlayIcon");
  const videoPlayLabel = document.getElementById("videoPlayLabel");
  const videoMuteIcon = document.getElementById("videoMuteIcon");
  const videoMuteLabel = document.getElementById("videoMuteLabel");

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  function toggleSimVideo() {
    if (!simVideoPlayer) return;
    if (simVideoPlayer.paused) {
      simVideoPlayer.play().catch(() => {});
      if (simVideoContainer) simVideoContainer.classList.add("is-playing");
      if (videoPlayIcon) videoPlayIcon.textContent = "⏸";
      if (videoPlayLabel) videoPlayLabel.textContent = "Pause Video";
      if (btnToggleVideoPlay) btnToggleVideoPlay.classList.add("active");
    } else {
      simVideoPlayer.pause();
      if (simVideoContainer) simVideoContainer.classList.remove("is-playing");
      if (videoPlayIcon) videoPlayIcon.textContent = "▶";
      if (videoPlayLabel) videoPlayLabel.textContent = "Play Video";
      if (btnToggleVideoPlay) btnToggleVideoPlay.classList.remove("active");
    }
  }

  if (simVideoPlayOverlayBtn) simVideoPlayOverlayBtn.addEventListener("click", toggleSimVideo);
  if (btnToggleVideoPlay) btnToggleVideoPlay.addEventListener("click", toggleSimVideo);
  if (simVideoPlayer) {
    simVideoPlayer.addEventListener("click", toggleSimVideo);
    simVideoPlayer.addEventListener("timeupdate", () => {
      const cur = simVideoPlayer.currentTime;
      const dur = simVideoPlayer.duration || 0;
      if (videoTimeDisplay && dur > 0) {
        videoTimeDisplay.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
      }
      if (videoTimelineSlider && dur > 0) {
        videoTimelineSlider.value = (cur / dur) * 100;
      }
    });
  }

  if (btnToggleVideoMute && simVideoPlayer) {
    btnToggleVideoMute.addEventListener("click", () => {
      simVideoPlayer.muted = !simVideoPlayer.muted;
      const muted = simVideoPlayer.muted;
      if (videoMuteIcon) videoMuteIcon.textContent = muted ? "🔇" : "🔊";
      if (videoMuteLabel) videoMuteLabel.textContent = muted ? "Sound: Muted" : "Sound: Unmuted";
      btnToggleVideoMute.classList.toggle("active", !muted);
    });
  }

  if (btnRestartVideo && simVideoPlayer) {
    btnRestartVideo.addEventListener("click", () => {
      simVideoPlayer.currentTime = 0;
      simVideoPlayer.play().catch(() => {});
    });
  }

  if (videoTimelineSlider && simVideoPlayer) {
    videoTimelineSlider.addEventListener("input", (e) => {
      const pct = parseFloat(e.target.value);
      const dur = simVideoPlayer.duration || 0;
      if (dur > 0) {
        simVideoPlayer.currentTime = (pct / 100) * dur;
      }
    });
  }

  // Open & Close Modal 1
  if (btnSimColor && simColorModal) {
    btnSimColor.addEventListener("click", () => {
      simColorModal.classList.add("open");
      if (simVideoPlayer) simVideoPlayer.play().catch(() => {});
    });
  }
  if (btnCloseColorModal && simColorModal) {
    btnCloseColorModal.addEventListener("click", () => {
      simColorModal.classList.remove("open");
      if (simVideoPlayer) simVideoPlayer.pause();
    });
  }

  // Modal 2: Real 3D Model Interactive Orbit Viewer (article-model.glb)
  let sim3dAnimationId = null;
  let threeRenderer = null;
  let threeScene = null;
  let threeCamera = null;
  let currentModelGroup = null;
  let isModelLoaded = false;
  let autoSpin = true;
  let isWireframe = false;

  function init3DPreview(canvas) {
    if (!canvas) return;

    const width = canvas.clientWidth || 400;
    const height = canvas.clientHeight || 300;
    canvas.width = width;
    canvas.height = height;

    if (!window.THREE) {
      console.warn("THREE.js not available for 3D preview");
      return;
    }

    if (!threeRenderer) {
      try {
        threeRenderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        threeRenderer.setSize(width, height, false);
        threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        threeScene = new THREE.Scene();
        threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        threeCamera.position.set(0, 0, 3.8);

        const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
        threeScene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6);
        dirLight1.position.set(2, 4, 3);
        threeScene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0xd4b896, 1.0);
        dirLight2.position.set(-2, -3, -2);
        threeScene.add(dirLight2);

        // Orbit drag controls
        let isDragging = false;
        let lastX = 0;
        let lastY = 0;

        canvas.addEventListener("pointerdown", (e) => {
          isDragging = true;
          lastX = e.clientX;
          lastY = e.clientY;
          try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
        });

        canvas.addEventListener("pointermove", (e) => {
          if (!isDragging || !currentModelGroup) return;
          const dx = e.clientX - lastX;
          const dy = e.clientY - lastY;
          currentModelGroup.rotation.y += dx * 0.012;
          currentModelGroup.rotation.x += dy * 0.012;
          lastX = e.clientX;
          lastY = e.clientY;
        });

        const stopDrag = () => { isDragging = false; };
        canvas.addEventListener("pointerup", stopDrag);
        canvas.addEventListener("pointercancel", stopDrag);

        const btnToggleSpin = document.getElementById("btnToggleSpin");
        if (btnToggleSpin) {
          btnToggleSpin.onclick = () => {
            autoSpin = !autoSpin;
            btnToggleSpin.textContent = autoSpin ? "Auto-Spin: ON" : "Auto-Spin: OFF";
            btnToggleSpin.classList.toggle("active", autoSpin);
          };
        }

        const btnToggleWire = document.getElementById("btnToggleWire");
        if (btnToggleWire) {
          btnToggleWire.onclick = () => {
            isWireframe = !isWireframe;
            btnToggleWire.textContent = isWireframe ? "Wireframe: ON" : "Wireframe Mode";
            btnToggleWire.classList.toggle("active", isWireframe);
            if (currentModelGroup) {
              currentModelGroup.traverse((child) => {
                if (child.isMesh && child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach((m) => { m.wireframe = isWireframe; });
                  } else {
                    child.material.wireframe = isWireframe;
                  }
                }
              });
            }
          };
        }

        // Load the actual production GLB model: article-model.glb
        if (window.THREE.GLTFLoader) {
          const loader = new THREE.GLTFLoader();
          loader.load(
            "./assets/models/article-model.glb",
            (gltf) => {
              console.log("✓ Successfully loaded article-model.glb for 3D Inspector");
              const model = gltf.scene;

              // Center and scale model to fit view
              const box = new THREE.Box3().setFromObject(model);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z) || 1;

              model.position.sub(center);
              const scale = 2.4 / maxDim;
              model.scale.set(scale, scale, scale);

              currentModelGroup = new THREE.Group();
              currentModelGroup.add(model);
              threeScene.add(currentModelGroup);
              isModelLoaded = true;
            },
            undefined,
            (err) => {
              console.error("Error loading article-model.glb:", err);
            }
          );
        }
      } catch (e) {
        console.error("WebGL init error:", e);
      }
    }

    // Render loop
    function render() {
      if (!sim3DModal || !sim3DModal.classList.contains("open")) {
        sim3dAnimationId = null;
        return;
      }

      const w = canvas.clientWidth || 400;
      const h = canvas.clientHeight || 300;
      if (canvas.width !== w || canvas.height !== h) {
        threeRenderer.setSize(w, h, false);
        threeCamera.aspect = w / h;
        threeCamera.updateProjectionMatrix();
      }

      if (currentModelGroup && autoSpin) {
        currentModelGroup.rotation.y += 0.008;
      }

      if (threeRenderer && threeScene && threeCamera) {
        threeRenderer.render(threeScene, threeCamera);
      }

      sim3dAnimationId = requestAnimationFrame(render);
    }

    if (sim3dAnimationId) cancelAnimationFrame(sim3dAnimationId);
    sim3dAnimationId = requestAnimationFrame(render);
  }

  // Open & Close Modal 2
  if (btnSim3D && sim3DModal) {
    btnSim3D.addEventListener("click", () => {
      sim3DModal.classList.add("open");
      const previewCanvas = document.getElementById("preview3DCanvas");
      if (previewCanvas) init3DPreview(previewCanvas);
    });
  }
  if (btnClose3DModal && sim3DModal) {
    btnClose3DModal.addEventListener("click", () => {
      sim3DModal.classList.remove("open");
      if (sim3dAnimationId) {
        cancelAnimationFrame(sim3dAnimationId);
        sim3dAnimationId = null;
      }
    });
  }
});
