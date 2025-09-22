
let words = []
let umap;
let embeddings = []
let nEpochs = 500;
let iterations = 1001;
let clusterSize = 5;
let myCanvas;
let inputField;
init()

function init() {
  myCanvas = document.createElement('canvas');
  myCanvas.width = window.innerWidth;
  myCanvas.height = window.innerHeight;
  document.body.appendChild(myCanvas);
  inputField = document.createElement('input');
  inputField.setAttribute('id', 'inputField');
  inputField.style.position = 'absolute';
  inputField.style.left = '50%';
  inputField.style.top = '50%';
  inputField.style.transform = 'translate(-50%, -50%)';
  inputField.style.zIndex = '100';
  inputField.style.fontSize = '30px';
  inputField.style.fontFamily = 'Arial';
  document.body.appendChild(inputField);
  //put text into the input field
  inputField.value = "shoe,sock,dress,ball,bat,fence,grass,cat,fish,dog,lemon,knife,apple,nut,tree,leaf";
  inputField.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      askForEmbeddings(inputField.value);
      inputField.value = "";
    }
  });



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
  animate();
}

function animate() {
  myCanvas.style.backgroundColor = 'white';
  let ctx = myCanvas.getContext('2d');
  ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);

  ctx.font = '32px Arial';
  // Run UMAP iterations
  if (embeddings.length < clusterSize) {
    ctx.fillStyle = 'black';
    ctx.fillText("Not enough items to cluster, please add more", 20, 15);
    console.log("Not enough items to cluster, please add more");
    requestAnimationFrame(animate);
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
    minX = Math.min(dataPoint[0], minX);
    minY = Math.min(dataPoint[1], minY);
    maxX = Math.max(dataPoint[0], maxX);
    maxY = Math.max(dataPoint[1], maxY);
  }

  // Draw the UMAP results on the canvas
  for (let i = 0; i < umapResults.length; i++) {
    let dataPoint = umapResults[i];
    // Map the UMAP output to canvas coordinates
    //is there a javascript function that will map one range to another? 
    //why am I getting an error saying Math.map is not a function?
    let x = (dataPoint[0] - minX) / (maxX - minX) * myCanvas.width;
    let y = (dataPoint[1] - minY) / (maxY - minY) * myCanvas.height;


    // Display the text from the JSON data at the mapped coordinates
    ctx.fillStyle = 'black';
    ctx.fillText(words[i], x, y);
  }
  requestAnimationFrame(animate);
}

async function askForEmbeddings(p_prompt) {
  const replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
  const authToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjA1NTc3MjZmYWIxMjMxZmEyZGNjNTcyMWExMDgzZGE2ODBjNGE3M2YiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRGFuIE8nU3VsbGl2YW4iLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSmhrcTc0NjBZNzNWSWNTdk9QdlVhYnJhVmdmS2RHTENnMWJkTHlNaDdwTDc1LVJtUno9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaXRwLWltYS1yZXBsaWNhdGUtcHJveHkiLCJhdWQiOiJpdHAtaW1hLXJlcGxpY2F0ZS1wcm94eSIsImF1dGhfdGltZSI6MTc1ODU2NTcxNSwidXNlcl9pZCI6IkN0VDlRc2ZySnFQc3doR29zTDZ6QWEyVFhTWTIiLCJzdWIiOiJDdFQ5UXNmckpxUHN3aEdvc0w2ekFhMlRYU1kyIiwiaWF0IjoxNzU4NTY1NzE1LCJleHAiOjE3NTg1NjkzMTUsImVtYWlsIjoiZGJvM0BueXUuZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDA5Njk1NjkyMjY5NDIyMjQ0NjciXSwiZW1haWwiOlsiZGJvM0BueXUuZWR1Il19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.hh7R4jjYgDPrV5zx-kZ0feBDbDJiUaXfig9X2biMyVVrRBl_X6DJoD25lbDTGGR4A2fobBRLv_aiK84gywUp6TIOQi3HKit2onLCzbhUoJnToDUdJXTPPVvTAgMKOfenD7cFWkKjR_d5ZE1SjCKY9mLJDrFa10eAOva3ig4ghnOq-kihWY_a4zFdUmeaiXx_C1mr47CfUuYIfNOVN_98inAS_qpNgEJM9gVo_QHmQWPjRlGNI0z8FGIb9KFNkhoLud0LL6-BANmFc3OnPkFXtZK4_50-s8N2jV764-bL3TTE-cVey9qPtrZBbBmKii9NBctvTvXHZslLCFWu92pCsA";
  //Optionally Get Auth Token from: https://itp-ima-replicate-proxy.web.app/


  //weird json format for replicate
  p_prompt = p_prompt.split(","); //turn into an array
  p_prompt = JSON.stringify(p_prompt); //turn into a string with quotes around each item  


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
      'Authorization': `Bearer ${authToken}`,
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





