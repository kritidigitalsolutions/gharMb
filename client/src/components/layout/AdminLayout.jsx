import { useEffect, useState } from "react";
import { useTheme } from '../../contexts/ThemeContexts';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Header'; // Dhyan dein, aapne file ka naam Header rakha hai par yahan Topbar use kar rahe hain

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
  
  // Mobile sidebar ke liye state add ki gayi hai
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false); 
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className="flex min-h-screen dark:bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      
      {/* 🔴 UPDATE 1: Sidebar ko correct props pass kiye gaye hain */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        isOpen={mobileSidebarOpen}
        toggleSidebar={toggleMobileSidebar}
      />

      {/* 🔴 UPDATE 2: Yahan margin-left (ml) logic add kiya gaya hai */}
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        <Topbar theme={theme} setTheme={setTheme} admin={admin} toggleSidebar={toggleMobileSidebar} />
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar scroll-smooth">
          <div className="max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;