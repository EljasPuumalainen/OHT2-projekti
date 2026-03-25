import * as THREE from 'three';
import { scene, renderer, camera3d, camera2d, controls3D, controls2D, drawingPlane, grid, grid2 } from './sceneSetup.js';
import { paivitaRaahaus, dragControls, groupDragControls } from './main.js';
import { distance } from 'three/tsl';


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

    if (event.clientX < 200 && event.clientY < 500) {
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
        const rawPoint = intersects[0].point;

        let angle = Math.atan2(rawPoint.x - startPoint.x, rawPoint.z - startPoint.z);

        //2.5 Asteen lukitus piirtäessä
        const step = 2.5 * (Math.PI / 180);
        angle = Math.round(angle / step) * step;
        currentWallGroup.rotation.y = angle;
        
        const endPoint = rawPoint.clone()
        endPoint.x = Math.round(endPoint.x * 2) / 2;
        endPoint.z = Math.round(endPoint.z * 2) / 2;

        const distance = startPoint.distanceTo(endPoint);
    
        const pituus = Math.max(0.5, Math.round(distance * 2) / 2)
        const palojenMaara = pituus / 0.5;

        // Lisää pituuselementin seinää piirtäessä
        const label = document.getElementById("mittausLabel");
        label.textContent = pituus.toFixed(1) + " m";
        label.style.left = event.clientX + 15 + "px";
        label.style.top = event.clientY - 20 + "px";
        label.style.display = "block";

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

            if (i === 0 || i === palojenMaara - 1) {
                const tolppaGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 16);
                const tolppa = new THREE.Mesh(tolppaGeo, material);
        
                // Jos i=0, tolppa on seinän alussa. Jos i=loppu, tolppa on seinän lopussa.
                const zPos = (i === 0) ? (i * 0.5) : (i * 0.5) + 0.5;
                tolppa.position.set(0, 1.25, zPos);
                
                currentWallGroup.add(tolppa);
            }
        }
    }
})

window.addEventListener("mouseup", (event) => {
    if (event.button === 0 && isDrawing) {

        if (currentWallGroup && document.getElementById("mittausLabel")) {
            document.getElementById("mittausLabel").style.display = "none"
        }

        //Jos seinä on alle 1m, sitä ei lisätä
        if (currentWallGroup && currentWallGroup.children.length >= 1) {
            groupDragObjects.push(currentWallGroup);
            undoHistory.push({ type: "seina", object: currentWallGroup });
            paivitaRaahaus()
        } else if (currentWallGroup) {
            scene.remove(currentWallGroup)
        }
        currentWallGroup = null;
        controls2D.enabled = true;
    }
})

//Korostus toiminnot
export const hoverBoxGeo = new THREE.BoxGeometry(0.31, 2.51, 1.01);
export const hoverBoxMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3 });
export const hoverBox = new THREE.Mesh(hoverBoxGeo, hoverBoxMat);

scene.add(hoverBox);
hoverBox.visible = false;

const hoverBoxSeinaGeo = new THREE.BoxGeometry(0.31, 2.51, 1.01); 
const hoverBoxSeinaMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3 });
export const hoverBoxSeina = new THREE.Mesh(hoverBoxSeinaGeo, hoverBoxSeinaMat);
hoverBoxSeina.visible = false;

window.addEventListener("mousemove", (event) => {
    const ikkunaTilaPaalla = document.getElementById("ikkunatila").checked;
    const oviTilaPaalla = document.getElementById("ovitila").checked;
    const siirtelyTilaPaalla = document.getElementById("siirtelytila").checked;
    const liikutaKaikkia = document.getElementById("liikutaKaikkia").checked;

    hoverBox.visible = false;
    hoverBoxSeina.visible = false;
    
    if (ikkunaTilaPaalla || oviTilaPaalla || siirtelyTilaPaalla) {
        if (liikutaKaikkia) return;

        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        if (getActiveCamera) {
        raycaster.setFromCamera(mouse, getActiveCamera());
        }

        hoverBox.raycast = () => null;
        hoverBoxSeina.raycast = () => null;

        // Etsitään osumia kaikista seinäryhmien lapsista
        const allParts = [];
        groupDragObjects.forEach(group => allParts.push(...group.children));
        
        const intersects = raycaster.intersectObjects(allParts);

        if (intersects.length > 0) {
            const ryhma = intersects[0].object.parent;

            if (siirtelyTilaPaalla) {

                const seinaPalat = ryhma.children.filter(lapsi => lapsi.userData && lapsi.userData.tyyppi === "seina");
                const palojenMaara = seinaPalat.length;
                const seinanPituus = palojenMaara * 0.5;

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
            
                // Muutetaan maailman Z-koordinaatti ryhmän paikalliseksi koordinaatiksi
                const maailmaPiste = intersects[0].point;
                const paikallinenPiste = ryhma.worldToLocal(maailmaPiste.clone());
                const zPos = paikallinenPiste.z;

                // Nyt pyöristys toimii tarkan hiiren sijainnin mukaan 0.5m välein
                const uusiPosz = Math.round(zPos * 2) / 2;

                hoverBox.visible = true;
                hoverBox.position.z = uusiPosz;
                hoverBox.position.y = 1.25;
                hoverBox.position.x = 0;
                hoverBox.renderOrder = 999;

                ryhma.add(hoverBox);
            }
        }
        if (event.buttons === 1 && siirtelyTilaPaalla) {
            // Jos nappi on pohjassa, älä anna visible-tilan muuttua falseksi
            hoverBoxSeina.visible = (hoverBoxSeina.parent !== null); 
        }
    }
});

//Ikkunan lisäys toiminnot
window.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;

    const ikkunaRadio = document.getElementById("ikkunatila");
    const oviRadio = document.getElementById("ovitila");

    if (!ikkunaRadio?.checked && !oviRadio?.checked) return;
    
    // Jos hoverBox ei ole näkyvissä, ei ole mitään mihin sijoittaa
    if (!hoverBox.visible) return;

    // OTETAAN RYHMÄ JA SIJAINTI SUORAAN HOVERBOXILTA
    // Tämä takaa, että ikkuna menee TÄSMÄLLEEN siihen missä esikatselu on
    const ryhma = hoverBox.parent; 
    const keskiZ = hoverBox.position.z;

    if (ryhma) {
        // Suodatetaan poistettavat palat. 
        // Nostetaan etäisyyttä hieman (0.6 -> 0.7), jotta se nappaa varmasti 
        // kaksi 0.5m palaa vaikka ne olisivat hieman epätarkasti sijoitettu
        const poistettavat = ryhma.children.filter(child => 
            (child.userData.tyyppi === "seina" || child.userData.tyyppi === "tolppa") && 
            Math.abs(child.position.z - keskiZ) < 0.74
        );

        // Sallitaan sijoitus, jos ollaan seinän päällä (poistettavia löytyy)
        // TAI jos haluat sallia sijoituksen tyhjään (poista tämä ehto)
        if (poistettavat.length > 0) {
            poistettavat.forEach(p => ryhma.remove(p));
            
            if (ikkunaRadio.checked) {
                lisaaIkkuna(ryhma, keskiZ);
                undoHistory.push({ type: "ikkuna", ryhma, keskiZ, poistettavat });
            } else if (oviRadio.checked) {
                lisaaOvi(ryhma, keskiZ);
                undoHistory.push({ type: "ovi", ryhma, keskiZ, poistettavat });
            }
            
            // Piilotetaan hoverBox hetkeksi, jotta se lasketaan uudelleen seuraavassa liikkeessä
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

export function lisaaOvi(kohdeRyhma, zPos) {
    const isUusiOvi = !kohdeRyhma;
    const isäntä = kohdeRyhma || new THREE.Group();

    const oviElementit = new THREE.Group()

    // 1/4 Ympyrä
    const geometry = new THREE.CircleGeometry(1, 64, 0, Math.PI / 2)
    const material = new THREE.MeshStandardMaterial({ color: 0xa0a0a0, side: THREE.DoubleSide })
    const circle = new THREE.Mesh(geometry, material)
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(0.15, 0.01, 0.5)

    const ylapalaGeo = new THREE.BoxGeometry(0.3, 0.4, 1.0);
    const ylapalaMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
    const ylapala = new THREE.Mesh(ylapalaGeo, ylapalaMat);
    ylapala.position.y = 2.3;

    const alapalaGeo = new THREE.BoxGeometry(0.3, 0.01, 1.0);
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
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

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

                if (siirtelyRadio.checked) {
                    selectedObject = topObject;
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

export function setupDeleteEvents() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let selectedObject = null;

    function isProtectedObject(obj) {
        return (
            obj === grid ||
            obj === grid2 ||
            obj === drawingPlane ||
            obj === hoverBox ||
            obj === hoverBoxSeina
        );
    }

    function getTopLevelObject(hitObject) {
        let topObject = hitObject;

        while (topObject.parent && topObject.parent !== scene) {
            topObject = topObject.parent;
        }

        return topObject;
    }

    console.log("[Poisto] setupDeleteEvents alustettu");

    window.addEventListener("mousedown", function(event) {
        console.log("[Poisto] mousedown havaittu", {
            button: event.button
        });

        const siirtelyRadio = document.getElementById("siirtelytila");
        console.log("[Poisto] siirtelyRadio löytyi:", !!siirtelyRadio);
        console.log("[Poisto] siirtelytila checked:", siirtelyRadio?.checked);

        if (!siirtelyRadio || !siirtelyRadio.checked) {
            console.log("[Poisto] Ei siirtelytilassa");
            return;
        }

        if (event.button !== 0) {
            console.log("[Poisto] Ei vasen klikkaus");
            return;
        }

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const activeCam = getActiveCamera ? getActiveCamera() : null;
        console.log("[Poisto] aktiivinen kamera:", activeCam);

        if (!activeCam) {
            console.log("[Poisto] Aktiivista kameraa ei löytynyt");
            return;
        }

        raycaster.setFromCamera(mouse, activeCam);

        const intersects = raycaster.intersectObjects(scene.children, true);
        console.log("[Poisto] osumia:", intersects.length);

        selectedObject = null;

        for (const hit of intersects) {
            const hitObject = hit.object;
            console.log("[Poisto] osuma objektiin:", hitObject);

            if (isProtectedObject(hitObject)) {
                console.log("[Poisto] Suojattu objekti, ohitetaan");
                continue;
            }

            const topObject = getTopLevelObject(hitObject);
            console.log("[Poisto] topObject:", topObject);

            if (isProtectedObject(topObject)) {
                console.log("[Poisto] TopObject suojattu, ohitetaan");
                continue;
            }

            selectedObject = topObject;
            console.log("[Poisto] Valittu objekti:", selectedObject);
            break;
        }

        if (!selectedObject) {
            console.log("[Poisto] Yhtään valittavaa objektia ei löytynyt");
        }
    });

    window.addEventListener("keydown", function(event) {
        const siirtelyRadio = document.getElementById("siirtelytila");

        if (!siirtelyRadio || !siirtelyRadio.checked) return;

        console.log("[Poisto] keydown:", event.key);

        if (!selectedObject) {
            console.log("[Poisto] Ei valittua objektia");
            return;
        }

        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;

        if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();

            const parent = selectedObject.parent;
            if (!parent) return;

            const indexInGroupDrag = groupDragObjects.indexOf(selectedObject);
            const indexInDrag = dragObjects.indexOf(selectedObject);

            undoHistory.push({
                type: "poisto",
                object: selectedObject,
                parent: parent,
                indexInGroupDrag: indexInGroupDrag,
                indexInDrag: indexInDrag
            });

            parent.remove(selectedObject);

            if (indexInGroupDrag !== -1) {
                groupDragObjects.splice(indexInGroupDrag, 1);
            }

            if (indexInDrag !== -1) {
                dragObjects.splice(indexInDrag, 1);
            }

            paivitaRaahaus();
            console.log("[Poisto] Objekti poistettu");

            selectedObject = null;
        }
    });
}