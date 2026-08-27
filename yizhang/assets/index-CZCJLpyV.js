const qt={skyZenith:1713984,skyMid:3885667,skyHorizon:7172741,skyWarm:12159587,sunDisc:16766888,keyLight:16763279,fillSky:9416925,fillBounce:7164736,rimLight:11125734,crackLight:16751686,rockTop:6971477,rockBody:4934222,rockDeep:3092792,rockFresh:9143160,grime:2367260,crackCore:16761963,crackDeep:14177308,fog:3358810,cloudLit:10390390,cloudShadow:4608106,leather:4535593,leatherWorn:6507577,metal:9277331,metalWarm:11570014,cloth:4672857,clothDim:3027772,skin:9068359},bl={cotton:14928264,granite:8227481,gale:6538932,frost:10475759,spring:13209407,afterimage:11832030,magnet:13193027,meteor:14710848},Pc=10134189,kr={high:{name:"high",dprCap:2,msaa:4,shadows:!0,shadowMapSize:2048,softShadows:!0,rimLight:!0,crackFillLight:!0,texRock:512,texDetail:256,normalMaps:!0,sheenCloth:!0,envSize:256,islandRadialSegments:128,islandProfileSegments:26,plateBevel:!0,plateCurveSegments:10,capsuleSegments:12,rockChunks:7,cloudLayers:3,dustBudget:900,emberBudget:220,debrisPerBurst:7,debrisBudget:120,mergedDebris:!1,decalBudget:24,shockRings:2,footDust:!0,bloom:!0,bloomScale:.5,bloomIterations:3,bloomStrength:.9},mid:{name:"mid",dprCap:1.5,msaa:2,shadows:!0,shadowMapSize:1024,softShadows:!1,rimLight:!0,crackFillLight:!0,texRock:256,texDetail:128,normalMaps:!0,sheenCloth:!1,envSize:128,islandRadialSegments:80,islandProfileSegments:18,plateBevel:!0,plateCurveSegments:6,capsuleSegments:8,rockChunks:4,cloudLayers:2,dustBudget:380,emberBudget:96,debrisPerBurst:4,debrisBudget:56,mergedDebris:!1,decalBudget:12,shockRings:1,footDust:!0,bloom:!0,bloomScale:.25,bloomIterations:2,bloomStrength:.8},low:{name:"low",dprCap:1.25,msaa:0,shadows:!1,shadowMapSize:512,softShadows:!1,rimLight:!0,crackFillLight:!0,texRock:128,texDetail:64,normalMaps:!1,sheenCloth:!1,envSize:64,islandRadialSegments:44,islandProfileSegments:12,plateBevel:!1,plateCurveSegments:3,capsuleSegments:6,rockChunks:2,cloudLayers:1,dustBudget:140,emberBudget:32,debrisPerBurst:2,debrisBudget:20,mergedDebris:!0,decalBudget:4,shockRings:1,footDust:!1,bloom:!1,bloomScale:.125,bloomIterations:0,bloomStrength:0}},_g=["high","mid","low"];function la(i){return kr[i]?i:"mid"}const Tl=2,nr="p0";function wl(i){return{x:-Math.sin(i),z:-Math.cos(i)}}const Al=20,Cl=2.5,Rl=9;function Kt(i,t=0){return Number.isFinite(i)?i:t}function Lc(i,t,e){return i<t?t:i>e?e:i}function Pl(i){if(Number.isFinite(i))return i>>>0;if(typeof i!="string")return null;const t=i.trim().replace(/^#/,"");return/^[0-9a-fA-F]{6}$/.test(t)?Number.parseInt(t,16):null}function ir(i,t){return Pl(t)??bl[i]??Pc}function Ll(i,t={}){var r;const e=Array.isArray(i==null?void 0:i.players)?i.players.filter(Boolean):[],n=o=>o!=null&&e.some(a=>a.id===o);if(n(t.localId))return t.localId;if(n(i==null?void 0:i.localId))return i.localId;if(n(i==null?void 0:i.selfId))return i.selfId;if(n(i==null?void 0:i.playerId))return i.playerId;if(n(t.followId))return t.followId;const s=e.find(o=>o.kind==="human"||o.isLocal===!0);return s?s.id:n(nr)?nr:((r=e[0])==null?void 0:r.id)??nr}function Dl(i){var r;const t=(i==null?void 0:i.arena)??{},e=Kt(t.radius,Kt(i==null?void 0:i.arenaRadius,Kt((r=i==null?void 0:i.config)==null?void 0:r.arenaRadius,Al))),n=Kt(t.tileSize,Cl),s=Kt(t.cols,Math.ceil(e*2/n));return{radius:e,tileSize:n,cols:s,origin:Kt(t.origin,-(s*n)/2),floorY:Kt(t.floorY,0),brokenCount:Kt(t.brokenCount,0)}}function Il(i){return i.alive===!1||i.broken===!0||i.destroyed===!0?!0:Kt(i.hp,1)<=0}function Ul(i,t){var s;const e=((s=i==null?void 0:i.arena)==null?void 0:s.tiles)??(i==null?void 0:i.tiles);if(!Array.isArray(e))return[];const n=[];for(let r=0;r<e.length;r++){const o=e[r];if(!o||typeof o!="object"||!Number.isFinite(o.x))continue;const a=Number.isFinite(o.i)?o.i:r,c=Kt(o.maxHp,Kt(o.hpMax,1)),l=Kt(o.hp,c),h=Il(o);n.push({key:String(o.id??a),index:a,x:o.x,z:Kt(o.z,Kt(o.y,0)),size:Kt(o.size,t.tileSize),seam:o.seam===!0,zone:Kt(o.zone,0),hp:l,maxHp:c,crack:h?1:Lc(Number.isFinite(o.crack)?o.crack:1-l/Math.max(c,1e-6),0,1),broken:h})}return n}function Nl(i){const t=Array.isArray(i==null?void 0:i.players)?i.players:[],e=[];for(const n of t){if(!n||n.id==null)continue;const s=n.activeGloveId??n.gloveId??null,r=Kt(n.activeSlot,0),o=n.gloveId??s,a=n.offhandId??s;e.push({id:n.id,kind:n.kind??"bot",x:Kt(n.x),y:Kt(n.y),z:Kt(n.z),yaw:Kt(n.yaw),speed:Kt(n.speed,Math.hypot(Kt(n.vx),Kt(n.vz))),alive:n.alive!==!1,grounded:n.grounded!==!1,invulnT:Kt(n.invulnT),respawnT:Kt(n.respawnT),awakenedT:Kt(n.awakenedT),awakened:n.awakened===!0||Kt(n.awakenedT)>0,meter:Kt(n.meter),combo:Kt(n.combo),attackPhase:n.attackPhase??n.phase??"idle",activeSlot:r,mainId:o,offhandId:a,activeGloveId:s,tint:ir(s,n.gloveColor??n.color),mainTint:ir(o,r===0?n.gloveColor??n.color:null),offTint:ir(a,r===1?n.gloveColor??n.color:null)})}return e}const Fl={slapstart:"swing",slap:"slap",hit:"hit",skill:"skill",ko:"ko",awaken:"awaken",awakenend:"awakenEnd",dash:"dash",jump:"jump",respawn:"respawn",switch:"switch",tilecrack:"tileCrack",tilebreak:"tileBreak",matchover:"matchOver",slapwindup:"swing",slapwhiff:"slap",ghostslap:"slap",skillcast:"skill",skillhit:"hit",meteorimpact:"heavy",parry:"heavy",kill:"ko"};function Ol(i){return String(i??"").toLowerCase().replace(/[_\-\s]/g,"")}function Bl(i,t){const e=i.power??i.impulse??i.strength??i.damage;return Number.isFinite(e)?Lc(e/Rl,.3,2.6):t==="heavy"?1.6:1}function zl(i){const t=Array.isArray(i==null?void 0:i.events)?i.events:[],e=[];for(const n of t){if(!n)continue;const s=Ol(n.type??n.kind),r=Fl[s]??null;if(!r)continue;let o=n.attackerId??n.playerId??n.ownerId??n.killerId??n.by??n.attacker??n.owner??n.id??null,a=n.targetId??n.target??n.victimId??null;r==="ko"&&(a=n.victimId??n.id??a,o=n.killerId??n.by??null),e.push({kind:r,type:n.type??r,actorId:o,targetId:a,gloveId:n.gloveId??null,skillId:n.skillId??null,tileIndex:Number.isFinite(n.i)?n.i:null,tileId:n.tileId??null,x:Number.isFinite(n.x)?n.x:null,y:Number.isFinite(n.y)?n.y:null,z:Number.isFinite(n.z)?n.z:null,yaw:Number.isFinite(n.yaw)?n.yaw:null,hits:Number.isFinite(n.hits)?n.hits:s==="slapwhiff"?0:null,power:Bl(n,r),t:Kt(n.t,Kt(i==null?void 0:i.time,0))})}return e}function kl(i,t={}){var s;const e=i&&typeof i=="object"?i:{},n=Dl(e);return{time:Kt(e.time,Kt(e.t,0)),tick:Number.isFinite(e.tick)?e.tick:null,alpha:Kt(e.alpha,1),over:((s=e.match)==null?void 0:s.over)===!0||e.over===!0,localId:Ll(e,t),arena:n,tiles:Ul(e,n),players:Nl(e),events:zl(e)}}/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const No="170",Vl=0,ha=1,Gl=2,Fo=1,Dc=2,gn=3,Ln=0,Le=1,Ce=2,Pn=0,vn=1,Xs=2,ua=3,fa=4,Hl=5,Hn=100,Wl=101,Xl=102,Yl=103,ql=104,Zl=200,Kl=201,Jl=202,$l=203,Vr=204,Gr=205,jl=206,Ql=207,th=208,eh=209,nh=210,ih=211,sh=212,rh=213,oh=214,Hr=0,Wr=1,Xr=2,Mi=3,Yr=4,qr=5,Zr=6,Kr=7,Ic=0,ah=1,ch=2,xn=0,lh=1,hh=2,uh=3,fh=4,dh=5,ph=6,mh=7,Uc=300,Si=301,yi=302,Jr=303,$r=304,Ks=306,Ei=1e3,nn=1001,jr=1002,ke=1003,gh=1004,hs=1005,Re=1006,sr=1007,sn=1008,on=1009,Nc=1010,Fc=1011,Qi=1012,Oo=1013,qn=1014,rn=1015,Ci=1016,Bo=1017,zo=1018,bi=1020,Oc=35902,Bc=1021,zc=1022,ze=1023,kc=1024,Vc=1025,vi=1026,Ti=1027,ko=1028,Vo=1029,Gc=1030,Go=1031,Ho=1033,Bs=33776,zs=33777,ks=33778,Vs=33779,Qr=35840,to=35841,eo=35842,no=35843,io=36196,so=37492,ro=37496,oo=37808,ao=37809,co=37810,lo=37811,ho=37812,uo=37813,fo=37814,po=37815,mo=37816,go=37817,_o=37818,vo=37819,xo=37820,Mo=37821,Gs=36492,So=36494,yo=36495,Hc=36283,Eo=36284,bo=36285,To=36286,_h=3200,vh=3201,Wc=0,xh=1,$e="",Ue="srgb",Ri="srgb-linear",Js="linear",se="srgb",Qn=7680,da=519,Mh=512,Sh=513,yh=514,Xc=515,Eh=516,bh=517,Th=518,wh=519,pa=35044,Rn=35048,ma="300 es",_n=2e3,Ys=2001;class Pi{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const s=this._listeners[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}}const Se=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],rr=Math.PI/180,wo=180/Math.PI;function Li(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Se[i&255]+Se[i>>8&255]+Se[i>>16&255]+Se[i>>24&255]+"-"+Se[t&255]+Se[t>>8&255]+"-"+Se[t>>16&15|64]+Se[t>>24&255]+"-"+Se[e&63|128]+Se[e>>8&255]+"-"+Se[e>>16&255]+Se[e>>24&255]+Se[n&255]+Se[n>>8&255]+Se[n>>16&255]+Se[n>>24&255]).toLowerCase()}function ve(i,t,e){return Math.max(t,Math.min(e,i))}function Ah(i,t){return(i%t+t)%t}function or(i,t,e){return(1-e)*i+e*t}function Oi(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Ie(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}class ct{constructor(t=0,e=0){ct.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(ve(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Xt{constructor(t,e,n,s,r,o,a,c,l){Xt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,c,l)}set(t,e,n,s,r,o,a,c,l){const h=this.elements;return h[0]=t,h[1]=s,h[2]=a,h[3]=e,h[4]=r,h[5]=c,h[6]=n,h[7]=o,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],h=n[4],u=n[7],f=n[2],d=n[5],g=n[8],v=s[0],m=s[3],p=s[6],y=s[1],E=s[4],_=s[7],D=s[2],S=s[5],A=s[8];return r[0]=o*v+a*y+c*D,r[3]=o*m+a*E+c*S,r[6]=o*p+a*_+c*A,r[1]=l*v+h*y+u*D,r[4]=l*m+h*E+u*S,r[7]=l*p+h*_+u*A,r[2]=f*v+d*y+g*D,r[5]=f*m+d*E+g*S,r[8]=f*p+d*_+g*A,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8];return e*o*h-e*a*l-n*r*h+n*a*c+s*r*l-s*o*c}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8],u=h*o-a*l,f=a*c-h*r,d=l*r-o*c,g=e*u+n*f+s*d;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/g;return t[0]=u*v,t[1]=(s*l-h*n)*v,t[2]=(a*n-s*o)*v,t[3]=f*v,t[4]=(h*e-s*c)*v,t[5]=(s*r-a*e)*v,t[6]=d*v,t[7]=(n*c-l*e)*v,t[8]=(o*e-n*r)*v,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*o+l*a)+o+t,-s*l,s*c,-s*(-l*o+c*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(ar.makeScale(t,e)),this}rotate(t){return this.premultiply(ar.makeRotation(-t)),this}translate(t,e){return this.premultiply(ar.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const ar=new Xt;function Yc(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function qs(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Ch(){const i=qs("canvas");return i.style.display="block",i}const ga={};function qi(i){i in ga||(ga[i]=!0,console.warn(i))}function Rh(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function Ph(i){const t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Lh(i){const t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const jt={enabled:!0,workingColorSpace:Ri,spaces:{},convert:function(i,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===se&&(i.r=Mn(i.r),i.g=Mn(i.g),i.b=Mn(i.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(i.applyMatrix3(this.spaces[t].toXYZ),i.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===se&&(i.r=xi(i.r),i.g=xi(i.g),i.b=xi(i.b))),i},fromWorkingColorSpace:function(i,t){return this.convert(i,this.workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===$e?Js:this.spaces[i].transfer},getLuminanceCoefficients:function(i,t=this.workingColorSpace){return i.fromArray(this.spaces[t].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,t,e){return i.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function Mn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function xi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}const _a=[.64,.33,.3,.6,.15,.06],va=[.2126,.7152,.0722],xa=[.3127,.329],Ma=new Xt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Sa=new Xt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);jt.define({[Ri]:{primaries:_a,whitePoint:xa,transfer:Js,toXYZ:Ma,fromXYZ:Sa,luminanceCoefficients:va,workingColorSpaceConfig:{unpackColorSpace:Ue},outputColorSpaceConfig:{drawingBufferColorSpace:Ue}},[Ue]:{primaries:_a,whitePoint:xa,transfer:se,toXYZ:Ma,fromXYZ:Sa,luminanceCoefficients:va,outputColorSpaceConfig:{drawingBufferColorSpace:Ue}}});let ti;class Dh{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{ti===void 0&&(ti=qs("canvas")),ti.width=t.width,ti.height=t.height;const n=ti.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=ti}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=qs("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Mn(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Mn(e[n]/255)*255):e[n]=Mn(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Ih=0;class qc{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Ih++}),this.uuid=Li(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(cr(s[o].image)):r.push(cr(s[o]))}else r=cr(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function cr(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Dh.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Uh=0;class Te extends Pi{constructor(t=Te.DEFAULT_IMAGE,e=Te.DEFAULT_MAPPING,n=nn,s=nn,r=Re,o=sn,a=ze,c=on,l=Te.DEFAULT_ANISOTROPY,h=$e){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Uh++}),this.uuid=Li(),this.name="",this.source=new qc(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new ct(0,0),this.repeat=new ct(1,1),this.center=new ct(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Xt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Uc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Ei:t.x=t.x-Math.floor(t.x);break;case nn:t.x=t.x<0?0:1;break;case jr:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Ei:t.y=t.y-Math.floor(t.y);break;case nn:t.y=t.y<0?0:1;break;case jr:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Te.DEFAULT_IMAGE=null;Te.DEFAULT_MAPPING=Uc;Te.DEFAULT_ANISOTROPY=1;class oe{constructor(t=0,e=0,n=0,s=1){oe.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const c=t.elements,l=c[0],h=c[4],u=c[8],f=c[1],d=c[5],g=c[9],v=c[2],m=c[6],p=c[10];if(Math.abs(h-f)<.01&&Math.abs(u-v)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+f)<.1&&Math.abs(u+v)<.1&&Math.abs(g+m)<.1&&Math.abs(l+d+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const E=(l+1)/2,_=(d+1)/2,D=(p+1)/2,S=(h+f)/4,A=(u+v)/4,P=(g+m)/4;return E>_&&E>D?E<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(E),s=S/n,r=A/n):_>D?_<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(_),n=S/s,r=P/s):D<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(D),n=A/r,s=P/r),this.set(n,s,r,e),this}let y=Math.sqrt((m-g)*(m-g)+(u-v)*(u-v)+(f-h)*(f-h));return Math.abs(y)<.001&&(y=1),this.x=(m-g)/y,this.y=(u-v)/y,this.z=(f-h)/y,this.w=Math.acos((l+d+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Nh extends Pi{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new oe(0,0,t,e),this.scissorTest=!1,this.viewport=new oe(0,0,t,e);const s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Re,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const r=new Te(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new qc(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Dn extends Nh{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Zc extends Te{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ke,this.minFilter=ke,this.wrapR=nn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Fh extends Te{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ke,this.minFilter=ke,this.wrapR=nn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class os{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let c=n[s+0],l=n[s+1],h=n[s+2],u=n[s+3];const f=r[o+0],d=r[o+1],g=r[o+2],v=r[o+3];if(a===0){t[e+0]=c,t[e+1]=l,t[e+2]=h,t[e+3]=u;return}if(a===1){t[e+0]=f,t[e+1]=d,t[e+2]=g,t[e+3]=v;return}if(u!==v||c!==f||l!==d||h!==g){let m=1-a;const p=c*f+l*d+h*g+u*v,y=p>=0?1:-1,E=1-p*p;if(E>Number.EPSILON){const D=Math.sqrt(E),S=Math.atan2(D,p*y);m=Math.sin(m*S)/D,a=Math.sin(a*S)/D}const _=a*y;if(c=c*m+f*_,l=l*m+d*_,h=h*m+g*_,u=u*m+v*_,m===1-a){const D=1/Math.sqrt(c*c+l*l+h*h+u*u);c*=D,l*=D,h*=D,u*=D}}t[e]=c,t[e+1]=l,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,s,r,o){const a=n[s],c=n[s+1],l=n[s+2],h=n[s+3],u=r[o],f=r[o+1],d=r[o+2],g=r[o+3];return t[e]=a*g+h*u+c*d-l*f,t[e+1]=c*g+h*f+l*u-a*d,t[e+2]=l*g+h*d+a*f-c*u,t[e+3]=h*g-a*u-c*f-l*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,c=Math.sin,l=a(n/2),h=a(s/2),u=a(r/2),f=c(n/2),d=c(s/2),g=c(r/2);switch(o){case"XYZ":this._x=f*h*u+l*d*g,this._y=l*d*u-f*h*g,this._z=l*h*g+f*d*u,this._w=l*h*u-f*d*g;break;case"YXZ":this._x=f*h*u+l*d*g,this._y=l*d*u-f*h*g,this._z=l*h*g-f*d*u,this._w=l*h*u+f*d*g;break;case"ZXY":this._x=f*h*u-l*d*g,this._y=l*d*u+f*h*g,this._z=l*h*g+f*d*u,this._w=l*h*u-f*d*g;break;case"ZYX":this._x=f*h*u-l*d*g,this._y=l*d*u+f*h*g,this._z=l*h*g-f*d*u,this._w=l*h*u+f*d*g;break;case"YZX":this._x=f*h*u+l*d*g,this._y=l*d*u+f*h*g,this._z=l*h*g-f*d*u,this._w=l*h*u-f*d*g;break;case"XZY":this._x=f*h*u-l*d*g,this._y=l*d*u-f*h*g,this._z=l*h*g+f*d*u,this._w=l*h*u+f*d*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],c=e[9],l=e[2],h=e[6],u=e[10],f=n+a+u;if(f>0){const d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(h-c)*d,this._y=(r-l)*d,this._z=(o-s)*d}else if(n>a&&n>u){const d=2*Math.sqrt(1+n-a-u);this._w=(h-c)/d,this._x=.25*d,this._y=(s+o)/d,this._z=(r+l)/d}else if(a>u){const d=2*Math.sqrt(1+a-n-u);this._w=(r-l)/d,this._x=(s+o)/d,this._y=.25*d,this._z=(c+h)/d}else{const d=2*Math.sqrt(1+u-n-a);this._w=(o-s)/d,this._x=(r+l)/d,this._y=(c+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ve(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,c=e._y,l=e._z,h=e._w;return this._x=n*h+o*a+s*l-r*c,this._y=s*h+o*c+r*a-n*l,this._z=r*h+o*l+n*c-s*a,this._w=o*h-n*a-s*c-r*l,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,s=this._y,r=this._z,o=this._w;let a=o*t._w+n*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;const c=1-a*a;if(c<=Number.EPSILON){const d=1-e;return this._w=d*o+e*this._w,this._x=d*n+e*this._x,this._y=d*s+e*this._y,this._z=d*r+e*this._z,this.normalize(),this}const l=Math.sqrt(c),h=Math.atan2(l,a),u=Math.sin((1-e)*h)/l,f=Math.sin(e*h)/l;return this._w=o*u+this._w*f,this._x=n*u+this._x*f,this._y=s*u+this._y*f,this._z=r*u+this._z*f,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class U{constructor(t=0,e=0,n=0){U.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(ya.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(ya.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,c=t.w,l=2*(o*s-a*n),h=2*(a*e-r*s),u=2*(r*n-o*e);return this.x=e+c*l+o*u-a*h,this.y=n+c*h+a*l-r*u,this.z=s+c*u+r*h-o*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,c=e.z;return this.x=s*c-r*a,this.y=r*o-n*c,this.z=n*a-s*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return lr.copy(this).projectOnVector(t),this.sub(lr)}reflect(t){return this.sub(lr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(ve(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const lr=new U,ya=new os;class Jn{constructor(t=new U(1/0,1/0,1/0),e=new U(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Ye.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Ye.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=Ye.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,Ye):Ye.fromBufferAttribute(r,o),Ye.applyMatrix4(t.matrixWorld),this.expandByPoint(Ye);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),us.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),us.copy(n.boundingBox)),us.applyMatrix4(t.matrixWorld),this.union(us)}const s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Ye),Ye.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Bi),fs.subVectors(this.max,Bi),ei.subVectors(t.a,Bi),ni.subVectors(t.b,Bi),ii.subVectors(t.c,Bi),En.subVectors(ni,ei),bn.subVectors(ii,ni),Un.subVectors(ei,ii);let e=[0,-En.z,En.y,0,-bn.z,bn.y,0,-Un.z,Un.y,En.z,0,-En.x,bn.z,0,-bn.x,Un.z,0,-Un.x,-En.y,En.x,0,-bn.y,bn.x,0,-Un.y,Un.x,0];return!hr(e,ei,ni,ii,fs)||(e=[1,0,0,0,1,0,0,0,1],!hr(e,ei,ni,ii,fs))?!1:(ds.crossVectors(En,bn),e=[ds.x,ds.y,ds.z],hr(e,ei,ni,ii,fs))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Ye).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Ye).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(un[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),un[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),un[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),un[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),un[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),un[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),un[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),un[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(un),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const un=[new U,new U,new U,new U,new U,new U,new U,new U],Ye=new U,us=new Jn,ei=new U,ni=new U,ii=new U,En=new U,bn=new U,Un=new U,Bi=new U,fs=new U,ds=new U,Nn=new U;function hr(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){Nn.fromArray(i,r);const a=s.x*Math.abs(Nn.x)+s.y*Math.abs(Nn.y)+s.z*Math.abs(Nn.z),c=t.dot(Nn),l=e.dot(Nn),h=n.dot(Nn);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>a)return!1}return!0}const Oh=new Jn,zi=new U,ur=new U;class Di{constructor(t=new U,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Oh.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;zi.subVectors(t,this.center);const e=zi.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(zi,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(ur.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(zi.copy(t.center).add(ur)),this.expandByPoint(zi.copy(t.center).sub(ur))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const fn=new U,fr=new U,ps=new U,Tn=new U,dr=new U,ms=new U,pr=new U;class Kc{constructor(t=new U,e=new U(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,fn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=fn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(fn.copy(this.origin).addScaledVector(this.direction,e),fn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){fr.copy(t).add(e).multiplyScalar(.5),ps.copy(e).sub(t).normalize(),Tn.copy(this.origin).sub(fr);const r=t.distanceTo(e)*.5,o=-this.direction.dot(ps),a=Tn.dot(this.direction),c=-Tn.dot(ps),l=Tn.lengthSq(),h=Math.abs(1-o*o);let u,f,d,g;if(h>0)if(u=o*c-a,f=o*a-c,g=r*h,u>=0)if(f>=-g)if(f<=g){const v=1/h;u*=v,f*=v,d=u*(u+o*f+2*a)+f*(o*u+f+2*c)+l}else f=r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*c)+l;else f=-r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*c)+l;else f<=-g?(u=Math.max(0,-(-o*r+a)),f=u>0?-r:Math.min(Math.max(-r,-c),r),d=-u*u+f*(f+2*c)+l):f<=g?(u=0,f=Math.min(Math.max(-r,-c),r),d=f*(f+2*c)+l):(u=Math.max(0,-(o*r+a)),f=u>0?r:Math.min(Math.max(-r,-c),r),d=-u*u+f*(f+2*c)+l);else f=o>0?-r:r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(fr).addScaledVector(ps,f),d}intersectSphere(t,e){fn.subVectors(t.center,this.origin);const n=fn.dot(this.direction),s=fn.dot(fn)-n*n,r=t.radius*t.radius;if(s>r)return null;const o=Math.sqrt(r-s),a=n-o,c=n+o;return c<0?null:a<0?this.at(c,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,c;const l=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,f=this.origin;return l>=0?(n=(t.min.x-f.x)*l,s=(t.max.x-f.x)*l):(n=(t.max.x-f.x)*l,s=(t.min.x-f.x)*l),h>=0?(r=(t.min.y-f.y)*h,o=(t.max.y-f.y)*h):(r=(t.max.y-f.y)*h,o=(t.min.y-f.y)*h),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(t.min.z-f.z)*u,c=(t.max.z-f.z)*u):(a=(t.max.z-f.z)*u,c=(t.min.z-f.z)*u),n>c||a>s)||((a>n||n!==n)&&(n=a),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,fn)!==null}intersectTriangle(t,e,n,s,r){dr.subVectors(e,t),ms.subVectors(n,t),pr.crossVectors(dr,ms);let o=this.direction.dot(pr),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Tn.subVectors(this.origin,t);const c=a*this.direction.dot(ms.crossVectors(Tn,ms));if(c<0)return null;const l=a*this.direction.dot(dr.cross(Tn));if(l<0||c+l>o)return null;const h=-a*Tn.dot(pr);return h<0?null:this.at(h/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class ae{constructor(t,e,n,s,r,o,a,c,l,h,u,f,d,g,v,m){ae.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,c,l,h,u,f,d,g,v,m)}set(t,e,n,s,r,o,a,c,l,h,u,f,d,g,v,m){const p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=c,p[2]=l,p[6]=h,p[10]=u,p[14]=f,p[3]=d,p[7]=g,p[11]=v,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ae().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,s=1/si.setFromMatrixColumn(t,0).length(),r=1/si.setFromMatrixColumn(t,1).length(),o=1/si.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(s),l=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){const f=o*h,d=o*u,g=a*h,v=a*u;e[0]=c*h,e[4]=-c*u,e[8]=l,e[1]=d+g*l,e[5]=f-v*l,e[9]=-a*c,e[2]=v-f*l,e[6]=g+d*l,e[10]=o*c}else if(t.order==="YXZ"){const f=c*h,d=c*u,g=l*h,v=l*u;e[0]=f+v*a,e[4]=g*a-d,e[8]=o*l,e[1]=o*u,e[5]=o*h,e[9]=-a,e[2]=d*a-g,e[6]=v+f*a,e[10]=o*c}else if(t.order==="ZXY"){const f=c*h,d=c*u,g=l*h,v=l*u;e[0]=f-v*a,e[4]=-o*u,e[8]=g+d*a,e[1]=d+g*a,e[5]=o*h,e[9]=v-f*a,e[2]=-o*l,e[6]=a,e[10]=o*c}else if(t.order==="ZYX"){const f=o*h,d=o*u,g=a*h,v=a*u;e[0]=c*h,e[4]=g*l-d,e[8]=f*l+v,e[1]=c*u,e[5]=v*l+f,e[9]=d*l-g,e[2]=-l,e[6]=a*c,e[10]=o*c}else if(t.order==="YZX"){const f=o*c,d=o*l,g=a*c,v=a*l;e[0]=c*h,e[4]=v-f*u,e[8]=g*u+d,e[1]=u,e[5]=o*h,e[9]=-a*h,e[2]=-l*h,e[6]=d*u+g,e[10]=f-v*u}else if(t.order==="XZY"){const f=o*c,d=o*l,g=a*c,v=a*l;e[0]=c*h,e[4]=-u,e[8]=l*h,e[1]=f*u+v,e[5]=o*h,e[9]=d*u-g,e[2]=g*u-d,e[6]=a*h,e[10]=v*u+f}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Bh,t,zh)}lookAt(t,e,n){const s=this.elements;return Fe.subVectors(t,e),Fe.lengthSq()===0&&(Fe.z=1),Fe.normalize(),wn.crossVectors(n,Fe),wn.lengthSq()===0&&(Math.abs(n.z)===1?Fe.x+=1e-4:Fe.z+=1e-4,Fe.normalize(),wn.crossVectors(n,Fe)),wn.normalize(),gs.crossVectors(Fe,wn),s[0]=wn.x,s[4]=gs.x,s[8]=Fe.x,s[1]=wn.y,s[5]=gs.y,s[9]=Fe.y,s[2]=wn.z,s[6]=gs.z,s[10]=Fe.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],h=n[1],u=n[5],f=n[9],d=n[13],g=n[2],v=n[6],m=n[10],p=n[14],y=n[3],E=n[7],_=n[11],D=n[15],S=s[0],A=s[4],P=s[8],M=s[12],x=s[1],C=s[5],k=s[9],V=s[13],X=s[2],J=s[6],Y=s[10],tt=s[14],K=s[3],ft=s[7],ut=s[11],_t=s[15];return r[0]=o*S+a*x+c*X+l*K,r[4]=o*A+a*C+c*J+l*ft,r[8]=o*P+a*k+c*Y+l*ut,r[12]=o*M+a*V+c*tt+l*_t,r[1]=h*S+u*x+f*X+d*K,r[5]=h*A+u*C+f*J+d*ft,r[9]=h*P+u*k+f*Y+d*ut,r[13]=h*M+u*V+f*tt+d*_t,r[2]=g*S+v*x+m*X+p*K,r[6]=g*A+v*C+m*J+p*ft,r[10]=g*P+v*k+m*Y+p*ut,r[14]=g*M+v*V+m*tt+p*_t,r[3]=y*S+E*x+_*X+D*K,r[7]=y*A+E*C+_*J+D*ft,r[11]=y*P+E*k+_*Y+D*ut,r[15]=y*M+E*V+_*tt+D*_t,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],c=t[9],l=t[13],h=t[2],u=t[6],f=t[10],d=t[14],g=t[3],v=t[7],m=t[11],p=t[15];return g*(+r*c*u-s*l*u-r*a*f+n*l*f+s*a*d-n*c*d)+v*(+e*c*d-e*l*f+r*o*f-s*o*d+s*l*h-r*c*h)+m*(+e*l*u-e*a*d-r*o*u+n*o*d+r*a*h-n*l*h)+p*(-s*a*h-e*c*u+e*a*f+s*o*u-n*o*f+n*c*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8],u=t[9],f=t[10],d=t[11],g=t[12],v=t[13],m=t[14],p=t[15],y=u*m*l-v*f*l+v*c*d-a*m*d-u*c*p+a*f*p,E=g*f*l-h*m*l-g*c*d+o*m*d+h*c*p-o*f*p,_=h*v*l-g*u*l+g*a*d-o*v*d-h*a*p+o*u*p,D=g*u*c-h*v*c-g*a*f+o*v*f+h*a*m-o*u*m,S=e*y+n*E+s*_+r*D;if(S===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const A=1/S;return t[0]=y*A,t[1]=(v*f*r-u*m*r-v*s*d+n*m*d+u*s*p-n*f*p)*A,t[2]=(a*m*r-v*c*r+v*s*l-n*m*l-a*s*p+n*c*p)*A,t[3]=(u*c*r-a*f*r-u*s*l+n*f*l+a*s*d-n*c*d)*A,t[4]=E*A,t[5]=(h*m*r-g*f*r+g*s*d-e*m*d-h*s*p+e*f*p)*A,t[6]=(g*c*r-o*m*r-g*s*l+e*m*l+o*s*p-e*c*p)*A,t[7]=(o*f*r-h*c*r+h*s*l-e*f*l-o*s*d+e*c*d)*A,t[8]=_*A,t[9]=(g*u*r-h*v*r-g*n*d+e*v*d+h*n*p-e*u*p)*A,t[10]=(o*v*r-g*a*r+g*n*l-e*v*l-o*n*p+e*a*p)*A,t[11]=(h*a*r-o*u*r-h*n*l+e*u*l+o*n*d-e*a*d)*A,t[12]=D*A,t[13]=(h*v*s-g*u*s+g*n*f-e*v*f-h*n*m+e*u*m)*A,t[14]=(g*a*s-o*v*s-g*n*c+e*v*c+o*n*m-e*a*m)*A,t[15]=(o*u*s-h*a*s+h*n*c-e*u*c-o*n*f+e*a*f)*A,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,c=t.z,l=r*o,h=r*a;return this.set(l*o+n,l*a-s*c,l*c+s*a,0,l*a+s*c,h*a+n,h*c-s*o,0,l*c-s*a,h*c+s*o,r*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,o=e._y,a=e._z,c=e._w,l=r+r,h=o+o,u=a+a,f=r*l,d=r*h,g=r*u,v=o*h,m=o*u,p=a*u,y=c*l,E=c*h,_=c*u,D=n.x,S=n.y,A=n.z;return s[0]=(1-(v+p))*D,s[1]=(d+_)*D,s[2]=(g-E)*D,s[3]=0,s[4]=(d-_)*S,s[5]=(1-(f+p))*S,s[6]=(m+y)*S,s[7]=0,s[8]=(g+E)*A,s[9]=(m-y)*A,s[10]=(1-(f+v))*A,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;let r=si.set(s[0],s[1],s[2]).length();const o=si.set(s[4],s[5],s[6]).length(),a=si.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],qe.copy(this);const l=1/r,h=1/o,u=1/a;return qe.elements[0]*=l,qe.elements[1]*=l,qe.elements[2]*=l,qe.elements[4]*=h,qe.elements[5]*=h,qe.elements[6]*=h,qe.elements[8]*=u,qe.elements[9]*=u,qe.elements[10]*=u,e.setFromRotationMatrix(qe),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,s,r,o,a=_n){const c=this.elements,l=2*r/(e-t),h=2*r/(n-s),u=(e+t)/(e-t),f=(n+s)/(n-s);let d,g;if(a===_n)d=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===Ys)d=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=l,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=h,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=d,c[14]=g,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=_n){const c=this.elements,l=1/(e-t),h=1/(n-s),u=1/(o-r),f=(e+t)*l,d=(n+s)*h;let g,v;if(a===_n)g=(o+r)*u,v=-2*u;else if(a===Ys)g=r*u,v=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=2*l,c[4]=0,c[8]=0,c[12]=-f,c[1]=0,c[5]=2*h,c[9]=0,c[13]=-d,c[2]=0,c[6]=0,c[10]=v,c[14]=-g,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const si=new U,qe=new ae,Bh=new U(0,0,0),zh=new U(1,1,1),wn=new U,gs=new U,Fe=new U,Ea=new ae,ba=new os;class an{constructor(t=0,e=0,n=0,s=an.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],o=s[4],a=s[8],c=s[1],l=s[5],h=s[9],u=s[2],f=s[6],d=s[10];switch(e){case"XYZ":this._y=Math.asin(ve(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(f,l),this._z=0);break;case"YXZ":this._x=Math.asin(-ve(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,d),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(ve(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-ve(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(ve(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,d));break;case"XZY":this._z=Math.asin(-ve(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,d),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Ea.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Ea,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return ba.setFromEuler(this),this.setFromQuaternion(ba,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}an.DEFAULT_ORDER="XYZ";class Jc{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let kh=0;const Ta=new U,ri=new os,dn=new ae,_s=new U,ki=new U,Vh=new U,Gh=new os,wa=new U(1,0,0),Aa=new U(0,1,0),Ca=new U(0,0,1),Ra={type:"added"},Hh={type:"removed"},oi={type:"childadded",child:null},mr={type:"childremoved",child:null};class de extends Pi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:kh++}),this.uuid=Li(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=de.DEFAULT_UP.clone();const t=new U,e=new an,n=new os,s=new U(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ae},normalMatrix:{value:new Xt}}),this.matrix=new ae,this.matrixWorld=new ae,this.matrixAutoUpdate=de.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=de.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Jc,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ri.setFromAxisAngle(t,e),this.quaternion.multiply(ri),this}rotateOnWorldAxis(t,e){return ri.setFromAxisAngle(t,e),this.quaternion.premultiply(ri),this}rotateX(t){return this.rotateOnAxis(wa,t)}rotateY(t){return this.rotateOnAxis(Aa,t)}rotateZ(t){return this.rotateOnAxis(Ca,t)}translateOnAxis(t,e){return Ta.copy(t).applyQuaternion(this.quaternion),this.position.add(Ta.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(wa,t)}translateY(t){return this.translateOnAxis(Aa,t)}translateZ(t){return this.translateOnAxis(Ca,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(dn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?_s.copy(t):_s.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),ki.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?dn.lookAt(ki,_s,this.up):dn.lookAt(_s,ki,this.up),this.quaternion.setFromRotationMatrix(dn),s&&(dn.extractRotation(s.matrixWorld),ri.setFromRotationMatrix(dn),this.quaternion.premultiply(ri.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Ra),oi.child=t,this.dispatchEvent(oi),oi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Hh),mr.child=t,this.dispatchEvent(mr),mr.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),dn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),dn.multiply(t.parent.matrixWorld)),t.applyMatrix4(dn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Ra),oi.child=t,this.dispatchEvent(oi),oi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ki,t,Vh),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ki,Gh,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const c=a.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){const u=c[l];r(t.shapes,u)}else r(t.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(t.materials,this.material[c]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){const c=this.animations[a];s.animations.push(r(t.animations,c))}}if(e){const a=o(t.geometries),c=o(t.materials),l=o(t.textures),h=o(t.images),u=o(t.shapes),f=o(t.skeletons),d=o(t.animations),g=o(t.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),f.length>0&&(n.skeletons=f),d.length>0&&(n.animations=d),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){const c=[];for(const l in a){const h=a[l];delete h.metadata,c.push(h)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}de.DEFAULT_UP=new U(0,1,0);de.DEFAULT_MATRIX_AUTO_UPDATE=!0;de.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Ze=new U,pn=new U,gr=new U,mn=new U,ai=new U,ci=new U,Pa=new U,_r=new U,vr=new U,xr=new U,Mr=new oe,Sr=new oe,yr=new oe;class je{constructor(t=new U,e=new U,n=new U){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),Ze.subVectors(t,e),s.cross(Ze);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){Ze.subVectors(s,e),pn.subVectors(n,e),gr.subVectors(t,e);const o=Ze.dot(Ze),a=Ze.dot(pn),c=Ze.dot(gr),l=pn.dot(pn),h=pn.dot(gr),u=o*l-a*a;if(u===0)return r.set(0,0,0),null;const f=1/u,d=(l*c-a*h)*f,g=(o*h-a*c)*f;return r.set(1-d-g,g,d)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,mn)===null?!1:mn.x>=0&&mn.y>=0&&mn.x+mn.y<=1}static getInterpolation(t,e,n,s,r,o,a,c){return this.getBarycoord(t,e,n,s,mn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,mn.x),c.addScaledVector(o,mn.y),c.addScaledVector(a,mn.z),c)}static getInterpolatedAttribute(t,e,n,s,r,o){return Mr.setScalar(0),Sr.setScalar(0),yr.setScalar(0),Mr.fromBufferAttribute(t,e),Sr.fromBufferAttribute(t,n),yr.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(Mr,r.x),o.addScaledVector(Sr,r.y),o.addScaledVector(yr,r.z),o}static isFrontFacing(t,e,n,s){return Ze.subVectors(n,e),pn.subVectors(t,e),Ze.cross(pn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Ze.subVectors(this.c,this.b),pn.subVectors(this.a,this.b),Ze.cross(pn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return je.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return je.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return je.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return je.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return je.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let o,a;ai.subVectors(s,n),ci.subVectors(r,n),_r.subVectors(t,n);const c=ai.dot(_r),l=ci.dot(_r);if(c<=0&&l<=0)return e.copy(n);vr.subVectors(t,s);const h=ai.dot(vr),u=ci.dot(vr);if(h>=0&&u<=h)return e.copy(s);const f=c*u-h*l;if(f<=0&&c>=0&&h<=0)return o=c/(c-h),e.copy(n).addScaledVector(ai,o);xr.subVectors(t,r);const d=ai.dot(xr),g=ci.dot(xr);if(g>=0&&d<=g)return e.copy(r);const v=d*l-c*g;if(v<=0&&l>=0&&g<=0)return a=l/(l-g),e.copy(n).addScaledVector(ci,a);const m=h*g-d*u;if(m<=0&&u-h>=0&&d-g>=0)return Pa.subVectors(r,s),a=(u-h)/(u-h+(d-g)),e.copy(s).addScaledVector(Pa,a);const p=1/(m+v+f);return o=v*p,a=f*p,e.copy(n).addScaledVector(ai,o).addScaledVector(ci,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const $c={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},An={h:0,s:0,l:0},vs={h:0,s:0,l:0};function Er(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class pt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ue){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,jt.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=jt.workingColorSpace){return this.r=t,this.g=e,this.b=n,jt.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=jt.workingColorSpace){if(t=Ah(t,1),e=ve(e,0,1),n=ve(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=Er(o,r,t+1/3),this.g=Er(o,r,t),this.b=Er(o,r,t-1/3)}return jt.toWorkingColorSpace(this,s),this}setStyle(t,e=Ue){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ue){const n=$c[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Mn(t.r),this.g=Mn(t.g),this.b=Mn(t.b),this}copyLinearToSRGB(t){return this.r=xi(t.r),this.g=xi(t.g),this.b=xi(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ue){return jt.fromWorkingColorSpace(ye.copy(this),t),Math.round(ve(ye.r*255,0,255))*65536+Math.round(ve(ye.g*255,0,255))*256+Math.round(ve(ye.b*255,0,255))}getHexString(t=Ue){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=jt.workingColorSpace){jt.fromWorkingColorSpace(ye.copy(this),e);const n=ye.r,s=ye.g,r=ye.b,o=Math.max(n,s,r),a=Math.min(n,s,r);let c,l;const h=(a+o)/2;if(a===o)c=0,l=0;else{const u=o-a;switch(l=h<=.5?u/(o+a):u/(2-o-a),o){case n:c=(s-r)/u+(s<r?6:0);break;case s:c=(r-n)/u+2;break;case r:c=(n-s)/u+4;break}c/=6}return t.h=c,t.s=l,t.l=h,t}getRGB(t,e=jt.workingColorSpace){return jt.fromWorkingColorSpace(ye.copy(this),e),t.r=ye.r,t.g=ye.g,t.b=ye.b,t}getStyle(t=Ue){jt.fromWorkingColorSpace(ye.copy(this),t);const e=ye.r,n=ye.g,s=ye.b;return t!==Ue?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(An),this.setHSL(An.h+t,An.s+e,An.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(An),t.getHSL(vs);const n=or(An.h,vs.h,e),s=or(An.s,vs.s,e),r=or(An.l,vs.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const ye=new pt;pt.NAMES=$c;let Wh=0;class Ii extends Pi{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Wh++}),this.uuid=Li(),this.name="",this.blending=vn,this.side=Ln,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Vr,this.blendDst=Gr,this.blendEquation=Hn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new pt(0,0,0),this.blendAlpha=0,this.depthFunc=Mi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=da,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Qn,this.stencilZFail=Qn,this.stencilZPass=Qn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==vn&&(n.blending=this.blending),this.side!==Ln&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Vr&&(n.blendSrc=this.blendSrc),this.blendDst!==Gr&&(n.blendDst=this.blendDst),this.blendEquation!==Hn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Mi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==da&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Qn&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Qn&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Qn&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const o=[];for(const a in r){const c=r[a];delete c.metadata,o.push(c)}return o}if(e){const r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class Zn extends Ii{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new pt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new an,this.combine=Ic,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const pe=new U,xs=new ct;class Pe{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=pa,this.updateRanges=[],this.gpuType=rn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)xs.fromBufferAttribute(this,e),xs.applyMatrix3(t),this.setXY(e,xs.x,xs.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)pe.fromBufferAttribute(this,e),pe.applyMatrix3(t),this.setXYZ(e,pe.x,pe.y,pe.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)pe.fromBufferAttribute(this,e),pe.applyMatrix4(t),this.setXYZ(e,pe.x,pe.y,pe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)pe.fromBufferAttribute(this,e),pe.applyNormalMatrix(t),this.setXYZ(e,pe.x,pe.y,pe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)pe.fromBufferAttribute(this,e),pe.transformDirection(t),this.setXYZ(e,pe.x,pe.y,pe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Oi(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Ie(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Oi(e,this.array)),e}setX(t,e){return this.normalized&&(e=Ie(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Oi(e,this.array)),e}setY(t,e){return this.normalized&&(e=Ie(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Oi(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Ie(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Oi(e,this.array)),e}setW(t,e){return this.normalized&&(e=Ie(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Ie(e,this.array),n=Ie(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Ie(e,this.array),n=Ie(n,this.array),s=Ie(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Ie(e,this.array),n=Ie(n,this.array),s=Ie(s,this.array),r=Ie(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==pa&&(t.usage=this.usage),t}}class jc extends Pe{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Qc extends Pe{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class Zt extends Pe{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Xh=0;const Ge=new ae,br=new de,li=new U,Oe=new Jn,Vi=new Jn,_e=new U;class xe extends Pi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Xh++}),this.uuid=Li(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Yc(t)?Qc:jc)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Xt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return Ge.makeRotationFromQuaternion(t),this.applyMatrix4(Ge),this}rotateX(t){return Ge.makeRotationX(t),this.applyMatrix4(Ge),this}rotateY(t){return Ge.makeRotationY(t),this.applyMatrix4(Ge),this}rotateZ(t){return Ge.makeRotationZ(t),this.applyMatrix4(Ge),this}translate(t,e,n){return Ge.makeTranslation(t,e,n),this.applyMatrix4(Ge),this}scale(t,e,n){return Ge.makeScale(t,e,n),this.applyMatrix4(Ge),this}lookAt(t){return br.lookAt(t),br.updateMatrix(),this.applyMatrix4(br.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(li).negate(),this.translate(li.x,li.y,li.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let s=0,r=t.length;s<r;s++){const o=t[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Zt(n,3))}else{for(let n=0,s=e.count;n<s;n++){const r=t[n];e.setXYZ(n,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Jn);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new U(-1/0,-1/0,-1/0),new U(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];Oe.setFromBufferAttribute(r),this.morphTargetsRelative?(_e.addVectors(this.boundingBox.min,Oe.min),this.boundingBox.expandByPoint(_e),_e.addVectors(this.boundingBox.max,Oe.max),this.boundingBox.expandByPoint(_e)):(this.boundingBox.expandByPoint(Oe.min),this.boundingBox.expandByPoint(Oe.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Di);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new U,1/0);return}if(t){const n=this.boundingSphere.center;if(Oe.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){const a=e[r];Vi.setFromBufferAttribute(a),this.morphTargetsRelative?(_e.addVectors(Oe.min,Vi.min),Oe.expandByPoint(_e),_e.addVectors(Oe.max,Vi.max),Oe.expandByPoint(_e)):(Oe.expandByPoint(Vi.min),Oe.expandByPoint(Vi.max))}Oe.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)_e.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(_e));if(e)for(let r=0,o=e.length;r<o;r++){const a=e[r],c=this.morphTargetsRelative;for(let l=0,h=a.count;l<h;l++)_e.fromBufferAttribute(a,l),c&&(li.fromBufferAttribute(t,l),_e.add(li)),s=Math.max(s,n.distanceToSquared(_e))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Pe(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],c=[];for(let P=0;P<n.count;P++)a[P]=new U,c[P]=new U;const l=new U,h=new U,u=new U,f=new ct,d=new ct,g=new ct,v=new U,m=new U;function p(P,M,x){l.fromBufferAttribute(n,P),h.fromBufferAttribute(n,M),u.fromBufferAttribute(n,x),f.fromBufferAttribute(r,P),d.fromBufferAttribute(r,M),g.fromBufferAttribute(r,x),h.sub(l),u.sub(l),d.sub(f),g.sub(f);const C=1/(d.x*g.y-g.x*d.y);isFinite(C)&&(v.copy(h).multiplyScalar(g.y).addScaledVector(u,-d.y).multiplyScalar(C),m.copy(u).multiplyScalar(d.x).addScaledVector(h,-g.x).multiplyScalar(C),a[P].add(v),a[M].add(v),a[x].add(v),c[P].add(m),c[M].add(m),c[x].add(m))}let y=this.groups;y.length===0&&(y=[{start:0,count:t.count}]);for(let P=0,M=y.length;P<M;++P){const x=y[P],C=x.start,k=x.count;for(let V=C,X=C+k;V<X;V+=3)p(t.getX(V+0),t.getX(V+1),t.getX(V+2))}const E=new U,_=new U,D=new U,S=new U;function A(P){D.fromBufferAttribute(s,P),S.copy(D);const M=a[P];E.copy(M),E.sub(D.multiplyScalar(D.dot(M))).normalize(),_.crossVectors(S,M);const C=_.dot(c[P])<0?-1:1;o.setXYZW(P,E.x,E.y,E.z,C)}for(let P=0,M=y.length;P<M;++P){const x=y[P],C=x.start,k=x.count;for(let V=C,X=C+k;V<X;V+=3)A(t.getX(V+0)),A(t.getX(V+1)),A(t.getX(V+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Pe(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let f=0,d=n.count;f<d;f++)n.setXYZ(f,0,0,0);const s=new U,r=new U,o=new U,a=new U,c=new U,l=new U,h=new U,u=new U;if(t)for(let f=0,d=t.count;f<d;f+=3){const g=t.getX(f+0),v=t.getX(f+1),m=t.getX(f+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,v),o.fromBufferAttribute(e,m),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),a.fromBufferAttribute(n,g),c.fromBufferAttribute(n,v),l.fromBufferAttribute(n,m),a.add(h),c.add(h),l.add(h),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(v,c.x,c.y,c.z),n.setXYZ(m,l.x,l.y,l.z)}else for(let f=0,d=e.count;f<d;f+=3)s.fromBufferAttribute(e,f+0),r.fromBufferAttribute(e,f+1),o.fromBufferAttribute(e,f+2),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)_e.fromBufferAttribute(t,e),_e.normalize(),t.setXYZ(e,_e.x,_e.y,_e.z)}toNonIndexed(){function t(a,c){const l=a.array,h=a.itemSize,u=a.normalized,f=new l.constructor(c.length*h);let d=0,g=0;for(let v=0,m=c.length;v<m;v++){a.isInterleavedBufferAttribute?d=c[v]*a.data.stride+a.offset:d=c[v]*h;for(let p=0;p<h;p++)f[g++]=l[d++]}return new Pe(f,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new xe,n=this.index.array,s=this.attributes;for(const a in s){const c=s[a],l=t(c,n);e.setAttribute(a,l)}const r=this.morphAttributes;for(const a in r){const c=[],l=r[a];for(let h=0,u=l.length;h<u;h++){const f=l[h],d=t(f,n);c.push(d)}e.morphAttributes[a]=c}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,c=o.length;a<c;a++){const l=o[a];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const c in n){const l=n[c];t.data.attributes[c]=l.toJSON(t.data)}const s={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],h=[];for(let u=0,f=l.length;u<f;u++){const d=l[u];h.push(d.toJSON(t.data))}h.length>0&&(s[c]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const s=t.attributes;for(const l in s){const h=s[l];this.setAttribute(l,h.clone(e))}const r=t.morphAttributes;for(const l in r){const h=[],u=r[l];for(let f=0,d=u.length;f<d;f++)h.push(u[f].clone(e));this.morphAttributes[l]=h}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let l=0,h=o.length;l<h;l++){const u=o[l];this.addGroup(u.start,u.count,u.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const La=new ae,Fn=new Kc,Ms=new Di,Da=new U,Ss=new U,ys=new U,Es=new U,Tr=new U,bs=new U,Ia=new U,Ts=new U;class kt extends de{constructor(t=new xe,e=new Zn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const a=this.morphTargetInfluences;if(r&&a){bs.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const h=a[c],u=r[c];h!==0&&(Tr.fromBufferAttribute(u,t),o?bs.addScaledVector(Tr,h):bs.addScaledVector(Tr.sub(e),h))}e.add(bs)}return e}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ms.copy(n.boundingSphere),Ms.applyMatrix4(r),Fn.copy(t.ray).recast(t.near),!(Ms.containsPoint(Fn.origin)===!1&&(Fn.intersectSphere(Ms,Da)===null||Fn.origin.distanceToSquared(Da)>(t.far-t.near)**2))&&(La.copy(r).invert(),Fn.copy(t.ray).applyMatrix4(La),!(n.boundingBox!==null&&Fn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Fn)))}_computeIntersections(t,e,n){let s;const r=this.geometry,o=this.material,a=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,f=r.groups,d=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,v=f.length;g<v;g++){const m=f[g],p=o[m.materialIndex],y=Math.max(m.start,d.start),E=Math.min(a.count,Math.min(m.start+m.count,d.start+d.count));for(let _=y,D=E;_<D;_+=3){const S=a.getX(_),A=a.getX(_+1),P=a.getX(_+2);s=ws(this,p,t,n,l,h,u,S,A,P),s&&(s.faceIndex=Math.floor(_/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,d.start),v=Math.min(a.count,d.start+d.count);for(let m=g,p=v;m<p;m+=3){const y=a.getX(m),E=a.getX(m+1),_=a.getX(m+2);s=ws(this,o,t,n,l,h,u,y,E,_),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(c!==void 0)if(Array.isArray(o))for(let g=0,v=f.length;g<v;g++){const m=f[g],p=o[m.materialIndex],y=Math.max(m.start,d.start),E=Math.min(c.count,Math.min(m.start+m.count,d.start+d.count));for(let _=y,D=E;_<D;_+=3){const S=_,A=_+1,P=_+2;s=ws(this,p,t,n,l,h,u,S,A,P),s&&(s.faceIndex=Math.floor(_/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,d.start),v=Math.min(c.count,d.start+d.count);for(let m=g,p=v;m<p;m+=3){const y=m,E=m+1,_=m+2;s=ws(this,o,t,n,l,h,u,y,E,_),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}}function Yh(i,t,e,n,s,r,o,a){let c;if(t.side===Le?c=n.intersectTriangle(o,r,s,!0,a):c=n.intersectTriangle(s,r,o,t.side===Ln,a),c===null)return null;Ts.copy(a),Ts.applyMatrix4(i.matrixWorld);const l=e.ray.origin.distanceTo(Ts);return l<e.near||l>e.far?null:{distance:l,point:Ts.clone(),object:i}}function ws(i,t,e,n,s,r,o,a,c,l){i.getVertexPosition(a,Ss),i.getVertexPosition(c,ys),i.getVertexPosition(l,Es);const h=Yh(i,t,e,n,Ss,ys,Es,Ia);if(h){const u=new U;je.getBarycoord(Ia,Ss,ys,Es,u),s&&(h.uv=je.getInterpolatedAttribute(s,a,c,l,u,new ct)),r&&(h.uv1=je.getInterpolatedAttribute(r,a,c,l,u,new ct)),o&&(h.normal=je.getInterpolatedAttribute(o,a,c,l,u,new U),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const f={a,b:c,c:l,normal:new U,materialIndex:0};je.getNormal(Ss,ys,Es,f.normal),h.face=f,h.barycoord=u}return h}class Je extends xe{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};const a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);const c=[],l=[],h=[],u=[];let f=0,d=0;g("z","y","x",-1,-1,n,e,t,o,r,0),g("z","y","x",1,-1,n,e,-t,o,r,1),g("x","z","y",1,1,t,n,e,s,o,2),g("x","z","y",1,-1,t,n,-e,s,o,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new Zt(l,3)),this.setAttribute("normal",new Zt(h,3)),this.setAttribute("uv",new Zt(u,2));function g(v,m,p,y,E,_,D,S,A,P,M){const x=_/A,C=D/P,k=_/2,V=D/2,X=S/2,J=A+1,Y=P+1;let tt=0,K=0;const ft=new U;for(let ut=0;ut<Y;ut++){const _t=ut*C-V;for(let Dt=0;Dt<J;Dt++){const q=Dt*x-k;ft[v]=q*y,ft[m]=_t*E,ft[p]=X,l.push(ft.x,ft.y,ft.z),ft[v]=0,ft[m]=0,ft[p]=S>0?1:-1,h.push(ft.x,ft.y,ft.z),u.push(Dt/A),u.push(1-ut/P),tt+=1}}for(let ut=0;ut<P;ut++)for(let _t=0;_t<A;_t++){const Dt=f+_t+J*ut,q=f+_t+J*(ut+1),B=f+(_t+1)+J*(ut+1),I=f+(_t+1)+J*ut;c.push(Dt,q,I),c.push(q,B,I),K+=6}a.addGroup(d,K,M),d+=K,f+=tt}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Je(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function wi(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function Ae(i){const t={};for(let e=0;e<i.length;e++){const n=wi(i[e]);for(const s in n)t[s]=n[s]}return t}function qh(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function tl(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:jt.workingColorSpace}const Zh={clone:wi,merge:Ae};var Kh=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Jh=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class we extends Ii{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Kh,this.fragmentShader=Jh,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=wi(t.uniforms),this.uniformsGroups=qh(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class el extends de{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ae,this.projectionMatrix=new ae,this.projectionMatrixInverse=new ae,this.coordinateSystem=_n}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Cn=new U,Ua=new ct,Na=new ct;class Be extends el{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=wo*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(rr*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return wo*2*Math.atan(Math.tan(rr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Cn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Cn.x,Cn.y).multiplyScalar(-t/Cn.z),Cn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Cn.x,Cn.y).multiplyScalar(-t/Cn.z)}getViewSize(t,e){return this.getViewBounds(t,Ua,Na),e.subVectors(Na,Ua)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(rr*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*s/c,e-=o.offsetY*n/l,s*=o.width/c,n*=o.height/l}const a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const hi=-90,ui=1;class $h extends de{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Be(hi,ui,t,e);s.layers=this.layers,this.add(s);const r=new Be(hi,ui,t,e);r.layers=this.layers,this.add(r);const o=new Be(hi,ui,t,e);o.layers=this.layers,this.add(o);const a=new Be(hi,ui,t,e);a.layers=this.layers,this.add(a);const c=new Be(hi,ui,t,e);c.layers=this.layers,this.add(c);const l=new Be(hi,ui,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,c]=e;for(const l of e)this.remove(l);if(t===_n)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===Ys)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,o,a,c,l,h]=this.children,u=t.getRenderTarget(),f=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,o),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,c),t.setRenderTarget(n,4,s),t.render(e,l),n.texture.generateMipmaps=v,t.setRenderTarget(n,5,s),t.render(e,h),t.setRenderTarget(u,f,d),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class nl extends Te{constructor(t,e,n,s,r,o,a,c,l,h){t=t!==void 0?t:[],e=e!==void 0?e:Si,super(t,e,n,s,r,o,a,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class jh extends Dn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new nl(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Re}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Je(5,5,5),r=new we({name:"CubemapFromEquirect",uniforms:wi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Le,blending:Pn});r.uniforms.tEquirect.value=e;const o=new kt(s,r),a=e.minFilter;return e.minFilter===sn&&(e.minFilter=Re),new $h(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,s){const r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}}const wr=new U,Qh=new U,tu=new Xt;class Vn{constructor(t=new U(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=wr.subVectors(n,e).cross(Qh.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(wr),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||tu.getNormalMatrix(t),s=this.coplanarPoint(wr).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const On=new Di,As=new U;class Wo{constructor(t=new Vn,e=new Vn,n=new Vn,s=new Vn,r=new Vn,o=new Vn){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=_n){const n=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],c=s[3],l=s[4],h=s[5],u=s[6],f=s[7],d=s[8],g=s[9],v=s[10],m=s[11],p=s[12],y=s[13],E=s[14],_=s[15];if(n[0].setComponents(c-r,f-l,m-d,_-p).normalize(),n[1].setComponents(c+r,f+l,m+d,_+p).normalize(),n[2].setComponents(c+o,f+h,m+g,_+y).normalize(),n[3].setComponents(c-o,f-h,m-g,_-y).normalize(),n[4].setComponents(c-a,f-u,m-v,_-E).normalize(),e===_n)n[5].setComponents(c+a,f+u,m+v,_+E).normalize();else if(e===Ys)n[5].setComponents(a,u,v,E).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),On.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),On.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(On)}intersectsSprite(t){return On.center.set(0,0,0),On.radius=.7071067811865476,On.applyMatrix4(t.matrixWorld),this.intersectsSphere(On)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(As.x=s.normal.x>0?t.max.x:t.min.x,As.y=s.normal.y>0?t.max.y:t.min.y,As.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(As)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function il(){let i=null,t=!1,e=null,n=null;function s(r,o){e(r,o),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function eu(i){const t=new WeakMap;function e(a,c){const l=a.array,h=a.usage,u=l.byteLength,f=i.createBuffer();i.bindBuffer(c,f),i.bufferData(c,l,h),a.onUploadCallback();let d;if(l instanceof Float32Array)d=i.FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?d=i.HALF_FLOAT:d=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)d=i.SHORT;else if(l instanceof Uint32Array)d=i.UNSIGNED_INT;else if(l instanceof Int32Array)d=i.INT;else if(l instanceof Int8Array)d=i.BYTE;else if(l instanceof Uint8Array)d=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)d=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:f,type:d,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,c,l){const h=c.array,u=c.updateRanges;if(i.bindBuffer(l,a),u.length===0)i.bufferSubData(l,0,h);else{u.sort((d,g)=>d.start-g.start);let f=0;for(let d=1;d<u.length;d++){const g=u[f],v=u[d];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++f,u[f]=v)}u.length=f+1;for(let d=0,g=u.length;d<g;d++){const v=u[d];i.bufferSubData(l,v.start*h.BYTES_PER_ELEMENT,h,v.start,v.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);const c=t.get(a);c&&(i.deleteBuffer(c.buffer),t.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const l=t.get(a);if(l===void 0)t.set(a,e(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,a,c),l.version=a.version}}return{get:s,remove:r,update:o}}class $n extends xe{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,o=e/2,a=Math.floor(n),c=Math.floor(s),l=a+1,h=c+1,u=t/a,f=e/c,d=[],g=[],v=[],m=[];for(let p=0;p<h;p++){const y=p*f-o;for(let E=0;E<l;E++){const _=E*u-r;g.push(_,-y,0),v.push(0,0,1),m.push(E/a),m.push(1-p/c)}}for(let p=0;p<c;p++)for(let y=0;y<a;y++){const E=y+l*p,_=y+l*(p+1),D=y+1+l*(p+1),S=y+1+l*p;d.push(E,_,S),d.push(_,D,S)}this.setIndex(d),this.setAttribute("position",new Zt(g,3)),this.setAttribute("normal",new Zt(v,3)),this.setAttribute("uv",new Zt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new $n(t.width,t.height,t.widthSegments,t.heightSegments)}}var nu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,iu=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,su=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ru=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ou=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,au=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,cu=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,lu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,hu=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,uu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,fu=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,du=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,pu=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,mu=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,gu=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,_u=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,vu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,xu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Mu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Su=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,yu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Eu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,bu=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Tu=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,wu=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Au=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Cu=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Ru=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Pu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Lu=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Du="gl_FragColor = linearToOutputTexel( gl_FragColor );",Iu=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Uu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Nu=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Fu=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Ou=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Bu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,zu=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ku=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Vu=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Gu=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Hu=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Wu=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Xu=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Yu=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,qu=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Zu=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Ku=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Ju=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,$u=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,ju=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Qu=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,tf=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,ef=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,nf=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,sf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,rf=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,of=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,af=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,cf=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,lf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,hf=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,uf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,ff=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,df=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,pf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,mf=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,gf=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,_f=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,vf=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,xf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Mf=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Sf=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,yf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ef=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,bf=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Tf=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,wf=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Af=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Cf=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Rf=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Pf=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Lf=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Df=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,If=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Uf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Nf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ff=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Of=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Bf=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,zf=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,kf=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Vf=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Gf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Hf=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Wf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Xf=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Yf=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,qf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Zf=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Kf=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Jf=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,$f=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,jf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Qf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,td=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,ed=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const nd=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,id=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,sd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,rd=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,od=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ad=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cd=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,ld=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,hd=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,ud=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,fd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,dd=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,pd=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,md=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,gd=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,_d=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vd=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,xd=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Md=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Sd=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,yd=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Ed=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,bd=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Td=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,wd=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Ad=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Cd=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Rd=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Pd=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Ld=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Dd=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Id=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ud=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Nd=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Yt={alphahash_fragment:nu,alphahash_pars_fragment:iu,alphamap_fragment:su,alphamap_pars_fragment:ru,alphatest_fragment:ou,alphatest_pars_fragment:au,aomap_fragment:cu,aomap_pars_fragment:lu,batching_pars_vertex:hu,batching_vertex:uu,begin_vertex:fu,beginnormal_vertex:du,bsdfs:pu,iridescence_fragment:mu,bumpmap_pars_fragment:gu,clipping_planes_fragment:_u,clipping_planes_pars_fragment:vu,clipping_planes_pars_vertex:xu,clipping_planes_vertex:Mu,color_fragment:Su,color_pars_fragment:yu,color_pars_vertex:Eu,color_vertex:bu,common:Tu,cube_uv_reflection_fragment:wu,defaultnormal_vertex:Au,displacementmap_pars_vertex:Cu,displacementmap_vertex:Ru,emissivemap_fragment:Pu,emissivemap_pars_fragment:Lu,colorspace_fragment:Du,colorspace_pars_fragment:Iu,envmap_fragment:Uu,envmap_common_pars_fragment:Nu,envmap_pars_fragment:Fu,envmap_pars_vertex:Ou,envmap_physical_pars_fragment:Zu,envmap_vertex:Bu,fog_vertex:zu,fog_pars_vertex:ku,fog_fragment:Vu,fog_pars_fragment:Gu,gradientmap_pars_fragment:Hu,lightmap_pars_fragment:Wu,lights_lambert_fragment:Xu,lights_lambert_pars_fragment:Yu,lights_pars_begin:qu,lights_toon_fragment:Ku,lights_toon_pars_fragment:Ju,lights_phong_fragment:$u,lights_phong_pars_fragment:ju,lights_physical_fragment:Qu,lights_physical_pars_fragment:tf,lights_fragment_begin:ef,lights_fragment_maps:nf,lights_fragment_end:sf,logdepthbuf_fragment:rf,logdepthbuf_pars_fragment:of,logdepthbuf_pars_vertex:af,logdepthbuf_vertex:cf,map_fragment:lf,map_pars_fragment:hf,map_particle_fragment:uf,map_particle_pars_fragment:ff,metalnessmap_fragment:df,metalnessmap_pars_fragment:pf,morphinstance_vertex:mf,morphcolor_vertex:gf,morphnormal_vertex:_f,morphtarget_pars_vertex:vf,morphtarget_vertex:xf,normal_fragment_begin:Mf,normal_fragment_maps:Sf,normal_pars_fragment:yf,normal_pars_vertex:Ef,normal_vertex:bf,normalmap_pars_fragment:Tf,clearcoat_normal_fragment_begin:wf,clearcoat_normal_fragment_maps:Af,clearcoat_pars_fragment:Cf,iridescence_pars_fragment:Rf,opaque_fragment:Pf,packing:Lf,premultiplied_alpha_fragment:Df,project_vertex:If,dithering_fragment:Uf,dithering_pars_fragment:Nf,roughnessmap_fragment:Ff,roughnessmap_pars_fragment:Of,shadowmap_pars_fragment:Bf,shadowmap_pars_vertex:zf,shadowmap_vertex:kf,shadowmask_pars_fragment:Vf,skinbase_vertex:Gf,skinning_pars_vertex:Hf,skinning_vertex:Wf,skinnormal_vertex:Xf,specularmap_fragment:Yf,specularmap_pars_fragment:qf,tonemapping_fragment:Zf,tonemapping_pars_fragment:Kf,transmission_fragment:Jf,transmission_pars_fragment:$f,uv_pars_fragment:jf,uv_pars_vertex:Qf,uv_vertex:td,worldpos_vertex:ed,background_vert:nd,background_frag:id,backgroundCube_vert:sd,backgroundCube_frag:rd,cube_vert:od,cube_frag:ad,depth_vert:cd,depth_frag:ld,distanceRGBA_vert:hd,distanceRGBA_frag:ud,equirect_vert:fd,equirect_frag:dd,linedashed_vert:pd,linedashed_frag:md,meshbasic_vert:gd,meshbasic_frag:_d,meshlambert_vert:vd,meshlambert_frag:xd,meshmatcap_vert:Md,meshmatcap_frag:Sd,meshnormal_vert:yd,meshnormal_frag:Ed,meshphong_vert:bd,meshphong_frag:Td,meshphysical_vert:wd,meshphysical_frag:Ad,meshtoon_vert:Cd,meshtoon_frag:Rd,points_vert:Pd,points_frag:Ld,shadow_vert:Dd,shadow_frag:Id,sprite_vert:Ud,sprite_frag:Nd},St={common:{diffuse:{value:new pt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Xt},alphaMap:{value:null},alphaMapTransform:{value:new Xt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Xt}},envmap:{envMap:{value:null},envMapRotation:{value:new Xt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Xt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Xt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Xt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Xt},normalScale:{value:new ct(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Xt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Xt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Xt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Xt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new pt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new pt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Xt},alphaTest:{value:0},uvTransform:{value:new Xt}},sprite:{diffuse:{value:new pt(16777215)},opacity:{value:1},center:{value:new ct(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Xt},alphaMap:{value:null},alphaMapTransform:{value:new Xt},alphaTest:{value:0}}},en={basic:{uniforms:Ae([St.common,St.specularmap,St.envmap,St.aomap,St.lightmap,St.fog]),vertexShader:Yt.meshbasic_vert,fragmentShader:Yt.meshbasic_frag},lambert:{uniforms:Ae([St.common,St.specularmap,St.envmap,St.aomap,St.lightmap,St.emissivemap,St.bumpmap,St.normalmap,St.displacementmap,St.fog,St.lights,{emissive:{value:new pt(0)}}]),vertexShader:Yt.meshlambert_vert,fragmentShader:Yt.meshlambert_frag},phong:{uniforms:Ae([St.common,St.specularmap,St.envmap,St.aomap,St.lightmap,St.emissivemap,St.bumpmap,St.normalmap,St.displacementmap,St.fog,St.lights,{emissive:{value:new pt(0)},specular:{value:new pt(1118481)},shininess:{value:30}}]),vertexShader:Yt.meshphong_vert,fragmentShader:Yt.meshphong_frag},standard:{uniforms:Ae([St.common,St.envmap,St.aomap,St.lightmap,St.emissivemap,St.bumpmap,St.normalmap,St.displacementmap,St.roughnessmap,St.metalnessmap,St.fog,St.lights,{emissive:{value:new pt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Yt.meshphysical_vert,fragmentShader:Yt.meshphysical_frag},toon:{uniforms:Ae([St.common,St.aomap,St.lightmap,St.emissivemap,St.bumpmap,St.normalmap,St.displacementmap,St.gradientmap,St.fog,St.lights,{emissive:{value:new pt(0)}}]),vertexShader:Yt.meshtoon_vert,fragmentShader:Yt.meshtoon_frag},matcap:{uniforms:Ae([St.common,St.bumpmap,St.normalmap,St.displacementmap,St.fog,{matcap:{value:null}}]),vertexShader:Yt.meshmatcap_vert,fragmentShader:Yt.meshmatcap_frag},points:{uniforms:Ae([St.points,St.fog]),vertexShader:Yt.points_vert,fragmentShader:Yt.points_frag},dashed:{uniforms:Ae([St.common,St.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Yt.linedashed_vert,fragmentShader:Yt.linedashed_frag},depth:{uniforms:Ae([St.common,St.displacementmap]),vertexShader:Yt.depth_vert,fragmentShader:Yt.depth_frag},normal:{uniforms:Ae([St.common,St.bumpmap,St.normalmap,St.displacementmap,{opacity:{value:1}}]),vertexShader:Yt.meshnormal_vert,fragmentShader:Yt.meshnormal_frag},sprite:{uniforms:Ae([St.sprite,St.fog]),vertexShader:Yt.sprite_vert,fragmentShader:Yt.sprite_frag},background:{uniforms:{uvTransform:{value:new Xt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Yt.background_vert,fragmentShader:Yt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Xt}},vertexShader:Yt.backgroundCube_vert,fragmentShader:Yt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Yt.cube_vert,fragmentShader:Yt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Yt.equirect_vert,fragmentShader:Yt.equirect_frag},distanceRGBA:{uniforms:Ae([St.common,St.displacementmap,{referencePosition:{value:new U},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Yt.distanceRGBA_vert,fragmentShader:Yt.distanceRGBA_frag},shadow:{uniforms:Ae([St.lights,St.fog,{color:{value:new pt(0)},opacity:{value:1}}]),vertexShader:Yt.shadow_vert,fragmentShader:Yt.shadow_frag}};en.physical={uniforms:Ae([en.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Xt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Xt},clearcoatNormalScale:{value:new ct(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Xt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Xt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Xt},sheen:{value:0},sheenColor:{value:new pt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Xt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Xt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Xt},transmissionSamplerSize:{value:new ct},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Xt},attenuationDistance:{value:0},attenuationColor:{value:new pt(0)},specularColor:{value:new pt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Xt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Xt},anisotropyVector:{value:new ct},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Xt}}]),vertexShader:Yt.meshphysical_vert,fragmentShader:Yt.meshphysical_frag};const Cs={r:0,b:0,g:0},Bn=new an,Fd=new ae;function Od(i,t,e,n,s,r,o){const a=new pt(0);let c=r===!0?0:1,l,h,u=null,f=0,d=null;function g(y){let E=y.isScene===!0?y.background:null;return E&&E.isTexture&&(E=(y.backgroundBlurriness>0?e:t).get(E)),E}function v(y){let E=!1;const _=g(y);_===null?p(a,c):_&&_.isColor&&(p(_,1),E=!0);const D=i.xr.getEnvironmentBlendMode();D==="additive"?n.buffers.color.setClear(0,0,0,1,o):D==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||E)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(y,E){const _=g(E);_&&(_.isCubeTexture||_.mapping===Ks)?(h===void 0&&(h=new kt(new Je(1,1,1),new we({name:"BackgroundCubeMaterial",uniforms:wi(en.backgroundCube.uniforms),vertexShader:en.backgroundCube.vertexShader,fragmentShader:en.backgroundCube.fragmentShader,side:Le,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(D,S,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Bn.copy(E.backgroundRotation),Bn.x*=-1,Bn.y*=-1,Bn.z*=-1,_.isCubeTexture&&_.isRenderTargetTexture===!1&&(Bn.y*=-1,Bn.z*=-1),h.material.uniforms.envMap.value=_,h.material.uniforms.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=E.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Fd.makeRotationFromEuler(Bn)),h.material.toneMapped=jt.getTransfer(_.colorSpace)!==se,(u!==_||f!==_.version||d!==i.toneMapping)&&(h.material.needsUpdate=!0,u=_,f=_.version,d=i.toneMapping),h.layers.enableAll(),y.unshift(h,h.geometry,h.material,0,0,null)):_&&_.isTexture&&(l===void 0&&(l=new kt(new $n(2,2),new we({name:"BackgroundMaterial",uniforms:wi(en.background.uniforms),vertexShader:en.background.vertexShader,fragmentShader:en.background.fragmentShader,side:Ln,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(l)),l.material.uniforms.t2D.value=_,l.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,l.material.toneMapped=jt.getTransfer(_.colorSpace)!==se,_.matrixAutoUpdate===!0&&_.updateMatrix(),l.material.uniforms.uvTransform.value.copy(_.matrix),(u!==_||f!==_.version||d!==i.toneMapping)&&(l.material.needsUpdate=!0,u=_,f=_.version,d=i.toneMapping),l.layers.enableAll(),y.unshift(l,l.geometry,l.material,0,0,null))}function p(y,E){y.getRGB(Cs,tl(i)),n.buffers.color.setClear(Cs.r,Cs.g,Cs.b,E,o)}return{getClearColor:function(){return a},setClearColor:function(y,E=1){a.set(y),c=E,p(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(y){c=y,p(a,c)},render:v,addToRenderList:m}}function Bd(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=f(null);let r=s,o=!1;function a(x,C,k,V,X){let J=!1;const Y=u(V,k,C);r!==Y&&(r=Y,l(r.object)),J=d(x,V,k,X),J&&g(x,V,k,X),X!==null&&t.update(X,i.ELEMENT_ARRAY_BUFFER),(J||o)&&(o=!1,_(x,C,k,V),X!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(X).buffer))}function c(){return i.createVertexArray()}function l(x){return i.bindVertexArray(x)}function h(x){return i.deleteVertexArray(x)}function u(x,C,k){const V=k.wireframe===!0;let X=n[x.id];X===void 0&&(X={},n[x.id]=X);let J=X[C.id];J===void 0&&(J={},X[C.id]=J);let Y=J[V];return Y===void 0&&(Y=f(c()),J[V]=Y),Y}function f(x){const C=[],k=[],V=[];for(let X=0;X<e;X++)C[X]=0,k[X]=0,V[X]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:C,enabledAttributes:k,attributeDivisors:V,object:x,attributes:{},index:null}}function d(x,C,k,V){const X=r.attributes,J=C.attributes;let Y=0;const tt=k.getAttributes();for(const K in tt)if(tt[K].location>=0){const ut=X[K];let _t=J[K];if(_t===void 0&&(K==="instanceMatrix"&&x.instanceMatrix&&(_t=x.instanceMatrix),K==="instanceColor"&&x.instanceColor&&(_t=x.instanceColor)),ut===void 0||ut.attribute!==_t||_t&&ut.data!==_t.data)return!0;Y++}return r.attributesNum!==Y||r.index!==V}function g(x,C,k,V){const X={},J=C.attributes;let Y=0;const tt=k.getAttributes();for(const K in tt)if(tt[K].location>=0){let ut=J[K];ut===void 0&&(K==="instanceMatrix"&&x.instanceMatrix&&(ut=x.instanceMatrix),K==="instanceColor"&&x.instanceColor&&(ut=x.instanceColor));const _t={};_t.attribute=ut,ut&&ut.data&&(_t.data=ut.data),X[K]=_t,Y++}r.attributes=X,r.attributesNum=Y,r.index=V}function v(){const x=r.newAttributes;for(let C=0,k=x.length;C<k;C++)x[C]=0}function m(x){p(x,0)}function p(x,C){const k=r.newAttributes,V=r.enabledAttributes,X=r.attributeDivisors;k[x]=1,V[x]===0&&(i.enableVertexAttribArray(x),V[x]=1),X[x]!==C&&(i.vertexAttribDivisor(x,C),X[x]=C)}function y(){const x=r.newAttributes,C=r.enabledAttributes;for(let k=0,V=C.length;k<V;k++)C[k]!==x[k]&&(i.disableVertexAttribArray(k),C[k]=0)}function E(x,C,k,V,X,J,Y){Y===!0?i.vertexAttribIPointer(x,C,k,X,J):i.vertexAttribPointer(x,C,k,V,X,J)}function _(x,C,k,V){v();const X=V.attributes,J=k.getAttributes(),Y=C.defaultAttributeValues;for(const tt in J){const K=J[tt];if(K.location>=0){let ft=X[tt];if(ft===void 0&&(tt==="instanceMatrix"&&x.instanceMatrix&&(ft=x.instanceMatrix),tt==="instanceColor"&&x.instanceColor&&(ft=x.instanceColor)),ft!==void 0){const ut=ft.normalized,_t=ft.itemSize,Dt=t.get(ft);if(Dt===void 0)continue;const q=Dt.buffer,B=Dt.type,I=Dt.bytesPerElement,Z=B===i.INT||B===i.UNSIGNED_INT||ft.gpuType===Oo;if(ft.isInterleavedBufferAttribute){const W=ft.data,et=W.stride,xt=ft.offset;if(W.isInstancedInterleavedBuffer){for(let Rt=0;Rt<K.locationSize;Rt++)p(K.location+Rt,W.meshPerAttribute);x.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=W.meshPerAttribute*W.count)}else for(let Rt=0;Rt<K.locationSize;Rt++)m(K.location+Rt);i.bindBuffer(i.ARRAY_BUFFER,q);for(let Rt=0;Rt<K.locationSize;Rt++)E(K.location+Rt,_t/K.locationSize,B,ut,et*I,(xt+_t/K.locationSize*Rt)*I,Z)}else{if(ft.isInstancedBufferAttribute){for(let W=0;W<K.locationSize;W++)p(K.location+W,ft.meshPerAttribute);x.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=ft.meshPerAttribute*ft.count)}else for(let W=0;W<K.locationSize;W++)m(K.location+W);i.bindBuffer(i.ARRAY_BUFFER,q);for(let W=0;W<K.locationSize;W++)E(K.location+W,_t/K.locationSize,B,ut,_t*I,_t/K.locationSize*W*I,Z)}}else if(Y!==void 0){const ut=Y[tt];if(ut!==void 0)switch(ut.length){case 2:i.vertexAttrib2fv(K.location,ut);break;case 3:i.vertexAttrib3fv(K.location,ut);break;case 4:i.vertexAttrib4fv(K.location,ut);break;default:i.vertexAttrib1fv(K.location,ut)}}}}y()}function D(){P();for(const x in n){const C=n[x];for(const k in C){const V=C[k];for(const X in V)h(V[X].object),delete V[X];delete C[k]}delete n[x]}}function S(x){if(n[x.id]===void 0)return;const C=n[x.id];for(const k in C){const V=C[k];for(const X in V)h(V[X].object),delete V[X];delete C[k]}delete n[x.id]}function A(x){for(const C in n){const k=n[C];if(k[x.id]===void 0)continue;const V=k[x.id];for(const X in V)h(V[X].object),delete V[X];delete k[x.id]}}function P(){M(),o=!0,r!==s&&(r=s,l(r.object))}function M(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:P,resetDefaultState:M,dispose:D,releaseStatesOfGeometry:S,releaseStatesOfProgram:A,initAttributes:v,enableAttribute:m,disableUnusedAttributes:y}}function zd(i,t,e){let n;function s(l){n=l}function r(l,h){i.drawArrays(n,l,h),e.update(h,n,1)}function o(l,h,u){u!==0&&(i.drawArraysInstanced(n,l,h,u),e.update(h,n,u))}function a(l,h,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,h,0,u);let d=0;for(let g=0;g<u;g++)d+=h[g];e.update(d,n,1)}function c(l,h,u,f){if(u===0)return;const d=t.get("WEBGL_multi_draw");if(d===null)for(let g=0;g<l.length;g++)o(l[g],h[g],f[g]);else{d.multiDrawArraysInstancedWEBGL(n,l,0,h,0,f,0,u);let g=0;for(let v=0;v<u;v++)g+=h[v]*f[v];e.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=c}function kd(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const A=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(A){return!(A!==ze&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(A){const P=A===Ci&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(A!==on&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==rn&&!P)}function c(A){if(A==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=e.precision!==void 0?e.precision:"highp";const h=c(l);h!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);const u=e.logarithmicDepthBuffer===!0,f=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),y=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),E=i.getParameter(i.MAX_VARYING_VECTORS),_=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),D=g>0,S=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:u,reverseDepthBuffer:f,maxTextures:d,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:y,maxVaryings:E,maxFragmentUniforms:_,vertexTextures:D,maxSamples:S}}function Vd(i){const t=this;let e=null,n=0,s=!1,r=!1;const o=new Vn,a=new Xt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){const d=u.length!==0||f||n!==0||s;return s=f,n=u.length,d},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,f){e=h(u,f,0)},this.setState=function(u,f,d){const g=u.clippingPlanes,v=u.clipIntersection,m=u.clipShadows,p=i.get(u);if(!s||g===null||g.length===0||r&&!m)r?h(null):l();else{const y=r?0:n,E=y*4;let _=p.clippingState||null;c.value=_,_=h(g,f,E,d);for(let D=0;D!==E;++D)_[D]=e[D];p.clippingState=_,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=y}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(u,f,d,g){const v=u!==null?u.length:0;let m=null;if(v!==0){if(m=c.value,g!==!0||m===null){const p=d+v*4,y=f.matrixWorldInverse;a.getNormalMatrix(y),(m===null||m.length<p)&&(m=new Float32Array(p));for(let E=0,_=d;E!==v;++E,_+=4)o.copy(u[E]).applyMatrix4(y,a),o.normal.toArray(m,_),m[_+3]=o.constant}c.value=m,c.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,m}}function Gd(i){let t=new WeakMap;function e(o,a){return a===Jr?o.mapping=Si:a===$r&&(o.mapping=yi),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===Jr||a===$r)if(t.has(o)){const c=t.get(o).texture;return e(c,o.mapping)}else{const c=o.image;if(c&&c.height>0){const l=new jh(c.height);return l.fromEquirectangularTexture(i,o),t.set(o,l),o.addEventListener("dispose",s),e(l.texture,o.mapping)}else return null}}return o}function s(o){const a=o.target;a.removeEventListener("dispose",s);const c=t.get(a);c!==void 0&&(t.delete(a),c.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}class Xo extends el{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,o=n+t,a=s+e,c=s-e;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=h*this.view.offsetY,c=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const gi=4,Fa=[.125,.215,.35,.446,.526,.582],Wn=20,Ar=new Xo,Oa=new pt;let Cr=null,Rr=0,Pr=0,Lr=!1;const Gn=(1+Math.sqrt(5))/2,fi=1/Gn,Ba=[new U(-Gn,fi,0),new U(Gn,fi,0),new U(-fi,0,Gn),new U(fi,0,Gn),new U(0,Gn,-fi),new U(0,Gn,fi),new U(-1,1,-1),new U(1,1,-1),new U(-1,1,1),new U(1,1,1)];class Ao{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){Cr=this._renderer.getRenderTarget(),Rr=this._renderer.getActiveCubeFace(),Pr=this._renderer.getActiveMipmapLevel(),Lr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Va(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ka(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Cr,Rr,Pr),this._renderer.xr.enabled=Lr,t.scissorTest=!1,Rs(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Si||t.mapping===yi?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Cr=this._renderer.getRenderTarget(),Rr=this._renderer.getActiveCubeFace(),Pr=this._renderer.getActiveMipmapLevel(),Lr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Re,minFilter:Re,generateMipmaps:!1,type:Ci,format:ze,colorSpace:Ri,depthBuffer:!1},s=za(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=za(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Hd(r)),this._blurMaterial=Wd(r,t,e)}return s}_compileMaterial(t){const e=new kt(this._lodPlanes[0],t);this._renderer.compile(e,Ar)}_sceneToCubeUV(t,e,n,s){const a=new Be(90,1,e,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,f=h.toneMapping;h.getClearColor(Oa),h.toneMapping=xn,h.autoClear=!1;const d=new Zn({name:"PMREM.Background",side:Le,depthWrite:!1,depthTest:!1}),g=new kt(new Je,d);let v=!1;const m=t.background;m?m.isColor&&(d.color.copy(m),t.background=null,v=!0):(d.color.copy(Oa),v=!0);for(let p=0;p<6;p++){const y=p%3;y===0?(a.up.set(0,c[p],0),a.lookAt(l[p],0,0)):y===1?(a.up.set(0,0,c[p]),a.lookAt(0,l[p],0)):(a.up.set(0,c[p],0),a.lookAt(0,0,l[p]));const E=this._cubeSize;Rs(s,y*E,p>2?E:0,E,E),h.setRenderTarget(s),v&&h.render(g,a),h.render(t,a)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=f,h.autoClear=u,t.background=m}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===Si||t.mapping===yi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Va()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ka());const r=s?this._cubemapMaterial:this._equirectMaterial,o=new kt(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;const c=this._cubeSize;Rs(e,0,0,3*c,2*c),n.setRenderTarget(e),n.render(o,Ar)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodPlanes.length;for(let r=1;r<s;r++){const o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Ba[(s-r-1)%Ba.length];this._blur(t,r-1,r,o,a)}e.autoClear=n}_blur(t,e,n,s,r){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,s,"latitudinal",r),this._halfBlur(o,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,o,a){const c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,u=new kt(this._lodPlanes[s],l),f=l.uniforms,d=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*d):2*Math.PI/(2*Wn-1),v=r/g,m=isFinite(r)?1+Math.floor(h*v):Wn;m>Wn&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Wn}`);const p=[];let y=0;for(let A=0;A<Wn;++A){const P=A/v,M=Math.exp(-P*P/2);p.push(M),A===0?y+=M:A<m&&(y+=2*M)}for(let A=0;A<p.length;A++)p[A]=p[A]/y;f.envMap.value=t.texture,f.samples.value=m,f.weights.value=p,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);const{_lodMax:E}=this;f.dTheta.value=g,f.mipInt.value=E-n;const _=this._sizeLods[s],D=3*_*(s>E-gi?s-E+gi:0),S=4*(this._cubeSize-_);Rs(e,D,S,3*_,2*_),c.setRenderTarget(e),c.render(u,Ar)}}function Hd(i){const t=[],e=[],n=[];let s=i;const r=i-gi+1+Fa.length;for(let o=0;o<r;o++){const a=Math.pow(2,s);e.push(a);let c=1/a;o>i-gi?c=Fa[o-i+gi-1]:o===0&&(c=0),n.push(c);const l=1/(a-2),h=-l,u=1+l,f=[h,h,u,h,u,u,h,h,u,u,h,u],d=6,g=6,v=3,m=2,p=1,y=new Float32Array(v*g*d),E=new Float32Array(m*g*d),_=new Float32Array(p*g*d);for(let S=0;S<d;S++){const A=S%3*2/3-1,P=S>2?0:-1,M=[A,P,0,A+2/3,P,0,A+2/3,P+1,0,A,P,0,A+2/3,P+1,0,A,P+1,0];y.set(M,v*g*S),E.set(f,m*g*S);const x=[S,S,S,S,S,S];_.set(x,p*g*S)}const D=new xe;D.setAttribute("position",new Pe(y,v)),D.setAttribute("uv",new Pe(E,m)),D.setAttribute("faceIndex",new Pe(_,p)),t.push(D),s>gi&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function za(i,t,e){const n=new Dn(i,t,e);return n.texture.mapping=Ks,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Rs(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function Wd(i,t,e){const n=new Float32Array(Wn),s=new U(0,1,0);return new we({name:"SphericalGaussianBlur",defines:{n:Wn,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Yo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Pn,depthTest:!1,depthWrite:!1})}function ka(){return new we({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Yo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Pn,depthTest:!1,depthWrite:!1})}function Va(){return new we({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Yo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Pn,depthTest:!1,depthWrite:!1})}function Yo(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Xd(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const c=a.mapping,l=c===Jr||c===$r,h=c===Si||c===yi;if(l||h){let u=t.get(a);const f=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==f)return e===null&&(e=new Ao(i)),u=l?e.fromEquirectangular(a,u):e.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),u.texture;if(u!==void 0)return u.texture;{const d=a.image;return l&&d&&d.height>0||h&&d&&s(d)?(e===null&&(e=new Ao(i)),u=l?e.fromEquirectangular(a):e.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let c=0;const l=6;for(let h=0;h<l;h++)a[h]!==void 0&&c++;return c===l}function r(a){const c=a.target;c.removeEventListener("dispose",r);const l=t.get(c);l!==void 0&&(t.delete(c),l.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function Yd(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&qi("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function qd(i,t,e,n){const s={},r=new WeakMap;function o(u){const f=u.target;f.index!==null&&t.remove(f.index);for(const g in f.attributes)t.remove(f.attributes[g]);for(const g in f.morphAttributes){const v=f.morphAttributes[g];for(let m=0,p=v.length;m<p;m++)t.remove(v[m])}f.removeEventListener("dispose",o),delete s[f.id];const d=r.get(f);d&&(t.remove(d),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,e.memory.geometries--}function a(u,f){return s[f.id]===!0||(f.addEventListener("dispose",o),s[f.id]=!0,e.memory.geometries++),f}function c(u){const f=u.attributes;for(const g in f)t.update(f[g],i.ARRAY_BUFFER);const d=u.morphAttributes;for(const g in d){const v=d[g];for(let m=0,p=v.length;m<p;m++)t.update(v[m],i.ARRAY_BUFFER)}}function l(u){const f=[],d=u.index,g=u.attributes.position;let v=0;if(d!==null){const y=d.array;v=d.version;for(let E=0,_=y.length;E<_;E+=3){const D=y[E+0],S=y[E+1],A=y[E+2];f.push(D,S,S,A,A,D)}}else if(g!==void 0){const y=g.array;v=g.version;for(let E=0,_=y.length/3-1;E<_;E+=3){const D=E+0,S=E+1,A=E+2;f.push(D,S,S,A,A,D)}}else return;const m=new(Yc(f)?Qc:jc)(f,1);m.version=v;const p=r.get(u);p&&t.remove(p),r.set(u,m)}function h(u){const f=r.get(u);if(f){const d=u.index;d!==null&&f.version<d.version&&l(u)}else l(u);return r.get(u)}return{get:a,update:c,getWireframeAttribute:h}}function Zd(i,t,e){let n;function s(f){n=f}let r,o;function a(f){r=f.type,o=f.bytesPerElement}function c(f,d){i.drawElements(n,d,r,f*o),e.update(d,n,1)}function l(f,d,g){g!==0&&(i.drawElementsInstanced(n,d,r,f*o,g),e.update(d,n,g))}function h(f,d,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,f,0,g);let m=0;for(let p=0;p<g;p++)m+=d[p];e.update(m,n,1)}function u(f,d,g,v){if(g===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<f.length;p++)l(f[p]/o,d[p],v[p]);else{m.multiDrawElementsInstancedWEBGL(n,d,0,r,f,0,v,0,g);let p=0;for(let y=0;y<g;y++)p+=d[y]*v[y];e.update(p,n,1)}}this.setMode=s,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function Kd(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function Jd(i,t,e){const n=new WeakMap,s=new oe;function r(o,a,c){const l=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0;let f=n.get(a);if(f===void 0||f.count!==u){let M=function(){A.dispose(),n.delete(a),a.removeEventListener("dispose",M)};f!==void 0&&f.texture.dispose();const d=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,v=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],y=a.morphAttributes.color||[];let E=0;d===!0&&(E=1),g===!0&&(E=2),v===!0&&(E=3);let _=a.attributes.position.count*E,D=1;_>t.maxTextureSize&&(D=Math.ceil(_/t.maxTextureSize),_=t.maxTextureSize);const S=new Float32Array(_*D*4*u),A=new Zc(S,_,D,u);A.type=rn,A.needsUpdate=!0;const P=E*4;for(let x=0;x<u;x++){const C=m[x],k=p[x],V=y[x],X=_*D*4*x;for(let J=0;J<C.count;J++){const Y=J*P;d===!0&&(s.fromBufferAttribute(C,J),S[X+Y+0]=s.x,S[X+Y+1]=s.y,S[X+Y+2]=s.z,S[X+Y+3]=0),g===!0&&(s.fromBufferAttribute(k,J),S[X+Y+4]=s.x,S[X+Y+5]=s.y,S[X+Y+6]=s.z,S[X+Y+7]=0),v===!0&&(s.fromBufferAttribute(V,J),S[X+Y+8]=s.x,S[X+Y+9]=s.y,S[X+Y+10]=s.z,S[X+Y+11]=V.itemSize===4?s.w:1)}}f={count:u,texture:A,size:new ct(_,D)},n.set(a,f),a.addEventListener("dispose",M)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let d=0;for(let v=0;v<l.length;v++)d+=l[v];const g=a.morphTargetsRelative?1:1-d;c.getUniforms().setValue(i,"morphTargetBaseInfluence",g),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",f.texture,e),c.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}return{update:r}}function $d(i,t,e,n){let s=new WeakMap;function r(c){const l=n.render.frame,h=c.geometry,u=t.get(c,h);if(s.get(u)!==l&&(t.update(u),s.set(u,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),s.get(c)!==l&&(e.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,i.ARRAY_BUFFER),s.set(c,l))),c.isSkinnedMesh){const f=c.skeleton;s.get(f)!==l&&(f.update(),s.set(f,l))}return u}function o(){s=new WeakMap}function a(c){const l=c.target;l.removeEventListener("dispose",a),e.remove(l.instanceMatrix),l.instanceColor!==null&&e.remove(l.instanceColor)}return{update:r,dispose:o}}class sl extends Te{constructor(t,e,n,s,r,o,a,c,l,h=vi){if(h!==vi&&h!==Ti)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===vi&&(n=qn),n===void 0&&h===Ti&&(n=bi),super(null,s,r,o,a,c,h,n,l),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:ke,this.minFilter=c!==void 0?c:ke,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const rl=new Te,Ga=new sl(1,1),ol=new Zc,al=new Fh,cl=new nl,Ha=[],Wa=[],Xa=new Float32Array(16),Ya=new Float32Array(9),qa=new Float32Array(4);function Ui(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=Ha[s];if(r===void 0&&(r=new Float32Array(s),Ha[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function me(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function ge(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function $s(i,t){let e=Wa[t];e===void 0&&(e=new Int32Array(t),Wa[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function jd(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Qd(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(me(e,t))return;i.uniform2fv(this.addr,t),ge(e,t)}}function tp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(me(e,t))return;i.uniform3fv(this.addr,t),ge(e,t)}}function ep(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(me(e,t))return;i.uniform4fv(this.addr,t),ge(e,t)}}function np(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(me(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),ge(e,t)}else{if(me(e,n))return;qa.set(n),i.uniformMatrix2fv(this.addr,!1,qa),ge(e,n)}}function ip(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(me(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),ge(e,t)}else{if(me(e,n))return;Ya.set(n),i.uniformMatrix3fv(this.addr,!1,Ya),ge(e,n)}}function sp(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(me(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),ge(e,t)}else{if(me(e,n))return;Xa.set(n),i.uniformMatrix4fv(this.addr,!1,Xa),ge(e,n)}}function rp(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function op(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(me(e,t))return;i.uniform2iv(this.addr,t),ge(e,t)}}function ap(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(me(e,t))return;i.uniform3iv(this.addr,t),ge(e,t)}}function cp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(me(e,t))return;i.uniform4iv(this.addr,t),ge(e,t)}}function lp(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function hp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(me(e,t))return;i.uniform2uiv(this.addr,t),ge(e,t)}}function up(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(me(e,t))return;i.uniform3uiv(this.addr,t),ge(e,t)}}function fp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(me(e,t))return;i.uniform4uiv(this.addr,t),ge(e,t)}}function dp(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Ga.compareFunction=Xc,r=Ga):r=rl,e.setTexture2D(t||r,s)}function pp(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||al,s)}function mp(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||cl,s)}function gp(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||ol,s)}function _p(i){switch(i){case 5126:return jd;case 35664:return Qd;case 35665:return tp;case 35666:return ep;case 35674:return np;case 35675:return ip;case 35676:return sp;case 5124:case 35670:return rp;case 35667:case 35671:return op;case 35668:case 35672:return ap;case 35669:case 35673:return cp;case 5125:return lp;case 36294:return hp;case 36295:return up;case 36296:return fp;case 35678:case 36198:case 36298:case 36306:case 35682:return dp;case 35679:case 36299:case 36307:return pp;case 35680:case 36300:case 36308:case 36293:return mp;case 36289:case 36303:case 36311:case 36292:return gp}}function vp(i,t){i.uniform1fv(this.addr,t)}function xp(i,t){const e=Ui(t,this.size,2);i.uniform2fv(this.addr,e)}function Mp(i,t){const e=Ui(t,this.size,3);i.uniform3fv(this.addr,e)}function Sp(i,t){const e=Ui(t,this.size,4);i.uniform4fv(this.addr,e)}function yp(i,t){const e=Ui(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Ep(i,t){const e=Ui(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function bp(i,t){const e=Ui(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Tp(i,t){i.uniform1iv(this.addr,t)}function wp(i,t){i.uniform2iv(this.addr,t)}function Ap(i,t){i.uniform3iv(this.addr,t)}function Cp(i,t){i.uniform4iv(this.addr,t)}function Rp(i,t){i.uniform1uiv(this.addr,t)}function Pp(i,t){i.uniform2uiv(this.addr,t)}function Lp(i,t){i.uniform3uiv(this.addr,t)}function Dp(i,t){i.uniform4uiv(this.addr,t)}function Ip(i,t,e){const n=this.cache,s=t.length,r=$s(e,s);me(n,r)||(i.uniform1iv(this.addr,r),ge(n,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||rl,r[o])}function Up(i,t,e){const n=this.cache,s=t.length,r=$s(e,s);me(n,r)||(i.uniform1iv(this.addr,r),ge(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||al,r[o])}function Np(i,t,e){const n=this.cache,s=t.length,r=$s(e,s);me(n,r)||(i.uniform1iv(this.addr,r),ge(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||cl,r[o])}function Fp(i,t,e){const n=this.cache,s=t.length,r=$s(e,s);me(n,r)||(i.uniform1iv(this.addr,r),ge(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||ol,r[o])}function Op(i){switch(i){case 5126:return vp;case 35664:return xp;case 35665:return Mp;case 35666:return Sp;case 35674:return yp;case 35675:return Ep;case 35676:return bp;case 5124:case 35670:return Tp;case 35667:case 35671:return wp;case 35668:case 35672:return Ap;case 35669:case 35673:return Cp;case 5125:return Rp;case 36294:return Pp;case 36295:return Lp;case 36296:return Dp;case 35678:case 36198:case 36298:case 36306:case 35682:return Ip;case 35679:case 36299:case 36307:return Up;case 35680:case 36300:case 36308:case 36293:return Np;case 36289:case 36303:case 36311:case 36292:return Fp}}class Bp{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=_p(e.type)}}class zp{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Op(e.type)}}class kp{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,o=s.length;r!==o;++r){const a=s[r];a.setValue(t,e[a.id],n)}}}const Dr=/(\w+)(\])?(\[|\.)?/g;function Za(i,t){i.seq.push(t),i.map[t.id]=t}function Vp(i,t,e){const n=i.name,s=n.length;for(Dr.lastIndex=0;;){const r=Dr.exec(n),o=Dr.lastIndex;let a=r[1];const c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===s){Za(e,l===void 0?new Bp(a,i,t):new zp(a,i,t));break}else{let u=e.map[a];u===void 0&&(u=new kp(a),Za(e,u)),e=u}}}class Hs{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);Vp(r,o,this)}}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){const a=e[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(t,c.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const o=t[s];o.id in e&&n.push(o)}return n}}function Ka(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const Gp=37297;let Hp=0;function Wp(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}const Ja=new Xt;function Xp(i){jt._getMatrix(Ja,jt.workingColorSpace,i);const t=`mat3( ${Ja.elements.map(e=>e.toFixed(4))} )`;switch(jt.getTransfer(i)){case Js:return[t,"LinearTransferOETF"];case se:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function $a(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+Wp(i.getShaderSource(t),o)}else return s}function Yp(i,t){const e=Xp(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function qp(i,t){let e;switch(t){case lh:e="Linear";break;case hh:e="Reinhard";break;case uh:e="Cineon";break;case fh:e="ACESFilmic";break;case ph:e="AgX";break;case mh:e="Neutral";break;case dh:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const Ps=new U;function Zp(){jt.getLuminanceCoefficients(Ps);const i=Ps.x.toFixed(4),t=Ps.y.toFixed(4),e=Ps.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Kp(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Zi).join(`
`)}function Jp(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function $p(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),o=r.name;let a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function Zi(i){return i!==""}function ja(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Qa(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const jp=/^[ \t]*#include +<([\w\d./]+)>/gm;function Co(i){return i.replace(jp,tm)}const Qp=new Map;function tm(i,t){let e=Yt[t];if(e===void 0){const n=Qp.get(t);if(n!==void 0)e=Yt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return Co(e)}const em=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function tc(i){return i.replace(em,nm)}function nm(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function ec(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function im(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Fo?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===Dc?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===gn&&(t="SHADOWMAP_TYPE_VSM"),t}function sm(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Si:case yi:t="ENVMAP_TYPE_CUBE";break;case Ks:t="ENVMAP_TYPE_CUBE_UV";break}return t}function rm(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case yi:t="ENVMAP_MODE_REFRACTION";break}return t}function om(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Ic:t="ENVMAP_BLENDING_MULTIPLY";break;case ah:t="ENVMAP_BLENDING_MIX";break;case ch:t="ENVMAP_BLENDING_ADD";break}return t}function am(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function cm(i,t,e,n){const s=i.getContext(),r=e.defines;let o=e.vertexShader,a=e.fragmentShader;const c=im(e),l=sm(e),h=rm(e),u=om(e),f=am(e),d=Kp(e),g=Jp(r),v=s.createProgram();let m,p,y=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Zi).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Zi).join(`
`),p.length>0&&(p+=`
`)):(m=[ec(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Zi).join(`
`),p=[ec(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==xn?"#define TONE_MAPPING":"",e.toneMapping!==xn?Yt.tonemapping_pars_fragment:"",e.toneMapping!==xn?qp("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Yt.colorspace_pars_fragment,Yp("linearToOutputTexel",e.outputColorSpace),Zp(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Zi).join(`
`)),o=Co(o),o=ja(o,e),o=Qa(o,e),a=Co(a),a=ja(a,e),a=Qa(a,e),o=tc(o),a=tc(a),e.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,m=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",e.glslVersion===ma?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===ma?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const E=y+m+o,_=y+p+a,D=Ka(s,s.VERTEX_SHADER,E),S=Ka(s,s.FRAGMENT_SHADER,_);s.attachShader(v,D),s.attachShader(v,S),e.index0AttributeName!==void 0?s.bindAttribLocation(v,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(v,0,"position"),s.linkProgram(v);function A(C){if(i.debug.checkShaderErrors){const k=s.getProgramInfoLog(v).trim(),V=s.getShaderInfoLog(D).trim(),X=s.getShaderInfoLog(S).trim();let J=!0,Y=!0;if(s.getProgramParameter(v,s.LINK_STATUS)===!1)if(J=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,v,D,S);else{const tt=$a(s,D,"vertex"),K=$a(s,S,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(v,s.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+k+`
`+tt+`
`+K)}else k!==""?console.warn("THREE.WebGLProgram: Program Info Log:",k):(V===""||X==="")&&(Y=!1);Y&&(C.diagnostics={runnable:J,programLog:k,vertexShader:{log:V,prefix:m},fragmentShader:{log:X,prefix:p}})}s.deleteShader(D),s.deleteShader(S),P=new Hs(s,v),M=$p(s,v)}let P;this.getUniforms=function(){return P===void 0&&A(this),P};let M;this.getAttributes=function(){return M===void 0&&A(this),M};let x=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return x===!1&&(x=s.getProgramParameter(v,Gp)),x},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(v),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Hp++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=D,this.fragmentShader=S,this}let lm=0;class hm{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new um(t),e.set(t,n)),n}}class um{constructor(t){this.id=lm++,this.code=t,this.usedTimes=0}}function fm(i,t,e,n,s,r,o){const a=new Jc,c=new hm,l=new Set,h=[],u=s.logarithmicDepthBuffer,f=s.vertexTextures;let d=s.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(M){return l.add(M),M===0?"uv":`uv${M}`}function m(M,x,C,k,V){const X=k.fog,J=V.geometry,Y=M.isMeshStandardMaterial?k.environment:null,tt=(M.isMeshStandardMaterial?e:t).get(M.envMap||Y),K=tt&&tt.mapping===Ks?tt.image.height:null,ft=g[M.type];M.precision!==null&&(d=s.getMaxPrecision(M.precision),d!==M.precision&&console.warn("THREE.WebGLProgram.getParameters:",M.precision,"not supported, using",d,"instead."));const ut=J.morphAttributes.position||J.morphAttributes.normal||J.morphAttributes.color,_t=ut!==void 0?ut.length:0;let Dt=0;J.morphAttributes.position!==void 0&&(Dt=1),J.morphAttributes.normal!==void 0&&(Dt=2),J.morphAttributes.color!==void 0&&(Dt=3);let q,B,I,Z;if(ft){const ie=en[ft];q=ie.vertexShader,B=ie.fragmentShader}else q=M.vertexShader,B=M.fragmentShader,c.update(M),I=c.getVertexShaderID(M),Z=c.getFragmentShaderID(M);const W=i.getRenderTarget(),et=i.state.buffers.depth.getReversed(),xt=V.isInstancedMesh===!0,Rt=V.isBatchedMesh===!0,Gt=!!M.map,rt=!!M.matcap,ht=!!tt,L=!!M.aoMap,Pt=!!M.lightMap,lt=!!M.bumpMap,Tt=!!M.normalMap,gt=!!M.displacementMap,Ot=!!M.emissiveMap,wt=!!M.metalnessMap,R=!!M.roughnessMap,b=M.anisotropy>0,w=M.clearcoat>0,N=M.dispersion>0,F=M.iridescence>0,O=M.sheen>0,$=M.transmission>0,it=b&&!!M.anisotropyMap,ot=w&&!!M.clearcoatMap,Lt=w&&!!M.clearcoatNormalMap,nt=w&&!!M.clearcoatRoughnessMap,dt=F&&!!M.iridescenceMap,Ct=F&&!!M.iridescenceThicknessMap,At=O&&!!M.sheenColorMap,Mt=O&&!!M.sheenRoughnessMap,Bt=!!M.specularMap,zt=!!M.specularColorMap,Jt=!!M.specularIntensityMap,z=$&&!!M.transmissionMap,vt=$&&!!M.thicknessMap,st=!!M.gradientMap,at=!!M.alphaMap,bt=M.alphaTest>0,yt=!!M.alphaHash,Ht=!!M.extensions;let fe=xn;M.toneMapped&&(W===null||W.isXRRenderTarget===!0)&&(fe=i.toneMapping);const Me={shaderID:ft,shaderType:M.type,shaderName:M.name,vertexShader:q,fragmentShader:B,defines:M.defines,customVertexShaderID:I,customFragmentShaderID:Z,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:d,batching:Rt,batchingColor:Rt&&V._colorsTexture!==null,instancing:xt,instancingColor:xt&&V.instanceColor!==null,instancingMorph:xt&&V.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:W===null?i.outputColorSpace:W.isXRRenderTarget===!0?W.texture.colorSpace:Ri,alphaToCoverage:!!M.alphaToCoverage,map:Gt,matcap:rt,envMap:ht,envMapMode:ht&&tt.mapping,envMapCubeUVHeight:K,aoMap:L,lightMap:Pt,bumpMap:lt,normalMap:Tt,displacementMap:f&&gt,emissiveMap:Ot,normalMapObjectSpace:Tt&&M.normalMapType===xh,normalMapTangentSpace:Tt&&M.normalMapType===Wc,metalnessMap:wt,roughnessMap:R,anisotropy:b,anisotropyMap:it,clearcoat:w,clearcoatMap:ot,clearcoatNormalMap:Lt,clearcoatRoughnessMap:nt,dispersion:N,iridescence:F,iridescenceMap:dt,iridescenceThicknessMap:Ct,sheen:O,sheenColorMap:At,sheenRoughnessMap:Mt,specularMap:Bt,specularColorMap:zt,specularIntensityMap:Jt,transmission:$,transmissionMap:z,thicknessMap:vt,gradientMap:st,opaque:M.transparent===!1&&M.blending===vn&&M.alphaToCoverage===!1,alphaMap:at,alphaTest:bt,alphaHash:yt,combine:M.combine,mapUv:Gt&&v(M.map.channel),aoMapUv:L&&v(M.aoMap.channel),lightMapUv:Pt&&v(M.lightMap.channel),bumpMapUv:lt&&v(M.bumpMap.channel),normalMapUv:Tt&&v(M.normalMap.channel),displacementMapUv:gt&&v(M.displacementMap.channel),emissiveMapUv:Ot&&v(M.emissiveMap.channel),metalnessMapUv:wt&&v(M.metalnessMap.channel),roughnessMapUv:R&&v(M.roughnessMap.channel),anisotropyMapUv:it&&v(M.anisotropyMap.channel),clearcoatMapUv:ot&&v(M.clearcoatMap.channel),clearcoatNormalMapUv:Lt&&v(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:nt&&v(M.clearcoatRoughnessMap.channel),iridescenceMapUv:dt&&v(M.iridescenceMap.channel),iridescenceThicknessMapUv:Ct&&v(M.iridescenceThicknessMap.channel),sheenColorMapUv:At&&v(M.sheenColorMap.channel),sheenRoughnessMapUv:Mt&&v(M.sheenRoughnessMap.channel),specularMapUv:Bt&&v(M.specularMap.channel),specularColorMapUv:zt&&v(M.specularColorMap.channel),specularIntensityMapUv:Jt&&v(M.specularIntensityMap.channel),transmissionMapUv:z&&v(M.transmissionMap.channel),thicknessMapUv:vt&&v(M.thicknessMap.channel),alphaMapUv:at&&v(M.alphaMap.channel),vertexTangents:!!J.attributes.tangent&&(Tt||b),vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!J.attributes.color&&J.attributes.color.itemSize===4,pointsUvs:V.isPoints===!0&&!!J.attributes.uv&&(Gt||at),fog:!!X,useFog:M.fog===!0,fogExp2:!!X&&X.isFogExp2,flatShading:M.flatShading===!0,sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:et,skinning:V.isSkinnedMesh===!0,morphTargets:J.morphAttributes.position!==void 0,morphNormals:J.morphAttributes.normal!==void 0,morphColors:J.morphAttributes.color!==void 0,morphTargetsCount:_t,morphTextureStride:Dt,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:M.dithering,shadowMapEnabled:i.shadowMap.enabled&&C.length>0,shadowMapType:i.shadowMap.type,toneMapping:fe,decodeVideoTexture:Gt&&M.map.isVideoTexture===!0&&jt.getTransfer(M.map.colorSpace)===se,decodeVideoTextureEmissive:Ot&&M.emissiveMap.isVideoTexture===!0&&jt.getTransfer(M.emissiveMap.colorSpace)===se,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===Ce,flipSided:M.side===Le,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:Ht&&M.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ht&&M.extensions.multiDraw===!0||Rt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return Me.vertexUv1s=l.has(1),Me.vertexUv2s=l.has(2),Me.vertexUv3s=l.has(3),l.clear(),Me}function p(M){const x=[];if(M.shaderID?x.push(M.shaderID):(x.push(M.customVertexShaderID),x.push(M.customFragmentShaderID)),M.defines!==void 0)for(const C in M.defines)x.push(C),x.push(M.defines[C]);return M.isRawShaderMaterial===!1&&(y(x,M),E(x,M),x.push(i.outputColorSpace)),x.push(M.customProgramCacheKey),x.join()}function y(M,x){M.push(x.precision),M.push(x.outputColorSpace),M.push(x.envMapMode),M.push(x.envMapCubeUVHeight),M.push(x.mapUv),M.push(x.alphaMapUv),M.push(x.lightMapUv),M.push(x.aoMapUv),M.push(x.bumpMapUv),M.push(x.normalMapUv),M.push(x.displacementMapUv),M.push(x.emissiveMapUv),M.push(x.metalnessMapUv),M.push(x.roughnessMapUv),M.push(x.anisotropyMapUv),M.push(x.clearcoatMapUv),M.push(x.clearcoatNormalMapUv),M.push(x.clearcoatRoughnessMapUv),M.push(x.iridescenceMapUv),M.push(x.iridescenceThicknessMapUv),M.push(x.sheenColorMapUv),M.push(x.sheenRoughnessMapUv),M.push(x.specularMapUv),M.push(x.specularColorMapUv),M.push(x.specularIntensityMapUv),M.push(x.transmissionMapUv),M.push(x.thicknessMapUv),M.push(x.combine),M.push(x.fogExp2),M.push(x.sizeAttenuation),M.push(x.morphTargetsCount),M.push(x.morphAttributeCount),M.push(x.numDirLights),M.push(x.numPointLights),M.push(x.numSpotLights),M.push(x.numSpotLightMaps),M.push(x.numHemiLights),M.push(x.numRectAreaLights),M.push(x.numDirLightShadows),M.push(x.numPointLightShadows),M.push(x.numSpotLightShadows),M.push(x.numSpotLightShadowsWithMaps),M.push(x.numLightProbes),M.push(x.shadowMapType),M.push(x.toneMapping),M.push(x.numClippingPlanes),M.push(x.numClipIntersection),M.push(x.depthPacking)}function E(M,x){a.disableAll(),x.supportsVertexTextures&&a.enable(0),x.instancing&&a.enable(1),x.instancingColor&&a.enable(2),x.instancingMorph&&a.enable(3),x.matcap&&a.enable(4),x.envMap&&a.enable(5),x.normalMapObjectSpace&&a.enable(6),x.normalMapTangentSpace&&a.enable(7),x.clearcoat&&a.enable(8),x.iridescence&&a.enable(9),x.alphaTest&&a.enable(10),x.vertexColors&&a.enable(11),x.vertexAlphas&&a.enable(12),x.vertexUv1s&&a.enable(13),x.vertexUv2s&&a.enable(14),x.vertexUv3s&&a.enable(15),x.vertexTangents&&a.enable(16),x.anisotropy&&a.enable(17),x.alphaHash&&a.enable(18),x.batching&&a.enable(19),x.dispersion&&a.enable(20),x.batchingColor&&a.enable(21),M.push(a.mask),a.disableAll(),x.fog&&a.enable(0),x.useFog&&a.enable(1),x.flatShading&&a.enable(2),x.logarithmicDepthBuffer&&a.enable(3),x.reverseDepthBuffer&&a.enable(4),x.skinning&&a.enable(5),x.morphTargets&&a.enable(6),x.morphNormals&&a.enable(7),x.morphColors&&a.enable(8),x.premultipliedAlpha&&a.enable(9),x.shadowMapEnabled&&a.enable(10),x.doubleSided&&a.enable(11),x.flipSided&&a.enable(12),x.useDepthPacking&&a.enable(13),x.dithering&&a.enable(14),x.transmission&&a.enable(15),x.sheen&&a.enable(16),x.opaque&&a.enable(17),x.pointsUvs&&a.enable(18),x.decodeVideoTexture&&a.enable(19),x.decodeVideoTextureEmissive&&a.enable(20),x.alphaToCoverage&&a.enable(21),M.push(a.mask)}function _(M){const x=g[M.type];let C;if(x){const k=en[x];C=Zh.clone(k.uniforms)}else C=M.uniforms;return C}function D(M,x){let C;for(let k=0,V=h.length;k<V;k++){const X=h[k];if(X.cacheKey===x){C=X,++C.usedTimes;break}}return C===void 0&&(C=new cm(i,x,M,r),h.push(C)),C}function S(M){if(--M.usedTimes===0){const x=h.indexOf(M);h[x]=h[h.length-1],h.pop(),M.destroy()}}function A(M){c.remove(M)}function P(){c.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:_,acquireProgram:D,releaseProgram:S,releaseShaderCache:A,programs:h,dispose:P}}function dm(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,c){i.get(o)[a]=c}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function pm(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function nc(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function ic(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(u,f,d,g,v,m){let p=i[t];return p===void 0?(p={id:u.id,object:u,geometry:f,material:d,groupOrder:g,renderOrder:u.renderOrder,z:v,group:m},i[t]=p):(p.id=u.id,p.object=u,p.geometry=f,p.material=d,p.groupOrder=g,p.renderOrder=u.renderOrder,p.z=v,p.group=m),t++,p}function a(u,f,d,g,v,m){const p=o(u,f,d,g,v,m);d.transmission>0?n.push(p):d.transparent===!0?s.push(p):e.push(p)}function c(u,f,d,g,v,m){const p=o(u,f,d,g,v,m);d.transmission>0?n.unshift(p):d.transparent===!0?s.unshift(p):e.unshift(p)}function l(u,f){e.length>1&&e.sort(u||pm),n.length>1&&n.sort(f||nc),s.length>1&&s.sort(f||nc)}function h(){for(let u=t,f=i.length;u<f;u++){const d=i[u];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:a,unshift:c,finish:h,sort:l}}function mm(){let i=new WeakMap;function t(n,s){const r=i.get(n);let o;return r===void 0?(o=new ic,i.set(n,[o])):s>=r.length?(o=new ic,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function gm(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new U,color:new pt};break;case"SpotLight":e={position:new U,direction:new U,color:new pt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new U,color:new pt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new U,skyColor:new pt,groundColor:new pt};break;case"RectAreaLight":e={color:new pt,position:new U,halfWidth:new U,halfHeight:new U};break}return i[t.id]=e,e}}}function _m(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ct};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ct};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ct,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let vm=0;function xm(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function Mm(i){const t=new gm,e=_m(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new U);const s=new U,r=new ae,o=new ae;function a(l){let h=0,u=0,f=0;for(let M=0;M<9;M++)n.probe[M].set(0,0,0);let d=0,g=0,v=0,m=0,p=0,y=0,E=0,_=0,D=0,S=0,A=0;l.sort(xm);for(let M=0,x=l.length;M<x;M++){const C=l[M],k=C.color,V=C.intensity,X=C.distance,J=C.shadow&&C.shadow.map?C.shadow.map.texture:null;if(C.isAmbientLight)h+=k.r*V,u+=k.g*V,f+=k.b*V;else if(C.isLightProbe){for(let Y=0;Y<9;Y++)n.probe[Y].addScaledVector(C.sh.coefficients[Y],V);A++}else if(C.isDirectionalLight){const Y=t.get(C);if(Y.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){const tt=C.shadow,K=e.get(C);K.shadowIntensity=tt.intensity,K.shadowBias=tt.bias,K.shadowNormalBias=tt.normalBias,K.shadowRadius=tt.radius,K.shadowMapSize=tt.mapSize,n.directionalShadow[d]=K,n.directionalShadowMap[d]=J,n.directionalShadowMatrix[d]=C.shadow.matrix,y++}n.directional[d]=Y,d++}else if(C.isSpotLight){const Y=t.get(C);Y.position.setFromMatrixPosition(C.matrixWorld),Y.color.copy(k).multiplyScalar(V),Y.distance=X,Y.coneCos=Math.cos(C.angle),Y.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),Y.decay=C.decay,n.spot[v]=Y;const tt=C.shadow;if(C.map&&(n.spotLightMap[D]=C.map,D++,tt.updateMatrices(C),C.castShadow&&S++),n.spotLightMatrix[v]=tt.matrix,C.castShadow){const K=e.get(C);K.shadowIntensity=tt.intensity,K.shadowBias=tt.bias,K.shadowNormalBias=tt.normalBias,K.shadowRadius=tt.radius,K.shadowMapSize=tt.mapSize,n.spotShadow[v]=K,n.spotShadowMap[v]=J,_++}v++}else if(C.isRectAreaLight){const Y=t.get(C);Y.color.copy(k).multiplyScalar(V),Y.halfWidth.set(C.width*.5,0,0),Y.halfHeight.set(0,C.height*.5,0),n.rectArea[m]=Y,m++}else if(C.isPointLight){const Y=t.get(C);if(Y.color.copy(C.color).multiplyScalar(C.intensity),Y.distance=C.distance,Y.decay=C.decay,C.castShadow){const tt=C.shadow,K=e.get(C);K.shadowIntensity=tt.intensity,K.shadowBias=tt.bias,K.shadowNormalBias=tt.normalBias,K.shadowRadius=tt.radius,K.shadowMapSize=tt.mapSize,K.shadowCameraNear=tt.camera.near,K.shadowCameraFar=tt.camera.far,n.pointShadow[g]=K,n.pointShadowMap[g]=J,n.pointShadowMatrix[g]=C.shadow.matrix,E++}n.point[g]=Y,g++}else if(C.isHemisphereLight){const Y=t.get(C);Y.skyColor.copy(C.color).multiplyScalar(V),Y.groundColor.copy(C.groundColor).multiplyScalar(V),n.hemi[p]=Y,p++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=St.LTC_FLOAT_1,n.rectAreaLTC2=St.LTC_FLOAT_2):(n.rectAreaLTC1=St.LTC_HALF_1,n.rectAreaLTC2=St.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=f;const P=n.hash;(P.directionalLength!==d||P.pointLength!==g||P.spotLength!==v||P.rectAreaLength!==m||P.hemiLength!==p||P.numDirectionalShadows!==y||P.numPointShadows!==E||P.numSpotShadows!==_||P.numSpotMaps!==D||P.numLightProbes!==A)&&(n.directional.length=d,n.spot.length=v,n.rectArea.length=m,n.point.length=g,n.hemi.length=p,n.directionalShadow.length=y,n.directionalShadowMap.length=y,n.pointShadow.length=E,n.pointShadowMap.length=E,n.spotShadow.length=_,n.spotShadowMap.length=_,n.directionalShadowMatrix.length=y,n.pointShadowMatrix.length=E,n.spotLightMatrix.length=_+D-S,n.spotLightMap.length=D,n.numSpotLightShadowsWithMaps=S,n.numLightProbes=A,P.directionalLength=d,P.pointLength=g,P.spotLength=v,P.rectAreaLength=m,P.hemiLength=p,P.numDirectionalShadows=y,P.numPointShadows=E,P.numSpotShadows=_,P.numSpotMaps=D,P.numLightProbes=A,n.version=vm++)}function c(l,h){let u=0,f=0,d=0,g=0,v=0;const m=h.matrixWorldInverse;for(let p=0,y=l.length;p<y;p++){const E=l[p];if(E.isDirectionalLight){const _=n.directional[u];_.direction.setFromMatrixPosition(E.matrixWorld),s.setFromMatrixPosition(E.target.matrixWorld),_.direction.sub(s),_.direction.transformDirection(m),u++}else if(E.isSpotLight){const _=n.spot[d];_.position.setFromMatrixPosition(E.matrixWorld),_.position.applyMatrix4(m),_.direction.setFromMatrixPosition(E.matrixWorld),s.setFromMatrixPosition(E.target.matrixWorld),_.direction.sub(s),_.direction.transformDirection(m),d++}else if(E.isRectAreaLight){const _=n.rectArea[g];_.position.setFromMatrixPosition(E.matrixWorld),_.position.applyMatrix4(m),o.identity(),r.copy(E.matrixWorld),r.premultiply(m),o.extractRotation(r),_.halfWidth.set(E.width*.5,0,0),_.halfHeight.set(0,E.height*.5,0),_.halfWidth.applyMatrix4(o),_.halfHeight.applyMatrix4(o),g++}else if(E.isPointLight){const _=n.point[f];_.position.setFromMatrixPosition(E.matrixWorld),_.position.applyMatrix4(m),f++}else if(E.isHemisphereLight){const _=n.hemi[v];_.direction.setFromMatrixPosition(E.matrixWorld),_.direction.transformDirection(m),v++}}}return{setup:a,setupView:c,state:n}}function sc(i){const t=new Mm(i),e=[],n=[];function s(h){l.camera=h,e.length=0,n.length=0}function r(h){e.push(h)}function o(h){n.push(h)}function a(){t.setup(e)}function c(h){t.setupView(e,h)}const l={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:l,setupLights:a,setupLightsView:c,pushLight:r,pushShadow:o}}function Sm(i){let t=new WeakMap;function e(s,r=0){const o=t.get(s);let a;return o===void 0?(a=new sc(i),t.set(s,[a])):r>=o.length?(a=new sc(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}class ym extends Ii{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=_h,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class Em extends Ii{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const bm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Tm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function wm(i,t,e){let n=new Wo;const s=new ct,r=new ct,o=new oe,a=new ym({depthPacking:vh}),c=new Em,l={},h=e.maxTextureSize,u={[Ln]:Le,[Le]:Ln,[Ce]:Ce},f=new we({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ct},radius:{value:4}},vertexShader:bm,fragmentShader:Tm}),d=f.clone();d.defines.HORIZONTAL_PASS=1;const g=new xe;g.setAttribute("position",new Pe(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new kt(g,f),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Fo;let p=this.type;this.render=function(S,A,P){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||S.length===0)return;const M=i.getRenderTarget(),x=i.getActiveCubeFace(),C=i.getActiveMipmapLevel(),k=i.state;k.setBlending(Pn),k.buffers.color.setClear(1,1,1,1),k.buffers.depth.setTest(!0),k.setScissorTest(!1);const V=p!==gn&&this.type===gn,X=p===gn&&this.type!==gn;for(let J=0,Y=S.length;J<Y;J++){const tt=S[J],K=tt.shadow;if(K===void 0){console.warn("THREE.WebGLShadowMap:",tt,"has no shadow.");continue}if(K.autoUpdate===!1&&K.needsUpdate===!1)continue;s.copy(K.mapSize);const ft=K.getFrameExtents();if(s.multiply(ft),r.copy(K.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/ft.x),s.x=r.x*ft.x,K.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/ft.y),s.y=r.y*ft.y,K.mapSize.y=r.y)),K.map===null||V===!0||X===!0){const _t=this.type!==gn?{minFilter:ke,magFilter:ke}:{};K.map!==null&&K.map.dispose(),K.map=new Dn(s.x,s.y,_t),K.map.texture.name=tt.name+".shadowMap",K.camera.updateProjectionMatrix()}i.setRenderTarget(K.map),i.clear();const ut=K.getViewportCount();for(let _t=0;_t<ut;_t++){const Dt=K.getViewport(_t);o.set(r.x*Dt.x,r.y*Dt.y,r.x*Dt.z,r.y*Dt.w),k.viewport(o),K.updateMatrices(tt,_t),n=K.getFrustum(),_(A,P,K.camera,tt,this.type)}K.isPointLightShadow!==!0&&this.type===gn&&y(K,P),K.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(M,x,C)};function y(S,A){const P=t.update(v);f.defines.VSM_SAMPLES!==S.blurSamples&&(f.defines.VSM_SAMPLES=S.blurSamples,d.defines.VSM_SAMPLES=S.blurSamples,f.needsUpdate=!0,d.needsUpdate=!0),S.mapPass===null&&(S.mapPass=new Dn(s.x,s.y)),f.uniforms.shadow_pass.value=S.map.texture,f.uniforms.resolution.value=S.mapSize,f.uniforms.radius.value=S.radius,i.setRenderTarget(S.mapPass),i.clear(),i.renderBufferDirect(A,null,P,f,v,null),d.uniforms.shadow_pass.value=S.mapPass.texture,d.uniforms.resolution.value=S.mapSize,d.uniforms.radius.value=S.radius,i.setRenderTarget(S.map),i.clear(),i.renderBufferDirect(A,null,P,d,v,null)}function E(S,A,P,M){let x=null;const C=P.isPointLight===!0?S.customDistanceMaterial:S.customDepthMaterial;if(C!==void 0)x=C;else if(x=P.isPointLight===!0?c:a,i.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){const k=x.uuid,V=A.uuid;let X=l[k];X===void 0&&(X={},l[k]=X);let J=X[V];J===void 0&&(J=x.clone(),X[V]=J,A.addEventListener("dispose",D)),x=J}if(x.visible=A.visible,x.wireframe=A.wireframe,M===gn?x.side=A.shadowSide!==null?A.shadowSide:A.side:x.side=A.shadowSide!==null?A.shadowSide:u[A.side],x.alphaMap=A.alphaMap,x.alphaTest=A.alphaTest,x.map=A.map,x.clipShadows=A.clipShadows,x.clippingPlanes=A.clippingPlanes,x.clipIntersection=A.clipIntersection,x.displacementMap=A.displacementMap,x.displacementScale=A.displacementScale,x.displacementBias=A.displacementBias,x.wireframeLinewidth=A.wireframeLinewidth,x.linewidth=A.linewidth,P.isPointLight===!0&&x.isMeshDistanceMaterial===!0){const k=i.properties.get(x);k.light=P}return x}function _(S,A,P,M,x){if(S.visible===!1)return;if(S.layers.test(A.layers)&&(S.isMesh||S.isLine||S.isPoints)&&(S.castShadow||S.receiveShadow&&x===gn)&&(!S.frustumCulled||n.intersectsObject(S))){S.modelViewMatrix.multiplyMatrices(P.matrixWorldInverse,S.matrixWorld);const V=t.update(S),X=S.material;if(Array.isArray(X)){const J=V.groups;for(let Y=0,tt=J.length;Y<tt;Y++){const K=J[Y],ft=X[K.materialIndex];if(ft&&ft.visible){const ut=E(S,ft,M,x);S.onBeforeShadow(i,S,A,P,V,ut,K),i.renderBufferDirect(P,null,V,ut,S,K),S.onAfterShadow(i,S,A,P,V,ut,K)}}}else if(X.visible){const J=E(S,X,M,x);S.onBeforeShadow(i,S,A,P,V,J,null),i.renderBufferDirect(P,null,V,J,S,null),S.onAfterShadow(i,S,A,P,V,J,null)}}const k=S.children;for(let V=0,X=k.length;V<X;V++)_(k[V],A,P,M,x)}function D(S){S.target.removeEventListener("dispose",D);for(const P in l){const M=l[P],x=S.target.uuid;x in M&&(M[x].dispose(),delete M[x])}}}const Am={[Hr]:Wr,[Xr]:Zr,[Yr]:Kr,[Mi]:qr,[Wr]:Hr,[Zr]:Xr,[Kr]:Yr,[qr]:Mi};function Cm(i,t){function e(){let z=!1;const vt=new oe;let st=null;const at=new oe(0,0,0,0);return{setMask:function(bt){st!==bt&&!z&&(i.colorMask(bt,bt,bt,bt),st=bt)},setLocked:function(bt){z=bt},setClear:function(bt,yt,Ht,fe,Me){Me===!0&&(bt*=fe,yt*=fe,Ht*=fe),vt.set(bt,yt,Ht,fe),at.equals(vt)===!1&&(i.clearColor(bt,yt,Ht,fe),at.copy(vt))},reset:function(){z=!1,st=null,at.set(-1,0,0,0)}}}function n(){let z=!1,vt=!1,st=null,at=null,bt=null;return{setReversed:function(yt){if(vt!==yt){const Ht=t.get("EXT_clip_control");vt?Ht.clipControlEXT(Ht.LOWER_LEFT_EXT,Ht.ZERO_TO_ONE_EXT):Ht.clipControlEXT(Ht.LOWER_LEFT_EXT,Ht.NEGATIVE_ONE_TO_ONE_EXT);const fe=bt;bt=null,this.setClear(fe)}vt=yt},getReversed:function(){return vt},setTest:function(yt){yt?W(i.DEPTH_TEST):et(i.DEPTH_TEST)},setMask:function(yt){st!==yt&&!z&&(i.depthMask(yt),st=yt)},setFunc:function(yt){if(vt&&(yt=Am[yt]),at!==yt){switch(yt){case Hr:i.depthFunc(i.NEVER);break;case Wr:i.depthFunc(i.ALWAYS);break;case Xr:i.depthFunc(i.LESS);break;case Mi:i.depthFunc(i.LEQUAL);break;case Yr:i.depthFunc(i.EQUAL);break;case qr:i.depthFunc(i.GEQUAL);break;case Zr:i.depthFunc(i.GREATER);break;case Kr:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}at=yt}},setLocked:function(yt){z=yt},setClear:function(yt){bt!==yt&&(vt&&(yt=1-yt),i.clearDepth(yt),bt=yt)},reset:function(){z=!1,st=null,at=null,bt=null,vt=!1}}}function s(){let z=!1,vt=null,st=null,at=null,bt=null,yt=null,Ht=null,fe=null,Me=null;return{setTest:function(ie){z||(ie?W(i.STENCIL_TEST):et(i.STENCIL_TEST))},setMask:function(ie){vt!==ie&&!z&&(i.stencilMask(ie),vt=ie)},setFunc:function(ie,We,ln){(st!==ie||at!==We||bt!==ln)&&(i.stencilFunc(ie,We,ln),st=ie,at=We,bt=ln)},setOp:function(ie,We,ln){(yt!==ie||Ht!==We||fe!==ln)&&(i.stencilOp(ie,We,ln),yt=ie,Ht=We,fe=ln)},setLocked:function(ie){z=ie},setClear:function(ie){Me!==ie&&(i.clearStencil(ie),Me=ie)},reset:function(){z=!1,vt=null,st=null,at=null,bt=null,yt=null,Ht=null,fe=null,Me=null}}}const r=new e,o=new n,a=new s,c=new WeakMap,l=new WeakMap;let h={},u={},f=new WeakMap,d=[],g=null,v=!1,m=null,p=null,y=null,E=null,_=null,D=null,S=null,A=new pt(0,0,0),P=0,M=!1,x=null,C=null,k=null,V=null,X=null;const J=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let Y=!1,tt=0;const K=i.getParameter(i.VERSION);K.indexOf("WebGL")!==-1?(tt=parseFloat(/^WebGL (\d)/.exec(K)[1]),Y=tt>=1):K.indexOf("OpenGL ES")!==-1&&(tt=parseFloat(/^OpenGL ES (\d)/.exec(K)[1]),Y=tt>=2);let ft=null,ut={};const _t=i.getParameter(i.SCISSOR_BOX),Dt=i.getParameter(i.VIEWPORT),q=new oe().fromArray(_t),B=new oe().fromArray(Dt);function I(z,vt,st,at){const bt=new Uint8Array(4),yt=i.createTexture();i.bindTexture(z,yt),i.texParameteri(z,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(z,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ht=0;Ht<st;Ht++)z===i.TEXTURE_3D||z===i.TEXTURE_2D_ARRAY?i.texImage3D(vt,0,i.RGBA,1,1,at,0,i.RGBA,i.UNSIGNED_BYTE,bt):i.texImage2D(vt+Ht,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,bt);return yt}const Z={};Z[i.TEXTURE_2D]=I(i.TEXTURE_2D,i.TEXTURE_2D,1),Z[i.TEXTURE_CUBE_MAP]=I(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Z[i.TEXTURE_2D_ARRAY]=I(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Z[i.TEXTURE_3D]=I(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),W(i.DEPTH_TEST),o.setFunc(Mi),lt(!1),Tt(ha),W(i.CULL_FACE),L(Pn);function W(z){h[z]!==!0&&(i.enable(z),h[z]=!0)}function et(z){h[z]!==!1&&(i.disable(z),h[z]=!1)}function xt(z,vt){return u[z]!==vt?(i.bindFramebuffer(z,vt),u[z]=vt,z===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=vt),z===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=vt),!0):!1}function Rt(z,vt){let st=d,at=!1;if(z){st=f.get(vt),st===void 0&&(st=[],f.set(vt,st));const bt=z.textures;if(st.length!==bt.length||st[0]!==i.COLOR_ATTACHMENT0){for(let yt=0,Ht=bt.length;yt<Ht;yt++)st[yt]=i.COLOR_ATTACHMENT0+yt;st.length=bt.length,at=!0}}else st[0]!==i.BACK&&(st[0]=i.BACK,at=!0);at&&i.drawBuffers(st)}function Gt(z){return g!==z?(i.useProgram(z),g=z,!0):!1}const rt={[Hn]:i.FUNC_ADD,[Wl]:i.FUNC_SUBTRACT,[Xl]:i.FUNC_REVERSE_SUBTRACT};rt[Yl]=i.MIN,rt[ql]=i.MAX;const ht={[Zl]:i.ZERO,[Kl]:i.ONE,[Jl]:i.SRC_COLOR,[Vr]:i.SRC_ALPHA,[nh]:i.SRC_ALPHA_SATURATE,[th]:i.DST_COLOR,[jl]:i.DST_ALPHA,[$l]:i.ONE_MINUS_SRC_COLOR,[Gr]:i.ONE_MINUS_SRC_ALPHA,[eh]:i.ONE_MINUS_DST_COLOR,[Ql]:i.ONE_MINUS_DST_ALPHA,[ih]:i.CONSTANT_COLOR,[sh]:i.ONE_MINUS_CONSTANT_COLOR,[rh]:i.CONSTANT_ALPHA,[oh]:i.ONE_MINUS_CONSTANT_ALPHA};function L(z,vt,st,at,bt,yt,Ht,fe,Me,ie){if(z===Pn){v===!0&&(et(i.BLEND),v=!1);return}if(v===!1&&(W(i.BLEND),v=!0),z!==Hl){if(z!==m||ie!==M){if((p!==Hn||_!==Hn)&&(i.blendEquation(i.FUNC_ADD),p=Hn,_=Hn),ie)switch(z){case vn:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Xs:i.blendFunc(i.ONE,i.ONE);break;case ua:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case fa:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",z);break}else switch(z){case vn:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Xs:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case ua:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case fa:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",z);break}y=null,E=null,D=null,S=null,A.set(0,0,0),P=0,m=z,M=ie}return}bt=bt||vt,yt=yt||st,Ht=Ht||at,(vt!==p||bt!==_)&&(i.blendEquationSeparate(rt[vt],rt[bt]),p=vt,_=bt),(st!==y||at!==E||yt!==D||Ht!==S)&&(i.blendFuncSeparate(ht[st],ht[at],ht[yt],ht[Ht]),y=st,E=at,D=yt,S=Ht),(fe.equals(A)===!1||Me!==P)&&(i.blendColor(fe.r,fe.g,fe.b,Me),A.copy(fe),P=Me),m=z,M=!1}function Pt(z,vt){z.side===Ce?et(i.CULL_FACE):W(i.CULL_FACE);let st=z.side===Le;vt&&(st=!st),lt(st),z.blending===vn&&z.transparent===!1?L(Pn):L(z.blending,z.blendEquation,z.blendSrc,z.blendDst,z.blendEquationAlpha,z.blendSrcAlpha,z.blendDstAlpha,z.blendColor,z.blendAlpha,z.premultipliedAlpha),o.setFunc(z.depthFunc),o.setTest(z.depthTest),o.setMask(z.depthWrite),r.setMask(z.colorWrite);const at=z.stencilWrite;a.setTest(at),at&&(a.setMask(z.stencilWriteMask),a.setFunc(z.stencilFunc,z.stencilRef,z.stencilFuncMask),a.setOp(z.stencilFail,z.stencilZFail,z.stencilZPass)),Ot(z.polygonOffset,z.polygonOffsetFactor,z.polygonOffsetUnits),z.alphaToCoverage===!0?W(i.SAMPLE_ALPHA_TO_COVERAGE):et(i.SAMPLE_ALPHA_TO_COVERAGE)}function lt(z){x!==z&&(z?i.frontFace(i.CW):i.frontFace(i.CCW),x=z)}function Tt(z){z!==Vl?(W(i.CULL_FACE),z!==C&&(z===ha?i.cullFace(i.BACK):z===Gl?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):et(i.CULL_FACE),C=z}function gt(z){z!==k&&(Y&&i.lineWidth(z),k=z)}function Ot(z,vt,st){z?(W(i.POLYGON_OFFSET_FILL),(V!==vt||X!==st)&&(i.polygonOffset(vt,st),V=vt,X=st)):et(i.POLYGON_OFFSET_FILL)}function wt(z){z?W(i.SCISSOR_TEST):et(i.SCISSOR_TEST)}function R(z){z===void 0&&(z=i.TEXTURE0+J-1),ft!==z&&(i.activeTexture(z),ft=z)}function b(z,vt,st){st===void 0&&(ft===null?st=i.TEXTURE0+J-1:st=ft);let at=ut[st];at===void 0&&(at={type:void 0,texture:void 0},ut[st]=at),(at.type!==z||at.texture!==vt)&&(ft!==st&&(i.activeTexture(st),ft=st),i.bindTexture(z,vt||Z[z]),at.type=z,at.texture=vt)}function w(){const z=ut[ft];z!==void 0&&z.type!==void 0&&(i.bindTexture(z.type,null),z.type=void 0,z.texture=void 0)}function N(){try{i.compressedTexImage2D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function F(){try{i.compressedTexImage3D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function O(){try{i.texSubImage2D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function $(){try{i.texSubImage3D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function it(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function ot(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Lt(){try{i.texStorage2D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function nt(){try{i.texStorage3D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function dt(){try{i.texImage2D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Ct(){try{i.texImage3D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function At(z){q.equals(z)===!1&&(i.scissor(z.x,z.y,z.z,z.w),q.copy(z))}function Mt(z){B.equals(z)===!1&&(i.viewport(z.x,z.y,z.z,z.w),B.copy(z))}function Bt(z,vt){let st=l.get(vt);st===void 0&&(st=new WeakMap,l.set(vt,st));let at=st.get(z);at===void 0&&(at=i.getUniformBlockIndex(vt,z.name),st.set(z,at))}function zt(z,vt){const at=l.get(vt).get(z);c.get(vt)!==at&&(i.uniformBlockBinding(vt,at,z.__bindingPointIndex),c.set(vt,at))}function Jt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),h={},ft=null,ut={},u={},f=new WeakMap,d=[],g=null,v=!1,m=null,p=null,y=null,E=null,_=null,D=null,S=null,A=new pt(0,0,0),P=0,M=!1,x=null,C=null,k=null,V=null,X=null,q.set(0,0,i.canvas.width,i.canvas.height),B.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:W,disable:et,bindFramebuffer:xt,drawBuffers:Rt,useProgram:Gt,setBlending:L,setMaterial:Pt,setFlipSided:lt,setCullFace:Tt,setLineWidth:gt,setPolygonOffset:Ot,setScissorTest:wt,activeTexture:R,bindTexture:b,unbindTexture:w,compressedTexImage2D:N,compressedTexImage3D:F,texImage2D:dt,texImage3D:Ct,updateUBOMapping:Bt,uniformBlockBinding:zt,texStorage2D:Lt,texStorage3D:nt,texSubImage2D:O,texSubImage3D:$,compressedTexSubImage2D:it,compressedTexSubImage3D:ot,scissor:At,viewport:Mt,reset:Jt}}function rc(i,t,e,n){const s=Rm(n);switch(e){case Bc:return i*t;case kc:return i*t;case Vc:return i*t*2;case ko:return i*t/s.components*s.byteLength;case Vo:return i*t/s.components*s.byteLength;case Gc:return i*t*2/s.components*s.byteLength;case Go:return i*t*2/s.components*s.byteLength;case zc:return i*t*3/s.components*s.byteLength;case ze:return i*t*4/s.components*s.byteLength;case Ho:return i*t*4/s.components*s.byteLength;case Bs:case zs:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case ks:case Vs:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case to:case no:return Math.max(i,16)*Math.max(t,8)/4;case Qr:case eo:return Math.max(i,8)*Math.max(t,8)/2;case io:case so:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case ro:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case oo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ao:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case co:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case lo:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case ho:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case uo:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case fo:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case po:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case mo:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case go:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case _o:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case vo:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case xo:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Mo:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case Gs:case So:case yo:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Hc:case Eo:return Math.ceil(i/4)*Math.ceil(t/4)*8;case bo:case To:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Rm(i){switch(i){case on:case Nc:return{byteLength:1,components:1};case Qi:case Fc:case Ci:return{byteLength:2,components:1};case Bo:case zo:return{byteLength:2,components:4};case qn:case Oo:case rn:return{byteLength:4,components:1};case Oc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function Pm(i,t,e,n,s,r,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new ct,h=new WeakMap;let u;const f=new WeakMap;let d=!1;try{d=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(R,b){return d?new OffscreenCanvas(R,b):qs("canvas")}function v(R,b,w){let N=1;const F=wt(R);if((F.width>w||F.height>w)&&(N=w/Math.max(F.width,F.height)),N<1)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){const O=Math.floor(N*F.width),$=Math.floor(N*F.height);u===void 0&&(u=g(O,$));const it=b?g(O,$):u;return it.width=O,it.height=$,it.getContext("2d").drawImage(R,0,0,O,$),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+F.width+"x"+F.height+") to ("+O+"x"+$+")."),it}else return"data"in R&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+F.width+"x"+F.height+")."),R;return R}function m(R){return R.generateMipmaps}function p(R){i.generateMipmap(R)}function y(R){return R.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:R.isWebGL3DRenderTarget?i.TEXTURE_3D:R.isWebGLArrayRenderTarget||R.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function E(R,b,w,N,F=!1){if(R!==null){if(i[R]!==void 0)return i[R];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let O=b;if(b===i.RED&&(w===i.FLOAT&&(O=i.R32F),w===i.HALF_FLOAT&&(O=i.R16F),w===i.UNSIGNED_BYTE&&(O=i.R8)),b===i.RED_INTEGER&&(w===i.UNSIGNED_BYTE&&(O=i.R8UI),w===i.UNSIGNED_SHORT&&(O=i.R16UI),w===i.UNSIGNED_INT&&(O=i.R32UI),w===i.BYTE&&(O=i.R8I),w===i.SHORT&&(O=i.R16I),w===i.INT&&(O=i.R32I)),b===i.RG&&(w===i.FLOAT&&(O=i.RG32F),w===i.HALF_FLOAT&&(O=i.RG16F),w===i.UNSIGNED_BYTE&&(O=i.RG8)),b===i.RG_INTEGER&&(w===i.UNSIGNED_BYTE&&(O=i.RG8UI),w===i.UNSIGNED_SHORT&&(O=i.RG16UI),w===i.UNSIGNED_INT&&(O=i.RG32UI),w===i.BYTE&&(O=i.RG8I),w===i.SHORT&&(O=i.RG16I),w===i.INT&&(O=i.RG32I)),b===i.RGB_INTEGER&&(w===i.UNSIGNED_BYTE&&(O=i.RGB8UI),w===i.UNSIGNED_SHORT&&(O=i.RGB16UI),w===i.UNSIGNED_INT&&(O=i.RGB32UI),w===i.BYTE&&(O=i.RGB8I),w===i.SHORT&&(O=i.RGB16I),w===i.INT&&(O=i.RGB32I)),b===i.RGBA_INTEGER&&(w===i.UNSIGNED_BYTE&&(O=i.RGBA8UI),w===i.UNSIGNED_SHORT&&(O=i.RGBA16UI),w===i.UNSIGNED_INT&&(O=i.RGBA32UI),w===i.BYTE&&(O=i.RGBA8I),w===i.SHORT&&(O=i.RGBA16I),w===i.INT&&(O=i.RGBA32I)),b===i.RGB&&w===i.UNSIGNED_INT_5_9_9_9_REV&&(O=i.RGB9_E5),b===i.RGBA){const $=F?Js:jt.getTransfer(N);w===i.FLOAT&&(O=i.RGBA32F),w===i.HALF_FLOAT&&(O=i.RGBA16F),w===i.UNSIGNED_BYTE&&(O=$===se?i.SRGB8_ALPHA8:i.RGBA8),w===i.UNSIGNED_SHORT_4_4_4_4&&(O=i.RGBA4),w===i.UNSIGNED_SHORT_5_5_5_1&&(O=i.RGB5_A1)}return(O===i.R16F||O===i.R32F||O===i.RG16F||O===i.RG32F||O===i.RGBA16F||O===i.RGBA32F)&&t.get("EXT_color_buffer_float"),O}function _(R,b){let w;return R?b===null||b===qn||b===bi?w=i.DEPTH24_STENCIL8:b===rn?w=i.DEPTH32F_STENCIL8:b===Qi&&(w=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):b===null||b===qn||b===bi?w=i.DEPTH_COMPONENT24:b===rn?w=i.DEPTH_COMPONENT32F:b===Qi&&(w=i.DEPTH_COMPONENT16),w}function D(R,b){return m(R)===!0||R.isFramebufferTexture&&R.minFilter!==ke&&R.minFilter!==Re?Math.log2(Math.max(b.width,b.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?b.mipmaps.length:1}function S(R){const b=R.target;b.removeEventListener("dispose",S),P(b),b.isVideoTexture&&h.delete(b)}function A(R){const b=R.target;b.removeEventListener("dispose",A),x(b)}function P(R){const b=n.get(R);if(b.__webglInit===void 0)return;const w=R.source,N=f.get(w);if(N){const F=N[b.__cacheKey];F.usedTimes--,F.usedTimes===0&&M(R),Object.keys(N).length===0&&f.delete(w)}n.remove(R)}function M(R){const b=n.get(R);i.deleteTexture(b.__webglTexture);const w=R.source,N=f.get(w);delete N[b.__cacheKey],o.memory.textures--}function x(R){const b=n.get(R);if(R.depthTexture&&(R.depthTexture.dispose(),n.remove(R.depthTexture)),R.isWebGLCubeRenderTarget)for(let N=0;N<6;N++){if(Array.isArray(b.__webglFramebuffer[N]))for(let F=0;F<b.__webglFramebuffer[N].length;F++)i.deleteFramebuffer(b.__webglFramebuffer[N][F]);else i.deleteFramebuffer(b.__webglFramebuffer[N]);b.__webglDepthbuffer&&i.deleteRenderbuffer(b.__webglDepthbuffer[N])}else{if(Array.isArray(b.__webglFramebuffer))for(let N=0;N<b.__webglFramebuffer.length;N++)i.deleteFramebuffer(b.__webglFramebuffer[N]);else i.deleteFramebuffer(b.__webglFramebuffer);if(b.__webglDepthbuffer&&i.deleteRenderbuffer(b.__webglDepthbuffer),b.__webglMultisampledFramebuffer&&i.deleteFramebuffer(b.__webglMultisampledFramebuffer),b.__webglColorRenderbuffer)for(let N=0;N<b.__webglColorRenderbuffer.length;N++)b.__webglColorRenderbuffer[N]&&i.deleteRenderbuffer(b.__webglColorRenderbuffer[N]);b.__webglDepthRenderbuffer&&i.deleteRenderbuffer(b.__webglDepthRenderbuffer)}const w=R.textures;for(let N=0,F=w.length;N<F;N++){const O=n.get(w[N]);O.__webglTexture&&(i.deleteTexture(O.__webglTexture),o.memory.textures--),n.remove(w[N])}n.remove(R)}let C=0;function k(){C=0}function V(){const R=C;return R>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+R+" texture units while this GPU supports only "+s.maxTextures),C+=1,R}function X(R){const b=[];return b.push(R.wrapS),b.push(R.wrapT),b.push(R.wrapR||0),b.push(R.magFilter),b.push(R.minFilter),b.push(R.anisotropy),b.push(R.internalFormat),b.push(R.format),b.push(R.type),b.push(R.generateMipmaps),b.push(R.premultiplyAlpha),b.push(R.flipY),b.push(R.unpackAlignment),b.push(R.colorSpace),b.join()}function J(R,b){const w=n.get(R);if(R.isVideoTexture&&gt(R),R.isRenderTargetTexture===!1&&R.version>0&&w.__version!==R.version){const N=R.image;if(N===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(N.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{B(w,R,b);return}}e.bindTexture(i.TEXTURE_2D,w.__webglTexture,i.TEXTURE0+b)}function Y(R,b){const w=n.get(R);if(R.version>0&&w.__version!==R.version){B(w,R,b);return}e.bindTexture(i.TEXTURE_2D_ARRAY,w.__webglTexture,i.TEXTURE0+b)}function tt(R,b){const w=n.get(R);if(R.version>0&&w.__version!==R.version){B(w,R,b);return}e.bindTexture(i.TEXTURE_3D,w.__webglTexture,i.TEXTURE0+b)}function K(R,b){const w=n.get(R);if(R.version>0&&w.__version!==R.version){I(w,R,b);return}e.bindTexture(i.TEXTURE_CUBE_MAP,w.__webglTexture,i.TEXTURE0+b)}const ft={[Ei]:i.REPEAT,[nn]:i.CLAMP_TO_EDGE,[jr]:i.MIRRORED_REPEAT},ut={[ke]:i.NEAREST,[gh]:i.NEAREST_MIPMAP_NEAREST,[hs]:i.NEAREST_MIPMAP_LINEAR,[Re]:i.LINEAR,[sr]:i.LINEAR_MIPMAP_NEAREST,[sn]:i.LINEAR_MIPMAP_LINEAR},_t={[Mh]:i.NEVER,[wh]:i.ALWAYS,[Sh]:i.LESS,[Xc]:i.LEQUAL,[yh]:i.EQUAL,[Th]:i.GEQUAL,[Eh]:i.GREATER,[bh]:i.NOTEQUAL};function Dt(R,b){if(b.type===rn&&t.has("OES_texture_float_linear")===!1&&(b.magFilter===Re||b.magFilter===sr||b.magFilter===hs||b.magFilter===sn||b.minFilter===Re||b.minFilter===sr||b.minFilter===hs||b.minFilter===sn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(R,i.TEXTURE_WRAP_S,ft[b.wrapS]),i.texParameteri(R,i.TEXTURE_WRAP_T,ft[b.wrapT]),(R===i.TEXTURE_3D||R===i.TEXTURE_2D_ARRAY)&&i.texParameteri(R,i.TEXTURE_WRAP_R,ft[b.wrapR]),i.texParameteri(R,i.TEXTURE_MAG_FILTER,ut[b.magFilter]),i.texParameteri(R,i.TEXTURE_MIN_FILTER,ut[b.minFilter]),b.compareFunction&&(i.texParameteri(R,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(R,i.TEXTURE_COMPARE_FUNC,_t[b.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(b.magFilter===ke||b.minFilter!==hs&&b.minFilter!==sn||b.type===rn&&t.has("OES_texture_float_linear")===!1)return;if(b.anisotropy>1||n.get(b).__currentAnisotropy){const w=t.get("EXT_texture_filter_anisotropic");i.texParameterf(R,w.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(b.anisotropy,s.getMaxAnisotropy())),n.get(b).__currentAnisotropy=b.anisotropy}}}function q(R,b){let w=!1;R.__webglInit===void 0&&(R.__webglInit=!0,b.addEventListener("dispose",S));const N=b.source;let F=f.get(N);F===void 0&&(F={},f.set(N,F));const O=X(b);if(O!==R.__cacheKey){F[O]===void 0&&(F[O]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,w=!0),F[O].usedTimes++;const $=F[R.__cacheKey];$!==void 0&&(F[R.__cacheKey].usedTimes--,$.usedTimes===0&&M(b)),R.__cacheKey=O,R.__webglTexture=F[O].texture}return w}function B(R,b,w){let N=i.TEXTURE_2D;(b.isDataArrayTexture||b.isCompressedArrayTexture)&&(N=i.TEXTURE_2D_ARRAY),b.isData3DTexture&&(N=i.TEXTURE_3D);const F=q(R,b),O=b.source;e.bindTexture(N,R.__webglTexture,i.TEXTURE0+w);const $=n.get(O);if(O.version!==$.__version||F===!0){e.activeTexture(i.TEXTURE0+w);const it=jt.getPrimaries(jt.workingColorSpace),ot=b.colorSpace===$e?null:jt.getPrimaries(b.colorSpace),Lt=b.colorSpace===$e||it===ot?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,b.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,b.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Lt);let nt=v(b.image,!1,s.maxTextureSize);nt=Ot(b,nt);const dt=r.convert(b.format,b.colorSpace),Ct=r.convert(b.type);let At=E(b.internalFormat,dt,Ct,b.colorSpace,b.isVideoTexture);Dt(N,b);let Mt;const Bt=b.mipmaps,zt=b.isVideoTexture!==!0,Jt=$.__version===void 0||F===!0,z=O.dataReady,vt=D(b,nt);if(b.isDepthTexture)At=_(b.format===Ti,b.type),Jt&&(zt?e.texStorage2D(i.TEXTURE_2D,1,At,nt.width,nt.height):e.texImage2D(i.TEXTURE_2D,0,At,nt.width,nt.height,0,dt,Ct,null));else if(b.isDataTexture)if(Bt.length>0){zt&&Jt&&e.texStorage2D(i.TEXTURE_2D,vt,At,Bt[0].width,Bt[0].height);for(let st=0,at=Bt.length;st<at;st++)Mt=Bt[st],zt?z&&e.texSubImage2D(i.TEXTURE_2D,st,0,0,Mt.width,Mt.height,dt,Ct,Mt.data):e.texImage2D(i.TEXTURE_2D,st,At,Mt.width,Mt.height,0,dt,Ct,Mt.data);b.generateMipmaps=!1}else zt?(Jt&&e.texStorage2D(i.TEXTURE_2D,vt,At,nt.width,nt.height),z&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,nt.width,nt.height,dt,Ct,nt.data)):e.texImage2D(i.TEXTURE_2D,0,At,nt.width,nt.height,0,dt,Ct,nt.data);else if(b.isCompressedTexture)if(b.isCompressedArrayTexture){zt&&Jt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,vt,At,Bt[0].width,Bt[0].height,nt.depth);for(let st=0,at=Bt.length;st<at;st++)if(Mt=Bt[st],b.format!==ze)if(dt!==null)if(zt){if(z)if(b.layerUpdates.size>0){const bt=rc(Mt.width,Mt.height,b.format,b.type);for(const yt of b.layerUpdates){const Ht=Mt.data.subarray(yt*bt/Mt.data.BYTES_PER_ELEMENT,(yt+1)*bt/Mt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,st,0,0,yt,Mt.width,Mt.height,1,dt,Ht)}b.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,st,0,0,0,Mt.width,Mt.height,nt.depth,dt,Mt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,st,At,Mt.width,Mt.height,nt.depth,0,Mt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else zt?z&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,st,0,0,0,Mt.width,Mt.height,nt.depth,dt,Ct,Mt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,st,At,Mt.width,Mt.height,nt.depth,0,dt,Ct,Mt.data)}else{zt&&Jt&&e.texStorage2D(i.TEXTURE_2D,vt,At,Bt[0].width,Bt[0].height);for(let st=0,at=Bt.length;st<at;st++)Mt=Bt[st],b.format!==ze?dt!==null?zt?z&&e.compressedTexSubImage2D(i.TEXTURE_2D,st,0,0,Mt.width,Mt.height,dt,Mt.data):e.compressedTexImage2D(i.TEXTURE_2D,st,At,Mt.width,Mt.height,0,Mt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):zt?z&&e.texSubImage2D(i.TEXTURE_2D,st,0,0,Mt.width,Mt.height,dt,Ct,Mt.data):e.texImage2D(i.TEXTURE_2D,st,At,Mt.width,Mt.height,0,dt,Ct,Mt.data)}else if(b.isDataArrayTexture)if(zt){if(Jt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,vt,At,nt.width,nt.height,nt.depth),z)if(b.layerUpdates.size>0){const st=rc(nt.width,nt.height,b.format,b.type);for(const at of b.layerUpdates){const bt=nt.data.subarray(at*st/nt.data.BYTES_PER_ELEMENT,(at+1)*st/nt.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,at,nt.width,nt.height,1,dt,Ct,bt)}b.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,nt.width,nt.height,nt.depth,dt,Ct,nt.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,At,nt.width,nt.height,nt.depth,0,dt,Ct,nt.data);else if(b.isData3DTexture)zt?(Jt&&e.texStorage3D(i.TEXTURE_3D,vt,At,nt.width,nt.height,nt.depth),z&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,nt.width,nt.height,nt.depth,dt,Ct,nt.data)):e.texImage3D(i.TEXTURE_3D,0,At,nt.width,nt.height,nt.depth,0,dt,Ct,nt.data);else if(b.isFramebufferTexture){if(Jt)if(zt)e.texStorage2D(i.TEXTURE_2D,vt,At,nt.width,nt.height);else{let st=nt.width,at=nt.height;for(let bt=0;bt<vt;bt++)e.texImage2D(i.TEXTURE_2D,bt,At,st,at,0,dt,Ct,null),st>>=1,at>>=1}}else if(Bt.length>0){if(zt&&Jt){const st=wt(Bt[0]);e.texStorage2D(i.TEXTURE_2D,vt,At,st.width,st.height)}for(let st=0,at=Bt.length;st<at;st++)Mt=Bt[st],zt?z&&e.texSubImage2D(i.TEXTURE_2D,st,0,0,dt,Ct,Mt):e.texImage2D(i.TEXTURE_2D,st,At,dt,Ct,Mt);b.generateMipmaps=!1}else if(zt){if(Jt){const st=wt(nt);e.texStorage2D(i.TEXTURE_2D,vt,At,st.width,st.height)}z&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,dt,Ct,nt)}else e.texImage2D(i.TEXTURE_2D,0,At,dt,Ct,nt);m(b)&&p(N),$.__version=O.version,b.onUpdate&&b.onUpdate(b)}R.__version=b.version}function I(R,b,w){if(b.image.length!==6)return;const N=q(R,b),F=b.source;e.bindTexture(i.TEXTURE_CUBE_MAP,R.__webglTexture,i.TEXTURE0+w);const O=n.get(F);if(F.version!==O.__version||N===!0){e.activeTexture(i.TEXTURE0+w);const $=jt.getPrimaries(jt.workingColorSpace),it=b.colorSpace===$e?null:jt.getPrimaries(b.colorSpace),ot=b.colorSpace===$e||$===it?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,b.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,b.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ot);const Lt=b.isCompressedTexture||b.image[0].isCompressedTexture,nt=b.image[0]&&b.image[0].isDataTexture,dt=[];for(let at=0;at<6;at++)!Lt&&!nt?dt[at]=v(b.image[at],!0,s.maxCubemapSize):dt[at]=nt?b.image[at].image:b.image[at],dt[at]=Ot(b,dt[at]);const Ct=dt[0],At=r.convert(b.format,b.colorSpace),Mt=r.convert(b.type),Bt=E(b.internalFormat,At,Mt,b.colorSpace),zt=b.isVideoTexture!==!0,Jt=O.__version===void 0||N===!0,z=F.dataReady;let vt=D(b,Ct);Dt(i.TEXTURE_CUBE_MAP,b);let st;if(Lt){zt&&Jt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,vt,Bt,Ct.width,Ct.height);for(let at=0;at<6;at++){st=dt[at].mipmaps;for(let bt=0;bt<st.length;bt++){const yt=st[bt];b.format!==ze?At!==null?zt?z&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,bt,0,0,yt.width,yt.height,At,yt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,bt,Bt,yt.width,yt.height,0,yt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):zt?z&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,bt,0,0,yt.width,yt.height,At,Mt,yt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,bt,Bt,yt.width,yt.height,0,At,Mt,yt.data)}}}else{if(st=b.mipmaps,zt&&Jt){st.length>0&&vt++;const at=wt(dt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,vt,Bt,at.width,at.height)}for(let at=0;at<6;at++)if(nt){zt?z&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,0,0,dt[at].width,dt[at].height,At,Mt,dt[at].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,Bt,dt[at].width,dt[at].height,0,At,Mt,dt[at].data);for(let bt=0;bt<st.length;bt++){const Ht=st[bt].image[at].image;zt?z&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,bt+1,0,0,Ht.width,Ht.height,At,Mt,Ht.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,bt+1,Bt,Ht.width,Ht.height,0,At,Mt,Ht.data)}}else{zt?z&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,0,0,At,Mt,dt[at]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,Bt,At,Mt,dt[at]);for(let bt=0;bt<st.length;bt++){const yt=st[bt];zt?z&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,bt+1,0,0,At,Mt,yt.image[at]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,bt+1,Bt,At,Mt,yt.image[at])}}}m(b)&&p(i.TEXTURE_CUBE_MAP),O.__version=F.version,b.onUpdate&&b.onUpdate(b)}R.__version=b.version}function Z(R,b,w,N,F,O){const $=r.convert(w.format,w.colorSpace),it=r.convert(w.type),ot=E(w.internalFormat,$,it,w.colorSpace),Lt=n.get(b),nt=n.get(w);if(nt.__renderTarget=b,!Lt.__hasExternalTextures){const dt=Math.max(1,b.width>>O),Ct=Math.max(1,b.height>>O);F===i.TEXTURE_3D||F===i.TEXTURE_2D_ARRAY?e.texImage3D(F,O,ot,dt,Ct,b.depth,0,$,it,null):e.texImage2D(F,O,ot,dt,Ct,0,$,it,null)}e.bindFramebuffer(i.FRAMEBUFFER,R),Tt(b)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,N,F,nt.__webglTexture,0,lt(b)):(F===i.TEXTURE_2D||F>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&F<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,N,F,nt.__webglTexture,O),e.bindFramebuffer(i.FRAMEBUFFER,null)}function W(R,b,w){if(i.bindRenderbuffer(i.RENDERBUFFER,R),b.depthBuffer){const N=b.depthTexture,F=N&&N.isDepthTexture?N.type:null,O=_(b.stencilBuffer,F),$=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,it=lt(b);Tt(b)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,it,O,b.width,b.height):w?i.renderbufferStorageMultisample(i.RENDERBUFFER,it,O,b.width,b.height):i.renderbufferStorage(i.RENDERBUFFER,O,b.width,b.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,$,i.RENDERBUFFER,R)}else{const N=b.textures;for(let F=0;F<N.length;F++){const O=N[F],$=r.convert(O.format,O.colorSpace),it=r.convert(O.type),ot=E(O.internalFormat,$,it,O.colorSpace),Lt=lt(b);w&&Tt(b)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Lt,ot,b.width,b.height):Tt(b)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Lt,ot,b.width,b.height):i.renderbufferStorage(i.RENDERBUFFER,ot,b.width,b.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function et(R,b){if(b&&b.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,R),!(b.depthTexture&&b.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const N=n.get(b.depthTexture);N.__renderTarget=b,(!N.__webglTexture||b.depthTexture.image.width!==b.width||b.depthTexture.image.height!==b.height)&&(b.depthTexture.image.width=b.width,b.depthTexture.image.height=b.height,b.depthTexture.needsUpdate=!0),J(b.depthTexture,0);const F=N.__webglTexture,O=lt(b);if(b.depthTexture.format===vi)Tt(b)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,F,0,O):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,F,0);else if(b.depthTexture.format===Ti)Tt(b)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,F,0,O):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,F,0);else throw new Error("Unknown depthTexture format")}function xt(R){const b=n.get(R),w=R.isWebGLCubeRenderTarget===!0;if(b.__boundDepthTexture!==R.depthTexture){const N=R.depthTexture;if(b.__depthDisposeCallback&&b.__depthDisposeCallback(),N){const F=()=>{delete b.__boundDepthTexture,delete b.__depthDisposeCallback,N.removeEventListener("dispose",F)};N.addEventListener("dispose",F),b.__depthDisposeCallback=F}b.__boundDepthTexture=N}if(R.depthTexture&&!b.__autoAllocateDepthBuffer){if(w)throw new Error("target.depthTexture not supported in Cube render targets");et(b.__webglFramebuffer,R)}else if(w){b.__webglDepthbuffer=[];for(let N=0;N<6;N++)if(e.bindFramebuffer(i.FRAMEBUFFER,b.__webglFramebuffer[N]),b.__webglDepthbuffer[N]===void 0)b.__webglDepthbuffer[N]=i.createRenderbuffer(),W(b.__webglDepthbuffer[N],R,!1);else{const F=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,O=b.__webglDepthbuffer[N];i.bindRenderbuffer(i.RENDERBUFFER,O),i.framebufferRenderbuffer(i.FRAMEBUFFER,F,i.RENDERBUFFER,O)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,b.__webglFramebuffer),b.__webglDepthbuffer===void 0)b.__webglDepthbuffer=i.createRenderbuffer(),W(b.__webglDepthbuffer,R,!1);else{const N=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,F=b.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,F),i.framebufferRenderbuffer(i.FRAMEBUFFER,N,i.RENDERBUFFER,F)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Rt(R,b,w){const N=n.get(R);b!==void 0&&Z(N.__webglFramebuffer,R,R.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),w!==void 0&&xt(R)}function Gt(R){const b=R.texture,w=n.get(R),N=n.get(b);R.addEventListener("dispose",A);const F=R.textures,O=R.isWebGLCubeRenderTarget===!0,$=F.length>1;if($||(N.__webglTexture===void 0&&(N.__webglTexture=i.createTexture()),N.__version=b.version,o.memory.textures++),O){w.__webglFramebuffer=[];for(let it=0;it<6;it++)if(b.mipmaps&&b.mipmaps.length>0){w.__webglFramebuffer[it]=[];for(let ot=0;ot<b.mipmaps.length;ot++)w.__webglFramebuffer[it][ot]=i.createFramebuffer()}else w.__webglFramebuffer[it]=i.createFramebuffer()}else{if(b.mipmaps&&b.mipmaps.length>0){w.__webglFramebuffer=[];for(let it=0;it<b.mipmaps.length;it++)w.__webglFramebuffer[it]=i.createFramebuffer()}else w.__webglFramebuffer=i.createFramebuffer();if($)for(let it=0,ot=F.length;it<ot;it++){const Lt=n.get(F[it]);Lt.__webglTexture===void 0&&(Lt.__webglTexture=i.createTexture(),o.memory.textures++)}if(R.samples>0&&Tt(R)===!1){w.__webglMultisampledFramebuffer=i.createFramebuffer(),w.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,w.__webglMultisampledFramebuffer);for(let it=0;it<F.length;it++){const ot=F[it];w.__webglColorRenderbuffer[it]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,w.__webglColorRenderbuffer[it]);const Lt=r.convert(ot.format,ot.colorSpace),nt=r.convert(ot.type),dt=E(ot.internalFormat,Lt,nt,ot.colorSpace,R.isXRRenderTarget===!0),Ct=lt(R);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ct,dt,R.width,R.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+it,i.RENDERBUFFER,w.__webglColorRenderbuffer[it])}i.bindRenderbuffer(i.RENDERBUFFER,null),R.depthBuffer&&(w.__webglDepthRenderbuffer=i.createRenderbuffer(),W(w.__webglDepthRenderbuffer,R,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(O){e.bindTexture(i.TEXTURE_CUBE_MAP,N.__webglTexture),Dt(i.TEXTURE_CUBE_MAP,b);for(let it=0;it<6;it++)if(b.mipmaps&&b.mipmaps.length>0)for(let ot=0;ot<b.mipmaps.length;ot++)Z(w.__webglFramebuffer[it][ot],R,b,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+it,ot);else Z(w.__webglFramebuffer[it],R,b,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+it,0);m(b)&&p(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if($){for(let it=0,ot=F.length;it<ot;it++){const Lt=F[it],nt=n.get(Lt);e.bindTexture(i.TEXTURE_2D,nt.__webglTexture),Dt(i.TEXTURE_2D,Lt),Z(w.__webglFramebuffer,R,Lt,i.COLOR_ATTACHMENT0+it,i.TEXTURE_2D,0),m(Lt)&&p(i.TEXTURE_2D)}e.unbindTexture()}else{let it=i.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(it=R.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(it,N.__webglTexture),Dt(it,b),b.mipmaps&&b.mipmaps.length>0)for(let ot=0;ot<b.mipmaps.length;ot++)Z(w.__webglFramebuffer[ot],R,b,i.COLOR_ATTACHMENT0,it,ot);else Z(w.__webglFramebuffer,R,b,i.COLOR_ATTACHMENT0,it,0);m(b)&&p(it),e.unbindTexture()}R.depthBuffer&&xt(R)}function rt(R){const b=R.textures;for(let w=0,N=b.length;w<N;w++){const F=b[w];if(m(F)){const O=y(R),$=n.get(F).__webglTexture;e.bindTexture(O,$),p(O),e.unbindTexture()}}}const ht=[],L=[];function Pt(R){if(R.samples>0){if(Tt(R)===!1){const b=R.textures,w=R.width,N=R.height;let F=i.COLOR_BUFFER_BIT;const O=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,$=n.get(R),it=b.length>1;if(it)for(let ot=0;ot<b.length;ot++)e.bindFramebuffer(i.FRAMEBUFFER,$.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ot,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,$.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ot,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,$.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,$.__webglFramebuffer);for(let ot=0;ot<b.length;ot++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(F|=i.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(F|=i.STENCIL_BUFFER_BIT)),it){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,$.__webglColorRenderbuffer[ot]);const Lt=n.get(b[ot]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Lt,0)}i.blitFramebuffer(0,0,w,N,0,0,w,N,F,i.NEAREST),c===!0&&(ht.length=0,L.length=0,ht.push(i.COLOR_ATTACHMENT0+ot),R.depthBuffer&&R.resolveDepthBuffer===!1&&(ht.push(O),L.push(O),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,L)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,ht))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),it)for(let ot=0;ot<b.length;ot++){e.bindFramebuffer(i.FRAMEBUFFER,$.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ot,i.RENDERBUFFER,$.__webglColorRenderbuffer[ot]);const Lt=n.get(b[ot]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,$.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ot,i.TEXTURE_2D,Lt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,$.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.resolveDepthBuffer===!1&&c){const b=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[b])}}}function lt(R){return Math.min(s.maxSamples,R.samples)}function Tt(R){const b=n.get(R);return R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&b.__useRenderToTexture!==!1}function gt(R){const b=o.render.frame;h.get(R)!==b&&(h.set(R,b),R.update())}function Ot(R,b){const w=R.colorSpace,N=R.format,F=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||w!==Ri&&w!==$e&&(jt.getTransfer(w)===se?(N!==ze||F!==on)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",w)),b}function wt(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(l.width=R.naturalWidth||R.width,l.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(l.width=R.displayWidth,l.height=R.displayHeight):(l.width=R.width,l.height=R.height),l}this.allocateTextureUnit=V,this.resetTextureUnits=k,this.setTexture2D=J,this.setTexture2DArray=Y,this.setTexture3D=tt,this.setTextureCube=K,this.rebindTextures=Rt,this.setupRenderTarget=Gt,this.updateRenderTargetMipmap=rt,this.updateMultisampleRenderTarget=Pt,this.setupDepthRenderbuffer=xt,this.setupFrameBufferTexture=Z,this.useMultisampledRTT=Tt}function Lm(i,t){function e(n,s=$e){let r;const o=jt.getTransfer(s);if(n===on)return i.UNSIGNED_BYTE;if(n===Bo)return i.UNSIGNED_SHORT_4_4_4_4;if(n===zo)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Oc)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Nc)return i.BYTE;if(n===Fc)return i.SHORT;if(n===Qi)return i.UNSIGNED_SHORT;if(n===Oo)return i.INT;if(n===qn)return i.UNSIGNED_INT;if(n===rn)return i.FLOAT;if(n===Ci)return i.HALF_FLOAT;if(n===Bc)return i.ALPHA;if(n===zc)return i.RGB;if(n===ze)return i.RGBA;if(n===kc)return i.LUMINANCE;if(n===Vc)return i.LUMINANCE_ALPHA;if(n===vi)return i.DEPTH_COMPONENT;if(n===Ti)return i.DEPTH_STENCIL;if(n===ko)return i.RED;if(n===Vo)return i.RED_INTEGER;if(n===Gc)return i.RG;if(n===Go)return i.RG_INTEGER;if(n===Ho)return i.RGBA_INTEGER;if(n===Bs||n===zs||n===ks||n===Vs)if(o===se)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Bs)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===zs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===ks)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Vs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Bs)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===zs)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===ks)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Vs)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Qr||n===to||n===eo||n===no)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Qr)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===to)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===eo)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===no)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===io||n===so||n===ro)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===io||n===so)return o===se?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===ro)return o===se?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===oo||n===ao||n===co||n===lo||n===ho||n===uo||n===fo||n===po||n===mo||n===go||n===_o||n===vo||n===xo||n===Mo)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===oo)return o===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===ao)return o===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===co)return o===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===lo)return o===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===ho)return o===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===uo)return o===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===fo)return o===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===po)return o===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===mo)return o===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===go)return o===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===_o)return o===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===vo)return o===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===xo)return o===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Mo)return o===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Gs||n===So||n===yo)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===Gs)return o===se?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===So)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===yo)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Hc||n===Eo||n===bo||n===To)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===Gs)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Eo)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===bo)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===To)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===bi?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}class Dm extends Be{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class Ee extends de{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Im={type:"move"};class Ir{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ee,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ee,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new U,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new U),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ee,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new U,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new U),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null;const a=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){o=!0;for(const v of t.hand.values()){const m=e.getJointPose(v,n),p=this._getHandJoint(l,v);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const h=l.joints["index-finger-tip"],u=l.joints["thumb-tip"],f=h.position.distanceTo(u.position),d=.02,g=.005;l.inputState.pinching&&f>d+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&f<=d-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Im)))}return a!==null&&(a.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new Ee;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const Um=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Nm=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Fm{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const s=new Te,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new we({vertexShader:Um,fragmentShader:Nm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new kt(new $n(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Om extends Pi{constructor(t,e){super();const n=this;let s=null,r=1,o=null,a="local-floor",c=1,l=null,h=null,u=null,f=null,d=null,g=null;const v=new Fm,m=e.getContextAttributes();let p=null,y=null;const E=[],_=[],D=new ct;let S=null;const A=new Be;A.viewport=new oe;const P=new Be;P.viewport=new oe;const M=[A,P],x=new Dm;let C=null,k=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(B){let I=E[B];return I===void 0&&(I=new Ir,E[B]=I),I.getTargetRaySpace()},this.getControllerGrip=function(B){let I=E[B];return I===void 0&&(I=new Ir,E[B]=I),I.getGripSpace()},this.getHand=function(B){let I=E[B];return I===void 0&&(I=new Ir,E[B]=I),I.getHandSpace()};function V(B){const I=_.indexOf(B.inputSource);if(I===-1)return;const Z=E[I];Z!==void 0&&(Z.update(B.inputSource,B.frame,l||o),Z.dispatchEvent({type:B.type,data:B.inputSource}))}function X(){s.removeEventListener("select",V),s.removeEventListener("selectstart",V),s.removeEventListener("selectend",V),s.removeEventListener("squeeze",V),s.removeEventListener("squeezestart",V),s.removeEventListener("squeezeend",V),s.removeEventListener("end",X),s.removeEventListener("inputsourceschange",J);for(let B=0;B<E.length;B++){const I=_[B];I!==null&&(_[B]=null,E[B].disconnect(I))}C=null,k=null,v.reset(),t.setRenderTarget(p),d=null,f=null,u=null,s=null,y=null,q.stop(),n.isPresenting=!1,t.setPixelRatio(S),t.setSize(D.width,D.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(B){r=B,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(B){a=B,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(B){l=B},this.getBaseLayer=function(){return f!==null?f:d},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(B){if(s=B,s!==null){if(p=t.getRenderTarget(),s.addEventListener("select",V),s.addEventListener("selectstart",V),s.addEventListener("selectend",V),s.addEventListener("squeeze",V),s.addEventListener("squeezestart",V),s.addEventListener("squeezeend",V),s.addEventListener("end",X),s.addEventListener("inputsourceschange",J),m.xrCompatible!==!0&&await e.makeXRCompatible(),S=t.getPixelRatio(),t.getSize(D),s.renderState.layers===void 0){const I={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(s,e,I),s.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),y=new Dn(d.framebufferWidth,d.framebufferHeight,{format:ze,type:on,colorSpace:t.outputColorSpace,stencilBuffer:m.stencil})}else{let I=null,Z=null,W=null;m.depth&&(W=m.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,I=m.stencil?Ti:vi,Z=m.stencil?bi:qn);const et={colorFormat:e.RGBA8,depthFormat:W,scaleFactor:r};u=new XRWebGLBinding(s,e),f=u.createProjectionLayer(et),s.updateRenderState({layers:[f]}),t.setPixelRatio(1),t.setSize(f.textureWidth,f.textureHeight,!1),y=new Dn(f.textureWidth,f.textureHeight,{format:ze,type:on,depthTexture:new sl(f.textureWidth,f.textureHeight,Z,void 0,void 0,void 0,void 0,void 0,void 0,I),stencilBuffer:m.stencil,colorSpace:t.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await s.requestReferenceSpace(a),q.setContext(s),q.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function J(B){for(let I=0;I<B.removed.length;I++){const Z=B.removed[I],W=_.indexOf(Z);W>=0&&(_[W]=null,E[W].disconnect(Z))}for(let I=0;I<B.added.length;I++){const Z=B.added[I];let W=_.indexOf(Z);if(W===-1){for(let xt=0;xt<E.length;xt++)if(xt>=_.length){_.push(Z),W=xt;break}else if(_[xt]===null){_[xt]=Z,W=xt;break}if(W===-1)break}const et=E[W];et&&et.connect(Z)}}const Y=new U,tt=new U;function K(B,I,Z){Y.setFromMatrixPosition(I.matrixWorld),tt.setFromMatrixPosition(Z.matrixWorld);const W=Y.distanceTo(tt),et=I.projectionMatrix.elements,xt=Z.projectionMatrix.elements,Rt=et[14]/(et[10]-1),Gt=et[14]/(et[10]+1),rt=(et[9]+1)/et[5],ht=(et[9]-1)/et[5],L=(et[8]-1)/et[0],Pt=(xt[8]+1)/xt[0],lt=Rt*L,Tt=Rt*Pt,gt=W/(-L+Pt),Ot=gt*-L;if(I.matrixWorld.decompose(B.position,B.quaternion,B.scale),B.translateX(Ot),B.translateZ(gt),B.matrixWorld.compose(B.position,B.quaternion,B.scale),B.matrixWorldInverse.copy(B.matrixWorld).invert(),et[10]===-1)B.projectionMatrix.copy(I.projectionMatrix),B.projectionMatrixInverse.copy(I.projectionMatrixInverse);else{const wt=Rt+gt,R=Gt+gt,b=lt-Ot,w=Tt+(W-Ot),N=rt*Gt/R*wt,F=ht*Gt/R*wt;B.projectionMatrix.makePerspective(b,w,N,F,wt,R),B.projectionMatrixInverse.copy(B.projectionMatrix).invert()}}function ft(B,I){I===null?B.matrixWorld.copy(B.matrix):B.matrixWorld.multiplyMatrices(I.matrixWorld,B.matrix),B.matrixWorldInverse.copy(B.matrixWorld).invert()}this.updateCamera=function(B){if(s===null)return;let I=B.near,Z=B.far;v.texture!==null&&(v.depthNear>0&&(I=v.depthNear),v.depthFar>0&&(Z=v.depthFar)),x.near=P.near=A.near=I,x.far=P.far=A.far=Z,(C!==x.near||k!==x.far)&&(s.updateRenderState({depthNear:x.near,depthFar:x.far}),C=x.near,k=x.far),A.layers.mask=B.layers.mask|2,P.layers.mask=B.layers.mask|4,x.layers.mask=A.layers.mask|P.layers.mask;const W=B.parent,et=x.cameras;ft(x,W);for(let xt=0;xt<et.length;xt++)ft(et[xt],W);et.length===2?K(x,A,P):x.projectionMatrix.copy(A.projectionMatrix),ut(B,x,W)};function ut(B,I,Z){Z===null?B.matrix.copy(I.matrixWorld):(B.matrix.copy(Z.matrixWorld),B.matrix.invert(),B.matrix.multiply(I.matrixWorld)),B.matrix.decompose(B.position,B.quaternion,B.scale),B.updateMatrixWorld(!0),B.projectionMatrix.copy(I.projectionMatrix),B.projectionMatrixInverse.copy(I.projectionMatrixInverse),B.isPerspectiveCamera&&(B.fov=wo*2*Math.atan(1/B.projectionMatrix.elements[5]),B.zoom=1)}this.getCamera=function(){return x},this.getFoveation=function(){if(!(f===null&&d===null))return c},this.setFoveation=function(B){c=B,f!==null&&(f.fixedFoveation=B),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=B)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(x)};let _t=null;function Dt(B,I){if(h=I.getViewerPose(l||o),g=I,h!==null){const Z=h.views;d!==null&&(t.setRenderTargetFramebuffer(y,d.framebuffer),t.setRenderTarget(y));let W=!1;Z.length!==x.cameras.length&&(x.cameras.length=0,W=!0);for(let xt=0;xt<Z.length;xt++){const Rt=Z[xt];let Gt=null;if(d!==null)Gt=d.getViewport(Rt);else{const ht=u.getViewSubImage(f,Rt);Gt=ht.viewport,xt===0&&(t.setRenderTargetTextures(y,ht.colorTexture,f.ignoreDepthValues?void 0:ht.depthStencilTexture),t.setRenderTarget(y))}let rt=M[xt];rt===void 0&&(rt=new Be,rt.layers.enable(xt),rt.viewport=new oe,M[xt]=rt),rt.matrix.fromArray(Rt.transform.matrix),rt.matrix.decompose(rt.position,rt.quaternion,rt.scale),rt.projectionMatrix.fromArray(Rt.projectionMatrix),rt.projectionMatrixInverse.copy(rt.projectionMatrix).invert(),rt.viewport.set(Gt.x,Gt.y,Gt.width,Gt.height),xt===0&&(x.matrix.copy(rt.matrix),x.matrix.decompose(x.position,x.quaternion,x.scale)),W===!0&&x.cameras.push(rt)}const et=s.enabledFeatures;if(et&&et.includes("depth-sensing")){const xt=u.getDepthInformation(Z[0]);xt&&xt.isValid&&xt.texture&&v.init(t,xt,s.renderState)}}for(let Z=0;Z<E.length;Z++){const W=_[Z],et=E[Z];W!==null&&et!==void 0&&et.update(W,I,l||o)}_t&&_t(B,I),I.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:I}),g=null}const q=new il;q.setAnimationLoop(Dt),this.setAnimationLoop=function(B){_t=B},this.dispose=function(){}}}const zn=new an,Bm=new ae;function zm(i,t){function e(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,tl(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,y,E,_){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),u(m,p)):p.isMeshPhongMaterial?(r(m,p),h(m,p)):p.isMeshStandardMaterial?(r(m,p),f(m,p),p.isMeshPhysicalMaterial&&d(m,p,_)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),v(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?c(m,p,y,E):p.isSpriteMaterial?l(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,e(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Le&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,e(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Le&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,e(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,e(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const y=t.get(p),E=y.envMap,_=y.envMapRotation;E&&(m.envMap.value=E,zn.copy(_),zn.x*=-1,zn.y*=-1,zn.z*=-1,E.isCubeTexture&&E.isRenderTargetTexture===!1&&(zn.y*=-1,zn.z*=-1),m.envMapRotation.value.setFromMatrix4(Bm.makeRotationFromEuler(zn)),m.flipEnvMap.value=E.isCubeTexture&&E.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function c(m,p,y,E){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*y,m.scale.value=E*.5,p.map&&(m.map.value=p.map,e(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function l(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function u(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function f(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function d(m,p,y){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Le&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=y.texture,m.transmissionSamplerSize.value.set(y.width,y.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function v(m,p){const y=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(y.matrixWorld),m.nearDistance.value=y.shadow.camera.near,m.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function km(i,t,e,n){let s={},r={},o=[];const a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(y,E){const _=E.program;n.uniformBlockBinding(y,_)}function l(y,E){let _=s[y.id];_===void 0&&(g(y),_=h(y),s[y.id]=_,y.addEventListener("dispose",m));const D=E.program;n.updateUBOMapping(y,D);const S=t.render.frame;r[y.id]!==S&&(f(y),r[y.id]=S)}function h(y){const E=u();y.__bindingPointIndex=E;const _=i.createBuffer(),D=y.__size,S=y.usage;return i.bindBuffer(i.UNIFORM_BUFFER,_),i.bufferData(i.UNIFORM_BUFFER,D,S),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,E,_),_}function u(){for(let y=0;y<a;y++)if(o.indexOf(y)===-1)return o.push(y),y;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(y){const E=s[y.id],_=y.uniforms,D=y.__cache;i.bindBuffer(i.UNIFORM_BUFFER,E);for(let S=0,A=_.length;S<A;S++){const P=Array.isArray(_[S])?_[S]:[_[S]];for(let M=0,x=P.length;M<x;M++){const C=P[M];if(d(C,S,M,D)===!0){const k=C.__offset,V=Array.isArray(C.value)?C.value:[C.value];let X=0;for(let J=0;J<V.length;J++){const Y=V[J],tt=v(Y);typeof Y=="number"||typeof Y=="boolean"?(C.__data[0]=Y,i.bufferSubData(i.UNIFORM_BUFFER,k+X,C.__data)):Y.isMatrix3?(C.__data[0]=Y.elements[0],C.__data[1]=Y.elements[1],C.__data[2]=Y.elements[2],C.__data[3]=0,C.__data[4]=Y.elements[3],C.__data[5]=Y.elements[4],C.__data[6]=Y.elements[5],C.__data[7]=0,C.__data[8]=Y.elements[6],C.__data[9]=Y.elements[7],C.__data[10]=Y.elements[8],C.__data[11]=0):(Y.toArray(C.__data,X),X+=tt.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,k,C.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(y,E,_,D){const S=y.value,A=E+"_"+_;if(D[A]===void 0)return typeof S=="number"||typeof S=="boolean"?D[A]=S:D[A]=S.clone(),!0;{const P=D[A];if(typeof S=="number"||typeof S=="boolean"){if(P!==S)return D[A]=S,!0}else if(P.equals(S)===!1)return P.copy(S),!0}return!1}function g(y){const E=y.uniforms;let _=0;const D=16;for(let A=0,P=E.length;A<P;A++){const M=Array.isArray(E[A])?E[A]:[E[A]];for(let x=0,C=M.length;x<C;x++){const k=M[x],V=Array.isArray(k.value)?k.value:[k.value];for(let X=0,J=V.length;X<J;X++){const Y=V[X],tt=v(Y),K=_%D,ft=K%tt.boundary,ut=K+ft;_+=ft,ut!==0&&D-ut<tt.storage&&(_+=D-ut),k.__data=new Float32Array(tt.storage/Float32Array.BYTES_PER_ELEMENT),k.__offset=_,_+=tt.storage}}}const S=_%D;return S>0&&(_+=D-S),y.__size=_,y.__cache={},this}function v(y){const E={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(E.boundary=4,E.storage=4):y.isVector2?(E.boundary=8,E.storage=8):y.isVector3||y.isColor?(E.boundary=16,E.storage=12):y.isVector4?(E.boundary=16,E.storage=16):y.isMatrix3?(E.boundary=48,E.storage=48):y.isMatrix4?(E.boundary=64,E.storage=64):y.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",y),E}function m(y){const E=y.target;E.removeEventListener("dispose",m);const _=o.indexOf(E.__bindingPointIndex);o.splice(_,1),i.deleteBuffer(s[E.id]),delete s[E.id],delete r[E.id]}function p(){for(const y in s)i.deleteBuffer(s[y]);o=[],s={},r={}}return{bind:c,update:l,dispose:p}}class Vm{constructor(t={}){const{canvas:e=Ch(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:f=!1}=t;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=o;const g=new Uint32Array(4),v=new Int32Array(4);let m=null,p=null;const y=[],E=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Ue,this.toneMapping=xn,this.toneMappingExposure=1;const _=this;let D=!1,S=0,A=0,P=null,M=-1,x=null;const C=new oe,k=new oe;let V=null;const X=new pt(0);let J=0,Y=e.width,tt=e.height,K=1,ft=null,ut=null;const _t=new oe(0,0,Y,tt),Dt=new oe(0,0,Y,tt);let q=!1;const B=new Wo;let I=!1,Z=!1;const W=new ae,et=new ae,xt=new U,Rt=new oe,Gt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let rt=!1;function ht(){return P===null?K:1}let L=n;function Pt(T,G){return e.getContext(T,G)}try{const T={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${No}`),e.addEventListener("webglcontextlost",at,!1),e.addEventListener("webglcontextrestored",bt,!1),e.addEventListener("webglcontextcreationerror",yt,!1),L===null){const G="webgl2";if(L=Pt(G,T),L===null)throw Pt(G)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(T){throw console.error("THREE.WebGLRenderer: "+T.message),T}let lt,Tt,gt,Ot,wt,R,b,w,N,F,O,$,it,ot,Lt,nt,dt,Ct,At,Mt,Bt,zt,Jt,z;function vt(){lt=new Yd(L),lt.init(),zt=new Lm(L,lt),Tt=new kd(L,lt,t,zt),gt=new Cm(L,lt),Tt.reverseDepthBuffer&&f&&gt.buffers.depth.setReversed(!0),Ot=new Kd(L),wt=new dm,R=new Pm(L,lt,gt,wt,Tt,zt,Ot),b=new Gd(_),w=new Xd(_),N=new eu(L),Jt=new Bd(L,N),F=new qd(L,N,Ot,Jt),O=new $d(L,F,N,Ot),At=new Jd(L,Tt,R),nt=new Vd(wt),$=new fm(_,b,w,lt,Tt,Jt,nt),it=new zm(_,wt),ot=new mm,Lt=new Sm(lt),Ct=new Od(_,b,w,gt,O,d,c),dt=new wm(_,O,Tt),z=new km(L,Ot,Tt,gt),Mt=new zd(L,lt,Ot),Bt=new Zd(L,lt,Ot),Ot.programs=$.programs,_.capabilities=Tt,_.extensions=lt,_.properties=wt,_.renderLists=ot,_.shadowMap=dt,_.state=gt,_.info=Ot}vt();const st=new Om(_,L);this.xr=st,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){const T=lt.get("WEBGL_lose_context");T&&T.loseContext()},this.forceContextRestore=function(){const T=lt.get("WEBGL_lose_context");T&&T.restoreContext()},this.getPixelRatio=function(){return K},this.setPixelRatio=function(T){T!==void 0&&(K=T,this.setSize(Y,tt,!1))},this.getSize=function(T){return T.set(Y,tt)},this.setSize=function(T,G,j=!0){if(st.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}Y=T,tt=G,e.width=Math.floor(T*K),e.height=Math.floor(G*K),j===!0&&(e.style.width=T+"px",e.style.height=G+"px"),this.setViewport(0,0,T,G)},this.getDrawingBufferSize=function(T){return T.set(Y*K,tt*K).floor()},this.setDrawingBufferSize=function(T,G,j){Y=T,tt=G,K=j,e.width=Math.floor(T*j),e.height=Math.floor(G*j),this.setViewport(0,0,T,G)},this.getCurrentViewport=function(T){return T.copy(C)},this.getViewport=function(T){return T.copy(_t)},this.setViewport=function(T,G,j,Q){T.isVector4?_t.set(T.x,T.y,T.z,T.w):_t.set(T,G,j,Q),gt.viewport(C.copy(_t).multiplyScalar(K).round())},this.getScissor=function(T){return T.copy(Dt)},this.setScissor=function(T,G,j,Q){T.isVector4?Dt.set(T.x,T.y,T.z,T.w):Dt.set(T,G,j,Q),gt.scissor(k.copy(Dt).multiplyScalar(K).round())},this.getScissorTest=function(){return q},this.setScissorTest=function(T){gt.setScissorTest(q=T)},this.setOpaqueSort=function(T){ft=T},this.setTransparentSort=function(T){ut=T},this.getClearColor=function(T){return T.copy(Ct.getClearColor())},this.setClearColor=function(){Ct.setClearColor.apply(Ct,arguments)},this.getClearAlpha=function(){return Ct.getClearAlpha()},this.setClearAlpha=function(){Ct.setClearAlpha.apply(Ct,arguments)},this.clear=function(T=!0,G=!0,j=!0){let Q=0;if(T){let H=!1;if(P!==null){const mt=P.texture.format;H=mt===Ho||mt===Go||mt===Vo}if(H){const mt=P.texture.type,Et=mt===on||mt===qn||mt===Qi||mt===bi||mt===Bo||mt===zo,It=Ct.getClearColor(),Ut=Ct.getClearAlpha(),Vt=It.r,Wt=It.g,Nt=It.b;Et?(g[0]=Vt,g[1]=Wt,g[2]=Nt,g[3]=Ut,L.clearBufferuiv(L.COLOR,0,g)):(v[0]=Vt,v[1]=Wt,v[2]=Nt,v[3]=Ut,L.clearBufferiv(L.COLOR,0,v))}else Q|=L.COLOR_BUFFER_BIT}G&&(Q|=L.DEPTH_BUFFER_BIT),j&&(Q|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),L.clear(Q)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",at,!1),e.removeEventListener("webglcontextrestored",bt,!1),e.removeEventListener("webglcontextcreationerror",yt,!1),ot.dispose(),Lt.dispose(),wt.dispose(),b.dispose(),w.dispose(),O.dispose(),Jt.dispose(),z.dispose(),$.dispose(),st.dispose(),st.removeEventListener("sessionstart",ea),st.removeEventListener("sessionend",na),In.stop()};function at(T){T.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),D=!0}function bt(){console.log("THREE.WebGLRenderer: Context Restored."),D=!1;const T=Ot.autoReset,G=dt.enabled,j=dt.autoUpdate,Q=dt.needsUpdate,H=dt.type;vt(),Ot.autoReset=T,dt.enabled=G,dt.autoUpdate=j,dt.needsUpdate=Q,dt.type=H}function yt(T){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",T.statusMessage)}function Ht(T){const G=T.target;G.removeEventListener("dispose",Ht),fe(G)}function fe(T){Me(T),wt.remove(T)}function Me(T){const G=wt.get(T).programs;G!==void 0&&(G.forEach(function(j){$.releaseProgram(j)}),T.isShaderMaterial&&$.releaseShaderCache(T))}this.renderBufferDirect=function(T,G,j,Q,H,mt){G===null&&(G=Gt);const Et=H.isMesh&&H.matrixWorld.determinant()<0,It=Sl(T,G,j,Q,H);gt.setMaterial(Q,Et);let Ut=j.index,Vt=1;if(Q.wireframe===!0){if(Ut=F.getWireframeAttribute(j),Ut===void 0)return;Vt=2}const Wt=j.drawRange,Nt=j.attributes.position;let Qt=Wt.start*Vt,ce=(Wt.start+Wt.count)*Vt;mt!==null&&(Qt=Math.max(Qt,mt.start*Vt),ce=Math.min(ce,(mt.start+mt.count)*Vt)),Ut!==null?(Qt=Math.max(Qt,0),ce=Math.min(ce,Ut.count)):Nt!=null&&(Qt=Math.max(Qt,0),ce=Math.min(ce,Nt.count));const le=ce-Qt;if(le<0||le===1/0)return;Jt.setup(H,Q,It,j,Ut);let De,te=Mt;if(Ut!==null&&(De=N.get(Ut),te=Bt,te.setIndex(De)),H.isMesh)Q.wireframe===!0?(gt.setLineWidth(Q.wireframeLinewidth*ht()),te.setMode(L.LINES)):te.setMode(L.TRIANGLES);else if(H.isLine){let Ft=Q.linewidth;Ft===void 0&&(Ft=1),gt.setLineWidth(Ft*ht()),H.isLineSegments?te.setMode(L.LINES):H.isLineLoop?te.setMode(L.LINE_LOOP):te.setMode(L.LINE_STRIP)}else H.isPoints?te.setMode(L.POINTS):H.isSprite&&te.setMode(L.TRIANGLES);if(H.isBatchedMesh)if(H._multiDrawInstances!==null)te.renderMultiDrawInstances(H._multiDrawStarts,H._multiDrawCounts,H._multiDrawCount,H._multiDrawInstances);else if(lt.get("WEBGL_multi_draw"))te.renderMultiDraw(H._multiDrawStarts,H._multiDrawCounts,H._multiDrawCount);else{const Ft=H._multiDrawStarts,hn=H._multiDrawCounts,ee=H._multiDrawCount,Xe=Ut?N.get(Ut).bytesPerElement:1,jn=wt.get(Q).currentProgram.getUniforms();for(let Ne=0;Ne<ee;Ne++)jn.setValue(L,"_gl_DrawID",Ne),te.render(Ft[Ne]/Xe,hn[Ne])}else if(H.isInstancedMesh)te.renderInstances(Qt,le,H.count);else if(j.isInstancedBufferGeometry){const Ft=j._maxInstanceCount!==void 0?j._maxInstanceCount:1/0,hn=Math.min(j.instanceCount,Ft);te.renderInstances(Qt,le,hn)}else te.render(Qt,le)};function ie(T,G,j){T.transparent===!0&&T.side===Ce&&T.forceSinglePass===!1?(T.side=Le,T.needsUpdate=!0,ls(T,G,j),T.side=Ln,T.needsUpdate=!0,ls(T,G,j),T.side=Ce):ls(T,G,j)}this.compile=function(T,G,j=null){j===null&&(j=T),p=Lt.get(j),p.init(G),E.push(p),j.traverseVisible(function(H){H.isLight&&H.layers.test(G.layers)&&(p.pushLight(H),H.castShadow&&p.pushShadow(H))}),T!==j&&T.traverseVisible(function(H){H.isLight&&H.layers.test(G.layers)&&(p.pushLight(H),H.castShadow&&p.pushShadow(H))}),p.setupLights();const Q=new Set;return T.traverse(function(H){if(!(H.isMesh||H.isPoints||H.isLine||H.isSprite))return;const mt=H.material;if(mt)if(Array.isArray(mt))for(let Et=0;Et<mt.length;Et++){const It=mt[Et];ie(It,j,H),Q.add(It)}else ie(mt,j,H),Q.add(mt)}),E.pop(),p=null,Q},this.compileAsync=function(T,G,j=null){const Q=this.compile(T,G,j);return new Promise(H=>{function mt(){if(Q.forEach(function(Et){wt.get(Et).currentProgram.isReady()&&Q.delete(Et)}),Q.size===0){H(T);return}setTimeout(mt,10)}lt.get("KHR_parallel_shader_compile")!==null?mt():setTimeout(mt,10)})};let We=null;function ln(T){We&&We(T)}function ea(){In.stop()}function na(){In.start()}const In=new il;In.setAnimationLoop(ln),typeof self<"u"&&In.setContext(self),this.setAnimationLoop=function(T){We=T,st.setAnimationLoop(T),T===null?In.stop():In.start()},st.addEventListener("sessionstart",ea),st.addEventListener("sessionend",na),this.render=function(T,G){if(G!==void 0&&G.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;if(T.matrixWorldAutoUpdate===!0&&T.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),st.enabled===!0&&st.isPresenting===!0&&(st.cameraAutoUpdate===!0&&st.updateCamera(G),G=st.getCamera()),T.isScene===!0&&T.onBeforeRender(_,T,G,P),p=Lt.get(T,E.length),p.init(G),E.push(p),et.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),B.setFromProjectionMatrix(et),Z=this.localClippingEnabled,I=nt.init(this.clippingPlanes,Z),m=ot.get(T,y.length),m.init(),y.push(m),st.enabled===!0&&st.isPresenting===!0){const mt=_.xr.getDepthSensingMesh();mt!==null&&er(mt,G,-1/0,_.sortObjects)}er(T,G,0,_.sortObjects),m.finish(),_.sortObjects===!0&&m.sort(ft,ut),rt=st.enabled===!1||st.isPresenting===!1||st.hasDepthSensing()===!1,rt&&Ct.addToRenderList(m,T),this.info.render.frame++,I===!0&&nt.beginShadows();const j=p.state.shadowsArray;dt.render(j,T,G),I===!0&&nt.endShadows(),this.info.autoReset===!0&&this.info.reset();const Q=m.opaque,H=m.transmissive;if(p.setupLights(),G.isArrayCamera){const mt=G.cameras;if(H.length>0)for(let Et=0,It=mt.length;Et<It;Et++){const Ut=mt[Et];sa(Q,H,T,Ut)}rt&&Ct.render(T);for(let Et=0,It=mt.length;Et<It;Et++){const Ut=mt[Et];ia(m,T,Ut,Ut.viewport)}}else H.length>0&&sa(Q,H,T,G),rt&&Ct.render(T),ia(m,T,G);P!==null&&(R.updateMultisampleRenderTarget(P),R.updateRenderTargetMipmap(P)),T.isScene===!0&&T.onAfterRender(_,T,G),Jt.resetDefaultState(),M=-1,x=null,E.pop(),E.length>0?(p=E[E.length-1],I===!0&&nt.setGlobalState(_.clippingPlanes,p.state.camera)):p=null,y.pop(),y.length>0?m=y[y.length-1]:m=null};function er(T,G,j,Q){if(T.visible===!1)return;if(T.layers.test(G.layers)){if(T.isGroup)j=T.renderOrder;else if(T.isLOD)T.autoUpdate===!0&&T.update(G);else if(T.isLight)p.pushLight(T),T.castShadow&&p.pushShadow(T);else if(T.isSprite){if(!T.frustumCulled||B.intersectsSprite(T)){Q&&Rt.setFromMatrixPosition(T.matrixWorld).applyMatrix4(et);const Et=O.update(T),It=T.material;It.visible&&m.push(T,Et,It,j,Rt.z,null)}}else if((T.isMesh||T.isLine||T.isPoints)&&(!T.frustumCulled||B.intersectsObject(T))){const Et=O.update(T),It=T.material;if(Q&&(T.boundingSphere!==void 0?(T.boundingSphere===null&&T.computeBoundingSphere(),Rt.copy(T.boundingSphere.center)):(Et.boundingSphere===null&&Et.computeBoundingSphere(),Rt.copy(Et.boundingSphere.center)),Rt.applyMatrix4(T.matrixWorld).applyMatrix4(et)),Array.isArray(It)){const Ut=Et.groups;for(let Vt=0,Wt=Ut.length;Vt<Wt;Vt++){const Nt=Ut[Vt],Qt=It[Nt.materialIndex];Qt&&Qt.visible&&m.push(T,Et,Qt,j,Rt.z,Nt)}}else It.visible&&m.push(T,Et,It,j,Rt.z,null)}}const mt=T.children;for(let Et=0,It=mt.length;Et<It;Et++)er(mt[Et],G,j,Q)}function ia(T,G,j,Q){const H=T.opaque,mt=T.transmissive,Et=T.transparent;p.setupLightsView(j),I===!0&&nt.setGlobalState(_.clippingPlanes,j),Q&&gt.viewport(C.copy(Q)),H.length>0&&cs(H,G,j),mt.length>0&&cs(mt,G,j),Et.length>0&&cs(Et,G,j),gt.buffers.depth.setTest(!0),gt.buffers.depth.setMask(!0),gt.buffers.color.setMask(!0),gt.setPolygonOffset(!1)}function sa(T,G,j,Q){if((j.isScene===!0?j.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[Q.id]===void 0&&(p.state.transmissionRenderTarget[Q.id]=new Dn(1,1,{generateMipmaps:!0,type:lt.has("EXT_color_buffer_half_float")||lt.has("EXT_color_buffer_float")?Ci:on,minFilter:sn,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:jt.workingColorSpace}));const mt=p.state.transmissionRenderTarget[Q.id],Et=Q.viewport||C;mt.setSize(Et.z,Et.w);const It=_.getRenderTarget();_.setRenderTarget(mt),_.getClearColor(X),J=_.getClearAlpha(),J<1&&_.setClearColor(16777215,.5),_.clear(),rt&&Ct.render(j);const Ut=_.toneMapping;_.toneMapping=xn;const Vt=Q.viewport;if(Q.viewport!==void 0&&(Q.viewport=void 0),p.setupLightsView(Q),I===!0&&nt.setGlobalState(_.clippingPlanes,Q),cs(T,j,Q),R.updateMultisampleRenderTarget(mt),R.updateRenderTargetMipmap(mt),lt.has("WEBGL_multisampled_render_to_texture")===!1){let Wt=!1;for(let Nt=0,Qt=G.length;Nt<Qt;Nt++){const ce=G[Nt],le=ce.object,De=ce.geometry,te=ce.material,Ft=ce.group;if(te.side===Ce&&le.layers.test(Q.layers)){const hn=te.side;te.side=Le,te.needsUpdate=!0,ra(le,j,Q,De,te,Ft),te.side=hn,te.needsUpdate=!0,Wt=!0}}Wt===!0&&(R.updateMultisampleRenderTarget(mt),R.updateRenderTargetMipmap(mt))}_.setRenderTarget(It),_.setClearColor(X,J),Vt!==void 0&&(Q.viewport=Vt),_.toneMapping=Ut}function cs(T,G,j){const Q=G.isScene===!0?G.overrideMaterial:null;for(let H=0,mt=T.length;H<mt;H++){const Et=T[H],It=Et.object,Ut=Et.geometry,Vt=Q===null?Et.material:Q,Wt=Et.group;It.layers.test(j.layers)&&ra(It,G,j,Ut,Vt,Wt)}}function ra(T,G,j,Q,H,mt){T.onBeforeRender(_,G,j,Q,H,mt),T.modelViewMatrix.multiplyMatrices(j.matrixWorldInverse,T.matrixWorld),T.normalMatrix.getNormalMatrix(T.modelViewMatrix),H.onBeforeRender(_,G,j,Q,T,mt),H.transparent===!0&&H.side===Ce&&H.forceSinglePass===!1?(H.side=Le,H.needsUpdate=!0,_.renderBufferDirect(j,G,Q,H,T,mt),H.side=Ln,H.needsUpdate=!0,_.renderBufferDirect(j,G,Q,H,T,mt),H.side=Ce):_.renderBufferDirect(j,G,Q,H,T,mt),T.onAfterRender(_,G,j,Q,H,mt)}function ls(T,G,j){G.isScene!==!0&&(G=Gt);const Q=wt.get(T),H=p.state.lights,mt=p.state.shadowsArray,Et=H.state.version,It=$.getParameters(T,H.state,mt,G,j),Ut=$.getProgramCacheKey(It);let Vt=Q.programs;Q.environment=T.isMeshStandardMaterial?G.environment:null,Q.fog=G.fog,Q.envMap=(T.isMeshStandardMaterial?w:b).get(T.envMap||Q.environment),Q.envMapRotation=Q.environment!==null&&T.envMap===null?G.environmentRotation:T.envMapRotation,Vt===void 0&&(T.addEventListener("dispose",Ht),Vt=new Map,Q.programs=Vt);let Wt=Vt.get(Ut);if(Wt!==void 0){if(Q.currentProgram===Wt&&Q.lightsStateVersion===Et)return aa(T,It),Wt}else It.uniforms=$.getUniforms(T),T.onBeforeCompile(It,_),Wt=$.acquireProgram(It,Ut),Vt.set(Ut,Wt),Q.uniforms=It.uniforms;const Nt=Q.uniforms;return(!T.isShaderMaterial&&!T.isRawShaderMaterial||T.clipping===!0)&&(Nt.clippingPlanes=nt.uniform),aa(T,It),Q.needsLights=El(T),Q.lightsStateVersion=Et,Q.needsLights&&(Nt.ambientLightColor.value=H.state.ambient,Nt.lightProbe.value=H.state.probe,Nt.directionalLights.value=H.state.directional,Nt.directionalLightShadows.value=H.state.directionalShadow,Nt.spotLights.value=H.state.spot,Nt.spotLightShadows.value=H.state.spotShadow,Nt.rectAreaLights.value=H.state.rectArea,Nt.ltc_1.value=H.state.rectAreaLTC1,Nt.ltc_2.value=H.state.rectAreaLTC2,Nt.pointLights.value=H.state.point,Nt.pointLightShadows.value=H.state.pointShadow,Nt.hemisphereLights.value=H.state.hemi,Nt.directionalShadowMap.value=H.state.directionalShadowMap,Nt.directionalShadowMatrix.value=H.state.directionalShadowMatrix,Nt.spotShadowMap.value=H.state.spotShadowMap,Nt.spotLightMatrix.value=H.state.spotLightMatrix,Nt.spotLightMap.value=H.state.spotLightMap,Nt.pointShadowMap.value=H.state.pointShadowMap,Nt.pointShadowMatrix.value=H.state.pointShadowMatrix),Q.currentProgram=Wt,Q.uniformsList=null,Wt}function oa(T){if(T.uniformsList===null){const G=T.currentProgram.getUniforms();T.uniformsList=Hs.seqWithValue(G.seq,T.uniforms)}return T.uniformsList}function aa(T,G){const j=wt.get(T);j.outputColorSpace=G.outputColorSpace,j.batching=G.batching,j.batchingColor=G.batchingColor,j.instancing=G.instancing,j.instancingColor=G.instancingColor,j.instancingMorph=G.instancingMorph,j.skinning=G.skinning,j.morphTargets=G.morphTargets,j.morphNormals=G.morphNormals,j.morphColors=G.morphColors,j.morphTargetsCount=G.morphTargetsCount,j.numClippingPlanes=G.numClippingPlanes,j.numIntersection=G.numClipIntersection,j.vertexAlphas=G.vertexAlphas,j.vertexTangents=G.vertexTangents,j.toneMapping=G.toneMapping}function Sl(T,G,j,Q,H){G.isScene!==!0&&(G=Gt),R.resetTextureUnits();const mt=G.fog,Et=Q.isMeshStandardMaterial?G.environment:null,It=P===null?_.outputColorSpace:P.isXRRenderTarget===!0?P.texture.colorSpace:Ri,Ut=(Q.isMeshStandardMaterial?w:b).get(Q.envMap||Et),Vt=Q.vertexColors===!0&&!!j.attributes.color&&j.attributes.color.itemSize===4,Wt=!!j.attributes.tangent&&(!!Q.normalMap||Q.anisotropy>0),Nt=!!j.morphAttributes.position,Qt=!!j.morphAttributes.normal,ce=!!j.morphAttributes.color;let le=xn;Q.toneMapped&&(P===null||P.isXRRenderTarget===!0)&&(le=_.toneMapping);const De=j.morphAttributes.position||j.morphAttributes.normal||j.morphAttributes.color,te=De!==void 0?De.length:0,Ft=wt.get(Q),hn=p.state.lights;if(I===!0&&(Z===!0||T!==x)){const Ve=T===x&&Q.id===M;nt.setState(Q,T,Ve)}let ee=!1;Q.version===Ft.__version?(Ft.needsLights&&Ft.lightsStateVersion!==hn.state.version||Ft.outputColorSpace!==It||H.isBatchedMesh&&Ft.batching===!1||!H.isBatchedMesh&&Ft.batching===!0||H.isBatchedMesh&&Ft.batchingColor===!0&&H.colorTexture===null||H.isBatchedMesh&&Ft.batchingColor===!1&&H.colorTexture!==null||H.isInstancedMesh&&Ft.instancing===!1||!H.isInstancedMesh&&Ft.instancing===!0||H.isSkinnedMesh&&Ft.skinning===!1||!H.isSkinnedMesh&&Ft.skinning===!0||H.isInstancedMesh&&Ft.instancingColor===!0&&H.instanceColor===null||H.isInstancedMesh&&Ft.instancingColor===!1&&H.instanceColor!==null||H.isInstancedMesh&&Ft.instancingMorph===!0&&H.morphTexture===null||H.isInstancedMesh&&Ft.instancingMorph===!1&&H.morphTexture!==null||Ft.envMap!==Ut||Q.fog===!0&&Ft.fog!==mt||Ft.numClippingPlanes!==void 0&&(Ft.numClippingPlanes!==nt.numPlanes||Ft.numIntersection!==nt.numIntersection)||Ft.vertexAlphas!==Vt||Ft.vertexTangents!==Wt||Ft.morphTargets!==Nt||Ft.morphNormals!==Qt||Ft.morphColors!==ce||Ft.toneMapping!==le||Ft.morphTargetsCount!==te)&&(ee=!0):(ee=!0,Ft.__version=Q.version);let Xe=Ft.currentProgram;ee===!0&&(Xe=ls(Q,G,H));let jn=!1,Ne=!1,Ni=!1;const he=Xe.getUniforms(),tn=Ft.uniforms;if(gt.useProgram(Xe.program)&&(jn=!0,Ne=!0,Ni=!0),Q.id!==M&&(M=Q.id,Ne=!0),jn||x!==T){gt.buffers.depth.getReversed()?(W.copy(T.projectionMatrix),Ph(W),Lh(W),he.setValue(L,"projectionMatrix",W)):he.setValue(L,"projectionMatrix",T.projectionMatrix),he.setValue(L,"viewMatrix",T.matrixWorldInverse);const Sn=he.map.cameraPosition;Sn!==void 0&&Sn.setValue(L,xt.setFromMatrixPosition(T.matrixWorld)),Tt.logarithmicDepthBuffer&&he.setValue(L,"logDepthBufFC",2/(Math.log(T.far+1)/Math.LN2)),(Q.isMeshPhongMaterial||Q.isMeshToonMaterial||Q.isMeshLambertMaterial||Q.isMeshBasicMaterial||Q.isMeshStandardMaterial||Q.isShaderMaterial)&&he.setValue(L,"isOrthographic",T.isOrthographicCamera===!0),x!==T&&(x=T,Ne=!0,Ni=!0)}if(H.isSkinnedMesh){he.setOptional(L,H,"bindMatrix"),he.setOptional(L,H,"bindMatrixInverse");const Ve=H.skeleton;Ve&&(Ve.boneTexture===null&&Ve.computeBoneTexture(),he.setValue(L,"boneTexture",Ve.boneTexture,R))}H.isBatchedMesh&&(he.setOptional(L,H,"batchingTexture"),he.setValue(L,"batchingTexture",H._matricesTexture,R),he.setOptional(L,H,"batchingIdTexture"),he.setValue(L,"batchingIdTexture",H._indirectTexture,R),he.setOptional(L,H,"batchingColorTexture"),H._colorsTexture!==null&&he.setValue(L,"batchingColorTexture",H._colorsTexture,R));const Fi=j.morphAttributes;if((Fi.position!==void 0||Fi.normal!==void 0||Fi.color!==void 0)&&At.update(H,j,Xe),(Ne||Ft.receiveShadow!==H.receiveShadow)&&(Ft.receiveShadow=H.receiveShadow,he.setValue(L,"receiveShadow",H.receiveShadow)),Q.isMeshGouraudMaterial&&Q.envMap!==null&&(tn.envMap.value=Ut,tn.flipEnvMap.value=Ut.isCubeTexture&&Ut.isRenderTargetTexture===!1?-1:1),Q.isMeshStandardMaterial&&Q.envMap===null&&G.environment!==null&&(tn.envMapIntensity.value=G.environmentIntensity),Ne&&(he.setValue(L,"toneMappingExposure",_.toneMappingExposure),Ft.needsLights&&yl(tn,Ni),mt&&Q.fog===!0&&it.refreshFogUniforms(tn,mt),it.refreshMaterialUniforms(tn,Q,K,tt,p.state.transmissionRenderTarget[T.id]),Hs.upload(L,oa(Ft),tn,R)),Q.isShaderMaterial&&Q.uniformsNeedUpdate===!0&&(Hs.upload(L,oa(Ft),tn,R),Q.uniformsNeedUpdate=!1),Q.isSpriteMaterial&&he.setValue(L,"center",H.center),he.setValue(L,"modelViewMatrix",H.modelViewMatrix),he.setValue(L,"normalMatrix",H.normalMatrix),he.setValue(L,"modelMatrix",H.matrixWorld),Q.isShaderMaterial||Q.isRawShaderMaterial){const Ve=Q.uniformsGroups;for(let Sn=0,yn=Ve.length;Sn<yn;Sn++){const ca=Ve[Sn];z.update(ca,Xe),z.bind(ca,Xe)}}return Xe}function yl(T,G){T.ambientLightColor.needsUpdate=G,T.lightProbe.needsUpdate=G,T.directionalLights.needsUpdate=G,T.directionalLightShadows.needsUpdate=G,T.pointLights.needsUpdate=G,T.pointLightShadows.needsUpdate=G,T.spotLights.needsUpdate=G,T.spotLightShadows.needsUpdate=G,T.rectAreaLights.needsUpdate=G,T.hemisphereLights.needsUpdate=G}function El(T){return T.isMeshLambertMaterial||T.isMeshToonMaterial||T.isMeshPhongMaterial||T.isMeshStandardMaterial||T.isShadowMaterial||T.isShaderMaterial&&T.lights===!0}this.getActiveCubeFace=function(){return S},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return P},this.setRenderTargetTextures=function(T,G,j){wt.get(T.texture).__webglTexture=G,wt.get(T.depthTexture).__webglTexture=j;const Q=wt.get(T);Q.__hasExternalTextures=!0,Q.__autoAllocateDepthBuffer=j===void 0,Q.__autoAllocateDepthBuffer||lt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),Q.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(T,G){const j=wt.get(T);j.__webglFramebuffer=G,j.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(T,G=0,j=0){P=T,S=G,A=j;let Q=!0,H=null,mt=!1,Et=!1;if(T){const Ut=wt.get(T);if(Ut.__useDefaultFramebuffer!==void 0)gt.bindFramebuffer(L.FRAMEBUFFER,null),Q=!1;else if(Ut.__webglFramebuffer===void 0)R.setupRenderTarget(T);else if(Ut.__hasExternalTextures)R.rebindTextures(T,wt.get(T.texture).__webglTexture,wt.get(T.depthTexture).__webglTexture);else if(T.depthBuffer){const Nt=T.depthTexture;if(Ut.__boundDepthTexture!==Nt){if(Nt!==null&&wt.has(Nt)&&(T.width!==Nt.image.width||T.height!==Nt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");R.setupDepthRenderbuffer(T)}}const Vt=T.texture;(Vt.isData3DTexture||Vt.isDataArrayTexture||Vt.isCompressedArrayTexture)&&(Et=!0);const Wt=wt.get(T).__webglFramebuffer;T.isWebGLCubeRenderTarget?(Array.isArray(Wt[G])?H=Wt[G][j]:H=Wt[G],mt=!0):T.samples>0&&R.useMultisampledRTT(T)===!1?H=wt.get(T).__webglMultisampledFramebuffer:Array.isArray(Wt)?H=Wt[j]:H=Wt,C.copy(T.viewport),k.copy(T.scissor),V=T.scissorTest}else C.copy(_t).multiplyScalar(K).floor(),k.copy(Dt).multiplyScalar(K).floor(),V=q;if(gt.bindFramebuffer(L.FRAMEBUFFER,H)&&Q&&gt.drawBuffers(T,H),gt.viewport(C),gt.scissor(k),gt.setScissorTest(V),mt){const Ut=wt.get(T.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+G,Ut.__webglTexture,j)}else if(Et){const Ut=wt.get(T.texture),Vt=G||0;L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,Ut.__webglTexture,j||0,Vt)}M=-1},this.readRenderTargetPixels=function(T,G,j,Q,H,mt,Et){if(!(T&&T.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let It=wt.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&Et!==void 0&&(It=It[Et]),It){gt.bindFramebuffer(L.FRAMEBUFFER,It);try{const Ut=T.texture,Vt=Ut.format,Wt=Ut.type;if(!Tt.textureFormatReadable(Vt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Tt.textureTypeReadable(Wt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}G>=0&&G<=T.width-Q&&j>=0&&j<=T.height-H&&L.readPixels(G,j,Q,H,zt.convert(Vt),zt.convert(Wt),mt)}finally{const Ut=P!==null?wt.get(P).__webglFramebuffer:null;gt.bindFramebuffer(L.FRAMEBUFFER,Ut)}}},this.readRenderTargetPixelsAsync=async function(T,G,j,Q,H,mt,Et){if(!(T&&T.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let It=wt.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&Et!==void 0&&(It=It[Et]),It){const Ut=T.texture,Vt=Ut.format,Wt=Ut.type;if(!Tt.textureFormatReadable(Vt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Tt.textureTypeReadable(Wt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(G>=0&&G<=T.width-Q&&j>=0&&j<=T.height-H){gt.bindFramebuffer(L.FRAMEBUFFER,It);const Nt=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,Nt),L.bufferData(L.PIXEL_PACK_BUFFER,mt.byteLength,L.STREAM_READ),L.readPixels(G,j,Q,H,zt.convert(Vt),zt.convert(Wt),0);const Qt=P!==null?wt.get(P).__webglFramebuffer:null;gt.bindFramebuffer(L.FRAMEBUFFER,Qt);const ce=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await Rh(L,ce,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,Nt),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,mt),L.deleteBuffer(Nt),L.deleteSync(ce),mt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(T,G=null,j=0){T.isTexture!==!0&&(qi("WebGLRenderer: copyFramebufferToTexture function signature has changed."),G=arguments[0]||null,T=arguments[1]);const Q=Math.pow(2,-j),H=Math.floor(T.image.width*Q),mt=Math.floor(T.image.height*Q),Et=G!==null?G.x:0,It=G!==null?G.y:0;R.setTexture2D(T,0),L.copyTexSubImage2D(L.TEXTURE_2D,j,0,0,Et,It,H,mt),gt.unbindTexture()},this.copyTextureToTexture=function(T,G,j=null,Q=null,H=0){T.isTexture!==!0&&(qi("WebGLRenderer: copyTextureToTexture function signature has changed."),Q=arguments[0]||null,T=arguments[1],G=arguments[2],H=arguments[3]||0,j=null);let mt,Et,It,Ut,Vt,Wt,Nt,Qt,ce;const le=T.isCompressedTexture?T.mipmaps[H]:T.image;j!==null?(mt=j.max.x-j.min.x,Et=j.max.y-j.min.y,It=j.isBox3?j.max.z-j.min.z:1,Ut=j.min.x,Vt=j.min.y,Wt=j.isBox3?j.min.z:0):(mt=le.width,Et=le.height,It=le.depth||1,Ut=0,Vt=0,Wt=0),Q!==null?(Nt=Q.x,Qt=Q.y,ce=Q.z):(Nt=0,Qt=0,ce=0);const De=zt.convert(G.format),te=zt.convert(G.type);let Ft;G.isData3DTexture?(R.setTexture3D(G,0),Ft=L.TEXTURE_3D):G.isDataArrayTexture||G.isCompressedArrayTexture?(R.setTexture2DArray(G,0),Ft=L.TEXTURE_2D_ARRAY):(R.setTexture2D(G,0),Ft=L.TEXTURE_2D),L.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,G.flipY),L.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,G.premultiplyAlpha),L.pixelStorei(L.UNPACK_ALIGNMENT,G.unpackAlignment);const hn=L.getParameter(L.UNPACK_ROW_LENGTH),ee=L.getParameter(L.UNPACK_IMAGE_HEIGHT),Xe=L.getParameter(L.UNPACK_SKIP_PIXELS),jn=L.getParameter(L.UNPACK_SKIP_ROWS),Ne=L.getParameter(L.UNPACK_SKIP_IMAGES);L.pixelStorei(L.UNPACK_ROW_LENGTH,le.width),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,le.height),L.pixelStorei(L.UNPACK_SKIP_PIXELS,Ut),L.pixelStorei(L.UNPACK_SKIP_ROWS,Vt),L.pixelStorei(L.UNPACK_SKIP_IMAGES,Wt);const Ni=T.isDataArrayTexture||T.isData3DTexture,he=G.isDataArrayTexture||G.isData3DTexture;if(T.isRenderTargetTexture||T.isDepthTexture){const tn=wt.get(T),Fi=wt.get(G),Ve=wt.get(tn.__renderTarget),Sn=wt.get(Fi.__renderTarget);gt.bindFramebuffer(L.READ_FRAMEBUFFER,Ve.__webglFramebuffer),gt.bindFramebuffer(L.DRAW_FRAMEBUFFER,Sn.__webglFramebuffer);for(let yn=0;yn<It;yn++)Ni&&L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,wt.get(T).__webglTexture,H,Wt+yn),T.isDepthTexture?(he&&L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,wt.get(G).__webglTexture,H,ce+yn),L.blitFramebuffer(Ut,Vt,mt,Et,Nt,Qt,mt,Et,L.DEPTH_BUFFER_BIT,L.NEAREST)):he?L.copyTexSubImage3D(Ft,H,Nt,Qt,ce+yn,Ut,Vt,mt,Et):L.copyTexSubImage2D(Ft,H,Nt,Qt,ce+yn,Ut,Vt,mt,Et);gt.bindFramebuffer(L.READ_FRAMEBUFFER,null),gt.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else he?T.isDataTexture||T.isData3DTexture?L.texSubImage3D(Ft,H,Nt,Qt,ce,mt,Et,It,De,te,le.data):G.isCompressedArrayTexture?L.compressedTexSubImage3D(Ft,H,Nt,Qt,ce,mt,Et,It,De,le.data):L.texSubImage3D(Ft,H,Nt,Qt,ce,mt,Et,It,De,te,le):T.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,H,Nt,Qt,mt,Et,De,te,le.data):T.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,H,Nt,Qt,le.width,le.height,De,le.data):L.texSubImage2D(L.TEXTURE_2D,H,Nt,Qt,mt,Et,De,te,le);L.pixelStorei(L.UNPACK_ROW_LENGTH,hn),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,ee),L.pixelStorei(L.UNPACK_SKIP_PIXELS,Xe),L.pixelStorei(L.UNPACK_SKIP_ROWS,jn),L.pixelStorei(L.UNPACK_SKIP_IMAGES,Ne),H===0&&G.generateMipmaps&&L.generateMipmap(Ft),gt.unbindTexture()},this.copyTextureToTexture3D=function(T,G,j=null,Q=null,H=0){return T.isTexture!==!0&&(qi("WebGLRenderer: copyTextureToTexture3D function signature has changed."),j=arguments[0]||null,Q=arguments[1]||null,T=arguments[2],G=arguments[3],H=arguments[4]||0),qi('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(T,G,j,Q,H)},this.initRenderTarget=function(T){wt.get(T).__webglFramebuffer===void 0&&R.setupRenderTarget(T)},this.initTexture=function(T){T.isCubeTexture?R.setTextureCube(T,0):T.isData3DTexture?R.setTexture3D(T,0):T.isDataArrayTexture||T.isCompressedArrayTexture?R.setTexture2DArray(T,0):R.setTexture2D(T,0),gt.unbindTexture()},this.resetState=function(){S=0,A=0,P=null,gt.reset(),Jt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return _n}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorspace=jt._getDrawingBufferColorSpace(t),e.unpackColorSpace=jt._getUnpackColorSpace()}}class qo{constructor(t,e=25e-5){this.isFogExp2=!0,this.name="",this.color=new pt(t),this.density=e}clone(){return new qo(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class Zo extends de{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new an,this.environmentIntensity=1,this.environmentRotation=new an,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class ll extends Te{constructor(t=null,e=1,n=1,s,r,o,a,c,l=ke,h=ke,u,f){super(null,o,a,c,l,h,s,r,u,f),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class oc extends Pe{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const di=new ae,ac=new ae,Ls=[],cc=new Jn,Gm=new ae,Gi=new kt,Hi=new Di;class Ws extends kt{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new oc(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Gm)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Jn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,di),cc.copy(t.boundingBox).applyMatrix4(di),this.boundingBox.union(cc)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Di),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,di),Hi.copy(t.boundingSphere).applyMatrix4(di),this.boundingSphere.union(Hi)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=t*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(t,e){const n=this.matrixWorld,s=this.count;if(Gi.geometry=this.geometry,Gi.material=this.material,Gi.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Hi.copy(this.boundingSphere),Hi.applyMatrix4(n),t.ray.intersectsSphere(Hi)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,di),ac.multiplyMatrices(n,di),Gi.matrixWorld=ac,Gi.raycast(t,Ls);for(let o=0,a=Ls.length;o<a;o++){const c=Ls[o];c.instanceId=r,c.object=this,e.push(c)}Ls.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new oc(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new ll(new Float32Array(s*this.count),s,this.count,ko,rn));const r=this.morphTexture.source.data.data;let o=0;for(let l=0;l<n.length;l++)o+=n[l];const a=this.geometry.morphTargetsRelative?1:1-o,c=s*t;r[c]=a,r.set(n,c+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class Hm extends Ii{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new pt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const lc=new ae,Ro=new Kc,Ds=new Di,Is=new U;class Wm extends de{constructor(t=new xe,e=new Hm){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ds.copy(n.boundingSphere),Ds.applyMatrix4(s),Ds.radius+=r,t.ray.intersectsSphere(Ds)===!1)return;lc.copy(s).invert(),Ro.copy(t.ray).applyMatrix4(lc);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=n.index,u=n.attributes.position;if(l!==null){const f=Math.max(0,o.start),d=Math.min(l.count,o.start+o.count);for(let g=f,v=d;g<v;g++){const m=l.getX(g);Is.fromBufferAttribute(u,m),hc(Is,m,c,s,t,e,this)}}else{const f=Math.max(0,o.start),d=Math.min(u.count,o.start+o.count);for(let g=f,v=d;g<v;g++)Is.fromBufferAttribute(u,g),hc(Is,g,c,s,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function hc(i,t,e,n,s,r,o){const a=Ro.distanceSqToPoint(i);if(a<e){const c=new U;Ro.closestPointToPoint(i,c),c.applyMatrix4(n);const l=s.ray.origin.distanceTo(c);if(l<s.near||l>s.far)return;r.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}class hl extends Te{constructor(t,e,n,s,r,o,a,c,l){super(t,e,n,s,r,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class cn{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,s=this.getPoint(0),r=0;e.push(0);for(let o=1;o<=t;o++)n=this.getPoint(o/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const n=this.getLengths();let s=0;const r=n.length;let o;e?o=e:o=t*n[r-1];let a=0,c=r-1,l;for(;a<=c;)if(s=Math.floor(a+(c-a)/2),l=n[s]-o,l<0)a=s+1;else if(l>0)c=s-1;else{c=s;break}if(s=c,n[s]===o)return s/(r-1);const h=n[s],f=n[s+1]-h,d=(o-h)/f;return(s+d)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);const o=this.getPoint(s),a=this.getPoint(r),c=e||(o.isVector2?new ct:new U);return c.copy(a).sub(o).normalize(),c}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){const n=new U,s=[],r=[],o=[],a=new U,c=new ae;for(let d=0;d<=t;d++){const g=d/t;s[d]=this.getTangentAt(g,new U)}r[0]=new U,o[0]=new U;let l=Number.MAX_VALUE;const h=Math.abs(s[0].x),u=Math.abs(s[0].y),f=Math.abs(s[0].z);h<=l&&(l=h,n.set(1,0,0)),u<=l&&(l=u,n.set(0,1,0)),f<=l&&n.set(0,0,1),a.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let d=1;d<=t;d++){if(r[d]=r[d-1].clone(),o[d]=o[d-1].clone(),a.crossVectors(s[d-1],s[d]),a.length()>Number.EPSILON){a.normalize();const g=Math.acos(ve(s[d-1].dot(s[d]),-1,1));r[d].applyMatrix4(c.makeRotationAxis(a,g))}o[d].crossVectors(s[d],r[d])}if(e===!0){let d=Math.acos(ve(r[0].dot(r[t]),-1,1));d/=t,s[0].dot(a.crossVectors(r[0],r[t]))>0&&(d=-d);for(let g=1;g<=t;g++)r[g].applyMatrix4(c.makeRotationAxis(s[g],d*g)),o[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class Ko extends cn{constructor(t=0,e=0,n=1,s=1,r=0,o=Math.PI*2,a=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=c}getPoint(t,e=new ct){const n=e,s=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);const a=this.aStartAngle+t*r;let c=this.aX+this.xRadius*Math.cos(a),l=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){const h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),f=c-this.aX,d=l-this.aY;c=f*h-d*u+this.aX,l=f*u+d*h+this.aY}return n.set(c,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class Xm extends Ko{constructor(t,e,n,s,r,o){super(t,e,n,n,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}}function Jo(){let i=0,t=0,e=0,n=0;function s(r,o,a,c){i=r,t=a,e=-3*r+3*o-2*a-c,n=2*r-2*o+a+c}return{initCatmullRom:function(r,o,a,c,l){s(o,a,l*(a-r),l*(c-o))},initNonuniformCatmullRom:function(r,o,a,c,l,h,u){let f=(o-r)/l-(a-r)/(l+h)+(a-o)/h,d=(a-o)/h-(c-o)/(h+u)+(c-a)/u;f*=h,d*=h,s(o,a,f,d)},calc:function(r){const o=r*r,a=o*r;return i+t*r+e*o+n*a}}}const Us=new U,Ur=new Jo,Nr=new Jo,Fr=new Jo;class Ym extends cn{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new U){const n=e,s=this.points,r=s.length,o=(r-(this.closed?0:1))*t;let a=Math.floor(o),c=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:c===0&&a===r-1&&(a=r-2,c=1);let l,h;this.closed||a>0?l=s[(a-1)%r]:(Us.subVectors(s[0],s[1]).add(s[0]),l=Us);const u=s[a%r],f=s[(a+1)%r];if(this.closed||a+2<r?h=s[(a+2)%r]:(Us.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Us),this.curveType==="centripetal"||this.curveType==="chordal"){const d=this.curveType==="chordal"?.5:.25;let g=Math.pow(l.distanceToSquared(u),d),v=Math.pow(u.distanceToSquared(f),d),m=Math.pow(f.distanceToSquared(h),d);v<1e-4&&(v=1),g<1e-4&&(g=v),m<1e-4&&(m=v),Ur.initNonuniformCatmullRom(l.x,u.x,f.x,h.x,g,v,m),Nr.initNonuniformCatmullRom(l.y,u.y,f.y,h.y,g,v,m),Fr.initNonuniformCatmullRom(l.z,u.z,f.z,h.z,g,v,m)}else this.curveType==="catmullrom"&&(Ur.initCatmullRom(l.x,u.x,f.x,h.x,this.tension),Nr.initCatmullRom(l.y,u.y,f.y,h.y,this.tension),Fr.initCatmullRom(l.z,u.z,f.z,h.z,this.tension));return n.set(Ur.calc(c),Nr.calc(c),Fr.calc(c)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new U().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function uc(i,t,e,n,s){const r=(n-t)*.5,o=(s-e)*.5,a=i*i,c=i*a;return(2*e-2*n+r+o)*c+(-3*e+3*n-2*r-o)*a+r*i+e}function qm(i,t){const e=1-i;return e*e*t}function Zm(i,t){return 2*(1-i)*i*t}function Km(i,t){return i*i*t}function Ki(i,t,e,n){return qm(i,t)+Zm(i,e)+Km(i,n)}function Jm(i,t){const e=1-i;return e*e*e*t}function $m(i,t){const e=1-i;return 3*e*e*i*t}function jm(i,t){return 3*(1-i)*i*i*t}function Qm(i,t){return i*i*i*t}function Ji(i,t,e,n,s){return Jm(i,t)+$m(i,e)+jm(i,n)+Qm(i,s)}class ul extends cn{constructor(t=new ct,e=new ct,n=new ct,s=new ct){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new ct){const n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Ji(t,s.x,r.x,o.x,a.x),Ji(t,s.y,r.y,o.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class t0 extends cn{constructor(t=new U,e=new U,n=new U,s=new U){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new U){const n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Ji(t,s.x,r.x,o.x,a.x),Ji(t,s.y,r.y,o.y,a.y),Ji(t,s.z,r.z,o.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class fl extends cn{constructor(t=new ct,e=new ct){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new ct){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new ct){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class e0 extends cn{constructor(t=new U,e=new U){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new U){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new U){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class dl extends cn{constructor(t=new ct,e=new ct,n=new ct){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new ct){const n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(Ki(t,s.x,r.x,o.x),Ki(t,s.y,r.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class n0 extends cn{constructor(t=new U,e=new U,n=new U){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new U){const n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(Ki(t,s.x,r.x,o.x),Ki(t,s.y,r.y,o.y),Ki(t,s.z,r.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class pl extends cn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new ct){const n=e,s=this.points,r=(s.length-1)*t,o=Math.floor(r),a=r-o,c=s[o===0?o:o-1],l=s[o],h=s[o>s.length-2?s.length-1:o+1],u=s[o>s.length-3?s.length-1:o+2];return n.set(uc(a,c.x,l.x,h.x,u.x),uc(a,c.y,l.y,h.y,u.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new ct().fromArray(s))}return this}}var Po=Object.freeze({__proto__:null,ArcCurve:Xm,CatmullRomCurve3:Ym,CubicBezierCurve:ul,CubicBezierCurve3:t0,EllipseCurve:Ko,LineCurve:fl,LineCurve3:e0,QuadraticBezierCurve:dl,QuadraticBezierCurve3:n0,SplineCurve:pl});class i0 extends cn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Po[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),s=this.getCurveLengths();let r=0;for(;r<s.length;){if(s[r]>=n){const o=s[r]-n,a=this.curves[r],c=a.getLength(),l=c===0?0:1-o/c;return a.getPointAt(l,e)}r++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,s=this.curves.length;n<s;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let s=0,r=this.curves;s<r.length;s++){const o=r[s],a=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,c=o.getPoints(a);for(let l=0;l<c.length;l++){const h=c[l];n&&n.equals(h)||(e.push(h),n=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(new Po[s.type]().fromJSON(s))}return this}}class Lo extends i0{constructor(t){super(),this.type="Path",this.currentPoint=new ct,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new fl(this.currentPoint.clone(),new ct(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,s){const r=new dl(this.currentPoint.clone(),new ct(t,e),new ct(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(t,e,n,s,r,o){const a=new ul(this.currentPoint.clone(),new ct(t,e),new ct(n,s),new ct(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new pl(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,s,r,o){const a=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(t+a,e+c,n,s,r,o),this}absarc(t,e,n,s,r,o){return this.absellipse(t,e,n,n,s,r,o),this}ellipse(t,e,n,s,r,o,a,c){const l=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+l,e+h,n,s,r,o,a,c),this}absellipse(t,e,n,s,r,o,a,c){const l=new Ko(t,e,n,s,r,o,a,c);if(this.curves.length>0){const u=l.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(l);const h=l.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class ts extends xe{constructor(t=[new ct(0,-.5),new ct(.5,0),new ct(0,.5)],e=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:s},e=Math.floor(e),s=ve(s,0,Math.PI*2);const r=[],o=[],a=[],c=[],l=[],h=1/e,u=new U,f=new ct,d=new U,g=new U,v=new U;let m=0,p=0;for(let y=0;y<=t.length-1;y++)switch(y){case 0:m=t[y+1].x-t[y].x,p=t[y+1].y-t[y].y,d.x=p*1,d.y=-m,d.z=p*0,v.copy(d),d.normalize(),c.push(d.x,d.y,d.z);break;case t.length-1:c.push(v.x,v.y,v.z);break;default:m=t[y+1].x-t[y].x,p=t[y+1].y-t[y].y,d.x=p*1,d.y=-m,d.z=p*0,g.copy(d),d.x+=v.x,d.y+=v.y,d.z+=v.z,d.normalize(),c.push(d.x,d.y,d.z),v.copy(g)}for(let y=0;y<=e;y++){const E=n+y*h*s,_=Math.sin(E),D=Math.cos(E);for(let S=0;S<=t.length-1;S++){u.x=t[S].x*_,u.y=t[S].y,u.z=t[S].x*D,o.push(u.x,u.y,u.z),f.x=y/e,f.y=S/(t.length-1),a.push(f.x,f.y);const A=c[3*S+0]*_,P=c[3*S+1],M=c[3*S+0]*D;l.push(A,P,M)}}for(let y=0;y<e;y++)for(let E=0;E<t.length-1;E++){const _=E+y*t.length,D=_,S=_+t.length,A=_+t.length+1,P=_+1;r.push(D,S,P),r.push(A,P,S)}this.setIndex(r),this.setAttribute("position",new Zt(o,3)),this.setAttribute("uv",new Zt(a,2)),this.setAttribute("normal",new Zt(l,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ts(t.points,t.segments,t.phiStart,t.phiLength)}}class Xn extends ts{constructor(t=1,e=1,n=4,s=8){const r=new Lo;r.absarc(0,-e/2,t,Math.PI*1.5,0),r.absarc(0,e/2,t,0,Math.PI*.5),super(r.getPoints(n),s),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:n,radialSegments:s}}static fromJSON(t){return new Xn(t.radius,t.length,t.capSegments,t.radialSegments)}}class js extends xe{constructor(t=1,e=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:s},e=Math.max(3,e);const r=[],o=[],a=[],c=[],l=new U,h=new ct;o.push(0,0,0),a.push(0,0,1),c.push(.5,.5);for(let u=0,f=3;u<=e;u++,f+=3){const d=n+u/e*s;l.x=t*Math.cos(d),l.y=t*Math.sin(d),o.push(l.x,l.y,l.z),a.push(0,0,1),h.x=(o[f]/t+1)/2,h.y=(o[f+1]/t+1)/2,c.push(h.x,h.y)}for(let u=1;u<=e;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new Zt(o,3)),this.setAttribute("normal",new Zt(a,3)),this.setAttribute("uv",new Zt(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new js(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class Ai extends xe{constructor(t=1,e=1,n=1,s=32,r=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:c};const l=this;s=Math.floor(s),r=Math.floor(r);const h=[],u=[],f=[],d=[];let g=0;const v=[],m=n/2;let p=0;y(),o===!1&&(t>0&&E(!0),e>0&&E(!1)),this.setIndex(h),this.setAttribute("position",new Zt(u,3)),this.setAttribute("normal",new Zt(f,3)),this.setAttribute("uv",new Zt(d,2));function y(){const _=new U,D=new U;let S=0;const A=(e-t)/n;for(let P=0;P<=r;P++){const M=[],x=P/r,C=x*(e-t)+t;for(let k=0;k<=s;k++){const V=k/s,X=V*c+a,J=Math.sin(X),Y=Math.cos(X);D.x=C*J,D.y=-x*n+m,D.z=C*Y,u.push(D.x,D.y,D.z),_.set(J,A,Y).normalize(),f.push(_.x,_.y,_.z),d.push(V,1-x),M.push(g++)}v.push(M)}for(let P=0;P<s;P++)for(let M=0;M<r;M++){const x=v[M][P],C=v[M+1][P],k=v[M+1][P+1],V=v[M][P+1];(t>0||M!==0)&&(h.push(x,C,V),S+=3),(e>0||M!==r-1)&&(h.push(C,k,V),S+=3)}l.addGroup(p,S,0),p+=S}function E(_){const D=g,S=new ct,A=new U;let P=0;const M=_===!0?t:e,x=_===!0?1:-1;for(let k=1;k<=s;k++)u.push(0,m*x,0),f.push(0,x,0),d.push(.5,.5),g++;const C=g;for(let k=0;k<=s;k++){const X=k/s*c+a,J=Math.cos(X),Y=Math.sin(X);A.x=M*Y,A.y=m*x,A.z=M*J,u.push(A.x,A.y,A.z),f.push(0,x,0),S.x=J*.5+.5,S.y=Y*.5*x+.5,d.push(S.x,S.y),g++}for(let k=0;k<s;k++){const V=D+k,X=C+k;_===!0?h.push(X,X+1,V):h.push(X+1,X,V),P+=3}l.addGroup(p,P,_===!0?1:2),p+=P}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ai(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class $o extends xe{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};const r=[],o=[];a(s),l(n),h(),this.setAttribute("position",new Zt(r,3)),this.setAttribute("normal",new Zt(r.slice(),3)),this.setAttribute("uv",new Zt(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(y){const E=new U,_=new U,D=new U;for(let S=0;S<e.length;S+=3)d(e[S+0],E),d(e[S+1],_),d(e[S+2],D),c(E,_,D,y)}function c(y,E,_,D){const S=D+1,A=[];for(let P=0;P<=S;P++){A[P]=[];const M=y.clone().lerp(_,P/S),x=E.clone().lerp(_,P/S),C=S-P;for(let k=0;k<=C;k++)k===0&&P===S?A[P][k]=M:A[P][k]=M.clone().lerp(x,k/C)}for(let P=0;P<S;P++)for(let M=0;M<2*(S-P)-1;M++){const x=Math.floor(M/2);M%2===0?(f(A[P][x+1]),f(A[P+1][x]),f(A[P][x])):(f(A[P][x+1]),f(A[P+1][x+1]),f(A[P+1][x]))}}function l(y){const E=new U;for(let _=0;_<r.length;_+=3)E.x=r[_+0],E.y=r[_+1],E.z=r[_+2],E.normalize().multiplyScalar(y),r[_+0]=E.x,r[_+1]=E.y,r[_+2]=E.z}function h(){const y=new U;for(let E=0;E<r.length;E+=3){y.x=r[E+0],y.y=r[E+1],y.z=r[E+2];const _=m(y)/2/Math.PI+.5,D=p(y)/Math.PI+.5;o.push(_,1-D)}g(),u()}function u(){for(let y=0;y<o.length;y+=6){const E=o[y+0],_=o[y+2],D=o[y+4],S=Math.max(E,_,D),A=Math.min(E,_,D);S>.9&&A<.1&&(E<.2&&(o[y+0]+=1),_<.2&&(o[y+2]+=1),D<.2&&(o[y+4]+=1))}}function f(y){r.push(y.x,y.y,y.z)}function d(y,E){const _=y*3;E.x=t[_+0],E.y=t[_+1],E.z=t[_+2]}function g(){const y=new U,E=new U,_=new U,D=new U,S=new ct,A=new ct,P=new ct;for(let M=0,x=0;M<r.length;M+=9,x+=6){y.set(r[M+0],r[M+1],r[M+2]),E.set(r[M+3],r[M+4],r[M+5]),_.set(r[M+6],r[M+7],r[M+8]),S.set(o[x+0],o[x+1]),A.set(o[x+2],o[x+3]),P.set(o[x+4],o[x+5]),D.copy(y).add(E).add(_).divideScalar(3);const C=m(D);v(S,x+0,y,C),v(A,x+2,E,C),v(P,x+4,_,C)}}function v(y,E,_,D){D<0&&y.x===1&&(o[E]=y.x-1),_.x===0&&_.z===0&&(o[E]=D/2/Math.PI+.5)}function m(y){return Math.atan2(y.z,-y.x)}function p(y){return Math.atan2(-y.y,Math.sqrt(y.x*y.x+y.z*y.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new $o(t.vertices,t.indices,t.radius,t.details)}}class ml extends Lo{constructor(t){super(t),this.uuid=Li(),this.type="Shape",this.holes=[]}getPointsHoles(t){const e=[];for(let n=0,s=this.holes.length;n<s;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){const s=this.holes[e];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(new Lo().fromJSON(s))}return this}}const s0={triangulate:function(i,t,e=2){const n=t&&t.length,s=n?t[0]*e:i.length;let r=gl(i,0,s,e,!0);const o=[];if(!r||r.next===r.prev)return o;let a,c,l,h,u,f,d;if(n&&(r=l0(i,t,r,e)),i.length>80*e){a=l=i[0],c=h=i[1];for(let g=e;g<s;g+=e)u=i[g],f=i[g+1],u<a&&(a=u),f<c&&(c=f),u>l&&(l=u),f>h&&(h=f);d=Math.max(l-a,h-c),d=d!==0?32767/d:0}return es(r,o,e,a,c,d,0),o}};function gl(i,t,e,n,s){let r,o;if(s===M0(i,t,e,n)>0)for(r=t;r<e;r+=n)o=fc(r,i[r],i[r+1],o);else for(r=e-n;r>=t;r-=n)o=fc(r,i[r],i[r+1],o);return o&&Qs(o,o.next)&&(is(o),o=o.next),o}function Kn(i,t){if(!i)return i;t||(t=i);let e=i,n;do if(n=!1,!e.steiner&&(Qs(e,e.next)||ue(e.prev,e,e.next)===0)){if(is(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function es(i,t,e,n,s,r,o){if(!i)return;!o&&r&&p0(i,n,s,r);let a=i,c,l;for(;i.prev!==i.next;){if(c=i.prev,l=i.next,r?o0(i,n,s,r):r0(i)){t.push(c.i/e|0),t.push(i.i/e|0),t.push(l.i/e|0),is(i),i=l.next,a=l.next;continue}if(i=l,i===a){o?o===1?(i=a0(Kn(i),t,e),es(i,t,e,n,s,r,2)):o===2&&c0(i,t,e,n,s,r):es(Kn(i),t,e,n,s,r,1);break}}}function r0(i){const t=i.prev,e=i,n=i.next;if(ue(t,e,n)>=0)return!1;const s=t.x,r=e.x,o=n.x,a=t.y,c=e.y,l=n.y,h=s<r?s<o?s:o:r<o?r:o,u=a<c?a<l?a:l:c<l?c:l,f=s>r?s>o?s:o:r>o?r:o,d=a>c?a>l?a:l:c>l?c:l;let g=n.next;for(;g!==t;){if(g.x>=h&&g.x<=f&&g.y>=u&&g.y<=d&&_i(s,a,r,c,o,l,g.x,g.y)&&ue(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function o0(i,t,e,n){const s=i.prev,r=i,o=i.next;if(ue(s,r,o)>=0)return!1;const a=s.x,c=r.x,l=o.x,h=s.y,u=r.y,f=o.y,d=a<c?a<l?a:l:c<l?c:l,g=h<u?h<f?h:f:u<f?u:f,v=a>c?a>l?a:l:c>l?c:l,m=h>u?h>f?h:f:u>f?u:f,p=Do(d,g,t,e,n),y=Do(v,m,t,e,n);let E=i.prevZ,_=i.nextZ;for(;E&&E.z>=p&&_&&_.z<=y;){if(E.x>=d&&E.x<=v&&E.y>=g&&E.y<=m&&E!==s&&E!==o&&_i(a,h,c,u,l,f,E.x,E.y)&&ue(E.prev,E,E.next)>=0||(E=E.prevZ,_.x>=d&&_.x<=v&&_.y>=g&&_.y<=m&&_!==s&&_!==o&&_i(a,h,c,u,l,f,_.x,_.y)&&ue(_.prev,_,_.next)>=0))return!1;_=_.nextZ}for(;E&&E.z>=p;){if(E.x>=d&&E.x<=v&&E.y>=g&&E.y<=m&&E!==s&&E!==o&&_i(a,h,c,u,l,f,E.x,E.y)&&ue(E.prev,E,E.next)>=0)return!1;E=E.prevZ}for(;_&&_.z<=y;){if(_.x>=d&&_.x<=v&&_.y>=g&&_.y<=m&&_!==s&&_!==o&&_i(a,h,c,u,l,f,_.x,_.y)&&ue(_.prev,_,_.next)>=0)return!1;_=_.nextZ}return!0}function a0(i,t,e){let n=i;do{const s=n.prev,r=n.next.next;!Qs(s,r)&&_l(s,n,n.next,r)&&ns(s,r)&&ns(r,s)&&(t.push(s.i/e|0),t.push(n.i/e|0),t.push(r.i/e|0),is(n),is(n.next),n=i=r),n=n.next}while(n!==i);return Kn(n)}function c0(i,t,e,n,s,r){let o=i;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&_0(o,a)){let c=vl(o,a);o=Kn(o,o.next),c=Kn(c,c.next),es(o,t,e,n,s,r,0),es(c,t,e,n,s,r,0);return}a=a.next}o=o.next}while(o!==i)}function l0(i,t,e,n){const s=[];let r,o,a,c,l;for(r=0,o=t.length;r<o;r++)a=t[r]*n,c=r<o-1?t[r+1]*n:i.length,l=gl(i,a,c,n,!1),l===l.next&&(l.steiner=!0),s.push(g0(l));for(s.sort(h0),r=0;r<s.length;r++)e=u0(s[r],e);return e}function h0(i,t){return i.x-t.x}function u0(i,t){const e=f0(i,t);if(!e)return t;const n=vl(e,i);return Kn(n,n.next),Kn(e,e.next)}function f0(i,t){let e=t,n=-1/0,s;const r=i.x,o=i.y;do{if(o<=e.y&&o>=e.next.y&&e.next.y!==e.y){const f=e.x+(o-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(f<=r&&f>n&&(n=f,s=e.x<e.next.x?e:e.next,f===r))return s}e=e.next}while(e!==t);if(!s)return null;const a=s,c=s.x,l=s.y;let h=1/0,u;e=s;do r>=e.x&&e.x>=c&&r!==e.x&&_i(o<l?r:n,o,c,l,o<l?n:r,o,e.x,e.y)&&(u=Math.abs(o-e.y)/(r-e.x),ns(e,i)&&(u<h||u===h&&(e.x>s.x||e.x===s.x&&d0(s,e)))&&(s=e,h=u)),e=e.next;while(e!==a);return s}function d0(i,t){return ue(i.prev,i,t.prev)<0&&ue(t.next,i,i.next)<0}function p0(i,t,e,n){let s=i;do s.z===0&&(s.z=Do(s.x,s.y,t,e,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,m0(s)}function m0(i){let t,e,n,s,r,o,a,c,l=1;do{for(e=i,i=null,r=null,o=0;e;){for(o++,n=e,a=0,t=0;t<l&&(a++,n=n.nextZ,!!n);t++);for(c=l;a>0||c>0&&n;)a!==0&&(c===0||!n||e.z<=n.z)?(s=e,e=e.nextZ,a--):(s=n,n=n.nextZ,c--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;e=n}r.nextZ=null,l*=2}while(o>1);return i}function Do(i,t,e,n,s){return i=(i-e)*s|0,t=(t-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,i|t<<1}function g0(i){let t=i,e=i;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==i);return e}function _i(i,t,e,n,s,r,o,a){return(s-o)*(t-a)>=(i-o)*(r-a)&&(i-o)*(n-a)>=(e-o)*(t-a)&&(e-o)*(r-a)>=(s-o)*(n-a)}function _0(i,t){return i.next.i!==t.i&&i.prev.i!==t.i&&!v0(i,t)&&(ns(i,t)&&ns(t,i)&&x0(i,t)&&(ue(i.prev,i,t.prev)||ue(i,t.prev,t))||Qs(i,t)&&ue(i.prev,i,i.next)>0&&ue(t.prev,t,t.next)>0)}function ue(i,t,e){return(t.y-i.y)*(e.x-t.x)-(t.x-i.x)*(e.y-t.y)}function Qs(i,t){return i.x===t.x&&i.y===t.y}function _l(i,t,e,n){const s=Fs(ue(i,t,e)),r=Fs(ue(i,t,n)),o=Fs(ue(e,n,i)),a=Fs(ue(e,n,t));return!!(s!==r&&o!==a||s===0&&Ns(i,e,t)||r===0&&Ns(i,n,t)||o===0&&Ns(e,i,n)||a===0&&Ns(e,t,n))}function Ns(i,t,e){return t.x<=Math.max(i.x,e.x)&&t.x>=Math.min(i.x,e.x)&&t.y<=Math.max(i.y,e.y)&&t.y>=Math.min(i.y,e.y)}function Fs(i){return i>0?1:i<0?-1:0}function v0(i,t){let e=i;do{if(e.i!==i.i&&e.next.i!==i.i&&e.i!==t.i&&e.next.i!==t.i&&_l(e,e.next,i,t))return!0;e=e.next}while(e!==i);return!1}function ns(i,t){return ue(i.prev,i,i.next)<0?ue(i,t,i.next)>=0&&ue(i,i.prev,t)>=0:ue(i,t,i.prev)<0||ue(i,i.next,t)<0}function x0(i,t){let e=i,n=!1;const s=(i.x+t.x)/2,r=(i.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&s<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==i);return n}function vl(i,t){const e=new Io(i.i,i.x,i.y),n=new Io(t.i,t.x,t.y),s=i.next,r=t.prev;return i.next=t,t.prev=i,e.next=s,s.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function fc(i,t,e,n){const s=new Io(i,t,e);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function is(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function Io(i,t,e){this.i=i,this.x=t,this.y=e,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function M0(i,t,e,n){let s=0;for(let r=t,o=e-n;r<e;r+=n)s+=(i[o]-i[r])*(i[r+1]+i[o+1]),o=r;return s}class $i{static area(t){const e=t.length;let n=0;for(let s=e-1,r=0;r<e;s=r++)n+=t[s].x*t[r].y-t[r].x*t[s].y;return n*.5}static isClockWise(t){return $i.area(t)<0}static triangulateShape(t,e){const n=[],s=[],r=[];dc(t),pc(n,t);let o=t.length;e.forEach(dc);for(let c=0;c<e.length;c++)s.push(o),o+=e[c].length,pc(n,e[c]);const a=s0.triangulate(n,s);for(let c=0;c<a.length;c+=3)r.push(a.slice(c,c+3));return r}}function dc(i){const t=i.length;t>2&&i[t-1].equals(i[0])&&i.pop()}function pc(i,t){for(let e=0;e<t.length;e++)i.push(t[e].x),i.push(t[e].y)}class jo extends xe{constructor(t=new ml([new ct(.5,.5),new ct(-.5,.5),new ct(-.5,-.5),new ct(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];const n=this,s=[],r=[];for(let a=0,c=t.length;a<c;a++){const l=t[a];o(l)}this.setAttribute("position",new Zt(s,3)),this.setAttribute("uv",new Zt(r,2)),this.computeVertexNormals();function o(a){const c=[],l=e.curveSegments!==void 0?e.curveSegments:12,h=e.steps!==void 0?e.steps:1,u=e.depth!==void 0?e.depth:1;let f=e.bevelEnabled!==void 0?e.bevelEnabled:!0,d=e.bevelThickness!==void 0?e.bevelThickness:.2,g=e.bevelSize!==void 0?e.bevelSize:d-.1,v=e.bevelOffset!==void 0?e.bevelOffset:0,m=e.bevelSegments!==void 0?e.bevelSegments:3;const p=e.extrudePath,y=e.UVGenerator!==void 0?e.UVGenerator:S0;let E,_=!1,D,S,A,P;p&&(E=p.getSpacedPoints(h),_=!0,f=!1,D=p.computeFrenetFrames(h,!1),S=new U,A=new U,P=new U),f||(m=0,d=0,g=0,v=0);const M=a.extractPoints(l);let x=M.shape;const C=M.holes;if(!$i.isClockWise(x)){x=x.reverse();for(let rt=0,ht=C.length;rt<ht;rt++){const L=C[rt];$i.isClockWise(L)&&(C[rt]=L.reverse())}}const V=$i.triangulateShape(x,C),X=x;for(let rt=0,ht=C.length;rt<ht;rt++){const L=C[rt];x=x.concat(L)}function J(rt,ht,L){return ht||console.error("THREE.ExtrudeGeometry: vec does not exist"),rt.clone().addScaledVector(ht,L)}const Y=x.length,tt=V.length;function K(rt,ht,L){let Pt,lt,Tt;const gt=rt.x-ht.x,Ot=rt.y-ht.y,wt=L.x-rt.x,R=L.y-rt.y,b=gt*gt+Ot*Ot,w=gt*R-Ot*wt;if(Math.abs(w)>Number.EPSILON){const N=Math.sqrt(b),F=Math.sqrt(wt*wt+R*R),O=ht.x-Ot/N,$=ht.y+gt/N,it=L.x-R/F,ot=L.y+wt/F,Lt=((it-O)*R-(ot-$)*wt)/(gt*R-Ot*wt);Pt=O+gt*Lt-rt.x,lt=$+Ot*Lt-rt.y;const nt=Pt*Pt+lt*lt;if(nt<=2)return new ct(Pt,lt);Tt=Math.sqrt(nt/2)}else{let N=!1;gt>Number.EPSILON?wt>Number.EPSILON&&(N=!0):gt<-Number.EPSILON?wt<-Number.EPSILON&&(N=!0):Math.sign(Ot)===Math.sign(R)&&(N=!0),N?(Pt=-Ot,lt=gt,Tt=Math.sqrt(b)):(Pt=gt,lt=Ot,Tt=Math.sqrt(b/2))}return new ct(Pt/Tt,lt/Tt)}const ft=[];for(let rt=0,ht=X.length,L=ht-1,Pt=rt+1;rt<ht;rt++,L++,Pt++)L===ht&&(L=0),Pt===ht&&(Pt=0),ft[rt]=K(X[rt],X[L],X[Pt]);const ut=[];let _t,Dt=ft.concat();for(let rt=0,ht=C.length;rt<ht;rt++){const L=C[rt];_t=[];for(let Pt=0,lt=L.length,Tt=lt-1,gt=Pt+1;Pt<lt;Pt++,Tt++,gt++)Tt===lt&&(Tt=0),gt===lt&&(gt=0),_t[Pt]=K(L[Pt],L[Tt],L[gt]);ut.push(_t),Dt=Dt.concat(_t)}for(let rt=0;rt<m;rt++){const ht=rt/m,L=d*Math.cos(ht*Math.PI/2),Pt=g*Math.sin(ht*Math.PI/2)+v;for(let lt=0,Tt=X.length;lt<Tt;lt++){const gt=J(X[lt],ft[lt],Pt);W(gt.x,gt.y,-L)}for(let lt=0,Tt=C.length;lt<Tt;lt++){const gt=C[lt];_t=ut[lt];for(let Ot=0,wt=gt.length;Ot<wt;Ot++){const R=J(gt[Ot],_t[Ot],Pt);W(R.x,R.y,-L)}}}const q=g+v;for(let rt=0;rt<Y;rt++){const ht=f?J(x[rt],Dt[rt],q):x[rt];_?(A.copy(D.normals[0]).multiplyScalar(ht.x),S.copy(D.binormals[0]).multiplyScalar(ht.y),P.copy(E[0]).add(A).add(S),W(P.x,P.y,P.z)):W(ht.x,ht.y,0)}for(let rt=1;rt<=h;rt++)for(let ht=0;ht<Y;ht++){const L=f?J(x[ht],Dt[ht],q):x[ht];_?(A.copy(D.normals[rt]).multiplyScalar(L.x),S.copy(D.binormals[rt]).multiplyScalar(L.y),P.copy(E[rt]).add(A).add(S),W(P.x,P.y,P.z)):W(L.x,L.y,u/h*rt)}for(let rt=m-1;rt>=0;rt--){const ht=rt/m,L=d*Math.cos(ht*Math.PI/2),Pt=g*Math.sin(ht*Math.PI/2)+v;for(let lt=0,Tt=X.length;lt<Tt;lt++){const gt=J(X[lt],ft[lt],Pt);W(gt.x,gt.y,u+L)}for(let lt=0,Tt=C.length;lt<Tt;lt++){const gt=C[lt];_t=ut[lt];for(let Ot=0,wt=gt.length;Ot<wt;Ot++){const R=J(gt[Ot],_t[Ot],Pt);_?W(R.x,R.y+E[h-1].y,E[h-1].x+L):W(R.x,R.y,u+L)}}}B(),I();function B(){const rt=s.length/3;if(f){let ht=0,L=Y*ht;for(let Pt=0;Pt<tt;Pt++){const lt=V[Pt];et(lt[2]+L,lt[1]+L,lt[0]+L)}ht=h+m*2,L=Y*ht;for(let Pt=0;Pt<tt;Pt++){const lt=V[Pt];et(lt[0]+L,lt[1]+L,lt[2]+L)}}else{for(let ht=0;ht<tt;ht++){const L=V[ht];et(L[2],L[1],L[0])}for(let ht=0;ht<tt;ht++){const L=V[ht];et(L[0]+Y*h,L[1]+Y*h,L[2]+Y*h)}}n.addGroup(rt,s.length/3-rt,0)}function I(){const rt=s.length/3;let ht=0;Z(X,ht),ht+=X.length;for(let L=0,Pt=C.length;L<Pt;L++){const lt=C[L];Z(lt,ht),ht+=lt.length}n.addGroup(rt,s.length/3-rt,1)}function Z(rt,ht){let L=rt.length;for(;--L>=0;){const Pt=L;let lt=L-1;lt<0&&(lt=rt.length-1);for(let Tt=0,gt=h+m*2;Tt<gt;Tt++){const Ot=Y*Tt,wt=Y*(Tt+1),R=ht+Pt+Ot,b=ht+lt+Ot,w=ht+lt+wt,N=ht+Pt+wt;xt(R,b,w,N)}}}function W(rt,ht,L){c.push(rt),c.push(ht),c.push(L)}function et(rt,ht,L){Rt(rt),Rt(ht),Rt(L);const Pt=s.length/3,lt=y.generateTopUV(n,s,Pt-3,Pt-2,Pt-1);Gt(lt[0]),Gt(lt[1]),Gt(lt[2])}function xt(rt,ht,L,Pt){Rt(rt),Rt(ht),Rt(Pt),Rt(ht),Rt(L),Rt(Pt);const lt=s.length/3,Tt=y.generateSideWallUV(n,s,lt-6,lt-3,lt-2,lt-1);Gt(Tt[0]),Gt(Tt[1]),Gt(Tt[3]),Gt(Tt[1]),Gt(Tt[2]),Gt(Tt[3])}function Rt(rt){s.push(c[rt*3+0]),s.push(c[rt*3+1]),s.push(c[rt*3+2])}function Gt(rt){r.push(rt.x),r.push(rt.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return y0(e,n,t)}static fromJSON(t,e){const n=[];for(let r=0,o=t.shapes.length;r<o;r++){const a=e[t.shapes[r]];n.push(a)}const s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new Po[s.type]().fromJSON(s)),new jo(n,t.options)}}const S0={generateTopUV:function(i,t,e,n,s){const r=t[e*3],o=t[e*3+1],a=t[n*3],c=t[n*3+1],l=t[s*3],h=t[s*3+1];return[new ct(r,o),new ct(a,c),new ct(l,h)]},generateSideWallUV:function(i,t,e,n,s,r){const o=t[e*3],a=t[e*3+1],c=t[e*3+2],l=t[n*3],h=t[n*3+1],u=t[n*3+2],f=t[s*3],d=t[s*3+1],g=t[s*3+2],v=t[r*3],m=t[r*3+1],p=t[r*3+2];return Math.abs(a-h)<Math.abs(o-l)?[new ct(o,1-c),new ct(l,1-u),new ct(f,1-g),new ct(v,1-p)]:[new ct(a,1-c),new ct(h,1-u),new ct(d,1-g),new ct(m,1-p)]}};function y0(i,t,e){if(e.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){const r=i[n];e.shapes.push(r.uuid)}else e.shapes.push(i.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}class ss extends $o{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new ss(t.radius,t.detail)}}class Qo extends xe{constructor(t=.5,e=1,n=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:s,thetaStart:r,thetaLength:o},n=Math.max(3,n),s=Math.max(1,s);const a=[],c=[],l=[],h=[];let u=t;const f=(e-t)/s,d=new U,g=new ct;for(let v=0;v<=s;v++){for(let m=0;m<=n;m++){const p=r+m/n*o;d.x=u*Math.cos(p),d.y=u*Math.sin(p),c.push(d.x,d.y,d.z),l.push(0,0,1),g.x=(d.x/e+1)/2,g.y=(d.y/e+1)/2,h.push(g.x,g.y)}u+=f}for(let v=0;v<s;v++){const m=v*(n+1);for(let p=0;p<n;p++){const y=p+m,E=y,_=y+n+1,D=y+n+2,S=y+1;a.push(E,_,S),a.push(_,D,S)}}this.setIndex(a),this.setAttribute("position",new Zt(c,3)),this.setAttribute("normal",new Zt(l,3)),this.setAttribute("uv",new Zt(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Qo(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class Yn extends xe{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const c=Math.min(o+a,Math.PI);let l=0;const h=[],u=new U,f=new U,d=[],g=[],v=[],m=[];for(let p=0;p<=n;p++){const y=[],E=p/n;let _=0;p===0&&o===0?_=.5/e:p===n&&c===Math.PI&&(_=-.5/e);for(let D=0;D<=e;D++){const S=D/e;u.x=-t*Math.cos(s+S*r)*Math.sin(o+E*a),u.y=t*Math.cos(o+E*a),u.z=t*Math.sin(s+S*r)*Math.sin(o+E*a),g.push(u.x,u.y,u.z),f.copy(u).normalize(),v.push(f.x,f.y,f.z),m.push(S+_,1-E),y.push(l++)}h.push(y)}for(let p=0;p<n;p++)for(let y=0;y<e;y++){const E=h[p][y+1],_=h[p][y],D=h[p+1][y],S=h[p+1][y+1];(p!==0||o>0)&&d.push(E,_,S),(p!==n-1||c<Math.PI)&&d.push(_,D,S)}this.setIndex(d),this.setAttribute("position",new Zt(g,3)),this.setAttribute("normal",new Zt(v,3)),this.setAttribute("uv",new Zt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Yn(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class Zs extends xe{constructor(t=1,e=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);const o=[],a=[],c=[],l=[],h=new U,u=new U,f=new U;for(let d=0;d<=n;d++)for(let g=0;g<=s;g++){const v=g/s*r,m=d/n*Math.PI*2;u.x=(t+e*Math.cos(m))*Math.cos(v),u.y=(t+e*Math.cos(m))*Math.sin(v),u.z=e*Math.sin(m),a.push(u.x,u.y,u.z),h.x=t*Math.cos(v),h.y=t*Math.sin(v),f.subVectors(u,h).normalize(),c.push(f.x,f.y,f.z),l.push(g/s),l.push(d/n)}for(let d=1;d<=n;d++)for(let g=1;g<=s;g++){const v=(s+1)*d+g-1,m=(s+1)*(d-1)+g-1,p=(s+1)*(d-1)+g,y=(s+1)*d+g;o.push(v,m,y),o.push(m,p,y)}this.setIndex(o),this.setAttribute("position",new Zt(a,3)),this.setAttribute("normal",new Zt(c,3)),this.setAttribute("uv",new Zt(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Zs(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class be extends Ii{static get type(){return"MeshStandardMaterial"}constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new pt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new pt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Wc,this.normalScale=new ct(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new an,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class E0 extends be{static get type(){return"MeshPhysicalMaterial"}constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new ct(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return ve(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new pt(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new pt(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new pt(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}}class ta extends de{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new pt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class b0 extends ta{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(de.DEFAULT_UP),this.updateMatrix(),this.groundColor=new pt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const Or=new ae,mc=new U,gc=new U;class xl{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ct(512,512),this.map=null,this.mapPass=null,this.matrix=new ae,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Wo,this._frameExtents=new ct(1,1),this._viewportCount=1,this._viewports=[new oe(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;mc.setFromMatrixPosition(t.matrixWorld),e.position.copy(mc),gc.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(gc),e.updateMatrixWorld(),Or.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Or),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Or)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const _c=new ae,Wi=new U,Br=new U;class T0 extends xl{constructor(){super(new Be(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new ct(4,2),this._viewportCount=6,this._viewports=[new oe(2,1,1,1),new oe(0,1,1,1),new oe(3,1,1,1),new oe(1,1,1,1),new oe(3,0,1,1),new oe(1,0,1,1)],this._cubeDirections=[new U(1,0,0),new U(-1,0,0),new U(0,0,1),new U(0,0,-1),new U(0,1,0),new U(0,-1,0)],this._cubeUps=[new U(0,1,0),new U(0,1,0),new U(0,1,0),new U(0,1,0),new U(0,0,1),new U(0,0,-1)]}updateMatrices(t,e=0){const n=this.camera,s=this.matrix,r=t.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Wi.setFromMatrixPosition(t.matrixWorld),n.position.copy(Wi),Br.copy(n.position),Br.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(Br),n.updateMatrixWorld(),s.makeTranslation(-Wi.x,-Wi.y,-Wi.z),_c.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(_c)}}class vc extends ta{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new T0}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class w0 extends xl{constructor(){super(new Xo(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class xc extends ta{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(de.DEFAULT_UP),this.updateMatrix(),this.target=new de,this.shadow=new w0}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class A0{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Mc(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=Mc();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function Mc(){return performance.now()}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:No}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=No);const Sc=54;function Ke(i,t,e,n){return i+(t-i)*(1-Math.exp(-e*n))}function C0({aspect:i=16/9,mobile:t=!1}={}){const e=new Be(Sc,i,.35,1600);e.position.set(0,6,14);const n={pos:new U(0,6,14),look:new U(0,1.4,0),yaw:0,pitch:.22,dist:7.4,shake:0,shakeFreq:26,fovKick:0,breathe:Math.random()*100,mobile:t,shakeScale:t?.45:1,lead:new U},s=new U,r=new U,o=new U;return{camera:e,state:n,setMobile(a){n.mobile=!!a,n.shakeScale=a?.45:1},impulse(a=.5,c=0){n.shake=Math.min(1.4,n.shake+a*n.shakeScale),n.fovKick=Math.min(6.5,n.fovKick+(c||a*2.4)*n.shakeScale)},resize(a){e.aspect=a,e.updateProjectionMatrix()},update(a,c,l,h,u={}){const f=Math.max(0,c.y);n.yaw=Ke(n.yaw,l,7.5,a);const d=n.pitch+(u.pitchBias??0),g=h?Math.hypot(h.x,h.z):0,v=7.1+Math.min(1.6,g*.11)+f*.12;n.dist=Ke(n.dist,v,3.2,a);const m=Math.sin(n.yaw),p=Math.cos(n.yaw),y=2.5+Math.sin(d)*n.dist*.9;s.set(c.x+m*n.dist,c.y+y,c.z+p*n.dist),s.y<c.y+1.2&&(s.y=c.y+1.2),s.y<1.4&&(s.y=1.4),n.pos.x=Ke(n.pos.x,s.x,6.2,a),n.pos.y=Ke(n.pos.y,s.y,5,a),n.pos.z=Ke(n.pos.z,s.z,6.2,a),h&&(n.lead.x=Ke(n.lead.x,h.x*.16,4,a),n.lead.z=Ke(n.lead.z,h.z*.16,4,a)),r.set(c.x+n.lead.x-m*1.1,c.y+1.45,c.z+n.lead.z-p*1.1),n.look.x=Ke(n.look.x,r.x,9,a),n.look.y=Ke(n.look.y,r.y,7,a),n.look.z=Ke(n.look.z,r.z,9,a),n.breathe+=a;const E=Math.sin(n.breathe*.53)*.035+Math.sin(n.breathe*1.31)*.012,_=Math.cos(n.breathe*.41)*.028+Math.sin(n.breathe*1.07)*.01;let D=0,S=0,A=0;if(n.shake>5e-4){const M=n.breathe*n.shakeFreq,x=n.shake*n.shake;D=(Math.sin(M*1.7)+Math.sin(M*3.1)*.5)*x*.34,S=(Math.cos(M*2.3)+Math.sin(M*4.7)*.4)*x*.26,A=Math.sin(M*2.9)*x*.18,n.shake=Math.max(0,n.shake-a*3.6)}e.position.set(n.pos.x+E+D,n.pos.y+_+S,n.pos.z+A),o.copy(n.look),o.x+=D*.3,o.y+=S*.3,e.lookAt(o),e.rotateZ(D*.06),n.fovKick=Math.max(0,n.fovKick-a*14);const P=Sc+n.fovKick+Math.min(4,g*.22);Math.abs(e.fov-P)>.01&&(e.fov=Ke(e.fov,P,10,a),e.updateProjectionMatrix())},orbit(a,c,l=30){const h=c*.055,u=3.4+Math.sin(c*.11)*2.6;e.position.set(Math.cos(h)*l,u,Math.sin(h)*l),e.lookAt(Math.sin(h*1.7)*2,-.9,Math.cos(h*1.7)*2),n.pos.copy(e.position),n.look.set(0,-.9,0)}}}function tr(i){let t=i>>>0;return function(){t|=0,t=t+1831565813|0;let n=Math.imul(t^t>>>15,1|t);return n=n+Math.imul(n^n>>>7,61|n)^n,((n^n>>>14)>>>0)/4294967296}}function yc(i){return i*i*i*(i*(i*6-15)+10)}function zr(i,t,e){return i+(t-i)*e}function He(i){const t=tr(i),e=256,n=e-1,s=new Float32Array(e*e);for(let r=0;r<s.length;r++)s[r]=t();return function(o,a){const c=Math.floor(o),l=Math.floor(a),h=yc(o-c),u=yc(a-l),f=c&n,d=c+1&n,g=(l&n)*e,v=(l+1&n)*e,m=s[g+f],p=s[g+d],y=s[v+f],E=s[v+d];return zr(zr(m,p,h),zr(y,E,h),u)}}function $t(i,t,e,n=4,s=.5){let r=0,o=1,a=0,c=t,l=e;for(let h=0;h<n;h++)r+=i(c,l)*o,a+=o,o*=s,c*=2,l*=2;return r/a}function rs(i,t,e,n=4){let s=0,r=1,o=0,a=t,c=e;for(let l=0;l<n;l++){const h=1-Math.abs(i(a,c)*2-1);s+=h*h*r,o+=r,r*=.45,a*=2.07,c*=2.03}return s/o}function Ec(i,t){const e=Math.min(1,Math.max(0,i));return e<.5?.5*Math.pow(e*2,t):1-.5*Math.pow((1-e)*2,t)}function re(i,t,e){const n=Math.min(1,Math.max(0,(e-i)/(t-i)));return n*n*(3-2*n)}const R0=1,ji=Math.PI*2,Os=1;function P0(i,t){let e=(t-i)%ji;return e>Math.PI&&(e-=ji),e<-Math.PI&&(e+=ji),e}function kn(i,t,e,n){return i+(t-i)*(1-Math.exp(-e*n))}function pi(i,t){const e=new pt(Number.isFinite(i)?i:Pc);if(t)return e;const n={h:0,s:0,l:0};return e.getHSL(n),e.setHSL(n.h,n.s*.45,n.l*.92)}function L0({scene:i,quality:t,textures:e}){const n=new Ee;n.name="characters",i.add(n);const s=[],r=_=>(s.push(_),_),o=t.capsuleSegments,a={torso:r(new Xn(.3,.44,Math.max(3,o/2),o)),hips:r(new Xn(.26,.16,3,o)),thigh:r(new Xn(.15,.34,3,Math.max(5,o-2))),shin:r(new Xn(.12,.3,3,Math.max(5,o-2))),foot:r(new Je(.19,.11,.34)),upperArm:r(new Xn(.1,.26,3,Math.max(5,o-2))),head:r(new Yn(.22,o+2,o)),hood:r(new Yn(.245,o+2,o,0,ji,0,Math.PI*.62)),collar:r(new Ai(.24,.31,.16,o+2,1,!0)),strapChest:r(new Je(.1,.62,.035)),buckle:r(new Je(.09,.07,.05)),backPanel:r(new Je(.29,.4,.04)),mitt:r(new Yn(.34,o+3,o+1)),knuckle:r(new Zs(.3,.045,5,o+4,Math.PI*1.05)),stud:r(new Je(.07,.06,.055)),cuff:r(new Ai(.19,.24,.22,o+2)),tassel:r(new Je(.045,.2,.02)),seam:r(new Zs(.318,.014,4,o+6,Math.PI*1.35)),contact:r(new js(.62,16))},c=r(new Zn({color:856087,transparent:!0,opacity:.32,depthWrite:!1}));function l(_){return new be({color:_,roughnessMap:e.cloth.rough,normalMap:t.normalMaps?e.cloth.normal:null,normalScale:new ct(.4,.4),roughness:.86,metalness:0,envMapIntensity:.28})}function h(){return new be({color:1182728,roughness:.5,metalness:.2,emissive:new pt(qt.crackCore),emissiveIntensity:0,toneMapped:!0})}function u(_,D){const S=pi(_.active,D),A=pi(_.main,D),P=pi(_.off,D),M={color:new pt(qt.cloth).lerp(S,.12),roughness:.96,metalness:0,roughnessMap:e.cloth.rough,normalMap:e.cloth.normal,normalScale:new ct(.5,.5),envMapIntensity:.35},x=t.sheenCloth?new E0({...M,sheen:.3,sheenRoughness:.9,sheenColor:new pt(8226711)}):new be(M),C=new be({color:new pt(qt.clothDim),roughness:.98,metalness:0,roughnessMap:e.cloth.rough,normalMap:e.cloth.normal,normalScale:new ct(.4,.4),envMapIntensity:.3}),k=new be({color:new pt(qt.leather),roughness:.78,metalness:0,roughnessMap:e.leather.rough,normalMap:e.leather.normal,normalScale:new ct(.9,.9),envMapIntensity:.5}),V=new be({color:new pt(qt.leatherWorn),roughness:.62,metalness:0,roughnessMap:e.leather.rough,normalMap:e.leather.normal,normalScale:new ct(.7,.7),envMapIntensity:.6}),X=new be({color:new pt(qt.metal),roughness:.42,metalness:.92,roughnessMap:e.metal.rough,normalMap:e.metal.normal,normalScale:new ct(.5,.5),envMapIntensity:1}),J=new be({color:new pt(qt.skin),roughness:.66,metalness:0,envMapIntensity:.4});return{cloth:x,clothDim:C,leather:k,leatherWorn:V,metal:X,skin:J,paint:l(S),paintMain:l(A),paintOff:l(P),seamMain:h(),seamOff:h(),ident:S}}function f(_,D,S,A){const P=new Ee,M=new kt(a.mitt,_.leather);M.scale.set(1,.86,1.16),M.castShadow=t.shadows,P.add(M);const x=new kt(a.mitt,_.leatherWorn);x.scale.set(.86,.6,.9),x.position.set(0,-.13,-.06),P.add(x);const C=new kt(a.knuckle,_.metal);C.rotation.set(Math.PI*.5,Math.PI,Math.PI*.02),C.position.set(0,.02,-.06),C.castShadow=t.shadows,P.add(C);for(let Y=0;Y<3;Y++){const tt=new kt(a.stud,_.metal),K=-.5+Y*.5;tt.position.set(Math.sin(K)*.28,.16,-Math.cos(K)*.26),tt.rotation.y=-K,P.add(tt)}const k=new kt(a.stud,S);k.scale.set(3.4,.55,1.2),k.position.set(0,.07,.24),P.add(k);const V=new kt(a.cuff,_.cloth);V.position.set(0,.3,.02),V.rotation.x=-.15,V.castShadow=t.shadows,P.add(V);const X=new kt(a.tassel,_.clothDim);X.position.set(D*.14,.26,.14),P.add(X);const J=new kt(a.seam,A);return J.rotation.set(Math.PI*.5,Math.PI,Math.PI*.32),J.position.set(0,-.02,-.02),J.layers.enable(R0),J.userData.bloomSelf=!0,P.add(J),P.userData={tassel:X,seam:J,mitt:M,stripe:k},P}function d(_,D){const S=u(_,D),A=new Ee,P=new Ee;A.add(P);const M=new kt(a.hips,S.clothDim);M.position.y=.86,M.castShadow=t.shadows,P.add(M);const x=new kt(a.torso,S.cloth);x.position.y=1.24,x.castShadow=t.shadows,x.receiveShadow=t.shadows,P.add(x);const C=new kt(a.strapChest,S.leather);C.position.set(.06,1.26,-.27),C.rotation.z=-.24,P.add(C);const k=new kt(a.buckle,S.metal);k.position.set(.12,1.06,-.3),P.add(k);const V=new kt(a.collar,S.clothDim);V.position.y=1.58,P.add(V);const X=new kt(a.backPanel,S.clothDim);X.position.set(0,1.26,.305),X.rotation.x=-.06,X.scale.set(1.22,1.16,.6),P.add(X);const J=new kt(a.backPanel,S.paint);J.position.set(0,1.26,.315),J.rotation.x=-.06,J.castShadow=t.shadows,P.add(J);const Y=new kt(a.head,S.skin);Y.position.y=1.79,Y.castShadow=t.shadows,P.add(Y);const tt=new kt(a.hood,S.cloth);tt.position.y=1.8,tt.rotation.x=.16,tt.castShadow=t.shadows,P.add(tt);const K=[];for(const _t of[-1,1]){const Dt=new Ee;Dt.position.set(_t*.16,.84,0),P.add(Dt);const q=new kt(a.thigh,S.clothDim);q.position.y=-.24,q.castShadow=t.shadows,Dt.add(q);const B=new Ee;B.position.y=-.46,Dt.add(B);const I=new kt(a.shin,S.clothDim);I.position.y=-.2,I.castShadow=t.shadows,B.add(I);const Z=new kt(a.foot,S.leather);Z.position.set(0,-.38,-.06),B.add(Z),K.push({hip:Dt,knee:B,side:_t})}const ft=[];for(const _t of[-1,1]){const Dt=_t===Os,q=new Ee;q.position.set(_t*.33,1.46,0),P.add(q);const B=new kt(a.upperArm,S.cloth);B.position.y=-.2,B.castShadow=t.shadows,q.add(B);const I=new Ee;I.position.y=-.46,q.add(I);const Z=f(S,_t,Dt?S.paintMain:S.paintOff,Dt?S.seamMain:S.seamOff);Z.position.y=-.22,I.add(Z),ft.push({shoulder:q,wrist:I,glove:Z,side:_t,slot:Dt?0:1})}const ut=new kt(a.contact,c.clone());return ut.rotation.x=-Math.PI/2,ut.position.y=.02,ut.renderOrder=1,A.add(ut),{rootGroup:A,body:P,mats:S,legs:K,arms:ft,head:Y,hood:tt,torso:x,contact:ut}}const g=new Map,v=new U;function m(_){return{active:_.tint,main:_.mainTint??_.tint,off:_.offTint??_.tint}}function p(_,D){const S=_.isLocal,A=pi(D.tint,S);_.mats.paint.color.copy(A),_.mats.paintMain.color.copy(pi(D.mainTint??D.tint,S)),_.mats.paintOff.color.copy(pi(D.offTint??D.tint,S)),_.mats.cloth.color.copy(new pt(qt.cloth)).lerp(A,.12),_.activeGloveId=D.activeGloveId,_.mainId=D.mainId,_.offhandId=D.offhandId}function y(_,D){const S=d(m(_),D);n.add(S.rootGroup);const A={id:_.id,...S,isLocal:D,activeGloveId:_.activeGloveId,mainId:_.mainId,offhandId:_.offhandId,activeSlot:_.activeSlot??0,pos:new U(_.x??0,_.y??0,_.z??0),prev:new U(_.x??0,_.y??0,_.z??0),yaw:_.yaw??0,speed:0,stride:0,slapT:-1,slapSide:Os,slapPower:1,hitT:-1,awaken:0,breathe:Math.random()*ji};return g.set(_.id,A),A}function E(_){var D,S;n.remove(_.rootGroup);for(const A of Object.keys(_.mats))(S=(D=_.mats[A])==null?void 0:D.dispose)==null||S.call(D);_.contact.material.dispose()}return{root:n,chars:g,get(_){return g.get(_)},reconcile(_,D){const S=new Set;for(const A of _){if(!A||A.id==null)continue;S.add(A.id);let P=g.get(A.id);P?(A.activeGloveId!==P.activeGloveId||A.mainId!==P.mainId||A.offhandId!==P.offhandId)&&p(P,A):P=y(A,A.id===D),P.activeSlot=A.activeSlot??0,P.target=A}for(const[A,P]of g)S.has(A)||(E(P),g.delete(A))},playSlap(_,D=1,S=null){const A=g.get(_);A&&(A.slapT=0,A.slapPower=Math.max(.35,Math.min(2,D)),A.slapSide=S??(A.activeSlot===0?Os:-Os))},playHit(_,D,S=1){const A=g.get(_);A&&(A.hitT=0,A.hitPower=Math.max(.3,Math.min(2.4,S)),A.hitDir=D?v.copy(D).normalize().clone():new U(0,0,1))},update(_,D){for(const S of g.values()){const A=S.target;if(!A)continue;const P=A.alive!==!1;if(S.rootGroup.visible=P,!P)continue;S.prev.copy(S.pos),S.pos.x=kn(S.pos.x,A.x??0,22,_),S.pos.y=kn(S.pos.y,A.y??0,24,_),S.pos.z=kn(S.pos.z,A.z??0,22,_),S.rootGroup.position.copy(S.pos);const M=S.pos.x-S.prev.x,x=S.pos.z-S.prev.z,C=Math.hypot(M,x)/Math.max(_,1e-4);S.speed=kn(S.speed,C,9,_),S.yaw+=P0(S.yaw,A.yaw??0)*Math.min(1,_*16),S.rootGroup.rotation.y=S.yaw,S.stride+=S.speed*_*2.1;const k=Math.min(1,S.speed/7),V=Math.sin(S.stride*2)*.035*k,X=Math.sin(S.stride)*.05*k;S.breathe+=_*1.3,S.body.position.y=V+Math.sin(S.breathe)*.008,S.body.rotation.z=-X*.5,S.body.rotation.x=-k*.11-Math.sin(S.stride*2+1)*.015;for(const B of S.legs){const I=S.stride+(B.side>0?Math.PI:0);B.hip.rotation.x=Math.sin(I)*.62*k,B.knee.rotation.x=-Math.max(0,-Math.sin(I-.6))*.85*k}let J=0,Y=0;if(S.slapT>=0){S.slapT+=_/(.62/S.slapPower);const B=S.slapT;if(B>=1)S.slapT=-1;else if(B<.34){const I=B/.34;J=-.9*re(0,1,I),Y=-.34*re(0,1,I)}else if(B<.52){const I=(B-.34)/.18;J=-.9+2.6*re(0,1,I),Y=-.34+.72*re(0,1,I)}else{const I=(B-.52)/.48;J=1.7*(1-re(0,1,I)),Y=.38*(1-re(0,1,I))}}S.body.rotation.y=Y*S.slapSide;for(const B of S.arms){const I=S.stride+(B.side>0?0:Math.PI),Z=Math.sin(I)*.5*k,et=B.side===S.slapSide?J:J*-.22;B.shoulder.rotation.x=Z+et*.55,B.shoulder.rotation.z=B.side*(.16+Math.abs(et)*.42),B.shoulder.rotation.y=B.side*et*.9,B.wrist.rotation.x=.28+Math.abs(Z)*.4-et*.5;const xt=B.glove.userData.tassel;xt.rotation.x=kn(xt.rotation.x,et*.8+k*.3,12,_),xt.rotation.z=kn(xt.rotation.z,-B.side*.2-et*.3,10,_)}if(S.hitT>=0)if(S.hitT+=_/.26,S.hitT>=1)S.hitT=-1,S.body.scale.set(1,1,1);else{const B=Math.sin(S.hitT*Math.PI),I=1+B*.16*S.hitPower;S.body.scale.set(I,1-B*.13*S.hitPower,I*.94),S.body.rotation.x-=B*.22*S.hitPower}const tt=(A.awakenedT??0)>0?1:0;S.awaken=kn(S.awaken,tt,5,_);const K=.72+.28*Math.sin(D*6.2),ft=S.activeSlot===0;S.mats.seamMain.emissiveIntensity=S.awaken*(ft?2.6:.5)*K,S.mats.seamOff.emissiveIntensity=S.awaken*(ft?.5:2.6)*K,S.mats.paint.emissive.setHex(qt.crackCore),S.mats.paint.emissiveIntensity=S.awaken*.35*K;const _t=(A.invulnT??0)>0?.55+.2*Math.sin(D*9):1;for(const B of["cloth","clothDim","leather","leatherWorn","skin"]){const I=S.mats[B];if(!I)continue;const Z=_t<.999;I.transparent!==Z&&(I.transparent=Z,I.needsUpdate=!0),I.opacity=_t}const Dt=Math.max(0,S.pos.y);S.contact.position.y=.02-S.pos.y;const q=1-Math.min(1,Dt/3.2);S.contact.material.opacity=.34*q*q*_t,S.contact.scale.setScalar(1+Dt*.22),S.contact.visible=S.pos.y>-1.5&&q>.02}},dispose(){var _;for(const D of g.values())E(D);g.clear(),i.remove(n);for(const D of s)(_=D.dispose)==null||_.call(D);c.dispose()}}}const D0=1,mi=.92,I0=.13,U0=.16;function Xi(i){return i<0?0:i>1?1:i}const Yi=new pt(.84,.93,1.14),bc=new pt(1.14,1,.84),N0=`
  uniform vec3 uCore;
  uniform vec3 uDeep;
  uniform float uTime;
  uniform sampler2D uNoise;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float turb = texture2D(uNoise, vUv * 1.6 + vec2(uTime * 0.01, uTime * -0.013)).r;
    float turb2 = texture2D(uNoise, vUv * 3.7 - vec2(uTime * 0.017, 0.0)).r;
    float heat = turb * 0.6 + turb2 * 0.4;
    // 中心最亮，往外冷成暗橙；再乘一层缓慢起伏，像底下真的在烧
    float fall = smoothstep(1.15, 0.05, r);
    float pulse = 0.82 + 0.18 * sin(uTime * 0.9 + heat * 6.0);
    vec3 col = mix(uDeep, uCore, clamp(fall * (0.35 + heat * 0.8), 0.0, 1.0));
    gl_FragColor = vec4(col * fall * pulse * 1.5, 1.0);
  }
`,F0=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;function O0({scene:i,quality:t,textures:e,arenaRadius:n=20,seed:s=20240501}){const r=new Ee;r.name="island",i.add(r);const o=[],a=w=>(o.push(w),w),c=He(s+17),l=tr(s+99),h=n;function u(w){const N=$t(c,Math.cos(w)*1.15+41,Math.sin(w)*1.15+41,3)-.5,F=$t(c,Math.cos(w)*6.5+13,Math.sin(w)*6.5+13,3)-.5;return 1+N*.17+F*.035}function f(w){return 1+(u(w)-1)*.5}const d=(w,N,F)=>{if(!w)return null;const O=w.clone();return O.repeat.set(N,F),O.needsUpdate=!0,a(O),O},g=a(new be({map:d(e.cliff.albedo,4,1.7),normalMap:d(e.cliff.normal,4,1.7),roughnessMap:d(e.cliff.rough,4,1.7),normalScale:new ct(.7,.7),roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.34,fog:!0,side:Ce})),v=a(new be({map:d(e.crust.albedo,.075,.075),normalMap:d(e.crust.normal,.075,.075),roughnessMap:d(e.crust.rough,.075,.075),normalScale:new ct(1.05,1.05),roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.5}));v.onBeforeCompile=w=>{var N,F;w.uniforms.uMacro={value:e.arenaMacro},w.uniforms.uMacroScale={value:1/(h*2.15)},w.uniforms.uMacroTexel={value:2/(((F=(N=e.arenaMacro)==null?void 0:N.image)==null?void 0:F.width)??512)},w.vertexShader=w.vertexShader.replace("#include <common>",`#include <common>
 varying vec3 vMacroPos;`).replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
         vec4 macroLocal = vec4(transformed, 1.0);
         #ifdef USE_INSTANCING
           macroLocal = instanceMatrix * macroLocal;
         #endif
         vMacroPos = (modelMatrix * macroLocal).xyz;`),w.fragmentShader=w.fragmentShader.replace("#include <common>",`#include <common>
 uniform sampler2D uMacro;
 uniform float uMacroScale;
 uniform float uMacroTexel;
 varying vec3 vMacroPos;`).replace("#include <map_fragment>",`#include <map_fragment>
         vec2 macroUv = vMacroPos.xz * uMacroScale + 0.5;
         float macro = texture2D(uMacro, macroUv).r;
         diffuseColor.rgb *= 0.72 + macro * 0.78;`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
         {
           float e = uMacroTexel;
           float hL = texture2D(uMacro, macroUv - vec2(e, 0.0)).r;
           float hR = texture2D(uMacro, macroUv + vec2(e, 0.0)).r;
           float hD = texture2D(uMacro, macroUv - vec2(0.0, e)).r;
           float hU = texture2D(uMacro, macroUv + vec2(0.0, e)).r;
           vec3 swell = normalize(vec3((hL - hR) * 1.6, 1.0, (hD - hU) * 1.6));
           normal = normalize(normal + vec3(swell.x, 0.0, swell.z) * 0.45);
         }`)},v.customProgramCacheKey=()=>"crust-macro";const m=a(new be({map:d(e.cliff.albedo,.6,1.6),normalMap:d(e.cliff.normal,.6,1.6),roughnessMap:d(e.cliff.rough,.6,1.6),roughness:1,metalness:0,vertexColors:!0,color:new pt(9274743),envMapIntensity:.35})),p=a(new be({map:d(e.crust.albedo,1.4,1.4),roughnessMap:d(e.crust.rough,1.4,1.4),normalMap:d(e.crust.normal,1.4,1.4),roughness:1,metalness:0,color:new pt(9668987),envMapIntensity:.45})),y=[[1,-.62],[1.045,-1.9],[.845,-3.1],[.93,-4.6],[.7,-6.5],[.795,-7.9],[.545,-10.2],[.635,-11.6],[.375,-14.1],[.44,-15.4],[.215,-17.4],[.095,-19.1],[.012,-20]],E=[],_=Math.max(2,Math.floor(t.islandProfileSegments/y.length)+1);for(let w=0;w<y.length-1;w++){const[N,F]=y[w],[O,$]=y[w+1];for(let it=0;it<_;it++){const ot=it/_;E.push(new ct(h*(N+(O-N)*ot),F+($-F)*ot))}}E.push(new ct(h*y[y.length-1][0],y[y.length-1][1]));const D=Math.max(18,Math.round(t.islandRadialSegments*.5)),S=a(new ts(E,D,0,Math.PI*2));{const w=S.attributes.position,N=new Float32Array(w.count*3),F=new pt;for(let O=0;O<w.count;O++){const $=w.getX(O),it=w.getY(O),ot=w.getZ(O),Lt=Math.atan2(ot,$),nt=Math.hypot($,ot),dt=Xi(-it/20),Ct=($t(c,Math.cos(Lt)*1.6+5,Math.sin(Lt)*1.6+5,3)-.5)*.44,At=($t(c,Math.cos(Lt)*5+1,Math.sin(Lt)*5-it*.3,3)-.5)*.11,Mt=re(0,.22,dt),Bt=(1-Mt)*f(Lt)+Mt*(1+Ct*(.5+dt*1.6))+At;w.setX(O,$*Bt),w.setZ(O,ot*Bt),nt>.001&&w.setY(O,it+At*2.4);const zt=Xi(.5-At*7),Jt=Xi(At*9),z=re(.55,.95,$t(c,Lt*5.5+20,it*.06,3));let vt=1.18-re(.05,.9,dt)*.5;vt*=1-zt*.3,vt*=1+Jt*.34,vt*=1-z*.28*re(0,.45,dt),F.setRGB(1,1,1).lerp(Yi,re(.1,.9,dt)*.5).lerp(bc,Jt*.45).multiplyScalar(vt),N[O*3]=F.r,N[O*3+1]=F.g,N[O*3+2]=F.b}S.setAttribute("color",new Pe(N,3)),S.computeVertexNormals(),w.needsUpdate=!0}const A=new kt(S,g);A.name="bedrock",A.receiveShadow=t.shadows,A.castShadow=!1,r.add(A);const P=[];if(t.rockChunks>0){const w=a(new ss(1,t.name==="low"?0:1));{const N=w.attributes.position;for(let $=0;$<N.count;$++){const it=N.getX($),ot=N.getY($),Lt=N.getZ($),nt=.7+$t(c,it*1.7+3,Lt*1.7+ot,3)*.7;N.setXYZ($,it*nt,ot*nt*.8,Lt*nt)}w.computeVertexNormals();const F=new Float32Array(N.count*3),O=new pt;for(let $=0;$<N.count;$++)O.setRGB(1,1,1).lerp(Yi,.5).multiplyScalar(.62+Xi(N.getY($)*.5+.5)*.5),F[$*3]=O.r,F[$*3+1]=O.g,F[$*3+2]=O.b;w.setAttribute("color",new Pe(F,3))}for(let N=0;N<t.rockChunks;N++){const F=new kt(w,g),O=l()*Math.PI*2,$=h*(.35+l()*.7),it=-3-l()*13;F.position.set(Math.cos(O)*$,it,Math.sin(O)*$);const ot=.7+l()*2.4;F.scale.setScalar(ot),F.rotation.set(l()*3,l()*3,l()*3),F.castShadow=!1,F.receiveShadow=!1,F.userData.bob={base:it,amp:.06+l()*.14,phase:l()*6.28,spin:(l()-.5)*.05},r.add(F),P.push(F)}}const M=a(new we({vertexShader:F0,fragmentShader:N0,side:Ce,fog:!1,uniforms:{uCore:{value:new pt(qt.crackCore)},uDeep:{value:new pt(qt.crackDeep)},uNoise:{value:e.turbulence},uTime:{value:0}}})),x=a(new Ai(h*.995,h*.16,16.4,44,6,!0));{const w=x.attributes.position;for(let N=0;N<w.count;N++){const F=w.getX(N),O=w.getY(N),$=w.getZ(N),it=Math.atan2($,F),ot=1+($t(c,Math.cos(it)*3.2+11,Math.sin(it)*3.2-O*.22,3)-.5)*.22,nt=1-re(-2.5,5.6,O)*(1-Math.min(1,f(it)));w.setXYZ(N,F*ot*nt,O,$*ot*nt)}x.computeVertexNormals()}const C=a(new be({map:d(e.cliff.albedo,4,1.2),roughnessMap:d(e.cliff.rough,4,1.2),normalMap:t.normalMaps?d(e.cliff.normal,4,1.2):null,color:new pt(2827553),roughness:1,metalness:0,side:Ce,envMapIntensity:.04})),k=new kt(x,C);k.position.y=-mi-8,k.name="crack-shaft",r.add(k);const V=a(new js(h*.22,32)),X=new kt(V,M);X.rotation.x=-Math.PI/2,X.position.y=-16.1,X.name="crack-core",X.layers.enable(D0),X.userData.bloomSelf=!0,r.add(X);const J=new de,Y=new pt;let tt=null,K=null,ft=0,ut=0;function _t(w){const N=Math.max(.2,w/2-I0*.5),F=N*.22,O=new ml;O.moveTo(-N+F,-N),O.lineTo(N-F,-N),O.lineTo(N,-N+F),O.lineTo(N,N-F),O.lineTo(N-F,N),O.lineTo(-N+F,N),O.lineTo(-N,N-F),O.lineTo(-N,-N+F),O.closePath();const $=new jo(O,{depth:mi,curveSegments:1,bevelEnabled:t.plateBevel,bevelThickness:.07,bevelSize:.09,bevelOffset:0,bevelSegments:t.name==="high"?2:1,steps:1});$.rotateX(-Math.PI/2),$.computeBoundingBox(),$.translate(0,-$.boundingBox.max.y,0);const it=$.attributes.position,ot=new Float32Array(it.count*3),Lt=new pt;for(let nt=0;nt<it.count;nt++){const dt=it.getX(nt),Ct=it.getY(nt),At=it.getZ(nt),Mt=Math.max(Math.abs(dt),Math.abs(At))/N;let Bt=Ct>-.02?1:.52;Bt*=1-re(.72,1,Mt)*(Ct>-.02?.18:0),Lt.setRGB(1,1,1).lerp(Yi,Ct>-.02?.06:.34).multiplyScalar(Bt),ot[nt*3]=Lt.r,ot[nt*3+1]=Lt.g,ot[nt*3+2]=Lt.b}return $.setAttribute("color",new Pe(ot,3)),$}function Dt(w,N){const F=Math.max(64,Math.ceil(N*1.15));return tt&&w===ut&&F<=ft?!1:(tt&&(r.remove(tt),tt.dispose(),K.dispose()),ut=w,ft=F,K=_t(w),tt=new Ws(K,[v,m],F),tt.name="deck",tt.instanceMatrix.setUsage(Rn),tt.castShadow=t.shadows,tt.receiveShadow=t.shadows,tt.frustumCulled=!1,tt.count=0,r.add(tt),!0)}const q=new Map,B=new Map,I=new Map,Z=[];let W=0;const et=new Set;let xt=!1,Rt={origin:-h,tileSize:2.5};function Gt(w,N){const F=Math.floor((w-Rt.origin)/Rt.tileSize),O=Math.floor((N-Rt.origin)/Rt.tileSize);return`${F},${O}`}function rt(w){if(!tt)return;const N=w.fall;if(N>=1)J.position.set(w.x,-60,w.z),J.rotation.set(0,0,0),J.scale.setScalar(0);else{const F=w.displayCrack,O=F*.14+(w.seam?.05:0);J.position.set(w.x,w.baseY-O-N*N*30,w.z),J.rotation.set(w.tiltX*(F*.05+N*1.5),w.yaw,w.tiltZ*(F*.05+N*1.35));const $=w.seam?1-U0/Math.max(ut,.01):1;J.scale.set($,1,1)}J.updateMatrix(),tt.setMatrixAt(w.slot,J.matrix),xt=!0}function ht(w){if(!tt)return;const F=.82+$t(c,w.x*.085+21,w.z*.085+21,3)*.36,O=1-w.displayCrack*.3;Y.setRGB(1,1,1).lerp(bc,Xi(.3-w.radial*.3)*.5).lerp(Yi,w.seam?.22:0).multiplyScalar(F*O),tt.setColorAt(w.slot,Y),tt.instanceColor&&(tt.instanceColor.needsUpdate=!0)}const L=a(new $n(1,1));let Pt=t.decalBudget;const lt=new Ee;lt.name="tile-damage",r.add(lt);function Tt(w){if(Pt<=0||!e.crack||w.decals.length>=2)return;Pt--;const N=new Zn({map:e.crack,transparent:!0,depthWrite:!1,opacity:0,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2,toneMapped:!1});o.push(N);const F=new kt(L,N);F.rotation.x=-Math.PI/2,F.rotation.z=l()*Math.PI*2;const O=ut*.3;F.position.set(w.x+(l()-.5)*O,.014+w.decals.length*.004,w.z+(l()-.5)*O);const $=ut*(.7+l()*.5);F.scale.set($,$,$),F.renderOrder=2,lt.add(F),w.decals.push({mesh:F,mat:N})}function gt(w){for(const N of w.decals)lt.remove(N.mesh),N.mat.dispose(),Pt=Math.min(t.decalBudget,Pt+1);w.decals.length=0}const Ot=new Ee;r.add(Ot);{const w=t.name==="low"?14:26,N=a(new Ai(.17,.3,1,5,2));{const nt=N.attributes.position;for(let dt=0;dt<nt.count;dt++){const Ct=nt.getX(dt),At=nt.getY(dt),Mt=nt.getZ(dt),Bt=.88+$t(c,Ct*5+7,(At+Mt)*5+7,2)*.26;nt.setXYZ(dt,Ct*Bt,At+($t(c,Ct*4,Mt*4,2)-.5)*.12,Mt*Bt)}N.computeVertexNormals(),N.translate(0,.5,0)}const F=[];for(let nt=0;nt<w;nt++){const dt=nt/w*Math.PI*2+.11;l()<.16||F.push(dt)}const O=new Ws(N,p,F.length);O.instanceMatrix.setUsage(Rn);const $=new de;F.forEach((nt,dt)=>{const Ct=(h+1.8)*f(nt);$.position.set(Math.cos(nt)*Ct,-.7,Math.sin(nt)*Ct),$.rotation.set((l()-.5)*.3,nt+(l()-.5)*.7,(l()-.5)*.34);const At=.9+l()*.7;$.scale.set(.86+l()*.34,At,.86+l()*.34),$.updateMatrix(),O.setMatrixAt(dt,$.matrix)}),O.instanceMatrix.needsUpdate=!0,O.castShadow=t.shadows,O.receiveShadow=t.shadows,Ot.add(O),o.push(O);const it=[new ct(h+.4,-mi-.05),new ct(h+1.5,-mi-.35),new ct(h+2.1,-mi-.95),new ct(h+1.6,-mi-1.9)],ot=a(new ts(it,t.islandRadialSegments,0,Math.PI*2));{const nt=ot.attributes.position,dt=new Float32Array(nt.count*3),Ct=new pt;for(let At=0;At<nt.count;At++){const Mt=nt.getX(At),Bt=nt.getY(At),zt=nt.getZ(At),Jt=Math.atan2(zt,Mt),z=$t(c,Math.cos(Jt)*7+2,Math.sin(Jt)*7+2,3),vt=f(Jt);nt.setX(At,Mt*vt),nt.setZ(At,zt*vt),Ct.setRGB(1,1,1).lerp(Yi,.42).multiplyScalar((.62+z*.4)*(Bt<-1.4?.72:1)),dt[At*3]=Ct.r,dt[At*3+1]=Ct.g,dt[At*3+2]=Ct.b}ot.setAttribute("color",new Pe(dt,3)),ot.computeVertexNormals()}const Lt=new kt(ot,p);Lt.receiveShadow=t.shadows,Lt.castShadow=!1,Ot.add(Lt)}{const w=t.name==="low"?10:t.name==="mid"?22:46,N=a(new ss(.13,0));{const it=N.attributes.position;for(let ot=0;ot<it.count;ot++){const Lt=.7+$t(c,it.getX(ot)*9,it.getZ(ot)*9,2)*.8;it.setXYZ(ot,it.getX(ot)*Lt,it.getY(ot)*Lt*.7,it.getZ(ot)*Lt)}N.computeVertexNormals()}const F=a(new be({color:new pt(5853770),roughness:.98,metalness:0,flatShading:!0,envMapIntensity:.2})),O=new Ws(N,F,w),$=new de;for(let it=0;it<w;it++){const ot=l()*Math.PI*2,Lt=l()<.45?.86:Math.sqrt(l()),nt=h*.12+h*.74*Lt;$.position.set(Math.cos(ot)*nt,.03+l()*.04,Math.sin(ot)*nt),$.rotation.set(l()*3,l()*3,l()*3),$.scale.setScalar(.35+l()*.9),$.updateMatrix(),O.setMatrixAt(it,$.matrix)}O.instanceMatrix.needsUpdate=!0,O.castShadow=t.shadows,O.receiveShadow=t.shadows,r.add(O),o.push(O)}function wt(w,N){const F=Math.hypot(w.x,w.z)/Math.max(h,1e-6),O=$t(c,w.x*.7+3,w.z*.7-5,2)-.5;return{key:w.key,index:w.index,slot:N,x:w.x,z:w.z,seam:w.seam,radial:F,yaw:O*.09,baseY:O*.05,tiltX:$t(c,w.x*1.3+11,w.z*1.3,2)-.5,tiltZ:$t(c,w.x*1.3,w.z*1.3+11,2)-.5,crack:w.crack,displayCrack:w.crack,broken:!1,fall:0,decals:[]}}function R(w){gt(w),q.delete(w.key),B.delete(w.index),I.delete(Gt(w.x,w.z)),et.delete(w),Z.push(w.slot),tt&&(J.position.set(0,-60,0),J.rotation.set(0,0,0),J.scale.setScalar(0),J.updateMatrix(),tt.setMatrixAt(w.slot,J.matrix),xt=!0)}function b(w){return w.broken?!1:(w.broken=!0,w.fall=1e-4,et.add(w),gt(w),!0)}return{group:r,tiles:q,core:X,arenaRadius:h,get tileCount(){let w=0;for(const N of q.values())N.broken||w++;return w},syncTiles(w,N){if(!Array.isArray(w)||w.length===0)return;if(N&&(Rt=N),Dt((N==null?void 0:N.tileSize)??w[0].size??2.5,w.length))for(const $ of q.values())tt.count=Math.max(tt.count,$.slot+1),ht($),rt($);const O=new Set;for(const $ of w){O.add($.key);let it=q.get($.key);if(!it){const ot=Z.length?Z.pop():W++;if(ot>=ft)continue;it=wt($,ot),q.set($.key,it),B.set($.index,it),I.set(Gt($.x,$.z),it),tt.count=Math.max(tt.count,it.slot+1),ht(it),rt(it)}$.crack>it.crack+.02&&!$.broken&&($.crack>.32&&Tt(it),et.add(it)),it.crack=$.crack,$.broken?b(it):it.broken&&(it.broken=!1,it.fall=0,it.displayCrack=$.crack,ht(it),rt(it))}if(O.size!==q.size)for(const $ of[...q.values()])O.has($.key)||R($)},breakTile(w){const N=this.findTile(w);return N?(b(N),N):null},crackTile(w,N=.5){const F=this.findTile(w);return!F||F.broken?null:(F.crack=Math.max(F.crack,N),F.crack>.32&&Tt(F),et.add(F),F)},findTile({tileIndex:w=null,tileId:N=null,x:F=null,z:O=null}={}){return w!=null&&B.has(w)?B.get(w):N!=null&&q.has(String(N))?q.get(String(N)):Number.isFinite(F)&&Number.isFinite(O)?I.get(Gt(F,O))??null:null},hasFloorAt(w,N){const F=I.get(Gt(w,N));return!!F&&!F.broken},update(w,N){M.uniforms.uTime.value=N;for(const F of P){const O=F.userData.bob;F.position.y=O.base+Math.sin(N*.4+O.phase)*O.amp,F.rotation.y+=O.spin*w}for(const F of et){let O=!0;F.broken&&F.fall<1&&(F.fall=Math.min(1,F.fall+w*.8),O=!1);const $=F.broken?1:F.crack;Math.abs(F.displayCrack-$)>.002?(F.displayCrack+=($-F.displayCrack)*Math.min(1,w*5),ht(F),O=!1):F.displayCrack!==$&&(F.displayCrack=$,ht(F)),rt(F),O&&et.delete(F)}xt&&tt&&(tt.instanceMatrix.needsUpdate=!0,xt=!1);for(const F of q.values())if(F.decals.length!==0)for(const O of F.decals){const $=F.broken?0:.2+F.displayCrack*.45;O.mat.opacity+=($-O.mat.opacity)*Math.min(1,w*3),O.mesh.visible=O.mat.opacity>.01}},surfaceY(){return 0},dispose(){var w,N;i.remove(r),r.traverse(F=>{var O,$;(F.isMesh||F.isInstancedMesh)&&(($=(O=F.geometry)==null?void 0:O.dispose)==null||$.call(O))}),(w=tt==null?void 0:tt.dispose)==null||w.call(tt);for(const F of o)(N=F.dispose)==null||N.call(F);q.clear(),B.clear(),I.clear(),et.clear(),Z.length=0,W=0}}}function B0({scene:i,quality:t,sunDir:e}){const n=new xc(qt.keyLight,3.6);if(n.position.copy(e).multiplyScalar(60),n.target.position.set(0,0,0),i.add(n),i.add(n.target),t.shadows){n.castShadow=!0,n.shadow.mapSize.set(t.shadowMapSize,t.shadowMapSize),n.shadow.camera.near=5,n.shadow.camera.far=140;const l=30;n.shadow.camera.left=-l,n.shadow.camera.right=l,n.shadow.camera.top=l,n.shadow.camera.bottom=-l,n.shadow.bias=-.0016,n.shadow.normalBias=.05,n.shadow.radius=t.softShadows?3.2:1,n.shadow.camera.updateProjectionMatrix()}const s=new b0(qt.fillSky,qt.fillBounce,.95);s.position.set(0,30,0),i.add(s);const r=new xc(qt.rimLight,t.rimLight?1.05:.45);r.position.set(e.z*46,24,-e.x*46),r.target.position.set(0,1.2,0),i.add(r),i.add(r.target);let o=null,a=null;t.crackFillLight&&(o=new vc(qt.crackLight,26,20,2),o.position.set(0,-13.2,0),i.add(o),a=new vc(qt.crackLight,11,15,2),a.position.set(0,-1.7,0),i.add(a));const c=new U;return{key:n,ambient:s,rim:r,crack:o,seam:a,update(l,h){if(c.copy(h),n.target.position.set(c.x,0,c.z),n.position.set(c.x+e.x*60,e.y*60,c.z+e.z*60),n.target.updateMatrixWorld(),r.target.position.set(c.x,1.2,c.z),r.position.set(c.x+e.z*46,24,c.z-e.x*46),r.target.updateMatrixWorld(),o){const u=.86+Math.sin(l*1.7)*.06+Math.sin(l*4.3+1.1)*.04;o.intensity=26*u,a.intensity=11*u}},setShadowsEnabled(l){n.castShadow=l&&t.shadows},dispose(){var l,h,u,f,d;i.remove(n),i.remove(n.target),i.remove(s),i.remove(r),i.remove(r.target),o&&i.remove(o),a&&i.remove(a),(l=n.dispose)==null||l.call(n),(h=s.dispose)==null||h.call(s),(u=r.dispose)==null||u.call(r),(f=o==null?void 0:o.dispose)==null||f.call(o),(d=a==null?void 0:a.dispose)==null||d.call(a)}}}const Tc=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`,z0=`
  uniform sampler2D uTex;
  uniform vec2 uDir;
  uniform float uThreshold;
  uniform float uSoftKnee;
  varying vec2 vUv;

  vec3 prefilter(vec3 c) {
    if (uThreshold < 0.0) return c;
    float br = max(c.r, max(c.g, c.b));
    float knee = uThreshold * uSoftKnee + 1e-5;
    float soft = clamp(br - uThreshold + knee, 0.0, 2.0 * knee);
    soft = soft * soft / (4.0 * knee);
    float contrib = max(soft, br - uThreshold) / max(br, 1e-5);
    return c * contrib;
  }

  void main() {
    // 9 抽头高斯，权重按 sigma≈2 取
    float w[5];
    w[0] = 0.227027; w[1] = 0.194594; w[2] = 0.121621; w[3] = 0.054054; w[4] = 0.016216;
    vec3 sum = prefilter(texture2D(uTex, vUv).rgb) * w[0];
    for (int i = 1; i < 5; i++) {
      vec2 off = uDir * float(i);
      sum += prefilter(texture2D(uTex, vUv + off).rgb) * w[i];
      sum += prefilter(texture2D(uTex, vUv - off).rgb) * w[i];
    }
    gl_FragColor = vec4(sum, 1.0);
  }
`,k0=`
  uniform sampler2D uScene;
  #ifdef USE_BLOOM
    uniform sampler2D uBloom;
    uniform float uBloomStrength;
  #endif
  uniform float uExposure;
  uniform float uVignette;
  varying vec2 vUv;

  // ACES 拟合（Stephen Hill）：高光缓慢滚降，不会死白
  const mat3 ACES_IN = mat3(
    0.59719, 0.07600, 0.02840,
    0.35458, 0.90834, 0.13383,
    0.04823, 0.01566, 0.83777
  );
  const mat3 ACES_OUT = mat3(
     1.60475, -0.10208, -0.00327,
    -0.53108,  1.10813, -0.07276,
    -0.07367, -0.00605,  1.07602
  );

  vec3 rrt(vec3 v) {
    vec3 a = v * (v + 0.0245786) - 0.000090537;
    vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
    return a / b;
  }

  vec3 acesFitted(vec3 c) {
    c = ACES_IN * c;
    c = rrt(c);
    c = ACES_OUT * c;
    return clamp(c, 0.0, 1.0);
  }

  vec3 linearToSrgb(vec3 c) {
    return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(0.41666)) - 0.055, step(0.0031308, c));
  }

  float hash21(vec2 p) {
    p = fract(p * vec2(233.34, 851.73));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 col = texture2D(uScene, vUv).rgb;
    #ifdef USE_BLOOM
      col += texture2D(uBloom, vUv).rgb * uBloomStrength;
    #endif

    // 极轻的暗角：把视线收回画面中央，不做成滤镜
    vec2 d = vUv - 0.5;
    float vig = 1.0 - dot(d, d) * uVignette;
    col *= vig;

    col = acesFitted(col * uExposure);
    col = linearToSrgb(col);
    // 抖动，消除暗部色带
    col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
  }
`;function V0(){const i=new xe;return i.setAttribute("position",new Zt([-1,-1,0,3,-1,0,-1,3,0],3)),i.setAttribute("uv",new Zt([0,0,2,0,0,2],2)),i}const G0=new pt(0,0,0);function H0({renderer:i,scene:t,quality:e}){const n=new ct(1,1);i.getDrawingBufferSize(n);const s=(M,x,C={})=>new Dn(Math.max(1,Math.floor(M)),Math.max(1,Math.floor(x)),{type:Ci,format:ze,minFilter:Re,magFilter:Re,depthBuffer:C.depth!==!1,stencilBuffer:!1,samples:C.samples??0,colorSpace:$e,...C.extra}),r=e.bloom!==!1&&e.bloomIterations>0&&e.bloomStrength>0;let o=s(n.x,n.y,{samples:e.msaa});const a=e.bloomScale;let c=r?s(n.x*a,n.y*a,{depth:!0}):null,l=r?s(n.x*a,n.y*a,{depth:!1}):null,h=r?s(n.x*a,n.y*a,{depth:!1}):null;const u=V0(),f=new Zo,d=new Xo(-1,1,1,-1,0,1),g=r?new we({vertexShader:Tc,fragmentShader:z0,depthTest:!1,depthWrite:!1,uniforms:{uTex:{value:null},uDir:{value:new ct},uThreshold:{value:.85},uSoftKnee:{value:.6}}}):null,v=new we({vertexShader:Tc,fragmentShader:k0,defines:r?{USE_BLOOM:""}:{},depthTest:!1,depthWrite:!1,uniforms:r?{uScene:{value:o.texture},uBloom:{value:l.texture},uBloomStrength:{value:e.bloomStrength},uExposure:{value:1.25},uVignette:{value:.42}}:{uScene:{value:o.texture},uExposure:{value:1.25},uVignette:{value:.42}}}),m=new kt(u,v);m.frustumCulled=!1,f.add(m);const p=new WeakMap,y=new WeakMap,E=[];function _(M){let x=y.get(M);return x||(x=new Zn({color:G0,transparent:!1,depthWrite:M.depthWrite!==!1,depthTest:M.depthTest!==!1,side:M.side}),y.set(M,x)),x}function D(M,x){if(!M)return null;if(M.isShaderMaterial||M.isRawShaderMaterial)return M;if(x.userData.bloomSelf&&M.isMeshBasicMaterial){let C=p.get(M);C||(C=M.clone(),C.toneMapped=!1,p.set(M,C));const k=x.userData.bloomBoost??2.4;return C.color.copy(M.color).multiplyScalar(k),C.opacity=M.opacity,C.map=M.map,C}if(M.emissive&&(M.emissiveIntensity??0)>.001){let C=p.get(M);return C||(C=new Zn({transparent:M.transparent,depthWrite:M.depthWrite!==!1,side:M.side,toneMapped:!1}),p.set(M,C)),C.color.copy(M.emissive).multiplyScalar(M.emissiveIntensity??1),C.map=M.emissiveMap??null,C.opacity=M.opacity,C}return _(M)}function S(M){const x=M.material;let C;Array.isArray(x)?C=x.map(k=>D(k,M)):C=D(x,M),C!==x&&(E.push({object:M,original:x}),M.material=C)}function A(M){E.length=0;const x=[];t.traverse(C=>{if(C.visible){if(C.isPoints){C.userData.bloomSelf||(x.push(C),C.visible=!1);return}!C.isMesh&&!C.isInstancedMesh||S(C)}}),i.setRenderTarget(c),i.setClearColor(0,1),i.clear(!0,!0,!1),i.render(t,M);for(const C of E)C.object.material=C.original;E.length=0;for(const C of x)C.visible=!0}function P(M){m.material=g;let x=c;for(let C=0;C<M;C++)g.uniforms.uTex.value=x.texture,g.uniforms.uThreshold.value=C===0?.85:-1,g.uniforms.uDir.value.set((1.4+C*1.8)/l.width,0),i.setRenderTarget(l),i.clear(!0,!1,!1),i.render(f,d),g.uniforms.uTex.value=l.texture,g.uniforms.uThreshold.value=-1,g.uniforms.uDir.value.set(0,(1.4+C*1.8)/h.height),i.setRenderTarget(h),i.clear(!0,!1,!1),i.render(f,d),x=h;return x}return{get sceneTarget(){return o},get bloomEnabled(){return r},get debug(){return{composite:v,targets:1+(r?3:0),bloomSize:r?[l.width,l.height]:null}},render(M){if(i.setRenderTarget(o),i.setClearColor(0,1),i.clear(!0,!0,!1),i.render(t,M),r){A(M);const x=P(e.bloomIterations);v.uniforms.uBloom.value=x.texture}v.uniforms.uScene.value=o.texture,m.material=v,i.setRenderTarget(null),i.clear(!0,!0,!1),i.render(f,d)},setSize(M,x){const C=Math.max(1,Math.floor(M)),k=Math.max(1,Math.floor(x));if(o.setSize(C,k),!r)return;const V=Math.max(1,Math.floor(C*a)),X=Math.max(1,Math.floor(k*a));c.setSize(V,X),l.setSize(V,X),h.setSize(V,X)},setBloomStrength(M){r&&(v.uniforms.uBloomStrength.value=M)},setExposure(M){v.uniforms.uExposure.value=M},dispose(){o.dispose(),c==null||c.dispose(),l==null||l.dispose(),h==null||h.dispose(),u.dispose(),g==null||g.dispose(),v.dispose(),o=null,c=null,l=null,h=null}}}const W0=`
  varying vec3 vWorldDir;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(world.xyz - cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`,X0=`
  uniform vec3 uZenith;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uWarm;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform float uExposure;
  varying vec3 vWorldDir;

  float hash21(vec2 p) {
    p = fract(p * vec2(233.34, 851.73));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 dir = normalize(vWorldDir);
    float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

    vec3 col = mix(uHorizon, uMid, smoothstep(0.42, 0.62, h));
    col = mix(col, uZenith, smoothstep(0.58, 0.95, h));

    // 落日方位的暖霾：只在地平线附近、只在太阳那一侧
    float sunAmount = max(dot(dir, uSunDir), 0.0);
    float horizonBand = exp(-pow(max(dir.y, -0.35) * 3.4, 2.0));
    col = mix(col, uWarm, pow(sunAmount, 3.0) * horizonBand * 0.85);

    // 太阳本体：小、柔、不过曝，作为主光的可见依据
    col += uSunColor * pow(sunAmount, 220.0) * 1.6;
    col += uSunColor * pow(sunAmount, 14.0) * 0.12 * horizonBand;

    // 地平线下方渐渐并入云海的冷雾
    col = mix(col * 0.72, col, smoothstep(-0.25, 0.05, dir.y));

    // 稀疏的早星，只在天顶，弱到几乎看不见
    vec2 sp = dir.xz / max(abs(dir.y), 0.001);
    float star = step(0.9985, hash21(floor(sp * 240.0)));
    col += vec3(0.55, 0.62, 0.78) * star * smoothstep(0.55, 0.95, h) * 0.5;

    // 抖动，压掉大面积渐变的色带
    float dither = (hash21(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(col * uExposure + dither, 1.0);
  }
`,Y0=`
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`,q0=`
  uniform sampler2D uNoise;
  uniform vec3 uLit;
  uniform vec3 uShadow;
  uniform vec3 uSunDir;
  uniform float uTime;
  uniform float uDensity;
  uniform float uScale;
  uniform float uOpacity;
  uniform vec3 uHaze;
  uniform float uFadeNear;
  uniform float uFadeFar;
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    vec2 p = vUv * uScale;
    float a = texture2D(uNoise, p + vec2(uTime * 0.004, uTime * 0.0016)).r;
    float b = texture2D(uNoise, p * 2.13 - vec2(uTime * 0.0027, 0.0)).r;
    float c = texture2D(uNoise, p * 0.47 + vec2(0.0, uTime * 0.0009)).r;
    float d = a * 0.5 + b * 0.28 + c * 0.42;

    float mask = smoothstep(uDensity + 0.22, uDensity - 0.08, 1.0 - d);
    // 边缘化开，避免看见平面的直边
    float radial = 1.0 - smoothstep(0.30, 0.5, length(vUv - 0.5));
    float alpha = mask * radial * uOpacity;

    // 距离雾。水平的云板被平视时会在地平线上叠成一堵发白的墙，把暮蓝全洗掉；
    // 让远端的云溶进大气色并把不透明度收掉，云海才是「散开的」而不是「一块板」。
    float dist = length(vWorld - cameraPosition);
    float fade = 1.0 - smoothstep(uFadeNear, uFadeFar, dist);
    alpha *= fade;
    if (alpha < 0.004) discard;

    // 朝太阳一侧的云被打亮，背光侧留冷蓝，云才有体积
    vec3 toSun = normalize(vec3(uSunDir.x, 0.0, uSunDir.z));
    float facing = dot(normalize(vec3(vWorld.x, 0.0, vWorld.z) + 0.0001), toSun) * 0.5 + 0.5;
    vec3 col = mix(uShadow, uLit, facing * 0.75 + d * 0.25);
    col = mix(col, uHaze, smoothstep(uFadeNear * 0.35, uFadeFar, dist) * 0.9);
    gl_FragColor = vec4(col, alpha);
  }
`;function Z0({scene:i,renderer:t,quality:e,textures:n,sunDir:s}){const r=new Yn(900,32,20),o=new we({vertexShader:W0,fragmentShader:X0,side:Le,depthWrite:!1,fog:!1,uniforms:{uZenith:{value:new pt(qt.skyZenith)},uMid:{value:new pt(qt.skyMid)},uHorizon:{value:new pt(qt.skyHorizon)},uWarm:{value:new pt(qt.skyWarm)},uSunColor:{value:new pt(qt.sunDisc)},uSunDir:{value:s.clone().normalize()},uExposure:{value:1}}}),a=new kt(r,o);a.name="sky",a.frustumCulled=!1,a.renderOrder=-1e3;const c=new Ao(t);c.compileEquirectangularShader();const l=new Zo;l.add(a);const h=c.fromScene(l,0,1,2e3);l.remove(a),c.dispose(),i.add(a),i.environment=h.texture,i.environmentIntensity=.45,i.fog=new qo(new pt(qt.fog).getHex(),.0065);const u=[],f=[{y:-34,size:900,density:.46,scale:2.6,opacity:.5,fadeNear:260,fadeFar:1100},{y:-70,size:1500,density:.52,scale:1.7,opacity:.42,fadeNear:460,fadeFar:1900},{y:-120,size:2400,density:.6,scale:1.15,opacity:.4,fadeNear:780,fadeFar:3e3}].slice(0,e.cloudLayers);for(const d of f){const g=new we({vertexShader:Y0,fragmentShader:q0,transparent:!0,depthWrite:!1,side:Ce,fog:!1,uniforms:{uNoise:{value:n.turbulence},uLit:{value:new pt(qt.cloudLit)},uShadow:{value:new pt(qt.cloudShadow)},uSunDir:{value:s.clone().normalize()},uTime:{value:0},uDensity:{value:d.density},uScale:{value:d.scale},uOpacity:{value:d.opacity},uHaze:{value:new pt(qt.fog).lerp(new pt(qt.skyHorizon),.5)},uFadeNear:{value:d.fadeNear},uFadeFar:{value:d.fadeFar}}}),v=new kt(new $n(d.size,d.size,1,1),g);v.rotation.x=-Math.PI/2,v.position.y=d.y,v.renderOrder=-900,v.frustumCulled=!1,i.add(v),u.push(v)}return{skyMesh:a,clouds:u,envRT:h,update(d,g){a.position.copy(g);for(const v of u)v.material.uniforms.uTime.value=d,v.position.x=g.x*.35,v.position.z=g.z*.35},dispose(){i.remove(a),r.dispose(),o.dispose();for(const d of u)i.remove(d),d.geometry.dispose(),d.material.dispose();h.dispose(),i.environment=null,i.fog=null}}}const wc=new U(-.58,.42,.38).normalize();function Ml(i){if(typeof OffscreenCanvas<"u")try{return new OffscreenCanvas(i,i)}catch{}if(typeof document>"u")return null;const t=document.createElement("canvas");return t.width=i,t.height=i,t}function Qe(i,t,{srgb:e=!1,wrap:n=Ei}={}){const s=Ml(i);if(!s)return null;const r=s.getContext("2d",{willReadFrequently:!1}),o=r.createImageData(i,i);t(o.data,i),r.putImageData(o,0,0);const a=new hl(s);return a.wrapS=n,a.wrapT=n,a.colorSpace=e?Ue:$e,a.minFilter=sn,a.magFilter=Re,a.anisotropy=4,a.needsUpdate=!0,a}function as(i,t,e){const n=new Uint8Array(t*t*4),s=(u,f)=>i[(f+t)%t*t+(u+t)%t],r=new Float32Array(t*t),o=new Float32Array(t*t);let a=0;for(let u=0;u<t;u++)for(let f=0;f<t;f++){const d=u*t+f;r[d]=s(f+1,u)-s(f-1,u),o[d]=s(f,u+1)-s(f,u-1),a+=r[d]*r[d]+o[d]*o[d]}const c=Math.sqrt(a/(t*t*2))||1e-6,l=e/c;for(let u=0;u<t;u++)for(let f=0;f<t;f++){const d=u*t+f;let g=-r[d]*l,v=-o[d]*l,m=1;const p=Math.hypot(g,v,m)||1;g/=p,v/=p,m/=p;const y=(u*t+f)*4;n[y]=Math.round((g*.5+.5)*255),n[y+1]=Math.round((v*.5+.5)*255),n[y+2]=Math.round((m*.5+.5)*255),n[y+3]=255}const h=new ll(n,t,t,ze,on);return h.wrapS=Ei,h.wrapT=Ei,h.minFilter=sn,h.magFilter=Re,h.generateMipmaps=!0,h.colorSpace=$e,h.needsUpdate=!0,h}function Uo(i,t,e){const n=i>>16&255,s=i>>8&255,r=i&255,o=t>>16&255,a=t>>8&255,c=t&255;return[n+(o-n)*e,s+(a-s)*e,r+(c-r)*e]}function K0(i,t,e){const n=He(t),s=He(t+977),r=new Float32Array(i*i),o=Qe(i,(c,l)=>{for(let h=0;h<l;h++){const u=h/l;for(let f=0;f<l;f++){const d=f/l,g=$t(n,d*6,u*3,3)*.12,v=rs(s,d*3,(u+g)*7,3),m=$t(n,d*18,u*18,4,.55),p=$t(s,d*22,u*1.2,3),y=re(.52,.86,p)*re(.05,.7,u),E=re(.62,.16,v);r[h*l+f]=v*.72+m*.11+y*.17;const _=.35+.5*(1-u);let[D,S,A]=Uo(3816774,7169368,_*(.45+v*.55));const P=re(.78,.98,v)*.5,[M,x,C]=Uo(0,9143160,1);D+=M*P*.35,S+=x*P*.35,A+=C*P*.35;const k=E*.55+y*.6;D*=1-k*.55,S*=1-k*.5,A*=1-k*.42;const V=(m-.5)*14,X=(h*l+f)*4;c[X]=Math.max(0,Math.min(255,D+V)),c[X+1]=Math.max(0,Math.min(255,S+V*.7)),c[X+2]=Math.max(0,Math.min(255,A+V*.4)),c[X+3]=255}}},{srgb:!0}),a=Qe(i,(c,l)=>{for(let h=0;h<l;h++){const u=h/l;for(let f=0;f<l;f++){const d=f/l,g=$t(n,d*18,u*18,4,.55),v=$t(s,d*22,u*1.2,3),p=.98-re(.52,.86,v)*re(.05,.7,u)*.16+(g-.5)*.07,y=(h*l+f)*4,E=Math.max(0,Math.min(255,p*255));c[y]=E,c[y+1]=E,c[y+2]=E,c[y+3]=255}}});return{albedo:o,rough:a,normal:e?as(r,i,.3):null}}function J0(i,t,e){const n=He(t+31),s=He(t+1301),r=new Float32Array(i*i),o=Qe(i,(c,l)=>{for(let h=0;h<l;h++)for(let u=0;u<l;u++){const f=u/l,d=h/l,g=$t(n,f*17,d*17,3,.55),v=$t(s,f*2.2,d*2.2,4),m=Ec($t(s,f*5+11,d*5,3),1.4),p=re(.84,.98,rs(n,f*22+d*5,d*1.6,2));r[h*l+u]=v*.8+g*.08+p*.12;let[y,E,_]=Uo(4999756,6643540,.25+v*.75);const D=(g-.5)*8;y+=D,E+=D*.9,_+=D*.75,y=y*(1-m*.16)+124*m*.16,E=E*(1-m*.16)+118*m*.16,_=_*(1-m*.16)+109*m*.16,y+=p*15,E+=p*14,_+=p*12;const S=(h*l+u)*4;c[S]=Math.max(0,Math.min(255,y)),c[S+1]=Math.max(0,Math.min(255,E)),c[S+2]=Math.max(0,Math.min(255,_)),c[S+3]=255}},{srgb:!0}),a=Qe(i,(c,l)=>{for(let h=0;h<l;h++)for(let u=0;u<l;u++){const f=u/l,d=h/l,g=Ec($t(s,f*5+11,d*5,3),1.4),v=re(.84,.98,rs(n,f*22+d*5,d*1.6,2)),m=.74+g*.2-v*.26,p=Math.max(0,Math.min(255,m*255)),y=(h*l+u)*4;c[y]=p,c[y+1]=p,c[y+2]=p,c[y+3]=255}});return{albedo:o,rough:a,normal:e?as(r,i,.32):null}}function $0(i,t,e){const n=He(t+77),s=new Float32Array(i*i);return{rough:Qe(i,(o,a)=>{for(let c=0;c<a;c++)for(let l=0;l<a;l++){const h=l/a,u=c/a,f=$t(n,h*64,u*64,3,.62),d=rs(n,h*7,u*7,3),g=re(.55,.95,d);s[c*a+l]=f*.35+d*.65;const v=.86-g*.34+(f-.5)*.1,m=Math.max(0,Math.min(255,v*255)),p=(c*a+l)*4;o[p]=m,o[p+1]=m,o[p+2]=m,o[p+3]=255}}),normal:e?as(s,i,.45):null}}function j0(i,t,e){const n=He(t+401),s=new Float32Array(i*i);return{rough:Qe(i,(o,a)=>{for(let c=0;c<a;c++)for(let l=0;l<a;l++){const h=l/a,u=c/a,f=Math.sin(h*Math.PI*2*(a/4))*.5+.5,d=Math.sin(u*Math.PI*2*(a/4))*.5+.5,g=(f*.5+d*.5)*.4+$t(n,h*12,u*12,3)*.6;s[c*a+l]=g;const v=.93+(g-.5)*.1,m=Math.max(0,Math.min(255,v*255)),p=(c*a+l)*4;o[p]=m,o[p+1]=m,o[p+2]=m,o[p+3]=255}}),normal:e?as(s,i,.3):null}}function Q0(i,t,e){const n=He(t+613),s=new Float32Array(i*i);return{rough:Qe(i,(o,a)=>{for(let c=0;c<a;c++)for(let l=0;l<a;l++){const h=l/a,u=c/a,f=$t(n,h*90,u*3,3,.6),d=$t(n,h*5+3,u*5,3),g=re(.62,.9,d);s[c*a+l]=f*.25+d*.2;const v=.3+f*.2+g*.45,m=Math.max(0,Math.min(255,v*255)),p=(c*a+l)*4;o[p]=m,o[p+1]=m,o[p+2]=m,o[p+3]=255}}),normal:e?as(s,i,.2):null}}function tg(i,t){const e=He(t+907);return Qe(i,(n,s)=>{const r=(s-1)/2;for(let o=0;o<s;o++)for(let a=0;a<s;a++){const c=(a-r)/r,l=(o-r)/r,h=Math.hypot(c,l),u=Math.atan2(l,c),f=$t(e,Math.cos(u)*3+4,Math.sin(u)*3+4,4)*.42,d=$t(e,a/s*7,o/s*7,4);let g=re(1+f,.15,h)*(.55+d*.75);g=Math.max(0,Math.min(1,g));const v=(o*s+a)*4;n[v]=255,n[v+1]=255,n[v+2]=255,n[v+3]=g*255}},{wrap:nn})}function eg(i){return Qe(i,(t,e)=>{const n=(e-1)/2;for(let s=0;s<e;s++)for(let r=0;r<e;r++){const o=Math.hypot((r-n)/n,(s-n)/n),a=re(.22,0,o),c=re(1,.1,o)*.35,l=Math.max(0,Math.min(1,a+c)),h=(s*e+r)*4;t[h]=255,t[h+1]=255,t[h+2]=255,t[h+3]=l*255}},{wrap:nn})}function ng(i,t){const e=Ml(i);if(!e)return null;const n=e.getContext("2d");n.clearRect(0,0,i,i);const s=tr(t+5),r=i/2,o=i/2,a=5;n.strokeStyle="#150f0c",n.lineCap="round",n.lineJoin="round";for(let h=0;h<a;h++){const u=h/a*Math.PI*2+s()*.9;let f=r,d=o,g=u;const v=5+Math.floor(s()*3);let m=i*.016;const p=i*.34/v;n.globalAlpha=.8;for(let y=0;y<v;y++){g+=(s()-.5)*.85;const E=f+Math.cos(g)*p,_=d+Math.sin(g)*p;if(n.beginPath(),n.lineWidth=Math.max(.7,m),n.moveTo(f,d),n.lineTo(E,_),n.stroke(),s()<.45&&y<v-1){const D=g+(s()-.5)*1.7;n.beginPath(),n.lineWidth=Math.max(.6,m*.5),n.moveTo(E,_),n.lineTo(E+Math.cos(D)*p*.8,_+Math.sin(D)*p*.8),n.stroke()}f=E,d=_,m*=.74}}n.globalAlpha=1;const c=n.createRadialGradient(r,o,0,r,o,i*.3);c.addColorStop(0,"rgba(214, 138, 74, 0.62)"),c.addColorStop(.45,"rgba(140, 68, 26, 0.3)"),c.addColorStop(1,"rgba(0, 0, 0, 0)"),n.globalCompositeOperation="source-atop",n.fillStyle=c,n.fillRect(0,0,i,i),n.globalCompositeOperation="source-over";const l=new hl(e);return l.colorSpace=Ue,l.minFilter=sn,l.magFilter=Re,l.needsUpdate=!0,l}function ig(i,t){const e=He(t+3301),n=He(t+5507);return Qe(i,(s,r)=>{for(let o=0;o<r;o++)for(let a=0;a<r;a++){const c=a/r,l=o/r,h=c-.5,u=l-.5,f=Math.hypot(h,u)*2,d=$t(e,c*3.1,l*3.1,4,.55),g=rs(n,c*4.3+7,l*4.3+7,3),v=$t(n,c*9.5,l*9.5,3,.5),m=re(.45,1,f),p=re(.62,.08,f);let y=.62+d*.42+g*.3+v*.14;y*=1-m*.3,y*=1+p*.2;const E=Math.max(0,Math.min(255,y*200)),_=(o*r+a)*4;s[_]=E,s[_+1]=E,s[_+2]=E,s[_+3]=255}},{wrap:nn})}function sg(i,t){const e=He(t+1777);return Qe(i,(n,s)=>{for(let r=0;r<s;r++)for(let o=0;o<s;o++){const a=$t(e,o/s*8,r/s*8,4,.55),c=Math.max(0,Math.min(255,a*255)),l=(r*s+o)*4;n[l]=c,n[l+1]=c,n[l+2]=c,n[l+3]=255}})}function rg(i,t=20240501){const e=i.texRock,n=i.texDetail,s=i.normalMaps,r=K0(e,t,s),o=J0(e,t,s),a=$0(n,t,s),c=j0(n,t,s),l=Q0(n,t,s),h={cliff:r,crust:o,leather:a,cloth:c,metal:l,dust:tg(Math.max(64,n),t),ember:eg(64),crack:ng(Math.max(128,n*2),t),turbulence:sg(Math.max(64,n),t),arenaMacro:ig(Math.max(128,e),t),dispose(){const u=new Set,f=d=>{d&&!u.has(d)&&(u.add(d),d.dispose())};[r,o,a,c,l].forEach(d=>{d&&(f(d.albedo),f(d.rough),f(d.normal))}),f(h.dust),f(h.ember),f(h.crack),f(h.turbulence),f(h.arenaMacro)}};return h}const og=1,ag=`
  attribute float aSize;
  attribute float aAlpha;
  attribute float aRot;
  attribute vec3 aColor;
  uniform float uPixelScale;
  varying float vAlpha;
  varying float vRot;
  varying vec3 vColor;
  varying float vFog;
  void main() {
    vAlpha = aAlpha;
    vRot = aRot;
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float dist = -mv.z;
    vFog = 1.0 - exp(-pow(dist * 0.0065, 2.0));
    gl_PointSize = aSize * uPixelScale / max(dist, 0.4);
    gl_Position = projectionMatrix * mv;
  }
`,cg=`
  uniform sampler2D uMap;
  uniform vec3 uFogColor;
  uniform float uFogAmount;
  varying float vAlpha;
  varying float vRot;
  varying vec3 vColor;
  varying float vFog;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float s = sin(vRot);
    float c = cos(vRot);
    uv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c) + 0.5;
    vec4 tex = texture2D(uMap, uv);
    float a = tex.a * vAlpha;
    if (a < 0.004) discard;
    vec3 col = mix(vColor, uFogColor, vFog * uFogAmount);
    gl_FragColor = vec4(col, a);
  }
`,lg=`
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`,hg=`
  uniform sampler2D uNoise;
  uniform vec3 uColorLit;
  uniform vec3 uColorDark;
  uniform float uLife;
  uniform float uOpacity;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec2 vUv;
  void main() {
    // 菲涅尔：只有掠射角的壳面可见，中间是空的，读起来才是「一层被压缩的空气」
    float fres = 1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir)));
    fres = pow(clamp(fres, 0.0, 1.0), 2.6);

    // 湍流把完美球壳撕开成絮状
    float n = texture2D(uNoise, vUv * 2.4 + vec2(uLife * 0.35, uLife * -0.2)).r;
    float n2 = texture2D(uNoise, vUv * 5.1 - vec2(uLife * 0.6, 0.0)).r;
    float turb = n * 0.65 + n2 * 0.35;

    // 湍流把壳撕出缺口：完整闭合的球壳就是「光球」，正是要避免的东西
    float shell = fres * smoothstep(0.25, 0.8, turb) * (0.4 + turb * 0.8);
    float fade = (1.0 - uLife) * (1.0 - uLife);
    float alpha = shell * fade * uOpacity;
    if (alpha < 0.004) discard;

    vec3 col = mix(uColorDark, uColorLit, clamp(turb * 1.3 - uLife * 0.4, 0.0, 1.0));
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`,ug=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,fg=`
  uniform sampler2D uNoise;
  uniform vec3 uColor;
  uniform float uLife;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float band = smoothstep(0.55, 0.92, r) * (1.0 - smoothstep(0.94, 1.02, r));
    float n = texture2D(uNoise, vUv * 3.0 + vec2(uLife * 0.2, 0.0)).r;
    float n2 = texture2D(uNoise, vUv * 7.0 - vec2(0.0, uLife * 0.3)).r;
    float alpha = band * (0.25 + n * 0.9 * n2 * 1.6) * (1.0 - uLife) * uOpacity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
  }
`;function Ac({scene:i,budget:t,texture:e,blending:n,depthWrite:s,renderOrder:r}){const o=new Float32Array(t*3),a=new Float32Array(t),c=new Float32Array(t),l=new Float32Array(t),h=new Float32Array(t*3),u=new xe,f=new Zt(o,3).setUsage(Rn),d=new Zt(a,1).setUsage(Rn),g=new Zt(c,1).setUsage(Rn),v=new Zt(l,1).setUsage(Rn),m=new Zt(h,3).setUsage(Rn);u.setAttribute("position",f),u.setAttribute("aSize",d),u.setAttribute("aAlpha",g),u.setAttribute("aRot",v),u.setAttribute("aColor",m),u.setDrawRange(0,0);const p=new we({vertexShader:ag,fragmentShader:cg,transparent:!0,depthWrite:!1,blending:n,uniforms:{uMap:{value:e},uPixelScale:{value:520},uFogColor:{value:new pt(qt.fog)},uFogAmount:{value:n===Xs?.2:1}}}),y=new Wm(u,p);return y.frustumCulled=!1,y.renderOrder=r??3,i.add(y),{points:y,geo:u,mat:p,budget:t,count:0,vel:new Float32Array(t*3),life:new Float32Array(t),maxLife:new Float32Array(t),spin:new Float32Array(t),grow:new Float32Array(t),drag:new Float32Array(t),baseSize:new Float32Array(t),baseAlpha:new Float32Array(t),arrays:{pos:o,size:a,alpha:c,rot:l,color:h},attrs:{posAttr:f,sizeAttr:d,alphaAttr:g,rotAttr:v,colorAttr:m},dispose(){i.remove(y),u.dispose(),p.dispose()}}}function dg(i,t){const e=i.count-1;if(t!==e){const n=i.arrays;for(let s=0;s<3;s++)n.pos[t*3+s]=n.pos[e*3+s],n.color[t*3+s]=n.color[e*3+s],i.vel[t*3+s]=i.vel[e*3+s];n.size[t]=n.size[e],n.alpha[t]=n.alpha[e],n.rot[t]=n.rot[e],i.life[t]=i.life[e],i.maxLife[t]=i.maxLife[e],i.spin[t]=i.spin[e],i.grow[t]=i.grow[e],i.drag[t]=i.drag[e],i.baseSize[t]=i.baseSize[e],i.baseAlpha[t]=i.baseAlpha[e]}i.count=e}function pg({scene:i,quality:t,textures:e,seed:n=4242}){const s=tr(n),r=new Ee;r.name="vfx",i.add(r);const o=Ac({scene:r,budget:t.dustBudget,texture:e.dust,blending:vn,depthWrite:!1,renderOrder:3}),a=Ac({scene:r,budget:t.emberBudget,texture:e.ember,blending:Xs,depthWrite:!1,renderOrder:4});a.points.layers.enable(og),a.points.userData.bloomSelf=!0;const c=new pt(qt.grime).lerp(new pt(qt.rockBody),.4),l=new pt(qt.rockTop).lerp(new pt(qt.keyLight),.28),h=new pt(16773327),u=new pt(qt.crackDeep),f=new pt;function d(q,B,I,Z,W){if(q.count>=q.budget)return;const et=q.count++,xt=q.arrays;xt.pos[et*3]=B,xt.pos[et*3+1]=I,xt.pos[et*3+2]=Z,q.vel[et*3]=W.vx,q.vel[et*3+1]=W.vy,q.vel[et*3+2]=W.vz,q.life[et]=0,q.maxLife[et]=W.life,q.spin[et]=W.spin,q.grow[et]=W.grow,q.drag[et]=W.drag,q.baseSize[et]=W.size,q.baseAlpha[et]=W.alpha,xt.size[et]=W.size,xt.alpha[et]=W.alpha,xt.rot[et]=s()*Math.PI*2,xt.color[et*3]=W.color.r,xt.color[et*3+1]=W.color.g,xt.color[et*3+2]=W.color.b}function g(q,B,I,Z,W,et,xt=1){for(let Rt=0;Rt<Z;Rt++){const Gt=s()*Math.PI*2,rt=Math.pow(s(),.6);f.copy(c).lerp(l,s()*.85),d(o,q+(s()-.5)*.25,B+s()*.2,I+(s()-.5)*.25,{vx:Math.cos(Gt)*rt*W,vy:et*(.35+s()*.9),vz:Math.sin(Gt)*rt*W,life:.9+s()*1.7,spin:(s()-.5)*1.4,grow:(1.6+s()*2.2)*xt,drag:1.9+s()*1.4,size:(.5+s()*.9)*xt,alpha:.3+s()*.3,color:f})}}function v(q,B,I,Z,W){for(let et=0;et<Z;et++){const xt=s()*Math.PI*2,Rt=1.5+s()*3.5;f.copy(h),d(a,q,B,I,{vx:Math.cos(xt)*(1+s()*2.4)*W,vy:Rt,vz:Math.sin(xt)*(1+s()*2.4)*W,life:.7+s()*1.1,spin:0,grow:-.5,drag:.6,size:.06+s()*.09,alpha:.9,color:f})}}const m=new Yn(1,20,14),p=new Qo(.05,1,40,1),y=[],E=[];function _(){const q=new we({vertexShader:lg,fragmentShader:hg,transparent:!0,depthWrite:!1,side:Ce,blending:vn,uniforms:{uNoise:{value:e.turbulence},uColorLit:{value:new pt(qt.rockTop).lerp(new pt(qt.keyLight),.35)},uColorDark:{value:new pt(qt.fog).lerp(new pt(qt.grime),.35)},uLife:{value:0},uOpacity:{value:.9}}}),B=new kt(m,q);B.visible=!1,B.renderOrder=2,r.add(B);const I={mesh:B,mat:q,t:-1,dur:.3,scale:new U(1,1,1)};return y.push(I),I}function D(){const q=new we({vertexShader:ug,fragmentShader:fg,transparent:!0,depthWrite:!1,side:Ce,blending:vn,uniforms:{uNoise:{value:e.turbulence},uColor:{value:new pt(qt.rockTop).lerp(new pt(qt.keyLight),.2)},uLife:{value:0},uOpacity:{value:.6}}}),B=new kt(p,q);B.rotation.x=-Math.PI/2,B.visible=!1,B.renderOrder=2,r.add(B);const I={mesh:B,mat:q,t:-1,dur:.55,radius:3};return E.push(I),I}const S=Array.from({length:t.shockRings+2},_),A=Array.from({length:t.shockRings+1},D);function P(){return S.find(q=>q.t<0)??S[0]}function M(){return A.find(q=>q.t<0)??A[0]}const x=new ss(.16,0),C=new be({color:new pt(6643026),roughness:.98,metalness:0,flatShading:!0,envMapIntensity:.15}),k=new Ws(x,C,t.debrisBudget);k.instanceMatrix.setUsage(Rn),k.castShadow=t.shadows,k.frustumCulled=!1,k.count=0,r.add(k);const V=[],X=new de,J=new $n(1,1),Y=[];let tt=0;for(let q=0;q<t.decalBudget;q++){const B=new Zn({map:e.crack,transparent:!0,depthWrite:!1,opacity:0,polygonOffset:!0,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),I=new kt(J,B);I.rotation.x=-Math.PI/2,I.visible=!1,I.renderOrder=2,r.add(I),Y.push({mesh:I,mat:B,t:-1,hold:0})}function K(q,B,I,Z){if(Y.length===0)return;const W=Y[tt%Y.length];tt++,W.mesh.position.set(q,.016,B),W.mesh.rotation.z=s()*Math.PI*2,W.mesh.scale.setScalar(I),W.mesh.visible=!0,W.t=0,W.peak=.24+Z*.2}const ft=new U(0,1,0),ut=new U;let _t=0;const Dt={group:r,slap(q,B,I=1){const Z=Math.max(.35,Math.min(2.2,I));ut.copy(B??ft),ut.y=0,ut.lengthSq()<1e-5&&ut.set(0,0,1),ut.normalize();const W=P();W.t=0,W.dur=.26+Z*.09,W.mesh.position.copy(q),W.mesh.visible=!0,W.mesh.lookAt(q.x+ut.x,q.y,q.z+ut.z),W.scale.set(.85*Z,.6*Z,.36*Z),W.mat.uniforms.uOpacity.value=.38+Z*.14,g(q.x+ut.x*.3,q.y,q.z+ut.z*.3,Math.round(15*Z*(t.name==="low"?.4:1)),2.6*Z,.8,.8+Z*.2),t.name!=="low"&&v(q.x,q.y,q.z,Math.round(3*Z),.6)},heavyImpact(q,B=1,I={}){const Z=Math.max(.5,Math.min(2.5,B));Dt.slap(q,I.dir??ft,Z);const W=M();W.t=0,W.dur=.5+Z*.15,W.radius=2.4*Z,W.mesh.position.set(q.x,.05,q.z),W.mesh.visible=!0,g(q.x,.1,q.z,Math.round(22*Z*(t.name==="low"?.35:1)),4.2*Z,.5,1.3),v(q.x,.2,q.z,Math.round(6*Z*(t.name==="low"?.3:1)),1),Dt.spawnDebris(q,Z),I.crack!==!1&&K(q.x,q.z,1.9+Z*1.1,Math.min(1,Z/2))},spawnDebris(q,B){const I=Math.round(t.debrisPerBurst*Math.min(1.6,B));for(let Z=0;Z<I&&!(V.length>=t.debrisBudget);Z++){const W=s()*Math.PI*2,et=(1.5+s()*4)*B;V.push({p:new U(q.x+(s()-.5)*.5,q.y+.15,q.z+(s()-.5)*.5),v:new U(Math.cos(W)*et*.6,3+s()*4.5,Math.sin(W)*et*.6),rot:new U(s()*6,s()*6,s()*6),spin:new U((s()-.5)*9,(s()-.5)*9,(s()-.5)*9),scale:.32+s()*.7,life:0,maxLife:2+s()*1.2})}},footDust(q,B,I,Z){t.footDust&&(Z<3.2||g(q,B+.06,I,1,.6,.25,.55))},fallTrail(q,B,I){g(q,B,I,1,.5,-.4,.9)},ambientDrift(q,B){if(t.name==="low")return;_t+=q;const I=t.name==="high"?.16:.34;for(;_t>I;){_t-=I;const Z=s()*Math.PI*2,W=2+s()*13;f.copy(c).lerp(l,s()*.7),d(o,B.x+Math.cos(Z)*W,.3+s()*4.5,B.z+Math.sin(Z)*W,{vx:(s()-.5)*.25,vy:.18+s()*.3,vz:(s()-.5)*.25,life:4+s()*4,spin:(s()-.5)*.3,grow:.5,drag:.25,size:.16+s()*.3,alpha:.05+s()*.07,color:f})}},awakenMotes(q,B,I){t.name!=="low"&&(s()>.35||v(q,B,I,1,.25))},crack(q,B,I=4,Z=1){K(q,B,I,Z)},update(q,B){for(const I of[o,a]){const Z=I.arrays,W=I===a;for(let et=I.count-1;et>=0;et--){I.life[et]+=q;const xt=I.life[et]/I.maxLife[et];if(xt>=1){dg(I,et);continue}const Rt=Math.exp(-I.drag[et]*q);if(I.vel[et*3]*=Rt,I.vel[et*3+2]*=Rt,I.vel[et*3+1]=W?I.vel[et*3+1]*Rt-2.2*q:(I.vel[et*3+1]-1.1*q)*Rt,Z.pos[et*3]+=I.vel[et*3]*q,Z.pos[et*3+1]+=I.vel[et*3+1]*q,Z.pos[et*3+2]+=I.vel[et*3+2]*q,!W&&Z.pos[et*3+1]<.04&&I.vel[et*3+1]<0&&(Z.pos[et*3+1]=.04,I.vel[et*3+1]=0,I.vel[et*3]*=.86,I.vel[et*3+2]*=.86),Z.rot[et]+=I.spin[et]*q,Z.size[et]=I.baseSize[et]+I.grow[et]*xt,W)f.copy(h).lerp(u,Math.min(1,xt*1.5)),Z.color[et*3]=f.r,Z.color[et*3+1]=f.g,Z.color[et*3+2]=f.b,Z.alpha[et]=I.baseAlpha[et]*(1-xt*xt);else{const Gt=Math.min(1,xt/.12);Z.alpha[et]=I.baseAlpha[et]*Gt*(1-xt)*(1-xt*.4)}}I.geo.setDrawRange(0,I.count),I.count>0&&(I.attrs.posAttr.needsUpdate=!0,I.attrs.sizeAttr.needsUpdate=!0,I.attrs.alphaAttr.needsUpdate=!0,I.attrs.rotAttr.needsUpdate=!0,I.attrs.colorAttr.needsUpdate=!0),I.points.visible=I.count>0}for(const I of y){if(I.t<0)continue;if(I.t+=q/I.dur,I.t>=1){I.t=-1,I.mesh.visible=!1;continue}const Z=1-Math.pow(1-I.t,2.4),W=.45+Z*2.2;I.mesh.scale.set(I.scale.x*W,I.scale.y*W,I.scale.z*W*(1+Z*1.4)),I.mat.uniforms.uLife.value=I.t}for(const I of E){if(I.t<0)continue;if(I.t+=q/I.dur,I.t>=1){I.t=-1,I.mesh.visible=!1;continue}const Z=1-Math.pow(1-I.t,2.6);I.mesh.scale.setScalar(.4+Z*I.radius),I.mat.uniforms.uLife.value=I.t}if(V.length>0){const I=t.mergedDebris;for(let Z=V.length-1;Z>=0;Z--){const W=V[Z];if(W.life+=q,W.life>=W.maxLife){V.splice(Z,1);continue}W.v.y-=22*q,W.p.addScaledVector(W.v,q),W.p.y<.08&&(W.p.y=.08,W.v.y*=-.32,W.v.x*=.62,W.v.z*=.62,W.spin.multiplyScalar(.5)),I||(W.rot.x+=W.spin.x*q,W.rot.y+=W.spin.y*q,W.rot.z+=W.spin.z*q)}k.count=Math.min(V.length,t.debrisBudget);for(let Z=0;Z<k.count;Z++){const W=V[Z];X.position.copy(W.p),X.rotation.set(W.rot.x,W.rot.y,W.rot.z);const et=1-Math.max(0,(W.life-W.maxLife*.7)/(W.maxLife*.3));X.scale.setScalar(W.scale*et),X.updateMatrix(),k.setMatrixAt(Z,X.matrix)}k.instanceMatrix.needsUpdate=!0,k.visible=k.count>0}else k.count!==0&&(k.count=0,k.visible=!1);for(const I of Y){if(I.t<0)continue;I.t+=q;const Z=Math.min(1,I.t/.18),W=I.t>9?Math.max(0,1-(I.t-9)/6):1;I.mat.opacity=(I.peak??.8)*Z*W,W<=0&&(I.t=-1,I.mesh.visible=!1)}},setPixelScale(q){o.mat.uniforms.uPixelScale.value=q,a.mat.uniforms.uPixelScale.value=q},dispose(){o.dispose(),a.dispose(),m.dispose(),p.dispose();for(const q of y)q.mat.dispose();for(const q of E)q.mat.dispose();for(const q of Y)q.mat.dispose();J.dispose(),x.dispose(),C.dispose(),i.remove(r)}};return Dt}const Cc=new U(0,1,0);function Rc(i,t){const e=wl(i);return t.set(e.x,0,e.z)}class mg{constructor(t,e={}){this.canvas=t,this.opts=e,this.tier=la(e.quality??e.tier??"high"),this.quality=kr[this.tier],this.mobile=!!e.mobile,this.seed=Number.isFinite(e.seed)?e.seed:20240501,this.arenaRadius=Number.isFinite(e.arenaRadius)?e.arenaRadius:20,this.forcedLocalId=e.localId??null,this.followId=e.followId??null,this.localId=this.forcedLocalId,this.spectator=!!e.spectator,this.disposed=!1,this.renderer=new Vm({canvas:t,antialias:!1,alpha:!1,powerPreference:e.powerPreference??"high-performance",stencil:!1,depth:!0,preserveDrawingBuffer:!!e.preserveDrawingBuffer}),this.renderer.toneMapping=xn,this.renderer.autoClear=!1,this.renderer.setClearColor(0,1),this.renderer.info.autoReset=!1,this.clock=new A0,this.time=0,this.frame=0,this.view=null,this.lastRawEvents=null,this.lastTick=null,this.scene=new Zo,this.cameraRig=C0({mobile:this.mobile}),this.camera=this.cameraRig.camera,this._focus=new U(0,0,0),this._vel=new U,this._tmp=new U,this._tmp2=new U,this._tmp3=new U,this._buildWorld();const n=e.width??t.clientWidth??t.width??960,s=e.height??t.clientHeight??t.height??540;this.resize(n,s,e.pixelRatio??(typeof window<"u"?window.devicePixelRatio:1))}_buildWorld(){const t=this.quality;this.renderer.shadowMap.enabled=t.shadows,this.renderer.shadowMap.type=t.softShadows?Dc:Fo,this.textures=rg(t,this.seed),this.sky=Z0({scene:this.scene,renderer:this.renderer,quality:t,textures:this.textures,sunDir:wc}),this.lighting=B0({scene:this.scene,quality:t,sunDir:wc}),this.island=O0({scene:this.scene,quality:t,textures:this.textures,arenaRadius:this.arenaRadius,seed:this.seed}),this.characters=L0({scene:this.scene,quality:t,textures:this.textures}),this.vfx=pg({scene:this.scene,quality:t,textures:this.textures,seed:this.seed}),this.post=H0({renderer:this.renderer,scene:this.scene,quality:t}),this.view&&(this.island.syncTiles(this.view.tiles,this.view.arena),this.characters.reconcile(this.view.players,this.localId))}_teardownWorld(){var t,e,n,s,r,o,a;(t=this.post)==null||t.dispose(),(e=this.vfx)==null||e.dispose(),(n=this.characters)==null||n.dispose(),(s=this.island)==null||s.dispose(),(r=this.lighting)==null||r.dispose(),(o=this.sky)==null||o.dispose(),(a=this.textures)==null||a.dispose(),this.post=null,this.vfx=null,this.characters=null,this.island=null,this.lighting=null,this.sky=null,this.textures=null}setQuality(t){const e=la(t);return e===this.tier?this.tier:(this.tier=e,this.quality=kr[e],this._teardownWorld(),this._buildWorld(),this.resize(this._w,this._h,this._dpr),this.tier)}resize(t,e,n){var u,f;const s=Math.max(1,Math.floor(t||1)),r=Math.max(1,Math.floor(e||1)),o=Number.isFinite(n)&&n>0?n:1,a=Math.min(o,this.quality.dprCap,Tl);this._w=s,this._h=r,this._dpr=o,this._ratio=a,this.renderer.setPixelRatio(a),this.renderer.setSize(s,r,!1),this.cameraRig.resize(s/r);const c=Math.floor(s*a),l=Math.floor(r*a);(u=this.post)==null||u.setSize(c,l);const h=this.camera.fov*Math.PI/180;return(f=this.vfx)==null||f.setPixelScale(l/(2*Math.tan(h/2))),{width:s,height:r,pixelRatio:a}}setMobile(t){this.mobile=!!t,this.cameraRig.setMobile(this.mobile)}setSpectator(t){this.spectator=!!t}setLocalId(t){return this.forcedLocalId=t??null,this.forcedLocalId}setFollow(t){return this.setLocalId(t)}_arenaChanged(t){!Number.isFinite(t)||Math.abs(t-this.arenaRadius)<.01||(this.arenaRadius=t,this._teardownWorld(),this._buildWorld(),this.resize(this._w,this._h,this._dpr))}_consumeEvents(t,e){if(t.tick!=null){if(t.tick===this.lastTick)return;this.lastTick=t.tick}else{if(e===this.lastRawEvents)return;this.lastRawEvents=e}if(t.events.length!==0)for(const n of t.events)this._handleEvent(n)}_eventPos(t,e,n,s){if(t.x!=null&&t.z!=null)return s.set(t.x,t.y!=null?t.y:1.1,t.z),s;const r=n??e;return r?(s.copy(r.pos),s.y+=1.2,s):null}_handleEvent(t){const e=t.actorId!=null?this.characters.get(t.actorId):null,n=t.targetId!=null?this.characters.get(t.targetId):null,s=t.power,r=t.targetId!=null&&t.targetId===this.localId,o=t.actorId!=null&&t.actorId===this.localId,a=this._tmp2;switch(e&&n?a.copy(n.pos).sub(e.pos):t.yaw!=null?Rc(t.yaw,a):e?Rc(e.yaw,a):a.set(0,0,-1),a.y=0,a.lengthSq()<1e-6&&a.set(0,0,-1),t.kind){case"swing":{e&&this.characters.playSlap(t.actorId,s);break}case"slap":{if(e&&this.characters.playSlap(t.actorId,s),t.hits===0&&e){const c=this._tmp.copy(e.pos).addScaledVector(a,1.4);c.y+=1.15,this.vfx.slap(c,a,s*.45)}break}case"hit":{const c=this._eventPos(t,e,n,this._tmp);if(c&&this.vfx.slap(c,a,s),e){const h=this._tmp3.copy(a).applyAxisAngle(Cc,-e.yaw);this.characters.playSlap(t.actorId,s,h.x>=0?1:-1)}n&&this.characters.playHit(t.targetId,a,s);const l=r?.55:o?.34:.12;this.cameraRig.impulse(l*s,r?2.6:1.2);break}case"heavy":{const c=this._eventPos(t,e,n,this._tmp);c&&this.vfx.heavyImpact(c,s*1.3,{dir:a}),n&&this.characters.playHit(t.targetId,a,s*1.3);const l=r?.95:o?.62:.28;this.cameraRig.impulse(l*s,r?4.2:2.2);break}case"skill":{const c=this._eventPos(t,e,n,this._tmp);e&&this.characters.playSlap(t.actorId,s*1.2),c&&this.vfx.heavyImpact(c,s*1.15,{dir:a,crack:!1}),this.cameraRig.impulse(o?.5:.16,o?2.4:1);break}case"ko":{const c=this._eventPos(t,e,n,this._tmp);c&&this.vfx.fallTrail(c.x,c.y,c.z),(o||r)&&this.cameraRig.impulse(.4,1.5);break}case"awaken":{const c=e??n;if(c)for(let l=0;l<8;l++)this.vfx.awakenMotes(c.pos.x,c.pos.y+1.2,c.pos.z);this.cameraRig.impulse(o?.3:.1,1.2);break}case"dash":{t.x!=null&&this.vfx.footDust(t.x,Math.max(0,t.y??0)+.05,t.z,6);break}case"jump":case"respawn":{t.x!=null&&this.vfx.footDust(t.x,Math.max(0,t.y??0)+.05,t.z,5);break}case"tileCrack":{const c=this.island.crackTile(t,.45),l=t.x??(c==null?void 0:c.x),h=t.z??(c==null?void 0:c.z);l!=null&&this.vfx.footDust(l,.08,h,6);break}case"tileBreak":{const c=this.island.breakTile(t),l=t.x??(c==null?void 0:c.x),h=t.z??(c==null?void 0:c.z);if(l==null)break;this._tmp.set(l,.1,h),this.vfx.spawnDebris(this._tmp,1.5),this.vfx.heavyImpact(this._tmp,1.2,{dir:Cc,crack:!1});const u=this.characters.get(this.localId),f=u?Math.hypot(u.pos.x-l,u.pos.z-h):99;this.cameraRig.impulse(f<8?.5:.18,f<8?2:.8);break}}}sync(t,e){if(this.disposed)return;const n=Math.min(.05,Number.isFinite(e)?e:this.clock.getDelta());this.time+=n,this.frame++,this.renderer.info.reset();const s=t&&typeof t=="object"?t:{},r=kl(s,{localId:this.forcedLocalId,followId:this.followId});this.lastRaw=s,this.view=r,this.localId=r.localId,this._arenaChanged(r.arena.radius),this.characters.reconcile(r.players,this.localId),this.island.syncTiles(r.tiles,r.arena),this._consumeEvents(r,s.events),this.characters.update(n,this.time),this.island.update(n,this.time);for(const a of r.players){const c=this.characters.get(a.id);if(!(!c||!a.alive)){if(c.speed>3.2&&a.grounded&&this.frame%3===0&&this.vfx.footDust(c.pos.x,Math.max(0,c.pos.y),c.pos.z,c.speed),a.awakenedT>0)for(const l of c.arms)l.glove.getWorldPosition(this._tmp),this.vfx.awakenMotes(this._tmp.x,this._tmp.y,this._tmp.z);c.pos.y<-1.5&&this.vfx.fallTrail(c.pos.x,c.pos.y,c.pos.z)}}const o=this.spectator||this.localId==null?null:this.characters.get(this.localId);o?(this._focus.copy(o.pos),this._vel.set((o.pos.x-o.prev.x)/Math.max(n,1e-4),0,(o.pos.z-o.prev.z)/Math.max(n,1e-4)),this.cameraRig.update(n,this._focus,o.yaw,this._vel)):(this.cameraRig.orbit(n,this.time,this.arenaRadius*1.35),this._focus.set(0,0,0)),this.vfx.ambientDrift(n,this._focus),this.vfx.update(n,this.time),this.lighting.update(this.time,this._focus),this.sky.update(this.time,this.camera.position),this.post.render(this.camera)}renderIdle(t){this.sync(this.lastRaw??{},t)}getStats(){var e,n,s;const t=this.renderer.info;return{tier:this.tier,pixelRatio:this._ratio,size:[this._w,this._h],drawCalls:t.render.calls,triangles:t.render.triangles,programs:((e=t.programs)==null?void 0:e.length)??0,geometries:t.memory.geometries,textures:t.memory.textures,characters:((n=this.characters)==null?void 0:n.chars.size)??0,tiles:((s=this.island)==null?void 0:s.tileCount)??0,localId:this.localId}}dispose(){var t,e;this.disposed||(this.disposed=!0,this._teardownWorld(),this.scene.clear(),this.renderer.dispose(),(e=(t=this.renderer).forceContextLoss)==null||e.call(t),this.view=null)}}let ne=null;function vg(i,t={}){return ne&&!ne.disposed&&ne.dispose(),ne=new mg(i,t),ne}function xg(i,t){!ne||ne.disposed||ne.sync(i,t)}function Mg(i,t,e){return!ne||ne.disposed?null:ne.resize(i,t,e)}function Sg(i){return!ne||ne.disposed?null:ne.setQuality(i)}function yg(){ne&&(ne.dispose(),ne=null)}function Eg(i){ne==null||ne.setMobile(i)}function bg(i){ne==null||ne.setSpectator(i)}function gg(i){return(ne==null?void 0:ne.setLocalId(i))??null}function Tg(i){return gg(i)}function wg(){return ne&&!ne.disposed?ne.getStats():null}function Ag(){return ne}export{nr as DEFAULT_LOCAL_ID,bl as GLOVE_TINT,qt as PALETTE,kr as QUALITY,_g as QUALITY_TIERS,mg as YizhangRenderer,vg as createRenderer,yg as dispose,Ag as getRenderer,wg as getStats,Mg as resize,Tg as setFollow,gg as setLocalId,Eg as setMobile,Sg as setQuality,bg as setSpectator,xg as sync};
//# sourceMappingURL=index-CZCJLpyV.js.map
