import {constants} from "../utils.js"


export class ForceGeneratorGravity
{
    gravity = new BABYLON.Vector3.Zero();
    constructor(gravityVec3) {
        this.gravity = gravityVec3;
    }

    updateForces(body, durationSec) {
        if (body.inverseMass > 0) {
            body.addForce(this.gravity.clone().scale(body.getMass()));
        }    
       
    }

}
export class ForceGeneratorDrag
{
    constructor(k0, k1) {
        this.k0 = k0;
        this.k1 = k1;
    }

    updateForces(body, durationSec) {
        if (body.inverseMass > 0) {
            let velNorm = body.velocity.clone().normalize();
            let dragCoeff = body.velocity.length()*this.k0 + body.velocity.length()*body.velocity.length()*this.k1;
            let force = velNorm.scale(-dragCoeff);
            //console.log(force);
            body.addForce(force);
        }    
       
    }

}



export class ForceRegistry
{
    forceRegistrations = [];
    
    constructor() {  
    }

    add(fg, body) {
        this.forceRegistrations.push([fg,body])
    }
    updateForces(durationSec) {
        for (let r of this.forceRegistrations) {
            let fg = r[0];
            let body = r[1];
            fg.updateForces(body, durationSec);
        }
    }

}