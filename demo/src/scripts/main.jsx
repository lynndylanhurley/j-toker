var Auth         = require('../../../src/j-toker.js'),
    React        = require('react'),
    Router       = require('react-router'),
    Route        = Router.Route,
    DefaultRoute = Router.DefaultRoute,
    RouteHandler = Router.RouteHandler,
    Banner       = require('./components/github-banner.jsx'),
    HomePage     = require('./pages/home.jsx'),
    AltUserPage  = require('./pages/alt-user.jsx'),
    BS           = require('react-bootstrap'),
    Navbar       = BS.Navbar,
    Nav          = BS.Nav,
    NavItem      = BS.NavItem,
    RRBS         = require('react-router-bootstrap'),
    NavItemLink  = RRBS.NavItemLink,
    PubSub       = require('pubsub-js');

// configure jToker
Auth.configure([
  {
    default: {
      apiUrl:  window.config.apiUrl,
      proxyIf: function() { return window.isOldIE(); }
    }
  }, {
    evilUser: {
      apiUrl:                window.config.apiUrl,
      proxyIf:               function() { return window.isOldIE(); },
      signOutUrl:            '/mangs/sign_out',
      emailSignInPath:       '/mangs/sign_in',
      emailRegistrationPath: '/mangs',
      accountUpdatePath:     '/mangs',
      accountDeletePath:     '/mangs',
      passwordResetPath:     '/mangs/password',
      passwordUpdatePath:    '/mangs/password',
      tokenValidationPath:   '/mangs/validate_token',
      authProviderPaths: {
        github:    '/mangs/github',
        facebook:  '/mangs/facebook',
        google:    '/mangs/google_oauth2'
      }
    }
  }
]);

// define base layout
var App = React.createClass({
  getInitialState: function() {
    return {
      user: Auth.user
    };
  },

  // update the user state on all auth-related events
  componentWillMount: function() {
    PubSub.subscribe('auth', function() {
      this.setState({user: Auth.user});
    }.bind(this));
  },

  render: function() {
    return (
      <div>
        <header>
          <Navbar brand='jToker'>
            <Nav>
              <NavItemLink to='home'>Home</NavItemLink>
              <NavItemLink to='alt-user'>Alternate User Class</NavItemLink>
            </Nav>
          </Navbar>
        </header>

        {/* placeholder for page content*/}
        <RouteHandler {...this.state} />

        <Banner />
      </div>
    );
  }
});


// define routes
var routes = (
  <Route handler={App} path='/'>
    <DefaultRoute name='home' handler={HomePage} />
    <Route name='alt-user' path='alt-user' handler={AltUserPage} />
  </Route>
);


// bind app to routes
Router.run(routes, function(Handler) {
  var params = {
    user: Auth.user
  };

  React.render(
    <Handler />,
    document.getElementById('content')
  );
})
