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

// Lisää portaat sceneen annetuilla mitoilla ja nimellä
export function lisaaPortaat(leveys, syvyys, korkeus, askelmia, nimi) {
    const group = new THREE.Group();

    // Varmistetaan järkevät arvot
    askelmia = Math.max(2, Math.floor(askelmia));
    leveys = Math.max(0.2, leveys);
    syvyys = Math.max(0.2, syvyys);
    korkeus = Math.max(0.2, korkeus);

    const askelmanSyvyys = syvyys / askelmia;
    const askelmanKorkeus = korkeus / askelmia;

    for (let i = 0; i < askelmia; i++) {
        const askelmanKokonaisKorkeus = (i + 1) * askelmanKorkeus;

        const geo = new THREE.BoxGeometry(
            leveys,
            askelmanKokonaisKorkeus,
            askelmanSyvyys
        );

        // Kevyt vuorottelu auttaa 2D-näkymässä erottumaan
        const vari = i % 2 === 0 ? 0xcfcfcf : 0xb8b8b8;
        const mat = new THREE.MeshStandardMaterial({ color: vari });

        const mesh = new THREE.Mesh(geo, mat);

        // Rakennetaan portaat Z-suunnassa eteenpäin
        mesh.position.set(
            0,
            askelmanKokonaisKorkeus / 2,
            -syvyys / 2 + askelmanSyvyys / 2 + i * askelmanSyvyys
        );

        mesh.userData.tyyppi = 'porras_askelma';
        group.add(mesh);

        // Reunaviivat tekevät portaista paljon selkeämmät 2D:ssä
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x222222 })
        );
        line.position.copy(mesh.position);
        line.userData.tyyppi = 'porras_reuna';
        group.add(line);
    }

    if (nimi) {
        group.add(luoNimiLabel(nimi, korkeus));
    }

    group.userData.tyyppi = 'primitiivi';
    group.userData.alatyyppi = 'portaat';
    group.userData.nimi = nimi;
    group.userData.mitat = { leveys, syvyys, korkeus, askelmia };

    scene.add(group);
    groupDragObjects.push(group);
    undoHistory.push({ type: "primitiivi", object: group });
    paivitaRaahaus();
}