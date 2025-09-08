
let inputLocationX = window.innerWidth / 2;
let inputLocationY = window.innerHeight / 2;
let inputBoxDirectionX = 1;
let inputBoxDirectionY = 1;

let canvasDimension = 1024;
let canvas;
let mask;
let inputBox;

const url = "https://replicate-api-proxy.glitch.me/create_n_get/";
let mouseDown = false;

init();

function init() {

    // Perform initialization logic here
    initInterface();
    // Load Disney.png and paint it on the canvas
    const img = new Image();
    img.onload = function () {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
    };
    img.src = 'Disney.png';

    // askPictures("the disneyland of my life disagrees with my level of hapieness", { x: 0, y: 0 });
    animate();
}

// Animate loop
function animate() {
    // Perform animation logic here
    inputLocationX = inputLocationX + inputBoxDirectionX;
    inputLocationY = inputLocationY + inputBoxDirectionY;
    if (inputLocationX > window.innerWidth || inputLocationX < 0) {
        inputBoxDirectionX = - inputBoxDirectionX;
    }
    if (inputLocationY > window.innerHeight || inputLocationY < 0) {
        inputBoxDirectionY = - inputBoxDirectionY;
    }

    inputBox.style.left = inputLocationX + 'px';
    inputBox.style.top = inputLocationY + 'px';
    requestAnimationFrame(animate);
}



async function askPictures(prompt, location) {
    document.body.style.cursor = "progress";
    let maskBase64 = mask.toDataURL();
    let imageBase64 = canvas.toDataURL();
    const data = {
        version: "8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f",
        //version: "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3",   //stable diffusion
        input: {
            prompt: prompt,
            prompt_strength: 0.8,
            mask: maskBase64,
            image: imageBase64,
        },
    };
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };

    const picture_info = await fetch(url, options);
    console.log("picture_response", picture_info);
    const proxy_said = await picture_info.json();
    console.log("proxy_said", proxy_said);

    if (proxy_said.output.length == 0) {
        console.log("Something went wrong, try it again");
    } else {

        let img = document.createElement("img");
        img.src = proxy_said.output[0];
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = function () {
            let ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
        }


        // document.body.appendChild(img);
        // img.style.position = 'absolute';
        // img.style.left = location.x + 'px';
        // img.style.top = location.y + 'px';
        // img.style.width = '256px';
        // img.style.height = '256px';
        // img.src = proxy_said.output[0];

    }
    document.body.style.cursor = "auto";
    let maskCtx = mask.getContext('2d');
    maskCtx.clearRect(0, 0, mask.width, mask.height);
    inputBoxDirectionX = 1;
    inputBoxDirectionY = 1;
}

//maskCtx.clearRect(0, 0, mask.width, mask.height);


function initInterface() {
    // Get the input box and the canvas element
    canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'myCanvas');
    canvas.style.position = 'absolute';
    canvas.width = canvasDimension;
    canvas.height = canvasDimension;
    canvas.style.left = '0';
    canvas.style.top = '0';
    // canvas.style.width = '100%';
    // canvas.style.height = '100%';
    canvas.style.zIndex = '1';
    document.body.appendChild(canvas);
    console.log('canvas', canvas.width, canvas.height);

    mask = document.createElement('canvas');
    mask.setAttribute('id', 'mask');
    mask.style.position = 'absolute';
    mask.width = canvasDimension;
    mask.height = canvasDimension;
    mask.style.left = '0';
    mask.style.zIndex = '99';
    mask.style.top = '0';
    // mask.style.width = '100%';
    // mask.style.height = '100%';
    document.body.appendChild(mask);



    inputBox = document.createElement('input');
    inputBox.setAttribute('type', 'text');
    inputBox.setAttribute('id', 'inputBox');
    inputBox.setAttribute('placeholder', 'Enter text here');
    inputBox.style.position = 'absolute';
    inputBox.style.left = '50%';
    inputBox.style.top = '50%';
    inputBox.style.transform = 'translate(-50%, -50%)';
    inputBox.style.zIndex = '100';
    inputBox.style.fontSize = '30px';
    inputBox.style.fontFamily = 'Arial';
    document.body.appendChild(inputBox);
    inputBox.setAttribute('autocomplete', 'off');

    // Add event listener to the input box
    inputBox.addEventListener('keydown', function (event) {
        // Check if the Enter key is pressed

        if (event.key === 'Enter') {
            const inputValue = inputBox.value;
            //askWord(inputValue, { x: inputLocationX, y: inputLocationY });
            askPictures(inputValue, { x: inputLocationX, y: inputLocationY });

        }
    });


    // Add event listener to the document for mouse move event
    mask.addEventListener('mousemove', (event) => {
        // Check if the input box is being dragged
        if (mouseDown) {
            let rect = mask.getBoundingClientRect();
            let y = event.clientY - rect.top;
            let x = event.clientX - rect.left;

            //let y = event.clientY;

            let maskCtx = mask.getContext('2d');

            maskCtx.beginPath();
            maskCtx.fillStyle = 'white';

            maskCtx.ellipse(x, y, 10, 10, 0, 0, 2 * Math.PI);
            maskCtx.fill();
            maskCtx.closePath();
            inputLocationX = x;
            inputLocationY = y + 50;
            inputBox.style.left = inputLocationX + 'px';
            inputBox.style.top = inputLocationY + 'px';
            //console.log("Mouse is moving", inputLocationX, inputLocationY);
        }
    });
    mask.addEventListener('mouseup', () => {
        mouseDown = false;
    });
    mask.addEventListener('mousedown', () => {
        mouseDown = true;
        inputBoxDirectionX = 0;
        inputBoxDirectionY = 0;
    });
}



