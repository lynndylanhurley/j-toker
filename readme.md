# jToker

### Simple, secure user authentication for jQuery

![j-toker][logo]

[![npm version](https://badge.fury.io/js/j-toker.svg)](http://badge.fury.io/js/j-toker)
[![bower version](https://badge.fury.io/bo/j-toker.svg)](http://badge.fury.io/bo/j-toker)
[![Build Status](https://magnum.travis-ci.com/lynndylanhurley/j-toker.svg?token=3E1Wh8RpQzLxg3zZajyy)](https://magnum.travis-ci.com/lynndylanhurley/j-toker)
[![Test Coverage](https://codeclimate.com/repos/551098d4695680699c005e31/badges/efa4ca64d67204ad1660/coverage.svg)](https://codeclimate.com/repos/551098d4695680699c005e31/feed)

### Features:

* OAuth2 authentication
* Email authentication, including:
  * User registration
  * Password resets
  * Account updates
  * Account deletion
* Seamless integration with the [devise token auth][dta] Rails gem.
* Extensive event notifications
* Allows for total configuration to work with any API
* Session support using cookies or localStorage
* Tested with Chrome, Safari, Firefox and IE8+

---

# [Live Demo][j-toker-demo]

This project comes bundled with a test app. You can run the demo locally by following these instructions, or you can use it [here][j-toker-demo] in production.

The demo uses [React][react], and the source can be found [here](https://github.com/lynndylanhurley/j-toker/tree/master/demo/src).

---

# Table of Contents

* [About this plugin](#about-this-plugin)
* [Installation](#installation)
* [Configuration](#configuration)
* [API](#api)
  * [$.auth.user](#authuser)
  * [$.auth.oAuthSignIn](#authoauthsignin)
  * [$.auth.emailSignUp](#authemailsignup)
  * [$.auth.emailSignIn](#authemailsignin)
  * [$.auth.validateToken](#authvalidatetoken)
  * [$.auth.updateAccount](#authupdateaccount)
  * [$.auth.requestPasswordReset](#authrequestpasswordreset)
  * [$.auth.updatePassword](#authupdatepassword)
  * [$.auth.signOut](#authsignout)
  * [$.auth.destroyAccount](#authdestroyaccount)
* [Events](#events)
* [Possible complications](#possible-complications)
* [Using alternate response formats](#alternate-response-formats)
* [Using multiple user types](#multiple-user-types)
* [Conceptual diagrams](#conceptual)
  * [OAuth2 Authentication](#oauth2-signin)
  * [Token Validation](#token-validation)
  * [Email Registration](#email-registration)
  * [Email Sign In](#email-sign-in)
  * [Password Reset Requests](#password-reset)
* [Notes on Token Management](#token-management)
* [Notes on Batch Requests](#batch-requests)
* [Token Formatting](#identifying-users-on-the-server)
* [Internet Explorer Caveats](#internet-explorer)
* [Contributing](#contributing)
* [Development](#development)
* [Callouts](#credits)

---

# About this plugin

This plugin relies on [token based authentication][token-auth-wiki]. This requires coordination between the client and the server. [Diagrams](#conceptual) are included to illustrate this relationship.

This plugin was designed to work out of the box with the legendary [devise token auth][dta] gem, but it's flexible enough to be used in just about any environment.

Oh wait you're using [AngularJS][angular]? Use [ng-token-auth][ng-token-auth] instead.

**About security**: [read here][so-post] for more information on securing your token auth system. The [devise token auth][dta] gem has adequate security measures in place, and this plugin was built to work seamlessly with that gem.

---

# Installation

1. Download this plugin and its dependencies.

   ~~~sh
   # using bower:
   bower install j-toker --save

   # using npm:
   npm install j-toker --save
   ~~~
2. Ensure that the following dependencies are included:
   * [jquery][jquery]: AJAX requests
   * [jquery-cookie][jquery-cookie]: Persist data through browser sessions
   * [jquery-deparam][jquery-deparam]: Querystring param deconstruction.
   * [PubSubJS][pubsub-js]: (optional) Event publish / subscribe.

   These dependencies were pulled down automatically if you used [bower] or [npm] to install jToker.
3. Include jToker in your project.
   * If you're using [browserify][browserify] or similar, this will look like this:

     ~~~javascript
     // this will resolve the dependencies automatically
     var Auth = require('j-toker');
     ~~~

   * Otherwise you will need to include jToker and its dependencies manually:

     ~~~html
     <!-- in your index.html file -->

     <!-- dependencies - these should come BEFORE jToker -->
     <script src='/js/jquery/dist/jquery.js'></script>
     <script src='/js/jquery.cookie/jquery.cookie.js'></script>
     <script src='/js/jquery-deparam/jquery-deparam.js'></script>
     <script src='/js/pubsub-js/src/pubsub.js'></script>

     <!-- this should come AFTER the preceeding files -->
     <script src='/js/jquery.j-toker.js'></script>

     <!-- jToker will now be available at $.auth -->
     ~~~


**Note**: For the rest of this README, I will assume jToker is available at `$.auth`, where `$` stands for `jQuery`. But when using `require`, jToker will be available as whatever you name the required module (`Auth` in the example above).

---

# Configuration

`$.auth.configure` will need to be called before this plugin can be used.

When this plugin is used with [devise token auth][dta], you may only need to set the `apiUrl` config option.

##### Simple configuration example:

~~~javascript
$.auth.configure({
  apiUrl: 'https://my-api.com/api/v1'
});
~~~

That's it! 99% of you are done.

##### Complete configuration example

~~~javascript

// the following configuration shows all of the available options
// and their default settings

$.auth.configure({
  apiUrl:                '/api',
  signOutPath:           '/auth/sign_out',
  emailSignInPath:       '/auth/sign_in',
  emailRegistrationPath: '/auth',
  accountUpdatePath:     '/auth',
  accountDeletePath:     '/auth',
  passwordResetPath:     '/auth/password',
  passwordUpdatePath:    '/auth/password',
  tokenValidationPath:   '/auth/validate_token',
  proxyIf:               function() { return false; },
  proxyUrl:              '/proxy',
  validateOnPageLoad:    false,
  forceHardRedirect:     false,
  storage:               'cookies',
  cookieExpiry:          14,
  cookiePath:            '/',

  passwordResetSuccessUrl: function() {
    return window.location.href;
  },

  confirmationSuccessUrl:  function() {
    return window.location.href;
  },

  tokenFormat: {
    "access-token": "{{ access-token }}",
    "token-type":   "Bearer",
    client:         "{{ client }}",
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
});
~~~

**Note**: if you're using multiple user types, [jump here](#using-multiple-user-types) for more details.

## Config options

### apiUrl
###### string
The base route to your api. Each of the following paths will be relative to this URL. Authentication headers will only be added to requests with this value as the base URL.

--

### tokenValidationPath
###### string
Path (relative to `apiUrl`) to validate authentication tokens. [Read more](#token-validation-flow).

--

### signOutUrl
###### string
Path (relative to `apiUrl`) to de-authenticate the current user. This will destroy the user's token both server-side and client-side.

--

### authProviderPaths
###### object
An object containing paths to auth endpoints. Keys should be the names of the providers, and the values should be the auth paths relative to the `apiUrl`. [Read more](#oauth-2-authentication-flow).

--

### emailRegistrationPath
###### string
Path (relative to `apiUrl`) for submitting new email registrations. [Read more](#email-registration-flow).

--

### accountUpdatePath
###### string
Path (relative to `apiUrl`) for submitting account update requests.

--

### accountDeletePath
###### string
Path (relative to `apiUrl`) for submitting account deletion requests.

--

### confirmationSuccessUrl
###### string or function
The absolute url to which the API should redirect after users visit the link contained in email-registration confirmation emails.

--

### emailSignInPath
###### string
Path (relative to `apiUrl`) for signing in to an existing email account.

--

### passwordResetPath
###### string
Path (relative to `apiUrl`) for requesting password reset emails.

--

### passwordResetSuccessUrl
###### string or function
The absolute url to which the API should redirect after users visit the link contained in password-reset confirmation emails.

--

### passwordUpdatePath
###### string
Path (relative to `apiUrl`) for submitting new passwords for authenticated users.

--

### storage
###### string
The method used to persist tokens between sessions. Allowed values are `cookies` and `localStorage`.

--

### proxyIf
###### function
Older browsers have troubel with [CORS][cors]. Pass a method to this option that will determine whether or not a proxy should be used.

--

### proxyUrl
###### string
If the `proxyIf` method returns `true`, this is the URL that will be used in place of `apiUrl`.

--

### tokenFormat
###### object
A template for authentication tokens. The template will be provided a context with the following keys:

* access-token
* client
* uid
* expiry

The above strings will be replaced with their corresponding values as found in the response headers.

--

### parseExpiry
###### function
A function that will return the token's expiry from the current headers. `null` is returned if no expiry is found.

--

### handleLoginResponse
###### function
A function used to identify and return the current user's account info (`id`, `username`, etc.) from the response of a successful login request.

--

### handleAccountUpdateResponse
###### function
A function used to identify and return the current user's info (`id`, `username`, etc.) from the response of a successful account update request.

--

### handleTokenValidationResponse
###### function
A function used to identify and return the current user's info (`id`, `username`, etc.) from the response of a successful token validation request.

---

# Usage

jToker can be used as a [jQuery][jquery] plugin, or as a [CommonJS][common-js] module.

##### jQuery plugin usage:

~~~javascript
$.auth.configure({apiUrl: '/api'});
~~~

##### CommonJS usage:

~~~javascript
var Auth = require('j-toker');

Auth.configure({apiUrl: '/api'});
~~~

The two use-cases are equivalent, but the `$.auth` format will be used in the following examples for simplicity.

--

## API

All of the following methods are asynchronous. Each method returns a [jQuery.Deferred() promise][dfd] that will be resolved upon success, or rejected upon failure.

##### Deferred usage example:

~~~javascript
$.auth
  .oAuthSignIn({provider: 'github'})
  .then(function(user) {
    alert('Welcome ' + user.name + '!');
  })
  .fail(function(resp) {
    alert('Authentication failure: ' + resp.errors.join(' '));
  });
~~~

--

### $.auth.user
An object representing the current user. In addition to the attributes of your user model, the following additional attributes are available:

* **`signedIn`**: (boolean) will be true if there is a current user.
* **`configName`**: (string) the name of the configuration used to authenticate the current user. When using a single API configuration (most cases), this will be `default`.

--

### $.auth.oAuthSignIn
Initiate an OAuth2 authentication.

##### arguments:

* **`provider`**: the name of the target provider service as represented in the `authProviderPaths` config hash.

   ~~~javascript
   $.auth.authenticate({provider: 'github'});
   ~~~
* **`params`**: an object containing additional fields user attributes and values.

  ~~~javascript
  $.auth.authenticate({
    provider: 'github',
    params: {
      favorite_color: 'flesh'
    }
  });
  ~~~

* **`config`**: the name of the configuration to be used when multiple auth configurations are available.

   ~~~javascript
  $.auth.authenticate({
    provider: 'github',
    config: 'altUser',
    params: {
      favorite_color: 'amaranth'
    }
  });
  ~~~

--

### $.auth.emailSignUp
Create an account using email for confirmation.

##### arguments:

* **`email`**
* **`password`**
* **`password_confirmation`**

  ~~~javascript
  $.auth.emailSignUp({
    email: 'test@test.com',
    password: '*****',
    password_confirmation: '*****'
  });
  ~~~

* **`config`**: the name of the configuration to be used when multiple configurations are available.

  ~~~javascript
  $.auth.emailSignUp({
    email: 'test@test.com',
    password: '*****',
    password_confirmation: '*****',
    config: 'altUser'
  });
  ~~~

* You can also pass any arbitrary attrubute / values to be assigned to the user at account creation:

  ~~~javascript
  $.auth.emailSignUp({
    email: 'test@test.com',
    password: '*****',
    password_confirmation: '*****',
    favorite_color: 'black'
  });
  ~~~

--

### $.auth.emailSignIn
Authenticate a user that registered via email.

##### arguments:
* **`email`**
* **`password`**

  ~~~javascript
  $.auth.emailSignIn({
    email: 'test@test.com',
    password: '*****'
  });
  ~~~
* **`config`**: name of the config to be used when multiple configurations are available.

  ~~~javascript
  $.auth.emailSignIn({
    email: 'test@test.com',
    password: '*****',
    config: 'altUser'
  });
  ~~~

--

### $.auth.validateToken
Use this method to verify that the current user's access-token exists and is valid.

This method is called automatically after `configure` to check if returning users' sessions are still valid.

The promise returned by this method can be used to redirect users to the login screen when they try to visit restricted areas.

##### Redirection example with react and react-router

~~~javascript
// this assumes that there is an available route named 'login'

var React = require('react'),
    Router = require('react-router'),
    Transition = Router.Transition,
    Auth = require('j-toker');

var PageComponent = React.createClass({
  getInitialState: function() {
    return {
      username: ''
    };
  },

  componentDidMount: function() {
    Auth.validateToken()
      .then(function(user) {
        this.setState({
          username: user.username
        })
      }.bind(this))
      .fail(function() {
        Transition.redirect('login');
      });
  },

  render: function() {
    return (
      <p>Welcome {this.state.username}!</p>
    );
  }
});
~~~

--

### $.auth.updateAccount
Update the current user's account info. This method accepts an object that should contain valid attributes and values for the current user's model.

~~~javascript
$.auth.updateAccount({
  favorite_book: 'Molloy'
});
~~~

--

### $.auth.requestPasswordReset
Send password reset instructions to a user that was registered by email.

##### arguments:
* **`email`**

~~~javascript
$.auth.requestPasswordReset({email: 'test@test.com'});
~~~

--

### $.auth.updatePassword
Change the current user's password. This only applies to users that were registered by email.

##### arguments:
* **`password`**
* **`password_confirmation`**

~~~javascript
$.auth.updatePassword({
  password: '*****',
  password_confirmation: '*****'
});
~~~

--

### $.auth.signOut
De-authenticates the current user. This will destroy the current user's client-side and server-side auth credentials.

~~~javascript
$.auth.signOut();
~~~

--

### $.auth.destroyAccount
Destroy the current user's account.

~~~javascript
$.auth.destroyAccount();
~~~

# Events

If the [PubSubJS][pubsub-js] library is included, the following events will be broadcast.

A nice feature of [PubSubJS][pubsub-js] is event namespacing (see "topics" in the docs). So you can use a single subscription to listen for any changes to the `$.auth.user` object, and then propgate the changes to any related UI components.

##### event example using React and PubSubJS:

~~~javascript
var React = require('react'),
    PubSub = require('pubsub-js'),
    Auth = require('j-toker');

var App = React.createClass({

  getInitialState: function() {
    return {
      user: Auth.user
    };
  },

  // update the user object on all auth-related events
  componentWillMount: function() {
    PubSub.subscribe('auth', function() {
      this.setState({user: Auth.user});
    }.bind(this));
  },

  // ...

});
~~~
--

### auth.validation.success
Broadcast after successful user authentication. Event message contains the user object.

##### Broadcast after:
* `$.auth.emailSignIn`
* `$.auth.oAuthSignIn`
* `$.auth.validateToken`

##### Example:

~~~javascript
PubSub.subscribe('auth.validation.success', function(ev, user) {
  alert('Welcome' + user.name + '!');
});
~~~
--

### auth.validation.error
Broadcast after failed user authentication. Event message contains errors related to the failure.

##### Broadcast after:
* `$.auth.emailSignIn`
* `$.auth.oAuthSignIn`
* `$.auth.validateToken`

##### Example:
~~~javascript
PubSub.subscribe('auth.validation.error', function(ev, err) {
  alert('Validation failure.');
});
~~~
--

### auth.emailRegistration.success
Broadcast after email sign up request was successfully completed.

##### Broadcast after:
* `$.auth.emailSignUp`

~~~javascript
PubSub.subscribe('auth.emailRegistration.success', function(ev, msg) {
  alert('Check your email!');
});
~~~
--

### auth.emailRegistration.error
Broadcast after email sign up requests fail.

##### Broadcast after:
* `$auth.emailSignUp`

##### Example:
~~~javascript
PubSub.subscribe('auth.emailRegistration.error', function(ev, msg) {
  alert('There was a error submitting your request. Please try again!');
});
~~~
--

### auth.passwordResetRequest.success
Broadcast after password reset requests complete successfully.

##### Broadcast after:
* `$.auth.passwordResetRequest`

##### Example:
~~~javascript
PubSub.subscribe('auth.passwordResetRequest.success', function(ev, msg) {
  alert('Check your email!');
});
~~~
--

### auth.passwordResetRequest.error
Broadcast after password reset requests fail.

##### Broadcast after:
* `$.auth.passwordResetRequest`

##### Example:
~~~javascript
PubSub.subscribe('auth.passwordResetRequest.error', function(ev, msg) {
  alert('There was an error submitting your request. Please try again!');
});
~~~
--

### auth.emailConfirmation.success
Broadcast upon visiting the link contained in a registration confirmation email if the subsequent validation succeeds.

##### Broadcast after:
* `$.auth.validateToken`

##### Example:
~~~javascript
PubSub.subscribe('auth.emailConfirmation.success', function(ev, msg) {
  alert('Welcome' + $.auth.user.name + '!');
});
~~~
--

### auth.emailConfirmation.error
Broadcast upon visiting the link contained in a registration confirmation email if the subsequent validation fails.

##### Broadcast after:
* `$.auth.validateToken`

##### Example:
~~~javascript
PubSub.subscribe('auth.passwordResetRequest.error', function(ev, msg) {
  alert('There was an error authenticating your new account!');
});
~~~
--

### auth.passwordResetConfirm.success
Broadcast upon visiting the link contained in a password reset confirmation email if the subsequent validation succeeds.

##### Broadcast after:
* `$.auth.validateToken`

##### Example:
~~~javascript
PubSub.subscribe('auth.emailConfirmation.success', function(ev, msg) {
  alert('Welcome' + $.auth.user.name + '! Change your password!');
});
~~~
--

### auth.passwordResetConfirm.error
Broadcast upon visiting the link contained in a password reset confirmation email if the subsequent validation fails.

##### Broadcast after:
* `$.auth.validateToken`

##### Example:
~~~javascript
PubSub.subscribe('auth.passwordResetRequest.error', function(ev, msg) {
  alert('There was an error authenticating your account!');
});
~~~
--

### auth.emailSignIn.success
Broadcast after a user successfully completes authentication using an email account.

##### Broadcast after:
* `$.auth.emailSignIn`

##### Example:
~~~javascript
PubSub.subscribe('auth.emailSignIn.success', function(ev, msg) {
  alert('Welcome' + $.auth.user.name + '! Change your password!');
});
~~~
--

### auth.emailSignIn.error
Broadcast after a user fails to authenticate using their email account.

##### Broadcast after:
* `$.auth.emailSignIn`

##### Example:
~~~javascript
PubSub.subscribe('auth.emailSignIn.error', function(ev, msg) {
  alert('There was an error authenticating your account!');
});
~~~
--

### auth.oAuthSignIn.success
Broadcast after a user successfully authenticates with an OAuth2 provider.

##### Broadcast after:
* `$.auth.oAuthSignIn`

#####Example:
~~~javascript
PubSub.subscribe('auth.oAuthSignIn.success', function(ev, msg) {
  alert('Welcome' + $.auth.user.name + '!');
});
~~~
--

### auth.oAuthSignIn.error
Broadcast after a user fails to authenticate using an OAuth2 provider.

##### Broadcast after:
* `$.auth.oAuthSignIn`

##### Example:
~~~javascript
PubSub.subscribe('auth.oAuthSignIn.error', function(ev, msg) {
  alert('There was an error authenticating your account!');
});
~~~
--

### auth.signIn.success
Broadcast after a user successfully signs in using either email or OAuth2 authentication.

##### Broadcast after:
* `$.auth.emailSignIn`
* `$.auth.oAuthSignIn`

##### Example:
~~~javascript
PubSub.subscribe('auth.oAuthSignIn.success', function(ev, msg) {
  alert('Welcome' + $.auth.user.name + '!');
});
~~~
--

### auth.signIn.error
Broadcast after a user fails to sign in using either email or OAuth2 authentication.

##### Broadcast after:
* `$.auth.emailSignIn`
* `$.auth.oAuthSignIn`

##### Example:
~~~javascript
PubSub.subscribe('auth.signIn.error', function(ev, msg) {
  alert('There was an error authenticating your account!');
});
~~~
--

### auth.signOut.success
Broadcast after a user successfully signs out.

##### Broadcast after:
* `$.auth.signOut`

##### Example:
~~~javascript
PubSub.subscribe('auth.signOut.success', function(ev, msg) {
  alert('Goodbye!');
});
~~~
--

### auth.signOut.error
Broadcast after a user fails to sign out.

##### Broadcast after:
* `$.auth.signOut`

~~~javascript
PubSub.subscribe('auth.signOut.success', function(ev, msg) {
  alert('There was a problem with your sign out attempt. Please try again!');
});
~~~
--

### auth.accountUpdate.success
Broadcast after a user successfully updates their account info.

##### Broadcast after:
* `$.auth.updateAccount`

##### Example:
~~~javascript
PubSub.subscribe('auth.accountUpdate.success', function(ev, msg) {
  alert('Your account has been updated!');
});
~~~
--

### auth.accountUpdate.error
Broadcast when an account update request fails.

##### Broadcast after:
* `$.auth.updateAccount`

##### Example:
~~~javascript
PubSub.subscribe('auth.accountUpdate.error', function(ev, msg) {
  alert('There was an error while trying to update your account.');
});
~~~
--

### auth.destroyAccount.success
Broadcast after a user's account has been successfully destroyed.

##### Broadcast after:
* `$.auth.destroyAccount`

##### Example:
~~~javascript
PubSub.subscribe('auth.destroyAccount.success', function(ev, msg) {
  alert('Goodbye!');
});
~~~
--

### auth.destroyAccount.error
Broadcast after an attempt to destroy a user's account fails.

##### Broadcast after:
* `$.auth.destroyAccount`

##### Example:
~~~javascript
PubSub.subscribe('auth.destroyAccount.error', function(ev, msg) {
  alert('There was an error while trying to destroy your account.');
});
~~~
--

### auth.passwordUpdate.success
Broadcast after a user successfully changes their password.

##### Broadcast after:
* `$.auth.updatePassword`

##### Example:
~~~javascript
PubSub.subscribe('auth.passwordUpdate.success', function(ev, msg) {
  alert('Your password has been changed!');
});
~~~
--

### auth.passwordUpdate.error
Broadcast after an attempt to change a user's password fails.

##### Broadcast after:
* `$.auth.updatePassword`

##### Example:
~~~javascript
PubSub.subscribe('auth.passwordUpdate.error', function(ev, msg) {
  alert('There was an error while trying to change your password.');
});
~~~

---

# Possible complications

This plugin uses the global jQuery [`beforeSend`](https://api.jquery.com/Ajax_Events/) callback to append authentication headers to AJAX requests. This may conflict with your own use of the callback. In that case, just call the `$.auth.appendAuthHeaders` method during your own callback.

##### Custom `beforeSend` usage example

~~~javascript
$.ajaxSetup({
  beforeSend: function(xhr, settings) {
    // append outbound auth headers
    $.auth.appendAuthHeaders(xhr, settings);
    
    // now do whatever you want
  }
});
~~~

# Alternate response formats

By default, this plugin expects user info (id, name, etc.) to be contained within the data param of successful login / token-validation responses. The following example shows an example of an expected response:

##### Expected API login response example
~~~
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
{
  "data": {
    "id":"123",
    "name": "Slemp Diggler",
    "etc": "..."
  }
}
~~~

The above example follows the format used by the [devise token gem][dta]. Usage with APIs following this format will require no additional configuration.

But not all APIs use this format. Some APIs simply return the serialized user model with no container params:

~~~
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
{
  "id":"123",
  "name": "Slemp Diggler",
  "etc": "..."
}
~~~

Functions can be provided to identify and return the relevant user data from successful authentication responses. The above example response can be handled with the following configuration:

##### Example configuration when using alternate login response

~~~javascript
$.auth.configure({
  apiUrl: 'http://api.example.com'

  handleLoginResponse: function(response) {
    return response;
  },

  handleAccountUpdateResponse: function(response) {
    return response;
  },

  handleTokenValidationResponse: function(response) {
    return response;
  }
});
~~~

---

# Multiple user types

## [View live multi-user demo][multi-user-demo]

This plugin allows for the use of multiple user authentication configurations. The following example assumes that the API supports two user classes, `User` and `EvilUser`. The following examples assume that `User` authentication routes are mounted at `/auth,` and the `EvilUser` authentication routes are mounted at `evil_user_auth`.

##### Example configuration for multiple user types

~~~javascript
Auth.configure([
  {
    default: {
      apiUrl: '//devise-token-auth.dev',
      proxyIf: function() { return window.oldIE();}
    }
  }, {
    evilUser: {
      apiUrl:                  '//devise-token-auth.dev',
      proxyIf:                 function() { return window.isOldIE(); },
      signOutUrl:              '/evil_user_auth/sign_out',
      emailSignInPath:         '/evil_user_auth/sign_in',
      emailRegistrationPath:   '/evil_user_auth',
      accountUpdatePath:       '/evil_user_auth',
      accountDeletePath:       '/evil_user_auth',
      passwordResetPath:       '/evil_user_auth/password',
      passwordUpdatePath:      '/evil_user_auth/password',
      tokenValidationPath:     '/evil_user_auth/validate_token',
      authProviderPaths: {
        github:    '/evil_user_auth/github',
        facebook:  '/evil_user_auth/facebook',
        google:    '/evil_user_auth/google_oauth2'
      }
    }
  }
]);
~~~

## Multiple user type usage

The following API methods accept a config option that can be used to specify the desired configuration.

* `$.auth.oAuthSignIn`
* `$.auth.validateUser`
* `$.auth.emailSignUp`
* `$.auth.emailSignIn`
* `$.auth.requestPasswordReset`

All other methods (`$.auth.signOut`, `$.auth.updateAccount`, etc.) derive the configuration type from the current signed-in user.

The first available configuration will be used if none is provided (`default` in the example above).

# Conceptual

The following diagrams illustrate the authentication processes used by this plugin.

## OAuth2 Sign In

The following diagram illustrates the steps necessary to authenticate a client using an oauth2 provider.

![OAuth2 Flow][o-auth-flow]

When authenticating with a 3rd party provider, the following steps will take place.

1. An external window will be opened to the provider's authentication page.
2. Once the user signs in, they will be redirected back to the API at the callback uri that was registered with the oauth2 provider.
3. The API will send the user's info back to the client via postMessage event, and then close the external window.

The postMessage event must include the following a parameters:

* `message` - this must contain the value "deliverCredentials"
* `auth-token` - a unique token set by your server.
* `uid` - the id that was returned by the provider. For example, the user's facebook id, twitter id, etc.

##### Example redirect_uri destination:
~~~html
<!DOCTYPE html>
<html>
  <head>
    <script>
      window.addEventListener("message", function(ev) {

        // this page must respond to "requestCredentials"
        if (ev.data === "requestCredentials") {

          ev.source.postMessage({
             message: "deliverCredentials", // required
             auth_token: 'xxxx', // required
             uid: 'yyyy', // required

             // additional params will be added to the user object
             name: 'Slemp Diggler'
             // etc.

          }, '*');

          // close window after message is sent
          window.close();
        }
      });
    </script>
  </head>
  <body>
    <pre>
      Redirecting...
    </pre>
  </body>
</html>
~~~

## Token validation

The client's tokens are stored in cookies using the [jquery-cookie][jquery-cookie] plugin, or localStorage if configured. This is done so that users won't need to re-authenticate each time they return to the site or refresh the page.

![Token validation][token-validation-flow]

## Email registration

This plugin also provides support for email registration. The following diagram illustrates this process.

![Email registration][email-registration-flow]

## Email sign in

![Email authentication][email-sign-in-flow]

## Password reset

The password reset flow is similar to the email registration flow.

![Password reset][password-reset-flow]

When the user visits the link contained in the resulting email, they will be authenticated for a single session. An event will be broadcast that can be used to prompt the user to update their password. See the `auth.passwordResetConfirm.success` event for details.

## Token management

Tokens should be invalidated after each request to the API. The following diagram illustrates this concept:

![Token handling][token-handling-diagram]

During each request, a new token is generated. The `access-token` header that should be used in the next request is returned in the `access-token` header of the response to the previous request. The last request in the diagram fails because it tries to use a token that was invalidated by the previous request.

The benefit of this measure is that if a user's token is compromised, the user will immediately be forced to re-authenticate. This will invalidate the token that is now in use by the attacker.

The only case where an expired token is allowed is during [batch requests](#batch-requests).

Token management is handled by default when using this plugin with the [devise token auth][dta] gem.

## Batch requests

By default, the API should update the auth token for each request ([read more](#token-management). But sometimes it's neccessary to make several concurrent requests to the API, for example:

##### Example batch request

~~~javascript
$.getJSON('/api/restricted_resource_1').success(function(resp) {
  // handle response
});

$.getJSON('/api/restricted_resource_2').success(function(resp) {
  // handle response
});
~~~

In this case, it's impossible to update the `access-token` header for the second request with the `access-token` header of the first response because the second request will begin before the first one is complete. The server must allow these batches of concurrent requests to share the same auth token. This diagram illustrates how batch requests are identified by the server:

![Batch request overview][batch-request-a]

The "5 second" buffer in the diagram is the default used by the [devise token auth][dta] gem.

The following diagram details the relationship between the client, server, and access tokens used over time when dealing with batch requests:

![Batch request overview cont][batch-request-b]

Note that when the server identifies that a request is part of a batch request, the user's auth token is not updated. The auth token will be updated for the first request in the batch, and then that same token will be returned in the responses for each subsequent request in the batch (as shown in the diagram).

The [devise token auth][dta] gem automatically manages batch requests, and it provides settings to fine-tune how batch request groups are identified.

## Identifying users on the server.

The user's authentication information is included by the client in the `access-token` header of each request. If you're using the [devise token auth](https://github.com/lynndylanhurley/devise_token_auth) gem, the header must follow the [RFC 6750 Bearer Token](http://tools.ietf.org/html/rfc6750) format:

~~~
"access-token": "wwwww",
"token-type":   "Bearer",
"client":       "xxxxx",
"expiry":       "yyyyy",
"uid":          "zzzzz"
~~~

Replace `xxxxx` with the user's `auth_token` and `zzzzz` with the user's `uid`. The `client` field exists to allow for multiple simultaneous sessions per user. The `client` field defaults to `default` if omitted. `expiry` is used by the client to invalidate expired tokens without making an API request. A more in depth explanation of these values is [here](https://github.com/lynndylanhurley/devise_token_auth#identifying-users-in-controllers).

This will all happen automatically when using this plugin.

**Note**: You can customize the auth headers however you like. [Read more](#using-alternate-header-formats).

---

# Internet Explorer

Internet Explorer (8, 9, 10, & 11) present the following obstacles:

* IE8 & IE9 don't really support cross origin requests (CORS).
* IE8+ `postMessage` implementations don't work for our purposes.
* IE8 & IE9 both try to cache ajax requests.

The following measures are necessary when dealing with these older browsers.

### AJAX cache must be disabled for IE8 + IE9

IE8 + IE9 will try to cache ajax requests. This results in an issue where the request return 304 status with `Content-Type` set to `html` and everything goes haywire.

The solution to this problem is to set the `If-Modified-Since` headers to `'0'` on each of the request methods that we use in our app. This is done by default when using this plugin.

The solution was lifted from [this stackoverflow post](http://stackoverflow.com/questions/16098430/angular-ie-caching-issue-for-http).

### IE8 and IE9 must proxy CORS requests

You will need to set up an API proxy if the following conditions are both true:

* your API lives on a different domain than your client
* you wish to support IE8 and IE9

##### Example proxy using express for node.js
~~~javascript
var express   = require('express');
var request   = require('request');
var httpProxy = require('http-proxy');
var CONFIG    = require('config');

// proxy api requests (for older IE browsers)
app.all('/proxy/*', function(req, res, next) {
  // transform request URL into remote URL
  var apiUrl = 'http:'+CONFIG.API_URL+req.params[0];
  var r = null;

  // preserve GET params
  if (req._parsedUrl.search) {
    apiUrl += req._parsedUrl.search;
  }

  // handle POST / PUT
  if (req.method === 'POST' || req.method === 'PUT') {
    r = request[req.method.toLowerCase()]({
      uri: apiUrl,
      json: req.body
    });
  } else {
    r = request(apiUrl);
  }

  // pipe request to remote API
  req.pipe(r).pipe(res);
});
~~~

The above example assumes that you're using [express](http://expressjs.com/), [request](https://github.com/mikeal/request), and [http-proxy](https://github.com/nodejitsu/node-http-proxy), and that you have set the API_URL value using [node-config](https://github.com/lorenwest/node-config).

### IE8-11 must use hard redirects for provider authentication

Most modern browsers can communicate across tabs and windows using [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window.postMessage). This doesn't work for certain browsers (IE8-11). In these cases the client must take the following steps when performing provider authentication (facebook, github, etc.):

1. navigate from the client site to the API
1. navigate from the API to the provider
1. navigate from the provider to the API
1. navigate from the API back to the client

These steps are taken automatically when using this plugin with IE8+.

---

# Contributing

1. Create a feature branch with your changes.
1. Write some test cases.
1. Make all the tests pass.
1. Issue a pull request.

I will grant you commit access if you send quality pull requests.

# Development

### Running the dev server

There is a test project in the `demo` directory of this app. To start a dev server, perform the following steps.

1. `cd` to the root of this project.
1. `npm install`
1. `grunt serve`

A dev server will start on [localhost:7777](http://localhost:7777). The test suite will be run as well.

### Running the tests

If you just want to run the tests, follow these steps:

1. `cd` into the root of this project
1. `npm install`
1. `grunt`

### Testing against a live API

This plugin was built against [this API](https://github.com/lynndylanhurley/devise_token_auth_demo). You can use this, or feel free to use your own.

---

# Credits

Thanks to the following contributors:

* [gbataille](https://github.com/gbataille)

Code and ideas were stolen from the following sources:

* [this SO post on token-auth security][so-post]
* [this SO post on string templating](http://stackoverflow.com/questions/14879866/javascript-templating-function-replace-string-and-dont-take-care-of-whitespace)
* [this brilliant AngularJS module][ng-token-auth]

---

# License

WTFPL © Lynn Dylan Hurley

[ng-token-auth]: https://github.com/lynndylanhurley/ng-token-auth
[dta]: https://github.com/lynndylanhurley/devise_token_auth
[token-auth-wiki]: http://stackoverflow.com/questions/1592534/what-is-token-based-authentication
[so-post]: http://stackoverflow.com/questions/18605294/is-devises-token-authenticatable-secure
[jquery]: https://jquery.com/
[jquery-cookie]: https://github.com/carhartl/jquery-cookie
[jquery-deparam]: https://www.npmjs.com/package/jquery-deparam
[pubsub-js]: https://github.com/mroderick/PubSubJS
[bower]: http://bower.io/
[npm]: https://www.npmjs.com/
[browserify]: http://browserify.org/
[cors]: http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
[common-js]: http://en.wikipedia.org/wiki/CommonJS
[dfd]: https://api.jquery.com/jQuery.Deferred/
[angular]: https://angularjs.org/
[react]: http://facebook.github.io/react/
[j-toker-demo]: http://j-toker-demo.herokuapp.com/#/
[multi-user-demo]: http://j-toker-demo.herokuapp.com/#/alt-user

[o-auth-flow]: https://github.com/lynndylanhurley/ng-token-auth/raw/master/test/app/images/flow/omniauth-flow.jpg
[token-validation-flow]: https://github.com/lynndylanhurley/ng-token-auth/raw/master/test/app/images/flow/validation-flow.jpg
[email-registration-flow]: https://github.com/lynndylanhurley/ng-token-auth/raw/master/test/app/images/flow/email-registration-flow.jpg
[email-sign-in-flow]: https://github.com/lynndylanhurley/ng-token-auth/raw/master/test/app/images/flow/email-sign-in-flow.jpg
[password-reset-flow]: https://github.com/lynndylanhurley/ng-token-auth/raw/master/test/app/images/flow/password-reset-flow.jpg
[token-handling-diagram]: https://github.com/lynndylanhurley/ng-token-auth/raw/master/test/app/images/flow/token-update-detail.jpg
[batch-request-a]: https://github.com/lynndylanhurley/ng-token-auth/raw/master/test/app/images/flow/batch-request-overview.jpg
[batch-request-b]: https://github.com/lynndylanhurley/ng-token-auth/raw/master/test/app/images/flow/batch-request-detail.jpg
[logo]: https://github.com/lynndylanhurley/j-toker/raw/master/demo/src/images/j-toker-logo.gif
