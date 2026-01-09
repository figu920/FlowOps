import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useMenu, useCreateSale, useSales } from '@/lib/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Minus, Plus, Save, Download, Calendar, BarChart3, 
  Folder, ChevronLeft, Search, ChefHat, LineChart, 
  History, ArrowRightLeft, AlertCircle, PackageCheck
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast"; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  ComposedChart, Line, Legend 
} from 'recharts';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';

// --- MOCK HOOK PARA LOGS DE INVENTARIO ---
// (En el futuro, esto debería venir de tu base de datos real 'useInventoryLogs')
const useInventoryLogs = () => {
  return {
    data: [
      { id: 1, date: new Date().toISOString(), itemName: 'Bison Wing Basket', change: -2, reason: 'Waste (Burnt)', user: 'Chef Mike' },
      { id: 2, date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), itemName: 'Frozen Fries', change: +20, reason: 'Delivery', user: 'Manager' },
      { id: 3, date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), itemName: 'Tomato Sauce', change: -1, reason: 'Broken Jar', user: 'Staff' },
      { id: 4, date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), itemName: 'Burger Buns', change: +50, reason: 'Restock', user: 'Manager' },
    ]
  };
};

export default function Sales() {
  const { data: menu = [] } = useMenu();
  const { data: salesHistory = [] } = useSales();
  const { data: inventoryLogs = [] } = useInventoryLogs(); // Usamos los logs
  const createSaleMutation = useCreateSale();
  const { toast } = useToast();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  // --- ESTADOS DE VISTA ---
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [historyTab, setHistoryTab] = useState<'sales' | 'inventory'>('sales'); // Nuevo Tab

  // --- ANÁLISIS ---
  const [analysisSearch, setAnalysisSearch] = useState("");
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);

  // 1. Obtener carpetas
  const folders = useMemo(() => {
    const categories = new Set(menu.map((item: any) => item.category).filter(Boolean));
    return Array.from(categories).sort() as string[]; 
  }, [menu]);

  // 2. Items Input
  const displayedItems = useMemo(() => {
    if (currentFolder) return menu.filter((item: any) => item.category === currentFolder);
    return menu.filter((item: any) => !item.category);
  }, [menu, currentFolder]);

  // --- FECHAS ---
  const monthInterval = useMemo(() => {
    const now = new Date();
    return eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
  }, []);

  // 3. Ventas Mes Actual
  const currentMonthSalesList = useMemo(() => {
    const now = new Date();
    return salesHistory.filter((sale: any) => {
      const saleDate = new Date(sale.date);
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    });
  }, [salesHistory]);

  // 4. Gráfico General
  const generalChartData = useMemo(() => {
    return monthInterval.map(date => {
        const totalSalesForDay = currentMonthSalesList
            .filter((s: any) => isSameDay(new Date(s.date), date))
            .reduce((acc: number, curr: any) => acc + curr.quantitySold, 0);

        return {
            date: format(date, 'd'),
            fullDate: format(date, 'MMM d'),
            sales: totalSalesForDay
        };
    });
  }, [monthInterval, currentMonthSalesList]);

  // 5. Gráfico Plato
  const selectedDish = useMemo(() => menu.find((m: any) => m.id === selectedDishId), [menu, selectedDishId]);

  const itemAnalysisData = useMemo(() => {
    if (!selectedDish) return [];
    const dishSales = salesHistory.filter((s: any) => s.menuItemId === selectedDishId);
    
    return monthInterval.map(date => {
        const dailyQty = dishSales
            .filter((s: any) => isSameDay(new Date(s.date), date))
            .reduce((acc: number, curr: any) => acc + curr.quantitySold, 0);

        const dataPoint: any = {
            date: format(date, 'd'),
            fullDate: format(date, 'MMM d'),
            Sales: dailyQty
        };
        if (selectedDish.ingredients) {
            selectedDish.ingredients.forEach((ing: any) => {
                dataPoint[ing.name] = dailyQty * ing.quantity; 
            });
        }
        return dataPoint;
    });
  }, [selectedDish, salesHistory, selectedDishId, monthInterval]);

  const LINE_COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A855F7", "#FF9F43"];

  // --- HANDLERS ---
  const updateQty = (id: string, delta: number) => setQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  const handleInputChange = (id: string, val: string) => setQuantities(prev => ({ ...prev, [id]: parseInt(val) || 0 }));
  const getDishName = (id: string) => menu.find((m: any) => m.id === id)?.name || 'Unknown';
  const formatTime = (dateString: string) => new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Transaction Report", 14, 22);
    
    // Si estamos en ventas, exportamos ventas. Si no, logs.
    if(historyTab === 'sales') {
        const tableData = currentMonthSalesList.map((sale: any) => [formatTime(sale.date), getDishName(sale.menuItemId), sale.quantitySold]);
        autoTable(doc, { head: [['Date', 'Item', 'Qty']], body: tableData, startY: 30 });
    } else {
        const tableData = inventoryLogs.map((log: any) => [formatTime(log.date), log.itemName, log.change > 0 ? `+${log.change}` : log.change, log.reason, log.user]);
        autoTable(doc, { head: [['Date', 'Item', 'Change', 'Reason', 'User']], body: tableData, startY: 30 });
    }
    doc.save(`Report_${format(new Date(), 'yyyy-MM')}.pdf`);
  };

  const handleSubmit = async () => {
    const itemsSold = Object.entries(quantities).filter(([_, qty]) => qty > 0);
    if (itemsSold.length === 0) return;
    let successCount = 0;
    for (const [menuId, qty] of itemsSold) {
      try { await createSaleMutation.mutateAsync({ menuItemId: menuId, quantitySold: qty }); successCount++; } catch (e) { console.error(e); }
    }
    setQuantities({}); 
    toast({ title: "Sales Recorded", description: `Updated stock for ${successCount} items.`, variant: "default" });
  };

  return (
    <Layout title="Sales & Analytics" showBack={true}>
      <div className="space-y-8 pb-24">
        
        {/* === SECTION 1: DISH PERFORMANCE === */}
        <section className="bg-black/20 rounded-[24px] border border-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><LineChart className="w-5 h-5" /></div>
                    <div><h3 className="font-bold text-white">Dish Performance</h3><p className="text-xs text-muted-foreground">Sales & Usage for {format(new Date(), 'MMMM')}</p></div>
                </div>
                <div className="relative z-20">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={analysisSearch} onChange={(e) => { setAnalysisSearch(e.target.value); setSelectedDishId(null); }} onFocus={() => setSelectedDishId(null)} placeholder="Search menu item..." className="pl-9 bg-black/40 border-white/10 h-11 rounded-xl" />
                    {analysisSearch && !selectedDishId && (
                        <div className="absolute top-12 left-0 right-0 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto z-50">
                            {menu.filter((m: any) => m.name.toLowerCase().includes(analysisSearch.toLowerCase())).map((dish: any) => (
                                <button key={dish.id} onClick={() => { setSelectedDishId(dish.id); setAnalysisSearch(dish.name); }} className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0">
                                    <ChefHat className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-bold text-white">{dish.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedDishId && itemAnalysisData.length > 0 && (
                <div className="p-4 h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={itemAnalysisData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" hide />
                            <Tooltip labelFormatter={(label, payload) => payload[0]?.payload.fullDate} contentStyle={{ backgroundColor: '#1C1C1E', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }} itemStyle={{ fontSize: '12px', padding: 0 }} />
                            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} />
                            <Bar yAxisId="left" dataKey="Sales" fill="#4ADE80" radius={[2, 2, 0, 0]} barSize={10} />
                            {selectedDish?.ingredients?.map((ing: any, idx: number) => (
                                <Line key={ing.id} yAxisId="right" type="monotone" dataKey={ing.name} stroke={LINE_COLORS[idx % LINE_COLORS.length]} strokeWidth={2} dot={false} />
                            ))}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}
            {!selectedDishId && <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground opacity-30 gap-2"><BarChart3 className="w-10 h-10" /><p className="text-xs">Select a dish to see analysis</p></div>}
        </section>

        {/* === SECTION 2: INPUT SALES === */}
        <section className="space-y-4">
          <h3 className="font-bold text-white text-lg">Quick Sales Entry</h3>
          <div>
            {currentFolder ? (
               <button onClick={() => setCurrentFolder(null)} className="flex items-center text-muted-foreground hover:text-white text-sm font-medium transition-colors mb-4"><ChevronLeft className="w-4 h-4 mr-1" /> Back to Categories</button>
            ) : (
                <div className="flex items-center gap-2 mb-4 text-muted-foreground text-sm"><Folder className="w-4 h-4" /> <span>Browse Menu</span></div>
            )}
            {!currentFolder && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {folders.map((folderName, idx) => (
                  <motion.div key={folderName} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} onClick={() => setCurrentFolder(folderName)} className="bg-card hover:bg-white/5 cursor-pointer rounded-[20px] p-4 border border-white/[0.04] flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center"><Folder className="w-6 h-6" /></div>
                    <span className="font-bold text-white truncate w-full text-center">{folderName}</span>
                  </motion.div>
                ))}
              </div>
            )}
            {displayedItems.length > 0 && (
                <div className="space-y-3">
                    {displayedItems.map((dish: any) => (
                    <div key={dish.id} className="bg-card p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div className="flex-1 pr-4"><h4 className="font-bold text-white truncate">{dish.name}</h4><span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded uppercase">{dish.category || 'Uncategorized'}</span></div>
                        <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-xl border border-white/10">
                        <button onClick={() => updateQty(dish.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white hover:bg-white/10 active:scale-90 transition"><Minus className="w-4 h-4" /></button>
                        <Input type="number" className="w-12 h-8 bg-transparent border-none text-center font-bold text-lg p-0 focus-visible:ring-0 text-white" value={quantities[dish.id] || 0} onChange={(e) => handleInputChange(dish.id, e.target.value)} />
                        <button onClick={() => updateQty(dish.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-flow-green text-black hover:bg-flow-green/90 active:scale-90 transition shadow-lg shadow-flow-green/20"><Plus className="w-4 h-4 stroke-[3px]" /></button>
                        </div>
                    </div>
                    ))}
                </div>
            )}
          </div>
          <Button onClick={handleSubmit} className="w-full bg-white text-black font-bold h-14 rounded-2xl shadow-xl text-lg hover:bg-gray-200 active:scale-95 flex items-center justify-center gap-2" disabled={createSaleMutation.isPending || Object.values(quantities).every(q => q === 0)}>
            {createSaleMutation.isPending ? "Processing..." : (<> <Save className="w-5 h-5" /> Save Sales </>)}
          </Button>
        </section>

        {/* === SECTION 3: TRANSACTION HISTORY (NUEVO DISEÑO) === */}
        <section className="pt-6 border-t border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl text-white">Transaction History</h3>
            <Button variant="outline" size="sm" onClick={downloadPDF} className="border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2">
              <Download className="w-4 h-4" /> PDF
            </Button>
          </div>

          {/* Gráfico General (Solo visible en modo ventas) */}
          {historyTab === 'sales' && (
             <div className="bg-black/20 p-4 rounded-2xl border border-white/5 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generalChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} interval={2} />
                        <Tooltip labelFormatter={(label, payload) => payload[0]?.payload.fullDate} cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1C1C1E', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }} />
                        <Bar dataKey="sales" fill="#00E676" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          )}

          {/* PESTAÑAS Y TABLA */}
          <div className="space-y-4">
             {/* Switcher */}
             <div className="flex p-1 bg-black/40 rounded-xl border border-white/10 w-fit">
                <button 
                  onClick={() => setHistoryTab('sales')}
                  className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2", historyTab === 'sales' ? "bg-flow-green text-black shadow-lg" : "text-muted-foreground hover:text-white")}
                >
                    <BarChart3 className="w-4 h-4" /> Sales
                </button>
                <button 
                  onClick={() => setHistoryTab('inventory')}
                  className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2", historyTab === 'inventory' ? "bg-blue-500 text-white shadow-lg" : "text-muted-foreground hover:text-white")}
                >
                    <History className="w-4 h-4" /> Inventory Logs
                </button>
             </div>

             {/* Tabla */}
             <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden min-h-[300px]">
                <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-white/5 text-muted-foreground sticky top-0 backdrop-blur-md z-10">
                        {historyTab === 'sales' ? (
                            <tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Item</th><th className="px-4 py-3 text-right">Qty</th></tr>
                        ) : (
                            <tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Log Info</th><th className="px-4 py-3 text-right">Change</th></tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {historyTab === 'sales' ? (
                            // LISTA DE VENTAS
                            currentMonthSalesList.length > 0 ? currentMonthSalesList.map((sale: any) => (
                                <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 text-white/60 font-mono text-xs">{formatTime(sale.date)}</td>
                                    <td className="px-4 py-3 font-medium text-white">{getDishName(sale.menuItemId)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-flow-green">+{sale.quantitySold}</td>
                                </tr>
                            )) : <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">No sales yet</td></tr>
                        ) : (
                            // LISTA DE LOGS DE INVENTARIO
                            inventoryLogs.length > 0 ? inventoryLogs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 text-white/60 font-mono text-xs w-32">{formatTime(log.date)}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-white">{log.itemName}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/70 uppercase tracking-wider">{log.reason}</span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><History className="w-3 h-3" /> {log.user}</span>
                                        </div>
                                    </td>
                                    <td className={cn("px-4 py-3 text-right font-bold text-lg", log.change > 0 ? "text-blue-400" : "text-red-400")}>
                                        {log.change > 0 ? `+${log.change}` : log.change}
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">No inventory logs available</td></tr>
                        )}
                    </tbody>
                    </table>
                </div>
             </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}