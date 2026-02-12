import axios from 'axios';

const Axios = axios.create({
    baseURL:"http://15.135.87.40:8080",
    withCredentials: false // by default, will manaully set true on diff calls
});

export default Axios;