---
name: motion-design
description: Animation and interaction rules for MotoSync.
---
- Spring: damping 16, stiffness 180, mass 0.8. Press scale 0.97. Durations 150/250/400ms.
- Every tap: haptic + spring. Every screen change: animated transition. Lists: staggered entrance.
- Use Reanimated worklets on native; Framer Motion on web. Lazy-load 3D. Provide a poster/fallback when WebGL fails.
- Hero and signature moments may use 3D (react-three-fiber with a GLB model) or Rive/Lottie. Everything must run at 60fps on a mid-range Android.
- Always honor Reduce Motion.
