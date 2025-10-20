import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, off, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import * as THREE from 'three';
//import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
//for more modern version of orbit control user importmap https://stackoverflow.com/questions/75250424/threejs-orbitcontrol-import-version-from-cdn
import { VRButton } from 'three/addons/webxr/VRButton.js';

let camera3D, scene, renderer, cube;
let hand1, hand2;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
console.log("hello");

let controls;


let myObjectsByFirebaseKey = {}; //for converting from firebase key to my JSON object
let currentFrame = 1;
let selectedObjectKey = null;
let canvas;
let inputBox;
let db;
let existingSubscribedFolder = null;
let mouseDown = false;


const url = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";

let exampleName = "SharedMindsExampleSequence2D";

init3D();
initFirebaseDB();
initHTML();
subscribeToData();
animate();




function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    let bgGeometery = new THREE.SphereGeometry(950, 60, 40);
    // let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("itp.jpg");
    // var material = new THREE.MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });

    let back = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(back);

    controls = new OrbitControls(camera3D, renderer.domElement);
    camera3D.position.z = 25;
    //VR STUFF
    document.body.appendChild(VRButton.createButton(renderer));
    renderer.xr.enabled = true;
    setupControllers();
    animate()
}



// function animate() {
//     cube.rotation.x += 0.01;
//     cube.rotation.y += 0.01;
//     controls.update();  //orbit controls
//     renderer.setAnimationLoop(render);
//     requestAnimationFrame(animate);
// }
function render() {
    renderer.render(scene, camera3D);
}

function setupControllers() {
    // controllers

    controller1 = renderer.xr.getController(0);
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    scene.add(controller2);

    const controllerModelFactory = new XRControllerModelFactory();
    const handModelFactory = new XRHandModelFactory();

    // Hand 1
    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    hand1 = renderer.xr.getHand(0);
    hand1.add(handModelFactory.createHandModel(hand1));

    scene.add(hand1);

    // Hand 2
    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    hand2 = renderer.xr.getHand(1);
    hand2.add(handModelFactory.createHandModel(hand2));
    scene.add(hand2);

    //
}

function animate() {
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let key in myObjectsByFirebaseKey) {
        let thisObject = myObjectsByFirebaseKey[key];
        if (thisObject.type === "image") {
            let position = thisObject.position;
            let img = thisObject.loadedImage;
            if (img) {
                ctx.fillColor = "black";
                ctx.font = "30px Arial";
                ctx.fillText(thisObject.prompt, position.x, position.y - 30);
                ctx.drawImage(img, position.x, position.y, 256, 256);
            }
        } else if (thisObject.type === "text") {
            let position = thisObject.position;
            ctx.font = "30px Arial";
            ctx.fillText(thisObject.text, position.x, position.y);
        }
    }

    init3D();
    requestAnimationFrame(animate);
}

function clearLocalScene() {
    myObjectsByFirebaseKey = {};
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //displayDiv.innerHTML = "";
}

async function askPictures(prompt, location) {
    document.body.style.cursor = "progress";
    const data = {
        //mistral "cf18decbf51c27fed6bbdc3492312c1c903222a56e3fe9ca02d6cbe5198afc10",
        //llama  "2d19859030ff705a87c746f7e96eea03aefb71f166725aee39692f1476566d48"
        //modelURL: "https://api.replicate.com/v1/models/meta/meta-llama-3-70b-instruct/predictions",
        model: "black-forest-labs/flux-schnell",
        input: {
            prompt: prompt,
        },
    };
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };

    const picture_info = await fetch(url, options);
    //console.log("picture_response", picture_info);
    const proxy_said = await picture_info.json();

    if (proxy_said.output.length == 0) {
        console.log("Something went wrong, try it again");
    } else {
        console.log("returned from API", proxy_said);
        let imageURL = proxy_said.output[0];
        // let img = new Image()
        // img.crossOrigin = "anonymous";
        // img.src = imageURL;
        // img.onload = function () {
        //     console.log("img", img);
        //     let tempCanvas = document.createElement('canvas');
        //     tempCanvas.width = img.width;
        //     tempCanvas.height = img.height;
        //     let tempContext = tempCanvas.getContext('2d');
        //     tempContext.drawImage(img, 0, 0);
        //     let base64 = tempCanvas.toDataURL('image/png');
        //     console.log("base64", base64);
        //     addImageRemote(base64, prompt, location);
        // }

        //send by url but maybe safer in long term to uncomment above and send by base64
        addImageRemote(proxy_said.output[0], prompt, location);

    }
    document.body.style.cursor = "auto";
}

function nextFrame() {
    let oldFrame = currentFrame;
    currentFrame++;
    let currentFrameDisplay = document.getElementById("currentFrameDisplay");
    currentFrameDisplay.textContent = `Current Frame: ${currentFrame}`;
    subscribeToData();
}

function previousFrame() {
    let oldFrame = currentFrame;
    if (currentFrame > 1) {
        currentFrame--;
        let currentFrameDisplay = document.getElementById("currentFrameDisplay");
        currentFrameDisplay.textContent = `Current Frame: ${currentFrame}`;
        subscribeToData();
    }
}



export function addTextRemote(text, pos) {
    let title = document.getElementById("title").value;
    const data = { type: "text", position: { x: pos.x, y: pos.y, z: pos.z }, text: text };
    let folder = exampleName + "/" + title + "/frames/" + currentFrame;
    console.log("Entered Text, Send to Firebase", folder, title, exampleName);
    addNewThingToFirebase(folder, data);//put empty for the key when you are making a new thing.
}

export function addImageRemote(imgURL, prompt, pos) {
    console.log("addImageRemote", imgURL, prompt, pos);
    let title = document.getElementById("title").value;
    const data = { type: "image", prompt: prompt, position: pos, imageURL: imgURL };
    let folder = exampleName + "/" + title + "/frames/" + currentFrame + "/";
    console.log("Entered Image, Send to Firebase", folder, data);
    addNewThingToFirebase(folder, data);//put empty for the key when you are making a new thing.
}




///////////////////////FIREBASE///////////////////////////

function initFirebaseDB() {
    // Initialize Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyDHOrU4Lrtlmk-Af2svvlP8RiGsGvBLb_Q",
        authDomain: "sharedmindss24.firebaseapp.com",
        databaseURL: "https://sharedmindss24-default-rtdb.firebaseio.com",
        projectId: "sharedmindss24",
        storageBucket: "sharedmindss24.appspot.com",
        messagingSenderId: "1039430447930",
        appId: "1:1039430447930:web:edf98d7d993c21017ad603"
    };
    const app = initializeApp(firebaseConfig);
    db = getDatabase();
}

function addNewThingToFirebase(folder, data) {
    //firebase will supply the key,  this will trigger "onChildAdded" below
    const dbRef = ref(db, folder);
    const newKey = push(dbRef, data).key;
    return newKey; //useful for later updating
}

async function updateJSONFieldInFirebase(folder, data) {
    console.log("updateDataInFirebase", folder, data);
    const dbRef = ref(db, folder);
    let updater = await update(dbRef, data);
    console.log("update", updater);
}


function setDataInFirebase(folder, data) {
    //if it doesn't exist, it adds (pushes) with you providing the key
    //if it does exist, it overwrites
    console.log("setDataInFirebase", folder, data);
    const dbRef = ref(db, folder)
    set(dbRef, data);

}

function deleteFromFirebase(folder, key) {
    console.log("deleting", folder + '/' + key);
    const dbRef = ref(db, folder + '/' + key);
    set(dbRef, null);
}

function subscribeToData() {
    clearLocalScene()
    let title = document.getElementById("title").value;
    let currentFrame = document.getElementById("currentFrameDisplay").textContent.split(" ")[2];
    let folder = exampleName + "/" + title + "/frames/" + currentFrame + "/";
    //get callbacks when there are changes either by you locally or others remotely
    if (existingSubscribedFolder) {
        const oldRef = ref(db, existingSubscribedFolder);
        console.log("unsubscribing from", existingSubscribedFolder, oldRef);
        off(oldRef);
    }
    existingSubscribedFolder = folder;

    const thisRef = ref(db, folder);
    console.log("subscribing to", folder, thisRef);
    onChildAdded(thisRef, (snapshot) => {
        let key = snapshot.key;
        let data = snapshot.val();
        //console.log("added", data, key);
        //transfer data into your local variable
        //replaces it if it already exists, otherwise makes a new entry
        myObjectsByFirebaseKey[key] = data;
        //if it is an image, load it
        if (data.type == "image") {
            let img = new Image();  //create a new image
            img.onload = function () {
                img.setAttribute("id", key + "_image");
                myObjectsByFirebaseKey[key].loadedImage = img;

            }
            img.src = data.imageURL;
        }
        console.log(myObjectsByFirebaseKey);

    });

    onChildChanged(thisRef, (data) => {
        callback("CHANGED", data.val(), data.key);
        let key = data.key;
        let thisObject = myObjectsByFirebaseKey[key];
        if (thisObject) {
            if (data.type === "text") {
                thisObject.text = data.text;
                thisObject.position = data.position;
            } else if (data.type === "image") {
                let img = new Image();  //create a new image
                img.onload = function () {
                    thisObject.img = img;
                    thisObject.position = data.position;

                }
                img.src = data.imageURL;

            }
        }
    });
    onChildRemoved(thisRef, (data) => {
        callback("removed", data.val(), data.key);
        console.log("removed", data);
        let thisObject = myObjectsByFirebaseKey[key];
        if (thisObject) {

            delete myObjectsByFirebaseKey[key];
        }
    });


}







///////////////////////HTML INTERFACE//////////////////////////


function initHTML() {

    //make a container that is easy to clean out
    // const displayDiv = document.createElement("div");
    // displayDiv.setAttribute("id", "displayDiv");
    // document.body.appendChild(displayDiv);
    // displayDiv.style.position = "absolute";
    // displayDiv.style.top = "0";
    // displayDiv.style.left = "0";
    // displayDiv.style.width = "100%";
    // displayDiv.style.height = "100%";

    // Get the input box and the canvas element
    canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'myCanvas');
    canvas.style.position = 'absolute';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.zIndex = '100';
    canvas.style.left = '0';
    canvas.style.top = '0';
    // canvas.style.width = '100%';
    // canvas.style.height = '100%';
    document.body.appendChild(canvas);
    console.log('created canvas', canvas.width, canvas.height);


    inputBox = document.createElement('input');
    inputBox.setAttribute('type', 'text');
    inputBox.setAttribute('id', 'inputBox');
    inputBox.setAttribute('placeholder', 'Enter text here');
    inputBox.style.position = 'absolute';
    inputBox.style.left = '50%';
    inputBox.style.top = '50%';
    inputBox.style.transform = 'translate(-50%, -50%)';
    inputBox.style.zIndex = '100';
    inputBox.style.fontSize = '30px';
    inputBox.style.fontFamily = 'Arial';
    document.body.appendChild(inputBox);
    inputBox.setAttribute('autocomplete', 'off');

    // Add event listener to the input box
    inputBox.addEventListener('keydown', function (event) {
        // Check if the Enter key is pressed

        if (event.key === 'Enter') {
            const inputValue = inputBox.value;
            let inputBoxLocation = inputBox.getBoundingClientRect();
            //askWord(inputValue, { x: inputLocationX, y: inputLocationY });
            let pos = { x: inputBoxLocation.left, y: inputBoxLocation.top };

            askPictures(inputValue, pos);

        }
    });



    const titleBox = document.createElement('input');
    titleBox.setAttribute('type', 'text');
    titleBox.setAttribute('id', 'title');
    titleBox.value = 'War and Peace';
    titleBox.style.position = 'absolute';
    titleBox.style.left = '50%';
    titleBox.style.top = '10%';
    titleBox.style.transform = 'translate(-50%, -50%)';
    titleBox.style.zIndex = '200';
    titleBox.style.fontSize = '20px';
    titleBox.style.fontFamily = 'Arial';
    titleBox.style.textAlign = 'center';

    document.body.appendChild(titleBox);

    titleBox.addEventListener('mousedown', function (event) {
        //don't pass the click to the document
        event.stopPropagation();
    });


    const titleLabel = document.createElement('label');
    titleLabel.setAttribute('for', 'title');
    titleLabel.textContent = 'Title:';
    titleLabel.style.position = 'absolute';
    titleLabel.style.left = '50%';
    titleLabel.style.top = '3%';
    titleLabel.style.transform = 'translate(-50%, -50%)';
    titleLabel.style.zIndex = '100';
    titleLabel.style.fontSize = '15px';
    titleLabel.style.fontFamily = 'Arial';

    document.body.appendChild(titleLabel);

    const nextFrameButton = document.createElement('button');
    nextFrameButton.textContent = 'Next Frame';
    nextFrameButton.style.position = 'absolute';
    nextFrameButton.style.left = '60%';
    nextFrameButton.style.top = '90%';
    nextFrameButton.style.transform = 'translate(-50%, -50%)';
    nextFrameButton.style.zIndex = '200';
    nextFrameButton.addEventListener('click', nextFrame);
    nextFrameButton.addEventListener('mousedown', function (event) {
        //don't pass the click to the document
        event.stopPropagation();
    });



    document.body.appendChild(nextFrameButton);

    const previousFrameButton = document.createElement('button');
    previousFrameButton.textContent = 'Previous Frame';
    previousFrameButton.style.position = 'absolute';
    previousFrameButton.style.left = '40%';
    previousFrameButton.style.top = '90%';
    previousFrameButton.style.transform = 'translate(-50%, -50%)';
    previousFrameButton.style.zIndex = '200';
    previousFrameButton.addEventListener('click', previousFrame);

    document.body.appendChild(previousFrameButton);
    previousFrameButton.addEventListener('mousedown', function (event) {
        //don't pass the click to the document
        event.stopPropagation();
    });

    const currentFrameDisplay = document.createElement('div');
    currentFrameDisplay.setAttribute('id', 'currentFrameDisplay');
    currentFrameDisplay.textContent = 'Current Frame: 1';
    currentFrameDisplay.style.position = 'absolute';
    currentFrameDisplay.style.left = '50%';
    currentFrameDisplay.style.top = '90%';
    currentFrameDisplay.style.transform = 'translate(-50%, -50%)';
    currentFrameDisplay.style.zIndex = '200';

    document.body.appendChild(currentFrameDisplay);



    // Add event listener to the document for mouse down event
    document.addEventListener('mousedown', (event) => {
        mouseDown = true;
        // Check if the mouse is clicked on any of the words
        selectedObjectKey = null;
        for (let key in myObjectsByFirebaseKey) {
            let thisObject = myObjectsByFirebaseKey[key];
            if (event.clientX > thisObject.position.x && event.clientX < thisObject.position.x + 256 && event.clientY > thisObject.position.y && event.clientY < thisObject.position.y + 256) {
                selectedObjectKey = key;
            }
        }
        console.log("Clicked on ", selectedObjectKey);
    });

    document.addEventListener('mousemove', (event) => {
        //move words around
        let amountMoved = Math.sqrt((event.movementX * event.movementX) + (event.movementY * event.movementY));

        if (mouseDown && selectedObjectKey && amountMoved > 1) {
            console.log("Mouse moved", amountMoved);
            // console.log("Mouse moved", myObjectsByFirebaseKey[selectedObjectKey].position);
            let newLocation = { x: event.clientX, y: event.clientY };
            //setDataInFirebase(exampleName + "/" + titleBox.value + "/frames/" + currentFrame, myObjectsByFirebaseKey[selectedObjectKey]);
            // console.log("/SharedMindsExampleSequence2D/War and Peace/frames/1/-O7dPIS5aInF24c-GNX3/position");
            let thisObject = myObjectsByFirebaseKey[selectedObjectKey]
            //thisObject.position = newLoc
            // updateJSONFieldInFirebase(exampleName + "/" + titleBox.value + "/frames/" + currentFrame + "/" + selectedObjectKey + "/position", { x: newLocation.x, y: newLocation.y });
            updateJSONFieldInFirebase(exampleName + "/" + titleBox.value + "/frames/" + currentFrame + "/" + selectedObjectKey + "/position/", { x: newLocation.x, y: newLocation.y });
            //setDataInFirebase(exampleName + "/" + titleBox.value + "/frames/" + currentFrame + "/", { selectedObjectKey: thisObject });
            //myObjectsByFirebaseKey[selectedObjectKey].position = thisLocation;
        }

    });
    document.addEventListener('mouseup', (event) => {
        mouseDown = false
    });

    // Add event listener to the document for double click event
    document.addEventListener('dblclick', (event) => {
        //ask for related words
        inputBox.style.display = 'block';
        inputBox.focus();
        inputBox.style.left = event.clientX + 'px';
        inputBox.style.top = event.clientY + 'px';

        console.log("Document double clicked");
    });


    document.addEventListener('keydown', function (event) {
        if (selectedObjectKey) {
            if (event.key === "Backspace" || event.key === "Delete") {
                deleteFromFirebase("objects", myObjectsByFirebaseKey[selectedObjectKey].key);
            }
        }
    });
}







