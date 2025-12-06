import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Tasks() {
  const { weeklyTasks, toggleTask } = useStore();

  return (
    <Layout title="Weekly Tasks">
      <div className="space-y-3">
        {weeklyTasks.map((task, idx) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => toggleTask(task.id)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border p-0 cursor-pointer transition-all active:scale-[0.98]",
              task.completed 
                ? "bg-card/30 border-white/5" 
                : "bg-card border-white/[0.06] hover:border-white/10"
            )}
          >
            {/* Progress Bar Background Effect for Completed */}
            <div className={cn(
               "absolute inset-0 bg-purple-500/10 transition-transform duration-500 origin-left",
               task.completed ? "scale-x-100" : "scale-x-0"
            )} />

            <div className="relative p-5 flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300",
                task.completed ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "bg-white/5 text-muted-foreground"
              )}>
                {task.completed ? <Check className="w-6 h-6 stroke-[3]" /> : <Calendar className="w-6 h-6" />}
              </div>

              <div className="flex-1">
                <h3 className={cn(
                  "text-[17px] font-semibold transition-colors",
                  task.completed ? "text-muted-foreground line-through" : "text-white"
                )}>
                  {task.text}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">Assigned to:</span>
                  <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md">
                     <div className="w-4 h-4 rounded bg-purple-400/20 text-purple-400 flex items-center justify-center text-[9px] font-bold">
                       {task.assignedTo.charAt(0)}
                     </div>
                     <span className="text-xs text-white/80">{task.assignedTo}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Layout>
  );
}
