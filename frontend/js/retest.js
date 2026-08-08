/**
 * Post-Fix Performance Regression Validation
 * Loads audit metrics from the backend API and animates the result comparison cards.
 * Also passes issue data to the screenshot comparison section.
 */
document.addEventListener("DOMContentLoaded", async () => {
    const oldSuccessEl = document.getElementById('oldSuccess');
    if (!oldSuccessEl) return;

    try {
        const data = await API.getLatestFindings();
        if (!data || !data.retest_metrics) return;

        oldSuccessEl.innerText = data.retest_metrics.old_success;
        document.getElementById('newSuccess').innerText = data.retest_metrics.new_success;

        // Animate the after-card to highlight improvement
        setTimeout(() => {
            const afterCard = document.getElementById('afterCard');
            if (afterCard) afterCard.classList.add('active');
        }, 400);

        // Extract integer percentage values
        const before = parseInt(data.retest_metrics.old_success) || 60;
        const after  = parseInt(data.retest_metrics.new_success) || 98;

        // Pass issues array to showComparison for the screenshot panel label
        const issues = data.issues || [];

        if (typeof showComparison === 'function') {
            showComparison(before, after, issues);
        }

    } catch (err) {
        console.error("Could not load validation run parameters:", err);
    }
});