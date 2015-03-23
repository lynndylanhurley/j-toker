var React              = require('react'),
    BS                 = require('react-bootstrap'),
    Input              = BS.Input,
    Button             = BS.Button,
    Panel              = BS.Panel,
    ResponseModalMixin = require('../mixins/response-modal.jsx'),
    Highlight          = require('react-highlight'),
    Auth               = require('../../../../src/j-toker.js');

module.exports = React.createClass({
  mixins: [ResponseModalMixin],

  propTypes: function() {
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
      errors: null,
      isModalOpen: false
    }
  },

  handleDestroyClick: function() {
    Auth.destroyAccount()
      .then(function() {
        this.setState({
          errors: false,
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

  successModalTitle: 'Account Destruction Success',
  errorModalTitle: 'Account Destruction Error',

  renderSuccessMessage: function() {
    return (
      <p>Your account has been destroyed!</p>
    );
  },

  renderErrorMessage: function() {
    return (
      <p>
        There was an error destroying your account:
        {this.state.errors.join(' ')}
      </p>
    );
  },

  render: function() {

    var sourceLink = <a href='https://github.com/lynndylanhurley/j-toker/blob/master/demo/src/scripts/components/destroy-account.jsx' target='blank'>View component source</a>;

    return (
      <Panel header='Destroy Account' bsStyle='danger' footer={sourceLink}>
        <Button onClick={this.handleDestroyClick}
                disabled={!this.props.signedIn}
                bsStyle='danger'>
          Destroy Account
        </Button>

        <br />
        <br />
        <label>Example</label>
        <Highlight className='javascript'>
          $.auth.destroyAccount();
        </Highlight>
      </Panel>
    );
  }
});
