# Restless Markers — public project status

**Updated:** September 22, 2026  
**Current app build:** 1.10.3-mobile-explore  
**Live site:** <https://restlessmonkey.github.io/restless-markers-site/>

## Published data

| State | Runtime markers | Authority / source role |
|---|---:|---|
| Texas | 15,230 | Texas Historical Commission |
| North Carolina | 1,658 | North Carolina DNCR |
| California | 13,088 | HMdb physical-marker inventory with official OHP enrichment where deterministically matched |
| Michigan | 1,821 | Michigan DNR / Michigan History Center |
| Virginia | 2,680 | Virginia Department of Historic Resources |

Total: **33,777** markers.

## Photographs

Texas has 11,678 selected remote HMdb image URLs. Virginia has 2,425 selected remote HMdb image URLs associated with 2,405 DHR markers. The browser displays the remote source URL, credits the source/photographer where supplied, and links to the HMdb marker page. No Texas or Virginia HMdb JPEG files are included in this deployment repository.

Government/state sources remain authoritative for marker identity, official text, and program data. HMdb photo data is supplemental. For Virginia, the intended future policy is a verified marker-specific DHR image first and HMdb fallback only if no DHR image is available; a suitable DHR image endpoint remains under verification.

## Current browser behavior

- The map renders the complete active-state set while zooming rather than a 4,000-marker cap.
- ZIP 78613 was verified against the published Texas dataset: 11 markers within 5 miles and 513 within 25 miles.
- Mobile is map-first. Nearby and Explore/search controls are collapsible on phones; nearby controls automatically open at iPad widths so the ZIP search remains visible.
- The header shows the current app build. Versioned app URLs and a matching service-worker cache help identify and refresh browser releases.

## Public-repository boundary

This repository intentionally contains only browser runtime, public data, notices, and public documentation. Source acquisition, reconciliation, review, audit materials, and operational work files are maintained outside this public deployment.
