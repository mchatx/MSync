//--------------------------------------------   ARCHIVE CONTROL   ------------------------------------------------
function LatchToVideo() {
	VidSeek = document.getElementsByTagName('video');
	if (VidSeek.length == 1){
		MainVid = VidSeek[0];

		if (mode == 6){
			SendSeekPrecise(MainVid.currentTime);

			MainVid.onseeked = function() {
				SendSeekPrecise(MainVid.currentTime); //   It's in seconds.miliseconds format
			};
		} else {
			SendSeek(MainVid.currentTime);

			MainVid.onseeked = function() {
				SendSeek(MainVid.currentTime); //   It's in seconds.miliseconds format
			};
		}

		if (!MainVid.paused){
			SendPlay();
		}

		MainVid.onpause = function() {
			SendPause();
		};
		MainVid.onplay = function() {
			SendPlay();
		};
	}
}

function SendSeek(timestring){
    var data = {                           
		"Act": 'MChad-TimeSet',
		"UID": UID,
		"Time": timestring           
	};
	ws.send(JSON.stringify(data));
}

function SendPlay(){
    var data = {                           
		"Act": 'MChad-Play',
		"UID": UID
	};
	ws.send(JSON.stringify(data));
}

function SendPause(){
    var data = {                           
		"Act": 'MChad-Pause',
		"UID": UID
	};
	ws.send(JSON.stringify(data));
}

function SetTime(timeseek) {
    if (timeseek.valueAsNumber != NaN){
        if (timeseek > 0){
			if (MainVid.duration > timeseek){
				MainVid.currentTime = timeseek;
			} else {
				if (!MainVid.ended){
					MainVid.currentTime = MainVid.duration;
				}
			}
		}
    }
}

function SendSeekPrecise(timestring){
    var data = {                           
		"Act": 'MChad-PreciseSync',
		"UID": UID,
		"Time": timestring.toString(),
		"Stamp": new Date().getTime()
	};
	ws.send(JSON.stringify(data));
}

function SetTimePrecise(timeseek, timestamp) {
	timeseek -= (timestamp - (new Date().getTime()))*0.001;
    if (timeseek.valueAsNumber != NaN){
        if (timeseek > 0){
			if (MainVid.duration > timeseek){
				MainVid.currentTime = timeseek;
			} else {
				if (!MainVid.ended){
					MainVid.currentTime = MainVid.duration;
				}
			}
		}
    }
}
//=============================================================================================================



//---------------------------------------   BOUNCING TRANSLATION   -------------------------------------------
//   BOUNCING INCOMING MESSAGE TO THE LIVE CHAT SUBMITTER 

function SendTextEnter(inputtext){
	/*
	ChatText.textContent = inputtext;
	ChatText.dispatchEvent(new InputEvent("input"));
	sendBtn.click();
	*/
}

function LatchChatBox(){
	/*
	var testN = document.getElementsByClassName("tw-player-page__comment__post tw-comment-post");
	console.log(testN[0].tagName);
	if (testN.length == 1){
		ChatText = testN[0].querySelector(".tw-textarea");
		console.log(ChatText);
		console.log(ChatText.textContent);
		ChatText.textContent = "Oh no, I missed Aki-chan twitcast again!!";
		
		ChatText.dispatchEvent(new InputEvent("input"));
		
		sendBtn = testN[0].querySelector(".tw-comment-post-operations button");
	}
	*/
	/*
	var iframeChat = document.getElementsByTagName("iframe");
    for (let i = 0; i < iframeChat.length; i++){
        if (iframeChat[i].id == "chatframe"){
			if (iframeChat[i].offsetHeight == 0){
				ws.close();
				spn.textContent = "Chatbox needs to be open";
			} else {
				ChatInputPanel = iframeChat[i].contentDocument.querySelector("#panel-pages.yt-live-chat-renderer",);
				if (ChatInputPanel.offsetHeight == 1){
					ws.close();
					spn.textContent = "The stream is not LIVE"
				} else {
					sendBtn = iframeChat[i].contentDocument.querySelector("#send-button button",); 
					ChatText = iframeChat[i].contentDocument.querySelector("#input.yt-live-chat-text-input-field-renderer",);
				}
			}
			
			break;
        } else if (i == iframeChat.length - 1) {
			ws.close();
			spn.textContent = "Can't find Live Chat Input";
		}
	}
	*/
}
//=============================================================================================================



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
					data.Stime = TimespanStringify2(MainVid.currentTime);
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
		var Chatbox = document.getElementsByClassName("simplebar-content");
		for (var i = 0; i < Chatbox.length; i++){
			if(Chatbox[i].className == "simplebar-content"){
				ListenerTarget = Chatbox[i].firstChild;
				ChatItemObserver.observe(ListenerTarget, config);	

				VidSeek = document.getElementsByTagName('video');
				if (VidSeek.length == 1){
					MainVid = VidSeek[0];
				}
			} else if (i == Chatbox.length - 1){
				ws.close();
				spn.textContent = "Can't find Chat Box";
			}
		}
	} else {
		var Chatbox = document.getElementsByTagName("ul");
		
		for (var i = 0; i < Chatbox.length; i++){
			if (Chatbox[i].className == "tw-align-items-end tw-flex tw-flex-wrap tw-full-width"){
				ListenerTarget = Chatbox[i];
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
	var title = document.getElementsByTagName("h2");
	UID = document.location.toString().substring(document.location.toString().lastIndexOf("/") + 1);
	if (UID.indexOf("?") != -1){
		UID.substring(0, UID.indexOf("?"));
	}
	UID = "Twitch " + UID;

	if (document.location.toString().indexOf("/video") == -1){
		Live = true;
	} else {
		Live = false;
	}
	
    var data = {                           
		"Act": 'MChad-Reg',
		"UID": UID,
		"Nick": title[0].textContent.substring(0, title[0].textContent.lastIndexOf("•")).trim()
	};	
	ws.send(JSON.stringify(data));
}

function SendRollCall(){
    var data = {                           
		"Act": 'MChad-RollCall',
		"UID": UID,
		"Nick": title.textContent.substring(0, title.textContent.lastIndexOf("#")).trim()
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
			switch (mode){
				case 1:
					spn.textContent = "Can't reach server";
					break;
				case 3:
					MainVid.onseeked = null;
					MainVid.onpause = null;
					MainVid.onplay = null;
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
					break;
				case 6:
					MainVid.onseeked = null;
					MainVid.onpause = null;
					MainVid.onplay = null;
					spn.textContent = "Disconnected";
					break;	
			}
			btn.textContent = "Sync MChat";
			mode = 0;
        };
		
		ws.onmessage = function (event) {
			MsgNexus(event.data.toString());
		};
	
	} else {
		alert('NOT IN SYNCING TARGET WEBPAGE');
	}
}

function MsgNexus(StringData) {
	var NexusParse = StringData.toString().match(/\"Act\":\"MChad-RegOK\"|\"Act\":\"MChad-RollCallApp\"|\"Act\":\"MChad-SetMode\"|\"Act\":\"MChad-PlayApp\"|\"Act\":\"MChad-PauseApp\"|\"Act\":\"MChad-TimeSetApp\"|\"Act\":\"MChad-LiveSend\"|\"Act\":\"MChad-RegListener\"|\"Act\":\"MChad-FilterApp\"|\"Act\":\"MChad-PreciseSyncApp\"|\"Act\":\"MChad-PreciseTimeSetApp\"/);
	
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
							if (Live){
								mode = 2;
								btn.textContent = "Synced - Idle";
								spn.textContent = "THE VIDEO IS A LIVESTREAM";
							} else {
								if (mode < 3){
									mode = 3;
									btn.textContent = "Synced - Archive (Click to Unsync)";
									LatchToVideo();
								}
							}
							break;
						case ("LiveChat"):
							if (mode < 3){
								/*
								mode = 4;
								btn.textContent = "Synced - LiveChat (Click to Unsync)";
								LatchChatBox();
								*/
								mode = 2;
								btn.textContent = "Synced - Idle";
								spn.textContent = "LIVE CHAT BOUNCING IS NOT AVAILABLE FOR TWITCH";
							}
							break;

						case ("SyncTL"):
							if (mode < 3){
								mode = 6;
								btn.textContent = "Synced - Precise Sync Mode (Click to Unsync)";
								LatchToVideo();
							}
							break;
	
					}
				}
				break;
			case ("\"Act\":\"MChad-PlayApp\""):
				var ParsedData = StringData.toString().split("\",\"");
				if (ParsedData.length != 2){
					return;
				}
				if ((ParsedData[1].split("\":\"")[1].replace("\"}","") == UID) && ((mode == 3) || (mode == 6))){
					MainVid.play();
				}
				break;
			case ("\"Act\":\"MChad-PauseApp\""):
				var ParsedData = StringData.toString().split("\",\"");
				if (ParsedData.length != 2){
					return;
				}
		
				if ((ParsedData[1].split("\":\"")[1].replace("\"}","") == UID) && ((mode == 3) || (mode == 6))){
					MainVid.pause();
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
						break;						
				}
				spn.textContent = "Synced Filter"
				break;

			case ("\"Act\":\"MChad-PreciseSyncApp\""):
				var ParsedData = StringData.toString().split("\",\"");
				if (ParsedData.length != 2){
					return;
				}
						
				if ((ParsedData[1].split("\":\"")[1].replace("\"}","") == UID) && (mode == 6)){
					SendSeekPrecise(MainVid.currentTime);
				}				
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



var ws;
var btn = document.createElement('button');
btn.onclick = BtnNexus;
btn.textContent = "Sync MChat"
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
spn.style.background = 'white';

var MainVid = document.createElement('video');
var sendBtn; 
var ChatText;
var ListenerTarget;
var ChatInputPanel;

var UID = "";
var mode = 0;
var Live = false;
/*
	0 : NOT SYNCED
	1 : SYNCING
	2 : SYNCED-IDLE
	3 : SYNCED-ARCHIVE
	4 : SYNCED-LIVECHAT
	5 : SYNCED-LISTENER
	6 : SYNCED TL
*/

function LoadButtons() {
	var target = document.getElementsByClassName("tw-border-t");
	var ExtContainer = document.createElement('div');
	ExtContainer.id = "Extcontainer";
	target[0].prepend(ExtContainer);
	ExtContainer.appendChild(btn);
	ExtContainer.appendChild(spn);
}

async function WaitUntilLoad(){
	var i = 0;
	while (true){
		if (i == 30){
			return;
		}
		var target = document.getElementsByClassName("tw-border-t");
		if (target.length != 0){
			if (target[0].className == "tw-border-t") {
				if (document.getElementById("Extcontainer") != null){
					var Extcontainer = document.getElementById("Extcontainer");
					Extcontainer.parentNode.removeChild(Extcontainer);
				}
				LoadButtons();
				break;
			}
		} else {
			console.log("Not loaded yet");
		}
		i++;
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
}

WaitUntilLoad();