    var https = require('https');
    var fs = require('fs');
    var ca = fs.readFileSync('./cert/srca.cer.pem');//证书文件，已有(过期自己补)
    var nodemailer = require('nodemailer');
    var schedule = require('node-schedule');
    var config = {
        time:'2018-02-21',//日期格式必须是这样
        from_station:'LZZ',//始发站车站代码，武汉
        end_station:'WHN',//柳州，可根据12306网页查询response数据确认站点编号
        train_num:'G530',//车次
        your_mail:'xxx@163.com',
        mail_pass:'yyy'//这里密码不是邮箱密码，是你设置的smtp密码
    };
    function queryTickets(config){
        var options = { 
            rejectUnauthorized: false,
            hostname: 'kyfw.12306.cn',//12306
            path: '/otn/leftTicket/queryZ?leftTicketDTO.train_date='+config.time+'&leftTicketDTO.from_station='+config.from_station+'&leftTicketDTO.to_station='+config.end_station+'&purpose_codes=ADULT',
            ca:[ca]//证书
        };
        var req = https.get(options, function(res){ 
        var data = '';
        var transporter = nodemailer.createTransport({
            host: "smtp.163.com",//邮箱的服务器地址，如果你要换其他类型邮箱（如QQ）的话，你要去找他们对应的服务器，
            secureConnection: true,
            port:465,//端口，这些都是163给定的，自己到网上查163邮箱的服务器信息
            auth: {
                user: 'xxx@163.com',//邮箱账号
                pass: 'yyy',//邮箱smtp密码
            }
        });
        res.on('data',function(buff){
            data += buff;//查询结果（JSON格式的字符串）
        }); 
       res.on('end',function(){

        //解析查询结果,这里针对高铁二等座，可根据所需车次调整
            var content=data.split(',');
            for (var i = content.length - 1; i >= 0; i--) {
                var temp=content[i].split('|');
                //找到匹配列车的售票数据
                if(temp.indexOf(config.train_num)!=-1){
                    if(temp[30]=='无'){
                        console.log('好惨啊！'+config.train_num+'二等座'+'没有票!');
                    }else{
                        var ticket_num=temp[30];
                        if(ticket_num=='有'){
                            ticket_num='大量票';
                        }
                         var mailOptions = {
                            from: config.your_mail, // 发件邮箱地址
                            to: config.your_mail, // 收件邮箱地址，可以和发件邮箱一样
                            subject: config.train_num+config.time+'柳州到武汉余票提醒', // 邮件标题
                            text: config.train_num+'有'+ticket_num+'票！\n'+'发车时间：'+temp[8]+' 到达时间：'+temp[9]+' 历时：'+temp[10]//邮件内容
                        };
                        // 发邮件部分
                        transporter.sendMail(mailOptions, function(error, info){
                            if(error){
                                return console.log(error);
                            }
                            console.log('Message sent: ' + info.response);
                        });

                    }
                
                }
            }
           
           
           
                        
        })  
    });
    
    req.on('error', function(err){
        console.error(err.code);
    });
    }
    //每分钟都执行程序
    var rule = new schedule.RecurrenceRule();  
    rule.second = [0];
    schedule.scheduleJob(rule, function(){
            queryTickets(config);
            console.log('scheduleCronstyle:' + new Date());
    }); 