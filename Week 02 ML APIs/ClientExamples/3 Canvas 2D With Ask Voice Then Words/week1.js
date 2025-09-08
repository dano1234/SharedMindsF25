
let inputLocationX = window.innerWidth / 2;
let inputLocationY = window.innerHeight / 2;
let inputBoxDirectionX = 1;
let inputBoxDirectionY = 1;

let mediaStream;
let mediaRecorder;
let audioContext;

let canvas;
let inputBox;


init();

function init() {

    // Perform initialization logic here
    setUpRecorder();
    initInterface();
    animate();
}

// Animate loop
function animate() {
    // Perform animation logic here
    inputLocationX = inputLocationX + inputBoxDirectionX;
    inputLocationY = inputLocationY + inputBoxDirectionY;
    if (inputLocationX > window.innerWidth || inputLocationX < 0) {
        inputBoxDirectionX = - inputBoxDirectionX;
    }
    if (inputLocationY > window.innerHeight || inputLocationY < 0) {
        inputBoxDirectionY = - inputBoxDirectionY;
    }

    inputBox.style.left = inputLocationX + 'px';
    inputBox.style.top = inputLocationY + 'px';
    requestAnimationFrame(animate);
}

function drawWord(response, location) {
    const ctx = canvas.getContext('2d');
    ctx.font = '30px Arial';
    ctx.fillStyle = 'black';
    let responseWidth = ctx.measureText(response).width;
    ctx.fillText(response, location.x - responseWidth / 2, location.y);
}


async function askVoiceThenWord(audio, location) {
    const b64Audio = await convertBlobToBase64(audio);
    const url = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
    let data = {
        fieldToConvertBase64ToURL: "audio",
        fileFormat: "wav",
        version: "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
        input: {
            audio: b64Audio,
        },
    };

    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(data),
    };
    let response = await fetch(url, options);
    let response_json = await response.json();
    console.log("audio_response", response_json);
    word = response_json.output.text;
    console.log("word", word);
    let prompt = "a json list of 5 words related to " + word + "with no extra words or punctuation";
    document.body.style.cursor = "progress";
    document.body.style.cursor = "progress";
    data = {
        model: "openai/gpt-5",
        input: {
            prompt: prompt,
        },
    };
    console.log("Making a Fetch Request", data);
    options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };
    const raw_response = await fetch(url, options);
    //turn it into json
    const json_response = await raw_response.json();
    console.log("json_response", json_response);
    document.body.style.cursor = "auto";
    let parsedResponse = JSON.parse(json_response.output.join(""));
    let responseCount = parsedResponse.length;
    let orbit = { x: 0, y: 0 };
    for (let i = 0; i < responseCount; i++) {
        let textResponse = parsedResponse[i];
        let radius = 100;
        orbit.x = location.x + radius * Math.cos(i * 2 * Math.PI / responseCount);
        orbit.y = location.y + radius * Math.sin(i * 2 * Math.PI / responseCount);
        drawWord(textResponse, orbit);
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
    document.body.appendChild(canvas);
    //console.log('canvas', canvas.width, canvas.height);


    inputBox = document.createElement('input');
    inputBox.setAttribute('type', 'text');

    inputBox.setAttribute('id', 'inputBox');
    inputBox.setAttribute('placeholder', 'X');
    inputBox.style.position = 'absolute';
    inputBox.style.left = '50%';
    inputBox.style.top = '50%';
    inputBox.style.width = '30px';
    inputBox.style.transform = 'translate(-50%, -50%)';
    inputBox.style.zIndex = '100';
    inputBox.style.fontSize = '20px';
    inputBox.style.fontFamily = 'Arial';
    document.body.appendChild(inputBox);

    // Add event listener to the input box
    // inputBox.addEventListener('keydown', function (event) {
    //     // Check if the Enter key is pressed

    //     if (event.key === 'Enter') {
    //         const inputValue = inputBox.value;
    //         askWord(inputValue, { x: inputLocationX, y: inputLocationY });
    //         inputBoxDirectionX = 1;
    //         inputBoxDirectionY = 1;
    //     }
    // });

    // Add event listener to the document for mouse down event
    document.addEventListener('mousedown', (event) => {
        console.log("Recording started");
        // Set the location of the input box to the mouse location
        inputLocationX = event.clientX;
        inputLocationY = event.clientY;
        inputBoxDirectionX = 0;
        inputBoxDirectionY = 0;

        mediaRecorder.start();

        setTimeout(stopRecording, 2000);

    });
}

function stopRecording() {
    mediaRecorder.stop();
    console.log("Recording stopped");
}


async function convertBlobToBase64(audioBlob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function () {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = function (error) {
            reject(error);
        };
        reader.readAsDataURL(audioBlob);
    });
}



async function setUpRecorder() {
    audioContext = new AudioContext();
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    let mrChunks = [];

    // Create a media recorder and start recording
    mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.addEventListener("dataavailable", (event) => {
        mrChunks.push(event.data);
    });
    mediaRecorder.addEventListener("stop", (event) => {
        const recordedData = new Blob(mrChunks, { type: "audio/webm" });
        console.log("Recording stopped", recordedData);

        // let av = document.createElement("VIDEO");
        // var audioURL = window.URL.createObjectURL(recordedData);
        // av.src = audioURL;
        // av.width = 100;
        // av.height = 20;
        // document.body.appendChild(av);
        // av.play();
        // console.log(av);

        askVoiceThenWord(recordedData, { x: inputLocationX, y: inputLocationY });
        mrChunks = [];
    });

}

