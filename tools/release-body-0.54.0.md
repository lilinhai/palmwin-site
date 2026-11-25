## 掌窗 0.54.0

安卓上的 Windows 远程桌面（RDP）客户端。这一版是上架前的准备版本。

### 这一版改了什么

**关于页补上「开发者」与「联系方式」**

- 应用里能直接看到是谁做的、怎么联系。联系方式只放一个邮箱。

**新增隐私政策**

- 应用内新增「隐私政策」页，设置页可进。内容十三节，逐条写清：不收集什么、数据存在手机哪里、密码怎么加密、网络只发往哪两个地方、申请了哪两个权限。
- 与应用市场提审表单里填的公网地址是同一份文件，逐字一致：
  <https://lilinhai.github.io/palmwin-site/privacy-policy.html>

### 安装

- 包名 `com.sinhy.palmwin`，`versionCode 64`
- minSdk 24（Android 7.0），targetSdk 36
- 权限只有两个：`INTERNET` 与 `ACCESS_NETWORK_STATE`

校验下载是否完整、以及是不是本应用：

```
apksigner verify --print-certs Palmwin-0.54.0-store-release.apk
```

签名证书 `CN=Palmwin`，SHA-256：

```
1461a72b8fdd332aa492e5f4647bae1d783a023737eb37046dece08ad1e21be7
```

### 升级说明

- 如果你装过 0.40.0 或更早的版本，需要先卸载再装这一版，会清掉已保存的主机与密码，只做一次。
- 从 0.41.0 起的版本可以直接覆盖安装。
