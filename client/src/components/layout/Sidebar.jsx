// // import { useState } from 'react';
// // import { NavLink } from 'react-router-dom';
// // import {
// //   LayoutDashboard,
// //   CheckSquare,
// //   Users,
// //   Building2,
// //   // Inbox,
// //   // IndianRupee,
// //   // BarChart3,
// //   // Settings,
// //   X,
// //   ChevronLeft,
// //   ChevronRight,
// //   LogOut,
// //   // Sparkles
// // } from 'lucide-react';

// // const Sidebar = ({ isOpen, toggleSidebar }) => {
// //   const [isCollapsed, setIsCollapsed] = useState(false);

// //   const menuItems = [
// //     { name: 'Dashboard', path: '/', icon: LayoutDashboard },
// //     { name: 'Verification', path: '/verification', icon: CheckSquare, badge: '5' },
// //     { name: 'User Directory', path: '/users', icon: Users },
// //     { name: 'Builders & RERA', path: '/builders', icon: Building2 },
// //     // { name: 'Leads & Enquiries', path: '/leads', icon: Inbox, badge: 'New' },
// //     // { name: 'Revenue', path: '/revenue', icon: IndianRupee },
// //     // { name: 'Reports & Export', path: '/reports', icon: BarChart3 },
// //     // { name: 'Settings', path: '/settings', icon: Settings },
// //   ];

// //   return (
// //     <aside
// //       className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-slate-100/80 transition-all duration-300 ease-in-out md:translate-x-0 ${
// //         isOpen ? 'translate-x-0' : '-translate-x-full'
// //       } ${isCollapsed ? 'w-20' : 'w-64'}`}
// //     >
// //       <div className="flex flex-col h-full relative ">
// //         {/* Collapse Toggle trigger - Desktop only */}
// //         <button
// //           type="button"
// //           onClick={() => setIsCollapsed(!isCollapsed)}
// //           className="hidden md:flex absolute -right-3 top-7 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-500 hover:text-brand hover:border-brand shadow-sm z-50 cursor-pointer"
// //         >
// //           {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
// //         </button>

// //         {/* Brand Header */}
// //         <div className={`flex items-center justify-between h-16 border-b border-slate-50/50 ${isCollapsed ? 'px-4 justify-center' : 'px-6'}`}>
// //           <div className="flex items-center gap-2.5">
// //             <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-brand to-brand-dark text-white font-bold text-lg shadow-md shadow-brand/10 shrink-0">
// //               G
// //             </div>
// //             {!isCollapsed && (
// //               <span className="text-base font-extrabold tracking-tight text-slate-800">
// //                 GHAR<span className="text-brand">MB</span>
// //                 {/* <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-light text-brand ml-1.5 uppercase">
// //                   SaaS
// //                 </span> */}
// //               </span>
// //             )}
// //           </div>
// //           {isOpen && (
// //             <button
// //               type="button"
// //               onClick={toggleSidebar}
// //               className="text-slate-400 hover:text-slate-700 md:hidden"
// //             >
// //               <X size={18} />
// //             </button>
// //           )}
// //         </div>

// //         {/* Navigation list */}
// //         <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
// //           {menuItems.map((item) => (
// //             <NavLink
// //               key={item.name}
// //               to={item.path}
// //               onClick={() => {
// //                 if (window.innerWidth < 768) toggleSidebar();
// //               }}
// //               className={({ isActive }) =>
// //                 `flex items-center rounded-xl transition-all duration-200 group relative ${
// //                   isCollapsed ? 'justify-center p-3' : 'px-4 py-3 justify-between'
// //                 } ${
// //                   isActive
// //                     ? 'bg-brand/5 text-brand font-bold'
// //                     : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
// //                 }`
// //               }
// //             >
// //               {({ isActive }) => (
// //                 <>
// //                   <div className="flex items-center gap-3">
// //                     {/* Active accent vertical line */}
// //                     {isActive && (
// //                       <span className="absolute left-0 w-1 h-6 bg-brand rounded-r-lg" />
// //                     )}
// //                     <item.icon
// //                       size={18}
// //                       className={`shrink-0 transition-transform group-hover:scale-105 ${
// //                         isActive ? 'text-brand' : 'text-slate-400 group-hover:text-slate-600'
// //                       }`}
// //                     />
// //                     {!isCollapsed && <span className="text-xs font-semibold">{item.name}</span>}
// //                   </div>

// //                   {/* Badge */}
// //                   {!isCollapsed && item.badge && (
// //                     <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${
// //                       item.badge === 'New' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
// //                     }`}>
// //                       {item.badge}
// //                     </span>
// //                   )}

// //                   {/* Collapsed Tooltip */}
// //                   {isCollapsed && (
// //                     <div className="absolute left-20 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-50">
// //                       {item.name}
// //                     </div>
// //                   )}
// //                 </>
// //               )}
// //             </NavLink>
// //           ))}
// //         </nav>

// //         {/* User profile footer */}
// //         <div className={`p-4 border-t border-slate-50 bg-slate-50/30 flex flex-col gap-2 ${isCollapsed ? 'items-center' : 'items-stretch'}`}>
// //           <div className="flex items-center gap-3 justify-between">
// //             <div className="flex items-center gap-2.5">
// //               <div className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center font-bold text-xs text-brand shrink-0">
// //                 RC
// //               </div>
// //               {!isCollapsed && (
// //                 <div className="text-left leading-none">
// //                   <p className="text-xs font-bold text-slate-800">Rishika C.</p>
// //                   <p className="text-[9px] text-slate-400 mt-0.5">SaaS Admin</p>
// //                 </div>
// //               )}
// //             </div>
// //             {!isCollapsed && (
// //               <button
// //                 type="button"
// //                 onClick={() => alert('Bidding session terminated. Re-routing to login.')}
// //                 className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
// //                 title="Sign Out"
// //               >
// //                 <LogOut size={14} />
// //               </button>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </aside>
// //   );
// // };

// // export default Sidebar;


// import { NavLink } from 'react-router-dom';
// import {
//       LayoutDashboard,
//       CheckSquare,
//       Users,
//       Building2,
//       X,
//       ChevronLeft,
//       ChevronRight,
//       LogOut,
//       // Inbox,
//       // IndianRupee,
//       // BarChart3,
//       // Settings,
// } from 'lucide-react';

// // Props mein isCollapsed aur toggleCollapse add karein
// const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  
//   // yahan se `const [isCollapsed, setIsCollapsed] = useState(false);` HATA DEIN

//   const menuItems = [
//     { name: 'Dashboard', path: '/', icon: LayoutDashboard },
//     { name: 'Verification', path: '/verification', icon: CheckSquare, badge: '5' },
//     { name: 'User Directory', path: '/users', icon: Users },
//     { name: 'Builders & RERA', path: '/builders', icon: Building2 },
//     // { name: 'Leads & Enquiries', path: '/leads', icon: Inbox, badge: 'New' },
//     // { name: 'Revenue', path: '/revenue', icon: IndianRupee },
//     // { name: 'Reports & Export', path: '/reports', icon: BarChart3 },
//     // { name: 'Settings', path: '/settings', icon: Settings },
    
//   ];

//   return (
//     <aside
//       className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-slate-100/80 transition-all duration-300 ease-in-out md:translate-x-0 ${
//         isOpen ? 'translate-x-0' : '-translate-x-full'
//       } ${isCollapsed ? 'w-20' : 'w-64'}`}
//     >
//       <div className="flex flex-col h-full relative ">
//         {/* Collapse Toggle trigger - Desktop only */}
//         <button
//           type="button"
//           onClick={toggleCollapse} 
//           // {/* Yahan prop wala function use karein */}
//           className="hidden md:flex absolute -right-3 top-7 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-500 hover:text-brand hover:border-brand shadow-sm z-50 cursor-pointer"
//         >
//           {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
//         </button>

//         {/* ... BAAKI PURA CODE SAME RAHEGA ... */}
        
//         {/* Brand Header */}
//         <div className={`flex items-center justify-between h-16 border-b border-slate-50/50 ${isCollapsed ? 'px-4 justify-center' : 'px-6'}`}>
//           <div className="flex items-center gap-2.5">
//             <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-brand to-brand-dark text-white font-bold text-lg shadow-md shadow-brand/10 shrink-0">
//               G
//             </div>
//             {!isCollapsed && (
//               <span className="text-base font-extrabold tracking-tight text-slate-800">
//                 GHAR<span className="text-brand">MB</span>
//               </span>
//             )}
//           </div>
//           {isOpen && (
//             <button
//               type="button"
//               onClick={toggleSidebar}
//               className="text-slate-400 hover:text-slate-700 md:hidden"
//             >
//               <X size={18} />
//             </button>
//           )}
//         </div>

//         {/* Navigation list */}
//         <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
//           {menuItems.map((item) => (
//             <NavLink
//               key={item.name}
//               to={item.path}
//               onClick={() => {
//                 if (window.innerWidth < 768) toggleSidebar();
//               }}
//               className={({ isActive }) =>
//                 `flex items-center rounded-xl transition-all duration-200 group relative ${
//                   isCollapsed ? 'justify-center p-3' : 'px-4 py-3 justify-between'
//                 } ${
//                   isActive
//                     ? 'bg-brand/5 text-brand font-bold'
//                     : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
//                 }`
//               }
//             >
//               {({ isActive }) => (
//                 <>
//                   <div className="flex items-center gap-3">
//                     {isActive && (
//                       <span className="absolute left-0 w-1 h-6 bg-brand rounded-r-lg" />
//                     )}
//                     <item.icon
//                       size={18}
//                       className={`shrink-0 transition-transform group-hover:scale-105 ${
//                         isActive ? 'text-brand' : 'text-slate-400 group-hover:text-slate-600'
//                       }`}
//                     />
//                     {!isCollapsed && <span className="text-xs font-semibold">{item.name}</span>}
//                   </div>

//                   {!isCollapsed && item.badge && (
//                     <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${
//                       item.badge === 'New' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
//                     }`}>
//                       {item.badge}
//                     </span>
//                   )}

//                   {isCollapsed && (
//                     <div className="absolute left-20 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-50">
//                       {item.name}
//                     </div>
//                   )}
//                 </>
//               )}
//             </NavLink>
//           ))}
//         </nav>

//         {/* User profile footer */}
//         <div className={`p-4 border-t border-slate-50 bg-slate-50/30 flex flex-col gap-2 ${isCollapsed ? 'items-center' : 'items-stretch'}`}>
//           <div className="flex items-center gap-3 justify-between">
//             <div className="flex items-center gap-2.5">
//               <div className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center font-bold text-xs text-brand shrink-0">
//                 RC
//               </div>
//               {!isCollapsed && (
//                 <div className="text-left leading-none">
//                   <p className="text-xs font-bold text-slate-800">Rishika C.</p>
//                   <p className="text-[9px] text-slate-400 mt-0.5">SaaS Admin</p>
//                 </div>
//               )}
//             </div>
//             {!isCollapsed && (
//               <button
//                 type="button"
//                 onClick={() => alert('Bidding session terminated. Re-routing to login.')}
//                 className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
//                 title="Sign Out"
//               >
//                 <LogOut size={14} />
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Building2,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';

// 🔴 UPDATE: Props mein 'collapsed' aur 'setCollapsed' use kiya hai
const Sidebar = ({ isOpen, toggleSidebar, collapsed, setCollapsed }) => {
  
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Verification', path: '/verification', icon: CheckSquare, badge: '5' },
    { name: 'User Directory', path: '/users', icon: Users },
    { name: 'Builders & RERA', path: '/builders', icon: Building2 },
    { name: '`About', path: '/about', icon: Building2 },
    { name: 'Legal', path: '/legal', icon: Building2 },
    // { name:
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-slate-100/80 transition-all duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="flex flex-col h-full relative ">
        {/* Collapse Toggle trigger - Desktop only */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)} // 🔴 UPDATE Function
          className="hidden md:flex absolute -right-3 top-7 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-500 hover:text-brand hover:border-brand shadow-sm z-50 cursor-pointer"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Brand Header */}
        <div className={`flex items-center justify-between h-16 border-b border-slate-50/50 ${collapsed ? 'px-4 justify-center' : 'px-6'}`}>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-brand to-brand-dark text-white font-bold text-lg shadow-md shadow-brand/10 shrink-0">
              G
            </div>
            {!collapsed && (
              <span className="text-base font-extrabold tracking-tight text-slate-800">
                GHAR<span className="text-brand">MB</span>
              </span>
            )}
          </div>
          {isOpen && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="text-slate-400 hover:text-slate-700 md:hidden"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) toggleSidebar();
              }}
              className={({ isActive }) =>
                `flex items-center rounded-xl transition-all duration-200 group relative ${
                  collapsed ? 'justify-center p-3' : 'px-4 py-3 justify-between'
                } ${
                  isActive
                    ? 'bg-brand/5 text-brand font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    {isActive && (
                      <span className="absolute left-0 w-1 h-6 bg-brand rounded-r-lg" />
                    )}
                    <item.icon
                      size={18}
                      className={`shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-brand' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    {!collapsed && <span className="text-xs font-semibold">{item.name}</span>}
                  </div>

                  {!collapsed && item.badge && (
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${
                      item.badge === 'New' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}

                  {collapsed && (
                    <div className="absolute left-20 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User profile footer */}
        <div className={`p-4 border-t border-slate-50 bg-slate-50/30 flex flex-col gap-2 ${collapsed ? 'items-center' : 'items-stretch'}`}>
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center font-bold text-xs text-brand shrink-0">
                RC
              </div>
              {!collapsed && (
                <div className="text-left leading-none">
                  <p className="text-xs font-bold text-slate-800">Rishika C.</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">SaaS Admin</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                type="button"
                onClick={() => alert('Bidding session terminated. Re-routing to login.')}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Sign Out"
              >
                <a href="/login">
                <LogOut size={14} />
                </a>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;