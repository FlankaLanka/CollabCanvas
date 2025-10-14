function CanvasArea() {
  return (
    <div className="flex-1 p-6">
      <div className="w-full h-full bg-white border border-gray-300 rounded-lg relative overflow-hidden">
        {/* Canvas placeholder */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <svg 
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1"
              className="mx-auto mb-4 opacity-50"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            <p className="text-sm">Canvas Area</p>
            <p className="text-xs mt-1">Ready for shapes and drawings</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CanvasArea
