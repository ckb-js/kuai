FROM node:lts-hydrogen

WORKDIR /home/app
COPY . /home/app

RUN npm i
RUN npx lerna run build
RUN npx lerna run cp-deploy-file --scope=kuai-mvp-dapp

CMD npx lerna run start:prod --scope=kuai-mvp-dapp
