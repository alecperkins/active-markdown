var React = require('react')
var { Route, DefaultRoute, RouteHandler, Navigation } = require('react-router')

import FluxComponent from 'flummox/component'
import { FluxAppSingleton } from './flux/FluxApp'

var ActiveMarkdown = require('../source/ActiveMarkdown')
console.log('ActiveMarkdown', ActiveMarkdown)

require('../source/browser')
console.log('window.ActiveMarkdown', window.ActiveMarkdown)

var App = React.createClass({
  render: function(){
    return (
      <FluxComponent flux={FluxAppSingleton} connectToStores={['app']}>
        <AppView {...this.props}/>
      </FluxComponent>
    )
  }
})

var AppView = React.createClass({
  triggerMakeActive: function() {
    var file = "data:text/html;charset=utf-8," + escape(this.props.inputText)
    window.ActiveMarkdown.makeActive({"collapsed_code":false,"debug":false,"filename": file})
  }
, componentDidMount: function () {
    this.triggerMakeActive()
  }
, componentDidUpdate: function(_p, _s) {
    this.triggerMakeActive()
  }
, onChangeCb: function(e) {
    this.props.flux.getActions('app').setState( {inputText: e.target.value} )
  }
, render: function(){
    return (
      <div>
        <textarea rows="20" cols="80"
                  value={this.props.inputText}
                  onChange={this.onChangeCb}
                  />
        <div key={this.props.inputText} dangerouslySetInnerHTML={ { __html: ActiveMarkdown.parse(this.props.inputText) } } />
        
        <RouteHandler/>
      </div>
    )
  }
})


    //<DefaultRoute name="" handler={}/>
var routes = (
  <Route name="app" path="/" handler={App}>
  </Route>
)

module.exports = routes
