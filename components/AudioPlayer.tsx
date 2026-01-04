import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Loader2, Headphones, FileText, Globe } from 'lucide-react';
import { AudioOverviewState } from '../types';

interface AudioPlayerProps {
  audioState: AudioOverviewState;
  onGenerate: (language: string) => void;
}

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian",
  "Japanese", "Chinese (Simplified)", "Chinese (Traditional)", "Korean",
  "Hindi", "Arabic", "Turkish", "Indonesian", "Vietnamese", "Thai", 
  "Greek", "Hebrew", "Polish", "Swedish", "Norwegian", "Danish", "Finnish",
  "Hungarian", "Czech", "Romanian", "Ukrainian", "Malay", "Bengali", "Punjabi", 
  "Tamil", "Telugu", "Marathi", "Urdu", "Gujarati", "Kannada", "Malayalam", "Sinhala"
];

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioState, onGenerate }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showScript, setShowScript] = useState(false);
  const [language, setLanguage] = useState('English');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioState.audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleScriptClick = (index: number, totalLines: number) => {
    // Rough estimate seek since we lack timestamps
    if (audioRef.current && audioRef.current.duration) {
       const estimatedTime = (index / totalLines) * audioRef.current.duration;
       audioRef.current.currentTime = estimatedTime;
       audioRef.current.play();
       setIsPlaying(true);
    }
  };

  if (audioState.status === 'idle') {
    return (
      <div className="border-b border-slate-100 p-4 bg-white flex items-center justify-between relative z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900 text-sm">Audio Overview</h3>
            <p className="text-xs text-slate-400">Deep dive into your sources</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-100 min-w-[100px] justify-between"
                >
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="w-4 h-4 shrink-0" />
                      <span className="truncate">{language}</span>
                    </div>
                </button>
                {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 max-h-64 overflow-y-auto bg-white border border-slate-100 shadow-lg rounded-xl py-1 z-50">
                        {LANGUAGES.map(l => (
                            <button 
                              key={l}
                              onClick={() => { setLanguage(l); setIsMenuOpen(false); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-nexus-50 hover:text-nexus-700"
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <button 
              onClick={() => onGenerate(language)}
              className="px-4 py-2 bg-nexus-600 text-white text-sm font-medium rounded-lg hover:bg-nexus-700 transition-colors shadow-sm"
            >
              Generate
            </button>
        </div>
      </div>
    );
  }

  if (audioState.status === 'generating_script' || audioState.status === 'synthesizing') {
    return (
      <div className="border-b border-slate-100 p-4 bg-white flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-nexus-50 flex items-center justify-center text-nexus-600">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 text-sm">
                {audioState.status === 'generating_script' ? 'Writing script...' : 'Synthesizing audio...'}
              </h3>
              <p className="text-xs text-slate-400">This may take a moment</p>
            </div>
          </div>
      </div>
    );
  }

  if (audioState.status === 'ready' && audioState.audioUrl) {
    const scriptLines = audioState.script ? audioState.script.split('\n').filter(l => l.trim().length > 0) : [];

    return (
      <div className="border-b border-slate-100 bg-white relative">
        <div className="p-4 flex items-center gap-4">
          <button 
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-nexus-600 hover:bg-nexus-700 text-white flex items-center justify-center transition-colors shadow-sm flex-shrink-0"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1">
               <span className="text-xs font-medium text-slate-900">Audio Overview ({language})</span>
               <span className="text-xs text-slate-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden cursor-pointer" onClick={(e) => {
                if (audioRef.current) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const p = x / rect.width;
                    audioRef.current.currentTime = p * audioRef.current.duration;
                }
            }}>
              <div 
                className="bg-nexus-500 h-full rounded-full transition-all duration-100" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <button 
            onClick={() => setShowScript(!showScript)}
            className={`p-2 rounded-lg transition-colors ${showScript ? 'bg-nexus-100 text-nexus-600' : 'hover:bg-slate-100 text-slate-500'}`}
            title="View Script"
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>
        
        {/* Script Viewer */}
        {showScript && (
            <div className="border-t border-slate-100 max-h-60 overflow-y-auto p-4 bg-slate-50/50 space-y-3">
                {scriptLines.map((line, i) => (
                    <div 
                        key={i} 
                        onClick={() => handleScriptClick(i, scriptLines.length)}
                        className="text-sm text-slate-600 hover:text-nexus-700 hover:bg-white p-2 rounded cursor-pointer transition-colors"
                    >
                        {line}
                    </div>
                ))}
            </div>
        )}
        
        <audio ref={audioRef} src={audioState.audioUrl} className="hidden" />
      </div>
    );
  }
  
  return null;
};

export default AudioPlayer;