export const defaults={forward:2,reverse:1,altitude:1,yaw:45,bank:15,response:0.5};
// Compose heading, pitch, then bank around the camera's local viewing axis.
// A negative local Z roll lowers the right side of a camera looking along -Z.
export function cameraRotation({yaw,pitch,bank}){
  const half=Math.PI/360;
  const sy=Math.sin(yaw*half),cy=Math.cos(yaw*half);
  const sx=Math.sin(pitch*half),cx=Math.cos(pitch*half);
  const sz=Math.sin(bank*half),cz=Math.cos(bank*half);
  return [cy*sx*cz+sy*cx*sz,sy*cx*cz-cy*sx*sz,cy*cx*sz-sy*sx*cz,cy*cx*cz+sy*sx*sz];
}
export function initial(scene){return {position:[...(scene.pose?.position||[0,0.75,1.8])],yaw:scene.pose?.yaw||0,pitch:scene.pose?.pitch||0,bank:0,speed:0,climb:0,turn:0};}
export function step(s,input,dt,scene){
  const c={...defaults,...scene.speed};dt=Math.min(dt,0.05);
  const a=1-Math.exp(-dt/(Math.max(.05,c.response)/3));
  s.speed+=(input.speed*(input.speed>=0?c.forward:c.reverse)-s.speed)*a;
  s.climb+=(input.altitude*c.altitude-s.climb)*a;
  s.turn+=(input.yaw*c.yaw-s.turn)*a;
  s.yaw=(s.yaw-s.turn*dt)%360;
  const angle=s.yaw*Math.PI/180;
  s.position[0]-=Math.sin(angle)*s.speed*dt;
  s.position[2]-=Math.cos(angle)*s.speed*dt;
  s.position[1]+=s.climb*dt;
  const bankTarget=-s.turn/Math.max(1,c.yaw)*c.bank*Math.min(1,Math.abs(s.speed)/Math.max(.01,c.forward,c.reverse));
  s.bank+=(bankTarget-s.bank)*a;
  if(scene.bounds)for(let i=0;i<3;i++)s.position[i]=Math.max(scene.bounds.min[i],Math.min(scene.bounds.max[i],s.position[i]));
  return s;
}
