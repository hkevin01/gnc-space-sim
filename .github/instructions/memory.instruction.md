---
applyTo: '**'
---

# GNC Space Sim - Project Memory

## Project Overview
- **Type:** 3D Space Simulation with orbital mechanics
- **Stack:** React Three Fiber 8.17.10 + Three.js 0.169.0 + TypeScript 5.6.2
- **Package Manager:** pnpm (monorepo)
- **Dev Server:** Vite 6.3.5 on port 5173

## Key Solutions & Patterns

### Texture Loading (SOLVED - Jan 2026)
**Problem:** Textures were not rendering on planets - showing solid colors instead of NASA textures.

**Root Cause:** Custom `useSafeTexture` hook with async TextureLoader was failing silently and falling back to procedural patterns.

**Solution:** Use React Three Fiber's built-in `useLoader` hook with `TextureLoader`:

```tsx
import { useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three/src/loaders/TextureLoader.js'

// Correct approach - synchronous with Suspense
const texture = useLoader(TextureLoader, '/assets/earth/earth_2k.jpg')

// Wrap in Suspense for loading states
<Suspense fallback={<ColoredSphere />}>
  <TexturedSphere textureUrl={TEXTURE_URLS[name]} radius={radius} />
</Suspense>
```

**Don't use:**
- Custom async texture hooks with useState/useEffect
- drei's `useTexture` had issues in this project context

**Texture files location:** `/apps/web/public/assets/{planet}/{planet}_2k.jpg`
- sun_2k.jpg (822KB)
- earth_2k.jpg (463KB)  
- moon_2k.jpg (1MB)
- mars_color.jpg (36MB)

Source: Solar System Scope (CC license)

### Orbit Lines (SOLVED - Jan 2026)
**Problem:** Wide orbit bands instead of thin lines.

**Solution:** Use drei's `Line` component instead of `ringGeometry`:
```tsx
import { Line } from '@react-three/drei'

<Line
  points={createOrbitPoints(radius, 128)}
  color="#ffffff"
  lineWidth={1}
  opacity={0.5}
  transparent
/>
```

### Moon Orbit (SOLVED - Jan 2026)
**Problem:** Moon was orbiting the Sun instead of Earth.

**Solution:** Calculate Moon's position relative to Earth's position, not the origin.

### Labels (SOLVED)
Use drei's `Billboard` + `Text` for always-facing labels:
```tsx
<Billboard position={[x, y + offset, z]}>
  <Text fontSize={size} color="white">{name}</Text>
</Billboard>
```

## File Structure Notes
- Main app: `/apps/web/src/App.tsx`
- Orbital mechanics: `/apps/web/src/components/OrbitalMechanics.tsx`
- NASA solar system: `/apps/web/src/components/SolarSystem.tsx`
- Stars background: `/apps/web/src/components/StarField.tsx`
- Texture assets: `/apps/web/public/assets/`

## Common Commands
```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm test         # Run tests
```
