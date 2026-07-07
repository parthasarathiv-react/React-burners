import React, { useState } from 'react';
import { Search, RotateCcw, Download, Filter, Clock, Calendar, Loader2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import TableFooter from './TableFooter';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";

import api from '../../lib/api';
import { useDownload } from '../../context/DownloadContext';
import { toast } from 'sonner';
const MODALITIES = [
    { label: 'Select Modality', value: '' },
    { label: 'CR', value: 'CR' },
    { label: 'CT', value: 'CT' },
    { label: 'MR', value: 'MR' },
    { label: 'US', value: 'US' },
    { label: 'DX', value: 'DX' },
    { label: 'XA', value: 'XA' },
    { label: 'NM', value: 'NM' },
];

const EMPTY_FILTERS = {
    patientName: '',
    patientId: '',
    modality: '',
    accessionNumber: '',
    studyDateFrom: '',
    studyDateTo: '',
};

/** Format YYYYMMDD → DD/MM/YYYY */
function formatDate(raw) {
    if (!raw || raw.length !== 8) return raw || '—';
    return `${raw.slice(6, 8)}/${raw.slice(4, 6)}/${raw.slice(0, 4)}`;
}

/** Format HHMMSS.fff → HH:MM:SS */
function formatTime(raw) {
    if (!raw) return '—';
    const parts = raw.split('.')[0];
    if (parts.length >= 6) {
        return `${parts.slice(0, 2)}:${parts.slice(2, 4)}:${parts.slice(4, 6)}`;
    }
    return raw;
}

function QueryRetrieve() {
    const [results, setResults] = useState(null); // null = not searched yet
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState('5');
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    const { startDownload, downloadStates } = useDownload();

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleSearch = async () => {
        setSearching(true);
        setError(null);
        setResults([]);
        setCurrentPage(1);

        const payload = {
            patientId: filters.patientId || '',
        };

        try {
            const response = await api.post('/query', payload);
            const data = response.data;
            setResults(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Query API error:', err);
            toast.error(err?.response?.data?.message || err.message || 'Failed to query PACS server.');
            setError(err.message || 'Failed to connect to PACS server.');
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    const clearSearch = () => {
        setFilters(EMPTY_FILTERS);
        setResults(null);
        setError(null);
        setCurrentPage(1);
    };

    const setTodayDates = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        setFilters(prev => ({ ...prev, studyDateFrom: dateStr, studyDateTo: dateStr }));
    };

    const setLast7Days = () => {
        const today = new Date();
        const from = new Date();
        from.setDate(today.getDate() - 7);
        const fmt = (d) => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };
        setFilters(prev => ({ ...prev, studyDateFrom: fmt(from), studyDateTo: fmt(today) }));
    };

    const safeResults = results ?? [];
    const pageSizeNumber = parseInt(pageSize, 10);
    const startIndex = (currentPage - 1) * pageSizeNumber;
    const paginatedResults = safeResults.slice(startIndex, startIndex + pageSizeNumber);

    return (
        <div className="flex flex-col gap-4 h-full animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Filter Section */}
            <div className="glass-card p-5 bg-ot-bg-mid/20 border-ot-border/40 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-ot-action-top/5 rounded-full blur-3xl -mr-24 -mt-24 transition-colors group-hover:bg-ot-action-top/10" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5 px-1">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-ot-action-top/20 flex items-center justify-center border border-ot-action-top/30 shadow-lg shadow-ot-action-top/5">
                                <Filter size={18} className="text-ot-action-top" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-white leading-tight">Query PACS Server</h2>
                                <p className="text-[10px] text-ot-text-muted font-medium opacity-80 uppercase tracking-wider">Search remote archives</p>
                            </div>
                        </div>
                    </div>

                    {/* Row 1: Patient ID, Patient Name, Accession, Modality */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-1">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black uppercase text-ot-text-muted/60 tracking-[0.15em] pl-1">Patient ID</label>
                            <Input
                                value={filters.patientId}
                                onChange={(e) => handleFilterChange('patientId', e.target.value)}
                                placeholder="Ex: 706537"
                                className="h-10 bg-ot-bg-top/30"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black uppercase text-ot-text-muted/60 tracking-[0.15em] pl-1">Patient Name</label>
                            <Input
                                value={filters.patientName}
                                onChange={(e) => handleFilterChange('patientName', e.target.value)}
                                placeholder="Search Name..."
                                className="h-10 bg-ot-bg-top/30"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black uppercase text-ot-text-muted/60 tracking-[0.15em] pl-1">Accession No</label>
                            <Input
                                value={filters.accessionNumber}
                                onChange={(e) => handleFilterChange('accessionNumber', e.target.value)}
                                placeholder="Ex: ACC-1001"
                                className="h-10 bg-ot-bg-top/30"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black uppercase text-ot-text-muted/60 tracking-[0.15em] pl-1">Modality</label>
                            <Select
                                value={filters.modality || 'all'}
                                onValueChange={(val) => handleFilterChange('modality', val === 'all' ? '' : val)}
                            >
                                <SelectTrigger className="h-10 bg-ot-bg-top/30 border border-ot-border/50 text-white rounded-md text-xs font-bold uppercase tracking-widest hover:border-ot-action-top/50 focus:ring-1 focus:ring-ot-action-top">
                                    <SelectValue placeholder="Select Modality" />
                                </SelectTrigger>
                                <SelectContent className="bg-ot-bg-mid border border-ot-border/50 rounded-xl text-white z-[9999] backdrop-blur-2xl">
                                    {MODALITIES.map((opt) => (
                                        <SelectItem key={opt.value || 'all'} value={opt.value || 'all'} className="text-xs uppercase tracking-widest cursor-pointer focus:bg-ot-action-top/10 focus:text-white">
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Row 2: Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-1 mt-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black uppercase text-ot-text-muted/60 tracking-[0.15em] pl-1">Study Date From</label>
                            <Input
                                type="date"
                                value={filters.studyDateFrom}
                                onChange={(e) => handleFilterChange('studyDateFrom', e.target.value)}
                                className="h-10 bg-ot-bg-top/30"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black uppercase text-ot-text-muted/60 tracking-[0.15em] pl-1">Study Date To</label>
                            <Input
                                type="date"
                                value={filters.studyDateTo}
                                onChange={(e) => handleFilterChange('studyDateTo', e.target.value)}
                                className="h-10 bg-ot-bg-top/30"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-5 border-t border-ot-border/10">
                        <div className="flex gap-2">
                            <Button variant="surface" size="sm" className="h-9 px-4 rounded-lg border-ot-border/20 bg-white/[0.03]" onClick={setTodayDates}>
                                <Clock size={14} className="mr-2 text-ot-text-muted" /> Today
                            </Button>
                            <Button variant="surface" size="sm" className="h-9 px-4 rounded-lg border-ot-border/20 bg-white/[0.03]" onClick={setLast7Days}>
                                <Calendar size={14} className="mr-2 text-ot-text-muted" /> 7 Days
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg bg-ot-bg-top/30 border-ot-border/20 text-ot-text-muted hover:text-white" onClick={clearSearch}>
                                <RotateCcw size={14} className="mr-2" /> Clear
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-8 rounded-lg relative overflow-hidden"
                                onClick={handleSearch}
                                disabled={searching}
                            >
                                <Search size={16} className="mr-2" />
                                {searching ? 'Searching...' : 'Execute'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 glass-card border-ot-border/30 bg-ot-bg-mid/10 flex flex-col min-h-0 relative">
                <div className="flex items-center justify-between px-6 py-4 border-b border-ot-border/20 bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${searching ? 'bg-yellow-400 animate-pulse' : 'bg-ot-action-top animate-pulse'}`} />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#a7bedf]">Results from Archive</span>
                    </div>
                    <Badge variant="outline" className="border-ot-action-top/30 text-ot-action-top">
                        {searching ? '...' : results === null ? '—' : safeResults.length} STUDIES FOUND
                    </Badge>
                </div>

                <div className="flex-1 overflow-auto relative custom-scrollbar">
                    <Table className="min-w-[1100px]">
                        <TableHeader className="sticky top-0 z-20 bg-ot-bg-top/90 backdrop-blur-md">
                            <TableRow className="hover:bg-transparent border-ot-border/20 text-left">
                                <TableHead className="px-4 py-4 text-[10px] uppercase font-black text-ot-text-muted text-left">Patient ID</TableHead>
                                <TableHead className="px-4 py-4 text-[10px] uppercase font-black text-ot-text-muted text-left">Patient Name</TableHead>
                                <TableHead className="px-4 py-4 text-[10px] uppercase font-black text-ot-text-muted text-left">Accession No</TableHead>
                                <TableHead className="px-4 py-4 text-[10px] uppercase font-black text-ot-text-muted text-left">Study Description</TableHead>
                                <TableHead className="px-4 py-4 text-[10px] uppercase font-black text-ot-text-muted text-left">Study Date / Time</TableHead>
                                <TableHead className="px-4 py-4 text-[10px] uppercase font-black text-ot-text-muted text-center">Modality</TableHead>
                                <TableHead className="px-4 py-4 text-[10px] uppercase font-black text-ot-text-muted text-center">Instances</TableHead>
                                <TableHead className="px-4 py-4 text-[10px] uppercase font-black text-ot-text-muted text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-ot-border/10">
                            {searching ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-none">
                                        <TableCell colSpan={8} className="px-6 py-5">
                                            <div className="h-4 bg-white/5 rounded-full w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : error ? (
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableCell colSpan={8} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                                                <Search size={22} className="text-red-400/50" />
                                            </div>
                                            <h3 className="text-sm font-bold text-red-400/70 uppercase tracking-widest">Connection Error</h3>
                                            <p className="text-[11px] text-ot-text-muted max-w-xs">{error}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : results === null ? (
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableCell colSpan={8} className="px-6 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-ot-action-top/10 flex items-center justify-center">
                                                <Search size={26} className="text-ot-action-top/40" />
                                            </div>
                                            <h3 className="text-sm font-bold text-white/30 uppercase tracking-widest">Enter Search Criteria</h3>
                                            <p className="text-[11px] text-ot-text-muted/50">Fill in Patient ID or other fields and click Execute</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedResults.length === 0 ? (
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableCell colSpan={8} className="px-6 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                                <Search size={24} className="text-ot-text-muted/30" />
                                            </div>
                                            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">No Matches Found</h3>
                                            <p className="text-[11px] text-ot-text-muted/50">Try adjusting your search filters</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedResults.map((study, idx) => (
                                    <TableRow
                                        key={study.studyInstanceUid || `${study.patientId}-${idx}`}
                                        className="hover:bg-ot-action-top/5 border-ot-border/10"
                                    >
                                        {/* Patient ID */}
                                        <TableCell className="px-4 py-3 text-left">
                                            <span className="text-xs font-bold text-ot-action-top font-mono">
                                                {study.patientId || '—'}
                                            </span>
                                        </TableCell>

                                        {/* Patient Name */}
                                        <TableCell className="px-4 py-3 text-left">
                                            <span className="text-sm font-semibold text-white uppercase">
                                                {study.patientName || '—'}
                                            </span>
                                        </TableCell>

                                        {/* Accession No */}
                                        <TableCell className="px-4 py-3 text-left">
                                            <span className="text-xs font-mono text-white/80">
                                                {study.accessionNumber || '—'}
                                            </span>
                                        </TableCell>

                                        {/* Study Description */}
                                        <TableCell className="px-4 py-3 text-left">
                                            <span className="text-xs text-white/80 uppercase">
                                                {study.studyDescription || '—'}
                                            </span>
                                        </TableCell>

                                        {/* Study Date / Time */}
                                        <TableCell className="px-4 py-3 text-left">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-white/90">
                                                    {formatDate(study.studyDate)}
                                                </span>
                                                <span className="text-[10px] text-ot-text-muted mt-0.5">
                                                    {formatTime(study.studyTime)}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Modality */}
                                        <TableCell className="px-4 py-3 text-center">
                                            <Badge variant="modality">{study.modality || '—'}</Badge>
                                        </TableCell>

                                        {/* Instances */}
                                        <TableCell className="px-4 py-3 text-center">
                                            <Badge variant="secondary" className="font-black">
                                                {study.numberOfStudyRelatedInstances ?? 0} IMG
                                            </Badge>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="px-4 py-3 text-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => startDownload(study)}
                                            >
                                                <Download size={12} className="mr-1.5" /> Retrieve
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {results !== null && !searching && (
                    <TableFooter
                        totalRows={safeResults.length}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        itemLabel="Remote Studies"
                    />
                )}
            </div>
        </div>
    );
}

export default QueryRetrieve;
