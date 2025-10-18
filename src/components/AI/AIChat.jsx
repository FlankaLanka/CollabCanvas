import { useState, useRef, useEffect } from 'react';
import { useAI } from '../../hooks/useAI';

/**
 * AI Chat Component - Natural language interface for canvas manipulation
 * 
 * Features:
 * - Natural language input with suggestions
 * - Real-time conversation history
 * - Performance indicators
 * - Error handling and recovery
 * - Collapsible interface
 */
function AIChat({ onClose }) {
  const {
    sendMessage,
    clearConversation,
    conversation,
    isProcessing,
    error,
    isAIAvailable,
    getStatus
  } = useAI();

  // Local state
  const [inputMessage, setInputMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  
  // Refs
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isProcessing) {
      return;
    }

    const message = inputMessage.trim();
    setInputMessage('');
    setShowExamples(false);

    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
      // Error is already handled by the useAI hook
    }
  };

  // Handle example command selection
  const handleExampleClick = (example) => {
    setInputMessage(example);
    setShowExamples(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Example commands for user guidance
  const exampleCommands = [
    // Creation Commands (at least 2 required)
    "Create a red circle at position 100, 200",
    "Add a text layer that says 'Hello World'",
    "Make a 200x300 rectangle",
    
    // Manipulation Commands (at least 2 required)
    "Move the blue rectangle to the center",
    "Resize the circle to be twice as big",
    "Rotate the text 45 degrees",
    
    // Layout Commands (at least 1 required)
    "Arrange these shapes in a horizontal row",
    "Create a grid of 3x3 squares",
    "Space these elements evenly",
    
    // Complex Commands (at least 1 required)
    "Create a login form with username and password fields",
    "Build a navigation bar with 4 menu items",
    "Make a card layout with title, image, and description"
  ];

  // Get AI status for performance display
  const status = getStatus();

  // Don't render if AI is not available - now contained within right panel
  if (!isAIAvailable()) {
    return (
      <div className="bg-yellow-50 border-t border-yellow-200 p-3">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-xs font-medium text-yellow-800">AI Not Available</h4>
            <div className="mt-1 text-xs text-yellow-700">
              <p className="mb-1">To enable AI features:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-xs">
                <li><code className="bg-yellow-100 px-1">npm install</code></li>
                <li><code className="bg-yellow-100 px-1">export OPENAI_API_KEY="key"</code></li>
                <li><code className="bg-yellow-100 px-1">npm run dev:full</code></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Chat Interface */}
      {isExpanded && (
        <div className="bg-white border-t border-gray-200 flex flex-col max-h-96">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">AI Assistant</h4>
                <p className="text-xs text-gray-500">Canvas control</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Performance indicator */}
              {status.lastProcessingTime && (
                <span className={`text-xs px-2 py-1 rounded ${
                  status.lastProcessingTime < 1000 ? 'bg-green-100 text-green-700' :
                  status.lastProcessingTime < 2000 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {status.lastProcessingTime}ms
                </span>
              )}
              
              {/* Clear button */}
              <button
                onClick={clearConversation}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Clear conversation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto" ref={messagesEndRef}>
            {conversation.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-8 h-8 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.697-.413l-3.178 1.589a.75.75 0 01-1.072-.71l.389-2.333A8 8 0 113 12z" />
                </svg>
                <p className="text-sm">Start a conversation!</p>
                <p className="text-xs mt-1">Try "Create a blue circle" or click the examples button</p>
              </div>
            )}

            {conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.isError
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Show function calls for AI messages */}
                  {message.functionCalls && message.functionCalls.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Actions taken:</p>
                      {message.functionCalls.map((call, i) => (
                        <span key={i} className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mr-1 mb-1">
                          {call.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Processing time */}
                  {message.processingTime && (
                    <p className="text-xs text-gray-500 mt-1">
                      {message.processingTime}ms
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="border-t border-gray-200 p-3">
            <form onSubmit={handleSubmit} className="space-y-2">
              {/* Input field */}
              <div className="flex space-x-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Tell me what to create..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm min-w-0"
                  disabled={isProcessing}
                />
                
                <button
                  type="button"
                  onClick={() => setShowExamples(!showExamples)}
                  className="px-2 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex-shrink-0"
                  title="Show examples"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              
              {/* Send button - full width */}
              <button
                type="submit"
                disabled={isProcessing || !inputMessage.trim()}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isProcessing ? 'Sending...' : 'Send'}
              </button>
            </form>

            {/* Examples dropdown */}
            {showExamples && (
              <div className="mt-2 max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-2">
                <p className="text-xs font-medium text-gray-700 mb-2">Example commands:</p>
                <div className="space-y-1">
                  {exampleCommands.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(example)}
                      className="block w-full text-left text-xs text-gray-600 hover:text-blue-600 hover:bg-white px-2 py-1 rounded"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toggle Button - Contained within right panel */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center text-sm font-medium ${
            error 
              ? 'bg-gray-500 hover:bg-gray-600 text-white' 
              : isExpanded 
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          title={isExpanded ? 'Close AI Chat' : 'Open AI Chat'}
        >
          {isExpanded ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close AI Chat
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.697-.413l-3.178 1.589a.75.75 0 01-1.072-.71l.389-2.333A8 8 0 113 12z" />
              </svg>
              AI Assistant
              {/* Notification indicator */}
              {error && (
                <div className="ml-2 w-2 h-2 bg-red-400 rounded-full"></div>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default AIChat;
