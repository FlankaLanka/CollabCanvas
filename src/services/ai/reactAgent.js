/**
 * Canvas ReAct Agent - LangChain-based reasoning agent
 * 
 * Implements a ReAct (Reasoning + Acting) agent using LangChain's framework
 * for multi-step reasoning and tool execution on the collaborative canvas.
 */

import { ChatOpenAI } from "@langchain/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { BufferMemory } from "langchain/memory";
import { createAllTools } from './tools/index.js';
import { SemanticInterpreter } from './semanticInterpreter.js';
import { SYSTEM_PROMPT } from './prompts.js';

// Environment detection
const isDevelopment = process.env.NODE_ENV !== 'production';

// API endpoint configuration
const AI_API_ENDPOINT = isDevelopment 
  ? 'http://localhost:3001/api/ai-chat'
  : '/api/ai-chat';

/**
 * Custom fetch function to route through our proxy
 */
const customFetch = async (url, options) => {
  // Route all OpenAI calls through our proxy
  const proxyUrl = AI_API_ENDPOINT;
  return fetch(proxyUrl, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify({
      messages: options.body ? JSON.parse(options.body) : [],
      temperature: 0.2,
      max_tokens: 2000
    })
  });
};

/**
 * Canvas ReAct Agent
 * 
 * Uses LangChain's ReAct framework for multi-step reasoning and tool execution.
 * Can handle complex tasks by breaking them into smaller steps and using
 * the appropriate tools for each step.
 */
export class CanvasReActAgent {
  constructor(canvasAPI) {
    this.canvasAPI = canvasAPI;
    this.model = null;
    this.executor = null;
    this.memory = null;
    this.semanticInterpreter = new SemanticInterpreter();
    this.isInitialized = false;
  }
  
  /**
   * Initialize the ReAct agent with tools and memory
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // For now, use a simplified approach that works with the existing server
      // The server handles the OpenAI API calls, we just need to prepare the tools
      this.tools = createAllTools(this.canvasAPI);
      
      // Initialize BufferMemory for conversation tracking
      this.memory = new BufferMemory({
        returnMessages: true,
        memoryKey: "chat_history",
        inputKey: "input",
        outputKey: "output"
      });
      
      this.isInitialized = true;
      console.log('🤖 ReAct agent initialized with', this.tools.length, 'tools');
    } catch (error) {
      console.error('❌ Failed to initialize ReAct agent:', error);
      throw error;
    }
  }
  
  /**
   * Process a user command using semantic interpretation + ReAct reasoning
   */
  async processCommand(userInput) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Step 1: Semantic interpretation
      const canvasState = this.canvasAPI.getCanvasState();
      const interpretation = await this.semanticInterpreter.interpretCommand(userInput, canvasState);
      
      let normalizedInput = userInput;
      let interpretationInfo = null;
      
      if (interpretation.success) {
        normalizedInput = interpretation.normalizedInput;
        interpretationInfo = interpretation.interpretedCommand;
        console.log('🧠 Semantic interpretation:', interpretationInfo);
      } else {
        console.log('⚠️ Using original input (interpretation failed):', interpretation.error);
      }
      
      // Step 2: Enhanced ReAct processing with system prompt
      const response = await fetch(AI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: normalizedInput
            }
          ],
          temperature: 0.2,
          canvasState: canvasState
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      const aiResponse = result.choices[0].message.content;
      
      return {
        success: true,
        response: aiResponse,
        intermediateSteps: [],
        reasoning: [],
        agentUsed: 'enhanced-react',
        interpretation: interpretationInfo,
        originalInput: userInput,
        normalizedInput: normalizedInput
      };
    } catch (error) {
      console.error('❌ Enhanced ReAct agent error:', error);
      return {
        success: false,
        error: error.message,
        response: `I encountered an error: ${error.message}`,
        agentUsed: 'enhanced-react'
      };
    }
  }
  
  /**
   * Format intermediate steps for user feedback
   */
  _formatReasoning(steps) {
    if (!steps || steps.length === 0) {
      return [];
    }
    
    return steps.map((step, i) => ({
      step: i + 1,
      thought: step.action?.log || 'Processing...',
      action: step.action?.tool || 'Unknown',
      observation: step.observation || 'No observation'
    }));
  }
  
  /**
   * Get agent status and capabilities
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      hasMemory: !!this.memory,
      hasExecutor: !!this.executor,
      toolCount: this.isInitialized ? createAllTools(this.canvasAPI).length : 0
    };
  }
  
  /**
   * Clear conversation memory
   */
  async clearMemory() {
    if (this.memory) {
      await this.memory.clear();
    }
  }
}
