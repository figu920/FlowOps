import { useState } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Checklists() {
  const { checklists, toggleChecklist } = useStore();
  const [activeTab, setActiveTab] = useState("opening");

  const TaskItem = ({ task, type }: { task: any, type: 'opening' | 'shift' | 'closing' }) => (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border mb-3 transition-colors cursor-pointer active:scale-[0.99]",
        task.completed 
          ? "bg-flow-green/10 border-flow-green/20" 
          : "bg-card border-white/5 hover:bg-white/5"
      )}
      onClick={() => toggleChecklist(type, task.id)}
    >
      <div className={cn(
        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
        task.completed 
          ? "bg-flow-green border-flow-green" 
          : "border-white/20"
      )}>
        {task.completed && <Check className="w-5 h-5 text-black stroke-[3]" />}
      </div>
      
      <div className="flex-1">
        <p className={cn(
          "text-lg font-medium transition-all",
          task.completed ? "text-muted-foreground line-through" : "text-foreground"
        )}>
          {task.text}
        </p>
        {task.completed && task.completedBy && (
          <p className="text-xs text-flow-green mt-1">
            Completed by {task.completedBy} • {new Date(task.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        )}
      </div>
    </motion.div>
  );

  return (
    <Layout title="Checklists">
      <Tabs defaultValue="opening" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 bg-white/5 p-1 rounded-xl mb-6 h-12">
          <TabsTrigger value="opening" className="data-[state=active]:bg-card data-[state=active]:text-flow-green rounded-lg text-sm font-bold">Opening</TabsTrigger>
          <TabsTrigger value="shift" className="data-[state=active]:bg-card data-[state=active]:text-flow-yellow rounded-lg text-sm font-bold">During Shift</TabsTrigger>
          <TabsTrigger value="closing" className="data-[state=active]:bg-card data-[state=active]:text-flow-red rounded-lg text-sm font-bold">Closing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="opening" className="mt-0">
          {checklists.opening.map(task => <TaskItem key={task.id} task={task} type="opening" />)}
        </TabsContent>
        <TabsContent value="shift" className="mt-0">
          {checklists.shift.map(task => <TaskItem key={task.id} task={task} type="shift" />)}
        </TabsContent>
        <TabsContent value="closing" className="mt-0">
          {checklists.closing.map(task => <TaskItem key={task.id} task={task} type="closing" />)}
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
