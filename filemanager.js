import { dragObjects, groupDragObjects } from "./wallManager";
import * as THREE from 'three';
import { scene } from './sceneSetup.js';
import { paivitaRaahaus } from './main.js';

// ---Tallennus-------

export function tallennaJSON() {
    // 1. Otetaan vain seinäryhmät
    const seinat = groupDragObjects.filter(group => {
        return group.children.some(c => c.userData.tyyppi === "seina");
    });

    // 2. Tehdään minimalistinen paketti
    const exportData = seinat.map((group) => {
        return {
            // group.toJSON() sisältää jo kaiken: position, rotation, scalen ja lapset (ovet/ikkunat)
            threeData: group.toJSON() 
        };
    });

    const jsonString = JSON.stringify(exportData, null, 2);
    downloadJSON(jsonString, "seinat.json");
    console.log("--------------- SEINÄT TALLENNETTU ---------------");
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
            // loader.parse palauttaa täydellisen ryhmän kaikkine asetuksineen
            const ladattuRyhma = loader.parse(item.threeData);
            
            scene.add(ladattuRyhma);
            groupDragObjects.push(ladattuRyhma);
            
            // Rekisteröidään lapset (seinät/ovet), jotta niitä voi raahata
            ladattuRyhma.children.forEach(child => {
                dragObjects.push(child);
            });
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
    // Jos painetaan S (eikä olla kirjoittamassa tekstikenttään)
    if (e.key.toLowerCase() === 's' && e.target.tagName !== 'INPUT') {
        tallennaJSON();
    }
});