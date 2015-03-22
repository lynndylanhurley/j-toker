var React              = require('react'),
    $                  = require('jquery'),
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

  getInitialProps: function() {
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

  handleSingleRequestClick: function(ev) {
    var url = Auth.getConfig().apiUrl + '/demo/members_only';

    $.getJSON(url)
      .then(function(resp) {
        this.setState({
          errors: null,
          isModalOpen: true
        })
      }.bind(this))
      .fail(function(resp) {
        this.setState({
          errors: ['Single request failed.'],
          isModalOpen: true
        })
      }.bind(this));
  },

  handleMultiRequestClick: function() {
    var url = Auth.getConfig().apiUrl + '/demo/members_only';

    $.when(
      $.getJSON(url),
      $.getJSON(url)
    )
    .then(function() {
      this.setState({
        errors: null,
        isModalOpen: true
      })
    }.bind(this), function() {
      this.setState({
        errors: ['Batch requests failed.'],
        isModalOpen: true
      });
    }.bind(this));
  },

  successModalTitle: 'Request Success',
  errorModalTitle: 'Request Failure',

  renderSuccessMessage: function() {
    return (
      <div>
        <p>Request(s) Succeeded!</p>
        <p>Check network tab of your browser's web inspector for proof.</p>
      </div>
    );
  },

  renderErrorMessage: function() {
    return (
      <div>
        <p>{this.state.errors.join(' ')}</p>
        <p>Check network tab of your browser's web inspector for proof.</p>
      </div>
    );
  },

  render: function() {
    var btnClass, header, msg;

    if (this.props.signedIn) {
      btnClass = 'success';
      header   = 'You are signed in.';
      msg      = 'These requests should be successful.';
    } else {
      btnClass = 'danger';
      header   = 'You are not signed in.';
      msg      = 'These requests should fail.';
    }

    return (
      <Panel header='Access Control' bsStyle={btnClass}>
        <h4>{header}</h4>
        <p>{msg}</p>

        <Button bsStyle={btnClass}
                onClick={this.handleSingleRequestClick}>
          Single Request
        </Button>

        &nbsp;

        <Button bsStyle={btnClass}
                onClick={this.handleMultiRequestClick}>
          Batch Request
        </Button>

        <br />
        <br />
        <label>Example</label>
        <Highlight className='javascript'>
          $.getJSON('/api/members-only');
        </Highlight>
      </Panel>
    );
  }
});
