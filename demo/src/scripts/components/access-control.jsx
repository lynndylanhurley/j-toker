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
      isModalOpen: false,
      errors: null
    }
  },

  handleSingleRequestClick: function(ev) {
    var url = Auth.getApiUrl() + $(ev.target).data('url');

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

  handleMultiRequestClick: function(ev) {
    var url = Auth.getApiUrl() + $(ev.target).data('url');

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
    var groupBtnClass,
        groupHeader,
        groupMsg,
        userBtnClass,
        userHeader,
        userMsg,
        evilUserBtnClass,
        evilUserHeader,
        evilUserMsg;


    if (this.props.signedIn) {
      groupBtnClass = 'success';
      groupHeader   = 'You are signed in using the '+this.props.configName+' configuration.';
      groupMsg      = 'These requests should be successful.';

      if (this.props.configName === 'default') {
        userBtnClass     = 'success';
        userMsg          = 'These requests should be successful.';
        evilUserBtnClass = 'danger';
        evilUserMsg      = 'These requests should fail.';
      } else {
        userBtnClass     = 'danger';
        userMsg          = 'These requests should fail.';
        evilUserBtnClass = 'success';
        evilUserMsg      = 'These requests should be successful.';
      }

    } else {
      groupBtnClass    = 'danger';
      groupHeader      = 'You are not signed in.';
      groupMsg         = 'These requests should fail.';
      userBtnClass     = 'danger';
      userMsg          = 'These requests should fail.';
      evilUserBtnClass = 'danger';
      evilUserMsg      = 'These requests should fail.';
    }

    var sourceLink = <a href='https://github.com/lynndylanhurley/j-toker/blob/master/demo/src/scripts/components/access-control.jsx' target='blank'>View component source</a>;

    return (
      <Panel header='Access Control' bsStyle={groupBtnClass} footer={sourceLink}>
        <h4>{groupHeader}</h4>
        <Panel>
          <p>{groupMsg}</p>
          <Button bsStyle={groupBtnClass}
                  data-url='/demo/members_only_group'
                  onClick={this.handleSingleRequestClick}>
            Single Request for All Users
          </Button>

          &nbsp;

          <Button bsStyle={groupBtnClass}
                  data-url='/demo/members_only_group'
                  onClick={this.handleMultiRequestClick}>
            Batch Request for All Users
          </Button>
        </Panel>

        <Panel>
          <p>{userMsg}</p>

          <Button bsStyle={userBtnClass}
                  data-url='/demo/members_only'
                  onClick={this.handleSingleRequestClick}>
            Single Request To User Route
          </Button>

          &nbsp;

          <Button bsStyle={userBtnClass}
                  data-url='/demo/members_only'
                  onClick={this.handleMultiRequestClick}>
            Batch Request To User Route
          </Button>
        </Panel>

        <Panel>
          <p>{evilUserMsg}</p>

          <Button bsStyle={evilUserBtnClass}
                  data-url='/demo/members_only_mang'
                  onClick={this.handleSingleRequestClick}>
            Single Request To Evil User Route
          </Button>

          &nbsp;

          <Button bsStyle={evilUserBtnClass}
                  data-url='/demo/members_only_mang'
                  onClick={this.handleMultiRequestClick}>
            Batch Request To Evil User Route
          </Button>
        </Panel>

        <label>Example</label>
        <Highlight className='javascript'>
          $.getJSON('/api/secret-data');
        </Highlight>
      </Panel>
    );
  }
});
