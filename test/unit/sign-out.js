(function ($) {
  var sinon = window.sinon;

  QUnit.module('jQuery.auth.signOut', {
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
    'user is de-authenticated upon successful sign-out',
    function(assert) {
      var currentToken = {'access-token': 'xxx'},
          done         = assert.async();

      $.auth.configure(null, true);
      $.auth.persistData('authHeaders', currentToken);

      // mock success response to sign in
      this.server.respondWith('DELETE', '/api/auth/sign_out', [
        200, {
          'Content-Type': 'application/json'
        }, JSON.stringify({success: true})]);


      $.auth.signOut()
        .then(function() {
          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.signOut.success'),
            '`auth.signOut.success` event was broadcast'
          );

          assert.strictEqual(
            undefined,
            $.auth.retrieveData('authHeaders'),
            'authHeaders cookie was removed upon successful signOut'
          );

          assert.strictEqual(
            undefined,
            $.auth.retrieveData('authHeaders'),
            'currentConfigName cookie was removed upon successful signOut'
          );

          assert.deepEqual(
            {},
            $.auth.user,
            'user data was removed upon signOut'
          );

          done();
        });

      this.server.respond();
    }
  );


  QUnit.test(
    'event is broadcast upon failed sign-out',
    function(assert) {
      var done = assert.async();

      // mock success response to sign in
      this.server.respondWith('DELETE', '/api/auth/sign_out', [
        500, {
          'Content-Type': 'application/json'
        }, JSON.stringify({success: false})]);

      $.auth.signOut()
        .fail(function() {
          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.signOut.error'),
            '`auth.signOut.error` event was broadcast'
          );

          assert.strictEqual(
            undefined,
            $.auth.retrieveData('authHeaders'),
            'authHeaders cookie was removed upon failed signOut'
          );

          assert.strictEqual(
            undefined,
            $.auth.retrieveData('authHeaders'),
            'currentConfigName cookie was removed upon failed signOut'
          );

          done();
        });

      this.server.respond();
    }
  );

}(jQuery));
