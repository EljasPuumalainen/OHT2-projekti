import * as THREE from 'three';

import { DragControls } from 'three/addons/controls/DragControls.js';

import { scene, renderer, camera3d, camera2d, controls3D, controls2D, drawingPlane, grid, grid2 } from './sceneSetup.js';
import { setupTurnEvents, groupDragObjects, dragObjects, setDrawing, currentWallGroup, initWallManager, lisaaOvi, setupTurnOvi, undoHistory, isDrawing, mouseScreenPos } from './wallManager.js';
import { tallennaJSON, lataaJSON } from './filemanager.js';
import { lisaaSuorakaide, lisaaSylinteri } from './objectManager.js';


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

// Seuraa, mikä objekti lisätään
let modalTyyppi = null;

window.addEventListener("DOMContentLoaded", () => {
    const siirtely = document.getElementById("siirtelytila");
    const katselu = document.getElementById("katselutila");
    const piirto = document.getElementById("piirtotila");
    const ikkuna = document.getElementById("ikkunatila");
    const ovi = document.getElementById("ovitila");

    const undoWrap = document.getElementById("undo-wrap");
    const showUndoModes = ['piirtotila', 'ikkunatila', 'ovitila'];

    const suorakaide = document.getElementById('btnSuorakaide');
    const sylinteri = document.getElementById('btnSylinteri');
    const modalOK = document.getElementById('modalOK');
    const modalPeruuta = document.getElementById('modalPeruuta');

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
            const idx = groupDragObjects.indexOf(last.object);
            if (idx !== -1) groupDragObjects.splice(idx, 1);
            paivitaRaahaus();
        }

        if (last.type === "ikkuna" || last.type === "ovi") {
            const lisatty = last.ryhma.children.find(c => c.userData.tyyppi === last.type);
            if (lisatty) last.ryhma.remove(lisatty);
            last.poistettavat.forEach(p => last.ryhma.add(p));
        }

        if (last.type === "primitiivi") {
            scene.remove(last.object);
            const idx = groupDragObjects.indexOf(last.object);
            if (idx !== -1) groupDragObjects.splice(idx, 1);
            paivitaRaahaus();
        }
    });

    //Logiikka sylintereille ja suorakaiteille
    suorakaide.addEventListener('click', () => {
        modalTyyppi = 'suorakaide';
        document.getElementById('modalOtsikko').textContent = 'Lisää suorakaide';
        document.getElementById('suorakaideKentat').style.display = 'block';
        document.getElementById('sylinteriKentat').style.display = 'none';
        document.getElementById('primitiiviModal').style.display = 'block';
    });

    sylinteri.addEventListener('click', () => {
        modalTyyppi = 'sylinteri';
        document.getElementById('modalOtsikko').textContent = 'Lisää sylinteri';
        document.getElementById('suorakaideKentat').style.display = 'none';
        document.getElementById('sylinteriKentat').style.display = 'block';
        document.getElementById('primitiiviModal').style.display = 'block';
    });

    modalOK.addEventListener('click', () => {
        const nimi = document.getElementById('pNimi').value.trim();
        if (modalTyyppi === 'suorakaide') {
            const l = parseFloat(document.getElementById('pLeveys').value);
            const s = parseFloat(document.getElementById('pSyvyys').value);
            const k = parseFloat(document.getElementById('pKorkeus').value);
            lisaaSuorakaide(l, s, k, nimi);
        } else if (modalTyyppi === 'sylinteri') {
            const h = parseFloat(document.getElementById('pHalkaisija').value);
            const k = parseFloat(document.getElementById('pSylKorkeus').value);
            lisaaSylinteri(h, k, nimi);
        }
        document.getElementById('primitiiviModal').style.display = 'none';
    });

    modalPeruuta.addEventListener('click', () => {
        document.getElementById('primitiiviModal').style.display = 'none';
    });


    if (siirtely) siirtely.addEventListener("change", paivitaTila);
    
    if (katselu) katselu.addEventListener("change", paivitaTila);

    if (piirto) piirto.addEventListener("change", paivitaTila);

    if (ikkuna) ikkuna.addEventListener("change", paivitaTila);
    
    if (ovi) ovi.addEventListener("change", paivitaTila);


    //Sivun latautuessa automaattisesti katselutilaan
    if (katselu) katselu.checked = true;



    const saveBtn = document.getElementById('buttonSave');
    const loadInput = document.getElementById('lataaTiedosto');

    if (saveBtn) {
        saveBtn.addEventListener('click', tallennaJSON);
    }

    if (loadInput) {
        loadInput.addEventListener('change', (e) => {
            lataaJSON(e);
            // Pieni viive latauksen jälkeen, jotta raahaus saadaan päälle uusille seinille
            setTimeout(() => {
                paivitaRaahaus();
            }, 100);
        });
    }

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



function animate() {
    requestAnimationFrame(animate);

    if (dragControls) dragControls.camera = activeCamera;

    // Reunan liikkuminen seinää piirtäessä
    if (isDrawing && currentWallGroup) {  
        const edgeSize = 80;
        const panSpeed = 0.08;

        const dx =
            mouseScreenPos.x < edgeSize ? -panSpeed :
            mouseScreenPos.x > window.innerWidth - edgeSize ? panSpeed : 0;

        const dz =
            mouseScreenPos.y < edgeSize ? -panSpeed :
            mouseScreenPos.y > window.innerHeight - edgeSize ? panSpeed : 0;

        if (dx !== 0 || dz !== 0) {
            camera2d.position.x += dx;
            camera2d.position.z += dz;
            controls2D.target.x += dx;
            controls2D.target.z += dz;
        }
    }

    controls3D.update()
    controls2D.update()
    renderer.render( scene, activeCamera );
}


animate();