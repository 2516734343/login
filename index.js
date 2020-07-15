const express = require('express');
const session = require('express-session');
const redis = require('redis');
const RedisStore = require('connect-redis')(session);
const cookieParser = require('cookie-parser');
const static = require('express-static')
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

const secret = '123456';
const sessionName = 'session_id';
var users = require('./user').items;
var findUser = function (name,password) {
    return users.find(function (item) {
        return item.name === name && item.password === password;
    })
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/lib',static(__dirname + '/lib'));
//设置cookie
app.use(cookieParser());
//设置session
app.use(session({
    secret:true,
    //重新保存：强制会话保存即使是未修改的。默认为true但是得写上
    resave: true,
    //强制“未初始化”的会话保存到存储
    saveUninitialized: false,
    name: sessionName,
    cookie: { maxAge: 60 * 60 * 24 * 1 },
    // store: new RedisStore({ // redis-server etc/redis.conf  redis-cli
    //     host: '127.0.0.1',
    //     port: '6379',
    //     db: 0,
    //     pass: '',
    //     ttl: 60 * 60 * 24 * 1, //session的有效期为1天(秒)
    // })
    store: new RedisStore({client: redis.createClient(12306,'127.0.0.1')}),
}));

app.get('/', function (req, res) {
    if (req.session.login) {
        res.redirect('/home');
    }
    res.sendFile('index.html', {
        root: path.join(__dirname, ''),
    });
});

app.post("/login", function (req, res) {
    var userExist = findUser(req.body.name, req.body.password);
    if (userExist) {
        req.session.user = req.body.name;
        req.session.login = true;
        res.json({ ret_code: 0, ret_msg: '登录成功' });
    } else {
        res.json({ ret_code: 1, ret_msg: '账号或密码错误' });
    }
});

app.get('/home', function (req, res) {
    res.sendFile('home.html', {
        root: path.join(__dirname, ''),
    });
});

app.get('/logout', function(req, res){
    req.session.destroy();
    res.redirect('/');
})

app.listen(9080);
