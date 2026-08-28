import{r as ju,s as Qu}from"./index-B9LJgkNt.js";/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Pa="170",th=0,ul=1,eh=2,Ia=1,tu=2,Fn=3,ti=0,He=1,Ie=2,$n=0,Ge=1,qi=2,hl=3,fl=4,nh=5,pi=100,ih=101,sh=102,rh=103,oh=104,ah=200,lh=201,ch=202,uh=203,Do=204,Uo=205,hh=206,fh=207,dh=208,ph=209,mh=210,gh=211,vh=212,_h=213,xh=214,No=0,Fo=1,Oo=2,Zi=3,ko=4,zo=5,Bo=6,Ho=7,eu=0,Mh=1,yh=2,zn=0,Sh=1,wh=2,bh=3,Eh=4,Th=5,Ah=6,Ch=7,dl="attached",Rh="detached",nu=300,Ki=301,Ji=302,Go=303,Vo=304,Ir=306,$i=1e3,yn=1001,Wo=1002,tn=1003,Ph=1004,Fs=1005,Be=1006,Hr=1007,Sn=1008,bn=1009,iu=1010,su=1011,bs=1012,La=1013,_i=1014,mn=1015,es=1016,Da=1017,Ua=1018,ji=1020,ru=35902,ou=1021,au=1022,qe=1023,lu=1024,cu=1025,Xi=1026,Qi=1027,Na=1028,Fa=1029,uu=1030,Oa=1031,ka=1033,gr=33776,vr=33777,_r=33778,xr=33779,Xo=35840,Yo=35841,qo=35842,Zo=35843,Ko=36196,Jo=37492,$o=37496,jo=37808,Qo=37809,ta=37810,ea=37811,na=37812,ia=37813,sa=37814,ra=37815,oa=37816,aa=37817,la=37818,ca=37819,ua=37820,ha=37821,Mr=36492,fa=36494,da=36495,hu=36283,pa=36284,ma=36285,ga=36286,Ih=3200,Lh=3201,fu=0,Dh=1,fn="",Ye="srgb",ns="srgb-linear",Lr="linear",de="srgb",wi=7680,pl=519,Uh=512,Nh=513,Fh=514,du=515,Oh=516,kh=517,zh=518,Bh=519,ml=35044,Le=35048,gl="300 es",On=2e3,wr=2001;class is{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const s=this._listeners[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}}const Ue=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Gr=Math.PI/180,va=180/Math.PI;function Mi(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ue[i&255]+Ue[i>>8&255]+Ue[i>>16&255]+Ue[i>>24&255]+"-"+Ue[t&255]+Ue[t>>8&255]+"-"+Ue[t>>16&15|64]+Ue[t>>24&255]+"-"+Ue[e&63|128]+Ue[e>>8&255]+"-"+Ue[e>>16&255]+Ue[e>>24&255]+Ue[n&255]+Ue[n>>8&255]+Ue[n>>16&255]+Ue[n>>24&255]).toLowerCase()}function Pe(i,t,e){return Math.max(t,Math.min(e,i))}function Hh(i,t){return(i%t+t)%t}function Vr(i,t,e){return(1-e)*i+e*t}function ls(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function We(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}class Tt{constructor(t=0,e=0){Tt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Pe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class jt{constructor(t,e,n,s,r,o,a,l,c){jt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c)}set(t,e,n,s,r,o,a,l,c){const u=this.elements;return u[0]=t,u[1]=s,u[2]=a,u[3]=e,u[4]=r,u[5]=l,u[6]=n,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],u=n[4],h=n[7],d=n[2],f=n[5],g=n[8],v=s[0],m=s[3],p=s[6],y=s[1],M=s[4],x=s[7],q=s[2],R=s[5],L=s[8];return r[0]=o*v+a*y+l*q,r[3]=o*m+a*M+l*R,r[6]=o*p+a*x+l*L,r[1]=c*v+u*y+h*q,r[4]=c*m+u*M+h*R,r[7]=c*p+u*x+h*L,r[2]=d*v+f*y+g*q,r[5]=d*m+f*M+g*R,r[8]=d*p+f*x+g*L,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8];return e*o*u-e*a*c-n*r*u+n*a*l+s*r*c-s*o*l}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],h=u*o-a*c,d=a*l-u*r,f=c*r-o*l,g=e*h+n*d+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/g;return t[0]=h*v,t[1]=(s*c-u*n)*v,t[2]=(a*n-s*o)*v,t[3]=d*v,t[4]=(u*e-s*l)*v,t[5]=(s*r-a*e)*v,t[6]=f*v,t[7]=(n*l-c*e)*v,t[8]=(o*e-n*r)*v,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+t,-s*c,s*l,-s*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(Wr.makeScale(t,e)),this}rotate(t){return this.premultiply(Wr.makeRotation(-t)),this}translate(t,e){return this.premultiply(Wr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Wr=new jt;function pu(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function br(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Gh(){const i=br("canvas");return i.style.display="block",i}const vl={};function xs(i){i in vl||(vl[i]=!0,console.warn(i))}function Vh(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function Wh(i){const t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Xh(i){const t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const ae={enabled:!0,workingColorSpace:ns,spaces:{},convert:function(i,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===de&&(i.r=Bn(i.r),i.g=Bn(i.g),i.b=Bn(i.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(i.applyMatrix3(this.spaces[t].toXYZ),i.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===de&&(i.r=Yi(i.r),i.g=Yi(i.g),i.b=Yi(i.b))),i},fromWorkingColorSpace:function(i,t){return this.convert(i,this.workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===fn?Lr:this.spaces[i].transfer},getLuminanceCoefficients:function(i,t=this.workingColorSpace){return i.fromArray(this.spaces[t].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,t,e){return i.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function Bn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Yi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}const _l=[.64,.33,.3,.6,.15,.06],xl=[.2126,.7152,.0722],Ml=[.3127,.329],yl=new jt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Sl=new jt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);ae.define({[ns]:{primaries:_l,whitePoint:Ml,transfer:Lr,toXYZ:yl,fromXYZ:Sl,luminanceCoefficients:xl,workingColorSpaceConfig:{unpackColorSpace:Ye},outputColorSpaceConfig:{drawingBufferColorSpace:Ye}},[Ye]:{primaries:_l,whitePoint:Ml,transfer:de,toXYZ:yl,fromXYZ:Sl,luminanceCoefficients:xl,outputColorSpaceConfig:{drawingBufferColorSpace:Ye}}});let bi;class Yh{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{bi===void 0&&(bi=br("canvas")),bi.width=t.width,bi.height=t.height;const n=bi.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=bi}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=br("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Bn(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Bn(e[n]/255)*255):e[n]=Bn(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let qh=0;class mu{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:qh++}),this.uuid=Mi(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Xr(s[o].image)):r.push(Xr(s[o]))}else r=Xr(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function Xr(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Yh.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Zh=0;class ke extends is{constructor(t=ke.DEFAULT_IMAGE,e=ke.DEFAULT_MAPPING,n=yn,s=yn,r=Be,o=Sn,a=qe,l=bn,c=ke.DEFAULT_ANISOTROPY,u=fn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Zh++}),this.uuid=Mi(),this.name="",this.source=new mu(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Tt(0,0),this.repeat=new Tt(1,1),this.center=new Tt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new jt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==nu)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case $i:t.x=t.x-Math.floor(t.x);break;case yn:t.x=t.x<0?0:1;break;case Wo:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case $i:t.y=t.y-Math.floor(t.y);break;case yn:t.y=t.y<0?0:1;break;case Wo:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}ke.DEFAULT_IMAGE=null;ke.DEFAULT_MAPPING=nu;ke.DEFAULT_ANISOTROPY=1;class ce{constructor(t=0,e=0,n=0,s=1){ce.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const l=t.elements,c=l[0],u=l[4],h=l[8],d=l[1],f=l[5],g=l[9],v=l[2],m=l[6],p=l[10];if(Math.abs(u-d)<.01&&Math.abs(h-v)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+v)<.1&&Math.abs(g+m)<.1&&Math.abs(c+f+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const M=(c+1)/2,x=(f+1)/2,q=(p+1)/2,R=(u+d)/4,L=(h+v)/4,N=(g+m)/4;return M>x&&M>q?M<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(M),s=R/n,r=L/n):x>q?x<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(x),n=R/s,r=N/s):q<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(q),n=L/r,s=N/r),this.set(n,s,r,e),this}let y=Math.sqrt((m-g)*(m-g)+(h-v)*(h-v)+(d-u)*(d-u));return Math.abs(y)<.001&&(y=1),this.x=(m-g)/y,this.y=(h-v)/y,this.z=(d-u)/y,this.w=Math.acos((c+f+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Kh extends is{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new ce(0,0,t,e),this.scissorTest=!1,this.viewport=new ce(0,0,t,e);const s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Be,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const r=new ke(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new mu(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class ei extends Kh{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class gu extends ke{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=tn,this.minFilter=tn,this.wrapR=yn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Jh extends ke{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=tn,this.minFilter=tn,this.wrapR=yn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Is{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let l=n[s+0],c=n[s+1],u=n[s+2],h=n[s+3];const d=r[o+0],f=r[o+1],g=r[o+2],v=r[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h;return}if(a===1){t[e+0]=d,t[e+1]=f,t[e+2]=g,t[e+3]=v;return}if(h!==v||l!==d||c!==f||u!==g){let m=1-a;const p=l*d+c*f+u*g+h*v,y=p>=0?1:-1,M=1-p*p;if(M>Number.EPSILON){const q=Math.sqrt(M),R=Math.atan2(q,p*y);m=Math.sin(m*R)/q,a=Math.sin(a*R)/q}const x=a*y;if(l=l*m+d*x,c=c*m+f*x,u=u*m+g*x,h=h*m+v*x,m===1-a){const q=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=q,c*=q,u*=q,h*=q}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h}static multiplyQuaternionsFlat(t,e,n,s,r,o){const a=n[s],l=n[s+1],c=n[s+2],u=n[s+3],h=r[o],d=r[o+1],f=r[o+2],g=r[o+3];return t[e]=a*g+u*h+l*f-c*d,t[e+1]=l*g+u*d+c*h-a*f,t[e+2]=c*g+u*f+a*d-l*h,t[e+3]=u*g-a*h-l*d-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(n/2),u=a(s/2),h=a(r/2),d=l(n/2),f=l(s/2),g=l(r/2);switch(o){case"XYZ":this._x=d*u*h+c*f*g,this._y=c*f*h-d*u*g,this._z=c*u*g+d*f*h,this._w=c*u*h-d*f*g;break;case"YXZ":this._x=d*u*h+c*f*g,this._y=c*f*h-d*u*g,this._z=c*u*g-d*f*h,this._w=c*u*h+d*f*g;break;case"ZXY":this._x=d*u*h-c*f*g,this._y=c*f*h+d*u*g,this._z=c*u*g+d*f*h,this._w=c*u*h-d*f*g;break;case"ZYX":this._x=d*u*h-c*f*g,this._y=c*f*h+d*u*g,this._z=c*u*g-d*f*h,this._w=c*u*h+d*f*g;break;case"YZX":this._x=d*u*h+c*f*g,this._y=c*f*h+d*u*g,this._z=c*u*g-d*f*h,this._w=c*u*h-d*f*g;break;case"XZY":this._x=d*u*h-c*f*g,this._y=c*f*h-d*u*g,this._z=c*u*g+d*f*h,this._w=c*u*h+d*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],l=e[9],c=e[2],u=e[6],h=e[10],d=n+a+h;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(u-l)*f,this._y=(r-c)*f,this._z=(o-s)*f}else if(n>a&&n>h){const f=2*Math.sqrt(1+n-a-h);this._w=(u-l)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+c)/f}else if(a>h){const f=2*Math.sqrt(1+a-n-h);this._w=(r-c)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(l+u)/f}else{const f=2*Math.sqrt(1+h-n-a);this._w=(o-s)/f,this._x=(r+c)/f,this._y=(l+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Pe(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,l=e._y,c=e._z,u=e._w;return this._x=n*u+o*a+s*c-r*l,this._y=s*u+o*l+r*a-n*c,this._z=r*u+o*c+n*l-s*a,this._w=o*u-n*a-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,s=this._y,r=this._z,o=this._w;let a=o*t._w+n*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;const l=1-a*a;if(l<=Number.EPSILON){const f=1-e;return this._w=f*o+e*this._w,this._x=f*n+e*this._x,this._y=f*s+e*this._y,this._z=f*r+e*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,a),h=Math.sin((1-e)*u)/c,d=Math.sin(e*u)/c;return this._w=o*h+this._w*d,this._x=n*h+this._x*d,this._y=s*h+this._y*d,this._z=r*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class O{constructor(t=0,e=0,n=0){O.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(wl.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(wl.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*s-a*n),u=2*(a*e-r*s),h=2*(r*n-o*e);return this.x=e+l*c+o*h-a*u,this.y=n+l*u+a*c-r*h,this.z=s+l*h+r*u-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,l=e.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Yr.copy(this).projectOnVector(t),this.sub(Yr)}reflect(t){return this.sub(Yr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Pe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Yr=new O,wl=new Is;class ni{constructor(t=new O(1/0,1/0,1/0),e=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(ln.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(ln.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=ln.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,ln):ln.fromBufferAttribute(r,o),ln.applyMatrix4(t.matrixWorld),this.expandByPoint(ln);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Os.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Os.copy(n.boundingBox)),Os.applyMatrix4(t.matrixWorld),this.union(Os)}const s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,ln),ln.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(cs),ks.subVectors(this.max,cs),Ei.subVectors(t.a,cs),Ti.subVectors(t.b,cs),Ai.subVectors(t.c,cs),Wn.subVectors(Ti,Ei),Xn.subVectors(Ai,Ti),ri.subVectors(Ei,Ai);let e=[0,-Wn.z,Wn.y,0,-Xn.z,Xn.y,0,-ri.z,ri.y,Wn.z,0,-Wn.x,Xn.z,0,-Xn.x,ri.z,0,-ri.x,-Wn.y,Wn.x,0,-Xn.y,Xn.x,0,-ri.y,ri.x,0];return!qr(e,Ei,Ti,Ai,ks)||(e=[1,0,0,0,1,0,0,0,1],!qr(e,Ei,Ti,Ai,ks))?!1:(zs.crossVectors(Wn,Xn),e=[zs.x,zs.y,zs.z],qr(e,Ei,Ti,Ai,ks))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,ln).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(ln).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Rn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Rn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Rn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Rn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Rn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Rn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Rn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Rn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Rn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Rn=[new O,new O,new O,new O,new O,new O,new O,new O],ln=new O,Os=new ni,Ei=new O,Ti=new O,Ai=new O,Wn=new O,Xn=new O,ri=new O,cs=new O,ks=new O,zs=new O,oi=new O;function qr(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){oi.fromArray(i,r);const a=s.x*Math.abs(oi.x)+s.y*Math.abs(oi.y)+s.z*Math.abs(oi.z),l=t.dot(oi),c=e.dot(oi),u=n.dot(oi);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}const $h=new ni,us=new O,Zr=new O;class Tn{constructor(t=new O,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):$h.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;us.subVectors(t,this.center);const e=us.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(us,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Zr.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(us.copy(t.center).add(Zr)),this.expandByPoint(us.copy(t.center).sub(Zr))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Pn=new O,Kr=new O,Bs=new O,Yn=new O,Jr=new O,Hs=new O,$r=new O;class Dr{constructor(t=new O,e=new O(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Pn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=Pn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Pn.copy(this.origin).addScaledVector(this.direction,e),Pn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Kr.copy(t).add(e).multiplyScalar(.5),Bs.copy(e).sub(t).normalize(),Yn.copy(this.origin).sub(Kr);const r=t.distanceTo(e)*.5,o=-this.direction.dot(Bs),a=Yn.dot(this.direction),l=-Yn.dot(Bs),c=Yn.lengthSq(),u=Math.abs(1-o*o);let h,d,f,g;if(u>0)if(h=o*l-a,d=o*a-l,g=r*u,h>=0)if(d>=-g)if(d<=g){const v=1/u;h*=v,d*=v,f=h*(h+o*d+2*a)+d*(o*h+d+2*l)+c}else d=r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*l)+c;else d=-r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*l)+c;else d<=-g?(h=Math.max(0,-(-o*r+a)),d=h>0?-r:Math.min(Math.max(-r,-l),r),f=-h*h+d*(d+2*l)+c):d<=g?(h=0,d=Math.min(Math.max(-r,-l),r),f=d*(d+2*l)+c):(h=Math.max(0,-(o*r+a)),d=h>0?r:Math.min(Math.max(-r,-l),r),f=-h*h+d*(d+2*l)+c);else d=o>0?-r:r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,h),s&&s.copy(Kr).addScaledVector(Bs,d),f}intersectSphere(t,e){Pn.subVectors(t.center,this.origin);const n=Pn.dot(this.direction),s=Pn.dot(Pn)-n*n,r=t.radius*t.radius;if(s>r)return null;const o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return c>=0?(n=(t.min.x-d.x)*c,s=(t.max.x-d.x)*c):(n=(t.max.x-d.x)*c,s=(t.min.x-d.x)*c),u>=0?(r=(t.min.y-d.y)*u,o=(t.max.y-d.y)*u):(r=(t.max.y-d.y)*u,o=(t.min.y-d.y)*u),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),h>=0?(a=(t.min.z-d.z)*h,l=(t.max.z-d.z)*h):(a=(t.max.z-d.z)*h,l=(t.min.z-d.z)*h),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Pn)!==null}intersectTriangle(t,e,n,s,r){Jr.subVectors(e,t),Hs.subVectors(n,t),$r.crossVectors(Jr,Hs);let o=this.direction.dot($r),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Yn.subVectors(this.origin,t);const l=a*this.direction.dot(Hs.crossVectors(Yn,Hs));if(l<0)return null;const c=a*this.direction.dot(Jr.cross(Yn));if(c<0||l+c>o)return null;const u=-a*Yn.dot($r);return u<0?null:this.at(u/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Qt{constructor(t,e,n,s,r,o,a,l,c,u,h,d,f,g,v,m){Qt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c,u,h,d,f,g,v,m)}set(t,e,n,s,r,o,a,l,c,u,h,d,f,g,v,m){const p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=u,p[10]=h,p[14]=d,p[3]=f,p[7]=g,p[11]=v,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Qt().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,s=1/Ci.setFromMatrixColumn(t,0).length(),r=1/Ci.setFromMatrixColumn(t,1).length(),o=1/Ci.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),h=Math.sin(r);if(t.order==="XYZ"){const d=o*u,f=o*h,g=a*u,v=a*h;e[0]=l*u,e[4]=-l*h,e[8]=c,e[1]=f+g*c,e[5]=d-v*c,e[9]=-a*l,e[2]=v-d*c,e[6]=g+f*c,e[10]=o*l}else if(t.order==="YXZ"){const d=l*u,f=l*h,g=c*u,v=c*h;e[0]=d+v*a,e[4]=g*a-f,e[8]=o*c,e[1]=o*h,e[5]=o*u,e[9]=-a,e[2]=f*a-g,e[6]=v+d*a,e[10]=o*l}else if(t.order==="ZXY"){const d=l*u,f=l*h,g=c*u,v=c*h;e[0]=d-v*a,e[4]=-o*h,e[8]=g+f*a,e[1]=f+g*a,e[5]=o*u,e[9]=v-d*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){const d=o*u,f=o*h,g=a*u,v=a*h;e[0]=l*u,e[4]=g*c-f,e[8]=d*c+v,e[1]=l*h,e[5]=v*c+d,e[9]=f*c-g,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){const d=o*l,f=o*c,g=a*l,v=a*c;e[0]=l*u,e[4]=v-d*h,e[8]=g*h+f,e[1]=h,e[5]=o*u,e[9]=-a*u,e[2]=-c*u,e[6]=f*h+g,e[10]=d-v*h}else if(t.order==="XZY"){const d=o*l,f=o*c,g=a*l,v=a*c;e[0]=l*u,e[4]=-h,e[8]=c*u,e[1]=d*h+v,e[5]=o*u,e[9]=f*h-g,e[2]=g*h-f,e[6]=a*u,e[10]=v*h+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(jh,t,Qh)}lookAt(t,e,n){const s=this.elements;return Je.subVectors(t,e),Je.lengthSq()===0&&(Je.z=1),Je.normalize(),qn.crossVectors(n,Je),qn.lengthSq()===0&&(Math.abs(n.z)===1?Je.x+=1e-4:Je.z+=1e-4,Je.normalize(),qn.crossVectors(n,Je)),qn.normalize(),Gs.crossVectors(Je,qn),s[0]=qn.x,s[4]=Gs.x,s[8]=Je.x,s[1]=qn.y,s[5]=Gs.y,s[9]=Je.y,s[2]=qn.z,s[6]=Gs.z,s[10]=Je.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],u=n[1],h=n[5],d=n[9],f=n[13],g=n[2],v=n[6],m=n[10],p=n[14],y=n[3],M=n[7],x=n[11],q=n[15],R=s[0],L=s[4],N=s[8],T=s[12],_=s[1],P=s[5],V=s[9],H=s[13],k=s[2],j=s[6],C=s[10],G=s[14],z=s[3],b=s[7],W=s[11],rt=s[15];return r[0]=o*R+a*_+l*k+c*z,r[4]=o*L+a*P+l*j+c*b,r[8]=o*N+a*V+l*C+c*W,r[12]=o*T+a*H+l*G+c*rt,r[1]=u*R+h*_+d*k+f*z,r[5]=u*L+h*P+d*j+f*b,r[9]=u*N+h*V+d*C+f*W,r[13]=u*T+h*H+d*G+f*rt,r[2]=g*R+v*_+m*k+p*z,r[6]=g*L+v*P+m*j+p*b,r[10]=g*N+v*V+m*C+p*W,r[14]=g*T+v*H+m*G+p*rt,r[3]=y*R+M*_+x*k+q*z,r[7]=y*L+M*P+x*j+q*b,r[11]=y*N+M*V+x*C+q*W,r[15]=y*T+M*H+x*G+q*rt,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],l=t[9],c=t[13],u=t[2],h=t[6],d=t[10],f=t[14],g=t[3],v=t[7],m=t[11],p=t[15];return g*(+r*l*h-s*c*h-r*a*d+n*c*d+s*a*f-n*l*f)+v*(+e*l*f-e*c*d+r*o*d-s*o*f+s*c*u-r*l*u)+m*(+e*c*h-e*a*f-r*o*h+n*o*f+r*a*u-n*c*u)+p*(-s*a*u-e*l*h+e*a*d+s*o*h-n*o*d+n*l*u)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],h=t[9],d=t[10],f=t[11],g=t[12],v=t[13],m=t[14],p=t[15],y=h*m*c-v*d*c+v*l*f-a*m*f-h*l*p+a*d*p,M=g*d*c-u*m*c-g*l*f+o*m*f+u*l*p-o*d*p,x=u*v*c-g*h*c+g*a*f-o*v*f-u*a*p+o*h*p,q=g*h*l-u*v*l-g*a*d+o*v*d+u*a*m-o*h*m,R=e*y+n*M+s*x+r*q;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const L=1/R;return t[0]=y*L,t[1]=(v*d*r-h*m*r-v*s*f+n*m*f+h*s*p-n*d*p)*L,t[2]=(a*m*r-v*l*r+v*s*c-n*m*c-a*s*p+n*l*p)*L,t[3]=(h*l*r-a*d*r-h*s*c+n*d*c+a*s*f-n*l*f)*L,t[4]=M*L,t[5]=(u*m*r-g*d*r+g*s*f-e*m*f-u*s*p+e*d*p)*L,t[6]=(g*l*r-o*m*r-g*s*c+e*m*c+o*s*p-e*l*p)*L,t[7]=(o*d*r-u*l*r+u*s*c-e*d*c-o*s*f+e*l*f)*L,t[8]=x*L,t[9]=(g*h*r-u*v*r-g*n*f+e*v*f+u*n*p-e*h*p)*L,t[10]=(o*v*r-g*a*r+g*n*c-e*v*c-o*n*p+e*a*p)*L,t[11]=(u*a*r-o*h*r-u*n*c+e*h*c+o*n*f-e*a*f)*L,t[12]=q*L,t[13]=(u*v*s-g*h*s+g*n*d-e*v*d-u*n*m+e*h*m)*L,t[14]=(g*a*s-o*v*s-g*n*l+e*v*l+o*n*m-e*a*m)*L,t[15]=(o*h*s-u*a*s+u*n*l-e*h*l-o*n*d+e*a*d)*L,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,l=t.z,c=r*o,u=r*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,u*a+n,u*l-s*o,0,c*l-s*a,u*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,o=e._y,a=e._z,l=e._w,c=r+r,u=o+o,h=a+a,d=r*c,f=r*u,g=r*h,v=o*u,m=o*h,p=a*h,y=l*c,M=l*u,x=l*h,q=n.x,R=n.y,L=n.z;return s[0]=(1-(v+p))*q,s[1]=(f+x)*q,s[2]=(g-M)*q,s[3]=0,s[4]=(f-x)*R,s[5]=(1-(d+p))*R,s[6]=(m+y)*R,s[7]=0,s[8]=(g+M)*L,s[9]=(m-y)*L,s[10]=(1-(d+v))*L,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;let r=Ci.set(s[0],s[1],s[2]).length();const o=Ci.set(s[4],s[5],s[6]).length(),a=Ci.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],cn.copy(this);const c=1/r,u=1/o,h=1/a;return cn.elements[0]*=c,cn.elements[1]*=c,cn.elements[2]*=c,cn.elements[4]*=u,cn.elements[5]*=u,cn.elements[6]*=u,cn.elements[8]*=h,cn.elements[9]*=h,cn.elements[10]*=h,e.setFromRotationMatrix(cn),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,s,r,o,a=On){const l=this.elements,c=2*r/(e-t),u=2*r/(n-s),h=(e+t)/(e-t),d=(n+s)/(n-s);let f,g;if(a===On)f=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===wr)f=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=u,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=On){const l=this.elements,c=1/(e-t),u=1/(n-s),h=1/(o-r),d=(e+t)*c,f=(n+s)*u;let g,v;if(a===On)g=(o+r)*h,v=-2*h;else if(a===wr)g=r*h,v=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=v,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Ci=new O,cn=new Qt,jh=new O(0,0,0),Qh=new O(1,1,1),qn=new O,Gs=new O,Je=new O,bl=new Qt,El=new Is;class En{constructor(t=0,e=0,n=0,s=En.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],u=s[9],h=s[2],d=s[6],f=s[10];switch(e){case"XYZ":this._y=Math.asin(Pe(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Pe(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin(Pe(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Pe(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Pe(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-Pe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return bl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(bl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return El.setFromEuler(this),this.setFromQuaternion(El,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}En.DEFAULT_ORDER="XYZ";class vu{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let tf=0;const Tl=new O,Ri=new Is,In=new Qt,Vs=new O,hs=new O,ef=new O,nf=new Is,Al=new O(1,0,0),Cl=new O(0,1,0),Rl=new O(0,0,1),Pl={type:"added"},sf={type:"removed"},Pi={type:"childadded",child:null},jr={type:"childremoved",child:null};class Jt extends is{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:tf++}),this.uuid=Mi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Jt.DEFAULT_UP.clone();const t=new O,e=new En,n=new Is,s=new O(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Qt},normalMatrix:{value:new jt}}),this.matrix=new Qt,this.matrixWorld=new Qt,this.matrixAutoUpdate=Jt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Jt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new vu,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Ri.setFromAxisAngle(t,e),this.quaternion.multiply(Ri),this}rotateOnWorldAxis(t,e){return Ri.setFromAxisAngle(t,e),this.quaternion.premultiply(Ri),this}rotateX(t){return this.rotateOnAxis(Al,t)}rotateY(t){return this.rotateOnAxis(Cl,t)}rotateZ(t){return this.rotateOnAxis(Rl,t)}translateOnAxis(t,e){return Tl.copy(t).applyQuaternion(this.quaternion),this.position.add(Tl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Al,t)}translateY(t){return this.translateOnAxis(Cl,t)}translateZ(t){return this.translateOnAxis(Rl,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(In.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Vs.copy(t):Vs.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),hs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?In.lookAt(hs,Vs,this.up):In.lookAt(Vs,hs,this.up),this.quaternion.setFromRotationMatrix(In),s&&(In.extractRotation(s.matrixWorld),Ri.setFromRotationMatrix(In),this.quaternion.premultiply(Ri.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Pl),Pi.child=t,this.dispatchEvent(Pi),Pi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(sf),jr.child=t,this.dispatchEvent(jr),jr.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),In.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),In.multiply(t.parent.matrixWorld)),t.applyMatrix4(In),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Pl),Pi.child=t,this.dispatchEvent(Pi),Pi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(hs,t,ef),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(hs,nf,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];r(t.shapes,h)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(t.materials,this.material[l]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];s.animations.push(r(t.animations,l))}}if(e){const a=o(t.geometries),l=o(t.materials),c=o(t.textures),u=o(t.images),h=o(t.shapes),d=o(t.skeletons),f=o(t.animations),g=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){const l=[];for(const c in a){const u=a[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}Jt.DEFAULT_UP=new O(0,1,0);Jt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Jt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const un=new O,Ln=new O,Qr=new O,Dn=new O,Ii=new O,Li=new O,Il=new O,to=new O,eo=new O,no=new O,io=new ce,so=new ce,ro=new ce;class dn{constructor(t=new O,e=new O,n=new O){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),un.subVectors(t,e),s.cross(un);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){un.subVectors(s,e),Ln.subVectors(n,e),Qr.subVectors(t,e);const o=un.dot(un),a=un.dot(Ln),l=un.dot(Qr),c=Ln.dot(Ln),u=Ln.dot(Qr),h=o*c-a*a;if(h===0)return r.set(0,0,0),null;const d=1/h,f=(c*l-a*u)*d,g=(o*u-a*l)*d;return r.set(1-f-g,g,f)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Dn)===null?!1:Dn.x>=0&&Dn.y>=0&&Dn.x+Dn.y<=1}static getInterpolation(t,e,n,s,r,o,a,l){return this.getBarycoord(t,e,n,s,Dn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Dn.x),l.addScaledVector(o,Dn.y),l.addScaledVector(a,Dn.z),l)}static getInterpolatedAttribute(t,e,n,s,r,o){return io.setScalar(0),so.setScalar(0),ro.setScalar(0),io.fromBufferAttribute(t,e),so.fromBufferAttribute(t,n),ro.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(io,r.x),o.addScaledVector(so,r.y),o.addScaledVector(ro,r.z),o}static isFrontFacing(t,e,n,s){return un.subVectors(n,e),Ln.subVectors(t,e),un.cross(Ln).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return un.subVectors(this.c,this.b),Ln.subVectors(this.a,this.b),un.cross(Ln).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return dn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return dn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return dn.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return dn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return dn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let o,a;Ii.subVectors(s,n),Li.subVectors(r,n),to.subVectors(t,n);const l=Ii.dot(to),c=Li.dot(to);if(l<=0&&c<=0)return e.copy(n);eo.subVectors(t,s);const u=Ii.dot(eo),h=Li.dot(eo);if(u>=0&&h<=u)return e.copy(s);const d=l*h-u*c;if(d<=0&&l>=0&&u<=0)return o=l/(l-u),e.copy(n).addScaledVector(Ii,o);no.subVectors(t,r);const f=Ii.dot(no),g=Li.dot(no);if(g>=0&&f<=g)return e.copy(r);const v=f*c-l*g;if(v<=0&&c>=0&&g<=0)return a=c/(c-g),e.copy(n).addScaledVector(Li,a);const m=u*g-f*h;if(m<=0&&h-u>=0&&f-g>=0)return Il.subVectors(r,s),a=(h-u)/(h-u+(f-g)),e.copy(s).addScaledVector(Il,a);const p=1/(m+v+d);return o=v*p,a=d*p,e.copy(n).addScaledVector(Ii,o).addScaledVector(Li,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const _u={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Zn={h:0,s:0,l:0},Ws={h:0,s:0,l:0};function oo(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class ut{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ye){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ae.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=ae.workingColorSpace){return this.r=t,this.g=e,this.b=n,ae.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=ae.workingColorSpace){if(t=Hh(t,1),e=Pe(e,0,1),n=Pe(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=oo(o,r,t+1/3),this.g=oo(o,r,t),this.b=oo(o,r,t-1/3)}return ae.toWorkingColorSpace(this,s),this}setStyle(t,e=Ye){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ye){const n=_u[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Bn(t.r),this.g=Bn(t.g),this.b=Bn(t.b),this}copyLinearToSRGB(t){return this.r=Yi(t.r),this.g=Yi(t.g),this.b=Yi(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ye){return ae.fromWorkingColorSpace(Ne.copy(this),t),Math.round(Pe(Ne.r*255,0,255))*65536+Math.round(Pe(Ne.g*255,0,255))*256+Math.round(Pe(Ne.b*255,0,255))}getHexString(t=Ye){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ae.workingColorSpace){ae.fromWorkingColorSpace(Ne.copy(this),e);const n=Ne.r,s=Ne.g,r=Ne.b,o=Math.max(n,s,r),a=Math.min(n,s,r);let l,c;const u=(a+o)/2;if(a===o)l=0,c=0;else{const h=o-a;switch(c=u<=.5?h/(o+a):h/(2-o-a),o){case n:l=(s-r)/h+(s<r?6:0);break;case s:l=(r-n)/h+2;break;case r:l=(n-s)/h+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=ae.workingColorSpace){return ae.fromWorkingColorSpace(Ne.copy(this),e),t.r=Ne.r,t.g=Ne.g,t.b=Ne.b,t}getStyle(t=Ye){ae.fromWorkingColorSpace(Ne.copy(this),t);const e=Ne.r,n=Ne.g,s=Ne.b;return t!==Ye?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Zn),this.setHSL(Zn.h+t,Zn.s+e,Zn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Zn),t.getHSL(Ws);const n=Vr(Zn.h,Ws.h,e),s=Vr(Zn.s,Ws.s,e),r=Vr(Zn.l,Ws.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ne=new ut;ut.NAMES=_u;let rf=0;class yi extends is{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:rf++}),this.uuid=Mi(),this.name="",this.blending=Ge,this.side=ti,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Do,this.blendDst=Uo,this.blendEquation=pi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ut(0,0,0),this.blendAlpha=0,this.depthFunc=Zi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=pl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=wi,this.stencilZFail=wi,this.stencilZPass=wi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Ge&&(n.blending=this.blending),this.side!==ti&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Do&&(n.blendSrc=this.blendSrc),this.blendDst!==Uo&&(n.blendDst=this.blendDst),this.blendEquation!==pi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Zi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==pl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==wi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==wi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==wi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const o=[];for(const a in r){const l=r[a];delete l.metadata,o.push(l)}return o}if(e){const r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class gn extends yi{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new ut(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new En,this.combine=eu,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const we=new O,Xs=new Tt;class Se{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=ml,this.updateRanges=[],this.gpuType=mn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Xs.fromBufferAttribute(this,e),Xs.applyMatrix3(t),this.setXY(e,Xs.x,Xs.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)we.fromBufferAttribute(this,e),we.applyMatrix3(t),this.setXYZ(e,we.x,we.y,we.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)we.fromBufferAttribute(this,e),we.applyMatrix4(t),this.setXYZ(e,we.x,we.y,we.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)we.fromBufferAttribute(this,e),we.applyNormalMatrix(t),this.setXYZ(e,we.x,we.y,we.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)we.fromBufferAttribute(this,e),we.transformDirection(t),this.setXYZ(e,we.x,we.y,we.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=ls(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=We(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=ls(e,this.array)),e}setX(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=ls(e,this.array)),e}setY(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=ls(e,this.array)),e}setZ(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=ls(e,this.array)),e}setW(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=We(e,this.array),n=We(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=We(e,this.array),n=We(n,this.array),s=We(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=We(e,this.array),n=We(n,this.array),s=We(s,this.array),r=We(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==ml&&(t.usage=this.usage),t}}class xu extends Se{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Mu extends Se{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class Zt extends Se{constructor(t,e,n){super(new Float32Array(t),e,n)}}let of=0;const nn=new Qt,ao=new Jt,Di=new O,$e=new ni,fs=new ni,Re=new O;class ye extends is{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:of++}),this.uuid=Mi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(pu(t)?Mu:xu)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new jt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return nn.makeRotationFromQuaternion(t),this.applyMatrix4(nn),this}rotateX(t){return nn.makeRotationX(t),this.applyMatrix4(nn),this}rotateY(t){return nn.makeRotationY(t),this.applyMatrix4(nn),this}rotateZ(t){return nn.makeRotationZ(t),this.applyMatrix4(nn),this}translate(t,e,n){return nn.makeTranslation(t,e,n),this.applyMatrix4(nn),this}scale(t,e,n){return nn.makeScale(t,e,n),this.applyMatrix4(nn),this}lookAt(t){return ao.lookAt(t),ao.updateMatrix(),this.applyMatrix4(ao.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Di).negate(),this.translate(Di.x,Di.y,Di.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let s=0,r=t.length;s<r;s++){const o=t[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Zt(n,3))}else{for(let n=0,s=e.count;n<s;n++){const r=t[n];e.setXYZ(n,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ni);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];$e.setFromBufferAttribute(r),this.morphTargetsRelative?(Re.addVectors(this.boundingBox.min,$e.min),this.boundingBox.expandByPoint(Re),Re.addVectors(this.boundingBox.max,$e.max),this.boundingBox.expandByPoint(Re)):(this.boundingBox.expandByPoint($e.min),this.boundingBox.expandByPoint($e.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Tn);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(t){const n=this.boundingSphere.center;if($e.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){const a=e[r];fs.setFromBufferAttribute(a),this.morphTargetsRelative?(Re.addVectors($e.min,fs.min),$e.expandByPoint(Re),Re.addVectors($e.max,fs.max),$e.expandByPoint(Re)):($e.expandByPoint(fs.min),$e.expandByPoint(fs.max))}$e.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)Re.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Re));if(e)for(let r=0,o=e.length;r<o;r++){const a=e[r],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)Re.fromBufferAttribute(a,c),l&&(Di.fromBufferAttribute(t,c),Re.add(Di)),s=Math.max(s,n.distanceToSquared(Re))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Se(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],l=[];for(let N=0;N<n.count;N++)a[N]=new O,l[N]=new O;const c=new O,u=new O,h=new O,d=new Tt,f=new Tt,g=new Tt,v=new O,m=new O;function p(N,T,_){c.fromBufferAttribute(n,N),u.fromBufferAttribute(n,T),h.fromBufferAttribute(n,_),d.fromBufferAttribute(r,N),f.fromBufferAttribute(r,T),g.fromBufferAttribute(r,_),u.sub(c),h.sub(c),f.sub(d),g.sub(d);const P=1/(f.x*g.y-g.x*f.y);isFinite(P)&&(v.copy(u).multiplyScalar(g.y).addScaledVector(h,-f.y).multiplyScalar(P),m.copy(h).multiplyScalar(f.x).addScaledVector(u,-g.x).multiplyScalar(P),a[N].add(v),a[T].add(v),a[_].add(v),l[N].add(m),l[T].add(m),l[_].add(m))}let y=this.groups;y.length===0&&(y=[{start:0,count:t.count}]);for(let N=0,T=y.length;N<T;++N){const _=y[N],P=_.start,V=_.count;for(let H=P,k=P+V;H<k;H+=3)p(t.getX(H+0),t.getX(H+1),t.getX(H+2))}const M=new O,x=new O,q=new O,R=new O;function L(N){q.fromBufferAttribute(s,N),R.copy(q);const T=a[N];M.copy(T),M.sub(q.multiplyScalar(q.dot(T))).normalize(),x.crossVectors(R,T);const P=x.dot(l[N])<0?-1:1;o.setXYZW(N,M.x,M.y,M.z,P)}for(let N=0,T=y.length;N<T;++N){const _=y[N],P=_.start,V=_.count;for(let H=P,k=P+V;H<k;H+=3)L(t.getX(H+0)),L(t.getX(H+1)),L(t.getX(H+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Se(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);const s=new O,r=new O,o=new O,a=new O,l=new O,c=new O,u=new O,h=new O;if(t)for(let d=0,f=t.count;d<f;d+=3){const g=t.getX(d+0),v=t.getX(d+1),m=t.getX(d+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,v),o.fromBufferAttribute(e,m),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,v),c.fromBufferAttribute(n,m),a.add(u),l.add(u),c.add(u),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(v,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,f=e.count;d<f;d+=3)s.fromBufferAttribute(e,d+0),r.fromBufferAttribute(e,d+1),o.fromBufferAttribute(e,d+2),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Re.fromBufferAttribute(t,e),Re.normalize(),t.setXYZ(e,Re.x,Re.y,Re.z)}toNonIndexed(){function t(a,l){const c=a.array,u=a.itemSize,h=a.normalized,d=new c.constructor(l.length*u);let f=0,g=0;for(let v=0,m=l.length;v<m;v++){a.isInterleavedBufferAttribute?f=l[v]*a.data.stride+a.offset:f=l[v]*u;for(let p=0;p<u;p++)d[g++]=c[f++]}return new Se(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new ye,n=this.index.array,s=this.attributes;for(const a in s){const l=s[a],c=t(l,n);e.setAttribute(a,c)}const r=this.morphAttributes;for(const a in r){const l=[],c=r[a];for(let u=0,h=c.length;u<h;u++){const d=c[u],f=t(d,n);l.push(f)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const s={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,d=c.length;h<d;h++){const f=c[h];u.push(f.toJSON(t.data))}u.length>0&&(s[l]=u,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const s=t.attributes;for(const c in s){const u=s[c];this.setAttribute(c,u.clone(e))}const r=t.morphAttributes;for(const c in r){const u=[],h=r[c];for(let d=0,f=h.length;d<f;d++)u.push(h[d].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let c=0,u=o.length;c<u;c++){const h=o[c];this.addGroup(h.start,h.count,h.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Ll=new Qt,ai=new Dr,Ys=new Tn,Dl=new O,qs=new O,Zs=new O,Ks=new O,lo=new O,Js=new O,Ul=new O,$s=new O;class Yt extends Jt{constructor(t=new ye,e=new gn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const a=this.morphTargetInfluences;if(r&&a){Js.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const u=a[l],h=r[l];u!==0&&(lo.fromBufferAttribute(h,t),o?Js.addScaledVector(lo,u):Js.addScaledVector(lo.sub(e),u))}e.add(Js)}return e}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ys.copy(n.boundingSphere),Ys.applyMatrix4(r),ai.copy(t.ray).recast(t.near),!(Ys.containsPoint(ai.origin)===!1&&(ai.intersectSphere(Ys,Dl)===null||ai.origin.distanceToSquared(Dl)>(t.far-t.near)**2))&&(Ll.copy(r).invert(),ai.copy(t.ray).applyMatrix4(Ll),!(n.boundingBox!==null&&ai.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,ai)))}_computeIntersections(t,e,n){let s;const r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,h=r.attributes.normal,d=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,v=d.length;g<v;g++){const m=d[g],p=o[m.materialIndex],y=Math.max(m.start,f.start),M=Math.min(a.count,Math.min(m.start+m.count,f.start+f.count));for(let x=y,q=M;x<q;x+=3){const R=a.getX(x),L=a.getX(x+1),N=a.getX(x+2);s=js(this,p,t,n,c,u,h,R,L,N),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,f.start),v=Math.min(a.count,f.start+f.count);for(let m=g,p=v;m<p;m+=3){const y=a.getX(m),M=a.getX(m+1),x=a.getX(m+2);s=js(this,o,t,n,c,u,h,y,M,x),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,v=d.length;g<v;g++){const m=d[g],p=o[m.materialIndex],y=Math.max(m.start,f.start),M=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let x=y,q=M;x<q;x+=3){const R=x,L=x+1,N=x+2;s=js(this,p,t,n,c,u,h,R,L,N),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,f.start),v=Math.min(l.count,f.start+f.count);for(let m=g,p=v;m<p;m+=3){const y=m,M=m+1,x=m+2;s=js(this,o,t,n,c,u,h,y,M,x),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}}function af(i,t,e,n,s,r,o,a){let l;if(t.side===He?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,t.side===ti,a),l===null)return null;$s.copy(a),$s.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo($s);return c<e.near||c>e.far?null:{distance:c,point:$s.clone(),object:i}}function js(i,t,e,n,s,r,o,a,l,c){i.getVertexPosition(a,qs),i.getVertexPosition(l,Zs),i.getVertexPosition(c,Ks);const u=af(i,t,e,n,qs,Zs,Ks,Ul);if(u){const h=new O;dn.getBarycoord(Ul,qs,Zs,Ks,h),s&&(u.uv=dn.getInterpolatedAttribute(s,a,l,c,h,new Tt)),r&&(u.uv1=dn.getInterpolatedAttribute(r,a,l,c,h,new Tt)),o&&(u.normal=dn.getInterpolatedAttribute(o,a,l,c,h,new O),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const d={a,b:l,c,normal:new O,materialIndex:0};dn.getNormal(qs,Zs,Ks,d.normal),u.face=d,u.barycoord=h}return u}class pe extends ye{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};const a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);const l=[],c=[],u=[],h=[];let d=0,f=0;g("z","y","x",-1,-1,n,e,t,o,r,0),g("z","y","x",1,-1,n,e,-t,o,r,1),g("x","z","y",1,1,t,n,e,s,o,2),g("x","z","y",1,-1,t,n,-e,s,o,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Zt(c,3)),this.setAttribute("normal",new Zt(u,3)),this.setAttribute("uv",new Zt(h,2));function g(v,m,p,y,M,x,q,R,L,N,T){const _=x/L,P=q/N,V=x/2,H=q/2,k=R/2,j=L+1,C=N+1;let G=0,z=0;const b=new O;for(let W=0;W<C;W++){const rt=W*P-H;for(let dt=0;dt<j;dt++){const B=dt*_-V;b[v]=B*y,b[m]=rt*M,b[p]=k,c.push(b.x,b.y,b.z),b[v]=0,b[m]=0,b[p]=R>0?1:-1,u.push(b.x,b.y,b.z),h.push(dt/L),h.push(1-W/N),G+=1}}for(let W=0;W<N;W++)for(let rt=0;rt<L;rt++){const dt=d+rt+j*W,B=d+rt+j*(W+1),X=d+(rt+1)+j*(W+1),I=d+(rt+1)+j*W;l.push(dt,B,I),l.push(B,X,I),z+=6}a.addGroup(f,z,T),f+=z,d+=G}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new pe(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function ts(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function ze(i){const t={};for(let e=0;e<i.length;e++){const n=ts(i[e]);for(const s in n)t[s]=n[s]}return t}function lf(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function yu(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ae.workingColorSpace}const cf={clone:ts,merge:ze};var uf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,hf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Ee extends yi{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=uf,this.fragmentShader=hf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ts(t.uniforms),this.uniformsGroups=lf(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class Su extends Jt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Qt,this.projectionMatrix=new Qt,this.projectionMatrixInverse=new Qt,this.coordinateSystem=On}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Kn=new O,Nl=new Tt,Fl=new Tt;class Qe extends Su{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=va*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Gr*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return va*2*Math.atan(Math.tan(Gr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Kn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Kn.x,Kn.y).multiplyScalar(-t/Kn.z),Kn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Kn.x,Kn.y).multiplyScalar(-t/Kn.z)}getViewSize(t,e){return this.getViewBounds(t,Nl,Fl),e.subVectors(Fl,Nl)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Gr*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,e-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}const a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const Ui=-90,Ni=1;class ff extends Jt{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Qe(Ui,Ni,t,e);s.layers=this.layers,this.add(s);const r=new Qe(Ui,Ni,t,e);r.layers=this.layers,this.add(r);const o=new Qe(Ui,Ni,t,e);o.layers=this.layers,this.add(o);const a=new Qe(Ui,Ni,t,e);a.layers=this.layers,this.add(a);const l=new Qe(Ui,Ni,t,e);l.layers=this.layers,this.add(l);const c=new Qe(Ui,Ni,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,l]=e;for(const c of e)this.remove(c);if(t===On)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===wr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,o,a,l,c,u]=this.children,h=t.getRenderTarget(),d=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,o),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=v,t.setRenderTarget(n,5,s),t.render(e,u),t.setRenderTarget(h,d,f),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class wu extends ke{constructor(t,e,n,s,r,o,a,l,c,u){t=t!==void 0?t:[],e=e!==void 0?e:Ki,super(t,e,n,s,r,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class df extends ei{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new wu(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Be}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new pe(5,5,5),r=new Ee({name:"CubemapFromEquirect",uniforms:ts(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:He,blending:$n});r.uniforms.tEquirect.value=e;const o=new Yt(s,r),a=e.minFilter;return e.minFilter===Sn&&(e.minFilter=Be),new ff(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,s){const r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}}const co=new O,pf=new O,mf=new jt;class fi{constructor(t=new O(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=co.subVectors(n,e).cross(pf.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(co),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||mf.getNormalMatrix(t),s=this.coplanarPoint(co).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const li=new Tn,Qs=new O;class za{constructor(t=new fi,e=new fi,n=new fi,s=new fi,r=new fi,o=new fi){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=On){const n=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],u=s[5],h=s[6],d=s[7],f=s[8],g=s[9],v=s[10],m=s[11],p=s[12],y=s[13],M=s[14],x=s[15];if(n[0].setComponents(l-r,d-c,m-f,x-p).normalize(),n[1].setComponents(l+r,d+c,m+f,x+p).normalize(),n[2].setComponents(l+o,d+u,m+g,x+y).normalize(),n[3].setComponents(l-o,d-u,m-g,x-y).normalize(),n[4].setComponents(l-a,d-h,m-v,x-M).normalize(),e===On)n[5].setComponents(l+a,d+h,m+v,x+M).normalize();else if(e===wr)n[5].setComponents(a,h,v,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),li.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),li.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(li)}intersectsSprite(t){return li.center.set(0,0,0),li.radius=.7071067811865476,li.applyMatrix4(t.matrixWorld),this.intersectsSphere(li)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(Qs.x=s.normal.x>0?t.max.x:t.min.x,Qs.y=s.normal.y>0?t.max.y:t.min.y,Qs.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Qs)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function bu(){let i=null,t=!1,e=null,n=null;function s(r,o){e(r,o),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function gf(i){const t=new WeakMap;function e(a,l){const c=a.array,u=a.usage,h=c.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,c,u),a.onUploadCallback();let f;if(c instanceof Float32Array)f=i.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=i.SHORT;else if(c instanceof Uint32Array)f=i.UNSIGNED_INT;else if(c instanceof Int32Array)f=i.INT;else if(c instanceof Int8Array)f=i.BYTE;else if(c instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:h}}function n(a,l,c){const u=l.array,h=l.updateRanges;if(i.bindBuffer(c,a),h.length===0)i.bufferSubData(c,0,u);else{h.sort((f,g)=>f.start-g.start);let d=0;for(let f=1;f<h.length;f++){const g=h[d],v=h[f];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++d,h[d]=v)}h.length=d+1;for(let f=0,g=h.length;f<g;f++){const v=h[f];i.bufferSubData(c,v.start*u.BYTES_PER_ELEMENT,u,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=t.get(a);l&&(i.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const u=t.get(a);(!u||u.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}class Hn extends ye{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,o=e/2,a=Math.floor(n),l=Math.floor(s),c=a+1,u=l+1,h=t/a,d=e/l,f=[],g=[],v=[],m=[];for(let p=0;p<u;p++){const y=p*d-o;for(let M=0;M<c;M++){const x=M*h-r;g.push(x,-y,0),v.push(0,0,1),m.push(M/a),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let y=0;y<a;y++){const M=y+c*p,x=y+c*(p+1),q=y+1+c*(p+1),R=y+1+c*p;f.push(M,x,R),f.push(x,q,R)}this.setIndex(f),this.setAttribute("position",new Zt(g,3)),this.setAttribute("normal",new Zt(v,3)),this.setAttribute("uv",new Zt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Hn(t.width,t.height,t.widthSegments,t.heightSegments)}}var vf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,_f=`#ifdef USE_ALPHAHASH
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
#endif`,xf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Mf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,yf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Sf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,wf=`#ifdef USE_AOMAP
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
#endif`,bf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Ef=`#ifdef USE_BATCHING
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
#endif`,Tf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Af=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Cf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Rf=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Pf=`#ifdef USE_IRIDESCENCE
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
#endif`,If=`#ifdef USE_BUMPMAP
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
#endif`,Lf=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Df=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Uf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Nf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Ff=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Of=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,kf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,zf=`#if defined( USE_COLOR_ALPHA )
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
#endif`,Bf=`#define PI 3.141592653589793
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
} // validated`,Hf=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Gf=`vec3 transformedNormal = objectNormal;
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
#endif`,Vf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Wf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Xf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Yf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,qf="gl_FragColor = linearToOutputTexel( gl_FragColor );",Zf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Kf=`#ifdef USE_ENVMAP
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
#endif`,Jf=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,$f=`#ifdef USE_ENVMAP
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
#endif`,jf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Qf=`#ifdef USE_ENVMAP
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
#endif`,td=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ed=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,nd=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,id=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,sd=`#ifdef USE_GRADIENTMAP
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
}`,rd=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,od=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,ad=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,ld=`uniform bool receiveShadow;
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
#endif`,cd=`#ifdef USE_ENVMAP
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
#endif`,ud=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,hd=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,fd=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,dd=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,pd=`PhysicalMaterial material;
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
#endif`,md=`struct PhysicalMaterial {
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
}`,gd=`
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
#endif`,vd=`#if defined( RE_IndirectDiffuse )
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
#endif`,_d=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,xd=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Md=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,yd=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Sd=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,wd=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,bd=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Ed=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Td=`#if defined( USE_POINTS_UV )
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
#endif`,Ad=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Cd=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Rd=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Pd=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Id=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ld=`#ifdef USE_MORPHTARGETS
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
#endif`,Dd=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ud=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Nd=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Fd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Od=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,kd=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,zd=`#ifdef USE_NORMALMAP
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
#endif`,Bd=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Hd=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Gd=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Vd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Wd=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Xd=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Yd=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,qd=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Zd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Kd=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Jd=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,$d=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,jd=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Qd=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,tp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,ep=`float getShadowMask() {
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
}`,np=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,ip=`#ifdef USE_SKINNING
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
#endif`,sp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,rp=`#ifdef USE_SKINNING
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
#endif`,op=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,ap=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,lp=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,cp=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,up=`#ifdef USE_TRANSMISSION
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
#endif`,hp=`#ifdef USE_TRANSMISSION
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
#endif`,fp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,dp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,pp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,mp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const gp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,vp=`uniform sampler2D t2D;
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
}`,_p=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,xp=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Mp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,yp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Sp=`#include <common>
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
}`,wp=`#if DEPTH_PACKING == 3200
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
}`,bp=`#define DISTANCE
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
}`,Ep=`#define DISTANCE
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
}`,Tp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Ap=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Cp=`uniform float scale;
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
}`,Rp=`uniform vec3 diffuse;
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
}`,Pp=`#include <common>
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
}`,Ip=`uniform vec3 diffuse;
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
}`,Lp=`#define LAMBERT
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
}`,Dp=`#define LAMBERT
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
}`,Up=`#define MATCAP
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
}`,Np=`#define MATCAP
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
}`,Fp=`#define NORMAL
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
}`,Op=`#define NORMAL
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
}`,kp=`#define PHONG
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
}`,zp=`#define PHONG
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
}`,Bp=`#define STANDARD
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
}`,Hp=`#define STANDARD
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
}`,Gp=`#define TOON
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
}`,Vp=`#define TOON
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
}`,Wp=`uniform float size;
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
}`,Xp=`uniform vec3 diffuse;
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
}`,Yp=`#include <common>
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
}`,qp=`uniform vec3 color;
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
}`,Zp=`uniform float rotation;
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
}`,Kp=`uniform vec3 diffuse;
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
}`,te={alphahash_fragment:vf,alphahash_pars_fragment:_f,alphamap_fragment:xf,alphamap_pars_fragment:Mf,alphatest_fragment:yf,alphatest_pars_fragment:Sf,aomap_fragment:wf,aomap_pars_fragment:bf,batching_pars_vertex:Ef,batching_vertex:Tf,begin_vertex:Af,beginnormal_vertex:Cf,bsdfs:Rf,iridescence_fragment:Pf,bumpmap_pars_fragment:If,clipping_planes_fragment:Lf,clipping_planes_pars_fragment:Df,clipping_planes_pars_vertex:Uf,clipping_planes_vertex:Nf,color_fragment:Ff,color_pars_fragment:Of,color_pars_vertex:kf,color_vertex:zf,common:Bf,cube_uv_reflection_fragment:Hf,defaultnormal_vertex:Gf,displacementmap_pars_vertex:Vf,displacementmap_vertex:Wf,emissivemap_fragment:Xf,emissivemap_pars_fragment:Yf,colorspace_fragment:qf,colorspace_pars_fragment:Zf,envmap_fragment:Kf,envmap_common_pars_fragment:Jf,envmap_pars_fragment:$f,envmap_pars_vertex:jf,envmap_physical_pars_fragment:cd,envmap_vertex:Qf,fog_vertex:td,fog_pars_vertex:ed,fog_fragment:nd,fog_pars_fragment:id,gradientmap_pars_fragment:sd,lightmap_pars_fragment:rd,lights_lambert_fragment:od,lights_lambert_pars_fragment:ad,lights_pars_begin:ld,lights_toon_fragment:ud,lights_toon_pars_fragment:hd,lights_phong_fragment:fd,lights_phong_pars_fragment:dd,lights_physical_fragment:pd,lights_physical_pars_fragment:md,lights_fragment_begin:gd,lights_fragment_maps:vd,lights_fragment_end:_d,logdepthbuf_fragment:xd,logdepthbuf_pars_fragment:Md,logdepthbuf_pars_vertex:yd,logdepthbuf_vertex:Sd,map_fragment:wd,map_pars_fragment:bd,map_particle_fragment:Ed,map_particle_pars_fragment:Td,metalnessmap_fragment:Ad,metalnessmap_pars_fragment:Cd,morphinstance_vertex:Rd,morphcolor_vertex:Pd,morphnormal_vertex:Id,morphtarget_pars_vertex:Ld,morphtarget_vertex:Dd,normal_fragment_begin:Ud,normal_fragment_maps:Nd,normal_pars_fragment:Fd,normal_pars_vertex:Od,normal_vertex:kd,normalmap_pars_fragment:zd,clearcoat_normal_fragment_begin:Bd,clearcoat_normal_fragment_maps:Hd,clearcoat_pars_fragment:Gd,iridescence_pars_fragment:Vd,opaque_fragment:Wd,packing:Xd,premultiplied_alpha_fragment:Yd,project_vertex:qd,dithering_fragment:Zd,dithering_pars_fragment:Kd,roughnessmap_fragment:Jd,roughnessmap_pars_fragment:$d,shadowmap_pars_fragment:jd,shadowmap_pars_vertex:Qd,shadowmap_vertex:tp,shadowmask_pars_fragment:ep,skinbase_vertex:np,skinning_pars_vertex:ip,skinning_vertex:sp,skinnormal_vertex:rp,specularmap_fragment:op,specularmap_pars_fragment:ap,tonemapping_fragment:lp,tonemapping_pars_fragment:cp,transmission_fragment:up,transmission_pars_fragment:hp,uv_pars_fragment:fp,uv_pars_vertex:dp,uv_vertex:pp,worldpos_vertex:mp,background_vert:gp,background_frag:vp,backgroundCube_vert:_p,backgroundCube_frag:xp,cube_vert:Mp,cube_frag:yp,depth_vert:Sp,depth_frag:wp,distanceRGBA_vert:bp,distanceRGBA_frag:Ep,equirect_vert:Tp,equirect_frag:Ap,linedashed_vert:Cp,linedashed_frag:Rp,meshbasic_vert:Pp,meshbasic_frag:Ip,meshlambert_vert:Lp,meshlambert_frag:Dp,meshmatcap_vert:Up,meshmatcap_frag:Np,meshnormal_vert:Fp,meshnormal_frag:Op,meshphong_vert:kp,meshphong_frag:zp,meshphysical_vert:Bp,meshphysical_frag:Hp,meshtoon_vert:Gp,meshtoon_frag:Vp,points_vert:Wp,points_frag:Xp,shadow_vert:Yp,shadow_frag:qp,sprite_vert:Zp,sprite_frag:Kp},Nt={common:{diffuse:{value:new ut(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new jt}},envmap:{envMap:{value:null},envMapRotation:{value:new jt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new jt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new jt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new jt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new jt},normalScale:{value:new Tt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new jt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new jt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new jt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new jt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ut(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ut(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0},uvTransform:{value:new jt}},sprite:{diffuse:{value:new ut(16777215)},opacity:{value:1},center:{value:new Tt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}}},Mn={basic:{uniforms:ze([Nt.common,Nt.specularmap,Nt.envmap,Nt.aomap,Nt.lightmap,Nt.fog]),vertexShader:te.meshbasic_vert,fragmentShader:te.meshbasic_frag},lambert:{uniforms:ze([Nt.common,Nt.specularmap,Nt.envmap,Nt.aomap,Nt.lightmap,Nt.emissivemap,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,Nt.fog,Nt.lights,{emissive:{value:new ut(0)}}]),vertexShader:te.meshlambert_vert,fragmentShader:te.meshlambert_frag},phong:{uniforms:ze([Nt.common,Nt.specularmap,Nt.envmap,Nt.aomap,Nt.lightmap,Nt.emissivemap,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,Nt.fog,Nt.lights,{emissive:{value:new ut(0)},specular:{value:new ut(1118481)},shininess:{value:30}}]),vertexShader:te.meshphong_vert,fragmentShader:te.meshphong_frag},standard:{uniforms:ze([Nt.common,Nt.envmap,Nt.aomap,Nt.lightmap,Nt.emissivemap,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,Nt.roughnessmap,Nt.metalnessmap,Nt.fog,Nt.lights,{emissive:{value:new ut(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag},toon:{uniforms:ze([Nt.common,Nt.aomap,Nt.lightmap,Nt.emissivemap,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,Nt.gradientmap,Nt.fog,Nt.lights,{emissive:{value:new ut(0)}}]),vertexShader:te.meshtoon_vert,fragmentShader:te.meshtoon_frag},matcap:{uniforms:ze([Nt.common,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,Nt.fog,{matcap:{value:null}}]),vertexShader:te.meshmatcap_vert,fragmentShader:te.meshmatcap_frag},points:{uniforms:ze([Nt.points,Nt.fog]),vertexShader:te.points_vert,fragmentShader:te.points_frag},dashed:{uniforms:ze([Nt.common,Nt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:te.linedashed_vert,fragmentShader:te.linedashed_frag},depth:{uniforms:ze([Nt.common,Nt.displacementmap]),vertexShader:te.depth_vert,fragmentShader:te.depth_frag},normal:{uniforms:ze([Nt.common,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,{opacity:{value:1}}]),vertexShader:te.meshnormal_vert,fragmentShader:te.meshnormal_frag},sprite:{uniforms:ze([Nt.sprite,Nt.fog]),vertexShader:te.sprite_vert,fragmentShader:te.sprite_frag},background:{uniforms:{uvTransform:{value:new jt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:te.background_vert,fragmentShader:te.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new jt}},vertexShader:te.backgroundCube_vert,fragmentShader:te.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:te.cube_vert,fragmentShader:te.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:te.equirect_vert,fragmentShader:te.equirect_frag},distanceRGBA:{uniforms:ze([Nt.common,Nt.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:te.distanceRGBA_vert,fragmentShader:te.distanceRGBA_frag},shadow:{uniforms:ze([Nt.lights,Nt.fog,{color:{value:new ut(0)},opacity:{value:1}}]),vertexShader:te.shadow_vert,fragmentShader:te.shadow_frag}};Mn.physical={uniforms:ze([Mn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new jt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new jt},clearcoatNormalScale:{value:new Tt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new jt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new jt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new jt},sheen:{value:0},sheenColor:{value:new ut(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new jt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new jt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new jt},transmissionSamplerSize:{value:new Tt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new jt},attenuationDistance:{value:0},attenuationColor:{value:new ut(0)},specularColor:{value:new ut(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new jt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new jt},anisotropyVector:{value:new Tt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new jt}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag};const tr={r:0,b:0,g:0},ci=new En,Jp=new Qt;function $p(i,t,e,n,s,r,o){const a=new ut(0);let l=r===!0?0:1,c,u,h=null,d=0,f=null;function g(y){let M=y.isScene===!0?y.background:null;return M&&M.isTexture&&(M=(y.backgroundBlurriness>0?e:t).get(M)),M}function v(y){let M=!1;const x=g(y);x===null?p(a,l):x&&x.isColor&&(p(x,1),M=!0);const q=i.xr.getEnvironmentBlendMode();q==="additive"?n.buffers.color.setClear(0,0,0,1,o):q==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||M)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(y,M){const x=g(M);x&&(x.isCubeTexture||x.mapping===Ir)?(u===void 0&&(u=new Yt(new pe(1,1,1),new Ee({name:"BackgroundCubeMaterial",uniforms:ts(Mn.backgroundCube.uniforms),vertexShader:Mn.backgroundCube.vertexShader,fragmentShader:Mn.backgroundCube.fragmentShader,side:He,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(q,R,L){this.matrixWorld.copyPosition(L.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(u)),ci.copy(M.backgroundRotation),ci.x*=-1,ci.y*=-1,ci.z*=-1,x.isCubeTexture&&x.isRenderTargetTexture===!1&&(ci.y*=-1,ci.z*=-1),u.material.uniforms.envMap.value=x,u.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(Jp.makeRotationFromEuler(ci)),u.material.toneMapped=ae.getTransfer(x.colorSpace)!==de,(h!==x||d!==x.version||f!==i.toneMapping)&&(u.material.needsUpdate=!0,h=x,d=x.version,f=i.toneMapping),u.layers.enableAll(),y.unshift(u,u.geometry,u.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new Yt(new Hn(2,2),new Ee({name:"BackgroundMaterial",uniforms:ts(Mn.background.uniforms),vertexShader:Mn.background.vertexShader,fragmentShader:Mn.background.fragmentShader,side:ti,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.toneMapped=ae.getTransfer(x.colorSpace)!==de,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(h!==x||d!==x.version||f!==i.toneMapping)&&(c.material.needsUpdate=!0,h=x,d=x.version,f=i.toneMapping),c.layers.enableAll(),y.unshift(c,c.geometry,c.material,0,0,null))}function p(y,M){y.getRGB(tr,yu(i)),n.buffers.color.setClear(tr.r,tr.g,tr.b,M,o)}return{getClearColor:function(){return a},setClearColor:function(y,M=1){a.set(y),l=M,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(y){l=y,p(a,l)},render:v,addToRenderList:m}}function jp(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null);let r=s,o=!1;function a(_,P,V,H,k){let j=!1;const C=h(H,V,P);r!==C&&(r=C,c(r.object)),j=f(_,H,V,k),j&&g(_,H,V,k),k!==null&&t.update(k,i.ELEMENT_ARRAY_BUFFER),(j||o)&&(o=!1,x(_,P,V,H),k!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(k).buffer))}function l(){return i.createVertexArray()}function c(_){return i.bindVertexArray(_)}function u(_){return i.deleteVertexArray(_)}function h(_,P,V){const H=V.wireframe===!0;let k=n[_.id];k===void 0&&(k={},n[_.id]=k);let j=k[P.id];j===void 0&&(j={},k[P.id]=j);let C=j[H];return C===void 0&&(C=d(l()),j[H]=C),C}function d(_){const P=[],V=[],H=[];for(let k=0;k<e;k++)P[k]=0,V[k]=0,H[k]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:V,attributeDivisors:H,object:_,attributes:{},index:null}}function f(_,P,V,H){const k=r.attributes,j=P.attributes;let C=0;const G=V.getAttributes();for(const z in G)if(G[z].location>=0){const W=k[z];let rt=j[z];if(rt===void 0&&(z==="instanceMatrix"&&_.instanceMatrix&&(rt=_.instanceMatrix),z==="instanceColor"&&_.instanceColor&&(rt=_.instanceColor)),W===void 0||W.attribute!==rt||rt&&W.data!==rt.data)return!0;C++}return r.attributesNum!==C||r.index!==H}function g(_,P,V,H){const k={},j=P.attributes;let C=0;const G=V.getAttributes();for(const z in G)if(G[z].location>=0){let W=j[z];W===void 0&&(z==="instanceMatrix"&&_.instanceMatrix&&(W=_.instanceMatrix),z==="instanceColor"&&_.instanceColor&&(W=_.instanceColor));const rt={};rt.attribute=W,W&&W.data&&(rt.data=W.data),k[z]=rt,C++}r.attributes=k,r.attributesNum=C,r.index=H}function v(){const _=r.newAttributes;for(let P=0,V=_.length;P<V;P++)_[P]=0}function m(_){p(_,0)}function p(_,P){const V=r.newAttributes,H=r.enabledAttributes,k=r.attributeDivisors;V[_]=1,H[_]===0&&(i.enableVertexAttribArray(_),H[_]=1),k[_]!==P&&(i.vertexAttribDivisor(_,P),k[_]=P)}function y(){const _=r.newAttributes,P=r.enabledAttributes;for(let V=0,H=P.length;V<H;V++)P[V]!==_[V]&&(i.disableVertexAttribArray(V),P[V]=0)}function M(_,P,V,H,k,j,C){C===!0?i.vertexAttribIPointer(_,P,V,k,j):i.vertexAttribPointer(_,P,V,H,k,j)}function x(_,P,V,H){v();const k=H.attributes,j=V.getAttributes(),C=P.defaultAttributeValues;for(const G in j){const z=j[G];if(z.location>=0){let b=k[G];if(b===void 0&&(G==="instanceMatrix"&&_.instanceMatrix&&(b=_.instanceMatrix),G==="instanceColor"&&_.instanceColor&&(b=_.instanceColor)),b!==void 0){const W=b.normalized,rt=b.itemSize,dt=t.get(b);if(dt===void 0)continue;const B=dt.buffer,X=dt.type,I=dt.bytesPerElement,it=X===i.INT||X===i.UNSIGNED_INT||b.gpuType===La;if(b.isInterleavedBufferAttribute){const J=b.data,ft=J.stride,Ct=b.offset;if(J.isInstancedInterleavedBuffer){for(let It=0;It<z.locationSize;It++)p(z.location+It,J.meshPerAttribute);_.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let It=0;It<z.locationSize;It++)m(z.location+It);i.bindBuffer(i.ARRAY_BUFFER,B);for(let It=0;It<z.locationSize;It++)M(z.location+It,rt/z.locationSize,X,W,ft*I,(Ct+rt/z.locationSize*It)*I,it)}else{if(b.isInstancedBufferAttribute){for(let J=0;J<z.locationSize;J++)p(z.location+J,b.meshPerAttribute);_.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=b.meshPerAttribute*b.count)}else for(let J=0;J<z.locationSize;J++)m(z.location+J);i.bindBuffer(i.ARRAY_BUFFER,B);for(let J=0;J<z.locationSize;J++)M(z.location+J,rt/z.locationSize,X,W,rt*I,rt/z.locationSize*J*I,it)}}else if(C!==void 0){const W=C[G];if(W!==void 0)switch(W.length){case 2:i.vertexAttrib2fv(z.location,W);break;case 3:i.vertexAttrib3fv(z.location,W);break;case 4:i.vertexAttrib4fv(z.location,W);break;default:i.vertexAttrib1fv(z.location,W)}}}}y()}function q(){N();for(const _ in n){const P=n[_];for(const V in P){const H=P[V];for(const k in H)u(H[k].object),delete H[k];delete P[V]}delete n[_]}}function R(_){if(n[_.id]===void 0)return;const P=n[_.id];for(const V in P){const H=P[V];for(const k in H)u(H[k].object),delete H[k];delete P[V]}delete n[_.id]}function L(_){for(const P in n){const V=n[P];if(V[_.id]===void 0)continue;const H=V[_.id];for(const k in H)u(H[k].object),delete H[k];delete V[_.id]}}function N(){T(),o=!0,r!==s&&(r=s,c(r.object))}function T(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:N,resetDefaultState:T,dispose:q,releaseStatesOfGeometry:R,releaseStatesOfProgram:L,initAttributes:v,enableAttribute:m,disableUnusedAttributes:y}}function Qp(i,t,e){let n;function s(c){n=c}function r(c,u){i.drawArrays(n,c,u),e.update(u,n,1)}function o(c,u,h){h!==0&&(i.drawArraysInstanced(n,c,u,h),e.update(u,n,h))}function a(c,u,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,h);let f=0;for(let g=0;g<h;g++)f+=u[g];e.update(f,n,1)}function l(c,u,h,d){if(h===0)return;const f=t.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<c.length;g++)o(c[g],u[g],d[g]);else{f.multiDrawArraysInstancedWEBGL(n,c,0,u,0,d,0,h);let g=0;for(let v=0;v<h;v++)g+=u[v]*d[v];e.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function tm(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const L=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(L.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(L){return!(L!==qe&&n.convert(L)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(L){const N=L===es&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(L!==bn&&n.convert(L)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&L!==mn&&!N)}function l(L){if(L==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";L="mediump"}return L==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const h=e.logarithmicDepthBuffer===!0,d=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),y=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),M=i.getParameter(i.MAX_VARYING_VECTORS),x=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),q=g>0,R=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:h,reverseDepthBuffer:d,maxTextures:f,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:y,maxVaryings:M,maxFragmentUniforms:x,vertexTextures:q,maxSamples:R}}function em(i){const t=this;let e=null,n=0,s=!1,r=!1;const o=new fi,a=new jt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const f=h.length!==0||d||n!==0||s;return s=d,n=h.length,f},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,d){e=u(h,d,0)},this.setState=function(h,d,f){const g=h.clippingPlanes,v=h.clipIntersection,m=h.clipShadows,p=i.get(h);if(!s||g===null||g.length===0||r&&!m)r?u(null):c();else{const y=r?0:n,M=y*4;let x=p.clippingState||null;l.value=x,x=u(g,d,M,f);for(let q=0;q!==M;++q)x[q]=e[q];p.clippingState=x,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=y}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(h,d,f,g){const v=h!==null?h.length:0;let m=null;if(v!==0){if(m=l.value,g!==!0||m===null){const p=f+v*4,y=d.matrixWorldInverse;a.getNormalMatrix(y),(m===null||m.length<p)&&(m=new Float32Array(p));for(let M=0,x=f;M!==v;++M,x+=4)o.copy(h[M]).applyMatrix4(y,a),o.normal.toArray(m,x),m[x+3]=o.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,m}}function nm(i){let t=new WeakMap;function e(o,a){return a===Go?o.mapping=Ki:a===Vo&&(o.mapping=Ji),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===Go||a===Vo)if(t.has(o)){const l=t.get(o).texture;return e(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new df(l.height);return c.fromEquirectangularTexture(i,o),t.set(o,c),o.addEventListener("dispose",s),e(c.texture,o.mapping)}else return null}}return o}function s(o){const a=o.target;a.removeEventListener("dispose",s);const l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}class Ba extends Su{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,o=n+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const Gi=4,Ol=[.125,.215,.35,.446,.526,.582],mi=20,uo=new Ba,kl=new ut;let ho=null,fo=0,po=0,mo=!1;const di=(1+Math.sqrt(5))/2,Fi=1/di,zl=[new O(-di,Fi,0),new O(di,Fi,0),new O(-Fi,0,di),new O(Fi,0,di),new O(0,di,-Fi),new O(0,di,Fi),new O(-1,1,-1),new O(1,1,-1),new O(-1,1,1),new O(1,1,1)];class _a{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){ho=this._renderer.getRenderTarget(),fo=this._renderer.getActiveCubeFace(),po=this._renderer.getActiveMipmapLevel(),mo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Gl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Hl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(ho,fo,po),this._renderer.xr.enabled=mo,t.scissorTest=!1,er(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Ki||t.mapping===Ji?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),ho=this._renderer.getRenderTarget(),fo=this._renderer.getActiveCubeFace(),po=this._renderer.getActiveMipmapLevel(),mo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Be,minFilter:Be,generateMipmaps:!1,type:es,format:qe,colorSpace:ns,depthBuffer:!1},s=Bl(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Bl(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=im(r)),this._blurMaterial=sm(r,t,e)}return s}_compileMaterial(t){const e=new Yt(this._lodPlanes[0],t);this._renderer.compile(e,uo)}_sceneToCubeUV(t,e,n,s){const a=new Qe(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,d=u.toneMapping;u.getClearColor(kl),u.toneMapping=zn,u.autoClear=!1;const f=new gn({name:"PMREM.Background",side:He,depthWrite:!1,depthTest:!1}),g=new Yt(new pe,f);let v=!1;const m=t.background;m?m.isColor&&(f.color.copy(m),t.background=null,v=!0):(f.color.copy(kl),v=!0);for(let p=0;p<6;p++){const y=p%3;y===0?(a.up.set(0,l[p],0),a.lookAt(c[p],0,0)):y===1?(a.up.set(0,0,l[p]),a.lookAt(0,c[p],0)):(a.up.set(0,l[p],0),a.lookAt(0,0,c[p]));const M=this._cubeSize;er(s,y*M,p>2?M:0,M,M),u.setRenderTarget(s),v&&u.render(g,a),u.render(t,a)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=d,u.autoClear=h,t.background=m}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===Ki||t.mapping===Ji;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Gl()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Hl());const r=s?this._cubemapMaterial:this._equirectMaterial,o=new Yt(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;const l=this._cubeSize;er(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,uo)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodPlanes.length;for(let r=1;r<s;r++){const o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=zl[(s-r-1)%zl.length];this._blur(t,r-1,r,o,a)}e.autoClear=n}_blur(t,e,n,s,r){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,s,"latitudinal",r),this._halfBlur(o,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new Yt(this._lodPlanes[s],c),d=c.uniforms,f=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*mi-1),v=r/g,m=isFinite(r)?1+Math.floor(u*v):mi;m>mi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${mi}`);const p=[];let y=0;for(let L=0;L<mi;++L){const N=L/v,T=Math.exp(-N*N/2);p.push(T),L===0?y+=T:L<m&&(y+=2*T)}for(let L=0;L<p.length;L++)p[L]=p[L]/y;d.envMap.value=t.texture,d.samples.value=m,d.weights.value=p,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);const{_lodMax:M}=this;d.dTheta.value=g,d.mipInt.value=M-n;const x=this._sizeLods[s],q=3*x*(s>M-Gi?s-M+Gi:0),R=4*(this._cubeSize-x);er(e,q,R,3*x,2*x),l.setRenderTarget(e),l.render(h,uo)}}function im(i){const t=[],e=[],n=[];let s=i;const r=i-Gi+1+Ol.length;for(let o=0;o<r;o++){const a=Math.pow(2,s);e.push(a);let l=1/a;o>i-Gi?l=Ol[o-i+Gi-1]:o===0&&(l=0),n.push(l);const c=1/(a-2),u=-c,h=1+c,d=[u,u,h,u,h,h,u,u,h,h,u,h],f=6,g=6,v=3,m=2,p=1,y=new Float32Array(v*g*f),M=new Float32Array(m*g*f),x=new Float32Array(p*g*f);for(let R=0;R<f;R++){const L=R%3*2/3-1,N=R>2?0:-1,T=[L,N,0,L+2/3,N,0,L+2/3,N+1,0,L,N,0,L+2/3,N+1,0,L,N+1,0];y.set(T,v*g*R),M.set(d,m*g*R);const _=[R,R,R,R,R,R];x.set(_,p*g*R)}const q=new ye;q.setAttribute("position",new Se(y,v)),q.setAttribute("uv",new Se(M,m)),q.setAttribute("faceIndex",new Se(x,p)),t.push(q),s>Gi&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Bl(i,t,e){const n=new ei(i,t,e);return n.texture.mapping=Ir,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function er(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function sm(i,t,e){const n=new Float32Array(mi),s=new O(0,1,0);return new Ee({name:"SphericalGaussianBlur",defines:{n:mi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Ha(),fragmentShader:`

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
		`,blending:$n,depthTest:!1,depthWrite:!1})}function Hl(){return new Ee({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ha(),fragmentShader:`

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
		`,blending:$n,depthTest:!1,depthWrite:!1})}function Gl(){return new Ee({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ha(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:$n,depthTest:!1,depthWrite:!1})}function Ha(){return`

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
	`}function rm(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const l=a.mapping,c=l===Go||l===Vo,u=l===Ki||l===Ji;if(c||u){let h=t.get(a);const d=h!==void 0?h.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return e===null&&(e=new _a(i)),h=c?e.fromEquirectangular(a,h):e.fromCubemap(a,h),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),h.texture;if(h!==void 0)return h.texture;{const f=a.image;return c&&f&&f.height>0||u&&f&&s(f)?(e===null&&(e=new _a(i)),h=c?e.fromEquirectangular(a):e.fromCubemap(a),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),a.addEventListener("dispose",r),h.texture):null}}}return a}function s(a){let l=0;const c=6;for(let u=0;u<c;u++)a[u]!==void 0&&l++;return l===c}function r(a){const l=a.target;l.removeEventListener("dispose",r);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function om(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&xs("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function am(i,t,e,n){const s={},r=new WeakMap;function o(h){const d=h.target;d.index!==null&&t.remove(d.index);for(const g in d.attributes)t.remove(d.attributes[g]);for(const g in d.morphAttributes){const v=d.morphAttributes[g];for(let m=0,p=v.length;m<p;m++)t.remove(v[m])}d.removeEventListener("dispose",o),delete s[d.id];const f=r.get(d);f&&(t.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function a(h,d){return s[d.id]===!0||(d.addEventListener("dispose",o),s[d.id]=!0,e.memory.geometries++),d}function l(h){const d=h.attributes;for(const g in d)t.update(d[g],i.ARRAY_BUFFER);const f=h.morphAttributes;for(const g in f){const v=f[g];for(let m=0,p=v.length;m<p;m++)t.update(v[m],i.ARRAY_BUFFER)}}function c(h){const d=[],f=h.index,g=h.attributes.position;let v=0;if(f!==null){const y=f.array;v=f.version;for(let M=0,x=y.length;M<x;M+=3){const q=y[M+0],R=y[M+1],L=y[M+2];d.push(q,R,R,L,L,q)}}else if(g!==void 0){const y=g.array;v=g.version;for(let M=0,x=y.length/3-1;M<x;M+=3){const q=M+0,R=M+1,L=M+2;d.push(q,R,R,L,L,q)}}else return;const m=new(pu(d)?Mu:xu)(d,1);m.version=v;const p=r.get(h);p&&t.remove(p),r.set(h,m)}function u(h){const d=r.get(h);if(d){const f=h.index;f!==null&&d.version<f.version&&c(h)}else c(h);return r.get(h)}return{get:a,update:l,getWireframeAttribute:u}}function lm(i,t,e){let n;function s(d){n=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function l(d,f){i.drawElements(n,f,r,d*o),e.update(f,n,1)}function c(d,f,g){g!==0&&(i.drawElementsInstanced(n,f,r,d*o,g),e.update(f,n,g))}function u(d,f,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,d,0,g);let m=0;for(let p=0;p<g;p++)m+=f[p];e.update(m,n,1)}function h(d,f,g,v){if(g===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<d.length;p++)c(d[p]/o,f[p],v[p]);else{m.multiDrawElementsInstancedWEBGL(n,f,0,r,d,0,v,0,g);let p=0;for(let y=0;y<g;y++)p+=f[y]*v[y];e.update(p,n,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=h}function cm(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function um(i,t,e){const n=new WeakMap,s=new ce;function r(o,a,l){const c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0;let d=n.get(a);if(d===void 0||d.count!==h){let T=function(){L.dispose(),n.delete(a),a.removeEventListener("dispose",T)};d!==void 0&&d.texture.dispose();const f=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,v=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],y=a.morphAttributes.color||[];let M=0;f===!0&&(M=1),g===!0&&(M=2),v===!0&&(M=3);let x=a.attributes.position.count*M,q=1;x>t.maxTextureSize&&(q=Math.ceil(x/t.maxTextureSize),x=t.maxTextureSize);const R=new Float32Array(x*q*4*h),L=new gu(R,x,q,h);L.type=mn,L.needsUpdate=!0;const N=M*4;for(let _=0;_<h;_++){const P=m[_],V=p[_],H=y[_],k=x*q*4*_;for(let j=0;j<P.count;j++){const C=j*N;f===!0&&(s.fromBufferAttribute(P,j),R[k+C+0]=s.x,R[k+C+1]=s.y,R[k+C+2]=s.z,R[k+C+3]=0),g===!0&&(s.fromBufferAttribute(V,j),R[k+C+4]=s.x,R[k+C+5]=s.y,R[k+C+6]=s.z,R[k+C+7]=0),v===!0&&(s.fromBufferAttribute(H,j),R[k+C+8]=s.x,R[k+C+9]=s.y,R[k+C+10]=s.z,R[k+C+11]=H.itemSize===4?s.w:1)}}d={count:h,texture:L,size:new Tt(x,q)},n.set(a,d),a.addEventListener("dispose",T)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let f=0;for(let v=0;v<c.length;v++)f+=c[v];const g=a.morphTargetsRelative?1:1-f;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function hm(i,t,e,n){let s=new WeakMap;function r(l){const c=n.render.frame,u=l.geometry,h=t.get(l,u);if(s.get(h)!==c&&(t.update(h),s.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){const d=l.skeleton;s.get(d)!==c&&(d.update(),s.set(d,c))}return h}function o(){s=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:o}}class Eu extends ke{constructor(t,e,n,s,r,o,a,l,c,u=Xi){if(u!==Xi&&u!==Qi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===Xi&&(n=_i),n===void 0&&u===Qi&&(n=ji),super(null,s,r,o,a,l,u,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:tn,this.minFilter=l!==void 0?l:tn,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const Tu=new ke,Vl=new Eu(1,1),Au=new gu,Cu=new Jh,Ru=new wu,Wl=[],Xl=[],Yl=new Float32Array(16),ql=new Float32Array(9),Zl=new Float32Array(4);function ss(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=Wl[s];if(r===void 0&&(r=new Float32Array(s),Wl[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function Te(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Ae(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Ur(i,t){let e=Xl[t];e===void 0&&(e=new Int32Array(t),Xl[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function fm(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function dm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Te(e,t))return;i.uniform2fv(this.addr,t),Ae(e,t)}}function pm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Te(e,t))return;i.uniform3fv(this.addr,t),Ae(e,t)}}function mm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Te(e,t))return;i.uniform4fv(this.addr,t),Ae(e,t)}}function gm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Te(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Ae(e,t)}else{if(Te(e,n))return;Zl.set(n),i.uniformMatrix2fv(this.addr,!1,Zl),Ae(e,n)}}function vm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Te(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Ae(e,t)}else{if(Te(e,n))return;ql.set(n),i.uniformMatrix3fv(this.addr,!1,ql),Ae(e,n)}}function _m(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Te(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Ae(e,t)}else{if(Te(e,n))return;Yl.set(n),i.uniformMatrix4fv(this.addr,!1,Yl),Ae(e,n)}}function xm(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function Mm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Te(e,t))return;i.uniform2iv(this.addr,t),Ae(e,t)}}function ym(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Te(e,t))return;i.uniform3iv(this.addr,t),Ae(e,t)}}function Sm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Te(e,t))return;i.uniform4iv(this.addr,t),Ae(e,t)}}function wm(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function bm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Te(e,t))return;i.uniform2uiv(this.addr,t),Ae(e,t)}}function Em(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Te(e,t))return;i.uniform3uiv(this.addr,t),Ae(e,t)}}function Tm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Te(e,t))return;i.uniform4uiv(this.addr,t),Ae(e,t)}}function Am(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Vl.compareFunction=du,r=Vl):r=Tu,e.setTexture2D(t||r,s)}function Cm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Cu,s)}function Rm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||Ru,s)}function Pm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Au,s)}function Im(i){switch(i){case 5126:return fm;case 35664:return dm;case 35665:return pm;case 35666:return mm;case 35674:return gm;case 35675:return vm;case 35676:return _m;case 5124:case 35670:return xm;case 35667:case 35671:return Mm;case 35668:case 35672:return ym;case 35669:case 35673:return Sm;case 5125:return wm;case 36294:return bm;case 36295:return Em;case 36296:return Tm;case 35678:case 36198:case 36298:case 36306:case 35682:return Am;case 35679:case 36299:case 36307:return Cm;case 35680:case 36300:case 36308:case 36293:return Rm;case 36289:case 36303:case 36311:case 36292:return Pm}}function Lm(i,t){i.uniform1fv(this.addr,t)}function Dm(i,t){const e=ss(t,this.size,2);i.uniform2fv(this.addr,e)}function Um(i,t){const e=ss(t,this.size,3);i.uniform3fv(this.addr,e)}function Nm(i,t){const e=ss(t,this.size,4);i.uniform4fv(this.addr,e)}function Fm(i,t){const e=ss(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Om(i,t){const e=ss(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function km(i,t){const e=ss(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function zm(i,t){i.uniform1iv(this.addr,t)}function Bm(i,t){i.uniform2iv(this.addr,t)}function Hm(i,t){i.uniform3iv(this.addr,t)}function Gm(i,t){i.uniform4iv(this.addr,t)}function Vm(i,t){i.uniform1uiv(this.addr,t)}function Wm(i,t){i.uniform2uiv(this.addr,t)}function Xm(i,t){i.uniform3uiv(this.addr,t)}function Ym(i,t){i.uniform4uiv(this.addr,t)}function qm(i,t,e){const n=this.cache,s=t.length,r=Ur(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||Tu,r[o])}function Zm(i,t,e){const n=this.cache,s=t.length,r=Ur(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||Cu,r[o])}function Km(i,t,e){const n=this.cache,s=t.length,r=Ur(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||Ru,r[o])}function Jm(i,t,e){const n=this.cache,s=t.length,r=Ur(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||Au,r[o])}function $m(i){switch(i){case 5126:return Lm;case 35664:return Dm;case 35665:return Um;case 35666:return Nm;case 35674:return Fm;case 35675:return Om;case 35676:return km;case 5124:case 35670:return zm;case 35667:case 35671:return Bm;case 35668:case 35672:return Hm;case 35669:case 35673:return Gm;case 5125:return Vm;case 36294:return Wm;case 36295:return Xm;case 36296:return Ym;case 35678:case 36198:case 36298:case 36306:case 35682:return qm;case 35679:case 36299:case 36307:return Zm;case 35680:case 36300:case 36308:case 36293:return Km;case 36289:case 36303:case 36311:case 36292:return Jm}}class jm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Im(e.type)}}class Qm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=$m(e.type)}}class t0{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,o=s.length;r!==o;++r){const a=s[r];a.setValue(t,e[a.id],n)}}}const go=/(\w+)(\])?(\[|\.)?/g;function Kl(i,t){i.seq.push(t),i.map[t.id]=t}function e0(i,t,e){const n=i.name,s=n.length;for(go.lastIndex=0;;){const r=go.exec(n),o=go.lastIndex;let a=r[1];const l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){Kl(e,c===void 0?new jm(a,i,t):new Qm(a,i,t));break}else{let h=e.map[a];h===void 0&&(h=new t0(a),Kl(e,h)),e=h}}}class yr{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);e0(r,o,this)}}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){const a=e[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const o=t[s];o.id in e&&n.push(o)}return n}}function Jl(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const n0=37297;let i0=0;function s0(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}const $l=new jt;function r0(i){ae._getMatrix($l,ae.workingColorSpace,i);const t=`mat3( ${$l.elements.map(e=>e.toFixed(4))} )`;switch(ae.getTransfer(i)){case Lr:return[t,"LinearTransferOETF"];case de:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function jl(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+s0(i.getShaderSource(t),o)}else return s}function o0(i,t){const e=r0(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function a0(i,t){let e;switch(t){case Sh:e="Linear";break;case wh:e="Reinhard";break;case bh:e="Cineon";break;case Eh:e="ACESFilmic";break;case Ah:e="AgX";break;case Ch:e="Neutral";break;case Th:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const nr=new O;function l0(){ae.getLuminanceCoefficients(nr);const i=nr.x.toFixed(4),t=nr.y.toFixed(4),e=nr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function c0(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ms).join(`
`)}function u0(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function h0(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),o=r.name;let a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function Ms(i){return i!==""}function Ql(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function tc(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const f0=/^[ \t]*#include +<([\w\d./]+)>/gm;function xa(i){return i.replace(f0,p0)}const d0=new Map;function p0(i,t){let e=te[t];if(e===void 0){const n=d0.get(t);if(n!==void 0)e=te[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return xa(e)}const m0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ec(i){return i.replace(m0,g0)}function g0(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function nc(i){let t=`precision ${i.precision} float;
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
#define LOW_PRECISION`),t}function v0(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Ia?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===tu?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Fn&&(t="SHADOWMAP_TYPE_VSM"),t}function _0(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Ki:case Ji:t="ENVMAP_TYPE_CUBE";break;case Ir:t="ENVMAP_TYPE_CUBE_UV";break}return t}function x0(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case Ji:t="ENVMAP_MODE_REFRACTION";break}return t}function M0(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case eu:t="ENVMAP_BLENDING_MULTIPLY";break;case Mh:t="ENVMAP_BLENDING_MIX";break;case yh:t="ENVMAP_BLENDING_ADD";break}return t}function y0(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function S0(i,t,e,n){const s=i.getContext(),r=e.defines;let o=e.vertexShader,a=e.fragmentShader;const l=v0(e),c=_0(e),u=x0(e),h=M0(e),d=y0(e),f=c0(e),g=u0(r),v=s.createProgram();let m,p,y=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Ms).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Ms).join(`
`),p.length>0&&(p+=`
`)):(m=[nc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ms).join(`
`),p=[nc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==zn?"#define TONE_MAPPING":"",e.toneMapping!==zn?te.tonemapping_pars_fragment:"",e.toneMapping!==zn?a0("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",te.colorspace_pars_fragment,o0("linearToOutputTexel",e.outputColorSpace),l0(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Ms).join(`
`)),o=xa(o),o=Ql(o,e),o=tc(o,e),a=xa(a),a=Ql(a,e),a=tc(a,e),o=ec(o),a=ec(a),e.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",e.glslVersion===gl?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===gl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const M=y+m+o,x=y+p+a,q=Jl(s,s.VERTEX_SHADER,M),R=Jl(s,s.FRAGMENT_SHADER,x);s.attachShader(v,q),s.attachShader(v,R),e.index0AttributeName!==void 0?s.bindAttribLocation(v,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(v,0,"position"),s.linkProgram(v);function L(P){if(i.debug.checkShaderErrors){const V=s.getProgramInfoLog(v).trim(),H=s.getShaderInfoLog(q).trim(),k=s.getShaderInfoLog(R).trim();let j=!0,C=!0;if(s.getProgramParameter(v,s.LINK_STATUS)===!1)if(j=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,v,q,R);else{const G=jl(s,q,"vertex"),z=jl(s,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(v,s.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+V+`
`+G+`
`+z)}else V!==""?console.warn("THREE.WebGLProgram: Program Info Log:",V):(H===""||k==="")&&(C=!1);C&&(P.diagnostics={runnable:j,programLog:V,vertexShader:{log:H,prefix:m},fragmentShader:{log:k,prefix:p}})}s.deleteShader(q),s.deleteShader(R),N=new yr(s,v),T=h0(s,v)}let N;this.getUniforms=function(){return N===void 0&&L(this),N};let T;this.getAttributes=function(){return T===void 0&&L(this),T};let _=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return _===!1&&(_=s.getProgramParameter(v,n0)),_},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(v),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=i0++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=q,this.fragmentShader=R,this}let w0=0;class b0{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new E0(t),e.set(t,n)),n}}class E0{constructor(t){this.id=w0++,this.code=t,this.usedTimes=0}}function T0(i,t,e,n,s,r,o){const a=new vu,l=new b0,c=new Set,u=[],h=s.logarithmicDepthBuffer,d=s.vertexTextures;let f=s.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(T){return c.add(T),T===0?"uv":`uv${T}`}function m(T,_,P,V,H){const k=V.fog,j=H.geometry,C=T.isMeshStandardMaterial?V.environment:null,G=(T.isMeshStandardMaterial?e:t).get(T.envMap||C),z=G&&G.mapping===Ir?G.image.height:null,b=g[T.type];T.precision!==null&&(f=s.getMaxPrecision(T.precision),f!==T.precision&&console.warn("THREE.WebGLProgram.getParameters:",T.precision,"not supported, using",f,"instead."));const W=j.morphAttributes.position||j.morphAttributes.normal||j.morphAttributes.color,rt=W!==void 0?W.length:0;let dt=0;j.morphAttributes.position!==void 0&&(dt=1),j.morphAttributes.normal!==void 0&&(dt=2),j.morphAttributes.color!==void 0&&(dt=3);let B,X,I,it;if(b){const zt=Mn[b];B=zt.vertexShader,X=zt.fragmentShader}else B=T.vertexShader,X=T.fragmentShader,l.update(T),I=l.getVertexShaderID(T),it=l.getFragmentShaderID(T);const J=i.getRenderTarget(),ft=i.state.buffers.depth.getReversed(),Ct=H.isInstancedMesh===!0,It=H.isBatchedMesh===!0,Bt=!!T.map,Mt=!!T.matcap,Et=!!G,U=!!T.aoMap,w=!!T.lightMap,K=!!T.bumpMap,$=!!T.normalMap,D=!!T.displacementMap,ct=!!T.emissiveMap,nt=!!T.metalnessMap,E=!!T.roughnessMap,S=T.anisotropy>0,et=T.clearcoat>0,yt=T.dispersion>0,Z=T.iridescence>0,tt=T.sheen>0,St=T.transmission>0,pt=S&&!!T.anisotropyMap,xt=et&&!!T.clearcoatMap,Pt=et&&!!T.clearcoatNormalMap,gt=et&&!!T.clearcoatRoughnessMap,Rt=Z&&!!T.iridescenceMap,Ft=Z&&!!T.iridescenceThicknessMap,Y=tt&&!!T.sheenColorMap,Q=tt&&!!T.sheenRoughnessMap,lt=!!T.specularMap,at=!!T.specularColorMap,wt=!!T.specularIntensityMap,F=St&&!!T.transmissionMap,bt=St&&!!T.thicknessMap,ht=!!T.gradientMap,mt=!!T.alphaMap,At=T.alphaTest>0,Lt=!!T.alphaHash,Ot=!!T.extensions;let ne=zn;T.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(ne=i.toneMapping);const fe={shaderID:b,shaderType:T.type,shaderName:T.name,vertexShader:B,fragmentShader:X,defines:T.defines,customVertexShaderID:I,customFragmentShaderID:it,isRawShaderMaterial:T.isRawShaderMaterial===!0,glslVersion:T.glslVersion,precision:f,batching:It,batchingColor:It&&H._colorsTexture!==null,instancing:Ct,instancingColor:Ct&&H.instanceColor!==null,instancingMorph:Ct&&H.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:J===null?i.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:ns,alphaToCoverage:!!T.alphaToCoverage,map:Bt,matcap:Mt,envMap:Et,envMapMode:Et&&G.mapping,envMapCubeUVHeight:z,aoMap:U,lightMap:w,bumpMap:K,normalMap:$,displacementMap:d&&D,emissiveMap:ct,normalMapObjectSpace:$&&T.normalMapType===Dh,normalMapTangentSpace:$&&T.normalMapType===fu,metalnessMap:nt,roughnessMap:E,anisotropy:S,anisotropyMap:pt,clearcoat:et,clearcoatMap:xt,clearcoatNormalMap:Pt,clearcoatRoughnessMap:gt,dispersion:yt,iridescence:Z,iridescenceMap:Rt,iridescenceThicknessMap:Ft,sheen:tt,sheenColorMap:Y,sheenRoughnessMap:Q,specularMap:lt,specularColorMap:at,specularIntensityMap:wt,transmission:St,transmissionMap:F,thicknessMap:bt,gradientMap:ht,opaque:T.transparent===!1&&T.blending===Ge&&T.alphaToCoverage===!1,alphaMap:mt,alphaTest:At,alphaHash:Lt,combine:T.combine,mapUv:Bt&&v(T.map.channel),aoMapUv:U&&v(T.aoMap.channel),lightMapUv:w&&v(T.lightMap.channel),bumpMapUv:K&&v(T.bumpMap.channel),normalMapUv:$&&v(T.normalMap.channel),displacementMapUv:D&&v(T.displacementMap.channel),emissiveMapUv:ct&&v(T.emissiveMap.channel),metalnessMapUv:nt&&v(T.metalnessMap.channel),roughnessMapUv:E&&v(T.roughnessMap.channel),anisotropyMapUv:pt&&v(T.anisotropyMap.channel),clearcoatMapUv:xt&&v(T.clearcoatMap.channel),clearcoatNormalMapUv:Pt&&v(T.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:gt&&v(T.clearcoatRoughnessMap.channel),iridescenceMapUv:Rt&&v(T.iridescenceMap.channel),iridescenceThicknessMapUv:Ft&&v(T.iridescenceThicknessMap.channel),sheenColorMapUv:Y&&v(T.sheenColorMap.channel),sheenRoughnessMapUv:Q&&v(T.sheenRoughnessMap.channel),specularMapUv:lt&&v(T.specularMap.channel),specularColorMapUv:at&&v(T.specularColorMap.channel),specularIntensityMapUv:wt&&v(T.specularIntensityMap.channel),transmissionMapUv:F&&v(T.transmissionMap.channel),thicknessMapUv:bt&&v(T.thicknessMap.channel),alphaMapUv:mt&&v(T.alphaMap.channel),vertexTangents:!!j.attributes.tangent&&($||S),vertexColors:T.vertexColors,vertexAlphas:T.vertexColors===!0&&!!j.attributes.color&&j.attributes.color.itemSize===4,pointsUvs:H.isPoints===!0&&!!j.attributes.uv&&(Bt||mt),fog:!!k,useFog:T.fog===!0,fogExp2:!!k&&k.isFogExp2,flatShading:T.flatShading===!0,sizeAttenuation:T.sizeAttenuation===!0,logarithmicDepthBuffer:h,reverseDepthBuffer:ft,skinning:H.isSkinnedMesh===!0,morphTargets:j.morphAttributes.position!==void 0,morphNormals:j.morphAttributes.normal!==void 0,morphColors:j.morphAttributes.color!==void 0,morphTargetsCount:rt,morphTextureStride:dt,numDirLights:_.directional.length,numPointLights:_.point.length,numSpotLights:_.spot.length,numSpotLightMaps:_.spotLightMap.length,numRectAreaLights:_.rectArea.length,numHemiLights:_.hemi.length,numDirLightShadows:_.directionalShadowMap.length,numPointLightShadows:_.pointShadowMap.length,numSpotLightShadows:_.spotShadowMap.length,numSpotLightShadowsWithMaps:_.numSpotLightShadowsWithMaps,numLightProbes:_.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:T.dithering,shadowMapEnabled:i.shadowMap.enabled&&P.length>0,shadowMapType:i.shadowMap.type,toneMapping:ne,decodeVideoTexture:Bt&&T.map.isVideoTexture===!0&&ae.getTransfer(T.map.colorSpace)===de,decodeVideoTextureEmissive:ct&&T.emissiveMap.isVideoTexture===!0&&ae.getTransfer(T.emissiveMap.colorSpace)===de,premultipliedAlpha:T.premultipliedAlpha,doubleSided:T.side===Ie,flipSided:T.side===He,useDepthPacking:T.depthPacking>=0,depthPacking:T.depthPacking||0,index0AttributeName:T.index0AttributeName,extensionClipCullDistance:Ot&&T.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ot&&T.extensions.multiDraw===!0||It)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:T.customProgramCacheKey()};return fe.vertexUv1s=c.has(1),fe.vertexUv2s=c.has(2),fe.vertexUv3s=c.has(3),c.clear(),fe}function p(T){const _=[];if(T.shaderID?_.push(T.shaderID):(_.push(T.customVertexShaderID),_.push(T.customFragmentShaderID)),T.defines!==void 0)for(const P in T.defines)_.push(P),_.push(T.defines[P]);return T.isRawShaderMaterial===!1&&(y(_,T),M(_,T),_.push(i.outputColorSpace)),_.push(T.customProgramCacheKey),_.join()}function y(T,_){T.push(_.precision),T.push(_.outputColorSpace),T.push(_.envMapMode),T.push(_.envMapCubeUVHeight),T.push(_.mapUv),T.push(_.alphaMapUv),T.push(_.lightMapUv),T.push(_.aoMapUv),T.push(_.bumpMapUv),T.push(_.normalMapUv),T.push(_.displacementMapUv),T.push(_.emissiveMapUv),T.push(_.metalnessMapUv),T.push(_.roughnessMapUv),T.push(_.anisotropyMapUv),T.push(_.clearcoatMapUv),T.push(_.clearcoatNormalMapUv),T.push(_.clearcoatRoughnessMapUv),T.push(_.iridescenceMapUv),T.push(_.iridescenceThicknessMapUv),T.push(_.sheenColorMapUv),T.push(_.sheenRoughnessMapUv),T.push(_.specularMapUv),T.push(_.specularColorMapUv),T.push(_.specularIntensityMapUv),T.push(_.transmissionMapUv),T.push(_.thicknessMapUv),T.push(_.combine),T.push(_.fogExp2),T.push(_.sizeAttenuation),T.push(_.morphTargetsCount),T.push(_.morphAttributeCount),T.push(_.numDirLights),T.push(_.numPointLights),T.push(_.numSpotLights),T.push(_.numSpotLightMaps),T.push(_.numHemiLights),T.push(_.numRectAreaLights),T.push(_.numDirLightShadows),T.push(_.numPointLightShadows),T.push(_.numSpotLightShadows),T.push(_.numSpotLightShadowsWithMaps),T.push(_.numLightProbes),T.push(_.shadowMapType),T.push(_.toneMapping),T.push(_.numClippingPlanes),T.push(_.numClipIntersection),T.push(_.depthPacking)}function M(T,_){a.disableAll(),_.supportsVertexTextures&&a.enable(0),_.instancing&&a.enable(1),_.instancingColor&&a.enable(2),_.instancingMorph&&a.enable(3),_.matcap&&a.enable(4),_.envMap&&a.enable(5),_.normalMapObjectSpace&&a.enable(6),_.normalMapTangentSpace&&a.enable(7),_.clearcoat&&a.enable(8),_.iridescence&&a.enable(9),_.alphaTest&&a.enable(10),_.vertexColors&&a.enable(11),_.vertexAlphas&&a.enable(12),_.vertexUv1s&&a.enable(13),_.vertexUv2s&&a.enable(14),_.vertexUv3s&&a.enable(15),_.vertexTangents&&a.enable(16),_.anisotropy&&a.enable(17),_.alphaHash&&a.enable(18),_.batching&&a.enable(19),_.dispersion&&a.enable(20),_.batchingColor&&a.enable(21),T.push(a.mask),a.disableAll(),_.fog&&a.enable(0),_.useFog&&a.enable(1),_.flatShading&&a.enable(2),_.logarithmicDepthBuffer&&a.enable(3),_.reverseDepthBuffer&&a.enable(4),_.skinning&&a.enable(5),_.morphTargets&&a.enable(6),_.morphNormals&&a.enable(7),_.morphColors&&a.enable(8),_.premultipliedAlpha&&a.enable(9),_.shadowMapEnabled&&a.enable(10),_.doubleSided&&a.enable(11),_.flipSided&&a.enable(12),_.useDepthPacking&&a.enable(13),_.dithering&&a.enable(14),_.transmission&&a.enable(15),_.sheen&&a.enable(16),_.opaque&&a.enable(17),_.pointsUvs&&a.enable(18),_.decodeVideoTexture&&a.enable(19),_.decodeVideoTextureEmissive&&a.enable(20),_.alphaToCoverage&&a.enable(21),T.push(a.mask)}function x(T){const _=g[T.type];let P;if(_){const V=Mn[_];P=cf.clone(V.uniforms)}else P=T.uniforms;return P}function q(T,_){let P;for(let V=0,H=u.length;V<H;V++){const k=u[V];if(k.cacheKey===_){P=k,++P.usedTimes;break}}return P===void 0&&(P=new S0(i,_,T,r),u.push(P)),P}function R(T){if(--T.usedTimes===0){const _=u.indexOf(T);u[_]=u[u.length-1],u.pop(),T.destroy()}}function L(T){l.remove(T)}function N(){l.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:x,acquireProgram:q,releaseProgram:R,releaseShaderCache:L,programs:u,dispose:N}}function A0(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,l){i.get(o)[a]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function C0(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function ic(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function sc(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(h,d,f,g,v,m){let p=i[t];return p===void 0?(p={id:h.id,object:h,geometry:d,material:f,groupOrder:g,renderOrder:h.renderOrder,z:v,group:m},i[t]=p):(p.id=h.id,p.object=h,p.geometry=d,p.material=f,p.groupOrder=g,p.renderOrder=h.renderOrder,p.z=v,p.group=m),t++,p}function a(h,d,f,g,v,m){const p=o(h,d,f,g,v,m);f.transmission>0?n.push(p):f.transparent===!0?s.push(p):e.push(p)}function l(h,d,f,g,v,m){const p=o(h,d,f,g,v,m);f.transmission>0?n.unshift(p):f.transparent===!0?s.unshift(p):e.unshift(p)}function c(h,d){e.length>1&&e.sort(h||C0),n.length>1&&n.sort(d||ic),s.length>1&&s.sort(d||ic)}function u(){for(let h=t,d=i.length;h<d;h++){const f=i[h];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:u,sort:c}}function R0(){let i=new WeakMap;function t(n,s){const r=i.get(n);let o;return r===void 0?(o=new sc,i.set(n,[o])):s>=r.length?(o=new sc,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function P0(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new O,color:new ut};break;case"SpotLight":e={position:new O,direction:new O,color:new ut,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new O,color:new ut,distance:0,decay:0};break;case"HemisphereLight":e={direction:new O,skyColor:new ut,groundColor:new ut};break;case"RectAreaLight":e={color:new ut,position:new O,halfWidth:new O,halfHeight:new O};break}return i[t.id]=e,e}}}function I0(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Tt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Tt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Tt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let L0=0;function D0(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function U0(i){const t=new P0,e=I0(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new O);const s=new O,r=new Qt,o=new Qt;function a(c){let u=0,h=0,d=0;for(let T=0;T<9;T++)n.probe[T].set(0,0,0);let f=0,g=0,v=0,m=0,p=0,y=0,M=0,x=0,q=0,R=0,L=0;c.sort(D0);for(let T=0,_=c.length;T<_;T++){const P=c[T],V=P.color,H=P.intensity,k=P.distance,j=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)u+=V.r*H,h+=V.g*H,d+=V.b*H;else if(P.isLightProbe){for(let C=0;C<9;C++)n.probe[C].addScaledVector(P.sh.coefficients[C],H);L++}else if(P.isDirectionalLight){const C=t.get(P);if(C.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const G=P.shadow,z=e.get(P);z.shadowIntensity=G.intensity,z.shadowBias=G.bias,z.shadowNormalBias=G.normalBias,z.shadowRadius=G.radius,z.shadowMapSize=G.mapSize,n.directionalShadow[f]=z,n.directionalShadowMap[f]=j,n.directionalShadowMatrix[f]=P.shadow.matrix,y++}n.directional[f]=C,f++}else if(P.isSpotLight){const C=t.get(P);C.position.setFromMatrixPosition(P.matrixWorld),C.color.copy(V).multiplyScalar(H),C.distance=k,C.coneCos=Math.cos(P.angle),C.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),C.decay=P.decay,n.spot[v]=C;const G=P.shadow;if(P.map&&(n.spotLightMap[q]=P.map,q++,G.updateMatrices(P),P.castShadow&&R++),n.spotLightMatrix[v]=G.matrix,P.castShadow){const z=e.get(P);z.shadowIntensity=G.intensity,z.shadowBias=G.bias,z.shadowNormalBias=G.normalBias,z.shadowRadius=G.radius,z.shadowMapSize=G.mapSize,n.spotShadow[v]=z,n.spotShadowMap[v]=j,x++}v++}else if(P.isRectAreaLight){const C=t.get(P);C.color.copy(V).multiplyScalar(H),C.halfWidth.set(P.width*.5,0,0),C.halfHeight.set(0,P.height*.5,0),n.rectArea[m]=C,m++}else if(P.isPointLight){const C=t.get(P);if(C.color.copy(P.color).multiplyScalar(P.intensity),C.distance=P.distance,C.decay=P.decay,P.castShadow){const G=P.shadow,z=e.get(P);z.shadowIntensity=G.intensity,z.shadowBias=G.bias,z.shadowNormalBias=G.normalBias,z.shadowRadius=G.radius,z.shadowMapSize=G.mapSize,z.shadowCameraNear=G.camera.near,z.shadowCameraFar=G.camera.far,n.pointShadow[g]=z,n.pointShadowMap[g]=j,n.pointShadowMatrix[g]=P.shadow.matrix,M++}n.point[g]=C,g++}else if(P.isHemisphereLight){const C=t.get(P);C.skyColor.copy(P.color).multiplyScalar(H),C.groundColor.copy(P.groundColor).multiplyScalar(H),n.hemi[p]=C,p++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Nt.LTC_FLOAT_1,n.rectAreaLTC2=Nt.LTC_FLOAT_2):(n.rectAreaLTC1=Nt.LTC_HALF_1,n.rectAreaLTC2=Nt.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=h,n.ambient[2]=d;const N=n.hash;(N.directionalLength!==f||N.pointLength!==g||N.spotLength!==v||N.rectAreaLength!==m||N.hemiLength!==p||N.numDirectionalShadows!==y||N.numPointShadows!==M||N.numSpotShadows!==x||N.numSpotMaps!==q||N.numLightProbes!==L)&&(n.directional.length=f,n.spot.length=v,n.rectArea.length=m,n.point.length=g,n.hemi.length=p,n.directionalShadow.length=y,n.directionalShadowMap.length=y,n.pointShadow.length=M,n.pointShadowMap.length=M,n.spotShadow.length=x,n.spotShadowMap.length=x,n.directionalShadowMatrix.length=y,n.pointShadowMatrix.length=M,n.spotLightMatrix.length=x+q-R,n.spotLightMap.length=q,n.numSpotLightShadowsWithMaps=R,n.numLightProbes=L,N.directionalLength=f,N.pointLength=g,N.spotLength=v,N.rectAreaLength=m,N.hemiLength=p,N.numDirectionalShadows=y,N.numPointShadows=M,N.numSpotShadows=x,N.numSpotMaps=q,N.numLightProbes=L,n.version=L0++)}function l(c,u){let h=0,d=0,f=0,g=0,v=0;const m=u.matrixWorldInverse;for(let p=0,y=c.length;p<y;p++){const M=c[p];if(M.isDirectionalLight){const x=n.directional[h];x.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(m),h++}else if(M.isSpotLight){const x=n.spot[f];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(m),x.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(m),f++}else if(M.isRectAreaLight){const x=n.rectArea[g];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(m),o.identity(),r.copy(M.matrixWorld),r.premultiply(m),o.extractRotation(r),x.halfWidth.set(M.width*.5,0,0),x.halfHeight.set(0,M.height*.5,0),x.halfWidth.applyMatrix4(o),x.halfHeight.applyMatrix4(o),g++}else if(M.isPointLight){const x=n.point[d];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(m),d++}else if(M.isHemisphereLight){const x=n.hemi[v];x.direction.setFromMatrixPosition(M.matrixWorld),x.direction.transformDirection(m),v++}}}return{setup:a,setupView:l,state:n}}function rc(i){const t=new U0(i),e=[],n=[];function s(u){c.camera=u,e.length=0,n.length=0}function r(u){e.push(u)}function o(u){n.push(u)}function a(){t.setup(e)}function l(u){t.setupView(e,u)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function N0(i){let t=new WeakMap;function e(s,r=0){const o=t.get(s);let a;return o===void 0?(a=new rc(i),t.set(s,[a])):r>=o.length?(a=new rc(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}class F0 extends yi{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=Ih,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class O0 extends yi{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const k0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,z0=`uniform sampler2D shadow_pass;
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
}`;function B0(i,t,e){let n=new za;const s=new Tt,r=new Tt,o=new ce,a=new F0({depthPacking:Lh}),l=new O0,c={},u=e.maxTextureSize,h={[ti]:He,[He]:ti,[Ie]:Ie},d=new Ee({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Tt},radius:{value:4}},vertexShader:k0,fragmentShader:z0}),f=d.clone();f.defines.HORIZONTAL_PASS=1;const g=new ye;g.setAttribute("position",new Se(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new Yt(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ia;let p=this.type;this.render=function(R,L,N){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||R.length===0)return;const T=i.getRenderTarget(),_=i.getActiveCubeFace(),P=i.getActiveMipmapLevel(),V=i.state;V.setBlending($n),V.buffers.color.setClear(1,1,1,1),V.buffers.depth.setTest(!0),V.setScissorTest(!1);const H=p!==Fn&&this.type===Fn,k=p===Fn&&this.type!==Fn;for(let j=0,C=R.length;j<C;j++){const G=R[j],z=G.shadow;if(z===void 0){console.warn("THREE.WebGLShadowMap:",G,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;s.copy(z.mapSize);const b=z.getFrameExtents();if(s.multiply(b),r.copy(z.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/b.x),s.x=r.x*b.x,z.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/b.y),s.y=r.y*b.y,z.mapSize.y=r.y)),z.map===null||H===!0||k===!0){const rt=this.type!==Fn?{minFilter:tn,magFilter:tn}:{};z.map!==null&&z.map.dispose(),z.map=new ei(s.x,s.y,rt),z.map.texture.name=G.name+".shadowMap",z.camera.updateProjectionMatrix()}i.setRenderTarget(z.map),i.clear();const W=z.getViewportCount();for(let rt=0;rt<W;rt++){const dt=z.getViewport(rt);o.set(r.x*dt.x,r.y*dt.y,r.x*dt.z,r.y*dt.w),V.viewport(o),z.updateMatrices(G,rt),n=z.getFrustum(),x(L,N,z.camera,G,this.type)}z.isPointLightShadow!==!0&&this.type===Fn&&y(z,N),z.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(T,_,P)};function y(R,L){const N=t.update(v);d.defines.VSM_SAMPLES!==R.blurSamples&&(d.defines.VSM_SAMPLES=R.blurSamples,f.defines.VSM_SAMPLES=R.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new ei(s.x,s.y)),d.uniforms.shadow_pass.value=R.map.texture,d.uniforms.resolution.value=R.mapSize,d.uniforms.radius.value=R.radius,i.setRenderTarget(R.mapPass),i.clear(),i.renderBufferDirect(L,null,N,d,v,null),f.uniforms.shadow_pass.value=R.mapPass.texture,f.uniforms.resolution.value=R.mapSize,f.uniforms.radius.value=R.radius,i.setRenderTarget(R.map),i.clear(),i.renderBufferDirect(L,null,N,f,v,null)}function M(R,L,N,T){let _=null;const P=N.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(P!==void 0)_=P;else if(_=N.isPointLight===!0?l:a,i.localClippingEnabled&&L.clipShadows===!0&&Array.isArray(L.clippingPlanes)&&L.clippingPlanes.length!==0||L.displacementMap&&L.displacementScale!==0||L.alphaMap&&L.alphaTest>0||L.map&&L.alphaTest>0){const V=_.uuid,H=L.uuid;let k=c[V];k===void 0&&(k={},c[V]=k);let j=k[H];j===void 0&&(j=_.clone(),k[H]=j,L.addEventListener("dispose",q)),_=j}if(_.visible=L.visible,_.wireframe=L.wireframe,T===Fn?_.side=L.shadowSide!==null?L.shadowSide:L.side:_.side=L.shadowSide!==null?L.shadowSide:h[L.side],_.alphaMap=L.alphaMap,_.alphaTest=L.alphaTest,_.map=L.map,_.clipShadows=L.clipShadows,_.clippingPlanes=L.clippingPlanes,_.clipIntersection=L.clipIntersection,_.displacementMap=L.displacementMap,_.displacementScale=L.displacementScale,_.displacementBias=L.displacementBias,_.wireframeLinewidth=L.wireframeLinewidth,_.linewidth=L.linewidth,N.isPointLight===!0&&_.isMeshDistanceMaterial===!0){const V=i.properties.get(_);V.light=N}return _}function x(R,L,N,T,_){if(R.visible===!1)return;if(R.layers.test(L.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&_===Fn)&&(!R.frustumCulled||n.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,R.matrixWorld);const H=t.update(R),k=R.material;if(Array.isArray(k)){const j=H.groups;for(let C=0,G=j.length;C<G;C++){const z=j[C],b=k[z.materialIndex];if(b&&b.visible){const W=M(R,b,T,_);R.onBeforeShadow(i,R,L,N,H,W,z),i.renderBufferDirect(N,null,H,W,R,z),R.onAfterShadow(i,R,L,N,H,W,z)}}}else if(k.visible){const j=M(R,k,T,_);R.onBeforeShadow(i,R,L,N,H,j,null),i.renderBufferDirect(N,null,H,j,R,null),R.onAfterShadow(i,R,L,N,H,j,null)}}const V=R.children;for(let H=0,k=V.length;H<k;H++)x(V[H],L,N,T,_)}function q(R){R.target.removeEventListener("dispose",q);for(const N in c){const T=c[N],_=R.target.uuid;_ in T&&(T[_].dispose(),delete T[_])}}}const H0={[No]:Fo,[Oo]:Bo,[ko]:Ho,[Zi]:zo,[Fo]:No,[Bo]:Oo,[Ho]:ko,[zo]:Zi};function G0(i,t){function e(){let F=!1;const bt=new ce;let ht=null;const mt=new ce(0,0,0,0);return{setMask:function(At){ht!==At&&!F&&(i.colorMask(At,At,At,At),ht=At)},setLocked:function(At){F=At},setClear:function(At,Lt,Ot,ne,fe){fe===!0&&(At*=ne,Lt*=ne,Ot*=ne),bt.set(At,Lt,Ot,ne),mt.equals(bt)===!1&&(i.clearColor(At,Lt,Ot,ne),mt.copy(bt))},reset:function(){F=!1,ht=null,mt.set(-1,0,0,0)}}}function n(){let F=!1,bt=!1,ht=null,mt=null,At=null;return{setReversed:function(Lt){if(bt!==Lt){const Ot=t.get("EXT_clip_control");bt?Ot.clipControlEXT(Ot.LOWER_LEFT_EXT,Ot.ZERO_TO_ONE_EXT):Ot.clipControlEXT(Ot.LOWER_LEFT_EXT,Ot.NEGATIVE_ONE_TO_ONE_EXT);const ne=At;At=null,this.setClear(ne)}bt=Lt},getReversed:function(){return bt},setTest:function(Lt){Lt?J(i.DEPTH_TEST):ft(i.DEPTH_TEST)},setMask:function(Lt){ht!==Lt&&!F&&(i.depthMask(Lt),ht=Lt)},setFunc:function(Lt){if(bt&&(Lt=H0[Lt]),mt!==Lt){switch(Lt){case No:i.depthFunc(i.NEVER);break;case Fo:i.depthFunc(i.ALWAYS);break;case Oo:i.depthFunc(i.LESS);break;case Zi:i.depthFunc(i.LEQUAL);break;case ko:i.depthFunc(i.EQUAL);break;case zo:i.depthFunc(i.GEQUAL);break;case Bo:i.depthFunc(i.GREATER);break;case Ho:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}mt=Lt}},setLocked:function(Lt){F=Lt},setClear:function(Lt){At!==Lt&&(bt&&(Lt=1-Lt),i.clearDepth(Lt),At=Lt)},reset:function(){F=!1,ht=null,mt=null,At=null,bt=!1}}}function s(){let F=!1,bt=null,ht=null,mt=null,At=null,Lt=null,Ot=null,ne=null,fe=null;return{setTest:function(zt){F||(zt?J(i.STENCIL_TEST):ft(i.STENCIL_TEST))},setMask:function(zt){bt!==zt&&!F&&(i.stencilMask(zt),bt=zt)},setFunc:function(zt,ee,ie){(ht!==zt||mt!==ee||At!==ie)&&(i.stencilFunc(zt,ee,ie),ht=zt,mt=ee,At=ie)},setOp:function(zt,ee,ie){(Lt!==zt||Ot!==ee||ne!==ie)&&(i.stencilOp(zt,ee,ie),Lt=zt,Ot=ee,ne=ie)},setLocked:function(zt){F=zt},setClear:function(zt){fe!==zt&&(i.clearStencil(zt),fe=zt)},reset:function(){F=!1,bt=null,ht=null,mt=null,At=null,Lt=null,Ot=null,ne=null,fe=null}}}const r=new e,o=new n,a=new s,l=new WeakMap,c=new WeakMap;let u={},h={},d=new WeakMap,f=[],g=null,v=!1,m=null,p=null,y=null,M=null,x=null,q=null,R=null,L=new ut(0,0,0),N=0,T=!1,_=null,P=null,V=null,H=null,k=null;const j=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let C=!1,G=0;const z=i.getParameter(i.VERSION);z.indexOf("WebGL")!==-1?(G=parseFloat(/^WebGL (\d)/.exec(z)[1]),C=G>=1):z.indexOf("OpenGL ES")!==-1&&(G=parseFloat(/^OpenGL ES (\d)/.exec(z)[1]),C=G>=2);let b=null,W={};const rt=i.getParameter(i.SCISSOR_BOX),dt=i.getParameter(i.VIEWPORT),B=new ce().fromArray(rt),X=new ce().fromArray(dt);function I(F,bt,ht,mt){const At=new Uint8Array(4),Lt=i.createTexture();i.bindTexture(F,Lt),i.texParameteri(F,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(F,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ot=0;Ot<ht;Ot++)F===i.TEXTURE_3D||F===i.TEXTURE_2D_ARRAY?i.texImage3D(bt,0,i.RGBA,1,1,mt,0,i.RGBA,i.UNSIGNED_BYTE,At):i.texImage2D(bt+Ot,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,At);return Lt}const it={};it[i.TEXTURE_2D]=I(i.TEXTURE_2D,i.TEXTURE_2D,1),it[i.TEXTURE_CUBE_MAP]=I(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),it[i.TEXTURE_2D_ARRAY]=I(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),it[i.TEXTURE_3D]=I(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),J(i.DEPTH_TEST),o.setFunc(Zi),K(!1),$(ul),J(i.CULL_FACE),U($n);function J(F){u[F]!==!0&&(i.enable(F),u[F]=!0)}function ft(F){u[F]!==!1&&(i.disable(F),u[F]=!1)}function Ct(F,bt){return h[F]!==bt?(i.bindFramebuffer(F,bt),h[F]=bt,F===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=bt),F===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=bt),!0):!1}function It(F,bt){let ht=f,mt=!1;if(F){ht=d.get(bt),ht===void 0&&(ht=[],d.set(bt,ht));const At=F.textures;if(ht.length!==At.length||ht[0]!==i.COLOR_ATTACHMENT0){for(let Lt=0,Ot=At.length;Lt<Ot;Lt++)ht[Lt]=i.COLOR_ATTACHMENT0+Lt;ht.length=At.length,mt=!0}}else ht[0]!==i.BACK&&(ht[0]=i.BACK,mt=!0);mt&&i.drawBuffers(ht)}function Bt(F){return g!==F?(i.useProgram(F),g=F,!0):!1}const Mt={[pi]:i.FUNC_ADD,[ih]:i.FUNC_SUBTRACT,[sh]:i.FUNC_REVERSE_SUBTRACT};Mt[rh]=i.MIN,Mt[oh]=i.MAX;const Et={[ah]:i.ZERO,[lh]:i.ONE,[ch]:i.SRC_COLOR,[Do]:i.SRC_ALPHA,[mh]:i.SRC_ALPHA_SATURATE,[dh]:i.DST_COLOR,[hh]:i.DST_ALPHA,[uh]:i.ONE_MINUS_SRC_COLOR,[Uo]:i.ONE_MINUS_SRC_ALPHA,[ph]:i.ONE_MINUS_DST_COLOR,[fh]:i.ONE_MINUS_DST_ALPHA,[gh]:i.CONSTANT_COLOR,[vh]:i.ONE_MINUS_CONSTANT_COLOR,[_h]:i.CONSTANT_ALPHA,[xh]:i.ONE_MINUS_CONSTANT_ALPHA};function U(F,bt,ht,mt,At,Lt,Ot,ne,fe,zt){if(F===$n){v===!0&&(ft(i.BLEND),v=!1);return}if(v===!1&&(J(i.BLEND),v=!0),F!==nh){if(F!==m||zt!==T){if((p!==pi||x!==pi)&&(i.blendEquation(i.FUNC_ADD),p=pi,x=pi),zt)switch(F){case Ge:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case qi:i.blendFunc(i.ONE,i.ONE);break;case hl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case fl:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",F);break}else switch(F){case Ge:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case qi:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case hl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case fl:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",F);break}y=null,M=null,q=null,R=null,L.set(0,0,0),N=0,m=F,T=zt}return}At=At||bt,Lt=Lt||ht,Ot=Ot||mt,(bt!==p||At!==x)&&(i.blendEquationSeparate(Mt[bt],Mt[At]),p=bt,x=At),(ht!==y||mt!==M||Lt!==q||Ot!==R)&&(i.blendFuncSeparate(Et[ht],Et[mt],Et[Lt],Et[Ot]),y=ht,M=mt,q=Lt,R=Ot),(ne.equals(L)===!1||fe!==N)&&(i.blendColor(ne.r,ne.g,ne.b,fe),L.copy(ne),N=fe),m=F,T=!1}function w(F,bt){F.side===Ie?ft(i.CULL_FACE):J(i.CULL_FACE);let ht=F.side===He;bt&&(ht=!ht),K(ht),F.blending===Ge&&F.transparent===!1?U($n):U(F.blending,F.blendEquation,F.blendSrc,F.blendDst,F.blendEquationAlpha,F.blendSrcAlpha,F.blendDstAlpha,F.blendColor,F.blendAlpha,F.premultipliedAlpha),o.setFunc(F.depthFunc),o.setTest(F.depthTest),o.setMask(F.depthWrite),r.setMask(F.colorWrite);const mt=F.stencilWrite;a.setTest(mt),mt&&(a.setMask(F.stencilWriteMask),a.setFunc(F.stencilFunc,F.stencilRef,F.stencilFuncMask),a.setOp(F.stencilFail,F.stencilZFail,F.stencilZPass)),ct(F.polygonOffset,F.polygonOffsetFactor,F.polygonOffsetUnits),F.alphaToCoverage===!0?J(i.SAMPLE_ALPHA_TO_COVERAGE):ft(i.SAMPLE_ALPHA_TO_COVERAGE)}function K(F){_!==F&&(F?i.frontFace(i.CW):i.frontFace(i.CCW),_=F)}function $(F){F!==th?(J(i.CULL_FACE),F!==P&&(F===ul?i.cullFace(i.BACK):F===eh?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ft(i.CULL_FACE),P=F}function D(F){F!==V&&(C&&i.lineWidth(F),V=F)}function ct(F,bt,ht){F?(J(i.POLYGON_OFFSET_FILL),(H!==bt||k!==ht)&&(i.polygonOffset(bt,ht),H=bt,k=ht)):ft(i.POLYGON_OFFSET_FILL)}function nt(F){F?J(i.SCISSOR_TEST):ft(i.SCISSOR_TEST)}function E(F){F===void 0&&(F=i.TEXTURE0+j-1),b!==F&&(i.activeTexture(F),b=F)}function S(F,bt,ht){ht===void 0&&(b===null?ht=i.TEXTURE0+j-1:ht=b);let mt=W[ht];mt===void 0&&(mt={type:void 0,texture:void 0},W[ht]=mt),(mt.type!==F||mt.texture!==bt)&&(b!==ht&&(i.activeTexture(ht),b=ht),i.bindTexture(F,bt||it[F]),mt.type=F,mt.texture=bt)}function et(){const F=W[b];F!==void 0&&F.type!==void 0&&(i.bindTexture(F.type,null),F.type=void 0,F.texture=void 0)}function yt(){try{i.compressedTexImage2D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Z(){try{i.compressedTexImage3D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function tt(){try{i.texSubImage2D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function St(){try{i.texSubImage3D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function pt(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function xt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Pt(){try{i.texStorage2D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function gt(){try{i.texStorage3D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Rt(){try{i.texImage2D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Ft(){try{i.texImage3D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Y(F){B.equals(F)===!1&&(i.scissor(F.x,F.y,F.z,F.w),B.copy(F))}function Q(F){X.equals(F)===!1&&(i.viewport(F.x,F.y,F.z,F.w),X.copy(F))}function lt(F,bt){let ht=c.get(bt);ht===void 0&&(ht=new WeakMap,c.set(bt,ht));let mt=ht.get(F);mt===void 0&&(mt=i.getUniformBlockIndex(bt,F.name),ht.set(F,mt))}function at(F,bt){const mt=c.get(bt).get(F);l.get(bt)!==mt&&(i.uniformBlockBinding(bt,mt,F.__bindingPointIndex),l.set(bt,mt))}function wt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),u={},b=null,W={},h={},d=new WeakMap,f=[],g=null,v=!1,m=null,p=null,y=null,M=null,x=null,q=null,R=null,L=new ut(0,0,0),N=0,T=!1,_=null,P=null,V=null,H=null,k=null,B.set(0,0,i.canvas.width,i.canvas.height),X.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:J,disable:ft,bindFramebuffer:Ct,drawBuffers:It,useProgram:Bt,setBlending:U,setMaterial:w,setFlipSided:K,setCullFace:$,setLineWidth:D,setPolygonOffset:ct,setScissorTest:nt,activeTexture:E,bindTexture:S,unbindTexture:et,compressedTexImage2D:yt,compressedTexImage3D:Z,texImage2D:Rt,texImage3D:Ft,updateUBOMapping:lt,uniformBlockBinding:at,texStorage2D:Pt,texStorage3D:gt,texSubImage2D:tt,texSubImage3D:St,compressedTexSubImage2D:pt,compressedTexSubImage3D:xt,scissor:Y,viewport:Q,reset:wt}}function oc(i,t,e,n){const s=V0(n);switch(e){case ou:return i*t;case lu:return i*t;case cu:return i*t*2;case Na:return i*t/s.components*s.byteLength;case Fa:return i*t/s.components*s.byteLength;case uu:return i*t*2/s.components*s.byteLength;case Oa:return i*t*2/s.components*s.byteLength;case au:return i*t*3/s.components*s.byteLength;case qe:return i*t*4/s.components*s.byteLength;case ka:return i*t*4/s.components*s.byteLength;case gr:case vr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case _r:case xr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Yo:case Zo:return Math.max(i,16)*Math.max(t,8)/4;case Xo:case qo:return Math.max(i,8)*Math.max(t,8)/2;case Ko:case Jo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case $o:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case jo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Qo:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case ta:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case ea:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case na:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case ia:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case sa:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case ra:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case oa:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case aa:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case la:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case ca:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case ua:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case ha:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case Mr:case fa:case da:return Math.ceil(i/4)*Math.ceil(t/4)*16;case hu:case pa:return Math.ceil(i/4)*Math.ceil(t/4)*8;case ma:case ga:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function V0(i){switch(i){case bn:case iu:return{byteLength:1,components:1};case bs:case su:case es:return{byteLength:2,components:1};case Da:case Ua:return{byteLength:2,components:4};case _i:case La:case mn:return{byteLength:4,components:1};case ru:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function W0(i,t,e,n,s,r,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Tt,u=new WeakMap;let h;const d=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(E,S){return f?new OffscreenCanvas(E,S):br("canvas")}function v(E,S,et){let yt=1;const Z=nt(E);if((Z.width>et||Z.height>et)&&(yt=et/Math.max(Z.width,Z.height)),yt<1)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap||typeof VideoFrame<"u"&&E instanceof VideoFrame){const tt=Math.floor(yt*Z.width),St=Math.floor(yt*Z.height);h===void 0&&(h=g(tt,St));const pt=S?g(tt,St):h;return pt.width=tt,pt.height=St,pt.getContext("2d").drawImage(E,0,0,tt,St),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Z.width+"x"+Z.height+") to ("+tt+"x"+St+")."),pt}else return"data"in E&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Z.width+"x"+Z.height+")."),E;return E}function m(E){return E.generateMipmaps}function p(E){i.generateMipmap(E)}function y(E){return E.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:E.isWebGL3DRenderTarget?i.TEXTURE_3D:E.isWebGLArrayRenderTarget||E.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function M(E,S,et,yt,Z=!1){if(E!==null){if(i[E]!==void 0)return i[E];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let tt=S;if(S===i.RED&&(et===i.FLOAT&&(tt=i.R32F),et===i.HALF_FLOAT&&(tt=i.R16F),et===i.UNSIGNED_BYTE&&(tt=i.R8)),S===i.RED_INTEGER&&(et===i.UNSIGNED_BYTE&&(tt=i.R8UI),et===i.UNSIGNED_SHORT&&(tt=i.R16UI),et===i.UNSIGNED_INT&&(tt=i.R32UI),et===i.BYTE&&(tt=i.R8I),et===i.SHORT&&(tt=i.R16I),et===i.INT&&(tt=i.R32I)),S===i.RG&&(et===i.FLOAT&&(tt=i.RG32F),et===i.HALF_FLOAT&&(tt=i.RG16F),et===i.UNSIGNED_BYTE&&(tt=i.RG8)),S===i.RG_INTEGER&&(et===i.UNSIGNED_BYTE&&(tt=i.RG8UI),et===i.UNSIGNED_SHORT&&(tt=i.RG16UI),et===i.UNSIGNED_INT&&(tt=i.RG32UI),et===i.BYTE&&(tt=i.RG8I),et===i.SHORT&&(tt=i.RG16I),et===i.INT&&(tt=i.RG32I)),S===i.RGB_INTEGER&&(et===i.UNSIGNED_BYTE&&(tt=i.RGB8UI),et===i.UNSIGNED_SHORT&&(tt=i.RGB16UI),et===i.UNSIGNED_INT&&(tt=i.RGB32UI),et===i.BYTE&&(tt=i.RGB8I),et===i.SHORT&&(tt=i.RGB16I),et===i.INT&&(tt=i.RGB32I)),S===i.RGBA_INTEGER&&(et===i.UNSIGNED_BYTE&&(tt=i.RGBA8UI),et===i.UNSIGNED_SHORT&&(tt=i.RGBA16UI),et===i.UNSIGNED_INT&&(tt=i.RGBA32UI),et===i.BYTE&&(tt=i.RGBA8I),et===i.SHORT&&(tt=i.RGBA16I),et===i.INT&&(tt=i.RGBA32I)),S===i.RGB&&et===i.UNSIGNED_INT_5_9_9_9_REV&&(tt=i.RGB9_E5),S===i.RGBA){const St=Z?Lr:ae.getTransfer(yt);et===i.FLOAT&&(tt=i.RGBA32F),et===i.HALF_FLOAT&&(tt=i.RGBA16F),et===i.UNSIGNED_BYTE&&(tt=St===de?i.SRGB8_ALPHA8:i.RGBA8),et===i.UNSIGNED_SHORT_4_4_4_4&&(tt=i.RGBA4),et===i.UNSIGNED_SHORT_5_5_5_1&&(tt=i.RGB5_A1)}return(tt===i.R16F||tt===i.R32F||tt===i.RG16F||tt===i.RG32F||tt===i.RGBA16F||tt===i.RGBA32F)&&t.get("EXT_color_buffer_float"),tt}function x(E,S){let et;return E?S===null||S===_i||S===ji?et=i.DEPTH24_STENCIL8:S===mn?et=i.DEPTH32F_STENCIL8:S===bs&&(et=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):S===null||S===_i||S===ji?et=i.DEPTH_COMPONENT24:S===mn?et=i.DEPTH_COMPONENT32F:S===bs&&(et=i.DEPTH_COMPONENT16),et}function q(E,S){return m(E)===!0||E.isFramebufferTexture&&E.minFilter!==tn&&E.minFilter!==Be?Math.log2(Math.max(S.width,S.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?S.mipmaps.length:1}function R(E){const S=E.target;S.removeEventListener("dispose",R),N(S),S.isVideoTexture&&u.delete(S)}function L(E){const S=E.target;S.removeEventListener("dispose",L),_(S)}function N(E){const S=n.get(E);if(S.__webglInit===void 0)return;const et=E.source,yt=d.get(et);if(yt){const Z=yt[S.__cacheKey];Z.usedTimes--,Z.usedTimes===0&&T(E),Object.keys(yt).length===0&&d.delete(et)}n.remove(E)}function T(E){const S=n.get(E);i.deleteTexture(S.__webglTexture);const et=E.source,yt=d.get(et);delete yt[S.__cacheKey],o.memory.textures--}function _(E){const S=n.get(E);if(E.depthTexture&&(E.depthTexture.dispose(),n.remove(E.depthTexture)),E.isWebGLCubeRenderTarget)for(let yt=0;yt<6;yt++){if(Array.isArray(S.__webglFramebuffer[yt]))for(let Z=0;Z<S.__webglFramebuffer[yt].length;Z++)i.deleteFramebuffer(S.__webglFramebuffer[yt][Z]);else i.deleteFramebuffer(S.__webglFramebuffer[yt]);S.__webglDepthbuffer&&i.deleteRenderbuffer(S.__webglDepthbuffer[yt])}else{if(Array.isArray(S.__webglFramebuffer))for(let yt=0;yt<S.__webglFramebuffer.length;yt++)i.deleteFramebuffer(S.__webglFramebuffer[yt]);else i.deleteFramebuffer(S.__webglFramebuffer);if(S.__webglDepthbuffer&&i.deleteRenderbuffer(S.__webglDepthbuffer),S.__webglMultisampledFramebuffer&&i.deleteFramebuffer(S.__webglMultisampledFramebuffer),S.__webglColorRenderbuffer)for(let yt=0;yt<S.__webglColorRenderbuffer.length;yt++)S.__webglColorRenderbuffer[yt]&&i.deleteRenderbuffer(S.__webglColorRenderbuffer[yt]);S.__webglDepthRenderbuffer&&i.deleteRenderbuffer(S.__webglDepthRenderbuffer)}const et=E.textures;for(let yt=0,Z=et.length;yt<Z;yt++){const tt=n.get(et[yt]);tt.__webglTexture&&(i.deleteTexture(tt.__webglTexture),o.memory.textures--),n.remove(et[yt])}n.remove(E)}let P=0;function V(){P=0}function H(){const E=P;return E>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+s.maxTextures),P+=1,E}function k(E){const S=[];return S.push(E.wrapS),S.push(E.wrapT),S.push(E.wrapR||0),S.push(E.magFilter),S.push(E.minFilter),S.push(E.anisotropy),S.push(E.internalFormat),S.push(E.format),S.push(E.type),S.push(E.generateMipmaps),S.push(E.premultiplyAlpha),S.push(E.flipY),S.push(E.unpackAlignment),S.push(E.colorSpace),S.join()}function j(E,S){const et=n.get(E);if(E.isVideoTexture&&D(E),E.isRenderTargetTexture===!1&&E.version>0&&et.__version!==E.version){const yt=E.image;if(yt===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(yt.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{X(et,E,S);return}}e.bindTexture(i.TEXTURE_2D,et.__webglTexture,i.TEXTURE0+S)}function C(E,S){const et=n.get(E);if(E.version>0&&et.__version!==E.version){X(et,E,S);return}e.bindTexture(i.TEXTURE_2D_ARRAY,et.__webglTexture,i.TEXTURE0+S)}function G(E,S){const et=n.get(E);if(E.version>0&&et.__version!==E.version){X(et,E,S);return}e.bindTexture(i.TEXTURE_3D,et.__webglTexture,i.TEXTURE0+S)}function z(E,S){const et=n.get(E);if(E.version>0&&et.__version!==E.version){I(et,E,S);return}e.bindTexture(i.TEXTURE_CUBE_MAP,et.__webglTexture,i.TEXTURE0+S)}const b={[$i]:i.REPEAT,[yn]:i.CLAMP_TO_EDGE,[Wo]:i.MIRRORED_REPEAT},W={[tn]:i.NEAREST,[Ph]:i.NEAREST_MIPMAP_NEAREST,[Fs]:i.NEAREST_MIPMAP_LINEAR,[Be]:i.LINEAR,[Hr]:i.LINEAR_MIPMAP_NEAREST,[Sn]:i.LINEAR_MIPMAP_LINEAR},rt={[Uh]:i.NEVER,[Bh]:i.ALWAYS,[Nh]:i.LESS,[du]:i.LEQUAL,[Fh]:i.EQUAL,[zh]:i.GEQUAL,[Oh]:i.GREATER,[kh]:i.NOTEQUAL};function dt(E,S){if(S.type===mn&&t.has("OES_texture_float_linear")===!1&&(S.magFilter===Be||S.magFilter===Hr||S.magFilter===Fs||S.magFilter===Sn||S.minFilter===Be||S.minFilter===Hr||S.minFilter===Fs||S.minFilter===Sn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(E,i.TEXTURE_WRAP_S,b[S.wrapS]),i.texParameteri(E,i.TEXTURE_WRAP_T,b[S.wrapT]),(E===i.TEXTURE_3D||E===i.TEXTURE_2D_ARRAY)&&i.texParameteri(E,i.TEXTURE_WRAP_R,b[S.wrapR]),i.texParameteri(E,i.TEXTURE_MAG_FILTER,W[S.magFilter]),i.texParameteri(E,i.TEXTURE_MIN_FILTER,W[S.minFilter]),S.compareFunction&&(i.texParameteri(E,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(E,i.TEXTURE_COMPARE_FUNC,rt[S.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(S.magFilter===tn||S.minFilter!==Fs&&S.minFilter!==Sn||S.type===mn&&t.has("OES_texture_float_linear")===!1)return;if(S.anisotropy>1||n.get(S).__currentAnisotropy){const et=t.get("EXT_texture_filter_anisotropic");i.texParameterf(E,et.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,s.getMaxAnisotropy())),n.get(S).__currentAnisotropy=S.anisotropy}}}function B(E,S){let et=!1;E.__webglInit===void 0&&(E.__webglInit=!0,S.addEventListener("dispose",R));const yt=S.source;let Z=d.get(yt);Z===void 0&&(Z={},d.set(yt,Z));const tt=k(S);if(tt!==E.__cacheKey){Z[tt]===void 0&&(Z[tt]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,et=!0),Z[tt].usedTimes++;const St=Z[E.__cacheKey];St!==void 0&&(Z[E.__cacheKey].usedTimes--,St.usedTimes===0&&T(S)),E.__cacheKey=tt,E.__webglTexture=Z[tt].texture}return et}function X(E,S,et){let yt=i.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(yt=i.TEXTURE_2D_ARRAY),S.isData3DTexture&&(yt=i.TEXTURE_3D);const Z=B(E,S),tt=S.source;e.bindTexture(yt,E.__webglTexture,i.TEXTURE0+et);const St=n.get(tt);if(tt.version!==St.__version||Z===!0){e.activeTexture(i.TEXTURE0+et);const pt=ae.getPrimaries(ae.workingColorSpace),xt=S.colorSpace===fn?null:ae.getPrimaries(S.colorSpace),Pt=S.colorSpace===fn||pt===xt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,S.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,S.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Pt);let gt=v(S.image,!1,s.maxTextureSize);gt=ct(S,gt);const Rt=r.convert(S.format,S.colorSpace),Ft=r.convert(S.type);let Y=M(S.internalFormat,Rt,Ft,S.colorSpace,S.isVideoTexture);dt(yt,S);let Q;const lt=S.mipmaps,at=S.isVideoTexture!==!0,wt=St.__version===void 0||Z===!0,F=tt.dataReady,bt=q(S,gt);if(S.isDepthTexture)Y=x(S.format===Qi,S.type),wt&&(at?e.texStorage2D(i.TEXTURE_2D,1,Y,gt.width,gt.height):e.texImage2D(i.TEXTURE_2D,0,Y,gt.width,gt.height,0,Rt,Ft,null));else if(S.isDataTexture)if(lt.length>0){at&&wt&&e.texStorage2D(i.TEXTURE_2D,bt,Y,lt[0].width,lt[0].height);for(let ht=0,mt=lt.length;ht<mt;ht++)Q=lt[ht],at?F&&e.texSubImage2D(i.TEXTURE_2D,ht,0,0,Q.width,Q.height,Rt,Ft,Q.data):e.texImage2D(i.TEXTURE_2D,ht,Y,Q.width,Q.height,0,Rt,Ft,Q.data);S.generateMipmaps=!1}else at?(wt&&e.texStorage2D(i.TEXTURE_2D,bt,Y,gt.width,gt.height),F&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,gt.width,gt.height,Rt,Ft,gt.data)):e.texImage2D(i.TEXTURE_2D,0,Y,gt.width,gt.height,0,Rt,Ft,gt.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){at&&wt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,bt,Y,lt[0].width,lt[0].height,gt.depth);for(let ht=0,mt=lt.length;ht<mt;ht++)if(Q=lt[ht],S.format!==qe)if(Rt!==null)if(at){if(F)if(S.layerUpdates.size>0){const At=oc(Q.width,Q.height,S.format,S.type);for(const Lt of S.layerUpdates){const Ot=Q.data.subarray(Lt*At/Q.data.BYTES_PER_ELEMENT,(Lt+1)*At/Q.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ht,0,0,Lt,Q.width,Q.height,1,Rt,Ot)}S.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ht,0,0,0,Q.width,Q.height,gt.depth,Rt,Q.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,ht,Y,Q.width,Q.height,gt.depth,0,Q.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else at?F&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,ht,0,0,0,Q.width,Q.height,gt.depth,Rt,Ft,Q.data):e.texImage3D(i.TEXTURE_2D_ARRAY,ht,Y,Q.width,Q.height,gt.depth,0,Rt,Ft,Q.data)}else{at&&wt&&e.texStorage2D(i.TEXTURE_2D,bt,Y,lt[0].width,lt[0].height);for(let ht=0,mt=lt.length;ht<mt;ht++)Q=lt[ht],S.format!==qe?Rt!==null?at?F&&e.compressedTexSubImage2D(i.TEXTURE_2D,ht,0,0,Q.width,Q.height,Rt,Q.data):e.compressedTexImage2D(i.TEXTURE_2D,ht,Y,Q.width,Q.height,0,Q.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):at?F&&e.texSubImage2D(i.TEXTURE_2D,ht,0,0,Q.width,Q.height,Rt,Ft,Q.data):e.texImage2D(i.TEXTURE_2D,ht,Y,Q.width,Q.height,0,Rt,Ft,Q.data)}else if(S.isDataArrayTexture)if(at){if(wt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,bt,Y,gt.width,gt.height,gt.depth),F)if(S.layerUpdates.size>0){const ht=oc(gt.width,gt.height,S.format,S.type);for(const mt of S.layerUpdates){const At=gt.data.subarray(mt*ht/gt.data.BYTES_PER_ELEMENT,(mt+1)*ht/gt.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,mt,gt.width,gt.height,1,Rt,Ft,At)}S.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,gt.width,gt.height,gt.depth,Rt,Ft,gt.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,Y,gt.width,gt.height,gt.depth,0,Rt,Ft,gt.data);else if(S.isData3DTexture)at?(wt&&e.texStorage3D(i.TEXTURE_3D,bt,Y,gt.width,gt.height,gt.depth),F&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,gt.width,gt.height,gt.depth,Rt,Ft,gt.data)):e.texImage3D(i.TEXTURE_3D,0,Y,gt.width,gt.height,gt.depth,0,Rt,Ft,gt.data);else if(S.isFramebufferTexture){if(wt)if(at)e.texStorage2D(i.TEXTURE_2D,bt,Y,gt.width,gt.height);else{let ht=gt.width,mt=gt.height;for(let At=0;At<bt;At++)e.texImage2D(i.TEXTURE_2D,At,Y,ht,mt,0,Rt,Ft,null),ht>>=1,mt>>=1}}else if(lt.length>0){if(at&&wt){const ht=nt(lt[0]);e.texStorage2D(i.TEXTURE_2D,bt,Y,ht.width,ht.height)}for(let ht=0,mt=lt.length;ht<mt;ht++)Q=lt[ht],at?F&&e.texSubImage2D(i.TEXTURE_2D,ht,0,0,Rt,Ft,Q):e.texImage2D(i.TEXTURE_2D,ht,Y,Rt,Ft,Q);S.generateMipmaps=!1}else if(at){if(wt){const ht=nt(gt);e.texStorage2D(i.TEXTURE_2D,bt,Y,ht.width,ht.height)}F&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,Rt,Ft,gt)}else e.texImage2D(i.TEXTURE_2D,0,Y,Rt,Ft,gt);m(S)&&p(yt),St.__version=tt.version,S.onUpdate&&S.onUpdate(S)}E.__version=S.version}function I(E,S,et){if(S.image.length!==6)return;const yt=B(E,S),Z=S.source;e.bindTexture(i.TEXTURE_CUBE_MAP,E.__webglTexture,i.TEXTURE0+et);const tt=n.get(Z);if(Z.version!==tt.__version||yt===!0){e.activeTexture(i.TEXTURE0+et);const St=ae.getPrimaries(ae.workingColorSpace),pt=S.colorSpace===fn?null:ae.getPrimaries(S.colorSpace),xt=S.colorSpace===fn||St===pt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,S.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,S.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,xt);const Pt=S.isCompressedTexture||S.image[0].isCompressedTexture,gt=S.image[0]&&S.image[0].isDataTexture,Rt=[];for(let mt=0;mt<6;mt++)!Pt&&!gt?Rt[mt]=v(S.image[mt],!0,s.maxCubemapSize):Rt[mt]=gt?S.image[mt].image:S.image[mt],Rt[mt]=ct(S,Rt[mt]);const Ft=Rt[0],Y=r.convert(S.format,S.colorSpace),Q=r.convert(S.type),lt=M(S.internalFormat,Y,Q,S.colorSpace),at=S.isVideoTexture!==!0,wt=tt.__version===void 0||yt===!0,F=Z.dataReady;let bt=q(S,Ft);dt(i.TEXTURE_CUBE_MAP,S);let ht;if(Pt){at&&wt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,bt,lt,Ft.width,Ft.height);for(let mt=0;mt<6;mt++){ht=Rt[mt].mipmaps;for(let At=0;At<ht.length;At++){const Lt=ht[At];S.format!==qe?Y!==null?at?F&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+mt,At,0,0,Lt.width,Lt.height,Y,Lt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+mt,At,lt,Lt.width,Lt.height,0,Lt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):at?F&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+mt,At,0,0,Lt.width,Lt.height,Y,Q,Lt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+mt,At,lt,Lt.width,Lt.height,0,Y,Q,Lt.data)}}}else{if(ht=S.mipmaps,at&&wt){ht.length>0&&bt++;const mt=nt(Rt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,bt,lt,mt.width,mt.height)}for(let mt=0;mt<6;mt++)if(gt){at?F&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+mt,0,0,0,Rt[mt].width,Rt[mt].height,Y,Q,Rt[mt].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+mt,0,lt,Rt[mt].width,Rt[mt].height,0,Y,Q,Rt[mt].data);for(let At=0;At<ht.length;At++){const Ot=ht[At].image[mt].image;at?F&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+mt,At+1,0,0,Ot.width,Ot.height,Y,Q,Ot.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+mt,At+1,lt,Ot.width,Ot.height,0,Y,Q,Ot.data)}}else{at?F&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+mt,0,0,0,Y,Q,Rt[mt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+mt,0,lt,Y,Q,Rt[mt]);for(let At=0;At<ht.length;At++){const Lt=ht[At];at?F&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+mt,At+1,0,0,Y,Q,Lt.image[mt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+mt,At+1,lt,Y,Q,Lt.image[mt])}}}m(S)&&p(i.TEXTURE_CUBE_MAP),tt.__version=Z.version,S.onUpdate&&S.onUpdate(S)}E.__version=S.version}function it(E,S,et,yt,Z,tt){const St=r.convert(et.format,et.colorSpace),pt=r.convert(et.type),xt=M(et.internalFormat,St,pt,et.colorSpace),Pt=n.get(S),gt=n.get(et);if(gt.__renderTarget=S,!Pt.__hasExternalTextures){const Rt=Math.max(1,S.width>>tt),Ft=Math.max(1,S.height>>tt);Z===i.TEXTURE_3D||Z===i.TEXTURE_2D_ARRAY?e.texImage3D(Z,tt,xt,Rt,Ft,S.depth,0,St,pt,null):e.texImage2D(Z,tt,xt,Rt,Ft,0,St,pt,null)}e.bindFramebuffer(i.FRAMEBUFFER,E),$(S)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,yt,Z,gt.__webglTexture,0,K(S)):(Z===i.TEXTURE_2D||Z>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Z<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,yt,Z,gt.__webglTexture,tt),e.bindFramebuffer(i.FRAMEBUFFER,null)}function J(E,S,et){if(i.bindRenderbuffer(i.RENDERBUFFER,E),S.depthBuffer){const yt=S.depthTexture,Z=yt&&yt.isDepthTexture?yt.type:null,tt=x(S.stencilBuffer,Z),St=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,pt=K(S);$(S)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,pt,tt,S.width,S.height):et?i.renderbufferStorageMultisample(i.RENDERBUFFER,pt,tt,S.width,S.height):i.renderbufferStorage(i.RENDERBUFFER,tt,S.width,S.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,St,i.RENDERBUFFER,E)}else{const yt=S.textures;for(let Z=0;Z<yt.length;Z++){const tt=yt[Z],St=r.convert(tt.format,tt.colorSpace),pt=r.convert(tt.type),xt=M(tt.internalFormat,St,pt,tt.colorSpace),Pt=K(S);et&&$(S)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Pt,xt,S.width,S.height):$(S)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Pt,xt,S.width,S.height):i.renderbufferStorage(i.RENDERBUFFER,xt,S.width,S.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function ft(E,S){if(S&&S.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,E),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const yt=n.get(S.depthTexture);yt.__renderTarget=S,(!yt.__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),j(S.depthTexture,0);const Z=yt.__webglTexture,tt=K(S);if(S.depthTexture.format===Xi)$(S)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Z,0,tt):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Z,0);else if(S.depthTexture.format===Qi)$(S)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Z,0,tt):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Z,0);else throw new Error("Unknown depthTexture format")}function Ct(E){const S=n.get(E),et=E.isWebGLCubeRenderTarget===!0;if(S.__boundDepthTexture!==E.depthTexture){const yt=E.depthTexture;if(S.__depthDisposeCallback&&S.__depthDisposeCallback(),yt){const Z=()=>{delete S.__boundDepthTexture,delete S.__depthDisposeCallback,yt.removeEventListener("dispose",Z)};yt.addEventListener("dispose",Z),S.__depthDisposeCallback=Z}S.__boundDepthTexture=yt}if(E.depthTexture&&!S.__autoAllocateDepthBuffer){if(et)throw new Error("target.depthTexture not supported in Cube render targets");ft(S.__webglFramebuffer,E)}else if(et){S.__webglDepthbuffer=[];for(let yt=0;yt<6;yt++)if(e.bindFramebuffer(i.FRAMEBUFFER,S.__webglFramebuffer[yt]),S.__webglDepthbuffer[yt]===void 0)S.__webglDepthbuffer[yt]=i.createRenderbuffer(),J(S.__webglDepthbuffer[yt],E,!1);else{const Z=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,tt=S.__webglDepthbuffer[yt];i.bindRenderbuffer(i.RENDERBUFFER,tt),i.framebufferRenderbuffer(i.FRAMEBUFFER,Z,i.RENDERBUFFER,tt)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer===void 0)S.__webglDepthbuffer=i.createRenderbuffer(),J(S.__webglDepthbuffer,E,!1);else{const yt=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Z=S.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Z),i.framebufferRenderbuffer(i.FRAMEBUFFER,yt,i.RENDERBUFFER,Z)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function It(E,S,et){const yt=n.get(E);S!==void 0&&it(yt.__webglFramebuffer,E,E.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),et!==void 0&&Ct(E)}function Bt(E){const S=E.texture,et=n.get(E),yt=n.get(S);E.addEventListener("dispose",L);const Z=E.textures,tt=E.isWebGLCubeRenderTarget===!0,St=Z.length>1;if(St||(yt.__webglTexture===void 0&&(yt.__webglTexture=i.createTexture()),yt.__version=S.version,o.memory.textures++),tt){et.__webglFramebuffer=[];for(let pt=0;pt<6;pt++)if(S.mipmaps&&S.mipmaps.length>0){et.__webglFramebuffer[pt]=[];for(let xt=0;xt<S.mipmaps.length;xt++)et.__webglFramebuffer[pt][xt]=i.createFramebuffer()}else et.__webglFramebuffer[pt]=i.createFramebuffer()}else{if(S.mipmaps&&S.mipmaps.length>0){et.__webglFramebuffer=[];for(let pt=0;pt<S.mipmaps.length;pt++)et.__webglFramebuffer[pt]=i.createFramebuffer()}else et.__webglFramebuffer=i.createFramebuffer();if(St)for(let pt=0,xt=Z.length;pt<xt;pt++){const Pt=n.get(Z[pt]);Pt.__webglTexture===void 0&&(Pt.__webglTexture=i.createTexture(),o.memory.textures++)}if(E.samples>0&&$(E)===!1){et.__webglMultisampledFramebuffer=i.createFramebuffer(),et.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,et.__webglMultisampledFramebuffer);for(let pt=0;pt<Z.length;pt++){const xt=Z[pt];et.__webglColorRenderbuffer[pt]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,et.__webglColorRenderbuffer[pt]);const Pt=r.convert(xt.format,xt.colorSpace),gt=r.convert(xt.type),Rt=M(xt.internalFormat,Pt,gt,xt.colorSpace,E.isXRRenderTarget===!0),Ft=K(E);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ft,Rt,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+pt,i.RENDERBUFFER,et.__webglColorRenderbuffer[pt])}i.bindRenderbuffer(i.RENDERBUFFER,null),E.depthBuffer&&(et.__webglDepthRenderbuffer=i.createRenderbuffer(),J(et.__webglDepthRenderbuffer,E,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(tt){e.bindTexture(i.TEXTURE_CUBE_MAP,yt.__webglTexture),dt(i.TEXTURE_CUBE_MAP,S);for(let pt=0;pt<6;pt++)if(S.mipmaps&&S.mipmaps.length>0)for(let xt=0;xt<S.mipmaps.length;xt++)it(et.__webglFramebuffer[pt][xt],E,S,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,xt);else it(et.__webglFramebuffer[pt],E,S,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,0);m(S)&&p(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(St){for(let pt=0,xt=Z.length;pt<xt;pt++){const Pt=Z[pt],gt=n.get(Pt);e.bindTexture(i.TEXTURE_2D,gt.__webglTexture),dt(i.TEXTURE_2D,Pt),it(et.__webglFramebuffer,E,Pt,i.COLOR_ATTACHMENT0+pt,i.TEXTURE_2D,0),m(Pt)&&p(i.TEXTURE_2D)}e.unbindTexture()}else{let pt=i.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(pt=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(pt,yt.__webglTexture),dt(pt,S),S.mipmaps&&S.mipmaps.length>0)for(let xt=0;xt<S.mipmaps.length;xt++)it(et.__webglFramebuffer[xt],E,S,i.COLOR_ATTACHMENT0,pt,xt);else it(et.__webglFramebuffer,E,S,i.COLOR_ATTACHMENT0,pt,0);m(S)&&p(pt),e.unbindTexture()}E.depthBuffer&&Ct(E)}function Mt(E){const S=E.textures;for(let et=0,yt=S.length;et<yt;et++){const Z=S[et];if(m(Z)){const tt=y(E),St=n.get(Z).__webglTexture;e.bindTexture(tt,St),p(tt),e.unbindTexture()}}}const Et=[],U=[];function w(E){if(E.samples>0){if($(E)===!1){const S=E.textures,et=E.width,yt=E.height;let Z=i.COLOR_BUFFER_BIT;const tt=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,St=n.get(E),pt=S.length>1;if(pt)for(let xt=0;xt<S.length;xt++)e.bindFramebuffer(i.FRAMEBUFFER,St.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,St.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,St.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,St.__webglFramebuffer);for(let xt=0;xt<S.length;xt++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(Z|=i.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(Z|=i.STENCIL_BUFFER_BIT)),pt){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,St.__webglColorRenderbuffer[xt]);const Pt=n.get(S[xt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Pt,0)}i.blitFramebuffer(0,0,et,yt,0,0,et,yt,Z,i.NEAREST),l===!0&&(Et.length=0,U.length=0,Et.push(i.COLOR_ATTACHMENT0+xt),E.depthBuffer&&E.resolveDepthBuffer===!1&&(Et.push(tt),U.push(tt),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,U)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Et))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),pt)for(let xt=0;xt<S.length;xt++){e.bindFramebuffer(i.FRAMEBUFFER,St.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.RENDERBUFFER,St.__webglColorRenderbuffer[xt]);const Pt=n.get(S[xt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,St.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.TEXTURE_2D,Pt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,St.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.resolveDepthBuffer===!1&&l){const S=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[S])}}}function K(E){return Math.min(s.maxSamples,E.samples)}function $(E){const S=n.get(E);return E.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function D(E){const S=o.render.frame;u.get(E)!==S&&(u.set(E,S),E.update())}function ct(E,S){const et=E.colorSpace,yt=E.format,Z=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||et!==ns&&et!==fn&&(ae.getTransfer(et)===de?(yt!==qe||Z!==bn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",et)),S}function nt(E){return typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement?(c.width=E.naturalWidth||E.width,c.height=E.naturalHeight||E.height):typeof VideoFrame<"u"&&E instanceof VideoFrame?(c.width=E.displayWidth,c.height=E.displayHeight):(c.width=E.width,c.height=E.height),c}this.allocateTextureUnit=H,this.resetTextureUnits=V,this.setTexture2D=j,this.setTexture2DArray=C,this.setTexture3D=G,this.setTextureCube=z,this.rebindTextures=It,this.setupRenderTarget=Bt,this.updateRenderTargetMipmap=Mt,this.updateMultisampleRenderTarget=w,this.setupDepthRenderbuffer=Ct,this.setupFrameBufferTexture=it,this.useMultisampledRTT=$}function X0(i,t){function e(n,s=fn){let r;const o=ae.getTransfer(s);if(n===bn)return i.UNSIGNED_BYTE;if(n===Da)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ua)return i.UNSIGNED_SHORT_5_5_5_1;if(n===ru)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===iu)return i.BYTE;if(n===su)return i.SHORT;if(n===bs)return i.UNSIGNED_SHORT;if(n===La)return i.INT;if(n===_i)return i.UNSIGNED_INT;if(n===mn)return i.FLOAT;if(n===es)return i.HALF_FLOAT;if(n===ou)return i.ALPHA;if(n===au)return i.RGB;if(n===qe)return i.RGBA;if(n===lu)return i.LUMINANCE;if(n===cu)return i.LUMINANCE_ALPHA;if(n===Xi)return i.DEPTH_COMPONENT;if(n===Qi)return i.DEPTH_STENCIL;if(n===Na)return i.RED;if(n===Fa)return i.RED_INTEGER;if(n===uu)return i.RG;if(n===Oa)return i.RG_INTEGER;if(n===ka)return i.RGBA_INTEGER;if(n===gr||n===vr||n===_r||n===xr)if(o===de)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===gr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===vr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===_r)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===xr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===gr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===vr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===_r)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===xr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Xo||n===Yo||n===qo||n===Zo)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Xo)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Yo)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===qo)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Zo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ko||n===Jo||n===$o)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Ko||n===Jo)return o===de?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===$o)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===jo||n===Qo||n===ta||n===ea||n===na||n===ia||n===sa||n===ra||n===oa||n===aa||n===la||n===ca||n===ua||n===ha)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===jo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Qo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ta)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ea)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===na)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ia)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===sa)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ra)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===oa)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===aa)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===la)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===ca)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ua)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===ha)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Mr||n===fa||n===da)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===Mr)return o===de?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===fa)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===da)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===hu||n===pa||n===ma||n===ga)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===Mr)return r.COMPRESSED_RED_RGTC1_EXT;if(n===pa)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===ma)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===ga)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ji?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}class Y0 extends Qe{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class ge extends Jt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const q0={type:"move"};class vo{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ge,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ge,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ge,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(const v of t.hand.values()){const m=e.getJointPose(v,n),p=this._getHandJoint(c,v);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],d=u.position.distanceTo(h.position),f=.02,g=.005;c.inputState.pinching&&d>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(q0)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new ge;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const Z0=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,K0=`
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

}`;class J0{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const s=new ke,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Ee({vertexShader:Z0,fragmentShader:K0,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Yt(new Hn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class $0 extends is{constructor(t,e){super();const n=this;let s=null,r=1,o=null,a="local-floor",l=1,c=null,u=null,h=null,d=null,f=null,g=null;const v=new J0,m=e.getContextAttributes();let p=null,y=null;const M=[],x=[],q=new Tt;let R=null;const L=new Qe;L.viewport=new ce;const N=new Qe;N.viewport=new ce;const T=[L,N],_=new Y0;let P=null,V=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(X){let I=M[X];return I===void 0&&(I=new vo,M[X]=I),I.getTargetRaySpace()},this.getControllerGrip=function(X){let I=M[X];return I===void 0&&(I=new vo,M[X]=I),I.getGripSpace()},this.getHand=function(X){let I=M[X];return I===void 0&&(I=new vo,M[X]=I),I.getHandSpace()};function H(X){const I=x.indexOf(X.inputSource);if(I===-1)return;const it=M[I];it!==void 0&&(it.update(X.inputSource,X.frame,c||o),it.dispatchEvent({type:X.type,data:X.inputSource}))}function k(){s.removeEventListener("select",H),s.removeEventListener("selectstart",H),s.removeEventListener("selectend",H),s.removeEventListener("squeeze",H),s.removeEventListener("squeezestart",H),s.removeEventListener("squeezeend",H),s.removeEventListener("end",k),s.removeEventListener("inputsourceschange",j);for(let X=0;X<M.length;X++){const I=x[X];I!==null&&(x[X]=null,M[X].disconnect(I))}P=null,V=null,v.reset(),t.setRenderTarget(p),f=null,d=null,h=null,s=null,y=null,B.stop(),n.isPresenting=!1,t.setPixelRatio(R),t.setSize(q.width,q.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(X){r=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(X){a=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(X){c=X},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return h},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(X){if(s=X,s!==null){if(p=t.getRenderTarget(),s.addEventListener("select",H),s.addEventListener("selectstart",H),s.addEventListener("selectend",H),s.addEventListener("squeeze",H),s.addEventListener("squeezestart",H),s.addEventListener("squeezeend",H),s.addEventListener("end",k),s.addEventListener("inputsourceschange",j),m.xrCompatible!==!0&&await e.makeXRCompatible(),R=t.getPixelRatio(),t.getSize(q),s.renderState.layers===void 0){const I={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,e,I),s.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new ei(f.framebufferWidth,f.framebufferHeight,{format:qe,type:bn,colorSpace:t.outputColorSpace,stencilBuffer:m.stencil})}else{let I=null,it=null,J=null;m.depth&&(J=m.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,I=m.stencil?Qi:Xi,it=m.stencil?ji:_i);const ft={colorFormat:e.RGBA8,depthFormat:J,scaleFactor:r};h=new XRWebGLBinding(s,e),d=h.createProjectionLayer(ft),s.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),y=new ei(d.textureWidth,d.textureHeight,{format:qe,type:bn,depthTexture:new Eu(d.textureWidth,d.textureHeight,it,void 0,void 0,void 0,void 0,void 0,void 0,I),stencilBuffer:m.stencil,colorSpace:t.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),B.setContext(s),B.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function j(X){for(let I=0;I<X.removed.length;I++){const it=X.removed[I],J=x.indexOf(it);J>=0&&(x[J]=null,M[J].disconnect(it))}for(let I=0;I<X.added.length;I++){const it=X.added[I];let J=x.indexOf(it);if(J===-1){for(let Ct=0;Ct<M.length;Ct++)if(Ct>=x.length){x.push(it),J=Ct;break}else if(x[Ct]===null){x[Ct]=it,J=Ct;break}if(J===-1)break}const ft=M[J];ft&&ft.connect(it)}}const C=new O,G=new O;function z(X,I,it){C.setFromMatrixPosition(I.matrixWorld),G.setFromMatrixPosition(it.matrixWorld);const J=C.distanceTo(G),ft=I.projectionMatrix.elements,Ct=it.projectionMatrix.elements,It=ft[14]/(ft[10]-1),Bt=ft[14]/(ft[10]+1),Mt=(ft[9]+1)/ft[5],Et=(ft[9]-1)/ft[5],U=(ft[8]-1)/ft[0],w=(Ct[8]+1)/Ct[0],K=It*U,$=It*w,D=J/(-U+w),ct=D*-U;if(I.matrixWorld.decompose(X.position,X.quaternion,X.scale),X.translateX(ct),X.translateZ(D),X.matrixWorld.compose(X.position,X.quaternion,X.scale),X.matrixWorldInverse.copy(X.matrixWorld).invert(),ft[10]===-1)X.projectionMatrix.copy(I.projectionMatrix),X.projectionMatrixInverse.copy(I.projectionMatrixInverse);else{const nt=It+D,E=Bt+D,S=K-ct,et=$+(J-ct),yt=Mt*Bt/E*nt,Z=Et*Bt/E*nt;X.projectionMatrix.makePerspective(S,et,yt,Z,nt,E),X.projectionMatrixInverse.copy(X.projectionMatrix).invert()}}function b(X,I){I===null?X.matrixWorld.copy(X.matrix):X.matrixWorld.multiplyMatrices(I.matrixWorld,X.matrix),X.matrixWorldInverse.copy(X.matrixWorld).invert()}this.updateCamera=function(X){if(s===null)return;let I=X.near,it=X.far;v.texture!==null&&(v.depthNear>0&&(I=v.depthNear),v.depthFar>0&&(it=v.depthFar)),_.near=N.near=L.near=I,_.far=N.far=L.far=it,(P!==_.near||V!==_.far)&&(s.updateRenderState({depthNear:_.near,depthFar:_.far}),P=_.near,V=_.far),L.layers.mask=X.layers.mask|2,N.layers.mask=X.layers.mask|4,_.layers.mask=L.layers.mask|N.layers.mask;const J=X.parent,ft=_.cameras;b(_,J);for(let Ct=0;Ct<ft.length;Ct++)b(ft[Ct],J);ft.length===2?z(_,L,N):_.projectionMatrix.copy(L.projectionMatrix),W(X,_,J)};function W(X,I,it){it===null?X.matrix.copy(I.matrixWorld):(X.matrix.copy(it.matrixWorld),X.matrix.invert(),X.matrix.multiply(I.matrixWorld)),X.matrix.decompose(X.position,X.quaternion,X.scale),X.updateMatrixWorld(!0),X.projectionMatrix.copy(I.projectionMatrix),X.projectionMatrixInverse.copy(I.projectionMatrixInverse),X.isPerspectiveCamera&&(X.fov=va*2*Math.atan(1/X.projectionMatrix.elements[5]),X.zoom=1)}this.getCamera=function(){return _},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(X){l=X,d!==null&&(d.fixedFoveation=X),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=X)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(_)};let rt=null;function dt(X,I){if(u=I.getViewerPose(c||o),g=I,u!==null){const it=u.views;f!==null&&(t.setRenderTargetFramebuffer(y,f.framebuffer),t.setRenderTarget(y));let J=!1;it.length!==_.cameras.length&&(_.cameras.length=0,J=!0);for(let Ct=0;Ct<it.length;Ct++){const It=it[Ct];let Bt=null;if(f!==null)Bt=f.getViewport(It);else{const Et=h.getViewSubImage(d,It);Bt=Et.viewport,Ct===0&&(t.setRenderTargetTextures(y,Et.colorTexture,d.ignoreDepthValues?void 0:Et.depthStencilTexture),t.setRenderTarget(y))}let Mt=T[Ct];Mt===void 0&&(Mt=new Qe,Mt.layers.enable(Ct),Mt.viewport=new ce,T[Ct]=Mt),Mt.matrix.fromArray(It.transform.matrix),Mt.matrix.decompose(Mt.position,Mt.quaternion,Mt.scale),Mt.projectionMatrix.fromArray(It.projectionMatrix),Mt.projectionMatrixInverse.copy(Mt.projectionMatrix).invert(),Mt.viewport.set(Bt.x,Bt.y,Bt.width,Bt.height),Ct===0&&(_.matrix.copy(Mt.matrix),_.matrix.decompose(_.position,_.quaternion,_.scale)),J===!0&&_.cameras.push(Mt)}const ft=s.enabledFeatures;if(ft&&ft.includes("depth-sensing")){const Ct=h.getDepthInformation(it[0]);Ct&&Ct.isValid&&Ct.texture&&v.init(t,Ct,s.renderState)}}for(let it=0;it<M.length;it++){const J=x[it],ft=M[it];J!==null&&ft!==void 0&&ft.update(J,I,c||o)}rt&&rt(X,I),I.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:I}),g=null}const B=new bu;B.setAnimationLoop(dt),this.setAnimationLoop=function(X){rt=X},this.dispose=function(){}}}const ui=new En,j0=new Qt;function Q0(i,t){function e(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,yu(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,y,M,x){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),h(m,p)):p.isMeshPhongMaterial?(r(m,p),u(m,p)):p.isMeshStandardMaterial?(r(m,p),d(m,p),p.isMeshPhysicalMaterial&&f(m,p,x)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),v(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?l(m,p,y,M):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,e(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===He&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,e(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===He&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,e(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,e(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const y=t.get(p),M=y.envMap,x=y.envMapRotation;M&&(m.envMap.value=M,ui.copy(x),ui.x*=-1,ui.y*=-1,ui.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(ui.y*=-1,ui.z*=-1),m.envMapRotation.value.setFromMatrix4(j0.makeRotationFromEuler(ui)),m.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,y,M){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*y,m.scale.value=M*.5,p.map&&(m.map.value=p.map,e(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function u(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function h(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function d(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,y){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===He&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=y.texture,m.transmissionSamplerSize.value.set(y.width,y.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function v(m,p){const y=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(y.matrixWorld),m.nearDistance.value=y.shadow.camera.near,m.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function tg(i,t,e,n){let s={},r={},o=[];const a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(y,M){const x=M.program;n.uniformBlockBinding(y,x)}function c(y,M){let x=s[y.id];x===void 0&&(g(y),x=u(y),s[y.id]=x,y.addEventListener("dispose",m));const q=M.program;n.updateUBOMapping(y,q);const R=t.render.frame;r[y.id]!==R&&(d(y),r[y.id]=R)}function u(y){const M=h();y.__bindingPointIndex=M;const x=i.createBuffer(),q=y.__size,R=y.usage;return i.bindBuffer(i.UNIFORM_BUFFER,x),i.bufferData(i.UNIFORM_BUFFER,q,R),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,M,x),x}function h(){for(let y=0;y<a;y++)if(o.indexOf(y)===-1)return o.push(y),y;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(y){const M=s[y.id],x=y.uniforms,q=y.__cache;i.bindBuffer(i.UNIFORM_BUFFER,M);for(let R=0,L=x.length;R<L;R++){const N=Array.isArray(x[R])?x[R]:[x[R]];for(let T=0,_=N.length;T<_;T++){const P=N[T];if(f(P,R,T,q)===!0){const V=P.__offset,H=Array.isArray(P.value)?P.value:[P.value];let k=0;for(let j=0;j<H.length;j++){const C=H[j],G=v(C);typeof C=="number"||typeof C=="boolean"?(P.__data[0]=C,i.bufferSubData(i.UNIFORM_BUFFER,V+k,P.__data)):C.isMatrix3?(P.__data[0]=C.elements[0],P.__data[1]=C.elements[1],P.__data[2]=C.elements[2],P.__data[3]=0,P.__data[4]=C.elements[3],P.__data[5]=C.elements[4],P.__data[6]=C.elements[5],P.__data[7]=0,P.__data[8]=C.elements[6],P.__data[9]=C.elements[7],P.__data[10]=C.elements[8],P.__data[11]=0):(C.toArray(P.__data,k),k+=G.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,V,P.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(y,M,x,q){const R=y.value,L=M+"_"+x;if(q[L]===void 0)return typeof R=="number"||typeof R=="boolean"?q[L]=R:q[L]=R.clone(),!0;{const N=q[L];if(typeof R=="number"||typeof R=="boolean"){if(N!==R)return q[L]=R,!0}else if(N.equals(R)===!1)return N.copy(R),!0}return!1}function g(y){const M=y.uniforms;let x=0;const q=16;for(let L=0,N=M.length;L<N;L++){const T=Array.isArray(M[L])?M[L]:[M[L]];for(let _=0,P=T.length;_<P;_++){const V=T[_],H=Array.isArray(V.value)?V.value:[V.value];for(let k=0,j=H.length;k<j;k++){const C=H[k],G=v(C),z=x%q,b=z%G.boundary,W=z+b;x+=b,W!==0&&q-W<G.storage&&(x+=q-W),V.__data=new Float32Array(G.storage/Float32Array.BYTES_PER_ELEMENT),V.__offset=x,x+=G.storage}}}const R=x%q;return R>0&&(x+=q-R),y.__size=x,y.__cache={},this}function v(y){const M={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(M.boundary=4,M.storage=4):y.isVector2?(M.boundary=8,M.storage=8):y.isVector3||y.isColor?(M.boundary=16,M.storage=12):y.isVector4?(M.boundary=16,M.storage=16):y.isMatrix3?(M.boundary=48,M.storage=48):y.isMatrix4?(M.boundary=64,M.storage=64):y.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",y),M}function m(y){const M=y.target;M.removeEventListener("dispose",m);const x=o.indexOf(M.__bindingPointIndex);o.splice(x,1),i.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function p(){for(const y in s)i.deleteBuffer(s[y]);o=[],s={},r={}}return{bind:l,update:c,dispose:p}}class eg{constructor(t={}){const{canvas:e=Gh(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reverseDepthBuffer:d=!1}=t;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=o;const g=new Uint32Array(4),v=new Int32Array(4);let m=null,p=null;const y=[],M=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Ye,this.toneMapping=zn,this.toneMappingExposure=1;const x=this;let q=!1,R=0,L=0,N=null,T=-1,_=null;const P=new ce,V=new ce;let H=null;const k=new ut(0);let j=0,C=e.width,G=e.height,z=1,b=null,W=null;const rt=new ce(0,0,C,G),dt=new ce(0,0,C,G);let B=!1;const X=new za;let I=!1,it=!1;const J=new Qt,ft=new Qt,Ct=new O,It=new ce,Bt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Mt=!1;function Et(){return N===null?z:1}let U=n;function w(A,st){return e.getContext(A,st)}try{const A={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Pa}`),e.addEventListener("webglcontextlost",mt,!1),e.addEventListener("webglcontextrestored",At,!1),e.addEventListener("webglcontextcreationerror",Lt,!1),U===null){const st="webgl2";if(U=w(st,A),U===null)throw w(st)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(A){throw console.error("THREE.WebGLRenderer: "+A.message),A}let K,$,D,ct,nt,E,S,et,yt,Z,tt,St,pt,xt,Pt,gt,Rt,Ft,Y,Q,lt,at,wt,F;function bt(){K=new om(U),K.init(),at=new X0(U,K),$=new tm(U,K,t,at),D=new G0(U,K),$.reverseDepthBuffer&&d&&D.buffers.depth.setReversed(!0),ct=new cm(U),nt=new A0,E=new W0(U,K,D,nt,$,at,ct),S=new nm(x),et=new rm(x),yt=new gf(U),wt=new jp(U,yt),Z=new am(U,yt,ct,wt),tt=new hm(U,Z,yt,ct),Y=new um(U,$,E),gt=new em(nt),St=new T0(x,S,et,K,$,wt,gt),pt=new Q0(x,nt),xt=new R0,Pt=new N0(K),Ft=new $p(x,S,et,D,tt,f,l),Rt=new B0(x,tt,$),F=new tg(U,ct,$,D),Q=new Qp(U,K,ct),lt=new lm(U,K,ct),ct.programs=St.programs,x.capabilities=$,x.extensions=K,x.properties=nt,x.renderLists=xt,x.shadowMap=Rt,x.state=D,x.info=ct}bt();const ht=new $0(x,U);this.xr=ht,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){const A=K.get("WEBGL_lose_context");A&&A.loseContext()},this.forceContextRestore=function(){const A=K.get("WEBGL_lose_context");A&&A.restoreContext()},this.getPixelRatio=function(){return z},this.setPixelRatio=function(A){A!==void 0&&(z=A,this.setSize(C,G,!1))},this.getSize=function(A){return A.set(C,G)},this.setSize=function(A,st,vt=!0){if(ht.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}C=A,G=st,e.width=Math.floor(A*z),e.height=Math.floor(st*z),vt===!0&&(e.style.width=A+"px",e.style.height=st+"px"),this.setViewport(0,0,A,st)},this.getDrawingBufferSize=function(A){return A.set(C*z,G*z).floor()},this.setDrawingBufferSize=function(A,st,vt){C=A,G=st,z=vt,e.width=Math.floor(A*vt),e.height=Math.floor(st*vt),this.setViewport(0,0,A,st)},this.getCurrentViewport=function(A){return A.copy(P)},this.getViewport=function(A){return A.copy(rt)},this.setViewport=function(A,st,vt,_t){A.isVector4?rt.set(A.x,A.y,A.z,A.w):rt.set(A,st,vt,_t),D.viewport(P.copy(rt).multiplyScalar(z).round())},this.getScissor=function(A){return A.copy(dt)},this.setScissor=function(A,st,vt,_t){A.isVector4?dt.set(A.x,A.y,A.z,A.w):dt.set(A,st,vt,_t),D.scissor(V.copy(dt).multiplyScalar(z).round())},this.getScissorTest=function(){return B},this.setScissorTest=function(A){D.setScissorTest(B=A)},this.setOpaqueSort=function(A){b=A},this.setTransparentSort=function(A){W=A},this.getClearColor=function(A){return A.copy(Ft.getClearColor())},this.setClearColor=function(){Ft.setClearColor.apply(Ft,arguments)},this.getClearAlpha=function(){return Ft.getClearAlpha()},this.setClearAlpha=function(){Ft.setClearAlpha.apply(Ft,arguments)},this.clear=function(A=!0,st=!0,vt=!0){let _t=0;if(A){let ot=!1;if(N!==null){const Dt=N.texture.format;ot=Dt===ka||Dt===Oa||Dt===Fa}if(ot){const Dt=N.texture.type,kt=Dt===bn||Dt===_i||Dt===bs||Dt===ji||Dt===Da||Dt===Ua,Gt=Ft.getClearColor(),Vt=Ft.getClearAlpha(),Kt=Gt.r,$t=Gt.g,Wt=Gt.b;kt?(g[0]=Kt,g[1]=$t,g[2]=Wt,g[3]=Vt,U.clearBufferuiv(U.COLOR,0,g)):(v[0]=Kt,v[1]=$t,v[2]=Wt,v[3]=Vt,U.clearBufferiv(U.COLOR,0,v))}else _t|=U.COLOR_BUFFER_BIT}st&&(_t|=U.DEPTH_BUFFER_BIT),vt&&(_t|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),U.clear(_t)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",mt,!1),e.removeEventListener("webglcontextrestored",At,!1),e.removeEventListener("webglcontextcreationerror",Lt,!1),xt.dispose(),Pt.dispose(),nt.dispose(),S.dispose(),et.dispose(),tt.dispose(),wt.dispose(),F.dispose(),St.dispose(),ht.dispose(),ht.removeEventListener("sessionstart",Ce),ht.removeEventListener("sessionend",on),_n.stop()};function mt(A){A.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),q=!0}function At(){console.log("THREE.WebGLRenderer: Context Restored."),q=!1;const A=ct.autoReset,st=Rt.enabled,vt=Rt.autoUpdate,_t=Rt.needsUpdate,ot=Rt.type;bt(),ct.autoReset=A,Rt.enabled=st,Rt.autoUpdate=vt,Rt.needsUpdate=_t,Rt.type=ot}function Lt(A){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",A.statusMessage)}function Ot(A){const st=A.target;st.removeEventListener("dispose",Ot),ne(st)}function ne(A){fe(A),nt.remove(A)}function fe(A){const st=nt.get(A).programs;st!==void 0&&(st.forEach(function(vt){St.releaseProgram(vt)}),A.isShaderMaterial&&St.releaseShaderCache(A))}this.renderBufferDirect=function(A,st,vt,_t,ot,Dt){st===null&&(st=Bt);const kt=ot.isMesh&&ot.matrixWorld.determinant()<0,Gt=Ku(A,st,vt,_t,ot);D.setMaterial(_t,kt);let Vt=vt.index,Kt=1;if(_t.wireframe===!0){if(Vt=Z.getWireframeAttribute(vt),Vt===void 0)return;Kt=2}const $t=vt.drawRange,Wt=vt.attributes.position;let le=$t.start*Kt,me=($t.start+$t.count)*Kt;Dt!==null&&(le=Math.max(le,Dt.start*Kt),me=Math.min(me,(Dt.start+Dt.count)*Kt)),Vt!==null?(le=Math.max(le,0),me=Math.min(me,Vt.count)):Wt!=null&&(le=Math.max(le,0),me=Math.min(me,Wt.count));const _e=me-le;if(_e<0||_e===1/0)return;wt.setup(ot,_t,Gt,vt,Vt);let Ve,ue=Q;if(Vt!==null&&(Ve=yt.get(Vt),ue=lt,ue.setIndex(Ve)),ot.isMesh)_t.wireframe===!0?(D.setLineWidth(_t.wireframeLinewidth*Et()),ue.setMode(U.LINES)):ue.setMode(U.TRIANGLES);else if(ot.isLine){let Xt=_t.linewidth;Xt===void 0&&(Xt=1),D.setLineWidth(Xt*Et()),ot.isLineSegments?ue.setMode(U.LINES):ot.isLineLoop?ue.setMode(U.LINE_LOOP):ue.setMode(U.LINE_STRIP)}else ot.isPoints?ue.setMode(U.POINTS):ot.isSprite&&ue.setMode(U.TRIANGLES);if(ot.isBatchedMesh)if(ot._multiDrawInstances!==null)ue.renderMultiDrawInstances(ot._multiDrawStarts,ot._multiDrawCounts,ot._multiDrawCount,ot._multiDrawInstances);else if(K.get("WEBGL_multi_draw"))ue.renderMultiDraw(ot._multiDrawStarts,ot._multiDrawCounts,ot._multiDrawCount);else{const Xt=ot._multiDrawStarts,Cn=ot._multiDrawCounts,he=ot._multiDrawCount,an=Vt?yt.get(Vt).bytesPerElement:1,Si=nt.get(_t).currentProgram.getUniforms();for(let Ke=0;Ke<he;Ke++)Si.setValue(U,"_gl_DrawID",Ke),ue.render(Xt[Ke]/an,Cn[Ke])}else if(ot.isInstancedMesh)ue.renderInstances(le,_e,ot.count);else if(vt.isInstancedBufferGeometry){const Xt=vt._maxInstanceCount!==void 0?vt._maxInstanceCount:1/0,Cn=Math.min(vt.instanceCount,Xt);ue.renderInstances(le,_e,Cn)}else ue.render(le,_e)};function zt(A,st,vt){A.transparent===!0&&A.side===Ie&&A.forceSinglePass===!1?(A.side=He,A.needsUpdate=!0,Ns(A,st,vt),A.side=ti,A.needsUpdate=!0,Ns(A,st,vt),A.side=Ie):Ns(A,st,vt)}this.compile=function(A,st,vt=null){vt===null&&(vt=A),p=Pt.get(vt),p.init(st),M.push(p),vt.traverseVisible(function(ot){ot.isLight&&ot.layers.test(st.layers)&&(p.pushLight(ot),ot.castShadow&&p.pushShadow(ot))}),A!==vt&&A.traverseVisible(function(ot){ot.isLight&&ot.layers.test(st.layers)&&(p.pushLight(ot),ot.castShadow&&p.pushShadow(ot))}),p.setupLights();const _t=new Set;return A.traverse(function(ot){if(!(ot.isMesh||ot.isPoints||ot.isLine||ot.isSprite))return;const Dt=ot.material;if(Dt)if(Array.isArray(Dt))for(let kt=0;kt<Dt.length;kt++){const Gt=Dt[kt];zt(Gt,vt,ot),_t.add(Gt)}else zt(Dt,vt,ot),_t.add(Dt)}),M.pop(),p=null,_t},this.compileAsync=function(A,st,vt=null){const _t=this.compile(A,st,vt);return new Promise(ot=>{function Dt(){if(_t.forEach(function(kt){nt.get(kt).currentProgram.isReady()&&_t.delete(kt)}),_t.size===0){ot(A);return}setTimeout(Dt,10)}K.get("KHR_parallel_shader_compile")!==null?Dt():setTimeout(Dt,10)})};let ee=null;function ie(A){ee&&ee(A)}function Ce(){_n.stop()}function on(){_n.start()}const _n=new bu;_n.setAnimationLoop(ie),typeof self<"u"&&_n.setContext(self),this.setAnimationLoop=function(A){ee=A,ht.setAnimationLoop(A),A===null?_n.stop():_n.start()},ht.addEventListener("sessionstart",Ce),ht.addEventListener("sessionend",on),this.render=function(A,st){if(st!==void 0&&st.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(q===!0)return;if(A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),st.parent===null&&st.matrixWorldAutoUpdate===!0&&st.updateMatrixWorld(),ht.enabled===!0&&ht.isPresenting===!0&&(ht.cameraAutoUpdate===!0&&ht.updateCamera(st),st=ht.getCamera()),A.isScene===!0&&A.onBeforeRender(x,A,st,N),p=Pt.get(A,M.length),p.init(st),M.push(p),ft.multiplyMatrices(st.projectionMatrix,st.matrixWorldInverse),X.setFromProjectionMatrix(ft),it=this.localClippingEnabled,I=gt.init(this.clippingPlanes,it),m=xt.get(A,y.length),m.init(),y.push(m),ht.enabled===!0&&ht.isPresenting===!0){const Dt=x.xr.getDepthSensingMesh();Dt!==null&&si(Dt,st,-1/0,x.sortObjects)}si(A,st,0,x.sortObjects),m.finish(),x.sortObjects===!0&&m.sort(b,W),Mt=ht.enabled===!1||ht.isPresenting===!1||ht.hasDepthSensing()===!1,Mt&&Ft.addToRenderList(m,A),this.info.render.frame++,I===!0&&gt.beginShadows();const vt=p.state.shadowsArray;Rt.render(vt,A,st),I===!0&&gt.endShadows(),this.info.autoReset===!0&&this.info.reset();const _t=m.opaque,ot=m.transmissive;if(p.setupLights(),st.isArrayCamera){const Dt=st.cameras;if(ot.length>0)for(let kt=0,Gt=Dt.length;kt<Gt;kt++){const Vt=Dt[kt];rl(_t,ot,A,Vt)}Mt&&Ft.render(A);for(let kt=0,Gt=Dt.length;kt<Gt;kt++){const Vt=Dt[kt];rs(m,A,Vt,Vt.viewport)}}else ot.length>0&&rl(_t,ot,A,st),Mt&&Ft.render(A),rs(m,A,st);N!==null&&(E.updateMultisampleRenderTarget(N),E.updateRenderTargetMipmap(N)),A.isScene===!0&&A.onAfterRender(x,A,st),wt.resetDefaultState(),T=-1,_=null,M.pop(),M.length>0?(p=M[M.length-1],I===!0&&gt.setGlobalState(x.clippingPlanes,p.state.camera)):p=null,y.pop(),y.length>0?m=y[y.length-1]:m=null};function si(A,st,vt,_t){if(A.visible===!1)return;if(A.layers.test(st.layers)){if(A.isGroup)vt=A.renderOrder;else if(A.isLOD)A.autoUpdate===!0&&A.update(st);else if(A.isLight)p.pushLight(A),A.castShadow&&p.pushShadow(A);else if(A.isSprite){if(!A.frustumCulled||X.intersectsSprite(A)){_t&&It.setFromMatrixPosition(A.matrixWorld).applyMatrix4(ft);const kt=tt.update(A),Gt=A.material;Gt.visible&&m.push(A,kt,Gt,vt,It.z,null)}}else if((A.isMesh||A.isLine||A.isPoints)&&(!A.frustumCulled||X.intersectsObject(A))){const kt=tt.update(A),Gt=A.material;if(_t&&(A.boundingSphere!==void 0?(A.boundingSphere===null&&A.computeBoundingSphere(),It.copy(A.boundingSphere.center)):(kt.boundingSphere===null&&kt.computeBoundingSphere(),It.copy(kt.boundingSphere.center)),It.applyMatrix4(A.matrixWorld).applyMatrix4(ft)),Array.isArray(Gt)){const Vt=kt.groups;for(let Kt=0,$t=Vt.length;Kt<$t;Kt++){const Wt=Vt[Kt],le=Gt[Wt.materialIndex];le&&le.visible&&m.push(A,kt,le,vt,It.z,Wt)}}else Gt.visible&&m.push(A,kt,Gt,vt,It.z,null)}}const Dt=A.children;for(let kt=0,Gt=Dt.length;kt<Gt;kt++)si(Dt[kt],st,vt,_t)}function rs(A,st,vt,_t){const ot=A.opaque,Dt=A.transmissive,kt=A.transparent;p.setupLightsView(vt),I===!0&&gt.setGlobalState(x.clippingPlanes,vt),_t&&D.viewport(P.copy(_t)),ot.length>0&&Us(ot,st,vt),Dt.length>0&&Us(Dt,st,vt),kt.length>0&&Us(kt,st,vt),D.buffers.depth.setTest(!0),D.buffers.depth.setMask(!0),D.buffers.color.setMask(!0),D.setPolygonOffset(!1)}function rl(A,st,vt,_t){if((vt.isScene===!0?vt.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[_t.id]===void 0&&(p.state.transmissionRenderTarget[_t.id]=new ei(1,1,{generateMipmaps:!0,type:K.has("EXT_color_buffer_half_float")||K.has("EXT_color_buffer_float")?es:bn,minFilter:Sn,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ae.workingColorSpace}));const Dt=p.state.transmissionRenderTarget[_t.id],kt=_t.viewport||P;Dt.setSize(kt.z,kt.w);const Gt=x.getRenderTarget();x.setRenderTarget(Dt),x.getClearColor(k),j=x.getClearAlpha(),j<1&&x.setClearColor(16777215,.5),x.clear(),Mt&&Ft.render(vt);const Vt=x.toneMapping;x.toneMapping=zn;const Kt=_t.viewport;if(_t.viewport!==void 0&&(_t.viewport=void 0),p.setupLightsView(_t),I===!0&&gt.setGlobalState(x.clippingPlanes,_t),Us(A,vt,_t),E.updateMultisampleRenderTarget(Dt),E.updateRenderTargetMipmap(Dt),K.has("WEBGL_multisampled_render_to_texture")===!1){let $t=!1;for(let Wt=0,le=st.length;Wt<le;Wt++){const me=st[Wt],_e=me.object,Ve=me.geometry,ue=me.material,Xt=me.group;if(ue.side===Ie&&_e.layers.test(_t.layers)){const Cn=ue.side;ue.side=He,ue.needsUpdate=!0,ol(_e,vt,_t,Ve,ue,Xt),ue.side=Cn,ue.needsUpdate=!0,$t=!0}}$t===!0&&(E.updateMultisampleRenderTarget(Dt),E.updateRenderTargetMipmap(Dt))}x.setRenderTarget(Gt),x.setClearColor(k,j),Kt!==void 0&&(_t.viewport=Kt),x.toneMapping=Vt}function Us(A,st,vt){const _t=st.isScene===!0?st.overrideMaterial:null;for(let ot=0,Dt=A.length;ot<Dt;ot++){const kt=A[ot],Gt=kt.object,Vt=kt.geometry,Kt=_t===null?kt.material:_t,$t=kt.group;Gt.layers.test(vt.layers)&&ol(Gt,st,vt,Vt,Kt,$t)}}function ol(A,st,vt,_t,ot,Dt){A.onBeforeRender(x,st,vt,_t,ot,Dt),A.modelViewMatrix.multiplyMatrices(vt.matrixWorldInverse,A.matrixWorld),A.normalMatrix.getNormalMatrix(A.modelViewMatrix),ot.onBeforeRender(x,st,vt,_t,A,Dt),ot.transparent===!0&&ot.side===Ie&&ot.forceSinglePass===!1?(ot.side=He,ot.needsUpdate=!0,x.renderBufferDirect(vt,st,_t,ot,A,Dt),ot.side=ti,ot.needsUpdate=!0,x.renderBufferDirect(vt,st,_t,ot,A,Dt),ot.side=Ie):x.renderBufferDirect(vt,st,_t,ot,A,Dt),A.onAfterRender(x,st,vt,_t,ot,Dt)}function Ns(A,st,vt){st.isScene!==!0&&(st=Bt);const _t=nt.get(A),ot=p.state.lights,Dt=p.state.shadowsArray,kt=ot.state.version,Gt=St.getParameters(A,ot.state,Dt,st,vt),Vt=St.getProgramCacheKey(Gt);let Kt=_t.programs;_t.environment=A.isMeshStandardMaterial?st.environment:null,_t.fog=st.fog,_t.envMap=(A.isMeshStandardMaterial?et:S).get(A.envMap||_t.environment),_t.envMapRotation=_t.environment!==null&&A.envMap===null?st.environmentRotation:A.envMapRotation,Kt===void 0&&(A.addEventListener("dispose",Ot),Kt=new Map,_t.programs=Kt);let $t=Kt.get(Vt);if($t!==void 0){if(_t.currentProgram===$t&&_t.lightsStateVersion===kt)return ll(A,Gt),$t}else Gt.uniforms=St.getUniforms(A),A.onBeforeCompile(Gt,x),$t=St.acquireProgram(Gt,Vt),Kt.set(Vt,$t),_t.uniforms=Gt.uniforms;const Wt=_t.uniforms;return(!A.isShaderMaterial&&!A.isRawShaderMaterial||A.clipping===!0)&&(Wt.clippingPlanes=gt.uniform),ll(A,Gt),_t.needsLights=$u(A),_t.lightsStateVersion=kt,_t.needsLights&&(Wt.ambientLightColor.value=ot.state.ambient,Wt.lightProbe.value=ot.state.probe,Wt.directionalLights.value=ot.state.directional,Wt.directionalLightShadows.value=ot.state.directionalShadow,Wt.spotLights.value=ot.state.spot,Wt.spotLightShadows.value=ot.state.spotShadow,Wt.rectAreaLights.value=ot.state.rectArea,Wt.ltc_1.value=ot.state.rectAreaLTC1,Wt.ltc_2.value=ot.state.rectAreaLTC2,Wt.pointLights.value=ot.state.point,Wt.pointLightShadows.value=ot.state.pointShadow,Wt.hemisphereLights.value=ot.state.hemi,Wt.directionalShadowMap.value=ot.state.directionalShadowMap,Wt.directionalShadowMatrix.value=ot.state.directionalShadowMatrix,Wt.spotShadowMap.value=ot.state.spotShadowMap,Wt.spotLightMatrix.value=ot.state.spotLightMatrix,Wt.spotLightMap.value=ot.state.spotLightMap,Wt.pointShadowMap.value=ot.state.pointShadowMap,Wt.pointShadowMatrix.value=ot.state.pointShadowMatrix),_t.currentProgram=$t,_t.uniformsList=null,$t}function al(A){if(A.uniformsList===null){const st=A.currentProgram.getUniforms();A.uniformsList=yr.seqWithValue(st.seq,A.uniforms)}return A.uniformsList}function ll(A,st){const vt=nt.get(A);vt.outputColorSpace=st.outputColorSpace,vt.batching=st.batching,vt.batchingColor=st.batchingColor,vt.instancing=st.instancing,vt.instancingColor=st.instancingColor,vt.instancingMorph=st.instancingMorph,vt.skinning=st.skinning,vt.morphTargets=st.morphTargets,vt.morphNormals=st.morphNormals,vt.morphColors=st.morphColors,vt.morphTargetsCount=st.morphTargetsCount,vt.numClippingPlanes=st.numClippingPlanes,vt.numIntersection=st.numClipIntersection,vt.vertexAlphas=st.vertexAlphas,vt.vertexTangents=st.vertexTangents,vt.toneMapping=st.toneMapping}function Ku(A,st,vt,_t,ot){st.isScene!==!0&&(st=Bt),E.resetTextureUnits();const Dt=st.fog,kt=_t.isMeshStandardMaterial?st.environment:null,Gt=N===null?x.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:ns,Vt=(_t.isMeshStandardMaterial?et:S).get(_t.envMap||kt),Kt=_t.vertexColors===!0&&!!vt.attributes.color&&vt.attributes.color.itemSize===4,$t=!!vt.attributes.tangent&&(!!_t.normalMap||_t.anisotropy>0),Wt=!!vt.morphAttributes.position,le=!!vt.morphAttributes.normal,me=!!vt.morphAttributes.color;let _e=zn;_t.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(_e=x.toneMapping);const Ve=vt.morphAttributes.position||vt.morphAttributes.normal||vt.morphAttributes.color,ue=Ve!==void 0?Ve.length:0,Xt=nt.get(_t),Cn=p.state.lights;if(I===!0&&(it===!0||A!==_)){const en=A===_&&_t.id===T;gt.setState(_t,A,en)}let he=!1;_t.version===Xt.__version?(Xt.needsLights&&Xt.lightsStateVersion!==Cn.state.version||Xt.outputColorSpace!==Gt||ot.isBatchedMesh&&Xt.batching===!1||!ot.isBatchedMesh&&Xt.batching===!0||ot.isBatchedMesh&&Xt.batchingColor===!0&&ot.colorTexture===null||ot.isBatchedMesh&&Xt.batchingColor===!1&&ot.colorTexture!==null||ot.isInstancedMesh&&Xt.instancing===!1||!ot.isInstancedMesh&&Xt.instancing===!0||ot.isSkinnedMesh&&Xt.skinning===!1||!ot.isSkinnedMesh&&Xt.skinning===!0||ot.isInstancedMesh&&Xt.instancingColor===!0&&ot.instanceColor===null||ot.isInstancedMesh&&Xt.instancingColor===!1&&ot.instanceColor!==null||ot.isInstancedMesh&&Xt.instancingMorph===!0&&ot.morphTexture===null||ot.isInstancedMesh&&Xt.instancingMorph===!1&&ot.morphTexture!==null||Xt.envMap!==Vt||_t.fog===!0&&Xt.fog!==Dt||Xt.numClippingPlanes!==void 0&&(Xt.numClippingPlanes!==gt.numPlanes||Xt.numIntersection!==gt.numIntersection)||Xt.vertexAlphas!==Kt||Xt.vertexTangents!==$t||Xt.morphTargets!==Wt||Xt.morphNormals!==le||Xt.morphColors!==me||Xt.toneMapping!==_e||Xt.morphTargetsCount!==ue)&&(he=!0):(he=!0,Xt.__version=_t.version);let an=Xt.currentProgram;he===!0&&(an=Ns(_t,st,ot));let Si=!1,Ke=!1,os=!1;const xe=an.getUniforms(),xn=Xt.uniforms;if(D.useProgram(an.program)&&(Si=!0,Ke=!0,os=!0),_t.id!==T&&(T=_t.id,Ke=!0),Si||_!==A){D.buffers.depth.getReversed()?(J.copy(A.projectionMatrix),Wh(J),Xh(J),xe.setValue(U,"projectionMatrix",J)):xe.setValue(U,"projectionMatrix",A.projectionMatrix),xe.setValue(U,"viewMatrix",A.matrixWorldInverse);const Gn=xe.map.cameraPosition;Gn!==void 0&&Gn.setValue(U,Ct.setFromMatrixPosition(A.matrixWorld)),$.logarithmicDepthBuffer&&xe.setValue(U,"logDepthBufFC",2/(Math.log(A.far+1)/Math.LN2)),(_t.isMeshPhongMaterial||_t.isMeshToonMaterial||_t.isMeshLambertMaterial||_t.isMeshBasicMaterial||_t.isMeshStandardMaterial||_t.isShaderMaterial)&&xe.setValue(U,"isOrthographic",A.isOrthographicCamera===!0),_!==A&&(_=A,Ke=!0,os=!0)}if(ot.isSkinnedMesh){xe.setOptional(U,ot,"bindMatrix"),xe.setOptional(U,ot,"bindMatrixInverse");const en=ot.skeleton;en&&(en.boneTexture===null&&en.computeBoneTexture(),xe.setValue(U,"boneTexture",en.boneTexture,E))}ot.isBatchedMesh&&(xe.setOptional(U,ot,"batchingTexture"),xe.setValue(U,"batchingTexture",ot._matricesTexture,E),xe.setOptional(U,ot,"batchingIdTexture"),xe.setValue(U,"batchingIdTexture",ot._indirectTexture,E),xe.setOptional(U,ot,"batchingColorTexture"),ot._colorsTexture!==null&&xe.setValue(U,"batchingColorTexture",ot._colorsTexture,E));const as=vt.morphAttributes;if((as.position!==void 0||as.normal!==void 0||as.color!==void 0)&&Y.update(ot,vt,an),(Ke||Xt.receiveShadow!==ot.receiveShadow)&&(Xt.receiveShadow=ot.receiveShadow,xe.setValue(U,"receiveShadow",ot.receiveShadow)),_t.isMeshGouraudMaterial&&_t.envMap!==null&&(xn.envMap.value=Vt,xn.flipEnvMap.value=Vt.isCubeTexture&&Vt.isRenderTargetTexture===!1?-1:1),_t.isMeshStandardMaterial&&_t.envMap===null&&st.environment!==null&&(xn.envMapIntensity.value=st.environmentIntensity),Ke&&(xe.setValue(U,"toneMappingExposure",x.toneMappingExposure),Xt.needsLights&&Ju(xn,os),Dt&&_t.fog===!0&&pt.refreshFogUniforms(xn,Dt),pt.refreshMaterialUniforms(xn,_t,z,G,p.state.transmissionRenderTarget[A.id]),yr.upload(U,al(Xt),xn,E)),_t.isShaderMaterial&&_t.uniformsNeedUpdate===!0&&(yr.upload(U,al(Xt),xn,E),_t.uniformsNeedUpdate=!1),_t.isSpriteMaterial&&xe.setValue(U,"center",ot.center),xe.setValue(U,"modelViewMatrix",ot.modelViewMatrix),xe.setValue(U,"normalMatrix",ot.normalMatrix),xe.setValue(U,"modelMatrix",ot.matrixWorld),_t.isShaderMaterial||_t.isRawShaderMaterial){const en=_t.uniformsGroups;for(let Gn=0,Vn=en.length;Gn<Vn;Gn++){const cl=en[Gn];F.update(cl,an),F.bind(cl,an)}}return an}function Ju(A,st){A.ambientLightColor.needsUpdate=st,A.lightProbe.needsUpdate=st,A.directionalLights.needsUpdate=st,A.directionalLightShadows.needsUpdate=st,A.pointLights.needsUpdate=st,A.pointLightShadows.needsUpdate=st,A.spotLights.needsUpdate=st,A.spotLightShadows.needsUpdate=st,A.rectAreaLights.needsUpdate=st,A.hemisphereLights.needsUpdate=st}function $u(A){return A.isMeshLambertMaterial||A.isMeshToonMaterial||A.isMeshPhongMaterial||A.isMeshStandardMaterial||A.isShadowMaterial||A.isShaderMaterial&&A.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return L},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(A,st,vt){nt.get(A.texture).__webglTexture=st,nt.get(A.depthTexture).__webglTexture=vt;const _t=nt.get(A);_t.__hasExternalTextures=!0,_t.__autoAllocateDepthBuffer=vt===void 0,_t.__autoAllocateDepthBuffer||K.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),_t.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(A,st){const vt=nt.get(A);vt.__webglFramebuffer=st,vt.__useDefaultFramebuffer=st===void 0},this.setRenderTarget=function(A,st=0,vt=0){N=A,R=st,L=vt;let _t=!0,ot=null,Dt=!1,kt=!1;if(A){const Vt=nt.get(A);if(Vt.__useDefaultFramebuffer!==void 0)D.bindFramebuffer(U.FRAMEBUFFER,null),_t=!1;else if(Vt.__webglFramebuffer===void 0)E.setupRenderTarget(A);else if(Vt.__hasExternalTextures)E.rebindTextures(A,nt.get(A.texture).__webglTexture,nt.get(A.depthTexture).__webglTexture);else if(A.depthBuffer){const Wt=A.depthTexture;if(Vt.__boundDepthTexture!==Wt){if(Wt!==null&&nt.has(Wt)&&(A.width!==Wt.image.width||A.height!==Wt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");E.setupDepthRenderbuffer(A)}}const Kt=A.texture;(Kt.isData3DTexture||Kt.isDataArrayTexture||Kt.isCompressedArrayTexture)&&(kt=!0);const $t=nt.get(A).__webglFramebuffer;A.isWebGLCubeRenderTarget?(Array.isArray($t[st])?ot=$t[st][vt]:ot=$t[st],Dt=!0):A.samples>0&&E.useMultisampledRTT(A)===!1?ot=nt.get(A).__webglMultisampledFramebuffer:Array.isArray($t)?ot=$t[vt]:ot=$t,P.copy(A.viewport),V.copy(A.scissor),H=A.scissorTest}else P.copy(rt).multiplyScalar(z).floor(),V.copy(dt).multiplyScalar(z).floor(),H=B;if(D.bindFramebuffer(U.FRAMEBUFFER,ot)&&_t&&D.drawBuffers(A,ot),D.viewport(P),D.scissor(V),D.setScissorTest(H),Dt){const Vt=nt.get(A.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+st,Vt.__webglTexture,vt)}else if(kt){const Vt=nt.get(A.texture),Kt=st||0;U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,Vt.__webglTexture,vt||0,Kt)}T=-1},this.readRenderTargetPixels=function(A,st,vt,_t,ot,Dt,kt){if(!(A&&A.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Gt=nt.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&kt!==void 0&&(Gt=Gt[kt]),Gt){D.bindFramebuffer(U.FRAMEBUFFER,Gt);try{const Vt=A.texture,Kt=Vt.format,$t=Vt.type;if(!$.textureFormatReadable(Kt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!$.textureTypeReadable($t)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}st>=0&&st<=A.width-_t&&vt>=0&&vt<=A.height-ot&&U.readPixels(st,vt,_t,ot,at.convert(Kt),at.convert($t),Dt)}finally{const Vt=N!==null?nt.get(N).__webglFramebuffer:null;D.bindFramebuffer(U.FRAMEBUFFER,Vt)}}},this.readRenderTargetPixelsAsync=async function(A,st,vt,_t,ot,Dt,kt){if(!(A&&A.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Gt=nt.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&kt!==void 0&&(Gt=Gt[kt]),Gt){const Vt=A.texture,Kt=Vt.format,$t=Vt.type;if(!$.textureFormatReadable(Kt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!$.textureTypeReadable($t))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(st>=0&&st<=A.width-_t&&vt>=0&&vt<=A.height-ot){D.bindFramebuffer(U.FRAMEBUFFER,Gt);const Wt=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,Wt),U.bufferData(U.PIXEL_PACK_BUFFER,Dt.byteLength,U.STREAM_READ),U.readPixels(st,vt,_t,ot,at.convert(Kt),at.convert($t),0);const le=N!==null?nt.get(N).__webglFramebuffer:null;D.bindFramebuffer(U.FRAMEBUFFER,le);const me=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await Vh(U,me,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,Wt),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,Dt),U.deleteBuffer(Wt),U.deleteSync(me),Dt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(A,st=null,vt=0){A.isTexture!==!0&&(xs("WebGLRenderer: copyFramebufferToTexture function signature has changed."),st=arguments[0]||null,A=arguments[1]);const _t=Math.pow(2,-vt),ot=Math.floor(A.image.width*_t),Dt=Math.floor(A.image.height*_t),kt=st!==null?st.x:0,Gt=st!==null?st.y:0;E.setTexture2D(A,0),U.copyTexSubImage2D(U.TEXTURE_2D,vt,0,0,kt,Gt,ot,Dt),D.unbindTexture()},this.copyTextureToTexture=function(A,st,vt=null,_t=null,ot=0){A.isTexture!==!0&&(xs("WebGLRenderer: copyTextureToTexture function signature has changed."),_t=arguments[0]||null,A=arguments[1],st=arguments[2],ot=arguments[3]||0,vt=null);let Dt,kt,Gt,Vt,Kt,$t,Wt,le,me;const _e=A.isCompressedTexture?A.mipmaps[ot]:A.image;vt!==null?(Dt=vt.max.x-vt.min.x,kt=vt.max.y-vt.min.y,Gt=vt.isBox3?vt.max.z-vt.min.z:1,Vt=vt.min.x,Kt=vt.min.y,$t=vt.isBox3?vt.min.z:0):(Dt=_e.width,kt=_e.height,Gt=_e.depth||1,Vt=0,Kt=0,$t=0),_t!==null?(Wt=_t.x,le=_t.y,me=_t.z):(Wt=0,le=0,me=0);const Ve=at.convert(st.format),ue=at.convert(st.type);let Xt;st.isData3DTexture?(E.setTexture3D(st,0),Xt=U.TEXTURE_3D):st.isDataArrayTexture||st.isCompressedArrayTexture?(E.setTexture2DArray(st,0),Xt=U.TEXTURE_2D_ARRAY):(E.setTexture2D(st,0),Xt=U.TEXTURE_2D),U.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,st.flipY),U.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,st.premultiplyAlpha),U.pixelStorei(U.UNPACK_ALIGNMENT,st.unpackAlignment);const Cn=U.getParameter(U.UNPACK_ROW_LENGTH),he=U.getParameter(U.UNPACK_IMAGE_HEIGHT),an=U.getParameter(U.UNPACK_SKIP_PIXELS),Si=U.getParameter(U.UNPACK_SKIP_ROWS),Ke=U.getParameter(U.UNPACK_SKIP_IMAGES);U.pixelStorei(U.UNPACK_ROW_LENGTH,_e.width),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,_e.height),U.pixelStorei(U.UNPACK_SKIP_PIXELS,Vt),U.pixelStorei(U.UNPACK_SKIP_ROWS,Kt),U.pixelStorei(U.UNPACK_SKIP_IMAGES,$t);const os=A.isDataArrayTexture||A.isData3DTexture,xe=st.isDataArrayTexture||st.isData3DTexture;if(A.isRenderTargetTexture||A.isDepthTexture){const xn=nt.get(A),as=nt.get(st),en=nt.get(xn.__renderTarget),Gn=nt.get(as.__renderTarget);D.bindFramebuffer(U.READ_FRAMEBUFFER,en.__webglFramebuffer),D.bindFramebuffer(U.DRAW_FRAMEBUFFER,Gn.__webglFramebuffer);for(let Vn=0;Vn<Gt;Vn++)os&&U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,nt.get(A).__webglTexture,ot,$t+Vn),A.isDepthTexture?(xe&&U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,nt.get(st).__webglTexture,ot,me+Vn),U.blitFramebuffer(Vt,Kt,Dt,kt,Wt,le,Dt,kt,U.DEPTH_BUFFER_BIT,U.NEAREST)):xe?U.copyTexSubImage3D(Xt,ot,Wt,le,me+Vn,Vt,Kt,Dt,kt):U.copyTexSubImage2D(Xt,ot,Wt,le,me+Vn,Vt,Kt,Dt,kt);D.bindFramebuffer(U.READ_FRAMEBUFFER,null),D.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else xe?A.isDataTexture||A.isData3DTexture?U.texSubImage3D(Xt,ot,Wt,le,me,Dt,kt,Gt,Ve,ue,_e.data):st.isCompressedArrayTexture?U.compressedTexSubImage3D(Xt,ot,Wt,le,me,Dt,kt,Gt,Ve,_e.data):U.texSubImage3D(Xt,ot,Wt,le,me,Dt,kt,Gt,Ve,ue,_e):A.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,ot,Wt,le,Dt,kt,Ve,ue,_e.data):A.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,ot,Wt,le,_e.width,_e.height,Ve,_e.data):U.texSubImage2D(U.TEXTURE_2D,ot,Wt,le,Dt,kt,Ve,ue,_e);U.pixelStorei(U.UNPACK_ROW_LENGTH,Cn),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,he),U.pixelStorei(U.UNPACK_SKIP_PIXELS,an),U.pixelStorei(U.UNPACK_SKIP_ROWS,Si),U.pixelStorei(U.UNPACK_SKIP_IMAGES,Ke),ot===0&&st.generateMipmaps&&U.generateMipmap(Xt),D.unbindTexture()},this.copyTextureToTexture3D=function(A,st,vt=null,_t=null,ot=0){return A.isTexture!==!0&&(xs("WebGLRenderer: copyTextureToTexture3D function signature has changed."),vt=arguments[0]||null,_t=arguments[1]||null,A=arguments[2],st=arguments[3],ot=arguments[4]||0),xs('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(A,st,vt,_t,ot)},this.initRenderTarget=function(A){nt.get(A).__webglFramebuffer===void 0&&E.setupRenderTarget(A)},this.initTexture=function(A){A.isCubeTexture?E.setTextureCube(A,0):A.isData3DTexture?E.setTexture3D(A,0):A.isDataArrayTexture||A.isCompressedArrayTexture?E.setTexture2DArray(A,0):E.setTexture2D(A,0),D.unbindTexture()},this.resetState=function(){R=0,L=0,N=null,D.reset(),wt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return On}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorspace=ae._getDrawingBufferColorSpace(t),e.unpackColorSpace=ae._getUnpackColorSpace()}}class Ga{constructor(t,e=25e-5){this.isFogExp2=!0,this.name="",this.color=new ut(t),this.density=e}clone(){return new Ga(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class Va extends Jt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new En,this.environmentIntensity=1,this.environmentRotation=new En,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}const ac=new O,lc=new ce,cc=new ce,ng=new O,uc=new Qt,ir=new O,_o=new Tn,hc=new Qt,xo=new Dr;class fc extends Yt{constructor(t,e){super(t,e),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=dl,this.bindMatrix=new Qt,this.bindMatrixInverse=new Qt,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const t=this.geometry;this.boundingBox===null&&(this.boundingBox=new ni),this.boundingBox.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,ir),this.boundingBox.expandByPoint(ir)}computeBoundingSphere(){const t=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Tn),this.boundingSphere.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,ir),this.boundingSphere.expandByPoint(ir)}copy(t,e){return super.copy(t,e),this.bindMode=t.bindMode,this.bindMatrix.copy(t.bindMatrix),this.bindMatrixInverse.copy(t.bindMatrixInverse),this.skeleton=t.skeleton,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}raycast(t,e){const n=this.material,s=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),_o.copy(this.boundingSphere),_o.applyMatrix4(s),t.ray.intersectsSphere(_o)!==!1&&(hc.copy(s).invert(),xo.copy(t.ray).applyMatrix4(hc),!(this.boundingBox!==null&&xo.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(t,e,xo)))}getVertexPosition(t,e){return super.getVertexPosition(t,e),this.applyBoneTransform(t,e),e}bind(t,e){this.skeleton=t,e===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),e=this.matrixWorld),this.bindMatrix.copy(e),this.bindMatrixInverse.copy(e).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const t=new ce,e=this.geometry.attributes.skinWeight;for(let n=0,s=e.count;n<s;n++){t.fromBufferAttribute(e,n);const r=1/t.manhattanLength();r!==1/0?t.multiplyScalar(r):t.set(1,0,0,0),e.setXYZW(n,t.x,t.y,t.z,t.w)}}updateMatrixWorld(t){super.updateMatrixWorld(t),this.bindMode===dl?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Rh?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(t,e){const n=this.skeleton,s=this.geometry;lc.fromBufferAttribute(s.attributes.skinIndex,t),cc.fromBufferAttribute(s.attributes.skinWeight,t),ac.copy(e).applyMatrix4(this.bindMatrix),e.set(0,0,0);for(let r=0;r<4;r++){const o=cc.getComponent(r);if(o!==0){const a=lc.getComponent(r);uc.multiplyMatrices(n.bones[a].matrixWorld,n.boneInverses[a]),e.addScaledVector(ng.copy(ac).applyMatrix4(uc),o)}}return e.applyMatrix4(this.bindMatrixInverse)}}class ig extends Jt{constructor(){super(),this.isBone=!0,this.type="Bone"}}class Wa extends ke{constructor(t=null,e=1,n=1,s,r,o,a,l,c=tn,u=tn,h,d){super(null,o,a,l,c,u,s,r,h,d),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const dc=new Qt,sg=new Qt;class Xa{constructor(t=[],e=[]){this.uuid=Mi(),this.bones=t.slice(0),this.boneInverses=e,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const t=this.bones,e=this.boneInverses;if(this.boneMatrices=new Float32Array(t.length*16),e.length===0)this.calculateInverses();else if(t.length!==e.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,s=this.bones.length;n<s;n++)this.boneInverses.push(new Qt)}}calculateInverses(){this.boneInverses.length=0;for(let t=0,e=this.bones.length;t<e;t++){const n=new Qt;this.bones[t]&&n.copy(this.bones[t].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&n.matrixWorld.copy(this.boneInverses[t]).invert()}for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const t=this.bones,e=this.boneInverses,n=this.boneMatrices,s=this.boneTexture;for(let r=0,o=t.length;r<o;r++){const a=t[r]?t[r].matrixWorld:sg;dc.multiplyMatrices(a,e[r]),dc.toArray(n,r*16)}s!==null&&(s.needsUpdate=!0)}clone(){return new Xa(this.bones,this.boneInverses)}computeBoneTexture(){let t=Math.sqrt(this.bones.length*4);t=Math.ceil(t/4)*4,t=Math.max(t,4);const e=new Float32Array(t*t*4);e.set(this.boneMatrices);const n=new Wa(e,t,t,qe,mn);return n.needsUpdate=!0,this.boneMatrices=e,this.boneTexture=n,this}getBoneByName(t){for(let e=0,n=this.bones.length;e<n;e++){const s=this.bones[e];if(s.name===t)return s}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(t,e){this.uuid=t.uuid;for(let n=0,s=t.bones.length;n<s;n++){const r=t.bones[n];let o=e[r];o===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",r),o=new ig),this.bones.push(o),this.boneInverses.push(new Qt().fromArray(t.boneInverses[n]))}return this.init(),this}toJSON(){const t={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};t.uuid=this.uuid;const e=this.bones,n=this.boneInverses;for(let s=0,r=e.length;s<r;s++){const o=e[s];t.bones.push(o.uuid);const a=n[s];t.boneInverses.push(a.toArray())}return t}}class Ma extends Se{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const Oi=new Qt,pc=new Qt,sr=[],mc=new ni,rg=new Qt,ds=new Yt,ps=new Tn;class sn extends Yt{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Ma(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,rg)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new ni),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Oi),mc.copy(t.boundingBox).applyMatrix4(Oi),this.boundingBox.union(mc)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Tn),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Oi),ps.copy(t.boundingSphere).applyMatrix4(Oi),this.boundingSphere.union(ps)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=t*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(t,e){const n=this.matrixWorld,s=this.count;if(ds.geometry=this.geometry,ds.material=this.material,ds.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ps.copy(this.boundingSphere),ps.applyMatrix4(n),t.ray.intersectsSphere(ps)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Oi),pc.multiplyMatrices(n,Oi),ds.matrixWorld=pc,ds.raycast(t,sr);for(let o=0,a=sr.length;o<a;o++){const l=sr[o];l.instanceId=r,l.object=this,e.push(l)}sr.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new Ma(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new Wa(new Float32Array(s*this.count),s,this.count,Na,mn));const r=this.morphTexture.source.data.data;let o=0;for(let c=0;c<n.length;c++)o+=n[c];const a=this.geometry.morphTargetsRelative?1:1-o,l=s*t;r[l]=a,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class Pu extends yi{static get type(){return"LineBasicMaterial"}constructor(t){super(),this.isLineBasicMaterial=!0,this.color=new ut(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const Er=new O,Tr=new O,gc=new Qt,ms=new Dr,rr=new Tn,Mo=new O,vc=new O;class og extends Jt{constructor(t=new ye,e=new Pu){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)Er.fromBufferAttribute(e,s-1),Tr.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=Er.distanceTo(Tr);t.setAttribute("lineDistance",new Zt(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),rr.copy(n.boundingSphere),rr.applyMatrix4(s),rr.radius+=r,t.ray.intersectsSphere(rr)===!1)return;gc.copy(s).invert(),ms.copy(t.ray).applyMatrix4(gc);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,u=n.index,d=n.attributes.position;if(u!==null){const f=Math.max(0,o.start),g=Math.min(u.count,o.start+o.count);for(let v=f,m=g-1;v<m;v+=c){const p=u.getX(v),y=u.getX(v+1),M=or(this,t,ms,l,p,y);M&&e.push(M)}if(this.isLineLoop){const v=u.getX(g-1),m=u.getX(f),p=or(this,t,ms,l,v,m);p&&e.push(p)}}else{const f=Math.max(0,o.start),g=Math.min(d.count,o.start+o.count);for(let v=f,m=g-1;v<m;v+=c){const p=or(this,t,ms,l,v,v+1);p&&e.push(p)}if(this.isLineLoop){const v=or(this,t,ms,l,g-1,f);v&&e.push(v)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function or(i,t,e,n,s,r){const o=i.geometry.attributes.position;if(Er.fromBufferAttribute(o,s),Tr.fromBufferAttribute(o,r),e.distanceSqToSegment(Er,Tr,Mo,vc)>n)return;Mo.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(Mo);if(!(l<t.near||l>t.far))return{distance:l,point:vc.clone().applyMatrix4(i.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:i}}const _c=new O,xc=new O;class ag extends og{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let s=0,r=e.count;s<r;s+=2)_c.fromBufferAttribute(e,s),xc.fromBufferAttribute(e,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+_c.distanceTo(xc);t.setAttribute("lineDistance",new Zt(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class lg extends yi{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new ut(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const Mc=new Qt,ya=new Dr,ar=new Tn,lr=new O;class cg extends Jt{constructor(t=new ye,e=new lg){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ar.copy(n.boundingSphere),ar.applyMatrix4(s),ar.radius+=r,t.ray.intersectsSphere(ar)===!1)return;Mc.copy(s).invert(),ya.copy(t.ray).applyMatrix4(Mc);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,h=n.attributes.position;if(c!==null){const d=Math.max(0,o.start),f=Math.min(c.count,o.start+o.count);for(let g=d,v=f;g<v;g++){const m=c.getX(g);lr.fromBufferAttribute(h,m),yc(lr,m,l,s,t,e,this)}}else{const d=Math.max(0,o.start),f=Math.min(h.count,o.start+o.count);for(let g=d,v=f;g<v;g++)lr.fromBufferAttribute(h,g),yc(lr,g,l,s,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function yc(i,t,e,n,s,r,o){const a=ya.distanceSqToPoint(i);if(a<e){const l=new O;ya.closestPointToPoint(i,l),l.applyMatrix4(n);const c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}class Iu extends ke{constructor(t,e,n,s,r,o,a,l,c){super(t,e,n,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class An{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,s=this.getPoint(0),r=0;e.push(0);for(let o=1;o<=t;o++)n=this.getPoint(o/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const n=this.getLengths();let s=0;const r=n.length;let o;e?o=e:o=t*n[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=n[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===o)return s/(r-1);const u=n[s],d=n[s+1]-u,f=(o-u)/d;return(s+f)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);const o=this.getPoint(s),a=this.getPoint(r),l=e||(o.isVector2?new Tt:new O);return l.copy(a).sub(o).normalize(),l}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){const n=new O,s=[],r=[],o=[],a=new O,l=new Qt;for(let f=0;f<=t;f++){const g=f/t;s[f]=this.getTangentAt(g,new O)}r[0]=new O,o[0]=new O;let c=Number.MAX_VALUE;const u=Math.abs(s[0].x),h=Math.abs(s[0].y),d=Math.abs(s[0].z);u<=c&&(c=u,n.set(1,0,0)),h<=c&&(c=h,n.set(0,1,0)),d<=c&&n.set(0,0,1),a.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let f=1;f<=t;f++){if(r[f]=r[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(s[f-1],s[f]),a.length()>Number.EPSILON){a.normalize();const g=Math.acos(Pe(s[f-1].dot(s[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(a,g))}o[f].crossVectors(s[f],r[f])}if(e===!0){let f=Math.acos(Pe(r[0].dot(r[t]),-1,1));f/=t,s[0].dot(a.crossVectors(r[0],r[t]))>0&&(f=-f);for(let g=1;g<=t;g++)r[g].applyMatrix4(l.makeRotationAxis(s[g],f*g)),o[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class Ya extends An{constructor(t=0,e=0,n=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(t,e=new Tt){const n=e,s=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);const a=this.aStartAngle+t*r;let l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){const u=Math.cos(this.aRotation),h=Math.sin(this.aRotation),d=l-this.aX,f=c-this.aY;l=d*u-f*h+this.aX,c=d*h+f*u+this.aY}return n.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class ug extends Ya{constructor(t,e,n,s,r,o){super(t,e,n,n,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}}function qa(){let i=0,t=0,e=0,n=0;function s(r,o,a,l){i=r,t=a,e=-3*r+3*o-2*a-l,n=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,u,h){let d=(o-r)/c-(a-r)/(c+u)+(a-o)/u,f=(a-o)/u-(l-o)/(u+h)+(l-a)/h;d*=u,f*=u,s(o,a,d,f)},calc:function(r){const o=r*r,a=o*r;return i+t*r+e*o+n*a}}}const cr=new O,yo=new qa,So=new qa,wo=new qa;class Lu extends An{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new O){const n=e,s=this.points,r=s.length,o=(r-(this.closed?0:1))*t;let a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,u;this.closed||a>0?c=s[(a-1)%r]:(cr.subVectors(s[0],s[1]).add(s[0]),c=cr);const h=s[a%r],d=s[(a+1)%r];if(this.closed||a+2<r?u=s[(a+2)%r]:(cr.subVectors(s[r-1],s[r-2]).add(s[r-1]),u=cr),this.curveType==="centripetal"||this.curveType==="chordal"){const f=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(h),f),v=Math.pow(h.distanceToSquared(d),f),m=Math.pow(d.distanceToSquared(u),f);v<1e-4&&(v=1),g<1e-4&&(g=v),m<1e-4&&(m=v),yo.initNonuniformCatmullRom(c.x,h.x,d.x,u.x,g,v,m),So.initNonuniformCatmullRom(c.y,h.y,d.y,u.y,g,v,m),wo.initNonuniformCatmullRom(c.z,h.z,d.z,u.z,g,v,m)}else this.curveType==="catmullrom"&&(yo.initCatmullRom(c.x,h.x,d.x,u.x,this.tension),So.initCatmullRom(c.y,h.y,d.y,u.y,this.tension),wo.initCatmullRom(c.z,h.z,d.z,u.z,this.tension));return n.set(yo.calc(l),So.calc(l),wo.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new O().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function Sc(i,t,e,n,s){const r=(n-t)*.5,o=(s-e)*.5,a=i*i,l=i*a;return(2*e-2*n+r+o)*l+(-3*e+3*n-2*r-o)*a+r*i+e}function hg(i,t){const e=1-i;return e*e*t}function fg(i,t){return 2*(1-i)*i*t}function dg(i,t){return i*i*t}function Ss(i,t,e,n){return hg(i,t)+fg(i,e)+dg(i,n)}function pg(i,t){const e=1-i;return e*e*e*t}function mg(i,t){const e=1-i;return 3*e*e*i*t}function gg(i,t){return 3*(1-i)*i*i*t}function vg(i,t){return i*i*i*t}function ws(i,t,e,n,s){return pg(i,t)+mg(i,e)+gg(i,n)+vg(i,s)}class Du extends An{constructor(t=new Tt,e=new Tt,n=new Tt,s=new Tt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new Tt){const n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(ws(t,s.x,r.x,o.x,a.x),ws(t,s.y,r.y,o.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class _g extends An{constructor(t=new O,e=new O,n=new O,s=new O){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new O){const n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(ws(t,s.x,r.x,o.x,a.x),ws(t,s.y,r.y,o.y,a.y),ws(t,s.z,r.z,o.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Uu extends An{constructor(t=new Tt,e=new Tt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new Tt){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new Tt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class xg extends An{constructor(t=new O,e=new O){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new O){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new O){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Nu extends An{constructor(t=new Tt,e=new Tt,n=new Tt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new Tt){const n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(Ss(t,s.x,r.x,o.x),Ss(t,s.y,r.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Fu extends An{constructor(t=new O,e=new O,n=new O){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new O){const n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(Ss(t,s.x,r.x,o.x),Ss(t,s.y,r.y,o.y),Ss(t,s.z,r.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Ou extends An{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new Tt){const n=e,s=this.points,r=(s.length-1)*t,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],u=s[o>s.length-2?s.length-1:o+1],h=s[o>s.length-3?s.length-1:o+2];return n.set(Sc(a,l.x,c.x,u.x,h.x),Sc(a,l.y,c.y,u.y,h.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new Tt().fromArray(s))}return this}}var Ar=Object.freeze({__proto__:null,ArcCurve:ug,CatmullRomCurve3:Lu,CubicBezierCurve:Du,CubicBezierCurve3:_g,EllipseCurve:Ya,LineCurve:Uu,LineCurve3:xg,QuadraticBezierCurve:Nu,QuadraticBezierCurve3:Fu,SplineCurve:Ou});class Mg extends An{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Ar[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),s=this.getCurveLengths();let r=0;for(;r<s.length;){if(s[r]>=n){const o=s[r]-n,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,e)}r++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,s=this.curves.length;n<s;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let s=0,r=this.curves;s<r.length;s++){const o=r[s],a=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,l=o.getPoints(a);for(let c=0;c<l.length;c++){const u=l[c];n&&n.equals(u)||(e.push(u),n=u)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(new Ar[s.type]().fromJSON(s))}return this}}class Sa extends Mg{constructor(t){super(),this.type="Path",this.currentPoint=new Tt,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new Uu(this.currentPoint.clone(),new Tt(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,s){const r=new Nu(this.currentPoint.clone(),new Tt(t,e),new Tt(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(t,e,n,s,r,o){const a=new Du(this.currentPoint.clone(),new Tt(t,e),new Tt(n,s),new Tt(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new Ou(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,s,r,o){const a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+a,e+l,n,s,r,o),this}absarc(t,e,n,s,r,o){return this.absellipse(t,e,n,n,s,r,o),this}ellipse(t,e,n,s,r,o,a,l){const c=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(t+c,e+u,n,s,r,o,a,l),this}absellipse(t,e,n,s,r,o,a,l){const c=new Ya(t,e,n,s,r,o,a,l);if(this.curves.length>0){const h=c.getPoint(0);h.equals(this.currentPoint)||this.lineTo(h.x,h.y)}this.curves.push(c);const u=c.getPoint(1);return this.currentPoint.copy(u),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class Es extends ye{constructor(t=[new Tt(0,-.5),new Tt(.5,0),new Tt(0,.5)],e=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:s},e=Math.floor(e),s=Pe(s,0,Math.PI*2);const r=[],o=[],a=[],l=[],c=[],u=1/e,h=new O,d=new Tt,f=new O,g=new O,v=new O;let m=0,p=0;for(let y=0;y<=t.length-1;y++)switch(y){case 0:m=t[y+1].x-t[y].x,p=t[y+1].y-t[y].y,f.x=p*1,f.y=-m,f.z=p*0,v.copy(f),f.normalize(),l.push(f.x,f.y,f.z);break;case t.length-1:l.push(v.x,v.y,v.z);break;default:m=t[y+1].x-t[y].x,p=t[y+1].y-t[y].y,f.x=p*1,f.y=-m,f.z=p*0,g.copy(f),f.x+=v.x,f.y+=v.y,f.z+=v.z,f.normalize(),l.push(f.x,f.y,f.z),v.copy(g)}for(let y=0;y<=e;y++){const M=n+y*u*s,x=Math.sin(M),q=Math.cos(M);for(let R=0;R<=t.length-1;R++){h.x=t[R].x*x,h.y=t[R].y,h.z=t[R].x*q,o.push(h.x,h.y,h.z),d.x=y/e,d.y=R/(t.length-1),a.push(d.x,d.y);const L=l[3*R+0]*x,N=l[3*R+1],T=l[3*R+0]*q;c.push(L,N,T)}}for(let y=0;y<e;y++)for(let M=0;M<t.length-1;M++){const x=M+y*t.length,q=x,R=x+t.length,L=x+t.length+1,N=x+1;r.push(q,R,N),r.push(L,N,R)}this.setIndex(r),this.setAttribute("position",new Zt(o,3)),this.setAttribute("uv",new Zt(a,2)),this.setAttribute("normal",new Zt(c,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Es(t.points,t.segments,t.phiStart,t.phiLength)}}class pn extends Es{constructor(t=1,e=1,n=4,s=8){const r=new Sa;r.absarc(0,-e/2,t,Math.PI*1.5,0),r.absarc(0,e/2,t,0,Math.PI*.5),super(r.getPoints(n),s),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:n,radialSegments:s}}static fromJSON(t){return new pn(t.radius,t.length,t.capSegments,t.radialSegments)}}class Nr extends ye{constructor(t=1,e=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:s},e=Math.max(3,e);const r=[],o=[],a=[],l=[],c=new O,u=new Tt;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let h=0,d=3;h<=e;h++,d+=3){const f=n+h/e*s;c.x=t*Math.cos(f),c.y=t*Math.sin(f),o.push(c.x,c.y,c.z),a.push(0,0,1),u.x=(o[d]/t+1)/2,u.y=(o[d+1]/t+1)/2,l.push(u.x,u.y)}for(let h=1;h<=e;h++)r.push(h,h+1,0);this.setIndex(r),this.setAttribute("position",new Zt(o,3)),this.setAttribute("normal",new Zt(a,3)),this.setAttribute("uv",new Zt(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Nr(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class be extends ye{constructor(t=1,e=1,n=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};const c=this;s=Math.floor(s),r=Math.floor(r);const u=[],h=[],d=[],f=[];let g=0;const v=[],m=n/2;let p=0;y(),o===!1&&(t>0&&M(!0),e>0&&M(!1)),this.setIndex(u),this.setAttribute("position",new Zt(h,3)),this.setAttribute("normal",new Zt(d,3)),this.setAttribute("uv",new Zt(f,2));function y(){const x=new O,q=new O;let R=0;const L=(e-t)/n;for(let N=0;N<=r;N++){const T=[],_=N/r,P=_*(e-t)+t;for(let V=0;V<=s;V++){const H=V/s,k=H*l+a,j=Math.sin(k),C=Math.cos(k);q.x=P*j,q.y=-_*n+m,q.z=P*C,h.push(q.x,q.y,q.z),x.set(j,L,C).normalize(),d.push(x.x,x.y,x.z),f.push(H,1-_),T.push(g++)}v.push(T)}for(let N=0;N<s;N++)for(let T=0;T<r;T++){const _=v[T][N],P=v[T+1][N],V=v[T+1][N+1],H=v[T][N+1];(t>0||T!==0)&&(u.push(_,P,H),R+=3),(e>0||T!==r-1)&&(u.push(P,V,H),R+=3)}c.addGroup(p,R,0),p+=R}function M(x){const q=g,R=new Tt,L=new O;let N=0;const T=x===!0?t:e,_=x===!0?1:-1;for(let V=1;V<=s;V++)h.push(0,m*_,0),d.push(0,_,0),f.push(.5,.5),g++;const P=g;for(let V=0;V<=s;V++){const k=V/s*l+a,j=Math.cos(k),C=Math.sin(k);L.x=T*C,L.y=m*_,L.z=T*j,h.push(L.x,L.y,L.z),d.push(0,_,0),R.x=j*.5+.5,R.y=C*.5*_+.5,f.push(R.x,R.y),g++}for(let V=0;V<s;V++){const H=q+V,k=P+V;x===!0?u.push(k,k+1,H):u.push(k+1,k,H),N+=3}c.addGroup(p,N,x===!0?1:2),p+=N}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new be(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Fr extends be{constructor(t=1,e=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,t,e,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(t){return new Fr(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Or extends ye{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};const r=[],o=[];a(s),c(n),u(),this.setAttribute("position",new Zt(r,3)),this.setAttribute("normal",new Zt(r.slice(),3)),this.setAttribute("uv",new Zt(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(y){const M=new O,x=new O,q=new O;for(let R=0;R<e.length;R+=3)f(e[R+0],M),f(e[R+1],x),f(e[R+2],q),l(M,x,q,y)}function l(y,M,x,q){const R=q+1,L=[];for(let N=0;N<=R;N++){L[N]=[];const T=y.clone().lerp(x,N/R),_=M.clone().lerp(x,N/R),P=R-N;for(let V=0;V<=P;V++)V===0&&N===R?L[N][V]=T:L[N][V]=T.clone().lerp(_,V/P)}for(let N=0;N<R;N++)for(let T=0;T<2*(R-N)-1;T++){const _=Math.floor(T/2);T%2===0?(d(L[N][_+1]),d(L[N+1][_]),d(L[N][_])):(d(L[N][_+1]),d(L[N+1][_+1]),d(L[N+1][_]))}}function c(y){const M=new O;for(let x=0;x<r.length;x+=3)M.x=r[x+0],M.y=r[x+1],M.z=r[x+2],M.normalize().multiplyScalar(y),r[x+0]=M.x,r[x+1]=M.y,r[x+2]=M.z}function u(){const y=new O;for(let M=0;M<r.length;M+=3){y.x=r[M+0],y.y=r[M+1],y.z=r[M+2];const x=m(y)/2/Math.PI+.5,q=p(y)/Math.PI+.5;o.push(x,1-q)}g(),h()}function h(){for(let y=0;y<o.length;y+=6){const M=o[y+0],x=o[y+2],q=o[y+4],R=Math.max(M,x,q),L=Math.min(M,x,q);R>.9&&L<.1&&(M<.2&&(o[y+0]+=1),x<.2&&(o[y+2]+=1),q<.2&&(o[y+4]+=1))}}function d(y){r.push(y.x,y.y,y.z)}function f(y,M){const x=y*3;M.x=t[x+0],M.y=t[x+1],M.z=t[x+2]}function g(){const y=new O,M=new O,x=new O,q=new O,R=new Tt,L=new Tt,N=new Tt;for(let T=0,_=0;T<r.length;T+=9,_+=6){y.set(r[T+0],r[T+1],r[T+2]),M.set(r[T+3],r[T+4],r[T+5]),x.set(r[T+6],r[T+7],r[T+8]),R.set(o[_+0],o[_+1]),L.set(o[_+2],o[_+3]),N.set(o[_+4],o[_+5]),q.copy(y).add(M).add(x).divideScalar(3);const P=m(q);v(R,_+0,y,P),v(L,_+2,M,P),v(N,_+4,x,P)}}function v(y,M,x,q){q<0&&y.x===1&&(o[M]=y.x-1),x.x===0&&x.z===0&&(o[M]=q/2/Math.PI+.5)}function m(y){return Math.atan2(y.z,-y.x)}function p(y){return Math.atan2(-y.y,Math.sqrt(y.x*y.x+y.z*y.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Or(t.vertices,t.indices,t.radius,t.details)}}class Za extends Sa{constructor(t){super(t),this.uuid=Mi(),this.type="Shape",this.holes=[]}getPointsHoles(t){const e=[];for(let n=0,s=this.holes.length;n<s;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){const s=this.holes[e];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(new Sa().fromJSON(s))}return this}}const yg={triangulate:function(i,t,e=2){const n=t&&t.length,s=n?t[0]*e:i.length;let r=ku(i,0,s,e,!0);const o=[];if(!r||r.next===r.prev)return o;let a,l,c,u,h,d,f;if(n&&(r=Tg(i,t,r,e)),i.length>80*e){a=c=i[0],l=u=i[1];for(let g=e;g<s;g+=e)h=i[g],d=i[g+1],h<a&&(a=h),d<l&&(l=d),h>c&&(c=h),d>u&&(u=d);f=Math.max(c-a,u-l),f=f!==0?32767/f:0}return Ts(r,o,e,a,l,f,0),o}};function ku(i,t,e,n,s){let r,o;if(s===Og(i,t,e,n)>0)for(r=t;r<e;r+=n)o=wc(r,i[r],i[r+1],o);else for(r=e-n;r>=t;r-=n)o=wc(r,i[r],i[r+1],o);return o&&kr(o,o.next)&&(Cs(o),o=o.next),o}function xi(i,t){if(!i)return i;t||(t=i);let e=i,n;do if(n=!1,!e.steiner&&(kr(e,e.next)||Me(e.prev,e,e.next)===0)){if(Cs(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function Ts(i,t,e,n,s,r,o){if(!i)return;!o&&r&&Ig(i,n,s,r);let a=i,l,c;for(;i.prev!==i.next;){if(l=i.prev,c=i.next,r?wg(i,n,s,r):Sg(i)){t.push(l.i/e|0),t.push(i.i/e|0),t.push(c.i/e|0),Cs(i),i=c.next,a=c.next;continue}if(i=c,i===a){o?o===1?(i=bg(xi(i),t,e),Ts(i,t,e,n,s,r,2)):o===2&&Eg(i,t,e,n,s,r):Ts(xi(i),t,e,n,s,r,1);break}}}function Sg(i){const t=i.prev,e=i,n=i.next;if(Me(t,e,n)>=0)return!1;const s=t.x,r=e.x,o=n.x,a=t.y,l=e.y,c=n.y,u=s<r?s<o?s:o:r<o?r:o,h=a<l?a<c?a:c:l<c?l:c,d=s>r?s>o?s:o:r>o?r:o,f=a>l?a>c?a:c:l>c?l:c;let g=n.next;for(;g!==t;){if(g.x>=u&&g.x<=d&&g.y>=h&&g.y<=f&&Vi(s,a,r,l,o,c,g.x,g.y)&&Me(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function wg(i,t,e,n){const s=i.prev,r=i,o=i.next;if(Me(s,r,o)>=0)return!1;const a=s.x,l=r.x,c=o.x,u=s.y,h=r.y,d=o.y,f=a<l?a<c?a:c:l<c?l:c,g=u<h?u<d?u:d:h<d?h:d,v=a>l?a>c?a:c:l>c?l:c,m=u>h?u>d?u:d:h>d?h:d,p=wa(f,g,t,e,n),y=wa(v,m,t,e,n);let M=i.prevZ,x=i.nextZ;for(;M&&M.z>=p&&x&&x.z<=y;){if(M.x>=f&&M.x<=v&&M.y>=g&&M.y<=m&&M!==s&&M!==o&&Vi(a,u,l,h,c,d,M.x,M.y)&&Me(M.prev,M,M.next)>=0||(M=M.prevZ,x.x>=f&&x.x<=v&&x.y>=g&&x.y<=m&&x!==s&&x!==o&&Vi(a,u,l,h,c,d,x.x,x.y)&&Me(x.prev,x,x.next)>=0))return!1;x=x.nextZ}for(;M&&M.z>=p;){if(M.x>=f&&M.x<=v&&M.y>=g&&M.y<=m&&M!==s&&M!==o&&Vi(a,u,l,h,c,d,M.x,M.y)&&Me(M.prev,M,M.next)>=0)return!1;M=M.prevZ}for(;x&&x.z<=y;){if(x.x>=f&&x.x<=v&&x.y>=g&&x.y<=m&&x!==s&&x!==o&&Vi(a,u,l,h,c,d,x.x,x.y)&&Me(x.prev,x,x.next)>=0)return!1;x=x.nextZ}return!0}function bg(i,t,e){let n=i;do{const s=n.prev,r=n.next.next;!kr(s,r)&&zu(s,n,n.next,r)&&As(s,r)&&As(r,s)&&(t.push(s.i/e|0),t.push(n.i/e|0),t.push(r.i/e|0),Cs(n),Cs(n.next),n=i=r),n=n.next}while(n!==i);return xi(n)}function Eg(i,t,e,n,s,r){let o=i;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&Ug(o,a)){let l=Bu(o,a);o=xi(o,o.next),l=xi(l,l.next),Ts(o,t,e,n,s,r,0),Ts(l,t,e,n,s,r,0);return}a=a.next}o=o.next}while(o!==i)}function Tg(i,t,e,n){const s=[];let r,o,a,l,c;for(r=0,o=t.length;r<o;r++)a=t[r]*n,l=r<o-1?t[r+1]*n:i.length,c=ku(i,a,l,n,!1),c===c.next&&(c.steiner=!0),s.push(Dg(c));for(s.sort(Ag),r=0;r<s.length;r++)e=Cg(s[r],e);return e}function Ag(i,t){return i.x-t.x}function Cg(i,t){const e=Rg(i,t);if(!e)return t;const n=Bu(e,i);return xi(n,n.next),xi(e,e.next)}function Rg(i,t){let e=t,n=-1/0,s;const r=i.x,o=i.y;do{if(o<=e.y&&o>=e.next.y&&e.next.y!==e.y){const d=e.x+(o-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(d<=r&&d>n&&(n=d,s=e.x<e.next.x?e:e.next,d===r))return s}e=e.next}while(e!==t);if(!s)return null;const a=s,l=s.x,c=s.y;let u=1/0,h;e=s;do r>=e.x&&e.x>=l&&r!==e.x&&Vi(o<c?r:n,o,l,c,o<c?n:r,o,e.x,e.y)&&(h=Math.abs(o-e.y)/(r-e.x),As(e,i)&&(h<u||h===u&&(e.x>s.x||e.x===s.x&&Pg(s,e)))&&(s=e,u=h)),e=e.next;while(e!==a);return s}function Pg(i,t){return Me(i.prev,i,t.prev)<0&&Me(t.next,i,i.next)<0}function Ig(i,t,e,n){let s=i;do s.z===0&&(s.z=wa(s.x,s.y,t,e,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,Lg(s)}function Lg(i){let t,e,n,s,r,o,a,l,c=1;do{for(e=i,i=null,r=null,o=0;e;){for(o++,n=e,a=0,t=0;t<c&&(a++,n=n.nextZ,!!n);t++);for(l=c;a>0||l>0&&n;)a!==0&&(l===0||!n||e.z<=n.z)?(s=e,e=e.nextZ,a--):(s=n,n=n.nextZ,l--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;e=n}r.nextZ=null,c*=2}while(o>1);return i}function wa(i,t,e,n,s){return i=(i-e)*s|0,t=(t-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,i|t<<1}function Dg(i){let t=i,e=i;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==i);return e}function Vi(i,t,e,n,s,r,o,a){return(s-o)*(t-a)>=(i-o)*(r-a)&&(i-o)*(n-a)>=(e-o)*(t-a)&&(e-o)*(r-a)>=(s-o)*(n-a)}function Ug(i,t){return i.next.i!==t.i&&i.prev.i!==t.i&&!Ng(i,t)&&(As(i,t)&&As(t,i)&&Fg(i,t)&&(Me(i.prev,i,t.prev)||Me(i,t.prev,t))||kr(i,t)&&Me(i.prev,i,i.next)>0&&Me(t.prev,t,t.next)>0)}function Me(i,t,e){return(t.y-i.y)*(e.x-t.x)-(t.x-i.x)*(e.y-t.y)}function kr(i,t){return i.x===t.x&&i.y===t.y}function zu(i,t,e,n){const s=hr(Me(i,t,e)),r=hr(Me(i,t,n)),o=hr(Me(e,n,i)),a=hr(Me(e,n,t));return!!(s!==r&&o!==a||s===0&&ur(i,e,t)||r===0&&ur(i,n,t)||o===0&&ur(e,i,n)||a===0&&ur(e,t,n))}function ur(i,t,e){return t.x<=Math.max(i.x,e.x)&&t.x>=Math.min(i.x,e.x)&&t.y<=Math.max(i.y,e.y)&&t.y>=Math.min(i.y,e.y)}function hr(i){return i>0?1:i<0?-1:0}function Ng(i,t){let e=i;do{if(e.i!==i.i&&e.next.i!==i.i&&e.i!==t.i&&e.next.i!==t.i&&zu(e,e.next,i,t))return!0;e=e.next}while(e!==i);return!1}function As(i,t){return Me(i.prev,i,i.next)<0?Me(i,t,i.next)>=0&&Me(i,i.prev,t)>=0:Me(i,t,i.prev)<0||Me(i,i.next,t)<0}function Fg(i,t){let e=i,n=!1;const s=(i.x+t.x)/2,r=(i.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&s<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==i);return n}function Bu(i,t){const e=new ba(i.i,i.x,i.y),n=new ba(t.i,t.x,t.y),s=i.next,r=t.prev;return i.next=t,t.prev=i,e.next=s,s.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function wc(i,t,e,n){const s=new ba(i,t,e);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function Cs(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function ba(i,t,e){this.i=i,this.x=t,this.y=e,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function Og(i,t,e,n){let s=0;for(let r=t,o=e-n;r<e;r+=n)s+=(i[o]-i[r])*(i[r+1]+i[o+1]),o=r;return s}class jn{static area(t){const e=t.length;let n=0;for(let s=e-1,r=0;r<e;s=r++)n+=t[s].x*t[r].y-t[r].x*t[s].y;return n*.5}static isClockWise(t){return jn.area(t)<0}static triangulateShape(t,e){const n=[],s=[],r=[];bc(t),Ec(n,t);let o=t.length;e.forEach(bc);for(let l=0;l<e.length;l++)s.push(o),o+=e[l].length,Ec(n,e[l]);const a=yg.triangulate(n,s);for(let l=0;l<a.length;l+=3)r.push(a.slice(l,l+3));return r}}function bc(i){const t=i.length;t>2&&i[t-1].equals(i[0])&&i.pop()}function Ec(i,t){for(let e=0;e<t.length;e++)i.push(t[e].x),i.push(t[e].y)}class Ka extends ye{constructor(t=new Za([new Tt(.5,.5),new Tt(-.5,.5),new Tt(-.5,-.5),new Tt(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];const n=this,s=[],r=[];for(let a=0,l=t.length;a<l;a++){const c=t[a];o(c)}this.setAttribute("position",new Zt(s,3)),this.setAttribute("uv",new Zt(r,2)),this.computeVertexNormals();function o(a){const l=[],c=e.curveSegments!==void 0?e.curveSegments:12,u=e.steps!==void 0?e.steps:1,h=e.depth!==void 0?e.depth:1;let d=e.bevelEnabled!==void 0?e.bevelEnabled:!0,f=e.bevelThickness!==void 0?e.bevelThickness:.2,g=e.bevelSize!==void 0?e.bevelSize:f-.1,v=e.bevelOffset!==void 0?e.bevelOffset:0,m=e.bevelSegments!==void 0?e.bevelSegments:3;const p=e.extrudePath,y=e.UVGenerator!==void 0?e.UVGenerator:kg;let M,x=!1,q,R,L,N;p&&(M=p.getSpacedPoints(u),x=!0,d=!1,q=p.computeFrenetFrames(u,!1),R=new O,L=new O,N=new O),d||(m=0,f=0,g=0,v=0);const T=a.extractPoints(c);let _=T.shape;const P=T.holes;if(!jn.isClockWise(_)){_=_.reverse();for(let Mt=0,Et=P.length;Mt<Et;Mt++){const U=P[Mt];jn.isClockWise(U)&&(P[Mt]=U.reverse())}}const H=jn.triangulateShape(_,P),k=_;for(let Mt=0,Et=P.length;Mt<Et;Mt++){const U=P[Mt];_=_.concat(U)}function j(Mt,Et,U){return Et||console.error("THREE.ExtrudeGeometry: vec does not exist"),Mt.clone().addScaledVector(Et,U)}const C=_.length,G=H.length;function z(Mt,Et,U){let w,K,$;const D=Mt.x-Et.x,ct=Mt.y-Et.y,nt=U.x-Mt.x,E=U.y-Mt.y,S=D*D+ct*ct,et=D*E-ct*nt;if(Math.abs(et)>Number.EPSILON){const yt=Math.sqrt(S),Z=Math.sqrt(nt*nt+E*E),tt=Et.x-ct/yt,St=Et.y+D/yt,pt=U.x-E/Z,xt=U.y+nt/Z,Pt=((pt-tt)*E-(xt-St)*nt)/(D*E-ct*nt);w=tt+D*Pt-Mt.x,K=St+ct*Pt-Mt.y;const gt=w*w+K*K;if(gt<=2)return new Tt(w,K);$=Math.sqrt(gt/2)}else{let yt=!1;D>Number.EPSILON?nt>Number.EPSILON&&(yt=!0):D<-Number.EPSILON?nt<-Number.EPSILON&&(yt=!0):Math.sign(ct)===Math.sign(E)&&(yt=!0),yt?(w=-ct,K=D,$=Math.sqrt(S)):(w=D,K=ct,$=Math.sqrt(S/2))}return new Tt(w/$,K/$)}const b=[];for(let Mt=0,Et=k.length,U=Et-1,w=Mt+1;Mt<Et;Mt++,U++,w++)U===Et&&(U=0),w===Et&&(w=0),b[Mt]=z(k[Mt],k[U],k[w]);const W=[];let rt,dt=b.concat();for(let Mt=0,Et=P.length;Mt<Et;Mt++){const U=P[Mt];rt=[];for(let w=0,K=U.length,$=K-1,D=w+1;w<K;w++,$++,D++)$===K&&($=0),D===K&&(D=0),rt[w]=z(U[w],U[$],U[D]);W.push(rt),dt=dt.concat(rt)}for(let Mt=0;Mt<m;Mt++){const Et=Mt/m,U=f*Math.cos(Et*Math.PI/2),w=g*Math.sin(Et*Math.PI/2)+v;for(let K=0,$=k.length;K<$;K++){const D=j(k[K],b[K],w);J(D.x,D.y,-U)}for(let K=0,$=P.length;K<$;K++){const D=P[K];rt=W[K];for(let ct=0,nt=D.length;ct<nt;ct++){const E=j(D[ct],rt[ct],w);J(E.x,E.y,-U)}}}const B=g+v;for(let Mt=0;Mt<C;Mt++){const Et=d?j(_[Mt],dt[Mt],B):_[Mt];x?(L.copy(q.normals[0]).multiplyScalar(Et.x),R.copy(q.binormals[0]).multiplyScalar(Et.y),N.copy(M[0]).add(L).add(R),J(N.x,N.y,N.z)):J(Et.x,Et.y,0)}for(let Mt=1;Mt<=u;Mt++)for(let Et=0;Et<C;Et++){const U=d?j(_[Et],dt[Et],B):_[Et];x?(L.copy(q.normals[Mt]).multiplyScalar(U.x),R.copy(q.binormals[Mt]).multiplyScalar(U.y),N.copy(M[Mt]).add(L).add(R),J(N.x,N.y,N.z)):J(U.x,U.y,h/u*Mt)}for(let Mt=m-1;Mt>=0;Mt--){const Et=Mt/m,U=f*Math.cos(Et*Math.PI/2),w=g*Math.sin(Et*Math.PI/2)+v;for(let K=0,$=k.length;K<$;K++){const D=j(k[K],b[K],w);J(D.x,D.y,h+U)}for(let K=0,$=P.length;K<$;K++){const D=P[K];rt=W[K];for(let ct=0,nt=D.length;ct<nt;ct++){const E=j(D[ct],rt[ct],w);x?J(E.x,E.y+M[u-1].y,M[u-1].x+U):J(E.x,E.y,h+U)}}}X(),I();function X(){const Mt=s.length/3;if(d){let Et=0,U=C*Et;for(let w=0;w<G;w++){const K=H[w];ft(K[2]+U,K[1]+U,K[0]+U)}Et=u+m*2,U=C*Et;for(let w=0;w<G;w++){const K=H[w];ft(K[0]+U,K[1]+U,K[2]+U)}}else{for(let Et=0;Et<G;Et++){const U=H[Et];ft(U[2],U[1],U[0])}for(let Et=0;Et<G;Et++){const U=H[Et];ft(U[0]+C*u,U[1]+C*u,U[2]+C*u)}}n.addGroup(Mt,s.length/3-Mt,0)}function I(){const Mt=s.length/3;let Et=0;it(k,Et),Et+=k.length;for(let U=0,w=P.length;U<w;U++){const K=P[U];it(K,Et),Et+=K.length}n.addGroup(Mt,s.length/3-Mt,1)}function it(Mt,Et){let U=Mt.length;for(;--U>=0;){const w=U;let K=U-1;K<0&&(K=Mt.length-1);for(let $=0,D=u+m*2;$<D;$++){const ct=C*$,nt=C*($+1),E=Et+w+ct,S=Et+K+ct,et=Et+K+nt,yt=Et+w+nt;Ct(E,S,et,yt)}}}function J(Mt,Et,U){l.push(Mt),l.push(Et),l.push(U)}function ft(Mt,Et,U){It(Mt),It(Et),It(U);const w=s.length/3,K=y.generateTopUV(n,s,w-3,w-2,w-1);Bt(K[0]),Bt(K[1]),Bt(K[2])}function Ct(Mt,Et,U,w){It(Mt),It(Et),It(w),It(Et),It(U),It(w);const K=s.length/3,$=y.generateSideWallUV(n,s,K-6,K-3,K-2,K-1);Bt($[0]),Bt($[1]),Bt($[3]),Bt($[1]),Bt($[2]),Bt($[3])}function It(Mt){s.push(l[Mt*3+0]),s.push(l[Mt*3+1]),s.push(l[Mt*3+2])}function Bt(Mt){r.push(Mt.x),r.push(Mt.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return zg(e,n,t)}static fromJSON(t,e){const n=[];for(let r=0,o=t.shapes.length;r<o;r++){const a=e[t.shapes[r]];n.push(a)}const s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new Ar[s.type]().fromJSON(s)),new Ka(n,t.options)}}const kg={generateTopUV:function(i,t,e,n,s){const r=t[e*3],o=t[e*3+1],a=t[n*3],l=t[n*3+1],c=t[s*3],u=t[s*3+1];return[new Tt(r,o),new Tt(a,l),new Tt(c,u)]},generateSideWallUV:function(i,t,e,n,s,r){const o=t[e*3],a=t[e*3+1],l=t[e*3+2],c=t[n*3],u=t[n*3+1],h=t[n*3+2],d=t[s*3],f=t[s*3+1],g=t[s*3+2],v=t[r*3],m=t[r*3+1],p=t[r*3+2];return Math.abs(a-u)<Math.abs(o-c)?[new Tt(o,1-l),new Tt(c,1-h),new Tt(d,1-g),new Tt(v,1-p)]:[new Tt(a,1-l),new Tt(u,1-h),new Tt(f,1-g),new Tt(m,1-p)]}};function zg(i,t,e){if(e.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){const r=i[n];e.shapes.push(r.uuid)}else e.shapes.push(i.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}class wn extends Or{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new wn(t.radius,t.detail)}}class Ja extends Or{constructor(t=1,e=0){const n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Ja(t.radius,t.detail)}}class gi extends ye{constructor(t=.5,e=1,n=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:s,thetaStart:r,thetaLength:o},n=Math.max(3,n),s=Math.max(1,s);const a=[],l=[],c=[],u=[];let h=t;const d=(e-t)/s,f=new O,g=new Tt;for(let v=0;v<=s;v++){for(let m=0;m<=n;m++){const p=r+m/n*o;f.x=h*Math.cos(p),f.y=h*Math.sin(p),l.push(f.x,f.y,f.z),c.push(0,0,1),g.x=(f.x/e+1)/2,g.y=(f.y/e+1)/2,u.push(g.x,g.y)}h+=d}for(let v=0;v<s;v++){const m=v*(n+1);for(let p=0;p<n;p++){const y=p+m,M=y,x=y+n+1,q=y+n+2,R=y+1;a.push(M,x,R),a.push(x,q,R)}}this.setIndex(a),this.setAttribute("position",new Zt(l,3)),this.setAttribute("normal",new Zt(c,3)),this.setAttribute("uv",new Zt(u,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new gi(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class $a extends ye{constructor(t=new Za([new Tt(0,.5),new Tt(-.5,-.5),new Tt(.5,-.5)]),e=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:e};const n=[],s=[],r=[],o=[];let a=0,l=0;if(Array.isArray(t)===!1)c(t);else for(let u=0;u<t.length;u++)c(t[u]),this.addGroup(a,l,u),a+=l,l=0;this.setIndex(n),this.setAttribute("position",new Zt(s,3)),this.setAttribute("normal",new Zt(r,3)),this.setAttribute("uv",new Zt(o,2));function c(u){const h=s.length/3,d=u.extractPoints(e);let f=d.shape;const g=d.holes;jn.isClockWise(f)===!1&&(f=f.reverse());for(let m=0,p=g.length;m<p;m++){const y=g[m];jn.isClockWise(y)===!0&&(g[m]=y.reverse())}const v=jn.triangulateShape(f,g);for(let m=0,p=g.length;m<p;m++){const y=g[m];f=f.concat(y)}for(let m=0,p=f.length;m<p;m++){const y=f[m];s.push(y.x,y.y,0),r.push(0,0,1),o.push(y.x,y.y)}for(let m=0,p=v.length;m<p;m++){const y=v[m],M=y[0]+h,x=y[1]+h,q=y[2]+h;n.push(M,x,q),l+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes;return Bg(e,t)}static fromJSON(t,e){const n=[];for(let s=0,r=t.shapes.length;s<r;s++){const o=e[t.shapes[s]];n.push(o)}return new $a(n,t.curveSegments)}}function Bg(i,t){if(t.shapes=[],Array.isArray(i))for(let e=0,n=i.length;e<n;e++){const s=i[e];t.shapes.push(s.uuid)}else t.shapes.push(i.uuid);return t}class De extends ye{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(o+a,Math.PI);let c=0;const u=[],h=new O,d=new O,f=[],g=[],v=[],m=[];for(let p=0;p<=n;p++){const y=[],M=p/n;let x=0;p===0&&o===0?x=.5/e:p===n&&l===Math.PI&&(x=-.5/e);for(let q=0;q<=e;q++){const R=q/e;h.x=-t*Math.cos(s+R*r)*Math.sin(o+M*a),h.y=t*Math.cos(o+M*a),h.z=t*Math.sin(s+R*r)*Math.sin(o+M*a),g.push(h.x,h.y,h.z),d.copy(h).normalize(),v.push(d.x,d.y,d.z),m.push(R+x,1-M),y.push(c++)}u.push(y)}for(let p=0;p<n;p++)for(let y=0;y<e;y++){const M=u[p][y+1],x=u[p][y],q=u[p+1][y],R=u[p+1][y+1];(p!==0||o>0)&&f.push(M,x,R),(p!==n-1||l<Math.PI)&&f.push(x,q,R)}this.setIndex(f),this.setAttribute("position",new Zt(g,3)),this.setAttribute("normal",new Zt(v,3)),this.setAttribute("uv",new Zt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new De(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class Ze extends ye{constructor(t=1,e=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);const o=[],a=[],l=[],c=[],u=new O,h=new O,d=new O;for(let f=0;f<=n;f++)for(let g=0;g<=s;g++){const v=g/s*r,m=f/n*Math.PI*2;h.x=(t+e*Math.cos(m))*Math.cos(v),h.y=(t+e*Math.cos(m))*Math.sin(v),h.z=e*Math.sin(m),a.push(h.x,h.y,h.z),u.x=t*Math.cos(v),u.y=t*Math.sin(v),d.subVectors(h,u).normalize(),l.push(d.x,d.y,d.z),c.push(g/s),c.push(f/n)}for(let f=1;f<=n;f++)for(let g=1;g<=s;g++){const v=(s+1)*f+g-1,m=(s+1)*(f-1)+g-1,p=(s+1)*(f-1)+g,y=(s+1)*f+g;o.push(v,m,y),o.push(m,p,y)}this.setIndex(o),this.setAttribute("position",new Zt(a,3)),this.setAttribute("normal",new Zt(l,3)),this.setAttribute("uv",new Zt(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ze(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class ja extends ye{constructor(t=new Fu(new O(-1,-1,0),new O(-1,1,0),new O(1,1,0)),e=64,n=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:n,radialSegments:s,closed:r};const o=t.computeFrenetFrames(e,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;const a=new O,l=new O,c=new Tt;let u=new O;const h=[],d=[],f=[],g=[];v(),this.setIndex(g),this.setAttribute("position",new Zt(h,3)),this.setAttribute("normal",new Zt(d,3)),this.setAttribute("uv",new Zt(f,2));function v(){for(let M=0;M<e;M++)m(M);m(r===!1?e:0),y(),p()}function m(M){u=t.getPointAt(M/e,u);const x=o.normals[M],q=o.binormals[M];for(let R=0;R<=s;R++){const L=R/s*Math.PI*2,N=Math.sin(L),T=-Math.cos(L);l.x=T*x.x+N*q.x,l.y=T*x.y+N*q.y,l.z=T*x.z+N*q.z,l.normalize(),d.push(l.x,l.y,l.z),a.x=u.x+n*l.x,a.y=u.y+n*l.y,a.z=u.z+n*l.z,h.push(a.x,a.y,a.z)}}function p(){for(let M=1;M<=e;M++)for(let x=1;x<=s;x++){const q=(s+1)*(M-1)+(x-1),R=(s+1)*M+(x-1),L=(s+1)*M+x,N=(s+1)*(M-1)+x;g.push(q,R,N),g.push(R,L,N)}}function y(){for(let M=0;M<=e;M++)for(let x=0;x<=s;x++)c.x=M/e,c.y=x/s,f.push(c.x,c.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new ja(new Ar[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}}class se extends yi{static get type(){return"MeshStandardMaterial"}constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new ut(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ut(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=fu,this.normalScale=new Tt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new En,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Hg extends se{static get type(){return"MeshPhysicalMaterial"}constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new Tt(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Pe(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new ut(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new ut(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new ut(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}}class Qa extends Jt{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new ut(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class Gg extends Qa{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Jt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ut(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const bo=new Qt,Tc=new O,Ac=new O;class Hu{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Tt(512,512),this.map=null,this.mapPass=null,this.matrix=new Qt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new za,this._frameExtents=new Tt(1,1),this._viewportCount=1,this._viewports=[new ce(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;Tc.setFromMatrixPosition(t.matrixWorld),e.position.copy(Tc),Ac.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Ac),e.updateMatrixWorld(),bo.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(bo),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(bo)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const Cc=new Qt,gs=new O,Eo=new O;class Vg extends Hu{constructor(){super(new Qe(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Tt(4,2),this._viewportCount=6,this._viewports=[new ce(2,1,1,1),new ce(0,1,1,1),new ce(3,1,1,1),new ce(1,1,1,1),new ce(3,0,1,1),new ce(1,0,1,1)],this._cubeDirections=[new O(1,0,0),new O(-1,0,0),new O(0,0,1),new O(0,0,-1),new O(0,1,0),new O(0,-1,0)],this._cubeUps=[new O(0,1,0),new O(0,1,0),new O(0,1,0),new O(0,1,0),new O(0,0,1),new O(0,0,-1)]}updateMatrices(t,e=0){const n=this.camera,s=this.matrix,r=t.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),gs.setFromMatrixPosition(t.matrixWorld),n.position.copy(gs),Eo.copy(n.position),Eo.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(Eo),n.updateMatrixWorld(),s.makeTranslation(-gs.x,-gs.y,-gs.z),Cc.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Cc)}}class Ea extends Qa{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new Vg}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class Wg extends Hu{constructor(){super(new Ba(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Rc extends Qa{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Jt.DEFAULT_UP),this.updateMatrix(),this.target=new Jt,this.shadow=new Wg}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class Xg{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Pc(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=Pc();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function Pc(){return performance.now()}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Pa}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Pa);const fr=54,To=Math.PI*2,Ic=7.1,Cr=.22,Wi=Math.PI/2.6,ys=Math.PI/2-.1,Yg=30,qg=.25,Zg=1.2,Kg=60,ex=20,dr=Math.PI/2.4,Jg=2;function $g(i){return tl(i)}function Ta(i,t,e){return i<t?t:i>e?e:i}function hn(i,t,e,n){return i+(t-i)*(1-Math.exp(-e*n))}function Ls(i,t){let e=(t-i)%To;return e>Math.PI?e-=To:e<-Math.PI&&(e+=To),e}function jg(i,t,e,n){return i+Ls(i,t)*(1-Math.exp(-7.5*n))}function tl(i){const t=Number.isFinite(i)&&i>0?i:.016666666666666666;return Ta(Yg*t,qg,Zg)}function Gu(i,t,e=tl(1/60)){const n=Ls(t,i),s=Math.abs(n);return s<=ys||s>ys+e?i:t+(n>0?ys:-ys)}function Vu(i,t){return Math.abs(Ls(t,i))<=ys+1e-9}function Lc(i,t,e,n,s,r){return i.set(t.x+e*s,t.y+2.5+Math.sin(r)*s*.9,t.z+n*s),i.y<t.y+1.2&&(i.y=t.y+1.2),i.y<1.4&&(i.y=1.4),i}function Qg(i,t,e,n,s){const r=i.pos.x-t.x,o=i.pos.z-t.z,a=Math.hypot(r,o);if(!(a>1e-4))return!1;if(a>i.dist*Jg)return i.behindHeld=!1,!1;const l=Ls(e,Math.atan2(r,o)),c=Math.abs(l);if(c<=dr)return i.behindHeld=!0,!1;if(s!==null&&(n>s||c>dr+s))return i.behindHeld=!1,!1;if(!i.behindHeld)return!1;const u=e+(l>0?dr:-dr);return i.pos.x=t.x+Math.sin(u)*a,i.pos.z=t.z+Math.cos(u)*a,!0}function Dc(i,t,e,n,s,r,o){return i.set(t.x+s.x-e*1.1,t.y+1.45-Math.sin(r-o)*2.4,t.z+s.z-n*1.1),i}function tv(i,t,e,n,s){const r=i.x-t.x,o=i.z-t.z,a=Math.hypot(r,o);if(a<1e-4)return s;const l=Math.atan2(r,o),c=s?Gu(l,e,n):l;return c!==l&&(i.x=t.x+Math.sin(c)*a,i.z=t.z+Math.cos(c)*a),Vu(c,e)}function ev({aspect:i=16/9,mobile:t=!1}={}){const e=new Qe(fr,i,.35,1600);e.position.set(0,6,14);const n={pos:new O(0,6,14),look:new O(0,1.4,0),yaw:0,pitch:Cr,pitchBias:0,pitchOut:Cr,dist:7.4,behindHold:!1,behindPosHold:!1,behindHeld:!1,followYaw:0,shake:0,shakeFreq:26,fovKick:0,breathe:Math.random()*100,mobile:t,shakeScale:t?.45:1,lead:new O},s=new O,r=new O,o=new O;return{camera:e,state:n,setMobile(a){n.mobile=!!a,n.shakeScale=a?.45:1},releaseBehind(){n.behindHeld=!1},impulse(a=.5,l=0){n.shake=Math.min(1.4,n.shake+a*n.shakeScale),n.fovKick=Math.min(6.5,n.fovKick+(l||a*2.4)*n.shakeScale)},resize(a){e.aspect=a,e.updateProjectionMatrix()},update(a,l,c,u,h={}){const d=Math.max(0,l.y),f=Number.isFinite(h.behindYaw)?h.behindYaw:null,g=f===null?0:tl(a);n.yaw=jg(n.yaw,Number.isFinite(c)?c:n.yaw,7.5,a),f===null?(n.behindHold=!1,n.behindPosHold=!1):(n.behindHold&&(n.yaw=Gu(n.yaw,f,g)),n.behindHold=Vu(n.yaw,f));const v=Number.isFinite(h.pitchBias)?h.pitchBias:0;n.pitchBias=hn(n.pitchBias,v,14,a);const m=Ta(n.pitch+n.pitchBias,-Wi,Wi);n.pitchOut=m;const p=u?Math.hypot(u.x,u.z):0,y=Ic+Math.min(1.6,p*.11)+d*.12;n.dist=hn(n.dist,y,3.2,a);const M=Math.sin(n.yaw),x=Math.cos(n.yaw);Lc(s,l,M,x,n.dist,m),n.pos.x=hn(n.pos.x,s.x,6.2,a),n.pos.y=hn(n.pos.y,s.y,5,a),n.pos.z=hn(n.pos.z,s.z,6.2,a),f!==null&&(n.behindPosHold=tv(n.pos,l,f,g,n.behindPosHold));const q=Number.isFinite(c)?c:n.yaw,R=Math.abs(Ls(n.followYaw,q));Qg(n,l,q,R,f===null?$g(a):null),n.followYaw=q,u&&(n.lead.x=hn(n.lead.x,u.x*.16,4,a),n.lead.z=hn(n.lead.z,u.z*.16,4,a)),Dc(r,l,M,x,n.lead,m,n.pitch),n.look.x=hn(n.look.x,r.x,9,a),n.look.y=hn(n.look.y,r.y,7,a),n.look.z=hn(n.look.z,r.z,9,a),n.breathe+=a;const L=Math.sin(n.breathe*.53)*.035+Math.sin(n.breathe*1.31)*.012,N=Math.cos(n.breathe*.41)*.028+Math.sin(n.breathe*1.07)*.01;let T=0,_=0,P=0;if(n.shake>5e-4){const H=n.breathe*n.shakeFreq,k=n.shake*n.shake;T=(Math.sin(H*1.7)+Math.sin(H*3.1)*.5)*k*.34,_=(Math.cos(H*2.3)+Math.sin(H*4.7)*.4)*k*.26,P=Math.sin(H*2.9)*k*.18,n.shake=Math.max(0,n.shake-a*3.6)}e.position.set(n.pos.x+L+T,n.pos.y+N+_,n.pos.z+P),o.copy(n.look),o.x+=T*.3,o.y+=_*.3,e.lookAt(o),e.rotateZ(T*.06),n.fovKick=Math.max(0,n.fovKick-a*14);const V=fr+n.fovKick+Math.min(4,p*.22);Math.abs(e.fov-V)>.01&&(e.fov=hn(e.fov,V,10,a),e.updateProjectionMatrix())},snap(a,l,c={}){n.yaw=Number.isFinite(l)?Math.atan2(Math.sin(l),Math.cos(l)):n.yaw,n.pitchBias=Number.isFinite(c.pitchBias)?c.pitchBias:0;const u=Ta(n.pitch+n.pitchBias,-Wi,Wi);n.pitchOut=u,n.dist=Number.isFinite(c.dist)?c.dist:Ic,n.lead.set(0,0,0),n.behindHeld=!0,n.followYaw=n.yaw,n.shake=0,n.fovKick=0;const h=Math.sin(n.yaw),d=Math.cos(n.yaw);return n.pos.copy(Lc(s,a,h,d,n.dist,u)),n.look.copy(Dc(r,a,h,d,n.lead,u,n.pitch)),e.position.copy(n.pos),e.lookAt(n.look),e.rotation.z=0,e.fov!==fr&&(e.fov=fr,e.updateProjectionMatrix()),n.pos},orbit(a,l,c=30){const u=l*.055,h=3.4+Math.sin(l*.11)*2.6;e.position.set(Math.cos(u)*c,h,Math.sin(u)*c),e.lookAt(Math.sin(u*1.7)*2,-.9,Math.cos(u*1.7)*2),n.pos.copy(e.position),n.look.set(0,-.9,0)}}}const Ut={skyZenith:1713984,skyMid:3885667,skyHorizon:7172741,skyWarm:12159587,sunDisc:16766888,keyLight:16763279,fillSky:9416925,fillBounce:7164736,rimLight:11125734,crackLight:16751686,rockTop:6971477,rockBody:4934222,rockDeep:3092792,rockFresh:9143160,grime:2367260,crackCore:16761963,crackDeep:14177308,fog:3358810,cloudLit:10390390,cloudShadow:4608106,leather:4535593,leatherWorn:6507577,metal:9277331,metalWarm:11570014,cloth:4672857,clothDim:3027772,skin:9068359},nv={cotton:14928264,granite:8227481,gale:6538932,frost:10475759,spring:13209407,afterimage:11832030,magnet:13193027,meteor:14710848},zr=10134189,Br=1,el=2;function kn(i){var t,e;return(e=(t=i==null?void 0:i.layers)==null?void 0:t.enable)==null||e.call(t,el),i}const Aa={high:{name:"high",dprCap:2,msaa:4,shadows:!0,shadowMapSize:2048,softShadows:!0,propShadows:!0,bloomOccluders:"all",rimLight:!0,crackFillLight:!0,texRock:512,texDetail:256,normalMaps:!0,sheenCloth:!0,envSize:256,islandRadialSegments:128,islandProfileSegments:26,plateBevel:!0,plateCurveSegments:10,capsuleSegments:12,rockChunks:7,cloudLayers:3,dustBudget:900,emberBudget:220,debrisPerBurst:7,debrisBudget:120,mergedDebris:!1,decalBudget:24,shockRings:2,footDust:!0,bloom:!0,bloomScale:.5,bloomIterations:3,bloomStrength:.9},mid:{name:"mid",dprCap:1.5,msaa:2,shadows:!0,shadowMapSize:1024,softShadows:!1,propShadows:!1,bloomOccluders:"tagged",rimLight:!0,crackFillLight:!0,texRock:256,texDetail:128,normalMaps:!0,sheenCloth:!1,envSize:128,islandRadialSegments:80,islandProfileSegments:18,plateBevel:!0,plateCurveSegments:6,capsuleSegments:8,rockChunks:4,cloudLayers:2,dustBudget:380,emberBudget:96,debrisPerBurst:4,debrisBudget:56,mergedDebris:!1,decalBudget:12,shockRings:1,footDust:!0,bloom:!0,bloomScale:.25,bloomIterations:2,bloomStrength:.8},low:{name:"low",dprCap:1.25,msaa:0,shadows:!1,shadowMapSize:512,softShadows:!1,propShadows:!1,bloomOccluders:"tagged",rimLight:!0,crackFillLight:!0,texRock:128,texDetail:64,normalMaps:!1,sheenCloth:!1,envSize:64,islandRadialSegments:44,islandProfileSegments:12,plateBevel:!1,plateCurveSegments:3,capsuleSegments:6,rockChunks:2,cloudLayers:1,dustBudget:140,emberBudget:32,debrisPerBurst:2,debrisBudget:20,mergedDebris:!0,decalBudget:4,shockRings:1,footDust:!1,bloom:!1,bloomScale:.125,bloomIterations:0,bloomStrength:0}},nx=["high","mid","low"];function Uc(i){return Aa[i]?i:"mid"}const iv=2;function ii(i){let t=i>>>0;return function(){t|=0,t=t+1831565813|0;let n=Math.imul(t^t>>>15,1|t);return n=n+Math.imul(n^n>>>7,61|n)^n,((n^n>>>14)>>>0)/4294967296}}function Nc(i){return i*i*i*(i*(i*6-15)+10)}function Ao(i,t,e){return i+(t-i)*e}function rn(i){const t=ii(i),e=256,n=e-1,s=new Float32Array(e*e);for(let r=0;r<s.length;r++)s[r]=t();return function(o,a){const l=Math.floor(o),c=Math.floor(a),u=Nc(o-l),h=Nc(a-c),d=l&n,f=l+1&n,g=(c&n)*e,v=(c+1&n)*e,m=s[g+d],p=s[g+f],y=s[v+d],M=s[v+f];return Ao(Ao(m,p,u),Ao(y,M,u),h)}}function oe(i,t,e,n=4,s=.5){let r=0,o=1,a=0,l=t,c=e;for(let u=0;u<n;u++)r+=i(l,c)*o,a+=o,o*=s,l*=2,c*=2;return r/a}function Rs(i,t,e,n=4){let s=0,r=1,o=0,a=t,l=e;for(let c=0;c<n;c++){const u=1-Math.abs(i(a,l)*2-1);s+=u*u*r,o+=r,r*=.45,a*=2.07,l*=2.03}return s/o}function Fc(i,t){const e=Math.min(1,Math.max(0,i));return e<.5?.5*Math.pow(e*2,t):1-.5*Math.pow((1-e)*2,t)}function ve(i,t,e){const n=Math.min(1,Math.max(0,(e-i)/(t-i)));return n*n*(3-2*n)}const sv=`
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
`,rv=`
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
`;function Ps({scene:i,budget:t,texture:e,blending:n,depthWrite:s,renderOrder:r}){const o=Math.max(1,Math.floor(t)),a=new Float32Array(o*3),l=new Float32Array(o),c=new Float32Array(o),u=new Float32Array(o),h=new Float32Array(o*3),d=new ye,f=new Zt(a,3).setUsage(Le),g=new Zt(l,1).setUsage(Le),v=new Zt(c,1).setUsage(Le),m=new Zt(u,1).setUsage(Le),p=new Zt(h,3).setUsage(Le);d.setAttribute("position",f),d.setAttribute("aSize",g),d.setAttribute("aAlpha",v),d.setAttribute("aRot",m),d.setAttribute("aColor",p),d.setDrawRange(0,0);const y=new Ee({vertexShader:sv,fragmentShader:rv,transparent:!0,depthWrite:!1,blending:n,uniforms:{uMap:{value:e},uPixelScale:{value:520},uFogColor:{value:new ut(Ut.fog)},uFogAmount:{value:n===qi?.2:1}}}),M=new cg(d,y);return M.frustumCulled=!1,M.renderOrder=r??3,i.add(M),{points:M,geo:d,mat:y,budget:o,count:0,vel:new Float32Array(o*3),life:new Float32Array(o),maxLife:new Float32Array(o),spin:new Float32Array(o),grow:new Float32Array(o),drag:new Float32Array(o),baseSize:new Float32Array(o),baseAlpha:new Float32Array(o),arrays:{pos:a,size:l,alpha:c,rot:u,color:h},attrs:{posAttr:f,sizeAttr:g,alphaAttr:v,rotAttr:m,colorAttr:p},dispose(){i.remove(M),d.dispose(),y.dispose()}}}function nl(i,t){const e=i.count-1;if(t!==e){const n=i.arrays;for(let s=0;s<3;s++)n.pos[t*3+s]=n.pos[e*3+s],n.color[t*3+s]=n.color[e*3+s],i.vel[t*3+s]=i.vel[e*3+s];n.size[t]=n.size[e],n.alpha[t]=n.alpha[e],n.rot[t]=n.rot[e],i.life[t]=i.life[e],i.maxLife[t]=i.maxLife[e],i.spin[t]=i.spin[e],i.grow[t]=i.grow[e],i.drag[t]=i.drag[e],i.baseSize[t]=i.baseSize[e],i.baseAlpha[t]=i.baseAlpha[e]}i.count=e}function Rr(i,t,e,n,s,r=Math.random){if(i.count>=i.budget)return-1;const o=i.count++,a=i.arrays;return a.pos[o*3]=t,a.pos[o*3+1]=e,a.pos[o*3+2]=n,i.vel[o*3]=s.vx,i.vel[o*3+1]=s.vy,i.vel[o*3+2]=s.vz,i.life[o]=0,i.maxLife[o]=s.life,i.spin[o]=s.spin,i.grow[o]=s.grow,i.drag[o]=s.drag,i.baseSize[o]=s.size,i.baseAlpha[o]=s.alpha,a.size[o]=s.size,a.alpha[o]=s.alpha,a.rot[o]=s.rot??r()*Math.PI*2,a.color[o*3]=s.color.r,a.color[o*3+1]=s.color.g,a.color[o*3+2]=s.color.b,o}function il(i){i.geo.setDrawRange(0,i.count),i.count>0&&(i.attrs.posAttr.needsUpdate=!0,i.attrs.sizeAttr.needsUpdate=!0,i.attrs.alphaAttr.needsUpdate=!0,i.attrs.rotAttr.needsUpdate=!0,i.attrs.colorAttr.needsUpdate=!0),i.points.visible=i.count>0}const ov=1,Xe=Math.PI*2,Un=Math.PI/2,av=Object.freeze({cotton:"fanwake",granite:"slab",gale:"gust",frost:"rime",spring:"recoil",afterimage:"phase",magnet:"flux",meteor:"cinder"}),lv=Object.freeze({quake_slam:"slab",wind_rush:"gust",frost_arc:"rime",coil_counter:"recoil",phantom_swap:"phase",iron_pull:"flux",sky_fall:"cinder"});function Wu(i){return av[i]??"fanwake"}function cv(i,t){return lv[i]??Wu(t)}const uv=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,hv=`
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
`,fv=`
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
`;function Co(i,t,e){return i<t?t:i>e?e:i}function Fe(i,t,e){return i.clone().lerp(t,e)}function dv({scene:i,quality:t,textures:e,seed:n=90210}){const s=ii(n+4409),r=t.name==="low",o=t.name==="mid",a=r?.4:o?.72:1,l=new ge;l.name="combat-vfx",i.add(l);const c=Ps({scene:l,budget:Math.max(64,Math.round(t.dustBudget*.4)),texture:(e==null?void 0:e.dust)??null,blending:Ge,depthWrite:!1,renderOrder:3}),u=Ps({scene:l,budget:Math.max(16,Math.round(t.emberBudget*.45)),texture:(e==null?void 0:e.ember)??null,blending:qi,depthWrite:!1,renderOrder:4});t.bloom&&(u.points.layers.enable(ov),u.points.userData.bloomSelf=!0);const h=new Float32Array(c.budget),d=new Float32Array(u.budget);function f(w,K,$,D){const ct=Rr(c,w,K,$,D,s);return ct>=0&&(h[ct]=D.gravity??-1.1),ct}function g(w,K,$,D){const ct=Rr(u,w,K,$,D,s);return ct>=0&&(d[ct]=D.gravity??-2.2),ct}function v(w,K,$,D){const ct=w.arrays;for(let nt=w.count-1;nt>=0;nt--){w.life[nt]+=$;const E=w.life[nt]/w.maxLife[nt];if(E>=1){const et=w.count-1;nt!==et&&(K[nt]=K[et]),nl(w,nt);continue}const S=Math.exp(-w.drag[nt]*$);if(w.vel[nt*3]*=S,w.vel[nt*3+2]*=S,w.vel[nt*3+1]=w.vel[nt*3+1]*S+K[nt]*$,ct.pos[nt*3]+=w.vel[nt*3]*$,ct.pos[nt*3+1]+=w.vel[nt*3+1]*$,ct.pos[nt*3+2]+=w.vel[nt*3+2]*$,!D&&ct.pos[nt*3+1]<.04&&w.vel[nt*3+1]<0&&(ct.pos[nt*3+1]=.04,w.vel[nt*3+1]=0,w.vel[nt*3]*=.84,w.vel[nt*3+2]*=.84),ct.rot[nt]+=w.spin[nt]*$,ct.size[nt]=w.baseSize[nt]+w.grow[nt]*E,D){const et=D(E);ct.color[nt*3]=et.r,ct.color[nt*3+1]=et.g,ct.color[nt*3+2]=et.b,ct.alpha[nt]=w.baseAlpha[nt]*(1-E*E)}else{const et=Math.min(1,E/.1);ct.alpha[nt]=w.baseAlpha[nt]*et*(1-E)*(1-E*.35)}}il(w)}const m=r?14:o?30:52,p=new wn(.075,0),y=new se({color:16777215,roughness:.94,metalness:.05,flatShading:!0,envMapIntensity:.25,vertexColors:!1}),M=new sn(p,y,m);M.instanceMatrix.setUsage(Le),M.castShadow=t.shadows,M.frustumCulled=!1,M.count=0,l.add(M);const x=[],q=new Jt,R=new ut;function L(w){if(x.length>=m)return null;const K={p:new O(w.x,w.y,w.z),v:new O(w.vx??0,w.vy??0,w.vz??0),target:w.target?w.target.clone():null,rot:new O(s()*Xe,s()*Xe,s()*Xe),spin:new O((s()-.5)*8,(s()-.5)*8,(s()-.5)*8),sx:w.sx??1,sy:w.sy??1,mode:w.mode??"scatter",life:0,maxLife:w.life??1.4,color:(w.color??R.set(Ut.rockBody)).clone()};return x.push(K),K}function N(w){if(x.length===0){M.count!==0&&(M.count=0,M.visible=!1);return}for(let $=x.length-1;$>=0;$--){const D=x[$];if(D.life+=w,D.life>=D.maxLife){x.splice($,1);continue}if(D.mode==="converge"&&D.target){const ct=Math.min(1,w*7.5);D.p.lerp(D.target,ct),D.spin.multiplyScalar(1+w*2)}else D.mode==="rise"?(D.p.y+=D.v.y*w,D.v.y*=Math.exp(-6*w)):(D.v.y-=20*w,D.p.addScaledVector(D.v,w),D.p.y<.06&&(D.p.y=.06,D.v.y*=-.3,D.v.x*=.6,D.v.z*=.6,D.spin.multiplyScalar(.5)),D.rot.x+=D.spin.x*w,D.rot.y+=D.spin.y*w,D.rot.z+=D.spin.z*w)}const K=Math.min(x.length,m);for(let $=0;$<K;$++){const D=x[$],ct=D.life/D.maxLife,nt=1-Math.max(0,(ct-.62)/.38),E=D.mode==="rise"?Math.min(1,ct/.22):1;q.position.copy(D.p),q.rotation.set(D.rot.x,D.rot.y,D.rot.z),q.scale.set(D.sx*nt,D.sy*nt*E,D.sx*nt),q.updateMatrix(),M.setMatrixAt($,q.matrix),M.setColorAt($,D.color)}M.count=K,M.visible=K>0,M.instanceMatrix.needsUpdate=!0,M.instanceColor&&(M.instanceColor.needsUpdate=!0)}const T={fanwake:new gi(.22,1,22,1,-1.15,2.3),gust:new gi(.34,1,30,1,-1,2),rime:new gi(.4,1,30,1,-1.65,3.3),phase:new gi(.55,1,18,1,-.85,1.7)},_={slab:new be(.9,.06,1.05,4,1,!0),recoil:new Ze(.72,.055,4,26),flux:new Ze(.92,.04,3,30,Math.PI*1.45),cinder:new Fr(.6,1.6,10,1,!0)},P=[...Object.values(T),...Object.values(_)],V=r?3:o?5:7,H=T.fanwake;function k(w){const K=new Ee({vertexShader:uv,fragmentShader:w,transparent:!0,depthWrite:!1,side:Ie,blending:Ge,uniforms:{uNoise:{value:(e==null?void 0:e.turbulence)??null},uColorLit:{value:new ut(Ut.rockTop)},uColorDark:{value:new ut(Ut.fog)},uLife:{value:0},uOpacity:{value:.6},uTear:{value:.24},uFlow:{value:.5},uInner:{value:.2},uSweep:{value:0}}}),$=new ge,D=new ge;D.rotation.order="YXZ";const ct=new Yt(H,K);return D.add(ct),$.add(D),$.visible=!1,$.renderOrder=2,l.add($),{holder:$,orient:D,mesh:ct,mat:K,t:-1,dur:.3,spec:null,power:1,phase:0}}const j=Array.from({length:V},()=>{const w=k(hv);return w.family="sheet",w}),C=Array.from({length:V},()=>{const w=k(fv);return w.family="band",w}),G=new ut(Ut.grime).lerp(new ut(Ut.rockBody),.45),z=new ut(Ut.rockTop).lerp(new ut(Ut.keyLight),.25),b=new ut(Ut.rockBody),W=new ut(16773327),rt=new ut(Ut.crackDeep),dt=w=>R.copy(W).lerp(rt,Math.min(1,w*1.5)),B=new ut;function X(w,K){return B.copy(G).lerp(z,.25+s()*.6).lerp(w,K)}function I(w,K){return Math.max(1,Math.round(w*a*Co(K,.4,2)))}const it={fanwake:{family:"sheet",geo:"fanwake",dur:.44,shells:1,uniforms:{uTear:.16,uFlow:.35,uInner:.2,uOpacity:.44},color:w=>({lit:Fe(new ut(16773853),w,.3),dark:Fe(new ut(Ut.fog),w,.15)}),pose(w){w.orient.rotation.set(-Un+.34,Un,0)},animate(w,K,$){const D=1-Math.pow(1-K,2.2),ct=(.72+D*1.15)*$;w.mesh.scale.set(ct,ct,ct),w.holder.position.y=w.baseY+D*.05,w.orient.rotation.z=.28-D*.5},burst(w){for(let K=0;K<I(7,w.power);K++){const $=(s()-.5)*1.9,D=Math.sin($),ct=Math.cos($),nt=w.dir.x*ct-w.dir.z*D,E=w.dir.x*D+w.dir.z*ct;f(w.at.x+nt*.5,w.at.y+(s()-.4)*.4,w.at.z+E*.5,{vx:nt*(1+s()),vy:.25+s()*.4,vz:E*(1+s()),life:1.5+s()*1.4,spin:(s()-.5)*.6,grow:.9+s()*.7,drag:1.6,size:.24+s()*.24,alpha:.18+s()*.14,gravity:.04,color:K%5===0?B.copy(w.tint):X(w.tint,.05)})}}},slab:{family:"band",geo:"slab",dur:.32,shells:1,uniforms:{uTear:.3,uFlow:.2,uSweep:0,uOpacity:.6},color:w=>({lit:Fe(new ut(Ut.rockFresh),w,.28),dark:Fe(new ut(Ut.rockDeep),w,.12)}),pose(w){w.orient.rotation.set(-Un,0,Math.PI*.25)},animate(w,K,$){const D=K<.4?Math.pow(K/.4,.55):1;w.mesh.position.y=D*.95*$;const ct=(.55+D*.75)*$;w.mesh.scale.set(ct,.9+D*.45,ct)},burst(w){for(let K=0;K<I(4,w.power);K++){const $=s()*Xe,D=(2+s()*3.4)*w.power;L({x:w.at.x+w.dir.x*.6,y:Math.max(.15,w.at.y-.3),z:w.at.z+w.dir.z*.6,vx:Math.cos($)*D*.5+w.dir.x*D*.5,vy:2.5+s()*3.5,vz:Math.sin($)*D*.5+w.dir.z*D*.5,sx:.7+s()*.8,sy:.7+s()*.8,life:1.1+s()*.8,color:B.copy(b).lerp(w.tint,.14)})}for(let K=0;K<I(8,w.power);K++){const $=s()*Xe;f(w.at.x+w.dir.x*.7,.1+s()*.3,w.at.z+w.dir.z*.7,{vx:Math.cos($)*2.6*w.power,vy:.5+s()*.7,vz:Math.sin($)*2.6*w.power,life:1.1+s()*1.1,spin:(s()-.5)*1.6,grow:2+s()*1.6,drag:2.4,size:.3+s()*.4,alpha:.26+s()*.2,gravity:-.9,color:X(w.tint,.04)})}}},gust:{family:"sheet",geo:"gust",dur:.36,shells:2,uniforms:{uTear:.12,uFlow:1.5,uInner:.3,uOpacity:.62},color:w=>({lit:Fe(new ut(15135983),w,.34),dark:Fe(new ut(Ut.fog),w,.2)}),pose(w){w.orient.rotation.set(.34,0,-Un),w.baseY=Math.min(w.baseY,.72),w.holder.position.y=w.baseY},animate(w,K,$){const D=w.phase*.16,ct=Co((K-D)/(1-D),0,1),nt=Math.pow(ct,.55);w.holder.position.x=w.baseX+w.dirX*nt*2.6*$,w.holder.position.z=w.baseZ+w.dirZ*nt*2.6*$,w.holder.position.y=w.baseY-nt*.12;const E=(1+nt*.42)*$;w.mesh.scale.set(E,(.95+nt*1.05)*$,1),w.orient.position.y=.56*E},burst(w){for(let K=0;K<I(6,w.power);K++){const $=s()<.5?-1:1,D=-w.dir.z*$*(.2+s()*.6),ct=w.dir.x*$*(.2+s()*.6);f(w.at.x+D,.12+s()*.5,w.at.z+ct,{vx:w.dir.x*(5+s()*4)+D,vy:.15+s()*.25,vz:w.dir.z*(5+s()*4)+ct,life:.42+s()*.3,spin:3,grow:.5,drag:2.2,size:.1+s()*.12,alpha:.3,gravity:-.2,color:K%6===0?B.copy(w.tint):X(w.tint,.06)})}}},rime:{family:"sheet",geo:"rime",dur:.62,shells:1,uniforms:{uTear:.14,uFlow:.22,uInner:.36,uOpacity:.4},color:w=>({lit:Fe(new ut(15398655),w,.38),dark:Fe(new ut(Ut.cloudShadow),w,.18)}),pose(w){w.orient.rotation.set(-Un,Un,0),w.baseY=.42,w.holder.position.y=w.baseY},animate(w,K,$){const ct=(.7+(1-Math.pow(1-K,3))*1.5)*$;w.mesh.scale.set(ct,ct,ct)},burst(w){for(let K=0;K<I(3,w.power);K++){const $=(s()-.5)*2.6,D=Math.sin($),ct=Math.cos($),nt=.9+s()*.9;L({x:w.at.x+(w.dir.x*ct-w.dir.z*D)*nt,y:.06,z:w.at.z+(w.dir.x*D+w.dir.z*ct)*nt,vy:1.6+s(),sx:.42+s()*.25,sy:2.1+s()*1.6,mode:"rise",life:1.5+s()*1.2,color:B.set(13625074).lerp(w.tint,.3)})}for(let K=0;K<I(6,w.power);K++){const $=s()*Xe;f(w.at.x+Math.cos($)*.6,.3+s()*.5,w.at.z+Math.sin($)*.6,{vx:Math.cos($)*.8,vy:-.12,vz:Math.sin($)*.8,life:1.8+s()*1.4,spin:(s()-.5)*.3,grow:1.1+s()*.8,drag:1.5,size:.26+s()*.3,alpha:.13+s()*.1,gravity:-.18,color:B.set(14478582).lerp(G,.4)})}}},recoil:{family:"band",geo:"recoil",dur:.4,shells:2,uniforms:{uTear:.22,uFlow:.8,uSweep:0,uOpacity:.5},color:w=>({lit:Fe(new ut(Ut.metalWarm),w,.34),dark:Fe(new ut(Ut.rockDeep),w,.1)}),pose(w){w.orient.rotation.set(-Un,0,0)},animate(w,K,$){const D=w.phase===0,ct=D?1-Math.pow(1-K,2.6):Math.pow(K,1.9),nt=(D?.4+ct*1.5:1.7-ct*1.35)*$;w.mesh.scale.set(nt,nt,1),w.mesh.rotation.z=K*(D?4.5:-6.5),w.holder.position.y=w.baseY+(D?ct*.1:-ct*.15)},burst(w){for(let K=0;K<I(7,w.power);K++){const $=s()*Xe;f(w.at.x+Math.cos($)*.35,.08+s()*.2,w.at.z+Math.sin($)*.35,{vx:Math.cos($)*(2.8+s()*2),vy:1.1+s()*1.2,vz:Math.sin($)*(2.8+s()*2),life:.8+s()*.7,spin:(s()-.5)*2,grow:1.2,drag:2.8,size:.16+s()*.18,alpha:.24,gravity:-1.4,color:X(w.tint,.05)})}if(!r)for(let K=0;K<I(2,w.power);K++){const $=s()*Xe;g(w.at.x,w.at.y,w.at.z,{vx:Math.cos($)*2.4,vy:1.8+s()*2,vz:Math.sin($)*2.4,life:.4+s()*.3,spin:0,grow:-.03,drag:.7,size:.05+s()*.04,alpha:.8,gravity:-3,color:W})}}},phase:{family:"sheet",geo:"phase",dur:.5,shells:2,uniforms:{uTear:.1,uFlow:.12,uInner:.52,uOpacity:.28},color:w=>({lit:Fe(new ut(10133688),w,.42),dark:Fe(new ut(2564404),w,.16)}),pose(w){w.orient.rotation.set(0,0,Un)},animate(w,K,$){const D=w.phase===0?1:-1,ct=1-Math.pow(1-K,2);w.holder.position.x=w.baseX-w.dirZ*D*ct*1.15*$,w.holder.position.z=w.baseZ+w.dirX*D*ct*1.15*$;const nt=(1+ct*.25)*$;w.mesh.scale.set(nt,nt,nt)},burst(w){for(let K=0;K<I(3,w.power);K++){const $=s()*Xe;f(w.at.x+Math.cos($)*.5,w.at.y+(s()-.5)*.6,w.at.z+Math.sin($)*.5,{vx:Math.cos($)*.5,vy:.1,vz:Math.sin($)*.5,life:.9+s()*.6,spin:(s()-.5)*.8,grow:.5,drag:1.8,size:.14+s()*.12,alpha:.14,gravity:-.3,color:B.set(3814472).lerp(w.tint,.25)})}}},flux:{family:"band",geo:"flux",dur:.42,shells:2,uniforms:{uTear:.18,uFlow:1.8,uSweep:1,uOpacity:.5},color:w=>({lit:Fe(new ut(16766658),w,.42),dark:Fe(new ut(Ut.rockDeep),w,.14)}),pose(w){w.orient.rotation.set(-Un+(w.phase===0?.25:-.3),0,w.phase*1.3)},animate(w,K,$){const ct=(1.7-(1-Math.pow(1-K,2.2))*1.25)*$;w.mesh.scale.set(ct,ct,ct),w.mesh.rotation.z=K*3.4*(w.phase===0?1:-1)},burst(w){const K=new O(w.at.x,w.at.y,w.at.z);for(let $=0;$<I(5,w.power);$++){const D=s()*Xe,ct=1.4+s()*1.1;L({x:w.at.x+Math.cos(D)*ct,y:.1+s()*.8,z:w.at.z+Math.sin(D)*ct,target:K,mode:"converge",sx:.45+s()*.3,sy:.45+s()*.3,life:.5+s()*.3,color:B.copy(b).lerp(w.tint,.4)})}for(let $=0;$<I(4,w.power);$++){const D=s()*Xe,ct=1.2+s()*.9,nt=Math.cos(D)*ct,E=Math.sin(D)*ct;f(w.at.x+nt,.15+s()*.6,w.at.z+E,{vx:-nt*2.4,vy:.4,vz:-E*2.4,life:.5+s()*.3,spin:3,grow:-.04,drag:.5,size:.08+s()*.07,alpha:.42,gravity:.2,color:X(w.tint,.18)})}}},cinder:{family:"band",geo:"cinder",dur:.46,shells:1,uniforms:{uTear:.24,uFlow:.9,uSweep:0,uOpacity:.55},color:w=>({lit:Fe(new ut(Ut.crackCore),w,.3),dark:Fe(new ut(Ut.grime),w,.12)}),pose(w){w.orient.rotation.set(0,0,0)},animate(w,K,$){const D=Math.min(1,K/.34),ct=1-Math.pow(1-D,2.6);w.holder.position.y=w.baseY+(1-ct)*2.4;const nt=K<.34?0:(K-.34)/.66;w.mesh.scale.set((.8+nt*1.5)*$,(1-nt*.72)*$,(.8+nt*1.5)*$)},burst(w){for(let K=0;K<I(4,w.power);K++){const $=s()*Xe;g(w.at.x+Math.cos($)*.3,Math.max(.1,w.at.y-.4),w.at.z+Math.sin($)*.3,{vx:Math.cos($)*(1.4+s()*2),vy:2.2+s()*3,vz:Math.sin($)*(1.4+s()*2),life:.7+s()*.8,spin:0,grow:-.04,drag:.5,size:.06+s()*.06,alpha:.9,gravity:-2.4,color:W})}for(let K=0;K<I(3,w.power);K++){const $=s()*Xe,D=(1.5+s()*3)*w.power;L({x:w.at.x,y:Math.max(.15,w.at.y-.3),z:w.at.z,vx:Math.cos($)*D,vy:3+s()*3,vz:Math.sin($)*D,sx:.6+s()*.7,sy:.6+s()*.7,life:1.2+s()*.8,color:B.copy(b).lerp(new ut(Ut.crackDeep),.25)})}for(let K=0;K<I(5,w.power);K++){const $=s()*Xe;f(w.at.x+Math.cos($)*.5,.1+s()*.4,w.at.z+Math.sin($)*.5,{vx:Math.cos($)*2.2,vy:.7+s()*.6,vz:Math.sin($)*2.2,life:1.4+s()*1.2,spin:(s()-.5)*1.4,grow:1.8,drag:2,size:.24+s()*.3,alpha:.24,gravity:-.8,color:X(w.tint,.06)})}}}},J=Object.freeze(Object.keys(it)),ft=new O,Ct=new ut;function It(w){const K=w==="sheet"?j:C;return K.find($=>$.t<0)??K[0]}function Bt(w){return w.family==="sheet"?T[w.geo]:_[w.geo]}function Mt(w,K,$){const D=It(w.family);D.t=0,D.dur=w.dur*($.skill?1.35:1),D.spec=w,D.phase=K,D.power=$.power,D.mesh.geometry=Bt(w),D.holder.visible=!0,D.holder.position.copy($.at),D.holder.rotation.set(0,Math.atan2(-$.dir.x,-$.dir.z),0),D.baseX=$.at.x,D.baseY=$.at.y,D.baseZ=$.at.z,D.dirX=$.dir.x,D.dirZ=$.dir.z,D.mesh.position.set(0,0,0),D.mesh.rotation.set(0,0,0),D.mesh.scale.set(1,1,1),D.orient.position.set(0,0,0),w.pose(D);const ct=w.color($.tint);D.mat.uniforms.uColorLit.value.copy(ct.lit),D.mat.uniforms.uColorDark.value.copy(ct.dark),D.mat.uniforms.uLife.value=0;for(const[nt,E]of Object.entries(w.uniforms))D.mat.uniforms[nt]&&(D.mat.uniforms[nt].value=E);D.mat.uniforms.uOpacity.value=(w.uniforms.uOpacity??.5)*($.whiff?.6:1)*($.skill?1.15:1),w.animate(D,0,$.power)}const Et={group:l,kinds:J,strike(w,K,$,D=1,ct={}){const nt=it[w]??it.fanwake,E=Co(D,.4,2.4);ft.copy($??ft.set(0,0,-1)),ft.y=0,ft.lengthSq()<1e-6&&ft.set(0,0,-1),ft.normalize();const S=ct.tint instanceof ut?Ct.copy(ct.tint):Ct.set(Number.isFinite(ct.tint)?ct.tint:zr),et={at:K,dir:ft,tint:S,power:E*(ct.skill?1.25:1),skill:!!ct.skill,whiff:!!ct.whiff},yt=r?1:nt.shells;for(let Z=0;Z<yt;Z++)Mt(nt,Z,et);return ct.whiff||nt.burst(et),nt},update(w){for(const K of j)U(K,w);for(const K of C)U(K,w);v(c,h,w,null),v(u,d,w,dt),N(w)},setPixelScale(w){c.mat.uniforms.uPixelScale.value=w,u.mat.uniforms.uPixelScale.value=w},getStats(){return{shells:j.concat(C).filter(w=>w.t>=0).length,bits:x.length,particles:c.count+u.count}},dispose(){c.dispose(),u.dispose();for(const w of[...j,...C])w.mat.dispose(),l.remove(w.holder);for(const w of P)w.dispose();p.dispose(),y.dispose(),x.length=0,i.remove(l)}};function U(w,K){if(!(w.t<0)){if(w.t+=K/w.dur,w.t>=1){w.t=-1,w.holder.visible=!1;return}w.mat.uniforms.uLife.value=w.t,w.spec.animate(w,w.t,w.power)}}return Et}const Ca=Object.freeze(["wrap","bracer","pauldron","cloak","hood","turban","sash","horns","mask","banner"]),Oc=new Set(Ca),kc=Object.freeze({wildhorn:{id:"wildhorn",build:{height:1.05,mass:1.32,shoulder:1.36},accessory:"horns",cloth:"#5c4632",trim:"#241a12",accent:"#d7b078"},crane:{id:"crane",build:{height:1.15,mass:.76,shoulder:.86},accessory:"banner",cloth:"#41576c",trim:"#1c2733",accent:"#dde6ee"},nuo:{id:"nuo",build:{height:.96,mass:1.02,shoulder:1.04},accessory:"mask",cloth:"#5f333b",trim:"#26161a",accent:"#e7d6b2"}}),Qn=Object.freeze({id:null,build:Object.freeze({height:1,mass:1,shoulder:1}),accessory:"wrap",cloth:"#6d7280",trim:"#3d4450",accent:"#d9cfba"});function Ro(i,t){return Number.isFinite(i)?i:t}function Po(i,t,e){return i<t?t:i>e?e:i}function pv(i){let t=2166136261;const e=String(i??"");for(let n=0;n<e.length;n++)t^=e.charCodeAt(n),t=Math.imul(t,16777619)>>>0;return t>>>0}function Xu(i){const t=pv(i);return{id:i,build:{height:.9+(t>>>3)%9*.03,mass:.8+(t>>>9)%10*.05,shoulder:.86+(t>>>15)%10*.055},accessory:Ca[t%Ca.length],cloth:Qn.cloth,trim:Qn.trim,accent:Qn.accent}}function mv(i,t){const e=i&&typeof i=="object"?i:{};return{height:Po(Ro(e.height,t.height),.82,1.22),mass:Po(Ro(e.mass,t.mass),.72,1.38),shoulder:Po(Ro(e.shoulder,t.shoulder),.8,1.45)}}function gv(i,t){if(i&&Oc.has(i.accessory))return i.accessory;const e=i&&i.headgear;if(e==="hood"||e==="horns"||e==="mask")return e;const n=i&&i.back;if(n==="banner")return"banner";if(n==="pack")return"sash";if(e==="topknot"||e==="strawHat")return"turban";const s=t&&t.accessory;return Oc.has(s)?s:"wrap"}function Io(i,t){const e=Qu(i),n=Xu(e.id??t),s=e.palette||{};return{id:e.id??t,build:mv(e.build,n.build),accessory:gv(e,n),cloth:typeof s.cloth=="string"?s.cloth:Qn.cloth,trim:typeof s.clothDim=="string"?s.clothDim:Qn.trim,accent:typeof s.accent=="string"?s.accent:Qn.accent}}function sl(i=null){return ju(i)}function vv(i,t){const e=t||sl(null),n=typeof i=="string"&&i.trim().length>0?i:null;if(n&&e.byId&&e.byId[n])return{...Io(e.byId[n],n),source:e.source??"fallback"};if(n&&kc[n])return{...Io(kc[n],n),source:"extra"};if(n)return{...Xu(n),source:"synth"};const s=e.defaultId??null;return s&&e.byId&&e.byId[s]?{...Io(e.byId[s],s),source:"default"}:{...Qn,build:{...Qn.build},source:"default"}}const Lo="p0";function _v(i){return{x:-Math.sin(i),z:-Math.cos(i)}}const xv=20,Mv=2.5,yv=9;function Ht(i,t=0){return Number.isFinite(i)?i:t}function Yu(i,t,e){return i<t?t:i>e?e:i}function Sv(i){if(Number.isFinite(i))return i>>>0;if(typeof i!="string")return null;const t=i.trim().replace(/^#/,"");return/^[0-9a-fA-F]{6}$/.test(t)?Number.parseInt(t,16):null}function Sr(i,t){return Sv(t)??nv[i]??zr}function wv(i,t={}){var r;const e=Array.isArray(i==null?void 0:i.players)?i.players.filter(Boolean):[],n=o=>o!=null&&e.some(a=>a.id===o);if(n(t.localId))return t.localId;if(n(i==null?void 0:i.localId))return i.localId;if(n(i==null?void 0:i.selfId))return i.selfId;if(n(i==null?void 0:i.playerId))return i.playerId;if(n(t.followId))return t.followId;const s=e.find(o=>o.kind==="human"||o.isLocal===!0);return s?s.id:n(Lo)?Lo:((r=e[0])==null?void 0:r.id)??Lo}function bv(i){var r;const t=(i==null?void 0:i.arena)??{},e=Ht(t.radius,Ht(i==null?void 0:i.arenaRadius,Ht((r=i==null?void 0:i.config)==null?void 0:r.arenaRadius,xv))),n=Ht(t.tileSize,Mv),s=Ht(t.cols,Math.ceil(e*2/n));return{radius:e,tileSize:n,cols:s,origin:Ht(t.origin,-(s*n)/2),floorY:Ht(t.floorY,0),brokenCount:Ht(t.brokenCount,0)}}function Ev(i){return i.alive===!1||i.broken===!0||i.destroyed===!0?!0:Ht(i.hp,1)<=0}function Tv(i,t){var s;const e=((s=i==null?void 0:i.arena)==null?void 0:s.tiles)??(i==null?void 0:i.tiles);if(!Array.isArray(e))return[];const n=[];for(let r=0;r<e.length;r++){const o=e[r];if(!o||typeof o!="object"||!Number.isFinite(o.x))continue;const a=Number.isFinite(o.i)?o.i:r,l=Ht(o.maxHp,Ht(o.hpMax,1)),c=Ht(o.hp,l),u=Ev(o);n.push({key:String(o.id??a),index:a,x:o.x,z:Ht(o.z,Ht(o.y,0)),size:Ht(o.size,t.tileSize),seam:o.seam===!0,zone:Ht(o.zone,0),hp:c,maxHp:l,crack:u?1:Yu(Number.isFinite(o.crack)?o.crack:1-c/Math.max(l,1e-6),0,1),broken:u})}return n}function Av(i){const t=Array.isArray(i==null?void 0:i.players)?i.players:[],e=[];for(const n of t){if(!n||n.id==null)continue;const s=n.activeGloveId??n.gloveId??null,r=Ht(n.activeSlot,0),o=n.gloveId??s,a=n.offhandId??s;e.push({id:n.id,kind:n.kind??"bot",skinId:typeof n.skinId=="string"&&n.skinId.length>0?n.skinId:null,x:Ht(n.x),y:Ht(n.y),z:Ht(n.z),yaw:Ht(n.yaw),speed:Ht(n.speed,Math.hypot(Ht(n.vx),Ht(n.vz))),alive:n.alive!==!1,grounded:n.grounded!==!1,invulnT:Ht(n.invulnT),respawnT:Ht(n.respawnT),awakenedT:Ht(n.awakenedT),awakened:n.awakened===!0||Ht(n.awakenedT)>0,meter:Ht(n.meter),combo:Ht(n.combo),attackPhase:n.attackPhase??n.phase??"idle",activeSlot:r,mainId:o,offhandId:a,activeGloveId:s,tint:Sr(s,n.gloveColor??n.color),mainTint:Sr(o,r===0?n.gloveColor??n.color:null),offTint:Sr(a,r===1?n.gloveColor??n.color:null)})}return e}function Cv(i){var n;const t=Array.isArray((n=i==null?void 0:i.combat)==null?void 0:n.ghosts)?i.combat.ghosts:Array.isArray(i==null?void 0:i.ghosts)?i.ghosts:[],e=[];for(const s of t){if(!s||typeof s!="object"||!Number.isFinite(s.x)||!Number.isFinite(s.z))continue;const r=Math.max(0,Ht(s.ttl));e.push({id:s.id??null,ownerId:s.ownerId??null,x:s.x,y:Ht(s.y),z:s.z,yaw:Ht(s.yaw),ttl:r,ttl0:Math.max(r,Ht(s.ttl0,r)),fake:s.fake===!0,gloveId:typeof s.gloveId=="string"?s.gloveId:null})}return e}const hi={halfWidth:7.5,length:39,portalRadius:2.4,interactRadius:2,pedestalRadius:.6,pedestalHeight:.95};function qu(i){const t=typeof(i==null?void 0:i.phase)=="string"?i.phase.trim().toLowerCase():null;return t==="hub"||t==="arena"?t:null}function Rv(i,t){const e=Array.isArray(i==null?void 0:i.pedestals)?i.pedestals:[],n=[];for(let s=0;s<e.length;s++){const r=e[s];if(!r||typeof r!="object")continue;const o=typeof r.gloveId=="string"?r.gloveId:null;if(!o)continue;const l=(r.slot==="main"||r.slot==="off"?r.slot:null)??(o===t.mainGloveId?"main":o===t.offGloveId?"off":null);n.push({gloveId:o,x:Ht(r.x),y:Ht(r.y,t.floorY),z:Ht(r.z,t.origin.z),yaw:Ht(r.yaw),row:r.row==="right"?"right":r.row==="left"?"left":r.x>t.origin.x?"right":"left",index:Number.isFinite(r.index)?r.index:Math.floor(s/2),height:Ht(r.height,t.pedestalHeight),unlocked:r.unlocked!==!1,slot:l,selected:r.selected===!0||l!==null,focused:r.focused===!0||t.focusGloveId!=null&&o===t.focusGloveId,name:typeof r.name=="string"?r.name:null,tint:Sr(o,r.color??r.tint)})}return n}function Pv(i){var g,v,m,p,y,M,x,q,R,L,N,T,_,P,V,H;const t=i!=null&&i.hub&&typeof i.hub=="object"?i.hub:null,e=qu(i),n=!!t&&Array.isArray(t.pedestals)&&t.pedestals.length>0,s=e==="hub"?!0:e==="arena"?!1:n,r={x:Ht((g=t==null?void 0:t.origin)==null?void 0:g.x,0),y:Ht((v=t==null?void 0:t.origin)==null?void 0:v.y,0),z:Ht((m=t==null?void 0:t.origin)==null?void 0:m.z,0)},o=Ht(t==null?void 0:t.floorY,r.y),a=Math.max(1.5,Ht((p=t==null?void 0:t.walkway)==null?void 0:p.halfWidth,hi.halfWidth)),l=Ht((y=t==null?void 0:t.walkway)==null?void 0:y.minZ,r.z-hi.length/2),c=Ht((M=t==null?void 0:t.walkway)==null?void 0:M.maxZ,r.z+hi.length/2),u=Math.max(.2,Ht(t==null?void 0:t.pedestalHeight,hi.pedestalHeight)),h=typeof(t==null?void 0:t.mainGloveId)=="string"?t.mainGloveId:null,d=typeof(t==null?void 0:t.offGloveId)=="string"?t.offGloveId:null,f=typeof(t==null?void 0:t.focusGloveId)=="string"?t.focusGloveId:null;return{active:s,phase:e??(n?"hub":"arena"),layoutId:typeof(t==null?void 0:t.layoutId)=="string"?t.layoutId:null,origin:r,floorY:o,walkway:{halfWidth:a,minZ:Math.min(l,c),maxZ:Math.max(l,c)},spawn:{x:Ht((x=t==null?void 0:t.spawn)==null?void 0:x.x,r.x),y:Ht((q=t==null?void 0:t.spawn)==null?void 0:q.y,o),z:Ht((R=t==null?void 0:t.spawn)==null?void 0:R.z,c-4),yaw:Ht((L=t==null?void 0:t.spawn)==null?void 0:L.yaw,0)},portal:{x:Ht((N=t==null?void 0:t.portal)==null?void 0:N.x,r.x),y:Ht((T=t==null?void 0:t.portal)==null?void 0:T.y,o),z:Ht((_=t==null?void 0:t.portal)==null?void 0:_.z,l+4),radius:Math.max(.8,Ht((P=t==null?void 0:t.portal)==null?void 0:P.radius,hi.portalRadius)),ready:(t==null?void 0:t.portalReady)===!0||((V=t==null?void 0:t.portal)==null?void 0:V.ready)===!0,near:(t==null?void 0:t.portalNear)===!0||((H=t==null?void 0:t.portal)==null?void 0:H.near)===!0},interactRadius:Math.max(.5,Ht(t==null?void 0:t.interactRadius,hi.interactRadius)),pedestalRadius:Math.max(.2,Ht(t==null?void 0:t.pedestalRadius,hi.pedestalRadius)),pedestalHeight:u,focusGloveId:f,mainGloveId:h,offGloveId:d,pedestals:Rv(t,{origin:r,floorY:o,pedestalHeight:u,focusGloveId:f,mainGloveId:h,offGloveId:d})}}const Iv={slapstart:"swing",slap:"slap",hit:"hit",skill:"skill",ko:"ko",awaken:"awaken",awakenend:"awakenEnd",dash:"dash",jump:"jump",respawn:"respawn",switch:"switch",tilecrack:"tileCrack",tilebreak:"tileBreak",matchover:"matchOver",slapwindup:"swing",slapwhiff:"slap",ghostslap:"slap",skillcast:"skill",skillhit:"hit",meteorimpact:"heavy",parry:"heavy",kill:"ko"};function Lv(i){return String(i??"").toLowerCase().replace(/[_\-\s]/g,"")}function Dv(i,t){const e=i.power??i.impulse??i.strength??i.damage;return Number.isFinite(e)?Yu(e/yv,.3,2.6):t==="heavy"?1.6:1}function Uv(i){const t=Array.isArray(i==null?void 0:i.events)?i.events:[],e=[];for(const n of t){if(!n)continue;const s=Lv(n.type??n.kind),r=Iv[s]??null;if(!r)continue;let o=n.attackerId??n.playerId??n.ownerId??n.killerId??n.by??n.attacker??n.owner??n.id??null,a=n.targetId??n.target??n.victimId??null;r==="ko"&&(a=n.victimId??n.id??a,o=n.killerId??n.by??null),e.push({kind:r,type:n.type??r,actorId:o,targetId:a,gloveId:n.gloveId??null,skillId:n.skillId??null,tileIndex:Number.isFinite(n.i)?n.i:null,tileId:n.tileId??null,x:Number.isFinite(n.x)?n.x:null,y:Number.isFinite(n.y)?n.y:null,z:Number.isFinite(n.z)?n.z:null,yaw:Number.isFinite(n.yaw)?n.yaw:null,hits:Number.isFinite(n.hits)?n.hits:s==="slapwhiff"?0:null,power:Dv(n,r),t:Ht(n.t,Ht(i==null?void 0:i.time,0))})}return e}function Nv(i,t={}){var s;const e=i&&typeof i=="object"?i:{},n=bv(e);return{time:Ht(e.time,Ht(e.t,0)),tick:Number.isFinite(e.tick)?e.tick:null,alpha:Ht(e.alpha,1),over:((s=e.match)==null?void 0:s.over)===!0||e.over===!0,localId:wv(e,t),phase:qu(e),hub:Pv(e),arena:n,tiles:Tv(e,n),players:Av(e),ghosts:Cv(e),events:Uv(e)}}function Pr(i,t=!1){const e=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),s=new Set(Object.keys(i[0].morphAttributes)),r={},o={},a=i[0].morphTargetsRelative,l=new ye;let c=0;for(let u=0;u<i.length;++u){const h=i[u];let d=0;if(e!==(h.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const f in h.attributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;r[f]===void 0&&(r[f]=[]),r[f].push(h.attributes[f]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of attributes."),null;if(a!==h.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const f in h.morphAttributes){if(!s.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+".  .morphAttributes must be consistent throughout all geometries."),null;o[f]===void 0&&(o[f]=[]),o[f].push(h.morphAttributes[f])}if(t){let f;if(e)f=h.index.count;else if(h.attributes.position!==void 0)f=h.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,f,u),c+=f}}if(e){let u=0;const h=[];for(let d=0;d<i.length;++d){const f=i[d].index;for(let g=0;g<f.count;++g)h.push(f.getX(g)+u);u+=i[d].attributes.position.count}l.setIndex(h)}for(const u in r){const h=zc(r[u]);if(!h)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" attribute."),null;l.setAttribute(u,h)}for(const u in o){const h=o[u][0].length;if(h===0)break;l.morphAttributes=l.morphAttributes||{},l.morphAttributes[u]=[];for(let d=0;d<h;++d){const f=[];for(let v=0;v<o[u].length;++v)f.push(o[u][v][d]);const g=zc(f);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" morphAttribute."),null;l.morphAttributes[u].push(g)}}return l}function zc(i){let t,e,n,s=-1,r=0;for(let c=0;c<i.length;++c){const u=i[c];if(t===void 0&&(t=u.array.constructor),t!==u.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=u.itemSize),e!==u.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=u.normalized),n!==u.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=u.gpuType),s!==u.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=u.count*e}const o=new t(r),a=new Se(o,e,n);let l=0;for(let c=0;c<i.length;++c){const u=i[c];if(u.isInterleavedBufferAttribute){const h=l/e;for(let d=0,f=u.count;d<f;d++)for(let g=0;g<e;g++){const v=u.getComponent(d,g);a.setComponent(d+h,g,v)}}else o.set(u.array,l);l+=u.count*e}return s!==void 0&&(a.gpuType=s),a}const vi=Math.PI*2,pr=1,Nn=Object.freeze({duration:.62,windupEnd:.34,strikeEnd:.52}),Fv=.95,Ov=.54,kv=1.4,zv=.16,Bv=.26,Hv=-Math.PI/2;function Gv(i){return-i*(i<0?Fv:Ov)}const Vv=6,Wv=80,Xv=16,Yv=new Set(["hood","turban"]);function Bc(i){i.updateWorldMatrix(!0,!0);const t=new Map;i.traverse(n=>{if(!n.isMesh)return;const s=n.userData.matKey??"cloth",r=n.geometry.clone();r.applyMatrix4(n.matrixWorld),t.has(s)||t.set(s,[]),t.get(s).push(r)});const e=new Map;for(const[n,s]of t){if(s.length===1){e.set(n,s[0]);continue}const r=Pr(s,!1);for(const o of s)o.dispose();r&&e.set(n,r)}return e}const Hc=new Tn(new O(0,1.1,0),2.6),qv=new gn({color:0}),Zv={cloth:"clothSurface",clothDim:"clothSurface",leather:"leatherSurface",leatherWorn:"leatherSurface",skin:"plainSurface",accent:"plainSurface",paint:"paintSurface",paintMain:"paintSurface",paintOff:"paintSurface"},Kv=["cloth","clothDim","clothSurface","leather","leatherWorn","leatherSurface","skin","accent","plainSurface"];function re(i,t,e){const n=t[Zv[e]]??t[e],s=new Yt(i,n);return n.vertexColors&&(s.userData.tintSource=e),s}function Jv(i,t){i.updateMatrixWorld(!0);const e=new Qt().copy(i.matrixWorld).invert(),n=new Qt,s=[],r=new Map,o=[];i.traverse(h=>{h.isMesh&&!h.isSkinnedMesh&&!t.has(h)&&o.push(h)});const a=[];for(const h of o){const d=s.length;s.push(h);const f=h.geometry.clone();f.applyMatrix4(n.multiplyMatrices(e,h.matrixWorld));const g=f.attributes.position.count,v=new Uint16Array(g*4),m=new Float32Array(g*4);for(let y=0;y<g;y++)v[y*4]=d,m[y*4]=1;if(f.setAttribute("skinIndex",new Se(v,4)),f.setAttribute("skinWeight",new Se(m,4)),h.layers.isEnabled(el)&&a.push(f.clone()),h.material.vertexColors&&!f.attributes.color){const y=new Float32Array(g*3).fill(1);f.setAttribute("color",new Se(y,3))}let p=r.get(h.material);p||(p={geos:[],cast:!1,receive:!1,layers:0,bloomSelf:!1,verts:0,ranges:[]},r.set(h.material,p)),p.ranges.push({source:h,start:p.verts,count:g}),p.verts+=g,p.geos.push(f),p.cast||(p.cast=h.castShadow),p.receive||(p.receive=h.receiveShadow),p.layers|=h.layers.mask&-5,p.bloomSelf||(p.bloomSelf=!!h.userData.bloomSelf),h.visible=!1}const l=new Xa(s),c=[],u=new Map;for(const[h,d]of r){const f=d.geos.length===1?d.geos[0]:Pr(d.geos,!1);if(!f)continue;if(d.geos.length>1)for(const v of d.geos)v.dispose();const g=new fc(f,h);g.castShadow=d.cast,g.receiveShadow=d.receive,g.layers.mask=d.layers,d.bloomSelf&&(g.userData.bloomSelf=!0),g.userData.ranges=d.ranges,g.boundingSphere=Hc.clone(),i.add(g),g.bind(l,i.matrixWorld),c.push(g),u.set(h,g)}if(a.length>0){const h=a.length===1?a[0]:Pr(a,!1);if(a.length>1)for(const d of a)d.dispose();if(h){const d=new fc(h,qv);d.name="bloom-occluder",d.visible=!1,d.userData.emissiveOnly=!0,d.boundingSphere=Hc.clone(),kn(d),i.add(d),d.bind(l,i.matrixWorld),c.push(d)}}return{meshes:c,skeleton:l,byMaterial:u}}function Gc(i,t){var n,s,r;const e=(s=(n=i==null?void 0:i.geometry)==null?void 0:n.attributes)==null?void 0:s.color;if(e){for(const o of i.userData.ranges){const a=(r=t[o.source.userData.tintSource])==null?void 0:r.color;if(a)for(let l=o.start;l<o.start+o.count;l++)e.setXYZ(l,a.r,a.g,a.b)}e.needsUpdate=!0}}function $v(i,t){let e=(t-i)%vi;return e>Math.PI&&(e-=vi),e<-Math.PI&&(e+=vi),e}function Jn(i,t,e,n){return i+(t-i)*(1-Math.exp(-e*n))}function Vc(i){return i<0?0:i>1?1:i}function Wc(i){return Math.max(.35,Math.min(2,Number.isFinite(i)?i:1))}function ki(i,t){const e=new ut(Number.isFinite(i)?i:zr);if(t)return e;const n={h:0,s:0,l:0};return e.getHSL(n),e.setHSL(n.h,n.s*.45,n.l*.92)}function mr(i,t,e=.6){const n=new ut(typeof i=="string"?i:"#6d7280"),s={h:0,s:0,l:0};return n.getHSL(s),n.setHSL(s.h,s.s*(t?.75:.4),s.l),n.lerp(new ut(Ut.cloth),1-e)}function jv({scene:i,quality:t,textures:e,skins:n=null,seed:s=null}){const r=n||sl(null),o=Number.isFinite(s)?ii(s+131):Math.random,a=new ge;a.name="characters",i.add(a);const l=[],c=C=>(l.push(C),C),u=t.capsuleSegments,h={torso:c(new pn(.3,.44,Math.max(3,u/2),u)),hips:c(new pn(.26,.16,3,u)),thigh:c(new pn(.15,.34,3,Math.max(5,u-2))),shin:c(new pn(.12,.3,3,Math.max(5,u-2))),foot:c(new pe(.19,.11,.34)),upperArm:c(new pn(.1,.26,3,Math.max(5,u-2))),head:c(new De(.22,u+2,u)),hood:c(new De(.245,u+2,u,0,vi,0,Math.PI*.62)),collar:c(new be(.24,.31,.16,u+2,1,!0)),strapChest:c(new pe(.1,.62,.035)),buckle:c(new pe(.09,.07,.05)),backPanel:c(new pe(.29,.4,.04)),mitt:c(new De(.34,u+3,u+1)),knuckle:c(new Ze(.3,.045,5,u+4,Math.PI*1.05)),stud:c(new pe(.07,.06,.055)),cuff:c(new be(.19,.24,.22,u+2)),tassel:c(new pe(.045,.2,.02)),seam:c(new Ze(.318,.014,4,u+6,Math.PI*1.35)),contact:c(new Nr(.62,16)),cap:c(new De(.235,u+2,u,0,vi,0,Math.PI*.36)),hoodDeep:c(new De(.28,u+2,u,0,vi,0,Math.PI*.72)),cowl:c(new be(.31,.2,.22,u+2,1,!0)),horn:c(new Fr(.062,.36,Math.max(4,u-4))),maskShell:c(new be(.21,.18,.3,Math.max(6,u),1,!0,Math.PI-.95,1.9)),brow:c(new pe(.3,.045,.05)),plate:c(new pe(.27,.055,.25)),cloakSheet:c(new pe(.52,.98,.05)),pole:c(new be(.022,.018,1.15,5)),flag:c(new pe(.26,.74,.018)),turbanRing:c(new Ze(.2,.078,5,u+4)),sashBand:c(new pe(.17,.9,.05)),wrapBand:c(new be(.118,.118,.14,u)),bracerShell:c(new be(.16,.135,.32,u+1))};h.gloveMetal=c((()=>{const C=new Jt,G=new Yt(h.knuckle,null);G.userData.matKey="metal",G.rotation.set(Math.PI*.5,Math.PI,Math.PI*.02),G.position.set(0,.02,-.06),C.add(G);for(let z=0;z<3;z++){const b=new Yt(h.stud,null);b.userData.matKey="metal";const W=-.5+z*.5;b.position.set(Math.sin(W)*.28,.16,-Math.cos(W)*.26),b.rotation.y=-W,C.add(b)}return Bc(C).get("metal")})());const d=c(new gn({color:856087,transparent:!0,opacity:.32,depthWrite:!1}));function f(C,G=!1){return new se({color:C,vertexColors:G,roughnessMap:e.cloth.rough,normalMap:t.normalMaps?e.cloth.normal:null,normalScale:new Tt(.4,.4),roughness:.86,metalness:0,envMapIntensity:.28})}function g(){return new se({color:1182728,roughness:.5,metalness:.2,emissive:new ut(Ut.crackCore),emissiveIntensity:0,toneMapped:!0})}function v(C,G,z){const b=ki(C.active,G),W=ki(C.main,G),rt=ki(C.off,G),dt={color:mr(z.cloth,G).lerp(b,.12),roughness:.96,metalness:0,roughnessMap:e.cloth.rough,normalMap:e.cloth.normal,normalScale:new Tt(.5,.5),envMapIntensity:.35},B=t.sheenCloth?new Hg({...dt,sheen:.3,sheenRoughness:.9,sheenColor:new ut(8226711)}):new se(dt),X=new se({color:mr(z.trim,G,.7).lerp(new ut(Ut.clothDim),.45),roughness:.98,metalness:0,roughnessMap:e.cloth.rough,normalMap:e.cloth.normal,normalScale:new Tt(.4,.4),envMapIntensity:.3}),I=new se({color:new ut(Ut.leather),roughness:.78,metalness:0,roughnessMap:e.leather.rough,normalMap:e.leather.normal,normalScale:new Tt(.9,.9),envMapIntensity:.5}),it=new se({color:new ut(Ut.leatherWorn),roughness:.62,metalness:0,roughnessMap:e.leather.rough,normalMap:e.leather.normal,normalScale:new Tt(.7,.7),envMapIntensity:.6}),J=new se({color:new ut(Ut.metal),roughness:.42,metalness:.92,roughnessMap:e.metal.rough,normalMap:e.metal.normal,normalScale:new Tt(.5,.5),envMapIntensity:1}),ft=new se({color:new ut(Ut.skin),roughness:.66,metalness:0,envMapIntensity:.4}),Ct=new se({color:mr(z.accent,G,.72),roughness:.72,metalness:0,envMapIntensity:.45}),It=t.sheenCloth?null:new se({color:16777215,vertexColors:!0,roughness:.97,metalness:0,roughnessMap:e.cloth.rough,normalMap:e.cloth.normal,normalScale:new Tt(.45,.45),envMapIntensity:.33}),Bt=new se({color:16777215,vertexColors:!0,roughness:.68,metalness:0,roughnessMap:e.leather.rough,normalMap:e.leather.normal,normalScale:new Tt(.8,.8),envMapIntensity:.56}),Mt=new se({color:16777215,vertexColors:!0,roughness:.69,metalness:0,envMapIntensity:.42});return{cloth:B,clothDim:X,clothSurface:It,leather:I,leatherWorn:it,leatherSurface:Bt,metal:J,skin:ft,accent:Ct,plainSurface:Mt,paint:f(b),paintMain:f(W),paintOff:f(rt),paintSurface:f(16777215,!0),seamMain:g(),seamOff:g(),ident:b}}function m(C,G,z,b){const W=new ge,rt=re(h.mitt,C,"leather");rt.scale.set(1,.86,1.16),rt.castShadow=t.shadows,W.add(rt);const dt=re(h.mitt,C,"leatherWorn");dt.scale.set(.86,.6,.9),dt.position.set(0,-.13,-.06),W.add(dt);const B=re(h.gloveMetal,C,"metal");B.castShadow=t.shadows&&t.propShadows,W.add(B);const X=re(h.stud,C,z);X.scale.set(3.4,.55,1.2),X.position.set(0,.07,.24),W.add(X);const I=re(h.cuff,C,"cloth");I.position.set(0,.3,.02),I.rotation.x=-.15,I.castShadow=t.shadows&&t.propShadows,W.add(I);const it=re(h.tassel,C,"clothDim");it.position.set(G*.14,.26,.14),W.add(it);const J=new Yt(h.seam,b);return J.rotation.set(Math.PI*.5,Math.PI,Math.PI*.32),J.position.set(0,-.02,-.02),J.layers.enable(Br),J.userData.bloomSelf=!0,W.add(J),W.userData={tassel:it,seam:J,mitt:rt,stripe:X},W}function p(C,G){const{body:z,arms:b,mats:W}=G,rt=[],dt=(B,X)=>(B.castShadow=t.shadows&&t.propShadows,(X??z).add(B),rt.push(B),B);switch(C){case"hood":{const B=dt(re(h.hoodDeep,W,"cloth"));B.position.set(0,1.82,.03),B.rotation.x=.2,B.scale.set(1.06,1.12,1.12);const X=dt(re(h.cowl,W,"clothDim"));X.position.y=1.62;break}case"turban":{const B=dt(re(h.turbanRing,W,"cloth"));B.position.y=1.86,B.rotation.x=Math.PI/2+.12,B.scale.set(1.12,1.12,.86);const X=dt(re(h.cap,W,"cloth"));X.position.y=1.92,X.scale.set(.94,.7,.94);const I=dt(re(h.tassel,W,"clothDim"));I.position.set(.05,1.68,.2),I.scale.set(1.7,1.5,1.6);break}case"horns":{for(const B of[-1,1]){const X=dt(re(h.horn,W,"accent"));X.position.set(B*.17,1.9,.02),X.rotation.set(-.5,0,B*-.75);const I=dt(re(h.horn,W,"accent"));I.position.set(B*.3,2.02,.16),I.rotation.set(-1.15,0,B*-1.1),I.scale.setScalar(.72)}break}case"mask":{const B=dt(re(h.maskShell,W,"accent"));B.position.set(0,1.79,-.04),B.scale.set(1.06,1.12,1.06);const X=dt(re(h.brow,W,"clothDim"));X.position.set(0,1.9,-.19),X.rotation.x=.22;break}case"pauldron":{for(const B of b)for(let X=0;X<3;X++){const I=dt(re(h.plate,W,"metal"),B.shoulder);I.position.set(B.side*(.02+X*.035),.06-X*.075,0),I.rotation.z=B.side*(.18+X*.16),I.scale.setScalar(1-X*.12)}break}case"cloak":{const B=dt(re(h.cloakSheet,W,"cloth"));B.position.set(0,1.06,.31),B.rotation.x=-.07,B.scale.set(1,1,1);const X=dt(re(h.cloakSheet,W,"clothDim"));X.position.set(-.2,.62,.3),X.rotation.set(-.16,.24,.08),X.scale.set(.42,.5,.8);const I=dt(re(h.cloakSheet,W,"clothDim"));I.position.set(.2,.62,.3),I.rotation.set(-.16,-.24,-.08),I.scale.set(.42,.5,.8);break}case"banner":{const B=dt(re(h.pole,W,"leather"));B.position.set(-.12,1.62,.34),B.rotation.z=.16;const X=dt(re(h.flag,W,"accent"));X.position.set(-.26,1.86,.36),X.rotation.z=.16,dt(re(h.buckle,W,"metal")).position.set(-.06,1.3,.33);break}case"sash":{const B=dt(re(h.sashBand,W,"accent"));B.position.set(-.05,1.24,-.28),B.rotation.z=.42,dt(re(h.buckle,W,"leather")).position.set(-.22,.94,-.24);const I=dt(re(h.tassel,W,"clothDim"));I.position.set(-.24,.78,-.2),I.scale.set(1.6,2.2,1.6);break}case"bracer":{for(const B of b){const X=dt(re(h.bracerShell,W,"leatherWorn"),B.wrist);X.position.y=-.04;const I=dt(re(h.wrapBand,W,"metal"),B.wrist);I.position.y=-.19,I.scale.set(1.35,.42,1.35)}break}case"wrap":default:{for(const X of b){const I=dt(re(h.wrapBand,W,"clothDim"),X.wrist);I.position.y=-.02,I.scale.set(1.08,1.5,1.08)}const B=dt(re(h.turbanRing,W,"clothDim"));B.position.y=.92,B.rotation.x=Math.PI/2,B.scale.set(1.32,1.32,.5);break}}return rt}function y(C,G,z){const b=v(C,G,z),W=new ge,rt=new ge,dt=z.build;rt.scale.set(dt.mass,dt.height,dt.mass),W.add(rt);const B=.82+dt.shoulder*.18,X=Yv.has(z.accessory),I=new Jt,it=(D,ct,nt)=>{const E=new Yt(D,null);return E.userData.matKey=ct,nt==null||nt(E),I.add(E),E};it(h.hips,"clothDim",D=>{D.position.y=.86}),it(h.torso,"cloth",D=>{D.position.y=1.24,D.scale.x=B}),it(h.strapChest,"leather",D=>{D.position.set(.06,1.26,-.27),D.rotation.z=-.24}),it(h.buckle,"metal",D=>{D.position.set(.12,1.06,-.3)}),it(h.collar,"clothDim",D=>{D.position.y=1.58,D.scale.set(B,1,1)}),it(h.backPanel,"clothDim",D=>{D.position.set(0,1.26,.305),D.rotation.x=-.06,D.scale.set(1.22,1.16,.6)}),it(h.backPanel,"paint",D=>{D.position.set(0,1.26,.315),D.rotation.x=-.06}),it(h.head,"skin",D=>{D.position.y=1.79}),X||it(h.cap,"cloth",D=>{D.position.y=1.8,D.rotation.x=.16});const J=Bc(I),ft=[],Ct=new Set(["cloth","clothDim","skin"]),It=new Set(["cloth","clothDim","skin"]);for(const[D,ct]of J){const nt=re(ct,b,D);nt.castShadow=t.shadows&&(It.has(D)||t.propShadows),D==="cloth"&&(nt.receiveShadow=t.shadows),Ct.has(D)&&kn(nt),rt.add(nt),ft.push(nt)}const Bt=[];for(const D of[-1,1]){const ct=new ge;ct.position.set(D*.16,.84,0),rt.add(ct);const nt=re(h.thigh,b,"clothDim");nt.position.y=-.24,nt.castShadow=t.shadows,ct.add(nt);const E=new ge;E.position.y=-.46,ct.add(E);const S=re(h.shin,b,"clothDim");S.position.y=-.2,S.castShadow=t.shadows,E.add(S);const et=re(h.foot,b,"leather");et.position.set(0,-.38,-.06),E.add(et),Bt.push({hip:ct,knee:E,side:D})}const Mt=[];for(const D of[-1,1]){const ct=D===pr,nt=new ge;nt.rotation.order="YXZ",nt.position.set(D*.33*dt.shoulder,1.46,0),rt.add(nt);const E=re(h.upperArm,b,"cloth");E.position.y=-.2,E.castShadow=t.shadows,nt.add(E);const S=new ge;S.position.y=-.46,nt.add(S);const et=m(b,D,ct?"paintMain":"paintOff",ct?b.seamMain:b.seamOff);et.position.y=-.22,S.add(et),Mt.push({shoulder:nt,wrist:S,glove:et,side:D,slot:ct?0:1,roll:0})}const Et=p(z.accessory,{body:rt,arms:Mt,mats:b}),U=new Yt(h.contact,d.clone());U.rotation.x=-Math.PI/2,U.position.y=.02,U.renderOrder=1,U.scale.setScalar(.86+dt.mass*.18),W.add(U);const w=Jv(W,new Set([U])),K=w.meshes.filter(D=>D.material.vertexColors);for(const D of K)Gc(D,b);const $=w.byMaterial.get(b.paintSurface)??null;return{rootGroup:W,paintMesh:$,tinted:K,body:rt,mats:b,legs:Bt,arms:Mt,skinned:w,bodyParts:ft,contact:U,look:z,accessory:Et,baseScale:{x:dt.mass,y:dt.height,z:dt.mass},contactScale:.86+dt.mass*.18}}const M=new Map,x=new O;function q(C){return{active:C.tint,main:C.mainTint??C.tint,off:C.offTint??C.tint}}function R(C,G){const z=C.isLocal,b=ki(G.tint,z);C.mats.paint.color.copy(b),C.mats.paintMain.color.copy(ki(G.mainTint??G.tint,z)),C.mats.paintOff.color.copy(ki(G.offTint??G.tint,z)),C.mats.cloth.color.copy(mr(C.look.cloth,z)).lerp(b,.12);for(const W of C.tinted)Gc(W,C.mats);C.activeGloveId=G.activeGloveId,C.mainId=G.mainId,C.offhandId=G.offhandId}function L(C,G){const z=vv(C.skinId,r),b=y(q(C),G,z);a.add(b.rootGroup);const W={id:C.id,...b,isLocal:G,skinId:C.skinId??null,activeGloveId:C.activeGloveId,mainId:C.mainId,offhandId:C.offhandId,activeSlot:C.activeSlot??0,pos:new O(C.x??0,C.y??0,C.z??0),prev:new O(C.x??0,C.y??0,C.z??0),yaw:C.yaw??0,speed:0,stride:0,slapT:-1,slapSide:pr,slapPower:1,hitT:-1,awaken:0,breathe:o()*vi};return M.set(C.id,W),W}function N(C){var G,z;a.remove(C.rootGroup);for(const b of Object.keys(C.mats))(z=(G=C.mats[b])==null?void 0:G.dispose)==null||z.call(G);for(const b of C.bodyParts)b.geometry.dispose();for(const b of C.skinned.meshes)b.geometry.dispose();C.skinned.skeleton.dispose(),C.contact.material.dispose()}const T=new ge;T.name="ghosts",T.visible=!1,a.add(T);const _=[];let P=0;const V={x:1,y:1,z:1},H=new ut(2830400),k=new ut(zr);function j(){const C=new se({color:H.clone(),roughness:.95,metalness:0,transparent:!0,opacity:0,depthWrite:!1,envMapIntensity:.2}),G=new ge,z=(W,rt)=>{const dt=new Yt(W,C);return dt.position.y=rt,G.add(dt),dt};z(h.hips,.86),z(h.torso,1.24),z(h.head,1.79);for(const W of[-1,1]){const rt=new Yt(h.mitt,C);rt.position.set(W*.38,1.02,-.1),rt.scale.set(.88,.74,1.02),G.add(rt)}G.visible=!1,G.renderOrder=2,T.add(G);const b={group:G,mat:C};return _.push(b),b}return{root:a,chars:M,get(C){return M.get(C)},reconcile(C,G){const z=new Set;for(const b of C){if(!b||b.id==null)continue;z.add(b.id);let W=M.get(b.id);const rt=b.id===G,dt=b.skinId??null;if(W&&(W.skinId!==dt||W.isLocal!==rt)){const B={pos:W.pos.clone(),prev:W.prev.clone(),yaw:W.yaw,speed:W.speed};N(W),M.delete(b.id),W=L(b,rt),W.pos.copy(B.pos),W.prev.copy(B.prev),W.yaw=B.yaw,W.speed=B.speed}else W?(b.activeGloveId!==W.activeGloveId||b.mainId!==W.mainId||b.offhandId!==W.offhandId)&&R(W,b):W=L(b,rt);W.activeSlot=b.activeSlot??0,W.target=b}for(const[b,W]of M)z.has(b)||(N(W),M.delete(b))},playSlap(C,G=1,z=null){const b=M.get(C);return b?(b.slapT=0,b.slapPower=Wc(G),b.slapSide=z??(b.activeSlot===0?pr:-pr),!0):!1},steerSlap(C,{side:G=null,power:z=null}={}){const b=M.get(C);return!b||b.slapT<0?!1:((G===1||G===-1)&&(b.slapSide=G),Number.isFinite(z)&&(b.slapPower=Math.max(b.slapPower,Wc(z))),!0)},playHit(C,G,z=1){const b=M.get(C);b&&(b.hitT=0,b.hitPower=Math.max(.3,Math.min(2.4,z)),b.hitDir=G?x.copy(G).normalize().clone():new O(0,0,1))},update(C,G,z=null){for(const b of M.values()){const W=b.target;if(!W)continue;const rt=W.alive!==!1,dt=!b.isLocal&&z!=null&&Math.hypot((W.x??0)-z.x,(W.z??0)-z.z)>Wv;if(b.rootGroup.visible=rt&&!dt,dt){b.pos.set(W.x??0,W.y??0,W.z??0),b.prev.copy(b.pos),b.rootGroup.position.copy(b.pos),b.yaw=W.yaw??b.yaw,b.rootGroup.rotation.y=b.yaw;continue}if(!rt)continue;b.prev.copy(b.pos);const B=W.x??0,X=W.z??0;Math.hypot(B-b.pos.x,X-b.pos.z)>Xv?(b.pos.set(B,W.y??0,X),b.prev.copy(b.pos),b.speed=0,b.yaw=W.yaw??b.yaw):(b.pos.x=Jn(b.pos.x,B,22,C),b.pos.y=Jn(b.pos.y,W.y??0,24,C),b.pos.z=Jn(b.pos.z,X,22,C)),b.rootGroup.position.copy(b.pos);const I=b.pos.x-b.prev.x,it=b.pos.z-b.prev.z,J=Math.hypot(I,it)/Math.max(C,1e-4);b.speed=Jn(b.speed,J,9,C),b.yaw+=$v(b.yaw,W.yaw??0)*Math.min(1,C*16),b.rootGroup.rotation.y=b.yaw,b.stride+=b.speed*C*2.1;const ft=Math.min(1,b.speed/7),Ct=Math.sin(b.stride*2)*.035*ft,It=Math.sin(b.stride)*.05*ft;b.breathe+=C*1.3,b.body.position.y=Ct+Math.sin(b.breathe)*.008,b.body.rotation.z=-It*.5,b.body.rotation.x=-ft*.11-Math.sin(b.stride*2+1)*.015;for(const E of b.legs){const S=b.stride+(E.side>0?Math.PI:0);E.hip.rotation.x=Math.sin(S)*.62*ft,E.knee.rotation.x=-Math.max(0,-Math.sin(S-.6))*.85*ft}let Bt=0,Mt=0;if(b.slapT>=0){b.slapT+=C/(Nn.duration/b.slapPower);const E=b.slapT;if(E>=1)b.slapT=-1;else if(E<Nn.windupEnd){const S=E/Nn.windupEnd;Bt=-.9*ve(0,1,S),Mt=ve(0,1,Vc(S/.75))}else if(E<Nn.strikeEnd){const S=(E-Nn.windupEnd)/(Nn.strikeEnd-Nn.windupEnd);Bt=-.9+2.6*ve(0,1,S),Mt=1}else{const S=(E-Nn.strikeEnd)/(1-Nn.strikeEnd),et=1-ve(0,1,S);Bt=1.7*et,Mt=et}}b.body.rotation.y=-Bt*Bv;for(const E of b.arms){const S=b.stride+(E.side>0?0:Math.PI),et=Math.sin(S)*.5*ft,yt=E.side===b.slapSide,Z=yt?Bt:Bt*-.3,tt=yt?Mt:Mt*.24,St=Gv(Z),pt=zv*(Math.cos(St)-1);E.shoulder.rotation.x=et+tt*(kv+pt),E.shoulder.rotation.z=E.side*(.16+tt*.1),E.shoulder.rotation.y=St,E.wrist.rotation.x=.28+Math.abs(et)*.4-tt*.34,E.roll=Jn(E.roll,Hv*tt,16,C),E.wrist.rotation.y=E.roll;const xt=E.glove.userData.tassel;xt.rotation.x=Jn(xt.rotation.x,tt*.45+ft*.3,12,C),xt.rotation.z=Jn(xt.rotation.z,-E.side*.2+St*.6,10,C)}const Et=b.baseScale;if(b.hitT>=0)if(b.hitT+=C/.26,b.hitT>=1)b.hitT=-1,b.body.scale.set(Et.x,Et.y,Et.z);else{const E=Math.sin(b.hitT*Math.PI),S=1+E*.16*b.hitPower;b.body.scale.set(Et.x*S,Et.y*(1-E*.13*b.hitPower),Et.z*S*.94),b.body.rotation.x-=E*.22*b.hitPower}const U=(W.awakenedT??0)>0?1:0;b.awaken=Jn(b.awaken,U,5,C);const w=.72+.28*Math.sin(G*6.2),K=b.activeSlot===0;b.mats.seamMain.emissiveIntensity=b.awaken*(K?2.6:.5)*w,b.mats.seamOff.emissiveIntensity=b.awaken*(K?.5:2.6)*w,b.mats.paint.emissive.setHex(Ut.crackCore),b.mats.paint.emissiveIntensity=b.awaken*.35*w,b.mats.paintSurface.emissive.setHex(Ut.crackCore),b.mats.paintSurface.emissiveIntensity=b.awaken*.35*w;const D=(W.invulnT??0)>0?.55+.2*Math.sin(G*9):1;for(const E of Kv){const S=b.mats[E];if(!S)continue;const et=D<.999;S.transparent!==et&&(S.transparent=et,S.needsUpdate=!0),S.opacity=D}const ct=Math.max(0,b.pos.y);b.contact.position.y=.02-b.pos.y;const nt=1-Math.min(1,ct/3.2);b.contact.material.opacity=.34*nt*nt*D,b.contact.scale.setScalar(b.contactScale*(1+ct*.22)),b.contact.visible=b.pos.y>-1.5&&nt>.02}},ghostRoot:T,get ghostCount(){return P},syncGhosts(C){const G=Array.isArray(C)?C:[];let z=0;for(const b of G){if(!b||typeof b!="object")continue;if(z>=Vv)break;const W=_[z]??j();z++;const rt=b.ownerId!=null?M.get(b.ownerId):null,dt=Number.isFinite(b.ttl)?b.ttl:0,B=Number.isFinite(b.ttl0)&&b.ttl0>0?b.ttl0:Math.max(dt,.001),X=Vc(dt/B);W.group.visible=!0,W.group.position.set(b.x??0,b.y??0,b.z??0),W.group.rotation.y=b.yaw??0;const I=(rt==null?void 0:rt.baseScale)??V,it=1+(1-X)*.07;W.group.scale.set(I.x*it,I.y*it,I.z*it);const J=rt?rt.mats.paint.color:k;W.mat.color.copy(H).lerp(J,.28),W.mat.opacity=(b.fake?.46:.3)*X*(.5+.5*X)}for(let b=z;b<_.length;b++)_[b].group.visible=!1;return P=z,T.visible=z>0,z},dispose(){var C;for(const G of M.values())N(G);M.clear();for(const G of _)G.mat.dispose();_.length=0,P=0,i.remove(a);for(const G of l)(C=G.dispose)==null||C.call(G);d.dispose()}}}const Qv=["leather","metal","paint"],t_={cotton:{bulk:1.04,curl:.26,cuff:1,spread:1.06,thumb:.95},granite:{bulk:1.24,curl:.1,cuff:1.18,spread:.92,thumb:1.1},gale:{bulk:.9,curl:.3,cuff:.86,spread:1.14,thumb:.9},frost:{bulk:.98,curl:.16,cuff:1.04,spread:1,thumb:1},spring:{bulk:1.02,curl:.38,cuff:.94,spread:.96,thumb:1.05},afterimage:{bulk:.88,curl:.22,cuff:.9,spread:1.1,thumb:.88},magnet:{bulk:1.1,curl:.14,cuff:1.08,spread:.94,thumb:1.12},meteor:{bulk:1.16,curl:.2,cuff:1.12,spread:.98,thumb:1.08}},e_={bulk:1,curl:.2,cuff:1,spread:1,thumb:1},Oe={back:.94,palm:1.16,finger:1.02,tip:1.1,cuff:.86,metal:1,paint:1};function n_(i,t){const e=i.attributes.position.count,n=new Float32Array(e*3),s=typeof t=="number"?t:(t==null?void 0:t.r)??1,r=typeof t=="number"?t:(t==null?void 0:t.g)??1,o=typeof t=="number"?t:(t==null?void 0:t.b)??1;for(let a=0;a<e;a++)n[a*3]=s,n[a*3+1]=r,n[a*3+2]=o;return i.setAttribute("color",new Se(n,3)),i}function Hi(i){i.updateWorldMatrix(!0,!0);const t=new Map;i.traverse(n=>{if(!n.isMesh)return;const s=n.userData.matKey??"leather",r=n.geometry.clone();if(r.applyMatrix4(n.matrixWorld),n_(r,n.userData.tone??1),!r.index){const o=r.attributes.position.count,a=new Array(o);for(let l=0;l<o;l++)a[l]=l;r.setIndex(a)}t.has(s)||t.set(s,[]),t.get(s).push(r)});const e=new Map;for(const[n,s]of t){const r=Pr(s,!1);for(const o of s)o.dispose();r&&(r.computeBoundingSphere(),e.set(n,r))}return e}function i_({hand:i,shape:t,quality:e}){const n=Math.max(5,Math.min(9,e.capsuleSegments-3)),s={...e_,...t},r=new Jt,o=[],a=(P,V,H,k)=>{const j=new Yt(V,null);return j.userData.matKey=H,j.userData.tone=k,P.add(j),o.push(V),j},l=s.bulk,c=.22*s.cuff,u=a(r,new be(.15*l,.19*l,c,n+2,1,!1),"leather",Oe.cuff);u.position.y=-.36;const h=a(r,new Ze(.163*l,.026,4,n+6),"paint",Oe.paint);h.rotation.x=Math.PI/2,h.position.y=-.3;const d=a(r,new Ze(.172*l,.017,4,n+6),"leather",Oe.cuff);d.rotation.x=Math.PI/2,d.position.y=-.42;const f=new De(.2,n+3,n+1),g=a(r,f,"leather",Oe.back);g.position.y=-.05,g.scale.set(1.04*l,1.12*l,.56*l);const v=a(r,new De(.2,n+2,n),"leather",Oe.palm);v.position.set(0,-.06,-.055*l),v.scale.set(.86*l,.94*l,.3*l);const m=a(r,new De(.2,n,n-1),"leather",Oe.palm*.98);m.position.set(i*.11*l,-.16,-.02),m.scale.set(.42*l,.46*l,.3*l);const p=a(r,new Ze(.17*l,.026,5,n+6,Math.PI*1.1),"metal",Oe.metal);p.rotation.set(0,0,Math.PI*.96),p.position.set(0,.1,-.02);for(let P=0;P<2;P++)a(r,new De(.028,5,4),"metal",Oe.metal).position.set(i*(.07-P*.14)*l,-.2,-.06);const y=a(r,new De(.2,n,n-1),"paint",Oe.paint);y.position.set(0,-.04,.075*l),y.scale.set(.5*l,.2*l,.1*l),y.rotation.z=i*.3;const M=[.2,.225,.2,.155],x=[.045,.047,.043,.037],q=[];for(let P=0;P<4;P++){const V=M[P]*l,H=x[P]*l,k=i*(.108-P*.072)*s.spread*l,j=new Jt;j.position.set(k,.1*l,-.01),j.rotation.z=-i*(P-1.5)*.07,j.rotation.x=-s.curl*.5,r.add(j);const C=a(j,new pn(H,V*.62,2,n),"leather",Oe.finger);C.position.y=V*.31+H*.4;const G=new Jt;G.position.y=V*.62+H*.5,G.rotation.x=-s.curl,j.add(G);const z=a(G,new pn(H*.88,V*.44,2,n),"leather",Oe.finger);z.position.y=V*.22;const b=a(G,new De(H*.92,n,n-2),"leather",Oe.tip);b.position.y=V*.44+H*.2,b.scale.set(1,1.08,.92);const W=a(j,new De(H*1.16,n,n-2),"leather",Oe.finger);W.position.y=H*.2,q.push({joint:j,tipObj:b,length:V})}const R=new Jt;R.position.set(i*.17*l,-.16,-.035),R.rotation.z=-i*.62,R.rotation.x=-.16,r.add(R);const L=a(R,new pn(.05*l*s.thumb,.11*l,2,n),"leather",Oe.finger);L.position.y=.07*l;const N=new Jt;N.position.y=.15*l,N.rotation.z=i*.34,R.add(N);const T=a(N,new pn(.045*l*s.thumb,.09*l,2,n),"leather",Oe.finger);T.position.y=.055*l;const _=a(N,new De(.047*l*s.thumb,n,n-2),"leather",Oe.tip);return _.position.y=.115*l,{root:r,fingers:q,thumbTip:_,born:o}}function s_({quality:i,textures:t}){var a,l,c,u,h;const e=[],n=d=>(e.push(d),d),s=n(new se({color:new ut(Ut.leather).lerp(new ut(Ut.leatherWorn),.5),map:null,roughnessMap:((a=t==null?void 0:t.leather)==null?void 0:a.rough)??null,normalMap:i.normalMaps?((l=t==null?void 0:t.leather)==null?void 0:l.normal)??null:null,normalScale:new Tt(.85,.85),roughness:.76,metalness:0,vertexColors:!0,envMapIntensity:.6})),r=n(new se({color:new ut(Ut.metal),roughnessMap:((c=t==null?void 0:t.metal)==null?void 0:c.rough)??null,normalMap:i.normalMaps?((u=t==null?void 0:t.metal)==null?void 0:u.normal)??null:null,normalScale:new Tt(.5,.5),roughness:.44,metalness:.9,vertexColors:!0,envMapIntensity:.9})),o=n(new se({color:new ut(Ut.rockBody).lerp(new ut(Ut.grime),.35),roughnessMap:((h=t==null?void 0:t.leather)==null?void 0:h.rough)??null,roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.22}));return{leather:s,metal:r,locked:o,build({gloveId:d,hand:f=1,ident:g,unlocked:v=!0}){var N,T;const{root:m,fingers:p,born:y}=i_({hand:f,shape:t_[d],quality:i}),M=Hi(m);for(const _ of y)_.dispose();const x=new se({color:(g??new ut(16777215)).clone(),roughnessMap:((N=t==null?void 0:t.cloth)==null?void 0:N.rough)??null,normalMap:i.normalMaps?((T=t==null?void 0:t.cloth)==null?void 0:T.normal)??null:null,normalScale:new Tt(.35,.35),roughness:.82,metalness:0,vertexColors:!0,envMapIntensity:.3}),q=new ge;q.name=`palm:${d}`;const R={};for(const _ of Qv){const P=M.get(_);if(!P)continue;const V=v?_==="metal"?r:_==="paint"?x:s:o,H=new Yt(P,V);H.castShadow=i.shadows&&(_==="leather"||i.propShadows),H.receiveShadow=!1,q.add(H),R[_]=H}m.updateWorldMatrix(!0,!0);const L=p.map(_=>{const P=new O;_.tipObj.getWorldPosition(P);const V=new O;return _.joint.getWorldPosition(V),{tip:P,base:V,dir:P.clone().sub(V).normalize(),length:_.length}});return q.userData={gloveId:d,hand:f,paint:x,meshes:R,fingers:L,handGeometry:M.get("leather")??null},{group:q,paint:x,meshes:R,fingers:L,setLocked(_){for(const[P,V]of Object.entries(R))V.material=_?o:P==="metal"?r:P==="paint"?x:s},dispose(){for(const _ of Object.values(R))_.geometry.dispose();x.dispose()}}},dispose(){var d;for(const f of e)(d=f.dispose)==null||d.call(f)}}}const je=Math.PI*2,r_=Object.freeze({cotton:"fluff",granite:"grit",gale:"streak",frost:"mist",spring:"coil",afterimage:"ghost",magnet:"pull",meteor:"ember"});function o_(i){return r_[i]??"fluff"}const a_=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,l_=`
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
`;function c_(i,t,e){return i+(t-i)*e}function Xc({root:i,budget:t,texture:e,blending:n,renderOrder:s,rand:r}){const o=Ps({scene:i,budget:t,texture:e,blending:n,depthWrite:!1,renderOrder:s}),a=o.budget,l=new Float32Array(a),c=new Float32Array(a),u=new Float32Array(a),h=new Float32Array(a),d=[l,c,u,h];return{ps:o,emit(f,g,v,m){const p=Rr(o,f,g,v,m,r);return p<0?-1:(l[p]=m.gravity??0,c[p]=m.sway??0,u[p]=m.swayFreq??1.2,h[p]=r()*je,p)},update(f,g,v){const m=o.arrays;for(let p=o.count-1;p>=0;p--){o.life[p]+=f;const y=o.life[p]/o.maxLife[p];if(y>=1){const L=o.count-1;if(p!==L)for(const N of d)N[p]=N[L];nl(o,p);continue}const M=Math.exp(-o.drag[p]*f);o.vel[p*3]*=M,o.vel[p*3+2]*=M,o.vel[p*3+1]=o.vel[p*3+1]*M+l[p]*f;const x=c[p];m.pos[p*3]+=(o.vel[p*3]+Math.sin(g*u[p]+h[p])*x)*f,m.pos[p*3+1]+=o.vel[p*3+1]*f,m.pos[p*3+2]+=(o.vel[p*3+2]+Math.cos(g*u[p]*.83+h[p])*x)*f,m.rot[p]+=o.spin[p]*f,m.size[p]=o.baseSize[p]+o.grow[p]*y;const q=Math.min(1,y/.16),R=1-Math.max(0,(y-.55)/.45);if(m.alpha[p]=o.baseAlpha[p]*q*R*R,v){const L=v(y);m.color[p*3]=L.r,m.color[p*3+1]=L.g,m.color[p*3+2]=L.b}}il(o)},setPixelScale(f){o.mat.uniforms.uPixelScale.value=f},dispose(){o.dispose()}}}function u_({root:i,quality:t,textures:e,seed:n=20240501}){const s=ii(n+733),r=t.name==="low",o=r?.45:t.name==="mid"?.75:1,a=new ge;a.name="hub-vfx",i.add(a);const l=Xc({root:a,budget:Math.max(48,Math.round(t.dustBudget*.42)),texture:(e==null?void 0:e.dust)??null,blending:Ge,renderOrder:3,rand:s}),c=Xc({root:a,budget:Math.max(16,Math.round(t.emberBudget*.5)),texture:(e==null?void 0:e.ember)??null,blending:qi,renderOrder:4,rand:s});t.bloom&&(c.ps.points.layers.enable(Br),c.ps.points.userData.bloomSelf=!0);const u=new ut(16773586),h=new ut(Ut.crackDeep),d=new ut(Ut.grime).lerp(new ut(Ut.rockBody),.35),f=new ut,g=k=>f.copy(u).lerp(h,Math.min(1,k*1.4)),v=[],m=k=>(v.push(k),k),p=m(new wn(.055,0)),y=m(new Ja(.09,0)),M=m(new Ze(.34,.012,4,28)),x=m(new Hn(1,1));function q(k){const j=k.tint.clone().lerp(new ut(16774365),.55);let C=0;return{kind:"fluff",update(G){C+=G.dt*G.intensity*o;const z=.2;for(;C>z;){C-=z;const b=s()*je,W=.15+s()*.45;l.emit(G.anchor.x+Math.cos(b)*W,G.anchor.y-.15+s()*.5,G.anchor.z+Math.sin(b)*W,{vx:(s()-.5)*.16,vy:.05+s()*.12,vz:(s()-.5)*.16,life:3.2+s()*2.4,spin:(s()-.5)*.5,grow:.4+s()*.5,drag:.5,size:.22+s()*.26,alpha:.2+s()*.16,gravity:.02,sway:.16+s()*.18,swayFreq:.5+s()*.7,color:j})}},dispose(){}}}function R(k){const j=r?4:t.name==="mid"?6:8,C=new se({color:new ut(Ut.rockBody).lerp(k.tint,.3),roughness:.98,metalness:0,flatShading:!0,envMapIntensity:.2}),G=new sn(p,C,j);G.instanceMatrix.setUsage(Le),G.castShadow=t.shadows&&t.propShadows,G.frustumCulled=!1,k.host.add(G);const z=Array.from({length:j},(rt,dt)=>({angle:dt/j*je+s()*.4,radius:.3+s()*.34,height:-.1+s()*.55,speed:.25+s()*.35,bob:s()*je,scale:.6+s()*.9,spin:new O(s()*2,s()*2,s()*2)})),b=new Jt;let W=0;return{kind:"grit",update(rt){for(let dt=0;dt<z.length;dt++){const B=z[dt];B.angle+=B.speed*rt.dt*(.4+rt.intensity*.6);const X=B.height+Math.sin(rt.time*.7+B.bob)*.06;b.position.set(Math.cos(B.angle)*B.radius,rt.localPalmY+X,Math.sin(B.angle)*B.radius),b.rotation.set(B.spin.x+rt.time*.5,B.spin.y+rt.time*.35,B.spin.z+rt.time*.28),b.scale.setScalar(B.scale*(.7+rt.intensity*.4)),b.updateMatrix(),G.setMatrixAt(dt,b.matrix)}if(G.instanceMatrix.needsUpdate=!0,W+=rt.dt*rt.intensity*o,W>.55){W=0;const dt=z[Math.floor(s()*z.length)];l.emit(rt.anchor.x+Math.cos(dt.angle)*dt.radius,rt.anchor.y+dt.height,rt.anchor.z+Math.sin(dt.angle)*dt.radius,{vx:(s()-.5)*.1,vy:-.1,vz:(s()-.5)*.1,life:1.4+s()*1.1,spin:(s()-.5)*1.2,grow:.35,drag:1.1,size:.09+s()*.1,alpha:.24,gravity:-.55,sway:.03,color:d})}},dispose(){k.host.remove(G),G.dispose(),C.dispose()}}}function L(k){const j=[],C=r?2:3;for(let z=0;z<C;z++){const b=new Ze(.36+z*.09,.016,3,30,Math.PI*(1.05+s()*.35)),W=new Ee({vertexShader:a_,fragmentShader:l_,transparent:!0,depthWrite:!1,side:Ie,blending:Ge,uniforms:{uNoise:{value:(e==null?void 0:e.turbulence)??null},uColor:{value:k.tint.clone().lerp(new ut(14678e3),.35)},uOpacity:{value:.55},uTime:{value:0}}}),rt=new Yt(b,W);rt.rotation.x=Math.PI/2+(s()-.5)*.5,rt.renderOrder=2,k.host.add(rt),j.push({mesh:rt,mat:W,geo:b,speed:1.1+z*.55,tilt:(s()-.5)*.4,lift:z*.16})}let G=0;return{kind:"streak",update(z){for(const b of j)b.mesh.position.y=z.localPalmY-.1+b.lift,b.mesh.rotation.y+=b.speed*z.dt*(.5+z.intensity*.8),b.mesh.rotation.z=Math.sin(z.time*.8+b.lift*6)*.18+b.tilt,b.mat.uniforms.uTime.value=z.time,b.mat.uniforms.uOpacity.value=.32+z.intensity*.42;if(G+=z.dt*z.intensity*o,G>.22){G=0;const b=s()*je,W=.42;l.emit(z.anchor.x+Math.cos(b)*W,z.anchor.y+(s()-.4)*.4,z.anchor.z+Math.sin(b)*W,{vx:-Math.sin(b)*2.2,vy:.1,vz:Math.cos(b)*2.2,life:.5+s()*.35,spin:2.5,grow:.1,drag:1.6,size:.07+s()*.06,alpha:.3,gravity:0,sway:0,color:k.tint.clone().lerp(new ut(16777215),.4)})}},dispose(){for(const z of j)k.host.remove(z.mesh),z.geo.dispose(),z.mat.dispose()}}}function N(k){const j=new se({color:k.tint.clone().lerp(new ut(16777215),.35),roughness:.18,metalness:0,transparent:!0,opacity:.72,envMapIntensity:1.1,flatShading:!0}),C=r?3:5,G=new sn(y,j,C);G.instanceMatrix.setUsage(Le),G.castShadow=t.shadows&&t.propShadows,G.frustumCulled=!1,k.host.add(G);const z=new Jt,b=[];for(let B=0;B<C;B++){const X=B/C*je+s()*.5;b.push({angle:X,radius:.4+s()*.12,rot:new O(s()*.5,s()*je,s()*.6),scale:new O(.7+s()*.6,1.2+s()*.9,.7+s()*.5)})}const W=k.tint.clone().lerp(new ut(15398655),.5);let rt=0,dt=!1;return{kind:"mist",update(B){dt||(dt=!0,b.forEach((I,it)=>{z.position.set(Math.cos(I.angle)*I.radius,B.pedestalTopY+.04,Math.sin(I.angle)*I.radius),z.rotation.set(I.rot.x,I.rot.y,I.rot.z),z.scale.copy(I.scale),z.updateMatrix(),G.setMatrixAt(it,z.matrix)}),G.instanceMatrix.needsUpdate=!0),j.opacity=.5+.22*Math.sin(B.time*.9)*B.intensity,rt+=B.dt*B.intensity*o;const X=.16;for(;rt>X;){rt-=X;const I=s()*je,it=.1+s()*.45;l.emit(B.anchor.x+Math.cos(I)*it,B.anchor.y-.05+s()*.35,B.anchor.z+Math.sin(I)*it,{vx:Math.cos(I)*.22,vy:-.08,vz:Math.sin(I)*.22,life:2.2+s()*1.6,spin:(s()-.5)*.4,grow:.7+s()*.6,drag:1.3,size:.2+s()*.3,alpha:.14+s()*.12,gravity:-.16,sway:.05,swayFreq:.4,color:W})}},dispose(){k.host.remove(G),G.dispose(),j.dispose()}}}function T(k){const j=[],G=r?28:52;for(let J=0;J<=G;J++){const ft=J/G,Ct=ft*je*3.2,It=.26-ft*.06;j.push(new O(Math.cos(Ct)*It,ft*.46,Math.sin(Ct)*It))}const z=new Lu(j),b=new ja(z,r?40:84,.022,5,!1),W=new se({color:k.tint.clone().lerp(new ut(Ut.metalWarm),.4),roughness:.36,metalness:.85,envMapIntensity:.9}),rt=new Yt(b,W);rt.castShadow=t.shadows&&t.propShadows,k.host.add(rt);const dt=new gn({color:k.tint.clone().lerp(new ut(16777215),.25),transparent:!0,opacity:0,depthWrite:!1}),B=new Yt(M,dt);B.rotation.x=-Math.PI/2,k.host.add(B);let X=0,I=-1;const it={kind:"coil",palmOffset:0,update(J){X+=J.dt*(.75+J.intensity*.55);const ft=X%1,Ct=ft<.62?Math.pow(ft/.62,1.6):1-Math.pow((ft-.62)/.38,.55);rt.scale.y=1-Ct*.42,rt.position.y=J.localPalmY-.62,rt.rotation.y=X*1.4,it.palmOffset=(1-Ct)*.09*J.intensity,ft>.62&&I<0&&(I=0),I>=0&&(I+=J.dt*2.6,I>=1?(I=-1,dt.opacity=0,B.visible=!1):(B.visible=!0,B.position.y=J.localPalmY-.66,B.scale.setScalar(.5+I*1.5),dt.opacity=.4*(1-I)*J.intensity))},dispose(){k.host.remove(rt),k.host.remove(B),b.dispose(),W.dispose(),dt.dispose()}};return it}function _(k){const j=k.handGeometry,C=r?1:2,G=[];for(let W=0;W<C;W++){const rt=new se({color:k.tint.clone().lerp(new ut(2761528),.35),roughness:.9,metalness:0,transparent:!0,opacity:0,depthWrite:!1,envMapIntensity:.3}),dt=j?new Yt(j,rt):new Jt;dt.renderOrder=2,k.host.add(dt),G.push({mesh:dt,mat:rt,t:-1,dx:0,dz:0,yaw:0})}let z=.4,b=0;return{kind:"ghost",update(W){if(z+=W.dt*W.intensity,z>1.15){z=0;const rt=G[b%G.length];b++;const dt=s()*je,B=.22+s()*.2;rt.dx=Math.cos(dt)*B,rt.dz=Math.sin(dt)*B,rt.yaw=(s()-.5)*.7,rt.t=0}for(const rt of G){if(rt.t<0){rt.mesh.visible=!1;continue}if(rt.t+=W.dt/.7,rt.t>=1){rt.t=-1,rt.mesh.visible=!1;continue}const dt=1-rt.t;rt.mesh.visible=!0,rt.mesh.position.set(rt.dx*dt,W.localPalmY+.04*(1-dt),rt.dz*dt),rt.mesh.rotation.y=rt.yaw*dt,rt.mesh.scale.setScalar(.96+.06*rt.t),rt.mat.opacity=.42*dt*dt*W.intensity}},dispose(){for(const W of G)k.host.remove(W.mesh),W.mat.dispose()}}}function P(k){const j=r?6:10,C=8,G=j*C*2,z=new Float32Array(G*3),b=new Float32Array(G*4),W=[];for(let ft=0;ft<j;ft++){const Ct=ft/j*je+s()*.25,It=.95+s()*.35,Bt=.25+s()*.3;W.push({a:Ct,r0:It,bow:Bt,speed:.55+s()*.5,offset:s()})}const rt=new ye,dt=new Se(z,3).setUsage(Le),B=new Se(b,4).setUsage(Le);rt.setAttribute("position",dt),rt.setAttribute("color",B);const X=new Pu({vertexColors:!0,transparent:!0,depthWrite:!1,blending:Ge}),I=new ag(rt,X);I.frustumCulled=!1,k.host.add(I);const it=k.tint.clone().lerp(new ut(16766658),.25);let J=0;return{kind:"pull",update(ft){let Ct=0;for(const It of W){const Bt=ft.time*.18;for(let Mt=0;Mt<C;Mt++)for(let Et=0;Et<2;Et++){const U=(Mt+Et)/C,w=It.r0*(1-U),K=It.a+Bt+U*.9,$=c_(.04,ft.localPalmY,U)+Math.sin(U*Math.PI)*It.bow;z[Ct*3]=Math.cos(K)*w,z[Ct*3+1]=$,z[Ct*3+2]=Math.sin(K)*w;const D=(ft.time*It.speed+It.offset)%1,ct=Math.abs(U-D),nt=Math.exp(-(ct*ct)/.012),E=.18+.5*U;b[Ct*4]=it.r*(.6+nt*.8),b[Ct*4+1]=it.g*(.6+nt*.8),b[Ct*4+2]=it.b*(.6+nt*.8),b[Ct*4+3]=(E*.5+nt*.55)*ft.intensity,Ct++}}if(dt.needsUpdate=!0,B.needsUpdate=!0,J+=ft.dt*ft.intensity*o,J>.3){J=0;const It=W[Math.floor(s()*W.length)],Bt=It.a+ft.time*.18,Mt=Math.cos(Bt)*It.r0,Et=Math.sin(Bt)*It.r0;l.emit(ft.anchor.x+Mt,ft.anchor.y-.3,ft.anchor.z+Et,{vx:-Mt*1.5,vy:.55,vz:-Et*1.5,life:.75+s()*.3,spin:3,grow:-.03,drag:.4,size:.06+s()*.05,alpha:.55,gravity:.2,sway:0,color:it})}},dispose(){k.host.remove(I),rt.dispose(),X.dispose()}}}function V(k){const j=new gn({map:(e==null?void 0:e.crack)??null,color:new ut(Ut.crackCore),transparent:!0,opacity:.3,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),C=new Yt(x,j);C.rotation.x=-Math.PI/2,C.scale.setScalar(1.05),C.renderOrder=2,k.host.add(C);let G=0,z=0;return{kind:"ember",update(b){for(C.position.y=b.pedestalTopY+.012,j.opacity=(.18+.14*Math.sin(b.time*1.6))*b.intensity,G+=b.dt*b.intensity*o;G>.14;){G-=.14;const W=s()*je,rt=s()*.3;c.emit(b.anchor.x+Math.cos(W)*rt,b.anchor.y-.25+s()*.3,b.anchor.z+Math.sin(W)*rt,{vx:(s()-.5)*.24,vy:.5+s()*.55,vz:(s()-.5)*.24,life:1.1+s()*.9,spin:0,grow:-.04,drag:.35,size:.05+s()*.06,alpha:.85,gravity:.25,sway:.12,swayFreq:1.6,color:u})}if(z+=b.dt*b.intensity*o,z>.5){z=0;const W=s()*je;l.emit(b.anchor.x+Math.cos(W)*.4,b.anchor.y+.5,b.anchor.z+Math.sin(W)*.4,{vx:(s()-.5)*.1,vy:-.06,vz:(s()-.5)*.1,life:2.4+s()*1.4,spin:(s()-.5)*1.2,grow:.25,drag:.9,size:.07+s()*.07,alpha:.3,gravity:-.22,sway:.1,color:d})}},dispose(){k.host.remove(C),j.dispose()}}}const H={fluff:q,grit:R,streak:L,mist:N,coil:T,ghost:_,pull:P,ember:V};return{group:a,attach({gloveId:k,host:j,tint:C,handGeometry:G}){const z=o_(k),b={gloveId:k,host:j,tint:C??new ut(16777215),handGeometry:G},W=H[z](b);return W.gloveId=k,W},emitSoft(k,j,C,G){return l.emit(k,j,C,G)},emitEmber(k,j,C,G){return c.emit(k,j,C,G)},update(k,j){l.update(k,j,null),c.update(k,j,g)},setPixelScale(k){l.setPixelScale(k),c.setPixelScale(k)},dispose(){var k;l.dispose(),c.dispose();for(const j of v)(k=j.dispose)==null||k.call(j);i.remove(a)}}}const Yc=.62,h_=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,f_=`
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
`;function qc(i,t,e,n){return i+(t-i)*(1-Math.exp(-e*n))}const zi={h:0,s:0,l:0};function d_(i,t,e){t.getHSL(zi);const n=e>=1?zi.l+(.95-zi.l)*(1-1/e):zi.l*e,s=zi.s*Math.min(1,e*.85+.15);return i.setHSL(zi.h,s,Math.min(.9,Math.max(.02,n)))}function p_(i){const t=i.walkway;return`${i.origin.x.toFixed(2)}|${i.floorY.toFixed(2)}|${t.halfWidth.toFixed(2)}|${t.minZ.toFixed(2)}|${t.maxZ.toFixed(2)}`}function m_({scene:i,quality:t,textures:e,seed:n=20240501}){var U,w,K,$,D,ct,nt,E,S,et,yt;const s=new ge;s.name="hub",s.visible=!1,i.add(s);const r=ii(n+8171),o=[],a=Z=>(o.push(Z),Z),l=(Z,tt,St)=>{if(!Z)return null;const pt=Z.clone();return pt.repeat.set(tt,St),pt.needsUpdate=!0,a(pt),pt},c=a(new se({map:l((U=e==null?void 0:e.crust)==null?void 0:U.albedo,1,1),normalMap:t.normalMaps?l((w=e==null?void 0:e.crust)==null?void 0:w.normal,1,1):null,roughnessMap:l((K=e==null?void 0:e.crust)==null?void 0:K.rough,1,1),normalScale:new Tt(.85,.85),roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.42})),u=a(new se({map:l(($=e==null?void 0:e.cliff)==null?void 0:$.albedo,2,1),normalMap:t.normalMaps?l((D=e==null?void 0:e.cliff)==null?void 0:D.normal,2,1):null,roughnessMap:l((ct=e==null?void 0:e.cliff)==null?void 0:ct.rough,2,1),normalScale:new Tt(.7,.7),roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.3})),h=a(new se({map:l((nt=e==null?void 0:e.cliff)==null?void 0:nt.albedo,1,1),normalMap:t.normalMaps?l((E=e==null?void 0:e.cliff)==null?void 0:E.normal,1,1):null,roughnessMap:l((S=e==null?void 0:e.cliff)==null?void 0:S.rough,1,1),normalScale:new Tt(.8,.8),roughness:.96,metalness:0,vertexColors:!0,envMapIntensity:.34})),d=a(new se({name:"hub-inlay",color:new ut(Ut.rockDeep),roughness:.62,metalness:.15,emissive:new ut(Ut.crackCore),emissiveIntensity:.05,envMapIntensity:.5})),f=a(new se({name:"hub-rune",color:new ut(1709072),roughnessMap:l((et=e==null?void 0:e.cliff)==null?void 0:et.rough,1,1),roughness:.5,metalness:.25,emissive:new ut(Ut.crackCore),emissiveMap:l(e==null?void 0:e.turbulence,1.6,1.6),emissiveIntensity:.06,envMapIntensity:.6})),g=t.bloom?1.35:.72,v=a(new se({color:new ut(16777215),roughnessMap:((yt=e==null?void 0:e.cloth)==null?void 0:yt.rough)??null,roughness:.85,metalness:0,envMapIntensity:.3})),m=a(new Ee({vertexShader:h_,fragmentShader:f_,transparent:!0,depthWrite:!1,side:Ie,blending:Ge,uniforms:{uNoise:{value:(e==null?void 0:e.turbulence)??null},uSealA:{value:new ut(Ut.rockDeep)},uSealB:{value:new ut(Ut.fog).lerp(new ut(Ut.rockBody),.4)},uOpenA:{value:new ut(Ut.crackDeep).lerp(new ut(Ut.fog),.45)},uOpenB:{value:new ut(Ut.crackCore)},uReady:{value:0},uTime:{value:0}}})),p=s_({quality:t,textures:e}),y=u_({root:s,quality:t,textures:e,seed:n}),M=new Ea(Ut.crackLight,0,17,2);M.name="hub-portal-light",i.add(M);let x=null,q="";function R(Z){const tt=Z.walkway,St=Z.origin.x,pt=Z.floorY,xt=Math.max(6,tt.maxZ-tt.minZ),Pt=tt.halfWidth*2,gt=new Jt,Rt=(zt,ee,ie,Ce)=>{const on=new Yt(zt,null);return on.userData.matKey=ee,on.userData.tone=ie,Ce(on),gt.add(on),on},Ft=Math.max(4,Math.round(Pt/2.7)),Y=Math.max(6,Math.round(xt/2.7)),Q=Pt/Ft,lt=xt/Y,at=new pe(Q-.1,.36,lt-.1),wt=new ut;for(let zt=0;zt<Y;zt++)for(let ee=0;ee<Ft;ee++){const ie=St-tt.halfWidth+Q*(ee+.5),Ce=tt.minZ+lt*(zt+.5),on=r(),_n=Math.min(1,Math.abs(ie-St)/tt.halfWidth),si=1.14-_n*.24-on*.16;wt.setRGB(si*1.03,si,si*(.94+_n*.1)),Rt(at,"deck",wt.clone(),rs=>{rs.position.set(ie,pt-.18+(on-.5)*.028,Ce),rs.rotation.y=(r()-.5)*.02})}const F=new pe(.26,.06,lt*.72);for(let zt=0;zt<Y;zt++)Rt(F,"inlay",1,ee=>{ee.position.set(St,pt+.005,tt.minZ+lt*(zt+.5))});const bt=new pe(.52,.34,1.4);for(let zt=tt.minZ+.8;zt<tt.maxZ;zt+=1.55)for(const ee of[-1,1]){if(r()<.11)continue;const ie=.8+r()*.5;Rt(bt,"rock",.82+r()*.2,Ce=>{Ce.position.set(St+ee*(tt.halfWidth+.16),pt+.02+ie*.04,zt),Ce.rotation.set((r()-.5)*.06,(r()-.5)*.09,ee*(r()-.4)*.05),Ce.scale.set(1,ie,1)})}Rt(new pe(Pt+.9,.95,xt),"rock",.62,zt=>{zt.position.set(St,pt-.82,(tt.minZ+tt.maxZ)/2)});const ht=new wn(1,0),mt=t.name==="low"?8:16;for(let zt=0;zt<mt;zt++){const ee=.55+r()*1.5;Rt(ht,"rock",.44+r()*.18,ie=>{ie.position.set(St+(r()-.5)*Pt*.9,pt-1.5-r()*2.2,tt.minZ+r()*xt),ie.rotation.set(r()*3,r()*3,r()*3),ie.scale.set(ee,ee*(.6+r()*.7),ee)})}const At=new be(.34,.46,1,7);for(const zt of[-1,1]){const ee=1.6+r()*1.4;Rt(At,"rock",.78+r()*.16,ie=>{ie.position.set(St+zt*(tt.halfWidth-1.1),pt+ee*.5,tt.maxZ-1.1),ie.scale.set(1,ee,1),ie.rotation.y=r()*3,ie.rotation.z=zt*.03})}const Lt=Hi(gt);at.dispose(),F.dispose(),bt.dispose(),ht.dispose(),At.dispose();const Ot=new ge;Ot.name="hub-walkway";const ne=[],fe={deck:c,rock:u,inlay:d};for(const[zt,ee]of Lt){const ie=new Yt(ee,fe[zt]??u);ie.receiveShadow=t.shadows,ie.castShadow=zt==="rock"&&t.shadows,zt!=="inlay"&&kn(ie),Ot.add(ie),ne.push(ie)}return s.add(Ot),{group:Ot,dispose(){s.remove(Ot);for(const zt of ne)zt.geometry.dispose()}}}let L=null,N=null,T="";function _(Z,tt){const St=new Jt,pt=[],xt=(gt,Rt,Ft)=>{pt.push(gt);const Y=new Yt(gt,null);Y.userData.matKey="rock",Y.userData.tone=Rt,Ft(Y),St.add(Y)};xt(new be(Z*1.12,Z*1.2,tt*.14,8),.78,gt=>{gt.position.y=tt*.07,gt.rotation.y=Math.PI/8}),xt(new be(Z*.84,Z*1.02,tt*.62,8),.92,gt=>{gt.position.y=tt*.46}),xt(new be(Z*.95,Z*.86,tt*.1,8),1.02,gt=>{gt.position.y=tt*.82}),xt(new be(Z*1.08,Z*1,tt*.12,8),1.16,gt=>{gt.position.y=tt*.93,gt.rotation.y=Math.PI/8}),xt(new wn(Z*.3,0),.86,gt=>{gt.position.set(Z*.9,tt*.2,Z*.5),gt.rotation.set(.6,.9,.2),gt.scale.set(1,.7,1)});const Pt=Hi(St);for(const gt of pt)gt.dispose();return Pt.get("rock")}function P(Z,tt){const St=pt=>{const xt=new Jt,Pt=[],gt=(Y,Q)=>{Pt.push(Y);const lt=new Yt(Y,null);lt.userData.matKey="paint",lt.userData.tone=1,Q(lt),xt.add(lt)};gt(new Ze(Z*1.2,pt?.038:.03,5,22,pt?Math.PI*2:Math.PI),Y=>{Y.rotation.x=-Math.PI/2,Y.position.y=tt*1.02});const Rt=pt?[-1,1]:[0];for(const Y of Rt)gt(new pe(.075,.26,.075),Q=>{Q.position.set(Y*Z*.86,tt*1.14,pt?0:-Z*.86)});const Ft=Hi(xt);for(const Y of Pt)Y.dispose();return Ft.get("paint")};return{main:St(!0),off:St(!1)}}function V(Z,tt){const St=new Jt,pt=[],xt=(gt,Rt)=>{pt.push(gt);const Ft=new Yt(gt,null);Ft.userData.matKey="paint",Ft.userData.tone=1,Rt(Ft),St.add(Ft)};xt(new Ze(Z*1.02,.03,4,20),gt=>{gt.rotation.x=-Math.PI/2,gt.position.y=tt*.86}),xt(new pe(Z*1,.16,.05),gt=>{gt.position.set(0,tt*.56,-Z*.98)});const Pt=Hi(St);for(const gt of pt)gt.dispose();return Pt.get("paint")}let H=null,k=null,j=null;const C=new Map,G=new Jt,z=new ut;function b(Z){var St,pt;const tt=`${Z.pedestalRadius.toFixed(3)}|${Z.pedestalHeight.toFixed(3)}`;return tt===T&&L?!1:(T=tt,L==null||L.dispose(),H==null||H.dispose(),(St=N==null?void 0:N.main)==null||St.dispose(),(pt=N==null?void 0:N.off)==null||pt.dispose(),L=_(Z.pedestalRadius,Z.pedestalHeight),H=V(Z.pedestalRadius,Z.pedestalHeight),N=P(Z.pedestalRadius,Z.pedestalHeight),!0)}function W(Z){if(k&&k.instanceMatrix.count>=Z)return;k&&(s.remove(k),k.dispose(),s.remove(j),j.dispose());const tt=Math.max(8,Z);k=new sn(L,h,tt),k.instanceMatrix.setUsage(Le),k.castShadow=t.shadows,k.receiveShadow=t.shadows,k.frustumCulled=!1,k.count=0,kn(k),s.add(k),j=new sn(H,v,tt),j.instanceMatrix.setUsage(Le),j.frustumCulled=!1,j.count=0,s.add(j)}function rt(Z,tt){const St=new ge;St.name=`pedestal:${Z.gloveId}`,s.add(St);const pt=Z.row==="left"?-1:1,xt=new ut(Z.tint),Pt=p.build({gloveId:Z.gloveId,hand:pt,ident:xt,unlocked:Z.unlocked});Pt.group.position.y=tt.pedestalHeight+Yc,St.add(Pt.group);const gt=new Yt(N.main,Pt.paint);gt.visible=!1,gt.castShadow=t.shadows&&t.propShadows,St.add(gt);const Rt=new Yt(N.off,Pt.paint);Rt.visible=!1,Rt.castShadow=t.shadows&&t.propShadows,St.add(Rt);const Ft=y.attach({gloveId:Z.gloveId,host:St,tint:xt,handGeometry:Pt.group.userData.handGeometry});return{gloveId:Z.gloveId,group:St,palm:Pt,mainMark:gt,offMark:Rt,effect:Ft,ident:xt,identBase:xt.clone(),lift:0,bobPhase:r()*Math.PI*2,locked:!Z.unlocked,ringKey:"",view:Z}}function dt(Z){Z.effect.dispose(),Z.group.remove(Z.palm.group),Z.palm.dispose(),s.remove(Z.group)}function B(Z){const tt=new Set;for(const St of Z.pedestals){tt.add(St.gloveId);let pt=C.get(St.gloveId);pt||(pt=rt(St,Z),C.set(St.gloveId,pt)),pt.view=St,pt.locked!==!St.unlocked&&(pt.locked=!St.unlocked,pt.palm.setLocked(pt.locked))}for(const[St,pt]of C)tt.has(St)||(dt(pt),C.delete(St))}let X=null,I="",it=0;function J(Z){const tt=new Jt,St=[],pt=(lt,at,wt,F)=>{St.push(lt);const bt=new Yt(lt,null);bt.userData.matKey=at,bt.userData.tone=wt,F(bt),tt.add(bt)},xt=Z+.62,Pt=Z*2.25;for(const lt of[-1,1]){pt(new be(.42,.62,Pt,7),"rock",.9,at=>{at.position.set(lt*xt,Pt*.5,0),at.rotation.y=lt*.3}),pt(new pe(1.5,.42,1.5),"rock",.74,at=>{at.position.set(lt*xt,.2,0),at.rotation.y=lt*.12});for(let at=0;at<3;at++)pt(new pe(.1,.5,.14),"rune",1,wt=>{wt.position.set(lt*(xt-.34),Pt*(.32+at*.2),.02)})}pt(new pe(xt*2+1.5,.72,1.15),"rock",.96,lt=>{lt.position.set(0,Pt+.3,0)}),pt(new pe(xt*1.2,.4,.95),"rock",.86,lt=>{lt.position.set(0,Pt+.78,.02)}),pt(new wn(.55,0),"rock",1.04,lt=>{lt.position.set(0,Pt+1.02,0),lt.rotation.set(.4,.7,.2),lt.scale.set(1.2,.8,.9)}),pt(new pe(Z*1.1,.16,.14),"rune",1,lt=>{lt.position.set(0,Pt+.32,.6)}),pt(new pe(xt*2,.07,.3),"rune",1,lt=>{lt.position.set(0,.03,.85)});const gt=Hi(tt);for(const lt of St)lt.dispose();const Rt=new ge;Rt.name="hub-portal";const Ft=[];for(const[lt,at]of gt){const wt=new Yt(at,lt==="rune"?f:u);wt.castShadow=t.shadows,wt.receiveShadow=t.shadows,lt!=="rune"&&kn(wt),lt==="rune"&&t.bloom&&(wt.layers.enable(Br),wt.userData.bloomSelf=!0),Rt.add(wt),Ft.push(wt)}const Y=new Hn(Z*2.1,Pt*1.02),Q=new Yt(Y,m);return Q.position.set(0,Pt*.5,0),Q.renderOrder=2,Rt.add(Q),s.add(Rt),{group:Rt,membrane:Q,membraneGeo:Y,meshes:Ft,height:Pt,dispose(){s.remove(Rt);for(const lt of Ft)lt.geometry.dispose();Y.dispose()}}}function ft(Z){const tt=Z.portal.radius.toFixed(3);tt===I&&X||(I=tt,X==null||X.dispose(),X=J(Z.portal.radius))}let Ct=!1,It=0;function Bt(){Ct&&(Ct=!1,s.visible=!1,M.intensity=0)}function Mt(Z,tt,St){let pt=0;for(const xt of Z.pedestals){const Pt=C.get(xt.gloveId);if(!Pt)continue;Pt.group.position.set(xt.x,xt.y,xt.z),Pt.group.rotation.y=xt.yaw,G.position.set(xt.x,xt.y,xt.z),G.rotation.set(0,xt.yaw+Pt.bobPhase%1*.12,0),G.scale.setScalar(1),G.updateMatrix(),k.setMatrixAt(pt,G.matrix),j.setMatrixAt(pt,G.matrix);const gt=xt.focused&&xt.unlocked,Rt=xt.unlocked?gt?1.7:xt.slot?1.25:.82:.3,Ft=`${Rt.toFixed(2)}`;Pt.ringKey!==Ft&&(Pt.ringKey=Ft,d_(z,Pt.identBase,Rt),j.setColorAt(pt,z),j.instanceColor&&(j.instanceColor.needsUpdate=!0),Pt.palm.paint.color.copy(z));const Y=(gt?.11:0)+(xt.slot==="main"?.06:xt.slot==="off"?.03:0);Pt.lift=qc(Pt.lift,Y,7,tt);const Q=xt.unlocked?gt?1.35:xt.slot?1.12:.85:.16,lt=Math.sin(St*.9+Pt.bobPhase)*(.018+(gt?.014:0)),at=Z.pedestalHeight+Yc+Pt.lift+lt+(Pt.effect.palmOffset??0);Pt.palm.group.position.y=at,Pt.palm.group.rotation.y=Math.sin(St*.32+Pt.bobPhase)*.09+(gt?.12:0),Pt.mainMark.visible=xt.slot==="main",Pt.offMark.visible=xt.slot==="off",Pt.effect.update({dt:tt,time:St,intensity:Q,focused:gt,selected:xt.slot,localPalmY:at,pedestalTopY:Z.pedestalHeight,anchor:{x:xt.x,y:xt.y+at,z:xt.z}}),pt++}k.count=pt,j.count=pt,k.instanceMatrix.needsUpdate=!0,j.instanceMatrix.needsUpdate=!0}function Et(Z,tt,St){const pt=Z.portal;X.group.position.set(pt.x,Z.floorY,pt.z),it=qc(it,pt.ready?1:0,2.4,tt),m.uniforms.uReady.value=it,m.uniforms.uTime.value=St;const xt=.9+Math.sin(St*1.9)*.06+Math.sin(St*4.7+1.3)*.04;if(f.emissiveIntensity=(.05+it*g*xt)*(pt.near?1.15:1),d.emissiveIntensity=.04+it*.42*xt,M.position.set(pt.x,Z.floorY+pt.radius*.9,pt.z+.4),M.intensity=it*13*xt,it>.35)for(It+=tt*it;It>.12;){It-=.12;const Pt=pt.x+(r()-.5)*pt.radius*1.6,gt=pt.z+(r()-.5)*.5;y.emitSoft(Pt,Z.floorY+r()*.6,gt,{vx:(r()-.5)*.1,vy:.5+r()*.7,vz:(r()-.5)*.1,life:2+r()*1.6,spin:(r()-.5)*.8,grow:.5,drag:.45,size:.14+r()*.22,alpha:.16+r()*.12,gravity:.12,sway:.18,swayFreq:.9,color:new ut(Ut.crackCore).lerp(new ut(Ut.fog),.45)})}}return{root:s,portalLight:M,pedestals:C,get visible(){return Ct},sync(Z,tt=1/60,St=0){if(!Z||!Z.active||Z.pedestals.length===0)return Bt(),!1;const pt=p_(Z);if(pt!==q&&(q=pt,x==null||x.dispose(),x=R(Z)),b(Z)){for(const[,xt]of C)dt(xt);C.clear(),k&&(s.remove(k),k.dispose(),k=null,s.remove(j),j.dispose(),j=null)}return W(Z.pedestals.length),ft(Z),B(Z),Ct=!0,s.visible=!0,Mt(Z,tt,St),Et(Z,tt,St),y.update(tt,St),!0},setPixelScale(Z){y.setPixelScale(Z)},getStats(){return{visible:Ct,pedestals:C.size,portalReady:it}},dispose(){var Z,tt,St,pt;for(const[,xt]of C)dt(xt);C.clear(),x==null||x.dispose(),X==null||X.dispose(),k&&(s.remove(k),k.dispose()),j&&(s.remove(j),j.dispose()),L==null||L.dispose(),H==null||H.dispose(),(Z=N==null?void 0:N.main)==null||Z.dispose(),(tt=N==null?void 0:N.off)==null||tt.dispose(),y.dispose(),p.dispose(),i.remove(M),(St=M.dispose)==null||St.call(M);for(const xt of o)(pt=xt.dispose)==null||pt.call(xt);i.remove(s)}}}const Bi=.92,g_=.13,v_=.16;function vs(i){return i<0?0:i>1?1:i}const _s=new ut(.84,.93,1.14),Zc=new ut(1.14,1,.84),__=`
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
`,x_=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;function M_({scene:i,quality:t,textures:e,arenaRadius:n=20,seed:s=20240501}){const r=new ge;r.name="island",i.add(r);const o=[],a=Y=>(o.push(Y),Y),l=rn(s+17),c=ii(s+99),u=n;function h(Y){const Q=oe(l,Math.cos(Y)*1.15+41,Math.sin(Y)*1.15+41,3)-.5,lt=oe(l,Math.cos(Y)*6.5+13,Math.sin(Y)*6.5+13,3)-.5;return 1+Q*.17+lt*.035}function d(Y){return 1+(h(Y)-1)*.5}const f=(Y,Q,lt)=>{if(!Y)return null;const at=Y.clone();return at.repeat.set(Q,lt),at.needsUpdate=!0,a(at),at},g=a(new se({map:f(e.cliff.albedo,4,1.7),normalMap:f(e.cliff.normal,4,1.7),roughnessMap:f(e.cliff.rough,4,1.7),normalScale:new Tt(.7,.7),roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.34,fog:!0,side:Ie})),v=a(new se({map:f(e.crust.albedo,.075,.075),normalMap:f(e.crust.normal,.075,.075),roughnessMap:f(e.crust.rough,.075,.075),normalScale:new Tt(1.05,1.05),roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.5}));v.onBeforeCompile=Y=>{var Q,lt;Y.uniforms.uMacro={value:e.arenaMacro},Y.uniforms.uMacroScale={value:1/(u*2.15)},Y.uniforms.uMacroTexel={value:2/(((lt=(Q=e.arenaMacro)==null?void 0:Q.image)==null?void 0:lt.width)??512)},Y.vertexShader=Y.vertexShader.replace("#include <common>",`#include <common>
 varying vec3 vMacroPos;`).replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
         vec4 macroLocal = vec4(transformed, 1.0);
         #ifdef USE_INSTANCING
           macroLocal = instanceMatrix * macroLocal;
         #endif
         vMacroPos = (modelMatrix * macroLocal).xyz;`),Y.fragmentShader=Y.fragmentShader.replace("#include <common>",`#include <common>
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
         }`)},v.customProgramCacheKey=()=>"crust-macro";const m=a(new se({map:f(e.cliff.albedo,.6,1.6),normalMap:f(e.cliff.normal,.6,1.6),roughnessMap:f(e.cliff.rough,.6,1.6),roughness:1,metalness:0,vertexColors:!0,color:new ut(9274743),envMapIntensity:.35})),p=a(new se({map:f(e.crust.albedo,1.4,1.4),roughnessMap:f(e.crust.rough,1.4,1.4),normalMap:f(e.crust.normal,1.4,1.4),roughness:1,metalness:0,color:new ut(9668987),envMapIntensity:.45})),y=[[1,-.62],[1.045,-1.9],[.845,-3.1],[.93,-4.6],[.7,-6.5],[.795,-7.9],[.545,-10.2],[.635,-11.6],[.375,-14.1],[.44,-15.4],[.215,-17.4],[.095,-19.1],[.012,-20]],M=[],x=Math.max(2,Math.floor(t.islandProfileSegments/y.length)+1);for(let Y=0;Y<y.length-1;Y++){const[Q,lt]=y[Y],[at,wt]=y[Y+1];for(let F=0;F<x;F++){const bt=F/x;M.push(new Tt(u*(Q+(at-Q)*bt),lt+(wt-lt)*bt))}}M.push(new Tt(u*y[y.length-1][0],y[y.length-1][1]));const q=Math.max(18,Math.round(t.islandRadialSegments*.5)),R=a(new Es(M,q,0,Math.PI*2));{const Y=R.attributes.position,Q=new Float32Array(Y.count*3),lt=new ut;for(let at=0;at<Y.count;at++){const wt=Y.getX(at),F=Y.getY(at),bt=Y.getZ(at),ht=Math.atan2(bt,wt),mt=Math.hypot(wt,bt),At=vs(-F/20),Lt=(oe(l,Math.cos(ht)*1.6+5,Math.sin(ht)*1.6+5,3)-.5)*.44,Ot=(oe(l,Math.cos(ht)*5+1,Math.sin(ht)*5-F*.3,3)-.5)*.11,ne=ve(0,.22,At),fe=(1-ne)*d(ht)+ne*(1+Lt*(.5+At*1.6))+Ot;Y.setX(at,wt*fe),Y.setZ(at,bt*fe),mt>.001&&Y.setY(at,F+Ot*2.4);const zt=vs(.5-Ot*7),ee=vs(Ot*9),ie=ve(.55,.95,oe(l,ht*5.5+20,F*.06,3));let Ce=1.18-ve(.05,.9,At)*.5;Ce*=1-zt*.3,Ce*=1+ee*.34,Ce*=1-ie*.28*ve(0,.45,At),lt.setRGB(1,1,1).lerp(_s,ve(.1,.9,At)*.5).lerp(Zc,ee*.45).multiplyScalar(Ce),Q[at*3]=lt.r,Q[at*3+1]=lt.g,Q[at*3+2]=lt.b}R.setAttribute("color",new Se(Q,3)),R.computeVertexNormals(),Y.needsUpdate=!0}const L=new Yt(R,g);L.name="bedrock",L.receiveShadow=t.shadows,L.castShadow=!1,kn(L),r.add(L);const N=[];let T=null;const _=new Jt;if(t.rockChunks>0){const Y=a(new wn(1,t.name==="low"?0:1));{const Q=Y.attributes.position;for(let wt=0;wt<Q.count;wt++){const F=Q.getX(wt),bt=Q.getY(wt),ht=Q.getZ(wt),mt=.7+oe(l,F*1.7+3,ht*1.7+bt,3)*.7;Q.setXYZ(wt,F*mt,bt*mt*.8,ht*mt)}Y.computeVertexNormals();const lt=new Float32Array(Q.count*3),at=new ut;for(let wt=0;wt<Q.count;wt++)at.setRGB(1,1,1).lerp(_s,.5).multiplyScalar(.62+vs(Q.getY(wt)*.5+.5)*.5),lt[wt*3]=at.r,lt[wt*3+1]=at.g,lt[wt*3+2]=at.b;Y.setAttribute("color",new Se(lt,3))}T=new sn(Y,g,t.rockChunks),T.name="rock-chunks",T.instanceMatrix.setUsage(Le),T.castShadow=!1,T.receiveShadow=!1;for(let Q=0;Q<t.rockChunks;Q++){const lt=c()*Math.PI*2,at=u*(.35+c()*.7),wt=-3-c()*13;N.push({x:Math.cos(lt)*at,z:Math.sin(lt)*at,scale:.7+c()*2.4,rot:new O(c()*3,c()*3,c()*3),base:wt,amp:.06+c()*.14,phase:c()*6.28,spin:(c()-.5)*.05})}r.add(T),o.push(T)}const P=a(new Ee({vertexShader:x_,fragmentShader:__,side:Ie,fog:!1,uniforms:{uCore:{value:new ut(Ut.crackCore)},uDeep:{value:new ut(Ut.crackDeep)},uNoise:{value:e.turbulence},uTime:{value:0}}})),V=a(new be(u*.995,u*.16,16.4,44,6,!0));{const Y=V.attributes.position;for(let Q=0;Q<Y.count;Q++){const lt=Y.getX(Q),at=Y.getY(Q),wt=Y.getZ(Q),F=Math.atan2(wt,lt),bt=1+(oe(l,Math.cos(F)*3.2+11,Math.sin(F)*3.2-at*.22,3)-.5)*.22,mt=1-ve(-2.5,5.6,at)*(1-Math.min(1,d(F)));Y.setXYZ(Q,lt*bt*mt,at,wt*bt*mt)}V.computeVertexNormals()}const H=a(new se({map:f(e.cliff.albedo,4,1.2),roughnessMap:f(e.cliff.rough,4,1.2),normalMap:t.normalMaps?f(e.cliff.normal,4,1.2):null,color:new ut(2827553),roughness:1,metalness:0,side:Ie,envMapIntensity:.04})),k=new Yt(V,H);k.position.y=-Bi-8,k.name="crack-shaft",kn(k),r.add(k);const j=a(new Nr(u*.22,32)),C=new Yt(j,P);C.rotation.x=-Math.PI/2,C.position.y=-16.1,C.name="crack-core",C.layers.enable(Br),C.userData.bloomSelf=!0,r.add(C);const G=new Jt,z=new ut;let b=null,W=null,rt=0,dt=0,B=null;const X=a(new gn({color:0}));function I(Y){const Q=Math.max(.2,Y/2-g_*.5),lt=Q*.22,at=new Za;at.moveTo(-Q+lt,-Q),at.lineTo(Q-lt,-Q),at.lineTo(Q,-Q+lt),at.lineTo(Q,Q-lt),at.lineTo(Q-lt,Q),at.lineTo(-Q+lt,Q),at.lineTo(-Q,Q-lt),at.lineTo(-Q,-Q+lt),at.closePath();const wt=new $a(at);wt.rotateX(-Math.PI/2);const F=new Ka(at,{depth:Bi,curveSegments:1,bevelEnabled:t.plateBevel,bevelThickness:.07,bevelSize:.09,bevelOffset:0,bevelSegments:t.name==="high"?2:1,steps:1});F.rotateX(-Math.PI/2),F.computeBoundingBox(),F.translate(0,-F.boundingBox.max.y,0);const bt=F.attributes.position,ht=new Float32Array(bt.count*3),mt=new ut;for(let At=0;At<bt.count;At++){const Lt=bt.getX(At),Ot=bt.getY(At),ne=bt.getZ(At),fe=Math.max(Math.abs(Lt),Math.abs(ne))/Q;let zt=Ot>-.02?1:.52;zt*=1-ve(.72,1,fe)*(Ot>-.02?.18:0),mt.setRGB(1,1,1).lerp(_s,Ot>-.02?.06:.34).multiplyScalar(zt),ht[At*3]=mt.r,ht[At*3+1]=mt.g,ht[At*3+2]=mt.b}return F.setAttribute("color",new Se(ht,3)),{geo:F,cap:wt}}function it(Y,Q){const lt=Math.max(64,Math.ceil(Q*1.15));if(b&&Y===dt&&lt<=rt)return!1;b&&(r.remove(b),b.dispose(),W.dispose(),r.remove(B),B.geometry.dispose()),dt=Y,rt=lt;const at=I(Y);return W=at.geo,b=new sn(W,[v,m],lt),b.name="deck",b.instanceMatrix.setUsage(Le),b.castShadow=t.shadows,b.receiveShadow=t.shadows,b.frustumCulled=!1,b.count=0,r.add(b),B=new sn(at.cap,X,lt),B.name="deck-occluder",B.instanceMatrix=b.instanceMatrix,B.frustumCulled=!1,B.count=0,B.visible=!1,B.userData.emissiveOnly=!0,kn(B),r.add(B),!0}const J=new Map,ft=new Map,Ct=new Map,It=[];let Bt=0;const Mt=new Set;let Et=!1,U={origin:-u,tileSize:2.5};function w(Y,Q){const lt=Math.floor((Y-U.origin)/U.tileSize),at=Math.floor((Q-U.origin)/U.tileSize);return`${lt},${at}`}function K(Y){if(!b)return;const Q=Y.fall;if(Q>=1)G.position.set(Y.x,-60,Y.z),G.rotation.set(0,0,0),G.scale.setScalar(0);else{const lt=Y.displayCrack,at=lt*.14+(Y.seam?.05:0);G.position.set(Y.x,Y.baseY-at-Q*Q*30,Y.z),G.rotation.set(Y.tiltX*(lt*.05+Q*1.5),Y.yaw,Y.tiltZ*(lt*.05+Q*1.35));const wt=Y.seam?1-v_/Math.max(dt,.01):1;G.scale.set(wt,1,1)}G.updateMatrix(),b.setMatrixAt(Y.slot,G.matrix),Et=!0}function $(Y){if(!b)return;const lt=.82+oe(l,Y.x*.085+21,Y.z*.085+21,3)*.36,at=1-Y.displayCrack*.3;z.setRGB(1,1,1).lerp(Zc,vs(.3-Y.radial*.3)*.5).lerp(_s,Y.seam?.22:0).multiplyScalar(lt*at),b.setColorAt(Y.slot,z),b.instanceColor&&(b.instanceColor.needsUpdate=!0)}const D=Math.max(0,t.decalBudget|0),ct=a(new Hn(1,1)),nt=new Ma(new Float32Array(D),1);nt.setUsage(Le),ct.setAttribute("aFade",nt);const E=a(new gn({map:e.crack,transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2,toneMapped:!1}));E.onBeforeCompile=Y=>{Y.vertexShader=Y.vertexShader.replace("#include <common>",`#include <common>
attribute float aFade;
varying float vFade;`).replace("#include <begin_vertex>",`#include <begin_vertex>
	vFade = aFade;`),Y.fragmentShader=Y.fragmentShader.replace("#include <common>",`#include <common>
varying float vFade;`).replace("#include <map_fragment>",`#include <map_fragment>
	diffuseColor.a *= vFade;`)};const S=new sn(ct,E,D);S.name="tile-damage",S.instanceMatrix.setUsage(Le),S.frustumCulled=!1,S.renderOrder=2,S.visible=!1,r.add(S),o.push(S);const et=new Qt().makeScale(0,0,0),yt=new Jt,Z=[];for(let Y=D-1;Y>=0;Y--)Z.push(Y),S.setMatrixAt(Y,et);let tt=0,St=!1;function pt(Y){if(Z.length===0||!e.crack||Y.decals.length>=2)return;const Q=Z.pop();yt.rotation.set(-Math.PI/2,0,c()*Math.PI*2);const lt=dt*.3;yt.position.set(Y.x+(c()-.5)*lt,.014+Y.decals.length*.004,Y.z+(c()-.5)*lt);const at=dt*(.7+c()*.5);yt.scale.set(at,at,at),yt.updateMatrix(),nt.array[Q]=0,nt.needsUpdate=!0,Y.decals.push({slot:Q,fade:0,shown:!1,matrix:yt.matrix.clone()})}function xt(Y){for(const Q of Y.decals)nt.array[Q.slot]=0,Q.shown&&(S.setMatrixAt(Q.slot,et),St=!0,tt--),Z.push(Q.slot);Y.decals.length>0&&(nt.needsUpdate=!0),Y.decals.length=0}const Pt=new ge;r.add(Pt);{const Y=t.name==="low"?14:26,Q=a(new be(.17,.3,1,5,2));{const mt=Q.attributes.position;for(let At=0;At<mt.count;At++){const Lt=mt.getX(At),Ot=mt.getY(At),ne=mt.getZ(At),fe=.88+oe(l,Lt*5+7,(Ot+ne)*5+7,2)*.26;mt.setXYZ(At,Lt*fe,Ot+(oe(l,Lt*4,ne*4,2)-.5)*.12,ne*fe)}Q.computeVertexNormals(),Q.translate(0,.5,0)}const lt=[];for(let mt=0;mt<Y;mt++){const At=mt/Y*Math.PI*2+.11;c()<.16||lt.push(At)}const at=new sn(Q,p,lt.length);at.instanceMatrix.setUsage(Le);const wt=new Jt;lt.forEach((mt,At)=>{const Lt=(u+1.8)*d(mt);wt.position.set(Math.cos(mt)*Lt,-.7,Math.sin(mt)*Lt),wt.rotation.set((c()-.5)*.3,mt+(c()-.5)*.7,(c()-.5)*.34);const Ot=.9+c()*.7;wt.scale.set(.86+c()*.34,Ot,.86+c()*.34),wt.updateMatrix(),at.setMatrixAt(At,wt.matrix)}),at.instanceMatrix.needsUpdate=!0,at.castShadow=t.shadows,at.receiveShadow=t.shadows,Pt.add(at),o.push(at);const F=[new Tt(u+.4,-Bi-.05),new Tt(u+1.5,-Bi-.35),new Tt(u+2.1,-Bi-.95),new Tt(u+1.6,-Bi-1.9)],bt=a(new Es(F,t.islandRadialSegments,0,Math.PI*2));{const mt=bt.attributes.position,At=new Float32Array(mt.count*3),Lt=new ut;for(let Ot=0;Ot<mt.count;Ot++){const ne=mt.getX(Ot),fe=mt.getY(Ot),zt=mt.getZ(Ot),ee=Math.atan2(zt,ne),ie=oe(l,Math.cos(ee)*7+2,Math.sin(ee)*7+2,3),Ce=d(ee);mt.setX(Ot,ne*Ce),mt.setZ(Ot,zt*Ce),Lt.setRGB(1,1,1).lerp(_s,.42).multiplyScalar((.62+ie*.4)*(fe<-1.4?.72:1)),At[Ot*3]=Lt.r,At[Ot*3+1]=Lt.g,At[Ot*3+2]=Lt.b}bt.setAttribute("color",new Se(At,3)),bt.computeVertexNormals()}const ht=new Yt(bt,p);ht.receiveShadow=t.shadows,ht.castShadow=!1,kn(ht),Pt.add(ht)}{const Y=t.name==="low"?10:t.name==="mid"?22:46,Q=a(new wn(.13,0));{const F=Q.attributes.position;for(let bt=0;bt<F.count;bt++){const ht=.7+oe(l,F.getX(bt)*9,F.getZ(bt)*9,2)*.8;F.setXYZ(bt,F.getX(bt)*ht,F.getY(bt)*ht*.7,F.getZ(bt)*ht)}Q.computeVertexNormals()}const lt=a(new se({color:new ut(5853770),roughness:.98,metalness:0,flatShading:!0,envMapIntensity:.2})),at=new sn(Q,lt,Y),wt=new Jt;for(let F=0;F<Y;F++){const bt=c()*Math.PI*2,ht=c()<.45?.86:Math.sqrt(c()),mt=u*.12+u*.74*ht;wt.position.set(Math.cos(bt)*mt,.03+c()*.04,Math.sin(bt)*mt),wt.rotation.set(c()*3,c()*3,c()*3),wt.scale.setScalar(.35+c()*.9),wt.updateMatrix(),at.setMatrixAt(F,wt.matrix)}at.instanceMatrix.needsUpdate=!0,at.castShadow=t.shadows,at.receiveShadow=t.shadows,r.add(at),o.push(at)}function gt(Y,Q){const lt=Math.hypot(Y.x,Y.z)/Math.max(u,1e-6),at=oe(l,Y.x*.7+3,Y.z*.7-5,2)-.5;return{key:Y.key,index:Y.index,slot:Q,x:Y.x,z:Y.z,seam:Y.seam,radial:lt,yaw:at*.09,baseY:at*.05,tiltX:oe(l,Y.x*1.3+11,Y.z*1.3,2)-.5,tiltZ:oe(l,Y.x*1.3,Y.z*1.3+11,2)-.5,crack:Y.crack,displayCrack:Y.crack,broken:!1,fall:0,decals:[]}}function Rt(Y){xt(Y),J.delete(Y.key),ft.delete(Y.index),Ct.delete(w(Y.x,Y.z)),Mt.delete(Y),It.push(Y.slot),b&&(G.position.set(0,-60,0),G.rotation.set(0,0,0),G.scale.setScalar(0),G.updateMatrix(),b.setMatrixAt(Y.slot,G.matrix),Et=!0)}function Ft(Y){return Y.broken?!1:(Y.broken=!0,Y.fall=1e-4,Mt.add(Y),xt(Y),!0)}return{group:r,tiles:J,core:C,arenaRadius:u,setActive(Y){const Q=!!Y;return r.visible===Q||(r.visible=Q),Q},get active(){return r.visible},get tileCount(){let Y=0;for(const Q of J.values())Q.broken||Y++;return Y},syncTiles(Y,Q){if(!Array.isArray(Y)||Y.length===0)return;if(Q&&(U=Q),it((Q==null?void 0:Q.tileSize)??Y[0].size??2.5,Y.length))for(const wt of J.values())b.count=Math.max(b.count,wt.slot+1),$(wt),K(wt);const at=new Set;for(const wt of Y){at.add(wt.key);let F=J.get(wt.key);if(!F){const bt=It.length?It.pop():Bt++;if(bt>=rt)continue;F=gt(wt,bt),J.set(wt.key,F),ft.set(wt.index,F),Ct.set(w(wt.x,wt.z),F),b.count=Math.max(b.count,F.slot+1),$(F),K(F)}wt.crack>F.crack+.02&&!wt.broken&&(wt.crack>.32&&pt(F),Mt.add(F)),F.crack=wt.crack,wt.broken?Ft(F):F.broken&&(F.broken=!1,F.fall=0,F.displayCrack=wt.crack,$(F),K(F))}if(at.size!==J.size)for(const wt of[...J.values()])at.has(wt.key)||Rt(wt)},breakTile(Y){const Q=this.findTile(Y);return Q?(Ft(Q),Q):null},crackTile(Y,Q=.5){const lt=this.findTile(Y);return!lt||lt.broken?null:(lt.crack=Math.max(lt.crack,Q),lt.crack>.32&&pt(lt),Mt.add(lt),lt)},findTile({tileIndex:Y=null,tileId:Q=null,x:lt=null,z:at=null}={}){return Y!=null&&ft.has(Y)?ft.get(Y):Q!=null&&J.has(String(Q))?J.get(String(Q)):Number.isFinite(lt)&&Number.isFinite(at)?Ct.get(w(lt,at))??null:null},hasFloorAt(Y,Q){const lt=Ct.get(w(Y,Q));return!!lt&&!lt.broken},update(Y,Q){if(P.uniforms.uTime.value=Q,T){for(let at=0;at<N.length;at++){const wt=N[at];wt.rot.y+=wt.spin*Y,_.position.set(wt.x,wt.base+Math.sin(Q*.4+wt.phase)*wt.amp,wt.z),_.rotation.set(wt.rot.x,wt.rot.y,wt.rot.z),_.scale.setScalar(wt.scale),_.updateMatrix(),T.setMatrixAt(at,_.matrix)}T.instanceMatrix.needsUpdate=!0}for(const at of Mt){let wt=!0;at.broken&&at.fall<1&&(at.fall=Math.min(1,at.fall+Y*.8),wt=!1);const F=at.broken?1:at.crack;Math.abs(at.displayCrack-F)>.002?(at.displayCrack+=(F-at.displayCrack)*Math.min(1,Y*5),$(at),wt=!1):at.displayCrack!==F&&(at.displayCrack=F,$(at)),K(at),wt&&Mt.delete(at)}Et&&b&&(b.instanceMatrix.needsUpdate=!0,Et=!1),B&&(B.count=b?b.count:0);let lt=!1;for(const at of J.values()){if(at.decals.length===0)continue;const wt=at.broken?0:.2+at.displayCrack*.45;for(const F of at.decals){F.fade+=(wt-F.fade)*Math.min(1,Y*3),nt.array[F.slot]=F.fade,lt=!0;const bt=F.fade>.01;bt!==F.shown&&(F.shown=bt,tt+=bt?1:-1,S.setMatrixAt(F.slot,bt?F.matrix:et),St=!0)}}lt&&(nt.needsUpdate=!0),St&&(S.instanceMatrix.needsUpdate=!0,St=!1),S.visible=tt>0},surfaceY(){return 0},dispose(){var Y,Q;i.remove(r),r.traverse(lt=>{var at,wt;(lt.isMesh||lt.isInstancedMesh)&&((wt=(at=lt.geometry)==null?void 0:at.dispose)==null||wt.call(at))}),(Y=b==null?void 0:b.dispose)==null||Y.call(b);for(const lt of o)(Q=lt.dispose)==null||Q.call(lt);J.clear(),ft.clear(),Ct.clear(),Mt.clear(),It.length=0,Bt=0}}}function y_({scene:i,quality:t,sunDir:e}){const n=new Rc(Ut.keyLight,3.6);if(n.position.copy(e).multiplyScalar(60),n.target.position.set(0,0,0),i.add(n),i.add(n.target),t.shadows){n.castShadow=!0,n.shadow.mapSize.set(t.shadowMapSize,t.shadowMapSize),n.shadow.camera.near=5,n.shadow.camera.far=140;const c=30;n.shadow.camera.left=-c,n.shadow.camera.right=c,n.shadow.camera.top=c,n.shadow.camera.bottom=-c,n.shadow.bias=-.0016,n.shadow.normalBias=.05,n.shadow.radius=t.softShadows?3.2:1,n.shadow.camera.updateProjectionMatrix()}const s=new Gg(Ut.fillSky,Ut.fillBounce,.95);s.position.set(0,30,0),i.add(s);const r=new Rc(Ut.rimLight,t.rimLight?1.05:.45);r.position.set(e.z*46,24,-e.x*46),r.target.position.set(0,1.2,0),i.add(r),i.add(r.target);let o=null,a=null;t.crackFillLight&&(o=new Ea(Ut.crackLight,26,20,2),o.position.set(0,-13.2,0),i.add(o),a=new Ea(Ut.crackLight,11,15,2),a.position.set(0,-1.7,0),i.add(a));const l=new O;return{key:n,ambient:s,rim:r,crack:o,seam:a,update(c,u){if(l.copy(u),n.target.position.set(l.x,0,l.z),n.position.set(l.x+e.x*60,e.y*60,l.z+e.z*60),n.target.updateMatrixWorld(),r.target.position.set(l.x,1.2,l.z),r.position.set(l.x+e.z*46,24,l.z-e.x*46),r.target.updateMatrixWorld(),o){const h=.86+Math.sin(c*1.7)*.06+Math.sin(c*4.3+1.1)*.04;o.intensity=26*h,a.intensity=11*h}},setShadowsEnabled(c){n.castShadow=c&&t.shadows},dispose(){var c,u,h,d,f;i.remove(n),i.remove(n.target),i.remove(s),i.remove(r),i.remove(r.target),o&&i.remove(o),a&&i.remove(a),(c=n.dispose)==null||c.call(n),(u=s.dispose)==null||u.call(s),(h=r.dispose)==null||h.call(r),(d=o==null?void 0:o.dispose)==null||d.call(o),(f=a==null?void 0:a.dispose)==null||f.call(a)}}}const Kc=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`,S_=`
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
`,w_=`
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
`;function b_(){const i=new ye;return i.setAttribute("position",new Zt([-1,-1,0,3,-1,0,-1,3,0],3)),i.setAttribute("uv",new Zt([0,0,2,0,0,2],2)),i}const E_=new ut(0,0,0);function T_({renderer:i,scene:t,quality:e}){const n=new Tt(1,1);i.getDrawingBufferSize(n);const s=(_,P,V={})=>new ei(Math.max(1,Math.floor(_)),Math.max(1,Math.floor(P)),{type:es,format:qe,minFilter:Be,magFilter:Be,depthBuffer:V.depth!==!1,stencilBuffer:!1,samples:V.samples??0,colorSpace:fn,...V.extra}),r=e.bloom!==!1&&e.bloomIterations>0&&e.bloomStrength>0,o=e.bloomOccluders==="all"?"all":"tagged";let a=s(n.x,n.y,{samples:e.msaa});const l=e.bloomScale;let c=r?s(n.x*l,n.y*l,{depth:!0}):null,u=r?s(n.x*l,n.y*l,{depth:!1}):null,h=r?s(n.x*l,n.y*l,{depth:!1}):null;const d=b_(),f=new Va,g=new Ba(-1,1,1,-1,0,1),v=r?new Ee({vertexShader:Kc,fragmentShader:S_,depthTest:!1,depthWrite:!1,uniforms:{uTex:{value:null},uDir:{value:new Tt},uThreshold:{value:.85},uSoftKnee:{value:.6}}}):null,m=new Ee({vertexShader:Kc,fragmentShader:w_,defines:r?{USE_BLOOM:""}:{},depthTest:!1,depthWrite:!1,uniforms:r?{uScene:{value:a.texture},uBloom:{value:u.texture},uBloomStrength:{value:e.bloomStrength},uExposure:{value:1.25},uVignette:{value:.42}}:{uScene:{value:a.texture},uExposure:{value:1.25},uVignette:{value:.42}}}),p=new Yt(d,m);p.frustumCulled=!1,f.add(p);const y=new WeakMap,M=new WeakMap,x=[];function q(_){let P=M.get(_);return P||(P=new gn({color:E_,transparent:!1,depthWrite:_.depthWrite!==!1,depthTest:_.depthTest!==!1,side:_.side}),P.userData.emissiveProxyBlack=!0,M.set(_,P)),P}function R(_,P){if(!_)return null;if(_.isShaderMaterial||_.isRawShaderMaterial)return _;if(P.userData.bloomSelf&&_.isMeshBasicMaterial){let V=y.get(_);V||(V=_.clone(),V.toneMapped=!1,y.set(_,V));const H=P.userData.bloomBoost??2.4;return V.color.copy(_.color).multiplyScalar(H),V.opacity=_.opacity,V.map=_.map,V}if(_.emissive&&(_.emissiveIntensity??0)>.001){let V=y.get(_);return V||(V=new gn({transparent:_.transparent,depthWrite:_.depthWrite!==!1,side:_.side,toneMapped:!1}),y.set(_,V)),V.color.copy(_.emissive).multiplyScalar(_.emissiveIntensity??1),V.map=_.emissiveMap??null,V.opacity=_.opacity,V.userData.emissiveProxyBlack=!V.map&&V.color.r+V.color.g+V.color.b<1e-4,V}return q(_)}const L=_=>{var P;return Array.isArray(_)?_.every(V=>{var H;return(H=V==null?void 0:V.userData)==null?void 0:H.emissiveProxyBlack}):!!((P=_==null?void 0:_.userData)!=null&&P.emissiveProxyBlack)};function N(_){x.length=0;const P=[],V=[];t.traverse(H=>{if(H.userData.emissiveOnly){if(o!=="tagged"||H.visible)return;H.visible=!0,V.push(H)}else if(!H.visible)return;if(H.isPoints){H.userData.bloomSelf||(P.push(H),H.visible=!1);return}if(!H.isMesh&&!H.isInstancedMesh&&!H.isBatchedMesh)return;const k=H.material,j=Array.isArray(k)?k.map(C=>R(C,H)):R(k,H);if(o==="tagged"&&H.children.length===0&&L(j)&&!H.layers.isEnabled(el)){P.push(H),H.visible=!1;return}j!==k&&(x.push({object:H,original:k}),H.material=j)}),i.setRenderTarget(c),i.setClearColor(0,1),i.clear(!0,!0,!1),i.render(t,_);for(const H of x)H.object.material=H.original;x.length=0;for(const H of P)H.visible=!0;for(const H of V)H.visible=!1}function T(_){p.material=v;let P=c;for(let V=0;V<_;V++)v.uniforms.uTex.value=P.texture,v.uniforms.uThreshold.value=V===0?.85:-1,v.uniforms.uDir.value.set((1.4+V*1.8)/u.width,0),i.setRenderTarget(u),i.clear(!0,!1,!1),i.render(f,g),v.uniforms.uTex.value=u.texture,v.uniforms.uThreshold.value=-1,v.uniforms.uDir.value.set(0,(1.4+V*1.8)/h.height),i.setRenderTarget(h),i.clear(!0,!1,!1),i.render(f,g),P=h;return P}return{get sceneTarget(){return a},get bloomEnabled(){return r},get debug(){return{composite:m,targets:1+(r?3:0),bloomSize:r?[u.width,u.height]:null,occluders:o}},render(_){if(i.setRenderTarget(a),i.setClearColor(0,1),i.clear(!0,!0,!1),i.render(t,_),r){N(_);const P=T(e.bloomIterations);m.uniforms.uBloom.value=P.texture}m.uniforms.uScene.value=a.texture,p.material=m,i.setRenderTarget(null),i.clear(!0,!0,!1),i.render(f,g)},setSize(_,P){const V=Math.max(1,Math.floor(_)),H=Math.max(1,Math.floor(P));if(a.setSize(V,H),!r)return;const k=Math.max(1,Math.floor(V*l)),j=Math.max(1,Math.floor(H*l));c.setSize(k,j),u.setSize(k,j),h.setSize(k,j)},setBloomStrength(_){r&&(m.uniforms.uBloomStrength.value=_)},setExposure(_){m.uniforms.uExposure.value=_},dispose(){a.dispose(),c==null||c.dispose(),u==null||u.dispose(),h==null||h.dispose(),d.dispose(),v==null||v.dispose(),m.dispose(),a=null,c=null,u=null,h=null}}}const A_=`
  varying vec3 vWorldDir;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(world.xyz - cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`,C_=`
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
`,R_=`
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`,P_=`
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
`;function I_({scene:i,renderer:t,quality:e,textures:n,sunDir:s}){const r=new De(900,32,20),o=new Ee({vertexShader:A_,fragmentShader:C_,side:He,depthWrite:!1,fog:!1,uniforms:{uZenith:{value:new ut(Ut.skyZenith)},uMid:{value:new ut(Ut.skyMid)},uHorizon:{value:new ut(Ut.skyHorizon)},uWarm:{value:new ut(Ut.skyWarm)},uSunColor:{value:new ut(Ut.sunDisc)},uSunDir:{value:s.clone().normalize()},uExposure:{value:1}}}),a=new Yt(r,o);a.name="sky",a.frustumCulled=!1,a.renderOrder=-1e3;const l=new _a(t);l.compileEquirectangularShader();const c=new Va;c.add(a);const u=l.fromScene(c,0,1,2e3);c.remove(a),l.dispose(),i.add(a),i.environment=u.texture,i.environmentIntensity=.45,i.fog=new Ga(new ut(Ut.fog).getHex(),.0065);const h=[],d=[{y:-34,size:900,density:.46,scale:2.6,opacity:.5,fadeNear:260,fadeFar:1100},{y:-70,size:1500,density:.52,scale:1.7,opacity:.42,fadeNear:460,fadeFar:1900},{y:-120,size:2400,density:.6,scale:1.15,opacity:.4,fadeNear:780,fadeFar:3e3}].slice(0,e.cloudLayers);for(const f of d){const g=new Ee({vertexShader:R_,fragmentShader:P_,transparent:!0,depthWrite:!1,side:Ie,fog:!1,uniforms:{uNoise:{value:n.turbulence},uLit:{value:new ut(Ut.cloudLit)},uShadow:{value:new ut(Ut.cloudShadow)},uSunDir:{value:s.clone().normalize()},uTime:{value:0},uDensity:{value:f.density},uScale:{value:f.scale},uOpacity:{value:f.opacity},uHaze:{value:new ut(Ut.fog).lerp(new ut(Ut.skyHorizon),.5)},uFadeNear:{value:f.fadeNear},uFadeFar:{value:f.fadeFar}}}),v=new Yt(new Hn(f.size,f.size,1,1),g);v.rotation.x=-Math.PI/2,v.position.y=f.y,v.renderOrder=-900,v.frustumCulled=!1,i.add(v),h.push(v)}return{skyMesh:a,clouds:h,envRT:u,update(f,g){a.position.copy(g);for(const v of h)v.material.uniforms.uTime.value=f,v.position.x=g.x*.35,v.position.z=g.z*.35},dispose(){i.remove(a),r.dispose(),o.dispose();for(const f of h)i.remove(f),f.geometry.dispose(),f.material.dispose();u.dispose(),i.environment=null,i.fog=null}}}const Jc=new O(-.58,.42,.38).normalize();function Zu(i){if(typeof OffscreenCanvas<"u")try{return new OffscreenCanvas(i,i)}catch{}if(typeof document>"u")return null;const t=document.createElement("canvas");return t.width=i,t.height=i,t}function vn(i,t,{srgb:e=!1,wrap:n=$i}={}){const s=Zu(i);if(!s)return null;const r=s.getContext("2d",{willReadFrequently:!1}),o=r.createImageData(i,i);t(o.data,i),r.putImageData(o,0,0);const a=new Iu(s);return a.wrapS=n,a.wrapT=n,a.colorSpace=e?Ye:fn,a.minFilter=Sn,a.magFilter=Be,a.anisotropy=4,a.needsUpdate=!0,a}function Ds(i,t,e){const n=new Uint8Array(t*t*4),s=(h,d)=>i[(d+t)%t*t+(h+t)%t],r=new Float32Array(t*t),o=new Float32Array(t*t);let a=0;for(let h=0;h<t;h++)for(let d=0;d<t;d++){const f=h*t+d;r[f]=s(d+1,h)-s(d-1,h),o[f]=s(d,h+1)-s(d,h-1),a+=r[f]*r[f]+o[f]*o[f]}const l=Math.sqrt(a/(t*t*2))||1e-6,c=e/l;for(let h=0;h<t;h++)for(let d=0;d<t;d++){const f=h*t+d;let g=-r[f]*c,v=-o[f]*c,m=1;const p=Math.hypot(g,v,m)||1;g/=p,v/=p,m/=p;const y=(h*t+d)*4;n[y]=Math.round((g*.5+.5)*255),n[y+1]=Math.round((v*.5+.5)*255),n[y+2]=Math.round((m*.5+.5)*255),n[y+3]=255}const u=new Wa(n,t,t,qe,bn);return u.wrapS=$i,u.wrapT=$i,u.minFilter=Sn,u.magFilter=Be,u.generateMipmaps=!0,u.colorSpace=fn,u.needsUpdate=!0,u}function Ra(i,t,e){const n=i>>16&255,s=i>>8&255,r=i&255,o=t>>16&255,a=t>>8&255,l=t&255;return[n+(o-n)*e,s+(a-s)*e,r+(l-r)*e]}function L_(i,t,e){const n=rn(t),s=rn(t+977),r=new Float32Array(i*i),o=vn(i,(l,c)=>{for(let u=0;u<c;u++){const h=u/c;for(let d=0;d<c;d++){const f=d/c,g=oe(n,f*6,h*3,3)*.12,v=Rs(s,f*3,(h+g)*7,3),m=oe(n,f*18,h*18,4,.55),p=oe(s,f*22,h*1.2,3),y=ve(.52,.86,p)*ve(.05,.7,h),M=ve(.62,.16,v);r[u*c+d]=v*.72+m*.11+y*.17;const x=.35+.5*(1-h);let[q,R,L]=Ra(3816774,7169368,x*(.45+v*.55));const N=ve(.78,.98,v)*.5,[T,_,P]=Ra(0,9143160,1);q+=T*N*.35,R+=_*N*.35,L+=P*N*.35;const V=M*.55+y*.6;q*=1-V*.55,R*=1-V*.5,L*=1-V*.42;const H=(m-.5)*14,k=(u*c+d)*4;l[k]=Math.max(0,Math.min(255,q+H)),l[k+1]=Math.max(0,Math.min(255,R+H*.7)),l[k+2]=Math.max(0,Math.min(255,L+H*.4)),l[k+3]=255}}},{srgb:!0}),a=vn(i,(l,c)=>{for(let u=0;u<c;u++){const h=u/c;for(let d=0;d<c;d++){const f=d/c,g=oe(n,f*18,h*18,4,.55),v=oe(s,f*22,h*1.2,3),p=.98-ve(.52,.86,v)*ve(.05,.7,h)*.16+(g-.5)*.07,y=(u*c+d)*4,M=Math.max(0,Math.min(255,p*255));l[y]=M,l[y+1]=M,l[y+2]=M,l[y+3]=255}}});return{albedo:o,rough:a,normal:e?Ds(r,i,.3):null}}function D_(i,t,e){const n=rn(t+31),s=rn(t+1301),r=new Float32Array(i*i),o=vn(i,(l,c)=>{for(let u=0;u<c;u++)for(let h=0;h<c;h++){const d=h/c,f=u/c,g=oe(n,d*17,f*17,3,.55),v=oe(s,d*2.2,f*2.2,4),m=Fc(oe(s,d*5+11,f*5,3),1.4),p=ve(.84,.98,Rs(n,d*22+f*5,f*1.6,2));r[u*c+h]=v*.8+g*.08+p*.12;let[y,M,x]=Ra(4999756,6643540,.25+v*.75);const q=(g-.5)*8;y+=q,M+=q*.9,x+=q*.75,y=y*(1-m*.16)+124*m*.16,M=M*(1-m*.16)+118*m*.16,x=x*(1-m*.16)+109*m*.16,y+=p*15,M+=p*14,x+=p*12;const R=(u*c+h)*4;l[R]=Math.max(0,Math.min(255,y)),l[R+1]=Math.max(0,Math.min(255,M)),l[R+2]=Math.max(0,Math.min(255,x)),l[R+3]=255}},{srgb:!0}),a=vn(i,(l,c)=>{for(let u=0;u<c;u++)for(let h=0;h<c;h++){const d=h/c,f=u/c,g=Fc(oe(s,d*5+11,f*5,3),1.4),v=ve(.84,.98,Rs(n,d*22+f*5,f*1.6,2)),m=.74+g*.2-v*.26,p=Math.max(0,Math.min(255,m*255)),y=(u*c+h)*4;l[y]=p,l[y+1]=p,l[y+2]=p,l[y+3]=255}});return{albedo:o,rough:a,normal:e?Ds(r,i,.32):null}}function U_(i,t,e){const n=rn(t+77),s=new Float32Array(i*i);return{rough:vn(i,(o,a)=>{for(let l=0;l<a;l++)for(let c=0;c<a;c++){const u=c/a,h=l/a,d=oe(n,u*64,h*64,3,.62),f=Rs(n,u*7,h*7,3),g=ve(.55,.95,f);s[l*a+c]=d*.35+f*.65;const v=.86-g*.34+(d-.5)*.1,m=Math.max(0,Math.min(255,v*255)),p=(l*a+c)*4;o[p]=m,o[p+1]=m,o[p+2]=m,o[p+3]=255}}),normal:e?Ds(s,i,.45):null}}function N_(i,t,e){const n=rn(t+401),s=new Float32Array(i*i);return{rough:vn(i,(o,a)=>{for(let l=0;l<a;l++)for(let c=0;c<a;c++){const u=c/a,h=l/a,d=Math.sin(u*Math.PI*2*(a/4))*.5+.5,f=Math.sin(h*Math.PI*2*(a/4))*.5+.5,g=(d*.5+f*.5)*.4+oe(n,u*12,h*12,3)*.6;s[l*a+c]=g;const v=.93+(g-.5)*.1,m=Math.max(0,Math.min(255,v*255)),p=(l*a+c)*4;o[p]=m,o[p+1]=m,o[p+2]=m,o[p+3]=255}}),normal:e?Ds(s,i,.3):null}}function F_(i,t,e){const n=rn(t+613),s=new Float32Array(i*i);return{rough:vn(i,(o,a)=>{for(let l=0;l<a;l++)for(let c=0;c<a;c++){const u=c/a,h=l/a,d=oe(n,u*90,h*3,3,.6),f=oe(n,u*5+3,h*5,3),g=ve(.62,.9,f);s[l*a+c]=d*.25+f*.2;const v=.3+d*.2+g*.45,m=Math.max(0,Math.min(255,v*255)),p=(l*a+c)*4;o[p]=m,o[p+1]=m,o[p+2]=m,o[p+3]=255}}),normal:e?Ds(s,i,.2):null}}function O_(i,t){const e=rn(t+907);return vn(i,(n,s)=>{const r=(s-1)/2;for(let o=0;o<s;o++)for(let a=0;a<s;a++){const l=(a-r)/r,c=(o-r)/r,u=Math.hypot(l,c),h=Math.atan2(c,l),d=oe(e,Math.cos(h)*3+4,Math.sin(h)*3+4,4)*.42,f=oe(e,a/s*7,o/s*7,4);let g=ve(1+d,.15,u)*(.55+f*.75);g=Math.max(0,Math.min(1,g));const v=(o*s+a)*4;n[v]=255,n[v+1]=255,n[v+2]=255,n[v+3]=g*255}},{wrap:yn})}function k_(i){return vn(i,(t,e)=>{const n=(e-1)/2;for(let s=0;s<e;s++)for(let r=0;r<e;r++){const o=Math.hypot((r-n)/n,(s-n)/n),a=ve(.22,0,o),l=ve(1,.1,o)*.35,c=Math.max(0,Math.min(1,a+l)),u=(s*e+r)*4;t[u]=255,t[u+1]=255,t[u+2]=255,t[u+3]=c*255}},{wrap:yn})}function z_(i,t){const e=Zu(i);if(!e)return null;const n=e.getContext("2d");n.clearRect(0,0,i,i);const s=ii(t+5),r=i/2,o=i/2,a=5;n.strokeStyle="#150f0c",n.lineCap="round",n.lineJoin="round";for(let u=0;u<a;u++){const h=u/a*Math.PI*2+s()*.9;let d=r,f=o,g=h;const v=5+Math.floor(s()*3);let m=i*.016;const p=i*.34/v;n.globalAlpha=.8;for(let y=0;y<v;y++){g+=(s()-.5)*.85;const M=d+Math.cos(g)*p,x=f+Math.sin(g)*p;if(n.beginPath(),n.lineWidth=Math.max(.7,m),n.moveTo(d,f),n.lineTo(M,x),n.stroke(),s()<.45&&y<v-1){const q=g+(s()-.5)*1.7;n.beginPath(),n.lineWidth=Math.max(.6,m*.5),n.moveTo(M,x),n.lineTo(M+Math.cos(q)*p*.8,x+Math.sin(q)*p*.8),n.stroke()}d=M,f=x,m*=.74}}n.globalAlpha=1;const l=n.createRadialGradient(r,o,0,r,o,i*.3);l.addColorStop(0,"rgba(214, 138, 74, 0.62)"),l.addColorStop(.45,"rgba(140, 68, 26, 0.3)"),l.addColorStop(1,"rgba(0, 0, 0, 0)"),n.globalCompositeOperation="source-atop",n.fillStyle=l,n.fillRect(0,0,i,i),n.globalCompositeOperation="source-over";const c=new Iu(e);return c.colorSpace=Ye,c.minFilter=Sn,c.magFilter=Be,c.needsUpdate=!0,c}function B_(i,t){const e=rn(t+3301),n=rn(t+5507);return vn(i,(s,r)=>{for(let o=0;o<r;o++)for(let a=0;a<r;a++){const l=a/r,c=o/r,u=l-.5,h=c-.5,d=Math.hypot(u,h)*2,f=oe(e,l*3.1,c*3.1,4,.55),g=Rs(n,l*4.3+7,c*4.3+7,3),v=oe(n,l*9.5,c*9.5,3,.5),m=ve(.45,1,d),p=ve(.62,.08,d);let y=.62+f*.42+g*.3+v*.14;y*=1-m*.3,y*=1+p*.2;const M=Math.max(0,Math.min(255,y*200)),x=(o*r+a)*4;s[x]=M,s[x+1]=M,s[x+2]=M,s[x+3]=255}},{wrap:yn})}function H_(i,t){const e=rn(t+1777);return vn(i,(n,s)=>{for(let r=0;r<s;r++)for(let o=0;o<s;o++){const a=oe(e,o/s*8,r/s*8,4,.55),l=Math.max(0,Math.min(255,a*255)),c=(r*s+o)*4;n[c]=l,n[c+1]=l,n[c+2]=l,n[c+3]=255}})}function G_(i,t=20240501){const e=i.texRock,n=i.texDetail,s=i.normalMaps,r=L_(e,t,s),o=D_(e,t,s),a=U_(n,t,s),l=N_(n,t,s),c=F_(n,t,s),u={cliff:r,crust:o,leather:a,cloth:l,metal:c,dust:O_(Math.max(64,n),t),ember:k_(64),crack:z_(Math.max(128,n*2),t),turbulence:H_(Math.max(64,n),t),arenaMacro:B_(Math.max(128,e),t),dispose(){const h=new Set,d=f=>{f&&!h.has(f)&&(h.add(f),f.dispose())};[r,o,a,l,c].forEach(f=>{f&&(d(f.albedo),d(f.rough),d(f.normal))}),d(u.dust),d(u.ember),d(u.crack),d(u.turbulence),d(u.arenaMacro)}};return u}const V_=1,W_=`
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
`,X_=`
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
`,Y_=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,q_=`
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
`;function Z_({scene:i,quality:t,textures:e,seed:n=4242}){const s=ii(n),r=new ge;r.name="vfx",i.add(r);const o=Ps({scene:r,budget:t.dustBudget,texture:e.dust,blending:Ge,depthWrite:!1,renderOrder:3}),a=Ps({scene:r,budget:t.emberBudget,texture:e.ember,blending:qi,depthWrite:!1,renderOrder:4});a.points.layers.enable(V_),a.points.userData.bloomSelf=!0;const l=new ut(Ut.grime).lerp(new ut(Ut.rockBody),.4),c=new ut(Ut.rockTop).lerp(new ut(Ut.keyLight),.28),u=new ut(16773327),h=new ut(Ut.crackDeep),d=new ut;function f(B,X,I,it,J){Rr(B,X,I,it,J,s)}function g(B,X,I,it,J,ft,Ct=1){for(let It=0;It<it;It++){const Bt=s()*Math.PI*2,Mt=Math.pow(s(),.6);d.copy(l).lerp(c,s()*.85),f(o,B+(s()-.5)*.25,X+s()*.2,I+(s()-.5)*.25,{vx:Math.cos(Bt)*Mt*J,vy:ft*(.35+s()*.9),vz:Math.sin(Bt)*Mt*J,life:.9+s()*1.7,spin:(s()-.5)*1.4,grow:(1.6+s()*2.2)*Ct,drag:1.9+s()*1.4,size:(.5+s()*.9)*Ct,alpha:.3+s()*.3,color:d})}}function v(B,X,I,it,J){for(let ft=0;ft<it;ft++){const Ct=s()*Math.PI*2,It=1.5+s()*3.5;d.copy(u),f(a,B,X,I,{vx:Math.cos(Ct)*(1+s()*2.4)*J,vy:It,vz:Math.sin(Ct)*(1+s()*2.4)*J,life:.7+s()*1.1,spin:0,grow:-.5,drag:.6,size:.06+s()*.09,alpha:.9,color:d})}}const m=new De(1,20,14),p=new gi(.05,1,40,1),y=[],M=[];function x(){const B=new Ee({vertexShader:W_,fragmentShader:X_,transparent:!0,depthWrite:!1,side:Ie,blending:Ge,uniforms:{uNoise:{value:e.turbulence},uColorLit:{value:new ut(Ut.rockTop).lerp(new ut(Ut.keyLight),.35)},uColorDark:{value:new ut(Ut.fog).lerp(new ut(Ut.grime),.35)},uLife:{value:0},uOpacity:{value:.9}}}),X=new Yt(m,B);X.visible=!1,X.renderOrder=2,r.add(X);const I={mesh:X,mat:B,t:-1,dur:.3,scale:new O(1,1,1)};return y.push(I),I}function q(){const B=new Ee({vertexShader:Y_,fragmentShader:q_,transparent:!0,depthWrite:!1,side:Ie,blending:Ge,uniforms:{uNoise:{value:e.turbulence},uColor:{value:new ut(Ut.rockTop).lerp(new ut(Ut.keyLight),.2)},uLife:{value:0},uOpacity:{value:.6}}}),X=new Yt(p,B);X.rotation.x=-Math.PI/2,X.visible=!1,X.renderOrder=2,r.add(X);const I={mesh:X,mat:B,t:-1,dur:.55,radius:3};return M.push(I),I}const R=Array.from({length:t.shockRings+2},x),L=Array.from({length:t.shockRings+1},q);function N(){return R.find(B=>B.t<0)??R[0]}function T(){return L.find(B=>B.t<0)??L[0]}const _=new wn(.16,0),P=new se({color:new ut(6643026),roughness:.98,metalness:0,flatShading:!0,envMapIntensity:.15}),V=new sn(_,P,t.debrisBudget);V.instanceMatrix.setUsage(Le),V.castShadow=t.shadows,V.frustumCulled=!1,V.count=0,r.add(V);const H=[],k=new Jt,j=new Hn(1,1),C=[];let G=0;for(let B=0;B<t.decalBudget;B++){const X=new gn({map:e.crack,transparent:!0,depthWrite:!1,opacity:0,polygonOffset:!0,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),I=new Yt(j,X);I.rotation.x=-Math.PI/2,I.visible=!1,I.renderOrder=2,r.add(I),C.push({mesh:I,mat:X,t:-1,hold:0})}function z(B,X,I,it){if(C.length===0)return;const J=C[G%C.length];G++,J.mesh.position.set(B,.016,X),J.mesh.rotation.z=s()*Math.PI*2,J.mesh.scale.setScalar(I),J.mesh.visible=!0,J.t=0,J.peak=.24+it*.2}const b=new O(0,1,0),W=new O;let rt=0;const dt={group:r,slap(B,X,I=1){const it=Math.max(.35,Math.min(2.2,I));W.copy(X??b),W.y=0,W.lengthSq()<1e-5&&W.set(0,0,1),W.normalize();const J=N();J.t=0,J.dur=.26+it*.09,J.mesh.position.copy(B),J.mesh.visible=!0,J.mesh.lookAt(B.x+W.x,B.y,B.z+W.z),J.scale.set(.85*it,.6*it,.36*it),J.mat.uniforms.uOpacity.value=.38+it*.14,g(B.x+W.x*.3,B.y,B.z+W.z*.3,Math.round(15*it*(t.name==="low"?.4:1)),2.6*it,.8,.8+it*.2),t.name!=="low"&&v(B.x,B.y,B.z,Math.round(3*it),.6)},heavyImpact(B,X=1,I={}){const it=Math.max(.5,Math.min(2.5,X));dt.slap(B,I.dir??b,it);const J=T();J.t=0,J.dur=.5+it*.15,J.radius=2.4*it,J.mesh.position.set(B.x,.05,B.z),J.mesh.visible=!0,g(B.x,.1,B.z,Math.round(22*it*(t.name==="low"?.35:1)),4.2*it,.5,1.3),v(B.x,.2,B.z,Math.round(6*it*(t.name==="low"?.3:1)),1),dt.spawnDebris(B,it),I.crack!==!1&&z(B.x,B.z,1.9+it*1.1,Math.min(1,it/2))},spawnDebris(B,X){const I=Math.round(t.debrisPerBurst*Math.min(1.6,X));for(let it=0;it<I&&!(H.length>=t.debrisBudget);it++){const J=s()*Math.PI*2,ft=(1.5+s()*4)*X;H.push({p:new O(B.x+(s()-.5)*.5,B.y+.15,B.z+(s()-.5)*.5),v:new O(Math.cos(J)*ft*.6,3+s()*4.5,Math.sin(J)*ft*.6),rot:new O(s()*6,s()*6,s()*6),spin:new O((s()-.5)*9,(s()-.5)*9,(s()-.5)*9),scale:.32+s()*.7,life:0,maxLife:2+s()*1.2})}},footDust(B,X,I,it){t.footDust&&(it<3.2||g(B,X+.06,I,1,.6,.25,.55))},fallTrail(B,X,I){g(B,X,I,1,.5,-.4,.9)},ambientDrift(B,X){if(t.name==="low")return;rt+=B;const I=t.name==="high"?.16:.34;for(;rt>I;){rt-=I;const it=s()*Math.PI*2,J=2+s()*13;d.copy(l).lerp(c,s()*.7),f(o,X.x+Math.cos(it)*J,.3+s()*4.5,X.z+Math.sin(it)*J,{vx:(s()-.5)*.25,vy:.18+s()*.3,vz:(s()-.5)*.25,life:4+s()*4,spin:(s()-.5)*.3,grow:.5,drag:.25,size:.16+s()*.3,alpha:.05+s()*.07,color:d})}},awakenMotes(B,X,I){t.name!=="low"&&(s()>.35||v(B,X,I,1,.25))},crack(B,X,I=4,it=1){z(B,X,I,it)},update(B,X){for(const I of[o,a]){const it=I.arrays,J=I===a;for(let ft=I.count-1;ft>=0;ft--){I.life[ft]+=B;const Ct=I.life[ft]/I.maxLife[ft];if(Ct>=1){nl(I,ft);continue}const It=Math.exp(-I.drag[ft]*B);if(I.vel[ft*3]*=It,I.vel[ft*3+2]*=It,I.vel[ft*3+1]=J?I.vel[ft*3+1]*It-2.2*B:(I.vel[ft*3+1]-1.1*B)*It,it.pos[ft*3]+=I.vel[ft*3]*B,it.pos[ft*3+1]+=I.vel[ft*3+1]*B,it.pos[ft*3+2]+=I.vel[ft*3+2]*B,!J&&it.pos[ft*3+1]<.04&&I.vel[ft*3+1]<0&&(it.pos[ft*3+1]=.04,I.vel[ft*3+1]=0,I.vel[ft*3]*=.86,I.vel[ft*3+2]*=.86),it.rot[ft]+=I.spin[ft]*B,it.size[ft]=I.baseSize[ft]+I.grow[ft]*Ct,J)d.copy(u).lerp(h,Math.min(1,Ct*1.5)),it.color[ft*3]=d.r,it.color[ft*3+1]=d.g,it.color[ft*3+2]=d.b,it.alpha[ft]=I.baseAlpha[ft]*(1-Ct*Ct);else{const Bt=Math.min(1,Ct/.12);it.alpha[ft]=I.baseAlpha[ft]*Bt*(1-Ct)*(1-Ct*.4)}}il(I)}for(const I of y){if(I.t<0)continue;if(I.t+=B/I.dur,I.t>=1){I.t=-1,I.mesh.visible=!1;continue}const it=1-Math.pow(1-I.t,2.4),J=.45+it*2.2;I.mesh.scale.set(I.scale.x*J,I.scale.y*J,I.scale.z*J*(1+it*1.4)),I.mat.uniforms.uLife.value=I.t}for(const I of M){if(I.t<0)continue;if(I.t+=B/I.dur,I.t>=1){I.t=-1,I.mesh.visible=!1;continue}const it=1-Math.pow(1-I.t,2.6);I.mesh.scale.setScalar(.4+it*I.radius),I.mat.uniforms.uLife.value=I.t}if(H.length>0){const I=t.mergedDebris;for(let it=H.length-1;it>=0;it--){const J=H[it];if(J.life+=B,J.life>=J.maxLife){H.splice(it,1);continue}J.v.y-=22*B,J.p.addScaledVector(J.v,B),J.p.y<.08&&(J.p.y=.08,J.v.y*=-.32,J.v.x*=.62,J.v.z*=.62,J.spin.multiplyScalar(.5)),I||(J.rot.x+=J.spin.x*B,J.rot.y+=J.spin.y*B,J.rot.z+=J.spin.z*B)}V.count=Math.min(H.length,t.debrisBudget);for(let it=0;it<V.count;it++){const J=H[it];k.position.copy(J.p),k.rotation.set(J.rot.x,J.rot.y,J.rot.z);const ft=1-Math.max(0,(J.life-J.maxLife*.7)/(J.maxLife*.3));k.scale.setScalar(J.scale*ft),k.updateMatrix(),V.setMatrixAt(it,k.matrix)}V.instanceMatrix.needsUpdate=!0,V.visible=V.count>0}else V.count!==0&&(V.count=0,V.visible=!1);for(const I of C){if(I.t<0)continue;I.t+=B;const it=Math.min(1,I.t/.18),J=I.t>9?Math.max(0,1-(I.t-9)/6):1;I.mat.opacity=(I.peak??.8)*it*J,J<=0&&(I.t=-1,I.mesh.visible=!1)}},setPixelScale(B){o.mat.uniforms.uPixelScale.value=B,a.mat.uniforms.uPixelScale.value=B},dispose(){o.dispose(),a.dispose(),m.dispose(),p.dispose();for(const B of y)B.mat.dispose();for(const B of M)B.mat.dispose();for(const B of C)B.mat.dispose();j.dispose(),_.dispose(),P.dispose(),i.remove(r)}};return dt}const $c=new O(0,1,0),K_=["locked","free"],J_="locked";function jc(i){if(typeof i!="string")return null;const t=i.trim().toLowerCase();return K_.includes(t)?t:null}function Qc(i,t){const e=_v(i);return t.set(e.x,0,e.z)}class $_{constructor(t,e={}){this.canvas=t,this.opts=e,this.tier=Uc(e.quality??e.tier??"high"),this.quality=Aa[this.tier],this.mobile=!!e.mobile,this.seed=Number.isFinite(e.seed)?e.seed:20240501,this.arenaRadius=Number.isFinite(e.arenaRadius)?e.arenaRadius:20,this.forcedLocalId=e.localId??null,this.followId=e.followId??null,this.localId=this.forcedLocalId,this.spectator=!!e.spectator,this.disposed=!1,this.lookPitch=Number.isFinite(e.pitch)?e.pitch:null,this.lookYaw=Number.isFinite(e.lookYaw??e.simYaw)?e.lookYaw??e.simYaw:null,this.lookMode=jc(e.lookMode)??J_,this.skins=e.skins||sl(e.data??null),this.renderer=new eg({canvas:t,antialias:!1,alpha:!1,powerPreference:e.powerPreference??"high-performance",stencil:!1,depth:!0,preserveDrawingBuffer:!!e.preserveDrawingBuffer}),this.renderer.toneMapping=zn,this.renderer.autoClear=!1,this.renderer.setClearColor(0,1),this.renderer.info.autoReset=!1,this.renderer.shadowMap.autoUpdate=!1,this.clock=new Xg,this.time=0,this.frame=0,this.view=null,this.lastRawEvents=null,this.lastTick=null,this.scene=new Va,this.cameraRig=ev({mobile:this.mobile}),this.camera=this.cameraRig.camera,this._focus=new O(0,0,0),this._cullAt=new O(0,0,0),this._vel=new O,this._tmp=new O,this._tmp2=new O,this._tmp3=new O,this._snapPending=!0,this._lastPhase=null,this._following=!1,this._prevFocusX=0,this._prevFocusZ=0,this._buildWorld();const n=e.width??t.clientWidth??t.width??960,s=e.height??t.clientHeight??t.height??540;this.resize(n,s,e.pixelRatio??(typeof window<"u"?window.devicePixelRatio:1))}_buildWorld(){const t=this.quality;this.renderer.shadowMap.enabled=t.shadows,this.renderer.shadowMap.type=t.softShadows?tu:Ia,this.textures=G_(t,this.seed),this.sky=I_({scene:this.scene,renderer:this.renderer,quality:t,textures:this.textures,sunDir:Jc}),this.lighting=y_({scene:this.scene,quality:t,sunDir:Jc}),this.island=M_({scene:this.scene,quality:t,textures:this.textures,arenaRadius:this.arenaRadius,seed:this.seed}),this.characters=jv({scene:this.scene,quality:t,textures:this.textures,skins:this.skins}),this.hub=m_({scene:this.scene,quality:t,textures:this.textures,seed:this.seed}),this.vfx=Z_({scene:this.scene,quality:t,textures:this.textures,seed:this.seed}),this.combatVfx=dv({scene:this.scene,quality:t,textures:this.textures,seed:this.seed}),this.post=T_({renderer:this.renderer,scene:this.scene,quality:t}),this.view&&(this.island.syncTiles(this.view.tiles,this.view.arena),this.characters.reconcile(this.view.players,this.localId),this.island.setActive(!this.hub.sync(this.view.hub,1/60,this.time)))}_teardownWorld(){var t,e,n,s,r,o,a,l,c;(t=this.post)==null||t.dispose(),(e=this.combatVfx)==null||e.dispose(),this.combatVfx=null,(n=this.vfx)==null||n.dispose(),(s=this.hub)==null||s.dispose(),(r=this.characters)==null||r.dispose(),(o=this.island)==null||o.dispose(),(a=this.lighting)==null||a.dispose(),(l=this.sky)==null||l.dispose(),(c=this.textures)==null||c.dispose(),this.post=null,this.vfx=null,this.hub=null,this.characters=null,this.island=null,this.lighting=null,this.sky=null,this.textures=null}setQuality(t){const e=Uc(t);return e===this.tier?this.tier:(this.tier=e,this.quality=Aa[e],this._teardownWorld(),this._buildWorld(),this.resize(this._w,this._h,this._dpr),this.tier)}resize(t,e,n){var d,f,g,v;const s=Math.max(1,Math.floor(t||1)),r=Math.max(1,Math.floor(e||1)),o=Number.isFinite(n)&&n>0?n:1,a=Math.min(o,this.quality.dprCap,iv);this._w=s,this._h=r,this._dpr=o,this._ratio=a,this.renderer.setPixelRatio(a),this.renderer.setSize(s,r,!1),this.cameraRig.resize(s/r);const l=Math.floor(s*a),c=Math.floor(r*a);(d=this.post)==null||d.setSize(l,c);const u=this.camera.fov*Math.PI/180,h=c/(2*Math.tan(u/2));return(f=this.vfx)==null||f.setPixelScale(h),(g=this.combatVfx)==null||g.setPixelScale(h),(v=this.hub)==null||v.setPixelScale(h),{width:s,height:r,pixelRatio:a}}setMobile(t){this.mobile=!!t,this.cameraRig.setMobile(this.mobile)}setSpectator(t){const e=!!t;this.spectator&&!e&&(this._snapPending=!0),this.spectator=e}setLocalId(t){const e=t??null;return e!==this.forcedLocalId&&(this._snapPending=!0),this.forcedLocalId=e,this.forcedLocalId}snapCamera(){return this._snapPending=!0,!0}resetFollow(){return this.snapCamera()}setLookMode(t){const e=jc(t);return e&&e!==this.lookMode&&(this.lookMode=e,this.cameraRig.releaseBehind()),this.lookMode}getLookMode(){return this.lookMode}setFollow(t){return this.setLocalId(t)}setLook(t={}){const e=typeof t=="number"?{pitch:t}:t||{};return Number.isFinite(e.pitch)?this.lookPitch=Math.max(-Wi,Math.min(Wi,e.pitch)):e.pitch===null&&(this.lookPitch=null),Number.isFinite(e.simYaw)?this.lookYaw=e.simYaw:e.simYaw===null?this.lookYaw=null:Number.isFinite(e.yaw)?this.lookYaw=e.yaw:e.yaw===null&&(this.lookYaw=null),e.lookMode!==void 0&&this.setLookMode(e.lookMode),{pitch:this.lookPitch,yaw:this.lookYaw,lookMode:this.lookMode}}setPitch(t){return this.setLook({pitch:t}).pitch}getLook(){return{pitch:this.lookPitch??Cr,yaw:this.lookYaw,simYaw:this.lookYaw,lookMode:this.lookMode,cameraPitch:this.cameraRig.state.pitchOut,cameraYaw:this.cameraRig.state.yaw}}_pitchBias(){return this.lookPitch==null?0:this.lookPitch-Cr}_followYaw(t){const e=Number.isFinite(t==null?void 0:t.yaw)?t.yaw:0;return this.lookMode==="locked"||this.lookYaw==null?e:this.lookYaw}_behindYaw(t){return this.lookMode==="locked"&&Number.isFinite(t)?t:void 0}_phaseChanged(t){const e=this._lastPhase!==null&&t!==this._lastPhase;return e&&(this._snapPending=!0),this._lastPhase=t,e}_followCamera(t,e,n){const s=this._following&&Math.hypot(e.x-this._prevFocusX,e.z-this._prevFocusZ)>Kg;return this._prevFocusX=e.x,this._prevFocusZ=e.z,this._following=!0,this._snapPending||s?(this._snapPending=!1,this.cameraRig.snap(e,n,{pitchBias:this._pitchBias()}),!0):(this.cameraRig.update(t,e,n,this._vel,{pitchBias:this._pitchBias(),behindYaw:this._behindYaw(n)}),!1)}_notePhase(t){return this._phaseChanged(t),this._snapPending}_arenaChanged(t){!Number.isFinite(t)||Math.abs(t-this.arenaRadius)<.01||(this.arenaRadius=t,this._teardownWorld(),this._buildWorld(),this.resize(this._w,this._h,this._dpr))}_consumeEvents(t,e){if(t.tick!=null){if(t.tick===this.lastTick)return;this.lastTick=t.tick}else{if(e===this.lastRawEvents)return;this.lastRawEvents=e}if(t.events.length!==0)for(const n of t.events)this._handleEvent(n)}_eventPos(t,e,n,s){if(t.x!=null&&t.z!=null)return s.set(t.x,t.y!=null?t.y:1.1,t.z),s;const r=n??e;return r?(s.copy(r.pos),s.y+=1.2,s):null}_gloveOf(t,e){return t.gloveId??(e==null?void 0:e.activeGloveId)??null}_tintOf(t){return t?t.mats.paint.color:null}_strike(t,e,n,s,r,o={}){if(!n||!this.combatVfx)return null;const a=this._gloveOf(t,e),l=o.skill?cv(t.skillId,a):Wu(a);return this.combatVfx.strike(l,n,s,r,{...o,tint:this._tintOf(e)}),l}_handleEvent(t){const e=t.actorId!=null?this.characters.get(t.actorId):null,n=t.targetId!=null?this.characters.get(t.targetId):null,s=t.power,r=t.targetId!=null&&t.targetId===this.localId,o=t.actorId!=null&&t.actorId===this.localId,a=this._tmp2;switch(e&&n?a.copy(n.pos).sub(e.pos):t.yaw!=null?Qc(t.yaw,a):e?Qc(e.yaw,a):a.set(0,0,-1),a.y=0,a.lengthSq()<1e-6&&a.set(0,0,-1),t.kind){case"swing":{e&&this.characters.playSlap(t.actorId,s);break}case"slap":{if(e&&!this.characters.steerSlap(t.actorId,{power:s})&&this.characters.playSlap(t.actorId,s),t.hits===0&&e){const l=this._tmp.copy(e.pos).addScaledVector(a,1.4);l.y+=1.15,this._strike(t,e,l,a,s*.7,{whiff:!0})}break}case"hit":{const l=this._eventPos(t,e,n,this._tmp);if(l&&this.vfx.slap(l,a,s),l&&this._strike(t,e,l,a,s),e){const h=this._tmp3.copy(a).applyAxisAngle($c,-e.yaw).x>=0?1:-1;this.characters.steerSlap(t.actorId,{side:h,power:s})||this.characters.playSlap(t.actorId,s,h)}n&&this.characters.playHit(t.targetId,a,s);const c=r?.55:o?.46:.12;this.cameraRig.impulse(c*s,r?2.6:o?2:1.2);break}case"heavy":{const l=this._eventPos(t,e,n,this._tmp);l&&this.vfx.heavyImpact(l,s*1.3,{dir:a}),l&&this._strike(t,e,l,a,s*1.3,{skill:!0}),n&&this.characters.playHit(t.targetId,a,s*1.3);const c=r?.95:o?.62:.28;this.cameraRig.impulse(c*s,r?4.2:2.2);break}case"skill":{const l=this._eventPos(t,e,n,this._tmp);e&&this.characters.playSlap(t.actorId,s*1.2);const c=l?this._strike(t,e,l,a,s*1.15,{skill:!0}):null;l&&(c==="slab"||c==="cinder")&&this.vfx.heavyImpact(l,s*1.15,{dir:a,crack:!1}),this.cameraRig.impulse(o?.5:.16,o?2.4:1);break}case"ko":{const l=this._eventPos(t,e,n,this._tmp);l&&this.vfx.fallTrail(l.x,l.y,l.z),(o||r)&&this.cameraRig.impulse(.4,1.5);break}case"awaken":{const l=e??n;if(l)for(let c=0;c<8;c++)this.vfx.awakenMotes(l.pos.x,l.pos.y+1.2,l.pos.z);this.cameraRig.impulse(o?.3:.1,1.2);break}case"dash":{t.x!=null&&this.vfx.footDust(t.x,Math.max(0,t.y??0)+.05,t.z,6);break}case"jump":case"respawn":{t.x!=null&&this.vfx.footDust(t.x,Math.max(0,t.y??0)+.05,t.z,5);break}case"tileCrack":{const l=this.island.crackTile(t,.45),c=t.x??(l==null?void 0:l.x),u=t.z??(l==null?void 0:l.z);c!=null&&this.vfx.footDust(c,.08,u,6);break}case"tileBreak":{const l=this.island.breakTile(t),c=t.x??(l==null?void 0:l.x),u=t.z??(l==null?void 0:l.z);if(c==null)break;this._tmp.set(c,.1,u),this.vfx.spawnDebris(this._tmp,1.5),this.vfx.heavyImpact(this._tmp,1.2,{dir:$c,crack:!1});const h=this.characters.get(this.localId),d=h?Math.hypot(h.pos.x-c,h.pos.z-u):99;this.cameraRig.impulse(d<8?.5:.18,d<8?2:.8);break}}}sync(t,e){if(this.disposed)return;const n=Math.min(.05,Number.isFinite(e)?e:this.clock.getDelta());this.time+=n,this.frame++,this.renderer.info.reset();const s=t&&typeof t=="object"?t:{},r=Nv(s,{localId:this.forcedLocalId,followId:this.followId});this.lastRaw=s,this.view=r,this.localId=r.localId,this._arenaChanged(r.arena.radius),this.characters.reconcile(r.players,this.localId),this.characters.syncGhosts(r.ghosts),this.island.syncTiles(r.tiles,r.arena);const o=this.hub.sync(r.hub,n,this.time);this.island.setActive(!o),this._notePhase(o?"hub":"arena"),this._consumeEvents(r,s.events);const a=this.spectator||this.localId==null?null:r.players.find(c=>c.id===this.localId);a?this._cullAt.set(a.x??0,0,a.z??0):this._cullAt.set(this._focus.x,0,this._focus.z),this.characters.update(n,this.time,this._cullAt),this.island.update(n,this.time);for(const c of r.players){const u=this.characters.get(c.id);if(!(!u||!c.alive||!u.rootGroup.visible)){if(u.speed>3.2&&c.grounded&&this.frame%3===0&&this.vfx.footDust(u.pos.x,Math.max(0,u.pos.y),u.pos.z,u.speed),c.awakenedT>0)for(const h of u.arms)h.glove.getWorldPosition(this._tmp),this.vfx.awakenMotes(this._tmp.x,this._tmp.y,this._tmp.z);u.pos.y<-1.5&&this.vfx.fallTrail(u.pos.x,u.pos.y,u.pos.z)}}const l=this.spectator||this.localId==null?null:this.characters.get(this.localId);l?(this._focus.copy(l.pos),this._vel.set((l.pos.x-l.prev.x)/Math.max(n,1e-4),0,(l.pos.z-l.prev.z)/Math.max(n,1e-4)),this._followCamera(n,this._focus,this._followYaw(l))):(this.cameraRig.orbit(n,this.time,this.arenaRadius*1.35),this._focus.set(0,0,0),this._following=!1,this._snapPending=!0),this.vfx.ambientDrift(n,this._focus),this.vfx.update(n,this.time),this.combatVfx.update(n,this.time),this.lighting.update(this.time,this._focus),this.sky.update(this.time,this.camera.position),this.renderer.shadowMap.needsUpdate=this.quality.shadows,this.post.render(this.camera)}renderIdle(t){this.sync(this.lastRaw??{},t)}getStats(){var n,s,r,o,a,l,c,u;const t=this.renderer.info,e=((n=this.hub)==null?void 0:n.getStats())??null;return{tier:this.tier,phase:(r=(s=this.view)==null?void 0:s.hub)!=null&&r.active?"hub":"arena",hub:e,pixelRatio:this._ratio,size:[this._w,this._h],drawCalls:t.render.calls,triangles:t.render.triangles,programs:((o=t.programs)==null?void 0:o.length)??0,geometries:t.memory.geometries,textures:t.memory.textures,characters:((a=this.characters)==null?void 0:a.chars.size)??0,ghosts:((l=this.characters)==null?void 0:l.ghostCount)??0,combat:((c=this.combatVfx)==null?void 0:c.getStats())??null,pitch:this.cameraRig.state.pitchOut,tiles:((u=this.island)==null?void 0:u.tileCount)??0,localId:this.localId}}dispose(){var t,e;this.disposed||(this.disposed=!0,this._teardownWorld(),this.scene.clear(),this.renderer.dispose(),(e=(t=this.renderer).forceContextLoss)==null||e.call(t),this.view=null)}}let qt=null;function ix(i,t={}){return qt&&!qt.disposed&&qt.dispose(),qt=new $_(i,t),qt}function sx(i,t){!qt||qt.disposed||qt.sync(i,t)}function rx(i,t,e){return!qt||qt.disposed?null:qt.resize(i,t,e)}function ox(i){return!qt||qt.disposed?null:qt.setQuality(i)}function ax(){qt&&(qt.dispose(),qt=null)}function lx(i){qt==null||qt.setMobile(i)}function cx(i){qt==null||qt.setSpectator(i)}function j_(i){return(qt==null?void 0:qt.setLocalId(i))??null}function ux(i){return j_(i)}function hx(i){return qt&&!qt.disposed?qt.setLook(i):null}function fx(i){return qt&&!qt.disposed?qt.setLookMode(i):null}function dx(){return qt&&!qt.disposed?qt.getLookMode():null}function Q_(){return qt&&!qt.disposed?qt.snapCamera():null}function px(){return Q_()}function mx(i){return qt&&!qt.disposed?qt.setPitch(i):null}function gx(){return qt&&!qt.disposed?qt.getLook():null}function vx(){return qt&&!qt.disposed?qt.getStats():null}function _x(){return qt}export{Ca as ACCESSORIES,ex as CAMERA_SNAP_MAX_DIST,Kg as CAMERA_SNAP_TELEPORT,av as COMBAT_VFX_KIND,Lo as DEFAULT_LOCAL_ID,nv as GLOVE_TINT,Ut as PALETTE,Aa as QUALITY,nx as QUALITY_TIERS,lv as SKILL_VFX_KIND,$_ as YizhangRenderer,gv as accessoryFromAppearance,Wu as combatVfxKind,ix as createRenderer,ax as dispose,gx as getLook,dx as getLookMode,_x as getRenderer,vx as getStats,px as resetFollow,rx as resize,vv as resolveSkinLook,ux as setFollow,j_ as setLocalId,hx as setLook,fx as setLookMode,lx as setMobile,mx as setPitch,ox as setQuality,cx as setSpectator,cv as skillVfxKind,sl as skinTable,Q_ as snapCamera,sx as sync};
