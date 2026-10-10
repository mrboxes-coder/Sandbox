# Quest 2 Gaussian Splat Viewer

The Environment dropdown is hard-coded with Practice room, Bukit Pasoh, Everett and LASALLE College. The three supplied SOG files are included in assets/. No scene JSON, folder scanning, build step or GitHub Actions workflow is required.

Upload all HTML, JS and MJS files, style.css and assets/ together to your HTTPS website. For an existing GitHub Pages site, replace the viewer files in its current publishing folder. Refresh the page after publication. Any previously installed Publish Quest viewer custom workflow should be removed from the repository; use your normal Pages publishing configuration instead.

Open the website in the Quest browser. Select an environment, press Load environment, wait for Ready, then select Enter VR. Start with the practice room to check controls.

Left stick moves relative to your head direction. Right stick turns in 30-degree steps and moves up/down. A resets; B exits VR. Release sticks to stop. There is no wall collision or teleportation. Scale and starting floor height can be adjusted before loading. All three splats initially use the existing 180-degree X rotation and starting X/Z coordinates (0,4); each scene may require alignment adjustment in the headset.

PlayCanvas 2.23.2 is loaded from a CDN, so internet access is needed. Desktop preview does not establish Quest stereo quality or performance. Actual headset testing is still required.


## PlayCanvas LOD checkbox

Select Enable LOD before clicking Load environment. It is off by default. Changing the checkbox does not alter the already-loaded scene until you click Load environment again. Exit VR with B before changing this option. Practice room has no splats, so the setting has no effect there.

On loads assets/lod/SCENE/lod-meta.json plus its generated SOG chunks. Off loads the original assets/SCENE.sog. Upload the complete assets/lod directory with the viewer; its JSON files are generated asset indexes and do not need manual editing. No GitHub Actions workflow is required.

Each LOD asset has two spatially chunked levels: full Gaussian count and a merge-decimated level at 25% of the source count. LOD versions omit higher spherical harmonic bands (view-dependent colour effects) to keep preparation and delivery lighter. The original SOGs retain those bands. A target budget of 400,000 visible splats is used for LOD; it is a target rather than a strict maximum, since available levels limit the achievable count. Large coarse levels can exceed it. Actual Quest frame rate and visual quality need device testing.

Replacing an original SOG will not regenerate its LOD companion. The corresponding LOD assets must be rebuilt from the new scene before using the checkbox for it.


## Render engine dropdown

Choose PlayCanvas or SparkJS (Three.js). Changing engines reloads the page, unloads the previous renderer, preserves the chosen environment, scale, floor, speed and LOD option, then loads the scene with the new engine. The camera returns to the scene starting pose. Exit VR before switching. Engine selection is disabled while loading or in VR.

Versions: PlayCanvas 2.23.2, Spark 2.3.1, Three.js 0.180.0. These are fetched from pinned public CDN URLs. HTTPS and internet access are required on Quest. Both engines share scene definitions, initial transforms and locomotion math. FPS labels identify the active engine.

LOD differs between engines. PlayCanvas uses the included pre-generated streamed assets (two levels, no higher spherical harmonics). Spark reads the original SOG and generates its own hierarchy on the device when LOD is checked; this is not network streaming and requires the whole SOG download plus extra preparation time and peak memory. Both use a 400,000 splat target, but this does not imply equal output detail or speed. Spark uses extended coordinate precision because these scenes contain distant outliers. This also uses more memory than its compact default.

Original SOG files are used with LOD off. VR uses local-floor tracking with the same left-stick movement, right-stick snap turns/altitude, A reset and B exit. No controller models, collision mesh or teleportation have been added.

Desktop browser checks cannot validate stereo rendering, controller input or Quest performance. Compare the practice room on the headset first, then test each scene and LOD mode.

Validation: desktop preview rendered all three scenes using Spark LOD, Everett using Spark full detail, and PlayCanvas LOD after switching engines. Engine switching retained scene and LOD selection. Syntax, module references and shared movement checks passed. Actual Quest VR remains untested.
