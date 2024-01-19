//Instalar librerias de socket.io y express con npm
const express = require("express");

const mysql = require("mysql");
const { listenerCount } = require("process");
//insancear app
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
var http = require("http");
var fs = require("fs");

//app.set("views", "./");
app.set("view engine", "ejs");
//app.set("view", "usuario");

let conexion = mysql.createConnection({
  host: "10.26.3.250",
  user: "dadcastillo",
  password: "WxLOuiPWz61a*",
  port: 3306,
  database: "eventosuveg",
});

let conexionCampus = mysql.createConnection({
  host: "10.26.3.177",
  user: "dadcastillo",
  password: "WxLOuiPWz61a*",
  port: 3306,
  database: "gamification",
});

//const usuarios = "SELECT * FROM participantes LIMIT 0, 4 ;";
//app.get("/Usuario", function (req, res) {
//conexion.query(usuarios, function (error, lista) {
//if (error) {
//  throw error;
//} else {
//  res.render("usuario", { registros: lista });
//  console.log(lista);
//}
//  });
//});

const usuarios = "SELECT * FROM participantes LIMIT 0, 10 ;";
const usuarios2 = "SELECT * FROM perfil_usuario LIMIT 0, 10 ;";
const usuarios3 =
  "SELECT per.`usuario` AS usuario, per.`nombre` AS nombre FROM `gamification`.`perfil_usuario` per INNER JOIN `gamification`.`amigos_usuario` am ON per.`usuario` = am.`matricula`";
//"SELECT*FROM `gamification`.`perfil_usuario` per INNER JOIN `gamification`.`amigos_usuario` am ON per.`usuario` = am.`matricula`WHERE am.`usuario` = 18005084";
conexionCampus.query(usuarios3, function (error, users) {
  //console.log(users);
  users.forEach((user) => {
    app.get("/" + user.usuario, function (req, res) {
      let session = req.query.envia;
      const usuarios4 =
        "SELECT per.`usuario` AS usuario, per.`nombre` AS nombre FROM `gamification`.`perfil_usuario` per INNER JOIN `gamification`.`amigos_usuario` am ON per.`usuario` = am.`matricula`WHERE am.`usuario` = " +
        session;
      conexionCampus.query(usuarios4, function (error, lista) {
        if (error) {
          throw error;
        } else {
          let userrecibe = req.query.recibe;
          let userenvia = req.query.envia;
          const consulta =
            "SELECT * FROM chatReact WHERE emisor IN('" +
            userrecibe +
            "','" +
            userenvia +
            "') AND receptor IN('" +
            userrecibe +
            "','" +
            userenvia +
            "')";
          //console.log(consulta);
          conexion.query(consulta, function (error, chats) {
            if (error) {
              res.render("chats");
            } else {
              //res.send('hola ' + req.params.recibe + '!');
              console.log(chats);
              //var lista = JSON.parse(JSON.stringify(lista));
              //var data = JSON.parse(JSON.stringify(chats));
              res.render("chats", {
                asociados: lista,
                registros: chats,
                envia: user.usuario,
                recibe: userrecibe,
              });
            }
          });
        }
      });
    });
  });
});

//instancear directorio publico
app.use(express.static(__dirname + "/views"));

//comprueba que el cliente esta conectado a nuestro server
io.on("connection", (socket) => {
  //console.log(socket.id);
  socket.emit("Bienvenido_Usuario", {
    msg: "Bienvenido al sitio",
    fecha: new Date(),
  });
  socket.on("mensaje-cliente", (data) => {
    //console.log(data);
    let token = socket.id;
    let emisor = data.user;
    let mensaje = data.mensaje;
    let receptor = data.userreceptor;
    //let fecha = new Date;
    let registrar =
      "INSERT INTO chatReact (token_chat,emisor,mensaje,receptor) VALUES ('" +
      token +
      "','" +
      emisor +
      "','" +
      mensaje +
      "','" +
      receptor +
      "')";

    conexion.query(registrar, function (error) {
      if (error) {
        throw error;
      } else {
        console.log("Datos almacenados correctamente");
        io.emit("mensaje-from-server", data);
      }
    });
    //io.emit("mensaje-from-server", data);
  });
});

//configuracion de nuestro servidor
server.listen(3000, () => {
  console.log("Server inicializado en puerto http://localhost:3000/");
});
