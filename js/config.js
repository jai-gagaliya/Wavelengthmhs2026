/**
 * WAVELENGTH — Edition 47
 * Central Configuration & Asset Registry
 *
 * Update this file to modify magazine metadata, add/remove audiobook articles,
 * or configure MindAR image tracking targets, colour overlays, and 3D models.
 */

const WAVELENGTH_CONFIG = {
  // Magazine Metadata
  magazine: {
    title: "Wavelength",
    edition: "Edition 47",
    subtitle: "Digital & Augmented Reality",
    date: "",
    publisher: "Editorial Board",
    theme: "Monochrome to Chromatic Flux",
    copyright: "Wavelength Magazine. All rights reserved."
  },

  // Audiobook Library Configuration
  // Add, remove, or edit articles here.
  // When real MP3/WAV files are placed in assets/audio/, update the `audioSrc` path.
  audiobooks: [
    {
      id: "article-1",
      number: "01",
      title: "Patient Zero: Between Being 'Human' and Being 'Hero'",
      author: "Jai Gagaliya",
      narrator: "AI Narration",
      category: "Feature Essay",
      description:
        "An introspective exploration of the psychological and ethical boundaries between humanity and heroism, examining the moral weight carried by those thrust into the vanguard of survival.",
      audioSrc: "./assets/audio/patient-zero.mp3",
      coverImage: "./assets/images/covers/cover-1.svg",
      tag: "Feature Essay · Unabridged",
      accentColor: "#d4b896"
    },
    {
      id: "article-2",
      number: "02",
      title: "Neuroplasticity & The Synthetic Mind",
      author: "Aria Chen & Julian Sola",
      narrator: "AI Narration",
      category: "Neuroscience & AI",
      description:
        "How neuromorphic silicon architectures mimic synaptic pruning and dendritic computation to build self-healing artificial neural networks.",
      audioSrc: "./assets/audio/article-2.wav",
      coverImage: "./assets/images/covers/cover-2.svg",
      tag: "Cover Story",
      accentColor: "#d97746"
    },
    {
      id: "article-3",
      number: "03",
      title: "Echoes of the Deep Biosphere",
      author: "Tariq Al-Mansoor",
      narrator: "AI Narration",
      category: "Geomicrobiology",
      description:
        "Miles beneath oceanic crust, chemolithoautotrophic endoliths metabolize radiolytic hydrogen, rewriting the boundaries of extraterrestrial life search.",
      audioSrc: "./assets/audio/article-3.wav",
      coverImage: "./assets/images/covers/cover-3.svg",
      tag: "Field Dispatch",
      accentColor: "#93bd86"
    },
    {
      id: "article-4",
      number: "04",
      title: "Gravitational Waves & Spacetime Curvature",
      author: "Prof. Kenneth Sterling",
      narrator: "AI Narration",
      category: "Astrophysics",
      description:
        "Next-generation laser interferometers measuring sub-proton spacetime strain from inspiraling binary neutron stars and primordial black holes.",
      audioSrc: "./assets/audio/article-4.wav",
      coverImage: "./assets/images/covers/cover-4.svg",
      tag: "Theoretical Physics",
      accentColor: "#c5913e"
    },
    {
      id: "article-5",
      number: "05",
      title: "Synthetic Biology & Algorithmic Genomes",
      author: "Dr. Maya Lindqvist",
      narrator: "AI Narration",
      category: "Genomic Computation",
      description:
        "Designing synthetic genetic logic gates, cellular state machines, and DNA-based cryptographic storage for distributed biochemical processing.",
      audioSrc: "./assets/audio/article-5.wav",
      coverImage: "./assets/images/covers/cover-5.svg",
      tag: "Biotechnology",
      accentColor: "#e0a85b"
    }
  ],

  // MindAR & VFX Experience Configuration
  vfx: {
    // Compiled MindAR target file containing all target images bundled together
    // Compile using: https://hiukim.github.io/mind-ar-js-doc/tools/compile
    targetsFile: "./assets/targets/targets.mind",
    isTargetFileCompiled: false, // Set to true once you have compiled and uploaded your real targets.mind

    // Experience 1: Black & White to Colour Artwork Reveal & Video Motion
    // Triggered when camera detects the printed B&W artwork in the magazine
    experience1_colorReveal: {
      targetIndex: 0, // Target index inside targets.mind (0-indexed)
      title: "From Black & White to Colour",
      articleTitle: "Chromatic Flux Resonator",
      magazinePage: "Page 14 · Feature Spread",
      description:
        "Our print magazine is published in crisp monochrome. Hold your camera over the Page 14 artwork to witness the dynamic full-motion chromatic video reveal.",
      
      // Graphic & Video assets
      printedImage: "./assets/images/bw-print-sample.svg",
      colorImage: "./assets/images/color-overlay-sample.svg",
      videoPath: "./assets/videos/wavy.mp4",
      
      // Overlay alignment settings
      aspectRatio: { width: 1.0, height: 1.0 }, // 1:1 square
      targetWidth: 1.0,  // A-Frame plane width in AR coordinate space
      targetHeight: 1.0, // A-Frame plane height
      scale: { x: 1.0, y: 1.0, z: 1.0 },
      position: { x: 0, y: 0, z: 0.01 }, // slightly elevated to avoid Z-fighting
      rotation: { x: 0, y: 0, z: 0 },
      revealDuration: 1.2, // seconds for opacity transition
      accentColor: "#d4b896"
    },

    // Experience 2: Article with a 3D Model
    // Triggered when camera detects the printed marker alongside Article 05
    experience2_3dModel: {
      targetIndex: 1, // Second target inside targets.mind
      title: "Explore in 3D",
      articleTitle: "Topological Matter: The Gyro-Lattice",
      magazinePage: "Page 28 · Speculative Engineering",
      description:
        "Anchor an interactive 3D model directly atop the printed page marker. Examine topological orbital crystal geometry hovering in your space.",
      
      // Marker image printed in magazine
      markerImage: "./assets/images/marker-print-sample.svg",
      
      // 3D Model settings
      modelPath: "./assets/models/article-model.glb",
      
      // Custom uploaded GLB is active
      useDemoGeometry: false,
      
      // Transform settings for GLB Model
      scale: { x: 0.35, y: 0.35, z: 0.35 },
      position: { x: 0, y: 0.15, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      
      // Interaction & animation flags
      slowRotate: true,
      rotationSpeed: 0.35, // degrees per frame
      supportsAnimation: true,
      accentColor: "#8c5e35"
    }
  }
};

// Export for ES modules or attach to window for classic Vanilla scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = WAVELENGTH_CONFIG;
} else if (typeof window !== "undefined") {
  window.WAVELENGTH_CONFIG = WAVELENGTH_CONFIG;
}
