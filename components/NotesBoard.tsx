import React, { useState } from 'react';
import { Note, StudioTaskType } from '../types';
import { Bookmark, Clock, Brain, FileText, Video, List, FileQuestion, Copy, X, Check, ArrowRight, ArrowLeft, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface StudioProps {
  notes: Note[];
  searchQuery: string;
  onGenerate: (task: StudioTaskType) => void;
  isGenerating: boolean;
}

// --- Interactive Components ---

const FlashcardViewer: React.FC<{ content: string }> = ({ content }) => {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  let cards = [];
  try {
    cards = JSON.parse(content);
  } catch (e) {
    return <div className="text-red-500 text-sm">Error loading flashcards.</div>;
  }

  if (!cards.length) return <div className="text-slate-400 text-sm">No flashcards generated.</div>;

  const current = cards[index];

  return (
    <div className="flex flex-col items-center w-full">
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full h-48 bg-nexus-50 border border-nexus-100 rounded-xl flex items-center justify-center p-6 text-center cursor-pointer hover:shadow-md transition-all perspective-1000 relative"
      >
        <p className="font-medium text-slate-800 text-lg select-none">
          {isFlipped ? current.back : current.front}
        </p>
        <span className="absolute bottom-3 text-[10px] text-slate-400 uppercase tracking-widest">
          {isFlipped ? 'Answer' : 'Question'}
        </span>
      </div>
      <div className="flex items-center gap-4 mt-4">
        <button 
          onClick={(e) => { e.stopPropagation(); setIndex(Math.max(0, index - 1)); setIsFlipped(false); }}
          disabled={index === 0}
          className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-slate-600">{index + 1} / {cards.length}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); setIndex(Math.min(cards.length - 1, index + 1)); setIsFlipped(false); }}
          disabled={index === cards.length - 1}
          className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const QuizViewer: React.FC<{ content: string }> = ({ content }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  
  let questions = [];
  try {
    questions = JSON.parse(content);
  } catch (e) {
    return <div className="text-red-500 text-sm">Error loading quiz.</div>;
  }

  if (!questions.length) return <div className="text-slate-400 text-sm">No questions generated.</div>;

  const handleSelect = (qIndex: number, option: string) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const score = questions.filter((q: any, i: number) => answers[i] === q.answer).length;

  return (
    <div className="space-y-6 w-full">
      {questions.map((q: any, i: number) => (
        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
           <p className="font-medium text-slate-900 mb-3">{i + 1}. {q.question}</p>
           <div className="space-y-2">
             {q.options.map((opt: string) => {
               const isSelected = answers[i] === opt;
               const isCorrect = showResults && opt === q.answer;
               const isWrong = showResults && isSelected && opt !== q.answer;
               
               let baseClass = "w-full text-left p-3 rounded-lg text-sm transition-all border ";
               if (showResults) {
                 if (isCorrect) baseClass += "bg-green-100 border-green-200 text-green-800";
                 else if (isWrong) baseClass += "bg-red-100 border-red-200 text-red-800";
                 else baseClass += "bg-white border-slate-200 opacity-60";
               } else {
                 if (isSelected) baseClass += "bg-nexus-100 border-nexus-300 text-nexus-800";
                 else baseClass += "bg-white border-slate-200 hover:border-nexus-200";
               }

               return (
                 <button 
                  key={opt}
                  onClick={() => handleSelect(i, opt)}
                  className={baseClass}
                 >
                   {opt}
                 </button>
               )
             })}
           </div>
        </div>
      ))}
      
      {!showResults ? (
        <button 
          onClick={() => setShowResults(true)}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full py-3 bg-nexus-600 text-white font-bold rounded-xl hover:bg-nexus-700 disabled:opacity-50 transition-colors"
        >
          Check Answers
        </button>
      ) : (
        <div className="p-4 bg-nexus-50 rounded-xl text-center border border-nexus-100">
           <p className="text-nexus-800 font-bold text-lg">You scored {score} / {questions.length}</p>
           <button onClick={() => { setShowResults(false); setAnswers({}); }} className="mt-2 text-sm text-nexus-600 hover:underline">Reset Quiz</button>
        </div>
      )}
    </div>
  );
};

// --- Main Board ---

const Studio: React.FC<StudioProps> = ({ notes, searchQuery, onGenerate, isGenerating }) => {
  const [expandedNote, setExpandedNote] = useState<Note | null>(null);
  
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tools: { id: StudioTaskType, label: string, icon: React.ReactNode, desc: string }[] = [
    { id: 'summary', label: 'Briefing Doc', icon: <FileText className="w-5 h-5" />, desc: 'Key themes' },
    { id: 'video_script', label: 'Video Script', icon: <Video className="w-5 h-5" />, desc: 'Edu-style script' },
    { id: 'mind_map', label: 'Mind Map', icon: <Brain className="w-5 h-5" />, desc: 'Concept map' },
    { id: 'report', label: 'Report', icon: <List className="w-5 h-5" />, desc: 'Formal academic' },
    { id: 'flashcards', label: 'Flashcards', icon: <Copy className="w-5 h-5" />, desc: 'Interactive deck' },
    { id: 'quiz', label: 'Quiz', icon: <FileQuestion className="w-5 h-5" />, desc: 'Interactive test' },
  ];

  const renderContent = (note: Note, isPreview = false) => {
    // Check tags for special rendering
    if (note.tags?.includes('flashcards') || note.title.toLowerCase().includes('flashcards')) {
      return isPreview 
        ? <div className="text-slate-500 italic text-sm">Interactive Flashcard Deck</div> 
        : <FlashcardViewer content={note.content} />;
    }
    if (note.tags?.includes('quiz') || note.title.toLowerCase().includes('quiz')) {
      return isPreview
        ? <div className="text-slate-500 italic text-sm">Interactive Quiz</div>
        : <QuizViewer content={note.content} />;
    }
    
    // Default Markdown with Math Support
    return (
      <div className={`prose prose-sm prose-slate max-w-none ${isPreview ? 'line-clamp-6' : ''}`}>
        <ReactMarkdown 
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {note.content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto h-full">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Creation Tools */}
        <div>
          <h2 className="text-xl font-display font-bold text-slate-800 mb-4 px-2">Create</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => onGenerate(tool.id)}
                disabled={isGenerating}
                className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl hover:border-nexus-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-center"
              >
                <div className="w-12 h-12 bg-nexus-50 text-nexus-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-nexus-100 transition-colors">
                  {tool.icon}
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{tool.label}</h3>
                <p className="text-xs text-slate-500 leading-tight">{tool.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Saved Content */}
        <div>
          <h2 className="text-xl font-display font-bold text-slate-800 mb-4 px-2">Saved Content ({notes.length})</h2>
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
               <Bookmark className="w-12 h-12 text-slate-300 mb-4" />
               <h3 className="text-lg font-medium text-slate-900">Your studio is empty</h3>
               <p className="text-slate-500 mt-2">Generate content to fill your studio.</p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 gap-6 space-y-6">
              {filteredNotes.map((note) => (
                <div key={note.id} className="break-inside-avoid bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <div className="p-2 bg-nexus-50 text-nexus-600 rounded-lg">
                          {note.title.toLowerCase().includes('quiz') ? <FileQuestion className="w-4 h-4" /> : 
                           note.title.toLowerCase().includes('flashcard') ? <Copy className="w-4 h-4" /> : 
                           <Bookmark className="w-4 h-4" />}
                       </div>
                       <span className="text-xs font-bold uppercase tracking-wider text-nexus-600 bg-nexus-50 px-2 py-1 rounded-md">
                         {note.type === 'studio_output' ? 'Studio' : 'Note'}
                       </span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(note.dateCreated).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-3 leading-tight">{note.title}</h3>
                  
                  <div className="max-h-60 overflow-hidden relative">
                    {renderContent(note, true)}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                    <button 
                      onClick={() => setExpandedNote(note)}
                      className="flex items-center gap-2 text-sm font-medium text-nexus-600 hover:text-nexus-800"
                    >
                      <Maximize2 className="w-4 h-4" /> Expand
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expand Modal */}
      {expandedNote && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{expandedNote.title}</h2>
                <p className="text-sm text-slate-500 mt-1">{new Date(expandedNote.dateCreated).toLocaleString()}</p>
              </div>
              <button onClick={() => setExpandedNote(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
               {renderContent(expandedNote, false)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Studio;