import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import FolderPicker from '../ui/FolderPicker';

const COMPRESSION_OPTIONS = [
  { label: 'Uncompressed', value: 'UnCompressed' },
  { label: 'JPEG Lossless', value: 'JPEG Lossless' },
  { label: 'JPEG 2000', value: 'JPEG 2000' },
  { label: 'RLE Lossless', value: 'RLE Lossless' },
];


function MultiSelectCompression({ selected = [], onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allSelected = COMPRESSION_OPTIONS.every((o) => selected.includes(o.value));

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(COMPRESSION_OPTIONS.map((o) => o.value));
    }
  };

  const toggleOption = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  // Display text inside the trigger
  const displayText =
    selected.length === 0
      ? 'Select compression'
      : allSelected
        ? 'All Compressions'
        : COMPRESSION_OPTIONS.filter((o) => selected.includes(o.value))
          .map((o) => o.label)
          .join(', ');

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between bg-ot-bg-top/50 border border-ot-border/50 text-white rounded-xl h-10 px-4 text-xs font-bold uppercase tracking-widest hover:border-ot-action-top/50 focus:outline-none focus:ring-1 focus:ring-ot-action-top transition-all"
      >
        <span className="truncate text-left normal-case font-normal text-sm">
          {selected.length === 0 ? (
            <span className="text-ot-text-muted">{displayText}</span>
          ) : (
            displayText
          )}
        </span>
        <ChevronDown
          size={14}
          className={`ml-2 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[9999] mt-1 w-full bg-ot-bg-mid border border-ot-border/50 rounded-xl shadow-2xl backdrop-blur-2xl overflow-hidden">
          {/* Select All row */}
          <button
            type="button"
            onClick={toggleAll}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs uppercase tracking-widest font-bold border-b border-ot-border/30 hover:bg-ot-action-top/10 transition-colors text-white"
          >
            <span
              className={`h-4 w-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${allSelected
                ? 'bg-ot-action-top border-ot-action-top'
                : 'border-ot-border/60 bg-transparent'
                }`}
            >
              {allSelected && <Check size={10} strokeWidth={3} />}
            </span>
            Select All
          </button>

          {/* Individual options */}
          {COMPRESSION_OPTIONS.map((opt) => {
            const isChecked = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleOption(opt.value)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs uppercase tracking-widest hover:bg-ot-action-top/10 transition-colors text-white"
              >
                <span
                  className={`h-4 w-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${isChecked
                    ? 'bg-ot-action-top border-ot-action-top'
                    : 'border-ot-border/60 bg-transparent'
                    }`}
                >
                  {isChecked && <Check size={10} strokeWidth={3} />}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LocalDicomSettings
// ---------------------------------------------------------------------------
function LocalDicomSettings({ formData, onChange }) {
  // Parse compression: stored as comma-separated string or array
  const compressionValue = formData.compression || '';
  const selectedCompressions = Array.isArray(compressionValue)
    ? compressionValue
    : compressionValue
      ? compressionValue.split(',').map((v) => v.trim()).filter(Boolean)
      : [];

  const handleCompressionChange = (newSelected) => {
    onChange('compression', newSelected.join(','));
  };

  const fields = [
    { label: 'AE Title', field: 'aeTitle', type: 'input' },
    { label: 'Host/IP Address', field: 'hostIPAddress', type: 'input' },
    { label: 'Port', field: 'hostPort', type: 'input' },
    { label: 'Image Storage Path', field: 'imageStoragePath', type: 'path' },
    { label: 'Compression', field: 'compression', type: 'multiselect' },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-8">
        {fields.map((item) => (
          <div key={item.label} className="flex flex-col gap-2">
            <Label className="text-[10px] uppercase tracking-widest text-ot-text-muted font-bold ml-1">
              {item.label}
            </Label>

            {item.type === 'path' ? (
              <FolderPicker
                value={formData[item.field] || ''}
                onChange={(val) => onChange(item.field, val)}
                placeholder="Select or type a folder path…"
              />
            ) : item.type === 'multiselect' ? (
              <MultiSelectCompression
                selected={selectedCompressions}
                onChange={handleCompressionChange}
              />
            ) : (
              <Input
                className="w-full bg-ot-bg-top/30 border border-ot-border/50 text-white rounded-xl py-2 px-4 focus:outline-none focus:border-ot-action-top transition-all text-sm shadow-inner"
                value={formData[item.field] || ''}
                onChange={(e) => onChange(item.field, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default LocalDicomSettings;
