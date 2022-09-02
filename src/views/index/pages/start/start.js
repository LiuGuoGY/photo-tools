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
            db.close();
        }
    }

    async checkDB() {
        if(!Fs.existsSync(Path.join(userPath, dbPath))) {
            console.log("数据库不存在，创建数据库");
            Fs.writeFileSync(Path.join(userPath, dbPath), "");
        }
        await db.connect(Path.join(userPath, dbPath));
        await db.run("create table if not exists photos ('id' INTEGER PRIMARY KEY AUTOINCREMENT, 'filename', 'path', 'hash', 'shottime')");
        db.close();
    }

    async handleFile(filePath) {
        let fileData = Fs.readFileSync(filePath);
        let hash = MD5(fileData).toString().toUpperCase();
        let fileName = Path.basename(filePath);
        // let file = new File(fileData, Path.basename(filePath));
        // let tags = EXIF.getAllTags(file);
        // console.log(tags);
        console.log(hash);
        db.run('INSERT INTO photos (filename, path, hash, shottime) VALUES(?, ?, ?, ?)', [fileName, filePath, hash, 0]);
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
        return (
            <div style={{ width: "100%", height: "100%", position: "absolute" }}>
                <div className={commonStyles.page_title}>快速开始</div>
                <div className={styles.page_access_menus_parent}>
                    <input
                        type="file"
                        ref={(el) => (this.fileInput = el)}
                        accept="image/*"
                        onChange={this.handleChange} />
                </div>
                <button className={styles.select_button} onClick={() => { this.handleClick() }}>选择目录</button>
            </div>
        );
    }
}

export default PageStart;

