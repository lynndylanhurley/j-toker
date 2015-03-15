(function ($) {
  var sinon = window.sinon;

  QUnit.module('jQuery.auth.validateToken', {
    beforeEach: function() {
      this.server = sinon.fakeServer.create();
      sinon.spy($.auth, 'broadcastEvent');
      $.auth.reset();
    },

    afterEach: function() {
      this.server = sinon.fakeServer.restore();
      $.auth.broadcastEvent.restore();
    }
  });


  QUnit.test('saved config values are recovered after page reload (cookies)', function(assert) {
    var configName = 'cobra';

    $.auth.persistData('currentConfigName', configName);
    $.auth.recoverSession();

    assert.strictEqual(configName, $.auth.defaultConfigKey);
  });


  QUnit.test(
    '`validateToken` makes request to the API using default params',
    function(assert) {
      var currentToken = {'access-token': 'xxx'},
          newToken   = 'yyy',
          done       = assert.async(),
          validEmail = 'test@test.com',
          validUid   = validEmail;

      // mock success response
      this.server.respondWith('GET', '/api/auth/validate_token', [
        200, {
          'access-token': newToken,
          'Content-Type': 'application/json'
        }, JSON.stringify({
          email: validEmail,
          uid:   validUid
        })]);

      $.auth.persistData('authHeaders', currentToken);

      $.auth.validateToken()
        .then(function() {
          assert.strictEqual(
            newToken,
            $.auth.retrieveData('authHeaders')['access-token'],
            "new token was saved for next request"
          );

          assert.strictEqual(
            'auth.validationSuccess',
            $.auth.broadcastEvent.getCall(0).args[0],
            '`auth.validationSuccess` event was broadcast'
          );

          done();
        });

      this.server.respond();

      assert.strictEqual(
        1,
        this.server.requests.length,
        "only one request was made"
      );
    }
  );


  QUnit.test(
    '`validateToken` does not make API request unless token is found',
    function(assert) {
      var done   = assert.async(),
          server = this.server;

      $.auth.validateToken()
        .fail(function() {
          assert.strictEqual(
            0,
            server.requests.length,
            "no API requests were made"
          );

          assert.strictEqual(
            'auth.validationError',
            $.auth.broadcastEvent.getCall(0).args[0],
            '`auth.validationError` event was broadcast'
          );

          done();
        });
    }
  );


  QUnit.test(
    '`validateToken` rejects promise when bogus headers are used',
    function(assert) {
      var done         = assert.async(),
          server       = this.server;

      // set header so jToker actually makes request
      $.auth.persistData('authHeaders', {'access-token': 'bogus'});

      // mock failure response
      this.server.respondWith('GET', '/api/auth/validate_token', [401, {
        'Content-Type': 'application/json'
      }, JSON.stringify({message: 'invalid token'})]);

      // try to validate bad token
      $.auth.validateToken()
        .fail(function() {
          assert.strictEqual(
            1,
            server.requests.length,
            "1 API request was made"
          );

          assert.strictEqual(
            undefined,
            $.auth.retrieveData('authHeaders'),
            'saved creds were cleared'
          );

          assert.strictEqual(
            undefined,
            $.auth.retrieveData('currentConfigName'),
            'currentConfigName value was reset'
          );

          assert.strictEqual(
            'auth.validationError',
            $.auth.broadcastEvent.getCall(0).args[0],
            '`auth.validationError` event was broadcast'
          );

          done();
        });

      this.server.respond();
    }
  );

}(jQuery));
