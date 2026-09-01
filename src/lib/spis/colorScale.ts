export const POTENTIAL_COLOR_LEVELS = 64;

const NEGATIVE = [33, 102, 172] as const;
const NEUTRAL = [247, 247, 247] as const;
const POSITIVE = [178, 24, 43] as const;

function interpolateColor(from: readonly number[], to: readonly number[], amount: number) {
  const t = Math.max(0, Math.min(1, amount));
  const channels = from.map((channel, index) => Math.round(channel + (to[index] - channel) * t));
  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
}

/** Signed blue-neutral-red scale using the actual data domain and zero as the neutral reference. */
export function getColorForValue(value: number, min: number, max: number): string {
  if (min === max) {
    if (value < 0) return interpolateColor(NEGATIVE, NEUTRAL, 0.5);
    if (value > 0) return interpolateColor(NEUTRAL, POSITIVE, 0.5);
    return interpolateColor(NEUTRAL, NEUTRAL, 0);
  }

  if (min < 0 && max > 0) {
    return value <= 0
      ? interpolateColor(NEGATIVE, NEUTRAL, (value - min) / (0 - min))
      : interpolateColor(NEUTRAL, POSITIVE, value / max);
  }
  if (max <= 0) return interpolateColor(NEGATIVE, NEUTRAL, (value - min) / (max - min));
  return interpolateColor(NEUTRAL, POSITIVE, (value - min) / (max - min));
}

export function generateColorLegend(
  min: number,
  max: number,
  steps: number = POTENTIAL_COLOR_LEVELS,
): { value: number; color: string }[] {
  if (min === max) return [{ value: min, color: getColorForValue(min, min, max) }];
  return Array.from({ length: steps }, (_, index) => {
    const value = min + (index / (steps - 1)) * (max - min);
    return { value, color: getColorForValue(value, min, max) };
  });
}
