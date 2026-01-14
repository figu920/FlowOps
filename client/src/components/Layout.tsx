import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, Settings as SettingsIcon } from 'lucide-react'; // Importamos el icono de ajustes
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
// import { useStore } from '@/lib/store'; // Ya no necesitamos useStore aquí para el logout

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
  // const { currentUser, logout } = useStore(); // Ya no gestionamos logout aquí

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 20);
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* iOS-style Header */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-area-top px-4",
          scrolled ? "glass-header py-2" : "bg-transparent py-4"
        )}
      >
        <div className="flex items-center justify-between h-11 max-w-md mx-auto w-full relative">
          
          {/* ZONA IZQUIERDA: ATRÁS O AJUSTES */}
          <div className="flex items-center w-1/3">
            {showBack ? (
              <motion.button 
                whileTap={{ opacity: 0.5 }}
                onClick={() => setLocation('/')} // O history.back() si prefieres
                className="flex items-center text-flow-green -ml-2 p-2"
              >
                <ChevronLeft className="w-7 h-7" strokeWidth={2.5} />
                <span className="text-[17px] font-medium leading-none pb-0.5">Back</span>
              </motion.button>
            ) : (
              // 👇 AQUÍ ESTÁ EL CAMBIO: BOTÓN DE AJUSTES EN VEZ DE LOGOUT
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setLocation('/settings')}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors border border-white/5"
              >
                <SettingsIcon className="w-5 h-5" />
              </motion.button>
            )}
          </div>
          
          {/* TÍTULO CENTRAL (Se muestra al hacer scroll) */}
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

          {/* ZONA DERECHA: ACCIONES ESPECÍFICAS (Botón +) */}
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
          {/* Título Grande (Se oculta al hacer scroll) */}
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