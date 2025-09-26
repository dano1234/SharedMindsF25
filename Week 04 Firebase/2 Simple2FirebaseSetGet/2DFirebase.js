import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";


let isInteracting = false;
let localObjects = [];
let canvas;
let db;
let exampleName = "SimpleSetGet";

intitHTML();
initFirebase()
recall();


function initFirebase() {
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
    //make a folder in your firebase for this example
    db = getDatabase();
}

function save() {
    let title = document.getElementById('title').value;
    let data = { title: title, objects: localObjects };
    let folder = exampleName + "/";
    const dbRef = ref(db, folder + '/')
    set(dbRef, data);
}


function recall() {
    const ctx = canvas.getContext('2d');
    let title = document.getElementById('title').value;
    //let folder = exampleName + "/" + title + "/";
    let folder = exampleName + "/";

    console.log("recalling from", folder);
    const dbRef = ref(db, folder);
    onValue(dbRef, (snapshot) => {

        console.log("here is a snapshot of everyting", snapshot.val());

        let data = snapshot.val();

        if (data) {

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let title = document.getElementById('title').getBoundingClientRect();
            const titleSelect = document.createElement('select');
            titleSelect.setAttribute('id', 'titleSelect');
            titleSelect.style.position = 'absolute';
            titleSelect.style.left = (title.left - title.width) + 'px';
            titleSelect.style.top = title.top + 12 + 'px';
            titleSelect.style.transform = 'translate(-50%, -50%)';
            titleSelect.style.zIndex = '100';
            titleSelect.style.fontSize = '15px';
            titleSelect.style.fontFamily = 'Arial';
            document.body.appendChild(titleSelect);
            localObjects = data;
            //add the titles to the select element
            let pickedTitle = null;
            for (let key in data) {
                const option = document.createElement('option');
                option.setAttribute('value', key);
                option.textContent = key;
                titleSelect.appendChild(option);
                if (pickedTitle == null) {
                    pickedTitle = key;
                }
            }
            pickTitle(pickedTitle);

            //add an event listener to the select element
            titleSelect.addEventListener('change', function (event) {
                const selectedTitle = event.target.value;
                document.getElementById('title').value = selectedTitle;
                console.log("selected title", selectedTitle);
                pickTitle(selectedTitle);
            });

        }
    });
}

function pickTitle(title) {
    document.getElementById('title').value = title;
    objects = localObjects[title].objects;
    localObjects[title].objects = objects;
    console.log("localObjects", localObjects);
    for (let i = 0; i < objects.length; i++) {
        console.log("drawing", objects[i]);
        drawText(ojects[i].position.x, objects[i].position.y, objects[i].text);
    }
}

function intitHTML() {
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
    document.body.appendChild(canvas);
    console.log('canvas', canvas.width, canvas.height);

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


    titleBox.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            localObjects = [];
            recall();
        }
    });

    const inputBox = document.createElement('input');
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

    // Add event listener to the input box
    inputBox.addEventListener('keydown', function (event) {
        // Check if the Enter key is pressed

        if (event.key === 'Enter') {
            const inputValue = inputBox.value;
            const inputBoxRect = inputBox.getBoundingClientRect();
            const x = inputBoxRect.left;
            const y = inputBoxRect.top;
            // Add the text to the database
            const data = { type: 'text', position: { x: x, y: y }, text: inputValue };
            localObjects[title].push(data);
            localObjects[title].objects = objects;
            console.log("localObjects", localObjects);
            drawText(x, y, inputValue);

            save();
            //don't draw it locally until you hear back from firebase
        }
    });
}

function drawText(x, y, text) {
    const ctx = canvas.getContext('2d');
    ctx.font = '30px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(text, x, y);
}

// Add event listener to the document for mouse down event
document.addEventListener('mousedown', (event) => {
    // Set the location of the input box to the mouse location
    isInteracting = true;
});
document.addEventListener('mousemove', (event) => {
    // Set the location of the input box to the mouse location
    if (isInteracting) {
        inputBox.style.left = event.clientX + 'px';
        inputBox.style.top = event.clientY + 'px';
    }
});
document.addEventListener('mouseup', (event) => {
    isInteracting = false;
});





