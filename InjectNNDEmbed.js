function TransmitTime(vid) {
    if (parent) {
        setInterval(() => {
            parent.postMessage({
                n: "MSyncXMChatX",
                d: vid.currentTime*1000
              },"https://app.mchatx.org");
        }, 50);
    }
}

function OpenReceiver(vid) {
    window.addEventListener('message', (e) => {
        if (e.origin == "https://app.mchatx.org") {
            if (e.data.n == "MChatXXMSync") {
                switch (e.data.d) {
                    case "s":
                        vid.play();
                        break;
                    
                    case "p":
                        vid.pause();
                        break;
                    
                    case "w":
                        if (vid.paused) {
                            vid.play();
                        } else {
                            vid.pause();
                        }
                        break;

                    default:
                        if (typeof e.data.d == 'number'){
                            vid.currentTime += e.data.d/1000;
                        }
                        break;
                }
            }
        }
    });
}

function Load() {
    if ((document.referrer == "https://app.mchatx.org/") && (window.location != parent.location)) {
        const intv = setInterval(() => {
            if (document.getElementsByTagName('video').length > 0) {
                if (document.getElementsByTagName('video')[0].src != "") {
                    TransmitTime(document.getElementsByTagName('video')[0]);
                    OpenReceiver(document.getElementsByTagName('video')[0]);
                    clearInterval(intv);
                }
            }
        }, 1000);
    }
}

Load();