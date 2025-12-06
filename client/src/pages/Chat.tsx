import { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QUICK_ACTIONS = [
  "Inventory arrived",
  "Need help front",
  "Backup grill",
  "Rush incoming"
];

export default function Chat() {
  const { chat, sendMessage } = useStore();
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
    <Layout title="Chat" className="flex flex-col p-0 pb-0 h-[calc(100vh-60px)]">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {chat.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex flex-col max-w-[80%]",
              msg.isMe ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            {!msg.isMe && <span className="text-xs text-muted-foreground mb-1 ml-1">{msg.sender}</span>}
            
            <div className={cn(
              "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
              msg.isMe 
                ? "bg-flow-green text-black rounded-tr-sm" 
                : "bg-card border border-white/10 text-foreground rounded-tl-sm",
              msg.type === 'action' && "font-bold"
            )}>
              {msg.text}
            </div>
            
            <span className="text-[10px] text-muted-foreground/50 mt-1 mx-1">
              {msg.timestamp}
            </span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-white/5 pb-8 safe-area-bottom">
        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mb-2">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action}
              onClick={() => sendMessage(action, true)}
              className="whitespace-nowrap px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-medium border border-white/5 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Message..."
            className="rounded-full bg-background border-white/10 h-11 px-4 focus-visible:ring-flow-green"
          />
          <Button 
            onClick={handleSend}
            size="icon" 
            className="rounded-full w-11 h-11 bg-flow-green text-black hover:bg-flow-green/90"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}
