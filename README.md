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
- npm

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/CarmJos/avatar-generator.git
cd avatar-generator

# 安装依赖
npm install
```

### 开发模式

同时启动前端开发服务器和后端 API 服务器：

```bash
npm run dev
```

- 前端页面：`http://localhost:8059`
- API 服务：`http://localhost:8059`

### 生产模式

构建前端并启动一体化服务：

```bash
npm run start
```

访问 `http://localhost:8059` 即可使用前端页面和 API。

### 仅后端 API

```bash
npm run server
```

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
| `gravatar` | boolean | 否 | 是否优先尝试 Gravatar（默认 `false`） |

**响应：**

- Content-Type: `image/svg+xml` 或 `image/png`
- 当 `gravatar=true` 且 Gravatar 有头像时，返回 PNG 图片（带 `X-Source: gravatar` 头）
- 其他情况返回 SVG 图片（带 `X-Source: generated` 头）

**示例：**

```bash
# 直接生成（默认不请求 Gravatar）
curl "http://localhost:8059/api?seed=user@example.com"

# 通过 MD5 获取
curl "http://localhost:8059/api?seed=d41d8cd98f00b204e9800998ecf8427e"

# 指定尺寸
curl "http://localhost:8059/api?seed=user@example.com&size=200"

# 启用 Gravatar 优先
curl "http://localhost:8059/api?seed=user@example.com&gravatar=true"
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
    "port": 8059
  },
  "gravatar": {
    "mirrorUrl": "https://www.gravatar.cn/avatar/%s"
  },
  "avatar": {
    "defaultSize": 380
  },
  "cache": {
    "maxAge": 86400
  }
}
```

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `server.port` | API 服务端口 | 8059 |
| `gravatar.mirrorUrl` | Gravatar 镜像 URL，`%s` 为 MD5 占位符 | `https://www.gravatar.cn/avatar/%s` |
| `avatar.defaultSize` | 生成头像默认尺寸 | 380 |
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
# 构建前端并启动服务
npm run start

# 或者分步执行
npm run build
NODE_ENV=production node server.js
```

生产模式下，访问 `http://localhost:8059` 会直接提供构建后的前端页面。

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8059
ENV NODE_ENV=production
CMD ["node", "server.js"]
```

## 开源许可

本项目源代码采用 [GNU LESSER GENERAL PUBLIC LICENSE](https://www.gnu.org/licenses/lgpl-3.0.html) 许可证。

## 支持与捐赠

如果你欣赏这个项目，欢迎通过 [GitHub Sponsors](https://github.com/sponsors/CarmJos) 支持我！

感谢 JetBrains 提供的开源许可证支持。

[![](https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.svg)](https://www.jetbrains.com/?from=https://github.com/CarmJos/avatar-generator)
