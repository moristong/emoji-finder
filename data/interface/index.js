var background = (function () {
  let tmp = {};
  if (chrome && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function (request) {
      for (let id in tmp) {
        if (tmp[id] && (typeof tmp[id] === "function")) {
          if (request.path === "background-to-popup") {
            if (request.method === id) {
              tmp[id](request.data);
            }
          }
        }
      }
    });
    /*  */
    return {
      "receive": function (id, callback) {
        tmp[id] = callback;
      },
      "send": function (id, data) {
        chrome.runtime.sendMessage({
          "method": id, 
          "data": data,
          "path": "popup-to-background"
        }, function () {
          return chrome.runtime.lastError;
        });
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
    const tmp = document.getElementById("emoji-icon").value;
    if (tmp) {
      e.clipboardData.setData("text/plain", tmp);
    }
  },
  "http": {
    "request": function (url, callback) {
      const xhr = new XMLHttpRequest();
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
          const option = document.createElement("option");
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
      const context = document.documentElement.getAttribute("context");
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
          let tmp = {};
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
      let arr = [];
      let tmp = [];
      /*  */
      keyword = keyword ? keyword.toLowerCase() : '';
      config.storage.write("emoji.keyword", keyword);
      /*  */
      const find = document.getElementById("find");
      const table = document.getElementById("emoji");
      const select = document.getElementById("emoji-select");
      /*  */
      if (keyword && keyword !== "all emojis") {
        if (config.emoji.base[keyword]) {
          select.value = keyword;
          arr = config.emoji.base[keyword];
        } else {
          for (let key in config.emoji.name) {
            let name = config.emoji.name[key].toLowerCase();
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
          let count = 0;
          while (count < arr.length) {
            const tr = document.createElement("tr");
            for (let i = 0; i < 10; i++) {
              if (count < arr.length) {
                const td = document.createElement("td");
                const str = arr[count].split(',');
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
                td.addEventListener("click", async function (e) {
                  const code = e.target.getAttribute("code");
                  const name = e.target.getAttribute("name");
                  const icon = document.getElementById("emoji-icon");
                  const detail = document.getElementById("emoji-detail");
                  const search = document.getElementById("emoji-search");
                  /*  */
                  icon.value = e.target.textContent;
                  if (e.isTrusted) search.value = name;
                  detail.value = " Hex: " + code + " Name: " + name;
                  detail.title = "The emoji is copied to the clipboard!";
                  /*  */
                  config.storage.write("emoji.code", code);
                  const result = await navigator.permissions.query({"name": "clipboard-write"});
                  if (e.isTrusted && result.state === "granted") {
                    navigator.clipboard.writeText(code);
                  }
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
            const emoji = document.getElementById("emoji");
            const selector = "td[code='" + config.emoji.selected + "']";
            /*  */
            const target = document.querySelector(selector);
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
      const path = chrome.runtime.getURL("/data/interface/" + config.path);
      /*  */
      config.http.request(path, function (e) {
        if (e) {
          config.emoji = e;
          /*  */
          const all = document.getElementById("all");
          const find = document.getElementById("find");
          const select = document.createElement("select");
          const toggle = document.getElementById("toggle");
          const reload = document.getElementById("reload");
          const support = document.getElementById("support");
          const category = document.getElementById("category");
          const donation = document.getElementById("donation");
          const buttons = [...category.querySelectorAll("td")];
          const container = document.querySelector(".container");
          const search = document.getElementById("emoji-search");
          const state = config.storage.read("emoji.toggle") !== undefined ? config.storage.read("emoji.toggle") : "hide";
          /*  */
          toggle.setAttribute("state", state);
          category.setAttribute("state", state);
          container.setAttribute("state", state);
          select.setAttribute("id", "emoji-select");
          toggle.setAttribute("title", state === "hide" ? "Show icon categories" : "Hide icon categories");
          /*  */
          config.add.option.to.select("Select", '', select);
          config.add.option.to.select("All", "all emojis", select);
          for (let id in config.emoji.base) config.add.option.to.select(id, id, select);
          all.appendChild(select);
          /*  */
          for (let i = 0; i < buttons.length; i++) {
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
            if (e.code === 13) {
              config.app.fill(e.target.value);
            }
          });
          /*  */
          toggle.addEventListener("click", function () {
            const state = toggle.getAttribute("state") === "hide" ? "show" : "hide";
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
