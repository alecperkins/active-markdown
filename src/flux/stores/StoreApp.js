import { Store } from 'flummox'

var React = require('react')

export default class StoreApp extends Store {
  constructor({ actionsApp }) {
    super()
    this.register(actionsApp.setState, this.handleSetState)
    
var inputText = '# kukac.\n\
> As [we]{travelers: we or I} [was]{verb} going to []{random}\n\
> Every wife had [7 sacks]{sacks: 1..10}\n\
\
> []{init}\n\
\n\
    if @init isnt \'\'\n\
        @random = Math.random()\n\
        @init = \'\'\n\
\n\
    if @travelers\n\
        narrator = 2\n\
        @verb = \'were\'\n\
    else\n\
        narrator = 1\n\
        @verb = \'was\'\n\
'

    //initial state
    this.state = {
      inputText: inputText
    }
  }

  handleSetState(state) {
    this.setState(state)
  }

}
