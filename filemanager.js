import { dragObjects, groupDragObjects } from "./wallManager";
import * as THREE from 'three';
import { scene } from './sceneSetup.js';
import { paivitaRaahaus } from './main.js';
import { luoNimiLabel } from './objectManager.js';

// ---Tallennus-------

/**
 * Suodattaa seinäobjektit, muuntaa ne JSON-muotoon ja käynnistää tiedoston latauksen.
 * * Funktio poimii `groupDragObjects`-taulukosta vain ne ryhmät, jotka sisältävät
 * seiniä, ja hyödyntää Three.js:n toJSON-metodia 3D-datan säilyttämiseen.
 * * @function tallennaJSON
 * @returns {void}
 */

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
    // muutetaan json merkkijonoksi tekstitiedostoa varten
    const jsonString = JSON.stringify(exportData, null, 2); 
    downloadJSON(jsonString, "seinat.json");
    console.log("--------------- SEINÄT TALLENNETTU ---------------");
    console.log(jsonString);
}

/**
 * Luo tekstimuotoisesta JSON-datasta tiedoston ja lataa sen selaimen kautta käyttäjän koneelle.
 * * Funktio hyödyntää Blob-objektia ja väliaikaista URL-linkkiä tiedonsiirtoon.
 * Muisti siivotaan automaattisesti latauksen jälkeen URL.revokeObjectURL-metodilla.
 * * @function downloadJSON
 * @param {string} jsonString - Merkkijonomuotoinen JSON-data, joka halutaan tallentaa.
 * @param {string} fileName - Tiedoston nimi, jolla se tallennetaan (esim. "projekti.json").
 * @returns {void}
 */

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

/**
 * Lukee käyttäjän valitseman JSON-tiedoston, tyhjentää nykyisen skenen ja lataa uudet objektit.
 * * Funktio suorittaa seuraavat vaiheet:
 * 1. Lukee tiedoston FileReader-rajapinnalla.
 * 2. Tyhjentää `scene`-objektin ja hallintalistat duplikaattien estämiseksi.
 * 3. Muuntaa JSON-datan Three.js-objekteiksi ObjectLoaderin avulla.
 * 4. Rekisteröi ladatut objektit takaisin raahausjärjestelmään.
 * * @function lataaJSON
 * @param {Event} event - Selaimen tiedostonvalinta-tapahtuma (change event).
 * @returns {void}
 */

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

// -------kuuntelijat---------

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