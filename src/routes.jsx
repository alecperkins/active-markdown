var React = require('react')
var { Route, DefaultRoute, RouteHandler, Navigation } = require('react-router')

import FluxComponent from 'flummox/component'
import { FluxAppSingleton } from './flux/FluxApp'

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
  render: function(){
    var self = this
    
    var onChangeCb = function(e){
      self.props.flux.getActions('app').setState( {testInput: e.target.value} )
    }

    return (
      <div>
        this.props.testInput: {this.props.testInput}
        <br/>
        <input value={this.props.tesInput} onChange={onChangeCb}/>
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
