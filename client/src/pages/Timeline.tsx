import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { AlertCircle, Info, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Timeline() {
  const { timeline, currentUser } = useStore();

  // Only managers can see all details
  const isManager = currentUser?.role === 'manager';

  return (
    <Layout title="Timeline">
      <div className="relative space-y-8 pl-2 before:absolute before:left-[19px] before:top-2 before:bottom-4 before:w-[2px] before:bg-white/[0.06]">
        {timeline.map((event, i) => {
          const date = parseISO(event.timestamp);
          const timeStr = format(date, 'h:mm a');
          
          // Employees see basic info, Managers see everything
          
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
                   {isManager && (
                     <span className="text-[10px] uppercase bg-white/10 px-1 rounded text-white/50">{event.role}</span>
                   )}
                </div>
                
                <div className="bg-card p-4 rounded-2xl border border-white/[0.06] shadow-sm">
                  <p className="text-[15px] leading-normal text-white/90 font-medium">
                    {event.text}
                  </p>
                  
                  {event.comment && (isManager || event.role === 'lead') && (
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <p className="text-xs text-muted-foreground italic">"{event.comment}"</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Layout>
  );
}
