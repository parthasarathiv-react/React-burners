/**
 * templateApi.js
 * API service for CD Label Template CRUD and image upload.
 * Uses the shared axios `api` instance (same as all other APIs in the project).
 */

import api from '../lib/api';

// ─── Template APIs ────────────────────────────────────────────────────────────

/**
 * GET /api/templates
 * Returns list of templates
 */
export async function getTemplates() {
    const response = await api.get('/templates');
    return response.data;
}

/**
 * GET /api/templates/:id
 */
export async function getTemplate(id) {
    const response = await api.get(`/templates/${id}`);
    return response.data;
}

/**
 * POST /api/templates
 * Body: { name, width, height, objects }
 */
export async function createTemplate(payload) {
    const response = await api.post('/templates', payload);
    return response.data;
}

/**
 * PUT /api/templates/:id
 * Body: { name, width, height, objects }
 */
export async function updateTemplate(id, payload) {
    const response = await api.put(`/templates/update/${id}`, payload);
    return response.data;
}

/**
 * DELETE /api/templates/:id
 */
export async function deleteTemplate(id) {
    const response = await api.delete(`/templates/delete/${id}`);
    return response.data;
}

// ─── Image Upload API ─────────────────────────────────────────────────────────

/**
 * POST /api/templates/upload-image
 * Uploads a file and returns { path: '/assets/logo.png' }
 */
export async function uploadImage(file) {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post('/templates/upload-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

// ─── Burn Job API ─────────────────────────────────────────────────────────────

/**
 * POST /api/burnjobs
 * Body: { templateId, studyInstanceUID, ... }
 */
export async function createBurnJob(payload) {
    const response = await api.post('/burnjobs', payload);
    return response.data;
}
