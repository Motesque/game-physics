import { Vector3,TransformNode,  Color3, Mesh} from 'babylonjs'
function createAxis(size, scene) {
    var axisX = Mesh.CreateLines("axisX", [ 
        new Vector3.Zero(),
         new Vector3(size, 0, 0), new Vector3(size * 0.95, 0.05 * size, 0), 
        new Vector3(size, 0, 0), new Vector3(size * 0.95, -0.05 * size, 0)
        ], scene);
    axisX.color = new Color3(1, 0, 0);

    let axisY = Mesh.CreateLines("axisY", [
        new Vector3.Zero(), new Vector3(0, size, 0), new Vector3(-0.05 * size, size * 0.95, 0),
        new Vector3(0, size, 0), new Vector3(0.05 * size, size * 0.95, 0)
	], scene);
    axisY.color = new Color3(0, 1, 0);

    var axisZ = Mesh.CreateLines("axisZ", [
        new Vector3.Zero(), new Vector3(0, 0, size), new Vector3( 0 , -0.05 * size, size * 0.95),
        new Vector3(0, 0, size), new Vector3( 0, 0.05 * size, size * 0.95)
        ], scene);
        axisZ.color = new Color3(0, 0, 1);

    var cog = new TransformNode("root"); 
    axisX.parent  = cog
    axisY.parent  = cog
    axisZ.parent  = cog
    return cog;
}
export let constants = {
    GRAVITY : new Vector3(0,-10,0)
}

export default createAxis;
