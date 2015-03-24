var React              = require('react'),
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
      errors: null
    };
  },

  handleInputChange: function(ev) {
    var nextState = _.cloneDeep(this.state);
    nextState[ev.target.name] = ev.target.value;
    this.setState(nextState);
  },

  handleSignInClick: function(ev) {
    Auth.emailSignIn({
      email:    this.state.email,
      password: this.state.password,
      config:   this.props.config
    })

      .then(function(resp) {
        this.setState({
          email: '',
          password: '',
          errors: null,
          isModalOpen: true
        });
      }.bind(this))

      .fail(function(resp) {
        this.setState({
          errors: resp.data.errors,
          isModalOpen: true
        });
      }.bind(this));
  },

  successModalTitle: 'Email Sign In Success',
  errorModalTitle: 'Email Sign In Error',

  renderSuccessMessage: function() {
    return (
      <p>Welcome {Auth.user.email}!</p>
    );
  },

  renderErrorMessage: function() {
    return (
      <p>There was an error: {this.state.errors.join(', ')}</p>
    );
  },


  render: function() {
    var configParam = <span></span>;

    if (this.props.config !== 'default') {
      configParam = <span>&nbsp;&nbsp;config: '{this.props.config}',<br /></span>;
    }

    var sourceLink = <a href='https://github.com/lynndylanhurley/j-toker/blob/master/demo/src/scripts/components/login-form.jsx' target='blank'>View component source</a>;

    return (
      <Panel header='Email Sign In' bsStyle='info' footer={sourceLink}>
        <form>
          <Input type='email'
                name='email'
                label='Email'
                placeholder='Enter email...'
                disabled={this.props.signedIn}
                value={this.state.email}
                onChange={this.handleInputChange} />

          <Input type='password'
                name='password'
                label='Password'
                placeholder='Enter password...'
                disabled={this.props.signedIn}
                value={this.state.password}
                onChange={this.handleInputChange} />

          <Button className='btn btn-primary'
                  onClick={this.handleSignInClick}
                  disabled={this.props.signedIn}>
            Sign In
          </Button>
        </form>

        <br />
        <label>Example</label>
        <Highlight className='javascript'>
          $.auth.emailSignIn({'{'}<br />
            {configParam}
            &nbsp;&nbsp;email: 'xxx',<br />
            &nbsp;&nbsp;password: 'yyy'<br />
          {'}'});
        </Highlight>

      </Panel>
    );
  }
});
