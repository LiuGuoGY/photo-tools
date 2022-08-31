import React from 'react';
import commonStyles from "../common.module.css";
import "./page.css"

class PageStart extends React.Component {
    render() {
        return (
            <div style={{width: "100%", height: "100%", position:"absolute"}}>
                <div className={commonStyles.page_title}>快速开始</div>
            </div>
        );
    }
}

export default PageStart;

