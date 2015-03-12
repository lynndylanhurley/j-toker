// global mock vars
window.defaultConfig = {
  apiUrl:                  '/api',
  signOutUrl:              '/auth/sign_out',
  emailSignInPath:         '/auth/sign_in',
  emailRegistrationPath:   '/auth',
  accountUpdatePath:       '/auth',
  accountDeletePath:       '/auth',
  passwordResetPath:       '/auth/password',
  passwordUpdatePath:      '/auth/password',
  tokenValidationPath:     '/auth/validate_token',
  proxyIf:                 function() { return false; },
  proxyUrl:                '/proxy',
  validateOnPageLoad:      true,
  forceHardRedirect:       false,
  storage:                 'cookies',

  passwordResetSuccessUrl: function() {
    return window.location.href;
  },

  confirmationSuccessUrl:  function() {
    return window.location.href;
  },

  tokenFormat: {
    "access-token": "{{ token }}",
    "token-type":   "Bearer",
    client:         "{{ clientId }}",
    expiry:         "{{ expiry }}",
    uid:            "{{ uid }}"
  },

  parseExpiry: function(headers){
    // convert from ruby time (seconds) to js time (millis)
    return (parseInt(headers['expiry'], 10) * 1000) || null;
  },

  handleLoginResponse: function(resp) {
    return resp.data;
  },

  handleAccountUpdateResponse: function(resp) {
    return resp.data;
  },

  handleTokenValidationResponse: function(resp) {
    return resp.data;
  },

  authProviderPaths: {
    github:    '/auth/github',
    facebook:  '/auth/facebook',
    google:    '/auth/google_oauth2'
  }
};


//var validToken      = '123xyz';
//var validClient     = 'abc123';
//var validUid        = 123;
//var validExpiry     = (new Date().getTime() / 1000) + 500 | 0;
//var validAuthHeader = {
  //'access-token': validToken,
  //'token-type':   'Bearer',
  //client:         validClient,
  //expiry:         validExpiry,
  //uid:            validUid
//}

//var validEmail        = 'test@test.com';
//var existingUserEmail = 'testExisting@test.com';
//var invalidEmail      = 'gyahhh';

//var validUser = {
  //id:    666,
  //email: validEmail,
  //uid:   validUid
//}


// run after each test
//teardown ->
  //$.auth.deleteData('auth_headers')
  //$.auth.deleteData('currentConfigName')
  //$.auth.destroy()


// helper methods

//setValidAuthQS = function() {
  //$location.search('token',     validToken)
  //$location.search('client_id', validClient)
  //$location.search('uid',       validUid)
  //$location.search('expiry',    validExpiry)
//}

//setValidEmailConfirmQS = ->
  //setValidAuthQS()
  //$location.search('account_confirmation_success', true)

//setValidEmailConfirmQSForAdminUser = ->
  //setValidEmailConfirmQS()
  //$location.search('config', 'admin')


//setValidPasswordConfirmQS = ->
  //setValidAuthQS()
  //$location.search('reset_password', true)


//setValidPasswordConfirmQSForAdminUser = ->
  //setValidPasswordConfirmQS()
  //$location.search('config', 'admin')
