(function ($) {
  var sinon    = window.sinon,
      email       = 'test@test.com',
      uid         = '123',
      firstName   = 'dhalgren',
      clientId    = 'zyx',
      firstToken  = 'xxx',
      secondToken = 'yyy',
      firstUserObj = {
        email: email,
        uid:   uid,
        name:  firstName
      };

  QUnit.module('jQuery.auth.updatePassword', {
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
    'successful request updates user object',
    function(assert) {
      var done        = assert.async();

      $.auth.persistData('authHeaders', {
        'access-token': firstToken,
        'uid':          uid,
        'client':       clientId,
        'Content-Type': 'application/json'
      });

      $.extend($.auth.user, firstUserObj);

      // mock success response to sign in
      this.server.respondWith('PUT', '/api/auth/password', [
        200, {
          'access-token': secondToken,
          'uid':          uid,
          'client':       clientId,
          'Content-Type': 'application/json'
        }, JSON.stringify({success: true})]);

      $.auth.updatePassword({
        password: 'secret123',
        password_confirmation: 'secret123'
      })
        .then(function() {
          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.passwordUpdate.success'),
            '`auth.passwordUpdate.success` event was called'
          );

          assert.strictEqual(
            secondToken,
            $.auth.retrieveData('authHeaders')['access-token'],
            'auth token has been updated to latest'
          );

          done();
        });

      this.server.respond();
    }
  );

  QUnit.test(
    'event is broadcast upon `updateAccunt` failure',
    function(assert) {
      var done = assert.async();

      $.extend($.auth.user, firstUserObj);

      // mock success response to sign in
      this.server.respondWith('PUT', '/api/auth/password', [
        500, {
          'Content-Type': 'application/json'
        }, JSON.stringify({success: false})]);

        $.auth.updatePassword({
          password: 'secret123',
          password_confirmation: 'secret321'
        })
          .fail(function() {
            assert.ok(
              $.auth.broadcastEvent.calledWith('auth.passwordUpdate.error'),
              '`auth.passwordUpdate.error` event was called'
            );

            done();
          });

      this.server.respond();
    }
  );

}(jQuery));
