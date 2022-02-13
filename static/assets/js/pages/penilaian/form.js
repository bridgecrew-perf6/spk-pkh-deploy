Vue.createApp({
  data() {
    return {
      payload: {
        penerimaBantuanId: null,
      }
    }
  },
  computed: {
    errors () {
      return validation(this.payload, {
        nama: {
          key: 'Penerima Bantuan',
          required: true
        }
      })
    },
    isValid () {
      return !isNoError(this.errors)
    }
  },
  mounted () {
    if (VUE_DATA && VUE_DATA.payload) {
      const p = VUE_DATA.payload
      this.payload.penerimaBantuanId = p.penerimaBantuanId
    }
  }
}).mount('#app')
