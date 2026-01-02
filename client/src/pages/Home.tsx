import { CalendarClock } from "lucide-react"; 
import { TrendingUp } from "lucide-react";
import { Link } from 'wouter';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { 
  Package, 
  Wrench, 
  ClipboardList, 
  CalendarDays, 
  MessageCircle, 
  Activity,
  Users,
  Utensils,
  Refrigerator
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useInventory, useEquipment, usePendingUsers, useNotificationCount } from '@/lib/hooks';

// --- LOGOS PERSONALIZADOS (Estilo Unificado: Fondo Brillante + Icono Negro) ---

// 1. INVENTORY (Verde Brillante)
const InventoryLogo = () => (
  <div className="w-14 h-14 rounded-full bg-[#4ADE80] flex items-center justify-center shadow-lg shadow-green-500/20">
    <Package className="w-7 h-7 text-black" strokeWidth={2.5} />
  </div>
);

// 2. EQUIPMENT (Amarillo Alerta)
const EquipmentLogo = () => (
  <div className="w-14 h-14 rounded-full bg-[#FACC15] flex items-center justify-center shadow-lg shadow-yellow-500/20">
    <Refrigerator className="w-7 h-7 text-black" strokeWidth={2.5} />
  </div>
);

// 3. CHECKLISTS (Azul Cielo Brillante) - Antes se veía apagado
const ChecklistsLogo = () => (
  <div className="w-14 h-14 rounded-full bg-[#38BDF8] flex items-center justify-center shadow-lg shadow-sky-500/20">
    <ClipboardList className="w-7 h-7 text-black" strokeWidth={2.5} />
  </div>
);

// 4. TASKS (Violeta Vibrante) - Antes era morado oscuro
const TasksLogo = () => (
  <div className="w-14 h-14 rounded-full bg-[#A78BFA] flex items-center justify-center shadow-lg shadow-violet-500/20">
    <CalendarDays className="w-7 h-7 text-black" strokeWidth={2.5} />
  </div>
);

// 5. MENU (Turquesa/Teal Brillante)
const MenuLogo = () => (
  <div className="w-14 h-14 rounded-full bg-[#2DD4BF] flex items-center justify-center shadow-lg shadow-teal-500/20">
    <Utensils className="w-7 h-7 text-black" strokeWidth={2.5} />
  </div>
);

// 6. CHAT (Blanco Puro)
const ChatLogo = () => (
  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg shadow-white/10">
    <MessageCircle className="w-7 h-7 text-black" strokeWidth={2.5} />
  </div>
);

// 7. TIMELINE (Naranja Intenso)
const TimelineLogo = () => (
  <div className="w-14 h-14 rounded-full bg-[#FB923C] flex items-center justify-center shadow-lg shadow-orange-500/20">
    <Activity className="w-7 h-7 text-black" strokeWidth={2.5} />
  </div>
);

// 8. EMPLOYEES (Rosa Fuerte)
const EmployeesLogo = () => (
  <div className="w-14 h-14 rounded-full bg-[#F472B6] flex items-center justify-center shadow-lg shadow-pink-500/20">
    <Users className="w-7 h-7 text-black" strokeWidth={2.5} />
  </div>
);

// 9. SALES (Verde Neón / Dinero)
const SalesLogo = () => (
  <div className="w-14 h-14 rounded-full bg-[#00E676] flex items-center justify-center shadow-lg shadow-green-500/20">
    <TrendingUp className="w-7 h-7 text-black" strokeWidth={2.5} />
  </div>
);

// 10. OPERATIONS (Nuevo Super Botón)
const ScheduleLogo = () => (
  <div className="w-14 h-14 rounded-full bg-[#3B82F6] flex items-center justify-center shadow-lg shadow-blue-500/20">
    <CalendarClock className="w-7 h-7 text-black" strokeWidth={2.5} />
  </div>
);

export default function Home() {
  const { currentUser } = useStore();
  const { data: inventory = [] } = useInventory();
  const { data: equipment = [] } = useEquipment();
  
  // Only fetch pending users for managers or system admins
  const canManageUsers = currentUser?.role === 'manager' || currentUser?.isSystemAdmin;
  const { data: pendingUsers = [] } = usePendingUsers(canManageUsers);
  
  // Reservado para uso futuro
  // const { data: notificationData } = useNotificationCount();
  
  if (!currentUser) return null;

  // Dynamic status counts
  const lowStockCount = inventory.filter((i: { status: string }) => i.status !== 'OK').length;
  const brokenCount = equipment.filter((e: { status: string }) => e.status === 'Broken').length;
  const pendingCount = canManageUsers ? pendingUsers.length : 0;

  const canManageEmployees = currentUser.role === 'manager' || currentUser.role === 'lead' || currentUser.isSystemAdmin;

  const menuItems = [
    { 
      title: 'Inventory', 
      path: '/inventory', 
      customIcon: <InventoryLogo />,
      count: lowStockCount > 0 ? `${lowStockCount} Alert` : undefined,
      countColor: 'text-flow-yellow',
      glowColor: 'bg-[#4ADE80]' // Green glow
    },
    { 
      title: 'Equipment', 
      path: '/equipment', 
      customIcon: <EquipmentLogo />,
      count: brokenCount > 0 ? `${brokenCount} Issue` : undefined,
      countColor: 'text-flow-red',
      glowColor: 'bg-[#FACC15]' // Yellow glow
    },
    { 
      title: 'Checklists', 
      path: '/checklists', 
      customIcon: <ChecklistsLogo />,
      glowColor: 'bg-[#38BDF8]' // Blue glow
    },
    { 
      title: 'Tasks', 
      path: '/tasks', 
      customIcon: <TasksLogo />,
      glowColor: 'bg-[#A78BFA]' // Violet glow
    },
    {
      title: 'Menu & Sizes',
      path: '/menu',
      customIcon: <MenuLogo />,
      glowColor: 'bg-[#2DD4BF]' // Teal glow
    },
    {
      title: 'Sales Register',
      path: '/sales',
      customIcon: <SalesLogo />, // Usamos el logo que creamos arriba
      glowColor: 'bg-[#00E676]' // El mismo verde neón para el brillo
    },
    { 
      title: 'Chat', 
      path: '/chat', 
      customIcon: <ChatLogo />,
      glowColor: 'bg-white' // White glow
    },
    { 
      title: 'Timeline', 
      path: '/timeline', 
      customIcon: <TimelineLogo />,
      glowColor: 'bg-[#FB923C]' // Orange glow
    },
    ...(canManageEmployees ? [{
      title: 'Employees', 
      path: '/employees', 
      customIcon: <EmployeesLogo />,
      count: pendingCount > 0 ? `${pendingCount} Pending` : undefined,
      countColor: 'text-flow-yellow',
      glowColor: 'bg-[#F472B6]' // Pink glow
    }] : [])
  ];

  return (
    <Layout title={`Hello, ${currentUser.name.split(' ')[0]}`} showBack={false}>
      <div className="grid grid-cols-2 gap-4">
        {menuItems.map((item, index) => (
          <Link key={item.title} href={item.path}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 20 }}
              className="aspect-[1/1.1] bg-card rounded-[24px] p-5 flex flex-col justify-between relative overflow-hidden group border border-white/[0.03]"
            >
              {/* Ambient Glow (Efecto de brillo de fondo) */}
              <div className={`absolute -right-10 -top-10 w-32 h-32 ${item.glowColor} opacity-[0.07] blur-3xl group-hover:opacity-[0.15] transition-opacity duration-500`} />

              <div className="flex justify-between items-start relative z-10">
                {/* Renderizamos el icono personalizado */}
                {item.customIcon}

                {item.count && (
                  <div className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full">
                    <span className={`text-[10px] font-bold uppercase ${item.countColor}`}>{item.count}</span>
                  </div>
                )}
              </div>

              <div className="relative z-10">
                <h3 className="font-semibold text-[19px] tracking-tight text-white/90">{item.title}</h3>
                <p className="text-white/40 text-xs mt-1 font-medium">Tap to view</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-white/20 text-xs font-medium uppercase tracking-widest">
           Role: {currentUser.role}
        </p>
      </div>
    </Layout>
  );
}