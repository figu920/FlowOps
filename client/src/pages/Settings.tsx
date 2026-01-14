import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { LogOut, Shield, MapPin, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Settings() {
  // ✅ CORRECCIÓN: Usamos 'logout' en lugar de 'setUser'
  const { currentUser, logout } = useStore();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      // Al llamar a logout(), el store se encarga de limpiar el usuario y cerrar sesión
      await logout(); 
      setLocation('/auth'); // O '/login', según tu ruta de entrada
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (!currentUser) return null;

  return (
    <Layout title="My Profile" showBack>
      <div className="space-y-6 pb-10">
        
        {/* 1. TARJETA DE PERFIL */}
        <div className="bg-[#1C1C1E] rounded-3xl p-6 border border-white/5 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full border-4 border-black/40 mb-4 relative">
                <Avatar className="w-full h-full">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} />
                    <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                </Avatar>
                <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-[#1C1C1E] ${currentUser.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`} />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-1">{currentUser.name}</h2>
            <p className="text-muted-foreground text-sm">@{currentUser.username}</p>
            
            <div className="flex gap-2 mt-4">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-flow-green">
                    {currentUser.role}
                </span>
            </div>
        </div>

        {/* 2. DATOS DE LA CUENTA */}
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-white px-2">Account Details</h3>
            
            <div className="bg-[#1C1C1E] rounded-2xl border border-white/5 overflow-hidden">
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
                FlowOps v1.0 • Logged in as {currentUser.username}
            </p>
        </div>

      </div>
    </Layout>
  );
}