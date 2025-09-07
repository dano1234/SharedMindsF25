
const replicateProxy = "https://replicateproxy-tc5vweqxmq-uc.a.run.app/create_n_get";
//const replicateProxy = "http://127.0.0.1:5002/itp-ima-replicate-proxy/us-central1/replicateProxy/create_n_get";
let img;
let feedback;

function setup() {
  createElement("br");
  feedback = createP("");
  createElement("br");
  feedback.position(10, 90);
  let canvas = createCanvas(512, 512);
  canvas.position(0, 120);
  setupAudio();
}

function draw() {
  if (img) image(img, 0, 0);
}

async function askWithAudio(audio) {
  document.body.style.cursor = "progress";

  const b64Audio = await convertBlobToBase64(audio);
  feedback.html("Waiting for reply from Replicate Audio...");

  let data = {
    fieldToConvertBase64ToURL: "audio",
    fileFormat: "wav",
    version: "3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
    input: {
      audio: b64Audio,
    },
  };
  console.log(data);
  console.log(replicateProxy);
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  }

  try {
    const response = await fetch(replicateProxy, options);

    const prediction = await response.json();
    console.log("prediction", prediction);
    feedback.html(prediction.output.text);
    //break;

    // if (prediction.error) {
    //   feedback.html("Error: " + prediction.error);
    //   return;
    // }

    // Wait for the prediction to complete
    // while (prediction.status !== "succeeded" && prediction.status !== "failed") {
    //   await new Promise(resolve => setTimeout(resolve, 1000));
    //   const statusResponse = await fetch(`${replicateProxy}/${prediction.id}`);
    //   const statusData = await statusResponse.json();
    //   if (statusData.status === "succeeded") {
    //     feedback.html(statusData.output.text);
    //     break;
    //   } else if (statusData.status === "failed") {
    //     feedback.html("Transcription failed: " + statusData.error);
    //     break;
    //   }
    // }
  } catch (error) {
    feedback.html("Error: " + error.message);
    console.error("Error:", error);
  } finally {
    document.body.style.cursor = "auto";
  }
}

async function convertBlobToBase64(audioBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = function (error) {
      reject(error);
    };
    reader.readAsDataURL(audioBlob);
  });
}

function setupAudio() {
  // Set up the audio context and media stream
  const audioContext = new AudioContext();
  let mediaStream;
  let mediaRecorder;

  // Get the start and stop recording buttons
  const startButton = document.createElement("button");
  startButton.id = "start-recording";
  startButton.textContent = "Start Recording";
  startButton.style.position = "absolute";
  startButton.style.top = "50px";
  startButton.style.left = "10px";
  document.body.appendChild(startButton);

  const stopButton = document.createElement("button");
  stopButton.style.position = "absolute";
  stopButton.style.top = "50px";
  stopButton.style.left = "160px";
  stopButton.id = "stop-recording";
  stopButton.textContent = "Stop Recording";
  // Add a click event listener to the stop recording button
  stopButton.addEventListener("click", async function () {
    // Stop the media recorder and get the recorded data
    mediaRecorder.stop();
  });
  document.body.appendChild(stopButton);

  // Add a click event listener to the start recording button
  startButton.addEventListener("click", async function () {
    // Request access to the user's microphone
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

      let av = document.createElement("VIDEO");
      var audioURL = window.URL.createObjectURL(recordedData);
      av.src = audioURL;
      av.width = 100;
      av.height = 20;
      document.body.appendChild(av);
      av.play();
      console.log(av);

      askWithAudio(recordedData);
    });
    mediaRecorder.start();

    console.log("Recording started");
  });
}
