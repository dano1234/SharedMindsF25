// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAvM1vaJ3vcnfycLFeb8RDrTN7O2ToEWzk",
    authDomain: "shared-minds.firebaseapp.com",
    databaseURL: "https://shared-minds-default-rtdb.firebaseio.com",
    projectId: "shared-minds",
    storageBucket: "shared-minds.appspot.com",
    messagingSenderId: "258871453280",
    appId: "1:258871453280:web:4c103da9b230e982544505",
    measurementId: "G-LN0GNWFZQQ"
};


let group = "mySillyLocalizedMLSoundRoom";
let typeOfThing = "sounds";
let db;

let mySound = {};

/////FIREBASE STUFF
function sendToFirebase(prompt, position, url, soundBufferb64) {


    // let base64Sound = sound.toDataURL();
    //let url = sound;
    let mydata = {
        location: position,
        prompt: prompt,
        url: url,
        soundBufferb64: soundBufferb64,
    };
    if (!mySound.dbKey) {
        //new one
        let placeInDB = group + "/" + typeOfThing + "/";
        let ref = db.ref(placeInDB).push(mydata);
        mySound.dbKey = ref.key;
    } else {
        //update
        let placeInDB = group + "/" + typeOfThing + "/" + mySound.dbKey;
        db.ref(placeInDB).update(mydata);
    }
}

function connectToFirebase() {
    const app = firebase.initializeApp(firebaseConfig);
    db = app.database();

    var myRef = db.ref(group + "/" + typeOfThing + "/");
    myRef.on("child_added", (data) => {
        console.log("add", data.key, data.val());
        let key = data.key;
        let value = data.val();
        load3DSound(key, value);
    });

    myRef.on("child_changed", (data) => {
        console.log("changed" + data.key + data.val());
        let key = data.key;
        let value = data.val();
        load3DSound(key, value);
    });

    myRef.on("child_removed", (data) => {
        console.log("removed");
        kill3DSound(data.key, data.value);
    });
}
