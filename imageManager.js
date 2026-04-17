import * as THREE from 'three';
import { scene, drawingPlane, renderer } from './sceneSetup.js';
import { groupDragObjects } from './wallManager.js';
import { paivitaRaahaus } from './main.js';

let pohjakuvaRyhma = null;
let lukittu = false;
let getActiveCamera = null;

// Kalibrointityökalulle
let kalibrointiAktiivinen = false;
let kalibrointiPisteet = [];
let kalibrointiMarkers = [];
let kalibrointiViiva = null;

export function initImageManager(cameraGetter) {
    getActiveCamera = cameraGetter;
}

// Lataa kuvatiedoston ja luo siitä tason sceneen
export function lataaPohjakuva(file) {
    // Poistetaan vanha pohjakuva jos on
    if (pohjakuvaRyhma) {
        scene.remove(pohjakuvaRyhma);
        const idx = groupDragObjects.indexOf(pohjakuvaRyhma);
        if (idx !== -1) groupDragObjects.splice(idx, 1);
    }

    const input = document.getElementById('lataaPohjakuvatiedosto');
    if (input) input.value = '';

    const url = URL.createObjectURL(file);
    const texture = new THREE.TextureLoader().load(url, () => {
        URL.revokeObjectURL(url);
    });

    // Kuvataso — alkukoko 10x10m, käyttäjä skaalaa sliderilla
    const geo = new THREE.PlaneGeometry(10, 10);
    const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false, // Estää z-fighting seinien kanssa
        depthTest: false
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 1;
    mesh.rotation.x = -Math.PI / 2; // Käännetään vaakatasoon
    mesh.userData.tyyppi = 'pohjakuva';

    pohjakuvaRyhma = new THREE.Group();
    pohjakuvaRyhma.position.y = 0.1; // Pieni offset gridin yläpuolelle
    pohjakuvaRyhma.userData.tyyppi = 'pohjakuva';
    pohjakuvaRyhma.add(mesh);

    scene.add(pohjakuvaRyhma);
    lukittu = false;

    // Resetoi koon asettamisen
    const inputL = document.getElementById('inputLeveys');
    const inputK = document.getElementById('inputKorkeus');
    if (inputL) inputL.value = 10;
    if (inputK) inputK.value = 10;

    const panel = document.getElementById('pohjakuvaKontrollit');
    if (panel) panel.style.display = 'block';

    paivitaRaahaus();
    paivitaKontrollit();
}

// Muuttaa pohjakuvan läpinäkyvyyttä (0-1)
export function asetaOpasiteetti(arvo) {
    if (!pohjakuvaRyhma) return;
    pohjakuvaRyhma.children[0].material.opacity = parseFloat(arvo);
}

// Muuttaa pohjakuvan kokoa
export function asetaLeveys(arvo) {
    if (!pohjakuvaRyhma) return;
    pohjakuvaRyhma.scale.x = parseFloat(arvo) / 10;
}

// Muuttaa pohjakuvan kokoa
export function asetaKorkeus(arvo) {
    if (!pohjakuvaRyhma) return;
    pohjakuvaRyhma.scale.z = parseFloat(arvo) / 10;
}

// Vaihtaa lukitustilan — lukittu kuva ei liiku siirtelytilassa
export function toggleLukitus() {
    if (!pohjakuvaRyhma) return;
    lukittu = !lukittu;

    if (lukittu) {
        // Poistetaan raahauslistalta
        const idx = groupDragObjects.indexOf(pohjakuvaRyhma);
        if (idx !== -1) groupDragObjects.splice(idx, 1);
    } else {
        // Lisätään takaisin raahauslistalle
        groupDragObjects.push(pohjakuvaRyhma);
    }

    paivitaRaahaus();
    paivitaKontrollit();
}

export function onkoPohjakuva() {
    return pohjakuvaRyhma !== null;
}

export function onkoLukittu() {
    return lukittu;
}

// -- Kalibrointi --

export function startKalibrointi() {
    if (!pohjakuvaRyhma) return;

    // Pyyhitään aiemmat kalibroinnit
    resetKalibrointiMarkers();
    kalibrointiPisteet = [];
    kalibrointiAktiivinen = true;

    paivitaKalibrointiUI('Klikkaa ensimmäinen piste pohjakuvalta...');
}

function resetKalibrointiMarkers() {
    kalibrointiMarkers.forEach(m => scene.remove(m));
    kalibrointiMarkers = [];
    if (kalibrointiViiva) {
        scene.remove(kalibrointiViiva);
        kalibrointiViiva = null;
    }
}

function lisaaKalibrointiMarker(point) {
    const geo = new THREE.SphereGeometry(0.12, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    const marker = new THREE.Mesh(geo, mat);
    marker.position.set(point.x, 0.25, point.z);
    scene.add(marker);
    kalibrointiMarkers.push(marker);
}

function piirraKalibrointiViiva(p1, p2) {
    if (kalibrointiViiva) scene.remove(kalibrointiViiva);
    const points = [
        new THREE.Vector3(p1.x, 0.25, p1.z),
        new THREE.Vector3(p2.x, 0.25, p2.z)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xff2222 });
    kalibrointiViiva = new THREE.Line(geo, mat);
    scene.add(kalibrointiViiva);
}

function paivitaKalibrointiUI(teksti) {
    const info = document.getElementById('kalibrointiInfo');
    if (info) {
        info.textContent = teksti;
        info.style.display = teksti ? 'block' : 'none';
    }
}

function sovellaKalibrointi(oikeaEtaisyys) {
    if (kalibrointiPisteet.length < 2) return;

    const mitattu = kalibrointiPisteet[0].distanceTo(kalibrointiPisteet[1]);
    if (mitattu === 0) return;

    const kerroin = oikeaEtaisyys / mitattu;

    // Asetetaan arvot
    pohjakuvaRyhma.scale.x *= kerroin;
    pohjakuvaRyhma.scale.z *= kerroin;

    // Päivitetään numerot
    const inputL = document.getElementById('inputLeveys');
    const inputK = document.getElementById('inputKorkeus');
    if (inputL) inputL.value = (pohjakuvaRyhma.scale.x * 10).toFixed(1);
    if (inputK) inputK.value = (pohjakuvaRyhma.scale.z * 10).toFixed(1);

    resetKalibrointiMarkers();
    paivitaKalibrointiUI('');

    const panel = document.getElementById('kalibrointiVahvistus');
    if (panel) panel.style.display = 'none';
}

// Handler kalibrointityökaulle
window.addEventListener('mousedown', (event) => {
    if (!kalibrointiAktiivinen || event.button !== 0) return;
    // Jätetään huomiotta UI klikkaukset
    if (event.clientX < 300) return;

    const rect = renderer.domElement.getBoundingClientRect();

    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    if (!getActiveCamera) return;
    raycaster.setFromCamera(mouse, getActiveCamera());

    const intersects = raycaster.intersectObject(drawingPlane);
    if (intersects.length === 0) return;

    const point = intersects[0].point;
    kalibrointiPisteet.push(point.clone());
    lisaaKalibrointiMarker(point);

    if (kalibrointiPisteet.length === 1) {
        paivitaKalibrointiUI('Klikkaa toinen piste pohjakuvalta...');

    } else if (kalibrointiPisteet.length === 2) {
        kalibrointiAktiivinen = false;

        piirraKalibrointiViiva(kalibrointiPisteet[0], kalibrointiPisteet[1]);

        const mitattu = kalibrointiPisteet[0].distanceTo(kalibrointiPisteet[1]);
        paivitaKalibrointiUI(`Mitattu: ${mitattu.toFixed(2)} m — anna oikea etäisyys:`);

        // Hyväksymispaneeli
        const panel = document.getElementById('kalibrointiVahvistus');
        const etaisInput = document.getElementById('kalibrointiEtaisyys');
        if (panel) panel.style.display = 'block';
        if (etaisInput) {
            etaisInput.value = '';
            etaisInput.focus();
        }
    }
});

// Confirm/cancel napit (tulee main.js DOMContentLoaded)
export function initKalibrointiNapit() {
    const ok = document.getElementById('kalibrointiOK');
    const peruuta = document.getElementById('kalibrointiPeruuta');
    const etaisInput = document.getElementById('kalibrointiEtaisyys');
    const sulje = document.getElementById('btnSuljePohjakuva');

    if (sulje) {
        sulje.addEventListener('click', () => {
            const panel = document.getElementById('pohjakuvaKontrollit');
            if (panel) panel.style.display = 'none';
        });
    }

    if (ok) {
        ok.addEventListener('click', () => {
            const arvo = parseFloat(etaisInput.value);
            if (!isNaN(arvo) && arvo > 0) {
                sovellaKalibrointi(arvo);
            }
        });
    }

    // Hyväksytään myös enterillä
    if (etaisInput) {
        etaisInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const arvo = parseFloat(etaisInput.value);
                if (!isNaN(arvo) && arvo > 0) sovellaKalibrointi(arvo);
            }
        });
    }

    if (peruuta) {
        peruuta.addEventListener('click', () => {
            kalibrointiAktiivinen = false;
            resetKalibrointiMarkers();
            paivitaKalibrointiUI('');
            const panel = document.getElementById('kalibrointiVahvistus');
            if (panel) panel.style.display = 'none';
        });
    }
}

window.addEventListener('pohjakuvaDeleted', () => {
    pohjakuvaRyhma = null;
    lukittu = false;
    kalibrointiAktiivinen = false;
    resetKalibrointiMarkers();
    paivitaKalibrointiUI('');
    const panel = document.getElementById('kalibrointiVahvistus');
    if (panel) panel.style.display = 'none';
    paivitaKontrollit();
});

// Kuuntelija, jotta voidaan avata pohjakuvan kontrollit uudestaan
window.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    if (!pohjakuvaRyhma) return;
    if (kalibrointiAktiivinen) return;

    const siirtelyRadio = document.getElementById('siirtelytila');
    if (!siirtelyRadio?.checked) return;

    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    if (!getActiveCamera) return;
    raycaster.setFromCamera(mouse, getActiveCamera());

    // Tarkastetaan, osuttiinko pohjakuvaan
    const pohjakuvaMesh = pohjakuvaRyhma.children.find(c => c.userData.tyyppi === 'pohjakuva');
    if (!pohjakuvaMesh) return;

    const intersects = raycaster.intersectObject(pohjakuvaRyhma, true);
    if (intersects.length > 0) {
        const panel = document.getElementById('pohjakuvaKontrollit');
        if (panel) panel.style.display = 'block';
    }
});

// Päivittää kontrollipaneelin tilan
function paivitaKontrollit() {
    const panel = document.getElementById('pohjakuvaKontrollit');
    if (!panel) return;
    panel.style.display = pohjakuvaRyhma ? 'block' : 'none';

    const btn = document.getElementById('btnLukitsePohjakuva');
    if (btn) btn.textContent = lukittu ? '🔓 Avaa lukitus' : '🔒 Lukitse';
}