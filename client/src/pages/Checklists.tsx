import { useState } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export default function Checklists() {
  const { checklists, toggleChecklist } = useStore();
  const [activeTab, setActiveTab] = useState<"opening" | "shift" | "closing">("opening");

  const tabs = [
    { id: "opening", label: "Opening", color: "text-flow-green", border: "data-[state=active]:border-flow-green" },
    { id: "shift", label: "Shift", color: "text-flow-yellow", border: "data-[state=active]:border-flow-yellow" },
    { id: "closing", label: "Closing", color: "text-flow-red", border: "data-[state=active]:border-flow-red" },
  ] as const;

  const TaskRow = ({ task, type }: { task: any, type: 'opening' | 'shift' | 'closing' }) => (
    <motion.button
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => toggleChecklist(type, task.id)}
      className={cn(
        "w-full text-left flex items-center gap-4 p-5 rounded-2xl border mb-3 transition-all duration-300 group",
        task.completed 
          ? "bg-white/[0.02] border-transparent opacity-60" 
          : "bg-card border-white/[0.04] shadow-sm hover:bg-white/[0.06]"
      )}
    >
      <div className={cn(
        "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300",
        task.completed 
          ? "bg-flow-green border-flow-green scale-110" 
          : "border-white/20 group-hover:border-white/40"
      )}>
        {task.completed && <Check className="w-4 h-4 text-black stroke-[3]" />}
      </div>
      
      <div className="flex-1">
        <span className={cn(
          "text-[17px] font-medium transition-all block",
          task.completed ? "text-muted-foreground line-through decoration-white/20" : "text-white"
        )}>
          {task.text}
        </span>
        
        <AnimatePresence>
          {task.completed && task.completedBy && (
            <motion.span 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs text-flow-green font-medium mt-1 block"
            >
              Done by {task.completedBy}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );

  return (
    <Layout title="Checklists">
      {/* Custom Tab Bar */}
      <div className="flex p-1 bg-white/5 rounded-xl mb-6 relative">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all z-10 relative",
                isActive ? "text-white" : "text-muted-foreground hover:text-white/70"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className={cn("absolute inset-0 bg-white/10 rounded-lg shadow-sm border border-white/5")}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
           <motion.div
             key={activeTab}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             transition={{ duration: 0.2 }}
           >
             {checklists[activeTab].map(task => (
               <TaskRow key={task.id} task={task} type={activeTab} />
             ))}
             
             {checklists[activeTab].length === 0 && (
               <div className="text-center text-muted-foreground py-10">
                 No tasks for this checklist.
               </div>
             )}
           </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
}
