## Frontend 

### Install requirements

#### node.js
Download node.js:
https://nodejs.org/download/release/v14.21.3/node-v14.21.3-win-x64.zip

extract and add folder to Windows system PATH (erweiterte Systemsteuerung)

#### Install Meteor
type in Powershell:
```
npm install -g meteor
```

#### Install npm packages for app
```
cd frontend
meteor npm install
```

### Run app
```
cd frontend
meteor run --settings settings.json
```

### Known issues
If there are certificate errors downloading packages during install or run use the following setting before executing meteor command.
#### Resolve in Linux
```
NODE_TLS_REJECT_UNAUTHORIZED=0 meteor <any-command>
```

#### Resolve in Windows
In standard command prompt:
```
set NODE_TLS_REJECT_UNAUTHORIZED=0
```
in Powershell use:
```
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
```
