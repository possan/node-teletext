//
// just run: node proxy.js
//
// example usages:
//
// set header:
//
// set time:
//   curl -X POST "http://localhost:8080/raw?command=0T333333"
//
// upload first page from a tti page:
//
// run a custom command:
//
// running twitfax:
//   php twitfax.php >twitter.tti
//   iconv -f iso8859-1 -t utf-8 twitter.tti >twitter2.tti
//   curl -X POST "http://localhost:8080/tti?filename=twitter2.tti"
//

var HTTPPORT = 8080;
var SERIALPORT = "/dev/tty.usbmodem002121";
var BAUDRATE = 115200;
var DEFAULTPAGE = 200;
var MAXQUEUELENGTH = 300;

// VBit mapping
var PAGEMAPPING = {
  100: '0',
  101: '1',
  200: '2',
  201: '3',
  300: '4',
  301: '5',
  400: '6',
  401: '7',
  500: '8',
  501: '9',
  600: 'A'
}

var serialport = require("serialport");
var restify = require('restify');
var querystring = require("querystring");
var fs = require('fs');

var SerialPort = serialport.SerialPort

var serialPort = new SerialPort(SERIALPORT, {
  parser: serialport.parsers.readline('\r\n'),
	baudrate: BAUDRATE
});

var okhandler = null;
var commandqueue = [];

function popcommand() {
  if (commandqueue.length>0) {
    var command = commandqueue.splice(0,1)[0];
    sendcommand(command, popcommand);
  } else {
    setTimeout(popcommand, 20);
  }
};

function queuecommand(command) {
  if (commandqueue.length > MAXQUEUELENGTH) {
    queuecommand = queuecommand.splice(queuecommand.length-MAXQUEUELENGTH);
  }
  if (command) {
    console.log('QUEUE:',command);
    commandqueue.push(command);
  }
}

function setokhandler(callback) {
  okhandler = callback;
}

function sendcommand(command, callback) {
  // if (callback) setokhandler(callback);

  var datacommand = '';
  if (command.page && command.page > 0) {
    var shortpage = PAGEMAPPING[command.page];
    if (shortpage) {
      datacommand += '\x0E\x0E0JW,'+shortpage+'\x0D';
    }
  }
  if (command.command) {
    datacommand += '\x0E\x0E'+command.command+'\x0D';
  }

  console.log('SENDING: '+datacommand);
  serialPort.write(new Buffer(datacommand, 'ascii'), function(err, results) {
    // console.log('err',err,', results', results);
  });
  // if (okhandler)
  setTimeout(callback, 10);
}

serialPort.on("open", function () {
  // console.log('open');

  serialPort.on('data', function(data) {
    console.log('GOT', data);
    if (data) {
      var ts = data.toString().trim();
      if (ts == '0OK0' || ts == '1OK0')  {
        var t = okhandler;
        setTimeout(t, 0);
        okhandler = null;
      }
    }
  });

 // queuecommand('0JA,2');

  popcommand();
});

var server = restify.createServer();
server.use(restify.queryParser());
server.use(restify.bodyParser({}));

server.use(
  function crossOrigin(req,res,next) {
    return next();
  }
);
server.use(
  function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  }
);
server.post('/page/:num', function(req, res, next) {
  res.send('hello ' + req.params.name);
});

var rawhandler = function(req, res, next) {
  if (req.query.command)
    queuecommand({
      page: req.query.page || 0,
      command: req.query.command
    });
  res.send({ ok: true });
  next();
};

server.post('/raw', rawhandler);
server.get('/raw', rawhandler);
server.put('/raw', rawhandler);

function queuetti(body) {
  console.log('queuetti', body);
  var lines = body.split('\n');
  var pageindex = 0;
  lines.forEach(function(line) {
    var cmd = line.trim().split(',');
    // console.log('parsing:', cmd);
    if (cmd[0] == 'PN') {
      pageindex ++;
    }
    if (pageindex < 2 && cmd[0] == 'OL') {
      // only take first page on uploaded pages
      queuecommand({
        command: '0JW,'+cmd[1]+','+cmd.slice(2).join(',')
      });
    }
  });
}

var ttihandler = function(req, res, next) {
  console.log(req);
  if (req.params.filename)
    queuetti(fs.readFileSync(req.params.filename, 'utf-8'));
  else if (req.query.file)
    queuetti(req.query.file);
  else if (req.params.file)
    queuetti(req.params.file);
  else if (req.query.code)
    queuetti(req.query.code);
  else if (req.body)
    queuetti(req.body);
  else
    console.error('err');
  res.send({ ok: true });
  next();
};

server.post('/tti', ttihandler);
server.get('/tti', ttihandler);
server.put('/tti', ttihandler);

server.listen(HTTPPORT, function() {
  console.log('%s listening at %s', server.name, server.url);
});

