// Build nginx.conf
// Why? because nginx will perform best with a static config

import {ArgumentParser} from 'argparse';

import {Environment} from '../src/environments/environment.interface';

const parser = new ArgumentParser({
    addHelp: true,
    description: 'Generate nginx.conf',
});

parser.addArgument('--configuration', {
    required: true,
    help: 'The configuration (local, review, production, ...)',
});

const args: {
    configuration: string;
} = parser.parseKnownArgs()[0];

const environmentFile = `../src/environments/environment.${args.configuration}.ts`;
(global as any).window = {}; // window is used in the environment. Fake it
const environment: Environment = require(environmentFile).environment;

let reportUri: string | null = null;

if (environment.sentry.enabled) {
    const dsn = new URL(environment.sentry.dsn);
    const sentryProjectId = dsn.pathname.substring(1);
    const reportUriParams = new URLSearchParams({
        sentry_environment: environment.environment,
        sentry_key: dsn.username,
    });

    if (environment.release !== undefined) {
        reportUriParams.set('sentry_release', environment.release);
    }

    reportUri = `https://sentry.io/api/${sentryProjectId}/security/?${reportUriParams}`;
}

const headers = environment.production
    ? `\
            add_header Referrer-Policy "same-origin";
            add_header Strict-Transport-Security "max-age=63072000";
            add_header X-Content-Type-Options "nosniff";
            add_header X-XSS-Protection "1; mode=block";
    `.trimRight()
    : '';

process.stdout.write(`
daemon off;

events {
    use epoll;
    accept_mutex on;
}

http {
    gzip on;
    gzip_comp_level 6;
    gzip_min_length 512;
    gzip_proxied any;
    gzip_types text/css text/plain application/javascript image/svg+xml;

    server_tokens off;

    log_format l2met 'measure#nginx.service=$request_time request_id=$http_x_request_id';
    access_log <%= ENV['NGINX_ACCESS_LOG_PATH'] || 'logs/nginx/access.log' %> l2met;
    error_log <%= ENV['NGINX_ERROR_LOG_PATH'] || 'logs/nginx/error.log' %>;


    include mime.types;
    default_type application/octet-stream;
    sendfile on;

    # Must read the body in 5 seconds.
    client_body_timeout <%= ENV['NGINX_CLIENT_BODY_TIMEOUT'] || 5 %>;

    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    upstream api {
        server 127.0.0.1:5050;
    }

    server {
        listen <%= ENV["PORT"] %>;
        server_name _;
        keepalive_timeout 5;
        client_max_body_size <%= ENV['NGINX_CLIENT_MAX_BODY_SIZE'] || 1 %>M;

        root /app/dist/public;

        index index.html;

        location / {
            if ($http_x_forwarded_proto != "https") {
                return 301 https://$host$request_uri;
            }

            # If none of the other blocks match: serve file if it exists, index.html otherwise
            try_files $uri /index.html;
${headers}
            add_header Cache-Control "public, max-age=604800";
        }

        location /api {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
        }

        location = /index.html {
${headers}
            add_header Cache-Control "no-store";
        }

        location ~* ^/[^.]+\\.(js|json|webmanifest)$ {
${headers}
            add_header Cache-Control "no-cache";
        }

        location ~* \\.\\w+\\.(css|js)$ {
${headers}
            add_header Cache-Control "public, max-age=31536000, immutable";
        }
    }
}
`.trimLeft());
