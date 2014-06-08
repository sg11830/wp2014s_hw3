(function () {
    Parse.initialize("89pqd6cMjsmMxkK9XfMWQV2tqnqV8GgqOzYSTM4J", "bMN18coLQjo0hJwqO3wSNOHoarZeApWfAs8uakxf");
    var template = {};

    ["loginView", "evaluationView", "updateSuccessView"].forEach(function (view) {
        templateCode = document.getElementById(view).text;
        template[view] = doT.template(templateCode);
    });

    var t = {
        loginRequiredView: function (e) {
            return function () {
                var currentUser = Parse.User.current();
                if (currentUser) {
                    e()
                } else {
                    window.location.hash = "login/" + window.location.hash
                }
            }
        }
    };
    var content = {
        navbar: function () {
            var currentUser = Parse.User.current();
            if (currentUser) {
                document.getElementById("loginButton").style.display = "none";
                document.getElementById("logoutButton").style.display = "block";
                document.getElementById("evaluationButton").style.display = "block"
            } else {
                document.getElementById("loginButton").style.display = "block";
                document.getElementById("logoutButton").style.display = "none";
                document.getElementById("evaluationButton").style.display = "none"
            }
            document.getElementById("logoutButton").addEventListener("click", function () {
                Parse.User.logOut();
                content.navbar();
                //t.loginRequiredView();
                window.location.hash = "login/"
            })
        },
        evaluationView: t.loginRequiredView(function () {
            var Evaluation = Parse.Object.extend("Evaluation");
            var currentUser = Parse.User.current();
            var setACL = new Parse.ACL;
            setACL.setPublicReadAccess(false);
            setACL.setPublicWriteAccess(false);
            setACL.setReadAccess(currentUser, true);
            setACL.setWriteAccess(currentUser, true);
            var evaluationQuery = new Parse.Query(Evaluation);
            
            evaluationQuery.equalTo("user", currentUser);
            evaluationQuery.first({
                success: function (evaluationQuery) {
                    if (evaluationQuery === undefined) { 
                        var evalObjects = TAHelp.getMemberlistOf(currentUser.get("username")).filter(
                            function (e) {  
                            return e.StudentId !== currentUser.get("username") ? true : false
                            }
                        ).map(function (e) {
                            e.scores = ["0", "0", "0", "0"];
                            return e
                        })
                       
                    } else {
                        var evalObjects = evaluationQuery.toJSON().evaluations;

                    }
                    document.getElementById("content").innerHTML = template.evaluationView(evalObjects);

                    document.getElementById("evaluationForm-submit").value = evaluationQuery === undefined ? "送出表單" : "修改表單"; 
                    document.getElementById("evaluationForm").addEventListener("submit", function () {
                        for (var o = 0; o < evalObjects.length; o++) {
                            for (var u = 0; u < evalObjects[o].scores.length; u++) {
                                var ojectPeer = document.getElementById("stu" + evalObjects[o].StudentId + "-q" + u);
                                var ojectPeerPoint = ojectPeer.options[ojectPeer.selectedIndex].value;
                                evalObjects[o].scores[u] = ojectPeerPoint
                            }
                        }
                        if (evaluationQuery === undefined) {
                            evaluationQuery = new Evaluation;
                            evaluationQuery.set("user", currentUser);
                            evaluationQuery.setACL(setACL)
                        }
                        
                        evaluationQuery.set("evaluations", evalObjects);
                        evaluationQuery.save(null, {
                            success: function () {
                                document.getElementById("content").innerHTML = template.updateSuccessView()
                            },
                            error: function () {}
                        })
                    }, false)
                },
                error: function () {}
            })
        }),
        loginView: function (t) {

            var checkId = function (studentId_htmlid) {
                //console.log(t());
                    var studentId = document.getElementById(studentId_htmlid).value;
                    return TAHelp.getMemberlistOf(studentId) === false ? false : true
                };
            var loginin_alert = function (e, t, n) {
                     
                    if (!t()) {
                        document.getElementById(e).innerHTML = n;

                        document.getElementById(e).style.display = "block"
                    } else {
                        document.getElementById(e).style.display = "none"
                    }
                };
                //console.log(i);
            var s = function () {
                    content.navbar();
                    window.location.hash = t ? t : ""
                };
            var checkPassword = function () {
                    var firstpassword = document.getElementById("form-signup-password");
                    var secondpassword = document.getElementById("form-signup-password1");
                    var result = firstpassword.value === secondpassword.value ? true : false;
                    loginin_alert("form-signup-message", function () {
                        return result
                    }, "Passwords don't match.");
                    return result
                };
            document.getElementById("content").innerHTML = template.loginView();
            document.getElementById("form-signin-student-id").addEventListener("keyup", function () {
                loginin_alert("form-signin-message", function () {
                    return checkId("form-signin-student-id")
                }, "The student is not one of the class students.")
            });
            document.getElementById("form-signin").addEventListener("submit", function () {
                if (!checkId("form-signin-student-id")) {
                    alert("The student is not one of the class students.");
                    return false
                }
                Parse.User.logIn(document.getElementById("form-signin-student-id").value, document.getElementById("form-signin-password").value, {
                    success: function (e) {
                        s()
                    },
                    error: function (e, t) {
                        loginin_alert("form-signin-message", function () {
                            return false
                        }, "Invaild username or password.")
                    }
                })
            }, false);
            document.getElementById("form-signup-student-id").addEventListener("keyup", function () {
                loginin_alert("form-signup-message", function () {
                    return checkId("form-signup-student-id")
                }, "The student is not one of the class students.")
            });
            document.getElementById("form-signup-password1").addEventListener("keyup", checkPassword);
            document.getElementById("form-signup").addEventListener("submit", function () {
                if (!checkId("form-signup-student-id")) {
                    alert("The student is not one of the class students.");
                    return false
                }
                var e = checkPassword();
                if (!e) {
                    return false //return false 這個 loginView: function (t)就會停住了 下面(設定帳號)就不跑了
                }
                var UserAccount = new Parse.User;
                UserAccount.set("username", document.getElementById("form-signup-student-id").value);
                UserAccount.set("password", document.getElementById("form-signup-password").value);
                UserAccount.set("email", document.getElementById("form-signup-email").value);
                UserAccount.signUp(null, {
                    success: function (e) {
                        s()
                    },
                    error: function (e, t) {
                        loginin_alert("form-signup-message", function () {
                            return false
                        }, t.message)
                    }
                })
            }, false)
        }
    };
    var r = Parse.Router.extend({
        routes: {
            "": "indexView",
            "peer-evaluation/": "evaluationView",
            "login/*redirect": "loginView"
        },
        indexView: content.evaluationView,
        evaluationView: content.evaluationView,
        loginView: content.loginView
    });
    this.Router = new r;
    Parse.history.start();
    content.navbar()
})()