const replicateProxy = "https://replicate-api-proxy.glitch.me";

let distances = []
function setup() {
  createCanvas(600, 700);
  let input_field = createInput("dog on a leash, taking a walk, doing jumping jacks, jogging,person on leash, cat on a leash");
  input_field.size(550);
  //add a button to ask for words
  let button = createButton("Ask");
  button.mousePressed(() => {
    askForEmbeddings(input_field.value());
  });
  textSize(18)
}

function draw() {
  background(255);
  for (let i = 0; i < distances.length; i++) {
    let thisComparison = distances[i];
    let pixelDistance = (1 - thisComparison.distance) * height * 1.5;
    text(thisComparison.phrase, 20 + pixelDistance, 20 + pixelDistance)
  }
}

async function askForEmbeddings(p_prompt) {
  let promptInLines = p_prompt.replace(/,/g, "\n");
  let data = {
    version: "75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a",
    input: {
      inputs: promptInLines,
    },
  };
  console.log("Asking for Picture Info From Replicate via Proxy", data);
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const url = replicateProxy + "/create_n_get/";
  console.log("url", url, "options", options);
  const raw = await fetch(url, options);
  //console.log("raw", raw);
  const proxy_said = await raw.json();
  let output = proxy_said.output;
  console.log("Proxy Returned", output);
  distances = []
  let firstOne = output[0];
  
  for (let i = 0; i < output.length; i++) {
    let thisOne = output[i];
    let cdist = cosineSimilarity(firstOne.embedding, thisOne.embedding);
    distances.push({ "reference": firstOne.input, "phrase": thisOne.input, "distance": cdist })
    console.log(firstOne.input, thisOne.input, cdist);
  }
}

function cosineSimilarity(vecA, vecB) {
  return dotProduct(vecA, vecB) / (magnitude(vecA) * magnitude(vecB));
}

function dotProduct(vecA, vecB) {
  let product = 0;
  for (let i = 0; i < vecA.length; i++) {
    product += vecA[i] * vecB[i];
  }
  return product;
}

function magnitude(vec) {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}




