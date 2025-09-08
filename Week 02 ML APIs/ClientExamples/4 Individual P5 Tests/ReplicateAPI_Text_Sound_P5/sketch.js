const replicateProxy = "https://replicate-api-proxy.glitch.me"

function setup() {
    createCanvas(512, 512);
    let input_image_field = createInput("Grateful Dead meets Hip Hop");
    input_image_field.size(600);
    input_image_field.id("input_image_prompt");
    input_image_field.position(10, 10);

    //add a button to ask for picture
    let button1 = createButton("Ask For Sound");
    button1.mousePressed(() => {
        askForSound(input_image_field.value());
    });
    button1.position(10, 40);

}

async function askForSound(p_prompt) {
    //const imageDiv = select("#resulting_image");
    //imageDiv.html("Waiting for reply from Replicate's API...");
    let data = {
        //replicate / riffusion / riffusion
        "version": "8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05",
        input: {
            "prompt_a": p_prompt,
        },
    };
    console.log("Asking for Sound Info From Replicate via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    const url = replicateProxy + "/create_n_get/"
    console.log("url", url, "options", options);
    const picture_info = await fetch(url, options);
    //console.log("picture_response", picture_info);
    const proxy_said = await picture_info.json();
    console.log("proxy_said", proxy_said.output.audio);
    const ctx = new AudioContext();
    let incomingData = await fetch(proxy_said.output.audio);
    let arrayBuffer = await incomingData.arrayBuffer();
    let decodedAudio = await ctx.decodeAudioData(arrayBuffer);
    const playSound = ctx.createBufferSource();
    playSound.buffer = decodedAudio;;
    playSound.connect(ctx.destination);
    playSound.start(ctx.currentTime);

    playSound.loop = true;

}
