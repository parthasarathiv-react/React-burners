import React, { useState } from 'react';
import { Search, Calendar, User, Hash, RotateCcw } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const MODALITIES = [
  { label: 'All Modalities', value: 'all' },
  { label: 'CR (Computed Radiography)', value: 'CR' },
  { label: 'CT (Computed Tomography)', value: 'CT' },
  { label: 'MR (Magnetic Resonance)', value: 'MR' },
  { label: 'US (Ultrasound)', value: 'US' },
  { label: 'SC (Secondary Capture)', value: 'SC' },
];

function SearchBar({ onSearch }) {
  const [criteria, setCriteria] = useState({
    patientName: '',
    patientId: '',
    studyDate: '',
    modality: ''
  });

  const handleChange = (field, value) => {
    // Convert the sentinel 'all' back to '' for filtering
    const actualValue = value === 'all' ? '' : value;
    const updated = { ...criteria, [field]: actualValue };
    setCriteria(updated);
    onSearch(updated);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-ot-bg-mid/30 p-4 rounded-2xl border border-ot-border/20 backdrop-blur-sm animate-in slide-in-from-top-4 duration-500">
      {/* Patient Name */}
      <div className="relative group">
        <Input
          icon={User}
          type="text"
          placeholder="Patient Name"
          className="w-full bg-ot-bg-top/50 border border-ot-border/50 text-white rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-ot-action-top transition-all"
          value={criteria.patientName}
          onChange={(e) => handleChange('patientName', e.target.value)}
        />
      </div>

      {/* Patient ID */}
      <div className="relative group">
        <Input
          icon={Hash}
          type="text"
          placeholder="Patient ID"
          className="w-full bg-ot-bg-top/50 border border-ot-border/50 text-white rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-ot-action-top transition-all"
          value={criteria.patientId}
          onChange={(e) => handleChange('patientId', e.target.value)}
        />
      </div>

      {/* Study Date */}
      <div className="relative group">
        <Input
          icon={Calendar}
          type="text"
          placeholder="Study Date"
          className="w-full bg-ot-bg-top/50 border border-ot-border/50 text-white rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-ot-action-top transition-all"
          value={criteria.studyDate}
          onChange={(e) => handleChange('studyDate', e.target.value)}
        />
      </div>

      {/* Modality Select */}
      <Select
        value={criteria.modality === '' ? 'all' : criteria.modality}
        onValueChange={(val) => handleChange('modality', val)}
      >
        <SelectTrigger className="w-full bg-ot-bg-top/50 border border-ot-border/50 text-white rounded-xl h-10 px-4 text-xs font-bold uppercase tracking-widest hover:border-ot-action-top/50 focus:ring-1 focus:ring-ot-action-top data-[state=open]:border-ot-action-top">
          <SelectValue placeholder="Modality" />
        </SelectTrigger>
        <SelectContent className="bg-ot-bg-mid border border-ot-border/50 rounded-xl text-white z-[9999] backdrop-blur-2xl">
          {MODALITIES.map((opt) => (
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

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => onSearch(criteria)}
          className="bg-ot-action-top hover:bg-ot-action-hover-top text-white rounded-xl px-6 py-2.5 flex items-center justify-center gap-2 flex-1 font-bold text-sm transition-all shadow-lg shadow-ot-action-top/20 active:scale-95"
        >
          <Search size={18} />
          Search
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const cleared = {
              patientName: '',
              patientId: '',
              studyDate: '',
              modality: '',
            };
            setCriteria(cleared);
            onSearch(cleared);
          }}
          title="Clear Filters"
          className="flex items-center justify-center w-10 h-10 rounded-xl border border-red-500/40 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 shadow-sm hover:shadow-red-500/30 active:scale-95"
        >
          <RotateCcw size={18} strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  );
}

export default SearchBar;
