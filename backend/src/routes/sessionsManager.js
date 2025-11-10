const express = require("express");
const router = express.Router();

let {database} = require("../../database/databaseController")
let jwt = require("../controllers/jwt")

router.post("/login", function (request, res) {
    const {username, password} = request.body;

    database.loginUser(username, password)
      .then(({ operationSuccess, userID, username }) => {
        if (operationSuccess) {
          return res.status(200).json({
            operationSuccess: true,
            token: jwt.createToken("user", {
              userID,
              username
            }),
          });
        }
        return res.status(401).json({ errorType: "invalidPassword", operationSuccess: false });
      })
      .catch((err)=> {
        switch(err.errorType) {
          case "userNotFound": return res.status(401).json({ errorType: "invalidUsername", operationSuccess: false});
          case "databaseError": return res.status(500).json({ errorType: "databaseError", operationSuccess: false});
          case "tokenCreationError": return res.status(500).json({ errorType: "tokenCreationError", operationSuccess: false});
          default: return res.status(500).json({errorType: "unexpectedError", operationSuccess: false});
        }
      })
});

router.post("/checktoken", (req, res) => {
  try {
    if(req.body.token === undefined) {return res.status(400).json({errorType: "notValidToken", operationSuccess: false})}
    if (jwt.validateToken(req.body.token)) return res.status(200).json({ operationSuccess: true });
    else return res.status(400).json({errorType: "notValidToken", operationSuccess: false});
  } catch (error) {
    return res.status(400).json({ errorType: "unexpectedError", operationSuccess: false});
  }
});

module.exports = router;
