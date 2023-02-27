#!bin/bash

ORG="${DOCKER_ORG:-painterpuppets}"
IMAGE="${MVP_DAPP_IMAGE:-kuai-mvp-dapp}"
PORT="${MVP_DAPP_PORT:-80}"

docker pull $ORG/$IMAGE:latest
docker stop $(docker ps -q --filter ancestor=$ORG/$IMAGE)
docker system prune -f
docker run --network host -e PORT=$PORT -e HOST=0.0.0.0 -d --restart=always $ORG/$IMAGE
