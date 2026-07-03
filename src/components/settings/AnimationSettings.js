import { Label } from '../ui/label';
import { Play } from 'lucide-react';

const AnimationSettings = ({ formData, onChange }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-ot-border/50 pb-4">
                <div className="p-2 rounded-lg bg-ot-action-top/10 border border-ot-action-top/20">
                    <Play className="text-ot-action-top" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">Animation Control</h3>
                    <p className="text-xs text-ot-text-muted mt-1 uppercase tracking-widest">
                        Configure system UI animations
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="glass-card p-6 border border-ot-border/30 bg-black/20 hover:border-ot-border/50 transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="text-sm font-semibold text-white">Execute Burn Animation</Label>
                            <p className="text-xs text-ot-text-muted">
                                Enable or disable the fire engine animation on the Execute Burn button.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={formData.enableBurnAnimation !== false}
                                onChange={(e) => onChange('enableBurnAnimation', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ot-action-top border border-ot-border/50"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimationSettings;
