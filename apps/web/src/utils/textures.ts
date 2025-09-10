import { useEffect, useMemo, useState } from 'react'
import { CanvasTexture, Color, RepeatWrapping, SRGBColorSpace, Texture } from 'three'
import { TextureLoader } from 'three/src/loaders/TextureLoader.js'

export type TextureSpec = {
  url: string | string[]
  repeat?: [number, number]
  anisotropy?: number
  /**
   * Whether this texture is a color map (sRGB) or a data map (linear). Defaults to true (color).
   * For normal/displacement/roughness/metalness/AO maps, set to false.
   */
  isColor?: boolean
  fallbackPattern?: {
  type?: 'checker' | 'stripes' | 'earth'
    colors?: string[]
    size?: number // canvas size in px
    squares?: number // for checker
  }
}

function configureTexture(tex: Texture | null, repeat: [number, number], anisotropy: number, isColor: boolean) {
  if (!tex) return null
  // only apply sRGB to color textures; data maps should remain linear
  if (isColor) tex.colorSpace = SRGBColorSpace
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.repeat.set(repeat[0], repeat[1])
  tex.anisotropy = anisotropy
  tex.needsUpdate = true
  return tex
}

export function useSafeTexture(spec: TextureSpec | null): Texture | null {
  const repeat = spec?.repeat ?? [1, 1]
  const anisotropy = spec?.anisotropy ?? 8
  const isColor = spec?.isColor ?? true
  const urls: string[] = Array.isArray(spec?.url) ? (spec?.url as string[]) : (spec?.url ? [spec.url as string] : [])

  const [tex, setTex] = useState<Texture | null>(null)
  const repeatX = repeat[0]
  const repeatY = repeat[1]

  useEffect(() => {
    let cancelled = false

  const createPattern = (): Texture | null => {
      if (!spec?.fallbackPattern) return null
      const type = spec.fallbackPattern.type ?? 'checker'
      const size = spec.fallbackPattern.size ?? 512
      const squares = spec.fallbackPattern.squares ?? 16
      const colors = (spec.fallbackPattern.colors ?? ['#1f77b4', '#2ca02c']).map((c) => new Color(c))

      const canvas = document.createElement('canvas')
      // For planetary maps prefer 2:1 equirectangular aspect
      if (type === 'earth') {
        canvas.width = size
        canvas.height = Math.max(1, Math.floor(size / 2))
      } else {
        canvas.width = size
        canvas.height = size
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      if (type === 'earth') {
        // Simple procedural Earth-like texture
        const W = canvas.width
        const H = canvas.height
        // Ocean base gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H)
        grad.addColorStop(0, '#0b3d91')
        grad.addColorStop(1, '#0a6fb3')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, W, H)

        // Helper: draw an irregular polygon continent around a center
        const drawContinent = (cx: number, cy: number, rx: number, ry: number, hue: number) => {
          const points: Array<[number, number]> = []
          const steps = 64
          for (let i = 0; i < steps; i++) {
            const a = (i / steps) * Math.PI * 2
            // Add some band-limited noise
            const n = Math.sin(a * 3) * 0.12 + Math.sin(a * 7) * 0.06 + (Math.random() - 0.5) * 0.05
            const rr = 1 + n
            const x = cx + Math.cos(a) * rx * rr
            const y = cy + Math.sin(a) * ry * rr
            points.push([x, y])
          }
          ctx.beginPath()
          ctx.moveTo(points[0][0], points[0][1])
          for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1])
          ctx.closePath()
          // Land color with hue variation
          ctx.fillStyle = `hsl(${hue}, 45%, 32%)`
          ctx.fill()
        }

        // Place a handful of continents in various longitudes/latitudes
        const continents = 6
        for (let i = 0; i < continents; i++) {
          const cx = (W / continents) * i + (W / continents) * 0.5 + ((Math.random() - 0.5) * W) * 0.05
          const lat = (Math.random() * 0.8 - 0.4) // -0.4..0.4
          const cy = H * (0.5 + lat)
          const rx = W * (0.08 + Math.random() * 0.12)
          const ry = H * (0.06 + Math.random() * 0.10)
          const hue = 110 + Math.random() * 40 // green-ish to brown
          drawContinent(cx, cy, rx, ry, hue)
          // Add adjacent island chain
          for (let k = 0; k < 3; k++) {
            drawContinent(cx + (k + 1) * rx * 0.6, cy + (Math.random() - 0.5) * ry, rx * 0.35, ry * 0.35, hue + (Math.random() * 20 - 10))
          }
        }

        // Deserts overlays
        ctx.globalAlpha = 0.25
        ctx.fillStyle = 'hsl(35, 70%, 55%)'
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * W
          const y = H * (0.4 + Math.random() * 0.2)
          const w = W * (0.15 + Math.random() * 0.2)
          const h = H * (0.05 + Math.random() * 0.1)
          ctx.beginPath(); ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2); ctx.fill()
        }
        ctx.globalAlpha = 1

        // Polar caps
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.fillRect(0, 0, W, Math.max(2, Math.floor(H * 0.06)))
        ctx.fillRect(0, H - Math.max(2, Math.floor(H * 0.06)), W, Math.max(2, Math.floor(H * 0.06)))

        // Subtle cloud bands
        ctx.globalAlpha = 0.15
        ctx.fillStyle = '#ffffff'
        for (let i = 0; i < 24; i++) {
          const y = Math.floor((i / 24) * H)
          const h = 1 + Math.floor(Math.random() * 2)
          ctx.fillRect(0, y, W, h)
        }
        ctx.globalAlpha = 1
      } else if (type === 'checker') {
        const cell = size / squares
        for (let y = 0; y < squares; y++) {
          for (let x = 0; x < squares; x++) {
            // Use a more organic distribution for better Earth-like appearance
            const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) + Math.random() * 0.3
            let idx = Math.floor((x + y + noise * 2) % colors.length)
            if (idx < 0) idx = 0
            if (idx >= colors.length) idx = colors.length - 1

            ctx.fillStyle = colors[idx].getStyle()
            ctx.fillRect(x * cell, y * cell, cell, cell)
          }
        }
      } else {
        // stripes
        const stripeH = size / squares
        for (let y = 0; y < squares; y++) {
          const idx = y % colors.length
          ctx.fillStyle = colors[idx].getStyle()
          ctx.fillRect(0, y * stripeH, size, stripeH)
        }
      }

  const texture = new CanvasTexture(canvas)
      return texture
    }

    const tryLoad = async () => {
      if (urls.length === 0) {
        setTex(createPattern())
        return
      }
  const loader = new TextureLoader()
      loader.setCrossOrigin('anonymous')

  const loadOne = (u: string) =>
        new Promise<Texture>((resolve, reject) => {
          loader.load(u, (loaded) => resolve(loaded), undefined, (err) => reject(err))
        })

      for (const u of urls) {
        try {
          const loaded = await loadOne(u)
          if (!cancelled) {
            setTex(loaded)
            return
          }
        } catch {
          // If the asset is a text file that contains a data URL, decode and use it
          try {
            const res = await fetch(u, { cache: 'no-store' })
            if (res.ok) {
              const text = await res.text()
              if (text.trim().startsWith('data:image')) {
                // Create an HTMLImageElement from the data URL
                const img = new Image()
                img.crossOrigin = 'anonymous'
                const textureFromImage = () => {
                  // Always use the loaded image, don't fall back for small images
                  const t = new Texture(img)
                  t.needsUpdate = true
                  if (!cancelled) setTex(t)
                }
                await new Promise<void>((resolve2, reject2) => {
                  img.onload = () => {
                    textureFromImage()
                    resolve2()
                  }
                  img.onerror = (e) => reject2(e)
                  img.src = text.trim()
                })
                if (!cancelled) return
              }
            }
          } catch {
            // ignore and continue to next url
          }
          // continue to next url
        }
      }
      if (!cancelled) setTex(createPattern())
    }

    tryLoad()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(urls), spec?.fallbackPattern?.type, spec?.fallbackPattern?.size, repeatX, repeatY, anisotropy, isColor])

  return useMemo(() => configureTexture(tex, [repeatX, repeatY], anisotropy, isColor), [tex, repeatX, repeatY, anisotropy, isColor])
}

export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const normalizedBase = String(base).replace(/\/+$/, '/')
  const normalizedPath = String(path).replace(/^\/+/, '')
  return `${normalizedBase}${normalizedPath}`
}
