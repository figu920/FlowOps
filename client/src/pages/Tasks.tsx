import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Tasks() {
  const { weeklyTasks, toggleTask } = useStore();

  return (
    <Layout title="Weekly Tasks">
      <div className="space-y-3">
        {weeklyTasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            onClick={() => toggleTask(task.id)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all active:scale-[0.98]",
              task.completed 
                ? "bg-white/5 border-white/5 opacity-60" 
                : "bg-card border-white/5"
            )}
          >
            <div className={cn(
              "transition-colors",
              task.completed ? "text-flow-green" : "text-muted-foreground"
            )}>
              {task.completed ? (
                <CheckCircle2 className="w-7 h-7" strokeWidth={2} />
              ) : (
                <Circle className="w-7 h-7" strokeWidth={2} />
              )}
            </div>

            <div className="flex-1">
              <p className={cn(
                "font-medium text-lg",
                task.completed && "line-through text-muted-foreground"
              )}>
                {task.text}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
              <Avatar className="w-5 h-5">
                <AvatarFallback className="bg-flow-yellow text-black text-[10px] font-bold">
                  {task.assignedTo.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-muted-foreground">{task.assignedTo}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </Layout>
  );
}
