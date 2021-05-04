//-------------------------------------------  HEAD VARIABLES  -------------------------------------------
const VideoElementID = "video-stream html5-main-video";
const ExtContainerParentID = "ytd-video-primary-info-renderer";
var UID = "Youtube " + document.location.toString().substring(document.location.toString().indexOf("watch?v=") + 8);
//===========================================  HEAD VARIABLES  ===========================================



//--------------------------------------------   ARCHIVE CONTROL   ------------------------------------------------
function LatchToVideo() {
	VidSeek = document.getElementsByTagName('video');
    for (let i = 0; i < VidSeek.length; i++){
        if (VidSeek[i].className == VideoElementID){
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
        if (VidSeek[i].className == VideoElementID){
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

//--------------------------------------- START MENU CONTROLLER ---------------------------------------
var ExtContainer = document.createElement('div');
ExtContainer.id = "Extcontainer";
ExtContainer.style.border = "1px solid black"; 
ExtContainer.style.width = '100%';
ExtContainer.style.backgroundColor = "white";

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

var SMLoadHereBtn = btn.cloneNode(false);
SMLoadHereBtn.onclick = StartHereClick;
SMLoadHereBtn.textContent = "Open Here";
SMLoadHereBtn.style.float = "right";

function LoadButtons() {
	var target = document.getElementsByTagName(ExtContainerParentID);
	target[0].prepend(ExtContainer);
	ExtContainer.appendChild(btn);
	ExtContainer.appendChild(spn);
	ExtContainer.appendChild(SMLoadHereBtn);

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

function StartHereClick(){
	SummonMainMenu();

	VidEle = document.getElementsByTagName('video');
    for (let i = 0; i < VidEle.length; i++){
        if (VidEle[i].className == VideoElementID){
			DocLeftOffset = window.pageXOffset || document.documentElement.scrollLeft,
			DocTopOffset = window.pageYOffset || document.documentElement.scrollTop;

			ExtContainer.appendChild(CaptionDiv);

			CaptionDiv.style.backgroundColor = CaptionColour;
			CaptionDiv.style.width = (VidEle[i].getBoundingClientRect().right - VidEle[i].getBoundingClientRect().left)*0.8 + "px";
			CaptionDiv.style.left = (VidEle[i].getBoundingClientRect().left + DocLeftOffset + (VidEle[i].getBoundingClientRect().right - VidEle[i].getBoundingClientRect().left)*0.1) + "px";
			RepaintResizeRelocateCaption(VidEle[i]);
			break;
        }
    }

	CaptionDiv.onmouseover= CaptionMouseIn; 
	CaptionDiv.onmouseout= CaptionMouseOut;

	dragElement(CaptionDiv);
	resizeElement(CaptionDiv);
	btn.remove();
	spn.remove();
	SMLoadHereBtn.remove();
	if (ws != undefined){
		ws.close();
	}
}
//======================================= START MENU CONTROLLER =======================================



//--------------------------------------- MAIN MENU CONTROLLER ---------------------------------------
var MMCloseBtn = btn.cloneNode(false);
MMCloseBtn.onclick = MMCloseBtnClick;
MMCloseBtn.textContent = "Close";
MMCloseBtn.style.float = "right";

var MMReloadCaptionBtn = btn.cloneNode(false);
MMReloadCaptionBtn.onclick = MMReloadCaption;
MMReloadCaptionBtn.textContent = "Reload Caption";
MMReloadCaptionBtn.style.float = "right";

var MMCaptionOptionBtn = btn.cloneNode(false);
MMCaptionOptionBtn.onclick = MMCaptionOptionOpen;
MMCaptionOptionBtn.textContent = "Caption Option";
MMCaptionOptionBtn.style.float = "right";

var MMRoomBtn = btn.cloneNode(false);
MMRoomBtn.textContent = "Room";
MMRoomBtn.onclick = RoomBtnClick;

var MMArchiveBtn = btn.cloneNode(false);
MMArchiveBtn.textContent = "Archive";
MMArchiveBtn.onclick = MMArchiveBtnClick;

var NoticeSpn = document.createElement('span');
NoticeSpn.style.fontSize = '15px';
NoticeSpn.style.background = 'white';

function MMAccBtnClick() {
	SummonAccModal("");
}

function MMArchiveBtnClick(){
	RemoveMainMenu();
	SummonArchiveMenu();
	ARSearchLinkBtnClick();
}

function RoomBtnClick(){
	RemoveMainMenu();
	SummonRoomMenu();
	RoomSearchLinkBtnClick();
}

function RemoveMainMenu(){
	MMCloseBtn.remove();
	NoticeSpn.remove();
	MMRoomBtn.remove();
	MMArchiveBtn.remove();
	MMReloadCaptionBtn.remove();
	MMCaptionOptionBtn.remove();
	AccStatContainer.remove();
}

function SummonMainMenu(){
	ExtContainer.appendChild(MMRoomBtn);
	ExtContainer.appendChild(MMArchiveBtn);
	ExtContainer.appendChild(NoticeSpn);
	ExtContainer.appendChild(MMCloseBtn);
	ExtContainer.appendChild(MMReloadCaptionBtn);
	ExtContainer.appendChild(MMCaptionOptionBtn);
	SummonStatAccContainer();
	CaptionText = "Caption Box.";
}

function MMCaptionOptionOpen(){
	RemoveMainMenu();
	SummonCaptionOption();
}

function MMReloadCaption(){
	VidEle = document.getElementsByTagName('video');
    for (let i = 0; i < VidEle.length; i++){
        if (VidEle[i].className == VideoElementID){
			DocLeftOffset = window.pageXOffset || document.documentElement.scrollLeft,
			DocTopOffset = window.pageYOffset || document.documentElement.scrollTop;

			CaptionDiv.style.backgroundColor = CaptionColour;
			CaptionDiv.style.width = (VidEle[i].getBoundingClientRect().right - VidEle[i].getBoundingClientRect().left)*0.8 + "px";
			CaptionDiv.style.left = (VidEle[i].getBoundingClientRect().left + DocLeftOffset + (VidEle[i].getBoundingClientRect().right - VidEle[i].getBoundingClientRect().left)*0.1) + "px";
			RepaintResizeRelocateCaption(VidEle[i]);
			break;
        }
    }
}

function MMCloseBtnClick(){
	ExtContainer.appendChild(btn);
	ExtContainer.appendChild(spn);
	spn.textContent = "";
	ExtContainer.appendChild(SMLoadHereBtn);
	CaptionDiv.remove();
	StopListening();
	StopArchive();

	RemoveMainMenu();
}
//======================================= MAIN MENU CONTROLLER =======================================



//------------------------------------------ ROOM CONTROLLER ------------------------------------------
var RoomES;

//~~~~~~~~~~~~~~~~~~~~~	ROOM CONTAINER AND CARD TEMPLATES ~~~~~~~~~~~~~~~~~~~~~
var RoomContainer = ExtContainer.cloneNode(false);
RoomContainer.id = "RoomContainer";

var RoomCardTemplate = document.createElement('div');
RoomCardTemplate.style.border = "1px dashed black"; 
RoomCardTemplate.style.width = "100%";
RoomCardTemplate.style.display = "flex";
RoomCardTemplate.style.flexDirection = "row";

var RoomCardText = document.createElement('span');
RoomCardText.style.alignSelf = "center";
RoomCardText.style.textAlign = "center";
RoomCardText.style.fontSize = '15px';
RoomCardText.style.background = 'white';

var RoomCardOpenBtn = btn.cloneNode(false);
RoomCardOpenBtn.textContent = "Listen";
RoomCardOpenBtn.style.alignSelf = "center";

var RoomCardLockspan = document.createElement('span');
RoomCardLockspan.style.alignSelf = "center";
RoomCardLockspan.style.fontSize = "28px";
RoomCardLockspan.style.fontWeight = "bold";

function AddRoomCard(RoomName, Locked, Link, Tags){
	var RName = RoomCardText.cloneNode(true);
	RName.style.width = "25%";
	RName.textContent = RoomName;

	var RLink = RoomCardText.cloneNode(true);
	RLink.style.width = "35%";
	if (!Link){		
		RLink.style.color = "#aaa";
		RLink.textContent = "No link provided";
	} else if (Link == ""){
		RLink.style.color = "#aaa";
		RLink.textContent = "No link provided";
	} else {
		RLink.textContent = Link;
	}

	var RTags = RoomCardText.cloneNode(true);
	RTags.style.width = "30%";
	if (!Tags){
		RTags.style.color = "#aaa";
		RTags.textContent = "No tags provided";
	} else if (Tags == ""){
		RTags.style.color = "#aaa";
		RTags.textContent = "No tags provided";
	} else {
		RTags.textContent = Tags;
	}

	var OpenBtn = RoomCardOpenBtn.cloneNode(true);
	OpenBtn.onclick = function() {
		if (Locked) {
			SummonModal(RoomName, true, null);
		} else {
			StartListening(RoomName, null);
		}
	}

	var Lockspan = RoomCardLockspan.cloneNode(true);
	if (Locked){
		Lockspan.textContent = "🔒";
	} else {
		Lockspan.textContent = "🔓";
	}

	var RCPanel = RoomCardTemplate.cloneNode(true);
	RCPanel.appendChild(OpenBtn);
	RCPanel.appendChild(RName);
	RCPanel.appendChild(RLink)
	RCPanel.appendChild(RTags)
	RCPanel.appendChild(Lockspan);
	
	RoomContainer.appendChild(RCPanel);
}

function StopListening(){
	if (RoomES){
		RoomES.close();
		StatText.textContent = "Stop listening";
	}
}

function StartListening(RoomName, Password){
	StopListening();
	StopArchive();
	ResetRoomContainer();
	RemoveRoomMenu();
	SummonMainMenu();

	var BToken = "";
	if (!Password){
		BToken = TGEncoding(JSON.stringify({
			Act: 'Listen',
			Room: RoomName
		})).replace(/ /gi, "%20");
	} else {
		BToken = TGEncoding(JSON.stringify({
			Act: 'Listen',
			Room: RoomName,
			Pass: Password
		})).replace(/ /gi, "%20");
	}

	StatText.textContent = "Listening to " + RoomName;
	RoomES = new EventSource('https://repo.mchatx.org/FetchRaw/?BToken=' + BToken);

	RoomES.onmessage = function (e) {
		if (e.data == '{ "flag":"Connect", "content":"CONNECTED TO SECURE SERVER"}'){
		} else if (e.data != '{}'){
			var DecodedString = TGDecoding(e.data);
			if (DecodedString == '{ "flag":"Timeout", "content":"Translator side time out" }'){
				StopListening();
			} else {
				var dt = JSON.parse(DecodedString);
				if (dt["flag"] == "insert"){
					CaptionText = dt["content"]["Stext"];
					if (!dt["content"]["CC"]){
						CaptionCC = "#FFFFFF";
					} else {
						CaptionCC = "#" + dt["content"]["CC"];
					}
					if (!dt["content"]["OC"]){
						CaptionOC = "#000000";
					} else {
						CaptionOC = "#" + dt["content"]["OC"];
					}
					RepaintResizeRelocateCaption(null);
				}
			}
		}
	}

	RoomES.onerror = function() {
		CaptionText = "CONNECTION ERROR";
		CaptionOC = "#000000";
		CaptionCC = "#FFFFFF";
		MMReloadCaption();
		StopListening();
	  };

  	RoomES.onopen = function() {
		CaptionText = "Connected to server";
		CaptionOC = "#000000";
		CaptionCC = "#FFFFFF";
		MMReloadCaption();
	};
}

//~~~~~~~~~~~~~~~~~~~~~ BUTTONS ~~~~~~~~~~~~~~~~~~~~~
var RoomBrowseAll = btn.cloneNode(false);
RoomBrowseAll.onclick = RoomBrowseAllBtnClick;
RoomBrowseAll.textContent = "Browse All";

var RoomSearchBtn = btn.cloneNode(false);
RoomSearchBtn.textContent = "Search By Name";
RoomSearchBtn.onclick = RoomSearchBtnClick;

var RoomNameInput = document.createElement('input');
RoomNameInput.type = "text";
RoomNameInput.placeholder = "Room name here..."

var RoomSearchLinkBtn = btn.cloneNode(false);
RoomSearchLinkBtn.textContent = "Search By Link";
RoomSearchLinkBtn.onclick = RoomSearchLinkBtnClick;

var RoomBackBtn = btn.cloneNode(false);
RoomBackBtn.style.float = "right";
RoomBackBtn.textContent = "Back";
RoomBackBtn.onclick = RoomBackBtnClick;

function SummonRoomMenu(){
	ExtContainer.parentNode.insertBefore(RoomContainer, ExtContainer.nextSibling);
	ExtContainer.appendChild(RoomBackBtn);
	ExtContainer.appendChild(RoomBrowseAll);
	ExtContainer.appendChild(RoomSearchBtn);
	ExtContainer.appendChild(RoomNameInput);
	ExtContainer.appendChild(RoomSearchLinkBtn);
}

function RemoveRoomMenu(){
	RoomBackBtn.remove();
	RoomSearchBtn.remove();
	RoomNameInput.remove();
	RoomSearchLinkBtn.remove();
	RoomBrowseAll.remove();
	RoomContainer.remove();
}

function RoomBackBtnClick() {
	SummonMainMenu();
	RemoveRoomMenu();
}

function ResetRoomContainer(){
	while (RoomContainer.lastChild){
		RoomContainer.removeChild(RoomContainer.lastChild);
	}
}

function RoomSearchLinkBtnClick(){
	ResetRoomContainer();
	var RCT = RoomCardText.cloneNode(true);
	RCT.style.width = "100%";
	var RCPanel = RoomCardTemplate.cloneNode(true);
	RCT.textContent = "QUERYING DATA";
	RCPanel.appendChild(RCT);
	RoomContainer.appendChild(RCPanel);

	var xhr = new XMLHttpRequest();
	xhr.open('GET', 'https://repo.mchatx.org/Room/?link=YT_' + UID.split(" ")[1], true);
	xhr.onload = function () {
		ResetRoomContainer();
		try {

			if(xhr.response == "[]"){
				var RCT = RoomCardText.cloneNode(true);
				RCT.style.width = "100%";
				var RCPanel = RoomCardTemplate.cloneNode(true);
			
				RCT.textContent = "FOUND ZERO HIT";
				RCPanel.appendChild(RCT);
				
				RoomContainer.appendChild(RCPanel);
			} else {
				JSON.parse(xhr.response).map( e => {
					AddRoomCard(e["Nick"], e["EntryPass"], e["StreamLink"], e["Tags"]);
				})
			}
		} catch (error) {
			var RCT = RoomCardText.cloneNode(true);
			RCT.style.width = "100%";
			var RCPanel = RoomCardTemplate.cloneNode(true);
		
			RCT.textContent = "FAIL FETCHING DATA";
			RCPanel.appendChild(RCT);
			
			RoomContainer.appendChild(RCPanel);
		} 
	};
	xhr.send(null);

	RoomNameInput.value = "";
}

function RoomBrowseAllBtnClick(){
	ResetRoomContainer();

	var RCT = RoomCardText.cloneNode(true);
	RCT.style.width = "100%";
	var RCPanel = RoomCardTemplate.cloneNode(true);
	RCT.textContent = "QUERYING DATA";
	RCPanel.appendChild(RCT);
	RoomContainer.appendChild(RCPanel);

	var xhr = new XMLHttpRequest();
	xhr.open('GET', 'https://repo.mchatx.org/Room/', true);
	xhr.onload = function () {
		ResetRoomContainer();
		try {
			JSON.parse(xhr.response).map( e => {
				AddRoomCard(e["Nick"], e["EntryPass"], e["StreamLink"], e["Tags"]);
			})
		} catch (error) {
			var RCT = RoomCardText.cloneNode(true);
			RCT.style.width = "100%";
			var RCPanel = RoomCardTemplate.cloneNode(true);
		
			RCT.textContent = "FAIL FETCHING DATA";
			RCPanel.appendChild(RCT);
			
			RoomContainer.appendChild(RCPanel);
		} 
	};
	xhr.send(null);

	RoomNameInput.value = "";
}

function RoomSearchBtnClick() {
	ResetRoomContainer();
	var RCT = RoomCardText.cloneNode(true);
	RCT.style.width = "100%";
	var RCPanel = RoomCardTemplate.cloneNode(true);
	RCT.textContent = "QUERYING DATA";
	RCPanel.appendChild(RCT);
	RoomContainer.appendChild(RCPanel);

	var xhr = new XMLHttpRequest();
	xhr.open('GET', 'https://repo.mchatx.org/Room/?room=' + RoomNameInput.value, true);
	xhr.onload = function () {
		ResetRoomContainer();
		try {

			if(xhr.response == "[]"){
				var RCT = RoomCardText.cloneNode(true);
				RCT.style.width = "100%";
				var RCPanel = RoomCardTemplate.cloneNode(true);
			
				RCT.textContent = "FOUND ZERO HIT";
				RCPanel.appendChild(RCT);
				
				RoomContainer.appendChild(RCPanel);
			} else {
				JSON.parse(xhr.response).map( e => {
					AddRoomCard(e["Nick"], e["EntryPass"], e["StreamLink"], e["Tags"]);
				})
			}
		} catch (error) {
			var RCT = RoomCardText.cloneNode(true);
			RCT.style.width = "100%";
			var RCPanel = RoomCardTemplate.cloneNode(true);
		
			RCT.textContent = "FAIL FETCHING DATA";
			RCPanel.appendChild(RCT);
			
			RoomContainer.appendChild(RCPanel);
		} 
	};
	xhr.send(null);

	RoomNameInput.value = "";
}
//========================================== ROOM CONTROLLER ==========================================



//---------------------------------------- ARCHIVE CONTROLLER ----------------------------------------
var ArchiveEntries = {};
var TimerHandleID;
var TimeNow = 0;
var CurrentEntryIndex = 0;
var TimeShift = 0;
var ArchiveID = "";

//~~~~~~~~~~~~~~~~~~~~~	ARCHIVE CONTAINER AND CARD TEMPLATES ~~~~~~~~~~~~~~~~~~~~~
var ARContainer = ExtContainer.cloneNode(false);
ARContainer.id = "ARContainer";

var ARCardTemplate = document.createElement('div');
ARCardTemplate.style.border = "1px dashed black"; 
ARCardTemplate.style.width = "100%";
ARCardTemplate.style.display = "flex";
ARCardTemplate.style.flexDirection = "row";

var ARCardText = document.createElement('span');
ARCardText.style.alignSelf = "center";
ARCardText.style.textAlign = "center";
ARCardText.style.fontSize = '15px';
ARCardText.style.background = 'white';

var ARCardOpenBtn = btn.cloneNode(false);
ARCardOpenBtn.textContent = "Load";
ARCardOpenBtn.style.alignSelf = "center";

var ARCardLockspan = document.createElement('span');
ARCardLockspan.style.alignSelf = "center";
ARCardLockspan.style.fontSize = "28px";
ARCardLockspan.style.fontWeight = "bold";

function AddARCard(Nick, Link, Locked, StreamLink, Tags, ARID){
	var RName = ARCardText.cloneNode(true);
	RName.style.width = "35%";
	RName.textContent = Nick;

	var RLink = ARCardText.cloneNode(true);
	RLink.style.width = "35%";
	if (!StreamLink){		
		RLink.style.color = "#aaa";
		RLink.textContent = "No link provided";
	} else if (Link == ""){
		RLink.style.color = "#aaa";
		RLink.textContent = "No link provided";
	} else {
		RLink.textContent = StreamLink;
	}

	var RTags = ARCardText.cloneNode(true);
	RTags.style.width = "20%";
	if (!Tags){
		RTags.style.color = "#aaa";
		RTags.textContent = "No tags provided";
	} else if (Tags == ""){
		RTags.style.color = "#aaa";
		RTags.textContent = "No tags provided";
	} else {
		RTags.textContent = Tags;
	}

	var OpenBtn = ARCardOpenBtn.cloneNode(true);
	OpenBtn.onclick = function() {
		if (Locked) {
			SummonModal(Link, false, ARID);
		} else {
			ArchiveGet(Link, null, ARID);
		}
	}

	var Lockspan = ARCardLockspan.cloneNode(true);
	if (Locked){
		Lockspan.textContent = "🔒";
	} else {
		Lockspan.textContent = "🔓";
	}

	var RCPanel = ARCardTemplate.cloneNode(true);
	RCPanel.appendChild(OpenBtn);
	RCPanel.appendChild(RName);
	RCPanel.appendChild(RLink)
	RCPanel.appendChild(RTags)
	RCPanel.appendChild(Lockspan);
	
	ARContainer.appendChild(RCPanel);
}

function StopArchive(){
	for (var Entry in ArchiveEntries) {
		delete ArchiveEntries[Entry];
	}
	StopLatchCaptionArchive();
}

function ArchiveGet(Link, Password, ARID){
	StopListening();
	StopArchive();

	ArchiveID = ARID;

	var BToken = "";
	if (!Password){
		BToken = TGEncoding(JSON.stringify({
			Act: 'GetArchive',
			ARLink: Link
		})).replace(/\\/gi, "\\\\");
	} else {
		BToken = TGEncoding(JSON.stringify({
			Act: 'GetArchive',
			ARLink: Link,
			Pass: Password
		})).replace(/\\/gi, "\\\\");
	}

	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://repo.mchatx.org/FetchRaw/', true);
	xhr.setRequestHeader('Content-type', 'application/json');
	xhr.onload = function () {
		try {
			var JSONtemp = JSON.parse(xhr.response);	
		} catch (error) {
			CaptionText = "FAILED FETCHING DATA";
			CaptionOC = "#000000";
			CaptionCC = "#FFFFFF";
			MMReloadCaption();
			return;
		}
		
		if (!JSONtemp["BToken"]){
			return;
		}

		ArchiveEntries = JSON.parse(TGDecoding(JSONtemp["BToken"]));

		var startime = 0;
		for (var index = 0; index < ArchiveEntries.length; index++){
			if (index == 0)	{
				startime = ArchiveEntries[index]["Stime"];
			}
			ArchiveEntries[index]["Stime"] = ArchiveEntries[index]["Stime"] - startime;
			//console.log(JSON.stringify(ArchiveEntries[index]));
			
			if (index == ArchiveEntries.length - 1){
				LatchCaptionArchive();
				ResetArchiveContainer();
				RemoveArchiveMenu();
				SummonCaptionOption();
			}
		}
	};

	xhr.send('{ "BToken":"' + BToken + '" }');
}

function StopLatchCaptionArchive(){
	if (MainVid) {
		MainVid.onseeked = null;
		MainVid.onpause = null;
		MainVid.onplay = null;
	}
	if (TimerHandleID){
		clearInterval(TimerHandleID);
		TimerHandleID = null;
	}
}

function LatchCaptionArchive(){
	VidSeek = document.getElementsByTagName('video');
	for (let i = 0; i < VidSeek.length; i++){
		if (VidSeek[i].className == VideoElementID){
			MainVid = VidSeek[i];

			MainVid.onseeked = function() {
				TimeNow = MainVid.currentTime*1000;
				SeekIndexStart();
			};

			MainVid.onpause = function() {
				if (TimerHandleID){
					clearInterval(TimerHandleID);
					TimerHandleID = null;
				}
			};

			MainVid.onplay = function() {
				TimeNow = MainVid.currentTime*1000;
				SeekIndexStart();
			};

			TimeNow = MainVid.currentTime*1000;
			CurrentEntryIndex = 0;
			TimeShift = 0;
			if (!MainVid.paused){
				SeekIndexStart();
			} else {
				StatText.textContent = "Archive loaded";
				CaptionText = "ARCHIVE LOADED";
				CaptionOC = "#000000";
				CaptionCC = "#FFFFFF";
				MMReloadCaption();
			}
			break;
		}
	}
}

function SeekIndexStart(){
	if (TimerHandleID){
		clearInterval(TimerHandleID);
		TimerHandleID = null;
	}

	for (CurrentEntryIndex = 0; CurrentEntryIndex < ArchiveEntries.length; CurrentEntryIndex++){
		if (ArchiveEntries[CurrentEntryIndex]["Stime"] > TimeNow + TimeShift){
			CurrentEntryIndex--;
			CallPainterEntry(ArchiveEntries[CurrentEntryIndex]);
			TimerHandleID = setInterval(TimerRun, 250);
			break;
		}
	}
}

function TimerRun(){
	TimeNow += 250;
	if (CurrentEntryIndex < ArchiveEntries.length - 1){
		while ((ArchiveEntries[CurrentEntryIndex + 1]["Stime"] < TimeNow + TimeShift)){
			if (CurrentEntryIndex > ArchiveEntries.length - 1){
				break;
			} else {
				CurrentEntryIndex++;
			}
		}
		CallPainterEntry(ArchiveEntries[CurrentEntryIndex]);
	}
}

function CallPainterEntry(dt){
	CaptionText = dt["Stext"];
	if (!dt["CC"]){
		CaptionCC = "#FFFFFF";
	} else {
		CaptionCC = "#" + dt["CC"];
	}
	if (!dt["OC"]){
		CaptionOC = "#000000";
	} else {
		CaptionOC = "#" + dt["OC"];
	}
	RepaintResizeRelocateCaption(null);
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ BUTTONS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var ARBrowseAll = btn.cloneNode(false);
ARBrowseAll.onclick = ARBrowseAllBtnClick;
ARBrowseAll.textContent = "Browse All";

var ARSearchBtn = btn.cloneNode(false);
ARSearchBtn.textContent = "Search By Title";
ARSearchBtn.onclick = ARSearchBtnClick;

var ARNameInput = document.createElement('input');
ARNameInput.type = "text";
ARNameInput.placeholder = "Archive title here..."

var ARSearchLinkBtn = btn.cloneNode(false);
ARSearchLinkBtn.textContent = "Search By Link";
ARSearchLinkBtn.onclick = ARSearchLinkBtnClick;

var ARBackBtn = btn.cloneNode(false);
ARBackBtn.style.float = "right";
ARBackBtn.textContent = "Back";
ARBackBtn.onclick = ARBackBtnClick;

function SummonArchiveMenu(){
	ExtContainer.parentNode.insertBefore(ARContainer, ExtContainer.nextSibling);
	ExtContainer.appendChild(ARBackBtn);
	ExtContainer.appendChild(ARBrowseAll);
	ExtContainer.appendChild(ARSearchBtn);
	ExtContainer.appendChild(ARNameInput);
	ExtContainer.appendChild(ARSearchLinkBtn);
}

function RemoveArchiveMenu(){
	ARBackBtn.remove();
	ARSearchBtn.remove();
	ARNameInput.remove();
	ARSearchLinkBtn.remove();
	ARBrowseAll.remove();
	ARContainer.remove();
}

function ARBackBtnClick() {
	SummonMainMenu();
	RemoveArchiveMenu();
}

function ResetArchiveContainer(){
	while (ARContainer.lastChild){
		ARContainer.removeChild(ARContainer.lastChild);
	}
}

function ARSearchLinkBtnClick(){
	ResetArchiveContainer();
	var RCT = ARCardText.cloneNode(true);
	RCT.style.width = "100%";
	var RCPanel = ARCardTemplate.cloneNode(true);
	RCT.textContent = "QUERYING DATA";
	RCPanel.appendChild(RCT);
	ARContainer.appendChild(RCPanel);

	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://repo.mchatx.org/FetchRaw/', true);
	xhr.setRequestHeader('Content-type', 'application/json');
	xhr.onload = function () {
		ResetArchiveContainer();
		try {
			var JSONtemp = JSON.parse(xhr.response);	
		} catch (error) {
			return;
		}
		
		if (!JSONtemp["BToken"]){
			return;
		}

		var DecodeString = TGDecoding(JSONtemp["BToken"]);

		if (DecodeString == "[]"){
			var RCT = ARCardText.cloneNode(true);
			RCT.style.width = "100%";
			var RCPanel = ARCardTemplate.cloneNode(true);
		
			RCT.textContent = "FOUND ZERO HIT";
			RCPanel.appendChild(RCT);
			
			ARContainer.appendChild(RCPanel);
			return;
		} else {
			JSON.parse(DecodeString).map(e => {
				AddARCard(e["Nick"], e["Link"], e["Pass"], e["StreamLink"], e["Tags"], e["_id"]);
			});
		}
	};

	xhr.send('{ "BToken":"' + TGEncoding(JSON.stringify({
		Act: 'ArchiveList',
		Link:  'YT_' + UID.split(" ")[1]
	})).replace(/\\/gi, "\\\\") + '" }');

	ARNameInput.value = "";
}

function ARBrowseAllBtnClick(){
	ResetArchiveContainer();

	var RCT = ARCardText.cloneNode(true);
	RCT.style.width = "100%";
	var RCPanel = ARCardTemplate.cloneNode(true);
	RCT.textContent = "QUERYING DATA";
	RCPanel.appendChild(RCT);
	ARContainer.appendChild(RCPanel);

	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://repo.mchatx.org/FetchRaw/', true);
	xhr.setRequestHeader('Content-type', 'application/json');
	xhr.onload = function () {
		ResetArchiveContainer();
		try {
			var JSONtemp = JSON.parse(xhr.response);	
		} catch (error) {
			return;
		}
		
		if (!JSONtemp["BToken"]){
			return;
		}

		var DecodeString = TGDecoding(JSONtemp["BToken"]);

		if (DecodeString == "[]"){
			var RCT = ARCardText.cloneNode(true);
			RCT.style.width = "100%";
			var RCPanel = ARCardTemplate.cloneNode(true);
		
			RCT.textContent = "FOUND ZERO HIT";
			RCPanel.appendChild(RCT);
			
			ARContainer.appendChild(RCPanel);
			return;
		} else {
			JSON.parse(DecodeString).map(e => {
				AddARCard(e["Nick"], e["Link"], e["Pass"], e["StreamLink"], e["Tags"], e["_id"]);
			});
		}
	};

	xhr.send('{ "BToken":"' + TGEncoding(JSON.stringify({
		Act: 'ArchiveList'
	})).replace(/\\/gi, "\\\\") + '" }');

	ARNameInput.value = "";
}

function ARSearchBtnClick() {
	ResetArchiveContainer();
	var RCT = ARCardText.cloneNode(true);
	RCT.style.width = "100%";
	var RCPanel = ARCardTemplate.cloneNode(true);
	RCT.textContent = "QUERYING DATA";
	RCPanel.appendChild(RCT);
	ARContainer.appendChild(RCPanel);

	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://repo.mchatx.org/FetchRaw/', true);
	xhr.setRequestHeader('Content-type', 'application/json');
	xhr.onload = function () {
		ResetArchiveContainer();
		try {
			var JSONtemp = JSON.parse(xhr.response);	
		} catch (error) {
			return;
		}
		
		if (!JSONtemp["BToken"]){
			return;
		}

		var DecodeString = TGDecoding(JSONtemp["BToken"]);

		if (DecodeString == "[]"){
			var RCT = ARCardText.cloneNode(true);
			RCT.style.width = "100%";
			var RCPanel = ARCardTemplate.cloneNode(true);
		
			RCT.textContent = "FOUND ZERO HIT";
			RCPanel.appendChild(RCT);
			
			ARContainer.appendChild(RCPanel);
			return;
		} else {
			JSON.parse(DecodeString).map(e => {
				AddARCard(e["Nick"], e["Link"], e["Pass"], e["StreamLink"], e["Tags"], e["_id"]);
			});
		}
	};

	xhr.send('{ "BToken":"' + TGEncoding(JSON.stringify({
		Act: 'ArchiveList',
		Nick: ARNameInput.value
	})).replace(/\\/gi, "\\\\") + '" }');

	ARNameInput.value = "";
}
//======================================== ARCHIVE CONTROLLER ========================================



//------------------------------------- CAPTION OPTION CONTROLLER -------------------------------------
var COCloseBtn = btn.cloneNode(false);
COCloseBtn.onclick = COCloseBtnClick;
COCloseBtn.textContent = "Back";
COCloseBtn.style.float = "right";

var CODefaultBtn = btn.cloneNode(false);
CODefaultBtn.onclick = CODefaultBtnClick;
CODefaultBtn.textContent = "Reset";
CODefaultBtn.style.float = "left";

//	COLOUR PICKER FORM
var COColourForm = document.createElement('div');
COColourForm.style.height = "100%";
COColourForm.style.display = "inline-block";
COColourForm.style.margin = "2px";

var COColourInput = document.createElement('input');
COColourInput.type = "color";
COColourInput.style.position = "relative";
COColourInput.style.left = "25%";
COColourInput.onchange = COColourInputChange;
COColourForm.appendChild(COColourInput);
COColourForm.appendChild(document.createElement('br'));

var COColourText = document.createElement('span');
COColourText.textContent = "Background Colour";
COColourText.style.fontSize = '15px';
COColourText.style.background = 'white';
COColourForm.appendChild(COColourText);

//	OPACITY PICKER FORM
var COOpacityForm = document.createElement('div');
COOpacityForm.style.display = "inline-block";
COOpacityForm.style.margin = "2px";

var COOpacityInput = document.createElement('input');
COOpacityInput.type = "range";
COOpacityInput.style.marginRight = '5px';
COOpacityInput.style.marginLeft = '5px';
COOpacityInput.min = 1;
COOpacityInput.max = 255;
COOpacityInput.oninput = COOpacityInputChange;
COOpacityForm.appendChild(COOpacityInput);
COOpacityForm.appendChild(document.createElement('br'));

var COOpacityText = document.createElement('p');
COOpacityText.textContent = "Opacity (%)";
COOpacityText.style.textAlign = "center";
COOpacityText.style.fontSize = '15px';
COOpacityText.style.background = 'white';
COOpacityForm.appendChild(COOpacityText);

//	FONT SIZE PICKER FORM
var COFontSizeForm = document.createElement('div');
COFontSizeForm.style.display = "inline-block";
COFontSizeForm.style.margin = "2px";

var COFontSizeInput = document.createElement('input');
COFontSizeInput.type = "number";
COFontSizeInput.style.width = "50px";
COFontSizeInput.min = 1;
COFontSizeInput.max = 1000;
COFontSizeInput.oninput = COFontSizeInputChange;
COFontSizeForm.appendChild(COFontSizeInput);
COFontSizeForm.appendChild(document.createElement('br'));

var COFontSizeText = document.createElement('p');
COFontSizeText.textContent = "Font Size";
COFontSizeText.style.textAlign = "center";
COFontSizeText.style.fontSize = '15px';
COFontSizeText.style.background = 'white';
COFontSizeForm.appendChild(COFontSizeText);

//	FONT TYPE PICKER FORM
var COTypeForm = document.createElement('div');
COTypeForm.style.display = "inline-block";
COTypeForm.style.margin = "2px";

var COTypeSelect = document.createElement('select');
COTypeSelect.style.width = "120px";
COTypeSelect.add(document.createElement("option"));
COTypeSelect.options[0].value = "Helvetica";
COTypeSelect.options[0].text = "Helvetica";
COTypeSelect.add(document.createElement("option"));
COTypeSelect.options[1].value = "sans-serif";
COTypeSelect.options[1].text = "Sans-Serif";
COTypeSelect.add(document.createElement("option"));
COTypeSelect.options[2].value = "Courier New";
COTypeSelect.options[2].text = "Courier New";
COTypeSelect.onchange = COTypeSelectChange;
COTypeForm.appendChild(COTypeSelect);
COTypeForm.appendChild(document.createElement('br'));

var COTypeText = document.createElement('p');
COTypeText.textContent = "Font Type";
COTypeText.style.textAlign = "center";
COTypeText.style.fontSize = '15px';
COTypeText.style.background = 'white';
COTypeForm.appendChild(COTypeText);

//	DELAY PICKER FORM
var CODelayForm = document.createElement('div');
CODelayForm.style.display = "inline-block";
CODelayForm.style.margin = "2px";

var CODelayInput = document.createElement('input');
CODelayInput.type = "number";
CODelayInput.style.width = "75px";
CODelayInput.style.position = "relative";
CODelayInput.style.left = "22%";
CODelayInput.oninput = CODelayInputChange;
CODelayForm.appendChild(CODelayInput);
CODelayForm.appendChild(document.createElement('br'));

var CODelayText = document.createElement('p');
CODelayText.textContent = "Time Shift (in second)";
CODelayText.style.textAlign = "center";
CODelayText.style.fontSize = '15px';
CODelayText.style.background = 'white';
CODelayForm.appendChild(CODelayText);

function COTypeSelectChange() {
	CaptionFont = COTypeSelect.value;
	RepaintResizeRelocateCaption();
}

function CODelayInputChange() {
	TimeShift = CODelayInput.value*1000;
	CurrentEntryIndex = 0;
}

function COFontSizeInputChange() {
	CaptionFontSize = COFontSizeInput.value;
	RepaintResizeRelocateCaption(null)
}

function CODefaultBtnClick() {
	CaptionColour = "#00000064";
	CaptionFontSize = 30;
	CaptionDiv.style.backgroundColor = CaptionColour;
	CaptionOC = "#000000";
	CaptionCC = "#FFFFFF";
	CaptionFont = "sans-serif";
	RepaintResizeRelocateCaption(null);

	COColourInput.value = CaptionColour.substring(0, 7);
	COOpacityInput.value = parseInt(CaptionColour.substring(7,9), 16);
	COOpacityText.textContent = "Opacity (" + (COOpacityInput.value/255*100).toString().substring(0, 3) + "%)";
	COFontSizeInput.value = CaptionFontSize;
}

function COOpacityInputChange() {
	newopacity = parseInt(COOpacityInput.value).toString(16);
	if (newopacity.length == 1){
		newopacity = "0" + newopacity;
	}
	CaptionColour = COColourInput.value + newopacity;
	CaptionDiv.style.backgroundColor = CaptionColour;
	COOpacityText.textContent = "Opacity (" + (COOpacityInput.value/255*100).toString().substring(0, 3) + "%)";
}

function COColourInputChange() {
	CaptionColour = COColourInput.value + CaptionColour.substring(7,9);
	CaptionDiv.style.backgroundColor = CaptionColour;
}

function SummonCaptionOption(){
	ExtContainer.appendChild(CODefaultBtn);
	ExtContainer.appendChild(COColourForm);
	ExtContainer.appendChild(COOpacityForm);
	ExtContainer.appendChild(COFontSizeForm);
	ExtContainer.appendChild(COCloseBtn);
	ExtContainer.appendChild(COTypeForm);
	ExtContainer.appendChild(CODelayForm);
	
	COColourInput.value = CaptionColour.substring(0, 7);
	COOpacityInput.value = parseInt(CaptionColour.substring(7,9), 16);
	COOpacityText.textContent = "Opacity (" + (COOpacityInput.value/255*100).toString().substring(0, 3) + "%)";
	COFontSizeInput.value = CaptionFontSize;
	COTypeSelect.value = CaptionFont;
	CODelayInput.value = TimeShift/1000;
}

function COCloseBtnClick() {
	COCloseBtn.remove();
	COColourForm.remove();
	COOpacityForm.remove();
	COFontSizeForm.remove();
	CODefaultBtn.remove();
	CODelayForm.remove();
	COTypeForm.remove();

	SummonMainMenu();
}
//===================================== CAPTION OPTION CONTROLLER =====================================



//------------------------------------------ REQUEST HANDLER ------------------------------------------
var RequestBtn = btn.cloneNode('false');
RequestBtn.textContent = "Request";
RequestBtn.style.fontSize = "12px";
RequestBtn.style.padding = "1px";

function RequestBtnAddClick(){
	if (Logged){
		AddRequest();
	} else {
		SummonAccModal(SesAcc);
	}
}

function RequestBtnRemClick(){
	if (Logged){
		DeleteRequest();
	} else {
		SummonAccModal(SesAcc);
	}
}

function CheckRequest() {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://repo.mchatx.org/Request/', true);
	xhr.setRequestHeader('Content-type', 'application/json');
	xhr.onload = function () {
		if (xhr.response == "True"){
			RequestBtn.textContent = "Cancel Request";
			RequestBtn.onclick = RequestBtnRemClick;
		}
	};

	xhr.send('{ "BToken":"' +  TGEncoding(JSON.stringify({
		Act: "Check",
		Nick: SesAcc,
		Link: 'YT_' + UID.split(" ")[1]
	})).replace(/\\/gi, "\\\\") + '" }');
}

function AddRequest() {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://repo.mchatx.org/Request/', true);
	xhr.setRequestHeader('Content-type', 'application/json');
	xhr.onload = function () {
		if (xhr.status == 400){
			if (xhr.response == "ERROR : INVALID TOKEN"){
				SummonAccModal(SesAcc);
			}
		} else {
			StatText.textContent = "Request sent";
			RequestBtn.textContent = "Cancel Request";
			RequestBtn.onclick = RequestBtnRemClick;
		}
	};

	xhr.send('{ "BToken":"' + TGEncoding(JSON.stringify({
		Act: "Add",
		Nick: SesAcc,
		Token: SesTkn,
		Link: 'YT_' + UID.split(" ")[1]
	})).replace(/\\/gi, "\\\\") + '" }');
}

function DeleteRequest() {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://repo.mchatx.org/Request/', true);
	xhr.setRequestHeader('Content-type', 'application/json');
	xhr.onload = function () {
		if (xhr.status == 400){
			if (xhr.response == "ERROR : INVALID TOKEN"){
				SummonAccModal(SesAcc);
			}
		} else {
			StatText.textContent = "Request cancelled";
			RequestBtn.textContent = "Request Translation";
			RequestBtn.onclick = RequestBtnAddClick;
		}
	};

	xhr.send('{ "BToken":"' + TGEncoding(JSON.stringify({
		Act: "Delete",
		Nick: SesAcc,
		Token: SesTkn,
		Link: 'YT_' + UID.split(" ")[1]
	})).replace(/\\/gi, "\\\\") + '" }');
}

function CheckArchiveRequest(){
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://repo.mchatx.org/FetchRaw/', true);
	xhr.setRequestHeader('Content-type', 'application/json');
	xhr.onload = function () {
		try {
			var JSONtemp = JSON.parse(xhr.response);	
		} catch (error) {
			return;
		}
		
		if (!JSONtemp["BToken"]){
			return;
		}

		var DecodeString = TGDecoding(JSONtemp["BToken"]);

		if (DecodeString == "[]"){
			StatText.parentNode.prepend(RequestBtn);
			RequestBtn.textContent = "Request Translation";
			RequestBtn.onclick = RequestBtnAddClick;
			if (localStorage.getItem("MChatToken")){
				CheckRequest();
			}
		} else {
			RequestBtn.remove();
		}
	};

	xhr.send('{ "BToken":"' + TGEncoding(JSON.stringify({
		Act: 'ArchiveList',
		Link:  'YT_' + UID.split(" ")[1]
	})).replace(/\\/gi, "\\\\") + '" }');
}
//========================================== REQUEST HANDLER ==========================================



//----------------------------------------- ACCOUNT CONTROLLER -----------------------------------------
var Logged = false;
var SesAcc = "";
var SesTkn = "";

// ~~~~~~~~~~~~~~~~~~~~~~~~ CONTAINER ~~~~~~~~~~~~~~~~~~~~~~~~
var AccStatContainer = ExtContainer.cloneNode(false)
AccStatContainer.id = "AccStatContainer";
AccStatContainer.style.display = "flex";

var StatText = document.createElement("span");
StatText.textContent = "RUNNING";
StatText.style.width = "100%";
StatText.style.fontSize = "15px";
StatText.style.alignSelf = "center";
StatText.style.margin = "5px";
StatText.style.marginLeft = "15px";

var AccLoginBtn = document.createElement("span");
AccLoginBtn.textContent = "Login";
AccLoginBtn.style.color = "blue";
AccLoginBtn.style.fontSize = "15px";
AccLoginBtn.style.alignSelf = "center";
AccLoginBtn.style.margin = "5px";
AccLoginBtn.style.marginRight = "15px";
AccLoginBtn.style.cursor = "pointer";
AccLoginBtn.style.textAlign = "center";
AccLoginBtn.onclick = AccLoginBtnClick;

AccStatContainer.appendChild(StatText);
AccStatContainer.appendChild(AccLoginBtn);

function SummonStatAccContainer() {
	ExtContainer.parentNode.insertBefore(AccStatContainer, ExtContainer);
	CheckArchiveRequest();
	CheckPersistentLogin();
}

function AccLoginBtnClick(){
	if (Logged){
		SesAcc = "";
		SesTkn = "";
		Logged = false;
		localStorage.removeItem("MChatToken");
		AccLoginBtn.textContent = "Login";
	} else {
		SummonAccModal(SesAcc);
	}
}

function CheckPersistentLogin(){
    if (localStorage.getItem("MChatToken")) {
		TokenData = JSON.parse(TGDecoding(localStorage.getItem("MChatToken")));
		SesAcc = TokenData["Room"];
		SesTkn = TokenData["Token"];
		Logged = true;
		AccLoginBtn.textContent = "Logout (" + SesAcc + ")";
		StatText.textContent = "Logged in";

		try {
		} catch (error) {
		  localStorage.removeItem("MChatToken");
		  SesAcc = "";
		  SesTkn = "";
		  AccLoginBtn.textContent = "Login";
		}
	} else {
		StatText.textContent = "";
	}
}
// ~~~~~~~~~~~~~~~~~~~~~~~~ MODAL HEAD ~~~~~~~~~~~~~~~~~~~~~~~~
var AccModalScreen = document.createElement('div');
AccModalScreen.style.position = "fixed";
AccModalScreen.style.zIndex = 1;
AccModalScreen.style.left = 0;
AccModalScreen.style.top = 0;
AccModalScreen.style.width = "100%";
AccModalScreen.style.height = "100%";
AccModalScreen.style.overflow = "auto";
AccModalScreen.style.backgroundColor = "rgba(0,0,0,0.4)";
AccModalScreen.style.display = "block"

var AccModalContent = document.createElement('div');
AccModalContent.style.display = "flex";
AccModalContent.style.alignItems = "center";
AccModalContent.style.justifyContent = "center";
AccModalContent.style.flexDirection = "column";
AccModalContent.style.backgroundColor = "#fefefe";
AccModalContent.style.margin = "15% auto";
AccModalContent.style.padding = "20px";
AccModalContent.style.border = "1px solid #888";
AccModalContent.style.width = "200px";
AccModalScreen.appendChild(AccModalContent);

var AccModalCloseBtn = document.createElement('span');
AccModalCloseBtn.textContent = "X";
AccModalCloseBtn.style.color = "#aaa";
AccModalCloseBtn.style.alignSelf = "end";
AccModalCloseBtn.style.fontSize = "28px";
AccModalCloseBtn.style.fontWeight = "bold";
AccModalCloseBtn.style.cursor = "pointer";
AccModalCloseBtn.onclick = AccCloseModalBtnClick;

var AccModalTextNick = document.createElement('p');
AccModalTextNick.textContent = "Nick :";
AccModalTextNick.style.marginTop = "15px";
AccModalTextNick.style.marginBottom = "15px";
AccModalTextNick.style.fontSize = "17px";
AccModalTextNick.style.fontWeight = "bold";

var AccModalInputNick = document.createElement('input');
AccModalInputNick.type = "text";
AccModalInputNick.style.width = "80%";

var AccModalTextPass = AccModalTextNick.cloneNode(false);
AccModalTextPass.textContent = "Password :";

var AccModalInputPass = document.createElement('input');
AccModalInputPass.type = "password";
AccModalInputPass.style.width = "80%";

var AccModalOk = btn.cloneNode(false);
AccModalOk.style.marginTop = "15px";
AccModalOk.textContent = "Submit";
AccModalOk.onclick = AccModalOkClick;

AccModalContent.appendChild(AccModalCloseBtn);
AccModalContent.appendChild(AccModalTextNick);
AccModalContent.appendChild(AccModalInputNick);
AccModalContent.appendChild(AccModalTextPass);
AccModalContent.appendChild(AccModalInputPass);
AccModalContent.appendChild(AccModalOk);

function SummonAccModal(Nick) {
	ExtContainer.appendChild(AccModalScreen);
	AccModalInputPass.value = "";
	AccModalInputNick.value = Nick;
	window.onclick = function(event) {
		if (event.target == AccModalScreen) {
			AccModalScreen.remove();
			window.onclick = null;
		}
	}
}

function AccCloseModalBtnClick(){
	AccModalScreen.remove();
}

function AccModalOkClick(){
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://repo.mchatx.org/Login/', true);
	xhr.setRequestHeader('Content-type', 'application/json');
	xhr.onload = function () {
		if (xhr.status == 400){
			return;
		}

		Logged = true;
		SesAcc = AccModalInputNick.value;
		SesTkn = JSON.parse(xhr.response)[0]["Token"];
		localStorage.setItem("MChatToken", TGEncoding(JSON.stringify({
			Room: AccModalInputNick.value,
			Token: SesTkn
		})));
		AccLoginBtn.textContent = "Logout (" + SesAcc + ")";
	};

	xhr.send(JSON.stringify({
		Room: AccModalInputNick.value, 
		Pass: AccModalInputPass.value
	}));

	AccModalScreen.remove();
}
//========================================= ACCOUNT CONTROLLER =========================================



//---------------------------------------- PASS MODAL CONTROLLER ----------------------------------------
var ModalScreen = document.createElement('div');
ModalScreen.style.position = "fixed";
ModalScreen.style.zIndex = 1;
ModalScreen.style.left = 0;
ModalScreen.style.top = 0;
ModalScreen.style.width = "100%";
ModalScreen.style.height = "100%";
ModalScreen.style.overflow = "auto";
ModalScreen.style.backgroundColor = "rgba(0,0,0,0.4)";
ModalScreen.style.display = "block"

var ModalContent = document.createElement('div');
ModalContent.style.backgroundColor = "#fefefe";
ModalContent.style.margin = "15% auto";
ModalContent.style.padding = "20px";
ModalContent.style.border = "1px solid #888";
ModalContent.style.width = "200px";
ModalContent.style.display = "flex";
ModalContent.style.alignItems = "center";
ModalContent.style.justifyContent = "center";
ModalContent.style.flexDirection = "column";
ModalScreen.appendChild(ModalContent);

var ModalCloseBtn = document.createElement('span');
ModalCloseBtn.textContent = "X";
ModalCloseBtn.style.color = "#aaa";
ModalCloseBtn.style.alignSelf = "end";
ModalCloseBtn.style.fontSize = "28px";
ModalCloseBtn.style.fontWeight = "bold";
ModalCloseBtn.style.cursor = "pointer";
ModalCloseBtn.onclick = CloseModalBtnClick;

var ModalText = document.createElement('p');
ModalText.textContent = "Password :";
ModalText.style.marginTop = "15px";
ModalText.style.marginBottom = "15px";
ModalText.style.fontSize = "17px";
ModalText.style.fontWeight = "bold";

var ModalInput = document.createElement('input');
ModalInput.type = "password";
ModalInput.style.width = "80%";

var ModalOk = btn.cloneNode(false);
ModalOk.style.marginTop = "15px";
ModalOk.textContent = "Submit";

ModalContent.appendChild(ModalCloseBtn);
ModalContent.appendChild(ModalText);
ModalContent.appendChild(ModalInput);
ModalContent.appendChild(document.createElement('br'));
ModalContent.appendChild(ModalOk);

function SummonModal(RoomName, RoomQuery, ARID) {
	ExtContainer.appendChild(ModalScreen);
	ModalInput.value = "";
	window.onclick = function(event) {
		if (event.target == ModalScreen) {
			ModalScreen.remove();
			window.onclick = null;
		}
	}

	if (RoomQuery){
		ModalOk.onclick = async function () {
			ModalScreen.remove();
			window.onclick = null;
			const msgUint8 = new TextEncoder().encode(ModalInput.value);
			const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
			StartListening(RoomName, hashHex);
		};
	} else {
		ModalOk.onclick = async function () {
			ModalScreen.remove();
			window.onclick = null;
			ArchiveGet(RoomName, ModalInput.value, ARID);
		};
	}
}

function CloseModalBtnClick(){
	ModalScreen.remove();
}
//======================================== PASS MODAL CONTROLLER ========================================



//-------------------------------------- GRAND CANVAS CONTROLLER --------------------------------------
var CaptionDiv = document.createElement('div')
CaptionDiv.style.position = 'absolute';
CaptionDiv.style.width = '200px';
CaptionDiv.style.height = '50px';
CaptionDiv.id = "MCHAT_CAPTION";

var RResize = document.createElement('div');
RResize.style.position = 'absolute';
RResize.style.cursor = 'col-resize';
RResize.style.right = '0';
RResize.style.top = '0';
RResize.style.height = '100%';
RResize.style.width = '5px';
CaptionDiv.appendChild(RResize);

var LResize = document.createElement('div');
LResize.style.position = 'absolute';
LResize.style.cursor = 'col-resize';
LResize.style.left = '0';
LResize.style.top = '0';
LResize.style.height = '100%';
LResize.style.width = '5px';
CaptionDiv.appendChild(LResize);

var BResize = document.createElement('div');
BResize.style.position = 'absolute';
BResize.style.cursor = 'row-resize';
BResize.style.left = '0';
BResize.style.bottom = '0';
BResize.style.height = '5px';
BResize.style.width = '100%';
CaptionDiv.appendChild(BResize);

var TResize = document.createElement('div');
TResize.style.position = 'absolute';
TResize.style.cursor = 'row-resize';
TResize.style.left = '0';
TResize.style.top = '0';
TResize.style.height = '5px';
TResize.style.width = '100%';
CaptionDiv.appendChild(TResize);

var InnerCaptionDiv = document.createElement('div');
InnerCaptionDiv.style.position = "absolute";
InnerCaptionDiv.style.cursor = 'move';
InnerCaptionDiv.style.left = '5px';
InnerCaptionDiv.style.top = '5px';
InnerCaptionDiv.style.height = 'calc(100% - 10px)';
InnerCaptionDiv.style.width = 'calc(100% - 10px)';
CaptionDiv.appendChild(InnerCaptionDiv);

var CaptionCanvas = document.createElement('canvas');
CaptionCanvas.style.width = "100%";
CaptionCanvas.style.height = "100%";
var ctx = CaptionCanvas.getContext("2d");
InnerCaptionDiv.appendChild(CaptionCanvas)

var CaptionText = "Caption Box.";
var CaptionColour = "#00000064";
var CaptionFontSize = 30;
var CaptionOC = "#000000";
var CaptionCC = "#FFFFFF";
var CaptionFont = "sans-serif";

const rgba2hex = (rgba) => `#${rgba.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+\.{0,1}\d*))?\)$/).slice(1).map((n, i) => (i === 3 ? Math.round(parseFloat(n) * 255) : parseFloat(n)).toString(16).padStart(2, '0').replace('NaN', '')).join('')}`

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
  
  function CaptionMouseIn(){
	CaptionDiv.style.backgroundColor = rgba2hex(CaptionDiv.style.backgroundColor).substr(0,7) + "FF";
  }

  function CaptionMouseOut(){
	CaptionDiv.style.backgroundColor = CaptionColour;
  }

  function RepaintCaption() {
	var FullFontCaption = "bold " + CaptionFontSize + "px " + CaptionFont;
	CaptionCanvas.width = CaptionCanvas.clientWidth;
	CaptionCanvas.height = CaptionCanvas.clientHeight;
	ctx.textAlign = "center";
	ctx.font = FullFontCaption;
  
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
			ctx.textAlign = "center";
			ctx.font = FullFontCaption;

			for (let j = 0; j < TextContainer.length; j++) {
				ctx.fillStyle = CaptionCC;
				ctx.fillText(TextContainer[j], CaptionCanvas.width/2.0, CaptionCanvas.height/2.0 - TextYShift + j*textheight);
				ctx.strokeStyle = CaptionOC;
				ctx.strokeText(TextContainer[j], CaptionCanvas.width/2.0, CaptionCanvas.height/2.0 - TextYShift + j*textheight);
			}
		}
	}
  }

  function RepaintResizeRelocateCaption(VidElement){
	var FullFontCaption = "bold " + CaptionFontSize + "px " + CaptionFont;
	CaptionCanvas.width = CaptionCanvas.clientWidth;
	ctx.textAlign = "center";
	ctx.font = FullFontCaption;
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

			if (VidElement) {
				DocTopOffset = window.pageYOffset || document.documentElement.scrollTop;
				CaptionDiv.style.top = (VidElement.getBoundingClientRect().bottom + DocTopOffset - (VidElement.getBoundingClientRect().bottom - VidElement.getBoundingClientRect().top)*0.1 - textheight*TextContainer.length - 30) + "px";
			} else {
				DocTopOffset = window.pageYOffset || document.documentElement.scrollTop;
				CaptionDiv.style.top = (CaptionDiv.getBoundingClientRect().bottom + DocTopOffset - textheight*TextContainer.length - 30) + "px";
			}

			CaptionDiv.style.height = (textheight*TextContainer.length + 30) + "px";
			CaptionCanvas.height = CaptionCanvas.clientHeight;
			ctx.textAlign = "center";
			ctx.font = FullFontCaption;
			ctx.fillStyle = CaptionCC;
			ctx.strokeStyle = CaptionOC;

			for (let j = 0; j < TextContainer.length; j++) {
				ctx.fillText(TextContainer[j], CaptionCanvas.width/2.0, CaptionCanvas.height/2.0 - TextYShift + j*textheight);
				ctx.strokeText(TextContainer[j], CaptionCanvas.width/2.0, CaptionCanvas.height/2.0 - TextYShift + j*textheight);
			}
		}
	}
  }
//====================================== GRAND CANVAS CONTROLLER ======================================

//========================================= MChad Controller =========================================



var ws;

var MainVid = document.createElement('video');
var sendBtn; 
var ChatText;
var ListenerTarget;
var ChatInputPanel;
var CurrentVersion = "2.0.0";

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
		var target = document.getElementsByTagName(ExtContainerParentID);
		if (target.length != 0){
			if (document.getElementById("Extcontainer") != null){
				var Extcontainer = document.getElementById("Extcontainer");
				Extcontainer.parentNode.removeChild(Extcontainer);
			}
			if (document.getElementById("RoomContainer") != null){
				var Roomcontainer = document.getElementById("RoomContainer");
				Roomcontainer.parentNode.removeChild(Roomcontainer);
			}
			if (document.getElementById("ARContainer") != null){
				var ARcontainer = document.getElementById("ARContainer");
				ARcontainer.parentNode.removeChild(ARcontainer);
			}
			if (document.getElementById("TShiftContainer") != null){
				var TScontainer = document.getElementById("TShiftContainer");
				TScontainer.parentNode.removeChild(TScontainer);
			}
			if (document.getElementById("AccStatContainer") != null){
				var AccContainer = document.getElementById("AccStatContainer");
				AccContainer.parentNode.removeChild(AccContainer);
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