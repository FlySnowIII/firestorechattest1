firebase.initializeApp(config);
var db = firebase.firestore();
var FirebaseChat = Object;
FirebaseChat.unsubscribe = function(){console.log("StopAllChat")};


/***
 * roomlistListen
 * 
 * @objid: アカウントid
 * @usertype: アカウントタイプ(com or user)
 * @startAt: 開始行
 * @fun_run(dataObj,type): チャットルームデータを処理する
 * dataobjの構造:
 * dataObj: {
 *      comid: comid,
 *      jobid: jobid,
 *      userid: userid,
 *      isnewcommsg: true,
 *      isnewusermsg: false,
 *      timestamp: Date.now(),
 *      infos: {
 *          jobinfo: {
 *              title: "abcdefg"
 *          },
 *          userinfo: {
 *              username: "Pengfei Tang"
 *          }
 *      }
 *  }
 * 
 * type:added/modified/removed
 * 
 **/
FirebaseChat.roomlistListen = function(objid,usertype,fun_run)
{
    
    db.collection("rooms")
        .where(usertype+"id", "==",objid.toString())
        .orderBy("timestamp")
        .onSnapshot(function(snapshot) {
            snapshot.docChanges.forEach(function(change)
            {
                var dataObj = change.doc.data();
                fun_run(dataObj,change.type);
            });
        });
};

/***
 * chatListen
 * 
 * @jobid: 案件ID
 * @userid: ユーザーID
 * @fun_run(msgObj,type): チャットデータを処理する
 * msgObjの構造:
 * msgObj:{
 *      from: _usertype,
 *      msg: msg,
 *      timestamp: Date.now()
 *  }
 * 
 **/
FirebaseChat.chatListen =function(jobid,userid,fun_run)
{
    FirebaseChat.unsubscribe();
    FirebaseChat.unsubscribe = db.collection("rooms")
                    .doc("jobid" + jobid + "userid" + userid)
                    .collection("messages")
                    .orderBy("timestamp")
                    .onSnapshot(function(snapshot) {
                        snapshot.docChanges.forEach(function(change)
                        {
                            var msgObj = change.doc.data();
                            fun_run(msgObj,change.type);
                        });
                    });
};

/***
 * sendmsg
 * 
 * @comid: 企業ID
 * @jobid: 案件ID
 * @userid: ユーザーID
 * @usertype: アカウントタイプ(com or user)
 * @msg: テキストメッセージ
 * @jobinfoJson: 案件情報(JSON)
 * @userinfoJson: ユーザー情報(JSON)
 * @fun_finish(): 送信成功後実行する
 * 
 **/
FirebaseChat.sendmsg = function(comid,jobid,userid,usertype,msg,jobinfoJson,userinfoJson,fun_finish=null)
{
    var roomname = 'jobid' + jobid + 'userid' + userid;
    var roomRef = db.collection('rooms').doc(roomname);
    roomRef.set({
        comid: comid.toString(),
        jobid: jobid.toString(),
        userid: userid.toString(),
        isnewcommsg: usertype == 'user'?true:false,
        isnewusermsg: usertype == 'user'?false:true,
        timestamp: Date.now(),
        infos: {
            jobinfo: jobinfoJson,
            userinfo: userinfoJson,
        },

    })
    .then(function () {
        // console.log("Document successfully written!");
    })
    .catch(function (error) {
        console.error("Error writing document: ", error);
    });

    var messageRef = roomRef.collection('messages')
    messageRef.add({
        from: usertype,
        msg: msg,
        timestamp: Date.now()
    })
    .then(function () {
        // console.log("Document successfully written!");
    })
    .catch(function (error) {
        console.error("Error writing document: ", error);
    });

    if(fun_finish){
        fun_finish();
    }
};