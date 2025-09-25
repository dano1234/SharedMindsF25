import * as FB from './firebaseAuth.js';

let others = {};
let me;
const replicateProxy = "https://replicate-api-proxy.glitch.me";
let exampleName = "2DEmbeddingDistances";

FB.initFirebase(function (user) {
    if (user) {
        document.getElementById("localUser").style.display = "block";
        FB.subscribeToData(exampleName, reactToFirebase);
    } else {
        document.getElementById("localUser").style.display = "none";
    }
});

function reactToFirebase(action, data, key) {
    if (action == "added") {
        if (key == FB.getUser().uid) {
            document.getElementById("inputText").value = data.prompt;
            let localImage = document.getElementById("outputImage");
            localImage.src = data.base64;
            me = data;
            renderOthers();
        } else {
            others[key] = data;
            renderOthers();
        }
    } else if (action == "changed") {
        if (key == FB.getUser().uid) {
            document.getElementById("inputText").value = data.prompt;
            let localImage = document.getElementById("outputImage");
            localImage.src = data.base64;
            me = data;
            renderOthers();
        } else {
            others[key] = data;
            renderOthers();
        }
    } else if (action == "removed") {
        console.log("removed from FB", data, key);
    }
    console.log("others", others);
}

function renderOthers() {

    if (!me) return;
    console.log("renderOthers", others);
    getNormalized2DDistance(me, others);
    let angle = 0;
    let angleStep = 2 * Math.PI / (Object.keys(others).length + 1);;
    for (let key in others) {
        let other = others[key];
        let otherDiv = document.getElementById(key);
        if (!otherDiv) {
            otherDiv = document.createElement("div");
            otherDiv.setAttribute("id", key);
            document.body.appendChild(otherDiv);
        }
        let distance = 200 + (1 - other.normalizedDistance) * 200;
        let x = distance * Math.cos(angle);
        let y = distance * Math.sin(angle);
        //console.log("x,y", x, y, angle);
        angle += angleStep;
        otherDiv.style.position = "absolute";
        otherDiv.style.left = (window.innerWidth / 2 + x) + "px";
        otherDiv.style.top = 100 + (window.innerHeight / 2 + y) + "px";
        otherDiv.style.transform = "translate(-50%,-50%)";

        let otherImage = document.createElement("img");
        otherImage.src = other.base64;
        otherDiv.innerHTML = "";
        otherDiv.appendChild(otherImage);
        //  otherDiv.innerHTML = "<p>" + other.userName + "</p><img src='" + other.base64 + "' />";
        otherImage.style.width = 100 + 100 * (other.normalizedDistance) + "px";
        otherImage.style.height = 100 + 100 * (other.normalizedDistance) + "px";
    }


}

function getNormalized2DDistance(me, others) {

    let maxDistance = 0;
    let minDistance = 10000000;
    for (let key in others) {
        let other = others[key];
        console.log("me", me, other);
        other.distance = cosineSimilarity(me.embedding, other.embedding);
        console.log("distance", other.distance);
        if (other.distance > maxDistance) maxDistance = other.distance;
        if (other.distance < minDistance) minDistance = other.distance;
    }
    for (let key in others) {
        let other = others[key];
        other.normalizedDistance = (other.distance - minDistance) / (maxDistance - minDistance);
        console.log("normalizedDistance", other.normalizedDistance);
    }
}

function cosineSimilarity(a, b) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += (a[i] * b[i]);
        magnitudeA += (a[i] * a[i]);
        magnitudeB += (b[i] * b[i]);
    }
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    return dotProduct / (magnitudeA * magnitudeB);
}



let inputField = document.getElementById("inputText");
inputField.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        askForPicture(inputField.value);
    }
});


async function askForEmbedding(prompt, base64) {

    const data = {
        "version": "0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304",
        // "version": "75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a",
        "input": {
            "text_input": prompt,
            "modality": "text"
        },
    };

    // const data = {
    //     "version": "0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304",
    //     "input": {
    //         "input": "https://replicate.delivery/pbxt/IqLXryIoF3aK3loaAUERG2lxnZX8x0yTZ9Nas9JtMxqcgotD/astronaut.png",
    //         "modality": "vision"
    //     },
    // };
    feedback.innerHTML = "Waiting for reply from API...";
    let url = replicateProxy + "/create_n_get/";
    document.body.style.cursor = "progress";
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };
    const raw_response = await fetch(url, options);
    //turn it into json
    const replicateJSON = await raw_response.json();
    document.body.style.cursor = "auto";

    console.log("replicateJSON", replicateJSON);
    if (replicateJSON.output.length == 0) {
        feedback.innerHTML = "Something went wrong, try it again";
    } else {
        feedback.innerHTML = "";
        console.log("embedding", replicateJSON.output);
        let user = FB.getUser();
        console.log("user", user);
        let userName = user.displayName ? user.displayName : user.email.split("@")[0];
        FB.setDataInFirebase(exampleName + "/" + user.uid, { userName: userName, prompt: prompt, base64: base64, embedding: replicateJSON.output });
    }
}

async function askForPicture(prompt) {
    const data = {
        "version": "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
        //"version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input: {
            prompt: prompt,
            seed: 42
        },
    };
    feedback.innerHTML = "Waiting for reply from API...";
    let url = replicateProxy + "/create_n_get/";
    document.body.style.cursor = "progress";
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };
    const raw_response = await fetch(url, options);
    //turn it into json
    const replicateJSON = await raw_response.json();
    document.body.style.cursor = "auto";

    console.log("replicateJSON", replicateJSON);
    if (replicateJSON.output.length == 0) {
        feedback.innerHTML = "Something went wrong, try it again";
    } else {
        feedback.innerHTML = "";
        let imageURL = replicateJSON.output[0];
        let localImage = document.getElementById("outputImage");
        localImage.crossOrigin = "Anonymous";
        localImage.onload = function () {
            console.log("image loaded", localImage);
            let canvas = document.createElement("canvas");
            canvas.width = localImage.width;
            canvas.height = localImage.height;
            let context = canvas.getContext("2d");
            context.drawImage(localImage, 0, 0, localImage.width, localImage.height);
            let base64 = canvas.toDataURL();
            //addImageRemote(base64,prompt);
            askForEmbedding(prompt, base64);
        }
        localImage.src = imageURL;

    }
}

