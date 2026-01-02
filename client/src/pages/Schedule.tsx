import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/lib/hooks'; // Asegúrate de tener useDeleteTask
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Search, X, CheckCircle2, Circle, 
  Camera, ChevronDown, ChevronUp, FolderPlus, CalendarDays 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';

export default function Schedule() {
  const { currentUser } = useStore();
  // Datos
  const { data: tasks = [] } = useTasks();
  
  // Mutaciones
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask(); // 🗑️ El hook para borrar

  // Estados
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['Opening', 'Shift', 'Closing']); // Carpetas abiertas por defecto

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

  // --- AGRUPACIÓN DE TAREAS ---
  const groupedTasks = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    // 1. Agrupar por categoría
    tasks.forEach((task: any) => {
      const cat = task.category || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(task);
    });

    // 2. Filtrar por búsqueda
    if (searchQuery.trim()) {
       Object.keys(groups).forEach(key => {
         groups[key] = groups[key].filter((t: any) => t.text.toLowerCase().includes(searchQuery.toLowerCase()));
         if (groups[key].length === 0) delete groups[key];
       });
    }

    return groups;
  }, [tasks, searchQuery]);

  // Orden de carpetas (Opening primero, etc.)
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
      if (confirm("Delete this task permanently?")) {
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
      // Creamos una tarea dummy para inicializar la carpeta o simplemente preparamos el UI
      // En este sistema basado en items, creamos una tarea placeholder
      createTaskMutation.mutate({
          text: "Check area",
          category: newFolderName,
          assignee: "Team",
          completed: false
      });
      setIsAddingFolder(false);
      setNewFolderName("");
  };

  return (
    <Layout title="Operations Calendar" showBack={false}>
      
      {/* CABECERA: FECHA Y BUSCADOR */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {format(new Date(), 'EEEE, MMM do')}
                </h2>
                <p className="text-xs text-muted-foreground">Daily Operations Hub</p>
            </div>
            {canEdit && (
                <button 
                    onClick={() => setIsAddingFolder(true)}
                    className="bg-flow-blue/20 hover:bg-flow-blue/30 text-flow-blue px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-flow-blue/20"
                >
                    <FolderPlus className="w-3 h-3" /> New Folder
                </button>
            )}
        </div>

        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="pl-9 bg-black/20 border-white/10 h-10 rounded-xl"
            />
        </div>
      </div>

      {/* LISTA DE CARPETAS Y TAREAS */}
      <div className="space-y-4 pb-20">
        {sortedCategories.map(category => {
            const isExpanded = expandedFolders.includes(category);
            const items = groupedTasks[category];
            const completedCount = items.filter((t: any) => t.completed).length;
            
            return (
                <motion.div 
                    key={category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-[24px] border border-white/[0.04] overflow-hidden"
                >
                    {/* CABECERA DE CARPETA */}
                    <div 
                        onClick={() => toggleFolder(category)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <CalendarDays className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{category}</h3>
                                <p className="text-[10px] text-muted-foreground">
                                    {completedCount}/{items.length} done
                                </p>
                            </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground"/> : <ChevronDown className="w-5 h-5 text-muted-foreground"/>}
                    </div>

                    {/* LISTA DE TAREAS */}
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
                                                task.completed ? "bg-green-500/5" : "hover:bg-white/5"
                                            )}
                                        >
                                            {/* CHECKBOX */}
                                            <button 
                                                onClick={() => toggleTaskCompletion(task)}
                                                className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0",
                                                    task.completed 
                                                        ? "bg-flow-green border-flow-green text-black" 
                                                        : "border-white/20 hover:border-white/40 text-transparent"
                                                )}
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>

                                            {/* TEXTO */}
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-sm font-medium truncate transition-all",
                                                    task.completed ? "text-muted-foreground line-through" : "text-white"
                                                )}>
                                                    {task.text}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    @{task.assignee}
                                                </p>
                                            </div>

                                            {/* ACCIONES: CÁMARA | EDITAR | BORRAR */}
                                            <div className="flex items-center gap-1">
                                                <button className="p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                                    <Camera className="w-4 h-4" />
                                                </button>
                                                
                                                {canEdit && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleOpenEditTask(task)}
                                                            className="p-2 text-muted-foreground hover:text-flow-blue hover:bg-flow-blue/10 rounded-full transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        {/* 🗑️ BOTÓN DE BORRAR AÑADIDO */}
                                                        <button 
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            className="p-2 text-muted-foreground hover:text-flow-red hover:bg-flow-red/10 rounded-full transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* BOTÓN AÑADIR TAREA */}
                                    {canEdit && (
                                        <button 
                                            onClick={() => handleOpenAddTask(category)}
                                            className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-all mt-2 border border-dashed border-white/10"
                                        >
                                            <Plus className="w-4 h-4" /> Add Task to {category}
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
                <p>No tasks for today.</p>
                {canEdit && <Button onClick={() => setIsAddingFolder(true)} variant="link" className="text-flow-blue">Create First Folder</Button>}
            </div>
        )}
      </div>

      {/* MODAL: AÑADIR / EDITAR TAREA */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader><DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
              <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Task Description</label>
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
                      <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Category</label>
                      <Input value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="bg-black/20 border-white/10" />
                  </div>
                  <div>
                      <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Assignee</label>
                      <Input value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} placeholder="Team" className="bg-black/20 border-white/10" />
                  </div>
              </div>
          </div>
          <DialogFooter>
              <Button onClick={handleSaveTask} className="w-full bg-flow-blue text-white font-bold">Save Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: NUEVA CARPETA */}
      <Dialog open={isAddingFolder} onOpenChange={setIsAddingFolder}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader><DialogTitle>New Folder Group</DialogTitle></DialogHeader>
          <div className="py-4">
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Folder Name</label>
              <Input 
                value={newFolderName} 
                onChange={(e) => setNewFolderName(e.target.value)} 
                placeholder="e.g. Pre-Opening, Deep Cleaning..." 
                className="bg-black/20 border-white/10"
                autoFocus
              />
          </div>
          <DialogFooter>
              <Button onClick={handleCreateFolder} className="w-full bg-flow-blue text-white font-bold">Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}