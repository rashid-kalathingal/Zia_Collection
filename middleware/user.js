//middleware for preventing loading for strangers
function userauth(req, res, next) {
    if (req.session && req.session.user && req.session.userloggedIn) {
      res.redirect("/home");
    } else {
      next();
    }
  }
  function verify(req, res, next) {
    if (req.session && req.session.user && req.session.userloggedIn) {
      next();
    } else {
      res.redirect("/login");
    }
  }
  module.exports={
    userauth,
    verify,
  };