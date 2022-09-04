import React from 'react';
import commonStyles from "../common.module.css";
import styles from "./start.module.css";
import EXIF from 'exif-js';
import Sqlite from './sqlite';
import Crypto from 'crypto';

const remote = window.require('@electron/remote');
const Fs = window.require('fs');
const Path = window.require('path');
const userPath = remote.app.getPath('userData');
const dbPath = 'photos.db'

const db = Sqlite.getInstance();

class ScanLoading extends React.Component {
    render() {
        return (<div className={styles.spinner}>
            <div></div>
            <div></div>
            <p>{this.props.text}</p>
        </div>);
    }
}

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
            //状态: 0未扫描，1扫描中，2待删除，3删除完成
            status: 0,
            //重复文件列表信息
            dupFiles: [],
        }
    }

    async handleClick() {
        if (this.state.status === 0) {
            let result = await remote.dialog.showOpenDialog({
                title: "选择目录",
                properties: ['openDirectory'],
            });
            this.setState({
                fileNum: 0,
                scanNum: 0,
                progress: 0,
            })
            await this.checkDB();
            if (!result.canceled && result.filePaths) {
                let dirPath = result.filePaths[0];
                console.log(dirPath);
                this.setState({
                    fileNum: 0,
                    scanNum: 0,
                    status: 1,
                    progress: 0,
                })
                await this.findAllfiles(dirPath, async () => {
                    if (this.state.status === 1) {
                        this.setState({
                            fileNum: this.state.fileNum + 1,
                            toast: "已发现 " + (this.state.fileNum + 1) + " 个照片",
                        });
                    }
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
                if (res && res.length > 0) {
                    this.setState({
                        status: 2,
                        dupFiles: res,
                    })
                } else {
                    this.setState({
                        status: 0,
                    })
                }
            }
        } else if (this.state.status === 1) {
            this.setState({
                status: 0,
                fileNum: 0,
                scanNum: 0,
                toast: "",
                progress: 0,
            })
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
        });
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

    readdir(path) {
        return new Promise(function (resolve, reject) {
            Fs.readdir(path, (err, files) => {
                if (err)
                    reject(err);
                else
                    resolve(files);
            });
        });
    }

    lstat(path) {
        return new Promise(function (resolve, reject) {
            Fs.lstat(path, (err, stats) => {
                if (err)
                    reject(err);
                else {
                    resolve(stats);
                }
            });
        });

    }

    async findAllfiles(fileRootPath, cb) {
        try {
            let files = await this.readdir(fileRootPath);
            for (let i = 0; i < files.length; i++) {
                if (this.state.status === 0) {
                    return;
                }
                let filePath = Path.join(fileRootPath, files[i]);
                let stat = await this.lstat(filePath);
                if (stat.isDirectory()) {
                    //继续寻找子目录
                    await this.findAllfiles(filePath, cb);
                } else {
                    if (/\.(gif|jpg|jpeg|png|GIF|JPG|PNG|HEIC|heic)$/.test(filePath)) {
                        await cb(filePath);
                    } else {
                        // console.log("不是图片：" + filePath);
                    }
                }
            }
        } catch (e) {
            console.log(e)
        }
    }

    unlink(path) {
        return new Promise(function (resolve, reject) {
            Fs.unlink(path, (err => {
                if (err)
                    reject(err);
                else
                    resolve();
            }));
        });
    }

    async deletePhotos() {
        for (let i = 0; i < this.state.dupFiles.length; i++) {
            console.log(this.state.dupFiles[i].path);
            await this.unlink(this.state.dupFiles[i].path);
        }
        this.setState({
            progress: 0,
            toast: "",
            fileNum: 0,
            scanNum: 0,
            status: 0,
            dupFiles: [],
        })
    }

    cancelDeletePhotos() {
        this.setState({
            progress: 0,
            toast: "",
            fileNum: 0,
            scanNum: 0,
            status: 0,
            dupFiles: [],
        })
    }

    showLoadingOrTextView() {
        if (this.state.status === 1) {
            return (<ScanLoading text={this.state.progress + "%"}> </ScanLoading>);
        } else if (this.state.status === 2) {
            return (<div>{"本次扫描共发现" + this.state.dupFiles.length + "个重复文件，是否删除？"}</div>);
        }
        return null;
    }

    showWhatButtonsView() {
        if (this.state.status === 0 || this.state.status === 1) {
            return (
                <div className={styles.scan_or_cancel_button}>
                    <button className={(this.state.status === 0) ? styles.buttonStress : styles.buttonWarn} onClick={() => { this.handleClick() }}>{(this.state.status === 0) ? "开始扫描" : "结束扫描"}</button>
                </div>
            );
        } else if (this.state.status === 2) {
            return (
                <div className={styles.delete_or_not_button}>
                    <button className={styles.buttonWarn} onClick={() => { this.deletePhotos() }}>全部删除</button>
                    <button className={styles.buttonStress} onClick={() => { this.cancelDeletePhotos() }}>返回</button>
                </div>
            );
        }
        return null;
    }

    render() {
        return (
            <div className={styles.scan_content}>
                {/* <div className={styles.dir_parent}>
                    <button className={styles.sel_dir_button} onClick={() => { this.handleClick() }}>选择目录</button>
                </div> */}
                <div className={styles.spinner_parent}>
                    {this.showLoadingOrTextView()}
                </div>
                <div className={styles.toast_parent}>
                    <p >{this.state.toast}</p>
                </div>
                <div className={styles.scan_or_cancel_button_parent}>
                    {this.showWhatButtonsView()}
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

