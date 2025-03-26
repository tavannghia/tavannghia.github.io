function findPlayerById(players, id) {
  return players.find((player) => player.id === id) || null;
}

function insertMemberToList(arr, num) {
  let index = arr.findIndex((x) => x.level > num.level);
  if (index === -1) {
    arr.push(num);
  } else {
    arr.splice(index, 0, num);
  }
  return arr;
}

async function kickMember(token, id) {
  try {
    let res = await fetch(
      "https://api-lokc-live.lokchronicle.com/api/guild/kick",
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "sec-ch-ua":
            '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "x-access-token": token,
          Referer: "https://game.lokchronicle.com/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: `json=%7B%22heroId%22%3A%22${id}%22%7D`,
        method: "POST",
      }
    );
    let data = await res.json();
    return data.result;
  } catch (error) {
    showlog("Token error!");
    isrun = false;
    return null;
  }
}

async function checkMember(token) {
  try {
    currentMemberUpdate = [];
    let res = await fetch(
      "https://api-lokc-live.lokchronicle.com/api/guild/members/list",
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "sec-ch-ua":
            '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "x-access-token": token,
          Referer: "https://game.lokchronicle.com/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: "json=%7B%22guildId%22%3A%22%22%7D",
        method: "POST",
      }
    );
    let data = await res.json();
    if (data.result) {
      for (let k = 0; k < 3; k++) {
        let members = data.members[k].members;
        for (let e of members) {
          let member_data = {
            id: e.hero._id,
            name: e.hero.name,
            rank: k + 1,
            level: e.hero.level,
            power: e.hero.power,
            online: getFormattedTime(), // Mặc định là online
            contribute: e.contribution,
          };
          let wl = whilelist.indexOf(member_data.id);
          if (wl >= 0) member_data.name = member_data.name + " (whilelist)";
          let oldplayer = findPlayerById(currentMember, member_data.id);

          if (oldplayer && !e.hero.logined)
            member_data.online = oldplayer.online;
          currentMemberUpdate = insertMemberToList(
            currentMemberUpdate,
            member_data
          );
        }
      }
      currentMember = currentMemberUpdate;
      showlog("số thành viên hiện tại: " + currentMember.length);
      loadPlayerList();
      return true;
    } else {
      showlog("token error");
      isrun = false;
      return false;
    }
  } catch (error) {
    showlog("token error");
    isrun = false;
    return false;
  }
}

async function kickOfflineMembers(nums = null) {
  let onlineMember = currentMember.filter((member) => {
    let currentTime = getFormattedTime();
    let gapTime = differenceInMinutes(member.online, currentTime);
    let result = gapTime <= 0;
    return result;
  });
  let offlineMembers = currentMember.filter((member) => {
    let currentTime = getFormattedTime();
    let gapTime = differenceInMinutes(member.online, currentTime);
    let wl = whilelist.indexOf(member.id);
    let result =
      wl < 0 &&
      gapTime >= time &&
      member.rank >= rank &&
      member.level < minlevelnotkick &&
      member.power < minpowernotkick;

    return result;
  });
  showlog(`Số thành viên có thể kich: ${offlineMembers.length}`);
  showlog(`Số thành viên đang online: ${onlineMember.length}`);
  if (nums == null) {
    if (currentMember.length <= min) {
      return;
    }
    for (let member of offlineMembers) {
      if (currentMember.length <= min) {
        showlog("Đã đạt số lượng thành viên tối thiểu.");
        break;
      }

      let result = await kickMember(token, member.id);
      if (result) {
        showlog(
          `Đã kick: ${member.name} (Level: ${member.level}) - Online: ${member.online}`
        );
        currentMember = currentMember.filter((m) => m.id !== member.id);
        loadPlayerList();
        await delay(1000);
      }
    }
  } else {
    for (let member of offlineMembers) {
      if (currentMember.length <= 20 - nums) {
        showlog("Đã đạt số lượng cần kick.");
        break;
      }

      let result = await kickMember(token, member.id);
      if (result) {
        showlog(
          `Đã kick: ${member.name} (Level: ${member.level}) - Online: ${member.online}`
        );
        currentMember = currentMember.filter((m) => m.id !== member.id);
        loadPlayerList();
        await delay(1000);
      }
    }
  }
}

async function checkmemberrequest() {
  try {
    let updaterq = [];
    let data = await fetch(
      "https://api-lokc-live.lokchronicle.com/api/guild/request/list",
      {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9,vi;q=0.8",
          "content-type": "application/x-www-form-urlencoded",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "x-access-token": token,
          Referer: "https://game.lokchronicle.com/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: "json=%7B%7D",
        method: "POST",
      }
    );
    let res_ = await data.json();
    if (!res_.result) return null;
    let res = res_.requestList;
    for (let i = 0; i < res.length; i++) {
      let member_data = {
        id: res[i].hero._id,
        name: res[i].hero.name,
        level: res[i].hero.level,
        power: res[i].hero.power,
      };
      if (
        member_data.power >= minpowaccept ||
        member_data.level >= minlevelaccept
      ) {
        updaterq = insertMemberToList(updaterq, member_data);
      } else {
        await rejectmember(member_data);
      }
    }
    currentrequest = updaterq;
    return currentrequest;
  } catch (error) {
    return null;
  }
}
async function acceptmember(member) {
  try {
    let data = await fetch(
      "https://api-lokc-live.lokchronicle.com/api/guild/request/accept",
      {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9,vi;q=0.8",
          "content-type": "application/x-www-form-urlencoded",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "x-access-token": token,
          Referer: "https://game.lokchronicle.com/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: `json=%7B%22heroId%22%3A%22${member.id}%22%7D`,
        method: "POST",
      }
    );
    let res = await data.json();
    if (res.result) {
      showlog("đã accept " + member.name);
      checkMember(token);
    } else {
      showlog("lỗi accept " + member.name);
    }
  } catch (error) {
    showlog("lỗi accept");
  }
}
async function rejectmember(member) {
  try {
    let data = await fetch(
      "https://api-lokc-live.lokchronicle.com/api/guild/request/deny",
      {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9,vi;q=0.8",
          "content-type": "application/x-www-form-urlencoded",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "x-access-token": token,
          Referer: "https://game.lokchronicle.com/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: `json=%7B%22heroId%22%3A%22${member.id}%22%7D`,
        method: "POST",
      }
    );
    let res = await data.json();
    if (res.result) {
      showlog("đã từ chối " + member.name);
      checkMember(token);
    } else {
      showlog("lỗi từ chối " + member.name);
    }
  } catch (error) {
    showlog("lỗi từ chối");
  }
}
async function startQuest(id = 1007) {
  //nhận nv
  try {
    let dt = await fetch(
      "https://api-lokc-live.lokchronicle.com/api/guild/quest/accept",
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "sec-ch-ua":
            '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "x-access-token": token,
          Referer: "https://game.lokchronicle.com/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: `json=%7B%22code%22%3A${id}%7D`,
        method: "POST",
      }
    );
    let res = await dt.json();
    console.log(res);
    return res.result;
  } catch (error) {
    return false;
  }
}
async function checkCurrentQuest() {
  //nhận nv
  try {
    let dt = await fetch(
      "https://api-lokc-live.lokchronicle.com/api/guild/quest/get/current",
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "sec-ch-ua":
            '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "x-access-token": token,
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: "json=%7B%7D",
        method: "POST",
      }
    );
    let res = await dt.json();
    if (res.quest.targets) {
      let q = [];
      for (let i = 0; i < res.quest.targets.length; i++) {
        q.push(
          res.quest.targets[i].value + "/" + res.quest.targets[i].targetValue
        );
      }
      return q;
    } else return null;
  } catch (error) {
    return null;
  }
}
async function checkquest() {
  while (isrun) {
    let dt = await checkCurrentQuest();
    if (dt == null) {
      let st = await startQuest();
      if (!st) {
        showlog("lỗi nhận nv");
        break;
      } else showlog("đã nhận nv");
    } else showlog(`nhiệm vụ hiện tại: ${dt}`);
    await delay(60000);
  }
}
async function start() {
  token = document.getElementById("tokenInput").value;
  min = parseFloat(document.getElementById("min").value);
  time = parseFloat(document.getElementById("time").value); //100 giây offline là kích
  //time = Math.round((Number(time) * 1000) / 10000);
  rank = parseFloat(document.getElementById("rank").value);
  minpowaccept =
    parseFloat(document.getElementById("minpowaccept").value) >= 0
      ? parseFloat(document.getElementById("minpowaccept").value)
      : 0;
  minlevelaccept =
    parseFloat(document.getElementById("minlevelaccept").value) >= 0
      ? parseFloat(document.getElementById("minlevelaccept").value)
      : 0;
  minpowernotkick =
    parseFloat(document.getElementById("minpowernotkick").value) > 0
      ? parseFloat(document.getElementById("minpowernotkick").value)
      : 100000000;
  minlevelnotkick =
    parseFloat(document.getElementById("minlevelnotkick").value) > 0
      ? parseFloat(document.getElementById("minlevelnotkick").value)
      : 10000;
  if (token == "" || min > 19 || time < 1 || rank > 3 || min < 3 || rank < 1) {
    console.log(token == "");
    console.log(min > 19);
    console.log(time < 15);
    console.log(time);
    console.log(rank > 3);

    showlog(`bạn vừa nhập:  min: ${min} + time: ${time} + rank: ${rank}`);
    showlog("token || min < 20  || time > 14 giây || rank <= 3");
    showlog("Vui lòng nhập đúng");
    return;
  }

  if (isrun == true) return;
  else isrun = true;
  checkquest();
  while (isrun) {
    let k = await checkMember(token);
    if (k == false) break;
    let l = await kickOfflineMembers();
    await delay(1000);
    await checkmemberrequest();
    if (currentrequest.length > 0) {
      await kickOfflineMembers(currentrequest.length);
      for (let i = 0; i < currentrequest.length; i++) {
        if (currentMember.length == 20) break;
        await acceptmember(currentrequest[i]);
      }
    }
    await delay(10000);
    clearLog();
  }
  currentMember = [];
  currentMemberUpdate = [];
  showlog("đã dừng script");
}
