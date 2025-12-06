import { useState } from 'react';
import Layout from '@/components/Layout';
import { useStore, type InventoryItem } from '@/lib/store';
import { useInventory, useUpdateInventory, useCreateInventory, useDeleteInventory } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Inventory() {
  const { currentUser } = useStore();
  const { data: inventory = [] } = useInventory();
  const updateMutation = useUpdateInventory();
  const createMutation = useCreateInventory();
  const deleteMutation = useDeleteInventory();
  
  // State for LOW comment
  const [lowCommentItem, setLowCommentItem] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  // State for ADD item
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemEmoji, setNewItemEmoji] = useState("📦");
  const [newItemCategory, setNewItemCategory] = useState("");

  const isAdmin = currentUser?.isSystemAdmin === true;
  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'lead' || isAdmin;
  const canDelete = currentUser?.role === 'manager' || isAdmin;

  const handleStatusChange = (id: string, newStatus: 'OK' | 'LOW' | 'OUT') => {
    if (newStatus === 'LOW') {
      setLowCommentItem(id);
    } else {
      updateMutation.mutate({ id, updates: { status: newStatus, lowComment: null } });
    }
  };

  const submitLowComment = () => {
    if (lowCommentItem) {
      updateMutation.mutate({ id: lowCommentItem, updates: { status: 'LOW', lowComment: commentText } });
      setLowCommentItem(null);
      setCommentText("");
    }
  };

  const handleAddItem = () => {
    if (newItemName.trim()) {
      createMutation.mutate({ 
        name: newItemName, 
        emoji: newItemEmoji, 
        category: newItemCategory || undefined,
        status: 'OK'
      });
      setIsAddingItem(false);
      setNewItemName("");
      setNewItemCategory("");
    }
  };

  return (
    <Layout 
      title="Inventory"
      action={
        canEdit && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAddingItem(true)}
            className="w-9 h-9 rounded-full bg-flow-green text-black flex items-center justify-center shadow-lg shadow-flow-green/20"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
          </motion.button>
        )
      }
    >
      <div className="space-y-3">
        {inventory.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-card rounded-[20px] p-5 border border-white/[0.04] shadow-sm relative group"
          >
            {canDelete && (
              <button 
                onClick={() => deleteMutation.mutate(item.id)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-flow-red opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`button-delete-${item.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-4 mb-5">
              <div className="text-4xl bg-white/5 w-16 h-16 flex items-center justify-center rounded-2xl border border-white/5">
                {item.emoji}
              </div>
              <div>
                <h3 className="font-bold text-[19px] text-white">{item.name}</h3>
                {item.category && <span className="text-[10px] uppercase font-bold text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">{item.category}</span>}
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  Last: {item.updatedBy}
                </p>
              </div>
            </div>

            {/* Status Segmented Control */}
            <div className="grid grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-xl">
              {(['OK', 'LOW', 'OUT'] as const).map((status) => {
                const isActive = item.status === status;
                let activeClass = "";
                let textClass = "text-muted-foreground";
                
                if (isActive) {
                  if (status === 'OK') { activeClass = "bg-flow-green shadow-[0_0_15px_rgba(50,215,75,0.3)]"; textClass = "text-black font-bold"; }
                  if (status === 'LOW') { activeClass = "bg-flow-yellow shadow-[0_0_15px_rgba(247,209,84,0.3)]"; textClass = "text-black font-bold"; }
                  if (status === 'OUT') { activeClass = "bg-flow-red shadow-[0_0_15px_rgba(255,69,58,0.3)]"; textClass = "text-white font-bold"; }
                }

                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(item.id, status)}
                    className={cn(
                      "py-2.5 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden",
                      isActive ? activeClass : "hover:bg-white/5",
                      textClass
                    )}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
            
            {/* Display Comment if Exists */}
            {item.status === 'LOW' && item.lowComment && (
               <div className="mt-3 bg-flow-yellow/10 p-3 rounded-lg border border-flow-yellow/10">
                 <p className="text-xs text-flow-yellow italic">"{item.lowComment}"</p>
               </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* LOW Comment Dialog */}
      <Dialog open={!!lowCommentItem} onOpenChange={(open) => !open && setLowCommentItem(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Low Stock Alert</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm text-muted-foreground mb-2 block">How much is left approx?</label>
            <Input 
              autoFocus
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="e.g., 15% left, almost empty..."
              className="bg-black/20 border-white/10"
            />
          </div>
          <DialogFooter>
            <Button onClick={submitLowComment} className="w-full bg-flow-yellow text-black font-bold hover:bg-flow-yellow/90">Save Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Item Name</label>
              <Input 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Avocado"
                className="bg-black/20 border-white/10"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Emoji Icon</label>
              <Input 
                value={newItemEmoji}
                onChange={(e) => setNewItemEmoji(e.target.value)}
                placeholder="🥑"
                className="bg-black/20 border-white/10"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Category</label>
              <Input 
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                placeholder="Produce"
                className="bg-black/20 border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddItem} className="w-full bg-flow-green text-black font-bold hover:bg-flow-green/90">Save Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
