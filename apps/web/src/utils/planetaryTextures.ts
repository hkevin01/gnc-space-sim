import { TextureSpec } from './textures'

// High-quality planetary textures from open source sources
// These are hosted on reliable CDNs and are free to use

export const PLANETARY_TEXTURES: Record<string, TextureSpec> = {
  // Earth textures from NASA Blue Marble
  EARTH: {
    url: [
      'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg',
      'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73908/world.topo.bathy.200411.3x5400x2700.jpg'
    ],
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'earth',
      colors: ['#6B93D6', '#228B22', '#8B4513'],
      size: 1024
    }
  },

  // Moon texture from Lunar Reconnaissance Orbiter
  MOON: {
    url: 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_1k.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'checker',
      colors: ['#C0C0C0', '#808080'],
      size: 512
    }
  },

  // Mars from Mars Reconnaissance Orbiter
  MARS: {
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/92000/92000/mars_1.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'checker',
      colors: ['#CD5C5C', '#8B4513', '#A0522D'],
      size: 512
    }
  },

  // Jupiter from Juno mission
  JUPITER: {
    url: 'https://photojournal.jpl.nasa.gov/jpeg/PIA21775.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'stripes',
      colors: ['#D8CA9D', '#B8860B', '#8B7355', '#DAA520'],
      size: 1024
    }
  },

  // Saturn from Cassini mission
  SATURN: {
    url: 'https://photojournal.jpl.nasa.gov/jpeg/PIA17172.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'stripes',
      colors: ['#FAD5A5', '#DAA520', '#B8860B'],
      size: 1024
    }
  },

  // Sun texture (solar surface)
  SUN: {
    url: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_0304.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'checker',
      colors: ['#FDB813', '#FF6B35', '#FFA500'],
      size: 512
    }
  },

  // Venus from Magellan mission
  VENUS: {
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/37000/37998/Venus_C3-Magellan-Mosaic_global_1024.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'earth',
      colors: ['#FFC649', '#FFD700', '#FFA500'],
      size: 512
    }
  },

  // Mercury from MESSENGER mission
  MERCURY: {
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/44000/44681/mercury_mosaic_1024.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'checker',
      colors: ['#8C7853', '#A0522D', '#696969'],
      size: 512
    }
  },

  // Uranus from Voyager 2
  URANUS: {
    url: 'https://photojournal.jpl.nasa.gov/jpeg/PIA18182.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'checker',
      colors: ['#4FD0E7', '#00CED1', '#87CEEB'],
      size: 512
    }
  },

  // Neptune from Voyager 2
  NEPTUNE: {
    url: 'https://photojournal.jpl.nasa.gov/jpeg/PIA01492.jpg',
    anisotropy: 16,
    isColor: true,
    fallbackPattern: {
      type: 'checker',
      colors: ['#4B70DD', '#000080', '#191970'],
      size: 512
    }
  }
}

// Helper function to get texture for a planet
export function getPlanetTexture(planetName: string): TextureSpec | null {
  return PLANETARY_TEXTURES[planetName.toUpperCase()] || null
}

// Alternative texture sources (uncomment to use different sources)
// export const ALTERNATIVE_TEXTURES = {
//   EARTH: {
//     url: 'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg',
//     anisotropy: 16,
//     isColor: true
//   },
//   MOON: {
//     url: 'https://www.solarsystemscope.com/textures/download/2k_moon.jpg',
//     anisotropy: 16,
//     isColor: true
//   }
// }
