import PhysicsScene from "./physicsScene.js"

var canvas = document.getElementById("renderCanvas"); // Get the canvas element
var engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

/******* End of the create scene function ******/

let myScene = new PhysicsScene(engine, canvas); //Call the createScene function
myScene.initCamera();
myScene.initLights();
myScene.initWorld();

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    myScene.render(engine.getDeltaTime());
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
        engine.resize();
});