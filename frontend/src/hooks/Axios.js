import axios from 'axios';

const Axios = axios.create({
    baseURL:"https://tripmatefyp2025.duckdns.org",
    withCredentials: false // by default, will manaully set true on diff calls
});

export default Axios;