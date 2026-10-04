# 3D Models Directory

This directory stores 3D assets for Wavelength magazine articles.

## Expected Format

- **Format**: `.glb` (Binary glTF, strongly recommended for web performance) or `.gltf` with embedded buffers.
- **Default Filename**: `article-model.glb` (Configurable in `js/config.js`).

## How to Add Your Article 3D Model

1. Export your 3D model from Blender, Maya, or your 3D modeling tool as a `.glb` file.
   - Recommended size: under 5 MB for fast mobile loading.
   - Origin `(0, 0, 0)` centered at the base or geometric center.
   - Embedded textures (PBR roughness/metallic).
   - If animated, ensure animation clips are named or exported with the default track.
2. Place your file in this folder:
   `assets/models/article-model.glb`
3. In `js/config.js`, verify or update:
   ```javascript
   modelPath: "./assets/models/article-model.glb",
   useDemoGeometry: false, // Set to false when your real GLB is ready!
   scale: { x: 0.35, y: 0.35, z: 0.35 },
   position: { x: 0, y: 0, z: 0 },
   rotation: { x: 0, y: 0, z: 0 },
   slowRotate: true,
   ```

## Demo Geometry Fallback

When `useDemoGeometry: true` is enabled in `js/config.js`, or if `article-model.glb` is pending, the website automatically loads a futuristic procedural crystal/orbital model so you can test tracking, lighting, and performance immediately without broken assets.
