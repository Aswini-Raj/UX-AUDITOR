/**
 * Audit Lifecycle Initialization Handler
 * Manages the form state machine, session persistence,
 * and coordinates redirects into the live dashboard on submission.
 */

let currentAuditSession = null;

document.addEventListener("DOMContentLoaded", () => {
    // Restore last audit URL if we have one
    const savedUrl = localStorage.getItem('currentAuditUrl');
    const urlInput = document.getElementById('targetUrl');
    if (urlInput && savedUrl && savedUrl !== 'No Active Target Workspace') {
        urlInput.value = savedUrl;
    }

    // Bind option card click state
    bindOptionCardState();

    // Bind audit form submission
    const auditForm = document.getElementById('auditForm');
    if (auditForm) {
        auditForm.addEventListener('submit', handleAuditSubmit);
    }
});

/**
 * Applies consistent selected state management to goal option cards.
 */
function bindOptionCardState() {
    const cards = document.querySelectorAll('.option-card');
    cards.forEach(card => {
        card.addEventListener('click', function () {
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                cards.forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
            }
        });
    });

    // Set initial selection display
    const checkedRadio = document.querySelector('.option-card input[type="radio"]:checked');
    if (checkedRadio) {
        checkedRadio.closest('.option-card')?.classList.add('selected');
    }
}

/**
 * Handles the full audit initialization flow:
 * 1. Validates form inputs
 * 2. Calls backend to start audit
 * 3. Stores session data
 * 4. Redirects to live dashboard
 */
async function handleAuditSubmit(event) {
    event.preventDefault();

    const btn = document.getElementById('submitBtn');
    const urlInput = document.getElementById('targetUrl');
    const goalRadio = document.querySelector('input[name="goal"]:checked');

    if (!urlInput || !goalRadio) return;

    const targetUrl = urlInput.value.trim();
    const goal = goalRadio.value;

    if (!targetUrl) {
        showAuditError('Please enter a valid target URL to continue.');
        return;
    }

    // ── Phase 1: URL pre-flight reachability check ─────────────────────────
    setSubmitLoading(btn, true, 'Validating URL…');

    try {
        const validation = await API.validateUrl(targetUrl, goal);

        if (!validation.valid) {
            setSubmitLoading(btn, false);
            showAuditError(
                `URL returned HTTP ${validation.status_code}. ` +
                'Please check that the address is correct and publicly accessible.'
            );
            return;
        }

        if (!validation.is_html) {
            setSubmitLoading(btn, false);
            showAuditError(
                `The URL does not return an HTML page (got: ${validation.content_type}). ` +
                'Only web pages can be audited.'
            );
            return;
        }

        // Non-blocking redirect notice
        if (validation.redirect_count > 0 && validation.final_url !== targetUrl) {
            showAuditInfo(
                `ℹ️ Redirects ${validation.redirect_count}x → ${validation.final_url}`
            );
        }

    } catch (err) {
        setSubmitLoading(btn, false);
        showAuditError(`URL validation failed: ${err.message}`);
        return;
    }

    // ── Phase 2: Start the full multi-agent audit ───────────────────────────
    setSubmitLoading(btn, true, 'Initializing Orchestrator…');

    const payload = { url: targetUrl, goal };

    // Persist context into localStorage for dashboard/footer access
    localStorage.setItem('currentAuditUrl', targetUrl);
    localStorage.setItem('currentAuditGoal', goal);
    localStorage.setItem('auditStartTime', new Date().toISOString());

    try {
        const response = await fetch('https://ux-auditor-backend.onrender.com/api/audit/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        currentAuditSession = {
            taskId: data.task_id,
            url: targetUrl,
            goal: goal,
            startedAt: new Date().toISOString()
        };

        // Store task ID for dashboard polling
        localStorage.setItem('currentTaskId', data.task_id);

        // Brief delay for UX polish, then redirect to live workspace
        setTimeout(() => {
            window.location.href = `dashboard.html?task_id=${data.task_id}`;
        }, 600);

    } catch (err) {
        console.error('Audit initialization error:', err);
        setSubmitLoading(btn, false);
        showAuditError(
            'Could not connect to the backend server. ' +
            'Please ensure the Python server is running on port 8000 and try again.'
        );
    }
}

/**
 * Updates the submit button to display a loading spinner state.
 */
function setSubmitLoading(btn, isLoading, label = 'Initializing Orchestrator…') {
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                 stroke-linejoin="round" style="animation: spin 1s linear infinite;">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            ${label}
        `;
    } else {
        btn.disabled = false;
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/>
                <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
                <path d="M12 2v2"/>
                <path d="M12 22v-2"/>
                <path d="m17 20.66-1-1.73"/>
                <path d="M11 10.27 7 3.34"/>
                <path d="m20.66 17-1.73-1"/>
                <path d="m3.34 7 1.73 1"/>
                <path d="M14 12h8"/>
                <path d="M2 12h2"/>
                <path d="m20.66 7-1.73 1"/>
                <path d="m3.34 17 1.73-1"/>
                <path d="m17 3.34-1 1.73"/>
                <path d="m11 13.73-4 6.93"/>
            </svg>
            Initialize Orchestrator Agent
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

/**
 * Displays an inline error message below the submit button.
 */
function showAuditError(message) {
    // Remove any existing error/info
    ['auditErrorMsg', 'auditInfoMsg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    const errorDiv = document.createElement('div');
    errorDiv.id = 'auditErrorMsg';
    errorDiv.style.cssText = `
        margin-top: 0.75rem;
        padding: 0.75rem 1rem;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 8px;
        color: #fca5a5;
        font-size: 0.88rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: fadeInUp 0.3s ease;
    `;
    errorDiv.innerHTML = `⚠️ ${message}`;

    const submitWrap = document.querySelector('.submit-btn-wrap');
    if (submitWrap) {
        submitWrap.appendChild(errorDiv);
        // Auto-dismiss after 6 seconds
        setTimeout(() => errorDiv.remove(), 6000);
    }
}

/**
 * Displays a non-blocking informational notice (redirect info, etc.).
 */
function showAuditInfo(message) {
    const existing = document.getElementById('auditInfoMsg');
    if (existing) existing.remove();

    const infoDiv = document.createElement('div');
    infoDiv.id = 'auditInfoMsg';
    infoDiv.style.cssText = `
        margin-top: 0.6rem;
        padding: 0.6rem 1rem;
        background: rgba(6, 182, 212, 0.1);
        border: 1px solid rgba(6, 182, 212, 0.3);
        border-radius: 8px;
        color: #67e8f9;
        font-size: 0.82rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: fadeInUp 0.3s ease;
        font-family: 'Fira Code', monospace;
    `;
    infoDiv.innerHTML = message;

    const submitWrap = document.querySelector('.submit-btn-wrap');
    if (submitWrap) submitWrap.appendChild(infoDiv);
}

/**
 * Returns the active audit session context object.
 */
function getAuditSession() {
    return currentAuditSession || {
        taskId: localStorage.getItem('currentTaskId'),
        url: localStorage.getItem('currentAuditUrl'),
        goal: localStorage.getItem('currentAuditGoal'),
        startedAt: localStorage.getItem('auditStartTime')
    };
}
