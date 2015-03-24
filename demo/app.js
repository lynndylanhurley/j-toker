var express    = require('express'),
    request    = require('request'),
    httpProxy  = require('http-proxy'),
    CONFIG     = require('config'),
    handlebars = require('express-handlebars'),
    compress   = require('compression');

var port = process.env.PORT || 7777;
var app  = express();

// env setup
//if (process.env.NODE_ENV === 'development') {
  //app.use(require('connect-livereload')());
//}

// proxy api requests (for older IE browsers)
app.all('/proxy/*', function(req, res, next) {
  // transform request URL into remote URL
  var apiUrl = 'http:'+CONFIG.get('apiUrl')+'/'+req.params[0];
  var r = null;

  // preserve GET params
  if (req._parsedUrl.search) {
    apiUrl += req._parsedUrl.search;
  }

  // handle POST / PUT
  if (req.method === 'POST' || req.method === 'PUT') {
    r = request[req.method.toLowerCase()]({uri: apiUrl, json: req.body});
  } else {
    r = request(apiUrl);
  }

  // pipe request to remote API
  req.pipe(r).pipe(res);
});


// redirect to push state url (i.e. /blog -> /#/blog)
app.get(/^(\/[^#\.]+)$/, function(req, res) {
  var path = req.url

  // preserve GET params
  if (req._parsedUrl.search) {
    path += req._parsedUrl.search;
  }

  res.redirect('/#'+path);
});


app.get('/', function(req, res) {
  res.render('index', {
    layout: false,
    config: JSON.stringify({
      apiUrl: CONFIG.get('apiUrl'),
    })
  });
});


// use handlebar templates for html files
app.engine('.html', handlebars({extname: '.html'}));
app.set('views', __dirname + '/' + CONFIG.get('distDir'));
app.set('view engine', '.html');

app.use(compress());
app.use(express.static(__dirname + '/' + CONFIG.get('distDir')));
app.listen(port);
