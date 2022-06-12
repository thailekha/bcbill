export default {
  getWallet() {
    const content = localStorage.getItem('wallet');
    console.log(typeof content, content);
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
