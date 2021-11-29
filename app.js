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

    req.on('data', (data) => {
        inputData = JSON.parse(data);
    });
    req.on('end', () => {
        console.log(inputData.overlapSQL);

        connection.query(inputData.overlapSQL, (error, result, fileds) => {
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
        console.log(inputData.loginIdSQL);

        connection.query(inputData.loginIdSQL, (error, loginResult, fileds) => {
            if (error) throw error;

            console.log(loginResult);
            if (loginResult[0] == undefined){
                res.write("Login id fail,");
                res.end();
            }
            else if (loginResult[0].password == inputData.password){
                console.log(loginResult[0].nickname);
                connection.query("SELECT * FROM score WHERE nickname = ?;", [loginResult[0].nickname],(error, scoreResult, fileds) => {
                    if (error) throw error;
                    console.log("scoreResult: " + scoreResult[0]);
                    const user = "Login success," + scoreResult[0].nickname + "," + scoreResult[0].N_Back + "," +
                                                    scoreResult[0].DWMT + "," + scoreResult[0].Guess_Nuber + "," + scoreResult[0].Total;
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
        console.log(inputData.memberInfoSQL);
        console.log(inputData.scoreSQL);

        connection.query(inputData.memberInfoSQL, (error, result, fileds) => {
            if (error) throw error;
        });
        connection.query(inputData.scoreSQL, (error, result, fileds) => {
            if (error) throw error;
            res.write("Join success,");
            res.end();
        });
    });
});

app.post('/showRank', (req, res) => {
    console.log('post /showRank');

    let inputData;

    req.on('data', (data) => {
        inputData = JSON.parse(data);
    });
    req.on('end', () => {
        console.log(inputData.rankSql);
        let rankInfo = "show rank,";

        connection.query(inputData.rankSql, (error, result, fileds) => {
            if (error) throw error;
            
            console.log(result);
            for(let i=0; i<result.length; i++){
                rankInfo += result[i].nickname +",";
                rankInfo += result[i].N_Back +",";
                rankInfo += result[i].DWMT +",";
                rankInfo += result[i].Guess_Nuber +",";
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


app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});