/*
 * This minor implementation detail is so complicated that it requires
 * its own test suite.
 *
 * TODO: document high-level expectations of this suite
 */

(function ($) {
  var sinon        = window.sinon,
      mockSearch   = null,
      mockLocation = null,
      mockAnchor   = null,
      uid          = 'jtoker@test.com',
      authToken    = 'LQOpwCQ-dZ-RWrW6YohV6w',
      clientId     = 'iJ625vodngjzRp68E5FxDA',
      randomKey    = 'spaghett',
      expiry       = "" + new Date().getTime() * 1000 + 5000;

  var fakeSetLocation = function(url) {
    mockLocation = url;
  };

  var fakeGetSearch = function() {
    return mockSearch || '';
  };

  var fakeGetAnchor = function() {
    return mockAnchor || '';
  };

  var fakeSetSearch = function(s) {
    mockSearch = '?' + s;
  };

  var fakeSetAnchor = function(a) {
    mockAnchor = '#' + a;
  };


  QUnit.module('jQuery.auth querystring manipulation', {
    beforeEach: function() {
      this.server = sinon.fakeServer.create();
      sinon.stub($.auth, 'setLocation', fakeSetLocation);
      sinon.stub($.auth, 'getRawSearch', fakeGetSearch);
      sinon.stub($.auth, 'setRawSearch', fakeSetSearch);
      sinon.stub($.auth, 'getRawAnchor', fakeGetAnchor);
      sinon.stub($.auth, 'setRawAnchor', fakeSetAnchor);
      $.auth.configure(null, true);
    },

    afterEach: function() {
      this.server = sinon.fakeServer.restore();
      $.auth.setLocation.restore();
      $.auth.getRawSearch.restore();
      $.auth.getRawAnchor.restore();
      $.auth.setRawSearch.restore();
      $.auth.setRawAnchor.restore();
      mockLocation = null;
      mockSearch   = null;
      mockAnchor   = null;
      $.auth.reset();
    }
  });


  QUnit.test(
    'getQs handles querystring-only values',
    function(assert) {
      mockSearch = "?account_confirmation_success=true"+
                   "&client_id="+encodeURIComponent(clientId)+
                   "&config=default"+
                   "&expiry="+encodeURIComponent(expiry)+
                   "&token="+encodeURIComponent(authToken)+
                   "&random_key="+encodeURIComponent(randomKey)+
                   "&uid="+encodeURIComponent(uid);

      var headers        = $.auth.processSearchParams(),
          expectedLocation = window.location.protocol +
                             '//' +
                             window.location.host +
                             window.location.pathname +
                            '?random_key='+encodeURIComponent(randomKey);

      assert.strictEqual(
        authToken,
        headers['access-token'],
        'access-token was found in qs'
      );

      assert.strictEqual(
        clientId,
        headers['client'],
        'client was found in qs'
      );

      assert.strictEqual(
        expiry,
        headers['expiry'],
        'expiry was found in qs'
      );

      assert.strictEqual(
        uid,
        headers['uid'],
        'uid was found in qs'
      );

      assert.strictEqual(
        expectedLocation,
        mockLocation,
        'location was stripped of auth creds'
      );
    }
  );

  QUnit.test(
    'getQs handles anchor-querystring-only values',
    function(assert) {
      mockAnchor = "#/some-url"+
                   "?account_confirmation_success=true"+
                   "&client_id="+encodeURIComponent(clientId)+
                   "&config=default"+
                   "&expiry="+encodeURIComponent(expiry)+
                   "&token="+encodeURIComponent(authToken)+
                   "&random_key="+encodeURIComponent(randomKey)+
                   "&uid="+encodeURIComponent(uid);

      var headers        = $.auth.processSearchParams(),
          expectedLocation = window.location.protocol +
                             '//' +
                             window.location.host +
                             window.location.pathname +
                            '#/?random_key='+encodeURIComponent(randomKey);

      assert.strictEqual(
        authToken,
        headers['access-token'],
        'access-token was found in qs'
      );

      assert.strictEqual(
        clientId,
        headers['client'],
        'client was found in qs'
      );

      assert.strictEqual(
        expiry,
        headers['expiry'],
        'expiry was found in qs'
      );

      assert.strictEqual(
        uid,
        headers['uid'],
        'uid was found in qs'
      );

      assert.strictEqual(
        expectedLocation,
        mockLocation,
        'location was stripped of auth creds'
      );
    }
  );


  QUnit.test(
    'getQs handles querystring + anchor-querystring mix',
    function(assert) {
      var randomSearchKey = 'slothrop';

      mockSearch = "?config=default"+
                   "&expiry="+encodeURIComponent(expiry)+
                   "&random_search_key="+encodeURIComponent(randomSearchKey)+
                   "&token="+encodeURIComponent(authToken);

      mockAnchor = "#/some-anchor"+
                   "?account_confirmation_success=true"+
                   "&client_id="+encodeURIComponent(clientId)+
                   "&random_anchor_search_key="+encodeURIComponent(randomKey)+
                   "&uid="+encodeURIComponent(uid);

      var headers          = $.auth.processSearchParams(),
          expectedLocation = window.location.protocol +
                             '//' +
                             window.location.host +
                             window.location.pathname +
                             '?random_search_key='+encodeURIComponent(randomSearchKey)+
                             '#/?random_anchor_search_key='+encodeURIComponent(randomKey);

      assert.strictEqual(
        authToken,
        headers['access-token'],
        'access-token was found in qs'
      );

      assert.strictEqual(
        clientId,
        headers['client'],
        'client was found in qs'
      );

      assert.strictEqual(
        expiry,
        headers['expiry'],
        'expiry was found in qs'
      );

      assert.strictEqual(
        uid,
        headers['uid'],
        'uid was found in qs'
      );

      assert.strictEqual(
        expectedLocation,
        mockLocation,
        'location was stripped of auth creds'
      );
    }
  );

}(jQuery));
