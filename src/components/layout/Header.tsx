import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, BellIcon, UserCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  title: string;
  onSidebarToggle: () => void;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, onSidebarToggle, sidebarOpen }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 h-20 px-4 lg:px-8 flex items-center justify-between glass border-b border-border/40 transition-all duration-300">
      {/* Left - Profile Avatar (Sidebar Toggle) & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onSidebarToggle}
          className="p-2 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-primary transition-colors focus:outline-none lg:hidden"
          aria-label="Toggle sidebar menu"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        {/* Page Title */}
        <div>
          <h1 className="text-xl lg:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-slate-500">
            {title}
          </h1>
          <p className="text-xs text-muted-foreground hidden lg:block">Welcome back, Admin</p>
        </div>
      </div>


      {/* User Profile */}
      <div className="flex items-center gap-3 pl-3 lg:pl-6 border-l border-border/50">
        <div className="hidden text-right lg:block">
          <p className="text-sm font-semibold text-foreground">ClubTYL</p>
          <p className="text-xs text-muted-foreground">Clubtyl2022@gmail.com</p>
        </div>

        <button className="relative group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-violet-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              <img src="https://ui-avatars.com/api/?name=ClubTYL&background=6366f1&color=fff" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
          {/* Status Dot */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
        </button>
      </div>

    </header>
  );
};