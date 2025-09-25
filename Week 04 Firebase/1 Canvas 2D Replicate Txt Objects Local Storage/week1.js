
let inputLocationX = window.innerWidth / 2;
let inputLocationY = window.innerHeight / 2;

let canvas;
let ctx;
let inputBox;

let responseWords = [];
let promptWords = [];
let mouseDown = false;
let currentWord = -1;
init();

function init() {

    // Perform initialization logic here
    initInterface();
    animate();
    if (localStorage.getItem('responseWords')) {
        responseWords = JSON.parse(localStorage.getItem('responseWords'));
    }
    if (localStorage.getItem('promptWords')) {
        promptWords = JSON.parse(localStorage.getItem('promptWords'));
    }
}

// Animate loop
function animate() {

    inputBox.style.left = inputLocationX + 'px';
    inputBox.style.top = inputLocationY + 'px';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < promptWords.length; i++) {
        let thisPromptWord = promptWords[i];
        let word = thisPromptWord.word;
        let location = thisPromptWord.location;
        ctx.font = '30px Arial';
        ctx.fillStyle = 'red';
        let w = ctx.measureText(word).width;
        ctx.fillText(word, location.x - w / 2, location.y);
    }

    for (let i = 0; i < responseWords.length; i++) {
        let thisResponseWord = responseWords[i];
        let word = thisResponseWord.word;
        let location = thisResponseWord.location;
        ctx.font = '24px Arial';
        ctx.fillStyle = 'black';
        let w = ctx.measureText(word).width;
        ctx.fillText(word, location.x - w / 2, location.y);
    }


    requestAnimationFrame(animate);
}




async function askWord(promptWord, location) {
    let replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
    let authToken = "";
    let thisPromptWord = {
        word: promptWord,
        location: location,
    }
    promptWords.push(thisPromptWord);
    localStorage.setItem('promptWords', JSON.stringify(promptWords));
    let prompt = "a json list of 5 words related to " + promptWord + " with no extra words or punctuation";
    document.body.style.cursor = "progress";
    const data = {

        model: "openai/gpt-5-structured",
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
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
    };
    const raw_response = await fetch(replicateProxy, options);
    //turn it into json
    const json_response = await raw_response.json();
    document.body.style.cursor = "auto";

    console.log("json_response", json_response.output);
    let textResponseJSON = json_response.output.json_output;
    console.log("textResponseJSON", textResponseJSON);

    //let textResponse = json_response.output.join("").trim();
    //let textResponseJSON = JSON.parse(textResponse);
    let angleIncrements = 2 * Math.PI / textResponseJSON.length;
    let radius = 100;
    for (let i = 0; i < textResponseJSON.length; i++) {
        textResponseJSON[i] = textResponseJSON[i].replace(/[^a-zA-Z ]/g, "");
        console.log(textResponseJSON[i]);
        let angle = i * angleIncrements;
        let xPos = location.x + radius * Math.cos(angle);
        let yPos = location.y + radius * Math.sin(angle);
        let thisWord = {
            word: textResponseJSON[i],
            location: { x: xPos, y: yPos },
            prompt: promptWord,
        }

        responseWords.push(thisWord);
        localStorage.setItem('responseWords', JSON.stringify(responseWords));
        console.log(responseWords);
    }
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
    inputBox.style.left = '10%';
    inputBox.style.top = '10%';
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
            askWord(inputValue, { x: inputLocationX, y: inputLocationY });
            //  inputBox.style.display = 'none';
        }
    });



    // Add event listener to the document for mouse down event
    document.addEventListener('mousedown', (event) => {
        mouseDown = true;
        // Check if the mouse is clicked on any of the words
        currentWord = -1;
        for (let i = 0; i < responseWords.length; i++) {
            let thisResponseWord = responseWords[i];
            let location = thisResponseWord.location;
            let xdist = location.x - event.clientX;
            let ydist = location.y - event.clientY;
            let dist = Math.sqrt(xdist * xdist + ydist * ydist);
            if (dist < 20) {
                console.log("Clicked on ", thisResponseWord.word);
                currentWord = i;
                break;
            }
        }
        if (currentWord == -1) {
            inputLocationX = event.clientX;
            inputLocationY = event.clientY;
        }
    });

    document.addEventListener('mousemove', (event) => {
        //move words around
        if (mouseDown && currentWord > 0) {
            let thisLocation = { x: event.clientX, y: event.clientY };
            responseWords[currentWord].location = thisLocation;
        }

    });
    document.addEventListener('mouseup', (event) => {
        if (currentWord != -1) {
            localStorage.setItem('responseWords', JSON.stringify(responseWords));
        }
        mouseDown = false
    });

    // Add event listener to the document for double click event
    document.addEventListener('dblclick', (event) => {
        //ask for related words
        if (currentWord > 0) {
            let location = responseWords[currentWord].location;
            askWord(responseWords[currentWord].word, location);
        }

        console.log("Document double clicked");
    });

    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear Storage';
    clearButton.style.position = 'absolute';
    clearButton.style.left = '10%';
    clearButton.style.top = '20%';
    clearButton.style.transform = 'translate(-50%, -50%)';
    clearButton.style.zIndex = '100';
    clearButton.style.fontSize = '20px';
    clearButton.style.fontFamily = 'Arial';
    document.body.appendChild(clearButton);

    clearButton.addEventListener('click', function () {
        localStorage.removeItem('responseWords');
        localStorage.removeItem('promptWords');
        responseWords = [];
        promptWords = [];
    });
}



