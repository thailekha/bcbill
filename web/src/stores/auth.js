export default {
  getWallet() {
    return JSON.parse(localStorage.getItem('wallet'));
  },
  setWallet(wallet) {
    localStorage.setItem('wallet', typeof wallet === 'string' ? wallet : JSON.stringify(wallet));
  },
  loggedIn() {
    const wallet = localStorage.getItem('wallet');
    return wallet && wallet.trim();
  },
  logout() {
    localStorage.removeItem('wallet');
  },
};
