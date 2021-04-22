//--------------------------------------------   ARCHIVE CONTROL   ------------------------------------------------
function LatchToVideo() {
	VidSeek = document.getElementsByTagName('video');
    for (let i = 0; i < VidSeek.length; i++){
        if (VidSeek[i].className == "video-stream html5-main-video"){
			MainVid = VidSeek[i];
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

            break;
        }
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
	ChatText.textContent = inputtext;
	ChatText.dispatchEvent(new InputEvent("input"));
	sendBtn.click();
}

function LatchChatBox(){
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
					ChatBoxObserver.observe(iframeChat[i].parentNode, config2);
				}
			}
			
			break;
        } else if (i == iframeChat.length - 1) {
			ws.close();
			spn.textContent = "Can't find Live Chat Input";
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
				data = {                            
					"Act": 'MChad-Entry',
					"UID": UID,
					"Tag": element.innerText.split("\n")[0],
					"Stime": '',
					"Stext": '',
					"CC": '',
					"OC": ''
				};

				data.Stime = TimespanStringify(MainVid.currentTime);
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
				} else if ((FilterMessageTag(element.innerText.split("\n")[0])) || FilterMessageKeyword(element.innerText.split("\n")[1])) {
					ws.send(JSON.stringify(data));
				}

				//console.log(JSON.stringify(data))
				// SEND THEM TO APP OR FILTER FIRST BEFORE SENDING
			});
        }
    }
}

const ChatboxCheck = function(mutationsList, observer) {
    for(const mutation of mutationsList) {
		if (mutation.type === 'attributes') {
			if(mutation.attributeName == "collapsed")	{
				ws.close();
				spn.textContent = "Chat Box Closed";
			};
        }
    }
}

const config = { childList: true, subtree: false };
const config2 = { attributes: true, childList: false, subtree: false };
const ChatItemObserver = new MutationObserver(callback);
const ChatBoxObserver = new MutationObserver(ChatboxCheck);

function ChatListener(){
	var iframeChat = document.getElementsByTagName("iframe");
	if (iframeChat.length == 0) {
		ws.close();
		mode = 0;
		spn.textContent = "Can't find Chat Box";
	} else {
		for (let i = 0; i < iframeChat.length; i++){
			if (iframeChat[i].id == "chatframe"){
				if (iframeChat[i].getAttribute("src").indexOf("about:blank") != -1){
					ws.close();
					spn.textContent = "Chatbox needs to be open";
				} else {
					var target = iframeChat[i].contentDocument.getElementsByClassName("style-scope yt-live-chat-item-list-renderer");
					for (let j = 0; j < target.length; j++){
						if (target[j].id == "items"){
								ListenerTarget = target[j];
								ChatItemObserver.observe(ListenerTarget, config);
								ChatBoxObserver.observe(iframeChat[i].parentNode, config2);
							break;
						} else if (j == target.length - 1){
							ws.close();
							spn.textContent = "Can't find Chat Box";
						}
					}
				}
				break;
			} else if (i == iframeChat.length - 1){
				ws.close();
				spn.textContent = "Can't find Chat Box";
			}
		}
	}

	VidSeek = document.getElementsByTagName('video');
    for (let i = 0; i < VidSeek.length; i++){
        if (VidSeek[i].className == "video-stream html5-main-video"){
			MainVid = VidSeek[i];
            break;
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
	var title = document.getElementsByClassName("title style-scope ytd-video-primary-info-renderer");

    var data = {                           
		"Act": 'MChad-Reg',
		"UID": UID,
		"Nick": title[0].textContent.replaceAll("】", "]").replaceAll("【", "[").replaceAll("～", "-")
	};	
	ws.send(JSON.stringify(data));
}

function SendRollCall(){
    var data = {                           
		"Act": 'MChad-RollCall',
		"UID": UID,
		"Nick": title[0].textContent.replaceAll("】", "]").replaceAll("【", "[").replaceAll("～", "-")
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
	if (document.location.toString().indexOf("www.youtube.com/watch?v=") != -1){
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
					ChatBoxObserver.disconnect();
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
							if (mode < 3){
								mode = 3;
								btn.textContent = "Synced - Archive (Click to Unsync)";
								LatchToVideo();
							}
							break;
						case ("LiveChat"):
							if (mode < 3){
								mode = 4;
								btn.textContent = "Synced - LiveChat (Click to Unsync)";
								LatchChatBox();
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



//------------------------ TSUGE GUSHI ENCODING------------------------
function TGEncoding(input){
    var output = "";
    var key = "";
    var teethsize = 0;
    var head = 0;

    while (head == 0){
        head = Date.now() % 100;
    }
        
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

    return (output);
}
//======================== TSUGE GUSHI ENCODING ========================



//----------------------------------------- MChad Controller -----------------------------------------
var ExtContainer = document.createElement('div');
ExtContainer.style.background = '';
ExtContainer.id = "Extcontainer";
ExtContainer.style.borderColor = 'black';
ExtContainer.style.borderWidth = '5px'
ExtContainer.style.width = '100%';

var btn = document.createElement('button');
btn.onclick = BtnNexus;
btn.textContent = "Sync MChat"
btn.style.margin = "5px"
btn.style.background = 'white';
btn.style.color = 'black';
btn.style.fontSize = '15px';
btn.style.cursor = 'pointer';
btn.style.textAlign = 'center';
btn.style.borderRadius = '15px';
btn.style.padding = '8px';

var spn = document.createElement('span');
spn.textContent = "";
spn.style.fontSize = '15px';
spn.style.background = 'white';

var LoadHereBtn = document.createElement('button');
LoadHereBtn.onclick = StartHereClick;
LoadHereBtn.textContent = "Open Here";
LoadHereBtn.style.float = "right";
LoadHereBtn.style.margin = "5px"
LoadHereBtn.style.background = 'white';
LoadHereBtn.style.color = 'black';
LoadHereBtn.style.fontSize = '15px';
LoadHereBtn.style.cursor = 'pointer';
LoadHereBtn.style.textAlign = 'center';
LoadHereBtn.style.borderRadius = '15px';
LoadHereBtn.style.padding = '8px';

var CloseBtn = document.createElement('button');
CloseBtn.onclick = CloseBtnClick;
CloseBtn.textContent = "Close";
CloseBtn.style.float = "right";
CloseBtn.style.margin = "5px"
CloseBtn.style.background = 'white';
CloseBtn.style.color = 'black';
CloseBtn.style.fontSize = '15px';
CloseBtn.style.cursor = 'pointer';
CloseBtn.style.textAlign = 'center';
CloseBtn.style.borderRadius = '15px';
CloseBtn.style.padding = '8px';

var BrowseBtn = document.createElement('button');
BrowseBtn.textContent = "Browse";
BrowseBtn.style.margin = "5px"
BrowseBtn.style.background = 'white';
BrowseBtn.style.color = 'black';
BrowseBtn.style.fontSize = '15px';
BrowseBtn.style.cursor = 'pointer';
BrowseBtn.style.textAlign = 'center';
BrowseBtn.style.borderRadius = '15px';
BrowseBtn.style.padding = '8px';

var NoticeSpn = document.createElement('span');
NoticeSpn.textContent = "Starting";
NoticeSpn.style.fontSize = '15px';
NoticeSpn.style.background = 'white';

var CaptionDiv = document.createElement('div')
CaptionDiv.style.position = 'absolute';
CaptionDiv.style.width = '100px';
CaptionDiv.style.height = '20px';

var RResize = document.createElement('div');
RResize.style.position = 'absolute';
RResize.style.cursor = 'col-resize';
RResize.style.right = '0';
RResize.style.top = '0';
RResize.style.height = '100%';
RResize.style.width = '5px';
RResize.style.backgroundColor = "Red";
CaptionDiv.appendChild(RResize);

var LResize = document.createElement('div');
LResize.style.position = 'absolute';
LResize.style.cursor = 'col-resize';
LResize.style.left = '0';
LResize.style.top = '0';
LResize.style.height = '100%';
LResize.style.width = '5px';
LResize.style.backgroundColor = "blue";
CaptionDiv.appendChild(LResize);

var BResize = document.createElement('div');
BResize.style.position = 'absolute';
BResize.style.cursor = 'row-resize';
BResize.style.left = '0';
BResize.style.bottom = '0';
BResize.style.height = '5px';
BResize.style.width = '100%';
BResize.style.backgroundColor = "green";
CaptionDiv.appendChild(BResize);

var TResize = document.createElement('div');
TResize.style.position = 'absolute';
TResize.style.cursor = 'row-resize';
TResize.style.left = '0';
TResize.style.top = '0';
TResize.style.height = '5px';
TResize.style.width = '100%';
TResize.style.backgroundColor = "yellow";
CaptionDiv.appendChild(TResize);

var InnerCaptionDiv = document.createElement('div');
InnerCaptionDiv.style.position = "absolute";
InnerCaptionDiv.style.cursor = 'move';
InnerCaptionDiv.style.left = '5px';
InnerCaptionDiv.style.top = '5px';
InnerCaptionDiv.style.height = 'calc(100% - 10px)';
InnerCaptionDiv.style.width = 'calc(100% - 10px)';
InnerCaptionDiv.style.backgroundColor = "grey";
CaptionDiv.appendChild(InnerCaptionDiv);

var CaptionCanvas = document.createElement('canvas');
CaptionCanvas.style.width = "100%";
CaptionCanvas.style.height = "100%";
var ctx = CaptionCanvas.getContext("2d");
InnerCaptionDiv.appendChild(CaptionCanvas)
var CaptionText = "Lorem ipsum dolor sit amet, autem iudico laboramus duo ne, ius debet definitiones at. Ex paulo munere quaerendum per. Te iusto definitionem eos, disputando disputationi sed ad.";

function LoadButtons() {
	UID = "Youtube " + document.location.toString().substring(document.location.toString().indexOf("watch?v=") + 8);
	var target = document.getElementsByTagName("ytd-video-primary-info-renderer");
	target[0].prepend(ExtContainer);
	ExtContainer.appendChild(btn);
	ExtContainer.appendChild(spn);
	ExtContainer.appendChild(LoadHereBtn);
}

function CloseBtnClick(){
	ExtContainer.appendChild(btn);
	ExtContainer.appendChild(spn);
	spn.textContent = "";
	ExtContainer.appendChild(LoadHereBtn);
	CloseBtn.remove();
	NoticeSpn.remove();
	BrowseBtn.remove();
	CaptionDiv.remove();
}

function StartHereClick(){
	ExtContainer.appendChild(BrowseBtn);
	ExtContainer.appendChild(NoticeSpn);
	ExtContainer.appendChild(CloseBtn);
	ExtContainer.appendChild(CaptionDiv);
	RepaintCaption();
	dragElement(CaptionDiv);
	resizeElement(CaptionDiv);
	btn.remove();
	spn.remove();
	LoadHereBtn.remove();
	if (ws != undefined){
		ws.close();
	}

	NoticeSpn.textContent = "SENDING REQUEST";
	/*
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://repo.mchatx.org/FetchRaw/', true);
	xhr.setRequestHeader('Content-type', 'application/json');
	xhr.onload = function () {
		try {
			var JSONtemp = JSON.parse(xhr.response);	
		} catch (error) {
			NoticeSpn.textContent = "ERROR FETCHING DATA";
			return;
		}
		
		if (!JSONtemp["BToken"]){
			return;
		}

		console.log(TGDecoding(JSONtemp["BToken"]));
	};

	xhr.send('{ "BToken":"' + TGEncoding(JSON.stringify({
		Act: 'ArchiveList',
		Link: "YT_" + UID.split(" ")[1]
	})).replace(/\\/gi, "\\\\") + '" }');
	*/
}

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  InnerCaptionDiv.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function resizeElement(elmnt) {
	var x = 0, y = 0;
	var w = 0, h = 0;
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

	//---------------------- RIGHT HANDLER ----------------------
	RResize.onmousedown = MouseDownR;
	
	function MouseDownR(e) {
		e = e || window.event;
		e.preventDefault();
	
		x = e.clientX;
	
		const styles = window.getComputedStyle(elmnt);
		w = parseInt(styles.width, 10);
	
	    document.onmouseup = closeDragElement;
	    document.onmousemove = elementDragR;
	};
	
	function elementDragR(e) {
		e = e || window.event;
		e.preventDefault();
	
		const dx = e.clientX - x;
	
		elmnt.style.width = `${w + dx}px`;
		RepaintCaption();
	};

	//---------------------- LEFT HANDLER ----------------------
	LResize.onmousedown = MouseDownL;

	function MouseDownL(e) {
		e = e || window.event;
		e.preventDefault();
	
		x = e.clientX;
		pos3 = e.clientX;
	
		const styles = window.getComputedStyle(elmnt);
		w = parseInt(styles.width, 10);

	    document.onmouseup = closeDragElement;
	    document.onmousemove = elementDragL;
	};
	
	function elementDragL(e) {
		e = e || window.event;
		e.preventDefault();
		
		const dx = e.clientX - x;

		pos1 = pos3 - e.clientX;
		pos3 = e.clientX;

		elmnt.style.width = `${w - dx}px`;
		elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
		RepaintCaption();
	};

	function closeDragElement() {
		document.onmouseup = null;
		document.onmousemove = null;
	};

	//---------------------- BOTTOM HANDLER ----------------------
	BResize.onmousedown = MouseDownB;
	
	function MouseDownB(e) {
		e = e || window.event;
		e.preventDefault();
	
		y = e.clientY;
	
		const styles = window.getComputedStyle(elmnt);
		h = parseInt(styles.height, 10);
	
	    document.onmouseup = closeDragElement;
	    document.onmousemove = elementDragB;
	};
	
	function elementDragB(e) {
		e = e || window.event;
		e.preventDefault();
	
		const dy = e.clientY - y;

		elmnt.style.height = `${h + dy}px`;
		RepaintCaption();
	};

	//---------------------- TOP HANDLER ----------------------
	TResize.onmousedown = MouseDownT;

	function MouseDownT(e) {
		e = e || window.event;
		e.preventDefault();
	
		y = e.clientY;
		pos4 = e.clientY;
	
		const styles = window.getComputedStyle(elmnt);
		h = parseInt(styles.height, 10);
	
	    document.onmouseup = closeDragElement;
	    document.onmousemove = elementDragT;
	};
	
	function elementDragT(e) {
		e = e || window.event;
		e.preventDefault();
		
		const dy = e.clientY - y;

		pos2 = pos4 - e.clientY;
		pos4 = e.clientY;

		elmnt.style.height = `${h - dy}px`;
		elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
		RepaintCaption();
	};

	function closeDragElement() {
		document.onmouseup = null;
		document.onmousemove = null;
		//RepaintCaption();
	};

}

function RepaintCaption() {
	CaptionCanvas.width = CaptionCanvas.clientWidth;
	CaptionCanvas.height = CaptionCanvas.clientHeight;
	ctx.textAlign = "center";
	ctx.font = "30px Arial";

	const Textmetric  = ctx.measureText(CaptionText);
	const textheight = Math.abs(Textmetric.actualBoundingBoxAscent) + Math.abs(Textmetric.actualBoundingBoxDescent);

	var TextFragment = CaptionText.split(" ");
	var TextContainer = [];
	for (var StringContainer = "", i = 0; i < TextFragment.length;i++){
		if (StringContainer == ""){
			StringContainer = TextFragment[i];
		} else {
			StringContainer += " " + TextFragment[i];
		}

		if (ctx.measureText(StringContainer).width + 10 > CaptionCanvas.width){
			if (StringContainer.lastIndexOf(" ") == -1){
				TextContainer.push(StringContainer);
				StringContainer = "";
			} else {
				TextContainer.push(StringContainer.substr(0, StringContainer.lastIndexOf(" ")));
				StringContainer = StringContainer.substr(StringContainer.lastIndexOf(" ") + 1);
			}
		}

		if (i == TextFragment.length - 1){
			TextContainer.push(StringContainer);
			const TextYShift = textheight*(TextContainer.length/2.0 - 0.75);

			for (let j = 0; j < TextContainer.length; j++) {
				ctx.fillStyle = "red";
				ctx.fillText(TextContainer[j], CaptionCanvas.width/2.0, CaptionCanvas.height/2.0 - TextYShift + j*textheight);
				ctx.strokeStyle = "white";
				ctx.strokeText(TextContainer[j], CaptionCanvas.width/2.0, CaptionCanvas.height/2.0 - TextYShift + j*textheight);
			}
		}
	}
}
//========================================= MChad Controller =========================================



var ws;

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

async function WaitUntilLoad(){
	var i = 0;
	while (true){
		if (i == 30){
			return;
		}
		var target = document.getElementsByTagName("ytd-video-primary-info-renderer");
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