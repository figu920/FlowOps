import { Link } from 'wouter';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { 
  Package, 
  Wrench, 
  ClipboardCheck, 
  CalendarCheck, 
  MessageSquare, 
  Clock 
} from 'lucide-react';

const menuItems = [
  { title: 'Inventory', icon: Package, path: '/inventory', color: 'text-flow-green' },
  { title: 'Equipment', icon: Wrench, path: '/equipment', color: 'text-flow-yellow' },
  { title: 'Checklists', icon: ClipboardCheck, path: '/checklists', color: 'text-blue-400' },
  { title: 'Weekly Tasks', icon: CalendarCheck, path: '/tasks', color: 'text-purple-400' },
  { title: 'Chat', icon: MessageSquare, path: '/chat', color: 'text-white' },
  { title: 'Timeline', icon: Clock, path: '/timeline', color: 'text-orange-400' },
];

export default function Home() {
  return (
    <Layout title="Dashboard" showBack={false}>
      <div className="grid grid-cols-2 gap-4 mt-2">
        {menuItems.map((item, index) => (
          <Link key={item.title} href={item.path}>
            <motion.div
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="aspect-square bg-card rounded-2xl p-5 flex flex-col justify-between shadow-sm border border-white/5 active:bg-white/5 transition-colors cursor-pointer"
            >
              <div className={`p-3 bg-white/5 w-fit rounded-xl ${item.color}`}>
                <item.icon className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <span className="font-semibold text-lg tracking-tight">{item.title}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
