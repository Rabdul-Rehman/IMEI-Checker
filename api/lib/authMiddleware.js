const {
  verifyToken,
} = require("./jwt");

/*
=========================================================
AUTHENTICATE LOGGED-IN USER
=========================================================

This middleware is for normal website users.

It uses:

Authorization: Bearer JWT_TOKEN
=========================================================
*/

async function authenticateUser(
  request,
  reply
) {
  try {
    /*
    =====================================================
    GET AUTHORIZATION HEADER
    =====================================================
    */

    const authorization =
      request.headers.authorization || "";

    /*
    =====================================================
    CHECK HEADER
    =====================================================
    */

    if (!authorization) {
      reply.code(401).send({
        success: false,
        error: "No token provided",
      });

      return false;
    }

    /*
    =====================================================
    CHECK BEARER FORMAT
    =====================================================
    */

    if (!authorization.startsWith("Bearer ")) {
      reply.code(401).send({
        success: false,
        error: "Invalid token format",
      });

      return false;
    }

    /*
    =====================================================
    EXTRACT TOKEN
    =====================================================
    */

    const token =
      authorization
        .substring(7)
        .trim();

    if (!token) {
      reply.code(401).send({
        success: false,
        error: "No token provided",
      });

      return false;
    }

    /*
    =====================================================
    VERIFY JWT
    =====================================================
    */

    const decoded =
      verifyToken(token);

    /*
    =====================================================
    ATTACH USER TO REQUEST
    =====================================================
    */

    request.user = decoded;

    return true;

  } catch (error) {
    request.log.error(
      error,
      "JWT authentication failed"
    );

    if (!reply.sent) {
      reply.code(401).send({
        success: false,
        error:
          "Invalid or expired token",
      });
    }

    return false;
  }
}

module.exports = {
  authenticateUser,
};