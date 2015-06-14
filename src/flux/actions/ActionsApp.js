require("babel-core/polyfill")
import { Actions } from 'flummox'

export default class ActionsApp extends Actions {
  setState(state) {
    return state
  }
 
}
