/**
 * Command Preprocessor for Non-Complex Commands
 * 
 * Analyzes and enhances non-complex commands before execution
 * to improve reasoning capabilities and user feedback.
 */

import { ReasoningValidator } from './reasoningValidator.js';

export class CommandPreprocessor {
  constructor(canvasAPI) {
    this.canvasAPI = canvasAPI;
    this.reasoningValidator = new ReasoningValidator(canvasAPI);
  }

  /**
   * Preprocess a command to enhance reasoning and validation
   */
  async preprocessCommand(userMessage, functionCall) {
    const preprocessing = {
      originalCommand: userMessage,
      functionName: functionCall.name,
      enhancedParams: { ...functionCall.arguments },
      validation: null,
      reasoning: [],
      shouldExecute: true,
      userFeedback: ''
    };

    try {
      // Categorize the command type
      const commandType = this.categorizeCommand(functionCall.name, userMessage);
      preprocessing.reasoning.push(`Command categorized as: ${commandType}`);

      // Apply appropriate validation and enhancement
      switch (commandType) {
        case 'manipulation':
          preprocessing.validation = await this.reasoningValidator.validateManipulationCommand(
            userMessage, 
            functionCall.arguments
          );
          break;
          
        case 'layout':
          preprocessing.validation = await this.reasoningValidator.validateLayoutCommand(
            userMessage, 
            functionCall.arguments
          );
          break;
          
        case 'creation':
          // Creation commands don't need shape existence validation
          preprocessing.reasoning.push('Creation command - no shape validation needed');
          break;
          
        default:
          preprocessing.reasoning.push('Unknown command type - proceeding with basic validation');
      }

      // Apply validation results
      if (preprocessing.validation) {
        preprocessing.enhancedParams = preprocessing.validation.enhancedParams;
        preprocessing.shouldExecute = preprocessing.validation.isValid;
        
        if (!preprocessing.validation.isValid) {
          preprocessing.userFeedback = this.reasoningValidator.generateFeedback(
            preprocessing.validation, 
            userMessage
          );
        } else if (preprocessing.validation.warnings.length > 0) {
          preprocessing.userFeedback = this.reasoningValidator.generateFeedback(
            preprocessing.validation, 
            userMessage
          );
        }
      }

      // Add reasoning to preprocessing
      if (preprocessing.validation && preprocessing.validation.reasoning) {
        preprocessing.reasoning.push(...preprocessing.validation.reasoning);
      }

      return preprocessing;
    } catch (error) {
      preprocessing.shouldExecute = false;
      preprocessing.userFeedback = `❌ Command preprocessing failed: ${error.message}`;
      preprocessing.reasoning.push(`Preprocessing error: ${error.message}`);
      return preprocessing;
    }
  }

  /**
   * Categorize a command based on function name and user message
   */
  categorizeCommand(functionName, userMessage) {
    const message = userMessage.toLowerCase();
    
    // Manipulation commands
    if (['moveShape', 'resizeShape', 'rotateShape', 'changeShapeColor', 'changeShapeText', 'deleteShape'].includes(functionName)) {
      return 'manipulation';
    }
    
    // Layout commands
    if (['arrangeShapes', 'createMultipleShapes', 'arrangeShapesInRow', 'arrangeShapesInGrid', 
         'distributeShapesEvenly', 'centerGroup', 'layoutStack', 'layoutGrid'].includes(functionName)) {
      return 'layout';
    }
    
    // Creation commands
    if (['createShape', 'createLoginForm', 'createNavigationBar', 'createCardLayout'].includes(functionName)) {
      return 'creation';
    }
    
    // Query commands
    if (['getCanvasState', 'listShapes', 'identifyShape'].includes(functionName)) {
      return 'query';
    }
    
    return 'unknown';
  }

  /**
   * Generate enhanced user feedback based on preprocessing results
   */
  generateEnhancedFeedback(preprocessing, executionResult = null) {
    let feedback = '';
    
    if (!preprocessing.shouldExecute) {
      feedback = preprocessing.userFeedback;
    } else if (preprocessing.userFeedback) {
      feedback = preprocessing.userFeedback;
    } else if (executionResult) {
      // Generate feedback based on execution results
      feedback = this.generateExecutionFeedback(preprocessing, executionResult);
    } else {
      feedback = '✅ Command processed successfully';
    }
    
    return feedback;
  }

  /**
   * Generate feedback based on execution results
   */
  generateExecutionFeedback(preprocessing, executionResult) {
    const commandType = this.categorizeCommand(preprocessing.functionName, preprocessing.originalCommand);
    
    switch (commandType) {
      case 'manipulation':
        if (executionResult && executionResult.description) {
          return `✅ Successfully manipulated ${executionResult.description}`;
        } else {
          return `✅ Manipulation completed successfully`;
        }
        
      case 'layout':
        if (executionResult && executionResult.shapes) {
          return `✅ Layout applied to ${executionResult.shapes.length} shapes`;
        } else {
          return `✅ Layout operation completed successfully`;
        }
        
      case 'creation':
        if (executionResult && executionResult.type) {
          return `✅ Created ${executionResult.type} successfully`;
        } else {
          return `✅ Creation completed successfully`;
        }
        
      default:
        return `✅ Command executed successfully`;
    }
  }

  /**
   * Check if a command should be preprocessed
   */
  shouldPreprocess(functionName) {
    // Don't preprocess complex commands or query commands
    const skipPreprocessing = [
      'createLoginForm',
      'createNavigationBar', 
      'createCardLayout',
      'getCanvasState',
      'listShapes',
      'identifyShape'
    ];
    
    return !skipPreprocessing.includes(functionName);
  }

  /**
   * Get reasoning summary for debugging
   */
  getReasoningSummary(preprocessing) {
    return {
      command: preprocessing.originalCommand,
      function: preprocessing.functionName,
      shouldExecute: preprocessing.shouldExecute,
      reasoning: preprocessing.reasoning,
      validationErrors: preprocessing.validation?.errors || [],
      validationWarnings: preprocessing.validation?.warnings || []
    };
  }
}
