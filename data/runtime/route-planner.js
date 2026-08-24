(function () {
  "use strict";

  const SAMPLE_MI = 0.5;
  let routeLine = null;
  let endpointLayers = [];
  let lastPlan = null;

  function mobile() {
    try { if (navigator.userAgentData) return Boolean(navigator.userAgentData.mobile); } catch (_) {}
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  }

  function googleUrl(a, b, stops) {
    const u = new URL("https://www.google.com/maps/dir/");
    u.searchParams.set("api", "1");
    u.searchParams.set("origin", `${a.lat},${a.lng}`);
    u.searchParams.set("destination", `${b.lat},${b.lng}`);
    u.searchParams.set("travelmode", "driving");
    if (stops.length) u.searchParams.set("waypoints", stops.map(m => `${m.lat},${m.lng}`).join("|"));
    return u.toString();
  }

  function makeUi() {
    if (document.getElementById("route-planner")) return;
    const anchor = document.querySelector('label[for="marker-number"]');
    if (!anchor) return;
    const box = document.createElement("section");
    box.id = "route-planner";
    box.className = "route-planner";
    box.innerHTML = `
      <style>
        .route-planner{margin:14px 0;padding:12px;border:1px solid #cfd8e3;border-radius:10px;background:#f8fafc}
        .route-planner-grid{display:grid;gap:7px}.route-planner-actions{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px}
        .route-planner-status{margin:8px 0 0;font-size:.86rem;line-height:1.35}.route-planner-status.err{color:#a61b1b}
        .route-planner-links{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}.route-planner-links a{text-decoration:none}
        .route-clear{border:1px solid #aeb8c4;background:#fff;border-radius:7px;padding:8px 10px;cursor:pointer}
        @media(max-width:520px){.route-planner-actions{grid-template-columns:1fr}.route-planner-links>*{flex:1 1 100%}}
      </style>
      <span class="label"><strong>Find markers along a driving route</strong></span>
      <p class="muted gps-location-hint">Enter a start and destination, then choose how far off the route you are willing to travel.</p>
      <div class="route-planner-grid">
        <input id="route-start" class="search-input" type="text" placeholder="Start (example: Austin, TX)" aria-label="Route starting point">
        <input id="route-end" class="search-input" type="text" placeholder="Destination (example: San Antonio, TX)" aria-label="Route destination">
        <div class="route-planner-actions">
          <select id="route-corridor" class="search-input" aria-label="Maximum distance from route">
            <option value="1">Within 1 mile</option><option value="2">Within 2 miles</option><option value="5" selected>Within 5 miles</option><option value="10">Within 10 miles</option><option value="25">Within 25 miles</option>
          </select>
          <button id="route-find" class="lookup-btn" type="button">Find Route</button>
        </div>
      </div>
      <p id="route-status" class="route-planner-status muted" role="status" aria-live="polite"></p>
      <div id="route-links" class="route-planner-links" hidden>
        <a id="route-google" class="google-maps-btn" target="_blank" rel="noopener noreferrer">Open route in Google Maps</a>
        <a id="route-google-stops" class="google-maps-btn" target="_blank" rel="noopener noreferrer" hidden></a>
        <button id="route-clear" class="route-clear" type="button">Clear route</button>
      </div>`;
    anchor.parentNode.insertBefore(box, anchor);
  }

  function status(text, err) {
    const el = document.getElementById("route-status");
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("err", Boolean(err));
  }

  function clearLayers() {
    if (routeLine && map.hasLayer(routeLine)) map.removeLayer(routeLine);
    endpointLayers.forEach(x => { if (map.hasLayer(x)) map.removeLayer(x); });
    routeLine = null; endpointLayers = [];
  }

  function clearRoute(keepInputs) {
    clearLayers(); lastPlan = null;
    nearbyMarkerIds = null; nearbyDistanceById.clear(); applyFilters();
    document.getElementById("route-links").hidden = true;
    status("");
    if (!keepInputs) { document.getElementById("route-start").value = ""; document.getElementById("route-end").value = ""; }
  }

  function parseCoords(text) {
    const m = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(text);
    if (!m) return null;
    const lat = Number(m[1]), lng = Number(m[2]);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? {lat,lng} : null;
  }

  async function geocode(text) {
    const direct = parseCoords(text); if (direct) return direct;
    const stateName = activeState().name;
    const p = new URLSearchParams({format:"jsonv2",limit:"1",q:`${text}, ${stateName}, USA`,email:"restlessmonkey.software@gmail.com"});
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${p}`, {headers:{Accept:"application/json"}});
    if (!r.ok) throw new Error(`Could not locate “${text}”.`);
    const a = await r.json(); if (!a[0]) throw new Error(`Could not locate “${text}” in ${stateName}.`);
    return {lat:Number(a[0].lat),lng:Number(a[0].lon)};
  }

  async function roadRoute(a,b) {
    const u = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson&steps=false`;
    const r = await fetch(u, {headers:{Accept:"application/json"}}); if (!r.ok) throw new Error("Road routing service failed.");
    const d = await r.json(); if (d.code !== "Ok" || !d.routes || !d.routes[0]) throw new Error("No drivable route was found.");
    return d.routes[0];
  }

  function samples(points) {
    const out=[{lat:points[0][0],lng:points[0][1],progress:0}]; let total=0,since=0;
    for(let i=1;i<points.length;i++){const p=points[i-1],c=points[i],d=haversineMiles(p[0],p[1],c[0],c[1]);total+=d;since+=d;if(since>=SAMPLE_MI){out.push({lat:c[0],lng:c[1],progress:total});since=0;}}
    const e=points[points.length-1]; out.push({lat:e[0],lng:e[1],progress:total}); return out;
  }

  function candidates(routeSamples, corridor) {
    const result=[];
    for(const m of markers){let best=Infinity,progress=0;for(const s of routeSamples){const d=haversineMiles(m.lat,m.lng,s.lat,s.lng);if(d<best){best=d;progress=s.progress;if(best<0.05)break;}}if(best<=corridor)result.push({marker:m,off:best,progress});}
    return result.sort((x,y)=>x.progress-y.progress||x.off-y.off);
  }

  function draw(points,a,b) {
    clearLayers();
    routeLine=L.polyline(points,{color:"#215ca8",weight:5,opacity:.82}).addTo(map);
    endpointLayers=[L.circleMarker([a.lat,a.lng],{radius:7}).bindTooltip("Route start").addTo(map),L.circleMarker([b.lat,b.lng],{radius:7}).bindTooltip("Route destination").addTo(map)];
  }

  function updateGoogle(a,b,list) {
    const links=document.getElementById("route-links"),basic=document.getElementById("route-google"),withStops=document.getElementById("route-google-stops");
    basic.href=googleUrl(a,b,[]);
    const limit=mobile()?3:9;
    const chosen=[...list].sort((x,y)=>x.off-y.off||x.progress-y.progress).slice(0,limit).sort((x,y)=>x.progress-y.progress).map(x=>x.marker);
    if(chosen.length){withStops.href=googleUrl(a,b,chosen);withStops.textContent=`Google + ${chosen.length} marker stop${chosen.length===1?"":"s"}`;withStops.hidden=false;}else withStops.hidden=true;
    links.hidden=false;
  }

  async function plan() {
    const start=document.getElementById("route-start").value.trim(),end=document.getElementById("route-end").value.trim();
    const corridor=Math.max(1,Math.min(25,Number(document.getElementById("route-corridor").value)||5));
    if(!start||!end){status("Enter both a starting point and a destination.",true);return;}
    if(!navigator.onLine){status("Route planning requires an internet connection.",true);return;}
    const btn=document.getElementById("route-find");btn.disabled=true;btn.textContent="Routing…";status("Locating start and destination…");clearLayers();
    try{
      const [a,b]=await Promise.all([geocode(start),geocode(end)]);status("Building driving route…");const r=await roadRoute(a,b);
      const pts=r.geometry.coordinates.map(x=>[Number(x[1]),Number(x[0])]);draw(pts,a,b);const found=candidates(samples(pts),corridor);lastPlan={a,b,pts,corridor,found};
      nearbyDistanceById.clear();found.forEach(x=>nearbyDistanceById.set(x.marker.id,x.progress));nearbyMarkerIds=new Set(found.map(x=>x.marker.id));
      cityNameEl.value="";zipCodeEl.value="";countyFilterEl.value="";searchEl.value="";clearMyLocationReadout();resetInscriptionWordFilterOnly();applyFilters();
      const bounds=L.latLngBounds(pts);found.slice(0,300).forEach(x=>bounds.extend([x.marker.lat,x.marker.lng]));map.fitBounds(bounds,{padding:[30,30],maxZoom:13});updateGoogle(a,b,found);
      const miles=Math.round(Number(r.distance)/1609.344);status(`${found.length.toLocaleString()} ${activeState().name} marker${found.length===1?"":"s"} found within ${corridor} mile${corridor===1?"":"s"} of this ${miles}-mile route. Results are ordered from start to destination. The blue line is a road-route preview; Google Maps may choose a different route.`);
      setDetailMessage(found.length?"Route markers loaded":"No markers along route",found.length?`Showing ${found.length.toLocaleString()} markers near the route, ordered from start to destination.`:`No markers were found within ${corridor} miles of this route. Try a wider corridor.`);
    }catch(e){console.error(e);clearLayers();status(`${e.message||"Could not build route."} You can still open the typed endpoints in Google Maps.`,true);const u=new URL("https://www.google.com/maps/dir/");u.searchParams.set("api","1");u.searchParams.set("origin",start);u.searchParams.set("destination",end);u.searchParams.set("travelmode","driving");const g=document.getElementById("route-google");g.href=u.toString();document.getElementById("route-google-stops").hidden=true;document.getElementById("route-links").hidden=false;}
    finally{btn.disabled=false;btn.textContent="Find Route";}
  }

  function bind() {
    document.getElementById("route-find").addEventListener("click",plan);
    document.getElementById("route-clear").addEventListener("click",()=>clearRoute(false));
    ["route-start","route-end"].forEach(id=>document.getElementById(id).addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();plan();}}));
    document.getElementById("route-corridor").addEventListener("change",()=>{if(lastPlan)plan();});
    ["city-name-btn","zip-code-btn","my-location-btn"].forEach(id=>{const x=document.getElementById(id);if(x)x.addEventListener("click",()=>clearRoute(true));});
    const state=document.getElementById("state-selector");if(state)state.addEventListener("change",()=>clearRoute(false));
  }

  if(typeof L!=="undefined"&&typeof map!=="undefined"){makeUi();bind();}
})();
