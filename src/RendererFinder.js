var dgram   = require('dgram');
var util    = require("util");
var events  = require("events");

function getDiscoverMessage(ST) {
  return new Buffer(
    "M-SEARCH * HTTP/1.1\r\n" +
    "HOST:239.255.255.250:1900\r\n" +
    "MAN:\"ssdp:discover\"\r\n" +
    "ST: " + (ST || "urn:schemas-upnp-org:device:MediaRenderer:1") + "\r\n" +
    "MX:2\r\n" +
    "\r\n"
  );
}

function getSocket(ST, cb) {
  var client = dgram.createSocket("udp4");
  var server = dgram.createSocket("udp4");
  client.bind(); // So that we get a port so we can listen before sending
  var msg = getDiscoverMessage(ST);
  client.send(msg, 0, msg.length, 1900, "239.255.255.250", function(err){
    if (err){
      cb(err);
    }

    var port = client.address().port;

    client.close();
    cb(undefined, server, port);
  });
  return server;
}

function RendererFinder(ST){
  //inherit all the event stuff
  events.EventEmitter.call(this);

  var that = this;
  var sST = ST;
  var _socket = null;

  that.start = function(gatherInfo){
    _socket = getSocket(sST, function(err, socket, port){
      if (err){
        that.emit('error', err);
      }

      socket.on("message", function (msg, rinfo) {
        that.emit('found', rinfo);
    	});

      socket.on("error", function (buf) {
        that.emit('err', buf.toString());
    	});

      socket.bind(port);
    });

    return this;
  };

  that.stop = function(){
    if (_socket)
      _socket.close();
  };

  that.findOne = function(getInfo, cb){
    //check for the optional parameter
    cb = getInfo instanceof Function ? getInfo : cb;

    that.once('found', function(info){
      that.stop();
      cb(undefined, info);
    });
    that.once('error', function(err){
      that.stop();
      cb(err);
    });
    that.start(getInfo);
  };

  return that;
}

//inherit all the event stuff
util.inherits(RendererFinder, events.EventEmitter);

module.exports = RendererFinder;
