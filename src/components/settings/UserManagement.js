import React, { useState, useEffect } from 'react';
import { Save, ShieldCheck, Trash2, UserPlus, Pencil, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { useAuth } from '../../context/AuthContext';
import { decryptAES } from 'src/utils/crypto';
import { toast } from 'sonner';

export const DEFAULT_USERS = [];

const EMPTY_USER = {
  userName: '',
  password: '',
  roleID: '',
  isActive: true,
};

const STATUS_OPTIONS = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
];

const inputClass =
  'w-full bg-ot-bg-top/50 border border-ot-border/50 text-white rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-ot-action-top transition-all';

// Form mode: null = hidden, 'add' = adding new user, 'edit' = editing existing
function UserManagement({ initialUsers = [], onRefresh }) {
  const { role: loggedInRole, isAdmin, availableRoles, rolesList } = useAuth();

  // Map incoming list from dicomdetails (decrypt password + resolve roleName)
  const mapUsers = (rawList) =>
    rawList.map((u) => {
      const roleObj = rolesList.find((r) => r.roleID === u.roleID);
      return {
        ...u,
        password: decryptAES(u.password),
        roleName: roleObj ? roleObj.roleName : 'Unknown',
      };
    });

  const [users, setUsers] = useState(() => mapUsers(initialUsers));

  // Re-map whenever the parent passes a fresh list
  useEffect(() => {
    setUsers(mapUsers(initialUsers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUsers, rolesList]);

  const roleOptions = (rolesList || []).map((r) => ({
    label: r.roleName,
    value: r.roleID,
  }));

  // ── form state ────────────────────────────────────────────
  const [formMode, setFormMode] = useState(null); // null | 'add' | 'edit'
  const [editingUserId, setEditingUserId] = useState(null);
  const [formDraft, setFormDraft] = useState(EMPTY_USER);
  const [confirmation, setConfirmation] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  /* ── open Add form ───────────────────────────────────── */
  const openAddForm = () => {
    setFormMode('add');
    setEditingUserId(null);
    setFormDraft({ ...EMPTY_USER, roleID: rolesList[0]?.roleID || '' });
    setShowPassword(false);
  };

  /* ── open Edit form (pre-filled) ─────────────────────── */
  const openEditForm = (user) => {
    if (!isAdmin) return;
    setFormMode('edit');
    setEditingUserId(user.userID);
    setFormDraft({
      userName: user.userName,
      password: user.password,
      roleID: user.roleID,
      isActive: user.isActive,
    });
    setShowPassword(false);
  };

  /* ── cancel / close form ─────────────────────────────── */
  const handleCancel = () => {
    setFormMode(null);
    setEditingUserId(null);
    setFormDraft(EMPTY_USER);
  };

  /* ── save form (add or edit) ─────────────────────────── */
  const handleSave = () => {
    const userName = formDraft.userName.trim();
    const password = formDraft.password.trim();

    if (!userName || !password) {
      toast.error('Please fill in Username and Password');
      return;
    }

    if (formMode === 'add') {
      setConfirmation({
        title: 'Add New User',
        message: `Add user "${userName}" to the system?`,
        confirmLabel: 'Add User',
        tone: 'primary',
        onConfirm: async () => {
          try {
            const response = await api.post('/user/adduser', {
              userName,
              password,
              roleID: parseInt(formDraft.roleID),
              isActive: formDraft.isActive,
            });
            const result = response.data;
            if (result.success) {
              handleCancel();
              toast.success('User added successfully');
              onRefresh?.();
            } else {
              toast.error(result.message || 'Failed to add user');
            }
          } catch (error) {
            console.error('Error adding user:', error);
            toast.error(error?.response?.data?.message || error.message || 'An error occurred while adding the user');
          }
        },
      });
    } else {
      setConfirmation({
        title: 'Save User Changes',
        message: `Save changes to "${userName}"?`,
        confirmLabel: 'Save Changes',
        tone: 'primary',
        onConfirm: async () => {
          try {
            const response = await api.put('/user/updateuser', {
              userID: editingUserId,
              userName,
              password,
              roleID: parseInt(formDraft.roleID),
              isActive: formDraft.isActive,
            });
            const result = response.data;
            if (result.success) {
              handleCancel();
              onRefresh?.();
              toast.success('User updated successfully');
            } else {
              toast.error(result.message || 'Failed to update user');
            }
          } catch (error) {
            console.error('Error updating user:', error);
            toast.error(error?.response?.data?.message || error.message || 'An error occurred while updating the user');
          }
        },
      });
    }
  };

  /* ── delete ──────────────────────────────────────────── */
  const deleteUser = (user) => {
    if (!isAdmin) return;
    setConfirmation({
      title: 'Delete User',
      message: `Are you sure you want to delete "${user.userName}"?`,
      confirmLabel: 'Delete User',
      tone: 'danger',
      onConfirm: async () => {
        try {
          const response = await api.delete(`/user/deleteuser/${user.userID}`);
          const result = response.data;
          if (result.success) {
            onRefresh?.();
            toast.success('User deleted successfully');
          } else {
            toast.error(result.message || 'Failed to delete user');
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          toast.error(error?.response?.data?.message || error.message || 'An error occurred while deleting the user');
        }
      },
    });
  };

  const closeConfirmation = () => setConfirmation(null);
  const confirmAction = () => {
    confirmation?.onConfirm();
    closeConfirmation();
  };

  return (
    <div className="space-y-5">

      {/* ── TOP BAR: heading + Add User button ───────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-white tracking-tight">User Management</h3>
          <p className="text-xs text-ot-text-muted mt-1">Manage application users and access levels.</p>
        </div>
        {isAdmin && !formMode && (
          <Button
            type="button"
            onClick={openAddForm}
            className="action-button h-11 rounded-xl px-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-ot-action-top/20"
          >
            <UserPlus size={16} />
            Add User
          </Button>
        )}
      </div>

      {/* ── ADD / EDIT FORM PANEL ─────────────────────────── */}
      {formMode && (
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-ot-border/20 bg-ot-bg-mid/30 p-5 backdrop-blur-sm md:grid-cols-2">
          {/* Username */}
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] uppercase tracking-widest text-ot-text-muted font-bold ml-1">
              Username
            </Label>
            <Input
              className={inputClass}
              placeholder="e.g. john_doe"
              value={formDraft.userName}
              onChange={(e) => setFormDraft((prev) => ({ ...prev, userName: e.target.value }))}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] uppercase tracking-widest text-ot-text-muted font-bold ml-1">
              Password
            </Label>
            <div className="relative">
              <Input
                className={cn(inputClass, 'pr-12')}
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                value={formDraft.password}
                onChange={(e) => setFormDraft((prev) => ({ ...prev, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ot-text-muted hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] uppercase tracking-widest text-ot-text-muted font-bold ml-1">
              Role
            </Label>
            <Select
              value={String(formDraft.roleID)}
              onValueChange={(val) => setFormDraft((prev) => ({ ...prev, roleID: val }))}
            >
              <SelectTrigger className="w-full bg-ot-bg-top/50 border border-ot-border/50 text-white rounded-xl h-10 px-4 text-xs font-bold uppercase tracking-widest hover:border-ot-action-top/50 focus:ring-1 focus:ring-ot-action-top">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-ot-bg-mid border border-ot-border/50 rounded-xl text-white z-[9999] backdrop-blur-2xl">
                {roleOptions.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={String(opt.value)}
                    className="text-xs uppercase tracking-widest cursor-pointer focus:bg-ot-action-top/10 focus:text-white"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] uppercase tracking-widest text-ot-text-muted font-bold ml-1">
              Status
            </Label>
            <Select
              value={String(formDraft.isActive)}
              onValueChange={(val) =>
                setFormDraft((prev) => ({ ...prev, isActive: val === 'true' }))
              }
            >
              <SelectTrigger className="w-full bg-ot-bg-top/50 border border-ot-border/50 text-white rounded-xl h-10 px-4 text-xs font-bold uppercase tracking-widest hover:border-ot-action-top/50 focus:ring-1 focus:ring-ot-action-top">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-ot-bg-mid border border-ot-border/50 rounded-xl text-white z-[9999] backdrop-blur-2xl">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem
                    key={String(opt.value)}
                    value={String(opt.value)}
                    className="text-xs uppercase tracking-widest cursor-pointer focus:bg-ot-action-top/10 focus:text-white"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Form action buttons */}
          <div className="flex justify-end gap-3 md:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="h-10 rounded-xl border-ot-border bg-transparent px-4 text-xs font-bold uppercase tracking-wider text-ot-text-muted hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!formDraft.userName.trim() || !formDraft.password.trim()}
              className="h-10 rounded-xl bg-ot-action-top px-5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40"
            >
              {formMode === 'edit' ? 'Save Changes' : 'Add User'}
            </Button>
          </div>
        </div>
      )}

      {/* ── TABLE ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-ot-border/40 bg-ot-bg-top/20">
        <Table className="text-sm">
          <TableHeader className="border-b border-ot-border/40 bg-ot-bg-top/50">
            <TableRow className="border-ot-border/40 hover:bg-transparent">
              {['Username', 'Password', 'Role', 'Status', 'Edit', 'Delete'].map((heading) => (
                <TableHead
                  key={heading}
                  className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-ot-text-muted"
                >
                  {heading}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.userID}
                className={cn(
                  'border-ot-border/20 hover:bg-white/[0.03]',
                  editingUserId === user.userID && 'bg-ot-action-top/5'
                )}
              >
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-2 font-bold text-white">
                    {user.protected && <ShieldCheck size={15} className="text-ot-action-top" />}
                    {user.userName}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span className="text-ot-text-muted tracking-widest">***</span>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span className="text-white/80 capitalize">{user.roleName}</span>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border',
                      user.isActive
                        ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
                        : 'border-white/15 bg-white/5 text-white/45'
                    )}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                {/* Edit */}
                <TableCell className="px-4 py-3">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => openEditForm(user)}
                    title={!isAdmin ? 'Actions restricted' : 'Edit user'}
                    disabled={!isAdmin}
                    className="h-8 w-8 rounded-lg bg-white/5 text-ot-text-muted hover:bg-white/10 hover:text-ot-action-top disabled:opacity-35"
                  >
                    <Pencil size={15} />
                  </Button>
                </TableCell>
                {/* Delete */}
                <TableCell className="px-4 py-3">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteUser(user)}
                    title={!isAdmin ? 'Delete restricted' : 'Delete user'}
                    disabled={!isAdmin}
                    className="h-8 w-8 rounded-lg bg-red-500/10 text-red-200 hover:bg-red-500/20 disabled:opacity-35"
                  >
                    <Trash2 size={15} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── ALERT DIALOG ─────────────────────────────────── */}
      <AlertDialog open={!!confirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmation?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmation?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmation}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={cn(
                confirmation?.tone === 'danger'
                  ? 'bg-red-500/80 hover:bg-red-500'
                  : 'bg-ot-action-top hover:bg-ot-action-top/90'
              )}
            >
              {confirmation?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default UserManagement;
