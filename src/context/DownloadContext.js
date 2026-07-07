import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
} from 'react';
import { toast } from 'sonner';
import api from '../lib/api';
import signalRManager from '../lib/signalrManager';

/**
 * Download state shape per study:
 * {
 *   studyUid   : string,
 *   status     : 'downloading' | 'completed' | 'failed',
 *   downloaded : number,
 *   total      : number,
 *   error      : string | null,
 *   study      : object   ← original study metadata from QueryRetrieve
 * }
 */
const DownloadContext = createContext(null);

export function DownloadProvider({ children, onStudyReady, onDownloadStarted }) {
    // Map: studyUid → download state object
    const [downloadStates, setDownloadStates] = useState({});
    const onStudyReadyRef = useRef(onStudyReady);
    const onDownloadStartedRef = useRef(onDownloadStarted);
    console.log("downloadStates", downloadStates);
    // Keep callback refs fresh without causing effect re-runs
    useEffect(() => {
        onStudyReadyRef.current = onStudyReady;
    }, [onStudyReady]);

    useEffect(() => {
        onDownloadStartedRef.current = onDownloadStarted;
    }, [onDownloadStarted]);

    // ─── Helpers ────────────────────────────────────────────────────────────
    const updateState = useCallback((studyUid, patch) => {
        setDownloadStates((prev) => ({
            ...prev,
            [studyUid]: { ...prev[studyUid], ...patch },
        }));
    }, []);

    // ─── SignalR Event Handlers ──────────────────────────────────────────────
    const handleDownloadStarted = useCallback(
        (studyUid) => {
            console.info('[SignalR] DownloadStarted:', studyUid);
            setDownloadStates((prev) => {
                const current = prev[studyUid] || {};
                return {
                    ...prev,
                    [studyUid]: {
                        ...current,
                        studyUid,
                        status: 'downloading',
                        downloaded: current.downloaded ?? 0,
                        total: current.total || 0,
                        error: null,
                    },
                };
            });
        },
        []
    );

    const handleDownloadProgress = useCallback(
        (data) => {
            // data: { studyUid, downloaded, total }
            const { studyUid, downloaded, total } = data;
            console.info('[SignalR] DownloadProgress:', studyUid, downloaded, '/', total);
            updateState(studyUid, { downloaded, total });
        },
        [updateState]
    );

    const handleDownloadCompleted = useCallback(
        (studyUid) => {
            console.info('[SignalR] DownloadCompleted:', studyUid);
            setDownloadStates((prev) => {
                const current = prev[studyUid] || {};
                return {
                    ...prev,
                    [studyUid]: {
                        ...current,
                        status: 'completed',
                    },
                };
            });
            // Notify Dashboard so it can refresh local studies from API
            onStudyReadyRef.current?.(null, studyUid);
            toast.success('Download complete — study ready to burn!');
        },
        []
    );

    const handleDownloadFailed = useCallback(
        (data) => {
            // data: { studyUid, error }
            const { studyUid, error } = data;
            console.error('[SignalR] DownloadFailed:', studyUid, error);
            updateState(studyUid, { status: 'failed', error: error || 'Unknown error' });
            toast.error(`Download failed: ${error || 'Unknown error'}`);
        },
        [updateState]
    );

    // ─── Connect & Subscribe on mount ───────────────────────────────────────
    useEffect(() => {
        signalRManager.on('DownloadStarted', handleDownloadStarted);
        signalRManager.on('DownloadProgress', handleDownloadProgress);
        signalRManager.on('DownloadCompleted', handleDownloadCompleted);
        signalRManager.on('DownloadFailed', handleDownloadFailed);

        signalRManager.connect();

        return () => {
            signalRManager.off('DownloadStarted', handleDownloadStarted);
            signalRManager.off('DownloadProgress', handleDownloadProgress);
            signalRManager.off('DownloadCompleted', handleDownloadCompleted);
            signalRManager.off('DownloadFailed', handleDownloadFailed);
        };
    }, [
        handleDownloadStarted,
        handleDownloadProgress,
        handleDownloadCompleted,
        handleDownloadFailed,
    ]);

    // ─── Public API ─────────────────────────────────────────────────────────
    /**
     * Initiates a DICOM download for the given study.
     * Calls POST /api/query/download and registers an optimistic "downloading" state.
     */
    const startDownload = useCallback(
        async (study) => {
            const studyUid = study.studyInstanceUid;
            if (!studyUid) {
                toast.error('Cannot retrieve: study has no UID.');
                return;
            }

            // 1. Set optimistic downloading state
            setDownloadStates((prev) => ({
                ...prev,
                [studyUid]: {
                    studyUid,
                    status: 'downloading',
                    downloaded: 0,
                    total: study.numberOfStudyRelatedInstances ?? 0,
                    error: null,
                    study, // keep metadata for later persistence
                },
            }));

            // 2. Immediately notify Dashboard → adds row + navigates to Studies tab
            onDownloadStartedRef.current?.(study);

            try {
                // 3. Fire the API (returns immediately — backend runs async)
                const payload = {
                    studyInstanceUid: studyUid,
                    patientId: study.patientId || '',
                    patientName: study.patientName || '',
                    accessionNumber: study.accessionNumber || '',
                    studyDate: study.studyDate || '',
                    studyDescription: study.studyDescription || '',
                    modality: study.modality || '',
                };
                await api.post('/query/download', payload);
                toast.info('Download started — tracking progress via SignalR…');
            } catch (err) {
                console.error('[Download] API call failed:', err);
                setDownloadStates((prev) => ({
                    ...prev,
                    [studyUid]: {
                        ...prev[studyUid],
                        status: 'failed',
                        error: err.message || 'API request failed',
                    },
                }));
                toast.error(err?.response?.data?.message || err.message || 'Failed to start download.');
            }
        },
        []
    );

    /**
     * Remove a failed/completed entry from the state map.
     */
    const dismissDownload = useCallback((studyUid) => {
        setDownloadStates((prev) => {
            const next = { ...prev };
            delete next[studyUid];
            return next;
        });
    }, []);

    return (
        <DownloadContext.Provider
            value={{ downloadStates, startDownload, dismissDownload }}
        >
            {children}
        </DownloadContext.Provider>
    );
}

export function useDownload() {
    const ctx = useContext(DownloadContext);
    if (!ctx) throw new Error('useDownload must be used inside <DownloadProvider>');
    return ctx;
}
