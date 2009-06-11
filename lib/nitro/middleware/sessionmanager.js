var json = require("json");

var SHA256 = require("data/digest/sha256").SHA256,
    Request = require("nitro/request").Request,
    Cookie = require("nitro/cookie").Cookie;

/**
 * Session management.
 *
 * The HTTP protocol is stateless, for a *good* reason. State data (session) 
 * should be kept to an absolute minimum.
 *
 * This Session Manager implementation stores session data in the session cookie
 * data. A maximum of arround 4Kb of state is supported.
 *
 * THINK: http://wonko.com/post/why-you-probably-shouldnt-use-cookies-to-store-session-data
 */
var SessionManager = exports.SessionManager = function(app, secret, cookieName) {

    if (!secret) throw new Error("Please define the SessionManager secret value!");

    cookieName = cookieName || "ns";

    // Deserialize the session from the session cookie. 
    
    var loadSession = function(env) {
        var session, cookie, request = new Request(env);

        if (cookie = request.cookies()[cookieName]) {
            var parts = decodeURIComponent(cookie).split("--");        
            var data = parts[0], hash = parts[1];
                
            if (hash == SHA256(data + secret))
                session = json.parse(data);
        }
        
        return session || {};
    }
      
    return function(env) {
        env["jsgi.session.load"] = loadSession;

        var response = app(env); 
        
        var session = env["jsgi.session"]
        
        if (session && session.dirty) {
            var data = json.stringify(session.data);
            var hash = SHA256(data + secret);

            var date = new Date();
            date.setFullYear(date.getFullYear() + 1);

            var cookie = new Cookie(cookieName, {
                path: "/",
                value: data + "--" + hash,
                expires: date,
                httpOnly: true
            });
            
            cookie.setHeader(response[1]);
        }

        return response;
    }

}
