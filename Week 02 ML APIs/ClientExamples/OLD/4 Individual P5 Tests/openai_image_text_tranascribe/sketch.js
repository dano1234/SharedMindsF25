const openAIProxy = "https://openai-api-proxy.glitch.me";

let img;
let feedback;

function setup() {
  let input_image_field = createInput(
    "A student trying to learn how use a machine learning API"
  );
  input_image_field.size(600);
  input_image_field.id("input_image_prompt");
  let button1 = createButton("AskPicture");
  button1.mousePressed(() => {
    askForImage(input_image_field.value());
  });
  createElement("br");
  let input_field = createInput(
    "Why should learn to use a machine learning API?"
  );
  input_field.id("input_prompt");
  input_field.size(600);
  let button2 = createButton("AskWords");
  button2.mousePressed(() => {
    askForWords(input_field.value());
  });
  createElement("br");
  feedback = createP("");
  createElement("br");
  feedback.position(10, 90)
  let canvas = createCanvas(512, 512);
  canvas.position(0, 120);
  setupAudio();
}

function draw() {
  if (img) image(img, 0, 0);
}

async function askForWords(p_prompt) {
  document.body.style.cursor = "progress";
  feedback.html("Waiting for reply from OpenAi...");
  const data = {
    model: "gpt-3.5-turbo-instruct",  //"gpt-4-1106-preview", //
    prompt: p_prompt,
    temperature: 0,
    max_tokens: 1000,
    //  n: 1,
    //  stop: "\n",
  };
  console.log("Asking for Words From OpenAI via Proxy", data);
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  };
  const url = openAIProxy + "/AskOpenAI/";
  console.log("words url", url, "words options", options);
  const response = await fetch(url, options);
  console.log("words_response", response);
  const openAI_json = await response.json();
  console.log("openAI_json", openAI_json);
  if (openAI_json.choices.length == 0) {
    feedback.html("Something went wrong, try it again");
  } else {
    let choicesjoin = "";
    for (let i = 0; i < openAI_json.choices.length; i++) {
      choicesjoin += openAI_json.choices[i].text;
    }
    feedback.html(choicesjoin);
    //console.log("proxy_said", proxy_said.output.join(""));
  }
  document.body.style.cursor = "auto";
}

async function askForImage(p_prompt) {
  document.body.style.cursor = "progress";

  feedback.html("Waiting for reply from OpenAi...");
  const data = {
    prompt: p_prompt,
    n: 2,
    response_format: "b64_json",
    size: "512x512",
  };
  console.log("Asking Images From OpenAI via Proxy", data);
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  };
  const url = openAIProxy + "/AskOpenAIImage/";
  console.log("words url", url, "words options", options);
  const response = await fetch(url, options);
  console.log("words_response", response);
  const openAI_json = await response.json();
  console.log("openAI_json", openAI_json.data[0].b64_json);
  //allow cross origin loading of images

  loadImage(
    "data:image/jpeg;base64," + openAI_json.data[0].b64_json,
    function (incomingImage) {
      img = incomingImage;
      console.log("img", img);
    }
  );

  document.body.style.cursor = "auto";
}

async function askForAudio(audio) {
  document.body.style.cursor = "progress";

  feedback.html("Waiting for reply from OpenAi Audio...");
  //read test.m4a file audio file from disk
  //https://stackoverflow.com/questions/10058814/get-data-from-fs-readfile

  console.log("Asking Audio From OpenAI via Proxy");

  const formData = new FormData();
  formData.append("file", audio);
  formData.append("model", "whisper-1");

  const url = openAIProxy + "/askOpenAIAudio/";
  console.log("audio url", url);

  const response = await fetch(url, {
    mode: "cors",
    method: "POST",
    body: formData,
  });

  const openAI_json = await response.json();
  console.log("audio_response", openAI_json.transcription);
  feedback.html(openAI_json.transcription);

  document.body.style.cursor = "auto";
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

      askForAudio(recordedData);
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
