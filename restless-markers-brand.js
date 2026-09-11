(function () {
  const BRAND = "Restless Markers";
  const TAGLINE = "Explore America’s historical markers";
  const VA_PREVIEW_LIMIT = 180;

  function ensureMarkerCollectionsRuntime() {
    if (document.querySelector('script[data-restless-marker-collections="true"]')) return;
    const script = document.createElement("script");
    script.src = new URL("data/runtime/marker-collections.js?v=1", document.baseURI).href;
    script.async = false;
    script.dataset.restlessMarkerCollections = "true";
    script.addEventListener("error", () => console.error("Restless Markers marker-collection extension failed to load."));
    document.head.appendChild(script);
  }

  function ensureRoutePlannerRuntime() {
    if (document.querySelector('script[data-restless-route-planner="true"]')) return;
    const script = document.createElement("script");
    script.src = new URL("data/runtime/route-planner.js?v=1.7.0", document.baseURI).href;
    script.async = false;
    script.dataset.restlessRoutePlanner = "true";
    script.addEventListener("error", () => console.error("Restless Markers route-planner extension failed to load."));
    document.head.appendChild(script);
  }

  function isCalifornia() {
    const selector = document.getElementById("state-selector");
    return Boolean(selector && selector.value === "CA");
  }

  function isVirginia() {
    const selector = document.getElementById("state-selector");
    return Boolean(selector && selector.value === "VA");
  }

  function conciseVirginiaInscription(marker) {
    const source = String((marker && (marker.text || marker.textFallback)) || "").replace(/\s+/g, " ").trim();
    if (!source) return "Official inscription preview unavailable.";
    if (source.length <= VA_PREVIEW_LIMIT) return source;
    const candidate = source.slice(0, VA_PREVIEW_LIMIT + 1);
    const sentence = candidate.match(/^(.{60,180}?[.!?])(?:\s|$)/);
    if (sentence) return sentence[1];
    const clipped = source.slice(0, VA_PREVIEW_LIMIT);
    const lastSpace = clipped.lastIndexOf(" ");
    return `${(lastSpace >= 120 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
  }

  function stylePreview(el, detail) {
    el.className = detail ? "va-inscription-preview va-inscription-preview-detail" : "va-inscription-preview";
    el.style.display = "block";
    el.style.margin = detail ? "0.2rem 0 0.55rem" : "0.28rem 0 0.18rem";
    el.style.fontSize = detail ? "0.95rem" : "0.86rem";
    el.style.lineHeight = "1.35";
    el.style.fontWeight = "400";
    el.style.opacity = "0.82";
  }

  function installVirginiaPreviewUI() {
    if (window.__restlessVaPreviewInstalled) return;
    if (typeof renderList !== "function" || typeof selectMarker !== "function") return;
    window.__restlessVaPreviewInstalled = true;

    const baseRenderList = renderList;
    renderList = function (filtered) {
      baseRenderList(filtered);
      if (!isVirginia()) return;
      const list = document.getElementById("marker-list");
      if (!list) return;
      const buttons = list.querySelectorAll("li > button");
      const visible = filtered.slice(0, 500);
      buttons.forEach((button, index) => {
        const marker = visible[index];
        if (!marker || button.querySelector(".va-inscription-preview")) return;
        const preview = document.createElement("span");
        stylePreview(preview, false);
        preview.textContent = conciseVirginiaInscription(marker);
        const title = button.querySelector("strong");
        const br = title && title.nextSibling;
        if (br) button.insertBefore(preview, br);
        else button.appendChild(preview);
      });
    };

    const baseSelectMarker = selectMarker;
    selectMarker = function (marker, options = {}) {
      baseSelectMarker(marker, options);
      let preview = document.getElementById("va-detail-inscription-preview");
      if (!isVirginia()) {
        if (preview) preview.remove();
        return;
      }
      if (!preview) {
        preview = document.createElement("p");
        preview.id = "va-detail-inscription-preview";
        stylePreview(preview, true);
        const header = document.querySelector(".detail-header-row");
        if (header) header.insertAdjacentElement("afterend", preview);
      }
      preview.textContent = conciseVirginiaInscription(marker);
    };
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
    if (report && report.href) report.href = report.href.replace(/Historical%20Markers%20Explorer/gi, "Restless%20Markers");
    installVirginiaPreviewUI();
  }

  function applyAfterStateChange() {
    [0, 25, 300, 650].forEach((delay) => setTimeout(applyBrand, delay));
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureMarkerCollectionsRuntime();
    ensureRoutePlannerRuntime();
    applyAfterStateChange();
    const selector = document.getElementById("state-selector");
    if (selector) selector.addEventListener("change", applyAfterStateChange);
  });
  window.addEventListener("load", () => {
    ensureMarkerCollectionsRuntime();
    ensureRoutePlannerRuntime();
    applyAfterStateChange();
  });
  ensureMarkerCollectionsRuntime();
  ensureRoutePlannerRuntime();
  applyBrand();
})();