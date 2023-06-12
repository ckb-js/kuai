FROM node:lts-hydrogen

WORKDIR /home/app
COPY . /home/app

RUN npm i
RUN npm run build

CMD npm run start:prod --scope=kuai-mvp-dapp
