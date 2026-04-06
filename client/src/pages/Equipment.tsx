import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { useEquipment, useCreateEquipment, useUpdateEquipment, useDeleteEquipment } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Wrench, CheckCircle2, 
  AlertTriangle, Folder, ChevronLeft, Search, X, FolderPlus
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Equipment() {
  const { currentUser } = useStore();
  const { toast } = useToast();
  const { data: equipmentList = [] } = useEquipment();

  // --- ESTADOS DE NAVEGACIÓN ---
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- MUTACIONES ---
  const createMutation = useCreateEquipment();
  const updateMutation = useUpdateEquipment();
  const deleteMutation = useDeleteEquipment();

  // --- ESTADOS DE UI (MODALES) ---
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  // Estados para Carpetas
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [folderNewName, setFolderNewName] = useState("");
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);

  // Formulario Item
  const [name, setName] = useState("");
  const [category, setCategory] = useState(""); 
  const [notes, setNotes] = useState("");

  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'lead' || currentUser?.isSystemAdmin;

  // --- LÓGICA DE AGRUPACIÓN ---
  const folders = useMemo(() => {
    const locations = new Set(equipmentList.map((item: any) => item.location || "General"));
    return Array.from(locations).sort() as string[]; 
  }, [equipmentList]);

  // 🔥 AQUÍ ESTÁ EL CAMBIO: Forzar orden alfabético siempre
  const displayedItems = useMemo(() => {
    let items = [];

    // 1. Filtrar
    if (searchQuery.trim()) {
        items = equipmentList.filter((i: any) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    } else if (currentFolder) {
        items = equipmentList.filter((i: any) => (i.location || "General") === currentFolder);
    } else {
        return []; // Si no hay búsqueda ni carpeta, no mostramos items sueltos (solo carpetas)
    }

    // 2. Ordenar Alfabéticamente (A-Z) para evitar saltos
    return items.sort((a: any, b: any) => a.name.localeCompare(b.name));
    
  }, [equipmentList, currentFolder, searchQuery]);

  // --- HANDLERS ---

  const handleStatusChange = (id: string, newStatus: "OPERATIONAL" | "BROKEN" | "MAINTENANCE") => {
      updateMutation.mutate({ id, updates: { status: newStatus } });
  };

  const performRenameFolder = async () => {
    if (!editingFolder || !folderNewName.trim() || folderNewName === editingFolder) {
      setIsRenamingFolder(false); return;
    }
    const itemsToUpdate = equipmentList.filter((i: any) => (i.location || "General") === editingFolder);
    for (const item of itemsToUpdate) {
        await updateMutation.mutateAsync({ id: item.id, updates: { location: folderNewName } });
    }
    setIsRenamingFolder(false);
    setEditingFolder(null);
    toast({ title: "Area Renamed", description: `${itemsToUpdate.length} equipment moved.` });
  };

  const performDeleteFolder = async () => {
    if (!deletingFolder) return;
    const itemsToDelete = equipmentList.filter((i: any) => (i.location || "General") === deletingFolder);
    for (const item of itemsToDelete) {
        await deleteMutation.mutateAsync(item.id);
    }
    setDeletingFolder(null);
    toast({ title: "Area Deleted", description: `Removed area and ${itemsToDelete.length} items.` });
  };

  const handleOpenAdd = () => {
      setName("");
      setCategory(currentFolder === "General" ? "" : (currentFolder || "")); 
      setNotes("");
      setEditingItem(null);
      setIsAdding(true);
  };

  const handleOpenEdit = (item: any) => {
      setName(item.name);
      setCategory(item.location || "");
      setNotes(item.notes || "");
      setEditingItem(item);
      setIsAdding(true);
  };

  const handleSave = () => {
      if (!name.trim()) return;
      const data: any = { name, location: category || "General", notes };
      
      if (!editingItem) {
          data.status = "OPERATIONAL";
      }

      if (editingItem) updateMutation.mutate({ id: editingItem.id, updates: data });
      else createMutation.mutate(data);
      setIsAdding(false);
  };

  const handleDelete = (id: string) => {
      if (confirm("Delete this equipment?")) deleteMutation.mutate(id);
  };

  const handleSaveNewFolderItem = () => {
     if (!category.trim() || !name.trim()) return;
     handleSave();
     setIsCreatingFolder(false);
  };

  const getFolderAlerts = (folderName: string) => {
      return equipmentList.filter((i:any) => (i.location || "General") === folderName && i.status !== 'OPERATIONAL').length;
  };

  return (
    <Layout title={currentFolder ? currentFolder : "Equipment"} showBack={!currentFolder} 
      action={(currentFolder && canEdit) && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleOpenAdd} className="w-9 h-9 rounded-full bg-flow-yellow text-black flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Plus className="w-5 h-5" strokeWidth={3} />
          </motion.button>
      )}
    >
      <div className="mb-6 space-y-4">
        {currentFolder && (
             <button onClick={() => { setCurrentFolder(null); setSearchQuery(""); }} className="flex items-center text-muted-foreground hover:text-white text-sm font-medium transition-colors"><ChevronLeft className="w-4 h-4 mr-1" /> Back to Areas</button>
        )}
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search equipment..." className="pl-9 pr-9 bg-black/20 border-white/10 h-10 rounded-xl focus-visible:ring-flow-yellow"/>
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      {!currentFolder && !searchQuery && (
          <div className="grid grid-cols-2 gap-4 pb-20">
            {folders.map((folderName: string, idx: number) => {
              const alertCount = getFolderAlerts(folderName);
              const itemCount = equipmentList.filter((i:any) => (i.location || "General") === folderName).length;
              return (
                <motion.div key={folderName} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} onClick={() => setCurrentFolder(folderName)} className="aspect-square bg-card hover:bg-white/5 cursor-pointer rounded-[24px] p-4 border border-white/[0.04] flex flex-col items-center justify-center gap-3 relative group shadow-lg">
                    {canEdit && (
                        <div className="absolute top-2 right-2 flex gap-1 z-10">
                             <button onClick={(e) => { e.stopPropagation(); setEditingFolder(folderName); setFolderNewName(folderName); setIsRenamingFolder(true); }} className="p-1.5 bg-black/40 rounded-md text-white/70 hover:text-white"><Edit2 className="w-3 h-3"/></button>
                             <button onClick={(e) => { e.stopPropagation(); setDeletingFolder(folderName); }} className="p-1.5 bg-black/40 hover:bg-red-500/80 rounded-md text-white/70 hover:text-white"><Trash2 className="w-3 h-3"/></button>
                        </div>
                    )}
                    {alertCount > 0 && <div className="absolute top-3 right-3 bg-flow-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg animate-pulse z-10"><Wrench className="w-3 h-3" /> {alertCount}</div>}
                    <div className="w-14 h-14 rounded-full bg-yellow-500/10 text-yellow-400 flex items-center justify-center mb-1"><Folder className="w-7 h-7" /></div>
                    <div className="text-center"><span className="font-bold text-white text-sm block leading-tight mb-1">{folderName}</span><span className="text-[10px] text-muted-foreground font-medium bg-white/5 px-2 py-1 rounded-full">{itemCount} Items</span></div>
                </motion.div>
              );
            })}
            {canEdit && <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setName(""); setCategory(""); setNotes(""); setEditingItem(null); setIsCreatingFolder(true); }} className="aspect-square bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/10 rounded-[24px] flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-white transition-colors"><div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center"><FolderPlus className="w-6 h-6" /></div><span className="text-xs font-bold uppercase tracking-wider">New Area</span></motion.button>}
          </div>
      )}

      {(currentFolder || searchQuery) && (
        <div className="space-y-3 pb-20">
            {/* Nota: He quitado AnimatePresence para evitar saltos raros al reordenar */}
            {displayedItems.map((item: any) => (
                <motion.div 
                    key={item.id} 
                    // Eliminamos layout animations para que sea sólido como una roca al cambiar estado
                    className={cn(
                        "p-4 rounded-2xl border flex flex-col gap-3 transition-colors relative group bg-card", 
                        item.status === 'BROKEN' ? "border-red-500/30 bg-red-500/5" : 
                        item.status === 'MAINTENANCE' ? "border-orange-500/30 bg-orange-500/5" : 
                        "border-white/5"
                    )}
                >
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl border", 
                            item.status === 'BROKEN' ? "bg-red-500/10 border-red-500/20 text-red-500" : 
                            item.status === 'MAINTENANCE' ? "bg-orange-500/10 border-orange-500/20 text-orange-500" : 
                            "bg-green-500/10 border-green-500/20 text-green-500"
                        )}>
                            {item.status === 'BROKEN' ? <AlertTriangle className="w-6 h-6" /> : 
                                item.status === 'MAINTENANCE' ? <Wrench className="w-6 h-6" /> : 
                                <CheckCircle2 className="w-6 h-6" />}
                        </div>
                        
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h3 className="font-bold text-white text-base truncate pr-16">{item.name}</h3>
                            {item.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">"{item.notes}"</p>}
                        </div>

                        {canEdit && (
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenEdit(item)} className="p-2 bg-white/5 hover:bg-white/20 rounded-lg text-muted-foreground hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-xl">
                        {[
                            { id: 'OPERATIONAL', label: 'Operational', color: 'bg-green-500 text-black', icon: CheckCircle2 },
                            { id: 'MAINTENANCE', label: 'Maint.', color: 'bg-orange-500 text-black', icon: Wrench },
                            { id: 'BROKEN', label: 'Broken', color: 'bg-red-500 text-white', icon: AlertTriangle }
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => handleStatusChange(item.id, opt.id as any)}
                                className={cn(
                                    "py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5",
                                    item.status === opt.id 
                                        ? opt.color 
                                        : "text-muted-foreground hover:bg-white/5"
                                )}
                            >
                                {opt.id === item.status && <opt.icon className="w-3 h-3" />}
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </motion.div>
            ))}
            
            {displayedItems.length === 0 && <div className="text-center py-12 text-muted-foreground opacity-50"><p>No equipment here yet.</p></div>}
        </div>
      )}

      {/* MODALES */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader><DialogTitle>{editingItem ? 'Edit Info' : `Add to ${currentFolder || 'General'}`}</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
             <div><label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Name</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rational Oven" className="bg-black/20 border-white/10" /></div>
             {editingItem && <div><label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Area (Folder)</label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Area Name" className="bg-black/20 border-white/10" /></div>}
             <div><label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Notes / Issues</label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-black/20 border-white/10 h-20 resize-none" /></div>
          </div>
          <DialogFooter><Button onClick={handleSave} className="w-full bg-flow-yellow text-black font-bold">Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatingFolder} onOpenChange={setIsCreatingFolder}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader><DialogTitle>Create New Area</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
             <div><label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Area Name</label><Input autoFocus value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Bar, Patio..." className="bg-black/20 border-white/10" /></div>
             <div><label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">First Equipment</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coffee Machine" className="bg-black/20 border-white/10" /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveNewFolderItem} className="w-full bg-flow-yellow text-black font-bold">Create Area</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenamingFolder} onOpenChange={setIsRenamingFolder}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader><DialogTitle>Rename Area</DialogTitle></DialogHeader>
          <div className="py-4"><Input autoFocus value={folderNewName} onChange={(e) => setFolderNewName(e.target.value)} className="bg-black/20 border-white/10"/></div>
          <DialogFooter><Button onClick={performRenameFolder} className="w-full bg-white text-black font-bold">Update Name</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingFolder} onOpenChange={() => setDeletingFolder(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6 text-center">
          <DialogHeader><DialogTitle className="text-red-500">Delete Area?</DialogTitle></DialogHeader>
          <p className="mb-4 text-sm text-muted-foreground">This will delete all equipment inside.</p>
          <DialogFooter><Button onClick={performDeleteFolder} className="w-full bg-red-500 text-white font-bold">Delete All</Button></DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}