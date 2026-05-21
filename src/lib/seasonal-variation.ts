export function getSeasonalPlantModifier(season: string, _stage: string) {
  const modifiers = {
    spring: { scale: 1.05, saturation: 1.1 },
    summer: { scale: 1.0, saturation: 1.2 },
    autumn: { scale: 0.95, saturation: 0.9 },
    winter: { scale: 0.9, saturation: 0.75 },
  };
  return modifiers[season] || modifiers.spring;
}
