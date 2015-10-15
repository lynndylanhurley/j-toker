(function ($) {
  var sinon        = window.sinon,
      uid          = 'xyz123',
      token        = '321zyx',
      clientId     = 'zyx987',
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
    'email confirmation tokens are read from the URL after email confirmation redirect',

    function(assert) {
      var randomKey = '(.)(.)',
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

      $.auth.configure(null);

      assert.strictEqual(
        expectedLocation,
        mockLocation,
        'location was stripped of auth creds, non-related keys remain'
      );

      assert.ok(
        $.auth.validateToken.notCalled,
        '`validateToken` was not called. (should only be called after redirect)'
      );

      assert.ok(
        $.auth.retrieveData('firstTimeLogin'),
        'browser set "FIRST_TIME_LOGIN" token'
      );
    }
  );

}(jQuery));
