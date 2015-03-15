(function ($) {
  QUnit.module('jQuery.auth.configure');

  QUnit.testStart(function() {
    $.auth.reset();
  });


  QUnit.test('config happens lazily unless done explicitly', function(assert) {
    var expected = window.defaultConfig;
    var actual   = $.auth.getConfig();

    assert.strictEqual(expected.apiUrl,                actual.apiUrl);
    assert.strictEqual(expected.signOutUrl,            actual.signOutUrl);
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
  });


  QUnit.test('config params override the defaults', function(assert) {
    var apiUrl = '//api.cyclonopedia.dev';

    $.auth.configure({apiUrl: apiUrl});
    assert.strictEqual(apiUrl, $.auth.getConfig().apiUrl);
    assert.strictEqual(window.defaultConfig.signOutUrl, $.auth.getConfig().signOutUrl);
  });


  QUnit.test('multiple configs both extend the defaults', function(assert) {
    var defaultApiUrl = '//api.cyclonopedia.dev';
    var secondApiUrl  = '//api.contra3.dev';
    var signOutUrl    = window.defaultConfig.signOutUrl;

    $.auth.configure([
      {
        first: {
          apiUrl: defaultApiUrl
        }
      },
      {
        second: {
          apiUrl: secondApiUrl
        }
      }
    ]);

    // both override the defaults
    assert.strictEqual(defaultApiUrl, $.auth.getConfig('first').apiUrl);
    assert.strictEqual(secondApiUrl, $.auth.getConfig('second').apiUrl);

    // 'first' item in array is set to default
    assert.strictEqual(defaultApiUrl, $.auth.getConfig().apiUrl);

    // both retain the defaults where not overridden
    assert.strictEqual(signOutUrl, $.auth.getConfig('first').signOutUrl);
    assert.strictEqual(signOutUrl, $.auth.getConfig('second').signOutUrl);
  });

}(jQuery));
