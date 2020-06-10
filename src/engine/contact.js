import * as BABYLON from  'babylonjs'


export default class Contact
{
    constructor(bodyA, bodyB, contactNormal) {
        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this.contactNormal = contactNormal;
        this.restitution = 1
    }

    calculateSeparationVelocity() {
        let relativeVelocity = this.bodyA.velocity;
        relativeVelocity.subtract(-this.bodyB.velocity)
        return BABYLON.Vector3.Dot(relativeVelocity,this.contactNormal); 
    }

    resolve() {
        let sepVel = this.calculateSeparationVelocity();
        if (sepVel > 0) {
            // nothing to do
            return;
        }
        let newSepVel = -sepVel *  this.restitution;
        let deltaVel = newSepVel - sepVel;
        console.log("sepVel", sepVel);
        console.log("deltaVel", deltaVel);
        let totalInverseMass = this.bodyA.inverseMass + this.bodyB.inverseMass;
        let impulse = deltaVel / totalInverseMass;
        let impulsePerIMass = this.contactNormal.scale(-impulse);
        this.bodyA.velocity = this.bodyA.velocity.add(impulsePerIMass.scale(-this.bodyA.inverseMass));
        this.bodyB.velocity = this.bodyB.velocity.add(impulsePerIMass.scale(this.bodyB.inverseMass));
        
    }


}
