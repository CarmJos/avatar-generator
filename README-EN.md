<div align=center>

# Avatar Generator

[![version](https://img.shields.io/github/package-json/v/CarmJos/avatar-generator)](https://github.com/CarmJos/avatar-generator)
[![License](https://img.shields.io/github/license/CarmJos/avatar-generator)](https://www.gnu.org/licenses/lgpl-3.0.html)
[![workflow](https://github.com/CarmJos/avatar-generator/actions/workflows/node.js.yml/badge.svg)](https://github.com/CarmJos/avatar-generator/actions/workflows/node.js.yml)
![CodeSize](https://img.shields.io/github/languages/code-size/CarmJos/avatar-generator)

README LANGUAGES [ [English](README-EN.md) | [**中文**](README.md)  ]

</div>

# Avatar Generator

_**"Seed-based random avatar generation with Gravatar integration"**_

An avatar generator with API support that generates fixed random avatars from seeds, and supports fetching user avatars from Gravatar.

## Features

- **Seed Generation**: Same seed always produces the same avatar combination
- **Gravatar Integration**: Support fetching Gravatar avatars via email or MD5
- **API Interface**: RESTful API for easy integration into other projects
- **Cache Support**: Configurable cache strategy for better performance
- **Mirror Configuration**: Custom Gravatar mirror URL support
- **Frontend Preview**: Retained frontend page for testing and preview

## Quick Start

### Requirements

- Node.js >= 14.0.0
- npm

### Installation & Running

```bash
# Clone repository
git clone https://github.com/CarmJos/avatar-generator.git
cd avatar-generator

# Install dependencies
npm install
```

### Development Mode

Start both frontend dev server and backend API server:

```bash
npm run dev
```

- Frontend page: `http://localhost:8059`
- API service: `http://localhost:8059`

### Production Mode

Build frontend and start unified service:

```bash
npm run start
```

Visit `http://localhost:8059` to use both frontend page and API.

### Backend API Only

```bash
npm run server
```

### Frontend Development Only

```bash
npm run serve
```

## API Usage

### Generate Avatar

```
GET /api?seed=<email|md5>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `seed` | string | Yes | Email address or MD5 hash |
| `size` | number | No | Avatar size (default 380) |
| `gravatar` | boolean | No | Whether to try Gravatar first (default `false`) |

**Response:**

- Content-Type: `image/svg+xml` or `image/png`
- When `gravatar=true` and Gravatar has an avatar, returns PNG image (with `X-Source: gravatar` header)
- In all other cases, returns SVG image (with `X-Source: generated` header)

**Examples:**

```bash
# Generate directly (default: do not request Gravatar)
curl "http://localhost:8059/api?seed=user@example.com"

# Get by MD5
curl "http://localhost:8059/api?seed=d41d8cd98f00b204e9800998ecf8427e"

# Specify size
curl "http://localhost:8059/api?seed=user@example.com&size=200"

# Enable Gravatar-first behavior
curl "http://localhost:8059/api?seed=user@example.com&gravatar=true"
```

### Health Check

```
GET /api/health
```

## Configuration

Edit `config.json` file for configuration:

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

| Option | Description | Default |
|--------|-------------|---------|
| `server.port` | API service port | 8059 |
| `gravatar.mirrorUrl` | Gravatar mirror URL, `%s` is MD5 placeholder | `https://www.gravatar.cn/avatar/%s` |
| `avatar.defaultSize` | Generated avatar default size | 380 |
| `cache.maxAge` | Cache duration (seconds) | 86400 |

## Customization

### Layer Management

Layers refer to `Base(head)`, `Hair(hair)`, etc.

Avatars consist of different layers defined in the `layerList` array in `src/views/AvatarCreator/config/data.json`.

### Asset Management

Asset files are located in `src/views/AvatarCreator/resource` directory, organized by layer folders.

Asset files are stored as `.svg` format, with variables marked using `{{color[N]}}`:

```xml
<path d="..." fill="{{color[0]}}" stroke="black" />
```

## Deployment

### Production

```bash
# Build frontend and start service
npm run start

# Or execute separately
npm run build
NODE_ENV=production node server.js
```

In production mode, visiting `http://localhost:8059` will directly serve the built frontend page.

### Docker Deployment

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

## Open Source License

This project's source code is licensed under the [GNU LESSER GENERAL PUBLIC LICENSE](https://www.gnu.org/licenses/lgpl-3.0.html).

## Support & Donation

If you appreciate this project, consider supporting me with a [GitHub Sponsors](https://github.com/sponsors/CarmJos)!

Thanks to JetBrains for providing open-source license support.

[![](https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.svg)](https://www.jetbrains.com/?from=https://github.com/CarmJos/avatar-generator)
