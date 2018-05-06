function activate (authkey) {
  localStorage.setItem('authkey', authkey);
  window.location.href = 'index.html';
}

function makesock (obj) {
  let fd = new WebSocket('ws://localhost:2237/activities');
  fd.onopen = function (e) {
    fd.send(JSON.stringify(obj));
  };
  fd.onclose = console.error;
  fd.onerror = console.error;
  fd.onmessage = function (e) {
    if (!e.data) return;
    let resp = JSON.parse(e.data);
    if (resp.status == 'ok') activate(resp.authkey);
    else $('.errbox').text(resp.message);
  };
  return fd;
}

$(function () {
  $('#chooselogin').click(function (e) {
    $('#nav').hide(250);
    $('#loginform').show(250);
  });
  $('#choosereg').click(function (e) {
    $('#nav').hide(250);
    $('#regform').show(250);
  });
  $('#loginbtn').click(function (e) {
    e.preventDefault();
    makesock({
      'action': 'login',
      'uname': $('#inpuser').val(),
      'pass': $('#inppass').val(),
    });
  });
  $('#regbtn').click(function (e) {
    e.preventDefault();
    if ($('#inpnewpass1').val() != $('#inpnewpass2').val()) {
      $('.errbox').text('Passwords don\'t match.');
      return;
    }
    makesock({
      'action': 'register',
      'uname': $('#inpnewuser').val(),
      'email': $('#inpnewemail').val(),
      'pass': $('#inpnewpass1').val(),
    });
  });
});
