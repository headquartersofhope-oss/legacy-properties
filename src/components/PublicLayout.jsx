import { Outlet } from 'react-router-dom';
import AppAssistant from '@/components/ai/AppAssistant';

export default function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center font-bold text-sm text-white">
                RJ
              </div>
              <h1 className="text-lg font-bold text-gray-900">RE Jones Global</h1>
            </div>
            <div className="text-xs text-gray-600">Partner Portal</div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-400">
            <p>&copy; 2026 RE Jones Global. All rights reserved.</p>
            <p className="mt-2">For questions, use the chat button or contact our partnership team.</p>
          </div>
        </div>
      </footer>

      {/* AI Assistant */}
      <AppAssistant />
    </div>
  );
}