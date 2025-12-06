import Layout from '@/components/Layout';
import { useStore, Status } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function Inventory() {
  const { inventory, updateInventory } = useStore();

  const StatusButton = ({ status, active, onClick }: { status: Status, active: boolean, onClick: () => void }) => {
    let baseColor = "";
    let activeColor = "";
    
    switch(status) {
      case 'OK': baseColor = "border-flow-green text-flow-green"; activeColor = "bg-flow-green text-black border-flow-green"; break;
      case 'LOW': baseColor = "border-flow-yellow text-flow-yellow"; activeColor = "bg-flow-yellow text-black border-flow-yellow"; break;
      case 'OUT': baseColor = "border-flow-red text-flow-red"; activeColor = "bg-flow-red text-white border-flow-red"; break;
    }

    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "flex-1 py-3 rounded-lg border font-bold text-sm transition-all duration-200",
          active ? activeColor : `${baseColor} bg-transparent opacity-40 hover:opacity-100`
        )}
      >
        {status}
      </motion.button>
    );
  };

  return (
    <Layout title="Inventory">
      <div className="space-y-4">
        {inventory.map((item) => (
          <div key={item.id} className="bg-card rounded-xl p-4 border border-white/5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{item.emoji}</span>
              <span className="font-semibold text-lg">{item.name}</span>
            </div>
            
            <div className="flex gap-2">
              <StatusButton 
                status="OK" 
                active={item.status === 'OK'} 
                onClick={() => updateInventory(item.id, 'OK')} 
              />
              <StatusButton 
                status="LOW" 
                active={item.status === 'LOW'} 
                onClick={() => updateInventory(item.id, 'LOW')} 
              />
              <StatusButton 
                status="OUT" 
                active={item.status === 'OUT'} 
                onClick={() => updateInventory(item.id, 'OUT')} 
              />
            </div>
            
            {item.lastUpdated && (
               <div className="mt-3 text-xs text-muted-foreground flex justify-between">
                 <span>Updated by {item.updatedBy}</span>
                 {/* We could format date better here */}
               </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
