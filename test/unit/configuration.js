(function ($) {
  module('jQuery.auth.configure');

  QUnit.testStart(function() {
    $.auth.reset();
  });


  QUnit.test('config happens lazily unless done explicitly', function() {
    var expected = window.defaultConfig;
    var actual   = $.auth.getConfig();

    strictEqual(expected.apiUrl,                actual.apiUrl);
    strictEqual(expected.signOutUrl,            actual.signOutUrl);
    strictEqual(expected.emailSignInPath,       actual.emailSignInPath);
    strictEqual(expected.emailRegistrationPath, actual.emailRegistrationPath);
    strictEqual(expected.accountUpdatePath,     actual.accountUpdatePath);
    strictEqual(expected.accountDeletePath,     actual.accountDeletePath);
    strictEqual(expected.passwordResetPath,     actual.passwordResetPath);
    strictEqual(expected.passwordUpdatePath,    actual.passwordUpdatePath);
    strictEqual(expected.tokenValidationPath,   actual.tokenValidationPath);
    strictEqual(expected.proxyUrl,              actual.proxyUrl);
    //strictEqual(expected.validateOnPageLoad,    actual.validateOnPageLoad);
    strictEqual(expected.forceHardRedirect,     actual.forceHardRedirect);
    strictEqual(expected.storage,               actual.storage);

    strictEqual(expected.proxyIf(), actual.proxyIf());
    strictEqual(expected.passwordResetSuccessUrl(), actual.passwordResetSuccessUrl());
    strictEqual(expected.confirmationSuccessUrl(), actual.confirmationSuccessUrl());

    deepEqual(expected.tokenFormat, actual.tokenFormat);
    deepEqual(expected.authProviderPaths, actual.authProviderPaths);
  });


  QUnit.test('config params override the defaults', function() {
    var apiUrl = '//api.cyclonopedia.dev';

    $.auth.configure({apiUrl: apiUrl});
    strictEqual(apiUrl, $.auth.getConfig().apiUrl);
    strictEqual(window.defaultConfig.signOutUrl, $.auth.getConfig().signOutUrl);
  });


  QUnit.test('multiple configs both extend the defaults', function() {
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
    strictEqual(defaultApiUrl, $.auth.getConfig('first').apiUrl);
    strictEqual(secondApiUrl, $.auth.getConfig('second').apiUrl);

    // 'first' item in array is set to default
    strictEqual(defaultApiUrl, $.auth.getConfig().apiUrl);

    // both retain the defaults where not overridden
    strictEqual(signOutUrl, $.auth.getConfig('first').signOutUrl);
    strictEqual(signOutUrl, $.auth.getConfig('second').signOutUrl);
  });

}(jQuery));
