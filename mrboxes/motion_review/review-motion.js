import * as THREE from './three.module.js';

const TAU=Math.PI*2, clamp=THREE.MathUtils.clamp;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
// Zero velocity and acceleration at each end of a weight-transfer stage.
const settleEase=t=>{t=clamp(t,0,1);return t*t*t*(t*(t*6-15)+10)};
const mix=THREE.MathUtils.lerp;
// Cubic motion curves share tangents across keys, so weight keeps travelling
// through the intermediate poses instead of stopping at each support change.
function restCurve(t,keys,initialVelocity=0){
 if(t<=keys[0][0])return keys[0][1];if(t>=keys.at(-1)[0])return keys.at(-1)[1];
 let i=0;while(t>keys[i+1][0])i++;
 const slope=j=>j===0?initialVelocity:j===keys.length-1?0:(keys[j+1][1]-keys[j-1][1])/(keys[j+1][0]-keys[j-1][0]);
 const [ta,a]=keys[i],[tb,b]=keys[i+1],d=tb-ta,u=(t-ta)/d;
 return (2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*d*slope(i)+(-2*u**3+3*u*u)*b+(u**3-u*u)*d*slope(i+1);
}
const STEP_CLEARANCE=.060;
const strideReach=p=>p<.60?1-2*p/.60:2*smooth((p-.60)/.40)-1;
const down=new THREE.Vector3(0,-1,0), shin=new THREE.Vector3(0,-.253,-.018).normalize();

export function prepareRobotMotion(body,type='patrol'){
 const raw=body.getObjectByName('Body').parent;
 function joint(name,parent,position,parts=[]){
  const g=new THREE.Group();g.name=name;g.position.set(...position);parent.add(g);body.updateMatrixWorld(true);
  for(const id of parts){const p=body.getObjectByName('tripo_part_'+id);if(!p)throw Error('Missing robot part '+id);g.attach(p)}return g;
 }
 const hips=['L','R'].map(s=>body.getObjectByName('Leg'+s)),shoulders=['L','R'].map(s=>body.getObjectByName('Arm'+s));
 const knees=[joint('KneeL',hips[0],[0,-.23,0],[3,7,9,13,17,29,36,50,51]),joint('KneeR',hips[1],[0,-.23,0],[5,8,11,19,21,23,32])];
 const ankles=[joint('AnkleL',knees[0],[0,-.253,-.018],[13,17,29,36,50,51]),joint('AnkleR',knees[1],[0,-.253,-.018],[8,21,23,32])];
 const toes=[joint('ToeL',ankles[0],[0,-.061,.043],[29,36]),joint('ToeR',ankles[1],[0,-.061,.043],[21,32])];
 const elbows=[joint('ElbowL',shoulders[0],[-.035,-.165,-.032],[14,16,24,27,42,46,48,49,54,55,57,58]),joint('ElbowR',shoulders[1],[.035,-.165,-.032],[15,18,26,38,41,43,47,52,53,56])];
 shoulders[1].attach(body.getObjectByName('tripo_part_40'));
 const pelvis=joint('Pelvis',raw,[0,.57,0],[12,44,45]);
 hips.forEach(h=>pelvis.attach(h));
 const chest=joint('Chest',pelvis,[0,.075,0]);chest.attach(body.getObjectByName('Body'));shoulders.forEach(s=>chest.attach(s));
 const head=joint('Head',chest,[0,.205,.012],[33]);
 // Local corner samples keep rolled heels and articulated toes above the floor.
 body.updateMatrixWorld(true);
 const footSamples=ankles.map(ankle=>{
  const samples=[];ankle.traverse(o=>{if(!o.isMesh)return;o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;for(let n=0;n<8;n++)samples.push({mesh:o,point:new THREE.Vector3(n&1?b.max.x:b.min.x,n&2?b.max.y:b.min.y,n&4?b.max.z:b.min.z)})});return samples;
 });
 const m={body,raw,hips,knees,ankles,toes,shoulders,elbows,pelvis,chest,head,footSamples,type,cycle:0,amount:0,state:'idle',stopTime:2,idleTime:0,springs:{},scale:raw.scale.x*body.scale.x,actorScale:body.parent?.scale.z??1,feet:[{x:-.112,z:0,lift:0,pitch:0,toe:0,yaw:.06},{x:.112,z:0,lift:0,pitch:0,toe:0,yaw:-.06}]};
 updateRobotMotion(m,0,0,0);return m;
}

// Damped secondary motion: the arms and head arrive after the hips/chest.
function spring(m,key,target,dt,k=65,d=11){
 const s=m.springs[key]??(m.springs[key]={x:target,v:0});
 const steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;
 for(let i=0;i<steps;i++){s.v+=((target-s.x)*k-s.v*d)*h;s.x+=s.v*h}return s.x;
}
function footHeight(m,i){
 const ankle=m.ankles[i];ankle.updateWorldMatrix(true,true);
 const inv=ankle.matrixWorld.clone().invert();let min=Infinity;
 for(const sample of m.footSamples[i]){
  const p=sample.point.clone().applyMatrix4(sample.mesh.matrixWorld).applyMatrix4(inv).applyQuaternion(ankle.userData.floorRotation);
  min=Math.min(min,p.y);
 }return -min;
}
function solveLeg(m,i,foot){
 const hip=m.hips[i],knee=m.knees[i],ankle=m.ankles[i];
 const floorQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(foot.pitch,foot.yaw,0,'YXZ'));
 ankle.userData.floorRotation=floorQ;m.toes[i].rotation.x=foot.toe;
 const height=footHeight(m,i);
 m.pelvis.updateMatrix();const pelvic=m.pelvis.matrix;
 const h=hip.position.clone().applyMatrix4(pelvic),target=new THREE.Vector3(foot.x,height+foot.lift,foot.z-.018);
 const delta=target.clone().sub(h),length=delta.length(),l1=.23,l2=Math.hypot(.253,.018),d=clamp(length,.05,l1+l2-.00001),dir=delta.normalize();
 // Bend the knee toward the travel direction while the hip socket twists.
 const bend=new THREE.Vector3(0,0,1).addScaledVector(dir,-dir.z).normalize();
 const along=(l1*l1-l2*l2+d*d)/(2*d),out=Math.sqrt(Math.max(0,l1*l1-along*along));
 const k=h.clone().addScaledVector(dir,along).addScaledVector(bend,out);
 const invPelvis=m.pelvis.quaternion.clone().invert();
 hip.quaternion.setFromUnitVectors(down,k.clone().sub(h).normalize().applyQuaternion(invPelvis));
 const parentQ=m.pelvis.quaternion.clone().multiply(hip.quaternion);
 knee.quaternion.setFromUnitVectors(shin,target.clone().sub(k).normalize().applyQuaternion(parentQ.clone().invert()));
 parentQ.multiply(knee.quaternion);ankle.quaternion.copy(parentQ.invert().multiply(floorQ));
 m.feet[i]={...foot};
}
function walkFoot(m,i){
 const p=(m.cycle+i*.5)%1,stance=.60;
 const stride=m.type==='heavy'?1.85:m.type==='scout'?2.1:1.95;
 const half=stride*stance/(2*m.scale*m.actorScale);
 let z,lift=0,pitch=0,toe=0;
 if(p<stance){
  z=half*(1-2*p/stance);
  // Heel contact, flat weight bearing, then rolling push-off.
  pitch=-.24*(1-smooth(p/.10))+.38*smooth((p-.44)/.16);
  toe=-.31*smooth((p-.46)/.14);
 }else{
  const u=(p-stance)/(1-stance);z=mix(-half,half,smooth(u));
  // Lifting the heavy leg takes two thirds of recovery; gravity brings it
  // down over the remaining third. Prepare the heel before contact.
  lift=STEP_CLEARANCE*(u<.66?smooth(u/.66):1-smooth((u-.66)/.34));
  pitch=u<.66?mix(.38,.10,smooth(u/.66)):mix(.10,-.24,smooth((u-.66)/.26));
  // Release the push-off bend, let the toes hang, then extend for landing.
  toe=u<.35?mix(-.31,.18,smooth(u/.35)):.18*(1-smooth((u-.66)/.24));
 }
 return {x:(i===0?-1:1)*(.112+.008*m.amount),z:z*m.amount,lift:lift*m.amount,pitch:pitch*m.amount,toe:toe*m.amount,yaw:(i===0?.06:-.06)};
}

export function updateRobotMotion(m,dt,distance,time){
 dt=clamp(dt,0,.05);const moving=dt>0&&distance/dt>.035;
 if(m.turnActive&&moving){
  // The opposite foot starts recovery now; the turning foot has already
  // accepted weight. Avoid adding another double-support delay to the turn.
  m.cycle=(m.cycle+.10)%1;
  m.walkHandover={time:0,cycles:0,position:m.pelvis.position.clone(),rotation:m.pelvis.quaternion.clone(),velocity:m.pelvisVelocity?.clone()??new THREE.Vector3(),feet:m.feet.map((f,i)=>{
   const gait=walkFoot(m,i),phase=(m.cycle+i*.5)%1;
   return {x:f.x-gait.x,z:f.z-gait.z,pitch:f.pitch-gait.pitch,toe:f.toe-gait.toe,yaw:f.yaw-gait.yaw,swing:Math.max(0,.60-phase)};
  })};
 }
 m.turnActive=false;
 if(!moving)m.walkHandover=null;
 if(moving){
  m.state='walk';m.stopTime=0;m.idleTime=0;m.amount=mix(m.amount,1,1-Math.exp(-dt*5));
  const stride=m.type==='heavy'?1.85:m.type==='scout'?2.1:1.95;m.cycle=(m.cycle+distance/stride)%1;
  if(m.walkHandover){m.walkHandover.time+=dt;m.walkHandover.cycles+=distance/stride;}
 }else if(m.state==='walk'){
  m.state='settle';m.stopTime=0;m.stopAmount=m.amount;m.stopFeet=m.feet.map(f=>({...f}));
  m.stopPelvis=m.pelvis.position.clone();m.stopRotation=m.pelvis.rotation.clone();m.stopChest=m.chest.rotation.clone();
  m.stopVelocity=m.pelvisVelocity?.clone()??new THREE.Vector3();
  // Recover the raised foot first; then make a separate balancing step.
  m.firstFoot=m.feet[0].lift>m.feet[1].lift?0:1;
  if(m.reviewClosingStep)m.firstFoot=m.reviewClosingFoot??1;
 }
 if(m.state==='settle'){
  m.stopTime+=dt;m.amount=m.stopAmount*(1-settleEase((m.stopTime-.12)/1.50));
  if(m.stopTime>=1.85){m.state='idle';m.amount=0;m.idleTime=0}
 }
 if(m.state==='idle')m.idleTime+=dt;
 const a=m.amount,phase=m.cycle*TAU;
 const sway=Math.sin(phase),twist=Math.cos(phase);
 const gaitFeet=[walkFoot(m,0),walkFoot(m,1)];
 if(m.walkHandover)for(let i=0;i<2;i++){
  const h=m.walkHandover,offset=h.feet[i],foot=gaitFeet[i];
  const keep=1-settleEase((h.cycles-offset.swing)/.40),roll=1-settleEase(h.time/.28);
  gaitFeet[i]={...foot,x:foot.x+offset.x*keep,z:foot.z+offset.z*keep,yaw:foot.yaw+offset.yaw*keep,pitch:foot.pitch+offset.pitch*roll,toe:foot.toe+offset.toe*roll};
 }
 const liftL=gaitFeet[0].lift/STEP_CLEARANCE,liftR=gaitFeet[1].lift/STEP_CLEARANCE;
 const contact=(m.cycle*2)%1,load=Math.exp(-Math.pow(contact/.11,2));
 const previousPelvis=m.pelvis.position.clone();
 // The raised-side hip hikes with the leg, then the pelvis compresses as
 // the heel accepts weight. This is driven by foot timing, not a free bob.
 m.pelvis.position.set(sway*.020*a,.57-.010-.055*a+.020*(liftL+liftR)-.005*load*a,.009*a);
 if(m.state==='settle'){
  const t=m.stopTime,side=m.firstFoot===0?-1:1;
  const support=m.stopFeet[1-m.firstFoot].x*.36,next=side*.112*.36;
  // A shallow curved weight shift, with elevation already recovering during
  // the foot adjustment. Central balance follows the second contact at 1.06s.
  m.pelvis.position.set(
   restCurve(t,[[0,m.stopPelvis.x],[.25,support],[.48,support*.75],[.76,next],[1.06,next],[1.48,.003*side],[1.85,0]],m.stopVelocity.x),
   restCurve(t,[[0,m.stopPelvis.y],[.22,m.stopPelvis.y-.004],[.52,mix(m.stopPelvis.y,.560,.26)],[.86,mix(m.stopPelvis.y,.560,.60)],[1.20,.557],[1.52,.562],[1.85,.560]],m.stopVelocity.y),
   restCurve(t,[[0,m.stopPelvis.z],[.25,m.stopFeet[1-m.firstFoot].z*.16],[.64,.014],[1.12,.007],[1.60,0],[1.85,0]],m.stopVelocity.z));
  if(m.reviewClosingStep){
   // Hold the right-side support until the closing left foot touches down.
   // Only lateral balance changes; retain the approved rise and torso motion.
   const rightSupport=m.stopFeet[1-(m.reviewClosingFoot??1)].x*.36;
   if(t<.30)m.pelvis.position.x=restCurve(t,[[0,m.stopPelvis.x],[.30,rightSupport]],m.stopVelocity.x);
   else m.pelvis.position.x=rightSupport*(1-(m.reviewSupportRelease===null?0:settleEase((t-m.reviewSupportRelease)/.70)));
  }
 }
 m.pelvis.rotation.set(.025*a,.20*twist*a,.060*(liftR-liftL),'YXZ');
 if(m.state==='settle'){
  const t=m.stopTime,side=m.firstFoot===0?-1:1;
  m.pelvis.rotation.set(
   restCurve(t,[[0,m.stopRotation.x],[.4,.018],[1.1,-.008],[1.85,0]]),
   restCurve(t,[[0,m.stopRotation.y],[.38,m.stopRotation.y*.70],[.84,-side*.035],[1.4,side*.008],[1.85,0]]),
   restCurve(t,[[0,m.stopRotation.z],[.25,side*.035],[.78,-side*.028],[1.3,-side*.008],[1.85,0]]),'YXZ');
 }
 if(m.walkHandover){
  const h=m.walkHandover,u=clamp(h.time/.5,0,1),blend=settleEase(u);
  const carried=h.position.clone().addScaledVector(h.velocity,h.time*(1-u)**2);
  m.pelvis.position.lerpVectors(carried,m.pelvis.position.clone(),blend);
  m.pelvis.quaternion.slerpQuaternions(h.rotation,m.pelvis.quaternion.clone(),blend);
  // Keep the first planted contacts reachable as the torso moves forward.
  // Let the knees carry that weight rather than letting IK pull a sole up.
  for(let i=0;i<2;i++){
   const foot=gaitFeet[i],hip=m.hips[i].position.clone().applyQuaternion(m.pelvis.quaternion);
   m.ankles[i].userData.floorRotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(foot.pitch,foot.yaw,0,'YXZ'));
   m.toes[i].rotation.x=foot.toe;
   const horizontal=(m.pelvis.position.x+hip.x-foot.x)**2+(m.pelvis.position.z+hip.z-foot.z+.018)**2;
   const ceiling=footHeight(m,i)+foot.lift+Math.sqrt(Math.max(0,.481**2-horizontal))-hip.y;
   m.pelvis.position.y=mix(m.pelvis.position.y,Math.min(m.pelvis.position.y,ceiling),settleEase(h.time/.20));
  }
 }
 m.pelvisVelocity=dt>0?m.pelvis.position.clone().sub(previousPelvis).divideScalar(dt):new THREE.Vector3();
 // Waist flexion and chest counter-rotation drive the entire shoulder girdle.
 const survey=smooth((m.idleTime-.2)/.8),look=(Math.sin(m.idleTime*.75)*.34+Math.sin(m.idleTime*1.31)*.045)*survey;
 const lookPitch=Math.sin(m.idleTime*.43)*Math.sin(m.idleTime*.79)*.12*survey;
 let chestX=.035+.275*a+lookPitch*.18,chestY=-.36*twist*a+look*.3,chestZ=.037*sway*a;
 if(m.state==='settle'){
  const t=m.stopTime,side=m.firstFoot===0?-1:1;
  chestX=restCurve(t,[[0,m.stopChest.x],[.25,m.stopChest.x*.96],[.64,.16],[1.02,.07],[1.38,.022],[1.85,.035]]);
  chestY=restCurve(t,[[0,m.stopChest.y],[.3,m.stopChest.y*.85],[.68,side*.055],[1.12,-side*.022],[1.85,0]]);
  chestZ=restCurve(t,[[0,m.stopChest.z],[.38,-side*.024],[.91,side*.025],[1.45,-side*.005],[1.85,0]]);
 }
 m.chest.rotation.set(spring(m,'chestX',chestX,dt,75,15),spring(m,'chestY',chestY,dt,80,14),spring(m,'chestZ',chestZ,dt,70,13),'YXZ');
 // Cancel the pelvis/chest rotation at the neck so walking gaze remains
 // level and aligned with the actor's travel direction. Survey only at rest.
 const gaze=spring(m,'gaze',look,dt,35,8);
 const gazePitch=spring(m,'gazePitch',lookPitch,dt,30,8);
 const headTarget=new THREE.Quaternion().setFromEuler(new THREE.Euler(m.state==='walk'?0:gazePitch,m.state==='walk'?0:gaze,0,'YXZ'));
 m.head.quaternion.copy(m.pelvis.quaternion).multiply(m.chest.quaternion).invert().multiply(headTarget);
 for(let i=0;i<2;i++){
  const armCycle=m.cycle+(m.state==='settle'?.12*(1-Math.exp(-m.stopTime*3)):0);
  const side=i===0?-1:1,p=(armCycle+i*.5)%1;
  // Each arm follows the opposite leg's reach. A small lead compensates
  // for shoulder inertia and brings the swing ahead of heel contact;
  // forearms retain their delayed follow-through.
  const arm=-strideReach((p+.5+.13)%1);
  m.shoulders[i].rotation.set(spring(m,'armX'+i,.08+.64*arm*a,dt,110,17),spring(m,'armY'+i,side*.07*a,dt,65,11),spring(m,'armZ'+i,side*(.060+.120*a),dt),'YXZ');
  m.elbows[i].rotation.x=spring(m,'elbow'+i,-.26-a*(.18+.22*Math.cos((p-.21)*TAU)),dt,52,9);
  let foot=gaitFeet[i];
  if(m.state==='settle'){
   const isFirst=i===m.firstFoot,start=isFirst?0:.66,duration=isFirst?.46:.40,u=clamp((m.stopTime-start)/duration,0,1),t=settleEase(u),old=m.stopFeet[i];
   foot={x:mix(old.x,side*.112,t),z:mix(old.z,0,t),lift:mix(old.lift,0,t)+.032*Math.pow(Math.sin(Math.PI*u),2),pitch:mix(old.pitch,0,t),toe:mix(old.toe,0,t),yaw:mix(old.yaw,-side*.06,t)};
  }else if(m.state==='idle')foot={x:side*.112,z:0,lift:0,pitch:0,toe:0,yaw:-side*.06};
  solveLeg(m,i,foot);
 }
 if(m.walkHandover&&m.walkHandover.cycles>=Math.max(...m.walkHandover.feet.map(f=>f.swing))+.40)m.walkHandover=null;
}

// Used by the character playground to keep the supporting foot planted through turns.
export function poseCharacterFeet(m,feet,softKnees=false){
 if(softKnees){
  // Reserve knee flexion rather than letting IK approach a locked leg.
  const reach=Math.sqrt(.23**2+(.253**2+.018**2)+2*.23*Math.hypot(.253,.018)*Math.cos(35*Math.PI/180));
  let desiredY=m.pelvis.position.y;
  for(let i=0;i<2;i++){
   const f=feet[i],hip=m.hips[i].position.clone().applyQuaternion(m.pelvis.quaternion);
   m.ankles[i].userData.floorRotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(f.pitch,f.yaw,0,'YXZ'));m.toes[i].rotation.x=f.toe;
   const horizontal=(m.pelvis.position.x+hip.x-f.x)**2+(m.pelvis.position.z+hip.z-f.z+.018)**2;
   const ceiling=footHeight(m,i)+f.lift+Math.sqrt(Math.max(0,reach**2-horizontal))-hip.y;
   const difference=desiredY-ceiling;
   desiredY-=.5*(difference+Math.sqrt(difference*difference+.000004));
  }
  const correction=m.springs.kneeReserve??(m.springs.kneeReserve={x:0,v:0});
  const target=m.pelvis.position.y-desiredY;
  // Follow an upward body bounce promptly enough to retain knee flexion;
  // retain the gentler recovery as the pelvis lowers.
  for(let n=0;n<2;n++){const rising=target>correction.x;correction.v+=((target-correction.x)*(rising?360:180)-correction.v*(rising?38:27))/120;correction.x+=correction.v/120;}
  m.pelvis.position.y-=correction.x;
 }
 for(let i=0;i<2;i++)solveLeg(m,i,feet[i]);
}

// Turning owns the body trajectory; do not sample and reset the walking cycle
// between its foot placements. Springs retain position and velocity at contact.
export function updateCharacterTurn(m,dt,foot,u,distance,serial){
 // The actual walking gaze is forward. Keep its spring state in agreement
 // so entering settle cannot restore an old idle survey orientation.
 m.springs.gaze={x:0,v:0};m.springs.gazePitch={x:0,v:0};
 m.walkHandover=null;
 const previous=m.pelvis.position.clone();
 if(!m.turnActive){
  m.turnArmSerial=null;m.turnArmTargets=m.shoulders.map(s=>s.rotation.x);
  for(const [key,value] of Object.entries({turnX:m.pelvis.position.x,turnY:m.pelvis.position.y,turnZ:m.pelvis.position.z,turnRX:m.pelvis.rotation.x,turnRY:m.pelvis.rotation.y,turnRZ:m.pelvis.rotation.z}))m.springs[key]={x:value,v:0};
 }
 if(m.turnArmSerial!==serial){
  m.turnArmSerial=serial;
  // Carry the previous swing endpoint across steps, including the same-foot
  // boundary between successive three-step turns. Never restart at -amplitude.
  m.turnArmStarts=[...m.turnArmTargets];
 }
 m.turnActive=true;m.state='walk';m.stopTime=0;m.idleTime=0;
 m.amount=mix(m.amount,1,1-Math.exp(-dt*5));
 const a=m.amount,side=foot===0?-1:1,envelope=Math.sin(Math.PI*u)**2;
 const twist=side*Math.sin(TAU*u)*.09*a;
 m.pelvis.position.set(spring(m,'turnX',-side*.018*envelope*a,dt,95,19),spring(m,'turnY',.560-.055*a+.009*envelope*a,dt,100,20),spring(m,'turnZ',.006*a,dt,95,19));
 m.pelvis.rotation.set(spring(m,'turnRX',.018*a,dt),spring(m,'turnRY',twist,dt,100,18),spring(m,'turnRZ',side*.035*envelope*a,dt,90,18),'YXZ');
 m.pelvisVelocity=dt>0?m.pelvis.position.clone().sub(previous).divideScalar(dt):new THREE.Vector3();
 m.chest.rotation.set(spring(m,'chestX',.035+(distance>0?.20:.11)*a,dt,75,15),spring(m,'chestY',-twist*1.5,dt,80,14),spring(m,'chestZ',-side*.022*envelope*a,dt,70,13),'YXZ');
 m.head.quaternion.copy(m.pelvis.quaternion).multiply(m.chest.quaternion).invert();
 const lead=settleEase(u/.78);
 for(let i=0;i<2;i++){
  const armSide=i===0?-1:1,end=.08+(i===foot?1:-1)*.54;
  const target=mix(m.turnArmStarts[i],end,lead);
  m.turnArmTargets[i]=target;
  m.shoulders[i].rotation.set(spring(m,'armX'+i,target,dt,110,17),spring(m,'armY'+i,armSide*.07*a,dt,65,11),spring(m,'armZ'+i,armSide*(.060+.120*a),dt),'YXZ');
  m.elbows[i].rotation.x=spring(m,'elbow'+i,-.26-.18*a,dt,52,9);
 }
 // Only retain a phase for a later transition back to forward walking.
 m.cycle=(.60+.40*u-foot*.5+1)%1;
}





