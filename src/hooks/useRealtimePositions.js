import { useEffect, useRef } from 'react';
import { subscribeToRealtimePositions } from '../services/realtimeShapes';

/**
 * Hook for subscribing to real-time position updates
 * Provides ultra-low latency position synchronization
 */
export function useRealtimePositions(onPositionUpdate) {
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    console.log('⚡ Setting up realtime position subscription');
    
    const unsubscribe = subscribeToRealtimePositions((positionUpdates) => {
      // Apply position updates immediately for smoothness
      if (onPositionUpdate && Object.keys(positionUpdates).length > 0) {
        onPositionUpdate(positionUpdates);
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      console.log('🧹 Cleaning up realtime position subscription');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [onPositionUpdate]);

  return {
    isActive: !!unsubscribeRef.current
  };
}

export default useRealtimePositions;
