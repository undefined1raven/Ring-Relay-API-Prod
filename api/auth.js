require('dotenv').config()
const { v4 } = require('uuid');
const bcrypt = require('bcrypt')
const mysql = require('mysql2')
const connection = mysql.createConnection(process.env.DB_KEY)
const mfa_mgr = require('speakeasy');
const jwt = require('jsonwebtoken');
const { serialize } = require('cookie')
const fs = require('fs');
// var privateKey = fs.readFileSync('private-key.pem');

const { getDatabase, get, once, increment, remove, query, limitToLast, update, push, set, ref, onValue } = require("firebase/database");
var admin = require("firebase-admin");
// var serviceAccount = JSON.parse(process.env.FIREBASE_SCA);
var serviceAccount = {
    "type": "service_account",
    "project_id": "lifewire-98355",
    "private_key_id": "d8fba367bc3a10df768dd5d22ed4cb84bd775213",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCZR6NOYlXMNglX\nJiqTiEnkasYBnakUUiN7VND2y5yql7YEfA4dvd4TpjqsLCmyYAcVwnqFY4bImhr5\n5MlolfElXzgdDuCaf5rz/KxWTko53snfE+b86UckTLV7pLfRZbFfM0bjdkUTaUHI\nt1ykd1yUF8HC5gO0Jvra1iBywLFmtkPB4tYXz3O1WiQtJnk+b+b5lYxpx9Hs7OE6\nhhf5INbt8uMijFAsQ5Gf/llNChfYlqic+VOJT6S7SezTVx22U9eRwkjnJz1WGua1\n4t69utAAgaTN4aT3mkqpaFmVcA9rIdCCq/OSv7VgFyltTBEXuho/v1w2RNlydNQ9\nrqYL6uJNAgMBAAECggEAOQ8qczj3AHSTKI6MJeyDuVSoDhzvPqHPFI+/1Ed6tCSS\nvPujU54FCCKGz+YGxaCqsoZ5jqM8nvuDFEh/U4ARy1w1atfJc6oR+Ea0rtIpHn7Z\nfkIN6FM8yP4HRxZL2Vb2Xt6bQnyZ/T5fH0Vm5tCKNZTca92tPkiOdJ1maeFiiL23\n7WcuZaf0jERrYMVWdXKrwBzmJX9ULdve9Fe7JOkxcogQfFLHW5x/NlUVOHsK+6XQ\n1zM1So0c8UrUcOKPWiSMEvZcstg7GcXpxwQzcdrUPFz9GZg06sNRe1gFdy3vx9H1\njjRKNKgUUc6AlI9sS0j7dvctog6uhyRzPG3CGf48jwKBgQDWWnEOGa3q3TqhoP3L\nQ6yqH0jeeKnUqsWt++OYhIfoyu/Gvm7qzSfQO+KaAY0cv2VRmY4U/qc5dHB3IZCN\nXygY1MSRmW7CsbYpnQ7KDpQwpwiaeLGfN9Nm6ri2pfh3/LVYynKDSF9MiOvqrNs+\nufqGDfaxxAvlox5h+/hURTgj2wKBgQC3D4Jnm63X+4BqBHOxoNK5R4cuo1yrUcby\nb414K+7UdmhYTG28cN6vrMV936lUybfxZAfB4N81varmAzbVoYWzsaYC4n2Ag1xF\nILLaqS1jwuAwoelUM+IF00+GZunb3Fq1g1RIDfQA375rkr9gTT/+TahnMS0oMcEw\n1mGmC5f+9wKBgCoBgUQ9Hgr3naTM8s9hjLWt+c63ILjvWlvVD+30ktm44zI0YXIc\nECBLjAWYJjoq+8T47ZIJsWWd/ugpqLU7n5T2JStPQRhgUQ1onNxV7Q53vUTgQBau\njvwNJXONpNqGqFclHTnC9gH+lxTfGPv64DBjDiQaAibXR332Ldz9z5mfAoGAVTXo\n86VptIGjcrYDzIkZzZjX+gOc3TpBqxP1/BwnHcrII2HgKrk3TvrTKxZzUb5b2wc+\n/SZZgEB7TnnsimCXRd/JcMpQtQNwbdUcq9/X+vn5NWoInGNSMHf+Koe5D9hweNFa\n5/dmvwlnL9etMXyD7zHi07X2WSFf1gXUimAXLl0CgYEAjXBIjroKWvXylbHMQmjy\n08fi60iqB/ppeTgmoSrxbAhbk8tvgTdfWLJvBE5IUnQ2+/s2+oiQZ0e86ryt6tqQ\nIv75qZHY8NWzPiaGmq24NfosFggOJSegMrHLJS6NoMr7KpzH3pfEj0Gca01+40s2\nbECwel/4Bl21MxYeELIYLLM=\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-x6rcl@lifewire-98355.iam.gserviceaccount.com",
    "client_id": "105545043624341840927",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-x6rcl%40lifewire-98355.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
};

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://ring-relay-default-rtdb.europe-west1.firebasedatabase.app/"
// });
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://lifewire-98355-default-rtdb.firebaseio.com"
});
const db = admin.database();


async function queryDB(queryStr) {
    const DBquery = new Promise((resolve, reject) => {
        connection.query(queryStr, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        })
    });

    return DBquery;
}

function handler(req, res) {
    set(ref(db, 'hiiii/'), { fuck: 'mi life' });
    // console.log(jwt.sign({iss: serviceAccount.client_email, sub: serviceAccount.client_email, aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit", iat: Date.now(), exp: 3600, uid: v4()}, privateKey, { algorithm: 'RS256' }))
    if (req.body != undefined) {
        if (req.query['val'] != 0) {
            let userid = req.body.userid;
            let password = req.body.password;
            let cip = req.body.ip;
            let useridType = 'email';
            if (userid.indexOf('@') == -1) {
                useridType = 'username';
            } else {
                useridType = 'email';
            }
            queryDB(`SELECT email, logsConfig, password, uid, username FROM users WHERE ${useridType}='${userid}'`).then(userObjArray => {
                let user = userObjArray[0];
                if (userObjArray.length > 0) {
                    bcrypt.compare(password, user.password).then(auth_res => {
                        if (auth_res) {
                            let ntid = v4();
                            bcrypt.hash(`${ntid}${process.env.AT_SALT}${cip}`, 10).then(secHash => {
                                const add_token_to_rtdb = ref(db, `authTokens/${ntid}`);
                                var logsConfig = 0;
                                var showLogsConfig = false;
                                try {
                                    logsConfig = JSON.parse(user.logsConfig);
                                    showLogsConfig = logsConfig.ini == false;
                                } catch (e) { }
                                if (logsConfig.account == true && logsConfig != 0) {
                                    queryDB(`INSERT INTO Logs SET tx='${Date.now()}', uid='${user.uid}', severity='warning', type='Account', subtype='Log In', ip='${cip}', location='${req.body.location}', details='${req.body.details}'`).then().catch(e => { })
                                }
                                set(add_token_to_rtdb, {
                                    tx: Date.now(),
                                    ip: cip,
                                    uidd: userid,
                                    uidt: useridType,
                                    said: user.uid,//standard uid
                                    hash: secHash,
                                    username: user.username
                                }).then(r => {
                                    res.json({ showLogsConfig: showLogsConfig, ownUID: user.uid, status: 'Successful', redirect: '/', AT: ntid, PKGetter: `${user.uid.split('-')[0]}-${user.uid.split('-')[4]}` })
                                }).catch(e => {
                                    res.json({ status: 'Auth Error', error: e })
                                });
                            })
                        } else {
                            res.json({ status: 'Auth Failed' });
                        }
                    });
                } else {
                    res.json({ status: 'Auth Failed' });
                }
            }).catch(e => { res.json({ status: 'Auth Error', error: e }); });
        } else if (req.query['val'] == 0) {
            get(ref(db, `authTokens/${req.body.AT}`)).then(snap => {
                const data = snap.val();
                if (data != undefined && data.ip == req.body.CIP) {
                    bcrypt.compare(`${req.body.AT}${process.env.AT_SALT}${req.body.CIP}`, data.hash).then(result => {
                        if (result) {
                            res.json({ status: 'Validation Successful', flag: true, PKGetter: `${data.said.split('-')[0]}-${data.said.split('-')[4]}`, ownUID: data.said, username: data.username });
                        } else {
                            res.json({ status: 'Validation Failed [X9]', redirect: '/login' });
                        }
                    })
                } else {
                    res.json({ status: 'Validation Failed', redirect: '/login' });
                }
            })
        }
    } else {
        res.json({ status: 'No Body Data' })
    }
}

if (process.env.NODE_ENV === 'development') {
    const cors = require('micro-cors')({ allowMethods: ['GET', 'POST'], origin: 'http://localhost:3000' });
    module.exports = cors(handler);
} else {
    const cors = require('micro-cors')({ allowMethods: ['GET', 'POST'], origin: 'https://www.ring-relay.live' });
    module.exports = cors(handler);
}