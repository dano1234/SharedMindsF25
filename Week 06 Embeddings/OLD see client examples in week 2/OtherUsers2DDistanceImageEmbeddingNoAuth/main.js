import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, off, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

let others = {};
let me;
let myKey;
let db;
let app;
const replicateProxy = "https://replicate-api-proxy.glitch.me";
let exampleName = "2DImageEmbeddingDistancesNoAuth";
let user = prompt("Please enter your name", "Smarty Pants"); //cheap auth
initFirebase();


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
        let otherName = document.createElement("p");
        otherName.innerHTML = other.userName;
        otherName.style.zIndex = 100;
        otherName.style.position = "absolute";
        otherName.style.top = 0;
        otherName.style.left = 0;
        otherName.style.color = "white";
        otherDiv.appendChild(otherName);
        let otherPrompt = document.createElement("p");
        otherPrompt.style.fontSize = 10 + 10 * (other.normalizedDistance) + "px";
        otherPrompt.style.color = "white";

        otherPrompt.zIndex = 100;
        otherPrompt.style.position = "absolute";
        otherPrompt.style.top = 20;
        otherPrompt.style.left = 0;
        otherPrompt.innerHTML = other.prompt;
        otherDiv.appendChild(otherPrompt);

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
        other.distance = cosineSimilarity(me.imageEmbedding, other.imageEmbedding);
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


async function askForImageEmbedding(prompt, base64) {
    let justBase64 = base64.split(",")[1];
    const data = {
        "version": "0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304",
        "fieldToConvertBase64ToURL": "input",
        "fileFormat": "png",
        // "version": "75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a",
        "input": {
            "input": justBase64,
            "modality": "vision"
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
        console.log("image embedding", replicateJSON.output);
        feedback.innerHTML = "";
        console.log("embedding", replicateJSON.output);

        console.log("user", user);

        setDataInFirebase(exampleName, { userName: user, prompt: prompt, base64: base64, imageEmbedding: replicateJSON.output });
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
            askForImageEmbedding(prompt, base64);
        }
        localImage.src = imageURL;

    }
}


//////////////FIREBASE/////////



function initFirebase() {
    const firebaseConfig = {
        apiKey: "AIzaSyDHOrU4Lrtlmk-Af2svvlP8RiGsGvBLb_Q",
        authDomain: "sharedmindss24.firebaseapp.com",
        databaseURL: "https://sharedmindss24-default-rtdb.firebaseio.com",
        projectId: "sharedmindss24",
        storageBucket: "sharedmindss24.appspot.com",
        messagingSenderId: "1039430447930",
        appId: "1:1039430447930:web:edf98d7d993c21017ad603"
    };
    app = initializeApp(firebaseConfig);
    //make a folder in your firebase for this example
    db = getDatabase();
    const usersRef = ref(db, exampleName + '/');
    onValue(usersRef, (snapshot) => {
        let users = snapshot.val();
        for (let key in users) {
            if (users[key].userName === user) {
                me = users[key];
                myKey = key;
                renderOthers();
                break;
            }
        }
    });
    subscribeToData(exampleName);
}


function subscribeToData(folder, callback) {
    //get callbacks when there are changes either by you locally or others remotely
    const commentsRef = ref(db, folder + '/');
    onChildAdded(commentsRef, (FBdata) => {
        let data = FBdata.val();
        let key = FBdata.key;
        if (key == myKey) {
            document.getElementById("inputText").value = data.prompt;
            let localImage = document.getElementById("outputImage");
            localImage.src = data.base64;
            me = data;
            renderOthers();
        } else {
            others[key] = data;
            renderOthers();
        };
    });
    onChildChanged(commentsRef, (FBdata) => {
        let data = FBdata.val();
        let key = FBdata.key;
        if (key == myKey) {
            document.getElementById("inputText").value = data.prompt;
            let localImage = document.getElementById("outputImage");
            localImage.src = data.base64;
            me = data;
            renderOthers();
        } else {
            others[key] = data;
            renderOthers();
        }
    });
    onChildRemoved(commentsRef, (FBdata) => {
        let data = FBdata.val();
        let key = FBdata.key;
        console.log("removed from FB", data, key);

    });
}




function setDataInFirebase(folder, data) {
    //firebase will supply the key,  this will trigger "onChildAdded" below
    if (myKey) {
        const dbRef = ref(db, folder + '/' + myKey);
        console.log("updating", myKey);
        update(dbRef, data);
    } else {
        //if it doesn't exist, it adds (pushes) and collect the key for later updates
        const dbRef = ref(db, folder + '/');
        myKey = push(dbRef, data).key;
    }
}