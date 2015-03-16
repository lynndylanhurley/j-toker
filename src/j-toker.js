/*
 *
 *
 *
 * Copyright (c) 2015 Lynn Dylan Hurley
 * Licensed under the WTFPL license.
 */
(function ($) {
  // ghetto singleton
  if ($.auth) {
    return;
  }

  // shut up jshint
  var console = window.console;
  //var nav     = window.navigator;

  // cookie/localStorage value keys
  var INITIAL_CONFIG_KEY = 'default';
  var SAVED_CONFIG_KEY   = 'currentConfigName';
  var SAVED_CREDS_KEY    = 'authHeaders';

  // broadcast message event name constants (use constants to avoid typos)
  var VALIDATION_SUCCESS         = 'auth.validationSuccess';
  var VALIDATION_ERROR           = 'auth.validationError';
  var EMAIL_REGISTRATION_SUCCESS = 'auth.emailRegistrationSuccess';
  var EMAIL_REGISTRATION_ERROR   = 'auth.emailRegistrationError';
  var EMAIL_CONFIRMATION_SUCCESS = 'auth.emailConfirmationSuccess';
  var EMAIL_CONFIRMATION_ERROR   = 'auth.emailConfirmationError';
  var PASSWORD_RESET_SUCCESS     = 'auth.passwordResetConfirmSuccess';
  var PASSWORD_RESET_ERROR       = 'auth.passwordResetConfirmError';

  console.log('===== init jToker ======');

  var Auth = function () {
    // set flag so we know when plugin has been configured.
    this.configured = false;

    // configs hash allows for multiple configurations
    this.configs = {};

    // default config will be first named config or "default"
    this.defaultConfigKey = null;

    // this will be flagged when users return from email confirmation
    this.firstTimeLogin = false;

    // this will be flagged when users return from password change confirmation
    this.mustResetPassword = false;

    // save reference to user
    this.user = {};

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
        client:         "{{ client }}",
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
    // clean up session without relying on `getConfig`
    this.destroySession();

    this.configs          = {};
    this.defaultConfigKey = null;
    this.configured       = false;

    // remove event listeners
    $(document).unbind('ajaxComplete', this.updateAuthCredentials);

    // remove global ajax settings
    $.ajaxSetup({beforeSend: undefined});
  };


  Auth.prototype.invalidateTokens = function() {
    // clear user object, but don't destroy object in case of bindings
    for (var key in this.user) {
      delete this.user[key];
    }

    // clear auth session data
    this.deleteData(SAVED_CONFIG_KEY);
    this.deleteData(SAVED_CREDS_KEY);
  };


  // throw clear errors when dependencies are not met
  Auth.prototype.checkDependencies = function() {
    var errors = [],
        warnings = [];

    if (!$) {
      throw 'jToker: jQuery not found. This module depends on jQuery.';
    }

    if (!window.localStorage && !$.cookie) {
      errors.push(
        'This browser does not support localStorage. You must install '+
        'jquery-cookie to use jToker with this browser.'
      );
    }

    if (!window.deparam) {
      errors.push('Dependency not met: jquery-deparam.');
    }

    if (!$.subscribe) {
      warnings.push(
        'jquery.ba-tinypubsub.js not found. No auth events will be broadcast.'
      );
    }

    if (errors.length) {
      var errMessage = errors.join(' ');
      throw 'jToker: Please resolve the following errors: ' + errMessage;
    }

    if (warnings.length && window.console && window.console.warn) {
      var warnMessage = warnings.join(' ');
      console.warn('jToker: Warning: ' + warnMessage);
    }

  };

  // need a way to destroy the current session without relying on `getConfig`.
  // otherwise we get into infinite loop territory.
  Auth.prototype.destroySession = function() {
    var sessionKeys = [
      SAVED_CREDS_KEY,
      SAVED_CONFIG_KEY
    ];

    for (var key in sessionKeys) {
      key = sessionKeys[key];

      // kill all local storage keys
      if (window.localStorage) {
        window.localStorage.removeItem(key);
      }

      if ($.cookie) {
        // each config may have different cookiePath settings
        for (var config in this.configs) {
          var cookiePath = this.configs[config].cookiePath;

          $.removeCookie(key, {
            path: cookiePath
          });
        }
      }
    }
  };


  Auth.prototype.configure = function(opts, reset) {
    // destroy all session data. useful for testing
    if (reset) {
      this.reset();
    }

    // set flag so configure isn't called again (unless reset)
    this.configured = true;

    // normalize opts into object object
    if (!opts) {
      opts = {};
    }

    // normalize so opts is always an array of objects
    if (opts.constructor !== Array) {
      // single config will always be called 'default' unless set
      // by previous session
      this.defaultConfigKey = INITIAL_CONFIG_KEY;

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

    // ensure that setup requirements have been met
    this.checkDependencies();

    // TODO: add config option for these bindings
    if (true) {
      // update auth creds after each request to the API
      $(document).ajaxComplete($.auth.updateAuthCredentials);

      // intercept requests to the API, append auth headers
      $.ajaxSetup({beforeSend: $.auth.appendAuthHeaders});
    }

    // pull creds from search bar if available
    this.getTokenFromSearch();

    // validate token if set
    return this.validateToken();
  };


  Auth.prototype.getTokenFromSearch = function() {
    var searchParams  = this.getQs(),
        newHeaders    = null,
        tokenFmt      = this.getConfig().tokenFormat,
        targetKeyList = [
          'token',
          'client',
          'expiry',
          'uid',
          'reset_password',
          'account_confirmation_success'
        ];

    // only bother with this if minimum search params are present
    if (searchParams.token && searchParams.uid) {
      newHeaders = {};

      // save all headers that match the keys of the tokenFormat config param
      for (var key in tokenFmt) {
        newHeaders[key] = tmpl(tokenFmt[key], searchParams);
      }

      // save all token headers to session
      this.persistData(SAVED_CREDS_KEY, newHeaders);

      // check if user is returning from password reset link
      if (searchParams.reset_password) {
        this.mustResetPassword = true;
      }

      // check if user is returning from confirmation email
      if (searchParams.account_confirmation_success) {
        this.firstTimeLogin = true;
      }

      // strip all values from search params
      for (var q in targetKeyList) {
        delete searchParams[targetKeyList[q]];
      }

      // set qs without auth keys/values
      this.setQs(searchParams);
    }

    return newHeaders;
  };


  // abstract publish method, only use if pubsub exists.
  // TODO: allow broadcast method to be configured
  Auth.prototype.broadcastEvent = function(msg, data) {
    if ($.publish) {
      $.publish(msg, data);
    }
  };


  // always resolve after 0 timeout to ensure that ajaxComplete callback
  // has run before promise is resolved
  Auth.prototype.resolvePromise = function(evMsg, dfd, data) {
    var self = this;
    setTimeout(function() {
      self.broadcastEvent(evMsg, data);
      dfd.resolve(data);
    }, 0);
  };


  // always reject after 0 timeout to ensure that ajaxComplete callback
  // has run before promise is rejected
  Auth.prototype.rejectPromise = function(evMsg, dfd, data, reason) {
    var self = this;
    setTimeout(function() {
      self.broadcastEvent(evMsg, data);
      dfd.reject({
        reason: reason,
        data: data
      });
    }, 0);
  };


  // TODO: document
  Auth.prototype.validateToken = function(configKey) {
    var dfd = $.Deferred();

    // no creds, reject promise without making API call
    if (!this.retrieveData(SAVED_CREDS_KEY)) {
      // clear any saved session data
      this.invalidateTokens();

      // reject promise, broadcast event
      this.rejectPromise(
        VALIDATION_ERROR,
        dfd,
        {},
        'Cannot validate token; no token found.'
      );
    } else {
      var config = this.getConfig(configKey),
          url    = config.apiUrl + config.tokenValidationPath;

      // found saved creds, verify with API
      $.ajax({
        url:     url,
        context: this,

        success: function(resp) {
          // save user data, preserve bindings to original user object
          $.extend(this.user, resp);

          if (this.firstTimeLogin) {
            this.broadcastEvent(EMAIL_CONFIRMATION_SUCCESS, resp);
          }

          if (this.mustResetPassword) {
            this.broadcastEvent(PASSWORD_RESET_SUCCESS, resp);
          }

          this.resolvePromise(VALIDATION_SUCCESS, dfd, resp);
        },

        error: function(resp) {
          // clear any saved session data
          this.invalidateTokens();

          if (this.firstTimeLogin) {
            this.broadcastEvent(EMAIL_CONFIRMATION_ERROR, resp);
          }

          if (this.mustResetPassword) {
            this.broadcastEvent(PASSWORD_RESET_ERROR, resp);
          }

          this.rejectPromise(
            VALIDATION_ERROR,
            dfd,
            resp,
            'Cannot validate token; token rejected by server.'
          );
        }
      });
    }

    return dfd.promise();
  };


  // TODO: document
  Auth.prototype.emailSignUp = function(opts) {
    // normalize opts
    if (!opts) {
      opts = {};
    }

    var config = this.getConfig(opts.config),
        url    = config.apiUrl + config.emailRegistrationPath,
        dfd    = $.Deferred();

    $.ajax({
      url: url,
      context: this,
      method: 'POST',

      success: function(resp) {
        this.resolvePromise(EMAIL_REGISTRATION_SUCCESS, dfd, resp);
      },

      error: function(resp) {
        this.rejectPromise(
          EMAIL_REGISTRATION_ERROR,
          dfd,
          resp,
          'Failed to submit email registration.'
        );
      }
    });

    return dfd.promise();
  };

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

    // if value is a simple string, the parser will fail. in that case, simply
    // unescape the quotes and return the string.
    try {
      // return parsed json response
      return JSON.parse(val);
    } catch (err) {
      // unescape quotes
      return unescapeQuotes(val);
    }
  };


  // this method cannot rely on `retrieveData` because `retrieveData` relies
  // on `getConfig` and we need to get the config name before `getConfig` can
  // be called. TL;DR prevent infinite loop by checking all forms of storage
  // and returning the first config name found
  Auth.prototype.getCurrentConfigName = function() {
    var configName = null;

    if ($.cookie) {
      configName = $.cookie(SAVED_CONFIG_KEY);
    }

    if (window.localStorage && !configName) {
      configName = window.localStorage.getItem(SAVED_CONFIG_KEY);
    }

    return configName || this.defaultConfigKey || INITIAL_CONFIG_KEY;
  };


  // abstract deletion of session data
  Auth.prototype.deleteData = function(key) {
    switch (this.getConfig().storage) {
      case 'cookies':
        $.removeCookie(key, {
          path: this.getConfig().cookiePath
        });
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
    // configure if not configured
    if (!this.configured) {
      throw 'jToker: `configure` must be run before using this plugin.';
    }

    // fall back to default unless config key is passed
    key = key || this.getCurrentConfigName();

    return this.configs[key];
  };


  // send auth credentials with all requests to the API
  Auth.prototype.appendAuthHeaders = function(xhr, settings) {
    // fetch current auth headers from storage
    var currentHeaders = $.auth.retrieveData(SAVED_CREDS_KEY);

    // check config apiUrl matches the current request url
    if (isApiRequest(settings.url) && currentHeaders) {

      // set header for each key in `tokenFormat` config
      for (var key in $.auth.getConfig().tokenFormat) {
        xhr.setRequestHeader(key, currentHeaders[key]);
      }
    }
  };


  // update auth credentials after request is made to the API
  Auth.prototype.updateAuthCredentials = function(ev, xhr, settings) {
    // check config apiUrl matches the current response url
    if (isApiRequest(settings.url)) {
      // set header for each key in `tokenFormat` config
      var newHeaders = {};

      // set flag to ensure that we don't accidentally nuke the headers
      // if the response tokens aren't sent back from the API
      var blankHeaders = true;

      // set header key + val for each key in `tokenFormat` config
      for (var key in $.auth.getConfig().tokenFormat) {
        newHeaders[key] = xhr.getResponseHeader(key);

        if (newHeaders[key]) {
          blankHeaders = false;
        }
      }

      // persist headers for next request
      if (!blankHeaders) {
        $.auth.persistData(SAVED_CREDS_KEY, newHeaders);
      }
    }
  };


  // stub for mock overrides
  Auth.prototype.getRawSearch = function() {
    return window.location.search;
  };


  // stub for mock overrides
  Auth.prototype.setRawSearch = function(s) {
    window.location.search = s;
  };


  Auth.prototype.setQs = function(params) {
    this.setRawSearch($.param(params));
    return this.getQs();
  };


  Auth.prototype.getQs = function() {
    return window.deparam(this.getRawSearch());
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


  var isApiRequest = function(url) {
    return (url.match($.auth.getConfig().apiUrl));
  };


  // simple string templating. stolen from:
  // http://stackoverflow.com/questions/14879866/javascript-templating-function-replace-string-and-dont-take-care-of-whitespace
  var tmpl = function(str, obj) {
    var replacer = function(wholeMatch, key) {
          return obj[key] === undefined ? wholeMatch : obj[key];
        },
        regexp = new RegExp('{{\\s*([a-z0-9-_]+)\\s*}}',"ig");

    for(var beforeReplace = ""; beforeReplace !== str; str = (beforeReplace = str).replace(regexp, replacer)){

    }
    return str;
  };


  // check if using IE
  //var isIE = function() {
    //var ua = nav.userAgent.toLowerCase();
    //return (
      //ua && ua.indexOf('msie') !== -1) ||
      //!!ua.match(/Trident.*rv\:11\./
    //);
  //};


  // check if IE < 10
  //var isOldIE = function() {
    //var oldIE = false,
        //ua    = nav.userAgent.toLowerCase();

    //if (ua && ua.indexOf('msie') !== -1) {
      //var version = parseInt(ua.split('msie')[1]);
      //if (version < 10) {
        //oldIE = true;
      //}
    //}

    //return oldIE;
  //};


  // save global reference to service
  $.auth = new Auth();

}(jQuery));
