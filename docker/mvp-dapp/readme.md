# Configure webhooks on the server

1. Copy `hooks.json` / `redeploy.sh` / `docker-compose.yml` to the server

2. Run `webhook -hooks ./hooks.json -verbose -port 8000 &`
