import { useState } from 'react';
import Layout from '@/components/Layout';
import { useStore, UserRole } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Shield, User as UserIcon, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Employees() {
  const { users, currentUser, addUser, updateUser, deleteUser } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("employee");

  const canManage = currentUser?.role === 'manager';
  const canAdd = currentUser?.role === 'manager' || currentUser?.role === 'lead';

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("employee");
    setIsAdding(false);
    setIsEditing(null);
  };

  const handleSave = () => {
    if (isEditing) {
      updateUser(isEditing, { name, email, role, ...(password ? { password } : {}) });
    } else {
      addUser(name, email, role, password || '123'); // Default password if empty
    }
    resetForm();
  };

  const startEdit = (user: any) => {
    if (!canManage && user.role !== 'employee') return; // Leads can only edit employees
    
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword(""); // Don't show existing password
    setIsEditing(user.id);
  };

  return (
    <Layout 
      title="Employees"
      action={
        canAdd && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAdding(true)}
            className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
          </motion.button>
        )
      }
    >
      <div className="space-y-3">
        {users.map((user, idx) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-card rounded-[20px] p-4 border border-white/[0.04] flex items-center gap-4 relative group"
          >
            {canManage && user.id !== currentUser?.id && (
              <button 
                onClick={(e) => { e.stopPropagation(); deleteUser(user.id); }}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-flow-red opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div className={cn(
               "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2",
               user.role === 'manager' ? "bg-purple-500/20 border-purple-500 text-purple-500" :
               user.role === 'lead' ? "bg-blue-500/20 border-blue-500 text-blue-500" :
               "bg-white/5 border-white/10 text-muted-foreground"
            )}>
              {user.name.charAt(0)}
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-white text-[17px]">{user.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn(
                  "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1",
                  user.role === 'manager' ? "bg-purple-500/10 text-purple-400" :
                  user.role === 'lead' ? "bg-blue-500/10 text-blue-400" :
                  "bg-white/5 text-muted-foreground"
                )}>
                  {user.role === 'manager' && <ShieldCheck className="w-3 h-3" />}
                  {user.role === 'lead' && <Shield className="w-3 h-3" />}
                  {user.role === 'employee' && <UserIcon className="w-3 h-3" />}
                  {user.role}
                </span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>

            {(canManage || (currentUser?.role === 'lead' && user.role === 'employee')) && (
               <Button size="icon" variant="ghost" onClick={() => startEdit(user)} className="rounded-full h-8 w-8 text-muted-foreground hover:text-white">
                 <Edit2 className="w-4 h-4" />
               </Button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Add/Edit User Dialog */}
      <Dialog open={isAdding || !!isEditing} onOpenChange={() => resetForm()}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Full Name</label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="bg-black/20 border-white/10"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Username / Email</label>
              <Input 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john"
                className="bg-black/20 border-white/10"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Role</label>
              <Select 
                value={role} 
                onValueChange={(val: UserRole) => setRole(val)} 
                disabled={!canManage} // Leads cannot change roles
              >
                <SelectTrigger className="bg-black/20 border-white/10">
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1C1E] border-white/10 text-white">
                  <SelectItem value="employee">Employee</SelectItem>
                  {canManage && <SelectItem value="lead">Lead</SelectItem>}
                  {canManage && <SelectItem value="manager">Manager</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Password {isEditing && '(Leave blank to keep)'}</label>
              <Input 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Secure password"
                type="password"
                className="bg-black/20 border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} className="w-full bg-blue-500 text-white font-bold hover:bg-blue-600">Save User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
