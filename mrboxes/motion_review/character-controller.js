const ease=t=>t*t*t*(t*(t*6-15)+10);
// A turn is three 30-degree foot placements. Keeping this state independent
// of rendering makes key release, step order and exact turn angles testable.
export class CharacterController{
 constructor(){this.yaw=0;this.speed=0;this.turn=null;this.stepDuration=.68;this.completeTurnOnRelease=false;this.stepSerial=0;this.continuation=null}
 advance(dt,keys){
  const direction=keys.left===keys.right?0:keys.left?1:-1;
  // Releasing steering does not undo a planted step. Keep the opposite foot
  // next through a rest (and a direction reversal), until normal walking resumes.
  if(!this.turn&&!direction&&keys.forward)this.continuation=null;
  if(!this.turn&&direction){
   const firstFoot=this.continuation?.foot??(direction===1?1:0);
   this.turn={direction,firstFoot,step:0,elapsed:0,startYaw:this.yaw,initialYaw:this.yaw};this.continuation=null;this.stepSerial++;
  }
  const desired=keys.forward?(this.turn?.85:1.3):0;this.speed+=(desired-this.speed)*(1-Math.exp(-dt*(keys.forward?5:12)));
  if(!keys.forward&&this.speed<.03)this.speed=0;
  let event=null;
  if(this.turn){
   const t=this.turn;t.elapsed+=dt;
   const u=Math.min(1,t.elapsed/this.stepDuration);this.yaw=t.startYaw+t.direction*Math.PI/6*ease(u);
   event={kind:'turn',direction:t.direction,step:t.step,foot:(t.firstFoot+t.step)%2,u,serial:this.stepSerial};
   if(u===1){
    if(t.step===2||(!this.completeTurnOnRelease&&direction!==t.direction)){
     this.continuation={direction:t.direction,foot:1-event.foot};
     this.turn=null;event.finished=true;
    }
    else{t.step++;t.elapsed=0;t.startYaw=this.yaw;this.stepSerial++}
   }
   return {...event,yaw:this.yaw,distance:this.speed*dt};
  }
  return {kind:this.speed>0?'walk':'rest',yaw:this.yaw,distance:this.speed*dt};
 }
}
