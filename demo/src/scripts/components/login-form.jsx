var React              = require('react'),
    $                  = require('jquery'),
    BS                 = require('react-bootstrap'),
    Input              = BS.Input,
    Button             = BS.Button,
    Modal              = BS.Modal,
    Panel              = BS.Panel,
    Auth               = require('../../../../src/j-toker.js'),
    ResponseModalMixin = require('../mixins/response-modal.jsx'),
    Highlight          = require('react-highlight'),
    _                  = require('lodash');

module.exports = React.createClass({
  mixins: [ResponseModalMixin],

  propTypes: function() {
    return {
      signedIn: React.PropTypes.bool,
      config: React.PropTypes.string
    }
  },

  getDefaultProps: function() {
    return {
      signedIn: false,
      config: 'default'
    }
  },

  getInitialState: function() {
    return {
      email: '',
      password: '',
      isModalOpen: false,
      signedIn: this.props.signedIn,
      errors: null
    };
  },


  handleSignInClick: function(ev) {
    var data = {
      "device_token": this.props.device.deviceToken,
      "login_id": this.state.loginId
    }

    $.ajax({
      "url": window.config.apiUrl + "/api/v2/devices/users/sign_in",
      "method": "POST",
      "headers": {
        "content-type": "application/json"
      },
      "processData": false,
      "data": JSON.stringify(data),
      "complete": function(xhr, status){
        this.props.updateAuth({
          accessToken: xhr.getResponseHeader('access-token'),
          client: xhr.getResponseHeader('client'),
          uid: xhr.getResponseHeader('uid'),
          expiry: xhr.getResponseHeader('expiry'),
          provider: 'email'
        });
      }.bind(this)
    })
    .done( function(response){
        this.props.updateUser({
          name: 'Pera Perez'
        });
        this.setState({
          name: 'Pera Perez',
          signedIn: true,
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

  successModalTitle: 'User Sign In Success',
  errorModalTitle: 'User Sign In Error',

  renderSuccessMessage: function() {
    return (
      <p>Welcome {this.state.name}!</p>
    );
  },

  renderErrorMessage: function() {
    return (
      <p>{this.state.errors.join(', ')}</p>
    );
  },


  render: function() {

    return (
      <Panel header='Login' bsStyle='info'>
        <form>
          <Input type='text'
                name='loginId'
                label='Login ID'
                placeholder='Enter login...'
                disabled={this.state.signedIn}
                value={this.state.loginId}
                onChange={this.handleInputChange} />

          <Button className='btn btn-primary'
                  onClick={this.handleSignInClick}
                  disabled={this.state.signedIn}>
            Log In
          </Button>
        </form>

      </Panel>
    );
  }
});
