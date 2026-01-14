import { useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { LogOut, Shield, MapPin, Mail, Camera } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
// Importamos el nuevo componente
import ProfileAvatar from '@/components/ProfileAvatar';

export default function Settings() {
  const { currentUser, logout,  } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/auth');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Función que se ejecuta al seleccionar un archivo de la galería
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    // Validar tamaño (ej: 5MB)
    if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "Image too large (Max 5MB)", variant: "destructive" });
        return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const res = await fetch('/api/user/avatar', {
            method: 'POST',
            body: formData // No hacen falta headers, el navegador los pone automáticamente para FormData
        });

        if (!res.ok) throw new Error("Upload failed");
        
        const data = await res.json();
        
        toast({ title: "Success", description: "Profile photo updated. Reloading..." });
// Recargamos la página para que se vea la foto nueva en todas partes
setTimeout(() => window.location.reload(), 1000);

    } catch (error) {
        console.error("Error uploading avatar:", error);
        toast({ title: "Error", description: "Failed to upload photo.", variant: "destructive" });
    } finally {
        setIsUploading(false);
        // Limpiamos el input para poder volver a subir el mismo archivo si se quiere
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Función para simular el clic en el input oculto
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!currentUser) return null;

  return (
    <Layout title="My Profile" showBack>
      <div className="space-y-6 pb-10">
        
        {/* 1. TARJETA DE PERFIL CON SUBIDA DE FOTO */}
        <div className="bg-[#1C1C1E] rounded-3xl p-6 border border-white/5 flex flex-col items-center text-center relative overflow-hidden">
            
            {/* Input oculto para la galería */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/png, image/jpeg, image/jpg" 
                className="hidden"
            />
            
            {/* Área del Avatar Clicable */}
            <div 
                onClick={triggerFileInput}
                className={`w-28 h-28 relative mb-4 group cursor-pointer rounded-full ${isUploading ? 'opacity-50' : ''}`}
            >
                {/* Usamos el nuevo componente */}
                <ProfileAvatar 
                    user={currentUser} 
                    className="w-full h-full border-4 border-[#1C1C1E] shadow-xl" 
                    iconClassName="w-12 h-12"
                />
                
                {/* Overlay de "Cámara" al pasar el ratón */}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white/80" />
                </div>

                {/* Indicador de estado */}
                <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-[#1C1C1E] z-10 ${currentUser.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`} />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-1">{currentUser.name}</h2>
            <p className="text-muted-foreground text-sm">@{currentUser.username}</p>
            
            <div className="flex gap-2 mt-4">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-flow-green">
                    {currentUser.role}
                </span>
            </div>
            
             {isUploading && <p className="text-xs text-muted-foreground mt-2 animate-pulse">Uploading...</p>}
        </div>

        {/* 2. DATOS DE LA CUENTA */}
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-white px-2">Account Details</h3>
            <div className="bg-[#1C1C1E] rounded-2xl border border-white/5 overflow-hidden">
                {/* ... (El resto de los datos igual que antes) ... */}
                <div className="p-4 flex items-center gap-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Email</label>
                        <div className="text-white font-medium">{currentUser.email}</div>
                    </div>
                </div>
                <div className="p-4 flex items-center gap-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Establishment</label>
                        <div className="text-white font-medium">{currentUser.establishment}</div>
                    </div>
                </div>
                 <div className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Permissions</label>
                        <div className="text-white font-medium capitalize">{currentUser.role} Level</div>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. BOTÓN DE CERRAR SESIÓN */}
        <div className="pt-4">
            <Button 
                onClick={handleLogout} 
                variant="destructive" 
                className="w-full h-14 rounded-2xl text-base font-bold flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
            >
                <LogOut className="w-5 h-5" />
                Log Out
            </Button>
             <p className="text-center text-xs text-muted-foreground mt-4 opacity-50">
                FlowOps v1.1 • {currentUser.username}
            </p>
        </div>

      </div>
    </Layout>
  );
}