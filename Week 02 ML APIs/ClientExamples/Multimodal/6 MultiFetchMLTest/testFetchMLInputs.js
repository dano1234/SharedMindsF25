document.body.appendChild(document.createElement("h1")).textContent = "Test for Many ML APIs";

let inputDiv = document.createElement("div");
inputDiv.style.position = "absolute";
inputDiv.style.top = "10px";
inputDiv.style.left = "10px";
inputDiv.style.width = "300px";
inputDiv.style.height = "600px";
inputDiv.style.zIndex = "5";

document.body.appendChild(inputDiv);

let recordedData;

setupTextInput()
setupAudioInput();
setupImageInput();

export function getRecordedData() {
    return recordedData;
}

function setupTextInput() {
    inputDiv.appendChild(document.createElement("br"));
    inputDiv.appendChild(document.createElement("br"));
    const textInput = document.createElement("input");
    inputDiv.appendChild(document.createElement("h2")).textContent = "Text Input";
    textInput.setAttribute("type", "text");
    textInput.setAttribute("id", "textInput");
    textInput.style.width = "400px";
    //textInput.setAttribute("placeholder", "How tall is the empire state building?");
    textInput.value = "A man juggling balls at the circus in a poem";
    textInput.height = "20px";
    inputDiv.appendChild(textInput);
    textInput.style.zIndex = "5";
}



function setupAudioInput() {
    inputDiv.appendChild(document.createElement("br"));
    inputDiv.appendChild(document.createElement("br"));
    inputDiv.appendChild(document.createElement("br"));
    inputDiv.appendChild(document.createElement("h2")).textContent = "Sound Input";
    // Set up the audio context and media stream
    const audioContext = new AudioContext();
    let mediaStream;
    let mediaRecorder;

    let mediaRecorderSpan = document.createElement("span");
    mediaRecorderSpan.id = "mediaRecorderSpan";

    mediaRecorderSpan.style.zIndex = "5";
    inputDiv.appendChild(mediaRecorderSpan);

    // Get the start and stop recording buttons
    const startButton = document.createElement("button");
    startButton.style.height = "40px";
    startButton.id = "start-recording";
    startButton.textContent = "Start Recording";
    mediaRecorderSpan.appendChild(startButton);

    const stopButton = document.createElement("button");
    stopButton.id = "stop-recording";
    stopButton.style.height = "40px";
    stopButton.textContent = "Stop Recording";
    mediaRecorderSpan.appendChild(stopButton);

    // Add a click event listener to the start recording button
    startButton.addEventListener("click", async function () {
        // Request access to the user's microphone
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        let audioChunks = [];
        // Create a media recorder and start recording
        mediaRecorder = new MediaRecorder(mediaStream);
        mediaRecorder.addEventListener("dataavailable", (event) => {
            audioChunks.push(event.data);
        });
        mediaRecorder.addEventListener("stop", (event) => {
            recordedData = new Blob(audioChunks, { type: "audio/webm" });
            console.log("Recording stopped", recordedData);

            let avElement = document.createElement("audio");

            avElement.controls = true;
            var audioURL = window.URL.createObjectURL(recordedData);
            avElement.src = audioURL;
            mediaRecorderSpan.appendChild(avElement);
        });
        mediaRecorder.start();

        console.log("Recording started");
    });

    // Add a click event listener to the stop recording button
    stopButton.addEventListener("click", async function () {
        // Stop the media recorder and get the recorded data
        mediaRecorder.stop();
    });
}


function setupImageInput() {
    inputDiv.appendChild(document.createElement("br"));
    inputDiv.appendChild(document.createElement("br"));
    inputDiv.appendChild(document.createElement("br"));
    inputDiv.appendChild(document.createElement("h2")).textContent = "Image Input";


    const dropArea = document.createElement("div");
    dropArea.style.width = "80%";
    dropArea.style.height = "10%";
    dropArea.style.border = "2px dashed #ccc";
    dropArea.style.display = "flex";
    dropArea.style.justifyContent = "center";
    dropArea.style.alignItems = "center";
    dropArea.style.fontSize = "20px";
    dropArea.style.fontWeight = "bold";
    dropArea.textContent = "Drag and drop files here";
    inputDiv.appendChild(dropArea);

    inputDiv.appendChild(document.createElement("br"));
    inputDiv.appendChild(document.createElement("label")).textContent = "Or Select a File: ";
    let fileUpload = document.createElement("input");
    fileUpload.setAttribute("type", "file");
    fileUpload.setAttribute("id", "fileUpload");
    fileUpload.setAttribute("accept", "image/*");
    fileUpload.style.zIndex = "5";
    inputDiv.appendChild(fileUpload);
    let imageElement = document.createElement("img");
    imageElement.setAttribute("id", "inputImage");
    imageElement.style.zIndex = "5";
    inputDiv.appendChild(imageElement);
    imageElement.src = "./jacob.png";

    fileUpload.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file.type.match("image")) {
            const reader = new FileReader();
            reader.onload = function (event) {
                imageElement.src = event.target.result;
            }
            reader.readAsDataURL(file);
        }
    });


    dropArea.addEventListener("dragover", function (e) {
        e.preventDefault();  //prevents browser f  //prevents browser from opening the filerom opening the file
    }, false);

    dropArea.addEventListener("drop", (e) => {
        e.preventDefault();

        const files = e.dataTransfer.files;

        for (let i = 0; i < files.length; i++) {
            if (files[i].type.match("image")) {
                // Process the dropped image file here
                console.log("Dropped image file:", files[i]);
                const reader = new FileReader();
                reader.onload = function (event) {
                    imageElement.src = event.target.result;
                };
                reader.readAsDataURL(files[i]);

            }
        }
    }, true);

}

