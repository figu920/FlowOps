import { useState } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { useTimeline } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { format } from 'date-fns'; // <-- CORREGIDO: Ya no necesitamos parseISO
import { Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { TimelineEvent } from "@shared/schema";

export default function Timeline() {
  const { currentUser } = useStore();
  const { data: timeline = [] } = useTimeline();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Only managers can see all details
  const isManager = currentUser?.role === 'manager';

  return (
    <Layout title="Timeline">
      <div className="relative space-y-8 pl-2 before:absolute before:left-[19px] before:top-2 before:bottom-4 before:w-[2px] before:bg-white/[0.06]">
        {timeline.map((event: TimelineEvent, i: number) => {
          // CORREGIDO: event.timestamp ya es un Date, no usamos parseISO
          const date = event.timestamp; 
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
                   {isManager && (
                     // CORREGIDO: Cambiado event.role por event.authorRole
                     <span className="text-[10px] uppercase bg-white/10 px-1 rounded text-white/50">{event.authorRole}</span>
                   )}
                </div>
                
                <div className="bg-card p-4 rounded-2xl border border-white/[0.06] shadow-sm">
                  <p className="text-[15px] leading-normal text-white/90 font-medium">
                    {event.text}
                  </p>
                  
                  {event.photo && (
                    <div 
                      onClick={() => setSelectedPhoto(event.photo!)}
                      className="mt-3 cursor-pointer group relative overflow-hidden rounded-xl border border-white/10"
                    >
                       <img src={event.photo} alt="Evidence" className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                       <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-transparent transition-colors">
                          <Camera className="w-6 h-6 text-white drop-shadow-md group-hover:opacity-0 transition-opacity" />
                       </div>
                    </div>
                  )}

                  {/* CORREGIDO: Cambiado event.role por event.authorRole */}
                  {event.comment && (isManager || event.authorRole === 'lead') && !event.photo && (
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

      {/* Photo Viewer */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="bg-transparent border-none shadow-none max-w-sm p-0 flex items-center justify-center">
           {selectedPhoto && (
             <motion.img 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               src={selectedPhoto} 
               alt="Full Proof" 
               className="w-full rounded-2xl border border-white/10 shadow-2xl" 
             />
           )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}