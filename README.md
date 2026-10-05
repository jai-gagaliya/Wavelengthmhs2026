# Wavelength — Edition 47
## Digital & Augmented Reality Magazine Companion

A digital extension for the physical print edition of **Wavelength Magazine**. The print edition is published in monochrome; this web platform extends the reading experience into author-narrated audiobooks, WebAR colour reveals, and interactive 3D models.

---

## Project Architecture

```
MHS 2026/
├── index.html                   # Cinematic landing page (Dual portal: Audiobooks vs VFX)
├── audiobooks.html              # Audiobook library with custom waveform players
├── vfx.html                     # VFX & MindAR Augmented Reality Hub
├── css/
│   ├── styles.css               # Shared design system, dark luxury tokens, typography
│   ├── audio.css                # Audiobook cards, waveform scrubbers, volume controls
│   └── ar.css                   # AR camera viewport, scanning reticle, HUD status badges
├── js/
│   ├── config.js                # Central configuration (Metadata, Audiobooks, MindAR targets)
│   ├── main.js                  # Landing page interactions & monochrome-to-colour slider
│   ├── audio.js                 # Single-stream audio playback controller & WebAudio fallback
│   └── ar.js                    # MindAR tracking lifecycle, target events & non-AR simulators
├── assets/
│   ├── audio/                   # Generated sample WAV files & future author MP3 recordings
│   ├── images/
│   │   ├── logo.svg             # Vector typographic brand logo
│   │   ├── bw-print-sample.svg  # Sample monochrome print illustration (Page 14)
│   │   ├── color-overlay-sample.svg # Digital colour counterpart revealed in AR
│   │   ├── marker-print-sample.svg  # 3D model anchor marker (Page 28)
│   │   └── covers/              # Editorial SVG covers for Articles 01–05
│   ├── targets/
│   │   ├── targets.mind         # Compiled MindAR target file
│   │   └── README.md            # Target compilation instructions
│   └── models/
│       └── README.md            # 3D Model specifications & placement guide
└── README.md                    # Comprehensive deployment and asset guide
```

---

## Running the Project Locally

Because MindAR and modern browser camera APIs (`navigator.mediaDevices.getUserMedia`) require a secure context or `localhost`, serve this project with a local HTTP server:

### Option 1: Python (Built-in)
```bash
# Navigate to the project root directory
cd "/Users/jaigagaliya/Desktop/wavelength/MHS 2026"

# Run Python's built-in web server
python3 -m http.server 8000
```
Open your browser at: **`http://localhost:8000`**

### Option 2: Node.js (npx serve)
```bash
npx -y serve .
```

---

## Secure Hosting & Deployment Requirements

When hosting the website publicly for readers of the magazine:
1. **HTTPS is Mandatory**: Browsers (iOS Safari, Android Chrome, desktop browsers) strictly block camera permissions on insecure `http://` connections unless on `localhost`. Ensure your deployment platform has an SSL certificate enabled.
2. **Static Hosting Compatibility**: The entire project uses vanilla HTML, CSS, and JavaScript with no backend, database, or build step. It can be deployed directly to:
   - GitHub Pages (free SSL included)
   - Cloudflare Pages
   - Vercel / Netlify
   - Firebase Hosting

---

## Audiobook Library: Replacing Placeholders

Currently, 5 sample audio files (`article-1.wav` through `article-5.wav`) are included in `assets/audio/` so that playback, scrub-seeking, duration calculation, and volume controls work immediately out of the box.

### To Upload Real Audio Recordings:
1. Place your MP3 or WAV audio files into `assets/audio/` (e.g. `quantum-horizon.mp3`).
2. Open [`js/config.js`](file:///Users/jaigagaliya/Desktop/wavelength/MHS%202026/js/config.js).
3. Update the corresponding article entry:
   ```javascript
   {
     id: "article-1",
     number: "01",
     title: "The Quantum Horizon: Coherence in Warm Biology",
     author: "Dr. Elena Rostova",
     narrator: "Narrated by Marcus Vance",
     category: "Quantum Biophysics",
     description: "Your editorial synopsis...",
     audioSrc: "./assets/audio/quantum-horizon.mp3", // <-- Update path here
     coverImage: "./assets/images/covers/cover-1.svg",
     tag: "Feature Article"
   }
   ```
4. The custom player will automatically parse duration metadata, update timestamps, and synchronize seeking.

---

## MindAR Tracking: Preparing & Compiling Targets

MindAR bundles feature detection data for all printed images into a single `.mind` file.

### How Target Indices Work:
- **Target Index `0`**: The B&W printed illustration on Page 14 (Experience 1: Colour Reveal).
- **Target Index `1`**: The 3D model anchor marker on Page 28 (Experience 2: 3D Model).
- Additional targets can be indexed sequentially (`2`, `3`, etc.).

### Step-by-Step Target Compilation:
1. Export high-contrast PNG or JPG images of the targets as printed in the magazine (800–1200px width recommended).
2. Open the official **MindAR Target Compiler** web tool:
   **[https://hiukim.github.io/mind-ar-js-doc/tools/compile](https://hiukim.github.io/mind-ar-js-doc/tools/compile)**
3. Drag & drop your images in exact order:
   - **First image**: The Page 14 B&W illustration (assigned index `0`).
   - **Second image**: The Page 28 3D marker (assigned index `1`).
4. Click **Start** to compile.
5. Click **Download** to obtain `targets.mind`.
6. Replace the placeholder file at:
   `assets/targets/targets.mind`
7. In `js/config.js`, set:
   ```javascript
   isTargetFileCompiled: true
   ```

---

## Experience 1: Connecting B&W Print to Colour Artwork

When MindAR recognizes the printed black-and-white page, it aligns the digital colour artwork plane directly over the page and performs an animated opacity reveal.

### Configuration in `js/config.js`:
```javascript
experience1_colorReveal: {
  targetIndex: 0,
  printedImage: "./assets/images/bw-print-sample.svg", // B&W print version
  colorImage: "./assets/images/color-overlay-sample.svg", // Colour counterpart
  
  // Alignment & Dimensions
  targetWidth: 1.0,   // Width in AR coordinate units
  targetHeight: 1.0,  // Height (adjust to match your artwork aspect ratio)
  scale: { x: 1.0, y: 1.0, z: 1.0 },
  position: { x: 0, y: 0, z: 0.01 }, // slightly elevated above paper
  rotation: { x: 0, y: 0, z: 0 },
  revealDuration: 1.2 // Duration in seconds for fade-in
}
```

---

## Experience 2: Adding Your Future 3D Model (`.glb`)

Until your final 3D model is ready, a **procedural topological crystal demo** with rotating gyro-rings is displayed so you can test camera tracking, lighting, and performance immediately.

### When Your Custom 3D Model is Ready:
1. Export your 3D asset as a **`.glb`** (Binary glTF) file (under 5 MB recommended for smooth mobile performance).
2. Place the file at:
   `assets/models/article-model.glb`
3. In [`js/config.js`](file:///Users/jaigagaliya/Desktop/wavelength/MHS%202026/js/config.js), update:
   ```javascript
   experience2_3dModel: {
     targetIndex: 1,
     modelPath: "./assets/models/article-model.glb",
     useDemoGeometry: false, // <-- Set to false to switch from demo to your real GLB!
     scale: { x: 0.35, y: 0.35, z: 0.35 }, // Adjust scale to fit page marker
     position: { x: 0, y: 0.15, z: 0 },     // Elevate model above marker
     rotation: { x: 0, y: 0, z: 0 },
     slowRotate: true,                      // Enable continuous gentle spin
     rotationSpeed: 0.35,
     supportsAnimation: true                // Automatically plays embedded glTF animation clips
   }
   ```

---

## Testing Checklist & Verification Summary

| Feature / Subsystem | Status | How to Test Immediately |
| :--- | :---: | :--- |
| **Landing Page Navigation** | Working | Click "Audiobooks" or "VFX Experiences"; test the monochrome-to-colour drag slider. |
| **Audiobook Playback** | Working | 5 working `.wav` audio files included. Test play/pause, waveform scrubbing, volume, and single-playback enforcement. |
| **Audio Missing Asset Handling** | Working | If an audio file path 404s, click "Test Preview" to run the built-in WebAudio synthesizer chime. |
| **Non-AR Colour Simulator** | Working | On `vfx.html`, click "Preview Simulator" on Experience 01 to test the B&W-to-colour comparison slider without camera. |
| **Non-AR 3D Model Viewer** | Working | On `vfx.html`, click "Inspect 3D Model" on Experience 02 to drag and inspect the topological crystal in 360°. |
| **AR Camera Launch & HUD** | Working | Tap "Start Camera" to test camera permissions, reticle animation, live status badges, and "Exit AR" teardown. |
| **Real Page Image Tracking** | Needs Print & `.mind` File | Requires compiling your physical magazine images into `targets.mind` using the MindAR web compiler. |
| **Custom 3D Model Display** | Pending Asset | Demo geometry renders automatically; upload your `.glb` to `assets/models/` when ready. |
