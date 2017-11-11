var React = require('react'),
    BS    = require('react-bootstrap'),
    Well  = BS.Well,
    Grid  = BS.Grid,
    Row   = BS.Row,
    Col   = BS.Col,
    Panel = BS.Panel;

module.exports = React.createClass({

  render: function() {

    return (
      <Panel header='Device Config' bsStyle='info'>
        <Row>
          <Col xs={9}>

            <label>Device token:</label>
            <p>{this.props.device.deviceToken || 'n/a'}</p>

            <label>Device name:</label>
            <p>{this.props.device.deviceName || 'n/a'}</p>

            <label>Property name:</label>
            <p>{this.props.device.propertyName || 'n/a'}</p>

            <label>Integration type:</label>
            <p>{this.props.device.integrationType || 'n/a'}</p>

          </Col>
        </Row>
      </Panel>
    );
  }
});
