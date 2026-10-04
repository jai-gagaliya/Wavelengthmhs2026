/**
 * WAVELENGTH — Edition 47
 * Audiobook Library Controller
 *
 * Implements single-stream playback enforcement, custom waveform scrubbing,
 * duration parsing, and graceful audio fallback handling.
 */

document.addEventListener("DOMContentLoaded", () => {
  const articlesContainer = document.getElementById("audioArticlesGrid");
  const nowPlayingStatusText = document.getElementById("nowPlayingStatus");

  // Track global playback state
  let currentAudioInstance = null;
  let currentActiveCard = null;
  let synthAudioCtx = null;
  let synthInterval = null;

  // SVG Vector Audio Icons (No Emojis)
  const ICON_VOL_HIGH = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;
  const ICON_VOL_LOW = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
  const ICON_MUTE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;

  // Format seconds to M:SS or MM:SS
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  // Stop any currently playing audio across the entire page
  function stopCurrentAudio() {
    if (currentAudioInstance) {
      currentAudioInstance.pause();
    }
    if (currentActiveCard) {
      currentActiveCard.classList.remove("is-active-playing");
      const playBtn = currentActiveCard.querySelector(".btn-play-pause");
      if (playBtn) {
        playBtn.classList.remove("playing");
        playBtn.innerHTML = "▶";
        playBtn.setAttribute("aria-label", "Play narration");
      }
      const statusBadge = currentActiveCard.querySelector(".player-status-badge");
      if (statusBadge && !statusBadge.classList.contains("status-error")) {
        statusBadge.textContent = "Paused";
        statusBadge.className = "player-status-badge";
      }
    }
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
  }

  // Built-in WebAudio synthesizer for previewing when real MP3/WAV is pending
  function playSynthFallback(article, card) {
    stopCurrentAudio();
    currentActiveCard = card;
    card.classList.add("is-active-playing");

    if (!synthAudioCtx) {
      synthAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (synthAudioCtx.state === "suspended") {
      synthAudioCtx.resume();
    }

    const playBtn = card.querySelector(".btn-play-pause");
    const fillBar = card.querySelector(".scrubber-fill");
    const thumb = card.querySelector(".scrubber-thumb");
    const elapsedEl = card.querySelector(".time-elapsed");
    const totalEl = card.querySelector(".time-total");
    const statusBadge = card.querySelector(".player-status-badge");

    playBtn.classList.add("playing");
    playBtn.innerHTML = "❚❚";
    statusBadge.textContent = "Preview Tone";
    statusBadge.className = "player-status-badge status-playing";

    if (nowPlayingStatusText) {
      nowPlayingStatusText.textContent = `Preview Tone: ${article.title}`;
    }

    const duration = 20; // 20s test duration
    totalEl.textContent = formatTime(duration);
    let elapsed = 0;

    // Play periodic ambient chime
    function chime() {
      if (!synthAudioCtx || !card.classList.contains("is-active-playing")) return;
      const osc = synthAudioCtx.createOscillator();
      const gain = synthAudioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = 220 + Math.random() * 220;
      gain.gain.setValueAtTime(0.001, synthAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, synthAudioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, synthAudioCtx.currentTime + 1.2);
      osc.connect(gain).connect(synthAudioCtx.destination);
      osc.start();
      osc.stop(synthAudioCtx.currentTime + 1.25);
    }

    chime();
    synthInterval = setInterval(() => {
      elapsed += 0.5;
      if (elapsed > duration) {
        stopCurrentAudio();
        elapsedEl.textContent = formatTime(0);
        fillBar.style.width = "0%";
        thumb.style.left = "0%";
        if (nowPlayingStatusText) {
          nowPlayingStatusText.textContent = "Playback Finished";
        }
        return;
      }
      if (Math.floor(elapsed) % 2 === 0) chime();
      elapsedEl.textContent = formatTime(elapsed);
      const pct = (elapsed / duration) * 100;
      fillBar.style.width = `${pct}%`;
      thumb.style.left = `${pct}%`;
    }, 500);
  }

  // Render audiobook cards dynamically from configuration
  function renderAudiobookCards() {
    if (!articlesContainer) return;
    const articles = (window.WAVELENGTH_CONFIG && window.WAVELENGTH_CONFIG.audiobooks) || [];

    articlesContainer.innerHTML = "";

    articles.forEach((article) => {
      const card = document.createElement("article");
      card.className = "audio-card";
      card.id = `card-${article.id}`;
      card.setAttribute("data-id", article.id);

      card.innerHTML = `
        <div class="audio-cover-wrap">
          <img class="audio-cover-img" src="${article.coverImage}" alt="${article.title} cover artwork" loading="lazy" />
          <span class="audio-card-badge">${article.category}</span>
          <span class="audio-card-duration-badge" id="dur-${article.id}">--:--</span>
        </div>

        <div class="audio-card-body">
          <span class="audio-article-num">Article ${article.number}</span>
          <h2 class="audio-article-title">${article.title}</h2>
          <p class="audio-article-credits">${article.author} · ${article.narrator}</p>
          <p class="audio-article-desc">${article.description}</p>

          <!-- Custom Player Widget -->
          <div class="custom-player-widget">
            <audio id="audio-${article.id}" src="${article.audioSrc}" preload="metadata"></audio>

            <div class="player-controls-row">
              <button class="btn-play-pause" type="button" aria-label="Play narration for ${article.title}">
                ▶
              </button>

              <div class="player-wave-indicator" aria-hidden="true">
                <span class="wave-bar"></span>
                <span class="wave-bar"></span>
                <span class="wave-bar"></span>
                <span class="wave-bar"></span>
              </div>

              <div class="scrubber-container">
                <div class="scrubber-track" role="slider" tabindex="0" aria-label="Audio progress scrub bar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                  <div class="scrubber-fill"></div>
                  <div class="scrubber-thumb"></div>
                </div>
                <div class="player-time-row">
                  <span class="time-elapsed">0:00</span>
                  <span class="time-total">--:--</span>
                </div>
              </div>
            </div>

            <div class="player-bottom-row">
              <span class="player-status-badge">Ready to Play</span>

              <div class="volume-control-group">
                <button class="btn-mute" type="button" aria-label="Toggle mute">
                  ${ICON_VOL_HIGH}
                </button>
                <input class="volume-slider" type="range" min="0" max="1" step="0.05" value="0.9" aria-label="Volume level" />
              </div>
            </div>

            <!-- Missing File Warning Banner -->
            <div class="missing-audio-banner">
              <span>Audio asset pending in assets/audio/</span>
              <button class="btn-test-tone" type="button">Test Preview</button>
            </div>
          </div>
        </div>
      `;

      articlesContainer.appendChild(card);
      setupAudioPlayer(card, article);
    });
  }

  // Setup individual audio element and player interaction
  function setupAudioPlayer(card, article) {
    const audio = card.querySelector("audio");
    const playBtn = card.querySelector(".btn-play-pause");
    const scrubberTrack = card.querySelector(".scrubber-track");
    const fillBar = card.querySelector(".scrubber-fill");
    const thumb = card.querySelector(".scrubber-thumb");
    const timeElapsed = card.querySelector(".time-elapsed");
    const timeTotal = card.querySelector(".time-total");
    const topDurationBadge = card.querySelector(`#dur-${article.id}`);
    const statusBadge = card.querySelector(".player-status-badge");
    const muteBtn = card.querySelector(".btn-mute");
    const volumeSlider = card.querySelector(".volume-slider");
    const missingBanner = card.querySelector(".missing-audio-banner");
    const testToneBtn = card.querySelector(".btn-test-tone");

    let isScrubbing = false;

    // Load metadata to set duration display
    audio.addEventListener("loadedmetadata", () => {
      const durStr = formatTime(audio.duration);
      timeTotal.textContent = durStr;
      if (topDurationBadge) topDurationBadge.textContent = durStr;
      statusBadge.textContent = "Audio Ready";
    });

    // Time update listener
    audio.addEventListener("timeupdate", () => {
      if (isScrubbing || !audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      fillBar.style.width = `${pct}%`;
      thumb.style.left = `${pct}%`;
      timeElapsed.textContent = formatTime(audio.currentTime);
      scrubberTrack.setAttribute("aria-valuenow", Math.round(pct));
    });

    // Handle track ended
    audio.addEventListener("ended", () => {
      card.classList.remove("is-active-playing");
      playBtn.classList.remove("playing");
      playBtn.innerHTML = "▶";
      playBtn.setAttribute("aria-label", "Play narration");
      fillBar.style.width = "0%";
      thumb.style.left = "0%";
      timeElapsed.textContent = "0:00";
      statusBadge.textContent = "Completed";
      statusBadge.className = "player-status-badge";
      if (nowPlayingStatusText) {
        nowPlayingStatusText.textContent = "Playback Completed";
      }
    });

    // Handle Audio Errors (e.g. 404 or missing file)
    audio.addEventListener("error", () => {
      statusBadge.textContent = "File Missing";
      statusBadge.className = "player-status-badge status-error";
      if (missingBanner) missingBanner.style.display = "flex";
      timeTotal.textContent = "Pending";
      if (topDurationBadge) topDurationBadge.textContent = "Pending";
    });

    // Toggle Play/Pause
    function togglePlay() {
      if (audio.paused) {
        // Enforce single active audio stream
        stopCurrentAudio();

        currentAudioInstance = audio;
        currentActiveCard = card;

        audio.play().then(() => {
          card.classList.add("is-active-playing");
          playBtn.classList.add("playing");
          playBtn.innerHTML = "❚❚";
          playBtn.setAttribute("aria-label", "Pause narration");
          statusBadge.textContent = "Now Playing";
          statusBadge.className = "player-status-badge status-playing";
          if (nowPlayingStatusText) {
            nowPlayingStatusText.textContent = `Now Playing: ${article.title}`;
          }
        }).catch((err) => {
          console.warn("Audio playback interrupted or file unavailable:", err);
          statusBadge.textContent = "File Pending";
          statusBadge.className = "player-status-badge status-error";
          if (missingBanner) missingBanner.style.display = "flex";
        });
      } else {
        audio.pause();
        card.classList.remove("is-active-playing");
        playBtn.classList.remove("playing");
        playBtn.innerHTML = "▶";
        playBtn.setAttribute("aria-label", "Play narration");
        statusBadge.textContent = "Paused";
        statusBadge.className = "player-status-badge";
        if (nowPlayingStatusText) {
          nowPlayingStatusText.textContent = `Paused: ${article.title}`;
        }
      }
    }

    playBtn.addEventListener("click", togglePlay);

    // Test tone fallback button
    if (testToneBtn) {
      testToneBtn.addEventListener("click", () => {
        playSynthFallback(article, card);
      });
    }

    // Scrubber seeking calculations
    function seekToPosition(clientX) {
      if (!audio.duration) return;
      const rect = scrubberTrack.getBoundingClientRect();
      let clickPos = (clientX - rect.left) / rect.width;
      clickPos = Math.max(0, Math.min(1, clickPos));
      audio.currentTime = clickPos * audio.duration;
      fillBar.style.width = `${clickPos * 100}%`;
      thumb.style.left = `${clickPos * 100}%`;
      timeElapsed.textContent = formatTime(audio.currentTime);
    }

    scrubberTrack.addEventListener("mousedown", (e) => {
      isScrubbing = true;
      seekToPosition(e.clientX);
    });

    window.addEventListener("mousemove", (e) => {
      if (!isScrubbing) return;
      seekToPosition(e.clientX);
    });

    window.addEventListener("mouseup", () => {
      isScrubbing = false;
    });

    // Touch scrubbing for mobile
    scrubberTrack.addEventListener("touchstart", (e) => {
      isScrubbing = true;
      if (e.touches.length > 0) seekToPosition(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (!isScrubbing) return;
      if (e.touches.length > 0) seekToPosition(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener("touchend", () => {
      isScrubbing = false;
    });

    // Volume & Mute Controls
    function updateVolumeIcon() {
      if (audio.muted || audio.volume === 0) {
        muteBtn.innerHTML = ICON_MUTE;
      } else if (audio.volume < 0.5) {
        muteBtn.innerHTML = ICON_VOL_LOW;
      } else {
        muteBtn.innerHTML = ICON_VOL_HIGH;
      }
    }

    if (volumeSlider) {
      volumeSlider.addEventListener("input", (e) => {
        audio.volume = parseFloat(e.target.value);
        audio.muted = audio.volume === 0;
        updateVolumeIcon();
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        audio.muted = !audio.muted;
        updateVolumeIcon();
      });
    }
  }

  // Initialize
  renderAudiobookCards();
});
