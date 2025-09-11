
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

// async function askForPicture(p_prompt) {
//     //const replicateProxy = "https://replicateproxy-tc5vweqxmq-uc.a.run.app/predictions";
//     const replicateProxy = "http://127.0.0.1:5002/itp-ima-replicate-proxy/us-central1/replicateProxy/predictions";


//     let data = {
//         version: "db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
//         //version: "stability-ai/sdxl",
//         input: {
//             prompt: p_prompt,
//         },
//     };

//     let fetchOptions = {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"

//         },
//         body: JSON.stringify(data),
//     };
//     console.log("data", fetchOptions);
//     const picture_info = await fetch(replicateProxy, fetchOptions);
//     const proxy_said = await picture_info.json();
//     console.log("proxy_said", proxy_said);
//     loadImage(proxy_said.output, (incomingImage) => {
//         img = incomingImage;
//     });
// }




async function askForPicture(p_prompt) {
    const replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
    let authToken = "";
    //const replicateProxy = "https://replicateproxy-tc5vweqxmq-uc.a.run.app/create_n_get";
    //const replicateProxy = "http://127.0.0.1:5002/itp-ima-replicate-proxy/us-central1/replicateProxy/create_n_get";

    let data = {
        model: "black-forest-labs/flux-schnell",
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

    feedback.html("Generating ...");
    const response = await fetch(replicateProxy, fetchOptions);
    const prediction = await response.json();
    console.log("do somethign with this", prediction);
    loadImage(prediction.output[0], (incomingImage) => {
        img = incomingImage;
        feedback.html("Image generated!");
    });


}