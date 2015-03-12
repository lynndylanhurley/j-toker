(function ($) {
  module('jQuery.auth.validateToken');


  QUnit.testStart(function() {
    $.auth.reset();
  });


  QUnit.test('saved config values are recovered after page reload (cookies)', function() {
    var configName = 'cobra';

    $.auth.persistData('currentConfigName', configName);
    $.auth.recoverSession();

    strictEqual(configName, $.auth.defaultConfigKey);
  });


  QUnit.test('`validateToken` makes request to the API using default params', function() {
    var dfd   = $.Deferred(),
        token = {'access-token': 'xxx'};

    $.mockjax(function(req) {
      if (req.authorized) {
        deepEqual(token['access-token'], req.headers['access-token']);
      }
      return req;
    });

    $.mockjax({
      url: '/api/auth/validate_token',
      responseText: {success: true},
      headers: {'access-token': 'yyy'}
    });

    $.auth.persistData('authHeaders', token);

    $.auth.validateToken()
      .then(function(resp) {
        console.log('resp', resp);
        dfd.resolve();
      }, function() {
        dfd.reject();
      });

    return dfd.promise;
  });

}(jQuery));
