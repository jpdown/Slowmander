# Slowmander

Discord bot written in TypeScript  
![](https://cdn.discordapp.com/attachments/745757285233590392/779904846014316544/4.png)

## Deploying

Using `docker`:
```
docker run -d \
    --name=slowmander \
    --restart=unless-stopped \
    -v /path/to/data:/data \
    ghcr.io/jpdown/slowmander:main
```

Using `docker-compose`:
```yaml
version: "3"
services:
  slowmander:
    image: ghcr.io/jpdown/slowmander:main
    restart: unless-stopped
    volumes:
      - "/path/to/data:/data"
```

The bot token must be put into the `credentials.json` file generated on launch.
