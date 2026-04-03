import * as THREE from 'three';
import { scene } from './sceneSetup.js';



// Luodaan yksi pysyvä isäntäryhmä
export const masterGroup = new THREE.Group();
masterGroup.userData.tyyppi = "master";

export function aktivoiMaster(groupDragObjects, groupDragControls) {
    // Jos masterGroup on jo scenessä, ei tehdä mitään (estää rämppäys-jumin)
    if (scene.getObjectByName("MASTER_SYSTEM")) return;
    
    masterGroup.name = "MASTER_SYSTEM"; // Annetaan nimi tunnistusta varten
    masterGroup.position.set(0, 0, 0);
    scene.add(masterGroup);

    // Käydään lista läpi käänteisessä järjestyksessä (turvallisempaa siirrettäessä)
    for (let i = groupDragObjects.length - 1; i >= 0; i--) {
        const group = groupDragObjects[i];
        
        // Varmistus: onhan se varmasti olemassa ja scenessä
        if (group && group.parent) {
            masterGroup.attach(group);
            
            // Korostus looppina
            group.traverse(child => {
                if (child.isMesh) {
                    if (!child.userData.originalMaterial) child.userData.originalMaterial = child.material;
                    child.material = child.userData.originalMaterial.clone();
                    child.material.color.setHex(0xa8f4a8); // laskettu lopputulosväri
                }
            });
        }
    }

    if (groupDragControls) {
        groupDragControls.transformGroup = true;
        groupDragControls.objects = [masterGroup];
    }
}

export function deaktivoiMaster(groupDragObjects, groupDragControls) {
    // Jos masterGroupia ei löydy, ei ole mitään purettavaa
    if (!scene.getObjectByName("MASTER_SYSTEM")) return;

    // Palautetaan kaikki lapset scenen juureen
    const lapset = [...masterGroup.children];
    lapset.forEach(group => {
        group.traverse(child => {
            if (child.isMesh && child.userData.originalMaterial) {
                // PALAUTUS: Asetetaan alkuperäinen materiaali takaisin (ei vain väriä)
                child.material = child.userData.originalMaterial;
            }
        });
        scene.attach(group);
    });

    scene.remove(masterGroup);
    masterGroup.name = ""; // Tyhjennetään nimi

    if (groupDragControls) {
        groupDragControls.objects = groupDragObjects;
        groupDragControls.transformGroup = true;
    }
}