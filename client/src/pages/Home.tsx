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
  Utensils
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useInventory, useEquipment, usePendingUsers, useNotificationCount } from '@/lib/hooks';

export default function Home() {
  const { currentUser } = useStore();
  const { data: inventory = [] } = useInventory();
  const { data: equipment = [] } = useEquipment();
  
  // Only fetch pending users for managers or system admins
  const canManageUsers = currentUser?.role === 'manager' || currentUser?.isSystemAdmin;
  const { data: pendingUsers = [] } = usePendingUsers(canManageUsers);
  const { data: notificationData } = useNotificationCount();
  
  if (!currentUser) return null;

  // Dynamic status counts
  const lowStockCount = inventory.filter(i => i.status !== 'OK').length;
  const brokenCount = equipment.filter(e => e.status === 'Broken').length;
  const pendingCount = canManageUsers ? pendingUsers.length : 0;
  const unreadNotifications = notificationData?.count || 0;

  const canManageEmployees = currentUser.role === 'manager' || currentUser.role === 'lead' || currentUser.isSystemAdmin;

  const menuItems = [
    { 
      title: 'Inventory', 
      icon: Package, 
      path: '/inventory', 
      color: 'bg-flow-green', 
      textColor: 'text-flow-green',
      count: lowStockCount > 0 ? `${lowStockCount} Alert` : undefined,
      countColor: 'text-flow-yellow'
    },
    { 
      title: 'Equipment', 
      icon: Wrench, 
      path: '/equipment', 
      color: 'bg-flow-yellow', 
      textColor: 'text-flow-yellow',
      count: brokenCount > 0 ? `${brokenCount} Issue` : undefined,
      countColor: 'text-flow-red'
    },
    { 
      title: 'Checklists', 
      icon: ClipboardList, 
      path: '/checklists', 
      color: 'bg-blue-500',
      textColor: 'text-blue-400'
    },
    { 
      title: 'Tasks', 
      icon: CalendarDays, 
      path: '/tasks', 
      color: 'bg-purple-500',
      textColor: 'text-purple-400'
    },
    {
      title: 'Menu & Sizes',
      icon: Utensils,
      path: '/menu',
      color: 'bg-teal-500',
      textColor: 'text-teal-400'
    },
    { 
      title: 'Chat', 
      icon: MessageCircle, 
      path: '/chat', 
      color: 'bg-white',
      textColor: 'text-white'
    },
    { 
      title: 'Timeline', 
      icon: Activity, 
      path: '/timeline', 
      color: 'bg-orange-500',
      textColor: 'text-orange-400'
    },
    ...(canManageEmployees ? [{
      title: 'Employees', 
      icon: Users, 
      path: '/employees', 
      color: 'bg-pink-500',
      textColor: 'text-pink-400',
      count: pendingCount > 0 ? `${pendingCount} Pending` : undefined,
      countColor: 'text-flow-yellow'
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
              {/* Ambient Glow */}
              <div className={`absolute -right-10 -top-10 w-32 h-32 ${item.color} opacity-[0.07] blur-3xl group-hover:opacity-[0.15] transition-opacity duration-500`} />

              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 rounded-full ${item.color} bg-opacity-15 flex items-center justify-center`}>
                  <item.icon className={`w-6 h-6 ${item.textColor}`} strokeWidth={2.5} />
                </div>
                {item.count && (
                  <div className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full">
                    <span className={`text-[10px] font-bold uppercase ${item.countColor}`}>{item.count}</span>
                  </div>
                )}
              </div>

              <div>
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
