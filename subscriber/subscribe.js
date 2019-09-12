var mqtt = require('mqtt');

var fs = require( 'fs');

//var cert_file = require(__dirname +'/crt/ca.cert.pem');

var cert_file = fs.readFileSync(__dirname +'/crt/ca.cert.pem');

var client  = mqtt.connect('mqtts://broker1:8883' ,   { 

clean: true , 

clientId : Date.now().toString() ,

rejectUnauthorized:true,

ca: cert_file



} );  


client.on('connect', function () { 
console.log('connected.');   

client.subscribe('reader/cfg/+')   


});


client.on("message",function(topic,message){ 
console.log(JSON.parse(message))

console.count("dd")
})
