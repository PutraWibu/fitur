import multidb from "../../system/multidb.js";
export default {
  run: async (e, l, { func: n, plugins: a, commands: o }) => {
    try {
      if (!e.text) return e.reply(n.example(e.cmd, "menu"));

      global.db = global.db || {};
      global.db.blockcmd = global.db.blockcmd || [];

      const action = String(e.command || "").toLowerCase();

      const input = String(e.text)
        .trim()
        .toLowerCase()
        .replace(/^\./, "")
        .split(/\s+/)
        .filter(Boolean);

      if (!input.length) {
        return e.reply(n.example(e.cmd, "menu"));
      }

      const normalize = value =>
        String(value ?? "")
          .trim()
          .toLowerCase()
          .replace(/^\./, "");

      const save = async () => {
        try {
          if (typeof multidb.save === "function") {
            await multidb.save();
          }
        } catch (err) {
          console.error("BLOCKCMD SAVE ERROR:", err.message);
        }
      };

      if (action === "unblockcmd" && input.includes("all")) {
        const total = global.db.blockcmd.length;

        if (!total) {
          return e.reply("ℹ Tidak ada command yang sedang diblokir.");
        }

        global.db.blockcmd.length = 0;
        await save();

        return e.reply(
          `✦ UNBLOCK ALL COMMAND ✦\n\n` +
          `✓ Semua blokir berhasil dibuka.\n\n` +
          `Total:\n${total} command`
        );
      }

      const commandMap = new Map();

      for (const plugin of Object.values(a || {})) {
        if (!plugin || !plugin.cmd) continue;

        const commands = Array.isArray(plugin.cmd)
          ? plugin.cmd
          : [plugin.cmd];

        const aliases = plugin.alias
          ? Array.isArray(plugin.alias)
            ? plugin.alias
            : [plugin.alias]
          : [];

        const names = [
          ...new Set(
            [...commands, ...aliases]
              .map(normalize)
              .filter(Boolean)
          )
        ];

        if (!names.length) continue;

        const mainCommand = normalize(commands[0]);

        for (const name of names) {
          commandMap.set(name, {
            command: mainCommand,
            names
          });
        }
      }

      if (Array.isArray(o)) {
        for (const command of o) {
          const name = normalize(command);

          if (!name || commandMap.has(name)) continue;

          commandMap.set(name, {
            command: name,
            names: [name]
          });
        }
      }

      const found = [];

      for (const requested of input) {
        const data = commandMap.get(normalize(requested));

        if (!data) continue;

        if (!found.some(item => item.command === data.command)) {
          found.push(data);
        }
      }

      if (!found.length) {
        return e.reply("✗ Tidak ada command ditemukan.");
      }

      if (action === "blockcmd") {
        const blocked = [];
        const alreadyBlocked = [];

        for (const item of found) {
          for (const name of item.names) {
            const command = normalize(name);

            const existing = global.db.blockcmd.find(
              x => normalize(x.command) === command
            );

            if (existing?.blocked) {
              alreadyBlocked.push(command);
              continue;
            }

            if (existing) {
              existing.command = command;
              existing.blocked = true;
              existing.system = false;
              existing.amount = existing.amount || 0;
            } else {
              global.db.blockcmd.push({
                command,
                blocked: true,
                system: false,
                amount: 0
              });
            }

            blocked.push(command);
          }
        }

        await save();

        let text = "✦ BLOCK COMMAND ✦\n\n";

        if (blocked.length) {
          text +=
            `✓ Berhasil diblokir:\n\n` +
            `${[...new Set(blocked)]
              .map(x => `• ${x}`)
              .join("\n")}\n`;
        }

        if (alreadyBlocked.length) {
          text +=
            `\nℹ Sudah diblokir:\n\n` +
            `${[...new Set(alreadyBlocked)]
              .map(x => `• ${x}`)
              .join("\n")}`;
        }

        return e.reply(text);
      }

      if (action === "unblockcmd") {
        const namesToUnblock = new Set(
          found.flatMap(item => item.names.map(normalize))
        );

        const unblocked = [];

        global.db.blockcmd = global.db.blockcmd.filter(item => {
          const command = normalize(item.command);

          if (namesToUnblock.has(command)) {
            unblocked.push(command);
            return false;
          }

          return true;
        });

        if (!unblocked.length) {
          return e.reply("ℹ Tidak ada command yang diblokir.");
        }

        await save();

        return e.reply(
          `✦ UNBLOCK COMMAND ✦\n\n` +
          `✓ Berhasil dibuka:\n\n` +
          `${[...new Set(unblocked)]
            .map(x => `• ${x}`)
            .join("\n")}`
        );
      }
    } catch (err) {
      console.error("BLOCKCMD ERROR:", err);
      return e.reply("✗ Error: " + err.message);
    }
  },

  cmd: ["blockcmd", "unblockcmd"],
  use: "nama command",
  type: "developer",
  devs: true,
  location: "plugins/developer/blockcmd.js"
};
