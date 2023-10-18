/*
 * 모듈명  : login.js
 * 설명    : 관리자화면 '로그인처리' 에 대한 모듈.
 * 작성일  : 2023년 10월 16일
 * author  : HiBizNet
 * copyright : HiBizNet & GaoSystems
 * version : 1.0
 */
let express = require('express');
let mysql = require('mysql');
let bodyParser = require('body-parser');
let methodOverride = require('method-override');
let flash = require('connect-flash');
//let path = require('path');
let config = require('./common/dbconfig');
let router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

// login 폼 호출.
router.get('/', (req, res, next) => {
    console.log('### 로그인 화면 호출 ###');
    var ss = req.session;
    console.log("res.local.url : " + res.locals.url);

    if(ss.usrNo) {
        res.redirect('/login');
    } else {
        res.render('./login/loginForm', {title: '로그인 화면', url: url, session : ss});
    }

});

// login 처리.
router.post('/process', (req, res) => {
    console.log("### 로그인 처리 호출 ###");

    var ss = req.session;
    var conn = mysql.createConnection(config);
    var ssId = "";

    if(ss !=null) {
        ssId = ss.id !=null ? ss.id : '';
    }
    var usrId = req.body.usrId !=null ? req.body.usrId : '';
    var usrPwd = req.body.usrPwd !=null ? req.body.usrPwd : '';
console.log(">>> id : " + usrId);
console.log(">>> password : " + usrPwd);
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ipAddress.length < 15) {
        ipAddress = ipAddress;
    } else {
        var nyIP = ipAddress.slice(7);
        ipAddress = nyIP;
    }

    var rTitle = '모니터링 로그인 화면';
    var rRet = ''; var rUsrId = '';

    // m세션 조회 처리.
    // 로그인 처리 SQL
    console.log('routes 로그인 SQL 처리');
    conn.connect();
    conn.query('select id as id, AES_DECRYPT(UNHEX(pwd),"hibiznet") as pwd,'
        + ' name as name, email as email, telno as telNo from user_info_tbl where id = ? '
        + ' and AES_DECRYPT(UNHEX(pwd),"hibiznet") = ?',
        [usrId, usrPwd],
        function (err, results) {
            console.log(">>>> result size = " + JSON.stringify(results));
            if (err) {
                console.log('error : ', err.message);
            } else {
                if (results.length > 0) {
                    if (usrId != results[0].id) {
                        rRet = 'err0';
                    } else if (usrPwd != results[0].pwd) {
                        rRet = 'err1';
                    } else {
                        // 세션 저장.
                        ss.usrId = results[0].id;
                        ss.usrName = results[0].name;
                        ss.usrEmail = results[0].email;
                        ss.usrTelno = results[0].telNo;
                        ss.usrIp = ipAddress;
                        rUsrId = results[0].id;                      
                        rRet = 'OK';
                        let appType = "MSystem";
                        // 접속 이력 테이블 저장 처리.
                        conn.query('insert into conn_his_tbl(cview, cpage, cid, cin_date, cip)'
                            + ' values(?, "index", ?, now(), ?);',
                            [appType, results[0].id, ipAddress],
                            function (err) {
                                if (err) {
                                    console.log('>>>> err3 : ' + JSON.stringify(err));
                                    //res.render('error3', {message: err.message, error : err});
                                }
                            }
                        );
                    }
                } else {
                    rRet = 'NO';
                }
            }
            conn.end();
            res.json({title: rTitle, result: rRet, session: ss});
        }
    );
});

// 로그아웃처리.
router.get('/logout', (req, res, next) => {
    console.log("### 로그아웃 처리 호출 ###");

    var ss = req.session;
    var conn = mysql.createConnection(config);

    var usrId = ss.usrId !=null ? ss.usrId : 'NONE';

    // 삭제처리.
    conn.connect();
    conn.query('insert into conn_his_tbl(cview, cpage, cid, cin_date, cout_date, cip) values("monitoring", "index", ?,'
        + ' DATE_FORMAT("0000-00-00","%Y-%m-%d %H:%i:%s"), now(), ?);',
        [usrId, ss.usrIp],
        function(err){
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                // 세션 삭제.
                req.session.destroy(function(err){
                    if(err) {
                        console.log(">>> destroy err: " + err);
                        conn.rollback();
                    } else {
                        req.session;
                        conn.commit();
                    }
                    conn.end();
                });
                res.redirect('/login');
            }
        }
    );

});

module.exports = router;