Vue.createApp({
  data() {
    return {
      periodeList: VUE_DATA.periodeList,
      selectedPeriode: VUE_DATA.periode.id,
      keyword: '',
      items: VUE_DATA.items
    }
  },
  computed: {
    filtered () {
      const upperKeyword = this.keyword.toUpperCase()
      return this.items.filter(it => {
        return it.nama.toUpperCase().includes(upperKeyword)
      })
    }
  },
  watch: {
    selectedPeriode: function (val, oldVal) {
      window.location = `/app/rank?periode=${val}`
    }
  }
}).mount('#app')