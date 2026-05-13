const CONFIG = {
  // Vervang dit door de gepubliceerde CSV-link van je Google Sheet.
  // Je kunt ook testen met: index.html?data=https://jouw-url/naar/sheet.csv
  googleSheetCsvUrl: "data/initiatieven.csv",
  defaultCenter: [53.08, 6.25],
  defaultZoom: 8
};

const EMBEDDED_DEMO_CSV = `titel,omschrijving,provincie,plaats,thema,lat,lng,url,zichtbaar
Energieatelier Leeuwarden,"Bewoners werken samen aan lokale energiebesparing.",Friesland,Leeuwarden,Energie,53.2012,5.7999,https://example.com/energieatelier,ja
Groene Buurt Groningen,"Een netwerk van buurtbewoners vergroent straten en pleinen.",Groningen,Groningen,Groen,53.2194,6.5665,https://example.com/groene-buurt,ja
Zorgzame Wijk Assen,"Vrijwilligers koppelen hulpvragen aan mensen in de wijk.",Drenthe,Assen,Zorg,52.9928,6.5642,https://example.com/zorgzame-wijk,ja
Repairhub Drachten,"Maandelijkse reparatiemiddag voor apparaten en fietsen.",Friesland,Drachten,Circulair,53.1125,6.0989,https://example.com/repairhub,ja
Jongerenlab Emmen,"Jongeren ontwerpen activiteiten rond cultuur en ontmoeting.",Drenthe,Emmen,Cultuur,52.7792,6.9067,https://example.com/jongerenlab,ja
Voedseltuin Sneek,"Vrijwilligers verbouwen groenten voor lokale voedselinitiatieven.",Friesland,Sneek,Groen,53.0329,5.6589,https://example.com/voedseltuin-sneek,ja
Energiekring Harlingen,"Huishoudens delen kennis over isolatie en gezamenlijke inkoop.",Friesland,Harlingen,Energie,53.1746,5.4252,https://example.com/energiekring-harlingen,ja
Buurtkamer Winschoten,"Een laagdrempelige ontmoetingsplek voor buurtbewoners.",Groningen,Winschoten,Zorg,53.1442,7.0347,https://example.com/buurtkamer-winschoten,ja
Maakplaats Appingedam,"Inwoners repareren, maken en hergebruiken materialen.",Groningen,Appingedam,Circulair,53.3217,6.8586,https://example.com/maakplaats-appingedam,ja
Cultuurpodium Hoogeveen,"Lokale makers organiseren kleinschalige optredens en workshops.",Drenthe,Hoogeveen,Cultuur,52.7286,6.4901,https://example.com/cultuurpodium-hoogeveen,ja
Groene Route Meppel,"Bewoners vergroenen routes tussen school, wijk en centrum.",Drenthe,Meppel,Groen,52.6959,6.1948,https://example.com/groene-route-meppel,ja
Zon op Zuidhorn,"Collectief zonnedak voor inwoners zonder geschikt eigen dak.",Groningen,Zuidhorn,Energie,53.2467,6.4022,https://example.com/zon-op-zuidhorn,ja
Mienskipsatelier Bolsward,"Bewoners ontwikkelen samen activiteiten rond erfgoed en ontmoeting.",Friesland,Bolsward,Cultuur,53.0656,5.5318,https://example.com/mienskipsatelier-bolsward,ja`;

const THEME_COLORS = {
  Energie: { fill: "#f4b844", stroke: "#8a5a00" },
  Groen: { fill: "#3fa66b", stroke: "#1d6840" },
  Zorg: { fill: "#e56578", stroke: "#963544" },
  Circulair: { fill: "#4d9ad6", stroke: "#22608e" },
  Cultuur: { fill: "#8b6fd6", stroke: "#514099" },
  Overig: { fill: "#28b090", stroke: "#0f5d4b" }
};

const provinceFilter = document.querySelector("#province-filter");
const themeFilter = document.querySelector("#theme-filter");
const themeLegend = document.querySelector("#theme-legend");

const params = new URLSearchParams(window.location.search);
const dataUrl = params.get("data") || CONFIG.googleSheetCsvUrl;

const map = L.map("map", {
  scrollWheelZoom: true
}).setView(CONFIG.defaultCenter, CONFIG.defaultZoom);

const primaryTileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
}).addTo(map);

let fallbackTileLayerActive = false;
primaryTileLayer.on("tileerror", () => {
  if (fallbackTileLayerActive) {
    return;
  }

  fallbackTileLayerActive = true;
  map.removeLayer(primaryTileLayer);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
});

const markers = L.layerGroup().addTo(map);
let initiatives = [];

loadInitiatives();

provinceFilter.addEventListener("change", renderMarkers);
themeFilter.addEventListener("change", renderMarkers);

async function loadInitiatives() {
  try {
    const csv = await loadCsv();
    setInitiatives(csv);
  } catch (error) {
    setInitiatives(EMBEDDED_DEMO_CSV);
    console.error(error);
  }
}

async function loadCsv() {
  if (window.location.protocol === "file:" && dataUrl === CONFIG.googleSheetCsvUrl) {
    return EMBEDDED_DEMO_CSV;
  }

  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error(`Kon data niet laden (${response.status})`);
  }

  return response.text();
}

function setInitiatives(csv) {
  initiatives = parseCsv(csv)
    .map(normalizeInitiative)
    .filter((item) => item.visible && Number.isFinite(item.lat) && Number.isFinite(item.lng));

  fillFilters();
  renderLegend();
  renderMarkers();
}

function normalizeInitiative(row) {
  return {
    title: row.titel || row.title || "Naamloos initiatief",
    province: row.provincie || row.province || "Onbekend",
    theme: row.thema || row.theme || "Overig",
    city: row.plaats || row.city || "",
    description: row.omschrijving || row.description || "",
    url: row.url || "",
    lat: Number.parseFloat((row.lat || row.latitude || "").replace(",", ".")),
    lng: Number.parseFloat((row.lng || row.lon || row.longitude || "").replace(",", ".")),
    visible: String(row.zichtbaar || row.visible || "ja").toLowerCase() !== "nee"
  };
}

function fillFilters() {
  resetOptions(provinceFilter, "Alle provincies");
  resetOptions(themeFilter, "Alle thema's");
  addOptions(provinceFilter, uniqueValues(initiatives.map((item) => item.province)));
  addOptions(themeFilter, uniqueValues(initiatives.map((item) => item.theme)));
}

function resetOptions(select, firstLabel) {
  select.textContent = "";
  const option = document.createElement("option");
  option.value = "all";
  option.textContent = firstLabel;
  option.selected = true;
  select.append(option);
}

function addOptions(select, values) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "nl"));
}

function renderMarkers() {
  markers.clearLayers();

  const selectedProvince = provinceFilter.value;
  const selectedTheme = themeFilter.value;
  const visibleItems = initiatives.filter((item) => {
    const provinceMatches = selectedProvince === "all" || item.province === selectedProvince;
    const themeMatches = selectedTheme === "all" || item.theme === selectedTheme;
    return provinceMatches && themeMatches;
  });

  visibleItems.forEach((item) => {
    const colors = getThemeColors(item.theme);
    const marker = L.marker([item.lat, item.lng], {
      icon: createThemeIcon(colors),
      title: item.title
    });

    marker.bindPopup(createPopupHtml(item), {
      className: "initiative-popup"
    });

    marker.on("mouseover", () => marker.openPopup());
    marker.on("click", () => marker.openPopup());
    markers.addLayer(marker);
  });

  fitMapToItems(visibleItems);
}

function createThemeIcon(colors) {
  return L.divIcon({
    className: "initiative-marker-shell",
    html: `<span class="initiative-marker" style="--theme-color: ${colors.fill}; --theme-stroke: ${colors.stroke};"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10]
  });
}

function getThemeColors(theme) {
  return THEME_COLORS[theme] || THEME_COLORS.Overig;
}

function renderLegend() {
  themeLegend.textContent = "";

  uniqueValues(initiatives.map((item) => item.theme)).forEach((theme) => {
    const colors = getThemeColors(theme);
    const item = document.createElement("span");
    item.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.setProperty("--theme-color", colors.fill);

    const label = document.createElement("span");
    label.textContent = theme;

    item.append(swatch, label);
    themeLegend.append(item);
  });
}

function fitMapToItems(items) {
  if (items.length === 0) {
    map.setView(CONFIG.defaultCenter, CONFIG.defaultZoom);
    return;
  }

  const bounds = L.latLngBounds(items.map((item) => [item.lat, item.lng]));
  map.fitBounds(bounds, {
    padding: [42, 42],
    maxZoom: 10
  });
}

function createPopupHtml(item) {
  const safeLink = safeUrl(item.url);
  const link = safeLink
    ? `<p><a href="${escapeHtml(safeLink)}" target="_blank" rel="noopener">Meer informatie</a></p>`
    : "";

  return `
    <article>
      <h2>${escapeHtml(item.title)}</h2>
      <p>${escapeHtml(item.description)}</p>
      ${link}
      <dl>
        <dt>Plaats</dt>
        <dd>${escapeHtml(item.city || "-")}</dd>
        <dt>Provincie</dt>
        <dd>${escapeHtml(item.province)}</dd>
        <dt>Thema</dt>
        <dd>${escapeHtml(item.theme)}</dd>
      </dl>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function safeUrl(value) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function parseCsv(csvText) {
  const rows = [];
  let current = "";
  let row = [];
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }

  const [headers = [], ...dataRows] = rows.filter((cells) => cells.some((cell) => cell.trim()));
  const keys = headers.map((header) => header.trim().toLowerCase());

  return dataRows.map((cells) => Object.fromEntries(
    keys.map((key, index) => [key, (cells[index] || "").trim()])
  ));
}
