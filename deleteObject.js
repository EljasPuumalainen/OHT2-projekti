import * as THREE from 'three';
import { scene, grid, drawingPlane, renderer } from './sceneSetup.js';
import { groupDragObjects, dragObjects, undoHistory, hoverBox, hoverBoxSeina, hoverBoxPaaty } from './wallManager.js';
import { paivitaRaahaus } from './main.js';
import { puraAlueRaahaus } from './selectedDrag.js';

let getActiveCamera = null;
let selectedObject = null;

export function setSelectedObjectManual(obj) {
    selectedObject = obj;
    console.log("[Poisto] selectedObject asetettu manuaalisesti:", selectedObject?.name);
}

export function getSelectedObject() {
    return selectedObject;
}

export function setupDeleteEvents(cameraGetter) {
    getActiveCamera = cameraGetter;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();


    function isProtectedObject(obj) {
        return (
            obj === grid ||
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

        const rect = renderer.domElement.getBoundingClientRect();

        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const activeCam = typeof getActiveCamera === 'function' ? getActiveCamera() : null;
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

        if (!selectedObject) {
            selectedObject = scene.getObjectByName("ALUEVALINTA_RYHMA");
        }

        if (!selectedObject) {
            return;
        }

        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;

        if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();

            // Jos selectedObject on ALUEVALINTA_RYHMA, poista kaikki sen sisältämät seinät
            if (selectedObject.name === "ALUEVALINTA_RYHMA") {
                const lapset = [...selectedObject.children];
                lapset.forEach(obj => {
                    const indexInGroupDrag = groupDragObjects.indexOf(obj);
                    const indexInDrag = dragObjects.indexOf(obj);

                    undoHistory.push({
                        type: "poisto",
                        object: obj,
                        parent: scene,
                        indexInGroupDrag,
                        indexInDrag
                    });

                    if (indexInGroupDrag !== -1) groupDragObjects.splice(indexInGroupDrag, 1);
                    if (indexInDrag !== -1) dragObjects.splice(indexInDrag, 1);

                    scene.remove(obj);
                });

                scene.remove(selectedObject);
                selectedObject = null;
                puraAlueRaahaus(groupDragObjects, null);
                paivitaRaahaus();
                return;
            }

            const parent = selectedObject.parent;
            if (!parent) return;

            // Puretaan aluevalinta ennen poistoa jotta paivitaRaahaus ei skippaannu
            puraAlueRaahaus(groupDragObjects, null);

            const indexInGroupDrag = groupDragObjects.indexOf(selectedObject);
            const indexInDrag = dragObjects.indexOf(selectedObject);

            undoHistory.push({
                type: "poisto",
                object: selectedObject,
                parent: scene,
                indexInGroupDrag: indexInGroupDrag,
                indexInDrag: indexInDrag
            });

            scene.remove(selectedObject);

            if (selectedObject.userData.tyyppi === 'pohjakuva') {
                window.dispatchEvent(new CustomEvent('pohjakuvaDeleted'));
            }

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