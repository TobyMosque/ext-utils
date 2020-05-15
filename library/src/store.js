import Vue from 'vue'
import { getCases } from './_common'

const defaultPrefixes = {
  upsertPrefix: 'saveOrUpdate',
  deletePrefix: 'delete'
}

const getCollectionPrefixes = function () {
  return defaultPrefixes
}

const setCollectionPrefixes = function ({ upsertPrefix, deletePrefix }) {
  defaultPrefixes.upsertPrefix = upsertPrefix || defaultPrefixes.upsertPrefix
  defaultPrefixes.deletePrefix = deletePrefix || defaultPrefixes.deletePrefix
}

/**
 * maps all fields to a computed-like object who getters access the state and the setters do mutations.
 * @param {String} module - the module name
 * @param {String[] | Object} fields - fields can be an array of strings or a object where the keys and values are strings. e.g:` ['text', 'number', 'list']` or `{ text: 'text', number: 'number', collection: 'list' }`
 * @returns {Object} 
 */
const mapState = function (module, fields) {
  var props = {}
  if (Array.isArray(fields)) {
    fields.forEach(property => {
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
    Object.keys(fields).forEach(key => {
      var property = fields[key]
      props[key] = {
        get () { return this.$store.state[module][property] },
        set (value) { this.$store.commit(`${module}/${property}`, value) }
      }
    })
  }
  return props
}

/**
 * maps all fields to a computed-like object who getters access the getters and the setters do mutations.
 * @param {String} module - the module name
 * @param {String[] | Object} fields - fields can be an array of strings or a object where the keys and values are strings. e.g:` ['text', 'number', 'list']` or `{ text: 'text', number: 'number', collection: 'list' }`
 * @returns {Object} 
 */
const mapGetters = function (module, fields) {
  let props = {}
  if (Array.isArray(fields)) {
    fields.forEach(property => {
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
    Object.keys(fields).forEach(key => {
      let property = fields[key]
      props[key] = {
        get () { return this.$store.getters[`${module}/${property}`] },
        set (value) { this.$store.commit(`${module}/${property}`, value) }
      }
    })
  }
  return props
}

/**
 * maps all classes fields to a mutations-like object.
 * @param {*} Model - class used to model the mutations object 
 * @returns {Object} a object with the mapped mutations
 */
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

/**
 * The complete Triforce, or one or more components of the Triforce.
 * @typedef {Object} CollectionItem
 * @property {String} single - the single form of the collection (item, person, job)
 * @property {String} plural - the plural form of the collection (list, people, jobs), would be the same as in the state
 * @property {String} id - the name of the id field of the object in the collection
 * @property {Object} type - the type of the objects in the array
 * @property {String} [upsertPrefix='saveOrUpdate'] - prefix of the save or update action
 * @property {String} [deletePrefix='delete'] - prefix of the delete action
 */

/**
 * Create `mutations` (create, update, delete, setters), `actions` (upsert, delete, setters) and `getters` (index, getById) related to array fields.
 * @param {CollectionItem[]} collections - an array of objects that describes your collection
 * @returns {Object} a object with the mapped mutations, actions and getters
 */
const mapStoreCollections = function (collections) {
  let mutations = {}
  let actions = {}
  let getters = {}
  let hasTypes = collections.some(collection => collection.type !== void 0)
  if (hasTypes) {
    mutations.setPropertyOfACollectionItem = function (state, { index, collection, property, value }) {
      Vue.set(state[collection][index], property, value)
    }
    actions.setPropertyOfACollectionItem = function ({ commit, getters }, { id, collection, property, value }) {
      const index = getters[collection + 'Index'].get(id)
      if (index !== undefined) {
        commit('setPropertyOfACollectionItem', { index, collection, property, value })
      }
    }
  }

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

    let upsertPrefix = collection.upsertPrefix || defaultPrefixes.upsertPrefix
    let deletePrefix = collection.deletePrefix || defaultPrefixes.deletePrefix
    actions[`${upsertPrefix}${single.pascal}`] = function ({ commit, getters }, item) {
      let index = getters[`${plural.camel}Index`].get(item[collection.id])
      if (index !== void 0) {
        commit(`update${single.pascal}`, { index, item })
      } else {
        commit(`create${single.pascal}`, item)
      }
    }
    actions[`${deletePrefix}${single.pascal}`] = function ({ commit, getters }, id) { 
      let index = getters[`${plural.camel}Index`].get(id)
      if (index !== void 0) {
        commit(`delete${single.pascal}`, index)
      }
    }

    if (collection.type !== void 0) {
      let properties = Object.keys(new collection.type())
      for (const property of properties) {
        const names = getCases(property)
        let conjunction = single.pascal.match(/^[aeiou].*/i) ? 'An' : 'A'
        actions[`set${names.pascal}Of${conjunction}${single.pascal}`] = function ({ dispatch }, { id, value }) {
          return dispatch('setPropertyOfACollectionItem', { id, collection: collection.plural, property, value })
        }
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

 /**
 * The complete Triforce, or one or more components of the Triforce.
 * @typedef {Object} ComplexType
 * @property {String} name - the name of the field
 * @property {Object} type - the type of the object
 */

/**
 * Create `mutations` (setters) related to complex fields.
 * @param {ComplexType[]} complexTypes - an array of objects that describes your collection
 * @returns {Object} a object with the mapped mutations
 */
const mapStoreComplexTypes = function (complexTypes) {
  let mutations = {}
  for (let complexType of complexTypes) {
    let properties = Object.keys(new complexType.type())
    let typeName = getCases(complexType.name)
    for (const property of properties) {
      const name = getCases(property)
      mutations[`set${name.pascal}Of${typeName.pascal}`] = function (state, value) {
        Vue.set(state[complexType.name], property, value)
      }
    }
  }
  return {
    mutations
  }
}

/**
 * Create `mutations` (setters) related to complex fields.
 * @param {String} module - the module name
 * @param {CollectionItem} params - an array of objects that describes your collection
 * @returns {Object} a object with the mapped mutations
 */
const mapCollectionItemState = function (module, { id, single, type, upsertPrefix }) {
  let moduleName = module
  let setModuleName = function (name) {
    moduleName = name
  }
  let name = getCases(single)
  let computed = {}

  let getEntityById = `${name.camel}ById`
  let entityName = `__${single}`
  computed[getEntityById] = function () {
    return this.$store.getters[`${moduleName}/${getEntityById}`]
  }
  computed[entityName] = function () {
    return this[getEntityById](this[id])
  }

  let properties = Object.keys(new type())
  for (const property of properties) {
    const propName = getCases(property)
    let conjunction = name.camel.match(/^[aeiou].*/i) ? 'An' : 'A'
    let actionName = `set${propName.pascal}Of${conjunction}${name.pascal}`
    computed[property] = {
      get () {
        return this[entityName][property]
      },
      set (value) {
        this.$store.dispatch(`${moduleName}/${actionName}`, { id: this[id], value })
      }
    }
  }

  upsertPrefix = upsertPrefix || defaultPrefixes.upsertPrefix
  computed[single] = {
    get () {
      let entity = {}
      let scope = this
      for (const property of properties) {
        Object.defineProperty(entity, property, {
          get () { return scope[property] },
          set (value) { scope[property] = value }
        })
      }
      return entity
    },
    set (value) {
      let upsertAction = `${moduleName}/${upsertPrefix}${name.pascal}`
      this.$store.dispatch(upsertAction, value)
    }
  }

  return {
    setModuleName,
    computed
  }
}

/**
 * Create `mutations` (setters) related to complex fields.
 * @param {String} module - the module name
 * @param {ComplexType} params - an array of objects that describes your collection
 * @returns {Object} a object with the mapped mutations
 */
const mapComplexTypeState = function (module, { name, type }) {
  let moduleName = module
  let setModuleName = function (name) {
    moduleName = name
  }
  let single = getCases(name)
  let computed = {}

  let properties = Object.keys(new type())
  for (const property of properties) {
    const propName = getCases(property)
    let actionName = `set${propName.pascal}Of${single.pascal}`
    computed[property] = {
      get () {
        return this.$store.state[moduleName][name][property]
      },
      set (value) {
        this.$store.commit(`${moduleName}/${actionName}`, value)
      }
    }
  }

  computed[name] = {
    get () {
      let entity = {}
      let scope = this
      for (const property of properties) {
        Object.defineProperty(entity, property, {
          get () { return scope[property] },
          set (value) { scope[property] = value }
        })
      }
      return entity
    },
    set (value) {
      this.$store.commit(`${moduleName}/${name}`, value)
    }
  }

  return {
    setModuleName,
    computed
  }
}

export {
  getCollectionPrefixes,
  setCollectionPrefixes,
  mapState,
  mapGetters,
  mapStoreMutations,
  mapStoreCollections,
  mapStoreComplexTypes,
  mapCollectionItemState,
  mapComplexTypeState
}

export default {
  getCollectionPrefixes,
  setCollectionPrefixes,
  mapState,
  mapGetters,
  mapStoreMutations,
  mapStoreCollections,
  mapStoreComplexTypes,
  mapCollectionItemState,
  mapComplexTypeState
}
