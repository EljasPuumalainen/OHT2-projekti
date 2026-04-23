import * as THREE from 'three';
import { scene } from './sceneSetup.js';
import { groupDragObjects, undoHistory } from './wallManager.js';
import { aktivoiAlueRaahaus, puraAlueRaahaus } from './selectedDrag.js';
import { paivitaRaahaus } from './main.js';
import { setSelectedObjectManual, getSelectedObject } from './deleteObject.js';

let kopioitu = [];

export function initCopyPaste(getGroupDragControls) {

    window.addEventListener('keydown', (e) => {
        const siirtelyRadio = document.getElementById('siirtelytila');
        if (!siirtelyRadio?.checked) return;

        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        // --- CTRL+C ---
        if (e.ctrlKey && e.key === 'c') {
            kopioitu = [];

            const alueRyhma = scene.getObjectByName('ALUEVALINTA_RYHMA');
            if (alueRyhma && alueRyhma.children.length > 0) {
                // Kopioidaan aluevalinnasta
                kopioitu = [...alueRyhma.children];
                console.log('[CopyPaste] Kopioitu', kopioitu.length, 'seinää aluevalinnasta');
            } else {
                // Kopioidaan yksittäinen valittu objekti
                const valittu = getSelectedObject();
                if (valittu && groupDragObjects.includes(valittu)) {
                    kopioitu = [valittu];
                    console.log('[CopyPaste] Kopioitu yksittäinen seinä');
                }
            }

            if (kopioitu.length === 0) {
                console.log('[CopyPaste] Ei valittua kopiointia varten');
            }
        }

        // --- CTRL+V ---
        if (e.ctrlKey && e.key === 'v') {
            if (kopioitu.length === 0) {
                console.log('[CopyPaste] Ei kopioitua sisältöä');
                return;
            }

            // Puretaan vanha valinta ensin
            puraAlueRaahaus(groupDragObjects, getGroupDragControls());

            const kloonit = [];
            const offset = new THREE.Vector3(0.5, 0, 0.5);

            kopioitu.forEach(obj => {
                const klooni = obj.clone();

                klooni.rotation.reorder('YXZ');

                const maailmaPos = new THREE.Vector3();
                obj.getWorldPosition(maailmaPos);
                const maailmaQuat = new THREE.Quaternion();
                obj.getWorldQuaternion(maailmaQuat);

                klooni.position.copy(maailmaPos).add(offset);
                klooni.quaternion.copy(maailmaQuat);
                klooni.scale.copy(obj.scale);

                // Puhdistetaan materialit
                klooni.traverse(child => {
                    if (child.isMesh) {
                        child.userData.originalMaterial = null;
                        child.material = child.material.clone();
                    }
                });

                scene.add(klooni);
                groupDragObjects.push(klooni);
                kloonit.push(klooni);
            });

            console.log('[CopyPaste] Liitetty', kloonit.length, 'seinää');

            // Päivitetään kontrollit ja aktivoidaan kloonit aluevalintana
            paivitaRaahaus();
            aktivoiAlueRaahaus(kloonit, getGroupDragControls());

            // Asetetaan aluevalintaryhmä valituksi jotta Delete toimii
            const ryhma = scene.getObjectByName('ALUEVALINTA_RYHMA');
            if (ryhma) {
                ryhma.rotation.reorder('YXZ');
                setSelectedObjectManual(ryhma);
            }

            
        }
    });
}