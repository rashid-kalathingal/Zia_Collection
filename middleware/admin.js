//middleware for preventing loading for strangers
function adminauth(req, res, next) {
    if (req.session && req.session.Admin && req.session.AdminloggedIn) {
      res.redirect("/admin");
    } else {
      next();
    }
  }
  
  function verify(req, res, next) {
    if (req.session && req.session.Admin && req.session.AdminloggedIn) {
      next();
    } else {
      res.redirect("/admin");
    }
  }
  module.exports={
    adminauth,
    verify,
  };