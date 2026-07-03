import { studies as studySeed } from '../data/studies';
import { queryStudies as queryStudySeed } from '../data/queryStudies';

const INITIAL_SETTINGS = {
    aeTitle: "RASTERCDBURNER",
    hostIp: "172.17.0.188",
    port: "1112",
    storagePath: "C:\\ImagesBurner",
    compression: "Uncompressed",
    drive: "C: (SSD)",
    maxDiscUsage: 8,
    checkInterval: 30,
    enableBurnAnimation: true
};

export const getStudies = () => {
    const saved = localStorage.getItem('raster_studies');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('raster_studies', JSON.stringify(studySeed));
    return studySeed;
};

export const saveStudies = (studies) => {
    localStorage.setItem('raster_studies', JSON.stringify(studies));
};

export const getQueryStudies = () => {
    return queryStudySeed;
};

export const getSettings = () => {
    const saved = localStorage.getItem('raster_settings');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('raster_settings', JSON.stringify(INITIAL_SETTINGS));
    return INITIAL_SETTINGS;
};

export const saveSettings = (settings) => {
    localStorage.setItem('raster_settings', JSON.stringify(settings));
};

export const deleteStudy = (id) => {
    const current = getStudies();
    const updated = current.filter(s => s.id !== id);
    saveStudies(updated);
    return updated;
};

export const addStudy = (study) => {
    const current = getStudies();
    // Check if already exists
    if (current.some(s => s.patientId === study.patientId && s.studyDate === study.studyDate)) {
        return current;
    }
    const updated = [{ ...study, id: study.id ?? Date.now() }, ...current];
    saveStudies(updated);
    return updated;
};
