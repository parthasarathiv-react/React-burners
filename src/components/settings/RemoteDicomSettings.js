import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, BadgeCheck, ServerCog, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
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

const STATUS_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

const VERIFIED_OPTIONS = [
  { label: 'Verified', value: 'true' },
  { label: 'Unverified', value: 'false' },
];

const EMPTY_FORM = {
  aeTitle: '',
  hostIPAddress: '',
  hostPort: '',
  description: '',
  isActive: true,
  isVerified: false,
};

function RemoteDicomSettings() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingServer, setEditingServer] = useState(null); // holds the server being edited
  const [serverForm, setServerForm] = useState(EMPTY_FORM);
  const [savingForm, setSavingForm] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [echoStatus, setEchoStatus] = useState({}); // { [remoteDicomID]: 'loading' | 'success' | 'fail' }

  /* ── fetch remote DICOM list ─────────────────────────── */
  const fetchServers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/dicomdetails');
      if (res.data?.success) {
        setServers(res.data.data?.remoteDicomList ?? []);
      } else {
        toast.error(res.data?.message || 'Failed to fetch remote DICOM servers.');
      }
    } catch (err) {
      console.error('Fetch remote DICOM error:', err);
      toast.error('Could not load remote DICOM servers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  /* ── helpers ─────────────────────────────────────────── */
  const closeConfirmation = () => setConfirmation(null);
  const confirmAction = () => { confirmation?.onConfirm(); closeConfirmation(); };

  const resetForm = () => {
    setIsAdding(false);
    setEditingServer(null);
    setServerForm(EMPTY_FORM);
  };

  /* ── save (add / edit) ───────────────────────────────── */
  const handleSave = async () => {
    if (!serverForm.aeTitle || !serverForm.hostIPAddress || !serverForm.hostPort) {
      toast.error('AE Title, Host IP and Port are required.');
      return;
    }

    const isEdit = editingServer !== null;

    setConfirmation({
      title: isEdit ? 'Save Server Changes' : 'Add New Server',
      message: isEdit
        ? `Save changes to "${serverForm.aeTitle}"?`
        : `Add "${serverForm.aeTitle}" to the remote DICOM list?`,
      confirmLabel: isEdit ? 'Save Changes' : 'Add Server',
      tone: 'primary',
      onConfirm: async () => {
        try {
          setSavingForm(true);
          let res;
          if (isEdit) {
            res = await api.put('/remotedicom/update', {
              ...serverForm,
              remoteDicomID: editingServer.remoteDicomID,
            });
          } else {
            res = await api.post('/remotedicom/add', serverForm);
          }

          if (res.data?.success) {
            toast.success(res.data.message || (isEdit ? 'Server updated.' : 'Server added.'));
            await fetchServers();
            resetForm();
          } else {
            toast.error(res.data?.message || 'Operation failed.');
          }
        } catch (err) {
          console.error('Save remote DICOM error:', err);
          toast.error('An error occurred while saving the server.');
        } finally {
          setSavingForm(false);
        }
      },
    });
  };

  /* ── start edit ──────────────────────────────────────── */
  const handleEdit = (server) => {
    setEditingServer(server);
    setServerForm({
      aeTitle: server.aeTitle,
      hostIPAddress: server.hostIPAddress,
      hostPort: server.hostPort,
      description: server.description,
      isActive: server.isActive,
      isVerified: server.isVerified,
    });
    setIsAdding(true);
  };

  /* ── delete ──────────────────────────────────────────── */
  const handleDelete = (server) => {
    setConfirmation({
      title: 'Delete Server',
      message: `Are you sure you want to delete "${server.aeTitle}"?`,
      confirmLabel: 'Delete Server',
      tone: 'danger',
      onConfirm: async () => {
        try {
          const res = await api.delete(`/remotedicom/delete/${server.remoteDicomID}`);
          if (res.data?.success) {
            toast.success(res.data.message || 'Server deleted.');
            setServers(prev => prev.filter(s => s.remoteDicomID !== server.remoteDicomID));
          } else {
            toast.error(res.data?.message || 'Failed to delete server.');
          }
        } catch (err) {
          console.error('Delete remote DICOM error:', err);
          toast.error('An error occurred while deleting the server.');
        }
      },
    });
  };

  /* ── echo verify (stub – adapt to your actual echo endpoint) ── */
  const handleEchoVerify = async (server) => {
    setEchoStatus(prev => ({ ...prev, [server.remoteDicomID]: 'loading' }));
    try {
      // Replace with your actual echo/verify endpoint if available
      const res = await api.post('/remotedicom/verify', { remoteDicomID: server.remoteDicomID });
      if (res.data?.success) {
        setEchoStatus(prev => ({ ...prev, [server.remoteDicomID]: 'success' }));
        toast.success(`Echo verified: ${server.aeTitle}`);
      } else {
        setEchoStatus(prev => ({ ...prev, [server.remoteDicomID]: 'fail' }));
        toast.error(res.data?.message || 'Echo verification failed.');
      }
    } catch {
      setEchoStatus(prev => ({ ...prev, [server.remoteDicomID]: 'fail' }));
      toast.error(`Failed to verify "${server.aeTitle}".`);
    }
  };

  /* ── render ──────────────────────────────────────────── */
  return (
    <div className="space-y-5 text-white">

      {/* ── TOP BAR ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-white tracking-tight">Remote DICOM Servers</h3>
          <p className="text-xs text-ot-text-muted mt-1">Manage remote DICOM server connections and PACS targets.</p>
        </div>
        {!isAdding && (
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            className="action-button h-11 rounded-xl px-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-ot-action-top/20"
          >
            <ServerCog size={16} />
            Add New Server
          </Button>
        )}
      </div>

      {/* ── ADD / EDIT FORM ─────────────────────────────── */}
      {isAdding && (
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-ot-border/20 bg-ot-bg-mid/30 p-5 backdrop-blur-sm md:grid-cols-2">
          {[
            { label: 'AE Title', key: 'aeTitle', placeholder: 'e.g. TEAMPACS', type: 'text' },
            { label: 'Host IP Address', key: 'hostIPAddress', placeholder: 'e.g. 172.17.1.231', type: 'text' },
            { label: 'Port', key: 'hostPort', placeholder: 'e.g. 11112', type: 'text' },
            { label: 'Description', key: 'description', placeholder: 'e.g. Main PACS Server', type: 'text' },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key} className="flex flex-col gap-2">
              <Label className="text-[10px] uppercase tracking-widest text-ot-text-muted font-bold ml-1">{label}</Label>
              <Input
                type={type}
                className="w-full bg-ot-bg-top/50 border border-ot-border/50 text-white rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-ot-action-top transition-all"
                value={serverForm[key]}
                onChange={(e) => setServerForm(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
              />
            </div>
          ))}

          {/* Status */}
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] uppercase tracking-widest text-ot-text-muted font-bold ml-1">Status</Label>
            <Select
              value={String(serverForm.isActive)}
              onValueChange={(val) => setServerForm(prev => ({ ...prev, isActive: val === 'true' }))}
            >
              <SelectTrigger className="w-full bg-ot-bg-top/50 border border-ot-border/50 text-white rounded-xl h-10 px-4 text-xs font-bold uppercase tracking-widest hover:border-ot-action-top/50 focus:ring-1 focus:ring-ot-action-top">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-ot-bg-mid border border-ot-border/50 rounded-xl text-white z-[9999] backdrop-blur-2xl">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-xs uppercase tracking-widest cursor-pointer focus:bg-ot-action-top/10 focus:text-white"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Verified */}
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] uppercase tracking-widest text-ot-text-muted font-bold ml-1">Verified</Label>
            <Select
              value={String(serverForm.isVerified)}
              onValueChange={(val) => setServerForm(prev => ({ ...prev, isVerified: val === 'true' }))}
            >
              <SelectTrigger className="w-full bg-ot-bg-top/50 border border-ot-border/50 text-white rounded-xl h-10 px-4 text-xs font-bold uppercase tracking-widest hover:border-ot-action-top/50 focus:ring-1 focus:ring-ot-action-top">
                <SelectValue placeholder="Verified" />
              </SelectTrigger>
              <SelectContent className="bg-ot-bg-mid border border-ot-border/50 rounded-xl text-white z-[9999] backdrop-blur-2xl">
                {VERIFIED_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-xs uppercase tracking-widest cursor-pointer focus:bg-ot-action-top/10 focus:text-white"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 md:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={savingForm}
              className="h-10 rounded-xl border-ot-border bg-transparent px-4 text-xs font-bold uppercase tracking-wider text-ot-text-muted hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={savingForm}
              className="h-10 rounded-xl bg-ot-action-top px-5 text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2"
            >
              {savingForm && <Loader2 size={13} className="animate-spin" />}
              {editingServer !== null ? 'Save Changes' : 'Add Server'}
            </Button>
          </div>
        </div>
      )}

      {/* ── TABLE ───────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-ot-border/40 bg-ot-bg-top/20">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="border-b border-ot-border/40 bg-ot-bg-top/50">
            <tr>
              {['AE Title', 'Host IP', 'Port', 'Description', 'Status', 'Edit', 'Delete', 'Echo Verify'].map(h => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-ot-text-muted ${['Status', 'Edit', 'Delete', 'Echo Verify'].includes(h) ? 'text-center' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-ot-text-muted">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Loading servers…
                  </div>
                </td>
              </tr>
            ) : servers.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-ot-text-muted">
                  No remote DICOM servers configured.
                </td>
              </tr>
            ) : (
              servers.map((server) => {
                const echo = echoStatus[server.remoteDicomID];
                return (
                  <tr key={server.remoteDicomID} className="border-ot-border/20 hover:bg-white/[0.03] border-b">
                    <td className="px-4 py-3 font-bold text-white">{server.aeTitle}</td>
                    <td className="px-4 py-3 text-white/80">{server.hostIPAddress}</td>
                    <td className="px-4 py-3 text-white/80">{server.hostPort}</td>
                    <td className="px-4 py-3 text-white/80">{server.description}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          server.isActive
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-red-500/15 text-red-400'
                        )}
                      >
                        {server.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        type="button" size="icon" variant="ghost"
                        onClick={() => handleEdit(server)}
                        title="Edit server"
                        className="h-8 w-8 rounded-lg bg-white/5 text-ot-text-muted hover:bg-white/10 hover:text-ot-action-top"
                      >
                        <Pencil size={15} />
                      </Button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        type="button" size="icon" variant="ghost"
                        onClick={() => handleDelete(server)}
                        title="Delete server"
                        className="h-8 w-8 rounded-lg bg-red-500/10 text-red-200 hover:bg-red-500/20"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        type="button" size="icon" variant="ghost"
                        title="Echo verify"
                        onClick={() => handleEchoVerify(server)}
                        disabled={echo === 'loading'}
                        className={cn(
                          'h-8 w-8 rounded-lg',
                          echo === 'success' && 'bg-green-500/10 text-green-400',
                          echo === 'fail' && 'bg-red-500/10 text-red-400',
                          !echo && 'bg-[#4da6ff]/10 text-[#4da6ff] hover:bg-[#4da6ff]/20',
                        )}
                      >
                        {echo === 'loading' && <Loader2 size={15} className="animate-spin" />}
                        {echo === 'success' && <CheckCircle2 size={15} />}
                        {echo === 'fail' && <XCircle size={15} />}
                        {!echo && <BadgeCheck size={15} />}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── ALERT DIALOG ────────────────────────────────── */}
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

export default RemoteDicomSettings;
