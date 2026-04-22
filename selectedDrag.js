import * as THREE from 'three';
import { scene } from './sceneSetup.js';

// Tilapäinen ryhmä vain aluevalintaa varten
let selectionGroup = new THREE.Group();
selectionGroup.name = "ALUEVALINTA_RYHMA";

export function aktivoiAlueRaahaus(valitutObjektit, groupDragControls) {
    // 1. VARMISTUS: Jos vanha ryhmä on olemassa, pura se ENNEN kuin teet mitään muuta
    
    const vanha = scene.getObjectByName("ALUEVALINTA_RYHMA");
    if (vanha) {
        [...vanha.children].forEach(child => scene.attach(child));
        scene.remove(vanha);
    }

    if (!valitutObjektit || valitutObjektit.length === 0) return;

    // 2. Luo uusi ryhmä-instanssi varmuuden vuoksi
    selectionGroup = new THREE.Group();
    selectionGroup.name = "ALUEVALINTA_RYHMA";
    selectionGroup.position.set(0, 0, 0);
    scene.add(selectionGroup);

    // 3. Lisää uudet seinät
    valitutObjektit.forEach(obj => {
        if (obj && obj.parent) {
            obj.traverse(child => {
                if (child.isMesh) {
                    // LISÄÄ TÄMÄ — ohita hoverBoxit
                    if (child.material?.color?.getHex() === 0x00ff00) return;
                    
                    child.userData.originalMaterial = child.material;
                    child.material = child.userData.originalMaterial.clone();
                    child.material.color.setHex(0xa8f4a8);
                }
            });
            selectionGroup.attach(obj);
        }
    });

    // 4. Päivitä kontrollit
    if (groupDragControls) {
        groupDragControls.transformGroup = true;
        groupDragControls.objects = [selectionGroup];
    }
}

export function puraAlueRaahaus(kaikkiObjektit, groupDragControls) {
    const ryhma = scene.getObjectByName("ALUEVALINTA_RYHMA");
    if (!ryhma) return;

    const lapset = [...ryhma.children];
    lapset.forEach(obj => {
        obj.traverse(child => {
            if (child.isMesh && child.userData.originalMaterial) {
                child.material = child.userData.originalMaterial;
            }
        });
        scene.attach(obj); // Palautetaan takaisin sceneen
    });

    scene.remove(ryhma);

    if (groupDragControls && kaikkiObjektit) {
        groupDragControls.objects = kaikkiObjektit;
        groupDragControls.transformGroup = true;
    }
}