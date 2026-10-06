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
  // All 5 production audiobooks from the Wavelength archive
  audiobooks: [
    {
      id: "article-1",
      number: "01",
      title: "Patient Zero: Between Being 'Human' and Being 'Hero'",
      author: "Jai Gagaliya",
      narrator: "AI-Narration",
      category: "Feature Article",
      description:
        "An introspective exploration of the psychological and ethical boundaries between humanity and heroism, examining the moral weight carried by those thrust into the vanguard of survival.",
      audioSrc: "./assets/audio/patient-zero.mp3",
      coverImage: "./assets/images/covers/cover-1.svg",
      tag: "Feature Article · Unabridged",
      accentColor: "#d4b896"
    },
    {
      id: "article-2",
      number: "02",
      title: "Beyond the Axiom: Multipixel Imaging of Exoplanets with Solar Gravitational Lens",
      author: "Wavelength Contributors",
      narrator: "AI-Narration",
      category: "Astrophysics & Optics",
      description:
        "Exploring multipixel resolved imaging of habitable exoplanets using the Sun as a gravitational lens, pushing the frontiers of interstellar astronomy.",
      audioSrc: "./assets/audio/beyond-the-axiom.mp3",
      coverImage: "./assets/images/covers/cover-2.svg",
      tag: "Cover Story · Page 10",
      accentColor: "#d97746"
    },
    {
      id: "article-3",
      number: "03",
      title: "The Breaking Point: Cipher War & The Enigma Machine",
      author: "Wavelength Contributors",
      narrator: "AI-Narration",
      category: "Cryptanalysis & History",
      description:
        "The mathematical breakthroughs, electromechanical decipherment, and strategic intelligence chess that broke the wartime Enigma machine.",
      audioSrc: "./assets/audio/the-breaking-point-enigma.mp3",
      coverImage: "./assets/images/covers/cover-3.svg",
      tag: "Field Dispatch · Page 14",
      accentColor: "#93bd86"
    },
    {
      id: "article-4",
      number: "04",
      title: "The Breaking Point: Cipher War & The Bombe Machine",
      author: "Wavelength Contributors",
      narrator: "AI-Narration",
      category: "Cryptanalysis & Decipherment",
      description:
        "The electromechanical Bombe developed by Alan Turing and Gordon Welchman to systematically exploit German cribs and crack the Enigma naval ciphers.",
      audioSrc: "./assets/audio/the-breaking-point-bombe.mp3",
      coverImage: "./assets/images/covers/cover-4.svg",
      tag: "Historical Cipher · Page 15",
      accentColor: "#c5913e"
    },
    {
      id: "article-5",
      number: "05",
      title: "Patient Zero: Between Being 'Hero' and Being 'Human' (Alternate Narration)",
      author: "Jai Gagaliya",
      narrator: "AI-Narration",
      category: "Psychological Ethics",
      description:
        "Alternate director's cut narration exploring the personal emotional toll, solitude, and moral imperative behind the frontline crucible.",
      audioSrc: "./assets/audio/patient-zero-alt.mp3",
      coverImage: "./assets/images/covers/cover-5.svg",
      tag: "Special Edition · Page 18",
      accentColor: "#e0a85b"
    }
  ],

  // Magazine Pages & Transformation Map
  // Pages 3 and 32 are excluded from transformation
  pages: {
    totalPages: 32,
    excludedFromTransformation: [3, 32],
    transformablePages: [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
    coverPage: 1
  },

  // MindAR & VFX Experience Configuration
  vfx: {
    // Compiled MindAR target file containing all target images bundled together
    targetsFile: "./assets/targets/targets.mind",
    isTargetFileCompiled: true,

    // Experience 1: Black & White to Colour Artwork Reveal & Video Motion
    // Pages 18 & 19 feature spread with video alongside B&W to Colour
    experience1_colorReveal: {
      targetIndex: 16,
      title: "From Black & White to Colour",
      articleTitle: "Pages 18 & 19 Spread & Motion Video Reveal",
      magazinePage: "Pages 18 & 19 · Feature Spread",
      description:
        "Pages 18 and 19 feature a full monochrome-to-colour chromatic transformation alongside an integrated motion video reveal. Align your camera over the spread to activate the animated visual sequence directly on the page.",
      
      // Graphic & Video assets
      printedImage: "./assets/images/spread-18-19-bw.jpg",
      colorImage: "./assets/images/spread-18-19.jpg",
      videoPath: "./assets/videos/wavy.mp4",
      
      // Overlay alignment settings
      aspectRatio: { width: 1.414, height: 1.0 },
      targetWidth: 1.414,
      targetHeight: 1.0,
      scale: { x: 1.0, y: 1.0, z: 1.0 },
      position: { x: 0, y: 0, z: 0.01 },
      rotation: { x: 0, y: 0, z: 0 },
      revealDuration: 1.2,
      accentColor: "#d4b896"
    },

    // Experience 2: Article with a 3D Model
    experience2_3dModel: {
      targetIndex: 15,
      title: "Explore in 3D",
      articleTitle: "Topological Matter: The Gyro-Lattice",
      magazinePage: "Page 17 · Speculative Engineering",
      description:
        "Anchor an interactive 3D model directly atop the printed page. Examine topological orbital crystal geometry hovering in your space.",
      
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
