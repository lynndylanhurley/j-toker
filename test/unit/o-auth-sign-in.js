(function ($) {
  var sinon        = window.sinon,
      mockSearch   = null,
      mockLocation = null,
      popupUrl     = null,
      id           = 1,
      uid          = 12345,
      email        = 'test@test.com',
      authToken    = 'xyz123',
      clientId     = 'zyx321',
      expiry       = "" + new Date().getTime() * 1000 + 5000,
      expectedUser = {
        id:           id,
        uid:          uid,
        email:        email,
        'auth-token': authToken,
        expiry:       expiry,
        client:       clientId,
        signedIn:     true,
        configName:   "default"
      };

  var fakePopup = function(url) {
    popupUrl = url;

    return {
      closed:      false,
      postMessage: function() {}
    };
  };

  var fakeSetLocation = function(url) {
    mockLocation = url;
  };

  var fakeSuccessPostMessage = function() {
    window.postMessage($.extend({
      message: 'deliverCredentials'
    }, expectedUser), '*');
  };

  var fakeFailurePostMessage = function() {
    window.postMessage({message: 'authFailure'}, '*');
  };

  QUnit.module('jQuery.auth.oAuthSignIn', {
    beforeEach: function() {
      this.server = sinon.fakeServer.create();
      $.auth.configure(null, true);
      sinon.spy($.auth, 'broadcastEvent');
      sinon.spy($.auth, 'handlePostMessage');
      sinon.spy($.auth, 'setCurrentUser');
      sinon.stub($.auth, 'createPopup', fakePopup);
      sinon.stub($.auth, 'setLocation', fakeSetLocation);
    },

    afterEach: function() {
      this.server = sinon.fakeServer.restore();
      $.auth.broadcastEvent.restore();
      $.auth.handlePostMessage.restore();
      $.auth.setCurrentUser.restore();
      $.auth.createPopup.restore();
      $.auth.setLocation.restore();
      mockLocation = null;
      mockSearch   = null;
      popupUrl     = null;
      $.auth.reset();
    }
  });


  QUnit.test(
    '`oAuthSignIn` opens external popup, waits for postMessage response',
    function(assert) {
      $.auth.configure(null, true);

      var done        = assert.async(),
          config      = $.auth.getConfig(),
          expectedUrl = config.apiUrl +
                        config.authProviderPaths['github'] +
                        '?auth_origin_url='+encodeURIComponent(window.location.href) +
                        '&config_name=default';

      $.auth
        .oAuthSignIn({provider: 'github'})
        .then(function() {
          assert.ok(
            $.auth.handlePostMessage.called,
            '`postMessage` event was caught'
          );

          assert.ok(
            $.auth.setCurrentUser.called,
            '`setCurrentUser` was called'
          );

          assert.deepEqual(
            expectedUser,
            $.auth.user,
            '$.auth.user contains user attrs'
          );

          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.oAuthSignIn.success'),
            '`auth.oAuthSignIn.success` event was called'
          );

          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.signIn.success'),
            '`auth.signIn.success` event was called'
          );

          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.validation.success'),
            '`auth.validation.success` event was called'
          );

          done();
        });

      assert.ok(
        $.auth.createPopup.calledOnce,
        'external auth window was opened'
      );

      assert.strictEqual(
        expectedUrl,
        popupUrl,
        'external auth window leads to correct omniauth url'
      );

      fakeSuccessPostMessage();
    }
  );


  QUnit.test(
    '`oAuthSignIn` can use hard redirect if necessary',
    function(assert) {
      $.auth.configure({forceHardRedirect: true}, true);

      var config = $.auth.getConfig(),
          expectedUrl = config.apiUrl +
                        config.authProviderPaths['github'] +
                        '?auth_origin_url='+encodeURIComponent(window.location.href) +
                        '&config_name=default';

      $.auth.oAuthSignIn({provider: 'github'});

      assert.ok(
        $.auth.setLocation.calledOnce,
        'user was redirected to OAuth provider'
      );

      assert.strictEqual(
        expectedUrl,
        mockLocation,
        'current window is redirected to correct omniauth url'
      );
    }
  );


  QUnit.test(
    'event is broadcast when `oAuthSignIn` fails',
    function(assert) {
      $.auth.configure(null, true);
      var done = assert.async();

      $.auth
        .oAuthSignIn({provider: 'github'})
        .fail(function() {
          assert.ok(
            $.auth.handlePostMessage.called,
            '`postMessage` event was caught'
          );

          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.oAuthSignIn.error'),
            '`auth.oAuthSignIn.error` event was called'
          );

          assert.ok(
            $.auth.broadcastEvent.calledWith('auth.signIn.error'),
            '`auth.signIn.error` event was called'
          );

          done();
        });

      fakeFailurePostMessage();
    }
  );

}(jQuery));
