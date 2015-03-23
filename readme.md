# j-toker

> Simple, secure user authentication for jQuery.


This module provides the following features:

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


# Live Demo

This project comes bundled with a test app. You can run the demo locally by following these instructions, or you can use it here in production.

The demo uses [React][react], and the source can be found [here](https://github.com/lynndylanhurley/j-toker/tree/master/demo/src).

# Table of Contents

* [About this module](#about-this-module)
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
* Using alternate response formats
* Using multiple user types
* Conceptual diagrams
  * OAuth2 Authentication
  * Token Validation
  * Email Registration
  * Email Sign In
  * Password Reset Requests
* Notes on Token Management
* Notes on Batch Requests
* Token Formatting
* Internet Explorer Caveats
* FAQ
* Development
* Contribution Guidelines
* See also
* Callouts

# About this module

This module relies on [token based authentication][token-auth-wiki]. This requires coordination between the client and the server. [Diagrams](#conceptual) are included to illustrate this relationship.

This module was designed to work out of the box with the legendary [devise token auth][dta] gem, but it's flexible enough to be used in just about any environment.

Oh wait you're using [AngularJS][angular]? Use [ng-token-auth][ng-token-auth] instead.

**About security**: [read here][so-post] for more information on securing your token auth system. The [devise token auth][dta] gem has adequate security measures in place, and this module was built to work seamlessly with that gem.

# Installation

1. Download this module and its dependencies.

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
3. Include j-toker in your project. 
   * If you're using [browserify][browserify] or similar, this will look like this:
 
     ~~~javascript
     // this will resolve the dependencies automatically
     var Auth = require('j-toker');
     ~~~
   
   * Otherwise you will need to include j-toker and its dependencies manually:
   
     ~~~html
     <!-- in your index.html file -->
     
     <!-- dependencies - these should come BEFORE j-toker -->
     <script src='/js/jquery/dist/jquery.js'></script>
     <script src='/js/jquery.cookie/jquery.cookie.js'></script>
     <script src='/js/jquery-deparam/jquery-deparam.js'></script>
     <script src='/js/pubsub-js/src/pubsub.js'></script>
     
     <!-- this should come AFTER the preceeding files -->
     <script src='/js/jquery.j-toker.js'></script>
     
     <!-- jToker will now be available at $.auth -->
     ~~~


**Note**: For the rest of this README, I will assume jToker is available at `$.auth`, where `$` stands for `jQuery`. But when using `require`, jToker will be available as whatever you name the required module (`Auth` in the example above).

# Configuration

`$.auth.configure` will need to be called before this module can be used.

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

### tokenValidationPath
###### string
Path (relative to `apiUrl`) to validate authentication tokens. [Read more](#token-validation-flow).

### signOutUrl
###### string
Path (relative to `apiUrl`) to de-authenticate the current user. This will destroy the user's token both server-side and client-side.

### authProviderPaths
###### object
An object containing paths to auth endpoints. Keys should be the names of the providers, and the values should be the auth paths relative to the `apiUrl`. [Read more](#oauth-2-authentication-flow).

### emailRegistrationPath
###### string
Path (relative to `apiUrl`) for submitting new email registrations. [Read more](#email-registration-flow).

### accountUpdatePath
###### string
Path (relative to `apiUrl`) for submitting account update requests.

### accountDeletePath
###### string
Path (relative to `apiUrl`) for submitting account deletion requests.

### confirmationSuccessUrl
###### string or function
The absolute url to which the API should redirect after users visit the link contained in email-registration confirmation emails.

### emailSignInPath
###### string
Path (relative to `apiUrl`) for signing in to an existing email account.

### passwordResetPath
###### string
Path (relative to `apiUrl`) for requesting password reset emails.

### passwordResetSuccessUrl
###### string or function
The absolute url to which the API should redirect after users visit the link contained in password-reset confirmation emails.

### passwordUpdatePath
###### string
Path (relative to `apiUrl`) for submitting new passwords for authenticated users.

### storage
###### string
The method used to persist tokens between sessions. Allowed values are `cookies` and `localStorage`.

### proxyIf
###### function
Older browsers have troubel with [CORS][cors]. Pass a method to this option that will determine whether or not a proxy should be used.

### proxyUrl
###### string
If the `proxyIf` method returns `true`, this is the URL that will be used in place of `apiUrl`.

### tokenFormat
###### object
A template for authentication tokens. The template will be provided a context with the following keys:

* access-token
* client
* uid
* expiry

The above strings will be replaced with their corresponding values as found in the response headers.

### parseExpiry
###### function
A function that will return the token's expiry from the current headers. `null` is returned if no expiry is found.

### handleLoginResponse
###### function
A function used to identify and return the current user's account info (`id`, `username`, etc.) from the response of a successful login request.

### handleAccountUpdateResponse
###### function
A function used to identify and return the current user's info (`id`, `username`, etc.) from the response of a successful account update request.

### handleTokenValidationResponse
###### function
A function used to identify and return the current user's info (`id`, `username`, etc.) from the response of a successful token validation request.

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

### $.auth.user
An object representing the current user. In addition to the attributes of your user model, the following additional attributes are available:

* **`signedIn`**: (boolean) will return true if there is a current user.
* **`configName`**: (string) the name of the configuration used to authenticate the current user. When using a single API configuration (most cases), this will be `default`.

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
    Auth.validateUser()
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

### $.auth.updateAccount
Update the current user's account info. This method accepts an object that should contain valid attributes and values for the current user's model.

~~~javascript
$.auth.updateAccount({
  favorite_book: 'Molloy'
});
~~~

### $.auth.requestPasswordReset
Send password reset instructions to a user that was registered by email.

##### arguments:
* **`email`**

~~~javascript
$.auth.requestPasswordReset({email: 'test@test.com'});
~~~

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

### $.auth.signOut
De-authenticates the current user. This will destroy the current user's client-side and server-side auth credentials.

~~~javascript
$.auth.signOut();
~~~

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

### auth.emailRegistration.success
Broadcast after email sign up request was successfully completed.

##### Broadcast after:
* `$.auth.emailSignUp`

~~~javascript
PubSub.subscribe('auth.emailRegistration.success', function(ev, msg) {
  alert('Check your email!');
});
~~~

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

### auth.signOut.error
Broadcast after a user fails to sign out.

##### Broadcast after:
* `$.auth.signOut`

~~~javascript
PubSub.subscribe('auth.signOut.success', function(ev, msg) {
  alert('There was a problem with your sign out attempt. Please try again!');
});
~~~

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

## Credits

Code and ideas were stolen from the following sources:

* [this SO post on token-auth security][so-post]
* [this SO post on string templating](http://stackoverflow.com/questions/14879866/javascript-templating-function-replace-string-and-dont-take-care-of-whitespace)

## License

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