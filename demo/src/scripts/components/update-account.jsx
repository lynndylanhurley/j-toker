var React              = require('react'),
    BS                 = require('react-bootstrap'),
    Input              = BS.Input,
    Button             = BS.Button,
    Panel              = BS.Panel,
    ResponseModalMixin = require('../mixins/response-modal.jsx'),
    FormStateMixin     = require('../mixins/form-state.jsx'),
    Auth               = require('../../../../src/j-toker.js'),
    _                  = require('lodash'),
    Highlight          = require('react-highlight'),
    PubSub             = require('pubsub-js');

module.exports = React.createClass({
  mixins: [
    ResponseModalMixin,
    FormStateMixin
  ],

  componentWillMount: function() {
    PubSub.subscribe('auth', function() {
      this.setState({
        nickname:       Auth.user.nickname || '',
        favorite_color: Auth.user.favorite_color || '',
        signedIn:       Auth.user.signedIn
      });
    }.bind(this));
  },

  getInitialState: function() {
    return {
      errors:         null,
      isModalOpen:    false,
      name:           Auth.user.name,
      nickname:       Auth.user.nickname,
      favorite_color: Auth.user.favorite_color
    }
  },

  handleUpdateClick: function() {
    Auth.updateAccount({
      nickname:       this.state.nickname,
      favorite_color: this.state.favorite_color
    })
      .then(function(user) {
        this.setState({
          errors:      false,
          isModalOpen: true
        });
      }.bind(this))

      .fail(function(resp) {
        this.setState({
          errors:      resp.data.errors,
          isModalOpen: true
        });
      }.bind(this));
  },

  successModalTitle: 'Account Update Success',
  errorModalTitle: 'Account Update Error',

  renderSuccessMessage: function() {
    return (
      <p>Your account has been updated!</p>
    );
  },

  renderErrorMessage: function() {
    return (
      <p>
        There was an error updating your account:
        {this.state.errors.join(' ')}
      </p>
    );
  },

  render: function() {
    var sourceLink = <a href='https://github.com/lynndylanhurley/j-toker/blob/master/demo/src/scripts/components/update-account.jsx' target='blank'>View component source</a>;

    return (
      <Panel header='Update Account' bsStyle='info' footer={sourceLink}>
        <form>
           <Input type='text'
                  name='nickname'
                  label='Nickname'
                  placeholder='Enter your nickname...'
                  disabled={!this.state.signedIn}
                  value={this.state.nickname}
                  onChange={this.handleInputChange} />

          <Input type='text'
                 name='favorite_color'
                 label='Favorite Color'
                 placeholder='Enter your favorite color...'
                 disabled={!this.state.signedIn}
                 value={this.state.favorite_color}
                 onChange={this.handleInputChange} />

          <Button className='btn btn-primary'
                  disabled={!this.state.signedIn}
                  onClick={this.handleUpdateClick}>
            Update Account
          </Button>
        </form>

        <br />
        <label>Example</label>
        <Highlight className='javascript'>
          $.auth.updateAccount({'{'}<br />
            &nbsp;&nbsp;nickname: 'xxx',<br />
            &nbsp;&nbsp;favorite_color: 'yyy'<br />
          {'}'});
        </Highlight>
      </Panel>
    );
  }
});
