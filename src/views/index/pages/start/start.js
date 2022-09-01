import React from 'react';
import commonStyles from "../common.module.css";
import styles from "./start.module.css";
import EXIF from 'exif-js';
import MD5 from 'crypto-js/md5';
import Sqlite from './sqlite';

const remote = window.require('@electron/remote');
const Fs = window.require('fs');
const Path = window.require('path');

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
            reader.readAsBinaryString(file);
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
        if (!result.canceled && result.filePaths) {
            let dirPath = result.filePaths[0];
            console.log(dirPath);
            await db.connect(Path.join(dirPath, "./photos.db"));
            await db.run("CREATE TABLE photos (id, name)");
            this.findAllfiles(dirPath);
            
            db.close();
        }
    }

    findAllfiles(fileRootPath) {
        let files = Fs.readdirSync(fileRootPath);
        files.forEach(file => {
            let filePath = Path.join(fileRootPath, file);
            let stat = Fs.lstatSync(filePath);
            if(stat.isDirectory()) {
                this.findAllfiles(filePath);
            } else {
                console.log(file);
                
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

