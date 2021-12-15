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

function Load() {
    const intv = setInterval(() => {
        if (document.getElementsByTagName('video').length > 0) {
            if (document.getElementsByTagName('video')[0].src != "") {
                TransmitTime(document.getElementsByTagName('video')[0]);
                clearInterval(intv);
            }
        }
    }, 1000);
}

Load();