/**
 * Persona Manager Agent Interface Handler
 * Fetches real-time persona data from the backend and renders full persona cards.
 * Falls back to default enriched persona profiles with trait lists if backend has no data.
 */
document.addEventListener("DOMContentLoaded", async () => {
    const matrix = document.getElementById('personaMatrix');
    if (!matrix) return;

    // Persona color themes and emoji avatars
    const personaMeta = [
        { emoji: '🧑‍💻', color: 'linear-gradient(135deg, #6366f1, #8b5cf6)', role: 'New User' },
        { emoji: '👴', color: 'linear-gradient(135deg, #f59e0b, #f97316)', role: 'Older User' },
        { emoji: '📱', color: 'linear-gradient(135deg, #06b6d4, #6366f1)', role: 'Mobile User' },
        { emoji: '♿', color: 'linear-gradient(135deg, #10b981, #06b6d4)', role: 'Accessibility User' }
    ];

    try {
        const data = await API.getLatestFindings();

        // Use real backend personas if available, else fall back to enriched defaults
        const personas = (data.personas && data.personas.length > 0) ? data.personas : [
            {
                name: "First-Time User",
                focus: "Finds setup hard",
                traits: ["Wants things to be quick", "Gets lost in long forms", "Needs helpful error messages"]
            },
            {
                name: "Older Adult",
                focus: "Trouble reading small text",
                traits: ["Needs large text (16px+)", "Needs high contrast colors", "Needs clear buttons to click"]
            },
            {
                name: "Mobile User",
                focus: "Screen is too small",
                traits: ["Needs big buttons to tap", "Dislikes when page jumps around", "Finds popups annoying"]
            },
            {
                name: "Accessibility User",
                focus: "Needs keyboard and screen reader support",
                traits: ["Uses keyboard to navigate", "Relies on clear labels", "Needs to see where they are on page"]
            }
        ];

        matrix.innerHTML = '';
        personas.forEach((p, i) => {
            const meta = personaMeta[i % personaMeta.length];
            let traitsHTML = '';
            if (p.traits && p.traits.length > 0) {
                p.traits.forEach(t => {
                    traitsHTML += `<li><span class="trait-dot"></span>${t}</li>`;
                });
            } else {
                traitsHTML = `<li><span class="trait-dot"></span>${p.focus}</li><li><span class="trait-dot"></span>Evaluating operational pipeline rules</li>`;
            }

            matrix.innerHTML += `
                <div class="persona-card" style="--persona-color: ${meta.color};">
                    <div class="p-header">
                        <div class="p-avatar" style="background: ${meta.color};">${meta.emoji}</div>
                        <div>
                            <div class="p-name">${p.name}</div>
                            <div class="p-role">${meta.role}</div>
                        </div>
                    </div>
                    <div class="p-focus-tag">
                        🎯 ${p.focus}
                    </div>
                    <ul class="trait-list">${traitsHTML}</ul>
                </div>`;
        });

    } catch (err) {
        console.error("Error building persona cards matrix: ", err);
        matrix.innerHTML = `<p style="color:var(--text-secondary);padding:2rem;text-align:center;">No personas instantiated yet. Run an audit from the initialization workspace to generate profiles.</p>`;
    }
});