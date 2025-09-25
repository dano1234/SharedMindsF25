import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, equalTo, query, orderByChild, ref, off, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

let others = {};
let everybody = {};
let me;
let myKey;
let featuredKey;
let db;
let app;
const replicateProxy = "https://replicate-api-proxy.glitch.me";
let exampleName = "2DImageEmbeddingDistancesNoAuth";
let user = prompt("Please enter your name", "Smarty Pants"); //cheap auth
if (user == null) user = new Date().getTime();

initFirebase();
addSearchQuery();
addSelectMenu();

function addSearchQuery() {
    let searchLabel = document.createElement("label");
    searchLabel.setAttribute("for", "search_field");
    searchLabel.innerText = "Search User:";
    searchLabel.style.position = "absolute";
    searchLabel.style.top = "10px";
    searchLabel.style.left = "10px";
    searchLabel.style.zIndex = 100;
    document.body.appendChild(searchLabel);
    let search_field = document.createElement("input");
    search_field.setAttribute("type", "text");
    search_field.setAttribute("id", "searchQuery");
    search_field.style.position = "absolute";
    search_field.style.top = "10px";
    search_field.style.left = "150px";
    search_field.style.zIndex = 100;
    document.body.appendChild(search_field);


    search_field.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {

            let namer = search_field.value;
            console.log("searching for", namer);
            const dbRef = ref(db, exampleName + '/');
            let queryRef = query(dbRef, orderByChild('userName'), equalTo(namer));
            onValue(queryRef, (snapshot) => {
                let users = snapshot.val();
                console.log("search results", users);
                for (let key in users) {
                    featuredKey = key;
                    renderEverybody();
                    break;
                }
                //featuredKey = users[0].key;
                //console.log("search results", featuredKey);
            });
            //  console.log("reply", reply);

        }
    });
}

function addSelectMenu() {

    let selectLabel = document.createElement("label");
    selectLabel.setAttribute("for", "search_field");
    selectLabel.innerText = "Select User:";
    selectLabel.style.position = "absolute";
    selectLabel.style.top = "40px";
    selectLabel.style.left = "10px";
    selectLabel.style.zIndex = 100;
    document.body.appendChild(selectLabel);
    let dropdown = document.createElement("select");
    dropdown.style.position = "absolute";
    dropdown.style.top = "40px";
    dropdown.style.left = "150px";
    document.body.appendChild(dropdown);
    const dbRef = ref(db, exampleName + '/');
    let queryRef = query(dbRef, orderByChild('userName'));
    onValue(queryRef, (snapshot) => {
        let users = snapshot.val();

        for (let key in users) {
            everybody[key] = users[key];
            let option = document.createElement("option");
            option.value = key;
            option.text = users[key].userName;
            dropdown.appendChild(option);
        }
    });
    dropdown.onchange = function () {
        featuredKey = dropdown.value;
        //featuredKey = key;
        console.log("selected", featuredKey);
        renderEverybody();
    }
}


function renderEverybody() {
    let distanceKeysList = {};
    if (!featuredKey) return;
    //put everything else in a array with distance as index
    let featuredVector = everybody[featuredKey].imageEmbedding;
    for (let key in everybody) {
        if (key == featuredKey) continue;
        let thisVector = everybody[key].imageEmbedding;
        let thisDistance = cosineSimilarity(featuredVector, thisVector);
        distanceKeysList[thisDistance] = key;
    }
    //sort the keys (distances) from the distanceKeysList

    let keys = Object.keys(distanceKeysList);
    keys.sort(function (a, b) {
        return b - a;
    }
    );
    //put the featured one on the left
    positionDiv(0, 130, featuredKey);

    //go in order of distance
    for (let i = 0; i < keys.length; i++) {
        let key = distanceKeysList[keys[i]];
        positionDiv(100 + 100 * i, 100 + 130 + (i * 50), key);
    }

}

function positionDiv(x, y, key) {
    let thisPerson = everybody[key];
    let theDiv = document.getElementById(key);
    if (!theDiv) {
        theDiv = document.createElement("div");
        theDiv.setAttribute("id", key);
        document.body.appendChild(theDiv);
    }
    theDiv.style.position = "absolute";
    theDiv.style.left = x + "px";
    theDiv.style.top = y + "px";
    //theDiv.style.transform = "translate(-50%,-50%)";
    let theImage = document.createElement("img");
    theImage.src = thisPerson.base64;
    theDiv.innerHTML = "";
    theDiv.appendChild(theImage);
    let theName = document.createElement("p");
    theName.innerHTML = thisPerson.userName;
    theName.style.zIndex = 100;
    theName.style.position = "absolute";
    theName.style.top = 0;
    theName.style.left = 0;
    theName.style.color = "white";
    theDiv.appendChild(theName);
    let thePrompt = document.createElement("p");
    //thePrompt.style.fontSize = 10 + 10 * (the.normalizedDistance) + "px";
    thePrompt.style.color = "white";

    thePrompt.zIndex = 100;
    thePrompt.style.position = "absolute";
    thePrompt.style.top = 20;
    thePrompt.style.left = 0;
    thePrompt.innerHTML = thisPerson.prompt;
    theDiv.appendChild(thePrompt);


    theImage.style.width = 100 + "px";
    theImage.style.height = 100 + "px";

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
                renderEverybody();
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
        everybody[key] = data;
        renderEverybody();
    });
    onChildChanged(commentsRef, (FBdata) => {
        let data = FBdata.val();
        let key = FBdata.key;
        everybody[key] = data;
        renderEverybody();
    });
    onChildRemoved(commentsRef, (FBdata) => {
        let data = FBdata.val();
        let key = FBdata.key;
        delete everybody[key];
        renderEverybody();
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