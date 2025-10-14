import { useState, useCallback, useRef, useEffect } from 'react';
import { useCanvas } from '../contexts/ModernCanvasContext';
import { AICanvasService } from '../services/ai';
import { CanvasAPI } from '../services/canvasAPI';

/**
 * useAI Hook - Manages AI interactions with the canvas
 */
export function useAI() {
  const canvasContext = useCanvas();
  const [conversation, setConversation] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Initialize AI service (only once)
  const aiServiceRef = useRef(null);
  const canvasAPIRef = useRef(null);

  useEffect(() => {
    if (!aiServiceRef.current && canvasContext) {
      canvasAPIRef.current = new CanvasAPI(canvasContext);
      aiServiceRef.current = new AICanvasService(canvasAPIRef.current);
    }
  }, [canvasContext]);

  // Check if AI is available (API key configured)
  const isAIAvailable = useCallback(() => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    return !!(apiKey && apiKey !== 'your-openai-api-key-here');
  }, []);

  // Send message to AI
  const sendMessage = useCallback(async (userMessage) => {
    if (!aiServiceRef.current) {
      throw new Error('AI service not initialized');
    }

    if (!isAIAvailable()) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
    }

    // Clear any previous errors
    setError(null);
    setIsProcessing(true);

    try {
      // Add user message to conversation immediately
      const userMsg = {
        role: 'user',
        content: userMessage,
        timestamp: Date.now()
      };
      
      setConversation(prev => [...prev, userMsg]);

      // Process AI command
      const aiResponse = await aiServiceRef.current.processCommand(userMessage);

      // Add AI response to conversation
      const aiMsg = {
        role: 'assistant',
        content: aiResponse.response,
        timestamp: Date.now(),
        functionCalls: aiResponse.functionCalls,
        results: aiResponse.results
      };

      setConversation(prev => [...prev, aiMsg]);

      console.log('🤖 AI Response:', aiResponse);

      return aiResponse;

    } catch (error) {
      console.error('AI processing error:', error);
      
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

  // Clear conversation history
  const clearConversation = useCallback(() => {
    setConversation([]);
    setError(null);
    
    if (aiServiceRef.current) {
      aiServiceRef.current.clearHistory();
    }
  }, []);

  // Get AI conversation history
  const getAIHistory = useCallback(() => {
    return aiServiceRef.current?.getHistory() || [];
  }, []);

  // Restart AI service (useful for debugging)
  const restartAI = useCallback(() => {
    if (canvasAPIRef.current) {
      aiServiceRef.current = new AICanvasService(canvasAPIRef.current);
      clearConversation();
    }
  }, [clearConversation]);

  // Get AI service status
  const getAIStatus = useCallback(() => {
    return {
      isAvailable: isAIAvailable(),
      isInitialized: !!aiServiceRef.current,
      isProcessing,
      hasError: !!error,
      conversationLength: conversation.length
    };
  }, [isAIAvailable, isProcessing, error, conversation.length]);

  return {
    // State
    conversation,
    isProcessing,
    error,
    
    // Actions
    sendMessage,
    clearConversation,
    
    // Utilities
    isAIAvailable: isAIAvailable(),
    getAIHistory,
    restartAI,
    getAIStatus
  };
}

export default useAI;
