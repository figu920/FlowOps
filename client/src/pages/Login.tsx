import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useLocation } from 'wouter';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useStore();
  const [_, setLocation] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      setLocation('/');
    } else {
      setError("Invalid credentials. Try 'manager' / '123'");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-flow-green/20 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-blue-500/10 blur-[80px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8 relative z-10"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">FlowOps</h1>
          <p className="text-muted-foreground text-sm">Restaurant Operations OS</p>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-white/10 p-8 rounded-[30px] shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Username / Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager"
                  className="bg-black/20 border-white/10 h-12 pl-10 rounded-xl focus:border-flow-green/50 focus:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••"
                  className="bg-black/20 border-white/10 h-12 pl-10 rounded-xl focus:border-flow-green/50 focus:ring-0"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-flow-red text-xs bg-flow-red/10 p-3 rounded-lg border border-flow-red/20">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 bg-flow-green text-black font-bold text-base hover:bg-flow-green/90 rounded-xl mt-4">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Demo Accounts</p>
            <div className="flex justify-center gap-2 mt-2 text-xs text-white/50">
               <span className="bg-white/5 px-2 py-1 rounded">manager / 123</span>
               <span className="bg-white/5 px-2 py-1 rounded">lead / 123</span>
               <span className="bg-white/5 px-2 py-1 rounded">employee / 123</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
