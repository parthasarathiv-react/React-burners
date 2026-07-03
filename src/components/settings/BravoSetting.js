import React, { useState, useEffect } from 'react';
import { Check, Disc, Trash2, Layout } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

const CD_TEMPLATE_STORAGE_KEY = 'raster_cd_label_templates';
const ACTIVE_TEMPLATE_KEY = 'raster_active_burn_template';

const BravoSetting = () => {
    const [templates, setTemplates] = useState([]);
    const [activeTemplateId, setActiveTemplateId] = useState('');

    useEffect(() => {
        loadTemplates();
        const active = localStorage.getItem(ACTIVE_TEMPLATE_KEY);
        if (active) setActiveTemplateId(active);
    }, []);

    const loadTemplates = () => {
        try {
            const saved = localStorage.getItem(CD_TEMPLATE_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setTemplates(Array.isArray(parsed) ? parsed : []);
            }
        } catch (e) {
            console.error('Failed to load templates', e);
        }
    };

    const handleSetActive = (id) => {
        setActiveTemplateId(id);
        localStorage.setItem(ACTIVE_TEMPLATE_KEY, id);
    };

    const handleDeleteTemplate = (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;

        const updated = templates.filter(t => t.id !== id);
        setTemplates(updated);
        localStorage.setItem(CD_TEMPLATE_STORAGE_KEY, JSON.stringify(updated));

        if (activeTemplateId === id) {
            setActiveTemplateId('');
            localStorage.removeItem(ACTIVE_TEMPLATE_KEY);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Layout className="text-ot-action-top" size={20} />
                    Label Templates
                </h3>
                <p className="text-ot-text-muted text-sm mb-6">
                    Manage your CD label templates. The active template will be used automatically when burning studies to disc.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.length === 0 ? (
                        <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/5">
                            <Disc size={40} className="mx-auto mb-4 text-white/10" />
                            <p className="text-ot-text-muted font-medium">No custom templates found.</p>
                            <p className="text-xs text-ot-text-muted/60 mt-1">Create templates in the CD Design Studio first.</p>
                        </div>
                    ) : (
                        templates.map((template) => (
                            <div
                                key={template.id}
                                className={cn(
                                    "relative p-5 rounded-2xl border transition-all duration-300 group",
                                    activeTemplateId === template.id
                                        ? "bg-ot-action-top/10 border-ot-action-top/50 shadow-[0_0_20px_rgba(95,166,255,0.1)]"
                                        : "bg-white/5 border-white/10 hover:border-white/20"
                                )}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-xl border transition-colors",
                                            activeTemplateId === template.id
                                                ? "bg-ot-action-top/20 border-ot-action-top/30 text-white"
                                                : "bg-white/5 border-white/10 text-ot-text-muted group-hover:text-white"
                                        )}>
                                            <Disc size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white group-hover:text-ot-action-top transition-colors">
                                                {template.name}
                                            </h4>
                                            <p className="text-[10px] text-ot-text-muted uppercase tracking-widest font-bold">
                                                {template.elements?.length || 0} Layers
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteTemplate(template.id)}
                                        className="h-8 w-8 p-0 text-ot-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 hover:bg-red-500/10"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    {activeTemplateId === template.id ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold w-full justify-center">
                                            <Check size={14} /> Active for Burning
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleSetActive(template.id)}
                                            className="w-full py-1.5 rounded-lg bg-ot-action-top/10 hover:bg-ot-action-top/20 border border-ot-action-top/20 text-ot-action-top text-xs font-bold transition-all"
                                        >
                                            Set as Active
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                <h4 className="text-orange-400 font-bold mb-2 flex items-center gap-2">
                    Auto-Matching Fields
                </h4>
                <p className="text-white/70 text-xs leading-relaxed">
                    When you set a template as active, it will automatically populate dynamic fields like
                    <span className="text-white font-mono px-1">patientName</span>,
                    <span className="text-white font-mono px-1">patientId</span>, and
                    <span className="text-white font-mono px-1">studyDate</span> from the selected study in the archive table.
                </p>
            </div>
        </div>
    );
};

export default BravoSetting;
