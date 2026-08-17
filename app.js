const LAYOUT_STORAGE_KEY = "thm-layout-mode";
const THM_LAYOUT_LIST_PX_KEY = "thm-layout-list-px";
const THM_LAYOUT_DETAIL_SHARE_KEY = "thm-layout-detail-share";
const THM_LAYOUT_RESIZERS_PX = 16;
const THM_DEFAULT_LIST_PX = 320;
/** Matches former 1fr : 1.2fr split between detail and map. */
const THM_DEFAULT_DETAIL_SHARE = 1 / (1 + 1.2);
const STATE_STORAGE_KEY = "historical-markers-state";

const STATE_CONFIG = Object.freeze({
  TX: Object.freeze({
    code: "TX",
    name: "Texas",
    heading: "Texas Historical Markers",
    subtitle: "Explore marker locations and read marker text.",
    dataPath: "markers.json",
    offlineLookupsPath: "data/offline-lookups.json",
    mapCenter: [31.0, -99.0],
    mapZoom: 6,
    cityExample: "Austin",
    zipExample: "78701",
    markerExample: "2162",
    programName: "Historic Sites Atlas",
    programUrl: "https://atlas.thc.texas.gov/",
    sourceName: "Texas Historical Commission",
    refreshDescription: "Texas Historical Commission (THC Atlas)",
    refreshStatus: "Downloading and merging data from THC Atlas…",
    manualRefreshCommand: "python scripts/fetch_markers_data.py",
    aboutIntro:
      "Explore Texas Historical Commission marker locations, inscriptions, and public marker metadata.",
    sourceCopy:
      "Marker information is derived from public Texas Historical Commission data. This is an independent viewer, not an official Texas Historical Commission product.",
    acknowledgments:
      "Texas Historical Commission; OpenStreetMap contributors; Leaflet and Leaflet.markercluster; wordcloud2.js; Cloudflare Web Analytics."
  }),
  NC: Object.freeze({
    code: "NC",
    name: "North Carolina",
    heading: "North Carolina Highway Historical Markers",
    subtitle: "Explore marker locations, inscriptions, photographs, and program essays.",
    dataPath: "data/states/nc/markers.json",
    offlineLookupsPath: "data/states/nc/offline-lookups.json",
    mapCenter: [35.5, -79.5],
    mapZoom: 7,
    cityExample: "Raleigh",
    zipExample: "27601",
    markerExample: "A-25",
    programName: "NC Historical Marker Program",
    programUrl: "https://www.dncr.nc.gov/historicalmarkers",
    sourceName: "North Carolina Department of Natural and Cultural Resources",
    refreshDescription: "NC DNCR Highway Historical Marker Program",
    refreshStatus: "Downloading NC GIS records and refreshing DNCR photographs…",
    manualRefreshCommand: "python scripts/fetch_nc_markers.py",
    aboutIntro:
      "Explore North Carolina highway historical marker locations, inscriptions, photographs, essays, and public program metadata.",
    sourceCopy:
      "Marker information is derived from the public NC DNCR Highway Historical Marker GIS service and Historical Marker Database. This is an independent viewer, not an official NC DNCR product.",
    acknowledgments:
      "North Carolina Department of Natural and Cultural Resources; NC Highway Historical Marker Program; NCMarkers.com; OpenStreetMap contributors; Leaflet and Leaflet.markercluster; wordcloud2.js; Cloudflare Web Analytics."
  }),
  CA: Object.freeze({
    code: "CA",
    name: "California",
    heading: "California Historical Landmarks — Alameda County Pilot",
    subtitle: "Explore 37 pilot landmark records; this is not statewide coverage.",
    dataPath: "data/states/ca/markers.json",
    offlineLookupsPath: "data/states/ca/offline-lookups.json",
    mapCenter: [37.69, -122.10],
    mapZoom: 10,
    cityExample: "Oakland",
    zipExample: "94607",
    markerExample: "45",
    programName: "CA OHP Alameda Landmarks",
    programUrl: "https://ohp.parks.ca.gov/?page_id=21388",
    sourceName: "California Office of Historic Preservation (Alameda County pilot)",
    refreshDescription: "reviewed California Alameda County pilot snapshot",
    refreshStatus: "The California pilot is a bundled reviewed snapshot.",
    manualRefreshCommand: "No automated California refresh is included in this pilot.",
    aboutIntro:
      "Explore a 37-record Alameda County pilot of California Historical Landmarks. This pilot is not statewide coverage.",
    sourceCopy:
      "Pilot descriptions and official record links come from the California Office of Historic Preservation Alameda County landmark list. Coordinates and city matching come from the corresponding Wikipedia county list and should be independently verified. This is an independent test viewer, not an official California State Parks product.",
    acknowledgments:
      "California Office of Historic Preservation; California State Parks; Wikipedia contributors; OpenStreetMap contributors; Leaflet and Leaflet.markercluster; wordcloud2.js; Cloudflare Web Analytics."
  }),
  // PRIVATE_STATE_MI_BEGIN
  MI: Object.freeze({
    code: "MI",
    name: "Michigan",
    heading: "Michigan Historical Markers",
    subtitle: "Explore official Michigan historical marker locations and inscriptions.",
    dataPath: "data/states/mi/markers.json",
    offlineLookupsPath: "data/states/mi/offline-lookups.json",
    mapCenter: [44.35, -85.6],
    mapZoom: 6,
    cityExample: "Lansing",
    zipExample: "48933",
    markerExample: "L2230",
    programName: "Michigan Historical Marker Program",
    programUrl: "https://gis-midnr.opendata.arcgis.com/datasets/midnr::historical-markers-public-view-1/about?layer=0",
    sourceName: "Michigan Department of Natural Resources / Michigan History Center",
    refreshDescription: "Michigan DNR / Michigan History Center historical marker GIS",
    refreshStatus: "Downloading the official Michigan historical marker GIS layer…",
    manualRefreshCommand: "python scripts/fetch_mi_markers.py",
    aboutIntro:
      "Explore Michigan Historical Marker Program locations, inscriptions, and public source metadata.",
    sourceCopy:
      "Marker information is derived from the public Michigan DNR / Michigan History Center historical marker GIS layer. Source coordinates are preserved exactly as published, including official records located outside Michigan. This is an independent viewer, not an official State of Michigan product.",
    acknowledgments:
      "Michigan Department of Natural Resources; Michigan History Center; Michigan Historical Marker Program; OpenStreetMap contributors; Leaflet and Leaflet.markercluster; wordcloud2.js; Cloudflare Web Analytics."
  })
  // PRIVATE_STATE_MI_END
});

function normalizeStateCode(value) {
  const code = String(value || "").trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(STATE_CONFIG, code) ? code : null;
}

function isLegacyTexasPublicDeployment() {
  const hostname = String(window.location.hostname || "").toLowerCase();
  const pathname = String(window.location.pathname || "/");
  return hostname === "restlessmonkey.github.io" && pathname.startsWith("/THM-site/");
}

function locationHasMarkerToken() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("marker") || params.get("m")) {
    return true;
  }
  const hash = window.location.hash.replace(/^#/, "");
  return /^(marker|m)=/i.test(hash) || /^\d+$/.test(hash);
}

function initialStateCode() {
  if (isLegacyTexasPublicDeployment()) {
    return "TX";
  }
  const explicit = normalizeStateCode(new URLSearchParams(window.location.search).get("state"));
  if (explicit) {
    return explicit;
  }
  // Marker links created before multi-state support always referred to Texas.
  if (locationHasMarkerToken()) {
    return "TX";
  }
  try {
    return normalizeStateCode(localStorage.getItem(STATE_STORAGE_KEY)) || "TX";
  } catch (_) {
    return "TX";
  }
}

let activeStateCode = initialStateCode();
let stateLoadGeneration = 0;

function activeState() {
  return STATE_CONFIG[activeStateCode] || STATE_CONFIG.TX;
}

function activeBasePageTitle() {
  return activeState().heading;
}

function getDetectedLayoutSide() {
  const d = document.documentElement.dataset.thmDetected;
  if (d === "desktop") {
    return "desktop";
  }
  if (d === "mobile") {
    return "mobile";
  }
  return "desktop";
}

function getStoredLayoutMode() {
  try {
    const v = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (v === "mobile" || v === "desktop" || v === "auto") {
      return v;
    }
  } catch (_) {
    /* private mode */
  }
  return "auto";
}

function effectiveLayoutSide() {
  const mode = getStoredLayoutMode();
  if (mode === "mobile" || mode === "desktop") {
    return mode;
  }
  return getDetectedLayoutSide();
}

function applyLayoutToDocument() {
  const side = effectiveLayoutSide();
  document.documentElement.classList.remove("device-mobile", "device-desktop");
  document.documentElement.classList.add(side === "desktop" ? "device-desktop" : "device-mobile");
}

applyLayoutToDocument();

let markers = [];

const listEl = document.getElementById("marker-list");
const searchEl = document.getElementById("search");
const cityNameEl = document.getElementById("city-name");
const citySuggestionsEl = document.getElementById("city-suggestions");
const cityNameBtnEl = document.getElementById("city-name-btn");
const zipCodeEl = document.getElementById("zip-code");
const radiusFilterEl = document.getElementById("radius-filter");
const zipCodeBtnEl = document.getElementById("zip-code-btn");
const myLocationBtnEl = document.getElementById("my-location-btn");
const myLocationReadoutEl = document.getElementById("my-location-readout");
const markerNumberEl = document.getElementById("marker-number");
const markerNumberBtnEl = document.getElementById("marker-number-btn");
const randomMarkerBtnEl = document.getElementById("random-marker-btn");
const countyFilterEl = document.getElementById("county-filter");
const detailTitleEl = document.getElementById("detail-title");
const detailCountyEl = document.getElementById("detail-county");
const detailAtlasFieldsEl = document.getElementById("detail-atlas-fields");
const detailInscriptionHeadingEl = document.getElementById("detail-inscription-heading");
const detailTextEl = document.getElementById("detail-text");
const copyMarkerTextBtnEl = document.getElementById("copy-marker-text-btn");
const googleMapsLinkEl = document.getElementById("google-maps-link");
const atlasDetailLinkEl = document.getElementById("atlas-detail-link");
const googleDirectionsBtnEl = document.getElementById("google-directions-btn");
const dataUpdatedNoticeEl = document.getElementById("data-updated-notice");
const stateSelectorEl = document.getElementById("state-selector");

function syncStateSelectorOptions() {
  if (!stateSelectorEl) {
    return;
  }
  const existingCodes = new Set(Array.from(stateSelectorEl.options, (option) => option.value));
  for (const [code, state] of Object.entries(STATE_CONFIG)) {
    if (existingCodes.has(code)) {
      continue;
    }
    const option = document.createElement("option");
    option.value = code;
    option.textContent = `${state.name} (${code})`;
    stateSelectorEl.appendChild(option);
  }
  stateSelectorEl.value = activeStateCode;
}

syncStateSelectorOptions();
const appTitleEl = document.getElementById("app-title");
const appSubtitleEl = document.getElementById("app-subtitle");
const officialProgramLinkEl = document.getElementById("official-program-link");
const resetAppBtnEl = document.getElementById("reset-app-btn");
const refreshMarkersBtnEl = document.getElementById("refresh-markers-btn");
const refreshMarkersStatusEl = document.getElementById("refresh-markers-status");
const hostedUpdateInfoBtnEl = document.getElementById("hosted-update-info-btn");
const hostedUpdateDialogEl = document.getElementById("hosted-update-dialog");
const hostedUpdateDialogCloseEl = document.getElementById("hosted-update-dialog-close");
const aboutBtnEl = document.getElementById("about-btn");
const aboutDialogEl = document.getElementById("about-dialog");
const aboutDialogCloseEl = document.getElementById("about-dialog-close");
const aboutVersionBadgeEl = document.getElementById("about-version-badge");
const aboutAppUpdatedEl = document.getElementById("about-app-updated");
const aboutMarkerCountEl = document.getElementById("about-marker-count");
const aboutDataUpdatedEl = document.getElementById("about-data-updated");
const aboutChangeSummaryEl = document.getElementById("about-change-summary");
const aboutReportLinkEl = document.getElementById("about-report-link");
const aboutCopySupportBtnEl = document.getElementById("about-copy-support-btn");
const aboutSubtitleEl = document.getElementById("about-subtitle");
const aboutIntroEl = document.getElementById("about-intro");
const aboutSourceCopyEl = document.getElementById("about-source-copy");
const aboutSourceLinkEl = document.getElementById("about-source-link");
const aboutAcknowledgmentsEl = document.getElementById("about-acknowledgments");
const layoutModeBtnEl = document.getElementById("layout-mode-btn");
const addToHomeBtnEl = document.getElementById("add-to-home-btn");
const addToHomeDialogEl = document.getElementById("add-to-home-dialog");
const addToHomeDialogCloseEl = document.getElementById("add-to-home-dialog-close");
const addToHomeIosHintEl = document.getElementById("add-to-home-ios-hint");
const addToHomeGenericHintEl = document.getElementById("add-to-home-generic-hint");
const detailPanelEl = document.querySelector(".detail-panel");
const wordCloudEl = document.getElementById("word-cloud");
const wordCloudCanvasEl = document.getElementById("word-cloud-canvas");
const wordCloudClearBtnEl = document.getElementById("word-cloud-clear-btn");
const wordCloudRefreshBtnEl = document.getElementById("word-cloud-refresh-btn");
const wordCloudStatusEl = document.getElementById("word-cloud-status");
const wordCloudLoadErrorEl = document.getElementById("word-cloud-load-error");
const detailPhotoSectionEl = document.getElementById("detail-photo-section");
const detailMarkerPhotoEl = document.getElementById("detail-marker-photo");
const detailPhotoStatusEl = document.getElementById("detail-photo-status");
const detailSketchWrapEl = document.getElementById("detail-sketch-wrap");
const detailSketchTextEl = document.getElementById("detail-sketch-text");
const detailStateResourcesEl = document.getElementById("detail-state-resources");
const detailStateSourceLinkEl = document.getElementById("detail-state-source-link");

/** Resolves next to the current HTML document (works when the app is under a subpath). */
const APP_META_URL = new URL("app-meta.json?v=1.4.0", document.baseURI);

function markersJsonUrl() {
  return new URL(activeState().dataPath, document.baseURI);
}

function offlineLookupsUrl() {
  const path = activeState().offlineLookupsPath;
  if (!path) {
    return null;
  }
  const url = new URL(path, document.baseURI);
  url.searchParams.set("v", "1.4.0");
  return url;
}

let appMeta = {
  version: "1.4.0",
  applicationUpdated: "2026-08-14T23:07:44Z",
  publisher: {
    name: "Restless Monkey Software",
    contactEmail: "restlessmonkey.software@gmail.com"
  },
  markerDataChanges: {
    comparedToDataUpdated: "2026-05-21T19:31:06Z",
    currentDataUpdated: "2026-08-14T12:21:32Z",
    added: 6,
    updated: 67,
    removed: 4,
    totalChanged: 77,
    netChange: 2
  }
};
let currentMarkerCount = null;
let currentMarkerDataUpdated = null;

/** Capacitor iOS/Android WebView (app installed on device, no Python server). */
function isBundledNativeApp() {
  const protocol = window.location.protocol;
  if (protocol === "capacitor:" || protocol === "ionic:") {
    return true;
  }
  try {
    if (window.Capacitor && typeof window.Capacitor.isNativePlatform === "function") {
      return window.Capacitor.isNativePlatform();
    }
  } catch (_) {
    /* ignore */
  }
  return false;
}

/** GitHub Pages is static hosting and cannot run serve.py or its update endpoint. */
function isGitHubPagesHost() {
  return window.location.hostname.toLowerCase().endsWith(".github.io");
}

function canLoadBundledJson() {
  return window.location.protocol !== "file:";
}

/** @type {{ cities: Record<string, { lat: number, lng: number, label: string }>, zips: Record<string, { lat: number, lng: number, place: string, state: string }> } | null} */
let offlineLookups = null;

async function loadOfflineLookups() {
  offlineLookups = null;
  if (!canLoadBundledJson()) {
    return;
  }
  const lookupUrl = offlineLookupsUrl();
  if (!lookupUrl) {
    return;
  }
  try {
    const response = await fetch(lookupUrl.href, { cache: "force-cache" });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    if (data && (data.cities || data.zips)) {
      offlineLookups = data;
    }
  } catch (error) {
    console.warn("Offline lookups not available", error);
  }
}

async function loadAppMeta() {
  if (!canLoadBundledJson()) {
    renderAboutInformation();
    return;
  }
  try {
    const response = await fetch(APP_META_URL.href, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load app metadata: ${response.status}`);
    }
    const payload = await response.json();
    if (payload && typeof payload === "object") {
      appMeta = { ...appMeta, ...payload };
    }
  } catch (error) {
    console.warn("Application metadata not available; using bundled defaults", error);
  }
  renderAboutInformation();
}

function applyStateChrome() {
  const state = activeState();
  if (isLegacyTexasPublicDeployment()) {
    const legacyUrl = new URL(window.location.href);
    if (legacyUrl.searchParams.has("state")) {
      legacyUrl.searchParams.delete("state");
      window.history.replaceState(window.history.state, "", legacyUrl.toString());
    }
  }
  document.documentElement.dataset.markerState = state.code;
  if (stateSelectorEl) {
    stateSelectorEl.value = state.code;
    const picker = stateSelectorEl.closest(".state-picker");
    if (picker) {
      picker.hidden = isLegacyTexasPublicDeployment();
    }
  }
  if (appTitleEl) {
    appTitleEl.textContent = state.heading;
  }
  if (appSubtitleEl) {
    appSubtitleEl.textContent = state.subtitle;
  }
  if (officialProgramLinkEl) {
    officialProgramLinkEl.href = state.programUrl;
    officialProgramLinkEl.textContent = state.programName;
    officialProgramLinkEl.setAttribute(
      "aria-label",
      `Open ${state.programName} for ${state.name} in a new tab`
    );
  }
  if (cityNameEl) {
    cityNameEl.placeholder = `Enter city (example: ${state.cityExample})`;
  }
  if (zipCodeEl) {
    zipCodeEl.placeholder = `Enter ZIP (example: ${state.zipExample})`;
  }
  if (markerNumberEl) {
    markerNumberEl.placeholder = `Enter marker number (example: ${state.markerExample})`;
    markerNumberEl.inputMode = state.code === "NC" ? "text" : "numeric";
  }
  if (aboutSubtitleEl) {
    aboutSubtitleEl.textContent = state.heading;
  }
  if (aboutIntroEl) {
    aboutIntroEl.textContent = state.aboutIntro;
  }
  if (aboutSourceCopyEl && aboutSourceLinkEl) {
    aboutSourceLinkEl.href = state.programUrl;
    aboutSourceLinkEl.textContent = state.programName;
    aboutSourceCopyEl.replaceChildren(
      document.createTextNode(`${state.sourceCopy} For the official record, use the `),
      aboutSourceLinkEl,
      document.createTextNode(".")
    );
  }
  if (aboutAcknowledgmentsEl) {
    aboutAcknowledgmentsEl.textContent = state.acknowledgments;
  }
  if (selectedId == null) {
    document.title = activeBasePageTitle();
  }
  renderAboutInformation();
}

function storeStatePreference(code) {
  try {
    localStorage.setItem(STATE_STORAGE_KEY, code);
  } catch (_) {
    /* private mode */
  }
}

function normalizeCityKey(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function populateCitySuggestions() {
  if (!citySuggestionsEl) {
    return;
  }

  const cityByKey = new Map();
  if (offlineLookups && offlineLookups.cities) {
    Object.values(offlineLookups.cities).forEach((row) => {
      const city = String((row && row.label) || "").trim();
      const key = normalizeCityKey(city);
      if (key && !cityByKey.has(key)) {
        cityByKey.set(key, city);
      }
    });
  } else {
    markers.forEach((marker) => {
      const city = String(marker.city || "").trim();
      const key = normalizeCityKey(city);
      if (key && !cityByKey.has(key)) {
        cityByKey.set(key, city);
      }
    });
  }

  const fragment = document.createDocumentFragment();
  [...cityByKey.values()]
    .sort((a, b) => a.localeCompare(b))
    .forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      fragment.appendChild(option);
    });
  citySuggestionsEl.replaceChildren(fragment);
}

function lookupCityOffline(cityName) {
  if (!offlineLookups || !offlineLookups.cities) {
    return null;
  }
  const key = normalizeCityKey(cityName);
  const hit = offlineLookups.cities[key];
  if (hit && Number.isFinite(hit.lat) && Number.isFinite(hit.lng)) {
    return hit;
  }
  const needle = key;
  for (const [k, row] of Object.entries(offlineLookups.cities)) {
    if (k === needle || k.startsWith(needle + " ") || k.includes(needle)) {
      return row;
    }
  }
  return null;
}

function lookupZipOffline(zip) {
  if (!offlineLookups || !offlineLookups.zips) {
    return null;
  }
  return offlineLookups.zips[zip] || null;
}

function configureLeafletAssetPaths() {
  if (typeof L === "undefined" || !L.Icon || !L.Icon.Default) {
    return;
  }
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL("vendor/leaflet/images/marker-icon-2x.png", document.baseURI).href,
    iconUrl: new URL("vendor/leaflet/images/marker-icon.png", document.baseURI).href,
    shadowUrl: new URL("vendor/leaflet/images/marker-shadow.png", document.baseURI).href
  });
}

configureLeafletAssetPaths();

/** Min length after normalization; pure-digit tokens skipped (years dominate otherwise). */
const THM_WORD_CLOUD_MIN_LEN = 3;
const THM_WORD_CLOUD_MAX_TERMS = 140;

const INSCRIPTION_STOP_WORDS = new Set(
  (
    "a about after all also an and another any are as at be because been before being between both but by " +
    "came can come could did do does doing done down each few for from further had has have having he her here " +
    "hers him his how if in into is it its itself just like made make many may me might more most much must my " +
    "near no nor not now of off on once one only or other our out over own same see she should so some still " +
    "such than that the their them then there these they this those through to too two under until up upon us " +
    "very was we well were what when where which while who whom whose why will with within without would yet you " +
    "your building buildings cemetery county dedicated dedication erected here highway historic historical history " +
    "included including landmark landmarks located location marker markers mile miles north one original part place " +
    "property recorded road route site south state street texas text the their them there these they this those " +
    "through time town township united usa was west where which who wide year years"
  )
    .trim()
    .split(/\s+/)
);

let wordCloudFilterToken = null;
const inscriptionWordToIds = new Map();
const inscriptionWordCounts = new Map();
/** Ranked `[word, count]` for canvas redraw (resize). */
let lastWordCloudRanked = [];
let wordCloudResizeObserver = null;

/** THC Atlas CSV-derived fields (see scripts/fetch_markers_data.py). */
const THM_MARKER_DETAIL_ROWS = [
  { key: "atlasNumber", label: "Atlas number" },
  { key: "indexName", label: "Index name" },
  { key: "address", label: "Street address" },
  { key: "countyId", label: "County ID" },
  { key: "markerYear", label: "Marker year" },
  { key: "markerSize", label: "Marker size" },
  { key: "subjectCode", label: "Subject (program codes)" },
  { key: "rthl", label: "Recorded Texas Historic Landmark (RTHL)", type: "bool" },
  { key: "htc", label: "Historic Texas Cemetery (HTC)", type: "bool" },
  { key: "privateProperty", label: "Private property", type: "bool" },
  { key: "condition", label: "Condition" },
  { key: "locationDescription", label: "Location description" },
  { key: "hasFiles", label: "Has files in Atlas", type: "bool" },
  { key: "hasImages", label: "Has images in Atlas", type: "bool" },
  { key: "hasMapLocation", label: "Has map location in Atlas", type: "bool" }
];

const NC_MARKER_DETAIL_ROWS = [
  { key: "markerNumber", label: "Marker number" },
  { key: "sourceObjectId", label: "GIS OBJECTID" },
  { key: "county", label: "County" },
  { key: "countyId", label: "County ID" },
  { key: "city", label: "City / locality (parsed)" },
  { key: "locationDetail", label: "Location (full text)" },
  { key: "yearCast", label: "Year cast" },
  { key: "yearsReplaced", label: "Years replaced" },
  { key: "mainTerm", label: "Subject index" },
  { key: "mainTermNonPermutated", label: "Main term (non-permuted)" },
  { key: "hasGpsSurvey", label: "NCDOT GPS coordinate record", type: "bool" },
  { key: "bufferFeet", label: "Buffer (feet)" },
  { key: "dotDistrictId", label: "DOT district (program table)" },
  { key: "dotDistrictTable", label: "DOT district (geometry table)" },
  { key: "tableId", label: "Geometry table row ID" },
  { key: "codePrefix", label: "Code prefix" },
  { key: "codeSuffix", label: "Code suffix" },
  { key: "uniqueKey", label: "Unique key" },
  { key: "geometryObjectId", label: "Geometry OBJECTID" },
  { key: "globalId", label: "Global ID" },
  { key: "createdUser", label: "Created by" },
  { key: "createdDate", label: "Created (UTC)" },
  { key: "lastEditedUser", label: "Last edited by" },
  { key: "lastEditedDate", label: "Last edited (UTC)" },
  { key: "requestor", label: "Requestor" },
  { key: "notes", label: "Notes" },
  { key: "dncrListingTitle", label: "DNCR listing title" },
  { key: "dncrPhotoUpdated", label: "DNCR photo index timestamp" }
];

const CA_MARKER_DETAIL_ROWS = [
  { key: "markerNumber", label: "California landmark number" },
  { key: "city", label: "City / locality" },
  { key: "locationDetail", label: "Official location description" },
  { key: "nrhpNumber", label: "National Register number" }
];

function sketchToPlainText(html) {
  if (html == null) {
    return "";
  }
  let value = String(html);
  value = value.replace(/<\s*br\s*\/?>/gi, "\n");
  value = value.replace(/<\/\s*p\s*>/gi, "\n\n");
  value = value.replace(/<[^>]+>/g, " ");
  value = value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
  return value
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function ncOfficialMarkerUrl(marker) {
  const fromData = String((marker && marker.officialPageUrl) || "").trim();
  if (/^https:\/\/(www\.)?ncmarkers\.com\//i.test(fromData)) {
    return fromData;
  }
  const markerNumber = String((marker && marker.markerNumber) || "").trim();
  return markerNumber
    ? `https://www.ncmarkers.com/Markers.aspx?MarkerId=${encodeURIComponent(markerNumber)}`
    : "https://www.ncmarkers.com/";
}

function caOfficialMarkerUrl(marker) {
  const fromData = String((marker && marker.officialPageUrl) || "").trim();
  if (/^https:\/\/ohp\.parks\.ca\.gov\//i.test(fromData)) {
    return fromData;
  }
  const markerNumber = String((marker && marker.markerNumber) || "").trim();
  return /^\d+$/.test(markerNumber)
    ? `https://ohp.parks.ca.gov/ListedResources/Detail/${encodeURIComponent(markerNumber)}`
    : "https://ohp.parks.ca.gov/?page_id=21388";
}

let photoLoadGeneration = 0;

function clearStateDetailExtras() {
  photoLoadGeneration += 1;
  if (detailPhotoSectionEl) {
    detailPhotoSectionEl.hidden = true;
  }
  if (detailMarkerPhotoEl) {
    detailMarkerPhotoEl.hidden = true;
    detailMarkerPhotoEl.removeAttribute("src");
    detailMarkerPhotoEl.alt = "";
  }
  if (detailPhotoStatusEl) {
    detailPhotoStatusEl.textContent = "";
  }
  if (detailSketchWrapEl) {
    detailSketchWrapEl.hidden = true;
    detailSketchWrapEl.open = false;
  }
  if (detailSketchTextEl) {
    detailSketchTextEl.textContent = "";
  }
  if (detailStateResourcesEl) {
    detailStateResourcesEl.hidden = true;
  }
  if (detailStateSourceLinkEl) {
    detailStateSourceLinkEl.href = "#";
    detailStateSourceLinkEl.textContent = "";
  }
}

function renderNcDetailExtras(marker) {
  clearStateDetailExtras();
  if (activeStateCode !== "NC") {
    return;
  }
  const generation = photoLoadGeneration;
  const photoUrl = String(marker.dncrPhotoUrl || "").trim();
  if (detailPhotoSectionEl && detailMarkerPhotoEl && detailPhotoStatusEl) {
    detailPhotoSectionEl.hidden = false;
    if (photoUrl) {
      detailPhotoStatusEl.textContent = "Loading photograph from the NC DNCR Historical Marker Database…";
      const probe = new Image();
      probe.onload = () => {
        if (generation !== photoLoadGeneration) {
          return;
        }
        detailMarkerPhotoEl.src = photoUrl;
        detailMarkerPhotoEl.alt = `Historical marker ${marker.markerNumber || ""}: ${marker.title || "NC marker"}`.slice(
          0,
          180
        );
        detailMarkerPhotoEl.hidden = false;
        detailPhotoStatusEl.textContent = "Photograph from the NC DNCR Historical Marker Database.";
      };
      probe.onerror = () => {
        if (generation === photoLoadGeneration) {
          detailPhotoStatusEl.textContent = "The indexed photograph could not be loaded. Use the official record link for available images.";
        }
      };
      probe.referrerPolicy = "no-referrer";
      probe.src = photoUrl;
    } else {
      detailPhotoStatusEl.textContent = "No indexed photograph is available for this marker. Use the official record link for possible images.";
    }
  }

  const sketch = sketchToPlainText(marker.sketch);
  if (detailSketchWrapEl && detailSketchTextEl && sketch) {
    detailSketchWrapEl.hidden = false;
    detailSketchTextEl.textContent = sketch;
  }

  const dncrArticleUrl = String(marker.dncrArticleUrl || "").trim();
  if (detailStateResourcesEl && detailStateSourceLinkEl && /^https:\/\//i.test(dncrArticleUrl)) {
    detailStateSourceLinkEl.href = dncrArticleUrl;
    detailStateSourceLinkEl.textContent = "Open the related NC DNCR article";
    detailStateResourcesEl.hidden = false;
  }
}

function clearDetailAtlasFields() {
  if (detailAtlasFieldsEl) {
    detailAtlasFieldsEl.innerHTML = "";
    detailAtlasFieldsEl.hidden = true;
  }
  if (detailInscriptionHeadingEl) {
    detailInscriptionHeadingEl.hidden = true;
  }
  clearStateDetailExtras();
}

function renderDetailAtlasFields(marker) {
  if (!detailAtlasFieldsEl) {
    return;
  }
  detailAtlasFieldsEl.innerHTML = "";
  const frag = document.createDocumentFragment();

  function appendRow(label, text) {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = text;
    frag.appendChild(dt);
    frag.appendChild(dd);
  }

  if (activeStateCode === "NC") {
    for (const def of NC_MARKER_DETAIL_ROWS) {
      const value = marker[def.key];
      if (def.type === "bool") {
        if (typeof value === "boolean") {
          appendRow(def.label, value ? "Yes" : "No");
        }
      } else if (value != null && String(value).trim()) {
        appendRow(def.label, String(value).trim());
      }
    }
    const lat = Number(marker.lat);
    const lng = Number(marker.lng);
    if (Number.isFinite(lat)) {
      appendRow("Latitude (WGS84)", lat.toFixed(6));
    }
    if (Number.isFinite(lng)) {
      appendRow("Longitude (WGS84)", lng.toFixed(6));
    }
    const sourceCoordinates = marker.sourceCoordinates;
    if (
      sourceCoordinates &&
      typeof sourceCoordinates === "object" &&
      sourceCoordinates.x != null &&
      sourceCoordinates.y != null
    ) {
      appendRow(
        "Source coordinates (NCHHM X/Y)",
        `${sourceCoordinates.x}, ${sourceCoordinates.y}`
      );
    }
    if (frag.childNodes.length) {
      detailAtlasFieldsEl.appendChild(frag);
      detailAtlasFieldsEl.hidden = false;
    } else {
      detailAtlasFieldsEl.hidden = true;
    }
    if (detailInscriptionHeadingEl) {
      detailInscriptionHeadingEl.hidden = false;
    }
    renderNcDetailExtras(marker);
    return;
  }

  if (activeStateCode === "CA") {
    for (const def of CA_MARKER_DETAIL_ROWS) {
      const value = marker[def.key];
      if (value != null && String(value).trim()) {
        appendRow(def.label, String(value).trim());
      }
    }
    const lat = Number(marker.lat);
    const lng = Number(marker.lng);
    if (Number.isFinite(lat)) {
      appendRow("Latitude (WGS84)", lat.toFixed(6));
    }
    if (Number.isFinite(lng)) {
      appendRow("Longitude (WGS84)", lng.toFixed(6));
    }
    if (frag.childNodes.length) {
      detailAtlasFieldsEl.appendChild(frag);
      detailAtlasFieldsEl.hidden = false;
    } else {
      detailAtlasFieldsEl.hidden = true;
    }
    if (detailInscriptionHeadingEl) {
      detailInscriptionHeadingEl.hidden = false;
    }
    clearStateDetailExtras();
    return;
  }

  clearStateDetailExtras();

  for (const def of THM_MARKER_DETAIL_ROWS) {
    const v = marker[def.key];
    if (def.type === "bool") {
      if (typeof v === "boolean") {
        appendRow(def.label, v ? "Yes" : "No");
      }
      continue;
    }
    if (v != null && String(v).trim()) {
      appendRow(def.label, String(v).trim());
    }
  }

  const uz = marker.utmZone;
  const ue = marker.utmEast;
  const un = marker.utmNorth;
  const utmBits = [];
  if (uz != null && String(uz).trim()) {
    utmBits.push(`Zone ${String(uz).trim()}`);
  }
  if (ue != null && String(ue).trim()) {
    utmBits.push(`Easting ${String(ue).trim()}`);
  }
  if (un != null && String(un).trim()) {
    utmBits.push(`Northing ${String(un).trim()}`);
  }
  if (utmBits.length) {
    appendRow("UTM coordinates", utmBits.join(", "));
  }

  if (!frag.childNodes.length) {
    detailAtlasFieldsEl.hidden = true;
  } else {
    detailAtlasFieldsEl.appendChild(frag);
    detailAtlasFieldsEl.hidden = false;
  }
  if (detailInscriptionHeadingEl) {
    detailInscriptionHeadingEl.hidden = false;
  }
}

function markerMetadataSearchText(marker) {
  if (activeStateCode === "NC") {
    return [
      marker.mainTerm,
      marker.mainTermNonPermutated,
      marker.yearCast,
      marker.yearsReplaced,
      marker.locationDetail,
      marker.notes,
      marker.requestor,
      marker.codePrefix,
      marker.codeSuffix,
      marker.markerNumber,
      marker.globalId,
      marker.dncrListingTitle,
      marker.sketch ? sketchToPlainText(marker.sketch).slice(0, 1200) : ""
    ]
      .filter(Boolean)
      .join(" ");
  }
  if (activeStateCode === "CA") {
    return [
      marker.markerNumber,
      marker.locationDetail,
      marker.nrhpNumber,
      marker.wikiTitle,
      marker.wikiLocation
    ]
      .filter(Boolean)
      .join(" ");
  }
  const parts = [
    marker.indexName,
    marker.address,
    marker.subjectCode,
    marker.markerYear,
    marker.markerSize,
    marker.condition,
    marker.locationDescription,
    marker.atlasNumber,
    marker.countyId,
    marker.utmZone,
    marker.utmEast,
    marker.utmNorth
  ];
  return parts.filter(Boolean).join(" ");
}

function googleMapsSearchUrl(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (Number.isNaN(la) || Number.isNaN(ln)) {
    return "#";
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${la},${ln}`)}`;
}

function googleDrivingDirectionsDestinationOnly(destLat, destLng) {
  const dLa = Number(destLat);
  const dLn = Number(destLng);
  if (Number.isNaN(dLa) || Number.isNaN(dLn)) {
    return "#";
  }
  const dest = encodeURIComponent(`${dLa},${dLn}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
}

/** THC Atlas marker record: https://atlas.thc.texas.gov/Details/{atlasNumber} */
function thcAtlasMarkerDetailUrl(atlasNumber) {
  const raw = atlasNumber != null ? String(atlasNumber).trim() : "";
  if (!/^\d+$/.test(raw)) {
    return "#";
  }
  return `https://atlas.thc.texas.gov/Details/${raw}`;
}

function updateAtlasDetailLinkUI(marker) {
  if (!atlasDetailLinkEl) {
    return;
  }
  let url = "#";
  let label = "Official marker page";
  let ariaLabel = "Open this marker on its official program page";
  if (marker && activeStateCode === "NC") {
    url = ncOfficialMarkerUrl(marker);
    ariaLabel = "Open this marker on NCMarkers.com";
  } else if (marker && activeStateCode === "CA") {
    url = caOfficialMarkerUrl(marker);
    label = "Official landmark page";
    ariaLabel = "Open this landmark on the California Office of Historic Preservation website";
  } else if (marker) {
    url = thcAtlasMarkerDetailUrl(marker.atlasNumber);
    label = "Historic Sites Atlas";
    ariaLabel = "Open this marker in the Texas Historic Sites Atlas";
  }
  const valid = Boolean(marker) && url !== "#";
  if (!valid) {
    atlasDetailLinkEl.hidden = true;
    atlasDetailLinkEl.setAttribute("href", "#");
    return;
  }
  atlasDetailLinkEl.setAttribute("href", url);
  atlasDetailLinkEl.textContent = label;
  atlasDetailLinkEl.setAttribute("aria-label", ariaLabel);
  atlasDetailLinkEl.hidden = false;
}

function updateGoogleMapsUI(marker) {
  const dLa = marker ? Number(marker.lat) : NaN;
  const dLn = marker ? Number(marker.lng) : NaN;
  const valid = marker && !Number.isNaN(dLa) && !Number.isNaN(dLn);

  if (googleMapsLinkEl) {
    if (!valid) {
      googleMapsLinkEl.hidden = true;
      googleMapsLinkEl.setAttribute("href", "#");
    } else {
      const placeUrl = googleMapsSearchUrl(marker.lat, marker.lng);
      googleMapsLinkEl.setAttribute("href", placeUrl);
      googleMapsLinkEl.hidden = false;
    }
  }

  if (googleDirectionsBtnEl) {
    if (!valid) {
      googleDirectionsBtnEl.hidden = true;
      googleDirectionsBtnEl.disabled = true;
      googleDirectionsBtnEl.textContent = "Driving directions";
    } else {
      googleDirectionsBtnEl.hidden = false;
      googleDirectionsBtnEl.disabled = false;
      googleDirectionsBtnEl.textContent = "Driving directions";
    }
  }
}

/** Opens Google Maps directions to the marker only (no in-page GPS). Google may ask for your start location in its own UI. */
function openGoogleDrivingDirectionsFromHere(marker) {
  const dLa = Number(marker.lat);
  const dLn = Number(marker.lng);
  if (Number.isNaN(dLa) || Number.isNaN(dLn)) {
    return;
  }
  const u = googleDrivingDirectionsDestinationOnly(dLa, dLn);
  if (u !== "#") {
    window.open(u, "_blank", "noopener,noreferrer");
  }
}

function updateLayoutModeButton() {
  if (!layoutModeBtnEl) {
    return;
  }
  const mode = getStoredLayoutMode();
  if (mode === "mobile") {
    layoutModeBtnEl.textContent = "Layout: Mobile";
  } else if (mode === "desktop") {
    layoutModeBtnEl.textContent = "Layout: Desktop";
  } else {
    layoutModeBtnEl.textContent = "Layout: Auto";
  }
  const eff = effectiveLayoutSide();
  layoutModeBtnEl.setAttribute(
    "aria-label",
    `Layout ${mode === "auto" ? "follows device (" + eff + ")" : mode + " locked"}. Click to cycle: Auto, Mobile, Desktop.`
  );
}

function cycleLayoutMode() {
  const cur = getStoredLayoutMode();
  const next = cur === "auto" ? "mobile" : cur === "mobile" ? "desktop" : "auto";
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, next);
  } catch (_) {
    /* private mode */
  }
  applyLayoutToDocument();
  updateLayoutModeButton();
  requestAnimationFrame(() => {
    applyDesktopColumnLayout();
    map.invalidateSize();
    requestAnimationFrame(() => map.invalidateSize());
  });
}

updateLayoutModeButton();
if (layoutModeBtnEl) {
  layoutModeBtnEl.addEventListener("click", cycleLayoutMode);
}

const map = L.map("map").setView(activeState().mapCenter, activeState().mapZoom);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const markerById = new Map();
const markerCluster = L.markerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  maxClusterRadius: 45
});
map.addLayer(markerCluster);

const panelResizeDrag = {
  active: null,
  startX: 0,
  startListW: 0,
  startDetailW: 0,
  el: null,
  pointerId: null
};

function getStoredLayoutNumber(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) {
      return fallback;
    }
    const n = parseFloat(raw, 10);
    return Number.isFinite(n) ? n : fallback;
  } catch (_) {
    return fallback;
  }
}

function setStoredLayoutNumber(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch (_) {
    /* private mode */
  }
}

function isThmDesktopLayout() {
  return !document.documentElement.classList.contains("device-mobile");
}

function applyDesktopColumnLayout() {
  const layout = document.querySelector("main.layout");
  if (!layout || !isThmDesktopLayout()) {
    return;
  }
  const total = layout.getBoundingClientRect().width;
  if (total < 400) {
    return;
  }
  let listPx = getStoredLayoutNumber(THM_LAYOUT_LIST_PX_KEY, THM_DEFAULT_LIST_PX);
  listPx = Math.round(Math.min(Math.max(200, listPx), Math.max(240, total * 0.55)));
  const inner = Math.max(0, total - listPx - THM_LAYOUT_RESIZERS_PX);
  let share = getStoredLayoutNumber(THM_LAYOUT_DETAIL_SHARE_KEY, THM_DEFAULT_DETAIL_SHARE);
  share = Math.min(0.82, Math.max(0.18, share));
  let detailW = Math.round(inner * share);
  const mapMin = 200;
  detailW = Math.min(Math.max(200, detailW), Math.max(220, inner - mapMin));
  if (inner > 0) {
    share = detailW / inner;
  }
  layout.style.setProperty("--thm-list-w", `${listPx}px`);
  layout.style.setProperty("--thm-detail-w", `${detailW}px`);
  setStoredLayoutNumber(THM_LAYOUT_LIST_PX_KEY, listPx);
  setStoredLayoutNumber(THM_LAYOUT_DETAIL_SHARE_KEY, share);
  requestAnimationFrame(() => {
    if (map && typeof map.invalidateSize === "function") {
      map.invalidateSize();
    }
  });
}

function finishPanelResizeDrag() {
  if (panelResizeDrag.el != null && panelResizeDrag.pointerId != null) {
    try {
      panelResizeDrag.el.releasePointerCapture(panelResizeDrag.pointerId);
    } catch (_) {
      /* ignore */
    }
  }
  panelResizeDrag.active = null;
  panelResizeDrag.el = null;
  panelResizeDrag.pointerId = null;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
  applyDesktopColumnLayout();
}

function onPanelResizePointerMove(e) {
  if (!panelResizeDrag.active) {
    return;
  }
  const layout = document.querySelector("main.layout");
  if (!layout) {
    return;
  }
  const dx = e.clientX - panelResizeDrag.startX;
  if (panelResizeDrag.active === "list-detail") {
    const next = Math.round(panelResizeDrag.startListW + dx);
    setStoredLayoutNumber(THM_LAYOUT_LIST_PX_KEY, next);
    applyDesktopColumnLayout();
  } else if (panelResizeDrag.active === "detail-map") {
    const listEl = document.querySelector(".list-panel");
    const listW = listEl ? listEl.getBoundingClientRect().width : THM_DEFAULT_LIST_PX;
    const inner = layout.getBoundingClientRect().width - listW - THM_LAYOUT_RESIZERS_PX;
    const newDetail = Math.round(panelResizeDrag.startDetailW + dx);
    const share = inner > 0 ? newDetail / inner : THM_DEFAULT_DETAIL_SHARE;
    setStoredLayoutNumber(THM_LAYOUT_DETAIL_SHARE_KEY, share);
    applyDesktopColumnLayout();
  }
}

function initPanelResizers() {
  const rListDetail = document.getElementById("layout-resizer-list-detail");
  const rDetailMap = document.getElementById("layout-resizer-detail-map");
  if (!rListDetail || !rDetailMap) {
    return;
  }

  rListDetail.addEventListener("dblclick", () => {
    if (!isThmDesktopLayout()) {
      return;
    }
    setStoredLayoutNumber(THM_LAYOUT_LIST_PX_KEY, THM_DEFAULT_LIST_PX);
    applyDesktopColumnLayout();
  });
  rDetailMap.addEventListener("dblclick", () => {
    if (!isThmDesktopLayout()) {
      return;
    }
    setStoredLayoutNumber(THM_LAYOUT_DETAIL_SHARE_KEY, THM_DEFAULT_DETAIL_SHARE);
    applyDesktopColumnLayout();
  });

  let moveHandler;
  let upHandler;

  function bindResizer(el, kind) {
    el.addEventListener("pointerdown", (e) => {
      if (!isThmDesktopLayout() || e.button !== 0) {
        return;
      }
      e.preventDefault();
      panelResizeDrag.active = kind;
      panelResizeDrag.startX = e.clientX;
      panelResizeDrag.el = el;
      panelResizeDrag.pointerId = e.pointerId;
      const listEl = document.querySelector(".list-panel");
      const detailEl = document.querySelector(".detail-panel");
      if (kind === "list-detail") {
        panelResizeDrag.startListW = listEl ? listEl.getBoundingClientRect().width : THM_DEFAULT_LIST_PX;
      } else {
        panelResizeDrag.startDetailW = detailEl ? detailEl.getBoundingClientRect().width : 400;
      }
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }
      moveHandler = (ev) => onPanelResizePointerMove(ev);
      upHandler = () => {
        document.removeEventListener("pointermove", moveHandler);
        document.removeEventListener("pointerup", upHandler);
        document.removeEventListener("pointercancel", upHandler);
        finishPanelResizeDrag();
      };
      document.addEventListener("pointermove", moveHandler);
      document.addEventListener("pointerup", upHandler);
      document.addEventListener("pointercancel", upHandler);
    });
  }

  bindResizer(rListDetail, "list-detail");
  bindResizer(rDetailMap, "detail-map");

  rListDetail.addEventListener("keydown", (e) => {
    if (!isThmDesktopLayout()) {
      return;
    }
    const step = e.shiftKey ? 24 : 8;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const dir = e.key === "ArrowLeft" ? -1 : 1;
      const v = getStoredLayoutNumber(THM_LAYOUT_LIST_PX_KEY, THM_DEFAULT_LIST_PX) + dir * step;
      setStoredLayoutNumber(THM_LAYOUT_LIST_PX_KEY, v);
      applyDesktopColumnLayout();
    }
  });
  rDetailMap.addEventListener("keydown", (e) => {
    if (!isThmDesktopLayout()) {
      return;
    }
    const step = e.shiftKey ? 24 : 8;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const dir = e.key === "ArrowLeft" ? -1 : 1;
      const layout = document.querySelector("main.layout");
      const listEl = document.querySelector(".list-panel");
      const listW = listEl ? listEl.getBoundingClientRect().width : THM_DEFAULT_LIST_PX;
      const inner = (layout?.getBoundingClientRect().width ?? 0) - listW - THM_LAYOUT_RESIZERS_PX;
      const curShare = getStoredLayoutNumber(THM_LAYOUT_DETAIL_SHARE_KEY, THM_DEFAULT_DETAIL_SHARE);
      const deltaShare = inner > 0 ? (dir * step) / inner : 0;
      setStoredLayoutNumber(THM_LAYOUT_DETAIL_SHARE_KEY, curShare + deltaShare);
      applyDesktopColumnLayout();
    }
  });
}

window.addEventListener(
  "resize",
  () => {
    applyDesktopColumnLayout();
    requestAnimationFrame(() => map.invalidateSize());
  },
  { passive: true }
);

applyDesktopColumnLayout();
initPanelResizers();

let selectedId = null;
let nearbyMarkerIds = null;
const nearbyDistanceById = new Map();

function tokenizeInscription(text) {
  const raw = (text || "").toLowerCase();
  const parts = raw.match(/[a-z0-9']+/g);
  if (!parts) {
    return [];
  }
  const out = [];
  for (const p of parts) {
    const t = p.replace(/^'+|'+$/g, "");
    if (t.length < THM_WORD_CLOUD_MIN_LEN) {
      continue;
    }
    if (/^\d+$/.test(t)) {
      continue;
    }
    if (INSCRIPTION_STOP_WORDS.has(t)) {
      continue;
    }
    out.push(t);
  }
  return out;
}

function buildInscriptionWordIndex(markerList) {
  inscriptionWordToIds.clear();
  inscriptionWordCounts.clear();
  for (const marker of markerList) {
    const tokens = tokenizeInscription(marker.text);
    const seen = new Set();
    for (const tok of tokens) {
      inscriptionWordCounts.set(tok, (inscriptionWordCounts.get(tok) || 0) + 1);
      if (seen.has(tok)) {
        continue;
      }
      seen.add(tok);
      let set = inscriptionWordToIds.get(tok);
      if (!set) {
        set = new Set();
        inscriptionWordToIds.set(tok, set);
      }
      set.add(marker.id);
    }
  }
}

function syncWordCloudFilterChrome() {
  if (wordCloudClearBtnEl) {
    wordCloudClearBtnEl.hidden = !wordCloudFilterToken;
  }
  if (wordCloudStatusEl) {
    if (wordCloudFilterToken) {
      const corpus = inscriptionWordToIds.get(wordCloudFilterToken);
      const n = corpus ? corpus.size : 0;
      wordCloudStatusEl.hidden = false;
      wordCloudStatusEl.textContent = `Inscription contains “${wordCloudFilterToken}” (${n} markers in full dataset). Map and list show matches; county, search, and nearby filters still apply.`;
    } else {
      wordCloudStatusEl.hidden = true;
      wordCloudStatusEl.textContent = "";
    }
  }
}

function clearInscriptionWordFilter() {
  wordCloudFilterToken = null;
  syncWordCloudFilterChrome();
  applyFilters();
  refreshDetailInscriptionIfSelected();
}

function resetInscriptionWordFilterOnly() {
  wordCloudFilterToken = null;
  syncWordCloudFilterChrome();
}

function handleWordCloudPick(word) {
  wordCloudFilterToken = word;
  syncWordCloudFilterChrome();
  applyFilters();
  const filtered = getFilteredMarkers();
  if (!filtered.length) {
    setDetailMessage(
      "No matches",
      `No markers match your current filters and the inscription word “${word}”. Try clearing county, search, or nearby filters.`
    );
    return;
  }
  const stillIn =
    selectedId != null && filtered.some((m) => m.id === selectedId);
  if (!stillIn) {
    selectedId = null;
    clearCopyMarkerTarget();
    updateGoogleMapsUI(null);
    updateAtlasDetailLinkUI(null);
    detailTitleEl.textContent = "Select a marker";
    detailCountyEl.textContent = "";
    clearDetailAtlasFields();
    const n = filtered.length;
    detailTextEl.textContent = `Showing ${n} marker${n === 1 ? "" : "s"} whose inscription contains “${word}”. Pick one from the list or the map.`;
    document.title = activeBasePageTitle();
    map.closePopup();
    stripMarkerFromUrl();
    applyFilters();
    if (n <= 200) {
      const bounds = L.latLngBounds(filtered.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  } else if (filtered.length && selectedId != null) {
    refreshDetailInscriptionIfSelected();
  }
}

function ensureWordCloudResizeObserver() {
  if (wordCloudResizeObserver || !wordCloudEl || typeof ResizeObserver === "undefined") {
    return;
  }
  let t = null;
  wordCloudResizeObserver = new ResizeObserver(() => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (!wordCloudEl.hidden && lastWordCloudRanked.length && typeof WordCloud === "function") {
        paintWordCloudCanvas();
      }
    }, 120);
  });
  wordCloudResizeObserver.observe(wordCloudEl);
}

function paintWordCloudCanvas(retryCount = 0) {
  if (!wordCloudCanvasEl || !wordCloudEl || wordCloudEl.hidden) {
    return;
  }
  if (typeof WordCloud !== "function") {
    return;
  }
  if (WordCloud.isSupported === false) {
    if (wordCloudLoadErrorEl) {
      wordCloudLoadErrorEl.hidden = false;
      wordCloudLoadErrorEl.textContent =
        "This browser cannot render the word cloud (canvas not supported). Try another browser or device.";
    }
    return;
  }
  const ranked = lastWordCloudRanked;
  if (!ranked.length) {
    return;
  }
  const wrap = wordCloudEl;
  const canvas = wordCloudCanvasEl;
  let w = Math.floor(wrap.clientWidth);
  let h = Math.floor(wrap.clientHeight);
  if ((w < 24 || h < 24) && retryCount < 12) {
    setTimeout(() => paintWordCloudCanvas(retryCount + 1), 64);
    return;
  }
  w = Math.max(160, w);
  h = Math.max(200, h);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  const maxC = ranked[0][1];
  const list = ranked.map(([word, count]) => [word, Math.max(1, Math.round((100 * count) / maxC))]);
  const narrow = w < 260;
  const gridSize = Math.max(2, Math.round((narrow ? 5 : 8) * dpr));

  try {
    // Global from wordcloud2.js (https://github.com/timdream/wordcloud2.js)
    WordCloud(canvas, {
      list,
      gridSize,
      weightFactor: (size) => (10 + (size / 100) * 34) * (Math.min(w, h) / 260) * dpr,
      fontFamily: "Arial, Helvetica, sans-serif",
      fontWeight: "600",
      color: (word, _weight, fontSize) => {
        const hue = 200 + ((word.charCodeAt(0) + word.length * 7) % 42);
        const light = Math.max(28, Math.min(46, 44 - fontSize / 12));
        return `hsl(${hue}, 58%, ${light}%)`;
      },
      rotateRatio: narrow ? 0.25 : 0.45,
      rotationSteps: 2,
      backgroundColor: "#fafbfd",
      minSize: narrow ? 6 : 8,
      drawOutOfBound: true,
      shrinkToFit: true,
      click: (item) => {
        if (!item || !item[0]) {
          return;
        }
        handleWordCloudPick(item[0]);
      }
    });
  } catch (err) {
    console.error(err);
    if (wordCloudLoadErrorEl) {
      wordCloudLoadErrorEl.hidden = false;
      wordCloudLoadErrorEl.textContent = "Could not draw the word cloud. Try resizing the panel or reloading the page.";
    }
  }
}

function refreshWordCloudInApp() {
  if (!markers.length) {
    return;
  }
  buildInscriptionWordIndex(markers);
  renderWordCloud();
}

function renderWordCloud() {
  if (!wordCloudEl || !wordCloudCanvasEl) {
    return;
  }
  if (wordCloudLoadErrorEl) {
    wordCloudLoadErrorEl.hidden = true;
    wordCloudLoadErrorEl.textContent = "";
  }
  lastWordCloudRanked = [];
  if (!inscriptionWordCounts.size) {
    wordCloudEl.hidden = true;
    syncWordCloudFilterChrome();
    return;
  }
  if (typeof WordCloud !== "function") {
    if (wordCloudLoadErrorEl) {
      wordCloudLoadErrorEl.hidden = false;
      wordCloudLoadErrorEl.textContent =
        "The word cloud layout script did not load. Reload the app; if you are offline, open it once while online so the home-screen copy can cache scripts.";
    }
    wordCloudEl.hidden = true;
    syncWordCloudFilterChrome();
    return;
  }
  lastWordCloudRanked = [...inscriptionWordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, THM_WORD_CLOUD_MAX_TERMS);
  wordCloudEl.hidden = false;
  ensureWordCloudResizeObserver();
  const runPaint = () => {
    paintWordCloudCanvas(0);
    syncWordCloudFilterChrome();
  };
  requestAnimationFrame(() => {
    requestAnimationFrame(runPaint);
  });
  setTimeout(runPaint, 0);
  setTimeout(runPaint, 100);
  setTimeout(runPaint, 350);
}

function hideWordCloudEmpty() {
  wordCloudFilterToken = null;
  inscriptionWordToIds.clear();
  inscriptionWordCounts.clear();
  lastWordCloudRanked = [];
  if (wordCloudCanvasEl && typeof WordCloud === "function") {
    try {
      WordCloud(wordCloudCanvasEl, { list: [] });
    } catch (_) {
      /* ignore clear failure on zero-size canvas */
    }
  } else if (wordCloudCanvasEl) {
    const ctx = wordCloudCanvasEl.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, wordCloudCanvasEl.width, wordCloudCanvasEl.height);
    }
  }
  if (wordCloudEl) {
    wordCloudEl.hidden = true;
  }
  if (wordCloudLoadErrorEl) {
    wordCloudLoadErrorEl.hidden = true;
    wordCloudLoadErrorEl.textContent = "";
  }
  if (wordCloudRefreshBtnEl) {
    wordCloudRefreshBtnEl.disabled = true;
  }
  syncWordCloudFilterChrome();
}
/** When set, the detail panel is showing this marker and copy is allowed. */
let markerEligibleForCopy = null;
let copyFeedbackTimer = null;

function formatDateOnly(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) {
    return "Not available";
  }
  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
  return parsed.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function formatDateTime(value) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return "Not available";
  }
  return parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatApplicationDateTime(value) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return "Not available";
  }
  return parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "long" });
}

function formatSignedNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "0";
  }
  return number > 0 ? `+${number}` : String(number);
}

function renderAboutInformation() {
  const version = String(appMeta.version || "1.3.0");
  if (aboutVersionBadgeEl) {
    aboutVersionBadgeEl.textContent = `Version ${version}`;
  }
  if (aboutAppUpdatedEl) {
    aboutAppUpdatedEl.textContent = formatApplicationDateTime(appMeta.applicationUpdated);
  }
  if (aboutMarkerCountEl) {
    aboutMarkerCountEl.textContent =
      typeof currentMarkerCount === "number"
        ? `${currentMarkerCount.toLocaleString()} markers`
        : "Loading…";
  }
  if (aboutDataUpdatedEl) {
    aboutDataUpdatedEl.textContent = currentMarkerDataUpdated
      ? formatDateTime(currentMarkerDataUpdated)
      : "Loading…";
  }

  const stateMeta = appMeta.datasets && appMeta.datasets[activeStateCode];
  const changes =
    stateMeta && stateMeta.markerDataChanges
      ? stateMeta.markerDataChanges
      : activeStateCode === "TX"
        ? appMeta.markerDataChanges || {}
        : {};
  if (aboutChangeSummaryEl) {
    const total = Number(changes.totalChanged);
    if (Number.isFinite(total)) {
      const comparisonDateValue = new Date(changes.comparedToDataUpdated);
      const comparisonDate = Number.isNaN(comparisonDateValue.getTime())
        ? "previous"
        : comparisonDateValue.toLocaleDateString(undefined, { dateStyle: "medium" });
      aboutChangeSummaryEl.textContent =
        `${total.toLocaleString()} marker records changed since the ${comparisonDate} dataset: ` +
        `${Number(changes.added || 0).toLocaleString()} added, ` +
        `${Number(changes.updated || 0).toLocaleString()} updated, and ` +
        `${Number(changes.removed || 0).toLocaleString()} removed ` +
        `(net ${formatSignedNumber(changes.netChange)} markers).`;
    } else {
      aboutChangeSummaryEl.textContent = "A comparison with the previous marker dataset is not available.";
    }
  }

  if (aboutReportLinkEl) {
    const contactEmail =
      appMeta.publisher && appMeta.publisher.contactEmail
        ? appMeta.publisher.contactEmail
        : "restlessmonkey.software@gmail.com";
    const subject =
      `Historical Markers Explorer v${version} (${activeStateCode}) feedback — ` +
      `app updated ${appMeta.applicationUpdated || "unknown"}`;
    aboutReportLinkEl.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}`;
  }
}

function buildSupportInformation() {
  const stateMeta = appMeta.datasets && appMeta.datasets[activeStateCode];
  const changes =
    stateMeta && stateMeta.markerDataChanges
      ? stateMeta.markerDataChanges
      : activeStateCode === "TX"
        ? appMeta.markerDataChanges || {}
        : {};
  return [
    "Historical Markers Explorer support information",
    `Version: ${appMeta.version || "unknown"}`,
    `State: ${activeState().name} (${activeStateCode})`,
    `Application updated: ${appMeta.applicationUpdated || "unknown"}`,
    `Marker count: ${typeof currentMarkerCount === "number" ? currentMarkerCount : "unknown"}`,
    `Marker data updated: ${currentMarkerDataUpdated || "unknown"}`,
    `Marker records changed: ${Number.isFinite(Number(changes.totalChanged)) ? changes.totalChanged : "unknown"}`,
    `Page: ${window.location.origin}${window.location.pathname}`,
    `Display mode: ${effectiveLayoutSide()}`,
    `Browser: ${navigator.userAgent}`
  ].join("\n");
}

async function copyPlainText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {
    /* use the selection fallback */
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (_) {
    copied = false;
  }
  document.body.removeChild(ta);
  return copied;
}

function setDataUpdatedNotice(isoFromJson, lastModifiedHeader, markerCount) {
  if (!dataUpdatedNoticeEl) {
    return;
  }
  const countPart =
    typeof markerCount === "number" && markerCount >= 0
      ? `${markerCount.toLocaleString()} markers in dataset`
      : null;
  let parsed = null;
  if (isoFromJson) {
    parsed = new Date(isoFromJson);
  } else if (lastModifiedHeader) {
    parsed = new Date(lastModifiedHeader);
  }
  const dateOk = parsed && !Number.isNaN(parsed.getTime());
  currentMarkerCount = typeof markerCount === "number" ? markerCount : null;
  currentMarkerDataUpdated = dateOk ? parsed.toISOString() : null;
  renderAboutInformation();
  if (!dateOk && !countPart) {
    dataUpdatedNoticeEl.textContent = "";
    return;
  }
  if (!dateOk) {
    dataUpdatedNoticeEl.textContent = countPart;
    return;
  }
  const formatted = parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  const datePart = `Data last updated: ${formatted}`;
  dataUpdatedNoticeEl.textContent = countPart ? `${countPart} · ${datePart}` : datePart;
}

function hideDataUpdatedNotice() {
  if (dataUpdatedNoticeEl) {
    dataUpdatedNoticeEl.textContent = "";
  }
}

/** Nudge layout after header text updates (avoids stale paint before next user interaction). */
function bumpHeaderLayout() {
  if (!dataUpdatedNoticeEl || !dataUpdatedNoticeEl.textContent) {
    return;
  }
  requestAnimationFrame(() => {
    void dataUpdatedNoticeEl.offsetHeight;
    if (map && typeof map.invalidateSize === "function") {
      map.invalidateSize();
    }
  });
}

function clearCopyMarkerTarget() {
  markerEligibleForCopy = null;
  clearTimeout(copyFeedbackTimer);
  copyFeedbackTimer = null;
  if (copyMarkerTextBtnEl) {
    copyMarkerTextBtnEl.disabled = true;
    copyMarkerTextBtnEl.textContent = "Copy marker text";
  }
}

function stripMarkerFromUrl() {
  const url = new URL(window.location.href);
  let changed = false;
  if (url.searchParams.has("marker")) {
    url.searchParams.delete("marker");
    changed = true;
  }
  if (url.searchParams.has("m")) {
    url.searchParams.delete("m");
    changed = true;
  }
  if (url.hash) {
    const f = url.hash.slice(1);
    if (/^(marker|m)=/i.test(f) || /^\d+$/.test(f)) {
      url.hash = "";
      changed = true;
    }
  }
  if (changed) {
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }
}

/** Full reload with no marker in the URL (filters and UI reset to defaults on load). */
function resetAppToInitialState() {
  const url = new URL(window.location.href);
  url.searchParams.delete("marker");
  url.searchParams.delete("m");
  if (url.hash) {
    const f = url.hash.slice(1);
    if (/^(marker|m)=/i.test(f) || /^\d+$/.test(f)) {
      url.hash = "";
    }
  }
  const next = url.pathname + (url.search ? url.search : "") + url.hash;
  const cur = window.location.pathname + window.location.search + window.location.hash;
  if (next === cur) {
    window.location.reload();
  } else {
    window.location.replace(next);
  }
}

function getMarkerTokenFromLocation() {
  const params = new URLSearchParams(window.location.search);
  let m = params.get("marker") || params.get("m");
  if (m && String(m).trim()) {
    return String(m).trim();
  }
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) {
    return null;
  }
  if (/^marker=/i.test(hash)) {
    return decodeURIComponent(hash.slice(7).split("&")[0]).trim();
  }
  if (/^m=/i.test(hash)) {
    return decodeURIComponent(hash.slice(2).split("&")[0]).trim();
  }
  if (/^\d+$/.test(hash)) {
    return hash;
  }
  const hp = new URLSearchParams(hash);
  m = hp.get("marker") || hp.get("m");
  return m && String(m).trim() ? String(m).trim() : null;
}

function findMarkerByUrlToken(token) {
  let raw;
  try {
    raw = decodeURIComponent(String(token).trim());
  } catch {
    return null;
  }
  if (!raw) {
    return null;
  }
  const normalized = raw.toUpperCase().replace(/\s+/g, "");
  const digits = raw.replace(/\D/g, "");
  return (
    markers.find(
      (marker) =>
        String(marker.markerNumber || "")
          .trim()
          .toUpperCase()
          .replace(/\s+/g, "") === normalized
    ) ||
    (activeStateCode === "TX" && digits
      ? markers.find((marker) => String(marker.markerNumber || "").trim() === digits)
      : null) ||
    markers.find((marker) => String(marker.id) === raw) ||
    null
  );
}

function markerUrlValue(marker) {
  return String(marker.markerNumber ?? marker.id);
}

function applyStateToUrl(url, code = activeStateCode) {
  if (code === "TX") {
    url.searchParams.delete("state");
  } else {
    url.searchParams.set("state", code);
  }
}

function replaceMarkerUrl(marker) {
  const value = markerUrlValue(marker);
  const url = new URL(window.location.href);
  applyStateToUrl(url);
  url.searchParams.set("marker", value);
  url.searchParams.delete("m");
  url.hash = "";
  window.history.replaceState({ marker: value, state: activeStateCode }, "", url.toString());
}

function pushMarkerUrl(marker) {
  const value = markerUrlValue(marker);
  const url = new URL(window.location.href);
  applyStateToUrl(url);
  if (url.searchParams.get("marker") === value) {
    if (url.hash) {
      url.hash = "";
      window.history.replaceState(window.history.state, "", url.toString());
    }
    return;
  }
  url.searchParams.set("marker", value);
  url.searchParams.delete("m");
  url.hash = "";
  window.history.pushState({ marker: value, state: activeStateCode }, "", url.toString());
}

function clearSelectionDetail() {
  selectedId = null;
  clearCopyMarkerTarget();
  updateGoogleMapsUI(null);
  updateAtlasDetailLinkUI(null);
  detailTitleEl.textContent = "Select a marker";
  detailCountyEl.textContent = "";
  clearDetailAtlasFields();
  detailTextEl.textContent = "Pick a marker from the list to view details.";
  document.title = activeBasePageTitle();
  map.closePopup();
  applyFilters();
}

function applyDeepLinkFromUrl() {
  const token = getMarkerTokenFromLocation();
  if (!token) {
    return;
  }
  const found = findMarkerByUrlToken(token);
  if (found) {
    const value = markerUrlValue(found);
    const url = new URL(window.location.href);
    const hadHash = Boolean(url.hash);
    const hadShortParam = url.searchParams.has("m");
    const markerParamOk = url.searchParams.get("marker") === value;
    selectMarker(found, { skipUrlUpdate: true });
    if (hadHash || hadShortParam || !markerParamOk) {
      replaceMarkerUrl(found);
    }
  } else {
    stripMarkerFromUrl();
    setDetailMessage("Marker not found", `No marker matches "${token}" in this dataset.`);
  }
}

function setDetailMessage(title, message) {
  clearCopyMarkerTarget();
  updateGoogleMapsUI(null);
  updateAtlasDetailLinkUI(null);
  selectedId = null;
  stripMarkerFromUrl();
  map.closePopup();
  document.title = activeBasePageTitle();
  detailTitleEl.textContent = title;
  detailCountyEl.textContent = "";
  clearDetailAtlasFields();
  detailTextEl.textContent = message;
  applyFilters();
}

function formatMarkerForClipboard(marker) {
  const markerNum = marker.markerNumber || String(marker.id);
  const loc = `${marker.county}${marker.city ? ` - ${marker.city}` : ""} (Marker #${markerNum})`;
  const body = marker.text || "No marker text available.";
  const metaLines = [];
  if (activeStateCode === "NC") {
    if (marker.locationDetail) {
      metaLines.push(`Location: ${marker.locationDetail}`);
    }
    if (marker.yearCast) {
      metaLines.push(`Year cast: ${marker.yearCast}`);
    }
    if (marker.yearsReplaced) {
      metaLines.push(`Years replaced: ${marker.yearsReplaced}`);
    }
    if (marker.mainTerm) {
      metaLines.push(`Subject: ${marker.mainTerm}`);
    }
    const sketch = sketchToPlainText(marker.sketch);
    const metaBlock = metaLines.length ? `${metaLines.join("\n")}\n\n` : "";
    const sketchBlock = sketch ? `\n\nProgram background essay\n${sketch}` : "";
    return `${marker.title}\n${loc}\n\n${metaBlock}${body}${sketchBlock}`;
  }
  if (activeStateCode === "CA") {
    if (marker.locationDetail) {
      metaLines.push(`Location: ${marker.locationDetail}`);
    }
    if (marker.nrhpNumber) {
      metaLines.push(`National Register number: ${marker.nrhpNumber}`);
    }
    const metaBlock = metaLines.length ? `${metaLines.join("\n")}\n\n` : "";
    return `${marker.title}\n${loc}\n\n${metaBlock}${body}`;
  }
  if (marker.atlasNumber) {
    metaLines.push(`Atlas number: ${marker.atlasNumber}`);
  }
  if (marker.address) {
    metaLines.push(`Address: ${marker.address}`);
  }
  if (marker.markerYear) {
    metaLines.push(`Marker year: ${marker.markerYear}`);
  }
  if (marker.markerSize) {
    metaLines.push(`Marker size: ${marker.markerSize}`);
  }
  if (marker.subjectCode) {
    metaLines.push(`Subject: ${marker.subjectCode}`);
  }
  if (typeof marker.rthl === "boolean") {
    metaLines.push(`RTHL: ${marker.rthl ? "Yes" : "No"}`);
  }
  if (typeof marker.htc === "boolean") {
    metaLines.push(`HTC: ${marker.htc ? "Yes" : "No"}`);
  }
  if (typeof marker.privateProperty === "boolean") {
    metaLines.push(`Private property: ${marker.privateProperty ? "Yes" : "No"}`);
  }
  if (marker.condition) {
    metaLines.push(`Condition: ${marker.condition}`);
  }
  if (marker.locationDescription) {
    metaLines.push(`Location notes: ${marker.locationDescription}`);
  }
  const uz = marker.utmZone;
  const ue = marker.utmEast;
  const un = marker.utmNorth;
  if ((uz && String(uz).trim()) || (ue && String(ue).trim()) || (un && String(un).trim())) {
    const u = [uz && `Zone ${uz}`, ue && `E ${ue}`, un && `N ${un}`].filter(Boolean).join(", ");
    metaLines.push(`UTM: ${u}`);
  }
  const metaBlock = metaLines.length ? `${metaLines.join("\n")}\n\n` : "";
  return `${marker.title}\n${loc}\n\n${metaBlock}${body}`;
}

async function copyMarkerTextToClipboard() {
  if (!markerEligibleForCopy || !copyMarkerTextBtnEl) {
    return;
  }
  const text = formatMarkerForClipboard(markerEligibleForCopy);
  const defaultLabel = "Copy marker text";
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      throw new Error("clipboard unavailable");
    }
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      if (!document.execCommand("copy")) {
        throw new Error("execCommand copy failed");
      }
    } catch {
      document.body.removeChild(ta);
      return;
    }
    document.body.removeChild(ta);
  }
  copyMarkerTextBtnEl.textContent = "Copied!";
  copyMarkerTextBtnEl.disabled = true;
  clearTimeout(copyFeedbackTimer);
  copyFeedbackTimer = setTimeout(() => {
    copyMarkerTextBtnEl.textContent = defaultLabel;
    copyMarkerTextBtnEl.disabled = !markerEligibleForCopy;
  }, 2000);
}

function escapeHtml(text) {
  if (text == null) {
    return "";
  }
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function addMapMarkers(data) {
  data.forEach((marker) => {
    const markerNum = marker.markerNumber || String(marker.id);
    const locationLine = `${marker.county}${marker.city ? ` - ${marker.city}` : ""}`;
    const markerText = (marker.text || "No marker text available.").replaceAll("\n", " ").trim();
    const previewText = markerText.length > 260 ? `${markerText.slice(0, 260)}...` : markerText;
    const hoverPreview =
      markerText.length > 140 ? `${markerText.slice(0, 140).trimEnd()}…` : markerText;
    const tooltipHtml =
      `<div class="marker-tooltip-body">` +
      `<div class="marker-tooltip-num">Marker #${escapeHtml(markerNum)}</div>` +
      `<div class="marker-tooltip-title">${escapeHtml(marker.title)}</div>` +
      `<div class="marker-tooltip-snippet">${escapeHtml(hoverPreview)}</div>` +
      `<div class="marker-tooltip-loc">${escapeHtml(locationLine)}</div>` +
      `</div>`;
    const leafletMarker = L.marker([marker.lat, marker.lng])
      .bindTooltip(tooltipHtml, {
        direction: "top",
        sticky: true,
        opacity: 0.96,
        className: "marker-hover-tooltip"
      })
      .bindPopup(
        `<strong>${escapeHtml(marker.title)}</strong><br />` +
          `<small>Marker #${escapeHtml(markerNum)}</small><br />` +
          `<small>${escapeHtml(locationLine)}</small><br /><br />` +
          `<span>${escapeHtml(previewText)}</span><br /><br />` +
          `<button type="button" class="popup-read-more-btn" data-marker-id="${escapeHtml(marker.id)}">Read full text</button>`
      );
    leafletMarker.on("click", () => {
      selectMarker(marker);
    });
    markerById.set(marker.id, leafletMarker);
  });
}

map.on("popupopen", (event) => {
  const popupEl = event.popup.getElement();
  if (!popupEl) {
    return;
  }
  const readMoreBtn = popupEl.querySelector(".popup-read-more-btn");
  if (!readMoreBtn) {
    return;
  }
  readMoreBtn.addEventListener("click", () => {
    const markerId = readMoreBtn.dataset.markerId;
    const marker = markers.find((item) => String(item.id) === String(markerId));
    if (!marker) {
      return;
    }
    selectMarker(marker);
    if (detailPanelEl) {
      detailPanelEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

function getFilteredMarkers() {
  const query = searchEl.value.trim().toLowerCase();
  const county = countyFilterEl.value;
  return markers.filter((marker) => {
    if (nearbyMarkerIds && !nearbyMarkerIds.has(marker.id)) {
      return false;
    }
    const countyMatches = !county || marker.county === county;
    if (!countyMatches) {
      return false;
    }
    if (wordCloudFilterToken) {
      const ids = inscriptionWordToIds.get(wordCloudFilterToken);
      if (!ids || !ids.has(marker.id)) {
        return false;
      }
    }
    const haystack = `${marker.title} ${marker.county} ${marker.city || ""} ${marker.text || ""} ${markerMetadataSearchText(
      marker
    )}`.toLowerCase();
    return haystack.includes(query);
  });
}

function updateMapMarkers(filteredMarkers) {
  markerCluster.clearLayers();
  const maxMapMarkers = 4000;
  const onMap = new Set();
  filteredMarkers.slice(0, maxMapMarkers).forEach((marker) => {
    const mapMarker = markerById.get(marker.id);
    if (mapMarker) {
      markerCluster.addLayer(mapMarker);
      onMap.add(marker.id);
    }
  });
  if (selectedId != null && !onMap.has(selectedId)) {
    const extra = markerById.get(selectedId);
    if (extra) {
      markerCluster.addLayer(extra);
    }
  }
}

function haversineMiles(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function populateCountyFilter() {
  countyFilterEl.replaceChildren();
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All counties";
  countyFilterEl.appendChild(allOption);
  const counties = [...new Set(markers.map((marker) => marker.county).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
  counties.forEach((county) => {
    const option = document.createElement("option");
    option.value = county;
    option.textContent = county;
    countyFilterEl.appendChild(option);
  });
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Plain inscription or <mark> highlights for the active word-cloud token (whole-word, case-insensitive). */
function renderDetailInscriptionText(marker) {
  if (!detailTextEl) {
    return;
  }
  const raw = marker.text || "";
  const placeholder = "No marker text available.";
  const token = wordCloudFilterToken;
  if (!raw) {
    detailTextEl.textContent = placeholder;
    return;
  }
  if (!token) {
    detailTextEl.textContent = raw;
    return;
  }
  const re = new RegExp(`\\b${escapeRegExp(token)}\\b`, "gi");
  const matches = [...raw.matchAll(re)];
  if (!matches.length) {
    detailTextEl.textContent = raw;
    return;
  }
  detailTextEl.replaceChildren();
  let last = 0;
  for (const m of matches) {
    const idx = m.index;
    if (idx > last) {
      detailTextEl.appendChild(document.createTextNode(raw.slice(last, idx)));
    }
    const mark = document.createElement("mark");
    mark.className = "inscription-highlight";
    mark.textContent = m[0];
    detailTextEl.appendChild(mark);
    last = idx + m[0].length;
  }
  if (last < raw.length) {
    detailTextEl.appendChild(document.createTextNode(raw.slice(last)));
  }
}

function refreshDetailInscriptionIfSelected() {
  if (selectedId == null) {
    return;
  }
  const marker =
    markerEligibleForCopy && markerEligibleForCopy.id === selectedId
      ? markerEligibleForCopy
      : markers.find((x) => x.id === selectedId);
  if (marker) {
    renderDetailInscriptionText(marker);
  }
}

function selectMarker(marker, options = {}) {
  const { skipUrlUpdate = false } = options;
  selectedId = marker.id;
  markerEligibleForCopy = marker;
  if (copyMarkerTextBtnEl) {
    copyMarkerTextBtnEl.disabled = false;
    copyMarkerTextBtnEl.textContent = "Copy marker text";
  }
  const markerNum = marker.markerNumber || String(marker.id);
  detailTitleEl.textContent = marker.title;
  detailCountyEl.textContent = `${marker.county}${marker.city ? ` - ${marker.city}` : ""} (Marker #${markerNum})`;
  renderDetailAtlasFields(marker);
  updateGoogleMapsUI(marker);
  updateAtlasDetailLinkUI(marker);
  renderDetailInscriptionText(marker);
  const titleSuffix = marker.title.length > 45 ? `${marker.title.slice(0, 45)}…` : marker.title;
  document.title = `Marker ${markerNum}: ${titleSuffix} — ${activeState().heading}`;
  if (!skipUrlUpdate) {
    pushMarkerUrl(marker);
  }
  applyFilters();
  const mapMarker = markerById.get(marker.id);
  const centerOnMarker = () => {
    if (!mapMarker) {
      map.flyTo([marker.lat, marker.lng], 14, { duration: 0.55 });
      return;
    }
    const targetZoom = Math.max(map.getZoom(), 14);
    map.flyTo([marker.lat, marker.lng], targetZoom, { duration: 0.55 });
    mapMarker.openPopup();
  };
  if (mapMarker && typeof markerCluster.zoomToShowLayer === "function") {
    markerCluster.zoomToShowLayer(mapMarker, () => {
      requestAnimationFrame(() => {
        map.invalidateSize();
        map.flyTo([marker.lat, marker.lng], Math.max(map.getZoom(), 14), { duration: 0.45 });
        mapMarker.openPopup();
      });
    });
  } else {
    centerOnMarker();
  }
}

function renderList(filtered) {
  listEl.innerHTML = "";

  if (!filtered.length) {
    const empty = document.createElement("li");
    empty.textContent = "No markers match your search.";
    listEl.appendChild(empty);
    return;
  }

  const maxVisible = 500;
  filtered.slice(0, maxVisible).forEach((marker) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    if (marker.id === selectedId) {
      btn.classList.add("active");
    }
    const distance = nearbyDistanceById.get(marker.id);
    const distanceText = distance ? ` - ${distance.toFixed(1)} mi` : "";
    const title = document.createElement("strong");
    title.textContent = marker.title;
    const location = document.createElement("span");
    location.textContent = `${marker.county}${distanceText}`;
    btn.appendChild(title);
    btn.appendChild(document.createElement("br"));
    btn.appendChild(location);
    btn.addEventListener("click", () => selectMarker(marker));
    li.appendChild(btn);
    listEl.appendChild(li);
  });

  if (filtered.length > maxVisible) {
    const note = document.createElement("li");
    note.textContent = `Showing first ${maxVisible} of ${filtered.length} results. Keep typing to narrow results.`;
    listEl.appendChild(note);
  }
}

function applyFilters() {
  const filtered = getFilteredMarkers();
  if (nearbyMarkerIds) {
    filtered.sort((a, b) => {
      const aDist = nearbyDistanceById.get(a.id) ?? Number.POSITIVE_INFINITY;
      const bDist = nearbyDistanceById.get(b.id) ?? Number.POSITIVE_INFINITY;
      return aDist - bDist;
    });
  }
  renderList(filtered);
  updateMapMarkers(filtered);
}

function applyNearbyFromCenter(centerLat, centerLng, maxDistanceMiles) {
  nearbyDistanceById.clear();
  markers.forEach((marker) => {
    const distance = haversineMiles(centerLat, centerLng, marker.lat, marker.lng);
    if (distance <= maxDistanceMiles) {
      nearbyDistanceById.set(marker.id, distance);
    }
  });
  nearbyMarkerIds = new Set(nearbyDistanceById.keys());
}

async function resolveZipCenter(zip) {
  const offline = lookupZipOffline(zip);
  if (offline) {
    return {
      lat: offline.lat,
      lng: offline.lng,
      label: `${offline.place || activeState().name}, ${offline.state || activeStateCode}`
    };
  }
  if (!navigator.onLine) {
    throw new Error("OFFLINE_NO_ZIP");
  }
  const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
  if (!response.ok) {
    throw new Error("ZIP not found");
  }
  const zipData = await response.json();
  const place = zipData.places && zipData.places[0];
  if (!place) {
    throw new Error("ZIP lookup returned no coordinates");
  }
  const resultState = String(place["state abbreviation"] || zipData["state abbreviation"] || "").toUpperCase();
  if (resultState && resultState !== activeStateCode) {
    throw new Error("ZIP_WRONG_STATE");
  }
  return {
    lat: Number(place.latitude),
    lng: Number(place.longitude),
    label: `${place["place name"] || zip}, ${resultState || activeStateCode}`
  };
}

async function lookupByZipCode() {
  const zip = zipCodeEl.value.trim();
  if (!zip) {
    nearbyMarkerIds = null;
    nearbyDistanceById.clear();
    clearMyLocationReadout();
    applyFilters();
    setDetailMessage("Nearby filter cleared", "Showing all markers again.");
    return;
  }
  if (!/^\d{5}$/.test(zip)) {
    setDetailMessage("Invalid ZIP code", "Please enter a valid 5-digit ZIP code.");
    return;
  }

  zipCodeBtnEl.disabled = true;
  zipCodeBtnEl.textContent = "Loading...";
  try {
    const center = await resolveZipCenter(zip);
    const centerLat = center.lat;
    const centerLng = center.lng;
    const maxDistanceMiles = Number(radiusFilterEl.value) || 25;

    clearMyLocationReadout();
    applyNearbyFromCenter(centerLat, centerLng, maxDistanceMiles);

    if (!nearbyMarkerIds.size) {
      setDetailMessage("No nearby markers", `No markers found within ${maxDistanceMiles} miles of ZIP ${zip}.`);
      applyFilters();
      return;
    }

    countyFilterEl.value = "";
    searchEl.value = "";
    resetInscriptionWordFilterOnly();
    applyFilters();

    const nearbyMarkers = markers
      .filter((marker) => nearbyMarkerIds.has(marker.id))
      .sort((a, b) => nearbyDistanceById.get(a.id) - nearbyDistanceById.get(b.id))
      .slice(0, 200);
    const bounds = L.latLngBounds(nearbyMarkers.map((marker) => [marker.lat, marker.lng]));
    map.fitBounds(bounds, { padding: [30, 30] });

    setDetailMessage(
      "Nearby markers loaded",
      `Showing markers within ${maxDistanceMiles} miles of ZIP ${zip} (${center.label}).`
    );
  } catch (error) {
    let offlineMsg = "Could not look up that ZIP code. Please try another ZIP.";
    if (error && String(error.message) === "OFFLINE_NO_ZIP") {
      offlineMsg = activeState().offlineLookupsPath
        ? `That ZIP is not in the bundled ${activeState().name} ZIP list and you are offline. Try another ${activeStateCode} ZIP or use “Use my location”.`
        : `${activeState().name} ZIP lookup needs an internet connection. You can still use “Use my location” while offline.`;
    } else if (error && String(error.message) === "ZIP_WRONG_STATE") {
      offlineMsg = `That ZIP code is not in ${activeState().name}. Try a ${activeStateCode} ZIP code.`;
    }
    setDetailMessage("ZIP lookup failed", offlineMsg);
    console.error(error);
  } finally {
    zipCodeBtnEl.disabled = false;
    zipCodeBtnEl.textContent = "Near Me";
  }
}

async function resolveCityCenter(city) {
  const offline = lookupCityOffline(city);
  if (offline) {
    return { lat: offline.lat, lng: offline.lng, label: offline.label || city };
  }
  if (!navigator.onLine) {
    throw new Error("OFFLINE_NO_CITY");
  }
  const params = new URLSearchParams({
    format: "json",
    limit: "1",
    city,
    state: activeState().name,
    country: "USA"
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error("City lookup failed");
  }
  const places = await response.json();
  const place = places && places[0];
  if (!place) {
    throw new Error("City not found");
  }
  return { lat: Number(place.lat), lng: Number(place.lon), label: city };
}

async function lookupByCityName() {
  const city = cityNameEl.value.trim();
  if (!city) {
    setDetailMessage("Enter a city", `Type a ${activeState().name} city name, then click Find City.`);
    return;
  }

  cityNameBtnEl.disabled = true;
  cityNameBtnEl.textContent = "Loading...";
  try {
    const center = await resolveCityCenter(city);
    const centerLat = center.lat;
    const centerLng = center.lng;
    const maxDistanceMiles = Number(radiusFilterEl.value) || 25;
    clearMyLocationReadout();
    applyNearbyFromCenter(centerLat, centerLng, maxDistanceMiles);

    if (!nearbyMarkerIds.size) {
      setDetailMessage("No nearby markers", `No markers found within ${maxDistanceMiles} miles of ${city}.`);
      applyFilters();
      return;
    }

    zipCodeEl.value = "";
    countyFilterEl.value = "";
    searchEl.value = "";
    resetInscriptionWordFilterOnly();
    applyFilters();

    const nearbyMarkers = markers
      .filter((marker) => nearbyMarkerIds.has(marker.id))
      .sort((a, b) => nearbyDistanceById.get(a.id) - nearbyDistanceById.get(b.id))
      .slice(0, 200);
    const bounds = L.latLngBounds(nearbyMarkers.map((marker) => [marker.lat, marker.lng]));
    map.fitBounds(bounds, { padding: [30, 30] });

    setDetailMessage(
      "Nearby markers loaded",
      `Showing markers within ${maxDistanceMiles} miles of ${center.label || city}.`
    );
  } catch (error) {
    const offlineMsg =
      error && String(error.message) === "OFFLINE_NO_CITY"
        ? "No bundled city match and you are offline. Try a city name that appears on markers, or use ZIP / GPS."
        : "Could not find that city. Try another city name.";
    setDetailMessage("City lookup failed", offlineMsg);
    console.error(error);
  } finally {
    cityNameBtnEl.disabled = false;
    cityNameBtnEl.textContent = "Find City";
  }
}

function clearMyLocationReadout() {
  if (!myLocationReadoutEl) {
    return;
  }
  myLocationReadoutEl.hidden = true;
  myLocationReadoutEl.textContent = "";
  myLocationReadoutEl.classList.remove("is-error");
}

/** Shows the coordinates the browser returned (WGS 84) so you can verify a real fix on mobile. */
function showMyLocationGpsReadout(pos) {
  if (!myLocationReadoutEl) {
    return;
  }
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const latStr = Number(lat).toFixed(5);
  const lngStr = Number(lng).toFixed(5);
  const accM = pos.coords.accuracy;
  const accPart =
    typeof accM === "number" && Number.isFinite(accM) ? ` Estimated accuracy: about ${Math.round(accM)} m.` : "";
  const ts =
    typeof pos.timestamp === "number" && Number.isFinite(pos.timestamp)
      ? new Date(pos.timestamp)
      : new Date();
  const timePart = ` Reported at ${ts.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "medium"
  })}.`;
  myLocationReadoutEl.classList.remove("is-error");
  myLocationReadoutEl.textContent =
    `GPS fix used for nearby search: latitude ${latStr}°, longitude ${lngStr}° (WGS 84).${accPart}${timePart}`;
  myLocationReadoutEl.hidden = false;
}

function showMyLocationGpsErrorReadout(message) {
  if (!myLocationReadoutEl) {
    return;
  }
  myLocationReadoutEl.classList.add("is-error");
  myLocationReadoutEl.textContent = message;
  myLocationReadoutEl.hidden = false;
}

function setMyLocationReadoutPending() {
  if (!myLocationReadoutEl) {
    return;
  }
  myLocationReadoutEl.classList.remove("is-error");
  myLocationReadoutEl.textContent = "Requesting location from your device…";
  myLocationReadoutEl.hidden = false;
}

function lookupByMyLocation() {
  if (!navigator.geolocation) {
    setDetailMessage("Location unavailable", "This browser does not support the Geolocation API.");
    showMyLocationGpsErrorReadout("Geolocation is not available in this browser.");
    return;
  }
  if (!myLocationBtnEl) {
    return;
  }

  const prevLabel = myLocationBtnEl.textContent;
  myLocationBtnEl.disabled = true;
  myLocationBtnEl.textContent = "Locating…";
  setMyLocationReadoutPending();

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const centerLat = pos.coords.latitude;
      const centerLng = pos.coords.longitude;
      const maxDistanceMiles = Number(radiusFilterEl.value) || 25;
      showMyLocationGpsReadout(pos);
      applyNearbyFromCenter(centerLat, centerLng, maxDistanceMiles);

      if (!nearbyMarkerIds.size) {
        setDetailMessage(
          "No nearby markers",
          `No markers found within ${maxDistanceMiles} miles of your location.`
        );
        applyFilters();
        myLocationBtnEl.disabled = false;
        myLocationBtnEl.textContent = prevLabel;
        return;
      }

      zipCodeEl.value = "";
      cityNameEl.value = "";
      countyFilterEl.value = "";
      searchEl.value = "";
      resetInscriptionWordFilterOnly();
      applyFilters();

      const nearbyMarkers = markers
        .filter((marker) => nearbyMarkerIds.has(marker.id))
        .sort((a, b) => nearbyDistanceById.get(a.id) - nearbyDistanceById.get(b.id))
        .slice(0, 200);
      const bounds = L.latLngBounds(nearbyMarkers.map((marker) => [marker.lat, marker.lng]));
      bounds.extend([centerLat, centerLng]);
      map.fitBounds(bounds, { padding: [30, 30] });

      const accM = pos.coords.accuracy;
      const accText =
        typeof accM === "number" && Number.isFinite(accM) ? ` GPS accuracy about ${Math.round(accM)} m.` : "";
      setDetailMessage(
        "Nearby markers loaded",
        `Showing markers within ${maxDistanceMiles} miles of your location.${accText}`
      );
      myLocationBtnEl.disabled = false;
      myLocationBtnEl.textContent = prevLabel;
    },
    (err) => {
      let detail = "Could not read your location.";
      if (err && err.code === 1) {
        detail =
          "Location permission was denied. Allow location access for this site in your browser settings, then try again.";
      } else if (err && err.code === 2) {
        detail = "Your position could not be determined.";
      } else if (err && err.code === 3) {
        detail = "The location request timed out.";
      }
      setDetailMessage("Location failed", detail);
      showMyLocationGpsErrorReadout(`No GPS fix: ${detail}`);
      myLocationBtnEl.disabled = false;
      myLocationBtnEl.textContent = prevLabel;
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
  );
}

function lookupMarkerByNumber() {
  const raw = markerNumberEl.value.trim();
  if (!raw) {
    setDetailMessage("Enter a marker number", "Type a historical marker number, then click Go.");
    return;
  }

  const found = findMarkerByUrlToken(raw);

  if (!found) {
    setDetailMessage("Marker not found", `No marker was found for number ${raw}.`);
    return;
  }

  nearbyMarkerIds = null;
  nearbyDistanceById.clear();
  clearMyLocationReadout();
  zipCodeEl.value = "";
  cityNameEl.value = "";
  searchEl.value = "";
  countyFilterEl.value = "";
  resetInscriptionWordFilterOnly();
  selectMarker(found);
}

function selectRandomMarker() {
  if (!markers.length) {
    setDetailMessage("No marker data", "Marker data is not loaded yet.");
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
  const idx = Math.floor(Math.random() * markers.length);
  selectMarker(markers[idx]);
  if (detailPanelEl) {
    detailPanelEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

searchEl.addEventListener("input", () => {
  resetInscriptionWordFilterOnly();
  applyFilters();
  refreshDetailInscriptionIfSelected();
});

countyFilterEl.addEventListener("change", () => {
  applyFilters();
});

markerNumberBtnEl.addEventListener("click", lookupMarkerByNumber);
markerNumberEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    lookupMarkerByNumber();
  }
});

randomMarkerBtnEl.addEventListener("click", selectRandomMarker);

if (wordCloudClearBtnEl) {
  wordCloudClearBtnEl.addEventListener("click", () => {
    clearInscriptionWordFilter();
  });
}

if (wordCloudRefreshBtnEl) {
  wordCloudRefreshBtnEl.addEventListener("click", () => {
    refreshWordCloudInApp();
  });
}

copyMarkerTextBtnEl.addEventListener("click", () => {
  void copyMarkerTextToClipboard();
});

if (googleDirectionsBtnEl) {
  googleDirectionsBtnEl.addEventListener("click", () => {
    const m = markerEligibleForCopy;
    if (m) {
      openGoogleDrivingDirectionsFromHere(m);
    }
  });
}

async function refreshMarkerDataFromServer() {
  if (!refreshMarkersBtnEl) {
    return;
  }
  const state = activeState();
  const confirmed = window.confirm(
    `Download fresh marker data from the ${state.refreshDescription}?\n\n` +
      `This replaces ${state.dataPath} on disk and may take several minutes. ` +
      (state.code === "TX"
        ? "Requires pyshp (pip install pyshp) and a working internet connection."
        : state.code === "NC"
          ? "A full North Carolina refresh also rebuilds the DNCR photograph index and requires a working internet connection."
          : "The California pilot is a reviewed snapshot; no automated refresh is included yet.")
  );
  if (!confirmed) {
    return;
  }

  const prevLabel = refreshMarkersBtnEl.textContent;
  refreshMarkersBtnEl.disabled = true;
  refreshMarkersBtnEl.textContent = "Updating…";
  if (refreshMarkersStatusEl) {
    refreshMarkersStatusEl.hidden = false;
    refreshMarkersStatusEl.classList.remove("is-error");
    refreshMarkersStatusEl.textContent = state.refreshStatus;
  }

  try {
    const response = await fetch(new URL("/api/refresh-markers", window.location.origin), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ state: state.code })
    });
    const rawText = await response.text();
    const contentType = (response.headers.get("Content-Type") || "").toLowerCase();
    const looksLikeServerHtmlError =
      contentType.includes("text/html") ||
      /^\s*<!DOCTYPE/i.test(rawText) ||
      /^\s*<html/i.test(rawText);

    let data = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = null;
    }

    const wrongServer =
      response.status === 404 ||
      response.status === 405 ||
      response.status === 501 ||
      (looksLikeServerHtmlError && !data);

    if (wrongServer) {
      throw new Error(
        "THM_UNAVAILABLE: In-app updates need the project’s custom server. In a terminal: cd to the THM folder, run python serve.py, open that URL (e.g. http://127.0.0.1:8080/). " +
          `Live Server and python -m http.server cannot run the update. Or run manually: ${state.manualRefreshCommand}`
      );
    }

    if (!response.ok || !data || !data.ok) {
      const msg = (data && data.error) || `Request failed (${response.status})`;
      throw new Error(msg);
    }

    if (refreshMarkersStatusEl) {
      refreshMarkersStatusEl.textContent = "Update complete. Reloading…";
    }
    if ("caches" in window) {
      try {
        const cacheKeys = await caches.keys();
        for (const name of cacheKeys) {
          const cache = await caches.open(name);
          for (const req of await cache.keys()) {
            if (req.url.includes("markers.json")) {
              await cache.delete(req);
            }
          }
        }
      } catch (_) {
        /* ignore cache clear failures */
      }
    }
    window.location.reload();
  } catch (error) {
    const message =
      error && error.name === "TypeError" && String(error.message).includes("fetch")
        ? "Could not reach the update service. Use python serve.py from the project folder, then try again."
        : String(error.message || error);
    if (refreshMarkersStatusEl) {
      refreshMarkersStatusEl.classList.add("is-error");
      refreshMarkersStatusEl.textContent = message.startsWith("THM_UNAVAILABLE:")
        ? message.replace(/^THM_UNAVAILABLE:\s*/, "")
        : message;
    }
    console.error(error);
  } finally {
    refreshMarkersBtnEl.disabled = false;
    refreshMarkersBtnEl.textContent = prevLabel;
  }
}

if (resetAppBtnEl) {
  resetAppBtnEl.addEventListener("click", () => {
    resetAppToInitialState();
  });
}

if (refreshMarkersBtnEl) {
  if (isBundledNativeApp()) {
    refreshMarkersBtnEl.hidden = true;
    if (refreshMarkersStatusEl) {
      refreshMarkersStatusEl.hidden = true;
    }
  } else if (isGitHubPagesHost()) {
    refreshMarkersBtnEl.hidden = true;
    if (refreshMarkersStatusEl) {
      refreshMarkersStatusEl.hidden = true;
    }
    if (hostedUpdateInfoBtnEl) {
      hostedUpdateInfoBtnEl.hidden = false;
    }
  } else {
    refreshMarkersBtnEl.addEventListener("click", () => {
      void refreshMarkerDataFromServer();
    });
  }
}

function isRunningStandalone() {
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return true;
    }
    if (window.matchMedia("(display-mode: minimal-ui)").matches) {
      return true;
    }
  } catch (_) {
    /* ignore */
  }
  return (
    /** @type {Navigator & { standalone?: boolean }} */ (window.navigator).standalone === true
  );
}

function isLikelyIos() {
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) {
    return true;
  }
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/** @type {Event | null} */
let deferredInstallPrompt = null;

function updateAddToHomeButton() {
  if (!addToHomeBtnEl) {
    return;
  }
  if (isBundledNativeApp() || isRunningStandalone()) {
    addToHomeBtnEl.hidden = true;
    return;
  }
  addToHomeBtnEl.hidden = false;
  if (deferredInstallPrompt) {
    addToHomeBtnEl.textContent = "Install app";
  } else {
    addToHomeBtnEl.textContent = "Add to Home Screen";
  }
}

function openAddToHomeHelp() {
  if (addToHomeIosHintEl && addToHomeGenericHintEl) {
    const ios = isLikelyIos();
    addToHomeIosHintEl.hidden = !ios;
    addToHomeGenericHintEl.hidden = ios;
  }
  if (addToHomeDialogEl && typeof addToHomeDialogEl.showModal === "function") {
    addToHomeDialogEl.showModal();
  }
}

async function onAddToHomeScreenClick() {
  const pip = deferredInstallPrompt;
  if (pip && typeof pip === "object" && typeof pip.prompt === "function") {
    try {
      await pip.prompt();
    } catch (_) {
      /* user dismissed or prompt not available */
    }
    deferredInstallPrompt = null;
    updateAddToHomeButton();
    return;
  }
  openAddToHomeHelp();
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateAddToHomeButton();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  updateAddToHomeButton();
});

if (addToHomeBtnEl) {
  addToHomeBtnEl.addEventListener("click", () => {
    void onAddToHomeScreenClick();
  });
}

if (addToHomeDialogCloseEl && addToHomeDialogEl) {
  addToHomeDialogCloseEl.addEventListener("click", () => {
    addToHomeDialogEl.close();
  });
  addToHomeDialogEl.addEventListener("click", (ev) => {
    if (ev.target === addToHomeDialogEl) {
      addToHomeDialogEl.close();
    }
  });
}

if (hostedUpdateInfoBtnEl && hostedUpdateDialogEl) {
  hostedUpdateInfoBtnEl.addEventListener("click", () => {
    if (typeof hostedUpdateDialogEl.showModal === "function") {
      hostedUpdateDialogEl.showModal();
    } else {
      hostedUpdateDialogEl.setAttribute("open", "");
    }
  });
}

if (hostedUpdateDialogCloseEl && hostedUpdateDialogEl) {
  hostedUpdateDialogCloseEl.addEventListener("click", () => {
    if (typeof hostedUpdateDialogEl.close === "function") {
      hostedUpdateDialogEl.close();
    } else {
      hostedUpdateDialogEl.removeAttribute("open");
    }
  });
  hostedUpdateDialogEl.addEventListener("click", (event) => {
    if (event.target === hostedUpdateDialogEl) {
      if (typeof hostedUpdateDialogEl.close === "function") {
        hostedUpdateDialogEl.close();
      } else {
        hostedUpdateDialogEl.removeAttribute("open");
      }
    }
  });
}

if (aboutBtnEl && aboutDialogEl) {
  aboutBtnEl.addEventListener("click", () => {
    renderAboutInformation();
    if (typeof aboutDialogEl.showModal === "function") {
      aboutDialogEl.showModal();
    } else {
      aboutDialogEl.setAttribute("open", "");
    }
  });
}

if (aboutDialogCloseEl && aboutDialogEl) {
  aboutDialogCloseEl.addEventListener("click", () => {
    if (typeof aboutDialogEl.close === "function") {
      aboutDialogEl.close();
    } else {
      aboutDialogEl.removeAttribute("open");
    }
  });
  aboutDialogEl.addEventListener("click", (event) => {
    if (event.target === aboutDialogEl) {
      if (typeof aboutDialogEl.close === "function") {
        aboutDialogEl.close();
      } else {
        aboutDialogEl.removeAttribute("open");
      }
    }
  });
}

if (aboutCopySupportBtnEl) {
  aboutCopySupportBtnEl.addEventListener("click", async () => {
    const defaultLabel = "Copy support information";
    const copied = await copyPlainText(buildSupportInformation());
    aboutCopySupportBtnEl.textContent = copied ? "Support information copied" : "Could not copy";
    window.setTimeout(() => {
      aboutCopySupportBtnEl.textContent = defaultLabel;
    }, 2200);
  });
}

updateAddToHomeButton();

zipCodeBtnEl.addEventListener("click", lookupByZipCode);
zipCodeEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    lookupByZipCode();
  }
});

cityNameBtnEl.addEventListener("click", lookupByCityName);
cityNameEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    lookupByCityName();
  }
});

if (myLocationBtnEl) {
  myLocationBtnEl.addEventListener("click", () => {
    lookupByMyLocation();
  });
}

function stateCodeFromCurrentUrl() {
  if (isLegacyTexasPublicDeployment()) {
    return "TX";
  }
  return normalizeStateCode(new URLSearchParams(window.location.search).get("state")) || "TX";
}

function resetUiForStateLoad() {
  markers = [];
  selectedId = null;
  nearbyMarkerIds = null;
  nearbyDistanceById.clear();
  markerCluster.clearLayers();
  markerById.clear();
  map.closePopup();
  clearCopyMarkerTarget();
  clearMyLocationReadout();
  clearDetailAtlasFields();
  updateGoogleMapsUI(null);
  updateAtlasDetailLinkUI(null);
  hideWordCloudEmpty();
  offlineLookups = null;
  currentMarkerCount = null;
  currentMarkerDataUpdated = null;
  searchEl.value = "";
  cityNameEl.value = "";
  if (citySuggestionsEl) {
    citySuggestionsEl.replaceChildren();
  }
  zipCodeEl.value = "";
  markerNumberEl.value = "";
  countyFilterEl.replaceChildren();
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All counties";
  countyFilterEl.appendChild(allOption);
  listEl.innerHTML = `<li>Loading ${activeState().name} marker data…</li>`;
  detailTitleEl.textContent = `Loading ${activeState().name} markers…`;
  detailCountyEl.textContent = "";
  detailTextEl.textContent = "Please wait while the selected state dataset loads.";
  hideDataUpdatedNotice();
  map.setView(activeState().mapCenter, activeState().mapZoom);
  document.title = activeBasePageTitle();
  if (randomMarkerBtnEl) {
    randomMarkerBtnEl.disabled = true;
  }
  if (wordCloudRefreshBtnEl) {
    wordCloudRefreshBtnEl.disabled = true;
  }
  renderAboutInformation();
}

async function loadStateDataset(code) {
  const normalized = normalizeStateCode(code) || "TX";
  activeStateCode = normalized;
  const generation = ++stateLoadGeneration;
  storeStatePreference(normalized);
  applyStateChrome();
  resetUiForStateLoad();
  if (stateSelectorEl) {
    stateSelectorEl.disabled = true;
  }

  await loadOfflineLookups();
  if (generation !== stateLoadGeneration) {
    return;
  }

  try {
    const dataUrl = markersJsonUrl();
    const response = await fetch(dataUrl.href, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load markers data: ${response.status}`);
    }
    const lastModifiedHeader = response.headers.get("Last-Modified");
    const payload = await response.json();
    if (generation !== stateLoadGeneration) {
      return;
    }
    let dataUpdatedIso = null;
    let loadedMarkers = null;
    if (Array.isArray(payload)) {
      loadedMarkers = payload;
    } else if (payload && Array.isArray(payload.markers)) {
      loadedMarkers = payload.markers;
      dataUpdatedIso = payload.dataUpdated || payload.lastUpdated || null;
    } else {
      throw new Error("Invalid markers data: expected an array or an object with a markers array.");
    }
    markers = loadedMarkers.map((marker, index) => {
      if (activeStateCode !== "NC") {
        return marker;
      }
      const markerNumber = String(marker.markerNumber || marker.id || index).trim().toUpperCase();
      return {
        ...marker,
        sourceObjectId: marker.id,
        id: `NC:${markerNumber}`
      };
    });
    setDataUpdatedNotice(dataUpdatedIso, dataUpdatedIso ? null : lastModifiedHeader, markers.length);
    bumpHeaderLayout();
    addMapMarkers(markers);
    populateCountyFilter();
    populateCitySuggestions();
    buildInscriptionWordIndex(markers);
    renderWordCloud();
    if (getMarkerTokenFromLocation()) {
      applyDeepLinkFromUrl();
    } else {
      clearSelectionDetail();
    }
    if (randomMarkerBtnEl) {
      randomMarkerBtnEl.disabled = false;
    }
    if (wordCloudRefreshBtnEl) {
      wordCloudRefreshBtnEl.disabled = false;
    }
    requestAnimationFrame(() => map.invalidateSize());
  } catch (error) {
    if (generation !== stateLoadGeneration) {
      return;
    }
    listEl.innerHTML = `<li>Could not load ${activeState().name} marker data.</li>`;
    hideDataUpdatedNotice();
    clearCopyMarkerTarget();
    detailTitleEl.textContent = "Data load error";
    detailCountyEl.textContent = "";
    clearDetailAtlasFields();
    updateGoogleMapsUI(null);
    updateAtlasDetailLinkUI(null);
    hideWordCloudEmpty();
    detailTextEl.textContent =
      `Could not load ${activeState().dataPath}. Run python serve.py from the project root and try again.`;
    console.error(error);
  } finally {
    if (generation === stateLoadGeneration && stateSelectorEl) {
      stateSelectorEl.disabled = false;
    }
  }
}

async function switchState(code, options = {}) {
  const normalized = isLegacyTexasPublicDeployment() ? "TX" : normalizeStateCode(code);
  if (!normalized) {
    return;
  }
  const { fromHistory = false } = options;
  if (!fromHistory) {
    const url = new URL(window.location.href);
    url.searchParams.delete("marker");
    url.searchParams.delete("m");
    url.hash = "";
    applyStateToUrl(url, normalized);
    window.history.pushState({ state: normalized }, "", url.toString());
  }
  await loadStateDataset(normalized);
}

if (stateSelectorEl) {
  stateSelectorEl.addEventListener("change", () => {
    void switchState(stateSelectorEl.value);
  });
}

window.addEventListener("popstate", () => {
  const stateFromUrl = stateCodeFromCurrentUrl();
  if (stateFromUrl !== activeStateCode) {
    void switchState(stateFromUrl, { fromHistory: true });
    return;
  }
  const token = getMarkerTokenFromLocation();
  if (token) {
    const found = findMarkerByUrlToken(token);
    if (found) {
      selectMarker(found, { skipUrlUpdate: true });
    } else {
      clearSelectionDetail();
    }
  } else {
    clearSelectionDetail();
  }
});

async function init() {
  applyStateChrome();
  listEl.innerHTML = "<li>Loading marker data...</li>";
  if (!canLoadBundledJson()) {
    listEl.innerHTML = "<li>Cannot load marker data from a file:// URL.</li>";
    hideDataUpdatedNotice();
    clearCopyMarkerTarget();
    detailTitleEl.textContent = "Use a local server or install the app";
    detailCountyEl.textContent = "";
    clearDetailAtlasFields();
    updateGoogleMapsUI(null);
    updateAtlasDetailLinkUI(null);
    detailTextEl.textContent =
      "Browsers block loading bundled JSON from a saved HTML file. Run python serve.py and open http://127.0.0.1:8080/, or build the Capacitor app (see README).";
    if (randomMarkerBtnEl) {
      randomMarkerBtnEl.disabled = true;
    }
    hideWordCloudEmpty();
    return;
  }
  await loadAppMeta();
  await loadStateDataset(activeStateCode);
}

init();
