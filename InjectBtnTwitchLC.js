var UID = document.location.toString().substring(document.location.toString().indexOf("/popout/") + 8);
UID = UID.substring(0, UID.indexOf("/chat"));
UID = "Twitch " + UID;

//-------------------------------------   LISTEN TO LIVE CHAT BOX   -----------------------------------------
//   READING LIVE CHAT BOX NODE CHANGE
const callback = function(mutationsList, observer) {
    for(const mutation of mutationsList) {
        if (mutation.type === 'childList') {
			mutation.addedNodes.forEach(element => {
				var author = element.getElementsByClassName("chat-author__display-name")[0].textContent;
				var TextMsg = element.getElementsByClassName("text-fragment")[0].textContent;
				data = {                            
					"Act": 'MChad-Entry',
					"UID": UID,
					"Tag": author,
					"Stime": '',
					"Stext": '',
					"CC": '',
					"OC": ''
				};
				data.Stext = "[" + author + "] " + TextMsg;

				if (Live){
				} else {
					data.Stime = TimespanStringify(element.innerText.split("\n")[0]);
				}					

				if(element.getElementsByClassName("chat-badge") != null){
					var Chatbadges = element.getElementsByClassName("chat-badge");

					if (Chatbadges.length == 0){
						if ((TagList.length == 0) && (KeyWordList.length == 0)){
							ws.send(JSON.stringify(data));
						} else if ((FilterMessageTag(author)) || FilterMessageKeyword(TextMsg)) {
							ws.send(JSON.stringify(data));
						}
						return;
					}

					for (var i = 0; i < Chatbadges.length; i++){
						if(Chatbadges[i].getAttribute("alt") == "Moderator"){
							data.Tag += ",moderator";
							ws.send(JSON.stringify(data));
							break;
						} else if (i == Chatbadges.length - 1){
							if ((TagList.length == 0) && (KeyWordList.length == 0)){
								ws.send(JSON.stringify(data));
							} else if ((FilterMessageTag(author)) || FilterMessageKeyword(TextMsg)) {
								ws.send(JSON.stringify(data));
							}
						}
					}
				} else {
					if ((TagList.length == 0) && (KeyWordList.length == 0)){
						ws.send(JSON.stringify(data));
					} else if ((FilterMessageTag(author)) || FilterMessageKeyword(TextMsg)) {
						ws.send(JSON.stringify(data));
					}
				}
				//console.log(JSON.stringify(data))
				// SEND THEM TO APP OR FILTER FIRST BEFORE SENDING
			});
        }
    }
}

const config = { childList: true, subtree: false };
const ChatItemObserver = new MutationObserver(callback);
var VidDur;

function ChatListener(){
	if (Live){
	} else {
		var Chatbox = document.getElementsByClassName("simplebar-content");

		for (var i = 0; i < Chatbox.length; i++){
			if (Chatbox[i].className == "simplebar-content"){
				ListenerTarget = Chatbox[i].childNodes[0];
				ChatItemObserver.observe(ListenerTarget, config);
				break;
			} else if (i == Chatbox.length - 1){
				ws.close();
				spn.textContent = "Can't find Chat Box";
			}
		}
	}
}

function TimespanStringify(timechange){

	switch (timechange.split(":").length){
		case (1):
			if (timechange.length == 1){
				timechange = "0" + timechange;
			}
			timechange = "00:00:" + timechange;
			break;
		case (2):
			if (timechange.length == 4){
				timechange = "0" + timechange;
			}
			timechange = "00:" + timechange;
			break;
		case (3):
			if (timechange.length == 7){
				timechange = "0" + timechange;
			}
			break;
	}
	
	return (timechange);
}

function TimespanStringify2(timechange){
	var mn, hr;
	timechange = timechange.toString().split(".")[0];
	mn = Math.floor(timechange/60);
	timechange -= mn*60;
	hr = Math.floor(mn/60);
	mn -= hr * 60;
	
	if (timechange.toString().length == 1) timechange = "0" + timechange.toString();
	if (mn.toString().length == 1) mn = "0" + mn.toString();
	if (hr.toString().length == 1) hr = "0" + hr.toString();
	return (hr + ":" + mn + ":" + timechange);
}
//=============================================================================================================



//-------------------------------------------- FILTER UTIL  ---------------------------------------------------
var TagList = "";
var KeyWordList = "";

function FilterMessageTag(author){
	if (TagList.includes(author)) {
		return (true);
	} else {
		return (false);
	}
}

function FilterMessageKeyword(text){
	if (KeyWordList.length != 0){
		var Res = text.match(new RegExp(KeyWordList, "i"));
		if (Res == null){
			return(false);
		}

		if (Res.length != 0){
			return (true);
		} else {
			return (false);
		}
	} else {
		return (false);
	}
}

//=============================================================================================================



//--------------------------------------------- BASIC UTIL ----------------------------------------------------
function SendReg(){
    var data = {                           
		"Act": 'MChad-Reg',
		"UID": UID,
		"Nick": UID
	};	
	ws.send(JSON.stringify(data));
}

function SendRollCall(){
    var data = {                           
		"Act": 'MChad-RollCall',
		"UID": UID,
		"Nick": UID
	};	
	ws.send(JSON.stringify(data));
}

function SendUnsync(){
	var data = {                           
		"Act": 'MChad-Unsync',
		"UID": UID
	};
	ws.send(JSON.stringify(data));
}

function OpenSync() {
	if (document.location.toString().indexOf("://www.twitch.tv/") != -1){
		ws = new WebSocket("ws://localhost:20083/"); //	This one is fixed, host 2008 for Mio's birthday 20 Aug and 3 for "Mi" in Mio
		//ws.onerror = function (err) {
		//}

		ws.onopen = function (event) {
			SendReg();
		};
        
        ws.onclose = function (event) {
			CancelConnection();
			btn.textContent = "Sync MChad Desktop Client";
			mode = 0;
        };
		
		ws.onmessage = function (event) {
			MsgNexus(event.data.toString());
		};
	
	} else {
		alert('NOT IN SYNCING TARGET WEBPAGE');
	}
}

function CancelConnection() {
	switch (mode){
		case 1:
			spn.textContent = "Can't connect to MChad desktop app";
			break;
		case 3:
			spn.textContent = "Disconnected";
			break;
		case 4:
			sendBtn = null;
			ChatText = null;
			ChatInputPanel = null;
			ChatBoxObserver.disconnect();
			break;
		case 5:
			ChatItemObserver.disconnect();
			FrontFilterBtn.remove();
			break;
		case 6:
			spn.textContent = "Disconnected";
			break;	
	}
}

function MsgNexus(StringData) {
	var NexusParse = StringData.toString().match(/\"Act\":\"MChad-RegOK\"|\"Act\":\"MChad-RollCallApp\"|\"Act\":\"MChad-SetMode\"|\"Act\":\"MChad-PlayApp\"|\"Act\":\"MChad-PauseApp\"|\"Act\":\"MChad-TimeSetApp\"|\"Act\":\"MChad-LiveSend\"|\"Act\":\"MChad-RegListener\"|\"Act\":\"MChad-FilterApp\"|\"Act\":\"MChad-PreciseSyncApp\"|\"Act\":\"MChad-PreciseTimeSetApp\"|\"Act\":\"MChad-Unsync\"/);
	
	if (NexusParse == null){
		return;
	}

	if (NexusParse.length != 0){
		switch(NexusParse[0]){
			case ("\"Act\":\"MChad-RegOK\""):
				mode = 2;
				btn.textContent = "Synced - Idle";
				break;
			case ("\"Act\":\"MChad-RollCallApp\""):
				SendRollCall();
				break;
			case ("\"Act\":\"MChad-SetMode\""):
				var ParsedData = StringData.toString().split("\",\"");
				if (ParsedData.length != 3){
					return;
				}
		
				if (ParsedData[1].split("\":\"")[1].replace("\"","") == UID){
					switch (ParsedData[2].split("\":\"")[1].replace("\"}","")){
						case ("Archive"):
                                mode = 2;
                                btn.textContent = "PRECISE SYNC MODE UNAVAILABLE";
							break;
						case ("LiveChat"):
							if (mode < 3){
								mode = 2;
								btn.textContent = "BOUNCING NOT AVAILABLE";
							}
							break;

						case ("SyncTL"):
							if (mode < 3){
								mode = 2;
								btn.textContent = "PRECISE SYNC MODE UNAVAILABLE";
							}
							break;
	
					}
				}
				break;
			case ("\"Act\":\"MChad-TimeSetApp\""):
				var ParsedData = StringData.toString().split("\",\"");
				if (ParsedData.length != 3){
					return;
				}
		
				if ((ParsedData[1].split("\":\"")[1].replace("\"","") == UID) && (mode == 3)){
					SetTime(ParsedData[2].split("\":\"")[1].replace("\"}",""));
				}
				break;
			case ("\"Act\":\"MChad-LiveSend\""):
				var ParsedData = StringData.toString().split("\",\"");
				if (ParsedData.length != 3){
					return;
				}

				if ((ParsedData[1].split("\":\"")[1].replace("\"","") == UID) && (mode == 4)){
					SendTextEnter(ParsedData[2].split("\":\"")[1].replace("\"}",""));
				}
				break;
			case ("\"Act\":\"MChad-RegListener\""):
				if (mode < 3){
					mode = 5;
					btn.textContent = "Synced - Listener (Click to Unsync)";
					ChatListener();
					document.getElementById("Extcontainer").appendChild(FrontFilterBtn);
				}
				break;
			case ("\"Act\":\"MChad-FilterApp\""):
				var ParsedData = StringData.toString().split("\",\"");
				if (ParsedData.length != 3){
					return;
				}
				
				switch (ParsedData[1].split("\":\"")[1].replace("\"","")){
					case ("TAG"):
						TagList = ParsedData[2].split("\":\"")[1].replace("\"}","").replaceAll(",", " ");
						break;
					case ("KEYWORD"):
						KeyWordList = ParsedData[2].split("\":\"")[1].replace("\"}","");
						KeyWordList = KeyWordList.replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll(", ", "|").replaceAll(",", "|");
						break;						
				}
				spn.textContent = "Synced Filter"
				break;
			case ("\"Act\":\"MChad-PreciseTimeSetApp\""):
				var ParsedData = StringData.toString().split("\",\"");
				if (ParsedData.length != 4){
					return;
				}
							
				if ((ParsedData[1].split("\":\"")[1].replace("\"}","") == UID) && (mode == 6)){
					SetTimePrecise(ParsedData[2].split("\":\"")[1], ParsedData[3].split("\":\"")[1].replace("\"}",""));
				}				
				break;
			case ("\"Act\":\"MChad-Unsync\""):
				var ParsedData = StringData.toString().split("\",\"");
				if (ParsedData.length != 2){
					return;
				}

				if (ParsedData[1].split("\":\"")[1].replace("\"}","") == UID){
					CancelConnection();
					mode = 2;
					btn.textContent = "Synced - Idle";	
				}				
				break;
		}
	}
}

function BtnNexus() {
	spn.textContent = "";
	if (mode == 0) {
		btn.textContent = "Syncing..."
		mode = 1;
		OpenSync();
	} else {
		ws.close();
	}
}
//=============================================================================================================



//---------------------------------------- FILTER MODAL CONTROLLER ----------------------------------------
var ModalScreenFilter = document.createElement('div');
ModalScreenFilter.style.position = "fixed";
ModalScreenFilter.style.zIndex = 1;
ModalScreenFilter.style.left = 0;
ModalScreenFilter.style.top = 0;
ModalScreenFilter.style.width = "100%";
ModalScreenFilter.style.height = "100%";
ModalScreenFilter.style.overflow = "auto";
ModalScreenFilter.style.backgroundColor = "rgba(0,0,0,0.4)";
ModalScreenFilter.style.display = "block"

var ModalContentFilter = document.createElement('div');
ModalContentFilter.style.backgroundColor = "#fefefe";
ModalContentFilter.style.margin = "15% auto";
ModalContentFilter.style.padding = "20px";
ModalContentFilter.style.border = "1px solid #888";
ModalContentFilter.style.width = "200px";
ModalContentFilter.style.display = "flex";
ModalContentFilter.style.alignItems = "center";
ModalContentFilter.style.justifyContent = "center";
ModalContentFilter.style.flexDirection = "column";
ModalScreenFilter.appendChild(ModalContentFilter);

var ModalFilterCloseBtn = document.createElement('span');
ModalFilterCloseBtn.textContent = "X";
ModalFilterCloseBtn.style.color = "#aaa";
ModalFilterCloseBtn.style.alignSelf = "end";
ModalFilterCloseBtn.style.fontSize = "28px";
ModalFilterCloseBtn.style.fontWeight = "bold";
ModalFilterCloseBtn.style.cursor = "pointer";
ModalFilterCloseBtn.onclick = CloseModalFilterBtnClick;

var ModalFilterText = document.createElement('p');
ModalFilterText.textContent = "FILTER";
ModalFilterText.style.marginTop = "15px";
ModalFilterText.style.marginBottom = "15px";
ModalFilterText.style.fontSize = "17px";
ModalFilterText.style.fontWeight = "bold";
ModalFilterText.style.color = "black";

var ModalFilterText1 = document.createElement('p');
ModalFilterText1.textContent = "Keywords :";
ModalFilterText1.style.color = "black";
ModalFilterText1.style.fontSize = "17px";

var ModalFilterInput1 = document.createElement('input');
ModalFilterInput1.type = "text";
ModalFilterInput1.placeholder = "[EN], [翻訳], ..."
ModalFilterInput1.style.width = "80%";

var ModalFilterText2 = document.createElement('p');
ModalFilterText2.textContent = "Authors :";
ModalFilterText2.style.color = "black";
ModalFilterText2.style.fontSize = "17px";

var ModalFilterInput2 = document.createElement('input');
ModalFilterInput2.type = "text";
ModalFilterInput2.placeholder = "XYZ, Gachapon ..."
ModalFilterInput2.style.width = "80%";

var ModalFilterOk = document.createElement('button');
ModalFilterOk.style.margin = "5px"
ModalFilterOk.style.background = 'black';
ModalFilterOk.style.color = 'white';
ModalFilterOk.style.fontSize = '15px';
ModalFilterOk.style.cursor = 'pointer';
ModalFilterOk.style.textAlign = 'center';
ModalFilterOk.style.borderRadius = '15px';
ModalFilterOk.style.padding = '8px';
ModalFilterOk.style.marginTop = "15px";
ModalFilterOk.textContent = "Ok";
ModalFilterOk.onclick = OkModalFilterBtnClick;

ModalContentFilter.appendChild(ModalFilterCloseBtn);
ModalContentFilter.appendChild(ModalFilterText);
ModalContentFilter.appendChild(ModalFilterText1);
ModalContentFilter.appendChild(ModalFilterInput1);
ModalContentFilter.appendChild(ModalFilterText2);
ModalContentFilter.appendChild(ModalFilterInput2);
ModalContentFilter.appendChild(document.createElement('br'));
ModalContentFilter.appendChild(ModalFilterOk);

function SummonModalFilter() {
	document.getElementById("Extcontainer").appendChild(ModalScreenFilter);
	ModalFilterInput1.value = KeyWordList.replaceAll("\\[", "[").replaceAll("\\]", "]").replaceAll("|", ", ");
	ModalFilterInput2.value = TagList.replaceAll("\\[", "[").replaceAll("\\]", "]").replaceAll("|", ", ");
	window.onclick = function(event) {
		if (event.target == ModalScreenFilter) {
			ModalScreenFilter.remove();
			window.onclick = null;
		}
	}
}

function OkModalFilterBtnClick(){
	KeyWordList = ModalFilterInput1.value.replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll(", ", "|").replaceAll(",", "|");;
	TagList = ModalFilterInput2.value.replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll(", ", "|").replaceAll(",", "|");;
	spn.textContent = "Saved new filter";

	ModalScreenFilter.remove();
}

function CloseModalFilterBtnClick(){
	ModalScreenFilter.remove();
}
//======================================== FILTER MODAL CONTROLLER ========================================



var ws;
var btn = document.createElement('button');
btn.onclick = BtnNexus;
btn.textContent = "Sync MChad Desktop Client"
btn.style.margin = "5px"
btn.style.background = 'black';
btn.style.color = 'white';
btn.style.fontSize = '15px';
btn.style.cursor = 'pointer';
btn.style.textAlign = 'center';
btn.style.borderRadius = '15px';
btn.style.padding = '8px';

var spn = document.createElement('span');
spn.textContent = "";
spn.style.fontSize = '15px';
spn.style.background = 'black';
spn.style.color = 'white';

var FrontFilterBtn = btn.cloneNode(false);
FrontFilterBtn.id = "FrontFilterBtn";
FrontFilterBtn.textContent = "Set Filter";
FrontFilterBtn.onclick = MMFilterBtnClick;
FrontFilterBtn.style.float = "left";

function MMFilterBtnClick() {
	SummonModalFilter();
}

var sendBtn; 
var ChatText;
var ListenerTarget;
var ChatInputPanel;

var Live = false;
var mode = 0;

var CurrentVersion = "3.1.8";

var ChatElementTarget = "chat-room-header-label";
/*
	0 : NOT SYNCED
	1 : SYNCING
	2 : SYNCED-IDLE
	3 : SYNCED-ARCHIVE
	4 : SYNCED-LIVECHAT
	5 : SYNCED-LISTENER
*/

function LoadButtons() {
	var target = document.getElementById(ChatElementTarget).parentNode.parentNode.parentNode;
	var ExtContainer = document.createElement('div');
	ExtContainer.id = "Extcontainer";
	target.prepend(ExtContainer);
	ExtContainer.appendChild(btn);
	ExtContainer.appendChild(spn);

    var xhr = new XMLHttpRequest();
	xhr.open('GET', 'https://repo.mchatx.org/MSyncVersion/', true);
	xhr.onload = function () {
		try {
			var JSONtemp = JSON.parse(xhr.response);	
		} catch (error) {
			spn.textContent = "ERROR FETCHING DATA";
			return;
		}
		
		spn.textContent = "Version " + CurrentVersion;

		if (JSONtemp["Ver"] != CurrentVersion){
			spn.textContent = spn.textContent + " (NEWER VERSION AVAILABLE " + JSONtemp["Ver"] + ")";
		}
	};

	xhr.send();
}

async function WaitUntilLoad(){
	while (true){
		var target = document.getElementById(ChatElementTarget);
		if (target != null){
			if (document.getElementById("Extcontainer") != null){
				var Extcontainer = document.getElementById("Extcontainer");
				Extcontainer.parentNode.removeChild(Extcontainer);
			}
			LoadButtons();
			break;
		} else {
			console.log("Not loaded yet");
		}
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
}

WaitUntilLoad();