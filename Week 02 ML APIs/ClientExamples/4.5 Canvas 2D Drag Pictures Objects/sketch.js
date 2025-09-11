
let inputLocationX = window.innerWidth / 2;
let inputLocationY = window.innerHeight / 2;

let visualObjects = [];
let canvas;
let inputBox;
let currentObject = -1;
let mouseDown = false;
let promptWords = [];

const url = "https://replicate-api-proxy.glitch.me/create_n_get/";

init();

function init() {
    // Perform initialization logic here
    initInterface();
    animate();
}

// Animate loop
function animate() {
    // Perform animation logic here
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < visualObjects.length; i++) {
        visualObjects[i].display();
    }
    requestAnimationFrame(animate);
}


async function askPictures(promptWord, location) {

    document.body.style.cursor = "progress";
    let replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
    let authToken = "";
    //... or const authToken = localStorage.getItem("itp-ima-replicate-proxy-ok");
    //Optionally Get Auth Token from: https://itp-ima-replicate-proxy.web.app/
    let thisPromptWord = {
        word: promptWord,
        location: location,
    }
    promptWords.push(promptWord);

    document.body.style.cursor = "progress";
    const data = {
        model: "google/imagen-4-fast",
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
        let newVisualObject = new VisualObject(promptWord, img, location.x, location.y, 256, 256);
        visualObjects.push(newVisualObject);

    }
    document.body.style.cursor = "auto";
    inputBoxDirectionX = 1;
    inputBoxDirectionY = 1;
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
            inputBox.style.display = 'none';
        }
    });



    // Add event listener to the document for mouse down event
    document.addEventListener('mousedown', (event) => {
        mouseDown = true;
        // Check if the mouse is clicked on any of the words
        currentObject = -1;
        for (let i = 0; i < visualObjects.length; i++) {
            let thisVisualObject = visualObjects[i];
            if (thisVisualObject.isOver(event.clientX, event.clientY)) {

                currentObject = i;
                break;
            }

        }
        console.log("Clicked on ", currentObject);
    });

    document.addEventListener('mousemove', (event) => {
        //move words around
        if (mouseDown && currentObject > -1) {
            console.log("Mouse moved");
            let thisLocation = { x: event.clientX, y: event.clientY };
            visualObjects[currentObject].setLocation(thisLocation);
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
}



class VisualObject {
    constructor(prompt, img, x, y, w, h) {
        this.prompt = prompt;
        this.x = x;
        this.y = y;
        this.img = img;
        this.width = w;
        this.height = h;
    }
    setLocation(location) {

        this.x = location.x;
        this.y = location.y;
    }
    isOver(x, y) {
        return (x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height);
    }

    display() {
        let ctx = canvas.getContext('2d');
        // Update logic for the visual object
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        ctx.font = '20px Arial';
        ctx.fillStyle = 'black';
        let textWidth = ctx.measureText(this.prompt).width;
        ctx.fillText(this.prompt, this.x + this.width / 2 - textWidth / 2, this.y + this.height + 20);
    }
}

