/**
 * FocusORM — Extension Popup Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  const domainEl = document.getElementById("currentDomain");
  const statusEl = document.getElementById("trackingStatus");
  const toggleBtn = document.getElementById("toggleBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");

  // Get current status from background
  chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
    if (response) {
      domainEl.textContent = response.currentDomain || "No site detected";
      updateTrackingUI(response.tracking);
    }
  });

  // Toggle tracking
  toggleBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "toggleTracking" }, (response) => {
      if (response) {
        updateTrackingUI(response.tracking);
      }
    });
  });

  // Open dashboard
  dashboardBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:5173" });
  });

  function updateTrackingUI(isTracking) {
    if (isTracking) {
      statusEl.innerHTML = `
        <span class="tracking-badge tracking-on">
          <span class="dot dot-green"></span>
          Active
        </span>`;
      toggleBtn.textContent = "Pause Tracking";
    } else {
      statusEl.innerHTML = `
        <span class="tracking-badge tracking-off">
          <span class="dot dot-red"></span>
          Paused
        </span>`;
      toggleBtn.textContent = "Resume Tracking";
    }
  }
});
