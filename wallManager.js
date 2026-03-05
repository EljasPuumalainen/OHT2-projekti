import * as THREE from 'three';
import { scene, renderer, camera3d, camera2d, controls3D, controls2D, drawingPlane, grid, grid2 } from './sceneSetup.js';
import { paivitaRaahaus, dragControls, groupDragControls } from './main.js';


export const dragObjects = [] 
export const groupDragObjects = [];

//Piirto toiminnot
export let isDrawing = false;
export let currentWallGroup = null;
export let startPoint = new THREE.Vector3();

export function setDrawing(val) {
    isDrawing = val
}

let getActiveCamera = null;
export function initWallManager(cameraGetter) {
    getActiveCamera = cameraGetter;
}

window.addEventListener("mousedown", (event) => {

    if (event.clientX < 300 && event.clientY < 400) {
        return;
    }

    if (!isDrawing || event.button !== 0)
        return;

    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    )

    const raycaster = new THREE.Raycaster()
    if (getActiveCamera) {
        raycaster.setFromCamera(mouse, getActiveCamera());
    }
    const intersects = raycaster.intersectObject(drawingPlane)

    if (intersects.length > 0) {
        isDrawing = true;
        startPoint.x = Math.round(intersects[0].point.x * 2) / 2;
        startPoint.z = Math.round(intersects[0].point.z * 2) / 2;
        startPoint.y = 0;

        currentWallGroup = new THREE.Group()
        currentWallGroup.position.copy(startPoint)
        scene.add(currentWallGroup)

        controls2D.enabled = false;
    }
});
    
window.addEventListener("mousemove", (event) => {
    if (!isDrawing || !currentWallGroup)
        return;

    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster()
    if (getActiveCamera) {
        raycaster.setFromCamera(mouse, getActiveCamera());
    }
    const intersects = raycaster.intersectObject(drawingPlane)

    if (intersects.length > 0) {
        const endPoint = intersects[0].point;

        endPoint.x = Math.round(endPoint.x * 2) / 2;
        endPoint.z = Math.round(endPoint.z * 2) / 2;

        const distance = startPoint.distanceTo(endPoint);
        let angle = Math.atan2(endPoint.x - startPoint.x, endPoint.z - startPoint.z);

        //2.5 Asteen lukitus piirtäessä
        const step = 2.5 * (Math.PI / 180);
        angle = Math.round(angle / step) * step;
        currentWallGroup.rotation.y = angle;

        const pituus = Math.max(0.5, Math.round(distance * 2) / 2)
        const palojenMaara = pituus / 0.5;
        

        while (currentWallGroup.children.length > 0) {
            currentWallGroup.remove(currentWallGroup.children[0])
        }

        const material = new THREE.MeshStandardMaterial({color: 0xf0f0f0})

        for (let i=0; i < palojenMaara; i++) {
            const geometry = new THREE.BoxGeometry(0.3, 2.5, 0.5);
            const pala = new THREE.Mesh(geometry, material);

            pala.position.set(0, 1.25, (i * 0.5) + 0.25)
            pala.userData.tyyppi = "seina"

            currentWallGroup.add(pala)
        }
    }
})

window.addEventListener("mouseup", (event) => {
    if (event.button === 0 && isDrawing) {
        //Jos seinä on alle 1m, sitä ei lisätä
        if (currentWallGroup && currentWallGroup.children.length >= 1) {
            groupDragObjects.push(currentWallGroup);
            paivitaRaahaus()
        } else if (currentWallGroup) {
            scene.remove(currentWallGroup)
        }
        currentWallGroup = null;
        controls2D.enabled = true;
    }
})

//Ikkunan lisäys
export const hoverBoxGeo = new THREE.BoxGeometry(0.31, 2.51, 1.01);
export const hoverBoxMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3 });
export const hoverBox = new THREE.Mesh(hoverBoxGeo, hoverBoxMat);
scene.add(hoverBox);
hoverBox.visible = false;

window.addEventListener("mousemove", (event) => {
    const ikkunaTilaPaalla = document.getElementById("ikkunatila").checked;
    
    if (ikkunaTilaPaalla) {
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        if (getActiveCamera) {
        raycaster.setFromCamera(mouse, getActiveCamera());
    }

        // Etsitään osumia kaikista seinäryhmien lapsista
        const allParts = [];
        groupDragObjects.forEach(group => allParts.push(...group.children));
        
        const intersects = raycaster.intersectObjects(allParts);

        if (intersects.length > 0) {
            const osuttuPala = intersects[0].object;
            const ryhma = osuttuPala.parent;

            // Korostetaan kaksi palaa (1 metri) kerrallaan
            // Lasketaan mihin "metriin" osuttiin
            const zPos = osuttuPala.position.z;
            const snapZ = Math.floor(zPos); // Esim. 0.25 tai 0.75 -> 0.5 keskipisteeksi

            hoverBox.visible = true;
            hoverBox.position.set(0, 1.25, snapZ + 0.5); // Asetetaan metrin pätkän keskelle
            ryhma.add(hoverBox); // Kiinnitetään hover-laatikko ryhmään, jotta se kääntyy oikein
        } else {
            hoverBox.visible = false;
        }
    } else {
        hoverBox.visible = false;
    }
});

window.addEventListener("mousedown", (event) => {
    const ikkunaTilaElement = document.getElementById("ikkunatila");
    if (!ikkunaTilaElement || !ikkunaTilaElement.checked) return;

    if (event.button === 0 ) { // Vasen klikkaus ja ei piirretä seinää
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        if (getActiveCamera) {
        raycaster.setFromCamera(mouse, getActiveCamera());
    }
        
        const intersects = raycaster.intersectObjects(groupDragObjects, true);
        
        if (intersects.length > 0) {
            const osuma = intersects.find(i => i.object.userData.tyyppi === "seina");
            // Varmistetaan, että osuttiin seinään
            if (osuma) {
                const osuttuPala = osuma.object;
                const ryhma = osuttuPala.parent;
                // Käytetään hoverBoxin sijaintia, koska se on jo laskettu nätisti metrin pätkälle
                const keskiZ = hoverBox.position.z;

                // Suodatetaan poistettavat palat (HUOM: === vertailuun)
                const poistettavat = ryhma.children.filter(child => 
                    child.userData.tyyppi === "seina" && 
                    Math.abs(child.position.z - keskiZ) < 0.6
                );

                // Jos löydettiin poistettavia paloja (eli tilaa ikkunalle)
                if (poistettavat.length > 0) {
                    poistettavat.forEach(p => ryhma.remove(p));
                    lisaaIkkuna(ryhma, keskiZ);
                }
            }
        }
    }
});

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
            if (getActiveCamera) {
                raycaster.setFromCamera(mouse, getActiveCamera());
            }

            //Tarkistus osuuko säde johonkin objektiin
            const intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
                let hitObject = intersects[0].object;

                if (hitObject === grid || hitObject === grid2 || hitObject === drawingPlane)
                    return
                // Jos seinä kuuluu ryhmään, valitaan koko ryhmä käännettäväksi
                let topObject = hitObject;
                while (topObject.parent && topObject.parent !== scene) {
                    topObject = topObject.parent;
                }
                selectedObject = topObject;

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