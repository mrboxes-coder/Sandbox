# VR Headset Gaussian Splat — Quest 2 prototype

This standalone browser prototype uses PlayCanvas 2.12.1, matching the existing mobile viewer. It includes the existing LASALLE.sog (about 39.5 MB) and a lightweight practice room. Neither original project was modified.

## Test on Quest 2

1. Upload the entire quest-splat folder to your existing HTTPS website, keeping its files and assets folder together. For example, place it under /quest-splat/.
2. In the Quest browser, open https://YOUR-WEBSITE/quest-splat/. The headset needs internet access for the pinned PlayCanvas CDN module.
3. Start with Practice room. Select Enter VR and allow the browser to enter immersive VR.
4. Check head tracking, the controller controls below, and use B to leave VR.
5. Select LASALLE College and Load environment. Wait for Ready, then select Enter VR.

The app has not been published automatically. Ordinary http://192.168... LAN hosting does not provide the secure context required by WebXR. A localhost preview on the PC is useful for loading checks but does not prove Quest VR works. A file:// URL is not a supported deployment.

## Controls

- Left thumbstick: move forward/backward and sideways, relative to the direction you face.
- Right thumbstick horizontal: 30-degree snap turn; release to centre before another turn.
- Right thumbstick vertical: fly up/down.
- Right A button: reset position.
- Right B button: leave VR and return to browser settings.
- Release sticks: stop. After reset or a visibility interruption, centre both sticks before moving.

The Quest system menu can also exit immersive mode. Scene selection and settings are outside VR in this version. There are no rendered controller models or in-world menus yet; controller inputs still drive movement.

## Scene alignment

LASALLE reuses the mobile viewer's 180-degree X rotation and starting X/Z position. The original camera height was not a surveyed floor height, so the starting floor defaults to zero and must be checked in the headset.

Scene scale means metres per source unit: 1 assumes one source unit is one metre. Starting floor height is in source units. Change these before loading LASALLE again if the environment looks too large/small or you start above/below the floor. The headset provides your physical eye height. Movement speeds are in world metres per second only after scale is calibrated.

## Current limits and validation

- Free flight only: no collision mesh, wall blocking, teleportation, or imported mobile bounds. Your physical headset boundary remains relevant; virtual walls are not solid.
- No automatic banking or pitch changes. Head orientation controls viewing.
- Browser FPS is shown after returning from VR; browser preview performance does not predict headset performance.
- SOG preparation can take time and temporarily stall the interface. This first version has a loading status but no accurate percentage or cancel control.
- No claim of measured Quest frame rate or stereo rendering quality is made until real-device testing.
- Syntax checks and movement-unit checks are run locally. Headset stereo, controller mapping, comfort and scene performance need Quest validation.

For the first headset report, note whether each eye shows the scene correctly, whether movement and A/B work, whether scale/floor height look correct, and whether head turns remain smooth.

Technical basis: https://developer.playcanvas.com/user-manual/xr/using-webxr/

Desktop browser verification: the practice room and LASALLE scene both reached Ready, and the LASALLE splat was visually confirmed in the local browser preview. Enter VR correctly remained disabled without an available immersive headset.

