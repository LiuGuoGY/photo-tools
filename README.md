<h1 align="center">
  <img src="./docs/logo.png" alt="PCB-Helper" width="150">
  <br>PCB-Helper<br>
</h1>
<h4 align="center">基于 Electron 构建的嵌入式工程师辅助工具.</h4>
<p align="center">
  <a href="https://github.com/LiuGuoGY/PCB-Helper/actions">
    <img src="https://img.shields.io/github/workflow/status/LiuGuoGY/PCB-Helper/BuildAndRelease?style=flat-square" alt="Github Actions">
  </a>
  <a href="https://github.com/LiuGuoGY/PCB-Helper/releases">
    <img src="https://img.shields.io/github/release/LiuGuoGY/PCB-Helper/all.svg?style=flat-square">
  </a>
  <a href="https://github.com/LiuGuoGY/PCB-Helper/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/LiuGuoGY/PCB-Helper?style=flat-square">
  </a>
</p>




## 预览

![预览图](docs/preview.jpg)

## TODO

### 工程

- [ ] 选择原理图和 PCB 的工程目录，通过对工程目录的文件判断当前的工程名，进度，产生的中间文件（如网表，规则等等）

### 原理图

- [x] 电阻比例自动配置
- [ ] 常用电阻电容电感值查询

### PCB

- [x] `mil`、 `mm` 、 `inch` 单位转换

- [ ] 电流线宽计算查询
- [ ] 封装规格查询
- [ ] 用 script 自动化输出 Gerber 和贴片文件
- [ ] 用 script 自动设置规则
- [ ] 封装管理
- [ ] 规则设置

### 软件

- [ ] ~~自动生成标准库的 stm32 驱动文件~~