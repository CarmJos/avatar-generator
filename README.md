<div align=center>

# Avatar Generator

[![version](https://img.shields.io/github/package-json/v/CarmJos/avatar-generator)](https://github.com/CarmJos/avatar-generator)
[![License](https://img.shields.io/github/license/CarmJos/avatar-generator)](https://www.gnu.org/licenses/lgpl-3.0.html)
[![workflow](https://github.com/CarmJos/avatar-generator/actions/workflows/node.js.yml/badge.svg)](https://github.com/CarmJos/avatar-generator/actions/workflows/node.js.yml)
![CodeSize](https://img.shields.io/github/languages/code-size/CarmJos/avatar-generator)

README LANGUAGES [ [**English**](README-EN.md) | [中文](README.md)  ]

</div>

# 头像生成器

_**"基于种子的随机头像生成，支持 Gravatar 集成"**_

一个支持 API 调用的头像生成器，可通过种子生成固定的随机头像，并支持从 Gravatar 获取用户头像。

## 功能特性

- **种子生成**：相同的种子永远产出相同的头像组合
- **Gravatar 集成**：支持通过 email 或 MD5 获取 Gravatar 头像
- **API 接口**：提供 RESTful API，方便集成到其他项目
- **缓存支持**：可配置的缓存策略，提升性能
- **镜像配置**：支持自定义 Gravatar 镜像 URL
- **前端预览**：保留前端页面，方便测试和预览

## 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm 或 yarn

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/CarmJos/avatar-generator.git
cd avatar-generator

# 安装依赖
npm install

# 启动服务（包含前端和 API）
npm run server
```

服务启动后访问 `http://localhost:3000` 即可使用。

### 仅前端开发

```bash
npm run serve
```

## API 使用

### 生成头像

```
GET /api?seed=<email|md5>
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `seed` | string | 是 | email 地址或 MD5 哈希值 |
| `size` | number | 否 | 头像尺寸（默认 380） |

**响应：**

- Content-Type: `image/svg+xml` 或 `image/png`
- 如果 Gravatar 有头像，返回 PNG 图片（带 `X-Source: gravatar` 头）
- 如果 Gravatar 无头像，返回 SVG 图片（带 `X-Source: generated` 头）

**示例：**

```bash
# 通过 email 获取
curl "http://localhost:3000/api?seed=user@example.com"

# 通过 MD5 获取
curl "http://localhost:3000/api?seed=d41d8cd98f00b204e9800998ecf8427e"

# 指定尺寸
curl "http://localhost:3000/api?seed=user@example.com&size=200"
```

### 健康检查

```
GET /api/health
```

## 配置说明

编辑 `config.json` 文件进行配置：

```json
{
  "server": {
    "port": 3000
  },
  "gravatar": {
    "mirrorUrl": "https://www.gravatar.cn/avatar/%s",
    "defaultSize": 200
  },
  "avatar": {
    "defaultSize": 380,
    "fallbackToGenerated": true
  },
  "cache": {
    "maxAge": 86400
  }
}
```

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `server.port` | 服务端口 | 3000 |
| `gravatar.mirrorUrl` | Gravatar 镜像 URL，`%s` 为 MD5 占位符 | `https://www.gravatar.cn/avatar/%s` |
| `gravatar.defaultSize` | Gravatar 默认尺寸 | 200 |
| `avatar.defaultSize` | 生成头像默认尺寸 | 380 |
| `avatar.fallbackToGenerated` | Gravatar 失败时是否回退到生成头像 | true |
| `cache.maxAge` | 缓存时间（秒） | 86400 |

## 定制

### 图层管理

图层指 `Base(头部)` 、 `Hair(头发)` ... 等;

头像由不同的图层构成，图层定义于 `src/views/AvatarCreator/config/data.json` 的 `layerList` 数组。

### 素材管理

素材原始文件位于 `src/views/AvatarCreator/resource` 目录下，以图层命名分类到各自的文件夹。

素材文件以 `.svg` 形式存储，需要使用变量的颜色用 `{{color[N]}}` 标记：

```xml
<path d="..." fill="{{color[0]}}" stroke="black" />
```

## 部署

### 生产环境

```bash
# 构建前端
npm run build

# 启动服务（生产模式）
NODE_ENV=production node server.js
```

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "server.js"]
```

## 开源许可

本项目源代码采用 [GNU LESSER GENERAL PUBLIC LICENSE](https://www.gnu.org/licenses/lgpl-3.0.html) 许可证。

## 支持与捐赠

如果你欣赏这个项目，欢迎通过 [GitHub Sponsors](https://github.com/sponsors/CarmJos) 支持我！

感谢 JetBrains 提供的开源许可证支持。

[![](https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.svg)](https://www.jetbrains.com/?from=https://github.com/CarmJos/avatar-generator)
