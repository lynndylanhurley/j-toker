var React              = require('react'),
    $                  = require('jquery'),
    BS                 = require('react-bootstrap'),
    Input              = BS.Input,
    Button             = BS.Button,
    Panel              = BS.Panel,
    ButtonGroup        = BS.ButtonGroup,
    ResponseModalMixin = require('../mixins/response-modal.jsx'),
    FormStateMixin     = require('../mixins/form-state.jsx'),
    Highlight          = require('react-highlight'),
    Auth               = require('../../../../src/j-toker.js');

module.exports = React.createClass({
  mixins: [
    ResponseModalMixin,
    FormStateMixin
  ],

  propType: function() {
    return {
      signedIn: React.PropTypes.bool
    }
  },

  getDefaultProps: function() {
    return {
      signedIn: false
    }
  },

  getInitialState: function() {
    return {
      isModalOpen: false,
      errors: null,
      favorite_color: ''
    };
  },

  handleAuthClick: function(ev) {
    var provider = $(ev.target).data('provider');
    Auth.oAuthSignIn({
      provider: provider,
      params: {
        favorite_color: this.state.favorite_color
      }
    })
      .then(function(user) {
        this.setState({
          errors: null,
          isModalOpen: true,
          favorite_color: ''
        });
      }.bind(this))

      .fail(function(resp) {
        this.setState({
          errors: resp.data.errors,
          isModalOpen: true
        })
      }.bind(this));
  },

  successModalTitle: 'OAuth Sign In Success',
  errorModalTitle: 'OAuth Sign In Error',

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
    return(
      <Panel header='OAuth Sign In' bsStyle='info'>
        <Input type='text'
               name='favorite_color'
               label='Favorite Color'
               placeholder='Enter your favorite color...'
               disabled={this.props.signedIn}
               value={this.state.favorite_color}
               onChange={this.handleInputChange} />

        <label>Select Provider</label>
        <br />
        <ButtonGroup>
          <Button onClick={this.handleAuthClick}
                  disabled={this.props.signedIn}
                  bsStyle='default'
                  data-provider='github'>
            Github
          </Button>

          <Button onClick={this.handleAuthClick}
                  disabled={this.props.signedIn}
                  bsStyle='primary'
                  data-provider='facebook'>
            Facebook
          </Button>

          <Button onClick={this.handleAuthClick}
                  disabled={this.props.signedIn}
                  bsStyle='warning'
                  data-provider='google'>
            Google
          </Button>
        </ButtonGroup>

        <br />
        <br />
        <label>Example</label>
        <Highlight className='javascript'>
          $.auth.oAuthSignIn({'{'}<br />
          &nbsp;&nbsp;provider: 'github',<br />
          &nbsp;&nbsp;params: {'{'}<br />
          &nbsp;&nbsp;&nbsp;&nbsp;favorite_color: 'purple'<br />
          &nbsp;&nbsp;{'}'}<br />
          {'}'});
        </Highlight>
      </Panel>

    );
  }
})
