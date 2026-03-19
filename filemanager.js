import { dragObjects, groupDragObjects } from "./wallManager";
import * as THREE from 'three';
import { scene } from './sceneSetup.js';
import { paivitaRaahaus } from './main.js';
import { luoNimiLabel } from './objectManager.js';

// ---Tallennus-------

export function tallennaJSON() {
    // 1. Otetaan objektit
    const objektit = groupDragObjects.filter(group => {
        return group.children.some(c => c.userData.tyyppi === "seina")
        || group.userData.tyyppi === "primitiivi";
    });

    // 2. Tehdään minimalistinen paketti
    const exportData = objektit.map((group) => {
        // Poistetaan sprite,(eli 3D label) väliaikaisesti ennen toJSON(), koska CanvasTexture ei serialisoidu
        const sprite = group.children.find(c => c.userData.tyyppi === "label");
        if (sprite) group.remove(sprite);

        const json = group.toJSON();

        // Lisätään sprite takaisin sceneen
        if (sprite) group.add(sprite);

        return { threeData: json };
    });

    const jsonString = JSON.stringify(exportData, null, 2);
    downloadJSON(jsonString, "objektit.json");
    console.log("--------------- OBJEKTIT TALLENNETTU ---------------");
    console.log(jsonString);
}

function downloadJSON(jsonString, fileName) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    // Siivotaan muisti
    URL.revokeObjectURL(url);
}

// ------Lataus---------

export function lataaJSON(event) {
    const tiedosto = event.target.files[0];
    if (!tiedosto) return;

    const lukija = new FileReader();
    lukija.onload = function(e) {
        const data = JSON.parse(e.target.result);
        const loader = new THREE.ObjectLoader();

        // --- SIIVOUS: Poistetaan vanhat ---
        groupDragObjects.forEach(group => scene.remove(group));
        groupDragObjects.length = 0;
        dragObjects.length = 0;

        // --- LATAUS: Luodaan uudet ---
        data.forEach(item => {
            const ladattuRyhma = loader.parse(item.threeData);

            scene.add(ladattuRyhma);
            groupDragObjects.push(ladattuRyhma);

            if (ladattuRyhma.userData.tyyppi === "primitiivi") {
                // Rakennetaan nimiLabel uudelleen userData.nimestä
                if (ladattuRyhma.userData.nimi) {
                    const mesh = ladattuRyhma.children.find(c =>
                        c.userData.tyyppi === "suorakaide" || c.userData.tyyppi === "sylinteri"
                    );
                    const korkeus = mesh?.geometry.parameters.height || 2.5;
                    ladattuRyhma.add(luoNimiLabel(ladattuRyhma.userData.nimi, korkeus));
                }
            } else {
                // Rekisteröidään seinien lapset (seinät/ovet) raahattaviksi
                ladattuRyhma.children.forEach(child => {
                    dragObjects.push(child);
                });
            }
        });

        // Tärkeää: Aktivoi raahaus uudestaan latauksen jälkeen
        paivitaRaahaus();
        console.log("Lataus valmis ja raahaus aktivoitu!");
    };
    lukija.readAsText(tiedosto);
}

// -------Kuuntelijat---------

// Tallennusnappi
document.getElementById('buttonSave').addEventListener('click', tallennaJSON);

// Latausnappi (input-kenttä)
document.getElementById('lataaTiedosto').addEventListener('change', lataaJSON);

// Näppäinkomento s
window.addEventListener('keydown', (e) => {
    // Jos painetaan Ctrl + S (eikä olla kirjoittamassa tekstikenttään)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        tallennaJSON();
    }
});