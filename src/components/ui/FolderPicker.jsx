import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, Disc3, FolderOpenDot, ArrowLeft } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import api from 'src/lib/api';
import { cn } from 'src/lib/utils';
import { toast } from 'sonner';

export default function FolderPicker({
    value = '',
    onChange,
    placeholder = 'Select or type a folder path…',
    disabled = false,
    className,
}) {
    const [showFolderBrowser, setShowFolderBrowser] = useState(false);
    const [drives, setDrives] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentPath, setCurrentPath] = useState('');
    const folderBrowserRef = useRef(null);

    const loadDrives = async () => {
        if (disabled) return;
        if (showFolderBrowser) {
            setShowFolderBrowser(false);
            return;
        }

        try {
            const res = await api.get('/drive/list');
            setDrives(res.data || []);
            setFolders([]);
            setCurrentPath('');
            setShowFolderBrowser(true);
        } catch (error) {
            console.error('Failed to load drives:', error);
            toast.error(error?.response?.data?.message || error.message || 'Failed to load drives');
        }
    };

    const loadFolders = async (path) => {
        if (disabled) return;
        try {
            const res = await api.get(`/drive/folders/?path=${encodeURIComponent(path)}`);
            setFolders(res.data || []);
            setCurrentPath(path);
        } catch (error) {
            console.error(`Failed to load folders for path: ${path}`, error);
            toast.error(error?.response?.data?.message || error.message || `Failed to load folders for path: ${path}`);
        }
    };

    const handleBack = () => {
        if (!currentPath) return;

        // Handle both Windows backslash and Linux forward slash
        const isBackslash = currentPath.includes('\\');
        const separator = isBackslash ? '\\' : '/';

        let cleanPath = currentPath;
        if (cleanPath.endsWith(separator)) {
            cleanPath = cleanPath.slice(0, -1);
        }
        const parts = cleanPath.split(separator);

        if (parts.length <= 1) {
            setCurrentPath('');
            setFolders([]);
        } else {
            const parent = parts.slice(0, -1).join(separator) + separator;
            loadFolders(parent);
        }
    };

    const handleDriveSelect = (drive) => {
        // Notify parent
        onChange(drive);
        loadFolders(drive);
    };

    const handleFolderSelect = (folder) => {
        const isBackslash = currentPath ? currentPath.includes('\\') : true; // default Windows
        const separator = isBackslash ? '\\' : '/';

        let basePath = currentPath;
        if (basePath && !basePath.endsWith(separator)) {
            basePath += separator;
        }

        const newPath = `${basePath}${folder}${separator}`;
        onChange(newPath);
        loadFolders(newPath);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                folderBrowserRef.current &&
                !folderBrowserRef.current.contains(event.target)
            ) {
                setShowFolderBrowser(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={cn("relative flex items-center w-full", className)}>
            <Input
                className={cn(
                    "w-full bg-ot-bg-top/30 border border-ot-border/50 text-white rounded-xl py-2 px-4 pr-12 focus:outline-none focus:border-ot-action-top transition-all text-sm shadow-inner placeholder:text-ot-text-muted/50",
                    disabled && "opacity-50 pointer-events-none"
                )}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-ot-text-muted hover:text-white transition-all active:scale-90",
                    disabled && "cursor-not-allowed opacity-50"
                )}
                onClick={loadDrives}
            >
                <FolderOpen size={16} />
            </Button>

            {showFolderBrowser && !disabled && (
                <div
                    ref={folderBrowserRef}
                    className="absolute top-full left-0 mt-2 w-full bg-ot-bg-mid border border-ot-border rounded-xl shadow-2xl z-[9999] max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-ot-border/30 bg-ot-bg-top/20">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-ot-text-muted truncate">
                            {currentPath || 'Select Drive'}
                        </span>
                    </div>

                    {/* Back Button */}
                    {currentPath && (
                        <button
                            type="button"
                            className="w-full text-left cursor-pointer px-4 py-2.5 hover:bg-ot-action-top/10 text-xs font-semibold text-ot-text-muted hover:text-white border-b border-ot-border/20 transition-all flex items-center gap-1.5"
                            onClick={handleBack}
                        >
                            <ArrowLeft size={12} /> Back
                        </button>
                    )}

                    {/* Drives */}
                    {!currentPath && drives.length === 0 && (
                        <div className="p-4 text-xs text-ot-text-muted italic text-center">
                            No drives found
                        </div>
                    )}
                    {!currentPath &&
                        drives.map((drive) => (
                            <button
                                key={drive}
                                type="button"
                                className="w-full text-left cursor-pointer px-4 py-2.5 hover:bg-ot-action-top/10 flex items-center gap-3 text-xs uppercase tracking-wider font-bold text-white transition-colors"
                                onClick={() => handleDriveSelect(drive)}
                            >
                                <Disc3 size={14} className="text-ot-action-top animate-spin-slow" />
                                <span>{drive}</span>
                            </button>
                        ))}

                    {/* Folders */}
                    {currentPath && folders.length === 0 && (
                        <div className="p-4 text-xs text-ot-text-muted italic text-center">
                            Empty folder
                        </div>
                    )}
                    {currentPath &&
                        folders.map((folder) => (
                            <button
                                key={folder}
                                type="button"
                                className="w-full text-left cursor-pointer px-4 py-2.5 hover:bg-ot-action-top/10 flex items-center gap-3 text-sm text-white transition-colors"
                                onClick={() => handleFolderSelect(folder)}
                            >
                                <FolderOpenDot size={14} className="text-ot-action-top/80" />
                                <span>{folder}</span>
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}
