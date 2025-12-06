import { useState } from 'react';
import Layout from '@/components/Layout';
import { useStore, MenuItem, MeasurementUnit } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronDown, Utensils, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Menu() {
  const { menu, currentUser, addMenuItem, deleteMenuItem, addIngredient, updateIngredient, deleteIngredient } = useStore();
  
  // State for Add/Edit
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [newDishName, setNewDishName] = useState("");
  const [newDishCategory, setNewDishCategory] = useState("");

  const [addingIngredientTo, setAddingIngredientTo] = useState<string | null>(null);
  const [editingIngredient, setEditingIngredient] = useState<{menuId: string, ingId: string} | null>(null);
  
  const [ingName, setIngName] = useState("");
  const [ingQty, setIngQty] = useState("");
  const [ingUnit, setIngUnit] = useState<MeasurementUnit>("grams");
  const [ingNotes, setIngNotes] = useState("");

  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isManager = currentUser?.role === 'manager';

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAddDish = () => {
    if (newDishName && newDishCategory) {
      addMenuItem(newDishName, newDishCategory);
      setIsAddingDish(false);
      setNewDishName("");
      setNewDishCategory("");
    }
  };

  const openAddIngredient = (menuId: string) => {
    setAddingIngredientTo(menuId);
    setIngName("");
    setIngQty("");
    setIngUnit("grams");
    setIngNotes("");
  };

  const openEditIngredient = (menuId: string, ing: any) => {
    setEditingIngredient({ menuId, ingId: ing.id });
    setIngName(ing.name);
    setIngQty(ing.quantity.toString());
    setIngUnit(ing.unit);
    setIngNotes(ing.notes || "");
  };

  const handleSaveIngredient = () => {
    const quantity = parseFloat(ingQty);
    if (!ingName || isNaN(quantity)) return;

    if (editingIngredient) {
      updateIngredient(editingIngredient.menuId, editingIngredient.ingId, {
        name: ingName,
        quantity,
        unit: ingUnit,
        notes: ingNotes
      });
      setEditingIngredient(null);
    } else if (addingIngredientTo) {
      addIngredient(addingIngredientTo, ingName, quantity, ingUnit, ingNotes);
      setAddingIngredientTo(null);
    }
  };

  return (
    <Layout 
      title="Menu & Portion Sizes"
      action={
        isManager && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAddingDish(true)}
            className="w-9 h-9 rounded-full bg-flow-green text-black flex items-center justify-center shadow-lg shadow-flow-green/20"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
          </motion.button>
        )
      }
    >
      <div className="space-y-4">
        {menu.map((dish, idx) => (
          <motion.div
            key={dish.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-card rounded-[24px] border border-white/[0.04] overflow-hidden group"
          >
            <div 
              onClick={() => toggleExpand(dish.id)}
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors relative"
            >
               {isManager && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteMenuItem(dish.id); }}
                    className="absolute top-5 right-12 p-2 text-muted-foreground hover:text-flow-red opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
               )}
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-flow-green">
                  <Utensils className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{dish.name}</h3>
                  <span className="text-xs font-bold text-muted-foreground uppercase bg-white/5 px-2 py-0.5 rounded">{dish.category}</span>
                </div>
              </div>
              
              <motion.div
                animate={{ rotate: expandedItems.includes(dish.id) ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </div>

            <AnimatePresence>
              {expandedItems.includes(dish.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-black/20 border-t border-white/[0.04]"
                >
                  <div className="p-4 space-y-3">
                    {dish.ingredients.map((ing) => (
                      <div 
                        key={ing.id} 
                        onClick={() => isManager && openEditIngredient(dish.id, ing)}
                        className={cn(
                          "flex items-start justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]",
                          isManager && "cursor-pointer hover:border-white/10 hover:bg-white/5 transition-all"
                        )}
                      >
                         <div>
                           <div className="flex items-center gap-2">
                             <span className="font-semibold text-white">{ing.name}</span>
                             {isManager && <Edit2 className="w-3 h-3 text-muted-foreground opacity-50" />}
                           </div>
                           {ing.notes && (
                             <p className="text-xs text-muted-foreground italic mt-0.5">"{ing.notes}"</p>
                           )}
                         </div>
                         <div className="text-right">
                           <span className="text-lg font-bold text-flow-green">{ing.quantity}</span>
                           <span className="text-xs text-muted-foreground uppercase ml-1 font-medium">{ing.unit}</span>
                         </div>
                      </div>
                    ))}
                    
                    {dish.ingredients.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-2">No ingredients listed.</p>
                    )}

                    {isManager && (
                      <Button 
                        onClick={() => openAddIngredient(dish.id)}
                        variant="ghost" 
                        className="w-full border border-dashed border-white/10 text-muted-foreground hover:text-white hover:border-white/20 h-10 rounded-xl"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Ingredient
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Add Dish Dialog */}
      <Dialog open={isAddingDish} onOpenChange={setIsAddingDish}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Add New Dish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Dish Name</label>
              <Input 
                value={newDishName}
                onChange={(e) => setNewDishName(e.target.value)}
                placeholder="e.g. Spicy Chicken Sandwich"
                className="bg-black/20 border-white/10"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Category</label>
              <Input 
                value={newDishCategory}
                onChange={(e) => setNewDishCategory(e.target.value)}
                placeholder="e.g. Burgers"
                className="bg-black/20 border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddDish} className="w-full bg-flow-green text-black font-bold hover:bg-flow-green/90">Save Dish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Ingredient Dialog */}
      <Dialog open={!!addingIngredientTo || !!editingIngredient} onOpenChange={() => { setAddingIngredientTo(null); setEditingIngredient(null); }}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>{editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Ingredient Name</label>
              <Input 
                value={ingName}
                onChange={(e) => setIngName(e.target.value)}
                placeholder="e.g. Beef Patty"
                className="bg-black/20 border-white/10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Quantity</label>
                <Input 
                  type="number"
                  value={ingQty}
                  onChange={(e) => setIngQty(e.target.value)}
                  placeholder="120"
                  className="bg-black/20 border-white/10"
                />
               </div>
               <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Unit</label>
                <Select value={ingUnit} onValueChange={(v: MeasurementUnit) => setIngUnit(v)}>
                  <SelectTrigger className="bg-black/20 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1C1C1E] border-white/10 text-white">
                    <SelectItem value="grams">Grams</SelectItem>
                    <SelectItem value="oz">Ounces (oz)</SelectItem>
                    <SelectItem value="cups">Cups</SelectItem>
                    <SelectItem value="bowls">Bowls</SelectItem>
                    <SelectItem value="tablespoons">Tablespoons</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                  </SelectContent>
                </Select>
               </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Notes (Optional)</label>
              <Textarea 
                value={ingNotes}
                onChange={(e) => setIngNotes(e.target.value)}
                placeholder="e.g. Must be filled to the top"
                className="bg-black/20 border-white/10 h-20 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
             {editingIngredient && (
                <Button 
                  variant="ghost"
                  onClick={() => {
                    deleteIngredient(editingIngredient.menuId, editingIngredient.ingId);
                    setEditingIngredient(null);
                  }}
                  className="text-flow-red hover:text-flow-red/80 hover:bg-flow-red/10"
                >
                  Delete
                </Button>
             )}
            <Button onClick={handleSaveIngredient} className="w-full bg-flow-green text-black font-bold hover:bg-flow-green/90">
              {editingIngredient ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
