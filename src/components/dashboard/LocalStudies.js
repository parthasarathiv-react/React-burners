import React, { useState, useEffect, useCallback } from 'react';
import {
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Download,
    Clock,
    Loader2,
    HardDrive,
    FolderOpen,
    Flame,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import api from '../../lib/api';
import { useDownload } from '../../context/DownloadContext';
import { toast } from 'sonner';

// Backend status enum
// 0 = Pending, 1 = Downloading, 2 = Completed, 3 = Failed
const STATUS = { Pending: 0, Downloading: 1, Completed: 2, Failed: 3 };

/** Format ISO timestamp → readable */
function fmtDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

/** Format YYYYMMDD → DD/MM/YYYY */
function fmtStudyDate(raw) {
    if (!raw || raw === 'string' || raw.length !== 8) return raw || '—';
    return `${raw.slice(6, 8)}/${raw.slice(4, 6)}/${raw.slice(0, 4)}`;
}

function StatusBadge({ study, dlState }) {
    // Live download from SignalR overrides the backend status
    const isLiveDownloading = dlState?.status === 'downloading';
    const isLiveCompleted   = dlState?.status === 'completed';
    const isLiveFailed      = dlState?.status === 'failed';

    if (isLiveDownloading || study.status === STATUS.Downloading) {
        const pct = isLiveDownloading && dlState.total > 0
            ? Math.round((dlState.downloaded / dlState.total) * 100)
            : study.totalInstances > 0
            ? Math.round((study.downloadedInstances / study.totalInstances) * 100)
            : 0;
        return (
            <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                <div className="flex items-center gap-1.5">
                    <Download size={11} className="text-ot-action-top animate-bounce" />
                    <span className="text-[10px] font-bold text-ot-action-top uppercase tracking-widest">
                        {isLiveDownloading
                            ? `${dlState.downloaded} / ${dlState.total}`
                            : `${study.downloadedInstances} / ${study.totalInstances}`}
                    </span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-ot-action-top to-blue-400 rounded-full transition-all duration-500 relative"
                        style={{ width: `${pct}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (isLiveCompleted || study.status === STATUS.Completed) {
        return (
            <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Completed</span>
            </div>
        );
    }

    if (isLiveFailed || study.status === STATUS.Failed) {
        const errMsg = isLiveFailed ? dlState.error : study.errorMessage;
        return (
            <div className="flex items-center gap-1.5" title={errMsg}>
                <AlertCircle size={13} className="text-red-400" />
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Failed</span>
            </div>
        );
    }

    // Pending
    return (
        <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-yellow-400" />
            <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Pending</span>
        </div>
    );
}

function LocalStudies({ selectedIds = [], onSelectChange, onBurnReady }) {
    const [studies, setStudies]     = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const { downloadStates }        = useDownload();

    const fetchStudies = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        setError(null);
        try {
            const res = await api.get('/localstudies');
            setStudies(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('[LocalStudies] fetch error:', err);
            toast.error(err?.response?.data?.message || err.message || 'Failed to load local studies.');
            setError(err.message || 'Failed to load local studies.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => { fetchStudies(); }, [fetchStudies]);

    // Auto-refresh when a SignalR download completes
    useEffect(() => {
        const hasCompleted = Object.values(downloadStates).some(d => d.status === 'completed');
        if (hasCompleted) fetchStudies(true);
    }, [downloadStates, fetchStudies]);

    const toggleSelectAll = () => {
        const completedIds = studies.filter(s => s.status === STATUS.Completed).map(s => s.id);
        if (selectedIds.length === completedIds.length) onSelectChange([]);
        else onSelectChange(completedIds);
    };

    const toggleOne = (e, id) => {
        e.stopPropagation();
        if (selectedIds.includes(id)) onSelectChange(selectedIds.filter(sid => sid !== id));
        else onSelectChange([...selectedIds, id]);
    };

    const completedStudies = studies.filter(s => s.status === STATUS.Completed);

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="flex-1 flex flex-col glass-card shadow-2xl relative z-[100] overflow-hidden min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Table header bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-ot-border/20 bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-2">
                    <HardDrive size={15} className="text-ot-action-top" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#a7bedf]">
                        Downloaded Studies
                    </span>
                    <Badge variant="outline" className="border-ot-action-top/30 text-ot-action-top ml-2">
                        {loading ? '…' : studies.length} TOTAL
                    </Badge>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-ot-text-muted hover:text-white gap-2"
                    onClick={() => fetchStudies(true)}
                    disabled={refreshing}
                >
                    <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Refreshing…' : 'Refresh'}
                </Button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                    <thead className="sticky top-0 z-10 bg-ot-bg-top/90 backdrop-blur-md shadow-lg shadow-black/20">
                        <tr>
                            <th className="py-2.5 px-3 w-10 border-b border-ot-border/50">
                                <input
                                    type="checkbox"
                                    className="rounded-md border-white/20 bg-black/40 text-ot-action-top focus:ring-ot-action-top/20 cursor-pointer"
                                    checked={completedStudies.length > 0 && selectedIds.length === completedStudies.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            {['Patient Name', 'Patient ID', 'Accession', 'Study Date', 'Modality', 'Instances', 'Description', 'Status', 'Downloaded At', 'Folder'].map(h => (
                                <th key={h} className="py-2.5 px-3 text-[10px] font-bold text-ot-text-muted uppercase tracking-widest border-b border-ot-border/50 whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ot-border/10">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse border-none">
                                    <td colSpan={11} className="px-6 py-4">
                                        <div className="h-4 bg-white/5 rounded-full w-full" />
                                    </td>
                                </tr>
                            ))
                        ) : error ? (
                            <tr>
                                <td colSpan={11} className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <AlertCircle size={28} className="text-red-400/50" />
                                        <h3 className="text-sm font-bold text-red-400/70 uppercase tracking-widest">Connection Error</h3>
                                        <p className="text-[11px] text-ot-text-muted max-w-xs">{error}</p>
                                        <Button size="sm" variant="outline" onClick={() => fetchStudies()}>Retry</Button>
                                    </div>
                                </td>
                            </tr>
                        ) : studies.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="py-32 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <HardDrive size={28} className="text-ot-text-muted/30" />
                                        <h3 className="text-sm font-bold text-white/30 uppercase tracking-widest">No Local Studies</h3>
                                        <p className="text-[11px] text-ot-text-muted/50">Retrieve studies from the Query/Retrieve tab</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            studies.map((row) => {
                                const uid     = row.studyInstanceUid;
                                const dlState = uid ? downloadStates[uid] : null;
                                const isCompleted = row.status === STATUS.Completed || dlState?.status === 'completed';
                                const isFailed    = row.status === STATUS.Failed    || dlState?.status === 'failed';
                                const isDownloading = row.status === STATUS.Downloading || dlState?.status === 'downloading';
                                const isSelected  = selectedIds.includes(row.id);

                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => isCompleted && toggleOne({ stopPropagation: () => {} }, row.id)}
                                        className={`group transition-all border-l-4
                                            ${isCompleted ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'}
                                            ${isSelected   ? 'border-ot-action-top bg-ot-action-top/5' : 'border-transparent'}
                                            ${isCompleted && !isSelected ? 'border-emerald-500/30' : ''}
                                            ${isFailed ? 'border-red-500/40 bg-red-500/[0.03]' : ''}
                                            ${isDownloading ? 'border-blue-500/40' : ''}
                                        `}
                                    >
                                        {/* Checkbox — only selectable when completed */}
                                        <td className="py-2.5 px-3">
                                            {isCompleted && (
                                                <input
                                                    type="checkbox"
                                                    className="rounded-md border-white/20 bg-black/40 text-ot-action-top focus:ring-ot-action-top/20 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={(e) => toggleOne(e, row.id)}
                                                />
                                            )}
                                        </td>

                                        {/* Patient Name */}
                                        <td className="py-2.5 px-3">
                                            <div className="font-bold text-sm text-white group-hover:text-ot-action-top transition-colors">
                                                {row.patient?.patientName || '—'}
                                            </div>
                                        </td>

                                        {/* Patient ID */}
                                        <td className="py-2.5 px-3 text-ot-text-muted text-xs font-mono whitespace-nowrap">
                                            {row.patient?.patientId || '—'}
                                        </td>

                                        {/* Accession */}
                                        <td className="py-2.5 px-3 text-ot-text-muted text-xs font-mono">
                                            {row.accessionNumber || '—'}
                                        </td>

                                        {/* Study Date */}
                                        <td className="py-2.5 px-3 text-white/80 text-xs whitespace-nowrap">
                                            {fmtStudyDate(row.studyDate)}
                                        </td>

                                        {/* Modality */}
                                        <td className="py-2.5 px-3">
                                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-ot-action-top/10 text-ot-action-top border border-ot-action-top/20 uppercase">
                                                {row.modality || '—'}
                                            </span>
                                        </td>

                                        {/* Instances */}
                                        <td className="py-2.5 px-3 text-center">
                                            <span className="instance-count-badge">
                                                {isDownloading && <Loader2 size={11} className="animate-spin" />}
                                                {isDownloading && dlState?.total > 0
                                                    ? `${dlState.downloaded} / ${dlState.total} IMG`
                                                    : `${row.downloadedInstances || row.totalInstances || 0} IMG`}
                                            </span>
                                        </td>

                                        {/* Description */}
                                        <td className="py-2.5 px-3 text-ot-text-muted text-xs truncate max-w-[160px]">
                                            {row.studyDescription || '—'}
                                        </td>

                                        {/* Status */}
                                        <td className="py-2.5 px-3 text-center">
                                            <StatusBadge study={row} dlState={dlState} />
                                        </td>

                                        {/* Downloaded At */}
                                        <td className="py-2.5 px-3 text-[11px] text-ot-text-muted whitespace-nowrap">
                                            {fmtDate(row.completedAt)}
                                        </td>

                                        {/* Folder Path */}
                                        <td className="py-2.5 px-3">
                                            {row.localFolderPath ? (
                                                <div className="flex items-center gap-1.5 text-[10px] text-ot-text-muted font-mono truncate max-w-[180px]" title={row.localFolderPath}>
                                                    <FolderOpen size={11} className="shrink-0 text-ot-action-top/60" />
                                                    {row.localFolderPath.split('\\').slice(-2).join('\\')}
                                                </div>
                                            ) : '—'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bottom action bar */}
            {selectedIds.length > 0 && (
                <div className="shrink-0 border-t border-ot-border/20 px-6 py-3 bg-ot-action-top/5 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                    <span className="text-xs font-bold text-ot-action-top uppercase tracking-widest">
                        {selectedIds.length} study selected for burn
                    </span>
                    <Button
                        size="sm"
                        className="h-9 px-6 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold uppercase tracking-widest hover:brightness-110 transition-all"
                        onClick={() => onBurnReady?.(selectedIds)}
                    >
                        <Flame size={14} className="mr-2" />
                        Execute Burn
                    </Button>
                </div>
            )}
        </div>
    );
}

export default LocalStudies;
