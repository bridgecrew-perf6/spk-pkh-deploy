Vue.createApp({
  data() {
    return {
      message: 'Hello Vue!',
      periodeList: VUE_DATA.periodeList,
      selectedPeriode: VUE_DATA.periode.id,
      kriteriaList: VUE_DATA.kriteriaList.map(it => {
        return {
          id: it.id,
          label: it.nama,
          selected: true
        }
      }),
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
    },
    selectedKriteria() {
      return this.kriteriaList.filter(k => k.selected)
    }
  },
  watch: {
    selectedPeriode: function (val, oldVal) {
      window.location = `/app/penilaian?periode=${val}`
    }
  }
}).mount('#app')