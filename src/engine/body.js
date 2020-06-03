
import * as BABYLON from  'babylonjs'

class Body
{
   
    acceleration =  BABYLON.Vector3.Zero();
    position = BABYLON.Vector3.Zero();
    velocity = BABYLON.Vector3.Zero();
    inverseMass = 10;
    txNode = null;
    damping = 0.99;
    forceAccum = BABYLON.Vector3.Zero();

    constructor(txNode) {
        console.log("[body]")
        this.txNode = txNode;
    }
    addForce(forceVec3) {
        this.forceAccum.addInPlace(forceVec3);
    }

    getMass() {
        return 1/this.inverseMass;
    }

    integrate(elapsedSec) {
        if (this.inverseMass > 0) {
            this.position.addInPlace(this.velocity.scale(elapsedSec));
            // constant acc
            let resultAcc = this.acceleration.clone();
            // add acc from forces
            resultAcc.addInPlace(this.forceAccum.scale(this.inverseMass));
            // vel = vel*damping_t + accel*t
            this.velocity = this.velocity.scale(Math.pow(this.damping, elapsedSec)).addInPlace(resultAcc.scale(elapsedSec));
            // clear forces
            this.forceAccum = BABYLON.Vector3.Zero();
        }
        // set the position of our mesh
        this.txNode.position = this.position;
    }
    
}

export default Body;