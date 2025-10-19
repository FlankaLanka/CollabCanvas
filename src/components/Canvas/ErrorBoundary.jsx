import React from 'react';

/**
 * Error Boundary for React-Konva components
 * Catches and handles errors gracefully to prevent app crashes
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('🚨 Error Boundary caught an error:', error);
    console.error('🚨 Error Info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Check if it's a React-Konva transformer error
    if (error.message && error.message.includes('setAttrs')) {
      console.log('🔧 Detected React-Konva transformer error - attempting recovery');
      
      // Attempt to recover by clearing transformer nodes
      setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }, 100);
    }
  }

  render() {
    if (this.state.hasError) {
      // Check if it's a transformer-related error that we can recover from
      if (this.state.error && this.state.error.message && 
          this.state.error.message.includes('setAttrs')) {
        console.log('🔄 Attempting to recover from transformer error');
        return this.props.children; // Try to render children again
      }

      // Fallback UI for other errors
      return (
        <div className="error-boundary-fallback p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-2">
            🚨 Canvas Error
          </h3>
          <p className="text-red-600 text-sm mb-2">
            Something went wrong with the canvas. This is usually temporary.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="text-xs text-red-500 cursor-pointer">
                Error Details (Development)
              </summary>
              <pre className="text-xs text-red-600 mt-1 overflow-auto">
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
