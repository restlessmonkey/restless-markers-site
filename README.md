## Current public release — September 22, 2026

**App build:** 1.10.3-mobile-explore  
**Live site:** <https://restlessmonkey.github.io/restless-markers-site/>

The site currently contains **33,777** historical-marker records across Texas, North Carolina, California, Michigan, and Virginia.

| State | Markers | Current photo enrichment |
|---|---:|---|
| Texas | 15,230 | 11,678 selected remote HMdb image URLs |
| Virginia | 2,680 | 2,425 selected remote HMdb image URLs for 2,405 markers |

Remote images remain on HMdb; this repository does not store Texas or Virginia HMdb JPEG assets. State agencies remain authoritative for their marker identity and text. Virginia is currently HMdb-enriched; the planned future source order is verified DHR marker image first, then HMdb only when DHR has none.

The map renders the full active state result set when zoomed. The phone layout is map-first with collapsible nearby and Explore/search sections; iPad-width layouts keep nearby/ZIP controls open.

See [public project status](PROJECT-STATUS.md) for release and source notes.

# Restless Markers

**Explore America’s historical markers.**

This is the public browser-ready deployment repository for Restless Markers.

It intentionally contains only files needed by the public website and public marker datasets. Development, ingestion, audit, reconciliation, and validation tooling is maintained separately in the private canonical source repository.

## Data sources

Restless Markers brings together historical-marker information from public state programs and other attributed sources. Third-party data and content remain subject to their respective rights, licenses, terms, and attribution requirements.

**Historical Marker Database (HMDB): <https://www.hmdb.org/>**

HMDB is an outstanding independent historical-marker resource. Where an HMDB source record is available, Restless Markers links users to the original HMDB marker page for additional information.

See [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md) for source and software acknowledgments.

## Licensing status

No open-source license has been selected for the original Restless Markers application code at this time. The absence of a repository license does not alter the licenses or rights applicable to included third-party software or data.
