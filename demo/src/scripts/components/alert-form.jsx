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
      alertActive:    false,
      alertGuid:      '',
    }
  },

  handleActivateClick: function() {
    var data = {
      "sos_request": {
        "latitude": 47.6685285,
        "longitude": -122.3872016
      }
    }

    $.ajax({
      "url": window.config.apiUrl + "/api/v2/sos_alerts",
      "method": "POST",
      "headers": {
        "content-type": "application/json",
        "access-token": this.props.auth.accessToken,
        "client": this.props.auth.client,
        "uid": this.props.auth.uid,
        "provider": this.props.auth.provider
      },
      "processData": false,
      "data": JSON.stringify(data)
    })
    .done( function(response){
        console.log(response.data);
        this.setState({
          alertActive: true,
          isModalOpen: true,
          alertGuid: response.data.guid,
          errors: null
        })
      }.bind(this))
    .fail(function(response, status, error){
      this.setState({
        isModalOpen: true,
        errors: response.responseJSON.error.message|| error
      });
    }.bind(this));
  },

  handleCancelClick: function() {

    $.ajax({
      "url": window.config.apiUrl + "/api/v2/sos_alerts/" + this.state.alertGuid,
      "method": "DELETE",
      "headers": {
        "content-type": "application/json",
        "access-token": this.props.auth.accessToken,
        "client": this.props.auth.client,
        "uid": this.props.auth.uid,
        "provider": this.props.auth.provider
      },
      "processData": false
    })
    .done( function(response){
        this.setState({
          alertActive: false,
          isModalOpen: true,
          errors: null
        })
      }.bind(this))
    .fail(function(response, status, error){
      this.setState({
        isModalOpen: true,
        errors: response.responseJSON.error.message || error
      });
    }.bind(this));
  },

  successModalTitle: 'Success',
  errorModalTitle: 'Error',

  renderSuccessMessage: function() {
    return (
      <p>API request OK</p>
    );
  },

  renderErrorMessage: function() {
    return (
      <p>
        {this.state.errors}
      </p>
    );
  },

  render: function() {
    return (
      <Panel header='SOS Alert' bsStyle='info'>
        <form>
          <Button className='btn btn-danger'
                  disabled={!this.state.signedIn && this.state.alertActive}
                  onClick={this.handleActivateClick}>
            Activate
          </Button>
        </form>
        <form>
          <Button className='btn btn-warning'
                  disabled={!this.state.alertActive}
                  onClick={this.handleUpdateClick}>
            Update GeoCoords
          </Button>
        </form>
        <form>
          <Button className='btn btn-success'
                  disabled={!this.state.alertActive}
                  onClick={this.handleCancelClick}>
            Deactivate
          </Button>
        </form>
      </Panel>
    );
  }
});
