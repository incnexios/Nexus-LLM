import React, { useState, useEffect } from 'react';
import SourceList from './components/SourceList';
import ChatInterface from './components/ChatInterface';
import Studio from './components/NotesBoard';
import AudioPlayer from './components/AudioPlayer';
import { useNotebook } from './hooks/useNotebook';
import { BookOpen, MessageSquare, Save, Settings, AlertTriangle, Bell, Search, X, Trash } from 'lucide-react';
import { generateStudioContent } from './services/geminiService';
import { StudioTaskType, AppSettings } from './types';

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian",
  "Japanese", "Chinese (Simplified)", "Chinese (Traditional)", "Korean",
  "Hindi", "Arabic", "Turkish", "Indonesian", "Vietnamese", "Thai", 
  "Greek", "Hebrew", "Polish", "Swedish", "Norwegian", "Danish", "Finnish",
  "Hungarian", "Czech", "Romanian", "Ukrainian", "Malay", "Bengali", "Punjabi", 
  "Tamil", "Telugu", "Marathi", "Urdu", "Gujarati", "Kannada", "Malayalam", "Sinhala"
];

export default function App() {
  const { 
    sources, 
    notes, 
    history, 
    audioOverview,
    isGeneratingChat,
    suggestedQuestions,
    addSource, 
    removeSource, 
    saveNote, 
    sendMessage,
    generateAudio
  } = useNotebook();

  const [activeTab, setActiveTab] = useState<'chat' | 'studio'>('chat');
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [isStudioGenerating, setIsStudioGenerating] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
      primaryLanguage: 'English',
      secondaryLanguage: 'Spanish',
      theme: 'light'
  });

  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
    }
  }, []);

  const addNotification = (msg: string) => {
    setNotifications(prev => [msg, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(0, prev.length - 1));
    }, 3000);
  };

  const handleAddSource = (name: string, content: string, mimeType: string, data?: string) => {
    addSource(name, content, mimeType, data);
    addNotification(`Added source: ${name}`);
  };

  const handleGenerateStudio = async (task: StudioTaskType) => {
    if (sources.length === 0) {
      addNotification("Add sources first!");
      return;
    }
    setIsStudioGenerating(true);
    addNotification(`Generating ${task.replace('_', ' ')}...`);
    try {
      const result = await generateStudioContent(sources, task);
      const type = (task === 'quiz' || task === 'flashcards') ? 'studio_output' : 'saved_response';
      // If task is quiz/flashcard, we want to save it with a specific tag for rendering
      saveNote(result.title, result.content, type, [task]);
      addNotification(`${result.title} created!`);
    } catch (e) {
      addNotification("Failed to generate content.");
      console.error(e);
    } finally {
      setIsStudioGenerating(false);
    }
  };

  if (apiKeyMissing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">API Key Missing</h2>
          <p className="text-slate-600 mb-6">
            Nexus LLM requires a valid Google Gemini API Key. 
            Ensure <code>process.env.API_KEY</code> is configured.
          </p>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" className="inline-block px-6 py-3 bg-nexus-600 text-white font-medium rounded-lg hover:bg-nexus-700 transition-colors">
            Get API Key
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
      {/* Notifications Toast */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map((n, i) => (
          <div key={i} className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-in fade-in slide-in-from-bottom-4">
            {n}
          </div>
        ))}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <h2 className="text-lg font-bold text-slate-900">Settings</h2>
                 <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-6 space-y-6">
                 <div>
                     <h3 className="font-medium text-slate-900 mb-4">Preferences</h3>
                     <div className="space-y-4">
                         <div>
                             <label className="block text-sm text-slate-600 mb-1">Primary Language</label>
                             <select 
                                value={settings.primaryLanguage}
                                onChange={(e) => setSettings({...settings, primaryLanguage: e.target.value})}
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-nexus-500"
                             >
                                 {LANGUAGES.map(l => (
                                     <option key={l} value={l}>{l}</option>
                                 ))}
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm text-slate-600 mb-1">Secondary Language</label>
                             <select 
                                value={settings.secondaryLanguage}
                                onChange={(e) => setSettings({...settings, secondaryLanguage: e.target.value})}
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-nexus-500"
                             >
                                 {LANGUAGES.map(l => (
                                     <option key={l} value={l}>{l}</option>
                                 ))}
                             </select>
                         </div>
                     </div>
                 </div>

                 <hr className="border-slate-100"/>
                 
                 <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-slate-900">API Key Status</h3>
                      <p className="text-xs text-green-600">Active</p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm shadow-green-200"></div>
                 </div>
                 
                 <div>
                    <h3 className="font-medium text-slate-900 mb-2">Data Management</h3>
                    <button onClick={() => window.location.reload()} className="w-full py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center justify-center gap-2">
                       <Trash className="w-4 h-4"/> Reset Session
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Sidebar */}
      <SourceList 
        sources={sources} 
        searchQuery={searchQuery}
        onAddSource={handleAddSource} 
        onRemoveSource={removeSource} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white flex-shrink-0 z-20 gap-4">
          <div className="flex items-center gap-2 min-w-fit">
            <div className="w-8 h-8 bg-gradient-to-tr from-nexus-600 to-nexus-400 rounded-lg flex items-center justify-center text-white shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight hidden md:block">Nexus LLM</h1>
          </div>

          <div className="flex-1 max-w-xl mx-4 relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search sources and notes..." 
               className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-nexus-500/30 transition-all"
             />
          </div>

          <div className="flex items-center gap-2">
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'chat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab('studio')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'studio' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Studio</span>
                </button>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
               <Bell className="w-5 h-5" />
               {notifications.length > 0 && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></div>}
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-slate-600">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Audio Player Bar */}
        {sources.length > 0 && (
          <AudioPlayer audioState={audioOverview} onGenerate={generateAudio} />
        )}

        {/* Content Area */}
        <main className="flex-1 relative overflow-hidden">
          {activeTab === 'chat' ? (
            <ChatInterface 
              messages={history} 
              onSendMessage={sendMessage}
              isGenerating={isGeneratingChat}
              sources={sources}
              suggestedQuestions={suggestedQuestions}
            />
          ) : (
            <Studio 
              notes={notes} 
              searchQuery={searchQuery}
              onGenerate={handleGenerateStudio}
              isGenerating={isStudioGenerating}
            />
          )}
        </main>
      </div>
    </div>
  );
}