import { Flummox } from 'flummox'
import ActionsApp from './actions/ActionsApp'
import StoreApp from './stores/StoreApp'

export default class FluxApp extends Flummox {
  constructor() {
    super()

    const actionsApp = this.createActions('app', ActionsApp)
    this.createStore('app', StoreApp, { actionsApp })
  }
}

export const FluxAppSingleton = new FluxApp()
