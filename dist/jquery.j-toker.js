/*! j-toker - v0.0.6 - 2015-06-01
* Copyright (c) 2015 Lynn Dylan Hurley; Licensed WTFPL */
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([
      'jquery',
      'jquery-deparam',
      'pubsub-js',
      'jquery.cookie'
    ], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS
    module.exports = factory(
      require('jquery'),
      require('jquery-deparam'),
      require('pubsub-js'),
      require('jquery.cookie')
    );
  } else {
    // Browser globals
    factory(jQuery, window.deparam, window.PubSub);
  }
}(function ($, deparam, PubSub) {
  // singleton baby
  if ($.auth) {
    return $.auth;
  }

  // use for IE detection
  var nav = window.navigator;

  // cookie/localStorage value keys
  var INITIAL_CONFIG_KEY = 'default',
      SAVED_CONFIG_KEY   = 'currentConfigName',
      SAVED_CREDS_KEY    = 'authHeaders';

  // broadcast message event name constants (use constants to avoid typos)
  var VALIDATION_SUCCESS             = 'auth.validation.success',
      VALIDATION_ERROR               = 'auth.validation.error',
      EMAIL_REGISTRATION_SUCCESS     = 'auth.emailRegistration.success',
      EMAIL_REGISTRATION_ERROR       = 'auth.emailRegistration.error',
      PASSWORD_RESET_REQUEST_SUCCESS = 'auth.passwordResetRequest.success',
      PASSWORD_RESET_REQUEST_ERROR   = 'auth.passwordResetRequest.error',
      EMAIL_CONFIRMATION_SUCCESS     = 'auth.emailConfirmation.success',
      EMAIL_CONFIRMATION_ERROR       = 'auth.emailConfirmation.error',
      PASSWORD_RESET_CONFIRM_SUCCESS = 'auth.passwordResetConfirm.success',
      PASSWORD_RESET_CONFIRM_ERROR   = 'auth.passwordResetConfirm.error',
      EMAIL_SIGN_IN_SUCCESS          = 'auth.emailSignIn.success',
      EMAIL_SIGN_IN_ERROR            = 'auth.emailSignIn.error',
      OAUTH_SIGN_IN_SUCCESS          = 'auth.oAuthSignIn.success',
      OAUTH_SIGN_IN_ERROR            = 'auth.oAuthSignIn.error',
      SIGN_IN_SUCCESS                = 'auth.signIn.success',
      SIGN_IN_ERROR                  = 'auth.signIn.error',
      SIGN_OUT_SUCCESS               = 'auth.signOut.success',
      SIGN_OUT_ERROR                 = 'auth.signOut.error',
      ACCOUNT_UPDATE_SUCCESS         = 'auth.accountUpdate.success',
      ACCOUNT_UPDATE_ERROR           = 'auth.accountUpdate.error',
      DESTROY_ACCOUNT_SUCCESS        = 'auth.destroyAccount.success',
      DESTROY_ACCOUNT_ERROR          = 'auth.destroyAccount.error',
      PASSWORD_UPDATE_SUCCESS        = 'auth.passwordUpdate.success',
      PASSWORD_UPDATE_ERROR          = 'auth.passwordUpdate.error';

  var Auth = function () {
    // set flag so we know when plugin has been configured.
    this.configured = false;

    // configs hash allows for multiple configurations
    this.configs = {};

    // default config will be first named config or "default"
    this.defaultConfigKey = null;

    // flagged when users return from email confirmation
    this.firstTimeLogin = false;

    // flagged when users return from password change confirmation
    this.mustResetPassword = false;

    // save reference to user
    this.user = {};

    // oAuth promise is kept while visiting provider
    this.oAuthDfd = null;

    // timer is used to poll external auth window while authenticating via OAuth
    this.oAuthTimer = null;

    // base config from which other configs are extended
    this.configBase = {
      apiUrl:                '/api',
      signOutPath:           '/auth/sign_out',
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
        "access-token": "{{ access-token }}",
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

    this.configs           = {};
    this.defaultConfigKey  = null;
    this.configured        = false;
    this.mustResetPassword = false;
    this.firstTimeLogin    = false;
    this.oAuthDfd = null;

    if (this.oAuthTimer) {
      clearTimeout(this.oAuthTimer);
      this.oAuthTimer = null;
    }

    // clear user object
    for (var key in this.user) {
      delete this.user[key];
    }

    // remove event listeners
    $(document).unbind('ajaxComplete', this.updateAuthCredentials);

    if (window.removeEventListener) {
      window.removeEventListener('message', this.handlePostMessage);
    }

    // remove global ajax "interceptors"
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

    if (!deparam) {
      errors.push('Dependency not met: jquery-deparam.');
    }

    if (!PubSub) {
      warnings.push(
        'jquery.ba-tinypubsub.js not found. No auth events will be broadcast.'
      );
    }

    if (errors.length) {
      var errMessage = errors.join(' ');
      throw 'jToker: Please resolve the following errors: ' + errMessage;
    }

    if (warnings.length && console && console.warn) {
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
    for (var i = 0; i < opts.length; i++) {
      var configName = getFirstObjectKey(opts[i]);

      // set first set as default config
      if (!this.defaultConfigKey) {
        this.defaultConfigKey = configName;
      }

      // save config to `configs` hash
      this.configs[configName] = $.extend(
        {}, this.configBase, opts[i][configName]
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

    // IE8 won't have this feature
    if (window.addEventListener) {
      window.addEventListener("message", this.handlePostMessage, false);
    }

    // pull creds from search bar if available
    this.processSearchParams();

    // validate token if set
    return this.validateToken({config: this.getCurrentConfigName()});
  };


  Auth.prototype.getApiUrl = function() {
    var config = this.getConfig();
    return (config.proxyIf()) ? config.proxyUrl : config.apiUrl;
  };


  // interpolate values of tokenFormat hash with ctx, return new hash
  Auth.prototype.buildAuthHeaders = function(ctx) {
    var headers = {},
        fmt = this.getConfig().tokenFormat;

    for (var key in fmt) {
      headers[key] = tmpl(fmt[key], ctx);
    }

    return headers;
  };


  Auth.prototype.setCurrentUser = function(user) {
    // clear user object of any existing attributes
    for (var key in this.user) {
      delete this.user[key];
    }

    // save user data, preserve bindings to original user object
    $.extend(this.user, user);

    this.user.signedIn = true;
    this.user.configName = this.getCurrentConfigName();

    return this.user;
  };


  Auth.prototype.handlePostMessage = function(ev) {
    var stopListening = false;

    if (ev.data.message === 'deliverCredentials') {
      delete ev.data.message;

      var initialHeaders = $.auth.normalizeTokenKeys(ev.data),
          authHeaders    = $.auth.buildAuthHeaders(initialHeaders),
          user           = $.auth.setCurrentUser(ev.data);

      $.auth.persistData(SAVED_CREDS_KEY, authHeaders);
      $.auth.resolvePromise(OAUTH_SIGN_IN_SUCCESS, $.auth.oAuthDfd, user);
      $.auth.broadcastEvent(SIGN_IN_SUCCESS, user);
      $.auth.broadcastEvent(VALIDATION_SUCCESS, user);

      stopListening = true;
    }

    if (ev.data.message === 'authFailure') {
      $.auth.rejectPromise(
        OAUTH_SIGN_IN_ERROR,
        $.auth.oAuthDfd,
        ev.data,
        'OAuth authentication failed.'
      );

      $.auth.broadcastEvent(SIGN_IN_ERROR, ev.data);

      stopListening = true;
    }

    if (stopListening) {
      clearTimeout($.auth.oAuthTimer);
      $.auth.oAuthTimer = null;
    }
  };


  // compensate for poor naming decisions made early on
  // TODO: fix API so this isn't necessary
  Auth.prototype.normalizeTokenKeys = function(params) {
    // normalize keys
    if (params.token) {
      params['access-token'] = params.token;
      delete params.token;
    }
    if (params.auth_token) {
      params['access-token'] = params.auth_token;
      delete params.auth_token;
    }
    if (params.client_id) {
      params.client = params.client_id;
      delete params.client_id;
    }

    if (params.config) {
      this.persistData(
        SAVED_CONFIG_KEY,
        params.config,
        params.config
      );
      delete params.config;
    }


    return params;
  };


  Auth.prototype.processSearchParams = function() {
    var searchParams  = this.getQs(),
        newHeaders    = null;

    searchParams = this.normalizeTokenKeys(searchParams);

    // only bother with this if minimum search params are present
    if (searchParams['access-token'] && searchParams.uid) {
      newHeaders = this.buildAuthHeaders(searchParams);

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

      // TODO: set uri flag on devise_token_auth for OAuth confirmation
      // when using hard page redirects.

      // set qs without auth keys/values
      var newLocation = this.getLocationWithoutParams([
        'access-token',
        'token',
        'auth_token',
        'config',
        'client',
        'client_id',
        'expiry',
        'uid',
        'reset_password',
        'account_confirmation_success'
      ]);

      this.setLocation(newLocation);
    }

    return newHeaders;
  };


  // this method is tricky. we want to reconstruct the current URL with the
  // following conditions:
  // 1. search contains none of the supplied keys
  // 2. anchor search (i.e. `#/?key=val`) contains none of the supplied keys
  // 3. all of the keys NOT supplied are presevered in their original form
  // 4. url protocol, host, and path are preserved
  Auth.prototype.getLocationWithoutParams = function(keys) {
    // strip all values from both actual and anchor search params
    var newSearch   = $.param(this.stripKeys(this.getSearchQs(), keys)),
        newAnchorQs = $.param(this.stripKeys(this.getAnchorQs(), keys)),
        newAnchor   = window.location.hash.split('?')[0];

    if (newSearch) {
      newSearch = "?" + newSearch;
    }

    if (newAnchorQs) {
      newAnchor += "?" + newAnchorQs;
    }

    if (newAnchor && !newAnchor.match(/^#/)) {
      newAnchor = "#/" + newAnchor;
    }

    // reconstruct location with stripped auth keys
    var newLocation = window.location.protocol +
                      '//'+
                      window.location.host+
                      window.location.pathname+
                      newSearch+
                      newAnchor;

    return newLocation;
  };


  Auth.prototype.stripKeys = function(obj, keys) {
    for (var q in keys) {
      delete obj[keys[q]];
    }

    return obj;
  };


  // abstract publish method, only use if pubsub exists.
  // TODO: allow broadcast method to be configured
  Auth.prototype.broadcastEvent = function(msg, data) {
    if (PubSub.publish) {
      PubSub.publish(msg, data);
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

    // jQuery has a strange way of returning error responses...
    data = $.parseJSON(data.responseText || '{}');

    setTimeout(function() {
      self.broadcastEvent(evMsg, data);
      dfd.reject({
        reason: reason,
        data: data
      });
    }, 0);
  };


  // TODO: document
  Auth.prototype.validateToken = function(opts) {
    if (!opts) {
      opts = {};
    }

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
      var config = this.getConfig(opts.config),
          url    = this.getApiUrl() + config.tokenValidationPath;

      // found saved creds, verify with API
      $.ajax({
        url:     url,
        context: this,

        success: function(resp) {
          var user = config.handleTokenValidationResponse(resp);

          this.setCurrentUser(user);

          if (this.firstTimeLogin) {
            this.broadcastEvent(EMAIL_CONFIRMATION_SUCCESS, resp);
          }

          if (this.mustResetPassword) {
            this.broadcastEvent(PASSWORD_RESET_CONFIRM_SUCCESS, resp);
          }

          this.resolvePromise(VALIDATION_SUCCESS, dfd, this.user);
        },

        error: function(resp) {
          // clear any saved session data
          this.invalidateTokens();

          if (this.firstTimeLogin) {
            this.broadcastEvent(EMAIL_CONFIRMATION_ERROR, resp);
          }

          if (this.mustResetPassword) {
            this.broadcastEvent(PASSWORD_RESET_CONFIRM_ERROR, resp);
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
        url    = this.getApiUrl() + config.emailRegistrationPath,
        dfd    = $.Deferred();

    opts.config_name = opts.config;
    delete opts.config;

    opts.confirm_success_url = config.confirmationSuccessUrl();

    $.ajax({
      url: url,
      context: this,
      method: 'POST',
      data: opts,

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


  Auth.prototype.emailSignIn = function(opts) {
    // normalize opts
    if (!opts) {
      opts = {};
    }

    var config = this.getConfig(opts.config),
        url    = this.getApiUrl() + config.emailSignInPath,
        dfd    = $.Deferred();

    // don't send config name to API
    delete opts.config;

    $.ajax({
      url: url,
      context: this,
      method: 'POST',
      data: opts,

      success: function(resp) {
        // return user attrs as directed by config
        var user = config.handleLoginResponse(resp);

        // save user data, preserve bindings to original user object
        this.setCurrentUser(user);

        this.resolvePromise(EMAIL_SIGN_IN_SUCCESS, dfd, resp);
        this.broadcastEvent(SIGN_IN_SUCCESS, user);
        this.broadcastEvent(VALIDATION_SUCCESS, this.user);
      },

      error: function(resp) {
        this.rejectPromise(
          EMAIL_SIGN_IN_ERROR,
          dfd,
          resp,
          'Invalid credentials.'
        );

        this.broadcastEvent(SIGN_IN_ERROR, resp);
      }
    });

    return dfd.promise();
  };


  // ping auth window to see if user has completed authentication.
  // this method will be recursively called until:
  // 1. user completes authentication
  // 2. user fails authentication
  // 3. auth window is closed
  Auth.prototype.listenForCredentials = function(popup) {
    if (popup.closed) {
      this.rejectPromise(
        OAUTH_SIGN_IN_ERROR,
        this.oAuthDfd,
        null,
        'OAuth window was closed bofore registration was completed.'
      );
    } else {
      var self = this;
      popup.postMessage('requestCredentials', '*');
      this.oAuthTimer = setTimeout(function() {
        self.listenForCredentials(popup);
      }, 500);
    }
  };


  Auth.prototype.openAuthWindow = function(url) {
    if (this.getConfig().forceHardRedirect || window.isIE()) {
      // redirect to external auth provider. credentials should be
      // provided in location search hash upon return
      this.setLocation(url);
    } else {
      // open popup to external auth provider
      var popup = this.createPopup(url);

      // listen for postMessage response
      this.listenForCredentials(popup);
    }
  };


  Auth.prototype.buildOAuthUrl = function(configName, provider, params) {
    var config = this.getConfig(configName),
        oAuthUrl = this.getConfig().apiUrl + config.authProviderPaths[provider] +
          '?auth_origin_url='+encodeURIComponent(window.location.href) +
          '&config_name='+encodeURIComponent(configName || this.getCurrentConfigName());

    if (params) {
      for(var key in params) {
        oAuthUrl += '&';
        oAuthUrl += encodeURIComponent(key);
        oAuthUrl += '=';
        oAuthUrl += encodeURIComponent(params[key]);
      }
    }

    return oAuthUrl;
  };


  Auth.prototype.oAuthSignIn = function(opts) {
    // normalize opts
    if (!opts) {
      opts = {};
    }

    if (!opts.provider) {
      throw 'jToker: provider param undefined for `oAuthSignIn` method.';
    }

    var config       = this.getConfig(opts.config),
        providerPath = config.authProviderPaths[opts.provider],
        oAuthUrl     = this.buildOAuthUrl(opts.config, opts.provider, opts.params);

    if (!providerPath) {
      throw 'jToker: providerPath not found for provider: '+opts.provider;
    }

    // save oAuth promise until response is received
    this.oAuthDfd = $.Deferred();

    // open link to provider auth screen
    this.openAuthWindow(oAuthUrl);

    return this.oAuthDfd.promise();
  };


  Auth.prototype.signOut = function(opts) {
    if (!opts) {
      opts = {};
    }

    var config     = this.getConfig(opts.config),
        signOutUrl = this.getApiUrl() + config.signOutPath,
        dfd        = $.Deferred();

    $.ajax({
      url: signOutUrl,
      context: this,
      method: 'DELETE',

      success: function(resp) {
        this.resolvePromise(SIGN_OUT_SUCCESS, dfd, resp);
      },

      error: function(resp) {
        this.rejectPromise(
          SIGN_OUT_ERROR,
          dfd,
          resp,
          'Failed to sign out.'
        );
      },

      complete: function() {
        this.invalidateTokens();
      }
    });

    return dfd.promise();
  };


  Auth.prototype.updateAccount = function(opts) {
    if (!opts) {
      opts = {};
    }

    var config = this.getConfig(opts.config),
        url    = this.getApiUrl() + config.accountUpdatePath,
        dfd    = $.Deferred();

    delete opts.config;

    $.ajax({
      url: url,
      context: this,
      method: 'PUT',
      data: opts,

      success: function(resp) {
        var user = config.handleAccountUpdateResponse(resp);
        this.setCurrentUser(user);
        this.resolvePromise(ACCOUNT_UPDATE_SUCCESS, dfd, resp);
      },

      error: function(resp) {
        this.rejectPromise(
          ACCOUNT_UPDATE_ERROR,
          dfd,
          resp,
          'Failed to update user account'
        );
      }
    });

    return dfd.promise();
  };


  Auth.prototype.destroyAccount = function(opts) {
    if (!opts) {
      opts = {};
    }

    var config = this.getConfig(opts.config),
        url    = this.getApiUrl() + config.accountDeletePath,
        dfd    = $.Deferred();

    $.ajax({
      url: url,
      context: this,
      method: 'DELETE',

      success: function(resp) {
        this.invalidateTokens();
        this.resolvePromise(DESTROY_ACCOUNT_SUCCESS, dfd, resp);
      },

      error: function(resp) {
        this.rejectPromise(
          DESTROY_ACCOUNT_ERROR,
          dfd,
          resp,
          'Failed to destroy user account'
        );
      }
    });

    return dfd.promise();
  };


  // TODO: implement re-confirmable on devise_token_auth
  //Auth.prototype.resendConfirmation = function(email) {};

  Auth.prototype.requestPasswordReset = function(opts) {
    // normalize opts
    if (!opts) {
      opts = {};
    }

    if (opts.email === undefined) {
      throw "jToker: email param undefined for `requestPasswordReset` method.";
    }

    var config = this.getConfig(opts.config),
        url    = this.getApiUrl() + config.passwordResetPath,
        dfd    = $.Deferred();

    opts.config_name = opts.config;
    delete opts.config;

    opts.redirect_url = config.passwordResetSuccessUrl();

    $.ajax({
      url: url,
      context: this,
      method: 'POST',
      data: opts,

      success: function(resp) {
        this.resolvePromise(PASSWORD_RESET_REQUEST_SUCCESS, dfd, resp);
      },

      error: function(resp) {
        this.rejectPromise(
          PASSWORD_RESET_REQUEST_ERROR,
          dfd,
          resp,
          'Failed to submit email registration.'
        );
      }
    });

    return dfd.promise();
  };


  Auth.prototype.updatePassword = function(opts) {
    if (!opts) {
      opts = {};
    }

    var config = this.getConfig(opts.config),
        url    = this.getApiUrl() + config.passwordUpdatePath,
        dfd    = $.Deferred();

    delete opts.config;

    $.ajax({
      url: url,
      context: this,
      method: 'PUT',
      data: opts,

      success: function(resp) {
        this.resolvePromise(PASSWORD_UPDATE_SUCCESS, dfd, resp);
      },

      error: function(resp) {
        this.rejectPromise(
          PASSWORD_UPDATE_ERROR,
          dfd,
          resp,
          'Failed to update password.'
        );
      }
    });

    return dfd.promise();
  };


  // abstract storing of session data
  Auth.prototype.persistData = function(key, val, config) {
    val = JSON.stringify(val);

    switch (this.getConfig(config).storage) {
      case 'cookies':
        $.cookie(key, val, {
          expires: this.getConfig(config).cookieExpiry,
          path:    this.getConfig(config).cookiePath
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
      return $.parseJSON(val);
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

    if (this.getQs().config) {
      configName = this.getQs().config;
    }

    if ($.cookie && !configName) {
      configName = $.cookie(SAVED_CONFIG_KEY);
    }

    if (window.localStorage && !configName) {
      configName = window.localStorage.getItem(SAVED_CONFIG_KEY);
    }

    configName = configName || this.defaultConfigKey || INITIAL_CONFIG_KEY;

    return unescapeQuotes(configName);
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

      // bust IE cache
      xhr.setRequestHeader(
        'If-Modified-Since',
        'Mon, 26 Jul 1997 05:00:00 GMT'
      );

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
  Auth.prototype.getRawAnchor = function() {
    return window.location.hash;
  };


  Auth.prototype.setRawAnchor = function(a) {
    window.location.hash = a;
  };


  Auth.prototype.getAnchorSearch = function() {
    var arr = this.getRawAnchor().split('?');
    return (arr.length > 1) ? arr[1] : null;
  };


  // stub for mock overrides
  Auth.prototype.setRawSearch = function(s) {
    window.location.search = s;
  };


  // stub for mock overrides
  Auth.prototype.setSearchQs = function(params) {
    this.setRawSearch($.param(params));
    return this.getSearchQs();
  };


  Auth.prototype.setAnchorQs = function(params) {
    this.setAnchorSearch($.param(params));
    return this.getAnchorQs();
  };


  // stub for mock overrides
  Auth.prototype.setLocation = function(url) {
    window.location.replace(url);
  };


  // stub for mock overrides
  Auth.prototype.createPopup = function(url) {
    return window.open(url);
  };


  Auth.prototype.getSearchQs = function() {
    var qs          = this.getRawSearch().replace('?', ''),
        qsObj       = (qs) ? deparam(qs) : {};

    return qsObj;
  };


  Auth.prototype.getAnchorQs = function() {
    var anchorQs    = this.getAnchorSearch(),
        anchorQsObj = (anchorQs) ? deparam(anchorQs) : {};

    return anchorQsObj;
  };


  // stub for mock overrides
  Auth.prototype.getQs = function() {
    return $.extend(this.getSearchQs(), this.getAnchorQs());
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
    return (url.match($.auth.getApiUrl()));
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


  // check if IE < 10
  window.isOldIE = function() {
    var oldIE = false,
        ua    = nav.userAgent.toLowerCase();

    if (ua && ua.indexOf('msie') !== -1) {
      var version = parseInt(ua.split('msie')[1]);
      if (version < 10) {
        oldIE = true;
      }
    }

    return oldIE;
  };


  // check if using IE
  window.isIE = function() {
    var ieLTE10 = window.isOldIE(),
        ie11    = !!nav.userAgent.match(/Trident.*rv\:11\./);

    return (ieLTE10 || ie11);
  };


  // export service
  $.auth = new Auth();

  return $.auth;

}));
