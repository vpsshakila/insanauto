FROM node:18
WORKDIR /app

RUN npx playwright install --with-deps chromium

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000
CMD ["npm", "start"]