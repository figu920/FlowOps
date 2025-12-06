import { useState } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar, Plus, Trash2, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Tasks() {
  const { weeklyTasks, toggleTask, currentUser, users, addWeeklyTask, deleteWeeklyTask } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");

  const canEdit = currentUser.role === 'manager' || currentUser.role === 'lead';
  const canDelete = currentUser.role === 'manager';

  const handleAddTask = () => {
    if (taskName && assignedTo) {
      addWeeklyTask(taskName, assignedTo, notes);
      setIsAdding(false);
      setTaskName("");
      setAssignedTo("");
      setNotes("");
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
                onClick={(e) => { e.stopPropagation(); deleteWeeklyTask(task.id); }}
                className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-flow-red opacity-0 group-hover:opacity-100 transition-opacity z-20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div 
              className="relative p-5 flex items-start gap-4 cursor-pointer"
              onClick={() => toggleTask(task.id)}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 shrink-0",
                task.completed ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "bg-white/5 text-muted-foreground"
              )}>
                {task.completed ? <Check className="w-6 h-6 stroke-[3]" /> : <Calendar className="w-6 h-6" />}
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
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

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
