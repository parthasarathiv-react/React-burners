import { useEffect, useState } from 'react';
import { Eye, Trash2, MoreVertical, Loader2, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { deleteStudy } from '../../lib/dataManager';
import { useDownload } from '../../context/DownloadContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

function StudyTable({ studies, onUpdate, incomingStudyId, onIncomingComplete, selectedIds = [], onSelectChange, onDelete }) {
  const [instanceCounts, setInstanceCounts] = useState({});
  const { downloadStates } = useDownload();

  const toggleSelectAll = () => {
    if (selectedIds.length === studies.length) {
      onSelectChange([]);
    } else {
      onSelectChange(studies.map(s => s.id));
    }
  };

  const toggleSelectOne = (e, id) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const handleRowClick = (id) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const handleDelete = (id) => {
    if (onDelete) {
      onDelete(id);
    } else if (window.confirm('Are you sure you want to delete this study?')) {
      const updated = deleteStudy(id);
      onUpdate(updated);
    }
  };

  useEffect(() => {
    if (!incomingStudyId) return undefined;

    const incomingStudy = studies.find((study) => study.id === incomingStudyId);
    if (!incomingStudy) return undefined;

    const target = Number.parseInt(incomingStudy.instance, 10) || 0;
    const duration = Math.min(3200, Math.max(1200, target * 16));
    const startedAt = performance.now();
    let animationFrame;
    let completeTimer;

    setInstanceCounts((prev) => ({ ...prev, [incomingStudyId]: 0 }));

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * easedProgress);

      setInstanceCounts((prev) => ({ ...prev, [incomingStudyId]: value }));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick);
        return;
      }

      completeTimer = setTimeout(() => {
        onIncomingComplete?.();
        setInstanceCounts((prev) => {
          const next = { ...prev };
          delete next[incomingStudyId];
          return next;
        });
      }, 1000);
    };

    animationFrame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(completeTimer);
    };
  }, [incomingStudyId, studies, onIncomingComplete]);

  return (
    <div className="flex-1 overflow-auto custom-scrollbar">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead className="sticky top-0 z-10 bg-ot-bg-top/90 backdrop-blur-md shadow-lg shadow-black/20">
          <tr>
            <th className="py-2.5 px-3 w-10 border-b border-ot-border/50">
              <input
                type="checkbox"
                className="rounded-md border-white/20 bg-black/40 text-ot-action-top focus:ring-ot-action-top/20 cursor-pointer"
                checked={studies.length > 0 && selectedIds.length === studies.length}
                onChange={toggleSelectAll}
              />
            </th>
            <th className="py-2.5 px-3 text-[10px] md:text-xs font-bold text-ot-text-muted uppercase tracking-widest border-b border-ot-border/50">Patient Name</th>
            <th className="py-2.5 px-3 text-[10px] md:text-xs font-bold text-ot-text-muted uppercase tracking-widest border-b border-ot-border/50 whitespace-nowrap">ID</th>
            <th className="py-2.5 px-3 text-[10px] md:text-xs font-bold text-ot-text-muted uppercase tracking-widest border-b border-ot-border/50 whitespace-nowrap">Accession</th>
            <th className="py-2.5 px-3 text-[10px] md:text-xs font-bold text-ot-text-muted uppercase tracking-widest border-b border-ot-border/50 whitespace-nowrap">Study Date</th>
            <th className="py-2.5 px-3 text-[10px] md:text-xs font-bold text-ot-text-muted uppercase tracking-widest border-b border-ot-border/50">Modality</th>
            <th className="py-2.5 px-3 text-[10px] md:text-xs font-bold text-ot-text-muted uppercase tracking-widest border-b border-ot-border/50 text-center whitespace-nowrap">Instances</th>
            <th className="py-2.5 px-3 text-[10px] md:text-xs font-bold text-ot-text-muted uppercase tracking-widest border-b border-ot-border/50">Description</th>
            <th className="py-2.5 px-3 text-[10px] md:text-xs font-bold text-ot-text-muted uppercase tracking-widest border-b border-ot-border/50 text-center">Status</th>
            <th className="py-2.5 px-3 text-[10px] md:text-xs font-bold text-ot-text-muted uppercase tracking-widest border-b border-ot-border/50 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y ">
          {studies.length === 0 ? (
            <tr>
              <td colSpan="10" className="p-20 text-center text-ot-text-muted font-bold uppercase tracking-widest opacity-50">Archive Data Not Found</td>
            </tr>
          ) : (
            studies.map((row) => {
              const isIncoming = row.id === incomingStudyId;
              const isSelected = selectedIds.includes(row.id);
              const visibleInstances = isIncoming ? instanceCounts[row.id] ?? 0 : row.instance;

              // Check if this study has an active download state via studyInstanceUid
              const uid = row.studyInstanceUid;
              const dlState = uid ? downloadStates[uid] : null;
              const statusLower = String(row.status || '').toLowerCase();
              const isDownloading = dlState?.status === 'downloading' || statusLower === 'downloading' || row.status === 1;
              const isCompleted = dlState?.status === 'completed' || statusLower === 'completed' || row.status === 2;
              const isFailed = dlState?.status === 'failed' || statusLower === 'failed' || row.status === 3;

              // Progress percentage (guard division by zero)
              const progressPct = dlState
                ? (dlState.total > 0 ? Math.round((dlState.downloaded / dlState.total) * 100) : 0)
                : (row.totalInstances > 0 ? Math.round(((row.downloadedInstances || 0) / row.totalInstances) * 100) : 0);

              return (
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row.id)}
                  className={`group hover:bg-white/[0.04] transition-all cursor-pointer border-l-4
                    ${isSelected ? 'border-ot-action-top bg-ot-action-top/5' : 'border-transparent'}
                    ${isIncoming ? 'instance-bulge-row border-ot-action-top' : ''}
                    ${isCompleted ? 'border-emerald-500/60' : ''}
                    ${isFailed ? 'border-red-500/60 bg-red-500/5' : ''}`}
                >
                  <td className="py-2.5 px-3">
                    <input
                      type="checkbox"
                      className="rounded-md border-white/20 bg-black/40 text-ot-action-top focus:ring-ot-action-top/20 cursor-pointer"
                      checked={isSelected}
                      onChange={(e) => toggleSelectOne(e, row.id)}
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-sm md:text-base text-white group-hover:text-ot-action-top transition-colors">{row.patientName}</div>
                  </td>
                  <td className="py-2.5 px-3 text-ot-text-muted text-xs md:text-sm whitespace-nowrap">{row.patientId}</td>
                  <td className="py-2.5 px-3 text-ot-text-muted text-xs md:text-sm">{row.accession}</td>
                  <td className="py-2.5 px-3 text-white/80 text-xs md:text-sm whitespace-nowrap">{row.studyDate}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 md:px-2 py-0.5 rounded-lg text-[9px] md:text-[10px] font-bold bg-ot-action-top/10 text-ot-action-top border border-ot-action-top/20 uppercase">
                      {row.modality}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`instance-count-badge ${isIncoming ? 'instance-count-loading' : ''}`}>
                      {(isIncoming || isDownloading) && <Loader2 size={12} className="animate-spin" />}
                      {isDownloading
                        ? (dlState?.total > 0
                          ? `${dlState.downloaded} / ${dlState.total} IMG`
                          : `${row.downloadedInstances || 0} / ${row.totalInstances || 0} IMG`)
                        : `${visibleInstances} IMG`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-ot-text-muted text-xs md:text-sm truncate max-w-[150px] md:max-w-[200px]">{row.description}</td>

                  {/* Status column */}
                  <td className="py-2.5 px-3 text-center min-w-[120px]">
                    {isDownloading ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5">
                          <Download size={11} className="text-ot-action-top animate-bounce" />
                          <span className="text-[10px] font-bold text-ot-action-top uppercase tracking-widest">
                            {progressPct}%
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-ot-action-top to-blue-400 rounded-full transition-all duration-500 relative"
                            style={{ width: `${progressPct}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    ) : isCompleted ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Completed</span>
                      </div>
                    ) : isFailed ? (
                      <div className="flex items-center justify-center gap-1.5" title={dlState?.error || row.errorMessage || 'Download failed'}>
                        <AlertCircle size={14} className="text-red-400" />
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Failed</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-ot-text-muted/40 font-bold uppercase tracking-widest">—</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-all">
                            <MoreVertical size={16} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-ot-bg-mid border border-ot-border/50 text-white backdrop-blur-2xl z-[9999]">
                          <DropdownMenuItem className="gap-2 focus:bg-ot-action-top/10 cursor-pointer">
                            <Eye size={14} className="text-ot-text-muted" /> View Details
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem
                            className="gap-2 text-pink-400 focus:bg-pink-400/10 focus:text-pink-400 cursor-pointer"
                            onClick={() => handleDelete(row.id)}
                          >
                            <Trash2 size={14} /> Delete Study
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default StudyTable;
