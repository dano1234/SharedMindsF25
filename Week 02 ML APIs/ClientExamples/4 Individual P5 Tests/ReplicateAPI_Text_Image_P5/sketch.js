const replicateProxy = "https://replicate-api-proxy.glitch.me"

function setup() {
    createCanvas(512, 512);
    let input_image_field = createInput("A student trying to learn how use a machine learning API");
    input_image_field.size(600);

    input_image_field.id("input_image_prompt");
    input_image_field.parent("image_container");
    //add a button to ask for picture
    let button1 = createButton("Ask");
    button1.parent("image_container");
    button1.mousePressed(() => {
        askForPicture(input_image_field.value());
    });

    let input_field = createInput("Why should learn to use a machine learning API?");
    input_field.id("input_prompt");
    input_field.size(600);
    input_field.parent("text_container");
    //add a button to ask for words
    let button2 = createButton("Ask");
    button2.parent("text_container");
    button2.mousePressed(() => {
        askForWords(input_field.value());
    });


}

async function askForPicture(p_prompt) {
    const imageDiv = select("#resulting_image");
    imageDiv.html("Waiting for reply from Replicate's Stable Diffusion API...");
    let data = {
        "version": "da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf",
        input: {
            "prompt": p_prompt,
            "width": 512,
            "height": 512,
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
    const url = replicateProxy + "/create_n_get/"
    console.log("url", url, "options", options);
    const picture_info = await fetch(url, options);
    //console.log("picture_response", picture_info);
    const proxy_said = await picture_info.json();

    if (proxy_said.output.length == 0) {
        imageDiv.html("Something went wrong, try it again");
    } else {
        imageDiv.html("");
        loadImage(proxy_said.output[0], (img) => {
            image(img, 0, 0, width, height);
        });
    }
}

async function askForWords(p_prompt) {
    document.body.style.cursor = "progress";
    const textDiv = select("#resulting_text");
    textDiv.html("Waiting for reply from Replicate...");
    const data = {
        "version": "35042c9a33ac8fd5e29e27fb3197f33aa483f72c2ce3b0b9d201155c7fd2a287",
        input: {
            prompt: p_prompt,
            max_tokens: 100,
            max_length: 100,
        },
    };
    console.log("Asking for Words From Replicate via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };
    const url = replicateProxy + "/create_n_get/"
    console.log("words url", url, "words options", options);
    const words_response = await fetch(url, options);
    console.log("words_response", words_response);
    const proxy_said = await words_response.json();
    if (proxy_said.output.length == 0) {
        textDiv.html("Something went wrong, try it again");
    } else {
        textDiv.html(proxy_said.output.join(""));
        console.log("proxy_said", proxy_said.output.join(""));
    }
}