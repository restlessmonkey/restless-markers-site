(function () {
  const BRAND = "Restless Markers";
  const TAGLINE = "Explore America’s historical markers";

  function isCalifornia() {
    const selector = document.getElementById("state-selector");
    return Boolean(selector && selector.value === "CA");
  }

  function applyBrand() {
    const title = document.getElementById("app-title");
    const subtitle = document.getElementById("app-subtitle");
    const aboutTitle = document.getElementById("about-dialog-title");
    const aboutButton = document.getElementById("about-btn");
    const report = document.getElementById("about-report-link");

    if (title) title.textContent = BRAND;
    if (subtitle && !isCalifornia()) subtitle.textContent = TAGLINE;
    if (aboutTitle) aboutTitle.textContent = "About Restless Markers";
    if (aboutButton) aboutButton.setAttribute("aria-label", "About Restless Markers");
    if (report && report.href) {
      report.href = report.href.replace(/Historical%20Markers%20Explorer/gi, "Restless%20Markers");
    }
  }

  function applyAfterStateChange() {
    [0, 25, 300, 650].forEach((delay) => setTimeout(applyBrand, delay));
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyAfterStateChange();
    const selector = document.getElementById("state-selector");
    if (selector) selector.addEventListener("change", applyAfterStateChange);
  });
  window.addEventListener("load", applyAfterStateChange);
  applyBrand();
})();
