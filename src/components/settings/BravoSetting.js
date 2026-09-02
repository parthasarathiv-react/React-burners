import React, { useState, useEffect } from 'react';
import { Check, Disc, Trash2, Layout, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
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
import { getTemplates, getTemplate, updateTemplate, deleteTemplate } from '../../utils/templateApi';

const BravoSetting = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const res = await getTemplates();
            const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
            setTemplates(list);
        } catch (e) {
            console.error('Failed to load templates', e);
            toast.error(e?.response?.data?.message || e.message || 'Failed to load templates from server');
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSetActive = async (targetTemplate) => {
        setUpdatingId(targetTemplate.id);
        try {
            const fullTemplate = await getTemplate(targetTemplate.id).catch(() => targetTemplate);
            const templateToUse = fullTemplate || targetTemplate;

            let defObj = templateToUse.jsonDefinition;
            if (typeof defObj === 'string') {
                try { defObj = JSON.parse(defObj); } catch (_) {}
            }
            // Exact same fields as CDDesignStudio buildTemplatePayload — only isDefault changes
            const payload = {
                name: templateToUse.name,
                description: templateToUse.description || '',
                jsonDefinition: defObj,
                backgroundImage: templateToUse.backgroundImage || '',
                isDefault: true,
            };
            await updateTemplate(targetTemplate.id, payload);
            toast.success(`"${templateToUse.name}" is now set as the default active template.`);
            await loadTemplates();
        } catch (e) {
            console.error('Failed to set active template', e);
            toast.error(e?.response?.data?.message || e.message || 'Failed to update active template on server');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleSetInactive = async (targetTemplate) => {
        setUpdatingId(targetTemplate.id);
        try {
            const fullTemplate = await getTemplate(targetTemplate.id).catch(() => targetTemplate);
            const templateToUse = fullTemplate || targetTemplate;

            let defObj = templateToUse.jsonDefinition;
            if (typeof defObj === 'string') {
                try { defObj = JSON.parse(defObj); } catch (_) {}
            }
            // Exact same fields as CDDesignStudio buildTemplatePayload — only isDefault changes
            const payload = {
                name: templateToUse.name,
                description: templateToUse.description || '',
                jsonDefinition: defObj,
                backgroundImage: templateToUse.backgroundImage || '',
                isDefault: false,
            };
            await updateTemplate(targetTemplate.id, payload);
            toast.success(`"${templateToUse.name}" has been deactivated.`);
            await loadTemplates();
        } catch (e) {
            console.error('Failed to deactivate template', e);
            toast.error(e?.response?.data?.message || e.message || 'Failed to deactivate template on server');
        } finally {
            setUpdatingId(null);
        }
    };


    const handleDeleteTemplate = (id) => {
        setDeleteConfirmId(id);
    };

    const confirmDeleteTemplate = async () => {
        if (!deleteConfirmId) return;

        try {
            await deleteTemplate(deleteConfirmId);
            toast.success('Template deleted successfully from server.');
            await loadTemplates();
        } catch (e) {
            console.error('Failed to delete template', e);
            toast.error(e?.response?.data?.message || e.message || 'Failed to delete template from server');
        } finally {
            setDeleteConfirmId(null);
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
                    {loading ? (
                        <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/5">
                            <Loader2 size={32} className="mx-auto mb-4 text-ot-action-top animate-spin" />
                            <p className="text-ot-text-muted font-medium">Loading templates from server...</p>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/5">
                            <Disc size={40} className="mx-auto mb-4 text-white/10" />
                            <p className="text-ot-text-muted font-medium">No custom templates found.</p>
                            <p className="text-xs text-ot-text-muted/60 mt-1">Create templates in the CD Design Studio first.</p>
                        </div>
                    ) : (
                templates.map((template) => {
                            const isDefault = !!template.isDefault;
                            const hasActiveTemplate = templates.some(t => t.isDefault);
                            const isAnotherActive = hasActiveTemplate && !isDefault;
                            let layersCount = 0;
                            if (template.jsonDefinition) {
                                let def = template.jsonDefinition;
                                if (typeof def === 'string') {
                                    try { def = JSON.parse(def); } catch (_) {}
                                }
                                layersCount = def?.objects?.length || 0;
                            } else if (template.objects) {
                                layersCount = template.objects.length;
                            } else if (template.elements) {
                                layersCount = template.elements.length;
                            }

                            return (
                                <div
                                    key={template.id}
                                    className={cn(
                                        "relative p-5 rounded-2xl border transition-all duration-300 group",
                                        isDefault
                                            ? "bg-ot-action-top/10 border-ot-action-top/50 shadow-[0_0_20px_rgba(95,166,255,0.1)]"
                                            : "bg-white/5 border-white/10 hover:border-white/20"
                                    )}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-xl border transition-colors",
                                                isDefault
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
                                                    {layersCount} Layers
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
                                        {isDefault ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={updatingId === template.id}
                                                onClick={() => handleSetInactive(template)}
                                                className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-red-500/20 border border-emerald-500/30 hover:border-red-500/30 text-emerald-400 hover:text-red-400 text-xs font-bold transition-all"
                                                title="Click to deactivate"
                                            >
                                                {updatingId === template.id ? 'Updating...' : <><Check size={14} /> Active for Burning</>}
                                            </Button>
                                        ) : (
                                            <div className="flex items-center gap-2 w-full">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={updatingId === template.id || isAnotherActive}
                                                    onClick={() => !isAnotherActive && handleSetActive(template)}
                                                    className={cn(
                                                        "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                                                        isAnotherActive
                                                            ? "bg-white/5 border border-white/10 text-white/20 cursor-not-allowed opacity-50"
                                                            : "bg-ot-action-top/10 hover:bg-ot-action-top/20 border border-ot-action-top/20 text-ot-action-top"
                                                    )}
                                                >
                                                    {updatingId === template.id ? 'Setting Active...' : 'Set as Active'}
                                                </Button>

                                                {/* Warning icon with tooltip when another is active */}
                                                {isAnotherActive && (
                                                    <div className="relative group/warn shrink-0">
                                                        <AlertTriangle
                                                            size={16}
                                                            className="text-amber-400/70 cursor-default"
                                                        />
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full right-0 mb-2 w-48 px-3 py-2 rounded-lg bg-[#1a1f2e] border border-amber-400/20 text-amber-300 text-[10px] font-semibold leading-snug shadow-xl opacity-0 pointer-events-none group-hover/warn:opacity-100 transition-opacity duration-200 z-50 whitespace-normal text-center">
                                                            Only one template can be active at a time. Deactivate the current one first.
                                                            <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-amber-400/20" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
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

            {/* ── Confirm Modal ───────────────────────────────────── */}
            {deleteConfirmId && (
                <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Template</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure you want to delete this template from the server? This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDeleteTemplate}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Confirm
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
};

export default BravoSetting;
