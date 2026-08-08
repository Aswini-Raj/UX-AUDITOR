/**
 * UX Copilot Chat Message Processing
 * Loaded dynamically on initialization and processes query context locally.
 */
let latestFindings = null;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        latestFindings = await API.getLatestFindings();
        console.log("UX Copilot loaded latest findings:", latestFindings);
    } catch (err) {
        console.error("UX Copilot failed to fetch latest findings:", err);
    }
});

function processConversationalTrafficStream(userQueryString) {
    const query = userQueryString.toLowerCase();
    
    if (!latestFindings || latestFindings.task_id === "demo-fallback") {
        // Fallback default message if no real audit was completed
        if (query.includes('critical') || query.includes('severity') || query.includes('issue')) {
            return "In our fallback demo findings, we flagged a <strong>Critical</strong> form label contrast issue and a <strong>High</strong> severity checkout button displacement.";
        }
        if (query.includes('accessibility') || query.includes('wcag') || query.includes('contrast')) {
            return "Accessibility check: The button contrast was measured below 4.5:1 on the fallback target, failing WCAG compliance guidelines.";
        }
        if (query.includes('fixes') || query.includes('recommendations') || query.includes('patch')) {
            return "Default recommendation: Update background/text color ratios on action elements and define mobile viewport parameters.";
        }
        return "I'm in standby mode. Run an audit on a target URL first, or ask me about <strong>accessibility</strong>, <strong>contrast</strong>, or <strong>issues</strong> from the mock audit!";
    }

    const host = latestFindings.url || "the crawled site";
    const issues = latestFindings.issues || [];
    const recommendations = latestFindings.fixes ? latestFindings.fixes.ux_recommendations : [];
    const htmlFix = latestFindings.fixes ? latestFindings.fixes.html_fix : "";
    const cssFix = latestFindings.fixes ? latestFindings.fixes.css_fix : "";

    // 1. Issues & Severity queries
    if (query.includes('issue') || query.includes('critical') || query.includes('severity') || query.includes('problem') || query.includes('error')) {
        if (issues.length === 0) {
            return `Excellent news! The audit did not find any accessibility or friction issues on <strong>${host}</strong>.`;
        }
        let reply = `Here are the design issues found on <strong>${host}</strong>:<br><br>`;
        issues.forEach(iss => {
            const emoji = iss.severity === 'Critical' ? '🔴' : (iss.severity === 'High' ? '🟠' : '🔵');
            reply += `${emoji} <strong>${iss.title}</strong> [${iss.severity}]: ${iss.description}<br><br>`;
        });
        return reply;
    }

    // 2. Accessibility, WCAG, Contrast queries
    if (query.includes('accessibility') || query.includes('wcag') || query.includes('contrast') || query.includes('a11y')) {
        const wcagIssues = issues.filter(i => i.type === 'WCAG');
        if (wcagIssues.length === 0) {
            return "Our heuristic scanning found no direct WCAG violations. All image tags contain alt attributes, form fields have labels, and the viewport parameters are set.";
        }
        let reply = `We flagged the following WCAG accessibility issues on <strong>${host}</strong>:<br><br>`;
        wcagIssues.forEach(iss => {
            reply += `⚠️ <strong>${iss.title}</strong>: ${iss.description}<br><em>Root Cause:</em> ${iss.root_cause}<br><br>`;
        });
        return reply;
    }

    // 3. Friction, User Experience queries
    if (query.includes('friction') || query.includes('user experience') || query.includes('ux') || query.includes('click') || query.includes('obstacle')) {
        const frictionIssues = issues.filter(i => i.type === 'Friction');
        if (frictionIssues.length === 0) {
            return "Our user interaction simulation did not detect major conversion bottlenecks or hidden interactive cues.";
        }
        let reply = `Here are the friction events and flow bottlenecks captured on <strong>${host}</strong>:<br><br>`;
        frictionIssues.forEach(iss => {
            reply += `⚡ <strong>${iss.title}</strong> (${iss.severity}): ${iss.description}<br><br>`;
        });
        return reply;
    }

    // 4. Code patches, Recommendations, Fixes queries
    if (query.includes('fix') || query.includes('recommendation') || query.includes('patch') || query.includes('code') || query.includes('html') || query.includes('css')) {
        if (recommendations.length === 0) {
            return "No custom code recommendations were generated since the interface met the base checklist parameters.";
        }
        let reply = `Here is the patch plan for <strong>${host}</strong>:<br><br><strong>Action Items:</strong><br>`;
        recommendations.forEach(rec => {
            reply += `- ${rec}<br>`;
        });
        if (htmlFix && htmlFix !== "<!-- Default fix -->") {
            reply += `<br><strong>HTML Fix Suggestion:</strong><pre style="background:var(--bg-elevated);padding:0.5rem;border-radius:4px;font-size:0.8rem;overflow-x:auto;">${escapeHtml(htmlFix)}</pre>`;
        }
        if (cssFix && cssFix !== "/* Default fix */") {
            reply += `<strong>CSS Fix Suggestion:</strong><pre style="background:var(--bg-elevated);padding:0.5rem;border-radius:4px;font-size:0.8rem;overflow-x:auto;">${cssFix}</pre>`;
        }
        return reply;
    }

    // General fallback
    return `I am ready to assist with findings for <strong>${host}</strong>. Ask me about <strong>issues</strong>, <strong>accessibility/contrast</strong>, or the suggested <strong>code fixes</strong>!`;
}

// Utility to escape HTML markers inside code block preview in chat
function escapeHtml(text) {
    return text
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}