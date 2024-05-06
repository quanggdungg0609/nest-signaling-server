FROM node:22-bookworm-slim

WORKDIR /usr/src/nest-app

COPY package*.json ./

RUN apt-get update
RUN apt-get install ffmpeg -y

RUN npm install

COPY . .

EXPOSE 3000 3030

CMD ["npm", "run", "start:dev"]