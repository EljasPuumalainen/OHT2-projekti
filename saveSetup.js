import { dragObjects, groupDragObjects } from "./wallManager";

//Testaus funktiolle, joka muuntaa seinät jsoniksi
export function tallennaSeinatJSON(){
    //Kerätään uuteen taulukkoon vain tarvittava seinien data
    const seinaData = groupDragObjects.map((group, index) => {
        
        const seinaPalat = group.children.filter(c => c.userData.tyyppi === "seina")

        return {
            id: index,
            location: {
                x: group.position.x,
                y: group.position.y,
                z: group.position.z
            },
            rotation: {
                y: group.rotation.y
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