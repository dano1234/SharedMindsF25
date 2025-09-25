// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, off, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import { getAuth, setPersistence, browserSessionPersistence, signOut, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js"


let db, auth, app;
let googleAuthProvider;


export function getUser() {
    return auth.currentUser;
}

export function initFirebase(callback) {
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
    auth = getAuth();
    setPersistence(auth, browserSessionPersistence)
    googleAuthProvider = new GoogleAuthProvider();
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user
            const uid = user.uid;
            console.log("userino is signed in", user);
            showLogOutButton(user);
            callback(user);
        } else {
            console.log("userino is signed out");
            showLoginButtons();
            callback(null);
        }
    });
    return auth.currentUser;
}


export function addNewThingToFirebase(folder, data) {
    //firebase will supply the key,  this will trigger "onChildAdded" below
    const dbRef = ref(db, folder);
    const newKey = push(dbRef, data).key;
    return newKey; //useful for later updating
}

export function updateJSONFieldInFirebase(folder, key, data) {
    console.log(folder + '/' + key)
    const dbRef = ref(db, folder + '/' + key);
    update(dbRef, data);
}

export function deleteFromFirebase(folder, key) {
    console.log("deleting", folder + '/' + key);
    const dbRef = ref(db, folder + '/' + key);
    set(dbRef, null);
}

export function subscribeToData(folder, callback) {
    //get callbacks when there are changes either by you locally or others remotely
    const commentsRef = ref(db, folder + '/');
    onChildAdded(commentsRef, (data) => {
        callback("added", data.val(), data.key);
        //reactToFirebase("added", data.val(), data.key);
    });
    onChildChanged(commentsRef, (data) => {
        callback("changed", data.val(), data.key);
        //reactToFirebase("changed", data.val(), data.key)
    });
    onChildRemoved(commentsRef, (data) => {
        callback("removed", data.val(), data.key);
        //reactToFirebase("removed", data.val(), data.key)
    });
}

export function unSubscribeToData(folder) {
    const oldRef = ref(db, folder + '/');
    console.log("unsubscribing from", folder, oldRef);
    off(oldRef);
}


export function setDataInFirebase(dbPath, data) {
    //if it doesn't exist, it adds (pushes) with you providing the key
    //if it does exist, it overwrites
    const dbRef = ref(db, dbPath)
    set(dbRef, data);
}


function showLoginButtons() {
    document.getElementById("login").style.display = "block";
    document.getElementById("logout").style.display = "none";
}

function showLogOutButton(user) {
    document.getElementById("logout").style.display = "block";
    document.getElementById("login").style.display = "none";
    let userNameDiv = document.getElementById("userName");
    if (user.photoURL) {
        console.log("photo url", user.photoURL);
        let userPic = document.getElementById("userPic");
        userPic.src = user.photoURL;
    }
    if (user.displayName) {
        userNameDiv.innerHTML = user.displayName;
    } else {
        userNameDiv.innerHTML = user.email;
    }
}



document.getElementById("signInWithGoogle").addEventListener("click", function () {
    signInWithPopup(auth, googleAuthProvider)
        .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            const user = result.user;
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = error.customData.email;
            const credential = GoogleAuthProvider.credentialFromError(error);
        });
});

document.getElementById("logoutButton").addEventListener("click", function () {
    signOut(auth).then(() => {
        console.log("signed out");
    }).catch((error) => {
        console.log("error signing out");
    });
});

document.getElementById("signInWithEmail").addEventListener("click", function (event) {

    console.log("signing in with email");
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("signed in");
            const user = userCredential.user;
            //wait for auth change callback to show the user
        })
        .catch((error) => {
            console.log("error signing in");
            const errorCode = error.code;
            const errorMessage = error.message;
        });
});


document.getElementById("signUpWithEmail").addEventListener("click", function () {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log(user);
            //wait for auth change callback to show the user
        })
        .catch((error) => {
            console.log("error signing up");
            const errorCode = error.code;
            const errorMessage = error.message;
        });
});





