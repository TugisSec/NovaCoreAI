import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Power, Cpu, Wifi, Shield, Home, Settings, Activity, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ElevenLabsVoice } from "./ElevenLabsVoice";

interface SystemStatus {
  power: number;
  security: 'active' | 'standby' | 'offline';
  network: 'connected' | 'unstable' | 'offline';
  temperature: number;
  reactorOutput: number;
}

interface VoiceCommand {
  id: string;
  command: string;
  timestamp: Date;
  response: string;
}

export const JarvisAI = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const [elevenLabsAPIKey, setElevenLabsAPIKey] = useState<string>('');
  const [lastProcessedCommand, setLastProcessedCommand] = useState('');
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    power: 87,
    security: 'active',
    network: 'connected',
    temperature: 23.5,
    reactorOutput: 94.2
  });
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.trim();
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Show what we're hearing
        setCurrentCommand(interimTranscript || finalTranscript.trim());

        // Only process final results and prevent duplicates
        if (finalTranscript.trim() && finalTranscript.trim() !== lastProcessedCommand && !isProcessing) {
          console.log('📝 Final transcript:', finalTranscript.trim());
          handleVoiceCommand(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error('🚫 Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
          console.log('⏸️ No speech detected, continuing to listen...');
        } else if (event.error !== 'aborted') {
          console.log('🔄 Restarting recognition due to error...');
          setTimeout(() => {
            if (isListening && !isProcessing) {
              startRecognition();
            }
          }, 1000);
        }
      };

      recognition.onend = () => {
        console.log('⏹️ Speech recognition ended');
        setCurrentCommand('');
        
        // Auto-restart if we should still be listening
        if (isListening && !isProcessing) {
          setTimeout(() => {
            startRecognition();
          }, 100);
        }
      };
    }
  }, []);

  const startRecognition = () => {
    if (!recognitionRef.current || isProcessing) return;
    
    try {
      recognitionRef.current.start();
      console.log('🚀 Starting speech recognition...');
    } catch (error) {
      console.log('⚠️ Recognition start failed:', error);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      console.log('🛑 Stopping voice recognition');
      recognitionRef.current.abort();
      setIsListening(false);
      setCurrentCommand('');
      setLastProcessedCommand('');
    } else {
      console.log('🎯 Starting voice recognition');
      setIsListening(true);
      setLastProcessedCommand('');
      startRecognition();
    }
  };

  const handleVoiceCommand = async (command: string) => {
    const trimmedCommand = command.trim().toLowerCase();
    
    // Prevent processing empty, short, or duplicate commands
    if (!trimmedCommand || trimmedCommand.length < 3 || trimmedCommand === lastProcessedCommand || isProcessing) {
      console.log('🚫 Skipping command:', trimmedCommand, 'Already processed or invalid');
      return;
    }
    
    console.log('✅ Processing command:', trimmedCommand);
    setIsProcessing(true);
    setCurrentCommand('');
    setLastProcessedCommand(trimmedCommand);
    
    const response = processCommand(trimmedCommand);
    
    const voiceCommand: VoiceCommand = {
      id: Date.now().toString(),
      command: command.trim(),
      timestamp: new Date(),
      response
    };
    
    setCommandHistory(prev => [voiceCommand, ...prev].slice(0, 10));
    
    // Speak the response
    try {
      if (elevenLabsAPIKey) {
        await speakWithElevenLabs(response);
      } else {
        await speakWithBrowserTTS(response);
      }
    } catch (error) {
      console.error('TTS error:', error);
    }
    
    // Wait before allowing new commands
    setTimeout(() => {
      console.log('✅ Ready for next command');
      setIsProcessing(false);
    }, 1000);
  };

  const speakWithElevenLabs = async (text: string) => {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/N2lVS1w4EtoT3dr4eOWO', {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsAPIKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
          },
        }),
      });

      if (response.ok) {
        const audio = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(audio);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
      } else {
        console.error('ElevenLabs API error:', response.statusText);
        speakWithBrowserTTS(text);
      }
    } catch (error) {
      console.error('ElevenLabs error:', error);
      speakWithBrowserTTS(text);
    }
  };

  const speakWithBrowserTTS = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 0.9;
        utterance.volume = 0.8;
        
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        
        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  };

  const processCommand = (command: string): string => {
    console.log('🧠 Processing:', command);
    
    if (command.includes('status') || command.includes('report')) {
      return `All systems operational, Mr. Stark. Power at ${systemStatus.power}%, security is ${systemStatus.security}, reactor output at ${systemStatus.reactorOutput}%.`;
    }
    
    if (command.includes('security') && command.includes('activate')) {
      setSystemStatus(prev => ({ ...prev, security: 'active' }));
      return 'Security protocols activated. All perimeters secured.';
    }
    
    if (command.includes('power') && (command.includes('increase') || command.includes('boost'))) {
      setSystemStatus(prev => ({ ...prev, power: Math.min(100, prev.power + 10) }));
      return 'Power levels increased. Reactor output optimized.';
    }
    
    if (command.includes('temperature') || command.includes('temp')) {
      return `Current ambient temperature is ${systemStatus.temperature} degrees Celsius. All cooling systems functioning normally.`;
    }
    
    if (command.includes('weather')) {
      return 'External conditions are clear skies with temperature at 22 degrees Celsius. Light winds from the northwest at 8 kilometers per hour. Visibility excellent.';
    }
    
    if (command.includes('time') || command.includes('what time')) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return `The current time is ${time} on ${date}.`;
    }
    
    if (command.includes('name') || command.includes('my name')) {
      return 'You are Mr. Stark, genius, billionaire, philanthropist. Though I believe you prefer Tony.';
    }
    
    if (command.includes('hello') || command.includes('jarvis') || command.includes('hey')) {
      return 'Good to see you, Mr. Stark. How may I assist you today?';
    }
    
    if (command.includes('thank you') || command.includes('thanks')) {
      return 'You are very welcome, sir. Always happy to assist.';
    }
    
    return 'Command acknowledged, Mr. Stark. How else may I be of service?';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-blue-500/20 bg-slate-800/50 backdrop-blur p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
              <Cpu className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                J.A.R.V.I.S.
              </h1>
              <p className="text-xs text-slate-400">Just A Rather Very Intelligent System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant={systemStatus.network === 'connected' ? 'default' : 'destructive'} className="gap-1">
              <Wifi className="w-3 h-3" />
              {systemStatus.network}
            </Badge>
            <Badge variant={systemStatus.security === 'active' ? 'default' : 'secondary'} className="gap-1">
              <Shield className="w-3 h-3" />
              {systemStatus.security}
            </Badge>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Voice Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 bg-slate-800/50 border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Voice Interface
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Button
                  onClick={toggleListening}
                  size="lg"
                  className={`w-24 h-24 rounded-full ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </Button>
                <p className="mt-2 text-sm text-slate-300">
                  {isListening ? 'Listening... Speak naturally, I\'ll respond automatically' : 'Click to activate continuous voice mode'}
                </p>
              </div>
              
              {currentCommand && (
                <div className="bg-slate-700/50 p-3 rounded border border-blue-500/20">
                  <p className="text-blue-300 text-sm">Listening: "{currentCommand}"</p>
                </div>
              )}
              
              {isProcessing && (
                <div className="bg-slate-700/50 p-3 rounded border border-cyan-500/20">
                  <p className="text-cyan-300 text-sm flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    Processing command...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="bg-slate-800/50 border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Power Grid</span>
                  <span>{systemStatus.power}%</span>
                </div>
                <Progress value={systemStatus.power} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Reactor Output</span>
                  <span>{systemStatus.reactorOutput}%</span>
                </div>
                <Progress value={systemStatus.reactorOutput} className="h-2" />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Temperature</span>
                <span className="text-lg font-mono">{systemStatus.temperature}°C</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="border-blue-500/50">
                  <Home className="w-4 h-4 mr-1" />
                  House
                </Button>
                <Button variant="outline" size="sm" className="border-blue-500/50">
                  <Settings className="w-4 h-4 mr-1" />
                  Lab
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ElevenLabs Voice Setup */}
        <div className="mb-6">
          <ElevenLabsVoice
            onSpeak={elevenLabsAPIKey ? speakWithElevenLabs : speakWithBrowserTTS}
            isConfigured={!!elevenLabsAPIKey}
            onConfigureAPI={setElevenLabsAPIKey}
          />
        </div>

        {/* Command History */}
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardHeader>
            <CardTitle>Command History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {commandHistory.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  No commands yet. Try saying "Hello JARVIS" to get started.
                </p>
              ) : (
                commandHistory.map((cmd) => (
                  <div key={cmd.id} className="border border-slate-600 rounded p-3 bg-slate-700/30">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-blue-300 font-medium">"{cmd.command}"</p>
                      <span className="text-xs text-slate-400">{formatTime(cmd.timestamp)}</span>
                    </div>
                    <p className="text-slate-300 text-sm">{cmd.response}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};