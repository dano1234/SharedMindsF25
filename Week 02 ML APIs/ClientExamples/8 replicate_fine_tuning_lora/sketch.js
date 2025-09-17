let lora_field;
let prompt_field;

let imgs = [];

//everyone should look like Dano
const myLoraUrl = "dano1234/dano";
function setup() {
  createCanvas(1024, 1024);
  lora_field = createInput(myLoraUrl);
  lora_field.size(550);
  lora_field.position(0, 0);

  prompt_field = createInput(
    "DANO fishing in Montana"
  );
  prompt_field.size(550);
  prompt_field.position(0, 20);
  //add a button to ask for words
  let button = createButton("Use Lora");
  let loraModelAddress = createP("Create a lora model and get address of replicate hosting of it at https://replicate.com/replicate/fast-flux-trainer/train");
  loraModelAddress.position(570, -15);
  button.position(550, 20);
  button.mousePressed(() => {
    askForLora(prompt_field.value(), lora_field.value());
  });
  textSize(18);
}

function draw() {
  background(255);
  if (imgs[0]) image(imgs[0], 0, 0, 512, 512);
  if (imgs[1]) image(imgs[1], 512, 0, 512, 512);
  if (imgs[2]) image(imgs[2], 0, 512, 512, 512);
  if (imgs[3]) image(imgs[3], 512, 512, 512, 512);
}

async function askForLora(prompt, loraUrl) {
  let authToken = "";
  let replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
  let data = {
    model: "black-forest-labs/flux-schnell-lora",
    input: {
      prompt: prompt,
      lora_weights: loraUrl,
      //     scheduler: "DPMSolverMultistep",
      // lora_scales: "0.5",
      num_outputs: 4,
      // guidance_scale: 7.5,
      // negative_prompt: "hat helmet",
      // num_inference_steps: 50,
    },
  };

  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  };

  console.log("options", data);
  const raw = await fetch(replicateProxy, options);
  const result = await raw.json();
  console.log("Proxy Returned", result);
  if (result.output.length > 0) {
    for (let i = 0; i < result.output.length; i++) {
      loadImage(result.output[i], (incomingImage) => {
        imgs[i] = incomingImage;
      });
    }
  }
}
