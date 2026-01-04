import { useState, useEffect } from 'react';
import { NotebookState, Source, Note, ChatMessage, AudioOverviewState, StudioTaskType } from '../types';
import { generateChatResponse, generatePodcastScript, synthesizePodcastAudio, generateSuggestedQuestions } from '../services/geminiService';

export const useNotebook = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [audioOverview, setAudioOverview] = useState<AudioOverviewState>({ status: 'idle' });
  const [isGeneratingChat, setIsGeneratingChat] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [hasFetchedQuestions, setHasFetchedQuestions] = useState(false);

  // Auto-generate suggested questions when sources change substantially
  useEffect(() => {
    if (sources.length > 0 && !hasFetchedQuestions) {
        generateSuggestedQuestions(sources).then(qs => {
            setSuggestedQuestions(qs);
            setHasFetchedQuestions(true);
        });
    }
  }, [sources, hasFetchedQuestions]);

  const addSource = (name: string, content: string, mimeType: string, data?: string) => {
    const newSource: Source = {
      id: crypto.randomUUID(),
      name,
      content,
      mimeType,
      data,
      type: mimeType === 'text/plain' ? 'text' : 'file',
      dateAdded: Date.now()
    };
    setSources(prev => [...prev, newSource]);
    setHasFetchedQuestions(false); // Reset to fetch new questions
  };

  const removeSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const saveNote = (title: string, content: string, type: 'saved_response' | 'user_note' | 'studio_output' = 'saved_response', tags: StudioTaskType[] = []) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title,
      content,
      type,
      tags,
      dateCreated: Date.now()
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const sendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: Date.now()
    };
    
    setHistory(prev => [...prev, userMsg]);
    setIsGeneratingChat(true);

    try {
      const responseText = await generateChatResponse(sources, history, text);
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setHistory(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
         id: crypto.randomUUID(),
         role: 'model',
         text: "I encountered an error connecting to the Nexus core. Please check your connection or API Key.",
         timestamp: Date.now()
      };
      setHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsGeneratingChat(false);
    }
  };

  const generateAudio = async (language: string = 'English') => {
    if (sources.length === 0) return;
    setAudioOverview({ status: 'generating_script' });

    try {
      const script = await generatePodcastScript(sources, language);
      setAudioOverview({ status: 'synthesizing', script });
      
      const audioBuffer = await synthesizePodcastAudio(script);
      const wavBuffer = addWavHeader(audioBuffer, 24000, 1);
      
      const audioUrl = URL.createObjectURL(new Blob([wavBuffer], { type: 'audio/wav' }));
      setAudioOverview({ status: 'ready', audioUrl, script });
    } catch (e) {
      console.error(e);
      setAudioOverview({ status: 'error', error: 'Failed to generate audio.' });
    }
  };

  return {
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
  };
};

// Helper to add WAV header to raw PCM
function addWavHeader(samples: ArrayBuffer, sampleRate: number, numChannels: number) {
    const buffer = new ArrayBuffer(44 + samples.byteLength);
    const view = new DataView(buffer);
  
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
  
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.byteLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true); // 16-bit
    writeString(36, 'data');
    view.setUint32(40, samples.byteLength, true);
  
    new Uint8Array(buffer, 44).set(new Uint8Array(samples));
  
    return buffer;
}
