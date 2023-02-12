import axios from 'axios';
import Auth from './stores/auth';

const API = 'http://localhost:9999';
// const API = 'https://thebackend.loca.lt';

// function authHeader() {
//   return { headers: { Authorization: `Bearer ${Auth.getToken()}` } };
// }

const bypassTunnel = {
  headers: {
    "Bypass-Tunnel-Reminder": "true"
  }
};

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
      const res = await axios.post(`${API}/enroll`, { email, secret }, bypassTunnel);
      const { walletContent } = res.data;
      alert(walletContent);
      return walletContent;
    } catch (e) {
      axiosError(e);
    }
  },
  getUser: async(email) => {
    try {
      const res = await axios.post(`${API}/getuser`, { email, wallet: Auth.getWallet() }, bypassTunnel);
      console.log(res.data);
    } catch (e) {
      axiosError(e);
    }
  },
  fetchall: async(email) => {
    try {
      const res = await axios.post(`${API}/fetchall`, { email, wallet: Auth.getWallet() }, bypassTunnel);
      return res.data;
    } catch (e) {
      axiosError(e);
    }
  },
  claim: async(email, path) => {
    try {
      const res = await axios.post(`${API}/addmapping`, {
        email,
        wallet: Auth.getWallet() ,
        path
      }, bypassTunnel);
      // return res.data;
    } catch (e) {
      axiosError(e);
    }
  },
  revoke: async(email, clientCertHash, path) => {
    try {
      const res = await axios.post(`${API}/revoke`, {
        email,
        wallet: Auth.getWallet() ,
        clientCertHash,
        path
      }, bypassTunnel);
      // return res.data;
    } catch (e) {
      axiosError(e);
    }
  },
  reenable: async(email, clientCertHash, path) => {
    try {
      const res = await axios.post(`${API}/reenable`, {
        email,
        wallet: Auth.getWallet() ,
        clientCertHash,
        path
      }, bypassTunnel);
      // return res.data;
    } catch (e) {
      axiosError(e);
    }
  },
  getHistory: async(email, assetKey) => {
    try {
      const res = await axios.post(`${API}/history`, { email, wallet: Auth.getWallet(), assetKey }, bypassTunnel);
      return res.data;
    } catch (e) {
      axiosError(e);
    }
  }
};
