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
  ChevronLeft, ChevronRight, Search, 
  Calendar as CalendarIcon, MapPin, 
  Sun, Moon, Clock, User, PartyPopper
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  format, addWeeks, subWeeks, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameDay, isToday, parseISO
} from 'date-fns';

// --- COMPONENTE MINI PROGRESO CIRCULAR ---
const CircularProgress = ({ percentage, size = 32, strokeWidth = 3, color = "text-flow-green" }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-white/10" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={cn("transition-all duration-500 ease-out", color)} />
      </svg>
      <span className="absolute text-[8px] font-bold text-white">{Math.round(percentage)}%</span>
    </div>
  );
};

export default function Schedule({ categoryColor = '#3B82F6' }: { categoryColor?: string }) {
  const { currentUser } = useStore();
  
  // --- ESTADOS ---
  // Ahora controlamos la "Fecha Actual" para calcular la semana
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // --- DATA ---
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
  const [newTaskCategory, setNewTaskCategory] = useState("General"); // Para distinguir Eventos de Tareas

  const [viewingDay, setViewingDay] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // FOTOS
  const [verifyingTask, setVerifyingTask] = useState<{id: string, type: 'task'|'checklist'} | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'lead' || currentUser?.isSystemAdmin;

  // --- LÓGICA DE SEMANA (NUEVO) ---
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Empieza Lunes
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [weekStart, weekEnd]);

  // --- HELPERS ---
  const getTaskCategoryIcon = (cat: string) => {
      const n = cat.toLowerCase();
      if (n === 'event') return { icon: PartyPopper, color: 'text-pink-400', bg: 'bg-pink-500/10' };
      if (n === 'opening') return { icon: Sun, color: 'text-blue-400', bg: 'bg-blue-500/10' };
      if (n === 'closing') return { icon: Moon, color: 'text-purple-400', bg: 'bg-purple-500/10' };
      return { icon: Clock, color: 'text-white', bg: 'bg-white/10' };
  };

  const getTaskCategory = (notes: string) => {
    const match = notes?.match(/CAT:([^|]+)/);
    return match ? match[1] : 'General';
  };

  // Filtrar tareas por día
  const getTasksForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    // Filtramos tareas manuales guardadas en la DB
    return tasks.filter((t: any) => t.notes?.includes(`DATE:${dateStr}`)).map((t:any) => ({
        ...t, 
        type: 'task',
        category: getTaskCategory(t.notes)
    }));
  };

  // --- HANDLERS ---
  const handleAddTask = () => {
    if (newTaskText && isAddingTask) {
      const dateTag = format(isAddingTask.date, 'yyyy-MM-dd');
      const noteTag = `DATE:${dateTag}|CAT:${newTaskCategory}`; // Guardamos la categoría (Event/Task)
      
      createTaskMutation.mutate({
        text: newTaskText,
        assignedTo: newTaskAssignee,
        notes: noteTag, 
        completed: false
      });
      
      setNewTaskText("");
      setNewTaskAssignee("Team");
      setNewTaskCategory("General");
      setIsAddingTask(null);
    }
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTaskMutation.mutate(id);
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
      completeTaskMutation.mutate({ id: verifyingTask.id, photo: photoPreview });
      setVerifyingTask(null);
      setPhotoPreview(null);
    }
  };

  return (
    <Layout title="Weekly Schedule" showBack>
      
      {/* CABECERA DE SEMANA */}
      <div className="flex items-center justify-between mb-6 px-1 bg-white/5 p-3 rounded-2xl border border-white/5">
        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="text-muted-foreground hover:text-white">
            <ChevronLeft className="w-6 h-6" />
        </Button>
        
        <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-flow-green tracking-widest mb-1">Current Week</p>
            <h2 className="text-lg font-bold text-white">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
            </h2>
        </div>

        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="text-muted-foreground hover:text-white">
            <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* GRID VERTICAL DE LA SEMANA */}
      <div className="space-y-3 pb-20">
        {calendarDays.map((day) => {
          const isDayToday = isToday(day);
          const dailyTasks = getTasksForDay(day);
          
          const events = dailyTasks.filter((t: any) => t.category === 'Event');
          const operationalTasks = dailyTasks.filter((t: any) => t.category !== 'Event');
          
          const completedCount = operationalTasks.filter((t: any) => t.completed).length;
          const totalCount = operationalTasks.length;
          const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

          return (
            <motion.div
              key={day.toString()}
              onClick={() => { setViewingDay(day); setSearchQuery(""); }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer relative overflow-hidden",
                isDayToday ? "bg-white/10 border-flow-green/30" : "bg-card border-white/5 hover:bg-white/5"
              )}
            >
              {/* Barra lateral de color para eventos */}
              {events.length > 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500" />}

              <div className="flex items-center gap-4">
                  {/* Fecha */}
                  <div className={cn("flex flex-col items-center justify-center w-12 h-12 rounded-xl border", isDayToday ? "bg-flow-green text-black border-flow-green" : "bg-black/20 border-white/10 text-muted-foreground")}>
                      <span className="text-[10px] font-bold uppercase">{format(day, 'EEE')}</span>
                      <span className="text-lg font-black leading-none">{format(day, 'd')}</span>
                  </div>

                  {/* Resumen */}
                  <div>
                      {events.length > 0 && (
                          <div className="flex items-center gap-1.5 mb-1">
                              <PartyPopper className="w-3 h-3 text-pink-400" />
                              <span className="text-xs font-bold text-pink-200">{events[0].text} {events.length > 1 && `+${events.length - 1}`}</span>
                          </div>
                      )}
                      
                      {totalCount > 0 ? (
                          <p className="text-sm text-muted-foreground">
                              <span className="text-white font-bold">{completedCount}/{totalCount}</span> Tasks Done
                          </p>
                      ) : (
                          <p className="text-xs text-muted-foreground/50 italic">No tasks scheduled</p>
                      )}
                  </div>
              </div>

              {/* Indicador o Acción */}
              <div className="flex items-center gap-3">
                  {totalCount > 0 && (
                      <CircularProgress percentage={percentage} size={36} strokeWidth={4} color={percentage === 100 ? "text-flow-green" : "text-blue-400"} />
                  )}
                  {canEdit && (
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); setIsAddingTask({date: day, category: 'General'}); }} 
                        className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/20 text-muted-foreground hover:text-white"
                      >
                          <Plus className="w-4 h-4" />
                      </Button>
                  )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* MODAL: DETALLES DEL DÍA */}
      <Dialog open={!!viewingDay && !isAddingTask && !verifyingTask} onOpenChange={(open) => !open && setViewingDay(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-0 overflow-hidden max-h-[85vh] flex flex-col">
            
            <div className="p-6 pb-4 border-b border-white/5 bg-black/20">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white">{viewingDay && format(viewingDay, 'EEEE, MMM do')}</h3>
                        <p className="text-xs text-muted-foreground">Events & Tasks</p>
                    </div>
                    {canEdit && (
                        <Button 
                            size="sm" 
                            onClick={() => { if(viewingDay) setIsAddingTask({ date: viewingDay, category: 'General' }); }} 
                            className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg"
                        >
                            <Plus className="w-3 h-3 mr-1.5" /> New Entry
                        </Button>
                    )}
                </div>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-black/10">
                {viewingDay && (() => {
                    const allTasks = getTasksForDay(viewingDay);
                    
                    if (allTasks.length === 0) {
                        return <div className="text-center py-10 text-muted-foreground opacity-50">Nothing scheduled for this day.</div>;
                    }

                    return allTasks.map((t: any) => {
                        const { icon: CategoryIcon, color, bg } = getTaskCategoryIcon(t.category);
                        const isEvent = t.category === 'Event';

                        return (
                            <div key={t.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all", isEvent ? "bg-pink-500/5 border-pink-500/20" : "bg-card border-white/5")}>
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", bg, color)}>
                                    <CategoryIcon className="w-5 h-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <span className={cn("text-sm font-medium block truncate", t.completed && !isEvent && "line-through text-muted-foreground")}>{t.text}</span>
                                    {t.assignedTo && t.assignedTo !== 'Team' && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <User className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground">{t.assignedTo}</span>
                                        </div>
                                    )}
                                </div>

                                {!isEvent && (
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        onClick={() => {
                                            if (!t.completed) setVerifyingTask({ id: t.id, type: 'task' });
                                        }}
                                        className={cn("h-8 w-8 rounded-full", t.completed ? "text-flow-green bg-flow-green/10" : "text-muted-foreground hover:bg-white/10 hover:text-white")}
                                    >
                                        {t.completed ? <Check className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                                    </Button>
                                )}

                                {canEdit && (
                                    <Button size="icon" variant="ghost" onClick={(e) => handleDeleteTask(t.id, e)} className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        );
                    });
                })()}
            </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: AÑADIR TAREA / EVENTO */}
      <Dialog open={!!isAddingTask} onOpenChange={() => { setIsAddingTask(null); setNewTaskAssignee("Team"); }}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader><DialogTitle>Add to {isAddingTask && format(isAddingTask.date, 'EEEE')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Type</label>
                <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                    <SelectTrigger className="bg-black/20 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1C1C1E] border-white/10 text-white z-[100]">
                        <SelectItem value="General">Regular Task 📋</SelectItem>
                        <SelectItem value="Event">Event / Note 🎉</SelectItem>
                        <SelectItem value="Maintenance">Maintenance 🔧</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Description</label>
                <Input autoFocus value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder={newTaskCategory === 'Event' ? "e.g. Health Inspection" : "Task name..."} className="bg-black/20 border-white/10" />
            </div>
            
            {newTaskCategory !== 'Event' && (
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
            )}
          </div>
          <DialogFooter><Button onClick={handleAddTask} className="w-full bg-flow-green text-black font-bold">Save</Button></DialogFooter>
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