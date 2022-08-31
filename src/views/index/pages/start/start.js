import React from 'react';
import commonStyles from "../common.module.css";
import styles from "./start.module.css";
import EXIF from 'exif-js';

class PageStart extends React.Component {
    handleChange(e) {
        console.log(e);
        console.log(e.target.files[0]);
        if(e.target.files) {
            let file = e.target.files[0];
            EXIF.getData(file, function() {
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
        return (
            <div style={{width: "100%", height: "100%", position:"absolute"}}>
                <div className={commonStyles.page_title}>快速开始</div>
                <div className={styles.page_access_menus_parent}>
                <input
                    type="file"
                    ref={(el) => (this.fileInput = el)}
                    accept="image/*"
                    onChange={this.handleChange} />
                </div>
            </div>
        );
    }
}

export default PageStart;

