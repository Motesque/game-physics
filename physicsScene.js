import createAxis from './utils.js'
import Body from './engine/body.js'
import {constants} from "./utils.js"
import {ForceGeneratorGravity, ForceGeneratorDrag, ForceRegistry} from "./engine/force.js"

class PhysicsScene {
    constructor(engine, canvas) {
        this.scene = new BABYLON.Scene(engine);
        this.canvas = canvas;
        this.bodyDict = {};
        this.objDict = {};
        this.keyMap = {};
        this.uiTexture = null;
        this.prevSpacePressed = false;
        this.muzzleVelocity = 5;
        this.scene.actionManager = new BABYLON.ActionManager(this.scene);
        this.forceRegistry = new ForceRegistry();
        this.forceGenGravity =  new ForceGeneratorGravity(new BABYLON.Vector3(0,-10,0));
        this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger,  (evt) => {
            this.keyMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
    
        this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger,  (evt) => {
            this.keyMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
    }

    initCamera() {
        this.camera = new BABYLON.ArcRotateCamera("Camera",0,0,  0, new BABYLON.Vector3(0, 0, 0), this.scene);
        this.camera.setPosition(new BABYLON.Vector3(20, 10, -20));
        this.camera.attachControl(this.canvas, true); 
        this.camera.angularSensibilityX = 3000;
        this.camera.angularSensibilityY = 5000;
        this.camera.wheelPrecision = 50;
        this.uiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
            "UI"
          );
        var container = new BABYLON.GUI.Rectangle();
        this.uiTexture.addControl(container); 
        container.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;    
        container.width = 0.5;
        container.paddingTop = "10px"
        container.paddingLeft = "10px"
        container.thickness = 0;
      
    
        var panel = new BABYLON.GUI.StackPanel();    
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;     
        container.addControl(panel);   
    
        var header = new BABYLON.GUI.TextBlock();
        header.text = `Muzzle Velocity: ${this.muzzleVelocity.toFixed(0)} m/s`;
        header.height = "30px";
        header.color = "white";
        panel.addControl(header);

    
        var slider = new BABYLON.GUI.Slider();
        slider.minimum = 5;
        slider.maximum = 20;
        slider.value = 0;
        slider.borderColor ="#f00"
        slider.height = "20px";
        slider.width = "300px";
        slider.paddingLeft = "20px"
        slider.background = "orange";
        slider.color = "#f00"
        slider.paddingRight = "20px"
        slider.onValueChangedObservable.add((value)=> {
            this.muzzleVelocity = value;
            header.text = `Muzzle Velocity: ${this.muzzleVelocity.toFixed(0)} m/s`;
        });  
        panel.addControl(slider);     
    }

    initLights() {
        let ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), this.scene);
        ambientLight.intensity = 0.5
        ambientLight.diffuse = new BABYLON.Color3(0.9,0.9,1.0);
        
        let keyLight = new BABYLON.DirectionalLight("keyLight", new BABYLON.Vector3(1, -1, 0), this.scene);
        keyLight.diffuse = new BABYLON.Color3(1,1,1);
        keyLight.intensity = 1
        keyLight.position = new BABYLON.Vector3(10, 20, 10);
        this.shadowGenerator = new BABYLON.ShadowGenerator(1024, keyLight);
        this.shadowGenerator.useBlurExponentialShadowMap = true;
        this.shadowGenerator.useKernelBlur = true;
        this.shadowGenerator.blurKernel = 16;

        let fillLight = new BABYLON.PointLight("fillLight", new BABYLON.Vector3(1, -1, 0), this.scene);
        fillLight.diffuse = new BABYLON.Color3(1,1,1);
        fillLight.intensity = 0.5

        // Create a default skybox with an environment.
        var hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("textures/environment.dds", this.scene);
        this.scene.createDefaultSkybox(hdrTexture, true);
      
    }
    initWorld() {
        // Add and manipulate meshes in the scene
        this.sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter:0.5}, this.scene);
        this.shadowGenerator.getShadowMap().renderList.push(this.sphere);
        var texture = new BABYLON.WoodProceduralTexture("texture", 512, this.scene);
        var material = new BABYLON.StandardMaterial("material", this.scene);
        material.diffuseTexture = texture;
        this.sphere.material = material; 

        let sphereBody = new Body(this.sphere);
        sphereBody.position = new BABYLON.Vector3(0, 5, 0);
        sphereBody.velocity = new BABYLON.Vector3(0, 0, 0);
        this.bodyDict["ball"] = sphereBody;
        this.forceRegistry.add(this.forceGenGravity, sphereBody);
        this.forceRegistry.add(new ForceGeneratorDrag(1,0), sphereBody);
        


       var ground = BABYLON.Mesh.CreateGroundFromHeightMap("ground", "textures/ground_height_map.jpg", 32, 32, 32,0, 2, this.scene, false);
       ground.receiveShadows = true;
       var groundMaterial = new BABYLON.StandardMaterial("ground", this.scene);
       groundMaterial.diffuseTexture = new BABYLON.Texture("textures/grass.jpg", this.scene);
       groundMaterial.diffuseTexture.uScale = 10;
       groundMaterial.diffuseTexture.vScale = 10;
       groundMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
       ground.material = groundMaterial;

        let axis = createAxis(1);
        axis.parent = this.sphere;

        BABYLON.SceneLoader.LoadAssetContainer("/textures/", "cannon.gltf", this.scene,  (container) => {
            var meshes = container.meshes;
            for (let m of meshes) {
                if (m.name == "__root__") {
                    continue;
                }
              
                m.position.addInPlaceFromFloats(0.08, 1.5, -10);
                this.shadowGenerator.getShadowMap().renderList.push(m); 
                if (m.name === "cannon") {
                    this.objDict["cannon"] = m;
                    let axis = createAxis(2);
                    axis.parent = m;
                } 
            }
           
            container.addAllToScene();
        });

       
    }

    getBablyonScene = () => {
        return this.scene;
    }

    render = (elapsedMs) => {
        if (this.keyMap["w"]) {
            try {
                this.objDict.cannon.rotate(BABYLON.Axis.Z,  Math.PI/50, BABYLON.Space.LOCAL);
            }
            catch (e) {}
        }
        if (this.keyMap["s"]) {
            try {
                this.objDict.cannon.rotate(BABYLON.Axis.Z,  -Math.PI/50, BABYLON.Space.LOCAL);
            }
            catch (e) {}
        }
        let spacePressed = this.keyMap[" "];
        if (!this.prevSpacePressed && spacePressed) {
            try {
                this.bodyDict.ball.inverseMass = 1/10;
                this.bodyDict.ball.position = this.objDict.cannon.position.clone();
                this.bodyDict.ball.position.addInPlace(this.objDict.cannon.getWorldMatrix(true).getRow(0).toVector3().normalize().scale(1.7))
                this.bodyDict.ball.velocity = this.objDict.cannon.worldMatrixFromCache.getRow(0).toVector3().normalize().scale(this.muzzleVelocity)
            }
            catch (e) {}
        }
        this.prevSpacePressed = spacePressed;
        let elapsedSec = elapsedMs/1000
        this.forceRegistry.updateForces(elapsedSec);

        for (let body of Object.entries(this.bodyDict)) {
            body[1].integrate(elapsedSec);  
            if ( body[1].position.y < 0) {
                body[1].position = this.objDict.cannon.position.clone();
                // make static
                this.bodyDict.ball.inverseMass = 0;    
            }
        }
 
        this.scene.render();
    }

}

export default PhysicsScene