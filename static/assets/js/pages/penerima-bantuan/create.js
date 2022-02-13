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
          minVal: { min: 1 },
          maxVal: { max: 40 },
        },
        rw: {
          key: 'RW',
          required: true,
          minVal: { min: 1 },
          maxVal: { max: 40 },
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
      return isNoError(this.errors)
    }
  }
}).mount('#app')