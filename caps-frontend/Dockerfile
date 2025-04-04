# Use the official Node.js image as the base image
FROM node:16

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Install serve globally
RUN npm install -g serve

# Copy the rest of the frontend files into the container
COPY . .

# Expose port 4173 for the frontend
EXPOSE 4173

# Build the frontend
RUN npm run build

# Serve the build folder
CMD ["serve", "-s", "dist", "-l", "4173"]
