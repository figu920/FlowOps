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

// Tipo extendido para mensajes con adjuntos opcionales
type Message = {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isCurrentUser: boolean;
  // Simulamos datos de archivo adjunto
  attachment?: {
    type: 'image' | 'file';
    name: string;
    url?: string; // En una app real, aquí iría la URL del archivo subido
  };
};

export default function Chat() {
  const { currentUser } = useStore();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  // Estado para el archivo seleccionado temporalmente
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  // Refs para los inputs ocultos
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // MOCK MESSAGES (Datos de prueba)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey team, how's the prep for the evening shift?",
      sender: 'Sarah Wilson',
      timestamp: new Date(Date.now() - 3600000),
      isCurrentUser: false,
    },
    {
      id: '2',
      text: "All good! Just finished restocking the bar stations.",
      sender: 'Mike Chen',
      timestamp: new Date(Date.now() - 1800000),
      isCurrentUser: false,
    },
    {
      id: '3',
      text: "Great. Don't forget to check the ice machine filters.",
      sender: 'You',
      timestamp: new Date(Date.now() - 900000),
      isCurrentUser: true,
    },
    // Ejemplo de mensaje con imagen adjunta (simulado)
    {
      id: '4',
      text: "Aquí está la foto del nuevo montaje de mesas.",
      sender: 'Mike Chen',
      timestamp: new Date(Date.now() - 300000),
      isCurrentUser: false,
      attachment: {
        type: 'image',
        name: 'setup_photo.jpg',
        // Usamos una imagen de placeholder
        url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' 
      }
    },
  ]);

  // Auto-scroll al fondo al llegar mensajes nuevos
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

    // Si hay archivo seleccionado, lo añadimos al mensaje (Simulación)
    if (selectedFile) {
        const isImage = selectedFile.type.startsWith('image/');
        newMsg.attachment = {
            type: isImage ? 'image' : 'file',
            name: selectedFile.name,
            // NOTA PARA TFG: En una app real, aquí primero subirías el archivo 
            // a tu servidor (ej: /api/upload) y obtendrías una URL real.
            // Para la demo, creamos una URL local temporal.
            url: isImage ? URL.createObjectURL(selectedFile) : undefined
        };
        
        toast({
            title: isImage ? "Photo sent" : "File sent",
            description: `Attached: ${selectedFile.name}`,
        });
    }

    setMessages([...messages, newMsg]);
    setNewMessage('');
    setSelectedFile(null); // Limpiamos el archivo seleccionado
    
    // Resetear los inputs file por si se quiere seleccionar el mismo archivo otra vez
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Manejador cuando se selecciona un archivo de los inputs ocultos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // Aquí podrías validar tamaño (ej: > 5MB error)
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

  // Helper para renderizar adjuntos en el chat
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
      <div className="flex flex-col h-[calc(100vh-180px)]">
        
        {/* === MESSAGES AREA === */}
        <ScrollArea className="flex-1 pr-4 -mr-4">
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
                    {/* Renderizar texto y/o adjunto */}
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
        </ScrollArea>

        {/* === INPUT AREA === */}
        <div className="mt-4 bg-black/40 p-2 pl-1 rounded-[24px] border border-white/10 relative flex flex-col gap-2">
            
            {/* VISTA PREVIA DE ARCHIVO SELECCIONADO (Si existe) */}
            <AnimatePresence>
                {selectedFile && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        className="px-3 pt-2 flex items-center justify-between bg-white/5 rounded-t-xl mx-1"
                    >
                        <div className="flex items-center gap-2 text-xs text-white overflow-hidden">
                            {selectedFile.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-flow-green" /> : <FileText className="w-4 h-4 text-blue-400" />}
                            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                        </div>
                        <button 
                            onClick={() => setSelectedFile(null)}
                            className="text-muted-foreground hover:text-white bg-white/10 hover:bg-red-500/20 rounded-full p-1 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* INPUTS Y BOTONES */}
            <div className="flex items-center gap-2 w-full">
                {/* BOTÓN + CON MENÚ DESPLEGABLE */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-flow-green hover:bg-white/5 rounded-full h-10 w-10 shrink-0 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    {/* Menú oscuro estilo iOS */}
                    <DropdownMenuContent align="start" className="bg-[#1C1C1E] border-white/10 text-white min-w-[180px] p-1.5 mb-2">
                        <DropdownMenuItem 
                            // Al hacer click, simulamos un click en el input oculto de cámara
                            onClick={() => cameraInputRef.current?.click()} 
                            className="focus:bg-white/10 rounded-lg gap-3 py-2.5 cursor-pointer"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                <Camera className="w-5 h-5" />
                            </div>
                            <span className="font-medium">Take Photo</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            // Al hacer click, simulamos un click en el input oculto de archivos
                            onClick={() => fileInputRef.current?.click()}
                            className="focus:bg-white/10 rounded-lg gap-3 py-2.5 cursor-pointer mt-1"
                        >
                            <div className="w-8 h-8 rounded-full bg-flow-green/20 text-flow-green flex items-center justify-center">
                                <Paperclip className="w-5 h-5 rotate-45" />
                            </div>
                            <span className="font-medium">Attach File</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* INPUTS OCULTOS (La magia para que funcione nativo) */}
                {/* Input para archivos generales */}
                <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                />
                {/* Input específico para cámara en móviles (capture="environment") */}
                <input 
                    type="file" 
                    hidden 
                    accept="image/*" 
                    capture="environment"
                    ref={cameraInputRef} 
                    onChange={handleFileSelect} 
                />

                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    className="bg-transparent border-none focus-visible:ring-0 text-white h-10 px-2 flex-1 placeholder:text-muted-foreground"
                />
                
                <Button 
                    onClick={handleSend} 
                    size="icon" 
                    className={`rounded-full h-10 w-10 shrink-0 transition-all duration-300 ${
                        newMessage.trim() || selectedFile
                            ? 'bg-flow-green text-black hover:bg-flow-green/90 rotate-0 scale-100' 
                            : 'bg-white/10 text-muted-foreground hover:bg-white/20 -rotate-45 scale-90 opacity-50 pointer-events-none'
                    }`}
                    disabled={!newMessage.trim() && !selectedFile}
                >
                    <Send className="w-4 h-4" strokeWidth={2.5} />
                </Button>
            </div>
        </div>
      </div>
    </Layout>
  );
}