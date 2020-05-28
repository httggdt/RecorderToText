//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
// var pauseButton = document.getElementById("pauseButton");
var transTxtBox = document.getElementById("transTxtBox");
// var ws = new WebSocket("wss://vosk-cn.dev.youbanban.com");
var recRate = $("#recRate").val();
console.log("默认hz:", recRate);

$("#recRate").change(function(){
  recRate = $("#recRate").val()
  console.log("修改后hz:", recRate);
})


//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
// pauseButton.addEventListener("click", pauseRecording);

function startRecording() {
  console.log("recordButton clicked");
  // wsCn = new WebSocket("wss://vosk-cn.dev.youbanban.com");
  // wsEn = new WebSocket("wss://vosk-en.dev.youbanban.com");

	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/
    
    var constraints = { audio: true, video:false }

 	/*
    	Disable the record button until we get a success or fail from getUserMedia() 
	*/

	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
  */


	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");
    $("#recordButton").removeClass("stop");
    $("#stopButton").addClass("recoding");
    $(".errorTips").removeClass("errorShow");
    $(".refresh").removeClass("refreshShow");

    audioContext = new AudioContext();
    
		/*  assign to gumStream for later use  */
		gumStream = stream;
		
		/* use the stream */
    input = audioContext.createMediaStreamSource(stream);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input,{numChannels:1})

		//start the recording process
    rec.record()

		console.log("Recording started", rec);

	}).catch(function(err) {
	  	//enable the record button if getUserMedia() fails
      $("#recordButton").addClass("stop");
      $("#stopButton").removeClass("recoding");
	});
}

function pauseRecording(){
	console.log("pauseButton clicked rec.recording=",rec.recording );
	if (rec.recording){
		//pause
		rec.stop();
		pauseButton.innerHTML="Resume";
	}else{
		//resume
		rec.record()
		pauseButton.innerHTML="Pause";

	}
}

function stopRecording() {
	console.log("stopButton clicked");

  $("#recordButton").addClass("stop");
  $("#stopButton").removeClass("recoding");

  //tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

  //create the wav blob and pass it on to createDownloadLink
  rec.exportWAV(createDownloadLink,"audio/wav",Number(recRate));
}

var blobPublic;

function createDownloadLink(blob) {

  blobPublic = blob;

  // 发送请求-语音转文字
  voskToText (blob);

  // var url = URL.createObjectURL(blob);
	// var au = document.createElement('audio');
	// var li = document.createElement('li');
	// var link = document.createElement('a');

	// //name of .wav file to use during upload and download (without extendion)
	// var filename = new Date().toISOString();

	// //add controls to the <audio> element
	// au.controls = true;
	// au.src = url;

	// //save to disk link
	// link.href = url;
	// link.download = filename+".wav"; //download forces the browser to donwload the file using the  filename
	// link.innerHTML = "Save to disk";

	// //add the new audio element to li
	// li.appendChild(au);
	
	// //add the filename to the li
	// li.appendChild(document.createTextNode(filename+".wav "))

	// //add the save to disk link to li
  // li.appendChild(link);
  // recordingsList.appendChild(li);
  

}

function voskToText (blob) {
  var form = new FormData();
  form.append('file',blob);
  $(".errorTips").addClass("errorShow loading");
  $.ajax({
    type: "post",
    url: "https://vosk-cn.dev.youbanban.com/asr",
    data: form,
    processData: false,
    contentType: false,
    cache: false,
    success:function(res){
      $(".refresh").removeClass("loading");
      $(".refresh").removeClass("on");
      if(res.status == 0) {
        $("#recordTxt").val(res.text);
        $(".refresh").removeClass("refreshShow");
        $(".errorTips").removeClass("errorShow");
      } else {
        $("#recordTxt").val("");
        $(".errorTips").addClass("errorShow");
        $(".errorTips").html(res.text);
        $(".refresh").addClass("refreshShow");
      }
    }
  })
}

$(".refresh").click(function() {
  $(".errorTips").removeClass("errorShow");
  $(this).addClass("on");
  setTimeout(() =>{
    voskToText(blobPublic);
  }, 1000);
})