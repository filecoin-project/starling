/*
  SHADERS START
 */
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

let scene, camera, renderer;
let skyUniforms;

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
  container.appendChild(renderer.domElement);
  initSky();

  let time = Date.now();
  let lastTime = Date.now();
  renderer.setAnimationLoop(function () {
    let curTime = Date.now();
    skyUniforms["time"] = { value: curTime - time };
    renderer.render(scene, camera);
    lastTime = curTime;
  });
}

function initSky() {
  skyUniforms = {
    skyColor1: { value: new THREE.Color("#ffc5f6") },
    skyColor2: { value: new THREE.Color("#5b8dfd") },
    perlinTex: {
      value: new THREE.TextureLoader().load('https://reganartinfo.github.io/starling/assets/seamless-perlin-noise.jpg', (tex) => {
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

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

initWebScene()
