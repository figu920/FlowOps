import { useState } from 'react';
import Layout from '@/components/Layout';
import { useMenu, useCreateSale, useSales } from '@/lib/hooks'; // Asegúrate de tener useSales aquí
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Save, TrendingUp, Download, History, Calendar } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Sales() {
  const { data: menu = [] } = useMenu();
  const { data: salesHistory = [] } = useSales(); // Traemos el historial
  const createSaleMutation = useCreateSale();
  const { toast } = useToast();

  // Store quantities: { "DISH_ID": 5 }
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // --- FILTRO MENSUAL INTELIGENTE 📅 ---
  const currentMonthSales = salesHistory.filter((sale: any) => {
    const saleDate = new Date(sale.date);
    const now = new Date();
    // Solo mostramos ventas de este mes y este año
    return saleDate.getMonth() === now.getMonth() && 
           saleDate.getFullYear() === now.getFullYear();
  });

  // Helpers
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

  const getDishName = (id: string) => {
    const dish = menu.find((m: any) => m.id === id);
    return dish ? dish.name : 'Unknown Item';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // --- GENERADOR DE PDF 📄 ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text("Monthly Sales Register", 14, 22);
    
    // Subtítulo con fecha
    doc.setFontSize(11);
    doc.setTextColor(100);
    const monthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    doc.text(`Period: ${monthName}`, 14, 30);

    // Datos de la tabla
    const tableData = currentMonthSales.map((sale: any) => [
      formatTime(sale.date),
      getDishName(sale.menuItemId),
      sale.quantitySold,
      // Si tuvieras precio de venta en la tabla sales, iría aquí.
    ]);

    // Generar tabla
    autoTable(doc, {
      head: [['Date & Time', 'Item Name', 'Qty Sold']],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [0, 230, 118] }, // Color verde flow
    });

    doc.save(`Sales_Report_${monthName.replace(' ', '_')}.pdf`);
  };

  const handleSubmit = async () => {
    const itemsSold = Object.entries(quantities).filter(([_, qty]) => qty > 0);
    
    if (itemsSold.length === 0) return;

    let successCount = 0;
    
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

    setQuantities({}); 
    toast({
      title: "Sales Recorded",
      description: `Stock deducted & logged for ${successCount} items.`,
      variant: "default",
    });
  };

  return (
    <Layout title="Daily Sales Register">
      <div className="space-y-8 pb-24">
        
        {/* === SECTION 1: INPUT SALES === */}
        <section className="space-y-4">
          <div className="bg-flow-green/10 p-4 rounded-xl border border-flow-green/20 flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-flow-green mt-1" />
            <div>
              <h3 className="font-bold text-white text-sm">Automated Stock Deduction</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Enter items sold. Stock is deducted automatically.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {menu.map((dish: any) => (
              <div 
                key={dish.id}
                className="bg-card p-4 rounded-2xl border border-white/5 flex items-center justify-between"
              >
                <div className="flex-1 pr-4">
                  <h4 className="font-bold text-white truncate">{dish.name}</h4>
                  <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded uppercase">
                    {dish.category}
                  </span>
                </div>

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
              </div>
            ))}
          </div>

          <Button 
            onClick={handleSubmit}
            className="w-full bg-white text-black font-bold h-14 rounded-2xl shadow-xl text-lg hover:bg-gray-200 active:scale-95 flex items-center justify-center gap-2"
            disabled={createSaleMutation.isPending || Object.values(quantities).every(q => q === 0)}
          >
            {createSaleMutation.isPending ? "Processing..." : (
              <> <Save className="w-5 h-5" /> Save Sales </>
            )}
          </Button>
        </section>

        {/* === SECTION 2: HISTORY & PDF === */}
        <section className="pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-flow-green" />
              <h3 className="font-bold text-xl text-white">Month History</h3>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={downloadPDF}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2"
              disabled={currentMonthSales.length === 0}
            >
              <Download className="w-4 h-4" />
              PDF Export
            </Button>
          </div>

          <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
            {currentMonthSales.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Calendar className="w-8 h-8 opacity-20" />
                <p>No sales recorded this month yet.</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-white/5 text-muted-foreground sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentMonthSales.map((sale: any) => (
                      <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white/60 font-mono text-xs">
                          {formatTime(sale.date)}
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          {getDishName(sale.menuItemId)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-flow-green">
                          +{sale.quantitySold}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-4">
            * This list resets visually every month. All data is safely stored in database.
          </p>
        </section>

      </div>
    </Layout>
  );
}