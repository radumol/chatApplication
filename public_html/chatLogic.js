
$(document).ready(function(){
		
	var userName = prompt("What's your name?")||"User";
	
	var socket = io(); //connect to the server that sent this page
	socket.on('connect', function(){
		socket.emit("intro", userName);
	});
	
	$('#inputText').keypress(function(ev){
			if(ev.which===13){
				//send message
				socket.emit("message",$(this).val());
				ev.preventDefault(); //if any
				$("#chatLog").append((new Date()).toLocaleTimeString()+", "+userName+": "+$(this).val()+"\n")
				$(this).val(""); //empty the input
			}
	});
	
	socket.on("message",function(data){
		$("#chatLog").append(data+"\n");
		$('#chatLog')[0].scrollTop=$('#chatLog')[0].scrollHeight; //scroll to the bottom
	});
	
	socket.on("privateMessage", function(data){
		var message = window.prompt("PM from "+ data.source +" : " +data.message);
		var toSend = {userName:data.source, message:message};
		if (message !== "" && message !== null)
			socket.emit("privateMessage", toSend);
		
	});
	
	socket.on("userList", function(data){
		
		$("#userList").empty();
		console.log(data);
		$("#userList").append("Users: \n");
		for(var i=0; i<data.length; i++){
			$("#userList").append('<li id="'+data[i]+'">' + data[i] + "</li>");
		}
	});
	
	socket.on("blockedMessage", function(data){
		alert(data + " has blocked you");
	});
	
	socket.on("blocked", function(data){
		alert(data + " has been blocked from sending you messages");
	});
	
	socket.on("unblocked", function(data){
		alert(data + " has been unblocked");
	});
	
	$('#userList').on('dblclick', "li", function(){
		var userName = $(this).attr('id');
		console.log(userName);
		if (window.event.ctrlKey) {
			console.log("IT WORKERED");
			socket.emit("blockUser", userName); //userName to be blocked
		}else{
			var message = window.prompt("Send pm to " + userName);
			var toSend = {userName:userName, message:message};
			socket.emit("privateMessage", toSend);
			
		}
		
		
		
	});
	
});