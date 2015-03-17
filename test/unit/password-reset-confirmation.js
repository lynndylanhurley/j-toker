(function ($) {
  var sinon      = window.sinon,
      uid        = 'xyz123',
      token      = '321zyx',
      newToken   = '432yxw',
      clientId   = 'zyx987',
      email      = 'test@test.com',
      expiry     = "" + new Date().getTime() * 1000 + 5000,
      mockSearch = null;

  var fakeGetSearch = function() {
    return mockSearch;
  };

  var fakeSetSearch = function(s) {
    mockSearch = s;
  };


  QUnit.module('jQuery.auth.requestPasswordReset Confirmation', {
    beforeEach: function() {
      this.server = sinon.fakeServer.create();
      sinon.spy($.auth,  'broadcastEvent');
      sinon.spy($.auth,  'validateToken');
      sinon.stub($.auth, 'getRawSearch', fakeGetSearch);
      sinon.stub($.auth, 'setRawSearch', fakeSetSearch);
    },

    afterEach: function() {
      this.server = sinon.fakeServer.restore();
      $.auth.broadcastEvent.restore();
      $.auth.validateToken.restore();
      $.auth.getRawSearch.restore();
      $.auth.setRawSearch.restore();
      $.auth.reset();
    }
  });


  QUnit.test(
    'password confirmation tokens are read from the URL and validated '+
    'against the API',
    function(assert) {
      var initialCreds = {
            'access-token': token,
            'token-type':   'Bearer',
            client:         clientId,
            uid:            uid,
            expiry:         expiry
          },
          updatedCreds = {
            'access-token': newToken,
            'token-type':   'Bearer',
            client:         clientId,
            uid:            uid,
            expiry:         expiry
          },
          randomKey = '(.)(.)';

      $.auth.setQs({
        token:     token,
        uid:       uid,
        client:    clientId,
        expiry:    expiry,
        randomKey: randomKey,
        reset_password: true
      });

      // mock success response
      this.server.respondWith('GET', '/api/auth/validate_token', [
        200, {
          'access-token': newToken,
          'token-type':   'Bearer',
          client:         clientId,
          uid:            uid,
          expiry:         expiry,
          'Content-Type': 'application/json'
        }, JSON.stringify({
          email: email,
          uid:   uid
        })]);

      $.auth.configure(null, true);

      assert.deepEqual(
        initialCreds,
        $.auth.retrieveData('authHeaders'),
        'creds were read from qs on init'
      );

      this.server.respond();

      assert.ok(
        $.auth.validateToken.calledOnce,
        '`validateToken` was only called once and only once'
      );

      assert.ok(
        $.auth.broadcastEvent.calledWith('auth.passwordResetConfirmSuccess'),
        '`auth.passwordResetConfirmSuccess` event was broadcast'
      );

      assert.deepEqual(
        updatedCreds,
        $.auth.retrieveData('authHeaders'),
        'creds were updated after on validateToken was called'
      );

      assert.deepEqual(
        {randomKey: randomKey},
        $.auth.getQs(),
        'location was stripped of auth creds, non-related keys remain'
      );
    }
  );


  QUnit.test(
    'password confirmaiton failure is handled',
    function(assert) {
      var qsCreds = {
            'access-token': token,
            'token-type':   'Bearer',
            client:         clientId,
            uid:            uid,
            expiry:         expiry
          },
          randomKey = '(x)(x)';

      $.auth.setQs({
        token:     token,
        uid:       uid,
        client:    clientId,
        expiry:    expiry,
        randomKey: randomKey,
        reset_password: true
      });

      // mock success response
      this.server.respondWith('GET', '/api/auth/validate_token', [
        401, {
          'Content-Type': 'application/json'
        }, JSON.stringify({
          message: 'Invalid credentials.'
        })]);

      $.auth.configure(null, true);

      assert.deepEqual(
        qsCreds,
        $.auth.retrieveData('authHeaders'),
        'creds were read from qs on init'
      );

      this.server.respond();

      assert.ok(
        $.auth.validateToken.calledOnce,
        '`validateToken` was only called once and only once'
      );

      assert.ok(
        $.auth.broadcastEvent.calledWith('auth.passwordResetConfirmError'),
        '`auth.passwordResetConfirmError` event was broadcast'
      );

      assert.strictEqual(
        undefined,
        $.auth.retrieveData('authHeaders'),
        'creds were destroyed after validateToken failed'
      );

      assert.deepEqual(
        {randomKey: randomKey},
        $.auth.getQs(),
        'location was stripped of auth creds, non-related keys remain'
      );
    }
  );

}(jQuery));

