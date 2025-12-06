import { useState } from 'react';
import { useStore, Establishment } from '@/lib/store';
import { useLocation } from 'wouter';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from 'framer-motion';
import { Lock, Mail, AlertCircle, User, Building2, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentUser } = useStore();
  const [_, setLocation] = useLocation();

  // Registration State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regUser, setRegUser] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirmPass, setRegConfirmPass] = useState("");
  const [regEstablishment, setRegEstablishment] = useState<Establishment>("Bison Den");
  const [regPhone, setRegPhone] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = await api.auth.login(emailOrUser, password);
      setCurrentUser(user);
      setLocation('/');
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!regName || !regEmail || !regUser || !regPass) {
      setError("All fields are required.");
      return;
    }

    if (regPass.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (regPass !== regConfirmPass) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await api.auth.register({
        name: regName,
        email: regEmail,
        username: regUser,
        password: regPass,
        establishment: regEstablishment,
        phoneNumber: regPhone
      });

      setSuccessMsg("Registration successful! Please wait for Manager approval.");
      setTimeout(() => {
        setIsRegistering(false);
        setSuccessMsg("");
        setRegName(""); setRegEmail(""); setRegUser(""); setRegPass(""); setRegConfirmPass("");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setIsLoading(false);
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
          <div className="flex justify-center mb-6">
             <div className="bg-white/5 p-1 rounded-xl flex">
               <button 
                 onClick={() => setIsRegistering(false)}
                 className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", !isRegistering ? "bg-flow-green text-black shadow-lg" : "text-muted-foreground")}
               >
                 Login
               </button>
               <button 
                 onClick={() => setIsRegistering(true)}
                 className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", isRegistering ? "bg-white text-black shadow-lg" : "text-muted-foreground")}
               >
                 Register
               </button>
             </div>
          </div>

          {!isRegistering ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Username / Email</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={emailOrUser}
                    onChange={(e) => setEmailOrUser(e.target.value)}
                    placeholder="Enter username"
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
                    placeholder="••••••••"
                    className="bg-black/20 border-white/10 h-12 pl-10 rounded-xl focus:border-flow-green/50 focus:ring-0"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-flow-red text-xs bg-flow-red/10 p-3 rounded-lg border border-flow-red/20 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 bg-flow-green text-black font-bold text-base hover:bg-flow-green/90 rounded-xl mt-4 shadow-[0_0_20px_rgba(50,215,75,0.2)] disabled:opacity-50"
                data-testid="button-login"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              {successMsg ? (
                <div className="text-center py-8 space-y-3">
                   <div className="w-16 h-16 bg-flow-green/20 text-flow-green rounded-full flex items-center justify-center mx-auto mb-4">
                     <User className="w-8 h-8" />
                   </div>
                   <h3 className="text-xl font-bold text-white">Registration Sent!</h3>
                   <p className="text-muted-foreground text-sm">{successMsg}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input value={regName} onChange={e => setRegName(e.target.value)} placeholder="Full Name" className="bg-black/20 border-white/10" />
                    <Input value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="Phone (Opt)" className="bg-black/20 border-white/10" />
                  </div>
                  <Input value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="Email Address" type="email" className="bg-black/20 border-white/10" />
                  <Input value={regUser} onChange={e => setRegUser(e.target.value)} placeholder="Choose Username" className="bg-black/20 border-white/10" />
                  
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Establishment</label>
                     <Select value={regEstablishment} onValueChange={(v: Establishment) => setRegEstablishment(v)}>
                        <SelectTrigger className="bg-black/20 border-white/10 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1C1C1E] border-white/10 text-white">
                          <SelectItem value="Bison Den">Bison Den</SelectItem>
                          <SelectItem value="Trailblazer Café">Trailblazer Café</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input value={regPass} onChange={e => setRegPass(e.target.value)} placeholder="Password" type="password" className="bg-black/20 border-white/10" />
                    <Input value={regConfirmPass} onChange={e => setRegConfirmPass(e.target.value)} placeholder="Confirm" type="password" className="bg-black/20 border-white/10" />
                  </div>

                  {error && (
                    <div className="text-flow-red text-xs p-2 text-center font-bold">
                      {error}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-11 bg-white text-black font-bold hover:bg-white/90 rounded-xl mt-2 disabled:opacity-50"
                    data-testid="button-register"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </>
              )}
            </form>
          )}

          <div className="mt-8 text-center border-t border-white/5 pt-4">
             <p className="text-[10px] text-muted-foreground">
               {isRegistering ? "Wait for manager approval after registering." : "Admin Login: admin / password123"}
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
