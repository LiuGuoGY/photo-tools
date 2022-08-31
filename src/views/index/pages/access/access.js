import React from 'react';
import commonStyles from "../common.module.css";
import styles from "./access.module.css";

//---icon---
import iconTurn from "../../assets/icon-zhuanhuan.svg"
import iconPeibi from "../../assets/icon-peibi.svg"
import iconSearch from "../../assets/icon-search.svg"
import iconLine from "../../assets/icon-line.svg"
import iconPackage from "../../assets/icon-xinpian.svg"



class MenuElement extends React.Component {
    render() {
        return (
            <div className={styles.menu_element_parent} onClick={()=>this.props.onClick()}>
                <img src={this.props.icon} alt="none" className={styles.menu_element_icon}></img>
                <p className={styles.menu_element_title}>{this.props.title}</p>
                <p className={styles.menu_element_subtitle}>{this.props.subtitle}</p>
            </div>
        );
    }
}

class DividingLine extends React.Component {
    render() {
        return (
            <div className={styles.dividing_line}></div>
        );
    }
}

class PageAccess extends React.Component {
    render() {
        return (
            <div style={{width: "100%", height: "100%", position:"absolute"}}>
                <div className={commonStyles.page_title}>辅助功能</div>
                <div className={styles.page_access_menus_parent}>
                    <MenuElement icon={iconTurn} title="单位转换" subtitle="绘制 PCB 时常用的长度单位转换。" onClick={()=>{}}></MenuElement>
                    <MenuElement icon={iconPeibi} title="电阻配比" subtitle="快速进行常用的电阻分压电路的阻值配比。" onClick={()=>{}}></MenuElement>
                    <MenuElement icon={iconSearch} title="常用值查询" subtitle="快速查询常用的电阻、电容、电感值。" onClick={()=>{}}></MenuElement>
                    <DividingLine></DividingLine>
                    <MenuElement icon={iconLine} title="线宽计算" subtitle="根据 PCB 的实际参数确定某一电流值下的最小线宽。" onClick={()=>{}}></MenuElement>
                    <MenuElement icon={iconPackage} title="封装查询" subtitle="快速查询常用的封装、名称及其尺寸。" onClick={()=>{}}></MenuElement>
                    
                </div>
            </div>
        );
    }
}

export default PageAccess;

