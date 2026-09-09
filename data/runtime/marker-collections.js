/* Restless Markers multi-collection UI extension.
 *
 * Governing rule: combine for discovery; preserve source identity underneath.
 *
 * The legacy app core is a classic script, so this extension can wrap its shared
 * global functions without rewriting app.js. State-specific pipelines may publish
 * collection metadata in app-meta.json and tag records with `collectionId`.
 */
(function () {
  "use strict";

  const STORAGE_PREFIX = "restless-markers-marker-sources:";
  const DEFAULT_COLLECTION_ID = "official";
  const HMDB_SUPPLEMENTAL_COLLECTION_ID = "hmdb-supplemental";

  const FALLBACK_COLLECTIONS_BY_STATE = Object.freeze({
    TX: Object.freeze([
      Object.freeze({
        id: "official",
        label: "Texas Historical Commission",
        shortLabel: "THC",
        defaultEnabled: true,
        authoritative: true,
        sourceUrl: "https://atlas.thc.texas.gov/"
      })
    ]),
    NC: Object.freeze([
      Object.freeze({
        id: "official",
        label: "NC Highway Historical Marker Program",
        shortLabel: "NC DNCR",
        defaultEnabled: true,
        authoritative: true,
        sourceUrl: "https://www.dncr.nc.gov/historicalmarkers"
      })
    ]),
    CA: Object.freeze([
      Object.freeze({
        id: "hmdb-physical",
        label: "California physical markers (HMDB inventory)",
        shortLabel: "HMDB",
        defaultEnabled: true,
        authoritative: false,
        sourceUrl: "https://www.hmdb.org/results.asp?Search=State&State=California"
      })
    ]),
    MI: Object.freeze([
      Object.freeze({
        id: "official",
        label: "Michigan Historical Marker Program",
        shortLabel: "Michigan",
        defaultEnabled: true,
        authoritative: true,
        sourceUrl: "https://gis-midnr.opendata.arcgis.com/datasets/midnr::historical-markers-public-view-1/about?layer=0"
      })
    ])
  });

  let sourceFilter = null;
  let sourceOptions = null;
  let detailCollection = null;
  let enabledCollectionIds = new Set();

  function normalizeCollection(row) {
    if (!row || typeof row !== "object") {
      return null;
    }
    const id = String(row.id || "").trim();
    const label = String(row.label || "").trim();
    if (!id || !label) {
      return null;
    }
    return Object.freeze({
      id,
      label,
      shortLabel: String(row.shortLabel || label).trim(),
      defaultEnabled: row.defaultEnabled !== false,
      authoritative: row.authoritative === true,
      sourceUrl: String(row.sourceUrl || "").trim()
    });
  }

  function metadataCollectionsForState(code) {
    try {
      const stateMeta = appMeta && appMeta.datasets && appMeta.datasets[code];
      const rows = stateMeta && stateMeta.collections;
      if (!Array.isArray(rows) || !rows.length) {
        return null;
      }
      const normalized = rows.map(normalizeCollection).filter(Boolean);
      const ids = normalized.map((row) => row.id);
      if (!normalized.length || ids.length !== new Set(ids).size) {
        return null;
      }
      return normalized;
    } catch (_) {
      return null;
    }
  }

  function collectionsForState(code) {
    const metadata = metadataCollectionsForState(code);
    if (metadata && metadata.length) {
      return metadata;
    }
    return FALLBACK_COLLECTIONS_BY_STATE[code] || Object.freeze([
      Object.freeze({
        id: DEFAULT_COLLECTION_ID,
        label: "Official marker collection",
        shortLabel: "Official",
        defaultEnabled: true,
        authoritative: true,
        sourceUrl: ""
      })
    ]);
  }

  function collectionById(id) {
    const collections = collectionsForState(activeStateCode);
    return collections.find((row) => row.id === id) || collections[0];
  }

  function defaultCollectionIdForState(code) {
    const collections = collectionsForState(code);
    if (code === "CA" && collections.some((row) => row.id === "hmdb-physical")) {
      return "hmdb-physical";
    }
    const authoritative = collections.find((row) => row.authoritative);
    return authoritative ? authoritative.id : collections[0].id;
  }

  function markerCollectionId(marker) {
    const explicit = String(
      (marker && (marker.collectionId || marker.sourceCollectionId)) || ""
    ).trim();
    return explicit || defaultCollectionIdForState(activeStateCode);
  }

  function markerCollection(marker) {
    return collectionById(markerCollectionId(marker));
  }

  function storageKey(code) {
    return `${STORAGE_PREFIX}${code}`;
  }

  function loadEnabledCollections(code) {
    const collections = collectionsForState(code);
    const valid = new Set(collections.map((row) => row.id));
    let stored = null;
    try {
      const raw = localStorage.getItem(storageKey(code));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          stored = parsed.map(String).filter((id) => valid.has(id));
        }
      }
    } catch (_) {
      stored = null;
    }

    const initial = stored && stored.length
      ? stored
      : collections.filter((row) => row.defaultEnabled !== false).map((row) => row.id);
    if (!initial.length) {
      initial.push(collections[0].id);
    }
    enabledCollectionIds = new Set(initial);
  }

  function persistEnabledCollections() {
    try {
      localStorage.setItem(storageKey(activeStateCode), JSON.stringify([...enabledCollectionIds]));
    } catch (_) {
      /* private browsing or storage disabled */
    }
  }

  function markerCollectionEnabled(marker) {
    return enabledCollectionIds.has(markerCollectionId(marker));
  }

  function visibleMarkers() {
    return markers.filter(markerCollectionEnabled);
  }

  function ensureStyle() {
    if (document.getElementById("marker-collections-style")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "marker-collections-style";
    style.textContent = `
      .marker-source-filter {
        margin: 0.8rem 0;
        padding: 0.65rem 0.7rem 0.7rem;
        border: 1px solid #d2d8e2;
        border-radius: 8px;
        background: #f8fafc;
      }
      .marker-source-filter legend {
        padding: 0 0.25rem;
        color: #17324d;
        font-size: 0.88rem;
        font-weight: 700;
      }
      .marker-source-help {
        margin: 0 0 0.45rem;
        color: #66717f;
        font-size: 0.78rem;
        line-height: 1.35;
      }
      .marker-source-options {
        display: grid;
        gap: 0.35rem;
      }
      .marker-source-option {
        display: flex;
        align-items: flex-start;
        gap: 0.45rem;
        font-size: 0.84rem;
        line-height: 1.3;
        cursor: pointer;
      }
      .marker-source-option input {
        margin: 0.08rem 0 0;
      }
      .marker-source-badge {
        display: inline-block;
        margin-left: 0.4rem;
        padding: 0.08rem 0.34rem;
        border: 1px solid #b9c5d5;
        border-radius: 999px;
        background: #eef3f9;
        color: #24415e;
        font-size: 0.68rem;
        font-weight: 700;
        line-height: 1.25;
        vertical-align: middle;
      }
      .detail-collection {
        margin-top: -0.1rem;
        font-size: 0.8rem;
        font-weight: 700;
      }
      .marker-tooltip-source,
      .marker-popup-source {
        color: #526579;
        font-size: 0.72rem;
        font-weight: 700;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureUi() {
    ensureStyle();
    if (!sourceFilter && countyFilterEl && countyFilterEl.parentNode) {
      sourceFilter = document.getElementById("marker-source-filter");
      if (!sourceFilter) {
        sourceFilter = document.createElement("fieldset");
        sourceFilter.id = "marker-source-filter";
        sourceFilter.className = "marker-source-filter";
        sourceFilter.hidden = true;

        const legend = document.createElement("legend");
        legend.textContent = "Marker sources";
        const help = document.createElement("p");
        help.className = "marker-source-help";
        help.textContent = "Choose which marker collections to show.";
        sourceOptions = document.createElement("div");
        sourceOptions.id = "marker-source-options";
        sourceOptions.className = "marker-source-options";
        sourceFilter.appendChild(legend);
        sourceFilter.appendChild(help);
        sourceFilter.appendChild(sourceOptions);

        const countyLabel = countyFilterEl.previousElementSibling;
        countyFilterEl.parentNode.insertBefore(sourceFilter, countyLabel || countyFilterEl);
      }
    }
    if (!sourceOptions) {
      sourceOptions = document.getElementById("marker-source-options");
    }

    if (!detailCollection && detailCountyEl && detailCountyEl.parentNode) {
      detailCollection = document.getElementById("detail-collection");
      if (!detailCollection) {
        detailCollection = document.createElement("p");
        detailCollection.id = "detail-collection";
        detailCollection.className = "detail-collection muted";
        detailCollection.hidden = true;
        detailCountyEl.insertAdjacentElement("afterend", detailCollection);
      }
    }
  }

  function syncCheckboxes() {
    if (!sourceOptions) {
      return;
    }
    sourceOptions.querySelectorAll('input[type="checkbox"][data-collection-id]').forEach((input) => {
      input.checked = enabledCollectionIds.has(input.dataset.collectionId);
    });
  }

  function renderSourceFilter() {
    ensureUi();
    if (!sourceFilter || !sourceOptions) {
      return;
    }
    const collections = collectionsForState(activeStateCode);
    loadEnabledCollections(activeStateCode);
    sourceOptions.replaceChildren();

    for (const collection of collections) {
      const label = document.createElement("label");
      label.className = "marker-source-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.collectionId = collection.id;
      input.checked = enabledCollectionIds.has(collection.id);
      input.setAttribute("aria-label", `Show ${collection.label} markers`);
      const text = document.createElement("span");
      text.textContent = collection.label;
      label.appendChild(input);
      label.appendChild(text);
      sourceOptions.appendChild(label);
    }

    sourceFilter.hidden = collections.length <= 1;
  }

  function setCollectionEnabled(id, enabled, options = {}) {
    const { persist = true, refresh = true } = options;
    const collections = collectionsForState(activeStateCode);
    if (!collections.some((row) => row.id === id)) {
      return false;
    }

    if (enabled) {
      enabledCollectionIds.add(id);
    } else {
      if (enabledCollectionIds.size <= 1 && enabledCollectionIds.has(id)) {
        syncCheckboxes();
        return false;
      }
      enabledCollectionIds.delete(id);
    }
    syncCheckboxes();
    if (persist) {
      persistEnabledCollections();
    }
    if (refresh) {
      resetInscriptionWordFilterOnly();
      applyFilters();
      refreshDetailInscriptionIfSelected();
      refreshWordCloudInApp();
    }
    return true;
  }

  function ensureMarkerCollectionVisible(marker) {
    const id = markerCollectionId(marker);
    if (!enabledCollectionIds.has(id)) {
      setCollectionEnabled(id, true, { persist: true, refresh: false });
    }
  }

  function collectionBadgeText(marker) {
    const collection = markerCollection(marker);
    return collection.shortLabel || collection.label;
  }

  function shouldShowCollectionChrome() {
    return collectionsForState(activeStateCode).length > 1;
  }

  function appendCollectionBadge(parent, marker) {
    if (!parent || !shouldShowCollectionChrome()) {
      return;
    }
    const badge = document.createElement("span");
    badge.className = "marker-source-badge";
    badge.textContent = collectionBadgeText(marker);
    badge.title = markerCollection(marker).label;
    parent.appendChild(badge);
  }

  function updateDetailCollection(marker) {
    ensureUi();
    if (!detailCollection) {
      return;
    }
    if (!marker || !shouldShowCollectionChrome()) {
      detailCollection.hidden = true;
      detailCollection.textContent = "";
      return;
    }
    const collection = markerCollection(marker);
    detailCollection.textContent = `Marker source: ${collection.label}`;
    detailCollection.hidden = false;
  }

  function decorateLeafletMarker(marker) {
    if (!shouldShowCollectionChrome()) {
      return;
    }
    const leafletMarker = markerById.get(marker.id);
    if (!leafletMarker || leafletMarker.__restlessCollectionDecorated) {
      return;
    }
    const collection = markerCollection(marker);
    const tooltip = leafletMarker.getTooltip && leafletMarker.getTooltip();
    if (tooltip && typeof tooltip.getContent === "function" && typeof tooltip.setContent === "function") {
      const existing = String(tooltip.getContent() || "");
      tooltip.setContent(existing.replace(
        '<div class="marker-tooltip-body">',
        `<div class="marker-tooltip-body"><div class="marker-tooltip-source">${escapeHtml(collection.label)}</div>`
      ));
    }
    const popup = leafletMarker.getPopup && leafletMarker.getPopup();
    if (popup && typeof popup.getContent === "function" && typeof popup.setContent === "function") {
      const existing = String(popup.getContent() || "");
      popup.setContent(`<small class="marker-popup-source">${escapeHtml(collection.label)}</small><br />${existing}`);
    }
    leafletMarker.__restlessCollectionDecorated = true;
  }

  function decorateExistingMapMarkers() {
    if (!shouldShowCollectionChrome()) {
      return;
    }
    markers.forEach(decorateLeafletMarker);
  }

  const coreGetFilteredMarkers = getFilteredMarkers;
  getFilteredMarkers = function () {
    return coreGetFilteredMarkers().filter(markerCollectionEnabled);
  };

  const corePopulateCountyFilter = populateCountyFilter;
  populateCountyFilter = function () {
    const allMarkers = markers;
    try {
      markers = visibleMarkers();
      corePopulateCountyFilter();
    } finally {
      markers = allMarkers;
    }
  };

  const coreBuildInscriptionWordIndex = buildInscriptionWordIndex;
  buildInscriptionWordIndex = function (markerList) {
    return coreBuildInscriptionWordIndex((markerList || []).filter(markerCollectionEnabled));
  };

  const coreApplyNearbyFromCenter = applyNearbyFromCenter;
  applyNearbyFromCenter = function (centerLat, centerLng, maxDistanceMiles) {
    const allMarkers = markers;
    try {
      markers = visibleMarkers();
      return coreApplyNearbyFromCenter(centerLat, centerLng, maxDistanceMiles);
    } finally {
      markers = allMarkers;
    }
  };

  const coreSelectMarker = selectMarker;
  selectMarker = function (marker, options = {}) {
    ensureMarkerCollectionVisible(marker);
    updateDetailCollection(marker);
    return coreSelectMarker(marker, options);
  };

  const coreClearSelectionDetail = clearSelectionDetail;
  clearSelectionDetail = function () {
    updateDetailCollection(null);
    return coreClearSelectionDetail();
  };

  const coreSetDetailMessage = setDetailMessage;
  setDetailMessage = function (title, message) {
    updateDetailCollection(null);
    return coreSetDetailMessage(title, message);
  };

  const coreRenderList = renderList;
  renderList = function (filtered) {
    coreRenderList(filtered);
    if (!shouldShowCollectionChrome() || !listEl) {
      return;
    }
    const markerButtons = listEl.querySelectorAll("li > button");
    markerButtons.forEach((button, index) => {
      const marker = filtered[index];
      if (!marker) {
        return;
      }
      const location = button.querySelector("span");
      if (location) {
        appendCollectionBadge(location, marker);
      }
    });
  };

  const coreAddMapMarkers = addMapMarkers;
  addMapMarkers = function (data) {
    coreAddMapMarkers(data);
    data.forEach(decorateLeafletMarker);
  };

  const coreLookupMarkerByNumber = lookupMarkerByNumber;
  if (markerNumberBtnEl) {
    markerNumberBtnEl.removeEventListener("click", coreLookupMarkerByNumber);
  }
  lookupMarkerByNumber = function () {
    const raw = markerNumberEl.value.trim();
    if (raw) {
      const found = findMarkerByUrlToken(raw);
      if (found) {
        ensureMarkerCollectionVisible(found);
      }
    }
    return coreLookupMarkerByNumber();
  };
  if (markerNumberBtnEl) {
    markerNumberBtnEl.addEventListener("click", lookupMarkerByNumber);
  }

  const coreApplyDeepLinkFromUrl = applyDeepLinkFromUrl;
  applyDeepLinkFromUrl = function () {
    const token = getMarkerTokenFromLocation();
    if (token) {
      const found = findMarkerByUrlToken(token);
      if (found) {
        ensureMarkerCollectionVisible(found);
      }
    }
    return coreApplyDeepLinkFromUrl();
  };

  const coreSelectRandomMarker = selectRandomMarker;
  if (randomMarkerBtnEl) {
    randomMarkerBtnEl.removeEventListener("click", coreSelectRandomMarker);
  }
  selectRandomMarker = function () {
    const pool = visibleMarkers();
    if (!pool.length) {
      setDetailMessage("No marker data", "No markers are enabled in the current source filter.");
      return;
    }
    nearbyMarkerIds = null;
    nearbyDistanceById.clear();
    clearMyLocationReadout();
    zipCodeEl.value = "";
    cityNameEl.value = "";
    markerNumberEl.value = "";
    searchEl.value = "";
    countyFilterEl.value = "";
    resetInscriptionWordFilterOnly();
    const idx = Math.floor(Math.random() * pool.length);
    selectMarker(pool[idx]);
    if (detailPanelEl) {
      detailPanelEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };
  if (randomMarkerBtnEl) {
    randomMarkerBtnEl.addEventListener("click", selectRandomMarker);
  }

  const coreResetUiForStateLoad = resetUiForStateLoad;
  resetUiForStateLoad = function () {
    const result = coreResetUiForStateLoad();
    loadEnabledCollections(activeStateCode);
    renderSourceFilter();
    updateDetailCollection(null);
    return result;
  };

  const coreLoadStateDataset = loadStateDataset;
  loadStateDataset = async function (code) {
    const normalized = normalizeStateCode(code) || "TX";
    loadEnabledCollections(normalized);
    const result = await coreLoadStateDataset(code);
    if (activeStateCode === normalized) {
      loadEnabledCollections(normalized);
      renderSourceFilter();
      populateCountyFilter();
      buildInscriptionWordIndex(markers);
      renderWordCloud();
      decorateExistingMapMarkers();
      applyFilters();
    }
    return result;
  };

  function installSourceOptionListener() {
    ensureUi();
    if (!sourceOptions || sourceOptions.__restlessCollectionListenerInstalled) {
      return;
    }
    sourceOptions.__restlessCollectionListenerInstalled = true;
    sourceOptions.addEventListener("change", (event) => {
      const input = event.target.closest('input[type="checkbox"][data-collection-id]');
      if (!input) {
        return;
      }
      const changed = setCollectionEnabled(input.dataset.collectionId, input.checked, {
        persist: true,
        refresh: false
      });
      if (!changed) {
        return;
      }
      nearbyMarkerIds = null;
      nearbyDistanceById.clear();
      clearMyLocationReadout();
      countyFilterEl.value = "";
      populateCountyFilter();
      buildInscriptionWordIndex(markers);
      renderWordCloud();
      const selected = selectedId == null ? null : markers.find((marker) => marker.id === selectedId);
      if (selected && !markerCollectionEnabled(selected)) {
        clearSelectionDetail();
      } else {
        applyFilters();
      }
    });
  }

  function syncAfterPossibleInitialLoad() {
    ensureUi();
    loadEnabledCollections(activeStateCode);
    renderSourceFilter();
    installSourceOptionListener();
    if (markers && markers.length) {
      populateCountyFilter();
      buildInscriptionWordIndex(markers);
      renderWordCloud();
      decorateExistingMapMarkers();
      applyFilters();
      if (selectedId != null) {
        const selected = markers.find((marker) => marker.id === selectedId);
        updateDetailCollection(selected || null);
      }
    }
  }

  ensureUi();
  loadEnabledCollections(activeStateCode);
  renderSourceFilter();
  installSourceOptionListener();
  [0, 100, 500, 1500].forEach((delay) => window.setTimeout(syncAfterPossibleInitialLoad, delay));
  window.addEventListener("load", syncAfterPossibleInitialLoad);

  window.RestlessMarkerCollections = Object.freeze({
    HMDB_SUPPLEMENTAL_COLLECTION_ID,
    collectionsForState,
    markerCollectionId,
    markerCollectionEnabled,
    getEnabledCollectionIds: () => [...enabledCollectionIds],
    setCollectionEnabled
  });
})();
