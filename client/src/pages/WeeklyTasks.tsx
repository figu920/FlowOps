import { useState } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { useChecklists, useUpdateChecklist } from '@/lib/hooks'; // Usamos Checklists ahora
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { 
  Check, Sun, Moon, Clock, CalendarDays, 
  CheckCircle2, Circle 
} from 'lucide-react';
import { format } from 'date-fns';

export default function WeeklyTasks() {
  const { currentUser } = useStore();
  const updateChecklistMutation = useUpdateChecklist();

  // Fecha actual
  const today = new Date();

  // Traemos las listas fijas (igual que en Schedule)
  const { data: openingList = [] } = useChecklists("opening");
  const { data: shiftList = [] } = useChecklists("shift");
  const { data: closingList = [] } = useChecklists("closing");

  // Handler para completar/descompletar
  const toggleItem = (id: string, currentStatus: boolean) => {
    updateChecklistMutation.mutate({ 
        id, 
        updates: { completed: !currentStatus } 
    });
  };

  // Componente reutilizable para cada Columna
  const TaskColumn = ({ title, icon: Icon, color, bg, items }: any) => {
    const completedCount = items.filter((i:any) => i.completed).length;
    const totalCount = items.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
      <div className="bg-card border border-white/5 rounded-3xl overflow-hidden flex flex-col h-full">
        {/* Cabecera de Columna */}
        <div className="p-5 border-b border-white/5 bg-white/[0.02]">
          <div className="flex justify-between items-start mb-4">
             <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", bg, color)}>
                <Icon className="w-6 h-6" />
             </div>
             <div className="text-right">
                <span className={cn("text-2xl font-black", color)}>{Math.round(progress)}%</span>
             </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-xs text-muted-foreground">{completedCount}/{totalCount} Tasks Completed</p>
          </div>
          
          {/* Barra de progreso */}
          <div className="h-1 w-full bg-white/10 rounded-full mt-4 overflow-hidden">
             <div 
               className={cn("h-full transition-all duration-500 rounded-full", color.replace('text-', 'bg-'))} 
               style={{ width: `${progress}%` }}
             />
          </div>
        </div>

        {/* Lista de Tareas */}
        <div className="p-3 space-y-2 flex-1 overflow-y-auto">
           {items.length === 0 && (
             <div className="text-center py-10 text-muted-foreground opacity-50 text-xs">No fixed tasks.</div>
           )}
           {items.map((item: any, idx: number) => (
             <motion.div
               key={item.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.05 }}
               onClick={() => toggleItem(item.id, item.completed)}
               className={cn(
                 "p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all active:scale-[0.98]",
                 item.completed 
                    ? "bg-flow-green/10 border-flow-green/20" 
                    : "bg-black/20 border-white/5 hover:bg-white/5"
               )}
             >
               <div className={cn(
                  "mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                  item.completed 
                    ? "bg-flow-green border-flow-green text-black" 
                    : "border-white/30 text-transparent"
               )}>
                  <Check className="w-3.5 h-3.5 stroke-[4]" />
               </div>
               <span className={cn(
                  "text-sm font-medium leading-tight",
                  item.completed ? "text-white/50 line-through" : "text-white"
               )}>
                 {item.text}
               </span>
             </motion.div>
           ))}
        </div>
      </div>
    );
  };

  return (
    <Layout title="Daily Checklists" showBack={true}>
      
      {/* CABECERA CON FECHA */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/5 rounded-lg text-muted-foreground">
                <CalendarDays className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-sm font-bold text-flow-green uppercase tracking-wider">Today's Operations</h2>
                <p className="text-2xl font-black text-white">{format(today, 'EEEE, MMM do')}</p>
            </div>
        </div>
      </div>

      {/* GRID DE 3 COLUMNAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
        
        {/* COLUMNA 1: OPENING */}
        <TaskColumn 
            title="Opening" 
            icon={Sun} 
            color="text-blue-400" 
            bg="bg-blue-500/10" 
            items={openingList} 
        />

        {/* COLUMNA 2: SHIFT */}
        <TaskColumn 
            title="Shift" 
            icon={Clock} 
            color="text-orange-400" 
            bg="bg-orange-500/10" 
            items={shiftList} 
        />

        {/* COLUMNA 3: CLOSING */}
        <TaskColumn 
            title="Closing" 
            icon={Moon} 
            color="text-purple-400" 
            bg="bg-purple-500/10" 
            items={closingList} 
        />

      </div>
    </Layout>
  );
}