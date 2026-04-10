import * as THREE from "three"

import { groupDragObjects } from './wallManager.js';
import { aktivoiAlueRaahaus, puraAlueRaahaus } from './selectedDrag.js';

import { Raycaster, Vector2 } from 'three';

let isDragging = false;
let startX, startY;
let clickStartX, clickStartY;

const selectionBox = document.createElement('div');
selectionBox.classList.add('selection-box');
document.body.appendChild(selectionBox);


const frustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();

export function initSelection(getActiveCamera, getActiveControls, groupDragControls) {
    
    window.addEventListener('mousedown', (e) => {
        const tila = document.querySelector('input[name="tila"]:checked')?.value;
        const camera = getActiveCamera();
        const is2D = camera instanceof THREE.OrthographicCamera; 

        if (tila !== 'siirtelytila' || !is2D) return;

        // Tallennetaan aloituspiste klikkaustunnistusta varten
        clickStartX = e.clientX;
        clickStartY = e.clientY;

        // --- MAALAUS ALKAA (Shift + Vasen hiiri) ---
        if (e.shiftKey && e.button === 0) {
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
                console.log("Klikkaus tyhjään -> Puretaan valinta");
                puraAlueRaahaus(groupDragObjects, groupDragControls);
                
                const masterToggle = document.getElementById("liikutaKaikkia");
                if (masterToggle) masterToggle.checked = false;
                return; // Lopetetaan tähän
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
            const vector = new THREE.Vector3();
            group.getWorldPosition(vector);
            vector.project(camera);

            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                valitut.push(group);
            }
        });

        if (valitut.length > 0) {
            console.log("Valittu " + valitut.length + " seinää.");
            aktivoiAlueRaahaus(valitut, groupDragControls);
        }
    });
}