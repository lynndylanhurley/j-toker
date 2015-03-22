var React     = require('react'),
    BS        = require('react-bootstrap'),
    Panel     = BS.Panel,
    Grid      = BS.Grid,
    Row       = BS.Row,
    Col       = BS.Col,
    LoginForm = require('../components/login-form.jsx');

module.exports = React.createClass({
  render: function() {
    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <h1>Multi Users</h1>
          </Col>
        </Row>
      </Grid>
    );
  }
});
