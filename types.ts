export interface Source {
  id: string;
  name: string;
  content: string; // Text content or description
  mimeType: string;
  data?: string; // Base64 data for PDFs/images
  type: 'text' | 'file';
  dateAdded: number;
}

export type StudioTaskType = 'audio' | 'video_script' | 'mind_map' | 'report' | 'flashcards' | 'quiz' | 'summary';

export interface Note {
  id: string;
  title: string;
  content: string;
  type: 'saved_response' | 'user_note' | 'studio_output';
  tags?: StudioTaskType[];
  dateCreated: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface AudioOverviewState {
  status: 'idle' | 'generating_script' | 'synthesizing' | 'ready' | 'error';
  audioUrl?: string;
  script?: string;
  error?: string;
}

export interface AppSettings {
  primaryLanguage: string;
  secondaryLanguage: string;
  theme: 'light' | 'dark';
}

export interface NotebookState {
  id: string;
  name: string;
  sources: Source[];
  notes: Note[];
  chatHistory: ChatMessage[];
  audioOverview: AudioOverviewState;
  settings: AppSettings;
}

export type ViewMode = 'chat' | 'studio';
