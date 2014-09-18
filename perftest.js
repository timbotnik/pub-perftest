var options = {
  // Host to connect to
  host: 'localhost',

  // Port to connect on
  port: 3000,

  // *optional* publication to subscribe to
  //publicationName: 'documents',
  
  // *optional* name of a method to call once at the start of the tests
  // setupMethodName: 'startUpdate',

  // Stop creating new connections when you hit this max
  // Useful if you just want to hold open subs.
  maxConnections: 30000, 

  // Print DDP log and other debugging?
  debug: false,

  // Log success on ever X connections
  logEveryTimes: 100
}

var DDPClient = require("ddp");

var gDidSetup = false;
var gConnections = [];

function logDebug() {
  if (options.debug)
    console.log(arguments);
}

function logError() {
  console.error('ERROR:');
  console.error(arguments);
}

function logEvery(number, message) {
  if (number % options.logEveryTimes === 0)
    console.log(number + ': ' + message);
}

function launchTest(number, done) {
  var ddpclient = new DDPClient({
    host : options.host,
    port : options.port,
    autoReconnect : true,
    autoReconnectTimer : 500,
    maintainCollections : false,
  });

  if (options.debug)
    ddpclient.on('message', function (msg) { logDebug("DDP: " + msg); });

  ddpclient.connect(function(error) {
    // If autoReconnect is true, this callback will be invoked each time
    // a server connection is re-established
    if (error)
      return logError(error)

    logEvery(number, 'Connected!');
  
    function attemptSubscribtion() {
      if (typeof options.publicationName !== 'undefined') {
        ddpclient.subscribe(options.publicationName, [], function (error) {
          if (error)
            return logError('Error, unable to subscribe.');

          logEvery(number, 'Subscription complete.');
          
          done(number);
        });
      } else {
        done(number);
      }
    }
  
    if (! gDidSetup && typeof options.setupMethodName !== 'undefined') {
      gDidSetup = true;
      ddpclient.call(options.setupMethodName, [], function (err, result) {
        if (error)
          return logError(error);

        console.log('Setup successful.');
        attemptSubscribtion();
      });
    } else {
      attemptSubscribtion();
    }
  });
  
  return ddpclient;
}

console.log('Starting');

var counter = 0;

var launchNext = function() {
  if (counter < options.maxConnections) {
    gConnections.push(launchTest(counter, launchNext));
    counter++;
  } else {
    console.log('Created maximum of ' + options.maxConnections + ' connections');
  }
}

launchNext();
