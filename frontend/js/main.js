// Immediate Auth Guard: Redirect unauthenticated users to login page
(function checkAuth() {
    const user = localStorage.getItem("user");
    const currentPath = window.location.pathname.split("/").pop();
    if (!user && currentPath !== "login.html") {
        window.location.href = "login.html";
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    configureGlobalNavbarActiveState();
    injectGlobalLifecycleFooter();
    setupLogoutHandler();
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
});

function setupLogoutHandler() {
    const terminateBtn = document.querySelector(".nav-terminate");
    if (terminateBtn) {
        terminateBtn.addEventListener("click", () => {
            localStorage.removeItem("user");
        });
    }
}

/**
 * Automatically calculates current path name to apply active states
 * onto the navigation layout without manual string matching per file.
 */
function configureGlobalNavbarActiveState() {
    const currentPath = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll(".nav-links a");
    
    let matched = false;
    navLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (currentPath === href) {
            link.classList.add("active");
            matched = true;
        } else {
            link.classList.remove("active");
        }
    });

    // Fallback selection validation if default path is empty
    if (!matched && currentPath === "" && navLinks.length > 0) {
        navLinks[0].classList.add("active");
    }
}

/**
 * Injects a cohesive UI presentation footer to anchor your layout
 * during live judge demonstrations.
 */
function injectGlobalLifecycleFooter() {
    const footer = document.createElement("div");
    footer.style.position = "fixed";
    footer.style.bottom = "0";
    footer.style.left = "0";
    footer.style.right = "0";
    footer.style.backgroundColor = "rgba(255, 255, 255, 0.92)";
    footer.style.backdropFilter = "blur(12px)";
    footer.style.borderTop = "1px solid rgba(99,102,241,0.12)";
    footer.style.padding = "0.75rem 2rem";
    footer.style.display = "flex";
    footer.style.justify = "space-between";
    footer.style.alignItems = "center";
    footer.style.zIndex = "1000";
    footer.style.boxShadow = "0 -2px 10px rgba(0,0,0,0.04)";

    // Capture storage track to show current target inside footer indicator bounds
    const activeUrl = localStorage.getItem("currentAuditUrl") || "No Active Target Workspace";
    const activeGoal = localStorage.getItem("currentAuditGoal") || "None";

    footer.innerHTML = `
        <div style="font-size: 0.85rem; color: var(--text-secondary); display: flex; gap: 1.5rem;">
            <span>🌐 <strong>Target:</strong> <span style="color: var(--accent-color);">${activeUrl}</span></span>
            <span>🎯 <strong>Goal Context:</strong> <span style="text-transform: uppercase; font-weight: bold;">${activeGoal}</span></span>
        </div>
        <div style="font-size: 0.85rem; font-weight: bold; color: var(--success); display: flex; align-items: center; gap: 0.5rem;">
            <span style="width: 8px; height: 8px; background: var(--success); border-radius: 50%; display: inline-block; animation: pulse 1.5s infinite;"></span>
            Multi-Agent Sandbox Operational
        </div>
        <style>
            @keyframes pulse {
                0% { transform: scale(0.95); opacity: 0.5; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(0.95); opacity: 0.5; }
            }
        </style>
    `;
    document.body.appendChild(footer);
}

/**
 * Global utility to fetch safety params across dashboard windows
 */
function getActivePipelineTaskId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("task_id");
}