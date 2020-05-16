<template>
  <div id="q-app">
    <router-view />
  </div>
</template>

<script>
import utils from '@toby.mosque/utils'
console.log(utils)
export default {
  name: 'App',
  computed: utils.store.mapState('app', ['dark']),
  created () {
    console.log(this.dark)
    this.$q.dark.set(this.dark)
  }
}
</script>
