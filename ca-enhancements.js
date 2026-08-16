(function () {
  "use strict";

  const CA_MARKERS_PATH = "/data/states/ca/markers.json";
  const CA_UI_SCRIPTS = [
    "ca-hmdb-poc.js?v=1.5.0-ca-statewide-partial",
    "ca-hmdb-rich-details.js?v=1.5.0-ca-statewide-partial",
    "ca-berd-enrichment.js?v=1.5.0-ca-statewide-partial"
  ];
  const MOJIBAKE_REPLACEMENTS = [
    [/â€œ/g, "“"],
    [/â€/g, "”"],
    [/â€˜/g, "‘"],
    [/â€™/g, "’"],
    [/â€“/g, "–"],
    [/â€”/g, "—"],
    [/â€¦/g, "…"],
    [/Â /g, " "],
    [/Â/g, ""]
  ];

  function repairText(value) {
    let text = String(value == null ? "" : value);
    for (const [pattern, replacement] of MOJIBAKE_REPLACEMENTS) {
      text = text.replace(pattern, replacement);
    }

    // Some HMDB fields arrive with U+FFFD that was later decoded as the visible
    // cp1252 sequence "ï¿½". When two occur around a short phrase, the lost bytes
    // were overwhelmingly quotation marks; restore them as a matched quote pair.
    text = text.replace(/(?:ï¿½|�)([^\n]{1,160}?)(?:ï¿½|�)/g, "“$1”");

    // A remaining isolated replacement marker is most commonly a curly apostrophe
    // in names or possessives. Prefer readable punctuation to exposing mojibake.
    text = text.replace(/ï¿½|�/g, "’");
    return text;
  }

  function repairValue(value) {
    if (typeof value === "string") {
      return repairText(value);
    }
    if (Array.isArray(value)) {
      return value.map(repairValue);
    }
    if (value && typeof value === "object") {
      const out = {};
      for (const [key, child] of Object.entries(value)) {
        out[key] = repairValue(child);
      }
      return out;
    }
    return value;
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function ncmFetch(input, init) {
    const response = await nativeFetch(input, init);
    let url;
    try {
      url = new URL(typeof input === "string" ? input : input.url, document.baseURI);
    } catch (_) {
      return response;
    }
    if (!url.pathname.endsWith(CA_MARKERS_PATH)) {
      return response;
    }

    try {
      const payload = await response.clone().json();
      const repaired = repairValue(payload);
      const markerList = Array.isArray(repaired)
        ? repaired
        : repaired && Array.isArray(repaired.markers)
          ? repaired.markers
          : [];
      window.__ncmCaliforniaMarkers = markerList;
      return new Response(JSON.stringify(repaired), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (error) {
      console.warn("California text cleanup could not be applied", error);
      return response;
    }
  };

  function selectedCaliforniaMarker() {
    const selector = document.getElementById("state-selector");
    if (!selector || selector.value !== "CA") {
      return null;
    }
    const rows = window.__ncmCaliforniaMarkers;
    if (!Array.isArray(rows) || !rows.length) {
      return null;
    }

    try {
      if (typeof selectedId !== "undefined" && selectedId != null) {
        const selected = rows.find((row) => row.id === selectedId);
        if (selected) return selected;
      }
    } catch (_) {}

    const token = new URL(window.location.href).searchParams.get("marker");
    if (token) {
      const byId = rows.find((row) => String(row.id || "").trim() === token);
      if (byId) return byId;
      const byNumber = rows.find((row) => String(row.markerNumber || "").trim() === token);
      if (byNumber) return byNumber;
    }

    const detailCounty = document.getElementById("detail-county");
    const match = /\(Marker #([^\)]+)\)/.exec((detailCounty && detailCounty.textContent) || "");
    const markerNumber = match ? match[1].trim() : "";
    return markerNumber
      ? rows.find((row) => String(row.markerNumber || "").trim() === markerNumber) || null
      : null;
  }

  function syncHmdbLink() {
    const resources = document.getElementById("detail-state-resources");
    const link = document.getElementById("detail-state-source-link");
    if (!resources || !link) {
      return;
    }
    const heading = resources.querySelector(".detail-resources-title");
    const marker = selectedCaliforniaMarker();
    const hmdbUrl = marker ? String(marker.hmdbUrl || "").trim() : "";

    if (marker && /^https:\/\/(?:www\.)?hmdb\.org\//i.test(hmdbUrl)) {
      if (heading) {
        heading.textContent = "Additional resources";
      }
      link.href = hmdbUrl;
      link.textContent = "View this marker on HMDB";
      link.setAttribute("aria-label", "View this marker on the Historical Marker Database (HMDB) in a new tab");
      resources.hidden = false;
      return;
    }

    const selector = document.getElementById("state-selector");
    if (selector && selector.value === "CA") {
      if (heading) {
        heading.textContent = "Additional resources";
      }
      resources.hidden = true;
      link.href = "#";
      link.textContent = "";
    } else if (heading) {
      heading.textContent = "Additional official resources";
    }
  }

  function installHmdbLinkSync() {
    const detail = document.querySelector(".detail-panel");
    if (!detail) {
      return;
    }
    let pending = false;
    const schedule = function () {
      if (pending) {
        return;
      }
      pending = true;
      setTimeout(function () {
        pending = false;
        syncHmdbLink();
      }, 0);
    };
    new MutationObserver(schedule).observe(detail, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["hidden", "href"]
    });
    const selector = document.getElementById("state-selector");
    if (selector) {
      selector.addEventListener("change", schedule);
    }
    window.addEventListener("popstate", schedule);
    schedule();
  }

  function hasScript(path) {
    return Array.from(document.scripts).some(function (script) {
      try {
        return new URL(script.src, document.baseURI).pathname.endsWith("/" + path);
      } catch (_) {
        return false;
      }
    });
  }

  function loadCaliforniaUiScripts() {
    for (const source of CA_UI_SCRIPTS) {
      const path = source.split("?", 1)[0];
      if (hasScript(path)) {
        continue;
      }
      const script = document.createElement("script");
      script.src = source;
      script.async = false;
      script.dataset.ncmCaliforniaEnhancement = "1";
      document.body.appendChild(script);
    }
  }

  function install() {
    installHmdbLinkSync();
    // NCM GitHub Pages currently publishes directly from main/root. Load the
    // California modules from the source shell itself so the public site does not
    // depend on workflow-time index.html injection. The hasScript guard keeps this
    // compatible with older/custom artifacts that may already contain the tags.
    loadCaliforniaUiScripts();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
