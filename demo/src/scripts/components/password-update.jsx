var React              = require('react'),
    BS                 = require('react-bootstrap'),
    Input              = BS.Input,
    Button             = BS.Button,
    Panel              = BS.Panel,
    ResponseModalMixin = require('../mixins/response-modal.jsx'),
    FormStateMixin     = require('../mixins/form-state.jsx'),
    Highlight          = require('react-highlight'),
    Auth               = require('../../../../src/j-toker.js');

module.exports = React.createClass({
  mixins: [
    ResponseModalMixin,
    FormStateMixin
  ],

  propTypes: function() {
    return {
      signedIn: React.PropTypes.bool,
      provider: React.PropTypes.string
    };
  },

  getDefaultProps: function() {
    return {
      signedIn: false,
      provider: ''
    };
  },

  getInitialState: function() {
    return {
      errors:                null,
      isModalOpen:           false,
      password:              Auth.user.password,
      password_confirmation: Auth.user.password_confirmation,
    }
  },

  handleUpdateClick: function() {
    Auth.updatePassword({
      password:              this.state.password,
      password_confirmation: this.state.password_confirmation
    })
      .then(function(user) {
        this.setState({
          errors:                false,
          isModalOpen:           true,
          password:              '',
          password_confirmation: ''
        });
      }.bind(this))

      .fail(function(resp) {
        this.setState({
          errors:      resp.data.errors,
          isModalOpen: true
        });
      }.bind(this));
  },

  isDisabled: function() {
    return (!this.props.signedIn || this.props.provider !== 'email');
  },

  successModalTitle: 'Password Update Success',
  errorModalTitle: 'Password Update Error',

  renderSuccessMessage: function() {
    return (
      <p>Your password has been updated!</p>
    );
  },

  renderErrorMessage: function() {
    return (
      <p>
        There was an error updating your password: &nbsp;
        {this.state.errors.full_messages.join('. ')}
      </p>
    );
  },

  render: function() {

    var sourceLink = <a href='https://github.com/lynndylanhurley/j-toker/blob/master/demo/src/scripts/components/password-update.jsx' target='blank'>View component source</a>;

    return (
      <Panel header='Change Password' bsStyle='info' footer={sourceLink}>
        <form>
           <Input type='password'
                  name='password'
                  label='Password'
                  placeholder='Enter your password...'
                  disabled={this.isDisabled()}
                  value={this.state.password}
                  onChange={this.handleInputChange} />

          <Input type='password'
                 name='password_confirmation'
                 label='Password Confirmation'
                 placeholder='Enter your password again...'
                 disabled={this.isDisabled()}
                 value={this.state.password_confirmation}
                 onChange={this.handleInputChange} />

          <Button className='btn btn-primary'
                  disabled={this.isDisabled()}
                  onClick={this.handleUpdateClick}>
            Update Password
          </Button>
        </form>

        <br />
        <label>Example</label>
        <Highlight className='javascript'>
          $.auth.updatePassword({'{'}<br />
            &nbsp;&nbsp;password: 'xxx',<br />
            &nbsp;&nbsp;password_confirmation: 'xxx'<br />
          {'}'});
        </Highlight>
      </Panel>
    );
  }
});

