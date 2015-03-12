/*
 *
 *
 *
 * Copyright (c) 2015 Lynn Dylan Hurley
 * Licensed under the WTFPL license.
 */
(function ($) {
  // shut up jshint
  var console = window.console;
  var SAVED_CONFIG_KEY = 'currentConfigName';

  console.log('===== init jToker ======');

  var Auth = function () {
    // set flag so we know if plugin has been configured
    this.initialized = false;

    // configs hash allows for multiple configurations
    this.configs = {};

    // default config will be first named config or "default"
    this.initialDefaultConfigKey = 'default';
    this.defaultConfigKey        = null;

    // base config from which other configs are extended
    this.configBase = {
      apiUrl:                '/api',
      signOutUrl:            '/auth/sign_out',
      emailSignInPath:       '/auth/sign_in',
      emailRegistrationPath: '/auth',
      accountUpdatePath:     '/auth',
      accountDeletePath:     '/auth',
      passwordResetPath:     '/auth/password',
      passwordUpdatePath:    '/auth/password',
      tokenValidationPath:   '/auth/validate_token',
      proxyIf:               function() { return false; },
      proxyUrl:              '/proxy',
      validateOnPageLoad:    false,
      forceHardRedirect:     false,
      storage:               'cookies',
      cookieExpiry:          14,
      cookiePath:            '/',

      passwordResetSuccessUrl: function() {
        return window.location.href;
      },

      confirmationSuccessUrl:  function() {
        return window.location.href;
      },

      tokenFormat: {
        "access-token": "{{ token }}",
        "token-type":   "Bearer",
        client:         "{{ clientId }}",
        expiry:         "{{ expiry }}",
        uid:            "{{ uid }}"
      },

      parseExpiry: function(headers){
        // convert from ruby time (seconds) to js time (millis)
        return (parseInt(headers['expiry'], 10) * 1000) || null;
      },

      handleLoginResponse: function(resp) {
        return resp.data;
      },

      handleAccountUpdateResponse: function(resp) {
        return resp.data;
      },

      handleTokenValidationResponse: function(resp) {
        return resp.data;
      },

      authProviderPaths: {
        github:    '/auth/github',
        facebook:  '/auth/facebook',
        google:    '/auth/google_oauth2'
      }
    };
  };


  // mostly for testing. reset all config values
  Auth.prototype.reset = function() {
    this.configs           = {};
    this.defaultConfigKey  = null;
    this.initialized       = false;

    // clean up session
    this.deleteData('authHeaders');
    this.deleteData(SAVED_CONFIG_KEY);
  };


  // throw clear errors when dependencies are not met
  Auth.prototype.checkDependencies = function() {
    var errors = [];

    if (!window.localStorage && !$.cookie) {
      errors.push(
        'This browser does not support localStorage. You must install '+
        'jquery-cookie to use jToker with this browser.'
      );
    }

    if (!window.deparam) {
      errors.push('Dependency not met: jquery-deparam.');
    }

    if (errors.length) {
      var message = errors.join(' ');
      throw 'jToker: Please resolve the following errors: ' + message;
    }
  };


  // check for evidence from past sessions
  Auth.prototype.recoverSession = function() {
    var savedConfigKey,
        key = SAVED_CONFIG_KEY;

    // first check localstorage for saved config name
    if (window.localStorage) {
      savedConfigKey = JSON.parse(window.localStorage.getItem(key));
    }

    // check cookies if not found in localstorage
    if (!savedConfigKey && $.cookie) {
      savedConfigKey = $.cookie(key);
    }

    // finally set config key as default if found
    if (savedConfigKey) {
      this.defaultConfigKey = unescapeQuotes(savedConfigKey);
    } else {
      this.defaultConfigKey = null;
    }
  };


  Auth.prototype.configure = function(opts) {
    // re-initialize config hash
    this.configs = {};
    this.defaultConfigKey = null;

    // fall back to empty object
    if (!opts) {
      opts = {};
    }

    // normalize so opts is always an array of objects
    if (opts.constructor !== Array) {
      // single config will always be called 'default' unless set
      // by previous session
      this.defaultConfigKey = this.initialDefaultConfigKey;

      // config should look like {default: {...}}
      var defaultConfig = {};
      defaultConfig[this.defaultConfigKey] = opts;

      // opts should look like [{default: {...}}]
      opts = [defaultConfig];
    }

    // iterate over config items, extend each from defaults
    for (var config in opts) {
      var configName = getFirstObjectKey(opts[config]);

      // set first set as default config
      if (!this.defaultConfigKey) {
        this.defaultConfigKey = configName;
      }

      // save config to `configs` hash
      this.configs[configName] = $.extend(
        {}, this.configBase, opts[config][configName]
      );
    }

    // set flag so `getConfig` doesn't re-initialize
    this.initialized = true;

    // return default config
    return this.configs[this.defaultConfigKey];
  };


  // TODO: document
  Auth.prototype.validateToken = function(configKey) {
    var dfd = $.Deferred();

    if (!this.retrieveData('authHeaders')) {
      dfd.reject({
        reason: 'Cannot validate token; no token found.'
      });
    } else {
      var config = this.getConfig(configKey),
          url    = config.apiUrl + config.tokenValidationPath;

      $.ajax({
        url: url,
        success: function(resp) {
          dfd.resolve(resp);
        },
        error: function(resp) {
          dfd.reject({
            reason: 'Cannot validate token; token rejected by server.',
            response: resp
          });
        }
      });
    }

    return dfd.promise();
  };


  //Auth.prototype.signUp             = function(config) {};
  //Auth.prototype.emailSignIn        = function(config) {};
  //Auth.prototype.oAuthSignIn        = function(config) {};
  //Auth.prototype.signOut            = function(config) {};
  //Auth.prototype.resetPassword      = function(email) {};
  //Auth.prototype.resendConfirmation = function(email) {};
  //Auth.prototype.updateAccount      = function(config) {};
  //Auth.prototype.destroyAccount     = function() {};


  // abstract storing of session data
  Auth.prototype.persistData = function(key, val) {
    val = JSON.stringify(val);

    switch (this.getConfig().storage) {
      case 'cookies':
        $.cookie(key, val, {
          expires: this.getConfig().cookieExpiry,
          path:    this.getConfig().cookiePath
        });
        break;

      default:
        window.localStorage.setItem(key, val);
        break;
    }
  };


  // abstract reading of session data
  Auth.prototype.retrieveData = function(key) {
    var val = null;

    switch (this.getConfig().storage) {
      case 'cookies':
        val = $.cookie(key);
        break;

      default:
        val = window.localStorage.getItem(key);
        break;
    }

    try {
      // return parsed json response
      return JSON.parse(val);
    } catch (err) {
      // unescape quotes
      unescapeQuotes(val);
      return ;
    }
  };


  // abstract deletion of session data
  Auth.prototype.deleteData = function(key) {
    switch (this.getConfig().storage) {
      case 'cookies':
        $.removeCookie(key);
        break;

      default:
        window.localStorage.removeItem(key);
        break;
    }
  };


  // return the current config. config will take the following precedence:
  // 1. config by name saved in cookie / localstorage (current auth)
  // 2. first available configuration
  // 2. default config
  Auth.prototype.getConfig = function(key) {
    // configure if not initialized
    if (!this.initialized) {
      this.configure();
    }

    // fall back to default unless config key is passed
    key = key || this.defaultConfigKey;

    return this.configs[key];
  };


  Auth.prototype.setHref = function(href) {
    window.location.href = href;
    return window.location.href;
  };


  Auth.prototype.setQS = function(params) {
    window.location.search = $.param(params);
    return window.location.search;
  };


  Auth.prototype.getQS = function() {
    return window.deparam(window.location.search);
  };


  // private util methods
  var getFirstObjectKey = function(obj) {
    for (var key in obj) {
      return key;
    }
  };


  var unescapeQuotes = function(val) {
    return val && val.replace(/("|')/g, '');
  };


  // save global reference to service
  $.auth = new Auth();


  // ensure that setup requirements have been met
  $.auth.checkDependencies();


  // check if user is returning from past session
  $.auth.recoverSession();


  // intercept requests to the API, append auth headers
  $(document).ajaxSend(function(ev, xhr, req) {
    var interceptRequest = false;

    // check config apiUrl matches the current request url
    // also ensure that the request hasn't already been authorized
    if (req.url.match($.auth.getConfig().apiUrl) && !req.authorized) {
      interceptRequest = true;
    }

    if (interceptRequest) {
      // fetch current auth headers from storage
      var currentHeaders = $.auth.retrieveData('authHeaders');

      // set header for each key in `tokenFormat` config
      req.headers = req.headers || {};
      for (var key in $.auth.getConfig().tokenFormat) {
        req.headers[key] = currentHeaders[key];
      }

      // flag request so that we don't intercept again
      req.authorized = true;

      // resend request with modified headers
      $.ajax(req);

      // block current (unauthed) request
      return false;
    }
  });


  // validate saved session tokens on page load
  $(function() {
    if ($.auth.getConfig().validateOnPageLoad) {
      $.auth.validateToken();
    }
  });

}(jQuery));
