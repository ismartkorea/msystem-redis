let express = require('express');
let router = express.Router();
// env환경변수 파일 가져오기 (작동안함)
require('dotenv').config;

/* GET index page. */
router.get('/', function(req, res, next) {

  let ss = req.session;
console.log("ss : " + JSON.stringify(ss));

  if(ss.usrId == null) {
    console.log("### login 페이지 호출 ###");

    res.render('login/loginForm', { title: '모니터링 시스템 로그인 화면' });
  } else {
    console.log("### index 페이지 호출 ###");

    res.render('index', { title: '모니터링 시스템', session: ss });
  }

});

module.exports = router;
