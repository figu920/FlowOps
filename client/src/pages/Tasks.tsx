import { useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { useStore, type TaskItem } from '@/lib/store';
import { useTasks, useCompleteTask, useCreateTask, useDeleteTask, useUpdateTask, useUsers } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar, Plus, Trash2, UserCircle, Camera, Upload, Eye, X, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Tasks() {
  const { currentUser } = useStore();
  const { data: weeklyTasks = [] } = useTasks();
  const { data: users = [] } = useUsers();
  const completeMutation = useCompleteTask();
  const createMutation = useCreateTask();
  const deleteMutation = useDeleteTask();
  const updateMutation = useUpdateTask();
  const [isAdding, setIsAdding] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");

  // Photo Verification State
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History View State
  const [viewingHistoryTask, setViewingHistoryTask] = useState<string | null>(null);

  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'lead';
  const canDelete = currentUser?.role === 'manager';

  const handleAddTask = () => {
    if (taskName && assignedTo) {
      createMutation.mutate({
        text: taskName,
        assignedTo,
        notes: notes || undefined,
        completed: false
      });
      setIsAdding(false);
      setTaskName("");
      setAssignedTo("");
      setNotes("");
    }
  };

  const handleTaskClick = (task: TaskItem) => {
    if (task.completed) {
      setViewingHistoryTask(task.id);
    } else {
      setVerifyingTaskId(task.id);
      setPhotoPreview(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitCompletion = () => {
    if (verifyingTaskId && photoPreview) {
      completeMutation.mutate({ id: verifyingTaskId, photo: photoPreview });
      setVerifyingTaskId(null);
      setPhotoPreview(null);
    }
  };

  return (
    <Layout 
      title="Weekly Tasks"
      action={
        canEdit && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAdding(true)}
            className="w-9 h-9 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/20"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
          </motion.button>
        )
      }
    >
      <div className="space-y-3">
        {weeklyTasks.map((task, idx) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              "group relative overflow-hidden rounded-2xl border p-0 transition-all active:scale-[0.98]",
              task.completed 
                ? "bg-card/30 border-white/5" 
                : "bg-card border-white/[0.06] hover:border-white/10"
            )}
          >
            {/* Progress Bar Background Effect for Completed */}
            <div className={cn(
               "absolute inset-0 bg-purple-500/10 transition-transform duration-500 origin-left",
               task.completed ? "scale-x-100" : "scale-x-0"
            )} />

            {canDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(task.id); }}
                className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-flow-red opacity-0 group-hover:opacity-100 transition-opacity z-20"
                data-testid={`button-delete-${task.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div 
              className="relative p-5 flex items-start gap-4 cursor-pointer"
              onClick={() => handleTaskClick(task)}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 shrink-0",
                task.completed ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "bg-white/5 text-muted-foreground"
              )}>
                {task.completed ? <Check className="w-6 h-6 stroke-[3]" /> : <Camera className="w-6 h-6" />}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "text-[17px] font-semibold transition-colors leading-tight",
                  task.completed ? "text-muted-foreground line-through" : "text-white"
                )}>
                  {task.text}
                </h3>
                
                {task.notes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {task.notes}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md">
                     <UserCircle className="w-3 h-3 text-purple-400" />
                     <span className="text-xs text-white/80 font-medium">{task.assignedTo}</span>
                  </div>
                  {task.completed && task.completedAt && (
                    <span className="text-[10px] text-muted-foreground">
                       Done {new Date(task.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                  {task.completed && <div className="flex items-center gap-1 text-[10px] text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded"><Camera className="w-3 h-3"/> PROOF</div>}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Photo Verification Dialog */}
      <Dialog open={!!verifyingTaskId} onOpenChange={(open) => !open && setVerifyingTaskId(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Photo Proof Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 flex flex-col items-center">
            <p className="text-muted-foreground text-center text-sm">
              You must upload a photo to verify this task is complete.
            </p>
            
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] bg-black/40 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-black/50 transition-all overflow-hidden relative"
            >
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
            <Button onClick={submitCompletion} disabled={!photoPreview} className="w-full bg-flow-green text-black font-bold hover:bg-flow-green/90">
              Submit & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task History Dialog */}
      <Dialog open={!!viewingHistoryTask} onOpenChange={(open) => !open && setViewingHistoryTask(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] h-[80vh] rounded-2xl p-0 flex flex-col overflow-hidden">
           {(() => {
             const task = weeklyTasks.find(t => t.id === viewingHistoryTask);
             if (!task) return null;

             return (
               <>
                 <div className="p-6 pb-2 border-b border-white/5">
                   <DialogTitle>{task.text}</DialogTitle>
                   <p className="text-sm text-muted-foreground mt-1">Completion History</p>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 space-y-6">
                   {task.history && task.history.length > 0 ? (
                     task.history.map((entry, idx) => (
                       <div key={idx} className="space-y-2">
                         <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{new Date(entry.completedAt).toLocaleString()}</span>
                            <span className="text-white font-bold">{entry.completedBy}</span>
                         </div>
                         <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
                           <img src={entry.photo} alt="Proof" className="w-full h-auto" />
                         </div>
                       </div>
                     ))
                   ) : (
                     <div className="text-center text-muted-foreground py-10">
                       No history available.
                     </div>
                   )}
                 </div>

                 {canEdit && (
                   <div className="p-4 border-t border-white/5">
                     <Button 
                       onClick={() => {
                         if (viewingHistoryTask) updateMutation.mutate({ id: viewingHistoryTask, updates: { completed: false } });
                         setViewingHistoryTask(null);
                       }} 
                       variant="outline" 
                       className="w-full border-flow-red/30 text-flow-red hover:bg-flow-red/10 hover:text-flow-red"
                     >
                       <RefreshCw className="w-4 h-4 mr-2" />
                       Reopen Task
                     </Button>
                   </div>
                 )}
               </>
             );
           })()}
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Add Weekly Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Task Name</label>
              <Input 
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="e.g. Deep clean freezer"
                className="bg-black/20 border-white/10"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Assign To</label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="bg-black/20 border-white/10">
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1C1E] border-white/10 text-white">
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Notes (Optional)</label>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instructions..."
                className="bg-black/20 border-white/10 resize-none h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddTask} className="w-full bg-purple-500 text-white font-bold hover:bg-purple-600">Save Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
