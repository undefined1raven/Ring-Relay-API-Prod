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

};

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "/"
// });
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: ""
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