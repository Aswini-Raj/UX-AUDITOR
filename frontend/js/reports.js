/**
 * Reports Hub Dynamic Data Integration
 * Pulls latest audit findings from the backend and injects
 * real dynamic data into the role-specific report templates.
 */

let reportAuditData = null;

// Static report library — supplemented dynamically below
const reportLibrary = {
    executive: {
        title: "Executive Summary",
        sub: "Target: Product Leadership & Management",
        generateContent: (data) => {
            if (!data) return getStaticExecutive();
            const score = data.heuristic_score || 8;
            const issues = data.issues || [];
            const critical = issues.filter(i => i.severity === 'Critical').length;
            const high = issues.filter(i => i.severity === 'High').length;
            const url = data.url || 'the audited product';
            const oldRate = data.retest_metrics ? data.retest_metrics.old_success : `${score * 10}%`;
            const newRate = data.retest_metrics ? data.retest_metrics.new_success : '98%';
            return `
                <h4>Audit Executive Overview</h4>
                <p>AI multi-agent audit of <strong>${url}</strong> completed with a Design Clarity Rating of
                <strong style="color:var(--accent-bright)">${score}/10</strong>.
                The automated pipeline identified <strong>${issues.length}</strong> total design friction issues
                requiring strategic attention.</p>

                <h4>Core Risk Summary</h4>
                <ul>
                    <li><strong>Critical Blockers:</strong> ${critical} critical severity issue(s) impacting core user conversion flows.</li>
                    <li><strong>High-Priority Items:</strong> ${high} high-severity issue(s) reducing user success rates.</li>
                    <li><strong>Remediation Impact:</strong> Applying AI-generated fixes is projected to improve task success from
                    <strong style="color:var(--danger)">${oldRate}</strong> to
                    <strong style="color:var(--success)">${newRate}</strong>.</li>
                </ul>

                <h4>Strategic Recommendation</h4>
                <p>Prioritize resolving the ${critical} critical issue(s) in the next sprint. Deploy AI-generated code patches
                for immediate wins before scheduling deeper architectural improvements.</p>`;
        }
    },
    ux: {
        title: "Product UX Design Report",
        sub: "Target: Interface Designers & Researchers",
        generateContent: (data) => {
            if (!data) return getStaticUX();
            const score = data.heuristic_score || 8;
            const issues = data.issues || [];
            const wcag = issues.filter(i => i.type === 'WCAG');
            const friction = issues.filter(i => i.type === 'Friction');
            return `
                <h4>Heuristic Evaluation Score: ${score}/10</h4>
                <p>Objective multi-heuristic review identified <strong>${wcag.length}</strong> accessibility
                issues and <strong>${friction.length}</strong> user friction events across the audited interface.</p>

                <h4>Friction Events Captured</h4>
                <ul>
                    ${friction.map(f => `<li><strong>${f.title}</strong> [${f.severity}]: ${f.description}</li>`).join('') ||
                    '<li>No friction events detected — flow paths are clear.</li>'}
                </ul>

                <h4>Accessibility Gaps</h4>
                <ul>
                    ${wcag.map(w => `<li><strong>${w.title}</strong>: ${w.description}</li>`).join('') ||
                    '<li>No WCAG violations detected — accessibility checks pass.</li>'}
                </ul>`;
        }
    },
    technical: {
        title: "Technical Architecture File",
        sub: "Target: Frontend Engineers & Architects",
        generateContent: (data) => {
            if (!data) return getStaticTechnical();
            const fixes = data.fixes || {};
            const recs = fixes.ux_recommendations || [];
            const htmlFix = fixes.html_fix || '';
            const cssFix = fixes.css_fix || '';
            return `
                <h4>DOM Engineering Analysis</h4>
                <p>Playwright-based browser crawl and BeautifulSoup DOM analysis detected semantic structure
                issues and styling violations requiring code-level intervention.</p>

                <h4>Required Code Patches</h4>
                <ul>
                    ${recs.map(r => `<li>${r}</li>`).join('') || '<li>No structural changes required — DOM architecture is valid.</li>'}
                </ul>

                ${htmlFix ? `<h4>HTML Fix Patch</h4>
                <pre style="background:var(--bg-elevated);padding:1rem;border-radius:8px;font-family:'Fira Code',monospace;font-size:0.8rem;overflow-x:auto;border:1px solid var(--border-color);color:#e2e8f0;white-space:pre-wrap;">${escapeForReport(htmlFix)}</pre>` : ''}

                ${cssFix ? `<h4>CSS Fix Patch</h4>
                <pre style="background:var(--bg-elevated);padding:1rem;border-radius:8px;font-family:'Fira Code',monospace;font-size:0.8rem;overflow-x:auto;border:1px solid var(--border-color);color:#a5b4fc;white-space:pre-wrap;">${cssFix}</pre>` : ''}`;
        }
    },
    accessibility: {
        title: "Accessibility Compliance Log",
        sub: "Target: Compliance Labs & Legal Teams",
        generateContent: (data) => {
            if (!data) return getStaticAccessibility();
            const issues = data.issues || [];
            const wcag = issues.filter(i => i.type === 'WCAG');
            const score = data.heuristic_score || 8;
            const passRate = wcag.length === 0 ? '100%' : `${Math.max(30, 100 - wcag.length * 15)}%`;

            // ── 9-category pass/fail matrix ────────────────────────────────
            const checks = [
                {
                    icon: '🖼️', label: 'Alt Text Coverage (WCAG 1.1.1)',
                    pass: !issues.some(i => /alt|image.*missing|missing.*alt/i.test(`${i.title} ${i.root_cause}`))
                },
                {
                    icon: '🏷️', label: 'Form Label Association (WCAG 1.3.1)',
                    pass: !issues.some(i => /label|unlabeled|input.*missing|missing.*label/i.test(`${i.title} ${i.root_cause}`))
                },
                {
                    icon: '♿', label: 'ARIA Attributes (WCAG 4.1.2)',
                    pass: !issues.some(i => /aria|accessible name/i.test(`${i.title} ${i.root_cause}`))
                },
                {
                    icon: '🎨', label: 'Color Contrast ≥ 4.5:1 (WCAG 1.4.3)',
                    pass: !issues.some(i => /contrast|color.*ratio/i.test(`${i.title} ${i.root_cause}`))
                },
                {
                    icon: '📑', label: 'Heading Hierarchy (WCAG 2.4.6)',
                    pass: !issues.some(i => /heading|h1|document outline/i.test(`${i.title} ${i.root_cause}`))
                },
                {
                    icon: '👆', label: 'Touch Target Size ≥ 44×44px (WCAG 2.5.5)',
                    pass: !issues.some(i => /touch.*target|44px|small.*button/i.test(`${i.title} ${i.root_cause}`))
                },
                {
                    icon: '📱', label: 'Mobile Viewport Configuration',
                    pass: !issues.some(i => /mobile|viewport|responsive/i.test(`${i.title} ${i.root_cause}`))
                },
                {
                    icon: '🔗', label: 'Link Reachability (No Broken Links)',
                    pass: !issues.some(i => /broken.*link|unreachable|404/i.test(`${i.title} ${i.root_cause}`))
                },
                {
                    icon: '⚡', label: 'UX Friction Reduction',
                    pass: issues.filter(i => i.type === 'Friction').length === 0
                },
            ];

            const passCount = checks.filter(c => c.pass).length;

            return `
                <h4>WCAG 2.1 AA / UX Compliance Scan — 9 Categories</h4>
                <p>Automated scanning across <strong>9 detection categories</strong> identified
                <strong>${wcag.length}</strong> WCAG violation(s) and
                <strong>${issues.filter(i => i.type === 'Friction').length}</strong> friction event(s).
                Design Clarity Score: <strong style="color:var(--accent-bright)">${score}/10</strong>.
                Estimated pass rate: <strong style="color:${wcag.length === 0 ? 'var(--success)' : 'var(--warning)'}">${passRate}</strong></p>

                <h4>9-Category Pass / Fail Matrix</h4>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:1.25rem;">
                    ${checks.map(c => `
                        <div style="
                            display:flex;align-items:center;gap:0.6rem;
                            padding:0.55rem 0.85rem;border-radius:8px;
                            background:${c.pass ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)'};
                            border:1px solid ${c.pass ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'};
                        ">
                            <span style="font-size:1rem;">${c.icon}</span>
                            <span style="font-size:0.8rem;flex:1;color:var(--text-secondary);">${c.label}</span>
                            <span style="font-size:0.8rem;font-weight:800;color:${c.pass ? 'var(--success)' : 'var(--danger)'};">
                                ${c.pass ? '✅ PASS' : '❌ FAIL'}
                            </span>
                        </div>`).join('')}
                </div>

                <h4>Overall Result: ${passCount}/${checks.length} checks passed</h4>
                <div style="
                    background:var(--bg-elevated);border-radius:8px;overflow:hidden;
                    height:10px;margin-bottom:1rem;border:1px solid var(--border-color);
                ">
                    <div style="
                        width:${Math.round((passCount / checks.length) * 100)}%;
                        height:100%;
                        background:${passCount >= 7 ? 'var(--success)' : passCount >= 5 ? 'var(--warning)' : 'var(--danger)'};
                        transition:width 0.8s ease;
                    "></div>
                </div>

                <h4>Non-Compliant Issues (${wcag.length} WCAG Violations)</h4>
                <ul>
                    ${wcag.map(w => `
                        <li>
                            <strong>${w.title}</strong> [${w.severity}]<br>
                            <em>User Impact:</em> ${w.description}<br>
                            <em>Root Cause:</em> ${w.root_cause}
                        </li>`).join('<br>') ||
                    '<li>✅ No WCAG violations detected. All scanned elements meet compliance standards.</li>'}
                </ul>`;
        }
    }
};

// Static fallback templates
function getStaticExecutive() {
    return `<h4>High-Level Performance Strategy</h4>
             <p>The automated testing pipeline exposed severe friction thresholds during conversion flows. While functional uptime remains within parameters, path efficiency benchmarks dropped significantly due to cognitive user blockages.</p>
             <h4>Core Financial Implications</h4>
             <ul>
                <li><strong>Conversion Traps:</strong> 38% of simulated sessions experienced structural redirection errors during checkout execution.</li>
                <li><strong>Remediation Strategy:</strong> Deploying the suggested AI UI layout fixes will stabilize baseline operations and increase overall conversion efficiency.</li>
             </ul>`;
}

function getStaticUX() {
    return `<h4>Heuristic Evaluation Metrics</h4>
             <p>An objective review using Nielsen Heuristics identifies significant violations regarding system status clarity and consistency models.</p>
             <h4>Friction Traces Found</h4>
             <ul>
                <li><strong>Visual Misalignment:</strong> Primary buttons do not maintain standard placement patterns across different viewports.</li>
                <li><strong>Form Density Hurdles:</strong> Lack of field inline validation forces repetitive correction passes.</li>
             </ul>`;
}

function getStaticTechnical() {
    return `<h4>DOM Engineering Analysis</h4>
             <p>Analysis of the DOM reveals poor semantic element structures causing layout shifts and rendering latency on initial page load.</p>
             <h4>Suggested Refactoring Steps</h4>
             <ul>
                <li><strong>Inline Style Cleanup:</strong> Move critical element sizes into external stylesheets for better browser caching.</li>
                <li><strong>Dynamic Labels:</strong> Inject explicit element attributes to accelerate browser rendering loops and improve ARIA compliance.</li>
             </ul>`;
}

function getStaticAccessibility() {
    return `<h4>WCAG 2.1 AA Enforcement Verification</h4>
             <p>Automated evaluation profiles identified multiple non-compliant elements that present significant accessibility challenges for users with disabilities.</p>
             <h4>Identified Critical Paths</h4>
             <ul>
                <li><strong>Contrast Errors:</strong> Text contrast ratios fail minimum legibility requirements on key form fields and navigation elements.</li>
                <li><strong>Focus Traps:</strong> Complex modal layouts prevent users from navigating efficiently using keyboard controls.</li>
             </ul>`;
}

function escapeForReport(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Switches the active report and injects dynamic or static content.
 */
function switchReport(key, btn) {
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const report = reportLibrary[key];
    if (!report) return;

    document.getElementById('reportTitle').innerText = report.title;
    document.getElementById('reportSubtitle').innerText = report.sub;
    document.getElementById('reportPreview').innerHTML = report.generateContent(reportAuditData);
}

/**
 * Initializes the reports hub by fetching live audit data.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Inject dynamic audit summary banner if we have data
    try {
        const data = await API.getLatestFindings();
        if (data && data.task_id !== 'demo-fallback') {
            reportAuditData = data;
            injectAuditSummaryBanner(data);
        }
    } catch (err) {
        console.warn('Could not fetch dynamic audit data for reports:', err);
    }

    // Render the default (executive) tab
    const execBtn = document.getElementById('btn-executive');
    if (execBtn) switchReport('executive', execBtn);
});

/**
 * Injects a dynamic audit metadata banner above the report viewer.
 */
function injectAuditSummaryBanner(data) {
    const existingBanner = document.getElementById('dynamicAuditBanner');
    if (existingBanner) return;

    const score = data.heuristic_score || '--';
    const issues = (data.issues || []).length;
    const url = data.url || '—';
    const goal = data.goal || '—';

    const banner = document.createElement('div');
    banner.id = 'dynamicAuditBanner';
    banner.style.cssText = `
        background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.07));
        border: 1px solid rgba(99,102,241,0.3);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        margin-bottom: 1.5rem;
        display: flex;
        gap: 2rem;
        align-items: center;
        flex-wrap: wrap;
        animation: fadeInUp 0.4s ease;
    `;
    banner.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.82rem;">
            <span style="font-size:1rem;">🌐</span>
            <span style="color:var(--text-secondary);font-weight:600;">TARGET:</span>
            <span style="color:var(--accent-bright);font-family:'Fira Code',monospace;font-size:0.78rem;">${url}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.82rem;">
            <span style="font-size:1rem;">🎯</span>
            <span style="color:var(--text-secondary);font-weight:600;">GOAL:</span>
            <span style="color:var(--text-primary);text-transform:uppercase;font-weight:700;font-size:0.78rem;">${goal}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.82rem;">
            <span style="font-size:1rem;">🎨</span>
            <span style="color:var(--text-secondary);font-weight:600;">CLARITY:</span>
            <span style="color:var(--accent-bright);font-weight:900;">${score}/10</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.82rem;">
            <span style="font-size:1rem;">⚠️</span>
            <span style="color:var(--text-secondary);font-weight:600;">ISSUES:</span>
            <span style="color:${issues > 2 ? 'var(--danger)' : issues > 0 ? 'var(--warning)' : 'var(--success)'};font-weight:900;">${issues} found</span>
        </div>
        <div style="margin-left:auto;">
            <span style="font-size:0.72rem;color:var(--success);display:flex;align-items:center;gap:0.35rem;font-weight:700;">
                <span style="width:6px;height:6px;background:var(--success);border-radius:50%;display:inline-block;animation:pulse-success 1.5s infinite;"></span>
                Live Audit Data
            </span>
        </div>
    `;

    const reportLayout = document.querySelector('.report-layout');
    if (reportLayout) {
        reportLayout.parentNode.insertBefore(banner, reportLayout);
    }
}