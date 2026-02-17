import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';


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
controls2D.update()

const buttonCamera = document.getElementById("buttonCamera");

let activeCamera = camera3d;

//Kameran vaihto nappulan toiminto
buttonCamera.addEventListener("click", () => {
    if (activeCamera === camera3d) {
        activeCamera = camera2d;
        buttonCamera.textContent = "Vaihda 3D";
    } else {
        activeCamera = camera3d;
        buttonCamera.textContent = "Vaihda 2D";
    }

    dragControls.dispose();

    dragControls = new DragControls(dragObjects, activeCamera, renderer.domElement);
    
    setupDragEvents();
})

//TODO: Säädettävä grid?
//Kaksi erillistä gridiä, ensimmäinen koko alue tummemmat viivat ja toinen grid jakaa 4x4 alueisiin vaaleammilla viivoilla
//100 x 100 m grid 1 ruutu = 1 metri
const grid = new THREE.GridHelper(100, 100, 0x666666, 0x666666);
scene.add( grid );
const grid2 = new THREE.GridHelper(100, 20, 0xbbbbbb, 0xbbbbbb);
scene.add( grid2 );

//TODO:
//*Lattia, ehkä ihan turha???
/*const planeGeo = new THREE.PlaneGeometry(20, 20);
const planeMat = new THREE.MeshBasicMaterial({color: 0x2F2F2F, side: THREE.DoubleSide})
const ground = new THREE.Mesh(planeGeo, planeMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
scene.add(ground);
*/

//Valot
//Yleisvalo
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight);
//Suuntavalo luo 3D-efektin objektille
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

const geometry = new THREE.BoxGeometry( 5, 2.5, 0.2 );
geometry.translate(0, 1.25, 0)
const material = new THREE.MeshStandardMaterial( { color: 0xcccccc } );
const cube = new THREE.Mesh( geometry, material );
cube.position.y = 0;
const cube2 = new THREE.Mesh( geometry, material );
cube2.position.y = 0;
const cube3 = new THREE.Mesh( geometry, material );
cube2.position.y = 0;

scene.add( cube, cube2, cube3 );

const dragObjects = [cube, cube2, cube3]
let dragControls = new DragControls(dragObjects, activeCamera, renderer.domElement);
setupDragEvents();

//Objektien raahaus
function setupDragEvents() {
    dragControls.addEventListener("dragstart", function(event) {
        controls3D.enabled = false;
    });

    dragControls.addEventListener("drag", function(event) {
        event.object.position.y = 0;
        // Pidetään snapping, mutta huomaa että 2D:ssä tämä voi tuntua hyppivältä
        // jos kamera on liian kaukana
        event.object.position.x = Math.round(event.object.position.x * 10) / 10;
        event.object.position.z = Math.round(event.object.position.z * 10) / 10;
    });

    dragControls.addEventListener("dragend", function(event) {
        controls3D.enabled = true;
    });
}
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

//TODO: Seinien piirtäminen

function animate() {
    requestAnimationFrame(animate);

    controls3D.update()
    controls2D.update()
    renderer.render( scene, activeCamera );
}

animate();