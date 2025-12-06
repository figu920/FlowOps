import { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Send, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_ACTIONS = [
  "Inventory arrived 📦",
  "Need help front 🆘",
  "Backup grill 🔥",
  "Rush incoming 🏃",
  "Break time ☕"
];

export default function Chat() {
  const { chat, sendMessage, currentUser } = useStore();
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText("");
    }
  };

  return (
    <Layout title="Team Chat" className="flex flex-col p-0 h-screen overflow-hidden">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pt-24 pb-4 space-y-6"
      >
        {chat.map((msg, i) => {
          const isSequence = i > 0 && chat[i-1].sender === msg.sender;
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id} 
              className={cn(
                "flex flex-col max-w-[85%]",
                msg.isMe ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              {!msg.isMe && !isSequence && (
                <div className="flex items-center gap-2 mb-1 ml-3">
                   <span className="text-[11px] text-muted-foreground font-medium">{msg.sender}</span>
                   <span className="text-[9px] uppercase bg-white/5 px-1 rounded text-white/30">{msg.role}</span>
                </div>
              )}
              
              <div className={cn(
                "px-5 py-3 text-[15px] shadow-sm backdrop-blur-sm",
                msg.isMe 
                  ? "bg-blue-600 text-white rounded-[20px] rounded-tr-sm" 
                  : "bg-[#2C2C2E] text-white rounded-[20px] rounded-tl-sm border border-white/5",
                msg.type === 'action' && "font-bold bg-flow-green text-black border-none"
              )}>
                {msg.text}
              </div>
              
              <span className={cn(
                "text-[10px] text-white/20 mt-1 mx-2",
                msg.isMe ? "text-right" : "text-left"
              )}>
                {msg.timestamp}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="bg-[#161618] border-t border-white/10 pb-8 pt-3 px-4 safe-area-bottom w-full z-20">
        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mask-fade-right">
          {QUICK_ACTIONS.map((action, idx) => (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              key={action}
              onClick={() => sendMessage(action, true)}
              className="whitespace-nowrap px-4 py-2 bg-[#2C2C2E] hover:bg-[#3A3A3C] active:scale-95 rounded-full text-xs font-semibold border border-white/5 transition-all text-white"
            >
              {action}
            </motion.button>
          ))}
        </div>

        <div className="flex gap-3 items-end">
          <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground hover:text-white shrink-0 h-11 w-11 bg-[#2C2C2E]">
            <Plus className="w-6 h-6" />
          </Button>
          
          <div className="flex-1 relative">
            <Input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Message as ${currentUser?.name || 'Guest'}...`}
              className="rounded-full bg-[#1C1C1E] border-white/10 h-11 px-5 text-base focus:border-blue-500/50 focus:ring-0 placeholder:text-muted-foreground/50"
            />
          </div>
          
          <Button 
            onClick={handleSend}
            size="icon" 
            disabled={!inputText.trim()}
            className={cn(
              "rounded-full w-11 h-11 transition-all duration-200 shrink-0",
              inputText.trim() ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-[#2C2C2E] text-muted-foreground"
            )}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}
