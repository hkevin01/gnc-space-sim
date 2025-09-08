import { TextureSpec } from './textures'

// High-quality planetary textures from open source sources
// These are hosted on reliable CDNs and are free to use

export const PLANETARY_TEXTURES: Record<string, TextureSpec> = {
  // Earth textures from NASA Blue Marble
  EARTH: {
    url: 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/earthmap1k.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'earth' as const,
      colors: ['#6B93D6', '#228B22', '#8B4513'],
      size: 1024
    }
  },

  // Moon texture from Lunar Reconnaissance Orbiter
  MOON: {
    url: 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/moonmap1k.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'checker' as const,
      colors: ['#C0C0C0', '#808080'],
      size: 512
    }
  },

  // Mars from Mars Reconnaissance Orbiter
  MARS: {
    url: 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/marsmap1k.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'checker' as const,
      colors: ['#CD5C5C', '#8B4513', '#A0522D'],
      size: 512
    }
  },

  // Jupiter from Juno mission
  JUPITER: {
    url: 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/jupitermap.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'stripes' as const,
      colors: ['#D8CA9D', '#B8860B', '#8B7355', '#DAA520'],
      size: 1024
    }
  },

  // Saturn from Cassini mission
  SATURN: {
    url: 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/saturnmap.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'stripes' as const,
      colors: ['#FAD5A5', '#DAA520', '#B8860B'],
      size: 1024
    }
  },

  // Sun texture (solar surface)
  SUN: {
    url: 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/sunmap.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'checker' as const,
      colors: ['#FDB813', '#FF6B35', '#FFA500'],
      size: 512
    }
  },

  // Venus from Magellan mission
  VENUS: {
    url: 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/venusmap.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'earth' as const,
      colors: ['#FFC649', '#FFD700', '#FFA500'],
      size: 512
    }
  },

  // Mercury from MESSENGER mission
  MERCURY: {
    url: 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/mercurymap.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'checker' as const,
      colors: ['#8C7853', '#A0522D', '#696969'],
      size: 512
    }
  },

  // Uranus from Voyager 2
  URANUS: {
    url: 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/uranusmap.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'earth' as const,
      colors: ['#8C7853', '#696969', '#D2B48C', '#A0522D'],
      size: 512
    }
  },

  // Neptune from Voyager 2
  NEPTUNE: {
    url: 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/neptunemap.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'checker' as const,
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
  
  // Use alternative sources for Earth and Moon if available
  if (upperName === 'EARTH' && ALTERNATIVE_TEXTURES.EARTH) {
    return ALTERNATIVE_TEXTURES.EARTH
  }
  if (upperName === 'MOON' && ALTERNATIVE_TEXTURES.MOON) {
    return ALTERNATIVE_TEXTURES.MOON
  }
  
  return PLANETARY_TEXTURES[upperName] || null
}
