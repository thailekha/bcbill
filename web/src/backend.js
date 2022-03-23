import axios from 'axios';
// import Auth from '../stores/auth';

const API = 'http://localhost:4000';

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
  register: async(email) => {
    try {
      await axios.post(`${API}/`, { email });
    } catch (e) {
      axiosError(e);
    }
  },
  login: async() => {
    return;
  }
};
