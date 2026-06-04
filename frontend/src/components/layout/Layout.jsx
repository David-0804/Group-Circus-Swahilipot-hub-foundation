import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';
export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar/>
      <main className="ml-64 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet/>
        </div>
      </main>
      <Toaster position="top-right" toastOptions={{ className:'text-sm', duration:4000 }}/>
    </div>
  );
}