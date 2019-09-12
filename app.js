var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
//_____________________________________________________________________________________________________
var mqtt=require('mqtt');
var fs=require('fs')
//_____________________________________________________________________________________________________
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
//___________________________________________________________________________________________________

//_____________________@PRASHANSHA TOMAR_____________________________________________________________

//configuration data for all setup
var config_data={
  "MQTT_HOST":"192:168:123:31",
  "MQTT_PORT":8883,
  "TOPIC_PUB_SUB":"TESTING_BROKER",
  "PACKET_DELAY_TIME":2,
  "RUN_TIME":2000,
  "QOS":2,
  "PASSPHRASE":'MQTT@2017',
  "CERT_FILE_PATH":__dirname+'/ca.cert.pem',
  "PUB_SUB_TOPIC":"broker_testing",
  "MSG_COUNTER_START":0,
  "TOTAL_PACKET_TO_SEND":2000 ,
  "PUBLISHED_DATA_FILE_PATH": "/home/mqadmin/Documents/mqtt_test/final_parser/publisher_log.txt",
  "SUBSCRIBED_DATA_FILE_PATH": "/home/mqadmin/Documents/mqtt_test/final_parser/subscriber_log.txt",

}

var send_data=[];
var received_msg=[];

//configuration data for parser
var parser_config={
  "PUBLISHER_FILE_PATH":"/home/mqadmin/Documents/mqtt_test/final_parser/publisher_log.txt",
  "SUBSCRIBER_FILE_PATH":"/home/mqadmin/Documents/mqtt_test/final_parser/subscriber_log.txt",
  "PARSER_LOG_FILE_PATH":"/home/mqadmin/Documents/mqtt_test/final_parser/parser_log3"
}
var SUBSCRIBER_DATA;
var PUBLISHER_DATA;
//___________________________SUBSCRIBER CODE______________________________________________________________________

global.subscriber_client= mqtt.connect("mqtts://192.168.123.31",
{	  
  port:config_data.MQTT_PORT,
  host:config_data.MQTT_HOST,
  passphrase:config_data.PASSPHRASE,
  rejectUnauthorized:true,
  ca:fs.readFileSync(config_data.CERT_FILE_PATH),
  clean : true,
  qos:config_data.QOS
})

global.subscriber_client.on('connect',function(){

  console.log("Subscriber client connected...");

  global.subscriber_client.subscribe(config_data.PUB_SUB_TOPIC,{qos:config_data.QOS});

})

global.subscriber_client.on('message', function (topic, message) {
  //getting message into an array
  received_msg.push(JSON.parse(message)); 

  if(config_data.MSG_COUNTER_START==config_data.TOTAL_PACKET_TO_SEND+1){
    var recd_msgs={'message':[]}
    recd_msgs.message=send_data
   //saving all received packets to the file
    fs.writeFile(config_data.SUBSCRIBED_DATA_FILE_PATH,JSON.stringify(recd_msgs), function(err,data) {
      if(err) {return console.log(err);
      }else{console.log(data)}
    }); 

  }
  
})

//________________________PUBLISHER CODE__________________________________________________________________




setTimeout(function(){

  global.publisher_client = mqtt.connect("mqtts://192.168.123.31",
  {	  
    port:config_data.MQTT_PORT,
    host:config_data.MQTT_HOST,
    passphrase:config_data.PASSPHRASE,
    rejectUnauthorized:true,
    ca:fs.readFileSync(config_data.CERT_FILE_PATH),
    clean : true,
    qos:config_data.QOS
  })

  
  global.publisher_client.on('connect',function(){
   
    console.log("Publisher client connected...");
    //publisher on connect sends packets at giving interval of time
    global.delay_interval=setInterval(function(){ 

      config_data.MSG_COUNTER_START=config_data.MSG_COUNTER_START+1;
     
      if(config_data.MSG_COUNTER_START<=config_data.TOTAL_PACKET_TO_SEND){

      global.publisher_client.publish(config_data.PUB_SUB_TOPIC,JSON.stringify({'Message_counter':  config_data.MSG_COUNTER_START,'Time':(new Date).getTime()}),{qos:2})
    
      //storing published messages into an array
      send_data.push({'Message_counter':  config_data.MSG_COUNTER_START,'Time':(new Date).getTime()});   

     // console.log("Msg counter :: ==> "+config_data.MSG_COUNTER_START)
  
     }else if(config_data.MSG_COUNTER_START==config_data.TOTAL_PACKET_TO_SEND+1){
       //when all packets were send then this else if condition sets to true

      clearInterval(global.delay_interval); //clearing packet delay interval when all packets were sent
      var temp={'message':[]}
      temp.message=send_data
      //saving published packets to the file
      fs.writeFile(config_data.PUBLISHED_DATA_FILE_PATH,JSON.stringify(temp), function(err,data) {
        if(err) {
          return console.log(err);
         }else{
           console.log(data);}
        });  
          
     }

    },config_data.MSG_DELAY);

  })
},1000)

//_____________________________PARSER____________________________________________________________________
//_______________________________________________________________________________________________________
/**
 * NOTE: PARSER WILL RUN AFTER ==>> Delay in packets*Number of Packets
 *  
 */
/**
 * @Parser parses the published and subscribed data in term to identify the following challenges
 * Duplicate message published
 * Duplicate message subscribed
 * Which packet is missing at subscriber end
 * Delay in packets transaction from publisher to subscriber
 * 
 */

setTimeout(function(){

  
  fs.readFile(parser_config.SUBSCRIBER_FILE_PATH, 'utf8', function(err, data) {
    if (err) throw err;
    console.log("Parsing subscriber data");
    SUBSCRIBER_DATA = JSON.parse(data);

  });
  
  fs.readFile(parser_config.PUBLISHER_FILE_PATH, 'utf8', function(err, data) {
      if (err) throw err;
      console.log("Parsing publisher data");
     
      PUBLISHER_DATA=JSON.parse(data  );

      //run through each data once for subscriber and once for publisher
      
      //checks for publisher against sebscriber
  
      
      PUBLISHER_DATA.message.forEach( function(val,i){
        
        //Step 1: check for duplicate keys in publisher
        var temparray  = PUBLISHER_DATA.message.filter(function(node){         
          return node.Message_counter == val.Message_counter
        })
        if(temparray.length>1)
        {
          console.log("Counter value:"+ val.Message_counter+ " is duplicate by "+ temparray.length + " times.");
          fs.appendFile(parser_config.PARSER_LOG_FILE_PATH,"Counter value:"+ val.Message_counter+ " is duplicate by "+ temparray.length + " times.\n", function(err,data) {
            if(err) {
              return console.log(err);
             }else{//console.log(data+'------------------------------data')
            }
            });  
        }
  
        temparray =SUBSCRIBER_DATA.message.filter(function(node){
          return node.Message_counter == val.Message_counter
        })
  
        if(temparray.length<1){
          console.log("Message counter value  " + val.Message_counter + "  was published but not found in subscriber");
          fs.appendFile(parser_config.PARSER_LOG_FILE_PATH,"Message counter value  " + val.Message_counter + "  was published but not found in subscriber. \n", function(err,data) {
            if(err) {
              return console.log(err);
             }else{//console.log(data+'------------------------------data')
            }
            });  
        }
        if(temparray.length>1){
          console.log("Message counter value  " + val.Message_counter + "  was published but found "+ temparray.length +" times in subscriber");
          fs.appendFile(parser_config.PARSER_LOG_FILE_PATH,"Message counter value  " + val.Message_counter + "  was published but found "+ temparray.length +" times in subscriber. \n", function(err,data) {
            if(err) {
              return console.log(err);
             }else{//console.log(data+'------------------------------data')
            }
            });  
        }
  
      });
  
  
      PUBLISHER_DATA.message.forEach( function(val,i){
      var delay;
      var temparray = SUBSCRIBER_DATA.message.filter(function(node){     
         return node.Message_counter == val.Message_counter;      
  
        })
        if(temparray.length>=1){
          temparray.forEach(function(myval,my_i){
            delay= myval.Time - val.Time;
  
            console.log("Msg counter --> "+val.Message_counter+" . Delay is --> "+delay +" \n")
            fs.appendFile(parser_config.PARSER_LOG_FILE_PATH,"Delay in message "+val.Message_counter+" . Time of delay is   "+delay +" \n", function(err,data) {
              if(err) {
                return console.log(err);
               }else{//console.log(data+'------------------------------data')
              }
              });
  
          })
       }
      })  
    });
},config_data.PACKET_DELAY_TIME*config_data.TOTAL_PACKET_TO_SEND)


module.exports = app;
