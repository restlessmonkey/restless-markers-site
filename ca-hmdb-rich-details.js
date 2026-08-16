(() => {
  "use strict";

  const ROW_ATTR = "data-ca-source-url-row";

  function isCaliforniaSelected() {
    const selector = document.getElementById("state-selector");
    return Boolean(selector && selector.value === "CA");
  }

  function currentMarker() {
    try {
      if (!isCaliforniaSelected() || typeof markers === "undefined" || !Array.isArray(markers)) {
        return null;
      }
      if (typeof selectedId === "undefined" || selectedId == null) {
        return null;
      }
      return markers.find((marker) => marker.id === selectedId) || null;
    } catch (_) {
      return null;
    }
  }

  function removeOldRows(fields) {
    fields.querySelectorAll(`[${ROW_ATTR}]`).forEach((node) => node.remove());
    delete fields.dataset.caSourceUrlsFor;
  }

  function appendUrlRow(fields, label, url, ariaLabel) {
    if (!url) return;
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    const link = document.createElement("a");
    dt.setAttribute(ROW_ATTR, "1");
    dd.setAttribute(ROW_ATTR, "1");
    dt.textContent = label;
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = url;
    link.setAttribute("aria-label", ariaLabel);
    dd.appendChild(link);
    fields.append(dt, dd);
  }

  function patchSourceUrlRows() {
    const fields = document.getElementById("detail-atlas-fields");
    if (!fields) return;

    if (!isCaliforniaSelected()) {
      removeOldRows(fields);
      return;
    }

    const marker = currentMarker();
    if (!marker) {
      removeOldRows(fields);
      return;
    }

    const ohpUrl = String(marker.ohpUrl || marker.officialSourceUrl || "").trim();
    const hmdbUrl = String(marker.hmdbUrl || "").trim();
    const validOhp = /^https:\/\/ohp\.parks\.ca\.gov\/ListedResources\/Detail\//i.test(ohpUrl) ? ohpUrl : "";
    const validHmDb = /^https:\/\/(www\.)?hmdb\.org\//i.test(hmdbUrl) ? hmdbUrl : "";
    const signature = `${marker.id}|${validOhp}|${validHmDb}`;
    const rowsExist = Boolean(fields.querySelector(`[${ROW_ATTR}]`));
    if (fields.dataset.caSourceUrlsFor === signature && rowsExist) return;

    removeOldRows(fields);
    appendUrlRow(
      fields,
      "Official California OHP source URL",
      validOhp,
      validOhp ? `Open official California OHP landmark page: ${validOhp}` : ""
    );
    appendUrlRow(
      fields,
      "HMDB physical-marker source URL",
      validHmDb,
      validHmDb ? `Open HMDB physical-marker page: ${validHmDb}` : ""
    );
    fields.dataset.caSourceUrlsFor = signature;
    fields.hidden = false;
  }

  function install() {
    patchSourceUrlRows();
    const fields = document.getElementById("detail-atlas-fields");
    const title = document.getElementById("detail-title");
    const selector = document.getElementById("state-selector");

    if (selector) {
      selector.addEventListener("change", () => setTimeout(patchSourceUrlRows, 0));
    }

    const observer = new MutationObserver(() => setTimeout(patchSourceUrlRows, 0));
    [fields, title].filter(Boolean).forEach((node) =>
      observer.observe(node, { subtree: true, childList: true, characterData: true })
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(install, 0), { once: true });
  } else {
    setTimeout(install, 0);
  }
})();
