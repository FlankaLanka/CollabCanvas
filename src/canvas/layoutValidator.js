/**
 * Layout Sanity Validator
 * Validates and corrects UI layout before Final Answer
 */

import { tokens } from '../design/tokens.js';

export class LayoutValidator {
  constructor(canvasAPI) {
    this.canvasAPI = canvasAPI;
  }

  /**
   * Validate and fix layout for a login form
   */
  async validateLoginForm() {
    const state = this.canvasAPI.getCanvasState();
    const issues = [];
    const fixes = [];

    // Find the container
    const container = state.shapes.find(s => 
      s.type === 'rectangle' && s.width >= 300 && s.height >= 200
    );

    if (!container) {
      issues.push({
        type: 'missing_container',
        severity: 'high',
        message: 'No form container found',
        fix: 'Create a form container first'
      });
      return { valid: false, issues, fixes };
    }

    // Find form elements
    const textElements = state.shapes.filter(s => s.type === 'text');
    const inputElements = state.shapes.filter(s => 
      s.type === 'rectangle' && s.width >= 200 && s.height >= 30 && s.height <= 50
    );

    // Check container bounds
    const containerBounds = {
      left: container.x - container.width / 2,
      right: container.x + container.width / 2,
      top: container.y - container.height / 2,
      bottom: container.y + container.height / 2
    };

    // Validate all elements are within container
    for (const shape of [...textElements, ...inputElements]) {
      if (shape.x < containerBounds.left || shape.x > containerBounds.right ||
          shape.y < containerBounds.top || shape.y > containerBounds.bottom) {
        issues.push({
          type: 'outside_container',
          severity: 'high',
          message: `Element "${shape.text || shape.id}" is outside container bounds`,
          shapeId: shape.id,
          fix: 'Move element inside container'
        });
      }
    }

    // Check input alignment
    if (inputElements.length > 0) {
      const inputXPositions = inputElements.map(i => i.x);
      const uniqueXPositions = [...new Set(inputXPositions)];
      
      if (uniqueXPositions.length > 1) {
        issues.push({
          type: 'input_misalignment',
          severity: 'high',
          message: 'Input fields are not aligned',
          fix: 'Align all inputs to same X position'
        });

        // Fix: align all inputs to the leftmost position
        const leftmostX = Math.min(...inputXPositions);
        for (const input of inputElements) {
          await this.canvasAPI.moveShape(input.id, leftmostX, input.y);
          fixes.push({
            type: 'aligned_input',
            shapeId: input.id,
            newX: leftmostX
          });
        }
      }
    }

    // Check input width consistency
    if (inputElements.length > 1) {
      const inputWidths = inputElements.map(i => i.width);
      const uniqueWidths = [...new Set(inputWidths)];
      
      if (uniqueWidths.length > 1) {
        issues.push({
          type: 'input_width_inconsistency',
          severity: 'medium',
          message: 'Input fields have different widths',
          fix: 'Make all inputs same width'
        });

        // Fix: set all inputs to the widest width
        const maxWidth = Math.max(...inputWidths);
        for (const input of inputElements) {
          await this.canvasAPI.resizeShape(input.id, { width: maxWidth });
          fixes.push({
            type: 'resized_input',
            shapeId: input.id,
            newWidth: maxWidth
          });
        }
      }
    }

    // Check vertical spacing
    const allElements = [...textElements, ...inputElements].sort((a, b) => a.y - b.y);
    for (let i = 0; i < allElements.length - 1; i++) {
      const current = allElements[i];
      const next = allElements[i + 1];
      const spacing = next.y - (current.y + (current.height || 40));
      
      if (spacing < 16 || spacing > 32) {
        issues.push({
          type: 'inconsistent_spacing',
          severity: 'medium',
          message: `Spacing between elements is ${spacing}px (should be 16-32px)`,
          fix: 'Adjust vertical spacing to 24px'
        });

        // Fix: adjust spacing
        const targetY = current.y + (current.height || 40) + 24;
        await this.canvasAPI.moveShape(next.id, next.x, targetY);
        fixes.push({
          type: 'adjusted_spacing',
          shapeId: next.id,
          newY: targetY
        });
      }
    }

    // Check button alignment
    const button = inputElements.find(i => 
      i.fill === '#3B82F6' || i.fill === '#2563EB'
    );
    
    if (button && inputElements.length > 0) {
      const inputX = inputElements[0].x;
      const inputWidth = inputElements[0].width;
      const buttonCenterX = inputX + inputWidth / 2;
      
      if (Math.abs(button.x - buttonCenterX) > 5) {
        issues.push({
          type: 'button_misalignment',
          severity: 'high',
          message: 'Button is not centered below inputs',
          fix: 'Center button below inputs'
        });

        // Fix: center button
        await this.canvasAPI.moveShape(button.id, buttonCenterX, button.y);
        fixes.push({
          type: 'centered_button',
          shapeId: button.id,
          newX: buttonCenterX
        });
      }
    }

    // Check text contrast
    for (const text of textElements) {
      const textColor = text.fill || '#000000';
      const bgColor = text.background || '#FFFFFF';
      const contrast = this._calculateContrast(textColor, bgColor);
      
      if (contrast < 4.5) {
        issues.push({
          type: 'low_contrast',
          severity: 'high',
          message: `Text "${text.text}" has low contrast (${contrast.toFixed(1)}:1)`,
          shapeId: text.id,
          fix: 'Change text color to high contrast'
        });

        // Fix: use high contrast color
        const highContrastColor = '#111827';
        await this.canvasAPI.changeShapeColor(text.id, highContrastColor);
        fixes.push({
          type: 'fixed_contrast',
          shapeId: text.id,
          newColor: highContrastColor
        });
      }
    }

    const valid = issues.filter(i => i.severity === 'high').length === 0;
    
    return {
      valid,
      issues,
      fixes,
      score: Math.max(0, 100 - (issues.length * 10)),
      message: valid 
        ? 'Layout is valid and follows design system' 
        : `Found ${issues.length} issues, applied ${fixes.length} fixes`
    };
  }

  /**
   * Validate and fix layout for a navigation bar
   */
  async validateNavigationBar() {
    const state = this.canvasAPI.getCanvasState();
    const issues = [];
    const fixes = [];

    // Find the container
    const container = state.shapes.find(s => 
      s.type === 'rectangle' && s.width >= 600 && s.height >= 40 && s.height <= 80
    );

    if (!container) {
      issues.push({
        type: 'missing_container',
        severity: 'high',
        message: 'No navigation container found',
        fix: 'Create a navigation container first'
      });
      return { valid: false, issues, fixes };
    }

    // Find menu items
    const menuItems = state.shapes.filter(s => 
      s.type === 'text' && s.fontSize >= 14 && s.fontSize <= 18
    );

    // Check horizontal alignment
    if (menuItems.length > 1) {
      const yPositions = menuItems.map(m => m.y);
      const uniqueYPositions = [...new Set(yPositions)];
      
      if (uniqueYPositions.length > 1) {
        issues.push({
          type: 'menu_misalignment',
          severity: 'high',
          message: 'Menu items are not horizontally aligned',
          fix: 'Align all menu items to same Y position'
        });

        // Fix: align all menu items to center Y
        const centerY = container.y;
        for (const item of menuItems) {
          await this.canvasAPI.moveShape(item.id, item.x, centerY);
          fixes.push({
            type: 'aligned_menu_item',
            shapeId: item.id,
            newY: centerY
          });
        }
      }
    }

    // Check spacing between menu items
    const sortedItems = menuItems.sort((a, b) => a.x - b.x);
    for (let i = 0; i < sortedItems.length - 1; i++) {
      const current = sortedItems[i];
      const next = sortedItems[i + 1];
      const spacing = next.x - (current.x + (current.width || 50));
      
      if (spacing < 20 || spacing > 60) {
        issues.push({
          type: 'inconsistent_menu_spacing',
          severity: 'medium',
          message: `Menu spacing is ${spacing}px (should be 30-50px)`,
          fix: 'Adjust menu item spacing'
        });
      }
    }

    const valid = issues.filter(i => i.severity === 'high').length === 0;
    
    return {
      valid,
      issues,
      fixes,
      score: Math.max(0, 100 - (issues.length * 10)),
      message: valid 
        ? 'Navigation layout is valid' 
        : `Found ${issues.length} issues, applied ${fixes.length} fixes`
    };
  }

  /**
   * Calculate contrast ratio between two colors
   */
  _calculateContrast(color1, color2) {
    const l1 = this._getLuminance(color1);
    const l2 = this._getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Get relative luminance of a color
   */
  _getLuminance(hex) {
    const rgb = this._hexToRgb(hex);
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }
}

