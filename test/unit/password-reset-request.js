(function ($) {
  var sinon           = window.sinon,
      validEmail      = 'test@test.com';

  QUnit.module('jQuery.auth.passwordResetRequest', {
    beforeEach: function() {
      this.server = sinon.fakeServer.create();
      sinon.spy($.auth, 'broadcastEvent');
      $.auth.configure(null, true);
    },

    afterEach: function() {
      this.server = sinon.fakeServer.restore();
      $.auth.broadcastEvent.restore();
      $.auth.reset();
    }
  });


  QUnit.test(
    '`passwordResetRequest` makes API request, broadcasts event upon success',
    function(assert) {
      var done   = assert.async(),
          server = this.server;

      // mock success response
      server.respondWith('POST', '/api/auth/password', [
        200, {
          'Content-Type': 'application/json'
        }, JSON.stringify({
          success: true
        })]);

      $.auth.requestPasswordReset({email: validEmail})
        .then(function() {
          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.passwordResetRequest.success'),
            '`auth.passwordResetRequest.success` event was broadcast'
          );

          assert.strictEqual(
            1,
            server.requests.length,
            "only one request was made"
          );

          done();
        })
        .fail(function() {
          throw "email sign up request failed.";
        });


      server.respond();
    }
  );


  QUnit.test(
    '`passwordResetRequest` broadcasts event upon failure',
    function(assert) {
      var done   = assert.async(),
          server = this.server;

      // mock success response
      server.respondWith('POST', '/api/auth/password', [
        403, {
          'Content-Type': 'application/json'
        }, JSON.stringify({
          success: false
        })]);

      $.auth.requestPasswordReset({
        email: validEmail,
      })
        .then(function() {
          throw "Email sign in succeeded during failure test";
        })
        .fail(function() {
          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.passwordResetRequest.error'),
            '`auth.passwordResetRequest.error` event was broadcast'
          );

          assert.strictEqual(
            1,
            server.requests.length,
            "only one request was made"
          );

          done();
        });

      server.respond();
    }
  );

}(jQuery));

