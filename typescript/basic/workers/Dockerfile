FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy source files
COPY index.ts ./
COPY workers/ ./workers/
COPY services/ ./services/
COPY database/ ./database/
COPY scripts/ ./scripts/
COPY tsconfig.json ./
COPY run.sh ./

# Build TypeScript
RUN yarn build

# Make run.sh executable
RUN chmod +x run.sh

# Set default environment variables
ENV CONDUCTOR_AUTH_KEY=""
ENV CONDUCTOR_AUTH_SECRET=""
ENV CONDUCTOR_SERVER_URL=""

# Use the run.sh script as entrypoint
ENTRYPOINT ["./run.sh"]
# Pass environment variables as default CMD arguments
CMD ["${CONDUCTOR_AUTH_KEY}", "${CONDUCTOR_AUTH_SECRET}", "${CONDUCTOR_SERVER_URL}"] 