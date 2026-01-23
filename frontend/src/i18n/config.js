import i18n from "i18next"; // core lib
import { initReactI18next } from "react-i18next"; // re-render when lang changes
import HttpApi from "i18next-http-backend";


i18n
.use(HttpApi)
.use(initReactI18next)
.init({
    lng: "en", // default locale
    ns: ["common", "mytrips", "itinerary", "tripdetails", "grouptrips", "profile"],
    defaultNS: "common",
    fallbackLng: "en", // fallback used when translation is missing in active locale
    debug: true, // enable output in browser console
    backend: {
        loadPath: "/locale/{{lng}}/{{ns}}.json"
    },
    interpolation:{
        escapeValue: false
    }
});

export default i18n;

