const express = require('express');
const mysql = require('mysql');


const app = express();
app.set('port', process.env.PORT || 3000);

let connection = mysql.createConnection({
host     : 'localhost',
user     : 'root',
password : 'dblab',
database : 'Test_in_my_head',
connectTimeout : 180000
});


app.post('/checkOverlap', (req, res) => {
    console.log('post /checkOverlap');
    let inputData;
    let overlapSql;

    req.on('data', (data) => {
        inputData = JSON.parse(data);
    });
    req.on('end', () => {
        if (inputData.id != undefined)                                                                           // id 중복 확인 버튼이라면
            overlapSql = "SELECT * FROM member_info WHERE id = '" + inputData.id + "';";                // ex) select * from member_info WHERE id = 'park';
        else                                                                                            // 아니면 닉네임 중복 확인 버튼
            overlapSql = "SELECT * FROM member_info WHERE nickname = '" + inputData.nickname + "';";
        console.log(overlapSql);

        connection.query(overlapSql, (error, result, fileds) => {
            if (error) throw error;
            
            console.log(result)
            if (result[0] == undefined)
                res.write("can be used,");
            else
                res.write("overlap,");
            res.end();
        });
    });
});

app.post('/login', (req, res) => {
    console.log('post /login');
    let inputData;

    req.on('data', (data) => {
        inputData = JSON.parse(data);
    });

    req.on('end', () => {
        console.log(inputData.id);
        const checkIdSql = "SELECT * FROM member_info WHERE id = ?";
        const checkNicknameSql = "SELECT * FROM score WHERE nickname = ?;"

        connection.query(checkIdSql , [inputData.id], (error, loginResult, fileds) => {
            if (error) throw error;

            console.log(loginResult);
            if (loginResult[0] == undefined){
                res.write("Login id fail,");
                res.end();
            }
            else if (loginResult[0].password == inputData.password){
                console.log(loginResult[0].nickname);
                connection.query(checkNicknameSql, [loginResult[0].nickname],(error, scoreResult, fileds) => {
                    if (error) throw error;
                    console.log("scoreResult: " + scoreResult[0]);
                    const user = "Login success," + scoreResult[0].nickname + "," + scoreResult[0].N_Back + "," +
                                                    scoreResult[0].DWMT + "," + scoreResult[0].Guess_Number + "," + scoreResult[0].Total;
                    console.log(user);
                    res.write(user);
                    res.end();
                });
            }
            else{
                res.write("Login pw fail,");
                res.end();
            }
        });
    });
});

app.post('/join', (req, res) => {
    console.log('post /join');
    let inputData;
    
    req.on('data', (data) => {
        inputData = JSON.parse(data);
    });
    req.on('end', () => {
        const memberInfoSql = "INSERT INTO member_info values (?, ?, ?, ?, ?, ?);";
        const scoreSql = "INSERT INTO score values (?, 0, 0, 0, 0);";
        console.log(inputData);

        connection.query(memberInfoSql, [inputData.id, inputData.pw, inputData.name, 
                                        inputData.phoneNumber, inputData.email, inputData.nickname], (error, result, fileds) => {
            if (error) throw error;
        });
        connection.query(scoreSql, [inputData.nickname], (error, result, fileds) => {
            if (error) throw error;
            res.write("Join success,");
            res.end();
        });
    });
});

app.post('/showAllRank', (req, res) => {
    console.log('post /showAllRank');

    let rankInfo = "show rank,";
    const rankSql = "SELECT * FROM score ORDER BY total DESC LIMIT 10;";
    
    let inputData;
    req.on('data', (data) => {
        inputData = JSON.parse(data);
    });
    req.on('end', () => {
        connection.query(rankSql, (error, result, fileds) => {
            if (error) throw error;
            
            console.log(result);
            for(let i=0; i<result.length; i++){
                rankInfo += result[i].nickname +",";
                rankInfo += result[i].N_Back +",";
                rankInfo += result[i].DWMT +",";
                rankInfo += result[i].Guess_Number +",";
                rankInfo += result[i].Total +",";
            }
            if (result[0] != undefined)
                res.write(rankInfo);
            else
                res.write("error,");
            res.end();
        });
    });

});

app.post('/showPartRank', (req, res) => {
    console.log('post /showOneRank');

    let inputData;
    let rankSql;

    req.on('data', (data) => {
        inputData = JSON.parse(data);
        switch(inputData.partRank){
            case "NB":
                rankSql = "SELECT nickname, N_Back FROM score ORDER BY N_Back DESC LIMIT 10;";
                break;
            case "DT":
                rankSql = "SELECT nickname, DWMT FROM score ORDER BY DWMT DESC LIMIT 10;";
                break;
            case "GN":
                rankSql = "SELECT nickname, Guess_Number FROM score ORDER BY Guess_Number DESC LIMIT 10;";
                break;
            default:
                break;
        }
    });
    req.on('end', () => {
        console.log(rankSql);
        let partRankInfo = "show rank,";

        connection.query(rankSql, (error, result, fileds) => {
            if (error) throw error;
            
            console.log(result);
            for(let i=0; i<result.length; i++){
                partRankInfo += result[i].nickname +",";
                partRankInfo += result[i][Object.keys(result[i])[1]] +",";
            }
            if (result[0] != undefined)
                res.write(partRankInfo);
            else
                res.write("error,");
            res.end();
        });
    });
});

/*
app.post('/showMyRank', (req, res) => {
    console.log('post /showAllRank');

    let myRankRes = "show rank,";
    const tableArray = ['Total', 'N_Back', 'DWMT', 'Guess_Number'];
    let myRankSql = "select nickname, N_Back, ranking from (select *, rank() over (order by N_Back desc) as ranking from score) ranked where nickname = ?;";
    
    let inputData;
    req.on('data', (data) => {
        inputData = JSON.parse(data);
    });
    req.on('end', () => {
        for (var i in tableArray){
            myRankSql = "select * from (select *, rank() over (order by "+tableArray[i]+" desc) as ranking from score) ranked where nickname = ?;";
            connection.query(myRankSql, (error, result, fileds) => {
                if (error) throw error;
                
                console.log(result);
                for(let i=0; i<result.length; i++){
                    myRankRes += result[i].ranking +",";
                    myRankRes += result[i].nickname +",";
                    myRankRes += result[i].N_Back +",";
                    myRankRes += result[i].DWMT +",";
                    myRankRes += result[i].Guess_Number +",";
                    myRankRes += result[i].Total +",";
                }
            });
            console.log(myRankSql);
        }
        if (result[0] != undefined)
            res.write(myRankRes);
        else
            res.write("error,");
        res.end();

    });

});
*/

app.post('/setScore', (req, res) => {
    console.log('post /join');
    let inputData;
    
    req.on('data', (data) => {
        inputData = JSON.parse(data);
    });
    req.on('end', () => {
        const setScoreSql = "UPDATE score SET " + inputData.game + " = " + inputData.game + " + ?, Total = Total + ? WHERE nickname = ?;";
        console.log(inputData);
        console.log(setScoreSql);

        connection.query(setScoreSql, [inputData.plusScore, inputData.plusScore, inputData.nickname], (error, result, fileds) => {
            if (error) throw error;
            
            res.write("set Score success,");
            res.end();
        });
    });
});


app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});