/**
 * LangSmith Tracing Service
 * 
 * This service initializes LangSmith tracing for all LLM calls in the application.
 * It provides a traced ChatOpenAI client that automatically sends all interactions
 * to the LangSmith dashboard for monitoring and debugging.
 */

import { ChatOpenAI } from '@langchain/openai';
import { Client } from 'langsmith';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class LangSmithService {
  constructor() {
    this.isInitialized = false;
    this.client = null;
    this.tracedLLM = null;
    
    // Environment variables
    this.apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    this.langchainApiKey = process.env.LANGCHAIN_API_KEY;
    this.project = process.env.LANGCHAIN_PROJECT || 'my-agent';
    this.tracingEnabled = process.env.LANGCHAIN_TRACING_V2 === 'true';
    this.endpoint = process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com';
    
    this.validateConfiguration();
  }

  /**
   * Validate that all required configuration is present
   */
  validateConfiguration() {
    const missing = [];
    
    if (!this.apiKey) {
      missing.push('OPENAI_API_KEY or VITE_OPENAI_API_KEY');
    }
    
    if (!this.langchainApiKey) {
      missing.push('LANGCHAIN_API_KEY');
    }
    
    if (missing.length > 0) {
      console.warn('⚠️ LangSmith configuration incomplete. Missing:', missing.join(', '));
      console.warn('LangSmith tracing will be disabled.');
      this.tracingEnabled = false;
    }
    
    if (this.tracingEnabled) {
      console.log('✅ LangSmith tracing enabled for project:', this.project);
    }
  }

  /**
   * Initialize the LangSmith client and traced LLM
   */
  async initialize() {
    if (this.isInitialized) {
      return this.tracedLLM;
    }

    try {
      if (!this.tracingEnabled) {
        // Fallback to regular ChatOpenAI without tracing
        this.tracedLLM = new ChatOpenAI({
          openAIApiKey: this.apiKey,
          modelName: 'gpt-4o-mini',
          temperature: 0.2,
        });
        
        console.log('📝 Using regular ChatOpenAI (tracing disabled)');
        this.isInitialized = true;
        return this.tracedLLM;
      }

      // Initialize LangSmith client
      this.client = new Client({
        apiKey: this.langchainApiKey,
        apiUrl: this.endpoint,
      });

      // Create traced ChatOpenAI client
      this.tracedLLM = new ChatOpenAI({
        openAIApiKey: this.apiKey,
        modelName: 'gpt-4o-mini',
        temperature: 0.2,
        // LangSmith will automatically trace this client
        // when LANGCHAIN_TRACING_V2=true is set
      });

      console.log('🔍 LangSmith tracing initialized successfully');
      console.log(`📊 Traces will appear in project: ${this.project}`);
      console.log(`🌐 LangSmith endpoint: ${this.endpoint}`);
      
      this.isInitialized = true;
      return this.tracedLLM;

    } catch (error) {
      console.error('❌ Failed to initialize LangSmith tracing:', error);
      
      // Fallback to regular ChatOpenAI
      this.tracedLLM = new ChatOpenAI({
        openAIApiKey: this.apiKey,
        modelName: 'gpt-4o-mini',
        temperature: 0.2,
      });
      
      this.isInitialized = true;
      return this.tracedLLM;
    }
  }

  /**
   * Get the traced LLM client
   */
  async getTracedLLM() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.tracedLLM;
  }

  /**
   * Create a traced run for a specific operation
   */
  async createTracedRun(name, description = '') {
    if (!this.tracingEnabled || !this.client) {
      return null;
    }

    try {
      const run = await this.client.createRun({
        name,
        description,
        projectName: this.project,
        runType: 'chain',
      });
      
      console.log(`🔍 Created traced run: ${name}`);
      return run;
    } catch (error) {
      // Don't log as error if it's a permission issue - tracing will still work
      if (error.status === 403) {
        console.warn('⚠️ LangSmith API key may not have write permissions, but tracing will still work');
      } else {
        console.error('❌ Failed to create traced run:', error);
      }
      return null;
    }
  }

  /**
   * Get the current project name
   */
  getProjectName() {
    return this.project;
  }

  /**
   * Check if tracing is enabled
   */
  isTracingEnabled() {
    return this.tracingEnabled;
  }

  /**
   * Get tracing status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      tracingEnabled: this.tracingEnabled,
      project: this.project,
      endpoint: this.endpoint,
      hasApiKey: !!this.apiKey,
      hasLangchainKey: !!this.langchainApiKey,
    };
  }
}

// Create singleton instance
const langsmithService = new LangSmithService();

export default langsmithService;
export { LangSmithService };
