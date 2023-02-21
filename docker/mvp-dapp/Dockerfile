FROM node:lts-hydrogen

WORKDIR /home/app
COPY . /home/app

RUN npx lerna bootstrap
RUN npx lerna run build

WORKDIR /home/app/packages/samples/mvp-dapp

CMD [ "node", "./dist/main.js" ]
