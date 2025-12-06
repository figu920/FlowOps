import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { AlertCircle, Info, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Timeline() {
  const { timeline } = useStore();

  const getIcon = (type: string) => {
    switch(type) {
      case 'alert': return <AlertCircle className="w-5 h-5 text-flow-red" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-flow-yellow" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-flow-green" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <Layout title="Timeline">
      <div className="relative space-y-8 pl-2 before:absolute before:left-[19px] before:top-2 before:bottom-4 before:w-[2px] before:bg-white/[0.06]">
        {timeline.map((event, i) => {
          const date = parseISO(event.timestamp);
          const timeStr = format(date, 'h:mm a');
          
          return (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              key={event.id} 
              className="relative pl-10"
            >
              {/* Connector Node */}
              <div className={cn(
                "absolute left-[10px] top-0 w-5 h-5 rounded-full border-[3px] border-background z-10 flex items-center justify-center",
                event.type === 'alert' ? "bg-flow-red shadow-[0_0_10px_rgba(255,69,58,0.5)]" :
                event.type === 'warning' ? "bg-flow-yellow shadow-[0_0_10px_rgba(247,209,84,0.5)]" :
                event.type === 'success' ? "bg-flow-green shadow-[0_0_10px_rgba(50,215,75,0.5)]" :
                "bg-blue-500"
              )} />

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-xs font-bold text-muted-foreground bg-white/5 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-white/5">
                     {timeStr}
                   </span>
                   <span className="text-sm font-bold text-white">{event.author}</span>
                </div>
                
                <div className="bg-card p-4 rounded-2xl border border-white/[0.06] shadow-sm">
                  <p className="text-[15px] leading-normal text-white/90 font-medium">
                    {event.text}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Layout>
  );
}
