import { useEffect, useState, useCallback } from "react";
import { useTheme } from '../../contexts/ThemeContexts';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Header';

const getStorageAdminUser = () => {
  try {
    const raw = localStorage.getItem("adminUser");
    if (!raw || raw === "undefined" || raw === "null") return {};
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("adminUser");
    return {};
  }
};

const AdminLayout = () => {
  const admin = getStorageAdminUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("adminSidebarCollapsed") === "true"
  );
  
  // Mobile drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false); 
  const toggleMobileSidebar = useCallback(() => setMobileSidebarOpen(prev => !prev), []);
  const toggleSidebarCollapse = useCallback(() => setSidebarCollapsed(prev => !prev), []);

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Global keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300">
      
      {/* Mobile Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-xs z-30 transition-opacity duration-300 md:hidden ${
          mobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        isOpen={mobileSidebarOpen}
        toggleSidebar={toggleMobileSidebar}
      />

      {/* Main Content Area with synchronized margin animation */}
      <main className={`flex-1 flex flex-col min-w-0 transition-[margin-left] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
        sidebarCollapsed ? 'md:ml-20' : 'md:ml-56'
      }`}>

        <Topbar 
          theme={theme} 
          setTheme={setTheme} 
          admin={admin} 
          toggleSidebar={toggleMobileSidebar}
          isCollapsed={sidebarCollapsed}
          toggleCollapse={toggleSidebarCollapse}
        />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 custom-scrollbar scroll-smooth">
          <div className="max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;