const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const sa = require("./serviceAccountKey.json");
initializeApp({ credential: cert(sa) });

getAuth().getUser("Aqooz7q3RUObUNGgdnBYaiZ2Xte2")
  .then(u => { console.log("Claims:", u.customClaims); process.exit(0); });