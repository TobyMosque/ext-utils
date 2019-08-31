const vueModule = require('vue')
const Vue = vueModule.set ? vueModule : vueModule.default

const mapState = function (module, properties) {
  var props = {}
  if (Array.isArray(properties)) {
    properties.forEach(property => {
      props[property] = {
        get () {
          return this.$store.state[module][property]
        },
        set (value) {
          this.$store.commit(`${module}/${property}`, value)
        }
      }
    })
  } else {
    Object.keys(properties).forEach(key => {
      var property = properties[key]
      props[key] = {
        get () { return this.$store.state[module][property] },
        set (value) { this.$store.commit(`${module}/${property}`, value) }
      }
    })
  }
  return props
}

const mapGetters = function (module, properties) {
  var props = {}
  if (Array.isArray(properties)) {
    properties.forEach(property => {
      props[property] = {
        get () {
          return this.$store.getters[`${module}/${property}`]
        },
        set (value) {
          this.$store.commit(`${module}/${property}`, value)
        }
      }
    })
  } else {
    Object.keys(properties).forEach(key => {
      var property = properties[key]
      props[key] = {
        get () { return this.$store.getters[`${module}/${property}`] },
        set (value) { this.$store.commit(`${module}/${property}`, value) }
      }
    })
  }
  return props
}

const getCases = function (text) {
  let cases = {}
  cases.lower = text.toLowerCase()
  cases.camel = cases.lower.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
  cases.pascal = cases.camel[0].toUpperCase() + cases.camel.substr(1)
  return cases
}

const mapStoreMutations = function (Model) {
  const keys = Object.keys(new Model())
  const mutations = keys.reduce((mutations, key) => {
    mutations[key] = function (state, value) {
      Vue.set(state, key, value)
    }
    return mutations
  }, {})
  return mutations
}

const mapStoreCollections = function (collections) {
  let mutations = {}
  let actions = {}
  let getters = {}
  for (let collection of collections) {
    let single = getCases(collection.single)
    let plural = getCases(collection.plural)

    mutations[`create${single.pascal}`] = function (state, item) {
      state[collection.plural].push(item)
    }
    mutations[`update${single.pascal}`] = function (state, { index, item }) {
      Vue.set(state[collection.plural], index, item)
    }
    mutations[`delete${single.pascal}`] = function (state, index) {
      Vue.delete(state[collection.plural], index)
    }

    actions[`saveOrUpdate${single.pascal}`] = function ({ commit, getters }, item) {
      let index = getters[`${plural.camel}Index`].get(item[collection.id])
      if (index !== void 0) {
        commit(`update${single.pascal}`, { index, item })
      } else {
        commit(`create${single.pascal}`, item)
      }
    }
    actions[`delete${single.pascal}`] = function ({ commit, getters }, id) { 
      let index = getters[`${plural.camel}Index`].get(id)
      if (index !== void 0) {
        commit(`delete${single.pascal}`, index)
      }
    }

    getters[`${plural.camel}Index`] = function (state) {
      let _collection = state[collection.plural] || []
      return _collection.reduce((map, item, indice) => {
        map.set(item[collection.id], indice)
        return map
      }, new Map())
    }
    getters[`${single.camel}ById`] = function (state, getters) {
      return (id) => {
        let index = getters[`${plural.camel}Index`].get(id)
        return index !== void 0 ? state[collection.plural][index] : null
      }
    }
  }
  
  return {
    mutations,
    actions,
    getters
  }
}

module.exports = {
  mapState,
  mapGetters,
  mapStoreMutations,
  mapStoreCollections
}