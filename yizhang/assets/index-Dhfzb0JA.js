import{r as Ou,s as ku}from"./index-D013hrXW.js";const Ut={skyZenith:1713984,skyMid:3885667,skyHorizon:7172741,skyWarm:12159587,sunDisc:16766888,keyLight:16763279,fillSky:9416925,fillBounce:7164736,rimLight:11125734,crackLight:16751686,rockTop:6971477,rockBody:4934222,rockDeep:3092792,rockFresh:9143160,grime:2367260,crackCore:16761963,crackDeep:14177308,fog:3358810,cloudLit:10390390,cloudShadow:4608106,leather:4535593,leatherWorn:6507577,metal:9277331,metalWarm:11570014,cloth:4672857,clothDim:3027772,skin:9068359},zu={cotton:14928264,granite:8227481,gale:6538932,frost:10475759,spring:13209407,afterimage:11832030,magnet:13193027,meteor:14710848},Tr=10134189,Ar=1,wa=2;function Fn(i){var t,e;return(e=(t=i==null?void 0:i.layers)==null?void 0:t.enable)==null||e.call(t,wa),i}const Ao={high:{name:"high",dprCap:2,msaa:4,shadows:!0,shadowMapSize:2048,softShadows:!0,propShadows:!0,bloomOccluders:"all",rimLight:!0,crackFillLight:!0,texRock:512,texDetail:256,normalMaps:!0,sheenCloth:!0,envSize:256,islandRadialSegments:128,islandProfileSegments:26,plateBevel:!0,plateCurveSegments:10,capsuleSegments:12,rockChunks:7,cloudLayers:3,dustBudget:900,emberBudget:220,debrisPerBurst:7,debrisBudget:120,mergedDebris:!1,decalBudget:24,shockRings:2,footDust:!0,bloom:!0,bloomScale:.5,bloomIterations:3,bloomStrength:.9},mid:{name:"mid",dprCap:1.5,msaa:2,shadows:!0,shadowMapSize:1024,softShadows:!1,propShadows:!1,bloomOccluders:"tagged",rimLight:!0,crackFillLight:!0,texRock:256,texDetail:128,normalMaps:!0,sheenCloth:!1,envSize:128,islandRadialSegments:80,islandProfileSegments:18,plateBevel:!0,plateCurveSegments:6,capsuleSegments:8,rockChunks:4,cloudLayers:2,dustBudget:380,emberBudget:96,debrisPerBurst:4,debrisBudget:56,mergedDebris:!1,decalBudget:12,shockRings:1,footDust:!0,bloom:!0,bloomScale:.25,bloomIterations:2,bloomStrength:.8},low:{name:"low",dprCap:1.25,msaa:0,shadows:!1,shadowMapSize:512,softShadows:!1,propShadows:!1,bloomOccluders:"tagged",rimLight:!0,crackFillLight:!0,texRock:128,texDetail:64,normalMaps:!1,sheenCloth:!1,envSize:64,islandRadialSegments:44,islandProfileSegments:12,plateBevel:!1,plateCurveSegments:3,capsuleSegments:6,rockChunks:2,cloudLayers:1,dustBudget:140,emberBudget:32,debrisPerBurst:2,debrisBudget:20,mergedDebris:!0,decalBudget:4,shockRings:1,footDust:!1,bloom:!1,bloomScale:.125,bloomIterations:0,bloomStrength:0}},S_=["high","mid","low"];function nl(i){return Ao[i]?i:"mid"}const Bu=2;/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const ba="170",Gu=0,il=1,Hu=2,Ea=1,Gc=2,Nn=3,jn=0,Ge=1,Ie=2,Kn=0,He=1,Xi=2,sl=3,rl=4,Vu=5,fi=100,Wu=101,Xu=102,Yu=103,qu=104,Zu=200,Ku=201,Ju=202,$u=203,Co=204,Ro=205,ju=206,Qu=207,th=208,eh=209,nh=210,ih=211,sh=212,rh=213,oh=214,Po=0,Io=1,Lo=2,Yi=3,Do=4,Uo=5,No=6,Fo=7,Hc=0,ah=1,lh=2,kn=0,ch=1,uh=2,hh=3,fh=4,dh=5,ph=6,mh=7,ol="attached",gh="detached",Vc=300,qi=301,Zi=302,Oo=303,ko=304,Cr=306,Ki=1e3,yn=1001,zo=1002,tn=1003,vh=1004,Ls=1005,Be=1006,Fr=1007,Sn=1008,bn=1009,Wc=1010,Xc=1011,ys=1012,Ta=1013,gi=1014,mn=1015,Qi=1016,Aa=1017,Ca=1018,Ji=1020,Yc=35902,qc=1021,Zc=1022,qe=1023,Kc=1024,Jc=1025,Vi=1026,$i=1027,Ra=1028,Pa=1029,$c=1030,Ia=1031,La=1033,ur=33776,hr=33777,fr=33778,dr=33779,Bo=35840,Go=35841,Ho=35842,Vo=35843,Wo=36196,Xo=37492,Yo=37496,qo=37808,Zo=37809,Ko=37810,Jo=37811,$o=37812,jo=37813,Qo=37814,ta=37815,ea=37816,na=37817,ia=37818,sa=37819,ra=37820,oa=37821,pr=36492,aa=36494,la=36495,jc=36283,ca=36284,ua=36285,ha=36286,_h=3200,xh=3201,Qc=0,Mh=1,fn="",Ye="srgb",ts="srgb-linear",Rr="linear",de="srgb",Si=7680,al=519,yh=512,Sh=513,wh=514,tu=515,bh=516,Eh=517,Th=518,Ah=519,ll=35044,Le=35048,cl="300 es",On=2e3,vr=2001;class es{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const s=this._listeners[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}}const Ue=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Or=Math.PI/180,fa=180/Math.PI;function _i(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ue[i&255]+Ue[i>>8&255]+Ue[i>>16&255]+Ue[i>>24&255]+"-"+Ue[t&255]+Ue[t>>8&255]+"-"+Ue[t>>16&15|64]+Ue[t>>24&255]+"-"+Ue[e&63|128]+Ue[e>>8&255]+"-"+Ue[e>>16&255]+Ue[e>>24&255]+Ue[n&255]+Ue[n>>8&255]+Ue[n>>16&255]+Ue[n>>24&255]).toLowerCase()}function Pe(i,t,e){return Math.max(t,Math.min(e,i))}function Ch(i,t){return(i%t+t)%t}function kr(i,t,e){return(1-e)*i+e*t}function os(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function We(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}class Et{constructor(t=0,e=0){Et.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Pe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class $t{constructor(t,e,n,s,r,o,a,l,c){$t.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c)}set(t,e,n,s,r,o,a,l,c){const u=this.elements;return u[0]=t,u[1]=s,u[2]=a,u[3]=e,u[4]=r,u[5]=l,u[6]=n,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],u=n[4],h=n[7],d=n[2],f=n[5],g=n[8],v=s[0],m=s[3],p=s[6],y=s[1],M=s[4],x=s[7],Y=s[2],R=s[5],L=s[8];return r[0]=o*v+a*y+l*Y,r[3]=o*m+a*M+l*R,r[6]=o*p+a*x+l*L,r[1]=c*v+u*y+h*Y,r[4]=c*m+u*M+h*R,r[7]=c*p+u*x+h*L,r[2]=d*v+f*y+g*Y,r[5]=d*m+f*M+g*R,r[8]=d*p+f*x+g*L,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8];return e*o*u-e*a*c-n*r*u+n*a*l+s*r*c-s*o*l}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],h=u*o-a*c,d=a*l-u*r,f=c*r-o*l,g=e*h+n*d+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/g;return t[0]=h*v,t[1]=(s*c-u*n)*v,t[2]=(a*n-s*o)*v,t[3]=d*v,t[4]=(u*e-s*l)*v,t[5]=(s*r-a*e)*v,t[6]=f*v,t[7]=(n*l-c*e)*v,t[8]=(o*e-n*r)*v,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+t,-s*c,s*l,-s*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(zr.makeScale(t,e)),this}rotate(t){return this.premultiply(zr.makeRotation(-t)),this}translate(t,e){return this.premultiply(zr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const zr=new $t;function eu(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function _r(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Rh(){const i=_r("canvas");return i.style.display="block",i}const ul={};function vs(i){i in ul||(ul[i]=!0,console.warn(i))}function Ph(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function Ih(i){const t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Lh(i){const t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const ae={enabled:!0,workingColorSpace:ts,spaces:{},convert:function(i,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===de&&(i.r=zn(i.r),i.g=zn(i.g),i.b=zn(i.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(i.applyMatrix3(this.spaces[t].toXYZ),i.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===de&&(i.r=Wi(i.r),i.g=Wi(i.g),i.b=Wi(i.b))),i},fromWorkingColorSpace:function(i,t){return this.convert(i,this.workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===fn?Rr:this.spaces[i].transfer},getLuminanceCoefficients:function(i,t=this.workingColorSpace){return i.fromArray(this.spaces[t].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,t,e){return i.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function zn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Wi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}const hl=[.64,.33,.3,.6,.15,.06],fl=[.2126,.7152,.0722],dl=[.3127,.329],pl=new $t().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),ml=new $t().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);ae.define({[ts]:{primaries:hl,whitePoint:dl,transfer:Rr,toXYZ:pl,fromXYZ:ml,luminanceCoefficients:fl,workingColorSpaceConfig:{unpackColorSpace:Ye},outputColorSpaceConfig:{drawingBufferColorSpace:Ye}},[Ye]:{primaries:hl,whitePoint:dl,transfer:de,toXYZ:pl,fromXYZ:ml,luminanceCoefficients:fl,outputColorSpaceConfig:{drawingBufferColorSpace:Ye}}});let wi;class Dh{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{wi===void 0&&(wi=_r("canvas")),wi.width=t.width,wi.height=t.height;const n=wi.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=wi}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=_r("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=zn(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(zn(e[n]/255)*255):e[n]=zn(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Uh=0;class nu{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Uh++}),this.uuid=_i(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Br(s[o].image)):r.push(Br(s[o]))}else r=Br(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function Br(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Dh.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Nh=0;class ke extends es{constructor(t=ke.DEFAULT_IMAGE,e=ke.DEFAULT_MAPPING,n=yn,s=yn,r=Be,o=Sn,a=qe,l=bn,c=ke.DEFAULT_ANISOTROPY,u=fn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Nh++}),this.uuid=_i(),this.name="",this.source=new nu(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Et(0,0),this.repeat=new Et(1,1),this.center=new Et(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new $t,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Vc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Ki:t.x=t.x-Math.floor(t.x);break;case yn:t.x=t.x<0?0:1;break;case zo:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Ki:t.y=t.y-Math.floor(t.y);break;case yn:t.y=t.y<0?0:1;break;case zo:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}ke.DEFAULT_IMAGE=null;ke.DEFAULT_MAPPING=Vc;ke.DEFAULT_ANISOTROPY=1;class ce{constructor(t=0,e=0,n=0,s=1){ce.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const l=t.elements,c=l[0],u=l[4],h=l[8],d=l[1],f=l[5],g=l[9],v=l[2],m=l[6],p=l[10];if(Math.abs(u-d)<.01&&Math.abs(h-v)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+v)<.1&&Math.abs(g+m)<.1&&Math.abs(c+f+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const M=(c+1)/2,x=(f+1)/2,Y=(p+1)/2,R=(u+d)/4,L=(h+v)/4,D=(g+m)/4;return M>x&&M>Y?M<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(M),s=R/n,r=L/n):x>Y?x<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(x),n=R/s,r=D/s):Y<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(Y),n=L/r,s=D/r),this.set(n,s,r,e),this}let y=Math.sqrt((m-g)*(m-g)+(h-v)*(h-v)+(d-u)*(d-u));return Math.abs(y)<.001&&(y=1),this.x=(m-g)/y,this.y=(h-v)/y,this.z=(d-u)/y,this.w=Math.acos((c+f+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Fh extends es{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new ce(0,0,t,e),this.scissorTest=!1,this.viewport=new ce(0,0,t,e);const s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Be,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const r=new ke(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new nu(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Qn extends Fh{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class iu extends ke{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=tn,this.minFilter=tn,this.wrapR=yn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Oh extends ke{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=tn,this.minFilter=tn,this.wrapR=yn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Cs{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let l=n[s+0],c=n[s+1],u=n[s+2],h=n[s+3];const d=r[o+0],f=r[o+1],g=r[o+2],v=r[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h;return}if(a===1){t[e+0]=d,t[e+1]=f,t[e+2]=g,t[e+3]=v;return}if(h!==v||l!==d||c!==f||u!==g){let m=1-a;const p=l*d+c*f+u*g+h*v,y=p>=0?1:-1,M=1-p*p;if(M>Number.EPSILON){const Y=Math.sqrt(M),R=Math.atan2(Y,p*y);m=Math.sin(m*R)/Y,a=Math.sin(a*R)/Y}const x=a*y;if(l=l*m+d*x,c=c*m+f*x,u=u*m+g*x,h=h*m+v*x,m===1-a){const Y=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=Y,c*=Y,u*=Y,h*=Y}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h}static multiplyQuaternionsFlat(t,e,n,s,r,o){const a=n[s],l=n[s+1],c=n[s+2],u=n[s+3],h=r[o],d=r[o+1],f=r[o+2],g=r[o+3];return t[e]=a*g+u*h+l*f-c*d,t[e+1]=l*g+u*d+c*h-a*f,t[e+2]=c*g+u*f+a*d-l*h,t[e+3]=u*g-a*h-l*d-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(n/2),u=a(s/2),h=a(r/2),d=l(n/2),f=l(s/2),g=l(r/2);switch(o){case"XYZ":this._x=d*u*h+c*f*g,this._y=c*f*h-d*u*g,this._z=c*u*g+d*f*h,this._w=c*u*h-d*f*g;break;case"YXZ":this._x=d*u*h+c*f*g,this._y=c*f*h-d*u*g,this._z=c*u*g-d*f*h,this._w=c*u*h+d*f*g;break;case"ZXY":this._x=d*u*h-c*f*g,this._y=c*f*h+d*u*g,this._z=c*u*g+d*f*h,this._w=c*u*h-d*f*g;break;case"ZYX":this._x=d*u*h-c*f*g,this._y=c*f*h+d*u*g,this._z=c*u*g-d*f*h,this._w=c*u*h+d*f*g;break;case"YZX":this._x=d*u*h+c*f*g,this._y=c*f*h+d*u*g,this._z=c*u*g-d*f*h,this._w=c*u*h-d*f*g;break;case"XZY":this._x=d*u*h-c*f*g,this._y=c*f*h-d*u*g,this._z=c*u*g+d*f*h,this._w=c*u*h+d*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],l=e[9],c=e[2],u=e[6],h=e[10],d=n+a+h;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(u-l)*f,this._y=(r-c)*f,this._z=(o-s)*f}else if(n>a&&n>h){const f=2*Math.sqrt(1+n-a-h);this._w=(u-l)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+c)/f}else if(a>h){const f=2*Math.sqrt(1+a-n-h);this._w=(r-c)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(l+u)/f}else{const f=2*Math.sqrt(1+h-n-a);this._w=(o-s)/f,this._x=(r+c)/f,this._y=(l+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Pe(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,l=e._y,c=e._z,u=e._w;return this._x=n*u+o*a+s*c-r*l,this._y=s*u+o*l+r*a-n*c,this._z=r*u+o*c+n*l-s*a,this._w=o*u-n*a-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,s=this._y,r=this._z,o=this._w;let a=o*t._w+n*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;const l=1-a*a;if(l<=Number.EPSILON){const f=1-e;return this._w=f*o+e*this._w,this._x=f*n+e*this._x,this._y=f*s+e*this._y,this._z=f*r+e*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,a),h=Math.sin((1-e)*u)/c,d=Math.sin(e*u)/c;return this._w=o*h+this._w*d,this._x=n*h+this._x*d,this._y=s*h+this._y*d,this._z=r*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class k{constructor(t=0,e=0,n=0){k.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(gl.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(gl.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*s-a*n),u=2*(a*e-r*s),h=2*(r*n-o*e);return this.x=e+l*c+o*h-a*u,this.y=n+l*u+a*c-r*h,this.z=s+l*h+r*u-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,l=e.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Gr.copy(this).projectOnVector(t),this.sub(Gr)}reflect(t){return this.sub(Gr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Pe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Gr=new k,gl=new Cs;class ti{constructor(t=new k(1/0,1/0,1/0),e=new k(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(cn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(cn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=cn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,cn):cn.fromBufferAttribute(r,o),cn.applyMatrix4(t.matrixWorld),this.expandByPoint(cn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Ds.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Ds.copy(n.boundingBox)),Ds.applyMatrix4(t.matrixWorld),this.union(Ds)}const s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,cn),cn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(as),Us.subVectors(this.max,as),bi.subVectors(t.a,as),Ei.subVectors(t.b,as),Ti.subVectors(t.c,as),Vn.subVectors(Ei,bi),Wn.subVectors(Ti,Ei),ni.subVectors(bi,Ti);let e=[0,-Vn.z,Vn.y,0,-Wn.z,Wn.y,0,-ni.z,ni.y,Vn.z,0,-Vn.x,Wn.z,0,-Wn.x,ni.z,0,-ni.x,-Vn.y,Vn.x,0,-Wn.y,Wn.x,0,-ni.y,ni.x,0];return!Hr(e,bi,Ei,Ti,Us)||(e=[1,0,0,0,1,0,0,0,1],!Hr(e,bi,Ei,Ti,Us))?!1:(Ns.crossVectors(Vn,Wn),e=[Ns.x,Ns.y,Ns.z],Hr(e,bi,Ei,Ti,Us))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,cn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(cn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Rn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Rn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Rn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Rn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Rn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Rn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Rn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Rn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Rn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Rn=[new k,new k,new k,new k,new k,new k,new k,new k],cn=new k,Ds=new ti,bi=new k,Ei=new k,Ti=new k,Vn=new k,Wn=new k,ni=new k,as=new k,Us=new k,Ns=new k,ii=new k;function Hr(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){ii.fromArray(i,r);const a=s.x*Math.abs(ii.x)+s.y*Math.abs(ii.y)+s.z*Math.abs(ii.z),l=t.dot(ii),c=e.dot(ii),u=n.dot(ii);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}const kh=new ti,ls=new k,Vr=new k;class Tn{constructor(t=new k,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):kh.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;ls.subVectors(t,this.center);const e=ls.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(ls,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Vr.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(ls.copy(t.center).add(Vr)),this.expandByPoint(ls.copy(t.center).sub(Vr))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Pn=new k,Wr=new k,Fs=new k,Xn=new k,Xr=new k,Os=new k,Yr=new k;class Pr{constructor(t=new k,e=new k(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Pn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=Pn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Pn.copy(this.origin).addScaledVector(this.direction,e),Pn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Wr.copy(t).add(e).multiplyScalar(.5),Fs.copy(e).sub(t).normalize(),Xn.copy(this.origin).sub(Wr);const r=t.distanceTo(e)*.5,o=-this.direction.dot(Fs),a=Xn.dot(this.direction),l=-Xn.dot(Fs),c=Xn.lengthSq(),u=Math.abs(1-o*o);let h,d,f,g;if(u>0)if(h=o*l-a,d=o*a-l,g=r*u,h>=0)if(d>=-g)if(d<=g){const v=1/u;h*=v,d*=v,f=h*(h+o*d+2*a)+d*(o*h+d+2*l)+c}else d=r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*l)+c;else d=-r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*l)+c;else d<=-g?(h=Math.max(0,-(-o*r+a)),d=h>0?-r:Math.min(Math.max(-r,-l),r),f=-h*h+d*(d+2*l)+c):d<=g?(h=0,d=Math.min(Math.max(-r,-l),r),f=d*(d+2*l)+c):(h=Math.max(0,-(o*r+a)),d=h>0?r:Math.min(Math.max(-r,-l),r),f=-h*h+d*(d+2*l)+c);else d=o>0?-r:r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,h),s&&s.copy(Wr).addScaledVector(Fs,d),f}intersectSphere(t,e){Pn.subVectors(t.center,this.origin);const n=Pn.dot(this.direction),s=Pn.dot(Pn)-n*n,r=t.radius*t.radius;if(s>r)return null;const o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return c>=0?(n=(t.min.x-d.x)*c,s=(t.max.x-d.x)*c):(n=(t.max.x-d.x)*c,s=(t.min.x-d.x)*c),u>=0?(r=(t.min.y-d.y)*u,o=(t.max.y-d.y)*u):(r=(t.max.y-d.y)*u,o=(t.min.y-d.y)*u),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),h>=0?(a=(t.min.z-d.z)*h,l=(t.max.z-d.z)*h):(a=(t.max.z-d.z)*h,l=(t.min.z-d.z)*h),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Pn)!==null}intersectTriangle(t,e,n,s,r){Xr.subVectors(e,t),Os.subVectors(n,t),Yr.crossVectors(Xr,Os);let o=this.direction.dot(Yr),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Xn.subVectors(this.origin,t);const l=a*this.direction.dot(Os.crossVectors(Xn,Os));if(l<0)return null;const c=a*this.direction.dot(Xr.cross(Xn));if(c<0||l+c>o)return null;const u=-a*Xn.dot(Yr);return u<0?null:this.at(u/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class jt{constructor(t,e,n,s,r,o,a,l,c,u,h,d,f,g,v,m){jt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c,u,h,d,f,g,v,m)}set(t,e,n,s,r,o,a,l,c,u,h,d,f,g,v,m){const p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=u,p[10]=h,p[14]=d,p[3]=f,p[7]=g,p[11]=v,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new jt().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,s=1/Ai.setFromMatrixColumn(t,0).length(),r=1/Ai.setFromMatrixColumn(t,1).length(),o=1/Ai.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),h=Math.sin(r);if(t.order==="XYZ"){const d=o*u,f=o*h,g=a*u,v=a*h;e[0]=l*u,e[4]=-l*h,e[8]=c,e[1]=f+g*c,e[5]=d-v*c,e[9]=-a*l,e[2]=v-d*c,e[6]=g+f*c,e[10]=o*l}else if(t.order==="YXZ"){const d=l*u,f=l*h,g=c*u,v=c*h;e[0]=d+v*a,e[4]=g*a-f,e[8]=o*c,e[1]=o*h,e[5]=o*u,e[9]=-a,e[2]=f*a-g,e[6]=v+d*a,e[10]=o*l}else if(t.order==="ZXY"){const d=l*u,f=l*h,g=c*u,v=c*h;e[0]=d-v*a,e[4]=-o*h,e[8]=g+f*a,e[1]=f+g*a,e[5]=o*u,e[9]=v-d*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){const d=o*u,f=o*h,g=a*u,v=a*h;e[0]=l*u,e[4]=g*c-f,e[8]=d*c+v,e[1]=l*h,e[5]=v*c+d,e[9]=f*c-g,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){const d=o*l,f=o*c,g=a*l,v=a*c;e[0]=l*u,e[4]=v-d*h,e[8]=g*h+f,e[1]=h,e[5]=o*u,e[9]=-a*u,e[2]=-c*u,e[6]=f*h+g,e[10]=d-v*h}else if(t.order==="XZY"){const d=o*l,f=o*c,g=a*l,v=a*c;e[0]=l*u,e[4]=-h,e[8]=c*u,e[1]=d*h+v,e[5]=o*u,e[9]=f*h-g,e[2]=g*h-f,e[6]=a*u,e[10]=v*h+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(zh,t,Bh)}lookAt(t,e,n){const s=this.elements;return Je.subVectors(t,e),Je.lengthSq()===0&&(Je.z=1),Je.normalize(),Yn.crossVectors(n,Je),Yn.lengthSq()===0&&(Math.abs(n.z)===1?Je.x+=1e-4:Je.z+=1e-4,Je.normalize(),Yn.crossVectors(n,Je)),Yn.normalize(),ks.crossVectors(Je,Yn),s[0]=Yn.x,s[4]=ks.x,s[8]=Je.x,s[1]=Yn.y,s[5]=ks.y,s[9]=Je.y,s[2]=Yn.z,s[6]=ks.z,s[10]=Je.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],u=n[1],h=n[5],d=n[9],f=n[13],g=n[2],v=n[6],m=n[10],p=n[14],y=n[3],M=n[7],x=n[11],Y=n[15],R=s[0],L=s[4],D=s[8],E=s[12],_=s[1],I=s[5],V=s[9],W=s[13],T=s[2],U=s[6],z=s[10],b=s[14],P=s[3],Z=s[7],tt=s[11],j=s[15];return r[0]=o*R+a*_+l*T+c*P,r[4]=o*L+a*I+l*U+c*Z,r[8]=o*D+a*V+l*z+c*tt,r[12]=o*E+a*W+l*b+c*j,r[1]=u*R+h*_+d*T+f*P,r[5]=u*L+h*I+d*U+f*Z,r[9]=u*D+h*V+d*z+f*tt,r[13]=u*E+h*W+d*b+f*j,r[2]=g*R+v*_+m*T+p*P,r[6]=g*L+v*I+m*U+p*Z,r[10]=g*D+v*V+m*z+p*tt,r[14]=g*E+v*W+m*b+p*j,r[3]=y*R+M*_+x*T+Y*P,r[7]=y*L+M*I+x*U+Y*Z,r[11]=y*D+M*V+x*z+Y*tt,r[15]=y*E+M*W+x*b+Y*j,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],l=t[9],c=t[13],u=t[2],h=t[6],d=t[10],f=t[14],g=t[3],v=t[7],m=t[11],p=t[15];return g*(+r*l*h-s*c*h-r*a*d+n*c*d+s*a*f-n*l*f)+v*(+e*l*f-e*c*d+r*o*d-s*o*f+s*c*u-r*l*u)+m*(+e*c*h-e*a*f-r*o*h+n*o*f+r*a*u-n*c*u)+p*(-s*a*u-e*l*h+e*a*d+s*o*h-n*o*d+n*l*u)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],h=t[9],d=t[10],f=t[11],g=t[12],v=t[13],m=t[14],p=t[15],y=h*m*c-v*d*c+v*l*f-a*m*f-h*l*p+a*d*p,M=g*d*c-u*m*c-g*l*f+o*m*f+u*l*p-o*d*p,x=u*v*c-g*h*c+g*a*f-o*v*f-u*a*p+o*h*p,Y=g*h*l-u*v*l-g*a*d+o*v*d+u*a*m-o*h*m,R=e*y+n*M+s*x+r*Y;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const L=1/R;return t[0]=y*L,t[1]=(v*d*r-h*m*r-v*s*f+n*m*f+h*s*p-n*d*p)*L,t[2]=(a*m*r-v*l*r+v*s*c-n*m*c-a*s*p+n*l*p)*L,t[3]=(h*l*r-a*d*r-h*s*c+n*d*c+a*s*f-n*l*f)*L,t[4]=M*L,t[5]=(u*m*r-g*d*r+g*s*f-e*m*f-u*s*p+e*d*p)*L,t[6]=(g*l*r-o*m*r-g*s*c+e*m*c+o*s*p-e*l*p)*L,t[7]=(o*d*r-u*l*r+u*s*c-e*d*c-o*s*f+e*l*f)*L,t[8]=x*L,t[9]=(g*h*r-u*v*r-g*n*f+e*v*f+u*n*p-e*h*p)*L,t[10]=(o*v*r-g*a*r+g*n*c-e*v*c-o*n*p+e*a*p)*L,t[11]=(u*a*r-o*h*r-u*n*c+e*h*c+o*n*f-e*a*f)*L,t[12]=Y*L,t[13]=(u*v*s-g*h*s+g*n*d-e*v*d-u*n*m+e*h*m)*L,t[14]=(g*a*s-o*v*s-g*n*l+e*v*l+o*n*m-e*a*m)*L,t[15]=(o*h*s-u*a*s+u*n*l-e*h*l-o*n*d+e*a*d)*L,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,l=t.z,c=r*o,u=r*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,u*a+n,u*l-s*o,0,c*l-s*a,u*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,o=e._y,a=e._z,l=e._w,c=r+r,u=o+o,h=a+a,d=r*c,f=r*u,g=r*h,v=o*u,m=o*h,p=a*h,y=l*c,M=l*u,x=l*h,Y=n.x,R=n.y,L=n.z;return s[0]=(1-(v+p))*Y,s[1]=(f+x)*Y,s[2]=(g-M)*Y,s[3]=0,s[4]=(f-x)*R,s[5]=(1-(d+p))*R,s[6]=(m+y)*R,s[7]=0,s[8]=(g+M)*L,s[9]=(m-y)*L,s[10]=(1-(d+v))*L,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;let r=Ai.set(s[0],s[1],s[2]).length();const o=Ai.set(s[4],s[5],s[6]).length(),a=Ai.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],un.copy(this);const c=1/r,u=1/o,h=1/a;return un.elements[0]*=c,un.elements[1]*=c,un.elements[2]*=c,un.elements[4]*=u,un.elements[5]*=u,un.elements[6]*=u,un.elements[8]*=h,un.elements[9]*=h,un.elements[10]*=h,e.setFromRotationMatrix(un),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,s,r,o,a=On){const l=this.elements,c=2*r/(e-t),u=2*r/(n-s),h=(e+t)/(e-t),d=(n+s)/(n-s);let f,g;if(a===On)f=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===vr)f=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=u,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=On){const l=this.elements,c=1/(e-t),u=1/(n-s),h=1/(o-r),d=(e+t)*c,f=(n+s)*u;let g,v;if(a===On)g=(o+r)*h,v=-2*h;else if(a===vr)g=r*h,v=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=v,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Ai=new k,un=new jt,zh=new k(0,0,0),Bh=new k(1,1,1),Yn=new k,ks=new k,Je=new k,vl=new jt,_l=new Cs;class En{constructor(t=0,e=0,n=0,s=En.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],u=s[9],h=s[2],d=s[6],f=s[10];switch(e){case"XYZ":this._y=Math.asin(Pe(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Pe(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin(Pe(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Pe(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Pe(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-Pe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return vl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(vl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return _l.setFromEuler(this),this.setFromQuaternion(_l,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}En.DEFAULT_ORDER="XYZ";class su{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Gh=0;const xl=new k,Ci=new Cs,In=new jt,zs=new k,cs=new k,Hh=new k,Vh=new Cs,Ml=new k(1,0,0),yl=new k(0,1,0),Sl=new k(0,0,1),wl={type:"added"},Wh={type:"removed"},Ri={type:"childadded",child:null},qr={type:"childremoved",child:null};class Kt extends es{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Gh++}),this.uuid=_i(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Kt.DEFAULT_UP.clone();const t=new k,e=new En,n=new Cs,s=new k(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new jt},normalMatrix:{value:new $t}}),this.matrix=new jt,this.matrixWorld=new jt,this.matrixAutoUpdate=Kt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Kt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new su,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Ci.setFromAxisAngle(t,e),this.quaternion.multiply(Ci),this}rotateOnWorldAxis(t,e){return Ci.setFromAxisAngle(t,e),this.quaternion.premultiply(Ci),this}rotateX(t){return this.rotateOnAxis(Ml,t)}rotateY(t){return this.rotateOnAxis(yl,t)}rotateZ(t){return this.rotateOnAxis(Sl,t)}translateOnAxis(t,e){return xl.copy(t).applyQuaternion(this.quaternion),this.position.add(xl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Ml,t)}translateY(t){return this.translateOnAxis(yl,t)}translateZ(t){return this.translateOnAxis(Sl,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(In.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?zs.copy(t):zs.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),cs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?In.lookAt(cs,zs,this.up):In.lookAt(zs,cs,this.up),this.quaternion.setFromRotationMatrix(In),s&&(In.extractRotation(s.matrixWorld),Ci.setFromRotationMatrix(In),this.quaternion.premultiply(Ci.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(wl),Ri.child=t,this.dispatchEvent(Ri),Ri.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Wh),qr.child=t,this.dispatchEvent(qr),qr.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),In.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),In.multiply(t.parent.matrixWorld)),t.applyMatrix4(In),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(wl),Ri.child=t,this.dispatchEvent(Ri),Ri.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(cs,t,Hh),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(cs,Vh,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];r(t.shapes,h)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(t.materials,this.material[l]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];s.animations.push(r(t.animations,l))}}if(e){const a=o(t.geometries),l=o(t.materials),c=o(t.textures),u=o(t.images),h=o(t.shapes),d=o(t.skeletons),f=o(t.animations),g=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){const l=[];for(const c in a){const u=a[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}Kt.DEFAULT_UP=new k(0,1,0);Kt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Kt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const hn=new k,Ln=new k,Zr=new k,Dn=new k,Pi=new k,Ii=new k,bl=new k,Kr=new k,Jr=new k,$r=new k,jr=new ce,Qr=new ce,to=new ce;class dn{constructor(t=new k,e=new k,n=new k){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),hn.subVectors(t,e),s.cross(hn);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){hn.subVectors(s,e),Ln.subVectors(n,e),Zr.subVectors(t,e);const o=hn.dot(hn),a=hn.dot(Ln),l=hn.dot(Zr),c=Ln.dot(Ln),u=Ln.dot(Zr),h=o*c-a*a;if(h===0)return r.set(0,0,0),null;const d=1/h,f=(c*l-a*u)*d,g=(o*u-a*l)*d;return r.set(1-f-g,g,f)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Dn)===null?!1:Dn.x>=0&&Dn.y>=0&&Dn.x+Dn.y<=1}static getInterpolation(t,e,n,s,r,o,a,l){return this.getBarycoord(t,e,n,s,Dn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Dn.x),l.addScaledVector(o,Dn.y),l.addScaledVector(a,Dn.z),l)}static getInterpolatedAttribute(t,e,n,s,r,o){return jr.setScalar(0),Qr.setScalar(0),to.setScalar(0),jr.fromBufferAttribute(t,e),Qr.fromBufferAttribute(t,n),to.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(jr,r.x),o.addScaledVector(Qr,r.y),o.addScaledVector(to,r.z),o}static isFrontFacing(t,e,n,s){return hn.subVectors(n,e),Ln.subVectors(t,e),hn.cross(Ln).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return hn.subVectors(this.c,this.b),Ln.subVectors(this.a,this.b),hn.cross(Ln).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return dn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return dn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return dn.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return dn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return dn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let o,a;Pi.subVectors(s,n),Ii.subVectors(r,n),Kr.subVectors(t,n);const l=Pi.dot(Kr),c=Ii.dot(Kr);if(l<=0&&c<=0)return e.copy(n);Jr.subVectors(t,s);const u=Pi.dot(Jr),h=Ii.dot(Jr);if(u>=0&&h<=u)return e.copy(s);const d=l*h-u*c;if(d<=0&&l>=0&&u<=0)return o=l/(l-u),e.copy(n).addScaledVector(Pi,o);$r.subVectors(t,r);const f=Pi.dot($r),g=Ii.dot($r);if(g>=0&&f<=g)return e.copy(r);const v=f*c-l*g;if(v<=0&&c>=0&&g<=0)return a=c/(c-g),e.copy(n).addScaledVector(Ii,a);const m=u*g-f*h;if(m<=0&&h-u>=0&&f-g>=0)return bl.subVectors(r,s),a=(h-u)/(h-u+(f-g)),e.copy(s).addScaledVector(bl,a);const p=1/(m+v+d);return o=v*p,a=d*p,e.copy(n).addScaledVector(Pi,o).addScaledVector(Ii,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const ru={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},qn={h:0,s:0,l:0},Bs={h:0,s:0,l:0};function eo(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class ut{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ye){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ae.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=ae.workingColorSpace){return this.r=t,this.g=e,this.b=n,ae.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=ae.workingColorSpace){if(t=Ch(t,1),e=Pe(e,0,1),n=Pe(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=eo(o,r,t+1/3),this.g=eo(o,r,t),this.b=eo(o,r,t-1/3)}return ae.toWorkingColorSpace(this,s),this}setStyle(t,e=Ye){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ye){const n=ru[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=zn(t.r),this.g=zn(t.g),this.b=zn(t.b),this}copyLinearToSRGB(t){return this.r=Wi(t.r),this.g=Wi(t.g),this.b=Wi(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ye){return ae.fromWorkingColorSpace(Ne.copy(this),t),Math.round(Pe(Ne.r*255,0,255))*65536+Math.round(Pe(Ne.g*255,0,255))*256+Math.round(Pe(Ne.b*255,0,255))}getHexString(t=Ye){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ae.workingColorSpace){ae.fromWorkingColorSpace(Ne.copy(this),e);const n=Ne.r,s=Ne.g,r=Ne.b,o=Math.max(n,s,r),a=Math.min(n,s,r);let l,c;const u=(a+o)/2;if(a===o)l=0,c=0;else{const h=o-a;switch(c=u<=.5?h/(o+a):h/(2-o-a),o){case n:l=(s-r)/h+(s<r?6:0);break;case s:l=(r-n)/h+2;break;case r:l=(n-s)/h+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=ae.workingColorSpace){return ae.fromWorkingColorSpace(Ne.copy(this),e),t.r=Ne.r,t.g=Ne.g,t.b=Ne.b,t}getStyle(t=Ye){ae.fromWorkingColorSpace(Ne.copy(this),t);const e=Ne.r,n=Ne.g,s=Ne.b;return t!==Ye?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(qn),this.setHSL(qn.h+t,qn.s+e,qn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(qn),t.getHSL(Bs);const n=kr(qn.h,Bs.h,e),s=kr(qn.s,Bs.s,e),r=kr(qn.l,Bs.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ne=new ut;ut.NAMES=ru;let Xh=0;class xi extends es{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Xh++}),this.uuid=_i(),this.name="",this.blending=He,this.side=jn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Co,this.blendDst=Ro,this.blendEquation=fi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ut(0,0,0),this.blendAlpha=0,this.depthFunc=Yi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=al,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Si,this.stencilZFail=Si,this.stencilZPass=Si,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==He&&(n.blending=this.blending),this.side!==jn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Co&&(n.blendSrc=this.blendSrc),this.blendDst!==Ro&&(n.blendDst=this.blendDst),this.blendEquation!==fi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Yi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==al&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Si&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Si&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Si&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const o=[];for(const a in r){const l=r[a];delete l.metadata,o.push(l)}return o}if(e){const r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class gn extends xi{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new ut(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new En,this.combine=Hc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const we=new k,Gs=new Et;class Se{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=ll,this.updateRanges=[],this.gpuType=mn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Gs.fromBufferAttribute(this,e),Gs.applyMatrix3(t),this.setXY(e,Gs.x,Gs.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)we.fromBufferAttribute(this,e),we.applyMatrix3(t),this.setXYZ(e,we.x,we.y,we.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)we.fromBufferAttribute(this,e),we.applyMatrix4(t),this.setXYZ(e,we.x,we.y,we.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)we.fromBufferAttribute(this,e),we.applyNormalMatrix(t),this.setXYZ(e,we.x,we.y,we.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)we.fromBufferAttribute(this,e),we.transformDirection(t),this.setXYZ(e,we.x,we.y,we.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=os(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=We(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=os(e,this.array)),e}setX(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=os(e,this.array)),e}setY(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=os(e,this.array)),e}setZ(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=os(e,this.array)),e}setW(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=We(e,this.array),n=We(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=We(e,this.array),n=We(n,this.array),s=We(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=We(e,this.array),n=We(n,this.array),s=We(s,this.array),r=We(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==ll&&(t.usage=this.usage),t}}class ou extends Se{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class au extends Se{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class qt extends Se{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Yh=0;const nn=new jt,no=new Kt,Li=new k,$e=new ti,us=new ti,Re=new k;class ye extends es{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Yh++}),this.uuid=_i(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(eu(t)?au:ou)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new $t().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return nn.makeRotationFromQuaternion(t),this.applyMatrix4(nn),this}rotateX(t){return nn.makeRotationX(t),this.applyMatrix4(nn),this}rotateY(t){return nn.makeRotationY(t),this.applyMatrix4(nn),this}rotateZ(t){return nn.makeRotationZ(t),this.applyMatrix4(nn),this}translate(t,e,n){return nn.makeTranslation(t,e,n),this.applyMatrix4(nn),this}scale(t,e,n){return nn.makeScale(t,e,n),this.applyMatrix4(nn),this}lookAt(t){return no.lookAt(t),no.updateMatrix(),this.applyMatrix4(no.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Li).negate(),this.translate(Li.x,Li.y,Li.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let s=0,r=t.length;s<r;s++){const o=t[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new qt(n,3))}else{for(let n=0,s=e.count;n<s;n++){const r=t[n];e.setXYZ(n,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ti);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new k(-1/0,-1/0,-1/0),new k(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];$e.setFromBufferAttribute(r),this.morphTargetsRelative?(Re.addVectors(this.boundingBox.min,$e.min),this.boundingBox.expandByPoint(Re),Re.addVectors(this.boundingBox.max,$e.max),this.boundingBox.expandByPoint(Re)):(this.boundingBox.expandByPoint($e.min),this.boundingBox.expandByPoint($e.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Tn);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new k,1/0);return}if(t){const n=this.boundingSphere.center;if($e.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){const a=e[r];us.setFromBufferAttribute(a),this.morphTargetsRelative?(Re.addVectors($e.min,us.min),$e.expandByPoint(Re),Re.addVectors($e.max,us.max),$e.expandByPoint(Re)):($e.expandByPoint(us.min),$e.expandByPoint(us.max))}$e.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)Re.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Re));if(e)for(let r=0,o=e.length;r<o;r++){const a=e[r],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)Re.fromBufferAttribute(a,c),l&&(Li.fromBufferAttribute(t,c),Re.add(Li)),s=Math.max(s,n.distanceToSquared(Re))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Se(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],l=[];for(let D=0;D<n.count;D++)a[D]=new k,l[D]=new k;const c=new k,u=new k,h=new k,d=new Et,f=new Et,g=new Et,v=new k,m=new k;function p(D,E,_){c.fromBufferAttribute(n,D),u.fromBufferAttribute(n,E),h.fromBufferAttribute(n,_),d.fromBufferAttribute(r,D),f.fromBufferAttribute(r,E),g.fromBufferAttribute(r,_),u.sub(c),h.sub(c),f.sub(d),g.sub(d);const I=1/(f.x*g.y-g.x*f.y);isFinite(I)&&(v.copy(u).multiplyScalar(g.y).addScaledVector(h,-f.y).multiplyScalar(I),m.copy(h).multiplyScalar(f.x).addScaledVector(u,-g.x).multiplyScalar(I),a[D].add(v),a[E].add(v),a[_].add(v),l[D].add(m),l[E].add(m),l[_].add(m))}let y=this.groups;y.length===0&&(y=[{start:0,count:t.count}]);for(let D=0,E=y.length;D<E;++D){const _=y[D],I=_.start,V=_.count;for(let W=I,T=I+V;W<T;W+=3)p(t.getX(W+0),t.getX(W+1),t.getX(W+2))}const M=new k,x=new k,Y=new k,R=new k;function L(D){Y.fromBufferAttribute(s,D),R.copy(Y);const E=a[D];M.copy(E),M.sub(Y.multiplyScalar(Y.dot(E))).normalize(),x.crossVectors(R,E);const I=x.dot(l[D])<0?-1:1;o.setXYZW(D,M.x,M.y,M.z,I)}for(let D=0,E=y.length;D<E;++D){const _=y[D],I=_.start,V=_.count;for(let W=I,T=I+V;W<T;W+=3)L(t.getX(W+0)),L(t.getX(W+1)),L(t.getX(W+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Se(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);const s=new k,r=new k,o=new k,a=new k,l=new k,c=new k,u=new k,h=new k;if(t)for(let d=0,f=t.count;d<f;d+=3){const g=t.getX(d+0),v=t.getX(d+1),m=t.getX(d+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,v),o.fromBufferAttribute(e,m),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,v),c.fromBufferAttribute(n,m),a.add(u),l.add(u),c.add(u),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(v,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,f=e.count;d<f;d+=3)s.fromBufferAttribute(e,d+0),r.fromBufferAttribute(e,d+1),o.fromBufferAttribute(e,d+2),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Re.fromBufferAttribute(t,e),Re.normalize(),t.setXYZ(e,Re.x,Re.y,Re.z)}toNonIndexed(){function t(a,l){const c=a.array,u=a.itemSize,h=a.normalized,d=new c.constructor(l.length*u);let f=0,g=0;for(let v=0,m=l.length;v<m;v++){a.isInterleavedBufferAttribute?f=l[v]*a.data.stride+a.offset:f=l[v]*u;for(let p=0;p<u;p++)d[g++]=c[f++]}return new Se(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new ye,n=this.index.array,s=this.attributes;for(const a in s){const l=s[a],c=t(l,n);e.setAttribute(a,c)}const r=this.morphAttributes;for(const a in r){const l=[],c=r[a];for(let u=0,h=c.length;u<h;u++){const d=c[u],f=t(d,n);l.push(f)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const s={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,d=c.length;h<d;h++){const f=c[h];u.push(f.toJSON(t.data))}u.length>0&&(s[l]=u,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const s=t.attributes;for(const c in s){const u=s[c];this.setAttribute(c,u.clone(e))}const r=t.morphAttributes;for(const c in r){const u=[],h=r[c];for(let d=0,f=h.length;d<f;d++)u.push(h[d].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let c=0,u=o.length;c<u;c++){const h=o[c];this.addGroup(h.start,h.count,h.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const El=new jt,si=new Pr,Hs=new Tn,Tl=new k,Vs=new k,Ws=new k,Xs=new k,io=new k,Ys=new k,Al=new k,qs=new k;class Yt extends Kt{constructor(t=new ye,e=new gn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const a=this.morphTargetInfluences;if(r&&a){Ys.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const u=a[l],h=r[l];u!==0&&(io.fromBufferAttribute(h,t),o?Ys.addScaledVector(io,u):Ys.addScaledVector(io.sub(e),u))}e.add(Ys)}return e}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Hs.copy(n.boundingSphere),Hs.applyMatrix4(r),si.copy(t.ray).recast(t.near),!(Hs.containsPoint(si.origin)===!1&&(si.intersectSphere(Hs,Tl)===null||si.origin.distanceToSquared(Tl)>(t.far-t.near)**2))&&(El.copy(r).invert(),si.copy(t.ray).applyMatrix4(El),!(n.boundingBox!==null&&si.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,si)))}_computeIntersections(t,e,n){let s;const r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,h=r.attributes.normal,d=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,v=d.length;g<v;g++){const m=d[g],p=o[m.materialIndex],y=Math.max(m.start,f.start),M=Math.min(a.count,Math.min(m.start+m.count,f.start+f.count));for(let x=y,Y=M;x<Y;x+=3){const R=a.getX(x),L=a.getX(x+1),D=a.getX(x+2);s=Zs(this,p,t,n,c,u,h,R,L,D),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,f.start),v=Math.min(a.count,f.start+f.count);for(let m=g,p=v;m<p;m+=3){const y=a.getX(m),M=a.getX(m+1),x=a.getX(m+2);s=Zs(this,o,t,n,c,u,h,y,M,x),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,v=d.length;g<v;g++){const m=d[g],p=o[m.materialIndex],y=Math.max(m.start,f.start),M=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let x=y,Y=M;x<Y;x+=3){const R=x,L=x+1,D=x+2;s=Zs(this,p,t,n,c,u,h,R,L,D),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,f.start),v=Math.min(l.count,f.start+f.count);for(let m=g,p=v;m<p;m+=3){const y=m,M=m+1,x=m+2;s=Zs(this,o,t,n,c,u,h,y,M,x),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}}function qh(i,t,e,n,s,r,o,a){let l;if(t.side===Ge?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,t.side===jn,a),l===null)return null;qs.copy(a),qs.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(qs);return c<e.near||c>e.far?null:{distance:c,point:qs.clone(),object:i}}function Zs(i,t,e,n,s,r,o,a,l,c){i.getVertexPosition(a,Vs),i.getVertexPosition(l,Ws),i.getVertexPosition(c,Xs);const u=qh(i,t,e,n,Vs,Ws,Xs,Al);if(u){const h=new k;dn.getBarycoord(Al,Vs,Ws,Xs,h),s&&(u.uv=dn.getInterpolatedAttribute(s,a,l,c,h,new Et)),r&&(u.uv1=dn.getInterpolatedAttribute(r,a,l,c,h,new Et)),o&&(u.normal=dn.getInterpolatedAttribute(o,a,l,c,h,new k),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const d={a,b:l,c,normal:new k,materialIndex:0};dn.getNormal(Vs,Ws,Xs,d.normal),u.face=d,u.barycoord=h}return u}class pe extends ye{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};const a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);const l=[],c=[],u=[],h=[];let d=0,f=0;g("z","y","x",-1,-1,n,e,t,o,r,0),g("z","y","x",1,-1,n,e,-t,o,r,1),g("x","z","y",1,1,t,n,e,s,o,2),g("x","z","y",1,-1,t,n,-e,s,o,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new qt(c,3)),this.setAttribute("normal",new qt(u,3)),this.setAttribute("uv",new qt(h,2));function g(v,m,p,y,M,x,Y,R,L,D,E){const _=x/L,I=Y/D,V=x/2,W=Y/2,T=R/2,U=L+1,z=D+1;let b=0,P=0;const Z=new k;for(let tt=0;tt<z;tt++){const j=tt*I-W;for(let mt=0;mt<U;mt++){const q=mt*_-V;Z[v]=q*y,Z[m]=j*M,Z[p]=T,c.push(Z.x,Z.y,Z.z),Z[v]=0,Z[m]=0,Z[p]=R>0?1:-1,u.push(Z.x,Z.y,Z.z),h.push(mt/L),h.push(1-tt/D),b+=1}}for(let tt=0;tt<D;tt++)for(let j=0;j<L;j++){const mt=d+j+U*tt,q=d+j+U*(tt+1),K=d+(j+1)+U*(tt+1),B=d+(j+1)+U*tt;l.push(mt,q,B),l.push(q,K,B),P+=6}a.addGroup(f,P,E),f+=P,d+=b}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new pe(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function ji(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function ze(i){const t={};for(let e=0;e<i.length;e++){const n=ji(i[e]);for(const s in n)t[s]=n[s]}return t}function Zh(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function lu(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ae.workingColorSpace}const Kh={clone:ji,merge:ze};var Jh=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,$h=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Ee extends xi{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Jh,this.fragmentShader=$h,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ji(t.uniforms),this.uniformsGroups=Zh(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class cu extends Kt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new jt,this.projectionMatrix=new jt,this.projectionMatrixInverse=new jt,this.coordinateSystem=On}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Zn=new k,Cl=new Et,Rl=new Et;class Qe extends cu{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=fa*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Or*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return fa*2*Math.atan(Math.tan(Or*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Zn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Zn.x,Zn.y).multiplyScalar(-t/Zn.z),Zn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Zn.x,Zn.y).multiplyScalar(-t/Zn.z)}getViewSize(t,e){return this.getViewBounds(t,Cl,Rl),e.subVectors(Rl,Cl)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Or*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,e-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}const a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const Di=-90,Ui=1;class jh extends Kt{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Qe(Di,Ui,t,e);s.layers=this.layers,this.add(s);const r=new Qe(Di,Ui,t,e);r.layers=this.layers,this.add(r);const o=new Qe(Di,Ui,t,e);o.layers=this.layers,this.add(o);const a=new Qe(Di,Ui,t,e);a.layers=this.layers,this.add(a);const l=new Qe(Di,Ui,t,e);l.layers=this.layers,this.add(l);const c=new Qe(Di,Ui,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,l]=e;for(const c of e)this.remove(c);if(t===On)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===vr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,o,a,l,c,u]=this.children,h=t.getRenderTarget(),d=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,o),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=v,t.setRenderTarget(n,5,s),t.render(e,u),t.setRenderTarget(h,d,f),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class uu extends ke{constructor(t,e,n,s,r,o,a,l,c,u){t=t!==void 0?t:[],e=e!==void 0?e:qi,super(t,e,n,s,r,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Qh extends Qn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new uu(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Be}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new pe(5,5,5),r=new Ee({name:"CubemapFromEquirect",uniforms:ji(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ge,blending:Kn});r.uniforms.tEquirect.value=e;const o=new Yt(s,r),a=e.minFilter;return e.minFilter===Sn&&(e.minFilter=Be),new jh(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,s){const r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}}const so=new k,tf=new k,ef=new $t;class ui{constructor(t=new k(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=so.subVectors(n,e).cross(tf.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(so),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||ef.getNormalMatrix(t),s=this.coplanarPoint(so).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const ri=new Tn,Ks=new k;class Da{constructor(t=new ui,e=new ui,n=new ui,s=new ui,r=new ui,o=new ui){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=On){const n=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],u=s[5],h=s[6],d=s[7],f=s[8],g=s[9],v=s[10],m=s[11],p=s[12],y=s[13],M=s[14],x=s[15];if(n[0].setComponents(l-r,d-c,m-f,x-p).normalize(),n[1].setComponents(l+r,d+c,m+f,x+p).normalize(),n[2].setComponents(l+o,d+u,m+g,x+y).normalize(),n[3].setComponents(l-o,d-u,m-g,x-y).normalize(),n[4].setComponents(l-a,d-h,m-v,x-M).normalize(),e===On)n[5].setComponents(l+a,d+h,m+v,x+M).normalize();else if(e===vr)n[5].setComponents(a,h,v,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),ri.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),ri.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(ri)}intersectsSprite(t){return ri.center.set(0,0,0),ri.radius=.7071067811865476,ri.applyMatrix4(t.matrixWorld),this.intersectsSphere(ri)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(Ks.x=s.normal.x>0?t.max.x:t.min.x,Ks.y=s.normal.y>0?t.max.y:t.min.y,Ks.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Ks)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function hu(){let i=null,t=!1,e=null,n=null;function s(r,o){e(r,o),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function nf(i){const t=new WeakMap;function e(a,l){const c=a.array,u=a.usage,h=c.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,c,u),a.onUploadCallback();let f;if(c instanceof Float32Array)f=i.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=i.SHORT;else if(c instanceof Uint32Array)f=i.UNSIGNED_INT;else if(c instanceof Int32Array)f=i.INT;else if(c instanceof Int8Array)f=i.BYTE;else if(c instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:h}}function n(a,l,c){const u=l.array,h=l.updateRanges;if(i.bindBuffer(c,a),h.length===0)i.bufferSubData(c,0,u);else{h.sort((f,g)=>f.start-g.start);let d=0;for(let f=1;f<h.length;f++){const g=h[d],v=h[f];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++d,h[d]=v)}h.length=d+1;for(let f=0,g=h.length;f<g;f++){const v=h[f];i.bufferSubData(c,v.start*u.BYTES_PER_ELEMENT,u,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=t.get(a);l&&(i.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const u=t.get(a);(!u||u.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}class Bn extends ye{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,o=e/2,a=Math.floor(n),l=Math.floor(s),c=a+1,u=l+1,h=t/a,d=e/l,f=[],g=[],v=[],m=[];for(let p=0;p<u;p++){const y=p*d-o;for(let M=0;M<c;M++){const x=M*h-r;g.push(x,-y,0),v.push(0,0,1),m.push(M/a),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let y=0;y<a;y++){const M=y+c*p,x=y+c*(p+1),Y=y+1+c*(p+1),R=y+1+c*p;f.push(M,x,R),f.push(x,Y,R)}this.setIndex(f),this.setAttribute("position",new qt(g,3)),this.setAttribute("normal",new qt(v,3)),this.setAttribute("uv",new qt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Bn(t.width,t.height,t.widthSegments,t.heightSegments)}}var sf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,rf=`#ifdef USE_ALPHAHASH
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
#endif`,of=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,af=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,lf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,cf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,uf=`#ifdef USE_AOMAP
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
#endif`,hf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,ff=`#ifdef USE_BATCHING
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
#endif`,df=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,pf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,mf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,gf=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,vf=`#ifdef USE_IRIDESCENCE
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
#endif`,_f=`#ifdef USE_BUMPMAP
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
#endif`,xf=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Mf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,yf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Sf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,wf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,bf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Ef=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Tf=`#if defined( USE_COLOR_ALPHA )
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
#endif`,Af=`#define PI 3.141592653589793
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
} // validated`,Cf=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Rf=`vec3 transformedNormal = objectNormal;
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
#endif`,Pf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,If=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Lf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Df=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Uf="gl_FragColor = linearToOutputTexel( gl_FragColor );",Nf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Ff=`#ifdef USE_ENVMAP
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
#endif`,Of=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,kf=`#ifdef USE_ENVMAP
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
#endif`,zf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Bf=`#ifdef USE_ENVMAP
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
#endif`,Gf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Hf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Vf=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Wf=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Xf=`#ifdef USE_GRADIENTMAP
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
}`,Yf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,qf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Zf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Kf=`uniform bool receiveShadow;
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
#endif`,Jf=`#ifdef USE_ENVMAP
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
#endif`,$f=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,jf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Qf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,td=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,ed=`PhysicalMaterial material;
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
#endif`,nd=`struct PhysicalMaterial {
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
}`,id=`
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
#endif`,sd=`#if defined( RE_IndirectDiffuse )
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
#endif`,rd=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,od=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,ad=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ld=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,cd=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,ud=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,hd=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,fd=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,dd=`#if defined( USE_POINTS_UV )
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
#endif`,pd=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,md=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,gd=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,vd=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,_d=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,xd=`#ifdef USE_MORPHTARGETS
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
#endif`,Md=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,yd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Sd=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,wd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,bd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ed=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Td=`#ifdef USE_NORMALMAP
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
#endif`,Ad=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Cd=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Rd=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Pd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Id=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Ld=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Dd=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Ud=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Nd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Fd=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Od=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,kd=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,zd=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Bd=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Gd=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Hd=`float getShadowMask() {
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
}`,Vd=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Wd=`#ifdef USE_SKINNING
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
#endif`,Xd=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Yd=`#ifdef USE_SKINNING
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
#endif`,qd=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Zd=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Kd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Jd=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,$d=`#ifdef USE_TRANSMISSION
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
#endif`,jd=`#ifdef USE_TRANSMISSION
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
#endif`,Qd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,tp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,ep=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,np=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const ip=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,sp=`uniform sampler2D t2D;
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
}`,rp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,op=`#ifdef ENVMAP_TYPE_CUBE
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
}`,ap=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,lp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cp=`#include <common>
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
}`,up=`#if DEPTH_PACKING == 3200
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
}`,hp=`#define DISTANCE
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
}`,fp=`#define DISTANCE
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
}`,dp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,pp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,mp=`uniform float scale;
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
}`,gp=`uniform vec3 diffuse;
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
}`,vp=`#include <common>
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
}`,_p=`uniform vec3 diffuse;
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
}`,xp=`#define LAMBERT
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
}`,Mp=`#define LAMBERT
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
}`,yp=`#define MATCAP
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
}`,Sp=`#define MATCAP
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
}`,wp=`#define NORMAL
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
}`,bp=`#define NORMAL
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
}`,Ep=`#define PHONG
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
}`,Tp=`#define PHONG
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
}`,Ap=`#define STANDARD
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
}`,Cp=`#define STANDARD
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
}`,Rp=`#define TOON
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
}`,Pp=`#define TOON
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
}`,Ip=`uniform float size;
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
}`,Lp=`uniform vec3 diffuse;
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
}`,Dp=`#include <common>
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
}`,Up=`uniform vec3 color;
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
}`,Np=`uniform float rotation;
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
}`,Fp=`uniform vec3 diffuse;
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
}`,Qt={alphahash_fragment:sf,alphahash_pars_fragment:rf,alphamap_fragment:of,alphamap_pars_fragment:af,alphatest_fragment:lf,alphatest_pars_fragment:cf,aomap_fragment:uf,aomap_pars_fragment:hf,batching_pars_vertex:ff,batching_vertex:df,begin_vertex:pf,beginnormal_vertex:mf,bsdfs:gf,iridescence_fragment:vf,bumpmap_pars_fragment:_f,clipping_planes_fragment:xf,clipping_planes_pars_fragment:Mf,clipping_planes_pars_vertex:yf,clipping_planes_vertex:Sf,color_fragment:wf,color_pars_fragment:bf,color_pars_vertex:Ef,color_vertex:Tf,common:Af,cube_uv_reflection_fragment:Cf,defaultnormal_vertex:Rf,displacementmap_pars_vertex:Pf,displacementmap_vertex:If,emissivemap_fragment:Lf,emissivemap_pars_fragment:Df,colorspace_fragment:Uf,colorspace_pars_fragment:Nf,envmap_fragment:Ff,envmap_common_pars_fragment:Of,envmap_pars_fragment:kf,envmap_pars_vertex:zf,envmap_physical_pars_fragment:Jf,envmap_vertex:Bf,fog_vertex:Gf,fog_pars_vertex:Hf,fog_fragment:Vf,fog_pars_fragment:Wf,gradientmap_pars_fragment:Xf,lightmap_pars_fragment:Yf,lights_lambert_fragment:qf,lights_lambert_pars_fragment:Zf,lights_pars_begin:Kf,lights_toon_fragment:$f,lights_toon_pars_fragment:jf,lights_phong_fragment:Qf,lights_phong_pars_fragment:td,lights_physical_fragment:ed,lights_physical_pars_fragment:nd,lights_fragment_begin:id,lights_fragment_maps:sd,lights_fragment_end:rd,logdepthbuf_fragment:od,logdepthbuf_pars_fragment:ad,logdepthbuf_pars_vertex:ld,logdepthbuf_vertex:cd,map_fragment:ud,map_pars_fragment:hd,map_particle_fragment:fd,map_particle_pars_fragment:dd,metalnessmap_fragment:pd,metalnessmap_pars_fragment:md,morphinstance_vertex:gd,morphcolor_vertex:vd,morphnormal_vertex:_d,morphtarget_pars_vertex:xd,morphtarget_vertex:Md,normal_fragment_begin:yd,normal_fragment_maps:Sd,normal_pars_fragment:wd,normal_pars_vertex:bd,normal_vertex:Ed,normalmap_pars_fragment:Td,clearcoat_normal_fragment_begin:Ad,clearcoat_normal_fragment_maps:Cd,clearcoat_pars_fragment:Rd,iridescence_pars_fragment:Pd,opaque_fragment:Id,packing:Ld,premultiplied_alpha_fragment:Dd,project_vertex:Ud,dithering_fragment:Nd,dithering_pars_fragment:Fd,roughnessmap_fragment:Od,roughnessmap_pars_fragment:kd,shadowmap_pars_fragment:zd,shadowmap_pars_vertex:Bd,shadowmap_vertex:Gd,shadowmask_pars_fragment:Hd,skinbase_vertex:Vd,skinning_pars_vertex:Wd,skinning_vertex:Xd,skinnormal_vertex:Yd,specularmap_fragment:qd,specularmap_pars_fragment:Zd,tonemapping_fragment:Kd,tonemapping_pars_fragment:Jd,transmission_fragment:$d,transmission_pars_fragment:jd,uv_pars_fragment:Qd,uv_pars_vertex:tp,uv_vertex:ep,worldpos_vertex:np,background_vert:ip,background_frag:sp,backgroundCube_vert:rp,backgroundCube_frag:op,cube_vert:ap,cube_frag:lp,depth_vert:cp,depth_frag:up,distanceRGBA_vert:hp,distanceRGBA_frag:fp,equirect_vert:dp,equirect_frag:pp,linedashed_vert:mp,linedashed_frag:gp,meshbasic_vert:vp,meshbasic_frag:_p,meshlambert_vert:xp,meshlambert_frag:Mp,meshmatcap_vert:yp,meshmatcap_frag:Sp,meshnormal_vert:wp,meshnormal_frag:bp,meshphong_vert:Ep,meshphong_frag:Tp,meshphysical_vert:Ap,meshphysical_frag:Cp,meshtoon_vert:Rp,meshtoon_frag:Pp,points_vert:Ip,points_frag:Lp,shadow_vert:Dp,shadow_frag:Up,sprite_vert:Np,sprite_frag:Fp},Nt={common:{diffuse:{value:new ut(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new $t},alphaMap:{value:null},alphaMapTransform:{value:new $t},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new $t}},envmap:{envMap:{value:null},envMapRotation:{value:new $t},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new $t}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new $t}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new $t},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new $t},normalScale:{value:new Et(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new $t},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new $t}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new $t}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new $t}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ut(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ut(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new $t},alphaTest:{value:0},uvTransform:{value:new $t}},sprite:{diffuse:{value:new ut(16777215)},opacity:{value:1},center:{value:new Et(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new $t},alphaMap:{value:null},alphaMapTransform:{value:new $t},alphaTest:{value:0}}},Mn={basic:{uniforms:ze([Nt.common,Nt.specularmap,Nt.envmap,Nt.aomap,Nt.lightmap,Nt.fog]),vertexShader:Qt.meshbasic_vert,fragmentShader:Qt.meshbasic_frag},lambert:{uniforms:ze([Nt.common,Nt.specularmap,Nt.envmap,Nt.aomap,Nt.lightmap,Nt.emissivemap,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,Nt.fog,Nt.lights,{emissive:{value:new ut(0)}}]),vertexShader:Qt.meshlambert_vert,fragmentShader:Qt.meshlambert_frag},phong:{uniforms:ze([Nt.common,Nt.specularmap,Nt.envmap,Nt.aomap,Nt.lightmap,Nt.emissivemap,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,Nt.fog,Nt.lights,{emissive:{value:new ut(0)},specular:{value:new ut(1118481)},shininess:{value:30}}]),vertexShader:Qt.meshphong_vert,fragmentShader:Qt.meshphong_frag},standard:{uniforms:ze([Nt.common,Nt.envmap,Nt.aomap,Nt.lightmap,Nt.emissivemap,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,Nt.roughnessmap,Nt.metalnessmap,Nt.fog,Nt.lights,{emissive:{value:new ut(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Qt.meshphysical_vert,fragmentShader:Qt.meshphysical_frag},toon:{uniforms:ze([Nt.common,Nt.aomap,Nt.lightmap,Nt.emissivemap,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,Nt.gradientmap,Nt.fog,Nt.lights,{emissive:{value:new ut(0)}}]),vertexShader:Qt.meshtoon_vert,fragmentShader:Qt.meshtoon_frag},matcap:{uniforms:ze([Nt.common,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,Nt.fog,{matcap:{value:null}}]),vertexShader:Qt.meshmatcap_vert,fragmentShader:Qt.meshmatcap_frag},points:{uniforms:ze([Nt.points,Nt.fog]),vertexShader:Qt.points_vert,fragmentShader:Qt.points_frag},dashed:{uniforms:ze([Nt.common,Nt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Qt.linedashed_vert,fragmentShader:Qt.linedashed_frag},depth:{uniforms:ze([Nt.common,Nt.displacementmap]),vertexShader:Qt.depth_vert,fragmentShader:Qt.depth_frag},normal:{uniforms:ze([Nt.common,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,{opacity:{value:1}}]),vertexShader:Qt.meshnormal_vert,fragmentShader:Qt.meshnormal_frag},sprite:{uniforms:ze([Nt.sprite,Nt.fog]),vertexShader:Qt.sprite_vert,fragmentShader:Qt.sprite_frag},background:{uniforms:{uvTransform:{value:new $t},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Qt.background_vert,fragmentShader:Qt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new $t}},vertexShader:Qt.backgroundCube_vert,fragmentShader:Qt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Qt.cube_vert,fragmentShader:Qt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Qt.equirect_vert,fragmentShader:Qt.equirect_frag},distanceRGBA:{uniforms:ze([Nt.common,Nt.displacementmap,{referencePosition:{value:new k},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Qt.distanceRGBA_vert,fragmentShader:Qt.distanceRGBA_frag},shadow:{uniforms:ze([Nt.lights,Nt.fog,{color:{value:new ut(0)},opacity:{value:1}}]),vertexShader:Qt.shadow_vert,fragmentShader:Qt.shadow_frag}};Mn.physical={uniforms:ze([Mn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new $t},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new $t},clearcoatNormalScale:{value:new Et(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new $t},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new $t},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new $t},sheen:{value:0},sheenColor:{value:new ut(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new $t},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new $t},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new $t},transmissionSamplerSize:{value:new Et},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new $t},attenuationDistance:{value:0},attenuationColor:{value:new ut(0)},specularColor:{value:new ut(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new $t},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new $t},anisotropyVector:{value:new Et},anisotropyMap:{value:null},anisotropyMapTransform:{value:new $t}}]),vertexShader:Qt.meshphysical_vert,fragmentShader:Qt.meshphysical_frag};const Js={r:0,b:0,g:0},oi=new En,Op=new jt;function kp(i,t,e,n,s,r,o){const a=new ut(0);let l=r===!0?0:1,c,u,h=null,d=0,f=null;function g(y){let M=y.isScene===!0?y.background:null;return M&&M.isTexture&&(M=(y.backgroundBlurriness>0?e:t).get(M)),M}function v(y){let M=!1;const x=g(y);x===null?p(a,l):x&&x.isColor&&(p(x,1),M=!0);const Y=i.xr.getEnvironmentBlendMode();Y==="additive"?n.buffers.color.setClear(0,0,0,1,o):Y==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||M)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(y,M){const x=g(M);x&&(x.isCubeTexture||x.mapping===Cr)?(u===void 0&&(u=new Yt(new pe(1,1,1),new Ee({name:"BackgroundCubeMaterial",uniforms:ji(Mn.backgroundCube.uniforms),vertexShader:Mn.backgroundCube.vertexShader,fragmentShader:Mn.backgroundCube.fragmentShader,side:Ge,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(Y,R,L){this.matrixWorld.copyPosition(L.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(u)),oi.copy(M.backgroundRotation),oi.x*=-1,oi.y*=-1,oi.z*=-1,x.isCubeTexture&&x.isRenderTargetTexture===!1&&(oi.y*=-1,oi.z*=-1),u.material.uniforms.envMap.value=x,u.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(Op.makeRotationFromEuler(oi)),u.material.toneMapped=ae.getTransfer(x.colorSpace)!==de,(h!==x||d!==x.version||f!==i.toneMapping)&&(u.material.needsUpdate=!0,h=x,d=x.version,f=i.toneMapping),u.layers.enableAll(),y.unshift(u,u.geometry,u.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new Yt(new Bn(2,2),new Ee({name:"BackgroundMaterial",uniforms:ji(Mn.background.uniforms),vertexShader:Mn.background.vertexShader,fragmentShader:Mn.background.fragmentShader,side:jn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.toneMapped=ae.getTransfer(x.colorSpace)!==de,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(h!==x||d!==x.version||f!==i.toneMapping)&&(c.material.needsUpdate=!0,h=x,d=x.version,f=i.toneMapping),c.layers.enableAll(),y.unshift(c,c.geometry,c.material,0,0,null))}function p(y,M){y.getRGB(Js,lu(i)),n.buffers.color.setClear(Js.r,Js.g,Js.b,M,o)}return{getClearColor:function(){return a},setClearColor:function(y,M=1){a.set(y),l=M,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(y){l=y,p(a,l)},render:v,addToRenderList:m}}function zp(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null);let r=s,o=!1;function a(_,I,V,W,T){let U=!1;const z=h(W,V,I);r!==z&&(r=z,c(r.object)),U=f(_,W,V,T),U&&g(_,W,V,T),T!==null&&t.update(T,i.ELEMENT_ARRAY_BUFFER),(U||o)&&(o=!1,x(_,I,V,W),T!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(T).buffer))}function l(){return i.createVertexArray()}function c(_){return i.bindVertexArray(_)}function u(_){return i.deleteVertexArray(_)}function h(_,I,V){const W=V.wireframe===!0;let T=n[_.id];T===void 0&&(T={},n[_.id]=T);let U=T[I.id];U===void 0&&(U={},T[I.id]=U);let z=U[W];return z===void 0&&(z=d(l()),U[W]=z),z}function d(_){const I=[],V=[],W=[];for(let T=0;T<e;T++)I[T]=0,V[T]=0,W[T]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:I,enabledAttributes:V,attributeDivisors:W,object:_,attributes:{},index:null}}function f(_,I,V,W){const T=r.attributes,U=I.attributes;let z=0;const b=V.getAttributes();for(const P in b)if(b[P].location>=0){const tt=T[P];let j=U[P];if(j===void 0&&(P==="instanceMatrix"&&_.instanceMatrix&&(j=_.instanceMatrix),P==="instanceColor"&&_.instanceColor&&(j=_.instanceColor)),tt===void 0||tt.attribute!==j||j&&tt.data!==j.data)return!0;z++}return r.attributesNum!==z||r.index!==W}function g(_,I,V,W){const T={},U=I.attributes;let z=0;const b=V.getAttributes();for(const P in b)if(b[P].location>=0){let tt=U[P];tt===void 0&&(P==="instanceMatrix"&&_.instanceMatrix&&(tt=_.instanceMatrix),P==="instanceColor"&&_.instanceColor&&(tt=_.instanceColor));const j={};j.attribute=tt,tt&&tt.data&&(j.data=tt.data),T[P]=j,z++}r.attributes=T,r.attributesNum=z,r.index=W}function v(){const _=r.newAttributes;for(let I=0,V=_.length;I<V;I++)_[I]=0}function m(_){p(_,0)}function p(_,I){const V=r.newAttributes,W=r.enabledAttributes,T=r.attributeDivisors;V[_]=1,W[_]===0&&(i.enableVertexAttribArray(_),W[_]=1),T[_]!==I&&(i.vertexAttribDivisor(_,I),T[_]=I)}function y(){const _=r.newAttributes,I=r.enabledAttributes;for(let V=0,W=I.length;V<W;V++)I[V]!==_[V]&&(i.disableVertexAttribArray(V),I[V]=0)}function M(_,I,V,W,T,U,z){z===!0?i.vertexAttribIPointer(_,I,V,T,U):i.vertexAttribPointer(_,I,V,W,T,U)}function x(_,I,V,W){v();const T=W.attributes,U=V.getAttributes(),z=I.defaultAttributeValues;for(const b in U){const P=U[b];if(P.location>=0){let Z=T[b];if(Z===void 0&&(b==="instanceMatrix"&&_.instanceMatrix&&(Z=_.instanceMatrix),b==="instanceColor"&&_.instanceColor&&(Z=_.instanceColor)),Z!==void 0){const tt=Z.normalized,j=Z.itemSize,mt=t.get(Z);if(mt===void 0)continue;const q=mt.buffer,K=mt.type,B=mt.bytesPerElement,at=K===i.INT||K===i.UNSIGNED_INT||Z.gpuType===Ta;if(Z.isInterleavedBufferAttribute){const $=Z.data,ft=$.stride,At=Z.offset;if($.isInstancedInterleavedBuffer){for(let It=0;It<P.locationSize;It++)p(P.location+It,$.meshPerAttribute);_.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=$.meshPerAttribute*$.count)}else for(let It=0;It<P.locationSize;It++)m(P.location+It);i.bindBuffer(i.ARRAY_BUFFER,q);for(let It=0;It<P.locationSize;It++)M(P.location+It,j/P.locationSize,K,tt,ft*B,(At+j/P.locationSize*It)*B,at)}else{if(Z.isInstancedBufferAttribute){for(let $=0;$<P.locationSize;$++)p(P.location+$,Z.meshPerAttribute);_.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let $=0;$<P.locationSize;$++)m(P.location+$);i.bindBuffer(i.ARRAY_BUFFER,q);for(let $=0;$<P.locationSize;$++)M(P.location+$,j/P.locationSize,K,tt,j*B,j/P.locationSize*$*B,at)}}else if(z!==void 0){const tt=z[b];if(tt!==void 0)switch(tt.length){case 2:i.vertexAttrib2fv(P.location,tt);break;case 3:i.vertexAttrib3fv(P.location,tt);break;case 4:i.vertexAttrib4fv(P.location,tt);break;default:i.vertexAttrib1fv(P.location,tt)}}}}y()}function Y(){D();for(const _ in n){const I=n[_];for(const V in I){const W=I[V];for(const T in W)u(W[T].object),delete W[T];delete I[V]}delete n[_]}}function R(_){if(n[_.id]===void 0)return;const I=n[_.id];for(const V in I){const W=I[V];for(const T in W)u(W[T].object),delete W[T];delete I[V]}delete n[_.id]}function L(_){for(const I in n){const V=n[I];if(V[_.id]===void 0)continue;const W=V[_.id];for(const T in W)u(W[T].object),delete W[T];delete V[_.id]}}function D(){E(),o=!0,r!==s&&(r=s,c(r.object))}function E(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:D,resetDefaultState:E,dispose:Y,releaseStatesOfGeometry:R,releaseStatesOfProgram:L,initAttributes:v,enableAttribute:m,disableUnusedAttributes:y}}function Bp(i,t,e){let n;function s(c){n=c}function r(c,u){i.drawArrays(n,c,u),e.update(u,n,1)}function o(c,u,h){h!==0&&(i.drawArraysInstanced(n,c,u,h),e.update(u,n,h))}function a(c,u,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,h);let f=0;for(let g=0;g<h;g++)f+=u[g];e.update(f,n,1)}function l(c,u,h,d){if(h===0)return;const f=t.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<c.length;g++)o(c[g],u[g],d[g]);else{f.multiDrawArraysInstancedWEBGL(n,c,0,u,0,d,0,h);let g=0;for(let v=0;v<h;v++)g+=u[v]*d[v];e.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function Gp(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const L=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(L.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(L){return!(L!==qe&&n.convert(L)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(L){const D=L===Qi&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(L!==bn&&n.convert(L)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&L!==mn&&!D)}function l(L){if(L==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";L="mediump"}return L==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const h=e.logarithmicDepthBuffer===!0,d=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),y=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),M=i.getParameter(i.MAX_VARYING_VECTORS),x=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),Y=g>0,R=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:h,reverseDepthBuffer:d,maxTextures:f,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:y,maxVaryings:M,maxFragmentUniforms:x,vertexTextures:Y,maxSamples:R}}function Hp(i){const t=this;let e=null,n=0,s=!1,r=!1;const o=new ui,a=new $t,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const f=h.length!==0||d||n!==0||s;return s=d,n=h.length,f},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,d){e=u(h,d,0)},this.setState=function(h,d,f){const g=h.clippingPlanes,v=h.clipIntersection,m=h.clipShadows,p=i.get(h);if(!s||g===null||g.length===0||r&&!m)r?u(null):c();else{const y=r?0:n,M=y*4;let x=p.clippingState||null;l.value=x,x=u(g,d,M,f);for(let Y=0;Y!==M;++Y)x[Y]=e[Y];p.clippingState=x,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=y}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(h,d,f,g){const v=h!==null?h.length:0;let m=null;if(v!==0){if(m=l.value,g!==!0||m===null){const p=f+v*4,y=d.matrixWorldInverse;a.getNormalMatrix(y),(m===null||m.length<p)&&(m=new Float32Array(p));for(let M=0,x=f;M!==v;++M,x+=4)o.copy(h[M]).applyMatrix4(y,a),o.normal.toArray(m,x),m[x+3]=o.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,m}}function Vp(i){let t=new WeakMap;function e(o,a){return a===Oo?o.mapping=qi:a===ko&&(o.mapping=Zi),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===Oo||a===ko)if(t.has(o)){const l=t.get(o).texture;return e(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new Qh(l.height);return c.fromEquirectangularTexture(i,o),t.set(o,c),o.addEventListener("dispose",s),e(c.texture,o.mapping)}else return null}}return o}function s(o){const a=o.target;a.removeEventListener("dispose",s);const l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}class Ua extends cu{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,o=n+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const Gi=4,Pl=[.125,.215,.35,.446,.526,.582],di=20,ro=new Ua,Il=new ut;let oo=null,ao=0,lo=0,co=!1;const hi=(1+Math.sqrt(5))/2,Ni=1/hi,Ll=[new k(-hi,Ni,0),new k(hi,Ni,0),new k(-Ni,0,hi),new k(Ni,0,hi),new k(0,hi,-Ni),new k(0,hi,Ni),new k(-1,1,-1),new k(1,1,-1),new k(-1,1,1),new k(1,1,1)];class da{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){oo=this._renderer.getRenderTarget(),ao=this._renderer.getActiveCubeFace(),lo=this._renderer.getActiveMipmapLevel(),co=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Nl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ul(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(oo,ao,lo),this._renderer.xr.enabled=co,t.scissorTest=!1,$s(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===qi||t.mapping===Zi?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),oo=this._renderer.getRenderTarget(),ao=this._renderer.getActiveCubeFace(),lo=this._renderer.getActiveMipmapLevel(),co=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Be,minFilter:Be,generateMipmaps:!1,type:Qi,format:qe,colorSpace:ts,depthBuffer:!1},s=Dl(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Dl(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Wp(r)),this._blurMaterial=Xp(r,t,e)}return s}_compileMaterial(t){const e=new Yt(this._lodPlanes[0],t);this._renderer.compile(e,ro)}_sceneToCubeUV(t,e,n,s){const a=new Qe(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,d=u.toneMapping;u.getClearColor(Il),u.toneMapping=kn,u.autoClear=!1;const f=new gn({name:"PMREM.Background",side:Ge,depthWrite:!1,depthTest:!1}),g=new Yt(new pe,f);let v=!1;const m=t.background;m?m.isColor&&(f.color.copy(m),t.background=null,v=!0):(f.color.copy(Il),v=!0);for(let p=0;p<6;p++){const y=p%3;y===0?(a.up.set(0,l[p],0),a.lookAt(c[p],0,0)):y===1?(a.up.set(0,0,l[p]),a.lookAt(0,c[p],0)):(a.up.set(0,l[p],0),a.lookAt(0,0,c[p]));const M=this._cubeSize;$s(s,y*M,p>2?M:0,M,M),u.setRenderTarget(s),v&&u.render(g,a),u.render(t,a)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=d,u.autoClear=h,t.background=m}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===qi||t.mapping===Zi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Nl()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ul());const r=s?this._cubemapMaterial:this._equirectMaterial,o=new Yt(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;const l=this._cubeSize;$s(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,ro)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodPlanes.length;for(let r=1;r<s;r++){const o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Ll[(s-r-1)%Ll.length];this._blur(t,r-1,r,o,a)}e.autoClear=n}_blur(t,e,n,s,r){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,s,"latitudinal",r),this._halfBlur(o,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new Yt(this._lodPlanes[s],c),d=c.uniforms,f=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*di-1),v=r/g,m=isFinite(r)?1+Math.floor(u*v):di;m>di&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${di}`);const p=[];let y=0;for(let L=0;L<di;++L){const D=L/v,E=Math.exp(-D*D/2);p.push(E),L===0?y+=E:L<m&&(y+=2*E)}for(let L=0;L<p.length;L++)p[L]=p[L]/y;d.envMap.value=t.texture,d.samples.value=m,d.weights.value=p,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);const{_lodMax:M}=this;d.dTheta.value=g,d.mipInt.value=M-n;const x=this._sizeLods[s],Y=3*x*(s>M-Gi?s-M+Gi:0),R=4*(this._cubeSize-x);$s(e,Y,R,3*x,2*x),l.setRenderTarget(e),l.render(h,ro)}}function Wp(i){const t=[],e=[],n=[];let s=i;const r=i-Gi+1+Pl.length;for(let o=0;o<r;o++){const a=Math.pow(2,s);e.push(a);let l=1/a;o>i-Gi?l=Pl[o-i+Gi-1]:o===0&&(l=0),n.push(l);const c=1/(a-2),u=-c,h=1+c,d=[u,u,h,u,h,h,u,u,h,h,u,h],f=6,g=6,v=3,m=2,p=1,y=new Float32Array(v*g*f),M=new Float32Array(m*g*f),x=new Float32Array(p*g*f);for(let R=0;R<f;R++){const L=R%3*2/3-1,D=R>2?0:-1,E=[L,D,0,L+2/3,D,0,L+2/3,D+1,0,L,D,0,L+2/3,D+1,0,L,D+1,0];y.set(E,v*g*R),M.set(d,m*g*R);const _=[R,R,R,R,R,R];x.set(_,p*g*R)}const Y=new ye;Y.setAttribute("position",new Se(y,v)),Y.setAttribute("uv",new Se(M,m)),Y.setAttribute("faceIndex",new Se(x,p)),t.push(Y),s>Gi&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Dl(i,t,e){const n=new Qn(i,t,e);return n.texture.mapping=Cr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function $s(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function Xp(i,t,e){const n=new Float32Array(di),s=new k(0,1,0);return new Ee({name:"SphericalGaussianBlur",defines:{n:di,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Na(),fragmentShader:`

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
		`,blending:Kn,depthTest:!1,depthWrite:!1})}function Ul(){return new Ee({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Na(),fragmentShader:`

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
		`,blending:Kn,depthTest:!1,depthWrite:!1})}function Nl(){return new Ee({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Na(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Kn,depthTest:!1,depthWrite:!1})}function Na(){return`

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
	`}function Yp(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const l=a.mapping,c=l===Oo||l===ko,u=l===qi||l===Zi;if(c||u){let h=t.get(a);const d=h!==void 0?h.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return e===null&&(e=new da(i)),h=c?e.fromEquirectangular(a,h):e.fromCubemap(a,h),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),h.texture;if(h!==void 0)return h.texture;{const f=a.image;return c&&f&&f.height>0||u&&f&&s(f)?(e===null&&(e=new da(i)),h=c?e.fromEquirectangular(a):e.fromCubemap(a),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),a.addEventListener("dispose",r),h.texture):null}}}return a}function s(a){let l=0;const c=6;for(let u=0;u<c;u++)a[u]!==void 0&&l++;return l===c}function r(a){const l=a.target;l.removeEventListener("dispose",r);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function qp(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&vs("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function Zp(i,t,e,n){const s={},r=new WeakMap;function o(h){const d=h.target;d.index!==null&&t.remove(d.index);for(const g in d.attributes)t.remove(d.attributes[g]);for(const g in d.morphAttributes){const v=d.morphAttributes[g];for(let m=0,p=v.length;m<p;m++)t.remove(v[m])}d.removeEventListener("dispose",o),delete s[d.id];const f=r.get(d);f&&(t.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function a(h,d){return s[d.id]===!0||(d.addEventListener("dispose",o),s[d.id]=!0,e.memory.geometries++),d}function l(h){const d=h.attributes;for(const g in d)t.update(d[g],i.ARRAY_BUFFER);const f=h.morphAttributes;for(const g in f){const v=f[g];for(let m=0,p=v.length;m<p;m++)t.update(v[m],i.ARRAY_BUFFER)}}function c(h){const d=[],f=h.index,g=h.attributes.position;let v=0;if(f!==null){const y=f.array;v=f.version;for(let M=0,x=y.length;M<x;M+=3){const Y=y[M+0],R=y[M+1],L=y[M+2];d.push(Y,R,R,L,L,Y)}}else if(g!==void 0){const y=g.array;v=g.version;for(let M=0,x=y.length/3-1;M<x;M+=3){const Y=M+0,R=M+1,L=M+2;d.push(Y,R,R,L,L,Y)}}else return;const m=new(eu(d)?au:ou)(d,1);m.version=v;const p=r.get(h);p&&t.remove(p),r.set(h,m)}function u(h){const d=r.get(h);if(d){const f=h.index;f!==null&&d.version<f.version&&c(h)}else c(h);return r.get(h)}return{get:a,update:l,getWireframeAttribute:u}}function Kp(i,t,e){let n;function s(d){n=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function l(d,f){i.drawElements(n,f,r,d*o),e.update(f,n,1)}function c(d,f,g){g!==0&&(i.drawElementsInstanced(n,f,r,d*o,g),e.update(f,n,g))}function u(d,f,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,d,0,g);let m=0;for(let p=0;p<g;p++)m+=f[p];e.update(m,n,1)}function h(d,f,g,v){if(g===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<d.length;p++)c(d[p]/o,f[p],v[p]);else{m.multiDrawElementsInstancedWEBGL(n,f,0,r,d,0,v,0,g);let p=0;for(let y=0;y<g;y++)p+=f[y]*v[y];e.update(p,n,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=h}function Jp(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function $p(i,t,e){const n=new WeakMap,s=new ce;function r(o,a,l){const c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0;let d=n.get(a);if(d===void 0||d.count!==h){let E=function(){L.dispose(),n.delete(a),a.removeEventListener("dispose",E)};d!==void 0&&d.texture.dispose();const f=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,v=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],y=a.morphAttributes.color||[];let M=0;f===!0&&(M=1),g===!0&&(M=2),v===!0&&(M=3);let x=a.attributes.position.count*M,Y=1;x>t.maxTextureSize&&(Y=Math.ceil(x/t.maxTextureSize),x=t.maxTextureSize);const R=new Float32Array(x*Y*4*h),L=new iu(R,x,Y,h);L.type=mn,L.needsUpdate=!0;const D=M*4;for(let _=0;_<h;_++){const I=m[_],V=p[_],W=y[_],T=x*Y*4*_;for(let U=0;U<I.count;U++){const z=U*D;f===!0&&(s.fromBufferAttribute(I,U),R[T+z+0]=s.x,R[T+z+1]=s.y,R[T+z+2]=s.z,R[T+z+3]=0),g===!0&&(s.fromBufferAttribute(V,U),R[T+z+4]=s.x,R[T+z+5]=s.y,R[T+z+6]=s.z,R[T+z+7]=0),v===!0&&(s.fromBufferAttribute(W,U),R[T+z+8]=s.x,R[T+z+9]=s.y,R[T+z+10]=s.z,R[T+z+11]=W.itemSize===4?s.w:1)}}d={count:h,texture:L,size:new Et(x,Y)},n.set(a,d),a.addEventListener("dispose",E)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let f=0;for(let v=0;v<c.length;v++)f+=c[v];const g=a.morphTargetsRelative?1:1-f;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function jp(i,t,e,n){let s=new WeakMap;function r(l){const c=n.render.frame,u=l.geometry,h=t.get(l,u);if(s.get(h)!==c&&(t.update(h),s.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){const d=l.skeleton;s.get(d)!==c&&(d.update(),s.set(d,c))}return h}function o(){s=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:o}}class fu extends ke{constructor(t,e,n,s,r,o,a,l,c,u=Vi){if(u!==Vi&&u!==$i)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===Vi&&(n=gi),n===void 0&&u===$i&&(n=Ji),super(null,s,r,o,a,l,u,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:tn,this.minFilter=l!==void 0?l:tn,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const du=new ke,Fl=new fu(1,1),pu=new iu,mu=new Oh,gu=new uu,Ol=[],kl=[],zl=new Float32Array(16),Bl=new Float32Array(9),Gl=new Float32Array(4);function ns(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=Ol[s];if(r===void 0&&(r=new Float32Array(s),Ol[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function Te(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Ae(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Ir(i,t){let e=kl[t];e===void 0&&(e=new Int32Array(t),kl[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function Qp(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function tm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Te(e,t))return;i.uniform2fv(this.addr,t),Ae(e,t)}}function em(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Te(e,t))return;i.uniform3fv(this.addr,t),Ae(e,t)}}function nm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Te(e,t))return;i.uniform4fv(this.addr,t),Ae(e,t)}}function im(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Te(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Ae(e,t)}else{if(Te(e,n))return;Gl.set(n),i.uniformMatrix2fv(this.addr,!1,Gl),Ae(e,n)}}function sm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Te(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Ae(e,t)}else{if(Te(e,n))return;Bl.set(n),i.uniformMatrix3fv(this.addr,!1,Bl),Ae(e,n)}}function rm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Te(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Ae(e,t)}else{if(Te(e,n))return;zl.set(n),i.uniformMatrix4fv(this.addr,!1,zl),Ae(e,n)}}function om(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function am(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Te(e,t))return;i.uniform2iv(this.addr,t),Ae(e,t)}}function lm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Te(e,t))return;i.uniform3iv(this.addr,t),Ae(e,t)}}function cm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Te(e,t))return;i.uniform4iv(this.addr,t),Ae(e,t)}}function um(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function hm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Te(e,t))return;i.uniform2uiv(this.addr,t),Ae(e,t)}}function fm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Te(e,t))return;i.uniform3uiv(this.addr,t),Ae(e,t)}}function dm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Te(e,t))return;i.uniform4uiv(this.addr,t),Ae(e,t)}}function pm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Fl.compareFunction=tu,r=Fl):r=du,e.setTexture2D(t||r,s)}function mm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||mu,s)}function gm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||gu,s)}function vm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||pu,s)}function _m(i){switch(i){case 5126:return Qp;case 35664:return tm;case 35665:return em;case 35666:return nm;case 35674:return im;case 35675:return sm;case 35676:return rm;case 5124:case 35670:return om;case 35667:case 35671:return am;case 35668:case 35672:return lm;case 35669:case 35673:return cm;case 5125:return um;case 36294:return hm;case 36295:return fm;case 36296:return dm;case 35678:case 36198:case 36298:case 36306:case 35682:return pm;case 35679:case 36299:case 36307:return mm;case 35680:case 36300:case 36308:case 36293:return gm;case 36289:case 36303:case 36311:case 36292:return vm}}function xm(i,t){i.uniform1fv(this.addr,t)}function Mm(i,t){const e=ns(t,this.size,2);i.uniform2fv(this.addr,e)}function ym(i,t){const e=ns(t,this.size,3);i.uniform3fv(this.addr,e)}function Sm(i,t){const e=ns(t,this.size,4);i.uniform4fv(this.addr,e)}function wm(i,t){const e=ns(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function bm(i,t){const e=ns(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Em(i,t){const e=ns(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Tm(i,t){i.uniform1iv(this.addr,t)}function Am(i,t){i.uniform2iv(this.addr,t)}function Cm(i,t){i.uniform3iv(this.addr,t)}function Rm(i,t){i.uniform4iv(this.addr,t)}function Pm(i,t){i.uniform1uiv(this.addr,t)}function Im(i,t){i.uniform2uiv(this.addr,t)}function Lm(i,t){i.uniform3uiv(this.addr,t)}function Dm(i,t){i.uniform4uiv(this.addr,t)}function Um(i,t,e){const n=this.cache,s=t.length,r=Ir(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||du,r[o])}function Nm(i,t,e){const n=this.cache,s=t.length,r=Ir(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||mu,r[o])}function Fm(i,t,e){const n=this.cache,s=t.length,r=Ir(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||gu,r[o])}function Om(i,t,e){const n=this.cache,s=t.length,r=Ir(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||pu,r[o])}function km(i){switch(i){case 5126:return xm;case 35664:return Mm;case 35665:return ym;case 35666:return Sm;case 35674:return wm;case 35675:return bm;case 35676:return Em;case 5124:case 35670:return Tm;case 35667:case 35671:return Am;case 35668:case 35672:return Cm;case 35669:case 35673:return Rm;case 5125:return Pm;case 36294:return Im;case 36295:return Lm;case 36296:return Dm;case 35678:case 36198:case 36298:case 36306:case 35682:return Um;case 35679:case 36299:case 36307:return Nm;case 35680:case 36300:case 36308:case 36293:return Fm;case 36289:case 36303:case 36311:case 36292:return Om}}class zm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=_m(e.type)}}class Bm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=km(e.type)}}class Gm{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,o=s.length;r!==o;++r){const a=s[r];a.setValue(t,e[a.id],n)}}}const uo=/(\w+)(\])?(\[|\.)?/g;function Hl(i,t){i.seq.push(t),i.map[t.id]=t}function Hm(i,t,e){const n=i.name,s=n.length;for(uo.lastIndex=0;;){const r=uo.exec(n),o=uo.lastIndex;let a=r[1];const l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){Hl(e,c===void 0?new zm(a,i,t):new Bm(a,i,t));break}else{let h=e.map[a];h===void 0&&(h=new Gm(a),Hl(e,h)),e=h}}}class mr{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);Hm(r,o,this)}}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){const a=e[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const o=t[s];o.id in e&&n.push(o)}return n}}function Vl(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const Vm=37297;let Wm=0;function Xm(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}const Wl=new $t;function Ym(i){ae._getMatrix(Wl,ae.workingColorSpace,i);const t=`mat3( ${Wl.elements.map(e=>e.toFixed(4))} )`;switch(ae.getTransfer(i)){case Rr:return[t,"LinearTransferOETF"];case de:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Xl(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+Xm(i.getShaderSource(t),o)}else return s}function qm(i,t){const e=Ym(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function Zm(i,t){let e;switch(t){case ch:e="Linear";break;case uh:e="Reinhard";break;case hh:e="Cineon";break;case fh:e="ACESFilmic";break;case ph:e="AgX";break;case mh:e="Neutral";break;case dh:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const js=new k;function Km(){ae.getLuminanceCoefficients(js);const i=js.x.toFixed(4),t=js.y.toFixed(4),e=js.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Jm(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(_s).join(`
`)}function $m(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function jm(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),o=r.name;let a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function _s(i){return i!==""}function Yl(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function ql(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const Qm=/^[ \t]*#include +<([\w\d./]+)>/gm;function pa(i){return i.replace(Qm,e0)}const t0=new Map;function e0(i,t){let e=Qt[t];if(e===void 0){const n=t0.get(t);if(n!==void 0)e=Qt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return pa(e)}const n0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Zl(i){return i.replace(n0,i0)}function i0(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Kl(i){let t=`precision ${i.precision} float;
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
#define LOW_PRECISION`),t}function s0(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Ea?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===Gc?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Nn&&(t="SHADOWMAP_TYPE_VSM"),t}function r0(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case qi:case Zi:t="ENVMAP_TYPE_CUBE";break;case Cr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function o0(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case Zi:t="ENVMAP_MODE_REFRACTION";break}return t}function a0(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Hc:t="ENVMAP_BLENDING_MULTIPLY";break;case ah:t="ENVMAP_BLENDING_MIX";break;case lh:t="ENVMAP_BLENDING_ADD";break}return t}function l0(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function c0(i,t,e,n){const s=i.getContext(),r=e.defines;let o=e.vertexShader,a=e.fragmentShader;const l=s0(e),c=r0(e),u=o0(e),h=a0(e),d=l0(e),f=Jm(e),g=$m(r),v=s.createProgram();let m,p,y=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(_s).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(_s).join(`
`),p.length>0&&(p+=`
`)):(m=[Kl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(_s).join(`
`),p=[Kl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==kn?"#define TONE_MAPPING":"",e.toneMapping!==kn?Qt.tonemapping_pars_fragment:"",e.toneMapping!==kn?Zm("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Qt.colorspace_pars_fragment,qm("linearToOutputTexel",e.outputColorSpace),Km(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(_s).join(`
`)),o=pa(o),o=Yl(o,e),o=ql(o,e),a=pa(a),a=Yl(a,e),a=ql(a,e),o=Zl(o),a=Zl(a),e.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",e.glslVersion===cl?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===cl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const M=y+m+o,x=y+p+a,Y=Vl(s,s.VERTEX_SHADER,M),R=Vl(s,s.FRAGMENT_SHADER,x);s.attachShader(v,Y),s.attachShader(v,R),e.index0AttributeName!==void 0?s.bindAttribLocation(v,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(v,0,"position"),s.linkProgram(v);function L(I){if(i.debug.checkShaderErrors){const V=s.getProgramInfoLog(v).trim(),W=s.getShaderInfoLog(Y).trim(),T=s.getShaderInfoLog(R).trim();let U=!0,z=!0;if(s.getProgramParameter(v,s.LINK_STATUS)===!1)if(U=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,v,Y,R);else{const b=Xl(s,Y,"vertex"),P=Xl(s,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(v,s.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+V+`
`+b+`
`+P)}else V!==""?console.warn("THREE.WebGLProgram: Program Info Log:",V):(W===""||T==="")&&(z=!1);z&&(I.diagnostics={runnable:U,programLog:V,vertexShader:{log:W,prefix:m},fragmentShader:{log:T,prefix:p}})}s.deleteShader(Y),s.deleteShader(R),D=new mr(s,v),E=jm(s,v)}let D;this.getUniforms=function(){return D===void 0&&L(this),D};let E;this.getAttributes=function(){return E===void 0&&L(this),E};let _=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return _===!1&&(_=s.getProgramParameter(v,Vm)),_},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(v),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Wm++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=Y,this.fragmentShader=R,this}let u0=0;class h0{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new f0(t),e.set(t,n)),n}}class f0{constructor(t){this.id=u0++,this.code=t,this.usedTimes=0}}function d0(i,t,e,n,s,r,o){const a=new su,l=new h0,c=new Set,u=[],h=s.logarithmicDepthBuffer,d=s.vertexTextures;let f=s.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(E){return c.add(E),E===0?"uv":`uv${E}`}function m(E,_,I,V,W){const T=V.fog,U=W.geometry,z=E.isMeshStandardMaterial?V.environment:null,b=(E.isMeshStandardMaterial?e:t).get(E.envMap||z),P=b&&b.mapping===Cr?b.image.height:null,Z=g[E.type];E.precision!==null&&(f=s.getMaxPrecision(E.precision),f!==E.precision&&console.warn("THREE.WebGLProgram.getParameters:",E.precision,"not supported, using",f,"instead."));const tt=U.morphAttributes.position||U.morphAttributes.normal||U.morphAttributes.color,j=tt!==void 0?tt.length:0;let mt=0;U.morphAttributes.position!==void 0&&(mt=1),U.morphAttributes.normal!==void 0&&(mt=2),U.morphAttributes.color!==void 0&&(mt=3);let q,K,B,at;if(Z){const zt=Mn[Z];q=zt.vertexShader,K=zt.fragmentShader}else q=E.vertexShader,K=E.fragmentShader,l.update(E),B=l.getVertexShaderID(E),at=l.getFragmentShaderID(E);const $=i.getRenderTarget(),ft=i.state.buffers.depth.getReversed(),At=W.isInstancedMesh===!0,It=W.isBatchedMesh===!0,Gt=!!E.map,xt=!!E.matcap,Tt=!!b,N=!!E.aoMap,S=!!E.lightMap,G=!!E.bumpMap,H=!!E.normalMap,F=!!E.displacementMap,lt=!!E.emissiveMap,ot=!!E.metalnessMap,A=!!E.roughnessMap,w=E.anisotropy>0,rt=E.clearcoat>0,yt=E.dispersion>0,J=E.iridescence>0,et=E.sheen>0,bt=E.transmission>0,dt=w&&!!E.anisotropyMap,Mt=rt&&!!E.clearcoatMap,Pt=rt&&!!E.clearcoatNormalMap,gt=rt&&!!E.clearcoatRoughnessMap,Rt=J&&!!E.iridescenceMap,Ft=J&&!!E.iridescenceThicknessMap,X=et&&!!E.sheenColorMap,Q=et&&!!E.sheenRoughnessMap,ct=!!E.specularMap,st=!!E.specularColorMap,St=!!E.specularIntensityMap,O=bt&&!!E.transmissionMap,wt=bt&&!!E.thicknessMap,ht=!!E.gradientMap,pt=!!E.alphaMap,Ct=E.alphaTest>0,Lt=!!E.alphaHash,Ot=!!E.extensions;let ne=kn;E.toneMapped&&($===null||$.isXRRenderTarget===!0)&&(ne=i.toneMapping);const fe={shaderID:Z,shaderType:E.type,shaderName:E.name,vertexShader:q,fragmentShader:K,defines:E.defines,customVertexShaderID:B,customFragmentShaderID:at,isRawShaderMaterial:E.isRawShaderMaterial===!0,glslVersion:E.glslVersion,precision:f,batching:It,batchingColor:It&&W._colorsTexture!==null,instancing:At,instancingColor:At&&W.instanceColor!==null,instancingMorph:At&&W.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:$===null?i.outputColorSpace:$.isXRRenderTarget===!0?$.texture.colorSpace:ts,alphaToCoverage:!!E.alphaToCoverage,map:Gt,matcap:xt,envMap:Tt,envMapMode:Tt&&b.mapping,envMapCubeUVHeight:P,aoMap:N,lightMap:S,bumpMap:G,normalMap:H,displacementMap:d&&F,emissiveMap:lt,normalMapObjectSpace:H&&E.normalMapType===Mh,normalMapTangentSpace:H&&E.normalMapType===Qc,metalnessMap:ot,roughnessMap:A,anisotropy:w,anisotropyMap:dt,clearcoat:rt,clearcoatMap:Mt,clearcoatNormalMap:Pt,clearcoatRoughnessMap:gt,dispersion:yt,iridescence:J,iridescenceMap:Rt,iridescenceThicknessMap:Ft,sheen:et,sheenColorMap:X,sheenRoughnessMap:Q,specularMap:ct,specularColorMap:st,specularIntensityMap:St,transmission:bt,transmissionMap:O,thicknessMap:wt,gradientMap:ht,opaque:E.transparent===!1&&E.blending===He&&E.alphaToCoverage===!1,alphaMap:pt,alphaTest:Ct,alphaHash:Lt,combine:E.combine,mapUv:Gt&&v(E.map.channel),aoMapUv:N&&v(E.aoMap.channel),lightMapUv:S&&v(E.lightMap.channel),bumpMapUv:G&&v(E.bumpMap.channel),normalMapUv:H&&v(E.normalMap.channel),displacementMapUv:F&&v(E.displacementMap.channel),emissiveMapUv:lt&&v(E.emissiveMap.channel),metalnessMapUv:ot&&v(E.metalnessMap.channel),roughnessMapUv:A&&v(E.roughnessMap.channel),anisotropyMapUv:dt&&v(E.anisotropyMap.channel),clearcoatMapUv:Mt&&v(E.clearcoatMap.channel),clearcoatNormalMapUv:Pt&&v(E.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:gt&&v(E.clearcoatRoughnessMap.channel),iridescenceMapUv:Rt&&v(E.iridescenceMap.channel),iridescenceThicknessMapUv:Ft&&v(E.iridescenceThicknessMap.channel),sheenColorMapUv:X&&v(E.sheenColorMap.channel),sheenRoughnessMapUv:Q&&v(E.sheenRoughnessMap.channel),specularMapUv:ct&&v(E.specularMap.channel),specularColorMapUv:st&&v(E.specularColorMap.channel),specularIntensityMapUv:St&&v(E.specularIntensityMap.channel),transmissionMapUv:O&&v(E.transmissionMap.channel),thicknessMapUv:wt&&v(E.thicknessMap.channel),alphaMapUv:pt&&v(E.alphaMap.channel),vertexTangents:!!U.attributes.tangent&&(H||w),vertexColors:E.vertexColors,vertexAlphas:E.vertexColors===!0&&!!U.attributes.color&&U.attributes.color.itemSize===4,pointsUvs:W.isPoints===!0&&!!U.attributes.uv&&(Gt||pt),fog:!!T,useFog:E.fog===!0,fogExp2:!!T&&T.isFogExp2,flatShading:E.flatShading===!0,sizeAttenuation:E.sizeAttenuation===!0,logarithmicDepthBuffer:h,reverseDepthBuffer:ft,skinning:W.isSkinnedMesh===!0,morphTargets:U.morphAttributes.position!==void 0,morphNormals:U.morphAttributes.normal!==void 0,morphColors:U.morphAttributes.color!==void 0,morphTargetsCount:j,morphTextureStride:mt,numDirLights:_.directional.length,numPointLights:_.point.length,numSpotLights:_.spot.length,numSpotLightMaps:_.spotLightMap.length,numRectAreaLights:_.rectArea.length,numHemiLights:_.hemi.length,numDirLightShadows:_.directionalShadowMap.length,numPointLightShadows:_.pointShadowMap.length,numSpotLightShadows:_.spotShadowMap.length,numSpotLightShadowsWithMaps:_.numSpotLightShadowsWithMaps,numLightProbes:_.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:E.dithering,shadowMapEnabled:i.shadowMap.enabled&&I.length>0,shadowMapType:i.shadowMap.type,toneMapping:ne,decodeVideoTexture:Gt&&E.map.isVideoTexture===!0&&ae.getTransfer(E.map.colorSpace)===de,decodeVideoTextureEmissive:lt&&E.emissiveMap.isVideoTexture===!0&&ae.getTransfer(E.emissiveMap.colorSpace)===de,premultipliedAlpha:E.premultipliedAlpha,doubleSided:E.side===Ie,flipSided:E.side===Ge,useDepthPacking:E.depthPacking>=0,depthPacking:E.depthPacking||0,index0AttributeName:E.index0AttributeName,extensionClipCullDistance:Ot&&E.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ot&&E.extensions.multiDraw===!0||It)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:E.customProgramCacheKey()};return fe.vertexUv1s=c.has(1),fe.vertexUv2s=c.has(2),fe.vertexUv3s=c.has(3),c.clear(),fe}function p(E){const _=[];if(E.shaderID?_.push(E.shaderID):(_.push(E.customVertexShaderID),_.push(E.customFragmentShaderID)),E.defines!==void 0)for(const I in E.defines)_.push(I),_.push(E.defines[I]);return E.isRawShaderMaterial===!1&&(y(_,E),M(_,E),_.push(i.outputColorSpace)),_.push(E.customProgramCacheKey),_.join()}function y(E,_){E.push(_.precision),E.push(_.outputColorSpace),E.push(_.envMapMode),E.push(_.envMapCubeUVHeight),E.push(_.mapUv),E.push(_.alphaMapUv),E.push(_.lightMapUv),E.push(_.aoMapUv),E.push(_.bumpMapUv),E.push(_.normalMapUv),E.push(_.displacementMapUv),E.push(_.emissiveMapUv),E.push(_.metalnessMapUv),E.push(_.roughnessMapUv),E.push(_.anisotropyMapUv),E.push(_.clearcoatMapUv),E.push(_.clearcoatNormalMapUv),E.push(_.clearcoatRoughnessMapUv),E.push(_.iridescenceMapUv),E.push(_.iridescenceThicknessMapUv),E.push(_.sheenColorMapUv),E.push(_.sheenRoughnessMapUv),E.push(_.specularMapUv),E.push(_.specularColorMapUv),E.push(_.specularIntensityMapUv),E.push(_.transmissionMapUv),E.push(_.thicknessMapUv),E.push(_.combine),E.push(_.fogExp2),E.push(_.sizeAttenuation),E.push(_.morphTargetsCount),E.push(_.morphAttributeCount),E.push(_.numDirLights),E.push(_.numPointLights),E.push(_.numSpotLights),E.push(_.numSpotLightMaps),E.push(_.numHemiLights),E.push(_.numRectAreaLights),E.push(_.numDirLightShadows),E.push(_.numPointLightShadows),E.push(_.numSpotLightShadows),E.push(_.numSpotLightShadowsWithMaps),E.push(_.numLightProbes),E.push(_.shadowMapType),E.push(_.toneMapping),E.push(_.numClippingPlanes),E.push(_.numClipIntersection),E.push(_.depthPacking)}function M(E,_){a.disableAll(),_.supportsVertexTextures&&a.enable(0),_.instancing&&a.enable(1),_.instancingColor&&a.enable(2),_.instancingMorph&&a.enable(3),_.matcap&&a.enable(4),_.envMap&&a.enable(5),_.normalMapObjectSpace&&a.enable(6),_.normalMapTangentSpace&&a.enable(7),_.clearcoat&&a.enable(8),_.iridescence&&a.enable(9),_.alphaTest&&a.enable(10),_.vertexColors&&a.enable(11),_.vertexAlphas&&a.enable(12),_.vertexUv1s&&a.enable(13),_.vertexUv2s&&a.enable(14),_.vertexUv3s&&a.enable(15),_.vertexTangents&&a.enable(16),_.anisotropy&&a.enable(17),_.alphaHash&&a.enable(18),_.batching&&a.enable(19),_.dispersion&&a.enable(20),_.batchingColor&&a.enable(21),E.push(a.mask),a.disableAll(),_.fog&&a.enable(0),_.useFog&&a.enable(1),_.flatShading&&a.enable(2),_.logarithmicDepthBuffer&&a.enable(3),_.reverseDepthBuffer&&a.enable(4),_.skinning&&a.enable(5),_.morphTargets&&a.enable(6),_.morphNormals&&a.enable(7),_.morphColors&&a.enable(8),_.premultipliedAlpha&&a.enable(9),_.shadowMapEnabled&&a.enable(10),_.doubleSided&&a.enable(11),_.flipSided&&a.enable(12),_.useDepthPacking&&a.enable(13),_.dithering&&a.enable(14),_.transmission&&a.enable(15),_.sheen&&a.enable(16),_.opaque&&a.enable(17),_.pointsUvs&&a.enable(18),_.decodeVideoTexture&&a.enable(19),_.decodeVideoTextureEmissive&&a.enable(20),_.alphaToCoverage&&a.enable(21),E.push(a.mask)}function x(E){const _=g[E.type];let I;if(_){const V=Mn[_];I=Kh.clone(V.uniforms)}else I=E.uniforms;return I}function Y(E,_){let I;for(let V=0,W=u.length;V<W;V++){const T=u[V];if(T.cacheKey===_){I=T,++I.usedTimes;break}}return I===void 0&&(I=new c0(i,_,E,r),u.push(I)),I}function R(E){if(--E.usedTimes===0){const _=u.indexOf(E);u[_]=u[u.length-1],u.pop(),E.destroy()}}function L(E){l.remove(E)}function D(){l.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:x,acquireProgram:Y,releaseProgram:R,releaseShaderCache:L,programs:u,dispose:D}}function p0(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,l){i.get(o)[a]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function m0(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function Jl(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function $l(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(h,d,f,g,v,m){let p=i[t];return p===void 0?(p={id:h.id,object:h,geometry:d,material:f,groupOrder:g,renderOrder:h.renderOrder,z:v,group:m},i[t]=p):(p.id=h.id,p.object=h,p.geometry=d,p.material=f,p.groupOrder=g,p.renderOrder=h.renderOrder,p.z=v,p.group=m),t++,p}function a(h,d,f,g,v,m){const p=o(h,d,f,g,v,m);f.transmission>0?n.push(p):f.transparent===!0?s.push(p):e.push(p)}function l(h,d,f,g,v,m){const p=o(h,d,f,g,v,m);f.transmission>0?n.unshift(p):f.transparent===!0?s.unshift(p):e.unshift(p)}function c(h,d){e.length>1&&e.sort(h||m0),n.length>1&&n.sort(d||Jl),s.length>1&&s.sort(d||Jl)}function u(){for(let h=t,d=i.length;h<d;h++){const f=i[h];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:u,sort:c}}function g0(){let i=new WeakMap;function t(n,s){const r=i.get(n);let o;return r===void 0?(o=new $l,i.set(n,[o])):s>=r.length?(o=new $l,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function v0(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new k,color:new ut};break;case"SpotLight":e={position:new k,direction:new k,color:new ut,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new k,color:new ut,distance:0,decay:0};break;case"HemisphereLight":e={direction:new k,skyColor:new ut,groundColor:new ut};break;case"RectAreaLight":e={color:new ut,position:new k,halfWidth:new k,halfHeight:new k};break}return i[t.id]=e,e}}}function _0(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Et};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Et};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Et,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let x0=0;function M0(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function y0(i){const t=new v0,e=_0(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new k);const s=new k,r=new jt,o=new jt;function a(c){let u=0,h=0,d=0;for(let E=0;E<9;E++)n.probe[E].set(0,0,0);let f=0,g=0,v=0,m=0,p=0,y=0,M=0,x=0,Y=0,R=0,L=0;c.sort(M0);for(let E=0,_=c.length;E<_;E++){const I=c[E],V=I.color,W=I.intensity,T=I.distance,U=I.shadow&&I.shadow.map?I.shadow.map.texture:null;if(I.isAmbientLight)u+=V.r*W,h+=V.g*W,d+=V.b*W;else if(I.isLightProbe){for(let z=0;z<9;z++)n.probe[z].addScaledVector(I.sh.coefficients[z],W);L++}else if(I.isDirectionalLight){const z=t.get(I);if(z.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){const b=I.shadow,P=e.get(I);P.shadowIntensity=b.intensity,P.shadowBias=b.bias,P.shadowNormalBias=b.normalBias,P.shadowRadius=b.radius,P.shadowMapSize=b.mapSize,n.directionalShadow[f]=P,n.directionalShadowMap[f]=U,n.directionalShadowMatrix[f]=I.shadow.matrix,y++}n.directional[f]=z,f++}else if(I.isSpotLight){const z=t.get(I);z.position.setFromMatrixPosition(I.matrixWorld),z.color.copy(V).multiplyScalar(W),z.distance=T,z.coneCos=Math.cos(I.angle),z.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),z.decay=I.decay,n.spot[v]=z;const b=I.shadow;if(I.map&&(n.spotLightMap[Y]=I.map,Y++,b.updateMatrices(I),I.castShadow&&R++),n.spotLightMatrix[v]=b.matrix,I.castShadow){const P=e.get(I);P.shadowIntensity=b.intensity,P.shadowBias=b.bias,P.shadowNormalBias=b.normalBias,P.shadowRadius=b.radius,P.shadowMapSize=b.mapSize,n.spotShadow[v]=P,n.spotShadowMap[v]=U,x++}v++}else if(I.isRectAreaLight){const z=t.get(I);z.color.copy(V).multiplyScalar(W),z.halfWidth.set(I.width*.5,0,0),z.halfHeight.set(0,I.height*.5,0),n.rectArea[m]=z,m++}else if(I.isPointLight){const z=t.get(I);if(z.color.copy(I.color).multiplyScalar(I.intensity),z.distance=I.distance,z.decay=I.decay,I.castShadow){const b=I.shadow,P=e.get(I);P.shadowIntensity=b.intensity,P.shadowBias=b.bias,P.shadowNormalBias=b.normalBias,P.shadowRadius=b.radius,P.shadowMapSize=b.mapSize,P.shadowCameraNear=b.camera.near,P.shadowCameraFar=b.camera.far,n.pointShadow[g]=P,n.pointShadowMap[g]=U,n.pointShadowMatrix[g]=I.shadow.matrix,M++}n.point[g]=z,g++}else if(I.isHemisphereLight){const z=t.get(I);z.skyColor.copy(I.color).multiplyScalar(W),z.groundColor.copy(I.groundColor).multiplyScalar(W),n.hemi[p]=z,p++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Nt.LTC_FLOAT_1,n.rectAreaLTC2=Nt.LTC_FLOAT_2):(n.rectAreaLTC1=Nt.LTC_HALF_1,n.rectAreaLTC2=Nt.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=h,n.ambient[2]=d;const D=n.hash;(D.directionalLength!==f||D.pointLength!==g||D.spotLength!==v||D.rectAreaLength!==m||D.hemiLength!==p||D.numDirectionalShadows!==y||D.numPointShadows!==M||D.numSpotShadows!==x||D.numSpotMaps!==Y||D.numLightProbes!==L)&&(n.directional.length=f,n.spot.length=v,n.rectArea.length=m,n.point.length=g,n.hemi.length=p,n.directionalShadow.length=y,n.directionalShadowMap.length=y,n.pointShadow.length=M,n.pointShadowMap.length=M,n.spotShadow.length=x,n.spotShadowMap.length=x,n.directionalShadowMatrix.length=y,n.pointShadowMatrix.length=M,n.spotLightMatrix.length=x+Y-R,n.spotLightMap.length=Y,n.numSpotLightShadowsWithMaps=R,n.numLightProbes=L,D.directionalLength=f,D.pointLength=g,D.spotLength=v,D.rectAreaLength=m,D.hemiLength=p,D.numDirectionalShadows=y,D.numPointShadows=M,D.numSpotShadows=x,D.numSpotMaps=Y,D.numLightProbes=L,n.version=x0++)}function l(c,u){let h=0,d=0,f=0,g=0,v=0;const m=u.matrixWorldInverse;for(let p=0,y=c.length;p<y;p++){const M=c[p];if(M.isDirectionalLight){const x=n.directional[h];x.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(m),h++}else if(M.isSpotLight){const x=n.spot[f];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(m),x.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(m),f++}else if(M.isRectAreaLight){const x=n.rectArea[g];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(m),o.identity(),r.copy(M.matrixWorld),r.premultiply(m),o.extractRotation(r),x.halfWidth.set(M.width*.5,0,0),x.halfHeight.set(0,M.height*.5,0),x.halfWidth.applyMatrix4(o),x.halfHeight.applyMatrix4(o),g++}else if(M.isPointLight){const x=n.point[d];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(m),d++}else if(M.isHemisphereLight){const x=n.hemi[v];x.direction.setFromMatrixPosition(M.matrixWorld),x.direction.transformDirection(m),v++}}}return{setup:a,setupView:l,state:n}}function jl(i){const t=new y0(i),e=[],n=[];function s(u){c.camera=u,e.length=0,n.length=0}function r(u){e.push(u)}function o(u){n.push(u)}function a(){t.setup(e)}function l(u){t.setupView(e,u)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function S0(i){let t=new WeakMap;function e(s,r=0){const o=t.get(s);let a;return o===void 0?(a=new jl(i),t.set(s,[a])):r>=o.length?(a=new jl(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}class w0 extends xi{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=_h,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class b0 extends xi{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const E0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,T0=`uniform sampler2D shadow_pass;
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
}`;function A0(i,t,e){let n=new Da;const s=new Et,r=new Et,o=new ce,a=new w0({depthPacking:xh}),l=new b0,c={},u=e.maxTextureSize,h={[jn]:Ge,[Ge]:jn,[Ie]:Ie},d=new Ee({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Et},radius:{value:4}},vertexShader:E0,fragmentShader:T0}),f=d.clone();f.defines.HORIZONTAL_PASS=1;const g=new ye;g.setAttribute("position",new Se(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new Yt(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ea;let p=this.type;this.render=function(R,L,D){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||R.length===0)return;const E=i.getRenderTarget(),_=i.getActiveCubeFace(),I=i.getActiveMipmapLevel(),V=i.state;V.setBlending(Kn),V.buffers.color.setClear(1,1,1,1),V.buffers.depth.setTest(!0),V.setScissorTest(!1);const W=p!==Nn&&this.type===Nn,T=p===Nn&&this.type!==Nn;for(let U=0,z=R.length;U<z;U++){const b=R[U],P=b.shadow;if(P===void 0){console.warn("THREE.WebGLShadowMap:",b,"has no shadow.");continue}if(P.autoUpdate===!1&&P.needsUpdate===!1)continue;s.copy(P.mapSize);const Z=P.getFrameExtents();if(s.multiply(Z),r.copy(P.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/Z.x),s.x=r.x*Z.x,P.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/Z.y),s.y=r.y*Z.y,P.mapSize.y=r.y)),P.map===null||W===!0||T===!0){const j=this.type!==Nn?{minFilter:tn,magFilter:tn}:{};P.map!==null&&P.map.dispose(),P.map=new Qn(s.x,s.y,j),P.map.texture.name=b.name+".shadowMap",P.camera.updateProjectionMatrix()}i.setRenderTarget(P.map),i.clear();const tt=P.getViewportCount();for(let j=0;j<tt;j++){const mt=P.getViewport(j);o.set(r.x*mt.x,r.y*mt.y,r.x*mt.z,r.y*mt.w),V.viewport(o),P.updateMatrices(b,j),n=P.getFrustum(),x(L,D,P.camera,b,this.type)}P.isPointLightShadow!==!0&&this.type===Nn&&y(P,D),P.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(E,_,I)};function y(R,L){const D=t.update(v);d.defines.VSM_SAMPLES!==R.blurSamples&&(d.defines.VSM_SAMPLES=R.blurSamples,f.defines.VSM_SAMPLES=R.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new Qn(s.x,s.y)),d.uniforms.shadow_pass.value=R.map.texture,d.uniforms.resolution.value=R.mapSize,d.uniforms.radius.value=R.radius,i.setRenderTarget(R.mapPass),i.clear(),i.renderBufferDirect(L,null,D,d,v,null),f.uniforms.shadow_pass.value=R.mapPass.texture,f.uniforms.resolution.value=R.mapSize,f.uniforms.radius.value=R.radius,i.setRenderTarget(R.map),i.clear(),i.renderBufferDirect(L,null,D,f,v,null)}function M(R,L,D,E){let _=null;const I=D.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(I!==void 0)_=I;else if(_=D.isPointLight===!0?l:a,i.localClippingEnabled&&L.clipShadows===!0&&Array.isArray(L.clippingPlanes)&&L.clippingPlanes.length!==0||L.displacementMap&&L.displacementScale!==0||L.alphaMap&&L.alphaTest>0||L.map&&L.alphaTest>0){const V=_.uuid,W=L.uuid;let T=c[V];T===void 0&&(T={},c[V]=T);let U=T[W];U===void 0&&(U=_.clone(),T[W]=U,L.addEventListener("dispose",Y)),_=U}if(_.visible=L.visible,_.wireframe=L.wireframe,E===Nn?_.side=L.shadowSide!==null?L.shadowSide:L.side:_.side=L.shadowSide!==null?L.shadowSide:h[L.side],_.alphaMap=L.alphaMap,_.alphaTest=L.alphaTest,_.map=L.map,_.clipShadows=L.clipShadows,_.clippingPlanes=L.clippingPlanes,_.clipIntersection=L.clipIntersection,_.displacementMap=L.displacementMap,_.displacementScale=L.displacementScale,_.displacementBias=L.displacementBias,_.wireframeLinewidth=L.wireframeLinewidth,_.linewidth=L.linewidth,D.isPointLight===!0&&_.isMeshDistanceMaterial===!0){const V=i.properties.get(_);V.light=D}return _}function x(R,L,D,E,_){if(R.visible===!1)return;if(R.layers.test(L.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&_===Nn)&&(!R.frustumCulled||n.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(D.matrixWorldInverse,R.matrixWorld);const W=t.update(R),T=R.material;if(Array.isArray(T)){const U=W.groups;for(let z=0,b=U.length;z<b;z++){const P=U[z],Z=T[P.materialIndex];if(Z&&Z.visible){const tt=M(R,Z,E,_);R.onBeforeShadow(i,R,L,D,W,tt,P),i.renderBufferDirect(D,null,W,tt,R,P),R.onAfterShadow(i,R,L,D,W,tt,P)}}}else if(T.visible){const U=M(R,T,E,_);R.onBeforeShadow(i,R,L,D,W,U,null),i.renderBufferDirect(D,null,W,U,R,null),R.onAfterShadow(i,R,L,D,W,U,null)}}const V=R.children;for(let W=0,T=V.length;W<T;W++)x(V[W],L,D,E,_)}function Y(R){R.target.removeEventListener("dispose",Y);for(const D in c){const E=c[D],_=R.target.uuid;_ in E&&(E[_].dispose(),delete E[_])}}}const C0={[Po]:Io,[Lo]:No,[Do]:Fo,[Yi]:Uo,[Io]:Po,[No]:Lo,[Fo]:Do,[Uo]:Yi};function R0(i,t){function e(){let O=!1;const wt=new ce;let ht=null;const pt=new ce(0,0,0,0);return{setMask:function(Ct){ht!==Ct&&!O&&(i.colorMask(Ct,Ct,Ct,Ct),ht=Ct)},setLocked:function(Ct){O=Ct},setClear:function(Ct,Lt,Ot,ne,fe){fe===!0&&(Ct*=ne,Lt*=ne,Ot*=ne),wt.set(Ct,Lt,Ot,ne),pt.equals(wt)===!1&&(i.clearColor(Ct,Lt,Ot,ne),pt.copy(wt))},reset:function(){O=!1,ht=null,pt.set(-1,0,0,0)}}}function n(){let O=!1,wt=!1,ht=null,pt=null,Ct=null;return{setReversed:function(Lt){if(wt!==Lt){const Ot=t.get("EXT_clip_control");wt?Ot.clipControlEXT(Ot.LOWER_LEFT_EXT,Ot.ZERO_TO_ONE_EXT):Ot.clipControlEXT(Ot.LOWER_LEFT_EXT,Ot.NEGATIVE_ONE_TO_ONE_EXT);const ne=Ct;Ct=null,this.setClear(ne)}wt=Lt},getReversed:function(){return wt},setTest:function(Lt){Lt?$(i.DEPTH_TEST):ft(i.DEPTH_TEST)},setMask:function(Lt){ht!==Lt&&!O&&(i.depthMask(Lt),ht=Lt)},setFunc:function(Lt){if(wt&&(Lt=C0[Lt]),pt!==Lt){switch(Lt){case Po:i.depthFunc(i.NEVER);break;case Io:i.depthFunc(i.ALWAYS);break;case Lo:i.depthFunc(i.LESS);break;case Yi:i.depthFunc(i.LEQUAL);break;case Do:i.depthFunc(i.EQUAL);break;case Uo:i.depthFunc(i.GEQUAL);break;case No:i.depthFunc(i.GREATER);break;case Fo:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}pt=Lt}},setLocked:function(Lt){O=Lt},setClear:function(Lt){Ct!==Lt&&(wt&&(Lt=1-Lt),i.clearDepth(Lt),Ct=Lt)},reset:function(){O=!1,ht=null,pt=null,Ct=null,wt=!1}}}function s(){let O=!1,wt=null,ht=null,pt=null,Ct=null,Lt=null,Ot=null,ne=null,fe=null;return{setTest:function(zt){O||(zt?$(i.STENCIL_TEST):ft(i.STENCIL_TEST))},setMask:function(zt){wt!==zt&&!O&&(i.stencilMask(zt),wt=zt)},setFunc:function(zt,ee,ie){(ht!==zt||pt!==ee||Ct!==ie)&&(i.stencilFunc(zt,ee,ie),ht=zt,pt=ee,Ct=ie)},setOp:function(zt,ee,ie){(Lt!==zt||Ot!==ee||ne!==ie)&&(i.stencilOp(zt,ee,ie),Lt=zt,Ot=ee,ne=ie)},setLocked:function(zt){O=zt},setClear:function(zt){fe!==zt&&(i.clearStencil(zt),fe=zt)},reset:function(){O=!1,wt=null,ht=null,pt=null,Ct=null,Lt=null,Ot=null,ne=null,fe=null}}}const r=new e,o=new n,a=new s,l=new WeakMap,c=new WeakMap;let u={},h={},d=new WeakMap,f=[],g=null,v=!1,m=null,p=null,y=null,M=null,x=null,Y=null,R=null,L=new ut(0,0,0),D=0,E=!1,_=null,I=null,V=null,W=null,T=null;const U=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let z=!1,b=0;const P=i.getParameter(i.VERSION);P.indexOf("WebGL")!==-1?(b=parseFloat(/^WebGL (\d)/.exec(P)[1]),z=b>=1):P.indexOf("OpenGL ES")!==-1&&(b=parseFloat(/^OpenGL ES (\d)/.exec(P)[1]),z=b>=2);let Z=null,tt={};const j=i.getParameter(i.SCISSOR_BOX),mt=i.getParameter(i.VIEWPORT),q=new ce().fromArray(j),K=new ce().fromArray(mt);function B(O,wt,ht,pt){const Ct=new Uint8Array(4),Lt=i.createTexture();i.bindTexture(O,Lt),i.texParameteri(O,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(O,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ot=0;Ot<ht;Ot++)O===i.TEXTURE_3D||O===i.TEXTURE_2D_ARRAY?i.texImage3D(wt,0,i.RGBA,1,1,pt,0,i.RGBA,i.UNSIGNED_BYTE,Ct):i.texImage2D(wt+Ot,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,Ct);return Lt}const at={};at[i.TEXTURE_2D]=B(i.TEXTURE_2D,i.TEXTURE_2D,1),at[i.TEXTURE_CUBE_MAP]=B(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),at[i.TEXTURE_2D_ARRAY]=B(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),at[i.TEXTURE_3D]=B(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),$(i.DEPTH_TEST),o.setFunc(Yi),G(!1),H(il),$(i.CULL_FACE),N(Kn);function $(O){u[O]!==!0&&(i.enable(O),u[O]=!0)}function ft(O){u[O]!==!1&&(i.disable(O),u[O]=!1)}function At(O,wt){return h[O]!==wt?(i.bindFramebuffer(O,wt),h[O]=wt,O===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=wt),O===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=wt),!0):!1}function It(O,wt){let ht=f,pt=!1;if(O){ht=d.get(wt),ht===void 0&&(ht=[],d.set(wt,ht));const Ct=O.textures;if(ht.length!==Ct.length||ht[0]!==i.COLOR_ATTACHMENT0){for(let Lt=0,Ot=Ct.length;Lt<Ot;Lt++)ht[Lt]=i.COLOR_ATTACHMENT0+Lt;ht.length=Ct.length,pt=!0}}else ht[0]!==i.BACK&&(ht[0]=i.BACK,pt=!0);pt&&i.drawBuffers(ht)}function Gt(O){return g!==O?(i.useProgram(O),g=O,!0):!1}const xt={[fi]:i.FUNC_ADD,[Wu]:i.FUNC_SUBTRACT,[Xu]:i.FUNC_REVERSE_SUBTRACT};xt[Yu]=i.MIN,xt[qu]=i.MAX;const Tt={[Zu]:i.ZERO,[Ku]:i.ONE,[Ju]:i.SRC_COLOR,[Co]:i.SRC_ALPHA,[nh]:i.SRC_ALPHA_SATURATE,[th]:i.DST_COLOR,[ju]:i.DST_ALPHA,[$u]:i.ONE_MINUS_SRC_COLOR,[Ro]:i.ONE_MINUS_SRC_ALPHA,[eh]:i.ONE_MINUS_DST_COLOR,[Qu]:i.ONE_MINUS_DST_ALPHA,[ih]:i.CONSTANT_COLOR,[sh]:i.ONE_MINUS_CONSTANT_COLOR,[rh]:i.CONSTANT_ALPHA,[oh]:i.ONE_MINUS_CONSTANT_ALPHA};function N(O,wt,ht,pt,Ct,Lt,Ot,ne,fe,zt){if(O===Kn){v===!0&&(ft(i.BLEND),v=!1);return}if(v===!1&&($(i.BLEND),v=!0),O!==Vu){if(O!==m||zt!==E){if((p!==fi||x!==fi)&&(i.blendEquation(i.FUNC_ADD),p=fi,x=fi),zt)switch(O){case He:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Xi:i.blendFunc(i.ONE,i.ONE);break;case sl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case rl:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",O);break}else switch(O){case He:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Xi:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case sl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case rl:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",O);break}y=null,M=null,Y=null,R=null,L.set(0,0,0),D=0,m=O,E=zt}return}Ct=Ct||wt,Lt=Lt||ht,Ot=Ot||pt,(wt!==p||Ct!==x)&&(i.blendEquationSeparate(xt[wt],xt[Ct]),p=wt,x=Ct),(ht!==y||pt!==M||Lt!==Y||Ot!==R)&&(i.blendFuncSeparate(Tt[ht],Tt[pt],Tt[Lt],Tt[Ot]),y=ht,M=pt,Y=Lt,R=Ot),(ne.equals(L)===!1||fe!==D)&&(i.blendColor(ne.r,ne.g,ne.b,fe),L.copy(ne),D=fe),m=O,E=!1}function S(O,wt){O.side===Ie?ft(i.CULL_FACE):$(i.CULL_FACE);let ht=O.side===Ge;wt&&(ht=!ht),G(ht),O.blending===He&&O.transparent===!1?N(Kn):N(O.blending,O.blendEquation,O.blendSrc,O.blendDst,O.blendEquationAlpha,O.blendSrcAlpha,O.blendDstAlpha,O.blendColor,O.blendAlpha,O.premultipliedAlpha),o.setFunc(O.depthFunc),o.setTest(O.depthTest),o.setMask(O.depthWrite),r.setMask(O.colorWrite);const pt=O.stencilWrite;a.setTest(pt),pt&&(a.setMask(O.stencilWriteMask),a.setFunc(O.stencilFunc,O.stencilRef,O.stencilFuncMask),a.setOp(O.stencilFail,O.stencilZFail,O.stencilZPass)),lt(O.polygonOffset,O.polygonOffsetFactor,O.polygonOffsetUnits),O.alphaToCoverage===!0?$(i.SAMPLE_ALPHA_TO_COVERAGE):ft(i.SAMPLE_ALPHA_TO_COVERAGE)}function G(O){_!==O&&(O?i.frontFace(i.CW):i.frontFace(i.CCW),_=O)}function H(O){O!==Gu?($(i.CULL_FACE),O!==I&&(O===il?i.cullFace(i.BACK):O===Hu?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ft(i.CULL_FACE),I=O}function F(O){O!==V&&(z&&i.lineWidth(O),V=O)}function lt(O,wt,ht){O?($(i.POLYGON_OFFSET_FILL),(W!==wt||T!==ht)&&(i.polygonOffset(wt,ht),W=wt,T=ht)):ft(i.POLYGON_OFFSET_FILL)}function ot(O){O?$(i.SCISSOR_TEST):ft(i.SCISSOR_TEST)}function A(O){O===void 0&&(O=i.TEXTURE0+U-1),Z!==O&&(i.activeTexture(O),Z=O)}function w(O,wt,ht){ht===void 0&&(Z===null?ht=i.TEXTURE0+U-1:ht=Z);let pt=tt[ht];pt===void 0&&(pt={type:void 0,texture:void 0},tt[ht]=pt),(pt.type!==O||pt.texture!==wt)&&(Z!==ht&&(i.activeTexture(ht),Z=ht),i.bindTexture(O,wt||at[O]),pt.type=O,pt.texture=wt)}function rt(){const O=tt[Z];O!==void 0&&O.type!==void 0&&(i.bindTexture(O.type,null),O.type=void 0,O.texture=void 0)}function yt(){try{i.compressedTexImage2D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function J(){try{i.compressedTexImage3D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function et(){try{i.texSubImage2D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function bt(){try{i.texSubImage3D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function dt(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Mt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Pt(){try{i.texStorage2D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function gt(){try{i.texStorage3D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Rt(){try{i.texImage2D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Ft(){try{i.texImage3D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function X(O){q.equals(O)===!1&&(i.scissor(O.x,O.y,O.z,O.w),q.copy(O))}function Q(O){K.equals(O)===!1&&(i.viewport(O.x,O.y,O.z,O.w),K.copy(O))}function ct(O,wt){let ht=c.get(wt);ht===void 0&&(ht=new WeakMap,c.set(wt,ht));let pt=ht.get(O);pt===void 0&&(pt=i.getUniformBlockIndex(wt,O.name),ht.set(O,pt))}function st(O,wt){const pt=c.get(wt).get(O);l.get(wt)!==pt&&(i.uniformBlockBinding(wt,pt,O.__bindingPointIndex),l.set(wt,pt))}function St(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),u={},Z=null,tt={},h={},d=new WeakMap,f=[],g=null,v=!1,m=null,p=null,y=null,M=null,x=null,Y=null,R=null,L=new ut(0,0,0),D=0,E=!1,_=null,I=null,V=null,W=null,T=null,q.set(0,0,i.canvas.width,i.canvas.height),K.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:$,disable:ft,bindFramebuffer:At,drawBuffers:It,useProgram:Gt,setBlending:N,setMaterial:S,setFlipSided:G,setCullFace:H,setLineWidth:F,setPolygonOffset:lt,setScissorTest:ot,activeTexture:A,bindTexture:w,unbindTexture:rt,compressedTexImage2D:yt,compressedTexImage3D:J,texImage2D:Rt,texImage3D:Ft,updateUBOMapping:ct,uniformBlockBinding:st,texStorage2D:Pt,texStorage3D:gt,texSubImage2D:et,texSubImage3D:bt,compressedTexSubImage2D:dt,compressedTexSubImage3D:Mt,scissor:X,viewport:Q,reset:St}}function Ql(i,t,e,n){const s=P0(n);switch(e){case qc:return i*t;case Kc:return i*t;case Jc:return i*t*2;case Ra:return i*t/s.components*s.byteLength;case Pa:return i*t/s.components*s.byteLength;case $c:return i*t*2/s.components*s.byteLength;case Ia:return i*t*2/s.components*s.byteLength;case Zc:return i*t*3/s.components*s.byteLength;case qe:return i*t*4/s.components*s.byteLength;case La:return i*t*4/s.components*s.byteLength;case ur:case hr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case fr:case dr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Go:case Vo:return Math.max(i,16)*Math.max(t,8)/4;case Bo:case Ho:return Math.max(i,8)*Math.max(t,8)/2;case Wo:case Xo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Yo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case qo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Zo:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Ko:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case Jo:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case $o:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case jo:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Qo:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case ta:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case ea:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case na:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case ia:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case sa:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case ra:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case oa:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case pr:case aa:case la:return Math.ceil(i/4)*Math.ceil(t/4)*16;case jc:case ca:return Math.ceil(i/4)*Math.ceil(t/4)*8;case ua:case ha:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function P0(i){switch(i){case bn:case Wc:return{byteLength:1,components:1};case ys:case Xc:case Qi:return{byteLength:2,components:1};case Aa:case Ca:return{byteLength:2,components:4};case gi:case Ta:case mn:return{byteLength:4,components:1};case Yc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function I0(i,t,e,n,s,r,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Et,u=new WeakMap;let h;const d=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(A,w){return f?new OffscreenCanvas(A,w):_r("canvas")}function v(A,w,rt){let yt=1;const J=ot(A);if((J.width>rt||J.height>rt)&&(yt=rt/Math.max(J.width,J.height)),yt<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){const et=Math.floor(yt*J.width),bt=Math.floor(yt*J.height);h===void 0&&(h=g(et,bt));const dt=w?g(et,bt):h;return dt.width=et,dt.height=bt,dt.getContext("2d").drawImage(A,0,0,et,bt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+et+"x"+bt+")."),dt}else return"data"in A&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),A;return A}function m(A){return A.generateMipmaps}function p(A){i.generateMipmap(A)}function y(A){return A.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?i.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function M(A,w,rt,yt,J=!1){if(A!==null){if(i[A]!==void 0)return i[A];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let et=w;if(w===i.RED&&(rt===i.FLOAT&&(et=i.R32F),rt===i.HALF_FLOAT&&(et=i.R16F),rt===i.UNSIGNED_BYTE&&(et=i.R8)),w===i.RED_INTEGER&&(rt===i.UNSIGNED_BYTE&&(et=i.R8UI),rt===i.UNSIGNED_SHORT&&(et=i.R16UI),rt===i.UNSIGNED_INT&&(et=i.R32UI),rt===i.BYTE&&(et=i.R8I),rt===i.SHORT&&(et=i.R16I),rt===i.INT&&(et=i.R32I)),w===i.RG&&(rt===i.FLOAT&&(et=i.RG32F),rt===i.HALF_FLOAT&&(et=i.RG16F),rt===i.UNSIGNED_BYTE&&(et=i.RG8)),w===i.RG_INTEGER&&(rt===i.UNSIGNED_BYTE&&(et=i.RG8UI),rt===i.UNSIGNED_SHORT&&(et=i.RG16UI),rt===i.UNSIGNED_INT&&(et=i.RG32UI),rt===i.BYTE&&(et=i.RG8I),rt===i.SHORT&&(et=i.RG16I),rt===i.INT&&(et=i.RG32I)),w===i.RGB_INTEGER&&(rt===i.UNSIGNED_BYTE&&(et=i.RGB8UI),rt===i.UNSIGNED_SHORT&&(et=i.RGB16UI),rt===i.UNSIGNED_INT&&(et=i.RGB32UI),rt===i.BYTE&&(et=i.RGB8I),rt===i.SHORT&&(et=i.RGB16I),rt===i.INT&&(et=i.RGB32I)),w===i.RGBA_INTEGER&&(rt===i.UNSIGNED_BYTE&&(et=i.RGBA8UI),rt===i.UNSIGNED_SHORT&&(et=i.RGBA16UI),rt===i.UNSIGNED_INT&&(et=i.RGBA32UI),rt===i.BYTE&&(et=i.RGBA8I),rt===i.SHORT&&(et=i.RGBA16I),rt===i.INT&&(et=i.RGBA32I)),w===i.RGB&&rt===i.UNSIGNED_INT_5_9_9_9_REV&&(et=i.RGB9_E5),w===i.RGBA){const bt=J?Rr:ae.getTransfer(yt);rt===i.FLOAT&&(et=i.RGBA32F),rt===i.HALF_FLOAT&&(et=i.RGBA16F),rt===i.UNSIGNED_BYTE&&(et=bt===de?i.SRGB8_ALPHA8:i.RGBA8),rt===i.UNSIGNED_SHORT_4_4_4_4&&(et=i.RGBA4),rt===i.UNSIGNED_SHORT_5_5_5_1&&(et=i.RGB5_A1)}return(et===i.R16F||et===i.R32F||et===i.RG16F||et===i.RG32F||et===i.RGBA16F||et===i.RGBA32F)&&t.get("EXT_color_buffer_float"),et}function x(A,w){let rt;return A?w===null||w===gi||w===Ji?rt=i.DEPTH24_STENCIL8:w===mn?rt=i.DEPTH32F_STENCIL8:w===ys&&(rt=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):w===null||w===gi||w===Ji?rt=i.DEPTH_COMPONENT24:w===mn?rt=i.DEPTH_COMPONENT32F:w===ys&&(rt=i.DEPTH_COMPONENT16),rt}function Y(A,w){return m(A)===!0||A.isFramebufferTexture&&A.minFilter!==tn&&A.minFilter!==Be?Math.log2(Math.max(w.width,w.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?w.mipmaps.length:1}function R(A){const w=A.target;w.removeEventListener("dispose",R),D(w),w.isVideoTexture&&u.delete(w)}function L(A){const w=A.target;w.removeEventListener("dispose",L),_(w)}function D(A){const w=n.get(A);if(w.__webglInit===void 0)return;const rt=A.source,yt=d.get(rt);if(yt){const J=yt[w.__cacheKey];J.usedTimes--,J.usedTimes===0&&E(A),Object.keys(yt).length===0&&d.delete(rt)}n.remove(A)}function E(A){const w=n.get(A);i.deleteTexture(w.__webglTexture);const rt=A.source,yt=d.get(rt);delete yt[w.__cacheKey],o.memory.textures--}function _(A){const w=n.get(A);if(A.depthTexture&&(A.depthTexture.dispose(),n.remove(A.depthTexture)),A.isWebGLCubeRenderTarget)for(let yt=0;yt<6;yt++){if(Array.isArray(w.__webglFramebuffer[yt]))for(let J=0;J<w.__webglFramebuffer[yt].length;J++)i.deleteFramebuffer(w.__webglFramebuffer[yt][J]);else i.deleteFramebuffer(w.__webglFramebuffer[yt]);w.__webglDepthbuffer&&i.deleteRenderbuffer(w.__webglDepthbuffer[yt])}else{if(Array.isArray(w.__webglFramebuffer))for(let yt=0;yt<w.__webglFramebuffer.length;yt++)i.deleteFramebuffer(w.__webglFramebuffer[yt]);else i.deleteFramebuffer(w.__webglFramebuffer);if(w.__webglDepthbuffer&&i.deleteRenderbuffer(w.__webglDepthbuffer),w.__webglMultisampledFramebuffer&&i.deleteFramebuffer(w.__webglMultisampledFramebuffer),w.__webglColorRenderbuffer)for(let yt=0;yt<w.__webglColorRenderbuffer.length;yt++)w.__webglColorRenderbuffer[yt]&&i.deleteRenderbuffer(w.__webglColorRenderbuffer[yt]);w.__webglDepthRenderbuffer&&i.deleteRenderbuffer(w.__webglDepthRenderbuffer)}const rt=A.textures;for(let yt=0,J=rt.length;yt<J;yt++){const et=n.get(rt[yt]);et.__webglTexture&&(i.deleteTexture(et.__webglTexture),o.memory.textures--),n.remove(rt[yt])}n.remove(A)}let I=0;function V(){I=0}function W(){const A=I;return A>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+s.maxTextures),I+=1,A}function T(A){const w=[];return w.push(A.wrapS),w.push(A.wrapT),w.push(A.wrapR||0),w.push(A.magFilter),w.push(A.minFilter),w.push(A.anisotropy),w.push(A.internalFormat),w.push(A.format),w.push(A.type),w.push(A.generateMipmaps),w.push(A.premultiplyAlpha),w.push(A.flipY),w.push(A.unpackAlignment),w.push(A.colorSpace),w.join()}function U(A,w){const rt=n.get(A);if(A.isVideoTexture&&F(A),A.isRenderTargetTexture===!1&&A.version>0&&rt.__version!==A.version){const yt=A.image;if(yt===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(yt.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{K(rt,A,w);return}}e.bindTexture(i.TEXTURE_2D,rt.__webglTexture,i.TEXTURE0+w)}function z(A,w){const rt=n.get(A);if(A.version>0&&rt.__version!==A.version){K(rt,A,w);return}e.bindTexture(i.TEXTURE_2D_ARRAY,rt.__webglTexture,i.TEXTURE0+w)}function b(A,w){const rt=n.get(A);if(A.version>0&&rt.__version!==A.version){K(rt,A,w);return}e.bindTexture(i.TEXTURE_3D,rt.__webglTexture,i.TEXTURE0+w)}function P(A,w){const rt=n.get(A);if(A.version>0&&rt.__version!==A.version){B(rt,A,w);return}e.bindTexture(i.TEXTURE_CUBE_MAP,rt.__webglTexture,i.TEXTURE0+w)}const Z={[Ki]:i.REPEAT,[yn]:i.CLAMP_TO_EDGE,[zo]:i.MIRRORED_REPEAT},tt={[tn]:i.NEAREST,[vh]:i.NEAREST_MIPMAP_NEAREST,[Ls]:i.NEAREST_MIPMAP_LINEAR,[Be]:i.LINEAR,[Fr]:i.LINEAR_MIPMAP_NEAREST,[Sn]:i.LINEAR_MIPMAP_LINEAR},j={[yh]:i.NEVER,[Ah]:i.ALWAYS,[Sh]:i.LESS,[tu]:i.LEQUAL,[wh]:i.EQUAL,[Th]:i.GEQUAL,[bh]:i.GREATER,[Eh]:i.NOTEQUAL};function mt(A,w){if(w.type===mn&&t.has("OES_texture_float_linear")===!1&&(w.magFilter===Be||w.magFilter===Fr||w.magFilter===Ls||w.magFilter===Sn||w.minFilter===Be||w.minFilter===Fr||w.minFilter===Ls||w.minFilter===Sn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(A,i.TEXTURE_WRAP_S,Z[w.wrapS]),i.texParameteri(A,i.TEXTURE_WRAP_T,Z[w.wrapT]),(A===i.TEXTURE_3D||A===i.TEXTURE_2D_ARRAY)&&i.texParameteri(A,i.TEXTURE_WRAP_R,Z[w.wrapR]),i.texParameteri(A,i.TEXTURE_MAG_FILTER,tt[w.magFilter]),i.texParameteri(A,i.TEXTURE_MIN_FILTER,tt[w.minFilter]),w.compareFunction&&(i.texParameteri(A,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(A,i.TEXTURE_COMPARE_FUNC,j[w.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(w.magFilter===tn||w.minFilter!==Ls&&w.minFilter!==Sn||w.type===mn&&t.has("OES_texture_float_linear")===!1)return;if(w.anisotropy>1||n.get(w).__currentAnisotropy){const rt=t.get("EXT_texture_filter_anisotropic");i.texParameterf(A,rt.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(w.anisotropy,s.getMaxAnisotropy())),n.get(w).__currentAnisotropy=w.anisotropy}}}function q(A,w){let rt=!1;A.__webglInit===void 0&&(A.__webglInit=!0,w.addEventListener("dispose",R));const yt=w.source;let J=d.get(yt);J===void 0&&(J={},d.set(yt,J));const et=T(w);if(et!==A.__cacheKey){J[et]===void 0&&(J[et]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,rt=!0),J[et].usedTimes++;const bt=J[A.__cacheKey];bt!==void 0&&(J[A.__cacheKey].usedTimes--,bt.usedTimes===0&&E(w)),A.__cacheKey=et,A.__webglTexture=J[et].texture}return rt}function K(A,w,rt){let yt=i.TEXTURE_2D;(w.isDataArrayTexture||w.isCompressedArrayTexture)&&(yt=i.TEXTURE_2D_ARRAY),w.isData3DTexture&&(yt=i.TEXTURE_3D);const J=q(A,w),et=w.source;e.bindTexture(yt,A.__webglTexture,i.TEXTURE0+rt);const bt=n.get(et);if(et.version!==bt.__version||J===!0){e.activeTexture(i.TEXTURE0+rt);const dt=ae.getPrimaries(ae.workingColorSpace),Mt=w.colorSpace===fn?null:ae.getPrimaries(w.colorSpace),Pt=w.colorSpace===fn||dt===Mt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,w.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,w.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Pt);let gt=v(w.image,!1,s.maxTextureSize);gt=lt(w,gt);const Rt=r.convert(w.format,w.colorSpace),Ft=r.convert(w.type);let X=M(w.internalFormat,Rt,Ft,w.colorSpace,w.isVideoTexture);mt(yt,w);let Q;const ct=w.mipmaps,st=w.isVideoTexture!==!0,St=bt.__version===void 0||J===!0,O=et.dataReady,wt=Y(w,gt);if(w.isDepthTexture)X=x(w.format===$i,w.type),St&&(st?e.texStorage2D(i.TEXTURE_2D,1,X,gt.width,gt.height):e.texImage2D(i.TEXTURE_2D,0,X,gt.width,gt.height,0,Rt,Ft,null));else if(w.isDataTexture)if(ct.length>0){st&&St&&e.texStorage2D(i.TEXTURE_2D,wt,X,ct[0].width,ct[0].height);for(let ht=0,pt=ct.length;ht<pt;ht++)Q=ct[ht],st?O&&e.texSubImage2D(i.TEXTURE_2D,ht,0,0,Q.width,Q.height,Rt,Ft,Q.data):e.texImage2D(i.TEXTURE_2D,ht,X,Q.width,Q.height,0,Rt,Ft,Q.data);w.generateMipmaps=!1}else st?(St&&e.texStorage2D(i.TEXTURE_2D,wt,X,gt.width,gt.height),O&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,gt.width,gt.height,Rt,Ft,gt.data)):e.texImage2D(i.TEXTURE_2D,0,X,gt.width,gt.height,0,Rt,Ft,gt.data);else if(w.isCompressedTexture)if(w.isCompressedArrayTexture){st&&St&&e.texStorage3D(i.TEXTURE_2D_ARRAY,wt,X,ct[0].width,ct[0].height,gt.depth);for(let ht=0,pt=ct.length;ht<pt;ht++)if(Q=ct[ht],w.format!==qe)if(Rt!==null)if(st){if(O)if(w.layerUpdates.size>0){const Ct=Ql(Q.width,Q.height,w.format,w.type);for(const Lt of w.layerUpdates){const Ot=Q.data.subarray(Lt*Ct/Q.data.BYTES_PER_ELEMENT,(Lt+1)*Ct/Q.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ht,0,0,Lt,Q.width,Q.height,1,Rt,Ot)}w.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ht,0,0,0,Q.width,Q.height,gt.depth,Rt,Q.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,ht,X,Q.width,Q.height,gt.depth,0,Q.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else st?O&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,ht,0,0,0,Q.width,Q.height,gt.depth,Rt,Ft,Q.data):e.texImage3D(i.TEXTURE_2D_ARRAY,ht,X,Q.width,Q.height,gt.depth,0,Rt,Ft,Q.data)}else{st&&St&&e.texStorage2D(i.TEXTURE_2D,wt,X,ct[0].width,ct[0].height);for(let ht=0,pt=ct.length;ht<pt;ht++)Q=ct[ht],w.format!==qe?Rt!==null?st?O&&e.compressedTexSubImage2D(i.TEXTURE_2D,ht,0,0,Q.width,Q.height,Rt,Q.data):e.compressedTexImage2D(i.TEXTURE_2D,ht,X,Q.width,Q.height,0,Q.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):st?O&&e.texSubImage2D(i.TEXTURE_2D,ht,0,0,Q.width,Q.height,Rt,Ft,Q.data):e.texImage2D(i.TEXTURE_2D,ht,X,Q.width,Q.height,0,Rt,Ft,Q.data)}else if(w.isDataArrayTexture)if(st){if(St&&e.texStorage3D(i.TEXTURE_2D_ARRAY,wt,X,gt.width,gt.height,gt.depth),O)if(w.layerUpdates.size>0){const ht=Ql(gt.width,gt.height,w.format,w.type);for(const pt of w.layerUpdates){const Ct=gt.data.subarray(pt*ht/gt.data.BYTES_PER_ELEMENT,(pt+1)*ht/gt.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,pt,gt.width,gt.height,1,Rt,Ft,Ct)}w.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,gt.width,gt.height,gt.depth,Rt,Ft,gt.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,X,gt.width,gt.height,gt.depth,0,Rt,Ft,gt.data);else if(w.isData3DTexture)st?(St&&e.texStorage3D(i.TEXTURE_3D,wt,X,gt.width,gt.height,gt.depth),O&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,gt.width,gt.height,gt.depth,Rt,Ft,gt.data)):e.texImage3D(i.TEXTURE_3D,0,X,gt.width,gt.height,gt.depth,0,Rt,Ft,gt.data);else if(w.isFramebufferTexture){if(St)if(st)e.texStorage2D(i.TEXTURE_2D,wt,X,gt.width,gt.height);else{let ht=gt.width,pt=gt.height;for(let Ct=0;Ct<wt;Ct++)e.texImage2D(i.TEXTURE_2D,Ct,X,ht,pt,0,Rt,Ft,null),ht>>=1,pt>>=1}}else if(ct.length>0){if(st&&St){const ht=ot(ct[0]);e.texStorage2D(i.TEXTURE_2D,wt,X,ht.width,ht.height)}for(let ht=0,pt=ct.length;ht<pt;ht++)Q=ct[ht],st?O&&e.texSubImage2D(i.TEXTURE_2D,ht,0,0,Rt,Ft,Q):e.texImage2D(i.TEXTURE_2D,ht,X,Rt,Ft,Q);w.generateMipmaps=!1}else if(st){if(St){const ht=ot(gt);e.texStorage2D(i.TEXTURE_2D,wt,X,ht.width,ht.height)}O&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,Rt,Ft,gt)}else e.texImage2D(i.TEXTURE_2D,0,X,Rt,Ft,gt);m(w)&&p(yt),bt.__version=et.version,w.onUpdate&&w.onUpdate(w)}A.__version=w.version}function B(A,w,rt){if(w.image.length!==6)return;const yt=q(A,w),J=w.source;e.bindTexture(i.TEXTURE_CUBE_MAP,A.__webglTexture,i.TEXTURE0+rt);const et=n.get(J);if(J.version!==et.__version||yt===!0){e.activeTexture(i.TEXTURE0+rt);const bt=ae.getPrimaries(ae.workingColorSpace),dt=w.colorSpace===fn?null:ae.getPrimaries(w.colorSpace),Mt=w.colorSpace===fn||bt===dt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,w.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,w.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Mt);const Pt=w.isCompressedTexture||w.image[0].isCompressedTexture,gt=w.image[0]&&w.image[0].isDataTexture,Rt=[];for(let pt=0;pt<6;pt++)!Pt&&!gt?Rt[pt]=v(w.image[pt],!0,s.maxCubemapSize):Rt[pt]=gt?w.image[pt].image:w.image[pt],Rt[pt]=lt(w,Rt[pt]);const Ft=Rt[0],X=r.convert(w.format,w.colorSpace),Q=r.convert(w.type),ct=M(w.internalFormat,X,Q,w.colorSpace),st=w.isVideoTexture!==!0,St=et.__version===void 0||yt===!0,O=J.dataReady;let wt=Y(w,Ft);mt(i.TEXTURE_CUBE_MAP,w);let ht;if(Pt){st&&St&&e.texStorage2D(i.TEXTURE_CUBE_MAP,wt,ct,Ft.width,Ft.height);for(let pt=0;pt<6;pt++){ht=Rt[pt].mipmaps;for(let Ct=0;Ct<ht.length;Ct++){const Lt=ht[Ct];w.format!==qe?X!==null?st?O&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,Ct,0,0,Lt.width,Lt.height,X,Lt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,Ct,ct,Lt.width,Lt.height,0,Lt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):st?O&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,Ct,0,0,Lt.width,Lt.height,X,Q,Lt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,Ct,ct,Lt.width,Lt.height,0,X,Q,Lt.data)}}}else{if(ht=w.mipmaps,st&&St){ht.length>0&&wt++;const pt=ot(Rt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,wt,ct,pt.width,pt.height)}for(let pt=0;pt<6;pt++)if(gt){st?O&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,0,0,0,Rt[pt].width,Rt[pt].height,X,Q,Rt[pt].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,0,ct,Rt[pt].width,Rt[pt].height,0,X,Q,Rt[pt].data);for(let Ct=0;Ct<ht.length;Ct++){const Ot=ht[Ct].image[pt].image;st?O&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,Ct+1,0,0,Ot.width,Ot.height,X,Q,Ot.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,Ct+1,ct,Ot.width,Ot.height,0,X,Q,Ot.data)}}else{st?O&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,0,0,0,X,Q,Rt[pt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,0,ct,X,Q,Rt[pt]);for(let Ct=0;Ct<ht.length;Ct++){const Lt=ht[Ct];st?O&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,Ct+1,0,0,X,Q,Lt.image[pt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,Ct+1,ct,X,Q,Lt.image[pt])}}}m(w)&&p(i.TEXTURE_CUBE_MAP),et.__version=J.version,w.onUpdate&&w.onUpdate(w)}A.__version=w.version}function at(A,w,rt,yt,J,et){const bt=r.convert(rt.format,rt.colorSpace),dt=r.convert(rt.type),Mt=M(rt.internalFormat,bt,dt,rt.colorSpace),Pt=n.get(w),gt=n.get(rt);if(gt.__renderTarget=w,!Pt.__hasExternalTextures){const Rt=Math.max(1,w.width>>et),Ft=Math.max(1,w.height>>et);J===i.TEXTURE_3D||J===i.TEXTURE_2D_ARRAY?e.texImage3D(J,et,Mt,Rt,Ft,w.depth,0,bt,dt,null):e.texImage2D(J,et,Mt,Rt,Ft,0,bt,dt,null)}e.bindFramebuffer(i.FRAMEBUFFER,A),H(w)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,yt,J,gt.__webglTexture,0,G(w)):(J===i.TEXTURE_2D||J>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,yt,J,gt.__webglTexture,et),e.bindFramebuffer(i.FRAMEBUFFER,null)}function $(A,w,rt){if(i.bindRenderbuffer(i.RENDERBUFFER,A),w.depthBuffer){const yt=w.depthTexture,J=yt&&yt.isDepthTexture?yt.type:null,et=x(w.stencilBuffer,J),bt=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,dt=G(w);H(w)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,dt,et,w.width,w.height):rt?i.renderbufferStorageMultisample(i.RENDERBUFFER,dt,et,w.width,w.height):i.renderbufferStorage(i.RENDERBUFFER,et,w.width,w.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,bt,i.RENDERBUFFER,A)}else{const yt=w.textures;for(let J=0;J<yt.length;J++){const et=yt[J],bt=r.convert(et.format,et.colorSpace),dt=r.convert(et.type),Mt=M(et.internalFormat,bt,dt,et.colorSpace),Pt=G(w);rt&&H(w)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Pt,Mt,w.width,w.height):H(w)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Pt,Mt,w.width,w.height):i.renderbufferStorage(i.RENDERBUFFER,Mt,w.width,w.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function ft(A,w){if(w&&w.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,A),!(w.depthTexture&&w.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const yt=n.get(w.depthTexture);yt.__renderTarget=w,(!yt.__webglTexture||w.depthTexture.image.width!==w.width||w.depthTexture.image.height!==w.height)&&(w.depthTexture.image.width=w.width,w.depthTexture.image.height=w.height,w.depthTexture.needsUpdate=!0),U(w.depthTexture,0);const J=yt.__webglTexture,et=G(w);if(w.depthTexture.format===Vi)H(w)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,J,0,et):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,J,0);else if(w.depthTexture.format===$i)H(w)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,J,0,et):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,J,0);else throw new Error("Unknown depthTexture format")}function At(A){const w=n.get(A),rt=A.isWebGLCubeRenderTarget===!0;if(w.__boundDepthTexture!==A.depthTexture){const yt=A.depthTexture;if(w.__depthDisposeCallback&&w.__depthDisposeCallback(),yt){const J=()=>{delete w.__boundDepthTexture,delete w.__depthDisposeCallback,yt.removeEventListener("dispose",J)};yt.addEventListener("dispose",J),w.__depthDisposeCallback=J}w.__boundDepthTexture=yt}if(A.depthTexture&&!w.__autoAllocateDepthBuffer){if(rt)throw new Error("target.depthTexture not supported in Cube render targets");ft(w.__webglFramebuffer,A)}else if(rt){w.__webglDepthbuffer=[];for(let yt=0;yt<6;yt++)if(e.bindFramebuffer(i.FRAMEBUFFER,w.__webglFramebuffer[yt]),w.__webglDepthbuffer[yt]===void 0)w.__webglDepthbuffer[yt]=i.createRenderbuffer(),$(w.__webglDepthbuffer[yt],A,!1);else{const J=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,et=w.__webglDepthbuffer[yt];i.bindRenderbuffer(i.RENDERBUFFER,et),i.framebufferRenderbuffer(i.FRAMEBUFFER,J,i.RENDERBUFFER,et)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,w.__webglFramebuffer),w.__webglDepthbuffer===void 0)w.__webglDepthbuffer=i.createRenderbuffer(),$(w.__webglDepthbuffer,A,!1);else{const yt=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,J=w.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,J),i.framebufferRenderbuffer(i.FRAMEBUFFER,yt,i.RENDERBUFFER,J)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function It(A,w,rt){const yt=n.get(A);w!==void 0&&at(yt.__webglFramebuffer,A,A.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),rt!==void 0&&At(A)}function Gt(A){const w=A.texture,rt=n.get(A),yt=n.get(w);A.addEventListener("dispose",L);const J=A.textures,et=A.isWebGLCubeRenderTarget===!0,bt=J.length>1;if(bt||(yt.__webglTexture===void 0&&(yt.__webglTexture=i.createTexture()),yt.__version=w.version,o.memory.textures++),et){rt.__webglFramebuffer=[];for(let dt=0;dt<6;dt++)if(w.mipmaps&&w.mipmaps.length>0){rt.__webglFramebuffer[dt]=[];for(let Mt=0;Mt<w.mipmaps.length;Mt++)rt.__webglFramebuffer[dt][Mt]=i.createFramebuffer()}else rt.__webglFramebuffer[dt]=i.createFramebuffer()}else{if(w.mipmaps&&w.mipmaps.length>0){rt.__webglFramebuffer=[];for(let dt=0;dt<w.mipmaps.length;dt++)rt.__webglFramebuffer[dt]=i.createFramebuffer()}else rt.__webglFramebuffer=i.createFramebuffer();if(bt)for(let dt=0,Mt=J.length;dt<Mt;dt++){const Pt=n.get(J[dt]);Pt.__webglTexture===void 0&&(Pt.__webglTexture=i.createTexture(),o.memory.textures++)}if(A.samples>0&&H(A)===!1){rt.__webglMultisampledFramebuffer=i.createFramebuffer(),rt.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,rt.__webglMultisampledFramebuffer);for(let dt=0;dt<J.length;dt++){const Mt=J[dt];rt.__webglColorRenderbuffer[dt]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,rt.__webglColorRenderbuffer[dt]);const Pt=r.convert(Mt.format,Mt.colorSpace),gt=r.convert(Mt.type),Rt=M(Mt.internalFormat,Pt,gt,Mt.colorSpace,A.isXRRenderTarget===!0),Ft=G(A);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ft,Rt,A.width,A.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+dt,i.RENDERBUFFER,rt.__webglColorRenderbuffer[dt])}i.bindRenderbuffer(i.RENDERBUFFER,null),A.depthBuffer&&(rt.__webglDepthRenderbuffer=i.createRenderbuffer(),$(rt.__webglDepthRenderbuffer,A,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(et){e.bindTexture(i.TEXTURE_CUBE_MAP,yt.__webglTexture),mt(i.TEXTURE_CUBE_MAP,w);for(let dt=0;dt<6;dt++)if(w.mipmaps&&w.mipmaps.length>0)for(let Mt=0;Mt<w.mipmaps.length;Mt++)at(rt.__webglFramebuffer[dt][Mt],A,w,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,Mt);else at(rt.__webglFramebuffer[dt],A,w,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,0);m(w)&&p(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(bt){for(let dt=0,Mt=J.length;dt<Mt;dt++){const Pt=J[dt],gt=n.get(Pt);e.bindTexture(i.TEXTURE_2D,gt.__webglTexture),mt(i.TEXTURE_2D,Pt),at(rt.__webglFramebuffer,A,Pt,i.COLOR_ATTACHMENT0+dt,i.TEXTURE_2D,0),m(Pt)&&p(i.TEXTURE_2D)}e.unbindTexture()}else{let dt=i.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(dt=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(dt,yt.__webglTexture),mt(dt,w),w.mipmaps&&w.mipmaps.length>0)for(let Mt=0;Mt<w.mipmaps.length;Mt++)at(rt.__webglFramebuffer[Mt],A,w,i.COLOR_ATTACHMENT0,dt,Mt);else at(rt.__webglFramebuffer,A,w,i.COLOR_ATTACHMENT0,dt,0);m(w)&&p(dt),e.unbindTexture()}A.depthBuffer&&At(A)}function xt(A){const w=A.textures;for(let rt=0,yt=w.length;rt<yt;rt++){const J=w[rt];if(m(J)){const et=y(A),bt=n.get(J).__webglTexture;e.bindTexture(et,bt),p(et),e.unbindTexture()}}}const Tt=[],N=[];function S(A){if(A.samples>0){if(H(A)===!1){const w=A.textures,rt=A.width,yt=A.height;let J=i.COLOR_BUFFER_BIT;const et=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,bt=n.get(A),dt=w.length>1;if(dt)for(let Mt=0;Mt<w.length;Mt++)e.bindFramebuffer(i.FRAMEBUFFER,bt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,bt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,bt.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,bt.__webglFramebuffer);for(let Mt=0;Mt<w.length;Mt++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(J|=i.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(J|=i.STENCIL_BUFFER_BIT)),dt){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,bt.__webglColorRenderbuffer[Mt]);const Pt=n.get(w[Mt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Pt,0)}i.blitFramebuffer(0,0,rt,yt,0,0,rt,yt,J,i.NEAREST),l===!0&&(Tt.length=0,N.length=0,Tt.push(i.COLOR_ATTACHMENT0+Mt),A.depthBuffer&&A.resolveDepthBuffer===!1&&(Tt.push(et),N.push(et),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,N)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Tt))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),dt)for(let Mt=0;Mt<w.length;Mt++){e.bindFramebuffer(i.FRAMEBUFFER,bt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.RENDERBUFFER,bt.__webglColorRenderbuffer[Mt]);const Pt=n.get(w[Mt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,bt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.TEXTURE_2D,Pt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,bt.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.resolveDepthBuffer===!1&&l){const w=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[w])}}}function G(A){return Math.min(s.maxSamples,A.samples)}function H(A){const w=n.get(A);return A.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&w.__useRenderToTexture!==!1}function F(A){const w=o.render.frame;u.get(A)!==w&&(u.set(A,w),A.update())}function lt(A,w){const rt=A.colorSpace,yt=A.format,J=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||rt!==ts&&rt!==fn&&(ae.getTransfer(rt)===de?(yt!==qe||J!==bn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",rt)),w}function ot(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(c.width=A.naturalWidth||A.width,c.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(c.width=A.displayWidth,c.height=A.displayHeight):(c.width=A.width,c.height=A.height),c}this.allocateTextureUnit=W,this.resetTextureUnits=V,this.setTexture2D=U,this.setTexture2DArray=z,this.setTexture3D=b,this.setTextureCube=P,this.rebindTextures=It,this.setupRenderTarget=Gt,this.updateRenderTargetMipmap=xt,this.updateMultisampleRenderTarget=S,this.setupDepthRenderbuffer=At,this.setupFrameBufferTexture=at,this.useMultisampledRTT=H}function L0(i,t){function e(n,s=fn){let r;const o=ae.getTransfer(s);if(n===bn)return i.UNSIGNED_BYTE;if(n===Aa)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ca)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Yc)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Wc)return i.BYTE;if(n===Xc)return i.SHORT;if(n===ys)return i.UNSIGNED_SHORT;if(n===Ta)return i.INT;if(n===gi)return i.UNSIGNED_INT;if(n===mn)return i.FLOAT;if(n===Qi)return i.HALF_FLOAT;if(n===qc)return i.ALPHA;if(n===Zc)return i.RGB;if(n===qe)return i.RGBA;if(n===Kc)return i.LUMINANCE;if(n===Jc)return i.LUMINANCE_ALPHA;if(n===Vi)return i.DEPTH_COMPONENT;if(n===$i)return i.DEPTH_STENCIL;if(n===Ra)return i.RED;if(n===Pa)return i.RED_INTEGER;if(n===$c)return i.RG;if(n===Ia)return i.RG_INTEGER;if(n===La)return i.RGBA_INTEGER;if(n===ur||n===hr||n===fr||n===dr)if(o===de)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===ur)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===hr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===fr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===dr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===ur)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===hr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===fr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===dr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Bo||n===Go||n===Ho||n===Vo)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Bo)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Go)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ho)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Vo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Wo||n===Xo||n===Yo)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Wo||n===Xo)return o===de?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Yo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===qo||n===Zo||n===Ko||n===Jo||n===$o||n===jo||n===Qo||n===ta||n===ea||n===na||n===ia||n===sa||n===ra||n===oa)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===qo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Zo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ko)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Jo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===$o)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===jo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Qo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ta)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===ea)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===na)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===ia)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===sa)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ra)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===oa)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===pr||n===aa||n===la)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===pr)return o===de?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===aa)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===la)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===jc||n===ca||n===ua||n===ha)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===pr)return r.COMPRESSED_RED_RGTC1_EXT;if(n===ca)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===ua)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===ha)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ji?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}class D0 extends Qe{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class ve extends Kt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const U0={type:"move"};class ho{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ve,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ve,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new k,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new k),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ve,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new k,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new k),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(const v of t.hand.values()){const m=e.getJointPose(v,n),p=this._getHandJoint(c,v);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],d=u.position.distanceTo(h.position),f=.02,g=.005;c.inputState.pinching&&d>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(U0)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new ve;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const N0=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,F0=`
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

}`;class O0{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const s=new ke,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Ee({vertexShader:N0,fragmentShader:F0,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Yt(new Bn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class k0 extends es{constructor(t,e){super();const n=this;let s=null,r=1,o=null,a="local-floor",l=1,c=null,u=null,h=null,d=null,f=null,g=null;const v=new O0,m=e.getContextAttributes();let p=null,y=null;const M=[],x=[],Y=new Et;let R=null;const L=new Qe;L.viewport=new ce;const D=new Qe;D.viewport=new ce;const E=[L,D],_=new D0;let I=null,V=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let B=M[K];return B===void 0&&(B=new ho,M[K]=B),B.getTargetRaySpace()},this.getControllerGrip=function(K){let B=M[K];return B===void 0&&(B=new ho,M[K]=B),B.getGripSpace()},this.getHand=function(K){let B=M[K];return B===void 0&&(B=new ho,M[K]=B),B.getHandSpace()};function W(K){const B=x.indexOf(K.inputSource);if(B===-1)return;const at=M[B];at!==void 0&&(at.update(K.inputSource,K.frame,c||o),at.dispatchEvent({type:K.type,data:K.inputSource}))}function T(){s.removeEventListener("select",W),s.removeEventListener("selectstart",W),s.removeEventListener("selectend",W),s.removeEventListener("squeeze",W),s.removeEventListener("squeezestart",W),s.removeEventListener("squeezeend",W),s.removeEventListener("end",T),s.removeEventListener("inputsourceschange",U);for(let K=0;K<M.length;K++){const B=x[K];B!==null&&(x[K]=null,M[K].disconnect(B))}I=null,V=null,v.reset(),t.setRenderTarget(p),f=null,d=null,h=null,s=null,y=null,q.stop(),n.isPresenting=!1,t.setPixelRatio(R),t.setSize(Y.width,Y.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){a=K,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return h},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(p=t.getRenderTarget(),s.addEventListener("select",W),s.addEventListener("selectstart",W),s.addEventListener("selectend",W),s.addEventListener("squeeze",W),s.addEventListener("squeezestart",W),s.addEventListener("squeezeend",W),s.addEventListener("end",T),s.addEventListener("inputsourceschange",U),m.xrCompatible!==!0&&await e.makeXRCompatible(),R=t.getPixelRatio(),t.getSize(Y),s.renderState.layers===void 0){const B={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,e,B),s.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new Qn(f.framebufferWidth,f.framebufferHeight,{format:qe,type:bn,colorSpace:t.outputColorSpace,stencilBuffer:m.stencil})}else{let B=null,at=null,$=null;m.depth&&($=m.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,B=m.stencil?$i:Vi,at=m.stencil?Ji:gi);const ft={colorFormat:e.RGBA8,depthFormat:$,scaleFactor:r};h=new XRWebGLBinding(s,e),d=h.createProjectionLayer(ft),s.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),y=new Qn(d.textureWidth,d.textureHeight,{format:qe,type:bn,depthTexture:new fu(d.textureWidth,d.textureHeight,at,void 0,void 0,void 0,void 0,void 0,void 0,B),stencilBuffer:m.stencil,colorSpace:t.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),q.setContext(s),q.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function U(K){for(let B=0;B<K.removed.length;B++){const at=K.removed[B],$=x.indexOf(at);$>=0&&(x[$]=null,M[$].disconnect(at))}for(let B=0;B<K.added.length;B++){const at=K.added[B];let $=x.indexOf(at);if($===-1){for(let At=0;At<M.length;At++)if(At>=x.length){x.push(at),$=At;break}else if(x[At]===null){x[At]=at,$=At;break}if($===-1)break}const ft=M[$];ft&&ft.connect(at)}}const z=new k,b=new k;function P(K,B,at){z.setFromMatrixPosition(B.matrixWorld),b.setFromMatrixPosition(at.matrixWorld);const $=z.distanceTo(b),ft=B.projectionMatrix.elements,At=at.projectionMatrix.elements,It=ft[14]/(ft[10]-1),Gt=ft[14]/(ft[10]+1),xt=(ft[9]+1)/ft[5],Tt=(ft[9]-1)/ft[5],N=(ft[8]-1)/ft[0],S=(At[8]+1)/At[0],G=It*N,H=It*S,F=$/(-N+S),lt=F*-N;if(B.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(lt),K.translateZ(F),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),ft[10]===-1)K.projectionMatrix.copy(B.projectionMatrix),K.projectionMatrixInverse.copy(B.projectionMatrixInverse);else{const ot=It+F,A=Gt+F,w=G-lt,rt=H+($-lt),yt=xt*Gt/A*ot,J=Tt*Gt/A*ot;K.projectionMatrix.makePerspective(w,rt,yt,J,ot,A),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function Z(K,B){B===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(B.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let B=K.near,at=K.far;v.texture!==null&&(v.depthNear>0&&(B=v.depthNear),v.depthFar>0&&(at=v.depthFar)),_.near=D.near=L.near=B,_.far=D.far=L.far=at,(I!==_.near||V!==_.far)&&(s.updateRenderState({depthNear:_.near,depthFar:_.far}),I=_.near,V=_.far),L.layers.mask=K.layers.mask|2,D.layers.mask=K.layers.mask|4,_.layers.mask=L.layers.mask|D.layers.mask;const $=K.parent,ft=_.cameras;Z(_,$);for(let At=0;At<ft.length;At++)Z(ft[At],$);ft.length===2?P(_,L,D):_.projectionMatrix.copy(L.projectionMatrix),tt(K,_,$)};function tt(K,B,at){at===null?K.matrix.copy(B.matrixWorld):(K.matrix.copy(at.matrixWorld),K.matrix.invert(),K.matrix.multiply(B.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(B.projectionMatrix),K.projectionMatrixInverse.copy(B.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=fa*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return _},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(K){l=K,d!==null&&(d.fixedFoveation=K),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=K)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(_)};let j=null;function mt(K,B){if(u=B.getViewerPose(c||o),g=B,u!==null){const at=u.views;f!==null&&(t.setRenderTargetFramebuffer(y,f.framebuffer),t.setRenderTarget(y));let $=!1;at.length!==_.cameras.length&&(_.cameras.length=0,$=!0);for(let At=0;At<at.length;At++){const It=at[At];let Gt=null;if(f!==null)Gt=f.getViewport(It);else{const Tt=h.getViewSubImage(d,It);Gt=Tt.viewport,At===0&&(t.setRenderTargetTextures(y,Tt.colorTexture,d.ignoreDepthValues?void 0:Tt.depthStencilTexture),t.setRenderTarget(y))}let xt=E[At];xt===void 0&&(xt=new Qe,xt.layers.enable(At),xt.viewport=new ce,E[At]=xt),xt.matrix.fromArray(It.transform.matrix),xt.matrix.decompose(xt.position,xt.quaternion,xt.scale),xt.projectionMatrix.fromArray(It.projectionMatrix),xt.projectionMatrixInverse.copy(xt.projectionMatrix).invert(),xt.viewport.set(Gt.x,Gt.y,Gt.width,Gt.height),At===0&&(_.matrix.copy(xt.matrix),_.matrix.decompose(_.position,_.quaternion,_.scale)),$===!0&&_.cameras.push(xt)}const ft=s.enabledFeatures;if(ft&&ft.includes("depth-sensing")){const At=h.getDepthInformation(at[0]);At&&At.isValid&&At.texture&&v.init(t,At,s.renderState)}}for(let at=0;at<M.length;at++){const $=x[at],ft=M[at];$!==null&&ft!==void 0&&ft.update($,B,c||o)}j&&j(K,B),B.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:B}),g=null}const q=new hu;q.setAnimationLoop(mt),this.setAnimationLoop=function(K){j=K},this.dispose=function(){}}}const ai=new En,z0=new jt;function B0(i,t){function e(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,lu(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,y,M,x){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),h(m,p)):p.isMeshPhongMaterial?(r(m,p),u(m,p)):p.isMeshStandardMaterial?(r(m,p),d(m,p),p.isMeshPhysicalMaterial&&f(m,p,x)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),v(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?l(m,p,y,M):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,e(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Ge&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,e(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Ge&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,e(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,e(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const y=t.get(p),M=y.envMap,x=y.envMapRotation;M&&(m.envMap.value=M,ai.copy(x),ai.x*=-1,ai.y*=-1,ai.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(ai.y*=-1,ai.z*=-1),m.envMapRotation.value.setFromMatrix4(z0.makeRotationFromEuler(ai)),m.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,y,M){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*y,m.scale.value=M*.5,p.map&&(m.map.value=p.map,e(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function u(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function h(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function d(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,y){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ge&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=y.texture,m.transmissionSamplerSize.value.set(y.width,y.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function v(m,p){const y=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(y.matrixWorld),m.nearDistance.value=y.shadow.camera.near,m.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function G0(i,t,e,n){let s={},r={},o=[];const a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(y,M){const x=M.program;n.uniformBlockBinding(y,x)}function c(y,M){let x=s[y.id];x===void 0&&(g(y),x=u(y),s[y.id]=x,y.addEventListener("dispose",m));const Y=M.program;n.updateUBOMapping(y,Y);const R=t.render.frame;r[y.id]!==R&&(d(y),r[y.id]=R)}function u(y){const M=h();y.__bindingPointIndex=M;const x=i.createBuffer(),Y=y.__size,R=y.usage;return i.bindBuffer(i.UNIFORM_BUFFER,x),i.bufferData(i.UNIFORM_BUFFER,Y,R),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,M,x),x}function h(){for(let y=0;y<a;y++)if(o.indexOf(y)===-1)return o.push(y),y;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(y){const M=s[y.id],x=y.uniforms,Y=y.__cache;i.bindBuffer(i.UNIFORM_BUFFER,M);for(let R=0,L=x.length;R<L;R++){const D=Array.isArray(x[R])?x[R]:[x[R]];for(let E=0,_=D.length;E<_;E++){const I=D[E];if(f(I,R,E,Y)===!0){const V=I.__offset,W=Array.isArray(I.value)?I.value:[I.value];let T=0;for(let U=0;U<W.length;U++){const z=W[U],b=v(z);typeof z=="number"||typeof z=="boolean"?(I.__data[0]=z,i.bufferSubData(i.UNIFORM_BUFFER,V+T,I.__data)):z.isMatrix3?(I.__data[0]=z.elements[0],I.__data[1]=z.elements[1],I.__data[2]=z.elements[2],I.__data[3]=0,I.__data[4]=z.elements[3],I.__data[5]=z.elements[4],I.__data[6]=z.elements[5],I.__data[7]=0,I.__data[8]=z.elements[6],I.__data[9]=z.elements[7],I.__data[10]=z.elements[8],I.__data[11]=0):(z.toArray(I.__data,T),T+=b.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,V,I.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(y,M,x,Y){const R=y.value,L=M+"_"+x;if(Y[L]===void 0)return typeof R=="number"||typeof R=="boolean"?Y[L]=R:Y[L]=R.clone(),!0;{const D=Y[L];if(typeof R=="number"||typeof R=="boolean"){if(D!==R)return Y[L]=R,!0}else if(D.equals(R)===!1)return D.copy(R),!0}return!1}function g(y){const M=y.uniforms;let x=0;const Y=16;for(let L=0,D=M.length;L<D;L++){const E=Array.isArray(M[L])?M[L]:[M[L]];for(let _=0,I=E.length;_<I;_++){const V=E[_],W=Array.isArray(V.value)?V.value:[V.value];for(let T=0,U=W.length;T<U;T++){const z=W[T],b=v(z),P=x%Y,Z=P%b.boundary,tt=P+Z;x+=Z,tt!==0&&Y-tt<b.storage&&(x+=Y-tt),V.__data=new Float32Array(b.storage/Float32Array.BYTES_PER_ELEMENT),V.__offset=x,x+=b.storage}}}const R=x%Y;return R>0&&(x+=Y-R),y.__size=x,y.__cache={},this}function v(y){const M={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(M.boundary=4,M.storage=4):y.isVector2?(M.boundary=8,M.storage=8):y.isVector3||y.isColor?(M.boundary=16,M.storage=12):y.isVector4?(M.boundary=16,M.storage=16):y.isMatrix3?(M.boundary=48,M.storage=48):y.isMatrix4?(M.boundary=64,M.storage=64):y.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",y),M}function m(y){const M=y.target;M.removeEventListener("dispose",m);const x=o.indexOf(M.__bindingPointIndex);o.splice(x,1),i.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function p(){for(const y in s)i.deleteBuffer(s[y]);o=[],s={},r={}}return{bind:l,update:c,dispose:p}}class H0{constructor(t={}){const{canvas:e=Rh(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reverseDepthBuffer:d=!1}=t;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=o;const g=new Uint32Array(4),v=new Int32Array(4);let m=null,p=null;const y=[],M=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Ye,this.toneMapping=kn,this.toneMappingExposure=1;const x=this;let Y=!1,R=0,L=0,D=null,E=-1,_=null;const I=new ce,V=new ce;let W=null;const T=new ut(0);let U=0,z=e.width,b=e.height,P=1,Z=null,tt=null;const j=new ce(0,0,z,b),mt=new ce(0,0,z,b);let q=!1;const K=new Da;let B=!1,at=!1;const $=new jt,ft=new jt,At=new k,It=new ce,Gt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let xt=!1;function Tt(){return D===null?P:1}let N=n;function S(C,nt){return e.getContext(C,nt)}try{const C={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${ba}`),e.addEventListener("webglcontextlost",pt,!1),e.addEventListener("webglcontextrestored",Ct,!1),e.addEventListener("webglcontextcreationerror",Lt,!1),N===null){const nt="webgl2";if(N=S(nt,C),N===null)throw S(nt)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(C){throw console.error("THREE.WebGLRenderer: "+C.message),C}let G,H,F,lt,ot,A,w,rt,yt,J,et,bt,dt,Mt,Pt,gt,Rt,Ft,X,Q,ct,st,St,O;function wt(){G=new qp(N),G.init(),st=new L0(N,G),H=new Gp(N,G,t,st),F=new R0(N,G),H.reverseDepthBuffer&&d&&F.buffers.depth.setReversed(!0),lt=new Jp(N),ot=new p0,A=new I0(N,G,F,ot,H,st,lt),w=new Vp(x),rt=new Yp(x),yt=new nf(N),St=new zp(N,yt),J=new Zp(N,yt,lt,St),et=new jp(N,J,yt,lt),X=new $p(N,H,A),gt=new Hp(ot),bt=new d0(x,w,rt,G,H,St,gt),dt=new B0(x,ot),Mt=new g0,Pt=new S0(G),Ft=new kp(x,w,rt,F,et,f,l),Rt=new A0(x,et,H),O=new G0(N,lt,H,F),Q=new Bp(N,G,lt),ct=new Kp(N,G,lt),lt.programs=bt.programs,x.capabilities=H,x.extensions=G,x.properties=ot,x.renderLists=Mt,x.shadowMap=Rt,x.state=F,x.info=lt}wt();const ht=new k0(x,N);this.xr=ht,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){const C=G.get("WEBGL_lose_context");C&&C.loseContext()},this.forceContextRestore=function(){const C=G.get("WEBGL_lose_context");C&&C.restoreContext()},this.getPixelRatio=function(){return P},this.setPixelRatio=function(C){C!==void 0&&(P=C,this.setSize(z,b,!1))},this.getSize=function(C){return C.set(z,b)},this.setSize=function(C,nt,vt=!0){if(ht.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}z=C,b=nt,e.width=Math.floor(C*P),e.height=Math.floor(nt*P),vt===!0&&(e.style.width=C+"px",e.style.height=nt+"px"),this.setViewport(0,0,C,nt)},this.getDrawingBufferSize=function(C){return C.set(z*P,b*P).floor()},this.setDrawingBufferSize=function(C,nt,vt){z=C,b=nt,P=vt,e.width=Math.floor(C*vt),e.height=Math.floor(nt*vt),this.setViewport(0,0,C,nt)},this.getCurrentViewport=function(C){return C.copy(I)},this.getViewport=function(C){return C.copy(j)},this.setViewport=function(C,nt,vt,_t){C.isVector4?j.set(C.x,C.y,C.z,C.w):j.set(C,nt,vt,_t),F.viewport(I.copy(j).multiplyScalar(P).round())},this.getScissor=function(C){return C.copy(mt)},this.setScissor=function(C,nt,vt,_t){C.isVector4?mt.set(C.x,C.y,C.z,C.w):mt.set(C,nt,vt,_t),F.scissor(V.copy(mt).multiplyScalar(P).round())},this.getScissorTest=function(){return q},this.setScissorTest=function(C){F.setScissorTest(q=C)},this.setOpaqueSort=function(C){Z=C},this.setTransparentSort=function(C){tt=C},this.getClearColor=function(C){return C.copy(Ft.getClearColor())},this.setClearColor=function(){Ft.setClearColor.apply(Ft,arguments)},this.getClearAlpha=function(){return Ft.getClearAlpha()},this.setClearAlpha=function(){Ft.setClearAlpha.apply(Ft,arguments)},this.clear=function(C=!0,nt=!0,vt=!0){let _t=0;if(C){let it=!1;if(D!==null){const Dt=D.texture.format;it=Dt===La||Dt===Ia||Dt===Pa}if(it){const Dt=D.texture.type,kt=Dt===bn||Dt===gi||Dt===ys||Dt===Ji||Dt===Aa||Dt===Ca,Ht=Ft.getClearColor(),Vt=Ft.getClearAlpha(),Zt=Ht.r,Jt=Ht.g,Wt=Ht.b;kt?(g[0]=Zt,g[1]=Jt,g[2]=Wt,g[3]=Vt,N.clearBufferuiv(N.COLOR,0,g)):(v[0]=Zt,v[1]=Jt,v[2]=Wt,v[3]=Vt,N.clearBufferiv(N.COLOR,0,v))}else _t|=N.COLOR_BUFFER_BIT}nt&&(_t|=N.DEPTH_BUFFER_BIT),vt&&(_t|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),N.clear(_t)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",pt,!1),e.removeEventListener("webglcontextrestored",Ct,!1),e.removeEventListener("webglcontextcreationerror",Lt,!1),Mt.dispose(),Pt.dispose(),ot.dispose(),w.dispose(),rt.dispose(),et.dispose(),St.dispose(),O.dispose(),bt.dispose(),ht.dispose(),ht.removeEventListener("sessionstart",Ce),ht.removeEventListener("sessionend",an),_n.stop()};function pt(C){C.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),Y=!0}function Ct(){console.log("THREE.WebGLRenderer: Context Restored."),Y=!1;const C=lt.autoReset,nt=Rt.enabled,vt=Rt.autoUpdate,_t=Rt.needsUpdate,it=Rt.type;wt(),lt.autoReset=C,Rt.enabled=nt,Rt.autoUpdate=vt,Rt.needsUpdate=_t,Rt.type=it}function Lt(C){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",C.statusMessage)}function Ot(C){const nt=C.target;nt.removeEventListener("dispose",Ot),ne(nt)}function ne(C){fe(C),ot.remove(C)}function fe(C){const nt=ot.get(C).programs;nt!==void 0&&(nt.forEach(function(vt){bt.releaseProgram(vt)}),C.isShaderMaterial&&bt.releaseShaderCache(C))}this.renderBufferDirect=function(C,nt,vt,_t,it,Dt){nt===null&&(nt=Gt);const kt=it.isMesh&&it.matrixWorld.determinant()<0,Ht=Uu(C,nt,vt,_t,it);F.setMaterial(_t,kt);let Vt=vt.index,Zt=1;if(_t.wireframe===!0){if(Vt=J.getWireframeAttribute(vt),Vt===void 0)return;Zt=2}const Jt=vt.drawRange,Wt=vt.attributes.position;let le=Jt.start*Zt,ge=(Jt.start+Jt.count)*Zt;Dt!==null&&(le=Math.max(le,Dt.start*Zt),ge=Math.min(ge,(Dt.start+Dt.count)*Zt)),Vt!==null?(le=Math.max(le,0),ge=Math.min(ge,Vt.count)):Wt!=null&&(le=Math.max(le,0),ge=Math.min(ge,Wt.count));const _e=ge-le;if(_e<0||_e===1/0)return;St.setup(it,_t,Ht,vt,Vt);let Ve,ue=Q;if(Vt!==null&&(Ve=yt.get(Vt),ue=ct,ue.setIndex(Ve)),it.isMesh)_t.wireframe===!0?(F.setLineWidth(_t.wireframeLinewidth*Tt()),ue.setMode(N.LINES)):ue.setMode(N.TRIANGLES);else if(it.isLine){let Xt=_t.linewidth;Xt===void 0&&(Xt=1),F.setLineWidth(Xt*Tt()),it.isLineSegments?ue.setMode(N.LINES):it.isLineLoop?ue.setMode(N.LINE_LOOP):ue.setMode(N.LINE_STRIP)}else it.isPoints?ue.setMode(N.POINTS):it.isSprite&&ue.setMode(N.TRIANGLES);if(it.isBatchedMesh)if(it._multiDrawInstances!==null)ue.renderMultiDrawInstances(it._multiDrawStarts,it._multiDrawCounts,it._multiDrawCount,it._multiDrawInstances);else if(G.get("WEBGL_multi_draw"))ue.renderMultiDraw(it._multiDrawStarts,it._multiDrawCounts,it._multiDrawCount);else{const Xt=it._multiDrawStarts,Cn=it._multiDrawCounts,he=it._multiDrawCount,ln=Vt?yt.get(Vt).bytesPerElement:1,yi=ot.get(_t).currentProgram.getUniforms();for(let Ke=0;Ke<he;Ke++)yi.setValue(N,"_gl_DrawID",Ke),ue.render(Xt[Ke]/ln,Cn[Ke])}else if(it.isInstancedMesh)ue.renderInstances(le,_e,it.count);else if(vt.isInstancedBufferGeometry){const Xt=vt._maxInstanceCount!==void 0?vt._maxInstanceCount:1/0,Cn=Math.min(vt.instanceCount,Xt);ue.renderInstances(le,_e,Cn)}else ue.render(le,_e)};function zt(C,nt,vt){C.transparent===!0&&C.side===Ie&&C.forceSinglePass===!1?(C.side=Ge,C.needsUpdate=!0,Is(C,nt,vt),C.side=jn,C.needsUpdate=!0,Is(C,nt,vt),C.side=Ie):Is(C,nt,vt)}this.compile=function(C,nt,vt=null){vt===null&&(vt=C),p=Pt.get(vt),p.init(nt),M.push(p),vt.traverseVisible(function(it){it.isLight&&it.layers.test(nt.layers)&&(p.pushLight(it),it.castShadow&&p.pushShadow(it))}),C!==vt&&C.traverseVisible(function(it){it.isLight&&it.layers.test(nt.layers)&&(p.pushLight(it),it.castShadow&&p.pushShadow(it))}),p.setupLights();const _t=new Set;return C.traverse(function(it){if(!(it.isMesh||it.isPoints||it.isLine||it.isSprite))return;const Dt=it.material;if(Dt)if(Array.isArray(Dt))for(let kt=0;kt<Dt.length;kt++){const Ht=Dt[kt];zt(Ht,vt,it),_t.add(Ht)}else zt(Dt,vt,it),_t.add(Dt)}),M.pop(),p=null,_t},this.compileAsync=function(C,nt,vt=null){const _t=this.compile(C,nt,vt);return new Promise(it=>{function Dt(){if(_t.forEach(function(kt){ot.get(kt).currentProgram.isReady()&&_t.delete(kt)}),_t.size===0){it(C);return}setTimeout(Dt,10)}G.get("KHR_parallel_shader_compile")!==null?Dt():setTimeout(Dt,10)})};let ee=null;function ie(C){ee&&ee(C)}function Ce(){_n.stop()}function an(){_n.start()}const _n=new hu;_n.setAnimationLoop(ie),typeof self<"u"&&_n.setContext(self),this.setAnimationLoop=function(C){ee=C,ht.setAnimationLoop(C),C===null?_n.stop():_n.start()},ht.addEventListener("sessionstart",Ce),ht.addEventListener("sessionend",an),this.render=function(C,nt){if(nt!==void 0&&nt.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(Y===!0)return;if(C.matrixWorldAutoUpdate===!0&&C.updateMatrixWorld(),nt.parent===null&&nt.matrixWorldAutoUpdate===!0&&nt.updateMatrixWorld(),ht.enabled===!0&&ht.isPresenting===!0&&(ht.cameraAutoUpdate===!0&&ht.updateCamera(nt),nt=ht.getCamera()),C.isScene===!0&&C.onBeforeRender(x,C,nt,D),p=Pt.get(C,M.length),p.init(nt),M.push(p),ft.multiplyMatrices(nt.projectionMatrix,nt.matrixWorldInverse),K.setFromProjectionMatrix(ft),at=this.localClippingEnabled,B=gt.init(this.clippingPlanes,at),m=Mt.get(C,y.length),m.init(),y.push(m),ht.enabled===!0&&ht.isPresenting===!0){const Dt=x.xr.getDepthSensingMesh();Dt!==null&&ei(Dt,nt,-1/0,x.sortObjects)}ei(C,nt,0,x.sortObjects),m.finish(),x.sortObjects===!0&&m.sort(Z,tt),xt=ht.enabled===!1||ht.isPresenting===!1||ht.hasDepthSensing()===!1,xt&&Ft.addToRenderList(m,C),this.info.render.frame++,B===!0&&gt.beginShadows();const vt=p.state.shadowsArray;Rt.render(vt,C,nt),B===!0&&gt.endShadows(),this.info.autoReset===!0&&this.info.reset();const _t=m.opaque,it=m.transmissive;if(p.setupLights(),nt.isArrayCamera){const Dt=nt.cameras;if(it.length>0)for(let kt=0,Ht=Dt.length;kt<Ht;kt++){const Vt=Dt[kt];$a(_t,it,C,Vt)}xt&&Ft.render(C);for(let kt=0,Ht=Dt.length;kt<Ht;kt++){const Vt=Dt[kt];is(m,C,Vt,Vt.viewport)}}else it.length>0&&$a(_t,it,C,nt),xt&&Ft.render(C),is(m,C,nt);D!==null&&(A.updateMultisampleRenderTarget(D),A.updateRenderTargetMipmap(D)),C.isScene===!0&&C.onAfterRender(x,C,nt),St.resetDefaultState(),E=-1,_=null,M.pop(),M.length>0?(p=M[M.length-1],B===!0&&gt.setGlobalState(x.clippingPlanes,p.state.camera)):p=null,y.pop(),y.length>0?m=y[y.length-1]:m=null};function ei(C,nt,vt,_t){if(C.visible===!1)return;if(C.layers.test(nt.layers)){if(C.isGroup)vt=C.renderOrder;else if(C.isLOD)C.autoUpdate===!0&&C.update(nt);else if(C.isLight)p.pushLight(C),C.castShadow&&p.pushShadow(C);else if(C.isSprite){if(!C.frustumCulled||K.intersectsSprite(C)){_t&&It.setFromMatrixPosition(C.matrixWorld).applyMatrix4(ft);const kt=et.update(C),Ht=C.material;Ht.visible&&m.push(C,kt,Ht,vt,It.z,null)}}else if((C.isMesh||C.isLine||C.isPoints)&&(!C.frustumCulled||K.intersectsObject(C))){const kt=et.update(C),Ht=C.material;if(_t&&(C.boundingSphere!==void 0?(C.boundingSphere===null&&C.computeBoundingSphere(),It.copy(C.boundingSphere.center)):(kt.boundingSphere===null&&kt.computeBoundingSphere(),It.copy(kt.boundingSphere.center)),It.applyMatrix4(C.matrixWorld).applyMatrix4(ft)),Array.isArray(Ht)){const Vt=kt.groups;for(let Zt=0,Jt=Vt.length;Zt<Jt;Zt++){const Wt=Vt[Zt],le=Ht[Wt.materialIndex];le&&le.visible&&m.push(C,kt,le,vt,It.z,Wt)}}else Ht.visible&&m.push(C,kt,Ht,vt,It.z,null)}}const Dt=C.children;for(let kt=0,Ht=Dt.length;kt<Ht;kt++)ei(Dt[kt],nt,vt,_t)}function is(C,nt,vt,_t){const it=C.opaque,Dt=C.transmissive,kt=C.transparent;p.setupLightsView(vt),B===!0&&gt.setGlobalState(x.clippingPlanes,vt),_t&&F.viewport(I.copy(_t)),it.length>0&&Ps(it,nt,vt),Dt.length>0&&Ps(Dt,nt,vt),kt.length>0&&Ps(kt,nt,vt),F.buffers.depth.setTest(!0),F.buffers.depth.setMask(!0),F.buffers.color.setMask(!0),F.setPolygonOffset(!1)}function $a(C,nt,vt,_t){if((vt.isScene===!0?vt.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[_t.id]===void 0&&(p.state.transmissionRenderTarget[_t.id]=new Qn(1,1,{generateMipmaps:!0,type:G.has("EXT_color_buffer_half_float")||G.has("EXT_color_buffer_float")?Qi:bn,minFilter:Sn,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ae.workingColorSpace}));const Dt=p.state.transmissionRenderTarget[_t.id],kt=_t.viewport||I;Dt.setSize(kt.z,kt.w);const Ht=x.getRenderTarget();x.setRenderTarget(Dt),x.getClearColor(T),U=x.getClearAlpha(),U<1&&x.setClearColor(16777215,.5),x.clear(),xt&&Ft.render(vt);const Vt=x.toneMapping;x.toneMapping=kn;const Zt=_t.viewport;if(_t.viewport!==void 0&&(_t.viewport=void 0),p.setupLightsView(_t),B===!0&&gt.setGlobalState(x.clippingPlanes,_t),Ps(C,vt,_t),A.updateMultisampleRenderTarget(Dt),A.updateRenderTargetMipmap(Dt),G.has("WEBGL_multisampled_render_to_texture")===!1){let Jt=!1;for(let Wt=0,le=nt.length;Wt<le;Wt++){const ge=nt[Wt],_e=ge.object,Ve=ge.geometry,ue=ge.material,Xt=ge.group;if(ue.side===Ie&&_e.layers.test(_t.layers)){const Cn=ue.side;ue.side=Ge,ue.needsUpdate=!0,ja(_e,vt,_t,Ve,ue,Xt),ue.side=Cn,ue.needsUpdate=!0,Jt=!0}}Jt===!0&&(A.updateMultisampleRenderTarget(Dt),A.updateRenderTargetMipmap(Dt))}x.setRenderTarget(Ht),x.setClearColor(T,U),Zt!==void 0&&(_t.viewport=Zt),x.toneMapping=Vt}function Ps(C,nt,vt){const _t=nt.isScene===!0?nt.overrideMaterial:null;for(let it=0,Dt=C.length;it<Dt;it++){const kt=C[it],Ht=kt.object,Vt=kt.geometry,Zt=_t===null?kt.material:_t,Jt=kt.group;Ht.layers.test(vt.layers)&&ja(Ht,nt,vt,Vt,Zt,Jt)}}function ja(C,nt,vt,_t,it,Dt){C.onBeforeRender(x,nt,vt,_t,it,Dt),C.modelViewMatrix.multiplyMatrices(vt.matrixWorldInverse,C.matrixWorld),C.normalMatrix.getNormalMatrix(C.modelViewMatrix),it.onBeforeRender(x,nt,vt,_t,C,Dt),it.transparent===!0&&it.side===Ie&&it.forceSinglePass===!1?(it.side=Ge,it.needsUpdate=!0,x.renderBufferDirect(vt,nt,_t,it,C,Dt),it.side=jn,it.needsUpdate=!0,x.renderBufferDirect(vt,nt,_t,it,C,Dt),it.side=Ie):x.renderBufferDirect(vt,nt,_t,it,C,Dt),C.onAfterRender(x,nt,vt,_t,it,Dt)}function Is(C,nt,vt){nt.isScene!==!0&&(nt=Gt);const _t=ot.get(C),it=p.state.lights,Dt=p.state.shadowsArray,kt=it.state.version,Ht=bt.getParameters(C,it.state,Dt,nt,vt),Vt=bt.getProgramCacheKey(Ht);let Zt=_t.programs;_t.environment=C.isMeshStandardMaterial?nt.environment:null,_t.fog=nt.fog,_t.envMap=(C.isMeshStandardMaterial?rt:w).get(C.envMap||_t.environment),_t.envMapRotation=_t.environment!==null&&C.envMap===null?nt.environmentRotation:C.envMapRotation,Zt===void 0&&(C.addEventListener("dispose",Ot),Zt=new Map,_t.programs=Zt);let Jt=Zt.get(Vt);if(Jt!==void 0){if(_t.currentProgram===Jt&&_t.lightsStateVersion===kt)return tl(C,Ht),Jt}else Ht.uniforms=bt.getUniforms(C),C.onBeforeCompile(Ht,x),Jt=bt.acquireProgram(Ht,Vt),Zt.set(Vt,Jt),_t.uniforms=Ht.uniforms;const Wt=_t.uniforms;return(!C.isShaderMaterial&&!C.isRawShaderMaterial||C.clipping===!0)&&(Wt.clippingPlanes=gt.uniform),tl(C,Ht),_t.needsLights=Fu(C),_t.lightsStateVersion=kt,_t.needsLights&&(Wt.ambientLightColor.value=it.state.ambient,Wt.lightProbe.value=it.state.probe,Wt.directionalLights.value=it.state.directional,Wt.directionalLightShadows.value=it.state.directionalShadow,Wt.spotLights.value=it.state.spot,Wt.spotLightShadows.value=it.state.spotShadow,Wt.rectAreaLights.value=it.state.rectArea,Wt.ltc_1.value=it.state.rectAreaLTC1,Wt.ltc_2.value=it.state.rectAreaLTC2,Wt.pointLights.value=it.state.point,Wt.pointLightShadows.value=it.state.pointShadow,Wt.hemisphereLights.value=it.state.hemi,Wt.directionalShadowMap.value=it.state.directionalShadowMap,Wt.directionalShadowMatrix.value=it.state.directionalShadowMatrix,Wt.spotShadowMap.value=it.state.spotShadowMap,Wt.spotLightMatrix.value=it.state.spotLightMatrix,Wt.spotLightMap.value=it.state.spotLightMap,Wt.pointShadowMap.value=it.state.pointShadowMap,Wt.pointShadowMatrix.value=it.state.pointShadowMatrix),_t.currentProgram=Jt,_t.uniformsList=null,Jt}function Qa(C){if(C.uniformsList===null){const nt=C.currentProgram.getUniforms();C.uniformsList=mr.seqWithValue(nt.seq,C.uniforms)}return C.uniformsList}function tl(C,nt){const vt=ot.get(C);vt.outputColorSpace=nt.outputColorSpace,vt.batching=nt.batching,vt.batchingColor=nt.batchingColor,vt.instancing=nt.instancing,vt.instancingColor=nt.instancingColor,vt.instancingMorph=nt.instancingMorph,vt.skinning=nt.skinning,vt.morphTargets=nt.morphTargets,vt.morphNormals=nt.morphNormals,vt.morphColors=nt.morphColors,vt.morphTargetsCount=nt.morphTargetsCount,vt.numClippingPlanes=nt.numClippingPlanes,vt.numIntersection=nt.numClipIntersection,vt.vertexAlphas=nt.vertexAlphas,vt.vertexTangents=nt.vertexTangents,vt.toneMapping=nt.toneMapping}function Uu(C,nt,vt,_t,it){nt.isScene!==!0&&(nt=Gt),A.resetTextureUnits();const Dt=nt.fog,kt=_t.isMeshStandardMaterial?nt.environment:null,Ht=D===null?x.outputColorSpace:D.isXRRenderTarget===!0?D.texture.colorSpace:ts,Vt=(_t.isMeshStandardMaterial?rt:w).get(_t.envMap||kt),Zt=_t.vertexColors===!0&&!!vt.attributes.color&&vt.attributes.color.itemSize===4,Jt=!!vt.attributes.tangent&&(!!_t.normalMap||_t.anisotropy>0),Wt=!!vt.morphAttributes.position,le=!!vt.morphAttributes.normal,ge=!!vt.morphAttributes.color;let _e=kn;_t.toneMapped&&(D===null||D.isXRRenderTarget===!0)&&(_e=x.toneMapping);const Ve=vt.morphAttributes.position||vt.morphAttributes.normal||vt.morphAttributes.color,ue=Ve!==void 0?Ve.length:0,Xt=ot.get(_t),Cn=p.state.lights;if(B===!0&&(at===!0||C!==_)){const en=C===_&&_t.id===E;gt.setState(_t,C,en)}let he=!1;_t.version===Xt.__version?(Xt.needsLights&&Xt.lightsStateVersion!==Cn.state.version||Xt.outputColorSpace!==Ht||it.isBatchedMesh&&Xt.batching===!1||!it.isBatchedMesh&&Xt.batching===!0||it.isBatchedMesh&&Xt.batchingColor===!0&&it.colorTexture===null||it.isBatchedMesh&&Xt.batchingColor===!1&&it.colorTexture!==null||it.isInstancedMesh&&Xt.instancing===!1||!it.isInstancedMesh&&Xt.instancing===!0||it.isSkinnedMesh&&Xt.skinning===!1||!it.isSkinnedMesh&&Xt.skinning===!0||it.isInstancedMesh&&Xt.instancingColor===!0&&it.instanceColor===null||it.isInstancedMesh&&Xt.instancingColor===!1&&it.instanceColor!==null||it.isInstancedMesh&&Xt.instancingMorph===!0&&it.morphTexture===null||it.isInstancedMesh&&Xt.instancingMorph===!1&&it.morphTexture!==null||Xt.envMap!==Vt||_t.fog===!0&&Xt.fog!==Dt||Xt.numClippingPlanes!==void 0&&(Xt.numClippingPlanes!==gt.numPlanes||Xt.numIntersection!==gt.numIntersection)||Xt.vertexAlphas!==Zt||Xt.vertexTangents!==Jt||Xt.morphTargets!==Wt||Xt.morphNormals!==le||Xt.morphColors!==ge||Xt.toneMapping!==_e||Xt.morphTargetsCount!==ue)&&(he=!0):(he=!0,Xt.__version=_t.version);let ln=Xt.currentProgram;he===!0&&(ln=Is(_t,nt,it));let yi=!1,Ke=!1,ss=!1;const xe=ln.getUniforms(),xn=Xt.uniforms;if(F.useProgram(ln.program)&&(yi=!0,Ke=!0,ss=!0),_t.id!==E&&(E=_t.id,Ke=!0),yi||_!==C){F.buffers.depth.getReversed()?($.copy(C.projectionMatrix),Ih($),Lh($),xe.setValue(N,"projectionMatrix",$)):xe.setValue(N,"projectionMatrix",C.projectionMatrix),xe.setValue(N,"viewMatrix",C.matrixWorldInverse);const Gn=xe.map.cameraPosition;Gn!==void 0&&Gn.setValue(N,At.setFromMatrixPosition(C.matrixWorld)),H.logarithmicDepthBuffer&&xe.setValue(N,"logDepthBufFC",2/(Math.log(C.far+1)/Math.LN2)),(_t.isMeshPhongMaterial||_t.isMeshToonMaterial||_t.isMeshLambertMaterial||_t.isMeshBasicMaterial||_t.isMeshStandardMaterial||_t.isShaderMaterial)&&xe.setValue(N,"isOrthographic",C.isOrthographicCamera===!0),_!==C&&(_=C,Ke=!0,ss=!0)}if(it.isSkinnedMesh){xe.setOptional(N,it,"bindMatrix"),xe.setOptional(N,it,"bindMatrixInverse");const en=it.skeleton;en&&(en.boneTexture===null&&en.computeBoneTexture(),xe.setValue(N,"boneTexture",en.boneTexture,A))}it.isBatchedMesh&&(xe.setOptional(N,it,"batchingTexture"),xe.setValue(N,"batchingTexture",it._matricesTexture,A),xe.setOptional(N,it,"batchingIdTexture"),xe.setValue(N,"batchingIdTexture",it._indirectTexture,A),xe.setOptional(N,it,"batchingColorTexture"),it._colorsTexture!==null&&xe.setValue(N,"batchingColorTexture",it._colorsTexture,A));const rs=vt.morphAttributes;if((rs.position!==void 0||rs.normal!==void 0||rs.color!==void 0)&&X.update(it,vt,ln),(Ke||Xt.receiveShadow!==it.receiveShadow)&&(Xt.receiveShadow=it.receiveShadow,xe.setValue(N,"receiveShadow",it.receiveShadow)),_t.isMeshGouraudMaterial&&_t.envMap!==null&&(xn.envMap.value=Vt,xn.flipEnvMap.value=Vt.isCubeTexture&&Vt.isRenderTargetTexture===!1?-1:1),_t.isMeshStandardMaterial&&_t.envMap===null&&nt.environment!==null&&(xn.envMapIntensity.value=nt.environmentIntensity),Ke&&(xe.setValue(N,"toneMappingExposure",x.toneMappingExposure),Xt.needsLights&&Nu(xn,ss),Dt&&_t.fog===!0&&dt.refreshFogUniforms(xn,Dt),dt.refreshMaterialUniforms(xn,_t,P,b,p.state.transmissionRenderTarget[C.id]),mr.upload(N,Qa(Xt),xn,A)),_t.isShaderMaterial&&_t.uniformsNeedUpdate===!0&&(mr.upload(N,Qa(Xt),xn,A),_t.uniformsNeedUpdate=!1),_t.isSpriteMaterial&&xe.setValue(N,"center",it.center),xe.setValue(N,"modelViewMatrix",it.modelViewMatrix),xe.setValue(N,"normalMatrix",it.normalMatrix),xe.setValue(N,"modelMatrix",it.matrixWorld),_t.isShaderMaterial||_t.isRawShaderMaterial){const en=_t.uniformsGroups;for(let Gn=0,Hn=en.length;Gn<Hn;Gn++){const el=en[Gn];O.update(el,ln),O.bind(el,ln)}}return ln}function Nu(C,nt){C.ambientLightColor.needsUpdate=nt,C.lightProbe.needsUpdate=nt,C.directionalLights.needsUpdate=nt,C.directionalLightShadows.needsUpdate=nt,C.pointLights.needsUpdate=nt,C.pointLightShadows.needsUpdate=nt,C.spotLights.needsUpdate=nt,C.spotLightShadows.needsUpdate=nt,C.rectAreaLights.needsUpdate=nt,C.hemisphereLights.needsUpdate=nt}function Fu(C){return C.isMeshLambertMaterial||C.isMeshToonMaterial||C.isMeshPhongMaterial||C.isMeshStandardMaterial||C.isShadowMaterial||C.isShaderMaterial&&C.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return L},this.getRenderTarget=function(){return D},this.setRenderTargetTextures=function(C,nt,vt){ot.get(C.texture).__webglTexture=nt,ot.get(C.depthTexture).__webglTexture=vt;const _t=ot.get(C);_t.__hasExternalTextures=!0,_t.__autoAllocateDepthBuffer=vt===void 0,_t.__autoAllocateDepthBuffer||G.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),_t.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(C,nt){const vt=ot.get(C);vt.__webglFramebuffer=nt,vt.__useDefaultFramebuffer=nt===void 0},this.setRenderTarget=function(C,nt=0,vt=0){D=C,R=nt,L=vt;let _t=!0,it=null,Dt=!1,kt=!1;if(C){const Vt=ot.get(C);if(Vt.__useDefaultFramebuffer!==void 0)F.bindFramebuffer(N.FRAMEBUFFER,null),_t=!1;else if(Vt.__webglFramebuffer===void 0)A.setupRenderTarget(C);else if(Vt.__hasExternalTextures)A.rebindTextures(C,ot.get(C.texture).__webglTexture,ot.get(C.depthTexture).__webglTexture);else if(C.depthBuffer){const Wt=C.depthTexture;if(Vt.__boundDepthTexture!==Wt){if(Wt!==null&&ot.has(Wt)&&(C.width!==Wt.image.width||C.height!==Wt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");A.setupDepthRenderbuffer(C)}}const Zt=C.texture;(Zt.isData3DTexture||Zt.isDataArrayTexture||Zt.isCompressedArrayTexture)&&(kt=!0);const Jt=ot.get(C).__webglFramebuffer;C.isWebGLCubeRenderTarget?(Array.isArray(Jt[nt])?it=Jt[nt][vt]:it=Jt[nt],Dt=!0):C.samples>0&&A.useMultisampledRTT(C)===!1?it=ot.get(C).__webglMultisampledFramebuffer:Array.isArray(Jt)?it=Jt[vt]:it=Jt,I.copy(C.viewport),V.copy(C.scissor),W=C.scissorTest}else I.copy(j).multiplyScalar(P).floor(),V.copy(mt).multiplyScalar(P).floor(),W=q;if(F.bindFramebuffer(N.FRAMEBUFFER,it)&&_t&&F.drawBuffers(C,it),F.viewport(I),F.scissor(V),F.setScissorTest(W),Dt){const Vt=ot.get(C.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Vt.__webglTexture,vt)}else if(kt){const Vt=ot.get(C.texture),Zt=nt||0;N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,Vt.__webglTexture,vt||0,Zt)}E=-1},this.readRenderTargetPixels=function(C,nt,vt,_t,it,Dt,kt){if(!(C&&C.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ht=ot.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&kt!==void 0&&(Ht=Ht[kt]),Ht){F.bindFramebuffer(N.FRAMEBUFFER,Ht);try{const Vt=C.texture,Zt=Vt.format,Jt=Vt.type;if(!H.textureFormatReadable(Zt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!H.textureTypeReadable(Jt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}nt>=0&&nt<=C.width-_t&&vt>=0&&vt<=C.height-it&&N.readPixels(nt,vt,_t,it,st.convert(Zt),st.convert(Jt),Dt)}finally{const Vt=D!==null?ot.get(D).__webglFramebuffer:null;F.bindFramebuffer(N.FRAMEBUFFER,Vt)}}},this.readRenderTargetPixelsAsync=async function(C,nt,vt,_t,it,Dt,kt){if(!(C&&C.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ht=ot.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&kt!==void 0&&(Ht=Ht[kt]),Ht){const Vt=C.texture,Zt=Vt.format,Jt=Vt.type;if(!H.textureFormatReadable(Zt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!H.textureTypeReadable(Jt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(nt>=0&&nt<=C.width-_t&&vt>=0&&vt<=C.height-it){F.bindFramebuffer(N.FRAMEBUFFER,Ht);const Wt=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,Wt),N.bufferData(N.PIXEL_PACK_BUFFER,Dt.byteLength,N.STREAM_READ),N.readPixels(nt,vt,_t,it,st.convert(Zt),st.convert(Jt),0);const le=D!==null?ot.get(D).__webglFramebuffer:null;F.bindFramebuffer(N.FRAMEBUFFER,le);const ge=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await Ph(N,ge,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,Wt),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,Dt),N.deleteBuffer(Wt),N.deleteSync(ge),Dt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(C,nt=null,vt=0){C.isTexture!==!0&&(vs("WebGLRenderer: copyFramebufferToTexture function signature has changed."),nt=arguments[0]||null,C=arguments[1]);const _t=Math.pow(2,-vt),it=Math.floor(C.image.width*_t),Dt=Math.floor(C.image.height*_t),kt=nt!==null?nt.x:0,Ht=nt!==null?nt.y:0;A.setTexture2D(C,0),N.copyTexSubImage2D(N.TEXTURE_2D,vt,0,0,kt,Ht,it,Dt),F.unbindTexture()},this.copyTextureToTexture=function(C,nt,vt=null,_t=null,it=0){C.isTexture!==!0&&(vs("WebGLRenderer: copyTextureToTexture function signature has changed."),_t=arguments[0]||null,C=arguments[1],nt=arguments[2],it=arguments[3]||0,vt=null);let Dt,kt,Ht,Vt,Zt,Jt,Wt,le,ge;const _e=C.isCompressedTexture?C.mipmaps[it]:C.image;vt!==null?(Dt=vt.max.x-vt.min.x,kt=vt.max.y-vt.min.y,Ht=vt.isBox3?vt.max.z-vt.min.z:1,Vt=vt.min.x,Zt=vt.min.y,Jt=vt.isBox3?vt.min.z:0):(Dt=_e.width,kt=_e.height,Ht=_e.depth||1,Vt=0,Zt=0,Jt=0),_t!==null?(Wt=_t.x,le=_t.y,ge=_t.z):(Wt=0,le=0,ge=0);const Ve=st.convert(nt.format),ue=st.convert(nt.type);let Xt;nt.isData3DTexture?(A.setTexture3D(nt,0),Xt=N.TEXTURE_3D):nt.isDataArrayTexture||nt.isCompressedArrayTexture?(A.setTexture2DArray(nt,0),Xt=N.TEXTURE_2D_ARRAY):(A.setTexture2D(nt,0),Xt=N.TEXTURE_2D),N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,nt.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,nt.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,nt.unpackAlignment);const Cn=N.getParameter(N.UNPACK_ROW_LENGTH),he=N.getParameter(N.UNPACK_IMAGE_HEIGHT),ln=N.getParameter(N.UNPACK_SKIP_PIXELS),yi=N.getParameter(N.UNPACK_SKIP_ROWS),Ke=N.getParameter(N.UNPACK_SKIP_IMAGES);N.pixelStorei(N.UNPACK_ROW_LENGTH,_e.width),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,_e.height),N.pixelStorei(N.UNPACK_SKIP_PIXELS,Vt),N.pixelStorei(N.UNPACK_SKIP_ROWS,Zt),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Jt);const ss=C.isDataArrayTexture||C.isData3DTexture,xe=nt.isDataArrayTexture||nt.isData3DTexture;if(C.isRenderTargetTexture||C.isDepthTexture){const xn=ot.get(C),rs=ot.get(nt),en=ot.get(xn.__renderTarget),Gn=ot.get(rs.__renderTarget);F.bindFramebuffer(N.READ_FRAMEBUFFER,en.__webglFramebuffer),F.bindFramebuffer(N.DRAW_FRAMEBUFFER,Gn.__webglFramebuffer);for(let Hn=0;Hn<Ht;Hn++)ss&&N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,ot.get(C).__webglTexture,it,Jt+Hn),C.isDepthTexture?(xe&&N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,ot.get(nt).__webglTexture,it,ge+Hn),N.blitFramebuffer(Vt,Zt,Dt,kt,Wt,le,Dt,kt,N.DEPTH_BUFFER_BIT,N.NEAREST)):xe?N.copyTexSubImage3D(Xt,it,Wt,le,ge+Hn,Vt,Zt,Dt,kt):N.copyTexSubImage2D(Xt,it,Wt,le,ge+Hn,Vt,Zt,Dt,kt);F.bindFramebuffer(N.READ_FRAMEBUFFER,null),F.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else xe?C.isDataTexture||C.isData3DTexture?N.texSubImage3D(Xt,it,Wt,le,ge,Dt,kt,Ht,Ve,ue,_e.data):nt.isCompressedArrayTexture?N.compressedTexSubImage3D(Xt,it,Wt,le,ge,Dt,kt,Ht,Ve,_e.data):N.texSubImage3D(Xt,it,Wt,le,ge,Dt,kt,Ht,Ve,ue,_e):C.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,it,Wt,le,Dt,kt,Ve,ue,_e.data):C.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,it,Wt,le,_e.width,_e.height,Ve,_e.data):N.texSubImage2D(N.TEXTURE_2D,it,Wt,le,Dt,kt,Ve,ue,_e);N.pixelStorei(N.UNPACK_ROW_LENGTH,Cn),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,he),N.pixelStorei(N.UNPACK_SKIP_PIXELS,ln),N.pixelStorei(N.UNPACK_SKIP_ROWS,yi),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Ke),it===0&&nt.generateMipmaps&&N.generateMipmap(Xt),F.unbindTexture()},this.copyTextureToTexture3D=function(C,nt,vt=null,_t=null,it=0){return C.isTexture!==!0&&(vs("WebGLRenderer: copyTextureToTexture3D function signature has changed."),vt=arguments[0]||null,_t=arguments[1]||null,C=arguments[2],nt=arguments[3],it=arguments[4]||0),vs('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(C,nt,vt,_t,it)},this.initRenderTarget=function(C){ot.get(C).__webglFramebuffer===void 0&&A.setupRenderTarget(C)},this.initTexture=function(C){C.isCubeTexture?A.setTextureCube(C,0):C.isData3DTexture?A.setTexture3D(C,0):C.isDataArrayTexture||C.isCompressedArrayTexture?A.setTexture2DArray(C,0):A.setTexture2D(C,0),F.unbindTexture()},this.resetState=function(){R=0,L=0,D=null,F.reset(),St.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return On}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorspace=ae._getDrawingBufferColorSpace(t),e.unpackColorSpace=ae._getUnpackColorSpace()}}class Fa{constructor(t,e=25e-5){this.isFogExp2=!0,this.name="",this.color=new ut(t),this.density=e}clone(){return new Fa(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class Oa extends Kt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new En,this.environmentIntensity=1,this.environmentRotation=new En,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}const tc=new k,ec=new ce,nc=new ce,V0=new k,ic=new jt,Qs=new k,fo=new Tn,sc=new jt,po=new Pr;class rc extends Yt{constructor(t,e){super(t,e),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=ol,this.bindMatrix=new jt,this.bindMatrixInverse=new jt,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const t=this.geometry;this.boundingBox===null&&(this.boundingBox=new ti),this.boundingBox.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,Qs),this.boundingBox.expandByPoint(Qs)}computeBoundingSphere(){const t=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Tn),this.boundingSphere.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,Qs),this.boundingSphere.expandByPoint(Qs)}copy(t,e){return super.copy(t,e),this.bindMode=t.bindMode,this.bindMatrix.copy(t.bindMatrix),this.bindMatrixInverse.copy(t.bindMatrixInverse),this.skeleton=t.skeleton,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}raycast(t,e){const n=this.material,s=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),fo.copy(this.boundingSphere),fo.applyMatrix4(s),t.ray.intersectsSphere(fo)!==!1&&(sc.copy(s).invert(),po.copy(t.ray).applyMatrix4(sc),!(this.boundingBox!==null&&po.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(t,e,po)))}getVertexPosition(t,e){return super.getVertexPosition(t,e),this.applyBoneTransform(t,e),e}bind(t,e){this.skeleton=t,e===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),e=this.matrixWorld),this.bindMatrix.copy(e),this.bindMatrixInverse.copy(e).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const t=new ce,e=this.geometry.attributes.skinWeight;for(let n=0,s=e.count;n<s;n++){t.fromBufferAttribute(e,n);const r=1/t.manhattanLength();r!==1/0?t.multiplyScalar(r):t.set(1,0,0,0),e.setXYZW(n,t.x,t.y,t.z,t.w)}}updateMatrixWorld(t){super.updateMatrixWorld(t),this.bindMode===ol?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===gh?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(t,e){const n=this.skeleton,s=this.geometry;ec.fromBufferAttribute(s.attributes.skinIndex,t),nc.fromBufferAttribute(s.attributes.skinWeight,t),tc.copy(e).applyMatrix4(this.bindMatrix),e.set(0,0,0);for(let r=0;r<4;r++){const o=nc.getComponent(r);if(o!==0){const a=ec.getComponent(r);ic.multiplyMatrices(n.bones[a].matrixWorld,n.boneInverses[a]),e.addScaledVector(V0.copy(tc).applyMatrix4(ic),o)}}return e.applyMatrix4(this.bindMatrixInverse)}}class W0 extends Kt{constructor(){super(),this.isBone=!0,this.type="Bone"}}class ka extends ke{constructor(t=null,e=1,n=1,s,r,o,a,l,c=tn,u=tn,h,d){super(null,o,a,l,c,u,s,r,h,d),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const oc=new jt,X0=new jt;class za{constructor(t=[],e=[]){this.uuid=_i(),this.bones=t.slice(0),this.boneInverses=e,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const t=this.bones,e=this.boneInverses;if(this.boneMatrices=new Float32Array(t.length*16),e.length===0)this.calculateInverses();else if(t.length!==e.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,s=this.bones.length;n<s;n++)this.boneInverses.push(new jt)}}calculateInverses(){this.boneInverses.length=0;for(let t=0,e=this.bones.length;t<e;t++){const n=new jt;this.bones[t]&&n.copy(this.bones[t].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&n.matrixWorld.copy(this.boneInverses[t]).invert()}for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const t=this.bones,e=this.boneInverses,n=this.boneMatrices,s=this.boneTexture;for(let r=0,o=t.length;r<o;r++){const a=t[r]?t[r].matrixWorld:X0;oc.multiplyMatrices(a,e[r]),oc.toArray(n,r*16)}s!==null&&(s.needsUpdate=!0)}clone(){return new za(this.bones,this.boneInverses)}computeBoneTexture(){let t=Math.sqrt(this.bones.length*4);t=Math.ceil(t/4)*4,t=Math.max(t,4);const e=new Float32Array(t*t*4);e.set(this.boneMatrices);const n=new ka(e,t,t,qe,mn);return n.needsUpdate=!0,this.boneMatrices=e,this.boneTexture=n,this}getBoneByName(t){for(let e=0,n=this.bones.length;e<n;e++){const s=this.bones[e];if(s.name===t)return s}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(t,e){this.uuid=t.uuid;for(let n=0,s=t.bones.length;n<s;n++){const r=t.bones[n];let o=e[r];o===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",r),o=new W0),this.bones.push(o),this.boneInverses.push(new jt().fromArray(t.boneInverses[n]))}return this.init(),this}toJSON(){const t={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};t.uuid=this.uuid;const e=this.bones,n=this.boneInverses;for(let s=0,r=e.length;s<r;s++){const o=e[s];t.bones.push(o.uuid);const a=n[s];t.boneInverses.push(a.toArray())}return t}}class ma extends Se{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const Fi=new jt,ac=new jt,tr=[],lc=new ti,Y0=new jt,hs=new Yt,fs=new Tn;class rn extends Yt{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new ma(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Y0)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new ti),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Fi),lc.copy(t.boundingBox).applyMatrix4(Fi),this.boundingBox.union(lc)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Tn),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Fi),fs.copy(t.boundingSphere).applyMatrix4(Fi),this.boundingSphere.union(fs)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=t*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(t,e){const n=this.matrixWorld,s=this.count;if(hs.geometry=this.geometry,hs.material=this.material,hs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),fs.copy(this.boundingSphere),fs.applyMatrix4(n),t.ray.intersectsSphere(fs)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Fi),ac.multiplyMatrices(n,Fi),hs.matrixWorld=ac,hs.raycast(t,tr);for(let o=0,a=tr.length;o<a;o++){const l=tr[o];l.instanceId=r,l.object=this,e.push(l)}tr.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new ma(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new ka(new Float32Array(s*this.count),s,this.count,Ra,mn));const r=this.morphTexture.source.data.data;let o=0;for(let c=0;c<n.length;c++)o+=n[c];const a=this.geometry.morphTargetsRelative?1:1-o,l=s*t;r[l]=a,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class vu extends xi{static get type(){return"LineBasicMaterial"}constructor(t){super(),this.isLineBasicMaterial=!0,this.color=new ut(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const xr=new k,Mr=new k,cc=new jt,ds=new Pr,er=new Tn,mo=new k,uc=new k;class q0 extends Kt{constructor(t=new ye,e=new vu){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)xr.fromBufferAttribute(e,s-1),Mr.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=xr.distanceTo(Mr);t.setAttribute("lineDistance",new qt(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),er.copy(n.boundingSphere),er.applyMatrix4(s),er.radius+=r,t.ray.intersectsSphere(er)===!1)return;cc.copy(s).invert(),ds.copy(t.ray).applyMatrix4(cc);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,u=n.index,d=n.attributes.position;if(u!==null){const f=Math.max(0,o.start),g=Math.min(u.count,o.start+o.count);for(let v=f,m=g-1;v<m;v+=c){const p=u.getX(v),y=u.getX(v+1),M=nr(this,t,ds,l,p,y);M&&e.push(M)}if(this.isLineLoop){const v=u.getX(g-1),m=u.getX(f),p=nr(this,t,ds,l,v,m);p&&e.push(p)}}else{const f=Math.max(0,o.start),g=Math.min(d.count,o.start+o.count);for(let v=f,m=g-1;v<m;v+=c){const p=nr(this,t,ds,l,v,v+1);p&&e.push(p)}if(this.isLineLoop){const v=nr(this,t,ds,l,g-1,f);v&&e.push(v)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function nr(i,t,e,n,s,r){const o=i.geometry.attributes.position;if(xr.fromBufferAttribute(o,s),Mr.fromBufferAttribute(o,r),e.distanceSqToSegment(xr,Mr,mo,uc)>n)return;mo.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(mo);if(!(l<t.near||l>t.far))return{distance:l,point:uc.clone().applyMatrix4(i.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:i}}const hc=new k,fc=new k;class Z0 extends q0{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let s=0,r=e.count;s<r;s+=2)hc.fromBufferAttribute(e,s),fc.fromBufferAttribute(e,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+hc.distanceTo(fc);t.setAttribute("lineDistance",new qt(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class K0 extends xi{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new ut(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const dc=new jt,ga=new Pr,ir=new Tn,sr=new k;class J0 extends Kt{constructor(t=new ye,e=new K0){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ir.copy(n.boundingSphere),ir.applyMatrix4(s),ir.radius+=r,t.ray.intersectsSphere(ir)===!1)return;dc.copy(s).invert(),ga.copy(t.ray).applyMatrix4(dc);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,h=n.attributes.position;if(c!==null){const d=Math.max(0,o.start),f=Math.min(c.count,o.start+o.count);for(let g=d,v=f;g<v;g++){const m=c.getX(g);sr.fromBufferAttribute(h,m),pc(sr,m,l,s,t,e,this)}}else{const d=Math.max(0,o.start),f=Math.min(h.count,o.start+o.count);for(let g=d,v=f;g<v;g++)sr.fromBufferAttribute(h,g),pc(sr,g,l,s,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function pc(i,t,e,n,s,r,o){const a=ga.distanceSqToPoint(i);if(a<e){const l=new k;ga.closestPointToPoint(i,l),l.applyMatrix4(n);const c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}class _u extends ke{constructor(t,e,n,s,r,o,a,l,c){super(t,e,n,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class An{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,s=this.getPoint(0),r=0;e.push(0);for(let o=1;o<=t;o++)n=this.getPoint(o/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const n=this.getLengths();let s=0;const r=n.length;let o;e?o=e:o=t*n[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=n[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===o)return s/(r-1);const u=n[s],d=n[s+1]-u,f=(o-u)/d;return(s+f)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);const o=this.getPoint(s),a=this.getPoint(r),l=e||(o.isVector2?new Et:new k);return l.copy(a).sub(o).normalize(),l}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){const n=new k,s=[],r=[],o=[],a=new k,l=new jt;for(let f=0;f<=t;f++){const g=f/t;s[f]=this.getTangentAt(g,new k)}r[0]=new k,o[0]=new k;let c=Number.MAX_VALUE;const u=Math.abs(s[0].x),h=Math.abs(s[0].y),d=Math.abs(s[0].z);u<=c&&(c=u,n.set(1,0,0)),h<=c&&(c=h,n.set(0,1,0)),d<=c&&n.set(0,0,1),a.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let f=1;f<=t;f++){if(r[f]=r[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(s[f-1],s[f]),a.length()>Number.EPSILON){a.normalize();const g=Math.acos(Pe(s[f-1].dot(s[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(a,g))}o[f].crossVectors(s[f],r[f])}if(e===!0){let f=Math.acos(Pe(r[0].dot(r[t]),-1,1));f/=t,s[0].dot(a.crossVectors(r[0],r[t]))>0&&(f=-f);for(let g=1;g<=t;g++)r[g].applyMatrix4(l.makeRotationAxis(s[g],f*g)),o[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class Ba extends An{constructor(t=0,e=0,n=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(t,e=new Et){const n=e,s=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);const a=this.aStartAngle+t*r;let l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){const u=Math.cos(this.aRotation),h=Math.sin(this.aRotation),d=l-this.aX,f=c-this.aY;l=d*u-f*h+this.aX,c=d*h+f*u+this.aY}return n.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class $0 extends Ba{constructor(t,e,n,s,r,o){super(t,e,n,n,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}}function Ga(){let i=0,t=0,e=0,n=0;function s(r,o,a,l){i=r,t=a,e=-3*r+3*o-2*a-l,n=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,u,h){let d=(o-r)/c-(a-r)/(c+u)+(a-o)/u,f=(a-o)/u-(l-o)/(u+h)+(l-a)/h;d*=u,f*=u,s(o,a,d,f)},calc:function(r){const o=r*r,a=o*r;return i+t*r+e*o+n*a}}}const rr=new k,go=new Ga,vo=new Ga,_o=new Ga;class xu extends An{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new k){const n=e,s=this.points,r=s.length,o=(r-(this.closed?0:1))*t;let a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,u;this.closed||a>0?c=s[(a-1)%r]:(rr.subVectors(s[0],s[1]).add(s[0]),c=rr);const h=s[a%r],d=s[(a+1)%r];if(this.closed||a+2<r?u=s[(a+2)%r]:(rr.subVectors(s[r-1],s[r-2]).add(s[r-1]),u=rr),this.curveType==="centripetal"||this.curveType==="chordal"){const f=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(h),f),v=Math.pow(h.distanceToSquared(d),f),m=Math.pow(d.distanceToSquared(u),f);v<1e-4&&(v=1),g<1e-4&&(g=v),m<1e-4&&(m=v),go.initNonuniformCatmullRom(c.x,h.x,d.x,u.x,g,v,m),vo.initNonuniformCatmullRom(c.y,h.y,d.y,u.y,g,v,m),_o.initNonuniformCatmullRom(c.z,h.z,d.z,u.z,g,v,m)}else this.curveType==="catmullrom"&&(go.initCatmullRom(c.x,h.x,d.x,u.x,this.tension),vo.initCatmullRom(c.y,h.y,d.y,u.y,this.tension),_o.initCatmullRom(c.z,h.z,d.z,u.z,this.tension));return n.set(go.calc(l),vo.calc(l),_o.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new k().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function mc(i,t,e,n,s){const r=(n-t)*.5,o=(s-e)*.5,a=i*i,l=i*a;return(2*e-2*n+r+o)*l+(-3*e+3*n-2*r-o)*a+r*i+e}function j0(i,t){const e=1-i;return e*e*t}function Q0(i,t){return 2*(1-i)*i*t}function tg(i,t){return i*i*t}function xs(i,t,e,n){return j0(i,t)+Q0(i,e)+tg(i,n)}function eg(i,t){const e=1-i;return e*e*e*t}function ng(i,t){const e=1-i;return 3*e*e*i*t}function ig(i,t){return 3*(1-i)*i*i*t}function sg(i,t){return i*i*i*t}function Ms(i,t,e,n,s){return eg(i,t)+ng(i,e)+ig(i,n)+sg(i,s)}class Mu extends An{constructor(t=new Et,e=new Et,n=new Et,s=new Et){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new Et){const n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Ms(t,s.x,r.x,o.x,a.x),Ms(t,s.y,r.y,o.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class rg extends An{constructor(t=new k,e=new k,n=new k,s=new k){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new k){const n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Ms(t,s.x,r.x,o.x,a.x),Ms(t,s.y,r.y,o.y,a.y),Ms(t,s.z,r.z,o.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class yu extends An{constructor(t=new Et,e=new Et){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new Et){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new Et){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class og extends An{constructor(t=new k,e=new k){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new k){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new k){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Su extends An{constructor(t=new Et,e=new Et,n=new Et){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new Et){const n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(xs(t,s.x,r.x,o.x),xs(t,s.y,r.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class wu extends An{constructor(t=new k,e=new k,n=new k){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new k){const n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(xs(t,s.x,r.x,o.x),xs(t,s.y,r.y,o.y),xs(t,s.z,r.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class bu extends An{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new Et){const n=e,s=this.points,r=(s.length-1)*t,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],u=s[o>s.length-2?s.length-1:o+1],h=s[o>s.length-3?s.length-1:o+2];return n.set(mc(a,l.x,c.x,u.x,h.x),mc(a,l.y,c.y,u.y,h.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new Et().fromArray(s))}return this}}var yr=Object.freeze({__proto__:null,ArcCurve:$0,CatmullRomCurve3:xu,CubicBezierCurve:Mu,CubicBezierCurve3:rg,EllipseCurve:Ba,LineCurve:yu,LineCurve3:og,QuadraticBezierCurve:Su,QuadraticBezierCurve3:wu,SplineCurve:bu});class ag extends An{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new yr[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),s=this.getCurveLengths();let r=0;for(;r<s.length;){if(s[r]>=n){const o=s[r]-n,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,e)}r++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,s=this.curves.length;n<s;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let s=0,r=this.curves;s<r.length;s++){const o=r[s],a=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,l=o.getPoints(a);for(let c=0;c<l.length;c++){const u=l[c];n&&n.equals(u)||(e.push(u),n=u)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(new yr[s.type]().fromJSON(s))}return this}}class va extends ag{constructor(t){super(),this.type="Path",this.currentPoint=new Et,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new yu(this.currentPoint.clone(),new Et(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,s){const r=new Su(this.currentPoint.clone(),new Et(t,e),new Et(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(t,e,n,s,r,o){const a=new Mu(this.currentPoint.clone(),new Et(t,e),new Et(n,s),new Et(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new bu(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,s,r,o){const a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+a,e+l,n,s,r,o),this}absarc(t,e,n,s,r,o){return this.absellipse(t,e,n,n,s,r,o),this}ellipse(t,e,n,s,r,o,a,l){const c=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(t+c,e+u,n,s,r,o,a,l),this}absellipse(t,e,n,s,r,o,a,l){const c=new Ba(t,e,n,s,r,o,a,l);if(this.curves.length>0){const h=c.getPoint(0);h.equals(this.currentPoint)||this.lineTo(h.x,h.y)}this.curves.push(c);const u=c.getPoint(1);return this.currentPoint.copy(u),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class Ss extends ye{constructor(t=[new Et(0,-.5),new Et(.5,0),new Et(0,.5)],e=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:s},e=Math.floor(e),s=Pe(s,0,Math.PI*2);const r=[],o=[],a=[],l=[],c=[],u=1/e,h=new k,d=new Et,f=new k,g=new k,v=new k;let m=0,p=0;for(let y=0;y<=t.length-1;y++)switch(y){case 0:m=t[y+1].x-t[y].x,p=t[y+1].y-t[y].y,f.x=p*1,f.y=-m,f.z=p*0,v.copy(f),f.normalize(),l.push(f.x,f.y,f.z);break;case t.length-1:l.push(v.x,v.y,v.z);break;default:m=t[y+1].x-t[y].x,p=t[y+1].y-t[y].y,f.x=p*1,f.y=-m,f.z=p*0,g.copy(f),f.x+=v.x,f.y+=v.y,f.z+=v.z,f.normalize(),l.push(f.x,f.y,f.z),v.copy(g)}for(let y=0;y<=e;y++){const M=n+y*u*s,x=Math.sin(M),Y=Math.cos(M);for(let R=0;R<=t.length-1;R++){h.x=t[R].x*x,h.y=t[R].y,h.z=t[R].x*Y,o.push(h.x,h.y,h.z),d.x=y/e,d.y=R/(t.length-1),a.push(d.x,d.y);const L=l[3*R+0]*x,D=l[3*R+1],E=l[3*R+0]*Y;c.push(L,D,E)}}for(let y=0;y<e;y++)for(let M=0;M<t.length-1;M++){const x=M+y*t.length,Y=x,R=x+t.length,L=x+t.length+1,D=x+1;r.push(Y,R,D),r.push(L,D,R)}this.setIndex(r),this.setAttribute("position",new qt(o,3)),this.setAttribute("uv",new qt(a,2)),this.setAttribute("normal",new qt(c,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ss(t.points,t.segments,t.phiStart,t.phiLength)}}class pn extends Ss{constructor(t=1,e=1,n=4,s=8){const r=new va;r.absarc(0,-e/2,t,Math.PI*1.5,0),r.absarc(0,e/2,t,0,Math.PI*.5),super(r.getPoints(n),s),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:n,radialSegments:s}}static fromJSON(t){return new pn(t.radius,t.length,t.capSegments,t.radialSegments)}}class Lr extends ye{constructor(t=1,e=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:s},e=Math.max(3,e);const r=[],o=[],a=[],l=[],c=new k,u=new Et;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let h=0,d=3;h<=e;h++,d+=3){const f=n+h/e*s;c.x=t*Math.cos(f),c.y=t*Math.sin(f),o.push(c.x,c.y,c.z),a.push(0,0,1),u.x=(o[d]/t+1)/2,u.y=(o[d+1]/t+1)/2,l.push(u.x,u.y)}for(let h=1;h<=e;h++)r.push(h,h+1,0);this.setIndex(r),this.setAttribute("position",new qt(o,3)),this.setAttribute("normal",new qt(a,3)),this.setAttribute("uv",new qt(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Lr(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class be extends ye{constructor(t=1,e=1,n=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};const c=this;s=Math.floor(s),r=Math.floor(r);const u=[],h=[],d=[],f=[];let g=0;const v=[],m=n/2;let p=0;y(),o===!1&&(t>0&&M(!0),e>0&&M(!1)),this.setIndex(u),this.setAttribute("position",new qt(h,3)),this.setAttribute("normal",new qt(d,3)),this.setAttribute("uv",new qt(f,2));function y(){const x=new k,Y=new k;let R=0;const L=(e-t)/n;for(let D=0;D<=r;D++){const E=[],_=D/r,I=_*(e-t)+t;for(let V=0;V<=s;V++){const W=V/s,T=W*l+a,U=Math.sin(T),z=Math.cos(T);Y.x=I*U,Y.y=-_*n+m,Y.z=I*z,h.push(Y.x,Y.y,Y.z),x.set(U,L,z).normalize(),d.push(x.x,x.y,x.z),f.push(W,1-_),E.push(g++)}v.push(E)}for(let D=0;D<s;D++)for(let E=0;E<r;E++){const _=v[E][D],I=v[E+1][D],V=v[E+1][D+1],W=v[E][D+1];(t>0||E!==0)&&(u.push(_,I,W),R+=3),(e>0||E!==r-1)&&(u.push(I,V,W),R+=3)}c.addGroup(p,R,0),p+=R}function M(x){const Y=g,R=new Et,L=new k;let D=0;const E=x===!0?t:e,_=x===!0?1:-1;for(let V=1;V<=s;V++)h.push(0,m*_,0),d.push(0,_,0),f.push(.5,.5),g++;const I=g;for(let V=0;V<=s;V++){const T=V/s*l+a,U=Math.cos(T),z=Math.sin(T);L.x=E*z,L.y=m*_,L.z=E*U,h.push(L.x,L.y,L.z),d.push(0,_,0),R.x=U*.5+.5,R.y=z*.5*_+.5,f.push(R.x,R.y),g++}for(let V=0;V<s;V++){const W=Y+V,T=I+V;x===!0?u.push(T,T+1,W):u.push(T+1,T,W),D+=3}c.addGroup(p,D,x===!0?1:2),p+=D}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new be(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Dr extends be{constructor(t=1,e=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,t,e,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(t){return new Dr(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Ur extends ye{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};const r=[],o=[];a(s),c(n),u(),this.setAttribute("position",new qt(r,3)),this.setAttribute("normal",new qt(r.slice(),3)),this.setAttribute("uv",new qt(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(y){const M=new k,x=new k,Y=new k;for(let R=0;R<e.length;R+=3)f(e[R+0],M),f(e[R+1],x),f(e[R+2],Y),l(M,x,Y,y)}function l(y,M,x,Y){const R=Y+1,L=[];for(let D=0;D<=R;D++){L[D]=[];const E=y.clone().lerp(x,D/R),_=M.clone().lerp(x,D/R),I=R-D;for(let V=0;V<=I;V++)V===0&&D===R?L[D][V]=E:L[D][V]=E.clone().lerp(_,V/I)}for(let D=0;D<R;D++)for(let E=0;E<2*(R-D)-1;E++){const _=Math.floor(E/2);E%2===0?(d(L[D][_+1]),d(L[D+1][_]),d(L[D][_])):(d(L[D][_+1]),d(L[D+1][_+1]),d(L[D+1][_]))}}function c(y){const M=new k;for(let x=0;x<r.length;x+=3)M.x=r[x+0],M.y=r[x+1],M.z=r[x+2],M.normalize().multiplyScalar(y),r[x+0]=M.x,r[x+1]=M.y,r[x+2]=M.z}function u(){const y=new k;for(let M=0;M<r.length;M+=3){y.x=r[M+0],y.y=r[M+1],y.z=r[M+2];const x=m(y)/2/Math.PI+.5,Y=p(y)/Math.PI+.5;o.push(x,1-Y)}g(),h()}function h(){for(let y=0;y<o.length;y+=6){const M=o[y+0],x=o[y+2],Y=o[y+4],R=Math.max(M,x,Y),L=Math.min(M,x,Y);R>.9&&L<.1&&(M<.2&&(o[y+0]+=1),x<.2&&(o[y+2]+=1),Y<.2&&(o[y+4]+=1))}}function d(y){r.push(y.x,y.y,y.z)}function f(y,M){const x=y*3;M.x=t[x+0],M.y=t[x+1],M.z=t[x+2]}function g(){const y=new k,M=new k,x=new k,Y=new k,R=new Et,L=new Et,D=new Et;for(let E=0,_=0;E<r.length;E+=9,_+=6){y.set(r[E+0],r[E+1],r[E+2]),M.set(r[E+3],r[E+4],r[E+5]),x.set(r[E+6],r[E+7],r[E+8]),R.set(o[_+0],o[_+1]),L.set(o[_+2],o[_+3]),D.set(o[_+4],o[_+5]),Y.copy(y).add(M).add(x).divideScalar(3);const I=m(Y);v(R,_+0,y,I),v(L,_+2,M,I),v(D,_+4,x,I)}}function v(y,M,x,Y){Y<0&&y.x===1&&(o[M]=y.x-1),x.x===0&&x.z===0&&(o[M]=Y/2/Math.PI+.5)}function m(y){return Math.atan2(y.z,-y.x)}function p(y){return Math.atan2(-y.y,Math.sqrt(y.x*y.x+y.z*y.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ur(t.vertices,t.indices,t.radius,t.details)}}class Ha extends va{constructor(t){super(t),this.uuid=_i(),this.type="Shape",this.holes=[]}getPointsHoles(t){const e=[];for(let n=0,s=this.holes.length;n<s;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){const s=this.holes[e];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(new va().fromJSON(s))}return this}}const lg={triangulate:function(i,t,e=2){const n=t&&t.length,s=n?t[0]*e:i.length;let r=Eu(i,0,s,e,!0);const o=[];if(!r||r.next===r.prev)return o;let a,l,c,u,h,d,f;if(n&&(r=dg(i,t,r,e)),i.length>80*e){a=c=i[0],l=u=i[1];for(let g=e;g<s;g+=e)h=i[g],d=i[g+1],h<a&&(a=h),d<l&&(l=d),h>c&&(c=h),d>u&&(u=d);f=Math.max(c-a,u-l),f=f!==0?32767/f:0}return ws(r,o,e,a,l,f,0),o}};function Eu(i,t,e,n,s){let r,o;if(s===bg(i,t,e,n)>0)for(r=t;r<e;r+=n)o=gc(r,i[r],i[r+1],o);else for(r=e-n;r>=t;r-=n)o=gc(r,i[r],i[r+1],o);return o&&Nr(o,o.next)&&(Es(o),o=o.next),o}function vi(i,t){if(!i)return i;t||(t=i);let e=i,n;do if(n=!1,!e.steiner&&(Nr(e,e.next)||Me(e.prev,e,e.next)===0)){if(Es(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function ws(i,t,e,n,s,r,o){if(!i)return;!o&&r&&_g(i,n,s,r);let a=i,l,c;for(;i.prev!==i.next;){if(l=i.prev,c=i.next,r?ug(i,n,s,r):cg(i)){t.push(l.i/e|0),t.push(i.i/e|0),t.push(c.i/e|0),Es(i),i=c.next,a=c.next;continue}if(i=c,i===a){o?o===1?(i=hg(vi(i),t,e),ws(i,t,e,n,s,r,2)):o===2&&fg(i,t,e,n,s,r):ws(vi(i),t,e,n,s,r,1);break}}}function cg(i){const t=i.prev,e=i,n=i.next;if(Me(t,e,n)>=0)return!1;const s=t.x,r=e.x,o=n.x,a=t.y,l=e.y,c=n.y,u=s<r?s<o?s:o:r<o?r:o,h=a<l?a<c?a:c:l<c?l:c,d=s>r?s>o?s:o:r>o?r:o,f=a>l?a>c?a:c:l>c?l:c;let g=n.next;for(;g!==t;){if(g.x>=u&&g.x<=d&&g.y>=h&&g.y<=f&&Hi(s,a,r,l,o,c,g.x,g.y)&&Me(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function ug(i,t,e,n){const s=i.prev,r=i,o=i.next;if(Me(s,r,o)>=0)return!1;const a=s.x,l=r.x,c=o.x,u=s.y,h=r.y,d=o.y,f=a<l?a<c?a:c:l<c?l:c,g=u<h?u<d?u:d:h<d?h:d,v=a>l?a>c?a:c:l>c?l:c,m=u>h?u>d?u:d:h>d?h:d,p=_a(f,g,t,e,n),y=_a(v,m,t,e,n);let M=i.prevZ,x=i.nextZ;for(;M&&M.z>=p&&x&&x.z<=y;){if(M.x>=f&&M.x<=v&&M.y>=g&&M.y<=m&&M!==s&&M!==o&&Hi(a,u,l,h,c,d,M.x,M.y)&&Me(M.prev,M,M.next)>=0||(M=M.prevZ,x.x>=f&&x.x<=v&&x.y>=g&&x.y<=m&&x!==s&&x!==o&&Hi(a,u,l,h,c,d,x.x,x.y)&&Me(x.prev,x,x.next)>=0))return!1;x=x.nextZ}for(;M&&M.z>=p;){if(M.x>=f&&M.x<=v&&M.y>=g&&M.y<=m&&M!==s&&M!==o&&Hi(a,u,l,h,c,d,M.x,M.y)&&Me(M.prev,M,M.next)>=0)return!1;M=M.prevZ}for(;x&&x.z<=y;){if(x.x>=f&&x.x<=v&&x.y>=g&&x.y<=m&&x!==s&&x!==o&&Hi(a,u,l,h,c,d,x.x,x.y)&&Me(x.prev,x,x.next)>=0)return!1;x=x.nextZ}return!0}function hg(i,t,e){let n=i;do{const s=n.prev,r=n.next.next;!Nr(s,r)&&Tu(s,n,n.next,r)&&bs(s,r)&&bs(r,s)&&(t.push(s.i/e|0),t.push(n.i/e|0),t.push(r.i/e|0),Es(n),Es(n.next),n=i=r),n=n.next}while(n!==i);return vi(n)}function fg(i,t,e,n,s,r){let o=i;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&yg(o,a)){let l=Au(o,a);o=vi(o,o.next),l=vi(l,l.next),ws(o,t,e,n,s,r,0),ws(l,t,e,n,s,r,0);return}a=a.next}o=o.next}while(o!==i)}function dg(i,t,e,n){const s=[];let r,o,a,l,c;for(r=0,o=t.length;r<o;r++)a=t[r]*n,l=r<o-1?t[r+1]*n:i.length,c=Eu(i,a,l,n,!1),c===c.next&&(c.steiner=!0),s.push(Mg(c));for(s.sort(pg),r=0;r<s.length;r++)e=mg(s[r],e);return e}function pg(i,t){return i.x-t.x}function mg(i,t){const e=gg(i,t);if(!e)return t;const n=Au(e,i);return vi(n,n.next),vi(e,e.next)}function gg(i,t){let e=t,n=-1/0,s;const r=i.x,o=i.y;do{if(o<=e.y&&o>=e.next.y&&e.next.y!==e.y){const d=e.x+(o-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(d<=r&&d>n&&(n=d,s=e.x<e.next.x?e:e.next,d===r))return s}e=e.next}while(e!==t);if(!s)return null;const a=s,l=s.x,c=s.y;let u=1/0,h;e=s;do r>=e.x&&e.x>=l&&r!==e.x&&Hi(o<c?r:n,o,l,c,o<c?n:r,o,e.x,e.y)&&(h=Math.abs(o-e.y)/(r-e.x),bs(e,i)&&(h<u||h===u&&(e.x>s.x||e.x===s.x&&vg(s,e)))&&(s=e,u=h)),e=e.next;while(e!==a);return s}function vg(i,t){return Me(i.prev,i,t.prev)<0&&Me(t.next,i,i.next)<0}function _g(i,t,e,n){let s=i;do s.z===0&&(s.z=_a(s.x,s.y,t,e,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,xg(s)}function xg(i){let t,e,n,s,r,o,a,l,c=1;do{for(e=i,i=null,r=null,o=0;e;){for(o++,n=e,a=0,t=0;t<c&&(a++,n=n.nextZ,!!n);t++);for(l=c;a>0||l>0&&n;)a!==0&&(l===0||!n||e.z<=n.z)?(s=e,e=e.nextZ,a--):(s=n,n=n.nextZ,l--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;e=n}r.nextZ=null,c*=2}while(o>1);return i}function _a(i,t,e,n,s){return i=(i-e)*s|0,t=(t-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,i|t<<1}function Mg(i){let t=i,e=i;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==i);return e}function Hi(i,t,e,n,s,r,o,a){return(s-o)*(t-a)>=(i-o)*(r-a)&&(i-o)*(n-a)>=(e-o)*(t-a)&&(e-o)*(r-a)>=(s-o)*(n-a)}function yg(i,t){return i.next.i!==t.i&&i.prev.i!==t.i&&!Sg(i,t)&&(bs(i,t)&&bs(t,i)&&wg(i,t)&&(Me(i.prev,i,t.prev)||Me(i,t.prev,t))||Nr(i,t)&&Me(i.prev,i,i.next)>0&&Me(t.prev,t,t.next)>0)}function Me(i,t,e){return(t.y-i.y)*(e.x-t.x)-(t.x-i.x)*(e.y-t.y)}function Nr(i,t){return i.x===t.x&&i.y===t.y}function Tu(i,t,e,n){const s=ar(Me(i,t,e)),r=ar(Me(i,t,n)),o=ar(Me(e,n,i)),a=ar(Me(e,n,t));return!!(s!==r&&o!==a||s===0&&or(i,e,t)||r===0&&or(i,n,t)||o===0&&or(e,i,n)||a===0&&or(e,t,n))}function or(i,t,e){return t.x<=Math.max(i.x,e.x)&&t.x>=Math.min(i.x,e.x)&&t.y<=Math.max(i.y,e.y)&&t.y>=Math.min(i.y,e.y)}function ar(i){return i>0?1:i<0?-1:0}function Sg(i,t){let e=i;do{if(e.i!==i.i&&e.next.i!==i.i&&e.i!==t.i&&e.next.i!==t.i&&Tu(e,e.next,i,t))return!0;e=e.next}while(e!==i);return!1}function bs(i,t){return Me(i.prev,i,i.next)<0?Me(i,t,i.next)>=0&&Me(i,i.prev,t)>=0:Me(i,t,i.prev)<0||Me(i,i.next,t)<0}function wg(i,t){let e=i,n=!1;const s=(i.x+t.x)/2,r=(i.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&s<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==i);return n}function Au(i,t){const e=new xa(i.i,i.x,i.y),n=new xa(t.i,t.x,t.y),s=i.next,r=t.prev;return i.next=t,t.prev=i,e.next=s,s.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function gc(i,t,e,n){const s=new xa(i,t,e);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function Es(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function xa(i,t,e){this.i=i,this.x=t,this.y=e,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function bg(i,t,e,n){let s=0;for(let r=t,o=e-n;r<e;r+=n)s+=(i[o]-i[r])*(i[r+1]+i[o+1]),o=r;return s}class Jn{static area(t){const e=t.length;let n=0;for(let s=e-1,r=0;r<e;s=r++)n+=t[s].x*t[r].y-t[r].x*t[s].y;return n*.5}static isClockWise(t){return Jn.area(t)<0}static triangulateShape(t,e){const n=[],s=[],r=[];vc(t),_c(n,t);let o=t.length;e.forEach(vc);for(let l=0;l<e.length;l++)s.push(o),o+=e[l].length,_c(n,e[l]);const a=lg.triangulate(n,s);for(let l=0;l<a.length;l+=3)r.push(a.slice(l,l+3));return r}}function vc(i){const t=i.length;t>2&&i[t-1].equals(i[0])&&i.pop()}function _c(i,t){for(let e=0;e<t.length;e++)i.push(t[e].x),i.push(t[e].y)}class Va extends ye{constructor(t=new Ha([new Et(.5,.5),new Et(-.5,.5),new Et(-.5,-.5),new Et(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];const n=this,s=[],r=[];for(let a=0,l=t.length;a<l;a++){const c=t[a];o(c)}this.setAttribute("position",new qt(s,3)),this.setAttribute("uv",new qt(r,2)),this.computeVertexNormals();function o(a){const l=[],c=e.curveSegments!==void 0?e.curveSegments:12,u=e.steps!==void 0?e.steps:1,h=e.depth!==void 0?e.depth:1;let d=e.bevelEnabled!==void 0?e.bevelEnabled:!0,f=e.bevelThickness!==void 0?e.bevelThickness:.2,g=e.bevelSize!==void 0?e.bevelSize:f-.1,v=e.bevelOffset!==void 0?e.bevelOffset:0,m=e.bevelSegments!==void 0?e.bevelSegments:3;const p=e.extrudePath,y=e.UVGenerator!==void 0?e.UVGenerator:Eg;let M,x=!1,Y,R,L,D;p&&(M=p.getSpacedPoints(u),x=!0,d=!1,Y=p.computeFrenetFrames(u,!1),R=new k,L=new k,D=new k),d||(m=0,f=0,g=0,v=0);const E=a.extractPoints(c);let _=E.shape;const I=E.holes;if(!Jn.isClockWise(_)){_=_.reverse();for(let xt=0,Tt=I.length;xt<Tt;xt++){const N=I[xt];Jn.isClockWise(N)&&(I[xt]=N.reverse())}}const W=Jn.triangulateShape(_,I),T=_;for(let xt=0,Tt=I.length;xt<Tt;xt++){const N=I[xt];_=_.concat(N)}function U(xt,Tt,N){return Tt||console.error("THREE.ExtrudeGeometry: vec does not exist"),xt.clone().addScaledVector(Tt,N)}const z=_.length,b=W.length;function P(xt,Tt,N){let S,G,H;const F=xt.x-Tt.x,lt=xt.y-Tt.y,ot=N.x-xt.x,A=N.y-xt.y,w=F*F+lt*lt,rt=F*A-lt*ot;if(Math.abs(rt)>Number.EPSILON){const yt=Math.sqrt(w),J=Math.sqrt(ot*ot+A*A),et=Tt.x-lt/yt,bt=Tt.y+F/yt,dt=N.x-A/J,Mt=N.y+ot/J,Pt=((dt-et)*A-(Mt-bt)*ot)/(F*A-lt*ot);S=et+F*Pt-xt.x,G=bt+lt*Pt-xt.y;const gt=S*S+G*G;if(gt<=2)return new Et(S,G);H=Math.sqrt(gt/2)}else{let yt=!1;F>Number.EPSILON?ot>Number.EPSILON&&(yt=!0):F<-Number.EPSILON?ot<-Number.EPSILON&&(yt=!0):Math.sign(lt)===Math.sign(A)&&(yt=!0),yt?(S=-lt,G=F,H=Math.sqrt(w)):(S=F,G=lt,H=Math.sqrt(w/2))}return new Et(S/H,G/H)}const Z=[];for(let xt=0,Tt=T.length,N=Tt-1,S=xt+1;xt<Tt;xt++,N++,S++)N===Tt&&(N=0),S===Tt&&(S=0),Z[xt]=P(T[xt],T[N],T[S]);const tt=[];let j,mt=Z.concat();for(let xt=0,Tt=I.length;xt<Tt;xt++){const N=I[xt];j=[];for(let S=0,G=N.length,H=G-1,F=S+1;S<G;S++,H++,F++)H===G&&(H=0),F===G&&(F=0),j[S]=P(N[S],N[H],N[F]);tt.push(j),mt=mt.concat(j)}for(let xt=0;xt<m;xt++){const Tt=xt/m,N=f*Math.cos(Tt*Math.PI/2),S=g*Math.sin(Tt*Math.PI/2)+v;for(let G=0,H=T.length;G<H;G++){const F=U(T[G],Z[G],S);$(F.x,F.y,-N)}for(let G=0,H=I.length;G<H;G++){const F=I[G];j=tt[G];for(let lt=0,ot=F.length;lt<ot;lt++){const A=U(F[lt],j[lt],S);$(A.x,A.y,-N)}}}const q=g+v;for(let xt=0;xt<z;xt++){const Tt=d?U(_[xt],mt[xt],q):_[xt];x?(L.copy(Y.normals[0]).multiplyScalar(Tt.x),R.copy(Y.binormals[0]).multiplyScalar(Tt.y),D.copy(M[0]).add(L).add(R),$(D.x,D.y,D.z)):$(Tt.x,Tt.y,0)}for(let xt=1;xt<=u;xt++)for(let Tt=0;Tt<z;Tt++){const N=d?U(_[Tt],mt[Tt],q):_[Tt];x?(L.copy(Y.normals[xt]).multiplyScalar(N.x),R.copy(Y.binormals[xt]).multiplyScalar(N.y),D.copy(M[xt]).add(L).add(R),$(D.x,D.y,D.z)):$(N.x,N.y,h/u*xt)}for(let xt=m-1;xt>=0;xt--){const Tt=xt/m,N=f*Math.cos(Tt*Math.PI/2),S=g*Math.sin(Tt*Math.PI/2)+v;for(let G=0,H=T.length;G<H;G++){const F=U(T[G],Z[G],S);$(F.x,F.y,h+N)}for(let G=0,H=I.length;G<H;G++){const F=I[G];j=tt[G];for(let lt=0,ot=F.length;lt<ot;lt++){const A=U(F[lt],j[lt],S);x?$(A.x,A.y+M[u-1].y,M[u-1].x+N):$(A.x,A.y,h+N)}}}K(),B();function K(){const xt=s.length/3;if(d){let Tt=0,N=z*Tt;for(let S=0;S<b;S++){const G=W[S];ft(G[2]+N,G[1]+N,G[0]+N)}Tt=u+m*2,N=z*Tt;for(let S=0;S<b;S++){const G=W[S];ft(G[0]+N,G[1]+N,G[2]+N)}}else{for(let Tt=0;Tt<b;Tt++){const N=W[Tt];ft(N[2],N[1],N[0])}for(let Tt=0;Tt<b;Tt++){const N=W[Tt];ft(N[0]+z*u,N[1]+z*u,N[2]+z*u)}}n.addGroup(xt,s.length/3-xt,0)}function B(){const xt=s.length/3;let Tt=0;at(T,Tt),Tt+=T.length;for(let N=0,S=I.length;N<S;N++){const G=I[N];at(G,Tt),Tt+=G.length}n.addGroup(xt,s.length/3-xt,1)}function at(xt,Tt){let N=xt.length;for(;--N>=0;){const S=N;let G=N-1;G<0&&(G=xt.length-1);for(let H=0,F=u+m*2;H<F;H++){const lt=z*H,ot=z*(H+1),A=Tt+S+lt,w=Tt+G+lt,rt=Tt+G+ot,yt=Tt+S+ot;At(A,w,rt,yt)}}}function $(xt,Tt,N){l.push(xt),l.push(Tt),l.push(N)}function ft(xt,Tt,N){It(xt),It(Tt),It(N);const S=s.length/3,G=y.generateTopUV(n,s,S-3,S-2,S-1);Gt(G[0]),Gt(G[1]),Gt(G[2])}function At(xt,Tt,N,S){It(xt),It(Tt),It(S),It(Tt),It(N),It(S);const G=s.length/3,H=y.generateSideWallUV(n,s,G-6,G-3,G-2,G-1);Gt(H[0]),Gt(H[1]),Gt(H[3]),Gt(H[1]),Gt(H[2]),Gt(H[3])}function It(xt){s.push(l[xt*3+0]),s.push(l[xt*3+1]),s.push(l[xt*3+2])}function Gt(xt){r.push(xt.x),r.push(xt.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return Tg(e,n,t)}static fromJSON(t,e){const n=[];for(let r=0,o=t.shapes.length;r<o;r++){const a=e[t.shapes[r]];n.push(a)}const s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new yr[s.type]().fromJSON(s)),new Va(n,t.options)}}const Eg={generateTopUV:function(i,t,e,n,s){const r=t[e*3],o=t[e*3+1],a=t[n*3],l=t[n*3+1],c=t[s*3],u=t[s*3+1];return[new Et(r,o),new Et(a,l),new Et(c,u)]},generateSideWallUV:function(i,t,e,n,s,r){const o=t[e*3],a=t[e*3+1],l=t[e*3+2],c=t[n*3],u=t[n*3+1],h=t[n*3+2],d=t[s*3],f=t[s*3+1],g=t[s*3+2],v=t[r*3],m=t[r*3+1],p=t[r*3+2];return Math.abs(a-u)<Math.abs(o-c)?[new Et(o,1-l),new Et(c,1-h),new Et(d,1-g),new Et(v,1-p)]:[new Et(a,1-l),new Et(u,1-h),new Et(f,1-g),new Et(m,1-p)]}};function Tg(i,t,e){if(e.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){const r=i[n];e.shapes.push(r.uuid)}else e.shapes.push(i.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}class wn extends Ur{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new wn(t.radius,t.detail)}}class Wa extends Ur{constructor(t=1,e=0){const n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Wa(t.radius,t.detail)}}class pi extends ye{constructor(t=.5,e=1,n=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:s,thetaStart:r,thetaLength:o},n=Math.max(3,n),s=Math.max(1,s);const a=[],l=[],c=[],u=[];let h=t;const d=(e-t)/s,f=new k,g=new Et;for(let v=0;v<=s;v++){for(let m=0;m<=n;m++){const p=r+m/n*o;f.x=h*Math.cos(p),f.y=h*Math.sin(p),l.push(f.x,f.y,f.z),c.push(0,0,1),g.x=(f.x/e+1)/2,g.y=(f.y/e+1)/2,u.push(g.x,g.y)}h+=d}for(let v=0;v<s;v++){const m=v*(n+1);for(let p=0;p<n;p++){const y=p+m,M=y,x=y+n+1,Y=y+n+2,R=y+1;a.push(M,x,R),a.push(x,Y,R)}}this.setIndex(a),this.setAttribute("position",new qt(l,3)),this.setAttribute("normal",new qt(c,3)),this.setAttribute("uv",new qt(u,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new pi(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class Xa extends ye{constructor(t=new Ha([new Et(0,.5),new Et(-.5,-.5),new Et(.5,-.5)]),e=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:e};const n=[],s=[],r=[],o=[];let a=0,l=0;if(Array.isArray(t)===!1)c(t);else for(let u=0;u<t.length;u++)c(t[u]),this.addGroup(a,l,u),a+=l,l=0;this.setIndex(n),this.setAttribute("position",new qt(s,3)),this.setAttribute("normal",new qt(r,3)),this.setAttribute("uv",new qt(o,2));function c(u){const h=s.length/3,d=u.extractPoints(e);let f=d.shape;const g=d.holes;Jn.isClockWise(f)===!1&&(f=f.reverse());for(let m=0,p=g.length;m<p;m++){const y=g[m];Jn.isClockWise(y)===!0&&(g[m]=y.reverse())}const v=Jn.triangulateShape(f,g);for(let m=0,p=g.length;m<p;m++){const y=g[m];f=f.concat(y)}for(let m=0,p=f.length;m<p;m++){const y=f[m];s.push(y.x,y.y,0),r.push(0,0,1),o.push(y.x,y.y)}for(let m=0,p=v.length;m<p;m++){const y=v[m],M=y[0]+h,x=y[1]+h,Y=y[2]+h;n.push(M,x,Y),l+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes;return Ag(e,t)}static fromJSON(t,e){const n=[];for(let s=0,r=t.shapes.length;s<r;s++){const o=e[t.shapes[s]];n.push(o)}return new Xa(n,t.curveSegments)}}function Ag(i,t){if(t.shapes=[],Array.isArray(i))for(let e=0,n=i.length;e<n;e++){const s=i[e];t.shapes.push(s.uuid)}else t.shapes.push(i.uuid);return t}class De extends ye{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(o+a,Math.PI);let c=0;const u=[],h=new k,d=new k,f=[],g=[],v=[],m=[];for(let p=0;p<=n;p++){const y=[],M=p/n;let x=0;p===0&&o===0?x=.5/e:p===n&&l===Math.PI&&(x=-.5/e);for(let Y=0;Y<=e;Y++){const R=Y/e;h.x=-t*Math.cos(s+R*r)*Math.sin(o+M*a),h.y=t*Math.cos(o+M*a),h.z=t*Math.sin(s+R*r)*Math.sin(o+M*a),g.push(h.x,h.y,h.z),d.copy(h).normalize(),v.push(d.x,d.y,d.z),m.push(R+x,1-M),y.push(c++)}u.push(y)}for(let p=0;p<n;p++)for(let y=0;y<e;y++){const M=u[p][y+1],x=u[p][y],Y=u[p+1][y],R=u[p+1][y+1];(p!==0||o>0)&&f.push(M,x,R),(p!==n-1||l<Math.PI)&&f.push(x,Y,R)}this.setIndex(f),this.setAttribute("position",new qt(g,3)),this.setAttribute("normal",new qt(v,3)),this.setAttribute("uv",new qt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new De(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class Ze extends ye{constructor(t=1,e=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);const o=[],a=[],l=[],c=[],u=new k,h=new k,d=new k;for(let f=0;f<=n;f++)for(let g=0;g<=s;g++){const v=g/s*r,m=f/n*Math.PI*2;h.x=(t+e*Math.cos(m))*Math.cos(v),h.y=(t+e*Math.cos(m))*Math.sin(v),h.z=e*Math.sin(m),a.push(h.x,h.y,h.z),u.x=t*Math.cos(v),u.y=t*Math.sin(v),d.subVectors(h,u).normalize(),l.push(d.x,d.y,d.z),c.push(g/s),c.push(f/n)}for(let f=1;f<=n;f++)for(let g=1;g<=s;g++){const v=(s+1)*f+g-1,m=(s+1)*(f-1)+g-1,p=(s+1)*(f-1)+g,y=(s+1)*f+g;o.push(v,m,y),o.push(m,p,y)}this.setIndex(o),this.setAttribute("position",new qt(a,3)),this.setAttribute("normal",new qt(l,3)),this.setAttribute("uv",new qt(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ze(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class Ya extends ye{constructor(t=new wu(new k(-1,-1,0),new k(-1,1,0),new k(1,1,0)),e=64,n=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:n,radialSegments:s,closed:r};const o=t.computeFrenetFrames(e,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;const a=new k,l=new k,c=new Et;let u=new k;const h=[],d=[],f=[],g=[];v(),this.setIndex(g),this.setAttribute("position",new qt(h,3)),this.setAttribute("normal",new qt(d,3)),this.setAttribute("uv",new qt(f,2));function v(){for(let M=0;M<e;M++)m(M);m(r===!1?e:0),y(),p()}function m(M){u=t.getPointAt(M/e,u);const x=o.normals[M],Y=o.binormals[M];for(let R=0;R<=s;R++){const L=R/s*Math.PI*2,D=Math.sin(L),E=-Math.cos(L);l.x=E*x.x+D*Y.x,l.y=E*x.y+D*Y.y,l.z=E*x.z+D*Y.z,l.normalize(),d.push(l.x,l.y,l.z),a.x=u.x+n*l.x,a.y=u.y+n*l.y,a.z=u.z+n*l.z,h.push(a.x,a.y,a.z)}}function p(){for(let M=1;M<=e;M++)for(let x=1;x<=s;x++){const Y=(s+1)*(M-1)+(x-1),R=(s+1)*M+(x-1),L=(s+1)*M+x,D=(s+1)*(M-1)+x;g.push(Y,R,D),g.push(R,L,D)}}function y(){for(let M=0;M<=e;M++)for(let x=0;x<=s;x++)c.x=M/e,c.y=x/s,f.push(c.x,c.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new Ya(new yr[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}}class se extends xi{static get type(){return"MeshStandardMaterial"}constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new ut(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ut(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Qc,this.normalScale=new Et(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new En,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Cg extends se{static get type(){return"MeshPhysicalMaterial"}constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new Et(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Pe(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new ut(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new ut(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new ut(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}}class qa extends Kt{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new ut(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class Rg extends qa{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Kt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ut(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const xo=new jt,xc=new k,Mc=new k;class Cu{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Et(512,512),this.map=null,this.mapPass=null,this.matrix=new jt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Da,this._frameExtents=new Et(1,1),this._viewportCount=1,this._viewports=[new ce(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;xc.setFromMatrixPosition(t.matrixWorld),e.position.copy(xc),Mc.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Mc),e.updateMatrixWorld(),xo.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(xo),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(xo)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const yc=new jt,ps=new k,Mo=new k;class Pg extends Cu{constructor(){super(new Qe(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Et(4,2),this._viewportCount=6,this._viewports=[new ce(2,1,1,1),new ce(0,1,1,1),new ce(3,1,1,1),new ce(1,1,1,1),new ce(3,0,1,1),new ce(1,0,1,1)],this._cubeDirections=[new k(1,0,0),new k(-1,0,0),new k(0,0,1),new k(0,0,-1),new k(0,1,0),new k(0,-1,0)],this._cubeUps=[new k(0,1,0),new k(0,1,0),new k(0,1,0),new k(0,1,0),new k(0,0,1),new k(0,0,-1)]}updateMatrices(t,e=0){const n=this.camera,s=this.matrix,r=t.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),ps.setFromMatrixPosition(t.matrixWorld),n.position.copy(ps),Mo.copy(n.position),Mo.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(Mo),n.updateMatrixWorld(),s.makeTranslation(-ps.x,-ps.y,-ps.z),yc.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(yc)}}class Ma extends qa{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new Pg}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class Ig extends Cu{constructor(){super(new Ua(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Sc extends qa{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Kt.DEFAULT_UP),this.updateMatrix(),this.target=new Kt,this.shadow=new Ig}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class Lg{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=wc(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=wc();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function wc(){return performance.now()}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:ba}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=ba);function Mi(i){let t=i>>>0;return function(){t|=0,t=t+1831565813|0;let n=Math.imul(t^t>>>15,1|t);return n=n+Math.imul(n^n>>>7,61|n)^n,((n^n>>>14)>>>0)/4294967296}}function bc(i){return i*i*i*(i*(i*6-15)+10)}function yo(i,t,e){return i+(t-i)*e}function on(i){const t=Mi(i),e=256,n=e-1,s=new Float32Array(e*e);for(let r=0;r<s.length;r++)s[r]=t();return function(o,a){const l=Math.floor(o),c=Math.floor(a),u=bc(o-l),h=bc(a-c),d=l&n,f=l+1&n,g=(c&n)*e,v=(c+1&n)*e,m=s[g+d],p=s[g+f],y=s[v+d],M=s[v+f];return yo(yo(m,p,u),yo(y,M,u),h)}}function oe(i,t,e,n=4,s=.5){let r=0,o=1,a=0,l=t,c=e;for(let u=0;u<n;u++)r+=i(l,c)*o,a+=o,o*=s,l*=2,c*=2;return r/a}function Ts(i,t,e,n=4){let s=0,r=1,o=0,a=t,l=e;for(let c=0;c<n;c++){const u=1-Math.abs(i(a,l)*2-1);s+=u*u*r,o+=r,r*=.45,a*=2.07,l*=2.03}return s/o}function Ec(i,t){const e=Math.min(1,Math.max(0,i));return e<.5?.5*Math.pow(e*2,t):1-.5*Math.pow((1-e)*2,t)}function me(i,t,e){const n=Math.min(1,Math.max(0,(e-i)/(t-i)));return n*n*(3-2*n)}const Dg=`
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
`,Ug=`
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
`;function As({scene:i,budget:t,texture:e,blending:n,depthWrite:s,renderOrder:r}){const o=Math.max(1,Math.floor(t)),a=new Float32Array(o*3),l=new Float32Array(o),c=new Float32Array(o),u=new Float32Array(o),h=new Float32Array(o*3),d=new ye,f=new qt(a,3).setUsage(Le),g=new qt(l,1).setUsage(Le),v=new qt(c,1).setUsage(Le),m=new qt(u,1).setUsage(Le),p=new qt(h,3).setUsage(Le);d.setAttribute("position",f),d.setAttribute("aSize",g),d.setAttribute("aAlpha",v),d.setAttribute("aRot",m),d.setAttribute("aColor",p),d.setDrawRange(0,0);const y=new Ee({vertexShader:Dg,fragmentShader:Ug,transparent:!0,depthWrite:!1,blending:n,uniforms:{uMap:{value:e},uPixelScale:{value:520},uFogColor:{value:new ut(Ut.fog)},uFogAmount:{value:n===Xi?.2:1}}}),M=new J0(d,y);return M.frustumCulled=!1,M.renderOrder=r??3,i.add(M),{points:M,geo:d,mat:y,budget:o,count:0,vel:new Float32Array(o*3),life:new Float32Array(o),maxLife:new Float32Array(o),spin:new Float32Array(o),grow:new Float32Array(o),drag:new Float32Array(o),baseSize:new Float32Array(o),baseAlpha:new Float32Array(o),arrays:{pos:a,size:l,alpha:c,rot:u,color:h},attrs:{posAttr:f,sizeAttr:g,alphaAttr:v,rotAttr:m,colorAttr:p},dispose(){i.remove(M),d.dispose(),y.dispose()}}}function Za(i,t){const e=i.count-1;if(t!==e){const n=i.arrays;for(let s=0;s<3;s++)n.pos[t*3+s]=n.pos[e*3+s],n.color[t*3+s]=n.color[e*3+s],i.vel[t*3+s]=i.vel[e*3+s];n.size[t]=n.size[e],n.alpha[t]=n.alpha[e],n.rot[t]=n.rot[e],i.life[t]=i.life[e],i.maxLife[t]=i.maxLife[e],i.spin[t]=i.spin[e],i.grow[t]=i.grow[e],i.drag[t]=i.drag[e],i.baseSize[t]=i.baseSize[e],i.baseAlpha[t]=i.baseAlpha[e]}i.count=e}function Sr(i,t,e,n,s,r=Math.random){if(i.count>=i.budget)return-1;const o=i.count++,a=i.arrays;return a.pos[o*3]=t,a.pos[o*3+1]=e,a.pos[o*3+2]=n,i.vel[o*3]=s.vx,i.vel[o*3+1]=s.vy,i.vel[o*3+2]=s.vz,i.life[o]=0,i.maxLife[o]=s.life,i.spin[o]=s.spin,i.grow[o]=s.grow,i.drag[o]=s.drag,i.baseSize[o]=s.size,i.baseAlpha[o]=s.alpha,a.size[o]=s.size,a.alpha[o]=s.alpha,a.rot[o]=s.rot??r()*Math.PI*2,a.color[o*3]=s.color.r,a.color[o*3+1]=s.color.g,a.color[o*3+2]=s.color.b,o}function Ka(i){i.geo.setDrawRange(0,i.count),i.count>0&&(i.attrs.posAttr.needsUpdate=!0,i.attrs.sizeAttr.needsUpdate=!0,i.attrs.alphaAttr.needsUpdate=!0,i.attrs.rotAttr.needsUpdate=!0,i.attrs.colorAttr.needsUpdate=!0),i.points.visible=i.count>0}const Ng=1,Xe=Math.PI*2,Un=Math.PI/2,Fg=Object.freeze({cotton:"fanwake",granite:"slab",gale:"gust",frost:"rime",spring:"recoil",afterimage:"phase",magnet:"flux",meteor:"cinder"}),Og=Object.freeze({quake_slam:"slab",wind_rush:"gust",frost_arc:"rime",coil_counter:"recoil",phantom_swap:"phase",iron_pull:"flux",sky_fall:"cinder"});function Ru(i){return Fg[i]??"fanwake"}function kg(i,t){return Og[i]??Ru(t)}const zg=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,Bg=`
  uniform sampler2D uNoise;
  uniform vec3 uColorLit;
  uniform vec3 uColorDark;
  uniform float uLife;
  uniform float uOpacity;
  uniform float uTear;
  uniform float uFlow;
  uniform float uInner;
  varying vec2 vUv;
  void main() {
    vec2 d = vUv - 0.5;
    float r = length(d) * 2.0;
    float ang = atan(d.y, d.x);
    // 内外沿都渐隐：中间那圈才是「被推开的空气」，边界不许有硬线
    float band = smoothstep(uInner, uInner + 0.24, r) * (1.0 - smoothstep(0.78, 1.0, r));
    float n = texture2D(uNoise, vec2(ang * 0.16 + uLife * uFlow, r * 0.9 - uLife * 0.3)).r;
    float n2 = texture2D(uNoise, vec2(ang * 0.42 - uLife * uFlow * 0.6, r * 2.3)).r;
    float turb = n * 0.65 + n2 * 0.35;
    float tear = smoothstep(uTear, uTear + 0.3, turb);
    float fade = (1.0 - uLife) * (1.0 - uLife);
    float a = band * tear * fade * uOpacity * (0.4 + turb * 1.0);
    if (a < 0.005) discard;
    vec3 col = mix(uColorDark, uColorLit, clamp(turb * 1.35 - uLife * 0.35, 0.0, 1.0));
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`,Gg=`
  uniform sampler2D uNoise;
  uniform vec3 uColorLit;
  uniform vec3 uColorDark;
  uniform float uLife;
  uniform float uOpacity;
  uniform float uTear;
  uniform float uFlow;
  uniform float uSweep;
  varying vec2 vUv;
  void main() {
    float across = smoothstep(0.0, 0.16, vUv.y) * (1.0 - smoothstep(0.84, 1.0, vUv.y));
    float n = texture2D(uNoise, vec2(vUv.x * 1.6 - uLife * uFlow, vUv.y * 1.2 + uLife * 0.2)).r;
    float n2 = texture2D(uNoise, vec2(vUv.x * 4.2 + uLife * 0.3, vUv.y * 2.6)).r;
    float turb = n * 0.62 + n2 * 0.38;
    float head = uLife * 1.35 - 0.15;
    float sweep = mix(1.0, smoothstep(head - 0.5, head, vUv.x) * (1.0 - smoothstep(head, head + 0.55, vUv.x)), uSweep);
    float tear = smoothstep(uTear, uTear + 0.3, turb);
    float fade = (1.0 - uLife) * (1.0 - uLife);
    float a = across * sweep * tear * fade * uOpacity * (0.4 + turb * 1.0);
    if (a < 0.005) discard;
    vec3 col = mix(uColorDark, uColorLit, clamp(turb * 1.3 - uLife * 0.3, 0.0, 1.0));
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;function So(i,t,e){return i<t?t:i>e?e:i}function Fe(i,t,e){return i.clone().lerp(t,e)}function Hg({scene:i,quality:t,textures:e,seed:n=90210}){const s=Mi(n+4409),r=t.name==="low",o=t.name==="mid",a=r?.4:o?.72:1,l=new ve;l.name="combat-vfx",i.add(l);const c=As({scene:l,budget:Math.max(64,Math.round(t.dustBudget*.4)),texture:(e==null?void 0:e.dust)??null,blending:He,depthWrite:!1,renderOrder:3}),u=As({scene:l,budget:Math.max(16,Math.round(t.emberBudget*.45)),texture:(e==null?void 0:e.ember)??null,blending:Xi,depthWrite:!1,renderOrder:4});t.bloom&&(u.points.layers.enable(Ng),u.points.userData.bloomSelf=!0);const h=new Float32Array(c.budget),d=new Float32Array(u.budget);function f(S,G,H,F){const lt=Sr(c,S,G,H,F,s);return lt>=0&&(h[lt]=F.gravity??-1.1),lt}function g(S,G,H,F){const lt=Sr(u,S,G,H,F,s);return lt>=0&&(d[lt]=F.gravity??-2.2),lt}function v(S,G,H,F){const lt=S.arrays;for(let ot=S.count-1;ot>=0;ot--){S.life[ot]+=H;const A=S.life[ot]/S.maxLife[ot];if(A>=1){const rt=S.count-1;ot!==rt&&(G[ot]=G[rt]),Za(S,ot);continue}const w=Math.exp(-S.drag[ot]*H);if(S.vel[ot*3]*=w,S.vel[ot*3+2]*=w,S.vel[ot*3+1]=S.vel[ot*3+1]*w+G[ot]*H,lt.pos[ot*3]+=S.vel[ot*3]*H,lt.pos[ot*3+1]+=S.vel[ot*3+1]*H,lt.pos[ot*3+2]+=S.vel[ot*3+2]*H,!F&&lt.pos[ot*3+1]<.04&&S.vel[ot*3+1]<0&&(lt.pos[ot*3+1]=.04,S.vel[ot*3+1]=0,S.vel[ot*3]*=.84,S.vel[ot*3+2]*=.84),lt.rot[ot]+=S.spin[ot]*H,lt.size[ot]=S.baseSize[ot]+S.grow[ot]*A,F){const rt=F(A);lt.color[ot*3]=rt.r,lt.color[ot*3+1]=rt.g,lt.color[ot*3+2]=rt.b,lt.alpha[ot]=S.baseAlpha[ot]*(1-A*A)}else{const rt=Math.min(1,A/.1);lt.alpha[ot]=S.baseAlpha[ot]*rt*(1-A)*(1-A*.35)}}Ka(S)}const m=r?14:o?30:52,p=new wn(.075,0),y=new se({color:16777215,roughness:.94,metalness:.05,flatShading:!0,envMapIntensity:.25,vertexColors:!1}),M=new rn(p,y,m);M.instanceMatrix.setUsage(Le),M.castShadow=t.shadows,M.frustumCulled=!1,M.count=0,l.add(M);const x=[],Y=new Kt,R=new ut;function L(S){if(x.length>=m)return null;const G={p:new k(S.x,S.y,S.z),v:new k(S.vx??0,S.vy??0,S.vz??0),target:S.target?S.target.clone():null,rot:new k(s()*Xe,s()*Xe,s()*Xe),spin:new k((s()-.5)*8,(s()-.5)*8,(s()-.5)*8),sx:S.sx??1,sy:S.sy??1,mode:S.mode??"scatter",life:0,maxLife:S.life??1.4,color:(S.color??R.set(Ut.rockBody)).clone()};return x.push(G),G}function D(S){if(x.length===0){M.count!==0&&(M.count=0,M.visible=!1);return}for(let H=x.length-1;H>=0;H--){const F=x[H];if(F.life+=S,F.life>=F.maxLife){x.splice(H,1);continue}if(F.mode==="converge"&&F.target){const lt=Math.min(1,S*7.5);F.p.lerp(F.target,lt),F.spin.multiplyScalar(1+S*2)}else F.mode==="rise"?(F.p.y+=F.v.y*S,F.v.y*=Math.exp(-6*S)):(F.v.y-=20*S,F.p.addScaledVector(F.v,S),F.p.y<.06&&(F.p.y=.06,F.v.y*=-.3,F.v.x*=.6,F.v.z*=.6,F.spin.multiplyScalar(.5)),F.rot.x+=F.spin.x*S,F.rot.y+=F.spin.y*S,F.rot.z+=F.spin.z*S)}const G=Math.min(x.length,m);for(let H=0;H<G;H++){const F=x[H],lt=F.life/F.maxLife,ot=1-Math.max(0,(lt-.62)/.38),A=F.mode==="rise"?Math.min(1,lt/.22):1;Y.position.copy(F.p),Y.rotation.set(F.rot.x,F.rot.y,F.rot.z),Y.scale.set(F.sx*ot,F.sy*ot*A,F.sx*ot),Y.updateMatrix(),M.setMatrixAt(H,Y.matrix),M.setColorAt(H,F.color)}M.count=G,M.visible=G>0,M.instanceMatrix.needsUpdate=!0,M.instanceColor&&(M.instanceColor.needsUpdate=!0)}const E={fanwake:new pi(.22,1,22,1,-1.15,2.3),gust:new pi(.34,1,30,1,-1,2),rime:new pi(.4,1,30,1,-1.65,3.3),phase:new pi(.55,1,18,1,-.85,1.7)},_={slab:new be(.9,.06,1.05,4,1,!0),recoil:new Ze(.72,.055,4,26),flux:new Ze(.92,.04,3,30,Math.PI*1.45),cinder:new Dr(.6,1.6,10,1,!0)},I=[...Object.values(E),...Object.values(_)],V=r?3:o?5:7,W=E.fanwake;function T(S){const G=new Ee({vertexShader:zg,fragmentShader:S,transparent:!0,depthWrite:!1,side:Ie,blending:He,uniforms:{uNoise:{value:(e==null?void 0:e.turbulence)??null},uColorLit:{value:new ut(Ut.rockTop)},uColorDark:{value:new ut(Ut.fog)},uLife:{value:0},uOpacity:{value:.6},uTear:{value:.24},uFlow:{value:.5},uInner:{value:.2},uSweep:{value:0}}}),H=new ve,F=new ve;F.rotation.order="YXZ";const lt=new Yt(W,G);return F.add(lt),H.add(F),H.visible=!1,H.renderOrder=2,l.add(H),{holder:H,orient:F,mesh:lt,mat:G,t:-1,dur:.3,spec:null,power:1,phase:0}}const U=Array.from({length:V},()=>{const S=T(Bg);return S.family="sheet",S}),z=Array.from({length:V},()=>{const S=T(Gg);return S.family="band",S}),b=new ut(Ut.grime).lerp(new ut(Ut.rockBody),.45),P=new ut(Ut.rockTop).lerp(new ut(Ut.keyLight),.25),Z=new ut(Ut.rockBody),tt=new ut(16773327),j=new ut(Ut.crackDeep),mt=S=>R.copy(tt).lerp(j,Math.min(1,S*1.5)),q=new ut;function K(S,G){return q.copy(b).lerp(P,.25+s()*.6).lerp(S,G)}function B(S,G){return Math.max(1,Math.round(S*a*So(G,.4,2)))}const at={fanwake:{family:"sheet",geo:"fanwake",dur:.44,shells:1,uniforms:{uTear:.16,uFlow:.35,uInner:.2,uOpacity:.44},color:S=>({lit:Fe(new ut(16773853),S,.3),dark:Fe(new ut(Ut.fog),S,.15)}),pose(S){S.orient.rotation.set(-Un+.34,Un,0)},animate(S,G,H){const F=1-Math.pow(1-G,2.2),lt=(.72+F*1.15)*H;S.mesh.scale.set(lt,lt,lt),S.holder.position.y=S.baseY+F*.24,S.orient.rotation.z=-.28+F*.5},burst(S){for(let G=0;G<B(7,S.power);G++){const H=(s()-.5)*1.9,F=Math.sin(H),lt=Math.cos(H),ot=S.dir.x*lt-S.dir.z*F,A=S.dir.x*F+S.dir.z*lt;f(S.at.x+ot*.5,S.at.y+(s()-.4)*.4,S.at.z+A*.5,{vx:ot*(1+s()),vy:.25+s()*.4,vz:A*(1+s()),life:1.5+s()*1.4,spin:(s()-.5)*.6,grow:.9+s()*.7,drag:1.6,size:.24+s()*.24,alpha:.18+s()*.14,gravity:.04,color:G%5===0?q.copy(S.tint):K(S.tint,.05)})}}},slab:{family:"band",geo:"slab",dur:.32,shells:1,uniforms:{uTear:.3,uFlow:.2,uSweep:0,uOpacity:.6},color:S=>({lit:Fe(new ut(Ut.rockFresh),S,.28),dark:Fe(new ut(Ut.rockDeep),S,.12)}),pose(S){S.orient.rotation.set(-Un,0,Math.PI*.25)},animate(S,G,H){const F=G<.4?Math.pow(G/.4,.55):1;S.mesh.position.y=F*.95*H;const lt=(.55+F*.75)*H;S.mesh.scale.set(lt,.9+F*.45,lt)},burst(S){for(let G=0;G<B(4,S.power);G++){const H=s()*Xe,F=(2+s()*3.4)*S.power;L({x:S.at.x+S.dir.x*.6,y:Math.max(.15,S.at.y-.3),z:S.at.z+S.dir.z*.6,vx:Math.cos(H)*F*.5+S.dir.x*F*.5,vy:2.5+s()*3.5,vz:Math.sin(H)*F*.5+S.dir.z*F*.5,sx:.7+s()*.8,sy:.7+s()*.8,life:1.1+s()*.8,color:q.copy(Z).lerp(S.tint,.14)})}for(let G=0;G<B(8,S.power);G++){const H=s()*Xe;f(S.at.x+S.dir.x*.7,.1+s()*.3,S.at.z+S.dir.z*.7,{vx:Math.cos(H)*2.6*S.power,vy:.5+s()*.7,vz:Math.sin(H)*2.6*S.power,life:1.1+s()*1.1,spin:(s()-.5)*1.6,grow:2+s()*1.6,drag:2.4,size:.3+s()*.4,alpha:.26+s()*.2,gravity:-.9,color:K(S.tint,.04)})}}},gust:{family:"sheet",geo:"gust",dur:.36,shells:2,uniforms:{uTear:.12,uFlow:1.5,uInner:.3,uOpacity:.62},color:S=>({lit:Fe(new ut(15135983),S,.34),dark:Fe(new ut(Ut.fog),S,.2)}),pose(S){S.orient.rotation.set(.34,0,-Un),S.baseY=Math.min(S.baseY,.72),S.holder.position.y=S.baseY},animate(S,G,H){const F=S.phase*.16,lt=So((G-F)/(1-F),0,1),ot=Math.pow(lt,.55);S.holder.position.x=S.baseX+S.dirX*ot*2.6*H,S.holder.position.z=S.baseZ+S.dirZ*ot*2.6*H,S.holder.position.y=S.baseY-ot*.12;const A=(1+ot*.42)*H;S.mesh.scale.set(A,(.95+ot*1.05)*H,1),S.orient.position.y=.56*A},burst(S){for(let G=0;G<B(6,S.power);G++){const H=s()<.5?-1:1,F=-S.dir.z*H*(.2+s()*.6),lt=S.dir.x*H*(.2+s()*.6);f(S.at.x+F,.12+s()*.5,S.at.z+lt,{vx:S.dir.x*(5+s()*4)+F,vy:.15+s()*.25,vz:S.dir.z*(5+s()*4)+lt,life:.42+s()*.3,spin:3,grow:.5,drag:2.2,size:.1+s()*.12,alpha:.3,gravity:-.2,color:G%6===0?q.copy(S.tint):K(S.tint,.06)})}}},rime:{family:"sheet",geo:"rime",dur:.62,shells:1,uniforms:{uTear:.14,uFlow:.22,uInner:.36,uOpacity:.4},color:S=>({lit:Fe(new ut(15398655),S,.38),dark:Fe(new ut(Ut.cloudShadow),S,.18)}),pose(S){S.orient.rotation.set(-Un,Un,0),S.baseY=.42,S.holder.position.y=S.baseY},animate(S,G,H){const lt=(.7+(1-Math.pow(1-G,3))*1.5)*H;S.mesh.scale.set(lt,lt,lt)},burst(S){for(let G=0;G<B(3,S.power);G++){const H=(s()-.5)*2.6,F=Math.sin(H),lt=Math.cos(H),ot=.9+s()*.9;L({x:S.at.x+(S.dir.x*lt-S.dir.z*F)*ot,y:.06,z:S.at.z+(S.dir.x*F+S.dir.z*lt)*ot,vy:1.6+s(),sx:.42+s()*.25,sy:2.1+s()*1.6,mode:"rise",life:1.5+s()*1.2,color:q.set(13625074).lerp(S.tint,.3)})}for(let G=0;G<B(6,S.power);G++){const H=s()*Xe;f(S.at.x+Math.cos(H)*.6,.3+s()*.5,S.at.z+Math.sin(H)*.6,{vx:Math.cos(H)*.8,vy:-.12,vz:Math.sin(H)*.8,life:1.8+s()*1.4,spin:(s()-.5)*.3,grow:1.1+s()*.8,drag:1.5,size:.26+s()*.3,alpha:.13+s()*.1,gravity:-.18,color:q.set(14478582).lerp(b,.4)})}}},recoil:{family:"band",geo:"recoil",dur:.4,shells:2,uniforms:{uTear:.22,uFlow:.8,uSweep:0,uOpacity:.5},color:S=>({lit:Fe(new ut(Ut.metalWarm),S,.34),dark:Fe(new ut(Ut.rockDeep),S,.1)}),pose(S){S.orient.rotation.set(-Un,0,0)},animate(S,G,H){const F=S.phase===0,lt=F?1-Math.pow(1-G,2.6):Math.pow(G,1.9),ot=(F?.4+lt*1.5:1.7-lt*1.35)*H;S.mesh.scale.set(ot,ot,1),S.mesh.rotation.z=G*(F?4.5:-6.5),S.holder.position.y=S.baseY+(F?lt*.1:-lt*.15)},burst(S){for(let G=0;G<B(7,S.power);G++){const H=s()*Xe;f(S.at.x+Math.cos(H)*.35,.08+s()*.2,S.at.z+Math.sin(H)*.35,{vx:Math.cos(H)*(2.8+s()*2),vy:1.1+s()*1.2,vz:Math.sin(H)*(2.8+s()*2),life:.8+s()*.7,spin:(s()-.5)*2,grow:1.2,drag:2.8,size:.16+s()*.18,alpha:.24,gravity:-1.4,color:K(S.tint,.05)})}if(!r)for(let G=0;G<B(2,S.power);G++){const H=s()*Xe;g(S.at.x,S.at.y,S.at.z,{vx:Math.cos(H)*2.4,vy:1.8+s()*2,vz:Math.sin(H)*2.4,life:.4+s()*.3,spin:0,grow:-.03,drag:.7,size:.05+s()*.04,alpha:.8,gravity:-3,color:tt})}}},phase:{family:"sheet",geo:"phase",dur:.5,shells:2,uniforms:{uTear:.1,uFlow:.12,uInner:.52,uOpacity:.28},color:S=>({lit:Fe(new ut(10133688),S,.42),dark:Fe(new ut(2564404),S,.16)}),pose(S){S.orient.rotation.set(0,0,Un)},animate(S,G,H){const F=S.phase===0?1:-1,lt=1-Math.pow(1-G,2);S.holder.position.x=S.baseX-S.dirZ*F*lt*1.15*H,S.holder.position.z=S.baseZ+S.dirX*F*lt*1.15*H;const ot=(1+lt*.25)*H;S.mesh.scale.set(ot,ot,ot)},burst(S){for(let G=0;G<B(3,S.power);G++){const H=s()*Xe;f(S.at.x+Math.cos(H)*.5,S.at.y+(s()-.5)*.6,S.at.z+Math.sin(H)*.5,{vx:Math.cos(H)*.5,vy:.1,vz:Math.sin(H)*.5,life:.9+s()*.6,spin:(s()-.5)*.8,grow:.5,drag:1.8,size:.14+s()*.12,alpha:.14,gravity:-.3,color:q.set(3814472).lerp(S.tint,.25)})}}},flux:{family:"band",geo:"flux",dur:.42,shells:2,uniforms:{uTear:.18,uFlow:1.8,uSweep:1,uOpacity:.5},color:S=>({lit:Fe(new ut(16766658),S,.42),dark:Fe(new ut(Ut.rockDeep),S,.14)}),pose(S){S.orient.rotation.set(-Un+(S.phase===0?.25:-.3),0,S.phase*1.3)},animate(S,G,H){const lt=(1.7-(1-Math.pow(1-G,2.2))*1.25)*H;S.mesh.scale.set(lt,lt,lt),S.mesh.rotation.z=G*3.4*(S.phase===0?1:-1)},burst(S){const G=new k(S.at.x,S.at.y,S.at.z);for(let H=0;H<B(5,S.power);H++){const F=s()*Xe,lt=1.4+s()*1.1;L({x:S.at.x+Math.cos(F)*lt,y:.1+s()*.8,z:S.at.z+Math.sin(F)*lt,target:G,mode:"converge",sx:.45+s()*.3,sy:.45+s()*.3,life:.5+s()*.3,color:q.copy(Z).lerp(S.tint,.4)})}for(let H=0;H<B(4,S.power);H++){const F=s()*Xe,lt=1.2+s()*.9,ot=Math.cos(F)*lt,A=Math.sin(F)*lt;f(S.at.x+ot,.15+s()*.6,S.at.z+A,{vx:-ot*2.4,vy:.4,vz:-A*2.4,life:.5+s()*.3,spin:3,grow:-.04,drag:.5,size:.08+s()*.07,alpha:.42,gravity:.2,color:K(S.tint,.18)})}}},cinder:{family:"band",geo:"cinder",dur:.46,shells:1,uniforms:{uTear:.24,uFlow:.9,uSweep:0,uOpacity:.55},color:S=>({lit:Fe(new ut(Ut.crackCore),S,.3),dark:Fe(new ut(Ut.grime),S,.12)}),pose(S){S.orient.rotation.set(0,0,0)},animate(S,G,H){const F=Math.min(1,G/.34),lt=1-Math.pow(1-F,2.6);S.holder.position.y=S.baseY+(1-lt)*2.4;const ot=G<.34?0:(G-.34)/.66;S.mesh.scale.set((.8+ot*1.5)*H,(1-ot*.72)*H,(.8+ot*1.5)*H)},burst(S){for(let G=0;G<B(4,S.power);G++){const H=s()*Xe;g(S.at.x+Math.cos(H)*.3,Math.max(.1,S.at.y-.4),S.at.z+Math.sin(H)*.3,{vx:Math.cos(H)*(1.4+s()*2),vy:2.2+s()*3,vz:Math.sin(H)*(1.4+s()*2),life:.7+s()*.8,spin:0,grow:-.04,drag:.5,size:.06+s()*.06,alpha:.9,gravity:-2.4,color:tt})}for(let G=0;G<B(3,S.power);G++){const H=s()*Xe,F=(1.5+s()*3)*S.power;L({x:S.at.x,y:Math.max(.15,S.at.y-.3),z:S.at.z,vx:Math.cos(H)*F,vy:3+s()*3,vz:Math.sin(H)*F,sx:.6+s()*.7,sy:.6+s()*.7,life:1.2+s()*.8,color:q.copy(Z).lerp(new ut(Ut.crackDeep),.25)})}for(let G=0;G<B(5,S.power);G++){const H=s()*Xe;f(S.at.x+Math.cos(H)*.5,.1+s()*.4,S.at.z+Math.sin(H)*.5,{vx:Math.cos(H)*2.2,vy:.7+s()*.6,vz:Math.sin(H)*2.2,life:1.4+s()*1.2,spin:(s()-.5)*1.4,grow:1.8,drag:2,size:.24+s()*.3,alpha:.24,gravity:-.8,color:K(S.tint,.06)})}}}},$=Object.freeze(Object.keys(at)),ft=new k,At=new ut;function It(S){const G=S==="sheet"?U:z;return G.find(H=>H.t<0)??G[0]}function Gt(S){return S.family==="sheet"?E[S.geo]:_[S.geo]}function xt(S,G,H){const F=It(S.family);F.t=0,F.dur=S.dur*(H.skill?1.35:1),F.spec=S,F.phase=G,F.power=H.power,F.mesh.geometry=Gt(S),F.holder.visible=!0,F.holder.position.copy(H.at),F.holder.rotation.set(0,Math.atan2(-H.dir.x,-H.dir.z),0),F.baseX=H.at.x,F.baseY=H.at.y,F.baseZ=H.at.z,F.dirX=H.dir.x,F.dirZ=H.dir.z,F.mesh.position.set(0,0,0),F.mesh.rotation.set(0,0,0),F.mesh.scale.set(1,1,1),F.orient.position.set(0,0,0),S.pose(F);const lt=S.color(H.tint);F.mat.uniforms.uColorLit.value.copy(lt.lit),F.mat.uniforms.uColorDark.value.copy(lt.dark),F.mat.uniforms.uLife.value=0;for(const[ot,A]of Object.entries(S.uniforms))F.mat.uniforms[ot]&&(F.mat.uniforms[ot].value=A);F.mat.uniforms.uOpacity.value=(S.uniforms.uOpacity??.5)*(H.whiff?.6:1)*(H.skill?1.15:1),S.animate(F,0,H.power)}const Tt={group:l,kinds:$,strike(S,G,H,F=1,lt={}){const ot=at[S]??at.fanwake,A=So(F,.4,2.4);ft.copy(H??ft.set(0,0,-1)),ft.y=0,ft.lengthSq()<1e-6&&ft.set(0,0,-1),ft.normalize();const w=lt.tint instanceof ut?At.copy(lt.tint):At.set(Number.isFinite(lt.tint)?lt.tint:Tr),rt={at:G,dir:ft,tint:w,power:A*(lt.skill?1.25:1),skill:!!lt.skill,whiff:!!lt.whiff},yt=r?1:ot.shells;for(let J=0;J<yt;J++)xt(ot,J,rt);return lt.whiff||ot.burst(rt),ot},update(S){for(const G of U)N(G,S);for(const G of z)N(G,S);v(c,h,S,null),v(u,d,S,mt),D(S)},setPixelScale(S){c.mat.uniforms.uPixelScale.value=S,u.mat.uniforms.uPixelScale.value=S},getStats(){return{shells:U.concat(z).filter(S=>S.t>=0).length,bits:x.length,particles:c.count+u.count}},dispose(){c.dispose(),u.dispose();for(const S of[...U,...z])S.mat.dispose(),l.remove(S.holder);for(const S of I)S.dispose();p.dispose(),y.dispose(),x.length=0,i.remove(l)}};function N(S,G){if(!(S.t<0)){if(S.t+=G/S.dur,S.t>=1){S.t=-1,S.holder.visible=!1;return}S.mat.uniforms.uLife.value=S.t,S.spec.animate(S,S.t,S.power)}}return Tt}const ya=Object.freeze(["wrap","bracer","pauldron","cloak","hood","turban","sash","horns","mask","banner"]),Tc=new Set(ya),Ac=Object.freeze({wildhorn:{id:"wildhorn",build:{height:1.05,mass:1.32,shoulder:1.36},accessory:"horns",cloth:"#5c4632",trim:"#241a12",accent:"#d7b078"},crane:{id:"crane",build:{height:1.15,mass:.76,shoulder:.86},accessory:"banner",cloth:"#41576c",trim:"#1c2733",accent:"#dde6ee"},nuo:{id:"nuo",build:{height:.96,mass:1.02,shoulder:1.04},accessory:"mask",cloth:"#5f333b",trim:"#26161a",accent:"#e7d6b2"}}),$n=Object.freeze({id:null,build:Object.freeze({height:1,mass:1,shoulder:1}),accessory:"wrap",cloth:"#6d7280",trim:"#3d4450",accent:"#d9cfba"});function wo(i,t){return Number.isFinite(i)?i:t}function bo(i,t,e){return i<t?t:i>e?e:i}function Vg(i){let t=2166136261;const e=String(i??"");for(let n=0;n<e.length;n++)t^=e.charCodeAt(n),t=Math.imul(t,16777619)>>>0;return t>>>0}function Pu(i){const t=Vg(i);return{id:i,build:{height:.9+(t>>>3)%9*.03,mass:.8+(t>>>9)%10*.05,shoulder:.86+(t>>>15)%10*.055},accessory:ya[t%ya.length],cloth:$n.cloth,trim:$n.trim,accent:$n.accent}}function Wg(i,t){const e=i&&typeof i=="object"?i:{};return{height:bo(wo(e.height,t.height),.82,1.22),mass:bo(wo(e.mass,t.mass),.72,1.38),shoulder:bo(wo(e.shoulder,t.shoulder),.8,1.45)}}function Xg(i,t){if(i&&Tc.has(i.accessory))return i.accessory;const e=i&&i.headgear;if(e==="hood"||e==="horns"||e==="mask")return e;const n=i&&i.back;if(n==="banner")return"banner";if(n==="pack")return"sash";if(e==="topknot"||e==="strawHat")return"turban";const s=t&&t.accessory;return Tc.has(s)?s:"wrap"}function Eo(i,t){const e=ku(i),n=Pu(e.id??t),s=e.palette||{};return{id:e.id??t,build:Wg(e.build,n.build),accessory:Xg(e,n),cloth:typeof s.cloth=="string"?s.cloth:$n.cloth,trim:typeof s.clothDim=="string"?s.clothDim:$n.trim,accent:typeof s.accent=="string"?s.accent:$n.accent}}function Ja(i=null){return Ou(i)}function Yg(i,t){const e=t||Ja(null),n=typeof i=="string"&&i.trim().length>0?i:null;if(n&&e.byId&&e.byId[n])return{...Eo(e.byId[n],n),source:e.source??"fallback"};if(n&&Ac[n])return{...Eo(Ac[n],n),source:"extra"};if(n)return{...Pu(n),source:"synth"};const s=e.defaultId??null;return s&&e.byId&&e.byId[s]?{...Eo(e.byId[s],s),source:"default"}:{...$n,build:{...$n.build},source:"default"}}const To="p0";function qg(i){return{x:-Math.sin(i),z:-Math.cos(i)}}const Zg=20,Kg=2.5,Jg=9;function Bt(i,t=0){return Number.isFinite(i)?i:t}function Iu(i,t,e){return i<t?t:i>e?e:i}function $g(i){if(Number.isFinite(i))return i>>>0;if(typeof i!="string")return null;const t=i.trim().replace(/^#/,"");return/^[0-9a-fA-F]{6}$/.test(t)?Number.parseInt(t,16):null}function gr(i,t){return $g(t)??zu[i]??Tr}function jg(i,t={}){var r;const e=Array.isArray(i==null?void 0:i.players)?i.players.filter(Boolean):[],n=o=>o!=null&&e.some(a=>a.id===o);if(n(t.localId))return t.localId;if(n(i==null?void 0:i.localId))return i.localId;if(n(i==null?void 0:i.selfId))return i.selfId;if(n(i==null?void 0:i.playerId))return i.playerId;if(n(t.followId))return t.followId;const s=e.find(o=>o.kind==="human"||o.isLocal===!0);return s?s.id:n(To)?To:((r=e[0])==null?void 0:r.id)??To}function Qg(i){var r;const t=(i==null?void 0:i.arena)??{},e=Bt(t.radius,Bt(i==null?void 0:i.arenaRadius,Bt((r=i==null?void 0:i.config)==null?void 0:r.arenaRadius,Zg))),n=Bt(t.tileSize,Kg),s=Bt(t.cols,Math.ceil(e*2/n));return{radius:e,tileSize:n,cols:s,origin:Bt(t.origin,-(s*n)/2),floorY:Bt(t.floorY,0),brokenCount:Bt(t.brokenCount,0)}}function tv(i){return i.alive===!1||i.broken===!0||i.destroyed===!0?!0:Bt(i.hp,1)<=0}function ev(i,t){var s;const e=((s=i==null?void 0:i.arena)==null?void 0:s.tiles)??(i==null?void 0:i.tiles);if(!Array.isArray(e))return[];const n=[];for(let r=0;r<e.length;r++){const o=e[r];if(!o||typeof o!="object"||!Number.isFinite(o.x))continue;const a=Number.isFinite(o.i)?o.i:r,l=Bt(o.maxHp,Bt(o.hpMax,1)),c=Bt(o.hp,l),u=tv(o);n.push({key:String(o.id??a),index:a,x:o.x,z:Bt(o.z,Bt(o.y,0)),size:Bt(o.size,t.tileSize),seam:o.seam===!0,zone:Bt(o.zone,0),hp:c,maxHp:l,crack:u?1:Iu(Number.isFinite(o.crack)?o.crack:1-c/Math.max(l,1e-6),0,1),broken:u})}return n}function nv(i){const t=Array.isArray(i==null?void 0:i.players)?i.players:[],e=[];for(const n of t){if(!n||n.id==null)continue;const s=n.activeGloveId??n.gloveId??null,r=Bt(n.activeSlot,0),o=n.gloveId??s,a=n.offhandId??s;e.push({id:n.id,kind:n.kind??"bot",skinId:typeof n.skinId=="string"&&n.skinId.length>0?n.skinId:null,x:Bt(n.x),y:Bt(n.y),z:Bt(n.z),yaw:Bt(n.yaw),speed:Bt(n.speed,Math.hypot(Bt(n.vx),Bt(n.vz))),alive:n.alive!==!1,grounded:n.grounded!==!1,invulnT:Bt(n.invulnT),respawnT:Bt(n.respawnT),awakenedT:Bt(n.awakenedT),awakened:n.awakened===!0||Bt(n.awakenedT)>0,meter:Bt(n.meter),combo:Bt(n.combo),attackPhase:n.attackPhase??n.phase??"idle",activeSlot:r,mainId:o,offhandId:a,activeGloveId:s,tint:gr(s,n.gloveColor??n.color),mainTint:gr(o,r===0?n.gloveColor??n.color:null),offTint:gr(a,r===1?n.gloveColor??n.color:null)})}return e}function iv(i){var n;const t=Array.isArray((n=i==null?void 0:i.combat)==null?void 0:n.ghosts)?i.combat.ghosts:Array.isArray(i==null?void 0:i.ghosts)?i.ghosts:[],e=[];for(const s of t){if(!s||typeof s!="object"||!Number.isFinite(s.x)||!Number.isFinite(s.z))continue;const r=Math.max(0,Bt(s.ttl));e.push({id:s.id??null,ownerId:s.ownerId??null,x:s.x,y:Bt(s.y),z:s.z,yaw:Bt(s.yaw),ttl:r,ttl0:Math.max(r,Bt(s.ttl0,r)),fake:s.fake===!0,gloveId:typeof s.gloveId=="string"?s.gloveId:null})}return e}const li={halfWidth:7.5,length:39,portalRadius:2.4,interactRadius:2,pedestalRadius:.6,pedestalHeight:.95};function Lu(i){const t=typeof(i==null?void 0:i.phase)=="string"?i.phase.trim().toLowerCase():null;return t==="hub"||t==="arena"?t:null}function sv(i,t){const e=Array.isArray(i==null?void 0:i.pedestals)?i.pedestals:[],n=[];for(let s=0;s<e.length;s++){const r=e[s];if(!r||typeof r!="object")continue;const o=typeof r.gloveId=="string"?r.gloveId:null;if(!o)continue;const l=(r.slot==="main"||r.slot==="off"?r.slot:null)??(o===t.mainGloveId?"main":o===t.offGloveId?"off":null);n.push({gloveId:o,x:Bt(r.x),y:Bt(r.y,t.floorY),z:Bt(r.z,t.origin.z),yaw:Bt(r.yaw),row:r.row==="right"?"right":r.row==="left"?"left":r.x>t.origin.x?"right":"left",index:Number.isFinite(r.index)?r.index:Math.floor(s/2),height:Bt(r.height,t.pedestalHeight),unlocked:r.unlocked!==!1,slot:l,selected:r.selected===!0||l!==null,focused:r.focused===!0||t.focusGloveId!=null&&o===t.focusGloveId,name:typeof r.name=="string"?r.name:null,tint:gr(o,r.color??r.tint)})}return n}function rv(i){var g,v,m,p,y,M,x,Y,R,L,D,E,_,I,V,W;const t=i!=null&&i.hub&&typeof i.hub=="object"?i.hub:null,e=Lu(i),n=!!t&&Array.isArray(t.pedestals)&&t.pedestals.length>0,s=e==="hub"?!0:e==="arena"?!1:n,r={x:Bt((g=t==null?void 0:t.origin)==null?void 0:g.x,0),y:Bt((v=t==null?void 0:t.origin)==null?void 0:v.y,0),z:Bt((m=t==null?void 0:t.origin)==null?void 0:m.z,0)},o=Bt(t==null?void 0:t.floorY,r.y),a=Math.max(1.5,Bt((p=t==null?void 0:t.walkway)==null?void 0:p.halfWidth,li.halfWidth)),l=Bt((y=t==null?void 0:t.walkway)==null?void 0:y.minZ,r.z-li.length/2),c=Bt((M=t==null?void 0:t.walkway)==null?void 0:M.maxZ,r.z+li.length/2),u=Math.max(.2,Bt(t==null?void 0:t.pedestalHeight,li.pedestalHeight)),h=typeof(t==null?void 0:t.mainGloveId)=="string"?t.mainGloveId:null,d=typeof(t==null?void 0:t.offGloveId)=="string"?t.offGloveId:null,f=typeof(t==null?void 0:t.focusGloveId)=="string"?t.focusGloveId:null;return{active:s,phase:e??(n?"hub":"arena"),layoutId:typeof(t==null?void 0:t.layoutId)=="string"?t.layoutId:null,origin:r,floorY:o,walkway:{halfWidth:a,minZ:Math.min(l,c),maxZ:Math.max(l,c)},spawn:{x:Bt((x=t==null?void 0:t.spawn)==null?void 0:x.x,r.x),y:Bt((Y=t==null?void 0:t.spawn)==null?void 0:Y.y,o),z:Bt((R=t==null?void 0:t.spawn)==null?void 0:R.z,c-4),yaw:Bt((L=t==null?void 0:t.spawn)==null?void 0:L.yaw,0)},portal:{x:Bt((D=t==null?void 0:t.portal)==null?void 0:D.x,r.x),y:Bt((E=t==null?void 0:t.portal)==null?void 0:E.y,o),z:Bt((_=t==null?void 0:t.portal)==null?void 0:_.z,l+4),radius:Math.max(.8,Bt((I=t==null?void 0:t.portal)==null?void 0:I.radius,li.portalRadius)),ready:(t==null?void 0:t.portalReady)===!0||((V=t==null?void 0:t.portal)==null?void 0:V.ready)===!0,near:(t==null?void 0:t.portalNear)===!0||((W=t==null?void 0:t.portal)==null?void 0:W.near)===!0},interactRadius:Math.max(.5,Bt(t==null?void 0:t.interactRadius,li.interactRadius)),pedestalRadius:Math.max(.2,Bt(t==null?void 0:t.pedestalRadius,li.pedestalRadius)),pedestalHeight:u,focusGloveId:f,mainGloveId:h,offGloveId:d,pedestals:sv(t,{origin:r,floorY:o,pedestalHeight:u,focusGloveId:f,mainGloveId:h,offGloveId:d})}}const ov={slapstart:"swing",slap:"slap",hit:"hit",skill:"skill",ko:"ko",awaken:"awaken",awakenend:"awakenEnd",dash:"dash",jump:"jump",respawn:"respawn",switch:"switch",tilecrack:"tileCrack",tilebreak:"tileBreak",matchover:"matchOver",slapwindup:"swing",slapwhiff:"slap",ghostslap:"slap",skillcast:"skill",skillhit:"hit",meteorimpact:"heavy",parry:"heavy",kill:"ko"};function av(i){return String(i??"").toLowerCase().replace(/[_\-\s]/g,"")}function lv(i,t){const e=i.power??i.impulse??i.strength??i.damage;return Number.isFinite(e)?Iu(e/Jg,.3,2.6):t==="heavy"?1.6:1}function cv(i){const t=Array.isArray(i==null?void 0:i.events)?i.events:[],e=[];for(const n of t){if(!n)continue;const s=av(n.type??n.kind),r=ov[s]??null;if(!r)continue;let o=n.attackerId??n.playerId??n.ownerId??n.killerId??n.by??n.attacker??n.owner??n.id??null,a=n.targetId??n.target??n.victimId??null;r==="ko"&&(a=n.victimId??n.id??a,o=n.killerId??n.by??null),e.push({kind:r,type:n.type??r,actorId:o,targetId:a,gloveId:n.gloveId??null,skillId:n.skillId??null,tileIndex:Number.isFinite(n.i)?n.i:null,tileId:n.tileId??null,x:Number.isFinite(n.x)?n.x:null,y:Number.isFinite(n.y)?n.y:null,z:Number.isFinite(n.z)?n.z:null,yaw:Number.isFinite(n.yaw)?n.yaw:null,hits:Number.isFinite(n.hits)?n.hits:s==="slapwhiff"?0:null,power:lv(n,r),t:Bt(n.t,Bt(i==null?void 0:i.time,0))})}return e}function uv(i,t={}){var s;const e=i&&typeof i=="object"?i:{},n=Qg(e);return{time:Bt(e.time,Bt(e.t,0)),tick:Number.isFinite(e.tick)?e.tick:null,alpha:Bt(e.alpha,1),over:((s=e.match)==null?void 0:s.over)===!0||e.over===!0,localId:jg(e,t),phase:Lu(e),hub:rv(e),arena:n,tiles:ev(e,n),players:nv(e),ghosts:iv(e),events:cv(e)}}const Cc=54,wr=.22,br=Math.PI/2.6;function hv(i,t,e){return i<t?t:i>e?e:i}function sn(i,t,e,n){return i+(t-i)*(1-Math.exp(-e*n))}function fv({aspect:i=16/9,mobile:t=!1}={}){const e=new Qe(Cc,i,.35,1600);e.position.set(0,6,14);const n={pos:new k(0,6,14),look:new k(0,1.4,0),yaw:0,pitch:wr,pitchBias:0,pitchOut:wr,dist:7.4,shake:0,shakeFreq:26,fovKick:0,breathe:Math.random()*100,mobile:t,shakeScale:t?.45:1,lead:new k},s=new k,r=new k,o=new k;return{camera:e,state:n,setMobile(a){n.mobile=!!a,n.shakeScale=a?.45:1},impulse(a=.5,l=0){n.shake=Math.min(1.4,n.shake+a*n.shakeScale),n.fovKick=Math.min(6.5,n.fovKick+(l||a*2.4)*n.shakeScale)},resize(a){e.aspect=a,e.updateProjectionMatrix()},update(a,l,c,u,h={}){const d=Math.max(0,l.y);n.yaw=sn(n.yaw,c,7.5,a);const f=Number.isFinite(h.pitchBias)?h.pitchBias:0;n.pitchBias=sn(n.pitchBias,f,14,a);const g=hv(n.pitch+n.pitchBias,-br,br);n.pitchOut=g;const v=u?Math.hypot(u.x,u.z):0,m=7.1+Math.min(1.6,v*.11)+d*.12;n.dist=sn(n.dist,m,3.2,a);const p=Math.sin(n.yaw),y=Math.cos(n.yaw),M=2.5+Math.sin(g)*n.dist*.9;s.set(l.x+p*n.dist,l.y+M,l.z+y*n.dist),s.y<l.y+1.2&&(s.y=l.y+1.2),s.y<1.4&&(s.y=1.4),n.pos.x=sn(n.pos.x,s.x,6.2,a),n.pos.y=sn(n.pos.y,s.y,5,a),n.pos.z=sn(n.pos.z,s.z,6.2,a),u&&(n.lead.x=sn(n.lead.x,u.x*.16,4,a),n.lead.z=sn(n.lead.z,u.z*.16,4,a)),r.set(l.x+n.lead.x-p*1.1,l.y+1.45-Math.sin(g-n.pitch)*2.4,l.z+n.lead.z-y*1.1),n.look.x=sn(n.look.x,r.x,9,a),n.look.y=sn(n.look.y,r.y,7,a),n.look.z=sn(n.look.z,r.z,9,a),n.breathe+=a;const x=Math.sin(n.breathe*.53)*.035+Math.sin(n.breathe*1.31)*.012,Y=Math.cos(n.breathe*.41)*.028+Math.sin(n.breathe*1.07)*.01;let R=0,L=0,D=0;if(n.shake>5e-4){const _=n.breathe*n.shakeFreq,I=n.shake*n.shake;R=(Math.sin(_*1.7)+Math.sin(_*3.1)*.5)*I*.34,L=(Math.cos(_*2.3)+Math.sin(_*4.7)*.4)*I*.26,D=Math.sin(_*2.9)*I*.18,n.shake=Math.max(0,n.shake-a*3.6)}e.position.set(n.pos.x+x+R,n.pos.y+Y+L,n.pos.z+D),o.copy(n.look),o.x+=R*.3,o.y+=L*.3,e.lookAt(o),e.rotateZ(R*.06),n.fovKick=Math.max(0,n.fovKick-a*14);const E=Cc+n.fovKick+Math.min(4,v*.22);Math.abs(e.fov-E)>.01&&(e.fov=sn(e.fov,E,10,a),e.updateProjectionMatrix())},orbit(a,l,c=30){const u=l*.055,h=3.4+Math.sin(l*.11)*2.6;e.position.set(Math.cos(u)*c,h,Math.sin(u)*c),e.lookAt(Math.sin(u*1.7)*2,-.9,Math.cos(u*1.7)*2),n.pos.copy(e.position),n.look.set(0,-.9,0)}}}function Er(i,t=!1){const e=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),s=new Set(Object.keys(i[0].morphAttributes)),r={},o={},a=i[0].morphTargetsRelative,l=new ye;let c=0;for(let u=0;u<i.length;++u){const h=i[u];let d=0;if(e!==(h.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const f in h.attributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;r[f]===void 0&&(r[f]=[]),r[f].push(h.attributes[f]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of attributes."),null;if(a!==h.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const f in h.morphAttributes){if(!s.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+".  .morphAttributes must be consistent throughout all geometries."),null;o[f]===void 0&&(o[f]=[]),o[f].push(h.morphAttributes[f])}if(t){let f;if(e)f=h.index.count;else if(h.attributes.position!==void 0)f=h.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,f,u),c+=f}}if(e){let u=0;const h=[];for(let d=0;d<i.length;++d){const f=i[d].index;for(let g=0;g<f.count;++g)h.push(f.getX(g)+u);u+=i[d].attributes.position.count}l.setIndex(h)}for(const u in r){const h=Rc(r[u]);if(!h)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" attribute."),null;l.setAttribute(u,h)}for(const u in o){const h=o[u][0].length;if(h===0)break;l.morphAttributes=l.morphAttributes||{},l.morphAttributes[u]=[];for(let d=0;d<h;++d){const f=[];for(let v=0;v<o[u].length;++v)f.push(o[u][v][d]);const g=Rc(f);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" morphAttribute."),null;l.morphAttributes[u].push(g)}}return l}function Rc(i){let t,e,n,s=-1,r=0;for(let c=0;c<i.length;++c){const u=i[c];if(t===void 0&&(t=u.array.constructor),t!==u.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=u.itemSize),e!==u.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=u.normalized),n!==u.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=u.gpuType),s!==u.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=u.count*e}const o=new t(r),a=new Se(o,e,n);let l=0;for(let c=0;c<i.length;++c){const u=i[c];if(u.isInterleavedBufferAttribute){const h=l/e;for(let d=0,f=u.count;d<f;d++)for(let g=0;g<e;g++){const v=u.getComponent(d,g);a.setComponent(d+h,g,v)}}else o.set(u.array,l);l+=u.count*e}return s!==void 0&&(a.gpuType=s),a}const mi=Math.PI*2,lr=1,dv=6,pv=80,mv=new Set(["hood","turban"]);function Pc(i){i.updateWorldMatrix(!0,!0);const t=new Map;i.traverse(n=>{if(!n.isMesh)return;const s=n.userData.matKey??"cloth",r=n.geometry.clone();r.applyMatrix4(n.matrixWorld),t.has(s)||t.set(s,[]),t.get(s).push(r)});const e=new Map;for(const[n,s]of t){if(s.length===1){e.set(n,s[0]);continue}const r=Er(s,!1);for(const o of s)o.dispose();r&&e.set(n,r)}return e}const Ic=new Tn(new k(0,1.1,0),2.6),gv=new gn({color:0}),vv={cloth:"clothSurface",clothDim:"clothSurface",leather:"leatherSurface",leatherWorn:"leatherSurface",skin:"plainSurface",accent:"plainSurface",paint:"paintSurface",paintMain:"paintSurface",paintOff:"paintSurface"},_v=["cloth","clothDim","clothSurface","leather","leatherWorn","leatherSurface","skin","accent","plainSurface"];function re(i,t,e){const n=t[vv[e]]??t[e],s=new Yt(i,n);return n.vertexColors&&(s.userData.tintSource=e),s}function xv(i,t){i.updateMatrixWorld(!0);const e=new jt().copy(i.matrixWorld).invert(),n=new jt,s=[],r=new Map,o=[];i.traverse(h=>{h.isMesh&&!h.isSkinnedMesh&&!t.has(h)&&o.push(h)});const a=[];for(const h of o){const d=s.length;s.push(h);const f=h.geometry.clone();f.applyMatrix4(n.multiplyMatrices(e,h.matrixWorld));const g=f.attributes.position.count,v=new Uint16Array(g*4),m=new Float32Array(g*4);for(let y=0;y<g;y++)v[y*4]=d,m[y*4]=1;if(f.setAttribute("skinIndex",new Se(v,4)),f.setAttribute("skinWeight",new Se(m,4)),h.layers.isEnabled(wa)&&a.push(f.clone()),h.material.vertexColors&&!f.attributes.color){const y=new Float32Array(g*3).fill(1);f.setAttribute("color",new Se(y,3))}let p=r.get(h.material);p||(p={geos:[],cast:!1,receive:!1,layers:0,bloomSelf:!1,verts:0,ranges:[]},r.set(h.material,p)),p.ranges.push({source:h,start:p.verts,count:g}),p.verts+=g,p.geos.push(f),p.cast||(p.cast=h.castShadow),p.receive||(p.receive=h.receiveShadow),p.layers|=h.layers.mask&-5,p.bloomSelf||(p.bloomSelf=!!h.userData.bloomSelf),h.visible=!1}const l=new za(s),c=[],u=new Map;for(const[h,d]of r){const f=d.geos.length===1?d.geos[0]:Er(d.geos,!1);if(!f)continue;if(d.geos.length>1)for(const v of d.geos)v.dispose();const g=new rc(f,h);g.castShadow=d.cast,g.receiveShadow=d.receive,g.layers.mask=d.layers,d.bloomSelf&&(g.userData.bloomSelf=!0),g.userData.ranges=d.ranges,g.boundingSphere=Ic.clone(),i.add(g),g.bind(l,i.matrixWorld),c.push(g),u.set(h,g)}if(a.length>0){const h=a.length===1?a[0]:Er(a,!1);if(a.length>1)for(const d of a)d.dispose();if(h){const d=new rc(h,gv);d.name="bloom-occluder",d.visible=!1,d.userData.emissiveOnly=!0,d.boundingSphere=Ic.clone(),Fn(d),i.add(d),d.bind(l,i.matrixWorld),c.push(d)}}return{meshes:c,skeleton:l,byMaterial:u}}function Lc(i,t){var n,s,r;const e=(s=(n=i==null?void 0:i.geometry)==null?void 0:n.attributes)==null?void 0:s.color;if(e){for(const o of i.userData.ranges){const a=(r=t[o.source.userData.tintSource])==null?void 0:r.color;if(a)for(let l=o.start;l<o.start+o.count;l++)e.setXYZ(l,a.r,a.g,a.b)}e.needsUpdate=!0}}function Mv(i,t){let e=(t-i)%mi;return e>Math.PI&&(e-=mi),e<-Math.PI&&(e+=mi),e}function ci(i,t,e,n){return i+(t-i)*(1-Math.exp(-e*n))}function yv(i){return i<0?0:i>1?1:i}function Oi(i,t){const e=new ut(Number.isFinite(i)?i:Tr);if(t)return e;const n={h:0,s:0,l:0};return e.getHSL(n),e.setHSL(n.h,n.s*.45,n.l*.92)}function cr(i,t,e=.6){const n=new ut(typeof i=="string"?i:"#6d7280"),s={h:0,s:0,l:0};return n.getHSL(s),n.setHSL(s.h,s.s*(t?.75:.4),s.l),n.lerp(new ut(Ut.cloth),1-e)}function Sv({scene:i,quality:t,textures:e,skins:n=null}){const s=n||Ja(null),r=new ve;r.name="characters",i.add(r);const o=[],a=T=>(o.push(T),T),l=t.capsuleSegments,c={torso:a(new pn(.3,.44,Math.max(3,l/2),l)),hips:a(new pn(.26,.16,3,l)),thigh:a(new pn(.15,.34,3,Math.max(5,l-2))),shin:a(new pn(.12,.3,3,Math.max(5,l-2))),foot:a(new pe(.19,.11,.34)),upperArm:a(new pn(.1,.26,3,Math.max(5,l-2))),head:a(new De(.22,l+2,l)),hood:a(new De(.245,l+2,l,0,mi,0,Math.PI*.62)),collar:a(new be(.24,.31,.16,l+2,1,!0)),strapChest:a(new pe(.1,.62,.035)),buckle:a(new pe(.09,.07,.05)),backPanel:a(new pe(.29,.4,.04)),mitt:a(new De(.34,l+3,l+1)),knuckle:a(new Ze(.3,.045,5,l+4,Math.PI*1.05)),stud:a(new pe(.07,.06,.055)),cuff:a(new be(.19,.24,.22,l+2)),tassel:a(new pe(.045,.2,.02)),seam:a(new Ze(.318,.014,4,l+6,Math.PI*1.35)),contact:a(new Lr(.62,16)),cap:a(new De(.235,l+2,l,0,mi,0,Math.PI*.36)),hoodDeep:a(new De(.28,l+2,l,0,mi,0,Math.PI*.72)),cowl:a(new be(.31,.2,.22,l+2,1,!0)),horn:a(new Dr(.062,.36,Math.max(4,l-4))),maskShell:a(new be(.21,.18,.3,Math.max(6,l),1,!0,Math.PI-.95,1.9)),brow:a(new pe(.3,.045,.05)),plate:a(new pe(.27,.055,.25)),cloakSheet:a(new pe(.52,.98,.05)),pole:a(new be(.022,.018,1.15,5)),flag:a(new pe(.26,.74,.018)),turbanRing:a(new Ze(.2,.078,5,l+4)),sashBand:a(new pe(.17,.9,.05)),wrapBand:a(new be(.118,.118,.14,l)),bracerShell:a(new be(.16,.135,.32,l+1))};c.gloveMetal=a((()=>{const T=new Kt,U=new Yt(c.knuckle,null);U.userData.matKey="metal",U.rotation.set(Math.PI*.5,Math.PI,Math.PI*.02),U.position.set(0,.02,-.06),T.add(U);for(let z=0;z<3;z++){const b=new Yt(c.stud,null);b.userData.matKey="metal";const P=-.5+z*.5;b.position.set(Math.sin(P)*.28,.16,-Math.cos(P)*.26),b.rotation.y=-P,T.add(b)}return Pc(T).get("metal")})());const u=a(new gn({color:856087,transparent:!0,opacity:.32,depthWrite:!1}));function h(T,U=!1){return new se({color:T,vertexColors:U,roughnessMap:e.cloth.rough,normalMap:t.normalMaps?e.cloth.normal:null,normalScale:new Et(.4,.4),roughness:.86,metalness:0,envMapIntensity:.28})}function d(){return new se({color:1182728,roughness:.5,metalness:.2,emissive:new ut(Ut.crackCore),emissiveIntensity:0,toneMapped:!0})}function f(T,U,z){const b=Oi(T.active,U),P=Oi(T.main,U),Z=Oi(T.off,U),tt={color:cr(z.cloth,U).lerp(b,.12),roughness:.96,metalness:0,roughnessMap:e.cloth.rough,normalMap:e.cloth.normal,normalScale:new Et(.5,.5),envMapIntensity:.35},j=t.sheenCloth?new Cg({...tt,sheen:.3,sheenRoughness:.9,sheenColor:new ut(8226711)}):new se(tt),mt=new se({color:cr(z.trim,U,.7).lerp(new ut(Ut.clothDim),.45),roughness:.98,metalness:0,roughnessMap:e.cloth.rough,normalMap:e.cloth.normal,normalScale:new Et(.4,.4),envMapIntensity:.3}),q=new se({color:new ut(Ut.leather),roughness:.78,metalness:0,roughnessMap:e.leather.rough,normalMap:e.leather.normal,normalScale:new Et(.9,.9),envMapIntensity:.5}),K=new se({color:new ut(Ut.leatherWorn),roughness:.62,metalness:0,roughnessMap:e.leather.rough,normalMap:e.leather.normal,normalScale:new Et(.7,.7),envMapIntensity:.6}),B=new se({color:new ut(Ut.metal),roughness:.42,metalness:.92,roughnessMap:e.metal.rough,normalMap:e.metal.normal,normalScale:new Et(.5,.5),envMapIntensity:1}),at=new se({color:new ut(Ut.skin),roughness:.66,metalness:0,envMapIntensity:.4}),$=new se({color:cr(z.accent,U,.72),roughness:.72,metalness:0,envMapIntensity:.45}),ft=t.sheenCloth?null:new se({color:16777215,vertexColors:!0,roughness:.97,metalness:0,roughnessMap:e.cloth.rough,normalMap:e.cloth.normal,normalScale:new Et(.45,.45),envMapIntensity:.33}),At=new se({color:16777215,vertexColors:!0,roughness:.68,metalness:0,roughnessMap:e.leather.rough,normalMap:e.leather.normal,normalScale:new Et(.8,.8),envMapIntensity:.56}),It=new se({color:16777215,vertexColors:!0,roughness:.69,metalness:0,envMapIntensity:.42});return{cloth:j,clothDim:mt,clothSurface:ft,leather:q,leatherWorn:K,leatherSurface:At,metal:B,skin:at,accent:$,plainSurface:It,paint:h(b),paintMain:h(P),paintOff:h(Z),paintSurface:h(16777215,!0),seamMain:d(),seamOff:d(),ident:b}}function g(T,U,z,b){const P=new ve,Z=re(c.mitt,T,"leather");Z.scale.set(1,.86,1.16),Z.castShadow=t.shadows,P.add(Z);const tt=re(c.mitt,T,"leatherWorn");tt.scale.set(.86,.6,.9),tt.position.set(0,-.13,-.06),P.add(tt);const j=re(c.gloveMetal,T,"metal");j.castShadow=t.shadows&&t.propShadows,P.add(j);const mt=re(c.stud,T,z);mt.scale.set(3.4,.55,1.2),mt.position.set(0,.07,.24),P.add(mt);const q=re(c.cuff,T,"cloth");q.position.set(0,.3,.02),q.rotation.x=-.15,q.castShadow=t.shadows&&t.propShadows,P.add(q);const K=re(c.tassel,T,"clothDim");K.position.set(U*.14,.26,.14),P.add(K);const B=new Yt(c.seam,b);return B.rotation.set(Math.PI*.5,Math.PI,Math.PI*.32),B.position.set(0,-.02,-.02),B.layers.enable(Ar),B.userData.bloomSelf=!0,P.add(B),P.userData={tassel:K,seam:B,mitt:Z,stripe:mt},P}function v(T,U){const{body:z,arms:b,mats:P}=U,Z=[],tt=(j,mt)=>(j.castShadow=t.shadows&&t.propShadows,(mt??z).add(j),Z.push(j),j);switch(T){case"hood":{const j=tt(re(c.hoodDeep,P,"cloth"));j.position.set(0,1.82,.03),j.rotation.x=.2,j.scale.set(1.06,1.12,1.12);const mt=tt(re(c.cowl,P,"clothDim"));mt.position.y=1.62;break}case"turban":{const j=tt(re(c.turbanRing,P,"cloth"));j.position.y=1.86,j.rotation.x=Math.PI/2+.12,j.scale.set(1.12,1.12,.86);const mt=tt(re(c.cap,P,"cloth"));mt.position.y=1.92,mt.scale.set(.94,.7,.94);const q=tt(re(c.tassel,P,"clothDim"));q.position.set(.05,1.68,.2),q.scale.set(1.7,1.5,1.6);break}case"horns":{for(const j of[-1,1]){const mt=tt(re(c.horn,P,"accent"));mt.position.set(j*.17,1.9,.02),mt.rotation.set(-.5,0,j*-.75);const q=tt(re(c.horn,P,"accent"));q.position.set(j*.3,2.02,.16),q.rotation.set(-1.15,0,j*-1.1),q.scale.setScalar(.72)}break}case"mask":{const j=tt(re(c.maskShell,P,"accent"));j.position.set(0,1.79,-.04),j.scale.set(1.06,1.12,1.06);const mt=tt(re(c.brow,P,"clothDim"));mt.position.set(0,1.9,-.19),mt.rotation.x=.22;break}case"pauldron":{for(const j of b)for(let mt=0;mt<3;mt++){const q=tt(re(c.plate,P,"metal"),j.shoulder);q.position.set(j.side*(.02+mt*.035),.06-mt*.075,0),q.rotation.z=j.side*(.18+mt*.16),q.scale.setScalar(1-mt*.12)}break}case"cloak":{const j=tt(re(c.cloakSheet,P,"cloth"));j.position.set(0,1.06,.31),j.rotation.x=-.07,j.scale.set(1,1,1);const mt=tt(re(c.cloakSheet,P,"clothDim"));mt.position.set(-.2,.62,.3),mt.rotation.set(-.16,.24,.08),mt.scale.set(.42,.5,.8);const q=tt(re(c.cloakSheet,P,"clothDim"));q.position.set(.2,.62,.3),q.rotation.set(-.16,-.24,-.08),q.scale.set(.42,.5,.8);break}case"banner":{const j=tt(re(c.pole,P,"leather"));j.position.set(-.12,1.62,.34),j.rotation.z=.16;const mt=tt(re(c.flag,P,"accent"));mt.position.set(-.26,1.86,.36),mt.rotation.z=.16,tt(re(c.buckle,P,"metal")).position.set(-.06,1.3,.33);break}case"sash":{const j=tt(re(c.sashBand,P,"accent"));j.position.set(-.05,1.24,-.28),j.rotation.z=.42,tt(re(c.buckle,P,"leather")).position.set(-.22,.94,-.24);const q=tt(re(c.tassel,P,"clothDim"));q.position.set(-.24,.78,-.2),q.scale.set(1.6,2.2,1.6);break}case"bracer":{for(const j of b){const mt=tt(re(c.bracerShell,P,"leatherWorn"),j.wrist);mt.position.y=-.04;const q=tt(re(c.wrapBand,P,"metal"),j.wrist);q.position.y=-.19,q.scale.set(1.35,.42,1.35)}break}case"wrap":default:{for(const mt of b){const q=tt(re(c.wrapBand,P,"clothDim"),mt.wrist);q.position.y=-.02,q.scale.set(1.08,1.5,1.08)}const j=tt(re(c.turbanRing,P,"clothDim"));j.position.y=.92,j.rotation.x=Math.PI/2,j.scale.set(1.32,1.32,.5);break}}return Z}function m(T,U,z){const b=f(T,U,z),P=new ve,Z=new ve,tt=z.build;Z.scale.set(tt.mass,tt.height,tt.mass),P.add(Z);const j=.82+tt.shoulder*.18,mt=mv.has(z.accessory),q=new Kt,K=(G,H,F)=>{const lt=new Yt(G,null);return lt.userData.matKey=H,F==null||F(lt),q.add(lt),lt};K(c.hips,"clothDim",G=>{G.position.y=.86}),K(c.torso,"cloth",G=>{G.position.y=1.24,G.scale.x=j}),K(c.strapChest,"leather",G=>{G.position.set(.06,1.26,-.27),G.rotation.z=-.24}),K(c.buckle,"metal",G=>{G.position.set(.12,1.06,-.3)}),K(c.collar,"clothDim",G=>{G.position.y=1.58,G.scale.set(j,1,1)}),K(c.backPanel,"clothDim",G=>{G.position.set(0,1.26,.305),G.rotation.x=-.06,G.scale.set(1.22,1.16,.6)}),K(c.backPanel,"paint",G=>{G.position.set(0,1.26,.315),G.rotation.x=-.06}),K(c.head,"skin",G=>{G.position.y=1.79}),mt||K(c.cap,"cloth",G=>{G.position.y=1.8,G.rotation.x=.16});const B=Pc(q),at=[],$=new Set(["cloth","clothDim","skin"]),ft=new Set(["cloth","clothDim","skin"]);for(const[G,H]of B){const F=re(H,b,G);F.castShadow=t.shadows&&(ft.has(G)||t.propShadows),G==="cloth"&&(F.receiveShadow=t.shadows),$.has(G)&&Fn(F),Z.add(F),at.push(F)}const At=[];for(const G of[-1,1]){const H=new ve;H.position.set(G*.16,.84,0),Z.add(H);const F=re(c.thigh,b,"clothDim");F.position.y=-.24,F.castShadow=t.shadows,H.add(F);const lt=new ve;lt.position.y=-.46,H.add(lt);const ot=re(c.shin,b,"clothDim");ot.position.y=-.2,ot.castShadow=t.shadows,lt.add(ot);const A=re(c.foot,b,"leather");A.position.set(0,-.38,-.06),lt.add(A),At.push({hip:H,knee:lt,side:G})}const It=[];for(const G of[-1,1]){const H=G===lr,F=new ve;F.position.set(G*.33*tt.shoulder,1.46,0),Z.add(F);const lt=re(c.upperArm,b,"cloth");lt.position.y=-.2,lt.castShadow=t.shadows,F.add(lt);const ot=new ve;ot.position.y=-.46,F.add(ot);const A=g(b,G,H?"paintMain":"paintOff",H?b.seamMain:b.seamOff);A.position.y=-.22,ot.add(A),It.push({shoulder:F,wrist:ot,glove:A,side:G,slot:H?0:1})}const Gt=v(z.accessory,{body:Z,arms:It,mats:b}),xt=new Yt(c.contact,u.clone());xt.rotation.x=-Math.PI/2,xt.position.y=.02,xt.renderOrder=1,xt.scale.setScalar(.86+tt.mass*.18),P.add(xt);const Tt=xv(P,new Set([xt])),N=Tt.meshes.filter(G=>G.material.vertexColors);for(const G of N)Lc(G,b);const S=Tt.byMaterial.get(b.paintSurface)??null;return{rootGroup:P,paintMesh:S,tinted:N,body:Z,mats:b,legs:At,arms:It,skinned:Tt,bodyParts:at,contact:xt,look:z,accessory:Gt,baseScale:{x:tt.mass,y:tt.height,z:tt.mass},contactScale:.86+tt.mass*.18}}const p=new Map,y=new k;function M(T){return{active:T.tint,main:T.mainTint??T.tint,off:T.offTint??T.tint}}function x(T,U){const z=T.isLocal,b=Oi(U.tint,z);T.mats.paint.color.copy(b),T.mats.paintMain.color.copy(Oi(U.mainTint??U.tint,z)),T.mats.paintOff.color.copy(Oi(U.offTint??U.tint,z)),T.mats.cloth.color.copy(cr(T.look.cloth,z)).lerp(b,.12);for(const P of T.tinted)Lc(P,T.mats);T.activeGloveId=U.activeGloveId,T.mainId=U.mainId,T.offhandId=U.offhandId}function Y(T,U){const z=Yg(T.skinId,s),b=m(M(T),U,z);r.add(b.rootGroup);const P={id:T.id,...b,isLocal:U,skinId:T.skinId??null,activeGloveId:T.activeGloveId,mainId:T.mainId,offhandId:T.offhandId,activeSlot:T.activeSlot??0,pos:new k(T.x??0,T.y??0,T.z??0),prev:new k(T.x??0,T.y??0,T.z??0),yaw:T.yaw??0,speed:0,stride:0,slapT:-1,slapSide:lr,slapPower:1,hitT:-1,awaken:0,breathe:Math.random()*mi};return p.set(T.id,P),P}function R(T){var U,z;r.remove(T.rootGroup);for(const b of Object.keys(T.mats))(z=(U=T.mats[b])==null?void 0:U.dispose)==null||z.call(U);for(const b of T.bodyParts)b.geometry.dispose();for(const b of T.skinned.meshes)b.geometry.dispose();T.skinned.skeleton.dispose(),T.contact.material.dispose()}const L=new ve;L.name="ghosts",L.visible=!1,r.add(L);const D=[];let E=0;const _={x:1,y:1,z:1},I=new ut(2830400),V=new ut(Tr);function W(){const T=new se({color:I.clone(),roughness:.95,metalness:0,transparent:!0,opacity:0,depthWrite:!1,envMapIntensity:.2}),U=new ve,z=(P,Z)=>{const tt=new Yt(P,T);return tt.position.y=Z,U.add(tt),tt};z(c.hips,.86),z(c.torso,1.24),z(c.head,1.79);for(const P of[-1,1]){const Z=new Yt(c.mitt,T);Z.position.set(P*.38,1.02,-.1),Z.scale.set(.88,.74,1.02),U.add(Z)}U.visible=!1,U.renderOrder=2,L.add(U);const b={group:U,mat:T};return D.push(b),b}return{root:r,chars:p,get(T){return p.get(T)},reconcile(T,U){const z=new Set;for(const b of T){if(!b||b.id==null)continue;z.add(b.id);let P=p.get(b.id);const Z=b.id===U,tt=b.skinId??null;if(P&&(P.skinId!==tt||P.isLocal!==Z)){const j={pos:P.pos.clone(),prev:P.prev.clone(),yaw:P.yaw,speed:P.speed};R(P),p.delete(b.id),P=Y(b,Z),P.pos.copy(j.pos),P.prev.copy(j.prev),P.yaw=j.yaw,P.speed=j.speed}else P?(b.activeGloveId!==P.activeGloveId||b.mainId!==P.mainId||b.offhandId!==P.offhandId)&&x(P,b):P=Y(b,Z);P.activeSlot=b.activeSlot??0,P.target=b}for(const[b,P]of p)z.has(b)||(R(P),p.delete(b))},playSlap(T,U=1,z=null){const b=p.get(T);b&&(b.slapT=0,b.slapPower=Math.max(.35,Math.min(2,U)),b.slapSide=z??(b.activeSlot===0?lr:-lr))},playHit(T,U,z=1){const b=p.get(T);b&&(b.hitT=0,b.hitPower=Math.max(.3,Math.min(2.4,z)),b.hitDir=U?y.copy(U).normalize().clone():new k(0,0,1))},update(T,U,z=null){for(const b of p.values()){const P=b.target;if(!P)continue;const Z=P.alive!==!1,tt=!b.isLocal&&z!=null&&Math.hypot((P.x??0)-z.x,(P.z??0)-z.z)>pv;if(b.rootGroup.visible=Z&&!tt,tt){b.pos.set(P.x??0,P.y??0,P.z??0),b.prev.copy(b.pos),b.rootGroup.position.copy(b.pos),b.yaw=P.yaw??b.yaw,b.rootGroup.rotation.y=b.yaw;continue}if(!Z)continue;b.prev.copy(b.pos),b.pos.x=ci(b.pos.x,P.x??0,22,T),b.pos.y=ci(b.pos.y,P.y??0,24,T),b.pos.z=ci(b.pos.z,P.z??0,22,T),b.rootGroup.position.copy(b.pos);const j=b.pos.x-b.prev.x,mt=b.pos.z-b.prev.z,q=Math.hypot(j,mt)/Math.max(T,1e-4);b.speed=ci(b.speed,q,9,T),b.yaw+=Mv(b.yaw,P.yaw??0)*Math.min(1,T*16),b.rootGroup.rotation.y=b.yaw,b.stride+=b.speed*T*2.1;const K=Math.min(1,b.speed/7),B=Math.sin(b.stride*2)*.035*K,at=Math.sin(b.stride)*.05*K;b.breathe+=T*1.3,b.body.position.y=B+Math.sin(b.breathe)*.008,b.body.rotation.z=-at*.5,b.body.rotation.x=-K*.11-Math.sin(b.stride*2+1)*.015;for(const H of b.legs){const F=b.stride+(H.side>0?Math.PI:0);H.hip.rotation.x=Math.sin(F)*.62*K,H.knee.rotation.x=-Math.max(0,-Math.sin(F-.6))*.85*K}let $=0,ft=0;if(b.slapT>=0){b.slapT+=T/(.62/b.slapPower);const H=b.slapT;if(H>=1)b.slapT=-1;else if(H<.34){const F=H/.34;$=-.9*me(0,1,F),ft=-.34*me(0,1,F)}else if(H<.52){const F=(H-.34)/.18;$=-.9+2.6*me(0,1,F),ft=-.34+.72*me(0,1,F)}else{const F=(H-.52)/.48;$=1.7*(1-me(0,1,F)),ft=.38*(1-me(0,1,F))}}b.body.rotation.y=ft*b.slapSide;for(const H of b.arms){const F=b.stride+(H.side>0?0:Math.PI),lt=Math.sin(F)*.5*K,A=H.side===b.slapSide?$:$*-.22;H.shoulder.rotation.x=lt+A*.55,H.shoulder.rotation.z=H.side*(.16+Math.abs(A)*.42),H.shoulder.rotation.y=H.side*A*.9,H.wrist.rotation.x=.28+Math.abs(lt)*.4-A*.5;const w=H.glove.userData.tassel;w.rotation.x=ci(w.rotation.x,A*.8+K*.3,12,T),w.rotation.z=ci(w.rotation.z,-H.side*.2-A*.3,10,T)}const At=b.baseScale;if(b.hitT>=0)if(b.hitT+=T/.26,b.hitT>=1)b.hitT=-1,b.body.scale.set(At.x,At.y,At.z);else{const H=Math.sin(b.hitT*Math.PI),F=1+H*.16*b.hitPower;b.body.scale.set(At.x*F,At.y*(1-H*.13*b.hitPower),At.z*F*.94),b.body.rotation.x-=H*.22*b.hitPower}const It=(P.awakenedT??0)>0?1:0;b.awaken=ci(b.awaken,It,5,T);const Gt=.72+.28*Math.sin(U*6.2),xt=b.activeSlot===0;b.mats.seamMain.emissiveIntensity=b.awaken*(xt?2.6:.5)*Gt,b.mats.seamOff.emissiveIntensity=b.awaken*(xt?.5:2.6)*Gt,b.mats.paint.emissive.setHex(Ut.crackCore),b.mats.paint.emissiveIntensity=b.awaken*.35*Gt,b.mats.paintSurface.emissive.setHex(Ut.crackCore),b.mats.paintSurface.emissiveIntensity=b.awaken*.35*Gt;const N=(P.invulnT??0)>0?.55+.2*Math.sin(U*9):1;for(const H of _v){const F=b.mats[H];if(!F)continue;const lt=N<.999;F.transparent!==lt&&(F.transparent=lt,F.needsUpdate=!0),F.opacity=N}const S=Math.max(0,b.pos.y);b.contact.position.y=.02-b.pos.y;const G=1-Math.min(1,S/3.2);b.contact.material.opacity=.34*G*G*N,b.contact.scale.setScalar(b.contactScale*(1+S*.22)),b.contact.visible=b.pos.y>-1.5&&G>.02}},ghostRoot:L,get ghostCount(){return E},syncGhosts(T){const U=Array.isArray(T)?T:[];let z=0;for(const b of U){if(!b||typeof b!="object")continue;if(z>=dv)break;const P=D[z]??W();z++;const Z=b.ownerId!=null?p.get(b.ownerId):null,tt=Number.isFinite(b.ttl)?b.ttl:0,j=Number.isFinite(b.ttl0)&&b.ttl0>0?b.ttl0:Math.max(tt,.001),mt=yv(tt/j);P.group.visible=!0,P.group.position.set(b.x??0,b.y??0,b.z??0),P.group.rotation.y=b.yaw??0;const q=(Z==null?void 0:Z.baseScale)??_,K=1+(1-mt)*.07;P.group.scale.set(q.x*K,q.y*K,q.z*K);const B=Z?Z.mats.paint.color:V;P.mat.color.copy(I).lerp(B,.28),P.mat.opacity=(b.fake?.46:.3)*mt*(.5+.5*mt)}for(let b=z;b<D.length;b++)D[b].group.visible=!1;return E=z,L.visible=z>0,z},dispose(){var T;for(const U of p.values())R(U);p.clear();for(const U of D)U.mat.dispose();D.length=0,E=0,i.remove(r);for(const U of o)(T=U.dispose)==null||T.call(U);u.dispose()}}}const wv=["leather","metal","paint"],bv={cotton:{bulk:1.04,curl:.26,cuff:1,spread:1.06,thumb:.95},granite:{bulk:1.24,curl:.1,cuff:1.18,spread:.92,thumb:1.1},gale:{bulk:.9,curl:.3,cuff:.86,spread:1.14,thumb:.9},frost:{bulk:.98,curl:.16,cuff:1.04,spread:1,thumb:1},spring:{bulk:1.02,curl:.38,cuff:.94,spread:.96,thumb:1.05},afterimage:{bulk:.88,curl:.22,cuff:.9,spread:1.1,thumb:.88},magnet:{bulk:1.1,curl:.14,cuff:1.08,spread:.94,thumb:1.12},meteor:{bulk:1.16,curl:.2,cuff:1.12,spread:.98,thumb:1.08}},Ev={bulk:1,curl:.2,cuff:1,spread:1,thumb:1},Oe={back:.94,palm:1.16,finger:1.02,tip:1.1,cuff:.86,metal:1,paint:1};function Tv(i,t){const e=i.attributes.position.count,n=new Float32Array(e*3),s=typeof t=="number"?t:(t==null?void 0:t.r)??1,r=typeof t=="number"?t:(t==null?void 0:t.g)??1,o=typeof t=="number"?t:(t==null?void 0:t.b)??1;for(let a=0;a<e;a++)n[a*3]=s,n[a*3+1]=r,n[a*3+2]=o;return i.setAttribute("color",new Se(n,3)),i}function Bi(i){i.updateWorldMatrix(!0,!0);const t=new Map;i.traverse(n=>{if(!n.isMesh)return;const s=n.userData.matKey??"leather",r=n.geometry.clone();if(r.applyMatrix4(n.matrixWorld),Tv(r,n.userData.tone??1),!r.index){const o=r.attributes.position.count,a=new Array(o);for(let l=0;l<o;l++)a[l]=l;r.setIndex(a)}t.has(s)||t.set(s,[]),t.get(s).push(r)});const e=new Map;for(const[n,s]of t){const r=Er(s,!1);for(const o of s)o.dispose();r&&(r.computeBoundingSphere(),e.set(n,r))}return e}function Av({hand:i,shape:t,quality:e}){const n=Math.max(5,Math.min(9,e.capsuleSegments-3)),s={...Ev,...t},r=new Kt,o=[],a=(I,V,W,T)=>{const U=new Yt(V,null);return U.userData.matKey=W,U.userData.tone=T,I.add(U),o.push(V),U},l=s.bulk,c=.22*s.cuff,u=a(r,new be(.15*l,.19*l,c,n+2,1,!1),"leather",Oe.cuff);u.position.y=-.36;const h=a(r,new Ze(.163*l,.026,4,n+6),"paint",Oe.paint);h.rotation.x=Math.PI/2,h.position.y=-.3;const d=a(r,new Ze(.172*l,.017,4,n+6),"leather",Oe.cuff);d.rotation.x=Math.PI/2,d.position.y=-.42;const f=new De(.2,n+3,n+1),g=a(r,f,"leather",Oe.back);g.position.y=-.05,g.scale.set(1.04*l,1.12*l,.56*l);const v=a(r,new De(.2,n+2,n),"leather",Oe.palm);v.position.set(0,-.06,-.055*l),v.scale.set(.86*l,.94*l,.3*l);const m=a(r,new De(.2,n,n-1),"leather",Oe.palm*.98);m.position.set(i*.11*l,-.16,-.02),m.scale.set(.42*l,.46*l,.3*l);const p=a(r,new Ze(.17*l,.026,5,n+6,Math.PI*1.1),"metal",Oe.metal);p.rotation.set(0,0,Math.PI*.96),p.position.set(0,.1,-.02);for(let I=0;I<2;I++)a(r,new De(.028,5,4),"metal",Oe.metal).position.set(i*(.07-I*.14)*l,-.2,-.06);const y=a(r,new De(.2,n,n-1),"paint",Oe.paint);y.position.set(0,-.04,.075*l),y.scale.set(.5*l,.2*l,.1*l),y.rotation.z=i*.3;const M=[.2,.225,.2,.155],x=[.045,.047,.043,.037],Y=[];for(let I=0;I<4;I++){const V=M[I]*l,W=x[I]*l,T=i*(.108-I*.072)*s.spread*l,U=new Kt;U.position.set(T,.1*l,-.01),U.rotation.z=-i*(I-1.5)*.07,U.rotation.x=-s.curl*.5,r.add(U);const z=a(U,new pn(W,V*.62,2,n),"leather",Oe.finger);z.position.y=V*.31+W*.4;const b=new Kt;b.position.y=V*.62+W*.5,b.rotation.x=-s.curl,U.add(b);const P=a(b,new pn(W*.88,V*.44,2,n),"leather",Oe.finger);P.position.y=V*.22;const Z=a(b,new De(W*.92,n,n-2),"leather",Oe.tip);Z.position.y=V*.44+W*.2,Z.scale.set(1,1.08,.92);const tt=a(U,new De(W*1.16,n,n-2),"leather",Oe.finger);tt.position.y=W*.2,Y.push({joint:U,tipObj:Z,length:V})}const R=new Kt;R.position.set(i*.17*l,-.16,-.035),R.rotation.z=-i*.62,R.rotation.x=-.16,r.add(R);const L=a(R,new pn(.05*l*s.thumb,.11*l,2,n),"leather",Oe.finger);L.position.y=.07*l;const D=new Kt;D.position.y=.15*l,D.rotation.z=i*.34,R.add(D);const E=a(D,new pn(.045*l*s.thumb,.09*l,2,n),"leather",Oe.finger);E.position.y=.055*l;const _=a(D,new De(.047*l*s.thumb,n,n-2),"leather",Oe.tip);return _.position.y=.115*l,{root:r,fingers:Y,thumbTip:_,born:o}}function Cv({quality:i,textures:t}){var a,l,c,u,h;const e=[],n=d=>(e.push(d),d),s=n(new se({color:new ut(Ut.leather).lerp(new ut(Ut.leatherWorn),.5),map:null,roughnessMap:((a=t==null?void 0:t.leather)==null?void 0:a.rough)??null,normalMap:i.normalMaps?((l=t==null?void 0:t.leather)==null?void 0:l.normal)??null:null,normalScale:new Et(.85,.85),roughness:.76,metalness:0,vertexColors:!0,envMapIntensity:.6})),r=n(new se({color:new ut(Ut.metal),roughnessMap:((c=t==null?void 0:t.metal)==null?void 0:c.rough)??null,normalMap:i.normalMaps?((u=t==null?void 0:t.metal)==null?void 0:u.normal)??null:null,normalScale:new Et(.5,.5),roughness:.44,metalness:.9,vertexColors:!0,envMapIntensity:.9})),o=n(new se({color:new ut(Ut.rockBody).lerp(new ut(Ut.grime),.35),roughnessMap:((h=t==null?void 0:t.leather)==null?void 0:h.rough)??null,roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.22}));return{leather:s,metal:r,locked:o,build({gloveId:d,hand:f=1,ident:g,unlocked:v=!0}){var D,E;const{root:m,fingers:p,born:y}=Av({hand:f,shape:bv[d],quality:i}),M=Bi(m);for(const _ of y)_.dispose();const x=new se({color:(g??new ut(16777215)).clone(),roughnessMap:((D=t==null?void 0:t.cloth)==null?void 0:D.rough)??null,normalMap:i.normalMaps?((E=t==null?void 0:t.cloth)==null?void 0:E.normal)??null:null,normalScale:new Et(.35,.35),roughness:.82,metalness:0,vertexColors:!0,envMapIntensity:.3}),Y=new ve;Y.name=`palm:${d}`;const R={};for(const _ of wv){const I=M.get(_);if(!I)continue;const V=v?_==="metal"?r:_==="paint"?x:s:o,W=new Yt(I,V);W.castShadow=i.shadows&&(_==="leather"||i.propShadows),W.receiveShadow=!1,Y.add(W),R[_]=W}m.updateWorldMatrix(!0,!0);const L=p.map(_=>{const I=new k;_.tipObj.getWorldPosition(I);const V=new k;return _.joint.getWorldPosition(V),{tip:I,base:V,dir:I.clone().sub(V).normalize(),length:_.length}});return Y.userData={gloveId:d,hand:f,paint:x,meshes:R,fingers:L,handGeometry:M.get("leather")??null},{group:Y,paint:x,meshes:R,fingers:L,setLocked(_){for(const[I,V]of Object.entries(R))V.material=_?o:I==="metal"?r:I==="paint"?x:s},dispose(){for(const _ of Object.values(R))_.geometry.dispose();x.dispose()}}},dispose(){var d;for(const f of e)(d=f.dispose)==null||d.call(f)}}}const je=Math.PI*2,Rv=Object.freeze({cotton:"fluff",granite:"grit",gale:"streak",frost:"mist",spring:"coil",afterimage:"ghost",magnet:"pull",meteor:"ember"});function Pv(i){return Rv[i]??"fluff"}const Iv=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,Lv=`
  uniform sampler2D uNoise;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float head = smoothstep(0.0, 0.22, vUv.x);
    float tail = 1.0 - smoothstep(0.58, 1.0, vUv.x);
    float n = texture2D(uNoise, vec2(vUv.x * 1.7 - uTime * 0.55, vUv.y * 0.5 + uTime * 0.1)).r;
    float a = head * tail * uOpacity * (0.35 + n * 1.1);
    if (a < 0.006) discard;
    gl_FragColor = vec4(uColor * (0.7 + n * 0.6), clamp(a, 0.0, 1.0));
  }
`;function Dv(i,t,e){return i+(t-i)*e}function Dc({root:i,budget:t,texture:e,blending:n,renderOrder:s,rand:r}){const o=As({scene:i,budget:t,texture:e,blending:n,depthWrite:!1,renderOrder:s}),a=o.budget,l=new Float32Array(a),c=new Float32Array(a),u=new Float32Array(a),h=new Float32Array(a),d=[l,c,u,h];return{ps:o,emit(f,g,v,m){const p=Sr(o,f,g,v,m,r);return p<0?-1:(l[p]=m.gravity??0,c[p]=m.sway??0,u[p]=m.swayFreq??1.2,h[p]=r()*je,p)},update(f,g,v){const m=o.arrays;for(let p=o.count-1;p>=0;p--){o.life[p]+=f;const y=o.life[p]/o.maxLife[p];if(y>=1){const L=o.count-1;if(p!==L)for(const D of d)D[p]=D[L];Za(o,p);continue}const M=Math.exp(-o.drag[p]*f);o.vel[p*3]*=M,o.vel[p*3+2]*=M,o.vel[p*3+1]=o.vel[p*3+1]*M+l[p]*f;const x=c[p];m.pos[p*3]+=(o.vel[p*3]+Math.sin(g*u[p]+h[p])*x)*f,m.pos[p*3+1]+=o.vel[p*3+1]*f,m.pos[p*3+2]+=(o.vel[p*3+2]+Math.cos(g*u[p]*.83+h[p])*x)*f,m.rot[p]+=o.spin[p]*f,m.size[p]=o.baseSize[p]+o.grow[p]*y;const Y=Math.min(1,y/.16),R=1-Math.max(0,(y-.55)/.45);if(m.alpha[p]=o.baseAlpha[p]*Y*R*R,v){const L=v(y);m.color[p*3]=L.r,m.color[p*3+1]=L.g,m.color[p*3+2]=L.b}}Ka(o)},setPixelScale(f){o.mat.uniforms.uPixelScale.value=f},dispose(){o.dispose()}}}function Uv({root:i,quality:t,textures:e,seed:n=20240501}){const s=Mi(n+733),r=t.name==="low",o=r?.45:t.name==="mid"?.75:1,a=new ve;a.name="hub-vfx",i.add(a);const l=Dc({root:a,budget:Math.max(48,Math.round(t.dustBudget*.42)),texture:(e==null?void 0:e.dust)??null,blending:He,renderOrder:3,rand:s}),c=Dc({root:a,budget:Math.max(16,Math.round(t.emberBudget*.5)),texture:(e==null?void 0:e.ember)??null,blending:Xi,renderOrder:4,rand:s});t.bloom&&(c.ps.points.layers.enable(Ar),c.ps.points.userData.bloomSelf=!0);const u=new ut(16773586),h=new ut(Ut.crackDeep),d=new ut(Ut.grime).lerp(new ut(Ut.rockBody),.35),f=new ut,g=T=>f.copy(u).lerp(h,Math.min(1,T*1.4)),v=[],m=T=>(v.push(T),T),p=m(new wn(.055,0)),y=m(new Wa(.09,0)),M=m(new Ze(.34,.012,4,28)),x=m(new Bn(1,1));function Y(T){const U=T.tint.clone().lerp(new ut(16774365),.55);let z=0;return{kind:"fluff",update(b){z+=b.dt*b.intensity*o;const P=.2;for(;z>P;){z-=P;const Z=s()*je,tt=.15+s()*.45;l.emit(b.anchor.x+Math.cos(Z)*tt,b.anchor.y-.15+s()*.5,b.anchor.z+Math.sin(Z)*tt,{vx:(s()-.5)*.16,vy:.05+s()*.12,vz:(s()-.5)*.16,life:3.2+s()*2.4,spin:(s()-.5)*.5,grow:.4+s()*.5,drag:.5,size:.22+s()*.26,alpha:.2+s()*.16,gravity:.02,sway:.16+s()*.18,swayFreq:.5+s()*.7,color:U})}},dispose(){}}}function R(T){const U=r?4:t.name==="mid"?6:8,z=new se({color:new ut(Ut.rockBody).lerp(T.tint,.3),roughness:.98,metalness:0,flatShading:!0,envMapIntensity:.2}),b=new rn(p,z,U);b.instanceMatrix.setUsage(Le),b.castShadow=t.shadows&&t.propShadows,b.frustumCulled=!1,T.host.add(b);const P=Array.from({length:U},(j,mt)=>({angle:mt/U*je+s()*.4,radius:.3+s()*.34,height:-.1+s()*.55,speed:.25+s()*.35,bob:s()*je,scale:.6+s()*.9,spin:new k(s()*2,s()*2,s()*2)})),Z=new Kt;let tt=0;return{kind:"grit",update(j){for(let mt=0;mt<P.length;mt++){const q=P[mt];q.angle+=q.speed*j.dt*(.4+j.intensity*.6);const K=q.height+Math.sin(j.time*.7+q.bob)*.06;Z.position.set(Math.cos(q.angle)*q.radius,j.localPalmY+K,Math.sin(q.angle)*q.radius),Z.rotation.set(q.spin.x+j.time*.5,q.spin.y+j.time*.35,q.spin.z+j.time*.28),Z.scale.setScalar(q.scale*(.7+j.intensity*.4)),Z.updateMatrix(),b.setMatrixAt(mt,Z.matrix)}if(b.instanceMatrix.needsUpdate=!0,tt+=j.dt*j.intensity*o,tt>.55){tt=0;const mt=P[Math.floor(s()*P.length)];l.emit(j.anchor.x+Math.cos(mt.angle)*mt.radius,j.anchor.y+mt.height,j.anchor.z+Math.sin(mt.angle)*mt.radius,{vx:(s()-.5)*.1,vy:-.1,vz:(s()-.5)*.1,life:1.4+s()*1.1,spin:(s()-.5)*1.2,grow:.35,drag:1.1,size:.09+s()*.1,alpha:.24,gravity:-.55,sway:.03,color:d})}},dispose(){T.host.remove(b),b.dispose(),z.dispose()}}}function L(T){const U=[],z=r?2:3;for(let P=0;P<z;P++){const Z=new Ze(.36+P*.09,.016,3,30,Math.PI*(1.05+s()*.35)),tt=new Ee({vertexShader:Iv,fragmentShader:Lv,transparent:!0,depthWrite:!1,side:Ie,blending:He,uniforms:{uNoise:{value:(e==null?void 0:e.turbulence)??null},uColor:{value:T.tint.clone().lerp(new ut(14678e3),.35)},uOpacity:{value:.55},uTime:{value:0}}}),j=new Yt(Z,tt);j.rotation.x=Math.PI/2+(s()-.5)*.5,j.renderOrder=2,T.host.add(j),U.push({mesh:j,mat:tt,geo:Z,speed:1.1+P*.55,tilt:(s()-.5)*.4,lift:P*.16})}let b=0;return{kind:"streak",update(P){for(const Z of U)Z.mesh.position.y=P.localPalmY-.1+Z.lift,Z.mesh.rotation.y+=Z.speed*P.dt*(.5+P.intensity*.8),Z.mesh.rotation.z=Math.sin(P.time*.8+Z.lift*6)*.18+Z.tilt,Z.mat.uniforms.uTime.value=P.time,Z.mat.uniforms.uOpacity.value=.32+P.intensity*.42;if(b+=P.dt*P.intensity*o,b>.22){b=0;const Z=s()*je,tt=.42;l.emit(P.anchor.x+Math.cos(Z)*tt,P.anchor.y+(s()-.4)*.4,P.anchor.z+Math.sin(Z)*tt,{vx:-Math.sin(Z)*2.2,vy:.1,vz:Math.cos(Z)*2.2,life:.5+s()*.35,spin:2.5,grow:.1,drag:1.6,size:.07+s()*.06,alpha:.3,gravity:0,sway:0,color:T.tint.clone().lerp(new ut(16777215),.4)})}},dispose(){for(const P of U)T.host.remove(P.mesh),P.geo.dispose(),P.mat.dispose()}}}function D(T){const U=new se({color:T.tint.clone().lerp(new ut(16777215),.35),roughness:.18,metalness:0,transparent:!0,opacity:.72,envMapIntensity:1.1,flatShading:!0}),z=r?3:5,b=new rn(y,U,z);b.instanceMatrix.setUsage(Le),b.castShadow=t.shadows&&t.propShadows,b.frustumCulled=!1,T.host.add(b);const P=new Kt,Z=[];for(let q=0;q<z;q++){const K=q/z*je+s()*.5;Z.push({angle:K,radius:.4+s()*.12,rot:new k(s()*.5,s()*je,s()*.6),scale:new k(.7+s()*.6,1.2+s()*.9,.7+s()*.5)})}const tt=T.tint.clone().lerp(new ut(15398655),.5);let j=0,mt=!1;return{kind:"mist",update(q){mt||(mt=!0,Z.forEach((B,at)=>{P.position.set(Math.cos(B.angle)*B.radius,q.pedestalTopY+.04,Math.sin(B.angle)*B.radius),P.rotation.set(B.rot.x,B.rot.y,B.rot.z),P.scale.copy(B.scale),P.updateMatrix(),b.setMatrixAt(at,P.matrix)}),b.instanceMatrix.needsUpdate=!0),U.opacity=.5+.22*Math.sin(q.time*.9)*q.intensity,j+=q.dt*q.intensity*o;const K=.16;for(;j>K;){j-=K;const B=s()*je,at=.1+s()*.45;l.emit(q.anchor.x+Math.cos(B)*at,q.anchor.y-.05+s()*.35,q.anchor.z+Math.sin(B)*at,{vx:Math.cos(B)*.22,vy:-.08,vz:Math.sin(B)*.22,life:2.2+s()*1.6,spin:(s()-.5)*.4,grow:.7+s()*.6,drag:1.3,size:.2+s()*.3,alpha:.14+s()*.12,gravity:-.16,sway:.05,swayFreq:.4,color:tt})}},dispose(){T.host.remove(b),b.dispose(),U.dispose()}}}function E(T){const U=[],b=r?28:52;for(let $=0;$<=b;$++){const ft=$/b,At=ft*je*3.2,It=.26-ft*.06;U.push(new k(Math.cos(At)*It,ft*.46,Math.sin(At)*It))}const P=new xu(U),Z=new Ya(P,r?40:84,.022,5,!1),tt=new se({color:T.tint.clone().lerp(new ut(Ut.metalWarm),.4),roughness:.36,metalness:.85,envMapIntensity:.9}),j=new Yt(Z,tt);j.castShadow=t.shadows&&t.propShadows,T.host.add(j);const mt=new gn({color:T.tint.clone().lerp(new ut(16777215),.25),transparent:!0,opacity:0,depthWrite:!1}),q=new Yt(M,mt);q.rotation.x=-Math.PI/2,T.host.add(q);let K=0,B=-1;const at={kind:"coil",palmOffset:0,update($){K+=$.dt*(.75+$.intensity*.55);const ft=K%1,At=ft<.62?Math.pow(ft/.62,1.6):1-Math.pow((ft-.62)/.38,.55);j.scale.y=1-At*.42,j.position.y=$.localPalmY-.62,j.rotation.y=K*1.4,at.palmOffset=(1-At)*.09*$.intensity,ft>.62&&B<0&&(B=0),B>=0&&(B+=$.dt*2.6,B>=1?(B=-1,mt.opacity=0,q.visible=!1):(q.visible=!0,q.position.y=$.localPalmY-.66,q.scale.setScalar(.5+B*1.5),mt.opacity=.4*(1-B)*$.intensity))},dispose(){T.host.remove(j),T.host.remove(q),Z.dispose(),tt.dispose(),mt.dispose()}};return at}function _(T){const U=T.handGeometry,z=r?1:2,b=[];for(let tt=0;tt<z;tt++){const j=new se({color:T.tint.clone().lerp(new ut(2761528),.35),roughness:.9,metalness:0,transparent:!0,opacity:0,depthWrite:!1,envMapIntensity:.3}),mt=U?new Yt(U,j):new Kt;mt.renderOrder=2,T.host.add(mt),b.push({mesh:mt,mat:j,t:-1,dx:0,dz:0,yaw:0})}let P=.4,Z=0;return{kind:"ghost",update(tt){if(P+=tt.dt*tt.intensity,P>1.15){P=0;const j=b[Z%b.length];Z++;const mt=s()*je,q=.22+s()*.2;j.dx=Math.cos(mt)*q,j.dz=Math.sin(mt)*q,j.yaw=(s()-.5)*.7,j.t=0}for(const j of b){if(j.t<0){j.mesh.visible=!1;continue}if(j.t+=tt.dt/.7,j.t>=1){j.t=-1,j.mesh.visible=!1;continue}const mt=1-j.t;j.mesh.visible=!0,j.mesh.position.set(j.dx*mt,tt.localPalmY+.04*(1-mt),j.dz*mt),j.mesh.rotation.y=j.yaw*mt,j.mesh.scale.setScalar(.96+.06*j.t),j.mat.opacity=.42*mt*mt*tt.intensity}},dispose(){for(const tt of b)T.host.remove(tt.mesh),tt.mat.dispose()}}}function I(T){const U=r?6:10,z=8,b=U*z*2,P=new Float32Array(b*3),Z=new Float32Array(b*4),tt=[];for(let ft=0;ft<U;ft++){const At=ft/U*je+s()*.25,It=.95+s()*.35,Gt=.25+s()*.3;tt.push({a:At,r0:It,bow:Gt,speed:.55+s()*.5,offset:s()})}const j=new ye,mt=new Se(P,3).setUsage(Le),q=new Se(Z,4).setUsage(Le);j.setAttribute("position",mt),j.setAttribute("color",q);const K=new vu({vertexColors:!0,transparent:!0,depthWrite:!1,blending:He}),B=new Z0(j,K);B.frustumCulled=!1,T.host.add(B);const at=T.tint.clone().lerp(new ut(16766658),.25);let $=0;return{kind:"pull",update(ft){let At=0;for(const It of tt){const Gt=ft.time*.18;for(let xt=0;xt<z;xt++)for(let Tt=0;Tt<2;Tt++){const N=(xt+Tt)/z,S=It.r0*(1-N),G=It.a+Gt+N*.9,H=Dv(.04,ft.localPalmY,N)+Math.sin(N*Math.PI)*It.bow;P[At*3]=Math.cos(G)*S,P[At*3+1]=H,P[At*3+2]=Math.sin(G)*S;const F=(ft.time*It.speed+It.offset)%1,lt=Math.abs(N-F),ot=Math.exp(-(lt*lt)/.012),A=.18+.5*N;Z[At*4]=at.r*(.6+ot*.8),Z[At*4+1]=at.g*(.6+ot*.8),Z[At*4+2]=at.b*(.6+ot*.8),Z[At*4+3]=(A*.5+ot*.55)*ft.intensity,At++}}if(mt.needsUpdate=!0,q.needsUpdate=!0,$+=ft.dt*ft.intensity*o,$>.3){$=0;const It=tt[Math.floor(s()*tt.length)],Gt=It.a+ft.time*.18,xt=Math.cos(Gt)*It.r0,Tt=Math.sin(Gt)*It.r0;l.emit(ft.anchor.x+xt,ft.anchor.y-.3,ft.anchor.z+Tt,{vx:-xt*1.5,vy:.55,vz:-Tt*1.5,life:.75+s()*.3,spin:3,grow:-.03,drag:.4,size:.06+s()*.05,alpha:.55,gravity:.2,sway:0,color:at})}},dispose(){T.host.remove(B),j.dispose(),K.dispose()}}}function V(T){const U=new gn({map:(e==null?void 0:e.crack)??null,color:new ut(Ut.crackCore),transparent:!0,opacity:.3,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),z=new Yt(x,U);z.rotation.x=-Math.PI/2,z.scale.setScalar(1.05),z.renderOrder=2,T.host.add(z);let b=0,P=0;return{kind:"ember",update(Z){for(z.position.y=Z.pedestalTopY+.012,U.opacity=(.18+.14*Math.sin(Z.time*1.6))*Z.intensity,b+=Z.dt*Z.intensity*o;b>.14;){b-=.14;const tt=s()*je,j=s()*.3;c.emit(Z.anchor.x+Math.cos(tt)*j,Z.anchor.y-.25+s()*.3,Z.anchor.z+Math.sin(tt)*j,{vx:(s()-.5)*.24,vy:.5+s()*.55,vz:(s()-.5)*.24,life:1.1+s()*.9,spin:0,grow:-.04,drag:.35,size:.05+s()*.06,alpha:.85,gravity:.25,sway:.12,swayFreq:1.6,color:u})}if(P+=Z.dt*Z.intensity*o,P>.5){P=0;const tt=s()*je;l.emit(Z.anchor.x+Math.cos(tt)*.4,Z.anchor.y+.5,Z.anchor.z+Math.sin(tt)*.4,{vx:(s()-.5)*.1,vy:-.06,vz:(s()-.5)*.1,life:2.4+s()*1.4,spin:(s()-.5)*1.2,grow:.25,drag:.9,size:.07+s()*.07,alpha:.3,gravity:-.22,sway:.1,color:d})}},dispose(){T.host.remove(z),U.dispose()}}}const W={fluff:Y,grit:R,streak:L,mist:D,coil:E,ghost:_,pull:I,ember:V};return{group:a,attach({gloveId:T,host:U,tint:z,handGeometry:b}){const P=Pv(T),Z={gloveId:T,host:U,tint:z??new ut(16777215),handGeometry:b},tt=W[P](Z);return tt.gloveId=T,tt},emitSoft(T,U,z,b){return l.emit(T,U,z,b)},emitEmber(T,U,z,b){return c.emit(T,U,z,b)},update(T,U){l.update(T,U,null),c.update(T,U,g)},setPixelScale(T){l.setPixelScale(T),c.setPixelScale(T)},dispose(){var T;l.dispose(),c.dispose();for(const U of v)(T=U.dispose)==null||T.call(U);i.remove(a)}}}const Uc=.62,Nv=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,Fv=`
  uniform sampler2D uNoise;
  uniform vec3 uSealA;
  uniform vec3 uSealB;
  uniform vec3 uOpenA;
  uniform vec3 uOpenB;
  uniform float uReady;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - vec2(0.5, 0.44);
    // 门洞是个拱：下半直边，上半半圆
    float d = max(abs(p.x) * 2.02, length(vec2(p.x * 2.02, max(0.0, p.y * 1.7))));
    float mask = 1.0 - smoothstep(0.84, 1.0, d);
    if (mask <= 0.002) discard;

    float grain = texture2D(uNoise, vec2(vUv.x * 3.1 - uTime * 0.008, vUv.y * 2.3 - uTime * 0.02)).r;
    float flow = texture2D(uNoise, vec2(vUv.x * 1.25 + uTime * 0.02, vUv.y * 0.9 - uTime * 0.17)).r;

    float bands = 0.5 + 0.5 * sin(vUv.y * 24.0 + grain * 3.4);
    vec3 sealed = mix(uSealA, uSealB, bands * 0.55 + grain * 0.45);
    float sealedA = (0.5 + grain * 0.22) * mask;

    float veil = pow(flow, 1.35);
    float streak = smoothstep(0.3, 0.92, flow * 0.7 + grain * 0.45);
    float edge = smoothstep(0.5, 0.98, d);
    vec3 open = mix(uOpenA, uOpenB, streak);
    float openA = (0.2 + veil * 0.46 + edge * 0.32) * mask;

    vec3 col = mix(sealed, open, uReady);
    float a = mix(sealedA, openA, uReady);
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;function Nc(i,t,e,n){return i+(t-i)*(1-Math.exp(-e*n))}const ki={h:0,s:0,l:0};function Ov(i,t,e){t.getHSL(ki);const n=e>=1?ki.l+(.95-ki.l)*(1-1/e):ki.l*e,s=ki.s*Math.min(1,e*.85+.15);return i.setHSL(ki.h,s,Math.min(.9,Math.max(.02,n)))}function kv(i){const t=i.walkway;return`${i.origin.x.toFixed(2)}|${i.floorY.toFixed(2)}|${t.halfWidth.toFixed(2)}|${t.minZ.toFixed(2)}|${t.maxZ.toFixed(2)}`}function zv({scene:i,quality:t,textures:e,seed:n=20240501}){var N,S,G,H,F,lt,ot,A,w,rt,yt;const s=new ve;s.name="hub",s.visible=!1,i.add(s);const r=Mi(n+8171),o=[],a=J=>(o.push(J),J),l=(J,et,bt)=>{if(!J)return null;const dt=J.clone();return dt.repeat.set(et,bt),dt.needsUpdate=!0,a(dt),dt},c=a(new se({map:l((N=e==null?void 0:e.crust)==null?void 0:N.albedo,1,1),normalMap:t.normalMaps?l((S=e==null?void 0:e.crust)==null?void 0:S.normal,1,1):null,roughnessMap:l((G=e==null?void 0:e.crust)==null?void 0:G.rough,1,1),normalScale:new Et(.85,.85),roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.42})),u=a(new se({map:l((H=e==null?void 0:e.cliff)==null?void 0:H.albedo,2,1),normalMap:t.normalMaps?l((F=e==null?void 0:e.cliff)==null?void 0:F.normal,2,1):null,roughnessMap:l((lt=e==null?void 0:e.cliff)==null?void 0:lt.rough,2,1),normalScale:new Et(.7,.7),roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.3})),h=a(new se({map:l((ot=e==null?void 0:e.cliff)==null?void 0:ot.albedo,1,1),normalMap:t.normalMaps?l((A=e==null?void 0:e.cliff)==null?void 0:A.normal,1,1):null,roughnessMap:l((w=e==null?void 0:e.cliff)==null?void 0:w.rough,1,1),normalScale:new Et(.8,.8),roughness:.96,metalness:0,vertexColors:!0,envMapIntensity:.34})),d=a(new se({name:"hub-inlay",color:new ut(Ut.rockDeep),roughness:.62,metalness:.15,emissive:new ut(Ut.crackCore),emissiveIntensity:.05,envMapIntensity:.5})),f=a(new se({name:"hub-rune",color:new ut(1709072),roughnessMap:l((rt=e==null?void 0:e.cliff)==null?void 0:rt.rough,1,1),roughness:.5,metalness:.25,emissive:new ut(Ut.crackCore),emissiveMap:l(e==null?void 0:e.turbulence,1.6,1.6),emissiveIntensity:.06,envMapIntensity:.6})),g=t.bloom?1.35:.72,v=a(new se({color:new ut(16777215),roughnessMap:((yt=e==null?void 0:e.cloth)==null?void 0:yt.rough)??null,roughness:.85,metalness:0,envMapIntensity:.3})),m=a(new Ee({vertexShader:Nv,fragmentShader:Fv,transparent:!0,depthWrite:!1,side:Ie,blending:He,uniforms:{uNoise:{value:(e==null?void 0:e.turbulence)??null},uSealA:{value:new ut(Ut.rockDeep)},uSealB:{value:new ut(Ut.fog).lerp(new ut(Ut.rockBody),.4)},uOpenA:{value:new ut(Ut.crackDeep).lerp(new ut(Ut.fog),.45)},uOpenB:{value:new ut(Ut.crackCore)},uReady:{value:0},uTime:{value:0}}})),p=Cv({quality:t,textures:e}),y=Uv({root:s,quality:t,textures:e,seed:n}),M=new Ma(Ut.crackLight,0,17,2);M.name="hub-portal-light",i.add(M);let x=null,Y="";function R(J){const et=J.walkway,bt=J.origin.x,dt=J.floorY,Mt=Math.max(6,et.maxZ-et.minZ),Pt=et.halfWidth*2,gt=new Kt,Rt=(zt,ee,ie,Ce)=>{const an=new Yt(zt,null);return an.userData.matKey=ee,an.userData.tone=ie,Ce(an),gt.add(an),an},Ft=Math.max(4,Math.round(Pt/2.7)),X=Math.max(6,Math.round(Mt/2.7)),Q=Pt/Ft,ct=Mt/X,st=new pe(Q-.1,.36,ct-.1),St=new ut;for(let zt=0;zt<X;zt++)for(let ee=0;ee<Ft;ee++){const ie=bt-et.halfWidth+Q*(ee+.5),Ce=et.minZ+ct*(zt+.5),an=r(),_n=Math.min(1,Math.abs(ie-bt)/et.halfWidth),ei=1.14-_n*.24-an*.16;St.setRGB(ei*1.03,ei,ei*(.94+_n*.1)),Rt(st,"deck",St.clone(),is=>{is.position.set(ie,dt-.18+(an-.5)*.028,Ce),is.rotation.y=(r()-.5)*.02})}const O=new pe(.26,.06,ct*.72);for(let zt=0;zt<X;zt++)Rt(O,"inlay",1,ee=>{ee.position.set(bt,dt+.005,et.minZ+ct*(zt+.5))});const wt=new pe(.52,.34,1.4);for(let zt=et.minZ+.8;zt<et.maxZ;zt+=1.55)for(const ee of[-1,1]){if(r()<.11)continue;const ie=.8+r()*.5;Rt(wt,"rock",.82+r()*.2,Ce=>{Ce.position.set(bt+ee*(et.halfWidth+.16),dt+.02+ie*.04,zt),Ce.rotation.set((r()-.5)*.06,(r()-.5)*.09,ee*(r()-.4)*.05),Ce.scale.set(1,ie,1)})}Rt(new pe(Pt+.9,.95,Mt),"rock",.62,zt=>{zt.position.set(bt,dt-.82,(et.minZ+et.maxZ)/2)});const ht=new wn(1,0),pt=t.name==="low"?8:16;for(let zt=0;zt<pt;zt++){const ee=.55+r()*1.5;Rt(ht,"rock",.44+r()*.18,ie=>{ie.position.set(bt+(r()-.5)*Pt*.9,dt-1.5-r()*2.2,et.minZ+r()*Mt),ie.rotation.set(r()*3,r()*3,r()*3),ie.scale.set(ee,ee*(.6+r()*.7),ee)})}const Ct=new be(.34,.46,1,7);for(const zt of[-1,1]){const ee=1.6+r()*1.4;Rt(Ct,"rock",.78+r()*.16,ie=>{ie.position.set(bt+zt*(et.halfWidth-1.1),dt+ee*.5,et.maxZ-1.1),ie.scale.set(1,ee,1),ie.rotation.y=r()*3,ie.rotation.z=zt*.03})}const Lt=Bi(gt);st.dispose(),O.dispose(),wt.dispose(),ht.dispose(),Ct.dispose();const Ot=new ve;Ot.name="hub-walkway";const ne=[],fe={deck:c,rock:u,inlay:d};for(const[zt,ee]of Lt){const ie=new Yt(ee,fe[zt]??u);ie.receiveShadow=t.shadows,ie.castShadow=zt==="rock"&&t.shadows,zt!=="inlay"&&Fn(ie),Ot.add(ie),ne.push(ie)}return s.add(Ot),{group:Ot,dispose(){s.remove(Ot);for(const zt of ne)zt.geometry.dispose()}}}let L=null,D=null,E="";function _(J,et){const bt=new Kt,dt=[],Mt=(gt,Rt,Ft)=>{dt.push(gt);const X=new Yt(gt,null);X.userData.matKey="rock",X.userData.tone=Rt,Ft(X),bt.add(X)};Mt(new be(J*1.12,J*1.2,et*.14,8),.78,gt=>{gt.position.y=et*.07,gt.rotation.y=Math.PI/8}),Mt(new be(J*.84,J*1.02,et*.62,8),.92,gt=>{gt.position.y=et*.46}),Mt(new be(J*.95,J*.86,et*.1,8),1.02,gt=>{gt.position.y=et*.82}),Mt(new be(J*1.08,J*1,et*.12,8),1.16,gt=>{gt.position.y=et*.93,gt.rotation.y=Math.PI/8}),Mt(new wn(J*.3,0),.86,gt=>{gt.position.set(J*.9,et*.2,J*.5),gt.rotation.set(.6,.9,.2),gt.scale.set(1,.7,1)});const Pt=Bi(bt);for(const gt of dt)gt.dispose();return Pt.get("rock")}function I(J,et){const bt=dt=>{const Mt=new Kt,Pt=[],gt=(X,Q)=>{Pt.push(X);const ct=new Yt(X,null);ct.userData.matKey="paint",ct.userData.tone=1,Q(ct),Mt.add(ct)};gt(new Ze(J*1.2,dt?.038:.03,5,22,dt?Math.PI*2:Math.PI),X=>{X.rotation.x=-Math.PI/2,X.position.y=et*1.02});const Rt=dt?[-1,1]:[0];for(const X of Rt)gt(new pe(.075,.26,.075),Q=>{Q.position.set(X*J*.86,et*1.14,dt?0:-J*.86)});const Ft=Bi(Mt);for(const X of Pt)X.dispose();return Ft.get("paint")};return{main:bt(!0),off:bt(!1)}}function V(J,et){const bt=new Kt,dt=[],Mt=(gt,Rt)=>{dt.push(gt);const Ft=new Yt(gt,null);Ft.userData.matKey="paint",Ft.userData.tone=1,Rt(Ft),bt.add(Ft)};Mt(new Ze(J*1.02,.03,4,20),gt=>{gt.rotation.x=-Math.PI/2,gt.position.y=et*.86}),Mt(new pe(J*1,.16,.05),gt=>{gt.position.set(0,et*.56,-J*.98)});const Pt=Bi(bt);for(const gt of dt)gt.dispose();return Pt.get("paint")}let W=null,T=null,U=null;const z=new Map,b=new Kt,P=new ut;function Z(J){var bt,dt;const et=`${J.pedestalRadius.toFixed(3)}|${J.pedestalHeight.toFixed(3)}`;return et===E&&L?!1:(E=et,L==null||L.dispose(),W==null||W.dispose(),(bt=D==null?void 0:D.main)==null||bt.dispose(),(dt=D==null?void 0:D.off)==null||dt.dispose(),L=_(J.pedestalRadius,J.pedestalHeight),W=V(J.pedestalRadius,J.pedestalHeight),D=I(J.pedestalRadius,J.pedestalHeight),!0)}function tt(J){if(T&&T.instanceMatrix.count>=J)return;T&&(s.remove(T),T.dispose(),s.remove(U),U.dispose());const et=Math.max(8,J);T=new rn(L,h,et),T.instanceMatrix.setUsage(Le),T.castShadow=t.shadows,T.receiveShadow=t.shadows,T.frustumCulled=!1,T.count=0,Fn(T),s.add(T),U=new rn(W,v,et),U.instanceMatrix.setUsage(Le),U.frustumCulled=!1,U.count=0,s.add(U)}function j(J,et){const bt=new ve;bt.name=`pedestal:${J.gloveId}`,s.add(bt);const dt=J.row==="left"?-1:1,Mt=new ut(J.tint),Pt=p.build({gloveId:J.gloveId,hand:dt,ident:Mt,unlocked:J.unlocked});Pt.group.position.y=et.pedestalHeight+Uc,bt.add(Pt.group);const gt=new Yt(D.main,Pt.paint);gt.visible=!1,gt.castShadow=t.shadows&&t.propShadows,bt.add(gt);const Rt=new Yt(D.off,Pt.paint);Rt.visible=!1,Rt.castShadow=t.shadows&&t.propShadows,bt.add(Rt);const Ft=y.attach({gloveId:J.gloveId,host:bt,tint:Mt,handGeometry:Pt.group.userData.handGeometry});return{gloveId:J.gloveId,group:bt,palm:Pt,mainMark:gt,offMark:Rt,effect:Ft,ident:Mt,identBase:Mt.clone(),lift:0,bobPhase:r()*Math.PI*2,locked:!J.unlocked,ringKey:"",view:J}}function mt(J){J.effect.dispose(),J.group.remove(J.palm.group),J.palm.dispose(),s.remove(J.group)}function q(J){const et=new Set;for(const bt of J.pedestals){et.add(bt.gloveId);let dt=z.get(bt.gloveId);dt||(dt=j(bt,J),z.set(bt.gloveId,dt)),dt.view=bt,dt.locked!==!bt.unlocked&&(dt.locked=!bt.unlocked,dt.palm.setLocked(dt.locked))}for(const[bt,dt]of z)et.has(bt)||(mt(dt),z.delete(bt))}let K=null,B="",at=0;function $(J){const et=new Kt,bt=[],dt=(ct,st,St,O)=>{bt.push(ct);const wt=new Yt(ct,null);wt.userData.matKey=st,wt.userData.tone=St,O(wt),et.add(wt)},Mt=J+.62,Pt=J*2.25;for(const ct of[-1,1]){dt(new be(.42,.62,Pt,7),"rock",.9,st=>{st.position.set(ct*Mt,Pt*.5,0),st.rotation.y=ct*.3}),dt(new pe(1.5,.42,1.5),"rock",.74,st=>{st.position.set(ct*Mt,.2,0),st.rotation.y=ct*.12});for(let st=0;st<3;st++)dt(new pe(.1,.5,.14),"rune",1,St=>{St.position.set(ct*(Mt-.34),Pt*(.32+st*.2),.02)})}dt(new pe(Mt*2+1.5,.72,1.15),"rock",.96,ct=>{ct.position.set(0,Pt+.3,0)}),dt(new pe(Mt*1.2,.4,.95),"rock",.86,ct=>{ct.position.set(0,Pt+.78,.02)}),dt(new wn(.55,0),"rock",1.04,ct=>{ct.position.set(0,Pt+1.02,0),ct.rotation.set(.4,.7,.2),ct.scale.set(1.2,.8,.9)}),dt(new pe(J*1.1,.16,.14),"rune",1,ct=>{ct.position.set(0,Pt+.32,.6)}),dt(new pe(Mt*2,.07,.3),"rune",1,ct=>{ct.position.set(0,.03,.85)});const gt=Bi(et);for(const ct of bt)ct.dispose();const Rt=new ve;Rt.name="hub-portal";const Ft=[];for(const[ct,st]of gt){const St=new Yt(st,ct==="rune"?f:u);St.castShadow=t.shadows,St.receiveShadow=t.shadows,ct!=="rune"&&Fn(St),ct==="rune"&&t.bloom&&(St.layers.enable(Ar),St.userData.bloomSelf=!0),Rt.add(St),Ft.push(St)}const X=new Bn(J*2.1,Pt*1.02),Q=new Yt(X,m);return Q.position.set(0,Pt*.5,0),Q.renderOrder=2,Rt.add(Q),s.add(Rt),{group:Rt,membrane:Q,membraneGeo:X,meshes:Ft,height:Pt,dispose(){s.remove(Rt);for(const ct of Ft)ct.geometry.dispose();X.dispose()}}}function ft(J){const et=J.portal.radius.toFixed(3);et===B&&K||(B=et,K==null||K.dispose(),K=$(J.portal.radius))}let At=!1,It=0;function Gt(){At&&(At=!1,s.visible=!1,M.intensity=0)}function xt(J,et,bt){let dt=0;for(const Mt of J.pedestals){const Pt=z.get(Mt.gloveId);if(!Pt)continue;Pt.group.position.set(Mt.x,Mt.y,Mt.z),Pt.group.rotation.y=Mt.yaw,b.position.set(Mt.x,Mt.y,Mt.z),b.rotation.set(0,Mt.yaw+Pt.bobPhase%1*.12,0),b.scale.setScalar(1),b.updateMatrix(),T.setMatrixAt(dt,b.matrix),U.setMatrixAt(dt,b.matrix);const gt=Mt.focused&&Mt.unlocked,Rt=Mt.unlocked?gt?1.7:Mt.slot?1.25:.82:.3,Ft=`${Rt.toFixed(2)}`;Pt.ringKey!==Ft&&(Pt.ringKey=Ft,Ov(P,Pt.identBase,Rt),U.setColorAt(dt,P),U.instanceColor&&(U.instanceColor.needsUpdate=!0),Pt.palm.paint.color.copy(P));const X=(gt?.11:0)+(Mt.slot==="main"?.06:Mt.slot==="off"?.03:0);Pt.lift=Nc(Pt.lift,X,7,et);const Q=Mt.unlocked?gt?1.35:Mt.slot?1.12:.85:.16,ct=Math.sin(bt*.9+Pt.bobPhase)*(.018+(gt?.014:0)),st=J.pedestalHeight+Uc+Pt.lift+ct+(Pt.effect.palmOffset??0);Pt.palm.group.position.y=st,Pt.palm.group.rotation.y=Math.sin(bt*.32+Pt.bobPhase)*.09+(gt?.12:0),Pt.mainMark.visible=Mt.slot==="main",Pt.offMark.visible=Mt.slot==="off",Pt.effect.update({dt:et,time:bt,intensity:Q,focused:gt,selected:Mt.slot,localPalmY:st,pedestalTopY:J.pedestalHeight,anchor:{x:Mt.x,y:Mt.y+st,z:Mt.z}}),dt++}T.count=dt,U.count=dt,T.instanceMatrix.needsUpdate=!0,U.instanceMatrix.needsUpdate=!0}function Tt(J,et,bt){const dt=J.portal;K.group.position.set(dt.x,J.floorY,dt.z),at=Nc(at,dt.ready?1:0,2.4,et),m.uniforms.uReady.value=at,m.uniforms.uTime.value=bt;const Mt=.9+Math.sin(bt*1.9)*.06+Math.sin(bt*4.7+1.3)*.04;if(f.emissiveIntensity=(.05+at*g*Mt)*(dt.near?1.15:1),d.emissiveIntensity=.04+at*.42*Mt,M.position.set(dt.x,J.floorY+dt.radius*.9,dt.z+.4),M.intensity=at*13*Mt,at>.35)for(It+=et*at;It>.12;){It-=.12;const Pt=dt.x+(r()-.5)*dt.radius*1.6,gt=dt.z+(r()-.5)*.5;y.emitSoft(Pt,J.floorY+r()*.6,gt,{vx:(r()-.5)*.1,vy:.5+r()*.7,vz:(r()-.5)*.1,life:2+r()*1.6,spin:(r()-.5)*.8,grow:.5,drag:.45,size:.14+r()*.22,alpha:.16+r()*.12,gravity:.12,sway:.18,swayFreq:.9,color:new ut(Ut.crackCore).lerp(new ut(Ut.fog),.45)})}}return{root:s,portalLight:M,pedestals:z,get visible(){return At},sync(J,et=1/60,bt=0){if(!J||!J.active||J.pedestals.length===0)return Gt(),!1;const dt=kv(J);if(dt!==Y&&(Y=dt,x==null||x.dispose(),x=R(J)),Z(J)){for(const[,Mt]of z)mt(Mt);z.clear(),T&&(s.remove(T),T.dispose(),T=null,s.remove(U),U.dispose(),U=null)}return tt(J.pedestals.length),ft(J),q(J),At=!0,s.visible=!0,xt(J,et,bt),Tt(J,et,bt),y.update(et,bt),!0},setPixelScale(J){y.setPixelScale(J)},getStats(){return{visible:At,pedestals:z.size,portalReady:at}},dispose(){var J,et,bt,dt;for(const[,Mt]of z)mt(Mt);z.clear(),x==null||x.dispose(),K==null||K.dispose(),T&&(s.remove(T),T.dispose()),U&&(s.remove(U),U.dispose()),L==null||L.dispose(),W==null||W.dispose(),(J=D==null?void 0:D.main)==null||J.dispose(),(et=D==null?void 0:D.off)==null||et.dispose(),y.dispose(),p.dispose(),i.remove(M),(bt=M.dispose)==null||bt.call(M);for(const Mt of o)(dt=Mt.dispose)==null||dt.call(Mt);i.remove(s)}}}const zi=.92,Bv=.13,Gv=.16;function ms(i){return i<0?0:i>1?1:i}const gs=new ut(.84,.93,1.14),Fc=new ut(1.14,1,.84),Hv=`
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
`,Vv=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;function Wv({scene:i,quality:t,textures:e,arenaRadius:n=20,seed:s=20240501}){const r=new ve;r.name="island",i.add(r);const o=[],a=X=>(o.push(X),X),l=on(s+17),c=Mi(s+99),u=n;function h(X){const Q=oe(l,Math.cos(X)*1.15+41,Math.sin(X)*1.15+41,3)-.5,ct=oe(l,Math.cos(X)*6.5+13,Math.sin(X)*6.5+13,3)-.5;return 1+Q*.17+ct*.035}function d(X){return 1+(h(X)-1)*.5}const f=(X,Q,ct)=>{if(!X)return null;const st=X.clone();return st.repeat.set(Q,ct),st.needsUpdate=!0,a(st),st},g=a(new se({map:f(e.cliff.albedo,4,1.7),normalMap:f(e.cliff.normal,4,1.7),roughnessMap:f(e.cliff.rough,4,1.7),normalScale:new Et(.7,.7),roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.34,fog:!0,side:Ie})),v=a(new se({map:f(e.crust.albedo,.075,.075),normalMap:f(e.crust.normal,.075,.075),roughnessMap:f(e.crust.rough,.075,.075),normalScale:new Et(1.05,1.05),roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.5}));v.onBeforeCompile=X=>{var Q,ct;X.uniforms.uMacro={value:e.arenaMacro},X.uniforms.uMacroScale={value:1/(u*2.15)},X.uniforms.uMacroTexel={value:2/(((ct=(Q=e.arenaMacro)==null?void 0:Q.image)==null?void 0:ct.width)??512)},X.vertexShader=X.vertexShader.replace("#include <common>",`#include <common>
 varying vec3 vMacroPos;`).replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
         vec4 macroLocal = vec4(transformed, 1.0);
         #ifdef USE_INSTANCING
           macroLocal = instanceMatrix * macroLocal;
         #endif
         vMacroPos = (modelMatrix * macroLocal).xyz;`),X.fragmentShader=X.fragmentShader.replace("#include <common>",`#include <common>
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
         }`)},v.customProgramCacheKey=()=>"crust-macro";const m=a(new se({map:f(e.cliff.albedo,.6,1.6),normalMap:f(e.cliff.normal,.6,1.6),roughnessMap:f(e.cliff.rough,.6,1.6),roughness:1,metalness:0,vertexColors:!0,color:new ut(9274743),envMapIntensity:.35})),p=a(new se({map:f(e.crust.albedo,1.4,1.4),roughnessMap:f(e.crust.rough,1.4,1.4),normalMap:f(e.crust.normal,1.4,1.4),roughness:1,metalness:0,color:new ut(9668987),envMapIntensity:.45})),y=[[1,-.62],[1.045,-1.9],[.845,-3.1],[.93,-4.6],[.7,-6.5],[.795,-7.9],[.545,-10.2],[.635,-11.6],[.375,-14.1],[.44,-15.4],[.215,-17.4],[.095,-19.1],[.012,-20]],M=[],x=Math.max(2,Math.floor(t.islandProfileSegments/y.length)+1);for(let X=0;X<y.length-1;X++){const[Q,ct]=y[X],[st,St]=y[X+1];for(let O=0;O<x;O++){const wt=O/x;M.push(new Et(u*(Q+(st-Q)*wt),ct+(St-ct)*wt))}}M.push(new Et(u*y[y.length-1][0],y[y.length-1][1]));const Y=Math.max(18,Math.round(t.islandRadialSegments*.5)),R=a(new Ss(M,Y,0,Math.PI*2));{const X=R.attributes.position,Q=new Float32Array(X.count*3),ct=new ut;for(let st=0;st<X.count;st++){const St=X.getX(st),O=X.getY(st),wt=X.getZ(st),ht=Math.atan2(wt,St),pt=Math.hypot(St,wt),Ct=ms(-O/20),Lt=(oe(l,Math.cos(ht)*1.6+5,Math.sin(ht)*1.6+5,3)-.5)*.44,Ot=(oe(l,Math.cos(ht)*5+1,Math.sin(ht)*5-O*.3,3)-.5)*.11,ne=me(0,.22,Ct),fe=(1-ne)*d(ht)+ne*(1+Lt*(.5+Ct*1.6))+Ot;X.setX(st,St*fe),X.setZ(st,wt*fe),pt>.001&&X.setY(st,O+Ot*2.4);const zt=ms(.5-Ot*7),ee=ms(Ot*9),ie=me(.55,.95,oe(l,ht*5.5+20,O*.06,3));let Ce=1.18-me(.05,.9,Ct)*.5;Ce*=1-zt*.3,Ce*=1+ee*.34,Ce*=1-ie*.28*me(0,.45,Ct),ct.setRGB(1,1,1).lerp(gs,me(.1,.9,Ct)*.5).lerp(Fc,ee*.45).multiplyScalar(Ce),Q[st*3]=ct.r,Q[st*3+1]=ct.g,Q[st*3+2]=ct.b}R.setAttribute("color",new Se(Q,3)),R.computeVertexNormals(),X.needsUpdate=!0}const L=new Yt(R,g);L.name="bedrock",L.receiveShadow=t.shadows,L.castShadow=!1,Fn(L),r.add(L);const D=[];let E=null;const _=new Kt;if(t.rockChunks>0){const X=a(new wn(1,t.name==="low"?0:1));{const Q=X.attributes.position;for(let St=0;St<Q.count;St++){const O=Q.getX(St),wt=Q.getY(St),ht=Q.getZ(St),pt=.7+oe(l,O*1.7+3,ht*1.7+wt,3)*.7;Q.setXYZ(St,O*pt,wt*pt*.8,ht*pt)}X.computeVertexNormals();const ct=new Float32Array(Q.count*3),st=new ut;for(let St=0;St<Q.count;St++)st.setRGB(1,1,1).lerp(gs,.5).multiplyScalar(.62+ms(Q.getY(St)*.5+.5)*.5),ct[St*3]=st.r,ct[St*3+1]=st.g,ct[St*3+2]=st.b;X.setAttribute("color",new Se(ct,3))}E=new rn(X,g,t.rockChunks),E.name="rock-chunks",E.instanceMatrix.setUsage(Le),E.castShadow=!1,E.receiveShadow=!1;for(let Q=0;Q<t.rockChunks;Q++){const ct=c()*Math.PI*2,st=u*(.35+c()*.7),St=-3-c()*13;D.push({x:Math.cos(ct)*st,z:Math.sin(ct)*st,scale:.7+c()*2.4,rot:new k(c()*3,c()*3,c()*3),base:St,amp:.06+c()*.14,phase:c()*6.28,spin:(c()-.5)*.05})}r.add(E),o.push(E)}const I=a(new Ee({vertexShader:Vv,fragmentShader:Hv,side:Ie,fog:!1,uniforms:{uCore:{value:new ut(Ut.crackCore)},uDeep:{value:new ut(Ut.crackDeep)},uNoise:{value:e.turbulence},uTime:{value:0}}})),V=a(new be(u*.995,u*.16,16.4,44,6,!0));{const X=V.attributes.position;for(let Q=0;Q<X.count;Q++){const ct=X.getX(Q),st=X.getY(Q),St=X.getZ(Q),O=Math.atan2(St,ct),wt=1+(oe(l,Math.cos(O)*3.2+11,Math.sin(O)*3.2-st*.22,3)-.5)*.22,pt=1-me(-2.5,5.6,st)*(1-Math.min(1,d(O)));X.setXYZ(Q,ct*wt*pt,st,St*wt*pt)}V.computeVertexNormals()}const W=a(new se({map:f(e.cliff.albedo,4,1.2),roughnessMap:f(e.cliff.rough,4,1.2),normalMap:t.normalMaps?f(e.cliff.normal,4,1.2):null,color:new ut(2827553),roughness:1,metalness:0,side:Ie,envMapIntensity:.04})),T=new Yt(V,W);T.position.y=-zi-8,T.name="crack-shaft",Fn(T),r.add(T);const U=a(new Lr(u*.22,32)),z=new Yt(U,I);z.rotation.x=-Math.PI/2,z.position.y=-16.1,z.name="crack-core",z.layers.enable(Ar),z.userData.bloomSelf=!0,r.add(z);const b=new Kt,P=new ut;let Z=null,tt=null,j=0,mt=0,q=null;const K=a(new gn({color:0}));function B(X){const Q=Math.max(.2,X/2-Bv*.5),ct=Q*.22,st=new Ha;st.moveTo(-Q+ct,-Q),st.lineTo(Q-ct,-Q),st.lineTo(Q,-Q+ct),st.lineTo(Q,Q-ct),st.lineTo(Q-ct,Q),st.lineTo(-Q+ct,Q),st.lineTo(-Q,Q-ct),st.lineTo(-Q,-Q+ct),st.closePath();const St=new Xa(st);St.rotateX(-Math.PI/2);const O=new Va(st,{depth:zi,curveSegments:1,bevelEnabled:t.plateBevel,bevelThickness:.07,bevelSize:.09,bevelOffset:0,bevelSegments:t.name==="high"?2:1,steps:1});O.rotateX(-Math.PI/2),O.computeBoundingBox(),O.translate(0,-O.boundingBox.max.y,0);const wt=O.attributes.position,ht=new Float32Array(wt.count*3),pt=new ut;for(let Ct=0;Ct<wt.count;Ct++){const Lt=wt.getX(Ct),Ot=wt.getY(Ct),ne=wt.getZ(Ct),fe=Math.max(Math.abs(Lt),Math.abs(ne))/Q;let zt=Ot>-.02?1:.52;zt*=1-me(.72,1,fe)*(Ot>-.02?.18:0),pt.setRGB(1,1,1).lerp(gs,Ot>-.02?.06:.34).multiplyScalar(zt),ht[Ct*3]=pt.r,ht[Ct*3+1]=pt.g,ht[Ct*3+2]=pt.b}return O.setAttribute("color",new Se(ht,3)),{geo:O,cap:St}}function at(X,Q){const ct=Math.max(64,Math.ceil(Q*1.15));if(Z&&X===mt&&ct<=j)return!1;Z&&(r.remove(Z),Z.dispose(),tt.dispose(),r.remove(q),q.geometry.dispose()),mt=X,j=ct;const st=B(X);return tt=st.geo,Z=new rn(tt,[v,m],ct),Z.name="deck",Z.instanceMatrix.setUsage(Le),Z.castShadow=t.shadows,Z.receiveShadow=t.shadows,Z.frustumCulled=!1,Z.count=0,r.add(Z),q=new rn(st.cap,K,ct),q.name="deck-occluder",q.instanceMatrix=Z.instanceMatrix,q.frustumCulled=!1,q.count=0,q.visible=!1,q.userData.emissiveOnly=!0,Fn(q),r.add(q),!0}const $=new Map,ft=new Map,At=new Map,It=[];let Gt=0;const xt=new Set;let Tt=!1,N={origin:-u,tileSize:2.5};function S(X,Q){const ct=Math.floor((X-N.origin)/N.tileSize),st=Math.floor((Q-N.origin)/N.tileSize);return`${ct},${st}`}function G(X){if(!Z)return;const Q=X.fall;if(Q>=1)b.position.set(X.x,-60,X.z),b.rotation.set(0,0,0),b.scale.setScalar(0);else{const ct=X.displayCrack,st=ct*.14+(X.seam?.05:0);b.position.set(X.x,X.baseY-st-Q*Q*30,X.z),b.rotation.set(X.tiltX*(ct*.05+Q*1.5),X.yaw,X.tiltZ*(ct*.05+Q*1.35));const St=X.seam?1-Gv/Math.max(mt,.01):1;b.scale.set(St,1,1)}b.updateMatrix(),Z.setMatrixAt(X.slot,b.matrix),Tt=!0}function H(X){if(!Z)return;const ct=.82+oe(l,X.x*.085+21,X.z*.085+21,3)*.36,st=1-X.displayCrack*.3;P.setRGB(1,1,1).lerp(Fc,ms(.3-X.radial*.3)*.5).lerp(gs,X.seam?.22:0).multiplyScalar(ct*st),Z.setColorAt(X.slot,P),Z.instanceColor&&(Z.instanceColor.needsUpdate=!0)}const F=Math.max(0,t.decalBudget|0),lt=a(new Bn(1,1)),ot=new ma(new Float32Array(F),1);ot.setUsage(Le),lt.setAttribute("aFade",ot);const A=a(new gn({map:e.crack,transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2,toneMapped:!1}));A.onBeforeCompile=X=>{X.vertexShader=X.vertexShader.replace("#include <common>",`#include <common>
attribute float aFade;
varying float vFade;`).replace("#include <begin_vertex>",`#include <begin_vertex>
	vFade = aFade;`),X.fragmentShader=X.fragmentShader.replace("#include <common>",`#include <common>
varying float vFade;`).replace("#include <map_fragment>",`#include <map_fragment>
	diffuseColor.a *= vFade;`)};const w=new rn(lt,A,F);w.name="tile-damage",w.instanceMatrix.setUsage(Le),w.frustumCulled=!1,w.renderOrder=2,w.visible=!1,r.add(w),o.push(w);const rt=new jt().makeScale(0,0,0),yt=new Kt,J=[];for(let X=F-1;X>=0;X--)J.push(X),w.setMatrixAt(X,rt);let et=0,bt=!1;function dt(X){if(J.length===0||!e.crack||X.decals.length>=2)return;const Q=J.pop();yt.rotation.set(-Math.PI/2,0,c()*Math.PI*2);const ct=mt*.3;yt.position.set(X.x+(c()-.5)*ct,.014+X.decals.length*.004,X.z+(c()-.5)*ct);const st=mt*(.7+c()*.5);yt.scale.set(st,st,st),yt.updateMatrix(),ot.array[Q]=0,ot.needsUpdate=!0,X.decals.push({slot:Q,fade:0,shown:!1,matrix:yt.matrix.clone()})}function Mt(X){for(const Q of X.decals)ot.array[Q.slot]=0,Q.shown&&(w.setMatrixAt(Q.slot,rt),bt=!0,et--),J.push(Q.slot);X.decals.length>0&&(ot.needsUpdate=!0),X.decals.length=0}const Pt=new ve;r.add(Pt);{const X=t.name==="low"?14:26,Q=a(new be(.17,.3,1,5,2));{const pt=Q.attributes.position;for(let Ct=0;Ct<pt.count;Ct++){const Lt=pt.getX(Ct),Ot=pt.getY(Ct),ne=pt.getZ(Ct),fe=.88+oe(l,Lt*5+7,(Ot+ne)*5+7,2)*.26;pt.setXYZ(Ct,Lt*fe,Ot+(oe(l,Lt*4,ne*4,2)-.5)*.12,ne*fe)}Q.computeVertexNormals(),Q.translate(0,.5,0)}const ct=[];for(let pt=0;pt<X;pt++){const Ct=pt/X*Math.PI*2+.11;c()<.16||ct.push(Ct)}const st=new rn(Q,p,ct.length);st.instanceMatrix.setUsage(Le);const St=new Kt;ct.forEach((pt,Ct)=>{const Lt=(u+1.8)*d(pt);St.position.set(Math.cos(pt)*Lt,-.7,Math.sin(pt)*Lt),St.rotation.set((c()-.5)*.3,pt+(c()-.5)*.7,(c()-.5)*.34);const Ot=.9+c()*.7;St.scale.set(.86+c()*.34,Ot,.86+c()*.34),St.updateMatrix(),st.setMatrixAt(Ct,St.matrix)}),st.instanceMatrix.needsUpdate=!0,st.castShadow=t.shadows,st.receiveShadow=t.shadows,Pt.add(st),o.push(st);const O=[new Et(u+.4,-zi-.05),new Et(u+1.5,-zi-.35),new Et(u+2.1,-zi-.95),new Et(u+1.6,-zi-1.9)],wt=a(new Ss(O,t.islandRadialSegments,0,Math.PI*2));{const pt=wt.attributes.position,Ct=new Float32Array(pt.count*3),Lt=new ut;for(let Ot=0;Ot<pt.count;Ot++){const ne=pt.getX(Ot),fe=pt.getY(Ot),zt=pt.getZ(Ot),ee=Math.atan2(zt,ne),ie=oe(l,Math.cos(ee)*7+2,Math.sin(ee)*7+2,3),Ce=d(ee);pt.setX(Ot,ne*Ce),pt.setZ(Ot,zt*Ce),Lt.setRGB(1,1,1).lerp(gs,.42).multiplyScalar((.62+ie*.4)*(fe<-1.4?.72:1)),Ct[Ot*3]=Lt.r,Ct[Ot*3+1]=Lt.g,Ct[Ot*3+2]=Lt.b}wt.setAttribute("color",new Se(Ct,3)),wt.computeVertexNormals()}const ht=new Yt(wt,p);ht.receiveShadow=t.shadows,ht.castShadow=!1,Fn(ht),Pt.add(ht)}{const X=t.name==="low"?10:t.name==="mid"?22:46,Q=a(new wn(.13,0));{const O=Q.attributes.position;for(let wt=0;wt<O.count;wt++){const ht=.7+oe(l,O.getX(wt)*9,O.getZ(wt)*9,2)*.8;O.setXYZ(wt,O.getX(wt)*ht,O.getY(wt)*ht*.7,O.getZ(wt)*ht)}Q.computeVertexNormals()}const ct=a(new se({color:new ut(5853770),roughness:.98,metalness:0,flatShading:!0,envMapIntensity:.2})),st=new rn(Q,ct,X),St=new Kt;for(let O=0;O<X;O++){const wt=c()*Math.PI*2,ht=c()<.45?.86:Math.sqrt(c()),pt=u*.12+u*.74*ht;St.position.set(Math.cos(wt)*pt,.03+c()*.04,Math.sin(wt)*pt),St.rotation.set(c()*3,c()*3,c()*3),St.scale.setScalar(.35+c()*.9),St.updateMatrix(),st.setMatrixAt(O,St.matrix)}st.instanceMatrix.needsUpdate=!0,st.castShadow=t.shadows,st.receiveShadow=t.shadows,r.add(st),o.push(st)}function gt(X,Q){const ct=Math.hypot(X.x,X.z)/Math.max(u,1e-6),st=oe(l,X.x*.7+3,X.z*.7-5,2)-.5;return{key:X.key,index:X.index,slot:Q,x:X.x,z:X.z,seam:X.seam,radial:ct,yaw:st*.09,baseY:st*.05,tiltX:oe(l,X.x*1.3+11,X.z*1.3,2)-.5,tiltZ:oe(l,X.x*1.3,X.z*1.3+11,2)-.5,crack:X.crack,displayCrack:X.crack,broken:!1,fall:0,decals:[]}}function Rt(X){Mt(X),$.delete(X.key),ft.delete(X.index),At.delete(S(X.x,X.z)),xt.delete(X),It.push(X.slot),Z&&(b.position.set(0,-60,0),b.rotation.set(0,0,0),b.scale.setScalar(0),b.updateMatrix(),Z.setMatrixAt(X.slot,b.matrix),Tt=!0)}function Ft(X){return X.broken?!1:(X.broken=!0,X.fall=1e-4,xt.add(X),Mt(X),!0)}return{group:r,tiles:$,core:z,arenaRadius:u,setActive(X){const Q=!!X;return r.visible===Q||(r.visible=Q),Q},get active(){return r.visible},get tileCount(){let X=0;for(const Q of $.values())Q.broken||X++;return X},syncTiles(X,Q){if(!Array.isArray(X)||X.length===0)return;if(Q&&(N=Q),at((Q==null?void 0:Q.tileSize)??X[0].size??2.5,X.length))for(const St of $.values())Z.count=Math.max(Z.count,St.slot+1),H(St),G(St);const st=new Set;for(const St of X){st.add(St.key);let O=$.get(St.key);if(!O){const wt=It.length?It.pop():Gt++;if(wt>=j)continue;O=gt(St,wt),$.set(St.key,O),ft.set(St.index,O),At.set(S(St.x,St.z),O),Z.count=Math.max(Z.count,O.slot+1),H(O),G(O)}St.crack>O.crack+.02&&!St.broken&&(St.crack>.32&&dt(O),xt.add(O)),O.crack=St.crack,St.broken?Ft(O):O.broken&&(O.broken=!1,O.fall=0,O.displayCrack=St.crack,H(O),G(O))}if(st.size!==$.size)for(const St of[...$.values()])st.has(St.key)||Rt(St)},breakTile(X){const Q=this.findTile(X);return Q?(Ft(Q),Q):null},crackTile(X,Q=.5){const ct=this.findTile(X);return!ct||ct.broken?null:(ct.crack=Math.max(ct.crack,Q),ct.crack>.32&&dt(ct),xt.add(ct),ct)},findTile({tileIndex:X=null,tileId:Q=null,x:ct=null,z:st=null}={}){return X!=null&&ft.has(X)?ft.get(X):Q!=null&&$.has(String(Q))?$.get(String(Q)):Number.isFinite(ct)&&Number.isFinite(st)?At.get(S(ct,st))??null:null},hasFloorAt(X,Q){const ct=At.get(S(X,Q));return!!ct&&!ct.broken},update(X,Q){if(I.uniforms.uTime.value=Q,E){for(let st=0;st<D.length;st++){const St=D[st];St.rot.y+=St.spin*X,_.position.set(St.x,St.base+Math.sin(Q*.4+St.phase)*St.amp,St.z),_.rotation.set(St.rot.x,St.rot.y,St.rot.z),_.scale.setScalar(St.scale),_.updateMatrix(),E.setMatrixAt(st,_.matrix)}E.instanceMatrix.needsUpdate=!0}for(const st of xt){let St=!0;st.broken&&st.fall<1&&(st.fall=Math.min(1,st.fall+X*.8),St=!1);const O=st.broken?1:st.crack;Math.abs(st.displayCrack-O)>.002?(st.displayCrack+=(O-st.displayCrack)*Math.min(1,X*5),H(st),St=!1):st.displayCrack!==O&&(st.displayCrack=O,H(st)),G(st),St&&xt.delete(st)}Tt&&Z&&(Z.instanceMatrix.needsUpdate=!0,Tt=!1),q&&(q.count=Z?Z.count:0);let ct=!1;for(const st of $.values()){if(st.decals.length===0)continue;const St=st.broken?0:.2+st.displayCrack*.45;for(const O of st.decals){O.fade+=(St-O.fade)*Math.min(1,X*3),ot.array[O.slot]=O.fade,ct=!0;const wt=O.fade>.01;wt!==O.shown&&(O.shown=wt,et+=wt?1:-1,w.setMatrixAt(O.slot,wt?O.matrix:rt),bt=!0)}}ct&&(ot.needsUpdate=!0),bt&&(w.instanceMatrix.needsUpdate=!0,bt=!1),w.visible=et>0},surfaceY(){return 0},dispose(){var X,Q;i.remove(r),r.traverse(ct=>{var st,St;(ct.isMesh||ct.isInstancedMesh)&&((St=(st=ct.geometry)==null?void 0:st.dispose)==null||St.call(st))}),(X=Z==null?void 0:Z.dispose)==null||X.call(Z);for(const ct of o)(Q=ct.dispose)==null||Q.call(ct);$.clear(),ft.clear(),At.clear(),xt.clear(),It.length=0,Gt=0}}}function Xv({scene:i,quality:t,sunDir:e}){const n=new Sc(Ut.keyLight,3.6);if(n.position.copy(e).multiplyScalar(60),n.target.position.set(0,0,0),i.add(n),i.add(n.target),t.shadows){n.castShadow=!0,n.shadow.mapSize.set(t.shadowMapSize,t.shadowMapSize),n.shadow.camera.near=5,n.shadow.camera.far=140;const c=30;n.shadow.camera.left=-c,n.shadow.camera.right=c,n.shadow.camera.top=c,n.shadow.camera.bottom=-c,n.shadow.bias=-.0016,n.shadow.normalBias=.05,n.shadow.radius=t.softShadows?3.2:1,n.shadow.camera.updateProjectionMatrix()}const s=new Rg(Ut.fillSky,Ut.fillBounce,.95);s.position.set(0,30,0),i.add(s);const r=new Sc(Ut.rimLight,t.rimLight?1.05:.45);r.position.set(e.z*46,24,-e.x*46),r.target.position.set(0,1.2,0),i.add(r),i.add(r.target);let o=null,a=null;t.crackFillLight&&(o=new Ma(Ut.crackLight,26,20,2),o.position.set(0,-13.2,0),i.add(o),a=new Ma(Ut.crackLight,11,15,2),a.position.set(0,-1.7,0),i.add(a));const l=new k;return{key:n,ambient:s,rim:r,crack:o,seam:a,update(c,u){if(l.copy(u),n.target.position.set(l.x,0,l.z),n.position.set(l.x+e.x*60,e.y*60,l.z+e.z*60),n.target.updateMatrixWorld(),r.target.position.set(l.x,1.2,l.z),r.position.set(l.x+e.z*46,24,l.z-e.x*46),r.target.updateMatrixWorld(),o){const h=.86+Math.sin(c*1.7)*.06+Math.sin(c*4.3+1.1)*.04;o.intensity=26*h,a.intensity=11*h}},setShadowsEnabled(c){n.castShadow=c&&t.shadows},dispose(){var c,u,h,d,f;i.remove(n),i.remove(n.target),i.remove(s),i.remove(r),i.remove(r.target),o&&i.remove(o),a&&i.remove(a),(c=n.dispose)==null||c.call(n),(u=s.dispose)==null||u.call(s),(h=r.dispose)==null||h.call(r),(d=o==null?void 0:o.dispose)==null||d.call(o),(f=a==null?void 0:a.dispose)==null||f.call(a)}}}const Oc=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`,Yv=`
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
`,qv=`
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
`;function Zv(){const i=new ye;return i.setAttribute("position",new qt([-1,-1,0,3,-1,0,-1,3,0],3)),i.setAttribute("uv",new qt([0,0,2,0,0,2],2)),i}const Kv=new ut(0,0,0);function Jv({renderer:i,scene:t,quality:e}){const n=new Et(1,1);i.getDrawingBufferSize(n);const s=(_,I,V={})=>new Qn(Math.max(1,Math.floor(_)),Math.max(1,Math.floor(I)),{type:Qi,format:qe,minFilter:Be,magFilter:Be,depthBuffer:V.depth!==!1,stencilBuffer:!1,samples:V.samples??0,colorSpace:fn,...V.extra}),r=e.bloom!==!1&&e.bloomIterations>0&&e.bloomStrength>0,o=e.bloomOccluders==="all"?"all":"tagged";let a=s(n.x,n.y,{samples:e.msaa});const l=e.bloomScale;let c=r?s(n.x*l,n.y*l,{depth:!0}):null,u=r?s(n.x*l,n.y*l,{depth:!1}):null,h=r?s(n.x*l,n.y*l,{depth:!1}):null;const d=Zv(),f=new Oa,g=new Ua(-1,1,1,-1,0,1),v=r?new Ee({vertexShader:Oc,fragmentShader:Yv,depthTest:!1,depthWrite:!1,uniforms:{uTex:{value:null},uDir:{value:new Et},uThreshold:{value:.85},uSoftKnee:{value:.6}}}):null,m=new Ee({vertexShader:Oc,fragmentShader:qv,defines:r?{USE_BLOOM:""}:{},depthTest:!1,depthWrite:!1,uniforms:r?{uScene:{value:a.texture},uBloom:{value:u.texture},uBloomStrength:{value:e.bloomStrength},uExposure:{value:1.25},uVignette:{value:.42}}:{uScene:{value:a.texture},uExposure:{value:1.25},uVignette:{value:.42}}}),p=new Yt(d,m);p.frustumCulled=!1,f.add(p);const y=new WeakMap,M=new WeakMap,x=[];function Y(_){let I=M.get(_);return I||(I=new gn({color:Kv,transparent:!1,depthWrite:_.depthWrite!==!1,depthTest:_.depthTest!==!1,side:_.side}),I.userData.emissiveProxyBlack=!0,M.set(_,I)),I}function R(_,I){if(!_)return null;if(_.isShaderMaterial||_.isRawShaderMaterial)return _;if(I.userData.bloomSelf&&_.isMeshBasicMaterial){let V=y.get(_);V||(V=_.clone(),V.toneMapped=!1,y.set(_,V));const W=I.userData.bloomBoost??2.4;return V.color.copy(_.color).multiplyScalar(W),V.opacity=_.opacity,V.map=_.map,V}if(_.emissive&&(_.emissiveIntensity??0)>.001){let V=y.get(_);return V||(V=new gn({transparent:_.transparent,depthWrite:_.depthWrite!==!1,side:_.side,toneMapped:!1}),y.set(_,V)),V.color.copy(_.emissive).multiplyScalar(_.emissiveIntensity??1),V.map=_.emissiveMap??null,V.opacity=_.opacity,V.userData.emissiveProxyBlack=!V.map&&V.color.r+V.color.g+V.color.b<1e-4,V}return Y(_)}const L=_=>{var I;return Array.isArray(_)?_.every(V=>{var W;return(W=V==null?void 0:V.userData)==null?void 0:W.emissiveProxyBlack}):!!((I=_==null?void 0:_.userData)!=null&&I.emissiveProxyBlack)};function D(_){x.length=0;const I=[],V=[];t.traverse(W=>{if(W.userData.emissiveOnly){if(o!=="tagged"||W.visible)return;W.visible=!0,V.push(W)}else if(!W.visible)return;if(W.isPoints){W.userData.bloomSelf||(I.push(W),W.visible=!1);return}if(!W.isMesh&&!W.isInstancedMesh&&!W.isBatchedMesh)return;const T=W.material,U=Array.isArray(T)?T.map(z=>R(z,W)):R(T,W);if(o==="tagged"&&W.children.length===0&&L(U)&&!W.layers.isEnabled(wa)){I.push(W),W.visible=!1;return}U!==T&&(x.push({object:W,original:T}),W.material=U)}),i.setRenderTarget(c),i.setClearColor(0,1),i.clear(!0,!0,!1),i.render(t,_);for(const W of x)W.object.material=W.original;x.length=0;for(const W of I)W.visible=!0;for(const W of V)W.visible=!1}function E(_){p.material=v;let I=c;for(let V=0;V<_;V++)v.uniforms.uTex.value=I.texture,v.uniforms.uThreshold.value=V===0?.85:-1,v.uniforms.uDir.value.set((1.4+V*1.8)/u.width,0),i.setRenderTarget(u),i.clear(!0,!1,!1),i.render(f,g),v.uniforms.uTex.value=u.texture,v.uniforms.uThreshold.value=-1,v.uniforms.uDir.value.set(0,(1.4+V*1.8)/h.height),i.setRenderTarget(h),i.clear(!0,!1,!1),i.render(f,g),I=h;return I}return{get sceneTarget(){return a},get bloomEnabled(){return r},get debug(){return{composite:m,targets:1+(r?3:0),bloomSize:r?[u.width,u.height]:null,occluders:o}},render(_){if(i.setRenderTarget(a),i.setClearColor(0,1),i.clear(!0,!0,!1),i.render(t,_),r){D(_);const I=E(e.bloomIterations);m.uniforms.uBloom.value=I.texture}m.uniforms.uScene.value=a.texture,p.material=m,i.setRenderTarget(null),i.clear(!0,!0,!1),i.render(f,g)},setSize(_,I){const V=Math.max(1,Math.floor(_)),W=Math.max(1,Math.floor(I));if(a.setSize(V,W),!r)return;const T=Math.max(1,Math.floor(V*l)),U=Math.max(1,Math.floor(W*l));c.setSize(T,U),u.setSize(T,U),h.setSize(T,U)},setBloomStrength(_){r&&(m.uniforms.uBloomStrength.value=_)},setExposure(_){m.uniforms.uExposure.value=_},dispose(){a.dispose(),c==null||c.dispose(),u==null||u.dispose(),h==null||h.dispose(),d.dispose(),v==null||v.dispose(),m.dispose(),a=null,c=null,u=null,h=null}}}const $v=`
  varying vec3 vWorldDir;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(world.xyz - cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`,jv=`
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
`,Qv=`
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`,t_=`
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
`;function e_({scene:i,renderer:t,quality:e,textures:n,sunDir:s}){const r=new De(900,32,20),o=new Ee({vertexShader:$v,fragmentShader:jv,side:Ge,depthWrite:!1,fog:!1,uniforms:{uZenith:{value:new ut(Ut.skyZenith)},uMid:{value:new ut(Ut.skyMid)},uHorizon:{value:new ut(Ut.skyHorizon)},uWarm:{value:new ut(Ut.skyWarm)},uSunColor:{value:new ut(Ut.sunDisc)},uSunDir:{value:s.clone().normalize()},uExposure:{value:1}}}),a=new Yt(r,o);a.name="sky",a.frustumCulled=!1,a.renderOrder=-1e3;const l=new da(t);l.compileEquirectangularShader();const c=new Oa;c.add(a);const u=l.fromScene(c,0,1,2e3);c.remove(a),l.dispose(),i.add(a),i.environment=u.texture,i.environmentIntensity=.45,i.fog=new Fa(new ut(Ut.fog).getHex(),.0065);const h=[],d=[{y:-34,size:900,density:.46,scale:2.6,opacity:.5,fadeNear:260,fadeFar:1100},{y:-70,size:1500,density:.52,scale:1.7,opacity:.42,fadeNear:460,fadeFar:1900},{y:-120,size:2400,density:.6,scale:1.15,opacity:.4,fadeNear:780,fadeFar:3e3}].slice(0,e.cloudLayers);for(const f of d){const g=new Ee({vertexShader:Qv,fragmentShader:t_,transparent:!0,depthWrite:!1,side:Ie,fog:!1,uniforms:{uNoise:{value:n.turbulence},uLit:{value:new ut(Ut.cloudLit)},uShadow:{value:new ut(Ut.cloudShadow)},uSunDir:{value:s.clone().normalize()},uTime:{value:0},uDensity:{value:f.density},uScale:{value:f.scale},uOpacity:{value:f.opacity},uHaze:{value:new ut(Ut.fog).lerp(new ut(Ut.skyHorizon),.5)},uFadeNear:{value:f.fadeNear},uFadeFar:{value:f.fadeFar}}}),v=new Yt(new Bn(f.size,f.size,1,1),g);v.rotation.x=-Math.PI/2,v.position.y=f.y,v.renderOrder=-900,v.frustumCulled=!1,i.add(v),h.push(v)}return{skyMesh:a,clouds:h,envRT:u,update(f,g){a.position.copy(g);for(const v of h)v.material.uniforms.uTime.value=f,v.position.x=g.x*.35,v.position.z=g.z*.35},dispose(){i.remove(a),r.dispose(),o.dispose();for(const f of h)i.remove(f),f.geometry.dispose(),f.material.dispose();u.dispose(),i.environment=null,i.fog=null}}}const kc=new k(-.58,.42,.38).normalize();function Du(i){if(typeof OffscreenCanvas<"u")try{return new OffscreenCanvas(i,i)}catch{}if(typeof document>"u")return null;const t=document.createElement("canvas");return t.width=i,t.height=i,t}function vn(i,t,{srgb:e=!1,wrap:n=Ki}={}){const s=Du(i);if(!s)return null;const r=s.getContext("2d",{willReadFrequently:!1}),o=r.createImageData(i,i);t(o.data,i),r.putImageData(o,0,0);const a=new _u(s);return a.wrapS=n,a.wrapT=n,a.colorSpace=e?Ye:fn,a.minFilter=Sn,a.magFilter=Be,a.anisotropy=4,a.needsUpdate=!0,a}function Rs(i,t,e){const n=new Uint8Array(t*t*4),s=(h,d)=>i[(d+t)%t*t+(h+t)%t],r=new Float32Array(t*t),o=new Float32Array(t*t);let a=0;for(let h=0;h<t;h++)for(let d=0;d<t;d++){const f=h*t+d;r[f]=s(d+1,h)-s(d-1,h),o[f]=s(d,h+1)-s(d,h-1),a+=r[f]*r[f]+o[f]*o[f]}const l=Math.sqrt(a/(t*t*2))||1e-6,c=e/l;for(let h=0;h<t;h++)for(let d=0;d<t;d++){const f=h*t+d;let g=-r[f]*c,v=-o[f]*c,m=1;const p=Math.hypot(g,v,m)||1;g/=p,v/=p,m/=p;const y=(h*t+d)*4;n[y]=Math.round((g*.5+.5)*255),n[y+1]=Math.round((v*.5+.5)*255),n[y+2]=Math.round((m*.5+.5)*255),n[y+3]=255}const u=new ka(n,t,t,qe,bn);return u.wrapS=Ki,u.wrapT=Ki,u.minFilter=Sn,u.magFilter=Be,u.generateMipmaps=!0,u.colorSpace=fn,u.needsUpdate=!0,u}function Sa(i,t,e){const n=i>>16&255,s=i>>8&255,r=i&255,o=t>>16&255,a=t>>8&255,l=t&255;return[n+(o-n)*e,s+(a-s)*e,r+(l-r)*e]}function n_(i,t,e){const n=on(t),s=on(t+977),r=new Float32Array(i*i),o=vn(i,(l,c)=>{for(let u=0;u<c;u++){const h=u/c;for(let d=0;d<c;d++){const f=d/c,g=oe(n,f*6,h*3,3)*.12,v=Ts(s,f*3,(h+g)*7,3),m=oe(n,f*18,h*18,4,.55),p=oe(s,f*22,h*1.2,3),y=me(.52,.86,p)*me(.05,.7,h),M=me(.62,.16,v);r[u*c+d]=v*.72+m*.11+y*.17;const x=.35+.5*(1-h);let[Y,R,L]=Sa(3816774,7169368,x*(.45+v*.55));const D=me(.78,.98,v)*.5,[E,_,I]=Sa(0,9143160,1);Y+=E*D*.35,R+=_*D*.35,L+=I*D*.35;const V=M*.55+y*.6;Y*=1-V*.55,R*=1-V*.5,L*=1-V*.42;const W=(m-.5)*14,T=(u*c+d)*4;l[T]=Math.max(0,Math.min(255,Y+W)),l[T+1]=Math.max(0,Math.min(255,R+W*.7)),l[T+2]=Math.max(0,Math.min(255,L+W*.4)),l[T+3]=255}}},{srgb:!0}),a=vn(i,(l,c)=>{for(let u=0;u<c;u++){const h=u/c;for(let d=0;d<c;d++){const f=d/c,g=oe(n,f*18,h*18,4,.55),v=oe(s,f*22,h*1.2,3),p=.98-me(.52,.86,v)*me(.05,.7,h)*.16+(g-.5)*.07,y=(u*c+d)*4,M=Math.max(0,Math.min(255,p*255));l[y]=M,l[y+1]=M,l[y+2]=M,l[y+3]=255}}});return{albedo:o,rough:a,normal:e?Rs(r,i,.3):null}}function i_(i,t,e){const n=on(t+31),s=on(t+1301),r=new Float32Array(i*i),o=vn(i,(l,c)=>{for(let u=0;u<c;u++)for(let h=0;h<c;h++){const d=h/c,f=u/c,g=oe(n,d*17,f*17,3,.55),v=oe(s,d*2.2,f*2.2,4),m=Ec(oe(s,d*5+11,f*5,3),1.4),p=me(.84,.98,Ts(n,d*22+f*5,f*1.6,2));r[u*c+h]=v*.8+g*.08+p*.12;let[y,M,x]=Sa(4999756,6643540,.25+v*.75);const Y=(g-.5)*8;y+=Y,M+=Y*.9,x+=Y*.75,y=y*(1-m*.16)+124*m*.16,M=M*(1-m*.16)+118*m*.16,x=x*(1-m*.16)+109*m*.16,y+=p*15,M+=p*14,x+=p*12;const R=(u*c+h)*4;l[R]=Math.max(0,Math.min(255,y)),l[R+1]=Math.max(0,Math.min(255,M)),l[R+2]=Math.max(0,Math.min(255,x)),l[R+3]=255}},{srgb:!0}),a=vn(i,(l,c)=>{for(let u=0;u<c;u++)for(let h=0;h<c;h++){const d=h/c,f=u/c,g=Ec(oe(s,d*5+11,f*5,3),1.4),v=me(.84,.98,Ts(n,d*22+f*5,f*1.6,2)),m=.74+g*.2-v*.26,p=Math.max(0,Math.min(255,m*255)),y=(u*c+h)*4;l[y]=p,l[y+1]=p,l[y+2]=p,l[y+3]=255}});return{albedo:o,rough:a,normal:e?Rs(r,i,.32):null}}function s_(i,t,e){const n=on(t+77),s=new Float32Array(i*i);return{rough:vn(i,(o,a)=>{for(let l=0;l<a;l++)for(let c=0;c<a;c++){const u=c/a,h=l/a,d=oe(n,u*64,h*64,3,.62),f=Ts(n,u*7,h*7,3),g=me(.55,.95,f);s[l*a+c]=d*.35+f*.65;const v=.86-g*.34+(d-.5)*.1,m=Math.max(0,Math.min(255,v*255)),p=(l*a+c)*4;o[p]=m,o[p+1]=m,o[p+2]=m,o[p+3]=255}}),normal:e?Rs(s,i,.45):null}}function r_(i,t,e){const n=on(t+401),s=new Float32Array(i*i);return{rough:vn(i,(o,a)=>{for(let l=0;l<a;l++)for(let c=0;c<a;c++){const u=c/a,h=l/a,d=Math.sin(u*Math.PI*2*(a/4))*.5+.5,f=Math.sin(h*Math.PI*2*(a/4))*.5+.5,g=(d*.5+f*.5)*.4+oe(n,u*12,h*12,3)*.6;s[l*a+c]=g;const v=.93+(g-.5)*.1,m=Math.max(0,Math.min(255,v*255)),p=(l*a+c)*4;o[p]=m,o[p+1]=m,o[p+2]=m,o[p+3]=255}}),normal:e?Rs(s,i,.3):null}}function o_(i,t,e){const n=on(t+613),s=new Float32Array(i*i);return{rough:vn(i,(o,a)=>{for(let l=0;l<a;l++)for(let c=0;c<a;c++){const u=c/a,h=l/a,d=oe(n,u*90,h*3,3,.6),f=oe(n,u*5+3,h*5,3),g=me(.62,.9,f);s[l*a+c]=d*.25+f*.2;const v=.3+d*.2+g*.45,m=Math.max(0,Math.min(255,v*255)),p=(l*a+c)*4;o[p]=m,o[p+1]=m,o[p+2]=m,o[p+3]=255}}),normal:e?Rs(s,i,.2):null}}function a_(i,t){const e=on(t+907);return vn(i,(n,s)=>{const r=(s-1)/2;for(let o=0;o<s;o++)for(let a=0;a<s;a++){const l=(a-r)/r,c=(o-r)/r,u=Math.hypot(l,c),h=Math.atan2(c,l),d=oe(e,Math.cos(h)*3+4,Math.sin(h)*3+4,4)*.42,f=oe(e,a/s*7,o/s*7,4);let g=me(1+d,.15,u)*(.55+f*.75);g=Math.max(0,Math.min(1,g));const v=(o*s+a)*4;n[v]=255,n[v+1]=255,n[v+2]=255,n[v+3]=g*255}},{wrap:yn})}function l_(i){return vn(i,(t,e)=>{const n=(e-1)/2;for(let s=0;s<e;s++)for(let r=0;r<e;r++){const o=Math.hypot((r-n)/n,(s-n)/n),a=me(.22,0,o),l=me(1,.1,o)*.35,c=Math.max(0,Math.min(1,a+l)),u=(s*e+r)*4;t[u]=255,t[u+1]=255,t[u+2]=255,t[u+3]=c*255}},{wrap:yn})}function c_(i,t){const e=Du(i);if(!e)return null;const n=e.getContext("2d");n.clearRect(0,0,i,i);const s=Mi(t+5),r=i/2,o=i/2,a=5;n.strokeStyle="#150f0c",n.lineCap="round",n.lineJoin="round";for(let u=0;u<a;u++){const h=u/a*Math.PI*2+s()*.9;let d=r,f=o,g=h;const v=5+Math.floor(s()*3);let m=i*.016;const p=i*.34/v;n.globalAlpha=.8;for(let y=0;y<v;y++){g+=(s()-.5)*.85;const M=d+Math.cos(g)*p,x=f+Math.sin(g)*p;if(n.beginPath(),n.lineWidth=Math.max(.7,m),n.moveTo(d,f),n.lineTo(M,x),n.stroke(),s()<.45&&y<v-1){const Y=g+(s()-.5)*1.7;n.beginPath(),n.lineWidth=Math.max(.6,m*.5),n.moveTo(M,x),n.lineTo(M+Math.cos(Y)*p*.8,x+Math.sin(Y)*p*.8),n.stroke()}d=M,f=x,m*=.74}}n.globalAlpha=1;const l=n.createRadialGradient(r,o,0,r,o,i*.3);l.addColorStop(0,"rgba(214, 138, 74, 0.62)"),l.addColorStop(.45,"rgba(140, 68, 26, 0.3)"),l.addColorStop(1,"rgba(0, 0, 0, 0)"),n.globalCompositeOperation="source-atop",n.fillStyle=l,n.fillRect(0,0,i,i),n.globalCompositeOperation="source-over";const c=new _u(e);return c.colorSpace=Ye,c.minFilter=Sn,c.magFilter=Be,c.needsUpdate=!0,c}function u_(i,t){const e=on(t+3301),n=on(t+5507);return vn(i,(s,r)=>{for(let o=0;o<r;o++)for(let a=0;a<r;a++){const l=a/r,c=o/r,u=l-.5,h=c-.5,d=Math.hypot(u,h)*2,f=oe(e,l*3.1,c*3.1,4,.55),g=Ts(n,l*4.3+7,c*4.3+7,3),v=oe(n,l*9.5,c*9.5,3,.5),m=me(.45,1,d),p=me(.62,.08,d);let y=.62+f*.42+g*.3+v*.14;y*=1-m*.3,y*=1+p*.2;const M=Math.max(0,Math.min(255,y*200)),x=(o*r+a)*4;s[x]=M,s[x+1]=M,s[x+2]=M,s[x+3]=255}},{wrap:yn})}function h_(i,t){const e=on(t+1777);return vn(i,(n,s)=>{for(let r=0;r<s;r++)for(let o=0;o<s;o++){const a=oe(e,o/s*8,r/s*8,4,.55),l=Math.max(0,Math.min(255,a*255)),c=(r*s+o)*4;n[c]=l,n[c+1]=l,n[c+2]=l,n[c+3]=255}})}function f_(i,t=20240501){const e=i.texRock,n=i.texDetail,s=i.normalMaps,r=n_(e,t,s),o=i_(e,t,s),a=s_(n,t,s),l=r_(n,t,s),c=o_(n,t,s),u={cliff:r,crust:o,leather:a,cloth:l,metal:c,dust:a_(Math.max(64,n),t),ember:l_(64),crack:c_(Math.max(128,n*2),t),turbulence:h_(Math.max(64,n),t),arenaMacro:u_(Math.max(128,e),t),dispose(){const h=new Set,d=f=>{f&&!h.has(f)&&(h.add(f),f.dispose())};[r,o,a,l,c].forEach(f=>{f&&(d(f.albedo),d(f.rough),d(f.normal))}),d(u.dust),d(u.ember),d(u.crack),d(u.turbulence),d(u.arenaMacro)}};return u}const d_=1,p_=`
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
`,m_=`
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
`,g_=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,v_=`
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
`;function __({scene:i,quality:t,textures:e,seed:n=4242}){const s=Mi(n),r=new ve;r.name="vfx",i.add(r);const o=As({scene:r,budget:t.dustBudget,texture:e.dust,blending:He,depthWrite:!1,renderOrder:3}),a=As({scene:r,budget:t.emberBudget,texture:e.ember,blending:Xi,depthWrite:!1,renderOrder:4});a.points.layers.enable(d_),a.points.userData.bloomSelf=!0;const l=new ut(Ut.grime).lerp(new ut(Ut.rockBody),.4),c=new ut(Ut.rockTop).lerp(new ut(Ut.keyLight),.28),u=new ut(16773327),h=new ut(Ut.crackDeep),d=new ut;function f(q,K,B,at,$){Sr(q,K,B,at,$,s)}function g(q,K,B,at,$,ft,At=1){for(let It=0;It<at;It++){const Gt=s()*Math.PI*2,xt=Math.pow(s(),.6);d.copy(l).lerp(c,s()*.85),f(o,q+(s()-.5)*.25,K+s()*.2,B+(s()-.5)*.25,{vx:Math.cos(Gt)*xt*$,vy:ft*(.35+s()*.9),vz:Math.sin(Gt)*xt*$,life:.9+s()*1.7,spin:(s()-.5)*1.4,grow:(1.6+s()*2.2)*At,drag:1.9+s()*1.4,size:(.5+s()*.9)*At,alpha:.3+s()*.3,color:d})}}function v(q,K,B,at,$){for(let ft=0;ft<at;ft++){const At=s()*Math.PI*2,It=1.5+s()*3.5;d.copy(u),f(a,q,K,B,{vx:Math.cos(At)*(1+s()*2.4)*$,vy:It,vz:Math.sin(At)*(1+s()*2.4)*$,life:.7+s()*1.1,spin:0,grow:-.5,drag:.6,size:.06+s()*.09,alpha:.9,color:d})}}const m=new De(1,20,14),p=new pi(.05,1,40,1),y=[],M=[];function x(){const q=new Ee({vertexShader:p_,fragmentShader:m_,transparent:!0,depthWrite:!1,side:Ie,blending:He,uniforms:{uNoise:{value:e.turbulence},uColorLit:{value:new ut(Ut.rockTop).lerp(new ut(Ut.keyLight),.35)},uColorDark:{value:new ut(Ut.fog).lerp(new ut(Ut.grime),.35)},uLife:{value:0},uOpacity:{value:.9}}}),K=new Yt(m,q);K.visible=!1,K.renderOrder=2,r.add(K);const B={mesh:K,mat:q,t:-1,dur:.3,scale:new k(1,1,1)};return y.push(B),B}function Y(){const q=new Ee({vertexShader:g_,fragmentShader:v_,transparent:!0,depthWrite:!1,side:Ie,blending:He,uniforms:{uNoise:{value:e.turbulence},uColor:{value:new ut(Ut.rockTop).lerp(new ut(Ut.keyLight),.2)},uLife:{value:0},uOpacity:{value:.6}}}),K=new Yt(p,q);K.rotation.x=-Math.PI/2,K.visible=!1,K.renderOrder=2,r.add(K);const B={mesh:K,mat:q,t:-1,dur:.55,radius:3};return M.push(B),B}const R=Array.from({length:t.shockRings+2},x),L=Array.from({length:t.shockRings+1},Y);function D(){return R.find(q=>q.t<0)??R[0]}function E(){return L.find(q=>q.t<0)??L[0]}const _=new wn(.16,0),I=new se({color:new ut(6643026),roughness:.98,metalness:0,flatShading:!0,envMapIntensity:.15}),V=new rn(_,I,t.debrisBudget);V.instanceMatrix.setUsage(Le),V.castShadow=t.shadows,V.frustumCulled=!1,V.count=0,r.add(V);const W=[],T=new Kt,U=new Bn(1,1),z=[];let b=0;for(let q=0;q<t.decalBudget;q++){const K=new gn({map:e.crack,transparent:!0,depthWrite:!1,opacity:0,polygonOffset:!0,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),B=new Yt(U,K);B.rotation.x=-Math.PI/2,B.visible=!1,B.renderOrder=2,r.add(B),z.push({mesh:B,mat:K,t:-1,hold:0})}function P(q,K,B,at){if(z.length===0)return;const $=z[b%z.length];b++,$.mesh.position.set(q,.016,K),$.mesh.rotation.z=s()*Math.PI*2,$.mesh.scale.setScalar(B),$.mesh.visible=!0,$.t=0,$.peak=.24+at*.2}const Z=new k(0,1,0),tt=new k;let j=0;const mt={group:r,slap(q,K,B=1){const at=Math.max(.35,Math.min(2.2,B));tt.copy(K??Z),tt.y=0,tt.lengthSq()<1e-5&&tt.set(0,0,1),tt.normalize();const $=D();$.t=0,$.dur=.26+at*.09,$.mesh.position.copy(q),$.mesh.visible=!0,$.mesh.lookAt(q.x+tt.x,q.y,q.z+tt.z),$.scale.set(.85*at,.6*at,.36*at),$.mat.uniforms.uOpacity.value=.38+at*.14,g(q.x+tt.x*.3,q.y,q.z+tt.z*.3,Math.round(15*at*(t.name==="low"?.4:1)),2.6*at,.8,.8+at*.2),t.name!=="low"&&v(q.x,q.y,q.z,Math.round(3*at),.6)},heavyImpact(q,K=1,B={}){const at=Math.max(.5,Math.min(2.5,K));mt.slap(q,B.dir??Z,at);const $=E();$.t=0,$.dur=.5+at*.15,$.radius=2.4*at,$.mesh.position.set(q.x,.05,q.z),$.mesh.visible=!0,g(q.x,.1,q.z,Math.round(22*at*(t.name==="low"?.35:1)),4.2*at,.5,1.3),v(q.x,.2,q.z,Math.round(6*at*(t.name==="low"?.3:1)),1),mt.spawnDebris(q,at),B.crack!==!1&&P(q.x,q.z,1.9+at*1.1,Math.min(1,at/2))},spawnDebris(q,K){const B=Math.round(t.debrisPerBurst*Math.min(1.6,K));for(let at=0;at<B&&!(W.length>=t.debrisBudget);at++){const $=s()*Math.PI*2,ft=(1.5+s()*4)*K;W.push({p:new k(q.x+(s()-.5)*.5,q.y+.15,q.z+(s()-.5)*.5),v:new k(Math.cos($)*ft*.6,3+s()*4.5,Math.sin($)*ft*.6),rot:new k(s()*6,s()*6,s()*6),spin:new k((s()-.5)*9,(s()-.5)*9,(s()-.5)*9),scale:.32+s()*.7,life:0,maxLife:2+s()*1.2})}},footDust(q,K,B,at){t.footDust&&(at<3.2||g(q,K+.06,B,1,.6,.25,.55))},fallTrail(q,K,B){g(q,K,B,1,.5,-.4,.9)},ambientDrift(q,K){if(t.name==="low")return;j+=q;const B=t.name==="high"?.16:.34;for(;j>B;){j-=B;const at=s()*Math.PI*2,$=2+s()*13;d.copy(l).lerp(c,s()*.7),f(o,K.x+Math.cos(at)*$,.3+s()*4.5,K.z+Math.sin(at)*$,{vx:(s()-.5)*.25,vy:.18+s()*.3,vz:(s()-.5)*.25,life:4+s()*4,spin:(s()-.5)*.3,grow:.5,drag:.25,size:.16+s()*.3,alpha:.05+s()*.07,color:d})}},awakenMotes(q,K,B){t.name!=="low"&&(s()>.35||v(q,K,B,1,.25))},crack(q,K,B=4,at=1){P(q,K,B,at)},update(q,K){for(const B of[o,a]){const at=B.arrays,$=B===a;for(let ft=B.count-1;ft>=0;ft--){B.life[ft]+=q;const At=B.life[ft]/B.maxLife[ft];if(At>=1){Za(B,ft);continue}const It=Math.exp(-B.drag[ft]*q);if(B.vel[ft*3]*=It,B.vel[ft*3+2]*=It,B.vel[ft*3+1]=$?B.vel[ft*3+1]*It-2.2*q:(B.vel[ft*3+1]-1.1*q)*It,at.pos[ft*3]+=B.vel[ft*3]*q,at.pos[ft*3+1]+=B.vel[ft*3+1]*q,at.pos[ft*3+2]+=B.vel[ft*3+2]*q,!$&&at.pos[ft*3+1]<.04&&B.vel[ft*3+1]<0&&(at.pos[ft*3+1]=.04,B.vel[ft*3+1]=0,B.vel[ft*3]*=.86,B.vel[ft*3+2]*=.86),at.rot[ft]+=B.spin[ft]*q,at.size[ft]=B.baseSize[ft]+B.grow[ft]*At,$)d.copy(u).lerp(h,Math.min(1,At*1.5)),at.color[ft*3]=d.r,at.color[ft*3+1]=d.g,at.color[ft*3+2]=d.b,at.alpha[ft]=B.baseAlpha[ft]*(1-At*At);else{const Gt=Math.min(1,At/.12);at.alpha[ft]=B.baseAlpha[ft]*Gt*(1-At)*(1-At*.4)}}Ka(B)}for(const B of y){if(B.t<0)continue;if(B.t+=q/B.dur,B.t>=1){B.t=-1,B.mesh.visible=!1;continue}const at=1-Math.pow(1-B.t,2.4),$=.45+at*2.2;B.mesh.scale.set(B.scale.x*$,B.scale.y*$,B.scale.z*$*(1+at*1.4)),B.mat.uniforms.uLife.value=B.t}for(const B of M){if(B.t<0)continue;if(B.t+=q/B.dur,B.t>=1){B.t=-1,B.mesh.visible=!1;continue}const at=1-Math.pow(1-B.t,2.6);B.mesh.scale.setScalar(.4+at*B.radius),B.mat.uniforms.uLife.value=B.t}if(W.length>0){const B=t.mergedDebris;for(let at=W.length-1;at>=0;at--){const $=W[at];if($.life+=q,$.life>=$.maxLife){W.splice(at,1);continue}$.v.y-=22*q,$.p.addScaledVector($.v,q),$.p.y<.08&&($.p.y=.08,$.v.y*=-.32,$.v.x*=.62,$.v.z*=.62,$.spin.multiplyScalar(.5)),B||($.rot.x+=$.spin.x*q,$.rot.y+=$.spin.y*q,$.rot.z+=$.spin.z*q)}V.count=Math.min(W.length,t.debrisBudget);for(let at=0;at<V.count;at++){const $=W[at];T.position.copy($.p),T.rotation.set($.rot.x,$.rot.y,$.rot.z);const ft=1-Math.max(0,($.life-$.maxLife*.7)/($.maxLife*.3));T.scale.setScalar($.scale*ft),T.updateMatrix(),V.setMatrixAt(at,T.matrix)}V.instanceMatrix.needsUpdate=!0,V.visible=V.count>0}else V.count!==0&&(V.count=0,V.visible=!1);for(const B of z){if(B.t<0)continue;B.t+=q;const at=Math.min(1,B.t/.18),$=B.t>9?Math.max(0,1-(B.t-9)/6):1;B.mat.opacity=(B.peak??.8)*at*$,$<=0&&(B.t=-1,B.mesh.visible=!1)}},setPixelScale(q){o.mat.uniforms.uPixelScale.value=q,a.mat.uniforms.uPixelScale.value=q},dispose(){o.dispose(),a.dispose(),m.dispose(),p.dispose();for(const q of y)q.mat.dispose();for(const q of M)q.mat.dispose();for(const q of z)q.mat.dispose();U.dispose(),_.dispose(),I.dispose(),i.remove(r)}};return mt}const zc=new k(0,1,0);function Bc(i,t){const e=qg(i);return t.set(e.x,0,e.z)}class x_{constructor(t,e={}){this.canvas=t,this.opts=e,this.tier=nl(e.quality??e.tier??"high"),this.quality=Ao[this.tier],this.mobile=!!e.mobile,this.seed=Number.isFinite(e.seed)?e.seed:20240501,this.arenaRadius=Number.isFinite(e.arenaRadius)?e.arenaRadius:20,this.forcedLocalId=e.localId??null,this.followId=e.followId??null,this.localId=this.forcedLocalId,this.spectator=!!e.spectator,this.disposed=!1,this.lookPitch=Number.isFinite(e.pitch)?e.pitch:null,this.lookYaw=Number.isFinite(e.lookYaw)?e.lookYaw:null,this.skins=e.skins||Ja(e.data??null),this.renderer=new H0({canvas:t,antialias:!1,alpha:!1,powerPreference:e.powerPreference??"high-performance",stencil:!1,depth:!0,preserveDrawingBuffer:!!e.preserveDrawingBuffer}),this.renderer.toneMapping=kn,this.renderer.autoClear=!1,this.renderer.setClearColor(0,1),this.renderer.info.autoReset=!1,this.renderer.shadowMap.autoUpdate=!1,this.clock=new Lg,this.time=0,this.frame=0,this.view=null,this.lastRawEvents=null,this.lastTick=null,this.scene=new Oa,this.cameraRig=fv({mobile:this.mobile}),this.camera=this.cameraRig.camera,this._focus=new k(0,0,0),this._cullAt=new k(0,0,0),this._vel=new k,this._tmp=new k,this._tmp2=new k,this._tmp3=new k,this._buildWorld();const n=e.width??t.clientWidth??t.width??960,s=e.height??t.clientHeight??t.height??540;this.resize(n,s,e.pixelRatio??(typeof window<"u"?window.devicePixelRatio:1))}_buildWorld(){const t=this.quality;this.renderer.shadowMap.enabled=t.shadows,this.renderer.shadowMap.type=t.softShadows?Gc:Ea,this.textures=f_(t,this.seed),this.sky=e_({scene:this.scene,renderer:this.renderer,quality:t,textures:this.textures,sunDir:kc}),this.lighting=Xv({scene:this.scene,quality:t,sunDir:kc}),this.island=Wv({scene:this.scene,quality:t,textures:this.textures,arenaRadius:this.arenaRadius,seed:this.seed}),this.characters=Sv({scene:this.scene,quality:t,textures:this.textures,skins:this.skins}),this.hub=zv({scene:this.scene,quality:t,textures:this.textures,seed:this.seed}),this.vfx=__({scene:this.scene,quality:t,textures:this.textures,seed:this.seed}),this.combatVfx=Hg({scene:this.scene,quality:t,textures:this.textures,seed:this.seed}),this.post=Jv({renderer:this.renderer,scene:this.scene,quality:t}),this.view&&(this.island.syncTiles(this.view.tiles,this.view.arena),this.characters.reconcile(this.view.players,this.localId),this.island.setActive(!this.hub.sync(this.view.hub,1/60,this.time)))}_teardownWorld(){var t,e,n,s,r,o,a,l,c;(t=this.post)==null||t.dispose(),(e=this.combatVfx)==null||e.dispose(),this.combatVfx=null,(n=this.vfx)==null||n.dispose(),(s=this.hub)==null||s.dispose(),(r=this.characters)==null||r.dispose(),(o=this.island)==null||o.dispose(),(a=this.lighting)==null||a.dispose(),(l=this.sky)==null||l.dispose(),(c=this.textures)==null||c.dispose(),this.post=null,this.vfx=null,this.hub=null,this.characters=null,this.island=null,this.lighting=null,this.sky=null,this.textures=null}setQuality(t){const e=nl(t);return e===this.tier?this.tier:(this.tier=e,this.quality=Ao[e],this._teardownWorld(),this._buildWorld(),this.resize(this._w,this._h,this._dpr),this.tier)}resize(t,e,n){var d,f,g,v;const s=Math.max(1,Math.floor(t||1)),r=Math.max(1,Math.floor(e||1)),o=Number.isFinite(n)&&n>0?n:1,a=Math.min(o,this.quality.dprCap,Bu);this._w=s,this._h=r,this._dpr=o,this._ratio=a,this.renderer.setPixelRatio(a),this.renderer.setSize(s,r,!1),this.cameraRig.resize(s/r);const l=Math.floor(s*a),c=Math.floor(r*a);(d=this.post)==null||d.setSize(l,c);const u=this.camera.fov*Math.PI/180,h=c/(2*Math.tan(u/2));return(f=this.vfx)==null||f.setPixelScale(h),(g=this.combatVfx)==null||g.setPixelScale(h),(v=this.hub)==null||v.setPixelScale(h),{width:s,height:r,pixelRatio:a}}setMobile(t){this.mobile=!!t,this.cameraRig.setMobile(this.mobile)}setSpectator(t){this.spectator=!!t}setLocalId(t){return this.forcedLocalId=t??null,this.forcedLocalId}setFollow(t){return this.setLocalId(t)}setLook(t={}){const e=typeof t=="number"?{pitch:t}:t||{};return Number.isFinite(e.pitch)?this.lookPitch=Math.max(-br,Math.min(br,e.pitch)):e.pitch===null&&(this.lookPitch=null),Number.isFinite(e.yaw)?this.lookYaw=e.yaw:e.yaw===null&&(this.lookYaw=null),{pitch:this.lookPitch,yaw:this.lookYaw}}setPitch(t){return this.setLook({pitch:t}).pitch}getLook(){return{pitch:this.lookPitch??wr,yaw:this.lookYaw,cameraPitch:this.cameraRig.state.pitchOut}}_pitchBias(){return this.lookPitch==null?0:this.lookPitch-wr}_arenaChanged(t){!Number.isFinite(t)||Math.abs(t-this.arenaRadius)<.01||(this.arenaRadius=t,this._teardownWorld(),this._buildWorld(),this.resize(this._w,this._h,this._dpr))}_consumeEvents(t,e){if(t.tick!=null){if(t.tick===this.lastTick)return;this.lastTick=t.tick}else{if(e===this.lastRawEvents)return;this.lastRawEvents=e}if(t.events.length!==0)for(const n of t.events)this._handleEvent(n)}_eventPos(t,e,n,s){if(t.x!=null&&t.z!=null)return s.set(t.x,t.y!=null?t.y:1.1,t.z),s;const r=n??e;return r?(s.copy(r.pos),s.y+=1.2,s):null}_gloveOf(t,e){return t.gloveId??(e==null?void 0:e.activeGloveId)??null}_tintOf(t){return t?t.mats.paint.color:null}_strike(t,e,n,s,r,o={}){if(!n||!this.combatVfx)return null;const a=this._gloveOf(t,e),l=o.skill?kg(t.skillId,a):Ru(a);return this.combatVfx.strike(l,n,s,r,{...o,tint:this._tintOf(e)}),l}_handleEvent(t){const e=t.actorId!=null?this.characters.get(t.actorId):null,n=t.targetId!=null?this.characters.get(t.targetId):null,s=t.power,r=t.targetId!=null&&t.targetId===this.localId,o=t.actorId!=null&&t.actorId===this.localId,a=this._tmp2;switch(e&&n?a.copy(n.pos).sub(e.pos):t.yaw!=null?Bc(t.yaw,a):e?Bc(e.yaw,a):a.set(0,0,-1),a.y=0,a.lengthSq()<1e-6&&a.set(0,0,-1),t.kind){case"swing":{e&&this.characters.playSlap(t.actorId,s);break}case"slap":{if(e&&this.characters.playSlap(t.actorId,s),t.hits===0&&e){const l=this._tmp.copy(e.pos).addScaledVector(a,1.4);l.y+=1.15,this._strike(t,e,l,a,s*.7,{whiff:!0})}break}case"hit":{const l=this._eventPos(t,e,n,this._tmp);if(l&&this.vfx.slap(l,a,s),l&&this._strike(t,e,l,a,s),e){const u=this._tmp3.copy(a).applyAxisAngle(zc,-e.yaw);this.characters.playSlap(t.actorId,s,u.x>=0?1:-1)}n&&this.characters.playHit(t.targetId,a,s);const c=r?.55:o?.34:.12;this.cameraRig.impulse(c*s,r?2.6:1.2);break}case"heavy":{const l=this._eventPos(t,e,n,this._tmp);l&&this.vfx.heavyImpact(l,s*1.3,{dir:a}),l&&this._strike(t,e,l,a,s*1.3,{skill:!0}),n&&this.characters.playHit(t.targetId,a,s*1.3);const c=r?.95:o?.62:.28;this.cameraRig.impulse(c*s,r?4.2:2.2);break}case"skill":{const l=this._eventPos(t,e,n,this._tmp);e&&this.characters.playSlap(t.actorId,s*1.2);const c=l?this._strike(t,e,l,a,s*1.15,{skill:!0}):null;l&&(c==="slab"||c==="cinder")&&this.vfx.heavyImpact(l,s*1.15,{dir:a,crack:!1}),this.cameraRig.impulse(o?.5:.16,o?2.4:1);break}case"ko":{const l=this._eventPos(t,e,n,this._tmp);l&&this.vfx.fallTrail(l.x,l.y,l.z),(o||r)&&this.cameraRig.impulse(.4,1.5);break}case"awaken":{const l=e??n;if(l)for(let c=0;c<8;c++)this.vfx.awakenMotes(l.pos.x,l.pos.y+1.2,l.pos.z);this.cameraRig.impulse(o?.3:.1,1.2);break}case"dash":{t.x!=null&&this.vfx.footDust(t.x,Math.max(0,t.y??0)+.05,t.z,6);break}case"jump":case"respawn":{t.x!=null&&this.vfx.footDust(t.x,Math.max(0,t.y??0)+.05,t.z,5);break}case"tileCrack":{const l=this.island.crackTile(t,.45),c=t.x??(l==null?void 0:l.x),u=t.z??(l==null?void 0:l.z);c!=null&&this.vfx.footDust(c,.08,u,6);break}case"tileBreak":{const l=this.island.breakTile(t),c=t.x??(l==null?void 0:l.x),u=t.z??(l==null?void 0:l.z);if(c==null)break;this._tmp.set(c,.1,u),this.vfx.spawnDebris(this._tmp,1.5),this.vfx.heavyImpact(this._tmp,1.2,{dir:zc,crack:!1});const h=this.characters.get(this.localId),d=h?Math.hypot(h.pos.x-c,h.pos.z-u):99;this.cameraRig.impulse(d<8?.5:.18,d<8?2:.8);break}}}sync(t,e){if(this.disposed)return;const n=Math.min(.05,Number.isFinite(e)?e:this.clock.getDelta());this.time+=n,this.frame++,this.renderer.info.reset();const s=t&&typeof t=="object"?t:{},r=uv(s,{localId:this.forcedLocalId,followId:this.followId});this.lastRaw=s,this.view=r,this.localId=r.localId,this._arenaChanged(r.arena.radius),this.characters.reconcile(r.players,this.localId),this.characters.syncGhosts(r.ghosts),this.island.syncTiles(r.tiles,r.arena);const o=this.hub.sync(r.hub,n,this.time);this.island.setActive(!o),this._consumeEvents(r,s.events);const a=this.spectator||this.localId==null?null:r.players.find(c=>c.id===this.localId);a?this._cullAt.set(a.x??0,0,a.z??0):this._cullAt.set(this._focus.x,0,this._focus.z),this.characters.update(n,this.time,this._cullAt),this.island.update(n,this.time);for(const c of r.players){const u=this.characters.get(c.id);if(!(!u||!c.alive||!u.rootGroup.visible)){if(u.speed>3.2&&c.grounded&&this.frame%3===0&&this.vfx.footDust(u.pos.x,Math.max(0,u.pos.y),u.pos.z,u.speed),c.awakenedT>0)for(const h of u.arms)h.glove.getWorldPosition(this._tmp),this.vfx.awakenMotes(this._tmp.x,this._tmp.y,this._tmp.z);u.pos.y<-1.5&&this.vfx.fallTrail(u.pos.x,u.pos.y,u.pos.z)}}const l=this.spectator||this.localId==null?null:this.characters.get(this.localId);if(l){this._focus.copy(l.pos),this._vel.set((l.pos.x-l.prev.x)/Math.max(n,1e-4),0,(l.pos.z-l.prev.z)/Math.max(n,1e-4));const c=this.lookYaw==null?l.yaw:this.lookYaw;this.cameraRig.update(n,this._focus,c,this._vel,{pitchBias:this._pitchBias()})}else this.cameraRig.orbit(n,this.time,this.arenaRadius*1.35),this._focus.set(0,0,0);this.vfx.ambientDrift(n,this._focus),this.vfx.update(n,this.time),this.combatVfx.update(n,this.time),this.lighting.update(this.time,this._focus),this.sky.update(this.time,this.camera.position),this.renderer.shadowMap.needsUpdate=this.quality.shadows,this.post.render(this.camera)}renderIdle(t){this.sync(this.lastRaw??{},t)}getStats(){var n,s,r,o,a,l,c,u;const t=this.renderer.info,e=((n=this.hub)==null?void 0:n.getStats())??null;return{tier:this.tier,phase:(r=(s=this.view)==null?void 0:s.hub)!=null&&r.active?"hub":"arena",hub:e,pixelRatio:this._ratio,size:[this._w,this._h],drawCalls:t.render.calls,triangles:t.render.triangles,programs:((o=t.programs)==null?void 0:o.length)??0,geometries:t.memory.geometries,textures:t.memory.textures,characters:((a=this.characters)==null?void 0:a.chars.size)??0,ghosts:((l=this.characters)==null?void 0:l.ghostCount)??0,combat:((c=this.combatVfx)==null?void 0:c.getStats())??null,pitch:this.cameraRig.state.pitchOut,tiles:((u=this.island)==null?void 0:u.tileCount)??0,localId:this.localId}}dispose(){var t,e;this.disposed||(this.disposed=!0,this._teardownWorld(),this.scene.clear(),this.renderer.dispose(),(e=(t=this.renderer).forceContextLoss)==null||e.call(t),this.view=null)}}let te=null;function w_(i,t={}){return te&&!te.disposed&&te.dispose(),te=new x_(i,t),te}function b_(i,t){!te||te.disposed||te.sync(i,t)}function E_(i,t,e){return!te||te.disposed?null:te.resize(i,t,e)}function T_(i){return!te||te.disposed?null:te.setQuality(i)}function A_(){te&&(te.dispose(),te=null)}function C_(i){te==null||te.setMobile(i)}function R_(i){te==null||te.setSpectator(i)}function M_(i){return(te==null?void 0:te.setLocalId(i))??null}function P_(i){return M_(i)}function I_(i){return te&&!te.disposed?te.setLook(i):null}function L_(i){return te&&!te.disposed?te.setPitch(i):null}function D_(){return te&&!te.disposed?te.getLook():null}function U_(){return te&&!te.disposed?te.getStats():null}function N_(){return te}export{ya as ACCESSORIES,Fg as COMBAT_VFX_KIND,To as DEFAULT_LOCAL_ID,zu as GLOVE_TINT,Ut as PALETTE,Ao as QUALITY,S_ as QUALITY_TIERS,Og as SKILL_VFX_KIND,x_ as YizhangRenderer,Xg as accessoryFromAppearance,Ru as combatVfxKind,w_ as createRenderer,A_ as dispose,D_ as getLook,N_ as getRenderer,U_ as getStats,E_ as resize,Yg as resolveSkinLook,P_ as setFollow,M_ as setLocalId,I_ as setLook,C_ as setMobile,L_ as setPitch,T_ as setQuality,R_ as setSpectator,kg as skillVfxKind,Ja as skinTable,b_ as sync};
//# sourceMappingURL=index-Dhfzb0JA.js.map
