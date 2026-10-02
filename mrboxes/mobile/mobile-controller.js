import {settings} from './mobile-settings.js';
const TAU=Math.PI*2,rad=Math.PI/180;
export const wrap=a=>((a+Math.PI)%TAU+TAU)%TAU-Math.PI;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function alignmentFactor(error,cfg=settings){
 const angle=Math.abs(wrap(error));
 const alignment=((1+Math.cos(angle))/2)**cfg.alignmentPower;
 const pivot=1-smooth((angle/rad-cfg.pivotStart)/(cfg.pivotEnd-cfg.pivotStart));
 return alignment*pivot;
}
// +Z is the robot's forward. Positive yaw is its anatomical left.
// A gesture latches the current facing; orbiting never changes movement intent.
export class MobileController {
 constructor(cfg=settings){this.cfg=cfg;this.reset();}
 reset(){this.nearBehind=false;this.active=false;this.baseYaw=0;this.previousAngle=null;this.sweep=0;this.turnSign=-1;this.rate=0;this.lastError=0;}
 sample(x,y,yaw,dt=1/60){
  const cfg=this.cfg,magnitude=Math.min(1,Math.hypot(x,y));
  if(magnitude<=cfg.deadZone){this.active=false;this.nearBehind=false;this.previousAngle=null;this.sweep=0;this.rate=0;this.lastError=0;return {analog:true,active:false,forward:false,left:false,right:false,speed:0,yawRate:0,requestedSpeed:0,error:0};}
  if(!this.active){this.active=true;this.baseYaw=yaw;this.previousAngle=null;this.sweep=0;}
  const angle=Math.atan2(-x,y);
  if(this.previousAngle!==null){const delta=wrap(angle-this.previousAngle);if(Math.abs(delta)>.003&&Math.abs(delta)<Math.PI-.02)this.sweep=Math.sign(delta);}
  this.previousAngle=angle;
  let error=wrap(this.baseYaw+angle-yaw);
  // Hysteresis at the antipode: preserve the last sweep / turn choice, with
  // clockwise (-yaw) as the stable no-history tie break. Exit at 155 degrees.
  if(Math.abs(error)>155*rad){
   if(!this.nearBehind){this.turnSign=this.sweep||Math.sign(this.rate)||-1;}
   this.nearBehind=true;
   if(Math.abs(error)>170*rad||Math.sign(error)!==this.turnSign)error=this.turnSign*(Math.sign(error)===this.turnSign?Math.abs(error):TAU-Math.abs(error));
  }else{this.nearBehind=false;this.turnSign=Math.sign(error)||this.turnSign;}
  const request=clamp((magnitude-cfg.deadZone)/(1-cfg.deadZone))**cfg.magnitudePower*cfg.maxSpeed;
  const desired=clamp(error*4,-cfg.turnSpeed*rad,cfg.turnSpeed*rad);
  this.rate+=(desired-this.rate)*(1-Math.exp(-dt*cfg.turnResponse));
  if(Math.sign(this.rate)===Math.sign(error))this.rate=Math.sign(error)*Math.min(Math.abs(this.rate),Math.abs(error)/dt);
  if(Math.abs(error)<.0005){this.rate=0;error=0;}
  this.lastError=error;
  return {analog:true,active:true,forward:true,left:this.rate>.001,right:this.rate<-.001,speed:request*alignmentFactor(error,cfg),yawRate:this.rate,requestedSpeed:request,error};
 }
}
