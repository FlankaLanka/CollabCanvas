import { useState, useCallback, useRef, useEffect } from 'react';
import { useCanvas } from '../contexts/ModernCanvasContext';
import { AICanvasService } from '../services/ai';
import { CanvasAPI } from '../services/canvasAPI';

/**
 * useAI Hook - Manages AI interactions with the canvas
 * 
 * Provides a clean interface for React components to interact with the AI agent
 * Handles conversation state, processing status, and error management
 */
export function useAI() {
  const canvasContext = useCanvas();
  
  // State management
  const [conversation, setConversation] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Service references (initialized once)
  const aiServiceRef = useRef(null);
  const canvasAPIRef = useRef(null);

  // Initialize AI service when canvas context is available
  useEffect(() => {
    if (!aiServiceRef.current && canvasContext) {
      try {
        canvasAPIRef.current = new CanvasAPI(canvasContext);
        aiServiceRef.current = new AICanvasService(canvasAPIRef.current);
        console.log('🤖 AI service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize AI service:', error);
        setError(`AI initialization failed: ${error.message}`);
      }
    }
  }, [canvasContext]);

  /**
   * Check if AI is available (server-side configuration)
   */
  const isAIAvailable = useCallback(() => {
    // AI service must be initialized
    if (!aiServiceRef.current) return false;
    
    // In development, AI requires backend server setup
    // Show warning but allow service to be "available" so users see helpful error messages
    return true;
  }, []);

  /**
   * Send a message to the AI and get a response with actions
   */
  const sendMessage = useCallback(async (userMessage) => {
    if (!aiServiceRef.current) {
      throw new Error('AI service not initialized. Please check your setup.');
    }

    if (!isAIAvailable()) {
      throw new Error('AI service not available. Please ensure the server is running and OpenAI API key is configured.');
    }

    if (!userMessage || userMessage.trim() === '') {
      throw new Error('Please enter a message');
    }

    // Clear any previous errors
    setError(null);
    setIsProcessing(true);

    try {
      // Add user message to conversation immediately for better UX
      const userMsg = {
        role: 'user',
        content: userMessage.trim(),
        timestamp: Date.now()
      };
      
      setConversation(prev => [...prev, userMsg]);
      console.log('🤖 Processing user message:', userMessage);

      // Process the command with the AI service
      const startTime = Date.now();
      const aiResponse = await aiServiceRef.current.processCommand(userMessage.trim());
      const processingTime = Date.now() - startTime;

      // Add AI response to conversation
      const aiMsg = {
        role: 'assistant',
        content: aiResponse.response,
        timestamp: Date.now(),
        functionCalls: aiResponse.functionCalls || [],
        results: aiResponse.results || [],
        processingTime
      };

      setConversation(prev => [...prev, aiMsg]);

      console.log(`✅ AI response processed in ${processingTime}ms:`, aiResponse);

      // Performance warning if response is slow
      if (processingTime > 2000) {
        console.warn(`⚠️ AI response took ${processingTime}ms (target: <2000ms)`);
      }

      return aiResponse;

    } catch (error) {
      console.error('❌ AI processing error:', error);
      
      // Add error message to conversation
      const errorMsg = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: Date.now(),
        isError: true
      };
      
      setConversation(prev => [...prev, errorMsg]);
      setError(error.message);
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [isAIAvailable]);

  /**
   * Clear conversation history
   */
  const clearConversation = useCallback(() => {
    setConversation([]);
    setError(null);
    
    if (aiServiceRef.current) {
      aiServiceRef.current.clearHistory();
    }
    
    console.log('🧹 Conversation cleared');
  }, []);

  /**
   * Get AI conversation history for persistence or analysis
   */
  const getAIHistory = useCallback(() => {
    return aiServiceRef.current?.getHistory() || [];
  }, []);

  /**
   * Get current canvas state (useful for debugging)
   */
  const getCanvasState = useCallback(() => {
    return canvasAPIRef.current?.getCanvasState() || null;
  }, []);

  /**
   * Restart AI service (useful for debugging or after errors)
   */
  const restartAI = useCallback(() => {
    if (canvasContext) {
      try {
        canvasAPIRef.current = new CanvasAPI(canvasContext);
        aiServiceRef.current = new AICanvasService(canvasAPIRef.current);
        setError(null);
        console.log('🔄 AI service restarted');
      } catch (error) {
        console.error('❌ Failed to restart AI service:', error);
        setError(`AI restart failed: ${error.message}`);
      }
    }
  }, [canvasContext]);

  /**
   * Get processing status and performance info
   */
  const getStatus = useCallback(() => {
    const lastMessage = conversation[conversation.length - 1];
    return {
      isAvailable: isAIAvailable(),
      isProcessing,
      hasError: !!error,
      messageCount: conversation.length,
      lastProcessingTime: lastMessage?.processingTime || null,
      averageProcessingTime: conversation
        .filter(msg => msg.role === 'assistant' && msg.processingTime)
        .reduce((sum, msg, _, arr) => sum + msg.processingTime / arr.length, 0) || null
    };
  }, [conversation, isProcessing, error, isAIAvailable]);

  return {
    // Core functionality
    sendMessage,
    clearConversation,
    
    // State
    conversation,
    isProcessing,
    error,
    
    // Utilities
    isAIAvailable,
    getAIHistory,
    getCanvasState,
    restartAI,
    getStatus
  };
}

export default useAI;