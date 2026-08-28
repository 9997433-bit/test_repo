// 异掌渲染适配层：对外保持历史 three 风格场景图（测试与视觉模块用），
// GPU 后端是 Babylon.js 8（见 ./webgl-renderer.js）。sim / combat 不 import 本目录。

export {
  NoBlending,
  NormalBlending,
  AdditiveBlending,
  SubtractiveBlending,
  MultiplyBlending,
  FrontSide,
  BackSide,
  DoubleSide,
  NoToneMapping,
  LinearToneMapping,
  PCFShadowMap,
  PCFSoftShadowMap,
  RepeatWrapping,
  ClampToEdgeWrapping,
  MirroredRepeatWrapping,
  NearestFilter,
  LinearFilter,
  LinearMipmapLinearFilter,
  RGBAFormat,
  UnsignedByteType,
  HalfFloatType,
  FloatType,
  NoColorSpace,
  SRGBColorSpace,
  LinearSRGBColorSpace,
  StaticDrawUsage,
  DynamicDrawUsage,
  StreamDrawUsage,
} from './constants.js';

export {
  Vector2,
  Vector3,
  Vector4,
  Color,
  Euler,
  Quaternion,
  Matrix3,
  Matrix4,
  Sphere,
  Box3,
} from './math.js';

export { Object3D, Group, Scene, Layers, FogExp2, Clock } from './object3d.js';

export {
  BufferAttribute,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  BufferGeometry,
  mergeGeometries,
} from './buffer.js';

export {
  BoxGeometry,
  PlaneGeometry,
  CircleGeometry,
  RingGeometry,
  LatheGeometry,
  SphereGeometry,
  CylinderGeometry,
  ConeGeometry,
  CapsuleGeometry,
  TorusGeometry,
  IcosahedronGeometry,
  OctahedronGeometry,
  Shape,
  ShapeGeometry,
  ExtrudeGeometry,
  CatmullRomCurve3,
  TubeGeometry,
} from './geometries.js';

export {
  Material,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  LineBasicMaterial,
  ShaderMaterial,
  RawShaderMaterial,
  Texture,
  CanvasTexture,
  DataTexture,
  WebGLRenderTarget,
  PMREMGenerator,
} from './materials.js';

export { Mesh, InstancedMesh, Skeleton, SkinnedMesh, Points, Line, LineSegments, Bone } from './mesh.js';

export { Camera, PerspectiveCamera, OrthographicCamera } from './camera.js';

export { Light, AmbientLight, HemisphereLight, DirectionalLight, PointLight, DirectionalLightShadow } from './lights.js';

export { WebGLRenderer } from './webgl-renderer.js';
