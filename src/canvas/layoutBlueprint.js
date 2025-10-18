/**
 * Layout Blueprint Planning System
 * Generates structured layout plans before executing tool calls
 */

export class LayoutBlueprint {
  constructor() {
    this.blueprint = null;
  }

  /**
   * Generate a layout blueprint for a login form
   */
  generateLoginFormBlueprint() {
    return {
      type: 'loginForm',
      container: {
        width: 360,
        height: 400,
        centerX: 400,
        centerY: 300,
        background: '#F8FAFC',
        border: '#E2E8F0'
      },
      elements: [
        {
          type: 'title',
          text: 'Login',
          fontSize: 24,
          fontWeight: 'bold',
          color: '#111827',
          position: { x: 'center', y: 'top', offsetY: 20 }
        },
        {
          type: 'label',
          text: 'Username',
          fontSize: 14,
          color: '#111827',
          position: { x: 'left', y: 'below_title', offsetY: 24 }
        },
        {
          type: 'input',
          placeholder: 'Enter your username',
          width: '100%',
          height: 40,
          position: { x: 'left', y: 'below_label', offsetY: 8 }
        },
        {
          type: 'label',
          text: 'Password',
          fontSize: 14,
          color: '#111827',
          position: { x: 'left', y: 'below_input', offsetY: 24 }
        },
        {
          type: 'input',
          placeholder: '••••••••',
          width: '100%',
          height: 40,
          position: { x: 'left', y: 'below_label', offsetY: 8 }
        },
        {
          type: 'button',
          text: 'Log In',
          width: '100%',
          height: 40,
          background: '#3B82F6',
          color: '#FFFFFF',
          position: { x: 'center', y: 'below_input', offsetY: 24 }
        }
      ],
      spacing: {
        vertical: 24,
        labelToInput: 8,
        containerPadding: 24
      },
      alignment: {
        containerCenter: true,
        inputsLeftAligned: true,
        buttonCentered: true,
        labelsLeftAligned: true
      }
    };
  }

  /**
   * Generate a layout blueprint for a navigation bar
   */
  generateNavigationBarBlueprint() {
    return {
      type: 'navigationBar',
      container: {
        width: 800,
        height: 60,
        centerX: 400,
        centerY: 40,
        background: '#1F2937',
        border: 'none'
      },
      elements: [
        {
          type: 'logo',
          text: 'Brand',
          fontSize: 20,
          fontWeight: 'bold',
          color: '#FFFFFF',
          position: { x: 'left', y: 'center', offsetX: 20 }
        },
        {
          type: 'menuItem',
          text: 'Home',
          fontSize: 16,
          color: '#3B82F6',
          position: { x: 'center', y: 'center', offsetX: -120 }
        },
        {
          type: 'menuItem',
          text: 'About',
          fontSize: 16,
          color: '#9CA3AF',
          position: { x: 'center', y: 'center', offsetX: -40 }
        },
        {
          type: 'menuItem',
          text: 'Services',
          fontSize: 16,
          color: '#9CA3AF',
          position: { x: 'center', y: 'center', offsetX: 40 }
        },
        {
          type: 'menuItem',
          text: 'Contact',
          fontSize: 16,
          color: '#9CA3AF',
          position: { x: 'center', y: 'center', offsetX: 120 }
        },
        {
          type: 'ctaButton',
          text: 'Get Started',
          fontSize: 14,
          color: '#FFFFFF',
          background: '#3B82F6',
          position: { x: 'right', y: 'center', offsetX: -20 }
        }
      ],
      spacing: {
        horizontal: 40,
        containerPadding: 20
      },
      alignment: {
        containerCenter: true,
        itemsHorizontallyCentered: true,
        logoLeftAligned: true,
        ctaRightAligned: true
      }
    };
  }

  /**
   * Generate a layout blueprint for a card layout
   */
  generateCardLayoutBlueprint() {
    return {
      type: 'cardLayout',
      container: {
        width: 300,
        height: 400,
        centerX: 400,
        centerY: 300,
        background: '#FFFFFF',
        border: '#D1D5DB',
        borderWidth: 2
      },
      elements: [
        {
          type: 'title',
          text: 'Card Title',
          fontSize: 20,
          fontWeight: 'bold',
          color: '#000000',
          position: { x: 'center', y: 'top', offsetY: 20 }
        },
        {
          type: 'image',
          placeholder: '[Image Placeholder]',
          width: 260,
          height: 160,
          background: '#E5E7EB',
          position: { x: 'center', y: 'below_title', offsetY: 20 }
        },
        {
          type: 'description',
          text: 'This is a description text that appears below the image in the card layout.',
          fontSize: 14,
          color: '#374151',
          width: 260,
          position: { x: 'center', y: 'below_image', offsetY: 20 }
        }
      ],
      spacing: {
        vertical: 20,
        containerPadding: 20
      },
      alignment: {
        containerCenter: true,
        titleCentered: true,
        imageCentered: true,
        descriptionCentered: true
      }
    };
  }

  /**
   * Get the current blueprint
   */
  getBlueprint() {
    return this.blueprint;
  }

  /**
   * Set the current blueprint
   */
  setBlueprint(blueprint) {
    this.blueprint = blueprint;
  }
}

