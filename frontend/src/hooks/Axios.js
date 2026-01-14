import axios from 'axios';

const Axios = axios.create({
    baseURL:"http://localhost:8080",
    withCredentials: false // by default, will manaully set true on diff calls
});

export default Axios;