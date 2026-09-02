// Utility for subtle haptic feedback on mobile devices

export function triggerHaptic(pattern: number | number[] = 30) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore if vibration is restricted or unsupported
    }
  }
}
