(function($) {
  var sinon = window.sinon,
      email        = 'test@test.com',
      uid          = '123',
      name         = 'Rudolph Wurlitzer',
      token        = 'xxx',
      clientId     = 'zyx',
      userObj = {
        email: email,
        uid:   uid,
        name:  name
      };

  QUnit.module('jQuery.auth.destroyAccount', {
    beforeEach: function() {
      this.server = sinon.fakeServer.create();
      $.auth.configure(null, true);
      sinon.spy($.auth, 'broadcastEvent');

      $.auth.persistData('authHeaders', {
        token:  token,
        client: clientId,
        uid:    uid
      });

      $.extend($.auth.user, userObj);
    },

    afterEach: function() {
      this.server = sinon.fakeServer.restore();
      $.auth.broadcastEvent.restore();
      $.auth.reset();
    }
  });

  QUnit.test(
    'account is destroyed upon successful request',
    function(assert) {
      var done = assert.async();

      this.server.respondWith('DELETE', '/api/auth', [
        200, {
          'Content-Type': 'application/json'
        }, JSON.stringify({success: true})]);


      $.auth.destroyAccount()
        .then(function() {
          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.destroyAccount.success'),
            '`auth.destroyAccount.success` event was called'
          );

          assert.strictEqual(
            undefined,
            $.auth.retrieveData('authHeaders'),
            'auth data was destroyed'
          );

          assert.strictEqual(
            undefined,
            $.auth.retrieveData('currentConfigName'),
            'config info was destroyed'
          );

          assert.deepEqual(
            {},
            $.auth.user,
            'user info was destroyed'
          );

          done();

        });

      this.server.respond();
    }
  );

  QUnit.test(
    'event is broadcast upon `destroyAccount` failure',
    function(assert) {
      var done = assert.async();

      this.server.respondWith('DELETE', '/api/auth', [
        500, {
          'Content-Type': 'application/json'
        }, JSON.stringify({success: false})]);

      $.auth.destroyAccount()
        .fail(function() {
          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.destroyAccount.error'),
            '`auth.destroyAccount.error` event was called'
          );

          assert.deepEqual(
            userObj,
            $.auth.user,
            'user object remains'
          );

          assert.deepEqual(
            {
              token:  token,
              client: clientId,
              uid:    uid
            },
            $.auth.retrieveData('authHeaders'),
            'saved headers remain'
          );

          done();
        });

      this.server.respond();
    }
  );

}(jQuery));
