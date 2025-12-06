import Layout from '@/components/Layout';
import { useStore, Status } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function Inventory() {
  const { inventory, updateInventory } = useStore();

  return (
    <Layout title="Inventory">
      <div className="space-y-3">
        {inventory.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-card rounded-[20px] p-5 border border-white/[0.04] shadow-sm"
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="text-4xl bg-white/5 w-16 h-16 flex items-center justify-center rounded-2xl border border-white/5">
                {item.emoji}
              </div>
              <div>
                <h3 className="font-bold text-[19px] text-white">{item.name}</h3>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  Last update: {item.updatedBy}
                </p>
              </div>
            </div>

            {/* Status Segmented Control - Redesigned */}
            <div className="grid grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-xl">
              {(['OK', 'LOW', 'OUT'] as const).map((status) => {
                const isActive = item.status === status;
                let activeClass = "";
                let textClass = "text-muted-foreground";
                
                if (isActive) {
                  if (status === 'OK') { activeClass = "bg-flow-green shadow-[0_0_15px_rgba(50,215,75,0.3)]"; textClass = "text-black font-bold"; }
                  if (status === 'LOW') { activeClass = "bg-flow-yellow shadow-[0_0_15px_rgba(247,209,84,0.3)]"; textClass = "text-black font-bold"; }
                  if (status === 'OUT') { activeClass = "bg-flow-red shadow-[0_0_15px_rgba(255,69,58,0.3)]"; textClass = "text-white font-bold"; }
                }

                return (
                  <button
                    key={status}
                    onClick={() => updateInventory(item.id, status)}
                    className={cn(
                      "py-2.5 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden",
                      isActive ? activeClass : "hover:bg-white/5",
                      textClass
                    )}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </Layout>
  );
}
