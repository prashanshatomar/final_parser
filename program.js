console.log("Prashansha");
var mqtt = require('mqtt');

var clientA = mqtt.connect("mqtt://test.mosquitto.org");
clientA.on("connect", function(){
    console.log("Connected...");
    clientA.subscribe("mansi");
})
clientA.on("message", function(topic, message){
    console.log("getting message...");
    console.log(message);
})