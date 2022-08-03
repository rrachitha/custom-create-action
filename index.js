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

// write.js
const fs = require('fs');
const yaml = require('js-yaml');
const octokit = require('@octokit/rest');


// Github Info
const userName = core.getInput('userName')
const password = core.getInput('pacToken')
const repoName = core.getInput('repoName')
const azureFunctionAppName = core.getInput('AZURE_FUNCTIONAPP_NAME')
const azureFunctionAppPackagePath = core.getInput('AZURE_FUNCTIONAPP_PACKAGE_PATH')
const dotNetVersion = core.getInput('DOTNET_VERSION')

// Simple-git without promise 
const simpleGit = require('simple-git');
const gitHubURL = `https://${userName}:${password}@github.com/${userName}/${repoName}.git`;

// Create the Github Action Yaml to generate
let data = {
    name: "Deploy DotNet project to function app with a Linux environment",
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

let yamlStr = yaml.dump(data);
fs.writeFileSync('.github/workflows/deploy.yml', yamlStr, 'utf8');



// Add commit and push files
simpleGit()
    .add('./*')
    .commit('Add Github Action')
    .push(['-u', 'origin', 'main'], () => console.log('done'));


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
