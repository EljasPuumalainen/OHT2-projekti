import * as THREE from 'three';
import { scene, grid, drawingPlane, renderer } from './sceneSetup.js';
import { groupDragObjects, dragObjects, undoHistory, hoverBox, hoverBoxSeina, hoverBoxPaaty } from './wallManager.js';
import { paivitaRaahaus } from './main.js';

let getActiveCamera = null;
let selectedObject = null;

export function setupDeleteEvents(cameraGetter) {
    getActiveCamera = cameraGetter;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let selectedObject = null;

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

        //console.log("[Poisto] keydown:", event.key);

        if (!selectedObject) {
            //console.log("[Poisto] Ei valittua objektia");
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