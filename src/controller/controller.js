import {Stage, Pair} from '../models/stage';
import {setInventory} from '../App';

var stage = null;
var view = null;
var interval=null;
var webSocketInterval = null;
var canvas = null;
var mouseX = 0;
var mouseY = 0;
var keys = [];
var credentials={ "username": "", "password":"" };
var shift = 5;
var accessToken;
var highScore;
var userName;
var score;
var difficulty;
var color;
var email;
var socket;
var globalGameState;
var position;
var player;
var gameID;
var actions = [];
var socketSend = {};
var dev;
var mobile;
// var url = `http://${window.location.hostname}:8000`;
var url = `http://192.168.66.128:8000`;

function randint(n, min = 0){ return Math.round(Math.random()*(n - min) + min);}


export function initSocket(){
        // console.log('initSocket called');
        console.log(window.location.hostname);
        // socket = new WebSocket(ws://{window.location.host});
        // var url = `http://192.168.88.130:8000`;
        // socket = new WebSocket(`ws://192.168.88.130:8005`);
        socket = new WebSocket(`ws://${window.location.hostname}:8005`);
        console.log("CLIENT: ", socket);
        socket.onopen = function (event) {
                console.log("connected");
        };
        socket.onclose = function (event) {
                alert("closed code:" + event.code + " reason:" +event.reason + " wasClean:"+event.wasClean);
        };
        socket.onerror = function(event){
                console.error('WEBSOCKET: ', event);
        }
        socket.onmessage = function (event) {
                var recieved = event.data;
                globalGameState = JSON.parse(recieved);
                if(stage != null){
                        stage.populateActors(globalGameState);
                } 
        }
}

// export function setupGame(difficulty, color, device){
export function setupGame(canvas){
        // if(device == "computer") {
        //         var canvas = document.getElementById('stage');
        // }
        // else {
        //         var canvas = document.getElementById('stage_mobile');
        // }
        
        var green = randint(255);
        var red = randint(255);
        var blue = randint(255);
        color = 'rgba(' + red + ',' + green + ',' + blue + ',1)'; 

        userName = Math.random().toString(36).substring(7);
        stage=new Stage(canvas, globalGameState, userName, color);


	document.addEventListener("keydown", moveByKey);
        document.addEventListener('keyup', resetkey);
        document.addEventListener('click', shootBullet);
        document.addEventListener('mouseup', placeBlock);
        document.addEventListener('dblclick', placeBlock);
}
export function startGame(){
        if(stage.player == null){
                clearInterval(webSocketInterval);
                var removePlayer = {
                        'removePlayer' : stage.deadPlayer
                }
                socket.send(JSON.stringify(removePlayer))
                window.appComponent.showGameOver();
                stopGame();
                socket.close();
        }
        else{   
                stage.step(); 
                stage.draw();
                window.appComponent.setInventory(stage.player.inventory);
                gameID = requestAnimationFrame(startGame);
        }
        
        // debug();
        // gameID = requestAnimationFrame(startGame);
}

export function stopGame(){
        console.log('stopGame called');
        window.cancelAnimationFrame(gameID);
}

function placeBlock(e){
        if(e.which == 3){
                var cursorX = e.clientX;
                var cursorY = e.clientY;
                stage.placeBlock(cursorX, cursorY);
        }
}

export function placeBlockMobile() {
        var x = stage.getPlayer().x;
        var y = stage.getPlayer().y;
        stage.placeBlockPhone(x + 25, y + 25);
}

function resetkey(event){
        if(stage.getPlayer() != null){
                var keyRemoved = event.key;
                var moveMap = { 
                        'a': new Pair(-shift, 0),
                        's': new Pair(0, shift),
                        'd': new Pair(shift, 0),
                        'w': new Pair(0, -shift),
                        'a,s': new Pair(-shift, shift),
                        's,a': new Pair(-shift, shift),
                        'a,w': new Pair(-shift, -shift),
                        'w,a': new Pair(-shift, -shift),
                        's,d' : new Pair(shift, shift),
                        'd,s': new Pair(shift, shift),
                        'd,w' : new Pair(shift, -shift),
                        'w,d' : new Pair(shift, -shift)
                };
                for(var i  = 0; i < keys.length ; i++){
                        if(keys[i] == keyRemoved){
                                keys.splice(i, 1);
                        }
                }
                if(keys.length === 0){
                        stage.player.velocity=new Pair(0,0);
                }
                var strKeys = keys.join();
                if(strKeys in moveMap){
                        stage.player.velocity=moveMap[strKeys];
                }
        }     
}

function moveByKey(event){
        if(stage.getPlayer() != null){
                score = stage.player.score;
        }
        if(stage.getPlayer() != null && !stage.isWon()){
                var key = event.key;
                var moveMap = { 
                        'a': new Pair(-shift, 0),
                        's': new Pair(0, shift),
                        'd': new Pair(shift, 0),
                        'w': new Pair(0, -shift),
                        'a,s': new Pair(-shift, shift),
                        's,a': new Pair(-shift, shift),
                        'a,w': new Pair(-shift, -shift),
                        'w,a': new Pair(-shift, -shift),
                        's,d' : new Pair(shift, shift),
                        'd,s': new Pair(shift, shift),
                        'd,w' : new Pair(shift, -shift),
                        'w,d' : new Pair(shift, -shift)
                };

                var pauseMenu = {
                        'q': "quit",
                }

                var restartMenu = {
                        'r': "restart"
                }
                
                if((!keys.includes(key)) && (key in moveMap)){
                        keys.push(key);
                        var strKeys = keys.join();
                        if(strKeys in moveMap){
                                stage.player.velocity=moveMap[strKeys];
                        }
                }
                else if(key in pauseMenu){
                        console.log('pause menu');
                        window.appComponent.toggleQuitMenu();
                }
                else if(key in restartMenu){
                        if(stage.gameState == "paused"){
                                // $("#game_over").hide();
                                // $("game_over_mobile").hide();
                                // $("#pause_menu").hide();
                                // startGame();
                        }
                }
        }
        else if(stage.isWon()){
                var key = event.key;
                var restartMenu = {
                        'r': "restart"
                }
                if(key in restartMenu){
                        // console.log("restart clicked");
                        // setupGame('easy', 'black', 'computer');
                        // $("#game_won").hide();
                        // $("game_won_mobile").hide();
                        // $("#pause_menu").show();
                        // playGame();
                }
        }
        else{
                var key = event.key;
                var restartMenu = {
                        'r': "restart"
                }
                if(key in restartMenu){
                        // console.log("restart clicked");
                        // setupGame('easy', 'black', 'computer');
                        // $("#game_over").hide();
                        // $("#game_over_mobile").hide();
                        // $("#pause_menu").show();
                        // playGame();
                }
        }
	
}

export function moveButton(value) {
        if(stage.getPlayer() != null) {
                score = stage.player.score;
        }

        if(stage.getPlayer() != null && !stage.isWon()) {
                var moveMap = { 
                        '1': new Pair(-shift, 0),
                        '2': new Pair(0, shift),
                        '3': new Pair(shift, 0),
                        '4': new Pair(0, -shift)
                };

                stage.player.velocity = moveMap[value];
        }       
}

function shootBullet(event) {
        if(stage.getPlayer() != null){
                score = stage.player.score;
                var cursorX;
                var cursorY;
                cursorX = event.clientX;
                cursorY = event.clientY;
                if(stage.player.gun != null) {
                        stage.shootBullet(cursorX, cursorY);
                }
        }
}

export function newPlayer(){
        newPlayer = {
                'addPlayer' : stage.getPlayer()
        }
        socket.send(JSON.stringify(newPlayer));
}

export function send(){
        webSocketInterval=setInterval(function(){
                socketSend = {
                        'player' : stage.player.toJSON(),
                        'actions' : stage.getActions()
                }
                socket.send(JSON.stringify(socketSend));
                stage.clearActions();
        },20);
}


export async function userLogin(username, password) {
        const credentials = {
                "username": username,
                "password": password
        }
        
        const data= {
                method: "POST",
                headers: {
                        "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password)
                },
                data: JSON.stringify({})
        }

        const response = await fetch(url + "/api/login", data);
        const info = await response.json();
        if('error' in info) {
                return false;
        }
        return info
}


export async function userRegister(username, firstname, lastname, password, email, birthday) {
        const information = {
                username : username,
                firstname: firstname,
                lastname: lastname,
                password: password,
                email: email,
                birthday: birthday
        }

        console.log(information);
        const data = {
                method: "POST",
                headers: {
                        'Content-Type': 'application/json'
                      },
                body: JSON.stringify(information)
        }

        const response = await fetch(url + "/api/register", data);
        const info = await response.json();
        if("Success" in info) {
                return true;
        } else {
                return false;
        }
        
}
export async function fetchLeaderboard() {
        const data = {
                method: "POST",
                body: JSON.stringify({})
        }
        console.log("am here");
        const response = await fetch(url + "/api/leaderboard", data);
        console.log(response);
        const info = await response.json();
        var l = [];
        for(var i = 0; i < info.length; i++) {
                l.push(info[i]);
        }
        console.log(l);
        return l;
}

export async function changeScore(username, score) {
        const information = {
                username: username,
                score: score
        }

        const data = {
                method: "POST",
                headers: {
                        'Content-Type': 'application/json'
                      },
                body: JSON.stringify(information)
        }
        const response = await fetch(url + "/api/update", data);
        const info = await response.json();
        if("Success" in info) {
                return true;
        }else {
                return false;
        }
}

export async function updateProfile(username, firstname, lastname, password, email, birthday) {
        const information = {
                username : username,
                firstname: firstname,
                lastname: lastname,
                password: password,
                email: email,
                birthday: birthday
        }

        const data = {
                method: "POST",
                headers: {
                        'Content-Type': 'application/json'
                      },
                body: JSON.stringify(information)
        }

        const response = await fetch(url + "/api/profile", data);
        const info = await response.json();
        return true;
}

export async function deleteUser(username) {
        const information = {
                username: username
        }

        const data = {
                method: "POST",
                headers: {
                        'Content-Type': 'application/json'
                },
                body: JSON.stringify(information)
        }

        const response = await fetch(url + "/api/delete", data);
        const info = await response.json();
        return true;
}

$(function(){
        // Setup all events here and display the appropriate UI
        $("#loginSubmit").on('click',function(){ login(); });
        $("#ui_login").show();
        $("#ui_play").hide();
        $("#ui_play_mobile").hide();
        $("#pause_menu").hide();
        $('#game_over').hide();
        $('#game_won_mobile').hide();
        $('#game_over_mobile').hide();
        $("#reg").on('click',function(){ register(); });
        $("#up").on('click', function(){update();});
        $("#upp").on('click', function() {moveButton("4")});
        $("#left").on('click', function() {moveButton("1")});
        $("#right").on('click', function() {moveButton("3")});
        $("#down").on('click', function() {moveButton("2")});
        $('#game_won').hide();
        
});
