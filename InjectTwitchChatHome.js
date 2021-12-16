//---------------------------------------   BOUNCING TRANSLATION   -------------------------------------------
//   BOUNCING INCOMING MESSAGE TO THE LIVE CHAT SUBMITTER 
var sendBtn; 
var ChatText;
var ChatInputPanel;

function SendTextEnter(inputtext){
	ChatText.value = inputtext.replaceAll("\\\"", "\"");
	var evt = document.createEvent("Events");
	evt.initEvent("change", true, true);
	ChatText.dispatchEvent(evt);
	sendBtn.click();
}

function LatchChatBox(){
	ChatText = null;
	sendBtn = null;

	var testT = document.getElementsByTagName('textarea');
	for (var i = 0; i < testT.length; i++) {
		if (!testT[i].getAttribute("data-a-target")){
			continue;
		} else if (testT[i].getAttribute("data-a-target").indexOf("chat-input") != -1) {
			ChatText = testT[i];
			break;
		}
	}

	var testB = document.getElementsByTagName('button');
	for (var i = 0; i < testB.length; i++) {
		if (!testB[i].getAttribute("data-a-target")){
			continue;
		} else if (testB[i].getAttribute("data-a-target").indexOf("chat-send-button") != -1) {
			sendBtn = testB[i];
			break;
		}
	}	

	if ((ChatText != null) && (sendBtn != null)){
        spn.textContent = "Synced and ready.";
        OpenReceiver();
	} else {
		spn.textContent = "Can't find Live Chat Input";
	}
}
//=============================================================================================================

var ChatElementTarget = "chat-room-header-label";

var spn = document.createElement('p');
spn.textContent = "Looking for the chatbox...";
spn.style.fontSize = '15px';
spn.style.background = 'black';
spn.style.color = 'white';
spn.style.margin = '3px 10px 3px 10px';
spn.style.width = "100%"
spn.style.textAlign = "center";

var ExtContainer = document.createElement('div');
ExtContainer.id = "Extcontainer";
ExtContainer.appendChild(spn);

function OpenReceiver() {
    window.addEventListener('message', (e) => {
        if (e.origin == "https://app.mchatx.org") {
            if (e.data.n == "MChatXXMSync") {
                if (ChatText) {
                    SendTextEnter(e.data.d);
                }
            }
        }
    });
}

function Load() {
    if ((document.referrer == "https://app.mchatx.org/") && (window.location != parent.location)) {
        var i = 0;
        const intv = setInterval(() => {
            i++;
            var target = document.getElementById(ChatElementTarget);
            if (target.length != 0){
                if (document.getElementById("Extcontainer") != null){
                    var ExtcontainerTemp = document.getElementById("Extcontainer");
                    ExtcontainerTemp.parentNode.removeChild(ExtcontainerTemp);
                }
                target.prepend(ExtContainer);
                LatchChatBox();
                clearInterval(intv);
            } if (i == 30){
                clearInterval(intv);
            }
        }, 1000);
    }
}

function LoadButtons() {
}

Load();