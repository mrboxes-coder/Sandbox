export const DEFAULTS = Object.freeze({deadZone:.12,maxSpeed:.9,turnSpeed:42,acceleration:4,deceleration:12,alignmentPower:1.5,pivotStart:110,pivotEnd:165,magnitudePower:1,turnResponse:8,stepDuration:.72,footLift:.043,pelvisBounce:.030,cameraOrbit:85,cameraPitch:35,minPitch:8,maxPitch:48});
export const FIELDS = {
 deadZone:['Stick dead zone',0,.35,.01], maxSpeed:['Maximum speed (units/s)',.1,1.2,.05],
 turnSpeed:['Turn speed (degrees/s)',10,60,1],acceleration:['Acceleration response (1/s)',1,20,1],deceleration:['Braking response (1/s)',4,30,1],
 alignmentPower:['Alignment curve power',.5,4,.1],pivotStart:['Pivot suppression starts (degrees)',90,130,1],pivotEnd:['Full pivot (degrees)',140,180,1],magnitudePower:['Stick magnitude power',.5,3,.1],turnResponse:['Turn response (1/s)',2,20,1],
 stepDuration:['Step duration (seconds)',.5,1,.01],footLift:['Foot lift (model units)',.01,.08,.001],pelvisBounce:['Pelvis bounce (model units)',0,.05,.001],
 cameraOrbit:['Camera orbit (degrees/s)',20,150,5],cameraPitch:['Camera elevation (degrees/s)',10,60,1],minPitch:['Minimum camera elevation',5,20,1],maxPitch:['Maximum camera elevation',30,65,1]
};
const key='mrboxes-mobile-settings-v1';
export function sanitize(values){const result={...DEFAULTS};for(const [name,[,min,max]] of Object.entries(FIELDS)){const v=values?.[name];if(Number.isFinite(v))result[name]=Math.min(max,Math.max(min,v));}return result;}
export function loadSettings(){try{return sanitize(JSON.parse(localStorage.getItem(key)));}catch{return {...DEFAULTS};}}
export const settings=loadSettings();
export function saveSettings(values){Object.assign(settings,sanitize(values));try{localStorage.setItem(key,JSON.stringify(settings));return true;}catch{return false;}}
