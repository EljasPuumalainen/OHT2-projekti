import * as THREE from 'three'
import { paivitaRaahaus } from './main';

// Pidetään valitut kohteet moduulin sisäisessä listassa
let valitutObjektit = [];






export function toggleSelection(objekti) {

    const index = valitutObjektit.indexOf(objekti)

    if (index > -1) {
        // Poistetaan valinta ja korostus
        valitutObjektit.splice(index, 1);
        asetaKorostus(objekti, false);
        console.log("Kohde poistettu valinnoista.");
    } else {
        // Lisätään valinta ja korostus
        valitutObjektit.push(objekti);
        asetaKorostus(objekti, true);
        console.log("Kohde lisätty valintoihin. Yhteensä:", valitutObjektit.length);
    }
}

/**
 * Apufunktio värin muuttamiseen
 */
function asetaKorostus(objekti, paalla) {
    objekti.traverse(child => {
        if (child.isMesh && child.material) {
            // Käytetään emissive-väriä korostukseen (keltainen)
            if (paalla) {
                child.material.emissive.set(0x555500);
            } else {
                child.material.emissive.set(0x000000);
            }
        }
    });
}

/**
 * Lyö valitut objektit lukkoon yhdeksi ryhmäksi
 */
export function ryhmitaValitut(scene, dragObjects, groupDragObjects = []) {
    console.log("%c[Grouping] Aloitetaan ryhmitys...", "font-weight: bold; color: #f39c12");
    
    if (valitutObjektit.length < 2) {
        console.warn("Valitse vähintään kaksi kohdetta ryhmittääksesi!");
        return null;
    }

    const uusiRyhma = new THREE.Group();
    uusiRyhma.name = "SeinaRyhma_" + Date.now();
    scene.add(uusiRyhma);

    // 1. Lasketaan keskipiste (maailmankoordinaateissa)
    const keskiPiste = new THREE.Vector3();
    valitutObjektit.forEach(obj => keskiPiste.add(obj.position));
    keskiPiste.divideScalar(valitutObjektit.length);
    
    uusiRyhma.position.copy(keskiPiste);

    // 2. Siirretään jäsenet ryhmään ja siivotaan listat
    valitutObjektit.forEach(obj => {
        // Poistetaan seinä yksittäisten raahattavien listasta (dragObjects)
        const idx = dragObjects.indexOf(obj);
        if (idx > -1) {
            dragObjects.splice(idx, 1);
            console.log(` -> Poistettu drag-listalta: ${obj.name || "Nimetön Mesh"}`);
        }

        // Muutetaan objektin sijainti suhteessa ryhmän origoon
        obj.position.sub(keskiPiste);
        uusiRyhma.add(obj);

        // Poistetaan valintaväri
        asetaKorostus(obj, false);
    });

    // 3. Lisätään uusi ryhmä RYHMÄ-listalle (groupDragObjects), EI dragObjects-listalle
    groupDragObjects.push(uusiRyhma);
    
    console.log(`%c[Grouping] VALMIS! Ryhmässä on ${uusiRyhma.children.length} jäsentä.`, "color: #f39c12; font-weight: bold");
    console.log("Yksittäisiä jäljellä:", dragObjects.length);
    console.log("Ryhmiä nyt:", groupDragObjects.length);

    // Tyhjennetään valitut
    valitutObjektit = [];

    // Päivitetään main.js:n kontrollit
    paivitaRaahaus();

    return uusiRyhma;
}