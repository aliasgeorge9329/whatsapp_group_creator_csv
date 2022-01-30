const qrcode = require("qrcode-terminal");
const { Client } = require("whatsapp-web.js");
const fs = require("fs");
const csv = require("csv-parser");
const { exit } = require("process");

const prompt = require("prompt-sync")({ sigint: true });
const name = prompt("Enter the Name for Group: ");

let contacts = [];
let failed = [];
let notwauser = [];

fs.createReadStream("contact.csv")
  .pipe(csv())
  .on("data", (data) => contacts.push(data["Phone_Number"]))
  .on("end", () => {});

const client = new Client();

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
  console.log("Client is ready!");
  createGroup();
});

async function createGroup() {
  contacts = contacts.filter((each) => each != null);
  for (i = 0; i < contacts.length; i++) {
    if (contacts[i].length === 10) {
      contacts[i] = `91${contacts[i]}@c.us`;
      if (!(await client.isRegisteredUser(contacts[i])))
        notwauser.push(contacts[i]);
    } else {
      contacts[i] = `${contacts[i]}@c.us`;
      if (!(await client.isRegisteredUser(contacts[i])))
        notwauser.push(contacts[i]);
    }
  }
  console.log(`\nThese Numbers are not Registered in Whatsapp\n${notwauser}\n`);

  contacts = contacts.filter((each) => notwauser.indexOf(each) == -1);
  let res = await client.createGroup(`${name.trim()}`, contacts);
  failed = Object.keys(res.missingParticipants);
  group_id = res.gid;
  await timer(400);
}

async function AddFailed(invitationlink) {
  console.log(`\n\nWhatsapp invitations Group sent to \n${failed}\n\n`);
  for (i = 0; i < failed.length; i++) {
    try {
      await client.sendMessage(
        failed[i],
        `https://chat.whatsapp.com/${invitationlink}`
      );
    } catch {
      console.log(`\nInvitation Link Not sent to ${failed[i]}`);
    }
  }
  await timer(2000);
  exit(0);
}

client.on("message", async (msg) => {
  const group = await msg.getChat();
  invitationlink = await group.getInviteCode();
  AddFailed(invitationlink);
});

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

client.initialize();
