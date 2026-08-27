import{r as $u,s as ju}from"./index-Ctjfn_Jd.js";/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Pa="170",Qu=0,cl=1,th=2,Ia=1,jc=2,Fn=3,ti=0,He=1,Ie=2,$n=0,Ge=1,qi=2,ul=3,hl=4,eh=5,di=100,nh=101,ih=102,sh=103,rh=104,oh=200,ah=201,lh=202,ch=203,Do=204,Uo=205,uh=206,hh=207,fh=208,dh=209,ph=210,mh=211,gh=212,vh=213,_h=214,No=0,Fo=1,Oo=2,Zi=3,ko=4,zo=5,Bo=6,Ho=7,Qc=0,xh=1,Mh=2,zn=0,yh=1,Sh=2,wh=3,bh=4,Eh=5,Th=6,Ah=7,fl="attached",Ch="detached",tu=300,Ki=301,Ji=302,Go=303,Vo=304,Rr=306,$i=1e3,yn=1001,Wo=1002,tn=1003,Rh=1004,Ns=1005,Be=1006,Br=1007,Sn=1008,bn=1009,eu=1010,nu=1011,bs=1012,La=1013,vi=1014,mn=1015,es=1016,Da=1017,Ua=1018,ji=1020,iu=35902,su=1021,ru=1022,qe=1023,ou=1024,au=1025,Xi=1026,Qi=1027,Na=1028,Fa=1029,lu=1030,Oa=1031,ka=1033,pr=33776,mr=33777,gr=33778,vr=33779,Xo=35840,Yo=35841,qo=35842,Zo=35843,Ko=36196,Jo=37492,$o=37496,jo=37808,Qo=37809,ta=37810,ea=37811,na=37812,ia=37813,sa=37814,ra=37815,oa=37816,aa=37817,la=37818,ca=37819,ua=37820,ha=37821,_r=36492,fa=36494,da=36495,cu=36283,pa=36284,ma=36285,ga=36286,Ph=3200,Ih=3201,uu=0,Lh=1,fn="",Ye="srgb",ns="srgb-linear",Pr="linear",de="srgb",wi=7680,dl=519,Dh=512,Uh=513,Nh=514,hu=515,Fh=516,Oh=517,kh=518,zh=519,pl=35044,Le=35048,ml="300 es",On=2e3,yr=2001;class is{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const s=this._listeners[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}}const Ue=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Hr=Math.PI/180,va=180/Math.PI;function xi(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ue[i&255]+Ue[i>>8&255]+Ue[i>>16&255]+Ue[i>>24&255]+"-"+Ue[t&255]+Ue[t>>8&255]+"-"+Ue[t>>16&15|64]+Ue[t>>24&255]+"-"+Ue[e&63|128]+Ue[e>>8&255]+"-"+Ue[e>>16&255]+Ue[e>>24&255]+Ue[n&255]+Ue[n>>8&255]+Ue[n>>16&255]+Ue[n>>24&255]).toLowerCase()}function Pe(i,t,e){return Math.max(t,Math.min(e,i))}function Bh(i,t){return(i%t+t)%t}function Gr(i,t,e){return(1-e)*i+e*t}function ls(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function We(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}class Tt{constructor(t=0,e=0){Tt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Pe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class jt{constructor(t,e,n,s,r,o,a,l,c){jt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c)}set(t,e,n,s,r,o,a,l,c){const u=this.elements;return u[0]=t,u[1]=s,u[2]=a,u[3]=e,u[4]=r,u[5]=l,u[6]=n,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],u=n[4],h=n[7],d=n[2],f=n[5],g=n[8],v=s[0],m=s[3],p=s[6],y=s[1],M=s[4],_=s[7],X=s[2],R=s[5],L=s[8];return r[0]=o*v+a*y+l*X,r[3]=o*m+a*M+l*R,r[6]=o*p+a*_+l*L,r[1]=c*v+u*y+h*X,r[4]=c*m+u*M+h*R,r[7]=c*p+u*_+h*L,r[2]=d*v+f*y+g*X,r[5]=d*m+f*M+g*R,r[8]=d*p+f*_+g*L,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8];return e*o*u-e*a*c-n*r*u+n*a*l+s*r*c-s*o*l}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],h=u*o-a*c,d=a*l-u*r,f=c*r-o*l,g=e*h+n*d+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/g;return t[0]=h*v,t[1]=(s*c-u*n)*v,t[2]=(a*n-s*o)*v,t[3]=d*v,t[4]=(u*e-s*l)*v,t[5]=(s*r-a*e)*v,t[6]=f*v,t[7]=(n*l-c*e)*v,t[8]=(o*e-n*r)*v,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+t,-s*c,s*l,-s*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(Vr.makeScale(t,e)),this}rotate(t){return this.premultiply(Vr.makeRotation(-t)),this}translate(t,e){return this.premultiply(Vr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Vr=new jt;function fu(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Sr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Hh(){const i=Sr("canvas");return i.style.display="block",i}const gl={};function xs(i){i in gl||(gl[i]=!0,console.warn(i))}function Gh(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function Vh(i){const t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Wh(i){const t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const ae={enabled:!0,workingColorSpace:ns,spaces:{},convert:function(i,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===de&&(i.r=Bn(i.r),i.g=Bn(i.g),i.b=Bn(i.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(i.applyMatrix3(this.spaces[t].toXYZ),i.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===de&&(i.r=Yi(i.r),i.g=Yi(i.g),i.b=Yi(i.b))),i},fromWorkingColorSpace:function(i,t){return this.convert(i,this.workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===fn?Pr:this.spaces[i].transfer},getLuminanceCoefficients:function(i,t=this.workingColorSpace){return i.fromArray(this.spaces[t].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,t,e){return i.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function Bn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Yi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}const vl=[.64,.33,.3,.6,.15,.06],_l=[.2126,.7152,.0722],xl=[.3127,.329],Ml=new jt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),yl=new jt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);ae.define({[ns]:{primaries:vl,whitePoint:xl,transfer:Pr,toXYZ:Ml,fromXYZ:yl,luminanceCoefficients:_l,workingColorSpaceConfig:{unpackColorSpace:Ye},outputColorSpaceConfig:{drawingBufferColorSpace:Ye}},[Ye]:{primaries:vl,whitePoint:xl,transfer:de,toXYZ:Ml,fromXYZ:yl,luminanceCoefficients:_l,outputColorSpaceConfig:{drawingBufferColorSpace:Ye}}});let bi;class Xh{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{bi===void 0&&(bi=Sr("canvas")),bi.width=t.width,bi.height=t.height;const n=bi.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=bi}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Sr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Bn(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Bn(e[n]/255)*255):e[n]=Bn(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Yh=0;class du{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Yh++}),this.uuid=xi(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Wr(s[o].image)):r.push(Wr(s[o]))}else r=Wr(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function Wr(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Xh.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let qh=0;class ke extends is{constructor(t=ke.DEFAULT_IMAGE,e=ke.DEFAULT_MAPPING,n=yn,s=yn,r=Be,o=Sn,a=qe,l=bn,c=ke.DEFAULT_ANISOTROPY,u=fn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:qh++}),this.uuid=xi(),this.name="",this.source=new du(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Tt(0,0),this.repeat=new Tt(1,1),this.center=new Tt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new jt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==tu)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case $i:t.x=t.x-Math.floor(t.x);break;case yn:t.x=t.x<0?0:1;break;case Wo:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case $i:t.y=t.y-Math.floor(t.y);break;case yn:t.y=t.y<0?0:1;break;case Wo:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}ke.DEFAULT_IMAGE=null;ke.DEFAULT_MAPPING=tu;ke.DEFAULT_ANISOTROPY=1;class ce{constructor(t=0,e=0,n=0,s=1){ce.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const l=t.elements,c=l[0],u=l[4],h=l[8],d=l[1],f=l[5],g=l[9],v=l[2],m=l[6],p=l[10];if(Math.abs(u-d)<.01&&Math.abs(h-v)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+v)<.1&&Math.abs(g+m)<.1&&Math.abs(c+f+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const M=(c+1)/2,_=(f+1)/2,X=(p+1)/2,R=(u+d)/4,L=(h+v)/4,D=(g+m)/4;return M>_&&M>X?M<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(M),s=R/n,r=L/n):_>X?_<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(_),n=R/s,r=D/s):X<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(X),n=L/r,s=D/r),this.set(n,s,r,e),this}let y=Math.sqrt((m-g)*(m-g)+(h-v)*(h-v)+(d-u)*(d-u));return Math.abs(y)<.001&&(y=1),this.x=(m-g)/y,this.y=(h-v)/y,this.z=(d-u)/y,this.w=Math.acos((c+f+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Zh extends is{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new ce(0,0,t,e),this.scissorTest=!1,this.viewport=new ce(0,0,t,e);const s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Be,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const r=new ke(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new du(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class ei extends Zh{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class pu extends ke{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=tn,this.minFilter=tn,this.wrapR=yn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Kh extends ke{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=tn,this.minFilter=tn,this.wrapR=yn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Is{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let l=n[s+0],c=n[s+1],u=n[s+2],h=n[s+3];const d=r[o+0],f=r[o+1],g=r[o+2],v=r[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h;return}if(a===1){t[e+0]=d,t[e+1]=f,t[e+2]=g,t[e+3]=v;return}if(h!==v||l!==d||c!==f||u!==g){let m=1-a;const p=l*d+c*f+u*g+h*v,y=p>=0?1:-1,M=1-p*p;if(M>Number.EPSILON){const X=Math.sqrt(M),R=Math.atan2(X,p*y);m=Math.sin(m*R)/X,a=Math.sin(a*R)/X}const _=a*y;if(l=l*m+d*_,c=c*m+f*_,u=u*m+g*_,h=h*m+v*_,m===1-a){const X=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=X,c*=X,u*=X,h*=X}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h}static multiplyQuaternionsFlat(t,e,n,s,r,o){const a=n[s],l=n[s+1],c=n[s+2],u=n[s+3],h=r[o],d=r[o+1],f=r[o+2],g=r[o+3];return t[e]=a*g+u*h+l*f-c*d,t[e+1]=l*g+u*d+c*h-a*f,t[e+2]=c*g+u*f+a*d-l*h,t[e+3]=u*g-a*h-l*d-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(n/2),u=a(s/2),h=a(r/2),d=l(n/2),f=l(s/2),g=l(r/2);switch(o){case"XYZ":this._x=d*u*h+c*f*g,this._y=c*f*h-d*u*g,this._z=c*u*g+d*f*h,this._w=c*u*h-d*f*g;break;case"YXZ":this._x=d*u*h+c*f*g,this._y=c*f*h-d*u*g,this._z=c*u*g-d*f*h,this._w=c*u*h+d*f*g;break;case"ZXY":this._x=d*u*h-c*f*g,this._y=c*f*h+d*u*g,this._z=c*u*g+d*f*h,this._w=c*u*h-d*f*g;break;case"ZYX":this._x=d*u*h-c*f*g,this._y=c*f*h+d*u*g,this._z=c*u*g-d*f*h,this._w=c*u*h+d*f*g;break;case"YZX":this._x=d*u*h+c*f*g,this._y=c*f*h+d*u*g,this._z=c*u*g-d*f*h,this._w=c*u*h-d*f*g;break;case"XZY":this._x=d*u*h-c*f*g,this._y=c*f*h-d*u*g,this._z=c*u*g+d*f*h,this._w=c*u*h+d*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],l=e[9],c=e[2],u=e[6],h=e[10],d=n+a+h;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(u-l)*f,this._y=(r-c)*f,this._z=(o-s)*f}else if(n>a&&n>h){const f=2*Math.sqrt(1+n-a-h);this._w=(u-l)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+c)/f}else if(a>h){const f=2*Math.sqrt(1+a-n-h);this._w=(r-c)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(l+u)/f}else{const f=2*Math.sqrt(1+h-n-a);this._w=(o-s)/f,this._x=(r+c)/f,this._y=(l+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Pe(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,l=e._y,c=e._z,u=e._w;return this._x=n*u+o*a+s*c-r*l,this._y=s*u+o*l+r*a-n*c,this._z=r*u+o*c+n*l-s*a,this._w=o*u-n*a-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,s=this._y,r=this._z,o=this._w;let a=o*t._w+n*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;const l=1-a*a;if(l<=Number.EPSILON){const f=1-e;return this._w=f*o+e*this._w,this._x=f*n+e*this._x,this._y=f*s+e*this._y,this._z=f*r+e*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,a),h=Math.sin((1-e)*u)/c,d=Math.sin(e*u)/c;return this._w=o*h+this._w*d,this._x=n*h+this._x*d,this._y=s*h+this._y*d,this._z=r*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class O{constructor(t=0,e=0,n=0){O.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Sl.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Sl.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*s-a*n),u=2*(a*e-r*s),h=2*(r*n-o*e);return this.x=e+l*c+o*h-a*u,this.y=n+l*u+a*c-r*h,this.z=s+l*h+r*u-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,l=e.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Xr.copy(this).projectOnVector(t),this.sub(Xr)}reflect(t){return this.sub(Xr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Pe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Xr=new O,Sl=new Is;class ni{constructor(t=new O(1/0,1/0,1/0),e=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(ln.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(ln.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=ln.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,ln):ln.fromBufferAttribute(r,o),ln.applyMatrix4(t.matrixWorld),this.expandByPoint(ln);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Fs.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Fs.copy(n.boundingBox)),Fs.applyMatrix4(t.matrixWorld),this.union(Fs)}const s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,ln),ln.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(cs),Os.subVectors(this.max,cs),Ei.subVectors(t.a,cs),Ti.subVectors(t.b,cs),Ai.subVectors(t.c,cs),Wn.subVectors(Ti,Ei),Xn.subVectors(Ai,Ti),si.subVectors(Ei,Ai);let e=[0,-Wn.z,Wn.y,0,-Xn.z,Xn.y,0,-si.z,si.y,Wn.z,0,-Wn.x,Xn.z,0,-Xn.x,si.z,0,-si.x,-Wn.y,Wn.x,0,-Xn.y,Xn.x,0,-si.y,si.x,0];return!Yr(e,Ei,Ti,Ai,Os)||(e=[1,0,0,0,1,0,0,0,1],!Yr(e,Ei,Ti,Ai,Os))?!1:(ks.crossVectors(Wn,Xn),e=[ks.x,ks.y,ks.z],Yr(e,Ei,Ti,Ai,Os))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,ln).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(ln).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Rn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Rn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Rn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Rn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Rn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Rn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Rn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Rn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Rn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Rn=[new O,new O,new O,new O,new O,new O,new O,new O],ln=new O,Fs=new ni,Ei=new O,Ti=new O,Ai=new O,Wn=new O,Xn=new O,si=new O,cs=new O,Os=new O,ks=new O,ri=new O;function Yr(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){ri.fromArray(i,r);const a=s.x*Math.abs(ri.x)+s.y*Math.abs(ri.y)+s.z*Math.abs(ri.z),l=t.dot(ri),c=e.dot(ri),u=n.dot(ri);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}const Jh=new ni,us=new O,qr=new O;class Tn{constructor(t=new O,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Jh.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;us.subVectors(t,this.center);const e=us.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(us,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(qr.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(us.copy(t.center).add(qr)),this.expandByPoint(us.copy(t.center).sub(qr))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Pn=new O,Zr=new O,zs=new O,Yn=new O,Kr=new O,Bs=new O,Jr=new O;class Ir{constructor(t=new O,e=new O(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Pn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=Pn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Pn.copy(this.origin).addScaledVector(this.direction,e),Pn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Zr.copy(t).add(e).multiplyScalar(.5),zs.copy(e).sub(t).normalize(),Yn.copy(this.origin).sub(Zr);const r=t.distanceTo(e)*.5,o=-this.direction.dot(zs),a=Yn.dot(this.direction),l=-Yn.dot(zs),c=Yn.lengthSq(),u=Math.abs(1-o*o);let h,d,f,g;if(u>0)if(h=o*l-a,d=o*a-l,g=r*u,h>=0)if(d>=-g)if(d<=g){const v=1/u;h*=v,d*=v,f=h*(h+o*d+2*a)+d*(o*h+d+2*l)+c}else d=r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*l)+c;else d=-r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*l)+c;else d<=-g?(h=Math.max(0,-(-o*r+a)),d=h>0?-r:Math.min(Math.max(-r,-l),r),f=-h*h+d*(d+2*l)+c):d<=g?(h=0,d=Math.min(Math.max(-r,-l),r),f=d*(d+2*l)+c):(h=Math.max(0,-(o*r+a)),d=h>0?r:Math.min(Math.max(-r,-l),r),f=-h*h+d*(d+2*l)+c);else d=o>0?-r:r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,h),s&&s.copy(Zr).addScaledVector(zs,d),f}intersectSphere(t,e){Pn.subVectors(t.center,this.origin);const n=Pn.dot(this.direction),s=Pn.dot(Pn)-n*n,r=t.radius*t.radius;if(s>r)return null;const o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return c>=0?(n=(t.min.x-d.x)*c,s=(t.max.x-d.x)*c):(n=(t.max.x-d.x)*c,s=(t.min.x-d.x)*c),u>=0?(r=(t.min.y-d.y)*u,o=(t.max.y-d.y)*u):(r=(t.max.y-d.y)*u,o=(t.min.y-d.y)*u),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),h>=0?(a=(t.min.z-d.z)*h,l=(t.max.z-d.z)*h):(a=(t.max.z-d.z)*h,l=(t.min.z-d.z)*h),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Pn)!==null}intersectTriangle(t,e,n,s,r){Kr.subVectors(e,t),Bs.subVectors(n,t),Jr.crossVectors(Kr,Bs);let o=this.direction.dot(Jr),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Yn.subVectors(this.origin,t);const l=a*this.direction.dot(Bs.crossVectors(Yn,Bs));if(l<0)return null;const c=a*this.direction.dot(Kr.cross(Yn));if(c<0||l+c>o)return null;const u=-a*Yn.dot(Jr);return u<0?null:this.at(u/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Qt{constructor(t,e,n,s,r,o,a,l,c,u,h,d,f,g,v,m){Qt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c,u,h,d,f,g,v,m)}set(t,e,n,s,r,o,a,l,c,u,h,d,f,g,v,m){const p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=u,p[10]=h,p[14]=d,p[3]=f,p[7]=g,p[11]=v,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Qt().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,s=1/Ci.setFromMatrixColumn(t,0).length(),r=1/Ci.setFromMatrixColumn(t,1).length(),o=1/Ci.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),h=Math.sin(r);if(t.order==="XYZ"){const d=o*u,f=o*h,g=a*u,v=a*h;e[0]=l*u,e[4]=-l*h,e[8]=c,e[1]=f+g*c,e[5]=d-v*c,e[9]=-a*l,e[2]=v-d*c,e[6]=g+f*c,e[10]=o*l}else if(t.order==="YXZ"){const d=l*u,f=l*h,g=c*u,v=c*h;e[0]=d+v*a,e[4]=g*a-f,e[8]=o*c,e[1]=o*h,e[5]=o*u,e[9]=-a,e[2]=f*a-g,e[6]=v+d*a,e[10]=o*l}else if(t.order==="ZXY"){const d=l*u,f=l*h,g=c*u,v=c*h;e[0]=d-v*a,e[4]=-o*h,e[8]=g+f*a,e[1]=f+g*a,e[5]=o*u,e[9]=v-d*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){const d=o*u,f=o*h,g=a*u,v=a*h;e[0]=l*u,e[4]=g*c-f,e[8]=d*c+v,e[1]=l*h,e[5]=v*c+d,e[9]=f*c-g,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){const d=o*l,f=o*c,g=a*l,v=a*c;e[0]=l*u,e[4]=v-d*h,e[8]=g*h+f,e[1]=h,e[5]=o*u,e[9]=-a*u,e[2]=-c*u,e[6]=f*h+g,e[10]=d-v*h}else if(t.order==="XZY"){const d=o*l,f=o*c,g=a*l,v=a*c;e[0]=l*u,e[4]=-h,e[8]=c*u,e[1]=d*h+v,e[5]=o*u,e[9]=f*h-g,e[2]=g*h-f,e[6]=a*u,e[10]=v*h+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose($h,t,jh)}lookAt(t,e,n){const s=this.elements;return Je.subVectors(t,e),Je.lengthSq()===0&&(Je.z=1),Je.normalize(),qn.crossVectors(n,Je),qn.lengthSq()===0&&(Math.abs(n.z)===1?Je.x+=1e-4:Je.z+=1e-4,Je.normalize(),qn.crossVectors(n,Je)),qn.normalize(),Hs.crossVectors(Je,qn),s[0]=qn.x,s[4]=Hs.x,s[8]=Je.x,s[1]=qn.y,s[5]=Hs.y,s[9]=Je.y,s[2]=qn.z,s[6]=Hs.z,s[10]=Je.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],u=n[1],h=n[5],d=n[9],f=n[13],g=n[2],v=n[6],m=n[10],p=n[14],y=n[3],M=n[7],_=n[11],X=n[15],R=s[0],L=s[4],D=s[8],E=s[12],x=s[1],I=s[5],G=s[9],V=s[13],T=s[2],U=s[6],k=s[10],b=s[14],P=s[3],q=s[7],et=s[11],$=s[15];return r[0]=o*R+a*x+l*T+c*P,r[4]=o*L+a*I+l*U+c*q,r[8]=o*D+a*G+l*k+c*et,r[12]=o*E+a*V+l*b+c*$,r[1]=u*R+h*x+d*T+f*P,r[5]=u*L+h*I+d*U+f*q,r[9]=u*D+h*G+d*k+f*et,r[13]=u*E+h*V+d*b+f*$,r[2]=g*R+v*x+m*T+p*P,r[6]=g*L+v*I+m*U+p*q,r[10]=g*D+v*G+m*k+p*et,r[14]=g*E+v*V+m*b+p*$,r[3]=y*R+M*x+_*T+X*P,r[7]=y*L+M*I+_*U+X*q,r[11]=y*D+M*G+_*k+X*et,r[15]=y*E+M*V+_*b+X*$,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],l=t[9],c=t[13],u=t[2],h=t[6],d=t[10],f=t[14],g=t[3],v=t[7],m=t[11],p=t[15];return g*(+r*l*h-s*c*h-r*a*d+n*c*d+s*a*f-n*l*f)+v*(+e*l*f-e*c*d+r*o*d-s*o*f+s*c*u-r*l*u)+m*(+e*c*h-e*a*f-r*o*h+n*o*f+r*a*u-n*c*u)+p*(-s*a*u-e*l*h+e*a*d+s*o*h-n*o*d+n*l*u)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],h=t[9],d=t[10],f=t[11],g=t[12],v=t[13],m=t[14],p=t[15],y=h*m*c-v*d*c+v*l*f-a*m*f-h*l*p+a*d*p,M=g*d*c-u*m*c-g*l*f+o*m*f+u*l*p-o*d*p,_=u*v*c-g*h*c+g*a*f-o*v*f-u*a*p+o*h*p,X=g*h*l-u*v*l-g*a*d+o*v*d+u*a*m-o*h*m,R=e*y+n*M+s*_+r*X;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const L=1/R;return t[0]=y*L,t[1]=(v*d*r-h*m*r-v*s*f+n*m*f+h*s*p-n*d*p)*L,t[2]=(a*m*r-v*l*r+v*s*c-n*m*c-a*s*p+n*l*p)*L,t[3]=(h*l*r-a*d*r-h*s*c+n*d*c+a*s*f-n*l*f)*L,t[4]=M*L,t[5]=(u*m*r-g*d*r+g*s*f-e*m*f-u*s*p+e*d*p)*L,t[6]=(g*l*r-o*m*r-g*s*c+e*m*c+o*s*p-e*l*p)*L,t[7]=(o*d*r-u*l*r+u*s*c-e*d*c-o*s*f+e*l*f)*L,t[8]=_*L,t[9]=(g*h*r-u*v*r-g*n*f+e*v*f+u*n*p-e*h*p)*L,t[10]=(o*v*r-g*a*r+g*n*c-e*v*c-o*n*p+e*a*p)*L,t[11]=(u*a*r-o*h*r-u*n*c+e*h*c+o*n*f-e*a*f)*L,t[12]=X*L,t[13]=(u*v*s-g*h*s+g*n*d-e*v*d-u*n*m+e*h*m)*L,t[14]=(g*a*s-o*v*s-g*n*l+e*v*l+o*n*m-e*a*m)*L,t[15]=(o*h*s-u*a*s+u*n*l-e*h*l-o*n*d+e*a*d)*L,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,l=t.z,c=r*o,u=r*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,u*a+n,u*l-s*o,0,c*l-s*a,u*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,o=e._y,a=e._z,l=e._w,c=r+r,u=o+o,h=a+a,d=r*c,f=r*u,g=r*h,v=o*u,m=o*h,p=a*h,y=l*c,M=l*u,_=l*h,X=n.x,R=n.y,L=n.z;return s[0]=(1-(v+p))*X,s[1]=(f+_)*X,s[2]=(g-M)*X,s[3]=0,s[4]=(f-_)*R,s[5]=(1-(d+p))*R,s[6]=(m+y)*R,s[7]=0,s[8]=(g+M)*L,s[9]=(m-y)*L,s[10]=(1-(d+v))*L,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;let r=Ci.set(s[0],s[1],s[2]).length();const o=Ci.set(s[4],s[5],s[6]).length(),a=Ci.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],cn.copy(this);const c=1/r,u=1/o,h=1/a;return cn.elements[0]*=c,cn.elements[1]*=c,cn.elements[2]*=c,cn.elements[4]*=u,cn.elements[5]*=u,cn.elements[6]*=u,cn.elements[8]*=h,cn.elements[9]*=h,cn.elements[10]*=h,e.setFromRotationMatrix(cn),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,s,r,o,a=On){const l=this.elements,c=2*r/(e-t),u=2*r/(n-s),h=(e+t)/(e-t),d=(n+s)/(n-s);let f,g;if(a===On)f=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===yr)f=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=u,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=On){const l=this.elements,c=1/(e-t),u=1/(n-s),h=1/(o-r),d=(e+t)*c,f=(n+s)*u;let g,v;if(a===On)g=(o+r)*h,v=-2*h;else if(a===yr)g=r*h,v=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=v,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Ci=new O,cn=new Qt,$h=new O(0,0,0),jh=new O(1,1,1),qn=new O,Hs=new O,Je=new O,wl=new Qt,bl=new Is;class En{constructor(t=0,e=0,n=0,s=En.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],u=s[9],h=s[2],d=s[6],f=s[10];switch(e){case"XYZ":this._y=Math.asin(Pe(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Pe(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin(Pe(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Pe(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Pe(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-Pe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return wl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(wl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return bl.setFromEuler(this),this.setFromQuaternion(bl,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}En.DEFAULT_ORDER="XYZ";class mu{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Qh=0;const El=new O,Ri=new Is,In=new Qt,Gs=new O,hs=new O,tf=new O,ef=new Is,Tl=new O(1,0,0),Al=new O(0,1,0),Cl=new O(0,0,1),Rl={type:"added"},nf={type:"removed"},Pi={type:"childadded",child:null},$r={type:"childremoved",child:null};class Jt extends is{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Qh++}),this.uuid=xi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Jt.DEFAULT_UP.clone();const t=new O,e=new En,n=new Is,s=new O(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Qt},normalMatrix:{value:new jt}}),this.matrix=new Qt,this.matrixWorld=new Qt,this.matrixAutoUpdate=Jt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Jt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new mu,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Ri.setFromAxisAngle(t,e),this.quaternion.multiply(Ri),this}rotateOnWorldAxis(t,e){return Ri.setFromAxisAngle(t,e),this.quaternion.premultiply(Ri),this}rotateX(t){return this.rotateOnAxis(Tl,t)}rotateY(t){return this.rotateOnAxis(Al,t)}rotateZ(t){return this.rotateOnAxis(Cl,t)}translateOnAxis(t,e){return El.copy(t).applyQuaternion(this.quaternion),this.position.add(El.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Tl,t)}translateY(t){return this.translateOnAxis(Al,t)}translateZ(t){return this.translateOnAxis(Cl,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(In.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Gs.copy(t):Gs.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),hs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?In.lookAt(hs,Gs,this.up):In.lookAt(Gs,hs,this.up),this.quaternion.setFromRotationMatrix(In),s&&(In.extractRotation(s.matrixWorld),Ri.setFromRotationMatrix(In),this.quaternion.premultiply(Ri.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Rl),Pi.child=t,this.dispatchEvent(Pi),Pi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(nf),$r.child=t,this.dispatchEvent($r),$r.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),In.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),In.multiply(t.parent.matrixWorld)),t.applyMatrix4(In),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Rl),Pi.child=t,this.dispatchEvent(Pi),Pi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(hs,t,tf),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(hs,ef,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];r(t.shapes,h)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(t.materials,this.material[l]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];s.animations.push(r(t.animations,l))}}if(e){const a=o(t.geometries),l=o(t.materials),c=o(t.textures),u=o(t.images),h=o(t.shapes),d=o(t.skeletons),f=o(t.animations),g=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){const l=[];for(const c in a){const u=a[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}Jt.DEFAULT_UP=new O(0,1,0);Jt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Jt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const un=new O,Ln=new O,jr=new O,Dn=new O,Ii=new O,Li=new O,Pl=new O,Qr=new O,to=new O,eo=new O,no=new ce,io=new ce,so=new ce;class dn{constructor(t=new O,e=new O,n=new O){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),un.subVectors(t,e),s.cross(un);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){un.subVectors(s,e),Ln.subVectors(n,e),jr.subVectors(t,e);const o=un.dot(un),a=un.dot(Ln),l=un.dot(jr),c=Ln.dot(Ln),u=Ln.dot(jr),h=o*c-a*a;if(h===0)return r.set(0,0,0),null;const d=1/h,f=(c*l-a*u)*d,g=(o*u-a*l)*d;return r.set(1-f-g,g,f)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Dn)===null?!1:Dn.x>=0&&Dn.y>=0&&Dn.x+Dn.y<=1}static getInterpolation(t,e,n,s,r,o,a,l){return this.getBarycoord(t,e,n,s,Dn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Dn.x),l.addScaledVector(o,Dn.y),l.addScaledVector(a,Dn.z),l)}static getInterpolatedAttribute(t,e,n,s,r,o){return no.setScalar(0),io.setScalar(0),so.setScalar(0),no.fromBufferAttribute(t,e),io.fromBufferAttribute(t,n),so.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(no,r.x),o.addScaledVector(io,r.y),o.addScaledVector(so,r.z),o}static isFrontFacing(t,e,n,s){return un.subVectors(n,e),Ln.subVectors(t,e),un.cross(Ln).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return un.subVectors(this.c,this.b),Ln.subVectors(this.a,this.b),un.cross(Ln).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return dn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return dn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return dn.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return dn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return dn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let o,a;Ii.subVectors(s,n),Li.subVectors(r,n),Qr.subVectors(t,n);const l=Ii.dot(Qr),c=Li.dot(Qr);if(l<=0&&c<=0)return e.copy(n);to.subVectors(t,s);const u=Ii.dot(to),h=Li.dot(to);if(u>=0&&h<=u)return e.copy(s);const d=l*h-u*c;if(d<=0&&l>=0&&u<=0)return o=l/(l-u),e.copy(n).addScaledVector(Ii,o);eo.subVectors(t,r);const f=Ii.dot(eo),g=Li.dot(eo);if(g>=0&&f<=g)return e.copy(r);const v=f*c-l*g;if(v<=0&&c>=0&&g<=0)return a=c/(c-g),e.copy(n).addScaledVector(Li,a);const m=u*g-f*h;if(m<=0&&h-u>=0&&f-g>=0)return Pl.subVectors(r,s),a=(h-u)/(h-u+(f-g)),e.copy(s).addScaledVector(Pl,a);const p=1/(m+v+d);return o=v*p,a=d*p,e.copy(n).addScaledVector(Ii,o).addScaledVector(Li,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const gu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Zn={h:0,s:0,l:0},Vs={h:0,s:0,l:0};function ro(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class ut{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ye){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ae.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=ae.workingColorSpace){return this.r=t,this.g=e,this.b=n,ae.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=ae.workingColorSpace){if(t=Bh(t,1),e=Pe(e,0,1),n=Pe(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=ro(o,r,t+1/3),this.g=ro(o,r,t),this.b=ro(o,r,t-1/3)}return ae.toWorkingColorSpace(this,s),this}setStyle(t,e=Ye){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ye){const n=gu[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Bn(t.r),this.g=Bn(t.g),this.b=Bn(t.b),this}copyLinearToSRGB(t){return this.r=Yi(t.r),this.g=Yi(t.g),this.b=Yi(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ye){return ae.fromWorkingColorSpace(Ne.copy(this),t),Math.round(Pe(Ne.r*255,0,255))*65536+Math.round(Pe(Ne.g*255,0,255))*256+Math.round(Pe(Ne.b*255,0,255))}getHexString(t=Ye){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ae.workingColorSpace){ae.fromWorkingColorSpace(Ne.copy(this),e);const n=Ne.r,s=Ne.g,r=Ne.b,o=Math.max(n,s,r),a=Math.min(n,s,r);let l,c;const u=(a+o)/2;if(a===o)l=0,c=0;else{const h=o-a;switch(c=u<=.5?h/(o+a):h/(2-o-a),o){case n:l=(s-r)/h+(s<r?6:0);break;case s:l=(r-n)/h+2;break;case r:l=(n-s)/h+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=ae.workingColorSpace){return ae.fromWorkingColorSpace(Ne.copy(this),e),t.r=Ne.r,t.g=Ne.g,t.b=Ne.b,t}getStyle(t=Ye){ae.fromWorkingColorSpace(Ne.copy(this),t);const e=Ne.r,n=Ne.g,s=Ne.b;return t!==Ye?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Zn),this.setHSL(Zn.h+t,Zn.s+e,Zn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Zn),t.getHSL(Vs);const n=Gr(Zn.h,Vs.h,e),s=Gr(Zn.s,Vs.s,e),r=Gr(Zn.l,Vs.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ne=new ut;ut.NAMES=gu;let sf=0;class Mi extends is{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:sf++}),this.uuid=xi(),this.name="",this.blending=Ge,this.side=ti,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Do,this.blendDst=Uo,this.blendEquation=di,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ut(0,0,0),this.blendAlpha=0,this.depthFunc=Zi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=dl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=wi,this.stencilZFail=wi,this.stencilZPass=wi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Ge&&(n.blending=this.blending),this.side!==ti&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Do&&(n.blendSrc=this.blendSrc),this.blendDst!==Uo&&(n.blendDst=this.blendDst),this.blendEquation!==di&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Zi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==dl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==wi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==wi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==wi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const o=[];for(const a in r){const l=r[a];delete l.metadata,o.push(l)}return o}if(e){const r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class gn extends Mi{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new ut(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new En,this.combine=Qc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const we=new O,Ws=new Tt;class Se{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=pl,this.updateRanges=[],this.gpuType=mn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Ws.fromBufferAttribute(this,e),Ws.applyMatrix3(t),this.setXY(e,Ws.x,Ws.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)we.fromBufferAttribute(this,e),we.applyMatrix3(t),this.setXYZ(e,we.x,we.y,we.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)we.fromBufferAttribute(this,e),we.applyMatrix4(t),this.setXYZ(e,we.x,we.y,we.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)we.fromBufferAttribute(this,e),we.applyNormalMatrix(t),this.setXYZ(e,we.x,we.y,we.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)we.fromBufferAttribute(this,e),we.transformDirection(t),this.setXYZ(e,we.x,we.y,we.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=ls(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=We(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=ls(e,this.array)),e}setX(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=ls(e,this.array)),e}setY(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=ls(e,this.array)),e}setZ(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=ls(e,this.array)),e}setW(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=We(e,this.array),n=We(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=We(e,this.array),n=We(n,this.array),s=We(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=We(e,this.array),n=We(n,this.array),s=We(s,this.array),r=We(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==pl&&(t.usage=this.usage),t}}class vu extends Se{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class _u extends Se{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class Zt extends Se{constructor(t,e,n){super(new Float32Array(t),e,n)}}let rf=0;const nn=new Qt,oo=new Jt,Di=new O,$e=new ni,fs=new ni,Re=new O;class ye extends is{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:rf++}),this.uuid=xi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(fu(t)?_u:vu)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new jt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return nn.makeRotationFromQuaternion(t),this.applyMatrix4(nn),this}rotateX(t){return nn.makeRotationX(t),this.applyMatrix4(nn),this}rotateY(t){return nn.makeRotationY(t),this.applyMatrix4(nn),this}rotateZ(t){return nn.makeRotationZ(t),this.applyMatrix4(nn),this}translate(t,e,n){return nn.makeTranslation(t,e,n),this.applyMatrix4(nn),this}scale(t,e,n){return nn.makeScale(t,e,n),this.applyMatrix4(nn),this}lookAt(t){return oo.lookAt(t),oo.updateMatrix(),this.applyMatrix4(oo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Di).negate(),this.translate(Di.x,Di.y,Di.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let s=0,r=t.length;s<r;s++){const o=t[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Zt(n,3))}else{for(let n=0,s=e.count;n<s;n++){const r=t[n];e.setXYZ(n,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ni);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];$e.setFromBufferAttribute(r),this.morphTargetsRelative?(Re.addVectors(this.boundingBox.min,$e.min),this.boundingBox.expandByPoint(Re),Re.addVectors(this.boundingBox.max,$e.max),this.boundingBox.expandByPoint(Re)):(this.boundingBox.expandByPoint($e.min),this.boundingBox.expandByPoint($e.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Tn);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(t){const n=this.boundingSphere.center;if($e.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){const a=e[r];fs.setFromBufferAttribute(a),this.morphTargetsRelative?(Re.addVectors($e.min,fs.min),$e.expandByPoint(Re),Re.addVectors($e.max,fs.max),$e.expandByPoint(Re)):($e.expandByPoint(fs.min),$e.expandByPoint(fs.max))}$e.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)Re.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Re));if(e)for(let r=0,o=e.length;r<o;r++){const a=e[r],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)Re.fromBufferAttribute(a,c),l&&(Di.fromBufferAttribute(t,c),Re.add(Di)),s=Math.max(s,n.distanceToSquared(Re))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Se(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],l=[];for(let D=0;D<n.count;D++)a[D]=new O,l[D]=new O;const c=new O,u=new O,h=new O,d=new Tt,f=new Tt,g=new Tt,v=new O,m=new O;function p(D,E,x){c.fromBufferAttribute(n,D),u.fromBufferAttribute(n,E),h.fromBufferAttribute(n,x),d.fromBufferAttribute(r,D),f.fromBufferAttribute(r,E),g.fromBufferAttribute(r,x),u.sub(c),h.sub(c),f.sub(d),g.sub(d);const I=1/(f.x*g.y-g.x*f.y);isFinite(I)&&(v.copy(u).multiplyScalar(g.y).addScaledVector(h,-f.y).multiplyScalar(I),m.copy(h).multiplyScalar(f.x).addScaledVector(u,-g.x).multiplyScalar(I),a[D].add(v),a[E].add(v),a[x].add(v),l[D].add(m),l[E].add(m),l[x].add(m))}let y=this.groups;y.length===0&&(y=[{start:0,count:t.count}]);for(let D=0,E=y.length;D<E;++D){const x=y[D],I=x.start,G=x.count;for(let V=I,T=I+G;V<T;V+=3)p(t.getX(V+0),t.getX(V+1),t.getX(V+2))}const M=new O,_=new O,X=new O,R=new O;function L(D){X.fromBufferAttribute(s,D),R.copy(X);const E=a[D];M.copy(E),M.sub(X.multiplyScalar(X.dot(E))).normalize(),_.crossVectors(R,E);const I=_.dot(l[D])<0?-1:1;o.setXYZW(D,M.x,M.y,M.z,I)}for(let D=0,E=y.length;D<E;++D){const x=y[D],I=x.start,G=x.count;for(let V=I,T=I+G;V<T;V+=3)L(t.getX(V+0)),L(t.getX(V+1)),L(t.getX(V+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Se(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);const s=new O,r=new O,o=new O,a=new O,l=new O,c=new O,u=new O,h=new O;if(t)for(let d=0,f=t.count;d<f;d+=3){const g=t.getX(d+0),v=t.getX(d+1),m=t.getX(d+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,v),o.fromBufferAttribute(e,m),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,v),c.fromBufferAttribute(n,m),a.add(u),l.add(u),c.add(u),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(v,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,f=e.count;d<f;d+=3)s.fromBufferAttribute(e,d+0),r.fromBufferAttribute(e,d+1),o.fromBufferAttribute(e,d+2),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Re.fromBufferAttribute(t,e),Re.normalize(),t.setXYZ(e,Re.x,Re.y,Re.z)}toNonIndexed(){function t(a,l){const c=a.array,u=a.itemSize,h=a.normalized,d=new c.constructor(l.length*u);let f=0,g=0;for(let v=0,m=l.length;v<m;v++){a.isInterleavedBufferAttribute?f=l[v]*a.data.stride+a.offset:f=l[v]*u;for(let p=0;p<u;p++)d[g++]=c[f++]}return new Se(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new ye,n=this.index.array,s=this.attributes;for(const a in s){const l=s[a],c=t(l,n);e.setAttribute(a,c)}const r=this.morphAttributes;for(const a in r){const l=[],c=r[a];for(let u=0,h=c.length;u<h;u++){const d=c[u],f=t(d,n);l.push(f)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const s={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,d=c.length;h<d;h++){const f=c[h];u.push(f.toJSON(t.data))}u.length>0&&(s[l]=u,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const s=t.attributes;for(const c in s){const u=s[c];this.setAttribute(c,u.clone(e))}const r=t.morphAttributes;for(const c in r){const u=[],h=r[c];for(let d=0,f=h.length;d<f;d++)u.push(h[d].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let c=0,u=o.length;c<u;c++){const h=o[c];this.addGroup(h.start,h.count,h.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Il=new Qt,oi=new Ir,Xs=new Tn,Ll=new O,Ys=new O,qs=new O,Zs=new O,ao=new O,Ks=new O,Dl=new O,Js=new O;class Yt extends Jt{constructor(t=new ye,e=new gn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const a=this.morphTargetInfluences;if(r&&a){Ks.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const u=a[l],h=r[l];u!==0&&(ao.fromBufferAttribute(h,t),o?Ks.addScaledVector(ao,u):Ks.addScaledVector(ao.sub(e),u))}e.add(Ks)}return e}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Xs.copy(n.boundingSphere),Xs.applyMatrix4(r),oi.copy(t.ray).recast(t.near),!(Xs.containsPoint(oi.origin)===!1&&(oi.intersectSphere(Xs,Ll)===null||oi.origin.distanceToSquared(Ll)>(t.far-t.near)**2))&&(Il.copy(r).invert(),oi.copy(t.ray).applyMatrix4(Il),!(n.boundingBox!==null&&oi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,oi)))}_computeIntersections(t,e,n){let s;const r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,h=r.attributes.normal,d=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,v=d.length;g<v;g++){const m=d[g],p=o[m.materialIndex],y=Math.max(m.start,f.start),M=Math.min(a.count,Math.min(m.start+m.count,f.start+f.count));for(let _=y,X=M;_<X;_+=3){const R=a.getX(_),L=a.getX(_+1),D=a.getX(_+2);s=$s(this,p,t,n,c,u,h,R,L,D),s&&(s.faceIndex=Math.floor(_/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,f.start),v=Math.min(a.count,f.start+f.count);for(let m=g,p=v;m<p;m+=3){const y=a.getX(m),M=a.getX(m+1),_=a.getX(m+2);s=$s(this,o,t,n,c,u,h,y,M,_),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,v=d.length;g<v;g++){const m=d[g],p=o[m.materialIndex],y=Math.max(m.start,f.start),M=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let _=y,X=M;_<X;_+=3){const R=_,L=_+1,D=_+2;s=$s(this,p,t,n,c,u,h,R,L,D),s&&(s.faceIndex=Math.floor(_/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,f.start),v=Math.min(l.count,f.start+f.count);for(let m=g,p=v;m<p;m+=3){const y=m,M=m+1,_=m+2;s=$s(this,o,t,n,c,u,h,y,M,_),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}}function of(i,t,e,n,s,r,o,a){let l;if(t.side===He?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,t.side===ti,a),l===null)return null;Js.copy(a),Js.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(Js);return c<e.near||c>e.far?null:{distance:c,point:Js.clone(),object:i}}function $s(i,t,e,n,s,r,o,a,l,c){i.getVertexPosition(a,Ys),i.getVertexPosition(l,qs),i.getVertexPosition(c,Zs);const u=of(i,t,e,n,Ys,qs,Zs,Dl);if(u){const h=new O;dn.getBarycoord(Dl,Ys,qs,Zs,h),s&&(u.uv=dn.getInterpolatedAttribute(s,a,l,c,h,new Tt)),r&&(u.uv1=dn.getInterpolatedAttribute(r,a,l,c,h,new Tt)),o&&(u.normal=dn.getInterpolatedAttribute(o,a,l,c,h,new O),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const d={a,b:l,c,normal:new O,materialIndex:0};dn.getNormal(Ys,qs,Zs,d.normal),u.face=d,u.barycoord=h}return u}class pe extends ye{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};const a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);const l=[],c=[],u=[],h=[];let d=0,f=0;g("z","y","x",-1,-1,n,e,t,o,r,0),g("z","y","x",1,-1,n,e,-t,o,r,1),g("x","z","y",1,1,t,n,e,s,o,2),g("x","z","y",1,-1,t,n,-e,s,o,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Zt(c,3)),this.setAttribute("normal",new Zt(u,3)),this.setAttribute("uv",new Zt(h,2));function g(v,m,p,y,M,_,X,R,L,D,E){const x=_/L,I=X/D,G=_/2,V=X/2,T=R/2,U=L+1,k=D+1;let b=0,P=0;const q=new O;for(let et=0;et<k;et++){const $=et*I-V;for(let pt=0;pt<U;pt++){const Y=pt*x-G;q[v]=Y*y,q[m]=$*M,q[p]=T,c.push(q.x,q.y,q.z),q[v]=0,q[m]=0,q[p]=R>0?1:-1,u.push(q.x,q.y,q.z),h.push(pt/L),h.push(1-et/D),b+=1}}for(let et=0;et<D;et++)for(let $=0;$<L;$++){const pt=d+$+U*et,Y=d+$+U*(et+1),K=d+($+1)+U*(et+1),z=d+($+1)+U*et;l.push(pt,Y,z),l.push(Y,K,z),P+=6}a.addGroup(f,P,E),f+=P,d+=b}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new pe(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function ts(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function ze(i){const t={};for(let e=0;e<i.length;e++){const n=ts(i[e]);for(const s in n)t[s]=n[s]}return t}function af(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function xu(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ae.workingColorSpace}const lf={clone:ts,merge:ze};var cf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,uf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Ee extends Mi{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=cf,this.fragmentShader=uf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ts(t.uniforms),this.uniformsGroups=af(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class Mu extends Jt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Qt,this.projectionMatrix=new Qt,this.projectionMatrixInverse=new Qt,this.coordinateSystem=On}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Kn=new O,Ul=new Tt,Nl=new Tt;class Qe extends Mu{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=va*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Hr*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return va*2*Math.atan(Math.tan(Hr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Kn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Kn.x,Kn.y).multiplyScalar(-t/Kn.z),Kn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Kn.x,Kn.y).multiplyScalar(-t/Kn.z)}getViewSize(t,e){return this.getViewBounds(t,Ul,Nl),e.subVectors(Nl,Ul)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Hr*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,e-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}const a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const Ui=-90,Ni=1;class hf extends Jt{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Qe(Ui,Ni,t,e);s.layers=this.layers,this.add(s);const r=new Qe(Ui,Ni,t,e);r.layers=this.layers,this.add(r);const o=new Qe(Ui,Ni,t,e);o.layers=this.layers,this.add(o);const a=new Qe(Ui,Ni,t,e);a.layers=this.layers,this.add(a);const l=new Qe(Ui,Ni,t,e);l.layers=this.layers,this.add(l);const c=new Qe(Ui,Ni,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,l]=e;for(const c of e)this.remove(c);if(t===On)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===yr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,o,a,l,c,u]=this.children,h=t.getRenderTarget(),d=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,o),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=v,t.setRenderTarget(n,5,s),t.render(e,u),t.setRenderTarget(h,d,f),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class yu extends ke{constructor(t,e,n,s,r,o,a,l,c,u){t=t!==void 0?t:[],e=e!==void 0?e:Ki,super(t,e,n,s,r,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class ff extends ei{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new yu(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Be}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new pe(5,5,5),r=new Ee({name:"CubemapFromEquirect",uniforms:ts(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:He,blending:$n});r.uniforms.tEquirect.value=e;const o=new Yt(s,r),a=e.minFilter;return e.minFilter===Sn&&(e.minFilter=Be),new hf(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,s){const r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}}const lo=new O,df=new O,pf=new jt;class hi{constructor(t=new O(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=lo.subVectors(n,e).cross(df.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(lo),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||pf.getNormalMatrix(t),s=this.coplanarPoint(lo).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const ai=new Tn,js=new O;class za{constructor(t=new hi,e=new hi,n=new hi,s=new hi,r=new hi,o=new hi){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=On){const n=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],u=s[5],h=s[6],d=s[7],f=s[8],g=s[9],v=s[10],m=s[11],p=s[12],y=s[13],M=s[14],_=s[15];if(n[0].setComponents(l-r,d-c,m-f,_-p).normalize(),n[1].setComponents(l+r,d+c,m+f,_+p).normalize(),n[2].setComponents(l+o,d+u,m+g,_+y).normalize(),n[3].setComponents(l-o,d-u,m-g,_-y).normalize(),n[4].setComponents(l-a,d-h,m-v,_-M).normalize(),e===On)n[5].setComponents(l+a,d+h,m+v,_+M).normalize();else if(e===yr)n[5].setComponents(a,h,v,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),ai.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),ai.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(ai)}intersectsSprite(t){return ai.center.set(0,0,0),ai.radius=.7071067811865476,ai.applyMatrix4(t.matrixWorld),this.intersectsSphere(ai)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(js.x=s.normal.x>0?t.max.x:t.min.x,js.y=s.normal.y>0?t.max.y:t.min.y,js.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(js)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Su(){let i=null,t=!1,e=null,n=null;function s(r,o){e(r,o),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function mf(i){const t=new WeakMap;function e(a,l){const c=a.array,u=a.usage,h=c.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,c,u),a.onUploadCallback();let f;if(c instanceof Float32Array)f=i.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=i.SHORT;else if(c instanceof Uint32Array)f=i.UNSIGNED_INT;else if(c instanceof Int32Array)f=i.INT;else if(c instanceof Int8Array)f=i.BYTE;else if(c instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:h}}function n(a,l,c){const u=l.array,h=l.updateRanges;if(i.bindBuffer(c,a),h.length===0)i.bufferSubData(c,0,u);else{h.sort((f,g)=>f.start-g.start);let d=0;for(let f=1;f<h.length;f++){const g=h[d],v=h[f];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++d,h[d]=v)}h.length=d+1;for(let f=0,g=h.length;f<g;f++){const v=h[f];i.bufferSubData(c,v.start*u.BYTES_PER_ELEMENT,u,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=t.get(a);l&&(i.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const u=t.get(a);(!u||u.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}class Hn extends ye{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,o=e/2,a=Math.floor(n),l=Math.floor(s),c=a+1,u=l+1,h=t/a,d=e/l,f=[],g=[],v=[],m=[];for(let p=0;p<u;p++){const y=p*d-o;for(let M=0;M<c;M++){const _=M*h-r;g.push(_,-y,0),v.push(0,0,1),m.push(M/a),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let y=0;y<a;y++){const M=y+c*p,_=y+c*(p+1),X=y+1+c*(p+1),R=y+1+c*p;f.push(M,_,R),f.push(_,X,R)}this.setIndex(f),this.setAttribute("position",new Zt(g,3)),this.setAttribute("normal",new Zt(v,3)),this.setAttribute("uv",new Zt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Hn(t.width,t.height,t.widthSegments,t.heightSegments)}}var gf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,vf=`#ifdef USE_ALPHAHASH
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
#endif`,_f=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,xf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Mf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,yf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Sf=`#ifdef USE_AOMAP
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
#endif`,wf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,bf=`#ifdef USE_BATCHING
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
#endif`,Ef=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Tf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Af=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Cf=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Rf=`#ifdef USE_IRIDESCENCE
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
#endif`,Pf=`#ifdef USE_BUMPMAP
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
#endif`,If=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Lf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Df=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Uf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Nf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Ff=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Of=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,kf=`#if defined( USE_COLOR_ALPHA )
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
#endif`,zf=`#define PI 3.141592653589793
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
} // validated`,Bf=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Hf=`vec3 transformedNormal = objectNormal;
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
#endif`,Gf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Vf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Wf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Xf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Yf="gl_FragColor = linearToOutputTexel( gl_FragColor );",qf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Zf=`#ifdef USE_ENVMAP
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
#endif`,Kf=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Jf=`#ifdef USE_ENVMAP
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
#endif`,$f=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,jf=`#ifdef USE_ENVMAP
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
#endif`,Qf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,td=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,ed=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,nd=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,id=`#ifdef USE_GRADIENTMAP
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
}`,sd=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,rd=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,od=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,ad=`uniform bool receiveShadow;
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
#endif`,ld=`#ifdef USE_ENVMAP
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
#endif`,cd=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,ud=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,hd=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,fd=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,dd=`PhysicalMaterial material;
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
#endif`,pd=`struct PhysicalMaterial {
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
}`,md=`
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
#endif`,gd=`#if defined( RE_IndirectDiffuse )
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
#endif`,vd=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,_d=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,xd=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Md=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,yd=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Sd=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,wd=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,bd=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Ed=`#if defined( USE_POINTS_UV )
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
#endif`,Td=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Ad=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Cd=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Rd=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Pd=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Id=`#ifdef USE_MORPHTARGETS
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
#endif`,Ld=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Dd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Ud=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Nd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Fd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Od=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,kd=`#ifdef USE_NORMALMAP
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
#endif`,zd=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Bd=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Hd=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Gd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Vd=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Wd=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Xd=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Yd=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,qd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Zd=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Kd=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Jd=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,$d=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,jd=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Qd=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,tp=`float getShadowMask() {
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
}`,ep=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,np=`#ifdef USE_SKINNING
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
#endif`,ip=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,sp=`#ifdef USE_SKINNING
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
#endif`,rp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,op=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,ap=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,lp=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,cp=`#ifdef USE_TRANSMISSION
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
#endif`,up=`#ifdef USE_TRANSMISSION
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
#endif`,hp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,fp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,dp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,pp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const mp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,gp=`uniform sampler2D t2D;
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
}`,vp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,_p=`#ifdef ENVMAP_TYPE_CUBE
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
}`,xp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Mp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,yp=`#include <common>
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
}`,Sp=`#if DEPTH_PACKING == 3200
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
}`,wp=`#define DISTANCE
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
}`,bp=`#define DISTANCE
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
}`,Ep=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Tp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ap=`uniform float scale;
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
}`,Cp=`uniform vec3 diffuse;
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
}`,Rp=`#include <common>
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
}`,Pp=`uniform vec3 diffuse;
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
}`,Ip=`#define LAMBERT
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
}`,Lp=`#define LAMBERT
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
}`,Dp=`#define MATCAP
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
}`,Up=`#define MATCAP
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
}`,Np=`#define NORMAL
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
}`,Fp=`#define NORMAL
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
}`,Op=`#define PHONG
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
}`,kp=`#define PHONG
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
}`,zp=`#define STANDARD
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
}`,Bp=`#define STANDARD
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
}`,Hp=`#define TOON
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
}`,Gp=`#define TOON
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
}`,Vp=`uniform float size;
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
}`,Wp=`uniform vec3 diffuse;
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
}`,Xp=`#include <common>
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
}`,Yp=`uniform vec3 color;
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
}`,qp=`uniform float rotation;
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
}`,Zp=`uniform vec3 diffuse;
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
}`,te={alphahash_fragment:gf,alphahash_pars_fragment:vf,alphamap_fragment:_f,alphamap_pars_fragment:xf,alphatest_fragment:Mf,alphatest_pars_fragment:yf,aomap_fragment:Sf,aomap_pars_fragment:wf,batching_pars_vertex:bf,batching_vertex:Ef,begin_vertex:Tf,beginnormal_vertex:Af,bsdfs:Cf,iridescence_fragment:Rf,bumpmap_pars_fragment:Pf,clipping_planes_fragment:If,clipping_planes_pars_fragment:Lf,clipping_planes_pars_vertex:Df,clipping_planes_vertex:Uf,color_fragment:Nf,color_pars_fragment:Ff,color_pars_vertex:Of,color_vertex:kf,common:zf,cube_uv_reflection_fragment:Bf,defaultnormal_vertex:Hf,displacementmap_pars_vertex:Gf,displacementmap_vertex:Vf,emissivemap_fragment:Wf,emissivemap_pars_fragment:Xf,colorspace_fragment:Yf,colorspace_pars_fragment:qf,envmap_fragment:Zf,envmap_common_pars_fragment:Kf,envmap_pars_fragment:Jf,envmap_pars_vertex:$f,envmap_physical_pars_fragment:ld,envmap_vertex:jf,fog_vertex:Qf,fog_pars_vertex:td,fog_fragment:ed,fog_pars_fragment:nd,gradientmap_pars_fragment:id,lightmap_pars_fragment:sd,lights_lambert_fragment:rd,lights_lambert_pars_fragment:od,lights_pars_begin:ad,lights_toon_fragment:cd,lights_toon_pars_fragment:ud,lights_phong_fragment:hd,lights_phong_pars_fragment:fd,lights_physical_fragment:dd,lights_physical_pars_fragment:pd,lights_fragment_begin:md,lights_fragment_maps:gd,lights_fragment_end:vd,logdepthbuf_fragment:_d,logdepthbuf_pars_fragment:xd,logdepthbuf_pars_vertex:Md,logdepthbuf_vertex:yd,map_fragment:Sd,map_pars_fragment:wd,map_particle_fragment:bd,map_particle_pars_fragment:Ed,metalnessmap_fragment:Td,metalnessmap_pars_fragment:Ad,morphinstance_vertex:Cd,morphcolor_vertex:Rd,morphnormal_vertex:Pd,morphtarget_pars_vertex:Id,morphtarget_vertex:Ld,normal_fragment_begin:Dd,normal_fragment_maps:Ud,normal_pars_fragment:Nd,normal_pars_vertex:Fd,normal_vertex:Od,normalmap_pars_fragment:kd,clearcoat_normal_fragment_begin:zd,clearcoat_normal_fragment_maps:Bd,clearcoat_pars_fragment:Hd,iridescence_pars_fragment:Gd,opaque_fragment:Vd,packing:Wd,premultiplied_alpha_fragment:Xd,project_vertex:Yd,dithering_fragment:qd,dithering_pars_fragment:Zd,roughnessmap_fragment:Kd,roughnessmap_pars_fragment:Jd,shadowmap_pars_fragment:$d,shadowmap_pars_vertex:jd,shadowmap_vertex:Qd,shadowmask_pars_fragment:tp,skinbase_vertex:ep,skinning_pars_vertex:np,skinning_vertex:ip,skinnormal_vertex:sp,specularmap_fragment:rp,specularmap_pars_fragment:op,tonemapping_fragment:ap,tonemapping_pars_fragment:lp,transmission_fragment:cp,transmission_pars_fragment:up,uv_pars_fragment:hp,uv_pars_vertex:fp,uv_vertex:dp,worldpos_vertex:pp,background_vert:mp,background_frag:gp,backgroundCube_vert:vp,backgroundCube_frag:_p,cube_vert:xp,cube_frag:Mp,depth_vert:yp,depth_frag:Sp,distanceRGBA_vert:wp,distanceRGBA_frag:bp,equirect_vert:Ep,equirect_frag:Tp,linedashed_vert:Ap,linedashed_frag:Cp,meshbasic_vert:Rp,meshbasic_frag:Pp,meshlambert_vert:Ip,meshlambert_frag:Lp,meshmatcap_vert:Dp,meshmatcap_frag:Up,meshnormal_vert:Np,meshnormal_frag:Fp,meshphong_vert:Op,meshphong_frag:kp,meshphysical_vert:zp,meshphysical_frag:Bp,meshtoon_vert:Hp,meshtoon_frag:Gp,points_vert:Vp,points_frag:Wp,shadow_vert:Xp,shadow_frag:Yp,sprite_vert:qp,sprite_frag:Zp},Nt={common:{diffuse:{value:new ut(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new jt}},envmap:{envMap:{value:null},envMapRotation:{value:new jt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new jt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new jt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new jt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new jt},normalScale:{value:new Tt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new jt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new jt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new jt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new jt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ut(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ut(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0},uvTransform:{value:new jt}},sprite:{diffuse:{value:new ut(16777215)},opacity:{value:1},center:{value:new Tt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}}},Mn={basic:{uniforms:ze([Nt.common,Nt.specularmap,Nt.envmap,Nt.aomap,Nt.lightmap,Nt.fog]),vertexShader:te.meshbasic_vert,fragmentShader:te.meshbasic_frag},lambert:{uniforms:ze([Nt.common,Nt.specularmap,Nt.envmap,Nt.aomap,Nt.lightmap,Nt.emissivemap,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,Nt.fog,Nt.lights,{emissive:{value:new ut(0)}}]),vertexShader:te.meshlambert_vert,fragmentShader:te.meshlambert_frag},phong:{uniforms:ze([Nt.common,Nt.specularmap,Nt.envmap,Nt.aomap,Nt.lightmap,Nt.emissivemap,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,Nt.fog,Nt.lights,{emissive:{value:new ut(0)},specular:{value:new ut(1118481)},shininess:{value:30}}]),vertexShader:te.meshphong_vert,fragmentShader:te.meshphong_frag},standard:{uniforms:ze([Nt.common,Nt.envmap,Nt.aomap,Nt.lightmap,Nt.emissivemap,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,Nt.roughnessmap,Nt.metalnessmap,Nt.fog,Nt.lights,{emissive:{value:new ut(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag},toon:{uniforms:ze([Nt.common,Nt.aomap,Nt.lightmap,Nt.emissivemap,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,Nt.gradientmap,Nt.fog,Nt.lights,{emissive:{value:new ut(0)}}]),vertexShader:te.meshtoon_vert,fragmentShader:te.meshtoon_frag},matcap:{uniforms:ze([Nt.common,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,Nt.fog,{matcap:{value:null}}]),vertexShader:te.meshmatcap_vert,fragmentShader:te.meshmatcap_frag},points:{uniforms:ze([Nt.points,Nt.fog]),vertexShader:te.points_vert,fragmentShader:te.points_frag},dashed:{uniforms:ze([Nt.common,Nt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:te.linedashed_vert,fragmentShader:te.linedashed_frag},depth:{uniforms:ze([Nt.common,Nt.displacementmap]),vertexShader:te.depth_vert,fragmentShader:te.depth_frag},normal:{uniforms:ze([Nt.common,Nt.bumpmap,Nt.normalmap,Nt.displacementmap,{opacity:{value:1}}]),vertexShader:te.meshnormal_vert,fragmentShader:te.meshnormal_frag},sprite:{uniforms:ze([Nt.sprite,Nt.fog]),vertexShader:te.sprite_vert,fragmentShader:te.sprite_frag},background:{uniforms:{uvTransform:{value:new jt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:te.background_vert,fragmentShader:te.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new jt}},vertexShader:te.backgroundCube_vert,fragmentShader:te.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:te.cube_vert,fragmentShader:te.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:te.equirect_vert,fragmentShader:te.equirect_frag},distanceRGBA:{uniforms:ze([Nt.common,Nt.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:te.distanceRGBA_vert,fragmentShader:te.distanceRGBA_frag},shadow:{uniforms:ze([Nt.lights,Nt.fog,{color:{value:new ut(0)},opacity:{value:1}}]),vertexShader:te.shadow_vert,fragmentShader:te.shadow_frag}};Mn.physical={uniforms:ze([Mn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new jt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new jt},clearcoatNormalScale:{value:new Tt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new jt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new jt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new jt},sheen:{value:0},sheenColor:{value:new ut(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new jt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new jt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new jt},transmissionSamplerSize:{value:new Tt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new jt},attenuationDistance:{value:0},attenuationColor:{value:new ut(0)},specularColor:{value:new ut(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new jt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new jt},anisotropyVector:{value:new Tt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new jt}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag};const Qs={r:0,b:0,g:0},li=new En,Kp=new Qt;function Jp(i,t,e,n,s,r,o){const a=new ut(0);let l=r===!0?0:1,c,u,h=null,d=0,f=null;function g(y){let M=y.isScene===!0?y.background:null;return M&&M.isTexture&&(M=(y.backgroundBlurriness>0?e:t).get(M)),M}function v(y){let M=!1;const _=g(y);_===null?p(a,l):_&&_.isColor&&(p(_,1),M=!0);const X=i.xr.getEnvironmentBlendMode();X==="additive"?n.buffers.color.setClear(0,0,0,1,o):X==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||M)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(y,M){const _=g(M);_&&(_.isCubeTexture||_.mapping===Rr)?(u===void 0&&(u=new Yt(new pe(1,1,1),new Ee({name:"BackgroundCubeMaterial",uniforms:ts(Mn.backgroundCube.uniforms),vertexShader:Mn.backgroundCube.vertexShader,fragmentShader:Mn.backgroundCube.fragmentShader,side:He,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(X,R,L){this.matrixWorld.copyPosition(L.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(u)),li.copy(M.backgroundRotation),li.x*=-1,li.y*=-1,li.z*=-1,_.isCubeTexture&&_.isRenderTargetTexture===!1&&(li.y*=-1,li.z*=-1),u.material.uniforms.envMap.value=_,u.material.uniforms.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(Kp.makeRotationFromEuler(li)),u.material.toneMapped=ae.getTransfer(_.colorSpace)!==de,(h!==_||d!==_.version||f!==i.toneMapping)&&(u.material.needsUpdate=!0,h=_,d=_.version,f=i.toneMapping),u.layers.enableAll(),y.unshift(u,u.geometry,u.material,0,0,null)):_&&_.isTexture&&(c===void 0&&(c=new Yt(new Hn(2,2),new Ee({name:"BackgroundMaterial",uniforms:ts(Mn.background.uniforms),vertexShader:Mn.background.vertexShader,fragmentShader:Mn.background.fragmentShader,side:ti,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=_,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.toneMapped=ae.getTransfer(_.colorSpace)!==de,_.matrixAutoUpdate===!0&&_.updateMatrix(),c.material.uniforms.uvTransform.value.copy(_.matrix),(h!==_||d!==_.version||f!==i.toneMapping)&&(c.material.needsUpdate=!0,h=_,d=_.version,f=i.toneMapping),c.layers.enableAll(),y.unshift(c,c.geometry,c.material,0,0,null))}function p(y,M){y.getRGB(Qs,xu(i)),n.buffers.color.setClear(Qs.r,Qs.g,Qs.b,M,o)}return{getClearColor:function(){return a},setClearColor:function(y,M=1){a.set(y),l=M,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(y){l=y,p(a,l)},render:v,addToRenderList:m}}function $p(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null);let r=s,o=!1;function a(x,I,G,V,T){let U=!1;const k=h(V,G,I);r!==k&&(r=k,c(r.object)),U=f(x,V,G,T),U&&g(x,V,G,T),T!==null&&t.update(T,i.ELEMENT_ARRAY_BUFFER),(U||o)&&(o=!1,_(x,I,G,V),T!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(T).buffer))}function l(){return i.createVertexArray()}function c(x){return i.bindVertexArray(x)}function u(x){return i.deleteVertexArray(x)}function h(x,I,G){const V=G.wireframe===!0;let T=n[x.id];T===void 0&&(T={},n[x.id]=T);let U=T[I.id];U===void 0&&(U={},T[I.id]=U);let k=U[V];return k===void 0&&(k=d(l()),U[V]=k),k}function d(x){const I=[],G=[],V=[];for(let T=0;T<e;T++)I[T]=0,G[T]=0,V[T]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:I,enabledAttributes:G,attributeDivisors:V,object:x,attributes:{},index:null}}function f(x,I,G,V){const T=r.attributes,U=I.attributes;let k=0;const b=G.getAttributes();for(const P in b)if(b[P].location>=0){const et=T[P];let $=U[P];if($===void 0&&(P==="instanceMatrix"&&x.instanceMatrix&&($=x.instanceMatrix),P==="instanceColor"&&x.instanceColor&&($=x.instanceColor)),et===void 0||et.attribute!==$||$&&et.data!==$.data)return!0;k++}return r.attributesNum!==k||r.index!==V}function g(x,I,G,V){const T={},U=I.attributes;let k=0;const b=G.getAttributes();for(const P in b)if(b[P].location>=0){let et=U[P];et===void 0&&(P==="instanceMatrix"&&x.instanceMatrix&&(et=x.instanceMatrix),P==="instanceColor"&&x.instanceColor&&(et=x.instanceColor));const $={};$.attribute=et,et&&et.data&&($.data=et.data),T[P]=$,k++}r.attributes=T,r.attributesNum=k,r.index=V}function v(){const x=r.newAttributes;for(let I=0,G=x.length;I<G;I++)x[I]=0}function m(x){p(x,0)}function p(x,I){const G=r.newAttributes,V=r.enabledAttributes,T=r.attributeDivisors;G[x]=1,V[x]===0&&(i.enableVertexAttribArray(x),V[x]=1),T[x]!==I&&(i.vertexAttribDivisor(x,I),T[x]=I)}function y(){const x=r.newAttributes,I=r.enabledAttributes;for(let G=0,V=I.length;G<V;G++)I[G]!==x[G]&&(i.disableVertexAttribArray(G),I[G]=0)}function M(x,I,G,V,T,U,k){k===!0?i.vertexAttribIPointer(x,I,G,T,U):i.vertexAttribPointer(x,I,G,V,T,U)}function _(x,I,G,V){v();const T=V.attributes,U=G.getAttributes(),k=I.defaultAttributeValues;for(const b in U){const P=U[b];if(P.location>=0){let q=T[b];if(q===void 0&&(b==="instanceMatrix"&&x.instanceMatrix&&(q=x.instanceMatrix),b==="instanceColor"&&x.instanceColor&&(q=x.instanceColor)),q!==void 0){const et=q.normalized,$=q.itemSize,pt=t.get(q);if(pt===void 0)continue;const Y=pt.buffer,K=pt.type,z=pt.bytesPerElement,lt=K===i.INT||K===i.UNSIGNED_INT||q.gpuType===La;if(q.isInterleavedBufferAttribute){const j=q.data,mt=j.stride,At=q.offset;if(j.isInstancedInterleavedBuffer){for(let Rt=0;Rt<P.locationSize;Rt++)p(P.location+Rt,j.meshPerAttribute);x.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let Rt=0;Rt<P.locationSize;Rt++)m(P.location+Rt);i.bindBuffer(i.ARRAY_BUFFER,Y);for(let Rt=0;Rt<P.locationSize;Rt++)M(P.location+Rt,$/P.locationSize,K,et,mt*z,(At+$/P.locationSize*Rt)*z,lt)}else{if(q.isInstancedBufferAttribute){for(let j=0;j<P.locationSize;j++)p(P.location+j,q.meshPerAttribute);x.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=q.meshPerAttribute*q.count)}else for(let j=0;j<P.locationSize;j++)m(P.location+j);i.bindBuffer(i.ARRAY_BUFFER,Y);for(let j=0;j<P.locationSize;j++)M(P.location+j,$/P.locationSize,K,et,$*z,$/P.locationSize*j*z,lt)}}else if(k!==void 0){const et=k[b];if(et!==void 0)switch(et.length){case 2:i.vertexAttrib2fv(P.location,et);break;case 3:i.vertexAttrib3fv(P.location,et);break;case 4:i.vertexAttrib4fv(P.location,et);break;default:i.vertexAttrib1fv(P.location,et)}}}}y()}function X(){D();for(const x in n){const I=n[x];for(const G in I){const V=I[G];for(const T in V)u(V[T].object),delete V[T];delete I[G]}delete n[x]}}function R(x){if(n[x.id]===void 0)return;const I=n[x.id];for(const G in I){const V=I[G];for(const T in V)u(V[T].object),delete V[T];delete I[G]}delete n[x.id]}function L(x){for(const I in n){const G=n[I];if(G[x.id]===void 0)continue;const V=G[x.id];for(const T in V)u(V[T].object),delete V[T];delete G[x.id]}}function D(){E(),o=!0,r!==s&&(r=s,c(r.object))}function E(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:D,resetDefaultState:E,dispose:X,releaseStatesOfGeometry:R,releaseStatesOfProgram:L,initAttributes:v,enableAttribute:m,disableUnusedAttributes:y}}function jp(i,t,e){let n;function s(c){n=c}function r(c,u){i.drawArrays(n,c,u),e.update(u,n,1)}function o(c,u,h){h!==0&&(i.drawArraysInstanced(n,c,u,h),e.update(u,n,h))}function a(c,u,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,h);let f=0;for(let g=0;g<h;g++)f+=u[g];e.update(f,n,1)}function l(c,u,h,d){if(h===0)return;const f=t.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<c.length;g++)o(c[g],u[g],d[g]);else{f.multiDrawArraysInstancedWEBGL(n,c,0,u,0,d,0,h);let g=0;for(let v=0;v<h;v++)g+=u[v]*d[v];e.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function Qp(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const L=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(L.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(L){return!(L!==qe&&n.convert(L)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(L){const D=L===es&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(L!==bn&&n.convert(L)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&L!==mn&&!D)}function l(L){if(L==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";L="mediump"}return L==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const h=e.logarithmicDepthBuffer===!0,d=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),y=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),M=i.getParameter(i.MAX_VARYING_VECTORS),_=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),X=g>0,R=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:h,reverseDepthBuffer:d,maxTextures:f,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:y,maxVaryings:M,maxFragmentUniforms:_,vertexTextures:X,maxSamples:R}}function tm(i){const t=this;let e=null,n=0,s=!1,r=!1;const o=new hi,a=new jt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const f=h.length!==0||d||n!==0||s;return s=d,n=h.length,f},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,d){e=u(h,d,0)},this.setState=function(h,d,f){const g=h.clippingPlanes,v=h.clipIntersection,m=h.clipShadows,p=i.get(h);if(!s||g===null||g.length===0||r&&!m)r?u(null):c();else{const y=r?0:n,M=y*4;let _=p.clippingState||null;l.value=_,_=u(g,d,M,f);for(let X=0;X!==M;++X)_[X]=e[X];p.clippingState=_,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=y}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(h,d,f,g){const v=h!==null?h.length:0;let m=null;if(v!==0){if(m=l.value,g!==!0||m===null){const p=f+v*4,y=d.matrixWorldInverse;a.getNormalMatrix(y),(m===null||m.length<p)&&(m=new Float32Array(p));for(let M=0,_=f;M!==v;++M,_+=4)o.copy(h[M]).applyMatrix4(y,a),o.normal.toArray(m,_),m[_+3]=o.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,m}}function em(i){let t=new WeakMap;function e(o,a){return a===Go?o.mapping=Ki:a===Vo&&(o.mapping=Ji),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===Go||a===Vo)if(t.has(o)){const l=t.get(o).texture;return e(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new ff(l.height);return c.fromEquirectangularTexture(i,o),t.set(o,c),o.addEventListener("dispose",s),e(c.texture,o.mapping)}else return null}}return o}function s(o){const a=o.target;a.removeEventListener("dispose",s);const l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}class Ba extends Mu{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,o=n+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const Gi=4,Fl=[.125,.215,.35,.446,.526,.582],pi=20,co=new Ba,Ol=new ut;let uo=null,ho=0,fo=0,po=!1;const fi=(1+Math.sqrt(5))/2,Fi=1/fi,kl=[new O(-fi,Fi,0),new O(fi,Fi,0),new O(-Fi,0,fi),new O(Fi,0,fi),new O(0,fi,-Fi),new O(0,fi,Fi),new O(-1,1,-1),new O(1,1,-1),new O(-1,1,1),new O(1,1,1)];class _a{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){uo=this._renderer.getRenderTarget(),ho=this._renderer.getActiveCubeFace(),fo=this._renderer.getActiveMipmapLevel(),po=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Hl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Bl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(uo,ho,fo),this._renderer.xr.enabled=po,t.scissorTest=!1,tr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Ki||t.mapping===Ji?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),uo=this._renderer.getRenderTarget(),ho=this._renderer.getActiveCubeFace(),fo=this._renderer.getActiveMipmapLevel(),po=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Be,minFilter:Be,generateMipmaps:!1,type:es,format:qe,colorSpace:ns,depthBuffer:!1},s=zl(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=zl(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=nm(r)),this._blurMaterial=im(r,t,e)}return s}_compileMaterial(t){const e=new Yt(this._lodPlanes[0],t);this._renderer.compile(e,co)}_sceneToCubeUV(t,e,n,s){const a=new Qe(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,d=u.toneMapping;u.getClearColor(Ol),u.toneMapping=zn,u.autoClear=!1;const f=new gn({name:"PMREM.Background",side:He,depthWrite:!1,depthTest:!1}),g=new Yt(new pe,f);let v=!1;const m=t.background;m?m.isColor&&(f.color.copy(m),t.background=null,v=!0):(f.color.copy(Ol),v=!0);for(let p=0;p<6;p++){const y=p%3;y===0?(a.up.set(0,l[p],0),a.lookAt(c[p],0,0)):y===1?(a.up.set(0,0,l[p]),a.lookAt(0,c[p],0)):(a.up.set(0,l[p],0),a.lookAt(0,0,c[p]));const M=this._cubeSize;tr(s,y*M,p>2?M:0,M,M),u.setRenderTarget(s),v&&u.render(g,a),u.render(t,a)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=d,u.autoClear=h,t.background=m}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===Ki||t.mapping===Ji;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Hl()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Bl());const r=s?this._cubemapMaterial:this._equirectMaterial,o=new Yt(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;const l=this._cubeSize;tr(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,co)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodPlanes.length;for(let r=1;r<s;r++){const o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=kl[(s-r-1)%kl.length];this._blur(t,r-1,r,o,a)}e.autoClear=n}_blur(t,e,n,s,r){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,s,"latitudinal",r),this._halfBlur(o,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new Yt(this._lodPlanes[s],c),d=c.uniforms,f=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*pi-1),v=r/g,m=isFinite(r)?1+Math.floor(u*v):pi;m>pi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${pi}`);const p=[];let y=0;for(let L=0;L<pi;++L){const D=L/v,E=Math.exp(-D*D/2);p.push(E),L===0?y+=E:L<m&&(y+=2*E)}for(let L=0;L<p.length;L++)p[L]=p[L]/y;d.envMap.value=t.texture,d.samples.value=m,d.weights.value=p,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);const{_lodMax:M}=this;d.dTheta.value=g,d.mipInt.value=M-n;const _=this._sizeLods[s],X=3*_*(s>M-Gi?s-M+Gi:0),R=4*(this._cubeSize-_);tr(e,X,R,3*_,2*_),l.setRenderTarget(e),l.render(h,co)}}function nm(i){const t=[],e=[],n=[];let s=i;const r=i-Gi+1+Fl.length;for(let o=0;o<r;o++){const a=Math.pow(2,s);e.push(a);let l=1/a;o>i-Gi?l=Fl[o-i+Gi-1]:o===0&&(l=0),n.push(l);const c=1/(a-2),u=-c,h=1+c,d=[u,u,h,u,h,h,u,u,h,h,u,h],f=6,g=6,v=3,m=2,p=1,y=new Float32Array(v*g*f),M=new Float32Array(m*g*f),_=new Float32Array(p*g*f);for(let R=0;R<f;R++){const L=R%3*2/3-1,D=R>2?0:-1,E=[L,D,0,L+2/3,D,0,L+2/3,D+1,0,L,D,0,L+2/3,D+1,0,L,D+1,0];y.set(E,v*g*R),M.set(d,m*g*R);const x=[R,R,R,R,R,R];_.set(x,p*g*R)}const X=new ye;X.setAttribute("position",new Se(y,v)),X.setAttribute("uv",new Se(M,m)),X.setAttribute("faceIndex",new Se(_,p)),t.push(X),s>Gi&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function zl(i,t,e){const n=new ei(i,t,e);return n.texture.mapping=Rr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function tr(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function im(i,t,e){const n=new Float32Array(pi),s=new O(0,1,0);return new Ee({name:"SphericalGaussianBlur",defines:{n:pi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Ha(),fragmentShader:`

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
		`,blending:$n,depthTest:!1,depthWrite:!1})}function Bl(){return new Ee({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ha(),fragmentShader:`

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
		`,blending:$n,depthTest:!1,depthWrite:!1})}function Hl(){return new Ee({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ha(),fragmentShader:`

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
	`}function sm(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const l=a.mapping,c=l===Go||l===Vo,u=l===Ki||l===Ji;if(c||u){let h=t.get(a);const d=h!==void 0?h.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return e===null&&(e=new _a(i)),h=c?e.fromEquirectangular(a,h):e.fromCubemap(a,h),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),h.texture;if(h!==void 0)return h.texture;{const f=a.image;return c&&f&&f.height>0||u&&f&&s(f)?(e===null&&(e=new _a(i)),h=c?e.fromEquirectangular(a):e.fromCubemap(a),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),a.addEventListener("dispose",r),h.texture):null}}}return a}function s(a){let l=0;const c=6;for(let u=0;u<c;u++)a[u]!==void 0&&l++;return l===c}function r(a){const l=a.target;l.removeEventListener("dispose",r);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function rm(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&xs("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function om(i,t,e,n){const s={},r=new WeakMap;function o(h){const d=h.target;d.index!==null&&t.remove(d.index);for(const g in d.attributes)t.remove(d.attributes[g]);for(const g in d.morphAttributes){const v=d.morphAttributes[g];for(let m=0,p=v.length;m<p;m++)t.remove(v[m])}d.removeEventListener("dispose",o),delete s[d.id];const f=r.get(d);f&&(t.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function a(h,d){return s[d.id]===!0||(d.addEventListener("dispose",o),s[d.id]=!0,e.memory.geometries++),d}function l(h){const d=h.attributes;for(const g in d)t.update(d[g],i.ARRAY_BUFFER);const f=h.morphAttributes;for(const g in f){const v=f[g];for(let m=0,p=v.length;m<p;m++)t.update(v[m],i.ARRAY_BUFFER)}}function c(h){const d=[],f=h.index,g=h.attributes.position;let v=0;if(f!==null){const y=f.array;v=f.version;for(let M=0,_=y.length;M<_;M+=3){const X=y[M+0],R=y[M+1],L=y[M+2];d.push(X,R,R,L,L,X)}}else if(g!==void 0){const y=g.array;v=g.version;for(let M=0,_=y.length/3-1;M<_;M+=3){const X=M+0,R=M+1,L=M+2;d.push(X,R,R,L,L,X)}}else return;const m=new(fu(d)?_u:vu)(d,1);m.version=v;const p=r.get(h);p&&t.remove(p),r.set(h,m)}function u(h){const d=r.get(h);if(d){const f=h.index;f!==null&&d.version<f.version&&c(h)}else c(h);return r.get(h)}return{get:a,update:l,getWireframeAttribute:u}}function am(i,t,e){let n;function s(d){n=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function l(d,f){i.drawElements(n,f,r,d*o),e.update(f,n,1)}function c(d,f,g){g!==0&&(i.drawElementsInstanced(n,f,r,d*o,g),e.update(f,n,g))}function u(d,f,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,d,0,g);let m=0;for(let p=0;p<g;p++)m+=f[p];e.update(m,n,1)}function h(d,f,g,v){if(g===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<d.length;p++)c(d[p]/o,f[p],v[p]);else{m.multiDrawElementsInstancedWEBGL(n,f,0,r,d,0,v,0,g);let p=0;for(let y=0;y<g;y++)p+=f[y]*v[y];e.update(p,n,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=h}function lm(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function cm(i,t,e){const n=new WeakMap,s=new ce;function r(o,a,l){const c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0;let d=n.get(a);if(d===void 0||d.count!==h){let E=function(){L.dispose(),n.delete(a),a.removeEventListener("dispose",E)};d!==void 0&&d.texture.dispose();const f=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,v=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],y=a.morphAttributes.color||[];let M=0;f===!0&&(M=1),g===!0&&(M=2),v===!0&&(M=3);let _=a.attributes.position.count*M,X=1;_>t.maxTextureSize&&(X=Math.ceil(_/t.maxTextureSize),_=t.maxTextureSize);const R=new Float32Array(_*X*4*h),L=new pu(R,_,X,h);L.type=mn,L.needsUpdate=!0;const D=M*4;for(let x=0;x<h;x++){const I=m[x],G=p[x],V=y[x],T=_*X*4*x;for(let U=0;U<I.count;U++){const k=U*D;f===!0&&(s.fromBufferAttribute(I,U),R[T+k+0]=s.x,R[T+k+1]=s.y,R[T+k+2]=s.z,R[T+k+3]=0),g===!0&&(s.fromBufferAttribute(G,U),R[T+k+4]=s.x,R[T+k+5]=s.y,R[T+k+6]=s.z,R[T+k+7]=0),v===!0&&(s.fromBufferAttribute(V,U),R[T+k+8]=s.x,R[T+k+9]=s.y,R[T+k+10]=s.z,R[T+k+11]=V.itemSize===4?s.w:1)}}d={count:h,texture:L,size:new Tt(_,X)},n.set(a,d),a.addEventListener("dispose",E)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let f=0;for(let v=0;v<c.length;v++)f+=c[v];const g=a.morphTargetsRelative?1:1-f;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function um(i,t,e,n){let s=new WeakMap;function r(l){const c=n.render.frame,u=l.geometry,h=t.get(l,u);if(s.get(h)!==c&&(t.update(h),s.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){const d=l.skeleton;s.get(d)!==c&&(d.update(),s.set(d,c))}return h}function o(){s=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:o}}class wu extends ke{constructor(t,e,n,s,r,o,a,l,c,u=Xi){if(u!==Xi&&u!==Qi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===Xi&&(n=vi),n===void 0&&u===Qi&&(n=ji),super(null,s,r,o,a,l,u,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:tn,this.minFilter=l!==void 0?l:tn,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const bu=new ke,Gl=new wu(1,1),Eu=new pu,Tu=new Kh,Au=new yu,Vl=[],Wl=[],Xl=new Float32Array(16),Yl=new Float32Array(9),ql=new Float32Array(4);function ss(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=Vl[s];if(r===void 0&&(r=new Float32Array(s),Vl[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function Te(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Ae(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Lr(i,t){let e=Wl[t];e===void 0&&(e=new Int32Array(t),Wl[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function hm(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function fm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Te(e,t))return;i.uniform2fv(this.addr,t),Ae(e,t)}}function dm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Te(e,t))return;i.uniform3fv(this.addr,t),Ae(e,t)}}function pm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Te(e,t))return;i.uniform4fv(this.addr,t),Ae(e,t)}}function mm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Te(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Ae(e,t)}else{if(Te(e,n))return;ql.set(n),i.uniformMatrix2fv(this.addr,!1,ql),Ae(e,n)}}function gm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Te(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Ae(e,t)}else{if(Te(e,n))return;Yl.set(n),i.uniformMatrix3fv(this.addr,!1,Yl),Ae(e,n)}}function vm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Te(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Ae(e,t)}else{if(Te(e,n))return;Xl.set(n),i.uniformMatrix4fv(this.addr,!1,Xl),Ae(e,n)}}function _m(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function xm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Te(e,t))return;i.uniform2iv(this.addr,t),Ae(e,t)}}function Mm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Te(e,t))return;i.uniform3iv(this.addr,t),Ae(e,t)}}function ym(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Te(e,t))return;i.uniform4iv(this.addr,t),Ae(e,t)}}function Sm(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function wm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Te(e,t))return;i.uniform2uiv(this.addr,t),Ae(e,t)}}function bm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Te(e,t))return;i.uniform3uiv(this.addr,t),Ae(e,t)}}function Em(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Te(e,t))return;i.uniform4uiv(this.addr,t),Ae(e,t)}}function Tm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Gl.compareFunction=hu,r=Gl):r=bu,e.setTexture2D(t||r,s)}function Am(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Tu,s)}function Cm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||Au,s)}function Rm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Eu,s)}function Pm(i){switch(i){case 5126:return hm;case 35664:return fm;case 35665:return dm;case 35666:return pm;case 35674:return mm;case 35675:return gm;case 35676:return vm;case 5124:case 35670:return _m;case 35667:case 35671:return xm;case 35668:case 35672:return Mm;case 35669:case 35673:return ym;case 5125:return Sm;case 36294:return wm;case 36295:return bm;case 36296:return Em;case 35678:case 36198:case 36298:case 36306:case 35682:return Tm;case 35679:case 36299:case 36307:return Am;case 35680:case 36300:case 36308:case 36293:return Cm;case 36289:case 36303:case 36311:case 36292:return Rm}}function Im(i,t){i.uniform1fv(this.addr,t)}function Lm(i,t){const e=ss(t,this.size,2);i.uniform2fv(this.addr,e)}function Dm(i,t){const e=ss(t,this.size,3);i.uniform3fv(this.addr,e)}function Um(i,t){const e=ss(t,this.size,4);i.uniform4fv(this.addr,e)}function Nm(i,t){const e=ss(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Fm(i,t){const e=ss(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Om(i,t){const e=ss(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function km(i,t){i.uniform1iv(this.addr,t)}function zm(i,t){i.uniform2iv(this.addr,t)}function Bm(i,t){i.uniform3iv(this.addr,t)}function Hm(i,t){i.uniform4iv(this.addr,t)}function Gm(i,t){i.uniform1uiv(this.addr,t)}function Vm(i,t){i.uniform2uiv(this.addr,t)}function Wm(i,t){i.uniform3uiv(this.addr,t)}function Xm(i,t){i.uniform4uiv(this.addr,t)}function Ym(i,t,e){const n=this.cache,s=t.length,r=Lr(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||bu,r[o])}function qm(i,t,e){const n=this.cache,s=t.length,r=Lr(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||Tu,r[o])}function Zm(i,t,e){const n=this.cache,s=t.length,r=Lr(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||Au,r[o])}function Km(i,t,e){const n=this.cache,s=t.length,r=Lr(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||Eu,r[o])}function Jm(i){switch(i){case 5126:return Im;case 35664:return Lm;case 35665:return Dm;case 35666:return Um;case 35674:return Nm;case 35675:return Fm;case 35676:return Om;case 5124:case 35670:return km;case 35667:case 35671:return zm;case 35668:case 35672:return Bm;case 35669:case 35673:return Hm;case 5125:return Gm;case 36294:return Vm;case 36295:return Wm;case 36296:return Xm;case 35678:case 36198:case 36298:case 36306:case 35682:return Ym;case 35679:case 36299:case 36307:return qm;case 35680:case 36300:case 36308:case 36293:return Zm;case 36289:case 36303:case 36311:case 36292:return Km}}class $m{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Pm(e.type)}}class jm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Jm(e.type)}}class Qm{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,o=s.length;r!==o;++r){const a=s[r];a.setValue(t,e[a.id],n)}}}const mo=/(\w+)(\])?(\[|\.)?/g;function Zl(i,t){i.seq.push(t),i.map[t.id]=t}function t0(i,t,e){const n=i.name,s=n.length;for(mo.lastIndex=0;;){const r=mo.exec(n),o=mo.lastIndex;let a=r[1];const l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){Zl(e,c===void 0?new $m(a,i,t):new jm(a,i,t));break}else{let h=e.map[a];h===void 0&&(h=new Qm(a),Zl(e,h)),e=h}}}class xr{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);t0(r,o,this)}}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){const a=e[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const o=t[s];o.id in e&&n.push(o)}return n}}function Kl(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const e0=37297;let n0=0;function i0(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}const Jl=new jt;function s0(i){ae._getMatrix(Jl,ae.workingColorSpace,i);const t=`mat3( ${Jl.elements.map(e=>e.toFixed(4))} )`;switch(ae.getTransfer(i)){case Pr:return[t,"LinearTransferOETF"];case de:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function $l(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+i0(i.getShaderSource(t),o)}else return s}function r0(i,t){const e=s0(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function o0(i,t){let e;switch(t){case yh:e="Linear";break;case Sh:e="Reinhard";break;case wh:e="Cineon";break;case bh:e="ACESFilmic";break;case Th:e="AgX";break;case Ah:e="Neutral";break;case Eh:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const er=new O;function a0(){ae.getLuminanceCoefficients(er);const i=er.x.toFixed(4),t=er.y.toFixed(4),e=er.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function l0(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ms).join(`
`)}function c0(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function u0(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),o=r.name;let a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function Ms(i){return i!==""}function jl(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Ql(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const h0=/^[ \t]*#include +<([\w\d./]+)>/gm;function xa(i){return i.replace(h0,d0)}const f0=new Map;function d0(i,t){let e=te[t];if(e===void 0){const n=f0.get(t);if(n!==void 0)e=te[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return xa(e)}const p0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function tc(i){return i.replace(p0,m0)}function m0(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function ec(i){let t=`precision ${i.precision} float;
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
#define LOW_PRECISION`),t}function g0(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Ia?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===jc?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Fn&&(t="SHADOWMAP_TYPE_VSM"),t}function v0(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Ki:case Ji:t="ENVMAP_TYPE_CUBE";break;case Rr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function _0(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case Ji:t="ENVMAP_MODE_REFRACTION";break}return t}function x0(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Qc:t="ENVMAP_BLENDING_MULTIPLY";break;case xh:t="ENVMAP_BLENDING_MIX";break;case Mh:t="ENVMAP_BLENDING_ADD";break}return t}function M0(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function y0(i,t,e,n){const s=i.getContext(),r=e.defines;let o=e.vertexShader,a=e.fragmentShader;const l=g0(e),c=v0(e),u=_0(e),h=x0(e),d=M0(e),f=l0(e),g=c0(r),v=s.createProgram();let m,p,y=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Ms).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Ms).join(`
`),p.length>0&&(p+=`
`)):(m=[ec(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ms).join(`
`),p=[ec(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==zn?"#define TONE_MAPPING":"",e.toneMapping!==zn?te.tonemapping_pars_fragment:"",e.toneMapping!==zn?o0("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",te.colorspace_pars_fragment,r0("linearToOutputTexel",e.outputColorSpace),a0(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Ms).join(`
`)),o=xa(o),o=jl(o,e),o=Ql(o,e),a=xa(a),a=jl(a,e),a=Ql(a,e),o=tc(o),a=tc(a),e.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",e.glslVersion===ml?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===ml?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const M=y+m+o,_=y+p+a,X=Kl(s,s.VERTEX_SHADER,M),R=Kl(s,s.FRAGMENT_SHADER,_);s.attachShader(v,X),s.attachShader(v,R),e.index0AttributeName!==void 0?s.bindAttribLocation(v,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(v,0,"position"),s.linkProgram(v);function L(I){if(i.debug.checkShaderErrors){const G=s.getProgramInfoLog(v).trim(),V=s.getShaderInfoLog(X).trim(),T=s.getShaderInfoLog(R).trim();let U=!0,k=!0;if(s.getProgramParameter(v,s.LINK_STATUS)===!1)if(U=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,v,X,R);else{const b=$l(s,X,"vertex"),P=$l(s,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(v,s.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+G+`
`+b+`
`+P)}else G!==""?console.warn("THREE.WebGLProgram: Program Info Log:",G):(V===""||T==="")&&(k=!1);k&&(I.diagnostics={runnable:U,programLog:G,vertexShader:{log:V,prefix:m},fragmentShader:{log:T,prefix:p}})}s.deleteShader(X),s.deleteShader(R),D=new xr(s,v),E=u0(s,v)}let D;this.getUniforms=function(){return D===void 0&&L(this),D};let E;this.getAttributes=function(){return E===void 0&&L(this),E};let x=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return x===!1&&(x=s.getProgramParameter(v,e0)),x},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(v),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=n0++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=X,this.fragmentShader=R,this}let S0=0;class w0{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new b0(t),e.set(t,n)),n}}class b0{constructor(t){this.id=S0++,this.code=t,this.usedTimes=0}}function E0(i,t,e,n,s,r,o){const a=new mu,l=new w0,c=new Set,u=[],h=s.logarithmicDepthBuffer,d=s.vertexTextures;let f=s.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(E){return c.add(E),E===0?"uv":`uv${E}`}function m(E,x,I,G,V){const T=G.fog,U=V.geometry,k=E.isMeshStandardMaterial?G.environment:null,b=(E.isMeshStandardMaterial?e:t).get(E.envMap||k),P=b&&b.mapping===Rr?b.image.height:null,q=g[E.type];E.precision!==null&&(f=s.getMaxPrecision(E.precision),f!==E.precision&&console.warn("THREE.WebGLProgram.getParameters:",E.precision,"not supported, using",f,"instead."));const et=U.morphAttributes.position||U.morphAttributes.normal||U.morphAttributes.color,$=et!==void 0?et.length:0;let pt=0;U.morphAttributes.position!==void 0&&(pt=1),U.morphAttributes.normal!==void 0&&(pt=2),U.morphAttributes.color!==void 0&&(pt=3);let Y,K,z,lt;if(q){const zt=Mn[q];Y=zt.vertexShader,K=zt.fragmentShader}else Y=E.vertexShader,K=E.fragmentShader,l.update(E),z=l.getVertexShaderID(E),lt=l.getFragmentShaderID(E);const j=i.getRenderTarget(),mt=i.state.buffers.depth.getReversed(),At=V.isInstancedMesh===!0,Rt=V.isBatchedMesh===!0,Ht=!!E.map,xt=!!E.matcap,Et=!!b,N=!!E.aoMap,S=!!E.lightMap,B=!!E.bumpMap,Z=!!E.normalMap,H=!!E.displacementMap,nt=!!E.emissiveMap,tt=!!E.metalnessMap,A=!!E.roughnessMap,w=E.anisotropy>0,ot=E.clearcoat>0,yt=E.dispersion>0,J=E.iridescence>0,it=E.sheen>0,St=E.transmission>0,ft=w&&!!E.anisotropyMap,Mt=ot&&!!E.clearcoatMap,It=ot&&!!E.clearcoatNormalMap,gt=ot&&!!E.clearcoatRoughnessMap,Pt=J&&!!E.iridescenceMap,Ft=J&&!!E.iridescenceThicknessMap,W=it&&!!E.sheenColorMap,Q=it&&!!E.sheenRoughnessMap,ct=!!E.specularMap,at=!!E.specularColorMap,wt=!!E.specularIntensityMap,F=St&&!!E.transmissionMap,bt=St&&!!E.thicknessMap,ht=!!E.gradientMap,dt=!!E.alphaMap,Ct=E.alphaTest>0,Lt=!!E.alphaHash,Ot=!!E.extensions;let ne=zn;E.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(ne=i.toneMapping);const fe={shaderID:q,shaderType:E.type,shaderName:E.name,vertexShader:Y,fragmentShader:K,defines:E.defines,customVertexShaderID:z,customFragmentShaderID:lt,isRawShaderMaterial:E.isRawShaderMaterial===!0,glslVersion:E.glslVersion,precision:f,batching:Rt,batchingColor:Rt&&V._colorsTexture!==null,instancing:At,instancingColor:At&&V.instanceColor!==null,instancingMorph:At&&V.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:j===null?i.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:ns,alphaToCoverage:!!E.alphaToCoverage,map:Ht,matcap:xt,envMap:Et,envMapMode:Et&&b.mapping,envMapCubeUVHeight:P,aoMap:N,lightMap:S,bumpMap:B,normalMap:Z,displacementMap:d&&H,emissiveMap:nt,normalMapObjectSpace:Z&&E.normalMapType===Lh,normalMapTangentSpace:Z&&E.normalMapType===uu,metalnessMap:tt,roughnessMap:A,anisotropy:w,anisotropyMap:ft,clearcoat:ot,clearcoatMap:Mt,clearcoatNormalMap:It,clearcoatRoughnessMap:gt,dispersion:yt,iridescence:J,iridescenceMap:Pt,iridescenceThicknessMap:Ft,sheen:it,sheenColorMap:W,sheenRoughnessMap:Q,specularMap:ct,specularColorMap:at,specularIntensityMap:wt,transmission:St,transmissionMap:F,thicknessMap:bt,gradientMap:ht,opaque:E.transparent===!1&&E.blending===Ge&&E.alphaToCoverage===!1,alphaMap:dt,alphaTest:Ct,alphaHash:Lt,combine:E.combine,mapUv:Ht&&v(E.map.channel),aoMapUv:N&&v(E.aoMap.channel),lightMapUv:S&&v(E.lightMap.channel),bumpMapUv:B&&v(E.bumpMap.channel),normalMapUv:Z&&v(E.normalMap.channel),displacementMapUv:H&&v(E.displacementMap.channel),emissiveMapUv:nt&&v(E.emissiveMap.channel),metalnessMapUv:tt&&v(E.metalnessMap.channel),roughnessMapUv:A&&v(E.roughnessMap.channel),anisotropyMapUv:ft&&v(E.anisotropyMap.channel),clearcoatMapUv:Mt&&v(E.clearcoatMap.channel),clearcoatNormalMapUv:It&&v(E.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:gt&&v(E.clearcoatRoughnessMap.channel),iridescenceMapUv:Pt&&v(E.iridescenceMap.channel),iridescenceThicknessMapUv:Ft&&v(E.iridescenceThicknessMap.channel),sheenColorMapUv:W&&v(E.sheenColorMap.channel),sheenRoughnessMapUv:Q&&v(E.sheenRoughnessMap.channel),specularMapUv:ct&&v(E.specularMap.channel),specularColorMapUv:at&&v(E.specularColorMap.channel),specularIntensityMapUv:wt&&v(E.specularIntensityMap.channel),transmissionMapUv:F&&v(E.transmissionMap.channel),thicknessMapUv:bt&&v(E.thicknessMap.channel),alphaMapUv:dt&&v(E.alphaMap.channel),vertexTangents:!!U.attributes.tangent&&(Z||w),vertexColors:E.vertexColors,vertexAlphas:E.vertexColors===!0&&!!U.attributes.color&&U.attributes.color.itemSize===4,pointsUvs:V.isPoints===!0&&!!U.attributes.uv&&(Ht||dt),fog:!!T,useFog:E.fog===!0,fogExp2:!!T&&T.isFogExp2,flatShading:E.flatShading===!0,sizeAttenuation:E.sizeAttenuation===!0,logarithmicDepthBuffer:h,reverseDepthBuffer:mt,skinning:V.isSkinnedMesh===!0,morphTargets:U.morphAttributes.position!==void 0,morphNormals:U.morphAttributes.normal!==void 0,morphColors:U.morphAttributes.color!==void 0,morphTargetsCount:$,morphTextureStride:pt,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:E.dithering,shadowMapEnabled:i.shadowMap.enabled&&I.length>0,shadowMapType:i.shadowMap.type,toneMapping:ne,decodeVideoTexture:Ht&&E.map.isVideoTexture===!0&&ae.getTransfer(E.map.colorSpace)===de,decodeVideoTextureEmissive:nt&&E.emissiveMap.isVideoTexture===!0&&ae.getTransfer(E.emissiveMap.colorSpace)===de,premultipliedAlpha:E.premultipliedAlpha,doubleSided:E.side===Ie,flipSided:E.side===He,useDepthPacking:E.depthPacking>=0,depthPacking:E.depthPacking||0,index0AttributeName:E.index0AttributeName,extensionClipCullDistance:Ot&&E.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ot&&E.extensions.multiDraw===!0||Rt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:E.customProgramCacheKey()};return fe.vertexUv1s=c.has(1),fe.vertexUv2s=c.has(2),fe.vertexUv3s=c.has(3),c.clear(),fe}function p(E){const x=[];if(E.shaderID?x.push(E.shaderID):(x.push(E.customVertexShaderID),x.push(E.customFragmentShaderID)),E.defines!==void 0)for(const I in E.defines)x.push(I),x.push(E.defines[I]);return E.isRawShaderMaterial===!1&&(y(x,E),M(x,E),x.push(i.outputColorSpace)),x.push(E.customProgramCacheKey),x.join()}function y(E,x){E.push(x.precision),E.push(x.outputColorSpace),E.push(x.envMapMode),E.push(x.envMapCubeUVHeight),E.push(x.mapUv),E.push(x.alphaMapUv),E.push(x.lightMapUv),E.push(x.aoMapUv),E.push(x.bumpMapUv),E.push(x.normalMapUv),E.push(x.displacementMapUv),E.push(x.emissiveMapUv),E.push(x.metalnessMapUv),E.push(x.roughnessMapUv),E.push(x.anisotropyMapUv),E.push(x.clearcoatMapUv),E.push(x.clearcoatNormalMapUv),E.push(x.clearcoatRoughnessMapUv),E.push(x.iridescenceMapUv),E.push(x.iridescenceThicknessMapUv),E.push(x.sheenColorMapUv),E.push(x.sheenRoughnessMapUv),E.push(x.specularMapUv),E.push(x.specularColorMapUv),E.push(x.specularIntensityMapUv),E.push(x.transmissionMapUv),E.push(x.thicknessMapUv),E.push(x.combine),E.push(x.fogExp2),E.push(x.sizeAttenuation),E.push(x.morphTargetsCount),E.push(x.morphAttributeCount),E.push(x.numDirLights),E.push(x.numPointLights),E.push(x.numSpotLights),E.push(x.numSpotLightMaps),E.push(x.numHemiLights),E.push(x.numRectAreaLights),E.push(x.numDirLightShadows),E.push(x.numPointLightShadows),E.push(x.numSpotLightShadows),E.push(x.numSpotLightShadowsWithMaps),E.push(x.numLightProbes),E.push(x.shadowMapType),E.push(x.toneMapping),E.push(x.numClippingPlanes),E.push(x.numClipIntersection),E.push(x.depthPacking)}function M(E,x){a.disableAll(),x.supportsVertexTextures&&a.enable(0),x.instancing&&a.enable(1),x.instancingColor&&a.enable(2),x.instancingMorph&&a.enable(3),x.matcap&&a.enable(4),x.envMap&&a.enable(5),x.normalMapObjectSpace&&a.enable(6),x.normalMapTangentSpace&&a.enable(7),x.clearcoat&&a.enable(8),x.iridescence&&a.enable(9),x.alphaTest&&a.enable(10),x.vertexColors&&a.enable(11),x.vertexAlphas&&a.enable(12),x.vertexUv1s&&a.enable(13),x.vertexUv2s&&a.enable(14),x.vertexUv3s&&a.enable(15),x.vertexTangents&&a.enable(16),x.anisotropy&&a.enable(17),x.alphaHash&&a.enable(18),x.batching&&a.enable(19),x.dispersion&&a.enable(20),x.batchingColor&&a.enable(21),E.push(a.mask),a.disableAll(),x.fog&&a.enable(0),x.useFog&&a.enable(1),x.flatShading&&a.enable(2),x.logarithmicDepthBuffer&&a.enable(3),x.reverseDepthBuffer&&a.enable(4),x.skinning&&a.enable(5),x.morphTargets&&a.enable(6),x.morphNormals&&a.enable(7),x.morphColors&&a.enable(8),x.premultipliedAlpha&&a.enable(9),x.shadowMapEnabled&&a.enable(10),x.doubleSided&&a.enable(11),x.flipSided&&a.enable(12),x.useDepthPacking&&a.enable(13),x.dithering&&a.enable(14),x.transmission&&a.enable(15),x.sheen&&a.enable(16),x.opaque&&a.enable(17),x.pointsUvs&&a.enable(18),x.decodeVideoTexture&&a.enable(19),x.decodeVideoTextureEmissive&&a.enable(20),x.alphaToCoverage&&a.enable(21),E.push(a.mask)}function _(E){const x=g[E.type];let I;if(x){const G=Mn[x];I=lf.clone(G.uniforms)}else I=E.uniforms;return I}function X(E,x){let I;for(let G=0,V=u.length;G<V;G++){const T=u[G];if(T.cacheKey===x){I=T,++I.usedTimes;break}}return I===void 0&&(I=new y0(i,x,E,r),u.push(I)),I}function R(E){if(--E.usedTimes===0){const x=u.indexOf(E);u[x]=u[u.length-1],u.pop(),E.destroy()}}function L(E){l.remove(E)}function D(){l.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:_,acquireProgram:X,releaseProgram:R,releaseShaderCache:L,programs:u,dispose:D}}function T0(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,l){i.get(o)[a]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function A0(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function nc(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function ic(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(h,d,f,g,v,m){let p=i[t];return p===void 0?(p={id:h.id,object:h,geometry:d,material:f,groupOrder:g,renderOrder:h.renderOrder,z:v,group:m},i[t]=p):(p.id=h.id,p.object=h,p.geometry=d,p.material=f,p.groupOrder=g,p.renderOrder=h.renderOrder,p.z=v,p.group=m),t++,p}function a(h,d,f,g,v,m){const p=o(h,d,f,g,v,m);f.transmission>0?n.push(p):f.transparent===!0?s.push(p):e.push(p)}function l(h,d,f,g,v,m){const p=o(h,d,f,g,v,m);f.transmission>0?n.unshift(p):f.transparent===!0?s.unshift(p):e.unshift(p)}function c(h,d){e.length>1&&e.sort(h||A0),n.length>1&&n.sort(d||nc),s.length>1&&s.sort(d||nc)}function u(){for(let h=t,d=i.length;h<d;h++){const f=i[h];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:u,sort:c}}function C0(){let i=new WeakMap;function t(n,s){const r=i.get(n);let o;return r===void 0?(o=new ic,i.set(n,[o])):s>=r.length?(o=new ic,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function R0(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new O,color:new ut};break;case"SpotLight":e={position:new O,direction:new O,color:new ut,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new O,color:new ut,distance:0,decay:0};break;case"HemisphereLight":e={direction:new O,skyColor:new ut,groundColor:new ut};break;case"RectAreaLight":e={color:new ut,position:new O,halfWidth:new O,halfHeight:new O};break}return i[t.id]=e,e}}}function P0(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Tt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Tt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Tt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let I0=0;function L0(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function D0(i){const t=new R0,e=P0(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new O);const s=new O,r=new Qt,o=new Qt;function a(c){let u=0,h=0,d=0;for(let E=0;E<9;E++)n.probe[E].set(0,0,0);let f=0,g=0,v=0,m=0,p=0,y=0,M=0,_=0,X=0,R=0,L=0;c.sort(L0);for(let E=0,x=c.length;E<x;E++){const I=c[E],G=I.color,V=I.intensity,T=I.distance,U=I.shadow&&I.shadow.map?I.shadow.map.texture:null;if(I.isAmbientLight)u+=G.r*V,h+=G.g*V,d+=G.b*V;else if(I.isLightProbe){for(let k=0;k<9;k++)n.probe[k].addScaledVector(I.sh.coefficients[k],V);L++}else if(I.isDirectionalLight){const k=t.get(I);if(k.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){const b=I.shadow,P=e.get(I);P.shadowIntensity=b.intensity,P.shadowBias=b.bias,P.shadowNormalBias=b.normalBias,P.shadowRadius=b.radius,P.shadowMapSize=b.mapSize,n.directionalShadow[f]=P,n.directionalShadowMap[f]=U,n.directionalShadowMatrix[f]=I.shadow.matrix,y++}n.directional[f]=k,f++}else if(I.isSpotLight){const k=t.get(I);k.position.setFromMatrixPosition(I.matrixWorld),k.color.copy(G).multiplyScalar(V),k.distance=T,k.coneCos=Math.cos(I.angle),k.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),k.decay=I.decay,n.spot[v]=k;const b=I.shadow;if(I.map&&(n.spotLightMap[X]=I.map,X++,b.updateMatrices(I),I.castShadow&&R++),n.spotLightMatrix[v]=b.matrix,I.castShadow){const P=e.get(I);P.shadowIntensity=b.intensity,P.shadowBias=b.bias,P.shadowNormalBias=b.normalBias,P.shadowRadius=b.radius,P.shadowMapSize=b.mapSize,n.spotShadow[v]=P,n.spotShadowMap[v]=U,_++}v++}else if(I.isRectAreaLight){const k=t.get(I);k.color.copy(G).multiplyScalar(V),k.halfWidth.set(I.width*.5,0,0),k.halfHeight.set(0,I.height*.5,0),n.rectArea[m]=k,m++}else if(I.isPointLight){const k=t.get(I);if(k.color.copy(I.color).multiplyScalar(I.intensity),k.distance=I.distance,k.decay=I.decay,I.castShadow){const b=I.shadow,P=e.get(I);P.shadowIntensity=b.intensity,P.shadowBias=b.bias,P.shadowNormalBias=b.normalBias,P.shadowRadius=b.radius,P.shadowMapSize=b.mapSize,P.shadowCameraNear=b.camera.near,P.shadowCameraFar=b.camera.far,n.pointShadow[g]=P,n.pointShadowMap[g]=U,n.pointShadowMatrix[g]=I.shadow.matrix,M++}n.point[g]=k,g++}else if(I.isHemisphereLight){const k=t.get(I);k.skyColor.copy(I.color).multiplyScalar(V),k.groundColor.copy(I.groundColor).multiplyScalar(V),n.hemi[p]=k,p++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Nt.LTC_FLOAT_1,n.rectAreaLTC2=Nt.LTC_FLOAT_2):(n.rectAreaLTC1=Nt.LTC_HALF_1,n.rectAreaLTC2=Nt.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=h,n.ambient[2]=d;const D=n.hash;(D.directionalLength!==f||D.pointLength!==g||D.spotLength!==v||D.rectAreaLength!==m||D.hemiLength!==p||D.numDirectionalShadows!==y||D.numPointShadows!==M||D.numSpotShadows!==_||D.numSpotMaps!==X||D.numLightProbes!==L)&&(n.directional.length=f,n.spot.length=v,n.rectArea.length=m,n.point.length=g,n.hemi.length=p,n.directionalShadow.length=y,n.directionalShadowMap.length=y,n.pointShadow.length=M,n.pointShadowMap.length=M,n.spotShadow.length=_,n.spotShadowMap.length=_,n.directionalShadowMatrix.length=y,n.pointShadowMatrix.length=M,n.spotLightMatrix.length=_+X-R,n.spotLightMap.length=X,n.numSpotLightShadowsWithMaps=R,n.numLightProbes=L,D.directionalLength=f,D.pointLength=g,D.spotLength=v,D.rectAreaLength=m,D.hemiLength=p,D.numDirectionalShadows=y,D.numPointShadows=M,D.numSpotShadows=_,D.numSpotMaps=X,D.numLightProbes=L,n.version=I0++)}function l(c,u){let h=0,d=0,f=0,g=0,v=0;const m=u.matrixWorldInverse;for(let p=0,y=c.length;p<y;p++){const M=c[p];if(M.isDirectionalLight){const _=n.directional[h];_.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),_.direction.sub(s),_.direction.transformDirection(m),h++}else if(M.isSpotLight){const _=n.spot[f];_.position.setFromMatrixPosition(M.matrixWorld),_.position.applyMatrix4(m),_.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),_.direction.sub(s),_.direction.transformDirection(m),f++}else if(M.isRectAreaLight){const _=n.rectArea[g];_.position.setFromMatrixPosition(M.matrixWorld),_.position.applyMatrix4(m),o.identity(),r.copy(M.matrixWorld),r.premultiply(m),o.extractRotation(r),_.halfWidth.set(M.width*.5,0,0),_.halfHeight.set(0,M.height*.5,0),_.halfWidth.applyMatrix4(o),_.halfHeight.applyMatrix4(o),g++}else if(M.isPointLight){const _=n.point[d];_.position.setFromMatrixPosition(M.matrixWorld),_.position.applyMatrix4(m),d++}else if(M.isHemisphereLight){const _=n.hemi[v];_.direction.setFromMatrixPosition(M.matrixWorld),_.direction.transformDirection(m),v++}}}return{setup:a,setupView:l,state:n}}function sc(i){const t=new D0(i),e=[],n=[];function s(u){c.camera=u,e.length=0,n.length=0}function r(u){e.push(u)}function o(u){n.push(u)}function a(){t.setup(e)}function l(u){t.setupView(e,u)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function U0(i){let t=new WeakMap;function e(s,r=0){const o=t.get(s);let a;return o===void 0?(a=new sc(i),t.set(s,[a])):r>=o.length?(a=new sc(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}class N0 extends Mi{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=Ph,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class F0 extends Mi{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const O0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,k0=`uniform sampler2D shadow_pass;
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
}`;function z0(i,t,e){let n=new za;const s=new Tt,r=new Tt,o=new ce,a=new N0({depthPacking:Ih}),l=new F0,c={},u=e.maxTextureSize,h={[ti]:He,[He]:ti,[Ie]:Ie},d=new Ee({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Tt},radius:{value:4}},vertexShader:O0,fragmentShader:k0}),f=d.clone();f.defines.HORIZONTAL_PASS=1;const g=new ye;g.setAttribute("position",new Se(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new Yt(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ia;let p=this.type;this.render=function(R,L,D){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||R.length===0)return;const E=i.getRenderTarget(),x=i.getActiveCubeFace(),I=i.getActiveMipmapLevel(),G=i.state;G.setBlending($n),G.buffers.color.setClear(1,1,1,1),G.buffers.depth.setTest(!0),G.setScissorTest(!1);const V=p!==Fn&&this.type===Fn,T=p===Fn&&this.type!==Fn;for(let U=0,k=R.length;U<k;U++){const b=R[U],P=b.shadow;if(P===void 0){console.warn("THREE.WebGLShadowMap:",b,"has no shadow.");continue}if(P.autoUpdate===!1&&P.needsUpdate===!1)continue;s.copy(P.mapSize);const q=P.getFrameExtents();if(s.multiply(q),r.copy(P.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/q.x),s.x=r.x*q.x,P.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/q.y),s.y=r.y*q.y,P.mapSize.y=r.y)),P.map===null||V===!0||T===!0){const $=this.type!==Fn?{minFilter:tn,magFilter:tn}:{};P.map!==null&&P.map.dispose(),P.map=new ei(s.x,s.y,$),P.map.texture.name=b.name+".shadowMap",P.camera.updateProjectionMatrix()}i.setRenderTarget(P.map),i.clear();const et=P.getViewportCount();for(let $=0;$<et;$++){const pt=P.getViewport($);o.set(r.x*pt.x,r.y*pt.y,r.x*pt.z,r.y*pt.w),G.viewport(o),P.updateMatrices(b,$),n=P.getFrustum(),_(L,D,P.camera,b,this.type)}P.isPointLightShadow!==!0&&this.type===Fn&&y(P,D),P.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(E,x,I)};function y(R,L){const D=t.update(v);d.defines.VSM_SAMPLES!==R.blurSamples&&(d.defines.VSM_SAMPLES=R.blurSamples,f.defines.VSM_SAMPLES=R.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new ei(s.x,s.y)),d.uniforms.shadow_pass.value=R.map.texture,d.uniforms.resolution.value=R.mapSize,d.uniforms.radius.value=R.radius,i.setRenderTarget(R.mapPass),i.clear(),i.renderBufferDirect(L,null,D,d,v,null),f.uniforms.shadow_pass.value=R.mapPass.texture,f.uniforms.resolution.value=R.mapSize,f.uniforms.radius.value=R.radius,i.setRenderTarget(R.map),i.clear(),i.renderBufferDirect(L,null,D,f,v,null)}function M(R,L,D,E){let x=null;const I=D.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(I!==void 0)x=I;else if(x=D.isPointLight===!0?l:a,i.localClippingEnabled&&L.clipShadows===!0&&Array.isArray(L.clippingPlanes)&&L.clippingPlanes.length!==0||L.displacementMap&&L.displacementScale!==0||L.alphaMap&&L.alphaTest>0||L.map&&L.alphaTest>0){const G=x.uuid,V=L.uuid;let T=c[G];T===void 0&&(T={},c[G]=T);let U=T[V];U===void 0&&(U=x.clone(),T[V]=U,L.addEventListener("dispose",X)),x=U}if(x.visible=L.visible,x.wireframe=L.wireframe,E===Fn?x.side=L.shadowSide!==null?L.shadowSide:L.side:x.side=L.shadowSide!==null?L.shadowSide:h[L.side],x.alphaMap=L.alphaMap,x.alphaTest=L.alphaTest,x.map=L.map,x.clipShadows=L.clipShadows,x.clippingPlanes=L.clippingPlanes,x.clipIntersection=L.clipIntersection,x.displacementMap=L.displacementMap,x.displacementScale=L.displacementScale,x.displacementBias=L.displacementBias,x.wireframeLinewidth=L.wireframeLinewidth,x.linewidth=L.linewidth,D.isPointLight===!0&&x.isMeshDistanceMaterial===!0){const G=i.properties.get(x);G.light=D}return x}function _(R,L,D,E,x){if(R.visible===!1)return;if(R.layers.test(L.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&x===Fn)&&(!R.frustumCulled||n.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(D.matrixWorldInverse,R.matrixWorld);const V=t.update(R),T=R.material;if(Array.isArray(T)){const U=V.groups;for(let k=0,b=U.length;k<b;k++){const P=U[k],q=T[P.materialIndex];if(q&&q.visible){const et=M(R,q,E,x);R.onBeforeShadow(i,R,L,D,V,et,P),i.renderBufferDirect(D,null,V,et,R,P),R.onAfterShadow(i,R,L,D,V,et,P)}}}else if(T.visible){const U=M(R,T,E,x);R.onBeforeShadow(i,R,L,D,V,U,null),i.renderBufferDirect(D,null,V,U,R,null),R.onAfterShadow(i,R,L,D,V,U,null)}}const G=R.children;for(let V=0,T=G.length;V<T;V++)_(G[V],L,D,E,x)}function X(R){R.target.removeEventListener("dispose",X);for(const D in c){const E=c[D],x=R.target.uuid;x in E&&(E[x].dispose(),delete E[x])}}}const B0={[No]:Fo,[Oo]:Bo,[ko]:Ho,[Zi]:zo,[Fo]:No,[Bo]:Oo,[Ho]:ko,[zo]:Zi};function H0(i,t){function e(){let F=!1;const bt=new ce;let ht=null;const dt=new ce(0,0,0,0);return{setMask:function(Ct){ht!==Ct&&!F&&(i.colorMask(Ct,Ct,Ct,Ct),ht=Ct)},setLocked:function(Ct){F=Ct},setClear:function(Ct,Lt,Ot,ne,fe){fe===!0&&(Ct*=ne,Lt*=ne,Ot*=ne),bt.set(Ct,Lt,Ot,ne),dt.equals(bt)===!1&&(i.clearColor(Ct,Lt,Ot,ne),dt.copy(bt))},reset:function(){F=!1,ht=null,dt.set(-1,0,0,0)}}}function n(){let F=!1,bt=!1,ht=null,dt=null,Ct=null;return{setReversed:function(Lt){if(bt!==Lt){const Ot=t.get("EXT_clip_control");bt?Ot.clipControlEXT(Ot.LOWER_LEFT_EXT,Ot.ZERO_TO_ONE_EXT):Ot.clipControlEXT(Ot.LOWER_LEFT_EXT,Ot.NEGATIVE_ONE_TO_ONE_EXT);const ne=Ct;Ct=null,this.setClear(ne)}bt=Lt},getReversed:function(){return bt},setTest:function(Lt){Lt?j(i.DEPTH_TEST):mt(i.DEPTH_TEST)},setMask:function(Lt){ht!==Lt&&!F&&(i.depthMask(Lt),ht=Lt)},setFunc:function(Lt){if(bt&&(Lt=B0[Lt]),dt!==Lt){switch(Lt){case No:i.depthFunc(i.NEVER);break;case Fo:i.depthFunc(i.ALWAYS);break;case Oo:i.depthFunc(i.LESS);break;case Zi:i.depthFunc(i.LEQUAL);break;case ko:i.depthFunc(i.EQUAL);break;case zo:i.depthFunc(i.GEQUAL);break;case Bo:i.depthFunc(i.GREATER);break;case Ho:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}dt=Lt}},setLocked:function(Lt){F=Lt},setClear:function(Lt){Ct!==Lt&&(bt&&(Lt=1-Lt),i.clearDepth(Lt),Ct=Lt)},reset:function(){F=!1,ht=null,dt=null,Ct=null,bt=!1}}}function s(){let F=!1,bt=null,ht=null,dt=null,Ct=null,Lt=null,Ot=null,ne=null,fe=null;return{setTest:function(zt){F||(zt?j(i.STENCIL_TEST):mt(i.STENCIL_TEST))},setMask:function(zt){bt!==zt&&!F&&(i.stencilMask(zt),bt=zt)},setFunc:function(zt,ee,ie){(ht!==zt||dt!==ee||Ct!==ie)&&(i.stencilFunc(zt,ee,ie),ht=zt,dt=ee,Ct=ie)},setOp:function(zt,ee,ie){(Lt!==zt||Ot!==ee||ne!==ie)&&(i.stencilOp(zt,ee,ie),Lt=zt,Ot=ee,ne=ie)},setLocked:function(zt){F=zt},setClear:function(zt){fe!==zt&&(i.clearStencil(zt),fe=zt)},reset:function(){F=!1,bt=null,ht=null,dt=null,Ct=null,Lt=null,Ot=null,ne=null,fe=null}}}const r=new e,o=new n,a=new s,l=new WeakMap,c=new WeakMap;let u={},h={},d=new WeakMap,f=[],g=null,v=!1,m=null,p=null,y=null,M=null,_=null,X=null,R=null,L=new ut(0,0,0),D=0,E=!1,x=null,I=null,G=null,V=null,T=null;const U=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let k=!1,b=0;const P=i.getParameter(i.VERSION);P.indexOf("WebGL")!==-1?(b=parseFloat(/^WebGL (\d)/.exec(P)[1]),k=b>=1):P.indexOf("OpenGL ES")!==-1&&(b=parseFloat(/^OpenGL ES (\d)/.exec(P)[1]),k=b>=2);let q=null,et={};const $=i.getParameter(i.SCISSOR_BOX),pt=i.getParameter(i.VIEWPORT),Y=new ce().fromArray($),K=new ce().fromArray(pt);function z(F,bt,ht,dt){const Ct=new Uint8Array(4),Lt=i.createTexture();i.bindTexture(F,Lt),i.texParameteri(F,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(F,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ot=0;Ot<ht;Ot++)F===i.TEXTURE_3D||F===i.TEXTURE_2D_ARRAY?i.texImage3D(bt,0,i.RGBA,1,1,dt,0,i.RGBA,i.UNSIGNED_BYTE,Ct):i.texImage2D(bt+Ot,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,Ct);return Lt}const lt={};lt[i.TEXTURE_2D]=z(i.TEXTURE_2D,i.TEXTURE_2D,1),lt[i.TEXTURE_CUBE_MAP]=z(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),lt[i.TEXTURE_2D_ARRAY]=z(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),lt[i.TEXTURE_3D]=z(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),j(i.DEPTH_TEST),o.setFunc(Zi),B(!1),Z(cl),j(i.CULL_FACE),N($n);function j(F){u[F]!==!0&&(i.enable(F),u[F]=!0)}function mt(F){u[F]!==!1&&(i.disable(F),u[F]=!1)}function At(F,bt){return h[F]!==bt?(i.bindFramebuffer(F,bt),h[F]=bt,F===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=bt),F===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=bt),!0):!1}function Rt(F,bt){let ht=f,dt=!1;if(F){ht=d.get(bt),ht===void 0&&(ht=[],d.set(bt,ht));const Ct=F.textures;if(ht.length!==Ct.length||ht[0]!==i.COLOR_ATTACHMENT0){for(let Lt=0,Ot=Ct.length;Lt<Ot;Lt++)ht[Lt]=i.COLOR_ATTACHMENT0+Lt;ht.length=Ct.length,dt=!0}}else ht[0]!==i.BACK&&(ht[0]=i.BACK,dt=!0);dt&&i.drawBuffers(ht)}function Ht(F){return g!==F?(i.useProgram(F),g=F,!0):!1}const xt={[di]:i.FUNC_ADD,[nh]:i.FUNC_SUBTRACT,[ih]:i.FUNC_REVERSE_SUBTRACT};xt[sh]=i.MIN,xt[rh]=i.MAX;const Et={[oh]:i.ZERO,[ah]:i.ONE,[lh]:i.SRC_COLOR,[Do]:i.SRC_ALPHA,[ph]:i.SRC_ALPHA_SATURATE,[fh]:i.DST_COLOR,[uh]:i.DST_ALPHA,[ch]:i.ONE_MINUS_SRC_COLOR,[Uo]:i.ONE_MINUS_SRC_ALPHA,[dh]:i.ONE_MINUS_DST_COLOR,[hh]:i.ONE_MINUS_DST_ALPHA,[mh]:i.CONSTANT_COLOR,[gh]:i.ONE_MINUS_CONSTANT_COLOR,[vh]:i.CONSTANT_ALPHA,[_h]:i.ONE_MINUS_CONSTANT_ALPHA};function N(F,bt,ht,dt,Ct,Lt,Ot,ne,fe,zt){if(F===$n){v===!0&&(mt(i.BLEND),v=!1);return}if(v===!1&&(j(i.BLEND),v=!0),F!==eh){if(F!==m||zt!==E){if((p!==di||_!==di)&&(i.blendEquation(i.FUNC_ADD),p=di,_=di),zt)switch(F){case Ge:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case qi:i.blendFunc(i.ONE,i.ONE);break;case ul:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case hl:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",F);break}else switch(F){case Ge:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case qi:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case ul:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case hl:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",F);break}y=null,M=null,X=null,R=null,L.set(0,0,0),D=0,m=F,E=zt}return}Ct=Ct||bt,Lt=Lt||ht,Ot=Ot||dt,(bt!==p||Ct!==_)&&(i.blendEquationSeparate(xt[bt],xt[Ct]),p=bt,_=Ct),(ht!==y||dt!==M||Lt!==X||Ot!==R)&&(i.blendFuncSeparate(Et[ht],Et[dt],Et[Lt],Et[Ot]),y=ht,M=dt,X=Lt,R=Ot),(ne.equals(L)===!1||fe!==D)&&(i.blendColor(ne.r,ne.g,ne.b,fe),L.copy(ne),D=fe),m=F,E=!1}function S(F,bt){F.side===Ie?mt(i.CULL_FACE):j(i.CULL_FACE);let ht=F.side===He;bt&&(ht=!ht),B(ht),F.blending===Ge&&F.transparent===!1?N($n):N(F.blending,F.blendEquation,F.blendSrc,F.blendDst,F.blendEquationAlpha,F.blendSrcAlpha,F.blendDstAlpha,F.blendColor,F.blendAlpha,F.premultipliedAlpha),o.setFunc(F.depthFunc),o.setTest(F.depthTest),o.setMask(F.depthWrite),r.setMask(F.colorWrite);const dt=F.stencilWrite;a.setTest(dt),dt&&(a.setMask(F.stencilWriteMask),a.setFunc(F.stencilFunc,F.stencilRef,F.stencilFuncMask),a.setOp(F.stencilFail,F.stencilZFail,F.stencilZPass)),nt(F.polygonOffset,F.polygonOffsetFactor,F.polygonOffsetUnits),F.alphaToCoverage===!0?j(i.SAMPLE_ALPHA_TO_COVERAGE):mt(i.SAMPLE_ALPHA_TO_COVERAGE)}function B(F){x!==F&&(F?i.frontFace(i.CW):i.frontFace(i.CCW),x=F)}function Z(F){F!==Qu?(j(i.CULL_FACE),F!==I&&(F===cl?i.cullFace(i.BACK):F===th?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):mt(i.CULL_FACE),I=F}function H(F){F!==G&&(k&&i.lineWidth(F),G=F)}function nt(F,bt,ht){F?(j(i.POLYGON_OFFSET_FILL),(V!==bt||T!==ht)&&(i.polygonOffset(bt,ht),V=bt,T=ht)):mt(i.POLYGON_OFFSET_FILL)}function tt(F){F?j(i.SCISSOR_TEST):mt(i.SCISSOR_TEST)}function A(F){F===void 0&&(F=i.TEXTURE0+U-1),q!==F&&(i.activeTexture(F),q=F)}function w(F,bt,ht){ht===void 0&&(q===null?ht=i.TEXTURE0+U-1:ht=q);let dt=et[ht];dt===void 0&&(dt={type:void 0,texture:void 0},et[ht]=dt),(dt.type!==F||dt.texture!==bt)&&(q!==ht&&(i.activeTexture(ht),q=ht),i.bindTexture(F,bt||lt[F]),dt.type=F,dt.texture=bt)}function ot(){const F=et[q];F!==void 0&&F.type!==void 0&&(i.bindTexture(F.type,null),F.type=void 0,F.texture=void 0)}function yt(){try{i.compressedTexImage2D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function J(){try{i.compressedTexImage3D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function it(){try{i.texSubImage2D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function St(){try{i.texSubImage3D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function ft(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Mt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function It(){try{i.texStorage2D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function gt(){try{i.texStorage3D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Pt(){try{i.texImage2D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Ft(){try{i.texImage3D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function W(F){Y.equals(F)===!1&&(i.scissor(F.x,F.y,F.z,F.w),Y.copy(F))}function Q(F){K.equals(F)===!1&&(i.viewport(F.x,F.y,F.z,F.w),K.copy(F))}function ct(F,bt){let ht=c.get(bt);ht===void 0&&(ht=new WeakMap,c.set(bt,ht));let dt=ht.get(F);dt===void 0&&(dt=i.getUniformBlockIndex(bt,F.name),ht.set(F,dt))}function at(F,bt){const dt=c.get(bt).get(F);l.get(bt)!==dt&&(i.uniformBlockBinding(bt,dt,F.__bindingPointIndex),l.set(bt,dt))}function wt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),u={},q=null,et={},h={},d=new WeakMap,f=[],g=null,v=!1,m=null,p=null,y=null,M=null,_=null,X=null,R=null,L=new ut(0,0,0),D=0,E=!1,x=null,I=null,G=null,V=null,T=null,Y.set(0,0,i.canvas.width,i.canvas.height),K.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:j,disable:mt,bindFramebuffer:At,drawBuffers:Rt,useProgram:Ht,setBlending:N,setMaterial:S,setFlipSided:B,setCullFace:Z,setLineWidth:H,setPolygonOffset:nt,setScissorTest:tt,activeTexture:A,bindTexture:w,unbindTexture:ot,compressedTexImage2D:yt,compressedTexImage3D:J,texImage2D:Pt,texImage3D:Ft,updateUBOMapping:ct,uniformBlockBinding:at,texStorage2D:It,texStorage3D:gt,texSubImage2D:it,texSubImage3D:St,compressedTexSubImage2D:ft,compressedTexSubImage3D:Mt,scissor:W,viewport:Q,reset:wt}}function rc(i,t,e,n){const s=G0(n);switch(e){case su:return i*t;case ou:return i*t;case au:return i*t*2;case Na:return i*t/s.components*s.byteLength;case Fa:return i*t/s.components*s.byteLength;case lu:return i*t*2/s.components*s.byteLength;case Oa:return i*t*2/s.components*s.byteLength;case ru:return i*t*3/s.components*s.byteLength;case qe:return i*t*4/s.components*s.byteLength;case ka:return i*t*4/s.components*s.byteLength;case pr:case mr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case gr:case vr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Yo:case Zo:return Math.max(i,16)*Math.max(t,8)/4;case Xo:case qo:return Math.max(i,8)*Math.max(t,8)/2;case Ko:case Jo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case $o:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case jo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Qo:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case ta:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case ea:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case na:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case ia:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case sa:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case ra:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case oa:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case aa:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case la:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case ca:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case ua:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case ha:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case _r:case fa:case da:return Math.ceil(i/4)*Math.ceil(t/4)*16;case cu:case pa:return Math.ceil(i/4)*Math.ceil(t/4)*8;case ma:case ga:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function G0(i){switch(i){case bn:case eu:return{byteLength:1,components:1};case bs:case nu:case es:return{byteLength:2,components:1};case Da:case Ua:return{byteLength:2,components:4};case vi:case La:case mn:return{byteLength:4,components:1};case iu:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function V0(i,t,e,n,s,r,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Tt,u=new WeakMap;let h;const d=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(A,w){return f?new OffscreenCanvas(A,w):Sr("canvas")}function v(A,w,ot){let yt=1;const J=tt(A);if((J.width>ot||J.height>ot)&&(yt=ot/Math.max(J.width,J.height)),yt<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){const it=Math.floor(yt*J.width),St=Math.floor(yt*J.height);h===void 0&&(h=g(it,St));const ft=w?g(it,St):h;return ft.width=it,ft.height=St,ft.getContext("2d").drawImage(A,0,0,it,St),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+it+"x"+St+")."),ft}else return"data"in A&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),A;return A}function m(A){return A.generateMipmaps}function p(A){i.generateMipmap(A)}function y(A){return A.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?i.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function M(A,w,ot,yt,J=!1){if(A!==null){if(i[A]!==void 0)return i[A];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let it=w;if(w===i.RED&&(ot===i.FLOAT&&(it=i.R32F),ot===i.HALF_FLOAT&&(it=i.R16F),ot===i.UNSIGNED_BYTE&&(it=i.R8)),w===i.RED_INTEGER&&(ot===i.UNSIGNED_BYTE&&(it=i.R8UI),ot===i.UNSIGNED_SHORT&&(it=i.R16UI),ot===i.UNSIGNED_INT&&(it=i.R32UI),ot===i.BYTE&&(it=i.R8I),ot===i.SHORT&&(it=i.R16I),ot===i.INT&&(it=i.R32I)),w===i.RG&&(ot===i.FLOAT&&(it=i.RG32F),ot===i.HALF_FLOAT&&(it=i.RG16F),ot===i.UNSIGNED_BYTE&&(it=i.RG8)),w===i.RG_INTEGER&&(ot===i.UNSIGNED_BYTE&&(it=i.RG8UI),ot===i.UNSIGNED_SHORT&&(it=i.RG16UI),ot===i.UNSIGNED_INT&&(it=i.RG32UI),ot===i.BYTE&&(it=i.RG8I),ot===i.SHORT&&(it=i.RG16I),ot===i.INT&&(it=i.RG32I)),w===i.RGB_INTEGER&&(ot===i.UNSIGNED_BYTE&&(it=i.RGB8UI),ot===i.UNSIGNED_SHORT&&(it=i.RGB16UI),ot===i.UNSIGNED_INT&&(it=i.RGB32UI),ot===i.BYTE&&(it=i.RGB8I),ot===i.SHORT&&(it=i.RGB16I),ot===i.INT&&(it=i.RGB32I)),w===i.RGBA_INTEGER&&(ot===i.UNSIGNED_BYTE&&(it=i.RGBA8UI),ot===i.UNSIGNED_SHORT&&(it=i.RGBA16UI),ot===i.UNSIGNED_INT&&(it=i.RGBA32UI),ot===i.BYTE&&(it=i.RGBA8I),ot===i.SHORT&&(it=i.RGBA16I),ot===i.INT&&(it=i.RGBA32I)),w===i.RGB&&ot===i.UNSIGNED_INT_5_9_9_9_REV&&(it=i.RGB9_E5),w===i.RGBA){const St=J?Pr:ae.getTransfer(yt);ot===i.FLOAT&&(it=i.RGBA32F),ot===i.HALF_FLOAT&&(it=i.RGBA16F),ot===i.UNSIGNED_BYTE&&(it=St===de?i.SRGB8_ALPHA8:i.RGBA8),ot===i.UNSIGNED_SHORT_4_4_4_4&&(it=i.RGBA4),ot===i.UNSIGNED_SHORT_5_5_5_1&&(it=i.RGB5_A1)}return(it===i.R16F||it===i.R32F||it===i.RG16F||it===i.RG32F||it===i.RGBA16F||it===i.RGBA32F)&&t.get("EXT_color_buffer_float"),it}function _(A,w){let ot;return A?w===null||w===vi||w===ji?ot=i.DEPTH24_STENCIL8:w===mn?ot=i.DEPTH32F_STENCIL8:w===bs&&(ot=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):w===null||w===vi||w===ji?ot=i.DEPTH_COMPONENT24:w===mn?ot=i.DEPTH_COMPONENT32F:w===bs&&(ot=i.DEPTH_COMPONENT16),ot}function X(A,w){return m(A)===!0||A.isFramebufferTexture&&A.minFilter!==tn&&A.minFilter!==Be?Math.log2(Math.max(w.width,w.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?w.mipmaps.length:1}function R(A){const w=A.target;w.removeEventListener("dispose",R),D(w),w.isVideoTexture&&u.delete(w)}function L(A){const w=A.target;w.removeEventListener("dispose",L),x(w)}function D(A){const w=n.get(A);if(w.__webglInit===void 0)return;const ot=A.source,yt=d.get(ot);if(yt){const J=yt[w.__cacheKey];J.usedTimes--,J.usedTimes===0&&E(A),Object.keys(yt).length===0&&d.delete(ot)}n.remove(A)}function E(A){const w=n.get(A);i.deleteTexture(w.__webglTexture);const ot=A.source,yt=d.get(ot);delete yt[w.__cacheKey],o.memory.textures--}function x(A){const w=n.get(A);if(A.depthTexture&&(A.depthTexture.dispose(),n.remove(A.depthTexture)),A.isWebGLCubeRenderTarget)for(let yt=0;yt<6;yt++){if(Array.isArray(w.__webglFramebuffer[yt]))for(let J=0;J<w.__webglFramebuffer[yt].length;J++)i.deleteFramebuffer(w.__webglFramebuffer[yt][J]);else i.deleteFramebuffer(w.__webglFramebuffer[yt]);w.__webglDepthbuffer&&i.deleteRenderbuffer(w.__webglDepthbuffer[yt])}else{if(Array.isArray(w.__webglFramebuffer))for(let yt=0;yt<w.__webglFramebuffer.length;yt++)i.deleteFramebuffer(w.__webglFramebuffer[yt]);else i.deleteFramebuffer(w.__webglFramebuffer);if(w.__webglDepthbuffer&&i.deleteRenderbuffer(w.__webglDepthbuffer),w.__webglMultisampledFramebuffer&&i.deleteFramebuffer(w.__webglMultisampledFramebuffer),w.__webglColorRenderbuffer)for(let yt=0;yt<w.__webglColorRenderbuffer.length;yt++)w.__webglColorRenderbuffer[yt]&&i.deleteRenderbuffer(w.__webglColorRenderbuffer[yt]);w.__webglDepthRenderbuffer&&i.deleteRenderbuffer(w.__webglDepthRenderbuffer)}const ot=A.textures;for(let yt=0,J=ot.length;yt<J;yt++){const it=n.get(ot[yt]);it.__webglTexture&&(i.deleteTexture(it.__webglTexture),o.memory.textures--),n.remove(ot[yt])}n.remove(A)}let I=0;function G(){I=0}function V(){const A=I;return A>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+s.maxTextures),I+=1,A}function T(A){const w=[];return w.push(A.wrapS),w.push(A.wrapT),w.push(A.wrapR||0),w.push(A.magFilter),w.push(A.minFilter),w.push(A.anisotropy),w.push(A.internalFormat),w.push(A.format),w.push(A.type),w.push(A.generateMipmaps),w.push(A.premultiplyAlpha),w.push(A.flipY),w.push(A.unpackAlignment),w.push(A.colorSpace),w.join()}function U(A,w){const ot=n.get(A);if(A.isVideoTexture&&H(A),A.isRenderTargetTexture===!1&&A.version>0&&ot.__version!==A.version){const yt=A.image;if(yt===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(yt.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{K(ot,A,w);return}}e.bindTexture(i.TEXTURE_2D,ot.__webglTexture,i.TEXTURE0+w)}function k(A,w){const ot=n.get(A);if(A.version>0&&ot.__version!==A.version){K(ot,A,w);return}e.bindTexture(i.TEXTURE_2D_ARRAY,ot.__webglTexture,i.TEXTURE0+w)}function b(A,w){const ot=n.get(A);if(A.version>0&&ot.__version!==A.version){K(ot,A,w);return}e.bindTexture(i.TEXTURE_3D,ot.__webglTexture,i.TEXTURE0+w)}function P(A,w){const ot=n.get(A);if(A.version>0&&ot.__version!==A.version){z(ot,A,w);return}e.bindTexture(i.TEXTURE_CUBE_MAP,ot.__webglTexture,i.TEXTURE0+w)}const q={[$i]:i.REPEAT,[yn]:i.CLAMP_TO_EDGE,[Wo]:i.MIRRORED_REPEAT},et={[tn]:i.NEAREST,[Rh]:i.NEAREST_MIPMAP_NEAREST,[Ns]:i.NEAREST_MIPMAP_LINEAR,[Be]:i.LINEAR,[Br]:i.LINEAR_MIPMAP_NEAREST,[Sn]:i.LINEAR_MIPMAP_LINEAR},$={[Dh]:i.NEVER,[zh]:i.ALWAYS,[Uh]:i.LESS,[hu]:i.LEQUAL,[Nh]:i.EQUAL,[kh]:i.GEQUAL,[Fh]:i.GREATER,[Oh]:i.NOTEQUAL};function pt(A,w){if(w.type===mn&&t.has("OES_texture_float_linear")===!1&&(w.magFilter===Be||w.magFilter===Br||w.magFilter===Ns||w.magFilter===Sn||w.minFilter===Be||w.minFilter===Br||w.minFilter===Ns||w.minFilter===Sn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(A,i.TEXTURE_WRAP_S,q[w.wrapS]),i.texParameteri(A,i.TEXTURE_WRAP_T,q[w.wrapT]),(A===i.TEXTURE_3D||A===i.TEXTURE_2D_ARRAY)&&i.texParameteri(A,i.TEXTURE_WRAP_R,q[w.wrapR]),i.texParameteri(A,i.TEXTURE_MAG_FILTER,et[w.magFilter]),i.texParameteri(A,i.TEXTURE_MIN_FILTER,et[w.minFilter]),w.compareFunction&&(i.texParameteri(A,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(A,i.TEXTURE_COMPARE_FUNC,$[w.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(w.magFilter===tn||w.minFilter!==Ns&&w.minFilter!==Sn||w.type===mn&&t.has("OES_texture_float_linear")===!1)return;if(w.anisotropy>1||n.get(w).__currentAnisotropy){const ot=t.get("EXT_texture_filter_anisotropic");i.texParameterf(A,ot.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(w.anisotropy,s.getMaxAnisotropy())),n.get(w).__currentAnisotropy=w.anisotropy}}}function Y(A,w){let ot=!1;A.__webglInit===void 0&&(A.__webglInit=!0,w.addEventListener("dispose",R));const yt=w.source;let J=d.get(yt);J===void 0&&(J={},d.set(yt,J));const it=T(w);if(it!==A.__cacheKey){J[it]===void 0&&(J[it]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,ot=!0),J[it].usedTimes++;const St=J[A.__cacheKey];St!==void 0&&(J[A.__cacheKey].usedTimes--,St.usedTimes===0&&E(w)),A.__cacheKey=it,A.__webglTexture=J[it].texture}return ot}function K(A,w,ot){let yt=i.TEXTURE_2D;(w.isDataArrayTexture||w.isCompressedArrayTexture)&&(yt=i.TEXTURE_2D_ARRAY),w.isData3DTexture&&(yt=i.TEXTURE_3D);const J=Y(A,w),it=w.source;e.bindTexture(yt,A.__webglTexture,i.TEXTURE0+ot);const St=n.get(it);if(it.version!==St.__version||J===!0){e.activeTexture(i.TEXTURE0+ot);const ft=ae.getPrimaries(ae.workingColorSpace),Mt=w.colorSpace===fn?null:ae.getPrimaries(w.colorSpace),It=w.colorSpace===fn||ft===Mt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,w.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,w.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,It);let gt=v(w.image,!1,s.maxTextureSize);gt=nt(w,gt);const Pt=r.convert(w.format,w.colorSpace),Ft=r.convert(w.type);let W=M(w.internalFormat,Pt,Ft,w.colorSpace,w.isVideoTexture);pt(yt,w);let Q;const ct=w.mipmaps,at=w.isVideoTexture!==!0,wt=St.__version===void 0||J===!0,F=it.dataReady,bt=X(w,gt);if(w.isDepthTexture)W=_(w.format===Qi,w.type),wt&&(at?e.texStorage2D(i.TEXTURE_2D,1,W,gt.width,gt.height):e.texImage2D(i.TEXTURE_2D,0,W,gt.width,gt.height,0,Pt,Ft,null));else if(w.isDataTexture)if(ct.length>0){at&&wt&&e.texStorage2D(i.TEXTURE_2D,bt,W,ct[0].width,ct[0].height);for(let ht=0,dt=ct.length;ht<dt;ht++)Q=ct[ht],at?F&&e.texSubImage2D(i.TEXTURE_2D,ht,0,0,Q.width,Q.height,Pt,Ft,Q.data):e.texImage2D(i.TEXTURE_2D,ht,W,Q.width,Q.height,0,Pt,Ft,Q.data);w.generateMipmaps=!1}else at?(wt&&e.texStorage2D(i.TEXTURE_2D,bt,W,gt.width,gt.height),F&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,gt.width,gt.height,Pt,Ft,gt.data)):e.texImage2D(i.TEXTURE_2D,0,W,gt.width,gt.height,0,Pt,Ft,gt.data);else if(w.isCompressedTexture)if(w.isCompressedArrayTexture){at&&wt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,bt,W,ct[0].width,ct[0].height,gt.depth);for(let ht=0,dt=ct.length;ht<dt;ht++)if(Q=ct[ht],w.format!==qe)if(Pt!==null)if(at){if(F)if(w.layerUpdates.size>0){const Ct=rc(Q.width,Q.height,w.format,w.type);for(const Lt of w.layerUpdates){const Ot=Q.data.subarray(Lt*Ct/Q.data.BYTES_PER_ELEMENT,(Lt+1)*Ct/Q.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ht,0,0,Lt,Q.width,Q.height,1,Pt,Ot)}w.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ht,0,0,0,Q.width,Q.height,gt.depth,Pt,Q.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,ht,W,Q.width,Q.height,gt.depth,0,Q.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else at?F&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,ht,0,0,0,Q.width,Q.height,gt.depth,Pt,Ft,Q.data):e.texImage3D(i.TEXTURE_2D_ARRAY,ht,W,Q.width,Q.height,gt.depth,0,Pt,Ft,Q.data)}else{at&&wt&&e.texStorage2D(i.TEXTURE_2D,bt,W,ct[0].width,ct[0].height);for(let ht=0,dt=ct.length;ht<dt;ht++)Q=ct[ht],w.format!==qe?Pt!==null?at?F&&e.compressedTexSubImage2D(i.TEXTURE_2D,ht,0,0,Q.width,Q.height,Pt,Q.data):e.compressedTexImage2D(i.TEXTURE_2D,ht,W,Q.width,Q.height,0,Q.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):at?F&&e.texSubImage2D(i.TEXTURE_2D,ht,0,0,Q.width,Q.height,Pt,Ft,Q.data):e.texImage2D(i.TEXTURE_2D,ht,W,Q.width,Q.height,0,Pt,Ft,Q.data)}else if(w.isDataArrayTexture)if(at){if(wt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,bt,W,gt.width,gt.height,gt.depth),F)if(w.layerUpdates.size>0){const ht=rc(gt.width,gt.height,w.format,w.type);for(const dt of w.layerUpdates){const Ct=gt.data.subarray(dt*ht/gt.data.BYTES_PER_ELEMENT,(dt+1)*ht/gt.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,dt,gt.width,gt.height,1,Pt,Ft,Ct)}w.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,gt.width,gt.height,gt.depth,Pt,Ft,gt.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,W,gt.width,gt.height,gt.depth,0,Pt,Ft,gt.data);else if(w.isData3DTexture)at?(wt&&e.texStorage3D(i.TEXTURE_3D,bt,W,gt.width,gt.height,gt.depth),F&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,gt.width,gt.height,gt.depth,Pt,Ft,gt.data)):e.texImage3D(i.TEXTURE_3D,0,W,gt.width,gt.height,gt.depth,0,Pt,Ft,gt.data);else if(w.isFramebufferTexture){if(wt)if(at)e.texStorage2D(i.TEXTURE_2D,bt,W,gt.width,gt.height);else{let ht=gt.width,dt=gt.height;for(let Ct=0;Ct<bt;Ct++)e.texImage2D(i.TEXTURE_2D,Ct,W,ht,dt,0,Pt,Ft,null),ht>>=1,dt>>=1}}else if(ct.length>0){if(at&&wt){const ht=tt(ct[0]);e.texStorage2D(i.TEXTURE_2D,bt,W,ht.width,ht.height)}for(let ht=0,dt=ct.length;ht<dt;ht++)Q=ct[ht],at?F&&e.texSubImage2D(i.TEXTURE_2D,ht,0,0,Pt,Ft,Q):e.texImage2D(i.TEXTURE_2D,ht,W,Pt,Ft,Q);w.generateMipmaps=!1}else if(at){if(wt){const ht=tt(gt);e.texStorage2D(i.TEXTURE_2D,bt,W,ht.width,ht.height)}F&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,Pt,Ft,gt)}else e.texImage2D(i.TEXTURE_2D,0,W,Pt,Ft,gt);m(w)&&p(yt),St.__version=it.version,w.onUpdate&&w.onUpdate(w)}A.__version=w.version}function z(A,w,ot){if(w.image.length!==6)return;const yt=Y(A,w),J=w.source;e.bindTexture(i.TEXTURE_CUBE_MAP,A.__webglTexture,i.TEXTURE0+ot);const it=n.get(J);if(J.version!==it.__version||yt===!0){e.activeTexture(i.TEXTURE0+ot);const St=ae.getPrimaries(ae.workingColorSpace),ft=w.colorSpace===fn?null:ae.getPrimaries(w.colorSpace),Mt=w.colorSpace===fn||St===ft?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,w.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,w.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Mt);const It=w.isCompressedTexture||w.image[0].isCompressedTexture,gt=w.image[0]&&w.image[0].isDataTexture,Pt=[];for(let dt=0;dt<6;dt++)!It&&!gt?Pt[dt]=v(w.image[dt],!0,s.maxCubemapSize):Pt[dt]=gt?w.image[dt].image:w.image[dt],Pt[dt]=nt(w,Pt[dt]);const Ft=Pt[0],W=r.convert(w.format,w.colorSpace),Q=r.convert(w.type),ct=M(w.internalFormat,W,Q,w.colorSpace),at=w.isVideoTexture!==!0,wt=it.__version===void 0||yt===!0,F=J.dataReady;let bt=X(w,Ft);pt(i.TEXTURE_CUBE_MAP,w);let ht;if(It){at&&wt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,bt,ct,Ft.width,Ft.height);for(let dt=0;dt<6;dt++){ht=Pt[dt].mipmaps;for(let Ct=0;Ct<ht.length;Ct++){const Lt=ht[Ct];w.format!==qe?W!==null?at?F&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,Ct,0,0,Lt.width,Lt.height,W,Lt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,Ct,ct,Lt.width,Lt.height,0,Lt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):at?F&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,Ct,0,0,Lt.width,Lt.height,W,Q,Lt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,Ct,ct,Lt.width,Lt.height,0,W,Q,Lt.data)}}}else{if(ht=w.mipmaps,at&&wt){ht.length>0&&bt++;const dt=tt(Pt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,bt,ct,dt.width,dt.height)}for(let dt=0;dt<6;dt++)if(gt){at?F&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,0,0,0,Pt[dt].width,Pt[dt].height,W,Q,Pt[dt].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,0,ct,Pt[dt].width,Pt[dt].height,0,W,Q,Pt[dt].data);for(let Ct=0;Ct<ht.length;Ct++){const Ot=ht[Ct].image[dt].image;at?F&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,Ct+1,0,0,Ot.width,Ot.height,W,Q,Ot.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,Ct+1,ct,Ot.width,Ot.height,0,W,Q,Ot.data)}}else{at?F&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,0,0,0,W,Q,Pt[dt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,0,ct,W,Q,Pt[dt]);for(let Ct=0;Ct<ht.length;Ct++){const Lt=ht[Ct];at?F&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,Ct+1,0,0,W,Q,Lt.image[dt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,Ct+1,ct,W,Q,Lt.image[dt])}}}m(w)&&p(i.TEXTURE_CUBE_MAP),it.__version=J.version,w.onUpdate&&w.onUpdate(w)}A.__version=w.version}function lt(A,w,ot,yt,J,it){const St=r.convert(ot.format,ot.colorSpace),ft=r.convert(ot.type),Mt=M(ot.internalFormat,St,ft,ot.colorSpace),It=n.get(w),gt=n.get(ot);if(gt.__renderTarget=w,!It.__hasExternalTextures){const Pt=Math.max(1,w.width>>it),Ft=Math.max(1,w.height>>it);J===i.TEXTURE_3D||J===i.TEXTURE_2D_ARRAY?e.texImage3D(J,it,Mt,Pt,Ft,w.depth,0,St,ft,null):e.texImage2D(J,it,Mt,Pt,Ft,0,St,ft,null)}e.bindFramebuffer(i.FRAMEBUFFER,A),Z(w)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,yt,J,gt.__webglTexture,0,B(w)):(J===i.TEXTURE_2D||J>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,yt,J,gt.__webglTexture,it),e.bindFramebuffer(i.FRAMEBUFFER,null)}function j(A,w,ot){if(i.bindRenderbuffer(i.RENDERBUFFER,A),w.depthBuffer){const yt=w.depthTexture,J=yt&&yt.isDepthTexture?yt.type:null,it=_(w.stencilBuffer,J),St=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ft=B(w);Z(w)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ft,it,w.width,w.height):ot?i.renderbufferStorageMultisample(i.RENDERBUFFER,ft,it,w.width,w.height):i.renderbufferStorage(i.RENDERBUFFER,it,w.width,w.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,St,i.RENDERBUFFER,A)}else{const yt=w.textures;for(let J=0;J<yt.length;J++){const it=yt[J],St=r.convert(it.format,it.colorSpace),ft=r.convert(it.type),Mt=M(it.internalFormat,St,ft,it.colorSpace),It=B(w);ot&&Z(w)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,It,Mt,w.width,w.height):Z(w)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,It,Mt,w.width,w.height):i.renderbufferStorage(i.RENDERBUFFER,Mt,w.width,w.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function mt(A,w){if(w&&w.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,A),!(w.depthTexture&&w.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const yt=n.get(w.depthTexture);yt.__renderTarget=w,(!yt.__webglTexture||w.depthTexture.image.width!==w.width||w.depthTexture.image.height!==w.height)&&(w.depthTexture.image.width=w.width,w.depthTexture.image.height=w.height,w.depthTexture.needsUpdate=!0),U(w.depthTexture,0);const J=yt.__webglTexture,it=B(w);if(w.depthTexture.format===Xi)Z(w)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,J,0,it):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,J,0);else if(w.depthTexture.format===Qi)Z(w)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,J,0,it):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,J,0);else throw new Error("Unknown depthTexture format")}function At(A){const w=n.get(A),ot=A.isWebGLCubeRenderTarget===!0;if(w.__boundDepthTexture!==A.depthTexture){const yt=A.depthTexture;if(w.__depthDisposeCallback&&w.__depthDisposeCallback(),yt){const J=()=>{delete w.__boundDepthTexture,delete w.__depthDisposeCallback,yt.removeEventListener("dispose",J)};yt.addEventListener("dispose",J),w.__depthDisposeCallback=J}w.__boundDepthTexture=yt}if(A.depthTexture&&!w.__autoAllocateDepthBuffer){if(ot)throw new Error("target.depthTexture not supported in Cube render targets");mt(w.__webglFramebuffer,A)}else if(ot){w.__webglDepthbuffer=[];for(let yt=0;yt<6;yt++)if(e.bindFramebuffer(i.FRAMEBUFFER,w.__webglFramebuffer[yt]),w.__webglDepthbuffer[yt]===void 0)w.__webglDepthbuffer[yt]=i.createRenderbuffer(),j(w.__webglDepthbuffer[yt],A,!1);else{const J=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,it=w.__webglDepthbuffer[yt];i.bindRenderbuffer(i.RENDERBUFFER,it),i.framebufferRenderbuffer(i.FRAMEBUFFER,J,i.RENDERBUFFER,it)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,w.__webglFramebuffer),w.__webglDepthbuffer===void 0)w.__webglDepthbuffer=i.createRenderbuffer(),j(w.__webglDepthbuffer,A,!1);else{const yt=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,J=w.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,J),i.framebufferRenderbuffer(i.FRAMEBUFFER,yt,i.RENDERBUFFER,J)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Rt(A,w,ot){const yt=n.get(A);w!==void 0&&lt(yt.__webglFramebuffer,A,A.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),ot!==void 0&&At(A)}function Ht(A){const w=A.texture,ot=n.get(A),yt=n.get(w);A.addEventListener("dispose",L);const J=A.textures,it=A.isWebGLCubeRenderTarget===!0,St=J.length>1;if(St||(yt.__webglTexture===void 0&&(yt.__webglTexture=i.createTexture()),yt.__version=w.version,o.memory.textures++),it){ot.__webglFramebuffer=[];for(let ft=0;ft<6;ft++)if(w.mipmaps&&w.mipmaps.length>0){ot.__webglFramebuffer[ft]=[];for(let Mt=0;Mt<w.mipmaps.length;Mt++)ot.__webglFramebuffer[ft][Mt]=i.createFramebuffer()}else ot.__webglFramebuffer[ft]=i.createFramebuffer()}else{if(w.mipmaps&&w.mipmaps.length>0){ot.__webglFramebuffer=[];for(let ft=0;ft<w.mipmaps.length;ft++)ot.__webglFramebuffer[ft]=i.createFramebuffer()}else ot.__webglFramebuffer=i.createFramebuffer();if(St)for(let ft=0,Mt=J.length;ft<Mt;ft++){const It=n.get(J[ft]);It.__webglTexture===void 0&&(It.__webglTexture=i.createTexture(),o.memory.textures++)}if(A.samples>0&&Z(A)===!1){ot.__webglMultisampledFramebuffer=i.createFramebuffer(),ot.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,ot.__webglMultisampledFramebuffer);for(let ft=0;ft<J.length;ft++){const Mt=J[ft];ot.__webglColorRenderbuffer[ft]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,ot.__webglColorRenderbuffer[ft]);const It=r.convert(Mt.format,Mt.colorSpace),gt=r.convert(Mt.type),Pt=M(Mt.internalFormat,It,gt,Mt.colorSpace,A.isXRRenderTarget===!0),Ft=B(A);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ft,Pt,A.width,A.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.RENDERBUFFER,ot.__webglColorRenderbuffer[ft])}i.bindRenderbuffer(i.RENDERBUFFER,null),A.depthBuffer&&(ot.__webglDepthRenderbuffer=i.createRenderbuffer(),j(ot.__webglDepthRenderbuffer,A,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(it){e.bindTexture(i.TEXTURE_CUBE_MAP,yt.__webglTexture),pt(i.TEXTURE_CUBE_MAP,w);for(let ft=0;ft<6;ft++)if(w.mipmaps&&w.mipmaps.length>0)for(let Mt=0;Mt<w.mipmaps.length;Mt++)lt(ot.__webglFramebuffer[ft][Mt],A,w,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ft,Mt);else lt(ot.__webglFramebuffer[ft],A,w,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ft,0);m(w)&&p(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(St){for(let ft=0,Mt=J.length;ft<Mt;ft++){const It=J[ft],gt=n.get(It);e.bindTexture(i.TEXTURE_2D,gt.__webglTexture),pt(i.TEXTURE_2D,It),lt(ot.__webglFramebuffer,A,It,i.COLOR_ATTACHMENT0+ft,i.TEXTURE_2D,0),m(It)&&p(i.TEXTURE_2D)}e.unbindTexture()}else{let ft=i.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(ft=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ft,yt.__webglTexture),pt(ft,w),w.mipmaps&&w.mipmaps.length>0)for(let Mt=0;Mt<w.mipmaps.length;Mt++)lt(ot.__webglFramebuffer[Mt],A,w,i.COLOR_ATTACHMENT0,ft,Mt);else lt(ot.__webglFramebuffer,A,w,i.COLOR_ATTACHMENT0,ft,0);m(w)&&p(ft),e.unbindTexture()}A.depthBuffer&&At(A)}function xt(A){const w=A.textures;for(let ot=0,yt=w.length;ot<yt;ot++){const J=w[ot];if(m(J)){const it=y(A),St=n.get(J).__webglTexture;e.bindTexture(it,St),p(it),e.unbindTexture()}}}const Et=[],N=[];function S(A){if(A.samples>0){if(Z(A)===!1){const w=A.textures,ot=A.width,yt=A.height;let J=i.COLOR_BUFFER_BIT;const it=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,St=n.get(A),ft=w.length>1;if(ft)for(let Mt=0;Mt<w.length;Mt++)e.bindFramebuffer(i.FRAMEBUFFER,St.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,St.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,St.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,St.__webglFramebuffer);for(let Mt=0;Mt<w.length;Mt++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(J|=i.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(J|=i.STENCIL_BUFFER_BIT)),ft){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,St.__webglColorRenderbuffer[Mt]);const It=n.get(w[Mt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,It,0)}i.blitFramebuffer(0,0,ot,yt,0,0,ot,yt,J,i.NEAREST),l===!0&&(Et.length=0,N.length=0,Et.push(i.COLOR_ATTACHMENT0+Mt),A.depthBuffer&&A.resolveDepthBuffer===!1&&(Et.push(it),N.push(it),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,N)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Et))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ft)for(let Mt=0;Mt<w.length;Mt++){e.bindFramebuffer(i.FRAMEBUFFER,St.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.RENDERBUFFER,St.__webglColorRenderbuffer[Mt]);const It=n.get(w[Mt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,St.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.TEXTURE_2D,It,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,St.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.resolveDepthBuffer===!1&&l){const w=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[w])}}}function B(A){return Math.min(s.maxSamples,A.samples)}function Z(A){const w=n.get(A);return A.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&w.__useRenderToTexture!==!1}function H(A){const w=o.render.frame;u.get(A)!==w&&(u.set(A,w),A.update())}function nt(A,w){const ot=A.colorSpace,yt=A.format,J=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||ot!==ns&&ot!==fn&&(ae.getTransfer(ot)===de?(yt!==qe||J!==bn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",ot)),w}function tt(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(c.width=A.naturalWidth||A.width,c.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(c.width=A.displayWidth,c.height=A.displayHeight):(c.width=A.width,c.height=A.height),c}this.allocateTextureUnit=V,this.resetTextureUnits=G,this.setTexture2D=U,this.setTexture2DArray=k,this.setTexture3D=b,this.setTextureCube=P,this.rebindTextures=Rt,this.setupRenderTarget=Ht,this.updateRenderTargetMipmap=xt,this.updateMultisampleRenderTarget=S,this.setupDepthRenderbuffer=At,this.setupFrameBufferTexture=lt,this.useMultisampledRTT=Z}function W0(i,t){function e(n,s=fn){let r;const o=ae.getTransfer(s);if(n===bn)return i.UNSIGNED_BYTE;if(n===Da)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ua)return i.UNSIGNED_SHORT_5_5_5_1;if(n===iu)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===eu)return i.BYTE;if(n===nu)return i.SHORT;if(n===bs)return i.UNSIGNED_SHORT;if(n===La)return i.INT;if(n===vi)return i.UNSIGNED_INT;if(n===mn)return i.FLOAT;if(n===es)return i.HALF_FLOAT;if(n===su)return i.ALPHA;if(n===ru)return i.RGB;if(n===qe)return i.RGBA;if(n===ou)return i.LUMINANCE;if(n===au)return i.LUMINANCE_ALPHA;if(n===Xi)return i.DEPTH_COMPONENT;if(n===Qi)return i.DEPTH_STENCIL;if(n===Na)return i.RED;if(n===Fa)return i.RED_INTEGER;if(n===lu)return i.RG;if(n===Oa)return i.RG_INTEGER;if(n===ka)return i.RGBA_INTEGER;if(n===pr||n===mr||n===gr||n===vr)if(o===de)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===pr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===mr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===gr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===vr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===pr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===mr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===gr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===vr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Xo||n===Yo||n===qo||n===Zo)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Xo)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Yo)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===qo)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Zo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ko||n===Jo||n===$o)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Ko||n===Jo)return o===de?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===$o)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===jo||n===Qo||n===ta||n===ea||n===na||n===ia||n===sa||n===ra||n===oa||n===aa||n===la||n===ca||n===ua||n===ha)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===jo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Qo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ta)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ea)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===na)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ia)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===sa)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ra)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===oa)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===aa)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===la)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===ca)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ua)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===ha)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===_r||n===fa||n===da)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===_r)return o===de?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===fa)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===da)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===cu||n===pa||n===ma||n===ga)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===_r)return r.COMPRESSED_RED_RGTC1_EXT;if(n===pa)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===ma)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===ga)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ji?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}class X0 extends Qe{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class ge extends Jt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Y0={type:"move"};class go{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ge,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ge,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ge,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(const v of t.hand.values()){const m=e.getJointPose(v,n),p=this._getHandJoint(c,v);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],d=u.position.distanceTo(h.position),f=.02,g=.005;c.inputState.pinching&&d>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Y0)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new ge;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const q0=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Z0=`
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

}`;class K0{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const s=new ke,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Ee({vertexShader:q0,fragmentShader:Z0,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Yt(new Hn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class J0 extends is{constructor(t,e){super();const n=this;let s=null,r=1,o=null,a="local-floor",l=1,c=null,u=null,h=null,d=null,f=null,g=null;const v=new K0,m=e.getContextAttributes();let p=null,y=null;const M=[],_=[],X=new Tt;let R=null;const L=new Qe;L.viewport=new ce;const D=new Qe;D.viewport=new ce;const E=[L,D],x=new X0;let I=null,G=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let z=M[K];return z===void 0&&(z=new go,M[K]=z),z.getTargetRaySpace()},this.getControllerGrip=function(K){let z=M[K];return z===void 0&&(z=new go,M[K]=z),z.getGripSpace()},this.getHand=function(K){let z=M[K];return z===void 0&&(z=new go,M[K]=z),z.getHandSpace()};function V(K){const z=_.indexOf(K.inputSource);if(z===-1)return;const lt=M[z];lt!==void 0&&(lt.update(K.inputSource,K.frame,c||o),lt.dispatchEvent({type:K.type,data:K.inputSource}))}function T(){s.removeEventListener("select",V),s.removeEventListener("selectstart",V),s.removeEventListener("selectend",V),s.removeEventListener("squeeze",V),s.removeEventListener("squeezestart",V),s.removeEventListener("squeezeend",V),s.removeEventListener("end",T),s.removeEventListener("inputsourceschange",U);for(let K=0;K<M.length;K++){const z=_[K];z!==null&&(_[K]=null,M[K].disconnect(z))}I=null,G=null,v.reset(),t.setRenderTarget(p),f=null,d=null,h=null,s=null,y=null,Y.stop(),n.isPresenting=!1,t.setPixelRatio(R),t.setSize(X.width,X.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){a=K,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return h},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(p=t.getRenderTarget(),s.addEventListener("select",V),s.addEventListener("selectstart",V),s.addEventListener("selectend",V),s.addEventListener("squeeze",V),s.addEventListener("squeezestart",V),s.addEventListener("squeezeend",V),s.addEventListener("end",T),s.addEventListener("inputsourceschange",U),m.xrCompatible!==!0&&await e.makeXRCompatible(),R=t.getPixelRatio(),t.getSize(X),s.renderState.layers===void 0){const z={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,e,z),s.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new ei(f.framebufferWidth,f.framebufferHeight,{format:qe,type:bn,colorSpace:t.outputColorSpace,stencilBuffer:m.stencil})}else{let z=null,lt=null,j=null;m.depth&&(j=m.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,z=m.stencil?Qi:Xi,lt=m.stencil?ji:vi);const mt={colorFormat:e.RGBA8,depthFormat:j,scaleFactor:r};h=new XRWebGLBinding(s,e),d=h.createProjectionLayer(mt),s.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),y=new ei(d.textureWidth,d.textureHeight,{format:qe,type:bn,depthTexture:new wu(d.textureWidth,d.textureHeight,lt,void 0,void 0,void 0,void 0,void 0,void 0,z),stencilBuffer:m.stencil,colorSpace:t.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),Y.setContext(s),Y.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function U(K){for(let z=0;z<K.removed.length;z++){const lt=K.removed[z],j=_.indexOf(lt);j>=0&&(_[j]=null,M[j].disconnect(lt))}for(let z=0;z<K.added.length;z++){const lt=K.added[z];let j=_.indexOf(lt);if(j===-1){for(let At=0;At<M.length;At++)if(At>=_.length){_.push(lt),j=At;break}else if(_[At]===null){_[At]=lt,j=At;break}if(j===-1)break}const mt=M[j];mt&&mt.connect(lt)}}const k=new O,b=new O;function P(K,z,lt){k.setFromMatrixPosition(z.matrixWorld),b.setFromMatrixPosition(lt.matrixWorld);const j=k.distanceTo(b),mt=z.projectionMatrix.elements,At=lt.projectionMatrix.elements,Rt=mt[14]/(mt[10]-1),Ht=mt[14]/(mt[10]+1),xt=(mt[9]+1)/mt[5],Et=(mt[9]-1)/mt[5],N=(mt[8]-1)/mt[0],S=(At[8]+1)/At[0],B=Rt*N,Z=Rt*S,H=j/(-N+S),nt=H*-N;if(z.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(nt),K.translateZ(H),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),mt[10]===-1)K.projectionMatrix.copy(z.projectionMatrix),K.projectionMatrixInverse.copy(z.projectionMatrixInverse);else{const tt=Rt+H,A=Ht+H,w=B-nt,ot=Z+(j-nt),yt=xt*Ht/A*tt,J=Et*Ht/A*tt;K.projectionMatrix.makePerspective(w,ot,yt,J,tt,A),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function q(K,z){z===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(z.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let z=K.near,lt=K.far;v.texture!==null&&(v.depthNear>0&&(z=v.depthNear),v.depthFar>0&&(lt=v.depthFar)),x.near=D.near=L.near=z,x.far=D.far=L.far=lt,(I!==x.near||G!==x.far)&&(s.updateRenderState({depthNear:x.near,depthFar:x.far}),I=x.near,G=x.far),L.layers.mask=K.layers.mask|2,D.layers.mask=K.layers.mask|4,x.layers.mask=L.layers.mask|D.layers.mask;const j=K.parent,mt=x.cameras;q(x,j);for(let At=0;At<mt.length;At++)q(mt[At],j);mt.length===2?P(x,L,D):x.projectionMatrix.copy(L.projectionMatrix),et(K,x,j)};function et(K,z,lt){lt===null?K.matrix.copy(z.matrixWorld):(K.matrix.copy(lt.matrixWorld),K.matrix.invert(),K.matrix.multiply(z.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(z.projectionMatrix),K.projectionMatrixInverse.copy(z.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=va*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return x},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(K){l=K,d!==null&&(d.fixedFoveation=K),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=K)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(x)};let $=null;function pt(K,z){if(u=z.getViewerPose(c||o),g=z,u!==null){const lt=u.views;f!==null&&(t.setRenderTargetFramebuffer(y,f.framebuffer),t.setRenderTarget(y));let j=!1;lt.length!==x.cameras.length&&(x.cameras.length=0,j=!0);for(let At=0;At<lt.length;At++){const Rt=lt[At];let Ht=null;if(f!==null)Ht=f.getViewport(Rt);else{const Et=h.getViewSubImage(d,Rt);Ht=Et.viewport,At===0&&(t.setRenderTargetTextures(y,Et.colorTexture,d.ignoreDepthValues?void 0:Et.depthStencilTexture),t.setRenderTarget(y))}let xt=E[At];xt===void 0&&(xt=new Qe,xt.layers.enable(At),xt.viewport=new ce,E[At]=xt),xt.matrix.fromArray(Rt.transform.matrix),xt.matrix.decompose(xt.position,xt.quaternion,xt.scale),xt.projectionMatrix.fromArray(Rt.projectionMatrix),xt.projectionMatrixInverse.copy(xt.projectionMatrix).invert(),xt.viewport.set(Ht.x,Ht.y,Ht.width,Ht.height),At===0&&(x.matrix.copy(xt.matrix),x.matrix.decompose(x.position,x.quaternion,x.scale)),j===!0&&x.cameras.push(xt)}const mt=s.enabledFeatures;if(mt&&mt.includes("depth-sensing")){const At=h.getDepthInformation(lt[0]);At&&At.isValid&&At.texture&&v.init(t,At,s.renderState)}}for(let lt=0;lt<M.length;lt++){const j=_[lt],mt=M[lt];j!==null&&mt!==void 0&&mt.update(j,z,c||o)}$&&$(K,z),z.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:z}),g=null}const Y=new Su;Y.setAnimationLoop(pt),this.setAnimationLoop=function(K){$=K},this.dispose=function(){}}}const ci=new En,$0=new Qt;function j0(i,t){function e(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,xu(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,y,M,_){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),h(m,p)):p.isMeshPhongMaterial?(r(m,p),u(m,p)):p.isMeshStandardMaterial?(r(m,p),d(m,p),p.isMeshPhysicalMaterial&&f(m,p,_)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),v(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?l(m,p,y,M):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,e(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===He&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,e(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===He&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,e(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,e(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const y=t.get(p),M=y.envMap,_=y.envMapRotation;M&&(m.envMap.value=M,ci.copy(_),ci.x*=-1,ci.y*=-1,ci.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(ci.y*=-1,ci.z*=-1),m.envMapRotation.value.setFromMatrix4($0.makeRotationFromEuler(ci)),m.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,y,M){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*y,m.scale.value=M*.5,p.map&&(m.map.value=p.map,e(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function u(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function h(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function d(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,y){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===He&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=y.texture,m.transmissionSamplerSize.value.set(y.width,y.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function v(m,p){const y=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(y.matrixWorld),m.nearDistance.value=y.shadow.camera.near,m.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Q0(i,t,e,n){let s={},r={},o=[];const a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(y,M){const _=M.program;n.uniformBlockBinding(y,_)}function c(y,M){let _=s[y.id];_===void 0&&(g(y),_=u(y),s[y.id]=_,y.addEventListener("dispose",m));const X=M.program;n.updateUBOMapping(y,X);const R=t.render.frame;r[y.id]!==R&&(d(y),r[y.id]=R)}function u(y){const M=h();y.__bindingPointIndex=M;const _=i.createBuffer(),X=y.__size,R=y.usage;return i.bindBuffer(i.UNIFORM_BUFFER,_),i.bufferData(i.UNIFORM_BUFFER,X,R),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,M,_),_}function h(){for(let y=0;y<a;y++)if(o.indexOf(y)===-1)return o.push(y),y;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(y){const M=s[y.id],_=y.uniforms,X=y.__cache;i.bindBuffer(i.UNIFORM_BUFFER,M);for(let R=0,L=_.length;R<L;R++){const D=Array.isArray(_[R])?_[R]:[_[R]];for(let E=0,x=D.length;E<x;E++){const I=D[E];if(f(I,R,E,X)===!0){const G=I.__offset,V=Array.isArray(I.value)?I.value:[I.value];let T=0;for(let U=0;U<V.length;U++){const k=V[U],b=v(k);typeof k=="number"||typeof k=="boolean"?(I.__data[0]=k,i.bufferSubData(i.UNIFORM_BUFFER,G+T,I.__data)):k.isMatrix3?(I.__data[0]=k.elements[0],I.__data[1]=k.elements[1],I.__data[2]=k.elements[2],I.__data[3]=0,I.__data[4]=k.elements[3],I.__data[5]=k.elements[4],I.__data[6]=k.elements[5],I.__data[7]=0,I.__data[8]=k.elements[6],I.__data[9]=k.elements[7],I.__data[10]=k.elements[8],I.__data[11]=0):(k.toArray(I.__data,T),T+=b.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,G,I.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(y,M,_,X){const R=y.value,L=M+"_"+_;if(X[L]===void 0)return typeof R=="number"||typeof R=="boolean"?X[L]=R:X[L]=R.clone(),!0;{const D=X[L];if(typeof R=="number"||typeof R=="boolean"){if(D!==R)return X[L]=R,!0}else if(D.equals(R)===!1)return D.copy(R),!0}return!1}function g(y){const M=y.uniforms;let _=0;const X=16;for(let L=0,D=M.length;L<D;L++){const E=Array.isArray(M[L])?M[L]:[M[L]];for(let x=0,I=E.length;x<I;x++){const G=E[x],V=Array.isArray(G.value)?G.value:[G.value];for(let T=0,U=V.length;T<U;T++){const k=V[T],b=v(k),P=_%X,q=P%b.boundary,et=P+q;_+=q,et!==0&&X-et<b.storage&&(_+=X-et),G.__data=new Float32Array(b.storage/Float32Array.BYTES_PER_ELEMENT),G.__offset=_,_+=b.storage}}}const R=_%X;return R>0&&(_+=X-R),y.__size=_,y.__cache={},this}function v(y){const M={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(M.boundary=4,M.storage=4):y.isVector2?(M.boundary=8,M.storage=8):y.isVector3||y.isColor?(M.boundary=16,M.storage=12):y.isVector4?(M.boundary=16,M.storage=16):y.isMatrix3?(M.boundary=48,M.storage=48):y.isMatrix4?(M.boundary=64,M.storage=64):y.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",y),M}function m(y){const M=y.target;M.removeEventListener("dispose",m);const _=o.indexOf(M.__bindingPointIndex);o.splice(_,1),i.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function p(){for(const y in s)i.deleteBuffer(s[y]);o=[],s={},r={}}return{bind:l,update:c,dispose:p}}class tg{constructor(t={}){const{canvas:e=Hh(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reverseDepthBuffer:d=!1}=t;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=o;const g=new Uint32Array(4),v=new Int32Array(4);let m=null,p=null;const y=[],M=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Ye,this.toneMapping=zn,this.toneMappingExposure=1;const _=this;let X=!1,R=0,L=0,D=null,E=-1,x=null;const I=new ce,G=new ce;let V=null;const T=new ut(0);let U=0,k=e.width,b=e.height,P=1,q=null,et=null;const $=new ce(0,0,k,b),pt=new ce(0,0,k,b);let Y=!1;const K=new za;let z=!1,lt=!1;const j=new Qt,mt=new Qt,At=new O,Rt=new ce,Ht={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let xt=!1;function Et(){return D===null?P:1}let N=n;function S(C,st){return e.getContext(C,st)}try{const C={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Pa}`),e.addEventListener("webglcontextlost",dt,!1),e.addEventListener("webglcontextrestored",Ct,!1),e.addEventListener("webglcontextcreationerror",Lt,!1),N===null){const st="webgl2";if(N=S(st,C),N===null)throw S(st)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(C){throw console.error("THREE.WebGLRenderer: "+C.message),C}let B,Z,H,nt,tt,A,w,ot,yt,J,it,St,ft,Mt,It,gt,Pt,Ft,W,Q,ct,at,wt,F;function bt(){B=new rm(N),B.init(),at=new W0(N,B),Z=new Qp(N,B,t,at),H=new H0(N,B),Z.reverseDepthBuffer&&d&&H.buffers.depth.setReversed(!0),nt=new lm(N),tt=new T0,A=new V0(N,B,H,tt,Z,at,nt),w=new em(_),ot=new sm(_),yt=new mf(N),wt=new $p(N,yt),J=new om(N,yt,nt,wt),it=new um(N,J,yt,nt),W=new cm(N,Z,A),gt=new tm(tt),St=new E0(_,w,ot,B,Z,wt,gt),ft=new j0(_,tt),Mt=new C0,It=new U0(B),Ft=new Jp(_,w,ot,H,it,f,l),Pt=new z0(_,it,Z),F=new Q0(N,nt,Z,H),Q=new jp(N,B,nt),ct=new am(N,B,nt),nt.programs=St.programs,_.capabilities=Z,_.extensions=B,_.properties=tt,_.renderLists=Mt,_.shadowMap=Pt,_.state=H,_.info=nt}bt();const ht=new J0(_,N);this.xr=ht,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){const C=B.get("WEBGL_lose_context");C&&C.loseContext()},this.forceContextRestore=function(){const C=B.get("WEBGL_lose_context");C&&C.restoreContext()},this.getPixelRatio=function(){return P},this.setPixelRatio=function(C){C!==void 0&&(P=C,this.setSize(k,b,!1))},this.getSize=function(C){return C.set(k,b)},this.setSize=function(C,st,vt=!0){if(ht.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}k=C,b=st,e.width=Math.floor(C*P),e.height=Math.floor(st*P),vt===!0&&(e.style.width=C+"px",e.style.height=st+"px"),this.setViewport(0,0,C,st)},this.getDrawingBufferSize=function(C){return C.set(k*P,b*P).floor()},this.setDrawingBufferSize=function(C,st,vt){k=C,b=st,P=vt,e.width=Math.floor(C*vt),e.height=Math.floor(st*vt),this.setViewport(0,0,C,st)},this.getCurrentViewport=function(C){return C.copy(I)},this.getViewport=function(C){return C.copy($)},this.setViewport=function(C,st,vt,_t){C.isVector4?$.set(C.x,C.y,C.z,C.w):$.set(C,st,vt,_t),H.viewport(I.copy($).multiplyScalar(P).round())},this.getScissor=function(C){return C.copy(pt)},this.setScissor=function(C,st,vt,_t){C.isVector4?pt.set(C.x,C.y,C.z,C.w):pt.set(C,st,vt,_t),H.scissor(G.copy(pt).multiplyScalar(P).round())},this.getScissorTest=function(){return Y},this.setScissorTest=function(C){H.setScissorTest(Y=C)},this.setOpaqueSort=function(C){q=C},this.setTransparentSort=function(C){et=C},this.getClearColor=function(C){return C.copy(Ft.getClearColor())},this.setClearColor=function(){Ft.setClearColor.apply(Ft,arguments)},this.getClearAlpha=function(){return Ft.getClearAlpha()},this.setClearAlpha=function(){Ft.setClearAlpha.apply(Ft,arguments)},this.clear=function(C=!0,st=!0,vt=!0){let _t=0;if(C){let rt=!1;if(D!==null){const Dt=D.texture.format;rt=Dt===ka||Dt===Oa||Dt===Fa}if(rt){const Dt=D.texture.type,kt=Dt===bn||Dt===vi||Dt===bs||Dt===ji||Dt===Da||Dt===Ua,Gt=Ft.getClearColor(),Vt=Ft.getClearAlpha(),Kt=Gt.r,$t=Gt.g,Wt=Gt.b;kt?(g[0]=Kt,g[1]=$t,g[2]=Wt,g[3]=Vt,N.clearBufferuiv(N.COLOR,0,g)):(v[0]=Kt,v[1]=$t,v[2]=Wt,v[3]=Vt,N.clearBufferiv(N.COLOR,0,v))}else _t|=N.COLOR_BUFFER_BIT}st&&(_t|=N.DEPTH_BUFFER_BIT),vt&&(_t|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),N.clear(_t)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",dt,!1),e.removeEventListener("webglcontextrestored",Ct,!1),e.removeEventListener("webglcontextcreationerror",Lt,!1),Mt.dispose(),It.dispose(),tt.dispose(),w.dispose(),ot.dispose(),it.dispose(),wt.dispose(),F.dispose(),St.dispose(),ht.dispose(),ht.removeEventListener("sessionstart",Ce),ht.removeEventListener("sessionend",on),_n.stop()};function dt(C){C.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),X=!0}function Ct(){console.log("THREE.WebGLRenderer: Context Restored."),X=!1;const C=nt.autoReset,st=Pt.enabled,vt=Pt.autoUpdate,_t=Pt.needsUpdate,rt=Pt.type;bt(),nt.autoReset=C,Pt.enabled=st,Pt.autoUpdate=vt,Pt.needsUpdate=_t,Pt.type=rt}function Lt(C){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",C.statusMessage)}function Ot(C){const st=C.target;st.removeEventListener("dispose",Ot),ne(st)}function ne(C){fe(C),tt.remove(C)}function fe(C){const st=tt.get(C).programs;st!==void 0&&(st.forEach(function(vt){St.releaseProgram(vt)}),C.isShaderMaterial&&St.releaseShaderCache(C))}this.renderBufferDirect=function(C,st,vt,_t,rt,Dt){st===null&&(st=Ht);const kt=rt.isMesh&&rt.matrixWorld.determinant()<0,Gt=Zu(C,st,vt,_t,rt);H.setMaterial(_t,kt);let Vt=vt.index,Kt=1;if(_t.wireframe===!0){if(Vt=J.getWireframeAttribute(vt),Vt===void 0)return;Kt=2}const $t=vt.drawRange,Wt=vt.attributes.position;let le=$t.start*Kt,me=($t.start+$t.count)*Kt;Dt!==null&&(le=Math.max(le,Dt.start*Kt),me=Math.min(me,(Dt.start+Dt.count)*Kt)),Vt!==null?(le=Math.max(le,0),me=Math.min(me,Vt.count)):Wt!=null&&(le=Math.max(le,0),me=Math.min(me,Wt.count));const _e=me-le;if(_e<0||_e===1/0)return;wt.setup(rt,_t,Gt,vt,Vt);let Ve,ue=Q;if(Vt!==null&&(Ve=yt.get(Vt),ue=ct,ue.setIndex(Ve)),rt.isMesh)_t.wireframe===!0?(H.setLineWidth(_t.wireframeLinewidth*Et()),ue.setMode(N.LINES)):ue.setMode(N.TRIANGLES);else if(rt.isLine){let Xt=_t.linewidth;Xt===void 0&&(Xt=1),H.setLineWidth(Xt*Et()),rt.isLineSegments?ue.setMode(N.LINES):rt.isLineLoop?ue.setMode(N.LINE_LOOP):ue.setMode(N.LINE_STRIP)}else rt.isPoints?ue.setMode(N.POINTS):rt.isSprite&&ue.setMode(N.TRIANGLES);if(rt.isBatchedMesh)if(rt._multiDrawInstances!==null)ue.renderMultiDrawInstances(rt._multiDrawStarts,rt._multiDrawCounts,rt._multiDrawCount,rt._multiDrawInstances);else if(B.get("WEBGL_multi_draw"))ue.renderMultiDraw(rt._multiDrawStarts,rt._multiDrawCounts,rt._multiDrawCount);else{const Xt=rt._multiDrawStarts,Cn=rt._multiDrawCounts,he=rt._multiDrawCount,an=Vt?yt.get(Vt).bytesPerElement:1,Si=tt.get(_t).currentProgram.getUniforms();for(let Ke=0;Ke<he;Ke++)Si.setValue(N,"_gl_DrawID",Ke),ue.render(Xt[Ke]/an,Cn[Ke])}else if(rt.isInstancedMesh)ue.renderInstances(le,_e,rt.count);else if(vt.isInstancedBufferGeometry){const Xt=vt._maxInstanceCount!==void 0?vt._maxInstanceCount:1/0,Cn=Math.min(vt.instanceCount,Xt);ue.renderInstances(le,_e,Cn)}else ue.render(le,_e)};function zt(C,st,vt){C.transparent===!0&&C.side===Ie&&C.forceSinglePass===!1?(C.side=He,C.needsUpdate=!0,Us(C,st,vt),C.side=ti,C.needsUpdate=!0,Us(C,st,vt),C.side=Ie):Us(C,st,vt)}this.compile=function(C,st,vt=null){vt===null&&(vt=C),p=It.get(vt),p.init(st),M.push(p),vt.traverseVisible(function(rt){rt.isLight&&rt.layers.test(st.layers)&&(p.pushLight(rt),rt.castShadow&&p.pushShadow(rt))}),C!==vt&&C.traverseVisible(function(rt){rt.isLight&&rt.layers.test(st.layers)&&(p.pushLight(rt),rt.castShadow&&p.pushShadow(rt))}),p.setupLights();const _t=new Set;return C.traverse(function(rt){if(!(rt.isMesh||rt.isPoints||rt.isLine||rt.isSprite))return;const Dt=rt.material;if(Dt)if(Array.isArray(Dt))for(let kt=0;kt<Dt.length;kt++){const Gt=Dt[kt];zt(Gt,vt,rt),_t.add(Gt)}else zt(Dt,vt,rt),_t.add(Dt)}),M.pop(),p=null,_t},this.compileAsync=function(C,st,vt=null){const _t=this.compile(C,st,vt);return new Promise(rt=>{function Dt(){if(_t.forEach(function(kt){tt.get(kt).currentProgram.isReady()&&_t.delete(kt)}),_t.size===0){rt(C);return}setTimeout(Dt,10)}B.get("KHR_parallel_shader_compile")!==null?Dt():setTimeout(Dt,10)})};let ee=null;function ie(C){ee&&ee(C)}function Ce(){_n.stop()}function on(){_n.start()}const _n=new Su;_n.setAnimationLoop(ie),typeof self<"u"&&_n.setContext(self),this.setAnimationLoop=function(C){ee=C,ht.setAnimationLoop(C),C===null?_n.stop():_n.start()},ht.addEventListener("sessionstart",Ce),ht.addEventListener("sessionend",on),this.render=function(C,st){if(st!==void 0&&st.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(X===!0)return;if(C.matrixWorldAutoUpdate===!0&&C.updateMatrixWorld(),st.parent===null&&st.matrixWorldAutoUpdate===!0&&st.updateMatrixWorld(),ht.enabled===!0&&ht.isPresenting===!0&&(ht.cameraAutoUpdate===!0&&ht.updateCamera(st),st=ht.getCamera()),C.isScene===!0&&C.onBeforeRender(_,C,st,D),p=It.get(C,M.length),p.init(st),M.push(p),mt.multiplyMatrices(st.projectionMatrix,st.matrixWorldInverse),K.setFromProjectionMatrix(mt),lt=this.localClippingEnabled,z=gt.init(this.clippingPlanes,lt),m=Mt.get(C,y.length),m.init(),y.push(m),ht.enabled===!0&&ht.isPresenting===!0){const Dt=_.xr.getDepthSensingMesh();Dt!==null&&ii(Dt,st,-1/0,_.sortObjects)}ii(C,st,0,_.sortObjects),m.finish(),_.sortObjects===!0&&m.sort(q,et),xt=ht.enabled===!1||ht.isPresenting===!1||ht.hasDepthSensing()===!1,xt&&Ft.addToRenderList(m,C),this.info.render.frame++,z===!0&&gt.beginShadows();const vt=p.state.shadowsArray;Pt.render(vt,C,st),z===!0&&gt.endShadows(),this.info.autoReset===!0&&this.info.reset();const _t=m.opaque,rt=m.transmissive;if(p.setupLights(),st.isArrayCamera){const Dt=st.cameras;if(rt.length>0)for(let kt=0,Gt=Dt.length;kt<Gt;kt++){const Vt=Dt[kt];sl(_t,rt,C,Vt)}xt&&Ft.render(C);for(let kt=0,Gt=Dt.length;kt<Gt;kt++){const Vt=Dt[kt];rs(m,C,Vt,Vt.viewport)}}else rt.length>0&&sl(_t,rt,C,st),xt&&Ft.render(C),rs(m,C,st);D!==null&&(A.updateMultisampleRenderTarget(D),A.updateRenderTargetMipmap(D)),C.isScene===!0&&C.onAfterRender(_,C,st),wt.resetDefaultState(),E=-1,x=null,M.pop(),M.length>0?(p=M[M.length-1],z===!0&&gt.setGlobalState(_.clippingPlanes,p.state.camera)):p=null,y.pop(),y.length>0?m=y[y.length-1]:m=null};function ii(C,st,vt,_t){if(C.visible===!1)return;if(C.layers.test(st.layers)){if(C.isGroup)vt=C.renderOrder;else if(C.isLOD)C.autoUpdate===!0&&C.update(st);else if(C.isLight)p.pushLight(C),C.castShadow&&p.pushShadow(C);else if(C.isSprite){if(!C.frustumCulled||K.intersectsSprite(C)){_t&&Rt.setFromMatrixPosition(C.matrixWorld).applyMatrix4(mt);const kt=it.update(C),Gt=C.material;Gt.visible&&m.push(C,kt,Gt,vt,Rt.z,null)}}else if((C.isMesh||C.isLine||C.isPoints)&&(!C.frustumCulled||K.intersectsObject(C))){const kt=it.update(C),Gt=C.material;if(_t&&(C.boundingSphere!==void 0?(C.boundingSphere===null&&C.computeBoundingSphere(),Rt.copy(C.boundingSphere.center)):(kt.boundingSphere===null&&kt.computeBoundingSphere(),Rt.copy(kt.boundingSphere.center)),Rt.applyMatrix4(C.matrixWorld).applyMatrix4(mt)),Array.isArray(Gt)){const Vt=kt.groups;for(let Kt=0,$t=Vt.length;Kt<$t;Kt++){const Wt=Vt[Kt],le=Gt[Wt.materialIndex];le&&le.visible&&m.push(C,kt,le,vt,Rt.z,Wt)}}else Gt.visible&&m.push(C,kt,Gt,vt,Rt.z,null)}}const Dt=C.children;for(let kt=0,Gt=Dt.length;kt<Gt;kt++)ii(Dt[kt],st,vt,_t)}function rs(C,st,vt,_t){const rt=C.opaque,Dt=C.transmissive,kt=C.transparent;p.setupLightsView(vt),z===!0&&gt.setGlobalState(_.clippingPlanes,vt),_t&&H.viewport(I.copy(_t)),rt.length>0&&Ds(rt,st,vt),Dt.length>0&&Ds(Dt,st,vt),kt.length>0&&Ds(kt,st,vt),H.buffers.depth.setTest(!0),H.buffers.depth.setMask(!0),H.buffers.color.setMask(!0),H.setPolygonOffset(!1)}function sl(C,st,vt,_t){if((vt.isScene===!0?vt.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[_t.id]===void 0&&(p.state.transmissionRenderTarget[_t.id]=new ei(1,1,{generateMipmaps:!0,type:B.has("EXT_color_buffer_half_float")||B.has("EXT_color_buffer_float")?es:bn,minFilter:Sn,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ae.workingColorSpace}));const Dt=p.state.transmissionRenderTarget[_t.id],kt=_t.viewport||I;Dt.setSize(kt.z,kt.w);const Gt=_.getRenderTarget();_.setRenderTarget(Dt),_.getClearColor(T),U=_.getClearAlpha(),U<1&&_.setClearColor(16777215,.5),_.clear(),xt&&Ft.render(vt);const Vt=_.toneMapping;_.toneMapping=zn;const Kt=_t.viewport;if(_t.viewport!==void 0&&(_t.viewport=void 0),p.setupLightsView(_t),z===!0&&gt.setGlobalState(_.clippingPlanes,_t),Ds(C,vt,_t),A.updateMultisampleRenderTarget(Dt),A.updateRenderTargetMipmap(Dt),B.has("WEBGL_multisampled_render_to_texture")===!1){let $t=!1;for(let Wt=0,le=st.length;Wt<le;Wt++){const me=st[Wt],_e=me.object,Ve=me.geometry,ue=me.material,Xt=me.group;if(ue.side===Ie&&_e.layers.test(_t.layers)){const Cn=ue.side;ue.side=He,ue.needsUpdate=!0,rl(_e,vt,_t,Ve,ue,Xt),ue.side=Cn,ue.needsUpdate=!0,$t=!0}}$t===!0&&(A.updateMultisampleRenderTarget(Dt),A.updateRenderTargetMipmap(Dt))}_.setRenderTarget(Gt),_.setClearColor(T,U),Kt!==void 0&&(_t.viewport=Kt),_.toneMapping=Vt}function Ds(C,st,vt){const _t=st.isScene===!0?st.overrideMaterial:null;for(let rt=0,Dt=C.length;rt<Dt;rt++){const kt=C[rt],Gt=kt.object,Vt=kt.geometry,Kt=_t===null?kt.material:_t,$t=kt.group;Gt.layers.test(vt.layers)&&rl(Gt,st,vt,Vt,Kt,$t)}}function rl(C,st,vt,_t,rt,Dt){C.onBeforeRender(_,st,vt,_t,rt,Dt),C.modelViewMatrix.multiplyMatrices(vt.matrixWorldInverse,C.matrixWorld),C.normalMatrix.getNormalMatrix(C.modelViewMatrix),rt.onBeforeRender(_,st,vt,_t,C,Dt),rt.transparent===!0&&rt.side===Ie&&rt.forceSinglePass===!1?(rt.side=He,rt.needsUpdate=!0,_.renderBufferDirect(vt,st,_t,rt,C,Dt),rt.side=ti,rt.needsUpdate=!0,_.renderBufferDirect(vt,st,_t,rt,C,Dt),rt.side=Ie):_.renderBufferDirect(vt,st,_t,rt,C,Dt),C.onAfterRender(_,st,vt,_t,rt,Dt)}function Us(C,st,vt){st.isScene!==!0&&(st=Ht);const _t=tt.get(C),rt=p.state.lights,Dt=p.state.shadowsArray,kt=rt.state.version,Gt=St.getParameters(C,rt.state,Dt,st,vt),Vt=St.getProgramCacheKey(Gt);let Kt=_t.programs;_t.environment=C.isMeshStandardMaterial?st.environment:null,_t.fog=st.fog,_t.envMap=(C.isMeshStandardMaterial?ot:w).get(C.envMap||_t.environment),_t.envMapRotation=_t.environment!==null&&C.envMap===null?st.environmentRotation:C.envMapRotation,Kt===void 0&&(C.addEventListener("dispose",Ot),Kt=new Map,_t.programs=Kt);let $t=Kt.get(Vt);if($t!==void 0){if(_t.currentProgram===$t&&_t.lightsStateVersion===kt)return al(C,Gt),$t}else Gt.uniforms=St.getUniforms(C),C.onBeforeCompile(Gt,_),$t=St.acquireProgram(Gt,Vt),Kt.set(Vt,$t),_t.uniforms=Gt.uniforms;const Wt=_t.uniforms;return(!C.isShaderMaterial&&!C.isRawShaderMaterial||C.clipping===!0)&&(Wt.clippingPlanes=gt.uniform),al(C,Gt),_t.needsLights=Ju(C),_t.lightsStateVersion=kt,_t.needsLights&&(Wt.ambientLightColor.value=rt.state.ambient,Wt.lightProbe.value=rt.state.probe,Wt.directionalLights.value=rt.state.directional,Wt.directionalLightShadows.value=rt.state.directionalShadow,Wt.spotLights.value=rt.state.spot,Wt.spotLightShadows.value=rt.state.spotShadow,Wt.rectAreaLights.value=rt.state.rectArea,Wt.ltc_1.value=rt.state.rectAreaLTC1,Wt.ltc_2.value=rt.state.rectAreaLTC2,Wt.pointLights.value=rt.state.point,Wt.pointLightShadows.value=rt.state.pointShadow,Wt.hemisphereLights.value=rt.state.hemi,Wt.directionalShadowMap.value=rt.state.directionalShadowMap,Wt.directionalShadowMatrix.value=rt.state.directionalShadowMatrix,Wt.spotShadowMap.value=rt.state.spotShadowMap,Wt.spotLightMatrix.value=rt.state.spotLightMatrix,Wt.spotLightMap.value=rt.state.spotLightMap,Wt.pointShadowMap.value=rt.state.pointShadowMap,Wt.pointShadowMatrix.value=rt.state.pointShadowMatrix),_t.currentProgram=$t,_t.uniformsList=null,$t}function ol(C){if(C.uniformsList===null){const st=C.currentProgram.getUniforms();C.uniformsList=xr.seqWithValue(st.seq,C.uniforms)}return C.uniformsList}function al(C,st){const vt=tt.get(C);vt.outputColorSpace=st.outputColorSpace,vt.batching=st.batching,vt.batchingColor=st.batchingColor,vt.instancing=st.instancing,vt.instancingColor=st.instancingColor,vt.instancingMorph=st.instancingMorph,vt.skinning=st.skinning,vt.morphTargets=st.morphTargets,vt.morphNormals=st.morphNormals,vt.morphColors=st.morphColors,vt.morphTargetsCount=st.morphTargetsCount,vt.numClippingPlanes=st.numClippingPlanes,vt.numIntersection=st.numClipIntersection,vt.vertexAlphas=st.vertexAlphas,vt.vertexTangents=st.vertexTangents,vt.toneMapping=st.toneMapping}function Zu(C,st,vt,_t,rt){st.isScene!==!0&&(st=Ht),A.resetTextureUnits();const Dt=st.fog,kt=_t.isMeshStandardMaterial?st.environment:null,Gt=D===null?_.outputColorSpace:D.isXRRenderTarget===!0?D.texture.colorSpace:ns,Vt=(_t.isMeshStandardMaterial?ot:w).get(_t.envMap||kt),Kt=_t.vertexColors===!0&&!!vt.attributes.color&&vt.attributes.color.itemSize===4,$t=!!vt.attributes.tangent&&(!!_t.normalMap||_t.anisotropy>0),Wt=!!vt.morphAttributes.position,le=!!vt.morphAttributes.normal,me=!!vt.morphAttributes.color;let _e=zn;_t.toneMapped&&(D===null||D.isXRRenderTarget===!0)&&(_e=_.toneMapping);const Ve=vt.morphAttributes.position||vt.morphAttributes.normal||vt.morphAttributes.color,ue=Ve!==void 0?Ve.length:0,Xt=tt.get(_t),Cn=p.state.lights;if(z===!0&&(lt===!0||C!==x)){const en=C===x&&_t.id===E;gt.setState(_t,C,en)}let he=!1;_t.version===Xt.__version?(Xt.needsLights&&Xt.lightsStateVersion!==Cn.state.version||Xt.outputColorSpace!==Gt||rt.isBatchedMesh&&Xt.batching===!1||!rt.isBatchedMesh&&Xt.batching===!0||rt.isBatchedMesh&&Xt.batchingColor===!0&&rt.colorTexture===null||rt.isBatchedMesh&&Xt.batchingColor===!1&&rt.colorTexture!==null||rt.isInstancedMesh&&Xt.instancing===!1||!rt.isInstancedMesh&&Xt.instancing===!0||rt.isSkinnedMesh&&Xt.skinning===!1||!rt.isSkinnedMesh&&Xt.skinning===!0||rt.isInstancedMesh&&Xt.instancingColor===!0&&rt.instanceColor===null||rt.isInstancedMesh&&Xt.instancingColor===!1&&rt.instanceColor!==null||rt.isInstancedMesh&&Xt.instancingMorph===!0&&rt.morphTexture===null||rt.isInstancedMesh&&Xt.instancingMorph===!1&&rt.morphTexture!==null||Xt.envMap!==Vt||_t.fog===!0&&Xt.fog!==Dt||Xt.numClippingPlanes!==void 0&&(Xt.numClippingPlanes!==gt.numPlanes||Xt.numIntersection!==gt.numIntersection)||Xt.vertexAlphas!==Kt||Xt.vertexTangents!==$t||Xt.morphTargets!==Wt||Xt.morphNormals!==le||Xt.morphColors!==me||Xt.toneMapping!==_e||Xt.morphTargetsCount!==ue)&&(he=!0):(he=!0,Xt.__version=_t.version);let an=Xt.currentProgram;he===!0&&(an=Us(_t,st,rt));let Si=!1,Ke=!1,os=!1;const xe=an.getUniforms(),xn=Xt.uniforms;if(H.useProgram(an.program)&&(Si=!0,Ke=!0,os=!0),_t.id!==E&&(E=_t.id,Ke=!0),Si||x!==C){H.buffers.depth.getReversed()?(j.copy(C.projectionMatrix),Vh(j),Wh(j),xe.setValue(N,"projectionMatrix",j)):xe.setValue(N,"projectionMatrix",C.projectionMatrix),xe.setValue(N,"viewMatrix",C.matrixWorldInverse);const Gn=xe.map.cameraPosition;Gn!==void 0&&Gn.setValue(N,At.setFromMatrixPosition(C.matrixWorld)),Z.logarithmicDepthBuffer&&xe.setValue(N,"logDepthBufFC",2/(Math.log(C.far+1)/Math.LN2)),(_t.isMeshPhongMaterial||_t.isMeshToonMaterial||_t.isMeshLambertMaterial||_t.isMeshBasicMaterial||_t.isMeshStandardMaterial||_t.isShaderMaterial)&&xe.setValue(N,"isOrthographic",C.isOrthographicCamera===!0),x!==C&&(x=C,Ke=!0,os=!0)}if(rt.isSkinnedMesh){xe.setOptional(N,rt,"bindMatrix"),xe.setOptional(N,rt,"bindMatrixInverse");const en=rt.skeleton;en&&(en.boneTexture===null&&en.computeBoneTexture(),xe.setValue(N,"boneTexture",en.boneTexture,A))}rt.isBatchedMesh&&(xe.setOptional(N,rt,"batchingTexture"),xe.setValue(N,"batchingTexture",rt._matricesTexture,A),xe.setOptional(N,rt,"batchingIdTexture"),xe.setValue(N,"batchingIdTexture",rt._indirectTexture,A),xe.setOptional(N,rt,"batchingColorTexture"),rt._colorsTexture!==null&&xe.setValue(N,"batchingColorTexture",rt._colorsTexture,A));const as=vt.morphAttributes;if((as.position!==void 0||as.normal!==void 0||as.color!==void 0)&&W.update(rt,vt,an),(Ke||Xt.receiveShadow!==rt.receiveShadow)&&(Xt.receiveShadow=rt.receiveShadow,xe.setValue(N,"receiveShadow",rt.receiveShadow)),_t.isMeshGouraudMaterial&&_t.envMap!==null&&(xn.envMap.value=Vt,xn.flipEnvMap.value=Vt.isCubeTexture&&Vt.isRenderTargetTexture===!1?-1:1),_t.isMeshStandardMaterial&&_t.envMap===null&&st.environment!==null&&(xn.envMapIntensity.value=st.environmentIntensity),Ke&&(xe.setValue(N,"toneMappingExposure",_.toneMappingExposure),Xt.needsLights&&Ku(xn,os),Dt&&_t.fog===!0&&ft.refreshFogUniforms(xn,Dt),ft.refreshMaterialUniforms(xn,_t,P,b,p.state.transmissionRenderTarget[C.id]),xr.upload(N,ol(Xt),xn,A)),_t.isShaderMaterial&&_t.uniformsNeedUpdate===!0&&(xr.upload(N,ol(Xt),xn,A),_t.uniformsNeedUpdate=!1),_t.isSpriteMaterial&&xe.setValue(N,"center",rt.center),xe.setValue(N,"modelViewMatrix",rt.modelViewMatrix),xe.setValue(N,"normalMatrix",rt.normalMatrix),xe.setValue(N,"modelMatrix",rt.matrixWorld),_t.isShaderMaterial||_t.isRawShaderMaterial){const en=_t.uniformsGroups;for(let Gn=0,Vn=en.length;Gn<Vn;Gn++){const ll=en[Gn];F.update(ll,an),F.bind(ll,an)}}return an}function Ku(C,st){C.ambientLightColor.needsUpdate=st,C.lightProbe.needsUpdate=st,C.directionalLights.needsUpdate=st,C.directionalLightShadows.needsUpdate=st,C.pointLights.needsUpdate=st,C.pointLightShadows.needsUpdate=st,C.spotLights.needsUpdate=st,C.spotLightShadows.needsUpdate=st,C.rectAreaLights.needsUpdate=st,C.hemisphereLights.needsUpdate=st}function Ju(C){return C.isMeshLambertMaterial||C.isMeshToonMaterial||C.isMeshPhongMaterial||C.isMeshStandardMaterial||C.isShadowMaterial||C.isShaderMaterial&&C.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return L},this.getRenderTarget=function(){return D},this.setRenderTargetTextures=function(C,st,vt){tt.get(C.texture).__webglTexture=st,tt.get(C.depthTexture).__webglTexture=vt;const _t=tt.get(C);_t.__hasExternalTextures=!0,_t.__autoAllocateDepthBuffer=vt===void 0,_t.__autoAllocateDepthBuffer||B.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),_t.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(C,st){const vt=tt.get(C);vt.__webglFramebuffer=st,vt.__useDefaultFramebuffer=st===void 0},this.setRenderTarget=function(C,st=0,vt=0){D=C,R=st,L=vt;let _t=!0,rt=null,Dt=!1,kt=!1;if(C){const Vt=tt.get(C);if(Vt.__useDefaultFramebuffer!==void 0)H.bindFramebuffer(N.FRAMEBUFFER,null),_t=!1;else if(Vt.__webglFramebuffer===void 0)A.setupRenderTarget(C);else if(Vt.__hasExternalTextures)A.rebindTextures(C,tt.get(C.texture).__webglTexture,tt.get(C.depthTexture).__webglTexture);else if(C.depthBuffer){const Wt=C.depthTexture;if(Vt.__boundDepthTexture!==Wt){if(Wt!==null&&tt.has(Wt)&&(C.width!==Wt.image.width||C.height!==Wt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");A.setupDepthRenderbuffer(C)}}const Kt=C.texture;(Kt.isData3DTexture||Kt.isDataArrayTexture||Kt.isCompressedArrayTexture)&&(kt=!0);const $t=tt.get(C).__webglFramebuffer;C.isWebGLCubeRenderTarget?(Array.isArray($t[st])?rt=$t[st][vt]:rt=$t[st],Dt=!0):C.samples>0&&A.useMultisampledRTT(C)===!1?rt=tt.get(C).__webglMultisampledFramebuffer:Array.isArray($t)?rt=$t[vt]:rt=$t,I.copy(C.viewport),G.copy(C.scissor),V=C.scissorTest}else I.copy($).multiplyScalar(P).floor(),G.copy(pt).multiplyScalar(P).floor(),V=Y;if(H.bindFramebuffer(N.FRAMEBUFFER,rt)&&_t&&H.drawBuffers(C,rt),H.viewport(I),H.scissor(G),H.setScissorTest(V),Dt){const Vt=tt.get(C.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+st,Vt.__webglTexture,vt)}else if(kt){const Vt=tt.get(C.texture),Kt=st||0;N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,Vt.__webglTexture,vt||0,Kt)}E=-1},this.readRenderTargetPixels=function(C,st,vt,_t,rt,Dt,kt){if(!(C&&C.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Gt=tt.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&kt!==void 0&&(Gt=Gt[kt]),Gt){H.bindFramebuffer(N.FRAMEBUFFER,Gt);try{const Vt=C.texture,Kt=Vt.format,$t=Vt.type;if(!Z.textureFormatReadable(Kt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Z.textureTypeReadable($t)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}st>=0&&st<=C.width-_t&&vt>=0&&vt<=C.height-rt&&N.readPixels(st,vt,_t,rt,at.convert(Kt),at.convert($t),Dt)}finally{const Vt=D!==null?tt.get(D).__webglFramebuffer:null;H.bindFramebuffer(N.FRAMEBUFFER,Vt)}}},this.readRenderTargetPixelsAsync=async function(C,st,vt,_t,rt,Dt,kt){if(!(C&&C.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Gt=tt.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&kt!==void 0&&(Gt=Gt[kt]),Gt){const Vt=C.texture,Kt=Vt.format,$t=Vt.type;if(!Z.textureFormatReadable(Kt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Z.textureTypeReadable($t))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(st>=0&&st<=C.width-_t&&vt>=0&&vt<=C.height-rt){H.bindFramebuffer(N.FRAMEBUFFER,Gt);const Wt=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,Wt),N.bufferData(N.PIXEL_PACK_BUFFER,Dt.byteLength,N.STREAM_READ),N.readPixels(st,vt,_t,rt,at.convert(Kt),at.convert($t),0);const le=D!==null?tt.get(D).__webglFramebuffer:null;H.bindFramebuffer(N.FRAMEBUFFER,le);const me=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await Gh(N,me,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,Wt),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,Dt),N.deleteBuffer(Wt),N.deleteSync(me),Dt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(C,st=null,vt=0){C.isTexture!==!0&&(xs("WebGLRenderer: copyFramebufferToTexture function signature has changed."),st=arguments[0]||null,C=arguments[1]);const _t=Math.pow(2,-vt),rt=Math.floor(C.image.width*_t),Dt=Math.floor(C.image.height*_t),kt=st!==null?st.x:0,Gt=st!==null?st.y:0;A.setTexture2D(C,0),N.copyTexSubImage2D(N.TEXTURE_2D,vt,0,0,kt,Gt,rt,Dt),H.unbindTexture()},this.copyTextureToTexture=function(C,st,vt=null,_t=null,rt=0){C.isTexture!==!0&&(xs("WebGLRenderer: copyTextureToTexture function signature has changed."),_t=arguments[0]||null,C=arguments[1],st=arguments[2],rt=arguments[3]||0,vt=null);let Dt,kt,Gt,Vt,Kt,$t,Wt,le,me;const _e=C.isCompressedTexture?C.mipmaps[rt]:C.image;vt!==null?(Dt=vt.max.x-vt.min.x,kt=vt.max.y-vt.min.y,Gt=vt.isBox3?vt.max.z-vt.min.z:1,Vt=vt.min.x,Kt=vt.min.y,$t=vt.isBox3?vt.min.z:0):(Dt=_e.width,kt=_e.height,Gt=_e.depth||1,Vt=0,Kt=0,$t=0),_t!==null?(Wt=_t.x,le=_t.y,me=_t.z):(Wt=0,le=0,me=0);const Ve=at.convert(st.format),ue=at.convert(st.type);let Xt;st.isData3DTexture?(A.setTexture3D(st,0),Xt=N.TEXTURE_3D):st.isDataArrayTexture||st.isCompressedArrayTexture?(A.setTexture2DArray(st,0),Xt=N.TEXTURE_2D_ARRAY):(A.setTexture2D(st,0),Xt=N.TEXTURE_2D),N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,st.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,st.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,st.unpackAlignment);const Cn=N.getParameter(N.UNPACK_ROW_LENGTH),he=N.getParameter(N.UNPACK_IMAGE_HEIGHT),an=N.getParameter(N.UNPACK_SKIP_PIXELS),Si=N.getParameter(N.UNPACK_SKIP_ROWS),Ke=N.getParameter(N.UNPACK_SKIP_IMAGES);N.pixelStorei(N.UNPACK_ROW_LENGTH,_e.width),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,_e.height),N.pixelStorei(N.UNPACK_SKIP_PIXELS,Vt),N.pixelStorei(N.UNPACK_SKIP_ROWS,Kt),N.pixelStorei(N.UNPACK_SKIP_IMAGES,$t);const os=C.isDataArrayTexture||C.isData3DTexture,xe=st.isDataArrayTexture||st.isData3DTexture;if(C.isRenderTargetTexture||C.isDepthTexture){const xn=tt.get(C),as=tt.get(st),en=tt.get(xn.__renderTarget),Gn=tt.get(as.__renderTarget);H.bindFramebuffer(N.READ_FRAMEBUFFER,en.__webglFramebuffer),H.bindFramebuffer(N.DRAW_FRAMEBUFFER,Gn.__webglFramebuffer);for(let Vn=0;Vn<Gt;Vn++)os&&N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,tt.get(C).__webglTexture,rt,$t+Vn),C.isDepthTexture?(xe&&N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,tt.get(st).__webglTexture,rt,me+Vn),N.blitFramebuffer(Vt,Kt,Dt,kt,Wt,le,Dt,kt,N.DEPTH_BUFFER_BIT,N.NEAREST)):xe?N.copyTexSubImage3D(Xt,rt,Wt,le,me+Vn,Vt,Kt,Dt,kt):N.copyTexSubImage2D(Xt,rt,Wt,le,me+Vn,Vt,Kt,Dt,kt);H.bindFramebuffer(N.READ_FRAMEBUFFER,null),H.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else xe?C.isDataTexture||C.isData3DTexture?N.texSubImage3D(Xt,rt,Wt,le,me,Dt,kt,Gt,Ve,ue,_e.data):st.isCompressedArrayTexture?N.compressedTexSubImage3D(Xt,rt,Wt,le,me,Dt,kt,Gt,Ve,_e.data):N.texSubImage3D(Xt,rt,Wt,le,me,Dt,kt,Gt,Ve,ue,_e):C.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,rt,Wt,le,Dt,kt,Ve,ue,_e.data):C.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,rt,Wt,le,_e.width,_e.height,Ve,_e.data):N.texSubImage2D(N.TEXTURE_2D,rt,Wt,le,Dt,kt,Ve,ue,_e);N.pixelStorei(N.UNPACK_ROW_LENGTH,Cn),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,he),N.pixelStorei(N.UNPACK_SKIP_PIXELS,an),N.pixelStorei(N.UNPACK_SKIP_ROWS,Si),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Ke),rt===0&&st.generateMipmaps&&N.generateMipmap(Xt),H.unbindTexture()},this.copyTextureToTexture3D=function(C,st,vt=null,_t=null,rt=0){return C.isTexture!==!0&&(xs("WebGLRenderer: copyTextureToTexture3D function signature has changed."),vt=arguments[0]||null,_t=arguments[1]||null,C=arguments[2],st=arguments[3],rt=arguments[4]||0),xs('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(C,st,vt,_t,rt)},this.initRenderTarget=function(C){tt.get(C).__webglFramebuffer===void 0&&A.setupRenderTarget(C)},this.initTexture=function(C){C.isCubeTexture?A.setTextureCube(C,0):C.isData3DTexture?A.setTexture3D(C,0):C.isDataArrayTexture||C.isCompressedArrayTexture?A.setTexture2DArray(C,0):A.setTexture2D(C,0),H.unbindTexture()},this.resetState=function(){R=0,L=0,D=null,H.reset(),wt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return On}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorspace=ae._getDrawingBufferColorSpace(t),e.unpackColorSpace=ae._getUnpackColorSpace()}}class Ga{constructor(t,e=25e-5){this.isFogExp2=!0,this.name="",this.color=new ut(t),this.density=e}clone(){return new Ga(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class Va extends Jt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new En,this.environmentIntensity=1,this.environmentRotation=new En,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}const oc=new O,ac=new ce,lc=new ce,eg=new O,cc=new Qt,nr=new O,vo=new Tn,uc=new Qt,_o=new Ir;class hc extends Yt{constructor(t,e){super(t,e),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=fl,this.bindMatrix=new Qt,this.bindMatrixInverse=new Qt,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const t=this.geometry;this.boundingBox===null&&(this.boundingBox=new ni),this.boundingBox.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,nr),this.boundingBox.expandByPoint(nr)}computeBoundingSphere(){const t=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Tn),this.boundingSphere.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,nr),this.boundingSphere.expandByPoint(nr)}copy(t,e){return super.copy(t,e),this.bindMode=t.bindMode,this.bindMatrix.copy(t.bindMatrix),this.bindMatrixInverse.copy(t.bindMatrixInverse),this.skeleton=t.skeleton,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}raycast(t,e){const n=this.material,s=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),vo.copy(this.boundingSphere),vo.applyMatrix4(s),t.ray.intersectsSphere(vo)!==!1&&(uc.copy(s).invert(),_o.copy(t.ray).applyMatrix4(uc),!(this.boundingBox!==null&&_o.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(t,e,_o)))}getVertexPosition(t,e){return super.getVertexPosition(t,e),this.applyBoneTransform(t,e),e}bind(t,e){this.skeleton=t,e===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),e=this.matrixWorld),this.bindMatrix.copy(e),this.bindMatrixInverse.copy(e).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const t=new ce,e=this.geometry.attributes.skinWeight;for(let n=0,s=e.count;n<s;n++){t.fromBufferAttribute(e,n);const r=1/t.manhattanLength();r!==1/0?t.multiplyScalar(r):t.set(1,0,0,0),e.setXYZW(n,t.x,t.y,t.z,t.w)}}updateMatrixWorld(t){super.updateMatrixWorld(t),this.bindMode===fl?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Ch?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(t,e){const n=this.skeleton,s=this.geometry;ac.fromBufferAttribute(s.attributes.skinIndex,t),lc.fromBufferAttribute(s.attributes.skinWeight,t),oc.copy(e).applyMatrix4(this.bindMatrix),e.set(0,0,0);for(let r=0;r<4;r++){const o=lc.getComponent(r);if(o!==0){const a=ac.getComponent(r);cc.multiplyMatrices(n.bones[a].matrixWorld,n.boneInverses[a]),e.addScaledVector(eg.copy(oc).applyMatrix4(cc),o)}}return e.applyMatrix4(this.bindMatrixInverse)}}class ng extends Jt{constructor(){super(),this.isBone=!0,this.type="Bone"}}class Wa extends ke{constructor(t=null,e=1,n=1,s,r,o,a,l,c=tn,u=tn,h,d){super(null,o,a,l,c,u,s,r,h,d),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const fc=new Qt,ig=new Qt;class Xa{constructor(t=[],e=[]){this.uuid=xi(),this.bones=t.slice(0),this.boneInverses=e,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const t=this.bones,e=this.boneInverses;if(this.boneMatrices=new Float32Array(t.length*16),e.length===0)this.calculateInverses();else if(t.length!==e.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,s=this.bones.length;n<s;n++)this.boneInverses.push(new Qt)}}calculateInverses(){this.boneInverses.length=0;for(let t=0,e=this.bones.length;t<e;t++){const n=new Qt;this.bones[t]&&n.copy(this.bones[t].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&n.matrixWorld.copy(this.boneInverses[t]).invert()}for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const t=this.bones,e=this.boneInverses,n=this.boneMatrices,s=this.boneTexture;for(let r=0,o=t.length;r<o;r++){const a=t[r]?t[r].matrixWorld:ig;fc.multiplyMatrices(a,e[r]),fc.toArray(n,r*16)}s!==null&&(s.needsUpdate=!0)}clone(){return new Xa(this.bones,this.boneInverses)}computeBoneTexture(){let t=Math.sqrt(this.bones.length*4);t=Math.ceil(t/4)*4,t=Math.max(t,4);const e=new Float32Array(t*t*4);e.set(this.boneMatrices);const n=new Wa(e,t,t,qe,mn);return n.needsUpdate=!0,this.boneMatrices=e,this.boneTexture=n,this}getBoneByName(t){for(let e=0,n=this.bones.length;e<n;e++){const s=this.bones[e];if(s.name===t)return s}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(t,e){this.uuid=t.uuid;for(let n=0,s=t.bones.length;n<s;n++){const r=t.bones[n];let o=e[r];o===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",r),o=new ng),this.bones.push(o),this.boneInverses.push(new Qt().fromArray(t.boneInverses[n]))}return this.init(),this}toJSON(){const t={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};t.uuid=this.uuid;const e=this.bones,n=this.boneInverses;for(let s=0,r=e.length;s<r;s++){const o=e[s];t.bones.push(o.uuid);const a=n[s];t.boneInverses.push(a.toArray())}return t}}class Ma extends Se{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const Oi=new Qt,dc=new Qt,ir=[],pc=new ni,sg=new Qt,ds=new Yt,ps=new Tn;class sn extends Yt{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Ma(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,sg)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new ni),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Oi),pc.copy(t.boundingBox).applyMatrix4(Oi),this.boundingBox.union(pc)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Tn),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Oi),ps.copy(t.boundingSphere).applyMatrix4(Oi),this.boundingSphere.union(ps)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=t*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(t,e){const n=this.matrixWorld,s=this.count;if(ds.geometry=this.geometry,ds.material=this.material,ds.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ps.copy(this.boundingSphere),ps.applyMatrix4(n),t.ray.intersectsSphere(ps)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Oi),dc.multiplyMatrices(n,Oi),ds.matrixWorld=dc,ds.raycast(t,ir);for(let o=0,a=ir.length;o<a;o++){const l=ir[o];l.instanceId=r,l.object=this,e.push(l)}ir.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new Ma(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new Wa(new Float32Array(s*this.count),s,this.count,Na,mn));const r=this.morphTexture.source.data.data;let o=0;for(let c=0;c<n.length;c++)o+=n[c];const a=this.geometry.morphTargetsRelative?1:1-o,l=s*t;r[l]=a,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class Cu extends Mi{static get type(){return"LineBasicMaterial"}constructor(t){super(),this.isLineBasicMaterial=!0,this.color=new ut(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const wr=new O,br=new O,mc=new Qt,ms=new Ir,sr=new Tn,xo=new O,gc=new O;class rg extends Jt{constructor(t=new ye,e=new Cu){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)wr.fromBufferAttribute(e,s-1),br.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=wr.distanceTo(br);t.setAttribute("lineDistance",new Zt(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),sr.copy(n.boundingSphere),sr.applyMatrix4(s),sr.radius+=r,t.ray.intersectsSphere(sr)===!1)return;mc.copy(s).invert(),ms.copy(t.ray).applyMatrix4(mc);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,u=n.index,d=n.attributes.position;if(u!==null){const f=Math.max(0,o.start),g=Math.min(u.count,o.start+o.count);for(let v=f,m=g-1;v<m;v+=c){const p=u.getX(v),y=u.getX(v+1),M=rr(this,t,ms,l,p,y);M&&e.push(M)}if(this.isLineLoop){const v=u.getX(g-1),m=u.getX(f),p=rr(this,t,ms,l,v,m);p&&e.push(p)}}else{const f=Math.max(0,o.start),g=Math.min(d.count,o.start+o.count);for(let v=f,m=g-1;v<m;v+=c){const p=rr(this,t,ms,l,v,v+1);p&&e.push(p)}if(this.isLineLoop){const v=rr(this,t,ms,l,g-1,f);v&&e.push(v)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function rr(i,t,e,n,s,r){const o=i.geometry.attributes.position;if(wr.fromBufferAttribute(o,s),br.fromBufferAttribute(o,r),e.distanceSqToSegment(wr,br,xo,gc)>n)return;xo.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(xo);if(!(l<t.near||l>t.far))return{distance:l,point:gc.clone().applyMatrix4(i.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:i}}const vc=new O,_c=new O;class og extends rg{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let s=0,r=e.count;s<r;s+=2)vc.fromBufferAttribute(e,s),_c.fromBufferAttribute(e,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+vc.distanceTo(_c);t.setAttribute("lineDistance",new Zt(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class ag extends Mi{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new ut(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const xc=new Qt,ya=new Ir,or=new Tn,ar=new O;class lg extends Jt{constructor(t=new ye,e=new ag){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),or.copy(n.boundingSphere),or.applyMatrix4(s),or.radius+=r,t.ray.intersectsSphere(or)===!1)return;xc.copy(s).invert(),ya.copy(t.ray).applyMatrix4(xc);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,h=n.attributes.position;if(c!==null){const d=Math.max(0,o.start),f=Math.min(c.count,o.start+o.count);for(let g=d,v=f;g<v;g++){const m=c.getX(g);ar.fromBufferAttribute(h,m),Mc(ar,m,l,s,t,e,this)}}else{const d=Math.max(0,o.start),f=Math.min(h.count,o.start+o.count);for(let g=d,v=f;g<v;g++)ar.fromBufferAttribute(h,g),Mc(ar,g,l,s,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function Mc(i,t,e,n,s,r,o){const a=ya.distanceSqToPoint(i);if(a<e){const l=new O;ya.closestPointToPoint(i,l),l.applyMatrix4(n);const c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}class Ru extends ke{constructor(t,e,n,s,r,o,a,l,c){super(t,e,n,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class An{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,s=this.getPoint(0),r=0;e.push(0);for(let o=1;o<=t;o++)n=this.getPoint(o/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const n=this.getLengths();let s=0;const r=n.length;let o;e?o=e:o=t*n[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=n[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===o)return s/(r-1);const u=n[s],d=n[s+1]-u,f=(o-u)/d;return(s+f)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);const o=this.getPoint(s),a=this.getPoint(r),l=e||(o.isVector2?new Tt:new O);return l.copy(a).sub(o).normalize(),l}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){const n=new O,s=[],r=[],o=[],a=new O,l=new Qt;for(let f=0;f<=t;f++){const g=f/t;s[f]=this.getTangentAt(g,new O)}r[0]=new O,o[0]=new O;let c=Number.MAX_VALUE;const u=Math.abs(s[0].x),h=Math.abs(s[0].y),d=Math.abs(s[0].z);u<=c&&(c=u,n.set(1,0,0)),h<=c&&(c=h,n.set(0,1,0)),d<=c&&n.set(0,0,1),a.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let f=1;f<=t;f++){if(r[f]=r[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(s[f-1],s[f]),a.length()>Number.EPSILON){a.normalize();const g=Math.acos(Pe(s[f-1].dot(s[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(a,g))}o[f].crossVectors(s[f],r[f])}if(e===!0){let f=Math.acos(Pe(r[0].dot(r[t]),-1,1));f/=t,s[0].dot(a.crossVectors(r[0],r[t]))>0&&(f=-f);for(let g=1;g<=t;g++)r[g].applyMatrix4(l.makeRotationAxis(s[g],f*g)),o[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class Ya extends An{constructor(t=0,e=0,n=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(t,e=new Tt){const n=e,s=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);const a=this.aStartAngle+t*r;let l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){const u=Math.cos(this.aRotation),h=Math.sin(this.aRotation),d=l-this.aX,f=c-this.aY;l=d*u-f*h+this.aX,c=d*h+f*u+this.aY}return n.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class cg extends Ya{constructor(t,e,n,s,r,o){super(t,e,n,n,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}}function qa(){let i=0,t=0,e=0,n=0;function s(r,o,a,l){i=r,t=a,e=-3*r+3*o-2*a-l,n=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,u,h){let d=(o-r)/c-(a-r)/(c+u)+(a-o)/u,f=(a-o)/u-(l-o)/(u+h)+(l-a)/h;d*=u,f*=u,s(o,a,d,f)},calc:function(r){const o=r*r,a=o*r;return i+t*r+e*o+n*a}}}const lr=new O,Mo=new qa,yo=new qa,So=new qa;class Pu extends An{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new O){const n=e,s=this.points,r=s.length,o=(r-(this.closed?0:1))*t;let a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,u;this.closed||a>0?c=s[(a-1)%r]:(lr.subVectors(s[0],s[1]).add(s[0]),c=lr);const h=s[a%r],d=s[(a+1)%r];if(this.closed||a+2<r?u=s[(a+2)%r]:(lr.subVectors(s[r-1],s[r-2]).add(s[r-1]),u=lr),this.curveType==="centripetal"||this.curveType==="chordal"){const f=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(h),f),v=Math.pow(h.distanceToSquared(d),f),m=Math.pow(d.distanceToSquared(u),f);v<1e-4&&(v=1),g<1e-4&&(g=v),m<1e-4&&(m=v),Mo.initNonuniformCatmullRom(c.x,h.x,d.x,u.x,g,v,m),yo.initNonuniformCatmullRom(c.y,h.y,d.y,u.y,g,v,m),So.initNonuniformCatmullRom(c.z,h.z,d.z,u.z,g,v,m)}else this.curveType==="catmullrom"&&(Mo.initCatmullRom(c.x,h.x,d.x,u.x,this.tension),yo.initCatmullRom(c.y,h.y,d.y,u.y,this.tension),So.initCatmullRom(c.z,h.z,d.z,u.z,this.tension));return n.set(Mo.calc(l),yo.calc(l),So.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new O().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function yc(i,t,e,n,s){const r=(n-t)*.5,o=(s-e)*.5,a=i*i,l=i*a;return(2*e-2*n+r+o)*l+(-3*e+3*n-2*r-o)*a+r*i+e}function ug(i,t){const e=1-i;return e*e*t}function hg(i,t){return 2*(1-i)*i*t}function fg(i,t){return i*i*t}function Ss(i,t,e,n){return ug(i,t)+hg(i,e)+fg(i,n)}function dg(i,t){const e=1-i;return e*e*e*t}function pg(i,t){const e=1-i;return 3*e*e*i*t}function mg(i,t){return 3*(1-i)*i*i*t}function gg(i,t){return i*i*i*t}function ws(i,t,e,n,s){return dg(i,t)+pg(i,e)+mg(i,n)+gg(i,s)}class Iu extends An{constructor(t=new Tt,e=new Tt,n=new Tt,s=new Tt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new Tt){const n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(ws(t,s.x,r.x,o.x,a.x),ws(t,s.y,r.y,o.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class vg extends An{constructor(t=new O,e=new O,n=new O,s=new O){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new O){const n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(ws(t,s.x,r.x,o.x,a.x),ws(t,s.y,r.y,o.y,a.y),ws(t,s.z,r.z,o.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Lu extends An{constructor(t=new Tt,e=new Tt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new Tt){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new Tt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class _g extends An{constructor(t=new O,e=new O){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new O){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new O){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Du extends An{constructor(t=new Tt,e=new Tt,n=new Tt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new Tt){const n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(Ss(t,s.x,r.x,o.x),Ss(t,s.y,r.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Uu extends An{constructor(t=new O,e=new O,n=new O){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new O){const n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(Ss(t,s.x,r.x,o.x),Ss(t,s.y,r.y,o.y),Ss(t,s.z,r.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Nu extends An{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new Tt){const n=e,s=this.points,r=(s.length-1)*t,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],u=s[o>s.length-2?s.length-1:o+1],h=s[o>s.length-3?s.length-1:o+2];return n.set(yc(a,l.x,c.x,u.x,h.x),yc(a,l.y,c.y,u.y,h.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new Tt().fromArray(s))}return this}}var Er=Object.freeze({__proto__:null,ArcCurve:cg,CatmullRomCurve3:Pu,CubicBezierCurve:Iu,CubicBezierCurve3:vg,EllipseCurve:Ya,LineCurve:Lu,LineCurve3:_g,QuadraticBezierCurve:Du,QuadraticBezierCurve3:Uu,SplineCurve:Nu});class xg extends An{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Er[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),s=this.getCurveLengths();let r=0;for(;r<s.length;){if(s[r]>=n){const o=s[r]-n,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,e)}r++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,s=this.curves.length;n<s;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let s=0,r=this.curves;s<r.length;s++){const o=r[s],a=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,l=o.getPoints(a);for(let c=0;c<l.length;c++){const u=l[c];n&&n.equals(u)||(e.push(u),n=u)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(new Er[s.type]().fromJSON(s))}return this}}class Sa extends xg{constructor(t){super(),this.type="Path",this.currentPoint=new Tt,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new Lu(this.currentPoint.clone(),new Tt(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,s){const r=new Du(this.currentPoint.clone(),new Tt(t,e),new Tt(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(t,e,n,s,r,o){const a=new Iu(this.currentPoint.clone(),new Tt(t,e),new Tt(n,s),new Tt(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new Nu(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,s,r,o){const a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+a,e+l,n,s,r,o),this}absarc(t,e,n,s,r,o){return this.absellipse(t,e,n,n,s,r,o),this}ellipse(t,e,n,s,r,o,a,l){const c=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(t+c,e+u,n,s,r,o,a,l),this}absellipse(t,e,n,s,r,o,a,l){const c=new Ya(t,e,n,s,r,o,a,l);if(this.curves.length>0){const h=c.getPoint(0);h.equals(this.currentPoint)||this.lineTo(h.x,h.y)}this.curves.push(c);const u=c.getPoint(1);return this.currentPoint.copy(u),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class Es extends ye{constructor(t=[new Tt(0,-.5),new Tt(.5,0),new Tt(0,.5)],e=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:s},e=Math.floor(e),s=Pe(s,0,Math.PI*2);const r=[],o=[],a=[],l=[],c=[],u=1/e,h=new O,d=new Tt,f=new O,g=new O,v=new O;let m=0,p=0;for(let y=0;y<=t.length-1;y++)switch(y){case 0:m=t[y+1].x-t[y].x,p=t[y+1].y-t[y].y,f.x=p*1,f.y=-m,f.z=p*0,v.copy(f),f.normalize(),l.push(f.x,f.y,f.z);break;case t.length-1:l.push(v.x,v.y,v.z);break;default:m=t[y+1].x-t[y].x,p=t[y+1].y-t[y].y,f.x=p*1,f.y=-m,f.z=p*0,g.copy(f),f.x+=v.x,f.y+=v.y,f.z+=v.z,f.normalize(),l.push(f.x,f.y,f.z),v.copy(g)}for(let y=0;y<=e;y++){const M=n+y*u*s,_=Math.sin(M),X=Math.cos(M);for(let R=0;R<=t.length-1;R++){h.x=t[R].x*_,h.y=t[R].y,h.z=t[R].x*X,o.push(h.x,h.y,h.z),d.x=y/e,d.y=R/(t.length-1),a.push(d.x,d.y);const L=l[3*R+0]*_,D=l[3*R+1],E=l[3*R+0]*X;c.push(L,D,E)}}for(let y=0;y<e;y++)for(let M=0;M<t.length-1;M++){const _=M+y*t.length,X=_,R=_+t.length,L=_+t.length+1,D=_+1;r.push(X,R,D),r.push(L,D,R)}this.setIndex(r),this.setAttribute("position",new Zt(o,3)),this.setAttribute("uv",new Zt(a,2)),this.setAttribute("normal",new Zt(c,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Es(t.points,t.segments,t.phiStart,t.phiLength)}}class pn extends Es{constructor(t=1,e=1,n=4,s=8){const r=new Sa;r.absarc(0,-e/2,t,Math.PI*1.5,0),r.absarc(0,e/2,t,0,Math.PI*.5),super(r.getPoints(n),s),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:n,radialSegments:s}}static fromJSON(t){return new pn(t.radius,t.length,t.capSegments,t.radialSegments)}}class Dr extends ye{constructor(t=1,e=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:s},e=Math.max(3,e);const r=[],o=[],a=[],l=[],c=new O,u=new Tt;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let h=0,d=3;h<=e;h++,d+=3){const f=n+h/e*s;c.x=t*Math.cos(f),c.y=t*Math.sin(f),o.push(c.x,c.y,c.z),a.push(0,0,1),u.x=(o[d]/t+1)/2,u.y=(o[d+1]/t+1)/2,l.push(u.x,u.y)}for(let h=1;h<=e;h++)r.push(h,h+1,0);this.setIndex(r),this.setAttribute("position",new Zt(o,3)),this.setAttribute("normal",new Zt(a,3)),this.setAttribute("uv",new Zt(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Dr(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class be extends ye{constructor(t=1,e=1,n=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};const c=this;s=Math.floor(s),r=Math.floor(r);const u=[],h=[],d=[],f=[];let g=0;const v=[],m=n/2;let p=0;y(),o===!1&&(t>0&&M(!0),e>0&&M(!1)),this.setIndex(u),this.setAttribute("position",new Zt(h,3)),this.setAttribute("normal",new Zt(d,3)),this.setAttribute("uv",new Zt(f,2));function y(){const _=new O,X=new O;let R=0;const L=(e-t)/n;for(let D=0;D<=r;D++){const E=[],x=D/r,I=x*(e-t)+t;for(let G=0;G<=s;G++){const V=G/s,T=V*l+a,U=Math.sin(T),k=Math.cos(T);X.x=I*U,X.y=-x*n+m,X.z=I*k,h.push(X.x,X.y,X.z),_.set(U,L,k).normalize(),d.push(_.x,_.y,_.z),f.push(V,1-x),E.push(g++)}v.push(E)}for(let D=0;D<s;D++)for(let E=0;E<r;E++){const x=v[E][D],I=v[E+1][D],G=v[E+1][D+1],V=v[E][D+1];(t>0||E!==0)&&(u.push(x,I,V),R+=3),(e>0||E!==r-1)&&(u.push(I,G,V),R+=3)}c.addGroup(p,R,0),p+=R}function M(_){const X=g,R=new Tt,L=new O;let D=0;const E=_===!0?t:e,x=_===!0?1:-1;for(let G=1;G<=s;G++)h.push(0,m*x,0),d.push(0,x,0),f.push(.5,.5),g++;const I=g;for(let G=0;G<=s;G++){const T=G/s*l+a,U=Math.cos(T),k=Math.sin(T);L.x=E*k,L.y=m*x,L.z=E*U,h.push(L.x,L.y,L.z),d.push(0,x,0),R.x=U*.5+.5,R.y=k*.5*x+.5,f.push(R.x,R.y),g++}for(let G=0;G<s;G++){const V=X+G,T=I+G;_===!0?u.push(T,T+1,V):u.push(T+1,T,V),D+=3}c.addGroup(p,D,_===!0?1:2),p+=D}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new be(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Ur extends be{constructor(t=1,e=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,t,e,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(t){return new Ur(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Nr extends ye{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};const r=[],o=[];a(s),c(n),u(),this.setAttribute("position",new Zt(r,3)),this.setAttribute("normal",new Zt(r.slice(),3)),this.setAttribute("uv",new Zt(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(y){const M=new O,_=new O,X=new O;for(let R=0;R<e.length;R+=3)f(e[R+0],M),f(e[R+1],_),f(e[R+2],X),l(M,_,X,y)}function l(y,M,_,X){const R=X+1,L=[];for(let D=0;D<=R;D++){L[D]=[];const E=y.clone().lerp(_,D/R),x=M.clone().lerp(_,D/R),I=R-D;for(let G=0;G<=I;G++)G===0&&D===R?L[D][G]=E:L[D][G]=E.clone().lerp(x,G/I)}for(let D=0;D<R;D++)for(let E=0;E<2*(R-D)-1;E++){const x=Math.floor(E/2);E%2===0?(d(L[D][x+1]),d(L[D+1][x]),d(L[D][x])):(d(L[D][x+1]),d(L[D+1][x+1]),d(L[D+1][x]))}}function c(y){const M=new O;for(let _=0;_<r.length;_+=3)M.x=r[_+0],M.y=r[_+1],M.z=r[_+2],M.normalize().multiplyScalar(y),r[_+0]=M.x,r[_+1]=M.y,r[_+2]=M.z}function u(){const y=new O;for(let M=0;M<r.length;M+=3){y.x=r[M+0],y.y=r[M+1],y.z=r[M+2];const _=m(y)/2/Math.PI+.5,X=p(y)/Math.PI+.5;o.push(_,1-X)}g(),h()}function h(){for(let y=0;y<o.length;y+=6){const M=o[y+0],_=o[y+2],X=o[y+4],R=Math.max(M,_,X),L=Math.min(M,_,X);R>.9&&L<.1&&(M<.2&&(o[y+0]+=1),_<.2&&(o[y+2]+=1),X<.2&&(o[y+4]+=1))}}function d(y){r.push(y.x,y.y,y.z)}function f(y,M){const _=y*3;M.x=t[_+0],M.y=t[_+1],M.z=t[_+2]}function g(){const y=new O,M=new O,_=new O,X=new O,R=new Tt,L=new Tt,D=new Tt;for(let E=0,x=0;E<r.length;E+=9,x+=6){y.set(r[E+0],r[E+1],r[E+2]),M.set(r[E+3],r[E+4],r[E+5]),_.set(r[E+6],r[E+7],r[E+8]),R.set(o[x+0],o[x+1]),L.set(o[x+2],o[x+3]),D.set(o[x+4],o[x+5]),X.copy(y).add(M).add(_).divideScalar(3);const I=m(X);v(R,x+0,y,I),v(L,x+2,M,I),v(D,x+4,_,I)}}function v(y,M,_,X){X<0&&y.x===1&&(o[M]=y.x-1),_.x===0&&_.z===0&&(o[M]=X/2/Math.PI+.5)}function m(y){return Math.atan2(y.z,-y.x)}function p(y){return Math.atan2(-y.y,Math.sqrt(y.x*y.x+y.z*y.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Nr(t.vertices,t.indices,t.radius,t.details)}}class Za extends Sa{constructor(t){super(t),this.uuid=xi(),this.type="Shape",this.holes=[]}getPointsHoles(t){const e=[];for(let n=0,s=this.holes.length;n<s;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){const s=this.holes[e];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(new Sa().fromJSON(s))}return this}}const Mg={triangulate:function(i,t,e=2){const n=t&&t.length,s=n?t[0]*e:i.length;let r=Fu(i,0,s,e,!0);const o=[];if(!r||r.next===r.prev)return o;let a,l,c,u,h,d,f;if(n&&(r=Eg(i,t,r,e)),i.length>80*e){a=c=i[0],l=u=i[1];for(let g=e;g<s;g+=e)h=i[g],d=i[g+1],h<a&&(a=h),d<l&&(l=d),h>c&&(c=h),d>u&&(u=d);f=Math.max(c-a,u-l),f=f!==0?32767/f:0}return Ts(r,o,e,a,l,f,0),o}};function Fu(i,t,e,n,s){let r,o;if(s===Fg(i,t,e,n)>0)for(r=t;r<e;r+=n)o=Sc(r,i[r],i[r+1],o);else for(r=e-n;r>=t;r-=n)o=Sc(r,i[r],i[r+1],o);return o&&Fr(o,o.next)&&(Cs(o),o=o.next),o}function _i(i,t){if(!i)return i;t||(t=i);let e=i,n;do if(n=!1,!e.steiner&&(Fr(e,e.next)||Me(e.prev,e,e.next)===0)){if(Cs(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function Ts(i,t,e,n,s,r,o){if(!i)return;!o&&r&&Pg(i,n,s,r);let a=i,l,c;for(;i.prev!==i.next;){if(l=i.prev,c=i.next,r?Sg(i,n,s,r):yg(i)){t.push(l.i/e|0),t.push(i.i/e|0),t.push(c.i/e|0),Cs(i),i=c.next,a=c.next;continue}if(i=c,i===a){o?o===1?(i=wg(_i(i),t,e),Ts(i,t,e,n,s,r,2)):o===2&&bg(i,t,e,n,s,r):Ts(_i(i),t,e,n,s,r,1);break}}}function yg(i){const t=i.prev,e=i,n=i.next;if(Me(t,e,n)>=0)return!1;const s=t.x,r=e.x,o=n.x,a=t.y,l=e.y,c=n.y,u=s<r?s<o?s:o:r<o?r:o,h=a<l?a<c?a:c:l<c?l:c,d=s>r?s>o?s:o:r>o?r:o,f=a>l?a>c?a:c:l>c?l:c;let g=n.next;for(;g!==t;){if(g.x>=u&&g.x<=d&&g.y>=h&&g.y<=f&&Vi(s,a,r,l,o,c,g.x,g.y)&&Me(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function Sg(i,t,e,n){const s=i.prev,r=i,o=i.next;if(Me(s,r,o)>=0)return!1;const a=s.x,l=r.x,c=o.x,u=s.y,h=r.y,d=o.y,f=a<l?a<c?a:c:l<c?l:c,g=u<h?u<d?u:d:h<d?h:d,v=a>l?a>c?a:c:l>c?l:c,m=u>h?u>d?u:d:h>d?h:d,p=wa(f,g,t,e,n),y=wa(v,m,t,e,n);let M=i.prevZ,_=i.nextZ;for(;M&&M.z>=p&&_&&_.z<=y;){if(M.x>=f&&M.x<=v&&M.y>=g&&M.y<=m&&M!==s&&M!==o&&Vi(a,u,l,h,c,d,M.x,M.y)&&Me(M.prev,M,M.next)>=0||(M=M.prevZ,_.x>=f&&_.x<=v&&_.y>=g&&_.y<=m&&_!==s&&_!==o&&Vi(a,u,l,h,c,d,_.x,_.y)&&Me(_.prev,_,_.next)>=0))return!1;_=_.nextZ}for(;M&&M.z>=p;){if(M.x>=f&&M.x<=v&&M.y>=g&&M.y<=m&&M!==s&&M!==o&&Vi(a,u,l,h,c,d,M.x,M.y)&&Me(M.prev,M,M.next)>=0)return!1;M=M.prevZ}for(;_&&_.z<=y;){if(_.x>=f&&_.x<=v&&_.y>=g&&_.y<=m&&_!==s&&_!==o&&Vi(a,u,l,h,c,d,_.x,_.y)&&Me(_.prev,_,_.next)>=0)return!1;_=_.nextZ}return!0}function wg(i,t,e){let n=i;do{const s=n.prev,r=n.next.next;!Fr(s,r)&&Ou(s,n,n.next,r)&&As(s,r)&&As(r,s)&&(t.push(s.i/e|0),t.push(n.i/e|0),t.push(r.i/e|0),Cs(n),Cs(n.next),n=i=r),n=n.next}while(n!==i);return _i(n)}function bg(i,t,e,n,s,r){let o=i;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&Dg(o,a)){let l=ku(o,a);o=_i(o,o.next),l=_i(l,l.next),Ts(o,t,e,n,s,r,0),Ts(l,t,e,n,s,r,0);return}a=a.next}o=o.next}while(o!==i)}function Eg(i,t,e,n){const s=[];let r,o,a,l,c;for(r=0,o=t.length;r<o;r++)a=t[r]*n,l=r<o-1?t[r+1]*n:i.length,c=Fu(i,a,l,n,!1),c===c.next&&(c.steiner=!0),s.push(Lg(c));for(s.sort(Tg),r=0;r<s.length;r++)e=Ag(s[r],e);return e}function Tg(i,t){return i.x-t.x}function Ag(i,t){const e=Cg(i,t);if(!e)return t;const n=ku(e,i);return _i(n,n.next),_i(e,e.next)}function Cg(i,t){let e=t,n=-1/0,s;const r=i.x,o=i.y;do{if(o<=e.y&&o>=e.next.y&&e.next.y!==e.y){const d=e.x+(o-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(d<=r&&d>n&&(n=d,s=e.x<e.next.x?e:e.next,d===r))return s}e=e.next}while(e!==t);if(!s)return null;const a=s,l=s.x,c=s.y;let u=1/0,h;e=s;do r>=e.x&&e.x>=l&&r!==e.x&&Vi(o<c?r:n,o,l,c,o<c?n:r,o,e.x,e.y)&&(h=Math.abs(o-e.y)/(r-e.x),As(e,i)&&(h<u||h===u&&(e.x>s.x||e.x===s.x&&Rg(s,e)))&&(s=e,u=h)),e=e.next;while(e!==a);return s}function Rg(i,t){return Me(i.prev,i,t.prev)<0&&Me(t.next,i,i.next)<0}function Pg(i,t,e,n){let s=i;do s.z===0&&(s.z=wa(s.x,s.y,t,e,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,Ig(s)}function Ig(i){let t,e,n,s,r,o,a,l,c=1;do{for(e=i,i=null,r=null,o=0;e;){for(o++,n=e,a=0,t=0;t<c&&(a++,n=n.nextZ,!!n);t++);for(l=c;a>0||l>0&&n;)a!==0&&(l===0||!n||e.z<=n.z)?(s=e,e=e.nextZ,a--):(s=n,n=n.nextZ,l--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;e=n}r.nextZ=null,c*=2}while(o>1);return i}function wa(i,t,e,n,s){return i=(i-e)*s|0,t=(t-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,i|t<<1}function Lg(i){let t=i,e=i;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==i);return e}function Vi(i,t,e,n,s,r,o,a){return(s-o)*(t-a)>=(i-o)*(r-a)&&(i-o)*(n-a)>=(e-o)*(t-a)&&(e-o)*(r-a)>=(s-o)*(n-a)}function Dg(i,t){return i.next.i!==t.i&&i.prev.i!==t.i&&!Ug(i,t)&&(As(i,t)&&As(t,i)&&Ng(i,t)&&(Me(i.prev,i,t.prev)||Me(i,t.prev,t))||Fr(i,t)&&Me(i.prev,i,i.next)>0&&Me(t.prev,t,t.next)>0)}function Me(i,t,e){return(t.y-i.y)*(e.x-t.x)-(t.x-i.x)*(e.y-t.y)}function Fr(i,t){return i.x===t.x&&i.y===t.y}function Ou(i,t,e,n){const s=ur(Me(i,t,e)),r=ur(Me(i,t,n)),o=ur(Me(e,n,i)),a=ur(Me(e,n,t));return!!(s!==r&&o!==a||s===0&&cr(i,e,t)||r===0&&cr(i,n,t)||o===0&&cr(e,i,n)||a===0&&cr(e,t,n))}function cr(i,t,e){return t.x<=Math.max(i.x,e.x)&&t.x>=Math.min(i.x,e.x)&&t.y<=Math.max(i.y,e.y)&&t.y>=Math.min(i.y,e.y)}function ur(i){return i>0?1:i<0?-1:0}function Ug(i,t){let e=i;do{if(e.i!==i.i&&e.next.i!==i.i&&e.i!==t.i&&e.next.i!==t.i&&Ou(e,e.next,i,t))return!0;e=e.next}while(e!==i);return!1}function As(i,t){return Me(i.prev,i,i.next)<0?Me(i,t,i.next)>=0&&Me(i,i.prev,t)>=0:Me(i,t,i.prev)<0||Me(i,i.next,t)<0}function Ng(i,t){let e=i,n=!1;const s=(i.x+t.x)/2,r=(i.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&s<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==i);return n}function ku(i,t){const e=new ba(i.i,i.x,i.y),n=new ba(t.i,t.x,t.y),s=i.next,r=t.prev;return i.next=t,t.prev=i,e.next=s,s.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function Sc(i,t,e,n){const s=new ba(i,t,e);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function Cs(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function ba(i,t,e){this.i=i,this.x=t,this.y=e,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function Fg(i,t,e,n){let s=0;for(let r=t,o=e-n;r<e;r+=n)s+=(i[o]-i[r])*(i[r+1]+i[o+1]),o=r;return s}class jn{static area(t){const e=t.length;let n=0;for(let s=e-1,r=0;r<e;s=r++)n+=t[s].x*t[r].y-t[r].x*t[s].y;return n*.5}static isClockWise(t){return jn.area(t)<0}static triangulateShape(t,e){const n=[],s=[],r=[];wc(t),bc(n,t);let o=t.length;e.forEach(wc);for(let l=0;l<e.length;l++)s.push(o),o+=e[l].length,bc(n,e[l]);const a=Mg.triangulate(n,s);for(let l=0;l<a.length;l+=3)r.push(a.slice(l,l+3));return r}}function wc(i){const t=i.length;t>2&&i[t-1].equals(i[0])&&i.pop()}function bc(i,t){for(let e=0;e<t.length;e++)i.push(t[e].x),i.push(t[e].y)}class Ka extends ye{constructor(t=new Za([new Tt(.5,.5),new Tt(-.5,.5),new Tt(-.5,-.5),new Tt(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];const n=this,s=[],r=[];for(let a=0,l=t.length;a<l;a++){const c=t[a];o(c)}this.setAttribute("position",new Zt(s,3)),this.setAttribute("uv",new Zt(r,2)),this.computeVertexNormals();function o(a){const l=[],c=e.curveSegments!==void 0?e.curveSegments:12,u=e.steps!==void 0?e.steps:1,h=e.depth!==void 0?e.depth:1;let d=e.bevelEnabled!==void 0?e.bevelEnabled:!0,f=e.bevelThickness!==void 0?e.bevelThickness:.2,g=e.bevelSize!==void 0?e.bevelSize:f-.1,v=e.bevelOffset!==void 0?e.bevelOffset:0,m=e.bevelSegments!==void 0?e.bevelSegments:3;const p=e.extrudePath,y=e.UVGenerator!==void 0?e.UVGenerator:Og;let M,_=!1,X,R,L,D;p&&(M=p.getSpacedPoints(u),_=!0,d=!1,X=p.computeFrenetFrames(u,!1),R=new O,L=new O,D=new O),d||(m=0,f=0,g=0,v=0);const E=a.extractPoints(c);let x=E.shape;const I=E.holes;if(!jn.isClockWise(x)){x=x.reverse();for(let xt=0,Et=I.length;xt<Et;xt++){const N=I[xt];jn.isClockWise(N)&&(I[xt]=N.reverse())}}const V=jn.triangulateShape(x,I),T=x;for(let xt=0,Et=I.length;xt<Et;xt++){const N=I[xt];x=x.concat(N)}function U(xt,Et,N){return Et||console.error("THREE.ExtrudeGeometry: vec does not exist"),xt.clone().addScaledVector(Et,N)}const k=x.length,b=V.length;function P(xt,Et,N){let S,B,Z;const H=xt.x-Et.x,nt=xt.y-Et.y,tt=N.x-xt.x,A=N.y-xt.y,w=H*H+nt*nt,ot=H*A-nt*tt;if(Math.abs(ot)>Number.EPSILON){const yt=Math.sqrt(w),J=Math.sqrt(tt*tt+A*A),it=Et.x-nt/yt,St=Et.y+H/yt,ft=N.x-A/J,Mt=N.y+tt/J,It=((ft-it)*A-(Mt-St)*tt)/(H*A-nt*tt);S=it+H*It-xt.x,B=St+nt*It-xt.y;const gt=S*S+B*B;if(gt<=2)return new Tt(S,B);Z=Math.sqrt(gt/2)}else{let yt=!1;H>Number.EPSILON?tt>Number.EPSILON&&(yt=!0):H<-Number.EPSILON?tt<-Number.EPSILON&&(yt=!0):Math.sign(nt)===Math.sign(A)&&(yt=!0),yt?(S=-nt,B=H,Z=Math.sqrt(w)):(S=H,B=nt,Z=Math.sqrt(w/2))}return new Tt(S/Z,B/Z)}const q=[];for(let xt=0,Et=T.length,N=Et-1,S=xt+1;xt<Et;xt++,N++,S++)N===Et&&(N=0),S===Et&&(S=0),q[xt]=P(T[xt],T[N],T[S]);const et=[];let $,pt=q.concat();for(let xt=0,Et=I.length;xt<Et;xt++){const N=I[xt];$=[];for(let S=0,B=N.length,Z=B-1,H=S+1;S<B;S++,Z++,H++)Z===B&&(Z=0),H===B&&(H=0),$[S]=P(N[S],N[Z],N[H]);et.push($),pt=pt.concat($)}for(let xt=0;xt<m;xt++){const Et=xt/m,N=f*Math.cos(Et*Math.PI/2),S=g*Math.sin(Et*Math.PI/2)+v;for(let B=0,Z=T.length;B<Z;B++){const H=U(T[B],q[B],S);j(H.x,H.y,-N)}for(let B=0,Z=I.length;B<Z;B++){const H=I[B];$=et[B];for(let nt=0,tt=H.length;nt<tt;nt++){const A=U(H[nt],$[nt],S);j(A.x,A.y,-N)}}}const Y=g+v;for(let xt=0;xt<k;xt++){const Et=d?U(x[xt],pt[xt],Y):x[xt];_?(L.copy(X.normals[0]).multiplyScalar(Et.x),R.copy(X.binormals[0]).multiplyScalar(Et.y),D.copy(M[0]).add(L).add(R),j(D.x,D.y,D.z)):j(Et.x,Et.y,0)}for(let xt=1;xt<=u;xt++)for(let Et=0;Et<k;Et++){const N=d?U(x[Et],pt[Et],Y):x[Et];_?(L.copy(X.normals[xt]).multiplyScalar(N.x),R.copy(X.binormals[xt]).multiplyScalar(N.y),D.copy(M[xt]).add(L).add(R),j(D.x,D.y,D.z)):j(N.x,N.y,h/u*xt)}for(let xt=m-1;xt>=0;xt--){const Et=xt/m,N=f*Math.cos(Et*Math.PI/2),S=g*Math.sin(Et*Math.PI/2)+v;for(let B=0,Z=T.length;B<Z;B++){const H=U(T[B],q[B],S);j(H.x,H.y,h+N)}for(let B=0,Z=I.length;B<Z;B++){const H=I[B];$=et[B];for(let nt=0,tt=H.length;nt<tt;nt++){const A=U(H[nt],$[nt],S);_?j(A.x,A.y+M[u-1].y,M[u-1].x+N):j(A.x,A.y,h+N)}}}K(),z();function K(){const xt=s.length/3;if(d){let Et=0,N=k*Et;for(let S=0;S<b;S++){const B=V[S];mt(B[2]+N,B[1]+N,B[0]+N)}Et=u+m*2,N=k*Et;for(let S=0;S<b;S++){const B=V[S];mt(B[0]+N,B[1]+N,B[2]+N)}}else{for(let Et=0;Et<b;Et++){const N=V[Et];mt(N[2],N[1],N[0])}for(let Et=0;Et<b;Et++){const N=V[Et];mt(N[0]+k*u,N[1]+k*u,N[2]+k*u)}}n.addGroup(xt,s.length/3-xt,0)}function z(){const xt=s.length/3;let Et=0;lt(T,Et),Et+=T.length;for(let N=0,S=I.length;N<S;N++){const B=I[N];lt(B,Et),Et+=B.length}n.addGroup(xt,s.length/3-xt,1)}function lt(xt,Et){let N=xt.length;for(;--N>=0;){const S=N;let B=N-1;B<0&&(B=xt.length-1);for(let Z=0,H=u+m*2;Z<H;Z++){const nt=k*Z,tt=k*(Z+1),A=Et+S+nt,w=Et+B+nt,ot=Et+B+tt,yt=Et+S+tt;At(A,w,ot,yt)}}}function j(xt,Et,N){l.push(xt),l.push(Et),l.push(N)}function mt(xt,Et,N){Rt(xt),Rt(Et),Rt(N);const S=s.length/3,B=y.generateTopUV(n,s,S-3,S-2,S-1);Ht(B[0]),Ht(B[1]),Ht(B[2])}function At(xt,Et,N,S){Rt(xt),Rt(Et),Rt(S),Rt(Et),Rt(N),Rt(S);const B=s.length/3,Z=y.generateSideWallUV(n,s,B-6,B-3,B-2,B-1);Ht(Z[0]),Ht(Z[1]),Ht(Z[3]),Ht(Z[1]),Ht(Z[2]),Ht(Z[3])}function Rt(xt){s.push(l[xt*3+0]),s.push(l[xt*3+1]),s.push(l[xt*3+2])}function Ht(xt){r.push(xt.x),r.push(xt.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return kg(e,n,t)}static fromJSON(t,e){const n=[];for(let r=0,o=t.shapes.length;r<o;r++){const a=e[t.shapes[r]];n.push(a)}const s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new Er[s.type]().fromJSON(s)),new Ka(n,t.options)}}const Og={generateTopUV:function(i,t,e,n,s){const r=t[e*3],o=t[e*3+1],a=t[n*3],l=t[n*3+1],c=t[s*3],u=t[s*3+1];return[new Tt(r,o),new Tt(a,l),new Tt(c,u)]},generateSideWallUV:function(i,t,e,n,s,r){const o=t[e*3],a=t[e*3+1],l=t[e*3+2],c=t[n*3],u=t[n*3+1],h=t[n*3+2],d=t[s*3],f=t[s*3+1],g=t[s*3+2],v=t[r*3],m=t[r*3+1],p=t[r*3+2];return Math.abs(a-u)<Math.abs(o-c)?[new Tt(o,1-l),new Tt(c,1-h),new Tt(d,1-g),new Tt(v,1-p)]:[new Tt(a,1-l),new Tt(u,1-h),new Tt(f,1-g),new Tt(m,1-p)]}};function kg(i,t,e){if(e.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){const r=i[n];e.shapes.push(r.uuid)}else e.shapes.push(i.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}class wn extends Nr{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new wn(t.radius,t.detail)}}class Ja extends Nr{constructor(t=1,e=0){const n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Ja(t.radius,t.detail)}}class mi extends ye{constructor(t=.5,e=1,n=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:s,thetaStart:r,thetaLength:o},n=Math.max(3,n),s=Math.max(1,s);const a=[],l=[],c=[],u=[];let h=t;const d=(e-t)/s,f=new O,g=new Tt;for(let v=0;v<=s;v++){for(let m=0;m<=n;m++){const p=r+m/n*o;f.x=h*Math.cos(p),f.y=h*Math.sin(p),l.push(f.x,f.y,f.z),c.push(0,0,1),g.x=(f.x/e+1)/2,g.y=(f.y/e+1)/2,u.push(g.x,g.y)}h+=d}for(let v=0;v<s;v++){const m=v*(n+1);for(let p=0;p<n;p++){const y=p+m,M=y,_=y+n+1,X=y+n+2,R=y+1;a.push(M,_,R),a.push(_,X,R)}}this.setIndex(a),this.setAttribute("position",new Zt(l,3)),this.setAttribute("normal",new Zt(c,3)),this.setAttribute("uv",new Zt(u,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new mi(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class $a extends ye{constructor(t=new Za([new Tt(0,.5),new Tt(-.5,-.5),new Tt(.5,-.5)]),e=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:e};const n=[],s=[],r=[],o=[];let a=0,l=0;if(Array.isArray(t)===!1)c(t);else for(let u=0;u<t.length;u++)c(t[u]),this.addGroup(a,l,u),a+=l,l=0;this.setIndex(n),this.setAttribute("position",new Zt(s,3)),this.setAttribute("normal",new Zt(r,3)),this.setAttribute("uv",new Zt(o,2));function c(u){const h=s.length/3,d=u.extractPoints(e);let f=d.shape;const g=d.holes;jn.isClockWise(f)===!1&&(f=f.reverse());for(let m=0,p=g.length;m<p;m++){const y=g[m];jn.isClockWise(y)===!0&&(g[m]=y.reverse())}const v=jn.triangulateShape(f,g);for(let m=0,p=g.length;m<p;m++){const y=g[m];f=f.concat(y)}for(let m=0,p=f.length;m<p;m++){const y=f[m];s.push(y.x,y.y,0),r.push(0,0,1),o.push(y.x,y.y)}for(let m=0,p=v.length;m<p;m++){const y=v[m],M=y[0]+h,_=y[1]+h,X=y[2]+h;n.push(M,_,X),l+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes;return zg(e,t)}static fromJSON(t,e){const n=[];for(let s=0,r=t.shapes.length;s<r;s++){const o=e[t.shapes[s]];n.push(o)}return new $a(n,t.curveSegments)}}function zg(i,t){if(t.shapes=[],Array.isArray(i))for(let e=0,n=i.length;e<n;e++){const s=i[e];t.shapes.push(s.uuid)}else t.shapes.push(i.uuid);return t}class De extends ye{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(o+a,Math.PI);let c=0;const u=[],h=new O,d=new O,f=[],g=[],v=[],m=[];for(let p=0;p<=n;p++){const y=[],M=p/n;let _=0;p===0&&o===0?_=.5/e:p===n&&l===Math.PI&&(_=-.5/e);for(let X=0;X<=e;X++){const R=X/e;h.x=-t*Math.cos(s+R*r)*Math.sin(o+M*a),h.y=t*Math.cos(o+M*a),h.z=t*Math.sin(s+R*r)*Math.sin(o+M*a),g.push(h.x,h.y,h.z),d.copy(h).normalize(),v.push(d.x,d.y,d.z),m.push(R+_,1-M),y.push(c++)}u.push(y)}for(let p=0;p<n;p++)for(let y=0;y<e;y++){const M=u[p][y+1],_=u[p][y],X=u[p+1][y],R=u[p+1][y+1];(p!==0||o>0)&&f.push(M,_,R),(p!==n-1||l<Math.PI)&&f.push(_,X,R)}this.setIndex(f),this.setAttribute("position",new Zt(g,3)),this.setAttribute("normal",new Zt(v,3)),this.setAttribute("uv",new Zt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new De(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class Ze extends ye{constructor(t=1,e=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);const o=[],a=[],l=[],c=[],u=new O,h=new O,d=new O;for(let f=0;f<=n;f++)for(let g=0;g<=s;g++){const v=g/s*r,m=f/n*Math.PI*2;h.x=(t+e*Math.cos(m))*Math.cos(v),h.y=(t+e*Math.cos(m))*Math.sin(v),h.z=e*Math.sin(m),a.push(h.x,h.y,h.z),u.x=t*Math.cos(v),u.y=t*Math.sin(v),d.subVectors(h,u).normalize(),l.push(d.x,d.y,d.z),c.push(g/s),c.push(f/n)}for(let f=1;f<=n;f++)for(let g=1;g<=s;g++){const v=(s+1)*f+g-1,m=(s+1)*(f-1)+g-1,p=(s+1)*(f-1)+g,y=(s+1)*f+g;o.push(v,m,y),o.push(m,p,y)}this.setIndex(o),this.setAttribute("position",new Zt(a,3)),this.setAttribute("normal",new Zt(l,3)),this.setAttribute("uv",new Zt(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ze(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class ja extends ye{constructor(t=new Uu(new O(-1,-1,0),new O(-1,1,0),new O(1,1,0)),e=64,n=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:n,radialSegments:s,closed:r};const o=t.computeFrenetFrames(e,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;const a=new O,l=new O,c=new Tt;let u=new O;const h=[],d=[],f=[],g=[];v(),this.setIndex(g),this.setAttribute("position",new Zt(h,3)),this.setAttribute("normal",new Zt(d,3)),this.setAttribute("uv",new Zt(f,2));function v(){for(let M=0;M<e;M++)m(M);m(r===!1?e:0),y(),p()}function m(M){u=t.getPointAt(M/e,u);const _=o.normals[M],X=o.binormals[M];for(let R=0;R<=s;R++){const L=R/s*Math.PI*2,D=Math.sin(L),E=-Math.cos(L);l.x=E*_.x+D*X.x,l.y=E*_.y+D*X.y,l.z=E*_.z+D*X.z,l.normalize(),d.push(l.x,l.y,l.z),a.x=u.x+n*l.x,a.y=u.y+n*l.y,a.z=u.z+n*l.z,h.push(a.x,a.y,a.z)}}function p(){for(let M=1;M<=e;M++)for(let _=1;_<=s;_++){const X=(s+1)*(M-1)+(_-1),R=(s+1)*M+(_-1),L=(s+1)*M+_,D=(s+1)*(M-1)+_;g.push(X,R,D),g.push(R,L,D)}}function y(){for(let M=0;M<=e;M++)for(let _=0;_<=s;_++)c.x=M/e,c.y=_/s,f.push(c.x,c.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new ja(new Er[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}}class se extends Mi{static get type(){return"MeshStandardMaterial"}constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new ut(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ut(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=uu,this.normalScale=new Tt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new En,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Bg extends se{static get type(){return"MeshPhysicalMaterial"}constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new Tt(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Pe(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new ut(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new ut(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new ut(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}}class Qa extends Jt{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new ut(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class Hg extends Qa{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Jt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ut(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const wo=new Qt,Ec=new O,Tc=new O;class zu{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Tt(512,512),this.map=null,this.mapPass=null,this.matrix=new Qt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new za,this._frameExtents=new Tt(1,1),this._viewportCount=1,this._viewports=[new ce(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;Ec.setFromMatrixPosition(t.matrixWorld),e.position.copy(Ec),Tc.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Tc),e.updateMatrixWorld(),wo.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(wo),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(wo)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const Ac=new Qt,gs=new O,bo=new O;class Gg extends zu{constructor(){super(new Qe(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Tt(4,2),this._viewportCount=6,this._viewports=[new ce(2,1,1,1),new ce(0,1,1,1),new ce(3,1,1,1),new ce(1,1,1,1),new ce(3,0,1,1),new ce(1,0,1,1)],this._cubeDirections=[new O(1,0,0),new O(-1,0,0),new O(0,0,1),new O(0,0,-1),new O(0,1,0),new O(0,-1,0)],this._cubeUps=[new O(0,1,0),new O(0,1,0),new O(0,1,0),new O(0,1,0),new O(0,0,1),new O(0,0,-1)]}updateMatrices(t,e=0){const n=this.camera,s=this.matrix,r=t.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),gs.setFromMatrixPosition(t.matrixWorld),n.position.copy(gs),bo.copy(n.position),bo.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(bo),n.updateMatrixWorld(),s.makeTranslation(-gs.x,-gs.y,-gs.z),Ac.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ac)}}class Ea extends Qa{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new Gg}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class Vg extends zu{constructor(){super(new Ba(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Cc extends Qa{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Jt.DEFAULT_UP),this.updateMatrix(),this.target=new Jt,this.shadow=new Vg}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class Wg{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Rc(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=Rc();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function Rc(){return performance.now()}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Pa}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Pa);const hr=54,Eo=Math.PI*2,Pc=7.1,Tr=.22,Wi=Math.PI/2.6,ys=Math.PI/2-.1,Xg=30,Yg=.25,qg=1.2,Zg=60,Q_=20,To=Math.PI/2.4,Kg=2;function Ta(i,t,e){return i<t?t:i>e?e:i}function hn(i,t,e,n){return i+(t-i)*(1-Math.exp(-e*n))}function Or(i,t){let e=(t-i)%Eo;return e>Math.PI?e-=Eo:e<-Math.PI&&(e+=Eo),e}function Jg(i,t,e,n){return i+Or(i,t)*(1-Math.exp(-7.5*n))}function Bu(i){const t=Number.isFinite(i)&&i>0?i:.016666666666666666;return Ta(Xg*t,Yg,qg)}function Hu(i,t,e=Bu(1/60)){const n=Or(t,i),s=Math.abs(n);return s<=ys||s>ys+e?i:t+(n>0?ys:-ys)}function Gu(i,t){return Math.abs(Or(t,i))<=ys+1e-9}function Ic(i,t,e,n,s,r){return i.set(t.x+e*s,t.y+2.5+Math.sin(r)*s*.9,t.z+n*s),i.y<t.y+1.2&&(i.y=t.y+1.2),i.y<1.4&&(i.y=1.4),i}function $g(i,t,e){const n=i.pos.x-t.x,s=i.pos.z-t.z,r=Math.hypot(n,s);if(!(r>1e-4))return!1;if(r>i.dist*Kg)return i.behindHeld=!1,!1;const o=Or(e,Math.atan2(n,s));if(Math.abs(o)<=To)return i.behindHeld=!0,!1;if(!i.behindHeld)return!1;const a=e+(o>0?To:-To);return i.pos.x=t.x+Math.sin(a)*r,i.pos.z=t.z+Math.cos(a)*r,!0}function Lc(i,t,e,n,s,r,o){return i.set(t.x+s.x-e*1.1,t.y+1.45-Math.sin(r-o)*2.4,t.z+s.z-n*1.1),i}function jg(i,t,e,n,s){const r=i.x-t.x,o=i.z-t.z,a=Math.hypot(r,o);if(a<1e-4)return s;const l=Math.atan2(r,o),c=s?Hu(l,e,n):l;return c!==l&&(i.x=t.x+Math.sin(c)*a,i.z=t.z+Math.cos(c)*a),Gu(c,e)}function Qg({aspect:i=16/9,mobile:t=!1}={}){const e=new Qe(hr,i,.35,1600);e.position.set(0,6,14);const n={pos:new O(0,6,14),look:new O(0,1.4,0),yaw:0,pitch:Tr,pitchBias:0,pitchOut:Tr,dist:7.4,behindHold:!1,behindPosHold:!1,behindHeld:!1,shake:0,shakeFreq:26,fovKick:0,breathe:Math.random()*100,mobile:t,shakeScale:t?.45:1,lead:new O},s=new O,r=new O,o=new O;return{camera:e,state:n,setMobile(a){n.mobile=!!a,n.shakeScale=a?.45:1},releaseBehind(){n.behindHeld=!1},impulse(a=.5,l=0){n.shake=Math.min(1.4,n.shake+a*n.shakeScale),n.fovKick=Math.min(6.5,n.fovKick+(l||a*2.4)*n.shakeScale)},resize(a){e.aspect=a,e.updateProjectionMatrix()},update(a,l,c,u,h={}){const d=Math.max(0,l.y),f=Number.isFinite(h.behindYaw)?h.behindYaw:null,g=f===null?0:Bu(a);n.yaw=Jg(n.yaw,Number.isFinite(c)?c:n.yaw,7.5,a),f===null?(n.behindHold=!1,n.behindPosHold=!1):(n.behindHold&&(n.yaw=Hu(n.yaw,f,g)),n.behindHold=Gu(n.yaw,f));const v=Number.isFinite(h.pitchBias)?h.pitchBias:0;n.pitchBias=hn(n.pitchBias,v,14,a);const m=Ta(n.pitch+n.pitchBias,-Wi,Wi);n.pitchOut=m;const p=u?Math.hypot(u.x,u.z):0,y=Pc+Math.min(1.6,p*.11)+d*.12;n.dist=hn(n.dist,y,3.2,a);const M=Math.sin(n.yaw),_=Math.cos(n.yaw);Ic(s,l,M,_,n.dist,m),n.pos.x=hn(n.pos.x,s.x,6.2,a),n.pos.y=hn(n.pos.y,s.y,5,a),n.pos.z=hn(n.pos.z,s.z,6.2,a),f!==null&&(n.behindPosHold=jg(n.pos,l,f,g,n.behindPosHold)),$g(n,l,Number.isFinite(c)?c:n.yaw),u&&(n.lead.x=hn(n.lead.x,u.x*.16,4,a),n.lead.z=hn(n.lead.z,u.z*.16,4,a)),Lc(r,l,M,_,n.lead,m,n.pitch),n.look.x=hn(n.look.x,r.x,9,a),n.look.y=hn(n.look.y,r.y,7,a),n.look.z=hn(n.look.z,r.z,9,a),n.breathe+=a;const X=Math.sin(n.breathe*.53)*.035+Math.sin(n.breathe*1.31)*.012,R=Math.cos(n.breathe*.41)*.028+Math.sin(n.breathe*1.07)*.01;let L=0,D=0,E=0;if(n.shake>5e-4){const I=n.breathe*n.shakeFreq,G=n.shake*n.shake;L=(Math.sin(I*1.7)+Math.sin(I*3.1)*.5)*G*.34,D=(Math.cos(I*2.3)+Math.sin(I*4.7)*.4)*G*.26,E=Math.sin(I*2.9)*G*.18,n.shake=Math.max(0,n.shake-a*3.6)}e.position.set(n.pos.x+X+L,n.pos.y+R+D,n.pos.z+E),o.copy(n.look),o.x+=L*.3,o.y+=D*.3,e.lookAt(o),e.rotateZ(L*.06),n.fovKick=Math.max(0,n.fovKick-a*14);const x=hr+n.fovKick+Math.min(4,p*.22);Math.abs(e.fov-x)>.01&&(e.fov=hn(e.fov,x,10,a),e.updateProjectionMatrix())},snap(a,l,c={}){n.yaw=Number.isFinite(l)?Math.atan2(Math.sin(l),Math.cos(l)):n.yaw,n.pitchBias=Number.isFinite(c.pitchBias)?c.pitchBias:0;const u=Ta(n.pitch+n.pitchBias,-Wi,Wi);n.pitchOut=u,n.dist=Number.isFinite(c.dist)?c.dist:Pc,n.lead.set(0,0,0),n.behindHeld=!0,n.shake=0,n.fovKick=0;const h=Math.sin(n.yaw),d=Math.cos(n.yaw);return n.pos.copy(Ic(s,a,h,d,n.dist,u)),n.look.copy(Lc(r,a,h,d,n.lead,u,n.pitch)),e.position.copy(n.pos),e.lookAt(n.look),e.rotation.z=0,e.fov!==hr&&(e.fov=hr,e.updateProjectionMatrix()),n.pos},orbit(a,l,c=30){const u=l*.055,h=3.4+Math.sin(l*.11)*2.6;e.position.set(Math.cos(u)*c,h,Math.sin(u)*c),e.lookAt(Math.sin(u*1.7)*2,-.9,Math.cos(u*1.7)*2),n.pos.copy(e.position),n.look.set(0,-.9,0)}}}const Ut={skyZenith:1713984,skyMid:3885667,skyHorizon:7172741,skyWarm:12159587,sunDisc:16766888,keyLight:16763279,fillSky:9416925,fillBounce:7164736,rimLight:11125734,crackLight:16751686,rockTop:6971477,rockBody:4934222,rockDeep:3092792,rockFresh:9143160,grime:2367260,crackCore:16761963,crackDeep:14177308,fog:3358810,cloudLit:10390390,cloudShadow:4608106,leather:4535593,leatherWorn:6507577,metal:9277331,metalWarm:11570014,cloth:4672857,clothDim:3027772,skin:9068359},tv={cotton:14928264,granite:8227481,gale:6538932,frost:10475759,spring:13209407,afterimage:11832030,magnet:13193027,meteor:14710848},kr=10134189,zr=1,tl=2;function kn(i){var t,e;return(e=(t=i==null?void 0:i.layers)==null?void 0:t.enable)==null||e.call(t,tl),i}const Aa={high:{name:"high",dprCap:2,msaa:4,shadows:!0,shadowMapSize:2048,softShadows:!0,propShadows:!0,bloomOccluders:"all",rimLight:!0,crackFillLight:!0,texRock:512,texDetail:256,normalMaps:!0,sheenCloth:!0,envSize:256,islandRadialSegments:128,islandProfileSegments:26,plateBevel:!0,plateCurveSegments:10,capsuleSegments:12,rockChunks:7,cloudLayers:3,dustBudget:900,emberBudget:220,debrisPerBurst:7,debrisBudget:120,mergedDebris:!1,decalBudget:24,shockRings:2,footDust:!0,bloom:!0,bloomScale:.5,bloomIterations:3,bloomStrength:.9},mid:{name:"mid",dprCap:1.5,msaa:2,shadows:!0,shadowMapSize:1024,softShadows:!1,propShadows:!1,bloomOccluders:"tagged",rimLight:!0,crackFillLight:!0,texRock:256,texDetail:128,normalMaps:!0,sheenCloth:!1,envSize:128,islandRadialSegments:80,islandProfileSegments:18,plateBevel:!0,plateCurveSegments:6,capsuleSegments:8,rockChunks:4,cloudLayers:2,dustBudget:380,emberBudget:96,debrisPerBurst:4,debrisBudget:56,mergedDebris:!1,decalBudget:12,shockRings:1,footDust:!0,bloom:!0,bloomScale:.25,bloomIterations:2,bloomStrength:.8},low:{name:"low",dprCap:1.25,msaa:0,shadows:!1,shadowMapSize:512,softShadows:!1,propShadows:!1,bloomOccluders:"tagged",rimLight:!0,crackFillLight:!0,texRock:128,texDetail:64,normalMaps:!1,sheenCloth:!1,envSize:64,islandRadialSegments:44,islandProfileSegments:12,plateBevel:!1,plateCurveSegments:3,capsuleSegments:6,rockChunks:2,cloudLayers:1,dustBudget:140,emberBudget:32,debrisPerBurst:2,debrisBudget:20,mergedDebris:!0,decalBudget:4,shockRings:1,footDust:!1,bloom:!1,bloomScale:.125,bloomIterations:0,bloomStrength:0}},tx=["high","mid","low"];function Dc(i){return Aa[i]?i:"mid"}const ev=2;function yi(i){let t=i>>>0;return function(){t|=0,t=t+1831565813|0;let n=Math.imul(t^t>>>15,1|t);return n=n+Math.imul(n^n>>>7,61|n)^n,((n^n>>>14)>>>0)/4294967296}}function Uc(i){return i*i*i*(i*(i*6-15)+10)}function Ao(i,t,e){return i+(t-i)*e}function rn(i){const t=yi(i),e=256,n=e-1,s=new Float32Array(e*e);for(let r=0;r<s.length;r++)s[r]=t();return function(o,a){const l=Math.floor(o),c=Math.floor(a),u=Uc(o-l),h=Uc(a-c),d=l&n,f=l+1&n,g=(c&n)*e,v=(c+1&n)*e,m=s[g+d],p=s[g+f],y=s[v+d],M=s[v+f];return Ao(Ao(m,p,u),Ao(y,M,u),h)}}function oe(i,t,e,n=4,s=.5){let r=0,o=1,a=0,l=t,c=e;for(let u=0;u<n;u++)r+=i(l,c)*o,a+=o,o*=s,l*=2,c*=2;return r/a}function Rs(i,t,e,n=4){let s=0,r=1,o=0,a=t,l=e;for(let c=0;c<n;c++){const u=1-Math.abs(i(a,l)*2-1);s+=u*u*r,o+=r,r*=.45,a*=2.07,l*=2.03}return s/o}function Nc(i,t){const e=Math.min(1,Math.max(0,i));return e<.5?.5*Math.pow(e*2,t):1-.5*Math.pow((1-e)*2,t)}function ve(i,t,e){const n=Math.min(1,Math.max(0,(e-i)/(t-i)));return n*n*(3-2*n)}const nv=`
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
`,iv=`
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
`;function Ps({scene:i,budget:t,texture:e,blending:n,depthWrite:s,renderOrder:r}){const o=Math.max(1,Math.floor(t)),a=new Float32Array(o*3),l=new Float32Array(o),c=new Float32Array(o),u=new Float32Array(o),h=new Float32Array(o*3),d=new ye,f=new Zt(a,3).setUsage(Le),g=new Zt(l,1).setUsage(Le),v=new Zt(c,1).setUsage(Le),m=new Zt(u,1).setUsage(Le),p=new Zt(h,3).setUsage(Le);d.setAttribute("position",f),d.setAttribute("aSize",g),d.setAttribute("aAlpha",v),d.setAttribute("aRot",m),d.setAttribute("aColor",p),d.setDrawRange(0,0);const y=new Ee({vertexShader:nv,fragmentShader:iv,transparent:!0,depthWrite:!1,blending:n,uniforms:{uMap:{value:e},uPixelScale:{value:520},uFogColor:{value:new ut(Ut.fog)},uFogAmount:{value:n===qi?.2:1}}}),M=new lg(d,y);return M.frustumCulled=!1,M.renderOrder=r??3,i.add(M),{points:M,geo:d,mat:y,budget:o,count:0,vel:new Float32Array(o*3),life:new Float32Array(o),maxLife:new Float32Array(o),spin:new Float32Array(o),grow:new Float32Array(o),drag:new Float32Array(o),baseSize:new Float32Array(o),baseAlpha:new Float32Array(o),arrays:{pos:a,size:l,alpha:c,rot:u,color:h},attrs:{posAttr:f,sizeAttr:g,alphaAttr:v,rotAttr:m,colorAttr:p},dispose(){i.remove(M),d.dispose(),y.dispose()}}}function el(i,t){const e=i.count-1;if(t!==e){const n=i.arrays;for(let s=0;s<3;s++)n.pos[t*3+s]=n.pos[e*3+s],n.color[t*3+s]=n.color[e*3+s],i.vel[t*3+s]=i.vel[e*3+s];n.size[t]=n.size[e],n.alpha[t]=n.alpha[e],n.rot[t]=n.rot[e],i.life[t]=i.life[e],i.maxLife[t]=i.maxLife[e],i.spin[t]=i.spin[e],i.grow[t]=i.grow[e],i.drag[t]=i.drag[e],i.baseSize[t]=i.baseSize[e],i.baseAlpha[t]=i.baseAlpha[e]}i.count=e}function Ar(i,t,e,n,s,r=Math.random){if(i.count>=i.budget)return-1;const o=i.count++,a=i.arrays;return a.pos[o*3]=t,a.pos[o*3+1]=e,a.pos[o*3+2]=n,i.vel[o*3]=s.vx,i.vel[o*3+1]=s.vy,i.vel[o*3+2]=s.vz,i.life[o]=0,i.maxLife[o]=s.life,i.spin[o]=s.spin,i.grow[o]=s.grow,i.drag[o]=s.drag,i.baseSize[o]=s.size,i.baseAlpha[o]=s.alpha,a.size[o]=s.size,a.alpha[o]=s.alpha,a.rot[o]=s.rot??r()*Math.PI*2,a.color[o*3]=s.color.r,a.color[o*3+1]=s.color.g,a.color[o*3+2]=s.color.b,o}function nl(i){i.geo.setDrawRange(0,i.count),i.count>0&&(i.attrs.posAttr.needsUpdate=!0,i.attrs.sizeAttr.needsUpdate=!0,i.attrs.alphaAttr.needsUpdate=!0,i.attrs.rotAttr.needsUpdate=!0,i.attrs.colorAttr.needsUpdate=!0),i.points.visible=i.count>0}const sv=1,Xe=Math.PI*2,Un=Math.PI/2,rv=Object.freeze({cotton:"fanwake",granite:"slab",gale:"gust",frost:"rime",spring:"recoil",afterimage:"phase",magnet:"flux",meteor:"cinder"}),ov=Object.freeze({quake_slam:"slab",wind_rush:"gust",frost_arc:"rime",coil_counter:"recoil",phantom_swap:"phase",iron_pull:"flux",sky_fall:"cinder"});function Vu(i){return rv[i]??"fanwake"}function av(i,t){return ov[i]??Vu(t)}const lv=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,cv=`
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
`,uv=`
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
`;function Co(i,t,e){return i<t?t:i>e?e:i}function Fe(i,t,e){return i.clone().lerp(t,e)}function hv({scene:i,quality:t,textures:e,seed:n=90210}){const s=yi(n+4409),r=t.name==="low",o=t.name==="mid",a=r?.4:o?.72:1,l=new ge;l.name="combat-vfx",i.add(l);const c=Ps({scene:l,budget:Math.max(64,Math.round(t.dustBudget*.4)),texture:(e==null?void 0:e.dust)??null,blending:Ge,depthWrite:!1,renderOrder:3}),u=Ps({scene:l,budget:Math.max(16,Math.round(t.emberBudget*.45)),texture:(e==null?void 0:e.ember)??null,blending:qi,depthWrite:!1,renderOrder:4});t.bloom&&(u.points.layers.enable(sv),u.points.userData.bloomSelf=!0);const h=new Float32Array(c.budget),d=new Float32Array(u.budget);function f(S,B,Z,H){const nt=Ar(c,S,B,Z,H,s);return nt>=0&&(h[nt]=H.gravity??-1.1),nt}function g(S,B,Z,H){const nt=Ar(u,S,B,Z,H,s);return nt>=0&&(d[nt]=H.gravity??-2.2),nt}function v(S,B,Z,H){const nt=S.arrays;for(let tt=S.count-1;tt>=0;tt--){S.life[tt]+=Z;const A=S.life[tt]/S.maxLife[tt];if(A>=1){const ot=S.count-1;tt!==ot&&(B[tt]=B[ot]),el(S,tt);continue}const w=Math.exp(-S.drag[tt]*Z);if(S.vel[tt*3]*=w,S.vel[tt*3+2]*=w,S.vel[tt*3+1]=S.vel[tt*3+1]*w+B[tt]*Z,nt.pos[tt*3]+=S.vel[tt*3]*Z,nt.pos[tt*3+1]+=S.vel[tt*3+1]*Z,nt.pos[tt*3+2]+=S.vel[tt*3+2]*Z,!H&&nt.pos[tt*3+1]<.04&&S.vel[tt*3+1]<0&&(nt.pos[tt*3+1]=.04,S.vel[tt*3+1]=0,S.vel[tt*3]*=.84,S.vel[tt*3+2]*=.84),nt.rot[tt]+=S.spin[tt]*Z,nt.size[tt]=S.baseSize[tt]+S.grow[tt]*A,H){const ot=H(A);nt.color[tt*3]=ot.r,nt.color[tt*3+1]=ot.g,nt.color[tt*3+2]=ot.b,nt.alpha[tt]=S.baseAlpha[tt]*(1-A*A)}else{const ot=Math.min(1,A/.1);nt.alpha[tt]=S.baseAlpha[tt]*ot*(1-A)*(1-A*.35)}}nl(S)}const m=r?14:o?30:52,p=new wn(.075,0),y=new se({color:16777215,roughness:.94,metalness:.05,flatShading:!0,envMapIntensity:.25,vertexColors:!1}),M=new sn(p,y,m);M.instanceMatrix.setUsage(Le),M.castShadow=t.shadows,M.frustumCulled=!1,M.count=0,l.add(M);const _=[],X=new Jt,R=new ut;function L(S){if(_.length>=m)return null;const B={p:new O(S.x,S.y,S.z),v:new O(S.vx??0,S.vy??0,S.vz??0),target:S.target?S.target.clone():null,rot:new O(s()*Xe,s()*Xe,s()*Xe),spin:new O((s()-.5)*8,(s()-.5)*8,(s()-.5)*8),sx:S.sx??1,sy:S.sy??1,mode:S.mode??"scatter",life:0,maxLife:S.life??1.4,color:(S.color??R.set(Ut.rockBody)).clone()};return _.push(B),B}function D(S){if(_.length===0){M.count!==0&&(M.count=0,M.visible=!1);return}for(let Z=_.length-1;Z>=0;Z--){const H=_[Z];if(H.life+=S,H.life>=H.maxLife){_.splice(Z,1);continue}if(H.mode==="converge"&&H.target){const nt=Math.min(1,S*7.5);H.p.lerp(H.target,nt),H.spin.multiplyScalar(1+S*2)}else H.mode==="rise"?(H.p.y+=H.v.y*S,H.v.y*=Math.exp(-6*S)):(H.v.y-=20*S,H.p.addScaledVector(H.v,S),H.p.y<.06&&(H.p.y=.06,H.v.y*=-.3,H.v.x*=.6,H.v.z*=.6,H.spin.multiplyScalar(.5)),H.rot.x+=H.spin.x*S,H.rot.y+=H.spin.y*S,H.rot.z+=H.spin.z*S)}const B=Math.min(_.length,m);for(let Z=0;Z<B;Z++){const H=_[Z],nt=H.life/H.maxLife,tt=1-Math.max(0,(nt-.62)/.38),A=H.mode==="rise"?Math.min(1,nt/.22):1;X.position.copy(H.p),X.rotation.set(H.rot.x,H.rot.y,H.rot.z),X.scale.set(H.sx*tt,H.sy*tt*A,H.sx*tt),X.updateMatrix(),M.setMatrixAt(Z,X.matrix),M.setColorAt(Z,H.color)}M.count=B,M.visible=B>0,M.instanceMatrix.needsUpdate=!0,M.instanceColor&&(M.instanceColor.needsUpdate=!0)}const E={fanwake:new mi(.22,1,22,1,-1.15,2.3),gust:new mi(.34,1,30,1,-1,2),rime:new mi(.4,1,30,1,-1.65,3.3),phase:new mi(.55,1,18,1,-.85,1.7)},x={slab:new be(.9,.06,1.05,4,1,!0),recoil:new Ze(.72,.055,4,26),flux:new Ze(.92,.04,3,30,Math.PI*1.45),cinder:new Ur(.6,1.6,10,1,!0)},I=[...Object.values(E),...Object.values(x)],G=r?3:o?5:7,V=E.fanwake;function T(S){const B=new Ee({vertexShader:lv,fragmentShader:S,transparent:!0,depthWrite:!1,side:Ie,blending:Ge,uniforms:{uNoise:{value:(e==null?void 0:e.turbulence)??null},uColorLit:{value:new ut(Ut.rockTop)},uColorDark:{value:new ut(Ut.fog)},uLife:{value:0},uOpacity:{value:.6},uTear:{value:.24},uFlow:{value:.5},uInner:{value:.2},uSweep:{value:0}}}),Z=new ge,H=new ge;H.rotation.order="YXZ";const nt=new Yt(V,B);return H.add(nt),Z.add(H),Z.visible=!1,Z.renderOrder=2,l.add(Z),{holder:Z,orient:H,mesh:nt,mat:B,t:-1,dur:.3,spec:null,power:1,phase:0}}const U=Array.from({length:G},()=>{const S=T(cv);return S.family="sheet",S}),k=Array.from({length:G},()=>{const S=T(uv);return S.family="band",S}),b=new ut(Ut.grime).lerp(new ut(Ut.rockBody),.45),P=new ut(Ut.rockTop).lerp(new ut(Ut.keyLight),.25),q=new ut(Ut.rockBody),et=new ut(16773327),$=new ut(Ut.crackDeep),pt=S=>R.copy(et).lerp($,Math.min(1,S*1.5)),Y=new ut;function K(S,B){return Y.copy(b).lerp(P,.25+s()*.6).lerp(S,B)}function z(S,B){return Math.max(1,Math.round(S*a*Co(B,.4,2)))}const lt={fanwake:{family:"sheet",geo:"fanwake",dur:.44,shells:1,uniforms:{uTear:.16,uFlow:.35,uInner:.2,uOpacity:.44},color:S=>({lit:Fe(new ut(16773853),S,.3),dark:Fe(new ut(Ut.fog),S,.15)}),pose(S){S.orient.rotation.set(-Un+.34,Un,0)},animate(S,B,Z){const H=1-Math.pow(1-B,2.2),nt=(.72+H*1.15)*Z;S.mesh.scale.set(nt,nt,nt),S.holder.position.y=S.baseY+H*.05,S.orient.rotation.z=.28-H*.5},burst(S){for(let B=0;B<z(7,S.power);B++){const Z=(s()-.5)*1.9,H=Math.sin(Z),nt=Math.cos(Z),tt=S.dir.x*nt-S.dir.z*H,A=S.dir.x*H+S.dir.z*nt;f(S.at.x+tt*.5,S.at.y+(s()-.4)*.4,S.at.z+A*.5,{vx:tt*(1+s()),vy:.25+s()*.4,vz:A*(1+s()),life:1.5+s()*1.4,spin:(s()-.5)*.6,grow:.9+s()*.7,drag:1.6,size:.24+s()*.24,alpha:.18+s()*.14,gravity:.04,color:B%5===0?Y.copy(S.tint):K(S.tint,.05)})}}},slab:{family:"band",geo:"slab",dur:.32,shells:1,uniforms:{uTear:.3,uFlow:.2,uSweep:0,uOpacity:.6},color:S=>({lit:Fe(new ut(Ut.rockFresh),S,.28),dark:Fe(new ut(Ut.rockDeep),S,.12)}),pose(S){S.orient.rotation.set(-Un,0,Math.PI*.25)},animate(S,B,Z){const H=B<.4?Math.pow(B/.4,.55):1;S.mesh.position.y=H*.95*Z;const nt=(.55+H*.75)*Z;S.mesh.scale.set(nt,.9+H*.45,nt)},burst(S){for(let B=0;B<z(4,S.power);B++){const Z=s()*Xe,H=(2+s()*3.4)*S.power;L({x:S.at.x+S.dir.x*.6,y:Math.max(.15,S.at.y-.3),z:S.at.z+S.dir.z*.6,vx:Math.cos(Z)*H*.5+S.dir.x*H*.5,vy:2.5+s()*3.5,vz:Math.sin(Z)*H*.5+S.dir.z*H*.5,sx:.7+s()*.8,sy:.7+s()*.8,life:1.1+s()*.8,color:Y.copy(q).lerp(S.tint,.14)})}for(let B=0;B<z(8,S.power);B++){const Z=s()*Xe;f(S.at.x+S.dir.x*.7,.1+s()*.3,S.at.z+S.dir.z*.7,{vx:Math.cos(Z)*2.6*S.power,vy:.5+s()*.7,vz:Math.sin(Z)*2.6*S.power,life:1.1+s()*1.1,spin:(s()-.5)*1.6,grow:2+s()*1.6,drag:2.4,size:.3+s()*.4,alpha:.26+s()*.2,gravity:-.9,color:K(S.tint,.04)})}}},gust:{family:"sheet",geo:"gust",dur:.36,shells:2,uniforms:{uTear:.12,uFlow:1.5,uInner:.3,uOpacity:.62},color:S=>({lit:Fe(new ut(15135983),S,.34),dark:Fe(new ut(Ut.fog),S,.2)}),pose(S){S.orient.rotation.set(.34,0,-Un),S.baseY=Math.min(S.baseY,.72),S.holder.position.y=S.baseY},animate(S,B,Z){const H=S.phase*.16,nt=Co((B-H)/(1-H),0,1),tt=Math.pow(nt,.55);S.holder.position.x=S.baseX+S.dirX*tt*2.6*Z,S.holder.position.z=S.baseZ+S.dirZ*tt*2.6*Z,S.holder.position.y=S.baseY-tt*.12;const A=(1+tt*.42)*Z;S.mesh.scale.set(A,(.95+tt*1.05)*Z,1),S.orient.position.y=.56*A},burst(S){for(let B=0;B<z(6,S.power);B++){const Z=s()<.5?-1:1,H=-S.dir.z*Z*(.2+s()*.6),nt=S.dir.x*Z*(.2+s()*.6);f(S.at.x+H,.12+s()*.5,S.at.z+nt,{vx:S.dir.x*(5+s()*4)+H,vy:.15+s()*.25,vz:S.dir.z*(5+s()*4)+nt,life:.42+s()*.3,spin:3,grow:.5,drag:2.2,size:.1+s()*.12,alpha:.3,gravity:-.2,color:B%6===0?Y.copy(S.tint):K(S.tint,.06)})}}},rime:{family:"sheet",geo:"rime",dur:.62,shells:1,uniforms:{uTear:.14,uFlow:.22,uInner:.36,uOpacity:.4},color:S=>({lit:Fe(new ut(15398655),S,.38),dark:Fe(new ut(Ut.cloudShadow),S,.18)}),pose(S){S.orient.rotation.set(-Un,Un,0),S.baseY=.42,S.holder.position.y=S.baseY},animate(S,B,Z){const nt=(.7+(1-Math.pow(1-B,3))*1.5)*Z;S.mesh.scale.set(nt,nt,nt)},burst(S){for(let B=0;B<z(3,S.power);B++){const Z=(s()-.5)*2.6,H=Math.sin(Z),nt=Math.cos(Z),tt=.9+s()*.9;L({x:S.at.x+(S.dir.x*nt-S.dir.z*H)*tt,y:.06,z:S.at.z+(S.dir.x*H+S.dir.z*nt)*tt,vy:1.6+s(),sx:.42+s()*.25,sy:2.1+s()*1.6,mode:"rise",life:1.5+s()*1.2,color:Y.set(13625074).lerp(S.tint,.3)})}for(let B=0;B<z(6,S.power);B++){const Z=s()*Xe;f(S.at.x+Math.cos(Z)*.6,.3+s()*.5,S.at.z+Math.sin(Z)*.6,{vx:Math.cos(Z)*.8,vy:-.12,vz:Math.sin(Z)*.8,life:1.8+s()*1.4,spin:(s()-.5)*.3,grow:1.1+s()*.8,drag:1.5,size:.26+s()*.3,alpha:.13+s()*.1,gravity:-.18,color:Y.set(14478582).lerp(b,.4)})}}},recoil:{family:"band",geo:"recoil",dur:.4,shells:2,uniforms:{uTear:.22,uFlow:.8,uSweep:0,uOpacity:.5},color:S=>({lit:Fe(new ut(Ut.metalWarm),S,.34),dark:Fe(new ut(Ut.rockDeep),S,.1)}),pose(S){S.orient.rotation.set(-Un,0,0)},animate(S,B,Z){const H=S.phase===0,nt=H?1-Math.pow(1-B,2.6):Math.pow(B,1.9),tt=(H?.4+nt*1.5:1.7-nt*1.35)*Z;S.mesh.scale.set(tt,tt,1),S.mesh.rotation.z=B*(H?4.5:-6.5),S.holder.position.y=S.baseY+(H?nt*.1:-nt*.15)},burst(S){for(let B=0;B<z(7,S.power);B++){const Z=s()*Xe;f(S.at.x+Math.cos(Z)*.35,.08+s()*.2,S.at.z+Math.sin(Z)*.35,{vx:Math.cos(Z)*(2.8+s()*2),vy:1.1+s()*1.2,vz:Math.sin(Z)*(2.8+s()*2),life:.8+s()*.7,spin:(s()-.5)*2,grow:1.2,drag:2.8,size:.16+s()*.18,alpha:.24,gravity:-1.4,color:K(S.tint,.05)})}if(!r)for(let B=0;B<z(2,S.power);B++){const Z=s()*Xe;g(S.at.x,S.at.y,S.at.z,{vx:Math.cos(Z)*2.4,vy:1.8+s()*2,vz:Math.sin(Z)*2.4,life:.4+s()*.3,spin:0,grow:-.03,drag:.7,size:.05+s()*.04,alpha:.8,gravity:-3,color:et})}}},phase:{family:"sheet",geo:"phase",dur:.5,shells:2,uniforms:{uTear:.1,uFlow:.12,uInner:.52,uOpacity:.28},color:S=>({lit:Fe(new ut(10133688),S,.42),dark:Fe(new ut(2564404),S,.16)}),pose(S){S.orient.rotation.set(0,0,Un)},animate(S,B,Z){const H=S.phase===0?1:-1,nt=1-Math.pow(1-B,2);S.holder.position.x=S.baseX-S.dirZ*H*nt*1.15*Z,S.holder.position.z=S.baseZ+S.dirX*H*nt*1.15*Z;const tt=(1+nt*.25)*Z;S.mesh.scale.set(tt,tt,tt)},burst(S){for(let B=0;B<z(3,S.power);B++){const Z=s()*Xe;f(S.at.x+Math.cos(Z)*.5,S.at.y+(s()-.5)*.6,S.at.z+Math.sin(Z)*.5,{vx:Math.cos(Z)*.5,vy:.1,vz:Math.sin(Z)*.5,life:.9+s()*.6,spin:(s()-.5)*.8,grow:.5,drag:1.8,size:.14+s()*.12,alpha:.14,gravity:-.3,color:Y.set(3814472).lerp(S.tint,.25)})}}},flux:{family:"band",geo:"flux",dur:.42,shells:2,uniforms:{uTear:.18,uFlow:1.8,uSweep:1,uOpacity:.5},color:S=>({lit:Fe(new ut(16766658),S,.42),dark:Fe(new ut(Ut.rockDeep),S,.14)}),pose(S){S.orient.rotation.set(-Un+(S.phase===0?.25:-.3),0,S.phase*1.3)},animate(S,B,Z){const nt=(1.7-(1-Math.pow(1-B,2.2))*1.25)*Z;S.mesh.scale.set(nt,nt,nt),S.mesh.rotation.z=B*3.4*(S.phase===0?1:-1)},burst(S){const B=new O(S.at.x,S.at.y,S.at.z);for(let Z=0;Z<z(5,S.power);Z++){const H=s()*Xe,nt=1.4+s()*1.1;L({x:S.at.x+Math.cos(H)*nt,y:.1+s()*.8,z:S.at.z+Math.sin(H)*nt,target:B,mode:"converge",sx:.45+s()*.3,sy:.45+s()*.3,life:.5+s()*.3,color:Y.copy(q).lerp(S.tint,.4)})}for(let Z=0;Z<z(4,S.power);Z++){const H=s()*Xe,nt=1.2+s()*.9,tt=Math.cos(H)*nt,A=Math.sin(H)*nt;f(S.at.x+tt,.15+s()*.6,S.at.z+A,{vx:-tt*2.4,vy:.4,vz:-A*2.4,life:.5+s()*.3,spin:3,grow:-.04,drag:.5,size:.08+s()*.07,alpha:.42,gravity:.2,color:K(S.tint,.18)})}}},cinder:{family:"band",geo:"cinder",dur:.46,shells:1,uniforms:{uTear:.24,uFlow:.9,uSweep:0,uOpacity:.55},color:S=>({lit:Fe(new ut(Ut.crackCore),S,.3),dark:Fe(new ut(Ut.grime),S,.12)}),pose(S){S.orient.rotation.set(0,0,0)},animate(S,B,Z){const H=Math.min(1,B/.34),nt=1-Math.pow(1-H,2.6);S.holder.position.y=S.baseY+(1-nt)*2.4;const tt=B<.34?0:(B-.34)/.66;S.mesh.scale.set((.8+tt*1.5)*Z,(1-tt*.72)*Z,(.8+tt*1.5)*Z)},burst(S){for(let B=0;B<z(4,S.power);B++){const Z=s()*Xe;g(S.at.x+Math.cos(Z)*.3,Math.max(.1,S.at.y-.4),S.at.z+Math.sin(Z)*.3,{vx:Math.cos(Z)*(1.4+s()*2),vy:2.2+s()*3,vz:Math.sin(Z)*(1.4+s()*2),life:.7+s()*.8,spin:0,grow:-.04,drag:.5,size:.06+s()*.06,alpha:.9,gravity:-2.4,color:et})}for(let B=0;B<z(3,S.power);B++){const Z=s()*Xe,H=(1.5+s()*3)*S.power;L({x:S.at.x,y:Math.max(.15,S.at.y-.3),z:S.at.z,vx:Math.cos(Z)*H,vy:3+s()*3,vz:Math.sin(Z)*H,sx:.6+s()*.7,sy:.6+s()*.7,life:1.2+s()*.8,color:Y.copy(q).lerp(new ut(Ut.crackDeep),.25)})}for(let B=0;B<z(5,S.power);B++){const Z=s()*Xe;f(S.at.x+Math.cos(Z)*.5,.1+s()*.4,S.at.z+Math.sin(Z)*.5,{vx:Math.cos(Z)*2.2,vy:.7+s()*.6,vz:Math.sin(Z)*2.2,life:1.4+s()*1.2,spin:(s()-.5)*1.4,grow:1.8,drag:2,size:.24+s()*.3,alpha:.24,gravity:-.8,color:K(S.tint,.06)})}}}},j=Object.freeze(Object.keys(lt)),mt=new O,At=new ut;function Rt(S){const B=S==="sheet"?U:k;return B.find(Z=>Z.t<0)??B[0]}function Ht(S){return S.family==="sheet"?E[S.geo]:x[S.geo]}function xt(S,B,Z){const H=Rt(S.family);H.t=0,H.dur=S.dur*(Z.skill?1.35:1),H.spec=S,H.phase=B,H.power=Z.power,H.mesh.geometry=Ht(S),H.holder.visible=!0,H.holder.position.copy(Z.at),H.holder.rotation.set(0,Math.atan2(-Z.dir.x,-Z.dir.z),0),H.baseX=Z.at.x,H.baseY=Z.at.y,H.baseZ=Z.at.z,H.dirX=Z.dir.x,H.dirZ=Z.dir.z,H.mesh.position.set(0,0,0),H.mesh.rotation.set(0,0,0),H.mesh.scale.set(1,1,1),H.orient.position.set(0,0,0),S.pose(H);const nt=S.color(Z.tint);H.mat.uniforms.uColorLit.value.copy(nt.lit),H.mat.uniforms.uColorDark.value.copy(nt.dark),H.mat.uniforms.uLife.value=0;for(const[tt,A]of Object.entries(S.uniforms))H.mat.uniforms[tt]&&(H.mat.uniforms[tt].value=A);H.mat.uniforms.uOpacity.value=(S.uniforms.uOpacity??.5)*(Z.whiff?.6:1)*(Z.skill?1.15:1),S.animate(H,0,Z.power)}const Et={group:l,kinds:j,strike(S,B,Z,H=1,nt={}){const tt=lt[S]??lt.fanwake,A=Co(H,.4,2.4);mt.copy(Z??mt.set(0,0,-1)),mt.y=0,mt.lengthSq()<1e-6&&mt.set(0,0,-1),mt.normalize();const w=nt.tint instanceof ut?At.copy(nt.tint):At.set(Number.isFinite(nt.tint)?nt.tint:kr),ot={at:B,dir:mt,tint:w,power:A*(nt.skill?1.25:1),skill:!!nt.skill,whiff:!!nt.whiff},yt=r?1:tt.shells;for(let J=0;J<yt;J++)xt(tt,J,ot);return nt.whiff||tt.burst(ot),tt},update(S){for(const B of U)N(B,S);for(const B of k)N(B,S);v(c,h,S,null),v(u,d,S,pt),D(S)},setPixelScale(S){c.mat.uniforms.uPixelScale.value=S,u.mat.uniforms.uPixelScale.value=S},getStats(){return{shells:U.concat(k).filter(S=>S.t>=0).length,bits:_.length,particles:c.count+u.count}},dispose(){c.dispose(),u.dispose();for(const S of[...U,...k])S.mat.dispose(),l.remove(S.holder);for(const S of I)S.dispose();p.dispose(),y.dispose(),_.length=0,i.remove(l)}};function N(S,B){if(!(S.t<0)){if(S.t+=B/S.dur,S.t>=1){S.t=-1,S.holder.visible=!1;return}S.mat.uniforms.uLife.value=S.t,S.spec.animate(S,S.t,S.power)}}return Et}const Ca=Object.freeze(["wrap","bracer","pauldron","cloak","hood","turban","sash","horns","mask","banner"]),Fc=new Set(Ca),Oc=Object.freeze({wildhorn:{id:"wildhorn",build:{height:1.05,mass:1.32,shoulder:1.36},accessory:"horns",cloth:"#5c4632",trim:"#241a12",accent:"#d7b078"},crane:{id:"crane",build:{height:1.15,mass:.76,shoulder:.86},accessory:"banner",cloth:"#41576c",trim:"#1c2733",accent:"#dde6ee"},nuo:{id:"nuo",build:{height:.96,mass:1.02,shoulder:1.04},accessory:"mask",cloth:"#5f333b",trim:"#26161a",accent:"#e7d6b2"}}),Qn=Object.freeze({id:null,build:Object.freeze({height:1,mass:1,shoulder:1}),accessory:"wrap",cloth:"#6d7280",trim:"#3d4450",accent:"#d9cfba"});function Ro(i,t){return Number.isFinite(i)?i:t}function Po(i,t,e){return i<t?t:i>e?e:i}function fv(i){let t=2166136261;const e=String(i??"");for(let n=0;n<e.length;n++)t^=e.charCodeAt(n),t=Math.imul(t,16777619)>>>0;return t>>>0}function Wu(i){const t=fv(i);return{id:i,build:{height:.9+(t>>>3)%9*.03,mass:.8+(t>>>9)%10*.05,shoulder:.86+(t>>>15)%10*.055},accessory:Ca[t%Ca.length],cloth:Qn.cloth,trim:Qn.trim,accent:Qn.accent}}function dv(i,t){const e=i&&typeof i=="object"?i:{};return{height:Po(Ro(e.height,t.height),.82,1.22),mass:Po(Ro(e.mass,t.mass),.72,1.38),shoulder:Po(Ro(e.shoulder,t.shoulder),.8,1.45)}}function pv(i,t){if(i&&Fc.has(i.accessory))return i.accessory;const e=i&&i.headgear;if(e==="hood"||e==="horns"||e==="mask")return e;const n=i&&i.back;if(n==="banner")return"banner";if(n==="pack")return"sash";if(e==="topknot"||e==="strawHat")return"turban";const s=t&&t.accessory;return Fc.has(s)?s:"wrap"}function Io(i,t){const e=ju(i),n=Wu(e.id??t),s=e.palette||{};return{id:e.id??t,build:dv(e.build,n.build),accessory:pv(e,n),cloth:typeof s.cloth=="string"?s.cloth:Qn.cloth,trim:typeof s.clothDim=="string"?s.clothDim:Qn.trim,accent:typeof s.accent=="string"?s.accent:Qn.accent}}function il(i=null){return $u(i)}function mv(i,t){const e=t||il(null),n=typeof i=="string"&&i.trim().length>0?i:null;if(n&&e.byId&&e.byId[n])return{...Io(e.byId[n],n),source:e.source??"fallback"};if(n&&Oc[n])return{...Io(Oc[n],n),source:"extra"};if(n)return{...Wu(n),source:"synth"};const s=e.defaultId??null;return s&&e.byId&&e.byId[s]?{...Io(e.byId[s],s),source:"default"}:{...Qn,build:{...Qn.build},source:"default"}}const Lo="p0";function gv(i){return{x:-Math.sin(i),z:-Math.cos(i)}}const vv=20,_v=2.5,xv=9;function Bt(i,t=0){return Number.isFinite(i)?i:t}function Xu(i,t,e){return i<t?t:i>e?e:i}function Mv(i){if(Number.isFinite(i))return i>>>0;if(typeof i!="string")return null;const t=i.trim().replace(/^#/,"");return/^[0-9a-fA-F]{6}$/.test(t)?Number.parseInt(t,16):null}function Mr(i,t){return Mv(t)??tv[i]??kr}function yv(i,t={}){var r;const e=Array.isArray(i==null?void 0:i.players)?i.players.filter(Boolean):[],n=o=>o!=null&&e.some(a=>a.id===o);if(n(t.localId))return t.localId;if(n(i==null?void 0:i.localId))return i.localId;if(n(i==null?void 0:i.selfId))return i.selfId;if(n(i==null?void 0:i.playerId))return i.playerId;if(n(t.followId))return t.followId;const s=e.find(o=>o.kind==="human"||o.isLocal===!0);return s?s.id:n(Lo)?Lo:((r=e[0])==null?void 0:r.id)??Lo}function Sv(i){var r;const t=(i==null?void 0:i.arena)??{},e=Bt(t.radius,Bt(i==null?void 0:i.arenaRadius,Bt((r=i==null?void 0:i.config)==null?void 0:r.arenaRadius,vv))),n=Bt(t.tileSize,_v),s=Bt(t.cols,Math.ceil(e*2/n));return{radius:e,tileSize:n,cols:s,origin:Bt(t.origin,-(s*n)/2),floorY:Bt(t.floorY,0),brokenCount:Bt(t.brokenCount,0)}}function wv(i){return i.alive===!1||i.broken===!0||i.destroyed===!0?!0:Bt(i.hp,1)<=0}function bv(i,t){var s;const e=((s=i==null?void 0:i.arena)==null?void 0:s.tiles)??(i==null?void 0:i.tiles);if(!Array.isArray(e))return[];const n=[];for(let r=0;r<e.length;r++){const o=e[r];if(!o||typeof o!="object"||!Number.isFinite(o.x))continue;const a=Number.isFinite(o.i)?o.i:r,l=Bt(o.maxHp,Bt(o.hpMax,1)),c=Bt(o.hp,l),u=wv(o);n.push({key:String(o.id??a),index:a,x:o.x,z:Bt(o.z,Bt(o.y,0)),size:Bt(o.size,t.tileSize),seam:o.seam===!0,zone:Bt(o.zone,0),hp:c,maxHp:l,crack:u?1:Xu(Number.isFinite(o.crack)?o.crack:1-c/Math.max(l,1e-6),0,1),broken:u})}return n}function Ev(i){const t=Array.isArray(i==null?void 0:i.players)?i.players:[],e=[];for(const n of t){if(!n||n.id==null)continue;const s=n.activeGloveId??n.gloveId??null,r=Bt(n.activeSlot,0),o=n.gloveId??s,a=n.offhandId??s;e.push({id:n.id,kind:n.kind??"bot",skinId:typeof n.skinId=="string"&&n.skinId.length>0?n.skinId:null,x:Bt(n.x),y:Bt(n.y),z:Bt(n.z),yaw:Bt(n.yaw),speed:Bt(n.speed,Math.hypot(Bt(n.vx),Bt(n.vz))),alive:n.alive!==!1,grounded:n.grounded!==!1,invulnT:Bt(n.invulnT),respawnT:Bt(n.respawnT),awakenedT:Bt(n.awakenedT),awakened:n.awakened===!0||Bt(n.awakenedT)>0,meter:Bt(n.meter),combo:Bt(n.combo),attackPhase:n.attackPhase??n.phase??"idle",activeSlot:r,mainId:o,offhandId:a,activeGloveId:s,tint:Mr(s,n.gloveColor??n.color),mainTint:Mr(o,r===0?n.gloveColor??n.color:null),offTint:Mr(a,r===1?n.gloveColor??n.color:null)})}return e}function Tv(i){var n;const t=Array.isArray((n=i==null?void 0:i.combat)==null?void 0:n.ghosts)?i.combat.ghosts:Array.isArray(i==null?void 0:i.ghosts)?i.ghosts:[],e=[];for(const s of t){if(!s||typeof s!="object"||!Number.isFinite(s.x)||!Number.isFinite(s.z))continue;const r=Math.max(0,Bt(s.ttl));e.push({id:s.id??null,ownerId:s.ownerId??null,x:s.x,y:Bt(s.y),z:s.z,yaw:Bt(s.yaw),ttl:r,ttl0:Math.max(r,Bt(s.ttl0,r)),fake:s.fake===!0,gloveId:typeof s.gloveId=="string"?s.gloveId:null})}return e}const ui={halfWidth:7.5,length:39,portalRadius:2.4,interactRadius:2,pedestalRadius:.6,pedestalHeight:.95};function Yu(i){const t=typeof(i==null?void 0:i.phase)=="string"?i.phase.trim().toLowerCase():null;return t==="hub"||t==="arena"?t:null}function Av(i,t){const e=Array.isArray(i==null?void 0:i.pedestals)?i.pedestals:[],n=[];for(let s=0;s<e.length;s++){const r=e[s];if(!r||typeof r!="object")continue;const o=typeof r.gloveId=="string"?r.gloveId:null;if(!o)continue;const l=(r.slot==="main"||r.slot==="off"?r.slot:null)??(o===t.mainGloveId?"main":o===t.offGloveId?"off":null);n.push({gloveId:o,x:Bt(r.x),y:Bt(r.y,t.floorY),z:Bt(r.z,t.origin.z),yaw:Bt(r.yaw),row:r.row==="right"?"right":r.row==="left"?"left":r.x>t.origin.x?"right":"left",index:Number.isFinite(r.index)?r.index:Math.floor(s/2),height:Bt(r.height,t.pedestalHeight),unlocked:r.unlocked!==!1,slot:l,selected:r.selected===!0||l!==null,focused:r.focused===!0||t.focusGloveId!=null&&o===t.focusGloveId,name:typeof r.name=="string"?r.name:null,tint:Mr(o,r.color??r.tint)})}return n}function Cv(i){var g,v,m,p,y,M,_,X,R,L,D,E,x,I,G,V;const t=i!=null&&i.hub&&typeof i.hub=="object"?i.hub:null,e=Yu(i),n=!!t&&Array.isArray(t.pedestals)&&t.pedestals.length>0,s=e==="hub"?!0:e==="arena"?!1:n,r={x:Bt((g=t==null?void 0:t.origin)==null?void 0:g.x,0),y:Bt((v=t==null?void 0:t.origin)==null?void 0:v.y,0),z:Bt((m=t==null?void 0:t.origin)==null?void 0:m.z,0)},o=Bt(t==null?void 0:t.floorY,r.y),a=Math.max(1.5,Bt((p=t==null?void 0:t.walkway)==null?void 0:p.halfWidth,ui.halfWidth)),l=Bt((y=t==null?void 0:t.walkway)==null?void 0:y.minZ,r.z-ui.length/2),c=Bt((M=t==null?void 0:t.walkway)==null?void 0:M.maxZ,r.z+ui.length/2),u=Math.max(.2,Bt(t==null?void 0:t.pedestalHeight,ui.pedestalHeight)),h=typeof(t==null?void 0:t.mainGloveId)=="string"?t.mainGloveId:null,d=typeof(t==null?void 0:t.offGloveId)=="string"?t.offGloveId:null,f=typeof(t==null?void 0:t.focusGloveId)=="string"?t.focusGloveId:null;return{active:s,phase:e??(n?"hub":"arena"),layoutId:typeof(t==null?void 0:t.layoutId)=="string"?t.layoutId:null,origin:r,floorY:o,walkway:{halfWidth:a,minZ:Math.min(l,c),maxZ:Math.max(l,c)},spawn:{x:Bt((_=t==null?void 0:t.spawn)==null?void 0:_.x,r.x),y:Bt((X=t==null?void 0:t.spawn)==null?void 0:X.y,o),z:Bt((R=t==null?void 0:t.spawn)==null?void 0:R.z,c-4),yaw:Bt((L=t==null?void 0:t.spawn)==null?void 0:L.yaw,0)},portal:{x:Bt((D=t==null?void 0:t.portal)==null?void 0:D.x,r.x),y:Bt((E=t==null?void 0:t.portal)==null?void 0:E.y,o),z:Bt((x=t==null?void 0:t.portal)==null?void 0:x.z,l+4),radius:Math.max(.8,Bt((I=t==null?void 0:t.portal)==null?void 0:I.radius,ui.portalRadius)),ready:(t==null?void 0:t.portalReady)===!0||((G=t==null?void 0:t.portal)==null?void 0:G.ready)===!0,near:(t==null?void 0:t.portalNear)===!0||((V=t==null?void 0:t.portal)==null?void 0:V.near)===!0},interactRadius:Math.max(.5,Bt(t==null?void 0:t.interactRadius,ui.interactRadius)),pedestalRadius:Math.max(.2,Bt(t==null?void 0:t.pedestalRadius,ui.pedestalRadius)),pedestalHeight:u,focusGloveId:f,mainGloveId:h,offGloveId:d,pedestals:Av(t,{origin:r,floorY:o,pedestalHeight:u,focusGloveId:f,mainGloveId:h,offGloveId:d})}}const Rv={slapstart:"swing",slap:"slap",hit:"hit",skill:"skill",ko:"ko",awaken:"awaken",awakenend:"awakenEnd",dash:"dash",jump:"jump",respawn:"respawn",switch:"switch",tilecrack:"tileCrack",tilebreak:"tileBreak",matchover:"matchOver",slapwindup:"swing",slapwhiff:"slap",ghostslap:"slap",skillcast:"skill",skillhit:"hit",meteorimpact:"heavy",parry:"heavy",kill:"ko"};function Pv(i){return String(i??"").toLowerCase().replace(/[_\-\s]/g,"")}function Iv(i,t){const e=i.power??i.impulse??i.strength??i.damage;return Number.isFinite(e)?Xu(e/xv,.3,2.6):t==="heavy"?1.6:1}function Lv(i){const t=Array.isArray(i==null?void 0:i.events)?i.events:[],e=[];for(const n of t){if(!n)continue;const s=Pv(n.type??n.kind),r=Rv[s]??null;if(!r)continue;let o=n.attackerId??n.playerId??n.ownerId??n.killerId??n.by??n.attacker??n.owner??n.id??null,a=n.targetId??n.target??n.victimId??null;r==="ko"&&(a=n.victimId??n.id??a,o=n.killerId??n.by??null),e.push({kind:r,type:n.type??r,actorId:o,targetId:a,gloveId:n.gloveId??null,skillId:n.skillId??null,tileIndex:Number.isFinite(n.i)?n.i:null,tileId:n.tileId??null,x:Number.isFinite(n.x)?n.x:null,y:Number.isFinite(n.y)?n.y:null,z:Number.isFinite(n.z)?n.z:null,yaw:Number.isFinite(n.yaw)?n.yaw:null,hits:Number.isFinite(n.hits)?n.hits:s==="slapwhiff"?0:null,power:Iv(n,r),t:Bt(n.t,Bt(i==null?void 0:i.time,0))})}return e}function Dv(i,t={}){var s;const e=i&&typeof i=="object"?i:{},n=Sv(e);return{time:Bt(e.time,Bt(e.t,0)),tick:Number.isFinite(e.tick)?e.tick:null,alpha:Bt(e.alpha,1),over:((s=e.match)==null?void 0:s.over)===!0||e.over===!0,localId:yv(e,t),phase:Yu(e),hub:Cv(e),arena:n,tiles:bv(e,n),players:Ev(e),ghosts:Tv(e),events:Lv(e)}}function Cr(i,t=!1){const e=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),s=new Set(Object.keys(i[0].morphAttributes)),r={},o={},a=i[0].morphTargetsRelative,l=new ye;let c=0;for(let u=0;u<i.length;++u){const h=i[u];let d=0;if(e!==(h.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const f in h.attributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;r[f]===void 0&&(r[f]=[]),r[f].push(h.attributes[f]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of attributes."),null;if(a!==h.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const f in h.morphAttributes){if(!s.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+".  .morphAttributes must be consistent throughout all geometries."),null;o[f]===void 0&&(o[f]=[]),o[f].push(h.morphAttributes[f])}if(t){let f;if(e)f=h.index.count;else if(h.attributes.position!==void 0)f=h.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,f,u),c+=f}}if(e){let u=0;const h=[];for(let d=0;d<i.length;++d){const f=i[d].index;for(let g=0;g<f.count;++g)h.push(f.getX(g)+u);u+=i[d].attributes.position.count}l.setIndex(h)}for(const u in r){const h=kc(r[u]);if(!h)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" attribute."),null;l.setAttribute(u,h)}for(const u in o){const h=o[u][0].length;if(h===0)break;l.morphAttributes=l.morphAttributes||{},l.morphAttributes[u]=[];for(let d=0;d<h;++d){const f=[];for(let v=0;v<o[u].length;++v)f.push(o[u][v][d]);const g=kc(f);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" morphAttribute."),null;l.morphAttributes[u].push(g)}}return l}function kc(i){let t,e,n,s=-1,r=0;for(let c=0;c<i.length;++c){const u=i[c];if(t===void 0&&(t=u.array.constructor),t!==u.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=u.itemSize),e!==u.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=u.normalized),n!==u.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=u.gpuType),s!==u.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=u.count*e}const o=new t(r),a=new Se(o,e,n);let l=0;for(let c=0;c<i.length;++c){const u=i[c];if(u.isInterleavedBufferAttribute){const h=l/e;for(let d=0,f=u.count;d<f;d++)for(let g=0;g<e;g++){const v=u.getComponent(d,g);a.setComponent(d+h,g,v)}}else o.set(u.array,l);l+=u.count*e}return s!==void 0&&(a.gpuType=s),a}const gi=Math.PI*2,fr=1,Nn=Object.freeze({duration:.62,windupEnd:.34,strikeEnd:.52}),Uv=.95,Nv=.54,Fv=1.4,Ov=.16,kv=.26,zv=-Math.PI/2;function Bv(i){return-i*(i<0?Uv:Nv)}const Hv=6,Gv=80,Vv=16,Wv=new Set(["hood","turban"]);function zc(i){i.updateWorldMatrix(!0,!0);const t=new Map;i.traverse(n=>{if(!n.isMesh)return;const s=n.userData.matKey??"cloth",r=n.geometry.clone();r.applyMatrix4(n.matrixWorld),t.has(s)||t.set(s,[]),t.get(s).push(r)});const e=new Map;for(const[n,s]of t){if(s.length===1){e.set(n,s[0]);continue}const r=Cr(s,!1);for(const o of s)o.dispose();r&&e.set(n,r)}return e}const Bc=new Tn(new O(0,1.1,0),2.6),Xv=new gn({color:0}),Yv={cloth:"clothSurface",clothDim:"clothSurface",leather:"leatherSurface",leatherWorn:"leatherSurface",skin:"plainSurface",accent:"plainSurface",paint:"paintSurface",paintMain:"paintSurface",paintOff:"paintSurface"},qv=["cloth","clothDim","clothSurface","leather","leatherWorn","leatherSurface","skin","accent","plainSurface"];function re(i,t,e){const n=t[Yv[e]]??t[e],s=new Yt(i,n);return n.vertexColors&&(s.userData.tintSource=e),s}function Zv(i,t){i.updateMatrixWorld(!0);const e=new Qt().copy(i.matrixWorld).invert(),n=new Qt,s=[],r=new Map,o=[];i.traverse(h=>{h.isMesh&&!h.isSkinnedMesh&&!t.has(h)&&o.push(h)});const a=[];for(const h of o){const d=s.length;s.push(h);const f=h.geometry.clone();f.applyMatrix4(n.multiplyMatrices(e,h.matrixWorld));const g=f.attributes.position.count,v=new Uint16Array(g*4),m=new Float32Array(g*4);for(let y=0;y<g;y++)v[y*4]=d,m[y*4]=1;if(f.setAttribute("skinIndex",new Se(v,4)),f.setAttribute("skinWeight",new Se(m,4)),h.layers.isEnabled(tl)&&a.push(f.clone()),h.material.vertexColors&&!f.attributes.color){const y=new Float32Array(g*3).fill(1);f.setAttribute("color",new Se(y,3))}let p=r.get(h.material);p||(p={geos:[],cast:!1,receive:!1,layers:0,bloomSelf:!1,verts:0,ranges:[]},r.set(h.material,p)),p.ranges.push({source:h,start:p.verts,count:g}),p.verts+=g,p.geos.push(f),p.cast||(p.cast=h.castShadow),p.receive||(p.receive=h.receiveShadow),p.layers|=h.layers.mask&-5,p.bloomSelf||(p.bloomSelf=!!h.userData.bloomSelf),h.visible=!1}const l=new Xa(s),c=[],u=new Map;for(const[h,d]of r){const f=d.geos.length===1?d.geos[0]:Cr(d.geos,!1);if(!f)continue;if(d.geos.length>1)for(const v of d.geos)v.dispose();const g=new hc(f,h);g.castShadow=d.cast,g.receiveShadow=d.receive,g.layers.mask=d.layers,d.bloomSelf&&(g.userData.bloomSelf=!0),g.userData.ranges=d.ranges,g.boundingSphere=Bc.clone(),i.add(g),g.bind(l,i.matrixWorld),c.push(g),u.set(h,g)}if(a.length>0){const h=a.length===1?a[0]:Cr(a,!1);if(a.length>1)for(const d of a)d.dispose();if(h){const d=new hc(h,Xv);d.name="bloom-occluder",d.visible=!1,d.userData.emissiveOnly=!0,d.boundingSphere=Bc.clone(),kn(d),i.add(d),d.bind(l,i.matrixWorld),c.push(d)}}return{meshes:c,skeleton:l,byMaterial:u}}function Hc(i,t){var n,s,r;const e=(s=(n=i==null?void 0:i.geometry)==null?void 0:n.attributes)==null?void 0:s.color;if(e){for(const o of i.userData.ranges){const a=(r=t[o.source.userData.tintSource])==null?void 0:r.color;if(a)for(let l=o.start;l<o.start+o.count;l++)e.setXYZ(l,a.r,a.g,a.b)}e.needsUpdate=!0}}function Kv(i,t){let e=(t-i)%gi;return e>Math.PI&&(e-=gi),e<-Math.PI&&(e+=gi),e}function Jn(i,t,e,n){return i+(t-i)*(1-Math.exp(-e*n))}function Gc(i){return i<0?0:i>1?1:i}function ki(i,t){const e=new ut(Number.isFinite(i)?i:kr);if(t)return e;const n={h:0,s:0,l:0};return e.getHSL(n),e.setHSL(n.h,n.s*.45,n.l*.92)}function dr(i,t,e=.6){const n=new ut(typeof i=="string"?i:"#6d7280"),s={h:0,s:0,l:0};return n.getHSL(s),n.setHSL(s.h,s.s*(t?.75:.4),s.l),n.lerp(new ut(Ut.cloth),1-e)}function Jv({scene:i,quality:t,textures:e,skins:n=null}){const s=n||il(null),r=new ge;r.name="characters",i.add(r);const o=[],a=T=>(o.push(T),T),l=t.capsuleSegments,c={torso:a(new pn(.3,.44,Math.max(3,l/2),l)),hips:a(new pn(.26,.16,3,l)),thigh:a(new pn(.15,.34,3,Math.max(5,l-2))),shin:a(new pn(.12,.3,3,Math.max(5,l-2))),foot:a(new pe(.19,.11,.34)),upperArm:a(new pn(.1,.26,3,Math.max(5,l-2))),head:a(new De(.22,l+2,l)),hood:a(new De(.245,l+2,l,0,gi,0,Math.PI*.62)),collar:a(new be(.24,.31,.16,l+2,1,!0)),strapChest:a(new pe(.1,.62,.035)),buckle:a(new pe(.09,.07,.05)),backPanel:a(new pe(.29,.4,.04)),mitt:a(new De(.34,l+3,l+1)),knuckle:a(new Ze(.3,.045,5,l+4,Math.PI*1.05)),stud:a(new pe(.07,.06,.055)),cuff:a(new be(.19,.24,.22,l+2)),tassel:a(new pe(.045,.2,.02)),seam:a(new Ze(.318,.014,4,l+6,Math.PI*1.35)),contact:a(new Dr(.62,16)),cap:a(new De(.235,l+2,l,0,gi,0,Math.PI*.36)),hoodDeep:a(new De(.28,l+2,l,0,gi,0,Math.PI*.72)),cowl:a(new be(.31,.2,.22,l+2,1,!0)),horn:a(new Ur(.062,.36,Math.max(4,l-4))),maskShell:a(new be(.21,.18,.3,Math.max(6,l),1,!0,Math.PI-.95,1.9)),brow:a(new pe(.3,.045,.05)),plate:a(new pe(.27,.055,.25)),cloakSheet:a(new pe(.52,.98,.05)),pole:a(new be(.022,.018,1.15,5)),flag:a(new pe(.26,.74,.018)),turbanRing:a(new Ze(.2,.078,5,l+4)),sashBand:a(new pe(.17,.9,.05)),wrapBand:a(new be(.118,.118,.14,l)),bracerShell:a(new be(.16,.135,.32,l+1))};c.gloveMetal=a((()=>{const T=new Jt,U=new Yt(c.knuckle,null);U.userData.matKey="metal",U.rotation.set(Math.PI*.5,Math.PI,Math.PI*.02),U.position.set(0,.02,-.06),T.add(U);for(let k=0;k<3;k++){const b=new Yt(c.stud,null);b.userData.matKey="metal";const P=-.5+k*.5;b.position.set(Math.sin(P)*.28,.16,-Math.cos(P)*.26),b.rotation.y=-P,T.add(b)}return zc(T).get("metal")})());const u=a(new gn({color:856087,transparent:!0,opacity:.32,depthWrite:!1}));function h(T,U=!1){return new se({color:T,vertexColors:U,roughnessMap:e.cloth.rough,normalMap:t.normalMaps?e.cloth.normal:null,normalScale:new Tt(.4,.4),roughness:.86,metalness:0,envMapIntensity:.28})}function d(){return new se({color:1182728,roughness:.5,metalness:.2,emissive:new ut(Ut.crackCore),emissiveIntensity:0,toneMapped:!0})}function f(T,U,k){const b=ki(T.active,U),P=ki(T.main,U),q=ki(T.off,U),et={color:dr(k.cloth,U).lerp(b,.12),roughness:.96,metalness:0,roughnessMap:e.cloth.rough,normalMap:e.cloth.normal,normalScale:new Tt(.5,.5),envMapIntensity:.35},$=t.sheenCloth?new Bg({...et,sheen:.3,sheenRoughness:.9,sheenColor:new ut(8226711)}):new se(et),pt=new se({color:dr(k.trim,U,.7).lerp(new ut(Ut.clothDim),.45),roughness:.98,metalness:0,roughnessMap:e.cloth.rough,normalMap:e.cloth.normal,normalScale:new Tt(.4,.4),envMapIntensity:.3}),Y=new se({color:new ut(Ut.leather),roughness:.78,metalness:0,roughnessMap:e.leather.rough,normalMap:e.leather.normal,normalScale:new Tt(.9,.9),envMapIntensity:.5}),K=new se({color:new ut(Ut.leatherWorn),roughness:.62,metalness:0,roughnessMap:e.leather.rough,normalMap:e.leather.normal,normalScale:new Tt(.7,.7),envMapIntensity:.6}),z=new se({color:new ut(Ut.metal),roughness:.42,metalness:.92,roughnessMap:e.metal.rough,normalMap:e.metal.normal,normalScale:new Tt(.5,.5),envMapIntensity:1}),lt=new se({color:new ut(Ut.skin),roughness:.66,metalness:0,envMapIntensity:.4}),j=new se({color:dr(k.accent,U,.72),roughness:.72,metalness:0,envMapIntensity:.45}),mt=t.sheenCloth?null:new se({color:16777215,vertexColors:!0,roughness:.97,metalness:0,roughnessMap:e.cloth.rough,normalMap:e.cloth.normal,normalScale:new Tt(.45,.45),envMapIntensity:.33}),At=new se({color:16777215,vertexColors:!0,roughness:.68,metalness:0,roughnessMap:e.leather.rough,normalMap:e.leather.normal,normalScale:new Tt(.8,.8),envMapIntensity:.56}),Rt=new se({color:16777215,vertexColors:!0,roughness:.69,metalness:0,envMapIntensity:.42});return{cloth:$,clothDim:pt,clothSurface:mt,leather:Y,leatherWorn:K,leatherSurface:At,metal:z,skin:lt,accent:j,plainSurface:Rt,paint:h(b),paintMain:h(P),paintOff:h(q),paintSurface:h(16777215,!0),seamMain:d(),seamOff:d(),ident:b}}function g(T,U,k,b){const P=new ge,q=re(c.mitt,T,"leather");q.scale.set(1,.86,1.16),q.castShadow=t.shadows,P.add(q);const et=re(c.mitt,T,"leatherWorn");et.scale.set(.86,.6,.9),et.position.set(0,-.13,-.06),P.add(et);const $=re(c.gloveMetal,T,"metal");$.castShadow=t.shadows&&t.propShadows,P.add($);const pt=re(c.stud,T,k);pt.scale.set(3.4,.55,1.2),pt.position.set(0,.07,.24),P.add(pt);const Y=re(c.cuff,T,"cloth");Y.position.set(0,.3,.02),Y.rotation.x=-.15,Y.castShadow=t.shadows&&t.propShadows,P.add(Y);const K=re(c.tassel,T,"clothDim");K.position.set(U*.14,.26,.14),P.add(K);const z=new Yt(c.seam,b);return z.rotation.set(Math.PI*.5,Math.PI,Math.PI*.32),z.position.set(0,-.02,-.02),z.layers.enable(zr),z.userData.bloomSelf=!0,P.add(z),P.userData={tassel:K,seam:z,mitt:q,stripe:pt},P}function v(T,U){const{body:k,arms:b,mats:P}=U,q=[],et=($,pt)=>($.castShadow=t.shadows&&t.propShadows,(pt??k).add($),q.push($),$);switch(T){case"hood":{const $=et(re(c.hoodDeep,P,"cloth"));$.position.set(0,1.82,.03),$.rotation.x=.2,$.scale.set(1.06,1.12,1.12);const pt=et(re(c.cowl,P,"clothDim"));pt.position.y=1.62;break}case"turban":{const $=et(re(c.turbanRing,P,"cloth"));$.position.y=1.86,$.rotation.x=Math.PI/2+.12,$.scale.set(1.12,1.12,.86);const pt=et(re(c.cap,P,"cloth"));pt.position.y=1.92,pt.scale.set(.94,.7,.94);const Y=et(re(c.tassel,P,"clothDim"));Y.position.set(.05,1.68,.2),Y.scale.set(1.7,1.5,1.6);break}case"horns":{for(const $ of[-1,1]){const pt=et(re(c.horn,P,"accent"));pt.position.set($*.17,1.9,.02),pt.rotation.set(-.5,0,$*-.75);const Y=et(re(c.horn,P,"accent"));Y.position.set($*.3,2.02,.16),Y.rotation.set(-1.15,0,$*-1.1),Y.scale.setScalar(.72)}break}case"mask":{const $=et(re(c.maskShell,P,"accent"));$.position.set(0,1.79,-.04),$.scale.set(1.06,1.12,1.06);const pt=et(re(c.brow,P,"clothDim"));pt.position.set(0,1.9,-.19),pt.rotation.x=.22;break}case"pauldron":{for(const $ of b)for(let pt=0;pt<3;pt++){const Y=et(re(c.plate,P,"metal"),$.shoulder);Y.position.set($.side*(.02+pt*.035),.06-pt*.075,0),Y.rotation.z=$.side*(.18+pt*.16),Y.scale.setScalar(1-pt*.12)}break}case"cloak":{const $=et(re(c.cloakSheet,P,"cloth"));$.position.set(0,1.06,.31),$.rotation.x=-.07,$.scale.set(1,1,1);const pt=et(re(c.cloakSheet,P,"clothDim"));pt.position.set(-.2,.62,.3),pt.rotation.set(-.16,.24,.08),pt.scale.set(.42,.5,.8);const Y=et(re(c.cloakSheet,P,"clothDim"));Y.position.set(.2,.62,.3),Y.rotation.set(-.16,-.24,-.08),Y.scale.set(.42,.5,.8);break}case"banner":{const $=et(re(c.pole,P,"leather"));$.position.set(-.12,1.62,.34),$.rotation.z=.16;const pt=et(re(c.flag,P,"accent"));pt.position.set(-.26,1.86,.36),pt.rotation.z=.16,et(re(c.buckle,P,"metal")).position.set(-.06,1.3,.33);break}case"sash":{const $=et(re(c.sashBand,P,"accent"));$.position.set(-.05,1.24,-.28),$.rotation.z=.42,et(re(c.buckle,P,"leather")).position.set(-.22,.94,-.24);const Y=et(re(c.tassel,P,"clothDim"));Y.position.set(-.24,.78,-.2),Y.scale.set(1.6,2.2,1.6);break}case"bracer":{for(const $ of b){const pt=et(re(c.bracerShell,P,"leatherWorn"),$.wrist);pt.position.y=-.04;const Y=et(re(c.wrapBand,P,"metal"),$.wrist);Y.position.y=-.19,Y.scale.set(1.35,.42,1.35)}break}case"wrap":default:{for(const pt of b){const Y=et(re(c.wrapBand,P,"clothDim"),pt.wrist);Y.position.y=-.02,Y.scale.set(1.08,1.5,1.08)}const $=et(re(c.turbanRing,P,"clothDim"));$.position.y=.92,$.rotation.x=Math.PI/2,$.scale.set(1.32,1.32,.5);break}}return q}function m(T,U,k){const b=f(T,U,k),P=new ge,q=new ge,et=k.build;q.scale.set(et.mass,et.height,et.mass),P.add(q);const $=.82+et.shoulder*.18,pt=Wv.has(k.accessory),Y=new Jt,K=(B,Z,H)=>{const nt=new Yt(B,null);return nt.userData.matKey=Z,H==null||H(nt),Y.add(nt),nt};K(c.hips,"clothDim",B=>{B.position.y=.86}),K(c.torso,"cloth",B=>{B.position.y=1.24,B.scale.x=$}),K(c.strapChest,"leather",B=>{B.position.set(.06,1.26,-.27),B.rotation.z=-.24}),K(c.buckle,"metal",B=>{B.position.set(.12,1.06,-.3)}),K(c.collar,"clothDim",B=>{B.position.y=1.58,B.scale.set($,1,1)}),K(c.backPanel,"clothDim",B=>{B.position.set(0,1.26,.305),B.rotation.x=-.06,B.scale.set(1.22,1.16,.6)}),K(c.backPanel,"paint",B=>{B.position.set(0,1.26,.315),B.rotation.x=-.06}),K(c.head,"skin",B=>{B.position.y=1.79}),pt||K(c.cap,"cloth",B=>{B.position.y=1.8,B.rotation.x=.16});const z=zc(Y),lt=[],j=new Set(["cloth","clothDim","skin"]),mt=new Set(["cloth","clothDim","skin"]);for(const[B,Z]of z){const H=re(Z,b,B);H.castShadow=t.shadows&&(mt.has(B)||t.propShadows),B==="cloth"&&(H.receiveShadow=t.shadows),j.has(B)&&kn(H),q.add(H),lt.push(H)}const At=[];for(const B of[-1,1]){const Z=new ge;Z.position.set(B*.16,.84,0),q.add(Z);const H=re(c.thigh,b,"clothDim");H.position.y=-.24,H.castShadow=t.shadows,Z.add(H);const nt=new ge;nt.position.y=-.46,Z.add(nt);const tt=re(c.shin,b,"clothDim");tt.position.y=-.2,tt.castShadow=t.shadows,nt.add(tt);const A=re(c.foot,b,"leather");A.position.set(0,-.38,-.06),nt.add(A),At.push({hip:Z,knee:nt,side:B})}const Rt=[];for(const B of[-1,1]){const Z=B===fr,H=new ge;H.rotation.order="YXZ",H.position.set(B*.33*et.shoulder,1.46,0),q.add(H);const nt=re(c.upperArm,b,"cloth");nt.position.y=-.2,nt.castShadow=t.shadows,H.add(nt);const tt=new ge;tt.position.y=-.46,H.add(tt);const A=g(b,B,Z?"paintMain":"paintOff",Z?b.seamMain:b.seamOff);A.position.y=-.22,tt.add(A),Rt.push({shoulder:H,wrist:tt,glove:A,side:B,slot:Z?0:1,roll:0})}const Ht=v(k.accessory,{body:q,arms:Rt,mats:b}),xt=new Yt(c.contact,u.clone());xt.rotation.x=-Math.PI/2,xt.position.y=.02,xt.renderOrder=1,xt.scale.setScalar(.86+et.mass*.18),P.add(xt);const Et=Zv(P,new Set([xt])),N=Et.meshes.filter(B=>B.material.vertexColors);for(const B of N)Hc(B,b);const S=Et.byMaterial.get(b.paintSurface)??null;return{rootGroup:P,paintMesh:S,tinted:N,body:q,mats:b,legs:At,arms:Rt,skinned:Et,bodyParts:lt,contact:xt,look:k,accessory:Ht,baseScale:{x:et.mass,y:et.height,z:et.mass},contactScale:.86+et.mass*.18}}const p=new Map,y=new O;function M(T){return{active:T.tint,main:T.mainTint??T.tint,off:T.offTint??T.tint}}function _(T,U){const k=T.isLocal,b=ki(U.tint,k);T.mats.paint.color.copy(b),T.mats.paintMain.color.copy(ki(U.mainTint??U.tint,k)),T.mats.paintOff.color.copy(ki(U.offTint??U.tint,k)),T.mats.cloth.color.copy(dr(T.look.cloth,k)).lerp(b,.12);for(const P of T.tinted)Hc(P,T.mats);T.activeGloveId=U.activeGloveId,T.mainId=U.mainId,T.offhandId=U.offhandId}function X(T,U){const k=mv(T.skinId,s),b=m(M(T),U,k);r.add(b.rootGroup);const P={id:T.id,...b,isLocal:U,skinId:T.skinId??null,activeGloveId:T.activeGloveId,mainId:T.mainId,offhandId:T.offhandId,activeSlot:T.activeSlot??0,pos:new O(T.x??0,T.y??0,T.z??0),prev:new O(T.x??0,T.y??0,T.z??0),yaw:T.yaw??0,speed:0,stride:0,slapT:-1,slapSide:fr,slapPower:1,hitT:-1,awaken:0,breathe:Math.random()*gi};return p.set(T.id,P),P}function R(T){var U,k;r.remove(T.rootGroup);for(const b of Object.keys(T.mats))(k=(U=T.mats[b])==null?void 0:U.dispose)==null||k.call(U);for(const b of T.bodyParts)b.geometry.dispose();for(const b of T.skinned.meshes)b.geometry.dispose();T.skinned.skeleton.dispose(),T.contact.material.dispose()}const L=new ge;L.name="ghosts",L.visible=!1,r.add(L);const D=[];let E=0;const x={x:1,y:1,z:1},I=new ut(2830400),G=new ut(kr);function V(){const T=new se({color:I.clone(),roughness:.95,metalness:0,transparent:!0,opacity:0,depthWrite:!1,envMapIntensity:.2}),U=new ge,k=(P,q)=>{const et=new Yt(P,T);return et.position.y=q,U.add(et),et};k(c.hips,.86),k(c.torso,1.24),k(c.head,1.79);for(const P of[-1,1]){const q=new Yt(c.mitt,T);q.position.set(P*.38,1.02,-.1),q.scale.set(.88,.74,1.02),U.add(q)}U.visible=!1,U.renderOrder=2,L.add(U);const b={group:U,mat:T};return D.push(b),b}return{root:r,chars:p,get(T){return p.get(T)},reconcile(T,U){const k=new Set;for(const b of T){if(!b||b.id==null)continue;k.add(b.id);let P=p.get(b.id);const q=b.id===U,et=b.skinId??null;if(P&&(P.skinId!==et||P.isLocal!==q)){const $={pos:P.pos.clone(),prev:P.prev.clone(),yaw:P.yaw,speed:P.speed};R(P),p.delete(b.id),P=X(b,q),P.pos.copy($.pos),P.prev.copy($.prev),P.yaw=$.yaw,P.speed=$.speed}else P?(b.activeGloveId!==P.activeGloveId||b.mainId!==P.mainId||b.offhandId!==P.offhandId)&&_(P,b):P=X(b,q);P.activeSlot=b.activeSlot??0,P.target=b}for(const[b,P]of p)k.has(b)||(R(P),p.delete(b))},playSlap(T,U=1,k=null){const b=p.get(T);b&&(b.slapT=0,b.slapPower=Math.max(.35,Math.min(2,U)),b.slapSide=k??(b.activeSlot===0?fr:-fr))},playHit(T,U,k=1){const b=p.get(T);b&&(b.hitT=0,b.hitPower=Math.max(.3,Math.min(2.4,k)),b.hitDir=U?y.copy(U).normalize().clone():new O(0,0,1))},update(T,U,k=null){for(const b of p.values()){const P=b.target;if(!P)continue;const q=P.alive!==!1,et=!b.isLocal&&k!=null&&Math.hypot((P.x??0)-k.x,(P.z??0)-k.z)>Gv;if(b.rootGroup.visible=q&&!et,et){b.pos.set(P.x??0,P.y??0,P.z??0),b.prev.copy(b.pos),b.rootGroup.position.copy(b.pos),b.yaw=P.yaw??b.yaw,b.rootGroup.rotation.y=b.yaw;continue}if(!q)continue;b.prev.copy(b.pos);const $=P.x??0,pt=P.z??0;Math.hypot($-b.pos.x,pt-b.pos.z)>Vv?(b.pos.set($,P.y??0,pt),b.prev.copy(b.pos),b.speed=0,b.yaw=P.yaw??b.yaw):(b.pos.x=Jn(b.pos.x,$,22,T),b.pos.y=Jn(b.pos.y,P.y??0,24,T),b.pos.z=Jn(b.pos.z,pt,22,T)),b.rootGroup.position.copy(b.pos);const Y=b.pos.x-b.prev.x,K=b.pos.z-b.prev.z,z=Math.hypot(Y,K)/Math.max(T,1e-4);b.speed=Jn(b.speed,z,9,T),b.yaw+=Kv(b.yaw,P.yaw??0)*Math.min(1,T*16),b.rootGroup.rotation.y=b.yaw,b.stride+=b.speed*T*2.1;const lt=Math.min(1,b.speed/7),j=Math.sin(b.stride*2)*.035*lt,mt=Math.sin(b.stride)*.05*lt;b.breathe+=T*1.3,b.body.position.y=j+Math.sin(b.breathe)*.008,b.body.rotation.z=-mt*.5,b.body.rotation.x=-lt*.11-Math.sin(b.stride*2+1)*.015;for(const nt of b.legs){const tt=b.stride+(nt.side>0?Math.PI:0);nt.hip.rotation.x=Math.sin(tt)*.62*lt,nt.knee.rotation.x=-Math.max(0,-Math.sin(tt-.6))*.85*lt}let At=0,Rt=0;if(b.slapT>=0){b.slapT+=T/(Nn.duration/b.slapPower);const nt=b.slapT;if(nt>=1)b.slapT=-1;else if(nt<Nn.windupEnd){const tt=nt/Nn.windupEnd;At=-.9*ve(0,1,tt),Rt=ve(0,1,Gc(tt/.75))}else if(nt<Nn.strikeEnd){const tt=(nt-Nn.windupEnd)/(Nn.strikeEnd-Nn.windupEnd);At=-.9+2.6*ve(0,1,tt),Rt=1}else{const tt=(nt-Nn.strikeEnd)/(1-Nn.strikeEnd),A=1-ve(0,1,tt);At=1.7*A,Rt=A}}b.body.rotation.y=-At*kv;for(const nt of b.arms){const tt=b.stride+(nt.side>0?0:Math.PI),A=Math.sin(tt)*.5*lt,w=nt.side===b.slapSide,ot=w?At:At*-.3,yt=w?Rt:Rt*.24,J=Bv(ot),it=Ov*(Math.cos(J)-1);nt.shoulder.rotation.x=A+yt*(Fv+it),nt.shoulder.rotation.z=nt.side*(.16+yt*.1),nt.shoulder.rotation.y=J,nt.wrist.rotation.x=.28+Math.abs(A)*.4-yt*.34,nt.roll=Jn(nt.roll,zv*yt,16,T),nt.wrist.rotation.y=nt.roll;const St=nt.glove.userData.tassel;St.rotation.x=Jn(St.rotation.x,yt*.45+lt*.3,12,T),St.rotation.z=Jn(St.rotation.z,-nt.side*.2+J*.6,10,T)}const Ht=b.baseScale;if(b.hitT>=0)if(b.hitT+=T/.26,b.hitT>=1)b.hitT=-1,b.body.scale.set(Ht.x,Ht.y,Ht.z);else{const nt=Math.sin(b.hitT*Math.PI),tt=1+nt*.16*b.hitPower;b.body.scale.set(Ht.x*tt,Ht.y*(1-nt*.13*b.hitPower),Ht.z*tt*.94),b.body.rotation.x-=nt*.22*b.hitPower}const xt=(P.awakenedT??0)>0?1:0;b.awaken=Jn(b.awaken,xt,5,T);const Et=.72+.28*Math.sin(U*6.2),N=b.activeSlot===0;b.mats.seamMain.emissiveIntensity=b.awaken*(N?2.6:.5)*Et,b.mats.seamOff.emissiveIntensity=b.awaken*(N?.5:2.6)*Et,b.mats.paint.emissive.setHex(Ut.crackCore),b.mats.paint.emissiveIntensity=b.awaken*.35*Et,b.mats.paintSurface.emissive.setHex(Ut.crackCore),b.mats.paintSurface.emissiveIntensity=b.awaken*.35*Et;const B=(P.invulnT??0)>0?.55+.2*Math.sin(U*9):1;for(const nt of qv){const tt=b.mats[nt];if(!tt)continue;const A=B<.999;tt.transparent!==A&&(tt.transparent=A,tt.needsUpdate=!0),tt.opacity=B}const Z=Math.max(0,b.pos.y);b.contact.position.y=.02-b.pos.y;const H=1-Math.min(1,Z/3.2);b.contact.material.opacity=.34*H*H*B,b.contact.scale.setScalar(b.contactScale*(1+Z*.22)),b.contact.visible=b.pos.y>-1.5&&H>.02}},ghostRoot:L,get ghostCount(){return E},syncGhosts(T){const U=Array.isArray(T)?T:[];let k=0;for(const b of U){if(!b||typeof b!="object")continue;if(k>=Hv)break;const P=D[k]??V();k++;const q=b.ownerId!=null?p.get(b.ownerId):null,et=Number.isFinite(b.ttl)?b.ttl:0,$=Number.isFinite(b.ttl0)&&b.ttl0>0?b.ttl0:Math.max(et,.001),pt=Gc(et/$);P.group.visible=!0,P.group.position.set(b.x??0,b.y??0,b.z??0),P.group.rotation.y=b.yaw??0;const Y=(q==null?void 0:q.baseScale)??x,K=1+(1-pt)*.07;P.group.scale.set(Y.x*K,Y.y*K,Y.z*K);const z=q?q.mats.paint.color:G;P.mat.color.copy(I).lerp(z,.28),P.mat.opacity=(b.fake?.46:.3)*pt*(.5+.5*pt)}for(let b=k;b<D.length;b++)D[b].group.visible=!1;return E=k,L.visible=k>0,k},dispose(){var T;for(const U of p.values())R(U);p.clear();for(const U of D)U.mat.dispose();D.length=0,E=0,i.remove(r);for(const U of o)(T=U.dispose)==null||T.call(U);u.dispose()}}}const $v=["leather","metal","paint"],jv={cotton:{bulk:1.04,curl:.26,cuff:1,spread:1.06,thumb:.95},granite:{bulk:1.24,curl:.1,cuff:1.18,spread:.92,thumb:1.1},gale:{bulk:.9,curl:.3,cuff:.86,spread:1.14,thumb:.9},frost:{bulk:.98,curl:.16,cuff:1.04,spread:1,thumb:1},spring:{bulk:1.02,curl:.38,cuff:.94,spread:.96,thumb:1.05},afterimage:{bulk:.88,curl:.22,cuff:.9,spread:1.1,thumb:.88},magnet:{bulk:1.1,curl:.14,cuff:1.08,spread:.94,thumb:1.12},meteor:{bulk:1.16,curl:.2,cuff:1.12,spread:.98,thumb:1.08}},Qv={bulk:1,curl:.2,cuff:1,spread:1,thumb:1},Oe={back:.94,palm:1.16,finger:1.02,tip:1.1,cuff:.86,metal:1,paint:1};function t_(i,t){const e=i.attributes.position.count,n=new Float32Array(e*3),s=typeof t=="number"?t:(t==null?void 0:t.r)??1,r=typeof t=="number"?t:(t==null?void 0:t.g)??1,o=typeof t=="number"?t:(t==null?void 0:t.b)??1;for(let a=0;a<e;a++)n[a*3]=s,n[a*3+1]=r,n[a*3+2]=o;return i.setAttribute("color",new Se(n,3)),i}function Hi(i){i.updateWorldMatrix(!0,!0);const t=new Map;i.traverse(n=>{if(!n.isMesh)return;const s=n.userData.matKey??"leather",r=n.geometry.clone();if(r.applyMatrix4(n.matrixWorld),t_(r,n.userData.tone??1),!r.index){const o=r.attributes.position.count,a=new Array(o);for(let l=0;l<o;l++)a[l]=l;r.setIndex(a)}t.has(s)||t.set(s,[]),t.get(s).push(r)});const e=new Map;for(const[n,s]of t){const r=Cr(s,!1);for(const o of s)o.dispose();r&&(r.computeBoundingSphere(),e.set(n,r))}return e}function e_({hand:i,shape:t,quality:e}){const n=Math.max(5,Math.min(9,e.capsuleSegments-3)),s={...Qv,...t},r=new Jt,o=[],a=(I,G,V,T)=>{const U=new Yt(G,null);return U.userData.matKey=V,U.userData.tone=T,I.add(U),o.push(G),U},l=s.bulk,c=.22*s.cuff,u=a(r,new be(.15*l,.19*l,c,n+2,1,!1),"leather",Oe.cuff);u.position.y=-.36;const h=a(r,new Ze(.163*l,.026,4,n+6),"paint",Oe.paint);h.rotation.x=Math.PI/2,h.position.y=-.3;const d=a(r,new Ze(.172*l,.017,4,n+6),"leather",Oe.cuff);d.rotation.x=Math.PI/2,d.position.y=-.42;const f=new De(.2,n+3,n+1),g=a(r,f,"leather",Oe.back);g.position.y=-.05,g.scale.set(1.04*l,1.12*l,.56*l);const v=a(r,new De(.2,n+2,n),"leather",Oe.palm);v.position.set(0,-.06,-.055*l),v.scale.set(.86*l,.94*l,.3*l);const m=a(r,new De(.2,n,n-1),"leather",Oe.palm*.98);m.position.set(i*.11*l,-.16,-.02),m.scale.set(.42*l,.46*l,.3*l);const p=a(r,new Ze(.17*l,.026,5,n+6,Math.PI*1.1),"metal",Oe.metal);p.rotation.set(0,0,Math.PI*.96),p.position.set(0,.1,-.02);for(let I=0;I<2;I++)a(r,new De(.028,5,4),"metal",Oe.metal).position.set(i*(.07-I*.14)*l,-.2,-.06);const y=a(r,new De(.2,n,n-1),"paint",Oe.paint);y.position.set(0,-.04,.075*l),y.scale.set(.5*l,.2*l,.1*l),y.rotation.z=i*.3;const M=[.2,.225,.2,.155],_=[.045,.047,.043,.037],X=[];for(let I=0;I<4;I++){const G=M[I]*l,V=_[I]*l,T=i*(.108-I*.072)*s.spread*l,U=new Jt;U.position.set(T,.1*l,-.01),U.rotation.z=-i*(I-1.5)*.07,U.rotation.x=-s.curl*.5,r.add(U);const k=a(U,new pn(V,G*.62,2,n),"leather",Oe.finger);k.position.y=G*.31+V*.4;const b=new Jt;b.position.y=G*.62+V*.5,b.rotation.x=-s.curl,U.add(b);const P=a(b,new pn(V*.88,G*.44,2,n),"leather",Oe.finger);P.position.y=G*.22;const q=a(b,new De(V*.92,n,n-2),"leather",Oe.tip);q.position.y=G*.44+V*.2,q.scale.set(1,1.08,.92);const et=a(U,new De(V*1.16,n,n-2),"leather",Oe.finger);et.position.y=V*.2,X.push({joint:U,tipObj:q,length:G})}const R=new Jt;R.position.set(i*.17*l,-.16,-.035),R.rotation.z=-i*.62,R.rotation.x=-.16,r.add(R);const L=a(R,new pn(.05*l*s.thumb,.11*l,2,n),"leather",Oe.finger);L.position.y=.07*l;const D=new Jt;D.position.y=.15*l,D.rotation.z=i*.34,R.add(D);const E=a(D,new pn(.045*l*s.thumb,.09*l,2,n),"leather",Oe.finger);E.position.y=.055*l;const x=a(D,new De(.047*l*s.thumb,n,n-2),"leather",Oe.tip);return x.position.y=.115*l,{root:r,fingers:X,thumbTip:x,born:o}}function n_({quality:i,textures:t}){var a,l,c,u,h;const e=[],n=d=>(e.push(d),d),s=n(new se({color:new ut(Ut.leather).lerp(new ut(Ut.leatherWorn),.5),map:null,roughnessMap:((a=t==null?void 0:t.leather)==null?void 0:a.rough)??null,normalMap:i.normalMaps?((l=t==null?void 0:t.leather)==null?void 0:l.normal)??null:null,normalScale:new Tt(.85,.85),roughness:.76,metalness:0,vertexColors:!0,envMapIntensity:.6})),r=n(new se({color:new ut(Ut.metal),roughnessMap:((c=t==null?void 0:t.metal)==null?void 0:c.rough)??null,normalMap:i.normalMaps?((u=t==null?void 0:t.metal)==null?void 0:u.normal)??null:null,normalScale:new Tt(.5,.5),roughness:.44,metalness:.9,vertexColors:!0,envMapIntensity:.9})),o=n(new se({color:new ut(Ut.rockBody).lerp(new ut(Ut.grime),.35),roughnessMap:((h=t==null?void 0:t.leather)==null?void 0:h.rough)??null,roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.22}));return{leather:s,metal:r,locked:o,build({gloveId:d,hand:f=1,ident:g,unlocked:v=!0}){var D,E;const{root:m,fingers:p,born:y}=e_({hand:f,shape:jv[d],quality:i}),M=Hi(m);for(const x of y)x.dispose();const _=new se({color:(g??new ut(16777215)).clone(),roughnessMap:((D=t==null?void 0:t.cloth)==null?void 0:D.rough)??null,normalMap:i.normalMaps?((E=t==null?void 0:t.cloth)==null?void 0:E.normal)??null:null,normalScale:new Tt(.35,.35),roughness:.82,metalness:0,vertexColors:!0,envMapIntensity:.3}),X=new ge;X.name=`palm:${d}`;const R={};for(const x of $v){const I=M.get(x);if(!I)continue;const G=v?x==="metal"?r:x==="paint"?_:s:o,V=new Yt(I,G);V.castShadow=i.shadows&&(x==="leather"||i.propShadows),V.receiveShadow=!1,X.add(V),R[x]=V}m.updateWorldMatrix(!0,!0);const L=p.map(x=>{const I=new O;x.tipObj.getWorldPosition(I);const G=new O;return x.joint.getWorldPosition(G),{tip:I,base:G,dir:I.clone().sub(G).normalize(),length:x.length}});return X.userData={gloveId:d,hand:f,paint:_,meshes:R,fingers:L,handGeometry:M.get("leather")??null},{group:X,paint:_,meshes:R,fingers:L,setLocked(x){for(const[I,G]of Object.entries(R))G.material=x?o:I==="metal"?r:I==="paint"?_:s},dispose(){for(const x of Object.values(R))x.geometry.dispose();_.dispose()}}},dispose(){var d;for(const f of e)(d=f.dispose)==null||d.call(f)}}}const je=Math.PI*2,i_=Object.freeze({cotton:"fluff",granite:"grit",gale:"streak",frost:"mist",spring:"coil",afterimage:"ghost",magnet:"pull",meteor:"ember"});function s_(i){return i_[i]??"fluff"}const r_=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,o_=`
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
`;function a_(i,t,e){return i+(t-i)*e}function Vc({root:i,budget:t,texture:e,blending:n,renderOrder:s,rand:r}){const o=Ps({scene:i,budget:t,texture:e,blending:n,depthWrite:!1,renderOrder:s}),a=o.budget,l=new Float32Array(a),c=new Float32Array(a),u=new Float32Array(a),h=new Float32Array(a),d=[l,c,u,h];return{ps:o,emit(f,g,v,m){const p=Ar(o,f,g,v,m,r);return p<0?-1:(l[p]=m.gravity??0,c[p]=m.sway??0,u[p]=m.swayFreq??1.2,h[p]=r()*je,p)},update(f,g,v){const m=o.arrays;for(let p=o.count-1;p>=0;p--){o.life[p]+=f;const y=o.life[p]/o.maxLife[p];if(y>=1){const L=o.count-1;if(p!==L)for(const D of d)D[p]=D[L];el(o,p);continue}const M=Math.exp(-o.drag[p]*f);o.vel[p*3]*=M,o.vel[p*3+2]*=M,o.vel[p*3+1]=o.vel[p*3+1]*M+l[p]*f;const _=c[p];m.pos[p*3]+=(o.vel[p*3]+Math.sin(g*u[p]+h[p])*_)*f,m.pos[p*3+1]+=o.vel[p*3+1]*f,m.pos[p*3+2]+=(o.vel[p*3+2]+Math.cos(g*u[p]*.83+h[p])*_)*f,m.rot[p]+=o.spin[p]*f,m.size[p]=o.baseSize[p]+o.grow[p]*y;const X=Math.min(1,y/.16),R=1-Math.max(0,(y-.55)/.45);if(m.alpha[p]=o.baseAlpha[p]*X*R*R,v){const L=v(y);m.color[p*3]=L.r,m.color[p*3+1]=L.g,m.color[p*3+2]=L.b}}nl(o)},setPixelScale(f){o.mat.uniforms.uPixelScale.value=f},dispose(){o.dispose()}}}function l_({root:i,quality:t,textures:e,seed:n=20240501}){const s=yi(n+733),r=t.name==="low",o=r?.45:t.name==="mid"?.75:1,a=new ge;a.name="hub-vfx",i.add(a);const l=Vc({root:a,budget:Math.max(48,Math.round(t.dustBudget*.42)),texture:(e==null?void 0:e.dust)??null,blending:Ge,renderOrder:3,rand:s}),c=Vc({root:a,budget:Math.max(16,Math.round(t.emberBudget*.5)),texture:(e==null?void 0:e.ember)??null,blending:qi,renderOrder:4,rand:s});t.bloom&&(c.ps.points.layers.enable(zr),c.ps.points.userData.bloomSelf=!0);const u=new ut(16773586),h=new ut(Ut.crackDeep),d=new ut(Ut.grime).lerp(new ut(Ut.rockBody),.35),f=new ut,g=T=>f.copy(u).lerp(h,Math.min(1,T*1.4)),v=[],m=T=>(v.push(T),T),p=m(new wn(.055,0)),y=m(new Ja(.09,0)),M=m(new Ze(.34,.012,4,28)),_=m(new Hn(1,1));function X(T){const U=T.tint.clone().lerp(new ut(16774365),.55);let k=0;return{kind:"fluff",update(b){k+=b.dt*b.intensity*o;const P=.2;for(;k>P;){k-=P;const q=s()*je,et=.15+s()*.45;l.emit(b.anchor.x+Math.cos(q)*et,b.anchor.y-.15+s()*.5,b.anchor.z+Math.sin(q)*et,{vx:(s()-.5)*.16,vy:.05+s()*.12,vz:(s()-.5)*.16,life:3.2+s()*2.4,spin:(s()-.5)*.5,grow:.4+s()*.5,drag:.5,size:.22+s()*.26,alpha:.2+s()*.16,gravity:.02,sway:.16+s()*.18,swayFreq:.5+s()*.7,color:U})}},dispose(){}}}function R(T){const U=r?4:t.name==="mid"?6:8,k=new se({color:new ut(Ut.rockBody).lerp(T.tint,.3),roughness:.98,metalness:0,flatShading:!0,envMapIntensity:.2}),b=new sn(p,k,U);b.instanceMatrix.setUsage(Le),b.castShadow=t.shadows&&t.propShadows,b.frustumCulled=!1,T.host.add(b);const P=Array.from({length:U},($,pt)=>({angle:pt/U*je+s()*.4,radius:.3+s()*.34,height:-.1+s()*.55,speed:.25+s()*.35,bob:s()*je,scale:.6+s()*.9,spin:new O(s()*2,s()*2,s()*2)})),q=new Jt;let et=0;return{kind:"grit",update($){for(let pt=0;pt<P.length;pt++){const Y=P[pt];Y.angle+=Y.speed*$.dt*(.4+$.intensity*.6);const K=Y.height+Math.sin($.time*.7+Y.bob)*.06;q.position.set(Math.cos(Y.angle)*Y.radius,$.localPalmY+K,Math.sin(Y.angle)*Y.radius),q.rotation.set(Y.spin.x+$.time*.5,Y.spin.y+$.time*.35,Y.spin.z+$.time*.28),q.scale.setScalar(Y.scale*(.7+$.intensity*.4)),q.updateMatrix(),b.setMatrixAt(pt,q.matrix)}if(b.instanceMatrix.needsUpdate=!0,et+=$.dt*$.intensity*o,et>.55){et=0;const pt=P[Math.floor(s()*P.length)];l.emit($.anchor.x+Math.cos(pt.angle)*pt.radius,$.anchor.y+pt.height,$.anchor.z+Math.sin(pt.angle)*pt.radius,{vx:(s()-.5)*.1,vy:-.1,vz:(s()-.5)*.1,life:1.4+s()*1.1,spin:(s()-.5)*1.2,grow:.35,drag:1.1,size:.09+s()*.1,alpha:.24,gravity:-.55,sway:.03,color:d})}},dispose(){T.host.remove(b),b.dispose(),k.dispose()}}}function L(T){const U=[],k=r?2:3;for(let P=0;P<k;P++){const q=new Ze(.36+P*.09,.016,3,30,Math.PI*(1.05+s()*.35)),et=new Ee({vertexShader:r_,fragmentShader:o_,transparent:!0,depthWrite:!1,side:Ie,blending:Ge,uniforms:{uNoise:{value:(e==null?void 0:e.turbulence)??null},uColor:{value:T.tint.clone().lerp(new ut(14678e3),.35)},uOpacity:{value:.55},uTime:{value:0}}}),$=new Yt(q,et);$.rotation.x=Math.PI/2+(s()-.5)*.5,$.renderOrder=2,T.host.add($),U.push({mesh:$,mat:et,geo:q,speed:1.1+P*.55,tilt:(s()-.5)*.4,lift:P*.16})}let b=0;return{kind:"streak",update(P){for(const q of U)q.mesh.position.y=P.localPalmY-.1+q.lift,q.mesh.rotation.y+=q.speed*P.dt*(.5+P.intensity*.8),q.mesh.rotation.z=Math.sin(P.time*.8+q.lift*6)*.18+q.tilt,q.mat.uniforms.uTime.value=P.time,q.mat.uniforms.uOpacity.value=.32+P.intensity*.42;if(b+=P.dt*P.intensity*o,b>.22){b=0;const q=s()*je,et=.42;l.emit(P.anchor.x+Math.cos(q)*et,P.anchor.y+(s()-.4)*.4,P.anchor.z+Math.sin(q)*et,{vx:-Math.sin(q)*2.2,vy:.1,vz:Math.cos(q)*2.2,life:.5+s()*.35,spin:2.5,grow:.1,drag:1.6,size:.07+s()*.06,alpha:.3,gravity:0,sway:0,color:T.tint.clone().lerp(new ut(16777215),.4)})}},dispose(){for(const P of U)T.host.remove(P.mesh),P.geo.dispose(),P.mat.dispose()}}}function D(T){const U=new se({color:T.tint.clone().lerp(new ut(16777215),.35),roughness:.18,metalness:0,transparent:!0,opacity:.72,envMapIntensity:1.1,flatShading:!0}),k=r?3:5,b=new sn(y,U,k);b.instanceMatrix.setUsage(Le),b.castShadow=t.shadows&&t.propShadows,b.frustumCulled=!1,T.host.add(b);const P=new Jt,q=[];for(let Y=0;Y<k;Y++){const K=Y/k*je+s()*.5;q.push({angle:K,radius:.4+s()*.12,rot:new O(s()*.5,s()*je,s()*.6),scale:new O(.7+s()*.6,1.2+s()*.9,.7+s()*.5)})}const et=T.tint.clone().lerp(new ut(15398655),.5);let $=0,pt=!1;return{kind:"mist",update(Y){pt||(pt=!0,q.forEach((z,lt)=>{P.position.set(Math.cos(z.angle)*z.radius,Y.pedestalTopY+.04,Math.sin(z.angle)*z.radius),P.rotation.set(z.rot.x,z.rot.y,z.rot.z),P.scale.copy(z.scale),P.updateMatrix(),b.setMatrixAt(lt,P.matrix)}),b.instanceMatrix.needsUpdate=!0),U.opacity=.5+.22*Math.sin(Y.time*.9)*Y.intensity,$+=Y.dt*Y.intensity*o;const K=.16;for(;$>K;){$-=K;const z=s()*je,lt=.1+s()*.45;l.emit(Y.anchor.x+Math.cos(z)*lt,Y.anchor.y-.05+s()*.35,Y.anchor.z+Math.sin(z)*lt,{vx:Math.cos(z)*.22,vy:-.08,vz:Math.sin(z)*.22,life:2.2+s()*1.6,spin:(s()-.5)*.4,grow:.7+s()*.6,drag:1.3,size:.2+s()*.3,alpha:.14+s()*.12,gravity:-.16,sway:.05,swayFreq:.4,color:et})}},dispose(){T.host.remove(b),b.dispose(),U.dispose()}}}function E(T){const U=[],b=r?28:52;for(let j=0;j<=b;j++){const mt=j/b,At=mt*je*3.2,Rt=.26-mt*.06;U.push(new O(Math.cos(At)*Rt,mt*.46,Math.sin(At)*Rt))}const P=new Pu(U),q=new ja(P,r?40:84,.022,5,!1),et=new se({color:T.tint.clone().lerp(new ut(Ut.metalWarm),.4),roughness:.36,metalness:.85,envMapIntensity:.9}),$=new Yt(q,et);$.castShadow=t.shadows&&t.propShadows,T.host.add($);const pt=new gn({color:T.tint.clone().lerp(new ut(16777215),.25),transparent:!0,opacity:0,depthWrite:!1}),Y=new Yt(M,pt);Y.rotation.x=-Math.PI/2,T.host.add(Y);let K=0,z=-1;const lt={kind:"coil",palmOffset:0,update(j){K+=j.dt*(.75+j.intensity*.55);const mt=K%1,At=mt<.62?Math.pow(mt/.62,1.6):1-Math.pow((mt-.62)/.38,.55);$.scale.y=1-At*.42,$.position.y=j.localPalmY-.62,$.rotation.y=K*1.4,lt.palmOffset=(1-At)*.09*j.intensity,mt>.62&&z<0&&(z=0),z>=0&&(z+=j.dt*2.6,z>=1?(z=-1,pt.opacity=0,Y.visible=!1):(Y.visible=!0,Y.position.y=j.localPalmY-.66,Y.scale.setScalar(.5+z*1.5),pt.opacity=.4*(1-z)*j.intensity))},dispose(){T.host.remove($),T.host.remove(Y),q.dispose(),et.dispose(),pt.dispose()}};return lt}function x(T){const U=T.handGeometry,k=r?1:2,b=[];for(let et=0;et<k;et++){const $=new se({color:T.tint.clone().lerp(new ut(2761528),.35),roughness:.9,metalness:0,transparent:!0,opacity:0,depthWrite:!1,envMapIntensity:.3}),pt=U?new Yt(U,$):new Jt;pt.renderOrder=2,T.host.add(pt),b.push({mesh:pt,mat:$,t:-1,dx:0,dz:0,yaw:0})}let P=.4,q=0;return{kind:"ghost",update(et){if(P+=et.dt*et.intensity,P>1.15){P=0;const $=b[q%b.length];q++;const pt=s()*je,Y=.22+s()*.2;$.dx=Math.cos(pt)*Y,$.dz=Math.sin(pt)*Y,$.yaw=(s()-.5)*.7,$.t=0}for(const $ of b){if($.t<0){$.mesh.visible=!1;continue}if($.t+=et.dt/.7,$.t>=1){$.t=-1,$.mesh.visible=!1;continue}const pt=1-$.t;$.mesh.visible=!0,$.mesh.position.set($.dx*pt,et.localPalmY+.04*(1-pt),$.dz*pt),$.mesh.rotation.y=$.yaw*pt,$.mesh.scale.setScalar(.96+.06*$.t),$.mat.opacity=.42*pt*pt*et.intensity}},dispose(){for(const et of b)T.host.remove(et.mesh),et.mat.dispose()}}}function I(T){const U=r?6:10,k=8,b=U*k*2,P=new Float32Array(b*3),q=new Float32Array(b*4),et=[];for(let mt=0;mt<U;mt++){const At=mt/U*je+s()*.25,Rt=.95+s()*.35,Ht=.25+s()*.3;et.push({a:At,r0:Rt,bow:Ht,speed:.55+s()*.5,offset:s()})}const $=new ye,pt=new Se(P,3).setUsage(Le),Y=new Se(q,4).setUsage(Le);$.setAttribute("position",pt),$.setAttribute("color",Y);const K=new Cu({vertexColors:!0,transparent:!0,depthWrite:!1,blending:Ge}),z=new og($,K);z.frustumCulled=!1,T.host.add(z);const lt=T.tint.clone().lerp(new ut(16766658),.25);let j=0;return{kind:"pull",update(mt){let At=0;for(const Rt of et){const Ht=mt.time*.18;for(let xt=0;xt<k;xt++)for(let Et=0;Et<2;Et++){const N=(xt+Et)/k,S=Rt.r0*(1-N),B=Rt.a+Ht+N*.9,Z=a_(.04,mt.localPalmY,N)+Math.sin(N*Math.PI)*Rt.bow;P[At*3]=Math.cos(B)*S,P[At*3+1]=Z,P[At*3+2]=Math.sin(B)*S;const H=(mt.time*Rt.speed+Rt.offset)%1,nt=Math.abs(N-H),tt=Math.exp(-(nt*nt)/.012),A=.18+.5*N;q[At*4]=lt.r*(.6+tt*.8),q[At*4+1]=lt.g*(.6+tt*.8),q[At*4+2]=lt.b*(.6+tt*.8),q[At*4+3]=(A*.5+tt*.55)*mt.intensity,At++}}if(pt.needsUpdate=!0,Y.needsUpdate=!0,j+=mt.dt*mt.intensity*o,j>.3){j=0;const Rt=et[Math.floor(s()*et.length)],Ht=Rt.a+mt.time*.18,xt=Math.cos(Ht)*Rt.r0,Et=Math.sin(Ht)*Rt.r0;l.emit(mt.anchor.x+xt,mt.anchor.y-.3,mt.anchor.z+Et,{vx:-xt*1.5,vy:.55,vz:-Et*1.5,life:.75+s()*.3,spin:3,grow:-.03,drag:.4,size:.06+s()*.05,alpha:.55,gravity:.2,sway:0,color:lt})}},dispose(){T.host.remove(z),$.dispose(),K.dispose()}}}function G(T){const U=new gn({map:(e==null?void 0:e.crack)??null,color:new ut(Ut.crackCore),transparent:!0,opacity:.3,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),k=new Yt(_,U);k.rotation.x=-Math.PI/2,k.scale.setScalar(1.05),k.renderOrder=2,T.host.add(k);let b=0,P=0;return{kind:"ember",update(q){for(k.position.y=q.pedestalTopY+.012,U.opacity=(.18+.14*Math.sin(q.time*1.6))*q.intensity,b+=q.dt*q.intensity*o;b>.14;){b-=.14;const et=s()*je,$=s()*.3;c.emit(q.anchor.x+Math.cos(et)*$,q.anchor.y-.25+s()*.3,q.anchor.z+Math.sin(et)*$,{vx:(s()-.5)*.24,vy:.5+s()*.55,vz:(s()-.5)*.24,life:1.1+s()*.9,spin:0,grow:-.04,drag:.35,size:.05+s()*.06,alpha:.85,gravity:.25,sway:.12,swayFreq:1.6,color:u})}if(P+=q.dt*q.intensity*o,P>.5){P=0;const et=s()*je;l.emit(q.anchor.x+Math.cos(et)*.4,q.anchor.y+.5,q.anchor.z+Math.sin(et)*.4,{vx:(s()-.5)*.1,vy:-.06,vz:(s()-.5)*.1,life:2.4+s()*1.4,spin:(s()-.5)*1.2,grow:.25,drag:.9,size:.07+s()*.07,alpha:.3,gravity:-.22,sway:.1,color:d})}},dispose(){T.host.remove(k),U.dispose()}}}const V={fluff:X,grit:R,streak:L,mist:D,coil:E,ghost:x,pull:I,ember:G};return{group:a,attach({gloveId:T,host:U,tint:k,handGeometry:b}){const P=s_(T),q={gloveId:T,host:U,tint:k??new ut(16777215),handGeometry:b},et=V[P](q);return et.gloveId=T,et},emitSoft(T,U,k,b){return l.emit(T,U,k,b)},emitEmber(T,U,k,b){return c.emit(T,U,k,b)},update(T,U){l.update(T,U,null),c.update(T,U,g)},setPixelScale(T){l.setPixelScale(T),c.setPixelScale(T)},dispose(){var T;l.dispose(),c.dispose();for(const U of v)(T=U.dispose)==null||T.call(U);i.remove(a)}}}const Wc=.62,c_=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,u_=`
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
`;function Xc(i,t,e,n){return i+(t-i)*(1-Math.exp(-e*n))}const zi={h:0,s:0,l:0};function h_(i,t,e){t.getHSL(zi);const n=e>=1?zi.l+(.95-zi.l)*(1-1/e):zi.l*e,s=zi.s*Math.min(1,e*.85+.15);return i.setHSL(zi.h,s,Math.min(.9,Math.max(.02,n)))}function f_(i){const t=i.walkway;return`${i.origin.x.toFixed(2)}|${i.floorY.toFixed(2)}|${t.halfWidth.toFixed(2)}|${t.minZ.toFixed(2)}|${t.maxZ.toFixed(2)}`}function d_({scene:i,quality:t,textures:e,seed:n=20240501}){var N,S,B,Z,H,nt,tt,A,w,ot,yt;const s=new ge;s.name="hub",s.visible=!1,i.add(s);const r=yi(n+8171),o=[],a=J=>(o.push(J),J),l=(J,it,St)=>{if(!J)return null;const ft=J.clone();return ft.repeat.set(it,St),ft.needsUpdate=!0,a(ft),ft},c=a(new se({map:l((N=e==null?void 0:e.crust)==null?void 0:N.albedo,1,1),normalMap:t.normalMaps?l((S=e==null?void 0:e.crust)==null?void 0:S.normal,1,1):null,roughnessMap:l((B=e==null?void 0:e.crust)==null?void 0:B.rough,1,1),normalScale:new Tt(.85,.85),roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.42})),u=a(new se({map:l((Z=e==null?void 0:e.cliff)==null?void 0:Z.albedo,2,1),normalMap:t.normalMaps?l((H=e==null?void 0:e.cliff)==null?void 0:H.normal,2,1):null,roughnessMap:l((nt=e==null?void 0:e.cliff)==null?void 0:nt.rough,2,1),normalScale:new Tt(.7,.7),roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.3})),h=a(new se({map:l((tt=e==null?void 0:e.cliff)==null?void 0:tt.albedo,1,1),normalMap:t.normalMaps?l((A=e==null?void 0:e.cliff)==null?void 0:A.normal,1,1):null,roughnessMap:l((w=e==null?void 0:e.cliff)==null?void 0:w.rough,1,1),normalScale:new Tt(.8,.8),roughness:.96,metalness:0,vertexColors:!0,envMapIntensity:.34})),d=a(new se({name:"hub-inlay",color:new ut(Ut.rockDeep),roughness:.62,metalness:.15,emissive:new ut(Ut.crackCore),emissiveIntensity:.05,envMapIntensity:.5})),f=a(new se({name:"hub-rune",color:new ut(1709072),roughnessMap:l((ot=e==null?void 0:e.cliff)==null?void 0:ot.rough,1,1),roughness:.5,metalness:.25,emissive:new ut(Ut.crackCore),emissiveMap:l(e==null?void 0:e.turbulence,1.6,1.6),emissiveIntensity:.06,envMapIntensity:.6})),g=t.bloom?1.35:.72,v=a(new se({color:new ut(16777215),roughnessMap:((yt=e==null?void 0:e.cloth)==null?void 0:yt.rough)??null,roughness:.85,metalness:0,envMapIntensity:.3})),m=a(new Ee({vertexShader:c_,fragmentShader:u_,transparent:!0,depthWrite:!1,side:Ie,blending:Ge,uniforms:{uNoise:{value:(e==null?void 0:e.turbulence)??null},uSealA:{value:new ut(Ut.rockDeep)},uSealB:{value:new ut(Ut.fog).lerp(new ut(Ut.rockBody),.4)},uOpenA:{value:new ut(Ut.crackDeep).lerp(new ut(Ut.fog),.45)},uOpenB:{value:new ut(Ut.crackCore)},uReady:{value:0},uTime:{value:0}}})),p=n_({quality:t,textures:e}),y=l_({root:s,quality:t,textures:e,seed:n}),M=new Ea(Ut.crackLight,0,17,2);M.name="hub-portal-light",i.add(M);let _=null,X="";function R(J){const it=J.walkway,St=J.origin.x,ft=J.floorY,Mt=Math.max(6,it.maxZ-it.minZ),It=it.halfWidth*2,gt=new Jt,Pt=(zt,ee,ie,Ce)=>{const on=new Yt(zt,null);return on.userData.matKey=ee,on.userData.tone=ie,Ce(on),gt.add(on),on},Ft=Math.max(4,Math.round(It/2.7)),W=Math.max(6,Math.round(Mt/2.7)),Q=It/Ft,ct=Mt/W,at=new pe(Q-.1,.36,ct-.1),wt=new ut;for(let zt=0;zt<W;zt++)for(let ee=0;ee<Ft;ee++){const ie=St-it.halfWidth+Q*(ee+.5),Ce=it.minZ+ct*(zt+.5),on=r(),_n=Math.min(1,Math.abs(ie-St)/it.halfWidth),ii=1.14-_n*.24-on*.16;wt.setRGB(ii*1.03,ii,ii*(.94+_n*.1)),Pt(at,"deck",wt.clone(),rs=>{rs.position.set(ie,ft-.18+(on-.5)*.028,Ce),rs.rotation.y=(r()-.5)*.02})}const F=new pe(.26,.06,ct*.72);for(let zt=0;zt<W;zt++)Pt(F,"inlay",1,ee=>{ee.position.set(St,ft+.005,it.minZ+ct*(zt+.5))});const bt=new pe(.52,.34,1.4);for(let zt=it.minZ+.8;zt<it.maxZ;zt+=1.55)for(const ee of[-1,1]){if(r()<.11)continue;const ie=.8+r()*.5;Pt(bt,"rock",.82+r()*.2,Ce=>{Ce.position.set(St+ee*(it.halfWidth+.16),ft+.02+ie*.04,zt),Ce.rotation.set((r()-.5)*.06,(r()-.5)*.09,ee*(r()-.4)*.05),Ce.scale.set(1,ie,1)})}Pt(new pe(It+.9,.95,Mt),"rock",.62,zt=>{zt.position.set(St,ft-.82,(it.minZ+it.maxZ)/2)});const ht=new wn(1,0),dt=t.name==="low"?8:16;for(let zt=0;zt<dt;zt++){const ee=.55+r()*1.5;Pt(ht,"rock",.44+r()*.18,ie=>{ie.position.set(St+(r()-.5)*It*.9,ft-1.5-r()*2.2,it.minZ+r()*Mt),ie.rotation.set(r()*3,r()*3,r()*3),ie.scale.set(ee,ee*(.6+r()*.7),ee)})}const Ct=new be(.34,.46,1,7);for(const zt of[-1,1]){const ee=1.6+r()*1.4;Pt(Ct,"rock",.78+r()*.16,ie=>{ie.position.set(St+zt*(it.halfWidth-1.1),ft+ee*.5,it.maxZ-1.1),ie.scale.set(1,ee,1),ie.rotation.y=r()*3,ie.rotation.z=zt*.03})}const Lt=Hi(gt);at.dispose(),F.dispose(),bt.dispose(),ht.dispose(),Ct.dispose();const Ot=new ge;Ot.name="hub-walkway";const ne=[],fe={deck:c,rock:u,inlay:d};for(const[zt,ee]of Lt){const ie=new Yt(ee,fe[zt]??u);ie.receiveShadow=t.shadows,ie.castShadow=zt==="rock"&&t.shadows,zt!=="inlay"&&kn(ie),Ot.add(ie),ne.push(ie)}return s.add(Ot),{group:Ot,dispose(){s.remove(Ot);for(const zt of ne)zt.geometry.dispose()}}}let L=null,D=null,E="";function x(J,it){const St=new Jt,ft=[],Mt=(gt,Pt,Ft)=>{ft.push(gt);const W=new Yt(gt,null);W.userData.matKey="rock",W.userData.tone=Pt,Ft(W),St.add(W)};Mt(new be(J*1.12,J*1.2,it*.14,8),.78,gt=>{gt.position.y=it*.07,gt.rotation.y=Math.PI/8}),Mt(new be(J*.84,J*1.02,it*.62,8),.92,gt=>{gt.position.y=it*.46}),Mt(new be(J*.95,J*.86,it*.1,8),1.02,gt=>{gt.position.y=it*.82}),Mt(new be(J*1.08,J*1,it*.12,8),1.16,gt=>{gt.position.y=it*.93,gt.rotation.y=Math.PI/8}),Mt(new wn(J*.3,0),.86,gt=>{gt.position.set(J*.9,it*.2,J*.5),gt.rotation.set(.6,.9,.2),gt.scale.set(1,.7,1)});const It=Hi(St);for(const gt of ft)gt.dispose();return It.get("rock")}function I(J,it){const St=ft=>{const Mt=new Jt,It=[],gt=(W,Q)=>{It.push(W);const ct=new Yt(W,null);ct.userData.matKey="paint",ct.userData.tone=1,Q(ct),Mt.add(ct)};gt(new Ze(J*1.2,ft?.038:.03,5,22,ft?Math.PI*2:Math.PI),W=>{W.rotation.x=-Math.PI/2,W.position.y=it*1.02});const Pt=ft?[-1,1]:[0];for(const W of Pt)gt(new pe(.075,.26,.075),Q=>{Q.position.set(W*J*.86,it*1.14,ft?0:-J*.86)});const Ft=Hi(Mt);for(const W of It)W.dispose();return Ft.get("paint")};return{main:St(!0),off:St(!1)}}function G(J,it){const St=new Jt,ft=[],Mt=(gt,Pt)=>{ft.push(gt);const Ft=new Yt(gt,null);Ft.userData.matKey="paint",Ft.userData.tone=1,Pt(Ft),St.add(Ft)};Mt(new Ze(J*1.02,.03,4,20),gt=>{gt.rotation.x=-Math.PI/2,gt.position.y=it*.86}),Mt(new pe(J*1,.16,.05),gt=>{gt.position.set(0,it*.56,-J*.98)});const It=Hi(St);for(const gt of ft)gt.dispose();return It.get("paint")}let V=null,T=null,U=null;const k=new Map,b=new Jt,P=new ut;function q(J){var St,ft;const it=`${J.pedestalRadius.toFixed(3)}|${J.pedestalHeight.toFixed(3)}`;return it===E&&L?!1:(E=it,L==null||L.dispose(),V==null||V.dispose(),(St=D==null?void 0:D.main)==null||St.dispose(),(ft=D==null?void 0:D.off)==null||ft.dispose(),L=x(J.pedestalRadius,J.pedestalHeight),V=G(J.pedestalRadius,J.pedestalHeight),D=I(J.pedestalRadius,J.pedestalHeight),!0)}function et(J){if(T&&T.instanceMatrix.count>=J)return;T&&(s.remove(T),T.dispose(),s.remove(U),U.dispose());const it=Math.max(8,J);T=new sn(L,h,it),T.instanceMatrix.setUsage(Le),T.castShadow=t.shadows,T.receiveShadow=t.shadows,T.frustumCulled=!1,T.count=0,kn(T),s.add(T),U=new sn(V,v,it),U.instanceMatrix.setUsage(Le),U.frustumCulled=!1,U.count=0,s.add(U)}function $(J,it){const St=new ge;St.name=`pedestal:${J.gloveId}`,s.add(St);const ft=J.row==="left"?-1:1,Mt=new ut(J.tint),It=p.build({gloveId:J.gloveId,hand:ft,ident:Mt,unlocked:J.unlocked});It.group.position.y=it.pedestalHeight+Wc,St.add(It.group);const gt=new Yt(D.main,It.paint);gt.visible=!1,gt.castShadow=t.shadows&&t.propShadows,St.add(gt);const Pt=new Yt(D.off,It.paint);Pt.visible=!1,Pt.castShadow=t.shadows&&t.propShadows,St.add(Pt);const Ft=y.attach({gloveId:J.gloveId,host:St,tint:Mt,handGeometry:It.group.userData.handGeometry});return{gloveId:J.gloveId,group:St,palm:It,mainMark:gt,offMark:Pt,effect:Ft,ident:Mt,identBase:Mt.clone(),lift:0,bobPhase:r()*Math.PI*2,locked:!J.unlocked,ringKey:"",view:J}}function pt(J){J.effect.dispose(),J.group.remove(J.palm.group),J.palm.dispose(),s.remove(J.group)}function Y(J){const it=new Set;for(const St of J.pedestals){it.add(St.gloveId);let ft=k.get(St.gloveId);ft||(ft=$(St,J),k.set(St.gloveId,ft)),ft.view=St,ft.locked!==!St.unlocked&&(ft.locked=!St.unlocked,ft.palm.setLocked(ft.locked))}for(const[St,ft]of k)it.has(St)||(pt(ft),k.delete(St))}let K=null,z="",lt=0;function j(J){const it=new Jt,St=[],ft=(ct,at,wt,F)=>{St.push(ct);const bt=new Yt(ct,null);bt.userData.matKey=at,bt.userData.tone=wt,F(bt),it.add(bt)},Mt=J+.62,It=J*2.25;for(const ct of[-1,1]){ft(new be(.42,.62,It,7),"rock",.9,at=>{at.position.set(ct*Mt,It*.5,0),at.rotation.y=ct*.3}),ft(new pe(1.5,.42,1.5),"rock",.74,at=>{at.position.set(ct*Mt,.2,0),at.rotation.y=ct*.12});for(let at=0;at<3;at++)ft(new pe(.1,.5,.14),"rune",1,wt=>{wt.position.set(ct*(Mt-.34),It*(.32+at*.2),.02)})}ft(new pe(Mt*2+1.5,.72,1.15),"rock",.96,ct=>{ct.position.set(0,It+.3,0)}),ft(new pe(Mt*1.2,.4,.95),"rock",.86,ct=>{ct.position.set(0,It+.78,.02)}),ft(new wn(.55,0),"rock",1.04,ct=>{ct.position.set(0,It+1.02,0),ct.rotation.set(.4,.7,.2),ct.scale.set(1.2,.8,.9)}),ft(new pe(J*1.1,.16,.14),"rune",1,ct=>{ct.position.set(0,It+.32,.6)}),ft(new pe(Mt*2,.07,.3),"rune",1,ct=>{ct.position.set(0,.03,.85)});const gt=Hi(it);for(const ct of St)ct.dispose();const Pt=new ge;Pt.name="hub-portal";const Ft=[];for(const[ct,at]of gt){const wt=new Yt(at,ct==="rune"?f:u);wt.castShadow=t.shadows,wt.receiveShadow=t.shadows,ct!=="rune"&&kn(wt),ct==="rune"&&t.bloom&&(wt.layers.enable(zr),wt.userData.bloomSelf=!0),Pt.add(wt),Ft.push(wt)}const W=new Hn(J*2.1,It*1.02),Q=new Yt(W,m);return Q.position.set(0,It*.5,0),Q.renderOrder=2,Pt.add(Q),s.add(Pt),{group:Pt,membrane:Q,membraneGeo:W,meshes:Ft,height:It,dispose(){s.remove(Pt);for(const ct of Ft)ct.geometry.dispose();W.dispose()}}}function mt(J){const it=J.portal.radius.toFixed(3);it===z&&K||(z=it,K==null||K.dispose(),K=j(J.portal.radius))}let At=!1,Rt=0;function Ht(){At&&(At=!1,s.visible=!1,M.intensity=0)}function xt(J,it,St){let ft=0;for(const Mt of J.pedestals){const It=k.get(Mt.gloveId);if(!It)continue;It.group.position.set(Mt.x,Mt.y,Mt.z),It.group.rotation.y=Mt.yaw,b.position.set(Mt.x,Mt.y,Mt.z),b.rotation.set(0,Mt.yaw+It.bobPhase%1*.12,0),b.scale.setScalar(1),b.updateMatrix(),T.setMatrixAt(ft,b.matrix),U.setMatrixAt(ft,b.matrix);const gt=Mt.focused&&Mt.unlocked,Pt=Mt.unlocked?gt?1.7:Mt.slot?1.25:.82:.3,Ft=`${Pt.toFixed(2)}`;It.ringKey!==Ft&&(It.ringKey=Ft,h_(P,It.identBase,Pt),U.setColorAt(ft,P),U.instanceColor&&(U.instanceColor.needsUpdate=!0),It.palm.paint.color.copy(P));const W=(gt?.11:0)+(Mt.slot==="main"?.06:Mt.slot==="off"?.03:0);It.lift=Xc(It.lift,W,7,it);const Q=Mt.unlocked?gt?1.35:Mt.slot?1.12:.85:.16,ct=Math.sin(St*.9+It.bobPhase)*(.018+(gt?.014:0)),at=J.pedestalHeight+Wc+It.lift+ct+(It.effect.palmOffset??0);It.palm.group.position.y=at,It.palm.group.rotation.y=Math.sin(St*.32+It.bobPhase)*.09+(gt?.12:0),It.mainMark.visible=Mt.slot==="main",It.offMark.visible=Mt.slot==="off",It.effect.update({dt:it,time:St,intensity:Q,focused:gt,selected:Mt.slot,localPalmY:at,pedestalTopY:J.pedestalHeight,anchor:{x:Mt.x,y:Mt.y+at,z:Mt.z}}),ft++}T.count=ft,U.count=ft,T.instanceMatrix.needsUpdate=!0,U.instanceMatrix.needsUpdate=!0}function Et(J,it,St){const ft=J.portal;K.group.position.set(ft.x,J.floorY,ft.z),lt=Xc(lt,ft.ready?1:0,2.4,it),m.uniforms.uReady.value=lt,m.uniforms.uTime.value=St;const Mt=.9+Math.sin(St*1.9)*.06+Math.sin(St*4.7+1.3)*.04;if(f.emissiveIntensity=(.05+lt*g*Mt)*(ft.near?1.15:1),d.emissiveIntensity=.04+lt*.42*Mt,M.position.set(ft.x,J.floorY+ft.radius*.9,ft.z+.4),M.intensity=lt*13*Mt,lt>.35)for(Rt+=it*lt;Rt>.12;){Rt-=.12;const It=ft.x+(r()-.5)*ft.radius*1.6,gt=ft.z+(r()-.5)*.5;y.emitSoft(It,J.floorY+r()*.6,gt,{vx:(r()-.5)*.1,vy:.5+r()*.7,vz:(r()-.5)*.1,life:2+r()*1.6,spin:(r()-.5)*.8,grow:.5,drag:.45,size:.14+r()*.22,alpha:.16+r()*.12,gravity:.12,sway:.18,swayFreq:.9,color:new ut(Ut.crackCore).lerp(new ut(Ut.fog),.45)})}}return{root:s,portalLight:M,pedestals:k,get visible(){return At},sync(J,it=1/60,St=0){if(!J||!J.active||J.pedestals.length===0)return Ht(),!1;const ft=f_(J);if(ft!==X&&(X=ft,_==null||_.dispose(),_=R(J)),q(J)){for(const[,Mt]of k)pt(Mt);k.clear(),T&&(s.remove(T),T.dispose(),T=null,s.remove(U),U.dispose(),U=null)}return et(J.pedestals.length),mt(J),Y(J),At=!0,s.visible=!0,xt(J,it,St),Et(J,it,St),y.update(it,St),!0},setPixelScale(J){y.setPixelScale(J)},getStats(){return{visible:At,pedestals:k.size,portalReady:lt}},dispose(){var J,it,St,ft;for(const[,Mt]of k)pt(Mt);k.clear(),_==null||_.dispose(),K==null||K.dispose(),T&&(s.remove(T),T.dispose()),U&&(s.remove(U),U.dispose()),L==null||L.dispose(),V==null||V.dispose(),(J=D==null?void 0:D.main)==null||J.dispose(),(it=D==null?void 0:D.off)==null||it.dispose(),y.dispose(),p.dispose(),i.remove(M),(St=M.dispose)==null||St.call(M);for(const Mt of o)(ft=Mt.dispose)==null||ft.call(Mt);i.remove(s)}}}const Bi=.92,p_=.13,m_=.16;function vs(i){return i<0?0:i>1?1:i}const _s=new ut(.84,.93,1.14),Yc=new ut(1.14,1,.84),g_=`
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
`,v_=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;function __({scene:i,quality:t,textures:e,arenaRadius:n=20,seed:s=20240501}){const r=new ge;r.name="island",i.add(r);const o=[],a=W=>(o.push(W),W),l=rn(s+17),c=yi(s+99),u=n;function h(W){const Q=oe(l,Math.cos(W)*1.15+41,Math.sin(W)*1.15+41,3)-.5,ct=oe(l,Math.cos(W)*6.5+13,Math.sin(W)*6.5+13,3)-.5;return 1+Q*.17+ct*.035}function d(W){return 1+(h(W)-1)*.5}const f=(W,Q,ct)=>{if(!W)return null;const at=W.clone();return at.repeat.set(Q,ct),at.needsUpdate=!0,a(at),at},g=a(new se({map:f(e.cliff.albedo,4,1.7),normalMap:f(e.cliff.normal,4,1.7),roughnessMap:f(e.cliff.rough,4,1.7),normalScale:new Tt(.7,.7),roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.34,fog:!0,side:Ie})),v=a(new se({map:f(e.crust.albedo,.075,.075),normalMap:f(e.crust.normal,.075,.075),roughnessMap:f(e.crust.rough,.075,.075),normalScale:new Tt(1.05,1.05),roughness:1,metalness:0,vertexColors:!0,envMapIntensity:.5}));v.onBeforeCompile=W=>{var Q,ct;W.uniforms.uMacro={value:e.arenaMacro},W.uniforms.uMacroScale={value:1/(u*2.15)},W.uniforms.uMacroTexel={value:2/(((ct=(Q=e.arenaMacro)==null?void 0:Q.image)==null?void 0:ct.width)??512)},W.vertexShader=W.vertexShader.replace("#include <common>",`#include <common>
 varying vec3 vMacroPos;`).replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
         vec4 macroLocal = vec4(transformed, 1.0);
         #ifdef USE_INSTANCING
           macroLocal = instanceMatrix * macroLocal;
         #endif
         vMacroPos = (modelMatrix * macroLocal).xyz;`),W.fragmentShader=W.fragmentShader.replace("#include <common>",`#include <common>
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
         }`)},v.customProgramCacheKey=()=>"crust-macro";const m=a(new se({map:f(e.cliff.albedo,.6,1.6),normalMap:f(e.cliff.normal,.6,1.6),roughnessMap:f(e.cliff.rough,.6,1.6),roughness:1,metalness:0,vertexColors:!0,color:new ut(9274743),envMapIntensity:.35})),p=a(new se({map:f(e.crust.albedo,1.4,1.4),roughnessMap:f(e.crust.rough,1.4,1.4),normalMap:f(e.crust.normal,1.4,1.4),roughness:1,metalness:0,color:new ut(9668987),envMapIntensity:.45})),y=[[1,-.62],[1.045,-1.9],[.845,-3.1],[.93,-4.6],[.7,-6.5],[.795,-7.9],[.545,-10.2],[.635,-11.6],[.375,-14.1],[.44,-15.4],[.215,-17.4],[.095,-19.1],[.012,-20]],M=[],_=Math.max(2,Math.floor(t.islandProfileSegments/y.length)+1);for(let W=0;W<y.length-1;W++){const[Q,ct]=y[W],[at,wt]=y[W+1];for(let F=0;F<_;F++){const bt=F/_;M.push(new Tt(u*(Q+(at-Q)*bt),ct+(wt-ct)*bt))}}M.push(new Tt(u*y[y.length-1][0],y[y.length-1][1]));const X=Math.max(18,Math.round(t.islandRadialSegments*.5)),R=a(new Es(M,X,0,Math.PI*2));{const W=R.attributes.position,Q=new Float32Array(W.count*3),ct=new ut;for(let at=0;at<W.count;at++){const wt=W.getX(at),F=W.getY(at),bt=W.getZ(at),ht=Math.atan2(bt,wt),dt=Math.hypot(wt,bt),Ct=vs(-F/20),Lt=(oe(l,Math.cos(ht)*1.6+5,Math.sin(ht)*1.6+5,3)-.5)*.44,Ot=(oe(l,Math.cos(ht)*5+1,Math.sin(ht)*5-F*.3,3)-.5)*.11,ne=ve(0,.22,Ct),fe=(1-ne)*d(ht)+ne*(1+Lt*(.5+Ct*1.6))+Ot;W.setX(at,wt*fe),W.setZ(at,bt*fe),dt>.001&&W.setY(at,F+Ot*2.4);const zt=vs(.5-Ot*7),ee=vs(Ot*9),ie=ve(.55,.95,oe(l,ht*5.5+20,F*.06,3));let Ce=1.18-ve(.05,.9,Ct)*.5;Ce*=1-zt*.3,Ce*=1+ee*.34,Ce*=1-ie*.28*ve(0,.45,Ct),ct.setRGB(1,1,1).lerp(_s,ve(.1,.9,Ct)*.5).lerp(Yc,ee*.45).multiplyScalar(Ce),Q[at*3]=ct.r,Q[at*3+1]=ct.g,Q[at*3+2]=ct.b}R.setAttribute("color",new Se(Q,3)),R.computeVertexNormals(),W.needsUpdate=!0}const L=new Yt(R,g);L.name="bedrock",L.receiveShadow=t.shadows,L.castShadow=!1,kn(L),r.add(L);const D=[];let E=null;const x=new Jt;if(t.rockChunks>0){const W=a(new wn(1,t.name==="low"?0:1));{const Q=W.attributes.position;for(let wt=0;wt<Q.count;wt++){const F=Q.getX(wt),bt=Q.getY(wt),ht=Q.getZ(wt),dt=.7+oe(l,F*1.7+3,ht*1.7+bt,3)*.7;Q.setXYZ(wt,F*dt,bt*dt*.8,ht*dt)}W.computeVertexNormals();const ct=new Float32Array(Q.count*3),at=new ut;for(let wt=0;wt<Q.count;wt++)at.setRGB(1,1,1).lerp(_s,.5).multiplyScalar(.62+vs(Q.getY(wt)*.5+.5)*.5),ct[wt*3]=at.r,ct[wt*3+1]=at.g,ct[wt*3+2]=at.b;W.setAttribute("color",new Se(ct,3))}E=new sn(W,g,t.rockChunks),E.name="rock-chunks",E.instanceMatrix.setUsage(Le),E.castShadow=!1,E.receiveShadow=!1;for(let Q=0;Q<t.rockChunks;Q++){const ct=c()*Math.PI*2,at=u*(.35+c()*.7),wt=-3-c()*13;D.push({x:Math.cos(ct)*at,z:Math.sin(ct)*at,scale:.7+c()*2.4,rot:new O(c()*3,c()*3,c()*3),base:wt,amp:.06+c()*.14,phase:c()*6.28,spin:(c()-.5)*.05})}r.add(E),o.push(E)}const I=a(new Ee({vertexShader:v_,fragmentShader:g_,side:Ie,fog:!1,uniforms:{uCore:{value:new ut(Ut.crackCore)},uDeep:{value:new ut(Ut.crackDeep)},uNoise:{value:e.turbulence},uTime:{value:0}}})),G=a(new be(u*.995,u*.16,16.4,44,6,!0));{const W=G.attributes.position;for(let Q=0;Q<W.count;Q++){const ct=W.getX(Q),at=W.getY(Q),wt=W.getZ(Q),F=Math.atan2(wt,ct),bt=1+(oe(l,Math.cos(F)*3.2+11,Math.sin(F)*3.2-at*.22,3)-.5)*.22,dt=1-ve(-2.5,5.6,at)*(1-Math.min(1,d(F)));W.setXYZ(Q,ct*bt*dt,at,wt*bt*dt)}G.computeVertexNormals()}const V=a(new se({map:f(e.cliff.albedo,4,1.2),roughnessMap:f(e.cliff.rough,4,1.2),normalMap:t.normalMaps?f(e.cliff.normal,4,1.2):null,color:new ut(2827553),roughness:1,metalness:0,side:Ie,envMapIntensity:.04})),T=new Yt(G,V);T.position.y=-Bi-8,T.name="crack-shaft",kn(T),r.add(T);const U=a(new Dr(u*.22,32)),k=new Yt(U,I);k.rotation.x=-Math.PI/2,k.position.y=-16.1,k.name="crack-core",k.layers.enable(zr),k.userData.bloomSelf=!0,r.add(k);const b=new Jt,P=new ut;let q=null,et=null,$=0,pt=0,Y=null;const K=a(new gn({color:0}));function z(W){const Q=Math.max(.2,W/2-p_*.5),ct=Q*.22,at=new Za;at.moveTo(-Q+ct,-Q),at.lineTo(Q-ct,-Q),at.lineTo(Q,-Q+ct),at.lineTo(Q,Q-ct),at.lineTo(Q-ct,Q),at.lineTo(-Q+ct,Q),at.lineTo(-Q,Q-ct),at.lineTo(-Q,-Q+ct),at.closePath();const wt=new $a(at);wt.rotateX(-Math.PI/2);const F=new Ka(at,{depth:Bi,curveSegments:1,bevelEnabled:t.plateBevel,bevelThickness:.07,bevelSize:.09,bevelOffset:0,bevelSegments:t.name==="high"?2:1,steps:1});F.rotateX(-Math.PI/2),F.computeBoundingBox(),F.translate(0,-F.boundingBox.max.y,0);const bt=F.attributes.position,ht=new Float32Array(bt.count*3),dt=new ut;for(let Ct=0;Ct<bt.count;Ct++){const Lt=bt.getX(Ct),Ot=bt.getY(Ct),ne=bt.getZ(Ct),fe=Math.max(Math.abs(Lt),Math.abs(ne))/Q;let zt=Ot>-.02?1:.52;zt*=1-ve(.72,1,fe)*(Ot>-.02?.18:0),dt.setRGB(1,1,1).lerp(_s,Ot>-.02?.06:.34).multiplyScalar(zt),ht[Ct*3]=dt.r,ht[Ct*3+1]=dt.g,ht[Ct*3+2]=dt.b}return F.setAttribute("color",new Se(ht,3)),{geo:F,cap:wt}}function lt(W,Q){const ct=Math.max(64,Math.ceil(Q*1.15));if(q&&W===pt&&ct<=$)return!1;q&&(r.remove(q),q.dispose(),et.dispose(),r.remove(Y),Y.geometry.dispose()),pt=W,$=ct;const at=z(W);return et=at.geo,q=new sn(et,[v,m],ct),q.name="deck",q.instanceMatrix.setUsage(Le),q.castShadow=t.shadows,q.receiveShadow=t.shadows,q.frustumCulled=!1,q.count=0,r.add(q),Y=new sn(at.cap,K,ct),Y.name="deck-occluder",Y.instanceMatrix=q.instanceMatrix,Y.frustumCulled=!1,Y.count=0,Y.visible=!1,Y.userData.emissiveOnly=!0,kn(Y),r.add(Y),!0}const j=new Map,mt=new Map,At=new Map,Rt=[];let Ht=0;const xt=new Set;let Et=!1,N={origin:-u,tileSize:2.5};function S(W,Q){const ct=Math.floor((W-N.origin)/N.tileSize),at=Math.floor((Q-N.origin)/N.tileSize);return`${ct},${at}`}function B(W){if(!q)return;const Q=W.fall;if(Q>=1)b.position.set(W.x,-60,W.z),b.rotation.set(0,0,0),b.scale.setScalar(0);else{const ct=W.displayCrack,at=ct*.14+(W.seam?.05:0);b.position.set(W.x,W.baseY-at-Q*Q*30,W.z),b.rotation.set(W.tiltX*(ct*.05+Q*1.5),W.yaw,W.tiltZ*(ct*.05+Q*1.35));const wt=W.seam?1-m_/Math.max(pt,.01):1;b.scale.set(wt,1,1)}b.updateMatrix(),q.setMatrixAt(W.slot,b.matrix),Et=!0}function Z(W){if(!q)return;const ct=.82+oe(l,W.x*.085+21,W.z*.085+21,3)*.36,at=1-W.displayCrack*.3;P.setRGB(1,1,1).lerp(Yc,vs(.3-W.radial*.3)*.5).lerp(_s,W.seam?.22:0).multiplyScalar(ct*at),q.setColorAt(W.slot,P),q.instanceColor&&(q.instanceColor.needsUpdate=!0)}const H=Math.max(0,t.decalBudget|0),nt=a(new Hn(1,1)),tt=new Ma(new Float32Array(H),1);tt.setUsage(Le),nt.setAttribute("aFade",tt);const A=a(new gn({map:e.crack,transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2,toneMapped:!1}));A.onBeforeCompile=W=>{W.vertexShader=W.vertexShader.replace("#include <common>",`#include <common>
attribute float aFade;
varying float vFade;`).replace("#include <begin_vertex>",`#include <begin_vertex>
	vFade = aFade;`),W.fragmentShader=W.fragmentShader.replace("#include <common>",`#include <common>
varying float vFade;`).replace("#include <map_fragment>",`#include <map_fragment>
	diffuseColor.a *= vFade;`)};const w=new sn(nt,A,H);w.name="tile-damage",w.instanceMatrix.setUsage(Le),w.frustumCulled=!1,w.renderOrder=2,w.visible=!1,r.add(w),o.push(w);const ot=new Qt().makeScale(0,0,0),yt=new Jt,J=[];for(let W=H-1;W>=0;W--)J.push(W),w.setMatrixAt(W,ot);let it=0,St=!1;function ft(W){if(J.length===0||!e.crack||W.decals.length>=2)return;const Q=J.pop();yt.rotation.set(-Math.PI/2,0,c()*Math.PI*2);const ct=pt*.3;yt.position.set(W.x+(c()-.5)*ct,.014+W.decals.length*.004,W.z+(c()-.5)*ct);const at=pt*(.7+c()*.5);yt.scale.set(at,at,at),yt.updateMatrix(),tt.array[Q]=0,tt.needsUpdate=!0,W.decals.push({slot:Q,fade:0,shown:!1,matrix:yt.matrix.clone()})}function Mt(W){for(const Q of W.decals)tt.array[Q.slot]=0,Q.shown&&(w.setMatrixAt(Q.slot,ot),St=!0,it--),J.push(Q.slot);W.decals.length>0&&(tt.needsUpdate=!0),W.decals.length=0}const It=new ge;r.add(It);{const W=t.name==="low"?14:26,Q=a(new be(.17,.3,1,5,2));{const dt=Q.attributes.position;for(let Ct=0;Ct<dt.count;Ct++){const Lt=dt.getX(Ct),Ot=dt.getY(Ct),ne=dt.getZ(Ct),fe=.88+oe(l,Lt*5+7,(Ot+ne)*5+7,2)*.26;dt.setXYZ(Ct,Lt*fe,Ot+(oe(l,Lt*4,ne*4,2)-.5)*.12,ne*fe)}Q.computeVertexNormals(),Q.translate(0,.5,0)}const ct=[];for(let dt=0;dt<W;dt++){const Ct=dt/W*Math.PI*2+.11;c()<.16||ct.push(Ct)}const at=new sn(Q,p,ct.length);at.instanceMatrix.setUsage(Le);const wt=new Jt;ct.forEach((dt,Ct)=>{const Lt=(u+1.8)*d(dt);wt.position.set(Math.cos(dt)*Lt,-.7,Math.sin(dt)*Lt),wt.rotation.set((c()-.5)*.3,dt+(c()-.5)*.7,(c()-.5)*.34);const Ot=.9+c()*.7;wt.scale.set(.86+c()*.34,Ot,.86+c()*.34),wt.updateMatrix(),at.setMatrixAt(Ct,wt.matrix)}),at.instanceMatrix.needsUpdate=!0,at.castShadow=t.shadows,at.receiveShadow=t.shadows,It.add(at),o.push(at);const F=[new Tt(u+.4,-Bi-.05),new Tt(u+1.5,-Bi-.35),new Tt(u+2.1,-Bi-.95),new Tt(u+1.6,-Bi-1.9)],bt=a(new Es(F,t.islandRadialSegments,0,Math.PI*2));{const dt=bt.attributes.position,Ct=new Float32Array(dt.count*3),Lt=new ut;for(let Ot=0;Ot<dt.count;Ot++){const ne=dt.getX(Ot),fe=dt.getY(Ot),zt=dt.getZ(Ot),ee=Math.atan2(zt,ne),ie=oe(l,Math.cos(ee)*7+2,Math.sin(ee)*7+2,3),Ce=d(ee);dt.setX(Ot,ne*Ce),dt.setZ(Ot,zt*Ce),Lt.setRGB(1,1,1).lerp(_s,.42).multiplyScalar((.62+ie*.4)*(fe<-1.4?.72:1)),Ct[Ot*3]=Lt.r,Ct[Ot*3+1]=Lt.g,Ct[Ot*3+2]=Lt.b}bt.setAttribute("color",new Se(Ct,3)),bt.computeVertexNormals()}const ht=new Yt(bt,p);ht.receiveShadow=t.shadows,ht.castShadow=!1,kn(ht),It.add(ht)}{const W=t.name==="low"?10:t.name==="mid"?22:46,Q=a(new wn(.13,0));{const F=Q.attributes.position;for(let bt=0;bt<F.count;bt++){const ht=.7+oe(l,F.getX(bt)*9,F.getZ(bt)*9,2)*.8;F.setXYZ(bt,F.getX(bt)*ht,F.getY(bt)*ht*.7,F.getZ(bt)*ht)}Q.computeVertexNormals()}const ct=a(new se({color:new ut(5853770),roughness:.98,metalness:0,flatShading:!0,envMapIntensity:.2})),at=new sn(Q,ct,W),wt=new Jt;for(let F=0;F<W;F++){const bt=c()*Math.PI*2,ht=c()<.45?.86:Math.sqrt(c()),dt=u*.12+u*.74*ht;wt.position.set(Math.cos(bt)*dt,.03+c()*.04,Math.sin(bt)*dt),wt.rotation.set(c()*3,c()*3,c()*3),wt.scale.setScalar(.35+c()*.9),wt.updateMatrix(),at.setMatrixAt(F,wt.matrix)}at.instanceMatrix.needsUpdate=!0,at.castShadow=t.shadows,at.receiveShadow=t.shadows,r.add(at),o.push(at)}function gt(W,Q){const ct=Math.hypot(W.x,W.z)/Math.max(u,1e-6),at=oe(l,W.x*.7+3,W.z*.7-5,2)-.5;return{key:W.key,index:W.index,slot:Q,x:W.x,z:W.z,seam:W.seam,radial:ct,yaw:at*.09,baseY:at*.05,tiltX:oe(l,W.x*1.3+11,W.z*1.3,2)-.5,tiltZ:oe(l,W.x*1.3,W.z*1.3+11,2)-.5,crack:W.crack,displayCrack:W.crack,broken:!1,fall:0,decals:[]}}function Pt(W){Mt(W),j.delete(W.key),mt.delete(W.index),At.delete(S(W.x,W.z)),xt.delete(W),Rt.push(W.slot),q&&(b.position.set(0,-60,0),b.rotation.set(0,0,0),b.scale.setScalar(0),b.updateMatrix(),q.setMatrixAt(W.slot,b.matrix),Et=!0)}function Ft(W){return W.broken?!1:(W.broken=!0,W.fall=1e-4,xt.add(W),Mt(W),!0)}return{group:r,tiles:j,core:k,arenaRadius:u,setActive(W){const Q=!!W;return r.visible===Q||(r.visible=Q),Q},get active(){return r.visible},get tileCount(){let W=0;for(const Q of j.values())Q.broken||W++;return W},syncTiles(W,Q){if(!Array.isArray(W)||W.length===0)return;if(Q&&(N=Q),lt((Q==null?void 0:Q.tileSize)??W[0].size??2.5,W.length))for(const wt of j.values())q.count=Math.max(q.count,wt.slot+1),Z(wt),B(wt);const at=new Set;for(const wt of W){at.add(wt.key);let F=j.get(wt.key);if(!F){const bt=Rt.length?Rt.pop():Ht++;if(bt>=$)continue;F=gt(wt,bt),j.set(wt.key,F),mt.set(wt.index,F),At.set(S(wt.x,wt.z),F),q.count=Math.max(q.count,F.slot+1),Z(F),B(F)}wt.crack>F.crack+.02&&!wt.broken&&(wt.crack>.32&&ft(F),xt.add(F)),F.crack=wt.crack,wt.broken?Ft(F):F.broken&&(F.broken=!1,F.fall=0,F.displayCrack=wt.crack,Z(F),B(F))}if(at.size!==j.size)for(const wt of[...j.values()])at.has(wt.key)||Pt(wt)},breakTile(W){const Q=this.findTile(W);return Q?(Ft(Q),Q):null},crackTile(W,Q=.5){const ct=this.findTile(W);return!ct||ct.broken?null:(ct.crack=Math.max(ct.crack,Q),ct.crack>.32&&ft(ct),xt.add(ct),ct)},findTile({tileIndex:W=null,tileId:Q=null,x:ct=null,z:at=null}={}){return W!=null&&mt.has(W)?mt.get(W):Q!=null&&j.has(String(Q))?j.get(String(Q)):Number.isFinite(ct)&&Number.isFinite(at)?At.get(S(ct,at))??null:null},hasFloorAt(W,Q){const ct=At.get(S(W,Q));return!!ct&&!ct.broken},update(W,Q){if(I.uniforms.uTime.value=Q,E){for(let at=0;at<D.length;at++){const wt=D[at];wt.rot.y+=wt.spin*W,x.position.set(wt.x,wt.base+Math.sin(Q*.4+wt.phase)*wt.amp,wt.z),x.rotation.set(wt.rot.x,wt.rot.y,wt.rot.z),x.scale.setScalar(wt.scale),x.updateMatrix(),E.setMatrixAt(at,x.matrix)}E.instanceMatrix.needsUpdate=!0}for(const at of xt){let wt=!0;at.broken&&at.fall<1&&(at.fall=Math.min(1,at.fall+W*.8),wt=!1);const F=at.broken?1:at.crack;Math.abs(at.displayCrack-F)>.002?(at.displayCrack+=(F-at.displayCrack)*Math.min(1,W*5),Z(at),wt=!1):at.displayCrack!==F&&(at.displayCrack=F,Z(at)),B(at),wt&&xt.delete(at)}Et&&q&&(q.instanceMatrix.needsUpdate=!0,Et=!1),Y&&(Y.count=q?q.count:0);let ct=!1;for(const at of j.values()){if(at.decals.length===0)continue;const wt=at.broken?0:.2+at.displayCrack*.45;for(const F of at.decals){F.fade+=(wt-F.fade)*Math.min(1,W*3),tt.array[F.slot]=F.fade,ct=!0;const bt=F.fade>.01;bt!==F.shown&&(F.shown=bt,it+=bt?1:-1,w.setMatrixAt(F.slot,bt?F.matrix:ot),St=!0)}}ct&&(tt.needsUpdate=!0),St&&(w.instanceMatrix.needsUpdate=!0,St=!1),w.visible=it>0},surfaceY(){return 0},dispose(){var W,Q;i.remove(r),r.traverse(ct=>{var at,wt;(ct.isMesh||ct.isInstancedMesh)&&((wt=(at=ct.geometry)==null?void 0:at.dispose)==null||wt.call(at))}),(W=q==null?void 0:q.dispose)==null||W.call(q);for(const ct of o)(Q=ct.dispose)==null||Q.call(ct);j.clear(),mt.clear(),At.clear(),xt.clear(),Rt.length=0,Ht=0}}}function x_({scene:i,quality:t,sunDir:e}){const n=new Cc(Ut.keyLight,3.6);if(n.position.copy(e).multiplyScalar(60),n.target.position.set(0,0,0),i.add(n),i.add(n.target),t.shadows){n.castShadow=!0,n.shadow.mapSize.set(t.shadowMapSize,t.shadowMapSize),n.shadow.camera.near=5,n.shadow.camera.far=140;const c=30;n.shadow.camera.left=-c,n.shadow.camera.right=c,n.shadow.camera.top=c,n.shadow.camera.bottom=-c,n.shadow.bias=-.0016,n.shadow.normalBias=.05,n.shadow.radius=t.softShadows?3.2:1,n.shadow.camera.updateProjectionMatrix()}const s=new Hg(Ut.fillSky,Ut.fillBounce,.95);s.position.set(0,30,0),i.add(s);const r=new Cc(Ut.rimLight,t.rimLight?1.05:.45);r.position.set(e.z*46,24,-e.x*46),r.target.position.set(0,1.2,0),i.add(r),i.add(r.target);let o=null,a=null;t.crackFillLight&&(o=new Ea(Ut.crackLight,26,20,2),o.position.set(0,-13.2,0),i.add(o),a=new Ea(Ut.crackLight,11,15,2),a.position.set(0,-1.7,0),i.add(a));const l=new O;return{key:n,ambient:s,rim:r,crack:o,seam:a,update(c,u){if(l.copy(u),n.target.position.set(l.x,0,l.z),n.position.set(l.x+e.x*60,e.y*60,l.z+e.z*60),n.target.updateMatrixWorld(),r.target.position.set(l.x,1.2,l.z),r.position.set(l.x+e.z*46,24,l.z-e.x*46),r.target.updateMatrixWorld(),o){const h=.86+Math.sin(c*1.7)*.06+Math.sin(c*4.3+1.1)*.04;o.intensity=26*h,a.intensity=11*h}},setShadowsEnabled(c){n.castShadow=c&&t.shadows},dispose(){var c,u,h,d,f;i.remove(n),i.remove(n.target),i.remove(s),i.remove(r),i.remove(r.target),o&&i.remove(o),a&&i.remove(a),(c=n.dispose)==null||c.call(n),(u=s.dispose)==null||u.call(s),(h=r.dispose)==null||h.call(r),(d=o==null?void 0:o.dispose)==null||d.call(o),(f=a==null?void 0:a.dispose)==null||f.call(a)}}}const qc=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`,M_=`
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
`,y_=`
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
`;function S_(){const i=new ye;return i.setAttribute("position",new Zt([-1,-1,0,3,-1,0,-1,3,0],3)),i.setAttribute("uv",new Zt([0,0,2,0,0,2],2)),i}const w_=new ut(0,0,0);function b_({renderer:i,scene:t,quality:e}){const n=new Tt(1,1);i.getDrawingBufferSize(n);const s=(x,I,G={})=>new ei(Math.max(1,Math.floor(x)),Math.max(1,Math.floor(I)),{type:es,format:qe,minFilter:Be,magFilter:Be,depthBuffer:G.depth!==!1,stencilBuffer:!1,samples:G.samples??0,colorSpace:fn,...G.extra}),r=e.bloom!==!1&&e.bloomIterations>0&&e.bloomStrength>0,o=e.bloomOccluders==="all"?"all":"tagged";let a=s(n.x,n.y,{samples:e.msaa});const l=e.bloomScale;let c=r?s(n.x*l,n.y*l,{depth:!0}):null,u=r?s(n.x*l,n.y*l,{depth:!1}):null,h=r?s(n.x*l,n.y*l,{depth:!1}):null;const d=S_(),f=new Va,g=new Ba(-1,1,1,-1,0,1),v=r?new Ee({vertexShader:qc,fragmentShader:M_,depthTest:!1,depthWrite:!1,uniforms:{uTex:{value:null},uDir:{value:new Tt},uThreshold:{value:.85},uSoftKnee:{value:.6}}}):null,m=new Ee({vertexShader:qc,fragmentShader:y_,defines:r?{USE_BLOOM:""}:{},depthTest:!1,depthWrite:!1,uniforms:r?{uScene:{value:a.texture},uBloom:{value:u.texture},uBloomStrength:{value:e.bloomStrength},uExposure:{value:1.25},uVignette:{value:.42}}:{uScene:{value:a.texture},uExposure:{value:1.25},uVignette:{value:.42}}}),p=new Yt(d,m);p.frustumCulled=!1,f.add(p);const y=new WeakMap,M=new WeakMap,_=[];function X(x){let I=M.get(x);return I||(I=new gn({color:w_,transparent:!1,depthWrite:x.depthWrite!==!1,depthTest:x.depthTest!==!1,side:x.side}),I.userData.emissiveProxyBlack=!0,M.set(x,I)),I}function R(x,I){if(!x)return null;if(x.isShaderMaterial||x.isRawShaderMaterial)return x;if(I.userData.bloomSelf&&x.isMeshBasicMaterial){let G=y.get(x);G||(G=x.clone(),G.toneMapped=!1,y.set(x,G));const V=I.userData.bloomBoost??2.4;return G.color.copy(x.color).multiplyScalar(V),G.opacity=x.opacity,G.map=x.map,G}if(x.emissive&&(x.emissiveIntensity??0)>.001){let G=y.get(x);return G||(G=new gn({transparent:x.transparent,depthWrite:x.depthWrite!==!1,side:x.side,toneMapped:!1}),y.set(x,G)),G.color.copy(x.emissive).multiplyScalar(x.emissiveIntensity??1),G.map=x.emissiveMap??null,G.opacity=x.opacity,G.userData.emissiveProxyBlack=!G.map&&G.color.r+G.color.g+G.color.b<1e-4,G}return X(x)}const L=x=>{var I;return Array.isArray(x)?x.every(G=>{var V;return(V=G==null?void 0:G.userData)==null?void 0:V.emissiveProxyBlack}):!!((I=x==null?void 0:x.userData)!=null&&I.emissiveProxyBlack)};function D(x){_.length=0;const I=[],G=[];t.traverse(V=>{if(V.userData.emissiveOnly){if(o!=="tagged"||V.visible)return;V.visible=!0,G.push(V)}else if(!V.visible)return;if(V.isPoints){V.userData.bloomSelf||(I.push(V),V.visible=!1);return}if(!V.isMesh&&!V.isInstancedMesh&&!V.isBatchedMesh)return;const T=V.material,U=Array.isArray(T)?T.map(k=>R(k,V)):R(T,V);if(o==="tagged"&&V.children.length===0&&L(U)&&!V.layers.isEnabled(tl)){I.push(V),V.visible=!1;return}U!==T&&(_.push({object:V,original:T}),V.material=U)}),i.setRenderTarget(c),i.setClearColor(0,1),i.clear(!0,!0,!1),i.render(t,x);for(const V of _)V.object.material=V.original;_.length=0;for(const V of I)V.visible=!0;for(const V of G)V.visible=!1}function E(x){p.material=v;let I=c;for(let G=0;G<x;G++)v.uniforms.uTex.value=I.texture,v.uniforms.uThreshold.value=G===0?.85:-1,v.uniforms.uDir.value.set((1.4+G*1.8)/u.width,0),i.setRenderTarget(u),i.clear(!0,!1,!1),i.render(f,g),v.uniforms.uTex.value=u.texture,v.uniforms.uThreshold.value=-1,v.uniforms.uDir.value.set(0,(1.4+G*1.8)/h.height),i.setRenderTarget(h),i.clear(!0,!1,!1),i.render(f,g),I=h;return I}return{get sceneTarget(){return a},get bloomEnabled(){return r},get debug(){return{composite:m,targets:1+(r?3:0),bloomSize:r?[u.width,u.height]:null,occluders:o}},render(x){if(i.setRenderTarget(a),i.setClearColor(0,1),i.clear(!0,!0,!1),i.render(t,x),r){D(x);const I=E(e.bloomIterations);m.uniforms.uBloom.value=I.texture}m.uniforms.uScene.value=a.texture,p.material=m,i.setRenderTarget(null),i.clear(!0,!0,!1),i.render(f,g)},setSize(x,I){const G=Math.max(1,Math.floor(x)),V=Math.max(1,Math.floor(I));if(a.setSize(G,V),!r)return;const T=Math.max(1,Math.floor(G*l)),U=Math.max(1,Math.floor(V*l));c.setSize(T,U),u.setSize(T,U),h.setSize(T,U)},setBloomStrength(x){r&&(m.uniforms.uBloomStrength.value=x)},setExposure(x){m.uniforms.uExposure.value=x},dispose(){a.dispose(),c==null||c.dispose(),u==null||u.dispose(),h==null||h.dispose(),d.dispose(),v==null||v.dispose(),m.dispose(),a=null,c=null,u=null,h=null}}}const E_=`
  varying vec3 vWorldDir;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(world.xyz - cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`,T_=`
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
`,A_=`
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`,C_=`
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
`;function R_({scene:i,renderer:t,quality:e,textures:n,sunDir:s}){const r=new De(900,32,20),o=new Ee({vertexShader:E_,fragmentShader:T_,side:He,depthWrite:!1,fog:!1,uniforms:{uZenith:{value:new ut(Ut.skyZenith)},uMid:{value:new ut(Ut.skyMid)},uHorizon:{value:new ut(Ut.skyHorizon)},uWarm:{value:new ut(Ut.skyWarm)},uSunColor:{value:new ut(Ut.sunDisc)},uSunDir:{value:s.clone().normalize()},uExposure:{value:1}}}),a=new Yt(r,o);a.name="sky",a.frustumCulled=!1,a.renderOrder=-1e3;const l=new _a(t);l.compileEquirectangularShader();const c=new Va;c.add(a);const u=l.fromScene(c,0,1,2e3);c.remove(a),l.dispose(),i.add(a),i.environment=u.texture,i.environmentIntensity=.45,i.fog=new Ga(new ut(Ut.fog).getHex(),.0065);const h=[],d=[{y:-34,size:900,density:.46,scale:2.6,opacity:.5,fadeNear:260,fadeFar:1100},{y:-70,size:1500,density:.52,scale:1.7,opacity:.42,fadeNear:460,fadeFar:1900},{y:-120,size:2400,density:.6,scale:1.15,opacity:.4,fadeNear:780,fadeFar:3e3}].slice(0,e.cloudLayers);for(const f of d){const g=new Ee({vertexShader:A_,fragmentShader:C_,transparent:!0,depthWrite:!1,side:Ie,fog:!1,uniforms:{uNoise:{value:n.turbulence},uLit:{value:new ut(Ut.cloudLit)},uShadow:{value:new ut(Ut.cloudShadow)},uSunDir:{value:s.clone().normalize()},uTime:{value:0},uDensity:{value:f.density},uScale:{value:f.scale},uOpacity:{value:f.opacity},uHaze:{value:new ut(Ut.fog).lerp(new ut(Ut.skyHorizon),.5)},uFadeNear:{value:f.fadeNear},uFadeFar:{value:f.fadeFar}}}),v=new Yt(new Hn(f.size,f.size,1,1),g);v.rotation.x=-Math.PI/2,v.position.y=f.y,v.renderOrder=-900,v.frustumCulled=!1,i.add(v),h.push(v)}return{skyMesh:a,clouds:h,envRT:u,update(f,g){a.position.copy(g);for(const v of h)v.material.uniforms.uTime.value=f,v.position.x=g.x*.35,v.position.z=g.z*.35},dispose(){i.remove(a),r.dispose(),o.dispose();for(const f of h)i.remove(f),f.geometry.dispose(),f.material.dispose();u.dispose(),i.environment=null,i.fog=null}}}const Zc=new O(-.58,.42,.38).normalize();function qu(i){if(typeof OffscreenCanvas<"u")try{return new OffscreenCanvas(i,i)}catch{}if(typeof document>"u")return null;const t=document.createElement("canvas");return t.width=i,t.height=i,t}function vn(i,t,{srgb:e=!1,wrap:n=$i}={}){const s=qu(i);if(!s)return null;const r=s.getContext("2d",{willReadFrequently:!1}),o=r.createImageData(i,i);t(o.data,i),r.putImageData(o,0,0);const a=new Ru(s);return a.wrapS=n,a.wrapT=n,a.colorSpace=e?Ye:fn,a.minFilter=Sn,a.magFilter=Be,a.anisotropy=4,a.needsUpdate=!0,a}function Ls(i,t,e){const n=new Uint8Array(t*t*4),s=(h,d)=>i[(d+t)%t*t+(h+t)%t],r=new Float32Array(t*t),o=new Float32Array(t*t);let a=0;for(let h=0;h<t;h++)for(let d=0;d<t;d++){const f=h*t+d;r[f]=s(d+1,h)-s(d-1,h),o[f]=s(d,h+1)-s(d,h-1),a+=r[f]*r[f]+o[f]*o[f]}const l=Math.sqrt(a/(t*t*2))||1e-6,c=e/l;for(let h=0;h<t;h++)for(let d=0;d<t;d++){const f=h*t+d;let g=-r[f]*c,v=-o[f]*c,m=1;const p=Math.hypot(g,v,m)||1;g/=p,v/=p,m/=p;const y=(h*t+d)*4;n[y]=Math.round((g*.5+.5)*255),n[y+1]=Math.round((v*.5+.5)*255),n[y+2]=Math.round((m*.5+.5)*255),n[y+3]=255}const u=new Wa(n,t,t,qe,bn);return u.wrapS=$i,u.wrapT=$i,u.minFilter=Sn,u.magFilter=Be,u.generateMipmaps=!0,u.colorSpace=fn,u.needsUpdate=!0,u}function Ra(i,t,e){const n=i>>16&255,s=i>>8&255,r=i&255,o=t>>16&255,a=t>>8&255,l=t&255;return[n+(o-n)*e,s+(a-s)*e,r+(l-r)*e]}function P_(i,t,e){const n=rn(t),s=rn(t+977),r=new Float32Array(i*i),o=vn(i,(l,c)=>{for(let u=0;u<c;u++){const h=u/c;for(let d=0;d<c;d++){const f=d/c,g=oe(n,f*6,h*3,3)*.12,v=Rs(s,f*3,(h+g)*7,3),m=oe(n,f*18,h*18,4,.55),p=oe(s,f*22,h*1.2,3),y=ve(.52,.86,p)*ve(.05,.7,h),M=ve(.62,.16,v);r[u*c+d]=v*.72+m*.11+y*.17;const _=.35+.5*(1-h);let[X,R,L]=Ra(3816774,7169368,_*(.45+v*.55));const D=ve(.78,.98,v)*.5,[E,x,I]=Ra(0,9143160,1);X+=E*D*.35,R+=x*D*.35,L+=I*D*.35;const G=M*.55+y*.6;X*=1-G*.55,R*=1-G*.5,L*=1-G*.42;const V=(m-.5)*14,T=(u*c+d)*4;l[T]=Math.max(0,Math.min(255,X+V)),l[T+1]=Math.max(0,Math.min(255,R+V*.7)),l[T+2]=Math.max(0,Math.min(255,L+V*.4)),l[T+3]=255}}},{srgb:!0}),a=vn(i,(l,c)=>{for(let u=0;u<c;u++){const h=u/c;for(let d=0;d<c;d++){const f=d/c,g=oe(n,f*18,h*18,4,.55),v=oe(s,f*22,h*1.2,3),p=.98-ve(.52,.86,v)*ve(.05,.7,h)*.16+(g-.5)*.07,y=(u*c+d)*4,M=Math.max(0,Math.min(255,p*255));l[y]=M,l[y+1]=M,l[y+2]=M,l[y+3]=255}}});return{albedo:o,rough:a,normal:e?Ls(r,i,.3):null}}function I_(i,t,e){const n=rn(t+31),s=rn(t+1301),r=new Float32Array(i*i),o=vn(i,(l,c)=>{for(let u=0;u<c;u++)for(let h=0;h<c;h++){const d=h/c,f=u/c,g=oe(n,d*17,f*17,3,.55),v=oe(s,d*2.2,f*2.2,4),m=Nc(oe(s,d*5+11,f*5,3),1.4),p=ve(.84,.98,Rs(n,d*22+f*5,f*1.6,2));r[u*c+h]=v*.8+g*.08+p*.12;let[y,M,_]=Ra(4999756,6643540,.25+v*.75);const X=(g-.5)*8;y+=X,M+=X*.9,_+=X*.75,y=y*(1-m*.16)+124*m*.16,M=M*(1-m*.16)+118*m*.16,_=_*(1-m*.16)+109*m*.16,y+=p*15,M+=p*14,_+=p*12;const R=(u*c+h)*4;l[R]=Math.max(0,Math.min(255,y)),l[R+1]=Math.max(0,Math.min(255,M)),l[R+2]=Math.max(0,Math.min(255,_)),l[R+3]=255}},{srgb:!0}),a=vn(i,(l,c)=>{for(let u=0;u<c;u++)for(let h=0;h<c;h++){const d=h/c,f=u/c,g=Nc(oe(s,d*5+11,f*5,3),1.4),v=ve(.84,.98,Rs(n,d*22+f*5,f*1.6,2)),m=.74+g*.2-v*.26,p=Math.max(0,Math.min(255,m*255)),y=(u*c+h)*4;l[y]=p,l[y+1]=p,l[y+2]=p,l[y+3]=255}});return{albedo:o,rough:a,normal:e?Ls(r,i,.32):null}}function L_(i,t,e){const n=rn(t+77),s=new Float32Array(i*i);return{rough:vn(i,(o,a)=>{for(let l=0;l<a;l++)for(let c=0;c<a;c++){const u=c/a,h=l/a,d=oe(n,u*64,h*64,3,.62),f=Rs(n,u*7,h*7,3),g=ve(.55,.95,f);s[l*a+c]=d*.35+f*.65;const v=.86-g*.34+(d-.5)*.1,m=Math.max(0,Math.min(255,v*255)),p=(l*a+c)*4;o[p]=m,o[p+1]=m,o[p+2]=m,o[p+3]=255}}),normal:e?Ls(s,i,.45):null}}function D_(i,t,e){const n=rn(t+401),s=new Float32Array(i*i);return{rough:vn(i,(o,a)=>{for(let l=0;l<a;l++)for(let c=0;c<a;c++){const u=c/a,h=l/a,d=Math.sin(u*Math.PI*2*(a/4))*.5+.5,f=Math.sin(h*Math.PI*2*(a/4))*.5+.5,g=(d*.5+f*.5)*.4+oe(n,u*12,h*12,3)*.6;s[l*a+c]=g;const v=.93+(g-.5)*.1,m=Math.max(0,Math.min(255,v*255)),p=(l*a+c)*4;o[p]=m,o[p+1]=m,o[p+2]=m,o[p+3]=255}}),normal:e?Ls(s,i,.3):null}}function U_(i,t,e){const n=rn(t+613),s=new Float32Array(i*i);return{rough:vn(i,(o,a)=>{for(let l=0;l<a;l++)for(let c=0;c<a;c++){const u=c/a,h=l/a,d=oe(n,u*90,h*3,3,.6),f=oe(n,u*5+3,h*5,3),g=ve(.62,.9,f);s[l*a+c]=d*.25+f*.2;const v=.3+d*.2+g*.45,m=Math.max(0,Math.min(255,v*255)),p=(l*a+c)*4;o[p]=m,o[p+1]=m,o[p+2]=m,o[p+3]=255}}),normal:e?Ls(s,i,.2):null}}function N_(i,t){const e=rn(t+907);return vn(i,(n,s)=>{const r=(s-1)/2;for(let o=0;o<s;o++)for(let a=0;a<s;a++){const l=(a-r)/r,c=(o-r)/r,u=Math.hypot(l,c),h=Math.atan2(c,l),d=oe(e,Math.cos(h)*3+4,Math.sin(h)*3+4,4)*.42,f=oe(e,a/s*7,o/s*7,4);let g=ve(1+d,.15,u)*(.55+f*.75);g=Math.max(0,Math.min(1,g));const v=(o*s+a)*4;n[v]=255,n[v+1]=255,n[v+2]=255,n[v+3]=g*255}},{wrap:yn})}function F_(i){return vn(i,(t,e)=>{const n=(e-1)/2;for(let s=0;s<e;s++)for(let r=0;r<e;r++){const o=Math.hypot((r-n)/n,(s-n)/n),a=ve(.22,0,o),l=ve(1,.1,o)*.35,c=Math.max(0,Math.min(1,a+l)),u=(s*e+r)*4;t[u]=255,t[u+1]=255,t[u+2]=255,t[u+3]=c*255}},{wrap:yn})}function O_(i,t){const e=qu(i);if(!e)return null;const n=e.getContext("2d");n.clearRect(0,0,i,i);const s=yi(t+5),r=i/2,o=i/2,a=5;n.strokeStyle="#150f0c",n.lineCap="round",n.lineJoin="round";for(let u=0;u<a;u++){const h=u/a*Math.PI*2+s()*.9;let d=r,f=o,g=h;const v=5+Math.floor(s()*3);let m=i*.016;const p=i*.34/v;n.globalAlpha=.8;for(let y=0;y<v;y++){g+=(s()-.5)*.85;const M=d+Math.cos(g)*p,_=f+Math.sin(g)*p;if(n.beginPath(),n.lineWidth=Math.max(.7,m),n.moveTo(d,f),n.lineTo(M,_),n.stroke(),s()<.45&&y<v-1){const X=g+(s()-.5)*1.7;n.beginPath(),n.lineWidth=Math.max(.6,m*.5),n.moveTo(M,_),n.lineTo(M+Math.cos(X)*p*.8,_+Math.sin(X)*p*.8),n.stroke()}d=M,f=_,m*=.74}}n.globalAlpha=1;const l=n.createRadialGradient(r,o,0,r,o,i*.3);l.addColorStop(0,"rgba(214, 138, 74, 0.62)"),l.addColorStop(.45,"rgba(140, 68, 26, 0.3)"),l.addColorStop(1,"rgba(0, 0, 0, 0)"),n.globalCompositeOperation="source-atop",n.fillStyle=l,n.fillRect(0,0,i,i),n.globalCompositeOperation="source-over";const c=new Ru(e);return c.colorSpace=Ye,c.minFilter=Sn,c.magFilter=Be,c.needsUpdate=!0,c}function k_(i,t){const e=rn(t+3301),n=rn(t+5507);return vn(i,(s,r)=>{for(let o=0;o<r;o++)for(let a=0;a<r;a++){const l=a/r,c=o/r,u=l-.5,h=c-.5,d=Math.hypot(u,h)*2,f=oe(e,l*3.1,c*3.1,4,.55),g=Rs(n,l*4.3+7,c*4.3+7,3),v=oe(n,l*9.5,c*9.5,3,.5),m=ve(.45,1,d),p=ve(.62,.08,d);let y=.62+f*.42+g*.3+v*.14;y*=1-m*.3,y*=1+p*.2;const M=Math.max(0,Math.min(255,y*200)),_=(o*r+a)*4;s[_]=M,s[_+1]=M,s[_+2]=M,s[_+3]=255}},{wrap:yn})}function z_(i,t){const e=rn(t+1777);return vn(i,(n,s)=>{for(let r=0;r<s;r++)for(let o=0;o<s;o++){const a=oe(e,o/s*8,r/s*8,4,.55),l=Math.max(0,Math.min(255,a*255)),c=(r*s+o)*4;n[c]=l,n[c+1]=l,n[c+2]=l,n[c+3]=255}})}function B_(i,t=20240501){const e=i.texRock,n=i.texDetail,s=i.normalMaps,r=P_(e,t,s),o=I_(e,t,s),a=L_(n,t,s),l=D_(n,t,s),c=U_(n,t,s),u={cliff:r,crust:o,leather:a,cloth:l,metal:c,dust:N_(Math.max(64,n),t),ember:F_(64),crack:O_(Math.max(128,n*2),t),turbulence:z_(Math.max(64,n),t),arenaMacro:k_(Math.max(128,e),t),dispose(){const h=new Set,d=f=>{f&&!h.has(f)&&(h.add(f),f.dispose())};[r,o,a,l,c].forEach(f=>{f&&(d(f.albedo),d(f.rough),d(f.normal))}),d(u.dust),d(u.ember),d(u.crack),d(u.turbulence),d(u.arenaMacro)}};return u}const H_=1,G_=`
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
`,V_=`
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
`,W_=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,X_=`
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
`;function Y_({scene:i,quality:t,textures:e,seed:n=4242}){const s=yi(n),r=new ge;r.name="vfx",i.add(r);const o=Ps({scene:r,budget:t.dustBudget,texture:e.dust,blending:Ge,depthWrite:!1,renderOrder:3}),a=Ps({scene:r,budget:t.emberBudget,texture:e.ember,blending:qi,depthWrite:!1,renderOrder:4});a.points.layers.enable(H_),a.points.userData.bloomSelf=!0;const l=new ut(Ut.grime).lerp(new ut(Ut.rockBody),.4),c=new ut(Ut.rockTop).lerp(new ut(Ut.keyLight),.28),u=new ut(16773327),h=new ut(Ut.crackDeep),d=new ut;function f(Y,K,z,lt,j){Ar(Y,K,z,lt,j,s)}function g(Y,K,z,lt,j,mt,At=1){for(let Rt=0;Rt<lt;Rt++){const Ht=s()*Math.PI*2,xt=Math.pow(s(),.6);d.copy(l).lerp(c,s()*.85),f(o,Y+(s()-.5)*.25,K+s()*.2,z+(s()-.5)*.25,{vx:Math.cos(Ht)*xt*j,vy:mt*(.35+s()*.9),vz:Math.sin(Ht)*xt*j,life:.9+s()*1.7,spin:(s()-.5)*1.4,grow:(1.6+s()*2.2)*At,drag:1.9+s()*1.4,size:(.5+s()*.9)*At,alpha:.3+s()*.3,color:d})}}function v(Y,K,z,lt,j){for(let mt=0;mt<lt;mt++){const At=s()*Math.PI*2,Rt=1.5+s()*3.5;d.copy(u),f(a,Y,K,z,{vx:Math.cos(At)*(1+s()*2.4)*j,vy:Rt,vz:Math.sin(At)*(1+s()*2.4)*j,life:.7+s()*1.1,spin:0,grow:-.5,drag:.6,size:.06+s()*.09,alpha:.9,color:d})}}const m=new De(1,20,14),p=new mi(.05,1,40,1),y=[],M=[];function _(){const Y=new Ee({vertexShader:G_,fragmentShader:V_,transparent:!0,depthWrite:!1,side:Ie,blending:Ge,uniforms:{uNoise:{value:e.turbulence},uColorLit:{value:new ut(Ut.rockTop).lerp(new ut(Ut.keyLight),.35)},uColorDark:{value:new ut(Ut.fog).lerp(new ut(Ut.grime),.35)},uLife:{value:0},uOpacity:{value:.9}}}),K=new Yt(m,Y);K.visible=!1,K.renderOrder=2,r.add(K);const z={mesh:K,mat:Y,t:-1,dur:.3,scale:new O(1,1,1)};return y.push(z),z}function X(){const Y=new Ee({vertexShader:W_,fragmentShader:X_,transparent:!0,depthWrite:!1,side:Ie,blending:Ge,uniforms:{uNoise:{value:e.turbulence},uColor:{value:new ut(Ut.rockTop).lerp(new ut(Ut.keyLight),.2)},uLife:{value:0},uOpacity:{value:.6}}}),K=new Yt(p,Y);K.rotation.x=-Math.PI/2,K.visible=!1,K.renderOrder=2,r.add(K);const z={mesh:K,mat:Y,t:-1,dur:.55,radius:3};return M.push(z),z}const R=Array.from({length:t.shockRings+2},_),L=Array.from({length:t.shockRings+1},X);function D(){return R.find(Y=>Y.t<0)??R[0]}function E(){return L.find(Y=>Y.t<0)??L[0]}const x=new wn(.16,0),I=new se({color:new ut(6643026),roughness:.98,metalness:0,flatShading:!0,envMapIntensity:.15}),G=new sn(x,I,t.debrisBudget);G.instanceMatrix.setUsage(Le),G.castShadow=t.shadows,G.frustumCulled=!1,G.count=0,r.add(G);const V=[],T=new Jt,U=new Hn(1,1),k=[];let b=0;for(let Y=0;Y<t.decalBudget;Y++){const K=new gn({map:e.crack,transparent:!0,depthWrite:!1,opacity:0,polygonOffset:!0,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),z=new Yt(U,K);z.rotation.x=-Math.PI/2,z.visible=!1,z.renderOrder=2,r.add(z),k.push({mesh:z,mat:K,t:-1,hold:0})}function P(Y,K,z,lt){if(k.length===0)return;const j=k[b%k.length];b++,j.mesh.position.set(Y,.016,K),j.mesh.rotation.z=s()*Math.PI*2,j.mesh.scale.setScalar(z),j.mesh.visible=!0,j.t=0,j.peak=.24+lt*.2}const q=new O(0,1,0),et=new O;let $=0;const pt={group:r,slap(Y,K,z=1){const lt=Math.max(.35,Math.min(2.2,z));et.copy(K??q),et.y=0,et.lengthSq()<1e-5&&et.set(0,0,1),et.normalize();const j=D();j.t=0,j.dur=.26+lt*.09,j.mesh.position.copy(Y),j.mesh.visible=!0,j.mesh.lookAt(Y.x+et.x,Y.y,Y.z+et.z),j.scale.set(.85*lt,.6*lt,.36*lt),j.mat.uniforms.uOpacity.value=.38+lt*.14,g(Y.x+et.x*.3,Y.y,Y.z+et.z*.3,Math.round(15*lt*(t.name==="low"?.4:1)),2.6*lt,.8,.8+lt*.2),t.name!=="low"&&v(Y.x,Y.y,Y.z,Math.round(3*lt),.6)},heavyImpact(Y,K=1,z={}){const lt=Math.max(.5,Math.min(2.5,K));pt.slap(Y,z.dir??q,lt);const j=E();j.t=0,j.dur=.5+lt*.15,j.radius=2.4*lt,j.mesh.position.set(Y.x,.05,Y.z),j.mesh.visible=!0,g(Y.x,.1,Y.z,Math.round(22*lt*(t.name==="low"?.35:1)),4.2*lt,.5,1.3),v(Y.x,.2,Y.z,Math.round(6*lt*(t.name==="low"?.3:1)),1),pt.spawnDebris(Y,lt),z.crack!==!1&&P(Y.x,Y.z,1.9+lt*1.1,Math.min(1,lt/2))},spawnDebris(Y,K){const z=Math.round(t.debrisPerBurst*Math.min(1.6,K));for(let lt=0;lt<z&&!(V.length>=t.debrisBudget);lt++){const j=s()*Math.PI*2,mt=(1.5+s()*4)*K;V.push({p:new O(Y.x+(s()-.5)*.5,Y.y+.15,Y.z+(s()-.5)*.5),v:new O(Math.cos(j)*mt*.6,3+s()*4.5,Math.sin(j)*mt*.6),rot:new O(s()*6,s()*6,s()*6),spin:new O((s()-.5)*9,(s()-.5)*9,(s()-.5)*9),scale:.32+s()*.7,life:0,maxLife:2+s()*1.2})}},footDust(Y,K,z,lt){t.footDust&&(lt<3.2||g(Y,K+.06,z,1,.6,.25,.55))},fallTrail(Y,K,z){g(Y,K,z,1,.5,-.4,.9)},ambientDrift(Y,K){if(t.name==="low")return;$+=Y;const z=t.name==="high"?.16:.34;for(;$>z;){$-=z;const lt=s()*Math.PI*2,j=2+s()*13;d.copy(l).lerp(c,s()*.7),f(o,K.x+Math.cos(lt)*j,.3+s()*4.5,K.z+Math.sin(lt)*j,{vx:(s()-.5)*.25,vy:.18+s()*.3,vz:(s()-.5)*.25,life:4+s()*4,spin:(s()-.5)*.3,grow:.5,drag:.25,size:.16+s()*.3,alpha:.05+s()*.07,color:d})}},awakenMotes(Y,K,z){t.name!=="low"&&(s()>.35||v(Y,K,z,1,.25))},crack(Y,K,z=4,lt=1){P(Y,K,z,lt)},update(Y,K){for(const z of[o,a]){const lt=z.arrays,j=z===a;for(let mt=z.count-1;mt>=0;mt--){z.life[mt]+=Y;const At=z.life[mt]/z.maxLife[mt];if(At>=1){el(z,mt);continue}const Rt=Math.exp(-z.drag[mt]*Y);if(z.vel[mt*3]*=Rt,z.vel[mt*3+2]*=Rt,z.vel[mt*3+1]=j?z.vel[mt*3+1]*Rt-2.2*Y:(z.vel[mt*3+1]-1.1*Y)*Rt,lt.pos[mt*3]+=z.vel[mt*3]*Y,lt.pos[mt*3+1]+=z.vel[mt*3+1]*Y,lt.pos[mt*3+2]+=z.vel[mt*3+2]*Y,!j&&lt.pos[mt*3+1]<.04&&z.vel[mt*3+1]<0&&(lt.pos[mt*3+1]=.04,z.vel[mt*3+1]=0,z.vel[mt*3]*=.86,z.vel[mt*3+2]*=.86),lt.rot[mt]+=z.spin[mt]*Y,lt.size[mt]=z.baseSize[mt]+z.grow[mt]*At,j)d.copy(u).lerp(h,Math.min(1,At*1.5)),lt.color[mt*3]=d.r,lt.color[mt*3+1]=d.g,lt.color[mt*3+2]=d.b,lt.alpha[mt]=z.baseAlpha[mt]*(1-At*At);else{const Ht=Math.min(1,At/.12);lt.alpha[mt]=z.baseAlpha[mt]*Ht*(1-At)*(1-At*.4)}}nl(z)}for(const z of y){if(z.t<0)continue;if(z.t+=Y/z.dur,z.t>=1){z.t=-1,z.mesh.visible=!1;continue}const lt=1-Math.pow(1-z.t,2.4),j=.45+lt*2.2;z.mesh.scale.set(z.scale.x*j,z.scale.y*j,z.scale.z*j*(1+lt*1.4)),z.mat.uniforms.uLife.value=z.t}for(const z of M){if(z.t<0)continue;if(z.t+=Y/z.dur,z.t>=1){z.t=-1,z.mesh.visible=!1;continue}const lt=1-Math.pow(1-z.t,2.6);z.mesh.scale.setScalar(.4+lt*z.radius),z.mat.uniforms.uLife.value=z.t}if(V.length>0){const z=t.mergedDebris;for(let lt=V.length-1;lt>=0;lt--){const j=V[lt];if(j.life+=Y,j.life>=j.maxLife){V.splice(lt,1);continue}j.v.y-=22*Y,j.p.addScaledVector(j.v,Y),j.p.y<.08&&(j.p.y=.08,j.v.y*=-.32,j.v.x*=.62,j.v.z*=.62,j.spin.multiplyScalar(.5)),z||(j.rot.x+=j.spin.x*Y,j.rot.y+=j.spin.y*Y,j.rot.z+=j.spin.z*Y)}G.count=Math.min(V.length,t.debrisBudget);for(let lt=0;lt<G.count;lt++){const j=V[lt];T.position.copy(j.p),T.rotation.set(j.rot.x,j.rot.y,j.rot.z);const mt=1-Math.max(0,(j.life-j.maxLife*.7)/(j.maxLife*.3));T.scale.setScalar(j.scale*mt),T.updateMatrix(),G.setMatrixAt(lt,T.matrix)}G.instanceMatrix.needsUpdate=!0,G.visible=G.count>0}else G.count!==0&&(G.count=0,G.visible=!1);for(const z of k){if(z.t<0)continue;z.t+=Y;const lt=Math.min(1,z.t/.18),j=z.t>9?Math.max(0,1-(z.t-9)/6):1;z.mat.opacity=(z.peak??.8)*lt*j,j<=0&&(z.t=-1,z.mesh.visible=!1)}},setPixelScale(Y){o.mat.uniforms.uPixelScale.value=Y,a.mat.uniforms.uPixelScale.value=Y},dispose(){o.dispose(),a.dispose(),m.dispose(),p.dispose();for(const Y of y)Y.mat.dispose();for(const Y of M)Y.mat.dispose();for(const Y of k)Y.mat.dispose();U.dispose(),x.dispose(),I.dispose(),i.remove(r)}};return pt}const Kc=new O(0,1,0),q_=["locked","free"],Z_="locked";function Jc(i){if(typeof i!="string")return null;const t=i.trim().toLowerCase();return q_.includes(t)?t:null}function $c(i,t){const e=gv(i);return t.set(e.x,0,e.z)}class K_{constructor(t,e={}){this.canvas=t,this.opts=e,this.tier=Dc(e.quality??e.tier??"high"),this.quality=Aa[this.tier],this.mobile=!!e.mobile,this.seed=Number.isFinite(e.seed)?e.seed:20240501,this.arenaRadius=Number.isFinite(e.arenaRadius)?e.arenaRadius:20,this.forcedLocalId=e.localId??null,this.followId=e.followId??null,this.localId=this.forcedLocalId,this.spectator=!!e.spectator,this.disposed=!1,this.lookPitch=Number.isFinite(e.pitch)?e.pitch:null,this.lookYaw=Number.isFinite(e.lookYaw??e.simYaw)?e.lookYaw??e.simYaw:null,this.lookMode=Jc(e.lookMode)??Z_,this.skins=e.skins||il(e.data??null),this.renderer=new tg({canvas:t,antialias:!1,alpha:!1,powerPreference:e.powerPreference??"high-performance",stencil:!1,depth:!0,preserveDrawingBuffer:!!e.preserveDrawingBuffer}),this.renderer.toneMapping=zn,this.renderer.autoClear=!1,this.renderer.setClearColor(0,1),this.renderer.info.autoReset=!1,this.renderer.shadowMap.autoUpdate=!1,this.clock=new Wg,this.time=0,this.frame=0,this.view=null,this.lastRawEvents=null,this.lastTick=null,this.scene=new Va,this.cameraRig=Qg({mobile:this.mobile}),this.camera=this.cameraRig.camera,this._focus=new O(0,0,0),this._cullAt=new O(0,0,0),this._vel=new O,this._tmp=new O,this._tmp2=new O,this._tmp3=new O,this._snapPending=!0,this._lastPhase=null,this._following=!1,this._prevFocusX=0,this._prevFocusZ=0,this._buildWorld();const n=e.width??t.clientWidth??t.width??960,s=e.height??t.clientHeight??t.height??540;this.resize(n,s,e.pixelRatio??(typeof window<"u"?window.devicePixelRatio:1))}_buildWorld(){const t=this.quality;this.renderer.shadowMap.enabled=t.shadows,this.renderer.shadowMap.type=t.softShadows?jc:Ia,this.textures=B_(t,this.seed),this.sky=R_({scene:this.scene,renderer:this.renderer,quality:t,textures:this.textures,sunDir:Zc}),this.lighting=x_({scene:this.scene,quality:t,sunDir:Zc}),this.island=__({scene:this.scene,quality:t,textures:this.textures,arenaRadius:this.arenaRadius,seed:this.seed}),this.characters=Jv({scene:this.scene,quality:t,textures:this.textures,skins:this.skins}),this.hub=d_({scene:this.scene,quality:t,textures:this.textures,seed:this.seed}),this.vfx=Y_({scene:this.scene,quality:t,textures:this.textures,seed:this.seed}),this.combatVfx=hv({scene:this.scene,quality:t,textures:this.textures,seed:this.seed}),this.post=b_({renderer:this.renderer,scene:this.scene,quality:t}),this.view&&(this.island.syncTiles(this.view.tiles,this.view.arena),this.characters.reconcile(this.view.players,this.localId),this.island.setActive(!this.hub.sync(this.view.hub,1/60,this.time)))}_teardownWorld(){var t,e,n,s,r,o,a,l,c;(t=this.post)==null||t.dispose(),(e=this.combatVfx)==null||e.dispose(),this.combatVfx=null,(n=this.vfx)==null||n.dispose(),(s=this.hub)==null||s.dispose(),(r=this.characters)==null||r.dispose(),(o=this.island)==null||o.dispose(),(a=this.lighting)==null||a.dispose(),(l=this.sky)==null||l.dispose(),(c=this.textures)==null||c.dispose(),this.post=null,this.vfx=null,this.hub=null,this.characters=null,this.island=null,this.lighting=null,this.sky=null,this.textures=null}setQuality(t){const e=Dc(t);return e===this.tier?this.tier:(this.tier=e,this.quality=Aa[e],this._teardownWorld(),this._buildWorld(),this.resize(this._w,this._h,this._dpr),this.tier)}resize(t,e,n){var d,f,g,v;const s=Math.max(1,Math.floor(t||1)),r=Math.max(1,Math.floor(e||1)),o=Number.isFinite(n)&&n>0?n:1,a=Math.min(o,this.quality.dprCap,ev);this._w=s,this._h=r,this._dpr=o,this._ratio=a,this.renderer.setPixelRatio(a),this.renderer.setSize(s,r,!1),this.cameraRig.resize(s/r);const l=Math.floor(s*a),c=Math.floor(r*a);(d=this.post)==null||d.setSize(l,c);const u=this.camera.fov*Math.PI/180,h=c/(2*Math.tan(u/2));return(f=this.vfx)==null||f.setPixelScale(h),(g=this.combatVfx)==null||g.setPixelScale(h),(v=this.hub)==null||v.setPixelScale(h),{width:s,height:r,pixelRatio:a}}setMobile(t){this.mobile=!!t,this.cameraRig.setMobile(this.mobile)}setSpectator(t){const e=!!t;this.spectator&&!e&&(this._snapPending=!0),this.spectator=e}setLocalId(t){const e=t??null;return e!==this.forcedLocalId&&(this._snapPending=!0),this.forcedLocalId=e,this.forcedLocalId}snapCamera(){return this._snapPending=!0,!0}resetFollow(){return this.snapCamera()}setLookMode(t){const e=Jc(t);return e&&e!==this.lookMode&&(this.lookMode=e,this.cameraRig.releaseBehind()),this.lookMode}getLookMode(){return this.lookMode}setFollow(t){return this.setLocalId(t)}setLook(t={}){const e=typeof t=="number"?{pitch:t}:t||{};return Number.isFinite(e.pitch)?this.lookPitch=Math.max(-Wi,Math.min(Wi,e.pitch)):e.pitch===null&&(this.lookPitch=null),Number.isFinite(e.simYaw)?this.lookYaw=e.simYaw:e.simYaw===null?this.lookYaw=null:Number.isFinite(e.yaw)?this.lookYaw=e.yaw:e.yaw===null&&(this.lookYaw=null),e.lookMode!==void 0&&this.setLookMode(e.lookMode),{pitch:this.lookPitch,yaw:this.lookYaw,lookMode:this.lookMode}}setPitch(t){return this.setLook({pitch:t}).pitch}getLook(){return{pitch:this.lookPitch??Tr,yaw:this.lookYaw,simYaw:this.lookYaw,lookMode:this.lookMode,cameraPitch:this.cameraRig.state.pitchOut,cameraYaw:this.cameraRig.state.yaw}}_pitchBias(){return this.lookPitch==null?0:this.lookPitch-Tr}_followYaw(t){const e=Number.isFinite(t==null?void 0:t.yaw)?t.yaw:0;return this.lookMode==="locked"||this.lookYaw==null?e:this.lookYaw}_behindYaw(t){return this.lookMode==="locked"&&Number.isFinite(t)?t:void 0}_phaseChanged(t){const e=this._lastPhase!==null&&t!==this._lastPhase;return e&&(this._snapPending=!0),this._lastPhase=t,e}_followCamera(t,e,n){const s=this._following&&Math.hypot(e.x-this._prevFocusX,e.z-this._prevFocusZ)>Zg;return this._prevFocusX=e.x,this._prevFocusZ=e.z,this._following=!0,this._snapPending||s?(this._snapPending=!1,this.cameraRig.snap(e,n,{pitchBias:this._pitchBias()}),!0):(this.cameraRig.update(t,e,n,this._vel,{pitchBias:this._pitchBias(),behindYaw:this._behindYaw(n)}),!1)}_notePhase(t){return this._phaseChanged(t),this._snapPending}_arenaChanged(t){!Number.isFinite(t)||Math.abs(t-this.arenaRadius)<.01||(this.arenaRadius=t,this._teardownWorld(),this._buildWorld(),this.resize(this._w,this._h,this._dpr))}_consumeEvents(t,e){if(t.tick!=null){if(t.tick===this.lastTick)return;this.lastTick=t.tick}else{if(e===this.lastRawEvents)return;this.lastRawEvents=e}if(t.events.length!==0)for(const n of t.events)this._handleEvent(n)}_eventPos(t,e,n,s){if(t.x!=null&&t.z!=null)return s.set(t.x,t.y!=null?t.y:1.1,t.z),s;const r=n??e;return r?(s.copy(r.pos),s.y+=1.2,s):null}_gloveOf(t,e){return t.gloveId??(e==null?void 0:e.activeGloveId)??null}_tintOf(t){return t?t.mats.paint.color:null}_strike(t,e,n,s,r,o={}){if(!n||!this.combatVfx)return null;const a=this._gloveOf(t,e),l=o.skill?av(t.skillId,a):Vu(a);return this.combatVfx.strike(l,n,s,r,{...o,tint:this._tintOf(e)}),l}_handleEvent(t){const e=t.actorId!=null?this.characters.get(t.actorId):null,n=t.targetId!=null?this.characters.get(t.targetId):null,s=t.power,r=t.targetId!=null&&t.targetId===this.localId,o=t.actorId!=null&&t.actorId===this.localId,a=this._tmp2;switch(e&&n?a.copy(n.pos).sub(e.pos):t.yaw!=null?$c(t.yaw,a):e?$c(e.yaw,a):a.set(0,0,-1),a.y=0,a.lengthSq()<1e-6&&a.set(0,0,-1),t.kind){case"swing":{e&&this.characters.playSlap(t.actorId,s);break}case"slap":{if(e&&this.characters.playSlap(t.actorId,s),t.hits===0&&e){const l=this._tmp.copy(e.pos).addScaledVector(a,1.4);l.y+=1.15,this._strike(t,e,l,a,s*.7,{whiff:!0})}break}case"hit":{const l=this._eventPos(t,e,n,this._tmp);if(l&&this.vfx.slap(l,a,s),l&&this._strike(t,e,l,a,s),e){const u=this._tmp3.copy(a).applyAxisAngle(Kc,-e.yaw);this.characters.playSlap(t.actorId,s,u.x>=0?1:-1)}n&&this.characters.playHit(t.targetId,a,s);const c=r?.55:o?.34:.12;this.cameraRig.impulse(c*s,r?2.6:1.2);break}case"heavy":{const l=this._eventPos(t,e,n,this._tmp);l&&this.vfx.heavyImpact(l,s*1.3,{dir:a}),l&&this._strike(t,e,l,a,s*1.3,{skill:!0}),n&&this.characters.playHit(t.targetId,a,s*1.3);const c=r?.95:o?.62:.28;this.cameraRig.impulse(c*s,r?4.2:2.2);break}case"skill":{const l=this._eventPos(t,e,n,this._tmp);e&&this.characters.playSlap(t.actorId,s*1.2);const c=l?this._strike(t,e,l,a,s*1.15,{skill:!0}):null;l&&(c==="slab"||c==="cinder")&&this.vfx.heavyImpact(l,s*1.15,{dir:a,crack:!1}),this.cameraRig.impulse(o?.5:.16,o?2.4:1);break}case"ko":{const l=this._eventPos(t,e,n,this._tmp);l&&this.vfx.fallTrail(l.x,l.y,l.z),(o||r)&&this.cameraRig.impulse(.4,1.5);break}case"awaken":{const l=e??n;if(l)for(let c=0;c<8;c++)this.vfx.awakenMotes(l.pos.x,l.pos.y+1.2,l.pos.z);this.cameraRig.impulse(o?.3:.1,1.2);break}case"dash":{t.x!=null&&this.vfx.footDust(t.x,Math.max(0,t.y??0)+.05,t.z,6);break}case"jump":case"respawn":{t.x!=null&&this.vfx.footDust(t.x,Math.max(0,t.y??0)+.05,t.z,5);break}case"tileCrack":{const l=this.island.crackTile(t,.45),c=t.x??(l==null?void 0:l.x),u=t.z??(l==null?void 0:l.z);c!=null&&this.vfx.footDust(c,.08,u,6);break}case"tileBreak":{const l=this.island.breakTile(t),c=t.x??(l==null?void 0:l.x),u=t.z??(l==null?void 0:l.z);if(c==null)break;this._tmp.set(c,.1,u),this.vfx.spawnDebris(this._tmp,1.5),this.vfx.heavyImpact(this._tmp,1.2,{dir:Kc,crack:!1});const h=this.characters.get(this.localId),d=h?Math.hypot(h.pos.x-c,h.pos.z-u):99;this.cameraRig.impulse(d<8?.5:.18,d<8?2:.8);break}}}sync(t,e){if(this.disposed)return;const n=Math.min(.05,Number.isFinite(e)?e:this.clock.getDelta());this.time+=n,this.frame++,this.renderer.info.reset();const s=t&&typeof t=="object"?t:{},r=Dv(s,{localId:this.forcedLocalId,followId:this.followId});this.lastRaw=s,this.view=r,this.localId=r.localId,this._arenaChanged(r.arena.radius),this.characters.reconcile(r.players,this.localId),this.characters.syncGhosts(r.ghosts),this.island.syncTiles(r.tiles,r.arena);const o=this.hub.sync(r.hub,n,this.time);this.island.setActive(!o),this._notePhase(o?"hub":"arena"),this._consumeEvents(r,s.events);const a=this.spectator||this.localId==null?null:r.players.find(c=>c.id===this.localId);a?this._cullAt.set(a.x??0,0,a.z??0):this._cullAt.set(this._focus.x,0,this._focus.z),this.characters.update(n,this.time,this._cullAt),this.island.update(n,this.time);for(const c of r.players){const u=this.characters.get(c.id);if(!(!u||!c.alive||!u.rootGroup.visible)){if(u.speed>3.2&&c.grounded&&this.frame%3===0&&this.vfx.footDust(u.pos.x,Math.max(0,u.pos.y),u.pos.z,u.speed),c.awakenedT>0)for(const h of u.arms)h.glove.getWorldPosition(this._tmp),this.vfx.awakenMotes(this._tmp.x,this._tmp.y,this._tmp.z);u.pos.y<-1.5&&this.vfx.fallTrail(u.pos.x,u.pos.y,u.pos.z)}}const l=this.spectator||this.localId==null?null:this.characters.get(this.localId);l?(this._focus.copy(l.pos),this._vel.set((l.pos.x-l.prev.x)/Math.max(n,1e-4),0,(l.pos.z-l.prev.z)/Math.max(n,1e-4)),this._followCamera(n,this._focus,this._followYaw(l))):(this.cameraRig.orbit(n,this.time,this.arenaRadius*1.35),this._focus.set(0,0,0),this._following=!1,this._snapPending=!0),this.vfx.ambientDrift(n,this._focus),this.vfx.update(n,this.time),this.combatVfx.update(n,this.time),this.lighting.update(this.time,this._focus),this.sky.update(this.time,this.camera.position),this.renderer.shadowMap.needsUpdate=this.quality.shadows,this.post.render(this.camera)}renderIdle(t){this.sync(this.lastRaw??{},t)}getStats(){var n,s,r,o,a,l,c,u;const t=this.renderer.info,e=((n=this.hub)==null?void 0:n.getStats())??null;return{tier:this.tier,phase:(r=(s=this.view)==null?void 0:s.hub)!=null&&r.active?"hub":"arena",hub:e,pixelRatio:this._ratio,size:[this._w,this._h],drawCalls:t.render.calls,triangles:t.render.triangles,programs:((o=t.programs)==null?void 0:o.length)??0,geometries:t.memory.geometries,textures:t.memory.textures,characters:((a=this.characters)==null?void 0:a.chars.size)??0,ghosts:((l=this.characters)==null?void 0:l.ghostCount)??0,combat:((c=this.combatVfx)==null?void 0:c.getStats())??null,pitch:this.cameraRig.state.pitchOut,tiles:((u=this.island)==null?void 0:u.tileCount)??0,localId:this.localId}}dispose(){var t,e;this.disposed||(this.disposed=!0,this._teardownWorld(),this.scene.clear(),this.renderer.dispose(),(e=(t=this.renderer).forceContextLoss)==null||e.call(t),this.view=null)}}let qt=null;function ex(i,t={}){return qt&&!qt.disposed&&qt.dispose(),qt=new K_(i,t),qt}function nx(i,t){!qt||qt.disposed||qt.sync(i,t)}function ix(i,t,e){return!qt||qt.disposed?null:qt.resize(i,t,e)}function sx(i){return!qt||qt.disposed?null:qt.setQuality(i)}function rx(){qt&&(qt.dispose(),qt=null)}function ox(i){qt==null||qt.setMobile(i)}function ax(i){qt==null||qt.setSpectator(i)}function J_(i){return(qt==null?void 0:qt.setLocalId(i))??null}function lx(i){return J_(i)}function cx(i){return qt&&!qt.disposed?qt.setLook(i):null}function ux(i){return qt&&!qt.disposed?qt.setLookMode(i):null}function hx(){return qt&&!qt.disposed?qt.getLookMode():null}function $_(){return qt&&!qt.disposed?qt.snapCamera():null}function fx(){return $_()}function dx(i){return qt&&!qt.disposed?qt.setPitch(i):null}function px(){return qt&&!qt.disposed?qt.getLook():null}function mx(){return qt&&!qt.disposed?qt.getStats():null}function gx(){return qt}export{Ca as ACCESSORIES,Q_ as CAMERA_SNAP_MAX_DIST,Zg as CAMERA_SNAP_TELEPORT,rv as COMBAT_VFX_KIND,Lo as DEFAULT_LOCAL_ID,tv as GLOVE_TINT,Ut as PALETTE,Aa as QUALITY,tx as QUALITY_TIERS,ov as SKILL_VFX_KIND,K_ as YizhangRenderer,pv as accessoryFromAppearance,Vu as combatVfxKind,ex as createRenderer,rx as dispose,px as getLook,hx as getLookMode,gx as getRenderer,mx as getStats,fx as resetFollow,ix as resize,mv as resolveSkinLook,lx as setFollow,J_ as setLocalId,cx as setLook,ux as setLookMode,ox as setMobile,dx as setPitch,sx as setQuality,ax as setSpectator,av as skillVfxKind,il as skinTable,$_ as snapCamera,nx as sync};
//# sourceMappingURL=index-Dr7Evxn_.js.map
