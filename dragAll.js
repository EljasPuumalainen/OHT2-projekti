import * as THREE from 'three';
import { scene } from './sceneSetup.js';

export const masterGroup = new THREE.Group();
masterGroup.name = "MASTER_SYSTEM";
masterGroup.userData.tyyppi = "master";

export function aktivoiMaster(groupDragObjects, getDragControls) {
    if (masterGroup.parent !== null) return;
    
    masterGroup.position.set(0, 0, 0);
    masterGroup.rotation.set(0, 0, 0);
    masterGroup.scale.set(1, 1, 1);
    scene.add(masterGroup);
    masterGroup.updateMatrixWorld(true);

    for (let i = groupDragObjects.length - 1; i >= 0; i--) {
        const group = groupDragObjects[i];
        if (group && group.parent) {
            masterGroup.attach(group);
            group.traverse(child => {
                if (child.isMesh) {
                    if (!child.userData.originalMaterial) child.userData.originalMaterial = child.material;
                    child.material = child.userData.originalMaterial.clone();
                    child.material.color.setHex(0xa8f4a8);
                }
            });
        }
    }

    const groupDragControls = getDragControls();
    if (groupDragControls) {
        groupDragControls.transformGroup = true;
        groupDragControls.objects = [masterGroup];
    }
}

export function deaktivoiMaster(groupDragObjects, getDragControls) {
    if (masterGroup.parent === null) return;

    const lapset = [...masterGroup.children];
    lapset.forEach(group => {
        group.traverse(child => {
            if (child.isMesh && child.userData.originalMaterial) {
                child.material = child.userData.originalMaterial;
            }
        });
        scene.attach(group);
    });

    scene.remove(masterGroup);

    const groupDragControls = getDragControls();
    if (groupDragControls) {
        groupDragControls.objects = groupDragObjects;
        groupDragControls.transformGroup = true;
    }
}