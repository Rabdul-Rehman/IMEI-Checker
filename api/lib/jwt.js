const jwt = require("jsonwebtoken");

/*
=========================================================
JWT SECRET
=========================================================
*/

const JWT_SECRET = process.env.JWT_SECRET;

/*
=========================================================
VALIDATE JWT CONFIGURATION
=========================================================
*/

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is missing from .env.local"
  );
}

/*
=========================================================
GENERATE JWT
=========================================================
*/

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

/*
=========================================================
VERIFY JWT
=========================================================
*/

function verifyToken(token) {
  return jwt.verify(
    token,
    JWT_SECRET
  );
}

/*
=========================================================
EXPORTS
=========================================================
*/

module.exports = {
  generateToken,
  verifyToken,
};