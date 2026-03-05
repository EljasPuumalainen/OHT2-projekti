import * as THREE from 'three';
import { scene, renderer, camera3d, camera2d, controls3D, controls2D, drawingPlane, grid, grid2 } from './sceneSetup.js';
import { paivitaRaahaus } from './main.js';

export const dragObjects = [] 
export const groupDragObjects = [];

export function lisaaIkkuna(kohdeRyhma = null, zPos = 0.5) {
    // Jos kohderyhmää ei anneta, luodaan uusi (nappia varten)
    const isUusiIkkuna = !kohdeRyhma;
    const isäntä = kohdeRyhma || new THREE.Group();
    
    const ikkunaElementit = new THREE.Group(); // Pidetään ikkunan osat omana nippunaan ryhmän sisällä
    const material = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
    
    const pituus = 1.0;
    const paksuus = 0.3;
    const korkeus = 0.9;

    // 1. Geometriat
    const ikkunaAla = new THREE.Mesh(new THREE.BoxGeometry(paksuus, korkeus, pituus), material);
    ikkunaAla.position.y = korkeus / 2;
    
    const ikkunaYla = new THREE.Mesh(new THREE.BoxGeometry(paksuus, korkeus, pituus), material);
    ikkunaYla.position.y = 0.9 + 0.7 + (korkeus / 2);
    
    // 2. 2D-viivat
    const viivaGeo = new THREE.BoxGeometry(0.02, 0.02, pituus + 0.02);
    const viivaMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const v1 = new THREE.Mesh(viivaGeo, viivaMat);
    const v2 = new THREE.Mesh(viivaGeo, viivaMat);
    const v3 = new THREE.Mesh(viivaGeo, viivaMat);

    v1.position.set(0.1, 2.5, 0);
    v2.position.set(0, 2.5, 0);
    v3.position.set(-0.1, 2.5, 0);
    
    ikkunaElementit.add(v1, v2, v3, ikkunaAla, ikkunaYla);
    
    // 3. Sijoittelu ryhmän sisällä
    ikkunaElementit.position.z = zPos;
    ikkunaElementit.userData.tyyppi = "ikkuna"; // Merkataan, jotta tunnistetaan myöhemmin

    isäntä.add(ikkunaElementit);

    // Jos tämä oli uusi itsenäinen ikkuna (nappulan painallus)
    if (isUusiIkkuna) {
        groupDragObjects.push(isäntä);
        scene.add(isäntä);
        paivitaRaahaus();
    }
}

export function setupTurnEvents(getCamera) {
    let isRotating = false;
    let selectedObject = null;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener("mousedown", function(event) {
        const siirtelyRadio = document.getElementById("siirtelytila");
        if (!siirtelyRadio || !siirtelyRadio.checked)
            return;
        
        if (event.button == 2) {

            //Laskee hiiren sijainnin
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            //Päivitetään raycaster kameran ja hiiren mukaan
            raycaster.setFromCamera(mouse, getCamera());

            //Tarkistus osuuko säde johonkin objektiin
            const intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
                let hitObject = intersects[0].object;

                if (hitObject === grid || hitObject === grid2 || hitObject === drawingPlane)
                    return
                // Jos seinä kuuluu ryhmään, valitaan koko ryhmä käännettäväksi
                if (hitObject.parent && hitObject.parent.type === 'Group') {
                    selectedObject = hitObject.parent;
                } else {
                    selectedObject = hitObject;
                }

                isRotating = true;
                controls3D.enabled = false;
                controls2D.enablePan = false;
            }
        }
    })

    window.addEventListener("mousemove", function(event) {
        const siirtelyRadio = document.getElementById("siirtelytila");
        if (!siirtelyRadio || !siirtelyRadio.checked)
            return;

        if (isRotating && selectedObject) {
            selectedObject.rotation.y += event.movementX * 0.005;
        
            selectedObject.rotation.x = 0;
            selectedObject.rotation.z = 0;
        }
    })

    window.addEventListener("mouseup", function(event) {
        if (event.button == 2 && isRotating) {
            const step = 5 * (Math.PI / 180);
            if (selectedObject) {
                selectedObject.rotation.y = Math.round(selectedObject.rotation.y / step) * step;
            }

            isRotating = false;
            controls3D.enabled = true;
            controls2D.enablePan = true;
            selectedObject = null;
        }
    })
}