# Nightfall VPS Deployment

## Does It Need A Database?

Not for the current version.

Nightfall currently stores rooms, players, roles, timers, and votes in server memory. That is enough for one VPS running one Node process.

What that means:

- Server restart = all rooms are lost.
- VPS reboot = all rooms are lost.
- Running multiple Node processes = rooms will split between processes and break unless you add shared state.

Recommended later:

- Redis for live room/session/timer state.
- Postgres only if you want accounts, match history, stats, moderation logs, saved decks, or payments.

## Simple Single-VPS Setup

These commands assume Ubuntu 22.04/24.04, Node 20+, and a repo path like `/var/www/nightfall`.

```bash
sudo apt update
sudo apt install -y git nginx

# Install Node with nvm, or use your host's Node 20+ package.
node -v
npm -v

sudo mkdir -p /var/www
sudo chown -R "$USER":"$USER" /var/www
cd /var/www
git clone <your-repo-url> nightfall
cd nightfall

npm install
npm run client:install
npm run build
npm run test:engine
```

Start it with PM2:

```bash
sudo npm install -g pm2
PORT=3001 pm2 start server/index.js --name nightfall
pm2 save
pm2 startup
```

## Nginx Reverse Proxy

Create `/etc/nginx/sites-available/nightfall`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/nightfall /etc/nginx/sites-enabled/nightfall
sudo nginx -t
sudo systemctl reload nginx
```

Add HTTPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Updating

```bash
cd /var/www/nightfall
git pull
npm install
npm run client:install
npm run build
npm run test:engine
pm2 restart nightfall
```

## Notes

- The client now connects to Socket.io on the same domain in production.
- For local Vite development, it still connects to `http://localhost:3001`.
- For a split frontend/backend deployment, build the client with `VITE_SOCKET_URL=https://api.your-domain.com`.
