import * as THREE from 'three';
import { scene } from './sceneSetup.js';
import { groupDragObjects, undoHistory } from './wallManager.js';
import { paivitaRaahaus } from './main.js';

// Luo 3D näkymään nimen objektille
export function luoNimiLabel(nimi, yPos) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nimi, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 0.5, 1);
    sprite.position.set(0, yPos + 0.4, 0);
    sprite.userData.tyyppi = 'label';
    return sprite;
}

// Lisää suorakulmaisen laatikon sceneen annetuilla mitoilla ja nimellä
export function lisaaSuorakaide(leveys, syvyys, korkeus, nimi) {
    const group = new THREE.Group();

    const geo = new THREE.BoxGeometry(leveys, korkeus, syvyys);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8ab4f8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = korkeus / 2;
    mesh.userData.tyyppi = 'suorakaide';
    group.add(mesh);

    if (nimi) {
        group.add(luoNimiLabel(nimi, korkeus));
    }

    group.userData.tyyppi = 'primitiivi';
    group.userData.nimi = nimi;
    scene.add(group);
    groupDragObjects.push(group);
    undoHistory.push({ type: "primitiivi", object: group });
    paivitaRaahaus();
}

// Lisää sylinterin sceneen annetuilla mitoilla ja nimellä
export function lisaaSylinteri(halkaisija, korkeus, nimi) {
    const group = new THREE.Group();

    const geo = new THREE.CylinderGeometry(halkaisija / 2, halkaisija / 2, korkeus, 32);
    const mat = new THREE.MeshStandardMaterial({ color: 0xf8a8b4 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = korkeus / 2;
    mesh.userData.tyyppi = 'sylinteri';
    group.add(mesh);

    if (nimi) {
        group.add(luoNimiLabel(nimi, korkeus));
    }

    // Lisätään ryhmä sceneen ja raahauslistalle
    group.userData.tyyppi = 'primitiivi';
    group.userData.nimi = nimi;
    scene.add(group);
    groupDragObjects.push(group);
    undoHistory.push({ type: "primitiivi", object: group });
    paivitaRaahaus();
}

// Lisää portaat sceneen annetuilla mitoilla
export function lisaaPortaat(leveys, syvyys, korkeus, askelmia) {
    const group = new THREE.Group();

    askelmia = Math.max(2, Math.floor(askelmia));
    leveys = Math.max(0.2, leveys);
    syvyys = Math.max(0.2, syvyys);
    korkeus = Math.max(0.2, korkeus);

    const askelmanSyvyys = syvyys / askelmia;
    const askelmanKorkeus = korkeus / askelmia;

    for (let i = 0; i < askelmia; i++) {
        const askelmanKokonaisKorkeus = (i + 1) * askelmanKorkeus;

        const geo = new THREE.BoxGeometry(leveys, askelmanKokonaisKorkeus, askelmanSyvyys);
        const vari = i % 2 === 0 ? 0xcfcfcf : 0xb8b8b8;
        const mat = new THREE.MeshStandardMaterial({ color: vari });
        const mesh = new THREE.Mesh(geo, mat);

        mesh.position.set(
            0,
            askelmanKokonaisKorkeus / 2,
            -syvyys / 2 + askelmanSyvyys / 2 + i * askelmanSyvyys
        );
        mesh.userData.tyyppi = 'porras_askelma';
        group.add(mesh);
    }

    group.userData.tyyppi = 'primitiivi';
    group.userData.alatyyppi = 'portaat';
    group.userData.mitat = { leveys, syvyys, korkeus, askelmia };

    scene.add(group);
    groupDragObjects.push(group);
    undoHistory.push({ type: "primitiivi", object: group });
    paivitaRaahaus();
}

// Lisää hissin sceneen annetuilla mitoilla
export function lisaaHissi(leveys, syvyys, korkeus) {
    const group = new THREE.Group();

    leveys = Math.max(0.8, leveys);
    syvyys = Math.max(0.8, syvyys);
    korkeus = Math.max(0.1, korkeus);

    // Pohjakappale
    const geo = new THREE.BoxGeometry(leveys, korkeus, syvyys);
    const mat = new THREE.MeshStandardMaterial({ color: 0xe6e6e6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = korkeus / 2;
    mesh.userData.tyyppi = 'hissi';
    group.add(mesh);

    // Rasti kahdesta ohuesta palkista (45° kulmassa)
    const rastiKorkeus = 0.01;
    const rastiPaksuus = 0.05;
    const rastiMat = new THREE.MeshStandardMaterial({ color: 0x2f55ff });
    const marginaali = 0.75;

    // Diagonaali 1: vasemmalta-edestä oikealle-taakse
    const diag1geo = new THREE.BoxGeometry(
        Math.sqrt(leveys ** 2 + syvyys ** 2) * marginaali, // halkaisija kulmasta kulmaan
        rastiKorkeus,
        rastiPaksuus
    );
    const diag1 = new THREE.Mesh(diag1geo, rastiMat);
    diag1.position.y = korkeus + 0.01 / 2;
    diag1.rotation.y = Math.atan2(syvyys, leveys); // kulma leveys/syvyys-suhteen mukaan
    diag1.userData.tyyppi = 'hissi_rasti';
    group.add(diag1);

    // Diagonaali 2: peilikuva
    const diag2geo = new THREE.BoxGeometry(
        Math.sqrt(leveys ** 2 + syvyys ** 2) * marginaali,
        rastiKorkeus,
        rastiPaksuus
    );
    const diag2 = new THREE.Mesh(diag2geo, rastiMat);
    diag2.position.y = korkeus + 0.01 / 2;
    diag2.rotation.y = -Math.atan2(syvyys, leveys);
    diag2.userData.tyyppi = 'hissi_rasti';
    group.add(diag2);

    group.userData.tyyppi = 'primitiivi';
    group.userData.alatyyppi = 'hissi';
    group.userData.mitat = { leveys, syvyys, korkeus };

    scene.add(group);
    groupDragObjects.push(group);
    undoHistory.push({ type: "primitiivi", object: group });
    paivitaRaahaus();
}