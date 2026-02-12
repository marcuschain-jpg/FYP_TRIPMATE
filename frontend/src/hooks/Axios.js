import axios from 'axios';

const Axios = axios.create({
    baseURL:"https://api.tripmatefyp.uk",
    withCredentials: false // by default, will manaully set true on diff calls
});

export default Axios;