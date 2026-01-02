import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Search, CheckCircle2, 
  Camera, ChevronDown, ChevronUp, 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Sun, Moon, Clock, X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, 
  isSameDay, isSameMonth 
} from 'date-fns';

export default function Schedule() {
  const { currentUser } = useStore();
  const { data: tasks = [] } = useTasks();
  
  // Mutaciones
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  // Estados de Calendario
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Fecha seleccionada para el modal
  const [isDayOpen, setIsDayOpen] = useState(false); // Controla si el "desplegable" del día está abierto

  // Estados UI
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['Opening', 'Shift', 'Closing']); 

  // Modales de Tarea (Crear/Editar)
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  
  // Formulario
  const [taskText, setTaskText] = useState("");
  const [taskCategory, setTaskCategory] = useState(""); 
  const [taskAssignee, setTaskAssignee] = useState("");

  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'lead' || currentUser?.isSystemAdmin;

  // --- CONSTANTES ---
  const FIXED_CATEGORIES = [
    { id: 'Opening', label: 'Opening', icon: Sun, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'Shift', label: 'Shift', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { id: 'Closing', label: 'Closing', icon: Moon, color: 'text-purple-400', bg: 'bg-purple-500/10' }
  ];

  // --- LÓGICA CALENDARIO ---
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // --- HANDLERS ---

  const handleDayClick = (date: Date) => {
      setSelectedDate(date);
      setIsDayOpen(true); // Abrimos el modal del día
  };

  const getTasksForDayAndCategory = (category: string) => {
      // AQUÍ FILTRAMOS POR CATEGORÍA
      // (Nota: En un backend real, aquí añadirías el filtro por fecha: && isSameDay(new Date(t.date), selectedDate))
      // Como simulamos, mostramos las tareas globales de esa categoría.
      return tasks.filter((t: any) => t.category === category);
  };

  const handleOpenAddTask = (category: string) => {
      setTaskText("");
      setTaskCategory(category);
      setTaskAssignee("");
      setEditingTask(null);
      setIsAddingTask(true); // Abre modal de crear tarea SOBRE el modal del día
  };

  const handleOpenEditTask = (task: any) => {
      setTaskText(task.text);
      setTaskCategory(task.category);
      setTaskAssignee(task.assignee || "");
      setEditingTask(task);
      setIsAddingTask(true);
  };

  const handleSaveTask = () => {
      if (!taskText.trim()) return;
      const data = {
          text: taskText,
          category: taskCategory,
          assignee: taskAssignee || "Team",
          completed: editingTask ? editingTask.completed : false,
          // date: selectedDate // Aquí guardaríamos la fecha si el backend lo soporta
      };

      if (editingTask) {
          updateTaskMutation.mutate({ id: editingTask.id, updates: data });
      } else {
          createTaskMutation.mutate(data);
      }
      setIsAddingTask(false);
  };

  const handleDeleteTask = (id: string) => {
      if (confirm("Delete this task?")) deleteTaskMutation.mutate(id);
  };

  const toggleTaskCompletion = (task: any) => {
      updateTaskMutation.mutate({ id: task.id, updates: { completed: !task.completed } });
  };

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => prev.includes(folder) ? prev.filter(f => f !== folder) : [...prev, folder]);
  };

  return (
    <Layout title="Operations Calendar" showBack={false}>
      
      {/* --- VISTA PRINCIPAL: SOLO CALENDARIO --- */}
      <div className="mb-6 space-y-4">
        {/* Cabecera Mes */}
        <div className="flex items-center justify-between px-2">
            <button onClick={prevMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white tracking-tight">
                {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button onClick={nextMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>

        {/* Rejilla Calendario */}
        <div className="bg-card rounded-3xl p-4 border border-white/[0.04] shadow-xl">
            <div className="grid grid-cols-7 mb-3">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                    <div key={day} className="text-center text-[10px] uppercase font-bold text-muted-foreground opacity-50">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                {calendarDays.map((date, idx) => {
                    const isToday = isSameDay(date, new Date());
                    const isCurrentMonth = isSameMonth(date, currentMonth);
                    
                    // Indicadores Visuales (Simulados)
                    const hasOpening = tasks.some((t:any) => t.category === 'Opening'); 
                    const hasClosing = tasks.some((t:any) => t.category === 'Closing');
                    // Mostrar puntos si es hoy o aleatorio para demo (en real usarías la fecha de la tarea)
                    const showDots = isToday; 

                    return (
                        <button
                            key={idx}
                            onClick={() => handleDayClick(date)}
                            className={cn(
                                "h-14 rounded-xl flex flex-col items-center justify-center relative transition-all border",
                                isToday 
                                    ? "bg-flow-blue text-white border-flow-blue shadow-lg shadow-blue-500/20 z-10" 
                                    : "bg-transparent border-transparent hover:bg-white/5",
                                !isCurrentMonth && "opacity-20"
                            )}
                        >
                            <span className={cn("text-sm font-bold", isToday ? "text-white" : "text-white/80")}>
                                {format(date, 'd')}
                            </span>
                            
                            {/* Puntos de estado del día */}
                            <div className="flex gap-0.5 mt-1 h-1.5">
                                {showDots && (
                                    <>
                                        {hasOpening && <div className="w-1 h-1 rounded-full bg-blue-400" />}
                                        {hasClosing && <div className="w-1 h-1 rounded-full bg-purple-400" />}
                                    </>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
        
        <div className="text-center text-xs text-muted-foreground mt-4">
            Tap a day to view or edit tasks.
        </div>
      </div>

      {/* --- DESPLEGABLE / MODAL DEL DÍA SELECCIONADO --- */}
      <Dialog open={isDayOpen} onOpenChange={setIsDayOpen}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[95%] max-w-lg rounded-2xl p-0 overflow-hidden max-h-[85vh] flex flex-col">
            
            {/* Cabecera del Día */}
            <div className="p-6 bg-white/5 border-b border-white/5">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            {selectedDate && format(selectedDate, 'EEEE, MMM do')}
                        </h2>
                        <p className="text-muted-foreground text-sm font-medium">Daily Task Manager</p>
                    </div>
                    <button onClick={() => setIsDayOpen(false)} className="p-2 bg-black/20 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Contenido (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {FIXED_CATEGORIES.map(category => {
                    const isExpanded = expandedFolders.includes(category.id);
                    const items = getTasksForDayAndCategory(category.id);
                    const CategoryIcon = category.icon;

                    return (
                        <div key={category.id} className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                            {/* Título Categoría */}
                            <div 
                                onClick={() => toggleFolder(category.id)}
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", category.color, category.bg)}>
                                        <CategoryIcon className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-white">{category.label}</span>
                                </div>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground"/> : <ChevronDown className="w-4 h-4 text-muted-foreground"/>}
                            </div>

                            {/* Lista Tareas */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div 
                                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                        className="border-t border-white/5"
                                    >
                                        <div className="p-2 space-y-1">
                                            {items.length === 0 && (
                                                <p className="text-center text-[10px] text-muted-foreground py-2 italic">No tasks yet.</p>
                                            )}
                                            
                                            {items.map((task: any) => (
                                                <div key={task.id} className={cn("flex items-center gap-3 p-3 rounded-xl transition-all group", task.completed ? "bg-green-500/5 opacity-60" : "bg-white/5")}>
                                                    <button 
                                                        onClick={() => toggleTaskCompletion(task)}
                                                        className={cn("w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-colors", task.completed ? "bg-flow-green border-flow-green text-black" : "border-white/20 hover:border-white/40 text-transparent")}
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn("text-xs font-medium truncate", task.completed && "line-through")}>{task.text}</p>
                                                        {task.assignee && <p className="text-[9px] text-muted-foreground">@{task.assignee}</p>}
                                                    </div>
                                                    {canEdit && (
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleOpenEditTask(task)} className="p-1.5 text-muted-foreground hover:text-white bg-white/5 rounded-lg"><Edit2 className="w-3 h-3" /></button>
                                                            <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-muted-foreground hover:text-red-400 bg-white/5 rounded-lg"><Trash2 className="w-3 h-3" /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {canEdit && (
                                                <button 
                                                    onClick={() => handleOpenAddTask(category.id)}
                                                    className="w-full py-2.5 flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg border border-dashed border-white/10 mt-2 transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" /> Add to {category.label}
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL: CREAR/EDITAR TAREA (ENCIMA DEL OTRO) --- */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6 z-[60]">
          <DialogHeader><DialogTitle>{editingTask ? 'Edit Task' : `New ${taskCategory} Task`}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
              <div><label className="text-xs font-bold text-muted-foreground mb-1 block">Description</label><Input value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="e.g. Turn on grill" className="bg-black/20 border-white/10" autoFocus /></div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Category</label>
                      <div className="h-10 px-3 py-2 rounded-md border border-white/10 bg-white/5 text-sm text-muted-foreground flex items-center">{taskCategory}</div>
                  </div>
                  <div><label className="text-xs font-bold text-muted-foreground mb-1 block">Assignee</label><Input value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} placeholder="Team" className="bg-black/20 border-white/10" /></div>
              </div>
          </div>
          <DialogFooter><Button onClick={handleSaveTask} className="w-full bg-flow-blue text-white font-bold">Save Task</Button></DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}