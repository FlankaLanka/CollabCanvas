/**
 * Composite Tools - High-level UI component creation
 * 
 * These tools create complete UI components like forms, navigation bars, and cards.
 * They can be used as single-step operations or decomposed by the agent.
 */

import { DynamicTool } from "langchain/tools";

/**
 * Create a professional login form
 */
export function createLoginFormTool(canvasAPI) {
  return new DynamicTool({
    name: "createLoginForm",
    description: `Create a professional login form with username, password fields, and login button.
    
    Parameters:
    - x: number (optional, X position, defaults to viewport center)
    - y: number (optional, Y position, defaults to viewport center)
    - width: number (optional, form width, defaults to 320)
    
    Example input: x=0, y=0, width=350`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.createLoginForm(params);
        return `Created professional login form with ${result.components.length} components (username field, password field, and login button)`;
      } catch (error) {
        return `Error creating login form: ${error.message}`;
      }
    }
  });
}

/**
 * Create a navigation bar
 */
export function createNavigationBarTool(canvasAPI) {
  return new DynamicTool({
    name: "createNavigationBar",
    description: `Create a professional navigation bar with menu items.
    
    Parameters:
    - x: number (optional, X position, defaults to viewport center)
    - y: number (optional, Y position, defaults to viewport center)
    - width: number (optional, nav bar width, defaults to 600)
    - menuItems: array of strings (optional, menu item labels, defaults to ["Home", "About", "Services", "Contact"])
    
    Example input: x=400, y=50, width=500, menuItems=Home,About,Products,Contact`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.createNavigationBar(params);
        return `Created navigation bar with ${result.menuItems.length} menu items: ${result.menuItems.join(', ')}`;
      } catch (error) {
        return `Error creating navigation bar: ${error.message}`;
      }
    }
  });
}

/**
 * Create a card layout
 */
export function createCardLayoutTool(canvasAPI) {
  return new DynamicTool({
    name: "createCardLayout",
    description: `Create a professional card layout with title, image placeholder, description, and action button.
    
    Parameters:
    - x: number (optional, X position, defaults to viewport center)
    - y: number (optional, Y position, defaults to viewport center)
    - width: number (optional, card width, defaults to 300)
    - title: string (optional, card title, defaults to "Card Title")
    - description: string (optional, card description, defaults to "Card description goes here...")
    - buttonText: string (optional, button text, defaults to "Learn More")
    
    Example input: x=0, y=0, width=350, title=Product Card, description=This is a product description, buttonText=Buy Now`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.createCardLayout(params);
        return `Created card layout with title "${result.title}", description, image placeholder, and "${result.buttonText}" button`;
      } catch (error) {
        return `Error creating card layout: ${error.message}`;
      }
    }
  });
}

/**
 * Export all composite tools
 */
export function createCompositeTools(canvasAPI) {
  return [
    createLoginFormTool(canvasAPI),
    createNavigationBarTool(canvasAPI),
    createCardLayoutTool(canvasAPI)
  ];
}
