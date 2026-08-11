const bcrypt = require("bcrypt");

const {
  supabase,
} = require("../lib/supabase");

const {
  generateToken,
  verifyToken,
} = require("../lib/jwt");

const {
  authenticateUser,
} = require("../lib/authMiddleware");


async function authRoutes(fastify) {

  /*
  ========================================================
  REGISTER
  POST /auth/register
  ========================================================
  */

  fastify.post(
    "/auth/register",
    async (request, reply) => {

      try {

        const {
          name,
          email,
          password,
        } = request.body || {};

        /*
        ==================================================
        VALIDATE INPUT
        ==================================================
        */

        if (
          !name ||
          !email ||
          !password
        ) {
          return reply
            .code(400)
            .send({
              success: false,
              error:
                "All fields are required",
            });
        }

        const cleanName =
          String(name).trim();

        const cleanEmail =
          String(email)
            .trim()
            .toLowerCase();

        if (!cleanName) {
          return reply
            .code(400)
            .send({
              success: false,
              error:
                "Name is required",
            });
        }

        if (!cleanEmail) {
          return reply
            .code(400)
            .send({
              success: false,
              error:
                "Email is required",
            });
        }

        if (
          String(password).length < 6
        ) {
          return reply
            .code(400)
            .send({
              success: false,
              error:
                "Password must be at least 6 characters",
            });
        }

        /*
        ==================================================
        CHECK EXISTING USER
        ==================================================
        */

        const {
          data: existingUser,
          error: existingUserError,
        } = await supabase
          .from("users")
          .select("id")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (existingUserError) {
          request.log.error(
            existingUserError,
            "Failed to check existing user"
          );

          return reply
            .code(500)
            .send({
              success: false,
              error:
                "Failed to check existing user",
            });
        }

        if (existingUser) {
          return reply
            .code(400)
            .send({
              success: false,
              error:
                "Email already exists",
            });
        }

        /*
        ==================================================
        HASH PASSWORD
        ==================================================
        */

        const passwordHash =
          await bcrypt.hash(
            String(password),
            10
          );

        /*
        ==================================================
        CREATE USER
        ==================================================
        */

        const {
          data: newUser,
          error: insertError,
        } = await supabase
          .from("users")
          .insert({
            name: cleanName,
            email: cleanEmail,
            password_hash:
              passwordHash,
          })
          .select(
            "id,name,email"
          )
          .single();

        if (insertError) {
          request.log.error(
            insertError,
            "Failed to create user"
          );

          return reply
            .code(500)
            .send({
              success: false,
              error:
                "Failed to create user",
            });
        }

        /*
        ==================================================
        SUCCESS
        ==================================================
        */

        return reply
          .code(201)
          .send({
            success: true,
            message:
              "Registration successful",
            user: newUser,
          });

      } catch (error) {

        request.log.error(
          error,
          "Registration failed"
        );

        return reply
          .code(500)
          .send({
            success: false,
            error:
              "Registration failed",
          });
      }
    }
  );


  /*
  ========================================================
  LOGIN
  POST /auth/login
  ========================================================
  */

  fastify.post(
    "/auth/login",
    async (request, reply) => {

      try {

        const {
          email,
          password,
        } = request.body || {};

        /*
        ==================================================
        VALIDATE INPUT
        ==================================================
        */

        if (
          !email ||
          !password
        ) {
          return reply
            .code(400)
            .send({
              success: false,
              error:
                "Email and password required",
            });
        }

        const cleanEmail =
          String(email)
            .trim()
            .toLowerCase();

        /*
        ==================================================
        FIND USER
        ==================================================
        */

        const {
          data: user,
          error,
        } = await supabase
          .from("users")
          .select(
            `
            id,
            name,
            email,
            password_hash
            `
          )
          .eq(
            "email",
            cleanEmail
          )
          .maybeSingle();

        if (error) {

          request.log.error(
            error,
            "Login user lookup failed"
          );

          return reply
            .code(500)
            .send({
              success: false,
              error:
                "Login failed",
            });
        }

        if (!user) {
          return reply
            .code(401)
            .send({
              success: false,
              error:
                "Invalid email or password",
            });
        }

        /*
        ==================================================
        CHECK PASSWORD
        ==================================================
        */

        const validPassword =
          await bcrypt.compare(
            String(password),
            user.password_hash
          );

        if (!validPassword) {
          return reply
            .code(401)
            .send({
              success: false,
              error:
                "Invalid email or password",
            });
        }

        /*
        ==================================================
        GENERATE JWT
        ==================================================
        */

        const token =
          generateToken(user);

        /*
        ==================================================
        RETURN TOKEN
        ==================================================
        */

        return {
          success: true,

          token,

          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        };

      } catch (error) {

        request.log.error(
          error,
          "Login failed"
        );

        return reply
          .code(500)
          .send({
            success: false,
            error:
              "Login failed",
          });
      }
    }
  );


  /*
  ========================================================
  GET CURRENT USER
  GET /auth/me
  ========================================================
  */

  fastify.get(
    "/auth/me",
    async (request, reply) => {

      /*
      ==================================================
      VERIFY JWT
      ==================================================
      */

      const authenticated =
        await authenticateUser(
          request,
          reply
        );

      if (!authenticated) {
        return;
      }

      try {

        /*
        ==================================================
        GET USER FROM DATABASE
        ==================================================
        */

        const {
          data: user,
          error,
        } = await supabase
          .from("users")
          .select(
            "id,name,email"
          )
          .eq(
            "id",
            request.user.id
          )
          .single();

        if (error || !user) {
          return reply
            .code(401)
            .send({
              success: false,
              error:
                "User not found",
            });
        }

        /*
        ==================================================
        RETURN CURRENT USER
        ==================================================
        */

        return {
          success: true,
          user,
        };

      } catch (error) {

        request.log.error(
          error,
          "Failed to load current user"
        );

        return reply
          .code(500)
          .send({
            success: false,
            error:
              "Failed to load current user",
          });
      }
    }
  );
}


module.exports =
  authRoutes;