
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
    const replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get"
    const authToken = "";
    //Optionally Get Auth Token from: https://itp-ima-replicate-proxy.web.app/
    let data = {
        "version": "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
        input: {
            "prompt": p_prompt,
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

    console.log("url", replicateProxy, "options", options);
    const response = await fetch(replicateProxy, options);
    //console.log("picture_response", picture_info);
    const jsonResponse = await response.json();
    console.log("jsonResponse", jsonResponse.output);
    const ctx = new AudioContext();
    let incomingData = await fetch(jsonResponse.output);
    let arrayBuffer = await incomingData.arrayBuffer();
    let decodedAudio = await ctx.decodeAudioData(arrayBuffer);
    const playSound = ctx.createBufferSource();
    playSound.buffer = decodedAudio;;
    playSound.connect(ctx.destination);
    playSound.start(ctx.currentTime);

    //playSound.loop = true;

}

