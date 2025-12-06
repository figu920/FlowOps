import Layout from '@/components/Layout';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { AlertCircle, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Timeline() {
  const { timeline } = useStore();

  const getIcon = (type: string) => {
    switch(type) {
      case 'alert': return <AlertCircle className="w-5 h-5 text-flow-red" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-flow-yellow" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-flow-green" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch(type) {
      case 'alert': return 'border-l-flow-red';
      case 'warning': return 'border-l-flow-yellow';
      case 'success': return 'border-l-flow-green';
      default: return 'border-l-blue-400';
    }
  };

  return (
    <Layout title="Timeline">
      <div className="space-y-6 pl-2">
        {timeline.map((event, i) => {
          const date = parseISO(event.timestamp);
          const timeStr = format(date, 'h:mm a');
          
          // Simple check if date changed from previous item could be added here for section headers
          
          return (
            <div key={event.id} className="relative pl-6 pb-2">
              {/* Line */}
              {i !== timeline.length - 1 && (
                <div className="absolute left-[9px] top-8 bottom-[-24px] w-[2px] bg-white/5" />
              )}
              
              {/* Dot */}
              <div className="absolute left-0 top-1 w-5 h-5 flex items-center justify-center bg-background z-10">
                {getIcon(event.type)}
              </div>

              <div className={cn(
                "bg-card p-4 rounded-lg border border-white/5 border-l-4 shadow-sm ml-2",
                getBorderColor(event.type)
              )}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-foreground">{event.author}</span>
                  <span className="text-xs text-muted-foreground font-mono">{timeStr}</span>
                </div>
                <p className="text-sm leading-relaxed">
                  {event.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
