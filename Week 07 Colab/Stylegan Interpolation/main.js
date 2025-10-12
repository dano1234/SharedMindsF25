const canvas = document.getElementById('viewport');
const ctx = canvas.getContext('2d');


let images = [];
let latents = [];
let alterEgos = [];
let thumbnailRects = [];
let thumbnailShowAlterEgo = [];
let centerImage = null;
let centerLatents = null;
let objectUrls = [];

const GPUServer = "https://dano.ngrok.dev/";

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - document.querySelector('h1').offsetHeight;
    draw();
}

window.addEventListener('resize', resize);
canvas.addEventListener('click', onCanvasClick);
canvas.addEventListener('dragover', onCanvasDragOver);
canvas.addEventListener('drop', onCanvasDrop);

// Prevent browser from navigating on drop anywhere else
window.addEventListener('dragover', preventWindowDrop);
window.addEventListener('drop', preventWindowDrop);
document.addEventListener('dragover', preventWindowDrop);
document.addEventListener('drop', preventWindowDrop);

function init() {
    let img = new Image()
    images.push(img);
    const which0 = images.length - 1;
    img.onload = () => getAlterEgos(which0);
    img.src = 'Harry.jpg';

    img = new Image()
    images.push(img);
    const which1 = images.length - 1;
    img.onload = () => getAlterEgos(which1);
    img.src = 'trump4.png';


}

async function getAlterEgos(which) {
    console.log('which', which);
    const off = document.createElement('canvas');
    off.width = 512;
    off.height = 512;
    const octx = off.getContext('2d');
    octx.drawImage(images[which], 0, 0, 512, 512);
    console.log('off', images[which]);
    let b64 = off.toDataURL("image/jpeg", 1.0).split(",")[1];
    console.log('b64', b64);
    const result = await latentsFromImage(b64);

    console.log('result', result);
    latents[which] = result.latents;
    const alterEgoB64 = result.b64Image;
    //do I turn alterEgo2 into an image?
    alterEgos[which] = new Image();
    alterEgos[which].src = alterEgoB64;
    alterEgos[which].onload = function () {
        draw();
    };

    console.log('latents', which, latents[which]);
    draw();
}

function onCanvasDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
}

function replaceImageAtIndex(index, src, isObjectUrl) {
    // Revoke previous object URL if any
    if (objectUrls[index]) {
        try { URL.revokeObjectURL(objectUrls[index]); } catch (err) { /* ignore */ }
        objectUrls[index] = null;
    }
    const img = new Image();
    // Helpful for remote URLs if CORS allows
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        images[index] = img;
        thumbnailShowAlterEgo[index] = false;
        // Reset center render so interpolation uses updated inputs
        centerImage = null;
        centerLatents = null;
        getAlterEgos(index);
        draw();
    };
    img.onerror = () => {
        console.warn('Failed to load dropped image');
    };
    if (isObjectUrl) {
        objectUrls[index] = src;
    }
    img.src = src;
}

async function onCanvasDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Determine which thumbnail was targeted
    let targetIndex = -1;
    for (let i = 0; i < thumbnailRects.length; i++) {
        const r = thumbnailRects[i];
        if (!r) continue;
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
            targetIndex = i;
            break;
        }
    }
    if (targetIndex === -1) return; // drop not on a thumbnail

    const dt = e.dataTransfer;
    if (!dt) return;

    // Prefer file drop
    if (dt.files && dt.files.length > 0) {
        const file = dt.files[0];
        if (!file.type || !file.type.startsWith('image/')) return;
        const url = URL.createObjectURL(file);
        replaceImageAtIndex(targetIndex, url, true);
        return;
    }

    // Otherwise try URL drop (from browser)
    const uriList = dt.getData('text/uri-list');
    const text = dt.getData('text/plain');
    const candidate = uriList || text;
    if (candidate && /(\.png|\.jpe?g|\.webp|\.gif|\.bmp)$/i.test(candidate)) {
        replaceImageAtIndex(targetIndex, candidate, false);
    }
}

function preventWindowDrop(e) {
    e.preventDefault();
    e.stopPropagation();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#8ab4f8';
    ctx.font = '16px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
    ctx.fillText('StyleGAN Interpolation - starter scaffold', 16, 32);

    // draw thumbnails halfway down, left and right
    const thumbW = 192;
    const thumbH = 192;
    const y = Math.floor(canvas.height * 0.5);
    // left thumbnail for index 0
    if (images[0] && images[0].complete) {
        const rect0 = { x: 16, y, w: thumbW, h: thumbH };
        thumbnailRects[0] = rect0;
        const img0 = (thumbnailShowAlterEgo[0] && alterEgos[0] && alterEgos[0].complete) ? alterEgos[0] : images[0];
        ctx.drawImage(img0, rect0.x, rect0.y, rect0.w, rect0.h);
    }
    // right thumbnail for index 1
    if (images[1] && images[1].complete) {
        const rect1 = { x: canvas.width - thumbW - 16, y, w: thumbW, h: thumbH };
        thumbnailRects[1] = rect1;
        const img1 = (thumbnailShowAlterEgo[1] && alterEgos[1] && alterEgos[1].complete) ? alterEgos[1] : images[1];
        ctx.drawImage(img1, rect1.x, rect1.y, rect1.w, rect1.h);
    }
    if (centerImage) {
        //draw in the center of the canvas

        //the upper left is in the center of the canvas instead of the center of the image
        const x = canvas.width / 2 - 512 / 2;
        const y = canvas.height / 2 - 512 / 2;
        ctx.drawImage(centerImage, x, y, 512, 512);
    }
}

async function onCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let clickedOnThumbnail = false;
    for (let i = 0; i < thumbnailRects.length; i++) {
        const r = thumbnailRects[i];
        if (!r) continue;
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
            thumbnailShowAlterEgo[i] = !thumbnailShowAlterEgo[i];
            draw();
            clickedOnThumbnail = true;
            break;
        }
    }
    if (!clickedOnThumbnail) {

        if (e.shiftKey) {
            let factor = y / canvas.height * 10 - 5
            console.log('traveling along named dimension', factor, 'age', latents[0]);
            let sendLatents = latents[0];
            if (centerLatents) sendLatents = centerLatents;
            console.log(latents[0], centerLatents);
            const result = await travelAlongNamedDimension(sendLatents, 'age', factor);
            console.log('between named dimension result', result);
            centerImage = new Image();
            centerImage.src = result.b64Image;
            centerImage.onload = function () {
                console.log('between named dimension image loaded');
                draw();
            };
        } else {
            const percent = x / canvas.width;
            const v1 = latents[0];
            const v2 = latents[1];
            const result = await imageFromLatents(v1, v2, percent);
            console.log('between Images result', result);
            centerImage = new Image();
            centerLatents = result.latents;
            centerImage.src = result.b64Image;
            centerImage.onload = function () {
                draw();
            };
        }
    }
}



//projection
async function latentsFromImage(imgBase64) {
    //const base64 = imgBase64.startsWith('data:') ? imgBase64 : `data:image/jpeg;base64,${imgBase64}`;
    //const stripped = base64.split(",")[1];
    const postData = { image: imgBase64 };
    const url = GPUServer + "locateImage/";
    const options = {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify(postData)
    };
    const response = await fetch(url, options);
    const result = await response.json();
    return result;
}

//navigation
async function imageFromLatents(v1, v2, percent) {
    const postData = { v1, v2, percent };
    const url = GPUServer + "getBetween/";
    const options = {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify(postData)
    };
    const response = await fetch(url, options);
    const result = await response.json();
    return result;
}

//named dimensions
async function travelAlongNamedDimension(anchor, namedDimension, percent) {
    const postData = { latents: anchor, direction: namedDimension, factor: percent };
    const url = GPUServer + "latentsToImage/";
    const options = {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify(postData)
    };
    const response = await fetch(url, options);
    const result = await response.json();
    return result;
}


// async function ask(req) {
//     const options = {
//         headers: { "Content-Type": "application/json" },
//         method: "POST",
//         body: JSON.stringify(req.postData)
//     };
//     const response = await fetch(req.url, options);
//     return await response.json();
// }

init();
resize();

