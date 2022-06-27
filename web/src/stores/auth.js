export default {
  getEmail() {
    return localStorage.getItem('email');
  },
  getWallet() {
    const content = localStorage.getItem('wallet');
    console.log(typeof content, content);
    return JSON.parse(localStorage.getItem('wallet'));
  },
  setWallet(wallet, email) {
    localStorage.setItem('wallet', typeof wallet === 'string' ? wallet : JSON.stringify(wallet));
    localStorage.setItem('email', email);
  },
  loggedIn() {
    const wallet = localStorage.getItem('wallet');
    return wallet && wallet.trim();
  },
  logout() {
    localStorage.removeItem('wallet');
  },
};
