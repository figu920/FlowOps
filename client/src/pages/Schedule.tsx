import { useState, useMemo, useRef } from 'react';
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
  ChevronLeft, ChevronRight, X, Clock, Upload
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

export default function Schedule({ categoryColor = '#3B82F6' }: { categoryColor?: string }) {
  const { currentUser } = useStore();
  
  // --- ESTADOS ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // --- DATA ---
  const { data: openingList = [] } = useChecklists("opening");
  const { data: shiftList = [] } = useChecklists("shift"); 
  const { data: closingList = [] } = useChecklists("closing");
  const { data: tasks = [] } = useTasks();

  const updateChecklistMutation = useUpdateChecklist(); // Necesario para marcar checklist como hechos
  const completeTaskMutation = useCompleteTask();
  const createTaskMutation = useCreateTask();
  const deleteTaskMutation = useDeleteTask();
  
  // --- MODALES Y ACCIONES ---
  const [isAddingTask, setIsAddingTask] = useState<Date | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<"opening" | "shift" | "closing">("shift");
  
  const [viewingDay, setViewingDay] = useState<Date | null>(null);
  
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

  // --- HANDLERS ---

  const handleAddTask = () => {
    if (newTaskText && isAddingTask) {
      const dateTag = format(isAddingTask, 'yyyy-MM-dd');
      // Guardamos la categoría en las notas
      const noteTag = `DATE:${dateTag}|CAT:${newTaskCategory}`; 
      
      createTaskMutation.mutate({
        text: newTaskText,
        assignedTo: 'Team',
        notes: noteTag, 
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

  const handleToggleChecklist = (id: string, currentStatus: boolean) => {
      updateChecklistMutation.mutate({ id, updates: { completed: !currentStatus } });
  };

  // Lógica de Fotos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { setPhotoPreview(ev.target?.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const submitPhotoCompletion = () => {
    if (verifyingTask && photoPreview && verifyingTask.type === 'task') {
      completeTaskMutation.mutate({ id: verifyingTask.id, photo: photoPreview });
      setVerifyingTask(null);
      setPhotoPreview(null);
    }
  };

  // --- ORGANIZAR TAREAS DEL DÍA (VERSIÓN PLANA) ---
  const getTasksForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    
    // 1. Tareas Puntuales (Manuales)
    const dailyManualTasks = tasks.filter((t: any) => t.notes?.includes(`DATE:${dateStr}`)).map((t:any) => ({...t, type: 'task'}));
    
    // 2. Checklist Items (Individuales) - Solo si es HOY (o quieres ver historial, por ahora simplificamos a HOY para no saturar días pasados)
    // Si quieres que salgan TODOS los días, quita la condición `isDayToday`.
    const isDayToday = isToday(day);
    let checklistItems: any[] = [];
    
    if (isDayToday) {
        checklistItems = [
            ...openingList.map((i:any) => ({...i, type: 'checklist', category: 'opening'})),
            ...shiftList.map((i:any) => ({...i, type: 'checklist', category: 'shift'})),
            ...closingList.map((i:any) => ({...i, type: 'checklist', category: 'closing'}))
        ];
    }

    // Combinamos todo en una lista plana
    return [...checklistItems, ...dailyManualTasks];
  };

  return (
    <Layout title="Operations Calendar" showBack>
      
      {/* CABECERA */}
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-2xl font-black text-white capitalize">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="rounded-full border-white/10 hover:bg-white/10"><ChevronLeft className="w-5 h-5" /></Button>
          <Button variant="outline" onClick={() => setCurrentMonth(new Date())} className="rounded-full border-white/10 hover:bg-white/10 text-xs font-bold">Today</Button>
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
          
          // Contadores para los puntitos
          const completedCount = allTasks.filter(t => t.completed).length;
          const totalCount = allTasks.length;

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
              <div className="flex justify-between items-start">
                <span className={cn("text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full", isDayToday ? "bg-flow-green text-black" : "text-muted-foreground")}>{format(day, 'd')}</span>
                {canEdit && <button onClick={(e) => { e.stopPropagation(); setIsAddingTask(day); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded text-muted-foreground hover:text-white"><Plus className="w-3 h-3" /></button>}
              </div>

              {/* Resumen Visual (Puntitos o barras) */}
              <div className="flex-1 flex flex-col justify-end gap-1 mt-1">
                 {totalCount > 0 && (
                     <div className="text-[9px] text-muted-foreground font-medium">
                         {completedCount}/{totalCount} Done
                     </div>
                 )}
                 {/* Mostramos hasta 3 tiritas de ejemplo */}
                 {allTasks.slice(0, 3).map((t: any, i: number) => (
                    <div key={i} className={cn("h-1 w-full rounded-full", t.completed ? "bg-flow-green" : "bg-white/10")} />
                 ))}
                 {allTasks.length > 3 && <div className="h-1 w-1 rounded-full bg-white/10 mx-auto" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: DETALLES DEL DÍA (LIMPIO Y PLANO) */}
      <Dialog open={!!viewingDay && !isAddingTask && !verifyingTask} onOpenChange={(open) => !open && setViewingDay(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-0 overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-6 pb-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <div>
                    <h3 className="text-xl font-bold text-white">{viewingDay && format(viewingDay, 'EEEE, MMM do')}</h3>
                    <p className="text-sm text-muted-foreground">Daily Operations</p>
                </div>
                {canEdit && (
                    <Button 
                        size="sm" 
                        onClick={() => setIsAddingTask(viewingDay)} 
                        className="bg-flow-green text-black font-bold hover:bg-flow-green/90 border-none" // ✅ BOTÓN VERDE
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add
                    </Button>
                )}
            </div>
            
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {viewingDay && (() => {
                    const allTasks = getTasksForDay(viewingDay);
                    
                    if (allTasks.length === 0) {
                        return (
                            <div className="text-center py-10 text-muted-foreground opacity-50">
                                <CalendarIcon className="w-12 h-12 mx-auto mb-3 stroke-1" />
                                <p>No tasks scheduled.</p>
                            </div>
                        );
                    }

                    return (
                        <div className="space-y-2">
                            {allTasks.map((t: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-white/10 hover:border-white/20 transition-all">
                                    {/* Icono de Estado / Acción */}
                                    <div 
                                        onClick={() => {
                                            if (t.type === 'checklist') handleToggleChecklist(t.id, t.completed);
                                            else if (!t.completed) setVerifyingTask({ id: t.id, type: 'task' });
                                        }}
                                        className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 cursor-pointer border transition-all",
                                            t.completed 
                                                ? "bg-flow-green/20 border-flow-green text-flow-green" 
                                                : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                        )}
                                    >
                                        {t.completed ? <Check className="w-5 h-5" /> : (t.type === 'task' ? <Camera className="w-5 h-5" /> : <div className="w-3 h-3 rounded-full bg-white/30" />)}
                                    </div>

                                    {/* Texto de la Tarea */}
                                    <div className="flex-1">
                                        <p className={cn("text-sm font-medium", t.completed && "line-through text-muted-foreground")}>
                                            {t.text}
                                        </p>
                                        {/* Etiqueta pequeña indicando categoría (opcional, para diferenciar visualmente) */}
                                        <div className="flex gap-2 mt-1">
                                            <span className={cn(
                                                "text-[9px] uppercase font-bold px-1.5 py-0.5 rounded",
                                                t.category === 'opening' && "bg-blue-500/10 text-blue-400",
                                                t.category === 'shift' && "bg-yellow-500/10 text-yellow-400",
                                                t.category === 'closing' && "bg-orange-500/10 text-orange-400"
                                            )}>
                                                {t.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Borrar (Solo manuales) */}
                                    {t.type === 'task' && canEdit && (
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={(e) => handleDeleteTask(t.id, e)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: AÑADIR TAREA */}
      <Dialog open={!!isAddingTask} onOpenChange={() => setIsAddingTask(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Description</label>
                <Input autoFocus value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="e.g. Clean Deep Fryer" className="bg-black/20 border-white/10" />
            </div>
            <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Category</label>
                <Select value={newTaskCategory} onValueChange={(v: any) => setNewTaskCategory(v)}>
                    <SelectTrigger className="bg-black/20 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1C1C1E] border-white/10 text-white">
                        {/* ✅ TEXTO LIMPIO SIN PARÉNTESIS */}
                        <SelectItem value="opening">Opening</SelectItem>
                        <SelectItem value="shift">Shift</SelectItem>
                        <SelectItem value="closing">Closing</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddTask} className="w-full bg-blue-500 font-bold">Create Task</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: SUBIR FOTO */}
      <Dialog open={!!verifyingTask} onOpenChange={(open) => !open && setVerifyingTask(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader><DialogTitle>Verify Completion</DialogTitle></DialogHeader>
          <div className="py-4 flex flex-col items-center gap-4">
             <p className="text-sm text-muted-foreground">Upload a photo to complete this task.</p>
             <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
             <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video bg-black/40 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden">
                {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center"><Camera className="w-8 h-8 opacity-50 mb-2"/><span className="text-xs opacity-50">Tap to take photo</span></div>}
             </div>
          </div>
          <DialogFooter><Button onClick={submitPhotoCompletion} disabled={!photoPreview} className="w-full bg-flow-green text-black font-bold">Complete & Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}