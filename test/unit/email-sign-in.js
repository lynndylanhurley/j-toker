(function ($) {
  var sinon = window.sinon;

  QUnit.module('jQuery.auth.emailSignIn', {
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
    '`emailSignIn` makes request to the API using default params',
    function(assert) {
      var firstToken  = 'xxx',
          validEmail  = 'test@test.com',
          validPwd    = 'secret123',
          validUid    = validEmail,
          firstName   = 'stimpy',
          clientId    = '123xyz',
          done        = assert.async(),
          userObj     = {
            email:      validEmail,
            uid:        validUid,
            first_name: firstName
          };

      // mock success response to sign in
      this.server.respondWith('POST', '/api/auth/sign_in', [
        200, {
          'access-token': firstToken,
          'uid':          validUid,
          'client':       clientId,
          'Content-Type': 'application/json'
        }, JSON.stringify({data: userObj})]);

      $.auth.emailSignIn({
        email: validEmail,
        password: validPwd
      })
        .then(function() {
          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.emailSignIn.success'),
            '`auth.emailSignIn.success` event was broadcast'
          );

          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.validation.success'),
            '`auth.validation.success` event was broadcast'
          );

          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.signIn.success'),
            '`auth.signIn.success` event was broadcast'
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
        firstToken,
        $.auth.retrieveData('authHeaders')['access-token'],
        "new token was saved for next request"
      );

      assert.deepEqual(
        $.extend(userObj, {
          configName: 'default',
          signedIn: true
        }),
        $.auth.user,
        "user attributes were loaded into $.auth.user"
      );
    }
  );


  QUnit.test(
    '`emailSignIn` rejects promise when bogus creds are used',
    function(assert) {
      var done         = assert.async(),
          server       = this.server;

      // mock failure response
      this.server.respondWith('POST', '/api/auth/sign_in', [401, {
        'Content-Type': 'application/json'
      }, JSON.stringify({message: 'bad creds'})]);


      $.auth.emailSignIn({
        email: 'test@test.com',
        password: 'secret123'
      })
        .fail(function() {
          assert.strictEqual(
            1,
            server.requests.length,
            "1 API request was made"
          );

          assert.strictEqual(
            undefined,
            $.auth.retrieveData('authHeaders'),
            'no creds were saved'
          );

          assert.strictEqual(
            undefined,
            $.auth.retrieveData('currentConfigName'),
            'currentConfigName was not set'
          );

          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.emailSignIn.error'),
            '`auth.emailSignIn.error` event was broadcast'
          );

          done();
        });

      this.server.respond();
    }
  );

}(jQuery));
