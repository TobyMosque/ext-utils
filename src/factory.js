const vuex = require('vuex')
const storeUtils = require('./store')
const uuid = require('./uuid')
const { mapActions } = vuex
const { mapState, mapStoreMutations, mapStoreCollections } = storeUtils

/**
 * The complete Triforce, or one or more components of the Triforce.
 * @typedef {Object} ComponentFactory
 * @param {Function} render - callback function that is called everytime the component is rendered: render ({ self, options }) { }
 * @param {Function} setup - callback function that is called when the component is ready to be returned: setup({ component }) { }
 */

 /**
 * The complete Triforce, or one or more components of the Triforce.
 * @typedef {Object} CollectionItem
 * @property {String} single - the single form of the collection (item, person, job)
 * @property {String} plural - the plural form of the collection (list, people, jobs), would be the same as in the state
 * @property {String} id - the name of the id field of the object in the collection
 */

/**
 * wrapper a component and allow them to be modified at the render time, or even setup your properties, slots, etc.
 * @param {Object} param
 * @param {String} param.name - component's name
 * @param {Object} param.component - component to be wrapped
 * @param {Function} param.render - callback function that is called everytime the component is rendered: render ({ self, options }) { }
 * @param {Function} param.setup - callback function that is called when the component is ready to be returned: setup({ component }) { }
 * @param {Function} [param.createElement=function (h, component, options) {
     return h(component, options)
   }]
 * @param {ComponentFactory[]} param.factories - array of objects with a render and/or setup field
 */
const component = function ({ name, component, render, setup, createElement, factories }) {
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
      return root[key].apply(root, args)
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

  if (!createElement) {
    createElement = function (h, component, options) {
      return h(component, options)
    }
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
        render({ self, options })
      }
      return createElement(h, component, options)
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
      let __merged = merged
      merged = function () {
        return JSON.parse(JSON.stringify(__merged))
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
  store.state[field] = 0
  if (isFunc) {
    let obj = store.state
    store.state = function () {
      return { ...obj }
    }
  }
}

const validationField = '@@'
/**
 * factory.store combines store.mapStoreMutations and store.mapStoreCollections.
 * @param {Object} param - the page properties (`created`, `computed`, `etc`)
 * @param {Object} param.options - options used to generate the page
 * @param {Object} param.options.model - class used to model the mutations object
 * @param {CollectionItem[]} param.options.collections - an array of objects that describes your collection
 * @param {String} param.state - module's state, that will be merged intro the final module
 * @param {String} param.mutations - module's mutations, that will be merged intro the final module
 * @param {String} param.actions - module's actions, that will be merged intro the final module
 * @param {String} param.getters - module's getters, that will be merged intro the final module
 */
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

/**
 * factory.page will expect the same options as factory.store and will map the state, mutations, actions and getters generated by factory.store to the page.
 * @param {Object} param - the page properties (`created`, `computed`, `etc`)
 * @param {Object} param.options - options used to generate the page
 * @param {Object} param.options.model - class used to model the mutations object
 * @param {CollectionItem[]} param.options.collections - an array of objects that describes your collection
 * @param {Object} param.storeModule - if not null, it'll be registered in the preFetch or in the created hook, and removed in the destroyed hook.
 * @param {String} param.moduleName - the prefix of the private fields used by the getters and setters
 */
const page = function ({ options, storeModule, moduleName, ...page }) {
  let { preFetch, created, destroyed } = page

  const checkModule = function ({ store, success, failure }) {
    if (storeModule.mutations[validationField]) {
      try {
        let comb = uuid.comb()
        store.commit(`${moduleName}/${validationField}`, comb)
        let value = (store.state[moduleName] || {})[validationField]
        if (value === comb) {
          if (success) success()
        } else {
          if (failure) failure()
        }
      } catch (err) {
        if (failure) failure()
      }
    }
  }

  if (storeModule) {
    page.preFetch = function (context) {
      let self = this
      let { store, currentRoute, previousRoute, redirect } = context
      checkModule({
        store,
        success () {
          store.unregisterModule(moduleName)
        }
      })
      store.registerModule(moduleName, storeModule)
      return store.dispatch(`${moduleName}/initialize`, {
        route: currentRoute,
        from: previousRoute,
        next: redirect
      }).then(function () {
        if (preFetch) {
          return preFetch.apply(self, [ context ])
        }
      })
    }
  
    page.created = function () {
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
      if (created) {
        created.apply(self, [])
      }
    }
  
    page.destroyed = function () {
      let self = this
      if (destroyed) {
        destroyed.apply(self, [])
      }
      checkModule({
        store: this.$store,
        success () {
          self.$store.unregisterModule(moduleName)
        }
      })
    }
  }

  if (options && options.model) {
    let keys = Object.keys(new options.model())
    page.computed = {
      ...page.computed,
      ...mapState(moduleName, keys)
    }
  }

  if (options && options.collections) {
    let actions = []
    let getters = {}
    for (let collection of options.collections) {
      let single = getCases(collection.single)
      let plural = getCases(collection.plural)
      actions.push(`saveOrUpdate${single.pascal}`)
      actions.push(`delete${single.pascal}`)
      getters[`${plural.camel}Index`] = function () {
        let getter = this.$store.getters[`${moduleName}/${plural.camel}Index`]
        if (getter) {
          return getter
        } else {
          let state = this.$store.state[moduleName]
          return storeModule.getters[`${plural.camel}Index`](state, this)
        }
      }
      getters[`${single.camel}ById`] = function () {
        let getter = this.$store.getters[`${moduleName}/${single.camel}ById`]
        if (getter) {
          return getter
        } else {
          let state = this.$store.state[moduleName]
          return storeModule.getters[`${single.camel}ById`](state, this)
        }
      }
    }
    page.computed = {
      ...page.computed,
      ...getters
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
