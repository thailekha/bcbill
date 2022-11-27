import axios from 'axios';
import Auth from './stores/auth';

// const API = 'http://localhost:9999';
const API = 'https://thebackend.loca.lt';

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
  addRead: async(email, timestamp, readVal) => {
    try {
      console.warn("ADding ", email, timestamp, readVal);
      const res = await axios.post(`${API}/addread`, { email, wallet: Auth.getWallet(), timestamp, readVal }, bypassTunnel);
      console.log(res.data);
    } catch (e) {
      axiosError(e);
    }
  },
  getReads: async(email) => {
    try {
      const res = await axios.post(`${API}/getreads`, { email, wallet: Auth.getWallet() }, bypassTunnel);
      console.log(res.data);
      return res.data;
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
  },
  getRead: async(email, assetKey) => {
    try {
      const res = await axios.post(`${API}/getread`, { email, wallet: Auth.getWallet(), assetKey }, bypassTunnel);
      return res.data;
    } catch (e) {
      axiosError(e);
    }
  },
  login: async(email, wallet) => {
    try {
      const { latitude, longitude } = (await axios.get('https://ipapi.co/json/')).data;
      console.log(latitude, longitude);
      const res = await axios.post(`${API}/login`,
        { 
          email,
          wallet: JSON.parse(wallet),
          timestamp: (new Date()).getTime(),
          location: [ latitude, longitude ] 
        }, bypassTunnel);
      console.log(res.data);
    } catch (e) {
      axiosError(e);
    }
  }
};
