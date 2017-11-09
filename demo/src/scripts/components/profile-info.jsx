var React = require('react'),
    BS    = require('react-bootstrap'),
    Well  = BS.Well,
    Grid  = BS.Grid,
    Row   = BS.Row,
    Col   = BS.Col,
    Panel = BS.Panel;

module.exports = React.createClass({

  propTypes: {
    deviceToken: React.PropTypes.string,
    deviceName: React.PropTypes.string,
    propertyName: React.PropTypes.string,
    integrationType: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      deviceToken:          '',
      deviceName:           '',
      propertyName:         '',
      integrationType:      ''
    }
  },

  render: function() {

    return (
      <Panel header='Device Config' bsStyle='info'>
        <Row>
          <Col xs={9}>

            <label>Device token:</label>
            <p>{this.props.deviceConfig.deviceToken || 'n/a'}</p>

            <label>Device name:</label>
            <p>{this.props.deviceConfig.deviceName || 'n/a'}</p>

            <label>Property name:</label>
            <p>{this.props.deviceConfig.propertyName || 'n/a'}</p>

            <label>Integration type:</label>
            <p>{this.props.deviceConfig.integrationType || 'n/a'}</p>

          </Col>
        </Row>
      </Panel>
    );
  }
});
