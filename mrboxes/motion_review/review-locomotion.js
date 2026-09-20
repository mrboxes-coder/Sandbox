import * as THREE from './three.module.js';
import {prepareRobotMotion,updateRobotMotion,updateCharacterTurn,poseCharacterFeet} from './review-motion.js';

const Y=new THREE.Vector3(0,1,0),clamp=THREE.MathUtils.clamp;
const ease=t=>{t=clamp(t,0,1);return t*t*t*(10+t*(-15+6*t));};
// Quintic tangent: unit starting velocity, zero end velocity/acceleration.
const tangent=t=>{t=clamp(t,0,1);return t-6*t**3+8*t**4-3*t**5;};
// Let the ankle lag the lift, then return to neutral on descent.
export function footRoll(recovery,contact=0,scale=1){
 const droop=.17*ease(recovery/.38);
 const pitch=THREE.MathUtils.lerp(droop,0,ease((recovery-.66)/.34));
 const flatten=1-ease(contact);
 return {pitch:pitch*flatten*scale,toe:.09*Math.sin(Math.PI*clamp(recovery,0,1))**2*scale};
}
export const FIXED_DT=1/60;
export const DURATION=10.5;
export function sequenceInput(t,offset=0,direction=1){
 const turning=t>=3.25+offset&&t<5.45+offset;
 return {forward:t>=1&&t<8,left:turning&&direction===1,right:turning&&direction===-1};
}

// One alternating contact sequence owns both straight and curved travel.
// Steering is a request consumed at a foot boundary, never a pose reset.
export class ReviewLocomotion{
 constructor(actor,body){this.actor=actor;this.motion=prepareRobotMotion(body);this.reset();}
 reset(direction=1){
  this.actor.position.set(0,0,0);this.actor.rotation.set(0,0,0);
  this.time=0;this.speed=0;this.yaw=0;this.yawRate=0;this.step=null;this.serial=0;this.nextFoot=1;this.phase='Rest';this.requested=false;this.settle=null;
  this.direction=direction;this.nextFoot=direction===1?1:0;
  this.headingLook={angle:0,velocity:0};
  this.previousPelvisTilt=0;
  this.walkGaze=null;
  const m=this.motion;Object.assign(m,{state:'idle',amount:0,cycle:0,idleTime:1,stopTime:2,springs:{},turnActive:false,walkHandover:null,reviewClosingStep:false,reviewSupportRelease:null});
  updateRobotMotion(m,0,0,0);this.actor.updateMatrixWorld(true);
  this.feet=m.feet.map(f=>({position:m.raw.localToWorld(new THREE.Vector3(f.x,0,f.z-.018)),yaw:f.yaw}));
  this.contacts=[true,true];this.actualContacts=[true,true];this.weights=[.5,.5];this.clearances=[0,0];this.measure();
 }
 beginStep(input){
  const closing=this.settle,airborne=closing&&this.motion.feet[closing.moving].lift>0;
  const entry=airborne?{...this.motion.feet[closing.moving]}:null;
  if(entry){
   const q=clamp((closing.time-.30)/.65,0,1),rate=30*q*q*(1-q)**2/.65;
   entry.velocity=closing.end.clone().sub(closing.start).multiplyScalar(rate);
   entry.yawVelocity=(closing.yaw-closing.startYaw)*rate;
   entry.liftVelocity=.015*Math.PI*Math.sin(2*Math.PI*q)/.65;
   const before=footRoll(q-.0001,0,.60),after=footRoll(q+.0001,0,.60);
   entry.pitchVelocity=(after.pitch-before.pitch)/.0002/.65;
   entry.toeVelocity=(after.toe-before.toe)/.0002/.65;
  }
  if(this.motion.state!=='walk'){
   // Carry the current survey angle AND its velocity into locomotion.
   // The walking pose cancels torso rotation, so this is an actor-space gaze.
   const springs=this.motion.springs,old=this.walkGaze;
   this.walkGaze={yaw:(springs.gaze?.x??0)+(old?.yaw??0),pitch:(springs.gazePitch?.x??0)+(old?.pitch??0),yawVelocity:(springs.gaze?.v??0)+(old?.yawVelocity??0),pitchVelocity:(springs.gazePitch?.v??0)+(old?.pitchVelocity??0)};
   // These overrides are not updated by settling; seed them from the visible
   // pose instead of restoring the values from the previous walking step.
   if(closing){
    springs.reviewBalance={x:this.motion.pelvis.position.x,v:0};
    springs.kneeReserve={x:0,v:0};
   }
   this.settle=null;this.motion.reviewClosingStep=false;this.motion.reviewSupportRelease=null;
  }
  const foot=airborne?closing.moving:closing&&closing.time>=.95?1-closing.moving:this.serial===0&&input.right?0:this.nextFoot;this.nextFoot=1-foot;
  this.step={foot,elapsed:airborne?.72*.20:0,entry,inPlace:!input.forward&&!airborne,bodyStartYaw:this.yaw,serial:++this.serial,steering:input.left?1:input.right?-1:0,start:this.feet[foot].position.clone(),startYaw:this.feet[foot].yaw};
 }
 advance(dt,input){
  this.time+=dt;this.requested=!!(input.left||input.right);
  if(!this.step&&(input.forward||input.left!==input.right))this.beginStep(input);
  const m=this.motion,step=this.step;
  if(step){
   step.elapsed+=dt;const u=clamp(step.elapsed/.72,0,1);
   // The body starts transferring weight while BOTH soles still touch down.
   const recovery=clamp((u-.20)/.70,0,1),travel=ease(recovery);
   const active=step.foot,support=1-active;
   const supportWeight=.5+.42*(step.entry?1:ease(u/.20))*(1-ease((u-.90)/.10));
   this.weights[active]=1-supportWeight;this.weights[support]=supportWeight;
   this.contacts=[true,true];this.contacts[active]=!(u>.20&&u<.90);
   const desiredSpeed=input.forward?(step.steering?.72:.9):0;
   this.speed+=(desiredSpeed-this.speed)*(1-Math.exp(-dt*4));
   const desiredYaw=(input.forward||input.left!==input.right)?step.steering*Math.PI/(6*.72):0;
   this.yawRate+=(desiredYaw-this.yawRate)*(1-Math.exp(-dt*5));
   this.yaw=step.inPlace?step.bodyStartYaw+step.steering*Math.PI/6*ease(u):this.yaw+this.yawRate*dt;this.actor.rotation.y=this.yaw;
   this.actor.position.add(new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw)).multiplyScalar(this.speed*dt));
   const remaining=Math.max(0,.90-u)*.72;
   const endYaw=step.inPlace?step.bodyStartYaw+step.steering*Math.PI/6:this.yaw+this.yawRate*remaining;
   const end=new THREE.Vector3((active===0?-1:1)*.12*m.scale,0,-.018*m.scale+this.speed*(remaining+.72*.62)).applyAxisAngle(Y,endYaw).add(this.actor.position);
   // Freeze contact after landing. Do not re-plan a foot already on the floor.
   if(u<=.90||!step.landed){
    this.feet[active].position.copy(step.start).lerp(end,travel);
    this.feet[active].yaw=THREE.MathUtils.lerp(step.startYaw,endYaw+(active===0?.06:-.06),travel);
    if(step.entry){
     const carryVelocity=.72*.70*tangent(recovery);
     this.feet[active].position.addScaledVector(step.entry.velocity,carryVelocity);
     this.feet[active].yaw+=step.entry.yawVelocity*carryVelocity;
    }
    if(u>=.90)step.landed=true;
   }
   const previousPelvis=m.pelvis.position.clone();
   updateCharacterTurn(m,dt,active,u,this.speed*dt,step.serial);
   {
    // Hip hike follows the actual swing: positive Z raises the +X hip.
    // Both tilt and added height return to zero before double support.
    const rise=recovery<.66?ease(recovery/.66):1-ease((recovery-.66)/.34);
    m.pelvis.rotation.z=(active===0?-1:1)*.075*rise;
    // Give height its own rounded arc, rather than
    // tying it to the slower foot lift. Low contact height remains unchanged.
    const bounce=Math.sin(Math.PI*clamp((u-.12)/.84,0,1))**2;
    // An interrupted closing step starts airborne: ease into its new bounce
    // without adding the mid-cycle height in a single frame.
    m.pelvis.position.y+=.030*bounce*(step.entry?ease(recovery/.30):1);
    // Follow the preceding simulation frame, independent of playback speed.
    // Partial counterrotation leaves a little of the pelvis motion in the torso.
    m.chest.rotation.z=-.65*this.previousPelvisTilt;
    this.previousPelvisTilt=m.pelvis.rotation.z;
    m.head.quaternion.copy(m.pelvis.quaternion).multiply(m.chest.quaternion).invert();
   }
   this.actor.updateMatrixWorld(true);
   const native=this.feet.map(f=>m.raw.worldToLocal(f.position.clone()));
   // Measured support positions drive the pelvis; a damped trajectory carries
   // its velocity through steering changes instead of switching animation clips.
   const balance=clamp((native[0].x*this.weights[0]+native[1].x*this.weights[1])*.32,-.05,.05);
   const s=m.springs.reviewBalance??(m.springs.reviewBalance={x:m.pelvis.position.x,v:0});
   s.v+=((balance-s.x)*150-s.v*24)*dt;s.x+=s.v*dt;m.pelvis.position.x=s.x;
   let lift=.043*(recovery<.66?ease(recovery/.66):1-ease((recovery-.66)/.34));
   const roll=footRoll(recovery,(u-.90)/.10);
   if(step.entry){
    // Finish this existing swing rather than introducing a second lift peak.
    // Preserve the closing step's forward, vertical and ankle velocities.
    const carry=1-ease(recovery),velocity=.72*.70*tangent(recovery);
    lift=Math.max(0,step.entry.lift*carry+step.entry.liftVelocity*velocity);
    roll.pitch=step.entry.pitch*carry+step.entry.pitchVelocity*velocity;
    roll.toe=step.entry.toe*carry+step.entry.toeVelocity*velocity;
   }
   const feet=native.map((p,i)=>({x:p.x,z:p.z+.018,lift:i===active?lift:0,pitch:i===active?roll.pitch:0,toe:i===active?roll.toe:0,yaw:this.feet[i].yaw-this.yaw}));
   poseCharacterFeet(m,feet,true);
   m.pelvisVelocity=m.pelvis.position.clone().sub(previousPelvis).divideScalar(dt);
   this.phase=step.steering?(step.steering===1?'Left turn':'Right turn'):this.requested?'Walk · turn queued':'Walk';
   if(u===1){this.step=null;if(!input.forward)this.speed=0;}
  }else{
   this.previousPelvisTilt=0;
   if(m.state==='walk'&&!this.settle){
    // Model group LegR is on the character's anatomical left (+X).
    // Advance this trailing foot, rather than retracting the leading foot.
    const heading=new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw));
    const moving=this.feet[0].position.dot(heading)<this.feet[1].position.dot(heading)?0:1,leading=1-moving,forward=new THREE.Vector3(Math.sin(this.feet[leading].yaw),0,Math.cos(this.feet[leading].yaw));
    const start=this.feet[moving].position.clone();
    const distance=Math.max(0,this.feet[leading].position.clone().sub(start).dot(forward));
    this.settle={time:0,moving,start,startYaw:this.feet[moving].yaw,end:start.clone().addScaledVector(forward,distance),yaw:this.feet[leading].yaw};
    m.reviewClosingStep=true;m.reviewClosingFoot=moving;m.reviewSupportRelease=null;
   }
   this.speed=0;this.yawRate=0;updateRobotMotion(m,dt,0,this.time);
   let lift=0,closingRoll={pitch:0,toe:0};
   this.contacts=[true,true];this.weights=[.5,.5];
   if(this.settle){
    const s=this.settle;s.time+=dt;const u=clamp((s.time-.30)/.65,0,1),blend=ease(u);
    this.feet[s.moving].position.lerpVectors(s.start,s.end,blend);this.feet[s.moving].yaw=THREE.MathUtils.lerp(s.startYaw,s.yaw,blend);
    lift=u>0&&u<1?.015*Math.sin(Math.PI*u)**2:0;
    closingRoll=footRoll(u,(s.time-.95)/.14,.60);
    this.contacts[s.moving]=lift===0;
    const returnToCenter=m.reviewSupportRelease===null?0:ease((s.time-m.reviewSupportRelease)/.70);
    const support=.42*ease((s.time-.15)/.15)*(1-returnToCenter);
    this.weights[s.moving]=.5-support;this.weights[1-s.moving]=.5+support;
   }
   this.actor.updateMatrixWorld(true);
   // Keep the original settle's pelvis/chest/head curves untouched.
   poseCharacterFeet(m,this.feet.map((f,i)=>{const p=m.raw.worldToLocal(f.position.clone());const active=i===this.settle?.moving;return {x:p.x,z:p.z+.018,lift:active?lift:0,pitch:active?closingRoll.pitch:0,toe:active?closingRoll.toe:0,yaw:f.yaw-this.yaw};}));
   this.phase=m.state==='idle'?'Rest':'Settling';
  }
  // Look into the requested path before the next foot boundary steers the
  // body. Releasing steering returns gaze forward without resetting its pose.
  const look=this.headingLook,direction=input.left?1:input.right?-1:0;
  const lookTarget=(input.forward||input.left!==input.right)?direction*.48:0;
  const substeps=Math.max(1,Math.ceil(dt*120)),h=dt/substeps;
  for(let i=0;i<substeps;i++){look.velocity+=((lookTarget-look.angle)*100-look.velocity*20)*h;look.angle+=look.velocity*h;}
  if(this.walkGaze){
   const gaze=this.walkGaze;
   for(let i=0;i<substeps;i++)for(const axis of ['yaw','pitch']){
    const velocity=axis+'Velocity';gaze[velocity]+=(-gaze[axis]*49-gaze[velocity]*14)*h;gaze[axis]+=gaze[velocity]*h;
   }
   m.head.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(gaze.pitch,gaze.yaw,0,'YXZ')));
  }
  m.head.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(Y,look.angle));
  this.measure();
  // Release the support hold on touchdown, not on a separate body timer.
  if(this.settle&&this.settle.time>.60&&m.reviewSupportRelease===null&&this.clearances[this.settle.moving]<.003)m.reviewSupportRelease=this.settle.time;
 }
 measure(){
  this.actor.updateMatrixWorld(true);
  this.clearances=this.motion.footSamples.map(samples=>Math.min(...samples.map(s=>s.point.clone().applyMatrix4(s.mesh.matrixWorld).y)));
  this.actualContacts=this.clearances.map(h=>h<.008);
 }
}



