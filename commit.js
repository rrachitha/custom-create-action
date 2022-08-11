const { Octokit } = require("@octokit/rest");
const { Base64 } = require("js-base64");
const fs = require("fs");

require("dotenv").config();

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
});

const main = async () => {
  try {
    const content = fs.readFileSync("./input.txt", "utf-8");
    const contentEncoded = Base64.encode(content);

    const { data } = await octokit.repos.createOrUpdateFileContents({
      // replace the owner and email with your own details
      owner: "your-github-account",
      repo: "octokit-create-file-example",
      path: "OUTPUT.md",
      message: "feat: Added OUTPUT.md programatically",
      content: contentEncoded,
      committer: {
        name: `Octokit Bot`,
        email: "your-email",
      },
      author: {
        name: "Octokit Bot",
        email: "your-email",
      },
    });

    console.log(data);
  } catch (err) {
    console.error(err);
  }
};

main();