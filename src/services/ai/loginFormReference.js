/**
 * Login Form Reference for AI Agent
 * 
 * This defines the expected structure and appearance of a properly generated login form.
 */

export const LOGIN_FORM_REFERENCE = {
  description: "Professional login form with proper alignment and styling",
  
  structure: {
    container: {
      type: "rectangle",
      width: 360,
      height: 450,
      fill: "#F9FAFB",
      stroke: "#E5E7EB",
      position: "centered in viewport"
    },
    
    elements: [
      {
        name: "title",
        type: "text",
        text: "Login",
        fontSize: 24,
        fill: "#111827",
        position: "centered horizontally, 50px from container top"
      },
      {
        name: "username_label",
        type: "text",
        text: "Username",
        fontSize: 14,
        fill: "#111827",
        position: "left-aligned, 40px below title"
      },
      {
        name: "username_input",
        type: "text_input", // MUST BE text_input, NOT rectangle
        width: 280,
        height: 40,
        fill: "#1F2937",
        background: "#FFFFFF",
        borderColor: "#D1D5DB",
        position: "left-aligned with label, 8px below username_label"
      },
      {
        name: "password_label",
        type: "text",
        text: "Password",
        fontSize: 14,
        fill: "#111827",
        position: "left-aligned, 20px below username_input"
      },
      {
        name: "password_input",
        type: "text_input", // MUST BE text_input, NOT rectangle
        width: 280,
        height: 40,
        fill: "#1F2937",
        background: "#FFFFFF",
        borderColor: "#D1D5DB",
        position: "left-aligned with label, 8px below password_label"
      },
      {
        name: "login_button",
        type: "button", // Creates rectangle + text overlay
        width: 280,
        height: 44,
        fill: "#3B82F6",
        textColor: "#FFFFFF",
        position: "centered horizontally, 24px below password_input"
      }
    ]
  },
  
  criticalRules: [
    "NEVER use rectangle shapes for input fields - ALWAYS use text_input type",
    "Labels MUST be positioned ABOVE their inputs, not behind them",
    "All inputs must have same width (280px) and be left-aligned",
    "Button must be centered horizontally",
    "All text must be black (#111827) for readability",
    "Input fields must have white background (#FFFFFF) with gray border (#D1D5DB)",
    "All elements must be within container bounds"
  ]
};
