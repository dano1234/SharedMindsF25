let anchorInput, othersInput, container, canvas;
let all = {};
let anchor;

init();

function init() {
    createInterface();
    resetAndGetEmbeddings(); // Automatically run on load
    animate();
    document.addEventListener('mousedown', handleCanvasClick);
}

function handleCanvasClick(event) {
    const clickX = event.clientX;
    const clickY = event.clientY;

    let clickedKey = null;

    // Check if the click is near any of the words
    for (const key in all) {
        if (all[key] && all[key].x && all[key].y) {
            const wordData = all[key];
            const dist = Math.sqrt((clickX - wordData.x) ** 2 + (clickY - wordData.y) ** 2);

            if (dist < 20) { // 20px radius for clicking
                clickedKey = key;
                break;
            }
        }
    }

    // If a word was clicked and it's not the current anchor, make it the new anchor
    if (clickedKey && clickedKey !== anchor) {
        console.log("New anchor:", clickedKey);

        const oldAnchor = anchor;
        let othersArray = othersInput.value.split(',').map(s => s.trim()).filter(Boolean);

        // Remove the new anchor from the 'others' list
        othersArray = othersArray.filter(o => o !== clickedKey);

        // Add the old anchor to the 'others' list
        if (oldAnchor) {
            othersArray.push(oldAnchor);
        }

        // Update the input fields
        anchorInput.value = clickedKey;
        othersInput.value = othersArray.join(', ');

        // Rerun the whole process
        resetAndGetEmbeddings();
    }
}


function createInterface() {

    // Create a canvas that fills the screen
    canvas = document.createElement('canvas');
    canvas.id = 'myCanvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '-1'; // Put it in the background
    document.body.appendChild(canvas);

    // Create the input container and apply flexbox styling
    const inputContainer = document.createElement('div');
    inputContainer.id = 'input-container';
    inputContainer.style.display = 'flex';
    inputContainer.style.width = '100%';
    document.body.appendChild(inputContainer);

    // Create the anchor input
    anchorInput = document.createElement('input');
    anchorInput.type = 'text';
    anchorInput.id = 'anchorInput';
    anchorInput.placeholder = 'Anchor';
    anchorInput.value = "walking a dog"; // Pre-populate anchor
    anchorInput.style.flex = '1'; // Assign 1 part of the space
    inputContainer.appendChild(anchorInput);

    // Create the others input
    othersInput = document.createElement('input');
    othersInput.type = 'text';
    othersInput.id = 'othersInput';
    othersInput.placeholder = 'Others';
    othersInput.value = "apples, walnuts, jumping jacks, listening to music, eating lunch, kissing your friend, jogging, cat on a leash, smoking a joint"; // Pre-populate others
    othersInput.style.flex = '5'; // Assign 5 parts of the space
    inputContainer.appendChild(othersInput);

    // Add event listeners
    anchorInput.addEventListener('change', resetAndGetEmbeddings);
    othersInput.addEventListener('change', resetAndGetEmbeddings);
    anchorInput.addEventListener('keyup', function (event) {
        if (event.key === 'Enter') {
            resetAndGetEmbeddings();
        }
    });
    othersInput.addEventListener('keyup', function (event) {
        if (event.key === 'Enter') {
            resetAndGetEmbeddings();
        }
    });

    // Create the main container
    container = document.createElement('div');
    container.id = 'container';
    document.body.appendChild(container);
}

function resetAndGetEmbeddings() {
    all = {};
    anchor = anchorInput.value.trim();
    if (anchor) {
        all[anchor] = {}; // Initialize as an object to hold embedding and coordinates
    }

    const others = othersInput.value.trim().split(',').filter(word => word.trim() !== '');
    for (const other of others) {
        const key = other.trim();
        all[key] = {}; // Initialize as an object
    }

    getEmbeddings();
}

async function getEmbeddings() {
    const allKeys = Object.keys(all);
    if (allKeys.length === 0) {
        displayEmbeddings();
        return;
    }

    console.log("Requesting embeddings for:", allKeys);
    container.innerHTML = 'Getting embeddings...';
    document.body.style.cursor = "progress";

    const url = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
    //Get Auth Token from: https://itp-ima-replicate-proxy.web.app/
    let authToken = ""; // <<< PASTE YOUR AUTH TOKEN HERE

    const data = {
        version: "beautyyuyanli/multilingual-e5-large:a06276a89f1a902d5fc225a9ca32b6e8e6292b7f3b136518878da97c458e2bad", // multilingual-e5-large
        input: {
            texts: JSON.stringify(allKeys),
        },
    }

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
    };

    try {
        const raw_response = await fetch(url, options);
        const json_response = await raw_response.json();

        if (json_response.error) {
            throw new Error(json_response.error);
        }

        const embeddings = json_response.output;

        if (!embeddings || embeddings.length !== allKeys.length) {
            throw new Error("Mismatch between number of texts and number of embeddings returned.");
        }

        allKeys.forEach((key, i) => {
            if (all[key]) {
                all[key].embedding = embeddings[i]; // Store the embedding
            }
        });

    } catch (error) {
        console.error("Error fetching embeddings:", error);
        container.innerHTML = `Error: ${error.message}. Make sure you have added your auth token.`;
    } finally {
        document.body.style.cursor = "default";
        displayEmbeddings();
    }
}


function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB) return 0;
    let dotProduct = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
    }
    return dotProduct;
}

function displayEmbeddings() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    container.innerHTML = ''; // Clear the container that held the HTML results

    if (!anchor || !all[anchor] || !all[anchor].embedding) {
        return;
    }

    const anchorEmbedding = all[anchor].embedding;

    // 1. Calculate all similarities first to find the min and max
    const results = [];
    for (const key in all) {
        if (key === anchor) continue;
        if (!all[key] || !all[key].embedding) continue; // Skip if embedding is missing

        const otherEmbedding = all[key].embedding;
        const similarity = cosineSimilarity(anchorEmbedding, otherEmbedding);
        results.push({ key, similarity });
    }

    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';

    // Draw anchor text and store its position
    const anchorX = canvas.width / 2;
    const anchorY = 100;
    ctx.fillText(anchor, anchorX, anchorY);
    all[anchor].x = anchorX;
    all[anchor].y = anchorY;

    if (results.length === 0) {
        return;
    }

    // Find min and max similarity
    const similarities = results.map(r => r.similarity);
    const minSimilarity = Math.min(...similarities);
    const maxSimilarity = Math.max(...similarities);

    const yStart = 150; // Where the drawing of results starts
    const yEnd = canvas.height - 50; // Where it ends
    const yRange = yEnd - yStart;

    // 2. Draw the results, normalizing their position
    for (const result of results) {
        let yPos;

        if (maxSimilarity - minSimilarity === 0) {
            yPos = yStart + yRange / 2;
        } else {
            const normalized = (result.similarity - minSimilarity) / (maxSimilarity - minSimilarity);
            yPos = yStart + (1 - normalized) * yRange;
        }

        const xPos = canvas.width / 2;
        ctx.fillText(result.key, xPos, yPos);

        // Store the coordinates for click detection
        if (all[result.key]) {
            all[result.key].x = xPos;
            all[result.key].y = yPos;
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    // animation logic goes here
    // Note: The main drawing now happens in displayEmbeddings()
}
//okay