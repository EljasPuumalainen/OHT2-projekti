import * as THREE from 'three';

import { DragControls } from 'three/addons/controls/DragControls.js';

import { scene, renderer, camera3d, camera2d, controls3D, controls2D, drawingPlane, grid } from './sceneSetup.js';
import { setupTurnEvents, groupDragObjects, dragObjects, setDrawing, currentWallGroup, initWallManager, setupTurnOvi, undoHistory, isDrawing, mouseScreenPos } from './wallManager.js';
import { tallennaJSON, lataaJSON } from './filemanager.js';
import { lisaaSuorakaide, lisaaSylinteri, lisaaPortaat, lisaaHissi} from './objectManager.js';
import { lataaPohjakuva, asetaOpasiteetti, asetaLeveys, asetaKorkeus, toggleLukitus, onkoLukittu, onkoPohjakuva, initImageManager, startKalibrointi, initKalibrointiNapit } from './imageManager.js';
import { aktivoiMaster, deaktivoiMaster, masterGroup} from './dragAll.js';

import { setupDeleteEvents } from './deleteObject.js';

import { initSelection } from './selection.js';

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

initSelection(
    () => activeCamera, 
    () => (activeCamera === camera3d ? controls3D : controls2D),
    () => groupDragControls  // ← getteri
);

paivitaRaahaus()

setDrawing(true)

initWallManager(() => activeCamera)

initImageManager(() => activeCamera)

setupTurnEvents(() => activeCamera)

setupTurnOvi(() => activeCamera)

setupDeleteEvents(() => activeCamera)

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

    const liikutaKaikkiaCheckbox = document.getElementById("liikutaKaikkia");
    
    if (liikutaKaikkiaCheckbox && liikutaKaikkiaCheckbox.checked) {
        // Aktivoi master-tila
        aktivoiMaster(groupDragObjects, () => groupDragControls);
        
        // Pakotetaan käyttöliittymä oikeaan tilaan
        setDrawing(false);
        enableBtn();
    } else {
        // Poista master-tila
        deaktivoiMaster(groupDragObjects, () => groupDragControls);
        
        // Nyt vasta kutsutaan paivitaRaahaus, kun masterGroup on purettu
        paivitaRaahaus();
    }


    if (siirtelyRadio.checked) {
        dragControls.enabled = true;
        if (groupDragControls) groupDragControls.enabled = true;
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
    const liikutaKaikkiaCheckbox = document.getElementById("liikutaKaikkia");

    const undoWrap = document.getElementById("undo-wrap");
    const showUndoModes = ['piirtotila', 'ikkunatila', 'ovitila'];

    const suorakaide = document.getElementById('btnSuorakaide');
    const sylinteri = document.getElementById('btnSylinteri');
    const portaat = document.getElementById('btnPortaat');
    const hissi = document.getElementById('btnHissi');
    const modalOK = document.getElementById('modalOK');
    const modalPeruuta = document.getElementById('modalPeruuta');
    const primitiiviModal = document.getElementById('primitiiviModal');

    const pohjakuva = document.getElementById('lataaPohjakuvatiedosto');
    const opasiteetti = document.getElementById('sliderOpasiteetti');
    const inputLeveys = document.getElementById('inputLeveys');
    const inputKorkeus = document.getElementById('inputKorkeus');
    const lukitse = document.getElementById('btnLukitsePohjakuva');
    const btnKalibroi = document.getElementById('btnKalibroi');




    liikutaKaikkiaCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            // Vaihda siirtelytilaan ensin
            if (siirtely) {
                siirtely.checked = true;
                paivitaTila(); // ← pakota tilan vaihto ensin
            }
            paivitaRaahaus();
            aktivoiMaster(groupDragObjects, () => groupDragControls);
        } else {
            deaktivoiMaster(groupDragObjects, () => groupDragControls);
            paivitaRaahaus();
        }
    });
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
      
        if (last.type === "poisto") {
          if (last.parent) {
            last.parent.add(last.object);
        } else {
            scene.add(last.object);
        }

        if (last.indexInGroupDrag !== -1) {
            groupDragObjects.push(last.object);
        }

        if (last.indexInDrag !== -1) {
            dragObjects.push(last.object);
        }

        if (document.getElementById("liikutaKaikkia").checked) {
            return; // Jos ollaan master-tilassa, älä tee mitään perus-raahauspäivityksiä
        }

        paivitaRaahaus();
    }
      
    });

    //Logiikka sylintereille ja suorakaiteille
    suorakaide.addEventListener('click', () => {
        modalTyyppi = 'suorakaide';
        document.getElementById('modalOtsikko').textContent = 'Lisää suorakaide';
        document.getElementById('suorakaideKentat').style.display = 'block';
        document.getElementById('sylinteriKentat').style.display = 'none';
        document.getElementById('portaatKentat').style.display = 'none';
        document.getElementById('hissiKentat').style.display = 'none';
        document.getElementById('primitiiviModal').style.display = 'block';
    });

    sylinteri.addEventListener('click', () => {
        modalTyyppi = 'sylinteri';
        document.getElementById('modalOtsikko').textContent = 'Lisää sylinteri';
        document.getElementById('suorakaideKentat').style.display = 'none';
        document.getElementById('sylinteriKentat').style.display = 'block';
        document.getElementById('portaatKentat').style.display = 'none';
        document.getElementById('hissiKentat').style.display = 'none';
        document.getElementById('primitiiviModal').style.display = 'block';
    });

    portaat.addEventListener('click', () => {
        modalTyyppi = 'portaat';
        document.getElementById('pNimi').parentElement.style.display = 'none';
        document.getElementById('modalOtsikko').textContent = 'Lisää portaat';
        document.getElementById('suorakaideKentat').style.display = 'none';
        document.getElementById('sylinteriKentat').style.display = 'none';
        document.getElementById('portaatKentat').style.display = 'block';
        document.getElementById('hissiKentat').style.display = 'none';
        document.getElementById('primitiiviModal').style.display = 'block';
    });

    hissi.addEventListener('click', () => {
        modalTyyppi = 'hissi';
        document.getElementById('pNimi').parentElement.style.display = 'none';
        document.getElementById('modalOtsikko').textContent = 'Lisää hissi';
        document.getElementById('suorakaideKentat').style.display = 'none';
        document.getElementById('sylinteriKentat').style.display = 'none';
        document.getElementById('portaatKentat').style.display = 'none';
        document.getElementById('hissiKentat').style.display = 'block';
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
        else if (modalTyyppi === 'portaat') {
            const l = parseFloat(document.getElementById('portaidenLeveys').value);
            const s = parseFloat(document.getElementById('portaidenSyvyys').value);
            const k = parseFloat(document.getElementById('portaidenKorkeus').value);
            const a = parseInt(document.getElementById('portaidenAskelmat').value, 10);
            lisaaPortaat(l, s, k, a, nimi);
        }
        else if (modalTyyppi === 'hissi') {
            const l = parseFloat(document.getElementById('hissiLeveys').value);
            const s = parseFloat(document.getElementById('hissiSyvyys').value);
            const k = parseFloat(document.getElementById('hissiKorkeus').value);
            lisaaHissi(l, s, k, '');
        }
        document.getElementById('primitiiviModal').style.display = 'none';
    });

    modalPeruuta.addEventListener('click', () => {
        document.getElementById('primitiiviModal').style.display = 'none';
    });

    primitiiviModal.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    })

    pohjakuva.addEventListener('change', (e) => {
        if (e.target.files[0]) lataaPohjakuva(e.target.files[0]);
    });

    opasiteetti.addEventListener('input', (e) => {
        asetaOpasiteetti(e.target.value);
    });

    inputLeveys.addEventListener('input', (e) => asetaLeveys(e.target.value));
    
    inputKorkeus.addEventListener('input', (e) => asetaKorkeus(e.target.value));

    lukitse.addEventListener('click', toggleLukitus);

    if (siirtely) siirtely.addEventListener("change", paivitaTila);
    
    if (katselu) katselu.addEventListener("change", paivitaTila);

    if (piirto) piirto.addEventListener("change", paivitaTila);

    if (ikkuna) ikkuna.addEventListener("change", paivitaTila);
    
    if (ovi) ovi.addEventListener("change", paivitaTila);


    //Sivun latautuessa automaattisesti katselutilaan
    if (katselu) katselu.checked = true;

    if(btnKalibroi) btnKalibroi.addEventListener('click', startKalibrointi);


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

    initKalibrointiNapit();
    paivitaTila();
})

export function paivitaRaahaus() {
    
    const onkoAlueValittu = groupDragControls && 
        groupDragControls.objects.length === 1 && 
        (
            (groupDragControls.objects[0].name === "ALUEVALINTA_RYHMA" &&
            !!scene.getObjectByName("ALUEVALINTA_RYHMA"))
            ||
            (groupDragControls.objects[0].name === "MASTER_SYSTEM" && 
            !!scene.getObjectByName("MASTER_SYSTEM"))
        );

    if (groupDragControls && 
        groupDragControls.objects.length === 1 &&
        groupDragControls.objects[0].name === "ALUEVALINTA_RYHMA" &&
        !scene.getObjectByName("ALUEVALINTA_RYHMA")) {
        groupDragControls.objects = groupDragObjects;
    }

    if (onkoAlueValittu) {
        console.log("Aluevalinta tai Master aktiivinen, ohitetaan nollaus.");
        return; 
    }

    // Siivotaan vanhat pois
    if (dragControls) dragControls.dispose();
    if (groupDragControls) groupDragControls.dispose();

    const muokkaaKaikkia = document.getElementById("liikutaKaikkia").checked;

    // 1. Kontrollit seinille
    dragControls = new DragControls(dragObjects, activeCamera, renderer.domElement);
    
    // 2. Kontrollit ryhmille (Tarkistetaan, hallitaanko kaikkia vai yksittäisiä ryhmiä)
    const kohteet = muokkaaKaikkia ? [masterGroup] : groupDragObjects;
    groupDragControls = new DragControls(kohteet, activeCamera, renderer.domElement);
    groupDragControls.transformGroup = true;

    // Lisätään tapahtumakuuntelijat (dragstart, drag, dragend)
    [dragControls, groupDragControls].forEach(ctrl => {
        ctrl.addEventListener("dragstart", () => {
            controls2D.enabled = false;
            controls3D.enabled = false;
        });

        ctrl.addEventListener("drag", (event) => {
            event.object.position.y = 0;
            event.object.rotation.x = 0;
            event.object.rotation.z = 0;
            event.object.position.x = Math.round(event.object.position.x * 8) / 8;
            event.object.position.z = Math.round(event.object.position.z * 8) / 8;
        });

        ctrl.addEventListener("dragend", () => {
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
}



function animate() {
    requestAnimationFrame(animate);

    if (dragControls) dragControls.camera = activeCamera;

    // Reunan liikkuminen seinää piirtäessä
    if (isDrawing && currentWallGroup) {  
        const edgeSize = 80;
        const panSpeed = 0.08;

        const elementUnderMouse = document.elementFromPoint(mouseScreenPos.x, mouseScreenPos.y);
        const overUI = elementUnderMouse && elementUnderMouse !== renderer.domElement;

        const dx = overUI ? 0 :
            mouseScreenPos.x < edgeSize ? -panSpeed :
            mouseScreenPos.x > window.innerWidth - edgeSize ? panSpeed : 0;

        const dz = overUI ? 0 :
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