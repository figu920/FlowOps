import { useState } from 'react';
import Layout from '@/components/Layout';
import { useStore, EquipmentStatus } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
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

  const StatusRow = ({ item }: { item: typeof equipment[0] }) => {
    const isExpanded = item.status === 'Broken' && item.lastIssue;

    return (
      <div className="bg-card rounded-xl border border-white/5 overflow-hidden mb-4">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">{item.name}</h3>
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1",
              item.status === 'Working' && "bg-flow-green/20 text-flow-green",
              item.status === 'Attention' && "bg-flow-yellow/20 text-flow-yellow",
              item.status === 'Broken' && "bg-flow-red/20 text-flow-red"
            )}>
              {item.status}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => updateEquipment(item.id, 'Working')}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-1",
                item.status === 'Working' 
                  ? "border-flow-green bg-flow-green/10 text-flow-green" 
                  : "border-white/10 text-muted-foreground hover:bg-white/5"
              )}
            >
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-xs font-medium">Working</span>
            </button>

            <button
              onClick={() => updateEquipment(item.id, 'Attention')}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-1",
                item.status === 'Attention' 
                  ? "border-flow-yellow bg-flow-yellow/10 text-flow-yellow" 
                  : "border-white/10 text-muted-foreground hover:bg-white/5"
              )}
            >
              <AlertTriangle className="w-6 h-6" />
              <span className="text-xs font-medium">Attention</span>
            </button>

            <button
              onClick={() => {
                 if (item.status !== 'Broken') {
                   setSelectedIssueId(item.id); // Open dialog
                 } else {
                   // Already broken, maybe clear it? No, must switch to working to clear.
                 }
              }}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-1",
                item.status === 'Broken' 
                  ? "border-flow-red bg-flow-red/10 text-flow-red" 
                  : "border-white/10 text-muted-foreground hover:bg-white/5"
              )}
            >
              <XCircle className="w-6 h-6" />
              <span className="text-xs font-medium">Broken</span>
            </button>
          </div>
        </div>
        
        {/* Issue Description Display */}
        <AnimatePresence>
          {item.status === 'Broken' && item.lastIssue && (
            <motion.div 
              initial={{ height: 0 }} 
              animate={{ height: 'auto' }} 
              exit={{ height: 0 }}
              className="bg-flow-red/5 border-t border-flow-red/20 px-4 py-3"
            >
              <p className="text-sm text-flow-red font-medium">Issue: {item.lastIssue}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <Layout title="Equipment">
      <div className="space-y-1">
        {equipment.map((item) => (
          <StatusRow key={item.id} item={item} />
        ))}
      </div>

      <Dialog open={!!selectedIssueId} onOpenChange={(open) => !open && setSelectedIssueId(null)}>
        <DialogContent className="bg-card border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle>Report Issue</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Describe the issue..." 
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              className="bg-background border-white/10 text-lg min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedIssueId(null)} className="border-white/10 hover:bg-white/5 hover:text-white">Cancel</Button>
            <Button onClick={handleBrokenReport} className="bg-flow-red hover:bg-flow-red/90 text-white font-bold">Report Broken</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
