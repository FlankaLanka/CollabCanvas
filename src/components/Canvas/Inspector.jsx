import React from 'react';
import { useCanvas } from '../../contexts/ModernCanvasContext';

/**
 * Inspector Component - Properties panel for selected shapes
 * 
 * Shows detailed properties of the currently selected shape(s)
 * Moved from right sidebar to left sidebar for better UX
 */
function Inspector() {
  const { selectedId, selectedIds, shapes } = useCanvas();
  
  // Get the selected shape
  const selectedShape = selectedId ? shapes.find(s => s.id === selectedId) : null;
  
  // If no shape is selected, show empty state
  if (!selectedShape) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Inspector</h3>
        </div>
        <div className="flex-1 p-4">
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Select an object to edit properties</p>
            <p className="text-xs text-gray-400 mt-1">Ctrl + click to toggle</p>
            <p className="text-xs text-gray-400">Shift + click to add</p>
            <p className="text-xs text-gray-400">Ctrl + A to select all</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Inspector</h3>
        <p className="text-xs text-gray-500 mt-1">{selectedShape.type}</p>
        <p className="text-xs text-gray-400">ID: {selectedShape.id}</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Transform Section */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Transform</h4>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Position</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500">X</label>
                  <input
                    type="number"
                    value={Math.round(selectedShape.x || 0)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Y</label>
                  <input
                    type="number"
                    value={Math.round(selectedShape.y || 0)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    readOnly
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Rotation</label>
              <input
                type="number"
                value={Math.round(selectedShape.rotation || 0)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Shape-specific properties */}
        {selectedShape.type === 'rectangle' && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Rectangle</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Width</label>
                <input
                  type="number"
                  value={Math.round(selectedShape.width || 0)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Height</label>
                <input
                  type="number"
                  value={Math.round(selectedShape.height || 0)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'circle' && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Circle</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Radius X</label>
                <input
                  type="number"
                  value={Math.round(selectedShape.radiusX || 0)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Radius Y</label>
                <input
                  type="number"
                  value={Math.round(selectedShape.radiusY || 0)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'bezier_curve' && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Bezier Curve</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Anchor Points</label>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{selectedShape.points?.length / 2 || 0}</span>
                  <button className="text-xs text-blue-600 hover:text-blue-800">+ Add Point</button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Edit Points</label>
                <button className="w-full px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300">
                  Show Points
                </button>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Smoothing</label>
                <input
                  type="number"
                  value={selectedShape.smoothing || 30}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Stroke Width</label>
                <input
                  type="number"
                  value={selectedShape.strokeWidth || 3}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        {/* Appearance Section */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Appearance</h4>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fill Color</label>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: selectedShape.fill || '#3B82F6' }}
                ></div>
                <input
                  type="text"
                  value={selectedShape.fill || '#3B82F6'}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  readOnly
                />
              </div>
            </div>
            
            {selectedShape.stroke && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Stroke Color</label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: selectedShape.stroke }}
                  ></div>
                  <input
                    type="text"
                    value={selectedShape.stroke}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    readOnly
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inspector;
