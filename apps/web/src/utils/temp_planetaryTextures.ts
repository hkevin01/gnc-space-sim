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
