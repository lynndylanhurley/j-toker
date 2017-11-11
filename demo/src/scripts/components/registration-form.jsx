var React              = require('react'),
    $                  = require('jquery'),
    BS                 = require('react-bootstrap'),
    Input              = BS.Input,
    Button             = BS.Button,
    Panel              = BS.Panel,
    ResponseModalMixin = require('../mixins/response-modal.jsx'),
    FormStateMixin     = require('../mixins/form-state.jsx'),
    Highlight          = require('react-highlight');


module.exports = React.createClass({
  mixins: [
    ResponseModalMixin,
    FormStateMixin
  ],

  propTypes: function() {
    return {
      config: React.PropTypes.string
    }
  },

  getDefaultProps: function() {
    return {
      config: 'default'
    }
  },

  getInitialState: function() {
    return {
      deviceName: '',
      enrollmentCode: '',
      propertyName: '',
      integrationType: '',
      deviceToken: '',
      isModalOpen: false,
      errors: null
    };
  },

  handleRegistrationClick: function() {
    var data = {
      "device_name": this.state.deviceName
    }

    $.ajax({
      "url": window.config.apiUrl + "/api/v2/devices/enrollments",
      "method": "POST",
      "headers": {
        "enrollment_code": this.state.enrollmentCode,
        "enrollment_code_password": this.state.enrollmentCodePassword,
        "content-type": "application/json"
      },
      "processData": false,
      "data": JSON.stringify(data),
    })
    .done( function(response){
        this.props.onDeviceEnrollSuccess({
          deviceName: response.data.device_name,
          propertyName: response.data.property_name,
          deviceToken: response.data.device_token,
          integrationType: response.data.integration_type
        });
        this.setState({
          deviceToken: response.data.device_token,
          propertyName: response.data.property_name,
          deviceName: response.data.device_name,
          isModalOpen: true,
          errors: null
        })
      }.bind(this))
    .fail(function(response, status, error){
         this.setState({
          isModalOpen: true,
          errors: response.responseJSON.errors || [error]
        });
    }.bind(this));
  },

  successModalTitle: 'Device Enrollment Success',
  errorModalTitle: 'Device Enrollment Error',

  renderSuccessMessage: function() {
    return (
      <p>
        Your device is now enrolled with {this.state.propertyName}.
      </p>
    );
  },

  renderErrorMessage: function() {
    return (
      <p>{this.state.errors.join(', ')}</p>
    );
  },

  render: function() {
    var configParam = <span></span>;

    if (this.props.config !== 'default') {
      configParam = <span>&nbsp;&nbsp;config: '{this.props.config}',<br /></span>;
    }

    //var sourceLink = <a href='https://github.com/lynndylanhurley/j-toker/blob/master/demo/src/scripts/components/registration-form.jsx' target='blank'>View component source</a>;

    return (
      <Panel header='Enroll Device' bsStyle='info'>
        <form>
          <Input type='text'
                name='enrollmentCode'
                label='Enrollment Code (required)'
                placeholder='Enter code...'
                value={this.state.enrollmentCode}
                disabled={!$.isEmptyObject(this.state.deviceToken)}
                onChange={this.handleInputChange} />

          <Input type='text'
                name='enrollmentCodePassword'
                label='Enrollment Code Password (required)'
                placeholder='Enter password...'
                disabled={!$.isEmptyObject(this.state.deviceToken)}
                onChange={this.handleInputChange} />

          <Input type='text'
                name='deviceName'
                label='Device Name (optional)'
                placeholder='Enter device name...'
                value={this.state.deviceName}
                disabled={!$.isEmptyObject(this.state.deviceToken)}
                onChange={this.handleInputChange} />

          <Button className='btn btn-primary'
                  onClick={this.handleRegistrationClick}
                  disabled={!$.isEmptyObject(this.state.deviceToken)}>
            Enroll
          </Button>
        </form>

        <br />
      </Panel>
    );
  }
});
