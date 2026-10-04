# Audiobook Files Directory

This directory stores narrated audio files for Wavelength magazine articles.

## Audio Specifications

- **Format**: MP3 (`.mp3`) or WAV (`.wav`) or AAC/M4A (`.m4a`). MP3 is recommended for smaller file size and universal browser playback.
- **Sample Rate**: 44.1 kHz or 48 kHz.
- **Bitrate**: 128 kbps to 192 kbps stereo or 96 kbps mono is ideal for voice narration.

## Current Files

- `article-1.wav` — Sample ambient audio for Article 01 (The Quantum Horizon)
- `article-2.wav` — Sample ambient audio for Article 02 (Neuroplasticity & The Synthetic Mind)
- `article-3.wav` — Sample ambient audio for Article 03 (Echoes of the Deep Biosphere)
- `article-4.wav` — Sample ambient audio for Article 04 (Gravitational Waves & Spacetime)
- `article-5.wav` — Sample ambient audio for Article 05 (Synthetic Biology & Genomes)

## Replacing with Your Real Audio Recordings

1. Drop your voice recordings into this folder (e.g. `quantum-horizon.mp3`, `neuroplasticity.mp3`, etc.).
2. Update the `audioSrc` paths in `js/config.js` to point to your new files:
   ```javascript
   audioSrc: "./assets/audio/quantum-horizon.mp3",
   ```
3. The custom audio player will automatically parse duration metadata, calculate scrub positions, and update timestamps when the file loads.
