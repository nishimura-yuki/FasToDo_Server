var api_key = 'key-a8bcbc1dc184415cd5d9bccc8796d1dd';
var domain = 'appd96b911512e44b33bf6d6c2df01c6cfe.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

module.exports.send = function( email, fn ){
    console.log(email);
    var data = {
      from: 'FasToDo <info@fastodo.mailgun.org>',
      to: email,
      subject: 'Thank you for register',
      text: 'Please enjoy our service!'
    };
    mailgun.messages().send(data, function(err, body) {
        if(err) return fn(err);
        console.log(body);
        fn(null);
    });
}
