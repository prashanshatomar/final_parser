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

console.log("connected")   

 //client.subscribe('platform/track/+'   )   

var reader = ['40BD3259AC16','40BD3259AC17','40BD3259AC18','40BD3259AC19','40BD3259AC20','40BD3259AC21','40BD3259AC22','40BD3259AC23','40BD3259AC24','40BD3259AC25','40BD3259AC26','40BD3259AC27','40BD3259AC28',,'40BD3259AC29','40BD3259AC30','40BD3259AC31',,'40BD3259AC32',,'40BD3259AC33',,'40BD3259AC34',,'40BD3259AC35','40BD3259AC36']

reader.forEach(function(val,i){ 

setTimeout(function(){ 
setInterval( function(){       
var utcStr = new Date().toISOString();
var utcTime = Number(new Date(utcStr).getTime()/1000);
var utcHex =  utcTime.toString(16).split(".")[0];
var mess ={"d":{"CMD":"01","DID":val,"DD":[{"TA":"BC282C00008664B700000000006C"}],"CHK":"6593","ET":utcHex}};

	client.publish('platform/track/'+val, JSON.stringify(mess)  , {   qos: 2  },function(){       

	console.log("message published" + i.toString()  );      

 	i ++     

     });   

   },20);

  },1000 * ( i* 3))

})

var i  = 0;      

});
