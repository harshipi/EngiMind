
import React, { useState } from 'react';
import { BookOpen, LayoutDashboard, Briefcase, GraduationCap, Folder, Settings as SettingsIcon, Zap, Calendar, Menu, X, Users, Home, MoreHorizontal } from 'lucide-react';
import { UserSettings } from '../types';

interface NavbarProps {
    onNavigate: (view: any) => void;
    currentView: string;
    onOpenSettings: () => void;
    settings: UserSettings;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView, onOpenSettings, settings }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'input', label: 'Study', icon: BookOpen },
    { id: 'timetable', label: 'Schedule', icon: Calendar },
    { id: 'dashboard', label: 'Progress', icon: LayoutDashboard },
    { id: 'activity', label: 'Activity', icon: Users },
    { id: 'drill', label: 'Drill', icon: Zap },
    { id: 'tests', label: 'Tests', icon: Folder },
    { id: 'grades', label: 'Results', icon: GraduationCap },
    { id: 'career', label: 'Career', icon: Briefcase },
    { id: 'resources', label: 'Library', icon: Folder },
  ];

  const mobileTabs = navItems.slice(0, 4); // First 4 items for bottom bar
  const drawerItems = navItems.slice(4); // Rest for drawer

  const handleNavClick = (id: string) => {
      onNavigate(id);
      setIsMobileMenuOpen(false);
  };

  return (
    <>
        {/* Desktop Header */}
        <nav className="sticky top-0 z-40 w-full glass transition-all duration-300 pt-safe">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div onClick={() => onNavigate('input')} className="flex items-center gap-2 cursor-pointer group">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-none group-hover:scale-105 transition-transform">
                            <span className="text-white font-bold text-2xl pb-1 font-serif">ε</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-800 dark:text-white md:hidden">EngiMind</span>
                    </div>
                </div>

                {/* Desktop Nav Items */}
                <div className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-full overflow-x-auto max-w-3xl no-scrollbar">
                    {navItems.map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                                currentView === item.id 
                                ? 'bg-white dark:bg-[#1E293B] shadow-sm text-indigo-600 dark:text-indigo-400' 
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <button onClick={onOpenSettings} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <SettingsIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
            </div>
        </nav>

        {/* Mobile Bottom Navigation Bar (iOS Style) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe transition-all duration-300">
            <div className="flex justify-around items-center h-16 px-2">
                {mobileTabs.map((item) => {
                    const isActive = currentView === item.id || (item.id === 'input' && currentView === 'output');
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform ${
                                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                            }`}
                        >
                            <item.icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    )
                })}
                {/* More Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform ${
                        isMobileMenuOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                >
                    <MoreHorizontal className="w-6 h-6" />
                    <span className="text-[10px] font-medium">More</span>
                </button>
            </div>
        </div>

        {/* Mobile Sidebar (Drawer) */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 z-[60] flex justify-end md:hidden">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
                
                {/* Sidebar Content */}
                <div className="relative w-4/5 max-w-xs h-full bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col p-6 animate-slide-in-right pb-safe">
                    <div className="flex justify-between items-center mb-8 pt-safe">
                        <span className="font-bold text-xl text-slate-900 dark:text-white">Menu</span>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">More Apps</p>
                        {drawerItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                                    currentView === item.id 
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold' 
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                <div className={`p-2 rounded-xl ${currentView === item.id ? 'bg-white dark:bg-indigo-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className="text-base">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-400 text-center">EngiMind v1.2</p>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};
    