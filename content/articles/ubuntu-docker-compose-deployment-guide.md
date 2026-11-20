# Ubuntu 使用 Docker Compose 部署网站：从安装 Docker 到运行 Nginx

本文以 Ubuntu VPS 为例，使用 Docker Compose 部署 Nginx 静态网站。内容涵盖 Docker 安装、Compose 配置、网页文件、容器启动和运行验证，并包含 Bash、YAML、HTML、JavaScript、JSON、Python、SQL、CSS 等代码块，便于检查 OwenFX 的代码高亮效果。

## 阅读前准备

- 一台可以正常联网的 Ubuntu 服务器。
- 一个具有 sudo 权限的用户。
- 能够通过 SSH 登录服务器。
- 示例使用 8080 端口，请确认云平台防火墙允许该端口。

# 一、更新 Ubuntu 系统

## 1. 更新软件包索引


```bash
sudo apt update
```

## 2. 安装系统更新


```bash
sudo apt upgrade -y
```

# 二、安装 Docker Engine

## 1. 安装必要依赖


```bash
sudo apt install -y ca-certificates curl
```

## 2. 添加 Docker 官方 GPG 密钥


```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

## 3. 添加 Docker 软件源


```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
```

## 4. 安装 Docker Engine 和 Compose 插件


```bash
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
```

## 5. 验证安装


```bash
docker --version
docker compose version
sudo systemctl is-active docker
```

如果 Docker 服务尚未运行，可以启用并启动：


```bash
sudo systemctl enable --now docker
```

# 三、创建网站项目

## 1. 创建项目目录


```bash
mkdir -p ~/docker-demo/html
cd ~/docker-demo
```

## 2. 创建首页 HTML

新建 `html/index.html`，写入以下网页内容：


```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OwenFX Docker Demo</title>
</head>
<body>
  <main>
    <h1>Hello, OwenFX!</h1>
    <p>Docker Compose 网站部署测试成功。</p>
  </main>
</body>
</html>
```

使用终端编辑器创建文件：


```bash
nano html/index.html
```

# 四、编写 Docker Compose 配置

## 1. 创建 compose.yaml

在项目根目录创建 `compose.yaml`：


```yaml
services:
  nginx:
    image: nginx:stable-alpine
    container_name: demo-nginx
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html:ro
```

配置说明：

- `image`：使用 Nginx 官方镜像。
- `restart`：容器退出或服务器重启后自动尝试启动。
- `ports`：将服务器 8080 端口映射到容器 80 端口。
- `volumes`：只读挂载本地网页目录，避免容器修改源文件。

## 2. 检查 Compose 配置


```bash
docker compose config
```

# 五、启动并验证网站

## 1. 启动容器


```bash
docker compose up -d
```

## 2. 查看运行状态


```bash
docker compose ps
docker compose logs --tail=50 nginx
```

## 3. 在服务器本机测试


```bash
curl -I http://127.0.0.1:8080
```

如果返回 HTTP 200，说明 Nginx 已能正常提供网页内容。随后在浏览器访问 `http://服务器公网IP:8080`。如果无法访问，检查云平台防火墙、安全组、Ubuntu 防火墙规则和容器端口映射，不要为了测试而关闭整台服务器的防火墙。

# 六、JavaScript 代码高亮测试

下面演示 HTTP 请求、状态检查和异常处理：


```javascript
async function checkWebsite(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();
    console.log("页面获取成功：", html.length, "字符");
  } catch (error) {
    console.error("请求失败：", error.message);
  }
}

checkWebsite("https://example.com");
```

# 七、JSON 配置文件测试


```json
{
  "project": "OwenFX",
  "service": "nginx",
  "environment": "production",
  "port": 8080,
  "features": {
    "docker": true,
    "compose": true,
    "static_site": true
  }
}
```

# 八、Python 代码测试


```python
import platform
import socket

def get_system_info():
    return {
        "system": platform.system(),
        "release": platform.release(),
        "architecture": platform.machine(),
        "hostname": socket.gethostname(),
    }

if __name__ == "__main__":
    for key, value in get_system_info().items():
        print(f"{key}: {value}")
```

# 九、SQL 代码测试

以下 SQL 仅用于展示语法高亮，不需要在本教程的 Docker 服务器上执行：


```sql
CREATE TABLE deployment_logs (
    id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
 );

INSERT INTO deployment_logs (service_name, status)
VALUES ('nginx', 'running');

SELECT id, service_name, status, created_at
FROM deployment_logs
ORDER BY created_at DESC;
```

# 十、CSS 代码测试


```css
:root {
  --background: #0d1117;
  --foreground: #e6edf3;
  --accent: #a78bfa;
}

body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
  font-family: system-ui, sans-serif;
}

h1 {
  color: var(--accent);
  transition: color 0.2s ease;
}

h1:hover {
  color: #60a5fa;
}
```

# 十一、常用容器管理命令

## 1. 停止网站


```bash
docker compose stop
```

## 2. 重新启动网站


```bash
docker compose start
```

## 3. 更新镜像并重建容器


```bash
docker compose pull
docker compose up -d
```

## 4. 移除示例容器

确认不再需要该示例服务后执行：


```bash
docker compose down
```

该命令会移除本项目创建的容器和网络，不会删除 `html` 网站源文件。

# 总结

至此，基于 Ubuntu、Docker Engine、Docker Compose 和 Nginx 的静态网站示例就部署完成了。实际生产环境还应配置域名、HTTPS 证书、反向代理和定期备份，并根据业务需求限制开放端口。本文包含多种常见语言代码块，可用于检查文章语法着色、复制按钮、长代码滚动和移动端布局。
