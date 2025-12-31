import { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  Plus, 
  Image as ImageIcon, 
  Paperclip, 
  Camera, 
  X, 
  FileText 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

// --- TIPOS ---
type Message = {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isCurrentUser: boolean;
  attachment?: {
    type: 'image' | 'file';
    name: string;
    url?: string;
  };
};

// --- OPCIONES RÁPIDAS (CHIPS) ---
const QUICK_REPLIES = [
  "Inventory arrived 📦",
  "Need help front 🆘",
  "Backup needed 🏃",
  "Break time ☕",
  "All clear ✅",
  "Kitchen is busy 🔥",
  "Printer paper out 🖨️",
  "Manager needed 👔"
];

export default function Chat() {
  const { currentUser } = useStore();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // --- ESTADO INICIAL VACÍO (SIN EJEMPLOS) ---
  const [messages, setMessages] = useState<Message[]>([]);

  // Auto-scroll al recibir mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSend = () => {
    if ((!newMessage.trim() && !selectedFile) || !currentUser) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'You',
      timestamp: new Date(),
      isCurrentUser: true,
    };

    if (selectedFile) {
        const isImage = selectedFile.type.startsWith('image/');
        newMsg.attachment = {
            type: isImage ? 'image' : 'file',
            name: selectedFile.name,
            url: isImage ? URL.createObjectURL(selectedFile) : undefined
        };
    }

    setMessages([...messages, newMsg]);
    setNewMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleQuickReply = (text: string) => {
    setNewMessage(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "Error", description: "File too large (Max 5MB)", variant: "destructive" });
            return;
        }
        setSelectedFile(file);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderAttachment = (msg: Message) => {
    if (!msg.attachment) return null;
    if (msg.attachment.type === 'image' && msg.attachment.url) {
        return (
            <div className="mt-2 mb-1 rounded-lg overflow-hidden border border-white/10 max-w-[250px]">
                <img src={msg.attachment.url} alt="attachment" className="w-full h-auto object-cover" />
            </div>
        );
    }
    return (
        <div className="flex items-center gap-2 mt-2 mb-1 bg-black/20 p-2 rounded-lg border border-white/10 max-w-[250px]">
            <FileText className="w-5 h-5 text-flow-green" />
            <span className="text-xs text-white truncate flex-1">{msg.attachment.name}</span>
        </div>
    );
  };

  return (
    <Layout title="Team Chat" showBack>
      <div className="flex flex-col h-[calc(100vh-180px)] relative">
        
        {/* === MESSAGES AREA === */}
        <ScrollArea className="flex-1 pr-4 -mr-4 pb-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30">
                <Send className="w-12 h-12 mb-2" />
                <p>No messages yet.</p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
                {messages.map((msg) => (
                <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-end gap-3 ${msg.isCurrentUser ? 'flex-row-reverse' : ''}`}
                >
                    {!msg.isCurrentUser && (
                    <Avatar className="w-8 h-8 border border-white/10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender}`} />
                        <AvatarFallback>{msg.sender[0]}</AvatarFallback>
                    </Avatar>
                    )}

                    <div className={`max-w-[75%] group ${msg.isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!msg.isCurrentUser && (
                        <span className="text-[10px] text-muted-foreground ml-1 mb-1 block">{msg.sender}</span>
                    )}
                    
                    <div
                        className={`p-3 rounded-2xl text-sm border ${
                        msg.isCurrentUser
                            ? 'bg-flow-green text-black border-flow-green rounded-br-sm'
                            : 'bg-[#1C1C1E] text-white border-white/10 rounded-bl-sm'
                        }`}
                    >
                        {msg.text && <p>{msg.text}</p>}
                        {renderAttachment(msg)}
                    </div>
                    
                    <span className="text-[9px] text-muted-foreground mx-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity block">
                        {formatTime(msg.timestamp)}
                    </span>
                    </div>
                </motion.div>
                ))}
                <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        {/* === BOTTOM AREA === */}
        <div className="mt-auto">
            
            {/* 1. VISTA PREVIA DE ARCHIVO (Si hay uno seleccionado) */}
            <AnimatePresence>
                {selectedFile && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        className="px-4 py-2 flex items-center justify-between bg-white/5 rounded-t-xl mx-2 border-t border-x border-white/10"
                    >
                        <div className="flex items-center gap-2 text-xs text-white overflow-hidden">
                            {selectedFile.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-flow-green" /> : <FileText className="w-4 h-4 text-blue-400" />}
                            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                        </div>
                        <button onClick={() => setSelectedFile(null)} className="text-muted-foreground hover:text-white bg-white/10 rounded-full p-1"><X className="w-3 h-3" /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. OPCIONES RÁPIDAS (SCROLL ARREGLADO) */}
            {!selectedFile && (
                <div className="w-full overflow-x-auto pb-3 pt-1 no-scrollbar">
                    <div className="flex gap-2 px-1 w-max">
                        {QUICK_REPLIES.map((reply, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleQuickReply(reply)}
                                className="whitespace-nowrap bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-xs font-medium text-white transition-colors active:scale-95"
                            >
                                {reply}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. INPUT BAR (Con el estilo original + funcionalidad nueva) */}
            <div className="bg-black/40 p-2 pl-2 rounded-[32px] border border-white/10 flex items-center gap-2">
                
                {/* BOTÓN + (Desplegable) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="bg-white/10 text-white hover:bg-white/20 rounded-full h-10 w-10 shrink-0 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-[#1C1C1E] border-white/10 text-white min-w-[180px] p-1.5 mb-2 ml-4">
                        <DropdownMenuItem onClick={() => cameraInputRef.current?.click()} className="focus:bg-white/10 rounded-lg gap-3 py-2.5 cursor-pointer">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center"><Camera className="w-5 h-5" /></div>
                            <span className="font-medium">Take Photo</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="focus:bg-white/10 rounded-lg gap-3 py-2.5 cursor-pointer mt-1">
                            <div className="w-8 h-8 rounded-full bg-flow-green/20 text-flow-green flex items-center justify-center"><Paperclip className="w-5 h-5 rotate-45" /></div>
                            <span className="font-medium">Attach File</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* INPUTS OCULTOS */}
                <input type="file" hidden ref={fileInputRef} onChange={handleFileSelect} />
                <input type="file" hidden accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileSelect} />

                {/* CAMPO DE TEXTO */}
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={`Message as ${currentUser?.name.split(' ')[0]}...`}
                    className="bg-transparent border-none focus-visible:ring-0 text-white h-10 px-2 flex-1 placeholder:text-muted-foreground"
                />
                
                {/* BOTÓN ENVIAR (Estilo Flecha Original) */}
                <Button 
                    onClick={handleSend} 
                    size="icon" 
                    className={`rounded-full h-10 w-10 shrink-0 transition-all ${
                        newMessage.trim() || selectedFile
                            ? 'bg-white/10 text-white hover:bg-white/20' 
                            : 'bg-white/5 text-muted-foreground opacity-50'
                    }`}
                    disabled={!newMessage.trim() && !selectedFile}
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>

      </div>
    </Layout>
  );
}