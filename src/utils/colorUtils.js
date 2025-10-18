/**
 * Color utility functions for UI/UX analysis
 */

/**
 * Calculate contrast ratio between two colors (WCAG standard)
 */
export function calculateContrastRatio(color1, color2) {
  const luminance1 = getLuminance(color1);
  const luminance2 = getLuminance(color2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance of a color (WCAG standard)
 */
export function getLuminance(color) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  const [rs, gs, bs] = [r, g, b].map(c => 
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate average contrast across multiple color pairs
 */
export function calculateAverageContrast(colorPairs) {
  if (colorPairs.length === 0) return 0;
  
  const totalContrast = colorPairs.reduce((sum, pair) => {
    return sum + calculateContrastRatio(pair.background, pair.foreground);
  }, 0);
  
  return totalContrast / colorPairs.length;
}

/**
 * Check if contrast meets WCAG AA standards (4.5:1 minimum)
 */
export function meetsWCAGAA(background, foreground) {
  return calculateContrastRatio(background, foreground) >= 4.5;
}

/**
 * Check if contrast meets WCAG AAA standards (7:1 minimum)
 */
export function meetsWCAGAAA(background, foreground) {
  return calculateContrastRatio(background, foreground) >= 7;
}

/**
 * Get contrast level description
 */
export function getContrastLevel(background, foreground) {
  const ratio = calculateContrastRatio(background, foreground);
  
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Fail';
}
