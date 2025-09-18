
let button;
let inputBox;
let video;    // webcam
let canvas;
let img


function setup() {
  canvas = createCanvas(640, 480);
  button = createButton("Ask");
  button.mousePressed(ask);
  button.position(530, 40);
  button = createButton("Live Video");
  button.mousePressed(function () { img = video; });
  button.position(530, 70);
  inputBox = createInput("Fairy Princess");
  inputBox.position(530, 10);

  video = createCapture(VIDEO);  //simpler if you don't need to pick between cameras
  //if you want to pick a different camera than default
  //let captureConstraints = allowCameraSelection(canvas.width, canvas.height);
  //video = createCapture(captureConstraints);//, captureLoaded);

  //video.size(512, 512);
  video.hide();
  img = video;
}

function draw() {
  if (img) {
    image(img, 0, 0, 640, 480);
  }

}

async function ask() {

  replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
  let authToken = "";

  canvas.loadPixels();
  let imgBase64 = canvas.elt.toDataURL();
  //console.log("imgBase64", imgBase64);

  let postData = {
    model: "google/nano-banana",
    //fieldToConvertBase64ToURL: "image_input",
    //fileFormat: "jpg",
    input: {
      prompt: inputBox.value(),
      image_input: [imgBase64],
      output_format: "png",
    },
  };
  console.log("postData", postData);

  const options = {
    headers: {
      "Content-Type": `application/json`,
      'Authorization': `Bearer ${authToken}`,
    },
    method: "POST",
    body: JSON.stringify(postData), //p)
  };
  console.log("Asking for Picture ", replicateProxy, options);
  const response = await fetch(replicateProxy, options);
  const result = await response.json();
  console.log("result", result);

  loadImage(result.output, function (newImage) {
    //"data:image/png;base64," +
    console.log("image loaded", newImage);
    // image(img, 0, 0);
    img = newImage;
  });

}






