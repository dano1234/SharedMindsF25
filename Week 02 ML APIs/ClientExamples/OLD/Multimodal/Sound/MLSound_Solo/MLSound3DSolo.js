
let camera3D, scene, renderer
let myCanvas

let sounds = [];


let angleOnCircle;

let progress = "loading Face ML";
let inputField;
let listener;
let distanceFromCenter = 700;

let myName; //= prompt("name?");

function setup() {
    myCanvas = createCanvas(512, 512);
    //  document.body.append(myCanvas.elt);
    myCanvas.hide();
    inputField = createInput("Grateful Dead meets Hip Hop");
    inputField.position(windowWidth / 2 - 100, 50);
    inputField.size(200, 20);
    let askButton = createButton("Ask For Sound");
    askButton.position(windowWidth / 2 - 100, 80);
    askButton.mousePressed(function () {
        askForSound(inputField.value());
    });
    let pauseButton = createButton("Pause Listener");
    pauseButton.position(windowWidth / 2 - 100, 110);
    pauseButton.mousePressed(function () {
        if (listener.context.state === 'suspended') {
            listener.context.resume();
        } else
            listener.context.suspend();
    });
    init3D();
}

function draw() {

}

async function askForSound(p_prompt) {
    inputField.value("Getting Results for: " + p_prompt);
    document.body.style.cursor = "progress";
    const replicateProxy = "https://replicate-api-proxy.glitch.me"

    //const imageDiv = select("#resulting_image");
    //imageDiv.html("Waiting for reply from Replicate's API...");
    let data = {
        //replicate / riffusion / riffusion
        "version": "8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05",
        input: {
            "prompt_a": p_prompt,
        },
    };
    console.log("Asking for Sound Info From Replicate via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    const url = replicateProxy + "/create_n_get/"
    console.log("url", url, "options", options);
    const picture_info = await fetch(url, options);
    //console.log("picture_response", picture_info);
    const proxy_said = await picture_info.json();
    console.log("proxy_said", proxy_said.output.audio);
    // const ctx = new AudioContext();
    // let incomingData = await fetch(proxy_said.output.audio);
    // let arrayBuffer = await incomingData.arrayBuffer();
    // let decodedAudio = await ctx.decodeAudioData(arrayBuffer);
    // const playSound = ctx.createBufferSource();
    // playSound.buffer = decodedAudio;;
    // playSound.connect(ctx.destination);
    // playSound.start(ctx.currentTime);
    placeSound(p_prompt, proxy_said.output.audio)
    //playSound.loop = true;
    document.body.style.cursor = "default";
    inputField.value(p_prompt);
}

function placeSound(prompt, url) {

    console.log("placeSound", prompt, url);
    let me = {};

    me.soundAvatarGraphics = createGraphics(512, 512);

    me.soundAvatarTexture = new THREE.Texture(me.soundAvatarGraphics.elt);
    me.soundAvatarTexture.minFilter = THREE.LinearFilter;  //otherwise lots of power of 2 errors
    var material = new THREE.MeshBasicMaterial({ map: me.soundAvatarTexture, transparent: true });
    var geo = new THREE.PlaneGeometry(512, 512);
    //let geo = new THREE.SphereGeometry(100, 32, 32);
    me.soundAvatar = new THREE.Mesh(geo, material);
    scene.add(me.soundAvatar);


    //me.soundAvatarGraphics.clear();
    me.soundAvatarGraphics.fill(255, 0, 0);
    //me.soundAvatarGraphics.image(myCanvas, 0, 0); 
    me.soundAvatarGraphics.ellipseMode(CENTER);
    me.soundAvatarGraphics.ellipse(width / 2, height / 2, 500, 500);
    me.soundAvatarGraphics.textSize(32);
    me.soundAvatarGraphics.fill(0, 0, 0);
    me.soundAvatarGraphics.textAlign(CENTER, CENTER);
    let promptParts = prompt.split(" ");
    for (let i = 0; i < promptParts.length; i++) {
        me.soundAvatarGraphics.text(promptParts[i], width / 2, height / 2 - 50 + i * 50);
    }

    me.soundAvatarTexture.needsUpdate = true;

    const posInWorld = new THREE.Vector3();
    in_front_of_you.position.set(0, 0, -(distanceFromCenter));  //base the the z position on camera field of view
    in_front_of_you.getWorldPosition(posInWorld);
    //place it where ever you are looking at
    me.soundAvatar.position.set(posInWorld.x, posInWorld.y, posInWorld.z + 10);
    me.soundAvatar.lookAt(0, 0, 0);

    me.sound = new THREE.PositionalAudio(listener);
    me.sound.setVolume(1);
    me.sound.setRefDistance(10);
    me.sound.setRolloffFactor(1);
    me.sound.setDistanceModel('linear');
    me.sound.setMaxDistance(1000);
    me.sound.setDirectionalCone(90, 180, 0.1);
    me.sound.setLoop(true);

    // load a sound and set it as the PositionalAudio object's buffer
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(url, function (buffer) {
        me.sound.setBuffer(buffer);
        me.sound.setRefDistance(20);
        me.sound.play();
        me.sound.setLoop(true);
    });
    me.soundAvatar.add(me.sound);

    sounds.push(me);
}




// function positionOnCircle(angle, mesh) {
//     //imagine a circle looking down on the world and do High School math

//     x = distanceFromCenter * Math.sin(angle);
//     z = distanceFromCenter * Math.cos(angle);
//     mesh.position.set(x, 0, z);
//     mesh.lookAt(0, 0, 0);
// }



function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera3D.position.x = 0;
    camera3D.position.y = 0;
    camera3D.position.z = 0;
    scene.add(camera3D);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    moveCameraWithMouse();


    //just a place holder the follows the camera and marks location to drop incoming  pictures
    //tiny little dot (could be invisible) 
    var geometryFront = new THREE.BoxGeometry(1, 1, 1);
    var materialFront = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    in_front_of_you = new THREE.Mesh(geometryFront, materialFront);
    in_front_of_you.position.set(0, 0, -(distanceFromCenter - camera3D.fov * 3));  //base the the z position on camera field of view
    camera3D.add(in_front_of_you); // then add in front of the camera (not scene) so it follow it


    //add a listener to the camera
    listener = new THREE.AudioListener();
    in_front_of_you.add(listener);  //maybe add it to camera is better?

    let bgGeometery = new THREE.SphereGeometry(900, 100, 40);
    //let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("itp.jpg");
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });

    let back = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(back);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera3D);
}


/////MOUSE STUFF  ///YOU MIGHT NOT HAVE TO LOOK DOWN BELOW HERE VERY MUCH

var onMouseDownMouseX = 0, onMouseDownMouseY = 0;
var onPointerDownPointerX = 0, onPointerDownPointerY = 0;
var lon = -90, onMouseDownLon = 0; //start at -90 degrees for some reason
var lat = 0, onMouseDownLat = 0;
var isUserInteracting = false;


function moveCameraWithMouse() {
    document.addEventListener('keydown', onDocumentKeyDown, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);
    document.addEventListener('wheel', onDocumentMouseWheel, false);
    window.addEventListener('resize', onWindowResize, false);
    camera3D.target = new THREE.Vector3(0, 0, 0);
}

function onDocumentKeyDown(event) {
    //if (event.key == " ") {
    //in case you want to track key presses
    //}
}

function onDocumentMouseDown(event) {
    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
    isUserInteracting = true;
}

function onDocumentMouseMove(event) {
    if (isUserInteracting) {
        lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
        lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
        computeCameraOrientation();
    }
}

function onDocumentMouseUp(event) {
    isUserInteracting = false;
}

function onDocumentMouseWheel(event) {
    camera3D.fov += event.deltaY * 0.05;
    camera3D.updateProjectionMatrix();
}

function computeCameraOrientation() {
    lat = Math.max(- 30, Math.min(30, lat));  //restrict movement
    let phi = THREE.Math.degToRad(90 - lat);  //restrict movement
    let theta = THREE.Math.degToRad(lon);
    camera3D.target.x = 10000 * Math.sin(phi) * Math.cos(theta);
    camera3D.target.y = 10000 * Math.cos(phi);
    camera3D.target.z = 10000 * Math.sin(phi) * Math.sin(theta);
    camera3D.lookAt(camera3D.target);
}


function onWindowResize() {
    camera3D.aspect = window.innerWidth / window.innerHeight;
    camera3D.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log('Resized');
}