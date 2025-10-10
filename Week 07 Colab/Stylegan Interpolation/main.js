const canvas = document.getElementById('viewport');
const ctx = canvas.getContext('2d');

init();
resize();
let image1;
let image2;
let latents1;
let latents2;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - document.querySelector('h1').offsetHeight;
    draw();
}

window.addEventListener('resize', resize);

function init() {
    image1 = new Image();
    image2 = new Image();

    image1.onload = function () {
        const off1 = document.createElement('canvas');
        off1.width = 512;
        off1.height = 512;
        const octx1 = off1.getContext('2d');
        octx1.drawImage(image1, 0, 0, 512, 512);
        latents1 = off1.toDataURL("image/jpeg", 1.0);
        draw();
    };

    image2.onload = function () {
        const off2 = document.createElement('canvas');
        off2.width = 512;
        off2.height = 512;
        const octx2 = off2.getContext('2d');
        octx2.drawImage(image2, 0, 0, 512, 512);
        latents2 = off2.toDataURL("image/jpeg", 1.0);
        draw();
    };

    image1.src = 'Harry.jpg';
    image2.src = 'trump4.png';
}
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#8ab4f8';
    ctx.font = '16px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
    ctx.fillText('StyleGAN Interpolation - starter scaffold', 16, 32);
    if (image1 && image1.complete) {
        ctx.drawImage(image1, 16, 56, 512, 512);
    }
    if (image2 && image2.complete) {
        ctx.drawImage(image2, 544, 56, 512, 512);
    }
}



const GPUServer = "https://dano.ngrok.dev/";

//projection
function latentsFromImage(imgBase64) {
    const base64 = imgBase64.startsWith('data:') ? imgBase64 : `data:image/jpeg;base64,${imgBase64}`;
    const stripped = base64.split(",")[1];
    const postData = { image: stripped };
    const url = GPUServer + "locateImage/";
    const request = { postData, url };
    return request;
}

//navigation
function imageFromLatents(v1, v2, percent) {
    const postData = { v1, v2, percent };
    const url = GPUServer + "getBetween/";
    const request = { postData, url };
    return request;
}

//named dimensions
function travelAlongNamedDimension(anchor, namedDimension, percent) {
    const postData = { latents: anchor, direction: namedDimension, factor: percent };
    const url = GPUServer + "latentsToImage/";
    const request = { postData, url };
    return request;
}


async function ask(req) {
    const options = {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify(req.postData)
    };
    const response = await fetch(req.url, options);
    return await response.json();
}

