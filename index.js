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
// conexionCampus.query(usuarios3, function (error, users) {
//   //console.log(users);
//   users.forEach((user) => {
//     app.get("/" + user.usuario, function (req, res) {
//       let session = req.query.envia;
//       const usuarios4 =
//         "SELECT per.`usuario` AS usuario, per.`nombre` AS nombre FROM `gamification`.`perfil_usuario` per INNER JOIN `gamification`.`amigos_usuario` am ON per.`usuario` = am.`matricula`WHERE am.`usuario` = " +
//         session;
//       conexionCampus.query(usuarios4, function (error, lista) {
//         if (error) {
//           throw error;
//         } else {
//           let userrecibe = req.query.recibe;
//           let userenvia = req.query.envia;
//           let name = req.query.source;
//           const consulta =
//             "SELECT * FROM chatReact WHERE emisor IN('" +
//             userrecibe +
//             "','" +
//             userenvia +
//             "') AND receptor IN('" +
//             userrecibe +
//             "','" +
//             userenvia +
//             "')";
//           //console.log(consulta);
//           conexion.query(consulta, function (error, chats) {
//             if (error) {
//               res.render("chats");
//             } else {
//               //res.send('hola ' + req.params.recibe + '!');
//               //console.log(chats);
//               //var lista = JSON.parse(JSON.stringify(lista));
//               //var data = JSON.parse(JSON.stringify(chats));
//               res.render("chats", {
//                 asociados: lista,
//                 registros: chats,
//                 envia: user.usuario,
//                 recibe: userrecibe,
//                 nombre: name,
//               });
//             }
//           });
//         }
//       });
//     });
//   });
// });

app.get("/apiUsuariosChat", function (req, res) {
  let session = req.query.perfil;
  const gamificacion =
    "SELECT per.`usuario` AS usuario, per.`nombre` AS nombre FROM `gamification`.`perfil_usuario` per INNER JOIN `gamification`.`amigos_usuario` am ON per.`usuario` = am.`matricula`WHERE am.`usuario` = " +
    session;
  conexionCampus.query(gamificacion, function (error, users) {
    //console.log(res);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ contacto: users, token: session }));
  });
});

app.get("/apiMensajesChat", function (req, res) {
  let emisor = req.query.perfil;
  let receptor = req.query.contacto;
  const consulta =
    "SELECT * FROM chatReact WHERE emisor IN('" +
    receptor +
    "','" +
    emisor +
    "') AND receptor IN('" +
    receptor +
    "','" +
    emisor +
    "')";

  conexion.query(consulta, function (error, informacion) {
    if (error) {
      throw error;
    } else {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ informacion: informacion }));
    }
  });
});

app.get("/chatNewToken", function (req, res) {
  let sessioninit = req.query.perfil;
  res.render("chatsnew", { usuario_token: sessioninit });
});
//instancear directorio publico
app.use(express.static(__dirname + "/views"));

//comprueba que el cliente esta conectado a nuestro server

io.on("connection", (socket) => {
  console.log("Cliente conectado");

  socket.on("disconnect", () => {
    let token = socket.id;
    let updateRegistro =
      "UPDATE chatReactLog set estatus = 'desconectado' where token = '" +
      token +
      "'";

    conexion.query(updateRegistro, function (error) {
      if (error) {
        throw error;
      } else {
        console.log("Datos actualizados correctamente");
        //io.emit("mensaje-from-server", data);
      }
      //io.emit("disconnect", "desconect");
    });
  });

  //console.log(socket.id);
  socket.emit("Bienvenido_Usuario", {
    msg: "Bienvenido al sitio",
    fecha: Date.now(),
  });

  socket.on("get-messages-count", (data) => {
    if (data.control == "update") {
      let updateStatusMessage =
        "UPDATE eventosuveg.chatReact SET estatus = 1 WHERE receptor = '" +
        data.emisor +
        "' AND emisor = '" +
        data.contacto +
        "'";
      console.log("query:" + updateStatusMessage);

      conexion.query(updateStatusMessage, function (error) {
        if (error) {
          throw error;
        } else {
          let getCountMessages =
            "SELECT emisor,COUNT(estatus) AS recibidos FROM chatReact WHERE estatus = 0 AND receptor = '" +
            data.emisor +
            "' GROUP BY emisor";

          console.log("query:" + getCountMessages);

          conexion.query(getCountMessages, function (error, exist) {
            if (error) {
              throw error;
            } else {
              console.log(exist);
              io.emit("listado-mensajes-count", exist);
            }
          });
        }
      });
    }
    let getCountMessages =
      "SELECT emisor,COUNT(estatus) AS recibidos FROM chatReact WHERE estatus = 0 AND receptor = '" +
      data.emisor +
      "' GROUP BY emisor";

    conexion.query(getCountMessages, function (error, exist) {
      if (error) {
        throw error;
      } else {
        //console.log(getCountMessages);
        io.emit("listado-mensajes-count", exist);
      }
    });
  });

  socket.on("conection-emit", (data) => {
    let token = socket.id;
    console.log(token);
    let getRegistroLog =
      "SELECT count(idLog) as existencia FROM chatReactLog where usuario = " +
      data.emit;

    conexion.query(getRegistroLog, function (error, exist) {
      if (error) {
        throw error;
      } else {
        //console.log(exist);
        if (exist[0].existencia > 0) {
          let updateRegistro =
            "UPDATE chatReactLog set estatus = '" +
            data.estado +
            "', token = '" +
            token +
            "' where usuario = '" +
            data.emit +
            "'";

          conexion.query(updateRegistro, function (error) {
            if (error) {
              throw error;
            } else {
              console.log("Chat Log:Datos actualizados correctamente");
              //io.emit("mensaje-from-server", data);
            }
          });
        } else {
          let insertRegistro =
            "INSERT INTO chatReactLog (usuario,estatus,token) VALUES ('" +
            data.emit +
            "','" +
            data.estado +
            "','" +
            token +
            "')";

          conexion.query(insertRegistro, function (error) {
            if (error) {
              throw error;
            } else {
              console.log("Chat Log:Datos registrados correctamente");
              //io.emit("mensaje-from-server", data);
            }
          });
        }
      }

      let getusuariosLog =
        "SELECT * FROM chatReactLog where estatus = 'conectado'";
      conexion.query(getusuariosLog, function (error, listado) {
        if (error) {
          throw error;
        } else {
          console.log("Chat Log:Datos almacenados correctamente");
          io.emit("listado-usuarios-server", listado);
        }
      });
    });
  });

  socket.on("mensaje-cliente-carga", (data) => {
    let emisor = data.user;
    let receptor = data.userreceptor;
    const consulta =
      "SELECT * FROM chatReact WHERE emisor IN('" +
      receptor +
      "','" +
      emisor +
      "') AND receptor IN('" +
      receptor +
      "','" +
      emisor +
      "')";

    conexion.query(consulta, function (error, informacion) {
      if (error) {
        throw error;
      } else {
        //console.log(informacion);
        io.emit("listado-mensajes-server", informacion);
      }
    });
    //io.emit("mensaje-from-server", data);
  });

  socket.on("mensaje-cliente", (data) => {
    //console.log(data);
    let token = socket.id;
    let emisor = data.user;
    let mensaje = data.mensaje;
    let receptor = data.userreceptor;
    var dat = new Date();
    var datetime = dat.toISOString().slice(0, 10);
    var time = dat.toISOString().slice(11, 19);
    //console.log(time);
    //console.log(datetime.toISOString().slice(0,10));
    //let valuefecha = date.format(fechahoy, "YYYY/MM/DD HH:mm:ss");
    //let fecha = new Date;
    let registrar =
      "INSERT INTO chatReact (token_chat,emisor,mensaje,receptor,fecha) VALUES ('" +
      token +
      "','" +
      emisor +
      "','" +
      mensaje +
      "','" +
      receptor +
      "','" +
      datetime +
      " " +
      time +
      "')";

    conexion.query(registrar, function (error) {
      if (error) {
        throw error;
      } else {
        console.log("Mensaje:Datos almacenados correctamente y" + data);
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
