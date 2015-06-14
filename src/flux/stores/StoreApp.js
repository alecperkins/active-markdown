import { Store } from 'flummox'

var React = require('react')

export default class StoreApp extends Store {
  constructor({ actionsApp }) {
    super()
    this.register(actionsApp.setState, this.handleSetState)
    
    //initial state
    this.state = {}
  }

  handleSetState(state) {
    this.setState(state)
  }

}
