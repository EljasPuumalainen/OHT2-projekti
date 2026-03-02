import * as THREE from 'three';

import { DragControls } from 'three/addons/controls/DragControls.js';
import { setupInputHandlers } from './inputHandler';
import { scene, renderer, camera3d, camera2d, controls3D, controls2D, drawingPlane, grid, grid2 } from './sceneSetup.js';

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

//Lista objekteille, jota voi siirrellä
const dragObjects = []

//lista ryhmille 
const groupDragObjects = [];
let groupDragControls

function lisaaSeina() {
    //Seinän mitat 5m pitkä, 2.5m korkea, 0.2m leveä
    const geometry = new THREE.BoxGeometry( 5, 2.5, 0.2 );
    geometry.translate(0, 1.25, 0)
    const material = new THREE.MeshStandardMaterial( { color: 0xf0f0f0 } );
    const cube = new THREE.Mesh( geometry, material );
    cube.position.y = 0;

    //Lisätään luotu objekti listaan ja sceneen
    dragObjects.push(cube);
    scene.add( cube );
}

//Nappi lisää seiniä
//Toimii vielä siten, että nappi lisää aina saman kokoisen seinän
buttonPiirra.addEventListener("click", () => {
    lisaaSeina()
})

let dragControls = new DragControls(dragObjects, activeCamera, renderer.domElement);
dragControls.transformGroup = true; // Lisää tämä rivi kaikkialle missä luot dragControlsit
paivitaRaahaus()

//Piirto toiminnot
let isDrawing = false;
let currentWall = null;
let startPoint = new THREE.Vector3();

window.addEventListener("mousedown", (event) => {
    if (!isDrawing || event.button !== 0)
        return;

    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    )

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, activeCamera);
    const intersects = raycaster.intersectObject(drawingPlane)

    if (intersects.length > 0) {
        isDrawing = true;
        startPoint.x = Math.round(intersects[0].point.x * 2) / 2;
        startPoint.z = Math.round(intersects[0].point.z * 2) / 2;
        startPoint.y = 0;

        const geometry = new THREE.BoxGeometry(0.2, 2.5, 1);
        geometry.translate(0, 1.25, 0.5);

        const material = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })
        currentWall = new THREE.Mesh(geometry, material)

        currentWall.position.copy(startPoint);
        scene.add(currentWall);

        controls2D.enabled = false;
    }
});
    
window.addEventListener("mousemove", (event) => {
    if (!isDrawing || !currentWall)
        return;

    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, activeCamera);
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

        currentWall.scale.z = distance;
        currentWall.rotation.y = angle;
    }
})

window.addEventListener("mouseup", (event) => {
    if (event.button === 0 && isDrawing) {
        //Jos seinä on alle 1m, sitä ei lisätä
        if (currentWall.scale.z > 1) {
            dragObjects.push(currentWall);
            currentWall = null;
        } else {
            scene.remove(currentWall)
            currentWall = null;
        }

        controls2D.enabled = true;
    }
})

setupTurnEvents();

function setupTurnEvents() {
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
            raycaster.setFromCamera(mouse, activeCamera);

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

    if (siirtelyRadio.checked) {
        dragControls.enabled = true;
        isDrawing = false;
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
        isDrawing = false;
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
        isDrawing = true;
        disableBtn();


        if (activeCamera !== camera2d) {
            activeCamera = camera2d;
            buttonCamera.textContent = "Vaihda 3D";
            controls2D.enabled = true;
            controls3D.enabled = false;
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const siirtely = document.getElementById("siirtelytila");
    const katselu = document.getElementById("katselutila");
    const piirto = document.getElementById("piirtotila");


    if (siirtely) siirtely.addEventListener("change", paivitaTila);
    
    if (katselu) katselu.addEventListener("change", paivitaTila);

    if (piirto) piirto.addEventListener("change", paivitaTila);

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

    controls3D.update()
    controls2D.update()
    renderer.render( scene, activeCamera );
}

//Testaus funktiolle, joka muuntaa seinät jsoniksi
function tallennaSeinatJSON(){
    //Kerätään uuteen taulukkoon vain tarvittava seinien data
    const seinaData = dragObjects.map((cube, index) => {
        return {
            id: index,
            location: {
                x: cube.position.x,
                y: cube.position.y,
                z: cube.position.z
            },
            rotation: {
                y: cube.rotation.y
            },
            dimensions: {
                width: cube.geometry.parameters.width,
                height: cube.geometry.parameters.height,
                depth: cube.geometry.parameters.depth
            }
        };
    });
    //Taulukko tekstimuotoon JSON
    const jsonString = JSON.stringify(seinaData, null, 2);

    //Tulostetaan konsoliin JSON tallenne, jos toimii
    console.log("--------------- JSON TALLENNE ---------------");
    console.log(jsonString);
    console.log("---------------------------------------------");
}
//Luodaan kuuntelija 's' näppäimelle
window.addEventListener('keydown', (e) => {
    if (e.key === 's' || e.key === 'S'){
        tallennaSeinatJSON();
    }
});

animate();