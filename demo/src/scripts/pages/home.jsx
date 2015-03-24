var React          = require('react'),
    $              = require('jquery'),
    BS             = require('react-bootstrap'),
    Panel          = BS.Panel,
    Grid           = BS.Grid,
    Row            = BS.Row,
    Col            = BS.Col,
    Well           = BS.Well,
    SignIn         = require('../components/login-form.jsx'),
    ProfileInfo    = require('../components/profile-info.jsx'),
    SignOut        = require('../components/signout-form.jsx'),
    OAuth          = require('../components/oauth-form.jsx'),
    Registration   = require('../components/registration-form.jsx'),
    Destruction    = require('../components/destroy-account.jsx'),
    UpdateAccount  = require('../components/update-account.jsx'),
    ResetPassword  = require('../components/password-reset.jsx'),
    UpdatePassword = require('../components/password-update.jsx'),
    AccessControl  = require('../components/access-control.jsx');


module.exports = React.createClass({

  componentWillMount: function() {
    $('body').toggleClass('evil', false);
  },

  propTypes: {
    user: React.PropTypes.object
  },

  getDefaultProps: function() {
    return {
      user: {}
    };
  },

  render: function() {
    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <Well>
              <h1>jToker</h1>
              <h4>Simple, secure authentication for single-page apps</h4>
              <p>
                This demo was built using
                <a href='https://facebook.github.io/react/'
                   target='_blank'
                   className='react-logo'>
                  <img src='./images/react-logo.svg' width='20' height='20' />
                  React
                </a>
              </p>
              <p>
                View the source code&nbsp;
                <a href='https://github.com/lynndylanhurley/j-toker/tree/master/demo/src'
                   target='_blank'>here</a>.
              </p>
            </Well>
          </Col>
        </Row>
        <Row>
          <Col xs={12} sm={6}>
            <ProfileInfo {...this.props.user} />
          </Col>

          <Col xs={12} sm={6}>
            <SignIn {...this.props.user} />
          </Col>

          <Col xs={12} sm={6}>
            <SignOut {...this.props.user} />
          </Col>

          <Col xs={12} sm={6}>
            <Destruction {...this.props.user} />
          </Col>

          <Col xs={12} sm={6}>
            <OAuth {...this.props.user} />
          </Col>

          <Col xs={12} sm={6}>
            <Registration />
          </Col>

          <Col xs={12} sm={6}>
            <ResetPassword />
          </Col>

          <Col xs={12} sm={6}>
            <UpdateAccount />
          </Col>

          <Col xs={12} sm={6}>
            <UpdatePassword {...this.props.user} />
          </Col>

          <Col xs={12} sm={6}>
            <AccessControl {...this.props.user} />
          </Col>
        </Row>
      </Grid>
    );
  }
});
