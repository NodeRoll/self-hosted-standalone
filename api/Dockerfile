# Base image olarak Node.js'in resmi slim imajını kullanıyoruz
FROM node:18-slim

# Çalışma dizinini belirliyoruz
WORKDIR /app

# package.json ve package-lock.json dosyalarını kopyalayıp bağımlılıkları yüklüyoruz
COPY package*.json ./
RUN npm ci --only=production

# Uygulama kodlarını kopyalıyoruz
COPY . .

# Default port'u belirliyoruz
ENV PORT=3000

# Uygulamanın kullanacağı port'u expose ediyoruz
EXPOSE $PORT

# Uygulamayı başlatıyoruz
CMD ["npm", "start"]
