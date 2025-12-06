import { useState } from 'react';
import Layout from '@/components/Layout';
import { useStore, UserRole, User } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Shield, User as UserIcon, ShieldCheck, Check, X, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Employees() {
  const { users, currentUser, updateUser, removeUser, approveUser, rejectUser, updateUserRole } = useStore();
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  
  // Edit State
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("employee");

  // Approval State
  const [approvingUser, setApprovingUser] = useState<User | null>(null);
  const [approvalRole, setApprovalRole] = useState<UserRole>("employee");

  const canManage = currentUser?.role === 'manager';
  
  // Filter users by establishment and status
  const myUsers = users.filter(u => u.establishment === currentUser?.establishment);
  const activeUsers = myUsers.filter(u => u.status === 'active');
  const pendingUsers = myUsers.filter(u => u.status === 'pending');

  const startEdit = (user: User) => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditingUser(user.id);
  };

  const saveEdit = () => {
    if (editingUser) {
      updateUser(editingUser, { name: editName, email: editEmail });
      if (canManage) {
        updateUserRole(editingUser, editRole);
      }
      setEditingUser(null);
    }
  };

  const handleApprove = () => {
    if (approvingUser) {
      approveUser(approvingUser.id, approvalRole);
      setApprovingUser(null);
    }
  };

  return (
    <Layout title="Employees">
      {/* Tab Switcher */}
      {canManage && (
        <div className="flex p-1 bg-white/5 rounded-xl mb-6 relative">
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all relative z-10",
              activeTab === 'active' ? "text-white" : "text-muted-foreground"
            )}
          >
            Active Team
            {activeTab === 'active' && <motion.div layoutId="tab" className="absolute inset-0 bg-white/10 rounded-lg -z-10" />}
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={cn(
              "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all relative z-10 flex items-center justify-center gap-2",
              activeTab === 'pending' ? "text-white" : "text-muted-foreground"
            )}
          >
            Approvals
            {pendingUsers.length > 0 && (
              <span className="bg-flow-red text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingUsers.length}</span>
            )}
            {activeTab === 'pending' && <motion.div layoutId="tab" className="absolute inset-0 bg-white/10 rounded-lg -z-10" />}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {activeTab === 'active' ? (
          activeUsers.map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card rounded-[20px] p-4 border border-white/[0.04] flex items-center gap-4 relative group"
            >
              {canManage && user.id !== currentUser?.id && (
                <button 
                  onClick={(e) => { e.stopPropagation(); removeUser(user.id); }}
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
                  <span className="text-xs text-muted-foreground">{user.username}</span>
                </div>
              </div>

              {(canManage || (currentUser?.role === 'lead' && user.role === 'employee')) && (
                 <Button size="icon" variant="ghost" onClick={() => startEdit(user)} className="rounded-full h-8 w-8 text-muted-foreground hover:text-white">
                   <Edit2 className="w-4 h-4" />
                 </Button>
              )}
            </motion.div>
          ))
        ) : (
          // PENDING APPROVALS VIEW
          pendingUsers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No pending approvals.</div>
          ) : (
            pendingUsers.map((user, idx) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-[20px] p-5 border border-flow-yellow/20 relative"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-flow-yellow/10 border border-flow-yellow/30 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-flow-yellow" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-[17px]">{user.name}</h3>
                    <p className="text-xs text-muted-foreground">Requesting access to <span className="text-white">{user.establishment}</span></p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => rejectUser(user.id)}
                    variant="outline" 
                    className="flex-1 border-flow-red/30 text-flow-red hover:bg-flow-red/10 hover:text-flow-red h-10 rounded-xl"
                  >
                    Reject
                  </Button>
                  <Button 
                    onClick={() => setApprovingUser(user)}
                    className="flex-1 bg-flow-green text-black font-bold hover:bg-flow-green/90 h-10 rounded-xl"
                  >
                    Approve
                  </Button>
                </div>
              </motion.div>
            ))
          )
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Full Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-black/20 border-white/10" />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Email</label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="bg-black/20 border-white/10" />
            </div>

            {canManage && (
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Role</label>
                <Select value={editRole} onValueChange={(val: UserRole) => setEditRole(val)}>
                  <SelectTrigger className="bg-black/20 border-white/10">
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1C1C1E] border-white/10 text-white">
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={saveEdit} className="w-full bg-blue-500 text-white font-bold hover:bg-blue-600">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={!!approvingUser} onOpenChange={() => setApprovingUser(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Approve {approvingUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">Select a role for this new user. They will be granted access immediately.</p>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Assign Role</label>
              <Select value={approvalRole} onValueChange={(val: UserRole) => setApprovalRole(val)}>
                <SelectTrigger className="bg-black/20 border-white/10 h-12">
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1C1E] border-white/10 text-white">
                  <SelectItem value="employee">Employee (Standard)</SelectItem>
                  <SelectItem value="lead">Lead (Supervisor)</SelectItem>
                  <SelectItem value="manager">Manager (Admin)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleApprove} className="w-full bg-flow-green text-black font-bold hover:bg-flow-green/90 h-12 rounded-xl">
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
