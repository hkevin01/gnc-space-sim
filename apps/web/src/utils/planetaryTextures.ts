import { TextureSpec } from './textures'

// High-quality planetary textures from open source sources
// These are hosted on reliable CDNs and are free to use

export const PLANETARY_TEXTURES: Record<string, TextureSpec> = {
  // Earth textures - test with reliable CDN sources
  EARTH: {
    url: [
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/earth_atmos_2048.jpg',
      'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'
    ],
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'earth' as const,
      colors: ['#0066cc', '#228B22', '#8B4513', '#F4A460', '#FFFFFF', '#32CD32'],
      size: 1024
    }
  },

  // Moon texture - test with reliable CDN sources
  MOON: {
    url: [
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/moon_1024.jpg',
      'https://threejs.org/examples/textures/planets/moon_1024.jpg'
    ],
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'earth' as const, // Changed from 'checker' to 'earth' for more natural look
      colors: ['#D3D3D3', '#A0A0A0', '#808080', '#696969', '#C0C0C0', '#DCDCDC'],
      size: 512
    }
  },

  // Mars - reliable CDN sources
  MARS: {
    url: [
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/mars_1k_color.jpg',
      'https://threejs.org/examples/textures/planets/mars_1k_color.jpg',
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/mars_1k_color.jpg'
    ],
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'earth' as const, // Changed from 'checker' to 'earth' for more natural look
      colors: ['#CD5C5C', '#8B4513', '#A0522D', '#D2691E', '#BC8F8F', '#F4A460'],
      size: 512
    }
  },

  // Jupiter - reliable CDN sources
  JUPITER: {
    url: [
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/jupiter_2k.jpg',
      'https://threejs.org/examples/textures/planets/jupiter_2k.jpg',
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/jupiter_2k.jpg'
    ],
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'stripes' as const,
      colors: ['#D8CA9D', '#B8860B', '#8B7355', '#DAA520', '#CD853F', '#DEB887'],
      size: 1024
    }
  },

  // Saturn - reliable CDN sources
  SATURN: {
    url: [
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/saturn_1k.jpg',
      'https://threejs.org/examples/textures/planets/saturn_1k.jpg',
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/saturn_1k.jpg'
    ],
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'stripes' as const,
      colors: ['#FAD5A5', '#DAA520', '#B8860B', '#F4E99B', '#E6D690', '#DEB887'],
      size: 1024
    }
  },

  // Sun texture - using enhanced fallback pattern
  SUN: {
    url: [],
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'stripes' as const,
      colors: ['#FDB813', '#FF8C00', '#FF6B35', '#FFD700', '#FFA500'],
      size: 1024
    }
  },

  // Venus - using fallback only to avoid CORS
  VENUS: {
    url: [],
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'earth' as const,
      colors: ['#FFC649', '#FFD700', '#FFA500'],
      size: 512
    }
  },

  // Mercury - using fallback only to avoid CORS
  MERCURY: {
    url: [],
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'earth' as const, // Changed from 'checker' to 'earth' for more natural look
      colors: ['#8C7853', '#A0522D', '#696969'],
      size: 512
    }
  },

  // Uranus - using fallback only to avoid CORS
  URANUS: {
    url: [],
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'earth' as const,
      colors: ['#8C7853', '#696969', '#D2B48C', '#A0522D'],
      size: 512
    }
  },

  // Neptune - using fallback only to avoid CORS
  NEPTUNE: {
    url: [],
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'earth' as const, // Changed from 'checker' to 'earth' for more natural look
      colors: ['#4B70DD', '#000080', '#191970'],
      size: 512
    }
  }
}

// Alternative texture sources (uncomment to use different sources)
export const ALTERNATIVE_TEXTURES = {
  EARTH: {
    url: 'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'earth' as const,
      colors: ['#6B93D6', '#228B22', '#8B4513'],
      size: 1024
    }
  },
  MOON: {
    url: 'https://www.solarsystemscope.com/textures/download/2k_moon.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'checker' as const,
      colors: ['#C0C0C0', '#808080'],
      size: 512
    }
  }
}

// Helper function to get texture for a planet
export function getPlanetTexture(planetName: string): TextureSpec | null {
  const upperName = planetName.toUpperCase()

  // Always use primary textures with fallback patterns to avoid CORS
  return PLANETARY_TEXTURES[upperName] || null
}
