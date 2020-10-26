### 安装nginx,node,yarn,pm2,dependence,start app

yum update
yum install -y node nginx
npm -g install yarn
npm -g install pm2
yarn
pm2 start index.js

pm2 logs -f index

### 配置nginx 启动，重启
vi /etc/nginx/conf.d/default.conf
```
server {
    listen  7777;
    # server_name 127.0.0.1;
    root   /opt/projects/agent-payment/app/www; # php目录

    index index.html;

    # 最长匹配

    location / {
    try_files $uri $uri/ /index.html;
    }
    location ~ .*\.(js|css) {
        add_header Cache-Control no-cache; # 每次都协商缓存，请求服务器
        # expires      3d; #上线时设置为缓存
    }

    location ~ .*\.(ico|jpg|jpeg|gif|png|swf|flv) {
        expires     7d;
    }

    location /api {
        proxy_pass http://127.0.0.1:3200;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Host              $http_host;
        proxy_set_header   X-Real-IP         $remote_addr;
    }
}
```

nginx
nginx -t
nginx -s reload
