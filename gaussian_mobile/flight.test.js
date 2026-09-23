import {test} from 'node:test';import assert from 'node:assert/strict';import {initial,step,cameraRotation} from './flight.js';
const tick=(s,input,scene={},n=120)=>{for(let i=0;i<n;i++)step(s,input,1/60,scene);return s;};
test('forward follows heading and bank does not affect altitude',()=>{const scene={pose:{position:[0,2,0],yaw:90}},s=initial(scene);tick(s,{speed:1,yaw:.5,altitude:0},scene);assert.equal(s.position[1],2);assert.ok(s.position[0]<0);assert.ok(Math.abs(s.bank)<=15);});
test('release brakes to hover',()=>{const s=initial({});tick(s,{speed:1,yaw:1,altitude:1});tick(s,{speed:0,yaw:0,altitude:0},{},60);assert.ok(Math.abs(s.speed)<.006);assert.ok(Math.abs(s.climb)<.003);assert.ok(Math.abs(s.turn)<.12);});
test('hover turn has no banking or translation',()=>{const s=initial({}),p=[...s.position];tick(s,{speed:0,yaw:1,altitude:0});assert.deepEqual(s.position,p);assert.equal(s.bank,0);assert.ok(s.yaw<0);});
test('bounds clamp all axes',()=>{const scene={bounds:{min:[-1,0,-1],max:[1,1,1]}},s=initial(scene);tick(s,{speed:1,yaw:0,altitude:1},scene,600);assert.deepEqual(s.position,[0,1,-1]);});
test('reverse travels opposite heading',()=>{const s=initial({});tick(s,{speed:-1,yaw:0,altitude:0});assert.ok(s.position[2]>1.8);});
test('right bank lowers camera right side at every heading; left bank raises it',()=>{
  for(const yaw of [0,45,90,135,180,225,270,315]){
    for(const direction of [-1,1]){
      const s=initial({});tick(s,{speed:1,yaw:direction,altitude:0});
      for(const pitch of [-30,0,30]){
        const [x,y,z,w]=cameraRotation({...s,yaw,pitch});
        // Rotating the camera right vector (1,0,0): its world Y component.
        const rightY=2*(x*y+w*z);
        assert.ok(rightY*direction<0,`bank direction at yaw ${yaw}, pitch ${pitch}`);
        assert.ok(Math.abs(rightY-Math.cos(pitch*Math.PI/180)*Math.sin(s.bank*Math.PI/180))<1e-12);
      }
    }
  }
});
