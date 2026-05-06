import * as THREE from 'three';
import { scene, renderer, camera3d, camera2d, controls3D, controls2D, drawingPlane, grid, gridMaterial, hoverMaterial } from './sceneSetup.js';
import { paivitaRaahaus, dragControls, groupDragControls } from './main.js';


export const dragObjects = [] 
export const groupDragObjects = [];

//Undo historia
export const undoHistory = [];

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

//Otetaan hiiren paikka talteen - käytetään reunojen scrollaamiseen seinää piirtäessä
export let mouseScreenPos = { x: 0, y: 0 };
window.addEventListener("mousemove", (event) => {
    mouseScreenPos.x = event.clientX;
    mouseScreenPos.y = event.clientY;
});

window.addEventListener("mousedown", (event) => {

    if (event.clientX < 225 && event.clientY < 625) return;
    if (!isDrawing) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    if (getActiveCamera) raycaster.setFromCamera(mouse, getActiveCamera());

    if (event.button === 2) {
        // Oikea nappi — venytys päädystä
        if (!hoverBoxPaaty.visible) return;

        const allParts = [];
        groupDragObjects.forEach(g => allParts.push(...g.children));
        const seinaIntersects = raycaster.intersectObjects(allParts, true);
        if (seinaIntersects.length === 0) return;

        let topRyhma = seinaIntersects[0].object;
        while (topRyhma.parent && !groupDragObjects.includes(topRyhma)) {
            topRyhma = topRyhma.parent;
        }
        if (!groupDragObjects.includes(topRyhma)) return;

        const pituus = topRyhma.children.reduce((yht, l) => {
            if (l.userData?.tyyppi === "seina") return yht + 0.25;
            if (l.userData?.tyyppi === "ikkuna" || l.userData?.tyyppi === "ovi") return yht + 1.0;
            return yht;
        }, 0);

        const paikallinenPiste = topRyhma.worldToLocal(seinaIntersects[0].point.clone());

        const etuPaaty = Math.abs(paikallinenPiste.z - pituus) < 0.4;
        const takaPaaty = Math.abs(paikallinenPiste.z - 0) < 0.4;

        if (!etuPaaty && !takaPaaty) return; // Jos ei kumpikaan pääty, lopeta

        if (takaPaaty) {
            // Jos tartutaan ALKUUN (Z ≈ 0):
            // 1. Lasketaan loppupisteen maailmankoordinaatit
            const loppuPosMaailmassa = topRyhma.localToWorld(new THREE.Vector3(0, 0, pituus));
            
            // 2. Käännetään ryhmä 180 astetta
            topRyhma.rotation.y += Math.PI;
            
            // 3. Siirretään ryhmä loppupisteeseen (josta tulee uusi startPoint)
            topRyhma.position.copy(loppuPosMaailmassa);
            
            // 4. Päivitetään startPoint
            startPoint.set(loppuPosMaailmassa.x, 0, loppuPosMaailmassa.z);

            // 5. Käännetään ikkunat/ovet peilikuvaksi, jotta ne pysyvät paikallaan
            topRyhma.children.forEach(l => {
                if (l.userData?.tyyppi !== "seina") {
                    const objektiPituus = (l.userData.tyyppi === "ikkuna" || l.userData.tyyppi === "ovi") ? 1.0 : 0;
                    l.position.z = pituus - l.position.z - objektiPituus;
                }
            });
        } else {
            // Jos tartutaan LOPPUUN (Z ≈ pituus):
            const maailmaPos = new THREE.Vector3();
            topRyhma.getWorldPosition(maailmaPos);
            startPoint.set(maailmaPos.x, 0, maailmaPos.z);
        }

        // --- MUUTETTU OSIO PÄÄTTYY ---

        const index = groupDragObjects.indexOf(topRyhma);
        if (index !== -1) groupDragObjects.splice(index, 1);

        currentWallGroup = topRyhma;
        controls2D.enabled = false;
        hoverBoxPaaty.visible = false;
    } else if (event.button === 0) {
        // Vasen nappi — normaali piirto
        const intersects = raycaster.intersectObject(drawingPlane);
        if (intersects.length > 0) {
            startPoint.x = Math.round(intersects[0].point.x * 8) / 8;
            startPoint.z = Math.round(intersects[0].point.z * 8) / 8;
            startPoint.y = 0;

            currentWallGroup = new THREE.Group();
            currentWallGroup.position.copy(startPoint);
            scene.add(currentWallGroup);
            controls2D.enabled = false;
        }
    }
});

window.addEventListener("mousemove", (event) => {
    if (!isDrawing || !currentWallGroup) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    if (getActiveCamera) raycaster.setFromCamera(mouse, getActiveCamera());

    const intersects = raycaster.intersectObject(drawingPlane);
    if (intersects.length > 0) {
        const rawPoint = intersects[0].point;

        let angle = Math.atan2(rawPoint.x - startPoint.x, rawPoint.z - startPoint.z);
        const step = 5 * (Math.PI / 180);
        angle = Math.round(angle / step) * step;
        currentWallGroup.rotation.y = angle;

        const endPoint = rawPoint.clone();
        endPoint.x = Math.round(endPoint.x * 4) / 4;
        endPoint.z = Math.round(endPoint.z * 4) / 4;

        const distance = startPoint.distanceTo(endPoint);
        const pituus = Math.max(0.25, Math.round(distance * 4) / 4);
        const palojenMaara = pituus / 0.25;

        const label = document.getElementById("mittausLabel");
        label.textContent = pituus.toFixed(2) + " m";
        label.style.left = event.clientX + 15 + "px";
        label.style.top = event.clientY - 20 + "px";
        label.style.display = "block";

        // Poistetaan vain seinäpalat, ikkunat/ovet säilyvät
        const vanhat = currentWallGroup.children.filter(l => l.userData?.tyyppi === "seina");
        vanhat.forEach(p => currentWallGroup.remove(p));

        // Ikkunoiden/ovien varaamat alueet
        const esteet = currentWallGroup.children
            .filter(l => l.userData?.tyyppi === "ikkuna" || l.userData?.tyyppi === "ovi")
            .map(l => ({ alku: l.position.z, loppu: l.position.z + 1.0 }));

        const material = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });

        for (let i = 0; i < palojenMaara; i++) {
            const zKeski = i * 0.25 + 0.125;
            if (esteet.some(e => zKeski >= e.alku && zKeski < e.loppu)) continue;

            const geometry = new THREE.BoxGeometry(0.25, 2.5, 0.25);
            const pala = new THREE.Mesh(geometry, material);
            pala.position.set(0, 1.25, zKeski);
            pala.userData.tyyppi = "seina";
            currentWallGroup.add(pala);
        }
    }
});

window.addEventListener("mouseup", (event) => {
    if (!isDrawing) return;

    const onVenytys = event.button === 2 && currentWallGroup && !groupDragObjects.includes(currentWallGroup);

    if (event.button === 0 || onVenytys) {
        if (currentWallGroup && document.getElementById("mittausLabel")) {
            document.getElementById("mittausLabel").style.display = "none";
        }

        if (currentWallGroup && currentWallGroup.children.length >= 1) {
            groupDragObjects.push(currentWallGroup);
            undoHistory.push({ type: "seina", object: currentWallGroup });
            paivitaRaahaus();
        } else if (currentWallGroup) {
            scene.remove(currentWallGroup);
        }

        currentWallGroup = null;
        controls2D.enabled = true;
    }
});

//Korostus toiminnot
export const hoverBoxGeo = new THREE.BoxGeometry(0.26, 2.51, 1);
export const hoverBoxMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3 });
export const hoverBox = new THREE.Mesh(hoverBoxGeo, hoverBoxMat);

scene.add(hoverBox);
hoverBox.visible = false;

const hoverBoxSeinaGeo = new THREE.BoxGeometry(0.26, 2.51, 1); 
const hoverBoxSeinaMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3 });
export const hoverBoxSeina = new THREE.Mesh(hoverBoxSeinaGeo, hoverBoxSeinaMat);
hoverBoxSeina.visible = false;

const hoverBoxPaatyGeo = new THREE.BoxGeometry(0.26, 2.55, 0.5);
const hoverBoxPaatyMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.5 });
export const hoverBoxPaaty = new THREE.Mesh(hoverBoxPaatyGeo, hoverBoxPaatyMat);
hoverBoxPaaty.visible = false;
scene.add(hoverBoxPaaty);

window.addEventListener("mousemove", (event) => {
    const ikkunaTilaPaalla = document.getElementById("ikkunatila").checked;
    const oviTilaPaalla = document.getElementById("ovitila").checked;
    const siirtelyTilaPaalla = document.getElementById("siirtelytila").checked;
    const liikutaKaikkia = document.getElementById("liikutaKaikkia").checked;
    const piirtoTilaPaalla = document.getElementById("piirtotila").checked;

    hoverBox.visible = false;
    hoverBoxSeina.visible = false;
    hoverBoxPaaty.visible = false;
    
    if (ikkunaTilaPaalla || oviTilaPaalla || siirtelyTilaPaalla) {
      
        if (liikutaKaikkia) return;
      
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        if (getActiveCamera) {
            raycaster.setFromCamera(mouse, getActiveCamera());
        }

        hoverBox.raycast = () => null;
        hoverBoxSeina.raycast = () => null;

        const allParts = [];
        groupDragObjects.forEach(group => allParts.push(...group.children));
        
        const intersects = raycaster.intersectObjects(allParts);

        if (intersects.length > 0) {
            const ryhma = intersects[0].object.parent;

            if (siirtelyTilaPaalla) {
                const seinaPalat = ryhma.children.filter(lapsi => lapsi.userData && (
                    lapsi.userData.tyyppi === "seina" ||
                    lapsi.userData.tyyppi === "ikkuna" ||
                    lapsi.userData.tyyppi === "ovi"
                ));
                
                const seinanPituus = seinaPalat.reduce((yht, lapsi) => {
                    if (lapsi.userData.tyyppi === "seina") return yht + 0.25;
                    return yht + 1.0;
                }, 0);

                hoverBoxSeina.scale.z = seinanPituus;
                hoverBoxSeina.visible = true;
                hoverBoxSeina.position.z = seinanPituus / 2;
                hoverBoxSeina.position.y = 1.25;
                hoverBoxSeina.position.x = 0;
                hoverBoxSeina.renderOrder = 999;

                if (hoverBoxSeina.parent !== ryhma) {
                    ryhma.add(hoverBoxSeina);
                }

            } else if (ikkunaTilaPaalla || oviTilaPaalla) {
                const maailmaPiste = intersects[0].point;
                const paikallinenPiste = ryhma.worldToLocal(maailmaPiste.clone());
                const zPos = paikallinenPiste.z;
                const uusiPosz = Math.round(zPos * 4) / 4;

                hoverBox.visible = true;
                hoverBox.position.z = uusiPosz;
                hoverBox.position.y = 1.25;
                hoverBox.position.x = 0;
                hoverBox.renderOrder = 999;

                ryhma.add(hoverBox);
            }
        }

        if (event.buttons === 1 && siirtelyTilaPaalla) {
            hoverBoxSeina.visible = (hoverBoxSeina.parent !== null); 
        }
    }

    // Päädyn korostus, toimii piirtotilassa
    if (piirtoTilaPaalla) {
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        if (getActiveCamera) raycaster.setFromCamera(mouse, getActiveCamera());

        const allParts2 = [];
        groupDragObjects.forEach(g => allParts2.push(...g.children));
        const paatyIntersects = raycaster.intersectObjects(allParts2, true);

        if (paatyIntersects.length > 0) {
            let topRyhma = paatyIntersects[0].object;
            while (topRyhma.parent && !groupDragObjects.includes(topRyhma)) {
                topRyhma = topRyhma.parent;
            }
            if (groupDragObjects.includes(topRyhma)) {
                const pituus = topRyhma.children.reduce((yht, l) => {
                    if (l.userData?.tyyppi === "seina") return yht + 0.25;
                    if (l.userData?.tyyppi === "ikkuna" || l.userData?.tyyppi === "ovi") return yht + 1.0;
                    return yht;
                }, 0);
                const paikallinenPiste = topRyhma.worldToLocal(paatyIntersects[0].point.clone());
                if (Math.abs(paikallinenPiste.z - pituus) < 0.4) {
                    hoverBoxPaaty.visible = true;
                    hoverBoxPaaty.position.copy(topRyhma.localToWorld(new THREE.Vector3(0, 1.25, pituus + 0.25)));
                    hoverBoxPaaty.rotation.copy(topRyhma.rotation);
                } else if (Math.abs(paikallinenPiste.z - 0) < 0.4) {
                    hoverBoxPaaty.visible = true;
                    hoverBoxPaaty.position.copy(topRyhma.localToWorld(new THREE.Vector3(0, 1.25, 0 - 0.25)));
                    hoverBoxPaaty.rotation.copy(topRyhma.rotation);
                }
            }
        }

        const taso = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const kohta = new THREE.Vector3();
        raycaster.ray.intersectPlane(taso, kohta);

        if (kohta) {
            const gridSize = hoverMaterial.uniforms.uGridSize.value;
            hoverMaterial.uniforms.uHoverPos.value.set(
                Math.floor(kohta.x / gridSize),
                Math.floor(kohta.z / gridSize)
            );
            hoverMaterial.uniforms.uHoverActive.value = true;
        } else {
            if (hoverMaterial) hoverMaterial.uniforms.uHoverActive.value = false;
        }
    } else {
        if (hoverMaterial) {
            hoverMaterial.uniforms.uHoverActive.value = false;
        }
    }
});

//Ikkunan lisäys toiminnot
window.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;

    const ikkunaRadio = document.getElementById("ikkunatila");
    const oviRadio = document.getElementById("ovitila");

    if (!ikkunaRadio?.checked && !oviRadio?.checked) return;

    // Tarkista osuuko klikki olemassa olevaan ikkunaan/oveen
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    if (getActiveCamera) raycaster.setFromCamera(mouse, getActiveCamera());

    const allParts = [];
    groupDragObjects.forEach(group => allParts.push(...group.children));
    const intersects = raycaster.intersectObjects(allParts, true);

    if (intersects.length > 0) {
        let kohde = intersects[0].object;
        let elementti = null;
        while (kohde && kohde !== scene) {
            if (kohde.userData?.tyyppi === "ikkuna" || kohde.userData?.tyyppi === "ovi") {
                elementti = kohde;
                break;
            }
            kohde = kohde.parent;
        }

        if (elementti) {
            const ryhma = elementti.parent;
            const keskiZ = elementti.position.z;

            ryhma.remove(elementti);

            const material = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
            for (let i = 0; i < 2; i++) {
                const geo = new THREE.BoxGeometry(0.25, 2.5, 0.5);
                const pala = new THREE.Mesh(geo, material);
                pala.position.set(0, 1.25, keskiZ - 0.25 + i * 0.5);
                pala.userData.tyyppi = "seina";
                ryhma.add(pala);
            }

            undoHistory.push({ type: "palautus", ryhma, elementti, keskiZ });
            return;
        }
    }

    // Alkuperäinen logiikka — lisää ikkuna tai ovi
    if (!hoverBox.visible) return;

    const ryhma = hoverBox.parent;
    const keskiZ = hoverBox.position.z;

    if (ryhma) {

        const ovenAlku = hoverBox.position.z - 0.5;
        const poistettavat = ryhma.children.filter(child =>
            child.userData.tyyppi === "seina" &&
            child.position.z >= ovenAlku - 0.01 &&
            child.position.z <= ovenAlku + 1.0 + 0.01
        );

        if (poistettavat.length > 0) {
            poistettavat.forEach(p => ryhma.remove(p));

            if (ikkunaRadio.checked) {
                lisaaIkkuna(ryhma, keskiZ);
                undoHistory.push({ type: "ikkuna", ryhma, keskiZ: ovenAlku, poistettavat });
            } else if (oviRadio.checked) {
                lisaaOvi(ryhma, keskiZ);
                undoHistory.push({ type: "ovi", ryhma, keskiZ: ovenAlku, poistettavat });
            }

            hoverBox.visible = false;
        } else {
            console.warn("Ei seinäpaloja kohdalla!", {
                etsittyKeskiZ: keskiZ,
                ryhmanLapsia: ryhma.children.length
            });
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
    const paksuus = 0.25;
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

export function lisaaOvi(kohdeRyhma, zPos) {
    const isUusiOvi = !kohdeRyhma;
    const isäntä = kohdeRyhma || new THREE.Group();

    const oviElementit = new THREE.Group()

    // 1/4 Ympyrä
    const geometry = new THREE.CircleGeometry(1, 64, 0, Math.PI / 2)
    const material = new THREE.MeshStandardMaterial({ color: 0xa0a0a0, side: THREE.DoubleSide })
    const circle = new THREE.Mesh(geometry, material)
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(0.1, 0.01, 0.5)

    const ylapalaGeo = new THREE.BoxGeometry(0.25, 0.4, 1.0);
    const ylapalaMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
    const ylapala = new THREE.Mesh(ylapalaGeo, ylapalaMat);
    ylapala.position.y = 2.3;

    const alapalaGeo = new THREE.BoxGeometry(0.25, 0.01, 1.0);
    const alapalaMat = new THREE.MeshStandardMaterial({ color: 0xa0a0a0 });
    const alapala = new THREE.Mesh(alapalaGeo, alapalaMat);
    alapala.position.set(0, 0.005, 0)

    oviElementit.add(circle, ylapala, alapala)

    oviElementit.position.z = zPos;
    oviElementit.userData.tyyppi = "ovi"

    isäntä.add(oviElementit);

    if (isUusiOvi) {
        scene.add(isäntä)
        paivitaRaahaus()
    }
}

export function setupTurnOvi(getCamera) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    window.addEventListener("mousedown", function(event) {
        const oviRadio = this.document.getElementById("ovitila");

        if (!oviRadio || !oviRadio.checked)
            return;

        if (event.button == 2) {

            //Laskee hiiren sijainnin
            const rect = renderer.domElement.getBoundingClientRect();

            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            //Päivitetään raycaster kameran ja hiiren mukaan
            if (getActiveCamera) {
                raycaster.setFromCamera(mouse, getActiveCamera());
            }

            const intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
                let hitObject = intersects[0].object;

                // Etsitään klikatusta objektista tai sen vanhemmista se, jolla on tyyppi "ovi"
                let oviElementti = null;
                let tarkistettava = hitObject;
                
                // "Kiivetään" ylöspäin vain osumasta, kunnes löytyy ovi tai tullaan sceneen asti
                while (tarkistettava && tarkistettava !== scene) {
                    if (tarkistettava.userData && tarkistettava.userData.tyyppi === "ovi") {
                        oviElementti = tarkistettava;
                        break;
                    }
                    tarkistettava = tarkistettava.parent;
                }

                


                if (oviElementti) {

                    if (oviElementti.userData.asento === undefined) {
                        oviElementti.userData.asento = 0;
                    }

                    oviElementti.userData.asento = (oviElementti.userData.asento + 1) % 4;

                    switch (oviElementti.userData.asento) {
                        case 0:
                            // Perusasento (Vasen, Puoli A)
                            oviElementti.rotation.y = 0;
                            oviElementti.scale.z = 1;
                            break;
                        case 1:
                            // Kätisyyden vaihto (Vasen, Puoli B)
                            oviElementti.rotation.y = 0;
                            oviElementti.scale.z = -1;
                            break;
                        case 2:
                            // Puolen vaihto (Oikea, Puoli B)
                            oviElementti.rotation.y = Math.PI; 
                            oviElementti.scale.z = -1;
                            break;
                        case 3:
                            // Kätisyyden vaihto (Oikea), Puoli A)
                            oviElementti.rotation.y = Math.PI;
                            oviElementti.scale.z = 1;
                            break;
                    }
                }
            }
        }
    })
}

export function setupTurnEvents(getCamera) {
    let isRotating = false;
    let selectedObject = null;
    let currentRotationY = 0;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener("mousedown", function(event) {

        console.log('=== TURN mousedown ===', 'button:', event.button,
        'controls2D.enabled:', controls2D.enabled,
        'controls3D.enabled:', controls3D.enabled);
        const siirtelyRadio = document.getElementById("siirtelytila");

        if (!siirtelyRadio || !siirtelyRadio.checked)
            return;
        
        if (event.button == 2) {

            //Laskee hiiren sijainnin
            const rect = renderer.domElement.getBoundingClientRect();

            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            //Päivitetään raycaster kameran ja hiiren mukaan
            if (getActiveCamera) {
                raycaster.setFromCamera(mouse, getActiveCamera());
            }

            //Tarkistus osuuko säde johonkin objektiin
            const intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
                let hitObject = intersects[0].object;

                if (hitObject === grid || hitObject === drawingPlane)
                    return
                // Jos seinä kuuluu ryhmään, valitaan koko ryhmä käännettäväksi
                let topObject = hitObject;
                while (topObject.parent && topObject.parent !== scene) {
                    topObject = topObject.parent;
                }

                if (siirtelyRadio.checked) {

                    if (topObject.userData.tyyppi === 'pohjakuva') return;

                    selectedObject = topObject;
                    currentRotationY = selectedObject.rotation.y;
                    isRotating = true;
                    controls3D.enabled = false;
                    controls2D.enablePan = false;
                }
            }
        }
    })

    window.addEventListener("mousemove", function(event) {
        const siirtelyRadio = document.getElementById("siirtelytila");
        if (!siirtelyRadio || !siirtelyRadio.checked)
            return;

        if (isRotating && selectedObject) {
            currentRotationY += event.movementX * 0.005; // <-- päivitetään muuttujaa
            selectedObject.rotation.y = currentRotationY; // <-- asetetaan suoraan
            selectedObject.rotation.x = 0;
            selectedObject.rotation.z = 0;
        }
    })

    window.addEventListener("mouseup", function(event) {

        console.log('=== TURN mouseup ===', 'button:', event.button,
        'isRotating:', isRotating,
        'controls2D.enabled:', controls2D.enabled);
        if (event.button == 2 && isRotating) {
            const step = 5 * (Math.PI / 180);
            if (selectedObject) {
                currentRotationY = Math.round(currentRotationY / step) * step; // <-- pyöristetään muuttuja
                selectedObject.rotation.y = currentRotationY;
            }

            isRotating = false;
            selectedObject = null;

            controls3D.enabled = true;
            controls2D.enablePan = true;
            controls2D.enabled = true;
        }
    })
}