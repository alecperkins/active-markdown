var React = require('react')
var Router = require('react-router')
var routes = require('./routes.jsx')

//require('./css/.css')

Router.run(routes, function (Handler) {
	React.render(React.createElement(Handler), document.getElementById('app'))
})
