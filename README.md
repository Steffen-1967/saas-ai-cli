# saas-ai-cli
A Command-Line-Interface to create and edit a (TypeScript / node.js based) SaaS application with AI (openrouter/free).

## Purpose
This project is a self-made CLI, to create and edit a (TypeScript / node.js based) SaaS application with AI (openrouter/free).<br/>
For manual editong of source code _VS Code_ is planned. The whole CLI was generated with _Microsoft Copilot_ on 2026-03-09.

## General
This is a CLI project targeted to create and edit _TypeScript_ source code. The runtime environment shold be _node.js_.<br/>
The project has been initiated with _node.js_ version 24.14.0 (LTS).<br/>
The project was initially configured to use the ES‑Module‑Syntax (import/export).<br/>
--> ```"type": "module"``` in ```package.json```<br/>
--> file suffix ```*.mts```<br/>
It has been extended later to be more flexible and convenient.

The _OpenRouter_ has been chosen as the AI model provider.<br/>
The _openrouter/free_ has been chosen as the free (zero cost) AI model for coding.<br/>
--> https://openrouter.ai/openrouter/free<br/>
The _SaaS-Dev-01_ API key has been created to be used with _openrouter/free_.<br/>
--> ```Expires: never```<br/>
--> ```Usage: $0.00```<br/>
--> ```Limit: unlimited TOTAL```<br/>
--> https://openrouter.ai/settings/keys<br/>

The access to the _OpenRouter_ HTTP‑API is implemented using _fetch_ (instead of _axios_) to simplify deployment.

## Prerequisits
The API key for _openrouter/free_ must be stored in such a way that it is available system-wide, but not checked in into _github_.<br/>
--> Environment variables for this account<br/>
--> ```OPENROUTER_API_KEY```<br/>
To link this CLI globally:<br/>
--> ```npm link``` (run in the root-folder of the project).<br/>
To use this CLI in other projects:<br/>
--> ```saas-ai src/_name_.ts``` (sample without command)<br/>
--> ```saas-ai src/_name_.ts "refactor the code for better testability"``` (sample with command)

## Functionality
This CLI was automatically created with _Microsoft Copilot_.<br/>
It has been extended so that<br/>
- it overwrites the edited file and creates a backup.<br/>
--> ```src/_name_.mts``` will be edited, the backup is located at ```src/_name_.mts.bak```<br/>
-  it can edit multiple files at the same time<br/>
--> ```saas-ai src/app.mts src/utils.mts src/routes/user.mts``` (selection of files)<br/>
--> ```saas-ai src/*.mts "optimize the code for performance"``` (all files in the directory)<br/>
--> ```saas-ai src/**/*.mts "refactor everything"``` (all files in all folders recursively)<br/>
-- for the wildcards (```*.mts```, ```**/*.mts```_) to work, _glob_ must be installed<br/>
--> ```npm install glob```<br/>
- it uses a configuration file to utilize multiple AI models and process ```*.ts``` as well as ```*.mts``` files<br/>
- four standard modes are preconfigured (which can still be overridden by CLI arguments)<br/>
-- ```saas-ai refactor```<br/>
-- ```saas-ai docs```<br/>
-- ```saas-ai optimize```<br/>
-- ```saas-ai explain```<br/>
-- ```saas-ai refactor src/utils/*.ts "make the code more functional"``` (and so on)<br/>
- can be used with ignore lists<br/>
- limited parallelism with 5 simultaneous requests is supported<br/>
- a switchable dry-run mode is available<br/>
--> ```saas-ai refactor --dry```<br/>
--> ```saas-ai src/**/*.ts --dry```<br/>
--> ```saas-ai optimize "make the code more performant" --dry```

## Application
This CLI is globally available with the call ```saas-ai```.<br/>
It has been tested with the _Windows PowerShell_.<br/>
It should be called from the root-folder of the project, that hosts the code to apply the CLI on.<br/>
--> ```saas-ai .\src\visualizer\flow-visualizer.mts "Schreibe code, der .\src\visualizer\test-daten.json in den Speicher liest."```
