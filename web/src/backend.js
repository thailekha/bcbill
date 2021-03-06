import axios from 'axios';
import Auth from './stores/auth';

const API = 'http://localhost:9999';

// function authHeader() {
//   return { headers: { Authorization: `Bearer ${Auth.getToken()}` } };
// }

function ApiException(message, status) {
  this.message = message;
  this.status = status;
}

function axiosError(e, defaultMessage) {
  console.warn(e);
  if (e.response && e.response.data && e.response.data.message) {
    throw new ApiException(e.response.data.message, e.response.status);
  }
  throw new ApiException(defaultMessage ? defaultMessage : `Invalid response from server`);
}

export default {
  enroll: async(email, secret) => {
    try {
      const res = await axios.post(`${API}/enroll`, { email, secret });
      const { walletContent } = res.data;
      alert(walletContent);
      return walletContent;
    } catch (e) {
      axiosError(e);
    }
  },
  getUser: async(email) => {
    try {
      const res = await axios.post(`${API}/getuser`, { email, wallet: Auth.getWallet() });
      console.log(res.data);
    } catch (e) {
      axiosError(e);
    }
  },
  addRead: async(email, timestamp, readVal) => {
    try {
      const res = await axios.post(`${API}/addread`, { email, wallet: Auth.getWallet(), timestamp, readVal });
      console.log(res.data);
    } catch (e) {
      axiosError(e);
    }
  },
  getReads: async(email) => {
    try {
      const res = await axios.post(`${API}/getreads`, { email, wallet: Auth.getWallet() });
      console.log(res.data);
    } catch (e) {
      axiosError(e);
    }
  },
  getHistory: async(email, assetKey) => {
    try {
      const res = await axios.post(`${API}/history`, { email, wallet: Auth.getWallet(), assetKey });
      console.log(res.data);
    } catch (e) {
      axiosError(e);
    }
  },
  login: async(email, wallet) => {
    return wallet;
  }
};
