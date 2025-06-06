import { useState, useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Particle background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <header className="relative z-10 bg-black/20 backdrop-blur-sm h-16 flex justify-between items-center border-b border-white/10 shadow-lg px-4">
        <h2 className="text-xl font-semibold text-white">Story Voice Converter</h2>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-4 pb-96">
        <div className="w-full max-w-4xl mx-auto">
          <VoiceConverter />
        </div>
      </main>
      <Toaster theme="dark" />
    </div>
  );
}

function VoiceConverter() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [speechRate, setSpeechRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exportFormat, setExportFormat] = useState("wav");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [virtualCableEnabled, setVirtualCableEnabled] = useState(false);
  const [showVirtualCableWarning, setShowVirtualCableWarning] = useState(false);
  const [exportStartTime, setExportStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [initialPrompt, setInitialPrompt] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLengthening, setIsLengthening] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      // Filter for English and Chinese voices
      const filteredVoices = availableVoices.filter(voice => 
        voice.lang.startsWith('en') || 
        voice.lang.startsWith('zh') ||
        voice.lang.startsWith('cmn')
      );
      setVoices(filteredVoices);
      
      // Set default voice if none selected
      if (!selectedVoice && filteredVoices.length > 0) {
        setSelectedVoice(filteredVoices[0].name);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [selectedVoice]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const getTextToSpeak = () => {
    let textToSpeak = "";
    if (title.trim()) {
      textToSpeak += title.trim() + ". ";
    }
    textToSpeak += content.trim();
    return textToSpeak;
  };

  // Calculate estimated time based on word count and speech rate
  const calculateEstimatedTime = () => {
    const textToSpeak = getTextToSpeak();
    const wordCount = textToSpeak.split(/\s+/).filter(word => word.length > 0).length;
    // Average reading speed is about 150-200 words per minute
    // Speech synthesis is typically slower, around 120-180 WPM depending on rate
    const baseWPM = 140; // Base words per minute
    const adjustedWPM = baseWPM * speechRate; // Adjust for speech rate
    const estimatedMinutes = wordCount / adjustedWPM;
    const estimatedSeconds = Math.ceil(estimatedMinutes * 60);
    return estimatedSeconds;
  };

  // Start the export timer
  const startExportTimer = () => {
    const startTime = Date.now();
    setExportStartTime(startTime);
    setElapsedTime(0);
    setEstimatedTime(calculateEstimatedTime());
    
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
  };

  // Stop the export timer
  const stopExportTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setExportStartTime(null);
    setElapsedTime(0);
    setEstimatedTime(0);
  };

  // Play completion chime
  const playCompletionChime = () => {
    // Create a pleasant completion chime using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a sequence of pleasant tones
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
      oscillator.type = 'sine';
      
      const startTime = audioContext.currentTime + (index * 0.2);
      const duration = 0.3;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  };

  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePreview = () => {
    const textToSpeak = getTextToSpeak();
    
    if (!textToSpeak) {
      toast.error("Please enter some content to convert to speech");
      return;
    }

    if (!selectedVoice) {
      toast.error("Please select a voice");
      return;
    }

    // Stop any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voice = voices.find(v => v.name === selectedVoice);
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = speechRate;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsPlaying(true);
      toast.success("Preview playing...");
    };

    utterance.onend = () => {
      setIsPlaying(false);
      toast.success("Preview completed");
    };

    utterance.onerror = (event) => {
      setIsPlaying(false);
      toast.error(`Speech synthesis error: ${event.error}`);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    toast.info("Playback stopped");
  };

  // Create a WAV file from audio buffer
  const createWavFile = (audioBuffer: AudioBuffer): Blob => {
    const length = audioBuffer.length;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const handleExportWithVirtualCable = async () => {
    const textToSpeak = getTextToSpeak();
    
    if (!textToSpeak) {
      toast.error("Please enter some content to convert to speech");
      return;
    }

    if (!selectedVoice) {
      toast.error("Please select a voice");
      return;
    }

    setIsExporting(true);
    startExportTimer();
    toast.info("Recording with Virtual Cable...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        let finalBlob = audioBlob;
        let fileExtension = 'webm';
        
        if (exportFormat === 'wav') {
          try {
            const audioContext = new AudioContext();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            finalBlob = createWavFile(audioBuffer);
            fileExtension = 'wav';
            await audioContext.close();
          } catch (error) {
            console.warn("Could not convert to WAV:", error);
          }
        }
        
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);
        
        const fileName = title.trim() 
          ? `${title.trim()}_${new Date().toISOString().split('T')[0]}.${fileExtension}`
          : `story_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        stream.getTracks().forEach(track => track.stop());
        stopExportTimer();
        setIsExporting(false);
        playCompletionChime();
        toast.success(`High-quality audio exported as ${fileExtension.toUpperCase()}!`);
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;

      await new Promise(resolve => setTimeout(resolve, 500));

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voice = voices.find(v => v.name === selectedVoice);
      
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.rate = speechRate;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        toast.success("Recording perfect quality audio with Virtual Cable...");
      };

      utterance.onend = () => {
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }, 1000);
      };

      utterance.onerror = (event) => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        stream.getTracks().forEach(track => track.stop());
        stopExportTimer();
        setIsExporting(false);
        toast.error(`Export failed: ${event.error}`);
      };

      speechSynthesis.speak(utterance);

    } catch (error) {
      stopExportTimer();
      setIsExporting(false);
      console.error("Virtual Cable capture error:", error);
      
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast.error("Microphone access denied. Please allow microphone access to record audio.");
      } else {
        toast.error("Failed to start recording. Please check your Virtual Cable setup.");
      }
    }
  };

  const handleExportClick = () => {
    const textToSpeak = getTextToSpeak();
    
    if (!textToSpeak) {
      toast.error("Please enter some content to convert to speech");
      return;
    }

    if (!selectedVoice) {
      toast.error("Please select a voice");
      return;
    }

    setShowVirtualCableWarning(true);
  };

  const handleVirtualCableConfirmed = () => {
    setVirtualCableEnabled(true);
    setShowVirtualCableWarning(false);
    handleExportWithVirtualCable();
  };

  // Copy text to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  // Generate story using Silicon Flow API
  const handleGenerateStory = async () => {
    if (!initialPrompt.trim()) {
      toast.error("Please enter an initial prompt to generate a story");
      return;
    }

    setIsGenerating(true);
    toast.info("Generating story with AI...");

    try {
      // Configuration
      const API_KEY = 'sk-e0819703cff243a1881edad705d82ac2';
      const API_URL = 'https://api.deepseek.com/v1/chat/completions';
      const MODEL_NAME = 'deepseek-reasoner';

      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            {
              role: "user",
              content: initialPrompt
            }
          ],
          stream: false,
          max_tokens: 4096, // Increased for longer stories
          temperature: 0.7
        })
      };

      const response = await fetch(API_URL, options);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const generatedContent = data.choices?.[0]?.message?.content;

      if (!generatedContent) {
        throw new Error("No content received from API");
      }

      // Parse the response to extract the four sections
      const parseStoryResponse = (content: string) => {
        const sections = {
          title: "",
          story: "",
          imagePrompt: "",
          shortDescription: ""
        };

        // Split by numbered sections and extract content
        const titleMatch = content.match(/1\.\s*\*\*TITLE:\*\*\s*(.*?)(?=\n|$)/i);
        const storyMatch = content.match(/2\.\s*\*\*STORY:\*\*\s*([\s\S]*?)(?=3\.\s*\*\*IMAGE|$)/i);
        const imageMatch = content.match(/3\.\s*\*\*IMAGE GENERATION PROMPT:\*\*\s*([\s\S]*?)(?=4\.\s*\*\*SHORT|$)/i);
        const descMatch = content.match(/4\.\s*\*\*SHORT DESCRIPTION:\*\*\s*([\s\S]*?)$/i);

        if (titleMatch) sections.title = titleMatch[1].trim();
        if (storyMatch) sections.story = storyMatch[1].trim();
        if (imageMatch) sections.imagePrompt = imageMatch[1].trim();
        if (descMatch) sections.shortDescription = descMatch[1].trim();

        return sections;
      };

      const parsed = parseStoryResponse(generatedContent);

      // Fill the form fields with generated content
      if (parsed.title) setTitle(parsed.title);
      if (parsed.story) setContent(parsed.story);
      if (parsed.imagePrompt) setImagePrompt(parsed.imagePrompt);
      if (parsed.shortDescription) setShortDescription(parsed.shortDescription);

      setIsGenerating(false);
      toast.success("Story generated successfully!");

    } catch (error) {
      setIsGenerating(false);
      console.error("Story generation error:", error);
      toast.error(`Failed to generate story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Lengthen existing story using DeepSeek API
  const handleLengthenStory = async () => {
    if (!content.trim()) {
      toast.error("Please enter a story to lengthen");
      return;
    }

    setIsLengthening(true);
    toast.info("Lengthening story with AI...");

    try {
      // Configuration
      const API_KEY = 'sk-e0819703cff243a1881edad705d82ac2';
      const API_URL = 'https://api.deepseek.com/v1/chat/completions';
      const MODEL_NAME = 'deepseek-reasoner';

      const lengthenPrompt = `I want you to extend this story. I want the story to be three times as long. I want the story to be at least 2,800 words long. Do not add filler, environment descriptions or things that don't add to much to the story. Make the encounters longer with much longer descriptions of the passionate parts of the story. Extend the story by adding twists and turns, such as surprises, almost being caught in the act, and more encounters. Just give me the longer story, not the other parts. Do not give me any notes or any other text that are message from you. Just the story text alone.

${content}`;

      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            {
              role: "user",
              content: lengthenPrompt
            }
          ],
          stream: false,
          max_tokens: 8192, // Increased for much longer stories
          temperature: 0.7
        })
      };

      const response = await fetch(API_URL, options);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const longerStory = data.choices?.[0]?.message?.content;

      if (!longerStory) {
        throw new Error("No content received from API");
      }

      // Replace the story content with the longer version
      setContent(longerStory.trim());

      setIsLengthening(false);
      toast.success("Story lengthened successfully!");

    } catch (error) {
      setIsLengthening(false);
      console.error("Story lengthening error:", error);
      toast.error(`Failed to lengthen story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Story Voice Converter</h1>
        <p className="text-gray-300">Transform your written stories into captivating voice narrations</p>
      </div>

      {/* Virtual Cable Warning Modal */}
      {showVirtualCableWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">Setup Required</h3>
            <div className="space-y-4 text-gray-300">
              <p className="font-semibold text-yellow-300">
                For perfect audio quality, please setup Virtual Cable:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Download and install <a href="https://vb-audio.com/Cable/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">VB-Audio Virtual Cable</a></li>
                <li>Go to Windows Sound Settings</li>
                <li>Set <strong>"CABLE Input"</strong> as your default Output device</li>
                <li>Set <strong>"CABLE Output"</strong> as your default Input device</li>
                <li>Click "I enabled Virtual Cable" below to start recording</li>
              </ol>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mt-4">
                <p className="text-blue-200 text-xs">
                  <strong>Why Virtual Cable?</strong> It routes your computer's audio output directly to the microphone input, capturing perfect quality without background noise or echo.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowVirtualCableWarning(false)}
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleVirtualCableConfirmed}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                I enabled Virtual Cable
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Input */}
        <div className="lg:col-span-3 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              AI Story Generation Prompt
            </label>
            <textarea
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              placeholder="Enter your story generation prompt here... (e.g., the example prompt you provided)"
              rows={6}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all resize-y min-h-[120px] max-h-[300px]"
            />
            <div className="flex justify-between items-center mt-1">
              <div>
                <button
                  onClick={() => copyToClipboard(initialPrompt, "Initial Prompt")}
                  disabled={!initialPrompt.trim()}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs rounded-md transition-all"
                >
                  📋 Copy Prompt
                </button>
              </div>
              <div className="text-gray-400 text-sm">
                {initialPrompt.length.toLocaleString()} characters
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Story Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your story title..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all"
            />
            <div className="flex justify-between items-center mt-1">
              <div>
                <button
                  onClick={() => copyToClipboard(title, "Title")}
                  disabled={!title.trim()}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs rounded-md transition-all"
                >
                  📋 Copy Title
                </button>
              </div>
              <div className="text-gray-400 text-sm">
                {title.length} characters
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Story Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter or paste your story content here... (supports up to 100,000 characters)"
              rows={12}
              maxLength={100000}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all resize-y min-h-[200px] max-h-[600px]"
            />
            <div className="flex justify-between text-sm mt-1">
              <div className="text-gray-400">
                {content.split(/\s+/).filter(word => word.length > 0).length} words
              </div>
              <div className={`${content.length > 80000 ? 'text-yellow-400' : content.length > 95000 ? 'text-red-400' : 'text-gray-400'}`}>
                {content.length.toLocaleString()} / 100,000 characters
              </div>
            </div>
            {content.length > 80000 && (
              <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-yellow-200 text-xs">
                <strong>Note:</strong> Very long content may take several minutes to convert to speech.
              </div>
            )}
            <button
              onClick={() => copyToClipboard(content, "Story")}
              disabled={!content.trim()}
              className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs rounded-md transition-all"
            >
              📋 Copy Story
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Image Generation Prompt
            </label>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="AI-generated image prompt will appear here..."
              rows={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all resize-y min-h-[100px] max-h-[200px]"
            />
            <div className="flex justify-between items-center mt-1">
              <div>
                <button
                  onClick={() => copyToClipboard(imagePrompt, "Image Prompt")}
                  disabled={!imagePrompt.trim()}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs rounded-md transition-all"
                >
                  📋 Copy Image Prompt
                </button>
              </div>
              <div className="text-gray-400 text-sm">
                {imagePrompt.length.toLocaleString()} characters
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Short Description
            </label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="AI-generated short description will appear here..."
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all resize-y min-h-[80px] max-h-[150px]"
            />
            <div className="flex justify-between items-center mt-1">
              <div>
                <button
                  onClick={() => copyToClipboard(shortDescription, "Description")}
                  disabled={!shortDescription.trim()}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs rounded-md transition-all"
                >
                  📋 Copy Description
                </button>
              </div>
              <div className="text-gray-400 text-sm">
                {shortDescription.length.toLocaleString()} characters
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Controls */}
        <div className="space-y-6">
          <div>
            <button
              onClick={handleGenerateStory}
              disabled={isGenerating || isLengthening || !initialPrompt.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-lg hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {isGenerating ? "Generating Story..." : "🎭 Generate Story with AI"}
            </button>
            {isGenerating && (
              <div className="mt-2 text-center text-purple-300 text-sm">
                This may take 30-60 seconds...
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={handleLengthenStory}
              disabled={isLengthening || isGenerating || !content.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {isLengthening ? "Lengthening Story..." : "📈 Lengthen Story"}
            </button>
            {isLengthening && (
              <div className="mt-2 text-center text-orange-300 text-sm">
                This may take 60-90 seconds for longer content...
              </div>
            )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Voice
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name} className="bg-gray-800">
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Speech Rate: {speechRate}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Export Format
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all"
            >
              <option value="wav" className="bg-gray-800">WAV (Recommended)</option>
              <option value="webm" className="bg-gray-800">WebM</option>
            </select>
          </div>

          <div className="space-y-3">
            <button
              onClick={handlePreview}
              disabled={isPlaying || isExporting}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {isPlaying ? "Playing..." : "Preview & Play"}
            </button>

            <button
              onClick={handleStop}
              disabled={!isPlaying}
              className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Stop Playing
            </button>

            <button
              onClick={handleExportClick}
              disabled={isPlaying || isExporting}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {isExporting ? "Recording..." : "Export High-Quality Audio"}
            </button>

            {/* Export Timer */}
            {isExporting && (
              <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="text-blue-200">
                    <div className="text-lg font-mono font-bold">
                      {formatTime(elapsedTime)}
                    </div>
                    <div className="text-xs">Elapsed Time</div>
                  </div>
                  <div className="text-blue-200 text-right">
                    <div className="text-lg font-mono font-bold">
                      ~{formatTime(Math.max(0, estimatedTime - elapsedTime))}
                    </div>
                    <div className="text-xs">Remaining</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="bg-blue-900/30 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${Math.min(100, (elapsedTime / estimatedTime) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-center text-blue-300 text-xs mt-2">
                    Estimated total: {formatTime(estimatedTime)} ({getTextToSpeak().split(/\s+/).filter(word => word.length > 0).length} words at {speechRate}x speed)
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-green-200 text-sm mb-2">
              <strong>Perfect Audio Quality Setup:</strong>
            </p>
            <ul className="text-green-200 text-xs space-y-1">
              <li>• Install VB-Audio Virtual Cable for zero-loss audio routing</li>
              <li>• Set CABLE Input as Output device in Sound Settings</li>
              <li>• Set CABLE Output as Input device in Sound Settings</li>
              <li>• No background noise, echo, or quality loss!</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-200 text-sm">
              <strong>Download Virtual Cable:</strong> <a href="https://vb-audio.com/Cable/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-100">VB-Audio Virtual Cable (Free)</a>
            </p>
          </div>
        </div>
      </div>

      {/* Audio Preview */}
      {audioUrl && (
        <div className="mt-8 p-6 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Generated Audio Preview</h3>
          <audio
            controls
            src={audioUrl}
            className="w-full"
            style={{
              filter: 'invert(1) hue-rotate(180deg)',
            }}
          >
            Your browser does not support the audio element.
          </audio>
          <p className="text-gray-400 text-sm mt-2">
            Right-click the audio player and select "Save audio as..." to save the file again if needed.
          </p>
        </div>
      )}
    </div>
  );
}
