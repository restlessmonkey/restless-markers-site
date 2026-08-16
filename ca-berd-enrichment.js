(() => {
  "use strict";

  const DATA_URL = "data/states/ca/berd-landmark-enrichment.json?v=1.4.5-poc";
  const SECTION_ID = "ca-berd-supplement";
  const STYLE_ID = "ca-berd-supplement-style";
  const OHP_HOST_RE = /^https:\/\/ohp\.parks\.ca\.gov\//i;

  let overlayPromise = null;
  let overlayIndex = null;
  let overlayMeta = null;

  function isCaliforniaSelected() {
    const selector = document.getElementById("state-selector");
    return Boolean(selector && selector.value === "CA");
  }

  function currentMarker() {
    try {
      if (!isCaliforniaSelected() || typeof markers === "undefined" || !Array.isArray(markers)) return null;
      if (typeof selectedId === "undefined" || selectedId == null) return null;
      return markers.find((marker) => marker.id === selectedId) || null;
    } catch (_) {
      return null;
    }
  }

  function landmarkNumber(marker) {
    if (!marker) return null;
    const direct = Number(marker.californiaLandmarkNumber);
    if (Number.isInteger(direct) && direct > 0) return direct;
    const raw = String(marker.markerNumber || "").trim();
    const match = raw.match(/^(?:NO\.?\s*|#\s*)?(\d{1,4})$/i);
    return match ? Number(match[1]) : null;
  }

  function validOhpUrl(value) {
    const url = String(value || "").trim();
    return OHP_HOST_RE.test(url) ? url : "";
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .ca-berd-supplement {
        margin: 0.9rem 0 0;
        border: 1px solid #cfd8e5;
        border-radius: 8px;
        background: #f7f9fc;
      }
      .ca-berd-supplement > summary {
        padding: 0.7rem 0.8rem;
        color: #0b3d91;
        font-weight: 700;
        cursor: pointer;
      }
      .ca-berd-supplement-body {
        padding: 0 0.8rem 0.8rem;
      }
      .ca-berd-supplement-note {
        margin: 0 0 0.7rem;
        color: #56616f;
        font-size: 0.86rem;
        line-height: 1.45;
      }
      .ca-berd-supplement-fields {
        display: grid;
        grid-template-columns: minmax(9rem, 0.38fr) minmax(0, 1fr);
        gap: 0.35rem 0.75rem;
        margin: 0;
      }
      .ca-berd-supplement-fields dt {
        font-weight: 700;
        color: #3a4550;
      }
      .ca-berd-supplement-fields dd {
        margin: 0;
        overflow-wrap: anywhere;
      }
      .ca-berd-supplement-fields a {
        color: #0b3d91;
        overflow-wrap: anywhere;
      }
      @media (max-width: 620px) {
        .ca-berd-supplement-fields { grid-template-columns: 1fr; gap: 0.12rem; }
        .ca-berd-supplement-fields dd { margin: 0 0 0.5rem; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureSection() {
    let section = document.getElementById(SECTION_ID);
    if (section) return section;
    const fields = document.getElementById("detail-atlas-fields");
    if (!fields || !fields.parentNode) return null;

    section = document.createElement("details");
    section.id = SECTION_ID;
    section.className = "ca-berd-supplement";
    section.hidden = true;

    const summary = document.createElement("summary");
    summary.textContent = "Supplemental California OHP BERD data";
    const body = document.createElement("div");
    body.className = "ca-berd-supplement-body";
    const note = document.createElement("p");
    note.className = "ca-berd-supplement-note";
    note.dataset.berdNote = "1";
    const dl = document.createElement("dl");
    dl.className = "ca-berd-supplement-fields";
    dl.dataset.berdFields = "1";
    body.append(note, dl);
    section.append(summary, body);
    fields.insertAdjacentElement("afterend", section);
    return section;
  }

  function addRow(dl, label, value) {
    if (value == null) return;
    const text = Array.isArray(value)
      ? value.map((item) => String(item || "").trim()).filter(Boolean).join(" • ")
      : String(value).trim();
    if (!text) return;
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = text;
    dl.append(dt, dd);
  }

  function addUrlRow(dl, label, value) {
    const url = validOhpUrl(value);
    if (!url) return;
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    const link = document.createElement("a");
    dt.textContent = label;
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = url;
    dd.appendChild(link);
    dl.append(dt, dd);
  }

  function userFriendlyMethod(method) {
    return method === "evaluationIdentifier+title"
      ? "Exact SHL identifier + title agreement"
      : "Exact SHL identifier";
  }

  function clearSection() {
    const section = document.getElementById(SECTION_ID);
    if (section) {
      section.hidden = true;
      delete section.dataset.berdFor;
    }
  }

  function validatePayload(payload) {
    if (!payload || payload.safeForAdditiveDisplay !== true || payload.safeForOverride !== false) {
      throw new Error("BERD overlay safety flags are invalid");
    }
    if (!Array.isArray(payload.records)) throw new Error("BERD overlay records are missing");
    const index = new Map();
    for (const record of payload.records) {
      const number = Number(record && record.californiaLandmarkNumber);
      if (!Number.isInteger(number) || number <= 0) continue;
      if (record.matchConfidence !== "high") continue;
      if (!String(record.matchMethod || "").includes("evaluationIdentifier")) continue;
      const keys = record.berd && Array.isArray(record.berd.evaluationDesignationKeys)
        ? record.berd.evaluationDesignationKeys
        : [];
      if (!keys.includes(`SHL:${number}`)) continue;
      index.set(number, record);
    }
    if (index.size !== Number(payload.enrichedLandmarkCount)) {
      throw new Error(`BERD overlay safety validation mismatch: ${index.size} vs ${payload.enrichedLandmarkCount}`);
    }
    overlayIndex = index;
    overlayMeta = payload;
    return payload;
  }

  function loadOverlay() {
    if (overlayPromise) return overlayPromise;
    overlayPromise = fetch(DATA_URL, { credentials: "same-origin" })
      .then((response) => {
        if (!response.ok) throw new Error(`BERD overlay HTTP ${response.status}`);
        return response.json();
      })
      .then(validatePayload)
      .catch((error) => {
        overlayIndex = new Map();
        overlayMeta = null;
        console.warn("California BERD supplemental overlay unavailable:", error);
        return null;
      });
    return overlayPromise;
  }

  function renderRecord(marker, record) {
    const section = ensureSection();
    if (!section) return;
    const dl = section.querySelector('[data-berd-fields="1"]');
    const note = section.querySelector('[data-berd-note="1"]');
    if (!dl || !note) return;

    const signature = `${marker.id}|${record.californiaLandmarkNumber}|${record.matchMethod}`;
    if (section.dataset.berdFor === signature && !section.hidden) return;

    dl.replaceChildren();
    const number = Number(record.californiaLandmarkNumber);
    note.textContent =
      `Supplemental state inventory metadata matched to California Historical Landmark No. ${number} ` +
      `by ${userFriendlyMethod(record.matchMethod).toLowerCase()}. This does not replace the official OHP ` +
      `landmark record or HMDB physical-marker coordinates.`;

    const berd = record.berd || {};
    const ids = berd.identifiers || {};
    const supplemental = berd.supplemental || {};

    addRow(dl, "BERD match confidence", "High — exact SHL identifier required");
    addRow(dl, "BERD match method", userFriendlyMethod(record.matchMethod));
    addRow(dl, "BERD resource name(s)", berd.names);
    addRow(dl, "BERD Primary Number", ids.primaryNumber);
    addRow(dl, "BERD OTIS ID", ids.otisId);
    addRow(dl, "BERD Property Number", ids.propertyNumber);
    addRow(dl, "BERD Trinomial", ids.trinomial);
    addRow(dl, "Construction year(s)", supplemental.constructionYears);
    addRow(dl, "Ownership", supplemental.ownership);
    addRow(dl, "Attributes", supplemental.attributes);
    addRow(dl, "Parent district", supplemental.parentDistrict);
    addRow(dl, "District elements", supplemental.districtElements);
    addRow(dl, "Other associated resources", supplemental.otherAssociatedResources);
    addRow(dl, "Parcel number", supplemental.parcelNumber);
    addRow(dl, "Milepost", supplemental.milepost);
    addRow(dl, "BERD evaluation / status information", berd.evaluationInformation);
    addRow(dl, "OHP organization code", supplemental.oCode);
    addRow(dl, "BERD record modified", supplemental.dateModified);
    addRow(dl, "BERD export date", supplemental.exportDate);
    addUrlRow(dl, "OHP BERD source URL", record.berdSourceUrl || (overlayMeta && overlayMeta.sourceUrl));
    addUrlRow(dl, "BERD county CSV URL", berd.countyCsvUrl);
    addUrlRow(dl, "OHP BERD users guide", record.berdUsersGuideUrl || (overlayMeta && overlayMeta.usersGuideUrl));

    section.dataset.berdFor = signature;
    section.hidden = false;
  }

  function refresh() {
    if (!isCaliforniaSelected()) {
      clearSection();
      return;
    }
    const marker = currentMarker();
    const number = landmarkNumber(marker);
    if (!marker || !number) {
      clearSection();
      return;
    }

    loadOverlay().then(() => {
      if (!isCaliforniaSelected()) return clearSection();
      const current = currentMarker();
      const currentNumber = landmarkNumber(current);
      if (!current || currentNumber !== number || !overlayIndex) return;
      const record = overlayIndex.get(number);
      if (!record) return clearSection();
      renderRecord(current, record);
    });
  }

  function install() {
    injectStyles();
    ensureSection();
    refresh();

    const selector = document.getElementById("state-selector");
    if (selector) selector.addEventListener("change", () => setTimeout(refresh, 0));

    const title = document.getElementById("detail-title");
    const fields = document.getElementById("detail-atlas-fields");
    const observer = new MutationObserver(() => setTimeout(refresh, 0));
    [title, fields].filter(Boolean).forEach((node) =>
      observer.observe(node, { subtree: true, childList: true, characterData: true })
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(install, 0), { once: true });
  } else {
    setTimeout(install, 0);
  }
})();
