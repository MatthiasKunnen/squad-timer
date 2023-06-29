// Build nginx.conf
// Why? because nginx will perform best with a static config

import * as fs from 'fs';
import * as path from 'path';

import {ArgumentParser} from 'argparse';

const parser = new ArgumentParser({
    addHelp: true,
    description: 'Generate nginx.conf',
});

parser.addArgument('--configuration', {
    required: true,
    help: 'The configuration (local, review, production, ...)',
});

const fileMapping = new Map<string, {headers: Record<string, string>}>([
    ['3rdpartylicenses.txt', {headers: {'Cache-Control': 'public, max-age=86400'}}],
    ['browserconfig.xml', {headers: {'Cache-Control': 'public, max-age=86400'}}],
    ['favicon.ico', {headers: {'Cache-Control': 'public, max-age=86400'}}],
    ['index.html', {
        headers: {
            'Cache-Control': 'no-store',
            'Referrer-Policy': 'same-origin',
            'Strict-Transport-Security': 'max-age=63072000',
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block',
        },
    }],
    ['ngsw-worker.js', {headers: {'Cache-Control': 'no-store'}}],
    ['ngsw.json', {headers: {'Cache-Control': 'no-store'}}],
    ['safety-worker.js', {headers: {'Cache-Control': 'no-store'}}],
    ['site.webmanifest', {headers: {'Cache-Control': 'public, max-age=86400'}}],
    ['worker-basic.min.js', {headers: {'Cache-Control': 'no-store'}}],
]);

const files = fs.readdirSync(path.join(__dirname, '..', 'dist', 'public'));
const immutableFilesRegex = /\.\w{16}\.(css|js)/u;

for (const file of files) {
    if (immutableFilesRegex.test(file)) {
        fileMapping.set(file, {
            headers: {
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    }
}

// language=Nginx Configuration
process.stdout.write(`
user  nginx;
worker_processes  auto;

error_log  /dev/stderr notice;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    gzip on;
    gzip_comp_level 6;
    gzip_min_length 512;
    gzip_proxied any;
    gzip_types
        application/json
        application/manifest+json
        image/svg+xml
        text/css
        text/javascript
        text/plain;

    log_format main
        'access: [$time_local] ip=$remote_addr r="$request" '
        's=$status b=$body_bytes_sent ref="$http_referer" ua="$http_user_agent" '
        'rt=$request_time rl=$request_length '
        'rid=$request_id';
    access_log /dev/stdout main;

    include mime.types;
    default_type application/octet-stream;
    types {
        # Amend the mime.types
        application/manifest+json webmanifest;
        # application/javascript is obsolete, see https://www.rfc-editor.org/rfc/rfc9239. This has
        # not yet been updated by nginx, see https://trac.nginx.org/nginx/ticket/1407.
        text/javascript js;
    }

    sendfile on;
    server_tokens off;

    server {
        listen 80;
        listen [::]:80;
        server_name _;
        client_max_body_size 1M;

        root /usr/share/nginx/html;

        index index.html;

        location / {
            # Serve file if it exists, index.html otherwise
            try_files $uri /index.html;
        }

        location /assets {
            add_header Cache-Control "public, max-age=604800";
        }

        location = /readyz {
            default_type text/plain;
            return 200 'ready';
        }
${
        Array.from(fileMapping.entries(), ([file, config]) => {
            // language=Nginx Configuration
            return `
        location = /${file} {
${
                Object.entries(config.headers).map(([headerName, headerValue]) => {
                    return `            add_header ${headerName} "${headerValue}";`;
                }).join('\n')}
        }`;
        }).join('\n')}
    }
}
`);
