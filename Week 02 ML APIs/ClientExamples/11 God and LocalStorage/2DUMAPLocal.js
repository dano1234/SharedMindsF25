import { UMAP } from "https://cdn.skypack.dev/umap-js";

let canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.position = "absolute";
canvas.style.left = "0px";
canvas.style.top = "0px";
document.body.append(canvas);
let ctx = canvas.getContext('2d');

//can you create a feedback div
let feedback = document.createElement('div');
feedback.style.position = "absolute";
feedback.style.left = "50%";
feedback.style.top = "50%";
feedback.style.transform = "translate(-50%,-50%)";
feedback.style.width = "350px";
feedback.style.backgroundColor = "rgba(255,255,255,.5)";
feedback.style.padding = "10px";
feedback.style.borderRadius = "5px";
feedback.style.zIndex = "1000";
document.body.append(feedback);



let createUniverseField = document.createElement('input');
createUniverseField.type = "text";
createUniverseField.style.position = "absolute";
createUniverseField.style.left = "80%";
createUniverseField.style.top = "90%";
createUniverseField.style.transform = "translate(-50%,-50%)";
createUniverseField.style.width = "350px";
createUniverseField.id = "createUniverse";
createUniverseField.placeholder = "Enter a concept and press Enter to create a universe";
document.body.append(createUniverseField);
createUniverseField.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        let universalMotto = createUniverseField.value;
        console.log("create universe", universalMotto);
        createUniverse(universalMotto);
    }
});

init();

function init() {

    let localInfo = localStorage.getItem("embeddings");
    console.log("localInfo", localInfo);
    if (localInfo) {
        let allInfo = JSON.parse(localInfo);
        runUMAP(allInfo);
    }
    else {
        console.log("no localembeddings");
    }
}

function placeSentence(sentence, fitting, type) {
    console.log("placeSentence", sentence, fitting);
    // ctx.font = "20px Arial";
    // ctx.fillStyle = "rgba(100,100,100,127)";
    // let w = ctx.measureText(sentence).width;
    // console.log(canvas.width, canvas.height, fitting[0] * canvas.width, fitting[1] * canvas.height);
    // ctx.fillText(sentence, (fitting[0] * canvas.width) - w / 2, (fitting[1] * canvas.height) + 30);

    //or use DOM elements
    let sentenceDiv = document.createElement('div');
    sentenceDiv.style.position = "absolute";
    sentenceDiv.style.left = fitting[0] * window.innerWidth + "px";
    sentenceDiv.style.top = fitting[1] * window.innerHeight + "px";
    sentenceDiv.style.transform = "translate(-100%,-50%)";
    sentenceDiv.style.width = "100px";
    sentenceDiv.style.backgroundColor = "rgba(255,255,255,.5)";
    sentenceDiv.innerHTML = sentence;
    document.body.append(sentenceDiv);
}

async function createUniverse(universalMotto) {
    document.body.style.cursor = "progress";
    const replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
    //Get Auth Token from: https://itp-ima-replicate-proxy.web.app/
    //  const authToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjA1NTc3MjZmYWIxMjMxZmEyZGNjNTcyMWExMDgzZGE2ODBjNGE3M2YiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRGFuIE8nU3VsbGl2YW4iLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSmhrcTc0NjBZNzNWSWNTdk9QdlVhYnJhVmdmS2RHTENnMWJkTHlNaDdwTDc1LVJtUno9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaXRwLWltYS1yZXBsaWNhdGUtcHJveHkiLCJhdWQiOiJpdHAtaW1hLXJlcGxpY2F0ZS1wcm94eSIsImF1dGhfdGltZSI6MTc1ODY0OTY3NCwidXNlcl9pZCI6IkN0VDlRc2ZySnFQc3doR29zTDZ6QWEyVFhTWTIiLCJzdWIiOiJDdFQ5UXNmckpxUHN3aEdvc0w2ekFhMlRYU1kyIiwiaWF0IjoxNzU4NjQ5Njc0LCJleHAiOjE3NTg2NTMyNzQsImVtYWlsIjoiZGJvM0BueXUuZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDA5Njk1NjkyMjY5NDIyMjQ0NjciXSwiZW1haWwiOlsiZGJvM0BueXUuZWR1Il19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.Rqlmpkdqe1BNeQ4OlaMeT-16Js-UqC4pyUJ02h_pHTqgNDiHBIJ7hYrLV8aSWjE-erK2KijD014tXcCbOmripXmhXzkKzDiKdYDSzi-HglTP9OA8O3BoTe5le3zXs0qYhaowAbiNnzmpCmOq2PAmookA4Jufon0ar80RlOilEWq2zcohwvNMAS58zJVlyztSJPIMTromUZL4XQ0H0QULdujOVELFtyYI_MOF-flU_QhYtui31GfvxC0nG2CfLBETejrrAPRqkUAAQF3SlYDMiln0tX1jA3KpSygmd0tKVfC7kVYua0r8CElUDyBXLC7L5oluEbDrcWSiDR-SLYmitQ";
    const authToken = "";
    let text = "give me a flat json object with 36 short descriptions of perspectives with about the topic of " + universalMotto + " organized into 6 different types of people who might have that diverse and differing perspectives.  Please only use the fields description and type.";
    // // feedback.html("Waiting for reply from OpenAi...");

    ///////////GET SENTENCES
    //I want to give feedback as to our progress
    feedback.innerHTML = "Waiting for AI to make up some perspectives";
    const data = {
        model: "openai/gpt-5-structured",
        input: {
            prompt: text,
            system_prompt: "in the output, disregard the type and return just the descriptions",

        }
    };
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
    };

    console.log("words options", options);
    const response = await fetch(replicateProxy, options);
    const response_json = await response.json()
    console.log("response_json", response_json);
    const list = response_json.output.json_output;
    console.log("list", list);
    let justDescriptions = [];
    let justTypes = [];
    feedback.innerHTML = "Got " + list.length + "perspectives, waiting for AI embedding for the perspectives";
    for (let i = 0; i < list.length; i++) {
        let thisDescription = list[i].description;
        let thisType = list[i].type;
        justTypes.push(thisType);
        justDescriptions.push(thisDescription);
    }
    console.log("justDescriptions", justDescriptions);
    const data2 = {
        version: "beautyyuyanli/multilingual-e5-large:a06276a89f1a902d5fc225a9ca32b6e8e6292b7f3b136518878da97c458e2bad", // multilingual-e5-large
        input: {
            texts: JSON.stringify(justDescriptions),
        },
    }
    console.log("data2", data2);
    const options2 = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(data2),
    };

    const response2 = await fetch(replicateProxy, options2);
    const response_json2 = await response2.json();
    console.log("response_json2", response_json2.output);
    let justEmbeddings = response_json2.output;
    //it says .thml is not function.  what should it be?
    feedback.innerHTML = "Got " + justEmbeddings.length + " embeddings, running UMAP";

    let allInfo = { embeddings: justEmbeddings, types: justTypes, descriptions: justDescriptions };

    localStorage.setItem("embeddings", JSON.stringify(allInfo));
    runUMAP(allInfo)
    document.body.style.cursor = "default";
}



function runUMAP(allInfo) {

    //comes back with a list of embeddings and Sentences, single out the embeddings for UMAP

    let embeddings = allInfo.embeddings;

    //let fittings = runUMAP(embeddings);
    var myrng = new Math.seedrandom('hello.');
    let umap = new UMAP({
        nNeighbors: 6,
        minDist: 0.1,
        nComponents: 2,
        random: myrng,  //special library seeded random so it is the same randome numbers every time
        spread: 0.99,
        // distanceFn: 'cosine',
    });
    let fittings = umap.fit(embeddings);
    fittings = normalize(fittings);  //normalize to 0-1
    for (let i = 0; i < allInfo.descriptions.length; i++) {
        placeSentence(allInfo.descriptions[i], fittings[i], allInfo.types[i]);
    }
    //console.log("fitting", fitting);
}



function normalize(arrayOfNumbers) {
    //find max and min in the array
    let max = [0, 0];
    let min = [0, 0];
    for (let i = 0; i < arrayOfNumbers.length; i++) {
        for (let j = 0; j < 2; j++) {
            if (arrayOfNumbers[i][j] > max[j]) {
                max[j] = arrayOfNumbers[i][j];
            }
            if (arrayOfNumbers[i][j] < min[j]) {
                min[j] = arrayOfNumbers[i][j];
            }
        }
    }
    //normalize
    for (let i = 0; i < arrayOfNumbers.length; i++) {
        for (let j = 0; j < 2; j++) {
            arrayOfNumbers[i][j] = (arrayOfNumbers[i][j] - min[j]) / (max[j] - min[j]);
        }
    }
    return arrayOfNumbers;
}