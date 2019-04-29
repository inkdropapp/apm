(function() {
  var child_process, fs, npm, path, semver;

  child_process = require('child_process');

  fs = require('./fs');

  path = require('path');

  npm = require('npm');

  semver = require('semver');

  module.exports = {
    getHomeDirectory: function() {
      if (process.platform === 'win32') {
        return process.env.USERPROFILE;
      } else {
        return process.env.HOME;
      }
    },
    getAtomDirectory: function() {
      var ref;
      return (ref = process.env.INKDROP_HOME) != null ? ref : path.join(this.getAppDataPath(), 'inkdrop');
    },
    getRustupHomeDirPath: function() {
      if (process.env.RUSTUP_HOME) {
        return process.env.RUSTUP_HOME;
      } else {
        return path.join(this.getHomeDirectory(), '.multirust');
      }
    },
    getCacheDirectory: function() {
      return path.join(this.getAtomDirectory(), '.ipm');
    },
    getAppDataPath: function() {
      switch (process.platform) {
        case 'darwin':
          return path.join(process.env.HOME, 'Library', 'Application Support');
        case 'linux':
          return path.join(process.env.HOME, '.config');
        case 'win32':
          return process.env.APPDATA;
      }
    },
    getResourcePath: function(callback) {
      var apmFolder, appFolder, appLocation, asarPath;
      if (process.env.INKDROP_RESOURCE_PATH) {
        return process.nextTick(function() {
          return callback(process.env.INKDROP_RESOURCE_PATH);
        });
      }
      apmFolder = path.resolve(__dirname, '..');
      appFolder = path.dirname(apmFolder);
      if (path.basename(apmFolder) === 'ipm' && path.basename(appFolder) === 'app') {
        asarPath = `${appFolder}.asar`;
        if (fs.existsSync(asarPath)) {
          return process.nextTick(function() {
            return callback(asarPath);
          });
        }
      }
      apmFolder = path.resolve(__dirname, '..', '..', '..');
      appFolder = path.dirname(apmFolder);
      if (path.basename(apmFolder) === 'ipm' && path.basename(appFolder) === 'app') {
        asarPath = `${appFolder}.asar`;
        if (fs.existsSync(asarPath)) {
          return process.nextTick(function() {
            return callback(asarPath);
          });
        }
      }
      switch (process.platform) {
        case 'darwin':
          return child_process.exec('mdfind "kMDItemCFBundleIdentifier == \'info.pkpk.inkdrop\'"', function(error, stdout = '', stderr) {
            var appLocation;
            if (!error) {
              [appLocation] = stdout.split('\n');
            }
            if (!appLocation) {
              appLocation = '/Applications/Inkdrop.app';
            }
            return callback(`${appLocation}/Contents/Resources/app.asar`);
          });
        case 'linux':
          appLocation = '/usr/local/share/inkdrop/resources/app.asar';
          if (!fs.existsSync(appLocation)) {
            appLocation = '/usr/share/inkdrop/resources/app.asar';
          }
          return process.nextTick(function() {
            return callback(appLocation);
          });
      }
    },
    getReposDirectory: function() {
      var ref;
      return (ref = process.env.INKDROP_REPOS_HOME) != null ? ref : path.join(this.getHomeDirectory(), 'github');
    },
    getElectronUrl: function() {
      var ref;
      return (ref = process.env.INKDROP_ELECTRON_URL) != null ? ref : 'https://atom.io/download/electron';
    },
    getAtomPackagesUrl: function() {
      var ref;
      return (ref = process.env.INKDROP_PACKAGES_URL) != null ? ref : `${this.getAtomApiUrl()}/packages`;
    },
    getAtomApiUrl: function() {
      var ref;
      return (ref = process.env.INKDROP_API_URL) != null ? ref : 'https://api.inkdrop.app/v1';
    },
    getElectronArch: function() {
      var ref;
      switch (process.platform) {
        case 'darwin':
          return 'x64';
        default:
          return (ref = process.env.INKDROP_ARCH) != null ? ref : process.arch;
      }
    },
    getUserConfigPath: function() {
      return path.resolve(this.getAtomDirectory(), '.ipmrc');
    },
    getGlobalConfigPath: function() {
      return path.resolve(this.getAtomDirectory(), '.ipm', '.ipmrc');
    },
    isWin32: function() {
      return process.platform === 'win32';
    },
    x86ProgramFilesDirectory: function() {
      return process.env["ProgramFiles(x86)"] || process.env["ProgramFiles"];
    },
    getInstalledVisualStudioFlag: function() {
      if (!this.isWin32()) {
        return null;
      }
      if (process.env.GYP_MSVS_VERSION) {
        // Use the explictly-configured version when set
        return process.env.GYP_MSVS_VERSION;
      }
      if (this.visualStudioIsInstalled("14.0")) {
        return '2015';
      }
      if (this.visualStudioIsInstalled("12.0")) {
        return '2013';
      }
      if (this.visualStudioIsInstalled("11.0")) {
        return '2012';
      }
      if (this.visualStudioIsInstalled("10.0")) {
        return '2010';
      }
    },
    visualStudioIsInstalled: function(version) {
      return fs.existsSync(path.join(this.x86ProgramFilesDirectory(), `Microsoft Visual Studio ${version}`, "Common7", "IDE"));
    },
    loadNpm: function(callback) {
      var npmOptions;
      npmOptions = {
        userconfig: this.getUserConfigPath(),
        globalconfig: this.getGlobalConfigPath()
      };
      return npm.load(npmOptions, function() {
        return callback(null, npm);
      });
    },
    getSetting: function(key, callback) {
      return this.loadNpm(function() {
        return callback(npm.config.get(key));
      });
    },
    setupApmRcFile: function() {
      try {
        return fs.writeFileSync(this.getGlobalConfigPath(), `; This file is auto-generated and should not be edited since any\n; modifications will be lost the next time any apm command is run.\n;\n; You should instead edit your .apmrc config located in ~/.atom/.apmrc\ncache = ${this.getCacheDirectory()}\n; Hide progress-bar to prevent npm from altering apm console output.\nprogress = false`);
      } catch (error1) {}
    }
  };

}).call(this);