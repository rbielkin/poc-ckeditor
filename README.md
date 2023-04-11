# POC Sell platform



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

- [ ] [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
- [ ] [Add files using the command line](https://docs.gitlab.com/ee/gitlab-basics/add-file.html#add-a-file-using-the-command-line) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.connectwisedev.com/vasul.fedash/poc-sell-platform.git
git branch -M main
git push -uf origin main
```
--------------------------------------------------------------------------------------

##  First, install the packages needed to build and set up a basic React application with a CKEditor 5 instance.
yarn add --dev \
    @babel/cli \
    @babel/core \
    @babel/preset-react \
    @ckeditor/ckeditor5-basic-styles \
    @ckeditor/ckeditor5-build-classic \
    @ckeditor/ckeditor5-core \
    @ckeditor/ckeditor5-dev-utils \
    @ckeditor/ckeditor5-editor-classic \
    @ckeditor/ckeditor5-essentials \
    @ckeditor/ckeditor5-heading \
    @ckeditor/ckeditor5-inspector \
    @ckeditor/ckeditor5-link \
    @ckeditor/ckeditor5-paragraph \
    @ckeditor/ckeditor5-react \
    @ckeditor/ckeditor5-table \
    @ckeditor/ckeditor5-theme-lark \
    @ckeditor/ckeditor5-ui \
    @ckeditor/ckeditor5-widget \
    babel-loader \
    css-loader@5 \
    postcss-loader@4 \
    raw-loader@4 \
    react \
    react-dom \
    style-loader@2 \
    webpack@5 \
    webpack-cli@4



 ##  Build your project and see if everything worked well by opening the index page in your browser:
 node_modules/.bin/webpack --mode development

 ## Open index.html in the browser:
index.html