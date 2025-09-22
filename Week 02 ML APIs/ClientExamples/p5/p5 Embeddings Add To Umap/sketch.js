//const replicateProxy = "https://replicate-api-proxy.glitch.me";
//const replicateProxy ="https://create-n-get-uk4oy2fojq-uc.a.run.app"
//https://replicateproxy-tc5vweqxmq-uc.a.run.app
//const replicateProxy = "https://replicateproxy-tc5vweqxmq-uc.a.run.app/predictions";
//const replicateProxy = "http://127.0.0.1:5002/itp-ima-replicate-proxy/us-central1/replicateProxy/create_n_get";
const replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";

let words = []
let umap;
let embeddings = []
let nEpochs = 1000;
let iterations = 1001;
let clusterSize = 5;

function setup() {
  createCanvas(600, 600);
  let input_field = createInput("shoe,sock,dress,ball,bat,fence,grass,cat,fish,dog,lemon,knife,apple,nut,tree,leaf");
  input_field.size(600);
  input_field.position(20, 20);
  input_field.changed(function () {
    askForEmbeddings(input_field.value());
    input_field.value("");
  });
  //add a button to ask for words
  // let button = createButton("Ask");
  // button.mousePressed(() => {
  //   askForEmbeddings(input_field.value());
  // });
  // UMAP configuration options
  umap = new UMAP({
    n_neighbors: clusterSize,
    n_components: 2,
    metric: 'cosine',
    random_state: 42,
    min_dist: 0.1,
    n_epochs: nEpochs,
    learning_rate: 1.0,
    init: 'random',
    verbose: true
  });
  textSize(18)
}

function draw() {
  background(255);
  // Run UMAP iterations
  if (embeddings.length < clusterSize) {
    text("Not enough items to cluster, please add more", 20, 15);
    return;
  }



  if (iterations < nEpochs) {
    iterations = umap.step();
  }

  // Get the current UMAP results
  let umapResults = umap.getEmbedding();

  // Variables to store the min and max values for mapping
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  //console.log("umapResults", umapResults);

  // Calculate the min and max values for x and y
  for (let i = 0; i < umapResults.length; i++) {
    let dataPoint = umapResults[i];
    minX = min(dataPoint[0], minX);
    minY = min(dataPoint[1], minY);
    maxX = max(dataPoint[0], maxX);
    maxY = max(dataPoint[1], maxY);
  }

  // Draw the UMAP results on the canvas
  for (let i = 0; i < umapResults.length; i++) {
    let dataPoint = umapResults[i];
    // Map the UMAP output to canvas coordinates
    let x = map(dataPoint[0], minX, maxX, 0, width);
    let y = map(dataPoint[1], minY, maxY, 0, height);
    noStroke();
    fill(127, 127, 127);
    // Display the text from the JSON data at the mapped coordinates
    text(words[i], x, y);
  }
}

async function askForEmbeddings(p_prompt) {
  //weird json format for replicate
  p_prompt = p_prompt.split(",");
  p_prompt = p_prompt.map(item => `"${item}"`);
  p_prompt = p_prompt.join(",");
  p_prompt = `[${p_prompt}]`;


  let data = {
    version: "beautyyuyanli/multilingual-e5-large:a06276a89f1a902d5fc225a9ca32b6e8e6292b7f3b136518878da97c458e2bad",
    input: {
      //texts: "[\"In the water, fish are swimming.\", \"Fish swim in the water.\", \"A book lies open on the table.\"]",
      texts: p_prompt,
    },
  };
  console.log("Asking for Embedding Similarities From Replicate via Proxy", data);
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const url = replicateProxy; //+ "/create_n_get/";

  try {
    const raw = await fetch(url, options);
    //console.log("raw", raw);
    const proxy_said = await raw.json();
    let output = proxy_said.output;
    console.log("Proxy Returned", proxy_said);
    let input = proxy_said.input;
    input = JSON.parse(input.texts);
    for (let i = 0; i < output.length; i++) {
      embeddings.push(output[i]);
      words.push(input[i]);
    }

    if (embeddings.length > clusterSize) {
      console.log("Initializing UMAP with", embeddings.length, "embeddings");
      umap = new UMAP({
        n_neighbors: clusterSize,
        n_components: 2,
        metric: 'cosine',
        random_state: 42,
        min_dist: 0.1,
        n_epochs: nEpochs,
        learning_rate: 1.0,
        init: 'random',
        verbose: true
      });
      umap.initializeFit(embeddings);
      iterations = 0;

    }
  } catch (e) {
    console.log("error", e);
  }
}





