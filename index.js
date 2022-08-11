/* Custom Workflow
1. Custom Action Repo - Nodejs action --> Generate the github action yaml -> commit --> push to main branch
2. R&D Repo - fork.yml --> Repository dispatch workflow to trigger on fork --> wait for few minutes --> trigger repository dispatch event
3. Support-Repo - fork.yml, deploy.yml --> For repository dispatch event --> call custom action.
*/

// actions toolkit core and github packages
const core = require('@actions/core');
const github = require('@actions/github');
const { readYamlEnvSync, readYamlEnv } = require('yaml-env-defaults');
const updateYamlDocuments = require("@atomist/yaml-updater");


// setup required libraries
const fs = require('fs');
const yaml = require('js-yaml');
//const { Octokit } = require('@octokit/rest')
const { execSync } = require("child_process");
const simpleGit = require('simple-git');
const process = require('process');


// Github Info
const userName = core.getInput('userName');
const pacToken = core.getInput('pacToken');
const repoName = core.getInput('repoName');
const branch   = core.getInput('branch');
const dirpath  = '.github/workflows'
//const userName = 'rrachitha'
//const pacToken = ''
//const repoName = 'support-repo'
//const branch   = 'dev'

//const gitHubURL = `https://${userName}:${password}@github.com/${userName}/${repoName}.git`;


/*
if (fs.existsSync(repoName)) {
    console.log('Repository already exists!');
    core.info('Repository already exists!');
} else {
    simpleGit()
        .clone(gitHubURL)
        .then(() => console.log('Repository cloned!'))
        .catch((err) => console.error('Cloning the repository failed: ', err));
}*/


// Azure Function parameters
const azureFunctionAppName = core.getInput('AZURE_FUNCTIONAPP_NAME');
const azureFunctionAppPackagePath = core.getInput('AZURE_FUNCTIONAPP_PACKAGE_PATH');
const dotNetVersion = core.getInput('DOTNET_VERSION');


// Debug logs
core.info(azureFunctionAppName);
core.info(azureFunctionAppPackagePath);
core.info(dotNetVersion);


// Create the Github Action Yaml to generate
let data = {
    name: "Deploy DotNet project to function app with a Linux environment---------",
    on: 'create',
    env: {AZURE_FUNCTIONAPP_NAME: 'function-app', AZURE_FUNCTIONAPP_PACKAGE_PATH: '${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}/output', DOTNET_VERSION: '${{ env.DOTNET_VERSION}}'},
    jobs: {
        'build-deploy': {
           'runs-on': 'ubuntu-latest',
            steps: [{
                name: 'Checkout GitHub Action',
                uses: 'actions/checkout@v3',
            },
            {
                name: 'Setup DotNet ${{ env.DOTNET_VERSION }} Environment',
                uses: 'actions/setup-dotnet@v1',
                with: {
                    'dotnet-version': '${{ env.DOTNET_VERSION}}'
                }
            },
            {
                name: 'Resolve Project Dependencies using Dotnet',
                shell: 'bash',
                run: "pushd ./${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}\ndotnet build --configuration Release --output ./output\npopd"
            },
            {
                name: 'Deploy to Azure Functions',
                uses: 'Azure/functions-action@v1',
                id: 'fa',
                with: {
                   'app-name': '${{ env.AZURE_FUNCTIONAPP_NAME }}',
                   'package': '${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}/output',
                   'publish-profile': '${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}'
                }
            }
        ]
            
        },
    }
};

// Write the yaml file to support-repo
const yamlStr = yaml.dump(data);
fs.mkdirSync(dirpath, { recursive: true })
fs.writeFileSync('.github/workflows/deploy.yml', yamlStr, 'utf8');
core.info("Before changing directory: " + process.cwd());
//console.log(process.cwd());
// Commit and push the deploy github action


core.info("Just before chdir: " + process.cwd());
//process.chdir('support-repo/');
core.info("After changing directory: " + process.cwd());
fs.writeFileSync('.github/workflows/deploy.yml', yamlStr, 'utf8');
//var files = fs.readdirSync('.github/workflows/');
//core.info(files);


const { Octokit } = require("@octokit/rest");
const { Base64 } = require("js-base64");
//const fs = require("fs");

require("dotenv").config();

const octokit = new Octokit({
  auth: `${pacToken}`,
});


const main = async () => {
  try {
    console.log("Before reading the file:" + process.cwd());
    const content = fs.readFileSync(".github/workflows/deploy.yml", "utf-8");
    const contentEncoded = Base64.encode(content);

    const { data } = await octokit.repos.createOrUpdateFileContents({
      // replace the owner and email with your own details
      owner: `${userName}`,
      repo: `${repoName}`,
      path: ".github/workflows/deploy.yml",
      message: "feat: Added workflow programatically",
      content: contentEncoded,
      branch: `${branch}`,
      committer: {
        name: `rrachitha`,
        email: "rrajagopal@architech.ca",
      },
      author: {
        name: "rrachitha",
        email: "rrajagopal@architech.ca",
      },
    });

    console.log(data);
  } catch (err) {
    console.error(err);
  }
};

main();

/*
process.chdir('.github/workflows/');

simpleGit()
    .addRemote('origin', 'https://github.com/rrachitha/support-repo.git')
    .add('./deploy.yml')
    .commit('Add Github Action')
    .push(['origin', 'main'], () => core.info('Github Action successfully added!'));





//console.log(pushContents)
//core.info(pushContents)*/













/* TODO:
    - Implement remote git commit and push to remote repository
    - 
*/

/* TODO: 
   - Handle errors and success response logging
   -- can be ignored: Add git pull method to prevent further issues by pulling latest changes
   - Need to add steps in custom action to include publishing package to Github Packages in the generated github action
   -- can be ignored: Parameterize yaml input for the Azure Function app name and package path
   - Email Notifications
   - Fork trigger issues
   - Understand how each environment is handled for each customer.
   - Calling custom action issue
*/ 
