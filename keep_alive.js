var http = require("http");
console.log("đã khởi động web ảo");
http
  .createServer(function (req, res) {
    res.write("I'm alive");
    res.end();
  })
  .listen(8080);
