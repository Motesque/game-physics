import createAxis from './utils.js'
import {inertiaTensorCuboid, Body} from '../engine/body.js'
import Contact from '../engine/contact.js'
import {ForceGeneratorGravity, ForceGeneratorDrag, ForceRegistry, ForceGeneratorSpring} from "../engine/force.js"
import {ActionManager, Vector3, Color3, HemisphericLight, PointLight, 
        DirectionalLight, MeshBuilder, Texture, CubeTexture, 
        ShadowGenerator, Mesh, Ray,
         ArcRotateCamera, ExecuteCodeAction, Space, Axis, SceneLoader, Matrix} from 'babylonjs'
import { StandardMaterial } from 'babylonjs';
import * as GUI from 'babylonjs-gui'
import {WoodProceduralTexture} from 'babylonjs-procedural-textures'
import 'babylonjs-loaders'

class CannonScene {
    constructor(scene, canvas) {       
        this.scene = scene
        this.canvas = canvas;
        this.bodyDict = {};
        this.collPos = null;
        this.objDict = {};
        this.keyMap = {};
        this.uiTexture = null;
        this.prevSpacePressed = false;
        this.muzzleVelocity = 10;
        this.pickPoint = null;
        this.scene.actionManager = new  ActionManager(this.scene);
        this.forceRegistry = new ForceRegistry();
        this.forceGenGravity =  new ForceGeneratorGravity(new Vector3(0,-10,0));
        this.forceGenDrag =  new ForceGeneratorDrag(0,0);
        this.scene.actionManager.registerAction(new  ExecuteCodeAction( ActionManager.OnKeyDownTrigger,  (evt) => {
            this.keyMap[evt.sourceEvent.key] = evt.sourceEvent.type === "keydown";
        }));
    
        this.scene.actionManager.registerAction(new  ExecuteCodeAction( ActionManager.OnKeyUpTrigger,  (evt) => {
            this.keyMap[evt.sourceEvent.key] = evt.sourceEvent.type === "keydown";
        }));
    }
v
    initCamera() {
        this.camera = new ArcRotateCamera("Camera",0,0,  0, new Vector3(0, 0, 0), this.scene);
        this.camera.setPosition(new Vector3(20, 10, -20));
        this.camera.attachControl(this.canvas, true); 
        this.camera.angularSensibilityX = 5000;
        this.camera.angularSensibilityY = 8000;
        this.camera.wheelPrecision = 50;
        this.uiTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
            "UI",true,this.scene
          );
        var container = new GUI.Rectangle();
        this.uiTexture.addControl(container); 
        container.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;    
        container.width = 0.2;
        container.paddingTop = "10px"
        container.paddingLeft = "10px"
        container.thickness = 0;
        
    
        var panel = new GUI.StackPanel();    
        panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;     
        container.addControl(panel);   
    
        var header = new GUI.TextBlock();
        header.text = `Muzzle Velocity: ${this.muzzleVelocity.toFixed(0)} m/s`;
        header.fontSize = "30px"
        header.height = "50px";
        header.color = "white";
        panel.addControl(header);

    
        var slider = new GUI.Slider();
        slider.minimum = 5;
        slider.maximum = 20;
        slider.value = this.muzzleVelocity;
        slider.borderColor ="#f00"
        slider.height = "40px";
        slider.width = 1;
        slider.paddingLeft = "20px"
        slider.background = "orange";
        slider.color = "#f00"
        slider.paddingRight = "20px"
        slider.onValueChangedObservable.add((value)=> {
            this.muzzleVelocity = value;
            header.text = `Muzzle Velocity: ${this.muzzleVelocity.toFixed(0)} m/s`;
        });  
        panel.addControl(slider);     

        let headerDrag = new GUI.TextBlock();
        headerDrag.text = `Drag Coeff: ${this.forceGenDrag.k0.toFixed(0)}`;
        headerDrag.fontSize = "30px"
        headerDrag.height = "50px";
        headerDrag.color = "white";
        panel.addControl(headerDrag);

    
        let sliderDrag = new GUI.Slider();
        sliderDrag.minimum = 0;
        sliderDrag.maximum = 10;
        sliderDrag.value = this.forceGenDrag.k0;
        sliderDrag.borderColor ="#f00"
        sliderDrag.height = "40px";
        sliderDrag.width = 1;
        sliderDrag.paddingLeft = "20px"
        sliderDrag.background = "orange";
        sliderDrag.color = "#f00"
        sliderDrag.paddingRight = "20px"
        sliderDrag.onValueChangedObservable.add((value)=> {
            this.forceGenDrag.k0 = value;
            headerDrag.text = `Drag Coeff: ${this.forceGenDrag.k0.toFixed(0)}`;

        });  
        panel.addControl(sliderDrag);     


        
    }

    initLights() {
        let ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), this.scene);
        ambientLight.intensity = 0.5
        ambientLight.diffuse = new Color3(0.9,0.9,1.0);
        
        let keyLight = new DirectionalLight("keyLight", new Vector3(1, -1, 0), this.scene);
        keyLight.diffuse = new Color3(1,1,1);
        keyLight.intensity = 1
        keyLight.position = new Vector3(10, 5, 10);
        this.shadowGenerator = new ShadowGenerator(1024, keyLight);
        this.shadowGenerator.useBlurExponentialShadowMap = true;
        this.shadowGenerator.useKernelBlur = true;
        this.shadowGenerator.blurKernel = 16;

        let fillLight = new PointLight("fillLight", new Vector3(1, -1, 0), this.scene);
        fillLight.diffuse = new Color3(1,1,1);
        fillLight.intensity = 0.5

        // Create a default skybox with an environment.
        var hdrTexture = CubeTexture.CreateFromPrefilteredData("assets/environment.dds", this.scene);
        this.scene.createDefaultSkybox(hdrTexture, true, 200, 0.3);
        this.scene.environmentTexture = hdrTexture;
    }

    addPlank() {
        this.plank = MeshBuilder.CreateBox("plank", {width:5, height:0.5, size:0.5}, this.scene);
        var texture = new  WoodProceduralTexture("assets", 512, this.scene);
        var material = new StandardMaterial("material", this.scene);
        material.diffuseTexture = texture;
        this.plank.material = material; 

        let plankBody = new Body(this.plank);
        plankBody.position = new Vector3(0, 5, 0);
        plankBody.velocity = new Vector3(0, 0, 0);
        plankBody.inverseMass = 1/10;
        plankBody.inverseInertiaTensor = Matrix.Invert(inertiaTensorCuboid(10,5,0.5,0.5));
        this.bodyDict["plank"] = plankBody;
    }

    initWorld() {
        // Add and manipulate meshes in the scene
        this.sphere = MeshBuilder.CreateSphere("sphere", {diameter:0.5}, this.scene);
        this.shadowGenerator.getShadowMap().renderList.push(this.sphere);
        var texture = new  WoodProceduralTexture("assets", 512, this.scene);
        var material = new StandardMaterial("material", this.scene);
        material.diffuseTexture = texture;
        this.sphere.material = material; 

        let sphereBody = new Body(this.sphere);
        sphereBody.position = new Vector3(0, 5, 0);
        sphereBody.velocity = new Vector3(0, 0, 0);
        sphereBody.inverseMass = 0;
        this.bodyDict["ball"] = sphereBody;
        this.forceRegistry.add(this.forceGenGravity, sphereBody);
        this.forceRegistry.add(this.forceGenDrag, sphereBody);

        this.addPlank();
        let sphereChain = MeshBuilder.CreateSphere("sphereChain", {diameter:0.2}, this.scene);
        this.shadowGenerator.getShadowMap().renderList.push(sphereChain);
        let sphereChainBody = new Body(sphereChain);
        sphereChainBody.position = new Vector3(0, 8, 0);
        sphereChainBody.velocity = new Vector3(0, 0, 0);
        sphereChainBody.inverseMass = 1/1;
        this.bodyDict["sphereChainBody"] = sphereChainBody;
        

        let anchor = MeshBuilder.CreateSphere("anchor", {diameter:0.4}, this.scene);
        let anchorBody = new Body(anchor);
        anchorBody.position = new Vector3(1, 10, 0);
        anchorBody.velocity = new Vector3(0, 0, 0);
        this.bodyDict["anchorBody"] = anchorBody;

        // set up the springs
       this.forceRegistry.add(new ForceGeneratorSpring(anchorBody, 0.5,5), sphereChainBody);
       this.forceRegistry.add(this.forceGenGravity, sphereChainBody);
       this.forceRegistry.add(new ForceGeneratorDrag(0.2,0), sphereChainBody);

       this.bouncer =MeshBuilder.CreateSphere("bouncer", {diameter:1}, this.scene);
       let bouncerBody = new Body(this.bouncer);
       bouncerBody.position = new Vector3(0, 5, 3);
       bouncerBody.inverseMass = 1/100;
       this.bodyDict["bouncer"] = bouncerBody;
       //this.forceRegistry.add(new ForceGeneratorGravity(new Vector3(0,0.05,0)), bouncerBody);

       var ground = Mesh.CreateGroundFromHeightMap("ground", "assets/ground_height_map.jpg", 32, 32, 32,0, 2, this.scene, false);
       ground.receiveShadows = true;
       this.ground = ground;
       var groundMaterial = new StandardMaterial("ground", this.scene);
       groundMaterial.diffuseTexture = new Texture("assets/grass.jpg", this.scene);
       groundMaterial.diffuseTexture.uScale = 10;
       groundMaterial.diffuseTexture.vScale = 10;
       groundMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
       ground.material = groundMaterial;

        let axis = createAxis(1);
        axis.parent = this.sphere;
        this.collAxis =  createAxis(1);
        this.pickPoint =  createAxis(1);
        SceneLoader.LoadAssetContainer("/assets/", "cannon.gltf", this.scene,  (container) => {
            var meshes = container.meshes;
            for (let m of meshes) {
                if (m.name === "__root__") {
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
                this.objDict.cannon.rotate(Axis.Z,  Math.PI/80, Space.LOCAL);
            }
            catch (e) {}
        }
        if (this.keyMap["s"]) {
            try {
                this.objDict.cannon.rotate(Axis.Z,  -Math.PI/80, Space.LOCAL);
            }
            catch (e) {}
        }
        if (this.keyMap["a"]) {
            try {
                this.objDict.cannon.rotate(Axis.Y,  Math.PI/140, Space.WORLD);
            }
            catch (e) {}
        }
        if (this.keyMap["d"]) {
            try {
                this.objDict.cannon.rotate(Axis.Y,  -Math.PI/140, Space.WORLD);
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
        }

        let dir = this.bodyDict.ball.position.subtract(this.bouncer.position);
        if (dir.length() <= (0.5 + 0.25)) {
            let contactPoint  = this.bouncer.position.add(dir.normalize().scale(0.50));
            this.collAxis.position = contactPoint;
            let a = new Contact(this.bodyDict.ball, this.bodyDict["bouncer"], dir.scale(1))
            a.resolve();
        }
        
        this.scene.onPointerDown = () => {
            let ray = this.scene.createPickingRay(this.scene.pointerX, this.scene.pointerY, Matrix.Identity(), this.camera);	

            var hit = this.scene.pickWithRay(ray);

            if (hit.pickedPoint && hit.pickedMesh === this.plank){
                this.pickPoint.position = hit.pickedPoint;
                this.bodyDict["plank"].addForceAtPoint(ray.direction.scale(100), this.pickPoint.position)
               // this.bodyDict["plank"].addForce(ray.direction.scale(100))
            }
        }   

        // reset the pos if below ground
        if ( this.bodyDict.ball.position.y < 0) {
            this.bodyDict.ball.position = this.objDict.cannon.position.clone();
            // make static
            this.bodyDict.ball.inverseMass = 0;    
            this.collPos= null;
        }
 
        this.scene.render();
    }

}

export default CannonScene