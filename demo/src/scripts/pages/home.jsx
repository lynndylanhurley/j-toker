var React          = require('react'),
    $              = require('jquery'),
    BS             = require('react-bootstrap'),
    Panel          = BS.Panel,
    Grid           = BS.Grid,
    Row            = BS.Row,
    Col            = BS.Col,
    Well           = BS.Well,
    //SignIn         = require('../components/login-form.jsx'),
    //ProfileInfo    = require('../components/profile-info.jsx'),
    //SignOut        = require('../components/signout-form.jsx'),
    Registration   = require('../components/registration-form.jsx')


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
            <Registration />
          </Col>

        </Row>
      </Grid>
    );
  }
});
