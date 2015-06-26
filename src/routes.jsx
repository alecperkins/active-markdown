var React = require('react')
var { Route, DefaultRoute, RouteHandler, Navigation } = require('react-router')

import FluxComponent from 'flummox/component'
import { FluxAppSingleton } from './flux/FluxApp'

require('../source/browser')()

var Ace = require ('brace')
require('brace/mode/markdown')

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
, onChangeCb: function(val) {
    this.props.flux.getActions('app').setState( {inputText: val} )
  }
, render: function(){
    return (
      <div>
        <div style={{position: 'relative'}}>
          <Editor onChange={this.onChangeCb}
                  value={this.props.inputText}
                  mode='markdown'
                  idName='markdown-editor'
                  />

          <textarea rows='3'
                    style={{position: 'absolute', right: '0', bottom: '0', width: '100%', textAlign: 'right', backgroundColor: 'transparent', color: 'red', border: 'none'}}
                    disabled={true}
                    id='_compile_error_msg'
                    />
        </div>

        
          <div key={this.props.inputText} dangerouslySetInnerHTML={ { __html: window.ActiveMarkdown.parse(this.props.inputText) } } />

        <RouteHandler/>
      </div>
    )
  }
})

var Editor = React.createClass({
  componentDidMount: function () {
    var editor = ace.edit(this.props.idName)
    editor.getSession().setMode('ace/mode/' +this.props.mode)
    if (this.props.theme) editor.setTheme('ace/theme/' +this.props.theme)
    editor.setWrapBehavioursEnabled(true)
    editor.getSession().setUseSoftTabs(true)
    editor.setOptions({ maxLines: Infinity})
    editor.$blockScrolling = Infinity
    editor.getSession().setUseWrapMode(true)

    document.getElementById(this.props.idName).env.document.setValue(this.props.value)
    editor.on("change", this.jsEditorOnChange)
  }
, jsEditorOnChange: function (e){
    var v = document.getElementById(this.props.idName).env.document.getValue()
    //text = editor.getSession().getValue()
    this.props.onChange(v)
  }
, render: function (){
    var self = this
    var style = {
      'position': 'relative'
    , 'height': self.props.height || '200px'
    }
    if (self.props.width) style.width = self.props.width
    
    return (
      <div>
        <div id={this.props.idName} style={style} />
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
