module.exports = {
  apps : [{
    name   : "app1",
    script : "./index.js",
    watch: true,
    ignore_watch: ["node_modules", "views", "static", "uploads"]
  }]
}
