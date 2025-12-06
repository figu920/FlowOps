import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  className?: string;
  action?: React.ReactNode;
}

export default function Layout({ children, title, showBack = true, className, action }: LayoutProps) {
  const [_, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { currentUser, switchUser } = useStore();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 20);
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* Role Switcher (Hidden/Debug) */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="bg-card border-white/10 text-white">
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Switch User Role</h3>
            <div className="grid gap-2">
              <Button onClick={() => { switchUser('manager'); setRoleDialogOpen(false); }} variant="outline" className="justify-start border-white/10 hover:bg-white/5">
                👨‍💼 Manager (Full Access)
              </Button>
              <Button onClick={() => { switchUser('lead'); setRoleDialogOpen(false); }} variant="outline" className="justify-start border-white/10 hover:bg-white/5">
                👷 Lead (Edit/Add)
              </Button>
              <Button onClick={() => { switchUser('employee'); setRoleDialogOpen(false); }} variant="outline" className="justify-start border-white/10 hover:bg-white/5">
                👤 Employee (View Only)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* iOS-style Header */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-area-top px-4",
          scrolled ? "glass-header py-2" : "bg-transparent py-4"
        )}
      >
        <div className="flex items-center justify-between h-11 max-w-md mx-auto w-full relative">
          <div className="flex items-center w-1/3">
            {showBack ? (
              <motion.button 
                whileTap={{ opacity: 0.5 }}
                onClick={() => setLocation('/')}
                className="flex items-center text-flow-green -ml-2 p-2"
              >
                <ChevronLeft className="w-7 h-7" strokeWidth={2.5} />
                <span className="text-[17px] font-medium leading-none pb-0.5">Back</span>
              </motion.button>
            ) : (
              // User Avatar/Role Trigger on Home
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setRoleDialogOpen(true)}
                className="flex items-center gap-2 bg-white/5 pr-3 pl-1 py-1 rounded-full border border-white/5"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold leading-none uppercase text-muted-foreground">{currentUser.role}</span>
                </div>
              </motion.button>
            )}
          </div>
          
          <div className="w-1/3 flex justify-center">
             <AnimatePresence>
               {scrolled && title && (
                 <motion.span 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 5 }}
                   className="font-semibold text-[17px]"
                 >
                   {title}
                 </motion.span>
               )}
             </AnimatePresence>
          </div>

          <div className="w-1/3 flex justify-end">
            {action}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        onScroll={handleScroll}
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden safe-area-bottom w-full max-w-md mx-auto", 
          className
        )}
      >
        <div className={cn("px-5 pt-20 pb-10", !showBack && "pt-16")}>
          {/* Large Title Area */}
          {!scrolled && title && (
            <motion.h1 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[34px] font-bold tracking-tight mb-6 leading-tight"
            >
              {title}
            </motion.h1>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
