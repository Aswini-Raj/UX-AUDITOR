/**
 * Shared Fetch Abstraction Layer
 * Interfaces directly with the FastAPI server running on localhost port 8000.
 */
const BASE_URL = 'http://127.0.0.1:8000/api';

const API = {
    /**
     * Pre-flight URL reachability check before starting a full audit.
     * Returns { valid, status_code, final_url, redirect_count, is_html, message }
     */
    async validateUrl(url, goal) {
        const response = await fetch(`${BASE_URL}/audit/validate-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, goal: goal || 'general' })
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || `URL validation failed (HTTP ${response.status})`);
        }
        return await response.json();
    },

    async startAudit(url, goal) {
        const response = await fetch(`${BASE_URL}/audit/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, goal })
        });
        if (!response.ok) throw new Error('Failed to initialize Orchestrator agent pipeline.');
        return await response.json();
    },

    async getStatus(taskId) {
        const response = await fetch(`${BASE_URL}/audit/status/${taskId}`);
        if (!response.ok) throw new Error(`Error tracking execution for task: ${taskId}`);
        return await response.json();
    },

    async getLatestFindings() {
        const response = await fetch(`${BASE_URL}/audit/latest`);
        if (!response.ok) throw new Error('Could not pull latest audit intelligence profile.');
        return await response.json();
    }
};