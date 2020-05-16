import { factory } from '@toby.mosque/utils'

class MainLayoutModel {
  constructor ({
    leftDrawerOpen = false
  } = {}) {
    this.leftDrawerOpen = leftDrawerOpen
  }
}

const options = {
  model: MainLayoutModel
}

export default factory.store({
  options,
  actions: {
    async initialize ({ state }, { route, next }) {
    }
  }
})

export { options, MainLayoutModel }
