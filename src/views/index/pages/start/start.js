import React from 'react';
import commonStyles from "../common.module.css";
import styles from "./start.module.css";
import EXIF from 'exif-js';
import MD5 from 'md5';
import Sqlite from './sqlite';
import Crypto from 'crypto';

const remote = window.require('@electron/remote');
const Fs = window.require('fs');
const Path = window.require('path');
const userPath = remote.app.getPath('userData');
const dbPath = 'photos.db'

const db = Sqlite.getInstance();

class ScanContent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            //进度
            progress: 0,
            //提示文字
            toast: "",
            //总文件数量
            fileNum: 0,
            //已扫描的数量
            scanNum: 0,
        }
    }

    async handleClick() {
        let result = await remote.dialog.showOpenDialog({
            title: "选择目录",
            properties: ['openDirectory'],
        });
        await this.checkDB();
        if (!result.canceled && result.filePaths) {
            let dirPath = result.filePaths[0];
            console.log(dirPath);
            this.setState({
                fileNum: 0,
                scanNum: 0,
            })
            await this.findAllfiles(dirPath, async () => {
                this.setState({
                    fileNum: this.state.fileNum + 1,
                });
            });
            console.log(this.state.fileNum);
            await db.connect(Path.join(userPath, dbPath));
            await this.findAllfiles(dirPath, async (file) => {
                await this.handleFile(file);
            });
            await db.connect(Path.join(userPath, dbPath));
            let res = await db.all(`SELECT * FROM photos
            WHERE id > (
              SELECT MIN(id) FROM photos d2  
              WHERE photos.hash = d2.hash
            )`);
            console.log("结果：")
            console.log(res);
            db.close();
        }
    }

    async checkDB() {
        if (!Fs.existsSync(Path.join(userPath, dbPath))) {
            console.log("数据库不存在，创建数据库");
            Fs.writeFileSync(Path.join(userPath, dbPath), "");
        }
        await db.connect(Path.join(userPath, dbPath));
        await db.run("DROP TABLE photos");
        await db.run("create table if not exists photos ('id' INTEGER PRIMARY KEY AUTOINCREMENT, 'filename', 'path', 'hash')");
        db.close();
    }

    async handleFile(filePath) {
        this.setState({
            toast: "正在扫描：" + filePath,
        })
        // let fileData = await this.readFile(filePath);
        // let hash = MD5(fileData).toString().toUpperCase();
        let hash = await this.getMD5(filePath);
        let fileName = Path.basename(filePath);
        await db.run('INSERT INTO photos (filename, path, hash) VALUES(?, ?, ?)', [fileName, filePath, hash]);
        this.setState({
            scanNum: this.state.scanNum + 1,
            progress: Math.round((this.state.scanNum + 1) / this.state.fileNum * 100),
            toast: "",
        })
    }

    getMD5(filePath) {
        return new Promise((resolve, reject) => {
            const hash = Crypto.createHash('sha1');
            const stream = Fs.createReadStream(filePath);
            stream.on('error', err => reject(err));
            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
        });
    }

    readFile(file) {
        return new Promise(function (resolve, reject) {
            Fs.readFile(file, function (err, data) {
                if (err)
                    reject(err);
                else
                    resolve(data);
            });
        });
    }

    async findAllfiles(fileRootPath, cb) {
        let files = Fs.readdirSync(fileRootPath);
        for (let i = 0; i < files.length; i++) {
            let filePath = Path.join(fileRootPath, files[i]);
            let stat = Fs.lstatSync(filePath);
            if (stat.isDirectory()) {
                //继续寻找子目录
                await this.findAllfiles(filePath, cb);
            } else {
                if (/\.(gif|jpg|jpeg|png|GIF|JPG|PNG|HEIC|heic)$/.test(filePath)) {
                    await cb(filePath);
                } else {
                    console.log("不是图片：" + filePath);
                }
            }
        }
    }

    render() {
        return (
            <div className={styles.scan_content}>
                {/* <div className={styles.dir_parent}>
                    <button className={styles.sel_dir_button} onClick={() => { this.handleClick() }}>选择目录</button>
                </div> */}
                <div className={styles.spinner_parent}>
                    <div className={styles.spinner}>
                        <div></div>
                        <div></div>
                        <p>{this.state.progress + "%"}</p>
                    </div>
                </div>
                <div className={styles.toast_parent}>
                    <p >{this.state.toast}</p>
                </div>
                <div className={styles.scan_or_cancel_button_parent}>
                    <div className={styles.scan_or_cancel_button}>
                        <button className={styles.buttonStress} onClick={() => { this.handleClick() }}>开始扫描</button>
                    </div>
                </div>
            </div>
        );
    }
}

class PageStart extends React.Component {
    handleChange(e) {
        console.log(e);
        console.log(e.target.files[0]);

        if (e.target.files) {
            let file = e.target.files[0];
            let reader = new FileReader();
            reader.onloadend = function () {
                var hash = MD5(reader.result);
                console.log(hash.toString().toUpperCase());
            }
            reader.readAsArrayBuffer(file);
            EXIF.getData(file, function () {
                let exifData = EXIF.pretty(this);
                if (exifData) {
                    console.log(exifData);
                    console.log(EXIF.getTag(this, "Orientation"));
                } else {
                    console.log("No EXIF data found in image '" + file.name + "'.");
                }
            });
        }
    }



    render() {
        console.log("用户数据目录：" + userPath);
        return (
            <div className={styles.page_content}>
                <div className={commonStyles.page_title}>照片清理</div>
                <div className={styles.page_parent}>
                    <ScanContent> </ScanContent>
                </div>
            </div>
        );
    }
}

export default PageStart;

