
import React, { useState, useEffect } from 'react';
import { getResources, saveResource, deleteResource, getSettings } from '../services/storage';
import { generateSmartResources } from '../services/gemini';
import { ResourceItem } from '../types';
import { FileText, Link, Trash2, Plus, ExternalLink, Library, Search, Loader2, Sparkles, Book, Video } from 'lucide-react';

export const ResourceLibrary: React.FC = () => {
    const [resources, setResources] = useState<ResourceItem[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isSearchingAI, setIsSearchingAI] = useState(false);
    const [aiQuery, setAiQuery] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');

    useEffect(() => {
        const stored = getResources();
        if (stored.length === 0) {
            populateDefaults();
        } else {
            setResources(stored);
        }
    }, []);

    const populateDefaults = () => {
        const settings = getSettings();
        const defaults: ResourceItem[] = [];
        const base = { type: 'link' as const, dateAdded: Date.now() };

        if (settings.major === 'CSE' || settings.major === 'IT') {
            defaults.push(
                { ...base, id: crypto.randomUUID(), title: 'MIT 6.006 Intro to Algorithms', url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/', source: 'MIT OCW', format: 'video' },
                { ...base, id: crypto.randomUUID(), title: 'Introduction to Algorithms by CLRS', url: 'https://archive.org/details/introduction-to-algorithms-3rd-edition', source: 'Internet Archive', format: 'book' }
            );
        } else {
             defaults.push({ ...base, id: crypto.randomUUID(), title: 'MIT 18.01 Single Variable Calculus', url: 'https://ocw.mit.edu/courses/18-01-single-variable-calculus-fall-2006/', source: 'MIT OCW', format: 'video' });
        }
        
        defaults.forEach(d => saveResource(d));
        setResources(getResources());
    };

    const handleAdd = () => {
        if (!newTitle || !newUrl) return;
        const newItem: ResourceItem = {
            id: crypto.randomUUID(),
            title: newTitle,
            type: 'link',
            url: newUrl,
            dateAdded: Date.now(),
            source: 'User Added',
            format: 'website'
        };
        saveResource(newItem);
        setResources(getResources());
        setIsAdding(false);
        setNewTitle('');
        setNewUrl('');
    };

    const handleAISearch = async () => {
        if (!aiQuery.trim()) return;
        setIsSearchingAI(true);
        try {
            const results = await generateSmartResources(aiQuery, getSettings().major);
            results.forEach(r => saveResource(r));
            setResources(getResources());
            setAiQuery('');
        } catch(e) { alert("AI Search failed."); }
        setIsSearchingAI(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("Delete this resource?")) {
            deleteResource(id);
            setResources(getResources());
        }
    };

    const getIcon = (item: ResourceItem) => {
        if (item.format === 'book') return <Book className="w-5 h-5 text-amber-600" />;
        if (item.format === 'video') return <Video className="w-5 h-5 text-red-500" />;
        if (item.type === 'file') return <FileText className="w-5 h-5 text-orange-500" />;
        return <Link className="w-5 h-5 text-blue-500" />;
    };

    const getBgColor = (item: ResourceItem) => {
        if (item.format === 'book') return 'bg-amber-50 dark:bg-amber-900/20';
        if (item.format === 'video') return 'bg-red-50 dark:bg-red-900/20';
        return 'bg-slate-100 dark:bg-slate-800';
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-32 animate-slide-in">
            <div className="flex justify-between items-center mb-6 pt-safe">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-slate-900 dark:text-white">Smart Library</h1>
                    <p className="text-sm text-slate-500">Curated resources for your major</p>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* AI Search Box */}
            <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden active:scale-[0.99] transition-transform duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3 opacity-90">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">AI Librarian</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-5 leading-tight">Find textbooks, pdfs & lectures</h2>
                    <div className="flex gap-2">
                        <input 
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            placeholder="e.g. 'Thermodynamics' or 'Data Structures'"
                            className="flex-1 p-3.5 rounded-2xl bg-white/20 backdrop-blur-lg border border-white/30 text-white placeholder-indigo-100 focus:bg-white/30 transition-all outline-none text-sm md:text-base"
                            onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                        />
                        <button 
                            onClick={handleAISearch}
                            disabled={isSearchingAI}
                            className="p-3.5 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 active:scale-95 transition-all"
                        >
                            {isSearchingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {isAdding && (
                <div className="bg-white dark:bg-[#1C1C1E] p-5 mb-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 animate-scale-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-900 dark:text-white">Add Custom Resource</h3>
                        <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><Plus className="w-5 h-5 rotate-45" /></button>
                    </div>
                    <input 
                        value={newTitle} onChange={e => setNewTitle(e.target.value)}
                        placeholder="Title (e.g. Signal Processing PDF)"
                        className="w-full p-3 mb-3 bg-slate-100 dark:bg-slate-900 rounded-xl outline-none text-slate-900 dark:text-white text-sm"
                    />
                    <input 
                        value={newUrl} onChange={e => setNewUrl(e.target.value)}
                        placeholder="URL link"
                        className="w-full p-3 mb-4 bg-slate-100 dark:bg-slate-900 rounded-xl outline-none text-slate-900 dark:text-white text-sm"
                    />
                    <button onClick={handleAdd} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-transform text-sm">Save Item</button>
                </div>
            )}

            <div className="grid gap-3">
                {resources.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center text-slate-400">
                        <Library className="w-12 h-12 mb-3 opacity-20" />
                        <p>Library is empty.</p>
                    </div>
                ) : resources.map(item => (
                    <div key={item.id} className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-800 transition-all active:scale-[0.98]">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getBgColor(item)}`}>
                                {getIcon(item)}
                            </div>
                            <div className="overflow-hidden min-w-0 flex-1">
                                <h3 className="font-semibold text-slate-900 dark:text-white truncate pr-2 text-[15px]">{item.title}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-md shrink-0">
                                        {item.source || 'Link'}
                                    </span>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-indigo-500 flex items-center gap-1 truncate min-w-0 flex-1">
                                        <span className="truncate">{item.url}</span> <ExternalLink className="w-3 h-3 shrink-0" />
                                    </a>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 -mr-2 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
