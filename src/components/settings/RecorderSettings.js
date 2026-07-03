import React from 'react';
import { Disc3 } from 'lucide-react';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import FolderPicker from '../ui/FolderPicker';

const RECORDER_OPTIONS = [
    { label: 'Bravo', value: 'Bravo' },
    { label: 'Rimage', value: 'Rimage' },
    { label: 'Epson', value: 'Epson' },
    { label: 'Other', value: 'Other' },
];

function RecorderSettings({ formData, onChange }) {
    const recorder = formData?.recorder ?? '';
    const burnContentPath = formData?.burnContentPath ?? '';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Section header */}
            <div>
                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    <Disc3 className="text-ot-action-top" size={20} />
                    Recorder Settings
                </h3>
                <p className="text-sm text-ot-text-muted">
                    Configure the disc recorder device and content burn path.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {/* Recorder dropdown */}
                <div className="flex flex-col gap-2">
                    <Label className="text-[10px] uppercase tracking-widest text-ot-text-muted font-bold ml-1">
                        Recorder
                    </Label>
                    <Select
                        value={recorder}
                        onValueChange={(val) => onChange('recorder', val)}
                    >
                        <SelectTrigger className="w-full bg-ot-bg-top/50 border border-ot-border/50 text-white rounded-xl h-10 px-4 text-xs font-bold uppercase tracking-widest hover:border-ot-action-top/50 focus:ring-1 focus:ring-ot-action-top data-[state=open]:border-ot-action-top">
                            <SelectValue placeholder="Select recorder" />
                        </SelectTrigger>
                        <SelectContent className="bg-ot-bg-mid border border-ot-border/50 rounded-xl text-white z-[9999] backdrop-blur-2xl">
                            {RECORDER_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-xs uppercase tracking-widest cursor-pointer focus:bg-ot-action-top/10 focus:text-white"
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Burn Content Path */}
                <div className="flex flex-col gap-2">
                    <Label className="text-[10px] uppercase tracking-widest text-ot-text-muted font-bold ml-1">
                        Burn Content of this Folder onto CD/DVD
                    </Label>
                    <FolderPicker
                        value={burnContentPath}
                        onChange={(val) => onChange('burnContentPath', val)}
                        placeholder="e.g. D:\microdicom"
                    />
                </div>
            </div>
        </div>
    );
}

export default RecorderSettings;
