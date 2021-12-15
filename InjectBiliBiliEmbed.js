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
    var i = 0;
    const intv = setInterval(() => {
        i++;
        if (document.getElementsByTagName('video').length > 0) {
            TransmitTime(document.getElementsByTagName('video')[0]);
            clearInterval(intv);
        } if (i == 30){
            clearInterval(intv);
        }
    }, 1000);
}

Load();