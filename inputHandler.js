import * as THREE from 'three';
import { toggleSelection, ryhmitaValitut } from './groupLogic.js';


export function setupInputHandlers(scene, dragObjects, groupDragObjects, getActiveCamera) {
    
    // NÄPPÄIMISTÖ (KeyDown)
    window.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();

        if (key === 'g') {
    // Varmista, että annat kaikki kolme parametria tässä järjestyksessä!
            ryhmitaValitut(scene, dragObjects, groupDragObjects); 
        }
    });

    // HIIRI (MouseDown)
    window.addEventListener("mousedown", (event) => {
        // Alt + Vasen hiiri = Valinta
        if (event.altKey && event.button === 0) {
            console.log("%c[Input] Alt + Click tunnistettu", "color: #9b59b6");

            const mouse = new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1
            );

            const raycaster = new THREE.Raycaster();
            // Haetaan aktiivinen kamera funktion kautta
            const currentCamera = getActiveCamera();
            raycaster.setFromCamera(mouse, currentCamera);
            
            const intersects = raycaster.intersectObjects(dragObjects, true);

            if (intersects.length > 0) {
                let kohde = intersects[0].object;
                
                // Etsitään ylin parent (Group tai itsenäinen Mesh)
                while (kohde.parent && kohde.parent.type !== 'Scene') {
                    kohde = kohde.parent;
                }
                
                // Kutsutaan nyt oikeasti sitä GroupManagerin funktiota!
                toggleSelection(kohde);
                
            } else {
                console.log("[Input] Klikkaus osui tyhjään.");
            }
        }
    });
}