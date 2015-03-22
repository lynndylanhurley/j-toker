(function ($) {
  var sinon        = window.sinon,
      uid          = 'xyz123',
      token        = '321zyx',
      newToken     = '432yxw',
      clientId     = 'zyx987',
      email        = 'test@test.com',
      expiry       = "" + new Date().getTime() * 1000 + 5000,
      mockSearch   = null,
      mockLocation = null;

  var fakeGetSearch = function() {
    return mockSearch;
  };

  var fakeSetSearch = function(s) {
    mockSearch = s;
  };

  var fakeSetLocation = function(l) {
    mockLocation = l;
  };


  QUnit.module('jQuery.auth.emailSignUp Confirmation', {
    beforeEach: function() {
      this.server = sinon.fakeServer.create();
      sinon.spy($.auth,  'broadcastEvent');
      sinon.spy($.auth,  'validateToken');
      sinon.stub($.auth, 'getRawSearch', fakeGetSearch);
      sinon.stub($.auth, 'setRawSearch', fakeSetSearch);
      sinon.stub($.auth, 'setLocation', fakeSetLocation);
    },

    afterEach: function() {
      this.server = sinon.fakeServer.restore();
      $.auth.broadcastEvent.restore();
      $.auth.validateToken.restore();
      $.auth.getRawSearch.restore();
      $.auth.setRawSearch.restore();
      $.auth.setLocation.restore();
      $.auth.reset();
    }
  });


  QUnit.test(
    'email confirmation tokens are read from the URL and validated '+
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
          randomKey = '(.)(.)',
          expectedLocation = window.location.protocol +
                             '//' +
                             window.location.host +
                             window.location.pathname +
                            '?randomKey='+encodeURIComponent(randomKey);

      $.auth.setSearchQs({
        'access-token': token,
        uid:            uid,
        client:         clientId,
        expiry:         expiry,
        randomKey:      randomKey,
        account_confirmation_success: true
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

      assert.strictEqual(
        'auth.emailConfirmation.success',
        $.auth.broadcastEvent.getCall(0).args[0],
        '`auth.emailConfirmation.success` event was broadcast'
      );

      assert.deepEqual(
        updatedCreds,
        $.auth.retrieveData('authHeaders'),
        'creds were updated after on validateToken was called'
      );

      assert.strictEqual(
        expectedLocation,
        mockLocation,
        'location was stripped of auth creds, non-related keys remain'
      );
    }
  );


  QUnit.test(
    'email confirmaiton failure is handled',
    function(assert) {
      var qsCreds = {
            'access-token': token,
            'token-type':   'Bearer',
            client:         clientId,
            uid:            uid,
            expiry:         expiry
          },
          randomKey = '(x)(x)',
          expectedLocation = window.location.protocol +
                             '//' +
                             window.location.host +
                             window.location.pathname +
                            '?randomKey='+encodeURIComponent(randomKey);

      $.auth.setSearchQs({
        token:     token,
        uid:       uid,
        client:    clientId,
        expiry:    expiry,
        randomKey: randomKey,
        account_confirmation_success: true
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

      assert.strictEqual(
        'auth.emailConfirmation.error',
        $.auth.broadcastEvent.getCall(0).args[0],
        '`auth.emailConfirmation.error` event was broadcast'
      );

      assert.strictEqual(
        undefined,
        $.auth.retrieveData('authHeaders'),
        'creds were destroyed after validateToken failed'
      );

      assert.deepEqual(
        expectedLocation,
        mockLocation,
        'location was stripped of auth creds, non-related keys remain'
      );
    }
  );

}(jQuery));
