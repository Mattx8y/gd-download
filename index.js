const pako = require("pako");

const fs = require("fs");
const http = require("http");
const path = require("path");
const querystring = require("querystring");
const zlib = require("zlib");

const levelID = parseInt(process.argv[2]);

/*
   =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    Credit to GDColon for the below function
    Taken from https://github.com/GDColon/MC2GD/blob/master/convert.js
   =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
 */

function xor(str, key) {
    str = String(str).split('').map(letter => letter.charCodeAt(0));
    let res = "";
    for (let i = 0; i < str.length; i++) res += String.fromCodePoint(str[i] ^ key);
    return res;
}

if (isNaN(levelID)) {
    console.error("%s is not a valid level ID.", process.argv[2]);
    process.exit(1);
}

const requestBody = querystring.stringify({
    levelID,
    gameVersion: "21",
    binaryVersion: "35",
    secret: "Wmfd2893gb7"
});

const request = http.request("http://boomlings.com/database/downloadGJLevel22.php", {
    method: "POST",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(requestBody)
    }
}, function(response) {
    let responseBody = "";

    response.on("data", chunk => responseBody += chunk);

    response.on("error", function() {
        console.error("%d is not a valid level ID.", levelID);
        process.exit(1);
    });

    response.on("end", function() {
        if (!responseBody || responseBody === "-1") {
            console.error("%d is not a valid level ID.", levelID);
            return process.exit(1);
        }

        responseBody = responseBody.split("#")[0].split(":");

        let levelData = pako.inflate(Buffer.from(responseBody[7], "base64"), {to: "string"}).toString("utf8");

        let saveData = fs.readFileSync(path.join(process.env.LOCALAPPDATA, "GeometryDash/CCLocalLevels.dat"), "utf8");
        if (!saveData.startsWith("<?xml version=\"1.0\"?>")) saveData = zlib.unzipSync(Buffer.from(xor(saveData, 11), "base64")).toString("utf8");

        saveData = saveData.split("<k>_isArr</k><t />");
        saveData[1] = saveData[1].replace(/<k>k_(\d+)<\/k><d><k>kCEK<\/k>/g, function(n) { return "<k>k_" + (Number(n.slice(5).split("<")[0])+1) + "</k><d><k>kCEK</k>" })
        saveData = `${saveData[0]}<k>_isArr</k><t /><k>k_0</k><d><k>kCEK</k><i>4</i><k>k1</k><i>0</i><k>k2</k><s>${responseBody[3]}</s><k>k4</k><s>${levelData}</s><k>k3</k><s>${Buffer.from(responseBody[5], "base64").toString() || "(No description provided)"}</s><k>k14</k><t /><k>k46</k><i>0</i><k>k5</k><s></s><k>k13</k><t /><k>k21</k><i>2</i><k>k48</k><i>${levelData.split(";").length - 1}</i><k>k16</k><i>1</i><k>k23</k><s>3</s><k>k8</k><i>0</i><k>k45</k><i>0</i><k>k80</k><i>0</i><k>k50</k><i>0</i><k>k47</k><t /><k>k84</k><i>0</i><k>kI1</k><r>0</r><k>kI2</k><r>0</r><k>kI3</k><r>0</r><k>kI5</k><i>6</i><k>kI6</k><d><k>0</k><s>0</s><k>1</k><s>0</s><k>2</k><s>0</s><k>3</k><s>0</s><k>4</k><s>0</s><k>5</k><s>0</s><k>6</k><s>0</s><k>7</k><s>0</s><k>8</k><s>0</s><k>9</k><s>0</s><k>10</k><s>0</s><k>11</k><s>0</s><k>12</k><s>0</s></d></d>${saveData[1]}`

        fs.writeFileSync(path.join(process.env.LOCALAPPDATA, "GeometryDash/CCLocalLevels.dat"), saveData, "utf-8");
    });
});

request.write(requestBody);

request.end();