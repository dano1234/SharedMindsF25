import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, off, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";


let myObjectsByFirebaseKey = {}; //for converting from firebase key to my JSON object

let selectedObjectKey = null;
let ctx;
let db;
let existingSubscribedFolder = null;


let exampleName = "SharedMindsExampleDragPictures";
initFirebaseDB();
subscribeToData();

let canvas;
let inputBox;
let currentObject = -1;
let mouseDown = false;
let promptWords = [];


init();

function init() {
    // Perform initialization logic here
    initInterface();
    animate();
}

// Animate loop
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

    requestAnimationFrame(animate);
}


async function askPictures(promptWord, location) {
    inputBox.value = 'Asking for ' + promptWord;
    document.body.style.cursor = "progress";
    let replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
    let authToken = "";
    //Optionally Get Auth Token from: https://itp-ima-replicate-proxy.web.app/
    let thisPromptWord = {
        word: promptWord,
        location: location,
    }
    promptWords.push(promptWord);

    document.body.style.cursor = "progress";
    const data = {
        model: "black-forest-labs/flux-schnell",
        input: {
            prompt: promptWord
        },
    };
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
    };
    const raw_response = await fetch(replicateProxy, options);
    //turn it into json
    const json_response = await raw_response.json();
    document.body.style.cursor = "auto";
    console.log("json_response", json_response);

    if (json_response.length == 0) {
        console.log("Something went wrong, try it again");
    } else {

        let img = document.createElement("img");
        //document.body.appendChild(img);
        img.style.position = 'absolute';
        img.style.left = location.x + 'px';
        img.style.top = location.y + 'px';
        img.style.width = '256px';
        img.style.height = '256px';
        img.src = json_response.output;

        addImageRemote(json_response.output, promptWord, { x: location.x, y: location.y });
        //don't add it locally, we will get it from firebase addChildAdded callback
    }
    document.body.style.cursor = "auto";

    inputBox.style.display = 'block';
    inputBox.value = '';
}



function initInterface() {
    // Get the input box and the canvas element
    canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'myCanvas');
    canvas.style.position = 'absolute';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);
    console.log('canvas', canvas.width, canvas.height);


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
            var rect = inputBox.getBoundingClientRect()
            let location = { x: rect.left, y: rect.top };
            console.log("Location: ", location);
            askPictures(inputValue, location);
            //inputBox.style.display = 'none';
        }
    });



    // Add event listener to the document for mouse down event
    document.addEventListener('mousedown', (event) => {
        mouseDown = true;
        // Check if the mouse is clicked on any of the words
        currentObject = -1;
        for (let key in myObjectsByFirebaseKey) {
            let thisObject = myObjectsByFirebaseKey[key];
            //need to check if the mouse is over the object using the position and width and height
            if (event.clientX > thisObject.position.x && event.clientX < thisObject.position.x + 255 && event.clientY > thisObject.position.y && event.clientY < thisObject.position.y + 255) {
                currentObject = key;
                break;
            }
        }
        console.log("Clicked on ", currentObject);
    });

    document.addEventListener('mousemove', (event) => {
        //move words around

        if (mouseDown && currentObject != -1) {

            let thisLocation = { x: event.clientX, y: event.clientY };
            myObjectsByFirebaseKey[currentObject].position = thisLocation;
        }

    });
    document.addEventListener('mouseup', (event) => {
        if (currentObject != -1) {
            let thisLocation = myObjectsByFirebaseKey[currentObject].position;
            updateJSONFieldInFirebase(exampleName + "/" + currentObject + "/position/", { x: thisLocation.x, y: thisLocation.y });
        }
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
}






///////////////////////FIREBASE///////////////////////////

export function addImageRemote(imgURL, prompt, pos) {
    console.log("addImageRemote", imgURL, prompt, pos);
    const data = { type: "image", prompt: prompt, position: pos, imageURL: imgURL };
    let folder = exampleName + "/";
    console.log("Entered Image, Send to Firebase", folder, data);
    const key = addNewThingToFirebase(folder, data);//put empty for the key when you are making a new thing.
    return key;
}


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
    try {
        await update(dbRef, data);
        // console.log("update ok");
    } catch (e) {
        console.error("update error", e);
    }
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
    //clearLocalScene()

    let folder = exampleName + "/";
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

    onChildChanged(thisRef, (snapshot) => {
        const key = snapshot.key;
        const value = snapshot.val();
        if (!key) { return; }
        myObjectsByFirebaseKey[key] = value;

        const img = new Image();
        img.onload = function () {
            myObjectsByFirebaseKey[key].loadedImage = img;
        };
        img.src = value.imageURL;
    });
    onChildRemoved(thisRef, (snapshot) => {
        const key = snapshot.key;
        console.log("removed", key);
        if (key && myObjectsByFirebaseKey[key]) {
            delete myObjectsByFirebaseKey[key];
        }
    });
    //la la la

}