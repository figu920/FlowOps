import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Search, CheckCircle2, 
  Camera, ChevronDown, ChevronUp, FolderPlus, 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon
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
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Estados UI
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['Opening', 'Shift', 'Closing']); 

  // Modales
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  
  // Formulario
  const [taskText, setTaskText] = useState("");
  const [taskCategory, setTaskCategory] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'lead' || currentUser?.isSystemAdmin;

  // --- LÓGICA DEL CALENDARIO MENSUAL ---
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // --- AGRUPACIÓN DE TAREAS ---
  const groupedTasks = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    // Aquí podrías filtrar por 'selectedDate' si el backend soportara fechas
    // Por ahora mostramos las tareas globales para la demo
    tasks.forEach((task: any) => {
      const cat = task.category || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(task);
    });

    if (searchQuery.trim()) {
       Object.keys(groups).forEach(key => {
         groups[key] = groups[key].filter((t: any) => t.text.toLowerCase().includes(searchQuery.toLowerCase()));
         if (groups[key].length === 0) delete groups[key];
       });
    }

    return groups;
  }, [tasks, searchQuery, selectedDate]);

  const sortedCategories = Object.keys(groupedTasks).sort((a, b) => {
     const order = ['Opening', 'Shift', 'Closing'];
     const idxA = order.indexOf(a);
     const idxB = order.indexOf(b);
     if (idxA !== -1 && idxB !== -1) return idxA - idxB;
     if (idxA !== -1) return -1;
     if (idxB !== -1) return 1;
     return a.localeCompare(b);
  });

  // --- HANDLERS ---

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => 
      prev.includes(folder) ? prev.filter(f => f !== folder) : [...prev, folder]
    );
  };

  const handleOpenAddTask = (category: string) => {
      setTaskText("");
      setTaskCategory(category);
      setTaskAssignee("");
      setEditingTask(null);
      setIsAddingTask(true);
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
          completed: editingTask ? editingTask.completed : false
      };

      if (editingTask) {
          updateTaskMutation.mutate({ id: editingTask.id, updates: data });
      } else {
          createTaskMutation.mutate(data);
      }
      setIsAddingTask(false);
  };

  const handleDeleteTask = (id: string) => {
      if (confirm("Delete this task?")) {
          deleteTaskMutation.mutate(id);
      }
  };

  const toggleTaskCompletion = (task: any) => {
      updateTaskMutation.mutate({ 
          id: task.id, 
          updates: { completed: !task.completed } 
      });
  };

  const handleCreateFolder = () => {
      if (!newFolderName.trim()) return;
      createTaskMutation.mutate({
          text: "New task",
          category: newFolderName,
          assignee: "Team",
          completed: false
      });
      setIsAddingFolder(false);
      setNewFolderName("");
  };

  return (
    <Layout title="Operations Calendar" showBack={false}>
      
      {/* --- CALENDARIO MENSUAL --- */}
      <div className="mb-6 space-y-4">
        
        {/* Cabecera del Mes */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={prevMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-white tracking-tight w-32 text-center">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button onClick={nextMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
            
            {canEdit && (
                <button 
                    onClick={() => setIsAddingFolder(true)}
                    className="bg-flow-blue/20 hover:bg-flow-blue/30 text-flow-blue px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-flow-blue/20"
                >
                    <FolderPlus className="w-3 h-3" /> New
                </button>
            )}
        </div>

        {/* Rejilla del Calendario */}
        <div className="bg-card rounded-3xl p-4 border border-white/[0.04]">
            {/* Días Semana */}
            <div className="grid grid-cols-7 mb-2">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                    <div key={day} className="text-center text-[10px] uppercase font-bold text-muted-foreground opacity-50">
                        {day}
                    </div>
                ))}
            </div>

            {/* Días Mes */}
            <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                {calendarDays.map((date, idx) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const isCurrentMonth = isSameMonth(date, currentMonth);
                    // Mock de indicadores: Si es el día seleccionado o hoy, mostramos "actividad"
                    const hasActivity = isSelected || isSameDay(date, new Date());

                    return (
                        <button
                            key={idx}
                            onClick={() => setSelectedDate(date)}
                            className={cn(
                                "h-12 rounded-xl flex flex-col items-center justify-center relative transition-all border",
                                isSelected 
                                    ? "bg-flow-blue text-white border-flow-blue shadow-lg shadow-blue-500/20 z-10" 
                                    : "bg-transparent border-transparent hover:bg-white/5",
                                !isCurrentMonth && "opacity-20"
                            )}
                        >
                            <span className={cn("text-xs font-bold", isSelected ? "text-white" : "text-white/80")}>
                                {format(date, 'd')}
                            </span>
                            
                            {/* "Opciones Dentro" (Indicadores Visuales) */}
                            <div className="flex gap-0.5 mt-1">
                                {hasActivity && (
                                    <>
                                        <div className="w-1 h-1 rounded-full bg-blue-400" /> {/* Opening */}
                                        <div className="w-1 h-1 rounded-full bg-orange-400" /> {/* Shift */}
                                        <div className="w-1 h-1 rounded-full bg-purple-400" /> {/* Closing */}
                                    </>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Fecha Seleccionada Texto */}
        <div className="px-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-flow-blue" />
                {format(selectedDate, 'EEEE, MMM do')}
            </h3>
        </div>

        {/* Buscador */}
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tasks..."
                className="pl-9 bg-black/20 border-white/10 h-10 rounded-xl"
            />
        </div>
      </div>

      {/* --- LISTA DE TAREAS (Detalle del día) --- */}
      <div className="space-y-3 pb-20">
        {sortedCategories.map(category => {
            const isExpanded = expandedFolders.includes(category);
            const items = groupedTasks[category];
            const completedCount = items.filter((t: any) => t.completed).length;
            
            // Color por defecto según carpeta para dar identidad visual
            const folderColor = category === 'Opening' ? 'text-blue-400 bg-blue-500/10' : 
                                category === 'Closing' ? 'text-purple-400 bg-purple-500/10' : 
                                'text-orange-400 bg-orange-500/10';

            return (
                <motion.div 
                    key={category}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-[20px] border border-white/[0.04] overflow-hidden"
                >
                    {/* Cabecera Carpeta */}
                    <div 
                        onClick={() => toggleFolder(category)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", folderColor)}>
                                <FolderPlus className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">{category}</h3>
                                <p className="text-[10px] text-muted-foreground">
                                    {completedCount}/{items.length} tasks
                                </p>
                            </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground"/> : <ChevronDown className="w-4 h-4 text-muted-foreground"/>}
                    </div>

                    {/* Tareas */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="border-t border-white/[0.04] bg-black/20"
                            >
                                <div className="p-2 space-y-1">
                                    {items.map((task: any) => (
                                        <div 
                                            key={task.id} 
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl transition-all group",
                                                task.completed ? "bg-green-500/5 opacity-70" : "hover:bg-white/5"
                                            )}
                                        >
                                            <button 
                                                onClick={() => toggleTaskCompletion(task)}
                                                className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0",
                                                    task.completed 
                                                        ? "bg-flow-green border-flow-green text-black" 
                                                        : "border-white/20 hover:border-white/40 text-transparent"
                                                )}
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-xs font-medium truncate", task.completed && "line-through text-muted-foreground")}>
                                                    {task.text}
                                                </p>
                                                {task.assignee && <p className="text-[9px] text-muted-foreground">@{task.assignee}</p>}
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button className="p-1.5 text-muted-foreground hover:text-white rounded-lg hover:bg-white/10"><Camera className="w-3.5 h-3.5" /></button>
                                                {canEdit && (
                                                    <>
                                                        <button onClick={() => handleOpenEditTask(task)} className="p-1.5 text-muted-foreground hover:text-flow-blue rounded-lg hover:bg-flow-blue/10"><Edit2 className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-muted-foreground hover:text-flow-red rounded-lg hover:bg-flow-red/10"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {canEdit && (
                                        <button 
                                            onClick={() => handleOpenAddTask(category)}
                                            className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg mt-1 border border-dashed border-white/10"
                                        >
                                            <Plus className="w-3 h-3" /> Add Task
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            );
        })}

        {sortedCategories.length === 0 && (
            <div className="text-center py-12 text-muted-foreground opacity-50">
                <p>No tasks for this day.</p>
                {canEdit && <Button onClick={() => setIsAddingFolder(true)} variant="link" className="text-flow-blue">Create List</Button>}
            </div>
        )}
      </div>

      {/* --- MODALES (Igual que antes) --- */}
      
      {/* Añadir/Editar Tarea */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader><DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
              <div><label className="text-xs font-bold text-muted-foreground mb-1 block">Description</label><Input value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="e.g. Turn on grill" className="bg-black/20 border-white/10" autoFocus /></div>
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-muted-foreground mb-1 block">Category</label><Input value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="bg-black/20 border-white/10" /></div>
                  <div><label className="text-xs font-bold text-muted-foreground mb-1 block">Assignee</label><Input value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} placeholder="Team" className="bg-black/20 border-white/10" /></div>
              </div>
          </div>
          <DialogFooter><Button onClick={handleSaveTask} className="w-full bg-flow-blue text-white font-bold">Save Task</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nueva Carpeta */}
      <Dialog open={isAddingFolder} onOpenChange={setIsAddingFolder}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader><DialogTitle>New Task List</DialogTitle></DialogHeader>
          <div className="py-4"><label className="text-xs font-bold text-muted-foreground mb-1 block">List Name</label><Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="e.g. Deep Clean" className="bg-black/20 border-white/10" autoFocus /></div>
          <DialogFooter><Button onClick={handleCreateFolder} className="w-full bg-flow-blue text-white font-bold">Create List</Button></DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}