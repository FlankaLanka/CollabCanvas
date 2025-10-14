import { useMemo } from 'react';

/**
 * User Cursor Component - Renders another user's cursor on the canvas
 */
function UserCursor({ cursor, isVisible = true }) {
  // Calculate if cursor is recent (within last 5 seconds)
  const isRecent = useMemo(() => {
    if (!cursor.timestamp) return false;
    return Date.now() - cursor.timestamp < 5000;
  }, [cursor.timestamp]);

  // Don't render if not visible or not recent
  if (!isVisible || !isRecent) return null;

  return (
    <div
      className="absolute pointer-events-none z-50 transition-opacity duration-300"
      style={{
        left: `${cursor.x}px`,
        top: `${cursor.y}px`,
        transform: 'translate(-2px, -2px)',
        opacity: isRecent ? 1 : 0.5
      }}
    >
      {/* Cursor pointer */}
      <div className="relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          className="drop-shadow-md"
        >
          {/* Cursor shadow */}
          <path
            d="M2 2L18 8L8 10L6 18L2 2Z"
            fill="rgba(0, 0, 0, 0.3)"
            transform="translate(1, 1)"
          />
          {/* Main cursor */}
          <path
            d="M2 2L18 8L8 10L6 18L2 2Z"
            fill={cursor.color || '#3B82F6'}
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
        
        {/* User name label */}
        {cursor.displayName && (
          <div
            className="absolute top-5 left-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg"
            style={{
              backgroundColor: cursor.color || '#3B82F6',
              color: 'white'
            }}
          >
            {cursor.displayName}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserCursor;
