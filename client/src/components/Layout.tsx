import React from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  className?: string;
}

export default function Layout({ children, title, showBack = true, className }: LayoutProps) {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-flow-green/20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between h-11">
          <div className="flex items-center gap-2">
            {showBack && (
              <button 
                onClick={() => setLocation('/')}
                className="p-2 -ml-2 active:bg-white/10 rounded-full transition-colors tap-highlight-transparent"
              >
                <ChevronLeft className="w-6 h-6 text-flow-green" />
              </button>
            )}
            {title && (
              <h1 className="text-lg font-bold tracking-tight">{title}</h1>
            )}
          </div>
          {!showBack && (
             <div className="flex items-center gap-2">
               <span className="text-sm font-bold text-flow-green">FlowOps</span>
             </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={cn("flex-1 p-4 pb-8 safe-area-bottom overflow-x-hidden", className)}>
        {children}
      </main>
    </div>
  );
}
