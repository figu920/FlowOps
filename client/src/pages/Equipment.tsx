import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { useEquipment, useCreateEquipment, useUpdateEquipment, useDeleteEquipment } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Wrench, CheckCircle2, 
  AlertTriangle, Folder, ChevronLeft, FolderPlus, Search, X 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Equipment() {
  const { currentUser } = useStore();
  const { data: equipmentList = [] } = useEquipment();

  // --- LÓGICA DE CARPETAS ---
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Obtener carpetas (categorías únicas)
  const folders = useMemo(() => {
    const categories = new Set(equipmentList.map((item: any) => item.location).filter(Boolean));
    return Array.from(categories).sort() as string[];
  }, [equipmentList]);

  // 2. Filtrar items
  const displayedItems = useMemo(() => {
    let items = equipmentList;
    
    // Si hay búsqueda, buscamos en todo (ignorando carpetas)
    if (searchQuery.trim()) {
        return items.filter((i: any) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Si no, filtramos por carpeta
    if (currentFolder) {
      return items.filter((i: any) => i.location === currentFolder);
    }
    // Items sin carpeta en la raíz
    return items.filter((i: any) => !i.location);
  }, [equipmentList, currentFolder, searchQuery]);

  // --- MUTACIONES ---
  const createMutation = useCreateEquipment();
  const updateMutation = useUpdateEquipment();
  const deleteMutation = useDeleteEquipment();

  // --- ESTADOS DE UI ---
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Formulario
  const [name, setName] = useState("");
  const [category, setCategory] = useState(""); // Esto actúa como la carpeta
  const [status, setStatus] = useState<"OPERATIONAL" | "BROKEN" | "MAINTENANCE">("OPERATIONAL");
  const [notes, setNotes] = useState("");

  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'lead' || currentUser?.isSystemAdmin;

  // --- HANDLERS ---

  const handleOpenAdd = () => {
      setName("");
      setCategory(currentFolder || ""); // Pre-rellenar si estamos dentro de una carpeta
      setStatus("OPERATIONAL");
      setNotes("");
      setEditingItem(null);
      setIsAdding(true);
  };

  const handleOpenEdit = (item: any) => {
      setName(item.name);
      setCategory(item.location || "");
      setStatus(item.status);
      setNotes(item.notes || "");
      setEditingItem(item);
      setIsAdding(true);
  };

  const handleSave = () => {
      if (!name.trim()) return;

      const data = {
          name,
          location: category, // Usamos 'location' como campo para la carpeta
          status,
          notes
      };

      if (editingItem) {
          updateMutation.mutate({ id: editingItem.id, updates: data });
      } else {
          createMutation.mutate(data);
      }
      setIsAdding(false);
  };

  const handleDelete = (id: string) => {
      deleteMutation.mutate(id);
      setIsAdding(false); // Por si acaso estaba en el modal
  };

  // Helper para contar alertas en una carpeta
  const getFolderAlerts = (folderName: string) => {
      return equipmentList.filter((i:any) => i.location === folderName && i.status !== 'OPERATIONAL').length;
  };

  return (
    <Layout 
      title={currentFolder ? currentFolder : "Equipment"}
      showBack={!currentFolder} // Muestra back del sistema en raíz, el nuestro dentro de carpetas
      action={
        canEdit && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleOpenAdd}
            className="w-9 h-9 rounded-full bg-flow-yellow text-black flex items-center justify-center shadow-lg shadow-yellow-500/20"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
          </motion.button>
        )
      }
    >
      {/* BARRA DE BÚSQUEDA & NAVEGACIÓN */}
      <div className="mb-6 space-y-4">
        {/* Botón Atrás Personalizado */}
        {currentFolder && (
             <button 
                onClick={() => { setCurrentFolder(null); setSearchQuery(""); }}
                className="flex items-center text-muted-foreground hover:text-white text-sm font-medium transition-colors"
             >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Areas
             </button>
        )}

        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search equipment..."
                className="pl-9 pr-9 bg-black/20 border-white/10 h-10 rounded-xl focus-visible:ring-flow-yellow"
            />
            {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>

      {/* VISTA DE CARPETAS (RAÍZ) */}
      {!currentFolder && !searchQuery && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {folders.map((folderName, idx) => {
              const alertCount = getFolderAlerts(folderName);
              return (
                <motion.div
                    key={folderName}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setCurrentFolder(folderName)}
                    className="bg-card hover:bg-white/5 cursor-pointer rounded-[20px] p-4 border border-white/[0.04] flex flex-col items-center gap-3 relative group"
                >
                    {/* Badge de Alerta si hay máquinas rotas dentro */}
                    {alertCount > 0 && (
                        <div className="absolute top-2 right-2 bg-flow-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
                            <Wrench className="w-3 h-3" /> {alertCount}
                        </div>
                    )}

                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-400 flex items-center justify-center">
                        <Folder className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-white truncate w-full text-center">{folderName}</span>
                    <span className="text-[10px] text-muted-foreground uppercase bg-white/5 px-2 py-0.5 rounded-full">
                        {equipmentList.filter((i:any) => i.location === folderName).length} items
                    </span>
                </motion.div>
              );
            })}

            {/* Botón Rápido Crear Carpeta */}
            {canEdit && (
                <button 
                  onClick={handleOpenAdd}
                  className="bg-white/5 hover:bg-white/10 border border-dashed border-white/10 rounded-[20px] p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-white transition-colors"
                >
                    <FolderPlus className="w-6 h-6 opacity-50" />
                    <span className="text-xs font-bold">New Area</span>
                </button>
            )}
          </div>
      )}

      {/* LISTA DE ITEMS */}
      <div className="space-y-3 pb-20">
        <AnimatePresence mode="popLayout">
            {displayedItems.map((item: any, idx: number) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "p-4 rounded-2xl border flex items-start gap-4 transition-all relative group",
                        item.status === 'BROKEN' ? "bg-red-500/5 border-red-500/20" : 
                        item.status === 'MAINTENANCE' ? "bg-orange-500/5 border-orange-500/20" : 
                        "bg-card border-white/5 hover:border-white/10"
                    )}
                >
                    {/* Icono de Estado */}
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl border",
                        item.status === 'BROKEN' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                        item.status === 'MAINTENANCE' ? "bg-orange-500/10 border-orange-500/20 text-orange-500" :
                        "bg-green-500/10 border-green-500/20 text-green-500"
                    )}>
                        {item.status === 'BROKEN' ? <AlertTriangle className="w-6 h-6" /> : 
                         item.status === 'MAINTENANCE' ? <Wrench className="w-6 h-6" /> : 
                         <CheckCircle2 className="w-6 h-6" />}
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-white truncate pr-8">{item.name}</h3>
                            {/* Acciones (Editar/Borrar) */}
                            {canEdit && (
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenEdit(item)} className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-white"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            )}
                        </div>
                        
                        <p className={cn("text-xs font-bold uppercase mt-1", 
                            item.status === 'BROKEN' ? "text-red-400" : 
                            item.status === 'MAINTENANCE' ? "text-orange-400" : "text-green-400"
                        )}>
                            {item.status}
                        </p>

                        {item.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic bg-black/20 p-2 rounded-lg">
                                "{item.notes}"
                            </p>
                        )}
                        
                        {/* Breadcrumb si estamos buscando */}
                        {searchQuery && item.location && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Folder className="w-3 h-3" /> {item.location}
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>

        {displayedItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground opacity-50">
                <p>{searchQuery ? "No equipment found." : "This area is empty."}</p>
            </div>
        )}
      </div>

      {/* MODAL CREAR/EDITAR */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader><DialogTitle>{editingItem ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
             <div>
                 <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Name</label>
                 <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rational Oven 1" className="bg-black/20 border-white/10" />
             </div>
             <div>
                 <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Area (Folder)</label>
                 <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Kitchen, Bar..." className="bg-black/20 border-white/10" />
             </div>
             <div>
                 <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Status</label>
                 <Select value={status} onValueChange={(v:any) => setStatus(v)}>
                    <SelectTrigger className={cn("bg-black/20 border-white/10", status === 'BROKEN' && "text-red-400 border-red-500/50", status === 'MAINTENANCE' && "text-orange-400 border-orange-500/50")}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1C1C1E] border-white/10 text-white">
                        <SelectItem value="OPERATIONAL" className="text-green-400">Operational ✅</SelectItem>
                        <SelectItem value="MAINTENANCE" className="text-orange-400">Maintenance 🔧</SelectItem>
                        <SelectItem value="BROKEN" className="text-red-400">Broken 🚨</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
             <div>
                 <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Notes / Issues</label>
                 <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe the issue or details..." className="bg-black/20 border-white/10 h-20 resize-none" />
             </div>
          </div>
          <DialogFooter>
              <Button onClick={handleSave} className="w-full bg-flow-yellow text-black font-bold hover:bg-yellow-400">Save Equipment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}