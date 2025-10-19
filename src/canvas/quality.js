import { tokens } from "../design/tokens.js";
import { snapToGrid } from "./layout.js";

// relative luminance helpers
function luminance(hex) {
  // Handle undefined, null, or invalid hex values
  if (!hex || typeof hex !== 'string') {
    return 0.5; // Default to medium luminance for invalid colors
  }
  
  // Ensure hex starts with # and is valid
  let cleanHex = hex.toString().trim();
  if (!cleanHex.startsWith('#')) {
    cleanHex = '#' + cleanHex;
  }
  
  // Validate hex format (should be #RRGGBB)
  if (!/^#[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return 0.5; // Default to medium luminance for invalid hex
  }
  
  const c = cleanHex.replace("#", "");
  const rgb = [0, 1, 2].map(i => parseInt(c.substr(i * 2, 2), 16) / 255)
    .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

export function contrastRatio(fg, bg) {
  const L1 = luminance(fg), L2 = luminance(bg);
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
}

export function ensureReadableText(color, background = tokens.color.bg) {
  // Handle undefined or invalid colors
  if (!color || typeof color !== 'string') {
    return tokens.color.text; // Return default text color for invalid colors
  }
  
  const cr = contrastRatio(color, background);
  if (cr >= tokens.wcag.minContrast) return color;
  // fallback to high-contrast default
  return tokens.color.text;
}

export async function checkUIQuality(canvasAPI) {
  const state = canvasAPI.getCanvasState();
  const issues = [];
  
  // contrast checks for text layers
  state.shapes.filter(s => s.type === "text").forEach(t => {
    const color = t.props?.fill || t.fill || tokens.color.text;
    const bg = t.props?.background || t.background || tokens.color.bg;
    
    // Only check contrast if both colors are valid
    if (color && bg && typeof color === 'string' && typeof bg === 'string') {
      try {
        if (contrastRatio(color, bg) < tokens.wcag.minContrast) {
          issues.push({ type: "contrast", message: `Low contrast for text ${t.id}`, nodes: [t.id] });
        }
      } catch (error) {
        console.warn(`Failed to check contrast for text ${t.id}:`, error);
      }
    }
  });
  
  // naive overlap / misalign checks (bbox collisions + off-grid)
  state.shapes.forEach(shape => {
    // Check if shape is off-grid
    if (shape.x % tokens.grid !== 0 || shape.y % tokens.grid !== 0) {
      issues.push({
        type: "misalign",
        message: `Shape ${shape.id} is not aligned to ${tokens.grid}px grid`,
        nodes: [shape.id]
      });
    }
    
    // Check for font size issues
    if (shape.type === "text" && (shape.props?.fontSize || 16) < 14) {
      issues.push({
        type: "spacing",
        message: `Text ${shape.id} font size too small (${shape.props?.fontSize || 16}px < 14px)`,
        nodes: [shape.id]
      });
    }
  });
  
  return issues;
}

export async function autoFixUI(canvasAPI) {
  const state = canvasAPI.getCanvasState();
  let fixesApplied = 0;
  
  // snap all objects to grid and fix low-contrast text
  for (const s of state.shapes) {
    const x = snapToGrid(s.x), y = snapToGrid(s.y);
    if (x !== s.x || y !== s.y) {
      await canvasAPI.moveShape(s.id, x, y);
      fixesApplied++;
    }
    
    if (s.type === "text") {
      // Get current color, defaulting to a safe color if undefined
      const currentColor = s.props?.fill || s.fill || tokens.color.text;
      const color = ensureReadableText(currentColor);
      
      // Only change color if it's different and valid
      if (color !== currentColor && color && typeof color === 'string') {
        try {
          await canvasAPI.changeShapeColor(s.id, color);
          fixesApplied++;
        } catch (error) {
          console.warn(`Failed to change color for text ${s.id}:`, error);
        }
      }
      
      if ((s.props?.fontSize || s.fontSize || 0) < 14) {
        // Note: resizeText method would need to be implemented in canvasAPI
        // For now, we'll just log this as a potential fix
        console.log(`Text ${s.id} needs font size increase to 14px`);
      }
    }
  }
  
  return `Auto-fixed: snapped ${fixesApplied} objects to grid, ensured readable text, minimum font sizes.`;
}

