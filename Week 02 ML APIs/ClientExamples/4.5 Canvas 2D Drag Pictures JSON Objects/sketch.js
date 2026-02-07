
let inputLocationX = window.innerWidth / 2;
let inputLocationY = window.innerHeight / 2;

let visualObjectsJSON = [];
let canvas;
let inputBox;
let currentObject = -1;
let mouseDown = false;
let promptWords = [];

init();

function init() {
    // Perform initialization logic here
    visualObjectsJSON = loadJSONFromLocalStorage();

    initInterface();
    animate();
}

// Animate loop
function animate() {
    // Perform animation logic here
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < visualObjectsJSON.length; i++) {
        displayJSONObject(visualObjectsJSON[i]);

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


    let img = document.createElement("img");
    //document.body.appendChild(img);
    img.style.position = 'absolute';
    img.style.left = location.x + 'px';
    img.style.top = location.y + 'px';
    img.style.width = '256px';
    img.style.height = '256px';
    img.src = json_response.output;

    newObject = {
        prompt: data.input.prompt,
        imageURL: json_response.output,
        imageModel: data.model,
        x: location.x,
        y: location.y,
        img: img,
        width: 256,
        height: 256
    }
    visualObjectsJSON.push(newObject);
    localStorage.setItem('visualObjectsJSON', JSON.stringify(visualObjectsJSON));


    document.body.style.cursor = "auto";
    inputBoxDirectionX = 1;
    inputBoxDirectionY = 1;
    inputBox.style.display = 'block';
    inputBox.value = '';
}


document.addEventListener('beforeunload', () => {
    saveJSONToLocalStorage();
});

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
        for (let i = 0; i < visualObjectsJSON.length; i++) {
            let thisVisualObject = visualObjectsJSON[i];
            if (isOverJSONObject(thisVisualObject, event.clientX, event.clientY)) {
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
            visualObjectsJSON[currentObject].x = event.clientX;
            visualObjectsJSON[currentObject].y = event.clientY;
        }

    });
    document.addEventListener('mouseup', (event) => {
        mouseDown = false
        localStorage.setItem('visualObjectsJSON', JSON.stringify(visualObjectsJSON));

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


function isOverJSONObject(jsonObject, x, y) {
    return (x > jsonObject.x && x < jsonObject.x + jsonObject.width && y > jsonObject.y && y < jsonObject.y + jsonObject.height);
}
function displayJSONObject(jsonObject) {
    let ctx = canvas.getContext('2d');
    // Update logic for the visual object
    ctx.drawImage(jsonObject.img, jsonObject.x, jsonObject.y, jsonObject.width, jsonObject.height);
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    let textWidth = ctx.measureText(jsonObject.prompt).width;
    ctx.fillText(jsonObject.prompt, jsonObject.x + jsonObject.width / 2 - textWidth / 2, jsonObject.y + jsonObject.height + 20);
}

function saveJSONToLocalStorage() {
    localStorage.setItem('visualObjectsJSON', JSON.stringify(visualObjectsJSON));
    console.log("JSON saved to localStorage");
}

function loadJSONFromLocalStorage() {

    loadedJSON = JSON.parse(localStorage.getItem('visualObjectsJSON'));
    if (!loadedJSON) {
        console.log("No JSON found in localStorage");
        return [];
    }
    for (let i = 0; i < loadedJSON.length; i++) {
        let thisVisualObject = loadedJSON[i];
        let img = document.createElement("img");
        img.style.position = 'absolute';
        img.style.left = loadedJSON[i].x + 'px';
        img.style.top = loadedJSON[i].y + 'px';
        img.style.width = '256px';
        img.style.height = '256px';
        img.src = loadedJSON[i].imageURL;
        loadedJSON[i].img = img;
    }
    return loadedJSON;
}

