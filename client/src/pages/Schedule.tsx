import { useState, useRef, useMemo } from 'react';
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
  ChevronLeft, ChevronRight, Filter, Clock 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, addDays, subDays, isSameDay, startOfWeek } from 'date-fns';

export default function Schedule() {
  const { currentUser } = useStore();
  
  // --- CALENDARIO & ESTADOS ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"all" | "opening" | "closing" | "maintenance">("all");

  // --- DATA FETCHING (TRAEMOS TODO) ---
  const { data: openingList = [] } = useChecklists("opening");
  const { data: closingList = [] } = useChecklists("closing");
  const { data: shiftList = [] } = useChecklists("shift"); // Podemos agruparlo en opening/closing o maintenance
  const { data: maintenanceTasks = [] } = useTasks();

  // --- MUTACIONES ---
  const updateChecklistMutation = useUpdateChecklist();
  const completeTaskMutation = useCompleteTask();
  const createChecklistMutation = useCreateTask(); // Reusamos para tareas simples por ahora o creamos nueva logica
  
  // --- LÓGICA DE FOTOS (Heredada de Tasks) ---
  const [verifyingItem, setVerifyingItem] = useState<{id: string, type: 'checklist' | 'task'} | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.isSystemAdmin === true;
  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'lead' || isAdmin;

  // --- UNIFICACIÓN DE DATOS 🧠 ---
  const unifiedSchedule = useMemo(() => {
    // 1. Convertimos Checklists al formato común
    const checklistItems = [
      ...openingList.map((i: any) => ({ ...i, type: 'checklist', category: 'opening', time: '08:00 AM' })),
      ...shiftList.map((i: any) => ({ ...i, type: 'checklist', category: 'opening', time: '02:00 PM' })),
      ...closingList.map((i: any) => ({ ...i, type: 'checklist', category: 'closing', time: '11:00 PM' }))
    ];

    // 2. Convertimos Tasks al formato común
    // NOTA: Aquí podrías filtrar por fecha si las tareas tuvieran fecha específica
    const taskItems = maintenanceTasks.map((t: any) => ({
      ...t,
      type: 'task',
      category: 'maintenance',
      time: 'Flexible'
    }));

    // 3. Fusionamos y filtramos
    const all = [...checklistItems, ...taskItems];

    if (activeTab === 'all') return all;
    return all.filter(item => item.category === activeTab);
  }, [openingList, closingList, shiftList, maintenanceTasks, activeTab]);

  // --- HANDLERS ---

  // Completar item (Checklist es directo, Task requiere foto)
  const handleToggleItem = (item: any) => {
    if (item.type === 'checklist') {
      // Checklist simple: click y listo
      updateChecklistMutation.mutate({ 
        id: item.id, 
        updates: { completed: !item.completed } 
      });
    } else {
      // Tarea compleja: requiere verificación o foto
      if (item.completed) {
        // Si ya está hecha, no hacemos nada o mostramos historial (opcional)
      } else {
        setVerifyingItem({ id: item.id, type: 'task' });
        setPhotoPreview(null);
      }
    }
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
    if (verifyingItem && photoPreview && verifyingItem.type === 'task') {
      completeTaskMutation.mutate({ id: verifyingItem.id, photo: photoPreview });
      setVerifyingItem(null);
      setPhotoPreview(null);
    }
  };

  // --- GENERADOR DE FECHAS (TIRA HORIZONTAL) ---
  const dateStrip = useMemo(() => {
    const start = subDays(selectedDate, 2); // 2 días atrás
    return Array.from({ length: 5 }).map((_, i) => addDays(start, i));
  }, [selectedDate]);

  return (
    <Layout title="Operations Schedule" showBack>
      
      {/* 1. CALENDARIO HORIZONTAL */}
      <div className="bg-black/20 -mx-4 px-4 pb-4 mb-4 border-b border-white/5">
        <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-flow-green" />
                {format(selectedDate, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-2">
                <button onClick={() => setSelectedDate(subDays(selectedDate, 7))} className="p-1 rounded-full hover:bg-white/10"><ChevronLeft className="w-5 h-5"/></button>
                <button onClick={() => setSelectedDate(new Date())} className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full hover:bg-white/20">Today</button>
                <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-1 rounded-full hover:bg-white/10"><ChevronRight className="w-5 h-5"/></button>
            </div>
        </div>
        
        <div className="flex justify-between gap-2">
            {dateStrip.map((date, idx) => {
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());
                return (
                    <button
                        key={idx}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all border",
                            isSelected 
                                ? "bg-flow-green text-black border-flow-green shadow-lg shadow-green-500/20 scale-105" 
                                : "bg-white/5 text-muted-foreground border-transparent hover:bg-white/10"
                        )}
                    >
                        <span className="text-[10px] uppercase font-bold mb-1 opacity-80">{format(date, 'EEE')}</span>
                        <span className={cn("text-xl font-bold", isSelected ? "text-black" : "text-white")}>
                            {format(date, 'd')}
                        </span>
                        {isToday && !isSelected && <div className="w-1 h-1 rounded-full bg-flow-green mt-1" />}
                    </button>
                )
            })}
        </div>
      </div>

      {/* 2. FILTROS (TABS) */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {[
            { id: 'all', label: 'All Tasks' },
            { id: 'opening', label: 'Opening' },
            { id: 'closing', label: 'Closing' },
            { id: 'maintenance', label: 'Maintenance' }
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border transition-all",
                    activeTab === tab.id 
                        ? "bg-white text-black border-white" 
                        : "bg-transparent text-muted-foreground border-white/10 hover:border-white/30"
                )}
            >
                {tab.label}
            </button>
        ))}
      </div>

      {/* 3. LISTA UNIFICADA */}
      <div className="space-y-3 pb-20">
        <AnimatePresence mode="popLayout">
            {unifiedSchedule.map((item: any, idx: number) => (
                <motion.div
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                        "relative p-4 rounded-2xl border flex items-start gap-4 transition-all group",
                        item.completed 
                            ? "bg-card/40 border-white/5 opacity-60" 
                            : "bg-card border-white/10 hover:border-white/20"
                    )}
                >
                    {/* Checkbox / Status Icon */}
                    <button 
                        onClick={() => handleToggleItem(item)}
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all border-2",
                            item.completed
                                ? "bg-flow-green border-flow-green text-black"
                                : item.type === 'task' 
                                    ? "border-purple-500/50 text-purple-500 hover:bg-purple-500/10" // Tareas: Morado
                                    : "border-white/20 text-muted-foreground hover:border-white/50" // Checklist: Gris
                        )}
                    >
                        {item.completed ? <Check className="w-5 h-5 stroke-[3]" /> : (item.type === 'task' ? <Camera className="w-5 h-5"/> : <div className="w-3 h-3 rounded-full bg-white/20" />)}
                    </button>

                    <div className="flex-1 pt-1">
                        <div className="flex justify-between items-start">
                            <h4 className={cn("font-semibold text-sm leading-tight", item.completed && "line-through")}>
                                {item.text}
                            </h4>
                            <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">
                                {item.time}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                            {/* Badges de Categoría */}
                            <span className={cn(
                                "text-[9px] uppercase font-bold px-2 py-0.5 rounded-full",
                                item.category === 'opening' && "bg-blue-500/10 text-blue-400",
                                item.category === 'closing' && "bg-orange-500/10 text-orange-400",
                                item.category === 'maintenance' && "bg-purple-500/10 text-purple-400",
                            )}>
                                {item.category}
                            </span>

                            {item.assignedTo && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    • {item.assignedTo}
                                </span>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
        
        {unifiedSchedule.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                <p>No tasks scheduled for this filter.</p>
            </div>
        )}
      </div>

      {/* Floating Action Button (Solo para añadir Tareas nuevas) */}
      {canEdit && (
        <div className="fixed bottom-6 right-6">
            <button className="w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform">
                <Plus className="w-6 h-6 stroke-[3]" />
            </button>
        </div>
      )}

      {/* DIALOG: SUBIR FOTO (Solo para Tasks) */}
      <Dialog open={!!verifyingItem} onOpenChange={(open) => !open && setVerifyingItem(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader><DialogTitle>Verify Task</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4 flex flex-col items-center">
             <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
             <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video bg-black/40 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">
                {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <><Camera className="w-8 h-8 opacity-50 mb-2"/><span className="text-xs opacity-50">Tap to verify with photo</span></>}
             </div>
          </div>
          <DialogFooter>
            <Button onClick={submitPhotoCompletion} disabled={!photoPreview} className="w-full bg-flow-green text-black font-bold">Complete Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}