(function ($) {
  var sinon = window.sinon,
      defaultConfig = {
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
        validateOnPageLoad:    true,
        forceHardRedirect:     false,
        storage:               'cookies',

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


  QUnit.module('jQuery.auth.configure', {
    beforeEach: function() {
      sinon.spy($.auth, 'configure');
    },

    afterEach: function() {
      $.auth.configure.restore();
      $.auth.reset();
    }
  });


  QUnit.test('scenario 1: no session, using no configuration', function(assert) {
    // reset to zero config
    $.auth.configure(null, true);

    var expected = defaultConfig;
    var actual   = $.auth.getConfig();

    assert.strictEqual(expected.apiUrl,                actual.apiUrl);
    assert.strictEqual(expected.signOutPath,           actual.signOutPath);
    assert.strictEqual(expected.emailSignInPath,       actual.emailSignInPath);
    assert.strictEqual(expected.emailRegistrationPath, actual.emailRegistrationPath);
    assert.strictEqual(expected.accountUpdatePath,     actual.accountUpdatePath);
    assert.strictEqual(expected.accountDeletePath,     actual.accountDeletePath);
    assert.strictEqual(expected.passwordResetPath,     actual.passwordResetPath);
    assert.strictEqual(expected.passwordUpdatePath,    actual.passwordUpdatePath);
    assert.strictEqual(expected.tokenValidationPath,   actual.tokenValidationPath);
    assert.strictEqual(expected.proxyUrl,              actual.proxyUrl);
    assert.strictEqual(expected.forceHardRedirect,     actual.forceHardRedirect);
    assert.strictEqual(expected.storage,               actual.storage);

    assert.strictEqual(expected.proxyIf(), actual.proxyIf());
    assert.strictEqual(expected.passwordResetSuccessUrl(), actual.passwordResetSuccessUrl());
    assert.strictEqual(expected.confirmationSuccessUrl(), actual.confirmationSuccessUrl());

    assert.deepEqual(expected.tokenFormat, actual.tokenFormat);
    assert.deepEqual(expected.authProviderPaths, actual.authProviderPaths);

    assert.ok(
      $.auth.configure.calledOnce,
      '`configure` was only called once and only once'
    );
  });


  QUnit.test('scenario 2a: no session, using custom configuration', function(assert) {
    var apiUrl = '//api.cyclonopedia.dev';

    $.auth.configure({apiUrl: apiUrl}, true);

    assert.strictEqual(
      apiUrl,
      $.auth.getConfig().apiUrl,
      'custom config overrides default settings'
    );

    assert.strictEqual(
      defaultConfig.signOutPath,
      $.auth.getConfig().signOutPath,
      'config retains defalt where not overridden'
    );

    assert.ok(
      $.auth.configure.calledOnce,
      '`configure` was only called once and only once'
    );
  });


  QUnit.test('scenario 2b: no session, using multiple configs', function(assert) {
    var defaultApiUrl = '//api.cyclonopedia.dev',
        secondApiUrl  = '//api.contra3.dev',
        signOutPath   = defaultConfig.signOutPath;

    $.auth.configure([
      {first:  {apiUrl: defaultApiUrl}},
      {second: {apiUrl: secondApiUrl}}
    ], true);

    assert.ok(
      $.auth.configure.calledOnce,
      '`configure` was only called once and only once'
    );

    assert.strictEqual(
      defaultApiUrl,
      $.auth.getConfig('first').apiUrl,
      'first config overrides default settings'
    );

    assert.strictEqual(
      secondApiUrl,
      $.auth.getConfig('second').apiUrl,
      'second config overrides default settings'
    );

    assert.strictEqual(
      defaultApiUrl,
      $.auth.getConfig().apiUrl,
      'first item in config array is used as the default config'
    );

    assert.strictEqual(
      signOutPath,
      $.auth.getConfig('first').signOutPath,
      'first config retains defaults where not overriden'
    );

    assert.strictEqual(
      signOutPath,
      $.auth.getConfig('second').signOutPath,
      'second config retains defaults where not overriden'
    );
  });


  QUnit.test('scenario 3a: recovered session, using custom configs', function(assert) {
    var defaultApiUrl = '//api.cyclonopedia.dev',
        secondApiUrl  = '//api.contra3.dev';

    $.auth.configure([
      {first:  {apiUrl: defaultApiUrl}},
      {second: {apiUrl: secondApiUrl}}
    ], true);

    $.cookie('currentConfigName', 'second', {path: '/'});

    assert.ok(
      $.auth.configure.calledOnce,
      '`configure` was only called once and only once'
    );

    assert.strictEqual(
      $.auth.getConfig().apiUrl,
      secondApiUrl,
      'current config was recovered from session data'
    );
  });


  QUnit.test('scenario 3a: recovered session, using default config', function(assert) {
    var defaultApiUrl = '//api.cyclonopedia.dev';

    $.cookie('currentConfigName', 'default', {path: '/'});

    $.auth.configure({apiUrl: defaultApiUrl}, true);

    assert.ok(
      $.auth.configure.calledOnce,
      '`configure` was only called once and only once'
    );

    assert.strictEqual(
      $.auth.getConfig().apiUrl,
      defaultApiUrl,
      'current config was recovered from session data'
    );
  });

}(jQuery));
