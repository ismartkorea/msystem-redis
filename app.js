/*
 * 모듈명  : app.js
 * 설명    : 모니터링시스템 'APP 환경설정' 에 대한 모듈.
 * 작성일  : 2013년 10월 16일
 * author  : HiBizNet
 * copyright : HiBizNet & GaoSystems
 * version : 1.0
 */
// __appbase 가 프로젝트 폴더의 root 를 가리키도록 만든다.
global.__appbase = __dirname.split('\\').join('/');
global.__debug_mode = typeof v8debug === 'object';

const express = require('express');
const engine = require('ejs-locals');
const path = require('path');
//const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql');
const dotenv = require("dotenv");
// 세션 store
const redis = require("redis");
// express-session 객체를 넣는다.
const RedisStore = require('connect-redis').default; 

// env환경변수 파일 가져오기 (작동안함)
dotenv.config;

//console.log("REDIS_PASSWORD: ", process.env.REDIS_PASSWORD);
//console.log("REDIS_REDIS_HOST: ", process.env.REDIS_HOST);
//console.log("REDIS_REDIS_PORT: ", process.env.REDIS_PORT);

// menu import
const index = require('./routes/index');
const login = require('./routes/login');
const main = require('./routes/main');
// 공통 관리
//const commons = require('./routes/common');
// 가입 화면
//const signup = require('./routes/signup');
// 공지사항 관리
//const announce = require('./routes/announce');
// 메뉴 관리
//const menu = require('./routes/menu');
// 사용자 관리
//const member = require('./routes/members');
// 문의 게시판
//const qna = require('./routes/qna');
// 게시판
//const board1 = require('./routes/board');
// 마이페이지
//const mypage = require('./routes/mypage');
// 방문내역
//const visit = require('./routes/visit');
// sms 관련
//const adminSms = require('./routes/sms');

// MySQL Connect 설정.
const config = require('./routes/common/dbconfig');
global.dbConn = mysql.createConnection(config);
handleDisconnect(global.dbConn);

//* Redis 연결 (원격)
// redis[s]://[[username][:password]@][host][:port][/db-number]
/*
const redisClient = redis.createClient({
  //url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
  //url: `redis://:system9123@127.0.0.1:6379/0`,
  //legacyMode: true, // 반드시 설정 !! 설정 안하면 connect-redis 동작 안함
  //enable_offline_queue: false
  host: 'localhost',
  user: 'user',
  password: 'system9123',
  port: 6379
});
*/
const redisInfo = 'redis://:system9123@127.0.0.1:6379';
//redis 인스턴스
const redisClient = require('redis').createClient(redisInfo);
// session option
const sessionOption = {
  store: new RedisStore({ client: redisClient, prefix: 'session:'}),
  secret: 'sys!@$#',  
  resave: false, 
  saveUninitialized: false, 
  cookie: { maxAge: 3600000 } // 120 seconds, adjust as needed
};

redisClient.on('connect', () => {
  console.info('Redis connected!');
});
redisClient.on('error', function(err) {
  console.error('Redis Client Error', err);
});

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//* 세션 쿠키 미들웨어 
app.use(cookieParser('sys!@$#'));
app.use(session(sessionOption));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit:'50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(path.join(__dirname, 'tmp')));

app.use('/', index);
app.use('/main', main);
app.use('/login', login);
//app.use('/common', commons);
//
//app.use('/users', users);
//app.use('/login', login);
//app.use('/signup', signup);
//app.use('/board', board);
//app.use('/announce', announce);
//app.use('/mypage', mypage);;
// visit
//app.use('/visit', visit);

app.use(function(req, res, next) {
  res.locals.url = req.originalUrl;
  res.locals.host = req.get('host');
  res.locals.protocol = req.protocol;
  //next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var ss = req.session;
  var err = new Error('Not Found');
  err.status = 404;
  //next(err);
  res.render('./error/404', {'error' : err, 'session' : ss});
});

// error handler

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('./error/error');
});


/**
 * DB ReConnect 함수.
 * @param client
 */
function handleDisconnect(client) {
    client.on('error', function (error) {
        if (!error.fatal) return;
        if (error.code !== 'PROTOCOL_CONNECTION_LOST') throw err;
        console.error('> Re-connecting lost MySQL connection: ' + error.stack);

        // NOTE: This assignment is to a variable from an outer scope; this is extremely important
        // If this said `client =` it wouldn't do what you want. The assignment here is implicitly changed
        // to `global.mysqlClient =` in node.
        global.dbcon = mysql.createConnection(client.config);
        handleDisconnect(global.dbcon);
        global.dbcon.connect();
    });
}
module.exports = app;
