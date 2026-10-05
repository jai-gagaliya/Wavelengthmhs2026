# MindAR Image Tracking Targets Directory

This folder is configured to store your compiled MindAR tracking targets file: `targets.mind`.

## How MindAR Image Targets Work

MindAR uses a single compiled `.mind` binary file that bundles feature points extracted from one or more printed images.

Each image in the compiled file is referenced by an **index starting from 0**:
- **Target Index 0**: Reserved for **Experience 1** ("From Black & White to Colour" printed illustration).
- **Target Index 1**: Reserved for **Experience 2** ("Article with 3D Model" printed marker/artwork).
- **Target Index 2+**: Any additional articles or interactive targets you want to add in the future.

---

## How to Compile Your Magazine Images

1. Take the high-contrast black-and-white images or markers that will be printed in the physical magazine (PNG or JPG format, ideally 800–1200px wide).
2. Open the official **MindAR Target Compiler** in your browser:
   **https://hiukim.github.io/mind-ar-js-doc/tools/compile**
3. Drag & drop your images into the compiler:
   - Drop the **B&W Colour Reveal Image** first (this becomes `Target Index 0`).
   - Drop the **3D Model Marker Image** second (this becomes `Target Index 1`).
4. Click **Start** to process the feature detection.
5. Click **Download** to obtain `targets.mind`.
6. Save or copy the downloaded file directly into this directory as:
   `assets/targets/targets.mind`

---

## Offline / Testing Note

The website includes built-in **Interactive Non-AR Simulators** on `vfx.html` allowing readers and reviewers to test the B&W-to-colour reveal and the 3D model experience directly on any device even without printing pages or compiling targets!
