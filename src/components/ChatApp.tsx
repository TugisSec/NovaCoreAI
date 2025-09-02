import { useState } from "react";
import { MessageCircle, Phone, Video, MoreVertical, Search, Paperclip, Smile, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import sarahAvatar from "@/assets/avatar-sarah.jpg";
import johnAvatar from "@/assets/avatar-john.jpg";
import alexAvatar from "@/assets/avatar-alex.jpg";
import emmaAvatar from "@/assets/avatar-emma.jpg";

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread?: number;
  online?: boolean;
}

const mockChats: Chat[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: sarahAvatar,
    lastMessage: 'Hey! How are you doing?',
    timestamp: '2:30 PM',
    unread: 2,
    online: true
  },
  {
    id: '2',
    name: 'John Mitchell',
    avatar: johnAvatar,
    lastMessage: 'The meeting is at 3 PM tomorrow',
    timestamp: '1:15 PM',
    online: true
  },
  {
    id: '3',
    name: 'Alex Chen',
    avatar: alexAvatar,
    lastMessage: 'Thanks for your help!',
    timestamp: 'Yesterday',
    online: false
  },
  {
    id: '4',
    name: 'Emma Davis',
    avatar: emmaAvatar,
    lastMessage: 'Let\'s catch up soon 😊',
    timestamp: 'Yesterday',
    unread: 1,
    online: true
  }
];

const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Hey! How are you doing?',
    sender: 'other',
    timestamp: '2:25 PM'
  },
  {
    id: '2',
    text: 'I\'m doing great! Just working on some new projects. How about you?',
    sender: 'me',
    timestamp: '2:27 PM'
  },
  {
    id: '3',
    text: 'That sounds exciting! I\'d love to hear more about them.',
    sender: 'other',
    timestamp: '2:28 PM'
  },
  {
    id: '4',
    text: 'Sure! Let\'s schedule a call this week to discuss.',
    sender: 'me',
    timestamp: '2:30 PM'
  }
];

export const ChatApp = () => {
  const [selectedChat, setSelectedChat] = useState<Chat>(mockChats[0]);
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim()) {
      // In a real app, this would send the message
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Chat Sidebar */}
      <div className="w-80 bg-sidebar-chat border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Chats</h1>
            <Button variant="ghost" size="icon">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {mockChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`p-4 cursor-pointer transition-colors hover:bg-hover-chat ${
                selectedChat.id === chat.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={chat.avatar} alt={chat.name} />
                    <AvatarFallback>{chat.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-online-indicator rounded-full border-2 border-sidebar-chat"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold truncate">{chat.name}</h3>
                    <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                    {chat.unread && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-chat-bg">
        {/* Chat Header */}
        <div className="bg-sidebar-chat p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedChat.avatar} alt={selectedChat.name} />
              <AvatarFallback>{selectedChat.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{selectedChat.name}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedChat.online ? 'Online' : 'Last seen recently'}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  msg.sender === 'me'
                    ? 'bg-message-sent text-message-sent-foreground'
                    : 'bg-message-received text-message-received-foreground shadow-sm'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender === 'me' 
                    ? 'text-message-sent-foreground/70' 
                    : 'text-muted-foreground'
                }`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-sidebar-chat p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              onClick={handleSendMessage}
              className="rounded-full"
              disabled={!message.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};