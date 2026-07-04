import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import TopHeader from './TopHeader';
import SearchBar from './SearchBar';
import StudyTable from './StudyTable';
import TableFooter from './TableFooter';
import BottomStatus from './BottomStatus';
import SettingsModal from './SettingsModal';
import QueryRetrieve from './QueryRetrieve';
import { Tabs, TabsContent } from '../ui/tabs';
import { getSettings, saveSettings } from '../../lib/dataManager';
import { useAuth } from '../../context/AuthContext';
import { DownloadProvider } from '../../context/DownloadContext';
import { Flame, Disc, X } from 'lucide-react';
import { Button } from '../ui/button';
import CDPreview from '../cd-studio/CDPreview';
import api from '../../lib/api';

function Dashboard({ theme, onThemeChange }) {
  const { loading: authLoading } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [studies, setStudies] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Studies');
  const [incomingStudyId, setIncomingStudyId] = useState(null);
  const [selectedStudyIds, setSelectedStudyIds] = useState([]);
  const [burnModalOpen, setBurnModalOpen] = useState(false);
  const [burnTemplate, setBurnTemplate] = useState(null);
  const burnPreviewRef = useRef(null);

  const tableContainerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState('10'); // Default to 10 fallback
  const [, setIsAutoPage] = useState(true);
  const isAutoPageRef = useRef(true);

  const calculateResponsivePageSize = () => {
    // Determine target size based on screen height resolution
    const h = window.innerHeight;
    let targetSize = '10'; // Default for big screens initially

    // Scale downwards for smaller screens
    if (h < 900 && h >= 768) {
      targetSize = '7';
    } else if (h < 768) {
      targetSize = '5';
    } else if (h >= 1080) {
      targetSize = '12'; // Even larger if fully 1080p
    }

    setPageSize(prev => {
      // Only update if auto mode is ON and value differs
      if (isAutoPageRef.current && prev !== targetSize) {
        setCurrentPage(1); // Reset page on limit changes
        return targetSize;
      }
      return prev;
    });
  };

  useEffect(() => {
    calculateResponsivePageSize();
    window.addEventListener('resize', calculateResponsivePageSize);
    return () => window.removeEventListener('resize', calculateResponsivePageSize);
  }, [loading]); // re-run once loading stops

  // Also catch edge-case when tabs switch causing a resize or layout shift
  useEffect(() => {
    if (!isAutoPageRef.current) return;
    const timer = setTimeout(() => calculateResponsivePageSize(), 150);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const [searchCriteria, setSearchCriteria] = useState({
    patientName: '',
    patientId: '',
    studyDate: '',
    modality: ''
  });

  const fetchLocalStudies = useCallback(async () => {
    try {
      const response = await api.get('/localstudies');
      const data = response.data;
      if (Array.isArray(data)) {
        const mapped = data.map(s => ({
          id: s.id,
          studyInstanceUid: s.studyInstanceUid,
          patientName: s.patient?.patientName || '—',
          patientId: s.patient?.patientId || '—',
          accession: s.accessionNumber || '—',
          studyDate: s.studyDate || '—',
          modality: s.modality || '—',
          instance: s.totalInstances || s.downloadedInstances || 0,
          description: s.studyDescription || '—',
          status: s.status, // 0 = Pending, 1 = Downloading, 2 = Completed, 3 = Failed
          downloadedInstances: s.downloadedInstances,
          totalInstances: s.totalInstances,
          localFolderPath: s.localFolderPath,
          completedAt: s.completedAt,
          errorMessage: s.errorMessage,
        }));
        setStudies(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch local studies:', err);
      toast.error('Failed to load local studies from server.');
    }
  }, []);

  useEffect(() => {
    const loadedSettings = getSettings();
    setSettings(loadedSettings);
    fetchLocalStudies().finally(() => setLoading(false));
  }, [fetchLocalStudies]);

  const handleDeleteStudy = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this study?')) {
      try {
        await api.delete(`/localstudies/${id}`);
        toast.success('Study deleted successfully.');
        fetchLocalStudies();
      } catch (err) {
        console.error('Failed to delete study on backend:', err);
        // Fallback to local deletion from state if backend fails or doesn't support delete
        setStudies(prev => prev.filter(s => s.id !== id));
        toast.info('Study removed from local view.');
      }
    }
  }, [fetchLocalStudies]);

  const handleUpdateSettings = (newSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  };
  const handleSearch = (criteria) => setSearchCriteria(criteria);
  const handleIncomingComplete = useCallback(() => setIncomingStudyId(null), []);

  const handleOpenBurnModal = (template) => {
    setBurnTemplate(template);
    setBurnModalOpen(true);
  };

  const handleDownloadImage = async () => {
    if (!burnPreviewRef.current) return;

    try {
      const canvas = await html2canvas(burnPreviewRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2, // Higher quality
      });

      const entry = studies.filter(s => selectedStudyIds.includes(s.id))[0];
      const fileName = `BurnLabel_${entry?.patientName?.replace(/\s+/g, '_') || 'Mission'}_${Date.now()}.png`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error capturing image:', err);
    }
  };

  /**
   * Called by DownloadContext IMMEDIATELY when Retrieve is clicked.
   * Adds a placeholder study row to the table and navigates to the Studies tab
   * so the user sees the downloading progress in real time.
   */
  const handleDownloadStarted = useCallback((study) => {
    const uid = study.studyInstanceUid;
    const placeholder = {
      ...study,
      id: `dl_${uid}`,
      // Normalize field names to match StudyTable expectations
      instance: study.numberOfStudyRelatedInstances ?? 0,
      accession: study.accessionNumber || study.accession || '',
      description: study.studyDescription || study.description || '',
    };
    setStudies((prev) => {
      // Avoid adding a duplicate if the study is already present
      if (prev.some((s) => s.studyInstanceUid === uid)) return prev;
      return [placeholder, ...prev];
    });
    setCurrentPage(1);
    setActiveTab('Studies');
  }, []);

  const handleStudyReady = useCallback(async (study, studyUid) => {
    // Remove the downloading placeholder first
    setStudies((prev) => prev.filter((s) => s.id !== `dl_${studyUid}`));

    try {
      const response = await api.get('/localstudies');
      const data = response.data;
      if (Array.isArray(data)) {
        const mapped = data.map(s => ({
          id: s.id,
          studyInstanceUid: s.studyInstanceUid,
          patientName: s.patient?.patientName || '—',
          patientId: s.patient?.patientId || '—',
          accession: s.accessionNumber || '—',
          studyDate: s.studyDate || '—',
          modality: s.modality || '—',
          instance: s.totalInstances || s.downloadedInstances || 0,
          description: s.studyDescription || '—',
          status: s.status, // 0 = Pending, 1 = Downloading, 2 = Completed, 3 = Failed
          downloadedInstances: s.downloadedInstances,
          totalInstances: s.totalInstances,
          localFolderPath: s.localFolderPath,
          completedAt: s.completedAt,
          errorMessage: s.errorMessage,
        }));
        setStudies(mapped);

        // Find the matching study to trigger the count-up animation
        const matched = mapped.find(s => s.studyInstanceUid === studyUid);
        if (matched) {
          setIncomingStudyId(matched.id);
        }
      }
    } catch (err) {
      console.error('Failed to refetch studies after completion:', err);
    }

    setCurrentPage(1);
    setActiveTab('Studies');
  }, []);

  const filteredStudies = useMemo(() => {
    return studies.filter(s => {
      const nameMatch = s.patientName.toLowerCase().includes(searchCriteria.patientName.toLowerCase());
      const idMatch = (s.patientId || '').toLowerCase().includes(searchCriteria.patientId.toLowerCase());
      const dateMatch = (s.studyDate || '').toLowerCase().includes(searchCriteria.studyDate.toLowerCase());
      const modalityMatch = !searchCriteria.modality || s.modality === searchCriteria.modality;
      return nameMatch && idMatch && dateMatch && modalityMatch;
    });
  }, [studies, searchCriteria]);

  // Reset to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchCriteria]);

  const paginatedStudies = useMemo(() => {
    const startIndex = (currentPage - 1) * parseInt(pageSize, 10);
    return filteredStudies.slice(startIndex, startIndex + parseInt(pageSize, 10));
  }, [filteredStudies, currentPage, pageSize]);

  // if (loading || authLoading) {
  //   return (
  //     <div className="min-h-screen bg-transparent flex items-center justify-center text-white font-baijam">
  //       Initializing Medical Workstation...
  //     </div>
  //   );
  // }

  useEffect(() => {
    if (activeTab === 'Studies') {
      fetchLocalStudies();
    }
  }, [activeTab, fetchLocalStudies]);

  return (
    <DownloadProvider onStudyReady={handleStudyReady} onDownloadStarted={handleDownloadStarted}>
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex flex-col h-screen bg-transparent text-white font-baijam overflow-hidden relative"
    >
      {/* Header with Tabs navigation */}
      <div className="relative z-[1000]">
        <TopHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenSettings={() => setSettingsOpen(true)}
          theme={theme}
          onThemeChange={onThemeChange}
        />
      </div>

      {/* Main Content driven by TabsContent */}
      <main className="flex-1 flex flex-col overflow-hidden relative">

        {/* Studies Tab */}
        <TabsContent
          value="Studies"
          className="flex-1 flex flex-col gap-4 p-4 sm:gap-6 sm:p-6 pb-2 sm:pb-4 overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden"
        >
          <div className="relative z-[900]">
            <SearchBar onSearch={handleSearch} />
          </div>

          <div className="flex-1 flex flex-col glass-card shadow-2xl relative z-[100] overflow-hidden min-h-0">
            <div ref={tableContainerRef} className="flex-1 flex flex-col rounded-t-2xl relative z-10 min-h-0">
              <StudyTable
                studies={paginatedStudies}
                onUpdate={setStudies}
                onDelete={handleDeleteStudy}
                incomingStudyId={incomingStudyId}
                onIncomingComplete={handleIncomingComplete}
                selectedIds={selectedStudyIds}
                onSelectChange={setSelectedStudyIds}
              />
            </div>
            <div className="relative z-[500] mt-auto shrink-0 bg-black/20 w-full">
              <TableFooter
                totalRows={filteredStudies.length}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                pageSize={pageSize}
                setPageSize={(newSize) => {
                  setIsAutoPage(false);
                  isAutoPageRef.current = false;
                  setPageSize(newSize);
                }}
              />
            </div>
          </div>

          <div className="relative z-[600]">
            <BottomStatus
              settings={settings}
              selectedStudies={studies.filter(s => selectedStudyIds.includes(s.id))}
              onExecuteBurn={handleOpenBurnModal}
            />
          </div>
        </TabsContent>

        {/* Query/Retrieve Tab */}
        <TabsContent
          value="Query/Retrieve"
          className="flex-1 p-6 overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden flex-col"
        >
          <QueryRetrieve />
        </TabsContent>

        {/* Job Queue Tab */}
        <TabsContent
          value="Job Queue"
          className="flex-1 p-6 data-[state=active]:flex data-[state=inactive]:hidden items-center justify-center"
        >
          <div className="flex-1 flex items-center justify-center glass-card border-ot-action-top/20 animate-in fade-in zoom-in duration-500 rounded-3xl">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-ot-action-top/10 border border-ot-action-top/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-ot-action-top text-3xl font-black">#</span>
              </div>
              <h2 className="text-2xl font-black text-white/30 uppercase tracking-[0.3em] mb-3">Job Queue</h2>
              <p className="text-ot-text-muted font-medium">No active burn missions in queue.</p>
            </div>
          </div>
        </TabsContent>

      </main>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="relative z-[2000]">
          <SettingsModal
            settings={settings}
            onUpdate={handleUpdateSettings}
            onClose={() => setSettingsOpen(false)}
          />
        </div>
      )}

      {/* Burn Preview Modal - ROOT LEVEL FOR GUARANTEED CENTERING */}
      {burnModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-ot-bg-mid border border-white/10 rounded-3xl w-full max-w-4xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBurnModalOpen(false)}
                className="rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"
              >
                <X size={24} />
              </Button>
            </div>

            <div className="flex flex-col items-center gap-8 md:gap-12 text-center">
              {/* CD Preview */}
              <div className="relative shrink-0 scale-90 sm:scale-100 mb-4">
                <div className="absolute -inset-10 bg-ot-action-top/10 rounded-full blur-3xl animate-pulse" />
                <div className="relative" ref={burnPreviewRef}>
                  <CDPreview
                    elements={burnTemplate?.elements || []}
                    discConfig={burnTemplate?.discConfig}
                    dicomData={studies.filter(s => selectedStudyIds.includes(s.id))[0]}
                    zoom={1}
                  />
                </div>
              </div>

              {/* Info & Confirmation */}
              <div className="w-full max-w-2xl space-y-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter flex items-center justify-center gap-3">
                    <Flame className="text-orange-500 animate-pulse" size={36} />
                    READY FOR IGNITION
                  </h2>
                  <p className="text-ot-text-muted font-bold uppercase tracking-[0.3em] text-xs mt-2">
                    Burn Order Processing: Study Archive #{studies.filter(s => selectedStudyIds.includes(s.id))[0]?.accession?.slice(-4) || 'TASK'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md text-center">
                    <p className="text-[10px] font-bold text-ot-text-muted uppercase tracking-widest mb-1">Target Media</p>
                    <p className="text-white font-bold text-lg">CD-R / 700MB</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md text-center">
                    <p className="text-[10px] font-bold text-ot-text-muted uppercase tracking-widest mb-1">Template Used</p>
                    <p className="text-ot-action-top font-bold text-lg">{burnTemplate?.name || 'Standard Label'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-[1px] w-12 bg-white/10" />
                    <p className="text-[10px] font-bold text-ot-text-muted uppercase tracking-widest px-2">Job Queue Preview</p>
                    <div className="h-[1px] w-12 bg-white/10" />
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar px-2">
                    {studies.filter(s => selectedStudyIds.includes(s.id)).map(study => (
                      <div key={study.id} className="flex justify-between items-center p-3 rounded-xl bg-black/40 border border-white/5 hover:border-ot-action-top/30 transition-colors">
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">{study.patientName}</p>
                          <p className="text-[10px] text-ot-text-muted capitalize">{study.modality.toLowerCase()} Analysis • {study.studyDate}</p>
                        </div>
                        <span className="px-3 py-1 rounded-lg bg-ot-action-top/10 text-ot-action-top text-[10px] font-bold border border-ot-action-top/20">
                          {study.instance} IMG
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={async () => {
                      await handleDownloadImage();
                      toast.success('Burn process initiated successfully and label downloaded!');
                      setBurnModalOpen(false);
                    }}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-[length:200%_auto] animate-gradient-x text-white font-black uppercase tracking-[0.25em] shadow-[0_10px_40px_rgba(234,88,12,0.4)] hover:shadow-[0_15px_50px_rgba(234,88,12,0.5)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300"
                  >
                    Confirm & Execute Burn
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Tabs>
    </DownloadProvider>
  );
}

export default Dashboard;
