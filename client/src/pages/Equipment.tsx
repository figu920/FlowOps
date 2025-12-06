import { useState } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, PenLine } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Equipment() {
  const { equipment, updateEquipment } = useStore();
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [issueText, setIssueText] = useState("");

  const handleBrokenReport = () => {
    if (selectedIssueId) {
      updateEquipment(selectedIssueId, 'Broken', issueText);
      setSelectedIssueId(null);
      setIssueText("");
    }
  };

  return (
    <Layout title="Equipment">
      <div className="space-y-4">
        {equipment.map((item, idx) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              "bg-card rounded-[20px] p-1 border transition-colors duration-300",
              item.status === 'Broken' ? "border-flow-red/50" : "border-white/[0.04]"
            )}
          >
             <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-white tracking-tight">{item.name}</span>
                  <div className={cn(
                    "h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]",
                    item.status === 'Working' ? "text-flow-green bg-flow-green" : 
                    item.status === 'Attention' ? "text-flow-yellow bg-flow-yellow" : 
                    "text-flow-red bg-flow-red"
                  )} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Working Button */}
                  <button
                    onClick={() => updateEquipment(item.id, 'Working')}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all duration-200",
                      item.status === 'Working'
                        ? "bg-flow-green/10 border-flow-green text-flow-green"
                        : "bg-white/[0.02] border-transparent text-muted-foreground opacity-50 hover:opacity-100"
                    )}
                  >
                    <CheckCircle2 className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">OK</span>
                  </button>

                  {/* Attention Button */}
                  <button
                    onClick={() => updateEquipment(item.id, 'Attention')}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all duration-200",
                      item.status === 'Attention'
                        ? "bg-flow-yellow/10 border-flow-yellow text-flow-yellow"
                        : "bg-white/[0.02] border-transparent text-muted-foreground opacity-50 hover:opacity-100"
                    )}
                  >
                    <AlertTriangle className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Check</span>
                  </button>

                  {/* Broken Button */}
                  <button
                    onClick={() => {
                       if (item.status !== 'Broken') setSelectedIssueId(item.id);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all duration-200",
                      item.status === 'Broken'
                        ? "bg-flow-red/10 border-flow-red text-flow-red"
                        : "bg-white/[0.02] border-transparent text-muted-foreground opacity-50 hover:opacity-100"
                    )}
                  >
                    <XCircle className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Broken</span>
                  </button>
                </div>
             </div>

             {/* Issue Drawer */}
             <AnimatePresence>
               {item.status === 'Broken' && item.lastIssue && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="bg-flow-red/10 rounded-b-[18px] px-5 py-3 border-t border-flow-red/10"
                 >
                   <div className="flex gap-2 items-start text-flow-red">
                     <PenLine className="w-4 h-4 mt-0.5 shrink-0" />
                     <p className="text-sm font-medium leading-snug italic">"{item.lastIssue}"</p>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Modern Report Modal */}
      <Dialog open={!!selectedIssueId} onOpenChange={(open) => !open && setSelectedIssueId(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Report Issue</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Textarea 
              autoFocus
              placeholder="What's wrong with it?" 
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              className="bg-black/20 border-white/10 text-lg min-h-[120px] resize-none p-4 rounded-xl focus:border-flow-red focus:ring-0"
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button variant="ghost" onClick={() => setSelectedIssueId(null)} className="flex-1 text-muted-foreground hover:text-white hover:bg-white/5 h-12 rounded-xl">Cancel</Button>
            <Button onClick={handleBrokenReport} className="flex-1 bg-flow-red hover:bg-flow-red/90 text-white font-bold h-12 rounded-xl shadow-[0_0_20px_rgba(255,69,58,0.4)] border-0">
              Report Broken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
