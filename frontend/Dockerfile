FROM node:20-alpine

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

EXPOSE 5173

CMD sh -c "\
  [ -f /app/src/assets/login-bg.png ] && mv /app/src/assets/login-bg.png /app/src/assets/Login-bg.png; \
  [ -f /app/src/components/searchBar.jsx ] && mv /app/src/components/searchBar.jsx /app/src/components/searchbar.jsx; \
  npm run dev"

