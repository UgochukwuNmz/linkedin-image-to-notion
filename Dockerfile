# Use an official Node.js image (Debian-based) that supports installing additional libraries.
FROM node:18-buster-slim

# Install dependencies required by headless Chromium.
RUN apt-get update && apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Set the working directory.
WORKDIR /usr/src/app

# Copy package files and install dependencies.
COPY package*.json ./
RUN npm install

# Copy the rest of your application code.
COPY . .

# Command to run your serverless function.
CMD ["node", "updateNotionProfileFromLinkedIn.js"]
