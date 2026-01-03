// =======================================================
// COMMUNES DU FINISTÈRE (≈110)
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
  ["Telgruc-sur-Mer",48.2620,-4.3660],["Argol",48.2730,-4.2830],
  ["Pleyben",48.2000,-4.0830],["Huelgoat",48.3630,-3.7470],
  ["Fouesnant",47.8950,-4.0120],["Bénodet",47.8760,-4.1050],
  ["Trégunc",47.8500,-3.8530],["Névez",47.8190,-3.7920],
  ["Moëlan-sur-Mer",47.8130,-3.6290],["Audierne",48.0160,-4.5380],
  ["Beuzec-Cap-Sizun",48.0300,-4.5450],["Plouhinec",48.0160,-4.4860],
  ["Landivisiau",48.5090,-4.0690],["Sizun",48.4000,-4.0500],
  ["Daoulas",48.3610,-4.2590],["Le Faou",48.2950,-4.1820]
];

// =======================================================
// PARAMÈTRES
// =======================================================
const DUREE_JEU = 60;
const SCORE_MAX = 5000;

// =======================================================
let map, indexVille = 0, score = 0, temps = DUREE_JEU;
let debutVille = Date.now();
let markerJoueur = null;
let markerCorrection = null;
let popupActif = null;
let jeuTermine = false;

// DOM
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const villeEl = document.getElementById("ville");
const btnRejouer = document.getElementById("rejouer");

// =======================================================
// OUTILS
// =======================================================
function melanger(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
melanger(villes);

// =======================================================
// INIT MAP
// =======================================================
window.initMap = function () {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 48.25, lng: -4.1 },
    zoom: 9,
    disableDefaultUI: true,
    draggable: false,
    styles: [
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] }
    ]
  });

  map.addListener("click", clicCarte);
  afficherVille(true);
};

// =======================================================
// TIMER
// =======================================================
setInterval(() => {
  if (jeuTermine) return;
  temps--;
  timerEl.textContent = "⏱ " + temps + " s";
  if (temps <= 0) terminerJeu();
}, 1000);

// =======================================================
// AFFICHAGE VILLE
// =======================================================
function afficherVille(initial=false) {
  if (indexVille >= villes.length) indexVille = 0;
  debutVille = Date.now();

  if (!initial) {
    villeEl.style.opacity = "0";
    villeEl.style.transform = "translate(-50%, 14px)";
  }

  villeEl.textContent = `${villes[indexVille][0]} ?`;

  requestAnimationFrame(() => {
    villeEl.style.transition = "all .35s cubic-bezier(.2,.9,.3,1)";
    villeEl.style.opacity = "1";
    villeEl.style.transform = "translate(-50%, 0)";
  });
}

// =======================================================
// CLIC CARTE
// =======================================================
function clicCarte(e) {
  if (jeuTermine) return;

  const [_, latV, lngV] = villes[indexVille];
  const latC = e.latLng.lat();
  const lngC = e.latLng.lng();

  const distanceM = distanceMetres(latC, lngC, latV, lngV);
  const distanceKm = (distanceM / 1000).toFixed(1);
  const tempsRep = (Date.now() - debutVille) / 1000;

  // === MARQUEUR JOUEUR ===
  if (markerJoueur) markerJoueur.setMap(null);
  markerJoueur = new google.maps.Marker({
    position: e.latLng,
    map,
    animation: google.maps.Animation.BOUNCE
  });
  setTimeout(() => markerJoueur.setAnimation(null), 400);

  // === SCORE ===
  const precision = Math.exp(-distanceM / 8000);
  const vitesse = Math.max(0.3, 1 - tempsRep / 10);
  const gain = Math.round(SCORE_MAX * (0.75 * precision + 0.25 * vitesse));
  animerScore(score, score + gain);
  score += gain;

  // === POPUP DISTANCE ===
  popupActif = afficherPopupDistance(distanceKm, distanceM);

  // === DRAPEAU CORRECTION ===
  setTimeout(() => {
    if (markerCorrection) markerCorrection.setMap(null);
    markerCorrection = new google.maps.Marker({
      position: { lat: latV, lng: lngV },
      map,
      label: "🏴"
    });
  }, 500);

  // ===== FIN DU TOUR (NETTOYAGE TOTAL + TRANSITION) =====
  setTimeout(() => {

    // suppression marqueur joueur
    if (markerJoueur) {
      markerJoueur.setMap(null);
      markerJoueur = null;
    }

    // suppression drapeau correction
    if (markerCorrection) {
      markerCorrection.setMap(null);
      markerCorrection = null;
    }

    // suppression popup distance
    if (popupActif) {
      popupActif.style.opacity = "0";
      popupActif.style.transform = "translateX(-50%) scale(.95)";
      setTimeout(() => popupActif.remove(), 300);
      popupActif = null;
    }

    // ville suivante
    indexVille++;
    afficherVille();

  }, 1400);
}

// =======================================================
// POPUP DISTANCE
// =======================================================
function afficherPopupDistance(km, metres) {
  let couleur = "#2ecc71";
  if (metres > 5000) couleur = "#f39c12";
  if (metres > 15000) couleur = "#e74c3c";

  const popup = document.createElement("div");
  popup.innerHTML = `
    <div style="font-size:13px;opacity:.7">Distance</div>
    <div style="font-size:30px;font-weight:800">${km} km</div>
  `;
  popup.style.cssText = `
    position: fixed;
    left: 50%;
    bottom: 120px;
    transform: translateX(-50%) scale(.95);
    background: linear-gradient(135deg, ${couleur}, #000);
    color: #fff;
    padding: 18px 30px;
    border-radius: 22px;
    box-shadow: 0 14px 35px rgba(0,0,0,.45);
    opacity: 0;
    transition: all .35s cubic-bezier(.2,.9,.3,1);
    z-index: 9999;
    text-align: center;
    pointer-events: none;
  `;
  document.body.appendChild(popup);

  requestAnimationFrame(() => {
    popup.style.opacity = "1";
    popup.style.transform = "translateX(-50%) scale(1)";
  });

  return popup;
}

// =======================================================
// SCORE ANIMÉ
// =======================================================
function animerScore(debut, fin) {
  const duree = 350;
  const start = performance.now();
  function step(t) {
    const p = Math.min((t - start) / duree, 1);
    scoreEl.textContent = "⭐ " + Math.round(debut + (fin - debut) * p);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// =======================================================
// FIN DE PARTIE
// =======================================================
function terminerJeu() {
  jeuTermine = true;
  villeEl.textContent = "FIN DE PARTIE";
  btnRejouer.style.display = "block";
}

btnRejouer.onclick = () => location.reload();

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
