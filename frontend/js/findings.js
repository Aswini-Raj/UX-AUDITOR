/**
 * UX Intelligence Findings Layer
 * Renders real audit issues with step labels, 9-category tags, and interactive filters.
 */

// ── 9-category classifier ─────────────────────────────────────────────────────
const CATEGORIES = [
    { key: 'alt',      icon: '🖼️',  label: 'Alt Text',      match: /alt|image.*missing|missing.*alt/i },
    { key: 'label',    icon: '🏷️',  label: 'Form Labels',   match: /label|unlabeled|input.*missing|missing.*label/i },
    { key: 'aria',     icon: '♿',   label: 'ARIA',          match: /aria|accessible name|role=/i },
    { key: 'contrast', icon: '🎨',  label: 'Color Contrast',match: /contrast|color.*ratio|4\.5:1/i },
    { key: 'heading',  icon: '📑',  label: 'Headings',      match: /heading|h1|h2|h3|document outline/i },
    { key: 'touch',    icon: '👆',  label: 'Touch Targets', match: /touch.*target|44px|click.*small|small.*button/i },
    { key: 'mobile',   icon: '📱',  label: 'Mobile',        match: /mobile|viewport|responsive|screen size/i },
    { key: 'links',    icon: '🔗',  label: 'Broken Links',  match: /broken.*link|unreachable|404|link.*fail/i },
    { key: 'friction', icon: '⚡',  label: 'UX Friction',   match: /friction|password|autocomplete|long form|wizard|error.*message/i },
];

function detectCategory(issue) {
    const haystack = `${issue.title} ${issue.description} ${issue.root_cause}`;
    for (const cat of CATEGORIES) {
        if (cat.match.test(haystack)) return cat;
    }
    return issue.type === 'WCAG'
        ? { icon: '♿', label: 'Accessibility', key: 'wcag' }
        : { icon: '⚡', label: 'UX Friction',   key: 'friction' };
}

// ── Step label helper ─────────────────────────────────────────────────────────
const STEP_LABELS = {
    'step-1': { label: 'Step 1 · Home',     color: '#818cf8' },
    'step-2': { label: 'Step 2 · Auth',     color: '#34d399' },
    'step-3': { label: 'Step 3 · Checkout', color: '#f59e0b' },
};

function getStepBadge(stepId) {
    const s = STEP_LABELS[stepId];
    if (!s) return '';
    return `<span style="
        font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:999px;
        background:${s.color}22; color:${s.color}; border:1px solid ${s.color}44;
        letter-spacing:0.04em; white-space:nowrap;
    ">${s.label}</span>`;
}

// ── Category breakdown builder ────────────────────────────────────────────────
function buildCategoryBreakdown(issues) {
    const counts = {};
    issues.forEach(issue => {
        const cat = detectCategory(issue);
        counts[cat.key] = (counts[cat.key] || { ...cat, count: 0 });
        counts[cat.key].count++;
    });

    const activeCategories = Object.values(counts).filter(c => c.count > 0);
    if (!activeCategories.length) return '';

    return `
        <div style="
            display:flex; flex-wrap:wrap; gap:0.5rem;
            padding:1rem 1.25rem; margin-bottom:1.25rem;
            background:rgba(99,102,241,0.06); border-radius:10px;
            border:1px solid rgba(99,102,241,0.15);
        ">
            <span style="font-size:0.76rem;font-weight:700;color:var(--text-muted);align-self:center;margin-right:0.25rem;">CATEGORIES DETECTED:</span>
            ${activeCategories.map(c => `
                <span style="
                    font-size:0.78rem; font-weight:600; padding:3px 10px; border-radius:999px;
                    background:var(--bg-elevated); border:1px solid var(--border-color);
                    color:var(--text-secondary); display:flex; align-items:center; gap:4px;
                ">
                    ${c.icon} ${c.label}
                    <span style="
                        background:rgba(239,68,68,0.18); color:#fca5a5;
                        border-radius:999px; padding:0 6px; font-size:0.7rem; font-weight:800;
                    ">${c.count}</span>
                </span>
            `).join('')}
        </div>`;
}

// ── Filter state ──────────────────────────────────────────────────────────────
let activeFilters = { severity: 'all', type: 'all' };

function applyFilters() {
    document.querySelectorAll('.issue-card').forEach(card => {
        const sev   = card.dataset.severity || '';
        const type  = card.dataset.type     || '';
        const showSev  = activeFilters.severity === 'all' || sev  === activeFilters.severity;
        const showType = activeFilters.type     === 'all' || type === activeFilters.type;
        card.style.display = (showSev && showType) ? 'block' : 'none';
    });
}

window.filterBySeverity = function (severity, btn) {
    document.querySelectorAll('.filter-btn[data-sev]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilters.severity = severity;
    applyFilters();
};

window.filterByType = function (type, btn) {
    document.querySelectorAll('.filter-btn[data-type-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilters.type = type;
    applyFilters();
};

// ── Main render ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const wrapper = document.getElementById('issuesWrapper');
    if (!wrapper) return;

    // Inject type filter buttons into the existing filter-bar
    const filterBar = document.querySelector('.filter-bar');
    if (filterBar) {
        filterBar.insertAdjacentHTML('beforeend', `
            <span style="width:1px;height:20px;background:var(--border-color);display:inline-block;margin:0 4px;"></span>
            <button class="filter-btn active" data-type-filter onclick="filterByType('all', this)">All Types</button>
            <button class="filter-btn" data-type-filter onclick="filterByType('WCAG', this)">♿ WCAG</button>
            <button class="filter-btn" data-type-filter onclick="filterByType('Friction', this)">⚡ Friction</button>
        `);

        // Wire severity buttons to new handler
        document.querySelectorAll('.filter-btn[onclick*="filterIssues"]').forEach(btn => {
            const match = btn.getAttribute('onclick').match(/filterIssues\('(\w+)'/);
            if (match) {
                btn.setAttribute('data-sev', match[1]);
                btn.setAttribute('onclick', `filterBySeverity('${match[1]}', this)`);
            }
        });
    }

    try {
        const taskId = localStorage.getItem('currentTaskId');
        let auditData;

        if (taskId) {
            auditData = await API.getStatus(taskId);
            // If still processing, fall back to latest completed
            if (auditData.status !== 'completed') {
                auditData = await API.getLatestFindings();
            }
        } else {
            auditData = await API.getLatestFindings();
        }

        // Update score metrics
        document.getElementById('navClarity').innerText   = auditData.heuristic_score || '--';
        document.getElementById('a11yFailures').innerText = (auditData.issues || []).filter(i => i.type === 'WCAG').length;
        document.getElementById('frictionEvents').innerText = (auditData.issues || []).filter(i => i.type === 'Friction').length;

        wrapper.innerHTML = '';

        if (!auditData.issues || !auditData.issues.length) {
            wrapper.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <strong>No issues registered for this workspace yet.</strong>
                    <p style="margin-top:0.5rem;font-size:0.88rem;">Start an audit from the Initialization page to generate findings.</p>
                </div>`;
            return;
        }

        // Category breakdown row
        wrapper.insertAdjacentHTML('beforebegin', buildCategoryBreakdown(auditData.issues));

        // Issue cards
        auditData.issues.forEach(issue => {
            const severityClass = (issue.severity || 'low').toLowerCase();
            const cat           = detectCategory(issue);
            const stepBadge     = getStepBadge(issue.step_id);

            wrapper.innerHTML += `
                <div class="issue-card ${severityClass}"
                     data-severity="${severityClass}"
                     data-type="${issue.type || ''}">
                    <div class="issue-header">
                        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:0.5rem;">
                            <span class="badge badge-${severityClass}">${issue.severity}</span>
                            <span style="
                                font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:999px;
                                background:rgba(99,102,241,0.12); color:#a5b4fc;
                                border:1px solid rgba(99,102,241,0.25); white-space:nowrap;
                            ">${cat.icon} ${cat.label}</span>
                            ${stepBadge}
                            <strong style="font-size:1.05rem; color:var(--text-primary);">${issue.title}</strong>
                        </div>
                        <span style="font-size:0.82rem; color:var(--text-muted); font-weight:700; white-space:nowrap;">${issue.type} AGENT</span>
                    </div>
                    <p style="color:var(--text-secondary);font-size:0.95rem;margin-top:0.5rem;">${issue.description}</p>
                    <div class="analysis-block">
                        <strong>🕵️ Root Cause Analysis:</strong> ${issue.root_cause}
                    </div>
                </div>`;
        });

    } catch (err) {
        wrapper.innerHTML = `<p style="color:var(--danger)">Error loading runtime findings layer: ${err.message}</p>`;
    }
});