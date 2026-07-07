import React, { useState } from 'react';
import { toast } from 'sonner';
import { Cpu, HardDrive, Activity, Disc } from 'lucide-react';
import { getTemplates, getTemplate } from '../../utils/templateApi';
import { restoreElementsFromTemplate } from '../cd-studio/CDDesignStudio';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import Lottie from 'lottie-react';
import emoji_u1F525 from "../../assets/fire.json";

const MEDIA_TYPES = [
  { label: 'CD-R / 700MB', value: 'CD-R' },
  { label: 'DVD-R / 4.7GB', value: 'DVD-R' },
  { label: 'USB Export', value: 'USB' },
];

const ACTIVE_TEMPLATE_KEY = 'raster_active_burn_template';
const CD_TEMPLATE_STORAGE_KEY = 'raster_cd_label_templates';

function BottomStatus({ settings, selectedStudies = [], onExecuteBurn }) {
  const [mediaType, setMediaType] = useState('CD-R');

  const usage = settings?.maxDiscUsage || 62;

  const [burning, setBurning] = useState(false);

  const handleExecuteBurn = async () => {
    if (selectedStudies.length === 0) {
      toast.warning('Please select at least one study to burn.');
      return;
    }

    try {
      setBurning(true);
      const res = await getTemplates();
      const allTemplates = Array.isArray(res) ? res : (res?.data || res?.items || []);
      const defaultTemp = allTemplates.find(t => t.isDefault === true);
      
      let template = null;
      if (defaultTemp && defaultTemp.id) {
         template = await getTemplate(defaultTemp.id);
         template.elements = restoreElementsFromTemplate(template);
      } else {
         toast.warning('No default template found on the server.');
         return;
      }
      
      onExecuteBurn?.(template);
    } catch (err) {
      console.error('Failed to load default template', err);
      toast.error(err?.response?.data?.message || err.message || 'Failed to fetch default template from server.');
    } finally {
      setBurning(false);
    }
  };

  return (
    <div className="glass-card mt-auto p-3 sm:p-4 flex flex-wrap items-center gap-4 md:gap-8 bg-ot-bg-bottom/80 border-t border-ot-border/30 animate-in slide-in-from-bottom-4 duration-500 backdrop-blur-2xl overflow-visible relative z-[600]">
      {/* Meters Section */}
      <div className="flex gap-4 md:gap-8 flex-1 min-w-[200px] md:min-w-[300px]">
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-ot-text-muted uppercase tracking-[0.15em]">
            <span className="flex items-center gap-1.5"><Cpu size={14} className="text-ot-action-top" /> CPU Load</span>
            <span className="text-white/80">95%</span>
          </div>
          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden p-[1px] border border-white/5">
            <div className="h-full bg-orange-500 rounded-full relative overflow-hidden" style={{ width: '95%' }}>
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-ot-text-muted uppercase tracking-[0.15em]">
            <span className="flex items-center gap-1.5"><Activity size={14} className="text-emerald-400" /> RAM Metrics</span>
            <span className="text-white/80">20.41 MB</span>
          </div>
          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden p-[1px] border border-white/5">
            <div className="h-full bg-emerald-500 rounded-full relative overflow-hidden" style={{ width: '36%' }}>
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Disk Section */}
      <div className="flex flex-col gap-2 flex-[2] min-w-[200px] md:min-w-[350px]">
        <div className="flex justify-between items-center text-[10px] font-bold text-ot-text-muted uppercase tracking-[0.15em]">
          <span className="flex items-center gap-1.5"><HardDrive size={14} className="text-ot-action-top" /> Publisher: 400 Series</span>
          <span className="text-ot-action-top drop-shadow-[0_0_5px_rgba(95,166,255,0.5)]">{usage}% Capacity</span>
        </div>
        <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px]">
          <div
            className="h-full bg-ot-gradient-action transition-all duration-1000 rounded-full relative"
            style={{ width: `${usage}%` }}
          >
            <div className="absolute inset-0 bg-white/10 animate-pulse" />
          </div>
        </div>
        <div className="flex justify-between text-[9px] font-bold text-ot-text-muted/60 px-1 tracking-widest uppercase text-[8px]">
          <span>VOL: {settings?.drive || 'C:'}</span>
          <span>EST. REMAINING: {(650.39 * (1 - usage / 100)).toFixed(2)} MB</span>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex items-center gap-4 relative">
        <div className="w-[180px] relative z-[700]">
          <label className="text-[9px] uppercase font-bold text-ot-text-muted/50 mb-1.5 block tracking-widest text-center">Output Media</label>
          <Select value={mediaType} onValueChange={setMediaType}>
            <SelectTrigger className="w-full bg-ot-bg-top/50 border border-ot-border/50 text-white rounded-xl h-11 px-4 text-xs font-bold uppercase tracking-widest hover:border-ot-action-top/50 focus:ring-1 focus:ring-ot-action-top data-[state=open]:border-ot-action-top">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              side="top"
              className="bg-ot-bg-mid border border-ot-border/50 rounded-xl text-white z-[9999] backdrop-blur-2xl"
            >
              {MEDIA_TYPES.map((opt) => (
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

        <div className="h-12 w-[1px] bg-white/10" />

        <div className="flex items-center group cursor-pointer" onClick={handleExecuteBurn}>
          {/* Segregated Ignition Engine */}
          <div className="relative z-20 -mr-4">
            <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse-slow" />
            <div className="relative h-14 w-14 bg-[#1a1a1a]/80 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(251,146,60,0.2)] group-hover:border-orange-500/50 group-hover:shadow-[0_0_30px_rgba(251,146,60,0.3)] transition-all duration-500">
              <Lottie
                animationData={emoji_u1F525}
                loop={settings?.enableBurnAnimation !== false}
                className="w-10 h-10 drop-shadow-[0_0_10px_rgba(255,77,0,0.8)]"
              />
            </div>
          </div>

          {/* Main Action Button */}
          <Button
            disabled={burning}
            className="relative pl-8 pr-10 h-[48px] bg-gradient-to-r from-orange-600 to-red-600 rounded-r-full rounded-l-[10px] border border-white/10 shadow-lg group-active:scale-95 transition-all duration-300 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-start leading-none">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white">
                {burning ? 'Preparing...' : 'Execute Burn'}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Secured Mission #4512</span>
                <Disc className="animate-spin-slow text-white/40" size={12} />
              </div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BottomStatus;
