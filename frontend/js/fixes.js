/**
 * Fix Generation Patch Visualizer Hook
 */
document.addEventListener("DOMContentLoaded", async () => {
    const recList = document.getElementById('recList');
    if (!recList) return;

    try {
        const data = await API.getLatestFindings();
        if (!data || !data.fixes) return;

        recList.innerHTML = '';
        data.fixes.ux_recommendations.forEach(rec => {
            recList.innerHTML += `
                <div class="rec-item">
                    <span>💡</span>
                    <div>${rec}</div>
                </div>`;
        });

        document.getElementById('htmlFixCode').innerText = data.fixes.html_fix;
        document.getElementById('cssFixCode').innerText = data.fixes.css_fix;
    } catch (err) {
        console.error("Failed to inject code patch structures: ", err);
    }
});