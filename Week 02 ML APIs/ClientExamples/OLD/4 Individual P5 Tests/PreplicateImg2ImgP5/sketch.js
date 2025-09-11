
let button;
let inputBox;
let video;    // webcam
let canvas;
let img

const replicateProxy = "https://replicate-api-proxy.glitch.me";

function setup() {
  canvas = createCanvas(512, 512);
  button = createButton("Ask");
  button.mousePressed(ask);
  button.position(530, 40);
  button = createButton("Live Video");
  button.mousePressed(function () { img = video; });
  button.position(530, 70);
  inputBox = createInput("Old Man");
  inputBox.position(530, 10);

  video = createCapture(VIDEO);  //simpler if you don't need to pick between cameras
  //if you want to pick a different camera than default
  //let captureConstraints = allowCameraSelection(canvas.width, canvas.height);
  //video = createCapture(captureConstraints);//, captureLoaded);

  video.size(512, 512);
  video.hide();
  img = video;
}

function draw() {
  if (img) {
    image(img, 0, 0, 512, 512);
  }

}

async function ask() {
  canvas.loadPixels();
  let imgBase64 = canvas.elt.toDataURL();

  let postData = {
    version: "15a3689ee13b0d2616e98820eca31d4c3abcd36672df6afce5cb6feb1d66087d",
    input: {


      prompt: inputBox.value(),
      negative_prompt: "",
      width: 512,
      height: 512,
      prompt_strength: 0.5,
      image: imgBase64,
    },
  };

  let url = replicateProxy + "/create_n_get";
  const options = {
    headers: {
      "Content-Type": `application/json`,
    },
    method: "POST",
    body: JSON.stringify(postData), //p)
  };
  console.log("Asking for Picture ", url, options);
  const response = await fetch(url, options);
  const result = await response.json();
  console.log(result.output[0]);

  loadImage(result.output[0], function (newImage) {
    //"data:image/png;base64," +
    console.log("image loaded", newImage);
    // image(img, 0, 0);
    img = newImage;
  });

}






