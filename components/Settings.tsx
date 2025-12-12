
import React, { useState } from 'react';
import { X, Moon, Sun, User, Book, Building2, Calendar, AlertCircle } from 'lucide-react';
import { UserSettings, ThemeMode, AccentColor } from '../types';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    settings: UserSettings;
    onSave: (s: UserSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState(settings);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-fade-in">
            <div className="ios-card w-full max-w-lg p-6 relative animate-scale-in dark:bg-[#1E293B] dark:text-white max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Student Profile</h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* User Info */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Personal Details</label>
                        
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl flex items-center gap-3">
                            <User className="w-5 h-5 text-slate-400" />
                            <input 
                                value={localSettings.name}
                                onChange={(e) => setLocalSettings({...localSettings, name: e.target.value})}
                                className="bg-transparent w-full outline-none text-sm font-medium text-slate-900 dark:text-white"
                                placeholder="Full Name"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                             <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl flex items-center gap-3">
                                <Book className="w-5 h-5 text-slate-400" />
                                <select 
                                    value={localSettings.major}
                                    onChange={(e) => setLocalSettings({...localSettings, major: e.target.value})}
                                    className="bg-transparent w-full outline-none text-sm font-medium appearance-none text-slate-900 dark:text-white"
                                >
                                    <option value="CSE">CSE</option>
                                    <option value="ECE">ECE</option>
                                    <option value="EE">EE</option>
                                    <option value="IT">IT</option>
                                    <option value="ME">Mech</option>
                                </select>
                             </div>
                             
                             <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-slate-400" />
                                <select 
                                    value={localSettings.year}
                                    onChange={(e) => setLocalSettings({...localSettings, year: e.target.value})}
                                    className="bg-transparent w-full outline-none text-sm font-medium appearance-none text-slate-900 dark:text-white"
                                >
                                    <option value="1st">1st Year</option>
                                    <option value="2nd">2nd Year</option>
                                    <option value="3rd">3rd Year</option>
                                    <option value="4th">4th Year</option>
                                </select>
                             </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-slate-400" />
                            <input 
                                value={localSettings.college}
                                onChange={(e) => setLocalSettings({...localSettings, college: e.target.value})}
                                className="bg-transparent w-full outline-none text-sm font-medium text-slate-900 dark:text-white"
                                placeholder="University / College Name"
                            />
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="space-y-4">
                         <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Preferences</label>
                         
                         <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl">
                             <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">Attendance Alert Limit</span>
                                </div>
                                <span className="text-sm font-bold text-indigo-600">{localSettings.attendanceThreshold}%</span>
                             </div>
                             <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={localSettings.attendanceThreshold} 
                                onChange={(e) => setLocalSettings({...localSettings, attendanceThreshold: parseInt(e.target.value)})}
                                className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                             />
                             <p className="text-[10px] text-slate-400 mt-2">You will be notified if attendance falls below this percentage.</p>
                         </div>
                    </div>

                    {/* Appearance */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">App Settings</label>
                        <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                            <button 
                                onClick={() => setLocalSettings({...localSettings, theme: 'light'})}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${localSettings.theme === 'light' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                            >
                                <Sun className="w-4 h-4" /> Light
                            </button>
                            <button 
                                onClick={() => setLocalSettings({...localSettings, theme: 'dark'})}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${localSettings.theme === 'dark' ? 'bg-slate-700 shadow-sm text-white' : 'text-slate-500'}`}
                            >
                                <Moon className="w-4 h-4" /> Dark
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        Save Profile
                    </button>
                </div>
            </div>
        </div>
    );
};
