/**
* Shader for render to texture
*/
//precision mediump float;
//precision mediump int;
precision highp float;
precision highp int;
precision highp sampler3D;

uniform float xDim;
uniform float yDim;
uniform float zDim;

uniform sampler2D texBF;
uniform sampler2D texFF;
#if useWebGL2 == 0
uniform sampler2D texVolume;
uniform sampler2D texVolumeMask;
uniform sampler2D texVolumeAO;
#endif
#if useWebGL2 == 1
uniform sampler3D texVolume;
uniform sampler3D texVolumeMask;//currently 2D
uniform sampler3D texVolumeAO;
#endif
uniform sampler2D texTF;
uniform float opacityBarrier;
uniform vec3 lightDir;
uniform float isoThreshold;
uniform float brightness3D;
uniform float contrast3D;
uniform float volumeOpacity;
uniform vec3 SPOTcolor;
uniform bool showSolids;
uniform vec4 t_function1min;
uniform vec4 t_function1max;
uniform vec4 t_function2min;
uniform vec4 t_function2max;
uniform vec4 stepSize;
uniform float texSize;
uniform float tileCountX;
uniform float volumeSizeZ;
const int nOffsets = 64;
uniform vec3 ssaoOffsets[nOffsets];
varying mat4 local2ScreenMatrix;
varying vec4 screenpos;


#if useWebGL2 == 0
float tex3D(vec3 vecCur) {
  float tCX = 1.0 / tileCountX;
  vecCur = vecCur + vec3(0.5, 0.5, 0.5);
  // check outside of texture volume
  if ((vecCur.x < 0.0) || (vecCur.y < 0.0) || (vecCur.z < 0.0) || (vecCur.x > 1.0) ||  (vecCur.y > 1.0) || (vecCur.z > 1.0))
    return 0.0;
  float zSliceNumber1 = floor(vecCur.z  * (volumeSizeZ));
    float zRatio = (vecCur.z * (volumeSizeZ)) - zSliceNumber1;
  //zSliceNumber1 = min(zSliceNumber1, volumeSizeZ - 1.0);
  // As we use trilinear we go the next Z slice.
  float zSliceNumber2 = min( zSliceNumber1 + 1.0, (volumeSizeZ - 1.0)); //Clamp to 255
  vec2 texCoord = vecCur.xy;
  vec2 texCoordSlice1, texCoordSlice2;
  texCoordSlice1 = texCoordSlice2 = texCoord;

  // Add an offset to the original UV coordinates depending on the row and column number.
  texCoordSlice1.x += (mod(zSliceNumber1, tileCountX - 0.0 ));
  texCoordSlice1.y += floor(zSliceNumber1 / (tileCountX - 0.0) );
  // ratio mix between slices
  //float zRatio = mod(vecCur.z * (volumeSizeZ), 1.0);
  texCoordSlice2.x += (mod(zSliceNumber2, tileCountX - 0.0 ));
  texCoordSlice2.y += floor(zSliceNumber2 / (tileCountX - 0.0));

  // add 0.5 correction to texture coordinates
  float xSize = float(xDim);
  float ySize = float(yDim);
  vec2 vAdd = vec2(0.5 / xSize, 0.5 / ySize);
  texCoordSlice1 += vAdd;
  texCoordSlice2 += vAdd;

  // get colors from neighbour slices
  float colorSlice1 = texture2D(texVolume, clamp(texCoordSlice1 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
  float colorSlice2 = texture2D(texVolume, clamp(texCoordSlice2 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
  return mix(colorSlice1, colorSlice2, zRatio);
}

float tex3DAO(vec3 vecCur) {
  float tCX = 1.0 / tileCountX;
  vecCur = vecCur + vec3(0.5, 0.5, 0.5);
  // check outside of texture volume
  if ((vecCur.x < 0.0) || (vecCur.y < 0.0) || (vecCur.z < 0.0) || (vecCur.x > 1.0) ||  (vecCur.y > 1.0) || (vecCur.z > 1.0))
    return 0.0;
  float zSliceNumber1 = floor(vecCur.z  * (volumeSizeZ) + 0.5);
  //float zRatio = (vecCur.z * (volumeSizeZ)) - zSliceNumber1;
  //zSliceNumber1 = min(zSliceNumber1, volumeSizeZ - 1.0);
  // As we use trilinear we go the next Z slice.
  vec2 texCoord = vecCur.xy;
  vec2 texCoordSlice1;
  texCoordSlice1 = texCoord;

  // Add an offset to the original UV coordinates depending on the row and column number.
  texCoordSlice1.x += (mod(zSliceNumber1, tileCountX - 0.0 ));
  texCoordSlice1.y += floor(zSliceNumber1 / (tileCountX - 0.0) );

  // add 0.5 correction to texture coordinates
  float xSize = float(xDim);
  float ySize = float(yDim);
  vec2 vAdd = vec2(0.5 / xSize, 0.5 / ySize);
  texCoordSlice1 += vAdd;

  // get colors from neighbour slices
  float colorSlice1 = texture2D(texVolume, clamp(texCoordSlice1 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
//  float colorSlice2 = texture2D(texVolume, clamp(texCoordSlice2 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
//  return mix(colorSlice1, colorSlice2, zRatio);
  return colorSlice1;
}
/*
float tex3DAO(vec3 vecCur) {
  float tCX = 1.0 / tileCountX;
  vecCur = vecCur + vec3(0.5, 0.5, 0.5);
  // check outside of texture volume
  if ((vecCur.x < 0.0) || (vecCur.y < 0.0) || (vecCur.z < 0.0) || (vecCur.x > 1.0) ||  (vecCur.y > 1.0) || (vecCur.z > 1.0))
    return 0.0;
  float zSliceNumber1 = floor(vecCur.z  * (volumeSizeZ) + 0.5);
  float zRatio = (vecCur.z * (volumeSizeZ)) - zSliceNumber1;
  //zSliceNumber1 = min(zSliceNumber1, volumeSizeZ - 1.0);
  // As we use trilinear we go the next Z slice.
  float zSliceNumber2 = min( zSliceNumber1 + 1.0, (volumeSizeZ - 1.0)); //Clamp to 255
  vec2 texCoord = vecCur.xy;
  vec2 texCoordSlice1, texCoordSlice2;
  texCoordSlice1 = texCoordSlice2 = texCoord;

  // Add an offset to the original UV coordinates depending on the row and column number.
  texCoordSlice1.x += (mod(zSliceNumber1, tileCountX - 0.0 ));
  texCoordSlice1.y += floor(zSliceNumber1 / (tileCountX - 0.0) );
  // ratio mix between slices

  texCoordSlice2.x += (mod(zSliceNumber2, tileCountX - 0.0 ));
  texCoordSlice2.y += floor(zSliceNumber2 / (tileCountX - 0.0));

  // add 0.5 correction to texture coordinates
  float xSize = float(xDim);
  float ySize = float(yDim);
  vec2 vAdd = vec2(0.5 / xSize, 0.5 / ySize);
  texCoordSlice1 += vAdd;
  texCoordSlice2 += vAdd;

  // get colors from neighbour slices
  float colorSlice1 = texture2D(texVolume, clamp(texCoordSlice1 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
//  float colorSlice2 = texture2D(texVolume, clamp(texCoordSlice2 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
//  return mix(colorSlice1, colorSlice2, zRatio);
  return colorSlice1;
}
*/
vec4 tex3DRoi(vec3 vecCur) {
  float tCX = 1.0 / tileCountX;
  vecCur = vecCur + vec3(0.5, 0.5, 0.5);
  // check outside of texture volume
  if ((vecCur.x < 0.0) || (vecCur.y < 0.0) || (vecCur.z < 0.0) || (vecCur.x > 1.0) ||  (vecCur.y > 1.0) || (vecCur.z > 1.0))
    return vec4(0.0, 0.0, 0.0, 0.0);
  float zSliceNumber1 = floor(vecCur.z  * (volumeSizeZ));
    float zRatio = (vecCur.z * (volumeSizeZ)) - zSliceNumber1;
  //zSliceNumber1 = min(zSliceNumber1, volumeSizeZ - 1.0);
  // As we use trilinear we go the next Z slice.
  float zSliceNumber2 = min( zSliceNumber1 + 1.0, (volumeSizeZ - 1.0)); //Clamp to 255
  vec2 texCoord = vecCur.xy;
  vec2 texCoordSlice1, texCoordSlice2;
  texCoordSlice1 = texCoordSlice2 = texCoord;

  // Add an offset to the original UV coordinates depending on the row and column number.
  texCoordSlice1.x += (mod(zSliceNumber1, tileCountX - 0.0 ));
  texCoordSlice1.y += floor(zSliceNumber1 / (tileCountX - 0.0) );
  // ratio mix between slices
  //float zRatio = mod(vecCur.z * (volumeSizeZ), 1.0);
  texCoordSlice2.x += (mod(zSliceNumber2, tileCountX - 0.0 ));
  texCoordSlice2.y += floor(zSliceNumber2 / (tileCountX - 0.0));

  // add 0.5 correction to texture coordinates
  float xSize = float(xDim);
  float ySize = float(yDim);
  vec2 vAdd = vec2(0.5 / xSize, 0.5 / ySize);
  texCoordSlice1 += vAdd;
  texCoordSlice2 += vAdd;

  // get colors from neighbour slices
  vec4 colorSlice1 = texture2D(texVolume, clamp(texCoordSlice1 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0);
  vec4 colorSlice2 = texture2D(texVolume, clamp(texCoordSlice2 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0);
  return mix(colorSlice1, colorSlice2, zRatio);
}
float tex3DMask(vec3 vecCur) {
  float tCX = 1.0 / tileCountX;
  vecCur = vecCur + vec3(0.5, 0.5, 0.5);
  // check outside of texture volume
  if ((vecCur.x < 0.0) || (vecCur.y < 0.0) || (vecCur.z < 0.0) || (vecCur.x > 1.0) ||  (vecCur.y > 1.0) || (vecCur.z > 1.0))
    return 0.0;
  float zSliceNumber1 = floor(vecCur.z  * (volumeSizeZ));
    float zRatio = (vecCur.z * (volumeSizeZ)) - zSliceNumber1;
  //zSliceNumber1 = min(zSliceNumber1, volumeSizeZ - 1.0);
  // As we use trilinear we go the next Z slice.
  float zSliceNumber2 = min( zSliceNumber1 + 1.0, (volumeSizeZ - 1.0)); //Clamp to 255
  vec2 texCoord = vecCur.xy;
  vec2 texCoordSlice1, texCoordSlice2;
  texCoordSlice1 = texCoordSlice2 = texCoord;

  // Add an offset to the original UV coordinates depending on the row and column number.
  texCoordSlice1.x += (mod(zSliceNumber1, tileCountX - 0.0 ));
  texCoordSlice1.y += floor(zSliceNumber1 / (tileCountX - 0.0) );
  // ratio mix between slices
  //float zRatio = mod(vecCur.z * (volumeSizeZ), 1.0);
  texCoordSlice2.x += (mod(zSliceNumber2, tileCountX - 0.0 ));
  texCoordSlice2.y += floor(zSliceNumber2 / (tileCountX - 0.0));

  // add 0.5 correction to texture coordinates
  float xSize = float(xDim);
  float ySize = float(yDim);
  vec2 vAdd = vec2(0.5 / xSize, 0.5 / ySize);
  texCoordSlice1 += vAdd;
  texCoordSlice2 += vAdd;

  // get colors from neighbour slices
  float colorSlice1 = texture2D(texVolumeMask, clamp(texCoordSlice1 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
  float colorSlice2 = texture2D(texVolumeMask, clamp(texCoordSlice2 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
  return mix(colorSlice1, colorSlice2, zRatio);
}

float tex3DvolAO(vec3 vecCur) {
  float tCX = 1.0 / tileCountX;
  vecCur = vecCur + vec3(0.5, 0.5, 0.5);
  // check outside of texture volume
  if ((vecCur.x < 0.0) || (vecCur.y < 0.0) || (vecCur.z < 0.0) || (vecCur.x > 1.0) ||  (vecCur.y > 1.0) || (vecCur.z > 1.0))
    return 0.0;
  float zSliceNumber1 = floor(vecCur.z  * (volumeSizeZ));
    float zRatio = (vecCur.z * (volumeSizeZ)) - zSliceNumber1;
  //zSliceNumber1 = min(zSliceNumber1, volumeSizeZ - 1.0);
  // As we use trilinear we go the next Z slice.
  float zSliceNumber2 = min( zSliceNumber1 + 1.0, (volumeSizeZ - 1.0)); //Clamp to 255
  vec2 texCoord = vecCur.xy;
  vec2 texCoordSlice1, texCoordSlice2;
  texCoordSlice1 = texCoordSlice2 = texCoord;

  // Add an offset to the original UV coordinates depending on the row and column number.
  texCoordSlice1.x += (mod(zSliceNumber1, tileCountX - 0.0 ));
  texCoordSlice1.y += floor(zSliceNumber1 / (tileCountX - 0.0) );
  // ratio mix between slices
  //float zRatio = mod(vecCur.z * (volumeSizeZ), 1.0);
  texCoordSlice2.x += (mod(zSliceNumber2, tileCountX - 0.0 ));
  texCoordSlice2.y += floor(zSliceNumber2 / (tileCountX - 0.0));

  // add 0.5 correction to texture coordinates
  float xSize = float(xDim);
  float ySize = float(yDim);
  vec2 vAdd = vec2(0.5 / xSize, 0.5 / ySize);
  texCoordSlice1 += vAdd;
  texCoordSlice2 += vAdd;

  // get colors from neighbour slices
  float colorSlice1 = texture2D(texVolumeAO, clamp(texCoordSlice1 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
  float colorSlice2 = texture2D(texVolumeAO, clamp(texCoordSlice2 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
  return mix(colorSlice1, colorSlice2, zRatio);
}


#else
float tex3D(vec3 vecCur) {
 vecCur = vecCur + vec3(0.5, 0.5, 0.5);
 return texture(texVolume, vecCur).r;
}

float tex3DAO(vec3 vecCur) {
  vecCur = vecCur + vec3(0.5, 0.5, 0.5);
  return texture(texVolume, vecCur).r;
}

float tex3DvolAO(vec3 vecCur) {
  vecCur = vecCur + vec3(0.5, 0.5, 0.5);
  return texture(texVolumeAO, vecCur).r;
}

vec4 tex3DRoi(vec3 vecCur) {
  vecCur = vecCur + vec3(0.5, 0.5, 0.5);
  return texture(texVolume, vecCur);
}


float tex3DMask(vec3 vecCur) {
  vecCur = vecCur + vec3(0.5, 0.5, 0.5);
  return texture(texVolumeMask, vecCur).r;
}

#endif

vec3 CalcNormalRoi(vec3 iter)
{
  float d = 1.0 / texSize;
  vec3 dx = vec3(d, 0.0, 0.0), dy = vec3(0.0, d, 0.0), dz = vec3(0.0, 0.0, 1.0 / volumeSizeZ), N;
  // Culculate normal
  N.x = tex3DRoi(iter + dx).a - tex3DRoi(iter - dx).a;
  N.y = tex3DRoi(iter + dy).a - tex3DRoi(iter - dy).a;
  N.z = tex3DRoi(iter + dz).a - tex3DRoi(iter - dz).a;
  N = normalize(N);
  return N;
}

/*****************AMBIENT OCCLUSION*********************************/
mat3 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(0.1*angle);
    float c = cos(0.1*angle);
    float oc = 1.0 - c;

    return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c);
}

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

/**
* Rotate sampling vector around the normal
*/
vec3 transform2TangentSpace(vec3 normal, vec3 dir)
{
  vec3 binormal = cross(normal, vec3(1.0, 0.0, 0.0));
  vec3 tangent = cross(normal, binormal);
  mat3 randRotate = rotationMatrix(normal, rand(normal.xy));
  mat3 rotate = mat3(tangent, binormal, normal);
  return rotate * randRotate * dir;
}

/**
* Check tex3d space point depth against the isosurface map
*/
/*
  bool isPointVisible(vec3 texel) {
  // Transform from tex3D space to screen
  vec4 screenSpacePos = (local2ScreenMatrix * vec4(-texel.x, texel.y, texel.z, 1.0));
  vec2 tc = screenSpacePos.xy / screenSpacePos.w * 0.5 + 0.5;
  // Take start ray point, end ray point and check ray length against 'texel' position

  vec4 backTexel = texture2D(texBF, tc, 0.0);
  vec3 back = backTexel.xyz;
  vec4 start = texture2D(texFF, tc, 0.0);
  if (backTexel.a < 0.5)
  {
    return true;
  }
  vec3 dir = normalize(back - start.xyz);
  float isosurfDist = texture2D(texIsoSurface, tc, 0.0).a;

  return isosurfDist > length(start.xyz - texel);
}
*/
/**
* Compute SSAO coverage for a single point
*/
float computeSsaoShadow(vec3 isosurfPoint, vec3 norm, float Threshold) {
  float texelSize = 1.0 / texSize;
  float coverage = 0.0;
  float deltaCov = 1.0 / float(nOffsets);
  // Go through all offsets
//  vec3 norm = CalcNormalRoi(isosurfPoint);
  for (int i = 0; i < nOffsets; ++i) {
//    if (isPointVisible(isosurfPoint + transform2TangentSpace(norm, ssaoOffsets[i] * texelSize * 9.0)))
    if (tex3DAO(isosurfPoint + transform2TangentSpace(norm, ssaoOffsets[i] * texelSize * 9.0)) < Threshold)
      coverage += deltaCov;
  }
  return coverage;
}

/*******************************************************************/

/**
* Isosurface color calculation
*/
vec3 CalcLighting(vec3 iter, vec3 dir)
{
  const float AMBIENT = 0.5;
  const float DIFFUSE = 0.5;
  const float SPEC = 0.1;
  const float SPEC_POV = 90.0;

  float d = 1.0 / texSize;
  vec3 dx = vec3(d, 0.0, 0.0), dy = vec3(0.0, d, 0.0), dz = vec3(0.0, 0.0, 1.0 / volumeSizeZ), N, sumCol = vec3(0.0);
  // Culculate normal
  float l, r;
  l = tex3D(iter - dx);
  r = tex3D(iter + dx);
  #if MaskFlag == 1
  {
    l = l * tex3DMask(iter - dx);
    r = r * tex3DMask(iter + dx);
  }
  #endif
  N.x = r - l;
  l = tex3D(iter - dy);
  r = tex3D(iter + dy);
  #if MaskFlag == 1
  {
    l = l * tex3DMask(iter - dy);
    r = r * tex3DMask(iter + dy);
  }
  #endif
  N.y = r - l;
  l = tex3D(iter - dz);
  r = tex3D(iter + dz);
  #if MaskFlag == 1
  {
    l = l * tex3DMask(iter - dz);
    r = r * tex3DMask(iter + dz);
  }
  #endif
  N.z = r - l;
  N = normalize(N);
  // Calculate the density of the material in the vicinity of the isosurface
  float dif = max(0.0, dot(N, -lightDir));
  sumCol = mix(t_function2min.rgb, t_function2max.rgb, 1.-dif);
  float specular = pow(max(0.0, dot(normalize(reflect(lightDir, N)), dir)), SPEC_POV);
  // The resulting color depends on the longevity of the material in the surface of the isosurface
#if useAmbientTex == 1
  float tAO = tex3DvolAO(iter);
//  vec3 col = (0.5*(brightness3D + 1.5)*(DIFFUSE * dif * 0.5*(1.0 + tAO)  + AMBIENT * tAO) + SPEC * specular * tAO) * sumCol;
  vec3 col = (0.5*(brightness3D + 1.5)*(DIFFUSE * dif + AMBIENT) + SPEC * specular) * sumCol * tAO;
#else
  vec3 col = (0.5*(brightness3D + 1.5)*(DIFFUSE * dif + AMBIENT) + SPEC * specular) * sumCol;
#endif

//  float t = 0.05*max(0.0, dot(dir, normalize(iter))+1.0);

  float t = 0.1*max(0.0, dot(dir, normalize(iter)));
  col = (1.0 - t)*col + t*vec3(0.0, 0.0, 1.0);
  //col = tex3DvolAO(iter) * vec3(1.0);
  return col;
  //return  (0.5*(brightness3D + 1.5)*(DIFFUSE * dif + AMBIENT) + SPEC * specular) * sumCol;
}

vec3 CalcLightingAO(vec3 iter, vec3 dir, float isoThreshold)
{
  const float AMBIENT = 0.3;
  const float DIFFUSE = 0.7;
  const float SPEC = 0.1;
  const float SPEC_POV = 90.0;

  float d = 1.0 / texSize;
  vec3 dx = vec3(d, 0.0, 0.0), dy = vec3(0.0, d, 0.0), dz = vec3(0.0, 0.0, 1.0 / volumeSizeZ), N, sumCol = vec3(0.0);
  // Culculate normal
  float l, r;
  l = tex3D(iter - dx);
  r = tex3D(iter + dx);
  N.x = r - l;
  l = tex3D(iter - dy);
  r = tex3D(iter + dy);
  N.y = r - l;
  l = tex3D(iter - dz);
  r = tex3D(iter + dz);
  N.z = r - l;
  N = normalize(N);
  // Calculate the density of the material in the vicinity of the isosurface
  float dif = max(0.0, dot(N, -lightDir));
  sumCol = mix(t_function2min.rgb, t_function2max.rgb, 1.-dif);
  float specular = pow(max(0.0, dot(normalize(reflect(lightDir, N)), dir)), SPEC_POV);
  // The resulting color depends on the longevity of the material in the surface of the isosurface
//  return  (0.5*(brightness3D + 1.5)*(DIFFUSE * dif + AMBIENT * computeSsaoShadow(iter, N, isoThreshold)) + SPEC * specular) * vec3(1.0, 0.0, 0.0);//sumCol;
//  return  0.5*(brightness3D + 1.5)*(AMBIENT * computeSsaoShadow(iter, N, isoThreshold) * t_function2max.rgb + (DIFFUSE * dif + SPEC * specular) * t_function2min.rgb);//sumCol;
//  return  0.5*(brightness3D + 1.5)*(AMBIENT * t_function2max.rgb + DIFFUSE * (dif + SPEC * specular)* computeSsaoShadow(iter, N, isoThreshold) * t_function2min.rgb);//sumCol;
//  return  0.5*(brightness3D + 1.5)*(AMBIENT * t_function2min.rgb + (DIFFUSE * dif + SPEC * specular)* computeSsaoShadow(iter, N, isoThreshold) * t_function2min.rgb);//sumCol;
  return  0.5*(brightness3D + 1.5)*(AMBIENT + (DIFFUSE * dif + SPEC * specular)* computeSsaoShadow(iter, N, isoThreshold)) * sumCol;//sumCol;


}

/**
* Refinement of the coordinate of the isosurface
*/
vec3 Correction(vec3 left, vec3 right, float threshold) {
    vec3 iterator;
    float vol;
    for (int i = 0; i < 7; i++)
    {
        iterator = 0.5*(left + right);
        vol = tex3D(iterator);
        #if MaskFlag == 1
        {
          vol = vol * tex3DMask(iterator);
        }
        #endif
        if (vol > threshold)
            right = iterator;
        else
            left = iterator;
    }
    iterator = 0.5*(left + right);
    return iterator;
}
vec3 CorrectionRoi(vec3 left, vec3 right, float threshold) {
    vec3 iterator;
    float vol;
    for (int i = 0; i < 5; i++)
    {
        iterator = 0.5*(left + right);
        vol = tex3DRoi(iterator).a;
        if (vol > threshold)
            right = iterator;
        else
            left = iterator;
    }
    iterator = 0.5*(left + right);
    return iterator;
}

/**
* Refinement of the coordinate of the isosurface
*/
vec3 CorrectionZero(vec3 left, vec3 right) {
    vec3 iterator;
    float vol, valTF;
    for (int i = 0; i < 7; i++)
    {
        iterator = 0.5*(left + right);
        vol = tex3D(iterator);
        #if MaskFlag == 1
        {
          vol = vol * tex3DMask(iterator);
        }
        #endif
        valTF = texture2D(texTF, vec2(vol, 0.0), 0.0).a;
        if (valTF > 0.0)
            right = iterator;
        else
            left = iterator;
    }
    iterator = 0.5*(left + right);
    return iterator;
}

/**
* Calculation of normal
*/
vec3 CalcNormal(vec3 iter)
{
  float d = 1.0 / texSize;
  vec3 dx = vec3(d, 0.0, 0.0), dy = vec3(0.0, d, 0.0), dz = vec3(0.0, 0.0, 1.0 / volumeSizeZ), N;
  // Culculate normal
  N.x = tex3D(iter + dx) - tex3D(iter - dx);
  N.y = tex3D(iter + dy) - tex3D(iter - dy);
  N.z = tex3D(iter + dz) - tex3D(iter - dz);
  N = normalize(N);
  return N;
}

/**
* Direct volume render
*/
vec4 VolumeRender(vec3 start, vec3 dir, vec3 back, bool skipSolids) {
    const int MAX_I = 1000;
    const float BRIGHTNESS_SCALE = 5.0;
    vec3 iterator = start;
    vec4 acc = vec4(0.0, 0.0, 0.0, 2.0);
    float StepSize = stepSize.r, alpha, vol;
    vec3 step = StepSize*dir, color, sumCol = vec3(0.0, 0.0, 0.0), surfaceLighting = vec3(0.0, 0.0, 0.0);
    float sumAlpha = 0.0, t12 = 1.0 / (t_function1max.a - t_function1min.a), lighting;
    bool inFlag = false, oldInFlag = false;
    int count = int(floor(length(iterator - back) / StepSize));
    vec3 isoIteratorBreak = iterator;
    // Calc volume integral
    for (int i = 0; i < MAX_I; i++)
    {
        iterator = iterator + step;
        vol = tex3D(iterator);
        #if MaskFlag == 1
        {
          vol = vol * tex3DMask(iterator);
        }
        #endif
        // this is for solid parts
        if (count <= 0 || sumAlpha > 0.97 || (showSolids && vol > t_function2min.a))
            break;
        // In/Out flag
        oldInFlag = inFlag;
        inFlag = vol > t_function1min.a && vol <  t_function1max.a;
        if (inFlag || oldInFlag != inFlag)
        {
            // If the transfer function is nonzero, the integration step is halved
            // First step
            float vol1 = tex3D(iterator - 0.5 * step);
            #if MaskFlag == 1
            {
              vol1 = vol1 * tex3DMask(iterator - 0.5 * step);
            }
            #endif
            // Transfer function - isosceles triangle
            alpha = min(vol1 - t_function1min.a, t_function1max.a - vol1);
            alpha = opacityBarrier * max(0.0, alpha) * t12;
            color = mix(t_function1min.rgb, t_function1max.rgb, (vol1 - t_function1min.a) * t12);
//            color = t_function1min.rgb;
            lighting = 0.5 * max(0.0, dot(CalcNormal(iterator), -lightDir)) + 0.5;
            // Volume integral on the interval StepSize
            sumCol += (1. - sumAlpha)* alpha * StepSize * color * lighting;
            sumAlpha += (1. - sumAlpha) * alpha * StepSize;
            // Second step
            // Transfer function - isosceles triangle
            alpha = min(vol - t_function1min.a, t_function1max.a - vol);
            alpha = opacityBarrier*max(0.0, alpha) * t12;
            color = mix(t_function1min.rgb, t_function1max.rgb, (vol - t_function1min.a) * t12);
//            color = t_function1min.rgb;
            // Volume integral on the interval StepSize
            sumCol += (1. - sumAlpha) * alpha * StepSize * color * lighting;
            sumAlpha += (1. - sumAlpha) * alpha * StepSize;
        }
        count--;
    } // for i
    // Calculate the color of the isosurface
    if (count > 0) {
      if (!skipSolids) {
        iterator = Correction(iterator - step, iterator, t_function2min.a);
        surfaceLighting = CalcLighting(iterator, dir);
      } else {
        iterator = Correction(iterator - step, iterator, t_function2min.a);
        surfaceLighting = CalcLighting(iterator, dir);
        //surfaceLighting = mix(vec3(1.,0.,0.), surfaceLighting.rgb, 0.75);
        float mag = 0.75*length(sumCol) + 0.25*length(surfaceLighting);
        surfaceLighting.rgb = vec3(mag,0.,0.);
      }
    }
    acc.rgb = BRIGHTNESS_SCALE * brightness3D * sumCol + (1.0 - sumAlpha) * surfaceLighting;



    return acc;
}



/**
* ROI Direct volume render
*/
vec4 RoiVolumeRender(vec3 start, vec3 dir, vec3 back) {
    const int MAX_I = 1000;
    const float BRIGHTNESS_SCALE = 1.0;
    vec3 iterator = start;
    vec4 acc = vec4(0.0, 0.0, 0.0, 2.0);
    float StepSize = stepSize.r, alpha, vol;
    vec3 step = StepSize*dir, sumCol = vec3(0.0, 0.0, 0.0), surfaceLighting = vec3(0.0, 0.0, 0.0);
    float sumAlpha = 0.0, t12 = 1.0 / (t_function1max.a - t_function1min.a), lighting;
    bool inFlag = false, oldInFlag = false;
    int count = int(floor(length(iterator - back) / StepSize));
    vec3 color = vec3(1.0, 0.9, 0.8);

    // Calc volume integral
    for (int i = 0; i < MAX_I; i++)
    {
        iterator = iterator + step;
        vol = tex3DRoi(iterator).a;
        if (count <= 0 || sumAlpha > 0.97 || vol > 0.75)
            break;
        // In/Out flag
        oldInFlag = inFlag;
        inFlag = vol > t_function1min.a && vol <  t_function1max.a;
        if (inFlag || oldInFlag != inFlag)
        {
            // If the transfer function is nonzero, the integration step is halved
            // First step
            float vol1 = tex3DRoi(iterator - 0.5 * step).a;
            // Transfer function - isosceles triangle
            alpha = min(vol1 - t_function1min.a, t_function1max.a - vol1);
            alpha = opacityBarrier * max(0.0, alpha) * t12;
//            color = mix(t_function1min.rgb, t_function1max.rgb, (vol1.a - t_function1min.a) * t12);
            vec3 N = CalcNormalRoi(iterator);
            lighting = 0.5 * max(0.0, dot(N, -lightDir)) + 0.5;
            float t = 1.0 - max(0.0, dot(N, dir));
//            float dif = (1.0 - brightness3D) + brightness3D * t * t;
            float dif = pow(t, 4.0 * brightness3D);
            alpha = dif * alpha;
            // Volume integral on the interval StepSize
            sumCol += (1. - sumAlpha)* alpha * StepSize * color * lighting;
            sumAlpha += (1. - sumAlpha) * alpha * StepSize;
            // Second step
            // Transfer function - isosceles triangle
            alpha = min(vol - t_function1min.a, t_function1max.a - vol);
            alpha = opacityBarrier*max(0.0, alpha) * t12;
            alpha = dif * alpha;
 //           color = mix(t_function1min.rgb, t_function1max.rgb, (vol.a - t_function1min.a) * t12);
            // Volume integral on the interval StepSize
            sumCol += (1. - sumAlpha) * alpha * StepSize * color * lighting;
            sumAlpha += (1. - sumAlpha) * alpha * StepSize;
        }
        count--;
    } // for i
    // Calculate the color of the isosurface
    if (count > 0) {
        const float AMBIENT = 0.3;
        const float DIFFUSE = 0.7;
        const float SPEC = 0.1;
        const float SPEC_POV = 90.0;
        iterator = CorrectionRoi(iterator - step, iterator, 0.75);
        vec3 N = CalcNormalRoi(iterator);
        float dif = max(0.0, dot(N, -lightDir));
        float specular = pow(max(0.0, dot(normalize(reflect(lightDir, N)), dir)), SPEC_POV);
        // The resulting color depends on the longevity of the material in the surface of the isosurface
        surfaceLighting = (0.5*(brightness3D + 1.5)*(DIFFUSE * dif + AMBIENT) + SPEC * specular) * tex3DRoi(iterator).rgb;

    }
    acc.rgb = BRIGHTNESS_SCALE * sumCol + (1.0 - sumAlpha) * surfaceLighting;
    return acc;
}

/**
* Full direct volume render
*/
vec4 FullVolumeRender(vec3 start, vec3 dir, vec3 back) {
    const int MAX_I = 1000;
    const float BRIGHTNESS_SCALE = 2.0;
    const float OPACITY_SCALE = 5.0;
    vec3 iterator = start;
    vec4 acc = vec4(0.0, 0.0, 0.0, 1.0), valTF = vec4(0.0, 0.0, 0.0, 1.0);
    float StepSize = stepSize.r;
    vec3 step = StepSize*dir, sumCol = vec3(0.0, 0.0, 0.0);
    float sumAlpha = 0.0, lighting, vol;
    int count = int(floor(length(iterator - back) / StepSize));
    float opacity = OPACITY_SCALE * opacityBarrier * StepSize;
    // Calc volume integral
    for (int i = 0; i < MAX_I; i++)
    {
        if (count <= 0 || sumAlpha > 0.97)
            break;
        iterator = iterator + step;
        vol = tex3D(iterator);
        #if MaskFlag == 1
        {
          vol = vol * tex3DMask(iterator);
        }
        #endif
        valTF = texture2D(texTF, vec2(vol, 0.0), 0.0);
        if (valTF.a > 0.0)
        {
            // If the transfer function is nonzero, the integration step is halved
            // First step
            float vol1 = tex3D(iterator - 0.5 * step);
            #if MaskFlag == 1
            {
              vol1 = vol1 * tex3DMask(iterator - 0.5 * step);
            }
            #endif
            // Transfer function - isosceles triangle
            vec4 valTF1 = texture2D(texTF, vec2(vol1, 0.0), 0.0);
            lighting = 0.5 * max(0.0, dot(CalcNormal(iterator), -lightDir)) + 0.5;
            // Volume integral on the interval StepSize
            sumCol += (1. - sumAlpha) * opacity * valTF1.a * valTF1.rgb * lighting;
//            sumCol += (1. - sumAlpha) * valTF1.rgb * lighting;
            sumAlpha += (1. - sumAlpha) * opacity * valTF1.a;
            // Second step
            // Volume integral on the interval StepSize
            sumCol += (1. - sumAlpha) * opacity * valTF.a * valTF.rgb * lighting;
//            sumCol += (1. - sumAlpha) * valTF.rgb * lighting;
            sumAlpha += (1. - sumAlpha) * opacity * valTF.a;
        }
        count--;
    } // for i
    acc.rgb = BRIGHTNESS_SCALE * brightness3D * sumCol;
    return acc;
}

/**
* Rendering the maximum intensity along the beam
*/
vec4 MipRender(vec3 start, vec3 dir, vec3 back) {
    const int MAX_I = 1000;
    vec4 acc = vec4(0.0, 0.0, 0.0, 2.0);
    float StepSize = stepSize.a, vol, vol1, maxVol = 0.0, finish;
    vec3 step = StepSize*dir, iterator = start;
    for (int i = 0; i < MAX_I; i++)
    {
        iterator = iterator + step;
        vol = tex3D(iterator);
        #if MaskFlag == 1
        {
          vol = vol * tex3DMask(iterator);
        }
        #endif
        finish = distance(iterator, back) - StepSize;
        if (finish < 0.0)
            break;
         maxVol = max(maxVol, vol);
    } // for i
    acc.rgb = maxVol * t_function2min.rgb;
    return acc;
}

/**
* get max intensity along a beam
*/
float MipMax(vec3 start, vec3 dir, vec3 back) {
    const int MAX_I = 1000;
    float StepSize = stepSize.a, vol, vol1, maxVol = 0.0, finish;
    vec3 step = StepSize*dir, iterator = start;
    for (int i = 0; i < MAX_I; i++)
    {
        iterator = iterator + step;
        vol = tex3D(iterator);
        #if MaskFlag == 1
        {
          vol = vol * tex3DMask(iterator);
        }
        #endif
        finish = distance(iterator, back) - StepSize;
        if (finish < 0.0)
            break;
         maxVol = max(maxVol, vol);
    } // for i
    return maxVol;
}


/**
* Finding the point of intersection of a ray with an isosurface
*/
vec4 SkipZero(vec3 start, vec3 dir, vec3 back, float StepSize) {
    const int MAX_I = 1000;
    vec3 iterator = start;
    vec4 acc = vec4(0.0, 0.0, 0.0, 2.0);
    float vol, valTF;
    vec3 left, right, step = StepSize*dir;
    int count = int(floor(length(iterator - back) / StepSize));
    if (count < 2)
        return acc;
    //Search isosurface
    for (int i = 0; i < MAX_I; i++) {
      iterator = iterator + step;
      vol = tex3D(iterator);
      #if MaskFlag == 1
      {
        vol = vol * tex3DMask(iterator);
      }
     #endif
      valTF = texture2D(texTF, vec2(vol, 0.0), 0.0).a;
      if (count <= 0 || valTF > 0.0)
        break;
      count--;
    }
    //Refinement of the coordinate of the isosurface
    if (count > 0){
        left = iterator - step;
        iterator = CorrectionZero(left, iterator);
        acc = vec4(iterator, length(start - iterator));
    }
    return acc;
  }

/**
* Finding the point of intersection of a ray with an isosurface
*/
  vec4 Isosurface(vec3 start, vec3 dir, vec3 back, float threshold, float StepSize) {
    const int MAX_I = 1000;
    vec3 iterator = start;
    vec4 acc = vec4(0.0, 0.0, 0.0, 2.0);
    float vol;
    vec3 left, right, step = StepSize*dir;
    int count = int(floor(length(iterator - back) / StepSize));
    if (count < 2)
        return acc;
    //if (tex3D(iterator).a > threshold)
    //    return vec4(iterator, 0.0);
    //Search isosurface
    for (int i = 0; i < MAX_I; i++) {
      iterator = iterator + step;
      vol = tex3D(iterator);
      #if MaskFlag == 1
      {
        vol = vol * tex3DMask(iterator);
      }
      #endif
      // if (length(iterator - back) < StepSize || vol > threshold)
      if (count <= 0 || vol > threshold)
        break;
      count--;
    }
    //Refinement of the coordinate of the isosurface
    if (count > 0) {
      left = iterator - step;
      iterator = Correction(left, iterator, threshold);
      acc = vec4(iterator, length(start - iterator));
    }
    return acc;
  }

  vec4 IsosurfaceRoi(vec3 start, vec3 dir, vec3 back, float threshold, float StepSize) {
    const int MAX_I = 1000;
    vec3 iterator = start;
    vec4 acc = vec4(0.0, 0.0, 0.0, 2.0);
    float vol;
    vec3 left, right, step = StepSize*dir;
    int count = int(floor(length(iterator - back) / StepSize));
    if (count < 2)
        return acc;
    // if (tex3D(iterator).a > threshold)
        // return vec4(iterator, 0.0);
    //Search isosurface
    for (int i = 0; i < MAX_I; i++) {
      iterator = iterator + step;
      vol = tex3DRoi(iterator).a;
      // if (length(iterator - back) < StepSize || vol > threshold)
      if (count <= 0 || vol > threshold)
        break;
      count--;
    }
    //Refinement of the coordinate of the isosurface
    if (count > 0) {
      left = iterator - step;
      iterator = CorrectionRoi(left, iterator, threshold);
      acc = vec4(iterator, length(start - iterator));
    }
    return acc;
  }


void main() {
  vec4 acc = vec4(0., 0., 0., 1.);
//    gl_FragColor = acc;
//    return;
  // To increase the points of the beginning and end of the ray and its direction
  vec2 tc = screenpos.xy / screenpos.w * 0.5 + 0.5;
  vec4 backTexel = texture2D(texBF, tc, 0.0);
  vec3 back = backTexel.xyz;
  vec4 start = texture2D(texFF, tc, 0.0);


  if (backTexel.a < 0.5 || start.a < 0.5)
  {
    gl_FragColor = vec4(0, 0, 0, 2.0);//acc;
    return;
  }
  vec3 dir = normalize(back - start.xyz);

  if (length (back - start.xyz) < 0.03) {
    gl_FragColor = vec4(0, 0, 0, 2.0);
    return;
  }

//  const float ISO_VOLUME_STEP_SIZE = 0.0035;
  //Direct volume render

  #if isoRenderFlag == 0
  {
    float vol = tex3D(start.xyz);

    if (vol > t_function2min.a) {
      acc.rgb = vec3(vol);
      acc.a = 1.0;
      gl_FragColor = acc;
      return;
    }
    else
    {
      // for solid parts
      acc = Isosurface(start.xyz, dir, back, t_function1min.a, stepSize.b);
      if (acc.a < 1.9) {
        // for the vascular parts
        acc.rgb = volumeOpacity*VolumeRender(acc.rgb, dir, back, true).rgb;

      }
    }

    acc.rgb = (1.0 - contrast3D)*acc.rgb + contrast3D*vec3(vol);
    gl_FragColor = acc;
    return;
  }
  #endif

  //Direct isosurface render
  #if isoRenderFlag == 1
  {
    float vol = tex3D(start.xyz);
    if (vol > isoThreshold)
    {
      acc.rgb = vec3(vol);
   		acc.a = 0.0;
      gl_FragColor = acc;
      return;
    }
    else
    {
      acc = Isosurface(start.xyz, dir, back, isoThreshold, stepSize.b);
      if (acc.a < 1.9)
      {
        acc.rgb = CalcLighting(acc.rgb, dir);
        //acc.rgb = (1.0 - contrast3D)*acc.rgb + contrast3D*vec3(vol);
      }
      gl_FragColor = acc;
      return;
    }
  }
  #endif
  // Direct full volume render
  #if isoRenderFlag == 3
  {
    acc = SkipZero(start.xyz, dir, back, stepSize.b);
    if (acc.a < 1.9)
      acc.rgb = FullVolumeRender(acc.rgb, dir, back).rgb * MipMax(acc.xyz, dir, back);
    gl_FragColor = acc;
    return;
  }
  #endif
  // Direct volume render with ROI
  #if isoRenderFlag == 4
  {
    float vol = tex3DRoi(start.xyz).a;
    if (vol > 0.75)
      acc.rgb = 0.75 * tex3DRoi(start.xyz).rgb;
    else
    {
      acc = IsosurfaceRoi(start.xyz, dir, back, t_function1min.a, stepSize.b);
      if (acc.a < 1.9)
        acc.rgb = RoiVolumeRender(acc.rgb, dir, back).rgb;
    }
    gl_FragColor = acc;
    return;
  }
  #endif

  //Direct isosurface render
  #if isoRenderFlag == 5
  {
    float Threshold = 0.3 * isoThreshold + 0.5;
    acc = IsosurfaceRoi(start.xyz, dir, back, Threshold, stepSize.b);
    if (acc.a < 1.9)
    {
        vec4 vol = tex3DRoi(start.xyz);
        if (vol.a > Threshold)//t_function2min.a)
            acc.rgb = 0.75 * vol.rgb;
        else
        {
          const float AMBIENT = 0.3;
          const float DIFFUSE = 0.7;
          const float SPEC = 0.1;
          const float SPEC_POV = 90.0;
          vec3 N = CalcNormalRoi(acc.rgb);
          float dif = max(0.0, dot(N, -lightDir));
          float specular = pow(max(0.0, dot(normalize(reflect(lightDir, N)), dir)), SPEC_POV);
          acc.rgb = (0.5*(brightness3D + 1.5)*(DIFFUSE * dif + AMBIENT) + SPEC * specular) * tex3DRoi(acc.rgb).rgb;
        }
    }
    gl_FragColor = acc;
    return;
  }
  #endif
  //Render of maximum intensity or as overlay to volumetric
  #if isoRenderFlag == 2
  {
    // acc = Isosurface(start.xyz, dir, back, t_function1min.a, stepSize.b);
    // if (acc.a < 1.9)
    //     acc.rgb = MipRender(acc.xyz, dir, back).rgb;
    // gl_FragColor = acc;
    // return;

    float vol = tex3D(start.xyz);
    float mx = 1.0;

    acc = Isosurface(start.xyz, dir, back, t_function1min.a, stepSize.b);

    mx = MipMax(acc.xyz, dir, back);
    if (acc.a < 1.9)
      acc.rgb = volumeOpacity*VolumeRender(acc.rgb, dir, back, true).rgb;

    if (mx > 0.98)
      // CD9595 = 205,149,149 = 0.80, 0.58, 0.58
      acc.rgb = mx*SPOTcolor;//vec3(0.80, 0.58, 0.58);
    else
      acc.rgb = (1. - contrast3D)*acc.rgb + contrast3D*vec3(vol);

    gl_FragColor = acc;
    return;
  }
  #endif
 }
