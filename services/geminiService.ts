import { GoogleGenAI, Modality, Part } from "@google/genai";
import { Source, ChatMessage, StudioTaskType } from "../types";

const API_KEY = process.env.API_KEY || '';

const getAI = () => new GoogleGenAI({ apiKey: API_KEY });

// Helper to convert source list to API Content Parts
const getSourceParts = (sources: Source[]): Part[] => {
  return sources.map(s => {
    if (s.mimeType === 'application/pdf' && s.data) {
      return {
        inlineData: {
          mimeType: 'application/pdf',
          data: s.data
        }
      };
    } else {
      return {
        text: `--- SOURCE: ${s.name} ---\n${s.content}\n--- END SOURCE ---`
      };
    }
  });
};

const SYSTEM_INSTRUCTION = `Nexus LLM functions as a source-grounded notebook.
Core Rules:
- Sources are authoritative.
- No hallucination.
- Academic but accessible tone.
- If asking for structured output (JSON), output ONLY JSON.`;

/**
 * Generates a chat response based on the provided sources and chat history.
 */
export const generateChatResponse = async (
  sources: Source[],
  history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  const ai = getAI();
  const sourceParts = getSourceParts(sources);

  // Priming turn to load sources into context (Contents, not System Instruction for PDF stability)
  const contents = [
    {
      role: 'user',
      parts: [
        { text: "System: Here are the sources for this session. Use them to answer all future questions." },
        ...sourceParts
      ]
    },
    {
      role: 'model',
      parts: [{ text: "Understood. I have processed the sources." }]
    },
    ...history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    })),
    {
      role: 'user',
      parts: [{ text: newMessage }]
    }
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  return response.text || "I couldn't generate a response based on these sources.";
};

/**
 * Generates specific studio content (FAQ, Study Guide, etc.)
 */
export const generateStudioContent = async (sources: Source[], task: StudioTaskType): Promise<{ title: string, content: string }> => {
    const ai = getAI();
    const sourceParts = getSourceParts(sources);
    
    // Construct priming context
    const contextParts = [
       { text: "System: Use the following sources." },
       ...sourceParts
    ];

    let prompt = "";
    let title = "";
    let isJson = false;

    switch (task) {
        case 'summary':
            prompt = "Create a comprehensive summary of the provided sources. Use headings and bullet points.";
            title = "Briefing Document";
            break;
        case 'flashcards':
            prompt = `Create 10 flashcards based on key concepts. 
            Return STRICT JSON array: [{"front": "Question/Term", "back": "Answer/Definition"}]`;
            title = "Flashcards";
            isJson = true;
            break;
        case 'quiz':
            prompt = `Create a quiz with 5 multiple choice questions.
            Return STRICT JSON array: [{"question": "...", "options": ["A", "B", "C", "D"], "answer": "The correct option text"}]`;
            title = "Practice Quiz";
            isJson = true;
            break;
        case 'mind_map':
            prompt = "Generate a text-based Mind Map using hierarchical bullet points to show relationships between concepts.";
            title = "Mind Map";
            break;
        case 'video_script':
            prompt = "Write a structured educational video script. Include 'Intro', 'Key Points', and 'Conclusion'.";
            title = "Video Script";
            break;
        case 'report':
            prompt = "Write a formal report with Introduction, Body, and Conclusion.";
            title = "Formal Report";
            break;
        default:
            prompt = "Summarize the key insights.";
            title = "Summary";
    }

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            { role: 'user', parts: contextParts },
            { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
            responseMimeType: isJson ? 'application/json' : 'text/plain'
        }
    });

    return {
        title,
        content: response.text || (isJson ? "[]" : "Failed to generate content.")
    };
}

/**
 * Generates a podcast script based on the sources.
 */
export const generatePodcastScript = async (sources: Source[], language: string = 'English'): Promise<string> => {
  const ai = getAI();
  const sourceParts = getSourceParts(sources);

  const prompt = `Based on the provided sources, generate a lively podcast dialogue between "Alex" and "Sam".
  Language: ${language}.
  Format EXACTLY as:
  Alex: [Line]
  Sam: [Line]
  ...
  Keep it under 5 minutes.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      { role: 'user', parts: [{ text: "Sources:" }, ...sourceParts] },
      { role: 'user', parts: [{ text: prompt }] }
    ]
  });

  return response.text || "";
};

/**
 * Synthesizes audio from a podcast script.
 */
export const synthesizePodcastAudio = async (script: string): Promise<ArrayBuffer> => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: script }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            { speaker: 'Alex', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            { speaker: 'Sam', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
          ]
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data generated");

  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Generates specific notes or suggested questions.
 */
export const generateSuggestedQuestions = async (sources: Source[]): Promise<string[]> => {
    const ai = getAI();
    const sourceParts = getSourceParts(sources);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: "Sources:" }, ...sourceParts] },
        { role: 'user', parts: [{ text: "Generate 3 thought-provoking questions. Return ONLY a JSON array of strings." }] }
      ],
      config: { responseMimeType: 'application/json' }
    });

    try {
        const text = response.text || "[]";
        return JSON.parse(text);
    } catch (e) {
        return ["What is the main summary?", "What are the key arguments?", "Who is the intended audience?"];
    }
}
