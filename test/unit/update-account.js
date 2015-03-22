(function ($) {
  var sinon = window.sinon,
      email       = 'test@test.com',
      uid         = '123',
      firstName   = 'Trurl',
      secondName  = 'Klapaucius',
      firstToken  = 'xxx',
      secondToken = 'yyy',
      clientId    = 'zyx',
      firstUserObj = {
        email: email,
        uid:   uid,
        name:  firstName
      },
      secondUserObj = {
        email: email,
        uid:   uid,
        name:  secondName
      };

  QUnit.module('jQuery.auth.updateAccount', {
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
      this.server.respondWith('PUT', '/api/auth', [
        200, {
          'access-token': secondToken,
          'uid':          uid,
          'client':       clientId,
          'Content-Type': 'application/json'
        }, JSON.stringify({data: secondUserObj})]);


      $.auth.updateAccount(secondUserObj)
        .then(function() {
          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.accountUpdate.success'),
            '`auth.accountUpdate.success` event was called'
          );

          assert.strictEqual(
            secondToken,
            $.auth.retrieveData('authHeaders')['access-token'],
            'auth token has been updated to latest'
          );

          assert.deepEqual(
            $.extend(secondUserObj, {
              signedIn: true,
              configName: 'default'
            }),
            $.auth.user,
            'user object was updated'
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
      this.server.respondWith('PUT', '/api/auth', [
        500, {
          'Content-Type': 'application/json'
        }, JSON.stringify({success: false})]);

        $.auth.updateAccount({
          test: 'bang'
        })
          .fail(function() {
            assert.ok(
              $.auth.broadcastEvent.calledWith('auth.accountUpdate.error'),
              '`auth.accountUpdate.error` event was called'
            );

            assert.deepEqual(
              firstUserObj,
              $.auth.user,
              'user object was not modified'
            );

            done();
          });

      this.server.respond();
    }
  );

}(jQuery));

