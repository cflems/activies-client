const tabs = ['home', 'post', 'prof', 'show'];
const initializers = [
  function () {
    $('.postlink[href]').click(postclicked);
    phaser({
      'action': 'list',
      'authkey': authkey,
      // TODO: gps coordinates or something?
    });
  },
  function () {
    $('#submitbtn').click(function (e) {
      e.preventDefault();
      phaser({
        'action': 'post',
        'title': $('#posttitle').val(),
        'description': $('#postdesc').val(),
        'location': $('#postloc').val(),
        'authkey': authkey,
        // TODO: picture
        // TODO: GPS coordinates
      });
    });
  },
  function () {
    phaser({
      'action': 'myprof',
      'authkey': authkey,
      // TODO: actually do this
    });
    // wire up all the edit buttons or whatever
  },
  function (args) {
    phaser({
      'action': 'show',
      'id': args[0],
      'authkey': authkey,
    });
  },
];
const d_handlers = [
  function (data) {
    $('#content').html('');
    for (let i = 0; i < data.length; i++) {
      let poststr = `
        <a class="postlink" href="#p${data[i].id}">
      `;
      if (data[i].pic)
        poststr += `
          <div class="post pic">
            <img class="postpic" src="${data[i].pic}" alt="" />
        `;
      else
        poststr += `
          <div class="post nopic">
        `;

      poststr += `
            <p class="username">${data[i].user}</p>
            <p class="title">${data[i].title}</p>
            <p class="desc">${data[i].description}</p>
          </div>
        </a>
      `;
      $('#content').append(poststr);
    }
    $('.postlink[href]').click(postclicked);
  },
  function (data) {
    if (data.status == 'ok') loadtab(0);
    else $('#errorbox').text(data.message);
  },
  function (data) {

  },
  function (data) {
    if (data.status && (data.status == 'liked' || data.status == 'unliked')) {
      $('#likebtn').toggleClass('liked');
      $('#likectr').text(data.likes);
      return;
    }
    $('#posttitle').text(data.title);
    $('#postloc').text(data.location);
    if (data.pic) {
      $('#postpicture').html(`<img src="${data.pic}" alt="" />`);
    }
    $('#postdesc').text(data.description);
    $('#likectr').text(data.likes);
    if (data.i_liked) $('#likebtn').addClass('liked');
    $('#likebtn').click(function (e) {
      phaser({
        'action': ($(this).hasClass('liked') ? 'unlike' : 'like'),
        'id': data.id,
        'authkey': authkey,
      });
    });
  },
];
let tabno, sockfd, reconnect, authkey;

function loadtab (number, ...args) {
  console.log('loadtabbing ', number, ' with (', args, ')');
  $.get('tabs/'+tabs[number]+'.html', (html) => {
    tabno = number;
    $('#content').html(html);
    initializers[number](args);
  });
}

function connectsock () {
  let fd = new WebSocket(WEBSOCK_URI);
  fd.onopen = sockopen;
  fd.onclose = sockerror;
  fd.onerror = sockerror;
  fd.onmessage = sockmessage;
  return fd;
}

function sockopen (e) {
  if (reconnect) {
    clearTimeout(reconnect);
    reconnect = null;
  }
  console.log('Connected!');
}

function sockerror (e) {
  console.warn('Oops!\n', e, '\nReconnecting.');
  if (reconnect) clearTimeout(reconnect);
  reconnect = setTimeout(() => {
    sockfd = connectsock();
  }, 10000);
}

function sockmessage (e) {
  let data = JSON.parse(e.data);
  if (!data) return;
  d_handlers[tabno](data);
}

function phaser (data) {
  if (sockfd.readyState < 1) {
    setTimeout(function () {
      phaser(data);
    }, 1000);
  } else if (sockfd.readyState < 2) sockfd.send(JSON.stringify(data));
}

function postclicked (e) {
  if ($(this).attr('href').startsWith('#p')) {
    e.preventDefault();
    let pid = $(this).attr('href').substr(2);
    console.log('loadtabbing ', tabs.indexOf('show'), ' with data ', pid);
    loadtab(tabs.indexOf('show'), pid);
  }
}

$(function() {
  if (!localStorage.getItem('authkey')) window.location.href = 'login.html';
  else authkey = localStorage.getItem('authkey');
  sockfd = connectsock();
  loadtab(0);
  $('#navbar a[href]').click(function(e) {
    e.preventDefault();
    let tgt = $(this).attr('href');
    if (!tgt.startsWith('#') || tabs.indexOf(tgt.substr(1)) == tabno)
      $('html,body').animate({scrollTop: 0}, 200);
    else loadtab(tabs.indexOf(tgt.substr(1)));
  });
});
