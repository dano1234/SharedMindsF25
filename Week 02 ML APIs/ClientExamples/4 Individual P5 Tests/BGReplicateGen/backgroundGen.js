
let camera3D, scene, renderer, cube;
let dir = 1;
let panoTexture, textureCtx;
const replicateProxy = "https://replicate-api-proxy.glitch.me"

init3D();

var input_image_field = document.createElement("input");
input_image_field.type = "text";
input_image_field.addEventListener("mousedown", function (event) {
    event.stopPropagation();
});



input_image_field.id = "input_image_prompt";
input_image_field.value = "A beautiful picture of a sunset over the alps";
input_image_field.size = 100;
input_image_field.style.position = "absolute";
input_image_field.style.top = "10%";
input_image_field.style.left = "50%";
input_image_field.style.transform = "translate(-50%, -50%)";
input_image_field.style.zIndex = "100";
input_image_field.style.fontSize = "20px";
input_image_field.style.fontFamily = "Arial";
input_image_field.style.textAlign = "center";
input_image_field.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        askForPicture(input_image_field);
    }
});

document.body.append(input_image_field);


function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("ThreeJSContainer").append(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0, -30);
    cube.scale.set(10, 10, 10);
    scene.add(cube);

    let bgGeometery = new THREE.SphereGeometry(950, 60, 40);
    //let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    let canvasTexture = document.createElement("CANVAS");
    canvasTexture.width = 1024;
    canvasTexture.height = 512;
    textureCtx = canvasTexture.getContext('2d');
    panoTexture = new THREE.Texture(canvasTexture);
    let backMaterial = new THREE.MeshBasicMaterial({ map: panoTexture });

    let panoMesh = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(panoMesh);
    var bgImg = new Image();
    bgImg.onload = function () {
        //draw background image
        textureCtx.drawImage(bgImg, 0, 0);
        panoTexture.needsUpdate = true;
    };
    bgImg.src = "./itp_low_res.jpg";
    // var material = new THREE.MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});

    moveCameraWithMouse();

    camera3D.position.z = 5;
    animate();
}




async function askForPicture(inputField) {
    p_prompt = inputField.value;
    inputField.value = "Waiting for reply for:" + p_prompt;
    prompt = "360 degree equirectangular spherical panorama seamless wrapping" + p_prompt;

    let data = {
        "version": "86c8af86f82a9c170ab9c54e6c94a19c8afa68362844ee2799d6baa83ac9708c", //"c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
        input: {
            "prompt": prompt,
            "width": 1024,
            "height": 512,
        },
    };
    console.log("Asking for Picture Info From Replicate via Proxy", data);
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

    if (proxy_said.output.length == 0) {
        alert("Something went wrong, try it again");
    } else {
        inputField.value = p_prompt;
        //Loading of the home test image - img1
        var bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        bgImg.onload = function () {
            //draw background image
            textureCtx.drawImage(bgImg, 0, 0);
            panoTexture.needsUpdate = true;

        };
        bgImg.src = proxy_said.output[0];
    }
}



function animate() {
    requestAnimationFrame(animate);
    cube.position.setZ(cube.position.z + dir);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    if (cube.position.z < -100 || cube.position.z > -10) {
        dir = -dir;
    }
    renderer.render(scene, camera3D);
}



/////MOUSE STUFF

var onMouseDownMouseX = 0, onMouseDownMouseY = 0;
var onPointerDownPointerX = 0, onPointerDownPointerY = 0;
var lon = -90, onMouseDownLon = 0;
var lat = 0, onMouseDownLat = 0;
var isUserInteracting = false;


function moveCameraWithMouse() {
    let threeContainer = document.getElementById("ThreeJSContainer")
    threeContainer.addEventListener('keydown', onDocumentKeyDown, false);
    threeContainer.addEventListener('mousedown', onDocumentMouseDown, false);
    threeContainer.addEventListener('mousemove', onDocumentMouseMove, false);
    threeContainer.addEventListener('mouseup', onDocumentMouseUp, false);
    threeContainer.addEventListener('wheel', onDocumentMouseWheel, false);
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
    camera3D.target.x = 100 * Math.sin(phi) * Math.cos(theta);
    camera3D.target.y = 100 * Math.cos(phi);
    camera3D.target.z = 100 * Math.sin(phi) * Math.sin(theta);
    camera3D.lookAt(camera3D.target);
}


function onWindowResize() {
    camera3D.aspect = window.innerWidth / window.innerHeight;
    camera3D.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log('Resized');
}

