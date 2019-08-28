const vuex = require('vuex')
const storeUtils = require('./store')
const { mapActions, mapGetters } = vuex
const { mapState, mapStoreMutations, mapStoreCollections } = storeUtils

const component = function ({ name, component, render, setup, factories }) {
  const props = component.options.props
  const computed = {}
  if (props.value) {
    computed.__value = {
      get () { return this.value },
      set (value) { return this.$emit('input', value) }
    }
  }
  const methods = Object.keys(component.options.methods || {}).reduce((methods, key) => {
    methods[key] = function (...args) {
      let root = this.$refs.root
      root[key].apply(root, args)
    }
    return methods
  }, {})

  factories = factories || []
  const renders = factories.filter(item => item.render).map(item => item.render)
  if (render) {
    renders.push(render)
  }

  const setups = factories.filter(item => item.setup).map(item => item.setup)
  if (setup) {
    setups.push(setup)
  }

  let wrapper = {
    name: name,
    props: props,
    methods: methods,
    computed: computed,
    render (h) {
      let self = this
      let key = this.$vnode.key
      let options = {
        key: key,
        ref: 'root',
        scopedSlots: this.$scopedSlots,
        attrs: this.$attrs
      }
      if (props.value) {
        let { values, ...props } = this.$props
        let { input, ...listeners } = this.$listeners
        props.value = self.__value
        listeners.input = function (value) {
          self.__value = value
        }
        options.props = props
        options.on = listeners
      } else {
        let { ...props } = this.$props
        let { ...listeners } = this.$listeners
        options.props = props
        options.on = listeners
      }

      for (let render of renders) {
        render({ h, self, options })
      }
      return h(component, options)
    }
  }
  for (let setup of setups) {
    setup({ component: wrapper })
  }
  return wrapper
}

const getCases = function (text) {
  let cases = {}
  cases.lower = text.toLowerCase()
  cases.camel = cases.lower.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
  cases.pascal = cases.camel[0].toUpperCase() + cases.camel.substr(1)
  return cases
}

const merge = function ({ name, model, collections, user }) {
  let conditions = [
    model && model[name],
    collections && collections[name],
    !!user
  ].filter(condition => condition)

  if (conditions.length > 1) {
    let merged = {}
    let isFunc = false
    if (user) {
      isFunc = isFunc || user.call
      merged = user.call ? { ...merged, ...user() } : { ...merged, ...user }
    }
    if (model && model[name]) {
      isFunc = isFunc || model[name].call
      merged = model[name].call ? { ...merged, ...model[name]() } : { ...merged, ...model[name] }
    }
    if (collections && collections[name]) {
      isFunc = isFunc || collections[name].call
      merged = collections[name].call ? { ...merged, ...collections[name]() } : { ...merged, ...collections[name] }
    }
    if (isFunc) {
      __merged = merged
      merged = function () {
        return __merged
      }
    }
    return merged
  } else if (model && model[name]) {
    return model[name]
  } else if (collections && collections[name]) {
    return collections[name]
  } else {
    return user
  }
}

const preperValidation = function ({ store, field }) {
  store.mutations = store.mutations || {}
  store.mutations[field] = function (state, value) { state[field] = value }
  
  store.state = store.state || {}
  let isFunc = !!store.state.call
  if (isFunc) {
    store.state = store.state()
  }
  store.state['@@'] = 0
  if (isFunc) {
    let obj = store.state
    store.state = function () {
      return { ...obj }
    }
  }
}

const validationField = '@@'
const store = function ({ options, initialize, ...store }) {
  let model, collections
  if (options && options.model) {
    model = {
      state: function () {
        return new options.model()
      },
      mutations: mapStoreMutations(options.model)
    }
  }
  if (options && options.collections && options.collections.length > 0) {
    collections = mapStoreCollections(options.collections)
  }

  preperValidation({ store, field: validationField })
  store.namespaced = true
  store.state = merge({ name: 'state', model, collections, user: store.state })
  store.mutations = merge({ name: 'mutations', model, collections, user: store.mutations }) || {}
  store.actions = merge({ name: 'actions', model, collections, user: store.actions }) || {}
  store.getters = merge({ name: 'getters', model, collections, user: store.getters })
  if (initialize) {
    store.actions.initialize = initialize
  }
  return store
}



const page = function ({ options, storeModule, moduleName, ...page }) {
  let { preFetch, mounted, destroyed } = page

  const checkModule = function ({ store, success, failure }) {
    if (storeModule.mutations[validationField]) {
      try {
        store.commit(`${moduleName}/${validationField}`, 1)
        let value = (store.state[moduleName] || {})[validationField]
        if (value === 1) {
          if (success) success()
        } else {
          if (failure) failure()
        }
      } catch (err) {
        if (failure) failure()
      }
    }
  }

  page.preFetch = function (context) {
    let { store, currentRoute } = context
    checkModule({
      store,
      success () {
        store.unregisterModule(moduleName)
      }
    })
    store.registerModule(moduleName, storeModule)
    return store.dispatch(`${moduleName}/initialize`, { route: currentRoute }).then(function () {
      if (preFetch) {
        return preFetch(context)
      }
    })
  }

  page.mounted = function () {
    let alreadyInitialized  = !!this.$store.state[moduleName]
    let self = this
    checkModule({
      store: this.$store,
      failure () {
        self.$store.registerModule(moduleName, storeModule, { preserveState: true })
      }
    })
    if (!alreadyInitialized) {
      this.$store.dispatch(`${moduleName}/initialize`, { route: this.$route })
    }
    if (mounted) {
      mounted()
    }
  }

  page.destroyed = function () {
    let self = this
    checkModule({
      store,
      success () {
        self.$store.unregisterModule(moduleName)
      }
    })
    if (destroyed) {
      destroyed()
    }
  }

  if (options && options.model) {
    let keys = new options.model()
    page.computed = {
      ...page.computed,
      ...mapState(moduleName, Object.keys(keys))
    }
  }

  if (options && options.collections) {
    let actions = []
    let getters = []
    for (let collection of options.collections) {
      let single = getCases(collection.single)
      let plural = getCases(collection.plural)
      actions.push(`saveOrUpdate${single.pascal}`)
      actions.push(`delete${single.pascal}`)
      getters.push(`${plural.camel}Index`)
      getters.push(`${single.camel}ById`)
    }
    page.computed = {
      ...page.computed,
      ...mapGetters(moduleName, getters)
    }
    page.methods = {
      ...page.methods,
      ...mapActions(moduleName, actions)
    }
  }
  return page
}

module.exports = {
  component,
  store,
  page
}