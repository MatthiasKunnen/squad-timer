# Dev proxy
This dockerfile proxies both the website and api docker images in the same way that the production and development environment do to enable same-origin communication. It is used to test the dockerfiles locally without needing Kubernetes.

Effects:
```
/api/$1 -> API image with url /$1
/$1     -> website image with url /$1
e.g. /api/hello -> API /hello
e.g. /foo/bar -> website /foo/bar
```

## Usage
While the three docker container can be started seperately, it's more convenient to use the [`docker-compose.yaml`](../docker-compose.yaml) file.

1. Build the website, `yarn workspace website run build:production`
1. Run `docker-compose up --build`
1. Go to <http://localhost:8080>
