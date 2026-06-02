import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  UsersIcon,
  WalletIcon,
  CogIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  BellIcon,
  BuildingStorefrontIcon,
  Squares2X2Icon,
  PhotoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  ServerStackIcon
} from '@heroicons/react/24/outline';

import { useAuth } from '@/contexts/AuthContext';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
  className?: string;
}

type NavItem = {
  name: string;
  href?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children?: Array<{
    name: string;
    href: string;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }>;
};

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'User Management', href: '/users', icon: UsersIcon },
  { name: 'Wallet Management', href: '/wallet', icon: WalletIcon },
  { name: 'Commission Settings', href: '/commission', icon: CogIcon },
  {
    name: 'Master',
    icon: Squares2X2Icon,
    children: [
      { name: 'Service Control', href: '/master/services', icon: WrenchScrewdriverIcon },
      { name: 'API Provider', href: '/master/api-provider', icon: ServerStackIcon },
      { name: 'Banner', href: '/master/banner', icon: PhotoIcon },
      { name: 'Bottom Banner', href: '/master/bottom-banner', icon: PhotoIcon },
      { name: 'Home Note', href: '/master/home-note', icon: PhotoIcon }
    ]
  },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Notifications', href: '/notifications', icon: BellIcon },
  { name: 'News Management', href: '/news', icon: PhotoIcon },
  { name: 'Affiliate Store', href: '/affiliate-store', icon: BuildingStorefrontIcon }
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapsed,
  className = ''
}) => {
  const location = useLocation();
  const { logout } = useAuth();
  const focusTrapRef = useFocusTrap(isOpen);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const handleLogout = () => logout();

  // Modern Sidebar Styling
  const SIDEBAR_CLASSES = "bg-slate-900 border-r border-slate-800 text-slate-300 backdrop-blur-xl shadow-2xl";
  const LINK_ACTIVE = "bg-primary text-white shadow-lg shadow-primary/30";
  const LINK_INACTIVE = "hover:bg-slate-800 hover:text-white transition-colors duration-200";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 h-20 border-b border-slate-800/50">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 overflow-hidden"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <span className="text-white font-bold text-lg">Y</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 whitespace-nowrap">
                ClubTYL
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onToggleCollapsed}
          className="hidden lg:flex p-2 rounded-lg bg-slate-800/50 hover:bg-primary/20 hover:text-primary transition-all duration-200"
        >
          {isCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto admin-scrollbar p-4 space-y-1.5">
        {navigation.map((item) => {
          if (!item.children) {
            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href || ''));
            return (
              <NavLink
                to={item.href!}
                key={item.name}
                onClick={onClose}
                className={({ isActive: linkActive }) => `
                  ${isActive || linkActive ? LINK_ACTIVE : LINK_INACTIVE}
                  relative flex items-center px-4 py-3 rounded-xl transition-all duration-300 group
                  ${isCollapsed ? 'justify-center px-2' : ''}
                `}
              >
                {item.icon && <item.icon className="h-5 w-5 shrink-0" />}

                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ml-3 font-medium"
                  >
                    {item.name}
                  </motion.span>
                )}

                {/* Tooltip for collapsed mode using group-hover technique */}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl border border-slate-700">
                    {item.name}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-slate-700"></div>
                  </div>
                )}
              </NavLink>
            );
          }

          // Group (Nested)
          const isOpen = openGroups[item.name] ?? false;
          const isActiveGroup = item.children.some(child => location.pathname === child.href);

          return (
            <div key={item.name} className="space-y-1">
              <button
                onClick={() => !isCollapsed && toggleGroup(item.name)}
                className={`
                    w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActiveGroup ? 'bg-slate-800/50 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}
                    ${isCollapsed ? 'justify-center' : 'justify-between'}
                  `}
              >
                <div className="flex items-center">
                  {item.icon && <item.icon className={`h-5 w-5 shrink-0 ${isActiveGroup ? 'text-primary' : ''}`} />}
                  {!isCollapsed && <span className="ml-3 font-medium">{item.name}</span>}
                </div>
                {!isCollapsed && (
                  <ChevronRightIcon
                    className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
                  />
                )}
              </button>

              {/* Collapsed view tooltip for group */}
              {isCollapsed && (
                <div className="hidden group-hover:block absolute left-20 bg-slate-800 p-2 rounded-lg shadow-xl border border-slate-700 z-50">
                  <div className="text-xs font-semibold text-slate-400 mb-2 px-2 uppercase tracking-wider">{item.name}</div>
                  {item.children.map(child => (
                    <NavLink
                      key={child.name}
                      to={child.href}
                      className={({ isActive }) => `block px-3 py-2 rounded-md text-sm whitespace-nowrap ${isActive ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                    >
                      {child.name}
                    </NavLink>
                  ))}
                </div>
              )}

              <AnimatePresence>
                {!isCollapsed && isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-9 mr-2 space-y-1 border-l-2 border-slate-800 pl-3 py-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.name}
                          to={child.href}
                          className={({ isActive }) => `
                            flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200
                            ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}
                          `}
                        >
                          {child.icon && <child.icon className="h-4 w-4 mr-2" />}
                          {child.name}
                        </NavLink>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200
            text-red-400 hover:bg-red-500/10 hover:text-red-300
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="ml-3 font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <div
        ref={focusTrapRef}
        className={`
          fixed inset-y-0 left-0 z-50 w-72 ${SIDEBAR_CLASSES} lg:hidden
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <motion.div
        animate={{ width: isCollapsed ? 80 : 288 }} // 20 (80px) vs 72 (288px)
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 ${SIDEBAR_CLASSES}
        `}
      >
        <SidebarContent />
      </motion.div>
    </>
  );
};