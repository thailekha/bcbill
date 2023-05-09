const auth = {
  isLoggedIn: (req) => {
    return req.session.loggedIn;
  },

  login: (req, entityID, wallet) => {
    req.session.loggedIn = true;
    req.session.entityID = entityID;
    req.session.wallet = wallet;
  },

  // logout(req, res, next) {
  //   req.session.destroy((err) => {
  //     if (err) {
  //       return next(err);
  //     }
  //     res.clearCookie('connect.sid');
  //     res.redirect('/');
  //   });
  // }

  logout: (req) => {
    delete req.session.loggedIn;
    delete req.session.entityID;
    delete req.session.wallet;
  },

  getWallet: (req) => {
    return req.session.wallet;
  },

  creds: (req) => {
    return [req.session.entityID, req.session.wallet];
  }
};

module.exports = auth;
