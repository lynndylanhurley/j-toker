var React              = require('react'),
    BS                 = require('react-bootstrap'),
    Button             = BS.Button,
    Modal              = BS.Modal,
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
      isModalOpen: false,
      errors: null
    }
  },

  handleSignOutClick: function(ev) {
    Auth.signOut()
      .then(function(resp) {
        this.setState({
          errors: null,
          isModalOpen: true
        })
      }.bind(this))
      .fail(function(resp) {
        this.setState({
          errors: resp.data.errors,
          isModalOpen: true
        })
      }.bind(this));
  },

  successModalTitle: 'Sign Out Success',
  errorModalTitle: 'Sign Out Error',

  renderSuccessMessage: function() {
    return (
      <p>Goodbye!</p>
    );
  },

  renderErrorMessage: function() {
    return (
      <p>There was an error: {this.state.errors.join(', ')}</p>
    );
  },

  render: function() {
    var sourceLink = <a href='https://github.com/lynndylanhurley/j-toker/blob/master/demo/src/scripts/components/signout-form.jsx' target='blank'>View component source</a>;

    return (
      <Panel header='Sign Out' bsStyle='info' footer={sourceLink}>
        <Button className='btn btn-primary'
                onClick={this.handleSignOutClick}
                disabled={!this.props.signedIn}>
          Sign Out
        </Button>

        <br />
        <br />
        <label>Example</label>
        <Highlight className='javascript'>
          $.auth.signOut();
        </Highlight>
      </Panel>
    )
  }
});
