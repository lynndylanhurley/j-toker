var Auth         = require('../../../src/j-toker.js'),
    React        = require('react'),
    Router       = require('react-router'),
    Route        = Router.Route,
    DefaultRoute = Router.DefaultRoute,
    RouteHandler = Router.RouteHandler,
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
          <Navbar brand='ReactMobile'>
            <Nav>
              <NavItemLink to='home'>Home</NavItemLink>
            </Nav>
          </Navbar>
        </header>

        {/* placeholder for page content*/}
        <RouteHandler {...this.state} />
      </div>
    );
  }
});


// define routes
var routes = (
  <Route handler={App} path='/'>
    <DefaultRoute name='home' handler={HomePage} />
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
