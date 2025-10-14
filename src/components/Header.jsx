function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-300 flex items-center justify-between px-6">
      {/* Left: App name */}
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-900">Collab Canvas</h1>
      </div>

      {/* Right: User info */}
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">Signed in as Frank</span>
        <button className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
          Sign out
        </button>
      </div>
    </header>
  )
}

export default Header
