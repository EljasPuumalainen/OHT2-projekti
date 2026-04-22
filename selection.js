import * as THREE from "three"

import { groupDragObjects } from './wallManager.js';
import { aktivoiAlueRaahaus, puraAlueRaahaus } from './selectedDrag.js';
import { paivitaRaahaus } from "./main.js";
import { setSelectedObjectManual } from './deleteObject.js';
import { scene } from './sceneSetup.js';


let isDragging = false;
let startX, startY;
let clickStartX, clickStartY;

const selectionBox = document.createElement('div');
selectionBox.classList.add('selection-box');
document.body.appendChild(selectionBox);


export function initSelection(getActiveCamera, getActiveControls, getGroupDragControls) {
    
    window.addEventListener('mousedown', (e) => {
        const tila = document.querySelector('input[name="tila"]:checked')?.value;
        const camera = getActiveCamera();
        const is2D = camera instanceof THREE.OrthographicCamera; 

        if (tila !== 'siirtelytila' || !is2D) return;

        // Tallennetaan aloituspiste klikkaustunnistusta varten
        clickStartX = e.clientX;
        clickStartY = e.clientY;

        // --- MAALAUS ALKAA (CTRL + Vasen hiiri) ---
        if (e.ctrlKey && e.button === 0) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            selectionBox.style.display = 'block';
            selectionBox.style.width = '0px';
            selectionBox.style.height = '0px';
            selectionBox.style.left = startX + 'px';
            selectionBox.style.top = startY + 'px';

            const controls = getActiveControls();
            if (controls) controls.enabled = false;
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        selectionBox.style.width = Math.abs(e.clientX - startX) + 'px';
        selectionBox.style.height = Math.abs(e.clientY - startY) + 'px';
        selectionBox.style.left = Math.min(e.clientX, startX) + 'px';
        selectionBox.style.top = Math.min(e.clientY, startY) + 'px';
    });

    window.addEventListener('mouseup', (e) => {
        const camera = getActiveCamera();
        
        // --- ÄLYKÄS PURKU (Ei shiftiä, vasen hiiri) ---
        if (!e.shiftKey && e.button === 0 && !isDragging) {
            // Lasketaan kuinka paljon hiiri liikkui mousedownin jälkeen
            const dist = Math.sqrt(Math.pow(e.clientX - clickStartX, 2) + Math.pow(e.clientY - clickStartY, 2));
            
            // Jos hiiri liikkui alle 5 pikseliä, kyseessä oli KLIKKAUS (ei raahaus)
            if (dist < 5) {
                // Älä tee mitään jos master-tila on päällä
                const masterToggle = document.getElementById("liikutaKaikkia");
                if (masterToggle && masterToggle.checked) return;
                
                console.log("Klikkaus tyhjään -> Puretaan valinta");
                puraAlueRaahaus(groupDragObjects, getGroupDragControls());
                paivitaRaahaus();
                return;
            }

        }

        if (!isDragging) return;

        // --- MAALAUS PÄÄTTYY ---
        isDragging = false;
        selectionBox.style.display = 'none';
        
        const controls = getActiveControls();
        if (controls) controls.enabled = true;

        const minX = Math.min(startX, e.clientX);
        const maxX = Math.max(startX, e.clientX);
        const minY = Math.min(startY, e.clientY);
        const maxY = Math.max(startY, e.clientY);

        const valitut = [];

        groupDragObjects.forEach(group => {
        // Haetaan seinän geometriaan perustuva laatikko (Bounding Box)
        const box = new THREE.Box3().setFromObject(group);
        const points = [
            new THREE.Vector3(box.min.x, 0, box.min.z), // Alkupiste
            new THREE.Vector3(box.max.x, 0, box.max.z), // Loppupiste
            new THREE.Vector3(
                (box.min.x + box.max.x) / 2, 0, (box.min.z + box.max.z) / 2
            ) // Keskipiste varmuuden vuoksi
        ];

        let osuu = false;

        points.forEach(pt => {
            pt.project(camera);
            const x = (pt.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-(pt.y * 0.5) + 0.5) * window.innerHeight;

            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                osuu = true;
            }
        });

        if (osuu) {
            valitut.push(group);
        }
        });

        if (valitut.length > 0) {
            console.log("Valittu " + valitut.length + " seinää.");
            
            aktivoiAlueRaahaus(valitut, getGroupDragControls());
            const ryhma = scene.getObjectByName("ALUEVALINTA_RYHMA");
            if (ryhma) {
                setSelectedObjectManual(ryhma);
            }
        }
    });
}