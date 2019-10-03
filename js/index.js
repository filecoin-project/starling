let BOUNDS = 800, BOUNDS_HALF = BOUNDS / 2; let WIDTH = 40;
/*
  SHADERS START
 */
const Flocking = {
  velocityFrag: `
    float delta = 0.016;
    float separationDistance = 30.0;
    float alignmentDistance = 40.0;
    float cohesionDistance = 20.0;
    uniform vec3 leaderPos;

    const float width = resolution.x;
    const float height = resolution.y;
    const float PI_2 = 3.141592653589793 * 2.0;

    const float limit = 8.0;

    uniform float time;

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      vec3 birdPosition, birdVelocity;

      vec4 selfPosition = texture2D( texturePosition, uv );
      vec3 velocity = texture2D( textureVelocity, uv ).xyz;

      // Contain within bounds
      if(selfPosition.x > 2000.0){
        velocity.x = -0.1;
      }
      if(selfPosition.x < -2000.0){
        velocity.x = 0.1;
      }
      if(selfPosition.z > 2000.0){
        velocity.z = -0.1;
      }
      if(selfPosition.z < -2000.0){
        velocity.z = 0.1;
      }

      vec3 dir;
      float dist, distSquared, percent, f;

      // Attract flocks to the leader
      dir = selfPosition.xyz - leaderPos;
      dist = length( dir );

      dir.y *= 2.5;
      velocity -= normalize( dir ) * delta * 5.;

      separationDistance += 1.5 * mod(time/1000.0, 30.0);
      float zoneRadius = separationDistance + alignmentDistance + cohesionDistance;
      float separationThresh = separationDistance / zoneRadius;
      float alignmentThresh = ( separationDistance + alignmentDistance ) / zoneRadius;
      float zoneRadiusSquared = zoneRadius * zoneRadius;

      for ( float y = 0.0; y < height; y++ ) {
        for ( float x = 0.0; x < width; x++ ) {
            vec2 ref = vec2( x + 0.5, y + 0.5 ) / resolution.xy;
            birdPosition = texture2D( texturePosition, ref ).xyz;
            dir = birdPosition - selfPosition.xyz;
            distSquared = dot(dir, dir);

            if ( distSquared < 0.0001 || distSquared > zoneRadiusSquared ) continue;
            percent = distSquared / zoneRadiusSquared;

            if ( percent < separationThresh ) { // low
              // Separation - Move apart for comfort
              f = ( separationThresh / percent - 1.0 ) * delta;
              velocity -= normalize( dir ) * f;
            } else if ( percent < alignmentThresh ) { // high
              // Alignment - fly the same direction
              float threshDelta = alignmentThresh - separationThresh;
              float adjustedPercent = ( percent - separationThresh ) / threshDelta;
              birdVelocity = texture2D( textureVelocity, ref ).xyz;
              f = ( 0.5 - cos( adjustedPercent * PI_2 ) * 0.5 + 0.5 ) * delta;
              velocity += normalize( birdVelocity ) * f;
            } else {
              // Attraction / Cohesion - move closer
              float threshDelta = 1.0 - alignmentThresh;
              float adjustedPercent = ( percent - alignmentThresh ) / threshDelta;
              f = ( 0.5 - ( cos( adjustedPercent * PI_2 ) * -0.5 + 0.5 ) ) * delta;
              velocity += normalize( dir ) * f;
            }
          }
       }

      if (velocity.y > 0.) velocity.y *= (1. - 0.2 * delta);

      // Speed Limits
      if ( length( velocity ) > limit ) {
        velocity = normalize( velocity ) * limit;
      }

      gl_FragColor = vec4(velocity, 1.0);
    }
  `,

  positionFrag: `
  uniform float time;
  uniform float delta;
    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      vec3 selfPosition = texture2D( texturePosition, uv ).xyz;
      vec3 selfVelocity = texture2D( textureVelocity, uv ).xyz;
      gl_FragColor = vec4(selfPosition + delta * selfVelocity, 1.);
    }
  `,
};

const Bird = {

  vertexShader: `
    uniform sampler2D texturePosition;
    uniform sampler2D textureVelocity;
    uniform float time;
    attribute vec2 reference;
    attribute float birdVertex;
    attribute vec3 birdColor;
    varying vec3 vbirdColor;
    varying vec3 vbirdPos;

    vec3 rotateY(vec3 target, float angle){
      float sinr = sin(angle);
      float cosr = cos(angle);
      mat3 maty =  mat3(
        cosr, 0, sinr,
        0    , 1, 0     ,
        -sinr, 0, cosr
      );
      return maty * target;
    }

    void main() {
      vec4 tmpPos = texture2D( texturePosition, reference );
      vec4 velocity = texture2D( textureVelocity, reference );
      vec3 modelPos = position;
      if(birdVertex == 4.0 || birdVertex == 7.0){
        modelPos.y = 15. * sin(10. * reference.x + time/100.0);
      }
      vbirdPos = position;

      modelPos = mat3( modelMatrix ) * modelPos;
      float xz = length( velocity.xz );
      float theta = acos(velocity.z / xz);
      if(velocity.x < 0.0){
        theta = - theta;
      }
      modelPos = rotateY(modelPos, theta);

      gl_Position = projectionMatrix *  viewMatrix  * vec4(tmpPos.xyz + modelPos, 1.0);
      vbirdColor = birdColor;

    }
  `,

  fragmentShader: `
  varying vec3 vbirdColor;
  varying vec3 vbirdPos;

    void main() {
      gl_FragColor = vec4(0.01 * length(vbirdPos) + vbirdColor, 1.0);
    }
  `,
};

const Sky = {
  vertexShader: `
    uniform float time;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix *  modelViewMatrix  * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
  varying vec2 vUv;
  uniform float time;
  uniform sampler2D perlinTex;
  uniform vec3 skyColor1;
  uniform vec3 skyColor2;

    void main() {
      vec4 t1 = texture2D(perlinTex, vec2(vUv.x + 0.00002 * time, vUv.y + 0.1 * sin(0.0001 * time) ));
      vec4 t2 = texture2D(perlinTex, vec2(vUv.x + 0.2 * t1.r, vUv.y));
      gl_FragColor = vec4(mix(skyColor2, skyColor1, 2. * pow(t2.r,2.)), 1.0);
    }
  `,
};
/*
  SHADERS END
 */

let BirdGeometry = function (count) {
  let width = Math.sqrt(count)

  let bufferGeo = new THREE.BufferGeometry();

  let triangles = count * 3;
  let points = triangles * 3;

  let vertices = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
  let birdColors = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
  let references = new THREE.BufferAttribute(new Float32Array(points * 2), 2);
  let birdVertex = new THREE.BufferAttribute(new Float32Array(points), 1);

  bufferGeo.addAttribute('position', vertices);
  bufferGeo.addAttribute('birdColor', birdColors);
  bufferGeo.addAttribute('reference', references);
  bufferGeo.addAttribute('birdVertex', birdVertex);

  let v = 0;

  function verts_push() {
    for (let i = 0; i < arguments.length; i++) {
      vertices.array[v++] = arguments[i];
    }
  }

  let wingsSpan = 20;
  for (let f = 0; f < count; f++) {
    // Body
    verts_push(
      0, - 0, - 20,
      0, 4, - 20,
      0, 0, 30
    );
    // Left Wing
    verts_push(
      0, 0, - 15,
      - wingsSpan, 15, 0,
      0, 0, 15
    );
    // Right Wing
    verts_push(
      0, 0, 15,
      wingsSpan, 15, 0,
      0, 0, - 15
    );
  }

  for (let v = 0; v < triangles * 3; v++) {

    let i = ~ ~(v / 3 / 3);
    let x = (i % width) / width;
    let y = ~ ~(i / width) / width;

    let c = new THREE.Color(
      "#1d0912"
    );
    birdColors.array[v * 3 + 0] = c.r;
    birdColors.array[v * 3 + 1] = c.g;
    birdColors.array[v * 3 + 2] = c.b;
    references.array[v * 2] = x;
    references.array[v * 2 + 1] = y;
    birdVertex.array[v] = v % 9;

  }
  bufferGeo.scale(0.6, 0.6, 0.6);
  return bufferGeo
};

let scene, camera, renderer;
let skyUniforms, positionUniforms, velocityUniforms, birdUniforms, gpuCompute;
let positionVariable, velocityVariable;

function initWebScene() {
  /** BASIC THREE SETUP **/
  scene = new THREE.Scene();
  //set up camera
  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100000);
  camera.position.set(0, 0, 3500)
  scene.add(camera);

  renderer = new THREE.WebGLRenderer();
  renderer.debug.checkShaderErrors = true;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  let container = document.getElementById('canvas');
  window.addEventListener('resize', onWindowResize, false);
  var stats = new Stats();
  container.appendChild(stats.domElement);
  container.appendChild(renderer.domElement);
  initCompute();
  initBirds();
  initSky();

  let time = Date.now();
  let lastTime = Date.now();
  let leaderPos = new THREE.Vector3();
  let i = 0;
  let simplex = new SimplexNoise('wass');
  renderer.setAnimationLoop(function () {
    stats.begin();
    i += 0.001;
    let valX = simplex.noise2D(i, 5)
    let valY = simplex.noise2D(i, 1)
    let valZ = simplex.noise2D(i, 3)
    leaderPos.set(800 * valX, 205 * valY, 800 * valZ)
    let curTime = Date.now();
    skyUniforms["time"] = { value: curTime - time };
    positionUniforms["time"] = { value: curTime - time };
    positionUniforms["delta"] = { value: 0.06 * Math.min(curTime - lastTime, 40) };
    velocityUniforms["time"] = { value: curTime - time };
    birdUniforms["time"] = { value: curTime - time };
    velocityUniforms["leaderPos"] = { value: leaderPos };
    gpuCompute.compute()
    birdUniforms["texturePosition"].value = gpuCompute.getCurrentRenderTarget(positionVariable).texture;
    birdUniforms["textureVelocity"].value = gpuCompute.getCurrentRenderTarget(velocityVariable).texture;
    renderer.render(scene, camera);
    stats.end()
    lastTime = curTime;
  });
}

function initSky() {
  skyUniforms = {
    skyColor1: { value: new THREE.Color("#ffc5f6") },
    skyColor2: { value: new THREE.Color("#5b8dfd") },
    perlinTex: {
      value: new THREE.TextureLoader().load('/assets/seamless-perlin-noise.jpg', (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
      })
    },
    time: { value: 0 },
  };

  let skyShaderMaterial = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    vertexShader: Sky.vertexShader,
    fragmentShader: Sky.fragmentShader,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  let skySphere = new THREE.Mesh(new THREE.SphereGeometry(20000), skyShaderMaterial);
  scene.add(skySphere);
}

function initCompute() {
  gpuCompute = new THREE.GPUComputationRenderer(WIDTH, WIDTH, renderer);

  let dtPosition = gpuCompute.createTexture();
  let dtVelocity = gpuCompute.createTexture();
  fillPositionTexture(dtPosition);
  fillVelocityTexture(dtVelocity);

  velocityVariable = gpuCompute.addVariable("textureVelocity", Flocking.velocityFrag, dtVelocity);
  positionVariable = gpuCompute.addVariable("texturePosition", Flocking.positionFrag, dtPosition);

  gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable]);
  gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable]);

  positionUniforms = positionVariable.material.uniforms;
  velocityUniforms = velocityVariable.material.uniforms;

  positionUniforms["time"] = { value: 0.0 };
  positionUniforms["delta"] = { value: 0.0 };
  velocityUniforms["time"] = { value: 1.0 };
  velocityUniforms["delta"] = { value: 0.0 };
  velocityUniforms["separationDistance"] = { value: 1.0 };
  velocityUniforms["alignmentDistance"] = { value: 1.0 };
  velocityUniforms["cohesionDistance"] = { value: 1.0 };
  velocityUniforms["leaderPos"] = { value: new THREE.Vector3() };
  velocityVariable.material.defines.BOUNDS = BOUNDS.toFixed(2);

  velocityVariable.wrapS = THREE.RepeatWrapping;
  velocityVariable.wrapT = THREE.RepeatWrapping;
  positionVariable.wrapS = THREE.RepeatWrapping;
  positionVariable.wrapT = THREE.RepeatWrapping;

  let error = gpuCompute.init();
  if (error !== null) {
    console.error(error);
  }
}

function initBirds() {
  let geometry = new THREE.BufferGeometry();
  let references = new THREE.BufferAttribute(new Float32Array(WIDTH * WIDTH * 2), 2);
  let positions = new THREE.BufferAttribute(new Float32Array(WIDTH * WIDTH * 3), 3);

  for (let x = 0; x < WIDTH; x++) {
    for (let y = 0; y < WIDTH; y++) {
      references.array[2 * (y * WIDTH + x)] = x / WIDTH;
      references.array[2 * (y * WIDTH + x) + 1] = y / WIDTH;
      positions.array[3 * (y * WIDTH + x)] = x / WIDTH;
      positions.array[3 * (y * WIDTH + x) + 1] = y / WIDTH;
      positions.array[3 * (y * WIDTH + x) + 2] = y / WIDTH;
    }
  }
  geometry.addAttribute("reference", references);
  geometry.addAttribute("position", positions);

  // uniforms
  birdUniforms = {
    color: { value: new THREE.Color(0xffff00) },
    texturePosition: { value: null },
    textureVelocity: { value: null },
    time: { value: 0 },
  };

  // point cloud material
  let shaderMaterial = new THREE.ShaderMaterial({
    uniforms: birdUniforms,
    vertexShader: Bird.vertexShader,
    fragmentShader: Bird.fragmentShader,
    side: THREE.DoubleSide,
  });

  // point cloud
  let birdGroup = new THREE.Mesh(new BirdGeometry(WIDTH * WIDTH), shaderMaterial);
  scene.add(birdGroup);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function fillPositionTexture(texture) {
  let theArray = texture.image.data;
  for (let k = 0, kl = theArray.length; k < kl; k += 4) {
    let x = Math.random() * BOUNDS - BOUNDS_HALF;
    let y = Math.random() * BOUNDS - BOUNDS_HALF;
    let z = Math.random() * BOUNDS - BOUNDS_HALF;
    theArray[k + 0] = x;
    theArray[k + 1] = y;
    theArray[k + 2] = z;
    theArray[k + 3] = 1;
  }
}

function fillVelocityTexture(texture) {
  let theArray = texture.image.data;
  for (let k = 0, kl = theArray.length; k < kl; k += 4) {
    let x = Math.random() - 0.5;
    let y = Math.random() - 0.5;
    let z = Math.random() - 0.5;
    theArray[k + 0] = x * 10;
    theArray[k + 1] = y * 10;
    theArray[k + 2] = z * 10;
    theArray[k + 3] = 1;
  }
}

initWebScene();
