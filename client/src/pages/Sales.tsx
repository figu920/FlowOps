import { useState } from 'react';
import Layout from '@/components/Layout';
import { useMenu, useCreateSale } from '@/lib/hooks';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Save, TrendingUp } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"; 

export default function Sales() {
  const { data: menu = [] } = useMenu();
  const createSaleMutation = useCreateSale();
  const { toast } = useToast();

  // Store quantities: { "DISH_ID": 5 }
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const updateQty = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }));
  };

  const handleInputChange = (id: string, val: string) => {
    const num = parseInt(val) || 0;
    setQuantities(prev => ({ ...prev, [id]: num }));
  };

  const handleSubmit = async () => {
    // Filter only items with quantity > 0
    const itemsSold = Object.entries(quantities).filter(([_, qty]) => qty > 0);
    
    if (itemsSold.length === 0) return;

    let successCount = 0;
    
    // Send sales one by one
    for (const [menuId, qty] of itemsSold) {
      try {
        await createSaleMutation.mutateAsync({
          menuItemId: menuId, 
          quantitySold: qty
        });
        successCount++;
      } catch (e) {
        console.error(e);
      }
    }

    setQuantities({}); // Reset form
    toast({
      title: "Sales Recorded",
      description: `Stock successfully deducted for ${successCount} items.`,
      variant: "default",
    });
  };

  return (
    <Layout title="Daily Sales Register">
      <div className="space-y-6 pb-24">
        
        {/* Banner informativo en Inglés */}
        <div className="bg-flow-green/10 p-4 rounded-xl border border-flow-green/20 flex items-start gap-3">
          <TrendingUp className="w-6 h-6 text-flow-green mt-1" />
          <div>
            <h3 className="font-bold text-white text-sm">Automated Stock Deduction</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Enter items sold today. The system will automatically calculate ingredients used and deduct them from your Inventory.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {menu.map((dish: any, idx: number) => (
            <motion.div 
              key={dish.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card p-4 rounded-2xl border border-white/5 flex items-center justify-between"
            >
              <div className="flex-1 pr-4">
                <h4 className="font-bold text-white truncate">{dish.name}</h4>
                <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded uppercase">
                  {dish.category}
                </span>
              </div>

              {/* Counter UI */}
              <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-xl border border-white/10">
                <button 
                  onClick={() => updateQty(dish.id, -1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white hover:bg-white/10 active:scale-90 transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <Input 
                  type="number" 
                  className="w-12 h-8 bg-transparent border-none text-center font-bold text-lg p-0 focus-visible:ring-0 text-white"
                  value={quantities[dish.id] || 0}
                  onChange={(e) => handleInputChange(dish.id, e.target.value)}
                />

                <button 
                  onClick={() => updateQty(dish.id, 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-flow-green text-black hover:bg-flow-green/90 active:scale-90 transition shadow-lg shadow-flow-green/20"
                >
                  <Plus className="w-4 h-4 stroke-[3px]" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 left-0 right-0 px-6 z-50">
        <Button 
          onClick={handleSubmit}
          className="w-full bg-white text-black font-bold h-14 rounded-2xl shadow-2xl text-lg hover:bg-gray-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
          disabled={createSaleMutation.isPending || Object.values(quantities).every(q => q === 0)}
        >
          {createSaleMutation.isPending ? (
            "Processing..."
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save & Update Stock
            </>
          )}
        </Button>
      </div>
    </Layout>
  );
}