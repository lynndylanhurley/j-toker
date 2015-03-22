var React = require('react'),
    _     = require('lodash');

module.exports = {
  handleInputChange: function(ev) {
    var nextState = _.cloneDeep(this.state);
    nextState[ev.target.name] = ev.target.value;
    this.setState(nextState);
  }
};
