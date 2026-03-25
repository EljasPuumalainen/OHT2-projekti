import * as THREE from 'three';
import { scene } from './sceneSetup.js';



// Luodaan yksi pysyvä isäntäryhmä
export const masterGroup = new THREE.Group();
masterGroup.userData.tyyppi = "master";

export function aktivoiMaster(groupDragObjects, groupDragControls) {
    if (!groupDragObjects || groupDragObjects.length === 0) return;

    if (!scene.children.includes(masterGroup)) {
        masterGroup.position.set(0, 0, 0);
        scene.add(masterGroup);

        // Siirretään seinäryhmät masteriin
        [...groupDragObjects].forEach(group => {
            masterGroup.attach(group);
            
            // Korostus
            group.traverse(child => {
                if (child.isMesh) {
                    if (!child.userData.originalMaterial) child.userData.originalMaterial = child.material;
                    child.material = child.userData.originalMaterial.clone();
                    child.material.color.setHex(0xa8f4a8); // laskettu lopputulosväri
                }
            });
        });
    }

    // Asetetaan raahaus:
    // 1. Tyhjennetään vanhat kohteet
    // 2. Laitetaan VAIN masterGroup listalle
    // 3. transformGroup = true, jolloin se liikuttaa ryhmää kun klikkaat lasta
    groupDragControls.transformGroup = true;
    groupDragControls.objects = [masterGroup]; 

    console.log("Master-tila: DragControls ohjattu masterGroupiin.");
}

export function deaktivoiMaster(groupDragObjects, groupDragControls) {
    if (scene.children.includes(masterGroup)) {
        [...masterGroup.children].forEach(group => {
            group.traverse(child => {
                if (child.isMesh && child.userData.originalMaterial) {
                    child.material = child.userData.originalMaterial;
                    child.userData.originalMaterial = null;
                }
            });
            scene.attach(group);
        });
        scene.remove(masterGroup);
    }

    // Palautetaan normaalit asetukset wallManagerin listalle
    if (groupDragControls) {
        groupDragControls.objects = groupDragObjects;
        groupDragControls.transformGroup = true;
    }
}