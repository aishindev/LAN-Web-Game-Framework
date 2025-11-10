const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWTSECRET;

function createToken(tokenType, additionalInformation) {
  let options;
  let payload = {};

  switch (tokenType) {
    // This token serves to represent the sessions of a normal user.
    case "user":
      payload.permissions = "user";
      payload.id = additionalInformation.userID;
      options = { expiresIn: "1d" };
      break;
    default: throw ({errorType: "tokenCreationError"});
  }

  try {
    const token = jwt.sign(payload, jwtSecret, options);
    return token;
  } catch (error) {
    throw ({errorType: "tokenCreationError"})
  }
}

const validateToken = (token) => {
  try {
    var decoded = jwt.verify(token, jwtSecret);
  } catch (err) {
    return false;
  }
  return decoded;
};

module.exports = { createToken, validateToken };
