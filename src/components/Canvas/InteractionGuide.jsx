import { useState } from 'react';

function InteractionGuide() {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="relative">
      {/* Help Button */}
      <button
        onClick={toggleVisibility}
        className="w-8 h-8 bg-gray-100 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors"
        title="Interaction Guide"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </button>

      {/* Tooltip/Guide Panel */}
      {isVisible && (
        <div className="absolute top-10 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-3 sm:p-4 w-64 sm:w-72 max-w-[calc(100vw-1rem)] max-h-[calc(100vh-8rem)] overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              💡 How to Use
            </h3>
            <button
              onClick={toggleVisibility}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* Mouse Controls */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">🖱️ Mouse Controls</h4>
              <div className="space-y-1 text-gray-600">
                <div className="flex items-center">
                  <div className="w-16 text-xs font-mono bg-gray-100 px-2 py-1 rounded mr-2">
                    L-Click
                  </div>
                  <span>Select/deselect shapes</span>
                </div>
                <div className="flex items-center">
                  <div className="w-16 text-xs font-mono bg-gray-100 px-2 py-1 rounded mr-2">
                    L-Drag
                  </div>
                  <span>Move selected shapes</span>
                </div>
                <div className="flex items-center">
                  <div className="w-16 text-xs font-mono bg-gray-100 px-2 py-1 rounded mr-2">
                    R-Click
                  </div>
                  <span>Delete shapes</span>
                </div>
                <div className="flex items-center">
                  <div className="w-16 text-xs font-mono bg-gray-100 px-2 py-1 rounded mr-2">
                    M-Drag
                  </div>
                  <span>Pan canvas</span>
                </div>
                <div className="flex items-center">
                  <div className="w-16 text-xs font-mono bg-gray-100 px-2 py-1 rounded mr-2">
                    Scroll
                  </div>
                  <span>Zoom in/out</span>
                </div>
              </div>
            </div>

            {/* Shape Tools */}
            <div className="border-t border-gray-200 pt-3">
              <h4 className="font-medium text-gray-700 mb-2">🔧 Shape Tools</h4>
              <div className="text-gray-600">
                <div className="mb-1">• Use <strong>left toolbar</strong> to create shapes</div>
                <div className="mb-1">• Select shapes to edit <strong>color & size</strong></div>
                <div>• Changes sync in <strong>real-time</strong> with others</div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="border-t border-gray-200 pt-3">
              <h4 className="font-medium text-gray-700 mb-2">⌨️ Keyboard</h4>
              <div className="space-y-1 text-gray-600">
                <div className="flex items-center">
                  <div className="w-16 text-xs font-mono bg-gray-100 px-2 py-1 rounded mr-2">
                    Del
                  </div>
                  <span>Delete selected shape</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 text-center">
            Infinite canvas • Real-time collaboration
          </div>
        </div>
      )}
    </div>
  );
}

export default InteractionGuide;
