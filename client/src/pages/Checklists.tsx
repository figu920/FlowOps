import { useState } from 'react';
import Layout from '@/components/Layout';
import { useStore, type ChecklistItem } from '@/lib/store';
import { useChecklists, useUpdateChecklist, useCreateChecklist, useDeleteChecklist, useUsers } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar, Plus, Trash2, UserCircle, Edit2 } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Checklists() {
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<"opening" | "shift" | "closing">("opening");
  const { data: checklistsData = [] } = useChecklists(activeTab);
  const { data: users = [] } = useUsers();
  const updateMutation = useUpdateChecklist();
  const createMutation = useCreateChecklist();
  const deleteMutation = useDeleteChecklist();
  
  // Add Item State
  const [isAdding, setIsAdding] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");

  // Edit Item State
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editTaskName, setEditTaskName] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const isAdmin = currentUser?.isSystemAdmin === true;
  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'lead' || isAdmin;
  const canDelete = currentUser?.role === 'manager' || isAdmin;

  const handleAddItem = () => {
    if (taskName && assignedTo) {
      createMutation.mutate({
        text: taskName,
        listType: activeTab,
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

  const openEditItem = (task: any) => {
    setEditingItem(task.id);
    setEditTaskName(task.text);
    setEditAssignedTo(task.assignedTo || "");
    setEditNotes(task.notes || "");
  };

  const handleEditItem = () => {
    if (editingItem && editTaskName && editAssignedTo) {
      updateMutation.mutate({
        id: editingItem,
        updates: {
          text: editTaskName,
          assignedTo: editAssignedTo,
          notes: editNotes || undefined
        }
      });
      setEditingItem(null);
    }
  };

  const tabs = [
    { id: "opening", label: "Opening", color: "text-flow-green", border: "data-[state=active]:border-flow-green" },
    { id: "shift", label: "Shift", color: "text-flow-yellow", border: "data-[state=active]:border-flow-yellow" },
    { id: "closing", label: "Closing", color: "text-flow-red", border: "data-[state=active]:border-flow-red" },
  ] as const;

  const TaskRow = ({ task, type }: { task: any, type: 'opening' | 'shift' | 'closing' }) => (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "relative w-full text-left p-5 rounded-2xl border mb-3 transition-all duration-300 overflow-hidden",
        task.completed 
          ? "bg-white/[0.02] border-transparent opacity-60" 
          : "bg-card border-white/[0.04] shadow-sm"
      )}
    >
      <div className="flex items-center gap-4">
        <div 
          className="cursor-pointer"
          onClick={() => updateMutation.mutate({ id: task.id, updates: { completed: !task.completed } })}
        >
          <div className={cn(
            "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0",
            task.completed 
              ? "bg-flow-green border-flow-green scale-110" 
              : "border-white/20 hover:border-white/40"
          )}>
            {task.completed && <Check className="w-4 h-4 text-black stroke-[3]" />}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <span className={cn(
            "text-[17px] font-medium transition-all block",
            task.completed ? "text-muted-foreground line-through decoration-white/20" : "text-white"
          )}>
            {task.text}
          </span>
          
          <div className="flex flex-wrap gap-2 mt-1.5 items-center">
             {task.assignedTo && (
               <span className="text-[10px] font-medium text-white/50 bg-white/5 px-2 py-0.5 rounded flex items-center gap-1">
                 <UserCircle className="w-3 h-3" />
                 {task.assignedTo}
               </span>
             )}
             
             {task.notes && (
                <span className="text-[10px] text-muted-foreground/70 italic truncate max-w-[150px]">
                  {task.notes}
                </span>
             )}
          </div>

          <AnimatePresence>
            {task.completed && task.completedBy && (
              <motion.span 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs text-flow-green font-medium mt-1 block"
              >
                Done by {task.completedBy}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {canEdit && (
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); openEditItem(task); }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
              data-testid={`button-edit-${task.id}`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {canDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(task.id); }}
                className="p-2 rounded-lg bg-white/5 hover:bg-flow-red/20 text-muted-foreground hover:text-flow-red transition-colors"
                data-testid={`button-delete-${task.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <Layout 
      title="Checklists"
      action={
        canEdit && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAdding(true)}
            className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
          </motion.button>
        )
      }
    >
      {/* Custom Tab Bar */}
      <div className="flex p-1 bg-white/5 rounded-xl mb-6 relative">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all z-10 relative",
                isActive ? "text-white" : "text-muted-foreground hover:text-white/70"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className={cn("absolute inset-0 bg-white/10 rounded-lg shadow-sm border border-white/5")}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
           <motion.div
             key={activeTab}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             transition={{ duration: 0.2 }}
           >
             {checklistsData.map(task => (
               <TaskRow key={task.id} task={task} type={activeTab} />
             ))}
             
             {checklistsData.length === 0 && (
               <div className="text-center text-muted-foreground py-10">
                 No tasks for this checklist.
               </div>
             )}
           </motion.div>
        </AnimatePresence>
      </div>

      {/* Add Checklist Item Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Add to {tabs.find(t => t.id === activeTab)?.label} List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Task Name</label>
              <Input 
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="e.g. Clean espresso machine"
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
            <Button onClick={handleAddItem} className="w-full bg-blue-500 text-white font-bold hover:bg-blue-600">Save Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Checklist Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Task Name</label>
              <Input 
                value={editTaskName}
                onChange={(e) => setEditTaskName(e.target.value)}
                placeholder="e.g. Clean espresso machine"
                className="bg-black/20 border-white/10"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Assign To</label>
              <Select value={editAssignedTo} onValueChange={setEditAssignedTo}>
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
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Instructions..."
                className="bg-black/20 border-white/10 resize-none h-20"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {canDelete && (
              <Button 
                variant="ghost"
                onClick={() => {
                  if (editingItem) {
                    deleteMutation.mutate(editingItem);
                    setEditingItem(null);
                  }
                }}
                className="text-flow-red hover:text-flow-red/80 hover:bg-flow-red/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <Button onClick={handleEditItem} className="w-full bg-blue-500 text-white font-bold hover:bg-blue-600">Update Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
