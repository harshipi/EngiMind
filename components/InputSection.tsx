
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Image as ImageIcon, FileBox, X, Loader2, Plus, Layers, File, PlayCircle, Youtube, Link as LinkIcon, DownloadCloud } from 'lucide-react';
import { FileInput, InputType } from '../types';

interface InputSectionProps {
  onGenerate: (type: InputType, content: string | any[]) => void;
  isProcessing: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, isProcessing }) => {
  const [activeTab, setActiveTab] = useState<InputType>('text');
  const [textInput, setTextInput] = useState('');
  const [files, setFiles] = useState<FileInput[]>([]);
  const [videoLinks, setVideoLinks] = useState<{id: string, url: string}[]>([]);
  const [youtubeInput, setYoutubeInput] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const processFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("File size exceeds 20MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const base64Data = result.split(',')[1];
      
      setFiles(prev => [...prev, {
          id: crypto.randomUUID(),
          file,
          previewUrl: file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : '',
          base64: base64Data,
          mimeType: file.type
      }]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    newFiles.forEach(processFile);
    if (fileRef.current) fileRef.current.value = ''; 
    setUploadError(null);
  };

  const removeFile = (id: string) => {
      setFiles(prev => prev.filter(f => f.id !== id));
  };

  const addYoutubeLink = () => {
      if (!youtubeInput.trim()) return;
      setVideoLinks(prev => [...prev, { id: crypto.randomUUID(), url: youtubeInput }]);
      setYoutubeInput('');
  };

  const removeVideoLink = (id: string) => {
      setVideoLinks(prev => prev.filter(v => v.id !== id));
  };

  const handleTabChange = (tab: InputType) => {
      setActiveTab(tab);
      setFiles([]);
      setVideoLinks([]);
      setTextInput('');
      setUploadError(null);
  }

  const handleSubmit = () => {
    if (activeTab === 'text' && textInput.trim()) {
      onGenerate('text', textInput);
    } else if (files.length > 0 || videoLinks.length > 0) {
      const parts: any[] = files.map(f => ({
          inlineData: { mimeType: f.mimeType, data: f.base64 }
      }));
      
      if (videoLinks.length > 0) {
          const linksContext = videoLinks.map(v => `Include this YouTube video in analysis: ${v.url}`).join('\n');
          parts.push({ text: linksContext });
      }

      onGenerate(activeTab, parts);
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
          if (activeTab !== 'files') setActiveTab('files');
          droppedFiles.forEach(processFile);
          setUploadError(null);
      }
  };

  const getYoutubeId = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  };

  const totalItems = files.length + videoLinks.length;
  const isDisabled = isProcessing || (activeTab === 'text' && !textInput.trim()) || (activeTab !== 'text' && totalItems === 0);

  return (
    <div className={`transition-all duration-1000 ease-out transform ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="max-w-[1100px] mx-auto mt-20 px-8 lg:px-12">
        <div className="text-center mb-16">
            <div className="inline-block mb-6 relative">
                 <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 animate-slide-up" style={{animationDelay: '100ms'}}>
                  EngiMind
                </h1>
                <div className="absolute -inset-1 blur-2xl bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 opacity-20 -z-10 rounded-full"></div>
            </div>
           
            <p className="text-2xl md:text-3xl text-slate-500 dark:text-slate-400 font-normal max-w-3xl mx-auto leading-normal animate-slide-up" style={{animationDelay: '200ms'}}>
              Engineering Intelligence. <br className="hidden md:block"/> Defined.
            </p>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-orange-500/10 dark:shadow-none rounded-[32px] overflow-hidden transition-all duration-500 hover:shadow-3xl animate-scale-in" style={{animationDelay: '300ms'}}>
          {/* Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md">
            {[
              { id: 'text', label: 'Paste Text', icon: FileText },
              { id: 'files', label: 'Upload Files & Links', icon: FileBox },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as InputType)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-6 text-sm font-semibold tracking-wide transition-all duration-300 overflow-hidden group ${
                  activeTab === tab.id 
                    ? 'text-orange-600 bg-white dark:bg-[#1C1C1E]' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800'
                }`}
              >
                {activeTab === tab.id && (
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-pink-500 to-orange-500 animate-width-expand" />
                )}
                <tab.icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="">{tab.label}</span>
              </button>
            ))}
          </div>

          <div 
            className={`p-10 min-h-[360px] flex flex-col justify-center relative transition-colors duration-300 ${
                activeTab === 'files' && isDragging 
                ? 'bg-indigo-50 dark:bg-indigo-900/10' 
                : 'bg-white dark:bg-[#1C1C1E]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
             {/* Drag Overlay */}
             {isDragging && activeTab === 'files' && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center bg-indigo-500/10 backdrop-blur-sm border-4 border-dashed border-indigo-500 rounded-[30px] m-2">
                     <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl shadow-xl flex flex-col items-center animate-scale-in">
                         <DownloadCloud className="w-12 h-12 text-indigo-600 mb-2" />
                         <span className="text-lg font-bold text-indigo-600">Drop files to upload</span>
                     </div>
                 </div>
             )}

             {/* Content Area */}
            <div key={activeTab} className="animate-fade-in w-full h-full">
                {activeTab === 'text' ? (
                <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste lecture notes, syllabus topics, or complex questions here..."
                    className="w-full h-64 p-2 text-xl md:text-2xl font-light text-slate-800 dark:text-slate-200 placeholder-slate-300 border-none outline-none resize-none bg-transparent focus:ring-0 leading-relaxed"
                    autoFocus
                />
                ) : (
                <div className="space-y-6">
                    {/* YouTube Input Row */}
                    <div className="flex gap-3">
                        <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center px-4 border border-transparent focus-within:border-indigo-500 transition-colors">
                            <Youtube className="w-5 h-5 text-red-500 mr-3" />
                            <input 
                                value={youtubeInput}
                                onChange={(e) => setYoutubeInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addYoutubeLink()}
                                placeholder="Paste YouTube video URL here..."
                                className="flex-1 py-3 bg-transparent outline-none text-slate-900 dark:text-white text-sm"
                            />
                        </div>
                        <button 
                            onClick={addYoutubeLink}
                            disabled={!youtubeInput.trim()}
                            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            Add URL
                        </button>
                    </div>

                    {/* Content Grid */}
                    {totalItems > 0 && (
                        <div className="space-y-3">
                             <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                                <span>Selected Resources ({totalItems})</span>
                                <button onClick={() => { setFiles([]); setVideoLinks([]); }} className="text-red-500 hover:text-red-600">Clear All</button>
                             </div>
                             
                             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {/* Video Links */}
                                {videoLinks.map(v => {
                                    const vidId = getYoutubeId(v.url);
                                    const thumbnail = vidId ? `https://img.youtube.com/vi/${vidId}/0.jpg` : null;
                                    
                                    return (
                                        <div key={v.id} className="relative group aspect-video md:aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col">
                                            {thumbnail ? (
                                                <div className="relative h-full">
                                                    <img src={thumbnail} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                        <Youtube className="w-8 h-8 text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
                                                    <LinkIcon className="w-8 h-8 text-blue-500 mb-2" />
                                                    <span className="text-[10px] text-slate-500 break-all px-2 line-clamp-2">{v.url}</span>
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => removeVideoLink(v.id)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )
                                })}

                                {/* Files */}
                                {files.map(f => (
                                    <div key={f.id} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                                        {f.mimeType.startsWith('image/') ? (
                                            <img src={f.previewUrl} className="w-full h-full object-cover" />
                                        ) : f.mimeType.startsWith('video/') ? (
                                            <>
                                                <video src={f.previewUrl} className="w-full h-full object-cover opacity-60" />
                                                <PlayCircle className="absolute w-8 h-8 text-white" />
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center p-2 text-center">
                                                <File className="w-8 h-8 text-red-500 mb-2" />
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate w-full px-2">{f.file.name}</span>
                                                <span className="text-[10px] text-slate-400">{(f.file.size / 1024 / 1024).toFixed(1)} MB</span>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => removeFile(f.id)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {/* Add More Button (Small) */}
                                <div 
                                    onClick={() => fileRef.current?.click()}
                                    className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all text-slate-400 hover:text-orange-500"
                                >
                                    <Plus className="w-6 h-6 mb-1" />
                                    <span className="text-[10px] font-bold uppercase">Upload</span>
                                </div>
                             </div>
                        </div>
                    )}

                    {/* Empty State / Dropzone */}
                    {totalItems === 0 && (
                        <div 
                            onClick={() => fileRef.current?.click()}
                            className="w-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group"
                        >
                             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                             </div>
                             <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Drag & Drop or Click to Upload</p>
                             <div className="flex gap-4 mt-3 text-sm text-slate-400">
                                <span className="flex items-center gap-1"><ImageIcon className="w-4 h-4"/> Images</span>
                                <span className="flex items-center gap-1"><PlayCircle className="w-4 h-4"/> Videos</span>
                                <span className="flex items-center gap-1"><FileText className="w-4 h-4"/> PDFs</span>
                             </div>
                        </div>
                    )}
                    
                    <input
                        type="file"
                        ref={fileRef}
                        multiple
                        accept="image/*,video/mp4,video/webm,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                     {uploadError && <p className="text-red-500 text-center font-medium animate-pulse">{uploadError}</p>}
                </div>
                )}
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-[#151517] border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:block">
                {activeTab === 'text' ? 'AI Text Analysis' : `Ready to analyze ${totalItems} items`}
             </div>
            <button
              onClick={handleSubmit}
              disabled={isDisabled}
              className={`flex items-center gap-3 px-10 py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 rounded-2xl ${
                isDisabled 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' 
                  : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-orange-500/30'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {totalItems > 0 ? 'Analyze Materials' : 'Generate Notes'}
                  <Layers className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
