
import React, { useState, useEffect } from 'react';
import { Calendar, Save, Plus, X, Trash2, CalendarCheck, Check, Clock, AlertTriangle, Bell, FileText } from 'lucide-react';
import { getAttendance, saveAttendance, getAssignments, saveAssignment, updateAssignment, deleteAssignment, getSettings } from '../services/storage';
import { AttendanceSubject, Assignment } from '../types';

interface TimeTableEntry {
    day: number;
    period: number;
    subject: string;
}

export const TimeTable: React.FC = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8];
    const [schedule, setSchedule] = useState<TimeTableEntry[]>([]);
    
    // Attendance State
    const [attendance, setAttendance] = useState<AttendanceSubject[]>([]);
    const [newSubject, setNewSubject] = useState('');
    const [showAddSubject, setShowAddSubject] = useState(false);
    const [threshold, setThreshold] = useState(75);
    const [notifiedSubjects, setNotifiedSubjects] = useState<Set<string>>(new Set());

    // Assignment State
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [newAssignTitle, setNewAssignTitle] = useState('');
    const [newAssignDate, setNewAssignDate] = useState('');
    const [showAddAssign, setShowAddAssign] = useState(false);

    // Helper to calc stats (Hoisted for use in useEffect)
    const getStats = (logs: { timestamp: number, status: 'present' | 'absent' }[]) => {
        const total = logs.length;
        const present = logs.filter(l => l.status === 'present').length;
        const percentage = total === 0 ? 100 : Math.round((present / total) * 100);
        
        const currentMonth = new Date().getMonth();
        const monthLogs = logs.filter(l => new Date(l.timestamp).getMonth() === currentMonth);
        const monthTotal = monthLogs.length;
        const monthPresent = monthLogs.filter(l => l.status === 'present').length;
        const monthPercentage = monthTotal === 0 ? 0 : Math.round((monthPresent / monthTotal) * 100);

        return { total, present, percentage, monthPercentage, monthTotal };
    };

    useEffect(() => {
        const saved = localStorage.getItem('engimind_timetable');
        if (saved) setSchedule(JSON.parse(saved));
        
        setAttendance(getAttendance());
        setAssignments(getAssignments());
        setThreshold(getSettings().attendanceThreshold || 75);

        // Request Notification Permission
        if ('Notification' in window) {
            Notification.requestPermission();
        }

        // Start Reminder Loop
        const interval = setInterval(checkReminders, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    // Check attendance threshold notifications
    useEffect(() => {
        if (attendance.length > 0 && Notification.permission === 'granted') {
            const lowSubjects = attendance.filter(sub => {
                const stats = getStats(sub.logs);
                return stats.percentage < threshold && stats.total > 0;
            });
            
            lowSubjects.forEach(sub => {
                if (!notifiedSubjects.has(sub.id)) {
                    new Notification(`Attendance Alert: ${sub.name}`, {
                        body: `Your attendance is ${getStats(sub.logs).percentage}%, which is below your ${threshold}% limit.`,
                        icon: '/favicon.ico'
                    });
                    setNotifiedSubjects(prev => new Set(prev).add(sub.id));
                }
            });
        }
    }, [attendance, threshold]);

    const checkReminders = () => {
        if (Notification.permission !== 'granted') return;

        const now = new Date();
        const currentDay = now.getDay() - 1; // 0 = Monday for our array
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // 1. Class Reminders (Assume Period 1 starts at 9:00 AM, lasts 1 hour)
        if (currentDay >= 0 && currentDay <= 4) {
            if (currentMinute === 50 && currentHour >= 8 && currentHour < 16) {
                const nextPeriodIndex = currentHour - 8;
                const entry = schedule.find(e => e.day === currentDay && e.period === nextPeriodIndex);
                if (entry && entry.subject) {
                    new Notification(`Upcoming Class: ${entry.subject}`, {
                        body: `Starting in 10 minutes (Period ${nextPeriodIndex + 1})`,
                        icon: '/favicon.ico'
                    });
                }
            }
        }

        // 2. Assignment Reminders (Due within 24 hours)
        assignments.forEach(a => {
            if (a.completed) return;
            const timeLeft = a.dueDate - now.getTime();
            // Notify if due in exactly 24 hours (with 1 min tolerance)
            if (timeLeft > 0 && timeLeft < 24 * 60 * 60 * 1000 && timeLeft > (24 * 60 * 60 * 1000) - 60000) {
                 new Notification(`Assignment Due Tomorrow: ${a.title}`, {
                    body: `Don't forget to submit!`,
                });
            }
        });
    };

    const handleChange = (day: number, period: number, val: string) => {
        const newSchedule = schedule.filter(e => !(e.day === day && e.period === period));
        if (val.trim()) {
            newSchedule.push({ day, period, subject: val });
        }
        setSchedule(newSchedule);
    };

    const handleSave = () => {
        localStorage.setItem('engimind_timetable', JSON.stringify(schedule));
        alert("Schedule Saved!");
    };

    const getSubject = (day: number, period: number) => {
        return schedule.find(e => e.day === day && e.period === period)?.subject || '';
    };

    // --- Assignment Logic ---
    const handleAddAssignment = () => {
        if (!newAssignTitle || !newAssignDate) return;
        const newAssign: Assignment = {
            id: crypto.randomUUID(),
            title: newAssignTitle,
            dueDate: new Date(newAssignDate).getTime(),
            completed: false
        };
        saveAssignment(newAssign);
        setAssignments(prev => [newAssign, ...prev]);
        setNewAssignTitle('');
        setNewAssignDate('');
        setShowAddAssign(false);
    };

    const toggleAssignment = (id: string, currentStatus: boolean) => {
        updateAssignment(id, { completed: !currentStatus });
        setAssignments(prev => prev.map(a => a.id === id ? { ...a, completed: !currentStatus } : a));
    };

    const removeAssignment = (id: string) => {
        deleteAssignment(id);
        setAssignments(prev => prev.filter(a => a.id !== id));
    };

    // --- Attendance Logic ---
    const handleAddSubject = () => {
        if (!newSubject.trim()) return;
        const newItem: AttendanceSubject = { id: crypto.randomUUID(), name: newSubject, logs: [] };
        const updated = [...attendance, newItem];
        setAttendance(updated);
        saveAttendance(updated);
        setNewSubject('');
        setShowAddSubject(false);
    };

    const handleDeleteSubject = (id: string) => {
        if(confirm("Remove this subject from tracker?")) {
            const updated = attendance.filter(a => a.id !== id);
            setAttendance(updated);
            saveAttendance(updated);
        }
    };

    const markAttendance = (id: string, status: 'present' | 'absent') => {
        const updated = attendance.map(sub => {
            if (sub.id === id) {
                return { ...sub, logs: [...sub.logs, { timestamp: Date.now(), status }] };
            }
            return sub;
        });
        setAttendance(updated);
        saveAttendance(updated);
        
        // Reset notification for this subject if attendance improves
        if (status === 'present') {
            const subject = updated.find(s => s.id === id);
            if (subject) {
                const stats = getStats(subject.logs);
                if (stats.percentage >= threshold) {
                    setNotifiedSubjects(prev => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                    });
                }
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 pb-24 animate-slide-in">
             <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Class Schedule</h1>
                    <p className="text-slate-500">Manage your weekly classes and assignments.</p>
                </div>
                <div className="flex gap-2">
                     <button 
                        onClick={() => {
                            if ('Notification' in window && Notification.permission !== 'granted') {
                                Notification.requestPermission();
                            }
                        }}
                        className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Enable Notifications"
                    >
                        <Bell className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg"
                    >
                        <Save className="w-4 h-4" /> Save
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto pb-4 mb-12">
                <div className="min-w-[800px] bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="grid grid-cols-[80px_repeat(8,1fr)]">
                        {/* Header Row */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-800 text-xs font-bold uppercase text-slate-400">Day</div>
                        {periods.map(p => (
                            <div key={p} className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-center text-xs font-bold uppercase text-slate-500">
                                Period {p}
                            </div>
                        ))}

                        {/* Rows */}
                        {days.map((day, dIdx) => (
                            <React.Fragment key={dIdx}>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center justify-center">
                                    {day}
                                </div>
                                {periods.map((p, pIdx) => (
                                    <div key={pIdx} className="border-b border-r border-slate-100 dark:border-slate-800 last:border-r-0 relative group">
                                        <input 
                                            value={getSubject(dIdx, pIdx)}
                                            onChange={(e) => handleChange(dIdx, pIdx, e.target.value)}
                                            className="w-full h-14 p-2 text-center bg-transparent outline-none text-sm font-medium text-slate-900 dark:text-white focus:bg-indigo-50 dark:focus:bg-indigo-900/20 transition-colors"
                                            placeholder="-"
                                        />
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

             {/* Assignments Section */}
             <div className="mb-16">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-medium text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" /> Pending Assignments
                    </h2>
                    <button 
                        onClick={() => setShowAddAssign(true)}
                        className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-4 py-2 rounded-full transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add New
                    </button>
                </div>

                {showAddAssign && (
                    <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col md:flex-row gap-3 animate-fade-in">
                        <input 
                            value={newAssignTitle}
                            onChange={(e) => setNewAssignTitle(e.target.value)}
                            placeholder="Assignment Title (e.g. Lab Report 3)"
                            className="flex-1 p-3 bg-white dark:bg-slate-900 rounded-xl outline-none text-slate-900 dark:text-white"
                            autoFocus
                        />
                         <input 
                            type="datetime-local"
                            value={newAssignDate}
                            onChange={(e) => setNewAssignDate(e.target.value)}
                            className="p-3 bg-white dark:bg-slate-900 rounded-xl outline-none text-slate-900 dark:text-white"
                        />
                        <button onClick={handleAddAssignment} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">Add</button>
                        <button onClick={() => setShowAddAssign(false)} className="px-4 text-slate-500 hover:text-slate-800"><X className="w-5 h-5"/></button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignments.length === 0 ? (
                        <p className="text-slate-400 italic text-sm col-span-full">No pending assignments. Great job!</p>
                    ) : assignments.map(assign => (
                        <div 
                            key={assign.id} 
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                                assign.completed 
                                ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-70' 
                                : 'bg-white dark:bg-[#1E293B] border-indigo-100 dark:border-slate-700 shadow-sm'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => toggleAssignment(assign.id, assign.completed)}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                                        assign.completed 
                                        ? 'bg-green-500 border-green-500 scale-100' 
                                        : 'border-slate-300 dark:border-slate-500 hover:border-indigo-500 active:scale-90'
                                    }`}
                                >
                                    {assign.completed && <Check className="w-4 h-4 text-white animate-scale-in" />}
                                </button>
                                <div>
                                    <h3 className={`font-semibold text-slate-900 dark:text-white transition-all duration-300 ${assign.completed ? 'line-through text-slate-400' : ''}`}>
                                        {assign.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Due: {new Date(assign.dueDate).toLocaleDateString()} {new Date(assign.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => removeAssignment(assign.id)} className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
             </div>

            {/* Attendance Tracker */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-10">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-medium text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                        <CalendarCheck className="w-5 h-5 text-indigo-500" /> Attendance Tracker
                    </h2>
                    <button 
                        onClick={() => setShowAddSubject(true)}
                        className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Subject
                    </button>
                </div>

                {showAddSubject && (
                    <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl flex gap-3 animate-fade-in">
                        <input 
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            placeholder="Subject Name (e.g. Control Systems)"
                            className="flex-1 p-3 bg-white dark:bg-slate-900 rounded-xl outline-none text-slate-900 dark:text-white"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                        />
                        <button onClick={handleAddSubject} className="px-6 bg-indigo-600 text-white rounded-xl font-bold">Save</button>
                        <button onClick={() => setShowAddSubject(false)} className="px-4 text-slate-500 hover:text-slate-800"><X className="w-5 h-5"/></button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {attendance.length === 0 ? (
                        <div className="col-span-full text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-slate-500">Track your class attendance here.</p>
                        </div>
                    ) : attendance.map(sub => {
                        const stats = getStats(sub.logs);
                        const isLow = stats.percentage < threshold;
                        
                        return (
                            <div key={sub.id} className={`bg-white dark:bg-[#1E293B] p-6 rounded-2xl border shadow-sm relative group transition-all ${isLow ? 'border-red-200 dark:border-red-900/50' : 'border-slate-100 dark:border-slate-800'}`}>
                                <button 
                                    onClick={() => handleDeleteSubject(sub.id)}
                                    className="absolute top-3 right-3 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                                    title="Delete Subject"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="flex justify-between items-start mb-1 pr-8">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">{sub.name}</h3>
                                    {isLow && (
                                        <div className="animate-pulse" title={`Attendance below ${threshold}%`}>
                                            <AlertTriangle className="w-5 h-5 text-red-500" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`text-2xl font-black ${isLow ? 'text-red-500' : 'text-green-500'}`}>
                                        {stats.percentage}%
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Overall</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : 'bg-green-500'}`} 
                                        style={{ width: `${stats.percentage}%` }}
                                    />
                                </div>

                                {/* Monthly Stat */}
                                <div className="flex justify-between items-center text-xs text-slate-500 mb-6 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                                    <span>This Month: <strong>{stats.monthPercentage}%</strong></span>
                                    <span>Total Classes: {stats.total}</span>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => markAttendance(sub.id, 'present')}
                                        className="flex-1 py-2 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        Present
                                    </button>
                                    <button 
                                        onClick={() => markAttendance(sub.id, 'absent')}
                                        className="flex-1 py-2 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        Absent
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
