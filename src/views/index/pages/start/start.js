import React from 'react';
import commonStyles from "../common.module.css";
import styles from "./start.module.css";
import EXIF from 'exif-js';
import MD5 from 'md5'
import Sqlite from './sqlite';

const remote = window.require('@electron/remote');
const Fs = window.require('fs');
const Path = window.require('path');
const userPath = remote.app.getPath('userData');
const dbPath = 'photos.db'

const db = Sqlite.getInstance();

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

    async handleClick() {
        let result = await remote.dialog.showOpenDialog({
            title: "选择目录",
            properties: ['openDirectory'],
        });
        await this.checkDB();
        if (!result.canceled && result.filePaths) {
            let dirPath = result.filePaths[0];
            console.log(dirPath);
            await db.connect(Path.join(userPath, dbPath));
            this.findAllfiles(dirPath);
            let res = await db.all(`SELECT * FROM photos
            WHERE id > (
              SELECT MIN(id) FROM photos d2  
              WHERE photos.hash = d2.hash
            )`);
            console.log(res);
            db.close();
        }
    }

    async checkDB() {
        if(!Fs.existsSync(Path.join(userPath, dbPath))) {
            console.log("数据库不存在，创建数据库");
            Fs.writeFileSync(Path.join(userPath, dbPath), "");
        }
        await db.connect(Path.join(userPath, dbPath));
        await db.run("create table if not exists photos ('id' INTEGER PRIMARY KEY AUTOINCREMENT, 'filename', 'path', 'hash')");
        db.close();
    }

    async handleFile(filePath) {
        let fileData = Fs.readFileSync(filePath);
        let hash = MD5(fileData).toString().toUpperCase();
        let fileName = Path.basename(filePath);
        db.run('INSERT INTO photos (filename, path, hash) VALUES(?, ?, ?)', [fileName, filePath, hash]);
    }

    findAllfiles(fileRootPath) {
        let files = Fs.readdirSync(fileRootPath);
        files.forEach(file => {
            let filePath = Path.join(fileRootPath, file);
            let stat = Fs.lstatSync(filePath);
            if(stat.isDirectory()) {
                //继续寻找子目录
                this.findAllfiles(filePath);
            } else {
                this.handleFile(filePath);
            }
        })
    }

    render() {
        console.log("用户数据目录：" + userPath);
        return (
            <div style={{ width: "100%", height: "100%", position: "absolute" }}>
                <div className={commonStyles.page_title}>重复清理</div>
                <div className={styles.page_parent}>
                    <button className={styles.select_button} onClick={() => { this.handleClick() }}>选择目录</button>
                </div>
            </div>
        );
    }
}

export default PageStart;

