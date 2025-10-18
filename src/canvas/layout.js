import { tokens } from "../design/tokens.js";

export function snapToGrid(n, g = tokens.grid) {
  return Math.round(n / g) * g;
}

export function centerX(containerWidth, elementWidth, viewportCenterX = 400) {
  return snapToGrid(viewportCenterX - elementWidth / 2);
}

export function vstack(items, startX, startY, gap = tokens.spacing.md) {
  let y = startY;
  return items.map((it, i) => ({ id: it.id, x: startX, y: (i === 0 ? y : (y += items[i - 1].height + gap)) }));
}

export function hstack(items, startX, startY, gap = tokens.spacing.md) {
  let x = startX;
  return items.map((it, i) => ({ id: it.id, x: (i === 0 ? x : (x += items[i - 1].width + gap)), y: startY }));
}

export function gridLayout(items, rows, cols, startX, startY, gap = tokens.spacing.md) {
  return items.map((it, idx) => {
    const r = Math.floor(idx / cols), c = idx % cols;
    return { id: it.id, x: snapToGrid(startX + c * (it.width + gap)), y: snapToGrid(startY + r * (it.height + gap)) };
  });
}

