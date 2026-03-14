import * as THREE from 'three';

import { DragControls } from 'three/addons/controls/DragControls.js';
import { setupInputHandlers } from './inputHandler';
import { scene, renderer, camera3d, camera2d, controls3D, controls2D, drawingPlane, grid, grid2 } from './sceneSetup.js';
import { setupTurnEvents, groupDragObjects, dragObjects, setDrawing, currentWallGroup, initWallManager, lisaaOvi, setupTurnOvi, undoHistory } from './wallManager.js';
import { tallennaSeinatJSON } from './saveSetup.js';
import { initLabelManager, paivitaLabelit } from './labelManager.js';


let activeCamera = camera3d;

//Kameran vaihto nappulan toiminto
buttonCamera.addEventListener("click", () => {
    if (activeCamera === camera3d) {
        activeCamera = camera2d;
        buttonCamera.textContent = "Vaihda 3D";
        controls2D.enabled = true;
        controls3D.enabled = false;
    } else {
        activeCamera = camera3d;
        buttonCamera.textContent = "Vaihda 2D";
        controls2D.enabled = false;
        controls3D.enabled = true;
    }

    if (dragControls) {
        dragControls.dispose();
    }
    
    dragControls = new DragControls(dragObjects, activeCamera, renderer.domElement);
    paivitaRaahaus();

    const siirtoPaalla = document.getElementById("siirtelytila").checked;
    if (!siirtoPaalla) {
        dragControls.enabled = false;
    }
})

export let groupDragControls

export let dragControls = new DragControls(dragObjects, activeCamera, renderer.domElement);
dragControls.transformGroup = true; // Lisää tämä rivi kaikkialle missä luot dragControlsit
paivitaRaahaus()

setDrawing(true)

initWallManager(() => activeCamera)

initLabelManager(() => activeCamera)

setupTurnEvents(() => activeCamera)

setupTurnOvi(() => activeCamera)

function disableBtn() {
    document.getElementById("buttonCamera").disabled = true;
}

function enableBtn() {
    document.getElementById("buttonCamera").disabled = false;
}

function paivitaTila() {
    const siirtelyRadio = document.getElementById("siirtelytila");
    const katseluRadio = document.getElementById("katselutila");
    const piirtoRadio = document.getElementById("piirtotila");
    const ikkunaRadio = document.getElementById("ikkunatila");
    const oviRadio = document.getElementById("ovitila");

    if (siirtelyRadio.checked) {
        dragControls.enabled = true;
        setDrawing(false)
        enableBtn();

        if (activeCamera === camera2d) {
            controls2D.enabled = true;
            controls3D.enabled = false;
        } else {
            controls2D.enabled = false;
            controls3D.enabled = true;
        }

        if (dragControls) {
                dragControls.dispose();
            }
            
            dragControls = new DragControls(dragObjects, activeCamera, renderer.domElement);
            paivitaRaahaus();
    }

    if (katseluRadio.checked) {
        dragControls.enabled = false;
        groupDragControls.enabled = false;
        setDrawing(false)
        enableBtn();

        if (activeCamera === camera2d) {
            controls2D.enabled = true;
            controls3D.enabled = false;
        } else {
            controls2D.enabled = false;
            controls3D.enabled = true;
        }
    }

    if (piirtoRadio.checked) {
        dragControls.enabled = false;
        groupDragControls.enabled = false;
        setDrawing(true)
        disableBtn();


        if (activeCamera !== camera2d) {
            activeCamera = camera2d;
            buttonCamera.textContent = "Vaihda 3D";
            controls2D.enabled = true;
            controls3D.enabled = false;
        }
    }

    if (ikkunaRadio.checked) {
        dragControls.enabled = false;
        groupDragControls.enabled = false;
        setDrawing(false)
        enableBtn();
    }

    if (oviRadio.checked) {
        dragControls.enabled = false;
        groupDragControls.enabled = false;
        setDrawing(false)
        enableBtn();
    }

    if (!piirtoRadio.checked) {
        setDrawing(false)
        if (currentWallGroup) {
            scene.remove(currentWallGroup);
            currentWallGroup = null;
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const siirtely = document.getElementById("siirtelytila");
    const katselu = document.getElementById("katselutila");
    const piirto = document.getElementById("piirtotila");
    const ikkuna = document.getElementById("ikkunatila");
    const ovi = document.getElementById("ovitila");

    const undoWrap = document.getElementById("undo-wrap");
    const showUndoModes = ['piirtotila', 'ikkunatila', 'ovitila'];

    //Undo button näkyvyys: piirto, ikkuna ja ovi tiloissa
    document.querySelectorAll('input[name="tila"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            undoWrap.style.display = showUndoModes.includes(e.target.value) ? 'block' : 'none';
        });
    });

    undoWrap.style.display = 'none';
    //Undo logiikka
    document.addEventListener('undo', () => {
        if (undoHistory.length === 0) return;

        const last = undoHistory.pop();

        if (last.type === "seina") {
            scene.remove(last.object);
            if (last.object.userData.label){
                last.object.userData.label.remove();
            }
            const idx = groupDragObjects.indexOf(last.object);
            if (idx !== -1) groupDragObjects.splice(idx, 1);
            paivitaRaahaus();
        }

        if (last.type === "ikkuna" || last.type === "ovi") {
            const lisatty = last.ryhma.children.find(c => c.userData.tyyppi === last.type);
            if (lisatty) last.ryhma.remove(lisatty);
            last.poistettavat.forEach(p => last.ryhma.add(p));
        }
    });

    

    if (siirtely) siirtely.addEventListener("change", paivitaTila);
    
    if (katselu) katselu.addEventListener("change", paivitaTila);

    if (piirto) piirto.addEventListener("change", paivitaTila);

    if (ikkuna) ikkuna.addEventListener("change", paivitaTila);
    
    if (ovi) ovi.addEventListener("change", paivitaTila);


    //Sivun latautuessa automaattisesti katselutilaan
    if (katselu) katselu.checked = true;

    paivitaTila();
})

export function paivitaRaahaus() {
    // Siivotaan vanhat pois
    if (dragControls) dragControls.dispose();
    if (groupDragControls) groupDragControls.dispose();

    // 1. Kontrollit seinille
    dragControls = new DragControls(dragObjects, activeCamera, renderer.domElement);
    
    // 2. Kontrollit ryhmille
    groupDragControls = new DragControls(groupDragObjects, activeCamera, renderer.domElement);
    groupDragControls.transformGroup = true; // Tämä liikuttaa koko ryhmää, ei vain jäsentä
    

    // Lisätään tapahtumakuuntelijat molempiin
    [dragControls, groupDragControls].forEach(ctrl => {
        ctrl.addEventListener("dragstart", function(event) {
            controls2D.enabled = false;
            controls3D.enabled = false;
        });

        ctrl.addEventListener("drag", function(event) {
            event.object.position.y = 0;
            // Snapping

            event.object.rotation.x = 0;
            event.object.rotation.z = 0;
            
            event.object.position.x = Math.round(event.object.position.x * 2) / 2;
            event.object.position.z = Math.round(event.object.position.z * 2) / 2;
        });

        ctrl.addEventListener("dragend", function(event) {
            if (activeCamera === camera2d) controls2D.enabled = true;
            else controls3D.enabled = true;
        });
    });

    // Tarkistetaan onko siirtelytila päällä
    const siirtoPaalla = document.getElementById("siirtelytila").checked;
    if (!siirtoPaalla) {
        dragControls.enabled = false;
        groupDragControls.enabled = false;
    }

    console.log(`%c[System] Raahaus päivitetty. Seiniä: ${dragObjects.length}, Ryhmiä: ${groupDragObjects.length}`, "color: #27ae60");
}

setupInputHandlers(scene, dragObjects, groupDragObjects, () => activeCamera);

function animate() {
    requestAnimationFrame(animate);

    if (dragControls) dragControls.camera = activeCamera;

    controls3D.update();
    controls2D.update();
    paivitaLabelit();
    renderer.render( scene, activeCamera );
}

tallennaSeinatJSON()

animate();