import { useState } from 'react';
import Layout from '@/components/Layout';
import { useStore, type UserRole, type User } from '@/lib/store';
import { useUsers, usePendingUsers, useApproveUser, useRejectUser, useUpdateUser, useRemoveUser, useCreateUser } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, Shield, User as UserIcon, ShieldCheck, Clock, UserPlus, Building, Mail, Phone, AlertTriangle, UserX, KeyRound } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Employees() {
  const { currentUser } = useStore();
  const { data: allUsers = [] } = useUsers();
  const { data: pendingUsersData = [] } = usePendingUsers();
  const approveMutation = useApproveUser();
  const rejectMutation = useRejectUser();
  const updateMutation = useUpdateUser();
  const removeMutation = useRemoveUser();
  const createUserMutation = useCreateUser();
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  
  // User Details State (tapping a user opens this)
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Edit State
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("employee");

  // Approval State
  const [approvingUser, setApprovingUser] = useState<User | null>(null);
  const [approvalRole, setApprovalRole] = useState<UserRole>("employee");

  // Create User State (Admin only)
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("employee");
  const [newUserEstablishment, setNewUserEstablishment] = useState("");

  const isAdmin = currentUser?.isSystemAdmin === true;
  const canManage = currentUser?.role === 'manager' || isAdmin;
  
  // For Admin: show all users across all establishments
  // For Manager/Lead: show only users from their establishment
  const filteredUsers = isAdmin ? allUsers : allUsers.filter(u => u.establishment === currentUser?.establishment);
  const activeUsers = filteredUsers.filter(u => u.status === 'active');
  const pendingUsers = isAdmin ? pendingUsersData : pendingUsersData.filter(u => u.establishment === currentUser?.establishment);

  const startEdit = (user: User) => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditingUser(user.id);
  };

  const saveEdit = () => {
    if (editingUser) {
      updateMutation.mutate({ 
        id: editingUser, 
        updates: { 
          name: editName, 
          email: editEmail,
          role: editRole
        } 
      });
      setEditingUser(null);
    }
  };

  const handleApprove = () => {
    if (approvingUser) {
      approveMutation.mutate({ id: approvingUser.id, role: approvalRole });
      setApprovingUser(null);
    }
  };

  const handleCreateUser = () => {
    if (newUserName && newUserUsername && newUserEmail && newUserPassword && newUserRole && newUserEstablishment) {
      createUserMutation.mutate({
        name: newUserName,
        username: newUserUsername,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        establishment: newUserEstablishment
      }, {
        onSuccess: () => {
          setShowCreateUser(false);
          setNewUserName("");
          setNewUserUsername("");
          setNewUserEmail("");
          setNewUserPassword("");
          setNewUserRole("employee");
          setNewUserEstablishment("");
        }
      });
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
              onClick={() => setSelectedUser(user)}
              className="bg-card rounded-[20px] p-4 border border-white/[0.04] flex items-center gap-4 relative cursor-pointer hover:bg-white/[0.02] transition-colors"
              data-testid={`user-card-${user.id}`}
            >
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
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
                  {isAdmin && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {user.establishment}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-muted-foreground">
                <Edit2 className="w-4 h-4" />
              </div>
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
                    onClick={() => rejectMutation.mutate(user.id)}
                    variant="outline" 
                    className="flex-1 border-flow-red/30 text-flow-red hover:bg-flow-red/10 hover:text-flow-red h-10 rounded-xl"
                    data-testid={`button-reject-${user.id}`}
                  >
                    Reject
                  </Button>
                  <Button 
                    onClick={() => {
                      setApprovalRole("employee");
                      setApprovingUser(user);
                    }}
                    className="flex-1 bg-flow-green text-black font-bold hover:bg-flow-green/90 h-10 rounded-xl"
                    data-testid={`button-approve-${user.id}`}
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

      {/* Create User Dialog (Admin Only) */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Full Name</label>
              <Input 
                value={newUserName} 
                onChange={(e) => setNewUserName(e.target.value)} 
                className="bg-black/20 border-white/10" 
                placeholder="John Doe"
                data-testid="input-new-user-name"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Username</label>
              <Input 
                value={newUserUsername} 
                onChange={(e) => setNewUserUsername(e.target.value)} 
                className="bg-black/20 border-white/10" 
                placeholder="johndoe"
                data-testid="input-new-user-username"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Email</label>
              <Input 
                value={newUserEmail} 
                onChange={(e) => setNewUserEmail(e.target.value)} 
                className="bg-black/20 border-white/10" 
                placeholder="john@example.com"
                data-testid="input-new-user-email"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Password</label>
              <Input 
                type="password"
                value={newUserPassword} 
                onChange={(e) => setNewUserPassword(e.target.value)} 
                className="bg-black/20 border-white/10" 
                placeholder="••••••••"
                data-testid="input-new-user-password"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Role</label>
              <Select value={newUserRole} onValueChange={(val: UserRole) => setNewUserRole(val)}>
                <SelectTrigger className="bg-black/20 border-white/10" data-testid="select-new-user-role">
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1C1E] border-white/10 text-white">
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Establishment</label>
              <Select value={newUserEstablishment} onValueChange={setNewUserEstablishment}>
                <SelectTrigger className="bg-black/20 border-white/10" data-testid="select-new-user-establishment">
                  <SelectValue placeholder="Select establishment..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1C1E] border-white/10 text-white">
                  <SelectItem value="Bison Den">Bison Den</SelectItem>
                  <SelectItem value="Trailblazer Café">Trailblazer Café</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleCreateUser} 
              disabled={!newUserName || !newUserUsername || !newUserEmail || !newUserPassword || !newUserRole || !newUserEstablishment || createUserMutation.isPending}
              className="w-full bg-flow-green text-black font-bold hover:bg-flow-green/90 h-12 rounded-xl disabled:opacity-50"
              data-testid="button-create-user-submit"
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              View and manage user information
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-4 mb-6">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2",
                  selectedUser.role === 'manager' ? "bg-purple-500/20 border-purple-500 text-purple-500" :
                  selectedUser.role === 'lead' ? "bg-blue-500/20 border-blue-500 text-blue-500" :
                  "bg-white/5 border-white/10 text-muted-foreground"
                )}>
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedUser.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1",
                      selectedUser.role === 'manager' ? "bg-purple-500/10 text-purple-400" :
                      selectedUser.role === 'lead' ? "bg-blue-500/10 text-blue-400" :
                      "bg-white/5 text-muted-foreground"
                    )}>
                      {selectedUser.role === 'manager' && <ShieldCheck className="w-3 h-3" />}
                      {selectedUser.role === 'lead' && <Shield className="w-3 h-3" />}
                      {selectedUser.role === 'employee' && <UserIcon className="w-3 h-3" />}
                      {selectedUser.role}
                    </span>
                    <span className="text-xs text-muted-foreground">@{selectedUser.username}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Email</p>
                    <p className="text-white">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Building className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Establishment</p>
                    <p className="text-white">{selectedUser.establishment}</p>
                  </div>
                </div>
              </div>

              {canManage && selectedUser.id !== currentUser?.id && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold mb-3">Actions</p>
                  
                  <Button 
                    onClick={() => { setSelectedUser(null); startEdit(selectedUser); }}
                    variant="ghost" 
                    className="w-full justify-start h-12 text-white hover:bg-white/5"
                    data-testid={`button-edit-user-${selectedUser.id}`}
                  >
                    <Edit2 className="w-5 h-5 mr-3 text-blue-400" />
                    Edit Role & Information
                  </Button>
                  
                  <Button 
                    onClick={() => { setShowDeleteConfirm(true); }}
                    variant="ghost" 
                    className="w-full justify-start h-12 text-flow-red hover:bg-flow-red/10 hover:text-flow-red"
                    data-testid={`button-delete-user-${selectedUser.id}`}
                  >
                    <Trash2 className="w-5 h-5 mr-3" />
                    Delete User
                  </Button>
                </div>
              )}
              
              {selectedUser.id === currentUser?.id && (
                <p className="text-center text-muted-foreground text-sm py-4">This is your account.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-[#1C1C1E] border-white/10 text-white w-[90%] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-flow-red">
              <AlertTriangle className="w-5 h-5" />
              Delete User?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete <span className="text-white font-semibold">{selectedUser?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="bg-white/10 border-0 text-white hover:bg-white/20">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (selectedUser) {
                  removeMutation.mutate(selectedUser.id);
                  setSelectedUser(null);
                  setShowDeleteConfirm(false);
                }
              }}
              className="bg-flow-red text-white hover:bg-flow-red/90 border-0"
              data-testid="button-confirm-delete"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating Create User Button (Admin Only) */}
      {isAdmin && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCreateUser(true)}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-flow-green flex items-center justify-center shadow-lg shadow-flow-green/30"
          data-testid="button-create-user"
        >
          <UserPlus className="w-6 h-6 text-black" />
        </motion.button>
      )}
    </Layout>
  );
}
