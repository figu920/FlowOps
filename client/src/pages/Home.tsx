import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useInventory, useTasks } from "@/lib/hooks"; 
import { 
  ChefHat, 
  MessageSquare, 
  TrendingUp, 
  Box, 
  Refrigerator,
  CalendarClock,
  LogOut,
  Users,
  AlertTriangle,
  CheckCircle2,
  ClipboardList // <--- IMPORTANTE: Nuevo Icono
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Home() {
  const [, setLocation] = useLocation();
  const { logout, currentUser } = useStore();

  const { data: inventory = [] } = useInventory();
  const { data: tasks = [] } = useTasks();
  
  const lowStockCount = inventory.filter((i: any) => i.status === 'LOW').length;
  // Solo contamos las tareas del calendario en el contador de arriba
  const pendingTasksCount = tasks.filter((t: any) => !t.completed && t.notes?.includes('DATE:')).length;

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // --- LOGOS ---
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

  const TimelineLogo = () => (
    <div className="w-14 h-14 rounded-full bg-[#3B82F6] flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
      <CalendarClock className="w-7 h-7 text-white" strokeWidth={2.5} />
    </div>
  );

  // 🔥 NUEVO LOGO PARA WEEKLY TASKS
  const TasksLogo = () => (
    <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
      <ClipboardList className="w-7 h-7 text-white" strokeWidth={2.5} />
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

  const EmployeesLogo = () => (
    <div className="w-14 h-14 rounded-full bg-[#E91E63] flex items-center justify-center shadow-[0_0_20px_rgba(233,30,99,0.3)]">
      <Users className="w-7 h-7 text-white" strokeWidth={2.5} />
    </div>
  );

  // --- MENU ---
  const menuItems = [
    { 
      title: 'Inventory', 
      path: '/inventory', 
      customIcon: <InventoryLogo />,
      count: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      countColor: 'text-flow-yellow',
      glowColor: 'bg-[#4ADE80]' 
    },
    { 
      title: 'Schedule', 
      path: '/schedule', 
      customIcon: <TimelineLogo />,
      count: pendingTasksCount > 0 ? `${pendingTasksCount} Tasks` : undefined,
      countColor: 'text-blue-200',
      glowColor: 'bg-[#3B82F6]' 
    },
    { 
      title: 'Weekly Tasks', // 🔥 NUEVA ENTRADA
      path: '/tasks', 
      customIcon: <TasksLogo />,
      glowColor: 'bg-purple-500' 
    },
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
      title: 'Employees', 
      path: '/employees', 
      customIcon: <EmployeesLogo />,
      glowColor: 'bg-[#E91E63]' 
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6 pb-24 flex justify-center">
      <div className="w-full max-w-lg space-y-6">
        
        {/* HEADER */}
        <div className="pt-2 flex flex-col gap-1">
           <div className="flex justify-between items-start">
               <div>
                   <p className="text-flow-green font-bold text-xs uppercase tracking-wider mb-1">
                       {format(currentTime, 'EEEE, MMM do')}
                   </p>
                   <h1 className="text-3xl font-black text-white tracking-tight leading-none">
                     {getGreeting()}, <br/>
                     <span className="opacity-80">{currentUser?.name.split(' ')[0] || 'Team'}</span>
                   </h1>
               </div>
               
               <button onClick={() => logout()} className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-white/5">
                  <LogOut className="w-3 h-3" />
               </button>
           </div>
        </div>

        {/* ALERTS */}
        {(lowStockCount > 0 || pendingTasksCount > 0) && (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {lowStockCount > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl shrink-0">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-red-200 font-bold text-sm">{lowStockCount} Items Low</p>
                            <p className="text-red-400/60 text-[10px] uppercase font-bold">Check Inventory</p>
                        </div>
                    </motion.div>
                )}
                
                {pendingTasksCount > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{delay: 0.1}} className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-2xl shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-blue-200 font-bold text-sm">{pendingTasksCount} Tasks Left</p>
                            <p className="text-blue-400/60 text-[10px] uppercase font-bold">View Schedule</p>
                        </div>
                    </motion.div>
                )}
            </div>
        )}

        {/* GRID */}
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <motion.div
              key={item.title}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setLocation(item.path)}
              className="relative bg-card rounded-[32px] p-5 flex flex-col items-center justify-center gap-4 text-center border border-white/5 shadow-xl cursor-pointer overflow-hidden group aspect-square"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${item.glowColor}`} />
              
              <div className="relative z-10">
                {item.customIcon ? (
                  item.customIcon
                ) : (
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${item.bgColor || 'bg-white/5'}`}>
                     {item.icon && <item.icon className={`w-7 h-7 ${item.iconColor || 'text-white'}`} strokeWidth={2.5} />}
                  </div>
                )}
                
                {item.count && (
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-[#1C1C1E] border border-white/10 rounded-full px-2 py-0.5 shadow-lg z-20"
                  >
                    <span className={`text-[10px] font-bold ${item.countColor || 'text-white'}`}>{item.count}</span>
                  </motion.div>
                )}
              </div>

              <span className="font-bold text-base text-white relative z-10 leading-tight">{item.title}</span>
              <span className="text-[10px] text-muted-foreground absolute bottom-4 opacity-50 font-medium">Tap to view</span>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}