let trumpImage;
let harrisImage;
let maskGraphics;
let masked = false;
let video;
let people = [];
let fakePeople = [];
let readyForRequest = true;
let whoseTurn = 0;
const GPUServer = "https://dano.ngrok.dev/";
let flipGraphics;
let globalPoses = [];
let searchingTextImage;
let delayBetweenRequests = 200;




let bodyPoseOptions = {
    modelType: "MULTIPOSE_LIGHTNING", // "MULTIPOSE_LIGHTNING", "SINGLEPOSE_LIGHTNING", or "SINGLEPOSE_THUNDE"
    enableSmoothing: false,
    minPoseScore: 0.2,
    multiPoseMaxDimension: 256,
    enableTracking: true,
    trackerType: "boundingBox", // "keypoint" or "boundingBox"
    trackerConfig: {},
    modelUrl: undefined,
    flipped: false,
}

function preload() {
    trumpImage = loadImage("trump4.png");
    harrisImage = loadImage("harris.png");
    searchingTextImage = loadImage("searching.png");
    bodyPose = ml5.bodyPose(bodyPoseOptions);

}

function setup() {
    //createCanvas(640, 480);
    createCanvas(1280, 720);
    flipGraphics = createGraphics(width, height);
    trump = new Person(trumpImage, "Trump", width - 150, height / 4)
    harris = new Person(harrisImage, "Harris", -50, height / 4)
    let req = trump.decideOnRequest();
    trump.ask(req);
    req = harris.decideOnRequest();
    harris.ask(req);
    fakePeople.push(trump);
    fakePeople.push(harris);
    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();

    bodyPose.detectStart(video, bodyPoseVideoResults);
}

function draw() {

    flipGraphics.background(255);
    flipGraphics.tint(255, 40);
    flipGraphics.image(video, 0, 0, width, height);
    //background(255, 255, 255, 50);
    flipGraphics.tint(255, 255);
    doTurnTaking();

    for (let person of people) {
        person.drawMe();
    }
    if (people.length < 2) {
        for (let fakePerson of fakePeople) {
            fakePerson.drawMe();
        }
    }

    //debugging
    // for (let poseNum = 0; poseNum < globalPoses.length; poseNum++) {
    //     let thisPose = globalPoses[poseNum];
    //     flipGraphics.fill(0, 255, 0);
    //     flipGraphics.ellipse(thisPose.nose.x, thisPose.nose.y, 50, 50);
    // }
    push();
    scale(-1, 1);
    image(flipGraphics, -width, 0);
    pop();
    // if (people.length > 0) {
    //     let thisPerson = people[0];
    //     if (thisPerson.imageWithoutMask) {
    //         let thisImage = thisPerson.imageWithoutMask;
    //         image(thisImage, 0, 0);
    //         text(thisImage.width + " " + thisImage.height, 10, 10);
    //     }
    // }
}

async function doTurnTaking() {
    if (readyForRequest && people.length > 0) {
        whoseTurn++;
        if (whoseTurn >= people.length) {
            whoseTurn = 0;
        }

        let currentPerson = people[whoseTurn];
        let postData = currentPerson.decideOnRequest();
        if (postData) {

            currentPerson.ask(postData)

        }

    }
}


function bodyPoseVideoResults(poses) {
    globalPoses = poses;
    //make a new person if there is a new person posing
    for (let i = people.length - 1; i > - 1; i--) {
        thisPerson = people[i];
        // console.log(thisPerson.isNotUpdating());
        if (thisPerson.isNotUpdating()) {
            people.splice(i, 1);
            console.log("removing person");
        }
    }
    if (poses.length > people.length) {
        let person = new Person(null, null, -9000, -9000);

        people.push(person);
    }
    // else if (poses.length < people.length) {
    //     //remove a person if there has not been a pose for a while
    //     for (let i = people.length - 1; i > people.length - 1; i--) {
    //         thisPerson = people[i];
    //         if (thisPerson.isNotUpdating()) {
    //             people.splice(i, 1);
    //             console.log("removing person");
    //         }
    //     }
    // }

    matchPosesToPeople(poses);

    //bodyPose.detect(video, bodyPoseVideoResults);

}


function matchPosesToPeople(poses) {

    for (let person of people) {
        person.matched = false;
    }
    let sliceAblePoses = poses.slice();
    for (let person of people) {
        //don't reuse a person
        //if (person.matched) continue;
        let closestPose;
        let closestDistance = Infinity;
        let winningPosNum;

        for (let poseNum = sliceAblePoses.length - 1; poseNum > -1; poseNum--) {
            let thisPose = sliceAblePoses[poseNum];
            if (!thisPose) continue;  //why is this neccessary?
            // let thisFrameRect = getRect(thisPose);


            let distance = dist(person.underFrameRect.cx, person.underFrameRect.cy, thisPose.nose.x, thisPose.nose.y);
            if (distance < closestDistance) {
                closestPose = thisPose;
                closestDistance = distance;
                winningPosNum = poseNum;
            }
        }
        if (!closestPose) continue;
        let thisFrameRect = getRect(closestPose);
        person.getCropMaskUnderImage(thisFrameRect, video, winningPosNum);
        person.lastPos = closestPose;
        sliceAblePoses.splice(winningPosNum, 1);
        //if (closestPerson) {
        //set this person as used
        //closestPerson.matched = true;

        // closestPerson.getCropMaskUnderImage(thisFrameRect, video, poseNum);
        //}
    }
}

function getRect(pose) {
    let rightEarX = pose.right_ear.x;
    let rightEarY = pose.right_ear.y;
    let leftEarX = pose.left_ear.x;
    let leftEarY = pose.left_ear.y;
    let centerX = pose.nose.x;
    let centerY = pose.nose.y;
    let wDiff = rightEarX - leftEarX;
    let hDiff = rightEarY - leftEarY;
    let faceWidth = int(Math.sqrt(wDiff * wDiff + hDiff * hDiff));

    let top = int(centerY - faceWidth / 2);
    let left = int(centerX - faceWidth / 2);
    let headAngle = Math.atan2(hDiff, wDiff) + PI;

    let faceRect = { left: left, top: top, width: faceWidth, height: faceWidth };
    //do I nee faceRect?  //maybe for inserting face into a face
    const border = faceWidth / 4;
    let frameRect = { border: border, faceRect: faceRect, left: left - border, top: top - border, width: faceWidth + border * 2, height: faceWidth + border * 2, cx: pose.nose.x, cy: pose.nose.y, headAngle: headAngle };
    return frameRect;
}

function readyForRequestFunction() {
    readyForRequest = true;
}

function gradientMaskIt(inputImg, outputImg) {
    outputImg = inputImg.get();
    maskGraphics = createGraphics(inputImg.width, inputImg.height);
    maskGraphics.noStroke();
    //maskGraphics.clear(0, 0, inputImg.width, inputImg.height);
    //maskGraphics.angleMode(DEGREES);

    const sX = maskGraphics.width / 2;
    const sY = maskGraphics.height / 2;
    const sR = maskGraphics.width / 5;
    const eX = maskGraphics.width / 2;
    const eY = maskGraphics.height / 2;
    const eR = maskGraphics.height / 2;
    const colorS = color(0, 0, 0, 220); //Start color
    const colorE = color(255, 255, 255, 0); //End color
    let gradient = maskGraphics.drawingContext.createRadialGradient(
        sX,
        sY,
        sR,
        eX,
        eY,
        eR
    );
    gradient.addColorStop(0, colorS);
    gradient.addColorStop(1, colorE);
    maskGraphics.drawingContext.fillStyle = gradient;
    //maskGraphics.ellipse(maskGraphics.width / 2, maskGraphics.height / 2, maskGraphics.width, maskGraphics.height);
    maskGraphics.ellipseMode(CENTER);
    maskGraphics.ellipse(maskGraphics.width / 2, maskGraphics.height / 2, maskGraphics.width - 50, maskGraphics.height + 50);
    // maskGraphics.stroke(0, 244, 0);
    maskGraphics.noStroke();
    //maskGraphics.rect(0, 0, maskGraphics.width, maskGraphics.height);
    outputImg.mask(maskGraphics);
    maskGraphics.remove();
    return outputImg;
}

class Person {
    constructor(image, name, x, y) {
        this.name = name;
        this.raisingHands = { left: { raised: false, amount: 0, direction: "age" }, right: { raised: false, amount: 0, direction: "smile" } };
        this.lastPos = null;
        this.underImage = null;
        this.imageWithoutMask = null;
        this.alterEgoImage = null;
        this.latents = null;
        this.underFrameRect = { left: x, top: y, width: 0, height: 0, cx: x, cy: y, headAngle: 0 };
        this.alterEgoFrameRect = null;
        this.lastUpdate = millis();
        this.closestPerson = null;
        this.lastFrameRect = null;
        if (this.name) {
            this.imageWithoutMask = image;
            this.underImage = image;
            this.underFrameRect = { left: 0, top: 0, width: image.width, height: image.height, cx: x, cy: y, headAngle: 0 };
            this.underImage = gradientMaskIt(this.imageWithoutMask, this.underImage);//better way to get an image from a p5.Graphics?
            this.poseNum = -1;
            this.underFrameRect = { border: 0, left: x, top: y, width: image.width / 2, height: image.height / 2, cx: x + image.width / 4, cy: y + image.height / 4, headAngle: 0 };
        }

    }

    decideOnRequest() {
        let closest = this.findClosestPerson();
        let postData;
        let url;
        let request;
        if (this.lastPos) this.checkForRaisingHands(this.lastPos);
        if (this.name) {
            //console.log("this is a static person, just locate self");
            if (!this.imageWithoutMask) return null;
            this.imageWithoutMask.resize(256, 256);
            let imgBase64 = this.imageWithoutMask.canvas.toDataURL("image/jpeg", 1.0);
            imgBase64 = imgBase64.split(",")[1];

            postData = {
                image: imgBase64,
            };
            url = GPUServer + "locateImage/";
            request = { postData: postData, url: url };

        } else if (!this.latents) {
            // console.log("no latents locate self");
            if (!this.imageWithoutMask) return null;
            let imgBase64 = this.imageWithoutMask.canvas.toDataURL("image/jpeg", 1.0);
            imgBase64 = imgBase64.split(",")[1];
            postData = {
                image: imgBase64,
            };
            url = GPUServer + "locateImage/";
            request = { postData: postData, url: url };


        } else if (this.raisingHands.left.raised == true && this.latents) {

            postData = {
                latents: this.latents,
                direction: this.raisingHands.left.direction,
                factor: this.raisingHands.left.amount,
            };
            //console.log("someone is raising hands", postData);
            url = GPUServer + "latentsToImage/";
            request = { postData: postData, url: url };
        } else if (this.raisingHands.right.raised == true && this.latents) {

            postData = {
                latents: this.latents,
                direction: this.raisingHands.right.direction,
                factor: this.raisingHands.right.amount,
            };
            //console.log("someone is raising hands", postData);
            url = GPUServer + "latentsToImage/";
            request = { postData: postData, url: url };
        } else if (closest.distance < width / 2.5 && closest.person.latents && this.latents) {

            if (!this.latents) return null;
            this.closestPerson = closest.person;
            let percent = Math.min(0.9, Math.max(0.1, 1 - 3 * (Math.abs(closest.distance / width)))); //).toFixed(2);
            // console.log(percent + "someone close enough,find inbetween" + closest.person.name + " num " + closest.person.poseNum);

            postData = {
                v1: this.latents,
                v2: this.closestPerson.latents,
                percent: percent,
            };

            url = GPUServer + "getBetween/";
            request = { postData: postData, url: url };

        } else {
            // console.log("no one close enough, just locate self");
            if (!this.imageWithoutMask) return null;
            let imgBase64 = this.imageWithoutMask.canvas.toDataURL("image/jpeg", 1.0);
            imgBase64 = imgBase64.split(",")[1];
            postData = {
                image: imgBase64,
            };
            url = GPUServer + "locateImage/";
            request = { postData: postData, url: url };

        }

        return request;
    }



    checkForRaisingHands(pose) {
        //console.log("CONFIDENCE", pose.right_wrist.confidence, pose.left_wrist.confidence);

        let leftDiff = pose.nose.y - pose.left_wrist.y; //pose.left_wrist.y;
        let rightDiff = pose.nose.y - pose.right_wrist.y; //pose.right_wrist.y;
        //console.log("leftDiff", leftDiff, "rightDiff", rightDiff);
        if (rightDiff > 10) {
            let amount = min(5, this.raisingHands.right.amount + 1);
            this.raisingHands.right.raised = true;
            this.raisingHands.right.amount = amount;
            // let amount = 5 - 1 + int(5 * (pose.right_shoulder.y - pose.right_wrist.y) / (pose.right_shoulder.y))
            // this.raisingHands = {};
            // this.raisingHands.direction = "age";
            // this.raisingHands.factor = amount;

        } else {
            this.raisingHands.right.amount = max(0, this.raisingHands.right.amount - 1);
            if (this.raisingHands.right.amount == 0) this.raisingHands.right.raised = false;
        }
        if (leftDiff > 10) {
            let amount = min(5, this.raisingHands.left.amount + 1);
            this.raisingHands.left.raised = true;
            this.raisingHands.left.amount = amount;
            //let amount = 5 - 1 + int(5 * (pose.left_shoulder.y - pose.left_wrist.y) / (pose.left_shoulder.y))
            // let amount = 5 - Math.min(5, Math.max(0, int(5 * pose.left_wrist.y / pose.left_shoulder.y)));
            // this.raisingHands = {};
            // this.raisingHands.direction = "smile";
            // this.raisingHands.factor = amount;
        } else {
            this.raisingHands.left.amount = max(0, this.raisingHands.left.amount - 1);
            if (this.raisingHands.left.amount == 0) this.raisingHands.left.raised = false;
        }
        // raisingHands = { side: "both", direction: "up" };
        //if (ransingHands.side = "left") factor = "age";
        //else factor = "smile";
    }


    async ask(req) {
        const options = {
            headers: {
                "Content-Type": `application/json`,
            },
            method: "POST",
            body: JSON.stringify(req.postData), //p)
        };

        try {
            readyForRequest = false

            const response = await fetch(req.url, options)
            //console.log("response", response);

            const result = await response.json();
            setTimeout(readyForRequestFunction, delayBetweenRequests);

            if (!result.error) {
                let currentPerson = this;
                if (result.latents)
                    currentPerson.latents = result.latents;
                setTimeout(readyForRequestFunction, delayBetweenRequests);

                loadImage(result.b64Image, async function (newImage,) {
                    currentPerson.dealWithImageFromAI(newImage);
                });
            } else {
                //console.log("Error in colab");
                setTimeout(readyForRequestFunction, delayBetweenRequests);

                return;
            }
        } catch (e) {
            setTimeout(readyForRequestFunction, delayBetweenRequests);
            console.log("error locating face in AI");
        }

    }




    getCropMaskUnderImage(frameRect, incomingImage, poseNum) {

        this.lastUpdate = millis();
        this.underFrameRect = frameRect;
        this.imageWithoutMask = incomingImage.get(frameRect.left, frameRect.top, frameRect.width, frameRect.height);
        this.underImage = gradientMaskIt(this.imageWithoutMask, this.underImage);//better way to get an image from a p5.Graphics?
        this.poseNum = poseNum;
    }

    async dealWithImageFromAI(newImage) {
        this.alterEgoImage = gradientMaskIt(newImage, this.alterEgoImage);//better way to get an image from a p5.Graphics?
    }

    isNotUpdating() {
        return (millis() - this.lastUpdate) > 2000;
    }


    findClosestPerson() {
        let whichArray = people;
        if (people.length < 2) whichArray = fakePeople;
        let closestPerson;
        let closestDistance = Infinity;
        for (let i = 0; i < whichArray.length; i++) {

            let person = whichArray[i];
            if (person == this) continue;
            let distance = dist(this.underFrameRect.cx, this.underFrameRect.cy, person.underFrameRect.cx, person.underFrameRect.cy);
            if (distance < closestDistance) {
                closestPerson = person;
                closestDistance = distance;
            }
        }
        return { person: closestPerson, distance: closestDistance };
    }

    drawMe() {

        if (this.alterEgoImage) {
            let alterEgoGraphics = createGraphics(this.alterEgoImage.width, this.alterEgoImage.width);
            //alterEgoGraphics.push();
            alterEgoGraphics.imageMode(CENTER);
            alterEgoGraphics.clear()
            //this.alterEgoGraphics.translate(this.faceRect.width * faceBorderFactor / 2, this.faceRect.width * faceBorderFactor / 2);
            alterEgoGraphics.translate(alterEgoGraphics.width / 2, alterEgoGraphics.height / 2);
            alterEgoGraphics.rotate(this.underFrameRect.headAngle);

            // this.alterEgoGraphics.tint(255, 210);
            alterEgoGraphics.image(this.alterEgoImage, 0, 0);
            let b = this.underFrameRect.border;



            let lerpAmount = 0.3;
            let displayRect = this.underFrameRect;
            if (this.lastFrameRect) {
                displayRect = { left: lerp(this.lastFrameRect.left, this.underFrameRect.left, lerpAmount), top: lerp(this.lastFrameRect.top, this.underFrameRect.top, lerpAmount), right: lerp(this.lastFrameRect.right, this.underFrameRect.right, lerpAmount), bottom: lerp(this.lastFrameRect.bottom, this.underFrameRect.bottom, lerpAmount), width: lerp(this.lastFrameRect.width, this.underFrameRect.width, lerpAmount), height: lerp(this.lastFrameRect.height, this.underFrameRect.height, lerpAmount) };
            }
            this.lastFrameRect = displayRect;

            flipGraphics.image(alterEgoGraphics, displayRect.left, displayRect.top - b / 3, displayRect.width, displayRect.height);




            // flipGraphics.image(alterEgoGraphics, this.underFrameRect.left, this.underFrameRect.top - b / 3, this.underFrameRect.width, this.underFrameRect.height);
            // flipGraphics.image(alterEgoGraphics, this.underFrameRect.left - b, this.underFrameRect.top - 2 * b, this.underFrameRect.width + 2 * b, this.underFrameRect.height + 2 * b);

            //image(alterEgoGraphics, this.alterEgoFrameRect.left, this.alterEgoFrameRect.top, this.alterEgoFrameRect.width, this.alterEgoFrameRect.height);
            alterEgoGraphics.remove();
        } else if (this.underImage) {

            flipGraphics.image(this.underImage, this.underFrameRect.left, this.underFrameRect.top, this.underFrameRect.width, this.underFrameRect.height);
            flipGraphics.image(searchingTextImage, this.underFrameRect.left, this.underFrameRect.top, this.underFrameRect.width, this.underFrameRect.height);
        }
        // flipGraphics.textSize(72);
        // flipGraphics.text(this.poseNum, this.underFrameRect.cx, this.underFrameRect.cy);

        // if (this.closestPerson)
        //     flipGraphics.text(this.closestPerson.poseNum + this.closestPerson.name, this.underFrameRect.cx, this.underFrameRect.cy + 70);
        // flipGraphics.ellipse(this.underFrameRect.cx, this.underFrameRect.cy, 10, 10);
    }
}

// this.getCropMaskAlterEgoImage(null, newImage)
// let thisPose = await bodyPose.detect(newImage, function (poses) {
//
//     if (poses.length > 0) {
//         let thisFrameRect = getRect(poses[0]);

//         this.getCropMaskAlterEgoImage(thisFrameRect, newImage);
//     } else {
//
//     }
// });


//getCropMaskAlterEgoImage(frameRect, incomingImage) {

//this.alterEgoFrameRect = frameRect;

//this.alterEgoImage = incomingImage.get(frameRect.left, frameRect.top, frameRect.width, frameRect.height);
//this.alterEgoImage = gradientMaskIt(this.alterEgoImage);//better way to get an image from a p5.Graphics?
//  }
