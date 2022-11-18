/* IMPORTS */
import './style.css'
import * as THREE from 'three'
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {FlyControls} from 'three/examples/jsm/controls/FlyControls'
import * as dat from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as CANNON from 'cannon-es'
import { Clock, Mesh, Vector3 } from 'three'
import { Material } from 'cannon-es'

/* Debug */
const gui = new dat.GUI()

/* Canvas */
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x7f73b5);

const axesHelper = new THREE.AxesHelper( 500 );
scene.add( axesHelper )


/* MODELS */

// name model
const fbx1 = new FBXLoader();
const name = fbx1.load('models/name.fbx',(res)=>{
    res.position.set(30,30,100);

    scene.add(res);
});

// sign model
const fbx2 = new FBXLoader();
const sign = fbx2.load('models/sign.fbx',(res)=>{
    res.position.set(35,-2,-15);

    scene.add(res);
});




// Rick model
const fbx3 = new FBXLoader()
const  rick = fbx3.load('models/rick.fbx',(res)=>{
    res.scale.set(0.03,0.03,0.03)
    res.position.set(-15, 0, 0)

    scene.add(res)
})

// Project section
var planeGeometry1 = new THREE.PlaneGeometry(40,40);
var texture1 = new THREE.TextureLoader().load( 'https://blog.hootsuite.com/wp-content/uploads/2021/07/free-stock-photos-12.jpeg' );
var planeMaterial1 = new THREE.MeshLambertMaterial( { map: texture1 } );
//var planeMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
var plane1 = new THREE.Mesh(planeGeometry1, planeMaterial1);
plane1.receiveShadow = true;
// rotate and position the plane
plane1.rotation.y = -2;
plane1.position.set(220,20,290);
// add the plane to the scene
scene.add(plane1);
var planeGeometry2 = new THREE.PlaneGeometry(40,40);
var texture2 = new THREE.TextureLoader().load( 'https://threejs.org/examples/textures/uv_grid_opengl.jpg' );
var planeMaterial2 = new THREE.MeshLambertMaterial( { map: texture2 } );
var plane2 = new THREE.Mesh(planeGeometry2, planeMaterial2);
plane2.receiveShadow = true;
// rotate and position the plane
plane2.rotation.y = -2;
plane2.position.set(220,20,370);
// add the plane to the scene
scene.add(plane2);


/* LIGHTS */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = - 7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = - 7;
directionalLight.position.set(- 5, 5, 0);
scene.add(directionalLight);

/* Sizes */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    console.log(camera.position);

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.01, 1000);
scene.add(camera);
camera.position.set(0,4, 47);
camera.lookAt(scene.position)


const followCamPivot = new THREE.Object3D();
followCamPivot.rotation.order = 'YXZ';
const followCam = new THREE.Object3D();
followCam.position.z = 2;
followCamPivot.add(followCam)



/* Renderer */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/* Physics */

// Character collider
const characterCollider = new THREE.Object3D();
characterCollider.add(followCamPivot);
characterCollider.position.y = 3;
scene.add(characterCollider);

const sphereGeo = new THREE.SphereGeometry(4);
const sphereMat = new THREE.MeshBasicMaterial({
    color:0xffeeff,
    wireframe: true
});
const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);

const groundGeo = new THREE.PlaneGeometry(500,800);
const groundMat = new THREE.MeshBasicMaterial({
    color:0xf0000,
    side:THREE.DoubleSide,
    wireframe:false
});

scene.add(sphereMesh);

const groundMesh = new THREE.Mesh(groundGeo, groundMat);
scene.add(groundMesh);


// Cannon World
const world = new CANNON.World({
    gravity:new CANNON.Vec3(0, -9.81, 0)
});

const groundPhysicalMat = new CANNON.Material();
const groundBody = new CANNON.Body({
    //shape:new CANNON.Plane(),
    //mass: 10
    shape:  new CANNON.Box(new CANNON.Vec3(100, 1000, 0.1)),
    type:CANNON.Body.STATIC,
    Material: groundPhysicalMat
});
world.addBody(groundBody);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

const spherePhysicalMat = new CANNON.Material();
const sphereBody = new CANNON.Body({
    mass:1,
    shape:  new CANNON.Sphere(4),
    position: new CANNON.Vec3(5, 15, 0),
    material: spherePhysicalMat
});
world.addBody(sphereBody);
sphereBody.position.set(
    characterCollider.position.x,
    characterCollider.position.y,
    characterCollider.position.z,

)

sphereBody.linearDamping = 0.31;
const groundSphereContactMat = new CANNON.ContactMaterial(
    groundPhysicalMat,
    spherePhysicalMat,
    {restitution:179}
);

world.addContactMaterial(groundSphereContactMat)


// document.onKeydown = function (e){
//     if(keycode == 37){
//         sphereMesh.position.x -= 1;
//     }
//     else if(keycode == 39){
//         sphereMesh.position.x += 1;
//     }
//     else if(keycode == 38){
//         sphereMesh.position.z -= 1;
//     }
//     else if(keycode == 40){
//         sphereMesh.position.z += 1;
//     }
//     else if(keycode == 65){
//         sphereMesh.position.set(0,0,0);
//     }
// };

const controls = new OrbitControls(camera,renderer.domElement);


function update()
{
	keyboard.update();

	var moveDistance = 50 * clock.getDelta(); 

	if ( keyboard.down("left") ) 
		sphereMesh.translateX( -50 );

	if ( keyboard.down("right") ) 
		sphereMesh.translateX(  50 );

	if ( keyboard.pressed("A") )
		sphereMesh.translateX( -moveDistance );

	if ( keyboard.pressed("D") )
		sphereMesh.translateX(  moveDistance );

	if ( keyboard.down("R") )
		sphereMesh.sphereMat.color = new THREE.Color(0xff0000);
	if ( keyboard.up("R") )
		sphereMesh.sphereMat.color = new THREE.Color(0x0000ff);

	controls.update();
	stats.update();
}

const timeStep = 1/60;
   
/* Tick */
const tick = () =>
{

    world.step(timeStep);
    groundMesh.position.copy(groundBody.position);
    groundMesh.quaternion.copy(groundBody.quaternion);

  sphereMesh.position.copy(sphereBody.position);
    sphereMesh.quaternion.copy(sphereBody.quaternion);
  
    

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
