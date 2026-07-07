import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
  X,
  Settings,
  Users,
  Shield,
  Info,
  Settings2,
  CircleDot,
  Globe,
  HardDrive,
  Save,
  Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { settingsTabs } from '../../data/studies';
import UserManagement, { DEFAULT_USERS } from '../settings/UserManagement';
import LocalDicomSettings from '../settings/LocalDicomSettings';
import BravoSetting from '../settings/BravoSetting';
import AdvancedSettings from '../settings/AdvancedSettings';
import AnimationSettings from '../settings/AnimationSettings';
import RemoteDicomSettings from '../settings/RemoteDicomSettings';
import RecorderSettings from '../settings/RecorderSettings';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { toast } from 'sonner';

const SettingsModal = ({ settings: initialSettings, onUpdate, onClose }) => {
  const { role: loggedInRole, isAdmin } = useAuth();

  // Shared DICOM settings from API
  const [dicomSettings, setDicomSettings] = useState(null);
  const [dicomLoading, setDicomLoading] = useState(true);

  const fetchDicomSettings = async () => {
    try {
      setDicomLoading(true);
      const response = await api.get('/settings/dicomdetails');
      if (response.data?.success) {
        setDicomSettings(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch DICOM settings:', err);
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setDicomLoading(false);
    }
  };

  useEffect(() => {
    fetchDicomSettings();
  }, []);

  const [saving, setSaving] = useState(false);

  const handleSaveAndApply = async () => {
    if (!dicomSettings) return;
    try {
      setSaving(true);
      const { localDicom, advanced, recorder } = dicomSettings;
      const payload = {
        localDicom: {
          dicomSettingsID: localDicom?.dicomSettingsID ?? 0,
          AETitle: localDicom?.aeTitle ?? '',
          HostIPAddress: localDicom?.hostIPAddress ?? '',
          HostPort: localDicom?.hostPort ?? '',
          ImageStoragePath: localDicom?.imageStoragePath ?? '',
          Compression: localDicom?.compression ?? 'UnCompressed',
        },
        advanced: {
          isSystemDrive: advanced?.isSystemDrive ?? false,
          isAutoBurn: advanced?.isAutoBurn ?? false,
          isViewExternalDicomViewer: advanced?.isViewExternalDicomViewer ?? false,
          ViewerPath: advanced?.viewerPath ?? '',
        },
        recorder: {
          recorder: recorder?.recorder ?? '',
          burnContentPath: recorder?.burnContentPath ?? '',
        },
      };
      const response = await api.post('/settings/update', payload);
      if (response.data?.success) {
        toast.success('Settings saved successfully.');
        if (onUpdate) onUpdate(formData);
        onClose();
      } else {
        toast.error(response.data?.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Save settings error:', err);
      toast.error(err?.response?.data?.message || err.message || 'An error occurred while saving settings.');
    } finally {
      setSaving(false);
    }
  };

  const [formData, setFormData] = useState({
    ...(initialSettings || {}),
    users: initialSettings?.users?.length ? initialSettings.users : DEFAULT_USERS,
  });
  const rawTabs = settingsTabs;
  const tabs = rawTabs.filter(tab => {
    if (tab === 'User Management' && !isAdmin) return false;
    return true;
  });

  const [activeTab, setActiveTab] = useState(tabs.includes('Local DICOM') ? 'Local DICOM' : tabs[0]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderTabIcon = (index, tab) => {
    if (index === 0) return <HardDrive size={16} />;
    if (index === 1) return <Settings2 size={16} />;
    if (index === 2) return <CircleDot size={18} />;
    if (index === 3) return <Globe size={16} />;
    if (index === 4) return <Users size={18} />;
    if (index === 5) return <Shield size={18} />;
    if (tab === 'Animation') return <Settings size={16} />;
    return <Settings size={16} />;
  };

  const renderActiveTab = () => {
    if (activeTab === 'Local DICOM') {
      if (dicomLoading) return <div className="text-ot-text-muted text-sm">Loading DICOM settings…</div>;
      return (
        <LocalDicomSettings
          formData={dicomSettings?.localDicom || {}}
          onChange={(field, value) =>
            setDicomSettings(prev => ({
              ...prev,
              localDicom: { ...prev?.localDicom, [field]: value },
            }))
          }
        />
      );
    }

    if (activeTab === 'Remote DICOM') {
      return <RemoteDicomSettings />;
    }

    if (activeTab === 'Advanced') {
      if (dicomLoading) return <div className="text-ot-text-muted text-sm">Loading DICOM settings…</div>;
      return (
        <AdvancedSettings
          formData={dicomSettings?.advanced || {}}
          onChange={(field, value) =>
            setDicomSettings(prev => ({
              ...prev,
              advanced: { ...prev?.advanced, [field]: value },
            }))
          }
        />
      );
    }

    if (activeTab === 'Recorder') {
      if (dicomLoading) return <div className="text-ot-text-muted text-sm">Loading DICOM settings…</div>;
      return (
        <RecorderSettings
          formData={dicomSettings?.recorder || {}}
          onChange={(field, value) =>
            setDicomSettings(prev => ({
              ...prev,
              recorder: { ...prev?.recorder, [field]: value },
            }))
          }
        />
      );
    }

    if (activeTab === 'User Management') {
      if (dicomLoading) return <div className="text-ot-text-muted text-sm">Loading users…</div>;
      return (
        <UserManagement
          initialUsers={dicomSettings?.userList || []}
          onRefresh={fetchDicomSettings}
        />
      );
    }

    if (activeTab === 'Bravo') {
      return <BravoSetting />;
    }

    if (activeTab === 'Animation') {
      return <AnimationSettings formData={formData} onChange={handleChange} />;
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="glass-card w-[80%]  h-[80%] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ot-border/50 bg-ot-bg-top/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-ot-action-top/10 border border-ot-action-top/20">
              <Settings className="text-ot-action-top" size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">System Configuration</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-white/10 text-ot-text-muted hover:text-white"
          >
            <X size={24} />
          </Button>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden bg-ot-bg-mid/10">
          {/* Sidebar Tabs */}
          <div className="w-64 border-r border-ot-border/30 bg-ot-bg-top/20 py-4">
            {tabs.map((tab, index) => (
              <Button
                key={tab}
                type="button"
                variant="ghost"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "w-full text-left justify-start px-8 py-4 text-sm font-bold transition-all duration-200 flex items-center gap-3 tracking-wide rounded-none h-auto",
                  activeTab === tab
                    ? "text-white bg-ot-action-top/10 border-r-4 border-ot-action-top hover:bg-ot-action-top/10"
                    : "text-ot-text-muted hover:text-white hover:bg-white/5"
                )}
              >
                {renderTabIcon(index, tab)}
                {tab}
              </Button>
            ))}
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {renderActiveTab()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-ot-border/50 bg-ot-bg-top/40">
          <Button
            type="button"
            onClick={handleSaveAndApply}
            disabled={saving || dicomLoading}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold bg-ot-action-top text-white hover:brightness-110 active:scale-95 transition-all duration-200 shadow-lg shadow-ot-action-top/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : 'Save & Apply'}
          </Button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
