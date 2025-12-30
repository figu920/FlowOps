import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { useInventory, useUpdateInventory, useCreateInventory, useDeleteInventory } from '@/lib/hooks';
import type { Inventory as InventoryType } from '@shared/schema';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Camera, Folder, ChevronLeft, Package, FolderPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Inventory({ categoryColor = '#4CAF50' }: { categoryColor?: string }) {
  const { currentUser } = useStore();

  // FIX 1: default array vacío
const { data: rawInventory = [] as InventoryType[] } = useInventory();


  // Folders logic
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  const allItems = useMemo(() => {
    return [...rawInventory].sort((a, b) => a.name.localeCompare(b.name));
  }, [rawInventory]);

  const folders = useMemo(() => {
    const categories = new Set(allItems.map(i => i.category).filter(Boolean));
    // FIX 2: array de strings
    return Array.from(categories) as string[];
  }, [allItems]);

  const displayedItems = useMemo(() => {
    if (currentFolder) {
      return allItems.filter(i => i.category === currentFolder);
    }
    return allItems.filter(i => !i.category);
  }, [allItems, currentFolder]);

  const updateMutation = useUpdateInventory();
  const createMutation = useCreateInventory();
  const deleteMutation = useDeleteInventory();

  // FIX 3: missing state names
  const [lowCommentItem, setLowCommentItem] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  const [newItemName, setNewItemName] = useState("");
  const [newItemEmoji, setNewItemEmoji] = useState("📦");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("units");
  const [newItemCost, setNewItemCost] = useState("");

  const isAdmin = currentUser?.isSystemAdmin === true;

  // FIX 4: operadores OR correctos (||)
  const canEdit =
    currentUser?.role === 'manager' ||
    currentUser?.role === 'lead' ||
    isAdmin;

  const canDelete =
    currentUser?.role === 'manager' ||
    isAdmin;

  // Handlers

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

  // REEMPLAZA ESTA FUNCIÓN
const openAddItemModal = () => {
  setIsChoiceOpen(false);
  // CAMBIO AQUÍ: Si hay currentFolder, úsala. Si no, vacío.
  setNewItemCategory(currentFolder || ""); 
  setNewItemEmoji("📦");
  setNewItemName("");
  setIsAddingItem(true);
};

  const openAddFolderModal = () => {
    setIsChoiceOpen(false);
    setNewFolderName("");
    setIsAddingFolder(true);
  };

  // REEMPLAZA ESTA FUNCIÓN
const handleAddItem = () => {
    if (newItemName.trim()) {
      createMutation.mutate({
        name: newItemName,
        emoji: newItemEmoji,
        category: newItemCategory || currentFolder || undefined,
        status: 'OK',
        // --- AÑADE ESTO ---
        quantity: parseFloat(newItemQty) || 0, // Convierte texto a número
        unit: newItemUnit,
        costPerUnit: parseFloat(newItemCost) || 0,
        // ------------------
      });
      setIsAddingItem(false);
      
      // Limpiamos los campos
      setNewItemName("");
      setNewItemQty("");
      setNewItemCost("");
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      setCurrentFolder(newFolderName);
      setIsAddingFolder(false);

      setTimeout(() => {
        setNewItemCategory(newFolderName);
        setNewItemEmoji("📦");
        setNewItemName("");
        setIsAddingItem(true);
      }, 300);
    }
  };

  return (
    <Layout
      title={currentFolder ? currentFolder : "Inventory"}
      showBack={!currentFolder}
      action={
        canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.9 }}
               className="w-9 h-9 rounded-full text-black flex items-center justify-center shadow-lg"
               style={{ 
  backgroundColor: categoryColor, 
  // En web usamos boxShadow. Añadimos '80' al final para darle transparencia al brillo
  boxShadow: `0 4px 15px ${categoryColor}80` 
}}
              >
                <Plus className="w-5 h-5" strokeWidth={3} />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1C1C1E] border-white/10 text-white min-w-[160px]">
              <DropdownMenuItem onClick={openAddItemModal} className="focus:bg-white/10 py-3">
                <Package className="w-4 h-4 mr-2 text-flow-green" />
                <span>Nuevo Producto</span>
              </DropdownMenuItem>

              {!currentFolder && (
                <DropdownMenuItem onClick={openAddFolderModal} className="focus:bg-white/10 py-3">
                  <FolderPlus className="w-4 h-4 mr-2 text-flow-yellow" />
                  <span>Nueva Carpeta</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    >
      {currentFolder && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setCurrentFolder(null)}
          className="flex items-center text-muted-foreground hover:text-white mb-4 text-sm font-medium transition-colors"
          style={{ color: categoryColor }} 
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </motion.button>
      )}

      <div className="space-y-3">

        {/* FOLDERS */}
        {!currentFolder && folders.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {folders.map((folderName, idx) => (
              <motion.div
                key={folderName}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setCurrentFolder(folderName)}
                className="bg-card hover:bg-white/5 cursor-pointer rounded-[20px] p-4 border border-white/[0.04] flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Folder className="w-6 h-6" />
                </div>

                <span className="font-bold text-white truncate">{folderName}</span>

                <span className="text-[10px] text-muted-foreground uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full">
                  {rawInventory.filter((i: InventoryType) => i.category === folderName).length}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* ITEMS */}
        <AnimatePresence mode="popLayout">
          {displayedItems.length === 0 && currentFolder ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 bg-white/5 flex items-center justify-center mx-auto mb-4 rounded-full">
                <Package className="w-8 h-8 opacity-20" />
              </div>
              <p>Carpeta vacía.</p>
              <p className="text-xs mt-1">Añade un producto aquí.</p>
            </motion.div>
          ) : (

            displayedItems.map((item, idx) => (
              <motion.div
                key={item.id}
                layoutId={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-card rounded-[20px] p-5 border border-white/[0.04] shadow-sm relative group"
              >
                {canDelete && (
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-flow-red opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="flex items-center gap-4 mb-5">
                  <div className="text-4xl bg-white/5 w-16 h-16 flex items-center justify-center rounded-2xl border border-white/5">
                    {item.emoji}
                  </div>

                  <div>
                    <h3 className="font-bold text-[19px] text-white truncate">{item.name}</h3>

                    {!currentFolder && item.category && (
                      <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                        {item.category}
                      </span>
                    )}

                    <p className="text-xs text-muted-foreground font-medium mt-1 truncate">
                      Last: {item.updatedBy}
                      {/* VISUALIZAR CANTIDAD Y COSTE */}
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white font-bold border border-white/5">
                        📊 {item.quantity} {item.unit}
                      </span>
                      {item.costPerUnit > 0 && (
                        <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-flow-green font-bold border border-white/5">
                          💰 {item.costPerUnit} €
                        </span>
                      )}
                    </div>
                    </p>
                  </div>
                </div>

                {/* FIX 5: array de status */}
                <div className="grid grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-xl">
                  {(['OK', 'LOW', 'OUT'] as const).map((status) => {
                    const isActive = item.status === status;

                    let activeClass = "";
                    let textClass = "text-muted-foreground";

                    if (isActive) {
                      if (status === "OK") {
                        activeClass = "bg-flow-green";
                        textClass = "text-black font-bold";
                      }
                      if (status === "LOW") {
                        activeClass = "bg-flow-yellow";
                        textClass = "text-black font-bold";
                      }
                      if (status === "OUT") {
                        activeClass = "bg-flow-red";
                        textClass = "text-white font-bold";
                      }
                    }

                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(item.id, status)}
                        className={cn(
                          "py-2.5 rounded-lg text-sm font-medium transition-all",
                          isActive ? activeClass : "hover:bg-white/5",
                          textClass
                        )}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>

                {item.status === 'LOW' && item.lowComment && (
                  <div className="mt-3 bg-flow-yellow/10 p-3 rounded-lg border border-flow-yellow/10">
                    <p className="text-xs text-flow-yellow italic">"{item.lowComment}"</p>
                  </div>
                )}
              </motion.div>
            ))

          )}
        </AnimatePresence>
      </div>

      {/* MODAL LOW COMMENT */}
      <Dialog open={!!lowCommentItem} onOpenChange={(open) => !open && setLowCommentItem(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white p-6 rounded-2xl">
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

      {/* MODAL CHOICE */}
      <Dialog open={isChoiceOpen} onOpenChange={setIsChoiceOpen}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Añadir a Inventario</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              onClick={openAddFolderModal}
              className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <FolderPlus className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold">Nueva Carpeta</span>
            </button>

            <button
              onClick={openAddItemModal}
              className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5"
            >
              <div className="w-12 h-12 rounded-full bg-flow-green/20 text-flow-green flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold">Nuevo Producto</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL CREATE FOLDER */}
      <Dialog open={isAddingFolder} onOpenChange={setIsAddingFolder}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle>New Folder Group</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Folder className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Folder Name</label>
              <Input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Dairy, Meats, Dry Goods..."
                className="bg-black/20 border-white/10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCreateFolder} className="w-full bg-blue-500 text-white font-bold hover:bg-blue-600">
              Create & Enter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL ADD ITEM */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle>{currentFolder ? `Add to ${currentFolder}` : "Add Item"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 cursor-pointer hover:bg-white/10">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Emoji</label>
                <Input
                  value={newItemEmoji}
                  onChange={(e) => setNewItemEmoji(e.target.value)}
                  placeholder="🥑"
                  className="bg-black/20 border-white/10 text-center"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Category</label>
                <Input
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  placeholder="Produce"
                  className="bg-black/20 border-white/10"
                  disabled={!!currentFolder}
                />
              </div>
            </div>
          </div>

          {/* --- BLOQUE NUEVO: CANTIDAD Y PRECIO --- */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Quantity</label>
                <Input
                  type="number"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  placeholder="0"
                  className="bg-black/20 border-white/10"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Unit</label>
                <select 
                  className="w-full h-10 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                >
                  <option value="units">Units</option>
                  <option value="kg">kg</option>
                  <option value="g">grams</option>
                  <option value="L">Litros</option>
                  <option value="oz">oz</option>
                  <option value="lb">lbs</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Cost (€)</label>
                <Input
                  type="number"
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(e.target.value)}
                  placeholder="0.00"
                  className="bg-black/20 border-white/10"
                />
              </div>
            </div>

          <DialogFooter>
            <Button onClick={handleAddItem} className="w-full bg-flow-green text-black font-bold hover:bg-flow-green/90">
              Save Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}

 