/*SocketIO based chat room. Extended to not echo messages
to the client that sent them.*/

var http = require('http').createServer(handler);
var io = require('socket.io')(http);
var fs = require('fs');
var mime = require('mime-types');
var url = require('url');

const ROOT = "./public_html";

http.listen(2406);

console.log("Chat server listening on port 2406");


function handler(req,res){
	
	console.log(req.method+" request for: "+req.url);
	
	//parse the url
	var urlObj = url.parse(req.url,true);
	var filename = ROOT+urlObj.pathname;
	
	fs.stat(filename,function(err, stats){
		if(err){   //try and open the file and handle the error, handle the error
			respondErr(err);
		}else{
			if(stats.isDirectory())	filename+="/index.html";
			
			fs.readFile(filename,"utf8",function(err, data){
				if(err)respondErr(err);
				else respond(200,data);
			});
		}
	});
	
	//locally defined helper function
	//serves 404 files 
	function serve404(){
		fs.readFile(ROOT+"/404.html","utf8",function(err,data){ //async
			if(err)respond(500,err.mesage);
			else respond(404,data);
		});
	}
		
	//locally defined helper function
	//responds in error, and outputs to the console
	function respondErr(err){
		console.log("Handling error: ",err);
		if(err.code==="ENOENT"){
			serve404();
		}else{
			respond(500,err.message);
		}
	}
		
	//locally defined helper function
	//sends off the response message
	function respond(code, data){
		// content header
		res.writeHead(code, {'content-type': mime.lookup(filename)|| 'text/html'});
		// write message and signal communication is complete
		res.end(data);
	}
};
var clients = [];
io.on("connection", function(socket){
	console.log("Got a connection");
	
	
	socket.on("intro",function(data){
		
		socket.username = data;
		socket.blocked = [];
		//console.log(socket);
		clients.push(socket);
		socket.broadcast.emit("message", timestamp()+": "+socket.username+" has entered the chatroom.");
		var users = getUserList();
		socket.emit("userList", users);
		socket.broadcast.emit("userList", users);
	});
		
	socket.on("message", function(data){
		console.log("got message: "+data);
		socket.broadcast.emit("message",timestamp()+", "+socket.username+": "+data);
		
	});

	socket.on("disconnect", function(){
		console.log(socket.username+" disconnected");
		io.emit("message", timestamp()+": "+socket.username+" disconnected.");
		clients = clients.filter(function(ele){  
		   return ele!==socket;
		});
		var users = getUserList();
		socket.broadcast.emit("userList", users);
	});
	
	socket.on("privateMessage", function(data){
		console.log("USERNAME:::: " + socket.username);
		var user = getUser(data.userName);
		console.log("name: " + user.username + " blocked list: " + user.blocked);
		data.source = socket.username;
		if (!(user.blocked.indexOf(data.source) > -1)){
			user.emit("privateMessage", data);	
		}else{
			var sourceUser = getUser(socket.username);
			sourceUser.emit("blockedMessage", data.userName)
		}
			
	});
	
	socket.on("blockUser", function(data){
		
		var user = getUser(socket.username); //username that requests the block
		var index = user.blocked.indexOf(data);
		if(index > -1){
			user.blocked.splice(index, 1);
			user.emit("unblocked", data);
		}else{
			user.blocked.push(data);
			user.emit("blocked", data);
		}
		
		
		
		for (var i=0; i<user.blocked.length; i++){
			console.log("TIS : " + user.blocked[i]);
		}
			
		
		
		//data.emit("blockUser", data);
		
		
	});
	
});

function timestamp(){
	return new Date().toLocaleTimeString();
}

function getUserList(){
	var ret = [];
	for (i=0; i<clients.length; i++){
		ret.push(clients[i].username);
	}
	return ret;
}

function getUser(name){
	var theSocket;
	for(i=0; i<clients.length; i++){
		if(clients[i].username === name)
			return clients[i];
	}
}