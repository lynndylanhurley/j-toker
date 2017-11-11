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
      <Panel header='Auth Info' bsStyle='info'>
        <Row>
          <Col xs={9}>

            <label>access-token:</label>
            <p>{this.props.auth.accessToken || 'n/a'}</p>

            <label>client:</label>
            <p>{this.props.auth.client || 'n/a'}</p>

            <label>uid:</label>
            <p>{this.props.auth.uid || 'n/a'}</p>

            <label>provider:</label>
            <p>{this.props.auth.provider || 'n/a'}</p>

            <label>expiry:</label>
            <p>{this.props.auth.expiry || 'n/a'}</p>

          </Col>
        </Row>
      </Panel>
    );
  }
});
