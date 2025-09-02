import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, Settings } from "lucide-react";

interface ElevenLabsVoiceProps {
  onSpeak: (text: string) => void;
  isConfigured: boolean;
  onConfigureAPI: (apiKey: string) => void;
}

export const ElevenLabsVoice = ({ onSpeak, isConfigured, onConfigureAPI }: ElevenLabsVoiceProps) => {
  const [apiKey, setApiKey] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(!isConfigured);

  const handleConfigureAPI = () => {
    if (apiKey.trim()) {
      onConfigureAPI(apiKey.trim());
      setIsConfiguring(false);
    }
  };

  const testVoice = () => {
    onSpeak("Voice synthesis test successful, Mr. Stark. All systems are operational.");
  };

  if (isConfiguring) {
    return (
      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-blue-400" />
            ElevenLabs Voice Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300">
            For premium voice synthesis, enter your ElevenLabs API key:
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Enter ElevenLabs API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-slate-700/50 border-slate-600"
            />
            <Button onClick={handleConfigureAPI} disabled={!apiKey.trim()}>
              Configure
            </Button>
          </div>
          <p className="text-xs text-slate-400">
            Don't have an API key? Get one at{' '}
            <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              elevenlabs.io
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-green-400" />
            ElevenLabs Voice Active
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsConfiguring(true)}
            className="border-slate-600"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={testVoice} variant="outline" className="w-full border-blue-500/50">
          Test Voice Synthesis
        </Button>
      </CardContent>
    </Card>
  );
};