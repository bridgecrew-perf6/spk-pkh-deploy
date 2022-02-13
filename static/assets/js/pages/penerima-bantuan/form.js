Vue.createApp({
  data() {
    return {
      message: 'Hello Vue!',
      payload: {
        nama: '',
        rt: 1,
        rw: 1,
        kontak: '',
        nik: '',
        noKk: ''
      }
    }
  },
  computed: {
    errors () {
      return validation(this.payload, {
        nama: {
          key: 'Nama',
          required: true,
          minLength: { length: 6 }
        },
        rt: {
          key: 'RT',
          required: true,
          minVal: { min: 0 },
          maxVal: { max: 90 },
        },
        rw: {
          key: 'RW',
          required: true,
          minVal: { min: 0 },
          maxVal: { max: 90 },
        },
        kontak: {
          key: 'Nomor Telepon',
          required: true,
          regex: { pattern: '^(\\+62|62|0)8[1-9][0-9]{6,9}$' }
        },
        nik: {
          key: 'Nomor Induk Kependudkan',
          required: true,
          exactLength: { length: 16 },
          regex: '^\\d+$'
        },
        noKk: {
          key: 'Nomor Kartu Keluarga',
          required: true,
          exactLength: { length: 16 },
          regex: { pattern: '^\\d+$' }
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
      this.payload.nama = p.nama
      this.payload.rt = parseInt(p.rt)
      this.payload.rw = parseInt(p.rw)
      this.payload.kontak = p.kontak
      this.payload.nik = p.nik
      this.payload.noKk = p.noKk
    }
  }
}).mount('#app')
