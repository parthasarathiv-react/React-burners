import React from 'react';
import { cn } from '../../lib/utils';
import FolderPicker from '../ui/FolderPicker';

const AdvancedSettings = ({ formData, onChange }) => {
    const useSystemDrives = formData?.isSystemDrive ?? false;
    const autoBurnForBravo = formData?.isAutoBurn ?? false;
    const viewInExternalDicomViewer = formData?.isViewExternalDicomViewer ?? false;
    const externalDicomViewerPath = formData?.viewerPath ?? '';

    return (
        <div className="space-y-8">
            {/* Section title */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-1">Advanced Settings</h3>
                <p className="text-sm text-ot-text-muted">Configure system-level and viewer options.</p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
                {/* Use System Drives */}
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={useSystemDrives}
                            onChange={(e) => onChange('isSystemDrive', e.target.checked)}
                            id="adv-use-system-drives"
                        />
                        <div
                            className={cn(
                                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
                                useSystemDrives
                                    ? 'bg-ot-action-top border-ot-action-top'
                                    : 'border-ot-border/60 bg-transparent group-hover:border-ot-action-top/60'
                            )}
                        >
                            {useSystemDrives && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    </div>
                    <span className="text-sm font-medium text-ot-text-muted group-hover:text-white transition-colors duration-200">
                        Use System Drives
                    </span>
                </label>

                {/* Auto Burn For Bravo */}
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={autoBurnForBravo}
                            onChange={(e) => onChange('isAutoBurn', e.target.checked)}
                            id="adv-auto-burn-bravo"
                        />
                        <div
                            className={cn(
                                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
                                autoBurnForBravo
                                    ? 'bg-ot-action-top border-ot-action-top'
                                    : 'border-ot-border/60 bg-transparent group-hover:border-ot-action-top/60'
                            )}
                        >
                            {autoBurnForBravo && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    </div>
                    <span className="text-sm font-medium text-ot-text-muted group-hover:text-white transition-colors duration-200">
                        Auto Burn For Bravo
                    </span>
                </label>

                {/* View In External Dicom Viewer */}
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={viewInExternalDicomViewer}
                            onChange={(e) => onChange('isViewExternalDicomViewer', e.target.checked)}
                            id="adv-view-external-dicom"
                        />
                        <div
                            className={cn(
                                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
                                viewInExternalDicomViewer
                                    ? 'bg-ot-action-top border-ot-action-top'
                                    : 'border-ot-border/60 bg-transparent group-hover:border-ot-action-top/60'
                            )}
                        >
                            {viewInExternalDicomViewer && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    </div>
                    <span className="text-sm font-medium text-ot-text-muted group-hover:text-white transition-colors duration-200">
                        View In External Dicom Viewer
                    </span>
                </label>
            </div>

            {/* Configure External Dicom Viewer Path — only enabled when "View In External Dicom Viewer" is checked */}
            <div
                className={cn(
                    'rounded-xl border p-5 transition-all duration-300',
                    viewInExternalDicomViewer
                        ? 'border-ot-action-top/30 bg-ot-action-top/5'
                        : 'border-ot-border/20 bg-ot-bg-top/10 opacity-50 pointer-events-none select-none'
                )}
            >
                <label
                    htmlFor="adv-external-path"
                    className={cn(
                        'block text-sm font-semibold mb-3 transition-colors duration-200',
                        viewInExternalDicomViewer ? 'text-ot-action-top' : 'text-ot-text-muted'
                    )}
                >
                    Configure External Dicom Viewer Path
                </label>
                <FolderPicker
                    value={externalDicomViewerPath}
                    onChange={(val) => onChange('viewerPath', val)}
                    disabled={!viewInExternalDicomViewer}
                    placeholder="e.g. C:\microdicom\microd"
                />
                {!viewInExternalDicomViewer && (
                    <p className="mt-2 text-xs text-ot-text-muted/60">
                        Enable "View In External Dicom Viewer" above to configure the path.
                    </p>
                )}
            </div>
        </div>
    );
};

export default AdvancedSettings;
