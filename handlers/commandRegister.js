const { Events } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

module.exports = {
  async execute(client) {
    client.once(Events.ClientReady, async () => {
      const applicationCommands = [];
      let rawApplicationCommands;
      rawApplicationCommands = await client.application.commands.fetch();
      rawApplicationCommands.forEach((cmd) => {
        applicationCommands.push({
          options: cmd.options,
          name: cmd.name,
          name_localizations: cmd.name_localizations,
          description: cmd.description,
          description_localizations: cmd.description_localizations,
          contexts: cmd.contexts,
          default_permission: cmd.default_permission,
          default_member_permissions: cmd.default_member_permissions,
          dm_permission: cmd.dm_permission,
          integration_types: cmd.integration_types,
          nsfw: cmd.nsfw,
          type: cmd.type,
        });
      });

      const localCommands = [];
      const foldersPath = path.join(__dirname, "../commands");
      const commandFolders = fs.readdirSync(foldersPath);

      for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs
          .readdirSync(commandsPath)
          .filter((file) => file.endsWith(".js"));
        for (const file of commandFiles) {
          const filePath = path.join(commandsPath, file);
          const command = require(filePath);
          if ("data" in command && "execute" in command) {
            if (localCommands.find((cmd) => cmd.name === command.data.name)) {
              continue;
            }
            localCommands.push(command.data.toJSON());
          } else {
            console.log(
              `[❓] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
          }
        }
      }

      function commandsChanged(localCommands, applicationCommands) {
        if (localCommands.length !== applicationCommands.length) return true;

        const appMap = new Map(
          applicationCommands.map((cmd) => [cmd.name, cmd])
        );

        for (const localCmd of localCommands) {
          const appCmd = appMap.get(localCmd.name);
          if (!appCmd) return true; // Command missing in application

          // Compare essential properties that matter for functionality
          if (localCmd.description !== appCmd.description) return true;
          if (localCmd.type !== appCmd.type) return true;

          // Compare options arrays if they exist
          const localOptions = localCmd.options || [];
          const appOptions = appCmd.options || [];
          if (localOptions.length !== appOptions.length) return true;

          // Compare other properties that could affect functionality
          // but normalize null/undefined to be the same
          if ((localCmd.nsfw || false) !== (appCmd.nsfw || false)) return true;
          if (
            (localCmd.dm_permission ?? true) !== (appCmd.dm_permission ?? true)
          )
            return true;

          // If we have complex options, we should compare them deeper
          // This is a simplified comparison for options
          if (localOptions.length > 0) {
            for (let i = 0; i < localOptions.length; i++) {
              if (localOptions[i].name !== appOptions[i].name) return true;
              if (localOptions[i].description !== appOptions[i].description)
                return true;
              if (localOptions[i].type !== appOptions[i].type) return true;
              if (
                (localOptions[i].required || false) !==
                (appOptions[i].required || false)
              )
                return true;
            }
          }
        }
        return false;
      }

      if (!commandsChanged(localCommands, applicationCommands)) {
        console.log("[🟢] No Changes Detected in Commands");
        return;
      }

      try {
        if (localCommands) {
          await client.application.commands.set([]);
          await new Promise((res) => setTimeout(res, 5000));
          await client.application.commands.set(localCommands);
        }
        console.log(
          `[✅] Successfully registered ${localCommands.length} (/) commands`
        );
      } catch (error) {
        console.error("❌ Error While Registering Commands:", error);
      }
    });
  },
};