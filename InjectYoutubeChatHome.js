//---------------------------------------   BOUNCING TRANSLATION   -------------------------------------------
//   BOUNCING INCOMING MESSAGE TO THE LIVE CHAT SUBMITTER 
var sendBtn; 
var ChatText;

function SendTextEnter(inputtext){
	ChatText.textContent = inputtext.replaceAll("\\\"", "\"");
	ChatText.dispatchEvent(new InputEvent("input"));
	sendBtn.click();
}

function LatchChatBox(){
	sendBtn = document.querySelector("#send-button button",); 
	ChatText = document.querySelector("#input.yt-live-chat-text-input-field-renderer",);
	if ((sendBtn == null) || (ChatText == null)) {
		spn.textContent = "Can't find message input.";
	} else {
        spn.textContent = "Synced and ready.";
        OpenReceiver();
    }
}
//=============================================================================================================

var ChatElementTarget = "chat-messages";

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