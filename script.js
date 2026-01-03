// =======================================================
// LIMITES GÉOGRAPHIQUES DU FINISTÈRE (ANTI-ZOOM iOS)
// =======================================================
const FINISTERE_BOUNDS = {
  north: 48.75,
  south: 47.65,
  west: -5.15,
  east: -3.30
};

// =======================================================
// LISTE DES COMMUNES DU FINISTÈRE (~110)
// =======================================================
const villes = [
  ["Brest",48.3904,-4.4861],["Quimper",47.9960,-4.1020],["Morlaix",48.5770,-3.8280],
  ["Concarneau",47.8750,-3.9220],["Landerneau",48.4520,-4.2550],
  ["Douarnenez",48.0920,-4.3290],["Quimperlé",47.8720,-3.5480],
  ["Carhaix-Plouguer",48.2760,-3.5660],["Pont-l’Abbé",47.8670,-4.2230],
  ["Châteaulin",48.1980,-4.0930],["Roscoff",48.7200,-3.9850],
  ["Saint-Pol-de-Léon",48.6840,-3.9850],["Lesneven",48.5710,-4.3210],
  ["Plabennec",48.5010,-4.4280],["Guipavas",48.4350,-4.3980],
  ["Plougastel-Daoulas",48.3740,-4.3690],["Ploudalmézeau",48.5500,-4.6630],
  ["Plouescat",48.6580,-4.1780],["Plouzané",48.3830,-4.6190],
  ["Saint-Renan",48.4320,-4.6210],["Le Conquet",48.3600,-4.7730],
  ["Crozon",48.2460,-4.4890],["Camaret-sur-Mer",48.2760,-4.5950],
  ["Telgruc-sur-Mer",48.2620,-4.3660],["Audierne",48.0160,-4.5400],
  ["Plogoff",48.0340,-4.6730],["Pont-Croix",48.0400,-4.4900],
  ["Plouhinec",47.9870,-4.5510],["Plozévet",47.9890,-4.4270],
  ["Guilvinec",47.7980,-4.2840],["Penmarc’h",47.8120,-4.3380],
  ["Loctudy",47.8300,-4.1750],["Bénodet",47.8750,-4.1050],
  ["Fouesnant",47.8930,-3.9780],["Trégunc",47.8560,-3.8520],
  ["Rosporden",47.9600,-3.8340],["Scaër",48.0280,-3.7020],
  ["Bannalec",47.9300,-3.7000],["Moëlan-sur-Mer",47.8140,-3.6280],
  ["Clohars-Carnoët",47.7880,-3.5830],["Ergué-Gabéric",47.9980,-4.0190],
  ["Pluguffan",47.9720,-4.1720],["Plomelin",47.9330,-4.1510],
  ["Landrévarzec",48.0910,-4.0570],["Pleyben",48.2160,-4.0910],
  ["Brasparts",48.3000,-3.9620],["Huelgoat",48.3620,-3.7470],
  ["Commana",48.4150,-3.9750],["Sizun",48.4020,-4.0740],
  ["Daoulas",48.3610,-4.2570],["Le Faou",48.2950,-4.1800],
  ["Lanvéoc",48.2810,-4.4660],["Plomodiern",48.1880,-4.2540],
  ["Saint-Thégonnec",48.5230,-3.9460],["Pleyber-Christ",48.5040,-3.8740],
  ["Plouigneau",48.5640,-3.7080],["Carantec",48.6680,-3.9120],
  ["Plougasnou",48.6940,-3.7900],["Lanmeur",48.6430,-3.7160],
  ["Cléder",48.6650,-4.1010],["Plouzévédé",48.6040,-4.1280]
];

// =======================================================
// PARAMÈTRES DE JEU
// =======================================================
const DUREE_JEU = 60;
const SCORE_MAX = 5000;

// =======================================================
let map, indexVille = 0, score = 0, temps = DUREE_JEU;
let debutVille = Date.now();
let markerJoueur = null;
let markerCorrection = null;
let popup = null;
let jeuTermine = false;

// DOM
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const villeEl = document.getElementById("ville");
const finEl = document.getElementById("rejouer");

// =======================================================
// OUTILS
// =======================================================
function melanger(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}
melanger(villes);

// =======================================================
// INIT GOOGLE MAPS (CORRIGÉ iOS)
// =======================================================
window.initMap = function () {
  map = new google.maps.Map(document.getElementById("map"), {
    disableDefaultUI: true,
    gestureHandling: "greedy",
    scrollwheel: false,
    disableDoubleClickZoom: true,
    fullscreenControl: false,
    styles: [
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] }
    ]
  });

  // 👉 CORRECTION CLÉ : ajuste automatiquement la vue
  map.fitBounds(FINISTERE_BOUNDS);

  // Sécurité : évite un zoom excessif après fitBounds (iOS)
  google.maps.event.addListenerOnce(map, "bounds_changed", () => {
    if (map.getZoom() > 9) map.setZoom(9);
  });

  map.addListener("click", clicCarte);
  afficherVille();
};

// =======================================================
// TIMER GLOBAL
// =======================================================
setInterval(() => {
  if (jeuTermine) return;
  temps--;
  timerEl.textContent = `⏱ ${temps} s`;
  if (temps <= 0) terminerJeu();
}, 1000);

// =======================================================
// AFFICHAGE DE LA VILLE
// =======================================================
function afficherVille() {
  debutVille = Date.now();
  villeEl.style.opacity = 0;
  villeEl.textContent = `${villes[indexVille][0]} ?`;
  requestAnimationFrame(() => villeEl.style.opacity = 1);
}

// =======================================================
// GESTION DU CLIC
// =======================================================
function clicCarte(e) {
  if (jeuTermine) return;

  const [_, latV, lngV] = villes[indexVille];
  const latC = e.latLng.lat();
  const lngC = e.latLng.lng();

  const dist = distanceMetres(latC, lngC, latV, lngV);
  const tempsRep = (Date.now() - debutVille) / 1000;

  markerJoueur?.setMap(null);
  markerJoueur = new google.maps.Marker({ position: e.latLng, map });

  // Pondération : précision > vitesse
  const precision = Math.exp(-dist / 8000);
  const vitesse = Math.max(0.3, 1 - tempsRep / 10);
  const gain = Math.round(SCORE_MAX * (0.75 * precision + 0.25 * vitesse));

  score += gain;
  scoreEl.textContent = `⭐ ${score}`;

  afficherPopup((dist / 1000).toFixed(1), dist);

  setTimeout(() => {
    markerCorrection = new google.maps.Marker({
      position: { lat: latV, lng: lngV },
      map,
      label: "🏴"
    });
  }, 400);

  setTimeout(() => {
    markerJoueur?.setMap(null);
    markerCorrection?.setMap(null);
    popup?.remove();
    indexVille = (indexVille + 1) % villes.length;
    afficherVille();
  }, 1400);
}

// =======================================================
// POPUP DISTANCE
// =======================================================
function afficherPopup(km, m) {
  let couleur = "#2ecc71";
  if (m > 5000) couleur = "#f39c12";
  if (m > 15000) couleur = "#e74c3c";

  popup = document.createElement("div");
  popup.innerHTML = `<div style="font-size:28px;font-weight:800">${km} km</div>`;
  popup.style.cssText = `
    position:fixed;
    left:50%;
    bottom:120px;
    transform:translateX(-50%);
    background:${couleur};
    color:#fff;
    padding:14px 26px;
    border-radius:22px;
    z-index:2000;
  `;
  document.body.appendChild(popup);
}

// =======================================================
// FIN DE PARTIE
// =======================================================
function terminerJeu() {
  jeuTermine = true;
  finEl.style.display = "flex";
}

// =======================================================
// DISTANCE HAVERSINE
// =======================================================
function distanceMetres(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
