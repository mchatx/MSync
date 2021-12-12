var UID = "";
var HeadUID = 'YT_';

function ReloadUniqueID() {
	UID = document.location.toString().substring(document.location.toString().indexOf("v=") + 2);
	if (UID.indexOf("?") != -1){
		UID = UID.substring(0, UID.indexOf("?"));
	}
	if (UID.indexOf("&") != -1){
		UID = UID.substring(0, UID.indexOf("&"));
	}
	UID = "Youtube " + UID;
}
//-------------------------------------   LISTEN TO LIVE CHAT BOX   -----------------------------------------
//   READING LIVE CHAT BOX NODE CHANGE
const callback = function(mutationsList, observer) {
    for(const mutation of mutationsList) {
        if (mutation.type === 'childList') {
			mutation.addedNodes.forEach(element => {
				if (element.innerText != ""){
					data = {                            
						"Act": 'MChad-Entry',
						"UID": UID,
						"Tag": element.innerText.split("\n")[0],
						"Stime": '',
						"Stext": '',
						"CC": '',
						"OC": ''
					};
	
					data.Stime = "";
					data.Stext = "[" + element.innerText.split("\n")[0] + "] " + element.innerText.split("\n")[1];
					
					if (element.getAttribute("author-type") != null) {
						var tagscan = element.getAttribute("author-type").toLowerCase().match(/mod|moderator|owner/);
						if (tagscan != null){
							if (tagscan.length != 0){
								data.Tag += "," + element.getAttribute("author-type");
								ws.send(JSON.stringify(data));
								return true;
							}
						}
					} 
					
					if ((TagList.length == 0) && (KeyWordList.length == 0)){
						ws.send(JSON.stringify(data));
					} else if ((FilterMessageTag(data.Tag)) || FilterMessageKeyword(data.Stext.substr(data.Stext.indexOf("]") + 2))) {
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
const config2 = { attributes: true, childList: false, subtree: false };
const ChatItemObserver = new MutationObserver(callback);

function ChatListener(){
    var target = document.getElementsByClassName("style-scope yt-live-chat-item-list-renderer");
    for (let j = 0; j < target.length; j++){
        if (target[j].id == "items"){
                ListenerTarget = target[j];
                ChatItemObserver.observe(ListenerTarget, config);
            break;
        } else if (j == target.length - 1){
            ws.close();
            spn.textContent = "Can't find Chat Box";
        }
    }
}

function TimespanStringify(timechange){
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
	if (document.location.toString().indexOf("https://www.youtube.com/live_chat?") != -1){
		SocketMode = true;
		ws = new WebSocket("ws://localhost:20083/"); //	This one is fixed, host 2008 for Mio's birthday 20 Aug and 3 for "Mi" in Mio
		//ws.onerror = function (err) {
		//}

		SMWASyncBtn.remove();
		SMOneClickSetBtn.remove();

		ws.onopen = function (event) {
			SendReg();
		};
        
        ws.onclose = function (event) {
			CancelConnection();
			btn.parentNode.insertBefore(SMWASyncBtn, btn.nextSibling);
			btn.parentNode.insertBefore(SMOneClickSetBtn, btn);
			btn.textContent = "Sync Desktop Client";
			mode = 0;
        };
		
		ws.onmessage = function (event) {
			MsgNexus(event.data.toString());
		};
	
	} else {
		alert('NOT IN SYNCING TARGET WEBPAGE');
	}
}

function CancelConnection(){
	switch (mode){
		case 1:
			if (SocketMode){
				spn.textContent = "Can't connect to MChad desktop app";
			} else {
				spn.textContent = "Can't reach Sync Server, Halp!";
			}		
			break;
		case 3:
			spn.textContent = "Disconnected";
			break;
		case 4:
			sendBtn = null;
			ChatText = null;
			ChatInputPanel = null;
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
	var NexusParse = StringData.toString().match(/\"Act\":\"MChad-RegOK\"|\"Act\":\"MChad-RollCallApp\"|\"Act\":\"MChad-SetMode\"|\"Act\":\"MChad-PlayApp\"|\"Act\":\"MChad-PauseApp\"|\"Act\":\"MChad-TimeSetApp\"|\"Act\":\"MChad-LiveSend\"|\"Act\":\"MChad-RegListener\"|\"Act\":\"MChad-FilterApp\"|\"Act\":\"MChad-PreciseSyncApp\"|\"Act\":\"MChad-PreciseTimeSetApp\"|\"Act\":\"MChad-Unsync\"|\"Act\":\"MChad-Disconnect\"/);
	
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
							if (mode < 3){
								mode = 2;
								spn.textContent = "ARCHIVE MODE UNAVAILABLE";
							}
							break;
						case ("LiveChat"):
							if (mode < 3){
								mode = 4;
								if (SocketMode){
									btn.textContent = "Synced - LiveChat (Click to Unsync)";
								} else {
									SMWASyncBtn.textContent = "Synced - LiveChat (Click to Unsync)";
								}
								LatchChatBox();
							}
							break;
						case ("SyncTL"):
							if (mode < 3){
								mode = 2;
								spn.textContent = "PRECISE SYNC MODE UNAVAILABLE";
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

			case ("\"Act\":\"MChad-Disconnect\""):
				CancelConnection();
				mode = 0;
				break;	
		}
	}
}

function BtnNexus() {
	spn.textContent = "";
	if (mode == 0) {
		ReloadUniqueID();
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
var ES;
var SocketMode = false;

var btn = document.createElement('button');
btn.onclick = BtnNexus;
btn.textContent = "Sync Desktop Client"
btn.style.margin = "5px"
btn.style.background = 'black';
btn.style.color = 'white';
btn.style.fontSize = '15px';
btn.style.cursor = 'pointer';
btn.style.textAlign = 'center';
btn.style.borderRadius = '15px';
btn.style.padding = '8px';

var SMWASyncBtn = btn.cloneNode(false);
SMWASyncBtn.onclick = SMWASyncBtnClick;
SMWASyncBtn.textContent = "Sync Web Client";

var SMOneClickSetBtn = btn.cloneNode(false);
SMOneClickSetBtn.onclick = OneClickSetup;
SMOneClickSetBtn.textContent = "Open TL Client";

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

var ExtContainer = document.createElement('div');
ExtContainer.id = "Extcontainer";
ExtContainer.appendChild(SMOneClickSetBtn);
ExtContainer.appendChild(btn);
ExtContainer.appendChild(SMWASyncBtn);
ExtContainer.appendChild(spn);

function MMFilterBtnClick() {
	SummonModalFilter();
}

var ListenerTarget;

var mode = 0;

var CurrentVersion = "3.9.10";

var ChatElementTarget = "chat-messages";
/*
	0 : NOT SYNCED
	1 : SYNCING
	2 : SYNCED-IDLE
	3 : SYNCED-ARCHIVE
	4 : SYNCED-LIVECHAT
	5 : SYNCED-LISTENER
*/

ReloadUniqueID();

function LoadButtons() {
	var target = document.getElementById(ChatElementTarget);
	target.prepend(ExtContainer);

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
		if (target.length != 0){
			if (document.getElementById("Extcontainer") != null){
				var ExtcontainerTemp = document.getElementById("Extcontainer");
				ExtcontainerTemp.parentNode.removeChild(ExtcontainerTemp);
			}
			LoadButtons();
			break;
		} else {
			console.log("Not loaded yet");
		}
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
}

function OneClickSetup() {
	if (mode == 0){
		ReloadUniqueID();
		mode = 10;
		SMOneClickSetBtn.textContent = "Syncing..."
		spn.textContent = "";
		btn.remove();
		SMWASyncBtn.remove();

		var BToken = "";
		BToken = TGEncoding(JSON.stringify({
			link: "https://www.youtube.com/watch?v=" + UID.split(" ")[1]
		}));
	
		var xhr = new XMLHttpRequest();
		xhr.open('POST', 'https://repo.mchatx.org/APISync/AutoSync/SignIn', true);
		xhr.setRequestHeader('Content-type', 'application/json');
		xhr.onload = function () {
			var dt = JSON.parse(xhr.response);
	
			var BToken2 = "";
			BToken2 = TGEncoding(JSON.stringify({
				Token: dt.Token
			}));
			var xhr2 = new XMLHttpRequest();
			xhr2.open('POST', 'https://repo.mchatx.org/APISync/AutoSync/Sync', true);
			xhr2.setRequestHeader('Content-type', 'application/json');
			xhr2.onload = function () {
				mode = 0;
				SMOneClickSetBtn.textContent = "Open TL Client";
				SMOneClickSetBtn.parentNode.insertBefore(btn, SMOneClickSetBtn.nextSibling);
				btn.parentNode.insertBefore(SMWASyncBtn, btn.nextSibling);

				var dt2 = JSON.parse(xhr2.response);
				
				ModalInputSync.value = dt2.SyncToken;
				ModalOkSyncClick();
			};
			
			xhr2.onerror = e => {
				spn.textContent = "Quick Setup Failed";
				mode = 0;
				SMOneClickSetBtn.textContent = "Open TL Client";
				SMOneClickSetBtn.parentNode.insertBefore(btn, SMOneClickSetBtn.nextSibling);
				btn.parentNode.insertBefore(SMWASyncBtn, btn.nextSibling);
			}
		
			xhr2.send(JSON.stringify({
				BToken: BToken2
			}));
			
			const ClientWin = open("https://app.mchatx.org/TLClient?token=" + dt.Token, "TLClient", "scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=yes,menubar=no,width=1000,height=600,left=" + (screen.width - 1000).toString());
			var Checker = setInterval(() => {
				var test = true;
				try {
					test = !ClientWin.closed;
				} catch (error) {
					test = false;
				}
				
				if ((mode == 10) && (!test)){
					spn.textContent = "Quick Setup Failed";
					mode = 0;
					SMOneClickSetBtn.textContent = "Open TL Client";
					SMOneClickSetBtn.parentNode.insertBefore(btn, SMOneClickSetBtn.nextSibling);
					btn.parentNode.insertBefore(SMWASyncBtn, btn.nextSibling);
					clearInterval(Checker);
				}
				if (mode == 0){
					clearInterval(Checker);
				}
			}, 2000);
		};
		
		xhr.onerror = e => {
			spn.textContent = "Quick Setup Failed";
			mode = 0;
			SMOneClickSetBtn.textContent = "Open TL Client";
			SMOneClickSetBtn.parentNode.insertBefore(btn, SMOneClickSetBtn.nextSibling);
			btn.parentNode.insertBefore(SMWASyncBtn, btn.nextSibling);
		}
	
		xhr.send(JSON.stringify({
			BToken: BToken
		}));
	}
}

function SMWASyncBtnClick() {
	if (mode == 0) {
		ReloadUniqueID();
		SummonModalSync();
	} else {
		ES.close();
	}
}

WaitUntilLoad();



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
		if (SocketMode){
			ws.close();
		} else {
			ES.close();
		}
		spn.textContent = "Can't find message input";
	}
}
//=============================================================================================================



//---------------------------------------- SYNC MODAL CONTROLLER ----------------------------------------
var ModalScreenSync = document.createElement('div');
ModalScreenSync.style.position = "fixed";
ModalScreenSync.style.zIndex = 1;
ModalScreenSync.style.left = 0;
ModalScreenSync.style.top = 0;
ModalScreenSync.style.width = "100%";
ModalScreenSync.style.height = "100%";
ModalScreenSync.style.overflow = "auto";
ModalScreenSync.style.backgroundColor = "rgba(0,0,0,0.4)";
ModalScreenSync.style.display = "block"

var ModalContentSync = document.createElement('div');
ModalContentSync.style.background = 'black';
ModalContentSync.style.color = 'white';
ModalContentSync.style.margin = "15% auto";
ModalContentSync.style.padding = "20px";
ModalContentSync.style.border = "1px solid #888";
ModalContentSync.style.width = "200px";
ModalContentSync.style.display = "flex";
ModalContentSync.style.alignItems = "center";
ModalContentSync.style.justifyContent = "center";
ModalContentSync.style.flexDirection = "column";
ModalScreenSync.appendChild(ModalContentSync);

var ModalCloseBtnSync = document.createElement('span');
ModalCloseBtnSync.textContent = "X";
ModalCloseBtnSync.style.color = "#aaa";
ModalCloseBtnSync.style.alignSelf = "end";
ModalCloseBtnSync.style.fontSize = "28px";
ModalCloseBtnSync.style.fontWeight = "bold";
ModalCloseBtnSync.style.cursor = "pointer";
ModalCloseBtnSync.onclick = CloseModalSyncBtnClick;

var ModalTextSync = document.createElement('p');
ModalTextSync.textContent = "Sync code :";
ModalTextSync.style.marginTop = "15px";
ModalTextSync.style.marginBottom = "15px";
ModalTextSync.style.fontSize = "17px";
ModalTextSync.style.fontWeight = "bold";

var ModalInputSync = document.createElement('input');
ModalInputSync.type = "text";
ModalInputSync.maxLength = 5;
ModalInputSync.style.width = "80%";

var ModalOkSync = btn.cloneNode(false);
ModalOkSync.style.marginTop = "15px";
ModalOkSync.textContent = "Sync";
ModalOkSync.onclick = ModalOkSyncClick;

ModalContentSync.appendChild(ModalCloseBtnSync);
ModalContentSync.appendChild(ModalTextSync);
ModalContentSync.appendChild(ModalInputSync);
ModalContentSync.appendChild(document.createElement('br'));
ModalContentSync.appendChild(ModalOkSync);

function SummonModalSync() {
	ExtContainer.appendChild(ModalScreenSync);
	ModalInputSync.value = "";
	window.onclick = function(event) {
		if (event.target == ModalScreenSync) {
			ModalScreenSync.remove();
			window.onclick = null;
		}
	}
}

function ModalOkSyncClick() {
	spn.textContent = "";
	if (ES) {
		ES.close();
	}

	ModalScreenSync.remove();
	mode = 1;
	SMWASyncBtn.textContent = "Syncing..."
	btn.remove();
	SMOneClickSetBtn.remove();
	SocketMode = false;
	ES = new EventSource("https://repo.mchatx.org/APISync/Client?token=btoken " + ModalInputSync.value + " " + UID);
	ES.onmessage = e => {
		MsgNexus(e.data.toString());
	}
  
	ES.onerror = e => {
		ES.close();
		spn.textContent = "CAN'T REACH SERVER, HALP!";
		CancelConnection();
		SMWASyncBtn.parentNode.insertBefore(btn, SMWASyncBtn);
		btn.parentNode.insertBefore(SMOneClickSetBtn, btn);
		SMWASyncBtn.textContent = "Sync Web Client";
		mode = 0;
	}
	
	ES.onopen = e => {
		mode = 2;
		SMWASyncBtn.textContent = "Synced - Idle"
		var id = setInterval(() => {
			if (ES.readyState == 2){
				clearInterval(id);
				CancelConnection();
				SMWASyncBtn.parentNode.insertBefore(btn, SMWASyncBtn);
				btn.parentNode.insertBefore(SMOneClickSetBtn, btn);
				SMWASyncBtn.textContent = "Sync Web Client";
				mode = 0;
			}
		}, 2000);
	}
}

function CloseModalSyncBtnClick(){
	ModalScreenSync.remove();
}
//======================================== SYNC MODAL CONTROLLER ========================================



//------------------------ TSUGE GUSHI ENCODING------------------------
function TGEncoding(input){
    var output = "";
    var key = "";
    var teethsize = 0;
    var head = 0;

    while (head == 0){
        head = Date.now() % 100;
    }

    input = input.replace(/([^\x00-\x7F]|\%)+/g, SelectiveURIReplacer);
    output = btoa(input);

    key = head.toString();
    
    teethsize = Math.floor(output.length*3.0/4.0);
    for (var i  = 0; i <= head; i++){
        output = output.slice(teethsize) + output.slice(0, teethsize);
    }
    
    for (var i = 0; i <= head; i++){
        if ((/[a-zA-Z]/).test(output[i])){
            key += output[i];
            break;
        }
    }

    for (; key.length < output.length;){
        var TeethLoc = Math.floor(Math.random()*output.length);
        var Halfend = output.slice(TeethLoc);
        output = output.slice(0, TeethLoc);
        key += TeethLoc.toString();
          
        if (Date.now() % 2 == 0){
          key += "~";
        } else {
          key += "|";
        }
  
        key += Halfend[0];
  
          
        Halfend = Halfend.slice(1);
    
        for (var i = 0;((Date.now() % 2 == 0) && (i < 5));i++){
            if (Halfend.length != 0){
                key += Halfend.slice(0,1);
                Halfend = Halfend.slice(1);
            }
            if (key.length > output.length + Halfend.length){
              break;
            }
        }
    
        output += Halfend;
        if (Date.now() % 2 == 0){
            key += "_";
        } else {
            key += "\\";
        }
    
        if (key.length >= output.length){
            break;
        }
    }

    for (var i = 0; ((i < 3) || (Date.now() % 2 != 0)) && (i < key.length/3.0); i++){
        var incision = Math.floor(Math.random()*output.length);
        if (Date.now() % 2 == 0){
            output = output.slice(0, incision) + "~" + output.slice(incision);
        } else {
            output = output.slice(0, incision) + "_" + output.slice(incision);
        }
    }

    output = output + " " + key;
    
    head = Math.floor((Date.now() % 100) * 16.0 / 100.0);
    teethsize = Math.floor(output.length*3.0/4.0);
    for (var i = 0; i <= head; i++){
        output = output.slice(teethsize) + output.slice(0, teethsize);
    }
  
    key = head.toString(16);
    output = key + output;
	
    return (output);
}
    
function TGDecoding(input) {
    var teeth = Number.parseInt(input.slice(0, 1), 16);
    input = input.slice(1);

    var teethsize = input.length - Math.floor(input.length*3.0/4.0);
    for (var i = 0; i <= teeth; i++){
        input = input.slice(teethsize) + input.slice(0, teethsize);
    }

    var output = input.split(" ")[0];
    output = output.replace(/~|_/g, "");
    var key = input.split(" ")[1];

    var cutloc = 0;
    for (cutloc = 0; cutloc < key.length; cutloc++){
        if ((/[a-zA-Z]/).test(key[cutloc])){
            break;
        }
    }
    
    teeth = Number.parseInt(key.slice(0,cutloc));
    
    key = "\\" + key.slice(cutloc + 1);
  
    var cutstring = "";
    var cutstring2 = "";
    
    for (var taking = false; key.length > 0;){
        if((key.slice(-1) == "_") || (key.slice(-1) == "\\")) {
            if (cutstring == ""){
              cutloc = 0
            } else {
              cutloc = Number.parseInt(cutstring);
            }
            output = output.slice(0, cutloc) + cutstring2 + output.slice(cutloc);
            cutstring = "";
            cutstring2 = "";
            taking = false;
        } else if ((key.slice(-1) == "~") || (key.slice(-1) == "|")) {
            taking = true;
        } else if (taking){
            cutstring = key.slice(-1) + cutstring;
        } else {
            cutstring2 = key.slice(-1) + cutstring2;
        }
        key = key.slice(0, key.length - 1);
    }

    teethsize = output.length - Math.floor(output.length*3.0/4.0);
    for (var i = 0; i <= teeth; i++){
        output = output.slice(teethsize) + output.slice(0, teethsize);
    }


	output = atob(output);
	output = decodeURI(output);

    return (output);
}

function SelectiveURIReplacer(match){
    return(encodeURI(match));
}
//======================== TSUGE GUSHI ENCODING ========================