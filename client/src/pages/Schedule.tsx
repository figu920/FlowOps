import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useUsers } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, CheckCircle2, 
  ChevronDown, ChevronUp, 
  ChevronLeft, ChevronRight, 
  Sun, Moon, Clock, User
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, 
  isSameDay, isSameMonth, parseISO
} from 'date-fns';

export default function Schedule() {
  const { currentUser } = useStore();
  const { data: tasks = [] } = useTasks();
  const { data: allUsers = [] } = useUsers(); 
  
  const activeEmployees = useMemo(() => {
    return allUsers.filter((u: any) => u.status === 'active');
  }, [allUsers]);

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayOpen, setIsDayOpen] = useState(false);

  const [expandedFolders, setExpandedFolders] = useState<string[]>(['Opening', 'Shift', 'Closing']); 

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  
  // Formulario
  const [taskText, setTaskText] = useState("");
  const [taskCategory, setTaskCategory] = useState(""); 
  const [taskAssignee, setTaskAssignee] = useState("Team"); 

  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'lead' || currentUser?.isSystemAdmin;

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
      setIsDayOpen(true);
  };

  // 1. FILTRADO ROBUSTO (Igual que Inventory filtra por path, aquí filtramos por fecha exacta)
  const getTasksForDayAndCategory = (category: string) => {
      if (!tasks || !selectedDate) return [];

      return tasks.filter((t: any) => {
          // Si no tiene fecha, lo ignoramos
          if (!t.date) return false;
          
          // Convertimos la fecha de la DB a objeto Date de forma segura
          const taskDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
          
          // Verificamos si es válida
          if (isNaN(taskDate.getTime())) return false;

          // Comparamos
          const isCategoryMatch = t.category === category;
          const isDateMatch = isSameDay(taskDate, selectedDate);

          return isCategoryMatch && isDateMatch;
      });
  };

  const handleOpenAddTask = (category: string) => {
      setTaskText("");
      setTaskCategory(category);
      setTaskAssignee("Team");
      setEditingTask(null);
      setIsAddingTask(true);
  };

  const handleOpenEditTask = (task: any) => {
      setTaskText(task.text);
      setTaskCategory(task.category);
      setTaskAssignee(task.assignee || "Team");
      setEditingTask(task);
      setIsAddingTask(true);
  };

  // 2. GUARDADO (Réplica exacta de la estructura de Inventory.tsx)
  const handleSaveTask = () => {
      if (taskText.trim()) {
        // Aseguramos que la fecha sea un string ISO estándar
        const dateToSave = selectedDate ? selectedDate.toISOString() : new Date().toISOString();

        const data = {
            text: taskText,
            category: taskCategory,
            assignee: taskAssignee,
            completed: editingTask ? editingTask.completed : false,
            date: dateToSave, 
        };

        if (editingTask) {
            updateTaskMutation.mutate({ id: editingTask.id, updates: data });
        } else {
            createTaskMutation.mutate(data);
        }

        // Limpieza de estado igual que en Inventory
        setIsAddingTask(false);
        setTaskText("");
      }
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
    <Layout title="Operations Calendar" showBack={true}>
      
      {/* --- VISTA CALENDARIO --- */}
      <div className="mb-6 space-y-4">
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
                    const isSelected = selectedDate && isSameDay(date, selectedDate); // Highlight selección
                    
                    // Cálculo de puntos (dots) optimizado
                    const dayTasks = tasks.filter((t: any) => {
                        if(!t.date) return false;
                        const tDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
                        return isSameDay(tDate, date);
                    });
                    
                    const hasOpening = dayTasks.some((t:any) => t.category === 'Opening'); 
                    const hasClosing = dayTasks.some((t:any) => t.category === 'Closing');
                    
                    // Mostrar puntos si hay tareas O si es hoy
                    const showDots = dayTasks.length > 0 || isToday; 

                    return (
                        <button
                            key={idx}
                            onClick={() => handleDayClick(date)}
                            className={cn(
                                "h-14 rounded-xl flex flex-col items-center justify-center relative transition-all border",
                                isToday 
                                    ? "bg-flow-blue text-white border-flow-blue shadow-lg shadow-blue-500/20 z-10" 
                                    : isSelected 
                                        ? "bg-white/10 border-white/20 text-white"
                                        : "bg-transparent border-transparent hover:bg-white/5",
                                !isCurrentMonth && "opacity-20"
                            )}
                        >
                            <span className={cn("text-sm font-bold", isToday ? "text-white" : "text-white/80")}>
                                {format(date, 'd')}
                            </span>
                            <div className="flex gap-0.5 mt-1 h-1.5">
                                {showDots && (
                                    <>
                                        {hasOpening && <div className="w-1 h-1 rounded-full bg-blue-400" />}
                                        {hasClosing && <div className="w-1 h-1 rounded-full bg-purple-400" />}
                                        {!hasOpening && !hasClosing && isToday && <div className="w-1 h-1 rounded-full bg-white/50" />}
                                    </>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
      </div>

      {/* --- DESPLEGABLE DEL DÍA --- */}
      <Dialog open={isDayOpen} onOpenChange={setIsDayOpen}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[95%] max-w-lg rounded-2xl p-0 overflow-hidden max-h-[85vh] flex flex-col z-[50]">
            
            <div className="p-6 bg-white/5 border-b border-white/5">
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    {selectedDate && format(selectedDate, 'EEEE, MMM do')}
                </h2>
                <p className="text-muted-foreground text-sm font-medium">Daily Task Manager</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {FIXED_CATEGORIES.map(category => {
                    const isExpanded = expandedFolders.includes(category.id);
                    const items = getTasksForDayAndCategory(category.id);
                    const CategoryIcon = category.icon;

                    return (
                        <div key={category.id} className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                            <div onClick={() => toggleFolder(category.id)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", category.color, category.bg)}>
                                        <CategoryIcon className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-white">{category.label}</span>
                                </div>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground"/> : <ChevronDown className="w-4 h-4 text-muted-foreground"/>}
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-white/5">
                                        <div className="p-2 space-y-1">
                                            {items.map((task: any) => (
                                                <div key={task.id} className={cn("flex items-center gap-3 p-3 rounded-xl transition-all group", task.completed ? "bg-green-500/5 opacity-60" : "bg-white/5")}>
                                                    <button onClick={() => toggleTaskCompletion(task)} className={cn("w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-colors", task.completed ? "bg-flow-green border-flow-green text-black" : "border-white/20 hover:border-white/40 text-transparent")}>
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn("text-xs font-medium truncate", task.completed && "line-through")}>{task.text}</p>
                                                        {task.assignee && <p className="text-[9px] text-muted-foreground flex items-center gap-1"><User className="w-3 h-3"/> {task.assignee}</p>}
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
                                                <button onClick={() => handleOpenAddTask(category.id)} className="w-full py-2.5 flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg border border-dashed border-white/10 mt-2 transition-colors">
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

      {/* --- MODAL CREAR TAREA --- */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6 z-[60]">
          <DialogHeader><DialogTitle>{editingTask ? 'Edit Task' : `New ${taskCategory} Task`}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
              <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Description</label>
                  <Input 
                    value={taskText} 
                    onChange={(e) => setTaskText(e.target.value)} 
                    placeholder="e.g. Turn on grill" 
                    className="bg-black/20 border-white/10" 
                    autoFocus 
                  />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Category</label>
                      <div className="h-10 px-3 py-2 rounded-md border border-white/10 bg-white/5 text-sm text-muted-foreground flex items-center">{taskCategory}</div>
                  </div>
                  
                  <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Assignee</label>
                      <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                        <SelectTrigger className="bg-black/20 border-white/10 h-10">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        
                        <SelectContent 
                            className="bg-[#1C1C1E] border-white/10 text-white z-[100]" 
                            position="popper" 
                            sideOffset={5}
                        >
                            <SelectItem value="Team">Team</SelectItem>
                            {activeEmployees.map((emp: any) => (
                                <SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                  </div>
              </div>
          </div>
          <DialogFooter>
              <Button onClick={handleSaveTask} className="w-full bg-flow-blue text-white font-bold">
                  {editingTask ? 'Update' : 'Save Task'}
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}