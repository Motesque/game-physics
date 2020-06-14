
import * as BABYLON from  'babylonjs'


export function inertiaTensorCuboid(mass, dx,dy,dz) {
    let it = new BABYLON.Matrix();
    it.setRowFromFloats(0,1/12*mass*(dy*dy+dz*dz),0,0,0);
    it.setRowFromFloats(1,0,1/12*mass*(dx*dx+dz*dz),0,0);
    it.setRowFromFloats(2,0,0, 1/12*mass*(dx*dx+dy*dy),0);
    it.setRowFromFloats(3,0,0, 0,1);
    return it;
}

export class Body
{
    acceleration =  BABYLON.Vector3.Zero();
    position = BABYLON.Vector3.Zero();
    velocity = BABYLON.Vector3.Zero();
    rotation = BABYLON.Vector3.Zero(); // aka angular velocity
    orientation = BABYLON.Quaternion.Identity();
    inverseMass = 0;
    inverseInertiaTensor = BABYLON.Matrix.Identity();
    txNode = null;
    damping = 0.99;
    angularDamping = 0.99;
    forceAccum = BABYLON.Vector3.Zero();
    torqeAccum = BABYLON.Vector3.Zero();

    constructor(txNode) {
        console.log("[body]")
        this.txNode = txNode;
    }

    addForce(forceVec3) {
        this.forceAccum.addInPlace(forceVec3);
    }

    addForceAtPoint(forceVec3, pointVec3) {
        let relPos = pointVec3.subtract(this.position);
        this.forceAccum.addInPlace(forceVec3);
        this.torqeAccum.addInPlace(relPos.cross(forceVec3));
    }
    addTorque(torqueVec3) {
        this.torqeAccum.addInPlace(torqueVec3);
    }
    
    getMass() {
        return 1/this.inverseMass;
    }

    clearAccumulators() {
        this.forceAccum = BABYLON.Vector3.Zero();
        this.torqeAccum = BABYLON.Vector3.Zero();
    }

    getTransformationMatrix() {
        let rotMat =  BABYLON.Matrix.Identity();
        this.orientation.toRotationMatrix(rotMat);
        let transMat = new BABYLON.Matrix();
        transMat.setTranslation(this.position);
        return rotMat.multiply(transMat);
    }

    getInverseInertialTensorWorld() {
        let rotMat =  BABYLON.Matrix.Identity();
        this.orientation.toRotationMatrix(rotMat);
        return BABYLON.Matrix.Transpose(rotMat).multiply(this.inverseInertiaTensor).multiply(rotMat);
    }

    integrate(elapsedSec) {
        if (this.inverseMass > 0) {
            // constant acc
            let resultAcc = this.acceleration.clone();
            // add acc from forces
            resultAcc.addInPlace(this.forceAccum.scale(this.inverseMass));
            // vel = vel*damping_t + accel*t
            this.velocity = this.velocity.scale(Math.pow(this.damping, elapsedSec)).addInPlace(resultAcc.scale(elapsedSec));
            
            let angularAcc = BABYLON.Vector3.TransformNormal(this.torqeAccum,this.getInverseInertialTensorWorld());

            this.rotation.addInPlace(angularAcc.scale(elapsedSec));

            let rotationQuatW = new BABYLON.Quaternion();
            let rotScaled = this.rotation.scale(elapsedSec);
            rotationQuatW.w = 0;
            rotationQuatW.x = rotScaled.x;
            rotationQuatW.y = rotScaled.y
            rotationQuatW.z = rotScaled.z
          
            this.orientation.addInPlace(rotationQuatW.multiply(this.orientation).scale(elapsedSec/2));
            this.orientation.normalize();
            
            // clear forces
            this.position.addInPlace(this.velocity.scale(elapsedSec));
            this.clearAccumulators();
        }
        // set the position of our mesh
        this.txNode.position = this.position;
        this.txNode.rotationQuaternion = this.orientation;
    }
    
}
