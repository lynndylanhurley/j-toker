var $         = require('jquery'),
    React     = require('react'),
    LoginForm = require('./components/login-form.jsx');

React.render(
  <LoginForm />,
  document.getElementById('content')
);
