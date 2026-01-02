import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { useInventory, useUpdateInventory, useCreateInventory, useDeleteInventory } from '@/lib/hooks';
import type { Inventory as InventoryType } from '@shared/schema';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Folder, ChevronLeft, Package, FolderPlus, Edit2, Search, X, FolderOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function Inventory({ categoryColor = '#4CAF50' }: { categoryColor?: string }) {
  const { currentUser } = useStore();
  const { toast } = useToast();
  const { data: rawInventory = [] as InventoryType[] } = useInventory();

  // --- ESTADOS ---
  const [currentPath, setCurrentPath] = useState<string | null>(null); // null = Raíz
  const [searchQuery, setSearchQuery] = useState("");
  
  // Acciones de Producto
  const updateMutation = useUpdateInventory();
  const createMutation = useCreateInventory();
  const deleteMutation = useDeleteInventory();

  // Estados de Modales
  const [lowCommentItem, setLowCommentItem] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  
  // Edición
  const [editingItem, setEditingItem] = useState<InventoryType | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null); // Nombre completo de la carpeta a editar
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
  const [folderNewName, setFolderNewName] = useState("");

  const [newFolderName, setNewFolderName] = useState("");

  // Borrado de Carpeta
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null); // Nombre completo de la carpeta a borrar

  // Formulario Item
  const [newItemName, setNewItemName] = useState("");
  const [newItemEmoji, setNewItemEmoji] = useState("📦");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("units");
  const [newItemCost, setNewItemCost] = useState("");

  // Permisos
  const isAdmin = currentUser?.isSystemAdmin === true;
  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'lead' || isAdmin;
  const canDelete = currentUser?.role === 'manager' || isAdmin;

  // --- LÓGICA DE CARPETAS ANIDADAS (EL CEREBRO 🧠) ---
  
  // 1. Items en el nivel actual (excluyendo subcarpetas)
  const itemsInCurrentPath = useMemo(() => {
    let items = rawInventory.filter((i: InventoryType) => {
      // Si estamos en raíz, queremos items sin categoría O items cuya categoría sea ""
      if (!currentPath) return !i.category;
      // Si estamos en una ruta, queremos items que coincidan EXACTAMENTE con esa ruta
      return i.category === currentPath;
    });

    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      // Si buscamos, buscamos en TODO el inventario que coincida con la ruta actual como prefijo
      items = rawInventory.filter((i: InventoryType) => {
        const inPath = currentPath ? i.category?.startsWith(currentPath) : true;
        const matchesName = i.name.toLowerCase().includes(query);
        return inPath && matchesName;
      });
    }

    return items.sort((a: InventoryType, b: InventoryType) => a.name.localeCompare(b.name));
  }, [rawInventory, currentPath, searchQuery]);

  // 2. Subcarpetas visibles en el nivel actual
  const visibleFolders = useMemo(() => {
    if (searchQuery.trim()) return []; // Si buscamos, ocultamos carpetas

    const subFolders = new Set<string>();
    
    rawInventory.forEach((item: InventoryType) => {
      if (!item.category) return;
      
      // Si estamos en raíz, cogemos la primera parte de la ruta (Ej: "Comida/Carne" -> "Comida")
      if (!currentPath) {
        const firstPart = item.category.split('/')[0];
        if (firstPart) subFolders.add(firstPart);
      } 
      // Si estamos dentro de "Comida", buscamos lo que siga a "Comida/"
      else if (item.category.startsWith(currentPath + '/')) {
        const relativePath = item.category.slice(currentPath.length + 1); // "Carne/Rojo"
        const nextPart = relativePath.split('/')[0]; // "Carne"
        if (nextPart) subFolders.add(nextPart);
      }
    });

    return Array.from(subFolders).sort();
  }, [rawInventory, currentPath, searchQuery]);

  // --- HANDLERS ---

  const handleBack = () => {
    setSearchQuery("");
    if (!currentPath) return;
    
    // Subir un nivel: "Comida/Carne/Vacuno" -> "Comida/Carne"
    const parts = currentPath.split('/');
    parts.pop(); // Quitamos el último
    setCurrentPath(parts.length > 0 ? parts.join('/') : null);
  };

  const handleEnterFolder = (folderName: string) => {
    setSearchQuery("");
    // Si estamos en raíz, la nueva ruta es el nombre. Si no, añadimos "/Nombre"
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
  };

  // --- RENOMBRAR CARPETA (BATCH UPDATE) ---
  const openRenameFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolder(folderName);
    setFolderNewName(folderName);
    setIsRenamingFolder(true);
  };

  const performRenameFolder = async () => {
    if (!editingFolder || !folderNewName.trim() || folderNewName === editingFolder) {
      setIsRenamingFolder(false);
      return;
    }

    const oldFullPath = currentPath ? `${currentPath}/${editingFolder}` : editingFolder;
    const newFullPath = currentPath ? `${currentPath}/${folderNewName}` : folderNewName;

    // Buscamos items afectados
    const itemsToUpdate = rawInventory.filter((i: InventoryType) => i.category && (i.category === oldFullPath || i.category.startsWith(oldFullPath + '/')));

    // Actualizamos uno a uno
    let count = 0;
    for (const item of itemsToUpdate) {
      const updatedCategory = item.category!.replace(oldFullPath, newFullPath);
      await updateMutation.mutateAsync({
        id: item.id,
        updates: { category: updatedCategory }
      });
      count++;
    }

    toast({ title: "Folder Renamed", description: `Updated path for ${count} items.` });
    setIsRenamingFolder(false);
    setEditingFolder(null);
  };

  // --- BORRAR CARPETA (BATCH DELETE) ---
  const openDeleteFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingFolder(folderName);
  };

  const performDeleteFolder = async () => {
    if (!deletingFolder) return;
    const targetPath = currentPath ? `${currentPath}/${deletingFolder}` : deletingFolder;
    
    // Items dentro de esta carpeta y sus subcarpetas
    const itemsToDelete = rawInventory.filter((i: InventoryType) => i.category && (i.category === targetPath || i.category.startsWith(targetPath + '/')));

    if (itemsToDelete.length > 0) {
        for (const item of itemsToDelete) {
            await deleteMutation.mutateAsync(item.id);
        }
    }
    
    toast({ title: "Folder Deleted", description: `Removed folder and ${itemsToDelete.length} items.` });
    setDeletingFolder(null);
  };

  // --- ITEM CRUD ---
  const handleSaveItem = () => {
    if (newItemName.trim()) {
      const itemData = {
        name: newItemName,
        emoji: newItemEmoji,
        category: currentPath || undefined,
        quantity: parseFloat(newItemQty) || 0,
        unit: newItemUnit,
        costPerUnit: parseFloat(newItemCost) || 0,
      };

      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id, updates: itemData });
      } else {
        createMutation.mutate({ ...itemData, status: 'OK' });
      }

      setIsAddingItem(false);
      setEditingItem(null);
      setNewItemName("");
      setNewItemQty("");
      setNewItemCost("");
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const newPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
      setCurrentPath(newPath);
      
      setIsAddingFolder(false);
      setNewFolderName("");
      
      setTimeout(() => openAddItemModal(), 300);
    }
  };

  const openAddItemModal = () => {
    setIsChoiceOpen(false);
    setEditingItem(null);
    setNewItemEmoji("📦");
    setNewItemName("");
    setNewItemQty("");
    setNewItemCost("");
    setNewItemUnit("units");
    setIsAddingItem(true);
  };

  const openEditItemModal = (item: InventoryType) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemEmoji(item.emoji);
    setNewItemQty(item.quantity?.toString() || "0");
    setNewItemUnit(item.unit || "units");
    setNewItemCost(item.costPerUnit?.toString() || "0");
    setIsAddingItem(true);
  };

  const handleStatusChange = (id: string, newStatus: 'OK' | 'LOW' | 'OUT') => {
    if (newStatus === 'LOW') setLowCommentItem(id);
    else updateMutation.mutate({ id, updates: { status: newStatus, lowComment: null } });
  };

  const submitLowComment = () => {
    if (lowCommentItem) {
      updateMutation.mutate({ id: lowCommentItem, updates: { status: 'LOW', lowComment: commentText } });
      setLowCommentItem(null);
      setCommentText("");
    }
  };

  return (
    <Layout
      title={currentPath ? currentPath.split('/').pop() : "Inventory"}
      // ✅ CORREGIDO: Mostramos 'Back' del sistema si NO hay carpeta actual (estamos en raíz)
      showBack={!currentPath}
      action={
        canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.9 }}
               className="w-9 h-9 rounded-full text-black flex items-center justify-center shadow-lg"
               style={{ backgroundColor: categoryColor, boxShadow: `0 4px 15px ${categoryColor}80` }}
              >
                <Plus className="w-5 h-5" strokeWidth={3} />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1C1C1E] border-white/10 text-white min-w-[160px]">
              <DropdownMenuItem onClick={openAddItemModal} className="focus:bg-white/10 py-3">
                <Package className="w-4 h-4 mr-2 text-flow-green" />
                <span>Nuevo Producto</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setIsChoiceOpen(false); setIsAddingFolder(true); }} className="focus:bg-white/10 py-3">
                <FolderPlus className="w-4 h-4 mr-2 text-flow-yellow" />
                <span>Nueva Carpeta</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    >
      {/* Search Bar & Navigation */}
      <div className="mb-6 space-y-2">
         {currentPath && (
             <div className="flex items-center justify-between">
                 {/* BOTÓN BACK PERSONALIZADO (Solo visible dentro de carpetas) */}
                 <button 
                    onClick={handleBack}
                    className="flex items-center text-muted-foreground hover:text-white text-sm font-medium transition-colors mb-2"
                 >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                 </button>

                 <div className="text-xs text-muted-foreground px-1 flex items-center gap-1">
                     <FolderOpen className="w-3 h-3" />
                     <span>/ {currentPath.replaceAll('/', ' / ')}</span>
                 </div>
             </div>
         )}
         
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={currentPath ? `Search inside ${currentPath.split('/').pop()}...` : "Search all items..."}
                className="pl-9 pr-9 bg-black/20 border-white/10 h-10 text-white placeholder:text-muted-foreground/50 rounded-xl focus-visible:ring-1 focus-visible:ring-white/20"
            />
            {searchQuery && (
                <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
         </div>
      </div>

      <div className="space-y-3">
        {/* CARPETAS (VISIBLES) */}
        {visibleFolders.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {visibleFolders.map((folderName, idx) => (
              <motion.div
                key={folderName}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleEnterFolder(folderName)}
                className="bg-card hover:bg-white/5 cursor-pointer rounded-[20px] p-4 border border-white/[0.04] flex flex-col items-center gap-3 relative group"
              >
                {/* ACCIONES DE CARPETA (SIEMPRE VISIBLES PARA MÓVIL) */}
                {canEdit && (
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                         <button 
                            onClick={(e) => openRenameFolder(folderName, e)}
                            className="p-1.5 bg-black/40 hover:bg-black/60 rounded-md text-white/70 hover:text-white backdrop-blur-sm"
                         >
                            <Edit2 className="w-3 h-3" />
                         </button>
                         {canDelete && (
                             <button 
                                onClick={(e) => openDeleteFolder(folderName, e)}
                                className="p-1.5 bg-black/40 hover:bg-flow-red rounded-md text-white/70 hover:text-white backdrop-blur-sm"
                             >
                                <Trash2 className="w-3 h-3" />
                             </button>
                         )}
                    </div>
                )}

                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mt-2">
                  <Folder className="w-6 h-6" />
                </div>
                <span className="font-bold text-white truncate w-full text-center">{folderName}</span>
                
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full">
                  Folder
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* ITEMS */}
        <AnimatePresence mode="popLayout">
          {itemsInCurrentPath.length === 0 && visibleFolders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-muted-foreground">
              {searchQuery ? (
                  <>
                    <Search className="w-12 h-12 opacity-20 mx-auto mb-3" />
                    <p>No matching items found.</p>
                  </>
              ) : (
                  <>
                    <div className="w-16 h-16 bg-white/5 flex items-center justify-center mx-auto mb-4 rounded-full">
                        <Package className="w-8 h-8 opacity-20" />
                    </div>
                    <p>Empty folder.</p>
                    <p className="text-xs mt-1">Add an item to create this folder.</p>
                  </>
              )}
            </motion.div>
          ) : (
            itemsInCurrentPath.map((item: InventoryType, idx: number) => (
              <motion.div
                key={item.id}
                layoutId={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-card rounded-[20px] p-5 border border-white/[0.04] shadow-sm relative group"
              >
                {/* ACCIONES DE ITEM (SIEMPRE VISIBLES PARA MÓVIL) */}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                    {canEdit && (
                      <button onClick={() => openEditItemModal(item)} className="p-2 text-muted-foreground hover:text-white bg-black/20 hover:bg-black/40 rounded-lg transition-colors backdrop-blur-sm">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => deleteMutation.mutate(item.id)} className="p-2 text-muted-foreground hover:text-flow-red bg-black/20 hover:bg-black/40 rounded-lg transition-colors backdrop-blur-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                </div>

                <div className="flex items-center gap-4 mb-5">
                  <div className="text-4xl bg-white/5 w-16 h-16 flex items-center justify-center rounded-2xl border border-white/5">
                    {item.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-[19px] text-white truncate max-w-[150px]">{item.name}</h3>
                    {searchQuery && item.category && (
                        <span className="text-[10px] text-muted-foreground block">
                            in {item.category.replaceAll('/', ' > ')}
                        </span>
                    )}
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white font-bold border border-white/5">
                        📊 {item.quantity} {item.unit}
                      </span>
                      {(item.costPerUnit || 0) > 0 && (
                        <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-flow-green font-bold border border-white/5">
                          💰 {item.costPerUnit} $
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-xl">
                  {(['OK', 'LOW', 'OUT'] as const).map((status) => {
                    const isActive = item.status === status;
                    let activeClass = "";
                    let textClass = "text-muted-foreground";
                    if (isActive) {
                      if (status === "OK") { activeClass = "bg-flow-green"; textClass = "text-black font-bold"; }
                      if (status === "LOW") { activeClass = "bg-flow-yellow"; textClass = "text-black font-bold"; }
                      if (status === "OUT") { activeClass = "bg-flow-red"; textClass = "text-white font-bold"; }
                    }
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(item.id, status)}
                        className={cn("py-2.5 rounded-lg text-sm font-medium transition-all", isActive ? activeClass : "hover:bg-white/5", textClass)}
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

      {/* --- MODALES (Igual que antes) --- */}

      {/* 1. Low Comment */}
      <Dialog open={!!lowCommentItem} onOpenChange={(open) => !open && setLowCommentItem(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white p-6 rounded-2xl">
          <DialogHeader><DialogTitle>Low Stock Alert</DialogTitle></DialogHeader>
          <div className="py-4">
            <label className="text-sm text-muted-foreground mb-2 block">How much is left approx?</label>
            <Input autoFocus value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="e.g., 15% left..." className="bg-black/20 border-white/10"/>
          </div>
          <DialogFooter><Button onClick={submitLowComment} className="w-full bg-flow-yellow text-black font-bold hover:bg-flow-yellow/90">Save Status</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Crear Carpeta */}
      <Dialog open={isAddingFolder} onOpenChange={setIsAddingFolder}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white p-6 rounded-2xl">
          <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex justify-center mb-4"><div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center"><Folder className="w-8 h-8 text-blue-400" /></div></div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">
                  {currentPath ? `Inside ${currentPath.split('/').pop()}` : "Folder Name"}
              </label>
              <Input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="e.g. Dairy..." className="bg-black/20 border-white/10"/>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreateFolder} className="w-full bg-blue-500 text-white font-bold hover:bg-blue-600">Create & Enter</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 3. Renombrar Carpeta */}
      <Dialog open={isRenamingFolder} onOpenChange={setIsRenamingFolder}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white p-6 rounded-2xl">
          <DialogHeader><DialogTitle>Rename Folder</DialogTitle></DialogHeader>
          <div className="py-4">
            <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">New Name</label>
            <Input autoFocus value={folderNewName} onChange={(e) => setFolderNewName(e.target.value)} className="bg-black/20 border-white/10"/>
            <p className="text-xs text-muted-foreground mt-2">This will update all items inside this folder.</p>
          </div>
          <DialogFooter><Button onClick={performRenameFolder} className="w-full bg-white text-black font-bold">Update Folder Name</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Borrar Carpeta */}
      <Dialog open={!!deletingFolder} onOpenChange={() => setDeletingFolder(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white p-6 rounded-2xl">
          <DialogHeader><DialogTitle className="text-flow-red">Delete Folder?</DialogTitle></DialogHeader>
          <div className="py-4 text-center">
            <div className="w-16 h-16 bg-flow-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-flow-red" />
            </div>
            <p className="text-lg font-bold text-white mb-2">Delete "{deletingFolder}"</p>
            <p className="text-sm text-muted-foreground">
                This will permanently delete <b>all items inside</b> this folder and its subfolders.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeletingFolder(null)} className="text-muted-foreground">Cancel</Button>
            <Button onClick={performDeleteFolder} className="bg-flow-red text-white font-bold hover:bg-flow-red/90">Yes, Delete Everything</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Crear/Editar Item */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle>
                {editingItem ? `Edit ${editingItem.name}` : (currentPath ? `Add to ${currentPath.split('/').pop()}` : "Add Item")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 cursor-pointer hover:bg-white/10">
                <div className="text-4xl">{newItemEmoji}</div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Item Name</label>
              <Input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g. Avocado" className="bg-black/20 border-white/10"/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Emoji</label>
                <Input value={newItemEmoji} onChange={(e) => setNewItemEmoji(e.target.value)} placeholder="🥑" className="bg-black/20 border-white/10 text-center"/>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Location</label>
                <Input value={currentPath || "Root"} disabled className="bg-black/20 border-white/10 text-muted-foreground italic"/>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Quantity</label>
                <Input type="number" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} placeholder="0" className="bg-black/20 border-white/10"/>
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Unit</label>
                <select 
                  className="w-full h-10 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                >
                  <option value="units">Units (ea)</option>
                  <option value="lb">Pounds (lb)</option>
                  <option value="oz">Ounces (oz)</option>
                  <option value="gal">Gallons (gal)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="L">Liters (L)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Cost ($)</label>
                <Input type="number" value={newItemCost} onChange={(e) => setNewItemCost(e.target.value)} placeholder="0.00" className="bg-black/20 border-white/10"/>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSaveItem} className="w-full bg-flow-green text-black font-bold hover:bg-flow-green/90">
              {editingItem ? 'Update Stock' : 'Save Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}