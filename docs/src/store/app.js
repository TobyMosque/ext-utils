import { factory } from '@toby.mosque/utils'

class VaultStoreModel {
  constructor ({
    dark = true,
    localeOs = '',
    localeUser = ''
  } = {}) {
    this.dark = dark
    this.localeOs = localeOs
    this.localeUser = localeUser
  }
}

const options = {
  model: VaultStoreModel
}

export default factory.store({
  options
})

export { options, VaultStoreModel }
