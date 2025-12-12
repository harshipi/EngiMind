
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Plus, Trash2, Upload, GraduationCap, Save, Image as ImageIcon, Calculator, AlertCircle, FileText, X, Briefcase, Award, Users, FileCheck, RefreshCw, Copy, Download } from 'lucide-react';
import { SemesterData, SubjectGrade, AcademicAttachment, StudentPortfolio, Internship, Achievement, ClubActivity } from '../types';
import { getGrades, saveSemesterData, getPortfolio, savePortfolio, getSettings } from '../services/storage';
import { generateProfessionalResume } from '../services/gemini';

export const GradeCenter: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'academics' | 'portfolio' | 'resume'>('academics');
    
    // Academic State
    const [activeSem, setActiveSem] = useState(1);
    const [semData, setSemData] = useState<SemesterData>({ semester: 1, subjects: [], attachments: [] });
    const [loading, setLoading] = useState(false);
    
    // Attachment State
    const [newAttachmentName, setNewAttachmentName] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    // Portfolio State
    const [portfolio, setPortfolio] = useState<StudentPortfolio>({ internships: [], achievements: [], clubs: [] });
    const [isPortfolioDirty, setIsPortfolioDirty] = useState(false);
    
    // Resume State
    const [resumeMarkdown, setResumeMarkdown] = useState<string>('');
    const [isGeneratingResume, setIsGeneratingResume] = useState(false);
    const [resumeFeedback, setResumeFeedback] = useState('');
    const [showResumeFeedbackInput, setShowResumeFeedbackInput] = useState(false);

    // Load Data
    useEffect(() => {
        // Load Grades
        const allGrades = getGrades();
        const found = allGrades.find(s => s.semester === activeSem);
        if (found) {
            setSemData({ ...found, attachments: found.attachments || [] });
        } else {
            setSemData({ semester: activeSem, subjects: [], attachments: [] });
        }
    }, [activeSem]);

    useEffect(() => {
        // Load Portfolio
        setPortfolio(getPortfolio());
    }, []);

    // --- Academic Functions ---

    const handleAddSubject = () => {
        setSemData(prev => ({
            ...prev,
            subjects: [...prev.subjects, { id: crypto.randomUUID(), name: '', obtained: '', max: '10', credits: '3' }]
        }));
    };

    const handleUpdateSubject = (id: string, field: keyof SubjectGrade, value: string) => {
        setSemData(prev => ({
            ...prev,
            subjects: prev.subjects.map(s => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    const handleDeleteSubject = (id: string) => {
        setSemData(prev => ({
            ...prev,
            subjects: prev.subjects.filter(s => s.id !== id)
        }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!newAttachmentName.trim()) {
            alert("Please enter a name for this document first (e.g., 'Grade Sheet').");
            if (fileRef.current) fileRef.current.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("File is too large. Please upload under 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const newAtt: AcademicAttachment = {
                id: crypto.randomUUID(),
                name: newAttachmentName,
                data: ev.target?.result as string,
                type: file.type.includes('image') ? 'image' : 'pdf',
                date: Date.now()
            };

            setSemData(prev => ({
                ...prev,
                attachments: [...prev.attachments, newAtt]
            }));
            setNewAttachmentName('');
            if (fileRef.current) fileRef.current.value = '';
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteAttachment = (id: string) => {
        if (confirm("Delete this document?")) {
            setSemData(prev => ({
                ...prev,
                attachments: prev.attachments.filter(a => a.id !== id)
            }));
        }
    };

    const handleSaveAcademics = () => {
        setLoading(true);
        saveSemesterData(semData);
        setTimeout(() => setLoading(false), 500);
    };

    const calculateGPA = (data: SemesterData = semData) => {
        let totalCredits = 0;
        let weightedSum = 0;
        let hasData = false;
        data.subjects.forEach(sub => {
            const obtained = parseFloat(sub.obtained);
            const credits = parseFloat(sub.credits);
            if (!isNaN(obtained) && !isNaN(credits)) {
                weightedSum += obtained * credits;
                totalCredits += credits;
                hasData = true;
            }
        });
        if (!hasData || totalCredits === 0) return "0.00";
        return (weightedSum / totalCredits).toFixed(2);
    };

    const calculateCGPA = () => {
        const allGrades = getGrades();
        let totalSum = 0;
        let count = 0;
        allGrades.forEach(sem => {
            const semGPA = parseFloat(calculateGPA(sem));
            if (semGPA > 0) {
                totalSum += semGPA;
                count++;
            }
        });
        return count === 0 ? "0.00" : (totalSum / count).toFixed(2);
    };

    // --- Portfolio Functions ---

    const addItem = (type: 'internships' | 'achievements' | 'clubs') => {
        const newPortfolio = { ...portfolio };
        const id = crypto.randomUUID();
        
        if (type === 'internships') {
            newPortfolio.internships.push({ id, role: '', company: '', duration: '', description: '' });
        } else if (type === 'achievements') {
            newPortfolio.achievements.push({ id, title: '', date: '', description: '' });
        } else {
            newPortfolio.clubs.push({ id, role: '', clubName: '', description: '' });
        }
        setPortfolio(newPortfolio);
        setIsPortfolioDirty(true);
    };

    const updateItem = (type: 'internships' | 'achievements' | 'clubs', id: string, field: string, value: string) => {
        const newPortfolio = { ...portfolio };
        // @ts-ignore - dynamic key access
        newPortfolio[type] = newPortfolio[type].map((item: any) => item.id === id ? { ...item, [field]: value } : item);
        setPortfolio(newPortfolio);
        setIsPortfolioDirty(true);
    };

    const deleteItem = (type: 'internships' | 'achievements' | 'clubs', id: string) => {
        const newPortfolio = { ...portfolio };
        // @ts-ignore
        newPortfolio[type] = newPortfolio[type].filter((item: any) => item.id !== id);
        setPortfolio(newPortfolio);
        setIsPortfolioDirty(true);
    };

    const handleSavePortfolio = () => {
        savePortfolio(portfolio);
        setIsPortfolioDirty(false);
    };

    // --- Resume Functions ---

    const handleGenerateResume = async () => {
        setIsGeneratingResume(true);
        setShowResumeFeedbackInput(false);
        try {
            const settings = getSettings();
            const cgpa = calculateCGPA();
            const resume = await generateProfessionalResume(settings, cgpa, portfolio, resumeFeedback);
            setResumeMarkdown(resume);
            setResumeFeedback(''); // Clear feedback after use
        } catch (e) {
            alert("Failed to generate resume.");
        } finally {
            setIsGeneratingResume(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(resumeMarkdown);
        alert("Resume Markdown copied to clipboard!");
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 pb-32 animate-slide-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Results & Portfolio</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage grades, build your profile, and generate a resume.</p>
                </div>
                
                {/* Main Tabs */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    {[
                        { id: 'academics', label: 'Academics', icon: GraduationCap },
                        { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
                        { id: 'resume', label: 'Resume AI', icon: FileCheck }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === tab.id 
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* --- ACADEMICS TAB --- */}
            {activeTab === 'academics' && (
                <div className="animate-fade-in">
                    <div className="flex items-center gap-4 bg-white dark:bg-[#1E293B] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-8 max-w-sm">
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                            <Calculator className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Semester GPA</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{calculateGPA()}</p>
                        </div>
                    </div>

                    <div className="flex overflow-x-auto gap-2 pb-4 mb-6 scrollbar-hide">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                            <button
                                key={sem}
                                onClick={() => setActiveSem(sem)}
                                className={`min-w-[4rem] h-16 rounded-2xl flex flex-col items-center justify-center transition-all ${
                                    activeSem === sem 
                                    ? 'bg-indigo-600 text-white shadow-lg scale-105' 
                                    : 'bg-white dark:bg-[#1E293B] text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                <span className="text-xs font-bold uppercase">Sem</span>
                                <span className="text-xl font-bold">{sem}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="ios-card p-6 dark:bg-[#1E293B] min-h-[400px]">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subjects & Scores</h2>
                                    <button 
                                        onClick={handleSaveAcademics}
                                        className="flex items-center gap-2 text-sm font-bold text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 px-4 py-2 rounded-full transition-colors"
                                    >
                                        {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                                    </button>
                                </div>

                                {semData.subjects.length > 0 && (
                                    <div className="flex gap-2 mb-2 px-1">
                                        <span className="flex-1 text-xs font-bold uppercase text-slate-400">Subject</span>
                                        <span className="w-14 text-xs font-bold uppercase text-slate-400 text-center">Credit</span>
                                        <span className="w-20 text-xs font-bold uppercase text-slate-400 text-center">Got</span>
                                        <span className="w-16 text-xs font-bold uppercase text-slate-400 text-center">Max</span>
                                        <span className="w-10"></span>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {semData.subjects.map((sub) => (
                                        <div key={sub.id} className="flex gap-2 items-center animate-fade-in">
                                            <input 
                                                value={sub.name}
                                                onChange={(e) => handleUpdateSubject(sub.id, 'name', e.target.value)}
                                                placeholder="Subject Name"
                                                className="flex-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none text-sm font-medium text-slate-900 dark:text-white"
                                            />
                                            <input 
                                                value={sub.credits}
                                                onChange={(e) => handleUpdateSubject(sub.id, 'credits', e.target.value)}
                                                placeholder="3"
                                                type="number"
                                                className="w-14 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none text-sm font-medium text-center text-slate-900 dark:text-white"
                                            />
                                            <input 
                                                value={sub.obtained}
                                                onChange={(e) => handleUpdateSubject(sub.id, 'obtained', e.target.value)}
                                                placeholder="9.0"
                                                type="number"
                                                className="w-20 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none text-sm font-medium text-center text-indigo-600 dark:text-indigo-400 font-bold"
                                            />
                                            <input 
                                                value={sub.max}
                                                onChange={(e) => handleUpdateSubject(sub.id, 'max', e.target.value)}
                                                placeholder="10"
                                                type="number"
                                                className="w-16 p-3 bg-transparent border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-center text-slate-500"
                                            />
                                            <button 
                                                onClick={() => handleDeleteSubject(sub.id)}
                                                className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors w-10 flex justify-center"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleAddSubject} className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:border-indigo-600 hover:text-indigo-600 transition-all font-medium"><Plus className="w-4 h-4" /> Add Subject</button>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="ios-card p-6 dark:bg-[#1E293B] h-full flex flex-col">
                                <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Documents</h2>
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl mb-6">
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Upload New</label>
                                    <div className="flex gap-2 mb-3">
                                        <input value={newAttachmentName} onChange={(e) => setNewAttachmentName(e.target.value)} placeholder="Name (e.g. Marksheet)" className="flex-1 p-2 text-sm bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none"/>
                                    </div>
                                    <button onClick={() => fileRef.current?.click()} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Select File</button>
                                    <input type="file" ref={fileRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload}/>
                                </div>
                                <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                                    {semData.attachments.map(att => (
                                        <div key={att.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 group">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                                                {att.type === 'image' ? <img src={att.data} className="w-full h-full object-cover" /> : <FileText className="w-5 h-5 text-indigo-500" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{att.name}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(att.date).toLocaleDateString()}</p>
                                            </div>
                                            <button onClick={() => handleDeleteAttachment(att.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PORTFOLIO TAB --- */}
            {activeTab === 'portfolio' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <div className="flex items-center gap-3">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                            <p className="text-indigo-900 dark:text-indigo-200 text-sm font-medium">Add details here to build your Professional Resume.</p>
                        </div>
                        {isPortfolioDirty && (
                            <button onClick={handleSavePortfolio} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow hover:bg-indigo-700 transition-all">Save Changes</button>
                        )}
                    </div>

                    {/* Internships Section */}
                    <div className="ios-card p-6 dark:bg-[#1E293B]">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Briefcase className="w-5 h-5 text-slate-400" /> Internships & Experience</h2>
                            <button onClick={() => addItem('internships')} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-6">
                            {portfolio.internships.map(item => (
                                <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl relative group">
                                    <button onClick={() => deleteItem('internships', item.id)} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                    <input value={item.role} onChange={(e) => updateItem('internships', item.id, 'role', e.target.value)} placeholder="Role (e.g. Frontend Intern)" className="p-3 bg-white dark:bg-slate-800 rounded-xl outline-none text-sm font-medium border border-transparent focus:border-indigo-500" />
                                    <input value={item.company} onChange={(e) => updateItem('internships', item.id, 'company', e.target.value)} placeholder="Company Name" className="p-3 bg-white dark:bg-slate-800 rounded-xl outline-none text-sm border border-transparent focus:border-indigo-500" />
                                    <input value={item.duration} onChange={(e) => updateItem('internships', item.id, 'duration', e.target.value)} placeholder="Duration (e.g. Jun 2023 - Aug 2023)" className="p-3 bg-white dark:bg-slate-800 rounded-xl outline-none text-sm border border-transparent focus:border-indigo-500" />
                                    <textarea value={item.description} onChange={(e) => updateItem('internships', item.id, 'description', e.target.value)} placeholder="What did you do? (e.g. Built a React Dashboard...)" className="p-3 bg-white dark:bg-slate-800 rounded-xl outline-none text-sm md:col-span-2 min-h-[80px] border border-transparent focus:border-indigo-500" />
                                </div>
                            ))}
                            {portfolio.internships.length === 0 && <p className="text-center text-slate-400 text-sm italic py-4">No internships added yet.</p>}
                        </div>
                    </div>

                    {/* Achievements Section */}
                    <div className="ios-card p-6 dark:bg-[#1E293B]">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Award className="w-5 h-5 text-slate-400" /> Achievements & Certifications</h2>
                            <button onClick={() => addItem('achievements')} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-6">
                            {portfolio.achievements.map(item => (
                                <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl relative group">
                                    <button onClick={() => deleteItem('achievements', item.id)} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                    <input value={item.title} onChange={(e) => updateItem('achievements', item.id, 'title', e.target.value)} placeholder="Title (e.g. Hackathon Winner)" className="p-3 bg-white dark:bg-slate-800 rounded-xl outline-none text-sm font-medium border border-transparent focus:border-indigo-500" />
                                    <input value={item.date} onChange={(e) => updateItem('achievements', item.id, 'date', e.target.value)} placeholder="Date (e.g. Dec 2023)" className="p-3 bg-white dark:bg-slate-800 rounded-xl outline-none text-sm border border-transparent focus:border-indigo-500" />
                                    <textarea value={item.description} onChange={(e) => updateItem('achievements', item.id, 'description', e.target.value)} placeholder="Details (e.g. Secured 1st rank among 50 teams)" className="p-3 bg-white dark:bg-slate-800 rounded-xl outline-none text-sm md:col-span-2 min-h-[60px] border border-transparent focus:border-indigo-500" />
                                </div>
                            ))}
                            {portfolio.achievements.length === 0 && <p className="text-center text-slate-400 text-sm italic py-4">No achievements added yet.</p>}
                        </div>
                    </div>

                    {/* Clubs Section */}
                    <div className="ios-card p-6 dark:bg-[#1E293B]">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users className="w-5 h-5 text-slate-400" /> Club Activities & Leadership</h2>
                            <button onClick={() => addItem('clubs')} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-6">
                            {portfolio.clubs.map(item => (
                                <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl relative group">
                                    <button onClick={() => deleteItem('clubs', item.id)} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                    <input value={item.role} onChange={(e) => updateItem('clubs', item.id, 'role', e.target.value)} placeholder="Role (e.g. Secretary)" className="p-3 bg-white dark:bg-slate-800 rounded-xl outline-none text-sm font-medium border border-transparent focus:border-indigo-500" />
                                    <input value={item.clubName} onChange={(e) => updateItem('clubs', item.id, 'clubName', e.target.value)} placeholder="Organization/Club Name" className="p-3 bg-white dark:bg-slate-800 rounded-xl outline-none text-sm border border-transparent focus:border-indigo-500" />
                                    <textarea value={item.description} onChange={(e) => updateItem('clubs', item.id, 'description', e.target.value)} placeholder="Responsibilities (e.g. Organized tech fest...)" className="p-3 bg-white dark:bg-slate-800 rounded-xl outline-none text-sm md:col-span-2 min-h-[60px] border border-transparent focus:border-indigo-500" />
                                </div>
                            ))}
                            {portfolio.clubs.length === 0 && <p className="text-center text-slate-400 text-sm italic py-4">No activities added yet.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* --- RESUME TAB --- */}
            {activeTab === 'resume' && (
                <div className="animate-fade-in flex flex-col md:flex-row gap-6 h-full">
                    {/* Controls */}
                    <div className="w-full md:w-80 space-y-4">
                        <div className="ios-card p-6 dark:bg-[#1E293B]">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Resume Studio</h2>
                            <p className="text-sm text-slate-500 mb-6">AI will compile your profile into a top-tier professional resume.</p>
                            
                            <button 
                                onClick={handleGenerateResume}
                                disabled={isGeneratingResume}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isGeneratingResume ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileCheck className="w-5 h-5" />}
                                {isGeneratingResume ? 'Drafting...' : 'Generate Resume'}
                            </button>

                            {resumeMarkdown && (
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                    <button onClick={copyToClipboard} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700">
                                        <Copy className="w-4 h-4" /> Copy Markdown
                                    </button>
                                    
                                    <button 
                                        onClick={() => setShowResumeFeedbackInput(!showResumeFeedbackInput)}
                                        className="w-full py-3 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                    >
                                        <RefreshCw className="w-4 h-4" /> Refine / Edit
                                    </button>

                                    {showResumeFeedbackInput && (
                                        <div className="animate-fade-in mt-2">
                                            <textarea 
                                                value={resumeFeedback}
                                                onChange={(e) => setResumeFeedback(e.target.value)}
                                                placeholder="e.g. Make it shorter, focus more on my React skills..."
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm outline-none border border-slate-200 dark:border-slate-700 mb-2"
                                                rows={3}
                                            />
                                            <button 
                                                onClick={handleGenerateResume}
                                                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold"
                                            >
                                                Regenerate
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="flex-1 ios-card p-8 dark:bg-[#1E293B] min-h-[600px] overflow-y-auto border border-slate-200 dark:border-slate-800">
                        {resumeMarkdown ? (
                            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:mb-2 prose-h1:text-3xl prose-h2:border-b prose-h2:pb-2 prose-h2:mt-6">
                                <ReactMarkdown>{resumeMarkdown}</ReactMarkdown>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                <FileCheck className="w-16 h-16 mb-4" />
                                <p className="text-lg font-medium">No resume generated yet.</p>
                                <p className="text-sm">Fill your portfolio and click Generate.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
