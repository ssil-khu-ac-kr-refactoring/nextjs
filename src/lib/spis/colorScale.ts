// 3-tier discrete color scale: Light Green → Light Yellow → Light Red
export function getColorForValue(value: number, min: number, max: number): string {
  if (max === min) return 'hsl(130, 70%, 78%)';
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  if (normalized < 1 / 3) return 'hsl(130, 65%, 78%)';  // 연한 초록
  if (normalized < 2 / 3) return 'hsl(48, 95%, 80%)';   // 연한 노랑
  return 'hsl(0, 80%, 78%)';                             // 연한 빨강
}

export function generateColorLegend(min: number, max: number, steps: number = 10): { value: number; color: string }[] {
  const legend: { value: number; color: string }[] = [];
  for (let i = 0; i <= steps; i++) {
    const value = min + (i / steps) * (max - min);
    legend.push({ value, color: getColorForValue(value, min, max) });
  }
  return legend;
}
