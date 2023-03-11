const auth = {
  isLoggedIn: (req) => {
    return req.session.loggedIn;
  },

  login: (req, username, wallet) => {
    req.session.loggedIn = true;
    req.session.username = username;
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
    delete req.session.wallet;
    delete req.session.username;    
    delete req.session.loggedIn;
  },

  getWallet: (req) => {
    return req.session.wallet;
  },

  creds: (req) => {
    return [req.session.username + '@org1.com', req.session.wallet];
  }
};

module.exports = auth;
