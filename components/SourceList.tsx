import React, { useState } from 'react';
import { Source } from '../types';
import { Plus, FileText, Trash2, FileUp, File, Search } from 'lucide-react';

interface SourceListProps {
  sources: Source[];
  searchQuery: string;
  onAddSource: (name: string, content: string, mimeType: string, data?: string) => void;
  onRemoveSource: (id: string) => void;
}

const SourceList: React.FC<SourceListProps> = ({ sources, searchQuery, onAddSource, onRemoveSource }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');

  const filteredSources = sources.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        if (file.type === 'application/pdf') {
          // Result is data URL: data:application/pdf;base64,....
          const base64Data = result.split(',')[1];
          onAddSource(file.name, "", file.type, base64Data);
        } else {
          // Text files (and CSV, etc)
          onAddSource(file.name, result, file.type || 'text/plain');
        }
        setIsModalOpen(false);
      };

      if (file.type === 'application/pdf') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  const handlePasteSubmit = () => {
    if (pasteTitle && pasteContent) {
      onAddSource(pasteTitle, pasteContent, 'text/plain');
      setPasteContent('');
      setPasteTitle('');
      setIsModalOpen(false);
    }
  };

  const getIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <File className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 w-80 flex-shrink-0 transition-all duration-300">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-display font-semibold text-slate-800 mb-1">Sources</h2>
        <p className="text-sm text-slate-500">{sources.length} source{sources.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-nexus-500 hover:text-nexus-600 hover:bg-nexus-50 transition-all group"
        >
          <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-nexus-100 transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-medium">Add Source</span>
        </button>

        {filteredSources.map((source) => (
          <div key={source.id} className="group relative flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="mt-1 p-2 bg-nexus-50 text-nexus-600 rounded-lg">
              {getIcon(source.mimeType)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-slate-900 truncate" title={source.name}>{source.name}</h3>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                {source.mimeType.split('/')[1] || 'Text'}
              </p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onRemoveSource(source.id); }}
              className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {sources.length === 0 && (
          <div className="text-center p-6 text-slate-400 text-sm">
            <p>No sources added yet.</p>
            <p className="mt-1">Upload PDF, TXT, CSV, or MD files.</p>
          </div>
        )}
      </div>

      {/* Add Source Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => setTab('upload')}
                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${tab === 'upload' ? 'border-nexus-600 text-nexus-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Upload File
              </button>
              <button 
                onClick={() => setTab('paste')}
                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${tab === 'paste' ? 'border-nexus-600 text-nexus-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Paste Text
              </button>
            </div>
            
            <div className="p-6">
              {tab === 'upload' ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-nexus-50 text-nexus-500 rounded-full flex items-center justify-center mb-4">
                    <FileUp className="w-8 h-8" />
                  </div>
                  <p className="text-slate-900 font-medium mb-1">Upload a document</p>
                  <p className="text-slate-500 text-sm mb-6">Supports PDF, TXT, MD, CSV, JSON</p>
                  <label className="inline-flex items-center justify-center px-6 py-2.5 bg-nexus-600 text-white font-medium rounded-lg hover:bg-nexus-700 transition-colors cursor-pointer shadow-sm hover:shadow active:scale-95">
                    <span>Choose File</span>
                    <input type="file" accept=".txt,.md,.pdf,.csv,.json,.xml" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 uppercase tracking-wide mb-1">Title</label>
                    <input 
                      type="text" 
                      value={pasteTitle}
                      onChange={(e) => setPasteTitle(e.target.value)}
                      placeholder="e.g., Meeting Notes"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 uppercase tracking-wide mb-1">Content</label>
                    <textarea 
                      value={pasteContent}
                      onChange={(e) => setPasteContent(e.target.value)}
                      placeholder="Paste your text here..."
                      className="w-full h-48 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-500/50 resize-none"
                    />
                  </div>
                  <button 
                    onClick={handlePasteSubmit}
                    disabled={!pasteTitle || !pasteContent}
                    className="w-full py-2.5 bg-nexus-600 text-white font-medium rounded-lg hover:bg-nexus-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Add Source
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 px-6 py-3 flex justify-end">
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-800 text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceList;
