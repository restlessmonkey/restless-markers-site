(() => {
  "use strict";

  const HMDB_STATE_URL = "https://www.hmdb.org/results.asp?Search=State&State=California";
  const OHP_LISTING_URL = "https://ohp.parks.ca.gov/ListedResources";
  const APP_TITLE = "Restless Markers";

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }
  function setHref(node, value) {
    if (node && node.getAttribute("href") !== value) node.setAttribute("href", value);
  }
  function setAttr(node, name, value) {
    if (node && node.getAttribute(name) !== value) node.setAttribute(name, value);
  }
  function isCaliforniaSelected() {
    const selector = document.getElementById("state-selector");
    return Boolean(selector && selector.value === "CA");
  }
  function currentCaliforniaMarkers() {
    try {
      return typeof markers !== "undefined" && Array.isArray(markers) && isCaliforniaSelected() ? markers : [];
    } catch (_) {
      return [];
    }
  }
  function selectedCaliforniaMarker() {
    try {
      if (!isCaliforniaSelected() || typeof selectedId === "undefined" || selectedId == null) return null;
      return currentCaliforniaMarkers().find((marker) => marker.id === selectedId) || null;
    } catch (_) {
      return null;
    }
  }
  function coverageLabel() {
    const list = currentCaliforniaMarkers();
    if (!list.length) return "captured statewide California historical-marker dataset";
    const counties = new Set(list.map((m) => String(m.county || "").trim()).filter(Boolean));
    const official = list.filter((m) => m.californiaLandmarkNumber != null && String(m.ohpUrl || "").startsWith("https://ohp.parks.ca.gov/ListedResources/Detail/"));
    return `${list.length.toLocaleString()} deployable HMDB marker records across ${counties.size} California counties; ${official.length.toLocaleString()} safely linked to official California OHP landmark records`;
  }

  function patchCaliforniaMarkerLink() {
    if (!isCaliforniaSelected()) return;
    const link = document.getElementById("atlas-detail-link");
    if (!link) return;
    const marker = selectedCaliforniaMarker();
    const ohpUrl = marker && String(marker.ohpUrl || marker.officialSourceUrl || "").trim();
    const hmdbUrl = marker && String(marker.hmdbUrl || "").trim();
    if (/^https:\/\/ohp\.parks\.ca\.gov\/ListedResources\/Detail\//i.test(ohpUrl || "")) {
      setHref(link, ohpUrl);
      setText(link, "Official California OHP landmark record");
      setAttr(link, "aria-label", "Open this landmark on the California Office of Historic Preservation website");
      return;
    }
    if (/^https:\/\/(www\.)?hmdb\.org\//i.test(hmdbUrl || "")) {
      setHref(link, hmdbUrl);
      setText(link, "HMDB marker record");
      setAttr(link, "aria-label", "Open this marker on the Historical Marker Database website");
      return;
    }
    setHref(link, HMDB_STATE_URL);
    setText(link, "Historical Marker Database — California");
  }

  function appendExtraRow(fields, label, value) {
    if (value == null || String(value).trim() === "") return;
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.dataset.hmdbPocExtra = "1";
    dd.dataset.hmdbPocExtra = "1";
    dt.textContent = label;
    dd.textContent = String(value).trim();
    fields.append(dt, dd);
  }

  function patchHmDbDetailFields() {
    const fields = document.getElementById("detail-atlas-fields");
    if (!fields || !isCaliforniaSelected()) return;
    for (const node of fields.querySelectorAll("dt")) {
      if ((node.textContent || "").trim() === "Official location description") {
        setText(node, "Physical marker location description");
      }
    }

    const marker = selectedCaliforniaMarker();
    const key = marker ? String(marker.id) : "";
    const extrasExist = Boolean(fields.querySelector('[data-hmdb-poc-extra="1"]'));
    if (marker && fields.dataset.hmdbPocExtraFor === key && extrasExist) return;
    fields.querySelectorAll('[data-hmdb-poc-extra="1"]').forEach((node) => node.remove());
    delete fields.dataset.hmdbPocExtraFor;
    if (!marker) return;

    appendExtraRow(fields, "California Historical Landmark No.", marker.californiaLandmarkNumber);
    appendExtraRow(fields, "HMDB marker number", marker.hmdbMarkerNumber);
    appendExtraRow(fields, "HMDB database ID", marker.hmdbMarkerId);
    appendExtraRow(fields, "Official OHP title", marker.ohpTitle);
    appendExtraRow(fields, "Registration date", marker.registrationDate);
    appendExtraRow(fields, "Official OHP location", marker.ohpLocation);
    appendExtraRow(fields, "Official OHP county", marker.ohpCounty);
    appendExtraRow(fields, "Official OHP directions", marker.ohpDirections);
    appendExtraRow(fields, "NPS number", marker.npsNumber);
    appendExtraRow(fields, "Year marker erected", marker.yearErected);
    appendExtraRow(fields, "Physical marker street address", marker.streetAddress);
    appendExtraRow(fields, "ZIP", marker.zip);
    appendExtraRow(fields, "Neighborhood", marker.neighborhood);
    appendExtraRow(fields, "Organization / marker credit", marker.organization);
    appendExtraRow(fields, "Road", marker.roadName || marker.routeName);
    appendExtraRow(fields, "Direction of travel", marker.directionOfTravel);
    appendExtraRow(fields, "Nearest cross road", marker.nearestCrossRoad || marker.crossroads);
    appendExtraRow(fields, "Historical date", marker.historicalDate);
    appendExtraRow(fields, "HMDB record updated", marker.hmdbUpdated || marker.hmdbChanged);
    appendExtraRow(fields, "HMDB marker status", marker.confirmedMissing ? "Confirmed missing" : marker.reportedMissing ? "Reported missing" : "No missing-marker flag in imported HMDB record");
    appendExtraRow(fields, "Source attribution", marker.sourceAttribution || "Historical Marker Database (HMDB)");
    fields.dataset.hmdbPocExtraFor = key;
  }

  function patchDetailLabels() {
    const heading = document.getElementById("detail-inscription-heading");
    if (heading) {
      if (isCaliforniaSelected()) {
        const marker = selectedCaliforniaMarker();
        setText(heading, marker && marker.ohpDescription ? "Official California landmark description" : "Marker summary / HMDB excerpt");
      } else if (/Official California landmark description|Marker summary|HMDB excerpt/.test(heading.textContent || "")) {
        setText(heading, "Inscription");
      }
    }
    patchHmDbDetailFields();
    patchCaliforniaMarkerLink();
  }

  function patchChrome() {
    const selector = document.getElementById("state-selector");
    if (selector) {
      const option = selector.querySelector('option[value="CA"]');
      if (option) setText(option, "California — Historical Markers (CA)");
    }
    if (!isCaliforniaSelected()) {
      patchDetailLabels();
      return;
    }

    const coverage = coverageLabel();
    const subtitle = `${coverage}. All 58 counties have been scanned; 52 are complete and 6 remain partial. The 2,520 records not yet captured from those partial counties are on the backlog.`;
    if (document.title !== APP_TITLE) document.title = APP_TITLE;
    setText(document.getElementById("app-title"), APP_TITLE);
    setText(document.getElementById("app-subtitle"), subtitle);

    const program = document.getElementById("official-program-link");
    if (program) {
      setHref(program, OHP_LISTING_URL);
      setText(program, "California Office of Historic Preservation — Listed Historical Resources");
      setAttr(program, "aria-label", "Open the official California Historical Resources listing in a new tab");
    }

    setText(document.getElementById("about-subtitle"), "California statewide historical-marker coverage — partial in six counties");
    setText(document.getElementById("about-intro"), `Restless Markers currently deploys ${coverage}. The statewide HMDB source reports 13,038 California entries; 10,518 MarkerIDs have been captured. Six large counties remain partial and are explicitly tracked as backlog.`);
    setText(document.getElementById("about-source-copy"), "HMDB is the source for the statewide physical-marker inventory, marker coordinates, and marker-specific public metadata. California OHP remains authoritative for official California designation identity. Restless Markers links a physical marker to an official California Historical Landmark only when the deterministic Series 489 + marker-number-base + same-county identity gate passes.");
    const source = document.getElementById("about-source-link");
    if (source) {
      setHref(source, HMDB_STATE_URL);
      setText(source, "Historical Marker Database — California");
    }
    setText(document.getElementById("about-acknowledgments"), "Historical Marker Database (HMDB); California Office of Historic Preservation; OpenStreetMap contributors; Leaflet and Leaflet.markercluster; wordcloud2.js. Six California counties currently have partial HMDB capture and remain on the backlog.");
    patchDetailLabels();
  }

  function centerCalifornia() {
    if (!isCaliforniaSelected()) return;
    try {
      if (typeof map !== "undefined" && map && typeof map.setView === "function") map.setView([36.3, -119.7], 5);
    } catch (_) {}
  }

  function install() {
    patchChrome();
    const selector = document.getElementById("state-selector");
    if (selector) selector.addEventListener("change", () => {
      setTimeout(patchChrome, 0);
      setTimeout(patchChrome, 250);
      setTimeout(centerCalifornia, 500);
    });
    const observer = new MutationObserver(() => patchChrome());
    ["app-title", "app-subtitle", "detail-atlas-fields", "atlas-detail-link", "about-dialog"].map((id) => document.getElementById(id)).filter(Boolean).forEach((node) => observer.observe(node, { subtree: true, childList: true, attributes: true, characterData: true }));
    setTimeout(centerCalifornia, 500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(install, 0), { once: true });
  else setTimeout(install, 0);
})();
