import React from 'react';
import SceneComponent from './components/SceneComponent/SceneComponent'; // ^^ point to file we created above or 'babylonjs-hook' NPM.
import './App.css';
import CannonScene from './scenes/cannonScene'

let cannonScene;

const onSceneReady = scene => {
  cannonScene = new CannonScene(scene,  scene.getEngine().getRenderingCanvas());
  cannonScene.initCamera();
  cannonScene.initLights();
  cannonScene.initWorld();
}

/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
const onRender = scene => {
  if (cannonScene !== undefined) {
    cannonScene.render(scene.getEngine().getDeltaTime());
  }
}

export default () => (
      <SceneComponent antialias  onSceneReady={onSceneReady} onRender={onRender} id='my-canvas' />
)