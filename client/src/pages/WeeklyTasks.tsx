import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useChecklists, useTasks, useCreateTask, useDeleteTask } from '@/lib/hooks'; 
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Sun, Moon, Clock, 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info
} from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function WeeklyTasks() {
  // --- ESTADOS ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Guardamos la tarea Y su categoría para poder completarla desde el modal
  const [viewingTask, setViewingTask] = useState<{ template: any, categoryId: string } | null>(null);

  // --- DATOS ---
  const { data: openingTemplates = [] } = useChecklists("opening");
  const { data: shiftTemplates = [] } = useChecklists("shift");
  const { data: closingTemplates = [] } = useChecklists("closing");
  const { data: allTasks = [] } = useTasks();
  
  const createTaskMutation = useCreateTask();
  const deleteTaskMutation = useDeleteTask();

  // --- LOGICA DE FECHAS ---
  const dateKey = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);
  
  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  // --- LOGICA DE ESTADO ---
  const getCompletionStatus = (templateText: string, category: string) => {
      return allTasks.find((t: any) => 
          t.text === templateText && 
          t.notes?.includes(`DATE:${dateKey}`) && 
          t.notes?.includes(`CAT:${category}`)
      );
  };

  const toggleItem = (template: any, category: string) => {
      const existingRecord = getCompletionStatus(template.text, category);

      if (existingRecord) {
          deleteTaskMutation.mutate(existingRecord.id);
      } else {
          createTaskMutation.mutate({
              text: template.text,
              assignedTo: 'Team',
              notes: `DATE:${dateKey}|CAT:${category}|REF:${template.id}`,
              completed: true 
          });
      }
  };

  // --- COMPONENTE COLUMNA ---
  const TaskColumn = ({ title, icon: Icon, color, bg, templates, categoryId }: any) => {
    const totalCount = templates.length;
    const completedCount = templates.filter((tpl: any) => getCompletionStatus(tpl.text, categoryId)).length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
      <div className="bg-card border border-white/5 rounded-3xl overflow-hidden flex flex-col h-full shadow-lg">
        {/* Cabecera */}
        <div className="p-5 border-b border-white/5 bg-white/[0.02] relative overflow-hidden">
          <div className={cn("absolute bottom-0 left-0 h-1 transition-all duration-700", color.replace('text-', 'bg-'))} style={{ width: `${progress}%`, opacity: 0.3 }} />
          
          <div className="flex justify-between items-start mb-3 relative z-10">
             <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", bg, color)}>
                <Icon className="w-5 h-5" />
             </div>
             <span className={cn("text-xl font-black tabular-nums tracking-tight", color)}>{Math.round(progress)}%</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">{title}</h3>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{completedCount} of {totalCount} Done</p>
          </div>
        </div>

        {/* Lista */}
        <div className="p-3 space-y-2 flex-1 overflow-y-auto bg-black/10">
           {templates.length === 0 && (
             <div className="text-center py-8 text-muted-foreground opacity-40 text-[10px] uppercase font-bold">Empty List</div>
           )}
           
           {templates.map((tpl: any) => {
             const record = getCompletionStatus(tpl.text, categoryId);
             const isCompleted = !!record;

             return (
               <motion.div
                 key={tpl.id}
                 layout
                 // 1. AL PINCHAR, GUARDAMOS TAREA + CATEGORÍA
                 onClick={() => setViewingTask({ template: tpl, categoryId })} 
                 className={cn(
                   "group p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all duration-200 active:scale-[0.98]",
                   isCompleted 
                      ? "bg-flow-green/10 border-flow-green/20 shadow-[0_0_15px_rgba(74,222,128,0.05)]" 
                      : "bg-[#1C1C1E] border-white/5 hover:border-white/10 hover:bg-white/5"
                 )}
               >
                 {/* Círculo para marcar rápido */}
                 <div 
                    onClick={(e) => { e.stopPropagation(); toggleItem(tpl, categoryId); }}
                    className={cn(
                        "w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-300 z-10",
                        isCompleted 
                        ? "bg-flow-green border-flow-green text-black" 
                        : "border-white/20 text-transparent hover:border-white/40 bg-black/20"
                    )}
                 >
                    <Check className="w-4 h-4 stroke-[4]" />
                 </div>
                 
                 <div className="flex-1 min-w-0">
                    {/* 2. CAMBIO AQUÍ: 'truncate' para una sola línea limpia */}
                    <span className={cn(
                        "text-sm font-medium leading-tight transition-colors block truncate", 
                        isCompleted ? "text-white" : "text-white/70"
                    )}>
                        {tpl.text}
                    </span>
                 </div>
                 
                 <Info className="w-3 h-3 text-white/10 group-hover:text-white/30 shrink-0" />
               </motion.div>
             );
           })}
        </div>
      </div>
    );
  };

  // Helper para el modal
  const isViewingTaskCompleted = viewingTask 
    ? !!getCompletionStatus(viewingTask.template.text, viewingTask.categoryId) 
    : false;

  return (
    <Layout title="Daily Operations" showBack={true}>
      
      {/* HEADER DE FECHA */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between bg-card p-2 rounded-2xl border border-white/5">
            <Button variant="ghost" size="icon" onClick={handlePrevDay} className="text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl h-12 w-12">
                <ChevronLeft className="w-6 h-6" />
            </Button>
            
            <div className="text-center flex flex-col items-center cursor-pointer" onClick={handleToday}>
                <div className="flex items-center gap-2 text-flow-green text-xs font-bold uppercase tracking-widest mb-0.5">
                    <CalendarIcon className="w-3 h-3" />
                    {isToday(selectedDate) ? "Today" : format(selectedDate, "MMM yyyy")}
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                    {format(selectedDate, 'EEEE, do')}
                </div>
            </div>

            <Button variant="ghost" size="icon" onClick={handleNextDay} className="text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl h-12 w-12">
                <ChevronRight className="w-6 h-6" />
            </Button>
        </div>
      </div>

      {/* GRID DE COLUMNAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
        <TaskColumn title="Opening" icon={Sun} color="text-blue-400" bg="bg-blue-500/10" templates={openingTemplates} categoryId="Opening" />
        <TaskColumn title="Shift" icon={Clock} color="text-orange-400" bg="bg-orange-500/10" templates={shiftTemplates} categoryId="Shift" />
        <TaskColumn title="Closing" icon={Moon} color="text-purple-400" bg="bg-purple-500/10" templates={closingTemplates} categoryId="Closing" />
      </div>

      {/* MODAL DETALLES Y ACCIÓN */}
      <Dialog open={!!viewingTask} onOpenChange={() => setViewingTask(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
            <DialogHeader>
                <DialogTitle className="text-xl">Task Details</DialogTitle>
            </DialogHeader>
            
            <div className="py-6">
                <p className="text-lg text-white font-medium leading-relaxed">
                    {viewingTask?.template.text}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground bg-white/5 p-2 rounded-lg">
                    <span className="uppercase font-bold text-[10px] tracking-wider bg-white/10 px-1.5 py-0.5 rounded">
                        {viewingTask?.categoryId}
                    </span>
                    <span>Task for {format(selectedDate, 'MMM do')}</span>
                </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
                {/* 3. BOTÓN PARA COMPLETAR DENTRO DEL MODAL */}
                <Button 
                    onClick={() => {
                        if (viewingTask) {
                            toggleItem(viewingTask.template, viewingTask.categoryId);
                            setViewingTask(null); // Cerramos tras accionar
                        }
                    }} 
                    className={cn(
                        "w-full font-bold h-12 text-base",
                        isViewingTaskCompleted 
                            ? "bg-white/10 text-white hover:bg-white/20" 
                            : "bg-flow-green text-black hover:bg-flow-green/90"
                    )}
                >
                    {isViewingTaskCompleted ? (
                        <>Mark as Incomplete</>
                    ) : (
                        <><Check className="w-5 h-5 mr-2" /> Mark as Done</>
                    )}
                </Button>
                
                <Button variant="ghost" onClick={() => setViewingTask(null)} className="w-full text-muted-foreground hover:text-white">
                    Close
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}