var passport = require("passport");
var OpenIDConnectStrategy = require("passport-openidconnect");
var express = require("express");
var qs = require("querystring");
var router = express.Router();

const isProduction = process.env.NODE_ENV === "production";
const CALLBACK_URL = isProduction
    ? "https://a3-ariannaxie.onrender.com/oauth2/redirect"
    : "http://localhost:3000/oauth2/redirect";
const RETURN_TO_URL = isProduction
    ? "https://a3-ariannaxie.onrender.com/login"
    : "http://localhost:3000/login";

passport.use(
    new OpenIDConnectStrategy(
        {
            issuer: "https://" + process.env["AUTH0_DOMAIN"] + "/",
            authorizationURL:
                "https://" + process.env["AUTH0_DOMAIN"] + "/authorize",
            tokenURL: "https://" + process.env["AUTH0_DOMAIN"] + "/oauth/token",
            userInfoURL: "https://" + process.env["AUTH0_DOMAIN"] + "/userinfo",
            clientID: process.env["AUTH0_CLIENT_ID"],
            clientSecret: process.env["AUTH0_CLIENT_SECRET"],
            callbackURL: CALLBACK_URL,
            scope: ["profile"],
        },
        function verify(issuer, profile, cb) {
            return cb(null, profile);
        }
    )
);

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, {
            id: user.id,
            username: user.username,
            name: user.displayName,
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});


router.get("/login", passport.authenticate("openidconnect"));

router.get(
    "/oauth2/redirect",
    passport.authenticate("openidconnect", {
        successRedirect: "/",
        failureRedirect: "/login",
    })
);

router.post("/logout", function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }

        req.session.destroy(() => {
            var params = {
                client_id: process.env["AUTH0_CLIENT_ID"],
                returnTo: RETURN_TO_URL,
            };
            res.redirect(
                "https://" +
                    process.env["AUTH0_DOMAIN"] +
                    "/v2/logout?" +
                    qs.stringify(params)
            );
        });
    });
});

module.exports = router;