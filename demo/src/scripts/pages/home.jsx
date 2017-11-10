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
    AuthInfo       = require('../components/auth-info.jsx'),
    //SignOut        = require('../components/signout-form.jsx'),
    Registration   = require('../components/registration-form.jsx')


module.exports = React.createClass({

 getInitialState: function() {
    return ({
      device: this.props.device,
      user: this.props.user,
      auth: this.props.user
    });
  },

  propTypes: {
    device: React.PropTypes.object,
    user: React.PropTypes.object,
    auth: React.PropTypes.object
  },

  getDefaultProps: function() {
    return {
      device: {
        deviceToken: '',
        deviceName: '',
        propertyName: '',
        integrationType: ''
      },
      user: {
        name: ''
      },
      auth: {
        accessToken: '',
        client: '',
        uid: '',
        provider: '',
        expiry: null
      }
    };
  },

  updateDeviceConfig: function (deviceConfig) {
    this.setState({
      device: deviceConfig
    });
  },

  updateUserConfig: function (userConfig) {
    this.setState({
      user: userConfig
    });
  },

  updateAuthHeaders: function (authHeaders) {
    this.setState({
      auth: authHeaders
    })
  },

  render: function() {

    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <Well>
              <h1>Watch Sauce</h1>
              <h4>Workflow demonstration</h4>
              <p>
                Basic instructions go here.
              </p>
            </Well>
          </Col>
        </Row>
        <Row>

          <Col xs={12} sm={6}>
            <Registration onDeviceEnrollSuccess={this.updateDeviceConfig}/>
          </Col>

          <Col xs={12} sm={6}>
            <ProfileInfo device={this.state.device}/>
          </Col>

          <Col xs={12} sm={6}>
            <SignIn device={this.state.device} updateUser={this.updateUserConfig} updateAuth={this.updateAuthHeaders}/>
          </Col>

          <Col xs={12} sm={6}>
            <AuthInfo auth={this.state.auth}/>
          </Col>

        </Row>
      </Grid>
    );
  }
});
