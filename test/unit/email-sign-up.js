(function ($) {
  var sinon           = window.sinon,
      validEmail      = 'test@test.com',
      password        = 'secret123',
      passwordConfirm = password;

  QUnit.module('jQuery.auth.emailSignUp', {
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
    '`emailSignUp` makes API request, broadcasts event upon success',
    function(assert) {
      var done   = assert.async(),
          server = this.server;

      // mock success response
      server.respondWith('POST', '/api/auth', [
        200, {
          'Content-Type': 'application/json'
        }, JSON.stringify({
          success: true
        })]);

      $.auth.emailSignUp({
        email:                 validEmail,
        password:              password,
        password_confirmation: passwordConfirm
      })
        .then(function() {
          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.emailRegistration.success'),
            '`auth.emailRegistration.success` event was broadcast'
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

      //TODO: test that confirm success url was sent

      server.respond();
    }
  );


  QUnit.test(
    '`emailSignUp` broadcasts event upon failure',
    function(assert) {
      var done   = assert.async(),
          server = this.server;

      // mock success response
      server.respondWith('POST', '/api/auth', [
        403, {
          'Content-Type': 'application/json'
        }, JSON.stringify({
          success: false
        })]);

      $.auth.emailSignUp({
        email:                 validEmail,
        password:              password,
        password_confirmation: passwordConfirm
      })
        .then(function() {
          throw "Email sign in succeeded during failure test";
        })
        .fail(function() {
          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.emailRegistration.error'),
            '`auth.emailRegistration.error` event was broadcast'
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
