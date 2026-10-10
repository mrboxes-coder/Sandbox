# Quest 2 Gaussian Splat Viewer

The Environment dropdown is hard-coded with Practice room, Bukit Pasoh, Everett and LASALLE College. The three supplied SOG files are included in assets/. No scene JSON, folder scanning, build step or GitHub Actions workflow is required.

Upload index.html, app.js, motion.mjs, style.css and assets/ together to your HTTPS website. For an existing GitHub Pages site, replace the viewer files in its current publishing folder. Refresh the page after publication. Any previously installed Publish Quest viewer custom workflow should be removed from the repository; use your normal Pages publishing configuration instead.

Open the website in the Quest browser. Select an environment, press Load environment, wait for Ready, then select Enter VR. Start with the practice room to check controls.

Left stick moves relative to your head direction. Right stick turns in 30-degree steps and moves up/down. A resets; B exits VR. Release sticks to stop. There is no wall collision or teleportation. Scale and starting floor height can be adjusted before loading. All three splats initially use the existing 180-degree X rotation and starting X/Z coordinates (0,4); each scene may require alignment adjustment in the headset.

PlayCanvas 2.23.2 is loaded from a CDN, so internet access is needed. Desktop preview does not establish Quest stereo quality or performance. Actual headset testing is still required.


## LOD checkbox

Select Enable LOD before clicking Load environment. It is off by default. Changing the checkbox does not alter the already-loaded scene until you click Load environment again. Exit VR with B before changing this option. Practice room has no splats, so the setting has no effect there.

On loads assets/lod/SCENE/lod-meta.json plus its generated SOG chunks. Off loads the original assets/SCENE.sog. Upload the complete assets/lod directory with the viewer; its JSON files are generated asset indexes and do not need manual editing. No GitHub Actions workflow is required.

Each LOD asset has two spatially chunked levels: full Gaussian count and a merge-decimated level at 25% of the source count. LOD versions omit higher spherical harmonic bands (view-dependent colour effects) to keep preparation and delivery lighter. The original SOGs retain those bands. A target budget of 400,000 visible splats is used for LOD; it is a target rather than a strict maximum, since available levels limit the achievable count. Large coarse levels can exceed it. Actual Quest frame rate and visual quality need device testing.

Replacing an original SOG will not regenerate its LOD companion. The corresponding LOD assets must be rebuilt from the new scene before using the checkbox for it.
