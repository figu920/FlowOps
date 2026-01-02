import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { 
  useChecklists, useUpdateChecklist, 
  useTasks, useCompleteTask, useCreateTask, useDeleteTask 
} from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Calendar as CalendarIcon, Plus, Trash2, Camera, 
  ChevronLeft, ChevronRight, X, Clock
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, isToday, parseISO 
} from 'date-fns';

export default function Schedule({ categoryColor = '#3B82F6' }: { categoryColor?: string }) {
  const { currentUser } = useStore();
  
  // --- ESTADOS DEL CALENDARIO ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // --- DATA FETCHING ---
  const { data: openingList = [] } = useChecklists("opening");
  const { data: closingList = [] } = useChecklists("closing");
  const { data: tasks = [] } = useTasks();

  // --- MUTACIONES ---
  const updateChecklistMutation = useUpdateChecklist();
  const completeTaskMutation = useCompleteTask();
  const createTaskMutation = useCreateTask();
  const deleteTaskMutation = useDeleteTask();
  
  // --- ESTADOS DE MODALES ---
  const [isAddingTask, setIsAddingTask] = useState<Date | null>(null); // Fecha seleccionada para añadir
  const [newTaskText, setNewTaskText] = useState("");
  
  const [viewingDay, setViewingDay] = useState<Date | null>(null); // Ver detalles de un día (para móvil)

  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'lead' || currentUser?.isSystemAdmin;

  // --- GENERAR DÍAS DEL CALENDARIO ---
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // --- HANDLERS ---

  const handleAddTask = () => {
    if (newTaskText && isAddingTask) {
      // Guardamos la fecha en las notas o en un campo específico si existiera
      // Aquí simulamos guardando la fecha ISO en las notas para filtrarlo luego
      const dateTag = format(isAddingTask, 'yyyy-MM-dd');
      
      createTaskMutation.mutate({
        text: newTaskText,
        assignedTo: 'Team',
        notes: `DATE:${dateTag}`, // Truco para persistir fecha sin cambiar DB
        completed: false
      });
      
      setNewTaskText("");
      setIsAddingTask(null);
    }
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTaskMutation.mutate(id);
  };

  // Helper para obtener tareas de un día específico
  const getTasksForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    
    // 1. Tareas Puntuales (Filtradas por nuestra etiqueta mágica DATE:YYYY-MM-DD)
    const dailyTasks = tasks.filter((t: any) => t.notes?.includes(`DATE:${dateStr}`));
    
    // 2. Rutinas Diarias (Siempre aparecen, pero calculamos su estado para HOY)
    // Nota: El backend actual no guarda histórico diario de checklists, así que mostramos el estado actual
    // Solo mostramos checklists si el día es HOY (para no confundir historial)
    const isDayToday = isToday(day);
    const dailyRoutines = isDayToday ? [
        { id: 'opening-group', text: `Opening (${openingList.filter((i:any)=>i.completed).length}/${openingList.length})`, type: 'routine', completed: openingList.every((i:any)=>i.completed) && openingList.length > 0 },
        { id: 'closing-group', text: `Closing (${closingList.filter((i:any)=>i.completed).length}/${closingList.length})`, type: 'routine', completed: closingList.every((i:any)=>i.completed) && closingList.length > 0 }
    ] : [];

    return [...dailyRoutines, ...dailyTasks];
  };

  return (
    <Layout title="Operations Calendar" showBack>
      
      {/* 1. CABECERA DEL MES */}
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-2xl font-black text-white capitalize">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="rounded-full border-white/10 hover:bg-white/10">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentMonth(new Date())} className="rounded-full border-white/10 hover:bg-white/10 text-xs font-bold">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="rounded-full border-white/10 hover:bg-white/10">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 2. GRID DEL CALENDARIO */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-[10px] uppercase font-bold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 auto-rows-fr bg-white/5 p-1 rounded-2xl border border-white/5">
        {calendarDays.map((day, dayIdx) => {
          const isSelectedMonth = isSameMonth(day, currentMonth);
          const isDayToday = isToday(day);
          const dayTasks = getTasksForDay(day);

          return (
            <div
              key={day.toString()}
              onClick={() => setViewingDay(day)}
              className={cn(
                "min-h-[100px] p-2 rounded-xl border flex flex-col gap-1 transition-all cursor-pointer relative group overflow-hidden",
                isSelectedMonth ? "bg-black/40 border-white/5 hover:border-white/20" : "bg-black/20 border-transparent opacity-50",
                isDayToday && "ring-1 ring-flow-green bg-flow-green/5"
              )}
            >
              {/* Número del día */}
              <div className="flex justify-between items-start">
                <span className={cn(
                  "text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full",
                  isDayToday ? "bg-flow-green text-black shadow-lg shadow-green-500/20" : "text-muted-foreground"
                )}>
                  {format(day, 'd')}
                </span>
                
                {/* Botón Añadir (Solo visible en hover o si es hoy) */}
                {canEdit && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsAddingTask(day); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded text-muted-foreground hover:text-white"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                )}
              </div>

              {/* Lista de Tareas (Resumida) */}
              <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                {dayTasks.map((task: any, i) => (
                    <div 
                        key={i} 
                        className={cn(
                            "text-[9px] px-1.5 py-1 rounded truncate flex items-center justify-between group/task",
                            task.type === 'routine' 
                                ? (task.completed ? "bg-flow-green/20 text-flow-green" : "bg-white/5 text-muted-foreground")
                                : (task.completed ? "bg-purple-500/20 text-purple-400 line-through" : "bg-purple-500/10 text-purple-200 border border-purple-500/20")
                        )}
                    >
                        <span className="truncate">{task.text}</span>
                        {task.type !== 'routine' && canEdit && (
                            <button onClick={(e) => handleDeleteTask(task.id, e)} className="hidden group-hover/task:block text-flow-red ml-1">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. MODAL: DETALLES DEL DÍA (Para ver mejor en móvil) */}
      <Dialog open={!!viewingDay && !isAddingTask} onOpenChange={(open) => !open && setViewingDay(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-0 overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-6 pb-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <div>
                    <h3 className="text-xl font-bold text-white">{viewingDay && format(viewingDay, 'EEEE, MMMM do')}</h3>
                    <p className="text-sm text-muted-foreground">Daily Overview</p>
                </div>
                {canEdit && (
                    <Button size="sm" onClick={() => setIsAddingTask(viewingDay)} className="bg-white/10 hover:bg-white/20 text-white border border-white/5">
                        <Plus className="w-4 h-4 mr-2" /> Add Task
                    </Button>
                )}
            </div>
            
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {viewingDay && getTasksForDay(viewingDay).length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground opacity-50">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-3 stroke-1" />
                        <p>No tasks planned for this day.</p>
                    </div>
                ) : (
                    viewingDay && getTasksForDay(viewingDay).map((task: any, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-white/5">
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                task.completed ? "bg-flow-green/10 text-flow-green" : "bg-white/5 text-muted-foreground"
                            )}>
                                {task.completed ? <Check className="w-5 h-5" /> : (task.type==='routine' ? <Clock className="w-5 h-5"/> : <Camera className="w-5 h-5"/>)}
                            </div>
                            <div className="flex-1">
                                <p className={cn("text-sm font-medium", task.completed && "line-through text-muted-foreground")}>{task.text}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">
                                    {task.type === 'routine' ? 'Routine Checklist' : 'Scheduled Task'}
                                </p>
                            </div>
                            {task.type !== 'routine' && canEdit && (
                                <Button variant="ghost" size="icon" onClick={(e) => handleDeleteTask(task.id, e)} className="text-muted-foreground hover:text-flow-red">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </DialogContent>
      </Dialog>

      {/* 4. MODAL: AÑADIR TAREA */}
      <Dialog open={!!isAddingTask} onOpenChange={() => setIsAddingTask(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Add Task for {isAddingTask && format(isAddingTask, 'MMM do')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Task Description</label>
            <Input 
                autoFocus
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="e.g. Deep Clean Fryer"
                className="bg-black/20 border-white/10"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAddTask} className="w-full bg-blue-500 text-white font-bold">Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}
