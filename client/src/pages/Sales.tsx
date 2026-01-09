import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useMenu, useCreateSale, useSales } from '@/lib/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Save, TrendingUp, Download, Calendar, BarChart3, Folder, ChevronLeft, Search, X, ChefHat, LineChart } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  ComposedChart, Line, Legend 
} from 'recharts';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';

export default function Sales() {
  const { data: menu = [] } = useMenu();
  const { data: salesHistory = [] } = useSales();
  const createSaleMutation = useCreateSale();
  const { toast } = useToast();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  // --- LÓGICA DE CARPETAS (INPUT) ---
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  // --- LÓGICA DE ANÁLISIS INDEPENDIENTE ---
  const [analysisSearch, setAnalysisSearch] = useState("");
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);

  // 1. Obtener carpetas
  const folders = useMemo(() => {
    const categories = new Set(menu.map((item: any) => item.category).filter(Boolean));
    return Array.from(categories).sort() as string[]; 
  }, [menu]);

  // 2. Items a mostrar en Input
  const displayedItems = useMemo(() => {
    if (currentFolder) return menu.filter((item: any) => item.category === currentFolder);
    return menu.filter((item: any) => !item.category);
  }, [menu, currentFolder]);

  // --- GLOBAL DATE LOGIC (MES ACTUAL COMPLETO) ---
  const monthInterval = useMemo(() => {
    const now = new Date();
    return eachDayOfInterval({
        start: startOfMonth(now),
        end: endOfMonth(now)
    });
  }, []);

  // 3. Ventas del Mes (Lista filtrada para tabla y cálculos)
  const currentMonthSalesList = useMemo(() => {
    const now = new Date();
    return salesHistory.filter((sale: any) => {
      const saleDate = new Date(sale.date);
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    });
  }, [salesHistory]);

  // 4. DATOS GRÁFICO INFERIOR (GENERAL OVERVIEW - MES ACTUAL)
  const generalChartData = useMemo(() => {
    // Mapeamos CADA día del mes (1 al 31) para que el gráfico sea continuo
    return monthInterval.map(date => {
        // Sumamos todas las ventas de ese día específico
        const totalSalesForDay = currentMonthSalesList
            .filter((s: any) => isSameDay(new Date(s.date), date))
            .reduce((acc: number, curr: any) => acc + curr.quantitySold, 0);

        return {
            date: format(date, 'd'), // Eje X: 1, 2, 3...
            fullDate: format(date, 'MMM d'), // Tooltip
            sales: totalSalesForDay
        };
    });
  }, [monthInterval, currentMonthSalesList]);

  // 5. DATOS GRÁFICO SUPERIOR (PLATO INDIVIDUAL - MES ACTUAL)
  const selectedDish = useMemo(() => menu.find((m: any) => m.id === selectedDishId), [menu, selectedDishId]);

  const itemAnalysisData = useMemo(() => {
    if (!selectedDish) return [];

    // Filtramos solo las ventas de este plato
    const dishSales = salesHistory.filter((s: any) => s.menuItemId === selectedDishId);

    return monthInterval.map(date => {
        // Ventas de este plato en este día
        const dailyQty = dishSales
            .filter((s: any) => isSameDay(new Date(s.date), date))
            .reduce((acc: number, curr: any) => acc + curr.quantitySold, 0);

        const dataPoint: any = {
            date: format(date, 'd'),
            fullDate: format(date, 'MMM d'),
            Sales: dailyQty
        };

        // Calcular ingredientes (Líneas)
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
  const updateQty = (id: string, delta: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
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
    return new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Monthly Sales Register", 14, 22);
    doc.setFontSize(11); doc.setTextColor(100);
    const monthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    doc.text(`Period: ${monthName}`, 14, 30);

    const tableData = currentMonthSalesList.map((sale: any) => [
      formatTime(sale.date), getDishName(sale.menuItemId), sale.quantitySold,
    ]);

    autoTable(doc, {
      head: [['Date & Time', 'Item Name', 'Qty Sold']],
      body: tableData,
      startY: 40, theme: 'grid', headStyles: { fillColor: [0, 230, 118] },
    });
    doc.save(`Sales_Report_${monthName.replace(' ', '_')}.pdf`);
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
    <Layout title="Sales & Analytics" showBack={!currentFolder}>
      <div className="space-y-8 pb-24">
        
        {/* === SECTION 1: DISH PERFORMANCE (MES ACTUAL) === */}
        <section className="bg-black/20 rounded-[24px] border border-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                        <LineChart className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Dish Performance</h3>
                        <p className="text-xs text-muted-foreground">Sales & Usage for {format(new Date(), 'MMMM')}</p>
                    </div>
                </div>

                {/* BUSCADOR */}
                <div className="relative z-20">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        value={analysisSearch}
                        onChange={(e) => { setAnalysisSearch(e.target.value); setSelectedDishId(null); }}
                        onFocus={() => setSelectedDishId(null)}
                        placeholder="Search menu item..." 
                        className="pl-9 bg-black/40 border-white/10 h-11 rounded-xl"
                    />
                    
                    {analysisSearch && !selectedDishId && (
                        <div className="absolute top-12 left-0 right-0 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto z-50">
                            {menu.filter((m: any) => m.name.toLowerCase().includes(analysisSearch.toLowerCase())).map((dish: any) => (
                                <button 
                                    key={dish.id}
                                    onClick={() => { setSelectedDishId(dish.id); setAnalysisSearch(dish.name); }}
                                    className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                                >
                                    <ChefHat className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-bold text-white">{dish.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* GRÁFICO PLATO */}
            {selectedDishId && itemAnalysisData.length > 0 && (
                <div className="p-4 h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={itemAnalysisData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" hide />
                            <Tooltip 
                                labelFormatter={(label, payload) => payload[0]?.payload.fullDate}
                                contentStyle={{ backgroundColor: '#1C1C1E', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }} 
                                itemStyle={{ fontSize: '12px', padding: 0 }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} />
                            <Bar yAxisId="left" dataKey="Sales" fill="#4ADE80" radius={[2, 2, 0, 0]} barSize={10} />
                            {selectedDish?.ingredients?.map((ing: any, idx: number) => (
                                <Line key={ing.id} yAxisId="right" type="monotone" dataKey={ing.name} stroke={LINE_COLORS[idx % LINE_COLORS.length]} strokeWidth={2} dot={false} />
                            ))}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}
            
            {!selectedDishId && (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground opacity-30 gap-2">
                    <BarChart3 className="w-10 h-10" />
                    <p className="text-xs">Select a dish to see analysis</p>
                </div>
            )}
        </section>

        {/* === SECTION 2: INPUT SALES === */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
             <h3 className="font-bold text-white text-lg">Quick Sales Entry</h3>
          </div>

          <div>
            {currentFolder ? (
               <button onClick={() => setCurrentFolder(null)} className="flex items-center text-muted-foreground hover:text-white text-sm font-medium transition-colors mb-4">
                 <ChevronLeft className="w-4 h-4 mr-1" /> Back to Categories
               </button>
            ) : (
                <div className="flex items-center gap-2 mb-4 text-muted-foreground text-sm">
                   <Folder className="w-4 h-4" /> <span>Browse Menu</span>
                </div>
            )}

            {!currentFolder && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {folders.map((folderName, idx) => (
                  <motion.div
                    key={folderName}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setCurrentFolder(folderName)}
                    className="bg-card hover:bg-white/5 cursor-pointer rounded-[20px] p-4 border border-white/[0.04] flex flex-col items-center gap-3"
                  >
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
                        <div className="flex-1 pr-4">
                        <h4 className="font-bold text-white truncate">{dish.name}</h4>
                        <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded uppercase">{dish.category || 'Uncategorized'}</span>
                        </div>
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

        {/* === SECTION 3: MONTHLY OVERVIEW (GENERAL) === */}
        <section className="pt-6 border-t border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl text-white">Monthly Overview</h3>
            <Button variant="outline" size="sm" onClick={downloadPDF} className="border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2" disabled={currentMonthSalesList.length === 0}>
              <Download className="w-4 h-4" /> PDF
            </Button>
          </div>

          <div className="bg-black/20 p-4 rounded-2xl border border-white/5 h-[250px]">
            {/* GRÁFICO GENERAL MEJORADO */}
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={generalChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        stroke="#666" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        interval={2} // Mostrar cada 2 días si está muy lleno
                    />
                    <Tooltip 
                        labelFormatter={(label, payload) => payload[0]?.payload.fullDate}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                        contentStyle={{ backgroundColor: '#1C1C1E', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }} 
                    />
                    <Bar dataKey="sales" fill="#00E676" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
            {currentMonthSalesList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Calendar className="w-8 h-8 opacity-20" />
                <p>No sales recorded in {format(new Date(), 'MMMM')} yet.</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-white/5 text-muted-foreground sticky top-0 backdrop-blur-md">
                    <tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Item</th><th className="px-4 py-3 text-right">Qty</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentMonthSalesList.map((sale: any) => (
                      <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white/60 font-mono text-xs">{formatTime(sale.date)}</td>
                        <td className="px-4 py-3 font-medium text-white">{getDishName(sale.menuItemId)}</td>
                        <td className="px-4 py-3 text-right font-bold text-flow-green">+{sale.quantitySold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}