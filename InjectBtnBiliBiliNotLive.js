//--------------------------------------------   ARCHIVE CONTROL   ------------------------------------------------
function LatchToVideo() {
	VidSeek = document.getElementsByClassName("bilibili-player-video");
	if (VidSeek.length == 0){
		ws.close();
		spn.textContent = "Can't find video player"
		return;
	}

	VidSeek = VidSeek[0].getElementsByTagName('video');
	if (VidSeek.length == 0){
		ws.close();
		spn.textContent = "Can't find video player"
		return;
	}

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



//-------------------------------------   LISTEN TO LIVE CHAT BOX   -----------------------------------------
//   READING LIVE CHAT BOX NODE CHANGE
const callback = function(mutationsList, observer) {
    for(const mutation of mutationsList) {
        if (mutation.type === 'childList') {
			mutation.addedNodes.forEach(element => {
				var authorname = element.innerText.split("\n")[0];
				authorname = authorname.substring(0, authorname.lastIndexOf("@"));
				data = {                            
					"Act": 'MChad-Entry',
					"UID": UID,
					"Tag": authorname,
					"Stime": '',
					"Stext": '',
					"CC": '',
					"OC": ''
				};

				data.Stime = TimespanStringify(VidDur.textContent);
				data.Stext = "[" + authorname + "] " + element.innerText.split("\n")[1];
				
				if ((TagList.length == 0) && (KeyWordList.length == 0)){
					ws.send(JSON.stringify(data));
				} else if ((FilterMessageTag(authorname)) || FilterMessageKeyword(element.innerText.split("\n")[1])) {
					ws.send(JSON.stringify(data));
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
	var Chatbox = document.getElementsByClassName("tw-comment-list-view__scroller");
	if (Chatbox.length == 1){
		ListenerTarget = Chatbox[0].firstChild;
		ChatItemObserver.observe(ListenerTarget, config);
	} else {
		ws.close();
		spn.textContent = "Can't find Chat Box";
	}

	VidDur = document.getElementById("updatetimer");
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
	var title = document.getElementsByClassName("video-title")[0];
	UID = document.location.toString().substring(document.location.toString().lastIndexOf("/") + 1);
	if (UID.indexOf("?") != -1){
		UID.substring(0, UID.indexOf("?"));
	}
	UID = "BiliBili " + UID;
	
    var data = {                           
		"Act": 'MChad-Reg',
		"UID": UID,
		"Nick": title.textContent.replaceAll("】", "]").replaceAll("【", "[").replaceAll("～", "-")
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
	if (document.location.toString().indexOf("://www.bilibili.com/video/") != -1){
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
	var NexusParse = StringData.toString().match(/\"Act\":\"MChad-RegOK\"|\"Act\":\"MChad-RollCallApp\"|\"Act\":\"MChad-SetMode\"|\"Act\":\"MChad-PlayApp\"|\"Act\":\"MChad-PauseApp\"|\"Act\":\"MChad-TimeSetApp\"|\"Act\":\"MChad-RegListener\"|\"Act\":\"MChad-FilterApp\"|\"Act\":\"MChad-PreciseSyncApp\"|\"Act\":\"MChad-PreciseTimeSetApp\"/);
	
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
								mode = 3;
								btn.textContent = "Synced - Archive (Click to Unsync)";
								LatchToVideo();
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
								spn.textContent = "NO LIVE STREAM = NO LIVE CHAT";
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
			case ("\"Act\":\"MChad-RegListener\""):
				if (mode < 3){
					mode = 2;
					btn.textContent = "Synced - Idle";
					spn.textContent = "NOPE NOT WORKING YET";
					/*
					mode = 5;
					btn.textContent = "Synced - Listener (Click to Unsync)";
					ChatListener();
					*/
				}
				break;
			case ("\"Act\":\"MChad-FilterApp\""):
				/*
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
				*/
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
	var target = document.getElementById("arc_toolbar_report");
	var ExtContainer = document.createElement('div');
	ExtContainer.id = "Extcontainer";
	target.after(ExtContainer);
	ExtContainer.appendChild(btn);
	ExtContainer.appendChild(spn);
}

async function WaitUntilLoad(){
	var i = 0;
	while (true){
		if (i == 30){
			return;
		}
		var target = document.getElementsByClassName("nav-search-box");
		if (target.length != 0){
			if (document.getElementById("Extcontainer") != null){
				var Extcontainer = document.getElementById("Extcontainer");
				Extcontainer.parentNode.removeChild(Extcontainer);
			}
			LoadButtons();
			break;
		} else {
			console.log("Not loaded yet");
		}
		i++;
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
}

WaitUntilLoad();
