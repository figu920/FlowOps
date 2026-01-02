import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { useInventory, useUpdateInventory, useCreateInventory, useDeleteInventory } from '@/lib/hooks';
import type { Inventory as InventoryType } from '@shared/schema';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Folder, ChevronLeft, Package, FolderPlus, Edit2, Search, X, FolderOpen, Link as LinkIcon } from 'lucide-react';
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

// --- GENERADOR DE COLOR ---
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#F87171', '#FB923C', '#FACC15', '#4ADE80', '#2DD4BF', '#38BDF8', '#818CF8', '#C084FC', '#F472B6', '#FB7185'];
  return colors[Math.abs(hash) % colors.length];
};

// --- CEREBRO DE EMOJIS AUTOMÁTICOS 🧠 ---
const getAutoEmoji = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('burger') || n.includes('patty') || n.includes('beef')) return '🍔';
    if (n.includes('fry') || n.includes('fries')) return '🍟';
    if (n.includes('soda') || n.includes('coke') || n.includes('pepsi') || n.includes('drink')) return '🥤';
    if (n.includes('beer') || n.includes('cerveza')) return '🍺';
    if (n.includes('wine')) return '🍷';
    if (n.includes('water')) return '💧';
    if (n.includes('pizza')) return '🍕';
    if (n.includes('salad') || n.includes('lettuce')) return '🥗';
    if (n.includes('chicken')) return '🍗';
    if (n.includes('bacon')) return '🥓';
    if (n.includes('cheese')) return '🧀';
    if (n.includes('egg')) return '🥚';
    if (n.includes('tomato')) return '🍅';
    if (n.includes('onion')) return '🧅';
    if (n.includes('sauce') || n.includes('ketchup')) return '🥫';
    if (n.includes('ice') || n.includes('cream')) return '🍦';
    if (n.includes('coffee')) return '☕';
    return '📦'; // Default
};

export default function Inventory({ categoryColor = '#4CAF50' }: { categoryColor?: string }) {
  const { currentUser } = useStore();
  const { toast } = useToast();
  const { data: rawInventory = [] as InventoryType[] } = useInventory();

  // --- ESTADOS ---
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Acciones
  const updateMutation = useUpdateInventory();
  const createMutation = useCreateInventory();
  const deleteMutation = useDeleteInventory();

  // Estados UI
  const [lowCommentItem, setLowCommentItem] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryType | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
  const [folderNewName, setFolderNewName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);

  // Formulario Item
  const [newItemName, setNewItemName] = useState("");
  const [newItemIcon, setNewItemIcon] = useState("📦"); // Puede ser Emoji o URL
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("units");
  const [newItemCost, setNewItemCost] = useState("");

  const isAdmin = currentUser?.isSystemAdmin === true;
  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'lead' || isAdmin;
  const canDelete = currentUser?.role === 'manager' || isAdmin;

  // --- LÓGICA DE FILTRADO ---
  const itemsInCurrentPath = useMemo(() => {
    let items = rawInventory.filter((i: InventoryType) => {
      if (!currentPath) return !i.category;
      return i.category === currentPath;
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = rawInventory.filter((i: InventoryType) => {
        const inPath = currentPath ? i.category?.startsWith(currentPath) : true;
        return inPath && i.name.toLowerCase().includes(query);
      });
    }
    return items.sort((a: InventoryType, b: InventoryType) => a.name.localeCompare(b.name));
  }, [rawInventory, currentPath, searchQuery]);

  const visibleFolders = useMemo(() => {
    if (searchQuery.trim()) return [];
    const subFolders = new Set<string>();
    rawInventory.forEach((item: InventoryType) => {
      if (!item.category) return;
      if (!currentPath) {
        subFolders.add(item.category.split('/')[0]);
      } else if (item.category.startsWith(currentPath + '/')) {
        subFolders.add(item.category.slice(currentPath.length + 1).split('/')[0]);
      }
    });
    return Array.from(subFolders).sort();
  }, [rawInventory, currentPath, searchQuery]);

  // --- HANDLERS ---
  const handleBack = () => {
    setSearchQuery("");
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.length > 0 ? parts.join('/') : null);
  };

  const handleEnterFolder = (folderName: string) => {
    setSearchQuery("");
    setCurrentPath(currentPath ? `${currentPath}/${folderName}` : folderName);
  };

  const performRenameFolder = async () => {
    if (!editingFolder || !folderNewName.trim() || folderNewName === editingFolder) {
      setIsRenamingFolder(false); return;
    }
    const oldPath = currentPath ? `${currentPath}/${editingFolder}` : editingFolder;
    const newPath = currentPath ? `${currentPath}/${folderNewName}` : folderNewName;
    const items = rawInventory.filter((i: InventoryType) => i.category && (i.category === oldPath || i.category.startsWith(oldPath + '/')));
    
    for (const item of items) {
      await updateMutation.mutateAsync({ id: item.id, updates: { category: item.category!.replace(oldPath, newPath) } });
    }
    setIsRenamingFolder(false);
  };

  const performDeleteFolder = async () => {
    if (!deletingFolder) return;
    const path = currentPath ? `${currentPath}/${deletingFolder}` : deletingFolder;
    const items = rawInventory.filter((i: InventoryType) => i.category && (i.category === path || i.category.startsWith(path + '/')));
    for (const item of items) await deleteMutation.mutateAsync(item.id);
    setDeletingFolder(null);
  };

  const handleSaveItem = () => {
    if (newItemName.trim()) {
      const data = {
        name: newItemName,
        emoji: newItemIcon, // Guardamos el Emoji o la URL aquí
        category: currentPath || undefined,
        quantity: parseFloat(newItemQty) || 0,
        unit: newItemUnit,
        costPerUnit: parseFloat(newItemCost) || 0,
      };
      if (editingItem) updateMutation.mutate({ id: editingItem.id, updates: data });
      else createMutation.mutate({ ...data, status: 'OK' });
      
      setIsAddingItem(false);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      setCurrentPath(currentPath ? `${currentPath}/${newFolderName}` : newFolderName);
      setIsAddingFolder(false);
      setNewFolderName("");
      setTimeout(() => {
          setIsAddingItem(true);
          setEditingItem(null);
          setNewItemIcon("📦");
          setNewItemName("");
      }, 300);
    }
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

  // --- AUTO-DETECT EMOJI ON NAME BLUR ---
  const handleNameBlur = () => {
    if (newItemIcon === "📦" || newItemIcon === "") {
        setNewItemIcon(getAutoEmoji(newItemName));
    }
  };

  // --- HELPER PARA MOSTRAR ICONO O IMAGEN ---
  const renderItemIcon = (iconStr: string, color: string) => {
      // Si es una URL (empieza por http), mostramos IMAGEN
      if (iconStr && (iconStr.startsWith('http') || iconStr.startsWith('data:image'))) {
          return (
              <img 
                src={iconStr} 
                alt="icon" 
                className="w-full h-full object-cover rounded-xl"
                style={{ backgroundColor: `${color}10` }} 
              />
          );
      }
      // Si no, mostramos EMOJI
      return <span className="text-4xl">{iconStr || '📦'}</span>;
  };

  return (
    <Layout
      title={currentPath ? currentPath.split('/').pop() : "Inventory"}
      showBack={!currentPath}
      action={canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg text-black" style={{ backgroundColor: categoryColor }}>
              <Plus className="w-5 h-5" strokeWidth={3} />
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1C1C1E] border-white/10 text-white">
            <DropdownMenuItem onClick={() => { setIsAddingItem(true); setEditingItem(null); setNewItemName(""); setNewItemQty(""); setNewItemCost(""); setNewItemIcon("📦"); }}>
              <Package className="w-4 h-4 mr-2 text-flow-green"/> New Product
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsAddingFolder(true)}>
              <FolderPlus className="w-4 h-4 mr-2 text-flow-yellow"/> New Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    >
      <div className="mb-6 space-y-2">
         {currentPath && (
             <div className="flex items-center justify-between">
                 <button onClick={handleBack} className="flex items-center text-muted-foreground hover:text-white text-sm font-medium transition-colors mb-2">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                 </button>
                 <div className="text-xs text-muted-foreground px-1 flex items-center gap-1">
                     <FolderOpen className="w-3 h-3" /> <span>/ {currentPath.replaceAll('/', ' / ')}</span>
                 </div>
             </div>
         )}
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-9 bg-black/20 border-white/10 h-10 rounded-xl" />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-4 h-4"/></button>}
         </div>
      </div>

      <div className="space-y-3">
        {visibleFolders.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {visibleFolders.map((folder) => (
              <motion.div key={folder} onClick={() => handleEnterFolder(folder)} className="bg-card hover:bg-white/5 cursor-pointer rounded-[20px] p-4 border border-white/[0.04] flex flex-col items-center gap-3 relative group">
                {canEdit && (
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                         <button onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); setFolderNewName(folder); setIsRenamingFolder(true); }} className="p-1.5 bg-black/40 rounded-md text-white/70 hover:text-white"><Edit2 className="w-3 h-3"/></button>
                         {canDelete && <button onClick={(e) => { e.stopPropagation(); setDeletingFolder(folder); }} className="p-1.5 bg-black/40 hover:bg-red-500/80 rounded-md text-white/70 hover:text-white"><Trash2 className="w-3 h-3"/></button>}
                    </div>
                )}
                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mt-2"><Folder className="w-6 h-6" /></div>
                <span className="font-bold text-white truncate w-full text-center">{folder}</span>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {itemsInCurrentPath.map((item: InventoryType, idx: number) => {
            const itemColor = stringToColor(item.name);

            return (
              <motion.div
                key={item.id}
                layoutId={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                style={{ 
                    borderColor: `${itemColor}40`, 
                    backgroundColor: `${itemColor}05`
                }}
                className="rounded-[20px] p-5 border shadow-sm relative group overflow-hidden"
              >
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                    {/* AQUÍ ESTABA EL ERROR: Añadido || "units" */}
                    {canEdit && <button onClick={() => { setIsAddingItem(true); setEditingItem(item); setNewItemName(item.name); setNewItemIcon(item.emoji); setNewItemQty(String(item.quantity)); setNewItemUnit(item.unit || "units"); setNewItemCost(String(item.costPerUnit)); }} className="p-2 bg-black/20 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white"><Edit2 className="w-4 h-4"/></button>}
                    {canDelete && <button onClick={() => deleteMutation.mutate(item.id)} className="p-2 bg-black/20 hover:bg-red-500/20 rounded-lg text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4"/></button>}
                </div>

                <div className="flex items-center gap-4 mb-5">
                  <div 
                    style={{ backgroundColor: `${itemColor}10`, borderColor: `${itemColor}20` }}
                    className="w-16 h-16 flex items-center justify-center rounded-2xl border overflow-hidden shrink-0"
                  >
                    {renderItemIcon(item.emoji, itemColor)}
                  </div>
                  
                  <div className="min-w-0">
                    <h3 className="font-bold text-[19px] text-white truncate max-w-[150px]">{item.name}</h3>
                    {searchQuery && item.category && <span className="text-[10px] text-muted-foreground block">in {item.category}</span>}
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white font-bold border border-white/5">📊 {item.quantity} {item.unit}</span>
                      {(item.costPerUnit || 0) > 0 && <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-flow-green font-bold border border-white/5">💰 {item.costPerUnit}$</span>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-xl">
                  {(['OK', 'LOW', 'OUT'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => handleStatusChange(item.id, status)}
                        className={cn(
                            "py-2.5 rounded-lg text-sm font-medium transition-all",
                            item.status === status 
                                ? (status === 'OK' ? "bg-flow-green text-black font-bold" : status === 'LOW' ? "bg-flow-yellow text-black font-bold" : "bg-flow-red text-white font-bold")
                                : "text-muted-foreground hover:bg-white/5"
                        )}
                    >
                        {status}
                    </button>
                  ))}
                </div>
                
                {item.status === 'LOW' && item.lowComment && <div className="mt-3 bg-flow-yellow/10 p-3 rounded-lg border border-flow-yellow/10 text-xs text-flow-yellow italic">"{item.lowComment}"</div>}
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {itemsInCurrentPath.length === 0 && visibleFolders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground opacity-50">Empty here.</div>
        )}
      </div>

      {/* --- MODALES --- */}
      <Dialog open={!!lowCommentItem} onOpenChange={() => setLowCommentItem(null)}><DialogContent className="bg-[#1C1C1E] border-white/10 text-white"><DialogHeader><DialogTitle>Low Stock Note</DialogTitle></DialogHeader><Input autoFocus value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Quantity left..." className="bg-black/20 border-white/10"/><DialogFooter><Button onClick={submitLowComment} className="w-full bg-flow-yellow text-black font-bold">Save</Button></DialogFooter></DialogContent></Dialog>
      
      {/* CREAR CARPETA */}
      <Dialog open={isAddingFolder} onOpenChange={setIsAddingFolder}><DialogContent className="bg-[#1C1C1E] border-white/10 text-white"><DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader><Input autoFocus value={newFolderName} onChange={e=>setNewFolderName(e.target.value)} placeholder="Folder Name" className="bg-black/20 border-white/10"/><DialogFooter><Button onClick={handleCreateFolder} className="w-full bg-blue-500 text-black font-bold">Create</Button></DialogFooter></DialogContent></Dialog>
      
      {/* RENOMBRAR CARPETA */}
      <Dialog open={isRenamingFolder} onOpenChange={setIsRenamingFolder}><DialogContent className="bg-[#1C1C1E] border-white/10 text-white"><DialogHeader><DialogTitle>Rename Folder</DialogTitle></DialogHeader><Input autoFocus value={folderNewName} onChange={e=>setFolderNewName(e.target.value)} className="bg-black/20 border-white/10"/><DialogFooter><Button onClick={performRenameFolder} className="w-full bg-white text-black font-bold">Update</Button></DialogFooter></DialogContent></Dialog>

      {/* BORRAR CARPETA */}
      <Dialog open={!!deletingFolder} onOpenChange={() => setDeletingFolder(null)}><DialogContent className="bg-[#1C1C1E] border-white/10 text-white"><DialogHeader><DialogTitle className="text-red-500">Delete Folder?</DialogTitle></DialogHeader><p className="text-center mb-4">This will delete all items inside.</p><DialogFooter><Button onClick={performDeleteFolder} className="w-full bg-red-500 text-white font-bold">Delete All</Button></DialogFooter></DialogContent></Dialog>

      {/* CREAR / EDITAR ITEM */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* VISTA PREVIA DEL ICONO/IMAGEN */}
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden relative">
                {renderItemIcon(newItemIcon, '#ffffff')}
                <div className="absolute bottom-0 w-full bg-black/60 text-[8px] text-center text-white py-1">PREVIEW</div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Name</label>
              <Input 
                value={newItemName} 
                onChange={(e) => setNewItemName(e.target.value)} 
                onBlur={handleNameBlur} // Auto-detect emoji on blur
                placeholder="e.g. Pepsi Can" 
                className="bg-black/20 border-white/10"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block flex justify-between">
                    <span>Icon (Emoji) OR Image URL</span>
                    <span className="text-[10px] opacity-50 flex items-center gap-1"><LinkIcon className="w-3 h-3"/> Paste Link</span>
                </label>
                <Input 
                    value={newItemIcon} 
                    onChange={(e) => setNewItemIcon(e.target.value)} 
                    placeholder="🍔 or https://..." 
                    className="bg-black/20 border-white/10 text-center font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-center">
                    Paste an image address (URL) to show a photo instead of an emoji.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Qty</label>
                <Input type="number" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} placeholder="0" className="bg-black/20 border-white/10"/>
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Unit</label>
                <select className="w-full h-10 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)}>
                  <option value="units">Units</option><option value="lb">lb</option><option value="kg">kg</option><option value="L">L</option><option value="box">Box</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Cost ($)</label>
                <Input type="number" value={newItemCost} onChange={(e) => setNewItemCost(e.target.value)} placeholder="0.00" className="bg-black/20 border-white/10"/>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSaveItem} className="w-full bg-flow-green text-black font-bold">
              {editingItem ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}