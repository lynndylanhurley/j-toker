var React          = require('react'),
    $              = require('jquery'),
    BS             = require('react-bootstrap'),
    Panel          = BS.Panel,
    Grid           = BS.Grid,
    Row            = BS.Row,
    Col            = BS.Col,
    Well           = BS.Well,
    //SignIn         = require('../components/login-form.jsx'),
    ProfileInfo    = require('../components/profile-info.jsx'),
    //SignOut        = require('../components/signout-form.jsx'),
    Registration   = require('../components/registration-form.jsx')


module.exports = React.createClass({

  propTypes: {
    device: React.PropTypes.object
  },

  getDefaultProps: function() {
    return {
      device: {
        deviceToken: 'token001',
        deviceName: 'watch01',
        propertyName: 'Hotel Albatross',
        integrationType: 'hotsos'
      }
    };
  },

  updateDeviceConfig: function (deviceConfig) {
    console.log(deviceConfig);
    this.setState({
      device: deviceConfig
    });
    console.log(this.state);
    console.log(this.props);
  },

  render: function() {

    listName = "FoobarListNameYay =)"

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
            <ProfileInfo deviceConfig={this.props.device}/>
          </Col>

        </Row>
      </Grid>
    );
  }
});
