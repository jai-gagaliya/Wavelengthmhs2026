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
      demoCore.setAttribute("material", "color: #8c5e35; roughness: 0.15; metalness: 0.85; wireframe: false");

      const demoRing1 = document.createElement("a-torus");
      demoRing1.setAttribute("radius", "1.2");
      demoRing1.setAttribute("radius-tubular", "0.025");
      demoRing1.setAttribute("rotation", "45 0 0");
      demoRing1.setAttribute("material", "color: #d4b896; metalness: 0.8; roughness: 0.2");

      const demoRing2 = document.createElement("a-torus");
      demoRing2.setAttribute("radius", "1.4");
      demoRing2.setAttribute("radius-tubular", "0.02");
      demoRing2.setAttribute("rotation", "-45 45 0");
      demoRing2.setAttribute("material", "color: #c5913e; metalness: 0.9; roughness: 0.15");

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

  // Exit Buttons & Keyboard Escape / Modal dismissals
  if (btnExitAR) btnExitAR.addEventListener("click", exitAR);

  // Helper to format mm:ss
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  // Close modals on backdrop click
  [simColorModal, sim3DModal].forEach((modal) => {
    if (!modal) return;
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("open");
        if (modal === simColorModal) {
          pauseSimVideo();
        }
        if (modal === sim3DModal && sim3DAnimId) {
          cancelAnimationFrame(sim3DAnimId);
          sim3DAnimId = null;
        }
      }
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (isARActive) exitAR();
      if (simColorModal && simColorModal.classList.contains("open")) {
        simColorModal.classList.remove("open");
        pauseSimVideo();
      }
      if (sim3DModal && sim3DModal.classList.contains("open")) {
        sim3DModal.classList.remove("open");
        if (sim3DAnimId) {
          cancelAnimationFrame(sim3DAnimId);
          sim3DAnimId = null;
        }
      }
    }
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

  // Simulator 1: Chromatic Motion Video Preview Player (wavy.mp4)
  const videoPlayer = document.getElementById("simVideoPlayer");
  const videoContainer = document.getElementById("simVideoContainer");
  const videoPlayOverlayBtn = document.getElementById("simVideoPlayOverlayBtn");
  const btnToggleVideoPlay = document.getElementById("btnToggleVideoPlay");
  const btnToggleVideoMute = document.getElementById("btnToggleVideoMute");
  const btnRestartVideo = document.getElementById("btnRestartVideo");
  const videoTimelineSlider = document.getElementById("videoTimelineSlider");
  const videoTimeDisplay = document.getElementById("videoTimeDisplay");
  const videoPlayIcon = document.getElementById("videoPlayIcon");
  const videoPlayLabel = document.getElementById("videoPlayLabel");
  const videoMuteIcon = document.getElementById("videoMuteIcon");
  const videoMuteLabel = document.getElementById("videoMuteLabel");

  if (btnSimColor && simColorModal) {
    btnSimColor.addEventListener("click", () => {
      simColorModal.classList.add("open");
      initSimVideoPlayer();
    });
  }
  if (btnCloseColorModal && simColorModal) {
    btnCloseColorModal.addEventListener("click", () => {
      simColorModal.classList.remove("open");
      pauseSimVideo();
    });
  }

  let simVideoInitialized = false;
  let isVideoSeeking = false;

  function initSimVideoPlayer() {
    if (!videoPlayer) return;

    if (!simVideoInitialized) {
      simVideoInitialized = true;

      function updatePlayUI(isPlaying) {
        if (videoContainer) {
          videoContainer.classList.toggle("is-playing", isPlaying);
        }
        if (videoPlayIcon) {
          videoPlayIcon.textContent = isPlaying ? "⏸" : "▶";
        }
        if (videoPlayLabel) {
          videoPlayLabel.textContent = isPlaying ? "Pause Video" : "Play Video";
        }
        if (btnToggleVideoPlay) {
          btnToggleVideoPlay.classList.toggle("active", isPlaying);
        }
      }

      function togglePlay() {
        if (videoPlayer.paused || videoPlayer.ended) {
          videoPlayer.play().then(() => {
            updatePlayUI(true);
          }).catch((err) => {
            console.warn("Video play prevented:", err);
          });
        } else {
          videoPlayer.pause();
          updatePlayUI(false);
        }
      }

      function toggleMute() {
        videoPlayer.muted = !videoPlayer.muted;
        const isMuted = videoPlayer.muted;
        if (videoMuteIcon) {
          videoMuteIcon.textContent = isMuted ? "🔇" : "🔊";
        }
        if (videoMuteLabel) {
          videoMuteLabel.textContent = isMuted ? "Sound: Muted" : "Sound: Unmuted";
        }
        if (btnToggleVideoMute) {
          btnToggleVideoMute.classList.toggle("active", !isMuted);
        }
      }

      function restartVideo() {
        videoPlayer.currentTime = 0;
        videoPlayer.play().then(() => {
          updatePlayUI(true);
        }).catch(() => {});
      }

      if (btnToggleVideoPlay) btnToggleVideoPlay.addEventListener("click", togglePlay);
      if (videoPlayOverlayBtn) videoPlayOverlayBtn.addEventListener("click", togglePlay);
      if (videoPlayer) videoPlayer.addEventListener("click", togglePlay);
      if (btnToggleVideoMute) btnToggleVideoMute.addEventListener("click", toggleMute);
      if (btnRestartVideo) btnRestartVideo.addEventListener("click", restartVideo);

      videoPlayer.addEventListener("timeupdate", () => {
        const current = videoPlayer.currentTime;
        const duration = videoPlayer.duration || 0;
        if (videoTimeDisplay && duration > 0) {
          videoTimeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
        }
        if (videoTimelineSlider && duration > 0 && !isVideoSeeking) {
          videoTimelineSlider.value = (current / duration) * 100;
        }
      });

      videoPlayer.addEventListener("loadedmetadata", () => {
        if (videoTimeDisplay) {
          videoTimeDisplay.textContent = `0:00 / ${formatTime(videoPlayer.duration || 0)}`;
        }
      });

      videoPlayer.addEventListener("play", () => updatePlayUI(true));
      videoPlayer.addEventListener("pause", () => updatePlayUI(false));
      videoPlayer.addEventListener("ended", () => updatePlayUI(false));

      if (videoTimelineSlider) {
        videoTimelineSlider.addEventListener("input", (e) => {
          isVideoSeeking = true;
          const val = parseFloat(e.target.value);
          const duration = videoPlayer.duration || 0;
          if (duration > 0 && videoTimeDisplay) {
            const seekTime = (val / 100) * duration;
            videoTimeDisplay.textContent = `${formatTime(seekTime)} / ${formatTime(duration)}`;
          }
        });

        videoTimelineSlider.addEventListener("change", (e) => {
          const val = parseFloat(e.target.value);
          const duration = videoPlayer.duration || 0;
          if (duration > 0) {
            videoPlayer.currentTime = (val / 100) * duration;
          }
          isVideoSeeking = false;
        });
      }
    }

    videoPlayer.play().catch(() => {
      videoPlayer.muted = true;
      if (videoMuteIcon) videoMuteIcon.textContent = "🔇";
      if (videoMuteLabel) videoMuteLabel.textContent = "Sound: Muted";
      videoPlayer.play().catch(() => {});
    });
  }

  function pauseSimVideo() {
    if (videoPlayer && !videoPlayer.paused) {
      videoPlayer.pause();
      if (videoContainer) videoContainer.classList.remove("is-playing");
      if (videoPlayIcon) videoPlayIcon.textContent = "▶";
      if (videoPlayLabel) videoPlayLabel.textContent = "Play Video";
      if (btnToggleVideoPlay) btnToggleVideoPlay.classList.remove("active");
    }
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
      cleanup3DViewer();
    });
  }

  function cleanup3DViewer() {
    if (sim3DAnimId) {
      cancelAnimationFrame(sim3DAnimId);
      sim3DAnimId = null;
    }
    if (activeThreeRenderer) {
      try {
        activeThreeRenderer.dispose();
      } catch (err) {}
      activeThreeRenderer = null;
    }
  }

  let sim3DAnimId = null;
  let activeThreeRenderer = null;

  function initSim3DViewer() {
    cleanup3DViewer();

    const canvas = document.getElementById("preview3DCanvas");
    if (!canvas) return;

    // Check if Three.js and GLTFLoader are available
    const THREE_LIB = window.THREE || (window.AFRAME && window.AFRAME.THREE);
    if (THREE_LIB && THREE_LIB.GLTFLoader && THREE_LIB.WebGLRenderer) {
      try {
        initThreeGLBViewer(THREE_LIB, canvas);
        return;
      } catch (err) {
        console.warn("WebGL GLB viewer initialization failed, using canvas fallback:", err);
      }
    }

    initFallbackCanvasCrystal(canvas);
  }

  // Interactive WebGL GLB Model Orbit Engine
  function initThreeGLBViewer(THREE_LIB, canvas) {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 375;

    const renderer = new THREE_LIB.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    activeThreeRenderer = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE_LIB.Scene();
    scene.background = new THREE_LIB.Color(0xffffff);

    const camera = new THREE_LIB.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.2);

    const ambLight = new THREE_LIB.AmbientLight(0xfff8ee, 1.4);
    scene.add(ambLight);

    const dirLight1 = new THREE_LIB.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE_LIB.DirectionalLight(0xd4b896, 0.8);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    const pivot = new THREE_LIB.Group();
    scene.add(pivot);

    let autoSpin = true;
    let wireframeOnly = false;
    let isDragging = false;
    let lastX = 0, lastY = 0;

    const btnSpin = document.getElementById("btnToggleSpin");
    const btnWire = document.getElementById("btnToggleWire");

    if (btnSpin) {
      btnSpin.onclick = () => {
        autoSpin = !autoSpin;
        btnSpin.classList.toggle("active", autoSpin);
      };
    }

    let loadedModel = null;
    if (btnWire) {
      btnWire.onclick = () => {
        wireframeOnly = !wireframeOnly;
        btnWire.classList.toggle("active", wireframeOnly);
        if (loadedModel) {
          loadedModel.traverse((child) => {
            if (child.isMesh && child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => (m.wireframe = wireframeOnly));
              } else {
                child.material.wireframe = wireframeOnly;
              }
            }
          });
        }
      };
    }

    const loader = new THREE_LIB.GLTFLoader();
    loader.load(
      "./assets/models/article-model.glb",
      (gltf) => {
        loadedModel = gltf.scene;

        const box = new THREE_LIB.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE_LIB.Vector3());
        const size = box.getSize(new THREE_LIB.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.9 / (maxDim || 1);

        loadedModel.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        loadedModel.scale.set(scale, scale, scale);

        pivot.add(loadedModel);
      },
      undefined,
      (err) => {
        console.warn("Failed to load GLB file, falling back to procedural canvas:", err);
        cleanup3DViewer();
        initFallbackCanvasCrystal(canvas);
      }
    );

    canvas.style.touchAction = "none";
    canvas.onpointerdown = (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
    };

    canvas.onpointermove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      pivot.rotation.y += dx * 0.008;
      pivot.rotation.x += dy * 0.008;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const stopDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        if (canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}
    };
    canvas.onpointerup = stopDrag;
    canvas.onpointercancel = stopDrag;

    canvas.onwheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(1.2, Math.min(7.0, camera.position.z + e.deltaY * 0.003));
    };

    function renderThree() {
      if (!sim3DModal || !sim3DModal.classList.contains("open")) {
        cleanup3DViewer();
        return;
      }
      if (autoSpin && !isDragging) {
        pivot.rotation.y += 0.008;
      }
      renderer.render(scene, camera);
      sim3DAnimId = requestAnimationFrame(renderThree);
    }
    renderThree();
  }

  // Pure Vanilla Canvas 3D Topological Crystal Rendering Engine (Fallback)
  function initFallbackCanvasCrystal(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

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
    let isPointerDown = false;
    let lastPointerX = 0, lastPointerY = 0;

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

    canvas.style.touchAction = "none";
    canvas.onpointerdown = (e) => {
      isPointerDown = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
    };

    canvas.onpointermove = (e) => {
      if (!isPointerDown) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      rotY += dx * 0.008;
      rotX += dy * 0.008;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };

    function endPointerDrag(e) {
      if (!isPointerDown) return;
      isPointerDown = false;
      try {
        if (canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}
    }

    canvas.onpointerup = endPointerDrag;
    canvas.onpointercancel = endPointerDrag;

    function render3D() {
      if (!sim3DModal || !sim3DModal.classList.contains("open")) {
        cleanup3DViewer();
        return;
      }

      ctx.clearRect(0, 0, rect.width, rect.height);

      if (autoSpin && !isPointerDown) {
        rotY += 0.012;
        rotX += 0.006;
      }

      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const scale = Math.min(rect.width, rect.height) * 0.35;

      const projected = vertices.map(([x, y, z]) => {
        let x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
        let z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);
        let y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);

        const dist = 3.2;
        const pz = z2 + dist;
        const px = cx + (x1 / pz) * scale * 2.2;
        const py = cy - (y2 / pz) * scale * 2.2;
        return { px, py, pz, z2 };
      });

      ctx.lineWidth = 1.8;
      edges.forEach(([i, j]) => {
        const p1 = projected[i];
        const p2 = projected[j];
        const avgZ = (p1.z2 + p2.z2) / 2;
        const alpha = Math.max(0.18, Math.min(0.92, (avgZ + 1.2) / 2.4));

        ctx.strokeStyle = `rgba(140, 94, 53, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      });

      projected.forEach((p) => {
        const radius = Math.max(2.2, (p.z2 + 1.5) * 2.8);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(140, 94, 53, 0.7)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = "rgba(212, 184, 150, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, scale * 1.35, scale * 0.45, rotY * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(197, 145, 62, 0.45)";
      ctx.beginPath();
      ctx.ellipse(0, 0, scale * 1.55, scale * 0.55, -rotY * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      sim3DAnimId = requestAnimationFrame(render3D);
    }

    render3D();
  }

  // Deep-link URL hash support for opening simulators
  function checkUrlHash() {
    const hash = window.location.hash;
    if (hash === "#simColorModal" && simColorModal) {
      simColorModal.classList.add("open");
      initSimVideoPlayer();
    } else if (hash === "#sim3DModal" && sim3DModal) {
      sim3DModal.classList.add("open");
      initSim3DViewer();
    }
  }

  checkUrlHash();
  window.addEventListener("hashchange", checkUrlHash);
});
