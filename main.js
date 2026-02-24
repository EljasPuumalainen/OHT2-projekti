import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

import { setupInputHandlers } from './inputHandler';



const scene = new THREE.Scene();
const camera3d = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const aspect = window.innerWidth / window.innerHeight;
const zoom = 10; //Isompi luku = näkyy enemmän aluetta

//TODO:
//*Tätä varmaan pitää vielä säätää, jos muutetaan grid säädettäväksi
const camera2d = new THREE.OrthographicCamera(
    -zoom * aspect, //Vasen
    zoom * aspect,  //Oikea
    zoom,           //Ylä
    -zoom,          //Ala
    1, 1000
);
camera2d.position.set(0,50,0); //Keskellä 50, asettaa kameran gridin keskelle 100/2=50
camera2d.lookAt(0,0,0);

//TODO:
//*Tätä varmaan pitää vielä säätää, jos muutetaan grid säädettäväksi
camera3d.position.set(10, 10, 10); //Tässä kaikkien täytyy olla > 0, muuten kontrollit menee jumiin, eikä kameraa voi liikuttaa.

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x2F2F2F, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls3D = new OrbitControls(camera3d, renderer.domElement);
controls3D.target.set(0,0,0);
controls3D.maxPolarAngle = Math.PI / 2.5;
controls3D.update()

//2D Kameran liikutus 
//Vasen nappi pohjassa = liikutus
//Rulla zoom
//Oikea nappi kääntö estetty, siirtää vain objekteja
const controls2D = new OrbitControls(camera2d, renderer.domElement);
controls2D.enableRotate = false;
controls2D.enabled = false;
controls2D.update()

//Valot
//Yleisvalo
const ambientLight = new THREE.AmbientLight(0xffffff, 2)
scene.add(ambientLight);
//Suuntavalo luo 3D-efektin objektille
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

//TODO: Säädettävä grid?
//Kaksi erillistä gridiä, ensimmäinen koko alue tummemmat viivat ja toinen grid jakaa 4x4 alueisiin vaaleammilla viivoilla
//100 x 100 m grid 1 ruutu = 1 metri
const grid = new THREE.GridHelper(100, 100, 0x666666, 0x666666);
scene.add( grid );
const grid2 = new THREE.GridHelper(100, 20, 0xbbbbbb, 0xbbbbbb);
scene.add( grid2 );

const buttonCamera = document.getElementById("buttonCamera");

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

const planeGeo = new THREE.PlaneGeometry(100, 100);
const planeMat = new THREE.MeshBasicMaterial({ visible: false })
const drawingPlane = new THREE.Mesh(planeGeo, planeMat);
drawingPlane.rotation.x = -Math.PI / 2;
scene.add(drawingPlane);
//TODO: Seinien piirtäminen

let isDrawing = false;
let currentWall = null;
let startPoint = new THREE.Vector3();

/*
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
        startPoint.copy(intersects[0].point);

        const geometry = new THREE.BoxGeometry(0.2, 2.5, 1);
        geometry.translate(0, 1.25, 0.5);

        const material = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })
        currentWall = new THREE.Mesh(geometry, material)

        currentWall.position.copy(startPoint);
        scene.add(currentWall);

        controls2D.enabled = false;
    }
*/

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
        startPoint.copy(intersects[0].point);

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
    }
})
/*
//Objektien raahaus
function paivitaRaahaus() {
    dragControls.addEventListener("dragstart", function(event) {
        controls2D.enabled = false;
        controls3D.enabled = false;
    });

    dragControls.addEventListener("drag", function(event) {
        event.object.position.y = 0;
        //10 cm snapping
        event.object.position.x = Math.round(event.object.position.x * 10) / 10;
        event.object.position.z = Math.round(event.object.position.z * 10) / 10;
    });

    dragControls.addEventListener("dragend", function(event) {
        if (activeCamera === camera2d) controls2D.enabled = true;
        else controls3D.enabled = true;
    });
}*/
setupTurnEvents();

function setupTurnEvents() {
    let isRotating = false;
    let selectedObject = null;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener("mousedown", function(event) {
        if (event.button == 2) {

            //Laskee hiiren sijainnin
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            //Päivitetään raycaster kameran ja hiiren mukaan
            raycaster.setFromCamera(mouse, activeCamera);

            //Tarkistus osuuko säde johonkin objektiin
            const intersects = raycaster.intersectObjects(dragObjects);
            if (intersects.length > 0) {
                selectedObject = intersects[0].object; //Valitaan ensimmäinen osuva objekti (lähimpänä oleva)
                isRotating = true;
                //Lukitaan kameran liikutus käännön ajaksi
                controls3D.enabled = false;
                controls2D.enablePan = false;
            }
        }
    })

    window.addEventListener("mousemove", function(event) {
        if (isRotating && selectedObject) {
            selectedObject.rotation.y += event.movementX * 0.005;
        
            selectedObject.rotation.x = 0;
            selectedObject.rotation.z = 0;
        }
    })

    window.addEventListener("mouseup", function(event) {
        if (event.button == 2 && isRotating) {
            //TODO:
            //*22.5 asteen lukitus
            //*Tätä pitää vielä miettiä, jos ovet ym. tehdään sillä tavalla että seinään tehdään reikä, niin silloon pienempi astelukitus
            //*on varmaankin turha, jos taas ovi tehdään eri tavalla sitten varmaankin tarvitaan pienempi aste
            const step = 22.5 * (Math.PI / 180);
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

        if (dragControls) {
                dragControls.dispose();
            }
            
            dragControls = new DragControls(dragObjects, activeCamera, renderer.domElement);
            paivitaRaahaus();
    }

    if (katseluRadio.checked) {
        dragControls.enabled = false;
        isDrawing = false;
        enableBtn();
    }

    if (piirtoRadio.checked) {
        dragControls.enabled = false;
        isDrawing = true;
        disableBtn();


        if (activeCamera !== camera2d) {
            activeCamera = camera2d;
            buttonCamera.textContent = "Vaihda 3D";
            controls2D.enabled = false;
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
            event.object.position.x = Math.round(event.object.position.x * 10) / 10;
            event.object.position.z = Math.round(event.object.position.z * 10) / 10;
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