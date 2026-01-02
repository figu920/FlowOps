import { useState, useMemo, useRef } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { 
  useChecklists, useUpdateChecklist, 
  useTasks, useCompleteTask, useCreateTask, useDeleteTask, useUsers 
} from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Plus, Trash2, Camera, 
  ChevronLeft, ChevronRight, Search, FolderPlus, Folder, 
  ChevronDown, ChevronUp, Sun, Moon, Clock, User 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isToday 
} from 'date-fns';

// --- COMPONENTE MINI PROGRESO CIRCULAR ---
const CircularProgress = ({ percentage, size = 32, strokeWidth = 3, color = "text-flow-green" }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Fondo del anillo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/10"
        />
        {/* Progreso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-500 ease-out", color)}
        />
      </svg>
      {/* Texto Porcentaje (Opcional, pequeño en el centro) */}
      <span className="absolute text-[8px] font-bold text-white">{Math.round(percentage)}%</span>
    </div>
  );
};

export default function Schedule({ categoryColor = '#3B82F6' }: { categoryColor?: string }) {
  const { currentUser } = useStore();
  
  // --- ESTADOS ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // --- DATA ---
  const { data: openingList = [] } = useChecklists("opening");
  const { data: shiftList = [] } = useChecklists("shift"); 
  const { data: closingList = [] } = useChecklists("closing");
  const { data: tasks = [] } = useTasks();
  const { data: allUsers = [] } = useUsers();

  const activeEmployees = useMemo(() => {
    return allUsers.filter((u: any) => u.status === 'active');
  }, [allUsers]);

  const updateChecklistMutation = useUpdateChecklist();
  const completeTaskMutation = useCompleteTask();
  const createTaskMutation = useCreateTask();
  const deleteTaskMutation = useDeleteTask();
  
  // --- MODALES Y ACCIONES ---
  const [isAddingTask, setIsAddingTask] = useState<{date: Date, category: string} | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("Team"); 
  
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  const [viewingDay, setViewingDay] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // FOTOS
  const [verifyingTask, setVerifyingTask] = useState<{id: string, type: 'task'|'checklist'} | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'lead' || currentUser?.isSystemAdmin;

  // --- GENERAR CALENDARIO ---
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // --- HELPER PARA ICONOS ---
  const getFolderStyle = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('opening')) return { icon: Sun, color: 'text-blue-400', bg: 'bg-blue-500/10' };
      if (n.includes('shift')) return { icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' };
      if (n.includes('closing')) return { icon: Moon, color: 'text-purple-400', bg: 'bg-purple-500/10' };
      return { icon: Folder, color: 'text-white', bg: 'bg-white/10' };
  };

  // --- HANDLERS ---
  const handleCreateFolder = () => {
      if (newFolderName.trim()) {
          setCustomFolders([...customFolders, newFolderName.trim()]);
          setNewFolderName("");
          setIsCreatingFolder(false);
      }
  };

  const toggleFolder = (folderName: string) => {
      setOpenFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  const handleAddTask = () => {
    if (newTaskText && isAddingTask) {
      const dateTag = format(isAddingTask.date, 'yyyy-MM-dd');
      const noteTag = `DATE:${dateTag}|CAT:${isAddingTask.category}`; 
      
      createTaskMutation.mutate({
        text: newTaskText,
        assignedTo: newTaskAssignee,
        notes: noteTag, 
        completed: false
      });
      
      setNewTaskText("");
      setNewTaskAssignee("Team");
      setIsAddingTask(null);
      setOpenFolders(prev => ({ ...prev, [isAddingTask.category]: true }));
    }
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTaskMutation.mutate(id);
  };

  const handleToggleChecklist = (id: string, currentStatus: boolean) => {
      updateChecklistMutation.mutate({ id, updates: { completed: !currentStatus } });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { setPhotoPreview(ev.target?.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const submitPhotoCompletion = () => {
    if (verifyingTask && photoPreview) {
      if (verifyingTask.type === 'task') {
          completeTaskMutation.mutate({ id: verifyingTask.id, photo: photoPreview });
      } else {
          handleToggleChecklist(verifyingTask.id, false); 
      }
      setVerifyingTask(null);
      setPhotoPreview(null);
    }
  };

  const getTaskCategory = (notes: string) => {
    const match = notes?.match(/CAT:([^|]+)/);
    return match ? match[1] : 'General';
  };

  const getTasksForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dailyManualTasks = tasks.filter((t: any) => t.notes?.includes(`DATE:${dateStr}`)).map((t:any) => ({
        ...t, 
        type: 'task',
        category: getTaskCategory(t.notes)
    }));
    
    const isDayToday = isToday(day);
    let checklistItems: any[] = [];
    
    if (isDayToday) {
        checklistItems = [
            ...openingList.map((i:any) => ({...i, type: 'checklist', category: 'Opening'})),
            ...shiftList.map((i:any) => ({...i, type: 'checklist', category: 'Shift'})),
            ...closingList.map((i:any) => ({...i, type: 'checklist', category: 'Closing'}))
        ];
    }

    return [...checklistItems, ...dailyManualTasks];
  };

  return (
    <Layout title="Operations Calendar" showBack>
      
      {/* CABECERA */}
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-2xl font-black text-white capitalize">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="rounded-full border-white/10 hover:bg-white/10"><ChevronLeft className="w-5 h-5" /></Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="rounded-full border-white/10 hover:bg-white/10"><ChevronRight className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* GRID CALENDARIO */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-[10px] uppercase font-bold text-muted-foreground py-2">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 auto-rows-fr bg-white/5 p-1 rounded-2xl border border-white/5">
        {calendarDays.map((day) => {
          const isSelectedMonth = isSameMonth(day, currentMonth);
          const isDayToday = isToday(day);
          const allTasks = getTasksForDay(day);
          
          const completedCount = allTasks.filter(t => t.completed).length;
          const totalCount = allTasks.length;
          const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

          // Color dinámico según el progreso
          let progressColor = "text-flow-green"; // Verde por defecto
          if (percentage < 50) progressColor = "text-red-400";
          else if (percentage < 100) progressColor = "text-orange-400";

          return (
            <div
              key={day.toString()}
              onClick={() => { setViewingDay(day); setSearchQuery(""); }}
              className={cn(
                "min-h-[100px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative group overflow-hidden",
                isSelectedMonth ? "bg-black/40 border-white/5 hover:border-white/20" : "bg-black/20 border-transparent opacity-50",
                isDayToday && "ring-1 ring-flow-green bg-flow-green/5"
              )}
            >
              <div className="flex justify-between items-start">
                <span className={cn("text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full", isDayToday ? "bg-flow-green text-black" : "text-muted-foreground")}>{format(day, 'd')}</span>
                {canEdit && <button onClick={(e) => { e.stopPropagation(); setIsAddingTask({date: day, category: 'Shift'}); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded text-muted-foreground hover:text-white"><Plus className="w-3 h-3" /></button>}
              </div>

              {/* AQUI ESTA EL CAMBIO: CIRCULAR PROGRESS */}
              <div className="flex items-center justify-center mt-2 mb-1">
                 {totalCount > 0 ? (
                     <div className="flex flex-col items-center">
                        <CircularProgress percentage={percentage} size={36} strokeWidth={4} color={progressColor} />
                        <span className="text-[9px] text-muted-foreground font-medium mt-1">{completedCount}/{totalCount} Done</span>
                     </div>
                 ) : (
                    <div className="h-9 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground/30 font-medium">No tasks</span>
                    </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: DETALLES DEL DÍA */}
      <Dialog open={!!viewingDay && !isAddingTask && !verifyingTask && !isCreatingFolder} onOpenChange={(open) => !open && setViewingDay(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-0 overflow-hidden max-h-[85vh] flex flex-col">
            
            <div className="p-6 pb-4 border-b border-white/5 bg-black/20">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white">{viewingDay && format(viewingDay, 'EEEE, MMM do')}</h3>
                        <p className="text-xs text-muted-foreground">Daily Operations Hub</p>
                    </div>
                    {canEdit && (
                        <Button 
                            size="sm" 
                            onClick={() => setIsCreatingFolder(true)} 
                            className="text-xs h-8 text-white font-bold shadow-lg bg-blue-600 hover:bg-blue-700"
                        >
                            <FolderPlus className="w-3 h-3 mr-1.5" /> New Folder
                        </Button>
                    )}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tasks..." 
                        className="bg-black/40 border-white/10 pl-9 h-10 text-sm rounded-xl focus-visible:ring-flow-green"
                    />
                </div>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4 flex-1 bg-black/10">
                {viewingDay && (() => {
                    const allTasks = getTasksForDay(viewingDay);
                    const dynamicFoldersFromTasks = Array.from(new Set(allTasks.map(t => t.category)));
                    const activeFolders = Array.from(new Set([...dynamicFoldersFromTasks, "Opening", "Shift", "Closing", ...customFolders]));
                    const filteredTasks = searchQuery 
                        ? allTasks.filter(t => t.text.toLowerCase().includes(searchQuery.toLowerCase()))
                        : allTasks;

                    return (
                        <>
                            {activeFolders.map((folderName) => {
                                const folderTasks = filteredTasks.filter(t => t.category === folderName);
                                if (searchQuery && folderTasks.length === 0) return null;
                                const isOpen = openFolders[folderName];
                                const { icon: CategoryIcon, color, bg } = getFolderStyle(folderName);

                                return (
                                    <div key={folderName} className="rounded-2xl overflow-hidden border border-white/5 bg-card">
                                        <div 
                                            onClick={() => toggleFolder(folderName)}
                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", bg, color)}>
                                                    <CategoryIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-sm">{folderName}</h4>
                                                    <span className="text-[10px] text-muted-foreground">{folderTasks.length} tasks</span>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 p-1 rounded-full">
                                                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="border-t border-white/5 bg-black/20"
                                                >
                                                    {folderTasks.length === 0 && (
                                                        <div className="p-4 text-center text-[10px] text-muted-foreground">Empty folder</div>
                                                    )}
                                                    
                                                    {folderTasks.map((t: any, i: number) => (
                                                        <div key={i} className="flex items-center gap-3 p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                                            <div 
                                                                onClick={() => {
                                                                    if (t.type === 'checklist') handleToggleChecklist(t.id, t.completed);
                                                                    else if (!t.completed) setVerifyingTask({ id: t.id, type: 'task' });
                                                                }}
                                                                className={cn(
                                                                    "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 cursor-pointer border transition-all",
                                                                    t.completed 
                                                                        ? "bg-flow-green border-flow-green text-black" 
                                                                        : "bg-white/5 border-white/20 text-transparent hover:border-white/40"
                                                                )}
                                                            >
                                                                <Check className="w-4 h-4 stroke-[3]" />
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <span className={cn("text-sm block truncate", t.completed && "line-through text-muted-foreground")}>{t.text}</span>
                                                                {t.assignedTo && t.assignedTo !== 'Team' && (
                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                        <User className="w-3 h-3 text-muted-foreground" />
                                                                        <span className="text-[10px] text-muted-foreground">{t.assignedTo}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <Button 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                onClick={() => setVerifyingTask({ id: t.id, type: t.type })}
                                                                className={cn("h-8 w-8 rounded-full", t.completed ? "text-flow-green bg-flow-green/10" : "text-muted-foreground hover:bg-white/10 hover:text-white")}
                                                            >
                                                                <Camera className="w-4 h-4" />
                                                            </Button>

                                                            {t.type === 'task' && canEdit && (
                                                                <Button size="icon" variant="ghost" onClick={(e) => handleDeleteTask(t.id, e)} className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {canEdit && !searchQuery && (
                                                        <button 
                                                            onClick={() => setIsAddingTask({ date: viewingDay!, category: folderName })}
                                                            className="w-full py-3 text-xs font-bold text-muted-foreground hover:text-flow-green hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Plus className="w-3 h-3" /> Add Task to {folderName}
                                                        </button>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </>
                    );
                })()}
            </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: CREAR CARPETA NUEVA */}
      <Dialog open={isCreatingFolder} onOpenChange={setIsCreatingFolder}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader>
          <div className="py-4">
            <Input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="e.g. Maintenance, Events..." className="bg-black/20 border-white/10" />
          </div>
          <DialogFooter>
              <Button onClick={handleCreateFolder} className="w-full text-white font-bold bg-blue-600 hover:bg-blue-700">
                  Create Folder
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: AÑADIR TAREA (Actualizado con Selector de Empleado) */}
      <Dialog open={!!isAddingTask} onOpenChange={() => { setIsAddingTask(null); setNewTaskAssignee("Team"); }}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader><DialogTitle>Add to {isAddingTask?.category}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Description</label>
                <Input autoFocus value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Task name..." className="bg-black/20 border-white/10" />
            </div>
            
            <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Assignee</label>
                <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                    <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1C1C1E] border-white/10 text-white z-[100]">
                        <SelectItem value="Team">Team (Everyone)</SelectItem>
                        {activeEmployees.map((emp: any) => (
                            <SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddTask} className="w-full bg-flow-green text-black font-bold">Add Task</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: SUBIR FOTO */}
      <Dialog open={!!verifyingTask} onOpenChange={(open) => !open && setVerifyingTask(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader><DialogTitle>Upload Photo Proof</DialogTitle></DialogHeader>
          <div className="py-4 flex flex-col items-center gap-4">
             <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
             <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video bg-black/40 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden active:scale-95 transition-transform">
                {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center"><Camera className="w-8 h-8 opacity-50 mb-2"/><span className="text-xs opacity-50">Tap to take photo</span></div>}
             </div>
          </div>
          <DialogFooter><Button onClick={submitPhotoCompletion} disabled={!photoPreview} className="w-full bg-flow-green text-black font-bold">Save Photo & Complete</Button></DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}