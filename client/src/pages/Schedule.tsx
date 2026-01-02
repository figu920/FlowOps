import { useState, useMemo, useRef } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useUsers } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Check, 
  ChevronDown, ChevronUp, 
  ChevronLeft, ChevronRight, 
  Sun, Moon, Clock, User, Camera, RefreshCw, X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, 
  isSameDay, isSameMonth
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

  // --- ESTADOS DE CALENDARIO ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['Opening', 'Shift', 'Closing']); 

  // --- ESTADOS DE GESTIÓN DE TAREA ---
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskText, setTaskText] = useState("");
  const [taskCategory, setTaskCategory] = useState(""); 
  const [taskAssignee, setTaskAssignee] = useState("Team"); 

  // --- ESTADOS DE VERIFICACIÓN (FOTOS) ---
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [viewingHistoryTask, setViewingHistoryTask] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.isSystemAdmin === true;
  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'lead' || currentUser?.isSystemAdmin;

  const FIXED_CATEGORIES = [
    { id: 'Opening', label: 'Opening', icon: Sun, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'Shift', label: 'Shift', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { id: 'Closing', label: 'Closing', icon: Moon, color: 'text-purple-400', bg: 'bg-purple-500/10' }
  ];

  // --- LÓGICA DE FECHAS (Texto Simple - Inventory Style) ---
  const selectedDateKey = useMemo(() => {
      return selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  }, [selectedDate]);

  const getTasksForDayAndCategory = (category: string) => {
      if (!tasks || !selectedDateKey) return [];
      return tasks.filter((t: any) => {
          if (!t.date) return false;
          let taskDateKey = "";
          if (typeof t.date === 'string') {
              taskDateKey = t.date.substring(0, 10);
          } else {
              taskDateKey = format(new Date(t.date), 'yyyy-MM-dd');
          }
          return t.category === category && taskDateKey === selectedDateKey;
      });
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleDayClick = (date: Date) => {
      setSelectedDate(date);
      setIsDayOpen(true);
  };

  // --- LÓGICA DE FOTOS (COMPRESIÓN) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; 
          const scaleSize = MAX_WIDTH / img.width;
          
          if (scaleSize < 1) {
              canvas.width = MAX_WIDTH;
              canvas.height = img.height * scaleSize;
          } else {
              canvas.width = img.width;
              canvas.height = img.height;
          }

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          setPhotoPreview(compressedBase64);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // --- ACCIONES DE TAREAS ---
  const handleTaskClick = (task: any) => {
    if (task.completed) {
      // Si está completa, mostramos historial
      setViewingHistoryTask(task.id);
    } else {
      // Si no, abrimos cámara para verificar
      setVerifyingTaskId(task.id);
      setPhotoPreview(null);
    }
  };

  const submitCompletion = () => {
    if (verifyingTaskId && photoPreview) {
      // Aquí actualizamos la tarea con la foto y estado completado
      updateTaskMutation.mutate({ 
          id: verifyingTaskId, 
          updates: { 
              completed: true, 
              photo: photoPreview, // Guardamos la foto
              completedAt: new Date().toISOString(),
              completedBy: currentUser?.name || 'User'
          } 
      });
      setVerifyingTaskId(null);
      setPhotoPreview(null);
    }
  };

  const handleReopenTask = () => {
      if (viewingHistoryTask) {
          updateTaskMutation.mutate({ 
              id: viewingHistoryTask, 
              updates: { 
                  completed: false, 
                  photo: null, 
                  completedAt: null 
              } 
          });
          setViewingHistoryTask(null);
      }
  };

  const handleSaveTask = () => {
      if (!taskText.trim() || !selectedDateKey) return;
      
      const data = {
          text: taskText,
          category: taskCategory,
          assignee: taskAssignee,
          completed: editingTask ? editingTask.completed : false,
          date: selectedDateKey, 
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

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => prev.includes(folder) ? prev.filter(f => f !== folder) : [...prev, folder]);
  };

  return (
    <Layout title="Operations Calendar" showBack={true}>
      
      {/* VISTA CALENDARIO */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between px-2">
            <button onClick={prevMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-white tracking-tight">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button onClick={nextMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-white/[0.04] shadow-xl">
            <div className="grid grid-cols-7 mb-3">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                    <div key={day} className="text-center text-[10px] uppercase font-bold text-muted-foreground opacity-50">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                {calendarDays.map((date, idx) => {
                    const isToday = isSameDay(date, new Date());
                    const isCurrentMonth = isSameMonth(date, currentMonth);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const dayKey = format(date, 'yyyy-MM-dd');
                    const dayTasks = tasks.filter((t: any) => {
                        if(!t.date) return false;
                        const tKey = typeof t.date === 'string' ? t.date.substring(0, 10) : format(new Date(t.date), 'yyyy-MM-dd');
                        return tKey === dayKey;
                    });
                    const hasTasks = dayTasks.length > 0;
                    const allCompleted = hasTasks && dayTasks.every((t:any) => t.completed);

                    return (
                        <button
                            key={idx}
                            onClick={() => handleDayClick(date)}
                            className={cn(
                                "h-14 rounded-xl flex flex-col items-center justify-center relative transition-all border",
                                isToday ? "bg-flow-blue text-white border-flow-blue shadow-lg z-10" : isSelected ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-transparent hover:bg-white/5",
                                !isCurrentMonth && "opacity-20"
                            )}
                        >
                            <span className={cn("text-sm font-bold", isToday ? "text-white" : "text-white/80")}>{format(date, 'd')}</span>
                            <div className="flex gap-0.5 mt-1 h-1.5">
                                {hasTasks && (
                                    <div className={cn("w-1.5 h-1.5 rounded-full", allCompleted ? "bg-green-500" : "bg-orange-500")} />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
      </div>

      {/* --- DESPLEGABLE DEL DÍA (TASK MANAGER) --- */}
      <Dialog open={isDayOpen} onOpenChange={setIsDayOpen}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[95%] max-w-lg rounded-2xl p-0 overflow-hidden max-h-[85vh] flex flex-col z-[50]">
            
            <div className="p-6 bg-white/5 border-b border-white/5">
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    {selectedDate && format(selectedDate, 'EEEE, MMM do')}
                </h2>
                <p className="text-muted-foreground text-sm font-medium">Daily Operations</p>
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
                                        <div className="p-2 space-y-2">
                                            {items.length === 0 && <div className="py-4 text-center text-xs text-muted-foreground italic opacity-50">No tasks yet</div>}
                                            
                                            {items.map((task: any) => (
                                                <div 
                                                    key={task.id} 
                                                    className={cn(
                                                        "relative overflow-hidden rounded-xl border p-3 transition-all",
                                                        task.completed ? "bg-card/30 border-white/5" : "bg-white/5 border-white/5 hover:border-white/10"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {/* CHECK / CAMERA BUTTON */}
                                                        <button 
                                                            onClick={() => handleTaskClick(task)}
                                                            className={cn(
                                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0",
                                                                task.completed 
                                                                    ? "bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
                                                                    : "bg-black/40 text-muted-foreground hover:bg-black/60"
                                                            )}
                                                        >
                                                            {task.completed ? <Check className="w-5 h-5 stroke-[3]" /> : <Camera className="w-5 h-5" />}
                                                        </button>

                                                        <div className="flex-1 min-w-0" onClick={() => handleTaskClick(task)}>
                                                            <p className={cn("text-sm font-semibold truncate transition-colors", task.completed ? "text-muted-foreground line-through" : "text-white")}>
                                                                {task.text}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {task.assignee && (
                                                                    <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded text-[10px] text-white/70">
                                                                        <User className="w-3 h-3"/> {task.assignee}
                                                                    </div>
                                                                )}
                                                                {task.completed && (
                                                                    <span className="text-[10px] text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded">PROOF UPLOADED</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {canEdit && (
                                                            <div className="flex flex-col gap-1">
                                                                <button onClick={(e) => { e.stopPropagation(); setIsAddingTask(true); setEditingTask(task); setTaskText(task.text); setTaskCategory(task.category); setTaskAssignee(task.assignee); }} className="p-1.5 text-muted-foreground hover:text-white bg-black/20 rounded-lg"><Edit2 className="w-3 h-3" /></button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-1.5 text-muted-foreground hover:text-red-400 bg-black/20 rounded-lg"><Trash2 className="w-3 h-3" /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {canEdit && (
                                                <button onClick={() => { setIsAddingTask(true); setEditingTask(null); setTaskCategory(category.id); setTaskText(""); }} className="w-full py-2.5 flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg border border-dashed border-white/10 mt-2 transition-colors">
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

      {/* --- MODAL 1: SUBIR FOTO (VERIFICACIÓN) --- */}
      <Dialog open={!!verifyingTaskId} onOpenChange={(open) => !open && setVerifyingTaskId(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6 z-[60]">
          <DialogHeader><DialogTitle>Task Verification</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 flex flex-col items-center">
            <p className="text-muted-foreground text-center text-sm">Upload a photo to verify this task.</p>
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            
            <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-[4/3] bg-black/40 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-black/50 transition-all overflow-hidden relative">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="w-10 h-10 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground font-medium">Tap to take photo</span>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitCompletion} disabled={!photoPreview} className="w-full bg-flow-green text-black font-bold">Complete Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 2: VER HISTORIAL (TAREA COMPLETADA) --- */}
      <Dialog open={!!viewingHistoryTask} onOpenChange={(open) => !open && setViewingHistoryTask(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-0 overflow-hidden z-[60]">
           {(() => {
             const task = tasks.find((t:any) => t.id === viewingHistoryTask);
             if (!task) return null;
             return (
               <>
                 <div className="p-6 pb-2 border-b border-white/5">
                   <DialogTitle>{task.text}</DialogTitle>
                   <p className="text-xs text-green-400 mt-1 font-bold flex items-center gap-1"><Check className="w-3 h-3"/> COMPLETED</p>
                 </div>
                 <div className="p-6 space-y-4">
                     <div className="flex justify-between text-sm text-muted-foreground">
                         <span>Completed by <b className="text-white">{task.completedBy || 'Unknown'}</b></span>
                         <span>{task.completedAt ? format(new Date(task.completedAt), 'p') : ''}</span>
                     </div>
                     {task.photo ? (
                         <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
                             <img src={task.photo} alt="Proof" className="w-full h-auto" />
                         </div>
                     ) : (
                         <div className="p-4 text-center bg-white/5 rounded-xl text-muted-foreground text-xs">No photo proof attached</div>
                     )}
                 </div>
                 {canEdit && (
                   <div className="p-4 border-t border-white/5">
                     <Button onClick={handleReopenTask} variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10">
                       <RefreshCw className="w-4 h-4 mr-2" /> Reopen Task
                     </Button>
                   </div>
                 )}
               </>
             );
           })()}
        </DialogContent>
      </Dialog>

      {/* --- MODAL 3: CREAR / EDITAR TAREA --- */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6 z-[70]">
          <DialogHeader><DialogTitle>{editingTask ? 'Edit Task' : `New ${taskCategory} Task`}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
              <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Description</label>
                  <Input value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="e.g. Turn on grill" className="bg-black/20 border-white/10" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Category</label>
                      <div className="h-10 px-3 py-2 rounded-md border border-white/10 bg-white/5 text-sm text-muted-foreground flex items-center">{taskCategory}</div>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Assignee</label>
                      <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                        <SelectTrigger className="bg-black/20 border-white/10 h-10"><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent className="bg-[#1C1C1E] border-white/10 text-white z-[100]" position="popper" sideOffset={5}>
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
              <Button onClick={handleSaveTask} className="w-full bg-flow-blue text-white font-bold">{editingTask ? 'Update' : 'Save Task'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}