/**
 * Journey Map Interactive Step Handler
 * Dynamically fetches crawled journey steps from the backend and renders the timeline nodes.
 */

document.addEventListener("DOMContentLoaded", async () => {
    const timeline = document.getElementById('stepTimeline');
    if (!timeline) return;

    try {
        const data = await API.getLatestFindings();
        
        if (data.steps && data.steps.length > 0) {
            timeline.innerHTML = '';
            
            data.steps.forEach((step, idx) => {
                let iconName = 'globe';
                const titleLower = step.title.toLowerCase();
                const urlLower = step.url.toLowerCase();
                
                if (idx === 0 || titleLower.includes('home') || titleLower.includes('entry')) {
                    iconName = 'home';
                } else if (titleLower.includes('auth') || titleLower.includes('login') || urlLower.includes('login')) {
                    iconName = 'lock';
                } else if (titleLower.includes('checkout') || titleLower.includes('transaction') || urlLower.includes('checkout')) {
                    iconName = 'shopping-cart';
                } else {
                    iconName = 'layout';
                }

                const errorIndicator = step.hasError 
                    ? `<div class="step-error-indicator">
                           <i data-lucide="alert-triangle"></i> ${step.issues.length} issue(s) detected
                       </div>`
                    : '';

                const activeClass = idx === 0 ? 'active' : '';
                const errorClass = step.hasError ? 'has-error' : '';

                const node = document.createElement('div');
                node.className = `step-node ${activeClass} ${errorClass}`;
                node.id = step.stepId;
                
                node.innerHTML = `
                    <div class="step-node-inner">
                        <div class="step-icon"><i data-lucide="${iconName}"></i></div>
                        <div class="step-info">
                            <div class="step-name">Step ${idx + 1}: ${step.title}</div>
                            <div class="step-url">URL: ${step.url.replace(/^(https?:\/\/)?(www\.)?/, '/').split('?')[0]}</div>
                            ${errorIndicator}
                        </div>
                    </div>
                `;

                node.querySelector('.step-node-inner').addEventListener('click', () => {
                    if (typeof switchStep === 'function') {
                        switchStep(step);
                    }
                });

                timeline.appendChild(node);
            });

            if (typeof switchStep === 'function' && data.steps.length > 0) {
                switchStep(data.steps[0]);
            }
            
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    } catch (err) {
        console.error("Error building dynamic journey map steps:", err);
    }
});