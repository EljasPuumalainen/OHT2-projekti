import { dragObjects, groupDragObjects } from "./wallManager";

//Testaus funktiolle, joka muuntaa seinät jsoniksi
export function tallennaSeinatJSON(){
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