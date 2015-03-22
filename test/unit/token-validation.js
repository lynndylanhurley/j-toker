(function ($) {
  var sinon = window.sinon;

  QUnit.module('jQuery.auth.validateToken', {
    beforeEach: function() {
      this.server = sinon.fakeServer.create();
      $.auth.configure(null, true);
      sinon.spy($.auth, 'broadcastEvent');
    },

    afterEach: function() {
      this.server = sinon.fakeServer.restore();
      $.auth.broadcastEvent.restore();
      $.auth.reset();
    }
  });


  QUnit.test(
    '`validateToken` makes request to the API using default params',
    function(assert) {
      var currentToken = {'access-token': 'xxx'},
          newToken     = 'yyy',
          validEmail   = 'test@test.com',
          validUid     = validEmail,
          done         = assert.async(),
          userObj      = {
            email:    validEmail,
            uid:      validUid
          };

      // mock success response
      this.server.respondWith('GET', '/api/auth/validate_token', [
        200, {
          'access-token': newToken,
          'Content-Type': 'application/json'
        }, JSON.stringify({
          data: {
            email: validEmail,
            uid:   validUid
          }
        })]);

      $.auth.persistData('authHeaders', currentToken);

      $.auth.validateToken()
        .then(function() {
          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.validation.success'),
            '`auth.validation.success` event was broadcast'
          );

          done();
        });

      this.server.respond();

      assert.strictEqual(
        1,
        this.server.requests.length,
        "only one request was made"
      );

      assert.strictEqual(
        newToken,
        $.auth.retrieveData('authHeaders')['access-token'],
        "new token was saved for next request"
      );

      assert.deepEqual(
        $.extend(userObj, {
          signedIn: true,
          configName: 'default'
        }),
        $.auth.user,
        "user attributes were loaded into $.auth.user"
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

          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.validation.error'),
            '`auth.validation.error` event was broadcast'
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
            'auth.validation.error',
            $.auth.broadcastEvent.getCall(0).args[0],
            '`auth.validation.error` event was broadcast'
          );

          done();
        });

      this.server.respond();
    }
  );

}(jQuery));
