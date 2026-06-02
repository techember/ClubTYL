import React, { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { motion, AnimatePresence } from "framer-motion";

interface AdminLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  title,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const toggleCollapsed = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  useKeyboardShortcuts({
    onEscape: closeSidebar,
    onToggleSidebar: toggleSidebar,
  });

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={closeSidebar}
        onToggleCollapsed={toggleCollapsed}
      />

      {/* RIGHT SIDE */}
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"}
        `}
      >
        {/* HEADER */}
        <Header
          title={title}
          onSidebarToggle={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />

        {/* 
          IMPORTANT FIX:
          - overflow-hidden (NOT overflow-y-auto)
          - height is controlled by children
        */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full w-full max-w-7xl mx-auto flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
