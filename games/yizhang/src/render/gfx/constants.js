// 与历史 three 常量同值，方便材质/混合/过滤代码原样搬过来。
// 运行期 GPU 由 Babylon.js 8 解释这些标志。

export const NoBlending = 0;
export const NormalBlending = 1;
export const AdditiveBlending = 2;
export const SubtractiveBlending = 3;
export const MultiplyBlending = 4;

export const FrontSide = 0;
export const BackSide = 1;
export const DoubleSide = 2;

export const NoToneMapping = 0;
export const LinearToneMapping = 1;

export const PCFShadowMap = 1;
export const PCFSoftShadowMap = 2;

export const RepeatWrapping = 1000;
export const ClampToEdgeWrapping = 1001;
export const MirroredRepeatWrapping = 1002;

export const NearestFilter = 1003;
export const LinearFilter = 1006;
export const LinearMipmapLinearFilter = 1008;

export const RGBAFormat = 1023;
export const UnsignedByteType = 1009;
export const HalfFloatType = 1016;
export const FloatType = 1015;

export const NoColorSpace = '';
export const SRGBColorSpace = 'srgb';
export const LinearSRGBColorSpace = 'srgb-linear';

export const StaticDrawUsage = 35044;
export const DynamicDrawUsage = 35048;
export const StreamDrawUsage = 35040;
