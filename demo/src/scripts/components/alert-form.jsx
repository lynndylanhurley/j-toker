var React              = require('react'),
    $                  = require('jquery'),
    BS                 = require('react-bootstrap'),
    Input              = BS.Input,
    Button             = BS.Button,
    Panel              = BS.Panel,
    ResponseModalMixin = require('../mixins/response-modal.jsx'),
    FormStateMixin     = require('../mixins/form-state.jsx'),
    _                  = require('lodash'),
    Highlight          = require('react-highlight');

module.exports = React.createClass({
  mixins: [
    ResponseModalMixin,
    FormStateMixin
  ],

  getInitialState: function() {
    return {
      errors:         null,
      isModalOpen:    false,
      alertActive:    false
    }
  },

  handleActivateClick: function() {
    this.setState({
      alertActive: true,
      isModalOpen: true
    });
  },

  successModalTitle: 'Sos Activate Success',
  errorModalTitle: 'Sos Activate Error',

  renderSuccessMessage: function() {
    return (
      <p>SOS ALERT ACTIVATED!</p>
    );
  },

  renderErrorMessage: function() {
    return (
      <p>
        There was an error activating an sos alert:
        {this.state.errors.join(' ')}
      </p>
    );
  },

  render: function() {
    return (
      <Panel header='Alert' bsStyle='info'>
        <form>
          <Button className='btn btn-danger'
                  disabled={!this.state.signedIn && this.state.alertActive}
                  onClick={this.handleActivateClick}>
            Activate SOS!
          </Button>
        </form>
        <form>
          <Button className='btn btn-warning'
                  disabled={!this.state.alertActive}
                  onClick={this.handleUpdateClick}>
            Update
          </Button>
        </form>
        <form>
          <Button className='btn btn-success'
                  disabled={!this.state.alertActive}
                  onClick={this.handleCancelClick}>
            Cancel
          </Button>
        </form>
      </Panel>
    );
  }
});
