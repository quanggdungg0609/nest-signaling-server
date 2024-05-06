FROM node:22-bookworm-slim

WORKDIR /usr/src/app

COPY package*.json ./
COPY . .
RUN rm -rf node_modules
RUN apt-get update
RUN apt-get install ffmpeg -y
RUN apt-get install  procps -y

RUN npm install


EXPOSE 3000 3030

CMD ["npm", "run", "start:dev"]