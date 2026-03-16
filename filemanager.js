import { dragObjects, groupDragObjects } from "./wallManager";
import * as THREE from 'three';
import { scene } from './sceneSetup.js';

// ---Tallennus-------

export function tallennaJSON() {
    // Suodatetaan vain ne objektit, jotka ovat seiniä
    // Oletetaan, että seinät ovat groupDragObjects-taulukossa
    const seinat = groupDragObjects.filter(group => {
        // Varmistetaan, että ryhmän sisältä löytyy jotain, missä on tyyppi: "seina"
        return group.children.some(c => c.userData.tyyppi === "seina");
    });

    // Luodaan objekti, joka sisältää datan
    const exportData = seinat.map((group, index) => {
        return {
            metadata: { version: 1, type: 'WallExport' },
            id: group.uuid, // Käytetään UUID:tä, se on varmempi kuin index
            nimi: group.name || `Seina_${index}`,
            position: group.position.toArray(), // Muuttaa [x, y, z] muotoon
            rotation: group.rotation.toArray().slice(0, 3), // [x, y, z]
            scale: group.scale.toArray(),
            
            // Jos haluat tallentaa myös Three.js-geometrian ja materiaalin:
            threeData: group.toJSON() 
        };
    });

    const jsonString = JSON.stringify(exportData, null, 2);

    console.log("--------------- SEINÄT TALLENNETTU ---------------");
    console.log(jsonString);


    
    // Vinkki: Voit myös ladata tämän suoraan tiedostona koneelle:
    downloadJSON(jsonString, "seinat.json");
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

        // Tyhjennetään nykyiset (valinnainen: jos haluat korvata vanhat)
        // groupDragObjects.length = 0; 
        // dragObjects.length = 0;

        data.forEach(item => {
            // Luodaan Three.js objekti takaisin datasta
            const ladattuRyhma = loader.parse(item.threeData);
            
            // Lisätään se sceneen ja hallintataulukoihin
            scene.add(ladattuRyhma);
            groupDragObjects.push(ladattuRyhma);
            
            // TÄRKEÄÄ: Lisätään ryhmän lapset (itse seinä-meshit) dragObjects-listaan
            // jotta niitä voi taas raahata hiirellä
            ladattuRyhma.children.forEach(child => {
                dragObjects.push(child);
            });
        });

        console.log("Seinät ladattu ja aktivoitu!");
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