import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Send, Bot, User, Sparkles, Loader2, Sun, Moon, Image, X } from 'lucide-react';
// Force refresh to clear ImageIcon reference
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
interface Message {
  id: string;
  content: string | Array<{type: string; text?: string; image_url?: {url: string}}>;
  role: 'user' | 'assistant';
  timestamp: Date;
}
const OpenAIChatbot = () => {
  const {
    theme,
    setTheme
  } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    content: 'Hello! I\'m your AI assistant powered by OpenAI. How can I help you today?',
    role: 'assistant',
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai-api-key') || '');
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);
  const toggleTheme = () => {
    console.log('Toggle clicked! Current theme:', theme);
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    console.log('Setting theme to:', newTheme);
    toast.success(`Switched to ${newTheme} mode`);
  };
  const saveApiKey = () => {
    if (!tempApiKey.trim()) {
      toast.error('Please enter a valid OpenAI API key');
      return;
    }
    if (!tempApiKey.startsWith('sk-')) {
      toast.error('OpenAI API keys should start with "sk-"');
      return;
    }
    localStorage.setItem('openai-api-key', tempApiKey);
    setApiKey(tempApiKey);
    setIsSettingsOpen(false);
    toast.success('API key saved successfully!');
  };
  const sendMessage = async () => {
    if (!input.trim() && !uploadedImage) return;
    if (!apiKey) {
      toast.error('Please set your OpenAI API key in settings first');
      setIsSettingsOpen(true);
      return;
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim() || "Image uploaded",
      role: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const currentImage = uploadedImage;
    setUploadedImage(null); // Clear the uploaded image after sending
    setIsLoading(true);
    try {
      // Prepare messages for API
      const apiMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // If there's an uploaded image, modify the last message to include it
      if (currentImage) {
        const lastMessage = apiMessages[apiMessages.length - 1];
        lastMessage.content = [
          {
            type: "text",
            text: input.trim() || "What do you see in this image?"
          },
          {
            type: "image_url",
            image_url: {
              url: currentImage
            }
          }
        ];
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: apiMessages,
          stream: false,
          max_tokens: 2000,
          temperature: 0.7
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get response from OpenAI');
      }
      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.choices[0].message.content,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      toast.success('Response received!');
    } catch (error) {
      console.error('OpenAI API error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  const renderMessageContent = (content: string | Array<{type: string; text?: string; image_url?: {url: string}}>) => {
    if (typeof content === 'string') {
      return content;
    }
    
    // For multimodal content, just return the text part for display
    const textPart = content.find(item => item.type === 'text');
    return textPart?.text || 'Image uploaded';
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <div className="h-screen flex flex-col bg-background transition-colors">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-card-foreground">NovaCore</h1>
            <p className="text-sm text-muted-foreground">Powered by OpenAI GPT</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-10 w-10 hover:bg-accent transition-colors" title={mounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Toggle theme'}>
            {!mounted ? <div className="h-5 w-5 animate-pulse bg-muted rounded" /> : theme === 'dark' ? <Sun className="h-5 w-5 transition-all" /> : <Moon className="h-5 w-5 transition-all" />}
          </Button>
          
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">OpenAI API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="sk-..."
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Your API key is stored locally and never sent to our servers.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveApiKey}>
                    Save API Key
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map(message => <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              
              <Card className={`max-w-[70%] p-4 ${message.role === 'user' ? 'bg-message-received text-message-received-foreground dark:bg-gray-700 dark:text-white' : 'bg-message-received text-message-received-foreground dark:bg-gray-700 dark:text-white'}`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {renderMessageContent(message.content)}
                </div>
                <div className="text-xs opacity-70 mt-2">
                  {formatTime(message.timestamp)}
                </div>
              </Card>

              
            </div>)}
          
          {isLoading && <div className="flex gap-4 justify-start">
              <Avatar className="h-8 w-8 bg-primary/10 border-0">
                <Bot className="h-5 w-5 text-primary" />
              </Avatar>
              <Card className="bg-message-received text-message-received-foreground p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </Card>
            </div>}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-card p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="image-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    setUploadedImage(e.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                  toast.success(`Selected: ${file.name}`);
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-[60px] w-[60px] text-muted-foreground hover:text-foreground"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              <Image className="h-6 w-6" />
            </Button>
            <div className="flex-1">
              {uploadedImage && (
                <div className="mb-3 p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Image attached</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedImage(null)}
                      className="h-6 w-6 p-0 hover:bg-destructive/20"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded preview" 
                    className="max-w-full max-h-32 rounded-md object-contain"
                  />
                </div>
              )}
              <Textarea ref={textareaRef} placeholder="Type your message here... (Enter to send, Shift+Enter for new line)" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} className="min-h-[60px] max-h-[200px] resize-none" disabled={isLoading} />
            </div>
            <Button onClick={sendMessage} disabled={(!input.trim() && !uploadedImage) || isLoading} size="lg" className="h-[60px] px-6 bg-transparent hover:bg-transparent border-none shadow-none">
              {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-white" /> : <Send className="h-8 w-8 text-white" />}
            </Button>
          </div>
          
          {!apiKey && <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">
                Please set your OpenAI API key in settings to start chatting
              </p>
            </div>}
        </div>
      </div>
    </div>;
};
export default OpenAIChatbot;