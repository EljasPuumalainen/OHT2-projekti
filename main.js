import * as THREE from 'three';

import { DragControls } from 'three/addons/controls/DragControls.js';

import { scene, renderer, camera3d, camera2d, controls3D, controls2D, drawingPlane, grid } from './sceneSetup.js';
import { setupTurnEvents, groupDragObjects, dragObjects, setDrawing, currentWallGroup, initWallManager, setupTurnOvi, undoHistory, isDrawing, mouseScreenPos } from './wallManager.js';
import { tallennaJSON, lataaJSON } from './filemanager.js';
import { lisaaSuorakaide, lisaaSylinteri, lisaaPortaat} from './objectManager.js';
import { lataaPohjakuva, asetaOpasiteetti, asetaLeveys, asetaKorkeus, toggleLukitus, onkoLukittu, onkoPohjakuva, initImageManager, startKalibrointi, initKalibrointiNapit } from './imageManager.js';
import { aktivoiMaster, deaktivoiMaster } from './dragAll.js';
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
    groupDragControls
    
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
        aktivoiMaster(groupDragObjects, groupDragControls);
        
        // Pakotetaan käyttöliittymä oikeaan tilaan
        setDrawing(false);
        enableBtn();
    } else {
        // Poista master-tila
        deaktivoiMaster(groupDragObjects, groupDragControls);
        
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

    const undoWrap = document.getElementById("undo-wrap");
    const showUndoModes = ['piirtotila', 'ikkunatila', 'ovitila'];

    const suorakaide = document.getElementById('btnSuorakaide');
    const sylinteri = document.getElementById('btnSylinteri');
    const portaat = document.getElementById('btnPortaat');
    const modalOK = document.getElementById('modalOK');
    const modalPeruuta = document.getElementById('modalPeruuta');

    const pohjakuva = document.getElementById('lataaPohjakuvatiedosto');
    const opasiteetti = document.getElementById('sliderOpasiteetti');
    const inputLeveys = document.getElementById('inputLeveys');
    const inputKorkeus = document.getElementById('inputKorkeus');
    const lukitse = document.getElementById('btnLukitsePohjakuva');
    const btnKalibroi = document.getElementById('btnKalibroi');

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
        document.getElementById('primitiiviModal').style.display = 'block';
    });

    sylinteri.addEventListener('click', () => {
        modalTyyppi = 'sylinteri';
        document.getElementById('modalOtsikko').textContent = 'Lisää sylinteri';
        document.getElementById('suorakaideKentat').style.display = 'none';
        document.getElementById('sylinteriKentat').style.display = 'block';
        document.getElementById('portaatKentat').style.display = 'none';
        document.getElementById('primitiiviModal').style.display = 'block';
    });

    portaat.addEventListener('click', () => {
        modalTyyppi = 'portaat';
        document.getElementById('pNimi').parentElement.style.display = 'none';
        document.getElementById('modalOtsikko').textContent = 'Lisää portaat';
        document.getElementById('suorakaideKentat').style.display = 'none';
        document.getElementById('sylinteriKentat').style.display = 'none';
        document.getElementById('portaatKentat').style.display = 'block';
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
        document.getElementById('primitiiviModal').style.display = 'none';
    });

    modalPeruuta.addEventListener('click', () => {
        document.getElementById('primitiiviModal').style.display = 'none';
    });

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
                           (groupDragControls.objects[0].name === "ALUEVALINTA_RYHMA" || 
                            groupDragControls.objects[0].name === "MASTER_SYSTEM");

    if (onkoAlueValittu) {
        console.log("Aluevalinta aktiivinen, ohitetaan nollaus.");
        return; 
    }


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
            
            event.object.position.x = Math.round(event.object.position.x * 8) / 8;
            event.object.position.z = Math.round(event.object.position.z * 8) / 8;
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


    const muokkaaKaikkiaCheckbox = document.getElementById("liikutaKaikkia");

    
    if (muokkaaKaikkiaCheckbox) {
    muokkaaKaikkiaCheckbox.onchange = (event) => {
        event.stopImmediatePropagation();
        
        const siirtelyRadio = document.getElementById("siirtelytila");

        if (event.target.checked) {
            // Varmistetaan että siirtelytila on päällä radiossa
            if (siirtelyRadio) siirtelyRadio.checked = true;
            
            // jotta ei tulisi bugia kun piirto tilassa painetaan "liikuta kaikkia"
            paivitaTila();

            // Aktivoidaan master-ryhmä
            aktivoiMaster(groupDragObjects, groupDragControls);
            
            // Pakotetaan kontrollit päälle HETI
            if (dragControls) dragControls.enabled = true;
            if (groupDragControls) {
                groupDragControls.enabled = true;
                groupDragControls.objects = [masterGroup]; 
            }
            
            if (typeof setDrawing === 'function') setDrawing(false);
            console.log("Master-liikutus aktivoitu.");
        } else {
            // tapahtuu kun rasti otetaan pois
            deaktivoiMaster(groupDragObjects, groupDragControls);
            paivitaRaahaus(); 
            console.log("Master-liikutus poistettu.");
        }
    };
    } else {
        // ylimmälle if-lauseelle (jos elementtiä ei ole HTML:ssä)
        console.error("VIRHE: Elementtiä 'muokkaaKaikkia' ei löydy HTML-koodista!");
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