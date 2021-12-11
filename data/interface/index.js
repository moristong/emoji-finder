var background = (function () {
  var tmp = {};
  if (chrome && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function (request) {
      for (var id in tmp) {
        if (tmp[id] && (typeof tmp[id] === "function")) {
          if (request.path === "background-to-popup") {
            if (request.method === id) tmp[id](request.data);
          }
        }
      }
    });
    /*  */
    return {
      "receive": function (id, callback) {tmp[id] = callback},
      "send": function (id, data) {
        chrome.runtime.sendMessage({"path": "popup-to-background", "method": id, "data": data});
      }
    }
  } else {
    return {
      "send": function () {},
      "receive": function () {}
    }
  }
})();

var config  = {
  "emoji": {},
  "path": "resources/map.json",
  "load": function () {
    config.storage.load(config.app.start);
    window.removeEventListener("load", config.load, false);
  },
  "copy": function (e) {
    e.preventDefault();
    /*  */
    var tmp = document.getElementById("emoji-icon").value;
    if (tmp) {
      e.clipboardData.setData("text/plain", tmp);
    }
  },
  "http": {
    "request": function (url, callback) {
      var xhr = new XMLHttpRequest();
      xhr.onload = function () {callback(xhr.response)};
      xhr.open("GET", url, true);
      xhr.responseType = "json";
      xhr.send();
    }
  },
  "add": {
    "option": {
      "to": {
        "select": function (txt, val, select) {
          var option = document.createElement("option");
          option.setAttribute("value", val);
          option.textContent = txt;
          select.appendChild(option);
        }
      }
    }
  },
  "port": {
    "name": '',
    "connect": function () {
      config.port.name = "webapp";
      var context = document.documentElement.getAttribute("context");
      /*  */
      if (chrome.runtime) {
        if (chrome.runtime.connect) {
          if (context !== config.port.name) {
            if (document.location.search === "?popup") {
              config.port.name = "popup";
            }
            /*  */
            chrome.runtime.connect({
              "name": config.port.name
            });
          }
        }
      }
      /*  */
      document.documentElement.setAttribute("context", config.port.name);
    }
  },
  "storage": {
    "local": {},
    "read": function (id) {
      return config.storage.local[id];
    },
    "load": function (callback) {
      chrome.storage.local.get(null, function (e) {
        config.storage.local = e;
        callback();
      });
    },
    "write": function (id, data) {
      if (id) {
        if (data !== '' && data !== null && data !== undefined) {
          var tmp = {};
          tmp[id] = data;
          config.storage.local[id] = data;
          chrome.storage.local.set(tmp, function () {});
        } else {
          delete config.storage.local[id];
          chrome.storage.local.remove(id, function () {});
        }
      }
    }
  },
  "app": {
    "fill": function (keyword) {
      var arr = [];
      var tmp = [];
      /*  */
      keyword = keyword ? keyword.toLowerCase() : '';
      config.storage.write("emoji.keyword", keyword);
      /*  */
      var find = document.getElementById("find");
      var table = document.getElementById("emoji");
      var select = document.getElementById("emoji-select");
      /*  */
      if (keyword && keyword !== "all emojis") {
        if (config.emoji.base[keyword]) {
          select.value = keyword;
          arr = config.emoji.base[keyword];
        } else {
          for (var key in config.emoji.name) {
            var name = config.emoji.name[key].toLowerCase();
            if (name.indexOf(keyword) !== -1) {
              tmp.push(key);
            }
          }
          /*  */
          arr = tmp;
          select.selectedIndex = 1;
        }
      } else {
        arr = config.emoji.list;
        select.selectedIndex = 1;
      }
      /*  */
      table.textContent = '';
      find.textContent = "Loading...";
      /*  */
      window.setTimeout(function () {
        if (arr.length) {
          var count = 0;
          while (count < arr.length) {
            var tr = document.createElement("tr");
            for (var i = 0; i < 10; i++) {
              if (count < arr.length) {
                var td = document.createElement("td");
                var str = arr[count].split(',');
                /*  */
                td.setAttribute("code", arr[count]);
                td.setAttribute("name", config.emoji.name[arr[count]] ? config.emoji.name[arr[count]].toLowerCase() : "N/A");
                /*  */
                switch (str.length) {
                  case 1: try {td.textContent = String.fromCodePoint(str[0])} catch (e) {}; break;
                  case 2: try {td.textContent = String.fromCodePoint(str[0], str[1])} catch (e) {}; break;
                  case 3: try {td.textContent = String.fromCodePoint(str[0], str[1], str[2])} catch (e) {}; break;
                  case 4: try {td.textContent = String.fromCodePoint(str[0], str[1], str[2], str[3])} catch (e) {}; break;
                  case 5: try {td.textContent = String.fromCodePoint(str[0], str[1], str[2], str[3], str[4])} catch (e) {}; break;
                }
                /*  */
                td.addEventListener("click", function (e) {
                  var code = e.target.getAttribute("code");
                  var name = e.target.getAttribute("name");
                  /*  */
                  var icon = document.getElementById("emoji-icon");
                  var detail = document.getElementById("emoji-detail");
                  var search = document.getElementById("emoji-search");
                  /*  */
                  icon.value = e.target.textContent;
                  if (e.isTrusted) search.value = name;
                  detail.value = " Hex: " + code + " Name: " + name;
                  detail.title = "The emoji is copied to the clipboard!";
                  /*  */
                  config.storage.write("emoji.code", code);
                  document.execCommand("copy");
                });
                /*  */
                tr.appendChild(td);
                count++;
              }
            }
            /*  */
            table.appendChild(tr);
          }
          /*  */
          window.setTimeout(function () {
            var emoji = document.getElementById("emoji");
            var selector = "td[code='" + config.emoji.selected + "']";
            /*  */
            var target = document.querySelector(selector);
            if (target) {
              target.click();
            } else {
              emoji.querySelector("td").click();
            }
          }, 300);
        }
        /*  */
        find.textContent = "Find";
      }, 300);
    },
    "start": function () {
      var path = chrome.runtime.getURL("/data/interface/" + config.path);
      /*  */
      config.http.request(path, function (e) {
        if (e) {
          config.emoji = e;
          /*  */
          var all = document.getElementById("all");
          var find = document.getElementById("find");
          var select = document.createElement("select");
          var toggle = document.getElementById("toggle");
          var reload = document.getElementById("reload");
          var support = document.getElementById("support");
          var category = document.getElementById("category");
          var donation = document.getElementById("donation");
          var buttons = [...category.querySelectorAll("td")];
          var container = document.querySelector(".container");
          var search = document.getElementById("emoji-search");
          var state = config.storage.read("emoji.toggle") !== undefined ? config.storage.read("emoji.toggle") : "hide";
          /*  */
          toggle.setAttribute("state", state);
          category.setAttribute("state", state);
          container.setAttribute("state", state);
          select.setAttribute("id", "emoji-select");
          toggle.setAttribute("title", state === "hide" ? "Show icon categories" : "Hide icon categories");
          /*  */
          config.add.option.to.select("Select", '', select);
          config.add.option.to.select("All", "all emojis", select);
          for (var id in config.emoji.base) config.add.option.to.select(id, id, select);
          all.appendChild(select);
          /*  */
          for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener("click", function (e) {
              config.app.fill(e.target.getAttribute("id"));
            });
          }
          /*  */
          select.addEventListener("change", function (e) {
            search.value = e.target.value;
            config.app.fill(search.value);
          });
          /*  */
          search.addEventListener("keypress", function (e) {
            if ((e.which || e.keyCode) === 13) {
              config.app.fill(e.target.value);
            }
          });
          /*  */
          toggle.addEventListener("click", function () {
            var state = toggle.getAttribute("state") === "hide" ? "show" : "hide";
            /*  */
            toggle.setAttribute("state", state);
            category.setAttribute("state", state);
            container.setAttribute("state", state);
            config.storage.write("emoji.toggle", state);
            toggle.setAttribute("title", state === "hide" ? "Show icon categories" : "Hide icon categories");
          });
          /*  */
          reload.addEventListener("click", function () {document.location.reload()});
          find.addEventListener("click", function () {config.app.fill(search.value)});
          support.addEventListener("click", function () {background.send("support")});
          donation.addEventListener("click", function () {background.send("donation")});
          search.addEventListener("input", function (e) {config.app.fill(e.target.value)});
          /*  */
          if (navigator.userAgent.indexOf("Edg") !== -1) document.getElementById("explore").style.display = "none";
          search.value = config.storage.read("emoji.keyword") !== undefined ? config.storage.read("emoji.keyword") : "smiley";
          config.emoji.selected = config.storage.read("emoji.code") !== undefined ? config.storage.read("emoji.code") : "0x1f600";
          /*  */
          config.app.fill(search.value);
        }
      });
    }
  }
};

config.port.connect();
document.addEventListener("copy", config.copy);
window.addEventListener("load", config.load, false);