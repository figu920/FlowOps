import { useLocation } from "wouter";
import { useInventory, useTasks } from "@/lib/hooks"; // Asumimos que tienes estos hooks
import { 
  ClipboardList, 
  CheckSquare, 
  ChefHat, 
  MessageSquare, 
  TrendingUp, 
  Box, 
  Refrigerator,
  CalendarClock,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [, setLocation] = useLocation();

  // --- DATOS PARA LAS NOTIFICACIONES (ROJO/AMARILLO) ---
  const { data: inventory = [] } = useInventory();
  const { data: tasks = [] } = useTasks();

  // Calcular alertas
  const lowStockCount = inventory.filter((i: any) => i.status === 'LOW').length;
  // Asumimos que las tareas vencidas son las que no están completas (simplificado)
  const pendingTasksCount = tasks.filter((t: any) => !t.completed).length;

  // --- COMPONENTES DE ICONOS PERSONALIZADOS ---
  const InventoryLogo = () => (
    <div className="w-14 h-14 rounded-full bg-[#4ADE80] flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.3)]">
      <Box className="w-7 h-7 text-black" strokeWidth={2.5} />
    </div>
  );

  const EquipmentLogo = () => (
    <div className="w-14 h-14 rounded-full bg-[#FACC15] flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.3)]">
      <Refrigerator className="w-7 h-7 text-black" strokeWidth={2.5} />
    </div>
  );

  // ⭐ NUEVO ICONO PARA OPERATIONS ⭐
  const ScheduleLogo = () => (
    <div className="w-14 h-14 rounded-full bg-[#3B82F6] flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
      <CalendarClock className="w-7 h-7 text-white" strokeWidth={2.5} />
    </div>
  );
  
  const MenuLogo = () => (
    <div className="w-14 h-14 rounded-full bg-[#2DD4BF] flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.3)]">
      <ChefHat className="w-7 h-7 text-black" strokeWidth={2.5} />
    </div>
  );

  const SalesLogo = () => (
    <div className="w-14 h-14 rounded-full bg-[#00E676] flex items-center justify-center shadow-[0_0_20px_rgba(0,230,118,0.3)]">
      <TrendingUp className="w-7 h-7 text-black" strokeWidth={2.5} />
    </div>
  );

  const AnalyticsLogo = () => (
    <div className="w-14 h-14 rounded-full bg-[#F97316] flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.3)]">
      <Activity className="w-7 h-7 text-black" strokeWidth={2.5} />
    </div>
  );

  // --- LISTA DEL MENÚ ---
  const menuItems = [
    { 
      title: 'Inventory', 
      path: '/inventory', 
      customIcon: <InventoryLogo />,
      count: lowStockCount > 0 ? `${lowStockCount} Alert` : undefined,
      countColor: 'text-flow-yellow',
      glowColor: 'bg-[#4ADE80]' 
    },
    
    // ⭐ NUEVO BOTÓN OPERATIONS (AQUÍ ESTÁ) ⭐
    { 
      title: 'Operations Hub', 
      path: '/schedule', 
      customIcon: <ScheduleLogo />,
      glowColor: 'bg-[#3B82F6]' 
    },

    // Botones antiguos (mantenidos para testing)
    { 
      title: 'Checklists', 
      path: '/checklists', 
      icon: ClipboardList, 
      iconColor: 'text-[#38BDF8]', // Azul claro
      bgColor: 'bg-[#38BDF8]/10',
      glowColor: 'bg-[#38BDF8]' 
    },
    { 
      title: 'Tasks', 
      path: '/tasks', 
      icon: CheckSquare,
      count: pendingTasksCount > 0 ? `${pendingTasksCount} Active` : undefined, 
      countColor: 'text-flow-red',
      iconColor: 'text-[#A855F7]', // Morado
      bgColor: 'bg-[#A855F7]/10',
      glowColor: 'bg-[#A855F7]' 
    },

    // Resto de botones
    { 
      title: 'Equipment', 
      path: '/equipment', 
      customIcon: <EquipmentLogo />,
      glowColor: 'bg-[#FACC15]' 
    },
    { 
      title: 'Menu & Sizes', 
      path: '/menu', 
      customIcon: <MenuLogo />,
      glowColor: 'bg-[#2DD4BF]'
    },
    { 
      title: 'Sales Register', 
      path: '/sales', 
      customIcon: <SalesLogo />,
      glowColor: 'bg-[#00E676]'
    },
    { 
      title: 'Team Chat', 
      path: '/chat', 
      icon: MessageSquare,
      iconColor: 'text-white',
      bgColor: 'bg-white/10',
      glowColor: 'bg-white'
    },
    {
      title: 'Analytics',
      path: '/analytics', // Asumiendo que existe o existirá
      customIcon: <AnalyticsLogo />,
      glowColor: 'bg-[#F97316]'
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <div className="flex justify-between items-center mb-8 pt-4">
        <div>
           <span className="px-2 py-1 rounded-full bg-flow-red text-white text-[10px] font-bold uppercase tracking-wider">
             Manager Mode
           </span>
           <h1 className="text-4xl font-black text-white mt-2 tracking-tight">
             Hello, Super
           </h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <motion.div
            key={item.title}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setLocation(item.path)}
            className="relative bg-card rounded-[32px] p-5 flex flex-col items-center justify-center gap-4 text-center border border-white/5 shadow-xl cursor-pointer overflow-hidden group h-[180px]"
          >
            {/* Glow Effect */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${item.glowColor}`} />
            
            {/* Icon */}
            <div className="relative z-10">
              {item.customIcon ? (
                item.customIcon
              ) : (
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${item.bgColor || 'bg-white/5'}`}>
                   {item.icon && <item.icon className={`w-7 h-7 ${item.iconColor || 'text-white'}`} strokeWidth={2.5} />}
                </div>
              )}
              
              {/* Notification Bubble */}
              {item.count && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-[#1C1C1E] border border-white/10 rounded-full px-2 py-0.5 shadow-lg z-20"
                >
                  <span className={`text-[10px] font-bold ${item.countColor || 'text-white'}`}>
                    {item.count}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Title */}
            <span className="font-bold text-base text-white relative z-10 leading-tight">
              {item.title}
            </span>
            
            <span className="text-[10px] text-muted-foreground absolute bottom-4 opacity-50 font-medium">
              Tap to view
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}