let img;
let button;
let inputBox;
let mask;
let maskBase64 = "";
let canvas;
const replicateProxy = "https://replicate-api-proxy.glitch.me"

let canvas2;

function preload() {
  img = loadImage("jacob.jpeg");
}
function setup() {
  button = createButton("Ask");
  button.mousePressed(ask);
  button.position(530, 40);
  inputBox = createInput("Old Man");
  inputBox.position(530, 10);

  canvas = createCanvas(512, 512);
  canvas.position(0, 0);

  mask = createGraphics(512, 512);
  mask.fill(0, 0, 0);
  mask.noStroke();
  image(img, 0, 0, 512, 512);

}

function draw() {
  //nothing
}

function mouseDragged() {
  mask.noStroke();
  mask.fill(255, 255, 255);
  mask.ellipse(mouseX, mouseY, 10, 10);
  //  this was a test thing sorry. ellipse(512 + mouseX, mouseY, 10, 10);
  image(mask, 0, 0, 512, 512);

}
function mouseReleased() {
  maskBase64 = mask.elt.toDataURL();
}

async function ask() {
  image(img, 0, 0, 512, 512);
  canvas.loadPixels();
  mask.loadPixels();
  let maskBase64 = mask.elt.toDataURL();
  let imgBase64 = canvas.elt.toDataURL();


  let postData = {
    "version": "8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f",
    input: {
      "prompt": inputBox.value(),
      "width": 512,
      "height": 512,
      "prompt_strength": 0.5,
      "image": imgBase64,
      "mask": maskBase64,

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
    console.log("image loaded", newImage);
    mask = createGraphics(512, 512);
    img = newImage;
    image(img, 0, 0, 512, 512);
  });

}
