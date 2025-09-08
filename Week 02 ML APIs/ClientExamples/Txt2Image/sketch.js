

let feedback;
let img;

function setup() {
  createCanvas(512, 512);
  let input_image_field = createInput(
    "A student trying to learn how use a machine learning API"
  );
  input_image_field.size(450);
  input_image_field.id("input_image_prompt");
  input_image_field.position(10, 10);
  //add a button to ask for picture
  let button = createButton("Ask");
  button.position(460, 10);
  button.mousePressed(() => {
    askForPicture(input_image_field.value());
  });
  feedback = createP("");
  feedback.position(0, 20);
}

function draw() {
  if (img) image(img, 0, 0, width, height);
}

async function askForPicture(p_prompt) {
  let authToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImUzZWU3ZTAyOGUzODg1YTM0NWNlMDcwNTVmODQ2ODYyMjU1YTcwNDYiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRGFuIE8nU3VsbGl2YW4iLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSmhrcTc0NjBZNzNWSWNTdk9QdlVhYnJhVmdmS2RHTENnMWJkTHlNaDdwTDc1LVJtUno9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaXRwLWltYS1yZXBsaWNhdGUtcHJveHkiLCJhdWQiOiJpdHAtaW1hLXJlcGxpY2F0ZS1wcm94eSIsImF1dGhfdGltZSI6MTc1NzM2MjUwNywidXNlcl9pZCI6IkN0VDlRc2ZySnFQc3doR29zTDZ6QWEyVFhTWTIiLCJzdWIiOiJDdFQ5UXNmckpxUHN3aEdvc0w2ekFhMlRYU1kyIiwiaWF0IjoxNzU3MzYyNTA3LCJleHAiOjE3NTczNjYxMDcsImVtYWlsIjoiZGJvM0BueXUuZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDA5Njk1NjkyMjY5NDIyMjQ0NjciXSwiZW1haWwiOlsiZGJvM0BueXUuZWR1Il19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.d8Fqk2c6eEDvzoWX5Hu9_-JnYOIq6CzmK-X1oZwqmiUf4AW1GePo3o_5SBPRDF412bdM6MePA-QkON5Y_4uB0Ev418PM9nWCdaIivGsp86k2s08rtIrT1GZNKzFkc9QdIPrYk3RiH6-7iF8c9ozjF7hqil75fbegNiKY3dyqnDwq_AtXuqeC6LH0jHxR6GcqXBxxXWapTEsp7z3GISXhMoBAAVN5UNHsHUl-hQj4XyFy3I8J_YadsCARj2xZcFanYn46o3g_SkZGJA2p7IeRfUKgHN3KUQlHmVozJZGMcv4N-dDwOjHBbKCXVna0feEWr6qPl6NTu6cLFXNDcIKpYQ";
  const replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
  let data = {
    model: "ideogram-ai/ideogram-v3-turbo",
    input: {
      prompt: p_prompt,
    },
  };


  let fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  };
  console.log("data", fetchOptions, "url", replicateProxy);
  try {
    feedback.html("Generating image...");
    const response = await fetch(replicateProxy, fetchOptions);

    const prediction = await response.json();
    console.log("prediction", prediction);
    loadImage(prediction.output, (incomingImage) => {
      img = incomingImage;
      feedback.html("Image generated!");
    });

  } catch (error) {
    feedback.html("Error: " + error.message);
    console.error("Error:", error);
  }
}

