# Prism-IDE
What is Prism IDE? – IDE is the front-end bot designer that provides cool drag & drop, point & click capabilities that will feed into the Prism bot library.

Prism is currently used to prototype chatbots internally. We are continuing to enhance Prism and developing a unit test suit. Please use it as you see fit. We'd love to have you participate in enhancing the asset and help develop unit test cases for Prism!

-	IDE works out of the local file system making version control very easy!
-	Provides a built-in code syntax highlighter and formatter for modifying JavaScript within the IDE
-	Enable your chatbot to talk slow to make it realistic or respond instantly depending on your need
-	Provides ability to manage (Enable/Disable) intents, commands and tasks

# Prism

For code samples and an explanation about the structure of a prism-bot, check out [Prism](https://github.com/nationwide-labs/prism)

This extension was designed to make the creation and development of a prism bot simpler since it involves file system changes.

After opening a workspace, you can select the bot you want to work in from the the prism view container. If the bot has not been set up yet, you can right click on the bot folder and click `setup`. This will allow you to add intents, commands and tasks.

Once your bot is created, you can add a server and publish to a running prism-bot publish server or you can clone the folder stucture into your node project and use it as you please.

While we work to get this extension added to the marketplace, you can run this locally by cloning the respository and either debug locally with `F5` or you can package it and install it with the following commands.

## Intall VSCE 
`npm install -g vsce`

## Package extension
`vsce package`

## Install extension into vscode
`code --install-extension prism-ide-${version}.vsix`
