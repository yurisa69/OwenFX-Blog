# Uptime Kuma 部署教程：用 Docker Compose 搭建自托管监控面板

如果你同时维护博客、API、VPS 或其他自托管服务，最麻烦的往往不是部署，而是服务出现故障时不能第一时间发现。**Uptime Kuma** 是一个开源、自托管的服务监控工具，可以把多个网站和服务的运行状态集中到一个面板中。

它支持 HTTP(s)、TCP 端口、Ping、DNS、WebSocket、Docker 容器等监控方式，也提供状态页面和多种通知渠道。本文以 Ubuntu VPS 为例，使用官方 Docker 镜像和 Docker Compose 完成部署，并配置 Nginx 反向代理。

> 本文使用 Uptime Kuma 官方 v2 镜像标签 `louislam/uptime-kuma:2`。项目的镜像标签、升级要求和配置可能继续变化，正式操作前请以官方文档为准。

## 1. 项目与部署方案

Uptime Kuma 的核心用途是持续检查服务是否可用，并记录响应情况。常见使用场景包括：

- 监控个人博客、官网和 API 是否可以正常访问。
- 检查 VPS 的 SSH、面板或其他 TCP 端口。
- 监控 Docker 容器状态。
- 查看域名解析和 SSL 证书信息。
- 创建公开状态页面，让访客了解服务运行情况。
- 通过 Telegram、Discord、邮件等渠道接收异常通知。

项目地址：[Uptime Kuma GitHub](https://github.com/louislam/uptime-kuma)

官方安装文档：[How to Install](https://github.com/louislam/uptime-kuma/wiki/🔧-How-to-Install)

### 本文部署结构

| 组件 | 用途 |
| --- | --- |
| Ubuntu VPS | 运行服务的 Linux 主机 |
| Docker Engine | 运行 Uptime Kuma 容器 |
| Docker Compose | 管理容器配置和生命周期 |
| Nginx | 接收 HTTPS 请求并转发到本机服务 |
| 本地数据目录 | 持久化保存监控配置和 SQLite 数据 |

本文假设你已经拥有一台 Ubuntu 服务器、一个解析到服务器的域名，以及可用的 Docker 环境。

## 2. 部署前检查

先通过 SSH 登录服务器：

```bash
ssh root@YOUR_SERVER_IP
```

检查系统版本：

```bash
cat /etc/os-release
```

检查 Docker 和 Compose 插件：

```bash
docker --version
docker compose version
```

如果 Docker 尚未安装，请按照 Docker 官方 Ubuntu 安装文档操作：

[Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)

不要直接运行来源不明的一键安装脚本。安装完成后，再确认当前账户可以正常执行 Docker 命令。

## 3. 创建项目目录

建议把服务文件集中放在 `/opt/uptime-kuma`，将数据单独保存在该目录下的 `data` 文件夹。

```bash
mkdir -p /opt/uptime-kuma/data
cd /opt/uptime-kuma
```

本教程使用本地目录挂载：

```text
/opt/uptime-kuma/data  →  /app/data
```

**重要：** Uptime Kuma 使用 SQLite 保存数据，数据目录所在的文件系统必须支持 POSIX 文件锁。官方明确提醒不要将数据目录放在 NFS 等可能存在文件锁问题的网络文件系统上。建议使用 VPS 本地磁盘或 Docker 本地卷。

## 4. 编写 Docker Compose 配置

在项目目录中创建 `compose.yaml`：

```bash
nano compose.yaml
```

写入以下内容：

```yaml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:2
    container_name: uptime-kuma
    restart: unless-stopped
    ports:
      - "127.0.0.1:3001:3001"
    volumes:
      - ./data:/app/data
```

配置说明：

| 配置 | 说明 |
| --- | --- |
| `image` | 使用 Uptime Kuma 官方 v2 镜像 |
| `container_name` | 将容器名称固定为 `uptime-kuma` |
| `restart` | Docker 服务恢复后自动启动容器 |
| `127.0.0.1:3001:3001` | 只允许服务器本机访问宿主机 3001 端口 |
| `./data:/app/data` | 将监控数据保存在项目目录中 |

这里将端口绑定到 `127.0.0.1`，是为了后续通过同一台服务器上的 Nginx 提供 HTTPS 访问，避免把管理面板的 3001 端口直接暴露到公网。

如果你暂时不使用反向代理，而是希望通过 `http://服务器IP:3001` 直接访问，可以将端口映射改成：

```yaml
ports:
  - "3001:3001"
```

这种方式会监听服务器的外部网络接口。使用前应确认云平台安全组和系统防火墙规则，不要在没有必要时向公网开放管理端口。

## 5. 启动并检查容器

确认 `compose.yaml` 保存无误后，启动服务：

```bash
docker compose up -d
```

查看容器状态：

```bash
docker compose ps
```

查看最近的启动日志：

```bash
docker compose logs --tail=100 uptime-kuma
```

如果容器状态正常，并且没有持续报错，可以在服务器本机检查 HTTP 响应：

```bash
curl -I http://127.0.0.1:3001
```

首次打开面板后，按照页面提示创建管理员账户。不要使用容易猜测的密码，也不要把管理账户密码写入公开文章、脚本或 Git 仓库。

## 6. 配置 Nginx 反向代理

如果服务器已经安装 Nginx，可以使用独立子域名访问 Uptime Kuma。例如：

| 配置项 | 示例值 |
| --- | --- |
| 域名 | `status.example.com` |
| 本机服务地址 | `127.0.0.1:3001` |
| 对外访问 | `https://status.example.com` |

先在 DNS 服务商处添加 A 记录，将 `status.example.com` 指向 VPS 公网 IPv4 地址。确认域名解析正确，并准备好该域名的 HTTPS 证书。

创建 Nginx 站点配置：

```bash
nano /etc/nginx/sites-available/uptime-kuma
```

写入配置。证书路径需要替换为服务器上真实存在的证书文件：

```nginx
server {
    listen 80;
    server_name status.example.com;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name status.example.com;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

启用站点：

```bash
ln -s /etc/nginx/sites-available/uptime-kuma /etc/nginx/sites-enabled/uptime-kuma
```

检查配置语法：

```bash
nginx -t
```

只有在检查结果显示配置成功后，才重新加载 Nginx：

```bash
systemctl reload nginx
```

Uptime Kuma 使用 WebSocket，因此反向代理不能只转发普通 HTTP 请求，还需要正确传递 `Upgrade` 和 `Connection` 请求头。否则可能出现页面可以打开，但实时连接异常的情况。

另外，Uptime Kuma 官方文档说明它不支持直接部署在 `/uptimekuma` 这样的子目录中。建议使用独立子域名，而不是尝试通过路径前缀访问。

## 7. 添加监控项目

登录面板后，点击添加监控项目，按服务类型选择监控方式。

常用监控类型如下：

| 监控类型 | 适用对象 | 示例 |
| --- | --- | --- |
| HTTP(s) | 网站和 Web API | `https://example.com` |
| TCP Port | SSH 或服务端口 | `服务器IP:22` |
| Ping | 服务器或网络设备 | `203.0.113.10` |
| DNS | 域名解析 | `example.com` |
| WebSocket | 实时通信服务 | WebSocket 服务地址 |
| Docker Container | Docker 容器 | 指定容器名称 |

例如，添加一个网站监控：

1. 选择 `HTTP(s)` 监控类型。
2. 填写监控名称，例如 `OwenFX Blog`。
3. 填写网站地址，例如 `https://example.com`。
4. 设置心跳间隔和重试次数。
5. 保存后观察监控状态和响应时间。

建议先使用一个自己可以正常访问的网站进行测试，再逐步添加其他服务。

### 一套适合个人服务器的监控清单

- [ ] 主站 HTTPS 地址
- [ ] API 服务地址
- [ ] VPS SSH 端口
- [ ] 反向代理入口
- [ ] Docker 核心容器
- [ ] 重要域名的 DNS 解析
- [ ] 需要关注的 SSL 证书

也可以按业务重要程度分组管理：

- 网站服务
  - 博客首页
  - 后台管理入口
  - API 接口
- 服务器服务
  - SSH 端口
  - Docker 容器
  - 反向代理
- 域名与证书
  - DNS 解析
  - HTTPS 证书

## 8. 配置故障通知

只在面板里看到服务异常还不够，建议配置至少一种日常会查看的通知渠道。

Uptime Kuma 支持多种通知服务，例如 Telegram、Discord、邮件 SMTP 等。具体可用渠道和配置字段以当前版本的通知设置页面为准。

配置时建议：

1. 进入通知设置，添加通知渠道。
2. 按照对应服务的要求填写必要参数。
3. 使用面板提供的测试功能确认通知能够送达。
4. 将通知渠道关联到需要重点关注的监控项目。

不要把 Bot Token、SMTP 密码或其他凭据提交到 GitHub，也不要将带有真实密钥的配置截图公开。

## 9. 日常维护与版本更新

Docker Compose 可以统一管理容器，常用命令如下：

查看容器状态：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f --tail=100 uptime-kuma
```

重启服务：

```bash
docker compose restart
```

停止服务：

```bash
docker compose stop
```

拉取镜像并更新容器：

```bash
docker compose pull
docker compose up -d
```

更新前建议先备份数据，并查看官方升级说明。不要为了更新镜像而删除 `data` 目录，也不要随意执行带有 `-v` 参数的清理命令。

官方更新说明：[How to Update](https://github.com/louislam/uptime-kuma/wiki/%F0%9F%86%99-How-to-Update)

## 10. 数据备份与恢复

Uptime Kuma 的 `/app/data` 目录保存了重要的应用数据。本文使用本地目录挂载，因此宿主机上的数据位置是：

```text
/opt/uptime-kuma/data
```

如果采用停机归档方式备份，可以先停止容器，再打包数据目录：

```bash
cd /opt/uptime-kuma
docker compose stop
tar -czf uptime-kuma-data-backup.tar.gz data
docker compose start
```

这会造成一段短暂的监控中断。备份文件应复制到另一台服务器或可靠的远程存储位置，不要只保存在同一块 VPS 硬盘上。

恢复前应先停止服务，并确认备份文件来源可靠、目录内容完整。不要直接覆盖正在运行的数据库文件。

**特别提醒：** `docker compose down -v` 可能删除 Compose 管理的数据卷。执行任何清理命令前，必须确认实际的数据挂载方式和备份状态。

## 11. 常见问题排查

### 11.1 浏览器无法访问面板

先检查容器是否正常运行：

```bash
docker compose ps
```

再检查本机端口监听：

```bash
ss -lntp | grep 3001
```

常见原因包括容器未启动、端口映射错误、Nginx 配置异常或防火墙规则不匹配。

注意：如果使用了本文的 `127.0.0.1:3001:3001` 绑定方式，公网 IP 直接访问 3001 端口本来就不应该成功。应当通过配置好的 HTTPS 域名访问。

### 11.2 Nginx 页面能打开，但实时状态不更新

检查反向代理是否包含 WebSocket 请求头：

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

修改后先执行 `nginx -t`，确认语法正确再重新加载配置。

### 11.3 容器反复重启

查看容器最近的日志：

```bash
docker compose logs --tail=200 uptime-kuma
```

重点检查镜像拉取、数据目录权限、磁盘空间和数据库相关错误。不要在没有确认原因时删除数据目录或重新初始化数据库。

### 11.4 监控显示 DOWN，但服务实际可以访问

监控容器与目标服务之间的网络路径可能和你的电脑不同。需要分别检查 DNS 解析、Docker 网络、目标服务防火墙和 IPv6 连通性。

可以先从 Uptime Kuma 所在主机测试目标地址：

```bash
curl -I https://example.com
```

如果主机本身无法访问目标地址，应先解决网络或 DNS 问题，而不是直接认定为 Uptime Kuma 故障。

## 12. 部署验收清单

部署完成后，建议逐项确认：

- [ ] Docker 容器状态正常。
- [ ] 管理员账户创建成功。
- [ ] 可以通过 HTTPS 域名打开面板。
- [ ] HTTP 监控任务能够正常工作。
- [ ] WebSocket 实时连接正常。
- [ ] 通知测试能够成功送达。
- [ ] 重启容器后监控配置仍然存在。
- [ ] 已完成一次数据备份。
- [ ] 备份文件已保存到服务器以外的位置。

## 总结

Uptime Kuma 适合个人站长和自托管服务用户，用一个面板集中查看网站、API、端口和容器的运行状态。Docker Compose 负责部署和维护，本地数据目录负责持久化，Nginx 则可以提供 HTTPS 入口。

部署时最需要注意的并不是命令数量，而是数据目录、网络暴露范围和 WebSocket 反向代理配置。先完成基础部署，再逐步添加监控与通知，通常比一次性堆叠复杂配置更容易维护。

### 官方资料

- [Uptime Kuma GitHub 仓库](https://github.com/louislam/uptime-kuma)
- [官方安装文档](https://github.com/louislam/uptime-kuma/wiki/🔧-How-to-Install)
- [官方反向代理文档](https://github.com/louislam/uptime-kuma/wiki/Reverse-Proxy)
- [官方更新文档](https://github.com/louislam/uptime-kuma/wiki/🆙-How-to-Update)
- [Docker Engine 安装文档](https://docs.docker.com/engine/install/ubuntu/)

[^1]: Uptime Kuma 官方安装文档说明，`/app/data` 需要映射到支持 POSIX 文件锁的本地目录或卷，避免 SQLite 数据库损坏。
[^2]: 官方反向代理文档要求转发 WebSocket 所需的 `Upgrade` 与 `Connection` 请求头，并指出不支持直接部署在子目录下。
