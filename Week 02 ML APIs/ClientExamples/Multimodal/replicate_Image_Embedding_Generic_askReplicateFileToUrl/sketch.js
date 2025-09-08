const replicateProxy = "https://replicate-api-proxy.glitch.me";
let button;
let inputBox;
let video; // webcam
let canvas;
let img;
let feedback;

function setup() {
  createElement("br");
  feedback = createP("");
  createElement("br");
  canvas = createCanvas(512, 512);
  button = createButton("Ask");
  button.mousePressed(askForImageEmbedding);
  button.position(530, 40);
  button = createButton("Live Video");
  button.mousePressed(function () {
    img = video;
  });
  button.position(530, 70);

  video = createCapture(VIDEO); //simpler if you don't need to pick between cameras

  video.size(512, 512);
  video.hide();
  img = video;
}

function draw() {
  if (img) {
    image(img, 0, 0, 512, 512);
  }
}

function draw() {
  if (img) image(img, 0, 0);
}

async function askForImageEmbedding() {
  document.body.style.cursor = "progress";
  canvas.loadPixels();
  let imgBase64 = canvas.elt.toDataURL("image/png");
  imgBase64 = imgBase64.split(",")[1];

  feedback.html("Waiting for reply from Replicate Embedding...");
  let data = {
    fieldToConvertBase64ToURL: "input",  //they have two fields named input...
    fileFormat: "png",
    version: "0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304",
    input: {
      input: imgBase64,
      modality: "vision",
    },

  };


  const url = replicateProxy + "/askReplicateFileToUrl/";
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(url, options);
  const response_json = await response.json();
  console.log("response", response_json);

  feedback.html(response_json.output);
  document.body.style.cursor = "auto";
}
