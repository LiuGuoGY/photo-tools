// const { dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

let message = {
    error: '检查更新出错',
    checking: '正在检查更新……',
    updateAva: '检测到新版本，正在下载……',
    updateNotAva: '现在使用的就是最新版本，不用更新',
};

// autoUpdater.autoDownload = false;

// see  https://www.electron.build/auto-update#events
autoUpdater.on('error', function (error) {
  console.log(error)
  console.log(message.error)
});
autoUpdater.on('checking-for-update', function () {
  console.log(message.checking)
});
autoUpdater.on('update-available', function (info) {
  console.log(info);
  console.log(message.updateAva)
  // dialog.showMessageBox({
  //   type: "info",
  //   message: "检测到有新版本！"
  // })
});
autoUpdater.on('update-not-available', function (info) {
  console.log(info);
  console.log(message.updateNotAva)
});
autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {

})

autoUpdater.on('update-downloaded', info => {
  if (true) { //process.env.NODE_ENV === 'production'
    console.log("download-finish!!!");
    autoUpdater.quitAndInstall();
  }
})
module.exports = autoUpdater;