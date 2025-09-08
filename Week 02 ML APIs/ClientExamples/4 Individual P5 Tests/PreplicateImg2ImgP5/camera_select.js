function allowCameraSelection(w, h) {
    //This whole thing is to build a pulldown menu for selecting between cameras

    //manual alternative to all of this pull down stuff:
    //type this in the console and unfold resulst to find the device id of your preferredwebcam, put in sourced id below
    //navigator.mediaDevices.enumerateDevices()

    //default settings
    let videoOptions = {
        audio: true, video: {
            width: w,
            height: h
        }
    };
    let select = document.createElement("select");
    select.id = "video_select";
    select.style.position = "absolute";
    select.style.top = "600px";
    select.style.left = "50px";
    select.style.width = "100px";
    select.label = "Pick a Camera";
    // option = document.createElement('option');
    // option.value = d[0].deviceId;
    // option.textContent = "Pick A Camera";
    //select.appendChild(option);
    document.body.appendChild(select);
    let preferredCam = localStorage.getItem('preferredCam')
    //if you changed it in the past and stored setting
    if (preferredCam) {
        videoOptions = {
            video: {
                width: w,
                height: h,
                sourceId: preferredCam
            }
        };
    }
    //create a pulldown menu for picking source
    navigator.mediaDevices.enumerateDevices().then(function (d) {
        // var sel = createSelect();
        //var select = document.getElementById('video_select');
        //sel.position(10, 10);

        var option;
        option = document.createElement('option');
        option.value = d[0].deviceId;
        option.textContent = "Pick a Camera";
        select.appendChild(option);
        numberOfCameras = 0;
        //console.log(d);
        for (var i = 0; i < d.length; i++) {
            if (d[i].kind == "videoinput") {
                if (d[i].deviceId == "") continue;
                let label = d[i].label;
                let ending = label.indexOf('(');
                if (ending == -1) ending = label.length;
                label = label.substring(0, ending);
                option = document.createElement('option');
                option.value = d[i].deviceId;
                option.textContent = label;
                select.appendChild(option);
                numberOfCameras++;

                //sel.option(label, d[i].deviceId)
            }
            if (preferredCam) {
                select.value = preferredCam;
            }
        }
        //  console.log("Number of Cameras"+ numberOfCameras );
        if (numberOfCameras < 2) {
            select.style.display = 'none';
        } else {
            select.style.width = '20px';
        }
        select.addEventListener('change', function () {
            //let item = sel.value();
            let item = select.value;

            localStorage.setItem('preferredCam', item);
            videoOptions = {
                video: {
                    optional: [{
                        sourceId: item
                    }]
                }
            };
            myVideo.remove();
            myVideo = createCapture(videoOptions, VIDEO);
            myVideo.hide();
            console.log("Preferred Camera", videoOptions);
        });
    });
    return videoOptions;
}
